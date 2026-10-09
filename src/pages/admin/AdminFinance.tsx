import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toVitaStatus } from "@/lib/status";
import { useToast } from "@/hooks/use-toast";

const AdminFinance = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [costs, setCosts] = useState<any[]>([]);
  const [kind, setKind] = useState("carburant");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const load = async () => {
    const [{ data: o }, { data: c }] = await Promise.all([
      supabase.from("orders").select("id, status, total_price, client_id, commune, created_at, delivered_at").order("created_at", { ascending: false }).limit(400),
      supabase.from("cost_entries").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    setOrders(o ?? []);
    setCosts(c ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const delivered = orders.filter((o) => toVitaStatus(o.status) === "DELIVERED");
  const revenue = delivered.reduce((s, o) => s + Number(o.total_price ?? 0), 0);
  const costSum = costs.reduce((s, r) => s + Number(r.amount), 0);
  const margin = revenue - costSum;

  const byCommune = useMemo(() => {
    const m: Record<string, number> = {};
    delivered.forEach((o) => {
      const k = o.commune || "Non renseignée";
      m[k] = (m[k] || 0) + Number(o.total_price ?? 0);
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [delivered]);

  const byClient = useMemo(() => {
    const m: Record<string, number> = {};
    delivered.forEach((o) => {
      const k = o.client_id || "—";
      m[k] = (m[k] || 0) + Number(o.total_price ?? 0);
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [delivered]);

  const addCost = async () => {
    const n = Number(amount);
    if (!n) return;
    const { error } = await supabase.from("cost_entries").insert({ kind, amount: n, note: note || null });
    if (error) toast({ title: error.message, variant: "destructive" });
    else {
      setAmount("");
      setNote("");
      load();
    }
  };

  return (
    <DashboardLayout title="Finance" subtitle="Marge contributive (CA livré − coûts variables)">
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border border-white/10 p-4">
          <p className="text-white/45 text-sm">CA livré</p>
          <p className="font-heading text-2xl font-bold text-primary mt-1">{revenue.toLocaleString("fr-FR")} FC</p>
        </div>
        <div className="rounded-xl border border-white/10 p-4">
          <p className="text-white/45 text-sm">Coûts variables</p>
          <p className="font-heading text-2xl font-bold mt-1">{costSum.toLocaleString("fr-FR")} FC</p>
        </div>
        <div className="rounded-xl border border-white/10 p-4">
          <p className="text-white/45 text-sm">Marge contributive</p>
          <p className="font-heading text-2xl font-bold mt-1">{margin.toLocaleString("fr-FR")} FC</p>
          <p className="text-[11px] text-white/35 mt-1">Pas un bénéfice net (hors charges fixes, impôts).</p>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-white/10 p-4">
          <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Par commune</p>
          <ul className="text-sm space-y-1">
            {byCommune.map(([k, v]) => (
              <li key={k} className="flex justify-between"><span>{k}</span><span className="text-primary">{v.toLocaleString("fr-FR")} FC</span></li>
            ))}
            {byCommune.length === 0 && <li className="text-white/40">Aucune livraison.</li>}
          </ul>
        </div>
        <div className="rounded-xl border border-white/10 p-4">
          <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Par client</p>
          <ul className="text-sm space-y-1">
            {byClient.map(([k, v]) => (
              <li key={k} className="flex justify-between"><span className="truncate max-w-[60%]">{k.slice(0, 8)}…</span><span className="text-primary">{v.toLocaleString("fr-FR")} FC</span></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="h-10 rounded-md bg-white/5 border border-white/10 px-3 text-sm">
          <option value="carburant">Carburant</option>
          <option value="entretien">Entretien</option>
          <option value="assurance">Assurance</option>
          <option value="autre">Autre</option>
        </select>
        <Input placeholder="Montant FC" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-white/5 border-white/10 max-w-[140px]" />
        <Input placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} className="bg-white/5 border-white/10 max-w-xs" />
        <Button onClick={addCost}>Enregistrer un coût</Button>
      </div>
      <div className="rounded-xl border border-white/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/45">
            <tr>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Note</th>
              <th className="text-right p-3">Montant</th>
            </tr>
          </thead>
          <tbody>
            {costs.map((r) => (
              <tr key={r.id} className="border-t border-white/10">
                <td className="p-3 text-white/50">{new Date(r.created_at).toLocaleString("fr-FR")}</td>
                <td className="p-3">{r.kind}</td>
                <td className="p-3 text-white/55">{r.note}</td>
                <td className="p-3 text-right">{Number(r.amount).toLocaleString("fr-FR")} FC</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default AdminFinance;
