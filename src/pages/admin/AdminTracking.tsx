import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import OpsMap, { type OpsMarker } from "@/components/ops/OpsMap";
import { supabase } from "@/integrations/supabase/client";

const AdminTracking = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("orders").select("*").in("status", ["accepted", "picked_up", "in_transit"]).order("updated_at", { ascending: false });
      setOrders(data ?? []);
      setSelected(data?.[0] ?? null);
    })();
  }, []);

  const markers: OpsMarker[] = selected
    ? [
        { id: "p", lng: Number(selected.pickup_lng), lat: Number(selected.pickup_lat), kind: "pickup", label: selected.pickup_address },
        { id: "d", lng: Number(selected.dropoff_lng), lat: Number(selected.dropoff_lat), kind: "drop", label: selected.dropoff_address },
      ]
    : [];

  return (
    <DashboardLayout title="Colis / suivi" subtitle="Destinataire, statut, carte">
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
                <p className="truncate text-white/40 text-xs">→ {o.dropoff_address}</p>
                <p className="text-primary text-xs mt-1">{o.status} · {o.recipient_name || "Destinataire"}</p>
              </button>
            </li>
          ))}
          {orders.length === 0 && <p className="text-white/40 text-sm">Aucun colis en cours.</p>}
        </ul>
        <div className="lg:col-span-3 space-y-3">
          <OpsMap markers={markers} className="h-[360px]" />
          {selected && (
            <div className="rounded-xl border border-white/10 p-4 text-sm space-y-1">
              <p>Destinataire : {selected.recipient_name || "—"} · {selected.recipient_phone || "—"}</p>
              <p>OTP : <span className="font-mono">{selected.delivery_otp || "—"}</span></p>
              <p>Type : {selected.package_type || "colis"}</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminTracking;
