import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = req.headers.get("Authorization") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(supabaseUrl, anon, { global: { headers: { Authorization: auth } } });
  const { data: userData } = await userClient.auth.getUser();
  if (!userData.user) {
    return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const admin = createClient(supabaseUrl, service);
  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userData.user.id);
  if (!roles?.some((r) => r.role === "admin")) {
    return new Response(JSON.stringify({ error: "Admin uniquement" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const body = await req.json();
  const email = String(body.email || "").trim();
  const password = String(body.password || "");
  const full_name = String(body.full_name || "");
  const role = String(body.role || "call_center");

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (error || !created.user) {
    return new Response(JSON.stringify({ error: error?.message || "Création auth échouée" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  await admin.from("user_roles").delete().eq("user_id", created.user.id).eq("role", "client");
  await admin.from("user_roles").insert({ user_id: created.user.id, role });
  if (role === "livreur") {
    await admin.from("driver_profiles").upsert({ user_id: created.user.id });
  }
  await admin.from("audit_logs").insert({ actor_id: userData.user.id, action: "create_staff", entity: "user", entity_id: created.user.id, meta: { role, email } });

  return new Response(JSON.stringify({ ok: true, user_id: created.user.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
