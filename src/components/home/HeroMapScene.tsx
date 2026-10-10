import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { bindMapToken, drivingRoute, VITA_BASEMAP } from "@/lib/vita-map";
import { haversineKm } from "@/lib/distance";

const GOMBE: [number, number] = [15.3078, -4.3195];
const LIMETE: [number, number] = [15.3555, -4.3752];
const FALLBACK_ROUTE: [number, number][] = [
  GOMBE,
  [15.3184, -4.3288],
  [15.3291, -4.3412],
  [15.3402, -4.3566],
  LIMETE,
];

const lineLength = (coords: [number, number][]) => {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    total += haversineKm(coords[i - 1][1], coords[i - 1][0], coords[i][1], coords[i][0]);
  }
  return total;
};

const pointAt = (coords: [number, number][], t: number): [number, number] => {
  const total = lineLength(coords) || 1;
  let remain = Math.max(0, Math.min(1, t)) * total;
  for (let i = 1; i < coords.length; i++) {
    const seg = haversineKm(coords[i - 1][1], coords[i - 1][0], coords[i][1], coords[i][0]);
    if (remain <= seg) {
      const r = seg === 0 ? 0 : remain / seg;
      return [
        coords[i - 1][0] + (coords[i][0] - coords[i - 1][0]) * r,
        coords[i - 1][1] + (coords[i][1] - coords[i - 1][1]) * r,
      ];
    }
    remain -= seg;
  }
  return coords[coords.length - 1];
};

const bearingAt = (from: [number, number], to: [number, number]) => {
  const y = Math.sin(((to[0] - from[0]) * Math.PI) / 180) * Math.cos((to[1] * Math.PI) / 180);
  const x =
    Math.cos((from[1] * Math.PI) / 180) * Math.sin((to[1] * Math.PI) / 180) -
    Math.sin((from[1] * Math.PI) / 180) *
      Math.cos((to[1] * Math.PI) / 180) *
      Math.cos(((to[0] - from[0]) * Math.PI) / 180);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

const pinEl = (kind: "pickup" | "drop") => {
  const el = document.createElement("div");
  el.className = "hero-map-pin";
  el.innerHTML =
    kind === "pickup"
      ? `<span class="hero-map-pin__pulse"></span><span class="hero-map-pin__dot"></span>`
      : `<span class="hero-map-pin__box"></span>`;
  return el;
};

const courierEl = () => {
  const el = document.createElement("div");
  el.className = "hero-courier";
  el.innerHTML = `
    <div class="hero-courier__scene">
      <span class="hero-courier__shadow"></span>
      <span class="hero-courier__wheel hero-courier__wheel--r"></span>
      <span class="hero-courier__wheel hero-courier__wheel--f"></span>
      <span class="hero-courier__body"></span>
      <span class="hero-courier__box"></span>
      <span class="hero-courier__rider"></span>
    </div>
  `;
  return el;
};

const HeroMapScene = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const mapEl = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = mapEl.current;
    if (!node) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    bindMapToken();

    const map = new mapboxgl.Map({
      container: node,
      style: VITA_BASEMAP,
      center: [15.328, -4.345],
      zoom: 14.2,
      pitch: 0,
      bearing: 0,
      interactive: false,
      attributionControl: true,
      logoPosition: "bottom-right",
      antialias: true,
      failIfMajorPerformanceCaveat: false,
    });

    let cancelled = false;
    let raf = 0;
    let playing = !reduce;
    let routeCoords = FALLBACK_ROUTE;
    const extras: mapboxgl.Marker[] = [];

    const courier = new mapboxgl.Marker({
      element: courierEl(),
      rotationAlignment: "map",
      pitchAlignment: "map",
      anchor: "center",
    });

    const startLoop = () => {
      if (cancelled || reduce || routeCoords.length < 2 || raf) return;
      const duration = 18000;
      const tick = (now: number) => {
        if (!playing || cancelled) {
          raf = 0;
          return;
        }
        const t = (now % duration) / duration;
        const pos = pointAt(routeCoords, t);
        const ahead = pointAt(routeCoords, Math.min(1, t + 0.012));
        courier.setLngLat(pos).setRotation(bearingAt(pos, ahead));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const frameRoute = (route: [number, number][]) => {
      const bounds = route.reduce(
        (b, c) => b.extend(c),
        new mapboxgl.LngLatBounds(route[0], route[0])
      );
      const w = node.clientWidth || 800;
      const h = node.clientHeight || 600;
      const left = Math.min(Math.round(w * 0.28), 240);
      const bottom = Math.min(Math.round(h * 0.22), 160);
      map.fitBounds(bounds, {
        padding: { top: 48, bottom, left, right: 32 },
        pitch: 58,
        bearing: 24,
        duration: 0,
        maxZoom: 15.2,
      });
    };

    const paintRoute = (route: [number, number][]) => {
      routeCoords = route;
      if (!map.getSource("hero-route")) {
        map.addSource("hero-route", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: route } },
        });
        try {
          map.addLayer({
            id: "hero-route-glow",
            type: "line",
            source: "hero-route",
            paint: { "line-color": "#FFC400", "line-width": 12, "line-opacity": 0.28, "line-blur": 4 },
          });
          map.addLayer({
            id: "hero-route",
            type: "line",
            source: "hero-route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#E6A800", "line-width": 4, "line-opacity": 1 },
          });
        } catch {
          /* style without line layers */
        }
      }
      extras.push(
        new mapboxgl.Marker({ element: pinEl("pickup"), anchor: "bottom" }).setLngLat(route[0]).addTo(map),
        new mapboxgl.Marker({ element: pinEl("drop"), anchor: "bottom" }).setLngLat(route[route.length - 1]).addTo(map)
      );
      courier.setLngLat(reduce ? pointAt(route, 0.38) : route[0]).addTo(map);
      try {
        frameRoute(route);
      } catch {
        map.jumpTo({ center: route[Math.floor(route.length / 2)], zoom: 14, pitch: 58, bearing: 24 });
      }
      startLoop();
    };

    const boot = () => {
      if (cancelled) return;
      map.resize();
    };

    map.on("style.load", boot);
    map.on("load", async () => {
      if (cancelled) return;
      map.resize();
      try {
        const data = await drivingRoute(GOMBE, LIMETE);
        paintRoute(data?.coordinates?.length ? data.coordinates : FALLBACK_ROUTE);
      } catch {
        paintRoute(FALLBACK_ROUTE);
      }
    });

    const io = new IntersectionObserver(
      ([entry]) => {
        playing = Boolean(entry?.isIntersecting) && !reduce;
        if (playing) startLoop();
        else if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { threshold: 0.12 }
    );
    if (rootRef.current) io.observe(rootRef.current);

    const onResize = () => map.resize();
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(node);
    requestAnimationFrame(() => map.resize());

    return () => {
      cancelled = true;
      playing = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      io.disconnect();
      extras.forEach((m) => m.remove());
      courier.remove();
      map.remove();
    };
  }, []);

  return (
    <div ref={rootRef} className="absolute inset-0 overflow-hidden bg-[#101214]" aria-hidden="true">
      <div ref={mapEl} className="absolute inset-0 h-full w-full hero-map-canvas" />
      <div className="pointer-events-none absolute inset-0 bg-[#101214]/20" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[38%] bg-gradient-to-b from-[#101214] via-[#101214]/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[36%] sm:h-[32%] bg-gradient-to-t from-[#101214] via-[#101214]/75 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[42%] md:block bg-gradient-to-r from-[#101214] via-[#101214]/55 to-transparent" />
    </div>
  );
};

export default HeroMapScene;
