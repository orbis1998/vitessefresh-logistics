import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABEL, type AppRole } from "@/lib/roles";

const AdminUsers = () => {
  const [rows, setRows] = useState<{ user_id: string; full_name: string | null; email: string | null; phone: string | null; roles: string[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, email, phone"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const map = new Map<string, string[]>();
      (roles ?? []).forEach((r) => {
        const arr = map.get(r.user_id) ?? [];
        arr.push(r.role);
        map.set(r.user_id, arr);
      });
      setRows((profiles ?? []).map((p) => ({ ...p, roles: map.get(p.user_id) ?? [] })));
      setLoading(false);
    })();
  }, []);

  const particuliers = rows.filter((r) => r.roles.includes("client") || r.roles.length === 0);

  return (
    <DashboardLayout title="Clients" subtitle="Particuliers inscrits">
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
                <th className="text-left p-3">Rôles</th>
              </tr>
            </thead>
            <tbody>
              {particuliers.map((r) => (
                <tr key={r.user_id} className="border-t border-white/10">
                  <td className="p-3">{r.full_name || "—"}</td>
                  <td className="p-3 text-white/60">{r.email}</td>
                  <td className="p-3 text-white/60">{r.phone || "—"}</td>
                  <td className="p-3 text-primary">{r.roles.map((x) => ROLE_LABEL[x as AppRole] ?? x).join(", ")}</td>
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
