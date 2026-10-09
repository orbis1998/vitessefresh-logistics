import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { plans } from "@/data/plans";

const Forfaits = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-28 pb-10 sm:pt-32 sm:pb-12">
        <div className="container-custom max-w-3xl">
          <h1 className="text-3xl sm:text-5xl font-heading font-bold">Nos Forfaits</h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Choisissez le forfait parfait pour vos besoins de livraison.
            Du service occasionnel aux solutions entreprises complètes.
          </p>
        </div>
      </section>

      <section className="pb-16 sm:pb-24">
        <div className="container-custom">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`flex flex-col p-6 rounded-xl border ${
                  plan.featured
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border"
                }`}
              >
                <p className="text-sm font-medium">{plan.name}</p>
                <p className="mt-4 font-heading text-3xl font-bold">{plan.price}</p>
                <p className={`text-sm mt-1 ${plan.featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {plan.hint}
                </p>
                <ul className="mt-6 space-y-2.5 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link to={plan.href} className="mt-8">
                  <Button variant={plan.featured ? "secondary" : "outline"} className="w-full">
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Forfaits;
