import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = req.headers.get("Authorization") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient = createClient(supabaseUrl, anon, { global: { headers: { Authorization: auth } } });
  const { data: userData } = await userClient.auth.getUser();
  if (!userData.user) return json({ error: "Non authentifié" }, 401);

  const body = await req.json().catch(() => ({}));
  const orderId = body.order_id as string | undefined;
  const driverId = body.driver_id as string | undefined;
  if (!orderId || !driverId) return json({ error: "order_id et driver_id requis" }, 400);

  const { data, error } = await userClient.rpc("assign_driver", { p_order_id: orderId, p_driver_id: driverId });
  if (error) return json({ error: error.message }, 400);
  if (data && data.ok === false) return json({ error: data.error || "Attribution refusée" }, 400);

  const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: order } = await service.from("orders").select("recipient_phone, pickup_address").eq("id", orderId).maybeSingle();
  if (order?.recipient_phone) {
    await service.rpc("enqueue_notification", {
      p_event_key: `assigned-${orderId}`,
      p_phone: order.recipient_phone,
      p_body: `Vita Express : un livreur a été attribué. Ramassage prévu à ${order.pickup_address}.`,
      p_order_id: orderId,
      p_channel: "whatsapp",
    });
  }
  return json({ ok: true, result: data });
});
