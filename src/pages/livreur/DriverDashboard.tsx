import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Truck, Loader2, Package } from "lucide-react";
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
          <div className="bg-background rounded-2xl border border-border p-8 text-center">
            <Truck className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="font-poppins font-semibold text-xl mb-2">Activez votre profil livreur</h2>
            <p className="text-muted-foreground mb-6">Un administrateur devra ensuite valider votre compte.</p>
            <Button onClick={createDriverProfile}>Créer mon profil livreur</Button>
          </div>
        ) : !driver.approved ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
            <p className="font-semibold">Compte en attente de validation</p>
            <p className="text-sm text-muted-foreground mt-1">Un administrateur examine votre profil. Vous recevrez les courses dès l'approbation.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-background rounded-2xl border border-border p-6">
                <Package className="w-8 h-8 text-primary mb-2" />
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Disponibles</p>
              </div>
              <div className="bg-background rounded-2xl border border-border p-6">
                <Truck className="w-8 h-8 text-blue-600 mb-2" />
                <p className="text-2xl font-bold">{stats.assigned}</p>
                <p className="text-sm text-muted-foreground">En cours</p>
              </div>
              <div className="bg-background rounded-2xl border border-border p-6">
                <Badge className="mb-2">✓</Badge>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Terminées</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Link to="/livreur/courses" className="bg-background rounded-2xl border border-border p-6 hover:border-primary/30">
                <h3 className="font-poppins font-semibold mb-2">Voir les courses disponibles</h3>
                <p className="text-sm text-muted-foreground">Acceptez une nouvelle course et démarrez le partage GPS.</p>
              </Link>
              <Link to="/livreur/livraisons" className="bg-background rounded-2xl border border-border p-6 hover:border-primary/30">
                <h3 className="font-poppins font-semibold mb-2">Mes livraisons</h3>
                <p className="text-sm text-muted-foreground">Gérez vos courses actives et l'historique.</p>
              </Link>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DriverDashboard;
