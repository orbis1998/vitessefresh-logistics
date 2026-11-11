import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Navigation, Package } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import MapView from "@/components/MapView";
import MissionSheet from "@/components/ops/MissionSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { canTransition, statusLabel, toVitaStatus } from "@/lib/status";
import { drivingRoute, isLngLat, VITA_MAP_4D } from "@/lib/vita-map";

const DriverDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [driver, setDriver] = useState<any | null>(null);
  const [mission, setMission] = useState<any | null>(null);
  const [otp, setOtp] = useState("");
  const [earned, setEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selfLoc, setSelfLoc] = useState<[number, number] | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [route, setRoute] = useState<Array<[number, number]>>([]);
  const [etaMin, setEtaMin] = useState<number | null>(null);

  const ensureProfile = useCallback(async () => {
    if (!user) return null;
    const { data: existing } = await supabase.from("driver_profiles").select("*").eq("user_id", user.id).maybeSingle();
    if (existing) return existing;
    // Admin may already have created the row; if RLS delayed visibility, upsert quietly.
    const { data: created } = await supabase
      .from("driver_profiles")
      .upsert({ user_id: user.id, available: true }, { onConflict: "user_id" })
      .select("*")
      .maybeSingle();
    return created;
  }, [user]);

  const load = useCallback(async () => {
    if (!user) return;
    const dp = await ensureProfile();
    setDriver(dp);
    const { data: active } = await supabase
      .from("orders")
      .select("*")
      .eq("driver_id", user.id)
      .in("status", ["ASSIGNED", "ACCEPTED", "COLLECTING", "PICKED_UP", "IN_TRANSIT"])
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setMission(active);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { data: done } = await supabase
      .from("orders")
      .select("total_price")
      .eq("driver_id", user.id)
      .eq("status", "DELIVERED")
      .gte("delivered_at", start.toISOString());
    setEarned((done ?? []).reduce((s, o) => s + Number(o.total_price ?? 0), 0));
    setLoading(false);
  }, [user, ensureProfile]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user || !driver) return;
    const watch = navigator.geolocation?.watchPosition(
      (pos) => {
        const next: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        setSelfLoc(next);
        setHeading(typeof pos.coords.heading === "number" ? pos.coords.heading : null);
        supabase.from("driver_pings").upsert({
          driver_id: user.id,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          updated_at: new Date().toISOString(),
        });
      },
      undefined,
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 12000 },
    );
    return () => {
      if (typeof watch === "number") navigator.geolocation.clearWatch(watch);
    };
  }, [user, driver]);

  const setOnline = async (on: boolean) => {
    if (!user) return;
    await supabase.from("driver_profiles").update({ available: on }).eq("user_id", user.id);
    load();
  };

  const advance = async (status: string) => {
    if (!mission) return;
    if (!canTransition(mission.status, status)) {
      toast({ title: "Transition interdite", variant: "destructive" });
      return;
    }
    await supabase.from("orders").update({ status }).eq("id", mission.id);
    if (status === "PICKED_UP") {
      await supabase.functions.invoke("issue-delivery-code", { body: { order_id: mission.id } });
    }
    load();
  };

  const confirmOtp = async () => {
    if (!mission) return;
    const { data, error } = await supabase.rpc("verify_delivery_code", { p_order_id: mission.id, p_code: otp });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    const res = data as { success?: boolean; message?: string };
    toast({ title: res?.success ? "Livré" : "Code", description: res?.message, variant: res?.success ? "default" : "destructive" });
    if (res?.success) {
      setOtp("");
      load();
    }
  };

  const st = mission ? toVitaStatus(mission.status) : "";
  const pickup =
    mission && isLngLat([Number(mission.pickup_lng), Number(mission.pickup_lat)])
      ? ([Number(mission.pickup_lng), Number(mission.pickup_lat)] as [number, number])
      : null;
  const drop =
    mission && isLngLat([Number(mission.delivery_lng), Number(mission.delivery_lat)])
      ? ([Number(mission.delivery_lng), Number(mission.delivery_lat)] as [number, number])
      : null;

  useEffect(() => {
    const from = selfLoc || pickup;
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
  }, [selfLoc?.[0], selfLoc?.[1], pickup?.[0], pickup?.[1], drop?.[0], drop?.[1], st]);

  const markers = useMemo(() => {
    const list: Array<{
      coordinates: [number, number];
      type: "pickup" | "delivery" | "driver" | "parcel";
      popup: string;
      heading?: number | null;
    }> = [];
    if (pickup) list.push({ coordinates: pickup, type: "pickup", popup: "Ramassage" });
    if (drop) list.push({ coordinates: drop, type: "delivery", popup: "Destinataire" });
    if (selfLoc) list.push({ coordinates: selfLoc, type: "driver", popup: "Moi", heading });
    if (st === "PICKED_UP" || st === "IN_TRANSIT") {
      list.push({ coordinates: selfLoc || pickup || drop!, type: "parcel", popup: "Colis" });
    } else if (pickup) {
      list.push({ coordinates: pickup, type: "parcel", popup: "Colis" });
    }
    return list.filter((m) => isLngLat(m.coordinates));
  }, [pickup, drop, selfLoc, heading, st]);

  const points = mission
    ? [
        {
          kind: "pickup" as const,
          title: mission.pickup_address || "Point de retrait",
          detail: "Collecter le colis",
          active: ["ASSIGNED", "ACCEPTED", "COLLECTING"].includes(st),
        },
        {
          kind: "parcel" as const,
          title: mission.package_description || "Colis à bord",
          detail: mission.order_number || "Identifiant course",
          active: st === "PICKED_UP" || st === "IN_TRANSIT" || st === "COLLECTING",
        },
        {
          kind: "driver" as const,
          title: selfLoc ? "Navigation GPS" : "Activez le GPS",
          detail: selfLoc ? "Position live" : "Autorisez la localisation",
          active: Boolean(selfLoc),
        },
        {
          kind: "drop" as const,
          title: mission.recipient_name || "Destinataire",
          detail: `${mission.delivery_address || "Remise"}${mission.recipient_phone ? ` · ${mission.recipient_phone}` : ""}`,
          active: st === "IN_TRANSIT",
        },
      ]
    : [
        { kind: "pickup" as const, title: "En attente de course", detail: "Le dispatch vous attribue une mission" },
        { kind: "parcel" as const, title: "Colis", detail: "Apparaitra ici" },
        { kind: "driver" as const, title: driver?.available ? "En ligne" : "Hors ligne", detail: "Statut livreur" },
        { kind: "drop" as const, title: "Destinataire", detail: "Prochaine remise" },
      ];

  if (loading) {
    return (
      <DashboardLayout flush>
        <div className="flex h-[calc(100dvh-3.5rem-5.5rem)] md:h-[calc(100dvh-4rem)] items-center justify-center bg-[#0b0c0e]">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Mission" flush>
      <div className="relative h-[calc(100dvh-3.5rem-5.5rem)] md:h-[calc(100dvh-4rem)] bg-[#0b0c0e]">
        <MapView
          markers={markers}
          route={route}
          readonly
          mapStyle="nav"
          sheetPadding={240}
          pitch={VITA_MAP_4D.pitch}
          bearing={VITA_MAP_4D.bearing}
          zoom={VITA_MAP_4D.zoom}
          className="absolute inset-0 rounded-none min-h-0"
        />

        <div className="pointer-events-none absolute inset-0 z-10 p-3 sm:p-4 lg:p-6 flex flex-col justify-between gap-3">
          <div className="pointer-events-auto flex items-center justify-between gap-2 self-stretch">
            <div className="vita-panel-card rounded-xl px-3 py-2.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
                {mission ? <Navigation className="w-4 h-4 text-primary" /> : <Package className="w-4 h-4 text-primary" />}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">Aujourd’hui</p>
                <p className="font-heading text-lg font-bold text-primary tabular-nums leading-none">
                  {earned.toLocaleString("fr-FR")} FC
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOnline(!driver?.available)}
              className={`rounded-full h-11 px-4 text-sm font-semibold ${
                driver?.available ? "bg-primary text-[#101214]" : "bg-white/10 text-white border border-white/15"
              }`}
            >
              {driver?.available ? "En ligne" : "Passer en ligne"}
            </button>
          </div>

          <MissionSheet
            wide
            defaultCollapsed
            number={mission?.order_number}
            status={mission ? statusLabel(mission.status) : "Prêt — en attente d’une course"}
            eta={etaMin ? `${etaMin} min` : undefined}
            points={points}
            href="/livreur/livraisons"
            ctaLabel="Mes colis"
          >
            {mission ? (
              <>
                {(st === "ASSIGNED" || st === "ACCEPTED") && (
                  <button type="button" onClick={() => advance("COLLECTING")}>
                    Démarrer la collecte
                  </button>
                )}
                {st === "COLLECTING" && (
                  <button type="button" onClick={() => advance("PICKED_UP")}>
                    Colis collecté
                  </button>
                )}
                {st === "PICKED_UP" && (
                  <button type="button" onClick={() => advance("IN_TRANSIT")}>
                    En route vers le destinataire
                  </button>
                )}
                {st === "IN_TRANSIT" && (
                  <div className="flex gap-2">
                    <Input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Code destinataire"
                      className="bg-white/5 border-white/10 h-[42px]"
                      inputMode="numeric"
                    />
                    <Button className="h-[42px] shrink-0" onClick={confirmOtp}>
                      Valider
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-white/45">
                Passez en ligne. Dès qu’une course est attribuée, la navigation type Yango s’affiche ici.
              </p>
            )}
          </MissionSheet>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DriverDashboard;
