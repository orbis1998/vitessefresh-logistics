import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const STATUS_LABEL: Record<string, { label: string; variant: any }> = {
  pending: { label: "En attente", variant: "secondary" },
  accepted: { label: "Acceptée", variant: "default" },
  picked_up: { label: "Récupérée", variant: "default" },
  in_transit: { label: "En route", variant: "default" },
  delivered: { label: "Livrée", variant: "default" },
  cancelled: { label: "Annulée", variant: "destructive" },
};

const Orders = () => {
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
    <DashboardLayout title="Mes commandes" subtitle="Historique complet">
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : orders.length === 0 ? (
          <div className="bg-background rounded-2xl border border-border p-12 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-poppins font-semibold mb-2">Aucune commande</h2>
            <p className="text-muted-foreground mb-6">Créez votre première livraison.</p>
            <Link to="/dashboard/order"><Button size="lg">Créer une commande</Button></Link>
          </div>
        ) : (
          orders.map((o) => {
            const st = STATUS_LABEL[o.status] ?? { label: o.status, variant: "secondary" };
            return (
              <Link key={o.id} to={`/dashboard/tracking?id=${o.id}`} className="block">
                <div className="bg-background rounded-2xl border border-border p-6 hover:border-primary/30 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{o.pickup_address} → {o.dropoff_address}</p>
                      <p className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleString("fr-FR")}</p>
                    </div>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{o.distance_km} km</span>
                    <span className="font-bold text-primary">{Number(o.price).toLocaleString()} FC</span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
};

export default Orders;
