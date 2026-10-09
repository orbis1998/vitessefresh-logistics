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
          in_progress: data.filter((o) => ["PENDING", "SUBMITTED", "ACCEPTED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(st(o.status))).length,
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
    <DashboardLayout title="Accueil" subtitle="Vos courses Vita Express">
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-[#111] p-6 lg:p-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <p className="text-primary text-xs uppercase tracking-wider">Prochaine étape</p>
            <h2 className="font-heading text-2xl lg:text-3xl font-bold mt-1">Où va le colis ?</h2>
            <p className="text-white/55 mt-2 max-w-md text-sm">
              Photo, type de colis, devis serveur, puis contrôle VERT / JAUNE / ROUGE.
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
            <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs text-white/40">{s.label}</p>
              <p className="font-heading text-2xl font-bold mt-2 tracking-tight">{s.value}</p>
              <p className="text-xs text-white/35 mt-1">{s.hint}</p>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Link to="/dashboard/orders-list" className="rounded-xl border border-white/10 bg-white/[0.03] p-5 hover:border-primary/40">
            <p className="font-heading font-semibold">Historique</p>
            <p className="text-sm text-white/45 mt-1">Toutes vos commandes</p>
          </Link>
          <Link to="/dashboard/tracking" className="rounded-xl border border-white/10 bg-white/[0.03] p-5 hover:border-primary/40">
            <p className="font-heading font-semibold">Suivi live</p>
            <p className="text-sm text-white/45 mt-1">Position du livreur</p>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
