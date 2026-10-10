import { readFileSync } from "node:fs";

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF || "fppxpycgtevlugyiwbfb";
if (!token) {
  console.error("SUPABASE_ACCESS_TOKEN manquant");
  process.exit(1);
}

const files = [
  "supabase/migrations/20261009200000_vita_enum_extend.sql",
  "supabase/migrations/20261009200001_vita_ops_extend.sql",
  "supabase/migrations/20261009200002_vita_rpc_rls.sql",
  "supabase/migrations/20261009220000_fix_users_rls_recursion.sql",
  "supabase/migrations/20261009230000_fix_order_required_cols.sql",
  "supabase/migrations/20261010100000_phone_otp_pickup_track.sql",
];

for (const file of files) {
  const query = readFileSync(file, "utf8");
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  console.log(file, res.status, text.slice(0, 800));
  if (!res.ok) process.exit(1);
}
