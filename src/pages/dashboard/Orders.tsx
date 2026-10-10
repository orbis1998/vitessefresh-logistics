import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin, Package, User, Phone, Calculator, ArrowRight, Loader2,
  CheckCircle2, Crosshair, Search, Navigation, Banknote, Smartphone, ShieldCheck
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import MapView from "@/components/MapView";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { reverseGeocode, searchKinshasa } from "@/lib/vita-map";
import { haversineKm, computePriceFC } from "@/lib/distance";
import { useToast } from "@/hooks/use-toast";
import { detectMobileMoneyOperator, normalizeDrcPhone } from "@/lib/flexpay";

interface Location {
  address: string;
  lat: number;
  lng: number;
}

interface Suggestion {
  place_name: string;
  center: [number, number];
}

function useDebounce(value: string, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const Steps = ({ current }: { current: number }) => (
  <div className="flex items-center gap-3 mb-6">
    {[1, 2, 3].map((n) => (
      <div key={n} className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
          current === n ? "bg-primary text-black" : current > n ? "bg-primary/20 text-primary border border-primary/30" : "bg-secondary text-muted-foreground border border-border"
        }`}>
          {current > n ? <CheckCircle2 className="w-4 h-4" /> : n}
        </div>
        {n < 3 && <div className={`w-8 h-px ${current > n ? "bg-primary" : "bg-border"}`} />}
      </div>
    ))}
  </div>
);

const Orders = () => {
  const { user } = useAuth();
  const { token: mapboxToken } = useMapboxToken();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<"pickup" | "dropoff" | "details">("pickup");
  const [pickup, setPickup] = useState<Location | null>(null);
  const [dropoff, setDropoff] = useState<Location | null>(null);

  /* --- Search state --- */
  const [pickupQuery, setPickupQuery] = useState("");
  const [dropoffQuery, setDropoffQuery] = useState("");
  const [pickupSuggestions, setPickupSuggestions] = useState<Suggestion[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<Suggestion[]>([]);
  const [searchingPickup, setSearchingPickup] = useState(false);
  const [searchingDropoff, setSearchingDropoff] = useState(false);

  const debouncedPickup = useDebounce(pickupQuery, 400);
  const debouncedDropoff = useDebounce(dropoffQuery, 400);

  /* --- Details --- */
  const [packageType, setPackageType] = useState("");
  const [packageOther, setPackageOther] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "kpay">("cash");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [lengthCm, setLengthCm] = useState("");
  const [widthCm, setWidthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [declaredValue, setDeclaredValue] = useState("");
  const [fragile, setFragile] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const distance = pickup && dropoff ? haversineKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng) : 0;
  const price = distance > 0 ? computePriceFC(distance) : 0;

  /* --- Mapbox geocoding --- */
  const searchPlaces = useCallback(async (query: string, setter: (s: Suggestion[]) => void, setLoading: (b: boolean) => void) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const hits = await searchKinshasa(query, mapboxToken);
      setter(hits.map((f) => ({ place_name: f.place_name, center: f.center })));
    } catch {
      setter([]);
    } finally {
      setLoading(false);
    }
  }, [mapboxToken]);

  useEffect(() => {
    if (step === "pickup") searchPlaces(debouncedPickup, setPickupSuggestions, setSearchingPickup);
  }, [debouncedPickup, step, searchPlaces]);

  useEffect(() => {
    if (step === "dropoff") searchPlaces(debouncedDropoff, setDropoffSuggestions, setSearchingDropoff);
  }, [debouncedDropoff, step, searchPlaces]);

  /* --- Current GPS --- */
  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      toast({ title: "Géolocalisation non supportée", variant: "destructive" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let address = "Ma position actuelle";
        try {
          address = await reverseGeocode(longitude, latitude, mapboxToken);
        } catch {
          /* ignore */
        }
        if (step === "pickup") {
          setPickup({ address, lat: latitude, lng: longitude });
          setPickupQuery(address);
          setPickupSuggestions([]);
          setStep("dropoff");
        } else {
          setDropoff({ address, lat: latitude, lng: longitude });
          setDropoffQuery(address);
          setDropoffSuggestions([]);
          setStep("details");
        }
        toast({ title: "Position détectée", description: address });
      },
      (err) => toast({ title: "Erreur GPS", description: err.message, variant: "destructive" })
    );
  }, [mapboxToken, step, toast]);

  /* --- Map click --- */
  const handleMapSelect = (coordinates: [number, number], address: string) => {
    const [lng, lat] = coordinates;
    if (step === "pickup") {
      setPickup({ address, lat, lng });
      setPickupQuery(address);
      setPickupSuggestions([]);
      setStep("dropoff");
    } else if (step === "dropoff") {
      setDropoff({ address, lat, lng });
      setDropoffQuery(address);
      setDropoffSuggestions([]);
      setStep("details");
    }
  };

  const handleSubmit = async () => {
    if (!user || !pickup || !dropoff) return;
    
    if (paymentMethod === "kpay" && !paymentPhone.trim()) {
      toast({
        title: "Numéro Mobile Money requis",
        description: "Saisissez le numéro pour le débit K-Pay.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { data: quote, error: quoteErr } = await supabase.functions.invoke("quote-order", {
      body: {
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        delivery_lat: dropoff.lat,
        delivery_lng: dropoff.lng,
        weight_kg: weightKg ? Number(weightKg) : null,
        length_cm: lengthCm ? Number(lengthCm) : null,
        width_cm: widthCm ? Number(widthCm) : null,
        height_cm: heightCm ? Number(heightCm) : null,
      },
    });
    if (quote?.blocked) {
      setLoading(false);
      toast({ title: "Hors zone ou devis refusé", description: quote?.error || "Point hors zone", variant: "destructive" });
      return;
    }
    if (quoteErr && !quote?.totalFc) {
      console.warn("quote-order indisponible, tarif local", quoteErr.message);
    }
    const total = quote?.totalFc ?? price;
    const dist = quote?.distanceKm ?? Number(distance.toFixed(2));
    const { data: me } = await supabase
      .from("users")
      .select("company_id, name, phone")
      .eq("id", user.id)
      .maybeSingle()
      .then((res) => (res.error ? { data: null } : res));

    const senderName = me?.name ?? user.user_metadata?.full_name ?? user.email ?? "Client";
    const senderPhone = me?.phone ?? user.user_metadata?.phone ?? user.email ?? "client";
    const destContact = recipientPhone.trim() || recipientName.trim() || "destinataire";
    const { data: created, error } = await supabase.from("orders").insert({
      client_id: user.id,
      pickup_address: pickup.address,
      pickup_lat: pickup.lat,
      pickup_lng: pickup.lng,
      pickup_contact: senderPhone,
      pickup_zone_id: quote?.pickupZoneId ?? null,
      delivery_address: dropoff.address,
      delivery_lat: dropoff.lat,
      delivery_lng: dropoff.lng,
      delivery_contact: destContact,
      delivery_zone_id: quote?.deliveryZoneId ?? null,
      distance: dist,
      base_price: 1500,
      total_price: total,
      package_description: (packageType === "Autre" ? packageOther : packageType) || null,
      special_instructions: notes || null,
      recipient_name: recipientName || null,
      recipient_phone: recipientPhone || null,
      sender_name: senderName,
      sender_phone: senderPhone,
      company_id: me?.company_id ?? null,
      pricing_version: quote?.version ?? null,
      weight_kg: weightKg ? Number(weightKg) : null,
      length_cm: lengthCm ? Number(lengthCm) : null,
      width_cm: widthCm ? Number(widthCm) : null,
      height_cm: heightCm ? Number(heightCm) : null,
      declared_value_fc: declaredValue ? Number(declaredValue) : null,
      fragile,
      declared_confirmed: true,
      status: "SUBMITTED",
      quote_snapshot: quote ?? null,
      payment_method: paymentMethod === "cash" ? "cash" : "kpay",
      payment_status: paymentMethod === "cash" ? "cash_on_delivery" : "pending",
    }).select("id").single();
    if (error || !created) {
      setLoading(false);
      toast({ title: "Erreur", description: error?.message, variant: "destructive" });
      return;
    }
    if (photoFile) {
      const path = `${user.id}/${created.id}/main.jpg`;
      const { error: upErr } = await supabase.storage.from("parcel-photos").upload(path, photoFile, { upsert: true, contentType: photoFile.type });
      if (!upErr) await supabase.from("parcel_photos").insert({ order_id: created.id, storage_path: path, kind: "main" });
    }
    await supabase.functions.invoke("evaluate-order", { body: { order_id: created.id } });
    if (paymentMethod === "kpay") {
      const { error: payErr } = await supabase.functions.invoke("kpay-initiate", {
        body: {
          order_id: created.id,
          msisdn: normalizeDrcPhone(paymentPhone),
          email: user.email,
          cname: recipientName || user.email,
        },
      });
      if (payErr) {
        toast({ title: "K-Pay", description: payErr.message, variant: "destructive" });
      }
    }
    setLoading(false);
    toast({
      title: "Commande créée avec succès",
      description: "Le code de remise sera envoyé uniquement au destinataire au moment de la livraison.",
    });
    navigate("/dashboard");
  };

  const markers = [] as Array<{ coordinates: [number, number]; type: "pickup" | "delivery" }>;
  if (pickup) markers.push({ coordinates: [pickup.lng, pickup.lat], type: "pickup" });
  if (dropoff) markers.push({ coordinates: [dropoff.lng, dropoff.lat], type: "delivery" });

  const stepNumber = step === "pickup" ? 1 : step === "dropoff" ? 2 : 3;

  return (
    <DashboardLayout title="Nouvelle commande" subtitle="Livraison express à Kinshasa">
      <Steps current={stepNumber} />

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Carte */}
        <Card className="lg:col-span-3 p-0 overflow-hidden h-[420px] lg:h-[600px] relative rounded-2xl border-border bg-card">
          <MapView
            onLocationSelect={step !== "details" ? handleMapSelect : undefined}
            markers={markers}
            readonly={step === "details"}
            className="absolute inset-0"
          />
          {step !== "details" && (
            <div className="absolute top-4 left-4 right-4 z-10 flex items-start gap-2">
              <div className="bg-black/80 backdrop-blur-md text-white px-4 py-3 rounded-xl text-sm font-medium border border-white/10 flex-1">
                <Navigation className="w-4 h-4 inline mr-2 text-primary" />
                {step === "pickup" ? "Cliquez sur la carte ou saisissez l'adresse de retrait" : "Cliquez sur la carte ou saisissez l'adresse de livraison"}
              </div>
            </div>
          )}
        </Card>

        {/* Panneau latéral */}
        <div className="lg:col-span-2 space-y-4">
          {/* Retrait */}
          <Card className={`p-4 border-l-4 transition-all rounded-xl ${step === "pickup" ? "border-l-primary ring-1 ring-primary/30 bg-card" : "border-l-primary/40 bg-card"} ${step !== "pickup" && !pickup ? "opacity-50" : ""}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${step === "pickup" ? "bg-primary text-black" : "bg-secondary text-primary"}`}>
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Point de retrait</p>
                <p className="text-sm font-medium truncate">{pickup?.address || "À définir"}</p>
              </div>
              {pickup && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
            </div>

            {step === "pickup" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Saisir une adresse..."
                    className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    value={pickupQuery}
                    onChange={(e) => { setPickupQuery(e.target.value); setPickup(null); }}
                  />
                  {searchingPickup && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
                </div>
                {pickupSuggestions.length > 0 && (
                  <div className="bg-secondary rounded-lg border border-border overflow-hidden">
                    {pickupSuggestions.map((s, i) => (
                      <button
                        key={i}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted transition-colors flex items-start gap-2 border-b border-border last:border-0"
                        onClick={() => {
                          setPickup({ address: s.place_name, lat: s.center[1], lng: s.center[0] });
                          setPickupQuery(s.place_name);
                          setPickupSuggestions([]);
                          setStep("dropoff");
                        }}
                      >
                        <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{s.place_name}</span>
                      </button>
                    ))}
                  </div>
                )}
                <Button variant="outline" size="sm" className="w-full border-border text-foreground hover:bg-secondary hover:text-primary" onClick={getCurrentPosition}>
                  <Crosshair className="w-4 h-4 mr-2 text-primary" />
                  Utiliser ma position actuelle
                </Button>
              </div>
            )}
          </Card>

          {/* Livraison */}
          <Card className={`p-4 border-l-4 transition-all rounded-xl ${step === "dropoff" ? "border-l-primary ring-1 ring-primary/30 bg-card" : "border-l-primary/40 bg-card"} ${!pickup ? "opacity-50 pointer-events-none" : ""}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${step === "dropoff" ? "bg-primary text-black" : "bg-secondary text-primary"}`}>
                <Package className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Point de livraison</p>
                <p className="text-sm font-medium truncate">{dropoff?.address || "À définir"}</p>
              </div>
              {dropoff && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
            </div>

            {step === "dropoff" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Saisir une adresse..."
                    className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    value={dropoffQuery}
                    onChange={(e) => { setDropoffQuery(e.target.value); setDropoff(null); }}
                  />
                  {searchingDropoff && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
                </div>
                {dropoffSuggestions.length > 0 && (
                  <div className="bg-secondary rounded-lg border border-border overflow-hidden">
                    {dropoffSuggestions.map((s, i) => (
                      <button
                        key={i}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted transition-colors flex items-start gap-2 border-b border-border last:border-0"
                        onClick={() => {
                          setDropoff({ address: s.place_name, lat: s.center[1], lng: s.center[0] });
                          setDropoffQuery(s.place_name);
                          setDropoffSuggestions([]);
                          setStep("details");
                        }}
                      >
                        <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{s.place_name}</span>
                      </button>
                    ))}
                  </div>
                )}
                <Button variant="outline" size="sm" className="w-full border-border text-foreground hover:bg-secondary hover:text-primary" onClick={getCurrentPosition}>
                  <Crosshair className="w-4 h-4 mr-2 text-primary" />
                  Utiliser ma position actuelle
                </Button>
              </div>
            )}
          </Card>

          {/* Détails */}
          {step === "details" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Distance</span>
                  </div>
                  <span className="text-sm font-bold">{distance.toFixed(1)} km</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-primary/10">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Prix estimé</span>
                  </div>
                  <span className="text-xl font-bold text-primary">{price.toLocaleString()} FC</span>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientName" className="text-muted-foreground text-xs uppercase tracking-wider">Destinataire</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="recipientName" placeholder="Jean Dupont" className="pl-9 bg-secondary border-border" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipientPhone" className="text-muted-foreground text-xs uppercase tracking-wider">Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="recipientPhone" placeholder="+243..." className="pl-9 bg-secondary border-border" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Type de colis</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["Documents", "Nourriture", "Vêtements", "Électronique", "Médicaments", "Autre"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPackageType(t)}
                      className={`rounded-xl border px-3 py-2 text-sm text-left ${
                        packageType === t ? "border-primary bg-primary/15 text-primary" : "border-white/10 bg-white/5 text-white/70"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {packageType === "Autre" && (
                  <Input placeholder="Précisez le type…" value={packageOther} onChange={(e) => setPackageOther(e.target.value)} className="bg-white/5 border-white/10" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Poids kg" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className="bg-white/5 border-white/10" />
                <Input placeholder="Valeur FC" value={declaredValue} onChange={(e) => setDeclaredValue(e.target.value)} className="bg-white/5 border-white/10" />
                <Input placeholder="Longueur cm" value={lengthCm} onChange={(e) => setLengthCm(e.target.value)} className="bg-white/5 border-white/10" />
                <Input placeholder="Largeur cm" value={widthCm} onChange={(e) => setWidthCm(e.target.value)} className="bg-white/5 border-white/10" />
                <Input placeholder="Hauteur cm" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="bg-white/5 border-white/10" />
                <label className="text-sm flex items-center gap-2 text-white/70"><input type="checkbox" checked={fragile} onChange={(e) => setFragile(e.target.checked)} /> Fragile</label>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Photo du colis</Label>
                <p className="text-[11px] text-white/40">Prenez une photo (caméra) ou importez un fichier. Stockage privé.</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-xs cursor-pointer hover:border-primary/40">
                    Capturer
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setPhotoFile(f);
                        setPhotoPreview(f ? URL.createObjectURL(f) : null);
                      }}
                    />
                  </label>
                  <label className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-xs cursor-pointer hover:border-primary/40">
                    Importer
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setPhotoFile(f);
                        setPhotoPreview(f ? URL.createObjectURL(f) : null);
                      }}
                    />
                  </label>
                </div>
                {photoPreview && <img src={photoPreview} alt="Colis" className="h-28 w-full object-cover rounded-xl border border-white/10" />}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-muted-foreground text-xs uppercase tracking-wider">Instructions (optionnel)</Label>
                <Textarea id="notes" placeholder="Code d'accès, étage, précisions..." rows={2} className="bg-secondary border-border" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              {/* Mode de paiement */}
              <div className="space-y-3 pt-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Mode de paiement</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      paymentMethod === "cash"
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-border bg-secondary hover:border-primary/20"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <Banknote className={`w-5 h-5 ${paymentMethod === "cash" ? "text-primary" : "text-muted-foreground"}`} />
                      {paymentMethod === "cash" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Cash à la livraison</p>
                      <p className="text-[11px] text-muted-foreground">Paiement au livreur à l'arrivée</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("kpay")}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      paymentMethod === "kpay"
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-border bg-secondary hover:border-primary/20"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <Smartphone className={`w-5 h-5 ${paymentMethod === "kpay" ? "text-primary" : "text-muted-foreground"}`} />
                      {paymentMethod === "kpay" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Mobile Money</p>
                      <p className="text-[11px] text-muted-foreground">K-Pay (M-Pesa, Orange, Airtel)</p>
                    </div>
                  </button>
                </div>

                {paymentMethod === "kpay" && (
                  <div className="p-3 bg-secondary/80 border border-primary/20 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="paymentPhone" className="text-xs text-muted-foreground">Numéro pour le débit Mobile Money</Label>
                      {paymentPhone && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${detectMobileMoneyOperator(paymentPhone).badgeBg} ${detectMobileMoneyOperator(paymentPhone).textColor}`}>
                          {detectMobileMoneyOperator(paymentPhone).name}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="paymentPhone"
                        placeholder="081XXXXXXX ou 085XXXXXXX..."
                        className="pl-9 bg-background border-border text-foreground"
                        value={paymentPhone}
                        onChange={(e) => setPaymentPhone(e.target.value)}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Un prompt USSD sera envoyé sur ce numéro pour valider le paiement de {price.toLocaleString()} FC.
                    </p>
                  </div>
                )}
              </div>

              {/* Notice sécurité OTP */}
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground font-medium">Sécurité livraison :</strong> Un code de remise sera envoyé uniquement au destinataire par WhatsApp, au moment de la livraison.
                </p>
              </div>

              <Button size="lg" className="w-full font-bold tracking-wide shadow-yellow" onClick={handleSubmit} disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ArrowRight className="w-5 h-5 mr-2" />}
                {loading ? "Création en cours..." : "CONFIRMER LA COMMANDE"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Orders;
