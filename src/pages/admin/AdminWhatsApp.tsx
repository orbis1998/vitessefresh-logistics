import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const AdminWhatsApp = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState("Démarrez le gateway Node (whatsapp-gateway) puis scannez le QR dans son terminal.");

  const load = () => {
    supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(80).then(({ data }) => setRows(data ?? []));
  };

  useEffect(() => {
    load();
  }, []);

  const retry = async (id: string) => {
    await supabase.from("notifications").update({ status: "pending", error: null }).eq("id", id);
    load();
  };

  return (
    <DashboardLayout title="WhatsApp" subtitle="Outbox notifications — le code OTP n’apparaît pas ici">
      <div className="rounded-xl border border-white/10 p-5 mb-6 text-sm text-white/70 space-y-2">
        <p>{status}</p>
        <p className="text-white/40">Commande : <code className="text-primary">cd whatsapp-gateway && npm install && npm start</code></p>
        <Button size="sm" variant="outline" onClick={() => setStatus("Le QR s’affiche dans le terminal du gateway, pas dans le navigateur.")}>
          Où est le QR ?
        </Button>
      </div>
      <div className="rounded-xl border border-white/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/45">
            <tr>
              <th className="text-left p-3">Téléphone</th>
              <th className="text-left p-3">Événement</th>
              <th className="text-left p-3">Canal</th>
              <th className="text-left p-3">Statut</th>
              <th className="text-right p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/10">
                <td className="p-3">{r.phone}</td>
                <td className="p-3">{String(r.event_key || "").startsWith("otp-") ? "otp (corps masqué)" : r.event_key}</td>
                <td className="p-3">{r.channel}</td>
                <td className="p-3 text-primary">{r.status}{r.error ? ` · ${r.error}` : ""}</td>
                <td className="p-3 text-right">
                  {r.status !== "sent" && (
                    <Button size="sm" variant="outline" onClick={() => retry(r.id)}>Relancer</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default AdminWhatsApp;
