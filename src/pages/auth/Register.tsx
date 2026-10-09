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

const formatLocalPhone = (digits: string) => {
  const d = digits.slice(0, 9);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
};

const sanitizeLocalPhone = (raw: string) => {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("243")) digits = digits.slice(3);
  while (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 9);
};

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

    if (formData.phoneLocal.length < 9) {
      toast({
        title: "Numéro incomplet",
        description: "Entrez les 9 chiffres, sans le 0 devant.",
        variant: "destructive",
      });
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
          phone: normalizeDrcPhone(`243${formData.phoneLocal}`),
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
          <Label htmlFor="phone">Téléphone</Label>
          <div className="flex h-12 rounded-md border border-input overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background">
            <span className="flex items-center px-3 text-sm font-medium bg-muted/40 border-r border-input shrink-0 text-foreground">
              +243
            </span>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="812 345 678"
              value={formatLocalPhone(formData.phoneLocal)}
              onChange={(e) =>
                setFormData({ ...formData, phoneLocal: sanitizeLocalPhone(e.target.value) })
              }
              className="flex-1 bg-transparent px-3 text-base md:text-sm outline-none h-full placeholder:text-muted-foreground"
              required
            />
          </div>
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
