import { useEffect, useState } from "react";
import { useInView } from "@/hooks/useInView";

const features = [
  {
    n: "01",
    title: "Livraison Express",
    description: "Vos colis livrés en moins de 45 minutes dans toutes les zones de Kinshasa.",
  },
  {
    n: "02",
    title: "Suivi en temps réel",
    description: "Suivez votre livreur sur la carte et recevez une alerte à chaque étape.",
  },
  {
    n: "03",
    title: "Ouvert 7j/7",
    description: "Les courses partent le jour, le soir, le dimanche. Kinshasa ne s’arrête pas.",
  },
  {
    n: "04",
    title: "Paiement flexible",
    description: "Payez à la livraison ou avec un forfait prépayé, sans surprise sur le tarif.",
  },
  {
    n: "05",
    title: "Colis assurés",
    description: "Chaque envoi est protégé. En cas de souci, on traite, on ne disparaît pas.",
  },
  {
    n: "06",
    title: "Support dédié",
    description: "Une équipe à Kinshasa, joignable quand la course bloque ou change de destination.",
  },
];

const FeaturesSection = () => {
  const { ref, visible } = useInView<HTMLElement>();
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Africa/Kinshasa",
        })
      );
    tick();
    const id = window.setInterval(tick, 30000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section ref={ref} className="py-20 sm:py-28 bg-background">
      <div className="container-custom">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div
            className={`lg:col-span-5 lg:sticky lg:top-28 transition-all duration-700 ease-vita ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-medium">Pourquoi Vita</p>
            <h2 className="mt-3 font-heading text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-tight">
              La livraison réinventée pour Kinshasa
            </h2>
            <p className="mt-6 text-muted-foreground text-base sm:text-lg leading-relaxed max-w-md">
              Vita Express combine la carte, le tarif et un livreur près de chez vous.
              Pas un logiciel importé : un réseau qui connaît Gombe, Lemba, Limete.
            </p>

            <div className="mt-8 rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-1.5">
              <div className="rounded-[1.1rem] bg-[#141414] p-5 sm:p-6">
                <div className="flex items-center justify-between text-xs text-white/45">
                  <span>Dispatch · Kinshasa</span>
                  <span className="tabular-nums text-primary">{clock || "--:--"}</span>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    ["Gombe → Limete", "En route", "12 min"],
                    ["Ngaliema → Kintambo", "Ramassage", "4 min"],
                    ["Lemba → Matete", "Assigné", "18 min"],
                  ].map(([route, state, eta]) => (
                    <div key={route} className="flex items-center justify-between gap-3 border-t border-white/10 pt-3 first:border-0 first:pt-0">
                      <div>
                        <p className="text-sm text-white">{route}</p>
                        <p className="text-xs text-white/40 mt-0.5">{state}</p>
                      </div>
                      <span className="text-xs text-primary tabular-nums">{eta}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <ul className="lg:col-span-7">
            {features.map((feature, i) => (
              <li
                key={feature.n}
                className={`group flex gap-4 sm:gap-6 py-5 sm:py-6 border-t border-white/10 first:border-t-0 transition-all duration-700 ease-vita ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
                style={{ transitionDelay: visible ? `${120 + i * 70}ms` : "0ms" }}
              >
                <span className="font-heading text-sm text-primary/80 tabular-nums pt-1">{feature.n}</span>
                <div>
                  <h3 className="font-heading text-lg sm:text-xl font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-muted-foreground leading-relaxed text-sm sm:text-base max-w-md">
                    {feature.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
