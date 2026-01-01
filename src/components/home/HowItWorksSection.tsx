import { motion } from "framer-motion";
import { Package, ArrowRight, MapPin, Navigation } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: MapPin,
    title: "Indiquez vos adresses",
    description:
      "Saisissez le point de ramassage et de livraison sur notre carte interactive.",
  },
  {
    step: "02",
    icon: Package,
    title: "Confirmez votre commande",
    description:
      "Vérifiez le prix calculé automatiquement et validez votre demande de livraison.",
  },
  {
    step: "03",
    icon: Navigation,
    title: "Suivez en direct",
    description:
      "Un livreur accepte votre course. Suivez son trajet en temps réel jusqu'à la livraison.",
  },
];

const HowItWorksSection = () => {
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
            Comment ça marche
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-poppins font-bold mt-4 mb-6">
            Simple comme <span className="text-primary">1-2-3</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Commander une livraison n'a jamais été aussi simple. 
            Trois étapes et votre colis est en route.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent -translate-y-1/2" />

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="bg-background border border-border rounded-2xl p-8 relative z-10 h-full hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-8">
                    <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold">
                      Étape {step.step}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mt-4 mb-6">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-poppins font-semibold mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow (between cards) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-6 top-1/2 -translate-y-1/2 z-20">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-yellow">
                      <ArrowRight className="w-6 h-6 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
