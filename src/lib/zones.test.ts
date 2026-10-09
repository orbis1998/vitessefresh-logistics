import { describe, expect, it } from "vitest";
import { pointInPolygon, resolveZone, zoneBlocksDelivery, type ZoneRecord } from "./zones";

const square: GeoJSON.Polygon = {
  type: "Polygon",
  coordinates: [[[15.2, -4.4], [15.4, -4.4], [15.4, -4.2], [15.2, -4.2], [15.2, -4.4]]],
};

const served: ZoneRecord = { id: "1", name: "Gombe", category: "served", active: true, boundary: square };

describe("zones", () => {
  it("détecte un point dans le polygone", () => {
    expect(pointInPolygon(15.3, -4.3, square)).toBe(true);
    expect(pointInPolygon(16, -4.3, square)).toBe(false);
  });

  it("bloque hors zone et non desservie", () => {
    expect(zoneBlocksDelivery(null).blocked).toBe(true);
    expect(zoneBlocksDelivery({ ...served, category: "unserved" }).blocked).toBe(true);
    expect(zoneBlocksDelivery(served).blocked).toBe(false);
  });

  it("résout la zone active", () => {
    expect(resolveZone(15.3, -4.3, [served])?.name).toBe("Gombe");
  });
});
