import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { statusLabel, toVitaStatus } from "@/lib/status";

const EntrepriseDashboard = () => {
  const { user } = useAuth();
  const [org, setOrg] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [sub, setSub] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: me } = await supabase.from("users").select("company_id").eq("id", user.id).maybeSingle();
      const companyId = me?.company_id;
      if (!companyId) return;
      const [{ data: o }, { data: ords }, { data: s }] = await Promise.all([
        supabase.from("companies").select("*").eq("id", companyId).maybeSingle(),
        supabase.from("orders").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(20),
        supabase.from("subscriptions").select("*").eq("user_id", user.id).eq("status", "active").maybeSingle(),
      ]);
      setOrg(o);
      setOrders(ords ?? []);
      setSub(s);
    })();
  }, [user]);

  const gmv = orders.filter((o) => toVitaStatus(o.status) === "DELIVERED").reduce((s, o) => s + Number(o.total_price ?? 0), 0);

  return (
    <DashboardLayout title={org?.name || "Entreprise"} subtitle="Volume, forfait, courses">
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border border-white/10 p-4">
          <p className="text-xs text-white/40">Courses</p>
          <p className="font-heading text-2xl font-bold mt-1">{orders.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 p-4">
          <p className="text-xs text-white/40">Livré</p>
          <p className="font-heading text-2xl font-bold mt-1 text-primary">{gmv.toLocaleString("fr-FR")} FC</p>
        </div>
        <div className="rounded-xl border border-white/10 p-4">
          <p className="text-xs text-white/40">Livraisons restantes</p>
          <p className="font-heading text-2xl font-bold mt-1">{sub?.deliveries_left ?? sub?.credits_remaining ?? "—"}</p>
        </div>
      </div>
      <div className="flex gap-3 mb-6">
        <Link to="/dashboard/order" className="text-sm text-primary">Nouvelle course</Link>
        <Link to="/entreprise/courses" className="text-sm text-white/50">Toutes les courses</Link>
      </div>
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/45">
            <tr>
              <th className="text-left p-3">Trajet</th>
              <th className="text-left p-3">Statut</th>
              <th className="text-right p-3">Prix</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-white/10">
                <td className="p-3 truncate max-w-xs">{o.pickup_address} → {o.delivery_address}</td>
                <td className="p-3 text-primary">{statusLabel(o.status)}</td>
                <td className="p-3 text-right">{Number(o.total_price ?? 0).toLocaleString("fr-FR")} FC</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default EntrepriseDashboard;
