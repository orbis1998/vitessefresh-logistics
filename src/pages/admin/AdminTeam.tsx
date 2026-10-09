import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABEL, STAFF_ROLES_CREATABLE, fromVitaRole, type AppRole } from "@/lib/roles";

const AdminTeam = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("call_center");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("users").select("id, name, email, role").order("created_at", { ascending: false }).limit(200);
    setRows((data ?? []).filter((u) => {
      const r = fromVitaRole(u.role);
      return r && r !== "client";
    }));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!email || !password) {
      toast({ title: "Email et mot de passe requis", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("create-staff", {
      body: { email, password, full_name: fullName, role },
    });
    setBusy(false);
    if (error || data?.error) {
      toast({ title: "Création impossible", description: error?.message || data?.error, variant: "destructive" });
      return;
    }
    toast({ title: "Compte créé", description: email });
    setEmail("");
    setPassword("");
    setFullName("");
    load();
  };

  return (
    <DashboardLayout title="Équipe" subtitle="Comptes staff (users.role Vita)">
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
          <p className="font-heading font-semibold">Nouveau compte</p>
          <Input placeholder="Nom" value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-white/5 border-white/10" />
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border-white/10" />
          <Input type="password" placeholder="Mot de passe temporaire" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border-white/10" />
          <select value={role} onChange={(e) => setRole(e.target.value as AppRole)} className="h-10 w-full rounded-md bg-white/5 border border-white/10 px-3 text-sm">
            {STAFF_ROLES_CREATABLE.map((r) => (
              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
            ))}
          </select>
          <Button onClick={create} disabled={busy}>{busy ? "Création…" : "Créer le compte"}</Button>
        </div>
        <div className="lg:col-span-3 rounded-xl border border-white/10 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-white/45">
                <tr>
                  <th className="text-left p-3">Nom</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Rôle</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-white/10">
                    <td className="p-3">{r.name || "—"}</td>
                    <td className="p-3 text-white/60">{r.email}</td>
                    <td className="p-3 text-primary">{ROLE_LABEL[fromVitaRole(r.role) as AppRole] ?? r.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminTeam;
