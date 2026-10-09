import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";

const AdminFinance = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("ledger_entries").select("*").order("created_at", { ascending: false }).limit(200);
      setRows(data ?? []);
      setTotal((data ?? []).reduce((s, r) => s + Number(r.amount), 0));
    })();
  }, []);

  return (
    <DashboardLayout title="Finance" subtitle="Frais de course, abonnements, K-Pay">
      <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6 mb-6">
        <p className="text-white/45 text-sm">Total ledger</p>
        <p className="font-heading text-3xl font-bold text-primary mt-1">{total.toLocaleString("fr-FR")} FC</p>
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
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/10">
                <td className="p-3 text-white/50">{new Date(r.created_at).toLocaleString("fr-FR")}</td>
                <td className="p-3">{r.kind}</td>
                <td className="p-3 text-white/55">{r.note}</td>
                <td className="p-3 text-right">{Number(r.amount).toLocaleString("fr-FR")} {r.currency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default AdminFinance;
