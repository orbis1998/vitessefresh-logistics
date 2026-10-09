import { createClient } from "@supabase/supabase-js";
import qrcode from "qrcode-terminal";
import pkg from "whatsapp-web.js";

const { Client, LocalAuth } = pkg;
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Définissez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: "./session" }),
  puppeteer: { headless: true, args: ["--no-sandbox"] },
});

client.on("qr", (qr) => {
  console.log("Scannez ce QR avec le WhatsApp business Vita Express :");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("WhatsApp connecté. Polling des messages pending…");
});

const sendPending = async () => {
  const { data } = await supabase
    .from("whatsapp_messages")
    .select("*")
    .eq("status", "pending")
    .limit(10);
  for (const row of data ?? []) {
    const chat = `${String(row.phone).replace(/\D/g, "")}@c.us`;
    try {
      await client.sendMessage(chat, row.body);
      await supabase
        .from("whatsapp_messages")
        .update({ status: "sent", sent_at: new Date().toISOString(), error: null })
        .eq("id", row.id);
      console.log("envoyé", row.phone, row.kind);
    } catch (err) {
      await supabase
        .from("whatsapp_messages")
        .update({ status: "error", error: String(err?.message || err) })
        .eq("id", row.id);
    }
  }
};

client.on("ready", () => {
  setInterval(sendPending, 8000);
  sendPending();
});

client.initialize();
