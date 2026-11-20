import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CloudRain,
  Droplets,
  RefreshCw,
  ShieldAlert,
  SlidersHorizontal,
  Waves,
} from "lucide-react";
import type { SectorInsightsVillage } from "./SectorActionModules";

type HydroMode = "unprotected" | "managed";

type WeatherHydroPayload = {
  source: string;
  current: {
    tempC: number;
    humidityPct: number;
    rainMm: number;
  };
  agroHydro?: {
    soilTemp6cm: number;
    soilMoistureTop: number;
    soilMoistureRoot: number;
    et0MmDay: number;
    elevationM: number;
  };
  forecast7dRainMm: number;
};

const WATER_THREATS = [
  {
    name: "Fluoride, Nitrate & Salinity Leaching",
    process: "Deep pumping pulls mineral-saturated water from fractured Deccan granite aquifers.",
    risk: "Causes dental/skeletal fluorosis in children and elevated dissolved solids in drinking wells.",
    fix: "Dilute deep aquifers via checkdam & stepwell percolation + weekly youth Jal Mitra TDS checks.",
  },
  {
    name: "Monsoon Microbial & Sewage Runoff",
    process: "Stormwater sweeps unlined open drains and organic litter straight into low-lying ponds & streams.",
    risk: "Triggers seasonal gastro outbreaks and algal eutrophication choking dissolved oxygen.",
    fix: "Constructed reed-bed bio-filters + greywater household soak pits before every village pond.",
  },
  {
    name: "Cone of Depression & Borewell Dryout",
    process: "Adjacent heavy borewell pumping drops the local water table faster than clay layers recharge.",
    risk: "Shallow community handpumps and small-farmer wells go dry mid-summer, causing drinking stress.",
    fix: "Pre-Kharif village water budgeting + drip micro-irrigation + defunct borewell recharge shafts.",
  },
  {
    name: "Silted Feeder Canals & Flash-Flood Bypass",
    process: "Weed-choked feeder channels & silted village ponds (kuntas) lose 40–60% natural storage.",
    risk: "Monsoon cloudbursts spill unused over bunds instead of refilling village reservoirs.",
    fix: "Pre-monsoon community shramdaan desilting across ponds, lakes, streams, canals & checkdams.",
  },
];

function getLatLon(village: SectorInsightsVillage | null): [number, number] {
  if (typeof village?.lat === "number" && typeof village?.lon === "number") {
    return [village.lat, village.lon];
  }
  return [17.385, 78.4867];
}

function HydrologicalCycleCanvas({
  mode,
  rainIntensity,
  extractionPct,
}: {
  mode: HydroMode;
  rainIntensity: number;
  extractionPct: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ mode, rainIntensity, extractionPct });
  stateRef.current = { mode, rainIntensity, extractionPct };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const raindrops = Array.from({ length: 90 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.52,
      len: 7 + Math.random() * 7,
      vy: 0.008 + Math.random() * 0.008,
    }));

    const percolationDrops = Array.from({ length: 48 }, () => ({
      x: 0.12 + Math.random() * 0.76,
      y: 0.56 + Math.random() * 0.34,
      vy: 0.0018 + Math.random() * 0.0016,
    }));

    const vaporWisps = Array.from({ length: 24 }, (_, i) => ({
      x: 0.14 + (i / 24) * 0.72,
      y: 0.52 - Math.random() * 0.28,
      vy: 0.0014 + Math.random() * 0.0012,
    }));

    let rafId = 0;
    let t = 0;

    const draw = () => {
      t += prefersReduced ? 0 : 1;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(320, rect.width);
      const h = Math.max(320, rect.height);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }

      const { mode: m, rainIntensity: rain, extractionPct: ext } = stateRef.current;
      const isManaged = m === "managed";

      // Compute dynamic aquifer depth (higher number = healthier shallow water table)
      const netHealth = Math.max(
        0.15,
        Math.min(0.95, (isManaged ? 0.62 : 0.32) + (rain / 100) * 0.35 - (ext / 100) * 0.38)
      );

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // 1. Atmosphere Sky
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.54);
      sky.addColorStop(0, "#050c1a");
      sky.addColorStop(1, isManaged ? "#0e2948" : "#182235");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h * 0.54);

      // Condensation Clouds
      const cloudAlpha = 0.25 + (rain / 100) * 0.55;
      const cloudCenters = [0.22, 0.45, 0.72];
      cloudCenters.forEach((cxRatio, idx) => {
        const drift = prefersReduced ? 0 : Math.sin(t * 0.012 + idx) * 14;
        const cx = w * cxRatio + drift;
        const cy = h * (0.14 + (idx % 2) * 0.04);
        ctx.fillStyle = `rgba(186, 230, 253, ${cloudAlpha})`;
        ctx.beginPath();
        ctx.arc(cx, cy, 24, 0, Math.PI * 2);
        ctx.arc(cx + 22, cy - 6, 20, 0, Math.PI * 2);
        ctx.arc(cx + 42, cy + 2, 18, 0, Math.PI * 2);
        ctx.arc(cx - 20, cy + 4, 17, 0, Math.PI * 2);
        ctx.fill();
      });

      // Rising Evaporation / Transpiration Wisps
      ctx.strokeStyle = "rgba(125, 211, 252, 0.38)";
      ctx.lineWidth = 1.4;
      for (const v of vaporWisps) {
        if (!prefersReduced) {
          v.y -= v.vy;
          if (v.y < 0.2) v.y = 0.52;
        }
        const vx = v.x * w + Math.sin(t * 0.05 + v.x * 20) * 4;
        const vy = v.y * h;
        ctx.beginPath();
        ctx.moveTo(vx, vy + 9);
        ctx.quadraticCurveTo(vx + 4, vy + 4, vx, vy);
        ctx.stroke();
      }

      // Falling Monsoon Rain
      const activeDrops = Math.round((rain / 100) * raindrops.length);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.4;
      for (let i = 0; i < activeDrops; i++) {
        const d = raindrops[i];
        if (!prefersReduced) {
          d.y += d.vy * (0.6 + rain / 90);
          if (d.y > 0.53) {
            d.y = 0.16;
            d.x = Math.random();
          }
        }
        ctx.beginPath();
        ctx.moveTo(d.x * w, d.y * h);
        ctx.lineTo(d.x * w - 2, d.y * h + d.len);
        ctx.stroke();
      }

      // 2. Topsoil & Subsurface Strata
      const groundY = h * 0.53;
      ctx.fillStyle = isManaged ? "#133528" : "#26231d";
      ctx.fillRect(0, groundY, w, h * 0.12);

      // Fractured Granite Zone
      ctx.fillStyle = "#111827";
      ctx.fillRect(0, groundY + h * 0.12, w, h * 0.35);

      // 3. Saturated Aquifer Table Level (Dynamic!)
      const aquiferTopY = h * 0.96 - netHealth * (h * 0.28);
      const aqGrad = ctx.createLinearGradient(0, aquiferTopY, 0, h);
      aqGrad.addColorStop(0, "rgba(14, 165, 233, 0.72)");
      aqGrad.addColorStop(1, "rgba(3, 105, 161, 0.92)");
      ctx.fillStyle = aqGrad;
      ctx.fillRect(0, aquiferTopY, w, h - aquiferTopY);

      // Water Table Horizon Glow Line
      ctx.beginPath();
      ctx.moveTo(0, aquiferTopY);
      ctx.lineTo(w, aquiferTopY);
      ctx.strokeStyle = "#7dd3fc";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4. Surface Waterbodies (Pond / Kunta, Checkdam, Stream, Stepwell)
      // Checkdam Pond Basin
      const basinX = w * 0.12;
      const basinW = w * 0.24;
      const pondLevel = isManaged ? 18 : 7;
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(basinX, groundY - 4, basinW, 18);
      ctx.fillStyle = isManaged ? "#0ea5e9" : "#78716c";
      ctx.fillRect(basinX + 4, groundY + 12 - pondLevel, basinW - 8, pondLevel);

      // Checkdam Wall & Overflow Stream
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(basinX + basinW, groundY - 12, 10, 26);

      // Borewell Pipe & Cone of Depression
      const wellX = w * 0.68;
      ctx.fillStyle = "#475569";
      ctx.fillRect(wellX - 4, groundY - 18, 8, h * 0.36);
      // Extraction Pump Head
      ctx.fillStyle = ext > 60 ? "#f43f5e" : "#10b981";
      ctx.fillRect(wellX - 10, groundY - 24, 20, 8);

      // Percolation Drops Moving Down Into Aquifer (Faster when Managed Recharge is active!)
      const percCount = isManaged ? percolationDrops.length : Math.round(percolationDrops.length * 0.3);
      for (let i = 0; i < percCount; i++) {
        const pd = percolationDrops[i];
        if (!prefersReduced) {
          pd.y += pd.vy * (isManaged ? 1.45 : 0.6);
          if (pd.y > 0.92) pd.y = 0.54;
        }
        ctx.beginPath();
        ctx.arc(pd.x * w, pd.y * h, isManaged ? 2.8 : 2, 0, Math.PI * 2);
        ctx.fillStyle = isManaged ? "#38bdf8" : "rgba(148,163,184,0.6)";
        ctx.fill();
      }

      // Clean Telemetry Overlay Labels
      ctx.font = "600 11px Calibri, sans-serif";
      ctx.fillStyle = "#bae6fd";
      ctx.fillText("EVAPORATION & CONDENSATION", w * 0.04, h * 0.09);
      ctx.fillStyle = "#fde68a";
      ctx.fillText(
        isManaged ? "MANAGED PONDS, LAKES & CHECKDAMS (HIGH RECHARGE)" : "SILTED WATERBODIES (FAST SURFACE RUNOFF LOSS)",
        w * 0.04,
        groundY - 18
      );
      ctx.fillStyle = "#7dd3fc";
      ctx.font = "bold 11px Consolas, monospace";
      ctx.fillText(
        `SATURATED AQUIFER STORAGE: ${Math.round(netHealth * 100)}%`,
        w * 0.04,
        aquiferTopY - 8
      );
      ctx.fillStyle = ext > 60 ? "#fda4af" : "#6ee7b7";
      ctx.fillText(
        `BOREWELL PUMPING (${ext}%)`,
        wellX + 16,
        groundY - 12
      );

      ctx.restore();
      if (!prefersReduced) {
        rafId = requestAnimationFrame(draw);
      }
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[330px] sm:h-[360px] rounded-lg border border-white/15 bg-[#050c1a] block cursor-crosshair"
    />
  );
}

export default function WaterHydrologyObservatory({
  village,
}: {
  village: SectorInsightsVillage | null;
}) {
  const [coordsLat, coordsLon] = useMemo(() => getLatLon(village), [village]);
  const [hydroData, setHydroData] = useState<WeatherHydroPayload | null>(null);
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState<HydroMode>("managed");
  const [rainIntensity, setRainIntensity] = useState<number>(65);
  const [extractionPct, setExtractionPct] = useState<number>(40);

  const fetchHydro = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        lat: String(coordsLat),
        lon: String(coordsLon),
        village: village?.villageName ?? "Telangana Village",
        district: village?.districtName ?? "Hyderabad",
      });
      const r = await fetch(`/api/telemetry/weather?${qs.toString()}`);
      if (r.ok) {
        setHydroData((await r.json()) as WeatherHydroPayload);
      }
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  }, [coordsLat, coordsLon, village?.villageName, village?.districtName]);

  useEffect(() => {
    void fetchHydro();
  }, [fetchHydro]);

  const topMoistPct = Math.round((hydroData?.agroHydro?.soilMoistureTop ?? 0.24) * 100);
  const rootMoistPct = Math.round((hydroData?.agroHydro?.soilMoistureRoot ?? 0.29) * 100);

  return (
    <div className="space-y-6">
      {/* Live Watershed & Subsurface Aquifer Interactive Visual */}
      <section className="jd-keep-dark rounded-xl border border-white/15 bg-[#060c18] text-white p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
              <Waves size={14} />
              <span>HYDROLOGICAL CYCLE, ALL-WATERBODY &amp; AQUIFER SIMULATOR</span>
            </div>
            <h3 className="mt-1 text-xl font-bold text-white">
              How Rainfall, Ponds, Streams &amp; Recharge Shafts Refill Village Aquifers
            </h3>
            <p className="mt-0.5 text-xs text-white/65">
              Compare silted runoff vs. managed waterbody recharge alongside live Open-Meteo soil moisture &amp; evaporation for{" "}
              <span className="text-white font-medium">{village?.villageName ?? "selected village"}</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setMode("unprotected")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap ${
                mode === "unprotected"
                  ? "bg-amber-500 text-slate-950 border-amber-400 font-semibold"
                  : "bg-white/[0.04] border-white/15 text-white/75 hover:bg-white/10"
              }`}
            >
              Unprotected Silted Runoff
            </button>
            <button
              type="button"
              onClick={() => setMode("managed")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap ${
                mode === "managed"
                  ? "bg-cyan-400 text-slate-950 border-cyan-300 font-semibold"
                  : "bg-white/[0.04] border-white/15 text-white/75 hover:bg-white/10"
              }`}
            >
              Managed Waterbody Recharge
            </button>
            <button
              type="button"
              onClick={() => void fetchHydro()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/15 bg-white/5 hover:bg-white/10 text-xs text-white whitespace-nowrap"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              Sync Soil
            </button>
          </div>
        </div>

        {/* Animated Cycle Canvas */}
        <HydrologicalCycleCanvas
          mode={mode}
          rainIntensity={rainIntensity}
          extractionPct={extractionPct}
        />

        {/* Interactive Rain & Borewell Extraction Sliders + Live Soil Moisture Telemetry */}
        <div className="grid lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-6 grid sm:grid-cols-2 gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <label className="space-y-1.5 text-xs">
              <div className="flex justify-between font-mono">
                <span className="text-white/75 flex items-center gap-1.5">
                  <CloudRain size={13} className="text-cyan-300" />
                  Monsoon Rain Intensity
                </span>
                <span className="text-cyan-300 font-bold tabular-nums">{rainIntensity}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={rainIntensity}
                onChange={(e) => setRainIntensity(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </label>

            <label className="space-y-1.5 text-xs">
              <div className="flex justify-between font-mono">
                <span className="text-white/75 flex items-center gap-1.5">
                  <SlidersHorizontal size={13} className="text-rose-300" />
                  Borewell Extraction Load
                </span>
                <span className="text-rose-300 font-bold tabular-nums">{extractionPct}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={95}
                value={extractionPct}
                onChange={(e) => setExtractionPct(Number(e.target.value))}
                className="w-full accent-rose-400 cursor-pointer"
              />
            </label>
          </div>

          {/* 4 Live Open-Meteo Hydro-Soil Gauges */}
          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono tabular-nums">
            <div className="rounded-lg border border-white/10 bg-black/40 p-3">
              <div className="text-[10px] text-white/55 font-sans">Topsoil Moisture</div>
              <div className="mt-1 text-lg font-bold text-cyan-300">{topMoistPct}%</div>
              <div className="text-[10px] text-white/50">0–7 cm depth</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/40 p-3">
              <div className="text-[10px] text-white/55 font-sans">Root-Zone Moisture</div>
              <div className="mt-1 text-lg font-bold text-emerald-300">{rootMoistPct}%</div>
              <div className="text-[10px] text-white/50">7–28 cm depth</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/40 p-3">
              <div className="text-[10px] text-white/55 font-sans">Evapotranspiration</div>
              <div className="mt-1 text-lg font-bold text-amber-300">
                {hydroData?.agroHydro?.et0MmDay ?? "4.6"} mm
              </div>
              <div className="text-[10px] text-white/50">Daily water loss</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/40 p-3">
              <div className="text-[10px] text-white/55 font-sans">7-Day Inflow</div>
              <div className="mt-1 text-lg font-bold text-sky-300">
                {hydroData?.forecast7dRainMm ?? "—"} mm
              </div>
              <div className="text-[10px] text-white/50">Elev {Math.round(hydroData?.agroHydro?.elevationM ?? 490)}m</div>
            </div>
          </div>
        </div>
      </section>

      {/* Water Quality & Scarcity Threats Matrix */}
      <section className="border border-slate-200 dark:border-white/12 bg-white dark:bg-[#070b12] p-6 space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <ShieldAlert size={16} className="text-cyan-500" />
            <span>Critical Threats to Local Waterbodies &amp; Groundwater</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-white/55 flex items-center gap-1">
            <Droplets size={12} className="text-cyan-500" />
            Lakes · Ponds (Kuntas) · Streams · Checkdams · Stepwells
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {WATER_THREATS.map((wt) => (
            <div
              key={wt.name}
              className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#050911] p-4 space-y-2"
            >
              <div className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">
                {wt.name}
              </div>
              <div className="text-xs text-slate-700 dark:text-white/80">
                <span className="font-semibold text-slate-900 dark:text-white">Mechanism: </span>
                {wt.process}
              </div>
              <div className="text-xs text-slate-700 dark:text-white/75">
                <span className="font-semibold text-slate-900 dark:text-white">Impact: </span>
                {wt.risk}
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-white/10 text-xs text-emerald-700 dark:text-emerald-300">
                <span className="font-semibold">Village Defense: </span>
                {wt.fix}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
