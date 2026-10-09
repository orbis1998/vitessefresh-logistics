import { describe, expect, it } from "vitest";
import { canAssign, rankDrivers } from "./assign";

describe("assign", () => {
  it("interdit rouge et jaune", () => {
    expect(canAssign("ACCEPTED", "RED").ok).toBe(false);
    expect(canAssign("ACCEPTED", "YELLOW").ok).toBe(false);
    expect(canAssign("ACCEPTED", "GREEN").ok).toBe(true);
  });

  it("classe les livreurs disponibles avec capacité", () => {
    const ranked = rankDrivers([
      { userId: "a", available: true, vehicleOperational: true, activeMissions: 2, maxMissions: 3, capacityKg: 20, parcelWeightKg: 5 },
      { userId: "b", available: true, vehicleOperational: true, activeMissions: 0, maxMissions: 3, capacityKg: 20, parcelWeightKg: 5 },
      { userId: "c", available: false, vehicleOperational: true, activeMissions: 0, maxMissions: 3, capacityKg: 20, parcelWeightKg: 5 },
    ]);
    expect(ranked[0].userId).toBe("b");
    expect(ranked.some((d) => d.userId === "c")).toBe(false);
  });
});
