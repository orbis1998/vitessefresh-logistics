import mapboxgl from "mapbox-gl";
import type { StyleSpecification } from "mapbox-gl";
import { useMapboxToken } from "@/hooks/useMapboxToken";

export const KINSHASA: [number, number] = [15.3078, -4.3276];

/** Preferred when the Mapbox public token can serve tiles. */
export const MAPBOX_DARK = "mapbox://styles/mapbox/dark-v11";

/** Navigation-style basemap (closer to Google/Yango for live trips). */
export const MAPBOX_NAV = "mapbox://styles/mapbox/navigation-night-v1";

/** Day streets — realistic road labels for dispatch. */
export const MAPBOX_STREETS = "mapbox://styles/mapbox/streets-v12";

/** Reliable dark basemap (no Mapbox billing / URL allowlist). */
export const CARTO_DARK: StyleSpecification = {
  version: 8,
  name: "vita-carto-dark",
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap © CARTO",
    },
  },
  layers: [{ id: "carto", type: "raster", source: "carto" }],
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
};

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

/** @deprecated kept for older imports */
export const VITA_BASEMAP = CARTO_DARK;

export function resolveMapStyle(token?: string | null) {
  if (token && token.startsWith("pk.")) return MAPBOX_DARK;
  return CARTO_DARK;
}

/** 4D depth: extruded buildings + atmospheric fog when vector tiles exist. */
export function addVitaBuildings(map: mapboxgl.Map) {
  if (map.getLayer("vita-buildings")) return;
  const src = map.getSource("openmaptiles")
    ? "openmaptiles"
    : map.getSource("composite")
      ? "composite"
      : null;
  if (!src) return;
  try {
    map.addLayer({
      id: "vita-buildings",
      source: src,
      "source-layer": "building",
      type: "fill-extrusion",
      minzoom: 12.5,
      paint: {
        "fill-extrusion-color": [
          "interpolate",
          ["linear"],
          ["coalesce", ["get", "render_height"], ["get", "height"], 14],
          0, "#14161a",
          20, "#1c1f24",
          60, "#252830",
        ],
        "fill-extrusion-height": ["coalesce", ["get", "render_height"], ["get", "height"], 16],
        "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], ["get", "min_height"], 0],
        "fill-extrusion-opacity": 0.9,
      },
    });
  } catch {
    /* raster basemap */
  }
}

/** Light depth cue only — heavy fog made the prod map look fully black. */
export function applyVitaAtmosphere(map: mapboxgl.Map, enabled = true) {
  try {
    if (!enabled) {
      // Clear any previous fog so streets stay visible.
      (map as mapboxgl.Map & { setFog: (fog?: mapboxgl.Fog | null) => void }).setFog(null);
      return;
    }
    map.setFog({
      color: "rgb(18, 20, 24)",
      "high-color": "rgb(36, 40, 48)",
      "horizon-blend": 0.02,
      "space-color": "rgb(10, 11, 13)",
      "star-intensity": 0,
      range: [1.8, 14],
    });
  } catch {
    /* style without fog support */
  }
}

/** Browser probe: Mapbox URL allowlists often 403 without a matching Origin. */
export async function canServeMapboxTiles(token?: string | null) {
  if (!token?.startsWith("pk.")) return false;
  try {
    const r = await fetch(
      `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/0/0/0.vector.pbf?access_token=${token}`,
      { method: "GET", cache: "no-store" },
    );
    return r.ok;
  } catch {
    return false;
  }
}

export const VITA_MAP_4D = {
  pitch: 62,
  bearing: 26,
  zoom: 14.1,
} as const;

/** Nudge colocated pins so colis / livreur stay readable. */
export function offsetLngLat(
  base: [number, number],
  metersEast: number,
  metersNorth: number,
): [number, number] {
  const [lng, lat] = base;
  const dLat = metersNorth / 111_320;
  const dLng = metersEast / (111_320 * Math.cos((lat * Math.PI) / 180));
  return [lng + dLng, lat + dLat];
}

export function bindMapToken(token?: string | null) {
  const envToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
  mapboxgl.accessToken = token || envToken || "";
}

export function useVitaMapStyle() {
  const { token, loading } = useMapboxToken();
  const envToken = (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined) || null;
  const resolved = token || envToken;
  return {
    token: resolved,
    style: resolveMapStyle(resolved),
    loading,
  };
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
