import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

const MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = req.headers.get("Authorization") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const groqKey = Deno.env.get("GROQ_API_KEY");

  const userClient = createClient(supabaseUrl, anon, { global: { headers: { Authorization: auth } } });
  const { data: userData } = await userClient.auth.getUser();
  if (!userData.user) return json({ error: "Non authentifié" }, 401);

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: me } = await admin.from("users").select("role").eq("id", userData.user.id).maybeSingle();
  const staff = ["ADMIN", "GESTIONNAIRE", "DISPATCH", "SUIVI", "SUPPORT"].includes(String(me?.role || ""));
  if (!staff) return json({ error: "Staff uniquement" }, 403);

  const body = await req.json().catch(() => ({}));
  const orderId = body.order_id as string | undefined;
  if (!orderId) return json({ error: "order_id requis" }, 400);

  if (!groqKey) {
    await admin.from("groq_analyses").insert({
      order_id: orderId,
      model: null,
      observations: null,
      hypotheses: "Clé GROQ absente — aucune acceptation automatique.",
      confidence: null,
      payload: { error: "GROQ_API_KEY missing", fallback: "YELLOW" },
    });
    await admin.from("orders").update({
      evaluation_level: "YELLOW",
      status: "PENDING_VALIDATION",
    }).eq("id", orderId);
    return json({ ok: false, fallback: "YELLOW", reason: "Analyse visuelle indisponible" });
  }

  const { data: photos } = await admin.from("parcel_photos").select("storage_path").eq("order_id", orderId);
  const path = photos?.[0]?.storage_path;
  let imageUrl: string | null = null;
  if (path) {
    const { data: signed } = await admin.storage.from("parcel-photos").createSignedUrl(path, 120);
    imageUrl = signed?.signedUrl ?? null;
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 12000);
  try {
    const content: unknown[] = [
      {
        type: "text",
        text: "Tu es un contrôleur colis moto Kinshasa. Distingue observations (ce que tu vois) et hypothèses. Réponds JSON {observations, hypotheses, confidence:0-1, forbidden:boolean}. Ne décide jamais d'accepter.",
      },
    ];
    if (imageUrl) content.push({ type: "image_url", image_url: { url: imageUrl } });

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.1,
        messages: [{ role: "user", content }],
        response_format: { type: "json_object" },
      }),
    });
    clearTimeout(t);
    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    const confidence = Number(parsed.confidence ?? 0);
    await admin.from("groq_analyses").insert({
      order_id: orderId,
      model: MODEL,
      observations: parsed.observations ?? null,
      hypotheses: parsed.hypotheses ?? null,
      confidence,
      payload: { ...parsed, rules_version: "2026-10-eval-1" },
    });
    if (parsed.forbidden || confidence < 0.4) {
      await admin.from("orders").update({ evaluation_level: "YELLOW", status: "PENDING_VALIDATION" }).eq("id", orderId);
    }
    return json({ ok: true, model: MODEL, observations: parsed.observations, hypotheses: parsed.hypotheses, confidence, autoAccept: false });
  } catch (err) {
    clearTimeout(t);
    await admin.from("groq_analyses").insert({
      order_id: orderId,
      model: MODEL,
      observations: null,
      hypotheses: "Timeout ou erreur Groq — jamais d'acceptation automatique.",
      confidence: null,
      payload: { error: String(err), fallback: "YELLOW" },
    });
    await admin.from("orders").update({ evaluation_level: "YELLOW", status: "PENDING_VALIDATION" }).eq("id", orderId);
    return json({ ok: false, fallback: "YELLOW", reason: "Analyse visuelle indisponible" });
  }
});
