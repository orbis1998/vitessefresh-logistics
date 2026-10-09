import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useMapboxToken } from "@/hooks/useMapboxToken";

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
  pitch = 48,
}: {
  markers: OpsMarker[];
  className?: string;
  pitch?: number;
}) => {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const marks = useRef<mapboxgl.Marker[]>([]);
  const { token } = useMapboxToken();

  useEffect(() => {
    if (!el.current || !token) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: el.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [15.3078, -4.3195],
      zoom: 11.6,
      pitch,
      bearing: 18,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
    mapRef.current = map;
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      marks.current.forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, [token, pitch]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    marks.current.forEach((m) => m.remove());
    marks.current = markers.map((mk) => {
      const node = document.createElement("div");
      node.className = mk.kind === "driver" ? "ops-pin ops-pin--driver" : mk.kind === "pickup" ? "ops-pin ops-pin--pickup" : "ops-pin ops-pin--drop";
      const marker = new mapboxgl.Marker({ element: node }).setLngLat([mk.lng, mk.lat]);
      if (mk.label) marker.setPopup(new mapboxgl.Popup({ offset: 12 }).setText(mk.label));
      marker.addTo(map);
      return marker;
    });
    if (markers.length >= 2) {
      const b = new mapboxgl.LngLatBounds([markers[0].lng, markers[0].lat], [markers[0].lng, markers[0].lat]);
      markers.forEach((m) => b.extend([m.lng, m.lat]));
      try {
        map.fitBounds(b, { padding: 48, maxZoom: 14, duration: 400, pitch });
      } catch {
        /* padding */
      }
    } else if (markers.length === 1) {
      map.easeTo({ center: [markers[0].lng, markers[0].lat], zoom: 13.2, duration: 400 });
    }
  }, [markers, pitch]);

  return <div ref={el} className={`w-full overflow-hidden rounded-xl ${className}`} />;
};

export default OpsMap;
