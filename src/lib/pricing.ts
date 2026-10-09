import { haversineKm } from "./distance";

export type PricingRule = {
  version: string;
  baseFc: number;
  perKmFc: number;
  minFc: number;
  weightStepKg: number;
  weightSurchargeFc: number;
  volumetricEnabled: boolean;
  urgentSurchargeFc: number;
  specialHandlingFc: number;
  declaredValueRate: number;
  trafficEnabled: boolean;
};

export const DEFAULT_PRICING: PricingRule = {
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

export type QuoteInput = {
  pickupLat: number;
  pickupLng: number;
  deliveryLat: number;
  deliveryLng: number;
  roadKm?: number | null;
  weightKg?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  urgent?: boolean;
  specialHandling?: boolean;
  declaredValueFc?: number | null;
  planDiscountFc?: number;
};

export type QuoteBreakdown = {
  version: string;
  distanceKm: number;
  distanceSource: "directions" | "haversine";
  lines: { label: string; amount: number }[];
  totalFc: number;
};

export function volumetricKg(l?: number | null, w?: number | null, h?: number | null) {
  if (l == null || w == null || h == null) return 0;
  return (l * w * h) / 5000;
}

export function computeQuote(input: QuoteInput, rule: PricingRule = DEFAULT_PRICING): QuoteBreakdown {
  const hav = haversineKm(input.pickupLat, input.pickupLng, input.deliveryLat, input.deliveryLng);
  const useRoad = input.roadKm != null && input.roadKm > 0;
  const distanceKm = Number((useRoad ? input.roadKm! : hav).toFixed(2));
  const lines: { label: string; amount: number }[] = [];
  lines.push({ label: "Base", amount: rule.baseFc });
  lines.push({ label: `Distance ${distanceKm} km × ${rule.perKmFc} FC`, amount: Math.round(distanceKm * rule.perKmFc) });

  let billableKg = input.weightKg ?? 0;
  if (rule.volumetricEnabled) {
    billableKg = Math.max(billableKg, volumetricKg(input.lengthCm, input.widthCm, input.heightCm));
  }
  if (billableKg > rule.weightStepKg) {
    const extra = Math.ceil((billableKg - rule.weightStepKg) / rule.weightStepKg) * rule.weightSurchargeFc;
    lines.push({ label: "Poids", amount: extra });
  }
  if (rule.urgentSurchargeFc && input.urgent) lines.push({ label: "Urgence", amount: rule.urgentSurchargeFc });
  if (rule.specialHandlingFc && input.specialHandling) lines.push({ label: "Manutention", amount: rule.specialHandlingFc });
  if (rule.declaredValueRate && input.declaredValueFc) {
    lines.push({ label: "Couverture valeur", amount: Math.round(input.declaredValueFc * rule.declaredValueRate) });
  }
  if (input.planDiscountFc) lines.push({ label: "Forfait", amount: -Math.abs(input.planDiscountFc) });

  const raw = lines.reduce((s, l) => s + l.amount, 0);
  const totalFc = Math.max(rule.minFc, Math.round(raw / 100) * 100);
  return {
    version: rule.version,
    distanceKm,
    distanceSource: useRoad ? "directions" : "haversine",
    lines,
    totalFc,
  };
}
