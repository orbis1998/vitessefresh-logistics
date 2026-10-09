import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeroMapScene from "./HeroMapScene";

const HeroSection = () => {
  return (
    <section className="relative min-h-[100svh] sm:min-h-[100dvh] lg:min-h-[108dvh] flex flex-col overflow-hidden">
      <HeroMapScene />

      <div className="container-custom relative z-10 flex min-h-[100svh] sm:min-h-[100dvh] lg:min-h-[108dvh] w-full flex-col justify-between pt-24 pb-8 sm:pt-28 sm:pb-10 lg:pb-12">
        <div className="max-w-xl pt-2 sm:pt-4">
          <h1 className="font-heading text-[2rem] leading-[1.12] sm:text-5xl lg:text-6xl xl:text-[4.15rem] font-bold text-white tracking-tight">
            Vos colis livrés en un éclair partout dans Kinshasa
          </h1>
        </div>

        <div className="max-w-xl mt-16 sm:mt-24 lg:mt-28">
          <p className="mb-6 sm:mb-7 text-[15px] sm:text-lg lg:text-xl text-white/80 max-w-[22rem] sm:max-w-md leading-[1.65]">
            Vita Express connecte particuliers, commerçants et entreprises.
            Suivi GPS en direct, tarifs transparents, service 7j/7.
          </p>
          <div className="flex flex-wrap items-center justify-start gap-2.5">
            <Link to="/auth/register">
              <Button variant="hero" size="lg" className="h-11 px-5 text-sm">
                Commander une livraison
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Link to="/forfaits">
              <Button variant="hero-outline" size="lg" className="h-11 px-5 text-sm">
                Voir nos forfaits
              </Button>
            </Link>
          </div>

          <div className="mt-8 sm:mt-10 grid grid-cols-3 gap-4 sm:gap-8 max-w-lg border-t border-white/15 pt-6">
            <div>
              <p className="font-heading text-xl sm:text-3xl font-bold text-white">30 min</p>
              <p className="text-[11px] sm:text-sm text-white/55 mt-1.5">Délai moyen</p>
            </div>
            <div>
              <p className="font-heading text-xl sm:text-3xl font-bold text-white">24</p>
              <p className="text-[11px] sm:text-sm text-white/55 mt-1.5">Zones à Kinshasa</p>
            </div>
            <div>
              <p className="font-heading text-xl sm:text-3xl font-bold text-white">100%</p>
              <p className="text-[11px] sm:text-sm text-white/55 mt-1.5">Sécurisé</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
