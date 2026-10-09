import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const EntrepriseTeam = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: mem } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id).maybeSingle();
      if (!mem) return;
      const { data } = await supabase.from("organization_members").select("user_id").eq("organization_id", mem.organization_id);
      const ids = (data ?? []).map((m) => m.user_id);
      if (!ids.length) return;
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", ids);
      setMembers(profiles ?? []);
    })();
  }, [user]);

  return (
    <DashboardLayout title="Équipe société" subtitle="Membres du compte entreprise">
      <ul className="space-y-2 max-w-xl">
        {members.map((m) => (
          <li key={m.user_id} className="rounded-xl border border-white/10 p-4 text-sm">
            {m.full_name || "—"} · {m.email}
          </li>
        ))}
      </ul>
    </DashboardLayout>
  );
};

export default EntrepriseTeam;
