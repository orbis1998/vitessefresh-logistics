import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Package, ArrowRight, Calculator, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { haversineKm, computePriceFC } from "@/lib/distance";
import MapView from "@/components/MapView";

interface Zone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  base_price: number;
}

const NewOrder = () => {
  const [step, setStep] = useState(1);
  const [zones, setZones] = useState<Zone[]>([]);
  const [pickupZoneId, setPickupZoneId] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffZoneId, setDropoffZoneId] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [packageType, setPackageType] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from("delivery_zones")
      .select("id, name, latitude, longitude, base_price")
      .eq("active", true)
      .order("name")
      .then(({ data }) => {
        if (data) setZones(data as any);
      });
  }, []);

  const pickup = zones.find((z) => z.id === pickupZoneId);
  const dropoff = zones.find((z) => z.id === dropoffZoneId);
  const distance =
    pickup && dropoff
      ? Number(
          haversineKm(
            Number(pickup.latitude),
            Number(pickup.longitude),
            Number(dropoff.latitude),
            Number(dropoff.longitude)
          ).toFixed(2)
        )
      : 0;
  const price = pickup && dropoff ? computePriceFC(distance, Number(pickup.base_price)) : 0;

  const goToRecap = () => {
    if (!pickup || !dropoff) {
      toast({ title: "Sélection requise", description: "Choisissez les deux zones.", variant: "destructive" });
      return;
    }
    if (!pickupAddress || !dropoffAddress) {
      toast({ title: "Adresses requises", description: "Renseignez les adresses complètes.", variant: "destructive" });
      return;
    }
    setStep(2);
  };

  const submitOrder = async () => {
    if (!user || !pickup || !dropoff) return;
    setSubmitting(true);
    const { error, data } = await supabase
      .from("orders")
      .insert({
        client_id: user.id,
        pickup_address: pickupAddress,
        pickup_lat: Number(pickup.latitude),
        pickup_lng: Number(pickup.longitude),
        dropoff_address: dropoffAddress,
        dropoff_lat: Number(dropoff.latitude),
        dropoff_lng: Number(dropoff.longitude),
        distance_km: distance,
        price,
        package_type: packageType || null,
        recipient_name: recipientName || null,
        recipient_phone: recipientPhone || null,
        notes: notes || null,
      })
      .select("id")
      .single();
    setSubmitting(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Commande créée", description: "Un livreur va prendre en charge votre course." });
    navigate(`/dashboard/tracking?id=${data.id}`);
  };

  const markers =
    pickup && dropoff
      ? [
          { id: "p", lat: Number(pickup.latitude), lng: Number(pickup.longitude), color: "hsl(142 76% 36%)", label: "Ramassage" },
          { id: "d", lat: Number(dropoff.latitude), lng: Number(dropoff.longitude), color: "hsl(45 100% 51%)", label: "Livraison" },
        ]
      : [];

  return (
    <DashboardLayout title="Nouvelle commande" subtitle="Estimation basée sur la distance réelle entre zones">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{s}</div>
              {s < 2 && <div className={`w-24 h-1 mx-2 rounded ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-background rounded-2xl border border-border p-6 lg:p-8">
          {step === 1 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-poppins font-semibold">Détails de la course</h2>
                  <p className="text-sm text-muted-foreground">Indiquez ramassage et livraison</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
                    <h3 className="font-semibold flex items-center gap-2">
                      <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">A</span>
                      Point de ramassage
                    </h3>
                    <div>
                      <Label>Zone</Label>
                      <select value={pickupZoneId} onChange={(e) => setPickupZoneId(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-input bg-background">
                        <option value="">Sélectionner</option>
                        {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Adresse complète</Label>
                      <Input placeholder="N°, avenue, quartier" value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} className="h-12" />
                    </div>
                  </div>

                  <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
                    <h3 className="font-semibold flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">B</span>
                      Point de livraison
                    </h3>
                    <div>
                      <Label>Zone</Label>
                      <select value={dropoffZoneId} onChange={(e) => setDropoffZoneId(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-input bg-background">
                        <option value="">Sélectionner</option>
                        {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Adresse complète</Label>
                      <Input placeholder="N°, avenue, quartier" value={dropoffAddress} onChange={(e) => setDropoffAddress(e.target.value)} className="h-12" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Destinataire</Label>
                      <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="h-12" />
                    </div>
                    <div>
                      <Label>Téléphone</Label>
                      <Input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} className="h-12" />
                    </div>
                  </div>
                  <div>
                    <Label>Type de colis</Label>
                    <Input placeholder="Documents, nourriture, vêtements..." value={packageType} onChange={(e) => setPackageType(e.target.value)} className="h-12" />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                  </div>
                </div>

                <div className="space-y-4">
                  <MapView markers={markers} fitBounds className="w-full h-80" />
                  {pickup && dropoff && (
                    <div className="p-6 bg-primary/10 rounded-xl border border-primary/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Distance</p>
                          <p className="text-2xl font-bold">{distance} km</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Prix estimé</p>
                          <p className="text-3xl font-bold text-primary">{price.toLocaleString()} FC</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <Button size="lg" className="w-full" onClick={goToRecap}>
                    <Calculator className="w-5 h-5 mr-2" />
                    Continuer
                  </Button>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-poppins font-semibold">Récapitulatif</h2>
                  <p className="text-sm text-muted-foreground">Confirmez votre commande</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                  <div><span className="text-muted-foreground text-sm">De :</span> <strong>{pickup?.name}</strong> — {pickupAddress}</div>
                  <div><span className="text-muted-foreground text-sm">À :</span> <strong>{dropoff?.name}</strong> — {dropoffAddress}</div>
                  {recipientName && <div><span className="text-muted-foreground text-sm">Destinataire :</span> {recipientName} ({recipientPhone})</div>}
                </div>
                <div className="p-6 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Distance</p>
                    <p className="text-2xl font-bold">{distance} km</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total à payer</p>
                    <p className="text-3xl font-bold text-primary">{price.toLocaleString()} FC</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Paiement à la livraison (cash). Mobile Money bientôt disponible.</p>
                <div className="flex gap-3">
                  <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep(1)}>Modifier</Button>
                  <Button size="lg" className="flex-1" onClick={submitOrder} disabled={submitting}>
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Confirmer <ArrowRight className="w-5 h-5 ml-2" /></>}
                  </Button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default NewOrder;
