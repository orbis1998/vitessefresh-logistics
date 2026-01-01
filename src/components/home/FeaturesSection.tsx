import { motion } from "framer-motion";
import { Truck, Clock, MapPin, CreditCard, Shield, Headphones } from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "Livraison Express",
    description: "Vos colis livrés en moins de 45 minutes dans toutes les zones de Kinshasa.",
  },
  {
    icon: MapPin,
    title: "Suivi en Temps Réel",
    description: "Suivez votre livreur sur la carte et recevez des notifications à chaque étape.",
  },
  {
    icon: Clock,
    title: "Disponible 24/7",
    description: "Notre équipe de livreurs est disponible jour et nuit pour vous servir.",
  },
  {
    icon: CreditCard,
    title: "Paiement Flexible",
    description: "Payez à la livraison ou optez pour nos forfaits prépayés avantageux.",
  },
  {
    icon: Shield,
    title: "Colis Assurés",
    description: "Tous vos envois sont protégés et garantis contre les dommages.",
  },
  {
    icon: Headphones,
    title: "Support Dédié",
    description: "Une équipe réactive pour répondre à toutes vos questions.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Pourquoi nous choisir
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-poppins font-bold mt-4 mb-6">
            La livraison réinventée pour{" "}
            <span className="text-primary">Kinshasa</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            VitesseFresh combine technologie moderne et service de proximité pour 
            vous offrir une expérience de livraison sans pareille.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="bg-background rounded-2xl p-8 h-full border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:shadow-yellow transition-all duration-300">
                  <feature.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="text-xl font-poppins font-semibold mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
