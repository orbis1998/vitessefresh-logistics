import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Truck, Clock, MapPin, CreditCard, Shield, Headphones, Package, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const services = [
  {
    icon: Truck,
    title: "Livraison Express",
    description: "Livraison rapide dans toute la ville de Kinshasa en moins de 45 minutes",
    features: ["Suivi GPS en temps réel", "Notification instantanée", "Livraison 24/7"],
    price: "À partir de 2 500 FC"
  },
  {
    icon: Package,
    title: "Transport de Colis",
    description: "Transport sécurisé de vos colis et documents importants",
    features: ["Emballage professionnel", "Assurance incluse", "Signature à réception"],
    price: "À partir de 3 500 FC"
  },
  {
    icon: Users,
    title: "Service Entreprises",
    description: "Solutions logistiques adaptées aux professionnels et entreprises",
    features: ["Gestion multi-livraisons", "Facturation mensuelle", "Support dédié"],
    price: "Sur devis"
  },
  {
    icon: Zap,
    title: "Livraison Prioritaire",
    description: "Service ultra-rapide pour vos envois urgents et critiques",
    features: ["Livraison en 30 minutes", "Livreurs dédiés", "Suivi premium"],
    price: "À partir de 5 000 FC"
  }
];

const Services = () => {
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
              Nos <span className="text-primary">Services</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
              Découvrez notre gamme complète de services de livraison adaptés à tous vos besoins. 
              De la livraison express aux solutions entreprises, nous avons la solution parfaite pour vous.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-background rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 p-8 h-full">
                  {/* Icon and Title */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary transition-all duration-300">
                      <service.icon className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{service.price}</p>
                    </div>
                  </div>

                  <h3 className="text-2xl font-poppins font-semibold mb-4">
                    {service.title}
                  </h3>
                  
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {service.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-3 mb-8">
                    {service.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Link to="/auth/register">
                    <Button className="w-full group">
                      Commander ce service
                      <Truck className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl sm:text-4xl font-poppins font-bold mb-6">
              Besoin d'une solution <span className="text-primary">sur mesure</span> ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Notre équipe commerciale est disponible pour étudier vos besoins spécifiques 
              et vous proposer la meilleure solution logistique.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button size="lg" className="group">
                  Contacter nos experts
                  <Headphones className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/auth/register">
                <Button variant="outline" size="lg">
                  S'inscrire maintenant
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;
