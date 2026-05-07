import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  MapPin,
  Clock,
  ShieldCheck,
  Package,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-delivery.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[100svh] flex items-center pt-24 pb-16 lg:pt-28 lg:pb-24 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Vita Express — service de livraison à Kinshasa"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/95 via-secondary/85 to-secondary/70 lg:bg-gradient-to-r lg:from-secondary/95 lg:via-secondary/80 lg:to-secondary/30" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 right-0 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="inline-flex items-center bg-primary/15 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-primary/30"
            >
              <span className="text-primary font-medium text-xs sm:text-sm">
                Livraison premium à Kinshasa
              </span>
            </motion.div>

            {/* Heading */}
            <h1 className="text-[2.25rem] leading-[1.1] sm:text-5xl lg:text-6xl xl:text-7xl font-poppins font-bold text-secondary-foreground tracking-tight">
              Vos colis livrés{" "}
              <span className="text-primary relative inline-block">
                en un éclair
                <svg
                  className="absolute -bottom-1 sm:-bottom-2 left-0 w-full"
                  viewBox="0 0 200 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 10C50 2 150 2 198 10"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="text-primary/60"
                  />
                </svg>
              </span>
              <br className="hidden sm:block" />
              partout dans Kinshasa
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg lg:text-xl text-secondary-foreground/80 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Vita Express connecte particuliers, commerçants et entreprises à un
              réseau de livreurs vérifiés. Suivi GPS en direct, tarifs
              transparents, service 7j/7.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Link to="/auth/register" className="w-full sm:w-auto">
                <Button variant="hero" size="xl" className="w-full sm:w-auto group">
                  Commander une livraison
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/forfaits" className="w-full sm:w-auto">
                <Button
                  variant="hero-outline"
                  size="xl"
                  className="w-full sm:w-auto border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary"
                >
                  Voir nos forfaits
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-4 sm:pt-6 max-w-xl mx-auto lg:mx-0">
              {[
                { icon: Clock, value: "30 min", label: "Délai moyen" },
                { icon: MapPin, value: "24 zones", label: "À Kinshasa" },
                { icon: ShieldCheck, value: "100%", label: "Sécurisé" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 text-center sm:text-left"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/15 border border-primary/20 rounded-xl flex items-center justify-center shrink-0">
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-secondary-foreground leading-none">
                      {stat.value}
                    </p>
                    <p className="text-xs sm:text-sm text-secondary-foreground/60 mt-1">
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Side - Floating Card (desktop only) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:block lg:col-span-5"
          >
            <div className="relative">
              <div className="glass-card p-7 space-y-6 animate-float">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-yellow">
                    <Package className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-poppins font-semibold text-lg">
                      Estimation rapide
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Calculez le prix en 2 clics
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-muted rounded-xl p-4 flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Point de ramassage
                      </p>
                      <p className="font-medium text-sm">
                        Gombe, Avenue du Commerce
                      </p>
                    </div>
                  </div>
                  <div className="bg-muted rounded-xl p-4 flex items-start gap-3">
                    <Navigation className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Point de livraison
                      </p>
                      <p className="font-medium text-sm">Limete, Résidentiel</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-primary/10 rounded-xl border border-primary/20">
                  <div>
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="text-2xl font-bold text-foreground">8.5 km</p>
                  </div>
                  <div className="h-10 w-px bg-border" />
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Prix estimé</p>
                    <p className="text-2xl font-bold text-primary">3 500 FC</p>
                  </div>
                </div>

                <Button className="w-full" size="lg">
                  Confirmer la commande
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Floating Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="absolute -top-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full font-semibold shadow-yellow-lg"
              >
                Nouveau service
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
