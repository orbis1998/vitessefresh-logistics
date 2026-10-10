import { useEffect, useState } from "react";
import type { StyleSpecification } from "mapbox-gl";
import { useMapboxToken } from "@/hooks/useMapboxToken";

export const KINSHASA: [number, number] = [15.3078, -4.3276];

const MAPBOX_DARK = "mapbox://styles/mapbox/dark-v11";

const ESRI_DARK_STYLE: StyleSpecification = {
  version: 8,
  name: "vita-esri-dark",
  sources: {
    esri: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "© Esri",
    },
  },
  layers: [{ id: "esri-dark", type: "raster", source: "esri" }],
};

export function resolveVitaMapStyle(token: string | null) {
  if (token) return Promise.resolve(MAPBOX_DARK);
  return Promise.resolve(ESRI_DARK_STYLE);
}

export function useVitaMapStyle() {
  const { token, loading } = useMapboxToken();
  const [style, setStyle] = useState<string | StyleSpecification | null>(null);

  useEffect(() => {
    let live = true;
    resolveVitaMapStyle(token).then((next) => {
      if (live) setStyle(next);
    });
    return () => {
      live = false;
    };
  }, [token]);

  return { token, style, loading: loading && !style };
}

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

export async function reverseGeocode(lng: number, lat: number, token?: string | null) {
  if (token) {
    try {
      const r = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${encodeURIComponent(token)}&language=fr&limit=1`,
      );
      if (r.ok) {
        const data = await r.json();
        const name = data.features?.[0]?.place_name;
        if (name) return String(name);
      }
    } catch {
      /* nominatim */
    }
  }
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr`,
    );
    if (r.ok) {
      const data = await r.json();
      if (data.display_name) return String(data.display_name);
    }
  } catch {
    /* coords */
  }
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export async function searchKinshasa(query: string, token?: string | null) {
  const q = query.trim();
  if (q.length < 2) return [];
  if (token) {
    try {
      const r = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${encodeURIComponent(token)}&language=fr&country=cd&limit=5&bbox=15.1,-4.5,15.5,-4.2`,
      );
      if (r.ok) {
        const data = await r.json();
        const feats = data.features ?? [];
        if (feats.length) {
          return feats.map((f: { place_name: string; center: [number, number] }) => ({
            place_name: f.place_name,
            center: f.center as [number, number],
          }));
        }
      }
    } catch {
      /* nominatim */
    }
  }
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=cd&viewbox=15.1,-4.5,15.5,-4.2&bounded=1&accept-language=fr`,
    );
    if (!r.ok) return [];
    const data = (await r.json()) as Array<{ display_name: string; lon: string; lat: string }>;
    return data.map((f) => ({
      place_name: f.display_name,
      center: [Number(f.lon), Number(f.lat)] as [number, number],
    }));
  } catch {
    return [];
  }
}

export async function drivingRoute(from: [number, number], to: [number, number], token?: string | null) {
  if (token) {
    try {
      const r = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${from[0]},${from[1]};${to[0]},${to[1]}?overview=full&geometries=geojson&access_token=${encodeURIComponent(token)}`,
      );
      if (r.ok) {
        const data = await r.json();
        const coordinates = data.routes?.[0]?.geometry?.coordinates as [number, number][] | undefined;
        const durationSec = data.routes?.[0]?.duration as number | undefined;
        if (coordinates && coordinates.length >= 2) return { coordinates, durationSec };
      }
    } catch {
      /* osrm */
    }
  }
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
