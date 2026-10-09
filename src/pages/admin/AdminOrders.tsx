import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const AdminOrders = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [{ data: ordersData }, { data: driverProfiles }, { data: profiles }] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("driver_profiles").select("user_id, approved, status").eq("approved", true),
      supabase.from("profiles").select("user_id, full_name, email"),
    ]);
    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
    setOrders(ordersData ?? []);
    setDrivers((driverProfiles ?? []).map((d) => ({ ...d, profile: profileMap.get(d.user_id) })));
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("ops-orders").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load()).subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const assignDriver = async (orderId: string) => {
    const driverId = assignments[orderId];
    if (!driverId) {
      toast({ title: "Choisissez un livreur", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("orders").update({ driver_id: driverId, status: "accepted", accepted_at: new Date().toISOString() }).eq("id", orderId);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else {
      await supabase.from("driver_profiles").update({ status: "busy" }).eq("user_id", driverId);
      if (user) {
        await supabase.from("audit_logs").insert({ actor_id: user.id, action: "assign_driver", entity: "order", entity_id: orderId });
      }
      const { data: dprof } = await supabase.from("profiles").select("phone").eq("user_id", driverId).maybeSingle();
      if (dprof?.phone) {
        await supabase.from("whatsapp_messages").insert({
          phone: dprof.phone,
          body: "Vita Express : nouvelle mission. Ouvrez l’app livreur.",
          kind: "mission",
          order_id: orderId,
        });
      }
      toast({ title: "Livreur affecté" });
      load();
    }
  };

  const shown = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <DashboardLayout title="Commandes" subtitle="Affectation et suivi">
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "accepted", "in_transit", "delivered"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-xs ${filter === s ? "bg-primary text-black" : "bg-white/5 text-white/60"}`}
          >
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
                <th className="text-left p-3">Prix</th>
                <th className="text-left p-3">Paiement</th>
                <th className="text-left p-3">OTP</th>
                <th className="text-right p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((o) => (
                <tr key={o.id} className={`border-t border-white/10 cursor-pointer ${selected?.id === o.id ? "bg-primary/10" : ""}`} onClick={() => setSelected(o)}>
                  <td className="p-3 max-w-xs">
                    <p className="truncate">{o.pickup_address}</p>
                    <p className="truncate text-white/40 text-xs">→ {o.dropoff_address}</p>
                  </td>
                  <td className="p-3 text-primary">{o.status}</td>
                  <td className="p-3">{Number(o.price).toLocaleString("fr-FR")} FC</td>
                  <td className="p-3 text-white/55">{o.payment_method || "cash"} · {o.payment_status || "—"}</td>
                  <td className="p-3 font-mono text-xs">{o.delivery_otp || "—"}</td>
                  <td className="p-3 text-right">
                    {o.status === "pending" && (
                      <div className="flex justify-end gap-2">
                        <Select onValueChange={(v) => setAssignments((a) => ({ ...a, [o.id]: v }))}>
                          <SelectTrigger className="h-8 w-36 bg-white/5 border-white/10"><SelectValue placeholder="Livreur" /></SelectTrigger>
                          <SelectContent>
                            {drivers.map((d) => (
                              <SelectItem key={d.user_id} value={d.user_id}>{d.profile?.full_name || d.profile?.email || d.user_id.slice(0, 6)}</SelectItem>
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
              <p className="text-xs text-primary uppercase">{selected.status}</p>
              <p>{selected.pickup_address}</p>
              <p className="text-white/50">→ {selected.dropoff_address}</p>
              <p>Destinataire : {selected.recipient_name || "—"} · {selected.recipient_phone || "—"}</p>
              <p>OTP : <span className="font-mono">{selected.delivery_otp || "—"}</span></p>
              <p>Paiement : {selected.payment_method || "cash"} · {selected.payment_status || "—"}</p>
              <p>K-Pay : {selected.kpay_status || "—"}</p>
              <p className="text-primary font-heading text-lg">{Number(selected.price).toLocaleString("fr-FR")} FC</p>
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
