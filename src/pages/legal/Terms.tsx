import LegalPage from "./LegalPage";

const Terms = () => (
  <LegalPage title="Conditions générales de transport" updated="9 octobre 2026">
    <p>
      Ces conditions régissent le transport de colis par moto à Kinshasa proposé par Vita Express.
      En créant un compte ou en soumettant une demande, vous les acceptez.
    </p>
    <h2>Objet et périmètre</h2>
    <p>
      Vita Express organise la collecte et la remise de colis dans les zones desservies,
      affichées sur la carte opérationnelle. Hors zone, suspendue ou non desservie : aucune
      course n’est engagée.
    </p>
    <h2>Devis et prix</h2>
    <p>
      Le prix est calculé côté serveur (distance Mapbox Directions, à défaut Haversine) selon
      la grille tarifaire versionnée en vigueur. Le trafic n’est pas un facteur de prix. Le
      snapshot du devis est conservé sur la commande.
    </p>
    <h2>Colis admis</h2>
    <p>
      Poids indicatif max 20 kg, gabarit moto. Sont interdits : armes, explosifs, drogue,
      munitions, acides, carburants. Une déclaration inexacte peut entraîner un refus (contrôle rouge).
    </p>
    <h2>Contrôle VERT / JAUNE / ROUGE</h2>
    <p>
      Toute demande est évaluée par règles métier. VERT : éligible à acceptation humaine.
      JAUNE : validation manuelle. ROUGE : non attribuable. Aucune intelligence artificielle
      n’accepte automatiquement une course.
    </p>
    <h2>Annulation</h2>
    <p>
      Le client peut annuler tant que la course n’est pas en collecte. Après ramassage,
      l’annulation peut entraîner des frais de retour égaux au devis. Vita Express peut
      annuler pour motif de sécurité, zone ou contenu interdit, sans frais pour le client.
    </p>
    <h2>Réclamation</h2>
    <p>
      Toute réclamation (perte, avarie, retard anormal) se dépose via le support dans les
      24 heures suivant la tentative de remise. Une photo du colis et le numéro de course
      sont requis. L’indemnisation de base est plafonnée à la valeur déclarée, dans la limite
      de la couverture publiée.
    </p>
    <h2>Code de remise</h2>
    <p>
      Un code à usage unique est envoyé uniquement au destinataire (WhatsApp). Il n’est
      jamais affiché au livreur ni dans le back-office. La remise est constatée par la
      saisie du code, pas par une simple photo.
    </p>
    <h2>Données</h2>
    <p>
      Les photos de colis sont stockées dans un espace privé. Voir la politique de
      confidentialité et la politique cookies.
    </p>
  </LegalPage>
);

export default Terms;
