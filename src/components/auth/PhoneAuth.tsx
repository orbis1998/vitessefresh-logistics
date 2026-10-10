import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyRoles, getPostAuthPath } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { normalizeDrcPhone } from "@/lib/flexpay";

type Props = {
  mode: "login" | "register";
  fullName?: string;
};

const PhoneAuth = ({ mode, fullName = "" }: Props) => {
  const [local, setLocal] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { refreshRoles } = useAuth();

  const phone = normalizeDrcPhone(`243${local.replace(/\D/g, "").slice(0, 9)}`);

  const request = async () => {
    if (local.replace(/\D/g, "").length < 9) {
      toast({ title: "Numéro incomplet", description: "9 chiffres, sans le 0.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("request-phone-otp", {
      body: { phone, full_name: fullName, mode },
    });
    setLoading(false);
    if (error || data?.error) {
      toast({ title: "Envoi impossible", description: data?.error || error?.message, variant: "destructive" });
      return;
    }
    setSent(true);
    toast({
      title: "Code envoyé",
      description: "Regardez WhatsApp (ou SMS). Valable 10 minutes.",
    });
  };

  const verify = async () => {
    if (code.trim().length < 4) {
      toast({ title: "Code incomplet", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("verify-phone-otp", {
      body: { phone, code: code.trim(), full_name: fullName },
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
      <Button size="lg" className="w-full" disabled={loading} onClick={sent ? verify : request}>
        {loading ? "…" : sent ? "Valider le code" : "Recevoir le code"}
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
