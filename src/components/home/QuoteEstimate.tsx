import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2, LocateFixed } from "lucide-react";
import mapboxgl from "mapbox-gl";
import { Button } from "@/components/ui/button";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { useAuth } from "@/hooks/useAuth";
import { computePriceFC, estimateMinutes, formatFC, haversineKm } from "@/lib/distance";

interface Place {
  address: string;
  lat: number;
  lng: number;
}

interface Suggestion {
  place_name: string;
  center: [number, number];
}

const KINSHASA_BBOX = "15.1,-4.5,15.5,-4.2";

const PACKAGES = [
  { id: "document", label: "Document" },
  { id: "vetement", label: "Vêtements" },
  { id: "accessoire", label: "Accessoires" },
  { id: "aliment", label: "Alimentaire" },
  { id: "restaurant", label: "Restaurant" },
  { id: "colis", label: "Colis" },
] as const;

const WEIGHTS = [
  { id: "leger", label: "< 2 kg" },
  { id: "moyen", label: "2–10 kg" },
  { id: "lourd", label: "> 10 kg" },
] as const;

const QuoteEstimate = () => {
  const { token } = useMapboxToken();
  const { user } = useAuth();

  const [pickupQuery, setPickupQuery] = useState("");
  const [dropoffQuery, setDropoffQuery] = useState("");
  const [pickup, setPickup] = useState<Place | null>(null);
  const [dropoff, setDropoff] = useState<Place | null>(null);
  const [pickupHits, setPickupHits] = useState<Suggestion[]>([]);
  const [dropoffHits, setDropoffHits] = useState<Suggestion[]>([]);
  const [loadingPickup, setLoadingPickup] = useState(false);
  const [loadingDropoff, setLoadingDropoff] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [pkg, setPkg] = useState<(typeof PACKAGES)[number]["id"]>("colis");
  const [weight, setWeight] = useState<(typeof WEIGHTS)[number]["id"]>("moyen");
  const pickupBox = useRef<HTMLDivElement>(null);
  const dropoffBox = useRef<HTMLDivElement>(null);

  const search = useCallback(
    async (query: string, setter: (s: Suggestion[]) => void, busy: (b: boolean) => void) => {
      if (!token || query.trim().length < 3) {
        setter([]);
        return;
      }
      busy(true);
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&language=fr&country=cd&limit=5&bbox=${KINSHASA_BBOX}`
        );
        const data = await res.json();
        setter(
          data.features?.map((f: { place_name: string; center: [number, number] }) => ({
            place_name: f.place_name,
            center: f.center,
          })) ?? []
        );
      } catch {
        setter([]);
      } finally {
        busy(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (pickup?.address === pickupQuery) {
      setPickupHits([]);
      return;
    }
    const id = window.setTimeout(() => search(pickupQuery, setPickupHits, setLoadingPickup), 380);
    return () => window.clearTimeout(id);
  }, [pickupQuery, pickup, search]);

  useEffect(() => {
    if (dropoff?.address === dropoffQuery) {
      setDropoffHits([]);
      return;
    }
    const id = window.setTimeout(() => search(dropoffQuery, setDropoffHits, setLoadingDropoff), 380);
    return () => window.clearTimeout(id);
  }, [dropoffQuery, dropoff, search]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (pickupBox.current && !pickupBox.current.contains(e.target as Node)) setPickupHits([]);
      if (dropoffBox.current && !dropoffBox.current.contains(e.target as Node)) setDropoffHits([]);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const reverse = useCallback(
    async (lng: number, lat: number) => {
      if (!token) return "Position choisie";
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&language=fr&limit=1`
        );
        const data = await res.json();
        return data.features?.[0]?.place_name || "Position choisie";
      } catch {
        return "Position choisie";
      }
    },
    [token]
  );

  const useMyLocation = async () => {
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n’est pas disponible sur cet appareil.");
      return;
    }
    setGeoError("");
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const address = await reverse(longitude, latitude);
        setPickup({ address, lat: latitude, lng: longitude });
        setPickupQuery(address);
        setPickupHits([]);
        setGeoLoading(false);
      },
      () => {
        setGeoError("Impossible de lire la position. Autorisez la localisation, ou tapez l’adresse.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const setDropFromMap = useCallback(
    async (lng: number, lat: number) => {
      const address = await reverse(lng, lat);
      setDropoff({ address, lat, lng });
      setDropoffQuery(address);
      setDropoffHits([]);
    },
    [reverse]
  );

  const distance = pickup && dropoff ? haversineKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng) : 0;
  const extra = weight === "lourd" ? 800 : pkg === "restaurant" || pkg === "aliment" ? 200 : 0;
  const price = distance > 0 ? computePriceFC(distance) + extra : 0;
  const minutes = distance > 0 ? estimateMinutes(distance) : 0;
  const next = user ? "/dashboard/order" : "/auth/register";

  const pick = (kind: "pickup" | "dropoff", hit: Suggestion) => {
    const place = { address: hit.place_name, lng: hit.center[0], lat: hit.center[1] };
    if (kind === "pickup") {
      setPickup(place);
      setPickupQuery(hit.place_name);
      setPickupHits([]);
    } else {
      setDropoff(place);
      setDropoffQuery(hit.place_name);
      setDropoffHits([]);
    }
  };

  return (
    <section className="relative z-20 mt-12 sm:mt-16 lg:mt-20 px-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[1.35rem] border border-white/10 bg-[#161616] p-1.5 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div className="rounded-[1.1rem] bg-[#111] px-4 py-5 sm:px-7 sm:py-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-primary font-medium">Estimer une course</p>
            <h2 className="mt-2 font-heading text-xl sm:text-2xl font-semibold text-white">
              Ramassage, livraison, prix affiché.
            </h2>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div>
                <Field
                  boxRef={pickupBox}
                  label="Point de ramassage"
                  value={pickupQuery}
                  loading={loadingPickup}
                  hits={pickupHits}
                  placeholder="Gombe, Limete, Ngaliema…"
                  onChange={(v) => {
                    setPickupQuery(v);
                    setPickup(null);
                  }}
                  onPick={(hit) => pick("pickup", hit)}
                />
                <button
                  type="button"
                  onClick={useMyLocation}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80"
                >
                  {geoLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
                  Utiliser ma position
                </button>
                {geoError && <p className="mt-1 text-xs text-red-400">{geoError}</p>}

                <div className="mt-4">
                  <Field
                    boxRef={dropoffBox}
                    label="Point de livraison"
                    value={dropoffQuery}
                    loading={loadingDropoff}
                    hits={dropoffHits}
                    placeholder="Adresse, ou cliquez la carte →"
                    onChange={(v) => {
                      setDropoffQuery(v);
                      setDropoff(null);
                    }}
                    onPick={(hit) => pick("dropoff", hit)}
                  />
                  <p className="mt-2 text-xs text-white/40">Ou cliquez sur la carte pour poser le point exact.</p>
                </div>

                <p className="mt-5 text-[11px] uppercase tracking-wider text-white/40">Type de colis</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PACKAGES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPkg(item.id)}
                      className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                        pkg === item.id ? "bg-primary text-black" : "bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <p className="mt-4 text-[11px] uppercase tracking-wider text-white/40">Poids</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {WEIGHTS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setWeight(item.id)}
                      className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                        weight === item.id ? "bg-white text-black" : "bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <QuoteMap token={token} pickup={pickup} dropoff={dropoff} onPickDropoff={setDropFromMap} />
                <div className="mt-3 flex items-stretch gap-3">
                  <div className="min-w-[8.5rem] flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-wider text-white/40">Prix estimé</p>
                    <p className="mt-1 font-heading text-lg font-bold text-primary">{price ? formatFC(price) : "—"}</p>
                    <p className="mt-0.5 text-xs text-white/45">
                      {price ? `${distance.toFixed(1)} km · ~${minutes} min` : "Deux points sur la carte"}
                    </p>
                  </div>
                  {price ? (
                    <Button asChild variant="hero" size="xl" className="hidden h-auto sm:inline-flex">
                      <Link to={next}>
                        Commander
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="hero" size="xl" className="hidden sm:inline-flex" disabled>
                      Commander
                    </Button>
                  )}
                </div>
                {price ? (
                  <Button asChild variant="hero" size="xl" className="mt-3 w-full sm:hidden">
                    <Link to={next}>
                      Commander à ce tarif
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button variant="hero" size="xl" className="mt-3 w-full sm:hidden" disabled>
                    Commander à ce tarif
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const QuoteMap = ({
  token,
  pickup,
  dropoff,
  onPickDropoff,
}: {
  token: string | null;
  pickup: Place | null;
  dropoff: Place | null;
  onPickDropoff: (lng: number, lat: number) => void;
}) => {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const pickupMk = useRef<mapboxgl.Marker | null>(null);
  const dropMk = useRef<mapboxgl.Marker | null>(null);
  const onPick = useRef(onPickDropoff);
  onPick.current = onPickDropoff;

  useEffect(() => {
    if (!el.current || !token) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: el.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [15.3078, -4.3195],
      zoom: 12.2,
      attributionControl: false,
    });
    mapRef.current = map;
    map.on("click", (e) => onPick.current(e.lngLat.lng, e.lngLat.lat));
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      pickupMk.current?.remove();
      dropMk.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    pickupMk.current?.remove();
    pickupMk.current = pickup
      ? new mapboxgl.Marker({ color: "#FFC400" }).setLngLat([pickup.lng, pickup.lat]).addTo(map)
      : null;
    dropMk.current?.remove();
    dropMk.current = dropoff
      ? new mapboxgl.Marker({ color: "#ffffff" }).setLngLat([dropoff.lng, dropoff.lat]).addTo(map)
      : null;
    if (pickup && dropoff) {
      const b = new mapboxgl.LngLatBounds([pickup.lng, pickup.lat], [dropoff.lng, dropoff.lat]);
      map.fitBounds(b, { padding: 48, maxZoom: 14, duration: 500 });
    } else if (dropoff) map.easeTo({ center: [dropoff.lng, dropoff.lat], zoom: 14, duration: 400 });
    else if (pickup) map.easeTo({ center: [pickup.lng, pickup.lat], zoom: 14, duration: 400 });
  }, [pickup, dropoff]);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <div ref={el} className="h-56 w-full sm:h-72" />
      <p className="bg-[#161616] px-3 py-2 text-[11px] text-white/40">Cliquez la carte pour le point de livraison.</p>
    </div>
  );
};

const Field = ({
  boxRef,
  label,
  value,
  loading,
  hits,
  placeholder,
  onChange,
  onPick,
}: {
  boxRef: RefObject<HTMLDivElement>;
  label: string;
  value: string;
  loading: boolean;
  hits: Suggestion[];
  placeholder: string;
  onChange: (v: string) => void;
  onPick: (hit: Suggestion) => void;
}) => (
  <div ref={boxRef} className="relative">
    <label className="text-[11px] uppercase tracking-wider text-white/40">{label}</label>
    <div className="relative mt-1.5">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 pr-9 text-sm text-white placeholder:text-white/30 outline-none transition-colors duration-300 ease-vita focus:border-primary/60"
      />
      {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-white/40" />}
    </div>
    {hits.length > 0 && (
      <ul className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a] py-1 shadow-xl">
        {hits.map((hit) => (
          <li key={hit.place_name + hit.center.join()}>
            <button
              type="button"
              className="w-full px-3.5 py-2.5 text-left text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white"
              onClick={() => onPick(hit)}
            >
              {hit.place_name}
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default QuoteEstimate;
