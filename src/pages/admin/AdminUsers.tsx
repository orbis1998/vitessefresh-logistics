import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Row {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  roles: string[];
}

const AdminUsers = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, email, phone"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const rolesByUser = new Map<string, string[]>();
    (roles ?? []).forEach((r) => {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    });
    setRows(
      (profiles ?? []).map((p) => ({
        ...p,
        roles: rolesByUser.get(p.user_id) ?? [],
      })) as Row[]
    );
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleRole = async (userId: string, role: "livreur" | "admin", has: boolean) => {
    if (has) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
      if (role === "livreur") {
        await supabase.from("driver_profiles").upsert({ user_id: userId, approved: true });
      }
    }
    toast({ title: "Rôle mis à jour" });
    load();
  };

  return (
    <DashboardLayout title="Utilisateurs" subtitle="Attribuez les rôles">
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-background rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4">Nom</th>
                <th className="text-left p-4">Email</th>
                <th className="text-left p-4">Téléphone</th>
                <th className="text-left p-4">Rôles</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isLivreur = r.roles.includes("livreur");
                const isAdmin = r.roles.includes("admin");
                return (
                  <tr key={r.user_id} className="border-t border-border">
                    <td className="p-4">{r.full_name ?? "—"}</td>
                    <td className="p-4">{r.email}</td>
                    <td className="p-4">{r.phone ?? "—"}</td>
                    <td className="p-4 space-x-1">
                      {r.roles.map((role) => <Badge key={role} variant={role === "admin" ? "destructive" : "default"}>{role}</Badge>)}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button size="sm" variant={isLivreur ? "outline" : "default"} onClick={() => toggleRole(r.user_id, "livreur", isLivreur)}>
                        {isLivreur ? "Retirer livreur" : "Promouvoir livreur"}
                      </Button>
                      <Button size="sm" variant={isAdmin ? "outline" : "secondary"} onClick={() => toggleRole(r.user_id, "admin", isAdmin)}>
                        {isAdmin ? "Retirer admin" : "Promouvoir admin"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminUsers;
