import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const EntreprisePlan = () => {
  const { user } = useAuth();
  const [sub, setSub] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: mem } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id).maybeSingle();
      if (!mem) return;
      const { data } = await supabase.from("subscriptions").select("*").eq("organization_id", mem.organization_id).eq("status", "active").maybeSingle();
      setSub(data);
    })();
  }, [user]);

  return (
    <DashboardLayout title="Forfait" subtitle="Abonnement entreprise">
      <div className="rounded-xl border border-white/10 p-6 max-w-lg">
        {sub ? (
          <>
            <p className="text-primary">{sub.status}</p>
            <p className="font-heading text-2xl mt-2">{sub.credits_remaining} crédits restants</p>
          </>
        ) : (
          <p className="text-white/50">Aucun forfait actif. Contactez finance Vita Express.</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EntreprisePlan;
