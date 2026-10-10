import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AuthLayout from "@/components/auth/AuthLayout";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import PhoneAuth from "@/components/auth/PhoneAuth";
import { normalizeDrcPhone } from "@/lib/flexpay";
import { cn } from "@/lib/utils";

const scorePassword = (password: string) => {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
};

const STRENGTH = [
  { label: "Trop court", className: "bg-muted" },
  { label: "Faible", className: "bg-destructive" },
  { label: "Moyen", className: "bg-orange-500" },
  { label: "Fort", className: "bg-primary" },
  { label: "Excellent", className: "bg-emerald-500" },
];

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneLocal: "",
    password: "",
    confirmPassword: "",
  });
  const [honeypot, setHoneypot] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const strength = scorePassword(formData.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (honeypot.trim()) {
      navigate("/auth/login");
      return;
    }

    if (strength < 2) {
      toast({
        title: "Mot de passe trop faible",
        description: "Utilisez au moins 8 caractères, avec lettres et chiffres.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: formData.fullName,
          phone: formData.phoneLocal ? normalizeDrcPhone(`243${formData.phoneLocal}`) : undefined,
        },
      },
    });
    setIsLoading(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Inscription réussie",
      description: "Vérifiez votre boîte mail pour confirmer votre compte.",
    });
    navigate("/auth/login");
  };

  return (
    <AuthLayout title="Inscription">
      <p className="text-sm text-muted-foreground -mt-4 mb-6">
        Compte avec votre numéro. Le code arrive sur WhatsApp.
      </p>
      <div className="space-y-4 mb-6">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nom complet</Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            value={formData.fullName}
            onChange={handleChange}
            className="h-12"
            required
          />
        </div>
        <PhoneAuth mode="register" fullName={formData.fullName} />
      </div>
      <GoogleAuthButton label="S'inscrire avec Google" />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-3 text-muted-foreground">ou par email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          className="absolute -left-[10000px] h-0 w-0 overflow-hidden"
          aria-hidden="true"
        >
          <label htmlFor="company_website">Site web</label>
          <input
            id="company_website"
            name="company_website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            className="h-12"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              className="h-12 pr-10"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {formData.password.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="grid grid-cols-4 gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={cn(
                      "h-1 rounded-full transition-colors",
                      strength >= level ? STRENGTH[strength].className : "bg-muted"
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{STRENGTH[strength].label}</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="h-12"
            required
          />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
          {isLoading ? "Création..." : "Créer mon compte"}
        </Button>
      </form>

      <p className="text-center mt-6 text-sm text-muted-foreground">
        Déjà inscrit ?{" "}
        <Link to="/auth/login" className="text-primary font-medium hover:underline">
          Se connecter
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
