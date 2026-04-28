import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setOrders(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <DashboardLayout title="Toutes les commandes" subtitle="Vue admin de la plateforme">
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-background rounded-2xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4">Date</th>
                <th className="text-left p-4">Trajet</th>
                <th className="text-left p-4">Distance</th>
                <th className="text-left p-4">Prix</th>
                <th className="text-left p-4">Statut</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="p-4 whitespace-nowrap">{new Date(o.created_at).toLocaleString("fr-FR")}</td>
                  <td className="p-4">{o.pickup_address} → {o.dropoff_address}</td>
                  <td className="p-4">{o.distance_km} km</td>
                  <td className="p-4 font-semibold text-primary">{Number(o.price).toLocaleString()} FC</td>
                  <td className="p-4"><Badge>{o.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminOrders;
