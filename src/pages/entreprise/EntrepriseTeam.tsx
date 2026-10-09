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
      const { data: me } = await supabase.from("users").select("company_id").eq("id", user.id).maybeSingle();
      if (!me?.company_id) return;
      const { data } = await supabase.from("company_members").select("user_id").eq("company_id", me.company_id);
      const ids = (data ?? []).map((m) => m.user_id);
      if (!ids.length) return;
      const { data: people } = await supabase.from("users").select("id, name, email").in("id", ids);
      setMembers(people ?? []);
    })();
  }, [user]);

  return (
    <DashboardLayout title="Équipe société" subtitle="Membres du compte entreprise">
      <ul className="space-y-2 max-w-xl">
        {members.map((m) => (
          <li key={m.id} className="rounded-xl border border-white/10 p-4 text-sm">
            {m.name || "—"} · {m.email}
          </li>
        ))}
      </ul>
    </DashboardLayout>
  );
};

export default EntrepriseTeam;
