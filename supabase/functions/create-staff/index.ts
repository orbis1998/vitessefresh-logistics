import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

const APP_TO_VITA: Record<string, string> = {
  admin: "ADMIN",
  gestionnaire: "GESTIONNAIRE",
  call_center: "DISPATCH",
  suivi: "SUIVI",
  support: "SUPPORT",
  comptable: "COMPTABLE",
  finance: "FINANCE",
  entreprise: "ENTREPRISE",
  livreur: "DRIVER",
  client: "CLIENT",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = req.headers.get("Authorization") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(supabaseUrl, anon, { global: { headers: { Authorization: auth } } });
  const { data: userData } = await userClient.auth.getUser();
  if (!userData.user) return json({ error: "Non authentifié" }, 401);

  const admin = createClient(supabaseUrl, service);
  const { data: me } = await admin.from("users").select("role").eq("id", userData.user.id).maybeSingle();
  if (String(me?.role).toUpperCase() !== "ADMIN") return json({ error: "Admin uniquement" }, 403);

  const body = await req.json();
  const email = String(body.email || "").trim();
  const password = String(body.password || "");
  const full_name = String(body.full_name || "");
  const role = String(body.role || "call_center");
  const vitaRole = APP_TO_VITA[role] || role.toUpperCase();

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (error || !created.user) {
    return json({ error: error?.message || "Création auth échouée" }, 400);
  }

  await admin.from("users").upsert({
    id: created.user.id,
    email,
    name: full_name || email,
    role: vitaRole,
  });
  if (vitaRole === "DRIVER") {
    await admin.from("driver_profiles").upsert({ user_id: created.user.id });
  }
  await admin.from("audit_events").insert({
    actor_id: userData.user.id,
    action: "create_staff",
    entity: "user",
    entity_id: created.user.id,
    meta: { role: vitaRole, email },
  });

  return json({ ok: true, user_id: created.user.id });
});
