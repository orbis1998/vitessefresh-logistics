import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Copy, MapPin, Package, Plus } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import MapView from "@/components/MapView";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { statusLabel, toVitaStatus } from "@/lib/status";

const STEPS = ["SUBMITTED", "ACCEPTED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"];

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = () =>
      supabase
        .from("orders")
        .select("id, order_number, status, total_price, pickup_address, delivery_address, pickup_lat, pickup_lng, delivery_lat, delivery_lng, created_at, recipient_name")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)
        .then(({ data }) => {
          setOrders(data ?? []);
          setLoading(false);
        });
    load();
    const ch = supabase
      .channel("client-home")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `client_id=eq.${user.id}` }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user]);

  const active = orders.find((o) =>
    ["SUBMITTED", "EVALUATING", "PENDING_VALIDATION", "PENDING", "ACCEPTED", "ASSIGNED", "COLLECTING", "PICKED_UP", "IN_TRANSIT"].includes(toVitaStatus(o.status)),
  );
  const delivered = orders.filter((o) => toVitaStatus(o.status) === "DELIVERED");
  const spent = delivered.reduce((s, o) => s + Number(o.total_price ?? 0), 0);
  const stepIdx = active ? Math.max(0, STEPS.indexOf(toVitaStatus(active.status) === "COLLECTING" ? "ASSIGNED" : toVitaStatus(active.status))) : -1;

  const markers = useMemo(() => {
    if (!active) return [];
    return [
      { coordinates: [Number(active.pickup_lng), Number(active.pickup_lat)] as [number, number], type: "pickup" as const, popup: "Retrait" },
      { coordinates: [Number(active.delivery_lng), Number(active.delivery_lat)] as [number, number], type: "delivery" as const, popup: "Livraison" },
    ];
  }, [active]);

  const copyNumber = async (n: string) => {
    try {
      await navigator.clipboard.writeText(n);
      toast({ title: "Numéro copié", description: n });
    } catch {
      toast({ title: n });
    }
  };

  return (
    <DashboardLayout title="Mes courses" subtitle="Suivi par numéro de colis">
      <div className="max-w-5xl space-y-6">
        {active ? (
          <div className="rounded-[1.5rem] border border-white/10 bg-[#0c0c0c] overflow-hidden">
            <div className="grid lg:grid-cols-2">
              <div className="p-6 lg:p-8 space-y-5">
                <p className="text-[11px] tracking-[0.18em] uppercase text-white/40">Colis en cours</p>
                <button
                  type="button"
                  onClick={() => copyNumber(active.order_number || active.id)}
                  className="group text-left"
                >
                  <p className="font-heading text-3xl lg:text-4xl font-bold tracking-tight text-primary tabular-nums">
                    {active.order_number || "en attente"}
                  </p>
                  <p className="text-xs text-white/40 mt-1 inline-flex items-center gap-1">
                    <Copy className="w-3 h-3" /> Copier le numéro de suivi
                  </p>
                </button>
                <p className="text-lg font-medium">{statusLabel(active.status)}</p>
                <div className="flex gap-1">
                  {STEPS.map((s, i) => (
                    <span
                      key={s}
                      className={`h-1 flex-1 rounded-full ${i <= stepIdx ? "bg-primary" : "bg-white/10"}`}
                    />
                  ))}
                </div>
                <div className="space-y-2 text-sm">
                  <p className="flex gap-2 text-white/80">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    {active.pickup_address}
                  </p>
                  <p className="flex gap-2 text-white/55">
                    <MapPin className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    {active.delivery_address}
                  </p>
                </div>
                {toVitaStatus(active.status) === "PICKED_UP" || toVitaStatus(active.status) === "IN_TRANSIT" ? (
                  <p className="text-xs text-white/50 rounded-xl border border-primary/20 bg-primary/5 p-3">
                    Le code de remise a été envoyé au destinataire sur WhatsApp. Le livreur ne le voit pas.
                  </p>
                ) : null}
                <Button asChild>
                  <Link to={`/dashboard/tracking?id=${active.id}`}>
                    Suivre sur la carte
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
              <div className="h-[280px] lg:h-auto min-h-[280px] relative">
                <MapView markers={markers} readonly className="absolute inset-0 rounded-none" />
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-white/10 bg-[#0c0c0c] p-8 lg:p-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <h2 className="font-heading text-3xl font-bold tracking-tight">Envoyer un colis</h2>
              <p className="text-white/55 mt-2 max-w-md">
                Un numéro de suivi, un code WhatsApp pour le destinataire, un livreur à Kinshasa.
              </p>
            </div>
            <Button size="lg" asChild>
              <Link to="/dashboard/order">
                <Plus className="w-4 h-4" />
                Nouvelle course
              </Link>
            </Button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "En cours", value: active ? "1" : "0" },
            { label: "Livrés", value: String(delivered.length) },
            { label: "Dépensé", value: `${spent.toLocaleString("fr-FR")} FC` },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/10 px-4 py-4">
              <p className="text-[11px] uppercase tracking-wider text-white/40">{s.label}</p>
              <p className="font-heading text-xl font-semibold mt-1 tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-semibold">Dernières courses</h3>
            <Link to="/dashboard/orders-list" className="text-sm text-primary">
              Tout voir
            </Link>
          </div>
          {loading ? (
            <div className="h-24 rounded-2xl bg-white/5 animate-pulse" />
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-white/10 p-8 text-center text-white/45 text-sm">
              Pas encore de colis. Le numéro de suivi apparaîtra ici dès la première course.
            </div>
          ) : (
            <ul className="space-y-2">
              {orders.slice(0, 6).map((o) => (
                <li key={o.id}>
                  <Link
                    to={`/dashboard/tracking?id=${o.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 hover:border-primary/40"
                  >
                    <Package className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-heading text-sm tabular-nums text-primary">{o.order_number}</p>
                      <p className="text-xs text-white/45 truncate">{o.pickup_address} → {o.delivery_address}</p>
                    </div>
                    <span className="text-xs text-white/50 shrink-0">{statusLabel(o.status)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
