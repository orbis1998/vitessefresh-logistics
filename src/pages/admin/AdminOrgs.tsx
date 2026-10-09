import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminOrgs = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [orgId, setOrgId] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("organizations").select("*").order("created_at", { ascending: false });
    setRows(data ?? []);
    if (!orgId && data?.[0]) setOrgId(data[0].id);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from("organizations").insert({ name: name.trim(), contact_email: email || null });
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Entreprise ajoutée" });
      setName("");
      setEmail("");
      load();
    }
  };

  const addMember = async () => {
    if (!orgId || !memberEmail.trim()) return;
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("email", memberEmail.trim()).maybeSingle();
    if (!profile) {
      toast({ title: "Profil introuvable", description: memberEmail, variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("organization_members").insert({ organization_id: orgId, user_id: profile.user_id });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    await supabase.from("user_roles").upsert({ user_id: profile.user_id, role: "entreprise" }, { onConflict: "user_id,role" });
    toast({ title: "Membre ajouté" });
    setMemberEmail("");
  };

  return (
    <DashboardLayout title="Entreprises" subtitle="Comptes société et forfaits volume">
      <div className="flex gap-2 mb-4 max-w-xl flex-wrap">
        <Input placeholder="Nom de l’entreprise" value={name} onChange={(e) => setName(e.target.value)} className="bg-white/5 border-white/10 flex-1 min-w-[160px]" />
        <Input placeholder="Email contact" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border-white/10 flex-1 min-w-[160px]" />
        <Button onClick={create}>Ajouter</Button>
      </div>
      <div className="flex gap-2 mb-6 max-w-xl flex-wrap">
        <select value={orgId} onChange={(e) => setOrgId(e.target.value)} className="h-10 rounded-md bg-white/5 border border-white/10 px-3 text-sm flex-1 min-w-[160px]">
          {rows.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
        <Input placeholder="Email du membre" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} className="bg-white/5 border-white/10 flex-1 min-w-[160px]" />
        <Button variant="outline" onClick={addMember}>Lier</Button>
      </div>
      {loading ? (
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-white/45">
              <tr>
                <th className="text-left p-3">Nom</th>
                <th className="text-left p-3">Contact</th>
                <th className="text-left p-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="border-t border-white/10">
                  <td className="p-3">{o.name}</td>
                  <td className="p-3 text-white/55">{o.contact_email || "—"}</td>
                  <td className="p-3 text-primary">{o.active ? "Active" : "Inactive"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminOrgs;
