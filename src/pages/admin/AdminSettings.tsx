import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminSettings = () => {
  const { toast } = useToast();
  const [zones, setZones] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("served");
  const [geojson, setGeojson] = useState("");
  const [perKm, setPerKm] = useState("500");
  const [base, setBase] = useState("1500");

  const load = () => {
    supabase.from("zones").select("*").order("name").then(({ data }) => setZones(data ?? []));
  };

  useEffect(() => { load(); }, []);

  const addZone = async () => {
    if (!name.trim()) return;
    let boundary = null;
    if (geojson.trim()) {
      try {
        boundary = JSON.parse(geojson);
      } catch {
        toast({ title: "GeoJSON invalide", variant: "destructive" });
        return;
      }
    }
    const { error } = await supabase.from("zones").insert({
      name: name.trim(),
      commune: name.trim(),
      base_price: Number(base) || 1500,
      category,
      active: true,
      boundary,
    });
    if (error) toast({ title: error.message, variant: "destructive" });
    else {
      setName("");
      load();
    }
  };

  const saveGrid = async () => {
    await supabase.from("pricing_rules").update({ active: false }).neq("version", "");
    await supabase.from("pricing_rules").insert({
      version: `grid-${Date.now()}`,
      active: true,
      rules: { baseFc: Number(base), perKmFc: Number(perKm), minFc: 2000, weightStepKg: 5, weightSurchargeFc: 300, volumetricEnabled: false, urgentSurchargeFc: 1000, specialHandlingFc: 500, declaredValueRate: 0, trafficEnabled: false },
    });
    toast({ title: "Grille tarifaire versionnée" });
  };

  return (
    <DashboardLayout title="Paramètres" subtitle="Zones et grille tarifaire">
      <div className="flex flex-wrap gap-2 mb-6">
        <Input placeholder="Nom de zone / commune" value={name} onChange={(e) => setName(e.target.value)} className="bg-white/5 border-white/10 max-w-xs" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 rounded-md bg-white/5 border border-white/10 px-3 text-sm">
          <option value="served">Desservie</option>
          <option value="suspended">Suspendue</option>
          <option value="unserved">Non desservie</option>
          <option value="review">Validation particulière</option>
        </select>
        <Button onClick={addZone}>Ajouter la zone</Button>
        <textarea
          placeholder='Polygone GeoJSON (Polygon) ex. {"type":"Polygon","coordinates":[[[15.3,-4.32],[15.31,-4.32],[15.31,-4.31],[15.3,-4.31],[15.3,-4.32]]]}'
          value={geojson}
          onChange={(e) => setGeojson(e.target.value)}
          className="w-full min-h-[88px] rounded-md bg-white/5 border border-white/10 p-3 text-xs font-mono"
        />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {zones.map((z) => (
          <div key={z.id} className="rounded-xl border border-white/10 p-4">
            <p className="font-heading font-semibold">{z.name}</p>
            <p className="text-primary mt-1">{Number(z.base_price).toLocaleString("fr-FR")} FC</p>
            <p className="text-xs text-white/40 mt-1">{z.category || "served"} · {z.active === false ? "inactive" : "active"} · {z.boundary ? "polygone" : "sans polygone"}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-white/10 p-4 max-w-lg space-y-3">
        <p className="font-heading font-semibold">Grille (nouvelle version à chaque enregistrement)</p>
        <Input value={base} onChange={(e) => setBase(e.target.value)} className="bg-white/5 border-white/10" />
        <p className="text-xs text-white/40">Base FC</p>
        <Input value={perKm} onChange={(e) => setPerKm(e.target.value)} className="bg-white/5 border-white/10" />
        <p className="text-xs text-white/40">FC / km (proposition initiale 500)</p>
        <Button onClick={saveGrid}>Publier une version</Button>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
