import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Loader2, Package, Phone, Navigation, RefreshCw, AlertCircle, CheckCircle2,
  ArrowRight, Share2, ShieldCheck, Banknote, Smartphone
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MapView from "@/components/MapView";
import MissionSheet from "@/components/ops/MissionSheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { drivingRoute } from "@/lib/vita-map";
import { useToast } from "@/hooks/use-toast";

const STATUS_META: Record<string, { label: string; color: string }> = {
  PENDING: { label: "En attente", color: "text-yellow-400" },
  SUBMITTED: { label: "Demande soumise", color: "text-yellow-400" },
  EVALUATING: { label: "En évaluation", color: "text-yellow-400" },
  PENDING_VALIDATION: { label: "Attente validation", color: "text-yellow-400" },
  ACCEPTED: { label: "Acceptée", color: "text-primary" },
  ASSIGNED: { label: "Livreur attribué", color: "text-primary" },
  COLLECTING: { label: "Collecte en cours", color: "text-primary" },
  PICKED_UP: { label: "Colis collecté", color: "text-primary" },
  IN_TRANSIT: { label: "En cours de livraison", color: "text-primary" },
  DELIVERED: { label: "Livrée", color: "text-green-400" },
  CANCELLED: { label: "Annulée", color: "text-red-400" },
  REJECTED: { label: "Refusée", color: "text-red-400" },
};

const Tracking = () => {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const orderId = params.get("id");
  const [order, setOrder] = useState<any | null>(null);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [driverLoc, setDriverLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gpsActive, setGpsActive] = useState<boolean | null>(null);
  const [route, setRoute] = useState<Array<[number, number]> | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const { token } = useMapboxToken();
  const { toast } = useToast();

  // load active orders list
  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("*")
      .eq("client_id", user.id)
      .in("status", ["PENDING", "SUBMITTED", "ACCEPTED", "ASSIGNED", "COLLECTING", "PICKED_UP", "IN_TRANSIT"])
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
          .from("driver_pings")
          .select("latitude,longitude")
          .eq("driver_id", data.driver_id)
          .maybeSingle()
          .then(({ data: loc }) => {
            if (loc) {
              setDriverLoc({ lat: Number(loc.latitude), lng: Number(loc.longitude) });
              setGpsActive(true);
            } else {
              setGpsActive(false);
            }
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
      .on("postgres_changes", { event: "*", schema: "public", table: "driver_pings", filter: `driver_id=eq.${order.driver_id}` }, (payload: any) => {
        const row = payload.new;
        if (row) {
          setDriverLoc({ lat: Number(row.latitude), lng: Number(row.longitude) });
          setGpsActive(true);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [order?.driver_id]);

  // calculate route when driver location or order changes
  useEffect(() => {
    if (!driverLoc || !order) return;

    const calculateRoute = async () => {
      setCalculatingRoute(true);
      try {
        const dropoff = [Number(order.delivery_lng), Number(order.delivery_lat)] as [number, number];
        const driver = [driverLoc.lng, driverLoc.lat] as [number, number];
        const data = await drivingRoute(driver, dropoff, token);
        if (data) {
          setRoute(data.coordinates);
          setEstimatedTime(data.durationSec);
        }
      } catch (error) {
        console.error("Error calculating route:", error);
      } finally {
        setCalculatingRoute(false);
      }
    };

    calculateRoute();
  }, [driverLoc, order, token]);

  const refreshDriverLoc = () => {
    if (!order?.driver_id) return;
    setRefreshing(true);
    supabase
      .from("driver_pings")
      .select("latitude,longitude")
      .eq("driver_id", order.driver_id)
      .maybeSingle()
      .then(({ data: loc }) => {
        if (loc) {
          setDriverLoc({ lat: Number(loc.latitude), lng: Number(loc.longitude) });
          setGpsActive(true);
        } else {
          setGpsActive(false);
        }
        setRefreshing(false);
      });
  };

  const handleShareWhatsApp = () => {
    if (!order) return;
    const text = `📦 *Livraison Vita Express Kinshasa*\n` +
      `Le code de remise est envoyé uniquement au destinataire par WhatsApp.\n\n` +
      `📍 *Destination :* ${order.delivery_address}\n` +
      `🔗 *Lien de suivi :* ${window.location.origin}/tracking`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const stLive = order ? String(order.status).toUpperCase() : "";
  const markers = order
    ? [
        { coordinates: [Number(order.pickup_lng), Number(order.pickup_lat)] as [number, number], type: "pickup" as const, popup: "Ramassage" },
        { coordinates: [Number(order.delivery_lng), Number(order.delivery_lat)] as [number, number], type: "delivery" as const, popup: "Livraison" },
        ...(driverLoc ? [{ coordinates: [driverLoc.lng, driverLoc.lat] as [number, number], type: "driver" as const, popup: "Livreur" }] : []),
        ...(stLive === "PICKED_UP" || stLive === "IN_TRANSIT"
          ? [
              {
                coordinates: (driverLoc
                  ? [driverLoc.lng, driverLoc.lat]
                  : [Number(order.pickup_lng), Number(order.pickup_lat)]) as [number, number],
                type: "parcel" as const,
                popup: "Colis",
              },
            ]
          : [
              {
                coordinates: [Number(order.pickup_lng), Number(order.pickup_lat)] as [number, number],
                type: "parcel" as const,
                popup: "Colis",
              },
            ]),
      ]
    : [];

  const etaLabel = estimatedTime
    ? estimatedTime < 60
      ? `${Math.round(estimatedTime)} s`
      : estimatedTime < 3600
        ? `${Math.round(estimatedTime / 60)} min`
        : `${Math.round(estimatedTime / 3600)} h`
    : undefined;

  if (orderId && order) {
    const st = String(order.status).toUpperCase();
    return (
      <DashboardLayout title="Suivi en direct" flush>
        <div className="relative h-[calc(100dvh-3.5rem-6rem)] lg:h-[calc(100dvh-4rem)] bg-[#0b0c0e]">
          <MapView
            markers={markers}
            route={route ?? []}
            readonly
            pitch={62}
            bearing={26}
            className="absolute inset-0 rounded-none min-h-0"
            center={markers[0]?.coordinates}
          />
          <div className="pointer-events-none absolute inset-0 z-10 p-3 sm:p-5 lg:p-8 flex flex-col justify-end lg:justify-start">
            <MissionSheet
              number={order.order_number}
              status={STATUS_META[st]?.label || st}
              eta={etaLabel}
              points={[
                { kind: "pickup", title: order.pickup_address || "Ramassage", detail: "Lieu du ramassage", active: ["SUBMITTED", "ACCEPTED", "ASSIGNED", "COLLECTING"].includes(st) },
                { kind: "parcel", title: order.package_description || "Colis", detail: order.order_number || "En course", active: st === "PICKED_UP" || st === "IN_TRANSIT" },
                { kind: "driver", title: gpsActive ? "Livreur en mouvement" : "Livreur", detail: gpsActive ? "GPS live" : "En attente GPS", active: Boolean(gpsActive) },
                { kind: "drop", title: order.recipient_name || "Destinataire", detail: order.delivery_address || "Remise", active: st === "IN_TRANSIT" },
              ]}
            />
            <div className="pointer-events-auto mt-3 flex flex-wrap gap-2">
              <Button variant="ghost" size="icon" onClick={refreshDriverLoc} disabled={refreshing} className="bg-black/50">
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
              {st !== "DELIVERED" && st !== "CANCELLED" ? (
                <Button size="sm" className="bg-green-600 hover:bg-green-500 text-white" onClick={handleShareWhatsApp}>
                  <Share2 className="w-3.5 h-3.5 mr-1.5" /> Destinataire
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Suivi en direct" subtitle="Flux 4D livreur · colis · destinataire" flush>
      <div className="relative min-h-[calc(100dvh-3.5rem-5.5rem)] md:min-h-[calc(100dvh-4rem)] bg-[#0b0c0e] p-3 sm:p-5 lg:p-8">
        {!orderId ? (
          <div className="mx-auto max-w-2xl space-y-4">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-32 rounded-xl bg-white/5" />
                <div className="h-32 rounded-xl bg-white/5" />
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="vita-panel-card rounded-xl p-10 text-center space-y-4">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Package className="w-7 h-7 text-primary" />
                </div>
                <h2 className="font-heading font-semibold text-lg">Aucune livraison en cours</h2>
                <p className="text-white/50 text-sm">Lancez une commande pour voir le suivi 4D en direct.</p>
                <Link to="/dashboard/order">
                  <Button size="lg" className="font-semibold">Nouvelle course</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-white/45">Sélectionnez une livraison à suivre :</p>
                {activeOrders.map((o) => (
                  <Link
                    key={o.id}
                    to={`/dashboard/tracking?id=${o.id}`}
                    className="group block vita-panel-card rounded-xl p-5 hover:border-primary/35 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-heading text-sm tabular-nums text-primary">{o.order_number}</p>
                        <p className="font-medium text-sm truncate text-white/90">{o.pickup_address} → {o.delivery_address}</p>
                        <p className={`text-sm mt-1 ${STATUS_META[String(o.status).toUpperCase()]?.color}`}>
                          {STATUS_META[String(o.status).toUpperCase()]?.label}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-white/35 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-2" />
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <span className="text-sm text-white/45">{o.distance} km</span>
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        {Number(o.total_price ?? 0).toLocaleString()} FC
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : !order ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4 animate-in fade-in">
            <div className="vita-panel-card rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-heading text-xl tabular-nums text-primary mb-1">{order.order_number}</p>
                  <Badge className="mb-2 bg-primary/10 text-primary border-primary/20">
                    {STATUS_META[String(order.status).toUpperCase()]?.label}
                  </Badge>
                  <p className="font-semibold text-sm text-white/90">
                    {order.pickup_address} → {order.delivery_address}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/45">{order.distance} km</p>
                  <p className="text-xl font-bold text-primary">{Number(order.total_price ?? 0).toLocaleString()} FC</p>
                </div>
              </div>

              <div
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  gpsActive === true
                    ? "bg-green-500/10 border border-green-500/20"
                    : gpsActive === false
                      ? "bg-yellow-500/10 border border-yellow-500/20"
                      : "bg-white/5 border border-white/10"
                }`}
              >
                {gpsActive === true ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : gpsActive === false ? (
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Loader2 className="w-5 h-5 text-white/45 animate-spin" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {gpsActive === true
                      ? "GPS du livreur actif"
                      : gpsActive === false
                        ? "Le livreur n'a pas activé son GPS"
                        : "Vérification GPS..."}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={refreshDriverLoc} disabled={refreshing}>
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                </Button>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-white/45">
                <div className="flex items-center gap-2">
                  {order.payment_method === "kpay" || order.payment_method === "flexpay" ? (
                    <Smartphone className="w-4 h-4 text-primary" />
                  ) : (
                    <Banknote className="w-4 h-4 text-primary" />
                  )}
                  <span>
                    {order.payment_method === "kpay" || order.payment_method === "flexpay"
                      ? `Mobile Money ${order.payment_phone ? `(${order.payment_phone})` : ""}`
                      : "Paiement en espèces à la livraison"}
                  </span>
                </div>
              </div>
            </div>

            {String(order.status).toUpperCase() !== "DELIVERED" && String(order.status).toUpperCase() !== "CANCELLED" && (
              <div className="vita-panel-card rounded-xl border-primary/30 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span className="font-heading font-bold text-sm uppercase tracking-wider">Code destinataire</span>
                </div>
                <p className="text-xs text-white/45 max-w-md">
                  Le code de remise est envoyé uniquement au destinataire (WhatsApp).
                </p>
                <Button size="sm" className="mt-3 bg-green-600 hover:bg-green-500 text-white" onClick={handleShareWhatsApp}>
                  <Share2 className="w-3.5 h-3.5 mr-1.5" /> Informer le destinataire
                </Button>
              </div>
            )}

            <div className="overflow-hidden h-[400px] relative rounded-xl border border-white/10 bg-[#0b0c0e]">
              <MapView
                markers={markers}
                route={route ?? []}
                estimatedTime={estimatedTime ? Math.max(1, Math.round(estimatedTime / 60)) : undefined}
                className="absolute inset-0"
                readonly
                pitch={62}
                bearing={26}
                center={markers[0]?.coordinates}
              />
              {!order.driver_id && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Navigation className="w-8 h-8 text-primary mx-auto" />
                    <p className="text-sm font-medium">En attente d'un livreur disponible...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Tracking;
