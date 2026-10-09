import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-16 sm:py-24 bg-primary">
      <div className="container-custom flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
        <div className="max-w-xl">
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground leading-tight">
            Prêt à révolutionner vos livraisons ?
          </h2>
          <p className="mt-4 text-primary-foreground/75 text-base sm:text-lg">
            Rejoignez des centaines d'entreprises et particuliers qui font confiance
            à Vita Express pour leurs livraisons quotidiennes à Kinshasa.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link to="/auth/register" className="w-full sm:w-auto">
            <Button variant="secondary" size="xl" className="w-full">
              Créer un compte gratuit
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/contact" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="xl"
              className="w-full border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground hover:text-primary"
            >
              Parler à un conseiller
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
