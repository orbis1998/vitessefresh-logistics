import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Clock, Shield, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-delivery.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="VitesseFresh Livraison"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/95 via-secondary/80 to-secondary/40" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm px-4 py-2 rounded-full border border-primary/30"
            >
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-primary font-medium text-sm">
                Livraison Express à Kinshasa
              </span>
            </motion.div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-poppins font-bold text-secondary-foreground leading-tight">
              Livraison{" "}
              <span className="text-primary relative">
                Rapide
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 200 12"
                  fill="none"
                >
                  <path
                    d="M2 10C50 2 150 2 198 10"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="text-primary/50"
                  />
                </svg>
              </span>{" "}
              <br />
              et Fiable
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-secondary-foreground/80 max-w-lg leading-relaxed">
              VitesseFresh révolutionne la livraison à Kinshasa. Suivez vos colis en 
              temps réel, profitez de tarifs transparents et d'un service premium.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/commander">
                <Button variant="hero" size="xl" className="w-full sm:w-auto group">
                  Commander une livraison
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/forfaits">
                <Button variant="hero-outline" size="xl" className="w-full sm:w-auto border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary">
                  Découvrir nos forfaits
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary-foreground">30 min</p>
                  <p className="text-sm text-secondary-foreground/60">Délai moyen</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary-foreground">24 zones</p>
                  <p className="text-sm text-secondary-foreground/60">À Kinshasa</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary-foreground">100%</p>
                  <p className="text-sm text-secondary-foreground/60">Sécurisé</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Floating Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:block"
          >
            <div className="relative">
              {/* Main Card */}
              <div className="glass-card p-8 space-y-6 animate-float">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-yellow">
                    <Package className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-poppins font-semibold text-lg">Estimation rapide</h3>
                    <p className="text-muted-foreground text-sm">Calculez le prix en 2 clics</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-muted rounded-xl p-4">
                    <p className="text-sm text-muted-foreground mb-1">Point de ramassage</p>
                    <p className="font-medium">Gombe, Avenue du Commerce</p>
                  </div>
                  <div className="bg-muted rounded-xl p-4">
                    <p className="text-sm text-muted-foreground mb-1">Point de livraison</p>
                    <p className="font-medium">Limete, Résidentiel</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-primary/10 rounded-xl border border-primary/20">
                  <div>
                    <p className="text-sm text-muted-foreground">Distance estimée</p>
                    <p className="text-2xl font-bold text-foreground">8.5 km</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Prix estimé</p>
                    <p className="text-2xl font-bold text-primary">3,500 FC</p>
                  </div>
                </div>

                <Button className="w-full" size="lg">
                  Confirmer la commande
                </Button>
              </div>

              {/* Floating Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="absolute -top-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full font-semibold shadow-yellow-lg"
              >
                Nouveau! 🚀
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-secondary-foreground/30 rounded-full flex justify-center">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-3 bg-primary rounded-full mt-2"
          />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
