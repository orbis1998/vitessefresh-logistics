import { describe, expect, it } from "vitest";
import { evaluateParcel } from "./evaluate";

const base = {
  pickupLat: -4.32,
  pickupLng: 15.31,
  deliveryLat: -4.33,
  deliveryLng: 15.32,
  weightKg: 4,
  lengthCm: 30,
  widthCm: 20,
  heightCm: 10,
  declaredValueFc: 15000,
  packageDescription: "Documents administratifs",
  packagingState: "neuf",
  fragile: false,
  zoneCategory: "served" as const,
  photoCount: 1,
  senderPhone: "+243810000000",
  recipientPhone: "+243820000000",
};

describe("evaluateParcel", () => {
  it("accepte un colis conforme en VERT", () => {
    const r = evaluateParcel(base);
    expect(r.level).toBe("GREEN");
    expect(r.assignable).toBe(true);
  });

  it("refuse le contenu interdit en ROUGE", () => {
    const r = evaluateParcel({ ...base, packageDescription: "arme à feu" });
    expect(r.level).toBe("RED");
    expect(r.assignable).toBe(false);
  });

  it("passe en JAUNE si photo manquante", () => {
    const r = evaluateParcel({ ...base, photoCount: 0 });
    expect(r.level).toBe("YELLOW");
  });

  it("refuse une zone non desservie", () => {
    const r = evaluateParcel({ ...base, zoneCategory: "unserved" });
    expect(r.level).toBe("RED");
  });

  it("ne passe jamais VERT si Groq est KO", () => {
    const r = evaluateParcel({ ...base, groqAvailable: false });
    expect(r.level).toBe("YELLOW");
    expect(r.assignable).toBe(false);
  });
});
