import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: formData.fullName,
          phone: formData.phone,
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
    <div className="min-h-screen bg-muted/30 flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex flex-1 bg-secondary items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-lg text-center"
        >
          <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-yellow-lg">
            <Package className="w-12 h-12 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-poppins font-bold text-secondary-foreground mb-4">
            Rejoignez Vita Express
          </h2>
          <p className="text-secondary-foreground/70 text-lg">
            Créez votre compte en quelques minutes et commencez à utiliser 
            notre service de livraison premium à Kinshasa.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-4">
            <div className="bg-secondary-foreground/5 rounded-xl p-4">
              <p className="text-2xl font-bold text-primary">24</p>
              <p className="text-sm text-secondary-foreground/70">Zones</p>
            </div>
            <div className="bg-secondary-foreground/5 rounded-xl p-4">
              <p className="text-2xl font-bold text-primary">30min</p>
              <p className="text-sm text-secondary-foreground/70">Délai</p>
            </div>
            <div className="bg-secondary-foreground/5 rounded-xl p-4">
              <p className="text-2xl font-bold text-primary">24/7</p>
              <p className="text-sm text-secondary-foreground/70">Service</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Back Link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-yellow">
              <Package className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-poppins font-bold text-2xl">
              Vita<span className="text-primary">Express</span>
            </span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-poppins font-bold mb-2">Créer un compte</h1>
            <p className="text-muted-foreground">
              Inscrivez-vous pour commencer vos livraisons
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Jean Mbala"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="exemple@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+243 XXX XXX XXX"
                  value={formData.phone}
                  onChange={handleChange}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 pr-10 h-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? "Création en cours..." : "Créer mon compte"}
            </Button>

          </form>

          {/* Login Link */}
          <p className="text-center mt-8 text-muted-foreground">
            Déjà inscrit ?{" "}
            <Link to="/auth/login" className="text-primary font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
