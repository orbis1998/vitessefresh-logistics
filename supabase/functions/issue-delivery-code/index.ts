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

function generateNumericCode(length = 6) {
  const n = Math.pow(10, length);
  return String(Math.floor(Math.random() * (n - n / 10)) + n / 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = req.headers.get("Authorization") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const userClient = createClient(supabaseUrl, anon, { global: { headers: { Authorization: auth } } });
  const { data: userData } = await userClient.auth.getUser();
  if (!userData.user) return json({ error: "Non authentifié" }, 401);

  const admin = createClient(supabaseUrl, serviceKey);
  const body = await req.json().catch(() => ({}));
  const orderId = body.order_id as string | undefined;
  if (!orderId) return json({ error: "order_id requis" }, 400);

  const { data: order } = await admin.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) return json({ error: "Commande introuvable" }, 404);

  const { data: me } = await admin.from("users").select("role").eq("id", userData.user.id).maybeSingle();
  const staff = ["ADMIN", "GESTIONNAIRE", "DISPATCH", "SUIVI", "SUPPORT"].includes(String(me?.role || ""));
  if (!staff && order.driver_id !== userData.user.id) return json({ error: "Non autorisé" }, 403);

  const phone = String(order.recipient_phone || "").replace(/\D/g, "");
  if (phone.length < 9) return json({ error: "Téléphone destinataire manquant" }, 400);

  const code = generateNumericCode(6);
  const hash = await sha256Hex(code);
  const expires = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
  await admin.from("orders").update({
    otp_hash: hash,
    otp_expires_at: expires,
    otp_attempts: 0,
  }).eq("id", orderId);

  await admin.rpc("enqueue_notification", {
    p_event_key: `otp-${orderId}-${Date.now()}`,
    p_phone: phone,
    p_body: `Vita Express : votre code de remise est ${code}. Donnez-le uniquement au livreur à l'arrivée. Ne le partagez pas ailleurs.`,
    p_order_id: orderId,
    p_channel: "whatsapp",
  });

  return json({ ok: true, sent: true, expires_at: expires });
});
