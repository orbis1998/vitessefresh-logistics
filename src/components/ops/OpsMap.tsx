import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import {
  addVitaBuildings,
  applyVitaAtmosphere,
  bindMapToken,
  CARTO_DARK,
  ESRI_STREETS,
  isLngLat,
  MAPBOX_DARK,
  offsetLngLat,
  useVitaMapStyle,
  VITA_MAP_4D,
} from "@/lib/vita-map";

export type OpsMarker = {
  id: string;
  lng: number;
  lat: number;
  kind: "driver" | "pickup" | "drop" | "parcel";
  label?: string;
  heading?: number | null;
};

const pinClass = (kind: OpsMarker["kind"]) => {
  if (kind === "pickup") return "vita-pin vita-pin--pickup";
  if (kind === "drop") return "vita-pin vita-pin--drop";
  if (kind === "parcel") return "vita-pin vita-pin--parcel";
  return "vita-pin vita-pin--driver";
};

const OpsMap = ({
  markers,
  className = "h-[420px]",
  pitch = VITA_MAP_4D.pitch,
  bearing = VITA_MAP_4D.bearing,
  route,
}: {
  markers: OpsMarker[];
  className?: string;
  pitch?: number;
  bearing?: number;
  route?: Array<[number, number]>;
}) => {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const marks = useRef<mapboxgl.Marker[]>([]);
  const dashTimer = useRef<number | null>(null);
  const { token, loading } = useVitaMapStyle();
  const vectorRef = useRef(false);

  useEffect(() => {
    if (loading) return;
    const node = el.current;
    if (!node || mapRef.current) return;

    let fellBack = 0;
    bindMapToken(token);
    const preferMapbox = Boolean(token?.startsWith("pk."));
    vectorRef.current = preferMapbox;
    const map = new mapboxgl.Map({
      container: node,
      style: preferMapbox ? MAPBOX_DARK : CARTO_DARK,
      center: [15.3078, -4.3195],
      zoom: 12.4,
      pitch: preferMapbox ? pitch : Math.min(pitch, 42),
      bearing: preferMapbox ? bearing : 0,
      attributionControl: false,
      antialias: true,
      failIfMajorPerformanceCaveat: false,
    });
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
    mapRef.current = map;
    const kick = () => map.resize();
    const enhance = () => {
      kick();
      addVitaBuildings(map);
      applyVitaAtmosphere(map, preferMapbox && fellBack === 0);
    };
    map.on("load", enhance);
    map.on("style.load", () => {
      addVitaBuildings(map);
      applyVitaAtmosphere(map, preferMapbox && fellBack === 0);
    });
    map.on("error", () => {
      if (fellBack === 0) {
        fellBack = 1;
        vectorRef.current = false;
        map.setStyle(CARTO_DARK);
        return;
      }
      if (fellBack === 1) {
        fellBack = 2;
        vectorRef.current = false;
        map.setStyle(ESRI_STREETS);
      }
    });
    const ro = new ResizeObserver(kick);
    ro.observe(node);
    const timers = [80, 250, 800].map((ms) => window.setTimeout(kick, ms));
    return () => {
      timers.forEach(clearTimeout);
      if (dashTimer.current) window.clearInterval(dashTimer.current);
      ro.disconnect();
      marks.current.forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, [loading, token, pitch, bearing]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    marks.current.forEach((m) => m.remove());
    const valid = markers.filter((mk) => isLngLat([mk.lng, mk.lat]));
    const used = new Map<string, number>();
    marks.current = valid.map((mk) => {
      const key = `${Number(mk.lng).toFixed(5)},${Number(mk.lat).toFixed(5)}`;
      const n = used.get(key) || 0;
      used.set(key, n + 1);
      let lngLat: [number, number] = [mk.lng, mk.lat];
      if (n > 0) lngLat = offsetLngLat(lngLat, mk.kind === "parcel" ? 18 : -12, mk.kind === "parcel" ? 14 : 10);

      const node = document.createElement("div");
      node.className = pinClass(mk.kind);
      const live = mk.kind === "driver" ? `<span class="vita-pin__pulse"></span>` : "";
      const arrow =
        mk.kind === "driver" && typeof mk.heading === "number"
          ? `<b class="vita-pin__heading" style="transform:rotate(${mk.heading}deg)"></b>`
          : "";
      node.innerHTML = `${live}<i></i>${arrow}<em>${mk.label || ""}</em>`;
      const marker = new mapboxgl.Marker({ element: node, anchor: "bottom" }).setLngLat(lngLat);
      marker.addTo(map);
      return marker;
    });

    const viewPitch = vectorRef.current ? pitch : Math.min(pitch, 42);
    const viewBearing = vectorRef.current ? bearing : 0;
    if (valid.length >= 2) {
      const b = new mapboxgl.LngLatBounds([valid[0].lng, valid[0].lat], [valid[0].lng, valid[0].lat]);
      valid.forEach((m) => b.extend([m.lng, m.lat]));
      try {
        map.fitBounds(b, {
          padding: { top: 56, bottom: 120, left: 40, right: 40 },
          maxZoom: 15.2,
          duration: 450,
          pitch: viewPitch,
          bearing: viewBearing,
        });
      } catch {
        /* padding */
      }
    } else if (valid.length === 1) {
      map.easeTo({
        center: [valid[0].lng, valid[0].lat],
        zoom: 14.2,
        pitch: viewPitch,
        bearing: viewBearing,
        duration: 400,
      });
    }
  }, [markers, pitch, bearing]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (dashTimer.current) {
      window.clearInterval(dashTimer.current);
      dashTimer.current = null;
    }
    const clear = () => {
      if (map.getLayer("ops-route-glow")) map.removeLayer("ops-route-glow");
      if (map.getLayer("ops-route-flow")) map.removeLayer("ops-route-flow");
      if (map.getLayer("ops-route")) map.removeLayer("ops-route");
      if (map.getSource("ops-route")) map.removeSource("ops-route");
    };
    if (!route || route.length < 2) {
      clear();
      return;
    }
    const draw = () => {
      clear();
      map.addSource("ops-route", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: route } },
      });
      map.addLayer({
        id: "ops-route-glow",
        type: "line",
        source: "ops-route",
        paint: { "line-color": "#FFC400", "line-width": 10, "line-opacity": 0.16 },
      });
      map.addLayer({
        id: "ops-route",
        type: "line",
        source: "ops-route",
        paint: { "line-color": "#FFC400", "line-width": 4.5, "line-opacity": 0.92 },
      });
      map.addLayer({
        id: "ops-route-flow",
        type: "line",
        source: "ops-route",
        paint: { "line-color": "#fff6c2", "line-width": 2, "line-dasharray": [0, 2, 1.4] },
      });
      let step = 0;
      dashTimer.current = window.setInterval(() => {
        if (!map.getLayer("ops-route-flow")) return;
        step = (step + 1) % 24;
        const t = step / 24;
        try {
          map.setPaintProperty("ops-route-flow", "line-dasharray", [0, 1.2 + t, 1.4, 2.2 - t]);
        } catch {
          /* style swap */
        }
      }, 70);
    };
    if (map.isStyleLoaded()) draw();
    else map.once("load", draw);
    return () => {
      if (dashTimer.current) window.clearInterval(dashTimer.current);
    };
  }, [route]);

  return <div ref={el} className={`w-full overflow-hidden rounded-xl bg-[#0b0c0e] ${className}`} />;
};

export default OpsMap;
