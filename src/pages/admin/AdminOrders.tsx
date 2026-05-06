import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminOrders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [{ data: ordersData }, { data: driverProfiles }, { data: profiles }] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("driver_profiles").select("user_id, approved, status").eq("approved", true),
      supabase.from("profiles").select("user_id, full_name, email"),
    ]);

    const profileMap = new Map((profiles ?? []).map((profile) => [profile.user_id, profile]));
    const enrichedDrivers = (driverProfiles ?? []).map((driver) => ({
      ...driver,
      profile: profileMap.get(driver.user_id),
    }));

    setOrders(ordersData ?? []);
    setDrivers(enrichedDrivers);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const assignDriver = async (orderId: string) => {
    const driverId = assignments[orderId];
    if (!driverId) {
      toast({ title: "Sélection requise", description: "Choisissez un livreur avant d'affecter la commande.", variant: "destructive" });
      return;
    }

    setAssigningId(orderId);
    const { error } = await supabase
      .from("orders")
      .update({ driver_id: driverId, status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", orderId)
      .eq("status", "pending");

    if (!error) {
      await supabase.from("driver_profiles").update({ status: "busy" }).eq("user_id", driverId);
      toast({ title: "Livreur affecté", description: "La course a été transmise au livreur." });
      await load();
    } else {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }

    setAssigningId(null);
  };

  return (
    <DashboardLayout title="Toutes les commandes" subtitle="Vue admin de la plateforme">
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-background rounded-2xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4">Date</th>
                <th className="text-left p-4">Trajet</th>
                <th className="text-left p-4">Distance</th>
                <th className="text-left p-4">Prix</th>
                <th className="text-left p-4">Statut</th>
                <th className="text-left p-4">Affectation</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="p-4 whitespace-nowrap">{new Date(o.created_at).toLocaleString("fr-FR")}</td>
                  <td className="p-4">{o.pickup_address} → {o.dropoff_address}</td>
                  <td className="p-4">{o.distance_km} km</td>
                  <td className="p-4 font-semibold text-primary">{Number(o.price).toLocaleString()} FC</td>
                  <td className="p-4"><Badge>{o.status}</Badge></td>
                  <td className="p-4 min-w-[260px]">
                    {o.status === "pending" ? (
                      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                        <Select value={assignments[o.id] ?? ""} onValueChange={(value) => setAssignments((prev) => ({ ...prev, [o.id]: value }))}>
                          <SelectTrigger className="sm:w-[180px]">
                            <SelectValue placeholder="Choisir un livreur" />
                          </SelectTrigger>
                          <SelectContent>
                            {drivers.map((driver) => (
                              <SelectItem key={driver.user_id} value={driver.user_id}>
                                {driver.profile?.full_name ?? driver.profile?.email ?? "Livreur"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={() => assignDriver(o.id)} disabled={assigningId === o.id}>
                          {assigningId === o.id ? "Affectation..." : "Affecter"}
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {drivers.find((driver) => driver.user_id === o.driver_id)?.profile?.full_name ?? (o.driver_id ? "Livreur attribué" : "Non attribuée")}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminOrders;
