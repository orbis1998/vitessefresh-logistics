import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function sha256Hex(value: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function digits(phone: string) {
  let d = String(phone || "").replace(/\D/g, "");
  if (d.startsWith("0")) d = d.slice(1);
  if (d.length === 9) d = `243${d}`;
  return d;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const body = await req.json().catch(() => ({}));
  const phone = digits(body.phone);
  if (!/^243\d{9}$/.test(phone)) return json({ error: "Numéro RDC invalide" }, 400);

  const { data: recent } = await admin
    .from("phone_auth_challenges")
    .select("created_at")
    .eq("phone", phone)
    .gte("created_at", new Date(Date.now() - 45_000).toISOString())
    .limit(1);
  if ((recent ?? []).length) return json({ error: "Patientez 45 secondes avant un nouveau code" }, 429);

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const hash = await sha256Hex(code);
  await admin.from("phone_auth_challenges").insert({
    phone,
    code_hash: hash,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });

  await admin.rpc("enqueue_notification", {
    p_event_key: `auth-${phone}-${Date.now()}`,
    p_phone: phone,
    p_body: `Vita Express : votre code de connexion est ${code}. Valable 10 minutes. Ne le partagez pas.`,
    p_order_id: null,
    p_channel: "whatsapp",
  });

  const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const twilioFrom = Deno.env.get("TWILIO_FROM");
  if (twilioSid && twilioToken && twilioFrom) {
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${twilioSid}:${twilioToken}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: `+${phone}`,
        From: twilioFrom,
        Body: `Vita Express : code ${code}`,
      }),
    }).catch(() => null);
  }

  return json({ ok: true, channel: twilioSid ? "whatsapp+sms" : "whatsapp" });
});
