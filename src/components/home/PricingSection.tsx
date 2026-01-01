import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, Star, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Basique",
    description: "Paiement par course",
    price: "À partir de",
    priceValue: "2,000",
    priceUnit: "FC / course",
    icon: Check,
    features: [
      "Paiement à la livraison",
      "Suivi en temps réel",
      "Support standard",
      "Tarifs basés sur la distance",
    ],
    cta: "Commencer",
    popular: false,
  },
  {
    name: "Essentiel",
    description: "Packs de courses",
    price: "Pack 20 courses",
    priceValue: "35,000",
    priceUnit: "FC",
    icon: Star,
    features: [
      "Économisez jusqu'à 15%",
      "Courses prépayées",
      "Suivi en temps réel",
      "Support prioritaire",
      "Validité 30 jours",
    ],
    packs: [
      { courses: 20, price: "35,000 FC" },
      { courses: 40, price: "65,000 FC" },
      { courses: 50, price: "75,000 FC" },
    ],
    cta: "Choisir ce pack",
    popular: true,
  },
  {
    name: "Standard",
    description: "Pour les professionnels",
    price: "Abonnement",
    priceValue: "100,000",
    priceUnit: "FC / mois",
    icon: Zap,
    features: [
      "50 courses incluses",
      "Priorité sur les livreurs",
      "Délais réduits de 20%",
      "Support VIP",
      "Factures mensuelles",
    ],
    cta: "S'abonner",
    popular: false,
  },
  {
    name: "Premium",
    description: "Solution entreprise",
    price: "Sur mesure",
    priceValue: "Contact",
    priceUnit: "",
    icon: Crown,
    features: [
      "Courses illimitées",
      "Livreurs dédiés",
      "Délais express garantis",
      "Account Manager dédié",
      "API disponible",
      "Reporting avancé",
    ],
    cta: "Nous contacter",
    popular: false,
  },
];

const PricingSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Nos Forfaits
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-poppins font-bold mt-4 mb-6">
            Des tarifs adaptés à{" "}
            <span className="text-primary">vos besoins</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Du particulier à l'entreprise, nous avons la solution parfaite pour vous. 
            Tarification transparente, sans frais cachés.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl p-6 ${
                plan.popular
                  ? "bg-secondary text-secondary-foreground border-2 border-primary shadow-yellow-lg"
                  : "bg-background border border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Populaire
                  </span>
                </div>
              )}

              <div className="mb-6">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    plan.popular
                      ? "bg-primary"
                      : "bg-primary/10"
                  }`}
                >
                  <plan.icon
                    className={`w-6 h-6 ${
                      plan.popular ? "text-primary-foreground" : "text-primary"
                    }`}
                  />
                </div>
                <h3 className="text-xl font-poppins font-semibold">{plan.name}</h3>
                <p
                  className={`text-sm ${
                    plan.popular ? "text-secondary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <p
                  className={`text-sm ${
                    plan.popular ? "text-secondary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {plan.price}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.priceValue}</span>
                  {plan.priceUnit && (
                    <span
                      className={`text-sm ${
                        plan.popular ? "text-secondary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {plan.priceUnit}
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check
                      className={`w-5 h-5 shrink-0 mt-0.5 ${
                        plan.popular ? "text-primary" : "text-primary"
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        plan.popular ? "text-secondary-foreground/80" : "text-muted-foreground"
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link to={plan.name === "Premium" ? "/contact" : "/auth/register"}>
                <Button
                  variant={plan.popular ? "hero" : "outline"}
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
