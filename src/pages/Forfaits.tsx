import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Check, Star, Zap, Shield, Crown, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    description: "Parfait pour les livraisons occasionnelles",
    price: "0 FC",
    period: "Pay-as-you-go",
    icon: Package,
    features: [
      "Livraison standard",
      "Suivi GPS en temps réel",
      "Support par email",
      "Paiement à la livraison",
      "Application mobile"
    ],
    notIncluded: [
      "Livraison prioritaire",
      "Support téléphonique",
      "Facturation mensuelle"
    ],
    popular: false,
    color: "border-gray-200"
  },
  {
    name: "Business",
    description: "Idéal pour les professionnels et PME",
    price: "25 000 FC",
    period: "par mois",
    icon: Star,
    features: [
      "10 livraisons incluses",
      "Livraison express",
      "Suivi GPS en temps réel",
      "Support prioritaire",
      "Facturation mensuelle",
      "Gestion multi-utilisateurs",
      "API d'intégration"
    ],
    notIncluded: [
      "Livraison prioritaire",
      "Livreurs dédiés"
    ],
    popular: true,
    color: "border-primary"
  },
  {
    name: "Enterprise",
    description: "Solution complète pour les grandes entreprises",
    price: "Sur devis",
    period: "personnalisé",
    icon: Crown,
    features: [
      "Livraisons illimitées",
      "Livraison prioritaire",
      "Livreurs dédiés",
      "Support 24/7",
      "API complète",
      "Tableau de bord avancé",
      "Intégration ERP",
      "SLA garanti",
      "Formation équipe"
    ],
    notIncluded: [],
    popular: false,
    color: "border-gray-900"
  }
];

const additionalServices = [
  {
    name: "Assurance Premium",
    price: "500 FC",
    description: "Protection complète jusqu'à 500 000 FC par colis"
  },
  {
    name: "Service Nuit",
    price: "2 000 FC",
    description: "Livraison entre 22h et 6h"
  },
  {
    name: "Emballage Professionnel",
    price: "1 500 FC",
    description: "Emballage sécurisé et matériaux de protection"
  }
];

const Forfaits = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-poppins font-bold mb-6">
              Nos <span className="text-primary">Forfaits</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
              Choisissez le forfait parfait pour vos besoins de livraison. 
              Du service occasionnel aux solutions entreprises complètes.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="container-custom">
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative ${plan.popular ? 'lg:scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Plus populaire
                    </div>
                  </div>
                )}
                
                <div className={`bg-background rounded-2xl border-2 ${plan.color} hover:border-primary/50 hover:shadow-lg transition-all duration-300 p-8 h-full ${plan.popular ? 'shadow-yellow' : ''}`}>
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <plan.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-poppins font-bold mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                    <div className="mb-2">
                      <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground ml-2">{plan.period}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                    {plan.notIncluded.map((feature) => (
                      <div key={feature} className="flex items-center gap-3 opacity-50">
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Link to="/auth/register" className="block">
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-primary' : 'bg-secondary'} hover:opacity-90 transition-opacity`}
                      variant={plan.popular ? "default" : "secondary"}
                    >
                      {plan.name === "Enterprise" ? "Contacter les ventes" : "S'inscrire"}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Services */}
      <section className="py-20 bg-muted/30">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-poppins font-bold mb-4">
              Services <span className="text-primary">Complémentaires</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Complétez votre forfait avec nos services additionnels
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {additionalServices.map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-background rounded-xl border border-border p-6 hover:border-primary/30 transition-all duration-300"
              >
                <h4 className="font-semibold text-lg mb-2">{service.name}</h4>
                <p className="text-primary font-bold text-xl mb-2">{service.price}</p>
                <p className="text-muted-foreground text-sm">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container-custom max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-poppins font-bold mb-4">
              Questions <span className="text-primary">Fréquentes</span>
            </h2>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                q: "Puis-je changer de forfait à tout moment ?",
                a: "Oui, vous pouvez passer à un forfait supérieur à tout moment. La mise à jour prend effet immédiatement."
              },
              {
                q: "Les livraisons incluses sont-elles cumulables ?",
                a: "Les livraisons incluses dans les forfaits mensuels se réinitialisent chaque mois. Les livraisons non utilisées ne sont pas reportées."
              },
              {
                q: "Comment fonctionne la facturation ?",
                a: "La facturation est mensuelle pour les forfaits Business et Enterprise. Vous recevez une facture détaillée avec toutes vos livraisons."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-background rounded-xl border border-border p-6"
              >
                <h4 className="font-semibold text-lg mb-2">{faq.q}</h4>
                <p className="text-muted-foreground">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Forfaits;
