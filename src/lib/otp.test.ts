import { describe, expect, it } from "vitest";
import { generateNumericCode, otpAttemptsExceeded, otpExpired, sha256Hex } from "./otp";

describe("otp", () => {
  it("hash SHA-256 déterministe", async () => {
    const a = await sha256Hex("123456");
    const b = await sha256Hex("123456");
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
    expect(a).not.toBe("123456");
  });

  it("génère un code numérique 6 chiffres", () => {
    const c = generateNumericCode(6);
    expect(c).toMatch(/^\d{6}$/);
  });

  it("expire et limite les tentatives", () => {
    expect(otpExpired(new Date(Date.now() - 1000))).toBe(true);
    expect(otpAttemptsExceeded(5)).toBe(true);
    expect(otpAttemptsExceeded(2)).toBe(false);
  });
});
