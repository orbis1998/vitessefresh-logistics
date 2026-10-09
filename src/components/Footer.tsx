import { Link } from "react-router-dom";
import { VitaWordmark } from "@/components/brand/VitaWordmark";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0d0d0d] text-white border-t border-white/10">
      <div className="container-custom py-12 sm:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          <div className="col-span-2 space-y-4">
            <Link to="/" aria-label="Vita Express">
              <VitaWordmark className="text-lg text-white" />
            </Link>
            <p className="text-white/55 text-sm leading-relaxed max-w-xs">
              Votre partenaire de confiance pour la livraison rapide et fiable à Kinshasa.
              Service premium, tarifs compétitifs.
            </p>
            <p className="text-sm text-white/45 leading-relaxed">
              Boulevard du 30 Juin, Gombe<br />
              Kinshasa, RDC<br />
              contact@vita-express.cd
            </p>
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold mb-4">Produit</h4>
            <ul className="space-y-2.5 text-sm text-white/55">
              <li><Link to="/services" className="hover:text-white">Services</Link></li>
              <li><Link to="/forfaits" className="hover:text-white">Forfaits</Link></li>
              <li><Link to="/tracking" className="hover:text-white">Suivi de colis</Link></li>
              <li><Link to="/auth/register" className="hover:text-white">Commander</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold mb-4">Entreprise</h4>
            <ul className="space-y-2.5 text-sm text-white/55">
              <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link to="/auth/register" className="hover:text-white">Créer un compte</Link></li>
              <li><Link to="/auth/login" className="hover:text-white">Espace client</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold mb-4">Légal</h4>
            <ul className="space-y-2.5 text-sm text-white/55">
              <li><Link to="/mentions-legales" className="hover:text-white">Mentions légales</Link></li>
              <li><Link to="/confidentialite" className="hover:text-white">Politique de confidentialité</Link></li>
              <li><Link to="/cgu" className="hover:text-white">Conditions de transport</Link></li>
              <li><Link to="/cookies" className="hover:text-white">Politique cookies</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-white/40">
          <p>© {year} Vita Express. Tous droits réservés.</p>
          <p>Conçu à Kinshasa, RDC</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
