import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import OpsMap, { type OpsMarker } from "@/components/ops/OpsMap";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { statusLabel, toVitaStatus } from "@/lib/status";
import { useToast } from "@/hooks/use-toast";

const AdminTracking = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(80);
      const live = (data ?? []).filter((o) => ["ACCEPTED", "ASSIGNED", "COLLECTING", "PICKED_UP", "IN_TRANSIT"].includes(toVitaStatus(o.status)));
      setOrders(live);
      setSelected(live[0] ?? null);
    })();
  }, []);

  const issueCode = async (id: string) => {
    const { data, error } = await supabase.functions.invoke("issue-delivery-code", { body: { order_id: id } });
    if (error || data?.error) toast({ title: "OTP", description: error?.message || data?.error, variant: "destructive" });
    else toast({ title: "Code envoyé au destinataire uniquement" });
  };

  const analyze = async (id: string) => {
    const { data, error } = await supabase.functions.invoke("analyze-parcel", { body: { order_id: id } });
    if (error || data?.error) toast({ title: "Groq", description: error?.message || data?.error, variant: "destructive" });
    else toast({ title: data?.ok ? "Analyse enregistrée" : "IA indisponible → JAUNE", description: "Aucune acceptation automatique." });
  };

  const markers: OpsMarker[] = selected
    ? [
        { id: "p", lng: Number(selected.pickup_lng), lat: Number(selected.pickup_lat), kind: "pickup", label: selected.pickup_address },
        { id: "d", lng: Number(selected.delivery_lng), lat: Number(selected.delivery_lat), kind: "drop", label: selected.delivery_address },
      ]
    : [];

  return (
    <DashboardLayout title="Colis / suivi" subtitle="Destinataire, statut, carte — code masqué">
      <div className="grid lg:grid-cols-5 gap-4">
        <ul className="lg:col-span-2 space-y-2 max-h-[70vh] overflow-y-auto">
          {orders.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => setSelected(o)}
                className={`w-full text-left rounded-xl border p-3 text-sm ${selected?.id === o.id ? "border-primary bg-primary/10" : "border-white/10 bg-white/[0.03]"}`}
              >
                <p className="truncate">{o.pickup_address}</p>
                <p className="truncate text-white/40 text-xs">→ {o.delivery_address}</p>
                <p className="text-primary text-xs mt-1">{statusLabel(o.status)} · {o.recipient_name || "Destinataire"}</p>
              </button>
            </li>
          ))}
          {orders.length === 0 && <p className="text-white/40 text-sm">Aucun colis en cours.</p>}
        </ul>
        <div className="lg:col-span-3 space-y-3">
          <OpsMap markers={markers} className="h-[360px]" />
          {selected && (
            <div className="rounded-xl border border-white/10 p-4 text-sm space-y-2">
              <p>Destinataire : {selected.recipient_name || "—"} · {selected.recipient_phone || "—"}</p>
              <p>Type : {selected.package_description || "colis"} · {selected.weight_kg ?? "—"} kg</p>
              <p>Contrôle : {selected.evaluation_level || "—"}</p>
              <p className="text-white/40 text-xs">Le code de remise n’est jamais affiché ici.</p>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => issueCode(selected.id)}>Envoyer le code au destinataire</Button>
                <Button size="sm" variant="outline" onClick={() => analyze(selected.id)}>Analyser (Groq)</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminTracking;
