import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VitaWordmark } from "@/components/brand/VitaWordmark";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { href: "/", label: "Accueil" },
    { href: "/services", label: "Services" },
    { href: "/forfaits", label: "Forfaits" },
    { href: "/tracking", label: "Suivi" },
    { href: "/contact", label: "Contact" },
  ];

  const isHome = location.pathname === "/";
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 ${
        isHome
          ? "bg-background/85 backdrop-blur-md border-b border-white/5 lg:bg-transparent lg:backdrop-blur-none lg:border-transparent"
          : "bg-background/90 backdrop-blur-md border-b border-border"
      }`}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          <Link to="/" aria-label="Vita Express">
            <VitaWordmark className="text-lg text-foreground" />
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <Link to="/auth/login">
              <Button variant="ghost" size="sm">
                Connexion
              </Button>
            </Link>
            <Link to="/auth/register">
              <Button size="sm">S'inscrire</Button>
            </Link>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-muted"
            aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden bg-background border-b border-border">
          <div className="container-custom py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2.5 rounded-md text-sm font-medium ${
                  isActive(link.href)
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 grid grid-cols-2 gap-2">
              <Link to="/auth/login" onClick={() => setIsOpen(false)}>
                <Button variant="outline" className="w-full">
                  Connexion
                </Button>
              </Link>
              <Link to="/auth/register" onClick={() => setIsOpen(false)}>
                <Button className="w-full">S'inscrire</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
