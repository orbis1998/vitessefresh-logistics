import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Loader2, Package, Phone, Navigation, RefreshCw, AlertCircle, CheckCircle2,
  ArrowRight, Clock, KeyRound, Copy, Check, Share2, ShieldCheck, Banknote, Smartphone
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MapView from "@/components/MapView";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { useToast } from "@/hooks/use-toast";

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente d'un livreur", color: "text-yellow-400" },
  accepted: { label: "Livreur en route vers ramassage", color: "text-primary" },
  picked_up: { label: "Colis récupéré", color: "text-primary" },
  in_transit: { label: "En cours de livraison", color: "text-primary" },
  delivered: { label: "Livrée", color: "text-green-400" },
  cancelled: { label: "Annulée", color: "text-red-400" },
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
  const [copiedOtp, setCopiedOtp] = useState(false);
  const { token } = useMapboxToken();
  const { toast } = useToast();

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
      .on("postgres_changes", { event: "*", schema: "public", table: "driver_locations", filter: `driver_id=eq.${order.driver_id}` }, (payload: any) => {
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
    if (!driverLoc || !order || !token) return;

    const calculateRoute = async () => {
      setCalculatingRoute(true);
      try {
        const dropoff = [Number(order.dropoff_lng), Number(order.dropoff_lat)] as [number, number];
        const driver = [driverLoc.lng, driverLoc.lat] as [number, number];

        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${driver[0]},${driver[1]};${dropoff[0]},${dropoff[1]}?overview=full&geometries=geojson&access_token=${token}`
        );
        const data = await response.json();

        if (data.routes && data.routes[0]) {
          const routeData = data.routes[0];
          const coordinates = routeData.geometry.coordinates as [number, number][];
          setRoute(coordinates);
          setEstimatedTime(routeData.duration); // duration in seconds
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
      .from("driver_locations")
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

  const handleCopyOtp = () => {
    if (!order?.delivery_otp) return;
    navigator.clipboard.writeText(order.delivery_otp);
    setCopiedOtp(true);
    toast({ title: "Code copié !", description: `Le code OTP ${order.delivery_otp} a été copié dans le presse-papier.` });
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!order) return;
    const otp = order.delivery_otp || "N/A";
    const text = `📦 *Livraison Vita Express Kinshasa*\n` +
      `Bonjour ! Voici les détails pour réceptionner le colis :\n\n` +
      `📍 *Destination :* ${order.dropoff_address}\n` +
      `🔑 *Code secret OTP :* ${otp}\n\n` +
      `⚠️ *Important :* Donnez ce code au livreur uniquement lorsqu'il est sur place pour vous remettre le colis.\n\n` +
      `🔗 *Lien de suivi :* ${window.location.origin}/tracking`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const markers = order
    ? [
        { coordinates: [Number(order.pickup_lng), Number(order.pickup_lat)] as [number, number], type: "pickup" as const, popup: "Ramassage" },
        { coordinates: [Number(order.dropoff_lng), Number(order.dropoff_lat)] as [number, number], type: "delivery" as const, popup: "Livraison" },
        ...(driverLoc ? [{ coordinates: [driverLoc.lng, driverLoc.lat] as [number, number], type: "driver" as const, popup: "Livreur" }] : []),
      ]
    : [];

  return (
    <DashboardLayout title="Suivi en direct" subtitle="Position du livreur en temps réel">
      <div className="space-y-6">
        {!orderId ? (
          <>
            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-32 bg-secondary rounded-2xl" />
                <div className="h-32 bg-secondary rounded-2xl" />
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-4 animate-in fade-in">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Package className="w-7 h-7 text-primary" />
                </div>
                <h2 className="font-poppins font-semibold text-lg">Aucune livraison en cours</h2>
                <p className="text-muted-foreground text-sm">Lancez une commande pour voir le suivi en direct.</p>
                <Link to="/dashboard/orders"><Button size="lg" className="font-bold tracking-wide">Nouvelle commande</Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Sélectionnez une livraison à suivre :</p>
                {activeOrders.map((o) => (
                  <Link key={o.id} to={`/dashboard/tracking?id=${o.id}`} className="group block bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-all animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{o.pickup_address} → {o.dropoff_address}</p>
                        <p className={`text-sm mt-1 ${STATUS_META[o.status]?.color}`}>{STATUS_META[o.status]?.label}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-2" />
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-sm text-muted-foreground">{o.distance_km} km</span>
                      <Badge className="bg-primary/10 text-primary border-primary/20">{Number(o.price).toLocaleString()} FC</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : !order ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-4 animate-in fade-in">
            {/* Status card */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <Badge className="mb-2 bg-primary/10 text-primary border-primary/20">{STATUS_META[order.status]?.label}</Badge>
                  <p className="font-semibold text-sm">{order.pickup_address} → {order.dropoff_address}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{order.distance_km} km</p>
                  <p className="text-xl font-bold text-primary">{Number(order.price).toLocaleString()} FC</p>
                </div>
              </div>

              {/* GPS status indicator */}
              <div className={`flex items-center gap-3 p-3 rounded-xl ${
                gpsActive === true ? "bg-green-500/10 border border-green-500/20" :
                gpsActive === false ? "bg-yellow-500/10 border border-yellow-500/20" :
                "bg-secondary border border-border"
              }`}>
                {gpsActive === true ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : gpsActive === false ? (
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {gpsActive === true ? "GPS du livreur actif" :
                     gpsActive === false ? "Le livreur n'a pas activé son GPS" :
                     "Vérification GPS..."}
                  </p>
                  {gpsActive === false && (
                    <p className="text-xs text-muted-foreground mt-0.5">Le livreur doit activer le partage GPS pour afficher sa position.</p>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={refreshDriverLoc} disabled={refreshing}>
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                </Button>
              </div>

              {/* Mode de paiement */}
              <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
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
                <Badge variant="outline" className={order.payment_status === "paid" ? "border-green-500 text-green-400" : "border-border text-muted-foreground"}>
                  {order.payment_status === "paid" ? "Payé ✓" : order.payment_method === "cash" ? "À régler au livreur" : "En attente"}
                </Badge>
              </div>
            </div>

            {/* ── CARTE CODE OTP DE LIVRAISON SÉCURISÉ ── */}
            {order.status !== "delivered" && order.status !== "cancelled" && (
              <div className="bg-gradient-to-br from-primary/15 via-card to-card border-2 border-primary/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-0 pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                      <span className="font-poppins font-bold text-sm uppercase tracking-wider text-foreground">
                        Code de sécurité livraison (OTP)
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground max-w-md">
                      Communiquez ce code au livreur <strong>uniquement à son arrivée</strong> lors de la remise effective du colis.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-black/80 border border-primary/40 px-4 py-2 rounded-xl text-2xl font-mono font-black tracking-widest text-primary shadow-inner">
                      {order.delivery_otp || "----"}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={handleCopyOtp}
                        title="Copier le code"
                        className="rounded-xl border border-border"
                      >
                        {copiedOtp ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-primary" />}
                      </Button>

                      <Button
                        size="sm"
                        onClick={handleShareWhatsApp}
                        className="bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl gap-1.5 shadow-sm"
                        title="Partager par WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Partager WhatsApp</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {order.status === "delivered" && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-400">Course livrée avec succès</p>
                  <p className="text-xs text-muted-foreground">La remise du colis a été validée avec le code secret OTP.</p>
                </div>
              </div>
            )}

            {/* Map */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden h-[400px] relative">
              <MapView markers={markers} route={route} estimatedTime={estimatedTime} className="absolute inset-0" readonly={true} center={markers[0]?.coordinates} />
              {!order.driver_id && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Navigation className="w-8 h-8 text-primary mx-auto" />
                    <p className="text-sm font-medium">En attente d'un livreur disponible...</p>
                  </div>
                </div>
              )}
              {estimatedTime && (
                <div className="absolute top-3 left-3 bg-black/90 backdrop-blur-xl border border-border rounded-xl px-4 py-2 flex items-center gap-2 z-10">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">
                    {estimatedTime < 60
                      ? `${Math.round(estimatedTime)} sec`
                      : estimatedTime < 3600
                      ? `${Math.round(estimatedTime / 60)} min`
                      : `${Math.round(estimatedTime / 3600)} h ${Math.round((estimatedTime % 3600) / 60)} min`}
                  </span>
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
