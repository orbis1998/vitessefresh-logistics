import { useEffect, useRef, useState } from "react";
import {
  Loader2, Navigation, Phone, ChevronLeft, ChevronRight,
  Package, CheckCircle2, Truck, CircleDot, Circle
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MapView from "@/components/MapView";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const STATUS_META: Record<string, { label: string; icon: any; color: string; step: number }> = {
  accepted:  { label: "Acceptée",      icon: CheckCircle2, color: "text-primary", step: 0 },
  picked_up: { label: "Ramassée",      icon: Package,      color: "text-primary", step: 1 },
  in_transit:{ label: "En transit",     icon: Truck,        color: "text-primary", step: 2 },
  delivered: { label: "Livrée",         icon: CheckCircle2, color: "text-green-400", step: 3 },
};

const STEPS = [
  { key: "accepted",  label: "Acceptée" },
  { key: "picked_up", label: "Ramassée" },
  { key: "in_transit",label: "Transit" },
  { key: "delivered", label: "Livrée" },
];

const NEXT_STATUS: Record<string, { next: string; label: string }> = {
  accepted:   { next: "picked_up",  label: "Colis récupéré ✓" },
  picked_up:  { next: "in_transit", label: "Démarrer livraison →" },
  in_transit: { next: "delivered",  label: "Marquer livrée ✓" },
};

/* ───────── Component ───────── */
const MyDeliveries = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const watchIdRef = useRef<number | null>(null);
  const toastShown = useRef(false);

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

  /* ---- GPS sharing ---- */
  const startSharing = () => {
    if (!navigator.geolocation || !user) {
      toast({ title: "GPS indisponible", variant: "destructive" });
      return;
    }
    setSharing(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, heading, speed } = pos.coords;
        setCurrentPos({ lat: latitude, lng: longitude });
        await supabase.from("driver_locations").upsert({
          driver_id: user.id,
          latitude,
          longitude,
          heading: heading ?? null,
          speed: speed ?? null,
          updated_at: new Date().toISOString(),
        });
        if (!toastShown.current) {
          toast({ title: "GPS actif", description: "Position envoyée en temps réel" });
          toastShown.current = true;
        }
      },
      (err) => toast({ title: "Erreur GPS", description: err.message, variant: "destructive" }),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  };

  const stopSharing = () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setSharing(false);
    toastShown.current = false;
    toast({ title: "GPS arrêté" });
  };

  useEffect(() => () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); }, []);

  /* ---- Status advance ---- */
  const advanceStatus = async (order: any) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    const update: any = { status: next.next };
    if (next.next === "delivered") update.delivered_at = new Date().toISOString();
    await supabase.from("orders").update(update).eq("id", order.id);
    if (next.next === "delivered" && user) {
      await supabase.from("driver_profiles").update({ status: "available" }).eq("user_id", user.id);
    }
    toast({ title: next.label.replace(/[✓→]/g, "").trim(), description: "Statut mis à jour" });
    load();
  };

  const active = orders.filter((o) => ["accepted", "picked_up", "in_transit"].includes(o.status));
  const history = orders.filter((o) => ["delivered", "cancelled"].includes(o.status));
  const current = active[activeIdx] ?? null;

  /* ---- Timeline helpers ---- */
  const currentStep = current ? STATUS_META[current.status]?.step ?? 0 : 0;

  /* ---- Markers ---- */
  const markers = current
    ? [
        { coordinates: [Number(current.pickup_lng), Number(current.pickup_lat)] as [number, number], type: "pickup" as const, popup: "Ramassage" },
        { coordinates: [Number(current.dropoff_lng), Number(current.dropoff_lat)] as [number, number], type: "delivery" as const, popup: "Livraison" },
        ...(currentPos ? [{ coordinates: [currentPos.lng, currentPos.lat] as [number, number], type: "driver" as const, popup: "Moi" }] : []),
      ]
    : [];

  return (
    <DashboardLayout title="Mes livraisons" subtitle="Gérez vos courses en cours">
      <div className="space-y-6 pb-24">

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-48 bg-secondary rounded-2xl" />
            <div className="h-24 bg-secondary rounded-2xl" />
          </div>
        )}

        {!loading && active.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-4 animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="font-poppins font-semibold text-xl">Aucune course active</h2>
            <p className="text-muted-foreground">Rendez-vous sur "Courses disponibles" pour en accepter une.</p>
          </div>
        )}

        {/* ── Active course (single) ── */}
        {!loading && current && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header + nav */}
            <div className="flex items-center justify-between">
              <div>
                <Badge className="mb-1 bg-primary/10 text-primary border-primary/20">{STATUS_META[current.status]?.label ?? current.status}</Badge>
                <p className="text-xs text-muted-foreground">Course {activeIdx + 1} / {active.length}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" disabled={activeIdx === 0} onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" disabled={activeIdx >= active.length - 1} onClick={() => setActiveIdx((i) => Math.min(active.length - 1, i + 1))}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between relative">
                {/* connecting line */}
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-border">
                  <div
                    className="h-full bg-primary transition-all duration-700 ease-out"
                    style={{ width: `${Math.min((currentStep / (STEPS.length - 1)) * 100, 100)}%` }}
                  />
                </div>
                {STEPS.map((s, i) => {
                  const done = i <= currentStep;
                  const Icon = done ? CheckCircle2 : Circle;
                  return (
                    <div key={s.key} className="relative z-10 flex flex-col items-center gap-1.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                        done ? "bg-primary border-primary text-black" : "bg-card border-border text-muted-foreground"
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-[10px] font-medium uppercase tracking-wider ${done ? "text-primary" : "text-muted-foreground"}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Map */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden h-[320px] relative">
              <MapView markers={markers} className="absolute inset-0" />
              {!sharing && (
                <button
                  onClick={startSharing}
                  className="absolute bottom-3 right-3 z-10 w-12 h-12 bg-primary text-black rounded-full shadow-yellow flex items-center justify-center hover:scale-105 transition-transform"
                  title="Activer GPS"
                >
                  <Navigation className="w-5 h-5" />
                </button>
              )}
              {sharing && (
                <div className="absolute bottom-3 right-3 z-10">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-40" />
                    <button
                      onClick={stopSharing}
                      className="relative w-12 h-12 bg-primary text-black rounded-full shadow-yellow flex items-center justify-center hover:scale-105 transition-transform"
                      title="Arrêter GPS"
                    >
                      <Navigation className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Addresses card */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <CircleDot className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Retrait</p>
                  <p className="text-sm font-medium">{current.pickup_address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Package className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Livraison</p>
                  <p className="text-sm font-medium">{current.dropoff_address}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="text-sm text-muted-foreground">{current.distance_km} km</div>
                <div className="text-xl font-bold text-primary">{Number(current.price).toLocaleString()} FC</div>
              </div>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Historique</h3>
                {history.slice(0, 5).map((o) => (
                  <div key={o.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:border-primary/20 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{o.pickup_address} → {o.dropoff_address}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <Badge className={o.status === "delivered" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}>
                      {STATUS_META[o.status]?.label ?? o.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Sticky bottom action bar ── */}
      {current && NEXT_STATUS[current.status] && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl border-t border-border p-4 safe-area-pb">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            {current.recipient_phone && (
              <a
                href={`tel:${current.recipient_phone}`}
                className="shrink-0 w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
              >
                <Phone className="w-5 h-5" />
              </a>
            )}
            <Button
              size="lg"
              className="flex-1 font-bold tracking-wide"
              onClick={() => advanceStatus(current)}
            >
              {NEXT_STATUS[current.status].label}
            </Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyDeliveries;
