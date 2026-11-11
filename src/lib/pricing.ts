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
  /** Multiplier for rain / bad weather (1 = off). */
  climateSurchargeRate: number;
  /** Multiplier for congestion (1 = off). */
  trafficSurchargeRate: number;
};

/** Vita Express default grid — course from 4 500 FC. */
export const DEFAULT_PRICING: PricingRule = {
  version: "2026-11-grid-4500",
  baseFc: 4500,
  perKmFc: 700,
  minFc: 4500,
  weightStepKg: 5,
  weightSurchargeFc: 400,
  volumetricEnabled: true,
  urgentSurchargeFc: 1500,
  specialHandlingFc: 800,
  declaredValueRate: 0.01,
  trafficEnabled: true,
  climateSurchargeRate: 0.12,
  trafficSurchargeRate: 0.18,
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
  /** 0–1 estimated congestion (Mapbox/OSRM duration vs free-flow). */
  trafficFactor?: number | null;
  /** Bad weather / rain season flag. */
  badClimate?: boolean;
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
  lines.push({ label: "Prise en charge", amount: rule.baseFc });
  lines.push({
    label: `Distance ${distanceKm} km × ${rule.perKmFc} FC`,
    amount: Math.round(distanceKm * rule.perKmFc),
  });

  let billableKg = input.weightKg ?? 0;
  if (rule.volumetricEnabled) {
    billableKg = Math.max(billableKg, volumetricKg(input.lengthCm, input.widthCm, input.heightCm));
  }
  if (billableKg > rule.weightStepKg) {
    const extra = Math.ceil((billableKg - rule.weightStepKg) / rule.weightStepKg) * rule.weightSurchargeFc;
    lines.push({ label: `Poids ${billableKg.toFixed(1)} kg`, amount: extra });
  }
  if (rule.urgentSurchargeFc && input.urgent) lines.push({ label: "Urgence", amount: rule.urgentSurchargeFc });
  if (rule.specialHandlingFc && input.specialHandling) {
    lines.push({ label: "Manutention spéciale", amount: rule.specialHandlingFc });
  }
  if (rule.declaredValueRate && input.declaredValueFc) {
    lines.push({
      label: "Couverture valeur",
      amount: Math.round(input.declaredValueFc * rule.declaredValueRate),
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  if (input.badClimate && rule.climateSurchargeRate > 0) {
    lines.push({
      label: "Climat / pluie",
      amount: Math.round(subtotal * rule.climateSurchargeRate),
    });
  }
  const congestion = Math.min(1, Math.max(0, input.trafficFactor ?? 0));
  if (rule.trafficEnabled && rule.trafficSurchargeRate > 0 && congestion > 0.08) {
    lines.push({
      label: `Embouteillage ${Math.round(congestion * 100)}%`,
      amount: Math.round(subtotal * rule.trafficSurchargeRate * congestion),
    });
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
