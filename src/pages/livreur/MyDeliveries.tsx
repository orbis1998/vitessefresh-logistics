import { useEffect, useRef, useState } from "react";
import { Loader2, Navigation, Phone } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MapView from "@/components/MapView";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const NEXT_STATUS: Record<string, { next: string; label: string }> = {
  accepted: { next: "picked_up", label: "Marquer colis récupéré" },
  picked_up: { next: "in_transit", label: "Démarrer la livraison" },
  in_transit: { next: "delivered", label: "Marquer comme livrée" },
};

const MyDeliveries = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null);
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
      },
      (err) => toast({ title: "Erreur GPS", description: err.message, variant: "destructive" }),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    toast({ title: "Partage GPS activé" });
  };

  const stopSharing = () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setSharing(false);
    toast({ title: "Partage GPS arrêté" });
  };

  useEffect(() => () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); }, []);

  const advanceStatus = async (order: any) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    const update: any = { status: next.next };
    if (next.next === "delivered") {
      update.delivered_at = new Date().toISOString();
    }
    await supabase.from("orders").update(update).eq("id", order.id);
    if (next.next === "delivered" && user) {
      await supabase.from("driver_profiles").update({ status: "available" }).eq("user_id", user.id);
    }
    load();
  };

  const active = orders.filter((o) => ["accepted", "picked_up", "in_transit"].includes(o.status));
  const history = orders.filter((o) => ["delivered", "cancelled"].includes(o.status));

  return (
    <DashboardLayout title="Mes livraisons" subtitle="Gérez vos courses et partagez votre position">
      <div className="space-y-6">
        <div className="bg-background rounded-2xl border border-border p-5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${sharing ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
            <div>
              <p className="font-semibold">Partage GPS {sharing ? "actif" : "inactif"}</p>
              {currentPos && <p className="text-xs text-muted-foreground">{currentPos.lat.toFixed(5)}, {currentPos.lng.toFixed(5)}</p>}
            </div>
          </div>
          {sharing ? (
            <Button variant="outline" onClick={stopSharing}>Arrêter</Button>
          ) : (
            <Button onClick={startSharing}><Navigation className="w-4 h-4 mr-2" />Activer le GPS</Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <>
            <div>
              <h2 className="font-poppins font-semibold mb-3">Courses actives ({active.length})</h2>
              {active.length === 0 ? (
                <div className="bg-background rounded-2xl border border-border p-8 text-center text-muted-foreground">Aucune course active.</div>
              ) : (
                <div className="space-y-4">
                  {active.map((o) => {
                    const markers = [
                      { coordinates: [Number(o.pickup_lng), Number(o.pickup_lat)] as [number, number], type: "pickup" as const, popup: "Ramassage" },
                      { coordinates: [Number(o.dropoff_lng), Number(o.dropoff_lat)] as [number, number], type: "delivery" as const, popup: "Livraison" },
                      ...(currentPos ? [{ coordinates: [currentPos.lng, currentPos.lat] as [number, number], type: "driver" as const, popup: "Moi" }] : []),
                    ];
                    return (
                      <div key={o.id} className="bg-background rounded-2xl border border-border p-5 space-y-4">
                        <div className="flex items-start justify-between flex-wrap gap-3">
                          <div>
                            <Badge>{o.status}</Badge>
                            <p className="font-medium mt-2">{o.pickup_address}</p>
                            <p className="text-sm text-muted-foreground">→ {o.dropoff_address}</p>
                            {o.recipient_phone && (
                              <a href={`tel:${o.recipient_phone}`} className="text-sm text-primary inline-flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" />{o.recipient_phone}
                              </a>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">{o.distance_km} km</p>
                            <p className="text-lg font-bold text-primary">{Number(o.price).toLocaleString()} FC</p>
                          </div>
                        </div>
                        <MapView markers={markers} className="w-full h-64" />
                        {NEXT_STATUS[o.status] && (
                          <Button className="w-full" onClick={() => advanceStatus(o)}>
                            {NEXT_STATUS[o.status].label}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {history.length > 0 && (
              <div>
                <h2 className="font-poppins font-semibold mb-3">Historique</h2>
                <div className="space-y-2">
                  {history.map((o) => (
                    <div key={o.id} className="bg-background rounded-xl border border-border p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{o.pickup_address} → {o.dropoff_address}</p>
                        <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("fr-FR")}</p>
                      </div>
                      <Badge variant={o.status === "delivered" ? "default" : "destructive"}>{o.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyDeliveries;
