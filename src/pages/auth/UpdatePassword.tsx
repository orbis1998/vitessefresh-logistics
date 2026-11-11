import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { VitaEyeIcon, VitaEyeOffIcon, VitaLoaderIcon } from "@/components/brand/VitaIcons";

const UpdatePassword = () => {
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    const type = hash.get("type") || query.get("type");
    const error = hash.get("error_description") || query.get("error_description") || query.get("error");

    if (error) {
      setInvalid(true);
      setReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session || (type && type !== "recovery")) {
        // Recovery links often land with a session already established by detectSessionInUrl.
        if (!data.session) setInvalid(true);
      }
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setInvalid(false);
        setReady(true);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      toast({ title: "Mot de passe trop court", description: "Utilisez au moins 8 caractères.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Mise à jour impossible", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Mot de passe mis à jour", description: "Vous pouvez vous connecter avec le nouveau mot de passe." });
    await supabase.auth.signOut();
    navigate("/auth/login", { replace: true });
  };

  if (!ready) {
    return (
      <AuthLayout title="Réinitialisation">
        <div className="flex justify-center py-8">
          <VitaLoaderIcon className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AuthLayout>
    );
  }

  if (invalid) {
    return (
      <AuthLayout title="Lien invalide">
        <p className="text-sm text-muted-foreground -mt-4 mb-6">
          Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau.
        </p>
        <Link to="/auth/forgot-password">
          <Button className="w-full" size="lg">Demander un nouveau lien</Button>
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Nouveau mot de passe">
      <p className="text-sm text-muted-foreground -mt-4 mb-6">
        Choisissez un nouveau mot de passe pour sécuriser votre compte Vita Express.
      </p>
      <form onSubmit={save} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-password">Nouveau mot de passe</Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 pr-11"
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Masquer" : "Afficher"}
            >
              {showPassword ? <VitaEyeOffIcon className="h-4 w-4" /> : <VitaEyeIcon className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
          <Input
            id="confirm-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-12"
            minLength={8}
            required
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Enregistrement…" : "Enregistrer le mot de passe"}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default UpdatePassword;
