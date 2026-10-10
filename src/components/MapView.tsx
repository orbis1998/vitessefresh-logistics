import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { Loader2 } from "lucide-react";
import {
  addVitaBuildings,
  bindMapToken,
  ESRI_STREETS,
  isLngLat,
  KINSHASA,
  reverseGeocode,
  VITA_BASEMAP,
  useVitaMapStyle,
} from "@/lib/vita-map";

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  pitch?: number;
  markers?: Array<{
    coordinates: [number, number];
    popup?: string;
    type?: "pickup" | "delivery" | "driver" | "parcel" | "drop";
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

const pinClass = (kind: string) => {
  if (kind === "pickup") return "vita-pin vita-pin--pickup";
  if (kind === "delivery" || kind === "drop") return "vita-pin vita-pin--drop";
  if (kind === "parcel") return "vita-pin vita-pin--parcel";
  return "vita-pin vita-pin--driver";
};

const MapView = ({
  center = KINSHASA,
  zoom = 13.2,
  pitch = 52,
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
  const [invert, setInvert] = useState(false);

  useEffect(() => {
    const node = mapContainer.current;
    if (!node || map.current) return;
    bindMapToken(token);
    let fellBack = false;
    const instance = new mapboxgl.Map({
      container: node,
      style: VITA_BASEMAP,
      center: isLngLat(center) ? center : KINSHASA,
      zoom,
      pitch,
      bearing: 22,
      antialias: true,
      attributionControl: false,
      failIfMajorPerformanceCaveat: false,
    });
    instance.addControl(new mapboxgl.NavigationControl({ showCompass: false, visualizePitch: true }), "top-right");
    const kick = () => {
      if (node.clientWidth > 0 && node.clientHeight > 0) instance.resize();
    };
    const onReady = () => {
      kick();
      addVitaBuildings(instance);
      setReady(true);
    };
    instance.on("load", onReady);
    instance.on("style.load", () => addVitaBuildings(instance));
    instance.on("error", () => {
      if (fellBack) {
        setReady(true);
        return;
      }
      fellBack = true;
      setInvert(true);
      instance.setStyle(ESRI_STREETS);
    });
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
      el.className = pinClass(kind);
      el.innerHTML = `<i></i><em>${popup || ""}</em>`;
      const mk = new mapboxgl.Marker({ element: el, anchor: "bottom" }).setLngLat(lngLat);
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
        instance.fitBounds(b, { padding: 72, maxZoom: 15, duration: 500, pitch, bearing: 18 });
      } catch {
        /* ignore */
      }
    } else if (pts.length === 1) {
      instance.easeTo({ center: pts[0], zoom: 14.2, pitch, duration: 400 });
    }
  }, [markers, showDriverLocation, driverLocation, ready, pitch]);

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
        paint: { "line-color": "#FFC400", "line-width": 5, "line-opacity": 0.92 },
      });
    };
    if (instance.isStyleLoaded()) draw();
    else instance.once("load", draw);
  }, [route, ready]);

  return (
    <div className={`relative w-full min-h-[280px] h-full vita-map ${invert ? "vita-map--invert" : ""} ${className}`}>
      <div ref={mapContainer} className="absolute inset-0 overflow-hidden bg-[#0b0c0e]" />
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0b0c0e]/70">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
      {estimatedTime ? (
        <div className="absolute bottom-3 right-3 z-10 rounded-full bg-[#0b0c0e]/90 px-3 py-1.5 text-xs font-medium">
          ~ {estimatedTime} min
        </div>
      ) : null}
    </div>
  );
};

export default MapView;
