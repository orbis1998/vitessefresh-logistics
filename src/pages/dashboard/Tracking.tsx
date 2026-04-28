import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, Package, Phone } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MapView, { MapMarker } from "@/components/MapView";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente d'un livreur",
  accepted: "Livreur en route vers ramassage",
  picked_up: "Colis récupéré",
  in_transit: "En cours de livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const Tracking = () => {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const orderId = params.get("id");
  const [order, setOrder] = useState<any | null>(null);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [driverLoc, setDriverLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // load active orders list
  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("*")
      .eq("client_id", user.id)
      .in("status", ["pending", "accepted", "picked_up", "in_transit"])
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setActiveOrders(data ?? []);
        setLoading(false);
      });
  }, [user]);

  // load specific order + subscribe
  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      return;
    }
    supabase.from("orders").select("*").eq("id", orderId).maybeSingle().then(({ data }) => {
      setOrder(data);
      if (data?.driver_id) {
        supabase
          .from("driver_locations")
          .select("latitude,longitude")
          .eq("driver_id", data.driver_id)
          .maybeSingle()
          .then(({ data: loc }) => {
            if (loc) setDriverLoc({ lat: Number(loc.latitude), lng: Number(loc.longitude) });
          });
      }
    });

    const ch = supabase
      .channel(`order-${orderId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` }, (payload) => {
        setOrder(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [orderId]);

  // subscribe to driver location once we know driver
  useEffect(() => {
    if (!order?.driver_id) return;
    const ch = supabase
      .channel(`loc-${order.driver_id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "driver_locations", filter: `driver_id=eq.${order.driver_id}` }, (payload: any) => {
        const row = payload.new;
        if (row) setDriverLoc({ lat: Number(row.latitude), lng: Number(row.longitude) });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [order?.driver_id]);

  const markers: MapMarker[] = order
    ? [
        { id: "p", lat: Number(order.pickup_lat), lng: Number(order.pickup_lng), color: "hsl(142 76% 36%)", label: "Ramassage" },
        { id: "d", lat: Number(order.dropoff_lat), lng: Number(order.dropoff_lng), color: "hsl(0 84% 60%)", label: "Livraison" },
        ...(driverLoc ? [{ id: "driver", lat: driverLoc.lat, lng: driverLoc.lng, color: "hsl(45 100% 51%)", label: "Livreur" }] : []),
      ]
    : [];

  return (
    <DashboardLayout title="Suivi en direct" subtitle="Position du livreur en temps réel">
      <div className="space-y-6">
        {!orderId ? (
          <>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : activeOrders.length === 0 ? (
              <div className="bg-background rounded-2xl border border-border p-12 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="font-poppins font-semibold mb-2">Aucune livraison en cours</h2>
                <p className="text-muted-foreground mb-6">Lancez une commande pour voir le suivi en direct.</p>
                <Link to="/dashboard/order"><Button>Nouvelle commande</Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Sélectionnez une livraison à suivre :</p>
                {activeOrders.map((o) => (
                  <Link key={o.id} to={`/dashboard/tracking?id=${o.id}`} className="block bg-background rounded-2xl border border-border p-4 hover:border-primary/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{o.pickup_address} → {o.dropoff_address}</p>
                        <p className="text-sm text-muted-foreground">{STATUS_LABEL[o.status]}</p>
                      </div>
                      <Badge>{Number(o.price).toLocaleString()} FC</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : !order ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="bg-background rounded-2xl border border-border p-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <Badge>{STATUS_LABEL[order.status]}</Badge>
                <p className="font-semibold mt-2">{order.pickup_address} → {order.dropoff_address}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{order.distance_km} km</p>
                <p className="text-xl font-bold text-primary">{Number(order.price).toLocaleString()} FC</p>
              </div>
            </div>
            <MapView markers={markers} fitBounds className="w-full h-[500px]" />
            {order.driver_id && !driverLoc && (
              <p className="text-sm text-muted-foreground text-center">En attente de la position du livreur...</p>
            )}
            {!order.driver_id && (
              <p className="text-sm text-muted-foreground text-center">En attente d'un livreur disponible...</p>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Tracking;
