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
      const { data } = await supabase.from("subscriptions").select("*").eq("user_id", user.id).eq("status", "active").maybeSingle();
      setSub(data);
    })();
  }, [user]);

  return (
    <DashboardLayout title="Forfait" subtitle="Abonnement entreprise">
      <div className="rounded-xl border border-white/10 p-6 max-w-lg">
        {sub ? (
          <>
            <p className="text-primary">{sub.status}</p>
            <p className="font-heading text-2xl mt-2">{sub.deliveries_left ?? sub.credits_remaining ?? 0} livraisons restantes</p>
          </>
        ) : (
          <p className="text-white/50">Aucun forfait actif. Contactez finance Vita Express.</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EntreprisePlan;
