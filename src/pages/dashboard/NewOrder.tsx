import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Package, Truck, CreditCard, ArrowRight, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const zones = [
  { name: "Gombe", multiplier: 1.0 },
  { name: "Limete", multiplier: 1.1 },
  { name: "Ngaliema", multiplier: 1.2 },
  { name: "Kintambo", multiplier: 1.1 },
  { name: "Barumbu", multiplier: 1.0 },
  { name: "Kinshasa", multiplier: 1.0 },
  { name: "Lingwala", multiplier: 1.0 },
  { name: "Kalamu", multiplier: 1.1 },
  { name: "Ngiri-Ngiri", multiplier: 1.1 },
  { name: "Bandalungwa", multiplier: 1.2 },
  { name: "Selembao", multiplier: 1.3 },
  { name: "Bumbu", multiplier: 1.2 },
];

const NewOrder = () => {
  const [step, setStep] = useState(1);
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupZone, setPickupZone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryZone, setDeliveryZone] = useState("");
  const [packageDescription, setPackageDescription] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null);
  const { toast } = useToast();

  const calculatePrice = () => {
    if (!pickupZone || !deliveryZone) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner les zones de ramassage et de livraison",
        variant: "destructive",
      });
      return;
    }

    // Simulated distance calculation (in real app, would use Google Maps API)
    const baseDistance = Math.random() * 10 + 2; // 2-12 km
    const distance = Math.round(baseDistance * 10) / 10;

    const pickupMultiplier = zones.find((z) => z.name === pickupZone)?.multiplier || 1;
    const deliveryMultiplier = zones.find((z) => z.name === deliveryZone)?.multiplier || 1;

    // Base price: 500 FC per km, minimum 2000 FC
    const basePrice = Math.max(distance * 500, 2000);
    const finalPrice = Math.round(basePrice * pickupMultiplier * deliveryMultiplier);

    setEstimatedDistance(distance);
    setEstimatedPrice(finalPrice);
    setStep(2);
  };

  const confirmOrder = () => {
    toast({
      title: "Commande simulée",
      description: "Connectez Lovable Cloud pour activer les commandes réelles",
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`w-16 lg:w-24 h-1 mx-2 rounded ${
                    step > s ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-background rounded-2xl border border-border p-6 lg:p-8"
        >
          {step === 1 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-poppins font-semibold">
                    Adresses de livraison
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Indiquez les points de ramassage et de livraison
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Pickup */}
                <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
                  <h3 className="font-semibold flex items-center gap-2">
                    <span className="w-6 h-6 bg-green-500 text-secondary-foreground rounded-full flex items-center justify-center text-xs">
                      A
                    </span>
                    Point de ramassage
                  </h3>
                  <div className="grid gap-4">
                    <div>
                      <Label>Zone / Commune</Label>
                      <select
                        value={pickupZone}
                        onChange={(e) => setPickupZone(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-input bg-background"
                      >
                        <option value="">Sélectionner une zone</option>
                        {zones.map((zone) => (
                          <option key={zone.name} value={zone.name}>
                            {zone.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Adresse complète</Label>
                      <Input
                        placeholder="Numéro, avenue, quartier..."
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        className="h-12"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery */}
                <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
                  <h3 className="font-semibold flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">
                      B
                    </span>
                    Point de livraison
                  </h3>
                  <div className="grid gap-4">
                    <div>
                      <Label>Zone / Commune</Label>
                      <select
                        value={deliveryZone}
                        onChange={(e) => setDeliveryZone(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-input bg-background"
                      >
                        <option value="">Sélectionner une zone</option>
                        {zones.map((zone) => (
                          <option key={zone.name} value={zone.name}>
                            {zone.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Adresse complète</Label>
                      <Input
                        placeholder="Numéro, avenue, quartier..."
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="h-12"
                      />
                    </div>
                  </div>
                </div>

                {/* Package Description */}
                <div>
                  <Label>Description du colis (optionnel)</Label>
                  <Input
                    placeholder="Ex: Petit carton, documents, nourriture..."
                    value={packageDescription}
                    onChange={(e) => setPackageDescription(e.target.value)}
                    className="h-12"
                  />
                </div>

                <Button size="lg" className="w-full" onClick={calculatePrice}>
                  <Calculator className="w-5 h-5 mr-2" />
                  Calculer le prix
                </Button>
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
                  <h2 className="text-xl font-poppins font-semibold">
                    Récapitulatif
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Vérifiez les détails de votre commande
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-green-500 text-secondary-foreground rounded-full flex items-center justify-center text-xs shrink-0">
                      A
                    </span>
                    <div>
                      <p className="text-sm text-muted-foreground">Ramassage</p>
                      <p className="font-medium">{pickupZone}</p>
                      <p className="text-sm text-muted-foreground">{pickupAddress || "Adresse à préciser"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs shrink-0">
                      B
                    </span>
                    <div>
                      <p className="text-sm text-muted-foreground">Livraison</p>
                      <p className="font-medium">{deliveryZone}</p>
                      <p className="text-sm text-muted-foreground">{deliveryAddress || "Adresse à préciser"}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-primary/10 rounded-xl border border-primary/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Distance estimée</p>
                      <p className="text-2xl font-bold">{estimatedDistance} km</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Prix estimé</p>
                      <p className="text-3xl font-bold text-primary">
                        {estimatedPrice?.toLocaleString()} FC
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    * Prix final calculé à la confirmation du livreur
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={() => setStep(1)}
                  >
                    Modifier
                  </Button>
                  <Button size="lg" className="flex-1" onClick={() => setStep(3)}>
                    Confirmer
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-poppins font-semibold">Paiement</h2>
                  <p className="text-sm text-muted-foreground">
                    Choisissez votre mode de paiement
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <button className="w-full p-4 bg-muted/50 rounded-xl border-2 border-primary flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Truck className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold">Paiement à la livraison</p>
                    <p className="text-sm text-muted-foreground">
                      Payez en cash à la réception
                    </p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-primary bg-primary" />
                </button>

                <button className="w-full p-4 bg-muted/50 rounded-xl border border-border flex items-center gap-4 opacity-60">
                  <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold">Mobile Money</p>
                    <p className="text-sm text-muted-foreground">
                      Bientôt disponible
                    </p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                </button>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-muted-foreground">Total à payer</span>
                    <span className="text-2xl font-bold text-primary">
                      {estimatedPrice?.toLocaleString()} FC
                    </span>
                  </div>
                  <Button size="lg" className="w-full" onClick={confirmOrder}>
                    Confirmer la commande
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
