import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Droplets,
  Leaf,
  Maximize2,
  ShieldCheck,
  X,
} from "lucide-react";
import type { SectorInsightsVillage } from "./SectorActionModules";
import type { LanguageCode } from "../lib/i18n";

export type GraphicalDomain =
  | "education"
  | "health"
  | "water"
  | "livelihood"
  | "environment";

type ConditionTier = {
  label: string;
  color: string;
  badgeBg: string;
};

function getConditionTier(score: number): ConditionTier {
  if (score < 48) {
    return {
      label: "CRITICAL DEFICIT",
      color: "#ef4444",
      badgeBg: "bg-red-500/15 border-red-500/45 text-red-600 dark:text-red-300",
    };
  }
  if (score < 66) {
    return {
      label: "MODERATE GAP",
      color: "#f59e0b",
      badgeBg: "bg-amber-500/15 border-amber-500/45 text-amber-700 dark:text-amber-300",
    };
  }
  return {
    label: "RESILIENT BASELINE",
    color: "#10b981",
    badgeBg: "bg-emerald-500/15 border-emerald-500/45 text-emerald-700 dark:text-emerald-300",
  };
}

type SectorStoryMeta = {
  eyebrow: string;
  title: string;
  subtitle: string;
  score: number;
  baseShapeLabel: string;
  observedSummary: string;
  bottleneckReason: string;
  solutionPlan: string;
  steps: { label: string; metric: string; fix: string }[];
};

function buildSectorStory(
  domain: GraphicalDomain,
  village: SectorInsightsVillage | null
): SectorStoryMeta {
  const vn = village?.villageName ?? "Telangana State Avg";

  if (domain === "education") {
    const score = village?.education.score ?? 58;
    const lit = village?.education.literacyRate ?? 66.5;
    const fem = village?.education.femaleLiteracyRate ?? 57.9;
    const gap = Math.max(0, Number((lit - fem).toFixed(1)));
    const km = village?.education.nearestSchoolKm ?? 2.4;
    const school = village?.education.nearestSchoolName ?? "ZPHS High School";
    return {
      eyebrow: "EDUCATION VISUAL ENGINE · SCHOOL & OPEN BOOK GRAPHIC",
      title: `${vn} — Literacy, School Access & Learning Transformation`,
      subtitle:
        "Schoolhouse & Open Book graphic visually fills according to village literacy, female transition gap, and travel distance.",
      score,
      baseShapeLabel: "Schoolhouse + Open Book Crest",
      observedSummary: `Literacy is ${lit}% (female literacy ${fem}%, ${gap} pp gap). Nearest mapped school "${school}" is ${km} km away.`,
      bottleneckReason:
        km > 3
          ? "Long travel distance and missing secondary bridge support raise adolescent absenteeism and girls' dropout risk."
          : "Digital lab deficits and gender literacy disparity hold students back from college and polytechnic transition.",
      solutionPlan:
        "Mana Ooru–Mana Badi digital classrooms, school WASH blocks, evening girls' bridge-learning & University linkage.",
      steps: [
        { label: "Effective Literacy", metric: `${lit}%`, fix: "Gram Panchayat digital library & remedial camps" },
        { label: "Female Literacy", metric: `${fem}%`, fix: "Safe transport & adolescent girl stipends" },
        { label: "School Reach", metric: `${km} km`, fix: "Upgraded upper-primary Smart Classrooms" },
      ],
    };
  }

  if (domain === "health") {
    const score = village?.health.score ?? 56;
    const latrine = village?.health.latrineWithinPct ?? 48.2;
    const cleanFuel = village?.health.cleanCookingFuelPct ?? 44.1;
    const drain = village?.health.closedDrainagePct ?? 26.4;
    const km = village?.health.nearestHealthKm ?? 4.2;
    const clinic = village?.health.nearestHealthName ?? "PHC / Palle Dawakhana";
    return {
      eyebrow: "HEALTHCARE VISUAL ENGINE · HOSPITAL & STETHOSCOPE GRAPHIC",
      title: `${vn} — Clinical Reach, Sanitation & Preventive Disease Shield`,
      subtitle:
        "Hospital, Stethoscope & live ECG Pulse visually reflect sanitation, indoor smoke exposure, and emergency care distance.",
      score,
      baseShapeLabel: "Hospital + Stethoscope + Live ECG",
      observedSummary: `In-premises latrine access is ${latrine}%, clean fuel ${cleanFuel}%, closed drains ${drain}%, and nearest clinic "${clinic}" is ${km} km away.`,
      bottleneckReason:
        latrine < 60 || drain < 40
          ? "Open wastewater and low sanitation saturation drive monsoon diarrhoeal, dengue & respiratory outbreaks."
          : "Distance to secondary trauma/maternal care delays early diagnosis during emergencies.",
      solutionPlan:
        "Palle Dawakhana ANM screening, SBM-G Phase II household soak-pits, pre-monsoon chlorination & Aarogyasri triage.",
      steps: [
        { label: "Sanitation (IHHL)", metric: `${latrine}%`, fix: "100% ODF-Plus household toilet & soak-pit saturation" },
        { label: "Clean Cooking", metric: `${cleanFuel}%`, fix: "PM Ujjwala refill linkage to cut lung PM2.5" },
        { label: "Hospital Reach", metric: `${km} km`, fix: "Weekly mobile diagnostic camp & 108/104 linkage" },
      ],
    };
  }

  if (domain === "water") {
    const score = village?.water.score ?? 61;
    const tap = village?.water.tapWaterTotalPct ?? 64.5;
    const within = village?.water.waterWithinPremisesPct ?? 51.2;
    const tanks = village?.water.tanksTotal ?? 3;
    const km = village?.water.nearestWaterKm ?? 1.8;
    return {
      eyebrow: "WATER VISUAL ENGINE · WATER DROP, TANK & RIVER GRAPHIC",
      title: `${vn} — Tap Coverage, Tank Storage & Aquifer Recharge Flow`,
      subtitle:
        "Crystal Water Drop & flowing Kakatiya tank-river system visualize current water security vs full aquifer recharge.",
      score,
      baseShapeLabel: "Water Drop + Tank Bund + Flowing River",
      observedSummary: `Tap water reaches ${tap}% of households (${within}% inside premises), supported by ${tanks} mapped TRACGIS minor irrigation tanks.`,
      bottleneckReason:
        within < 60
          ? "Households still fetch water away from home due to tail-end pressure drops and silted tank storage."
          : "Summer extraction spikes require borewell recharge pits along tank cascades to sustain 55 LPCD supply.",
      solutionPlan:
        "Mission Kakatiya chain-tank desiltation, percolation recharge shafts near borewells & Mission Bhagiratha pressure audit.",
      steps: [
        { label: "Tap Coverage", metric: `${tap}%`, fix: "Tail-end overhead tank pressure & valve balancing" },
        { label: "In-Premises Supply", metric: `${within}%`, fix: "100% FHTC 55 LPCD treated household connections" },
        { label: "TRACGIS Tanks", metric: `${tanks} Tanks (${km} km)`, fix: "Catchment desiltation & feeder channel clearing" },
      ],
    };
  }

  if (domain === "livelihood") {
    const score = village?.livelihood.score ?? 59;
    const wpr = village?.livelihood.wpr ?? 49.5;
    const marginal = village?.livelihood.marginalWorkerPct ?? 21.4;
    const banking = village?.livelihood.bankingAccessPct ?? 68.4;
    const km = village?.livelihood.nearestLivelihoodKm ?? 4.8;
    return {
      eyebrow: "LIVELIHOOD VISUAL ENGINE · WORKERS & GROWTH GEARS GRAPHIC",
      title: `${vn} — Rural Workforce Stability, SHG Credit & FPO Surplus`,
      subtitle:
        "Animated Workers, turning Value-Chain Gears & Harvest Bars depict seasonal vulnerability transforming into year-round incomes.",
      score,
      baseShapeLabel: "Workers Working + Value Gears + Harvest Bars",
      observedSummary: `Workforce participation is ${wpr}% with ${marginal}% marginal (<6-month) employment, ${banking}% banking reach, and nearest hub at ${km} km.`,
      bottleneckReason:
        marginal > 18
          ? "Seasonal kharif dependence and distress crop sales leave workers underemployed for 4–5 months each year."
          : "Limited cold-chain grading and formal bank credit curb farmer margin capture.",
      solutionPlan:
        "Dry-season MGNREGA watershed employment, SERP Stree Nidhi SHG enterprise loans & FPO solar cold-storage linkage.",
      steps: [
        { label: "Marginal Workers", metric: `${marginal}%`, fix: "Guaranteed off-season watershed & agro-processing jobs" },
        { label: "Banking Access", metric: `${banking}%`, fix: "100% SHG & PMJDY working-capital credit camps" },
        { label: "Market Distance", metric: `${km} km`, fix: "Village FPO aggregation & solar cold-chain hub" },
      ],
    };
  }

  // environment
  const score = village?.environment.score ?? 57;
  const biomass = village?.environment.solidBiomassPct ?? 56.2;
  const solar = village?.environment.avgSolarMj ?? 18.8;
  const pm25 = village?.environment.pm25 ?? 38.4;
  const temp = village?.environment.currentTempC ?? 31.2;
  return {
    eyebrow: "ENVIRONMENT VISUAL ENGINE · LIVING PLANT, TREE CANOPY & SUN GRAPHIC",
    title: `${vn} — Green Canopy Revival, Clean Air & Solar Transition`,
    subtitle:
      "Living Sapling-to-Tree Canopy graphic reacts directly to biomass smoke, PM2.5 air load, heat stress, and solar potential.",
    score,
    baseShapeLabel: "Growing Plant / Tree + Clean Soil + Solar Sun",
    observedSummary: `${biomass}% solid biomass cooking drives ${pm25} µg/m³ PM2.5 under ${temp}°C heat, while daily solar radiation is ${solar} MJ/m².`,
    bottleneckReason:
      biomass > 45
        ? "Heavy firewood/biomass combustion creates household indoor air pollution and thins catchment tree cover."
        : "Urban-fringe heat island spikes require green foreshore buffers and waterbody protection.",
    solutionPlan:
      "Haritha Haram bund plantations, reed-bed greywater treatment, PM-KUSUM solar pumps & clean LPG transition.",
    steps: [
      { label: "Biomass Smoke", metric: `${biomass}%`, fix: "Subsidized LPG / biogas clean cooking saturation" },
      { label: "PM2.5 Air Load", metric: `${pm25} µg/m³`, fix: "Green shelterbelts & smokeless village kitchens" },
      { label: "Solar Potential", metric: `${solar} MJ/m²`, fix: "PM-KUSUM solar feeders & Gram Panchayat rooftops" },
    ],
  };
}

/* =========================================================
   BESPOKE SECTOR GRAPHICAL TRANSITION SVG CANVAS
========================================================= */

function SectorGraphicalSVG({
  domain,
  progress,
  village,
  uidPrefix,
}: {
  domain: GraphicalDomain;
  progress: number; // 0..1 (Act I 0..0.28 -> Act II Shockwave 0.28..0.72 -> Act III 0.72..1.0)
  village: SectorInsightsVillage | null;
  uidPrefix: string;
}) {
  const inShock = progress >= 0.26 && progress <= 0.72;
  const shockFrac = inShock ? (progress - 0.26) / 0.46 : 0;
  const morph = Math.max(0, Math.min(1, (progress - 0.24) / 0.62)); // 0 -> 1 transformation smoothly

  const accentColor =
    progress < 0.28
      ? "#ef4444"
      : inShock
      ? "#ff9933"
      : domain === "education"
      ? "#38bdf8"
      : domain === "health"
      ? "#10b981"
      : domain === "water"
      ? "#06b6d4"
      : domain === "livelihood"
      ? "#f59e0b"
      : "#22c55e";

  const statusText =
    progress < 0.28
      ? "ACT I · OBSERVED VILLAGE CONDITION"
      : inShock
      ? "ACT II · INTERVENTION SHOCKWAVE"
      : "ACT III · VIKSIT SECTOR STATE";

  const vn = village?.villageName ?? "Telangana Village";

  return (
    <svg viewBox="0 0 720 400" className="w-full h-auto select-none">
      <defs>
        <clipPath id={`${uidPrefix}-waterDropClip`}>
          <path d="M 360 54 C 360 54 268 175 268 242 C 268 298 309 340 360 340 C 411 340 452 298 452 242 C 452 175 360 54 360 54 Z" />
        </clipPath>
        <radialGradient id={`${uidPrefix}-stageGlow`} cx="50%" cy="50%" r="52%">
          <stop offset="0%" stopColor={`${accentColor}38`} />
          <stop offset="100%" stopColor="rgba(4,8,14,0)" />
        </radialGradient>
      </defs>

      {/* Dark Cinema Canvas */}
      <rect width="720" height="400" rx="6" fill="#050a14" />
      <rect width="720" height="400" rx="6" fill={`url(#${uidPrefix}-stageGlow)`} />

      {/* Subtle Blueprint Grid */}
      <g stroke="rgba(255,255,255,0.04)" strokeWidth="1">
        {[80, 160, 240, 320].map((y) => (
          <line key={y} x1="0" y1={y} x2="720" y2={y} />
        ))}
        {[120, 240, 360, 480, 600].map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2="400" />
        ))}
      </g>

      {/* Shockwave Ring Overlay during Act II */}
      {inShock && (
        <circle
          cx="360"
          cy="205"
          r={35 + shockFrac * 240}
          fill="none"
          stroke="#ff9933"
          strokeWidth="3.5"
          strokeOpacity={Math.sin(shockFrac * Math.PI) * 0.85}
        />
      )}

      {/* Top HUD Label */}
      <text x="26" y="30" fill={accentColor} fontSize="11.5" fontWeight="800" fontFamily="monospace">
        {statusText}
      </text>
      <text x="694" y="30" textAnchor="end" fill="#ffffff" fillOpacity="0.65" fontSize="11" fontFamily="monospace">
        {vn.toUpperCase()}
      </text>

      {/* ==========================================================
          1. EDUCATION: SCHOOL BUILDING + OPEN BOOK SHAPE
      ========================================================== */}
      {domain === "education" && (
        <g>
          {(() => {
            const baseLit = village?.education.literacyRate ?? 65;
            const femLit = village?.education.femaleLiteracyRate ?? 56;
            const targetLit = 96;
            const curLit = baseLit + (targetLit - baseLit) * morph;
            const curFem = femLit + (94 - femLit) * morph;
            const km = village?.education.nearestSchoolKm ?? 2.5;
            const barFill = Math.max(0.2, Math.min(1, curLit / 100));

            return (
              <g>
                {/* Road/Path from Village Homes to School */}
                <path
                  d="M 70 336 Q 210 318 360 326 Q 510 334 650 326"
                  fill="none"
                  stroke={morph > 0.5 ? "#38bdf8" : "#ef4444"}
                  strokeWidth="4"
                  strokeDasharray={morph > 0.5 ? "12 6" : "6 10"}
                />
                <circle r="5" fill="#fbbf24">
                  <animateMotion dur={morph > 0.5 ? "2.2s" : "4.5s"} repeatCount="indefinite" path="M 70 336 Q 210 318 360 326 Q 510 334 650 326" />
                </circle>

                {/* Stylized School Building Silhouette behind/above Book */}
                <g transform="translate(360, 128)">
                  {/* Flagpole */}
                  <line x1="0" y1="-84" x2="0" y2="-46" stroke="#e2e8f0" strokeWidth="2.5" />
                  <rect x="2" y="-84" width="22" height="5" fill="#ff9933" />
                  <rect x="2" y="-79" width="22" height="5" fill="#ffffff" />
                  <rect x="2" y="-74" width="22" height="5" fill="#10b981" />

                  {/* Roof Triangle */}
                  <polygon
                    points="-118,-10 0,-52 118,-10"
                    fill={morph > 0.5 ? "#0c4a6e" : "#3b1721"}
                    stroke={accentColor}
                    strokeWidth="2.4"
                  />
                  {/* Solar Roof Panels appear in Act II/III */}
                  {morph > 0.35 && (
                    <g opacity={Math.min(1, (morph - 0.35) * 2)}>
                      <rect x="-78" y="-34" width="46" height="14" transform="skewX(-22)" fill="#0284c7" stroke="#7dd3fc" strokeWidth="1" />
                      <rect x="26" y="-34" width="46" height="14" transform="skewX(22)" fill="#0284c7" stroke="#7dd3fc" strokeWidth="1" />
                    </g>
                  )}
                  {/* School Clock */}
                  <circle cx="0" cy="-26" r="10" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.8" />
                  <line x1="0" y1="-26" x2="0" y2="-32" stroke="#fbbf24" strokeWidth="1.5" />
                  <line x1="0" y1="-26" x2="5" y2="-26" stroke="#fbbf24" strokeWidth="1.5" />

                  {/* Main School Facade + Windows */}
                  <rect x="-104" y="-10" width="208" height="72" fill="#0f172a" stroke={accentColor} strokeWidth="2" />
                  {[-76, -42, 22, 56].map((wx) => (
                    <rect
                      key={wx}
                      x={wx}
                      y="6"
                      width="20"
                      height="24"
                      rx="2"
                      fill={morph > 0.5 ? "#38bdf8" : "#475569"}
                      fillOpacity={morph > 0.5 ? 0.85 : 0.4}
                    />
                  ))}
                  {/* School Door */}
                  <rect x="-14" y="20" width="28" height="42" rx="2" fill="#ff9933" fillOpacity="0.85" />
                </g>

                {/* Center Foreground Giant Open Book */}
                <g transform="translate(360, 258)">
                  {/* Left Page */}
                  <path
                    d="M 0 -38 Q -72 -52 -142 -32 L -142 54 Q -72 34 0 52 Z"
                    fill="#0b1528"
                    stroke={accentColor}
                    strokeWidth="2.4"
                  />
                  {/* Right Page */}
                  <path
                    d="M 0 -38 Q 72 -52 142 -32 L 142 54 Q 72 34 0 52 Z"
                    fill="#0b1528"
                    stroke={accentColor}
                    strokeWidth="2.4"
                  />
                  {/* Dynamic Progress Fill Bars Inside Book Pages */}
                  <rect x="-124" y="-6" width="106" height="10" rx="2" fill="rgba(255,255,255,0.12)" />
                  <rect x="-124" y="-6" width={106 * barFill} height="10" rx="2" fill={accentColor} />
                  <text x="-124" y="-14" fill="#cbd5e1" fontSize="10" fontWeight="700">
                    LITERACY: {curLit.toFixed(1)}%
                  </text>

                  <rect x="18" y="-6" width="106" height="10" rx="2" fill="rgba(255,255,255,0.12)" />
                  <rect x="18" y="-6" width={106 * (curFem / 100)} height="10" rx="2" fill="#10b981" />
                  <text x="18" y="-14" fill="#cbd5e1" fontSize="10" fontWeight="700">
                    FEMALE: {curFem.toFixed(1)}%
                  </text>

                  {/* Book Lines */}
                  <line x1="-124" y1="20" x2="-24" y2="20" stroke="rgba(255,255,255,0.22)" strokeWidth="2" />
                  <line x1="-124" y1="32" x2="-45" y2="32" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                  <line x1="18" y1="20" x2="118" y2="20" stroke="rgba(255,255,255,0.22)" strokeWidth="2" />
                  <line x1="18" y1="32" x2="95" y2="32" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                </g>

                {/* Left & Right Metric Callout Cards */}
                <g transform="translate(26, 94)">
                  <rect width="170" height="72" rx="4" fill="rgba(15,23,42,0.9)" stroke={accentColor} strokeWidth="1.4" />
                  <text x="14" y="24" fill="#94a3b8" fontSize="10" fontWeight="600">NEAREST SCHOOL REACH</text>
                  <text x="14" y="48" fill="#ffffff" fontSize="18" fontWeight="800" fontFamily="monospace">{km} km</text>
                  <text x="14" y="63" fill={morph > 0.5 ? "#34d399" : "#f87171"} fontSize="9.5">
                    {morph > 0.5 ? "Digital Library + Transit Active" : "Travel Barrier Risk"}
                  </text>
                </g>

                <g transform="translate(524, 94)">
                  <rect width="170" height="72" rx="4" fill="rgba(15,23,42,0.9)" stroke="#10b981" strokeWidth="1.4" />
                  <text x="14" y="24" fill="#94a3b8" fontSize="10" fontWeight="600">SCORE TRAJECTORY</text>
                  <text x="14" y="48" fill="#ffffff" fontSize="18" fontWeight="800" fontFamily="monospace">
                    {Math.round((village?.education.score ?? 58) + (90 - (village?.education.score ?? 58)) * morph)}/100
                  </text>
                  <text x="14" y="63" fill="#34d399" fontSize="9.5">
                    {morph > 0.5 ? "Smart School & Girls Retention" : "Gender & Digital Gap"}
                  </text>
                </g>
              </g>
            );
          })()}
        </g>
      )}

      {/* ==========================================================
          2. HEALTH: HOSPITAL + DOCTOR / STETHOSCOPE + LIVE ECG
      ========================================================== */}
      {domain === "health" && (
        <g>
          {(() => {
            const latrine = village?.health.latrineWithinPct ?? 48;
            const cleanFuel = village?.health.cleanCookingFuelPct ?? 42;
            const curLat = latrine + (98 - latrine) * morph;
            const km = village?.health.nearestHealthKm ?? 4.2;

            return (
              <g>
                {/* Hospital Facade (clear of left WASH card) */}
                <g transform="translate(338, 145)">
                  {/* Side Wings */}
                  <rect x="-126" y="-12" width="252" height="106" rx="4" fill="#0b1525" stroke={accentColor} strokeWidth="2.2" />
                  {/* Central Tower */}
                  <rect x="-58" y="-54" width="116" height="148" rx="4" fill="#0f1d32" stroke={accentColor} strokeWidth="2.4" />
                  {/* Giant Medical Cross */}
                  <rect x="-10" y="-38" width="20" height="54" rx="2" fill={morph > 0.4 ? "#10b981" : "#ef4444"} />
                  <rect x="-27" y="-21" width="54" height="20" rx="2" fill={morph > 0.4 ? "#10b981" : "#ef4444"} />
                  {/* Windows */}
                  {[-106, -80, 62, 88].map((wx) => (
                    <rect key={wx} x={wx} y="10" width="18" height="26" rx="2" fill="#38bdf8" fillOpacity={0.25 + morph * 0.55} />
                  ))}
                  {/* Entrance Doors */}
                  <rect x="-22" y="42" width="44" height="52" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                </g>

                {/* Curved Stethoscope Tubing + Chest Piece Bell on Right */}
                <g transform="translate(540, 185)" stroke={morph > 0.4 ? "#34d399" : "#f87171"} fill="none">
                  {/* Earpieces */}
                  <path d="M -32 -95 C -46 -40 -26 -10 0 -10 C 26 -10 46 -40 32 -95" strokeWidth="5" strokeLinecap="round" />
                  <circle cx="-32" cy="-98" r="5" fill="#ffffff" />
                  <circle cx="32" cy="-98" r="5" fill="#ffffff" />
                  {/* Tube Down to Bell */}
                  <path d="M 0 -10 C 0 55 56 62 56 12 C 56 -22 25 -22 25 8" strokeWidth="4.5" strokeLinecap="round" />
                  {/* Acoustic Bell */}
                  <circle cx="25" cy="14" r="18" fill="#0f172a" strokeWidth="3.5" />
                  <circle cx="25" cy="14" r="7" fill={morph > 0.4 ? "#10b981" : "#ef4444"} />
                </g>

                {/* Live Animated ECG Heartbeat Pulse Line Along Bottom */}
                <path
                  d="M 45 304 L 185 304 L 205 278 L 222 332 L 244 256 L 266 322 L 284 304 L 445 304 L 465 276 L 482 330 L 502 258 L 522 322 L 542 304 L 675 304"
                  fill="none"
                  stroke={morph > 0.45 ? "#10b981" : "#ef4444"}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <circle r="6" fill="#ffffff">
                  <animateMotion
                    dur={morph > 0.45 ? "2.4s" : "3.8s"}
                    repeatCount="indefinite"
                    path="M 45 304 L 185 304 L 205 278 L 222 332 L 244 256 L 266 322 L 284 304 L 445 304 L 465 276 L 482 330 L 502 258 L 522 322 L 542 304 L 675 304"
                  />
                </circle>

                {/* Left KPI HUD */}
                <g transform="translate(22, 68)">
                  <rect width="166" height="84" rx="4" fill="rgba(15,23,42,0.9)" stroke={accentColor} strokeWidth="1.4" />
                  <text x="12" y="22" fill="#94a3b8" fontSize="9.5" fontWeight="700">WASH SANITATION</text>
                  <text x="12" y="47" fill="#ffffff" fontSize="19" fontWeight="800" fontFamily="monospace">{curLat.toFixed(0)}%</text>
                  <text x="12" y="68" fill="#cbd5e1" fontSize="10">Clean Fuel: {cleanFuel}% · {km} km</text>
                </g>
              </g>
            );
          })()}
        </g>
      )}

      {/* ==========================================================
          3. WATER: GIANT WATER DROP + TANK BUND + FLOWING RIVER
      ========================================================== */}
      {domain === "water" && (
        <g>
          {(() => {
            const tap = village?.water.tapWaterTotalPct ?? 62;
            const curTap = tap + (99 - tap) * morph;
            const tanks = village?.water.tanksTotal ?? 3;
            const waveTopY = 335 - (Math.max(18, curTap) / 100) * 245;

            return (
              <g>
                {/* Giant Center Water Drop Outline */}
                <path
                  d="M 360 54 C 360 54 268 175 268 242 C 268 298 309 340 360 340 C 411 340 452 298 452 242 C 452 175 360 54 360 54 Z"
                  fill="#081426"
                  stroke="#38bdf8"
                  strokeWidth="3"
                />
                {/* Clipped Animated Water Fill Inside Drop */}
                <g clipPath={`url(#${uidPrefix}-waterDropClip)`}>
                  <path
                    d={`M 240 ${waveTopY} Q 300 ${waveTopY - 14} 360 ${waveTopY} T 480 ${waveTopY} L 480 360 L 240 360 Z`}
                    fill={morph > 0.45 ? "#06b6d4" : "#f59e0b"}
                    fillOpacity="0.68"
                  />
                  <path
                    d={`M 240 ${waveTopY + 8} Q 300 ${waveTopY + 20} 360 ${waveTopY + 8} T 480 ${waveTopY + 8} L 480 360 L 240 360 Z`}
                    fill="#0ea5e9"
                    fillOpacity="0.55"
                  />
                </g>

                {/* Readout Inside Water Drop */}
                <text x="360" y="246" textAnchor="middle" fill="#ffffff" fontSize="28" fontWeight="800" fontFamily="monospace">
                  {Math.round(curTap)}%
                </text>
                <text x="360" y="268" textAnchor="middle" fill="#e0f2fe" fontSize="11" fontWeight="700">
                  TAP COVERAGE
                </text>

                {/* Left: Tank Bund Irrigation Reservoir */}
                <g transform="translate(36, 178)">
                  <rect width="184" height="106" rx="4" fill="#09192b" stroke="#06b6d4" strokeWidth="1.6" />
                  <path d="M 14 78 Q 52 64 92 74 T 170 72 L 170 96 L 14 96 Z" fill="#06b6d4" fillOpacity={0.28 + morph * 0.55} />
                  <text x="14" y="26" fill="#7dd3fc" fontSize="10.5" fontWeight="700">KAKATIYA TANKS</text>
                  <text x="14" y="54" fill="#ffffff" fontSize="22" fontWeight="800" fontFamily="monospace">{tanks} Mapped</text>
                </g>

                {/* Flowing River Canal Channels From Left Tank Into Drop & Aquifer */}
                <path
                  d="M 220 232 Q 248 232 268 242"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="4"
                  strokeDasharray="6 6"
                />
                <path
                  d="M 452 246 Q 535 246 655 316"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="5"
                  strokeDasharray="8 6"
                />
                <circle r="5.5" fill="#7dd3fc">
                  <animateMotion dur="2s" repeatCount="indefinite" path="M 452 246 Q 535 246 655 316" />
                </circle>

                {/* Right: Flowing River Aquifer Gauge */}
                <g transform="translate(500, 122)">
                  <rect width="192" height="90" rx="4" fill="rgba(15,23,42,0.9)" stroke={accentColor} strokeWidth="1.5" />
                  <text x="14" y="24" fill="#94a3b8" fontSize="10" fontWeight="700">AQUIFER RECHARGE FLOW</text>
                  <text x="14" y="52" fill="#ffffff" fontSize="18" fontWeight="800" fontFamily="monospace">
                    {morph > 0.5 ? "55 LPCD RESTORED" : "RECHARGE NEEDED"}
                  </text>
                  <text x="14" y="72" fill="#38bdf8" fontSize="10">In-Premises: {village?.water.waterWithinPremisesPct ?? 50}%</text>
                </g>
              </g>
            );
          })()}
        </g>
      )}

      {/* ==========================================================
          4. LIVELIHOOD: WORKERS WORKING + VALUE GEARS & HARVEST
      ========================================================== */}
      {domain === "livelihood" && (
        <g>
          {(() => {
            const marg = village?.livelihood.marginalWorkerPct ?? 22;
            const bank = village?.livelihood.bankingAccessPct ?? 66;
            const curBank = bank + (99 - bank) * morph;

            return (
              <g>
                {/* Rotating Synchronized Value-Chain Gears in Background */}
                <g transform="translate(220, 170)" opacity="0.35">
                  <circle r="62" fill="none" stroke={accentColor} strokeWidth="10" strokeDasharray="16 12">
                    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur={morph > 0.5 ? "8s" : "18s"} repeatCount="indefinite" />
                  </circle>
                </g>
                <g transform="translate(500, 170)" opacity="0.35">
                  <circle r="54" fill="none" stroke="#10b981" strokeWidth="9" strokeDasharray="14 10">
                    <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur={morph > 0.5 ? "7s" : "16s"} repeatCount="indefinite" />
                  </circle>
                </g>

                {/* Horizon Ground Line */}
                <line x1="60" y1="312" x2="660" y2="312" stroke={accentColor} strokeWidth="3" />

                {/* 3 Stylized Silhouettes of Workers Working Together (Farmer, Woman SHG Artisan, Solar Tech) */}
                {/* Worker 1: Farmer Holding Tool */}
                <g transform="translate(230, 224)">
                  <circle cx="0" cy="-34" r="14" fill="#fbbf24" />
                  <path d="M -22 24 L -12 -16 L 12 -16 L 20 24 Z" fill="#f97316" />
                  <line x1="-14" y1="24" x2="-16" y2="86" stroke="#fed7aa" strokeWidth="8" strokeLinecap="round" />
                  <line x1="12" y1="24" x2="18" y2="86" stroke="#fed7aa" strokeWidth="8" strokeLinecap="round" />
                  {/* Hoe / Sickle tool */}
                  <line x1="18" y1="-6" x2="42" y2="86" stroke="#cbd5e1" strokeWidth="4" />
                </g>

                {/* Worker 2 (Center): Woman SHG Enterprise Leader */}
                <g transform="translate(360, 214)">
                  <circle cx="0" cy="-36" r="15" fill="#fde68a" />
                  <path d="M -24 28 L -14 -16 L 14 -16 L 26 28 Z" fill="#ec4899" />
                  <line x1="-10" y1="28" x2="-10" y2="96" stroke="#fbcfe8" strokeWidth="8" strokeLinecap="round" />
                  <line x1="10" y1="28" x2="12" y2="96" stroke="#fbcfe8" strokeWidth="8" strokeLinecap="round" />
                  {/* Raised Harvest Crate / Tablet */}
                  <rect x="-26" y="-8" width="52" height="16" rx="2" fill={morph > 0.45 ? "#10b981" : "#64748b"} />
                </g>

                {/* Worker 3: Agro-Processing / Cold-Chain Technician */}
                <g transform="translate(490, 224)">
                  <circle cx="0" cy="-34" r="14" fill="#a7f3d0" />
                  <path d="M -20 24 L -12 -16 L 12 -16 L 20 24 Z" fill="#06b6d4" />
                  <line x1="-12" y1="24" x2="-14" y2="86" stroke="#bae6fd" strokeWidth="8" strokeLinecap="round" />
                  <line x1="12" y1="24" x2="14" y2="86" stroke="#bae6fd" strokeWidth="8" strokeLinecap="round" />
                </g>

                {/* Left & Right Output Bars */}
                <g transform="translate(26, 78)">
                  <rect width="166" height="84" rx="4" fill="rgba(15,23,42,0.9)" stroke={accentColor} strokeWidth="1.4" />
                  <text x="12" y="22" fill="#94a3b8" fontSize="9.5" fontWeight="700">BANKING INCLUSION</text>
                  <text x="12" y="48" fill="#ffffff" fontSize="20" fontWeight="800" fontFamily="monospace">{Math.round(curBank)}%</text>
                  <text x="12" y="68" fill="#34d399" fontSize="10">Marginal Work: {marg}%</text>
                </g>

                <g transform="translate(528, 78)">
                  <rect width="166" height="84" rx="4" fill="rgba(15,23,42,0.9)" stroke="#10b981" strokeWidth="1.4" />
                  <text x="12" y="22" fill="#94a3b8" fontSize="9.5" fontWeight="700">INCOME SURPLUS</text>
                  <text x="12" y="48" fill="#10b981" fontSize="18" fontWeight="800" fontFamily="monospace">
                    {morph > 0.5 ? "+FPO VALUE" : "SEASONAL RISK"}
                  </text>
                  <text x="12" y="68" fill="#cbd5e1" fontSize="10">WPR: {village?.livelihood.wpr ?? 49}%</text>
                </g>
              </g>
            );
          })()}
        </g>
      )}

      {/* ==========================================================
          5. ENVIRONMENT: LIVING PLANT / GROWING TREE CANOPY + SUN
      ========================================================== */}
      {domain === "environment" && (
        <g>
          {(() => {
            const biomass = village?.environment.solidBiomassPct ?? 56;
            const pm25 = village?.environment.pm25 ?? 38;
            const solar = village?.environment.avgSolarMj ?? 18.8;
            const curPm = pm25 - (pm25 - 12) * morph;
            const canopyScale = 0.58 + 0.48 * morph;

            return (
              <g>
                {/* Solar Orb & Rays Top-Right */}
                <g transform="translate(595, 92)">
                  <circle r="30" fill="#fbbf24" fillOpacity={0.3 + morph * 0.65} />
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((ang) => (
                    <line
                      key={ang}
                      x1="0"
                      y1="0"
                      x2={Math.cos((ang * Math.PI) / 180) * 52}
                      y2={Math.sin((ang * Math.PI) / 180) * 52}
                      stroke="#fbbf24"
                      strokeWidth="2.4"
                      strokeOpacity={0.25 + morph * 0.65}
                    />
                  ))}
                </g>

                {/* Soil & Water Catchment Bed */}
                <path
                  d="M 110 330 Q 360 302 610 330 L 610 358 L 110 358 Z"
                  fill={morph > 0.45 ? "#064e3b" : "#3f2618"}
                  stroke={accentColor}
                  strokeWidth="2"
                />

                {/* Roots Under Soil */}
                <path d="M 360 320 Q 325 340 280 348 M 360 320 Q 395 340 440 348" fill="none" stroke="#10b981" strokeWidth="2.5" strokeOpacity={0.4 + morph * 0.5} />

                {/* Tree Trunk & Branches */}
                <path
                  d="M 348 320 L 352 210 L 320 175 L 330 165 L 356 192 L 364 162 L 376 196 L 404 168 L 412 178 L 372 214 L 374 320 Z"
                  fill="#92400e"
                />

                {/* Growing Lush Plant Canopy / Leaf Clusters */}
                <g transform={`translate(360, 168) scale(${canopyScale})`}>
                  <circle cx="0" cy="-24" r="56" fill={morph > 0.35 ? "#16a34a" : "#854d0e"} fillOpacity="0.88" />
                  <circle cx="-48" cy="4" r="44" fill={morph > 0.35 ? "#22c55e" : "#a16207"} fillOpacity="0.85" />
                  <circle cx="48" cy="4" r="44" fill={morph > 0.35 ? "#10b981" : "#ca8a04"} fillOpacity="0.85" />
                  <circle cx="0" cy="18" r="46" fill={morph > 0.35 ? "#4ade80" : "#b45309"} fillOpacity="0.72" />
                </g>

                {/* Fading Smoke Clouds from Biomass (Positioned cleanly below top-left HUD) */}
                {morph < 0.75 && (
                  <g opacity={(1 - morph) * 0.78}>
                    <ellipse cx="192" cy="242" rx="46" ry="18" fill="#64748b" />
                    <ellipse cx="228" cy="218" rx="34" ry="14" fill="#94a3b8" />
                    <text x="192" y="200" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontWeight="700">
                      BIOMASS SMOKE ({biomass}%)
                    </text>
                  </g>
                )}

                {/* Air & Solar Telemetry HUD */}
                <g transform="translate(26, 78)">
                  <rect width="170" height="84" rx="4" fill="rgba(15,23,42,0.9)" stroke={accentColor} strokeWidth="1.4" />
                  <text x="12" y="22" fill="#94a3b8" fontSize="9.5" fontWeight="700">PM2.5 & SOLAR</text>
                  <text x="12" y="48" fill="#ffffff" fontSize="19" fontWeight="800" fontFamily="monospace">
                    {curPm.toFixed(1)} µg
                  </text>
                  <text x="12" y="68" fill="#fbbf24" fontSize="10">Solar: {solar} MJ/m²/day</text>
                </g>
              </g>
            );
          })()}
        </g>
      )}
    </svg>
  );
}

/* =========================================================
   FULL-SCREEN SECTOR CINEMA MODAL
========================================================= */

function useContinuousSectorPhase(durationMs = 7400): number {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let rafId = 0;
    let lastEmit = 0;
    const start = performance.now();

    const tick = (now: number) => {
      if (now - lastEmit >= 32) {
        lastEmit = now;
        const t = ((now - start) % durationMs) / durationMs;
        const val = t <= 0.78 ? t / 0.78 : 1;
        setPhase(val);
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [durationMs]);

  return phase;
}

function SectorCinemaModal({
  open,
  onClose,
  domain,
  village,
  story,
  uidPrefix,
}: {
  open: boolean;
  onClose: () => void;
  domain: GraphicalDomain;
  village: SectorInsightsVillage | null;
  story: SectorStoryMeta;
  uidPrefix: string;
}) {
  const progress = useContinuousSectorPhase(7600);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex flex-col justify-between overflow-y-auto bg-[#04070d]/97 backdrop-blur-2xl text-white p-5 md:p-8">
      <div className="max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono font-bold tracking-[0.18em] text-orange-300">
            {story.eyebrow}
          </div>
          <h2 className="mt-1 text-xl md:text-3xl font-bold text-white">{story.title}</h2>
          <p className="mt-1 text-xs md:text-sm text-white/70">{story.observedSummary}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white text-slate-900 hover:bg-orange-100 shrink-0"
        >
          <X size={14} />
          <span>Close Expanded View</span>
        </button>
      </div>

      <div className="max-w-4xl w-full mx-auto my-4">
        <SectorGraphicalSVG
          domain={domain}
          progress={progress}
          village={village}
          uidPrefix={`${uidPrefix}-modal`}
        />
      </div>

      <div className="max-w-6xl w-full mx-auto space-y-2">
        <div className="grid sm:grid-cols-3 gap-2.5">
          {story.steps.map((s) => (
            <div key={s.label} className="border border-white/15 bg-white/[0.04] p-3">
              <div className="flex justify-between text-[11px] font-mono text-white/60">
                <span>{s.label}</span>
                <span className="text-emerald-300 font-bold">{s.metric}</span>
              </div>
              <div className="mt-1 text-xs font-medium text-white">{s.fix}</div>
            </div>
          ))}
        </div>
        <div className="h-1.5 w-full bg-white/10 overflow-hidden">
          <div
            className="h-full"
            style={{
              width: `${Math.round(progress * 100)}%`,
              background: "linear-gradient(90deg, #ef4444, #ff9933, #10b981)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   EXPORTED SECTORAL GRAPHICAL VISUAL COMPONENT (RIGHT BELOW GIS)
========================================================= */

export default function SectorGraphicalVisual({
  domain,
  village,
}: {
  domain: GraphicalDomain;
  village: SectorInsightsVillage | null;
  lang?: LanguageCode;
}) {
  const progress = useContinuousSectorPhase(7400);
  const [cinemaOpen, setCinemaOpen] = useState<boolean>(false);

  const story = buildSectorStory(domain, village);
  const tier = getConditionTier(story.score);

  const DomainIcon =
    domain === "education"
      ? BookOpen
      : domain === "health"
      ? Activity
      : domain === "water"
      ? Droplets
      : domain === "livelihood"
      ? BriefcaseBusiness
      : Leaf;

  return (
    <div className="border border-slate-200 dark:border-white/12 bg-white dark:bg-[#070b12] p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-orange-600 dark:text-orange-300 flex items-center gap-1.5">
              <DomainIcon size={14} />
              <span>{story.eyebrow}</span>
            </span>
            <span className={`px-2 py-0.5 text-[10px] font-mono font-bold border ${tier.badgeBg}`}>
              {tier.label} · {story.score}/100
            </span>
          </div>
          <h3 className="mt-1.5 text-lg md:text-xl font-semibold text-slate-900 dark:text-white">
            {story.title}
          </h3>
          <p className="mt-1 text-xs text-slate-600 dark:text-white/60">{story.subtitle}</p>
        </div>

        {/* Continuous Status + Full-Screen Cinema Launch */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 text-[11px] font-mono border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            ● CONTINUOUS SECTOR MOTION ({story.baseShapeLabel})
          </span>

          <button
            type="button"
            onClick={() => setCinemaOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-gradient-to-r from-orange-600 to-emerald-600 hover:opacity-95 text-white transition whitespace-nowrap"
          >
            <Maximize2 size={12} />
            <span>Expanded View</span>
          </button>
        </div>
      </div>

      {/* Main Graphical Visual SVG + Citizen-Friendly 3-Card Diagnosis & Solution Plan */}
      <div className="grid xl:grid-cols-12 gap-5 items-center">
        <div className="xl:col-span-8">
          <div className="border border-slate-200 dark:border-white/12 bg-[#050a14] overflow-hidden">
            <SectorGraphicalSVG
              domain={domain}
              progress={progress}
              village={village}
              uidPrefix={`sector-${domain}`}
            />
          </div>
        </div>

        <div className="xl:col-span-4 space-y-3">
          <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-3.5 space-y-1.5">
            <div className="text-[11px] font-semibold text-orange-600 dark:text-orange-300 flex items-center gap-1.5">
              <AlertTriangle size={12} />
              <span>1. Current Village Condition</span>
            </div>
            <p className="text-xs leading-5 text-slate-700 dark:text-white/75">
              {story.observedSummary}
            </p>
          </div>

          <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-3.5 space-y-1.5">
            <div className="text-[11px] font-semibold text-red-600 dark:text-red-300 flex items-center gap-1.5">
              <ArrowRight size={12} />
              <span>2. Why Citizens Face This Issue</span>
            </div>
            <p className="text-xs leading-5 text-slate-700 dark:text-white/75">
              {story.bottleneckReason}
            </p>
          </div>

          <div className="border border-emerald-500/35 bg-emerald-500/[0.06] p-3.5 space-y-1.5">
            <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck size={12} />
              <span>3. Graphical Intervention Solution</span>
            </div>
            <p className="text-xs leading-5 text-slate-700 dark:text-white/80">
              {story.solutionPlan}
            </p>
          </div>
        </div>
      </div>

      {/* 3 Actionable Metric Strips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {story.steps.map((s) => (
          <div
            key={s.label}
            className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-3.5"
          >
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-500 dark:text-white/55">{s.label}</span>
              <span className="font-bold text-cyan-700 dark:text-cyan-300">{s.metric}</span>
            </div>
            <div className="mt-1.5 text-xs font-medium text-slate-900 dark:text-white">{s.fix}</div>
          </div>
        ))}
      </div>

      <SectorCinemaModal
        open={cinemaOpen}
        onClose={() => setCinemaOpen(false)}
        domain={domain}
        village={village}
        story={story}
        uidPrefix={`sector-${domain}`}
      />
    </div>
  );
}
