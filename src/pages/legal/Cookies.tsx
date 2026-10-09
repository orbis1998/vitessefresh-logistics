import LegalPage from "./LegalPage";

const Cookies = () => (
  <LegalPage title="Politique cookies" updated="9 octobre 2026">
    <p>
      Vita Express utilise des cookies et un stockage local. Une bannière vous permet
      d’accepter ou de refuser les cookies non essentiels. Le refus est aussi simple
      que l’acceptation : un clic, sans parcours supplémentaire.
    </p>
    <h2>Cookies essentiels (toujours actifs)</h2>
    <p>
      Session de connexion (Supabase Auth), protection CSRF/PKCE, mémorisation du choix
      de consentement. Sans eux, le compte et les commandes ne fonctionnent pas.
    </p>
    <h2>Cookies de mesure (optionnels)</h2>
    <p>
      Uniquement si vous cliquez sur « Accepter ». Ils servent à compter les visites de
      pages publiques. Aucun identifiant publicitaire n’est vendu à des tiers.
    </p>
    <h2>Modifier votre choix</h2>
    <p>
      Effacez la clé <code>vita_cookie_consent</code> dans le stockage local de votre
      navigateur, ou contactez contact@vita-express.cd. Un nouveau passage sur le site
      réaffiche la bannière.
    </p>
  </LegalPage>
);

export default Cookies;
