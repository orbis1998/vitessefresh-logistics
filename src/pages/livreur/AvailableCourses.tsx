import { useEffect, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { statusLabel } from "@/lib/status";

const AvailableCourses = () => {
  const { user } = useAuth();
  const [mine, setMine] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [auto, setAuto] = useState(false);

  const load = async () => {
    if (!user) return;
    const [{ data: assigned }, { data: setting }] = await Promise.all([
      supabase.from("orders").select("*").eq("driver_id", user.id).in("status", ["ASSIGNED", "ACCEPTED", "COLLECTING", "PICKED_UP", "IN_TRANSIT"]).order("created_at", { ascending: true }),
      supabase.from("ops_settings").select("value").eq("key", "auto_assign").maybeSingle(),
    ]);
    setMine(assigned ?? []);
    setAuto(setting?.value === true);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase
      .channel("assigned-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user]);

  return (
    <DashboardLayout title="Courses" subtitle="Attribution manuelle — auto désactivée">
      {loading ? (
        <div className="h-28 rounded-xl bg-white/5 animate-pulse" />
      ) : (
        <div className="space-y-8">
          <p className="text-sm text-white/50">
            L’attribution automatique est {auto ? "activée" : "désactivée"}. Les missions apparaissent ici uniquement quand le dispatch vous les affecte.
          </p>
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
                      <p className="text-sm text-white/50 truncate flex items-center gap-1 mt-1"><Navigation className="w-3 h-3" />{o.delivery_address}</p>
                      <p className="text-xs text-white/40 mt-1">{statusLabel(o.status)}</p>
                    </div>
                  </div>
                  <p className="text-primary mt-3">{Number(o.total_price ?? 0).toLocaleString("fr-FR")} FC · {o.distance} km</p>
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
