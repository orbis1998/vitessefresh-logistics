import { describe, expect, it } from "vitest";
import { canTransition } from "./status";

describe("transitions", () => {
  it("autorise le flux principal", () => {
    expect(canTransition("SUBMITTED", "EVALUATING")).toBe(true);
    expect(canTransition("EVALUATING", "ACCEPTED")).toBe(true);
    expect(canTransition("ACCEPTED", "ASSIGNED")).toBe(true);
    expect(canTransition("IN_TRANSIT", "DELIVERED")).toBe(true);
  });

  it("interdit un saut livré depuis soumis", () => {
    expect(canTransition("SUBMITTED", "DELIVERED")).toBe(false);
  });
});
