/** Vita prod stores order_status in UPPER_SNAKE. UI uses lowercase. */

export type VitaOrderStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "EVALUATING"
  | "PENDING_VALIDATION"
  | "PENDING"
  | "ACCEPTED"
  | "ASSIGNED"
  | "COLLECTING"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED"
  | "FAILED"
  | "DISPUTE"
  | "RETURN_NEEDED";

export const ACTIVE_MISSION: VitaOrderStatus[] = [
  "ACCEPTED",
  "ASSIGNED",
  "COLLECTING",
  "PICKED_UP",
  "IN_TRANSIT",
  "PENDING",
];

export const ASSIGNABLE: VitaOrderStatus[] = ["ACCEPTED"];

export function toVitaStatus(s: string): VitaOrderStatus {
  return String(s || "PENDING").toUpperCase().replace(/-/g, "_") as VitaOrderStatus;
}

export function statusLabel(s: string): string {
  const map: Record<string, string> = {
    DRAFT: "Brouillon",
    SUBMITTED: "Demande soumise",
    EVALUATING: "En évaluation",
    PENDING_VALIDATION: "Attente validation",
    PENDING: "En attente",
    ACCEPTED: "Acceptée",
    ASSIGNED: "Attribuée",
    COLLECTING: "Collecte en cours",
    PICKED_UP: "Collectée",
    IN_TRANSIT: "En livraison",
    DELIVERED: "Livrée",
    CANCELLED: "Annulée",
    REJECTED: "Refusée",
    FAILED: "Échec",
    DISPUTE: "Litige",
    RETURN_NEEDED: "Retour",
  };
  return map[toVitaStatus(s)] ?? s;
}

export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["EVALUATING", "CANCELLED"],
  EVALUATING: ["PENDING_VALIDATION", "ACCEPTED", "REJECTED"],
  PENDING_VALIDATION: ["ACCEPTED", "REJECTED", "EVALUATING"],
  PENDING: ["ACCEPTED", "CANCELLED", "REJECTED"],
  ACCEPTED: ["ASSIGNED", "COLLECTING", "CANCELLED"],
  ASSIGNED: ["COLLECTING", "ACCEPTED", "CANCELLED"],
  COLLECTING: ["PICKED_UP", "FAILED"],
  PICKED_UP: ["IN_TRANSIT", "FAILED"],
  IN_TRANSIT: ["DELIVERED", "FAILED", "RETURN_NEEDED"],
  FAILED: ["RETURN_NEEDED", "DISPUTE", "CANCELLED"],
  RETURN_NEEDED: ["DELIVERED", "DISPUTE", "CANCELLED"],
  DISPUTE: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
  REJECTED: [],
};

export function canTransition(from: string, to: string) {
  const allowed = ALLOWED_TRANSITIONS[toVitaStatus(from)] ?? [];
  return allowed.includes(toVitaStatus(to));
}
