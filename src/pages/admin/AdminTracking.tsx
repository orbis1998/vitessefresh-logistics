import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import OpsMap, { type OpsMarker } from "@/components/ops/OpsMap";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { statusLabel, toVitaStatus } from "@/lib/status";
import { useToast } from "@/hooks/use-toast";
import { drivingRoute, isLngLat } from "@/lib/vita-map";

const AdminTracking = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [driverLoc, setDriverLoc] = useState<[number, number] | null>(null);
  const [route, setRoute] = useState<Array<[number, number]>>([]);
  const [etaMin, setEtaMin] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(80);
      const live = (data ?? []).filter((o) =>
        ["ACCEPTED", "ASSIGNED", "COLLECTING", "PICKED_UP", "IN_TRANSIT"].includes(toVitaStatus(o.status)),
      );
      setOrders(live);
      setSelected((prev) => live.find((o) => o.id === prev?.id) ?? live[0] ?? null);
    };
    load();
    const ch = supabase
      .channel("admin-track-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  useEffect(() => {
    if (!selected?.driver_id) {
      setDriverLoc(null);
      return;
    }
    supabase
      .from("driver_pings")
      .select("latitude,longitude,heading")
      .eq("driver_id", selected.driver_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setDriverLoc([Number(data.longitude), Number(data.latitude)]);
      });
    const ch = supabase
      .channel(`admin-drv-${selected.driver_id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "driver_pings", filter: `driver_id=eq.${selected.driver_id}` },
        (payload: any) => {
          const row = payload.new;
          if (row) setDriverLoc([Number(row.longitude), Number(row.latitude)]);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [selected?.driver_id]);

  const pickup =
    selected && isLngLat([Number(selected.pickup_lng), Number(selected.pickup_lat)])
      ? ([Number(selected.pickup_lng), Number(selected.pickup_lat)] as [number, number])
      : null;
  const drop =
    selected && isLngLat([Number(selected.delivery_lng), Number(selected.delivery_lat)])
      ? ([Number(selected.delivery_lng), Number(selected.delivery_lat)] as [number, number])
      : null;
  const st = selected ? toVitaStatus(selected.status) : "";

  useEffect(() => {
    const from = driverLoc || pickup;
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
  }, [driverLoc?.[0], driverLoc?.[1], pickup?.[0], pickup?.[1], drop?.[0], drop?.[1], st]);

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

  const markers: OpsMarker[] = useMemo(() => {
    if (!selected) return [];
    const list: OpsMarker[] = [];
    if (pickup) list.push({ id: "p", lng: pickup[0], lat: pickup[1], kind: "pickup", label: selected.pickup_address });
    if (drop) list.push({ id: "d", lng: drop[0], lat: drop[1], kind: "drop", label: selected.delivery_address });
    if (driverLoc) list.push({ id: "drv", lng: driverLoc[0], lat: driverLoc[1], kind: "driver", label: "Livreur" });
    if (st === "PICKED_UP" || st === "IN_TRANSIT") {
      const c = driverLoc || pickup;
      if (c) list.push({ id: "parcel", lng: c[0], lat: c[1], kind: "parcel", label: "Colis" });
    }
    return list;
  }, [selected, pickup, drop, driverLoc, st]);

  return (
    <DashboardLayout title="Colis / suivi" subtitle="Trajet, ETA, GPS livreur — code masqué">
      <div className="grid lg:grid-cols-5 gap-4">
        <ul className="lg:col-span-2 space-y-2 max-h-[70vh] overflow-y-auto">
          {orders.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => setSelected(o)}
                className={`w-full text-left rounded-xl border p-3 text-sm ${selected?.id === o.id ? "border-primary bg-primary/10" : "border-white/10 bg-white/[0.03]"}`}
              >
                <p className="font-heading text-xs text-primary tabular-nums">{o.order_number}</p>
                <p className="truncate">{o.pickup_address}</p>
                <p className="truncate text-white/40 text-xs">→ {o.delivery_address}</p>
                <p className="text-primary text-xs mt-1">{statusLabel(o.status)} · {o.recipient_name || "Destinataire"}</p>
              </button>
            </li>
          ))}
          {orders.length === 0 && <p className="text-white/40 text-sm">Aucun colis en cours.</p>}
        </ul>
        <div className="lg:col-span-3 space-y-3">
          <OpsMap markers={markers} route={route} pitch={58} className="h-[360px] sm:h-[420px]" />
          {selected && (
            <div className="rounded-xl border border-white/10 p-4 text-sm space-y-2">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="font-heading text-primary tabular-nums">{selected.order_number}</p>
                  <p className="text-white/70">{statusLabel(selected.status)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-white/40">ETA</p>
                  <p className="font-heading text-xl font-semibold tabular-nums">{etaMin ? `${etaMin} min` : "—"}</p>
                </div>
              </div>
              <p>
                Livreur GPS :{" "}
                {driverLoc
                  ? `${driverLoc[1].toFixed(5)}, ${driverLoc[0].toFixed(5)}`
                  : selected.driver_id
                    ? "En attente de ping"
                    : "Non attribué"}
              </p>
              <p>Destinataire : {selected.recipient_name || "—"} · {selected.recipient_phone || "—"}</p>
              <p>Type : {selected.package_description || "colis"} · {selected.weight_kg ?? "—"} kg</p>
              <p>Contrôle : {selected.evaluation_level || "—"}</p>
              <p className="text-white/40 text-xs">Le code de remise n’est jamais affiché ici.</p>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => issueCode(selected.id)}>
                  Envoyer le code au destinataire
                </Button>
                <Button size="sm" variant="outline" onClick={() => analyze(selected.id)}>
                  Analyser (Groq)
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminTracking;
