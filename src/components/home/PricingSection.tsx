import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { plans } from "@/data/plans";

const PricingSection = () => {
  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="container-custom">
        <h2 className="font-heading text-3xl sm:text-4xl font-bold">
          Des tarifs adaptés à vos besoins
        </h2>
        <p className="mt-4 text-muted-foreground max-w-lg">
          Du particulier à l'entreprise, nous avons la solution parfaite pour vous.
          Tarification transparente, sans frais cachés.
        </p>

        <div className="mt-10 sm:mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
  );
};

export default PricingSection;
