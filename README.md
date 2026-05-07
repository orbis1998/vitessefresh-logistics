# Vita Express - Plateforme de Livraison Moderne

## 🚀 Vue d'ensemble

Vita Express est une plateforme de livraison moderne construite pour le marché de Kinshasa. Elle connecte particuliers, commerçants et entreprises à un réseau de livreurs vérifiés avec suivi GPS en temps réel.

## ✨ Fonctionnalités Clés

- 🚚 **Livraison Express** - Service rapide dans toute Kinshasa
- 📍 **Suivi GPS Temps Réel** - Suivez vos colis en direct
- 📱 **Application Multi-rôles** - Client, Livreur, Admin
- 💳 **Paiement Flexible** - À la livraison ou forfaits prépayés
- 🔒 **Sécurité Avancée** - Authentification robuste et protection des données
- 📊 **Analytics Dashboard** - Statistiques détaillées et rapports

## 🛠 Stack Technique

### Frontend
- **Framework**: React 18.3.1 avec TypeScript
- **Build Tool**: Vite 5.4.19
- **Styling**: Tailwind CSS 3.4.17 avec design system personnalisé
- **UI Components**: shadcn/ui (Radix UI + variants)
- **Routing**: React Router DOM 6.30.1
- **State Management**: React Query (TanStack Query) 5.83.0
- **Forms**: React Hook Form 7.61.1 avec Zod validation
- **Animations**: Framer Motion 12.23.26

### Backend & Database
- **BaaS**: Supabase 2.105.0 (PostgreSQL + Auth + Real-time)
- **Authentication**: Supabase Auth avec rôles personnalisés
- **Maps**: Mapbox GL 3.22.0 pour la géolocalisation

### Development Tooling
- **Package Manager**: npm/Bun
- **Linting**: ESLint 9.32.0
- **Type Checking**: TypeScript 5.8.3

## 📁 Structure du Projet

```
src/
├── components/          # Composants réutilisables
│   ├── ui/             # Composants UI shadcn/ui
│   ├── home/           # Composants page d'accueil
│   └── layouts/        # Layouts applicatifs
├── pages/              # Pages par route
│   ├── auth/           # Authentification
│   ├── dashboard/      # Pages client
│   ├── livreur/        # Pages livreur
│   └── admin/          # Pages admin
├── hooks/              # Hooks personnalisés
├── lib/                # Utilitaires et validation
├── integrations/       # Intégrations Supabase
└── assets/             # Images et ressources statiques
```

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+ et npm
- Un compte Supabase

### Installation

```bash
# Cloner le projet
git clone https://github.com/your-username/vitessefresh-logistics.git
cd vitessefresh-logistics

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés Supabase

# Lancer le serveur de développement
npm run dev
```

L'application sera disponible sur `http://localhost:8080`

## 🔧 Configuration

### Variables d'Environnement

```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_PUBLISHABLE_KEY=votre_clé_publique
VITE_SUPABASE_PROJECT_ID=votre_id_projet
VITE_MAPBOX_TOKEN=votre_token_mapbox
```

### Configuration Supabase

1. Créer un nouveau projet Supabase
2. Exécuter les migrations depuis `supabase/migrations/`
3. Configurer les RLS policies
4. Créer les fonctions RPC nécessaires

## 📖 Documentation

- [Documentation API](./docs/API.md) - Référence complète de l'API
- [Guide de Déploiement](./docs/DEPLOYMENT.md) - Instructions de déploiement
- [Architecture](./docs/ARCHITECTURE.md) - Architecture technique détaillée
- [Sécurité](./docs/SECURITY.md) - Politiques de sécurité

## 🎯 Déploiement

### Production

```bash
# Build pour production
npm run build

# Preview du build
npm run preview
```

### Docker

```bash
# Build l'image Docker
docker build -t vita-express .

# Run le container
docker run -p 8080:8080 vita-express
```

### Vercel (Recommandé)

1. Connecter le repo GitHub à Vercel
2. Configurer les variables d'environnement
3. Déployer automatiquement sur chaque push

## 🔐 Sécurité

- **Authentification**: JWT tokens avec expiration
- **Authorization**: Rôles granulaires (client/livreur/admin)
- **Validation**: Input validation avec Zod
- **Rate Limiting**: Protection contre les abus
- **CSRF Protection**: Tokens anti-CSRF
- **XSS Prevention**: Nettoyage des entrées utilisateur

## 📊 Architecture des Rôles

### Client
- Dashboard personnel
- Création de commandes
- Suivi des livraisons
- Historique des commandes

### Livreur
- Tableau de bord livreur
- Consultation des courses disponibles
- Gestion des livraisons assignées
- Mise à jour du statut en temps réel

### Admin
- Vue d'ensemble administrative
- Gestion des utilisateurs et livreurs
- Analytics et rapports
- Configuration système

## 🧪 Tests

```bash
# Lancer les tests unitaires
npm run test

# Tests avec coverage
npm run test:coverage

# Tests E2E
npm run test:e2e
```

## 🤝 Contributeurs

Ce projet suit le [Contributor Covenant](./docs/CODE_OF_CONDUCT.md) pour garantir un environnement inclusif.

## 📄 Licence

Ce projet est sous licence MIT - voir [LICENSE](LICENSE) pour plus de détails.

## 📞 Support

- **Email**: support@vitaexpress.com
- **Documentation**: https://docs.vitaexpress.com
- **Statut API**: https://status.vitaexpress.com
- **Issues**: GitHub Issues

## 🗺 Roadmap

- [ ] Application mobile native
- [ ] Intégration avec plus de services de paiement
- [ ] Expansion dans d'autres villes congolaises
- [ ] API publique pour les partenaires
- [ ] Livraison internationale

---

**Vita Express** - La livraison réinventée pour Kinshasa 🚀
