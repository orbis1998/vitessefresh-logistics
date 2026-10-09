import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import OpsMap, { type OpsMarker } from "@/components/ops/OpsMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { canTransition, statusLabel, toVitaStatus } from "@/lib/status";

const DriverDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [driver, setDriver] = useState<any | null>(null);
  const [mission, setMission] = useState<any | null>(null);
  const [otp, setOtp] = useState("");
  const [earned, setEarned] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data: dp } = await supabase.from("driver_profiles").select("*").eq("user_id", user.id).maybeSingle();
    setDriver(dp);
    const { data: active } = await supabase
      .from("orders")
      .select("*")
      .eq("driver_id", user.id)
      .in("status", ["ASSIGNED", "ACCEPTED", "COLLECTING", "PICKED_UP", "IN_TRANSIT"])
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setMission(active);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { data: done } = await supabase
      .from("orders")
      .select("total_price")
      .eq("driver_id", user.id)
      .eq("status", "DELIVERED")
      .gte("delivered_at", start.toISOString());
    setEarned((done ?? []).reduce((s, o) => s + Number(o.total_price ?? 0), 0));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user || !driver) return;
    const watch = navigator.geolocation?.watchPosition((pos) => {
      supabase.from("driver_pings").upsert({
        driver_id: user.id,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        heading: pos.coords.heading,
        speed: pos.coords.speed,
        updated_at: new Date().toISOString(),
      });
    });
    return () => {
      if (typeof watch === "number") navigator.geolocation.clearWatch(watch);
    };
  }, [user, driver]);

  const setOnline = async (on: boolean) => {
    if (!user) return;
    await supabase.from("driver_profiles").update({ available: on }).eq("user_id", user.id);
    load();
  };

  const advance = async (status: string) => {
    if (!mission) return;
    if (!canTransition(mission.status, status)) {
      toast({ title: "Transition interdite", variant: "destructive" });
      return;
    }
    await supabase.from("orders").update({ status }).eq("id", mission.id);
    if (status === "IN_TRANSIT") {
      await supabase.functions.invoke("issue-delivery-code", { body: { order_id: mission.id } });
    }
    load();
  };

  const confirmOtp = async () => {
    if (!mission) return;
    const { data, error } = await supabase.rpc("verify_delivery_code", { p_order_id: mission.id, p_code: otp });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    const res = data as { success?: boolean; message?: string };
    toast({ title: res?.success ? "Livré" : "Code", description: res?.message, variant: res?.success ? "default" : "destructive" });
    if (res?.success) {
      setOtp("");
      load();
    }
  };

  const createDriverProfile = async () => {
    if (!user) return;
    await supabase.from("driver_profiles").upsert({ user_id: user.id });
    load();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  const st = mission ? toVitaStatus(mission.status) : "";
  const markers: OpsMarker[] = mission
    ? [
        { id: "p", lng: Number(mission.pickup_lng), lat: Number(mission.pickup_lat), kind: "pickup", label: mission.pickup_address },
        { id: "d", lng: Number(mission.delivery_lng), lat: Number(mission.delivery_lat), kind: "drop", label: mission.delivery_address },
      ]
    : [];

  return (
    <DashboardLayout title="Mission" subtitle="Une course à la fois — le code n’est pas affiché">
      {!driver ? (
        <div className="rounded-xl border border-white/10 p-8 max-w-lg">
          <h2 className="font-heading text-xl font-semibold">Activer le profil livreur</h2>
          <Button className="mt-6" onClick={createDriverProfile}>Créer mon profil</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-white/10 p-4">
            <div>
              <p className="text-xs text-white/40">Gains du jour</p>
              <p className="font-heading text-2xl font-bold text-primary">{earned.toLocaleString("fr-FR")} FC</p>
            </div>
            <Button variant={!driver.available ? "hero" : "outline"} onClick={() => setOnline(!driver.available)}>
              {driver.available ? "Passer hors ligne" : "Passer en ligne"}
            </Button>
          </div>

          {mission ? (
            <>
              <OpsMap markers={markers} className="h-[320px] sm:h-[420px]" />
              <div className="rounded-xl border border-white/10 p-4 space-y-2">
                <p className="text-xs text-primary uppercase">{statusLabel(mission.status)}</p>
                <p className="text-sm">{mission.pickup_address}</p>
                <p className="text-sm text-white/50">→ {mission.delivery_address}</p>
                <p className="text-sm">Destinataire : {mission.recipient_name || "—"} · {mission.recipient_phone || "—"}</p>
                {(st === "ASSIGNED" || st === "ACCEPTED") && <Button className="w-full" onClick={() => advance("COLLECTING")}>Démarrer la collecte</Button>}
                {st === "COLLECTING" && <Button className="w-full" onClick={() => advance("PICKED_UP")}>Colis collecté</Button>}
                {st === "PICKED_UP" && <Button className="w-full" onClick={() => advance("IN_TRANSIT")}>En route</Button>}
                {st === "IN_TRANSIT" && (
                  <div className="flex gap-2">
                    <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Code du destinataire" className="bg-white/5 border-white/10" inputMode="numeric" />
                    <Button onClick={confirmOtp}>Valider</Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-white/45 text-sm">Pas de mission en cours. Le dispatch doit vous attribuer une course.</p>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default DriverDashboard;
