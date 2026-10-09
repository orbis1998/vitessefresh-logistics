import { describe, expect, it } from "vitest";
import { computeQuote, DEFAULT_PRICING } from "./pricing";

describe("computeQuote", () => {
  it("applique base + 500 FC/km et un plancher", () => {
    const q = computeQuote(
      { pickupLat: -4.32, pickupLng: 15.31, deliveryLat: -4.33, deliveryLng: 15.32, roadKm: 4 },
      DEFAULT_PRICING,
    );
    expect(q.distanceSource).toBe("directions");
    expect(q.distanceKm).toBe(4);
    expect(q.totalFc).toBeGreaterThanOrEqual(DEFAULT_PRICING.minFc);
    expect(q.version).toBe("2026-10-grid-1");
  });

  it("n'utilise pas le trafic", () => {
    expect(DEFAULT_PRICING.trafficEnabled).toBe(false);
  });

  it("fallback Haversine sans route", () => {
    const q = computeQuote({ pickupLat: -4.3, pickupLng: 15.3, deliveryLat: -4.4, deliveryLng: 15.4 });
    expect(q.distanceSource).toBe("haversine");
    expect(q.distanceKm).toBeGreaterThan(0);
  });
});
