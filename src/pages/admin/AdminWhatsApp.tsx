import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const AdminWhatsApp = () => {
  const [rows, setRows] = useState<any[]>([]);

  const load = () => {
    supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(80).then(({ data }) => setRows(data ?? []));
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  const retry = async (id: string) => {
    await supabase.from("notifications").update({ status: "pending", error: null }).eq("id", id);
    load();
  };

  return (
    <DashboardLayout title="WhatsApp" subtitle="Outbox Railway · le code OTP n'apparaît pas ici">
      <div className="rounded-xl border border-white/10 p-5 mb-6 text-sm text-white/70 space-y-3">
        <p>En production, le gateway tourne sur Railway (WhatsApp Cloud API). Il lit cette file toutes les 8 secondes.</p>
        <p className="text-white/40">
          Variables Railway : <code className="text-primary">SUPABASE_URL</code>, <code className="text-primary">SUPABASE_SERVICE_ROLE_KEY</code>,{" "}
          <code className="text-primary">WA_ACCESS_TOKEN</code>, <code className="text-primary">WA_PHONE_NUMBER_ID</code>, optionnel{" "}
          <code className="text-primary">WA_TEMPLATE_OTP</code> et <code className="text-primary">TWILIO_*</code> pour le SMS.
        </p>
        <p className="text-white/40">Déploiement : dossier <code className="text-primary">whatsapp-gateway</code> + Dockerfile. Healthcheck : /health</p>
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
            {rows.map((r) => {
              const key = String(r.event_key || "");
              const label = key.startsWith("otp-") ? "code remise" : key.startsWith("auth-") ? "code connexion" : key.startsWith("track-") ? "n° suivi" : key;
              return (
                <tr key={r.id} className="border-t border-white/10">
                  <td className="p-3">{r.phone}</td>
                  <td className="p-3">{label}</td>
                  <td className="p-3">{r.channel}</td>
                  <td className="p-3 text-primary">{r.status}{r.error ? ` · ${r.error}` : ""}</td>
                  <td className="p-3 text-right">
                    {r.status !== "sent" && (
                      <Button size="sm" variant="outline" onClick={() => retry(r.id)}>Relancer</Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default AdminWhatsApp;
