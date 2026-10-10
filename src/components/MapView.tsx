import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { Loader2 } from "lucide-react";
import { bindMapToken, isLngLat, KINSHASA, reverseGeocode, VITA_BASEMAP, useVitaMapStyle } from "@/lib/vita-map";

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    coordinates: [number, number];
    popup?: string;
    type?: "pickup" | "delivery" | "driver";
  }>;
  showDriverLocation?: boolean;
  driverLocation?: [number, number];
  route?: Array<[number, number]>;
  estimatedTime?: number;
  onLocationSelect?: (coordinates: [number, number], address: string) => void;
  readonly?: boolean;
  className?: string;
  loading?: boolean;
}

const MapView = ({
  center = KINSHASA,
  zoom = 12,
  markers = [],
  showDriverLocation = false,
  driverLocation,
  route = [],
  estimatedTime,
  onLocationSelect,
  readonly = false,
  className = "",
  loading = false,
}: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerObjs = useRef<mapboxgl.Marker[]>([]);
  const onSelectRef = useRef(onLocationSelect);
  onSelectRef.current = onLocationSelect;
  const { token } = useVitaMapStyle();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = mapContainer.current;
    if (!node || map.current) return;
    bindMapToken(token);
    const instance = new mapboxgl.Map({
      container: node,
      style: VITA_BASEMAP,
      center: isLngLat(center) ? center : KINSHASA,
      zoom,
      attributionControl: false,
      failIfMajorPerformanceCaveat: false,
    });
    instance.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    const kick = () => {
      if (node.clientWidth > 0 && node.clientHeight > 0) instance.resize();
    };
    instance.on("load", () => {
      kick();
      setReady(true);
    });
    instance.on("error", () => setReady(true));
    instance.on("click", async (e) => {
      const select = onSelectRef.current;
      if (!select || readonly) return;
      const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      select(coordinates, await reverseGeocode(coordinates[0], coordinates[1], token));
    });
    const ro = new ResizeObserver(kick);
    ro.observe(node);
    const timers = [50, 250, 800].map((ms) => window.setTimeout(kick, ms));
    map.current = instance;
    return () => {
      timers.forEach(clearTimeout);
      ro.disconnect();
      markerObjs.current.forEach((m) => m.remove());
      instance.remove();
      map.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readonly]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    markerObjs.current.forEach((m) => m.remove());
    markerObjs.current = [];
    const add = (lngLat: [number, number], kind: string, popup?: string) => {
      if (!isLngLat(lngLat)) return;
      const el = document.createElement("div");
      el.className =
        kind === "pickup" ? "ops-pin ops-pin--pickup" : kind === "delivery" || kind === "drop" ? "ops-pin ops-pin--drop" : "ops-pin ops-pin--driver";
      const mk = new mapboxgl.Marker({ element: el }).setLngLat(lngLat);
      if (popup) mk.setPopup(new mapboxgl.Popup({ offset: 12 }).setText(popup));
      mk.addTo(instance);
      markerObjs.current.push(mk);
    };
    markers.forEach((m) => add(m.coordinates, m.type || "driver", m.popup));
    if (showDriverLocation && driverLocation) add(driverLocation, "driver", "Livreur");
    const pts = [
      ...markers.map((m) => m.coordinates).filter(isLngLat),
      ...(driverLocation && isLngLat(driverLocation) ? [driverLocation] : []),
    ];
    if (pts.length >= 2) {
      const b = new mapboxgl.LngLatBounds(pts[0], pts[0]);
      pts.forEach((p) => b.extend(p));
      try {
        instance.fitBounds(b, { padding: 56, maxZoom: 14, duration: 400 });
      } catch {
        /* ignore */
      }
    } else if (pts.length === 1) {
      instance.easeTo({ center: pts[0], zoom: 13.4, duration: 350 });
    }
  }, [markers, showDriverLocation, driverLocation, ready]);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !route || route.length < 2) return;
    const draw = () => {
      if (instance.getLayer("route")) instance.removeLayer("route");
      if (instance.getSource("route")) instance.removeSource("route");
      instance.addSource("route", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: route } },
      });
      instance.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#FFC400", "line-width": 4, "line-opacity": 0.85 },
      });
    };
    if (instance.isStyleLoaded()) draw();
    else instance.once("load", draw);
  }, [route, ready]);

  return (
    <div className={`relative w-full min-h-[240px] h-full vita-map ${className}`}>
      <div ref={mapContainer} className="absolute inset-0 rounded-xl overflow-hidden bg-[#121212]" />
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0c0c0c]/70 rounded-xl">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
      {estimatedTime ? (
        <div className="absolute bottom-3 left-3 z-10 rounded-full bg-black/80 border border-white/10 px-3 py-1.5 text-xs">
          Arrivée ~ {estimatedTime} min
        </div>
      ) : null}
    </div>
  );
};

export default MapView;
