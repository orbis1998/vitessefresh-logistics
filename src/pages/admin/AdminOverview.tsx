import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import OpsMap, { type OpsMarker } from "@/components/ops/OpsMap";
import { supabase } from "@/integrations/supabase/client";

const AdminOverview = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState(0);
  const [staff, setStaff] = useState(0);
  const [driversOnline, setDriversOnline] = useState(0);
  const [ordersToday, setOrdersToday] = useState(0);
  const [subs, setSubs] = useState(0);
  const [orgs, setOrgs] = useState(0);
  const [gmv, setGmv] = useState(0);
  const [cashGmv, setCashGmv] = useState(0);
  const [kpayGmv, setKpayGmv] = useState(0);
  const [orders, setOrders] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);

  const load = async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const [
      { count: u },
      { data: roles },
      { data: drivers },
      { data: today },
      { data: allOrders },
      { data: locs },
      { count: subCount },
      { count: orgCount },
      { data: logs },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("user_roles").select("role"),
      supabase.from("driver_profiles").select("status, approved"),
      supabase.from("orders").select("id").gte("created_at", start.toISOString()),
      supabase.from("orders").select("id, status, price, created_at, pickup_lng, pickup_lat, dropoff_lng, dropoff_lat, pickup_address, dropoff_address, payment_method, organization_id").order("created_at", { ascending: false }).limit(400),
      supabase.from("driver_locations").select("driver_id, latitude, longitude"),
      supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("organizations").select("*", { count: "exact", head: true }).eq("active", true),
      supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(8),
    ]);
    const staffN = (roles ?? []).filter((r) =>
      ["admin", "gestionnaire", "call_center", "suivi", "support", "comptable", "finance"].includes(r.role)
    ).length;
    setUsers(u ?? 0);
    setStaff(staffN);
    setDriversOnline((drivers ?? []).filter((d) => d.approved && d.status !== "offline").length);
    setOrdersToday(today?.length ?? 0);
    setOrders(allOrders ?? []);
    setLocations(locs ?? []);
    setSubs(subCount ?? 0);
    setOrgs(orgCount ?? 0);
    const delivered = (allOrders ?? []).filter((o) => o.status === "delivered");
    setGmv(delivered.reduce((s, o) => s + Number(o.price), 0));
    setCashGmv(delivered.filter((o) => o.payment_method === "cash" || !o.payment_method).reduce((s, o) => s + Number(o.price), 0));
    setKpayGmv(delivered.filter((o) => o.payment_method === "kpay" || o.payment_method === "flexpay").reduce((s, o) => s + Number(o.price), 0));
    setAudit(logs ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("ops-cockpit")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "driver_locations" }, () => load())
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

  const live = orders.filter((o) => ["pending", "accepted", "picked_up", "in_transit"].includes(o.status));
  const markers: OpsMarker[] = [
    ...locations.map((l) => ({
      id: `d-${l.driver_id}`,
      lng: Number(l.longitude),
      lat: Number(l.latitude),
      kind: "driver" as const,
      label: "Livreur",
    })),
    ...live.flatMap((o) => [
      { id: `p-${o.id}`, lng: Number(o.pickup_lng), lat: Number(o.pickup_lat), kind: "pickup" as const, label: o.pickup_address },
      { id: `x-${o.id}`, lng: Number(o.dropoff_lng), lat: Number(o.dropoff_lat), kind: "drop" as const, label: o.dropoff_address },
    ]),
  ];

  const kpis = [
    { label: "Utilisateurs", value: users, href: "/admin/utilisateurs" },
    { label: "Équipe", value: staff, href: "/admin/equipe" },
    { label: "Livreurs actifs", value: driversOnline, href: "/admin/livreurs" },
    { label: "Courses du jour", value: ordersToday, href: "/admin/commandes" },
    { label: "Abonnements", value: subs, href: "/admin/abonnements" },
    { label: "Entreprises", value: orgs, href: "/admin/entreprises" },
  ];

  return (
    <DashboardLayout title="Cockpit" subtitle="Dispatch Vita Express · temps réel">
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6 lg:p-8">
            <p className="text-white/45 text-sm">GMV livré</p>
            <p className="font-heading text-4xl font-bold mt-2 text-primary">{gmv.toLocaleString("fr-FR")} FC</p>
            <p className="text-white/40 text-sm mt-2">
              Cash {cashGmv.toLocaleString("fr-FR")} FC · K-Pay {kpayGmv.toLocaleString("fr-FR")} FC
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {kpis.map((c) => (
              <Link
                key={c.label}
                to={c.href}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-primary/40 transition-colors"
              >
                <p className="text-[11px] uppercase tracking-wider text-white/40">{c.label}</p>
                <p className="font-heading text-2xl font-bold mt-1">{c.value}</p>
              </Link>
            ))}
          </div>

          <div className="grid lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-white/50 mb-3">Courses · 14 jours</p>
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
            <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-white/50 mb-3">File live</p>
              <ul className="space-y-2 max-h-48 overflow-y-auto text-sm">
                {live.length === 0 && <li className="text-white/35">Aucune course active</li>}
                {live.slice(0, 8).map((o) => (
                  <li key={o.id} className="flex justify-between gap-2 border-b border-white/5 pb-2">
                    <span className="truncate text-white/80">{o.pickup_address}</span>
                    <span className="text-primary text-xs shrink-0">{o.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/50">Carte ops · livreurs et destinations</p>
              <Link to="/admin/carte" className="text-xs text-primary">Plein écran</Link>
            </div>
            <OpsMap markers={markers} />
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm text-white/50 mb-3">Activité récente</p>
            <ul className="space-y-2 text-sm">
              {audit.length === 0 && <li className="text-white/35">Aucun journal</li>}
              {audit.map((a) => (
                <li key={a.id} className="flex justify-between gap-3 border-b border-white/5 pb-2">
                  <span className="truncate">{a.action}{a.entity ? ` · ${a.entity}` : ""}</span>
                  <span className="text-white/35 text-xs shrink-0">{new Date(a.created_at).toLocaleString("fr-FR")}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminOverview;
