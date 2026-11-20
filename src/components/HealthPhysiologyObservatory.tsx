import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Bug,
  HeartPulse,
  RefreshCw,
  ShieldAlert,
  Sun,
  Wind,
} from "lucide-react";
import type { SectorInsightsVillage } from "./SectorActionModules";

type LifestyleMode = "risk" | "protected";

type HealthWeatherPayload = {
  current: {
    tempC: number;
    apparentTempC: number;
    humidityPct: number;
    uvIndex?: number;
    pm25: number;
    usAqi: number;
  };
  forecast7dRainMm: number;
};

const HEALTH_THREATS = [
  {
    name: "Hidden-Sugar & Ultra-Processed Junk Food Surge",
    trigger: "Packaged chips, colas, and trans-fat snacks spike insulin and arterial inflammation.",
    outcome: "Early pre-diabetes, fatty liver, and childhood obesity across towns & rural schools.",
    shield: "School stop-junk-food visual camps + Sunday millet/ragi breakfast fairs.",
  },
  {
    name: "Indoor Biomass Smoke & Fine PM2.5 Exposure",
    trigger: "Solid firewood & crop residue smoke enters deep lung alveoli (<2.5 microns).",
    outcome: "Chronic bronchitis, asthma in children, and elevated maternal hypertension.",
    shield: "Mahalakshmi ₹500 LPG refill continuity + smokeless ventilated kitchens.",
  },
  {
    name: "Stagnant-Water Vector Breeding (Dengue / Malaria)",
    trigger: "26–33°C warmth + >55% humidity accelerates Aedes aegypti larval hatching.",
    outcome: "Sudden post-rain fever clusters draining household wages and school attendance.",
    shield: "Sunday 15-minute Dry Day sweeps draining coolers, spare tires & open drums.",
  },
  {
    name: "Extreme Wet-Bulb Heat & UV Strain",
    trigger: "High humidity blocks sweat evaporation above 38°C ambient & high UV index.",
    outcome: "Acute dehydration, kidney stress, and heatstroke in outdoor farm & daily workers.",
    shield: "Midday shade shifts, panchayat ORS kiosks & cotton head-cover advisories.",
  },
];

function getCoords(village: SectorInsightsVillage | null): [number, number] {
  if (typeof village?.lat === "number" && typeof village?.lon === "number") {
    return [village.lat, village.lon];
  }
  return [17.385, 78.4867];
}

/* =========================================================
   60FPS ARTERIAL FLOW, LUNG CLARITY & ECG PULSE CANVAS
========================================================= */
function PhysiologySimulatorCanvas({
  lifestyle,
  exposureYears,
  pm25,
}: {
  lifestyle: LifestyleMode;
  exposureYears: number;
  pm25: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ref = useRef({ lifestyle, exposureYears, pm25 });
  ref.current = { lifestyle, exposureYears, pm25 };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const rbcCells = Array.from({ length: 28 }, (_, i) => ({
      x: i / 28,
      yOffset: (Math.random() - 0.5) * 0.5,
      speed: 0.004 + Math.random() * 0.0025,
    }));

    const smokeParticles = Array.from({ length: 34 }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: Math.random(),
      speed: 0.015 + Math.random() * 0.02,
    }));

    let rafId = 0;
    let tick = 0;

    const draw = () => {
      tick += prefersReduced ? 0 : 1;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(320, rect.width);
      const h = Math.max(250, rect.height);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }

      const { lifestyle: life, exposureYears: yrs, pm25: curPm } = ref.current;
      const isRisk = life === "risk";
      const plaqueRatio = isRisk ? Math.min(0.42, (yrs / 15) * 0.42) : 0.04;
      const lungHaze = isRisk ? Math.min(0.85, 0.25 + (yrs / 15) * 0.5 + curPm / 220) : 0.08;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#050914";
      ctx.fillRect(0, 0, w, h);

      // Divide canvas into 3 crisp anatomical panels
      const colW = w / 3;
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(colW, 12);
      ctx.lineTo(colW, h - 12);
      ctx.moveTo(colW * 2, 12);
      ctx.lineTo(colW * 2, h - 12);
      ctx.stroke();

      // -----------------------------------------------------------
      // PANEL 1: ARTERIAL BLOODSTREAM & SUGAR/PLAQUE NARROWING
      // -----------------------------------------------------------
      ctx.fillStyle = isRisk ? "#fbbf24" : "#34d399";
      ctx.font = "bold 11px Calibri, sans-serif";
      ctx.fillText("1. ARTERY FLOW & DIET IMPACT", 16, 26);

      const vesselY = h * 0.52;
      const vesselH = 74;
      const vesselX = 16;
      const vesselW = colW - 32;

      ctx.fillStyle = "#2b0d14";
      ctx.fillRect(vesselX, vesselY - vesselH / 2, vesselW, vesselH);
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 2;
      ctx.strokeRect(vesselX, vesselY - vesselH / 2, vesselW, vesselH);

      // Fatty / Sugar Plaque narrowing walls in Risk mode
      const plaqueH = vesselH * plaqueRatio * 0.48;
      if (plaqueH > 1) {
        ctx.fillStyle = "rgba(245, 158, 11, 0.78)";
        ctx.beginPath();
        ctx.moveTo(vesselX, vesselY - vesselH / 2);
        ctx.quadraticCurveTo(vesselX + vesselW * 0.5, vesselY - vesselH / 2 + plaqueH * 1.9, vesselX + vesselW, vesselY - vesselH / 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(vesselX, vesselY + vesselH / 2);
        ctx.quadraticCurveTo(vesselX + vesselW * 0.5, vesselY + vesselH / 2 - plaqueH * 1.9, vesselX + vesselW, vesselY + vesselH / 2);
        ctx.fill();
      }

      // Red Blood Cells flowing cleanly vs constricted
      const flowSpeedMult = isRisk ? Math.max(0.32, 1 - plaqueRatio * 1.5) : 1.15;
      for (const c of rbcCells) {
        if (!prefersReduced) {
          c.x = (c.x + c.speed * flowSpeedMult) % 1;
        }
        const cx = vesselX + c.x * vesselW;
        const squeeze = 1 - plaqueRatio * 0.7;
        const cy = vesselY + c.yOffset * (vesselH - 22) * squeeze;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 7, 4.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#ef4444";
        ctx.fill();
        ctx.strokeStyle = "#fca5a5";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(226,232,240,0.8)";
      ctx.font = "11px Consolas, monospace";
      ctx.fillText(
        isRisk ? `Plaque Narrowing: ${Math.round(plaqueRatio * 100)}%` : "Clear Lumen · Healthy Flow",
        16,
        h - 22
      );

      // -----------------------------------------------------------
      // PANEL 2: ALVEOLAR LUNG BREATHING & SMOKE LOAD
      // -----------------------------------------------------------
      const p2X = colW + 16;
      ctx.fillStyle = isRisk ? "#fda4af" : "#67e8f9";
      ctx.font = "bold 11px Calibri, sans-serif";
      ctx.fillText("2. LUNGS & CLEAN AIR CLARITY", p2X, 26);

      const breathPhase = prefersReduced ? 0.5 : (Math.sin(tick * 0.045) + 1) / 2;
      const lungScale = 0.9 + breathPhase * (isRisk ? 0.06 : 0.14);
      const lungCx = colW * 1.5;
      const lungCy = h * 0.54;

      // Left & Right Lung Lobes
      [-1, 1].forEach((side) => {
        ctx.save();
        ctx.translate(lungCx + side * 26 * lungScale, lungCy);
        ctx.scale(lungScale, lungScale);
        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 42, side * -0.14, 0, Math.PI * 2);
        ctx.fillStyle = isRisk ? `rgba(100, 116, 139, ${0.45 + lungHaze * 0.35})` : "rgba(16, 185, 129, 0.35)";
        ctx.fill();
        ctx.strokeStyle = isRisk ? "#94a3b8" : "#34d399";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      });

      // Trachea
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(lungCx, lungCy - 52);
      ctx.lineTo(lungCx, lungCy - 18);
      ctx.stroke();

      // Smoke Particulate Dots inside Lungs when Risky
      const sootCount = isRisk ? smokeParticles.length : 4;
      for (let i = 0; i < sootCount; i++) {
        const sp = smokeParticles[i];
        if (!prefersReduced) sp.angle += sp.speed;
        const sx = lungCx + Math.cos(sp.angle) * (10 + sp.radius * 34);
        const sy = lungCy + Math.sin(sp.angle * 1.3) * (8 + sp.radius * 28);
        ctx.beginPath();
        ctx.arc(sx, sy, isRisk ? 2.4 : 1.6, 0, Math.PI * 2);
        ctx.fillStyle = isRisk ? "#64748b" : "#38bdf8";
        ctx.fill();
      }

      ctx.fillStyle = "rgba(226,232,240,0.8)";
      ctx.font = "11px Consolas, monospace";
      ctx.fillText(
        isRisk ? `Indoor Smoke + PM2.5 Stress` : `High Oxygenation · Clear Alveoli`,
        p2X,
        h - 22
      );

      // -----------------------------------------------------------
      // PANEL 3: LIVE CARDIAC METABOLIC ECG PULSE
      // -----------------------------------------------------------
      const p3X = colW * 2 + 16;
      const p3W = colW - 32;
      ctx.fillStyle = isRisk ? "#f43f5e" : "#10b981";
      ctx.font = "bold 11px Calibri, sans-serif";
      ctx.fillText("3. CARDIAC & METABOLIC VITALITY", p3X, 26);

      const ecgY = h * 0.54;
      ctx.beginPath();
      const beats = isRisk ? 3.8 : 2.3;
      const speedShift = prefersReduced ? 0 : tick * (isRisk ? 0.09 : 0.055);
      for (let x = 0; x <= p3W; x += 2) {
        const phase = ((x / p3W) * beats + speedShift * 0.14) % 1;
        let dy = 0;
        if (phase > 0.15 && phase < 0.22) dy = -6;
        else if (phase >= 0.28 && phase < 0.32) dy = 9;
        else if (phase >= 0.32 && phase < 0.37) dy = -34;
        else if (phase >= 0.37 && phase < 0.41) dy = 14;
        else if (phase >= 0.52 && phase < 0.64) dy = -9;

        const px = p3X + x;
        const py = ecgY + dy;
        if (x === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = isRisk ? "#fb7185" : "#34d399";
      ctx.lineWidth = 2.2;
      ctx.stroke();

      ctx.fillStyle = "rgba(226,232,240,0.85)";
      ctx.font = "11px Consolas, monospace";
      ctx.fillText(
        isRisk ? `Resting Strain · Est. ${86 + Math.round(yrs * 0.8)} BPM` : `Calm Recovery · Est. 66 BPM`,
        p3X,
        h - 22
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
      className="w-full h-[250px] sm:h-[265px] rounded-lg border border-white/15 bg-[#050914] block"
    />
  );
}

export default function HealthPhysiologyObservatory({
  village,
}: {
  village: SectorInsightsVillage | null;
}) {
  const [lat, lon] = useMemo(() => getCoords(village), [village]);
  const [data, setData] = useState<HealthWeatherPayload | null>(null);
  const [loading, setLoading] = useState(false);

  const [lifestyle, setLifestyle] = useState<LifestyleMode>("risk");
  const [exposureYears, setExposureYears] = useState<number>(8);

  const fetchEnvHealth = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        village: village?.villageName ?? "Telangana Village",
        district: village?.districtName ?? "Hyderabad",
      });
      const r = await fetch(`/api/telemetry/weather?${qs.toString()}`);
      if (r.ok) {
        setData((await r.json()) as HealthWeatherPayload);
      }
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  }, [lat, lon, village?.villageName, village?.districtName]);

  useEffect(() => {
    void fetchEnvHealth();
  }, [fetchEnvHealth]);

  // Compute real Mosquito / Vector Breeding Risk from live Temp + Humidity + Rain
  const vectorRisk = useMemo(() => {
    const temp = data?.current.tempC ?? 30;
    const hum = data?.current.humidityPct ?? 55;
    const rain = data?.forecast7dRainMm ?? 8;
    const tempSuit = temp >= 24 && temp <= 34 ? 38 : temp > 19 ? 22 : 10;
    const humSuit = Math.min(37, Math.round((hum / 85) * 37));
    const rainSuit = Math.min(25, Math.round((rain / 35) * 25));
    const score = Math.min(98, tempSuit + humSuit + rainSuit);
    return {
      score,
      label: score >= 70 ? "High Breeding Risk" : score >= 45 ? "Moderate Vector Watch" : "Low Seasonal Risk",
    };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Interactive Body, Diet & Clean-Air Visual Lab */}
      <section className="jd-keep-dark rounded-xl border border-white/15 bg-[#060c18] text-white p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
              <HeartPulse size={14} />
              <span>PREVENTIVE HEALTH &amp; LIFESTYLE PHYSIOLOGY SIMULATOR</span>
            </div>
            <h3 className="mt-1 text-xl font-bold text-white">
              Stop-Junk-Food, Clean Air &amp; Vector Shield Visual Lab
            </h3>
            <p className="mt-0.5 text-xs text-white/65">
              Designed for children, youth, and working adults to see how daily food &amp; cooking-smoke habits shape arteries, lungs, and heart strain.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setLifestyle("risk")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap ${
                lifestyle === "risk"
                  ? "bg-rose-500 text-white border-rose-400 font-semibold"
                  : "bg-white/[0.04] border-white/15 text-white/75 hover:bg-white/10"
              }`}
            >
              Junk Food + Indoor Smoke
            </button>
            <button
              type="button"
              onClick={() => setLifestyle("protected")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap ${
                lifestyle === "protected"
                  ? "bg-emerald-500 text-slate-950 border-emerald-400 font-semibold"
                  : "bg-white/[0.04] border-white/15 text-white/75 hover:bg-white/10"
              }`}
            >
              Millet Diet + Clean Air + Walk
            </button>
            <button
              type="button"
              onClick={() => void fetchEnvHealth()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/15 bg-white/5 hover:bg-white/10 text-xs text-white whitespace-nowrap"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              Sync Biometrics
            </button>
          </div>
        </div>

        {/* Animated 3-Organ Canvas */}
        <PhysiologySimulatorCanvas
          lifestyle={lifestyle}
          exposureYears={exposureYears}
          pm25={data?.current.pm25 ?? 25}
        />

        {/* Exposure Years Slider + Live Environmental Health Risk Gauges */}
        <div className="grid lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-4 rounded-lg border border-white/10 bg-white/[0.03] p-4 space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-white/80">Habit Horizon</span>
              <span className="text-amber-300 font-bold tabular-nums">{exposureYears} Years</span>
            </div>
            <input
              type="range"
              min={1}
              max={15}
              value={exposureYears}
              onChange={(e) => setExposureYears(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="text-[11px] text-white/55">
              Scrub years to see compounding metabolic &amp; lung impact.
            </div>
          </div>

          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono tabular-nums">
            <div className="rounded-lg border border-white/10 bg-black/40 p-3">
              <div className="text-[10px] text-white/55 font-sans flex items-center gap-1">
                <Bug size={11} className="text-amber-300" />
                Mosquito Vector Index
              </div>
              <div className="mt-1 text-lg font-bold text-amber-300">{vectorRisk.score}/100</div>
              <div className="text-[10px] text-white/60 font-sans truncate">{vectorRisk.label}</div>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/40 p-3">
              <div className="text-[10px] text-white/55 font-sans flex items-center gap-1">
                <Wind size={11} className="text-cyan-300" />
                Live Lung PM2.5 Load
              </div>
              <div className="mt-1 text-lg font-bold text-cyan-300">{data?.current.pm25 ?? "—"} µg/m³</div>
              <div className="text-[10px] text-white/60">US AQI {data?.current.usAqi ?? "—"}</div>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/40 p-3">
              <div className="text-[10px] text-white/55 font-sans flex items-center gap-1">
                <Sun size={11} className="text-orange-300" />
                Live UV Index
              </div>
              <div className="mt-1 text-lg font-bold text-orange-300">{data?.current.uvIndex ?? "5.5"}</div>
              <div className="text-[10px] text-white/60">Feels {data?.current.apparentTempC ?? "—"}°C</div>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/40 p-3">
              <div className="text-[10px] text-white/55 font-sans flex items-center gap-1">
                <Activity size={11} className="text-emerald-300" />
                Clean Kitchen Share
              </div>
              <div className="mt-1 text-lg font-bold text-emerald-300">
                {village ? `${village.health.cleanCookingFuelPct}%` : "—"}
              </div>
              <div className="text-[10px] text-white/60 font-sans">Village baseline</div>
            </div>
          </div>
        </div>
      </section>

      {/* Preventive Health Threats Breakdown */}
      <section className="border border-slate-200 dark:border-white/12 bg-white dark:bg-[#070b12] p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 pb-3">
          <ShieldAlert size={16} className="text-emerald-500" />
          <span>Major Environmental &amp; Lifestyle Threats to Community Health</span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {HEALTH_THREATS.map((ht) => (
            <div
              key={ht.name}
              className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#050911] p-4 space-y-2"
            >
              <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                {ht.name}
              </div>
              <div className="text-xs text-slate-700 dark:text-white/80">
                <span className="font-semibold text-slate-900 dark:text-white">Trigger: </span>
                {ht.trigger}
              </div>
              <div className="text-xs text-slate-700 dark:text-white/75">
                <span className="font-semibold text-slate-900 dark:text-white">Health Risk: </span>
                {ht.outcome}
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-white/10 text-xs text-cyan-700 dark:text-cyan-300">
                <span className="font-semibold">Preventive Action: </span>
                {ht.shield}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
