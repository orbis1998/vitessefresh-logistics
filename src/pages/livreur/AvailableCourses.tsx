import { useEffect, useState } from "react";
import { MapPin, Package, Navigation } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const AvailableCourses = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mine, setMine] = useState<any[]>([]);
  const [open, setOpen] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const [{ data: assigned }, { data: pending }] = await Promise.all([
      supabase.from("orders").select("*").eq("status", "accepted").eq("driver_id", user.id).order("created_at", { ascending: true }),
      supabase.from("orders").select("*").eq("status", "pending").is("driver_id", null).order("created_at", { ascending: true }).limit(20),
    ]);
    setMine(assigned ?? []);
    setOpen(pending ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase
      .channel("accepted-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user]);

  const take = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("orders")
      .update({ driver_id: user.id, status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "pending");
    if (error) toast({ title: "Impossible", description: error.message, variant: "destructive" });
    else {
      await supabase.from("driver_profiles").update({ status: "busy" }).eq("user_id", user.id);
      toast({ title: "Mission prise" });
      load();
    }
  };

  return (
    <DashboardLayout title="Courses" subtitle="File dispo et missions attribuées">
      {loading ? (
        <div className="h-28 rounded-xl bg-white/5 animate-pulse" />
      ) : (
        <div className="space-y-8">
          <section>
            <p className="text-xs uppercase tracking-wider text-white/40 mb-3">Disponibles</p>
            {open.length === 0 && <p className="text-white/40 text-sm">Aucune course en attente.</p>}
            <div className="space-y-3">
              {open.map((o) => (
                <div key={o.id} className="rounded-xl border border-white/10 p-5 flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{o.pickup_address}</p>
                    <p className="text-sm text-white/50 truncate mt-1">→ {o.dropoff_address}</p>
                    <p className="text-primary mt-2">{Number(o.price).toLocaleString("fr-FR")} FC · {o.distance_km} km</p>
                  </div>
                  <Button size="sm" onClick={() => take(o.id)}>Prendre</Button>
                </div>
              ))}
            </div>
          </section>
          <section>
            <p className="text-xs uppercase tracking-wider text-white/40 mb-3">Mes missions</p>
            {mine.length === 0 && <p className="text-white/40 text-sm">Aucune mission attribuée.</p>}
            <div className="space-y-3">
              {mine.map((o) => (
                <Link key={o.id} to="/livreur" className="block rounded-xl border border-white/10 p-5 hover:border-primary/40">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-primary mt-1" />
                    <div className="min-w-0">
                      <p className="text-sm truncate">{o.pickup_address}</p>
                      <p className="text-sm text-white/50 truncate flex items-center gap-1 mt-1"><Navigation className="w-3 h-3" />{o.dropoff_address}</p>
                    </div>
                  </div>
                  <p className="text-primary mt-3">{Number(o.price).toLocaleString("fr-FR")} FC</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AvailableCourses;
