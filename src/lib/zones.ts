export type ZoneCategory = "served" | "suspended" | "unserved" | "review";

export type ZoneRecord = {
  id: string;
  name: string;
  category: ZoneCategory;
  active: boolean;
  boundary: GeoJSON.Polygon | GeoJSON.MultiPolygon | null;
};

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

export function pointInPolygon(lng: number, lat: number, poly: GeoJSON.Polygon) {
  if (!poly.coordinates?.[0]) return false;
  if (!pointInRing(lng, lat, poly.coordinates[0])) return false;
  for (let h = 1; h < poly.coordinates.length; h++) {
    if (pointInRing(lng, lat, poly.coordinates[h])) return false;
  }
  return true;
}

export function resolveZone(lng: number, lat: number, zones: ZoneRecord[]): ZoneRecord | null {
  const active = zones.filter((z) => z.active && z.boundary);
  for (const z of active) {
    const b = z.boundary!;
    if (b.type === "Polygon" && pointInPolygon(lng, lat, b)) return z;
    if (b.type === "MultiPolygon" && b.coordinates.some((c) => pointInPolygon(lng, lat, { type: "Polygon", coordinates: c }))) {
      return z;
    }
  }
  return null;
}

export function zoneBlocksDelivery(zone: ZoneRecord | null) {
  if (!zone) return { blocked: true, reason: "Point hors zone configurée" as const };
  if (zone.category === "unserved") return { blocked: true, reason: "Zone non desservie" as const };
  if (zone.category === "suspended") return { blocked: true, reason: "Zone suspendue" as const };
  return { blocked: false, reason: null };
}
