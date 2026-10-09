import { appendFileSync, readFileSync } from "node:fs";

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF || "fppxpycgtevlugyiwbfb";
const log = (m) => {
  console.log(m);
  appendFileSync("scripts/deploy-functions.log", m + "\n");
};
if (!token) {
  log("SUPABASE_ACCESS_TOKEN manquant");
  process.exit(1);
}

const fns = [
  { slug: "evaluate-order", jwt: true },
  { slug: "quote-order", jwt: false },
  { slug: "assign-driver", jwt: true },
  { slug: "analyze-parcel", jwt: true },
  { slug: "issue-delivery-code", jwt: true },
  { slug: "create-staff", jwt: true },
  { slug: "get-mapbox-token", jwt: true },
];

for (const fn of fns) {
  const body = readFileSync(`supabase/functions/${fn.slug}/index.ts`);
  const fd = new FormData();
  fd.append(
    "metadata",
    JSON.stringify({
      name: fn.slug,
      entrypoint_path: "index.ts",
      verify_jwt: fn.jwt,
    }),
  );
  fd.append("file", new Blob([body]), "index.ts");
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/functions/deploy?slug=${fn.slug}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  const text = await res.text();
  log(`${fn.slug} ${res.status} ${text.slice(0, 400)}`);
  if (!res.ok) process.exit(1);
}
log("ok");
