export const KINSHASA_COMMUNES = [
  "Gombe",
  "Lemba",
  "Limete",
  "Matete",
  "Kalamu",
  "Masina",
  "Mont-Ngafula",
  "Ngaba",
  "Ngiri-Ngiri",
  "Kintambo",
  "Kasa-Vubu",
  "Selembao",
  "Bumbu",
  "Barumbu",
  "Kimbaseke",
  "Ngaliema",
  "Pikine",
  "Kinsenso",
  "Maluku",
  "Nsele",
  "Ndjili",
  "Kisenso",
  "Bandalungwa",
  "Kasavubu"
];

export const getCommuneByZone = (zone: string): string[] => {
  // Répartition géographique des communes par zones
  const zones: Record<string, string[]> = {
    "centre": ["Gombe", "Kasa-Vubu", "Kasavubu", "Barumbu", "Lingwala"],
    "est": ["Masina", "Matete", "Kimbaseke", "Kalamu", "Ngiri-Ngiri"],
    "ouest": ["Mont-Ngafula", "Kintambo", "Ngaliema", "Bumbu", "Selembao"],
    "sud": ["Lemba", "Limete", "Ngaba", "Kisenso", "Kinsenso"],
    "nord": ["Maluku", "Nsele", "Ndjili", "Pikine"]
  };
  
  return zones[zone] || [];
};
