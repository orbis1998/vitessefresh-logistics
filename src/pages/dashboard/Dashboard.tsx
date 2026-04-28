import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Plus, Package, Clock, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, in_progress: 0, delivered: 0, spent: 0 });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("status, price")
      .eq("client_id", user.id)
      .then(({ data }) => {
        if (!data) return;
        setStats({
          total: data.length,
          in_progress: data.filter((o) => ["pending", "accepted", "picked_up", "in_transit"].includes(o.status)).length,
          delivered: data.filter((o) => o.status === "delivered").length,
          spent: data.filter((o) => o.status === "delivered").reduce((s, o) => s + Number(o.price), 0),
        });
      });
  }, [user]);

  const cards = [
    { icon: Package, label: "Commandes totales", value: stats.total.toString(), color: "bg-primary/10 text-primary" },
    { icon: Clock, label: "En cours", value: stats.in_progress.toString(), color: "bg-blue-100 text-blue-600" },
    { icon: MapPin, label: "Livrées", value: stats.delivered.toString(), color: "bg-green-100 text-green-600" },
    { icon: Package, label: "Dépensé", value: `${stats.spent.toLocaleString()} FC`, color: "bg-purple-100 text-purple-600" },
  ];

  return (
    <DashboardLayout title="Tableau de bord" subtitle="Vue d'ensemble de vos livraisons">
      <div className="space-y-8">
        <div className="lg:hidden">
          <Link to="/dashboard/order">
            <Button size="lg" className="w-full">
              <Plus className="w-5 h-5 mr-2" />
              Nouvelle commande
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-background rounded-2xl p-6 border border-border">
              <div className={`w-12 h-12 ${s.color} rounded-xl flex items-center justify-center mb-4`}>
                <s.icon className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/dashboard/order" className="group">
            <div className="bg-background rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all h-full">
              <h3 className="font-poppins font-semibold mb-2">Nouvelle commande</h3>
              <p className="text-sm text-muted-foreground mb-4">Calcul de prix instantané selon la distance</p>
              <span className="text-primary font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">Commander <ArrowRight className="w-4 h-4" /></span>
            </div>
          </Link>
          <Link to="/dashboard/orders" className="group">
            <div className="bg-background rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all h-full">
              <h3 className="font-poppins font-semibold mb-2">Mes commandes</h3>
              <p className="text-sm text-muted-foreground mb-4">Historique complet de vos livraisons</p>
              <span className="text-primary font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">Voir <ArrowRight className="w-4 h-4" /></span>
            </div>
          </Link>
          <Link to="/dashboard/tracking" className="group">
            <div className="bg-background rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all h-full">
              <h3 className="font-poppins font-semibold mb-2">Suivi en direct</h3>
              <p className="text-sm text-muted-foreground mb-4">Carte temps réel des livreurs</p>
              <span className="text-primary font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">Suivre <ArrowRight className="w-4 h-4" /></span>
            </div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
