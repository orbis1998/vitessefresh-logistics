import { useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AvailableCourses = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    setOrders(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("accepted-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <DashboardLayout title="Courses attribuées" subtitle="Les missions validées par l'administrateur apparaissent ici">
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : orders.length === 0 ? (
          <div className="bg-background rounded-2xl border border-border p-12 text-center text-muted-foreground">
            Aucune course ne vous a encore été attribuée.
          </div>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="bg-background rounded-2xl border border-border p-5">
              <div className="flex items-start gap-3 mb-3">
                <MapPin className="w-5 h-5 text-primary mt-1" />
                <div className="flex-1">
                  <p className="font-medium">{o.pickup_address}</p>
                  <p className="text-sm text-muted-foreground">→ {o.dropoff_address}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">{o.distance_km} km</div>
                <div className="flex items-center gap-3">
                  <Badge>{o.status === "accepted" ? "Assignée" : o.status}</Badge>
                  <span className="font-bold text-primary text-lg">{Number(o.price).toLocaleString()} FC</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
};

export default AvailableCourses;
