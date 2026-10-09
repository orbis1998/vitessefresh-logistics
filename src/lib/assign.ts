export type DriverCandidate = {
  userId: string;
  available: boolean;
  approved?: boolean;
  vehicleOperational: boolean;
  activeMissions: number;
  maxMissions: number;
  capacityKg: number;
  parcelWeightKg: number;
};

export function rankDrivers(candidates: DriverCandidate[]) {
  return candidates
    .filter((d) => d.available && d.vehicleOperational && (d.approved ?? true))
    .filter((d) => d.activeMissions < d.maxMissions)
    .filter((d) => d.parcelWeightKg <= d.capacityKg)
    .sort((a, b) => a.activeMissions - b.activeMissions);
}

export function canAssign(orderStatus: string, evalLevel: string | null) {
  const st = orderStatus.toUpperCase();
  if (evalLevel === "RED") return { ok: false, reason: "Contrôle rouge : attribution interdite" };
  if (evalLevel === "YELLOW") return { ok: false, reason: "Contrôle jaune : validation humaine requise" };
  if (!["ACCEPTED"].includes(st)) return { ok: false, reason: "La commande n'est pas acceptée" };
  return { ok: true, reason: null };
}
