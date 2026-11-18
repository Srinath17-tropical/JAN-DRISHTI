import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  Compass,
  HelpCircle,
  Layers,
  Maximize2,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import type {
  DistrictGroundwaterRow,
  SectorInsightsVillage,
} from "./SectorActionModules";

type ScenarioPackage = "all" | "water_climate" | "health_edu" | "livelihood_fpo";
type ChartMetricKey = "score" | "diseaseRisk" | "groundwaterMbgl" | "incomeIndex";

type HorizonPoint = {
  year: string;
  bauScore: number;
  vksScore: number;
  bauVvi: number;
  vksVvi: number;
  bauDisease: number;
  vksDisease: number;
  bauMbgl: number;
  vksMbgl: number;
  bauIncome: number;
  vksIncome: number;
  bauFemaleLit: number;
  vksFemaleLit: number;
};

type PredictionModelOutput = {
  villageName: string;
  districtName: string;
  mandalName: string;
  districtGw: DistrictGroundwaterRow | null;
  points: HorizonPoint[];
  baselineScore: number;
  baselineDiseaseRisk: number;
  baselineMbgl: number;
  bau2047: HorizonPoint;
  vks2047: HorizonPoint;
  sectorTargets: { name: string; base: number; target: number; color: string }[];
  explanations: {
    id: string;
    domain: string;
    accent: string;
    observedInput: string;
    bauLogic: string;
    interventionLogic: string;
    netDeltaLabel: string;
  }[];
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function buildPredictionModel(
  village: SectorInsightsVillage | null,
  groundwaterList: DistrictGroundwaterRow[],
  pkg: ScenarioPackage
): PredictionModelOutput {
  const vn = village?.villageName ?? "Telangana Benchmark Village";
  const dn = village?.districtName ?? "Medak";
  const mn = village?.mandalName ?? "Representative Mandal";

  const gwRow =
    groundwaterList.find(
      (r) =>
        r.district_code === village?.districtCode ||
        r.district_name.toLowerCase() === dn.toLowerCase()
    ) ??
    groundwaterList[0] ??
    null;

  const baseScore = village?.overallScore ?? 58.2;
  const eduS = village?.education.score ?? 58;
  const heaS = village?.health.score ?? 55;
  const watS = village?.water.score ?? 60;
  const livS = village?.livelihood.score ?? 57;
  const envS = village?.environment.score ?? 56;

  const openDef = village?.health.openDefecationPct ?? 36;
  const closedDrain = village?.health.closedDrainagePct ?? 28;
  const tapPct = village?.water.tapWaterTotalPct ?? 64;
  const tanks = village?.water.tanksTotal ?? 3;
  const pm25 = village?.environment.pm25 ?? 38;
  const rain7d = village?.environment.forecastRainMm ?? 18;
  const biomass = village?.environment.solidBiomassPct ?? 54;
  const femLit = village?.education.femaleLiteracyRate ?? 57;
  const marginal = village?.livelihood.marginalWorkerPct ?? 21;
  const banking = village?.livelihood.bankingAccessPct ?? 67;
  const solar = village?.environment.avgSolarMj ?? 18.8;

  const baseMbgl = gwRow?.post_monsoon_mbgl ?? 9.4;
  const gwExtractPct = gwRow?.stage_of_extraction_pct ?? 78;

  const rawDisease =
    openDef * 0.34 +
    (100 - closedDrain) * 0.18 +
    (100 - tapPct) * 0.22 +
    Math.min(100, pm25 * 1.1) * 0.16 +
    Math.min(40, rain7d * 0.45) * 0.1;
  const baseDiseaseRisk = Number(clamp(rawDisease, 12, 86).toFixed(1));

  const waterGainMult = pkg === "all" ? 1 : pkg === "water_climate" ? 1.15 : 0.45;
  const healthEduMult = pkg === "all" ? 1 : pkg === "health_edu" ? 1.15 : 0.48;
  const livMult = pkg === "all" ? 1 : pkg === "livelihood_fpo" ? 1.18 : 0.52;

  const horizons = [
    { year: "2026", frac: 0 },
    { year: "2030", frac: 0.24 },
    { year: "2035", frac: 0.52 },
    { year: "2040", frac: 0.76 },
    { year: "2047", frac: 1.0 },
  ];

  const stressDrift =
    (gwExtractPct > 85 ? 2.4 : 1.1) +
    (openDef > 35 ? 1.6 : 0.7) +
    (biomass > 50 ? 1.3 : 0.5);

  const scoreHeadroom = Math.max(8, 94 - baseScore);
  const overallBoostMult =
    pkg === "all" ? 0.92 : pkg === "water_climate" ? 0.68 : pkg === "health_edu" ? 0.7 : 0.66;

  const points: HorizonPoint[] = horizons.map(({ year, frac }) => {
    const ease = 1 - Math.pow(1 - frac, 1.55);

    const bauScore = Number(
      clamp(baseScore - stressDrift * frac * 1.85, 22, 92).toFixed(1)
    );
    const vksScore = Number(
      clamp(baseScore + scoreHeadroom * overallBoostMult * ease, baseScore, 96).toFixed(1)
    );

    const bauVvi = Number((100 - bauScore).toFixed(1));
    const vksVvi = Number((100 - vksScore).toFixed(1));

    const bauDisease = Number(
      clamp(baseDiseaseRisk + (rain7d > 20 ? 9.5 : 5.2) * frac, 10, 92).toFixed(1)
    );
    const vksDisease = Number(
      clamp(baseDiseaseRisk * (1 - 0.76 * healthEduMult * ease), 5.5, baseDiseaseRisk).toFixed(1)
    );

    const gwDepletionDelta = (gwExtractPct / 100) * 4.8 * frac;
    const tankRechargeBonus = Math.min(4.8, 1.8 + tanks * 0.45) * waterGainMult * ease;
    const bauMbgl = Number(clamp(baseMbgl + gwDepletionDelta, 2.0, 28.0).toFixed(2));
    const vksMbgl = Number(clamp(baseMbgl - tankRechargeBonus, 2.2, 24.0).toFixed(2));

    const bauIncome = Math.round(100 + (18 - marginal * 0.35) * frac);
    const vksIncome = Math.round(
      100 + (145 * livMult + (banking - 50) * 0.45 + (solar - 15) * 3.2) * ease
    );

    const bauFemaleLit = Number(clamp(femLit + 4.2 * frac, 20, 82).toFixed(1));
    const vksFemaleLit = Number(
      clamp(femLit + (97.5 - femLit) * healthEduMult * ease, femLit, 98.5).toFixed(1)
    );

    return {
      year,
      bauScore,
      vksScore,
      bauVvi,
      vksVvi,
      bauDisease,
      vksDisease,
      bauMbgl,
      vksMbgl,
      bauIncome,
      vksIncome,
      bauFemaleLit,
      vksFemaleLit,
    };
  });

  const bau2047 = points[points.length - 1];
  const vks2047 = points[points.length - 1];

  const sectorTargets = [
    { name: "EDU", base: eduS, target: Math.round(clamp(eduS + (94 - eduS) * healthEduMult, eduS, 96)), color: "#ef4444" },
    { name: "HEA", base: heaS, target: Math.round(clamp(heaS + (93 - heaS) * healthEduMult, heaS, 95)), color: "#10b981" },
    { name: "WAT", base: watS, target: Math.round(clamp(watS + (95 - watS) * waterGainMult, watS, 97)), color: "#06b6d4" },
    { name: "LIV", base: livS, target: Math.round(clamp(livS + (92 - livS) * livMult, livS, 95)), color: "#ec4899" },
    { name: "ENV", base: envS, target: Math.round(clamp(envS + (94 - envS) * waterGainMult, envS, 96)), color: "#84cc16" },
  ];

  const explanations = [
    {
      id: "water",
      domain: "Water & Groundwater Aquifer Trajectory",
      accent: "#06b6d4",
      observedInput: `${dn} post-monsoon water table is ${baseMbgl}m bgl (${gwExtractPct}% extraction); ${vn} holds ${tanks} TRACGIS irrigation tanks & ${tapPct}% tap access.`,
      bauLogic: `Without percolation pits or tank desiltation, ${gwExtractPct}% groundwater extraction pulls water levels deeper to ${bau2047.bauMbgl}m bgl by 2047, raising summer pumping cost & crop risk.`,
      interventionLogic: `Desilting ${tanks} village Kakatiya tanks + recharge shafts near agricultural borewells rebounds water table to ${vks2047.vksMbgl}m bgl (${Math.abs(bau2047.bauMbgl - vks2047.vksMbgl).toFixed(1)}m higher recovery).`,
      netDeltaLabel: `${(bau2047.bauMbgl - vks2047.vksMbgl).toFixed(1)}m Water Table Gain`,
    },
    {
      id: "health",
      domain: "Preventive Health & Disease Risk Trajectory",
      accent: "#10b981",
      observedInput: `Baseline enteric/respiratory exposure sits at ${baseDiseaseRisk}% driven by ${openDef}% unimproved sanitation, ${closedDrain}% closed drainage, & ${pm25} µg/m³ PM2.5.`,
      bauLogic: `Climate rainfall spikes (${rain7d}mm 7d telemetry) over unlined greywater drains push seasonal outbreak risk up to ${bau2047.bauDisease}%.`,
      interventionLogic: `IHHL + greywater soak-pit saturation, treated 55 LPCD Mission Bhagiratha supply & Ujjwala clean cooking drop projected disease risk to ${vks2047.vksDisease}%.`,
      netDeltaLabel: `-${(bau2047.bauDisease - vks2047.vksDisease).toFixed(1)}% Disease Burden`,
    },
    {
      id: "education",
      domain: "Education & Youth Human Capital",
      accent: "#ef4444",
      observedInput: `Education score ${eduS}/100 with female literacy at ${femLit}% alongside ${village?.education.nearestSchoolKm ?? 2.4} km distance to ${village?.education.nearestSchoolName ?? "nearest school"}.`,
      bauLogic: `Household water-fetching burden and seasonal sickness slow female literacy gains to only ${bau2047.bauFemaleLit}% by 2047.`,
      interventionLogic: `In-premises tap water + school WASH + Mana Ooru–Mana Badi digital labs lift female literacy to ${vks2047.vksFemaleLit}% and strengthen higher-education transition.`,
      netDeltaLabel: `+${(vks2047.vksFemaleLit - bau2047.bauFemaleLit).toFixed(1)}% Female Literacy`,
    },
    {
      id: "livelihood_env",
      domain: "Livelihood Surplus, Clean Energy & Macro Rupee Impact",
      accent: "#f59e0b",
      observedInput: `Livelihood ${livS}/100 (${marginal}% marginal workers, ${banking}% banking) + Environment ${envS}/100 (${biomass}% biomass fuel, ${solar} MJ/m² solar potential).`,
      bauLogic: `Distress post-harvest grain sales and fossil/biomass dependence cap real rural household income index at ${bau2047.bauIncome} vs 100 baseline.`,
      interventionLogic: `FPO cold-storage (cutting post-harvest spoilage 18%→5%), SERP SHG credit & PM-KUSUM solar pumps multiply income index to ${vks2047.vksIncome}, cooling CPI food inflation.`,
      netDeltaLabel: `+${Math.round(((vks2047.vksIncome - bau2047.bauIncome) / bau2047.bauIncome) * 100)}% Real Income Lift`,
    },
  ];

  return {
    villageName: vn,
    districtName: dn,
    mandalName: mn,
    districtGw: gwRow,
    points,
    baselineScore: baseScore,
    baselineDiseaseRisk: baseDiseaseRisk,
    baselineMbgl: baseMbgl,
    bau2047,
    vks2047,
    sectorTargets,
    explanations,
  };
}

/* =========================================================
   CONTINUOUS LOOP HOOK (NEVER STOPS)
========================================================= */

function useContinuousCycle(durationMs: number, holdEndRatio = 0.24): number {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let rafId = 0;
    let lastEmit = 0;
    const start = performance.now();

    const tick = (now: number) => {
      if (now - lastEmit >= 32) {
        lastEmit = now;
        const loopPos = ((now - start) % durationMs) / durationMs;
        // Sweep cleanly 0 -> 1 during active fraction, hold dramatically at peak, then seamless reset
        const activeSpan = 1 - holdEndRatio;
        const val = loopPos <= activeSpan ? loopPos / activeSpan : 1;
        setPhase(val);
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [durationMs, holdEndRatio]);

  return phase;
}

/* =========================================================
   GRAND COSMIC-SPATIAL HORIZON FORECAST SVG
========================================================= */

function GrandPredictionHorizonSVG({
  model,
  progress,
  uidPrefix,
}: {
  model: PredictionModelOutput;
  progress: number; // Continuous 0..1 loop
  uidPrefix: string;
}) {
  const ease = 1 - Math.pow(1 - Math.max(0, Math.min(1, progress)), 1.65);

  const startX = 110;
  const startY = 248;

  const vksPath = `M ${startX} ${startY} C 295 225, 435 160, 590 120 C 715 88, 800 72, 875 66`;
  const bauPath = `M ${startX} ${startY} C 295 274, 450 326, 600 356 C 725 380, 805 388, 875 396`;
  const dividendPolygon = `M ${startX} ${startY} C 295 225, 435 160, 590 120 C 715 88, 800 72, 875 66 L 875 396 C 805 388, 725 380, 600 356 C 450 326, 295 274, ${startX} ${startY} Z`;

  const scanX = startX + (875 - startX) * ease;
  const curVksY = startY - (startY - 66) * Math.pow(ease, 0.85);
  const curBauY = startY + (396 - startY) * Math.pow(ease, 0.9);

  const curVksScore =
    model.baselineScore + (model.vks2047.vksScore - model.baselineScore) * ease;
  const curBauScore =
    model.baselineScore + (model.bau2047.bauScore - model.baselineScore) * ease;
  const curVksIncome = 100 + (model.vks2047.vksIncome - 100) * ease;
  const currentYear = Math.round(2026 + (2047 - 2026) * ease);

  const milestones = [
    { x: 110, vksY: 248, bauY: 248, year: "2026", label: "Baseline", frac: 0.02 },
    { x: 360, vksY: 186, bauY: 294, year: "2030", label: "Stabilize", frac: 0.3 },
    { x: 590, vksY: 120, bauY: 352, year: "2035", label: "Breakthrough", frac: 0.58 },
    { x: 875, vksY: 66, bauY: 396, year: "2047", label: "Viksit @2047", frac: 0.92 },
  ];

  const horizonGlow = 0.45 + 0.55 * ease;

  return (
    <svg viewBox="0 0 1040 480" className="w-full h-auto select-none">
      <defs>
        <linearGradient id={`${uidPrefix}-vksGrad`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff9933" />
          <stop offset="45%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id={`${uidPrefix}-dividendGrad`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,153,51,0.08)" />
          <stop offset="50%" stopColor="rgba(56,189,248,0.16)" />
          <stop offset="100%" stopColor="rgba(16,185,129,0.32)" />
        </linearGradient>
        <radialGradient id={`${uidPrefix}-sunBurst`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,153,51,0.65)" />
          <stop offset="42%" stopColor="rgba(16,185,129,0.28)" />
          <stop offset="100%" stopColor="rgba(4,8,14,0)" />
        </radialGradient>
        <radialGradient id={`${uidPrefix}-ambientLeft`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(56,189,248,0.22)" />
          <stop offset="100%" stopColor="rgba(4,8,14,0)" />
        </radialGradient>
        <clipPath id={`${uidPrefix}-sweepClip`}>
          <rect x="0" y="0" width={scanX + 10} height="480" />
        </clipPath>
      </defs>

      {/* Deep Space-Grade Cosmic Canvas */}
      <rect width="1040" height="480" rx="8" fill="#030711" />
      <circle cx="130" cy="248" r="190" fill={`url(#${uidPrefix}-ambientLeft)`} />
      <circle cx="875" cy="74" r={220 * horizonGlow} fill={`url(#${uidPrefix}-sunBurst)`} />

      {/* Continuous Rotating Celestial / Telangana Telemetry Astrolabe Rings at 2047 Horizon */}
      <g transform="translate(875, 74)">
        <circle r="136" fill="none" stroke="rgba(255,153,51,0.18)" strokeWidth="1.5" strokeDasharray="14 10">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="22s" repeatCount="indefinite" />
        </circle>
        <circle r="102" fill="none" stroke="rgba(56,189,248,0.25)" strokeWidth="1.8" strokeDasharray="8 8">
          <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="14s" repeatCount="indefinite" />
        </circle>
        <circle r="72" fill="none" stroke="rgba(16,185,129,0.32)" strokeWidth="2" strokeDasharray="4 6">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="9s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Subtle Orbital Grid */}
      <g stroke="rgba(255,255,255,0.045)" strokeWidth="1">
        {[90, 175, 260, 345].map((y) => (
          <line key={y} x1="0" y1={y} x2="1040" y2={y} />
        ))}
      </g>

      {/* Decade Axis Markers */}
      {milestones.map((m) => (
        <g key={m.year}>
          <line
            x1={m.x}
            y1="38"
            x2={m.x}
            y2="424"
            stroke="rgba(255,255,255,0.09)"
            strokeDasharray="4 6"
          />
          <text
            x={m.x}
            y="452"
            textAnchor="middle"
            fill={ease >= m.frac ? "#ffffff" : "rgba(255,255,255,0.42)"}
            fontSize="12"
            fontWeight="800"
            fontFamily="monospace"
          >
            {m.year} · {m.label}
          </text>
        </g>
      ))}

      {/* Persistent Base Track Ribbons */}
      <path d={vksPath} fill="none" stroke="rgba(16,185,129,0.22)" strokeWidth="3" strokeDasharray="5 5" />
      <path d={bauPath} fill="none" stroke="rgba(239,68,68,0.22)" strokeWidth="2.5" strokeDasharray="5 5" />

      {/* Sweeping Illuminated Fan */}
      <g clipPath={`url(#${uidPrefix}-sweepClip)`}>
        <path d={dividendPolygon} fill={`url(#${uidPrefix}-dividendGrad)`} />

        {/* Uncorrected Drift Path */}
        <path d={bauPath} fill="none" stroke="#ef4444" strokeWidth="4" strokeDasharray="9 5" />

        {/* Outer Glow & Inner Laser Highway */}
        <path d={vksPath} fill="none" stroke="rgba(16,185,129,0.32)" strokeWidth="15" strokeLinecap="round" />
        <path d={vksPath} fill="none" stroke={`url(#${uidPrefix}-vksGrad)`} strokeWidth="6.5" strokeLinecap="round" />
      </g>

      {/* Non-Stop Streaming Photon Particles Flowing Along Both Trajectories Forever */}
      {[0, 0.9, 1.8].map((delay, idx) => (
        <g key={`stream-${idx}`}>
          <circle r="4.5" fill={idx === 0 ? "#fde68a" : idx === 1 ? "#7dd3fc" : "#34d399"}>
            <animateMotion dur="2.8s" begin={`${delay}s`} repeatCount="indefinite" path={vksPath} />
          </circle>
          <circle r="3.5" fill="#f87171" fillOpacity="0.85">
            <animateMotion dur="3.6s" begin={`${delay}s`} repeatCount="indefinite" path={bauPath} />
          </circle>
        </g>
      ))}

      {/* Vertical Horizon Scanner & Live Gap Callout */}
      {ease > 0.06 && (
        <g>
          <line
            x1={scanX}
            y1={curVksY}
            x2={scanX}
            y2={curBauY}
            stroke="#fbbf24"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <rect
            x={Math.min(706, Math.max(130, scanX - 96))}
            y={(curVksY + curBauY) / 2 - 17}
            width="192"
            height="34"
            rx="17"
            fill="#07111e"
            stroke="#fbbf24"
            strokeWidth="1.4"
          />
          <text
            x={Math.min(802, Math.max(226, scanX))}
            y={(curVksY + curBauY) / 2 + 4}
            textAnchor="middle"
            fill="#fde68a"
            fontSize="12"
            fontWeight="800"
            fontFamily="monospace"
          >
            {currentYear} GAP: +{(curVksScore - curBauScore).toFixed(1)} PTS
          </text>
        </g>
      )}

      {/* Expanding Shockwave Portals at Milestones */}
      {milestones.map((m) => {
        const lit = ease >= m.frac;
        return (
          <g key={`node-${m.year}`}>
            {lit && (
              <circle cx={m.x} cy={m.vksY} r="14" fill="none" stroke="#34d399" strokeWidth="2">
                <animate attributeName="r" values="10;26;10" dur="2.2s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.8;0.05;0.8" dur="2.2s" repeatCount="indefinite" />
              </circle>
            )}
            <circle
              cx={m.x}
              cy={m.vksY}
              r={lit ? "8" : "5"}
              fill={lit ? "#10b981" : "#334155"}
              stroke="#ffffff"
              strokeWidth="2"
            />
            {m.year !== "2026" && (
              <circle
                cx={m.x}
                cy={m.bauY}
                r={lit ? "6.5" : "4"}
                fill={lit ? "#ef4444" : "#334155"}
                stroke="#0f172a"
                strokeWidth="1.5"
              />
            )}
          </g>
        );
      })}

      {/* 5 Rising Sector Skyline Pillars on Right Edge (Animated continuously with forecast) */}
      <g transform="translate(918, 128)">
        <rect width="102" height="284" rx="6" fill="rgba(7,12,24,0.9)" stroke="rgba(255,255,255,0.14)" />
        <text x="51" y="22" textAnchor="middle" fill="#ff9933" fontSize="9.5" fontWeight="800" fontFamily="monospace">
          2047 PILLARS
        </text>
        {model.sectorTargets.map((sec, idx) => {
          const curVal = sec.base + (sec.target - sec.base) * ease;
          const barW = (curVal / 100) * 76;
          const yOff = 44 + idx * 46;
          return (
            <g key={sec.name} transform={`translate(13, ${yOff})`}>
              <text x="0" y="10" fill="#cbd5e1" fontSize="9.5" fontWeight="700" fontFamily="monospace">
                {sec.name}: {Math.round(curVal)}
              </text>
              <rect x="0" y="16" width="76" height="9" rx="2" fill="rgba(255,255,255,0.1)" />
              <rect x="0" y="16" width={barW} height="9" rx="2" fill={sec.color} />
            </g>
          );
        })}
      </g>

      {/* Leading Glowing Sweep Heads */}
      <circle cx={scanX} cy={curVksY} r="18" fill="rgba(16,185,129,0.28)" />
      <circle cx={scanX} cy={curVksY} r="7.5" fill="#ffffff" stroke="#10b981" strokeWidth="3" />
      <circle cx={scanX} cy={curBauY} r="6.5" fill="#fca5a5" stroke="#ef4444" strokeWidth="2.5" />

      {/* Top Left HUD (x = 20..336, y = 16..84) */}
      <g transform="translate(20, 16)">
        <rect width="316" height="68" rx="4" fill="rgba(7,12,24,0.92)" stroke="rgba(255,255,255,0.16)" />
        <text x="14" y="23" fill="#ff9933" fontSize="10" fontWeight="800" fontFamily="monospace">
          LIVE CONTINUOUS HORIZON · {currentYear}
        </text>
        <text x="14" y="45" fill="#ffffff" fontSize="13.5" fontWeight="700">
          {model.villageName} ({model.districtName})
        </text>
        <text x="14" y="61" fill="#38bdf8" fontSize="10" fontFamily="monospace">
          Income Index: {Math.round(curVksIncome)} (2026 = 100)
        </text>
      </g>

      {/* Top Center Comparison Scoreboard (x = 354..646, y = 16..84 — completely clear of endpoint tags) */}
      <g transform="translate(354, 16)">
        <rect width="292" height="68" rx="4" fill="rgba(7,12,24,0.92)" stroke="rgba(16,185,129,0.45)" />
        <text x="14" y="22" fill="#6ee7b7" fontSize="10" fontWeight="700" fontFamily="monospace">
          CONVERGENCE VS DRIFT ({currentYear})
        </text>
        <text x="14" y="51" fill="#10b981" fontSize="22" fontWeight="800" fontFamily="monospace">
          {curVksScore.toFixed(1)}
        </text>
        <text x="86" y="51" fill="rgba(255,255,255,0.45)" fontSize="13" fontWeight="700">
          vs
        </text>
        <text x="114" y="51" fill="#ef4444" fontSize="22" fontWeight="800" fontFamily="monospace">
          {curBauScore.toFixed(1)}
        </text>
        <text x="184" y="51" fill="#fde68a" fontSize="13" fontWeight="700" fontFamily="monospace">
          / 100
        </text>
      </g>

      {/* Endpoint Summary Pills (Dedicated Top-Right & Bottom-Right zones with crisp pill frames) */}
      <g transform="translate(764, 10)">
        <rect width="256" height="26" rx="4" fill="rgba(4,24,18,0.94)" stroke="rgba(16,185,129,0.55)" />
        <text x="128" y="17" textAnchor="middle" fill="#6ee7b7" fontSize="11" fontWeight="800" fontFamily="monospace">
          VIKSIT CONVERGENCE: {model.vks2047.vksScore}/100
        </text>
      </g>

      <g transform="translate(612, 408)">
        <rect width="252" height="24" rx="4" fill="rgba(28,8,12,0.94)" stroke="rgba(239,68,68,0.5)" />
        <text x="126" y="16" textAnchor="middle" fill="#fca5a5" fontSize="10.5" fontWeight="700" fontFamily="monospace">
          UNCORRECTED BAU DRIFT: {model.bau2047.bauScore}/100
        </text>
      </g>
    </svg>
  );
}

/* =========================================================
   FULL-SCREEN CONTINUOUS GRAND PREDICTION CINEMA
========================================================= */

function GrandPredictionCinemaOverlay({
  open,
  onClose,
  model,
}: {
  open: boolean;
  onClose: () => void;
  model: PredictionModelOutput;
}) {
  const progress = useContinuousCycle(7800, 0.24);

  if (!open) return null;

  const year = Math.round(2026 + 21 * progress);

  return (
    <div className="fixed inset-0 z-[155] flex flex-col justify-between overflow-y-auto bg-[#03060d]/97 backdrop-blur-2xl text-white p-5 md:p-8">
      <div className="max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono font-bold tracking-[0.2em] text-cyan-300">
            CONTINUOUS GRAND HORIZON CINEMA · 2026 → {year} → 2047
          </div>
          <h2 className="mt-1 text-xl md:text-3xl font-bold text-white">
            {model.villageName} Future Trajectory: Intervention Dividend vs. Drift
          </h2>
          <p className="mt-1 text-xs md:text-sm text-white/70">
            Streaming live comparative forecast from current baseline indicators toward Viksit Bharat @2047.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white text-slate-900 hover:bg-orange-100 shrink-0"
        >
          <X size={14} />
          <span>Exit Cinema</span>
        </button>
      </div>

      <div className="max-w-6xl w-full mx-auto my-4">
        <GrandPredictionHorizonSVG
          model={model}
          progress={progress}
          uidPrefix="grand-modal"
        />
      </div>

      <div className="max-w-6xl w-full mx-auto space-y-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {model.explanations.map((ex) => (
            <div key={ex.id} className="border border-white/15 bg-white/[0.04] p-3">
              <div className="text-[11px] font-semibold" style={{ color: ex.accent }}>
                {ex.domain}
              </div>
              <div className="mt-1 text-sm font-mono font-bold text-white">
                {ex.netDeltaLabel}
              </div>
              <div className="mt-1 text-[11px] text-white/65 line-clamp-2">
                {ex.interventionLogic}
              </div>
            </div>
          ))}
        </div>

        <div className="h-1.5 w-full bg-white/10 overflow-hidden">
          <div
            className="h-full"
            style={{
              width: `${Math.round(progress * 100)}%`,
              background: "linear-gradient(90deg, #ef4444, #ff9933, #38bdf8, #10b981)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN EXPORTED PREDICTION, COMPARISON & EXPLANATION STUDIO
========================================================= */

export default function PredictionHorizonStudio({
  village,
  groundwater,
}: {
  village: SectorInsightsVillage | null;
  groundwater: DistrictGroundwaterRow[];
}) {
  const [scenarioPkg, setScenarioPkg] = useState<ScenarioPackage>("all");
  const [chartMetric, setChartMetric] = useState<ChartMetricKey>("score");
  const [cinemaOpen, setCinemaOpen] = useState<boolean>(false);

  // Continuously animating 2026 -> 2047 grand transition (never stops)
  const progress = useContinuousCycle(7600, 0.25);

  const model = useMemo(
    () => buildPredictionModel(village, groundwater, scenarioPkg),
    [village, groundwater, scenarioPkg]
  );

  const metricConfig: Record<
    ChartMetricKey,
    { label: string; unit: string; bauKey: keyof HorizonPoint; vksKey: keyof HorizonPoint }
  > = {
    score: { label: "Composite Development Score", unit: "/100", bauKey: "bauScore", vksKey: "vksScore" },
    diseaseRisk: { label: "Preventable Disease Risk", unit: "%", bauKey: "bauDisease", vksKey: "vksDisease" },
    groundwaterMbgl: { label: "Groundwater Depth (Lower = Closer to Surface)", unit: "m bgl", bauKey: "bauMbgl", vksKey: "vksMbgl" },
    incomeIndex: { label: "Household Income Index (2026 = 100)", unit: "idx", bauKey: "bauIncome", vksKey: "vksIncome" },
  };

  const activeMetricCfg = metricConfig[chartMetric];

  const comparisonRows = [
    {
      metric: "Composite Development Score",
      baseline: `${model.baselineScore}/100`,
      bau2047: `${model.bau2047.bauScore}/100`,
      vks2047: `${model.vks2047.vksScore}/100`,
      delta: `+${(model.vks2047.vksScore - model.bau2047.bauScore).toFixed(1)} pts`,
    },
    {
      metric: "Vulnerability Risk (VVI)",
      baseline: `${(100 - model.baselineScore).toFixed(1)}`,
      bau2047: `${model.bau2047.bauVvi}`,
      vks2047: `${model.vks2047.vksVvi}`,
      delta: `-${(model.bau2047.bauVvi - model.vks2047.vksVvi).toFixed(1)} risk`,
    },
    {
      metric: "Groundwater Table (Post-Monsoon)",
      baseline: `${model.baselineMbgl}m bgl`,
      bau2047: `${model.bau2047.bauMbgl}m bgl`,
      vks2047: `${model.vks2047.vksMbgl}m bgl`,
      delta: `+${(model.bau2047.bauMbgl - model.vks2047.vksMbgl).toFixed(1)}m recovery`,
    },
    {
      metric: "Waterborne & Vector Disease Risk",
      baseline: `${model.baselineDiseaseRisk}%`,
      bau2047: `${model.bau2047.bauDisease}%`,
      vks2047: `${model.vks2047.vksDisease}%`,
      delta: `-${(model.bau2047.bauDisease - model.vks2047.vksDisease).toFixed(1)}% burden`,
    },
    {
      metric: "Female Literacy Trajectory",
      baseline: `${village?.education.femaleLiteracyRate ?? 57}%`,
      bau2047: `${model.bau2047.bauFemaleLit}%`,
      vks2047: `${model.vks2047.vksFemaleLit}%`,
      delta: `+${(model.vks2047.vksFemaleLit - model.bau2047.bauFemaleLit).toFixed(1)}% gain`,
    },
    {
      metric: "Real Household Income Index (2026=100)",
      baseline: "100",
      bau2047: `${model.bau2047.bauIncome}`,
      vks2047: `${model.vks2047.vksIncome}`,
      delta: `+${Math.round(((model.vks2047.vksIncome - model.bau2047.bauIncome) / model.bau2047.bauIncome) * 100)}% lift`,
    },
  ];

  return (
    <section id="prediction-engine-section" className="max-w-7xl mx-auto px-6 md:px-8 pb-14">
      <div className="border border-cyan-500/25 bg-white dark:bg-[#070b12] p-6 md:p-8 space-y-7">
        {/* Top Studio Title & Full-Screen Grand Cinema CTA */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold text-cyan-600 dark:text-cyan-300 flex items-center gap-2">
              <Compass size={14} />
              <span>CONTINUOUS PREDICTIVE HORIZON ENGINE · COMPARE &amp; EXPLAIN EVERYTHING</span>
            </div>
            <h3 className="mt-1.5 text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white text-balance">
              2026–2047 Village Prediction &amp; Policy Divergence Simulator ({model.villageName})
            </h3>
            <p className="mt-2 text-xs md:text-sm leading-6 text-slate-600 dark:text-white/60">
              Models future outcomes directly from {model.villageName}&apos;s current 5-sector condition, {model.districtName} groundwater extraction, climate telemetry, and TRACGIS tank capacity—continuously streaming the gap between drift and converged action.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCinemaOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-gradient-to-r from-orange-600 via-cyan-600 to-emerald-600 hover:opacity-95 text-white shadow-sm transition whitespace-nowrap shrink-0"
          >
            <Maximize2 size={14} />
            <span>Full-Screen Grand Cinema</span>
          </button>
        </div>

        {/* Interactive Policy Scenario Package Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-white/50 mr-1">
              Intervention Lever:
            </span>
            {(
              [
                { id: "all", label: "All 5 Sectors @2047" },
                { id: "water_climate", label: "Water & Solar Focus" },
                { id: "health_edu", label: "Health & Schools Focus" },
                { id: "livelihood_fpo", label: "Livelihood & Cold-Chain" },
              ] as { id: ScenarioPackage; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setScenarioPkg(opt.id)}
                className={`px-3 py-1.5 text-xs font-medium border transition whitespace-nowrap ${
                  scenarioPkg === opt.id
                    ? "border-cyan-500 bg-cyan-600 text-white"
                    : "border-slate-300 dark:border-white/15 bg-white dark:bg-white/[0.03] text-slate-700 dark:text-white/75 hover:border-cyan-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-300">
            ● LIVE CONTINUOUS SIMULATION ({Math.round(2026 + 21 * progress)})
          </span>
        </div>

        {/* GRAND CONTINUOUS HORIZON VISUALIZER */}
        <div className="border border-slate-200 dark:border-white/12 bg-[#030711] overflow-hidden shadow-2xl">
          <GrandPredictionHorizonSVG
            model={model}
            progress={progress}
            uidPrefix="inline-horizon"
          />
        </div>

        {/* Trajectory Comparison Chart & Table */}
        <div className="grid xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-7 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Layers size={14} className="text-cyan-500" />
                <span>Compare Pathways: {activeMetricCfg.label}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    { id: "score", label: "Score" },
                    { id: "diseaseRisk", label: "Disease Risk" },
                    { id: "groundwaterMbgl", label: "Groundwater" },
                    { id: "incomeIndex", label: "Income" },
                  ] as { id: ChartMetricKey; label: string }[]
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setChartMetric(m.id)}
                    className={`px-2.5 py-1 text-[11px] font-medium border transition ${
                      chartMetric === m.id
                        ? "border-orange-500 bg-orange-500/15 text-orange-700 dark:text-orange-200"
                        : "border-slate-300 dark:border-white/15 text-slate-600 dark:text-white/60"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[270px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={model.points}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#070b12",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={activeMetricCfg.vksKey}
                    name={`JAN—DRISHTI Path (${activeMetricCfg.unit})`}
                    stroke="#10b981"
                    fill="rgba(16,185,129,0.22)"
                    strokeWidth={2.5}
                  />
                  <Area
                    type="monotone"
                    dataKey={activeMetricCfg.bauKey}
                    name={`Business-As-Usual Drift (${activeMetricCfg.unit})`}
                    stroke="#ef4444"
                    fill="rgba(239,68,68,0.14)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="xl:col-span-5 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] overflow-x-auto">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                Head-to-Head Outcome Comparison (2026 vs 2047)
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-300">
                POLICY DIVIDEND
              </span>
            </div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50">
                  <th className="px-3 py-2 font-medium">Indicator</th>
                  <th className="px-3 py-2 font-medium">2026</th>
                  <th className="px-3 py-2 font-medium text-red-500">BAU 2047</th>
                  <th className="px-3 py-2 font-medium text-emerald-500">Viksit 2047</th>
                  <th className="px-3 py-2 font-medium">Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                {comparisonRows.map((row) => (
                  <tr key={row.metric}>
                    <td className="px-3 py-2.5 font-medium text-slate-900 dark:text-white">
                      {row.metric}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-600 dark:text-white/65">
                      {row.baseline}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-red-600 dark:text-red-300">
                      {row.bau2047}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-semibold text-emerald-600 dark:text-emerald-300">
                      {row.vks2047}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-bold text-amber-600 dark:text-amber-300 whitespace-nowrap">
                      {row.delta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Complete Causal Explanation Panel */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-white/10 pb-2.5">
            <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle size={14} className="text-orange-500" />
              <span>Why This Prediction? Complete Causal &amp; Formula Explanation for {model.villageName}</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 dark:text-white/50">
              Zero Black-Box · Auditable Drivers
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {model.explanations.map((ex) => (
              <div
                key={ex.id}
                className="border border-slate-200 dark:border-white/12 bg-slate-50 dark:bg-[#04080e] p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold" style={{ color: ex.accent }}>
                    {ex.domain}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/35 text-emerald-700 dark:text-emerald-300">
                    {ex.netDeltaLabel}
                  </span>
                </div>

                <div className="text-xs leading-5 text-slate-700 dark:text-white/80">
                  <strong className="text-slate-900 dark:text-white">Current Input Evidence:</strong>{" "}
                  {ex.observedInput}
                </div>

                <div className="grid sm:grid-cols-2 gap-2.5 pt-1 text-[11.5px] leading-5">
                  <div className="border border-red-500/30 bg-red-500/[0.05] p-2.5">
                    <div className="font-semibold text-red-600 dark:text-red-300 flex items-center gap-1">
                      <TrendingDown size={12} />
                      <span>Without Intervention (BAU)</span>
                    </div>
                    <p className="mt-1 text-slate-600 dark:text-white/70">{ex.bauLogic}</p>
                  </div>

                  <div className="border border-emerald-500/35 bg-emerald-500/[0.06] p-2.5">
                    <div className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <TrendingUp size={12} />
                      <span>With Converged Schemes</span>
                    </div>
                    <p className="mt-1 text-slate-700 dark:text-white/80">{ex.interventionLogic}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-4 py-3 text-[11px] leading-5 text-slate-600 dark:text-white/60 flex flex-wrap items-center justify-between gap-2">
            <span>
              <ShieldCheck size={13} className="inline mr-1.5 text-emerald-500" />
              <strong>Methodology &amp; Transparency:</strong> Projections are deterministically derived from{" "}
              {model.villageName}&apos;s Census 2011 HLPCA baselines, TRACGIS tank polygons, CGWB/TGWB District groundwater extraction ratios, and live Open-Meteo telemetry.
            </span>
            <a
              href="#vicious-cycle-section"
              className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 dark:text-cyan-300 hover:underline shrink-0"
            >
              <span>See Cycle Break</span>
              <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
      </div>

      <GrandPredictionCinemaOverlay
        open={cinemaOpen}
        onClose={() => setCinemaOpen(false)}
        model={model}
      />
    </section>
  );
}
