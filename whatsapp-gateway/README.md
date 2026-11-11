# WhatsApp gateway Vita Express

Service Node (WhatsApp **Cloud API** Meta) qui vide la table `notifications` (canal `whatsapp`, statut `pending`). Ce n’est pas une Edge Function Supabase.

## Variables d’environnement (Railway ou local)

| Variable | Rôle |
|----------|------|
| `SUPABASE_URL` | URL du projet |
| `SUPABASE_SERVICE_ROLE_KEY` | lecture/écriture outbox (service role) |
| `WA_ACCESS_TOKEN` | Token permanent Meta Business |
| `WA_PHONE_NUMBER_ID` | ID du numéro WhatsApp Business |
| `WA_TEMPLATE_OTP` | (optionnel) nom du template Meta pour OTP auth / remise |
| `PORT` | défaut `8080` — healthcheck `GET /health` |

Option SMS secours : `TWILIO_*` (si branché plus tard).

## Meta (une fois)

1. [developers.facebook.com](https://developers.facebook.com) → app **Business** → produit **WhatsApp**.
2. Ajouter un numéro, vérifier l’entreprise si demandé.
3. Créer un template **authentication** ou **utility** en français (ex. code OTP) et noter son nom dans `WA_TEMPLATE_OTP`.
4. Générer un token système avec droit `whatsapp_business_messaging` → `WA_ACCESS_TOKEN`.
5. Copier **Phone number ID** → `WA_PHONE_NUMBER_ID`.

## Déploiement Railway

1. Nouveau service, repo ou dossier `whatsapp-gateway`, build via `Dockerfile`.
2. Renseigner les variables ci-dessus.
3. Vérifier `https://<service>/health` → `{ "ok": true, "cloud": true }`.
4. Dans l’admin Vita → **WhatsApp** : les lignes `pending` passent à `sent` en ~8 s.

## Local

```bash
cd whatsapp-gateway
npm install
set SUPABASE_URL=...
set SUPABASE_SERVICE_ROLE_KEY=...
set WA_ACCESS_TOKEN=...
set WA_PHONE_NUMBER_ID=...
npm start
```

Ne journalisez jamais le corps d’un OTP en clair. Le gateway logue seulement téléphone / préfixe d’`event_key`.
