import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CATEGORY_LABEL: Record<string, string> = {
  served: "Desservie",
  suspended: "Suspendue",
  unserved: "Non desservie",
  review: "Validation particulière",
};

const AdminSettings = () => {
  const { toast } = useToast();
  const [zones, setZones] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("served");
  const [perKm, setPerKm] = useState("500");
  const [base, setBase] = useState("1500");
  const [minFc, setMinFc] = useState("2000");
  const [auto, setAuto] = useState(false);
  const [activeGrid, setActiveGrid] = useState<any | null>(null);

  const load = async () => {
    const [{ data: z }, { data: setting }, { data: grid }] = await Promise.all([
      supabase.from("zones").select("*").order("name"),
      supabase.from("ops_settings").select("value").eq("key", "auto_assign").maybeSingle(),
      supabase.from("pricing_rules").select("*").eq("active", true).maybeSingle(),
    ]);
    setZones(z ?? []);
    setAuto(setting?.value === true);
    setActiveGrid(grid);
    if (grid?.rules) {
      setBase(String(grid.rules.baseFc ?? 1500));
      setPerKm(String(grid.rules.perKmFc ?? 500));
      setMinFc(String(grid.rules.minFc ?? 2000));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addZone = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from("zones").insert({
      name: name.trim(),
      commune: name.trim(),
      base_price: Number(base) || 1500,
      category,
      active: true,
    });
    if (error) toast({ title: error.message, variant: "destructive" });
    else {
      setName("");
      toast({ title: "Zone ajoutée" });
      load();
    }
  };

  const setZoneCat = async (id: string, next: string) => {
    await supabase.from("zones").update({ category: next }).eq("id", id);
    load();
  };

  const toggleZone = async (z: any) => {
    await supabase.from("zones").update({ active: !z.active }).eq("id", z.id);
    load();
  };

  const saveGrid = async () => {
    await supabase.from("pricing_rules").update({ active: false }).neq("version", "");
    await supabase.from("pricing_rules").insert({
      version: `grid-${Date.now()}`,
      active: true,
      rules: {
        baseFc: Number(base),
        perKmFc: Number(perKm),
        minFc: Number(minFc),
        weightStepKg: 5,
        weightSurchargeFc: 300,
        volumetricEnabled: false,
        urgentSurchargeFc: 1000,
        specialHandlingFc: 500,
        declaredValueRate: 0,
        trafficEnabled: false,
      },
    });
    toast({ title: "Nouvelle grille publiée" });
    load();
  };

  const toggleAuto = async () => {
    const next = !auto;
    await supabase.from("ops_settings").upsert({ key: "auto_assign", value: next });
    setAuto(next);
    toast({ title: next ? "Attribution auto activée" : "Attribution auto désactivée" });
  };

  return (
    <DashboardLayout title="Paramètres" subtitle="Zones, tarif, attribution, IA">
      <div className="space-y-8 max-w-4xl">
        <section className="rounded-2xl border border-white/10 p-5 space-y-3">
          <p className="font-heading font-semibold">Attribution des courses</p>
          <p className="text-sm text-white/50">Par défaut l’attribution automatique est coupée : le dispatch choisit le livreur.</p>
          <Button variant={auto ? "hero" : "outline"} onClick={toggleAuto}>
            {auto ? "Auto : activée" : "Auto : désactivée"}
          </Button>
        </section>

        <section className="rounded-2xl border border-white/10 p-5 space-y-4">
          <div>
            <p className="font-heading font-semibold">Grille tarifaire</p>
            <p className="text-sm text-white/50">Version active : {activeGrid?.version || "aucune"} · le trafic n’est pas facturé.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-white/40 mb-1">Base (FC)</p>
              <Input value={base} onChange={(e) => setBase(e.target.value)} className="bg-white/5 border-white/10" />
            </div>
            <div>
              <p className="text-xs text-white/40 mb-1">Prix / km (FC)</p>
              <Input value={perKm} onChange={(e) => setPerKm(e.target.value)} className="bg-white/5 border-white/10" />
            </div>
            <div>
              <p className="text-xs text-white/40 mb-1">Minimum (FC)</p>
              <Input value={minFc} onChange={(e) => setMinFc(e.target.value)} className="bg-white/5 border-white/10" />
            </div>
          </div>
          <Button onClick={saveGrid}>Publier cette version</Button>
        </section>

        <section className="rounded-2xl border border-white/10 p-5 space-y-4">
          <p className="font-heading font-semibold">Zones Kinshasa</p>
          <p className="text-sm text-white/50">Ajoutez une commune, puis choisissez si elle est desservie, suspendue ou hors zone.</p>
          <div className="flex flex-wrap gap-2">
            <Input placeholder="Nom de commune (ex. Gombe)" value={name} onChange={(e) => setName(e.target.value)} className="bg-white/5 border-white/10 max-w-xs" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 rounded-md bg-white/5 border border-white/10 px-3 text-sm">
              <option value="served">Desservie</option>
              <option value="suspended">Suspendue</option>
              <option value="unserved">Non desservie</option>
              <option value="review">Validation particulière</option>
            </select>
            <Button onClick={addZone}>Ajouter</Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {zones.map((z) => (
              <div key={z.id} className="rounded-xl border border-white/10 p-4">
                <p className="font-heading font-semibold">{z.name || z.commune}</p>
                <p className="text-xs text-primary mt-1">{CATEGORY_LABEL[z.category] || z.category || "Desservie"}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {["served", "suspended", "unserved", "review"].map((c) => (
                    <button key={c} type="button" onClick={() => setZoneCat(z.id, c)} className={`text-[11px] rounded-full px-2 py-1 border ${z.category === c ? "border-primary text-primary" : "border-white/10 text-white/45"}`}>
                      {CATEGORY_LABEL[c]}
                    </button>
                  ))}
                  <button type="button" onClick={() => toggleZone(z)} className="text-[11px] text-white/40">
                    {z.active === false ? "Activer" : "Désactiver"}
                  </button>
                </div>
              </div>
            ))}
            {zones.length === 0 && <p className="text-white/40 text-sm">Aucune zone. Ajoutez Gombe, Lingwala, Limete…</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 p-5 space-y-2">
          <p className="font-heading font-semibold">Analyse IA (Groq)</p>
          <p className="text-sm text-white/50">
            La clé Groq est un secret serveur. L’IA n’accepte jamais une course toute seule : timeout ou doute → JAUNE.
            Lancez une analyse depuis <span className="text-primary">Colis</span> sur une commande avec photo.
          </p>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
