import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div>
        <p className="text-primary font-heading font-semibold">404</p>
        <h1 className="mt-3 text-4xl font-heading font-bold">Cette page n'existe pas.</h1>
        <p className="mt-3 text-muted-foreground">L'adresse demandée n'est pas sur Vita Express.</p>
        <Link to="/" className="inline-block mt-8 text-sm font-medium text-primary hover:underline">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
