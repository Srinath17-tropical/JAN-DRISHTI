import { useMemo, useState } from "react";
import {
  Baby,
  Check,
  Copy,
  Download,
  Droplets,
  FileCheck2,
  GraduationCap,
  HeartPulse,
  PhoneCall,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sprout,
  Store,
  Users,
} from "lucide-react";
import type { SectorInsightsVillage } from "./SectorActionModules";

export type CitizenPersonaKey =
  | "farmer"
  | "student"
  | "women"
  | "senior"
  | "shg"
  | "health";

type EcosystemZoneKey = "water" | "solar" | "health" | "school" | "fpo";

type SchemeDefinition = {
  id: string;
  name: string;
  authority: string;
  personas: CitizenPersonaKey[];
  zone: EcosystemZoneKey;
  annualCashFn: (ctx: HouseholdCtx) => number;
  protectionCoverInr: number;
  benefitSummary: string;
  requiresRationCard?: boolean;
  eligibilityNote: string;
  documents: string[];
  whereToApply: string;
};

type HouseholdCtx = {
  acres: number;
  hasRationCard: boolean;
  familySize: number;
  studentsInFamily: number;
};

const PERSONA_TABS: {
  key: CitizenPersonaKey;
  label: string;
  shortLabel: string;
  icon: typeof Sprout;
}[] = [
  { key: "farmer", label: "Farmer & Landholder", shortLabel: "Farmer", icon: Sprout },
  { key: "student", label: "Student & Youth", shortLabel: "Student", icon: GraduationCap },
  { key: "women", label: "Women & Maternal", shortLabel: "Women", icon: Baby },
  { key: "senior", label: "Senior & Daily Worker", shortLabel: "Senior & Worker", icon: Users },
  { key: "shg", label: "SHG & Rural Business", shortLabel: "SHG & FPO", icon: Store },
  { key: "health", label: "Health & Emergency", shortLabel: "Health & 108", icon: HeartPulse },
];

const SCHEMES: SchemeDefinition[] = [
  {
    id: "rythu-bharosa",
    name: "Rythu Bharosa Crop Investment Support",
    authority: "Government of Telangana · Agriculture",
    personas: ["farmer"],
    zone: "fpo",
    annualCashFn: (ctx) => Math.min(10, Math.max(1, ctx.acres)) * 15000,
    protectionCoverInr: 0,
    benefitSummary: "₹15,000 per acre/year (₹7,500 Kharif + ₹7,500 Yasangi) direct bank transfer",
    eligibilityNote: "Pattadar farmers & cultivating tenants across Telangana revenue villages",
    documents: ["Dharani / Bhu Bharati Passbook", "Aadhaar Card", "Active Bank Passbook"],
    whereToApply: "Mandal Agriculture Office (MAO) / Rythu Vedika",
  },
  {
    id: "rythu-bima",
    name: "Rythu Bima Farmer Family Insurance",
    authority: "Government of Telangana · LIC Cover",
    personas: ["farmer", "health"],
    zone: "health",
    annualCashFn: () => 0,
    protectionCoverInr: 500000,
    benefitSummary: "₹5,00,000 term life assurance settled within 10 days to nominee",
    eligibilityNote: "Land-owning farmers aged 18–59 years with valid pattadar passbook",
    documents: ["Pattadar Passbook", "Farmer Aadhaar", "Nominee Aadhaar & Bank Details"],
    whereToApply: "Village Agriculture Extension Officer (AEO)",
  },
  {
    id: "pm-kusum-solar",
    name: "PM-KUSUM Solar Pump & Feeder Subsidy",
    authority: "MNRE & TGREDCO · Clean Energy",
    personas: ["farmer", "shg"],
    zone: "solar",
    annualCashFn: (ctx) => Math.round(Math.min(8, ctx.acres) * 8500),
    protectionCoverInr: 180000,
    benefitSummary: "60% capital subsidy on 3–7.5 HP solar water pumps + diesel savings",
    eligibilityNote: "Farmers with borewell/open-well irrigation seeking daytime solar power",
    documents: ["Aadhaar Card", "Land Record", "Bank Passbook", "Water Source Photo"],
    whereToApply: "TGREDCO Portal / District Collectorate Solar Desk",
  },
  {
    id: "gruha-jyothi",
    name: "Gruha Jyothi 200-Unit Zero Power Bill",
    authority: "Telangana Guarantee · Energy",
    personas: ["farmer", "student", "women", "senior", "shg", "health"],
    zone: "solar",
    requiresRationCard: true,
    annualCashFn: (ctx) => (ctx.hasRationCard ? 16800 : 0),
    protectionCoverInr: 0,
    benefitSummary: "Up to 200 electricity units/month free (~₹1,400/mo household saving)",
    eligibilityNote: "Domestic households holding a White Ration Card & active meter",
    documents: ["White Ration Card", "Electricity USC Service No.", "Aadhaar Card"],
    whereToApply: "Praja Palana Service Counter / Mandal Parishad Office",
  },
  {
    id: "mahalakshmi-lpg",
    name: "Mahalakshmi ₹500 LPG + Free RTC Bus",
    authority: "Telangana Guarantee · Civil Supplies & Transport",
    personas: ["women", "farmer", "senior", "student"],
    zone: "solar",
    requiresRationCard: true,
    annualCashFn: (ctx) => (ctx.hasRationCard ? 12600 : 6000),
    protectionCoverInr: 0,
    benefitSummary: "₹500 subsidized cooking gas cylinder + zero-fare TSRTC ordinary/express bus travel",
    eligibilityNote: "Women residents in Telangana (free bus on Aadhaar; LPG with White Ration Card)",
    documents: ["Aadhaar Card (Telangana address)", "White Ration Card", "LPG Consumer ID"],
    whereToApply: "Praja Palana Counter / Gas Agency e-KYC",
  },
  {
    id: "aarogyasri",
    name: "Rajiv Aarogyasri ₹10 Lakh Health Cover",
    authority: "Aarogyasri Health Care Trust",
    personas: ["health", "women", "senior", "farmer", "student"],
    zone: "health",
    requiresRationCard: true,
    annualCashFn: (ctx) => (ctx.hasRationCard ? 8500 : 0),
    protectionCoverInr: 1000000,
    benefitSummary: "₹10,00,000 cashless tertiary hospital care across 1,672+ surgical & medical packages",
    eligibilityNote: "All White Ration / Food Security Card families across Telangana",
    documents: ["White Ration Card / Aarogyasri Card", "Family Member Aadhaar"],
    whereToApply: "Aarogyamitra Helpdesk at Area/District Hospital or PHC",
  },
  {
    id: "kcr-nutrition-maternal",
    name: "Maternal Nutrition & 108/102 Safe Delivery",
    authority: "Telangana Health & Family Welfare",
    personas: ["women", "health"],
    zone: "health",
    annualCashFn: () => 12000,
    protectionCoverInr: 100000,
    benefitSummary: "₹12,000 staged maternal support + free 102 Amma Odi transport & nutrition kit",
    eligibilityNote: "Pregnant & lactating mothers delivering in government PHCs / CHCs",
    documents: ["MCP Mother-Child Card", "Aadhaar Card", "Bank Account linked to Aadhaar"],
    whereToApply: "Nearest Anganwadi Centre / Village ASHA Worker",
  },
  {
    id: "epass-scholarship",
    name: "Telangana ePASS Post-Matric & Overseas Vidya",
    authority: "SC / ST / BC / Minority Welfare",
    personas: ["student"],
    zone: "school",
    annualCashFn: (ctx) => Math.max(1, ctx.studentsInFamily) * 28000,
    protectionCoverInr: 2000000,
    benefitSummary: "Full tuition fee reimbursement (RTF) + mess/hostel allowance (MTF); up to ₹20L overseas grant",
    eligibilityNote: "Students in Intermediate, Degree, B.Tech, Medical & PG with family income < ₹2L/yr",
    documents: ["Income & Caste Certificate (Meeseva)", "Bonafide / CET Allotment", "Aadhaar", "Bank Passbook"],
    whereToApply: "telanganaepass.cgg.gov.in / College Scholarship Cell",
  },
  {
    id: "yuva-vikasam-skill",
    name: "Rural Youth Digital & Solar Technician Grant",
    authority: "TASK · DDU-GKY & Rajiv Yuva Vikasam",
    personas: ["student", "shg"],
    zone: "school",
    annualCashFn: (ctx) => Math.max(1, ctx.studentsInFamily) * 18000,
    protectionCoverInr: 250000,
    benefitSummary: "Free job-linked residential training + ₹50K–₹3L subsidized youth self-employment unit",
    eligibilityNote: "Rural youth aged 18–35 seeking tech, agri-drone, solar or healthcare jobs",
    documents: ["10th / Inter Marks Memo", "Aadhaar Card", "Ration Card", "Community Certificate"],
    whereToApply: "MPDO Office / Telangana Academy for Skill and Knowledge (TASK)",
  },
  {
    id: "aasara-pension",
    name: "Cheyutha / Aasara Social Security Pension",
    authority: "SERP Telangana · Rural Development",
    personas: ["senior", "women"],
    zone: "health",
    requiresRationCard: true,
    annualCashFn: (ctx) => (ctx.hasRationCard ? 24192 : 0),
    protectionCoverInr: 0,
    benefitSummary: "₹2,016/month elderly, widow & weaver pension (₹4,016/month for Persons with Disabilities)",
    eligibilityNote: "Senior citizens (57+ yrs), single women, widows, toddy tappers & PwDs",
    documents: ["Age Proof / SADAREM Certificate", "White Ration Card", "Aadhaar & Post/Bank Passbook"],
    whereToApply: "Grama Panchayat Secretary / MPDO Praja Palana Desk",
  },
  {
    id: "indiramma-housing",
    name: "Indiramma Indlu Pucca Home Grant",
    authority: "Telangana Housing Corporation",
    personas: ["senior", "women", "farmer"],
    zone: "water",
    requiresRationCard: true,
    annualCashFn: () => 0,
    protectionCoverInr: 500000,
    benefitSummary: "₹5,00,000 staged construction assistance (plus 250 sq.yd house-site for landless families)",
    eligibilityNote: "Houseless rural families living in kutcha / mud-wall dwellings",
    documents: ["White Ration Card", "Aadhaar Card", "Site Possession Proof (if owned)", "Praja Palana Receipt"],
    whereToApply: "Grama Sabha Selection List / Tahsildar Office",
  },
  {
    id: "shg-streenidhi",
    name: "SHG Zero-Interest Loan & FPO Cold-Chain",
    authority: "SERP · Stree Nidhi & PMFME",
    personas: ["shg", "women", "farmer"],
    zone: "fpo",
    annualCashFn: (ctx) => Math.round(ctx.familySize * 6500),
    protectionCoverInr: 350000,
    benefitSummary: "Collateral-free working capital + 35% PMFME credit-linked grant for food/millet processing",
    eligibilityNote: "Women Self-Help Group (DWCRA) members & Farmer Producer Organisations",
    documents: ["SHG Resolution Copy", "Member Aadhaar & Pan", "Project Estimate", "Bank Account"],
    whereToApply: "Village Organisation Assistant (VOA) / District DRDA-SERP",
  },
];

const HELPLINES = [
  { code: "108", name: "Emergency Ambulance", desc: "24×7 Medical & Trauma Dispatch" },
  { code: "104", name: "Health Advice", desc: "Doctor on Call & Maternal Guidance" },
  { code: "181", name: "Women Helpline", desc: "She Teams & Domestic Protection" },
  { code: "1098", name: "Childline India", desc: "Child Rescue & Education Safety" },
  { code: "1551", name: "Kisan Call Centre", desc: "Crop Advisory, Soil & MSP Help" },
  { code: "1930", name: "Cyber Fraud", desc: "Instant UPI & Banking Fraud Freeze" },
];

const ZONE_META: Record<
  EcosystemZoneKey,
  { title: string; subtitle: string; color: string; stroke: string }
> = {
  water: {
    title: "Kakatiya Tank & Treated Tap Grid",
    subtitle: "Mission Bhagiratha filtration, checkdams & household water taps",
    color: "#38bdf8",
    stroke: "rgba(56, 189, 248, 0.75)",
  },
  solar: {
    title: "Solar Micro-Grid & Clean Kitchens",
    subtitle: "200-unit Gruha Jyothi, PM-KUSUM daytime feeders & ₹500 LPG",
    color: "#fbbf24",
    stroke: "rgba(251, 191, 36, 0.8)",
  },
  health: {
    title: "Primary Health & 108 Lifeline Hub",
    subtitle: "Aarogyasri ₹10L cover, safe motherhood & emergency dispatch",
    color: "#10b981",
    stroke: "rgba(16, 185, 129, 0.8)",
  },
  school: {
    title: "Smart ZP School & Youth Skill Hub",
    subtitle: "ePASS scholarships, digital classrooms & rural STEM pathways",
    color: "#a78bfa",
    stroke: "rgba(167, 139, 250, 0.8)",
  },
  fpo: {
    title: "FPO Cold Storage & Agro-Processing",
    subtitle: "Rythu Bharosa capital, grading sheds & MSP value addition",
    color: "#f472b6",
    stroke: "rgba(244, 114, 182, 0.8)",
  },
};

function formatInr(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} Lakh`;
  }
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

/* =========================================================
   LIVING VILLAGE ARCHITECTURAL ECOSYSTEM DIORAMA (SVG)
========================================================= */
function LivingVillageEcosystemScene({
  village,
  transformationPct,
  activeZone,
  onSelectZone,
}: {
  village: SectorInsightsVillage | null;
  transformationPct: number;
  activeZone: EcosystemZoneKey | null;
  onSelectZone: (zone: EcosystemZoneKey) => void;
}) {
  const t = transformationPct / 100; // 0 = current village baseline, 1 = full welfare + infra uplift

  const baseWater = village ? village.water.tapWaterTotalPct / 100 : 0.62;
  const baseSolar = village ? Math.max(0.15, village.environment.solarLightingPct / 100) : 0.28;
  const baseHealth = village ? village.health.score / 100 : 0.65;
  const baseSchool = village ? village.education.score / 100 : 0.62;
  const baseFpo = village ? village.livelihood.score / 100 : 0.58;

  const waterFill = Math.min(1, baseWater + (1 - baseWater) * t);
  const solarGlow = Math.min(1, baseSolar + (1 - baseSolar) * t);
  const healthGlow = Math.min(1, baseHealth + (1 - baseHealth) * t);
  const schoolGlow = Math.min(1, baseSchool + (1 - baseSchool) * t);
  const fpoGlow = Math.min(1, baseFpo + (1 - baseFpo) * t);

  // Air clarity transitions from dusty smoke haze to crisp blue-emerald horizon
  const smokeOpacity = Math.max(0.04, (1 - solarGlow) * 0.58);
  const tankWaterHeight = 14 + waterFill * 30;
  const tankWaterY = 278 - tankWaterHeight;

  return (
    <div className="relative rounded-xl border border-white/10 bg-[#050b16] overflow-hidden">
      {/* Minimal Visual Title Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-white/10 bg-white/[0.02]">
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-cyan-300">
            Interactive Village Ecosystem Twin · Click Any Hub to Filter Schemes
          </div>
          <div className="text-xs text-white/60 truncate">
            {village
              ? `${village.villageName}, ${village.mandalName} (${village.districtName}) · ${village.households.toLocaleString("en-IN")} Households`
              : "Telangana Gram Panchayat Reference Ecosystem"}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs tabular-nums">
          <span className="text-white/55">Transformation</span>
          <span className="font-mono font-semibold text-emerald-300">
            {transformationPct === 0 ? "Current Baseline" : `+${transformationPct}% Uplift`}
          </span>
        </div>
      </div>

      {/* Precision SVG Vector Landscape */}
      <svg
        viewBox="0 0 760 400"
        className="w-full h-auto block select-none"
        role="img"
        aria-label="Interactive village infrastructure and household ecosystem diagram"
      >
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={t > 0.5 ? "#081c34" : "#0b1120"} />
            <stop offset="55%" stopColor={t > 0.5 ? "#0f2e4d" : "#151f33"} />
            <stop offset="100%" stopColor={t > 0.5 ? "#133d54" : "#1d2638"} />
          </linearGradient>
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.28 + solarGlow * 0.45} />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hillFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={t > 0.45 ? "#113a41" : "#1a2537"} />
            <stop offset="100%" stopColor="#091523" />
          </linearGradient>
          <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={t > 0.4 ? "#0c2d2a" : "#17212b"} />
            <stop offset="100%" stopColor="#070e18" />
          </linearGradient>
          <linearGradient id="waterTankGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
          <linearGradient id="cropGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={waterFill > 0.7 ? "#34d399" : "#84a98c"} />
            <stop offset="100%" stopColor={waterFill > 0.7 ? "#059669" : "#3a5a40"} />
          </linearGradient>
        </defs>

        {/* Sky & Horizon */}
        <rect width="760" height="400" fill="url(#skyGrad)" />

        {/* Sun / Solar Potential Orb */}
        <circle cx="645" cy="74" r={64 + solarGlow * 28} fill="url(#sunGlow)" />
        <circle
          cx="645"
          cy="74"
          r="20"
          fill="#fbbf24"
          opacity={0.55 + solarGlow * 0.45}
        />

        {/* Subtle Deccan Granite Hills Backdrop */}
        <path
          d="M 0 218 Q 110 155 230 198 T 480 185 T 760 205 L 760 270 L 0 270 Z"
          fill="url(#hillFar)"
        />

        {/* Ground Terrain */}
        <path
          d="M 0 232 Q 190 216 380 230 T 760 226 L 760 400 L 0 400 Z"
          fill="url(#groundGrad)"
        />

        {/* Village Main Paved Spine Road */}
        <path
          d="M 0 342 Q 240 318 470 332 T 760 326 L 760 358 Q 470 364 240 350 L 0 374 Z"
          fill="#0f172a"
          stroke="rgba(148,163,184,0.22)"
          strokeWidth="1"
        />
        <path
          d="M 15 358 Q 245 334 470 348 T 745 342"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1.5"
          strokeDasharray="10 10"
        />

        {/* Underground Mission Bhagiratha Water Pipe Grid (Lights up as waterFill rises) */}
        <path
          d="M 135 282 L 135 316 L 620 316"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="3"
          opacity={0.25 + waterFill * 0.65}
          strokeDasharray="6 4"
        />

        {/* Irrigated Crop Strips beside Kakatiya Tank */}
        {[0, 1, 2, 3].map((idx) => (
          <path
            key={idx}
            d={`M ${42 + idx * 32} 292 L ${62 + idx * 32} 292 L ${70 + idx * 32} 325 L ${34 + idx * 32} 325 Z`}
            fill="url(#cropGreen)"
            opacity={0.35 + waterFill * 0.65}
          />
        ))}

        {/* =======================================================
            ZONE 1: KAKATIYA TANK & TREATED TAP WATER GRID (LEFT)
        ======================================================= */}
        <g
          className="cursor-pointer transition-opacity"
          onClick={() => onSelectZone("water")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onSelectZone("water")}
        >
          {/* Selection halo */}
          {activeZone === "water" && (
            <rect
              x="22"
              y="206"
              width="172"
              height="94"
              rx="10"
              fill="rgba(56,189,248,0.1)"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
          )}
          {/* Reservoir Bund Wall */}
          <rect x="36" y="232" width="136" height="48" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
          {/* Dynamic Water Level */}
          <rect
            x="40"
            y={tankWaterY}
            width="128"
            height={tankWaterHeight}
            rx="4"
            fill="url(#waterTankGrad)"
            style={{ transition: "all 450ms ease" }}
          />
          {/* Water Surface Shimmer */}
          <line
            x1="48"
            y1={tankWaterY + 4}
            x2="156"
            y2={tankWaterY + 4}
            stroke="#bae6fd"
            strokeWidth="1.5"
            opacity="0.7"
          />
          {/* Overhead Bhagiratha Tank Tower */}
          <line x1="176" y1="278" x2="181" y2="225" stroke="#64748b" strokeWidth="2.5" />
          <line x1="196" y1="278" x2="191" y2="225" stroke="#64748b" strokeWidth="2.5" />
          <rect x="172" y="210" width="28" height="18" rx="4" fill="#0284c7" stroke="#bae6fd" strokeWidth="1.2" />

          {/* Clean Label Tag */}
          <rect x="36" y="182" width="136" height="22" rx="4" fill="#071120" stroke="rgba(56,189,248,0.45)" />
          <text x="104" y="196" textAnchor="middle" fill="#7dd3fc" fontSize="10" fontWeight="600">
            WATER · {Math.round(waterFill * 100)}%
          </text>
        </g>

        {/* =======================================================
            ZONE 2: SOLAR MICRO-GRID & CLEAN HOME (CENTER-LEFT)
        ======================================================= */}
        <g
          className="cursor-pointer"
          onClick={() => onSelectZone("solar")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onSelectZone("solar")}
        >
          {activeZone === "solar" && (
            <rect
              x="208"
              y="184"
              width="128"
              height="118"
              rx="10"
              fill="rgba(251,191,36,0.08)"
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
          )}

          {/* Indoor Biomass Smoke (fades out as solar & LPG subsidy take over) */}
          <g opacity={smokeOpacity} style={{ transition: "opacity 450ms ease" }}>
            <circle cx="298" cy="196" r="10" fill="#94a3b8" />
            <circle cx="308" cy="180" r="13" fill="#64748b" />
            <circle cx="318" cy="164" r="15" fill="#475569" />
          </g>

          {/* Indiramma / Village Smart Home */}
          <rect x="224" y="242" width="92" height="50" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1.2" />
          <polygon points="216,242 270,210 324,242" fill="#334155" stroke="#64748b" strokeWidth="1.2" />
          {/* Rooftop Solar Panels (Glow amber-blue when active) */}
          <polygon
            points="232,235 268,215 294,215 262,235"
            fill={solarGlow > 0.55 ? "#0284c7" : "#1e3a5f"}
            stroke="#fbbf24"
            strokeWidth={0.8 + solarGlow * 1.4}
          />
          {/* Warm LED House Windows */}
          <rect
            x="238"
            y="256"
            width="18"
            height="16"
            rx="2"
            fill="#fbbf24"
            opacity={0.35 + solarGlow * 0.65}
          />
          <rect x="266" y="260" width="16" height="32" rx="2" fill="#0f172a" stroke="#475569" />
          <rect
            x="290"
            y="256"
            width="18"
            height="16"
            rx="2"
            fill="#fbbf24"
            opacity={0.35 + solarGlow * 0.65}
          />

          <rect x="218" y="160" width="106" height="22" rx="4" fill="#071120" stroke="rgba(251,191,36,0.45)" />
          <text x="271" y="174" textAnchor="middle" fill="#fde68a" fontSize="10" fontWeight="600">
            SOLAR &amp; LPG · {Math.round(solarGlow * 100)}%
          </text>
        </g>

        {/* =======================================================
            ZONE 3: PRIMARY HEALTH CLINIC & 108 LIFELINE (CENTER)
        ======================================================= */}
        <g
          className="cursor-pointer"
          onClick={() => onSelectZone("health")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onSelectZone("health")}
        >
          {activeZone === "health" && (
            <rect
              x="346"
              y="188"
              width="136"
              height="118"
              rx="10"
              fill="rgba(16,185,129,0.08)"
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
          )}

          {/* Coverage Halo */}
          <circle
            cx="414"
            cy="242"
            r={38 + healthGlow * 16}
            fill="none"
            stroke="#10b981"
            strokeWidth="1"
            opacity={0.2 + healthGlow * 0.35}
            strokeDasharray="3 4"
          />

          {/* Health Sub-Centre Building */}
          <rect x="358" y="232" width="110" height="62" rx="4" fill="#172536" stroke="#34d399" strokeWidth="1.2" />
          <rect x="354" y="224" width="118" height="10" rx="2" fill="#065f46" />
          {/* Medical Cross Emblem */}
          <rect x="409" y="242" width="10" height="26" rx="2" fill="#10b981" />
          <rect x="401" y="250" width="26" height="10" rx="2" fill="#10b981" />
          {/* 108 Ambulance Silhouette Parked */}
          <rect x="442" y="274" width="32" height="16" rx="3" fill="#e2e8f0" />
          <rect x="464" y="278" width="10" height="8" rx="1" fill="#38bdf8" />
          <rect x="452" y="270" width="8" height="4" rx="1" fill="#ef4444" />
          <circle cx="449" cy="291" r="4" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
          <circle cx="468" cy="291" r="4" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />

          <rect x="358" y="160" width="112" height="22" rx="4" fill="#071120" stroke="rgba(16,185,129,0.5)" />
          <text x="414" y="174" textAnchor="middle" fill="#6ee7b7" fontSize="10" fontWeight="600">
            HEALTH · {Math.round(healthGlow * 100)}%
          </text>
        </g>

        {/* =======================================================
            ZONE 4: SMART ZP SCHOOL & YOUTH HUB (CENTER-RIGHT)
        ======================================================= */}
        <g
          className="cursor-pointer"
          onClick={() => onSelectZone("school")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onSelectZone("school")}
        >
          {activeZone === "school" && (
            <rect
              x="492"
              y="188"
              width="124"
              height="118"
              rx="10"
              fill="rgba(167,139,250,0.08)"
              stroke="#a78bfa"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
          )}

          {/* School Campus */}
          <rect x="502" y="232" width="104" height="62" rx="4" fill="#1e223d" stroke="#818cf8" strokeWidth="1.2" />
          <polygon points="496,232 554,205 612,232" fill="#312e81" stroke="#a5b4fc" strokeWidth="1.1" />
          {/* Digital Fiber / Wi-Fi Mast */}
          <line x1="554" y1="205" x2="554" y2="186" stroke="#c4b5fd" strokeWidth="2" />
          <circle cx="554" cy="184" r="3.5" fill="#a78bfa" />
          {/* Classroom Windows */}
          {[0, 1, 2].map((w) => (
            <rect
              key={w}
              x={514 + w * 28}
              y="248"
              width="20"
              height="16"
              rx="2"
              fill="#c4b5fd"
              opacity={0.3 + schoolGlow * 0.65}
            />
          ))}
          <rect x="544" y="272" width="20" height="22" rx="2" fill="#0f172a" />

          <rect x="498" y="160" width="112" height="22" rx="4" fill="#071120" stroke="rgba(167,139,250,0.5)" />
          <text x="554" y="174" textAnchor="middle" fill="#ddd6fe" fontSize="10" fontWeight="600">
            SCHOOL · {Math.round(schoolGlow * 100)}%
          </text>
        </g>

        {/* =======================================================
            ZONE 5: FPO COLD STORAGE & AGRO MARKET (RIGHT)
        ======================================================= */}
        <g
          className="cursor-pointer"
          onClick={() => onSelectZone("fpo")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onSelectZone("fpo")}
        >
          {activeZone === "fpo" && (
            <rect
              x="622"
              y="194"
              width="124"
              height="112"
              rx="10"
              fill="rgba(244,114,182,0.08)"
              stroke="#f472b6"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
          )}

          {/* Solar Cold-Chain Godown */}
          <path
            d="M 632 238 Q 684 214 736 238 L 736 294 L 632 294 Z"
            fill="#27192f"
            stroke="#f472b6"
            strokeWidth="1.2"
          />
          <rect x="650" y="256" width="68" height="38" rx="2" fill="#111827" stroke="#475569" />
          {/* Cold Storage Cooling Gauge */}
          <rect
            x="662"
            y="264"
            width={Math.round(44 * fpoGlow)}
            height="6"
            rx="3"
            fill="#f472b6"
          />
          <text x="684" y="284" textAnchor="middle" fill="#fbcfe8" fontSize="9" fontFamily="monospace">
            FPO COLD-CHAIN
          </text>

          <rect x="628" y="160" width="112" height="22" rx="4" fill="#071120" stroke="rgba(244,114,182,0.5)" />
          <text x="684" y="174" textAnchor="middle" fill="#fbcfe8" fontSize="10" fontWeight="600">
            FPO &amp; JOBS · {Math.round(fpoGlow * 100)}%
          </text>
        </g>

        {/* Interactive Legend Footer Strip inside Canvas */}
        <text x="380" y="388" textAnchor="middle" fill="rgba(255,255,255,0.48)" fontSize="10.5">
          Click any village hub above (Water · Solar · Health · School · FPO) to inspect schemes &amp; local facilities
        </text>
      </svg>
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT: CITIZEN LIFELINE & SCHEME MATCHMAKER
========================================================= */
export default function CitizenLifelineSchemeStudio({
  village,
  defaultPersona = "farmer",
}: {
  village: SectorInsightsVillage | null;
  defaultPersona?: CitizenPersonaKey;
}) {
  const [persona, setPersona] = useState<CitizenPersonaKey>(defaultPersona);
  const [activeZone, setActiveZone] = useState<EcosystemZoneKey | null>(null);
  const [transformationPct, setTransformationPct] = useState<number>(65);

  const [hasRationCard, setHasRationCard] = useState<boolean>(true);
  const [acres, setAcres] = useState<number>(2);
  const [familySize, setFamilySize] = useState<number>(4);
  const [studentsInFamily, setStudentsInFamily] = useState<number>(1);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  const ctx: HouseholdCtx = useMemo(
    () => ({ acres, hasRationCard, familySize, studentsInFamily }),
    [acres, hasRationCard, familySize, studentsInFamily]
  );

  // Schemes matching either the clicked ecosystem zone (if selected) or active citizen persona
  const matchedSchemes = useMemo(() => {
    return SCHEMES.filter((s) => {
      const personaMatch = s.personas.includes(persona);
      const zoneMatch = activeZone ? s.zone === activeZone : true;
      return activeZone ? zoneMatch : personaMatch;
    }).map((s) => ({
      ...s,
      annualInr: s.annualCashFn(ctx),
      eligible: s.requiresRationCard ? hasRationCard : true,
    }));
  }, [persona, activeZone, ctx, hasRationCard]);

  const totalAnnualBenefitInr = useMemo(
    () =>
      matchedSchemes.reduce(
        (acc, item) => acc + (item.eligible ? item.annualInr : 0),
        0
      ),
    [matchedSchemes]
  );

  const totalProtectionCoverInr = useMemo(
    () =>
      matchedSchemes.reduce(
        (acc, item) => acc + (item.eligible ? item.protectionCoverInr : 0),
        0
      ),
    [matchedSchemes]
  );

  const villageSummaryLines = useMemo(() => {
    const vName = village?.villageName ?? "Selected Telangana Village";
    const dName = village?.districtName ?? "Telangana";
    return [
      `JAN-DRISHTI CITIZEN BENEFIT & LIFELINE PLAN`,
      `Village: ${vName}, ${village?.mandalName ?? ""} (${dName})`,
      `Profile: ${PERSONA_TABS.find((p) => p.key === persona)?.label ?? persona}`,
      `White Ration Card: ${hasRationCard ? "Yes" : "No"} | Acres: ${acres} | Family: ${familySize} | Students: ${studentsInFamily}`,
      `Estimated Annual Cash & Subsidy Value: ${formatInr(totalAnnualBenefitInr)} / year`,
      `Family Health, Life & Asset Cover: ${formatInr(totalProtectionCoverInr)}`,
      ``,
      `MATCHED SCHEMES & WHERE TO APPLY:`,
      ...matchedSchemes.map(
        (m, idx) =>
          `${idx + 1}. ${m.name} (${m.eligible ? "Eligible" : "Needs White Ration Card"})\n   Benefit: ${m.benefitSummary}\n   Documents: ${m.documents.join(", ")}\n   Apply at: ${m.whereToApply}`
      ),
      ``,
      `LOCAL EMERGENCY & SERVICE POINTS:`,
      `- Nearest Hospital/PHC: ${village?.health.nearestHealthName ?? "Mandal Area Hospital"} (${village?.health.nearestHealthKm?.toFixed(1) ?? "3.0"} km) | Call 108 / 104`,
      `- Nearest School: ${village?.education.nearestSchoolName ?? "ZP High School"} (${village?.education.nearestSchoolKm?.toFixed(1) ?? "1.2"} km)`,
      `- Nearest Water Source: ${village?.water.nearestWaterName ?? "Mission Bhagiratha Tank"} (${village?.water.nearestWaterKm?.toFixed(1) ?? "0.8"} km)`,
    ].join("\n");
  }, [
    village,
    persona,
    hasRationCard,
    acres,
    familySize,
    studentsInFamily,
    totalAnnualBenefitInr,
    totalProtectionCoverInr,
    matchedSchemes,
  ]);

  const handleCopyChecklist = async () => {
    try {
      await navigator.clipboard.writeText(villageSummaryLines);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2400);
    } catch {
      setCopiedId(false);
    }
  };

  const handleDownloadPlan = () => {
    const blob = new Blob([villageSummaryLines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const slug = (village?.villageName ?? "telangana-village")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    link.download = `citizen-benefit-plan-${slug}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Dynamic village household savings projection scaled by transformation slider
  const communityImpact = useMemo(() => {
    const hh = village?.households ?? 420;
    const solarGapPct = village ? Math.max(5, 100 - village.environment.solarLightingPct) : 65;
    const tapGapPct = village ? Math.max(5, 100 - village.water.tapWaterTotalPct) : 35;
    const smokeFreeHomes = Math.round(((hh * solarGapPct) / 100) * (transformationPct / 100));
    const pipedWaterHomes = Math.round(((hh * tapGapPct) / 100) * (transformationPct / 100));
    const annualVillageValueCr = (
      (hh * (totalAnnualBenefitInr || 36000) * (0.4 + 0.6 * (transformationPct / 100))) /
      10000000
    ).toFixed(2);
    return { smokeFreeHomes, pipedWaterHomes, annualVillageValueCr };
  }, [village, transformationPct, totalAnnualBenefitInr]);

  return (
    <section
      aria-label="Citizen Welfare Matchmaker and Living Village Ecosystem"
      className="rounded-xl border border-white/10 bg-[#070d18] overflow-hidden"
    >
      {/* Top Studio Header */}
      <div className="px-6 py-5 border-b border-white/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white/[0.015]">
        <div>
          <p className="text-xs font-medium text-emerald-300">
            Citizen Utility · Village Digital Twin &amp; Welfare Finder
          </p>
          <h3 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight text-white text-balance">
            Personal Scheme Matchmaker &amp; Living Village Twin
          </h3>
          <p className="mt-1 text-xs md:text-sm text-white/60 max-w-2xl">
            See how clean water, rooftop solar, healthcare, and education transform{" "}
            <span className="text-white/90 font-medium">
              {village?.villageName ?? "your village"}
            </span>
            , and calculate exact Central &amp; Telangana family benefits in 30 seconds.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyChecklist}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-white transition-colors whitespace-nowrap"
          >
            {copiedId ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Copied Checklist
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-white/70" />
                Copy Plan
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDownloadPlan}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-xs font-semibold text-slate-950 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Download Citizen Plan
          </button>
        </div>
      </div>

      {/* Main Two-Column Workbench */}
      <div className="p-6 grid lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 cols): Living Village Interactive SVG Diorama + Transformation Control */}
        <div className="lg:col-span-7 space-y-4">
          <LivingVillageEcosystemScene
            village={village}
            transformationPct={transformationPct}
            activeZone={activeZone}
            onSelectZone={(z) => setActiveZone((prev) => (prev === z ? null : z))}
          />

          {/* Interactive Village Transformation Slider */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="village-transform-slider"
                className="flex items-center gap-2 text-xs font-medium text-white/90"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-300" />
                Simulate Village Welfare &amp; Infrastructure Uplift
              </label>
              <div className="flex items-center gap-3 text-xs tabular-nums">
                {activeZone && (
                  <button
                    type="button"
                    onClick={() => setActiveZone(null)}
                    className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200 underline underline-offset-4"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Show Persona Filter
                  </button>
                )}
                <span className="font-mono text-cyan-300 font-semibold">
                  {transformationPct}% Uplift
                </span>
              </div>
            </div>

            <input
              id="village-transform-slider"
              type="range"
              min={0}
              max={100}
              step={5}
              value={transformationPct}
              onChange={(e) => setTransformationPct(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />

            {/* Measurable Village-Scale Impact Strip */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2.5">
                <div className="text-[11px] text-white/55">Clean Kitchens Added</div>
                <div className="mt-0.5 text-base font-semibold text-amber-300 font-mono tabular-nums">
                  +{communityImpact.smokeFreeHomes.toLocaleString("en-IN")}
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2.5">
                <div className="text-[11px] text-white/55">Piped Water Homes</div>
                <div className="mt-0.5 text-base font-semibold text-cyan-300 font-mono tabular-nums">
                  +{communityImpact.pipedWaterHomes.toLocaleString("en-IN")}
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2.5">
                <div className="text-[11px] text-white/55">Annual Village Liquidity</div>
                <div className="mt-0.5 text-base font-semibold text-emerald-300 font-mono tabular-nums">
                  ₹{communityImpact.annualVillageValueCr} Cr
                </div>
              </div>
            </div>
          </div>

          {/* Local Verified Village Facilities & 1-Tap Helplines */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-white/85">
                Verified Local Facilities &amp; 24×7 Toll-Free Citizen Helplines
              </span>
              <span className="text-[11px] text-white/45">Tap any number to call</span>
            </div>

            {village && (
              <div className="grid sm:grid-cols-3 gap-2.5 text-xs">
                <div className="rounded-lg border border-white/10 bg-black/25 p-2.5">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
                    <HeartPulse className="w-3.5 h-3.5 shrink-0" />
                    Nearest Health Hub
                  </div>
                  <div className="mt-1 text-white font-medium truncate">
                    {village.health.nearestHealthName || "Mandal PHC"}
                  </div>
                  <div className="text-white/50 font-mono tabular-nums">
                    {village.health.nearestHealthKm.toFixed(1)} km away
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/25 p-2.5">
                  <div className="flex items-center gap-1.5 text-violet-300 font-medium">
                    <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                    Nearest School
                  </div>
                  <div className="mt-1 text-white font-medium truncate">
                    {village.education.nearestSchoolName || "ZP High School"}
                  </div>
                  <div className="text-white/50 font-mono tabular-nums">
                    {village.education.nearestSchoolKm.toFixed(1)} km away
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/25 p-2.5">
                  <div className="flex items-center gap-1.5 text-sky-300 font-medium">
                    <Droplets className="w-3.5 h-3.5 shrink-0" />
                    Water Supply Point
                  </div>
                  <div className="mt-1 text-white font-medium truncate">
                    {village.water.nearestWaterName || "Mission Bhagiratha"}
                  </div>
                  <div className="text-white/50 font-mono tabular-nums">
                    {village.water.nearestWaterKm.toFixed(1)} km away
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {HELPLINES.map((h) => (
                <a
                  key={h.code}
                  href={`tel:${h.code}`}
                  className="group flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/30 hover:border-emerald-400/45 hover:bg-emerald-500/10 px-3 py-2 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-white truncate">
                      {h.name}
                    </div>
                    <div className="text-[11px] text-white/50 truncate">{h.desc}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-emerald-300 shrink-0 tabular-nums">
                    <PhoneCall className="w-3 h-3" />
                    {h.code}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): 30-Second Personal Scheme & Subsidy Calculator */}
        <div className="lg:col-span-5 space-y-4">
          {/* Interactive Persona Selector */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-white/85">
                Who Is Checking Benefits?
              </span>
              {activeZone && (
                <span className="text-[11px] font-medium text-cyan-300">
                  Filtered by {ZONE_META[activeZone].title.split("&")[0].trim()}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {PERSONA_TABS.map((tab) => {
                const Icon = tab.icon;
                const isSelected = !activeZone && persona === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setActiveZone(null);
                      setPersona(tab.key);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap truncate ${
                      isSelected
                        ? "bg-emerald-500 text-slate-950 font-semibold"
                        : "bg-black/30 border border-white/10 text-white/75 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{tab.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Compact Household Inputs */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setHasRationCard((v) => !v)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${
                  hasRationCard
                    ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
                    : "border-white/10 bg-black/30 text-white/65"
                }`}
              >
                <span>White Ration Card</span>
                <span className="font-mono font-semibold">
                  {hasRationCard ? "YES" : "NO"}
                </span>
              </button>

              <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-white/10 bg-black/30">
                <span className="text-white/70">Land (Acres)</span>
                <div className="flex items-center gap-1.5 font-mono tabular-nums">
                  <button
                    type="button"
                    aria-label="Decrease acres"
                    onClick={() => setAcres((a) => Math.max(0, a - 1))}
                    className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-semibold text-white">{acres}</span>
                  <button
                    type="button"
                    aria-label="Increase acres"
                    onClick={() => setAcres((a) => Math.min(15, a + 1))}
                    className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-white/10 bg-black/30">
                <span className="text-white/70">Family Size</span>
                <div className="flex items-center gap-1.5 font-mono tabular-nums">
                  <button
                    type="button"
                    aria-label="Decrease family size"
                    onClick={() => setFamilySize((f) => Math.max(1, f - 1))}
                    className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-semibold text-white">{familySize}</span>
                  <button
                    type="button"
                    aria-label="Increase family size"
                    onClick={() => setFamilySize((f) => Math.min(10, f + 1))}
                    className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-white/10 bg-black/30">
                <span className="text-white/70">Students</span>
                <div className="flex items-center gap-1.5 font-mono tabular-nums">
                  <button
                    type="button"
                    aria-label="Decrease students"
                    onClick={() => setStudentsInFamily((s) => Math.max(0, s - 1))}
                    className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-semibold text-white">
                    {studentsInFamily}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase students"
                    onClick={() => setStudentsInFamily((s) => Math.min(5, s + 1))}
                    className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Calculated Annual Benefit & Cover Summary */}
          <div className="rounded-xl border border-emerald-400/25 bg-emerald-950/20 p-4 grid grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] text-emerald-200/75">
                Estimated Cash &amp; Subsidy
              </div>
              <div className="mt-1 text-2xl font-bold text-emerald-300 font-mono tabular-nums">
                {formatInr(totalAnnualBenefitInr)}
                <span className="text-xs font-normal text-emerald-200/70"> / yr</span>
              </div>
            </div>
            <div>
              <div className="text-[11px] text-cyan-200/75">
                Health, Life &amp; Asset Cover
              </div>
              <div className="mt-1 text-2xl font-bold text-cyan-300 font-mono tabular-nums">
                {formatInr(totalProtectionCoverInr)}
              </div>
            </div>
          </div>

          {/* Matched Schemes List with Document Checklists */}
          <div className="space-y-2.5 max-h-[470px] overflow-y-auto pr-1">
            {matchedSchemes.map((scheme) => (
              <article
                key={scheme.id}
                className="rounded-xl border border-white/10 bg-white/[0.025] p-3.5 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[11px] text-white/50">
                      {scheme.authority}
                    </div>
                    <h4 className="text-sm font-semibold text-white">
                      {scheme.name}
                    </h4>
                  </div>
                  <div className="text-right shrink-0 font-mono tabular-nums">
                    {scheme.annualInr > 0 && scheme.eligible && (
                      <div className="text-xs font-bold text-emerald-300">
                        +{formatInr(scheme.annualInr)}/yr
                      </div>
                    )}
                    {scheme.protectionCoverInr > 0 && scheme.eligible && (
                      <div className="text-[11px] font-medium text-cyan-300">
                        {formatInr(scheme.protectionCoverInr)} cover
                      </div>
                    )}
                    {!scheme.eligible && (
                      <div className="text-[11px] font-medium text-amber-300">
                        Needs Ration Card
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-white/75 leading-relaxed">
                  {scheme.benefitSummary}
                </p>

                <div className="pt-2 border-t border-white/10 text-[11px] text-white/60 space-y-1">
                  <div className="flex items-start gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
                    <span>
                      <span className="text-white/85 font-medium">Docs:</span>{" "}
                      {scheme.documents.join(" · ")}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <span className="text-white/85 font-medium">Apply:</span>{" "}
                      {scheme.whereToApply}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
