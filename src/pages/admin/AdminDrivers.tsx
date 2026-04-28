import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminDrivers = () => {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: dp } = await supabase.from("driver_profiles").select("*").order("created_at", { ascending: false });
    if (!dp) { setLoading(false); return; }
    const ids = dp.map((d) => d.user_id);
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email, phone").in("user_id", ids);
    const profMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
    setDrivers(dp.map((d) => ({ ...d, profile: profMap.get(d.user_id) })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleApprove = async (driver: any) => {
    const newApproved = !driver.approved;
    await supabase.from("driver_profiles").update({ approved: newApproved }).eq("user_id", driver.user_id);
    if (newApproved) {
      // ensure has livreur role
      await supabase.from("user_roles").upsert({ user_id: driver.user_id, role: "livreur" }, { onConflict: "user_id,role" });
    }
    toast({ title: newApproved ? "Livreur approuvé" : "Approbation retirée" });
    load();
  };

  return (
    <DashboardLayout title="Livreurs" subtitle="Validez ou suspendez les livreurs">
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : drivers.length === 0 ? (
        <div className="bg-background rounded-2xl border border-border p-12 text-center text-muted-foreground">Aucun profil livreur.</div>
      ) : (
        <div className="space-y-3">
          {drivers.map((d) => (
            <div key={d.user_id} className="bg-background rounded-2xl border border-border p-5 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-semibold">{d.profile?.full_name ?? "Sans nom"}</p>
                <p className="text-sm text-muted-foreground">{d.profile?.email} · {d.profile?.phone ?? "—"}</p>
                <p className="text-xs text-muted-foreground mt-1">Véhicule: {d.vehicle_type ?? "n/c"} · Statut: {d.status}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={d.approved ? "default" : "secondary"}>{d.approved ? "Approuvé" : "En attente"}</Badge>
                <Button size="sm" variant={d.approved ? "outline" : "default"} onClick={() => toggleApprove(d)}>
                  {d.approved ? "Suspendre" : "Approuver"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDrivers;
