import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { bindMapToken, isLngLat, VITA_BASEMAP, useVitaMapStyle } from "@/lib/vita-map";

export type OpsMarker = {
  id: string;
  lng: number;
  lat: number;
  kind: "driver" | "pickup" | "drop";
  label?: string;
};

const OpsMap = ({
  markers,
  className = "h-[420px]",
  pitch = 0,
}: {
  markers: OpsMarker[];
  className?: string;
  pitch?: number;
}) => {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const marks = useRef<mapboxgl.Marker[]>([]);
  const { token } = useVitaMapStyle();

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    bindMapToken(token);
    const map = new mapboxgl.Map({
      container: node,
      style: VITA_BASEMAP,
      center: [15.3078, -4.3195],
      zoom: 11.6,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      failIfMajorPerformanceCaveat: false,
    });
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
    mapRef.current = map;
    const kick = () => map.resize();
    map.on("load", kick);
    const ro = new ResizeObserver(kick);
    ro.observe(node);
    const t = window.setTimeout(kick, 200);
    return () => {
      window.clearTimeout(t);
      ro.disconnect();
      marks.current.forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    marks.current.forEach((m) => m.remove());
    const valid = markers.filter((mk) => isLngLat([mk.lng, mk.lat]));
    marks.current = valid.map((mk) => {
      const node = document.createElement("div");
      node.className = mk.kind === "driver" ? "ops-pin ops-pin--driver" : mk.kind === "pickup" ? "ops-pin ops-pin--pickup" : "ops-pin ops-pin--drop";
      const marker = new mapboxgl.Marker({ element: node }).setLngLat([mk.lng, mk.lat]);
      if (mk.label) marker.setPopup(new mapboxgl.Popup({ offset: 12 }).setText(mk.label));
      marker.addTo(map);
      return marker;
    });
    if (valid.length >= 2) {
      const b = new mapboxgl.LngLatBounds([valid[0].lng, valid[0].lat], [valid[0].lng, valid[0].lat]);
      valid.forEach((m) => b.extend([m.lng, m.lat]));
      try {
        map.fitBounds(b, { padding: 48, maxZoom: 14, duration: 400, pitch: 0 });
      } catch {
        /* padding */
      }
    } else if (valid.length === 1) {
      map.easeTo({ center: [valid[0].lng, valid[0].lat], zoom: 13.2, duration: 400 });
    }
  }, [markers]);

  return <div ref={el} className={`w-full overflow-hidden rounded-xl vita-map bg-[#121212] ${className}`} />;
};

export default OpsMap;
