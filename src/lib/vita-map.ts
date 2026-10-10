import mapboxgl from "mapbox-gl";
import type { StyleSpecification } from "mapbox-gl";
import { useMapboxToken } from "@/hooks/useMapboxToken";

export const KINSHASA: [number, number] = [15.3078, -4.3276];

/** Dark vector style, no Mapbox key. */
export const VITA_BASEMAP = "https://tiles.openfreemap.org/styles/dark";

export const ESRI_STREETS: StyleSpecification = {
  version: 8,
  name: "vita-esri",
  sources: {
    streets: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "© Esri",
    },
  },
  layers: [{ id: "streets", type: "raster", source: "streets" }],
};

export function addVitaBuildings(map: mapboxgl.Map) {
  if (map.getLayer("vita-buildings")) return;
  const src = map.getSource("openmaptiles") ? "openmaptiles" : map.getSource("composite") ? "composite" : null;
  if (!src) return;
  try {
    map.addLayer({
      id: "vita-buildings",
      source: src,
      "source-layer": "building",
      type: "fill-extrusion",
      minzoom: 13,
      paint: {
        "fill-extrusion-color": "#1a1c20",
        "fill-extrusion-height": ["coalesce", ["get", "render_height"], ["get", "height"], 14],
        "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], ["get", "min_height"], 0],
        "fill-extrusion-opacity": 0.86,
      },
    });
  } catch {
    /* raster */
  }
}

export function bindMapToken(token?: string | null) {
  mapboxgl.accessToken = token || "pk.vita";
}

export function resolveVitaMapStyle(_token?: string | null) {
  return Promise.resolve(VITA_BASEMAP);
}

export function useVitaMapStyle() {
  const { token, loading } = useMapboxToken();
  return { token, style: VITA_BASEMAP, loading };
}

const photonName = (p: Record<string, unknown> | undefined) => {
  if (!p) return "";
  const parts = [p.name, p.street, p.district, p.city, p.state].filter((x) => typeof x === "string" && x);
  return (parts as string[]).filter((v, i, a) => a.indexOf(v) === i).join(", ");
};

export function isLngLat(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    Number.isFinite(Number(value[0])) &&
    Number.isFinite(Number(value[1])) &&
    Math.abs(Number(value[0])) <= 180 &&
    Math.abs(Number(value[1])) <= 90
  );
}

export async function reverseGeocode(lng: number, lat: number, _token?: string | null) {
  try {
    const r = await fetch(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`);
    if (r.ok) {
      const data = await r.json();
      const name = photonName(data.features?.[0]?.properties);
      if (name) return name;
    }
  } catch {
    /* coords */
  }
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export async function searchKinshasa(query: string, _token?: string | null) {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const r = await fetch(
      `https://photon.komoot.io/api?q=${encodeURIComponent(q)}&lat=-4.3276&lon=15.3078&limit=5&lang=fr`,
    );
    if (!r.ok) return [];
    const data = await r.json();
    return (data.features ?? [])
      .map((f: { geometry?: { coordinates?: number[] }; properties?: Record<string, unknown> }) => {
        const center = f.geometry?.coordinates;
        if (!center || center.length < 2) return null;
        return { place_name: photonName(f.properties) || q, center: [center[0], center[1]] as [number, number] };
      })
      .filter(Boolean) as Array<{ place_name: string; center: [number, number] }>;
  } catch {
    return [];
  }
}

export async function drivingRoute(from: [number, number], to: [number, number], _token?: string | null) {
  try {
    const r = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${from[0]},${from[1]};${to[0]},${to[1]}?overview=full&geometries=geojson`,
    );
    if (!r.ok) return null;
    const data = await r.json();
    const coordinates = data.routes?.[0]?.geometry?.coordinates as [number, number][] | undefined;
    const durationSec = data.routes?.[0]?.duration as number | undefined;
    if (!coordinates || coordinates.length < 2) return null;
    return { coordinates, durationSec };
  } catch {
    return null;
  }
}
