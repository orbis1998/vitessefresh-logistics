/** Column helpers for Vita Express (`delivery_*`, `total_price`). */

export function deliveryAddress(o: { delivery_address?: string | null; dropoff_address?: string | null }) {
  return o.delivery_address || o.dropoff_address || "";
}

export function deliveryLat(o: { delivery_lat?: number | null; dropoff_lat?: number | null }) {
  return Number(o.delivery_lat ?? o.dropoff_lat ?? 0);
}

export function deliveryLng(o: { delivery_lng?: number | null; dropoff_lng?: number | null }) {
  return Number(o.delivery_lng ?? o.dropoff_lng ?? 0);
}

export function orderDistance(o: { distance?: number | null; distance_km?: number | null }) {
  return Number(o.distance ?? o.distance_km ?? 0);
}

export function orderPrice(o: { total_price?: number | null; price?: number | null }) {
  return Number(o.total_price ?? o.price ?? 0);
}

export function packageLabel(o: { package_description?: string | null; package_type?: string | null }) {
  return o.package_description || o.package_type || "colis";
}

export const VITA_ACTIVE_STATUSES = [
  "PENDING",
  "SUBMITTED",
  "EVALUATING",
  "PENDING_VALIDATION",
  "ACCEPTED",
  "ASSIGNED",
  "COLLECTING",
  "PICKED_UP",
  "IN_TRANSIT",
];
