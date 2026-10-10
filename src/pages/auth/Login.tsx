import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { fetchMyRoles, getPostAuthPath } from "@/lib/auth";
import AuthLayout from "@/components/auth/AuthLayout";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import PhoneAuth from "@/components/auth/PhoneAuth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailMode, setEmailMode] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { refreshRoles } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setIsLoading(false);
      toast({
        title: "Connexion impossible",
        description: error.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect."
          : error.message,
        variant: "destructive",
      });
      return;
    }

    const roles = await fetchMyRoles();
    await refreshRoles();
    setIsLoading(false);
    toast({ title: "Connexion réussie", description: "Bienvenue." });
    navigate(getPostAuthPath(roles), { replace: true });
  };

  return (
    <AuthLayout title="Connexion">
      <p className="text-sm text-muted-foreground -mt-4 mb-6">
        Un numéro WhatsApp suffit. Pas besoin de Gmail.
      </p>
      <PhoneAuth mode="login" />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <button type="button" className="bg-card px-3 text-muted-foreground" onClick={() => setEmailMode((v) => !v)}>
            {emailMode ? "revenir au téléphone" : "email, Google"}
          </button>
        </div>
      </div>

      {emailMode && (
        <>
          <GoogleAuthButton label="Continuer avec Google" />
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12" required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="password">Mot de passe</Label>
                <Link to="/auth/forgot-password" className="text-sm text-primary hover:underline">Oublié ?</Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label={showPassword ? "Masquer" : "Afficher"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </>
      )}

      <p className="text-center mt-6 text-sm text-muted-foreground">
        Pas de compte ?{" "}
        <Link to="/auth/register" className="text-primary font-medium hover:underline">Créer un compte</Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
