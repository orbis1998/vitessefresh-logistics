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
  const code = String(body.code || "").replace(/\D/g, "");
  const fullName = String(body.full_name || "").trim();
  if (!/^243\d{9}$/.test(phone) || code.length < 4) return json({ error: "Données invalides" }, 400);

  const { data: rows } = await admin
    .from("phone_auth_challenges")
    .select("*")
    .eq("phone", phone)
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1);
  const row = rows?.[0];
  if (!row) return json({ error: "Code expiré. Demandez-en un nouveau." }, 400);
  if (row.attempts >= 5) return json({ error: "Trop d'essais. Demandez un nouveau code." }, 400);

  const hash = await sha256Hex(code);
  if (hash !== row.code_hash) {
    await admin.from("phone_auth_challenges").update({ attempts: row.attempts + 1 }).eq("id", row.id);
    return json({ error: "Code incorrect" }, 400);
  }
  await admin.from("phone_auth_challenges").update({ consumed_at: new Date().toISOString() }).eq("id", row.id);

  const email = `${phone}@phone.vitaexpress.cd`;
  const { data: existing } = await admin.from("users").select("id, email").eq("phone", phone).maybeSingle();
  let userEmail = existing?.email || email;

  if (!existing) {
    const created = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      phone: `+${phone}`,
      phone_confirm: true,
      user_metadata: { full_name: fullName || phone, phone },
    });
    if (created.error && !String(created.error.message).includes("already")) {
      return json({ error: created.error.message }, 400);
    }
    userEmail = created.data.user?.email || email;
    const uid = created.data.user?.id;
    if (uid) {
      await admin.from("users").upsert({
        id: uid,
        email: userEmail,
        name: fullName || phone,
        phone,
        role: "CLIENT",
        verified: true,
      });
    }
  }

  const link = await admin.auth.admin.generateLink({ type: "magiclink", email: userEmail });
  const tokenHash = link.data?.properties?.hashed_token;
  if (!tokenHash) return json({ error: "Session impossible" }, 500);
  return json({ ok: true, token_hash: tokenHash, email: userEmail });
});
