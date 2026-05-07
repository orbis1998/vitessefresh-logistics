import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Truck, Loader2, Package, CheckCircle2, MapPin, ClipboardList, ArrowRight } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const DriverDashboard = () => {
  const { user } = useAuth();
  const [driver, setDriver] = useState<any | null>(null);
  const [stats, setStats] = useState({ assigned: 0, completed: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: dp } = await supabase.from("driver_profiles").select("*").eq("user_id", user.id).maybeSingle();
      setDriver(dp);
      const { data: orders } = await supabase.from("orders").select("status").eq("driver_id", user.id);
      const { data: pendingOrders } = await supabase.from("orders").select("id").eq("status", "pending");
      setStats({
        assigned: (orders ?? []).filter((o) => ["accepted", "picked_up", "in_transit"].includes(o.status)).length,
        completed: (orders ?? []).filter((o) => o.status === "delivered").length,
        pending: (pendingOrders ?? []).length,
      });
      setLoading(false);
    })();
  }, [user]);

  const createDriverProfile = async () => {
    if (!user) return;
    await supabase.from("driver_profiles").upsert({ user_id: user.id });
    const { data } = await supabase.from("driver_profiles").select("*").eq("user_id", user.id).maybeSingle();
    setDriver(data);
  };

  if (loading) {
    return <DashboardLayout><div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout title="Tableau de bord livreur" subtitle="Vos courses en cours et disponibles">
      <div className="space-y-6">
        {!driver ? (
          <div className="bg-card border border-border rounded-2xl p-10 text-center space-y-5 animate-in fade-in">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Truck className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="font-poppins font-semibold text-xl mb-2">Activez votre profil livreur</h2>
              <p className="text-muted-foreground">Un administrateur devra ensuite valider votre compte.</p>
            </div>
            <Button size="lg" onClick={createDriverProfile} className="font-bold tracking-wide">
              Créer mon profil livreur
            </Button>
          </div>
        ) : !driver.approved ? (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center space-y-3 animate-in fade-in">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Truck className="w-7 h-7 text-primary" />
            </div>
            <p className="font-semibold text-lg">Compte en attente de validation</p>
            <p className="text-sm text-muted-foreground">Un administrateur examine votre profil. Vous recevrez les courses dès l'approbation.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden group hover:border-primary/30 transition-all">
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <Package className="w-6 h-6 text-primary mb-3 relative z-10" />
                <p className="text-2xl font-bold relative z-10">{stats.pending}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider relative z-10">Disponibles</p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden group hover:border-primary/30 transition-all">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <Truck className="w-6 h-6 text-blue-400 mb-3 relative z-10" />
                <p className="text-2xl font-bold relative z-10">{stats.assigned}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider relative z-10">En cours</p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden group hover:border-primary/30 transition-all">
                <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <CheckCircle2 className="w-6 h-6 text-green-400 mb-3 relative z-10" />
                <p className="text-2xl font-bold relative z-10">{stats.completed}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider relative z-10">Terminées</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Link to="/livreur/courses" className="group bg-card rounded-2xl border border-border p-6 hover:border-primary/30 transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-poppins font-semibold">Courses disponibles</h3>
                      <p className="text-sm text-muted-foreground">Acceptez une nouvelle mission</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
              <Link to="/livreur/livraisons" className="group bg-card rounded-2xl border border-border p-6 hover:border-primary/30 transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-green-500/10 transition-colors" />
                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-poppins font-semibold">Mes livraisons</h3>
                      <p className="text-sm text-muted-foreground">Gérez vos courses actives</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DriverDashboard;
