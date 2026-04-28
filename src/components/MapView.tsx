import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { Loader2 } from "lucide-react";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  color?: string;
  label?: string;
}

interface Props {
  markers?: MapMarker[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  fitBounds?: boolean;
}

const MapView = ({
  markers = [],
  center = [15.3050, -4.3047],
  zoom = 12,
  className = "w-full h-96",
  fitBounds = false,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const { token, loading } = useMapboxToken();

  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = token;
    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center,
      zoom,
    });
    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seen = new Set<string>();
    markers.forEach((m) => {
      seen.add(m.id);
      const existing = markersRef.current.get(m.id);
      if (existing) {
        existing.setLngLat([m.lng, m.lat]);
      } else {
        const el = document.createElement("div");
        el.style.width = "20px";
        el.style.height = "20px";
        el.style.borderRadius = "50%";
        el.style.background = m.color ?? "hsl(45 100% 51%)";
        el.style.border = "3px solid white";
        el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([m.lng, m.lat])
          .addTo(map);
        if (m.label) {
          marker.setPopup(new mapboxgl.Popup().setText(m.label));
        }
        markersRef.current.set(m.id, marker);
      }
    });
    // remove stale
    markersRef.current.forEach((mk, id) => {
      if (!seen.has(id)) {
        mk.remove();
        markersRef.current.delete(id);
      }
    });

    if (fitBounds && markers.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      markers.forEach((m) => bounds.extend([m.lng, m.lat]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 600 });
    } else if (markers.length === 1) {
      map.easeTo({ center: [markers[0].lng, markers[0].lat], duration: 600 });
    }
  }, [markers, fitBounds]);

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted rounded-xl`}>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!token) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted rounded-xl text-sm text-muted-foreground`}>
        Carte indisponible
      </div>
    );
  }

  return <div ref={containerRef} className={`${className} rounded-xl overflow-hidden`} />;
};

export default MapView;
