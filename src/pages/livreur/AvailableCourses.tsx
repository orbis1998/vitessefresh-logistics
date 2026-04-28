import { useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const AvailableCourses = () => {
  const { user } = useAuth();
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
      .channel("pending-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const accept = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("orders")
      .update({ driver_id: user.id, status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "pending");
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    await supabase.from("driver_profiles").update({ status: "busy" }).eq("user_id", user.id);
    toast({ title: "Course acceptée", description: "Direction le point de ramassage" });
    load();
  };

  return (
    <DashboardLayout title="Courses disponibles" subtitle="Acceptez une course pour commencer">
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : orders.length === 0 ? (
          <div className="bg-background rounded-2xl border border-border p-12 text-center text-muted-foreground">
            Aucune course disponible pour le moment.
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
                  <span className="font-bold text-primary text-lg">{Number(o.price).toLocaleString()} FC</span>
                  <Button onClick={() => accept(o.id)}>Accepter</Button>
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
