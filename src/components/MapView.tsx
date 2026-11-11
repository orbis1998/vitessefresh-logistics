import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { Loader2 } from "lucide-react";
import {
  addVitaBuildings,
  applyVitaAtmosphere,
  bindMapToken,
  CARTO_DARK,
  ESRI_STREETS,
  isLngLat,
  KINSHASA,
  MAPBOX_DARK,
  offsetLngLat,
  reverseGeocode,
  useVitaMapStyle,
  VITA_MAP_4D,
} from "@/lib/vita-map";

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  pitch?: number;
  bearing?: number;
  markers?: Array<{
    coordinates: [number, number];
    popup?: string;
    type?: "pickup" | "delivery" | "driver" | "parcel" | "drop";
    heading?: number | null;
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
  zoom = VITA_MAP_4D.zoom,
  pitch = VITA_MAP_4D.pitch,
  bearing = VITA_MAP_4D.bearing,
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
  const dashTimer = useRef<number | null>(null);
  const { token, loading: tokenLoading } = useVitaMapStyle();
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState(false);
  const [isVector, setIsVector] = useState(false);

  useEffect(() => {
    if (tokenLoading) return;
    const node = mapContainer.current;
    if (!node || map.current) return;

    let cancelled = false;
    let fellBack = 0;
    const timers: number[] = [];

    const start = () => {
      if (cancelled || map.current) return;
      if (node.clientWidth < 2 || node.clientHeight < 2) {
        timers.push(window.setTimeout(start, 120));
        return;
      }

      bindMapToken(token);
      const preferMapbox = Boolean(token?.startsWith("pk."));
      setIsVector(preferMapbox);
      const viewPitch = preferMapbox ? pitch : Math.min(pitch, 42);
      const viewBearing = preferMapbox ? bearing : Math.min(Math.abs(bearing), 12);

      const instance = new mapboxgl.Map({
        container: node,
        style: preferMapbox ? MAPBOX_DARK : CARTO_DARK,
        center: isLngLat(center) ? center : KINSHASA,
        zoom,
        pitch: viewPitch,
        bearing: viewBearing,
        antialias: true,
        attributionControl: false,
        failIfMajorPerformanceCaveat: false,
      });

      instance.addControl(
        new mapboxgl.NavigationControl({ showCompass: true, visualizePitch: true }),
        "top-right",
      );

      const kick = () => {
        if (node.clientWidth > 0 && node.clientHeight > 0) instance.resize();
      };

      const enhance = () => {
        kick();
        addVitaBuildings(instance);
        applyVitaAtmosphere(instance, preferMapbox);
        setReady(true);
        setBootError(false);
      };

      instance.on("load", enhance);
      instance.on("style.load", () => {
        addVitaBuildings(instance);
        applyVitaAtmosphere(instance, fellBack === 0 && preferMapbox);
      });
      instance.on("error", (event) => {
        const message = String((event as { error?: { message?: string } }).error?.message || "");
        const tileDenied = /403|401|forbidden|unauthorized|not authorized/i.test(message);
        if (fellBack >= 2) {
          setBootError(true);
          setReady(true);
          return;
        }
        if (fellBack === 0 && (preferMapbox || tileDenied)) {
          fellBack = 1;
          setIsVector(false);
          instance.setStyle(CARTO_DARK);
          return;
        }
        fellBack = 2;
        setIsVector(false);
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
      timers.push(...[50, 250, 800, 1600].map((ms) => window.setTimeout(kick, ms)));
      map.current = instance;
      (map.current as mapboxgl.Map & { __ro?: ResizeObserver }).__ro = ro;
    };

    start();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      if (dashTimer.current) window.clearInterval(dashTimer.current);
      const instance = map.current;
      if (instance) {
        const ro = (instance as mapboxgl.Map & { __ro?: ResizeObserver }).__ro;
        ro?.disconnect();
        markerObjs.current.forEach((m) => m.remove());
        instance.remove();
        map.current = null;
      }
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readonly, tokenLoading, token]);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;
    markerObjs.current.forEach((m) => m.remove());
    markerObjs.current = [];

    const used = new Map<string, number>();
    const place = (lngLat: [number, number], kind: string) => {
      const key = `${lngLat[0].toFixed(5)},${lngLat[1].toFixed(5)}`;
      const n = used.get(key) || 0;
      used.set(key, n + 1);
      if (n === 0) return lngLat;
      if (kind === "parcel") return offsetLngLat(lngLat, 18, 14);
      if (kind === "driver") return offsetLngLat(lngLat, -12, 10);
      return offsetLngLat(lngLat, n * 14, n * 8);
    };

    const add = (lngLat: [number, number], kind: string, popup?: string, heading?: number | null) => {
      if (!isLngLat(lngLat)) return;
      const el = document.createElement("div");
      el.className = pinClass(kind);
      const live = kind === "driver" ? `<span class="vita-pin__pulse"></span>` : "";
      const arrow =
        kind === "driver" && typeof heading === "number" && Number.isFinite(heading)
          ? `<b class="vita-pin__heading" style="transform:rotate(${heading}deg)"></b>`
          : "";
      el.innerHTML = `${live}<i></i>${arrow}<em>${popup || ""}</em>`;
      const mk = new mapboxgl.Marker({ element: el, anchor: "bottom", rotationAlignment: "map", pitchAlignment: "viewport" })
        .setLngLat(place(lngLat, kind));
      mk.addTo(instance);
      markerObjs.current.push(mk);
    };

    markers.forEach((m) => add(m.coordinates, m.type || "driver", m.popup, m.heading));
    if (showDriverLocation && driverLocation) add(driverLocation, "driver", "Livreur");

    const pts = [
      ...markers.map((m) => m.coordinates).filter(isLngLat),
      ...(driverLocation && isLngLat(driverLocation) ? [driverLocation] : []),
    ];
    const viewPitch = isVector ? pitch : Math.min(pitch, 42);
    const viewBearing = isVector ? bearing : Math.min(Math.abs(bearing), 12);
    if (pts.length >= 2) {
      const b = new mapboxgl.LngLatBounds(pts[0], pts[0]);
      pts.forEach((p) => b.extend(p));
      try {
        instance.fitBounds(b, {
          padding: { top: 72, bottom: 220, left: 48, right: 48 },
          maxZoom: 15.4,
          duration: 700,
          pitch: viewPitch,
          bearing: viewBearing,
        });
      } catch {
        /* ignore */
      }
    } else if (pts.length === 1) {
      instance.easeTo({ center: pts[0], zoom: 14.6, pitch: viewPitch, bearing: viewBearing, duration: 500 });
    }
  }, [markers, showDriverLocation, driverLocation, ready, pitch, bearing, isVector]);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;
    if (dashTimer.current) {
      window.clearInterval(dashTimer.current);
      dashTimer.current = null;
    }

    const clearRoute = () => {
      if (instance.getLayer("route-glow")) instance.removeLayer("route-glow");
      if (instance.getLayer("route-flow")) instance.removeLayer("route-flow");
      if (instance.getLayer("route")) instance.removeLayer("route");
      if (instance.getSource("route")) instance.removeSource("route");
    };

    if (!route || route.length < 2) {
      clearRoute();
      return;
    }

    const draw = () => {
      clearRoute();
      instance.addSource("route", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: route } },
        lineMetrics: true,
      });
      instance.addLayer({
        id: "route-glow",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#FFC400", "line-width": 10, "line-opacity": 0.18 },
      });
      instance.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#FFC400", "line-width": 4.5, "line-opacity": 0.92 },
      });
      instance.addLayer({
        id: "route-flow",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#fff6c2",
          "line-width": 2.2,
          "line-opacity": 0.95,
          "line-dasharray": [0, 2, 1.5],
        },
      });

      let step = 0;
      dashTimer.current = window.setInterval(() => {
        if (!instance.getLayer("route-flow")) return;
        step = (step + 1) % 24;
        const t = step / 24;
        try {
          instance.setPaintProperty("route-flow", "line-dasharray", [0, 1.2 + t, 1.4, 2.2 - t]);
        } catch {
          /* style swap */
        }
      }, 70);
    };

    if (instance.isStyleLoaded()) draw();
    else instance.once("load", draw);

    return () => {
      if (dashTimer.current) {
        window.clearInterval(dashTimer.current);
        dashTimer.current = null;
      }
    };
  }, [route, ready]);

  return (
    <div className={`relative w-full min-h-[280px] h-full vita-map ${className}`}>
      <div ref={mapContainer} className="absolute inset-0 overflow-hidden bg-[#0b0c0e]" />
      {(loading || tokenLoading || !ready) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0b0c0e]/70">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
      {bootError && ready ? (
        <div className="absolute left-3 bottom-3 z-10 rounded-lg bg-black/70 px-3 py-2 text-xs text-white/70">
          Carte limitée — vérifiez le jeton Mapbox (tuiles 403).
        </div>
      ) : null}
      {estimatedTime ? (
        <div className="absolute bottom-3 right-3 z-10 rounded-full bg-[#0b0c0e]/90 px-3 py-1.5 text-xs font-medium">
          ~ {estimatedTime} min
        </div>
      ) : null}
    </div>
  );
};

export default MapView;
