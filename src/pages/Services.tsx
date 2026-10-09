import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Truck, Package, Users, Zap, Check, Headphones } from "lucide-react";

const services = [
  {
    icon: Truck,
    title: "Livraison Express",
    description: "Livraison rapide dans toute la ville de Kinshasa en moins de 45 minutes",
    features: ["Suivi GPS en temps réel", "Notification instantanée", "Livraison 24/7"],
    price: "À partir de 2 500 FC",
  },
  {
    icon: Package,
    title: "Transport de Colis",
    description: "Transport sécurisé de vos colis et documents importants",
    features: ["Emballage professionnel", "Assurance incluse", "Signature à réception"],
    price: "À partir de 3 500 FC",
  },
  {
    icon: Users,
    title: "Service Entreprises",
    description: "Solutions logistiques adaptées aux professionnels et entreprises",
    features: ["Gestion multi-livraisons", "Facturation mensuelle", "Support dédié"],
    price: "Sur devis",
  },
  {
    icon: Zap,
    title: "Livraison Prioritaire",
    description: "Service ultra-rapide pour vos envois urgents et critiques",
    features: ["Livraison en 30 minutes", "Livreurs dédiés", "Suivi premium"],
    price: "À partir de 5 000 FC",
  },
];

const Services = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-28 pb-10 sm:pt-32 sm:pb-12">
        <div className="container-custom max-w-3xl">
          <h1 className="text-3xl sm:text-5xl font-heading font-bold">Nos Services</h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Découvrez notre gamme complète de services de livraison adaptés à tous vos besoins.
            De la livraison express aux solutions entreprises, nous avons la solution parfaite pour vous.
          </p>
        </div>
      </section>

      <section className="pb-16 sm:pb-20">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
            {services.map((service) => (
              <div
                key={service.title}
                className="border border-border rounded-xl p-5 sm:p-8 h-full flex flex-col"
              >
                <div className="flex items-start justify-between gap-4 mb-5">
                  <service.icon className="w-7 h-7 text-primary shrink-0" strokeWidth={1.75} />
                  <p className="text-lg sm:text-xl font-heading font-bold text-primary text-right">
                    {service.price}
                  </p>
                </div>
                <h3 className="text-xl sm:text-2xl font-heading font-semibold mb-3">{service.title}</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">{service.description}</p>
                <div className="space-y-3 mb-8 flex-1">
                  {service.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-primary shrink-0" strokeWidth={2} />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                <Link to="/auth/register">
                  <Button className="w-full">Commander ce service</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20 border-t border-border">
        <div className="container-custom max-w-3xl">
          <h2 className="text-2xl sm:text-4xl font-heading font-bold mb-4">
            Besoin d'une solution sur mesure ?
          </h2>
          <p className="text-muted-foreground mb-8">
            Notre équipe commerciale est disponible pour étudier vos besoins spécifiques
            et vous proposer la meilleure solution logistique.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/contact" className="w-full sm:w-auto">
              <Button size="lg" className="w-full">
                Contacter nos experts
                <Headphones className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/auth/register" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full">
                S'inscrire maintenant
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;
