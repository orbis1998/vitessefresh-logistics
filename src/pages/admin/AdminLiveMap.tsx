import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import OpsMap, { type OpsMarker } from "@/components/ops/OpsMap";
import { supabase } from "@/integrations/supabase/client";
import { ACTIVE_MISSION, toVitaStatus } from "@/lib/status";

const AdminLiveMap = () => {
  const [markers, setMarkers] = useState<OpsMarker[]>([]);

  const load = async () => {
    const [{ data: locs }, { data: orders }] = await Promise.all([
      supabase.from("driver_pings").select("driver_id, latitude, longitude"),
      supabase.from("orders").select("id, status, pickup_lng, pickup_lat, delivery_lng, delivery_lat, pickup_address, delivery_address"),
    ]);
    const live = (orders ?? []).filter((o) => ACTIVE_MISSION.includes(toVitaStatus(o.status)));
    setMarkers([
      ...(locs ?? []).map((l) => ({
        id: `d-${l.driver_id}`,
        lng: Number(l.longitude),
        lat: Number(l.latitude),
        kind: "driver" as const,
        label: "Livreur",
      })),
      ...live.flatMap((o) => [
        { id: `p-${o.id}`, lng: Number(o.pickup_lng), lat: Number(o.pickup_lat), kind: "pickup" as const, label: o.pickup_address },
        { id: `x-${o.id}`, lng: Number(o.delivery_lng), lat: Number(o.delivery_lat), kind: "drop" as const, label: o.delivery_address },
      ]),
    ]);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("ops-map")
      .on("postgres_changes", { event: "*", schema: "public", table: "driver_pings" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  return (
    <DashboardLayout title="Carte live" subtitle="Livreurs, ramassage, destinataires">
      <OpsMap markers={markers} className="h-[70vh]" pitch={55} />
    </DashboardLayout>
  );
};

export default AdminLiveMap;
