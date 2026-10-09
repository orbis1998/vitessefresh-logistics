# WhatsApp gateway Vita Express

Adaptateur Node (`whatsapp-web.js`) de l’outbox `notifications`. Pas une Edge Function.
Une API Business pourra remplacer ce process plus tard : même table, même `event_key`.

```bash
cd whatsapp-gateway
npm install
set SUPABASE_URL=https://fppxpycgtevlugyiwbfb.supabase.co
set SUPABASE_SERVICE_ROLE_KEY=...
npm start
```

Scanner le QR avec le numéro business. Les lignes `notifications` en `pending` (canal `whatsapp`) partent ensuite.

Ne journalisez jamais le corps d’un OTP. Le gateway n’affiche que `otp` / l’`event_key`.
