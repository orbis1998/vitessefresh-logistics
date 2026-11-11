import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function digits(phone: string) {
  let value = String(phone || "").replace(/\D/g, "");
  if (value.startsWith("0")) value = value.slice(1);
  if (value.length === 9) value = `243${value}`;
  return value;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const body = await req.json().catch(() => ({}));
  const phone = digits(body.phone);
  const redirectTo = String(body.redirect_to || "");
  if (!/^243\d{9}$/.test(phone)) return json({ error: "Numéro RDC invalide" }, 400);

  let redirect: URL;
  try {
    redirect = new URL(redirectTo);
    if (!["http:", "https:"].includes(redirect.protocol)) throw new Error("protocol");
  } catch {
    return json({ error: "Adresse de redirection invalide" }, 400);
  }
  const configuredOrigin = Deno.env.get("PUBLIC_SITE_URL");
  const allowedOrigins = new Set(
    [
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      configuredOrigin,
      "https://vitessefresh-logistics.vercel.app",
    ]
      .filter(Boolean)
      .map((value) => new URL(value!).origin),
  );
  if (!allowedOrigins.has(redirect.origin)) {
    return json({ error: "Domaine de récupération non autorisé" }, 400);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: account } = await admin
    .from("users")
    .select("id, email")
    .eq("phone", phone)
    .maybeSingle();

  // Always return the same response to avoid exposing registered phone numbers.
  if (!account?.email) return json({ ok: true });

  const { data: link, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: account.email,
    options: { redirectTo: redirect.toString() },
  });
  if (error || !link?.properties?.action_link) {
    return json({ error: "Lien de récupération impossible" }, 400);
  }

  await admin.rpc("enqueue_notification", {
    p_event_key: `password-reset-${account.id}-${Date.now()}`,
    p_phone: phone,
    p_body:
      `Vita Express : ouvrez ce lien sécurisé pour modifier votre mot de passe : ` +
      `${link.properties.action_link} — ignorez ce message si vous n’avez rien demandé.`,
    p_order_id: null,
    p_channel: "whatsapp",
  });

  return json({ ok: true });
});
