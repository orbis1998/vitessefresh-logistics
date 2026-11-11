import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  VitaArrowIcon,
  VitaCheckIcon,
  VitaExpressIcon,
  VitaPriorityIcon,
  VitaSupportIcon,
} from "@/components/brand/VitaIcons";
import { services } from "@/data/services";

const serviceIcons = {
  express: VitaExpressIcon,
  priority: VitaPriorityIcon,
};

const Services = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-28 pb-10 sm:pt-32 sm:pb-12">
        <div className="container-custom max-w-3xl">
          <h1 className="text-3xl sm:text-5xl font-heading font-bold">Nos Services</h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Deux niveaux de prise en charge, un même engagement : transporter votre colis
            avec clarté, suivi et remise sécurisée.
          </p>
        </div>
      </section>

      <section className="pb-16 sm:pb-20">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-5 sm:gap-8">
            {services.map((service, index) => {
              const ServiceIcon = serviceIcons[service.icon];
              return (
              <article
                key={service.title}
                className={`group relative overflow-hidden rounded-[1.5rem] p-6 sm:p-9 min-h-[29rem] flex flex-col ${
                  index === 0 ? "bg-primary text-primary-foreground" : "bg-[#171717] text-white"
                }`}
              >
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                  index === 0 ? "bg-black/10" : "bg-primary/10 text-primary"
                }`}>
                  <ServiceIcon className="h-9 w-9" />
                </div>
                <p className={`mt-8 text-xs font-medium uppercase tracking-[0.16em] ${
                  index === 0 ? "text-black/55" : "text-primary"
                }`}>{service.eyebrow}</p>
                <h2 className="mt-3 text-2xl sm:text-3xl font-heading font-semibold">{service.title}</h2>
                <p className={`mt-4 leading-relaxed ${
                  index === 0 ? "text-black/70" : "text-white/60"
                }`}>{service.description}</p>
                <div className="space-y-3 mb-8 flex-1">
                  {service.features.slice(0, 3).map((feature) => (
                    <div key={feature} className="mt-5 flex items-start gap-3">
                      <VitaCheckIcon className={`mt-0.5 w-4 h-4 shrink-0 ${
                        index === 0 ? "text-black" : "text-primary"
                      }`} />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                <Link to={`/services/${service.slug}`}>
                  <Button variant={index === 0 ? "secondary" : "outline"} className="w-full group/cta">
                    Découvrir le service
                    <VitaArrowIcon className="h-4 w-4 transition-transform group-hover/cta:translate-x-1" />
                  </Button>
                </Link>
              </article>
            )})}
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
                <VitaSupportIcon className="w-4 h-4" />
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
