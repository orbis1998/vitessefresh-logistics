import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-24 bg-secondary relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />

      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <span className="inline-flex items-center gap-2 bg-primary/20 px-4 py-2 rounded-full">
              <Smartphone className="w-4 h-4 text-primary" />
              <span className="text-primary font-medium text-sm">
                Bientôt disponible sur mobile
              </span>
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-poppins font-bold text-secondary-foreground leading-tight">
              Prêt à révolutionner <br />
              vos <span className="text-primary">livraisons</span> ?
            </h2>

            <p className="text-lg text-secondary-foreground/70 max-w-lg">
              Rejoignez des centaines d'entreprises et particuliers qui font confiance 
              à VitesseFresh pour leurs livraisons quotidiennes à Kinshasa.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth/register">
                <Button variant="hero" size="xl" className="w-full sm:w-auto group">
                  Créer un compte gratuit
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button
                  variant="hero-outline"
                  size="xl"
                  className="w-full sm:w-auto border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary"
                >
                  Parler à un conseiller
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-primary/20 border-2 border-secondary flex items-center justify-center text-xs font-medium text-secondary-foreground"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-secondary-foreground/70">
                  +500 clients satisfaits
                </span>
              </div>
            </div>
          </motion.div>

          {/* Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="hidden lg:block"
          >
            <div className="bg-secondary-foreground/5 backdrop-blur-sm rounded-3xl p-8 border border-secondary-foreground/10">
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center p-6 bg-secondary-foreground/5 rounded-2xl">
                  <p className="text-4xl font-bold text-primary">500+</p>
                  <p className="text-secondary-foreground/70 mt-2">Clients actifs</p>
                </div>
                <div className="text-center p-6 bg-secondary-foreground/5 rounded-2xl">
                  <p className="text-4xl font-bold text-primary">24</p>
                  <p className="text-secondary-foreground/70 mt-2">Zones couvertes</p>
                </div>
                <div className="text-center p-6 bg-secondary-foreground/5 rounded-2xl">
                  <p className="text-4xl font-bold text-primary">30min</p>
                  <p className="text-secondary-foreground/70 mt-2">Délai moyen</p>
                </div>
                <div className="text-center p-6 bg-secondary-foreground/5 rounded-2xl">
                  <p className="text-4xl font-bold text-primary">98%</p>
                  <p className="text-secondary-foreground/70 mt-2">Satisfaction</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
