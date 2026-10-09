import { describe, expect, it } from "vitest";
import { canAssign } from "./assign";
import { canTransition } from "./status";

/** Contrats RLS / métier testés sans base : le SQL `is_staff` / `assign_driver` les applique. */
describe("contrats RLS métier", () => {
  it("un contrôle rouge n'est jamais attribuable", () => {
    expect(canAssign("ACCEPTED", "RED").ok).toBe(false);
  });

  it("le livreur ne livre que via transition OTP (IN_TRANSIT → DELIVERED)", () => {
    expect(canTransition("IN_TRANSIT", "DELIVERED")).toBe(true);
    expect(canTransition("ASSIGNED", "DELIVERED")).toBe(false);
  });

  it("l'attribution auto n'existe pas dans le graphe (pas de PENDING → ASSIGNED)", () => {
    expect(canTransition("PENDING", "ASSIGNED")).toBe(false);
    expect(canTransition("ACCEPTED", "ASSIGNED")).toBe(true);
  });
});
