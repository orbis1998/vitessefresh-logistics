import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
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
      .select("status, total_price")
      .eq("client_id", user.id)
      .then(({ data }) => {
        if (!data) return;
        const st = (s: string) => String(s).toUpperCase();
        setStats({
          total: data.length,
          in_progress: data.filter((o) => ["PENDING", "ACCEPTED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(st(o.status))).length,
          delivered: data.filter((o) => st(o.status) === "DELIVERED").length,
          spent: data.filter((o) => st(o.status) === "DELIVERED").reduce((s, o) => s + Number(o.total_price ?? 0), 0),
        });
      });
  }, [user]);

  const cards = [
    { label: "En cours", value: stats.in_progress.toString(), hint: "courses actives" },
    { label: "Livrées", value: stats.delivered.toString(), hint: "terminées" },
    { label: "Total", value: stats.total.toString(), hint: "commandes" },
    { label: "Dépensé", value: `${stats.spent.toLocaleString()} FC`, hint: "livraisons payées" },
  ];

  return (
    <DashboardLayout title="Accueil" subtitle="Vos courses">
      <div className="space-y-6">
        <div className="rounded-xl bg-[#111] text-white p-6 lg:p-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <p className="text-white/50 text-sm">Prochaine étape</p>
            <h2 className="font-heading text-2xl lg:text-3xl font-bold mt-1">Où va le colis ?</h2>
            <p className="text-white/60 mt-2 max-w-md text-sm">
              Indiquez ramassage et dépôt. Le tarif s'affiche avant confirmation.
            </p>
          </div>
          <Link to="/dashboard/order">
            <Button size="lg">
              Nouvelle course
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map((s) => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-5">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="font-heading text-2xl font-bold mt-2 tracking-tight">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.hint}</p>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Link
            to="/dashboard/orders-list"
            className="bg-card rounded-xl border border-border p-5 hover:border-foreground/30 transition-colors"
          >
            <p className="font-heading font-semibold">Historique</p>
            <p className="text-sm text-muted-foreground mt-1">Toutes vos commandes</p>
          </Link>
          <Link
            to="/dashboard/tracking"
            className="bg-card rounded-xl border border-border p-5 hover:border-foreground/30 transition-colors"
          >
            <p className="font-heading font-semibold">Carte live</p>
            <p className="text-sm text-muted-foreground mt-1">Position du livreur</p>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
