import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Package, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulated password reset - will be replaced with real auth
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      toast({
        title: "Email envoyé",
        description: "Vérifiez votre boîte de réception",
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Back Link */}
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la connexion
        </Link>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-yellow">
            <Package className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-poppins font-bold text-2xl">
            Vitesse<span className="text-primary">Fresh</span>
          </span>
        </div>

        {!isSubmitted ? (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-poppins font-bold mb-2">
                Mot de passe oublié ?
              </h1>
              <p className="text-muted-foreground">
                Entrez votre email et nous vous enverrons un lien pour 
                réinitialiser votre mot de passe.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="exemple@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? "Envoi en cours..." : "Envoyer le lien"}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-poppins font-bold mb-2">
              Email envoyé !
            </h1>
            <p className="text-muted-foreground mb-6">
              Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>. 
              Vérifiez votre boîte de réception.
            </p>
            <Link to="/auth/login">
              <Button size="lg" className="w-full">
                Retour à la connexion
              </Button>
            </Link>
          </div>
        )}

        {/* Register Link */}
        {!isSubmitted && (
          <p className="text-center mt-8 text-muted-foreground">
            Vous n'avez pas de compte ?{" "}
            <Link to="/auth/register" className="text-primary font-medium hover:underline">
              S'inscrire gratuitement
            </Link>
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
