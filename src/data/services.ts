export const services = [
  {
    slug: "livraison-express",
    icon: "express" as const,
    title: "Livraison Express",
    eyebrow: "Pour vos envois du quotidien",
    description:
      "Un livreur récupère votre colis et l’achemine directement à l’adresse indiquée, avec suivi GPS pendant toute la course.",
    features: [
      "Prise en charge partout dans les zones desservies de Kinshasa",
      "Suivi GPS et statut de la course en temps réel",
      "Code sécurisé demandé au destinataire à la remise",
      "Assistance Vita Express en cas d’imprévu",
    ],
    steps: [
      "Indiquez l’adresse de ramassage et celle du destinataire.",
      "Confirmez les informations du colis et votre commande.",
      "Suivez le livreur jusqu’à la remise sécurisée.",
    ],
    idealFor: ["Documents", "Vêtements et accessoires", "Petits colis", "Commandes locales"],
  },
  {
    slug: "livraison-prioritaire",
    icon: "priority" as const,
    title: "Livraison Prioritaire",
    eyebrow: "Quand chaque minute compte",
    description:
      "Votre course passe en priorité auprès du dispatch afin de réduire le délai de prise en charge et d’assurer un trajet direct.",
    features: [
      "Traitement prioritaire de la demande",
      "Livreur mobilisé pour un trajet direct",
      "Suivi GPS et notifications à chaque étape",
      "Assistance renforcée jusqu’à la livraison",
    ],
    steps: [
      "Signalez l’urgence et renseignez les deux adresses.",
      "Le dispatch confirme la disponibilité d’un livreur prioritaire.",
      "Le colis part en trajet direct jusqu’au destinataire.",
    ],
    idealFor: ["Documents urgents", "Pièces indispensables", "Oublis et dépannages", "Envois à délai critique"],
  },
] as const;

export type VitaService = (typeof services)[number];

export function getService(slug: string | undefined) {
  return services.find((service) => service.slug === slug);
}
