import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { canAssign } from "@/lib/assign";
import { statusLabel, toVitaStatus } from "@/lib/status";

const AdminOrders = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<any | null>(null);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [{ data: ordersData }, { data: dps }, { data: people }] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("driver_profiles").select("user_id, available"),
      supabase.from("users").select("id, name, email"),
    ]);
    const map = new Map((people ?? []).map((p) => [p.id, p]));
    setOrders(ordersData ?? []);
    setDrivers((dps ?? []).map((d) => ({ ...d, profile: map.get(d.user_id) })));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!selected?.id) {
      setAnalysis(null);
      return;
    }
    supabase.from("groq_analyses").select("*").eq("order_id", selected.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setAnalysis(data));
  }, [selected?.id]);

  const assignDriver = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    const check = canAssign(order?.status ?? "", order?.evaluation_level ?? "GREEN");
    if (!check.ok) {
      toast({ title: "Attribution refusée", description: check.reason ?? "", variant: "destructive" });
      return;
    }
    const driverId = assignments[orderId];
    if (!driverId) {
      toast({ title: "Choisissez un livreur", variant: "destructive" });
      return;
    }
    const { data, error } = await supabase.functions.invoke("assign-driver", { body: { order_id: orderId, driver_id: driverId } });
    if (error || data?.error) {
      toast({ title: "Erreur", description: error?.message || data?.error, variant: "destructive" });
      return;
    }
    if (user) await supabase.from("audit_events").insert({ actor_id: user.id, action: "assign_driver", entity: "order", entity_id: orderId });
    toast({ title: "Livreur affecté" });
    load();
  };

  const accept = async (order: any) => {
    if (order.evaluation_level === "RED") {
      toast({ title: "Contrôle rouge", description: "Attribution et acceptation interdites.", variant: "destructive" });
      return;
    }
    if (order.evaluation_level === "YELLOW") {
      toast({ title: "Contrôle jaune", description: "Validez d’abord le contrôle (bouton Vert).", variant: "destructive" });
      return;
    }
    await supabase.from("orders").update({ status: "ACCEPTED" }).eq("id", order.id);
    if (user) await supabase.from("audit_events").insert({ actor_id: user.id, action: "accept_order", entity: "order", entity_id: order.id });
    load();
  };

  const forceGreen = async (order: any) => {
    if (order.evaluation_level === "RED") {
      toast({ title: "Rouge non levable sans nouvelle évaluation", variant: "destructive" });
      return;
    }
    await supabase.from("orders").update({ evaluation_level: "GREEN", status: "ACCEPTED" }).eq("id", order.id);
    if (user) await supabase.from("audit_events").insert({ actor_id: user.id, action: "human_validate", entity: "order", entity_id: order.id });
    toast({ title: "Contrôle validé (humain)" });
    load();
  };

  const shown = filter === "all" ? orders : orders.filter((o) => toVitaStatus(o.status) === filter);

  return (
    <DashboardLayout title="Commandes" subtitle="Évaluation et affectation">
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {["all", "PENDING", "ACCEPTED", "IN_TRANSIT", "DELIVERED", "REJECTED"].map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-3 py-1 text-xs ${filter === s ? "bg-primary text-black" : "bg-white/5 text-white/60"}`}>
              {s === "all" ? "Toutes" : s}
            </button>
          ))}
        </div>
        <Button asChild size="sm" variant="outline"><Link to="/dashboard/order">Nouvelle course</Link></Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 rounded-xl border border-white/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-white/45">
                <tr>
                  <th className="text-left p-3">Trajet</th>
                  <th className="text-left p-3">Statut</th>
                  <th className="text-left p-3">Contrôle</th>
                  <th className="text-left p-3">Prix</th>
                  <th className="text-right p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((o) => (
                  <tr key={o.id} className={`border-t border-white/10 cursor-pointer ${selected?.id === o.id ? "bg-primary/10" : ""}`} onClick={() => setSelected(o)}>
                    <td className="p-3 max-w-xs">
                      <p className="truncate">{o.pickup_address}</p>
                      <p className="truncate text-white/40 text-xs">→ {o.delivery_address}</p>
                    </td>
                    <td className="p-3 text-primary">{statusLabel(o.status)}</td>
                    <td className="p-3">{o.evaluation_level || "—"}</td>
                    <td className="p-3">{Number(o.total_price ?? 0).toLocaleString("fr-FR")} FC</td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {o.evaluation_level === "YELLOW" && (
                        <Button size="sm" variant="outline" onClick={() => forceGreen(o)}>Valider (vert)</Button>
                      )}
                      {["PENDING", "SUBMITTED", "PENDING_VALIDATION"].includes(toVitaStatus(o.status)) && o.evaluation_level !== "YELLOW" && (
                        <Button size="sm" variant="outline" onClick={() => accept(o)}>Accepter</Button>
                      )}
                      {toVitaStatus(o.status) === "ACCEPTED" && (
                        <div className="flex justify-end gap-2">
                          <Select onValueChange={(v) => setAssignments((a) => ({ ...a, [o.id]: v }))}>
                            <SelectTrigger className="h-8 w-36 bg-white/5 border-white/10"><SelectValue placeholder="Livreur" /></SelectTrigger>
                            <SelectContent>
                              {drivers.map((d) => (
                                <SelectItem key={d.user_id} value={d.user_id}>{d.profile?.name || d.profile?.email || d.user_id.slice(0, 6)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="sm" onClick={() => assignDriver(o.id)}>Affecter</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="lg:col-span-2 rounded-xl border border-white/10 p-4 text-sm space-y-2">
            {selected ? (
              <>
                <p className="text-xs text-primary uppercase">{statusLabel(selected.status)} · {selected.evaluation_level || "sans contrôle"}</p>
                <p>{selected.pickup_address}</p>
                <p className="text-white/50">→ {selected.delivery_address}</p>
                <p>Poids {selected.weight_kg ?? "—"} kg · {selected.package_description || "—"}</p>
                <p className="text-white/40 text-xs">Le code de remise n’est pas affiché ici.</p>
                {analysis && (
                  <div className="rounded-lg bg-white/5 p-3 mt-2">
                    <p className="text-xs text-primary">Analyse Groq</p>
                    <p className="text-xs mt-1">{analysis.observations || analysis.hypotheses || "IA en échec → pas d’acceptation auto."}</p>
                  </div>
                )}
                <Button size="sm" variant="outline" className="mt-2" onClick={async () => {
                  const { data, error } = await supabase.functions.invoke("analyze-parcel", { body: { order_id: selected.id } });
                  if (error || data?.error) toast({ title: "Groq", description: error?.message || data?.error, variant: "destructive" });
                  else {
                    toast({ title: data?.ok ? "Analyse IA enregistrée" : "IA indisponible → JAUNE" });
                    const { data: row } = await supabase.from("groq_analyses").select("*").eq("order_id", selected.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
                    setAnalysis(row);
                  }
                }}>Analyser ce colis (IA)</Button>
              </>
            ) : (
              <p className="text-white/40">Sélectionnez une course.</p>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminOrders;
