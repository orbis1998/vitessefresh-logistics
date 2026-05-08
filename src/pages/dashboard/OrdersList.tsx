import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Package, ArrowRight } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  accepted: { label: "Acceptée", color: "bg-primary/10 text-primary border-primary/20" },
  picked_up: { label: "Ramassée", color: "bg-primary/10 text-primary border-primary/20" },
  in_transit: { label: "En transit", color: "bg-primary/10 text-primary border-primary/20" },
  delivered: { label: "Livrée", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  cancelled: { label: "Annulée", color: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const OrdersList = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders(data ?? []);
        setLoading(false);
      });
  }, [user]);

  return (
    <DashboardLayout title="Mes commandes" subtitle="Historique complet de vos livraisons">
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-24 bg-secondary rounded-2xl" />
            <div className="h-24 bg-secondary rounded-2xl" />
            <div className="h-24 bg-secondary rounded-2xl" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-4 animate-in fade-in">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Package className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-poppins font-semibold text-lg">Aucune commande</h2>
            <p className="text-muted-foreground text-sm">Vous n'avez pas encore effectué de livraison.</p>
            <Link to="/dashboard/orders">
              <button className="mt-4 px-6 py-2 bg-primary text-black rounded-xl font-medium hover:opacity-90 transition-opacity">
                Créer une commande
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <Link
                key={o.id}
                to={`/dashboard/tracking?id=${o.id}`}
                className="group block bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{o.pickup_address} → {o.dropoff_address}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(o.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-2" />
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <Badge className={STATUS_META[o.status]?.color || "bg-secondary"}>
                    {STATUS_META[o.status]?.label || o.status}
                  </Badge>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{o.distance_km} km</span>
                    <span className="text-sm font-bold text-primary">{Number(o.price).toLocaleString()} FC</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OrdersList;
