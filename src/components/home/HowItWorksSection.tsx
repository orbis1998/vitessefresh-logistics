import type { ReactNode } from "react";
import {
  ArrowRight,
  Banknote,
  Calculator,
  CheckCircle2,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import { useInView } from "@/hooks/useInView";
import { VitaWordmark } from "@/components/brand/VitaWordmark";

const HowItWorksSection = () => {
  const { ref, visible } = useInView<HTMLElement>(0.12);

  return (
    <section ref={ref} className="py-20 sm:py-28 bg-[#0d0d0d] overflow-hidden">
      <div className="container-custom">
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-medium">Le parcours</p>
        <h2 className="mt-3 font-heading text-3xl sm:text-4xl font-bold text-white max-w-lg">
          Simple comme 1-2-3
        </h2>
        <p className="mt-4 text-white/55 text-base sm:text-lg max-w-xl">
          Trois gestes. Le prix avant de valider. La moto sur la carte jusqu’à la porte.
        </p>

        <div className="mt-12 sm:mt-16 grid md:grid-cols-3 gap-12 md:gap-6 lg:gap-8">
          <Step
            visible={visible}
            delay="0ms"
            n="1"
            title="Indiquez vos adresses"
            copy="Saisissez le ramassage, ou utilisez votre position. Cliquez la carte pour poser la livraison exactement."
          >
            <Screen1 />
          </Step>
          <Step
            visible={visible}
            delay="120ms"
            n="2"
            title="Confirmez votre commande"
            copy="Même écran que dans l’espace client : distance, prix, destinataire, paiement, puis confirmation."
          >
            <Screen2 />
          </Step>
          <Step
            visible={visible}
            delay="240ms"
            n="3"
            title="Suivez en direct"
            copy="Un livreur prend la course. Vous voyez la moto jusqu’à ce que le sachet soit dans les mains."
          >
            <Screen3 />
          </Step>
        </div>
      </div>
    </section>
  );
};

const Step = ({
  n,
  title,
  copy,
  children,
  visible,
  delay,
}: {
  n: string;
  title: string;
  copy: string;
  children: ReactNode;
  visible: boolean;
  delay: string;
}) => (
  <div
    className={`transition-all duration-700 ease-vita ${
      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
    }`}
    style={{ transitionDelay: visible ? delay : "0ms" }}
  >
    <div className="flex justify-center">{children}</div>
    <p className="mt-8 font-heading text-4xl font-bold text-primary">{n}</p>
    <h3 className="mt-3 font-heading text-xl font-semibold text-white">{title}</h3>
    <p className="mt-3 text-white/55 leading-relaxed text-sm sm:text-base">{copy}</p>
  </div>
);

const PhoneShell = ({ children, light }: { children: ReactNode; light?: boolean }) => (
  <div className="howit-phone">
    <div className={`howit-phone__bezel ${light ? "howit-phone__bezel--light" : ""}`}>
      <div className={`howit-status ${light ? "howit-status--light" : ""}`}>
        <span>12:41</span>
        <span className="howit-status__notch" />
        <span>5G ▮▮▮</span>
      </div>
      {children}
    </div>
  </div>
);

const PhoneMap = ({ className = "", children }: { className?: string; children?: ReactNode }) => (
  <div className={`relative overflow-hidden howit-mini-map ${className}`}>
    {children}
  </div>
);

const Screen1 = () => (
  <PhoneShell>
    <div className="howit-app p-0">
      <PhoneMap className="min-h-0 flex-1">
        <div className="absolute left-2 right-2 top-2 z-10 rounded-lg border border-white/10 bg-black/80 px-2.5 py-2 text-[9px] text-white">
          Cliquez sur la carte ou saisissez l’adresse de livraison
        </div>
      </PhoneMap>
      <div className="space-y-1.5 bg-[#101214] px-2.5 py-2.5">
        <div className="flex items-center gap-2 rounded-lg border-l-[3px] border-l-primary bg-white/5 px-2 py-1.5">
          <MapPin className="h-3 w-3 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-[8px] uppercase tracking-wider text-white/40">Point de retrait</p>
            <p className="truncate text-[10px] text-white">Bd du 30 Juin, Gombe</p>
          </div>
          <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-primary shrink-0" />
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-2 py-1.5 ring-1 ring-primary/20">
          <Package className="h-3 w-3 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-[8px] uppercase tracking-wider text-primary">Point de livraison</p>
            <p className="truncate text-[10px] text-white">7e rue, Limete</p>
          </div>
        </div>
      </div>
    </div>
  </PhoneShell>
);

const Screen2 = () => (
  <PhoneShell light>
    <div className="howit-app howit-app--order theme-app overflow-y-auto bg-background text-foreground">
      <p className="font-heading text-[11px] font-semibold">Nouvelle commande</p>
      <p className="text-[8px] text-muted-foreground">Livraison express à Kinshasa</p>

      <div className="mt-2.5 mb-2 flex items-center gap-1.5">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-1.5">
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${
                n < 3 ? "bg-primary/20 text-primary" : "bg-primary text-black"
              }`}
            >
              {n < 3 ? <CheckCircle2 className="h-3 w-3" /> : n}
            </div>
            {n < 3 && <div className="h-px w-4 bg-primary" />}
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-2.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[10px] font-medium">
            <Calculator className="h-3 w-3 text-primary" />
            Distance
          </span>
          <span className="text-[10px] font-bold">6,2 km</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between border-t border-primary/10 pt-1.5">
          <span className="flex items-center gap-1 text-[10px] font-medium">
            <Package className="h-3 w-3 text-primary" />
            Prix estimé
          </span>
          <span className="font-heading text-sm font-bold text-primary">4 200 FC</span>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <div>
          <p className="text-[7px] uppercase tracking-wider text-muted-foreground">Destinataire</p>
          <div className="mt-0.5 flex items-center gap-1 rounded-md border border-border bg-secondary px-1.5 py-1 text-[10px]">
            <User className="h-2.5 w-2.5 text-muted-foreground" />
            Sarah Tshala
          </div>
        </div>
        <div>
          <p className="text-[7px] uppercase tracking-wider text-muted-foreground">Téléphone</p>
          <div className="mt-0.5 flex items-center gap-1 rounded-md border border-border bg-secondary px-1.5 py-1 text-[10px]">
            <Phone className="h-2.5 w-2.5 text-muted-foreground" />
            +243 81 4…
          </div>
        </div>
      </div>

      <p className="mt-2 text-[7px] uppercase tracking-wider text-muted-foreground">Type de colis</p>
      <div className="mt-0.5 rounded-md border border-border bg-secondary px-1.5 py-1 text-[10px]">Vêtements</div>

      <p className="mt-2 text-[7px] uppercase tracking-wider text-muted-foreground">Mode de paiement</p>
      <div className="mt-1 grid grid-cols-2 gap-1.5">
        <div className="rounded-lg border border-primary bg-primary/10 p-1.5 ring-1 ring-primary/30">
          <div className="flex items-center justify-between">
            <Banknote className="h-3 w-3 text-primary" />
            <CheckCircle2 className="h-3 w-3 text-primary" />
          </div>
          <p className="mt-1 text-[9px] font-semibold">Cash à la livraison</p>
        </div>
        <div className="rounded-lg border border-border bg-secondary p-1.5">
          <p className="text-[9px] font-semibold">Mobile Money</p>
          <p className="text-[7px] text-muted-foreground">FlexPay</p>
        </div>
      </div>

      <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-primary/20 bg-primary/5 p-1.5">
        <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
        <p className="text-[8px] leading-snug text-muted-foreground">
          <span className="font-medium text-foreground">Sécurité :</span> un code PIN à 4 chiffres sera demandé au livreur.
        </p>
      </div>

      <div className="mt-2 flex items-center justify-center gap-1 rounded-lg bg-primary py-2 text-[10px] font-bold tracking-wide text-primary-foreground">
        <ArrowRight className="h-3 w-3" />
        CONFIRMER LA COMMANDE
      </div>
    </div>
  </PhoneShell>
);

const Screen3 = () => (
  <PhoneShell>
    <div className="howit-app p-0">
      <div className="flex items-center justify-between px-3 pt-1">
        <VitaWordmark className="text-[11px] text-white" />
        <span className="flex items-center gap-1 text-[9px] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary howit-pulse" />
          En route
        </span>
      </div>
      <PhoneMap className="mx-2.5 mt-2 min-h-0 flex-1 rounded-xl">
        <span className="absolute left-[46%] top-[42%] howit-courier z-10" />
      </PhoneMap>
      <div className="m-2.5 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
        <div>
          <p className="text-[12px] text-white">Patrick · moto</p>
          <p className="text-[9px] text-white/40">Code de remise 4821</p>
        </div>
        <p className="font-heading text-sm text-primary">12 min</p>
      </div>
    </div>
  </PhoneShell>
);

export default HowItWorksSection;
