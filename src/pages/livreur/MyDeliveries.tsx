import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2, Navigation, Package, Phone } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import MapView from "@/components/MapView";
import MissionSheet from "@/components/ops/MissionSheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { drivingRoute, isLngLat, VITA_MAP_4D } from "@/lib/vita-map";
import { statusLabel, toVitaStatus } from "@/lib/status";

const NEXT_STATUS: Record<string, { next: string; label: string }> = {
  ASSIGNED: { next: "COLLECTING", label: "Démarrer collecte" },
  ACCEPTED: { next: "COLLECTING", label: "Démarrer collecte" },
  COLLECTING: { next: "PICKED_UP", label: "Colis collecté" },
  PICKED_UP: { next: "IN_TRANSIT", label: "En route" },
};

const MyDeliveries = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [route, setRoute] = useState<Array<[number, number]>>([]);
  const [etaMin, setEtaMin] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("driver_id", user.id)
      .order("created_at", { ascending: false });
    setOrders(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const startSharing = () => {
    if (!navigator.geolocation || !user) {
      toast({ title: "GPS indisponible", variant: "destructive" });
      return;
    }
    setSharing(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const next: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        setCurrentPos(next);
        setHeading(typeof pos.coords.heading === "number" ? pos.coords.heading : null);
        await supabase.from("driver_pings").upsert({
          driver_id: user.id,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          heading: pos.coords.heading ?? null,
          speed: pos.coords.speed ?? null,
          updated_at: new Date().toISOString(),
        });
      },
      (err) => toast({ title: "Erreur GPS", description: err.message, variant: "destructive" }),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );
  };

  const stopSharing = () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setSharing(false);
    toast({ title: "GPS arrêté" });
  };

  useEffect(
    () => () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    },
    [],
  );

  const advanceStatus = async (order: any) => {
    const next = NEXT_STATUS[String(order.status).toUpperCase()];
    if (!next) return;
    await supabase.from("orders").update({ status: next.next }).eq("id", order.id);
    if (next.next === "PICKED_UP") {
      await supabase.functions.invoke("issue-delivery-code", { body: { order_id: order.id } });
    }
    toast({ title: next.label, description: "Statut mis à jour" });
    load();
  };

  const active = orders.filter((o) =>
    ["ASSIGNED", "ACCEPTED", "COLLECTING", "PICKED_UP", "IN_TRANSIT"].includes(String(o.status).toUpperCase()),
  );
  const history = orders.filter((o) => ["DELIVERED", "CANCELLED"].includes(String(o.status).toUpperCase()));
  const current = active[activeIdx] ?? null;
  const st = current ? toVitaStatus(current.status) : "";

  const pickup =
    current && isLngLat([Number(current.pickup_lng), Number(current.pickup_lat)])
      ? ([Number(current.pickup_lng), Number(current.pickup_lat)] as [number, number])
      : null;
  const drop =
    current && isLngLat([Number(current.delivery_lng), Number(current.delivery_lat)])
      ? ([Number(current.delivery_lng), Number(current.delivery_lat)] as [number, number])
      : null;

  useEffect(() => {
    const from = currentPos || pickup;
    const to = st === "PICKED_UP" || st === "IN_TRANSIT" ? drop : pickup;
    if (!from || !to) {
      setRoute([]);
      setEtaMin(null);
      return;
    }
    let live = true;
    drivingRoute(from, to).then((res) => {
      if (!live || !res) return;
      setRoute(res.coordinates);
      setEtaMin(res.durationSec ? Math.max(1, Math.round(res.durationSec / 60)) : null);
    });
    return () => {
      live = false;
    };
  }, [currentPos?.[0], currentPos?.[1], pickup?.[0], pickup?.[1], drop?.[0], drop?.[1], st]);

  const markers = useMemo(() => {
    const list: Array<{
      coordinates: [number, number];
      type: "pickup" | "delivery" | "driver" | "parcel";
      popup: string;
      heading?: number | null;
    }> = [];
    if (!current) return list;
    if (pickup) list.push({ coordinates: pickup, type: "pickup", popup: "Ramassage" });
    if (drop) list.push({ coordinates: drop, type: "delivery", popup: "Destinataire" });
    if (currentPos) list.push({ coordinates: currentPos, type: "driver", popup: "Moi", heading });
    if (st === "PICKED_UP" || st === "IN_TRANSIT") {
      list.push({ coordinates: currentPos || pickup || drop!, type: "parcel", popup: "Colis" });
    } else if (pickup) {
      list.push({ coordinates: pickup, type: "parcel", popup: "Colis" });
    }
    return list.filter((m) => isLngLat(m.coordinates));
  }, [current, pickup, drop, currentPos, heading, st]);

  if (loading) {
    return (
      <DashboardLayout flush>
        <div className="flex h-[calc(100dvh-3.5rem-5.5rem)] md:h-[calc(100dvh-4rem)] items-center justify-center bg-[#0b0c0e]">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!current) {
    return (
      <DashboardLayout title="Mes livraisons" flush>
        <div className="min-h-[calc(100dvh-3.5rem-5.5rem)] md:min-h-[calc(100dvh-4rem)] bg-[#0b0c0e] p-4 sm:p-6">
          <div className="vita-panel-card mx-auto max-w-lg rounded-xl p-10 text-center space-y-4">
            <Package className="w-8 h-8 text-primary mx-auto" />
            <h2 className="font-heading font-semibold text-xl">Aucune course active</h2>
            <p className="text-white/45 text-sm">Le dispatch doit vous attribuer un colis pour ouvrir la vue 4D.</p>
            <Button asChild>
              <Link to="/livreur">Retour mission</Link>
            </Button>
            {history.length > 0 ? (
              <div className="pt-4 text-left space-y-2 border-t border-white/10">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Historique</p>
                {history.slice(0, 5).map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-3 text-sm">
                    <p className="truncate text-white/70">{o.order_number}</p>
                    <p className="text-white/40 shrink-0">{statusLabel(o.status)}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Mes livraisons" flush>
      <div className="relative h-[calc(100dvh-3.5rem-5.5rem)] md:h-[calc(100dvh-4rem)] bg-[#0b0c0e]">
        <MapView
          markers={markers}
          route={route}
          readonly
          pitch={VITA_MAP_4D.pitch}
          bearing={VITA_MAP_4D.bearing}
          zoom={VITA_MAP_4D.zoom}
          className="absolute inset-0 rounded-none min-h-0"
        />

        <div className="pointer-events-none absolute inset-0 z-10 p-3 sm:p-5 lg:p-8 flex flex-col justify-between gap-3">
          <div className="pointer-events-auto flex items-center justify-between gap-2">
            <div className="vita-panel-card rounded-xl px-3 py-2 flex items-center gap-2">
              <button
                type="button"
                disabled={activeIdx === 0}
                onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-white/5 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
                  Colis {activeIdx + 1}/{active.length}
                </p>
                <p className="text-sm font-medium">{statusLabel(current.status)}</p>
              </div>
              <button
                type="button"
                disabled={activeIdx >= active.length - 1}
                onClick={() => setActiveIdx((i) => Math.min(active.length - 1, i + 1))}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-white/5 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={sharing ? stopSharing : startSharing}
              className={`h-11 px-4 rounded-full inline-flex items-center gap-2 text-sm font-semibold ${
                sharing ? "bg-primary text-[#101214]" : "bg-white/10 text-white border border-white/15"
              }`}
            >
              <Navigation className="w-4 h-4" />
              {sharing ? "GPS live" : "Activer GPS"}
            </button>
          </div>

          <MissionSheet
            wide
            number={current.order_number}
            status={statusLabel(current.status)}
            eta={etaMin ? `${etaMin} min` : undefined}
            points={[
              {
                kind: "pickup",
                title: current.pickup_address || "Ramassage",
                detail: "Point de collecte",
                active: ["ASSIGNED", "ACCEPTED", "COLLECTING"].includes(st),
              },
              {
                kind: "parcel",
                title: current.package_description || "Colis",
                detail: `${Number(current.total_price ?? 0).toLocaleString("fr-FR")} FC · ${current.distance ?? "—"} km`,
                active: st === "COLLECTING" || st === "PICKED_UP" || st === "IN_TRANSIT",
              },
              {
                kind: "driver",
                title: currentPos ? "Ma position" : "GPS off",
                detail: currentPos ? "Flux 4D actif" : "Activez le GPS",
                active: Boolean(currentPos),
              },
              {
                kind: "drop",
                title: current.recipient_name || "Destinataire",
                detail: current.delivery_address || "Remise",
                active: st === "IN_TRANSIT",
              },
            ]}
            href="/livreur"
            ctaLabel="Ouvrir la mission"
          >
            <div className="flex gap-2">
              {current.recipient_phone ? (
                <a
                  href={`tel:${current.recipient_phone}`}
                  className="vita-sheet__btn--ghost inline-flex h-[42px] w-[42px] items-center justify-center shrink-0"
                >
                  <Phone className="w-4 h-4" />
                </a>
              ) : null}
              {NEXT_STATUS[st] ? (
                <button type="button" className="flex-1" onClick={() => advanceStatus(current)}>
                  {NEXT_STATUS[st].label}
                </button>
              ) : st === "IN_TRANSIT" ? (
                <Button asChild className="flex-1 h-[42px]">
                  <Link to="/livreur">Saisir l’OTP destinataire</Link>
                </Button>
              ) : null}
            </div>
          </MissionSheet>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyDeliveries;
