import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const body = await req.json();
  const orderId = body.order_id as string;
  const msisdn = String(body.msisdn || "").replace(/\D/g, "");

  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) {
    return new Response(JSON.stringify({ error: "Commande introuvable" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const refid = `VE-${orderId.slice(0, 8)}-${Date.now()}`;
  const retailerid = Deno.env.get("KPAY_RETAILER_ID") || "";
  const apikey = Deno.env.get("KPAY_API_KEY") || "";
  const currency = Deno.env.get("KPAY_CURRENCY") || "RWF";
  const returl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/kpay-webhook`;

  const form = new URLSearchParams({
    action: "pay",
    msisdn,
    email: body.email || "paiement@vita-express.cd",
    details: `Course Vita Express ${orderId}`,
    refid,
    amount: String(Math.round(Number(order.price))),
    currency,
    cname: body.cname || "Client Vita",
    cnumber: order.client_id,
    pmethod: "momo",
    retailerid,
    apikey,
    returl,
    redirecturl: body.redirecturl || "https://vita-express.cd/dashboard",
  });

  const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" };
  if (apikey) headers.Authorization = `Bearer ${apikey}`;

  const res = await fetch("https://pay.esicia.com/", {
    method: "POST",
    headers,
    body: form.toString(),
  });
  const text = await res.text();

  await supabase.from("orders").update({
    payment_method: "kpay",
    payment_status: "pending",
    payment_phone: msisdn,
    kpay_refid: refid,
    kpay_status: "initiated",
    payment_reference: text.slice(0, 500),
  }).eq("id", orderId);

  return new Response(JSON.stringify({ ok: true, refid, raw: text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
