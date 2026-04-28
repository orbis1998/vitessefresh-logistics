import { Link } from "react-router-dom";
import { Package, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-poppins font-bold text-xl text-secondary-foreground">
                Vita<span className="text-primary">Express</span>
              </span>
            </Link>
            <p className="text-secondary-foreground/70 text-sm leading-relaxed">
              Votre partenaire de confiance pour la livraison rapide et fiable à Kinshasa.
              Service premium, tarifs compétitifs.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="w-10 h-10 bg-secondary-foreground/10 rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-secondary-foreground/10 rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-secondary-foreground/10 rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-secondary-foreground/10 rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-poppins font-semibold text-lg mb-4">Services</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/services" className="text-secondary-foreground/70 hover:text-primary transition-colors">
                  Livraison Express
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-secondary-foreground/70 hover:text-primary transition-colors">
                  Livraison Standard
                </Link>
              </li>
              <li>
                <Link to="/forfaits" className="text-secondary-foreground/70 hover:text-primary transition-colors">
                  Forfaits Entreprise
                </Link>
              </li>
              <li>
                <Link to="/suivi" className="text-secondary-foreground/70 hover:text-primary transition-colors">
                  Suivi en Temps Réel
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-poppins font-semibold text-lg mb-4">Support</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/faq" className="text-secondary-foreground/70 hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-secondary-foreground/70 hover:text-primary transition-colors">
                  Contactez-nous
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-secondary-foreground/70 hover:text-primary transition-colors">
                  Conditions d'utilisation
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-secondary-foreground/70 hover:text-primary transition-colors">
                  Politique de confidentialité
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-poppins font-semibold text-lg mb-4">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-secondary-foreground/70 text-sm">
                  Boulevard du 30 Juin, Kinshasa, RDC
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <span className="text-secondary-foreground/70 text-sm">
                  +243 XXX XXX XXX
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <span className="text-secondary-foreground/70 text-sm">
                  contact@vita-express.cd
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-secondary-foreground/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-secondary-foreground/50 text-sm">
              © {currentYear} Vita Express. Tous droits réservés.
            </p>
            <p className="text-secondary-foreground/50 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Conçu à Kinshasa, RDC
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
