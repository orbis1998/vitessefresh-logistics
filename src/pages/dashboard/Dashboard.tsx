import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import MapView from "@/components/MapView";
import MissionSheet from "@/components/ops/MissionSheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { drivingRoute, isLngLat } from "@/lib/vita-map";
import { statusLabel, toVitaStatus } from "@/lib/status";

const LIVE = ["SUBMITTED", "EVALUATING", "PENDING_VALIDATION", "PENDING", "ACCEPTED", "ASSIGNED", "COLLECTING", "PICKED_UP", "IN_TRANSIT"];

const Dashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [driverLoc, setDriverLoc] = useState<[number, number] | null>(null);
  const [route, setRoute] = useState<Array<[number, number]>>([]);
  const [etaMin, setEtaMin] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = () =>
      supabase
        .from("orders")
        .select("id, order_number, status, pickup_address, delivery_address, pickup_lat, pickup_lng, delivery_lat, delivery_lng, recipient_name, package_description, driver_id, created_at")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)
        .then(({ data }) => setOrders(data ?? []));
    load();
    const ch = supabase
      .channel("client-home")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `client_id=eq.${user.id}` }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user]);

  const active = orders.find((o) => LIVE.includes(toVitaStatus(o.status)));

  useEffect(() => {
    if (!active?.driver_id) {
      setDriverLoc(null);
      return;
    }
    supabase
      .from("driver_pings")
      .select("latitude,longitude")
      .eq("driver_id", active.driver_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setDriverLoc([Number(data.longitude), Number(data.latitude)]);
      });
    const ch = supabase
      .channel(`home-drv-${active.driver_id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "driver_pings", filter: `driver_id=eq.${active.driver_id}` }, (payload: any) => {
        const row = payload.new;
        if (row) setDriverLoc([Number(row.longitude), Number(row.latitude)]);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [active?.driver_id]);

  const pickup = active && isLngLat([Number(active.pickup_lng), Number(active.pickup_lat)])
    ? ([Number(active.pickup_lng), Number(active.pickup_lat)] as [number, number])
    : null;
  const drop = active && isLngLat([Number(active.delivery_lng), Number(active.delivery_lat)])
    ? ([Number(active.delivery_lng), Number(active.delivery_lat)] as [number, number])
    : null;

  useEffect(() => {
    const a = driverLoc || pickup;
    const b = drop;
    if (!a || !b) {
      setRoute([]);
      setEtaMin(null);
      return;
    }
    let live = true;
    drivingRoute(a, b).then((res) => {
      if (!live || !res) return;
      setRoute(res.coordinates);
      setEtaMin(res.durationSec ? Math.max(1, Math.round(res.durationSec / 60)) : null);
    });
    return () => {
      live = false;
    };
  }, [driverLoc, pickup?.[0], pickup?.[1], drop?.[0], drop?.[1]]);

  const markers = useMemo(() => {
    const list: Array<{ coordinates: [number, number]; type: "pickup" | "delivery" | "driver" | "parcel"; popup: string }> = [];
    if (pickup) list.push({ coordinates: pickup, type: "pickup", popup: "Ramassage" });
    if (drop) list.push({ coordinates: drop, type: "delivery", popup: "Destinataire" });
    if (driverLoc) list.push({ coordinates: driverLoc, type: "driver", popup: "Livreur" });
    if (pickup && drop && (toVitaStatus(active?.status) === "PICKED_UP" || toVitaStatus(active?.status) === "IN_TRANSIT")) {
      list.push({
        coordinates: driverLoc || pickup,
        type: "parcel",
        popup: "Colis",
      });
    }
    return list;
  }, [pickup, drop, driverLoc, active?.status]);

  const st = active ? toVitaStatus(active.status) : "";
  const points = active
    ? [
        { kind: "pickup" as const, title: active.pickup_address || "Point de retrait", detail: "Lieu du ramassage", active: ["SUBMITTED", "ACCEPTED", "ASSIGNED", "COLLECTING"].includes(st) },
        { kind: "parcel" as const, title: active.package_description || "Colis Vita", detail: active.order_number || "En préparation", active: st === "PICKED_UP" || st === "IN_TRANSIT" },
        { kind: "driver" as const, title: driverLoc ? "Livreur en mouvement" : "Livreur", detail: driverLoc ? "Position GPS live" : "En attente d’affectation", active: Boolean(driverLoc) },
        { kind: "drop" as const, title: active.recipient_name || "Destinataire", detail: active.delivery_address || "Adresse de remise", active: st === "IN_TRANSIT" },
      ]
    : [
        { kind: "pickup" as const, title: "Ramassage", detail: "Choisissez le lieu de retrait" },
        { kind: "parcel" as const, title: "Colis", detail: "Décrivez ce que vous envoyez" },
        { kind: "driver" as const, title: "Livreur", detail: "Une moto à Kinshasa" },
        { kind: "drop" as const, title: "Destinataire", detail: "Nom et adresse de remise" },
      ];

  return (
    <DashboardLayout title="Mes courses" flush>
      <div className="relative h-[calc(100dvh-3.5rem-6rem)] lg:h-[calc(100dvh-4rem)] bg-[#0b0c0e]">
        <MapView
          markers={markers}
          route={route}
          readonly
          pitch={54}
          className="absolute inset-0 rounded-none min-h-0"
        />
        <div className="pointer-events-none absolute inset-0 z-10 p-3 sm:p-5 lg:p-8 flex flex-col justify-end lg:justify-start lg:items-start">
          <MissionSheet
            number={active?.order_number}
            status={active ? statusLabel(active.status) : "Aucune course en cours"}
            eta={etaMin ? `${etaMin} min` : undefined}
            points={points}
            href={active ? `/dashboard/tracking?id=${active.id}` : "/dashboard/order"}
          />
          {!active ? (
            <Link
              to="/dashboard/order"
              className="pointer-events-auto mt-3 inline-flex items-center gap-2 self-start rounded-full bg-primary text-[#101214] h-11 px-5 font-heading text-sm font-semibold"
            >
              <Plus className="w-4 h-4" strokeWidth={1.7} />
              Nouvelle course
            </Link>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
