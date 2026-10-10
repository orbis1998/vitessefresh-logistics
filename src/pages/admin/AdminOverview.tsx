import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import OpsMap, { type OpsMarker } from "@/components/ops/OpsMap";
import { supabase } from "@/integrations/supabase/client";
import { ACTIVE_MISSION, statusLabel, toVitaStatus } from "@/lib/status";

const YELLOW = "#E6B800";
const GRID = "rgba(255,255,255,0.08)";
const MUTED = "rgba(234,234,234,0.45)";
const EVAL_COLORS: Record<string, string> = { VERT: "#3D9B54", JAUNE: "#E6B800", ROUGE: "#E61919", SANS: "#5A5A5A" };

const lastDays = (n: number) => {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
};

const tipStyle = {
  background: "#101214",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 0,
  fontSize: 12,
  color: "#EAEAEA",
};

const AdminOverview = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [pings, setPings] = useState<any[]>([]);
  const [costs, setCosts] = useState<any[]>([]);

  const load = async () => {
    const [{ data: allOrders }, { data: locs }, { data: costRows }] = await Promise.all([
      supabase
        .from("orders")
        .select("id, status, total_price, created_at, delivered_at, pickup_lng, pickup_lat, delivery_lng, delivery_lat, pickup_address, delivery_address, evaluation_level, package_description, order_number")
        .order("created_at", { ascending: false })
        .limit(800),
      supabase.from("driver_pings").select("driver_id, latitude, longitude, updated_at"),
      supabase.from("cost_entries").select("amount, created_at"),
    ]);
    setOrders(allOrders ?? []);
    setPings(locs ?? []);
    setCosts(costRows ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("ops-cockpit")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "cost_entries" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "driver_pings" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const days = useMemo(() => lastDays(14), []);

  const volume = useMemo(() => {
    return days.map((day) => {
      const dayOrders = orders.filter((o) => String(o.created_at).slice(0, 10) === day);
      const delivered = dayOrders.filter((o) => toVitaStatus(o.status) === "DELIVERED");
      const gmv = delivered.reduce((s, o) => s + Number(o.total_price ?? 0), 0);
      const dayCosts = costs
        .filter((c) => String(c.created_at).slice(0, 10) === day)
        .reduce((s, c) => s + Number(c.amount ?? 0), 0);
      return {
        day: day.slice(5),
        courses: dayOrders.length,
        gmv,
        costs: dayCosts,
        marge: gmv - dayCosts,
      };
    });
  }, [days, orders, costs]);

  const byEval = useMemo(() => {
    const c = { VERT: 0, JAUNE: 0, ROUGE: 0, SANS: 0 };
    orders.forEach((o) => {
      if (o.evaluation_level === "GREEN") c.VERT += 1;
      else if (o.evaluation_level === "YELLOW") c.JAUNE += 1;
      else if (o.evaluation_level === "RED") c.ROUGE += 1;
      else c.SANS += 1;
    });
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const pipeline = useMemo(() => {
    const keys = ["SUBMITTED", "ACCEPTED", "ASSIGNED", "COLLECTING", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "REJECTED"];
    return keys.map((k) => ({
      name: statusLabel(k),
      n: orders.filter((o) => toVitaStatus(o.status) === k).length,
    })).filter((r) => r.n > 0);
  }, [orders]);

  const flow = useMemo(() => {
    const live = orders.filter((o) => ACTIVE_MISSION.includes(toVitaStatus(o.status))).length;
    const queue = orders.filter((o) => ["SUBMITTED", "EVALUATING", "PENDING_VALIDATION", "PENDING"].includes(toVitaStatus(o.status))).length;
    const done = orders.filter((o) => toVitaStatus(o.status) === "DELIVERED").length;
    const blocked = orders.filter((o) => o.evaluation_level === "RED" || toVitaStatus(o.status) === "REJECTED").length;
    return [
      { name: "File", value: queue },
      { name: "En course", value: live },
      { name: "Livrées", value: done },
      { name: "Bloquées", value: blocked },
    ];
  }, [orders]);

  const gmv = orders.filter((o) => toVitaStatus(o.status) === "DELIVERED").reduce((s, o) => s + Number(o.total_price ?? 0), 0);
  const costSum = costs.reduce((s, r) => s + Number(r.amount ?? 0), 0);
  const markers: OpsMarker[] = pings.map((l) => ({
    id: `d-${l.driver_id}`,
    lng: Number(l.longitude),
    lat: Number(l.latitude),
    kind: "driver" as const,
    label: "Livreur",
  }));

  return (
    <DashboardLayout title="Télémétrie" subtitle="Graphiques live · volume · marge · contrôle">
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-px bg-white/10 border border-white/10">
          <div className="bg-[#101214] p-5 lg:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
              <div>
                <p className="font-mono text-[10px] tracking-[0.22em] text-white/40 uppercase">Volume et encaissement</p>
                <h2 className="font-heading text-2xl lg:text-3xl font-bold tracking-tight mt-1">14 jours</h2>
              </div>
              <p className="font-mono text-xs text-white/45 tabular-nums">
                CA {gmv.toLocaleString("fr-FR")} FC · coûts {costSum.toLocaleString("fr-FR")} FC · marge {(gmv - costSum).toLocaleString("fr-FR")} FC
              </p>
            </div>
            <div className="h-[340px] lg:h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={volume} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: MUTED, fontSize: 11, fontFamily: "ui-monospace" }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: MUTED, fontSize: 11, fontFamily: "ui-monospace" }} axisLine={false} tickLine={false} width={32} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: MUTED, fontSize: 11, fontFamily: "ui-monospace" }} axisLine={false} tickLine={false} width={56} />
                  <Tooltip contentStyle={tipStyle} formatter={(v: number, name) => [Number(v).toLocaleString("fr-FR"), name]} />
                  <Legend wrapperStyle={{ fontSize: 12, color: MUTED }} />
                  <Bar yAxisId="left" dataKey="courses" name="Courses" fill={YELLOW} maxBarSize={18} />
                  <Area yAxisId="right" type="monotone" dataKey="gmv" name="CA livré (FC)" stroke={YELLOW} fill="rgba(230,184,0,0.12)" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="costs" name="Coûts (FC)" stroke="#E61919" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="marge" name="Marge (FC)" stroke="#3D9B54" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-px bg-white/10">
            <div className="bg-[#101214] p-5 lg:p-8">
              <p className="font-mono text-[10px] tracking-[0.22em] text-white/40 uppercase mb-4">Contrôle colis</p>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byEval} dataKey="value" nameKey="name" innerRadius={62} outerRadius={104} paddingAngle={2} stroke="#101214">
                      {byEval.map((e) => (
                        <Cell key={e.name} fill={EVAL_COLORS[e.name]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-[#101214] p-5 lg:p-8">
              <p className="font-mono text-[10px] tracking-[0.22em] text-white/40 uppercase mb-4">Pipeline des statuts</p>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={pipeline} layout="vertical" margin={{ left: 8, right: 12 }}>
                    <CartesianGrid stroke={GRID} horizontal={false} />
                    <XAxis type="number" tick={{ fill: MUTED, fontSize: 11, fontFamily: "ui-monospace" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fill: MUTED, fontSize: 11, fontFamily: "ui-monospace" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tipStyle} />
                    <Bar dataKey="n" name="Commandes" fill={YELLOW} maxBarSize={14} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-px bg-white/10">
            <div className="bg-[#101214] p-5 lg:p-8">
              <p className="font-mono text-[10px] tracking-[0.22em] text-white/40 uppercase mb-4">Répartition opérationnelle</p>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={flow} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} stroke="#101214">
                      {flow.map((e, i) => (
                        <Cell key={e.name} fill={[YELLOW, "#EAEAEA", "#3D9B54", "#E61919"][i]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <Link to="/admin/commandes" className="font-mono text-[11px] tracking-wider text-primary uppercase">
                Ouvrir les commandes
              </Link>
            </div>
            <div className="bg-[#101214]">
              <OpsMap markers={markers} className="h-[340px] rounded-none" />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminOverview;
