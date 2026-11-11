import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyRoles, getPostAuthPath } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { normalizeDrcPhone } from "@/lib/flexpay";
import { VitaEyeIcon, VitaEyeOffIcon } from "@/components/brand/VitaIcons";

type Props = {
  mode: "login" | "register";
  fullName?: string;
};

const PhoneAuth = ({ mode, fullName = "" }: Props) => {
  const [local, setLocal] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { refreshRoles } = useAuth();

  const phone = normalizeDrcPhone(`243${local.replace(/\D/g, "").slice(0, 9)}`);

  const validateCredentials = () => {
    if (mode === "register" && !fullName.trim()) {
      toast({ title: "Nom complet requis", variant: "destructive" });
      return false;
    }
    if (local.replace(/\D/g, "").length !== 9) {
      toast({ title: "Numéro incomplet", description: "Saisissez 9 chiffres, sans le 0.", variant: "destructive" });
      return false;
    }
    if (password.length < 8) {
      toast({ title: "Mot de passe trop court", description: "Utilisez au moins 8 caractères.", variant: "destructive" });
      return false;
    }
    if (mode === "register" && password !== confirmPassword) {
      toast({ title: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return false;
    }
    return true;
  };

  const request = async () => {
    if (!validateCredentials()) return;
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("request-phone-otp", {
      body: { phone, mode: "register" },
    });
    setLoading(false);
    if (error || data?.error) {
      toast({ title: "Envoi impossible", description: data?.error || error?.message, variant: "destructive" });
      return;
    }
    setSent(true);
    toast({
      title: "Code envoyé",
      description: "Confirmez une seule fois votre numéro sur WhatsApp ou par SMS.",
    });
  };

  const login = async () => {
    if (!validateCredentials()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: `${phone}@phone.vitaexpress.cd`,
      password,
    });
    if (error) {
      setLoading(false);
      toast({
        title: "Connexion impossible",
        description: "Numéro ou mot de passe incorrect.",
        variant: "destructive",
      });
      return;
    }
    const roles = await fetchMyRoles();
    await refreshRoles();
    setLoading(false);
    navigate(getPostAuthPath(roles), { replace: true });
  };

  const verify = async () => {
    if (code.trim().length < 4) {
      toast({ title: "Code incomplet", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("verify-phone-otp", {
      body: { phone, code: code.trim(), full_name: fullName, password, mode: "register" },
    });
    if (error || data?.error || !data?.token_hash) {
      setLoading(false);
      toast({ title: "Code incorrect", description: data?.error || error?.message, variant: "destructive" });
      return;
    }
    const { error: authErr } = await supabase.auth.verifyOtp({
      type: "email",
      token_hash: data.token_hash,
    });
    if (authErr) {
      setLoading(false);
      toast({ title: "Session", description: authErr.message, variant: "destructive" });
      return;
    }
    const roles = await fetchMyRoles();
    await refreshRoles();
    setLoading(false);
    navigate(getPostAuthPath(roles), { replace: true });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone-auth">Téléphone</Label>
        <div className="flex h-12 rounded-md border border-input overflow-hidden focus-within:ring-2 focus-within:ring-ring">
          <span className="flex items-center px-3 text-sm font-medium bg-muted/40 border-r border-input shrink-0">
            +243
          </span>
          <input
            id="phone-auth"
            type="tel"
            inputMode="numeric"
            placeholder="812 345 678"
            value={local.replace(/(\d{3})(\d{3})(\d{0,3})/, (_, a, b, c) => [a, b, c].filter(Boolean).join(" "))}
            onChange={(e) => setLocal(e.target.value.replace(/\D/g, "").slice(0, 9))}
            className="flex-1 bg-transparent px-3 text-base outline-none"
            disabled={sent}
          />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor={`phone-password-${mode}`}>
            Mot de passe
          </Label>
          {mode === "login" && (
            <Link to="/auth/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Oublié ?
            </Link>
          )}
        </div>
        <div className="relative">
          <Input
            id={`phone-password-${mode}`}
            type={showPassword ? "text" : "password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-12 pr-11"
            minLength={8}
            disabled={sent}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPassword ? <VitaEyeOffIcon className="h-4 w-4" /> : <VitaEyeIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {mode === "register" && !sent && (
        <div className="space-y-2">
          <Label htmlFor="phone-password-confirm">Confirmer le mot de passe</Label>
          <Input
            id="phone-password-confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="h-12"
            minLength={8}
          />
        </div>
      )}
      {sent && (
        <div className="space-y-2">
          <Label htmlFor="otp-auth">Code reçu</Label>
          <Input
            id="otp-auth"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="h-12 tracking-[0.4em] text-center text-lg"
            placeholder="••••••"
          />
        </div>
      )}
      <Button size="lg" className="w-full" disabled={loading} onClick={mode === "login" ? login : sent ? verify : request}>
        {loading
          ? "…"
          : mode === "login"
            ? "Se connecter"
            : sent
              ? "Créer mon compte"
              : "Recevoir le code"}
      </Button>
      {sent && (
        <button type="button" className="w-full text-xs text-muted-foreground" onClick={() => setSent(false)}>
          Changer de numéro
        </button>
      )}
    </div>
  );
};

export default PhoneAuth;
