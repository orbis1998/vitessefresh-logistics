import { useEffect, useState } from "react";
import { Users, Truck, Package, Loader2, TrendingUp } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";

const AdminOverview = () => {
  const [stats, setStats] = useState({ users: 0, drivers: 0, pendingDrivers: 0, orders: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ count: u }, { data: drivers }, { data: orders }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("driver_profiles").select("approved"),
        supabase.from("orders").select("status, price"),
      ]);
      setStats({
        users: u ?? 0,
        drivers: (drivers ?? []).filter((d) => d.approved).length,
        pendingDrivers: (drivers ?? []).filter((d) => !d.approved).length,
        orders: (orders ?? []).length,
        revenue: (orders ?? []).filter((o) => o.status === "delivered").reduce((s, o) => s + Number(o.price), 0),
      });
      setLoading(false);
    })();
  }, []);

  const cards = [
    { icon: Users, label: "Utilisateurs", value: stats.users, color: "bg-primary/10 text-primary" },
    { icon: Truck, label: "Livreurs validés", value: stats.drivers, color: "bg-blue-100 text-blue-600" },
    { icon: Truck, label: "Livreurs en attente", value: stats.pendingDrivers, color: "bg-yellow-100 text-yellow-700" },
    { icon: Package, label: "Commandes", value: stats.orders, color: "bg-green-100 text-green-600" },
    { icon: TrendingUp, label: "Revenu (livré)", value: `${stats.revenue.toLocaleString()} FC`, color: "bg-purple-100 text-purple-600" },
  ];

  return (
    <DashboardLayout title="Administration" subtitle="Vue globale de la plateforme">
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="bg-background rounded-2xl p-6 border border-border">
              <div className={`w-12 h-12 ${c.color} rounded-xl flex items-center justify-center mb-4`}>
                <c.icon className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{c.value}</p>
              <p className="text-sm text-muted-foreground">{c.label}</p>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminOverview;
