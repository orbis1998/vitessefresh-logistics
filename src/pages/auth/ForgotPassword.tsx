import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/auth/AuthLayout";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
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
    <AuthLayout title={isSubmitted ? "Email envoyé" : "Mot de passe oublié"}>
      {!isSubmitted ? (
        <>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                required
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? "Envoi..." : "Envoyer le lien"}
            </Button>
          </form>
          <p className="text-center mt-6 text-sm text-muted-foreground">
            <Link to="/auth/login" className="text-primary font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            Un lien de réinitialisation a été envoyé à <strong className="text-foreground">{email}</strong>.
          </p>
          <Link to="/auth/login" className="block mt-6">
            <Button size="lg" className="w-full">Se connecter</Button>
          </Link>
        </>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
