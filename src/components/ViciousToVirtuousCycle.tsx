import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Droplets,
  HeartPulse,
  Leaf,
  Maximize2,
  ShieldCheck,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import type { LanguageCode } from "../lib/i18n";
import { UI_TRANSLATIONS } from "../lib/i18n";

export type CycleVillageMetrics = {
  villageName: string;
  districtName: string;
  envScore: number;
  waterScore: number;
  healthScore: number;
  eduScore: number;
  livScore: number;
  solidBiomassPct: number;
  tapWaterPct: number;
  tanksTotal: number;
  openDefecationPct: number;
  literacyRate: number;
  marginalWorkerPct: number;
};

type CycleNode = {
  id: string;
  icon: typeof Leaf;
  color: string;
  boxX: number;
  boxY: number;
  viciousTop: string;
  viciousBottom: string;
  virtuousTop: string;
  virtuousBottom: string;
  arrowLabelX: number;
  arrowLabelY: number;
  viciousCause: string;
  viciousCauseSub: string;
  virtuousCause: string;
  virtuousCauseSub: string;
  viciousDetail: string;
  virtuousDetail: string;
  scheme: string;
  arcPath: string;
  iconPos: { x: number; y: number };
};

const CYCLE_NODES: CycleNode[] = [
  {
    id: "env",
    icon: Leaf,
    color: "#84cc16",
    boxX: 340,
    boxY: 54,
    viciousTop: "ENVIRONMENTAL",
    viciousBottom: "DEGRADATION",
    virtuousTop: "ECOLOGICAL & SOLAR",
    virtuousBottom: "REGENERATION",
    arrowLabelX: 544,
    arrowLabelY: 78,
    viciousCause: "Climate",
    viciousCauseSub: "Change",
    virtuousCause: "Clean Solar",
    virtuousCauseSub: "& Catchment",
    viciousDetail:
      "Deforestation, catchment erosion & indoor biomass smoke warm local micro-climates and intensify erratic rainfall.",
    virtuousDetail:
      "PM-KUSUM solar agri feeders, clean LPG refilling & Haritha Haram bund plantations stabilize local micro-climate.",
    scheme: "Haritha Haram · PM-KUSUM · PM Ujjwala",
    arcPath: "M 432 56 Q 535 76 566 154",
    iconPos: { x: 540, y: 132 },
  },
  {
    id: "water",
    icon: Droplets,
    color: "#06b6d4",
    boxX: 562,
    boxY: 196,
    viciousTop: "WATER",
    viciousBottom: "STRESS",
    virtuousTop: "WATER SECURITY",
    virtuousBottom: "& RECHARGE",
    arrowLabelX: 602,
    arrowLabelY: 292,
    viciousCause: "Droughts &",
    viciousCauseSub: "Depletion",
    virtuousCause: "Kakatiya",
    virtuousCauseSub: "Recharge",
    viciousDetail:
      "Silted minor irrigation tanks & unchecked borewells cut soil moisture, triggering agricultural crop shortfall.",
    virtuousDetail:
      "Golusu Kattu chain-tank desiltation, percolation pits & Mission Bhagiratha 55 LPCD supply restore aquifer levels.",
    scheme: "Mission Kakatiya · Mission Bhagiratha",
    arcPath: "M 576 232 Q 565 325 504 378",
    iconPos: { x: 542, y: 348 },
  },
  {
    id: "health",
    icon: HeartPulse,
    color: "#10b981",
    boxX: 472,
    boxY: 416,
    viciousTop: "HEALTH",
    viciousBottom: "DETERIORATION",
    virtuousTop: "PREVENTIVE",
    virtuousBottom: "HEALTH & WASH",
    arrowLabelX: 340,
    arrowLabelY: 446,
    viciousCause: "Diseases &",
    viciousCauseSub: "Malnutrition",
    virtuousCause: "WASH & Early",
    virtuousCauseSub: "Screening",
    viciousDetail:
      "Contaminated water, open drainage & biomass exposure cause diarrhoeal illness, vector fever and stunting.",
    virtuousDetail:
      "Pre-season water chlorination, IHHL soak-pits & mobile Palle Dawakhana camps eliminate preventable outbreaks.",
    scheme: "Palle Dawakhana · SBM-G · Aarogyasri",
    arcPath: "M 382 422 Q 340 434 298 422",
    iconPos: { x: 340, y: 392 },
  },
  {
    id: "edu",
    icon: BookOpen,
    color: "#ef4444",
    boxX: 208,
    boxY: 416,
    viciousTop: "EDUCATION",
    viciousBottom: "DISRUPTION",
    virtuousTop: "CONNECTED",
    virtuousBottom: "SCHOOLS & SKILLS",
    arrowLabelX: 78,
    arrowLabelY: 292,
    viciousCause: "Dropouts &",
    viciousCauseSub: "Absenteeism",
    virtuousCause: "100% Girl",
    virtuousCauseSub: "Retention",
    viciousDetail:
      "Water-fetching chores, household sickness & distant secondary schools push rural youth—especially girls—out of class.",
    virtuousDetail:
      "Tap water at home & school WASH toilets cut dropouts while digital labs connect village schools to universities.",
    scheme: "Mana Ooru–Mana Badi · Samagra Shiksha",
    arcPath: "M 176 378 Q 115 325 104 232",
    iconPos: { x: 138, y: 348 },
  },
  {
    id: "liv",
    icon: BriefcaseBusiness,
    color: "#ec4899",
    boxX: 118,
    boxY: 196,
    viciousTop: "LIVELIHOOD",
    viciousBottom: "COLLAPSE",
    virtuousTop: "RESILIENT FPO",
    virtuousBottom: "& SHG INCOMES",
    arrowLabelX: 136,
    arrowLabelY: 78,
    viciousCause: "Poverty &",
    viciousCauseSub: "Unemployment",
    virtuousCause: "Surplus &",
    virtuousCauseSub: "INR Value",
    viciousDetail:
      "Low skill transition, seasonal agriculture dependence & informal debt keep rural households trapped in poverty.",
    virtuousDetail:
      "Off-season MGNREGA watershed wages, SERP Stree Nidhi SHGs & cold-chain FPOs create year-round agrarian surplus.",
    scheme: "SERP Stree Nidhi · Rythu Vedika · MGNREGA",
    arcPath: "M 114 154 Q 145 76 248 56",
    iconPos: { x: 140, y: 132 },
  },
];

const LINEAR_CHAIN = [
  {
    id: "c1",
    vicious: "Climate Change",
    virtuous: "Solar & Green Bunds",
  },
  {
    id: "c2",
    vicious: "Water Problems",
    virtuous: "Kakatiya Aquifer Recharge",
  },
  {
    id: "c3",
    vicious: "No Agricultural Surplus (Insufficient Food)",
    virtuous: "Crop Surplus & Stable Food Inflation",
  },
  {
    id: "c4",
    vicious: "Health Issues",
    virtuous: "Preventive WASH Shield",
  },
  {
    id: "c5",
    vicious: "Absenteeism & Dropouts",
    virtuous: "Digital Schools & Transition",
  },
  {
    id: "c6",
    vicious: "Unemployment & Poverty",
    virtuous: "FPO Prosperity & Stronger INR",
  },
];

function useContinuousCyclePhase(durationMs = 8200): number {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let rafId = 0;
    let lastEmit = 0;
    const start = performance.now();

    const tick = (now: number) => {
      if (now - lastEmit >= 32) {
        lastEmit = now;
        const t = ((now - start) % durationMs) / durationMs;
        // 0..0.78 sweeps smoothly across Act I -> Act II -> Act III, 0.78..1.0 holds Virtuous glory cleanly
        const p = t <= 0.78 ? t / 0.78 : 1;
        setPhase(p);
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [durationMs]);

  return phase;
}

function CycleGraphicalSVG({
  uidPrefix,
  progress,
  activeIdx,
  onSelectNode,
  villageName,
  darkOnly = false,
}: {
  uidPrefix: string;
  progress: number;
  activeIdx: number;
  onSelectNode?: (i: number) => void;
  villageName: string;
  darkOnly?: boolean;
}) {
  const linkProgress = Math.max(0, Math.min(5, ((progress - 0.22) / 0.62) * 5));
  const convertedCount = Math.round(linkProgress);
  const inShockwave = progress >= 0.22 && progress <= 0.78;
  const shockFrac = inShockwave ? (progress - 0.22) / 0.56 : 0;
  const shockRadius = 45 + shockFrac * 270;
  const shockOpacity = inShockwave ? Math.sin(shockFrac * Math.PI) * 0.9 : 0;

  const isPureVicious = progress < 0.22;
  const isPureVirtuous = progress >= 0.85;

  const arrowVId = `${uidPrefix}-arrowVicious`;
  const arrowGId = `${uidPrefix}-arrowVirtuous`;
  const glowVId = `${uidPrefix}-glowVicious`;
  const glowGId = `${uidPrefix}-glowVirtuous`;

  return (
    <svg viewBox="0 0 680 480" className="w-full h-auto select-none">
      <defs>
        <marker
          id={arrowVId}
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#ef4444" />
        </marker>
        <marker
          id={arrowGId}
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#10b981" />
        </marker>
        <radialGradient id={glowVId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(239,68,68,0.34)" />
          <stop offset="100%" stopColor="rgba(239,68,68,0)" />
        </radialGradient>
        <radialGradient id={glowGId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(16,185,129,0.34)" />
          <stop offset="100%" stopColor="rgba(16,185,129,0)" />
        </radialGradient>
      </defs>

      {/* Atmospheric Center Aura Glow */}
      <circle
        cx="340"
        cy="240"
        r="235"
        fill={isPureVirtuous ? `url(#${glowGId})` : `url(#${glowVId})`}
      />

      {/* Counter-Rotating Outer Orbital Telemetry Halos */}
      <circle
        cx="340"
        cy="240"
        r="198"
        fill="none"
        stroke="#ff9933"
        strokeOpacity="0.16"
        strokeWidth="1.2"
        strokeDasharray="12 10"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 340 240"
          to="360 340 240"
          dur="24s"
          repeatCount="indefinite"
        />
      </circle>

      <circle
        cx="340"
        cy="240"
        r="176"
        fill="none"
        stroke={isPureVirtuous ? "#10b981" : "#ef4444"}
        strokeOpacity="0.28"
        strokeWidth="2"
        strokeDasharray={isPureVirtuous ? "10 6" : "4 8"}
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from={isPureVicious ? "360 340 240" : "0 340 240"}
          to={isPureVicious ? "0 340 240" : "360 340 240"}
          dur={inShockwave ? "5s" : "15s"}
          repeatCount="indefinite"
        />
      </circle>

      {/* Shockwave Breaking Wave Rings during Act II */}
      {inShockwave && (
        <>
          <circle
            cx="340"
            cy="240"
            r={shockRadius}
            fill="none"
            stroke="#ff9933"
            strokeWidth="4.5"
            strokeOpacity={shockOpacity}
          />
          <circle
            cx="340"
            cy="240"
            r={Math.max(20, shockRadius - 38)}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeOpacity={shockOpacity * 0.85}
          />
        </>
      )}

      {/* Central Cycle Hub */}
      <circle
        cx="340"
        cy="240"
        r="92"
        fill={
          isPureVicious
            ? "rgba(239,68,68,0.14)"
            : inShockwave
            ? "rgba(255,153,51,0.22)"
            : "rgba(16,185,129,0.16)"
        }
        stroke={isPureVicious ? "#ef4444" : inShockwave ? "#ff9933" : "#10b981"}
        strokeWidth="2.2"
      />
      <text
        x="340"
        y="212"
        textAnchor="middle"
        fill={isPureVicious ? "#f87171" : inShockwave ? "#ffb347" : "#34d399"}
        fontSize="13"
        fontWeight="800"
        letterSpacing="1.2"
      >
        {isPureVicious
          ? "VICIOUS CYCLE"
          : inShockwave
          ? "BREAKING THE TRAP"
          : "VIRTUOUS CYCLE"}
      </text>
      <text
        x="340"
        y="232"
        textAnchor="middle"
        className={darkOnly ? "fill-white/90" : "fill-slate-800 dark:fill-white/90"}
        fontSize="11.5"
        fontWeight="700"
      >
        {isPureVicious
          ? "OF UNEVEN DEVELOPMENT"
          : inShockwave
          ? `LINK ${Math.max(1, convertedCount)} OF 5 SHATTERED`
          : "VIKSIT BHARAT @2047"}
      </text>
      <text
        x="340"
        y="252"
        textAnchor="middle"
        fill={isPureVicious ? "#fca5a5" : "#6ee7b7"}
        fontSize="10"
        fontWeight="600"
      >
        {isPureVicious
          ? "Compounding Deficit Spiral"
          : inShockwave
          ? "JAN—DRISHTI AI + GIS Pulse"
          : "Self-Reinforcing Prosperity"}
      </text>
      <text
        x="340"
        y="272"
        textAnchor="middle"
        fill="#ff9933"
        fontSize="10"
        fontWeight="700"
      >
        {villageName}
      </text>

      {/* 5 Curved Causal Paths with Dual Continuous Streaming Photon Dots */}
      {CYCLE_NODES.map((node, i) => {
        const transformed = linkProgress >= i + 0.65;
        const activelyBreaking = inShockwave && linkProgress >= i && linkProgress < i + 1;
        const strokeCol = activelyBreaking ? "#ff9933" : transformed ? "#10b981" : "#ef4444";

        return (
          <g key={`arc-${node.id}`}>
            <path
              d={node.arcPath}
              fill="none"
              stroke={strokeCol}
              strokeWidth={activelyBreaking ? "4.8" : "3"}
              strokeDasharray={activelyBreaking ? "10 6" : undefined}
              markerEnd={transformed ? `url(#${arrowGId})` : `url(#${arrowVId})`}
            />

            {/* Twin Flowing Particles Forever */}
            <circle r={activelyBreaking ? "6" : "4.5"} fill={activelyBreaking ? "#ffd166" : transformed ? "#34d399" : "#f87171"}>
              <animateMotion dur="2.1s" repeatCount="indefinite" path={node.arcPath} />
            </circle>
            <circle r="3.2" fill="#ffffff" fillOpacity="0.8">
              <animateMotion dur="2.1s" begin="1.05s" repeatCount="indefinite" path={node.arcPath} />
            </circle>

            {/* Cause Label Along Curved Path */}
            <text
              x={node.arrowLabelX}
              y={node.arrowLabelY}
              textAnchor="middle"
              className={darkOnly ? "fill-white/85" : "fill-slate-700 dark:fill-white/85"}
              fontSize="10.5"
              fontWeight="600"
            >
              {transformed ? node.virtuousCause : node.viciousCause}
            </text>
            <text
              x={node.arrowLabelX}
              y={node.arrowLabelY + 13}
              textAnchor="middle"
              fill={transformed ? "#10b981" : "#f87171"}
              fontSize="10.5"
              fontWeight="700"
            >
              {transformed ? node.virtuousCauseSub : node.viciousCauseSub}
            </text>

            {/* Link Status / Spark Node */}
            <circle
              cx={node.iconPos.x}
              cy={node.iconPos.y}
              r={activelyBreaking ? "17" : "13.5"}
              fill={
                activelyBreaking
                  ? "rgba(255,153,51,0.32)"
                  : transformed
                  ? "rgba(16,185,129,0.2)"
                  : "rgba(239,68,68,0.16)"
              }
              stroke={strokeCol}
              strokeWidth="1.5"
            />
            <text
              x={node.iconPos.x}
              y={node.iconPos.y + 4}
              textAnchor="middle"
              fill={strokeCol}
              fontSize="11"
              fontWeight="800"
            >
              {activelyBreaking ? "⚡" : transformed ? "✓" : "!"}
            </text>
          </g>
        );
      })}

      {/* 5 Framed Rectangular Node Cards */}
      {CYCLE_NODES.map((node, i) => {
        const transformed = linkProgress >= i + 0.5;
        const selected = i === activeIdx;
        const bw = 170;
        const bh = 54;
        const x0 = node.boxX - bw / 2;
        const y0 = node.boxY - bh / 2;
        const borderCol = selected
          ? "#ff9933"
          : transformed
          ? "#10b981"
          : "#ef4444";

        return (
          <g
            key={node.id}
            onClick={() => onSelectNode?.(i)}
            style={{ cursor: onSelectNode ? "pointer" : "default" }}
          >
            {selected && (
              <rect
                x={x0 - 4}
                y={y0 - 4}
                width={bw + 8}
                height={bh + 8}
                rx="6"
                fill="none"
                stroke="#ff9933"
                strokeOpacity="0.65"
                strokeWidth="2"
              />
            )}
            <rect
              x={x0}
              y={y0}
              width={bw}
              height={bh}
              rx="4"
              fill={transformed ? "#052e22" : "#180b12"}
              stroke={borderCol}
              strokeWidth={selected ? 2.4 : 1.7}
            />
            <rect
              x={x0}
              y={y0}
              width={bw}
              height="4"
              fill={transformed ? "#10b981" : "#ef4444"}
            />
            <text
              x={node.boxX}
              y={node.boxY - 3}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="10.5"
              fontWeight="700"
              letterSpacing="0.5"
            >
              {transformed ? node.virtuousTop : node.viciousTop}
            </text>
            <text
              x={node.boxX}
              y={node.boxY + 13}
              textAnchor="middle"
              fill={transformed ? "#6ee7b7" : "#fca5a5"}
              fontSize="10.5"
              fontWeight="700"
              letterSpacing="0.5"
            >
              {transformed ? node.virtuousBottom : node.viciousBottom}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* =========================================================
   FULL-SCREEN CONTINUOUS CINEMATIC VICIOUS CYCLE OVERLAY
========================================================= */

export function ViciousCycleCinematicOverlay({
  open,
  onClose,
  villageName,
}: {
  open: boolean;
  onClose: () => void;
  villageName: string;
}) {
  const progress = useContinuousCyclePhase(8200);

  if (!open) return null;

  const act =
    progress < 0.25
      ? {
          tag: "ACT I · UNEVEN DEVELOPMENT TRAP",
          title: "The Vicious Cycle Compounds Vulnerability",
          color: "text-red-400",
          sub: "Environmental degradation triggers water stress → illness → school dropouts → livelihood collapse.",
        }
      : progress < 0.78
      ? {
          tag: "ACT II · INTERVENTION SHOCKWAVE",
          title: "Shattering Every Weak Link via AI + GIS + Kakatiya Wisdom",
          color: "text-amber-300",
          sub: "Mission Kakatiya recharge, Palle Dawakhana screening, school WASH & FPO value chains break the downward loop.",
        }
      : {
          tag: "ACT III · VIKSIT BHARAT @2047",
          title: "The Virtuous Self-Reinforcing Development Cycle",
          color: "text-emerald-300",
          sub: "Higher crop surplus stabilizes food inflation, strengthens INR purchasing power, and secures rural prosperity.",
        };

  return (
    <div className="fixed inset-0 z-[150] flex flex-col justify-between overflow-y-auto bg-[#04070d]/97 backdrop-blur-2xl text-white p-5 md:p-8">
      <div
        className="pointer-events-none fixed inset-0 transition-opacity duration-500"
        style={{
          background:
            progress < 0.25
              ? "radial-gradient(circle at 50% 45%, rgba(239,68,68,0.22), transparent 58%)"
              : progress < 0.78
              ? "radial-gradient(circle at 50% 45%, rgba(255,153,51,0.26), rgba(16,185,129,0.14) 45%, transparent 65%)"
              : "radial-gradient(circle at 50% 45%, rgba(16,185,129,0.24), rgba(6,182,212,0.14) 45%, transparent 65%)",
        }}
      />

      <div className="relative z-10 max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className={`text-xs font-mono font-bold tracking-[0.2em] ${act.color}`}>
            {act.tag} · {villageName.toUpperCase()}
          </div>
          <h2 className="mt-1 text-xl md:text-3xl font-bold text-white">{act.title}</h2>
          <p className="mt-1 text-xs md:text-sm text-white/70">{act.sub}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white text-slate-900 hover:bg-orange-100 transition shrink-0"
        >
          <X size={14} />
          <span>Return to Dashboard</span>
        </button>
      </div>

      <div className="relative z-10 max-w-4xl w-full mx-auto my-4">
        <CycleGraphicalSVG
          uidPrefix="fullscreen"
          progress={progress}
          activeIdx={Math.min(4, Math.floor(progress * 5))}
          villageName={villageName}
          darkOnly
        />
      </div>

      <div className="relative z-10 max-w-6xl w-full mx-auto space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {LINEAR_CHAIN.map((step, idx) => {
            const flipped = progress >= 0.34 + idx * 0.08;
            return (
              <div
                key={step.id}
                className={`border p-2.5 transition-all duration-300 ${
                  flipped
                    ? "border-emerald-400/60 bg-emerald-500/15"
                    : "border-red-500/50 bg-red-500/15"
                }`}
              >
                <div className="text-[10px] font-mono text-white/60">0{idx + 1}</div>
                <div className="mt-0.5 text-xs font-semibold text-white">
                  {flipped ? step.virtuous : step.vicious}
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-1">
          <div className="h-1.5 w-full bg-white/10 overflow-hidden">
            <div
              className="h-full"
              style={{
                width: `${Math.round(progress * 100)}%`,
                background: "linear-gradient(90deg, #ef4444, #ff9933, #10b981)",
              }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-white/55">
            <span>CONTINUOUS LOOP · VICIOUS TRAP</span>
            <span>INTERVENTION SHOCKWAVE</span>
            <span>VIKSIT BHARAT @2047 ({Math.round(progress * 100)}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INLINE CONTINUOUS INTERACTIVE SECTION IN OVERVIEW
========================================================= */

export default function ViciousToVirtuousCycle({
  lang,
  villageMetrics,
  onOpenFullCinema,
}: {
  lang: LanguageCode;
  villageMetrics: CycleVillageMetrics | null;
  onOpenFullCinema?: () => void;
}) {
  const progress = useContinuousCyclePhase(8000);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const t = UI_TRANSLATIONS[lang];

  const linkProgress = Math.max(0, Math.min(5, ((progress - 0.22) / 0.62) * 5));
  const convertedCount = Math.round(linkProgress);
  const isFullVicious = progress < 0.22;

  function getMetricForNode(id: string): string | null {
    if (!villageMetrics) return null;
    if (id === "env") return `${villageMetrics.solidBiomassPct}% biomass · ${villageMetrics.envScore}/100`;
    if (id === "water") return `${villageMetrics.tanksTotal} tanks · ${villageMetrics.tapWaterPct}% tap`;
    if (id === "health") return `${villageMetrics.openDefecationPct}% open def. · ${villageMetrics.healthScore}/100`;
    if (id === "edu") return `${villageMetrics.literacyRate}% literacy · ${villageMetrics.eduScore}/100`;
    if (id === "liv") return `${villageMetrics.marginalWorkerPct}% marginal · ${villageMetrics.livScore}/100`;
    return null;
  }

  return (
    <section id="vicious-cycle-section" className="max-w-7xl mx-auto px-6 md:px-8 py-14">
      <div className="border border-slate-200 dark:border-white/12 bg-white dark:bg-[#070b12] p-6 md:p-8 space-y-6">
        {/* Header + Full-Screen Cinema Trigger */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold text-orange-600 dark:text-orange-300 flex items-center gap-2">
              <Zap size={13} />
              <span>{t.cycleSectionEyebrow}</span>
            </div>
            <h3 className="mt-1.5 text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white text-balance">
              {t.cycleSectionTitle}
            </h3>
            <p className="mt-2 text-xs md:text-sm leading-6 text-slate-600 dark:text-white/60">
              {t.cycleSectionSub}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="px-3 py-1.5 text-[11px] font-mono border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              ● CONTINUOUS 3-ACT TRANSITION ({convertedCount}/5 TRANSFORMED)
            </span>

            {onOpenFullCinema && (
              <button
                type="button"
                onClick={onOpenFullCinema}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-gradient-to-r from-orange-600 to-emerald-600 hover:opacity-95 text-white transition whitespace-nowrap"
              >
                <Maximize2 size={13} />
                <span>Expanded Cycle View</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Diagram + Breakdown Cards */}
        <div className="grid lg:grid-cols-12 gap-7 items-center">
          <div className="lg:col-span-7">
            <div className="relative border border-slate-200 dark:border-white/10 bg-[#04080e] p-3 overflow-hidden shadow-xl">
              <CycleGraphicalSVG
                uidPrefix="inline"
                progress={progress}
                activeIdx={activeIdx}
                onSelectNode={(idx) => setActiveIdx(idx)}
                villageName={villageMetrics ? villageMetrics.villageName : "Telangana State"}
                darkOnly
              />
            </div>
          </div>

          <div className="lg:col-span-5 space-y-2.5">
            {CYCLE_NODES.map((node, i) => {
              const Icon = node.icon;
              const selected = i === activeIdx;
              const transformed = linkProgress >= i + 0.5;
              const liveMetric = getMetricForNode(node.id);
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={`w-full text-left p-3.5 border transition ${
                    selected
                      ? transformed
                        ? "border-emerald-500/60 bg-emerald-500/[0.08]"
                        : "border-red-500/60 bg-red-500/[0.08]"
                      : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/25"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex h-7 w-7 items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${node.color}20`,
                          color: node.color,
                        }}
                      >
                        <Icon size={14} />
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          {transformed
                            ? `${node.virtuousTop} ${node.virtuousBottom}`
                            : `${node.viciousTop} ${node.viciousBottom}`}
                        </div>
                        <div
                          className="text-[11px] font-medium"
                          style={{ color: transformed ? "#10b981" : "#ef4444" }}
                        >
                          {transformed
                            ? `${node.virtuousCause} ${node.virtuousCauseSub}`
                            : `${node.viciousCause} ${node.viciousCauseSub}`}
                        </div>
                      </div>
                    </div>
                    {liveMetric && (
                      <span className="font-mono text-[10px] tabular-nums text-slate-500 dark:text-white/55 shrink-0">
                        {liveMetric}
                      </span>
                    )}
                  </div>
                  {selected && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-white/10 space-y-1.5">
                      <p className="text-xs leading-5 text-slate-600 dark:text-white/70">
                        {transformed ? node.virtuousDetail : node.viciousDetail}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 dark:text-orange-200">
                        {transformed ? (
                          <ShieldCheck size={12} className="text-emerald-500" />
                        ) : (
                          <TrendingUp size={12} className="text-red-400" />
                        )}
                        <span>
                          {transformed
                            ? `Breakthrough: ${node.scheme}`
                            : "Downward Cascade → Fuels Next Crisis"}
                        </span>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Linear Causal Chain Flowchart */}
        <div className="border-t border-slate-200 dark:border-white/10 pt-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-900 dark:text-white">
              Causal Domino Chain Transition
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-white/55">
              {isFullVicious
                ? "DOWNWARD TRAP: Climate Shock → Food Shortage → Health Crisis → Poverty"
                : "UPWARD TRANSFORMATION: Solar/Water Recharge → Agri Surplus → Viksit Growth"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {LINEAR_CHAIN.map((step, idx) => {
              const transformed = progress >= 0.34 + idx * 0.08;
              return (
                <div
                  key={step.id}
                  className={`relative border p-3 transition-all duration-300 ${
                    transformed
                      ? "border-emerald-500/45 bg-emerald-500/[0.08]"
                      : "border-red-500/40 bg-red-500/[0.06]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                    <span
                      className={
                        transformed
                          ? "text-emerald-600 dark:text-emerald-300 font-bold"
                          : "text-red-600 dark:text-red-300 font-bold"
                      }
                    >
                      STEP 0{idx + 1}
                    </span>
                    {idx < LINEAR_CHAIN.length - 1 && (
                      <ArrowRight
                        size={12}
                        className={transformed ? "text-emerald-500" : "text-red-400"}
                      />
                    )}
                  </div>
                  <div className="mt-1.5 text-xs font-semibold text-slate-900 dark:text-white leading-snug">
                    {transformed ? step.virtuous : step.vicious}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
