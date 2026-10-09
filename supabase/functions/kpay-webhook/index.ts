import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const payload = await req.json().catch(async () => {
    const t = await req.text();
    try { return Object.fromEntries(new URLSearchParams(t)); } catch { return { raw: t }; }
  });

  const refid = payload.refid || payload.ref || payload.reference;
  const status = String(payload.status || payload.txnstatus || "").toLowerCase();
  if (!refid) {
    return new Response(JSON.stringify({ error: "refid manquant" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const paid = status.includes("success") || status === "paid" || status === "ok" || payload.success === true;
  await supabase.from("orders").update({
    kpay_status: status || (paid ? "paid" : "failed"),
    payment_status: paid ? "paid" : "failed",
  }).eq("kpay_refid", refid);

  return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
