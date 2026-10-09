import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminSubscriptions = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [planId, setPlanId] = useState("");
  const [orgId, setOrgId] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const load = async () => {
    const [{ data: p }, { data: s }, { data: o }] = await Promise.all([
      supabase.from("pricing_plans").select("*").order("display_order"),
      supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
      supabase.from("organizations").select("id, name").eq("active", true),
    ]);
    setPlans(p ?? []);
    setSubs(s ?? []);
    setOrgs(o ?? []);
    if (!planId && p?.[0]) setPlanId(p[0].id);
    if (!orgId && o?.[0]) setOrgId(o[0].id);
  };

  useEffect(() => {
    load();
  }, []);

  const togglePlan = async (plan: any) => {
    const { error } = await supabase.from("pricing_plans").update({ active: !plan.active }).eq("id", plan.id);
    if (error) toast({ title: error.message, variant: "destructive" });
    else load();
  };

  const createSub = async () => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    let userId: string | null = null;
    if (userEmail.trim()) {
      const { data: profile } = await supabase.from("profiles").select("user_id").eq("email", userEmail.trim()).maybeSingle();
      userId = profile?.user_id ?? null;
    }
    const { data, error } = await supabase.from("subscriptions").insert({
      plan_id: plan.id,
      organization_id: orgId || null,
      user_id: userId,
      status: "active",
      credits_remaining: plan.included_deliveries ?? 0,
    }).select("id").single();
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    await supabase.from("ledger_entries").insert({
      kind: "subscription",
      amount: Number(plan.price),
      subscription_id: data.id,
      organization_id: orgId || null,
      user_id: userId,
      note: `Abonnement ${plan.name}`,
    });
    toast({ title: "Abonnement créé" });
    setUserEmail("");
    load();
  };

  return (
    <DashboardLayout title="Abonnements" subtitle="Packs, mensuel, entreprise">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {plans.map((p) => (
          <div key={p.id} className="rounded-xl border border-white/10 p-4">
            <p className="font-heading font-semibold">{p.name}</p>
            <p className="text-primary mt-1">{Number(p.price).toLocaleString("fr-FR")} FC</p>
            <p className="text-xs text-white/40 mt-1">{p.included_deliveries} courses</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => togglePlan(p)}>
              {p.active ? "Désactiver" : "Activer"}
            </Button>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-white/10 p-4 mb-6 flex flex-wrap gap-2 items-end">
        <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="h-10 rounded-md bg-white/5 border border-white/10 px-3 text-sm">
          {plans.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select value={orgId} onChange={(e) => setOrgId(e.target.value)} className="h-10 rounded-md bg-white/5 border border-white/10 px-3 text-sm">
          <option value="">Particulier</option>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
        <Input placeholder="Email client (optionnel)" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} className="bg-white/5 border-white/10 max-w-xs" />
        <Button onClick={createSub}>Activer un forfait</Button>
      </div>
      <p className="text-sm text-white/45 mb-2">{subs.filter((s) => s.status === "active").length} abonnements actifs</p>
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/45">
            <tr>
              <th className="text-left p-3">Statut</th>
              <th className="text-left p-3">Crédits</th>
              <th className="text-left p-3">Début</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id} className="border-t border-white/10">
                <td className="p-3 text-primary">{s.status}</td>
                <td className="p-3">{s.credits_remaining}</td>
                <td className="p-3 text-white/45">{new Date(s.starts_at).toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default AdminSubscriptions;
