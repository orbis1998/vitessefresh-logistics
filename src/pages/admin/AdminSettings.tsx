import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";

const AdminSettings = () => {
  const [zones, setZones] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("delivery_zones").select("*").order("name").then(({ data }) => setZones(data ?? []));
  }, []);

  return (
    <DashboardLayout title="Paramètres" subtitle="Zones et tarifs de base">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {zones.map((z) => (
          <div key={z.id} className="rounded-xl border border-white/10 p-4">
            <p className="font-heading font-semibold">{z.name}</p>
            <p className="text-primary mt-1">{Number(z.base_price).toLocaleString("fr-FR")} FC</p>
            <p className="text-xs text-white/40 mt-1">{z.active ? "Active" : "Inactive"}</p>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
