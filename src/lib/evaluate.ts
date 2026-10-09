export type EvalLevel = "GREEN" | "YELLOW" | "RED";

export type EvalInput = {
  pickupLat: number;
  pickupLng: number;
  deliveryLat: number;
  deliveryLng: number;
  weightKg: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  declaredValueFc: number | null;
  packageDescription: string;
  packagingState: string | null;
  fragile: boolean;
  zoneCategory: "served" | "suspended" | "unserved" | "review" | null;
  photoCount: number;
  senderPhone: string | null;
  recipientPhone: string | null;
  groqAvailable?: boolean;
  groqConfidence?: number | null;
};

export type EvalResult = {
  level: EvalLevel;
  reasons: string[];
  passed: string[];
  missing: string[];
  assignable: boolean;
};

const FORBIDDEN = /(arme|explosif|drogue|munition|acide|essence\b)/i;
export const LIMITS = {
  maxWeightKg: 20,
  warnWeightKg: 12,
  maxSideCm: 80,
  maxVolumeCm3: 80 * 50 * 50,
  maxDeclaredFc: 500_000,
  warnDeclaredFc: 80_000,
  maxPhotoBytes: 5 * 1024 * 1024,
};

export function evaluateParcel(input: EvalInput): EvalResult {
  const reasons: string[] = [];
  const passed: string[] = [];
  const missing: string[] = [];

  if (!Number.isFinite(input.pickupLat) || !Number.isFinite(input.deliveryLat)) {
    reasons.push("Coordonnées GPS invalides");
  } else passed.push("Coordonnées GPS");

  if (!input.senderPhone) missing.push("Téléphone expéditeur");
  else passed.push("Expéditeur joignable");
  if (!input.recipientPhone) missing.push("Téléphone destinataire");
  else passed.push("Destinataire joignable");

  if (input.zoneCategory === "unserved") reasons.push("Zone de destination non desservie");
  else if (input.zoneCategory === "suspended") reasons.push("Zone temporairement suspendue");
  else if (input.zoneCategory === "review") reasons.push("Zone soumise à validation particulière");
  else if (input.zoneCategory === "served") passed.push("Zone desservie");

  if (input.weightKg != null) {
    if (input.weightKg < 0) reasons.push("Poids négatif refusé");
    else if (input.weightKg > LIMITS.maxWeightKg) reasons.push(`Poids supérieur à la capacité moto (${LIMITS.maxWeightKg} kg)`);
    else if (input.weightKg > LIMITS.warnWeightKg) reasons.push("Poids élevé : vérification capacité");
    else passed.push("Poids dans les limites moto");
  } else missing.push("Poids réel");

  const dims = [input.lengthCm, input.widthCm, input.heightCm];
  if (dims.some((d) => d != null && d < 0)) reasons.push("Dimensions négatives refusées");
  if (dims.every((d) => d != null)) {
    const [l, w, h] = dims as number[];
    if (Math.max(l, w, h) > LIMITS.maxSideCm) reasons.push("Dimension hors gabarit moto");
    else if (l * w * h > LIMITS.maxVolumeCm3) reasons.push("Volume hors gabarit");
    else passed.push("Dimensions acceptables");
  } else missing.push("Dimensions L×l×h");

  if (input.declaredValueFc != null) {
    if (input.declaredValueFc < 0) reasons.push("Valeur déclarée négative");
    else if (input.declaredValueFc > LIMITS.maxDeclaredFc) reasons.push("Valeur déclarée hors couverture");
    else if (input.declaredValueFc > LIMITS.warnDeclaredFc) reasons.push("Valeur élevée : validation couverture");
    else passed.push("Valeur déclarée dans les seuils");
  }

  if (FORBIDDEN.test(input.packageDescription || "")) reasons.push("Nature du contenu interdite au transport moto");
  else if ((input.packageDescription || "").trim().length < 3) missing.push("Description du contenu");
  else passed.push("Nature déclarée admissible");

  if (input.fragile && input.packagingState && /abim|ouvert|humide|dechir/i.test(input.packagingState)) {
    reasons.push("Colis fragile avec emballage détérioré");
  }

  if (input.photoCount < 1) missing.push("Photo principale");
  else passed.push("Photo fournie");

  if (input.groqAvailable === false) reasons.push("Analyse visuelle indisponible : vérification humaine");
  else if (input.groqConfidence != null && input.groqConfidence < 0.4) {
    reasons.push("Confiance IA insuffisante : ne pas accepter automatiquement");
  }

  const blocking = reasons.some((r) =>
    /non desservie|interdite|négatif|hors gabarit|capacité moto|invalides|hors couverture/.test(r)
  );
  const needsHuman =
    missing.length > 0 ||
    input.zoneCategory === "review" ||
    reasons.some((r) => /vérification|validation|IA|élevé|détérioré/.test(r));

  let level: EvalLevel = "GREEN";
  if (blocking) level = "RED";
  else if (needsHuman || reasons.length) level = "YELLOW";

  return {
    level,
    reasons,
    passed,
    missing,
    assignable: level === "GREEN",
  };
}
