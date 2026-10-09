import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminDrivers = () => {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: dp } = await supabase.from("driver_profiles").select("*").order("created_at", { ascending: false });
    const ids = (dp ?? []).map((d) => d.user_id);
    const { data: people } = ids.length ? await supabase.from("users").select("id, name, email, phone").in("id", ids) : { data: [] };
    const map = new Map((people ?? []).map((p) => [p.id, p]));
    setDrivers((dp ?? []).map((d) => ({ ...d, profile: map.get(d.user_id) })));
    const { data: v } = await supabase.from("vehicles").select("*");
    setVehicles(v ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addVehicle = async (driverId: string) => {
    await supabase.from("vehicles").insert({ driver_id: driverId, plate: plate || null, operational: true, capacity_kg: 20 });
    setPlate("");
    toast({ title: "Moto enregistrée" });
    load();
  };

  return (
    <DashboardLayout title="Livreurs" subtitle="Profils et motos">
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {drivers.map((d) => (
            <div key={d.user_id} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="font-semibold">{d.profile?.name ?? "Sans nom"}</p>
              <p className="text-sm text-white/50">{d.profile?.email} · {d.available ? "disponible" : "occupé"}</p>
              <p className="text-xs text-white/35 mt-1">{d.vehicle_type ?? "n/c"} · {d.vehicle_plate ?? "—"} · {d.total_deliveries} courses</p>
              <ul className="text-xs text-white/50 mt-2">
                {vehicles.filter((v) => v.driver_id === d.user_id).map((v) => (
                  <li key={v.id}>Moto {v.plate || "—"} · {v.operational ? "opérationnelle" : "arrêt"} · {v.odometer_km} km</li>
                ))}
              </ul>
              <div className="flex gap-2 mt-3">
                <Input placeholder="Plaque" value={plate} onChange={(e) => setPlate(e.target.value)} className="bg-white/5 border-white/10 h-9 max-w-[160px]" />
                <Button size="sm" variant="outline" onClick={() => addVehicle(d.user_id)}>Ajouter moto</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDrivers;
