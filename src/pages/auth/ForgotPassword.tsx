import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { normalizeDrcPhone } from "@/lib/flexpay";
import { VitaArrowIcon, VitaMailIcon, VitaPhoneIcon } from "@/components/brand/VitaIcons";

const ForgotPassword = () => {
  const [method, setMethod] = useState<"phone" | "email" | null>(null);
  const [email, setEmail] = useState("");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const sendLink = async () => {
    const redirectTo = `${window.location.origin}/auth/update-password`;
    setLoading(true);

    if (method === "email") {
      if (!email.trim()) {
        setLoading(false);
        toast({ title: "Email requis", variant: "destructive" });
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo,
      });
      setLoading(false);
      if (error) {
        toast({ title: "Envoi impossible", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      const digits = phoneLocal.replace(/\D/g, "");
      if (digits.length !== 9) {
        setLoading(false);
        toast({ title: "Numéro incomplet", description: "Saisissez 9 chiffres, sans le 0.", variant: "destructive" });
        return;
      }
      const { data, error } = await supabase.functions.invoke("request-password-reset", {
        body: {
          phone: normalizeDrcPhone(`243${digits}`),
          redirect_to: redirectTo,
        },
      });
      setLoading(false);
      if (error || data?.error) {
        toast({ title: "Envoi impossible", description: data?.error || error?.message, variant: "destructive" });
        return;
      }
    }

    setSent(true);
  };

  return (
    <AuthLayout title="Mot de passe oublié">
      {sent ? (
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {method === "phone" ? <VitaPhoneIcon className="h-6 w-6" /> : <VitaMailIcon className="h-6 w-6" />}
          </div>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            Si un compte existe, un lien sécurisé vient d’être envoyé. Ouvrez-le pour choisir un nouveau mot de passe.
          </p>
          <Link to="/auth/login" className="mt-7 block">
            <Button variant="outline" className="w-full">Revenir à la connexion</Button>
          </Link>
        </div>
      ) : !method ? (
        <div>
          <p className="text-sm text-muted-foreground -mt-4 mb-6">
            Choisissez comment recevoir le lien de réinitialisation.
          </p>
          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => setMethod("phone")}
              className="group flex items-center gap-4 rounded-xl border border-border bg-background p-4 text-left transition-colors hover:border-primary/50"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <VitaPhoneIcon className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">Numéro WhatsApp</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">Recevoir le lien par message</span>
              </span>
              <VitaArrowIcon className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </button>
            <button
              type="button"
              onClick={() => setMethod("email")}
              className="group flex items-center gap-4 rounded-xl border border-border bg-background p-4 text-left transition-colors hover:border-primary/50"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <VitaMailIcon className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">Compte Gmail</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">Recevoir le lien dans votre boîte mail</span>
              </span>
              <VitaArrowIcon className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </button>
          </div>
          <p className="mt-7 text-center text-sm text-muted-foreground">
            <Link to="/auth/login" className="font-medium text-primary hover:underline">Revenir à la connexion</Link>
          </p>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => setMethod(null)}
            className="mb-6 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <VitaArrowIcon className="h-3.5 w-3.5 rotate-180" />
            Changer de méthode
          </button>
          {method === "email" ? (
            <div className="space-y-2">
              <Label htmlFor="recovery-email">Adresse Gmail ou email</Label>
              <Input
                id="recovery-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12"
                placeholder="vous@gmail.com"
                required
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="recovery-phone">Numéro WhatsApp</Label>
              <div className="flex h-12 overflow-hidden rounded-md border border-input focus-within:ring-2 focus-within:ring-ring">
                <span className="flex shrink-0 items-center border-r border-input bg-muted/40 px-3 text-sm font-medium">+243</span>
                <input
                  id="recovery-phone"
                  type="tel"
                  inputMode="numeric"
                  value={phoneLocal.replace(/(\d{3})(\d{3})(\d{0,3})/, (_, a, b, c) => [a, b, c].filter(Boolean).join(" "))}
                  onChange={(event) => setPhoneLocal(event.target.value.replace(/\D/g, "").slice(0, 9))}
                  className="min-w-0 flex-1 bg-transparent px-3 text-base outline-none"
                  placeholder="812 345 678"
                />
              </div>
            </div>
          )}
          <Button
            size="lg"
            className="mt-5 w-full"
            disabled={loading || (method === "email" && !email.trim())}
            onClick={sendLink}
          >
            {loading ? "Envoi…" : "Recevoir le lien"}
          </Button>
        </div>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
