import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const AdminWhatsApp = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState("Démarrez le gateway Node (whatsapp-gateway) puis scannez le QR dans son terminal.");

  useEffect(() => {
    supabase.from("whatsapp_messages").select("*").order("created_at", { ascending: false }).limit(50).then(({ data }) => setRows(data ?? []));
  }, []);

  const retry = async (id: string) => {
    await supabase.from("whatsapp_messages").update({ status: "pending", error: null }).eq("id", id);
    const { data } = await supabase.from("whatsapp_messages").select("*").order("created_at", { ascending: false }).limit(50);
    setRows(data ?? []);
  };

  return (
    <DashboardLayout title="WhatsApp" subtitle="OTP et avis de livraison via whatsapp-web.js">
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
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Statut</th>
              <th className="text-right p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/10">
                <td className="p-3">{r.phone}</td>
                <td className="p-3">{r.kind}</td>
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
