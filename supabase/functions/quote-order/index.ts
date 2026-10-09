import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

const DEFAULT_RULES = {
  version: "2026-10-grid-1",
  baseFc: 1500,
  perKmFc: 500,
  minFc: 2000,
  weightStepKg: 5,
  weightSurchargeFc: 300,
  volumetricEnabled: false,
  urgentSurchargeFc: 0,
  specialHandlingFc: 0,
  declaredValueRate: 0,
  trafficEnabled: false,
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pointInRing(lng: number, lat: number, ring: number[][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function inPoly(lng: number, lat: number, poly: { coordinates: number[][][] }) {
  if (!poly?.coordinates?.[0]) return false;
  if (!pointInRing(lng, lat, poly.coordinates[0])) return false;
  for (let h = 1; h < poly.coordinates.length; h++) {
    if (pointInRing(lng, lat, poly.coordinates[h])) return false;
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, service);
  const body = await req.json().catch(() => ({}));
  const pickupLat = Number(body.pickup_lat);
  const pickupLng = Number(body.pickup_lng);
  const deliveryLat = Number(body.delivery_lat);
  const deliveryLng = Number(body.delivery_lng);
  if (![pickupLat, pickupLng, deliveryLat, deliveryLng].every(Number.isFinite)) {
    return json({ error: "Coordonnées requises" }, 400);
  }

  const { data: zones } = await admin.from("zones").select("name, category, active, boundary");
  let zone: { name?: string; category?: string } | null = null;
  for (const z of zones ?? []) {
    if (!z.active || !z.boundary) continue;
    const b = z.boundary as { type?: string; coordinates?: number[][][] };
    if (b.type === "Polygon" && inPoly(deliveryLng, deliveryLat, b as { coordinates: number[][][] })) {
      zone = z;
      break;
    }
  }
  if (zone?.category === "unserved" || zone?.category === "suspended") {
    return json({ error: zone.category === "unserved" ? "Zone non desservie" : "Zone suspendue", blocked: true }, 422);
  }
  if (!zone && (zones ?? []).some((z) => z.boundary)) {
    return json({ error: "Point hors zone configurée", blocked: true }, 422);
  }

  const { data: ruleRow } = await admin.from("pricing_rules").select("*").eq("active", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const rules = { ...DEFAULT_RULES, ...(ruleRow?.rules ?? {}), version: ruleRow?.version ?? DEFAULT_RULES.version };

  let roadKm: number | null = null;
  const mapbox = Deno.env.get("MAPBOX_PUBLIC_TOKEN");
  if (mapbox) {
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${pickupLng},${pickupLat};${deliveryLng},${deliveryLat}?overview=simplified&geometries=geojson&access_token=${mapbox}`;
      const res = await fetch(url);
      const data = await res.json();
      const meters = data?.routes?.[0]?.distance;
      if (typeof meters === "number" && meters > 0) roadKm = meters / 1000;
    } catch {
      roadKm = null;
    }
  }

  const hav = haversineKm(pickupLat, pickupLng, deliveryLat, deliveryLng);
  const distanceKm = Number(((roadKm && roadKm > 0 ? roadKm : hav)).toFixed(2));
  const lines: { label: string; amount: number }[] = [];
  lines.push({ label: "Base", amount: Number(rules.baseFc) });
  lines.push({ label: `Distance ${distanceKm} km × ${rules.perKmFc} FC`, amount: Math.round(distanceKm * Number(rules.perKmFc)) });
  const weightKg = body.weight_kg != null ? Number(body.weight_kg) : 0;
  if (weightKg > Number(rules.weightStepKg)) {
    const extra = Math.ceil((weightKg - Number(rules.weightStepKg)) / Number(rules.weightStepKg)) * Number(rules.weightSurchargeFc);
    lines.push({ label: "Poids", amount: extra });
  }
  const raw = lines.reduce((s, l) => s + l.amount, 0);
  const totalFc = Math.max(Number(rules.minFc), Math.round(raw / 100) * 100);

  return json({
    version: rules.version,
    distanceKm,
    distanceSource: roadKm ? "directions" : "haversine",
    lines,
    totalFc,
    zone: zone?.name ?? null,
    trafficUsed: false,
  });
});
