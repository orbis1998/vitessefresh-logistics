// Haversine distance in km
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Client preview — aligné sur la grille min 4 500 FC. */
export function computePriceFC(distanceKm: number, baseZonePrice = 4500): number {
  const perKm = 700;
  const minPrice = 4500;
  const raw = baseZonePrice + distanceKm * perKm;
  return Math.max(minPrice, Math.round(raw / 100) * 100);
}

export function formatFC(amount: number) {
  return `${amount.toLocaleString("fr-FR")} FC`;
}

export function estimateMinutes(distanceKm: number) {
  // ~22 km/h moyenne Kinshasa moto + embouteillage
  return Math.max(12, Math.round((distanceKm / 22) * 60));
}
