import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import OpsMap, { type OpsMarker } from "@/components/ops/OpsMap";
import { supabase } from "@/integrations/supabase/client";
import { ACTIVE_MISSION, toVitaStatus } from "@/lib/status";

const AdminOverview = () => {
  const [loading, setLoading] = useState(true);
  const [usersN, setUsersN] = useState(0);
  const [driversOnline, setDriversOnline] = useState(0);
  const [ordersToday, setOrdersToday] = useState(0);
  const [blocked, setBlocked] = useState(0);
  const [pendingVal, setPendingVal] = useState(0);
  const [gmv, setGmv] = useState(0);
  const [costs, setCosts] = useState(0);
  const [orders, setOrders] = useState<any[]>([]);
  const [pings, setPings] = useState<any[]>([]);

  const load = async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const [
      { count: u },
      { data: drivers },
      { data: allOrders },
      { data: locs },
      { data: costRows },
    ] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("driver_profiles").select("available, user_id"),
      supabase.from("orders").select("id, status, total_price, created_at, pickup_lng, pickup_lat, delivery_lng, delivery_lat, pickup_address, delivery_address, evaluation_level, delivered_at").order("created_at", { ascending: false }).limit(400),
      supabase.from("driver_pings").select("driver_id, latitude, longitude, updated_at"),
      supabase.from("cost_entries").select("amount"),
    ]);
    const list = allOrders ?? [];
    setUsersN(u ?? 0);
    setDriversOnline((drivers ?? []).filter((d) => d.available).length);
    setOrders(list);
    setPings(locs ?? []);
    setOrdersToday(list.filter((o) => new Date(o.created_at) >= start).length);
    setBlocked(list.filter((o) => o.evaluation_level === "RED" || toVitaStatus(o.status) === "REJECTED").length);
    setPendingVal(list.filter((o) => ["PENDING_VALIDATION", "EVALUATING", "SUBMITTED", "PENDING"].includes(toVitaStatus(o.status))).length);
    setGmv(list.filter((o) => toVitaStatus(o.status) === "DELIVERED").reduce((s, o) => s + Number(o.total_price ?? 0), 0));
    setCosts((costRows ?? []).reduce((s, r) => s + Number(r.amount), 0));
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("ops-cockpit")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "driver_pings" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const chart = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days[d.toISOString().slice(0, 10)] = 0;
    }
    orders.forEach((o) => {
      const k = String(o.created_at).slice(0, 10);
      if (k in days) days[k] += 1;
    });
    return Object.entries(days).map(([day, n]) => ({ day: day.slice(5), n }));
  }, [orders]);

  const live = orders.filter((o) => ACTIVE_MISSION.includes(toVitaStatus(o.status)));
  const staleMs = 5 * 60 * 1000;
  const markers: OpsMarker[] = pings.map((l) => {
    const age = Date.now() - new Date(l.updated_at).getTime();
    return {
      id: `d-${l.driver_id}`,
      lng: Number(l.longitude),
      lat: Number(l.latitude),
      kind: "driver" as const,
      label: age > staleMs ? "Livreur (position ancienne)" : "Livreur (live)",
    };
  });

  const margin = gmv - costs;
  const kpis = [
    { label: "Demandes", value: orders.length, href: "/admin/commandes" },
    { label: "À valider", value: pendingVal, href: "/admin/commandes" },
    { label: "Bloquées", value: blocked, href: "/admin/commandes" },
    { label: "En cours", value: live.length, href: "/admin/suivi" },
    { label: "Livreurs dispo", value: driversOnline, href: "/admin/livreurs" },
    { label: "Utilisateurs", value: usersN, href: "/admin/utilisateurs" },
  ];

  return (
    <DashboardLayout title="Cockpit" subtitle="Données réelles · Vita Express">
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
              <p className="text-white/45 text-sm">Chiffre d'affaires livré</p>
              <p className="font-heading text-3xl font-bold mt-2 text-primary">{gmv.toLocaleString("fr-FR")} FC</p>
            </div>
            <div className="rounded-xl border border-white/10 p-6">
              <p className="text-white/45 text-sm">Coûts variables enregistrés</p>
              <p className="font-heading text-3xl font-bold mt-2">{costs.toLocaleString("fr-FR")} FC</p>
            </div>
            <div className="rounded-xl border border-white/10 p-6">
              <p className="text-white/45 text-sm">Marge contributive</p>
              <p className="font-heading text-3xl font-bold mt-2">{margin.toLocaleString("fr-FR")} FC</p>
              <p className="text-xs text-white/35 mt-1">Pas un bénéfice net</p>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {kpis.map((c) => (
              <Link key={c.label} to={c.href} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-primary/40">
                <p className="text-[11px] uppercase tracking-wider text-white/40">{c.label}</p>
                <p className="font-heading text-2xl font-bold mt-1">{c.value}</p>
              </Link>
            ))}
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm text-white/50 mb-3">Demandes · 14 jours</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart}>
                  <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                  <Area type="monotone" dataKey="n" stroke="#FFC400" fill="rgba(255,196,0,0.15)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <OpsMap markers={markers} />
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminOverview;
