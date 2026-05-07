import { useEffect, useState } from "react";
import { Loader2, MapPin, Package, Navigation, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const AvailableCourses = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "accepted")
      .eq("driver_id", user.id)
      .order("created_at", { ascending: true });
    setOrders(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase
      .channel("accepted-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  return (
    <DashboardLayout title="Courses attribuées" subtitle="Missions validées par l'administrateur">
      <div className="space-y-4">
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-28 bg-secondary rounded-2xl" />
            <div className="h-28 bg-secondary rounded-2xl" />
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-4 animate-in fade-in">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Package className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-poppins font-semibold text-lg">Aucune course attribuée</h3>
            <p className="text-muted-foreground text-sm">Revenez plus tard ou contactez un administrateur.</p>
          </div>
        )}

        {!loading && orders.map((o) => (
          <Link
            key={o.id}
            to={`/livreur/livraisons`}
            className="group block bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{o.pickup_address}</p>
                  <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                    <Navigation className="w-3 h-3" />
                    <p className="text-sm truncate">{o.dropoff_address}</p>
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-2" />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-3">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  {o.status === "accepted" ? "Assignée" : o.status}
                </Badge>
                <span className="text-sm text-muted-foreground">{o.distance_km} km</span>
              </div>
              <span className="text-xl font-bold text-primary">{Number(o.price).toLocaleString()} FC</span>
            </div>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AvailableCourses;
