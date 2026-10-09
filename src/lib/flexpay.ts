/**
 * Utilitaires & Types pour l'intégration FlexPay (Mobile Money en RDC)
 * Documentation officielle : https://flexpay.cd
 */

export type MobileMoneyOperator = "mpesa" | "orange_money" | "airtel_money" | "afrimoney" | "unknown";

export interface MobileMoneyOperatorInfo {
  id: MobileMoneyOperator;
  name: string;
  brandColor: string;
  badgeBg: string;
  textColor: string;
  prefixes: string[];
}

export const SUPPORTED_OPERATORS: Record<MobileMoneyOperator, MobileMoneyOperatorInfo> = {
  mpesa: {
    id: "mpesa",
    name: "M-Pesa (Vodacom)",
    brandColor: "#E60000",
    badgeBg: "bg-red-500/10 border-red-500/30",
    textColor: "text-red-500",
    prefixes: ["081", "082", "083", "81", "82", "83"],
  },
  orange_money: {
    id: "orange_money",
    name: "Orange Money",
    brandColor: "#FF7900",
    badgeBg: "bg-orange-500/10 border-orange-500/30",
    textColor: "text-orange-500",
    prefixes: ["084", "085", "089", "84", "85", "89"],
  },
  airtel_money: {
    id: "airtel_money",
    name: "Airtel Money",
    brandColor: "#FF0000",
    badgeBg: "bg-rose-500/10 border-rose-500/30",
    textColor: "text-rose-500",
    prefixes: ["097", "098", "099", "97", "98", "99"],
  },
  afrimoney: {
    id: "afrimoney",
    name: "Afrimoney",
    brandColor: "#0099FF",
    badgeBg: "bg-blue-500/10 border-blue-500/30",
    textColor: "text-blue-500",
    prefixes: ["090", "091", "90", "91"],
  },
  unknown: {
    id: "unknown",
    name: "Mobile Money",
    brandColor: "#10B981",
    badgeBg: "bg-primary/10 border-primary/30",
    textColor: "text-primary",
    prefixes: [],
  },
};

/**
 * Normalise un numéro de téléphone congolais au format international standard RDC : 243XXXXXXXXX
 */
export function normalizeDrcPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.startsWith("243") && cleaned.length === 12) {
    return cleaned;
  }
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return `243${cleaned.slice(1)}`;
  }
  if (cleaned.length === 9) {
    return `243${cleaned}`;
  }
  return cleaned;
}

/**
 * Détecte l'opérateur Mobile Money congolais à partir des premiers chiffres
 */
export function detectMobileMoneyOperator(phone: string): MobileMoneyOperatorInfo {
  const normalized = normalizeDrcPhone(phone);
  const localPart = normalized.startsWith("243") ? normalized.slice(3) : normalized;

  for (const [opKey, opInfo] of Object.entries(SUPPORTED_OPERATORS)) {
    if (opKey === "unknown") continue;
    for (const prefix of opInfo.prefixes) {
      const cleanPrefix = prefix.startsWith("0") ? prefix.slice(1) : prefix;
      if (localPart.startsWith(cleanPrefix)) {
        return opInfo;
      }
    }
  }

  return SUPPORTED_OPERATORS.unknown;
}

/**
 * Valide si le numéro correspond à un format mobile valide en RDC (9 chiffres locaux)
 */
export function isValidDrcPhone(phone: string): boolean {
  const normalized = normalizeDrcPhone(phone);
  return /^243(81|82|83|84|85|89|90|91|97|98|99)\d{7}$/.test(normalized);
}

/**
 * Génère un code OTP sécurisé à 4 chiffres (ex: "4821")
 */
export function generateDeliveryOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
