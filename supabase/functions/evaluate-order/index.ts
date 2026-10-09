import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

const FORBIDDEN = /(arme|explosif|drogue|munition|acide|essence\b)/i;
const LIMITS = {
  maxWeightKg: 20,
  warnWeightKg: 12,
  maxSideCm: 80,
  maxVolumeCm3: 80 * 50 * 50,
  maxDeclaredFc: 500_000,
  warnDeclaredFc: 80_000,
};

function evaluate(input: Record<string, unknown>) {
  const reasons: string[] = [];
  const passed: string[] = [];
  const missing: string[] = [];
  const pickupLat = Number(input.pickupLat);
  const deliveryLat = Number(input.deliveryLat);
  if (!Number.isFinite(pickupLat) || !Number.isFinite(deliveryLat)) reasons.push("Coordonnées GPS invalides");
  else passed.push("Coordonnées GPS");

  if (!input.senderPhone) missing.push("Téléphone expéditeur");
  else passed.push("Expéditeur joignable");
  if (!input.recipientPhone) missing.push("Téléphone destinataire");
  else passed.push("Destinataire joignable");

  const zoneCategory = String(input.zoneCategory || "");
  if (zoneCategory === "unserved") reasons.push("Zone de destination non desservie");
  else if (zoneCategory === "suspended") reasons.push("Zone temporairement suspendue");
  else if (zoneCategory === "review") reasons.push("Zone soumise à validation particulière");
  else if (zoneCategory === "served") passed.push("Zone desservie");

  const weightKg = input.weightKg == null ? null : Number(input.weightKg);
  if (weightKg != null) {
    if (weightKg < 0) reasons.push("Poids négatif refusé");
    else if (weightKg > LIMITS.maxWeightKg) reasons.push(`Poids supérieur à la capacité moto (${LIMITS.maxWeightKg} kg)`);
    else if (weightKg > LIMITS.warnWeightKg) reasons.push("Poids élevé : vérification capacité");
    else passed.push("Poids dans les limites moto");
  } else missing.push("Poids réel");

  const dims = [input.lengthCm, input.widthCm, input.heightCm].map((d) => (d == null ? null : Number(d)));
  if (dims.some((d) => d != null && d < 0)) reasons.push("Dimensions négatives refusées");
  if (dims.every((d) => d != null)) {
    const [l, w, h] = dims as number[];
    if (Math.max(l, w, h) > LIMITS.maxSideCm) reasons.push("Dimension hors gabarit moto");
    else if (l * w * h > LIMITS.maxVolumeCm3) reasons.push("Volume hors gabarit");
    else passed.push("Dimensions acceptables");
  } else missing.push("Dimensions L×l×h");

  const declared = input.declaredValueFc == null ? null : Number(input.declaredValueFc);
  if (declared != null) {
    if (declared < 0) reasons.push("Valeur déclarée négative");
    else if (declared > LIMITS.maxDeclaredFc) reasons.push("Valeur déclarée hors couverture");
    else if (declared > LIMITS.warnDeclaredFc) reasons.push("Valeur élevée : validation couverture");
    else passed.push("Valeur déclarée dans les seuils");
  }

  const desc = String(input.packageDescription || "");
  if (FORBIDDEN.test(desc)) reasons.push("Nature du contenu interdite au transport moto");
  else if (desc.trim().length < 3) missing.push("Description du contenu");
  else passed.push("Nature déclarée admissible");

  if (input.fragile && input.packagingState && /abim|ouvert|humide|dechir/i.test(String(input.packagingState))) {
    reasons.push("Colis fragile avec emballage détérioré");
  }

  const photoCount = Number(input.photoCount || 0);
  if (photoCount < 1) missing.push("Photo principale");
  else passed.push("Photo fournie");

  if (input.groqAvailable === false) reasons.push("Analyse visuelle indisponible : vérification humaine");
  else if (input.groqConfidence != null && Number(input.groqConfidence) < 0.4) {
    reasons.push("Confiance IA insuffisante : ne pas accepter automatiquement");
  }

  const blocking = reasons.some((r) =>
    /non desservie|interdite|négatif|hors gabarit|capacité moto|invalides|hors couverture/.test(r)
  );
  const needsHuman =
    missing.length > 0 ||
    zoneCategory === "review" ||
    reasons.some((r) => /vérification|validation|IA|élevé|détérioré/.test(r));

  let level = "GREEN";
  if (blocking) level = "RED";
  else if (needsHuman || reasons.length) level = "YELLOW";

  return { level, reasons, passed, missing, assignable: level === "GREEN" };
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
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const auth = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anon, { global: { headers: { Authorization: auth } } });
  const { data: userData } = await userClient.auth.getUser();
  if (!userData.user) return json({ error: "Non authentifié" }, 401);
  const admin = createClient(supabaseUrl, service);
  const body = await req.json().catch(() => ({}));
  const orderId = body.order_id as string | undefined;
  if (!orderId) return json({ error: "order_id requis" }, 400);

  const { data: order, error } = await admin.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (error || !order) return json({ error: "Commande introuvable" }, 404);
  const { data: me } = await admin.from("users").select("role").eq("id", userData.user.id).maybeSingle();
  const staff = ["ADMIN", "GESTIONNAIRE", "DISPATCH", "SUIVI", "SUPPORT"].includes(String(me?.role || ""));
  if (order.client_id !== userData.user.id && !staff) return json({ error: "Non autorisé" }, 403);

  await admin.from("orders").update({ status: "EVALUATING" }).eq("id", orderId);

  const { data: photos } = await admin.from("parcel_photos").select("id").eq("order_id", orderId);
  const { data: zones } = await admin.from("zones").select("category, active, boundary");
  const { data: groq } = await admin.from("groq_analyses").select("confidence").eq("order_id", orderId).order("created_at", { ascending: false }).limit(1);

  let zoneCategory: string | null = null;
  const lng = Number(order.delivery_lng);
  const lat = Number(order.delivery_lat);
  for (const z of zones ?? []) {
    if (!z.active || !z.boundary) continue;
    const b = z.boundary as { type?: string; coordinates?: unknown };
    if (b.type === "Polygon" && inPoly(lng, lat, b as { coordinates: number[][][] })) {
      zoneCategory = z.category;
      break;
    }
  }

  const groqRow = groq?.[0];
  const result = evaluate({
    pickupLat: order.pickup_lat,
    pickupLng: order.pickup_lng,
    deliveryLat: order.delivery_lat,
    deliveryLng: order.delivery_lng,
    weightKg: order.weight_kg,
    lengthCm: order.length_cm,
    widthCm: order.width_cm,
    heightCm: order.height_cm,
    declaredValueFc: order.declared_value_fc,
    packageDescription: order.package_description || "",
    packagingState: order.packaging_state,
    fragile: order.fragile,
    zoneCategory,
    photoCount: photos?.length ?? 0,
    senderPhone: order.sender_phone,
    recipientPhone: order.recipient_phone,
    groqAvailable: groqRow ? true : undefined,
    groqConfidence: groqRow?.confidence ?? null,
  });

  const nextStatus =
    result.level === "RED" ? "REJECTED" : result.level === "YELLOW" ? "PENDING_VALIDATION" : "PENDING";

  await admin.from("orders").update({
    evaluation_level: result.level,
    evaluation_payload: result,
    status: nextStatus,
  }).eq("id", orderId);

  await admin.from("evaluation_logs").insert({
    order_id: orderId,
    level: result.level,
    reasons: result.reasons,
    payload: result,
  });

  if (order.recipient_phone) {
    await admin.rpc("enqueue_notification", {
      p_event_key: `eval-${orderId}-${result.level}`,
      p_phone: order.recipient_phone,
      p_body: `Vita Express : votre demande est ${result.level === "RED" ? "refusée" : result.level === "YELLOW" ? "en validation" : "reçue"}.`,
      p_order_id: orderId,
      p_channel: "whatsapp",
    });
  }

  return json({ ok: true, ...result, status: nextStatus });
});
