import { createClient } from "@supabase/supabase-js";
import { createServer } from "node:http";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const waToken = process.env.WA_ACCESS_TOKEN;
const waPhoneId = process.env.WA_PHONE_NUMBER_ID;
const waTemplate = process.env.WA_TEMPLATE_OTP || "";
const port = Number(process.env.PORT || 8080);

if (!url || !key) {
  console.error("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis");
  process.exit(1);
}

const supabase = createClient(url, key);

async function sendCloud(phone, body, eventKey) {
  if (!waToken || !waPhoneId) throw new Error("WA_ACCESS_TOKEN / WA_PHONE_NUMBER_ID manquants");
  const to = String(phone).replace(/\D/g, "");
  const payload = eventKey.startsWith("otp-") || eventKey.startsWith("auth-")
    ? waTemplate
      ? {
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: waTemplate,
            language: { code: "fr" },
            components: [{ type: "body", parameters: [{ type: "text", text: body.replace(/\D/g, "").slice(-6) || "------" }] }],
          },
        }
      : { messaging_product: "whatsapp", to, type: "text", text: { body, preview_url: false } }
    : { messaging_product: "whatsapp", to, type: "text", text: { body, preview_url: false } };

  const res = await fetch(`https://graph.facebook.com/v21.0/${waPhoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${waToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || JSON.stringify(json));
}

async function sendPending() {
  const { data } = await supabase
    .from("notifications")
    .select("id, phone, body, event_key, status")
    .eq("status", "pending")
    .eq("channel", "whatsapp")
    .limit(15);
  for (const row of data ?? []) {
    try {
      await sendCloud(row.phone, row.body, String(row.event_key || ""));
      await supabase
        .from("notifications")
        .update({ status: "sent", sent_at: new Date().toISOString(), error: null })
        .eq("id", row.id);
      console.log("envoyé", row.phone, String(row.event_key || "").split("-")[0]);
    } catch (err) {
      await supabase
        .from("notifications")
        .update({ status: "error", error: String(err?.message || err) })
        .eq("id", row.id);
      console.error("échec", row.id, err?.message || err);
    }
  }
}

createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, cloud: Boolean(waToken && waPhoneId) }));
    return;
  }
  res.writeHead(404);
  res.end();
}).listen(port, () => console.log("WhatsApp gateway Railway sur", port));

setInterval(sendPending, 8000);
sendPending();
