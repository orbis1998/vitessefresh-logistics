# WhatsApp gateway Vita Express

Serveur Node (whatsapp-web.js). Pas une Edge Function.

```bash
cd whatsapp-gateway
npm install
set SUPABASE_URL=...
set SUPABASE_SERVICE_ROLE_KEY=...
npm start
```

Scanner le QR avec le numéro business. Les lignes `whatsapp_messages` en `pending` partent ensuite (OTP, colis livré).
