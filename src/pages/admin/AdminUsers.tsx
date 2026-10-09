import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { fromVitaRole, ROLE_LABEL } from "@/lib/roles";

const AdminUsers = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("users").select("id, name, email, phone, role").order("created_at", { ascending: false }).then(({ data }) => {
      setRows(data ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <DashboardLayout title="Clients" subtitle="Comptes users Vita">
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-white/45">
              <tr>
                <th className="text-left p-3">Nom</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Téléphone</th>
                <th className="text-left p-3">Rôle</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-white/10">
                  <td className="p-3">{r.name || "—"}</td>
                  <td className="p-3 text-white/60">{r.email}</td>
                  <td className="p-3 text-white/60">{r.phone || "—"}</td>
                  <td className="p-3 text-primary">{ROLE_LABEL[fromVitaRole(r.role)]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminUsers;
