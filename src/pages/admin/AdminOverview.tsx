import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import OpsMap, { type OpsMarker } from "@/components/ops/OpsMap";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ACTIVE_MISSION, statusLabel, toVitaStatus } from "@/lib/status";

const AdminOverview = () => {
  const [loading, setLoading] = useState(true);
  const [usersN, setUsersN] = useState(0);
  const [driversOnline, setDriversOnline] = useState(0);
  const [blocked, setBlocked] = useState(0);
  const [pendingVal, setPendingVal] = useState(0);
  const [gmv, setGmv] = useState(0);
  const [costs, setCosts] = useState(0);
  const [orders, setOrders] = useState<any[]>([]);
  const [pings, setPings] = useState<any[]>([]);
  const [evals, setEvals] = useState<any[]>([]);
  const [groq, setGroq] = useState<any[]>([]);

  const load = async () => {
    const [
      { count: u },
      { data: drivers },
      { data: allOrders },
      { data: locs },
      { data: costRows },
      { data: ev },
      { data: gq },
    ] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("driver_profiles").select("available, user_id"),
      supabase.from("orders").select("id, status, total_price, created_at, pickup_lng, pickup_lat, delivery_lng, delivery_lat, pickup_address, delivery_address, evaluation_level, package_description").order("created_at", { ascending: false }).limit(400),
      supabase.from("driver_pings").select("driver_id, latitude, longitude, updated_at"),
      supabase.from("cost_entries").select("amount"),
      supabase.from("evaluation_logs").select("id, order_id, level, reasons, created_at").order("created_at", { ascending: false }).limit(8),
      supabase.from("groq_analyses").select("id, order_id, model, observations, hypotheses, confidence, created_at").order("created_at", { ascending: false }).limit(6),
    ]);
    const list = allOrders ?? [];
    setUsersN(u ?? 0);
    setDriversOnline((drivers ?? []).filter((d) => d.available).length);
    setOrders(list);
    setPings(locs ?? []);
    setEvals(ev ?? []);
    setGroq(gq ?? []);
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

  const byStatus = useMemo(() => {
    const m: Record<string, number> = {};
    orders.forEach((o) => {
      const s = statusLabel(o.status);
      m[s] = (m[s] || 0) + 1;
    });
    return Object.entries(m).map(([name, n]) => ({ name, n }));
  }, [orders]);

  const byEval = useMemo(() => {
    const c = { GREEN: 0, YELLOW: 0, RED: 0, NONE: 0 };
    orders.forEach((o) => {
      const k = o.evaluation_level;
      if (k === "GREEN" || k === "YELLOW" || k === "RED") c[k] += 1;
      else c.NONE += 1;
    });
    return [
      { name: "VERT", n: c.GREEN },
      { name: "JAUNE", n: c.YELLOW },
      { name: "ROUGE", n: c.RED },
    ];
  }, [orders]);

  const live = orders.filter((o) => ACTIVE_MISSION.includes(toVitaStatus(o.status)));
  const markers: OpsMarker[] = pings.map((l) => ({
    id: `d-${l.driver_id}`,
    lng: Number(l.longitude),
    lat: Number(l.latitude),
    kind: "driver" as const,
    label: "Livreur",
  }));

  const margin = gmv - costs;
  const queue = orders.filter((o) => ["SUBMITTED", "EVALUATING", "PENDING_VALIDATION", "PENDING", "YELLOW"].includes(toVitaStatus(o.status)) || o.evaluation_level === "YELLOW");

  return (
    <DashboardLayout title="Cockpit opérations" subtitle="Contrôle colis · flotte · marge contributive">
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
              <p className="text-white/45 text-sm">CA livré</p>
              <p className="font-heading text-3xl font-bold mt-2 text-primary">{gmv.toLocaleString("fr-FR")} FC</p>
            </div>
            <div className="rounded-2xl border border-white/10 p-6">
              <p className="text-white/45 text-sm">Coûts variables</p>
              <p className="font-heading text-3xl font-bold mt-2">{costs.toLocaleString("fr-FR")} FC</p>
            </div>
            <div className="rounded-2xl border border-white/10 p-6">
              <p className="text-white/45 text-sm">Marge contributive</p>
              <p className="font-heading text-3xl font-bold mt-2">{margin.toLocaleString("fr-FR")} FC</p>
              <p className="text-xs text-white/35 mt-1">Pas un bénéfice net</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {[
              { label: "Demandes", value: orders.length, href: "/admin/commandes" },
              { label: "File contrôle", value: pendingVal, href: "/admin/commandes" },
              { label: "Bloquées", value: blocked, href: "/admin/commandes" },
              { label: "En course", value: live.length, href: "/admin/suivi" },
              { label: "Livreurs", value: driversOnline, href: "/admin/livreurs" },
              { label: "Comptes", value: usersN, href: "/admin/utilisateurs" },
            ].map((c) => (
              <Link key={c.label} to={c.href} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-primary/40">
                <p className="text-[11px] uppercase tracking-wider text-white/40">{c.label}</p>
                <p className="font-heading text-2xl font-bold mt-1">{c.value}</p>
              </Link>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-white/50 mb-3">Volume · 14 jours</p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chart}>
                    <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                    <Area type="monotone" dataKey="n" stroke="#FFC400" fill="rgba(255,196,0,0.15)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-white/50 mb-3">Contrôle VERT / JAUNE / ROUGE</p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byEval}>
                    <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                    <Bar dataKey="n" fill="#FFC400" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-heading font-semibold">File de contrôle</p>
                <Button asChild size="sm" variant="outline"><Link to="/admin/commandes">Ouvrir</Link></Button>
              </div>
              <ul className="space-y-2 text-sm">
                {queue.slice(0, 6).map((o) => (
                  <li key={o.id} className="rounded-xl border border-white/10 p-3">
                    <p className="truncate">{o.pickup_address} → {o.delivery_address}</p>
                    <p className="text-xs text-primary mt-1">{statusLabel(o.status)} · {o.evaluation_level || "sans note"} · {o.package_description || "colis"}</p>
                  </li>
                ))}
                {queue.length === 0 && <p className="text-white/40 text-sm">Aucune demande en attente.</p>}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 p-4">
              <p className="font-heading font-semibold mb-3">Analyses IA (Groq)</p>
              <ul className="space-y-2 text-sm">
                {groq.map((g) => (
                  <li key={g.id} className="rounded-xl border border-white/10 p-3">
                    <p className="text-xs text-white/40">{g.model || "IA indisponible"} · confiance {g.confidence ?? "—"}</p>
                    <p className="mt-1 text-white/80">{g.observations || g.hypotheses || "Pas d’acceptation automatique."}</p>
                  </li>
                ))}
                {groq.length === 0 && <p className="text-white/40 text-sm">Aucune analyse encore. Ouvrez Colis → Analyser (Groq).</p>}
              </ul>
              {evals[0] && (
                <p className="text-xs text-white/35 mt-3">Dernier contrôle règles : {evals[0].level}</p>
              )}
            </div>
          </div>

          {byStatus.length > 0 && (
            <div className="rounded-2xl border border-white/10 p-4">
              <p className="text-sm text-white/50 mb-3">Répartition des statuts</p>
              <div className="flex flex-wrap gap-2">
                {byStatus.map((s) => (
                  <span key={s.name} className="rounded-full border border-white/10 px-3 py-1 text-xs">{s.name} · {s.n}</span>
                ))}
              </div>
            </div>
          )}

          <OpsMap markers={markers} />
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminOverview;
