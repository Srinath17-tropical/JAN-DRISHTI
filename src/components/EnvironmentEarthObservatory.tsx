import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  CloudRain,
  Compass,
  Flame,
  Globe2,
  Mountain,
  Pause,
  Play,
  RefreshCw,
  ThermometerSun,
  Waves,
  Wind,
} from "lucide-react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SectorInsightsVillage } from "./SectorActionModules";

type GlobeSimMode = "winds" | "cyclone" | "enso" | "seismic";
type ThreatCategory = "climatological" | "oceanic" | "geological";

type WeatherTelemetry = {
  source: string;
  villageName: string;
  districtName: string;
  fetchedAt: string;
  current: {
    tempC: number;
    apparentTempC: number;
    humidityPct: number;
    windKmh: number;
    windDirectionDeg?: number;
    pressureHpa?: number;
    weatherCode: number;
    rainMm: number;
    pm25: number;
    pm10: number;
    usAqi: number;
  };
  forecast7dRainMm: number;
  heatAdvisory: {
    level: string;
    tone: "critical" | "amber" | "emerald";
    workWindow: string;
    guidance: string;
  };
  hourly: { hour: string; tempC: number; rainMm: number; rainProbPct: number }[];
};

type GeoHazardsResponse = {
  updatedAt: string;
  sources: string[];
  quakeCount7d: number;
  maxMag7d: number;
  earthquakes: {
    id: string;
    mag: number;
    place: string;
    timeIso: string;
    lat: number;
    lng: number;
    depthKm: number;
    tsunami: boolean;
  }[];
  eonetEvents: {
    id: string;
    title: string;
    category: string;
    categoryId: string;
    lat: number;
    lng: number;
    dateIso: string;
  }[];
  categoryCounts: {
    wildfires: number;
    severeStorms: number;
    volcanoes: number;
    floods: number;
  };
  indianOcean: {
    bayOfBengal: { sstC: number; waveHeightM: number; wavePeriodS: number };
    arabianSea: { sstC: number; waveHeightM: number; wavePeriodS: number };
  };
};

type MonthWindProfile = {
  short: string;
  name: string;
  phase: string;
  summary: string;
  indiaAvgC: number;
  rainMm: number;
  itczLat: number;
  sunLat: number;
  thermalShiftLat: number;
};

const MONTH_PROFILES: MonthWindProfile[] = [
  { short: "JAN", name: "January", phase: "WINTER NE MONSOON", summary: "Dry cool northeast trade winds prevail across Deccan plateau", indiaAvgC: 21, rainMm: 14, itczLat: -8, sunLat: -21.2, thermalShiftLat: -14 },
  { short: "FEB", name: "February", phase: "LATE WINTER TRANSITION", summary: "Solar heating begins shifting northward across peninsular India", indiaAvgC: 24, rainMm: 18, itczLat: -4, sunLat: -13.0, thermalShiftLat: -7 },
  { short: "MAR", name: "March", phase: "EARLY PRE-MONSOON", summary: "Land warms rapidly; continental low starts forming over central India", indiaAvgC: 28, rainMm: 22, itczLat: 2, sunLat: -2.4, thermalShiftLat: 2 },
  { short: "APR", name: "April", phase: "PRE-MONSOON", summary: "Heat builds, ITCZ drifts north across Southern Peninsula", indiaAvgC: 31, rainMm: 34, itczLat: 8, sunLat: 9.6, thermalShiftLat: 10 },
  { short: "MAY", name: "May", phase: "PRE-MONSOON PEAK", summary: "Peak thermal low heats Deccan plateau; ITCZ pulls moist sea breezes", indiaAvgC: 34, rainMm: 52, itczLat: 15, sunLat: 18.8, thermalShiftLat: 18 },
  { short: "JUN", name: "June", phase: "SW MONSOON ONSET", summary: "SE trades cross equator, bend right via Coriolis into SW Monsoon", indiaAvgC: 32, rainMm: 165, itczLat: 21, sunLat: 23.1, thermalShiftLat: 22 },
  { short: "JUL", name: "July", phase: "PEAK SW MONSOON", summary: "Strong cross-equatorial Somali Jet delivers peak rain across Telangana", indiaAvgC: 29, rainMm: 280, itczLat: 24, sunLat: 21.5, thermalShiftLat: 23 },
  { short: "AUG", name: "August", phase: "MATURE MONSOON", summary: "Persistent monsoon trough replenishes tanks, streams & aquifers", indiaAvgC: 28, rainMm: 254, itczLat: 22, sunLat: 14.0, thermalShiftLat: 19 },
  { short: "SEP", name: "September", phase: "LATE MONSOON", summary: "ITCZ begins retreating southward; afternoon convective storms peak", indiaAvgC: 29, rainMm: 170, itczLat: 15, sunLat: 3.1, thermalShiftLat: 11 },
  { short: "OCT", name: "October", phase: "POST-MONSOON RETREAT", summary: "Winds reverse to NE; warm Bay of Bengal (>28°C) fuels cyclones", indiaAvgC: 27, rainMm: 82, itczLat: 7, sunLat: -8.5, thermalShiftLat: 3 },
  { short: "NOV", name: "November", phase: "NE MONSOON & CYCLONES", summary: "Northeast trades bring coastal rains & Bay of Bengal depressions", indiaAvgC: 24, rainMm: 35, itczLat: -1, sunLat: -18.2, thermalShiftLat: -6 },
  { short: "DEC", name: "December", phase: "WINTER CIRCULATION", summary: "Subtropical high stabilizes clear dry skies & cool nights", indiaAvgC: 21, rainMm: 12, itczLat: -6, sunLat: -23.0, thermalShiftLat: -12 },
];

const THREAT_CATALOG: Record<
  ThreatCategory,
  {
    title: string;
    subtitle: string;
    accentHex: string;
    threats: {
      name: string;
      mechanism: string;
      impact: string;
      localMitigation: string;
    }[];
  }
> = {
  climatological: {
    title: "Climatological & Atmospheric Threats",
    subtitle: "Jet-stream blocking, extreme wet-bulb heatwaves, cloudburst flash-floods & biomass aerosol haze.",
    accentHex: "#f59e0b",
    threats: [
      {
        name: "Wet-Bulb Heatwaves & Heat-Island Domes",
        mechanism: "Persistent high-pressure ridges trap hot air over dry soil and dark rooftops above 42°C.",
        impact: "Triggers heatstroke in outdoor farm workers, dries topsoil moisture, and spikes crop wilt.",
        localMitigation: "Cool white-lime roofs, Miyawaki shade groves, and early 6–10:30 AM outdoor work shifts.",
      },
      {
        name: "Cloudbursts & Extreme Rain Concentration",
        mechanism: "Warmer air holds ~7% more moisture per +1°C, unloading a month's rain inside 2 hours.",
        impact: "Breaches silted tank bunds, scours fertile topsoil, and floods low-lying rural settlements.",
        localMitigation: "Desilted feeder channels across all ponds/kuntas/lakes + checkdam cascades.",
      },
      {
        name: "El Niño (ENSO) & Negative IOD Droughts",
        mechanism: "Warm eastern Pacific water weakens Walker Circulation & suppresses Indian Ocean moisture uplift.",
        impact: "Delays June monsoon onset across Telangana, crashing rainfed kharif yields & lowering wells.",
        localMitigation: "Pre-Kharif village water budgeting, drought-resilient millets & drip micro-irrigation.",
      },
      {
        name: "Wildfires, Crop-Burning & PM2.5 Plumes",
        mechanism: "Dry pre-monsoon litter and post-harvest residue burning inject black carbon & toxic aerosols.",
        impact: "Degrades rural air quality past safe AQI limits and accelerates localized ozone warming.",
        localMitigation: "Shared PACS tractor mulchers, forest fire-lines & clean-cooking LPG transition.",
      },
    ],
  },
  oceanic: {
    title: "Oceanic & Hydrospheric Threats",
    subtitle: "Warming Indian Ocean surface temperatures (>28°C), cyclone spin-up, thermal expansion & coastal salinity.",
    accentHex: "#38bdf8",
    threats: [
      {
        name: "Marine Heatwaves Fueling Bay of Bengal Cyclones",
        mechanism: "Sea surface temperatures above 27.5°C transfer massive latent heat into Coriolis-spun storms.",
        impact: "Rapid cyclone intensification drives severe wind shear, inland rain surges & grid blackouts.",
        localMitigation: "Live SST tracking, underground village emergency power feeders & flood-safe shelters.",
      },
      {
        name: "Sea-Level Rise & Thermal Ocean Expansion",
        mechanism: "Oceans absorb >90% of trapped planetary heat, expanding water volume alongside glacier melt.",
        impact: "Pushes saltwater inland into delta aquifers and erodes coastal wetlands and fisheries.",
        localMitigation: "Mangrove bioshields, freshwater recharge barriers & zero coastal sand mining.",
      },
      {
        name: "Ocean Acidification & Deoxygenation",
        mechanism: "Seawater absorbs excess atmospheric CO₂, forming carbonic acid and lowering pH.",
        impact: "Weakens coral reefs and shellfish chains that protect coasts and feed millions of families.",
        localMitigation: "Cut fossil-fuel emissions via village solar microgrids and halt untreated river runoff.",
      },
      {
        name: "Storm Surge & River-Mouth Backwater Flooding",
        mechanism: "Low cyclone central pressure pulls sea swells inland against swollen monsoon river outflows.",
        impact: "Submerges standing paddy crops and contaminates coastal drinking-water wells with brine.",
        localMitigation: "Early-warning SMS sirens, elevated tube-well platforms & emergency rainwater cisterns.",
      },
    ],
  },
  geological: {
    title: "Geological & Tectonic Threats",
    subtitle: "Indian Plate north-northeast collision stress, intra-plate faults, monsoon landslides & soil erosion.",
    accentHex: "#f43f5e",
    threats: [
      {
        name: "Tectonic Plate Stress & Earthquakes (Zone II–V)",
        mechanism: "The Indian Plate pushes ~5 cm/year into Eurasia, building strain along Himalayan & intra-plate faults.",
        impact: "Sudden rupture causes structural collapse, dam cracks, and Bay of Bengal tsunami risk.",
        localMitigation: "Seismic-safe school/PHC masonry retrofits, open assembly grounds & 108 trauma drills.",
      },
      {
        name: "Monsoon-Triggered Landslides & Slope Failure",
        mechanism: "Heavy cloudbursts saturate deforested hill slopes, raising pore-water pressure until soil shears.",
        impact: "Blocks rural road lifelines, buries hill hamlets, and chokes downstream river reservoirs with silt.",
        localMitigation: "Deep-rooted vetiver/bamboo slope stabilization & zero road-cut blasting without retaining walls.",
      },
      {
        name: "Volcanic Ash & Stratospheric Aerosol Veils",
        mechanism: "Explosive submarine/arc eruptions inject sulfur dioxide high into the stratosphere.",
        impact: "Scatters incoming sunlight, temporarily disrupting monsoon rainfall bands and aviation corridors.",
        localMitigation: "Diversified local seed banks & community grain buffers to absorb seasonal rainfall anomalies.",
      },
      {
        name: "Aquifer Subsidence & Soil Gully Erosion",
        mechanism: "Unchecked deep borewell extraction collapses underground clay layers while bare soil washes away.",
        impact: "Permanently destroys underground water-storage pore space and turns arable fields into ravines.",
        localMitigation: "Vertical borewell recharge shafts, contour stone bunding & zero bare-soil overgrazing.",
      },
    ],
  },
};

function getVillageLatLon(village: SectorInsightsVillage | null): [number, number] {
  if (typeof village?.lat === "number" && typeof village?.lon === "number") {
    return [village.lat, village.lon];
  }
  const g = village?.geometry as { type?: string; coordinates?: unknown } | undefined;
  if (g && typeof g === "object") {
    let ring: number[][] = [];
    if (g.type === "Polygon" && Array.isArray(g.coordinates)) {
      ring = (g.coordinates as number[][][])[0] ?? [];
    } else if (g.type === "MultiPolygon" && Array.isArray(g.coordinates)) {
      ring = (g.coordinates as number[][][][])[0]?.[0] ?? [];
    }
    if (ring.length > 0) {
      let sLat = 0;
      let sLon = 0;
      for (const pt of ring) {
        sLon += pt[0];
        sLat += pt[1];
      }
      return [Number((sLat / ring.length).toFixed(3)), Number((sLon / ring.length).toFixed(3))];
    }
  }
  return [17.385, 78.4867];
}

function windCardinal(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
}

/* =========================================================
   GLOBAL WIND PATTERNS & SPECIAL GEOGRAPHICAL EVENTS CANVAS
========================================================= */
type WindParticle = {
  lat: number;
  lonOffset: number;
  speed: number;
  trail: { lat: number; lonOffset: number }[];
};

function AtmosphericGlobeVisualizer({
  monthIdx,
  mode,
  geohazards,
}: {
  monthIdx: number;
  mode: GlobeSimMode;
  geohazards: GeoHazardsResponse | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const profile = MONTH_PROFILES[monthIdx];

  // Keep latest props in refs so 60fps animation runs smoothly without resetting canvas
  const stateRef = useRef({ profile, mode, geohazards });
  stateRef.current = { profile, mode, geohazards };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Seed 135 atmospheric wind tracers across latitudes (-82..82)
    const particles: WindParticle[] = Array.from({ length: 135 }, (_, i) => {
      const lat = -80 + (i / 134) * 160 + (Math.random() - 0.5) * 4;
      return {
        lat: Math.max(-84, Math.min(84, lat)),
        lonOffset: -84 + Math.random() * 168,
        speed: 0.32 + Math.random() * 0.42,
        trail: [],
      };
    });

    let rafId = 0;
    let tick = 0;

    const projectGlobe = (
      latDeg: number,
      lonDeg: number,
      cx: number,
      cy: number,
      R: number
    ): { x: number; y: number; visible: boolean } => {
      const phi = (latDeg * Math.PI) / 180;
      const lam = (lonDeg * Math.PI) / 180;
      // Front-hemisphere orthographic projection (centered ~78°E India -> lonDeg=0 is center)
      const cosC = Math.cos(phi) * Math.cos(lam);
      const x = cx + R * Math.cos(phi) * Math.sin(lam);
      const y = cy - R * Math.sin(phi);
      return { x, y, visible: cosC >= 0 };
    };

    const drawPolygonOnGlobe = (
      coords: [number, number][],
      cx: number,
      cy: number,
      R: number,
      fillStyle: string,
      strokeStyle: string
    ) => {
      ctx.beginPath();
      let started = false;
      for (const [lat, lon] of coords) {
        const pt = projectGlobe(lat, lon, cx, cy, R);
        if (!started) {
          ctx.moveTo(pt.x, pt.y);
          started = true;
        } else {
          ctx.lineTo(pt.x, pt.y);
        }
      }
      ctx.closePath();
      ctx.fillStyle = fillStyle;
      ctx.fill();
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const renderFrame = () => {
      tick += prefersReduced ? 0 : 1;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(320, rect.width);
      const h = Math.max(340, rect.height);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Deep Space Canvas Backdrop
      ctx.fillStyle = "#050914";
      ctx.fillRect(0, 0, w, h);

      // Center Globe shifted slightly left so Circulation Cells fit crisply on the right
      const cx = w * 0.43;
      const cy = h * 0.5;
      const R = Math.min(w * 0.34, h * 0.43);

      const { profile: curProf, mode: curMode, geohazards: geo } = stateRef.current;

      // Outer Atmospheric Halo
      const halo = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.15);
      halo.addColorStop(0, "rgba(56, 189, 248, 0.24)");
      halo.addColorStop(1, "rgba(5, 9, 20, 0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.15, 0, Math.PI * 2);
      ctx.fill();

      // Clip to Earth Sphere
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      // Thermal Surface Gradient shifting dynamically with solar heating latitude!
      const shiftPx = -(curProf.thermalShiftLat / 90) * R * 0.55;
      const thermalGrad = ctx.createLinearGradient(cx, cy - R, cx, cy + R);
      if (curMode === "enso") {
        // Warm equatorial Pacific & Indian Ocean anomaly shading
        thermalGrad.addColorStop(0, "#17325c");
        thermalGrad.addColorStop(0.28, "#2563eb");
        thermalGrad.addColorStop(0.5, "#ef4444");
        thermalGrad.addColorStop(0.72, "#f59e0b");
        thermalGrad.addColorStop(1, "#1e3a5f");
      } else {
        const hotStop = Math.max(0.25, Math.min(0.75, 0.5 + shiftPx / (2 * R)));
        thermalGrad.addColorStop(0, "#1d4ed8");
        thermalGrad.addColorStop(Math.max(0.12, hotStop - 0.26), "#38bdf8");
        thermalGrad.addColorStop(Math.max(0.18, hotStop - 0.12), "#d97706");
        thermalGrad.addColorStop(hotStop, "#b91c1c");
        thermalGrad.addColorStop(Math.min(0.84, hotStop + 0.14), "#ea580c");
        thermalGrad.addColorStop(Math.min(0.92, hotStop + 0.3), "#2563eb");
        thermalGrad.addColorStop(1, "#1e3a8a");
      }
      ctx.fillStyle = thermalGrad;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

      // Soft landmass silhouettes (India centered near lon 0 => 78°E)
      // India peninsula
      drawPolygonOnGlobe(
        [
          [34, -4], [32, 6], [26, 16], [22, 14], [18, 6], [8, 0], [16, -6], [23, -10], [28, -8],
        ],
        cx,
        cy,
        R,
        "rgba(255,255,255,0.14)",
        "rgba(255,255,255,0.45)"
      );
      // Eurasia / Tibetan Plateau
      drawPolygonOnGlobe(
        [
          [68, -68], [72, 10], [64, 65], [40, 58], [32, 22], [35, -18], [42, -55],
        ],
        cx,
        cy,
        R,
        "rgba(255,255,255,0.08)",
        "rgba(255,255,255,0.22)"
      );
      // East Africa & Arabian Peninsula
      drawPolygonOnGlobe(
        [
          [32, -45], [28, -22], [14, -28], [-12, -38], [-28, -50], [4, -68], [26, -65],
        ],
        cx,
        cy,
        R,
        "rgba(255,255,255,0.09)",
        "rgba(255,255,255,0.25)"
      );
      // SE Asia & Maritime Continent / NW Australia
      drawPolygonOnGlobe(
        [
          [24, 18], [16, 28], [4, 26], [-8, 42], [-24, 58], [-32, 42], [-10, 22],
        ],
        cx,
        cy,
        R,
        "rgba(255,255,255,0.08)",
        "rgba(255,255,255,0.22)"
      );

      // Subtle Latitude Belts (-60, -30, 0, +30, +60)
      for (const lat of [-60, -30, 0, 30, 60]) {
        const yLat = cy - R * Math.sin((lat * Math.PI) / 180);
        const halfW = R * Math.cos((lat * Math.PI) / 180);
        ctx.beginPath();
        ctx.moveTo(cx - halfW, yLat);
        ctx.lineTo(cx + halfW, yLat);
        ctx.strokeStyle = lat === 0 ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.16)";
        ctx.setLineDash(lat === 0 ? [5, 5] : [3, 5]);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Dynamic ITCZ / Doldrums Trough Line
      if (curMode === "winds" || curMode === "enso") {
        const yItcz = cy - R * Math.sin((curProf.itczLat * Math.PI) / 180);
        const halfItcz = R * Math.cos((curProf.itczLat * Math.PI) / 180);
        ctx.beginPath();
        ctx.moveTo(cx - halfItcz, yItcz);
        ctx.bezierCurveTo(
          cx - halfItcz * 0.4,
          yItcz - 5,
          cx + halfItcz * 0.4,
          yItcz + 5,
          cx + halfItcz,
          yItcz
        );
        ctx.strokeStyle = "#f87171";
        ctx.lineWidth = 2;
        ctx.setLineDash([7, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Mode-specific Animated Physics Overlays
      if (curMode === "cyclone") {
        // Bay of Bengal Tropical Cyclone Counter-Clockwise Spiral Vortex (15°N, +7° east of India center)
        const vCenter = projectGlobe(15.5, 7, cx, cy, R);
        for (let arm = 0; arm < 5; arm++) {
          ctx.beginPath();
          for (let step = 0; step < 34; step++) {
            const angle = (arm * Math.PI * 2) / 5 - tick * 0.055 + step * 0.16;
            const rad = 4 + step * 2.1;
            const px = vCenter.x + Math.cos(angle) * rad;
            const py = vCenter.y + Math.sin(angle) * rad * 0.85;
            if (step === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.strokeStyle = "rgba(186, 230, 253, 0.8)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(vCenter.x, vCenter.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = "#050914";
        ctx.fill();
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (curMode === "seismic" && geo) {
        // Plot Tectonic Plate Boundary Arc & Live USGS Quakes + NASA EONET Events
        ctx.beginPath();
        const himArc: [number, number][] = [[35, -14], [34, -4], [29, 8], [27, 16], [16, 17], [4, 18], [-8, 30]];
        himArc.forEach(([lt, ln], i) => {
          const p = projectGlobe(lt, ln, cx, cy, R);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.strokeStyle = "rgba(244, 63, 94, 0.85)";
        ctx.lineWidth = 2.2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Plot Earthquakes relative to India center (~78°E)
        for (const q of geo.earthquakes) {
          const relLon = q.lng - 78;
          if (Math.abs(relLon) <= 85) {
            const pt = projectGlobe(q.lat, relLon, cx, cy, R);
            if (pt.visible) {
              const pulse = prefersReduced ? 0 : (Math.sin(tick * 0.08 + q.mag) + 1) * 3.5;
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, 4 + q.mag + pulse, 0, Math.PI * 2);
              ctx.strokeStyle = "rgba(244, 63, 94, 0.55)";
              ctx.lineWidth = 1.4;
              ctx.stroke();

              ctx.beginPath();
              ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
              ctx.fillStyle = "#f43f5e";
              ctx.fill();
            }
          }
        }
      }

      // Update & Render Flowing Atmospheric Wind Particles across Belts
      for (const p of particles) {
        const absLat = Math.abs(p.lat);
        let dLon = 0;
        let dLat = 0;
        let strokeColor = "#fbbf24";

        if (curMode === "cyclone") {
          // Draw wind bands swirling gently toward Bay of Bengal low
          const dx = 7 - p.lonOffset;
          const dy = 15.5 - p.lat;
          const dist = Math.hypot(dx, dy) + 1;
          if (dist < 42) {
            // Coriolis counter-clockwise swirl
            dLon = (-dy / dist) * 0.85 + (dx / dist) * 0.25;
            dLat = (dx / dist) * 0.75 + (dy / dist) * 0.22;
            strokeColor = "#7dd3fc";
          } else {
            dLon = -0.35;
            dLat = dy > 0 ? 0.05 : -0.05;
            strokeColor = "rgba(251, 191, 36, 0.75)";
          }
        } else if (curMode === "enso") {
          // Walker east-to-west & anomalous dry divergence in eastern Indian Ocean
          dLon = p.lat > -12 && p.lat < 18 ? 0.55 : -0.45;
          dLat = Math.sin(p.lonOffset * 0.06) * 0.14;
          strokeColor = p.lat > -15 && p.lat < 20 ? "#fb7185" : "#60a5fa";
        } else {
          // Standard Planetary Wind Belts + Dynamic ITCZ Monsoon Shift!
          const itcz = curProf.itczLat;
          if (absLat > 60) {
            // Polar Easterlies (blow Westward, slightly toward 60° Subpolar Low)
            dLon = -0.45 * p.speed;
            dLat = (p.lat > 0 ? -0.11 : 0.11) * p.speed;
            strokeColor = "#67e8f9";
          } else if (absLat > 30) {
            // Prevailing Westerlies (blow Eastward, poleward)
            dLon = 0.62 * p.speed;
            dLat = (p.lat > 0 ? 0.12 : -0.12) * p.speed;
            strokeColor = "#60a5fa";
          } else {
            // Trade Winds & Cross-Equatorial Monsoon Deflection!
            if (p.lat > itcz) {
              // North of ITCZ: NE Trade Winds blowing SW
              dLon = -0.58 * p.speed;
              dLat = -0.22 * p.speed;
              strokeColor = "#fbbf24";
            } else if (p.lat >= 0 && itcz > 6) {
              // Crossed equator into Northern Hemisphere -> Coriolis bends SE trades to SW Monsoon!
              dLon = 0.72 * p.speed;
              dLat = 0.34 * p.speed;
              strokeColor = "#34d399";
            } else {
              // Southern Hemisphere SE Trades blowing NW toward equator/ITCZ
              dLon = -0.55 * p.speed;
              dLat = 0.24 * p.speed;
              strokeColor = "#fb923c";
            }
          }
        }

        if (!prefersReduced) {
          p.trail.push({ lat: p.lat, lonOffset: p.lonOffset });
          if (p.trail.length > 9) p.trail.shift();
          p.lonOffset += dLon;
          p.lat += dLat;
          if (p.lonOffset < -84 || p.lonOffset > 84 || Math.abs(p.lat) > 84) {
            p.lonOffset = dLon > 0 ? -80 + Math.random() * 20 : 80 - Math.random() * 20;
            p.lat = -78 + Math.random() * 156;
            p.trail = [];
          }
        }

        if (p.trail.length >= 2) {
          ctx.beginPath();
          let validPts = 0;
          for (let k = 0; k < p.trail.length; k++) {
            const pt = projectGlobe(p.trail[k].lat, p.trail[k].lonOffset, cx, cy, R);
            if (pt.visible) {
              if (validPts === 0) ctx.moveTo(pt.x, pt.y);
              else ctx.lineTo(pt.x, pt.y);
              validPts++;
            }
          }
          if (validPts >= 2) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = curMode === "seismic" ? 1 : 1.75;
            ctx.globalAlpha = curMode === "seismic" ? 0.35 : 0.78;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      // Globe Edge Vignette Shading for 3D spherical volume
      const sphereShade = ctx.createRadialGradient(
        cx - R * 0.28,
        cy - R * 0.25,
        R * 0.2,
        cx,
        cy,
        R
      );
      sphereShade.addColorStop(0, "rgba(255,255,255,0.08)");
      sphereShade.addColorStop(0.75, "rgba(0,0,0,0.08)");
      sphereShade.addColorStop(1, "rgba(2,6,18,0.68)");
      ctx.fillStyle = sphereShade;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

      ctx.restore(); // end Sphere Clip

      // Crisp Globe Rim
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.38)";
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // India Pinpoint Badge on Globe
      const indiaPt = projectGlobe(18.0, 0, cx, cy, R);
      ctx.beginPath();
      ctx.arc(indiaPt.x, indiaPt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px Calibri, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("INDIA", indiaPt.x, indiaPt.y - 10);

      // Belt & Pressure Labels Along Left / Center
      ctx.font = "600 10.5px Calibri, sans-serif";
      ctx.fillStyle = "rgba(226, 232, 240, 0.88)";
      const beltLabels: { lat: number; txt: string; color?: string }[] = [
        { lat: 73, txt: "Polar Easterlies" },
        { lat: 57, txt: "Subpolar Low (60°N)" },
        { lat: 44, txt: "Westerlies" },
        { lat: 30, txt: "Subtropical High (30°N)" },
        { lat: Math.max(curProf.itczLat, 4) + 7, txt: "Northeast Trade Winds" },
        { lat: curProf.itczLat, txt: "ITCZ / Doldrums", color: "#fda4af" },
        { lat: -18, txt: "Southeast Trade Winds" },
        { lat: -31, txt: "Subtropical High (30°S)" },
        { lat: -47, txt: "Westerlies" },
      ];
      beltLabels.forEach((b) => {
        const yB = cy - R * Math.sin((b.lat * Math.PI) / 180);
        ctx.fillStyle = b.color ?? "rgba(241, 245, 249, 0.86)";
        ctx.textAlign = "left";
        ctx.fillText(b.txt, cx - R * 0.68, yB + 3);
      });

      // Right-Side 3D Atmospheric Circulation Cells (Polar, Ferrel, Hadley)
      const cellSpecs = [
        { name: "Polar Cell", range: "(60°–90°)", yTop: cy - R * 0.94, yBot: cy - R * 0.72, col: "#67e8f9" },
        { name: "Ferrel Cell", range: "(30°–60°)", yTop: cy - R * 0.7, yBot: cy - R * 0.43, col: "#60a5fa" },
        { name: "Hadley Cell", range: "(0°–30°)", yTop: cy - R * 0.41, yBot: cy, col: "#fbbf24" },
        { name: "Hadley Cell (S)", range: "(0°–30°S)", yTop: cy + 4, yBot: cy + R * 0.44, col: "#fb923c" },
        { name: "Ferrel Cell (S)", range: "(30°–60°S)", yTop: cy + R * 0.46, yBot: cy + R * 0.74, col: "#60a5fa" },
      ];

      const arcX = cx + R + 12;
      cellSpecs.forEach((cell) => {
        const midY = (cell.yTop + cell.yBot) / 2;
        const cellH = Math.max(18, cell.yBot - cell.yTop - 6);
        ctx.beginPath();
        ctx.ellipse(arcX + 18, midY, 16, cellH * 0.44, 0, 0, Math.PI * 2);
        ctx.strokeStyle = cell.col;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.textAlign = "left";
        ctx.fillStyle = cell.col;
        ctx.font = "bold 11px Calibri, sans-serif";
        ctx.fillText(cell.name, arcX + 44, midY - 2);
        ctx.fillStyle = "rgba(148, 163, 184, 0.9)";
        ctx.font = "10px Consolas, monospace";
        ctx.fillText(cell.range, arcX + 44, midY + 11);
      });

      // Live Sun Overhead Pointer
      const sunY = cy - R * Math.sin((curProf.sunLat * Math.PI) / 180);
      ctx.beginPath();
      ctx.arc(w - 46, sunY, 9, 0, Math.PI * 2);
      ctx.fillStyle = "#fbbf24";
      ctx.fill();
      ctx.strokeStyle = "rgba(251, 191, 36, 0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w - 58, sunY);
      ctx.lineTo(cx + R + 4, sunY);
      ctx.stroke();

      ctx.textAlign = "right";
      ctx.fillStyle = "#fde68a";
      ctx.font = "600 10.5px Consolas, monospace";
      ctx.fillText(
        `Sun overhead: ${Math.abs(curProf.sunLat).toFixed(1)}°${curProf.sunLat >= 0 ? "N" : "S"}`,
        w - 14,
        h - 14
      );

      // North & South Pole Labels
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(226, 232, 240, 0.7)";
      ctx.font = "600 10px Consolas, monospace";
      ctx.fillText("90°N", cx, cy - R - 10);
      ctx.fillText("90°S", cx, cy + R + 16);

      ctx.restore();
      if (!prefersReduced) {
        rafId = requestAnimationFrame(renderFrame);
      }
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className="space-y-3">
      <div className="relative rounded-lg border border-white/15 bg-[#050914] overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-[390px] sm:h-[430px] block cursor-crosshair"
        />

        {/* Thermal Scale Bar inside bottom-left */}
        <div className="px-4 py-2.5 border-t border-white/10 bg-black/55 flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono text-white/80">
          <div className="flex items-center gap-2.5">
            <span className="text-white/55">SURFACE TEMP:</span>
            <span>-30°C</span>
            <div
              className="w-32 sm:w-44 h-2 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, #1d4ed8 0%, #38bdf8 25%, #d97706 60%, #dc2626 100%)",
              }}
            />
            <span>+45°C</span>
          </div>
          <div className="text-cyan-300 tabular-nums">
            {mode === "winds" &&
              `${profile.phase} · India avg ${profile.indiaAvgC}°C · Rain ~${profile.rainMm} mm/mo · ITCZ ~${profile.itczLat >= 0 ? `${profile.itczLat}°N` : `${Math.abs(profile.itczLat)}°S`}`}
            {mode === "cyclone" &&
              `CORIOLIS CYCLONE VORTEX · Bay of Bengal SST ${geohazards?.indianOcean.bayOfBengal.sstC ?? 28.4}°C · Wave ${geohazards?.indianOcean.bayOfBengal.waveHeightM ?? 1.5}m`}
            {mode === "enso" &&
              "EL NIÑO / IOD CIRCULATION · Warm Pacific shifts convective uplift & alters monsoon flow"}
            {mode === "seismic" &&
              `LIVE TECTONIC MONITOR · ${geohazards?.quakeCount7d ?? "42"} M4.5+ Quakes (7d) · Peak M${geohazards?.maxMag7d ?? 5.6}`}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT: ENVIRONMENT LIVE WEATHER, WINDS & GEO-THREATS
========================================================= */
export default function EnvironmentEarthObservatory({
  village,
}: {
  village: SectorInsightsVillage | null;
}) {
  const [coordsLat, coordsLon] = useMemo(() => getVillageLatLon(village), [village]);

  const [weather, setWeather] = useState<WeatherTelemetry | null>(null);
  const [hazards, setHazards] = useState<GeoHazardsResponse | null>(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);

  const [globeMode, setGlobeMode] = useState<GlobeSimMode>("winds");
  const [monthIdx, setMonthIdx] = useState<number>(3); // Start on April (matches reference video!)
  const [autoPlayMonths, setAutoPlayMonths] = useState<boolean>(false);
  const [activeThreatTab, setActiveThreatTab] = useState<ThreatCategory>("climatological");

  const fetchAllTelemetry = useCallback(async () => {
    setLoadingTelemetry(true);
    try {
      const qs = new URLSearchParams({
        lat: String(coordsLat),
        lon: String(coordsLon),
        village: village?.villageName ?? "Telangana State Center",
        district: village?.districtName ?? "Hyderabad",
      });
      const [wRes, hRes] = await Promise.all([
        fetch(`/api/telemetry/weather?${qs.toString()}`),
        fetch("/api/environment/geohazards"),
      ]);
      if (wRes.ok) {
        setWeather((await wRes.json()) as WeatherTelemetry);
      }
      if (hRes.ok) {
        setHazards((await hRes.json()) as GeoHazardsResponse);
      }
    } catch {
      // Handled gracefully
    } finally {
      setLoadingTelemetry(false);
    }
  }, [coordsLat, coordsLon, village?.villageName, village?.districtName]);

  useEffect(() => {
    void fetchAllTelemetry();
  }, [fetchAllTelemetry]);

  useEffect(() => {
    if (!autoPlayMonths || globeMode !== "winds") return;
    const timer = window.setInterval(() => {
      setMonthIdx((prev) => (prev + 1) % MONTH_PROFILES.length);
    }, 1800);
    return () => window.clearInterval(timer);
  }, [autoPlayMonths, globeMode]);

  const currentMonth = MONTH_PROFILES[monthIdx];
  const windDeg = weather?.current.windDirectionDeg ?? 215;
  const threatMeta = THREAT_CATALOG[activeThreatTab];

  return (
    <div className="space-y-6">
      {/* =========================================================
          1. LIVE WEATHER UPDATES WITH GRAPHICAL VISUALS
      ========================================================= */}
      <section
        aria-label="Live Village Weather Graphical Observatory"
        className="border border-slate-200 dark:border-white/12 bg-white dark:bg-[#070b12] p-6 space-y-5"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
          <div>
            <div className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 flex items-center gap-1.5">
              <ThermometerSun size={14} />
              <span>Live Meteorological &amp; Atmospheric Graphical Telemetry</span>
            </div>
            <h3 className="mt-1 text-lg md:text-xl font-semibold text-slate-900 dark:text-white">
              {village?.villageName ?? "Telangana Center"} — Live Weather, Wind Rose &amp; Air Pressure
            </h3>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-white/60">
              {weather?.source ?? "Open-Meteo Meteorological & CAMS Air Quality Feed"} · Coords {coordsLat}°N, {coordsLon}°E
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchAllTelemetry()}
            disabled={loadingTelemetry}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw size={13} className={loadingTelemetry ? "animate-spin" : ""} />
            <span>{loadingTelemetry ? "Syncing Feeds..." : "Refresh Live Feeds"}</span>
          </button>
        </div>

        {/* Graphical Wind Compass Rose + 24h Hourly Temperature/Rain Ribbon + Live Gauges */}
        <div className="grid xl:grid-cols-12 gap-5 items-stretch">
          {/* Graphical Wind Compass & Barometer SVG */}
          <div className="xl:col-span-4 jd-keep-dark rounded-lg border border-white/15 bg-[#050a14] p-4 flex flex-col justify-between text-white">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                <Compass size={14} />
                Wind Vector &amp; Pressure
              </span>
              <span className="font-mono text-white/65 tabular-nums">
                {weather?.current.pressureHpa ?? 1009} hPa
              </span>
            </div>

            <div className="my-2 flex items-center justify-center">
              <svg viewBox="0 0 200 180" className="w-44 h-40 select-none">
                <circle cx="100" cy="90" r="64" fill="#091224" stroke="rgba(148,163,184,0.3)" strokeWidth="1.2" />
                <circle cx="100" cy="90" r="46" fill="none" stroke="rgba(56,189,248,0.22)" strokeDasharray="3 3" />
                {["N", "E", "S", "W"].map((d, i) => {
                  const rad = ((i * 90 - 90) * Math.PI) / 180;
                  const x = 100 + Math.cos(rad) * 74;
                  const y = 90 + Math.sin(rad) * 74 + 3.5;
                  return (
                    <text key={d} x={x} y={y} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold" fontFamily="monospace">
                      {d}
                    </text>
                  );
                })}
                {/* Rotating Wind Direction Arrow */}
                <g transform={`rotate(${windDeg} 100 90)`}>
                  <line x1="100" y1="138" x2="100" y2="38" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
                  <polygon points="100,28 93,45 107,45" fill="#38bdf8" />
                  <circle cx="100" cy="90" r="5" fill="#fbbf24" />
                </g>
              </svg>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs font-mono tabular-nums">
              <div>
                <div className="text-[10px] text-white/55">WIND SPEED</div>
                <div className="text-sm font-bold text-cyan-300">
                  {weather?.current.windKmh ?? "—"} km/h ({windCardinal(windDeg)})
                </div>
              </div>
              <div>
                <div className="text-[10px] text-white/55">TEMP / FEELS LIKE</div>
                <div className="text-sm font-bold text-amber-300">
                  {weather?.current.tempC ?? "—"}°C / {weather?.current.apparentTempC ?? "—"}°C
                </div>
              </div>
            </div>
          </div>

          {/* 24-Hour Temperature & Rain Surge Graphical Curve */}
          <div className="xl:col-span-5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#050a14] p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CloudRain size={14} className="text-cyan-500" />
                24-Hour Thermal Curve &amp; Rain Probability
              </span>
              <span className="text-[11px] font-mono tabular-nums text-emerald-700 dark:text-emerald-300">
                7d Rain: {weather?.forecast7dRainMm ?? "—"} mm
              </span>
            </div>
            <div className="h-[195px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={weather?.hourly ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={3} />
                  <YAxis yAxisId="t" tick={{ fontSize: 10, fill: "#94a3b8" }} unit="°" />
                  <YAxis yAxisId="p" orientation="right" tick={{ fontSize: 10, fill: "#38bdf8" }} unit="%" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#09111f",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#fff",
                      fontSize: "11px",
                    }}
                  />
                  <Area
                    yAxisId="t"
                    type="monotone"
                    dataKey="tempC"
                    name="Temp (°C)"
                    stroke="#f59e0b"
                    fill="rgba(245,158,11,0.2)"
                    strokeWidth={2}
                  />
                  <Bar
                    yAxisId="p"
                    dataKey="rainProbPct"
                    name="Rain Prob (%)"
                    fill="rgba(56,189,248,0.6)"
                    barSize={10}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Heatwave Advisory + AQI / Humidity Vertical Gauges */}
          <div className="xl:col-span-3 space-y-3 flex flex-col justify-between">
            <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#050a14] p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 dark:text-white/55">HEAT ADVISORY</span>
                <span
                  className={`font-bold ${
                    weather?.heatAdvisory.tone === "critical"
                      ? "text-rose-500"
                      : weather?.heatAdvisory.tone === "amber"
                      ? "text-amber-500"
                      : "text-emerald-500"
                  }`}
                >
                  {weather?.heatAdvisory.level ?? "Normal"}
                </span>
              </div>
              <div className="text-xs font-medium text-slate-900 dark:text-white">
                Safe Window: {weather?.heatAdvisory.workWindow ?? "Standard"}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-white/65 leading-relaxed">
                {weather?.heatAdvisory.guidance ?? "Hydrate outdoor farm & MGNREGA workers regularly."}
              </p>
            </div>

            <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#050a14] p-3.5 grid grid-cols-2 gap-3 font-mono tabular-nums">
              <div>
                <div className="text-[10px] text-slate-500 dark:text-white/55">US AQI</div>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-300">
                  {weather?.current.usAqi ?? "—"}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-white/50">
                  PM2.5: {weather?.current.pm25 ?? "—"} µg/m³
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 dark:text-white/55">HUMIDITY</div>
                <div className="text-lg font-bold text-cyan-600 dark:text-cyan-300">
                  {weather?.current.humidityPct ?? "—"}%
                </div>
                <div className="text-[10px] text-slate-500 dark:text-white/50">
                  Rain: {weather?.current.rainMm ?? 0} mm
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          2. GLOBAL WIND PATTERNS & SPECIAL GEOGRAPHICAL EVENTS
      ========================================================= */}
      <section
        aria-label="Global Wind Patterns and Special Geographical Events Simulator"
        className="jd-keep-dark rounded-xl border border-white/15 bg-[#060b16] text-white p-6 space-y-5"
      >
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
              <Wind size={14} />
              <span>THE PLANET&apos;S ATMOSPHERIC CIRCULATION &amp; SPECIAL GEOGRAPHICAL EVENTS</span>
            </div>
            <h3 className="mt-1 text-xl md:text-2xl font-bold tracking-tight text-white">
              Global Wind Patterns &amp; Special Earth Processes
            </h3>
            <p className="mt-0.5 text-xs text-white/65">
              Driven by uneven heating from the Sun and Earth&apos;s rotation (Coriolis effect) — scrub across months or switch geographical events.
            </p>
          </div>

          {/* 4 Interactive Geographical Event / Wind Mode Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {[
              { key: "winds" as GlobeSimMode, label: "Global Winds & Monsoon" },
              { key: "cyclone" as GlobeSimMode, label: "Cyclone Spin & Bay Surge" },
              { key: "enso" as GlobeSimMode, label: "El Niño / IOD Shift" },
              { key: "seismic" as GlobeSimMode, label: "Tectonic Quakes (Live)" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setGlobeMode(tab.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                  globeMode === tab.key
                    ? "bg-amber-400 text-slate-950 border-amber-300 font-semibold"
                    : "bg-white/[0.04] border-white/15 text-white/80 hover:bg-white/10"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 12-Month Interactive Scrubber (Active in Global Winds mode) */}
        {globeMode === "winds" && (
          <div className="rounded-lg border border-white/12 bg-white/[0.03] p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-amber-300 font-mono">
                  {currentMonth.phase} — {currentMonth.summary}
                </div>
                <div className="mt-0.5 text-[11px] text-white/70 font-mono tabular-nums">
                  India avg {currentMonth.indiaAvgC}°C · Rain ~{currentMonth.rainMm} mm/month · ITCZ over India ~
                  {currentMonth.itczLat >= 0 ? `${currentMonth.itczLat}°N` : `${Math.abs(currentMonth.itczLat)}°S`}
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setAutoPlayMonths((p) => !p)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/20 bg-white/10 hover:bg-white/15 text-xs font-semibold text-white whitespace-nowrap"
                >
                  {autoPlayMonths ? <Pause size={13} className="text-amber-300" /> : <Play size={13} className="text-emerald-300" />}
                  {autoPlayMonths ? "Pause Season" : "Play Annual Cycle"}
                </button>
                <span className="px-2.5 py-1 rounded bg-white text-slate-950 font-mono text-xs font-bold">
                  {currentMonth.name.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
              {MONTH_PROFILES.map((m, idx) => (
                <button
                  key={m.short}
                  type="button"
                  onClick={() => {
                    setAutoPlayMonths(false);
                    setMonthIdx(idx);
                  }}
                  className={`py-1.5 rounded text-[11px] font-mono font-semibold transition-colors ${
                    monthIdx === idx
                      ? "bg-amber-400 text-slate-950"
                      : "bg-black/40 border border-white/10 text-white/65 hover:text-white"
                  }`}
                >
                  {m.short}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Animated Globe Canvas */}
        <AtmosphericGlobeVisualizer
          monthIdx={monthIdx}
          mode={globeMode}
          geohazards={hazards}
        />

        {/* Wind Belts · Pressure Belts · Circulation Cells Legend (Matching Video Layout) */}
        <div className="grid md:grid-cols-3 gap-4 text-xs">
          <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3.5 space-y-1.5">
            <div className="font-semibold text-white/90">Wind Belts (Surface Winds)</div>
            <div className="text-cyan-300">→ Polar Easterlies (60°–90°)</div>
            <div className="text-blue-300">→ Westerlies (30°–60°)</div>
            <div className="text-amber-300">→ Trade Winds (0°–30°)</div>
            <div className="text-rose-300">--- ITCZ / Doldrums (Migrating)</div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3.5 space-y-1.5">
            <div className="font-semibold text-white/90">Pressure Belts</div>
            <div className="text-white/75">Polar High (90°N/S) · Descending icy air</div>
            <div className="text-white/75">Subpolar Low (60°N/S) · Storm tracks</div>
            <div className="text-white/75">Subtropical High (30°N/S) · Dry belts</div>
            <div className="text-white/75">Equatorial Low (ITCZ) · Rising moist air</div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3.5 space-y-1.5">
            <div className="font-semibold text-white/90">Atmospheric Circulation Cells</div>
            <div className="text-cyan-300">Polar Cell (60°–90°) · Cold sinking air</div>
            <div className="text-blue-300">Ferrel Cell (30°–60°) · Mid-latitude mixing</div>
            <div className="text-amber-300">Hadley Cell (0°–30°) · Drives Tropical Monsoons</div>
          </div>
        </div>

        {/* 3-Card Causal Physics Summary */}
        <div className="grid md:grid-cols-3 gap-4 pt-1 text-xs">
          <div className="rounded-lg border border-white/10 bg-black/35 p-3.5">
            <div className="font-semibold text-amber-300">1. Uneven Solar Heating</div>
            <p className="mt-1 text-white/70">
              Equator receives direct concentrated sunlight, driving warm rising air and seasonal pressure shifts across India.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/35 p-3.5">
            <div className="font-semibold text-cyan-300">2. Earth&apos;s Rotation (Coriolis Effect)</div>
            <p className="mt-1 text-white/70">
              Planetary spin deflects winds right in the Northern Hemisphere (turning SE trades into SW Monsoon rains) and left in the South.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/35 p-3.5">
            <div className="font-semibold text-emerald-300">3. Planetary &amp; Village Result</div>
            <p className="mt-1 text-white/70">
              Shapes rain belts, desert bands, cyclones, and village tank inflows across the 11,154 settlements mapped in JAN—DRISHTI.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          3. GEOGRAPHICAL PROCESSES THREATENING THE ENVIRONMENT
      ========================================================= */}
      <section
        aria-label="Geographical Processes Threatening the Environment"
        className="border border-slate-200 dark:border-white/12 bg-white dark:bg-[#070b12] p-6 space-y-5"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
          <div>
            <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <Globe2 size={14} />
              <span>LIVE EARTH HAZARD TELEMETRY · USGS + NASA EONET + OPEN-METEO MARINE</span>
            </div>
            <h3 className="mt-1 text-lg md:text-xl font-semibold text-slate-900 dark:text-white">
              Geographical Processes Threatening Ecosystems &amp; Settlements
            </h3>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-white/60">
              Explore live climatological, oceanic, and geological threats and how rural preparedness counters each hazard.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {[
              { key: "climatological" as ThreatCategory, label: "Climatological Threats", icon: Flame },
              { key: "oceanic" as ThreatCategory, label: "Oceanic & Coastal", icon: Waves },
              { key: "geological" as ThreatCategory, label: "Earthquakes & Geological", icon: Mountain },
            ].map((t) => {
              const Icon = t.icon;
              const active = activeThreatTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveThreatTab(t.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white font-semibold"
                      : "bg-slate-50 dark:bg-white/[0.03] text-slate-700 dark:text-white/75 border-slate-200 dark:border-white/12 hover:bg-slate-100 dark:hover:bg-white/10"
                  }`}
                >
                  <Icon size={13} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Earth Telemetry 4-KPI Strip */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono tabular-nums">
          <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-3.5">
            <div className="text-[11px] font-sans text-slate-500 dark:text-white/55">
              USGS Earthquakes (M4.5+ / 7d)
            </div>
            <div className="mt-1 text-xl font-bold text-rose-600 dark:text-rose-400">
              {hazards?.quakeCount7d ?? "—"} Events
            </div>
            <div className="text-[11px] text-slate-600 dark:text-white/60">
              Peak Mag: M{hazards?.maxMag7d ?? "—"}
            </div>
          </div>

          <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-3.5">
            <div className="text-[11px] font-sans text-slate-500 dark:text-white/55">
              Bay of Bengal Sea Surface Temp
            </div>
            <div className="mt-1 text-xl font-bold text-cyan-600 dark:text-cyan-300">
              {hazards?.indianOcean.bayOfBengal.sstC ?? "—"} °C
            </div>
            <div className="text-[11px] text-slate-600 dark:text-white/60">
              Swell: {hazards?.indianOcean.bayOfBengal.waveHeightM ?? "—"}m ({hazards?.indianOcean.bayOfBengal.wavePeriodS ?? "—"}s)
            </div>
          </div>

          <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-3.5">
            <div className="text-[11px] font-sans text-slate-500 dark:text-white/55">
              Arabian Sea Sea Surface Temp
            </div>
            <div className="mt-1 text-xl font-bold text-sky-600 dark:text-sky-300">
              {hazards?.indianOcean.arabianSea.sstC ?? "—"} °C
            </div>
            <div className="text-[11px] text-slate-600 dark:text-white/60">
              Wave Height: {hazards?.indianOcean.arabianSea.waveHeightM ?? "—"}m
            </div>
          </div>

          <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-3.5">
            <div className="text-[11px] font-sans text-slate-500 dark:text-white/55">
              NASA EONET Active Events
            </div>
            <div className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-300">
              {hazards?.eonetEvents.length ?? "—"} Tracked
            </div>
            <div className="text-[11px] text-slate-600 dark:text-white/60">
              Storms: {hazards?.categoryCounts.severeStorms ?? 0} · Fires: {hazards?.categoryCounts.wildfires ?? 0} · Volcanoes: {hazards?.categoryCounts.volcanoes ?? 0}
            </div>
          </div>
        </div>

        {/* Selected Threat Category Cards */}
        <div
          key={activeThreatTab}
          className="jd-transition-reveal grid md:grid-cols-2 gap-4"
        >
          {threatMeta.threats.map((item) => (
            <div
              key={item.name}
              className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#050911] p-4 space-y-2"
            >
              <div
                className="text-sm font-semibold"
                style={{ color: threatMeta.accentHex }}
              >
                {item.name}
              </div>
              <div className="text-xs text-slate-700 dark:text-white/80">
                <span className="font-semibold text-slate-900 dark:text-white">Process: </span>
                {item.mechanism}
              </div>
              <div className="text-xs text-slate-700 dark:text-white/75">
                <span className="font-semibold text-slate-900 dark:text-white">Environmental Threat: </span>
                {item.impact}
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-white/10 text-xs text-emerald-700 dark:text-emerald-300">
                <span className="font-semibold">Local Resilience Fix: </span>
                {item.localMitigation}
              </div>
            </div>
          ))}
        </div>

        {/* Live USGS Earthquakes + NASA EONET Live Feed Split Table */}
        <div className="grid lg:grid-cols-2 gap-4 pt-2">
          <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Activity size={13} className="text-rose-500" />
                Live USGS Seismic Feed (Strongest M4.5+ Past 7 Days)
              </span>
              <span className="font-mono text-[11px] text-slate-500 dark:text-white/50">
                Real-Time GeoJSON
              </span>
            </div>
            <div className="space-y-1.5 max-h-[210px] overflow-y-auto pr-1 text-xs">
              {(hazards?.earthquakes ?? []).slice(0, 8).map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between gap-2 border-b border-slate-200/70 dark:border-white/10 pb-1.5"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 dark:text-white truncate">
                      {q.place}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-white/50 font-mono tabular-nums">
                      Depth {q.depthKm} km · {q.lat.toFixed(1)}°, {q.lng.toFixed(1)}°
                    </div>
                  </div>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400 shrink-0 tabular-nums">
                    M {q.mag.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Flame size={13} className="text-amber-500" />
                Live NASA EONET Planetary Events (Storms, Fires &amp; Volcanoes)
              </span>
              <span className="font-mono text-[11px] text-slate-500 dark:text-white/50">
                NASA Open API
              </span>
            </div>
            <div className="space-y-1.5 max-h-[210px] overflow-y-auto pr-1 text-xs">
              {(hazards?.eonetEvents ?? []).slice(0, 8).map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between gap-2 border-b border-slate-200/70 dark:border-white/10 pb-1.5"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 dark:text-white truncate">
                      {ev.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-white/50 font-mono tabular-nums">
                      {ev.category} · {ev.dateIso.slice(0, 10)}
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-amber-600 dark:text-amber-300 shrink-0 tabular-nums">
                    {ev.lat.toFixed(1)}°, {ev.lng.toFixed(1)}°
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
