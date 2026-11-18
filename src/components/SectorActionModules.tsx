import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  Droplets,
  GraduationCap,
  HeartPulse,
  Leaf,
  MapPin,
  Search,
  ShieldCheck,
  Waves,
} from "lucide-react";
import type { LanguageCode } from "../lib/i18n";
import { UI_TRANSLATIONS } from "../lib/i18n";
import HyperlocalWeatherObservatory from "./HyperlocalWeatherObservatory";
import MandiMarketObservatory from "./MandiMarketObservatory";

type FacilityPoint = {
  id: string;
  name: string;
  category: string;
  lat: number;
  lon: number;
  operator?: string;
};

export type DistrictGroundwaterRow = {
  district_code: string;
  district_name: string;
  pre_monsoon_mbgl: number;
  post_monsoon_mbgl: number;
  fluctuation_m: number;
  stage_of_extraction_pct: number;
  status: string;
  net_availability_mcm: number;
  primary_aquifer: string;
  recharge_priority: string;
};

export type HealthcareTierInfo = {
  tier: string;
  facility_type: string;
  serves_what: string[];
  referral_trigger: string;
  scheme_link: string;
};

export type SectorInsightsVillage = {
  villageCode: string;
  villageName: string;
  mandalName: string;
  districtName: string;
  districtCode: string;
  lat?: number;
  lon?: number;
  population: number;
  households: number;
  areaSqKm: number;
  overallScore: number;
  vvi: number;
  vviLevel: string;
  geometry?: unknown;
  education: {
    score: number;
    literacyRate: number;
    femaleLiteracyRate: number;
    nearestSchoolKm: number;
    nearestSchoolName: string;
  };
  health: {
    score: number;
    latrineWithinPct: number;
    openDefecationPct: number;
    cleanCookingFuelPct: number;
    closedDrainagePct: number;
    nearestHealthKm: number;
    nearestHealthName: string;
  };
  water: {
    score: number;
    tapWaterTotalPct: number;
    treatedTapPct: number;
    waterWithinPremisesPct: number;
    tanksTotal: number;
    tanksGt40Ha: number;
    tankDensity: number;
    nearestWaterKm: number;
    nearestWaterName: string;
  };
  livelihood: {
    score: number;
    wpr: number;
    marginalWorkerPct: number;
    bankingAccessPct: number;
    nearestLivelihoodKm: number;
    nearestLivelihoodName: string;
  };
  environment: {
    score: number;
    solidBiomassPct: number;
    solarLightingPct: number;
    avgSolarMj: number;
    currentTempC: number;
    forecastRainMm: number;
    pm25: number;
    usAqi: number;
  };
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return Number((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
}

function getGeometryCenter(geometry: unknown): [number, number] {
  if (!geometry || typeof geometry !== "object") return [17.385, 78.4867];
  const g = geometry as { type?: string; coordinates?: unknown };
  let ring: number[][] = [];
  if (g.type === "Polygon" && Array.isArray(g.coordinates)) {
    ring = (g.coordinates as number[][][])[0] ?? [];
  } else if (g.type === "MultiPolygon" && Array.isArray(g.coordinates)) {
    ring = (g.coordinates as number[][][][])[0]?.[0] ?? [];
  }
  if (!ring || ring.length === 0) return [17.385, 78.4867];
  let sumLon = 0;
  let sumLat = 0;
  for (const pt of ring) {
    sumLon += pt[0];
    sumLat += pt[1];
  }
  return [sumLat / ring.length, sumLon / ring.length];
}

/* =========================================================
   1. EDUCATION: SCHOOLS, COLLEGES & UNIVERSITIES DIRECTORY
========================================================= */

export function EducationInstitutionsPanel({
  lang,
  village,
}: {
  lang: LanguageCode;
  village: SectorInsightsVillage | null;
}) {
  const t = UI_TRANSLATIONS[lang];
  const [facilities, setFacilities] = useState<FacilityPoint[]>([]);
  const [category, setCategory] = useState<string>("All");
  const [query, setQuery] = useState<string>("");

  useEffect(() => {
    fetch("/api/gis/sector/education")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.facilities)) {
          setFacilities(d.facilities);
        }
      })
      .catch(() => {});
  }, []);

  const [vLat, vLon] = useMemo(() => {
    if (village?.lat && village?.lon) return [village.lat, village.lon];
    return getGeometryCenter(village?.geometry);
  }, [village]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { All: facilities.length, University: 0, College: 0, School: 0, Library: 0 };
    for (const f of facilities) {
      map[f.category] = (map[f.category] ?? 0) + 1;
    }
    return map;
  }, [facilities]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return facilities
      .filter((f) => category === "All" || f.category === category)
      .filter((f) => !q || f.name.toLowerCase().includes(q) || (f.operator ?? "").toLowerCase().includes(q))
      .map((f) => ({
        ...f,
        distanceKm: haversineKm(vLat, vLon, f.lat, f.lon),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 36);
  }, [facilities, category, query, vLat, vLon]);

  return (
    <div className="border border-slate-200 dark:border-white/12 bg-white dark:bg-[#070b12] p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
        <div>
          <div className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
            <GraduationCap size={15} />
            <span>{t.educationInstitutionsTitle}</span>
          </div>
          <p className="mt-1 text-xs text-slate-600 dark:text-white/60">
            Browse all mapped Telangana schools, degree/junior colleges, public &amp; central universities, and libraries sorted by proximity to {village?.villageName ?? "Hyderabad Center"}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {["All", "University", "College", "School", "Library"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium border transition ${
                category === cat
                  ? "border-red-500 bg-red-600 text-white"
                  : "border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/[0.03] text-slate-700 dark:text-white/75"
              }`}
            >
              {cat} ({counts[cat] ?? 0})
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#04080e] px-3 py-2 max-w-md">
        <Search size={14} className="text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter institution by name (e.g. Osmania, IIT, ZPHS)..."
          className="w-full bg-transparent outline-none text-xs text-slate-900 dark:text-white"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-3.5 flex flex-col justify-between gap-2"
          >
            <div>
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="font-semibold text-red-600 dark:text-red-300">{item.category}</span>
                <span className="font-mono tabular-nums text-slate-500 dark:text-white/50">
                  {item.distanceKm} km
                </span>
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-900 dark:text-white">
                {item.name}
              </div>
              {item.operator && (
                <div className="mt-0.5 text-[11px] text-slate-500 dark:text-white/55">
                  {item.operator}
                </div>
              )}
            </div>
            <div className="text-[10px] font-mono text-slate-400 dark:text-white/40 flex items-center gap-1">
              <MapPin size={10} />
              <span>{item.lat.toFixed(4)}°N, {item.lon.toFixed(4)}°E</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   2. WATER: STATEWIDE GROUNDWATER + VISUAL RECHARGE PLAN
========================================================= */

export function WaterGroundwaterPanel({
  lang,
  village,
  groundwater,
}: {
  lang: LanguageCode;
  village: SectorInsightsVillage | null;
  groundwater: DistrictGroundwaterRow[];
}) {
  const t = UI_TRANSLATIONS[lang];
  const [activeStep, setActiveStep] = useState(0);

  const selectedDistrictRow = useMemo(() => {
    if (!village) return groundwater[5] ?? groundwater[0] ?? null;
    return (
      groundwater.find(
        (d) =>
          d.district_code === village.districtCode ||
          d.district_name.toLowerCase() === village.districtName.toLowerCase()
      ) ?? groundwater[0] ?? null
    );
  }, [groundwater, village]);

  const rechargePlan = [
    {
      title: "01. Chain-Tank (Golusu Kattu) Desiltation",
      target: `${village?.water.tanksTotal ?? "Minor"} Irrigation Tanks`,
      impact: "Restores monsoon surface storage & feeds shallow dug-wells",
      detail:
        "Clear silt & strengthen weir bunds across cascading village tanks under Mission Kakatiya + MGNREGA, returning nutrient-rich silt to farmland.",
    },
    {
      title: "02. Percolation Pits & Borewell Recharge Shafts",
      target: selectedDistrictRow ? `${selectedDistrictRow.pre_monsoon_mbgl}m → ${selectedDistrictRow.post_monsoon_mbgl}m table` : "Fractured Granite Aquifer",
      impact: "Reverses deep depletion in Critical & Semi-Critical Mandals",
      detail:
        "Install stone-filled recharge shafts beside community borewells and Gram Panchayat rooftops to channel stormwater into fractured granite aquifers.",
    },
    {
      title: "03. Solar Micro-Drip & Crop Water Budgeting",
      target: selectedDistrictRow ? `${selectedDistrictRow.stage_of_extraction_pct}% Extraction` : "Farm Demand Control",
      impact: "Cuts groundwater pumping 35–45% without losing yield",
      detail:
        "Pair PM-KUSUM solar pumps with micro-drip irrigation and millet/pulse diversification through Rythu Vedika seasonal water budgets.",
    },
    {
      title: "04. Mission Bhagiratha 55 LPCD Tail-End Audit",
      target: `${village?.water.tapWaterTotalPct ?? 56}% Tap Coverage`,
      impact: "Eliminates away-fetching drudgery & fluoride/untreated risk",
      detail:
        "Pressure-test functional household tap connections (FHTCs) and chlorination dosing in peripheral hamlets.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="border border-slate-200 dark:border-white/12 bg-white dark:bg-[#070b12] p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
          <div>
            <div className="text-xs font-semibold text-cyan-600 dark:text-cyan-300 flex items-center gap-2">
              <Droplets size={15} />
              <span>{t.groundwaterTitle}</span>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-white/60">
              District-wide Pre-Monsoon vs. Post-Monsoon groundwater depth (meters below ground level, mbgl), stage of extraction (%), and aquifer recharge plan across Telangana.
            </p>
          </div>
          {selectedDistrictRow && (
            <div className="border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-xs shrink-0">
              <span className="text-slate-600 dark:text-white/70">Active District ({selectedDistrictRow.district_name}): </span>
              <strong className="font-mono text-cyan-700 dark:text-cyan-300">
                {selectedDistrictRow.pre_monsoon_mbgl}m pre / {selectedDistrictRow.post_monsoon_mbgl}m post · {selectedDistrictRow.status}
              </strong>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Statewide District Groundwater Chart */}
          <div className="lg:col-span-7 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-4">
            <div className="text-xs font-semibold text-slate-900 dark:text-white mb-3">
              Telangana 10-District Water Table Depth (Pre-Monsoon vs Post-Monsoon mbgl)
            </div>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groundwater}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="district_name" tick={{ fill: "#94a3b8", fontSize: 10 }} angle={-18} textAnchor="end" height={48} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} unit="m" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#080d14",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="pre_monsoon_mbgl" name="Pre-Monsoon Depth (mbgl)" fill="#f59e0b" />
                  <Bar dataKey="post_monsoon_mbgl" name="Post-Monsoon Depth (mbgl)" fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Interactive Visual Aquifer & Tank-Chain Diagram */}
          <div className="lg:col-span-5 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-4 space-y-3">
            <div className="text-xs font-semibold text-cyan-700 dark:text-cyan-300">
              Visual Aquifer Recharge &amp; Supply Solution Plan
            </div>
            <svg viewBox="0 0 420 170" className="w-full h-auto border border-slate-200 dark:border-white/10 bg-[#050a14]">
              {/* Sky + Sun */}
              <circle cx="370" cy="30" r="14" fill="#f59e0b" opacity="0.85" />
              <text x="370" y="54" textAnchor="middle" fill="#fcd34d" fontSize="8">PM-KUSUM Solar</text>
              {/* Tank Reservoir */}
              <path d="M 20 85 L 125 85 L 110 112 L 35 112 Z" fill={activeStep === 0 ? "#06b6d4" : "#0e7490"} />
              <text x="72" y="76" textAnchor="middle" fill="#67e8f9" fontSize="9" fontWeight="600">01. Kakatiya Tank</text>
              {/* Percolation Shaft */}
              <rect x="165" y="72" width="16" height="65" fill={activeStep === 1 ? "#10b981" : "#334155"} stroke="#38bdf8" strokeWidth="1" />
              <text x="173" y="64" textAnchor="middle" fill="#6ee7b7" fontSize="9">02. Recharge Shaft</text>
              {/* Aquifer Water Table */}
              <path d="M 10 142 Q 210 130 410 142 L 410 170 L 10 170 Z" fill="rgba(6,182,212,0.28)" stroke="#06b6d4" strokeWidth="1.5" />
              <text x="210" y="158" textAnchor="middle" fill="#bae6fd" fontSize="9">
                Fractured Granite Aquifer ({selectedDistrictRow?.post_monsoon_mbgl ?? 7.2} mbgl recharge zone)
              </text>
              {/* Drip Crops + Bhagiratha Pipe */}
              <line x1="230" y1="95" x2="335" y2="95" stroke={activeStep === 2 ? "#84cc16" : "#475569"} strokeWidth="3" />
              <text x="282" y="86" textAnchor="middle" fill="#bef264" fontSize="9">03. Drip + Storage</text>
              <rect x="345" y="76" width="52" height="32" fill={activeStep === 3 ? "#06b6d4" : "#1e293b"} stroke="#38bdf8" />
              <text x="371" y="95" textAnchor="middle" fill="#ffffff" fontSize="8">04. 55 LPCD</text>
            </svg>

            <div className="space-y-1.5">
              {rechargePlan.map((step, idx) => (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  className={`w-full text-left p-2.5 border text-xs transition ${
                    activeStep === idx
                      ? "border-cyan-500/60 bg-cyan-500/10"
                      : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#070b12]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 font-semibold text-slate-900 dark:text-white">
                    <span>{step.title}</span>
                    <span className="font-mono text-[10px] text-cyan-600 dark:text-cyan-300">{step.target}</span>
                  </div>
                  {activeStep === idx && (
                    <p className="mt-1 text-[11px] leading-5 text-slate-600 dark:text-white/70">
                      {step.detail}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* All 10 Districts Reference Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-white/70">
              <tr>
                <th className="px-3 py-2.5">District</th>
                <th className="px-3 py-2.5 text-right">Pre-Monsoon</th>
                <th className="px-3 py-2.5 text-right">Post-Monsoon</th>
                <th className="px-3 py-2.5 text-right">Extraction %</th>
                <th className="px-3 py-2.5">Category</th>
                <th className="px-3 py-2.5">Priority Aquifer Solution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {groundwater.map((row) => {
                const isSelected = selectedDistrictRow?.district_code === row.district_code;
                return (
                  <tr
                    key={row.district_code}
                    className={isSelected ? "bg-cyan-500/10 font-medium" : "hover:bg-slate-50 dark:hover:bg-white/[0.02]"}
                  >
                    <td className="px-3 py-2 text-slate-900 dark:text-white">{row.district_name}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{row.pre_monsoon_mbgl} m</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{row.post_monsoon_mbgl} m</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{row.stage_of_extraction_pct}%</td>
                    <td className="px-3 py-2">
                      <span
                        className={`font-semibold ${
                          row.status === "Safe"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : row.status === "Semi-Critical"
                            ? "text-amber-600 dark:text-amber-300"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-white/65">{row.recharge_priority}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   3. HEALTHCARE: ALL HOSPITALS, SERVICES, ISSUES & RISK
========================================================= */

export function HealthcareServiceMatrixPanel({
  lang,
  village,
  healthcareTiers,
}: {
  lang: LanguageCode;
  village: SectorInsightsVillage | null;
  healthcareTiers: HealthcareTierInfo[];
}) {
  const t = UI_TRANSLATIONS[lang];
  const [facilities, setFacilities] = useState<FacilityPoint[]>([]);
  const [catFilter, setCatFilter] = useState<string>("All");
  const [query, setQuery] = useState<string>("");

  useEffect(() => {
    fetch("/api/gis/sector/health")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.facilities)) {
          setFacilities(d.facilities);
        }
      })
      .catch(() => {});
  }, []);

  const [vLat, vLon] = useMemo(() => {
    if (village?.lat && village?.lon) return [village.lat, village.lon];
    return getGeometryCenter(village?.geometry);
  }, [village]);

  const diseaseExposureRisks = useMemo(() => {
    if (!village) return [];
    const enteric = Math.min(
      95,
      Math.round(village.health.openDefecationPct * 0.45 + (100 - village.water.treatedTapPct) * 0.35 + (100 - village.health.closedDrainagePct) * 0.2)
    );
    const vector = Math.min(
      95,
      Math.round((100 - village.health.closedDrainagePct) * 0.45 + Math.min(25, village.water.tanksTotal * 4) + (village.environment.forecastRainMm > 5 ? 18 : 8))
    );
    const respiratory = Math.min(
      95,
      Math.round(village.environment.solidBiomassPct * 0.55 + Math.min(35, village.environment.pm25 * 0.7))
    );
    const heat = Math.min(
      95,
      Math.round(Math.max(15, (village.environment.currentTempC - 26) * 6.5) + Math.min(25, village.health.nearestHealthKm * 2.5))
    );

    return [
      {
        name: "Water-Borne & Enteric Risk",
        score: enteric,
        level: enteric >= 65 ? "High Priority" : enteric >= 45 ? "Moderate" : "Low",
        drivers: `Open defecation ${village.health.openDefecationPct}%, treated tap ${village.water.treatedTapPct}%, closed drains ${village.health.closedDrainagePct}%`,
        action: "Chlorination audit, ORS depots & household soak-pits",
      },
      {
        name: "Vector-Borne Risk (Dengue/Malaria)",
        score: vector,
        level: vector >= 65 ? "High Priority" : vector >= 45 ? "Moderate" : "Low",
        drivers: `${village.water.tanksTotal} nearby surface tanks, ${village.health.closedDrainagePct}% closed drainage`,
        action: "Pre-monsoon larvicide, stagnant greywater clearing & fever screening",
      },
      {
        name: "Respiratory & Indoor Smoke Risk",
        score: respiratory,
        level: respiratory >= 65 ? "High Priority" : respiratory >= 45 ? "Moderate" : "Low",
        drivers: `${village.environment.solidBiomassPct}% solid biomass fuel, PM2.5 ${village.environment.pm25} µg/m³`,
        action: "PM Ujjwala LPG refill saturation & pediatric/COPD screening",
      },
      {
        name: "Heat-Stress & Access Delay Risk",
        score: heat,
        level: heat >= 65 ? "High Priority" : heat >= 45 ? "Moderate" : "Low",
        drivers: `Temp ${village.environment.currentTempC}°C, nearest clinic ${village.health.nearestHealthKm} km away`,
        action: "Shaded outdoor work advisories & 108 ambulance staging",
      },
    ];
  }, [village]);

  function inferServiceProfile(name: string, cat: string): string {
    const n = name.toLowerCase();
    if (cat === "Clinic" || n.includes("clinic") || n.includes("dawakhana") || n.includes("phc")) {
      return "OPD Fever/WASH Screening · Antenatal Care · Essential Generics";
    }
    if (cat === "Doctors") {
      return "General Consultation · NCD Follow-up · Primary Referral";
    }
    if (n.includes("area") || n.includes("district") || n.includes("apollo") || n.includes("care") || n.includes("yashoda") || n.includes("kims") || n.includes("nims")) {
      return "24×7 Emergency/Trauma · ICU/MCH · Dialysis · Aarogyasri Tertiary";
    }
    return "General Medicine · Maternal Deliveries · Diagnostics & Emergency Stabilization";
  }

  const filteredHospitals = useMemo(() => {
    const q = query.trim().toLowerCase();
    return facilities
      .filter((f) => catFilter === "All" || f.category === catFilter)
      .filter((f) => !q || f.name.toLowerCase().includes(q))
      .map((f) => ({
        ...f,
        distanceKm: haversineKm(vLat, vLon, f.lat, f.lon),
        serves: inferServiceProfile(f.name, f.category),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 30);
  }, [facilities, catFilter, query, vLat, vLon]);

  return (
    <div className="border border-slate-200 dark:border-white/12 bg-white dark:bg-[#070b12] p-6 space-y-6">
      <div className="border-b border-slate-200 dark:border-white/10 pb-4">
        <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-300 flex items-center gap-2">
          <HeartPulse size={15} />
          <span>{t.hospitalMatrixTitle}</span>
        </div>
        <p className="mt-1 text-xs text-slate-600 dark:text-white/60">
          Complete breakdown of mapped hospitals/clinics, what clinical services each tier handles, observed village health issues, and preventive environmental disease-exposure screening.
        </p>
      </div>

      {/* 3-Tier Care Matrix ("Which Hospital Serves What") */}
      <div className="grid md:grid-cols-3 gap-4">
        {healthcareTiers.map((tier) => (
          <div
            key={tier.tier}
            className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-4 space-y-2.5"
          >
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-300">{tier.tier}</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">{tier.facility_type}</div>
            <ul className="space-y-1 text-xs text-slate-600 dark:text-white/70">
              {tier.serves_what.map((s) => (
                <li key={s}>• {s}</li>
              ))}
            </ul>
            <div className="pt-2 border-t border-slate-200 dark:border-white/10 text-[11px] text-slate-500 dark:text-white/55">
              <strong>Scheme:</strong> {tier.scheme_link}
            </div>
          </div>
        ))}
      </div>

      {/* Preventive Environmental Disease-Exposure Screening */}
      {village && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity size={14} className="text-amber-500" />
              <span>Preventive Disease-Exposure Screening for {village.villageName}</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-white/45 flex items-center gap-1">
              <ShieldCheck size={12} />
              <span>Environmental &amp; WASH susceptibility only — not clinical diagnosis</span>
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {diseaseExposureRisks.map((risk) => (
              <div
                key={risk.name}
                className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-3.5 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">{risk.name}</span>
                  <span className="font-mono text-xs font-bold tabular-nums text-amber-600 dark:text-amber-300">
                    {risk.score}/100
                  </span>
                </div>
                <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">{risk.level}</div>
                <p className="text-[11px] text-slate-600 dark:text-white/60">{risk.drivers}</p>
                <div className="text-[11px] text-slate-800 dark:text-white/85 pt-1 border-t border-slate-200 dark:border-white/10">
                  <strong>Action:</strong> {risk.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Searchable Mapped Hospitals List */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {["All", "Hospital", "Clinic", "Doctors"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCatFilter(c)}
                className={`px-3 py-1.5 text-xs font-medium border transition ${
                  catFilter === c
                    ? "border-emerald-500 bg-emerald-600 text-white"
                    : "border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/[0.03] text-slate-700 dark:text-white/75"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#04080e] px-3 py-1.5 w-full sm:w-72">
            <Search size={13} className="text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search mapped hospitals or clinics..."
              className="w-full bg-transparent outline-none text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
          {filteredHospitals.map((h) => (
            <div
              key={h.id}
              className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-3.5 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="font-semibold text-emerald-600 dark:text-emerald-300 flex items-center gap-1">
                  <Building2 size={11} />
                  {h.category}
                </span>
                <span className="font-mono tabular-nums text-slate-500 dark:text-white/50">{h.distanceKm} km</span>
              </div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white">{h.name}</div>
              <div className="text-[11px] leading-4 text-slate-600 dark:text-white/65">{h.serves}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   4. ENVIRONMENT: WATERBODIES CONDITION + VISUAL SOLUTIONS
========================================================= */

export function EnvironmentWaterbodiesPanel({
  lang,
  village,
}: {
  lang: LanguageCode;
  village: SectorInsightsVillage | null;
}) {
  const t = UI_TRANSLATIONS[lang];

  return (
    <div className="space-y-6">
      <div className="border border-slate-200 dark:border-white/12 bg-white dark:bg-[#070b12] p-6 space-y-5">
        <div className="border-b border-slate-200 dark:border-white/10 pb-4">
          <div className="text-xs font-semibold text-lime-600 dark:text-lime-300 flex items-center gap-2">
            <Waves size={15} />
            <span>{t.waterbodyConditionTitle}</span>
          </div>
          <p className="mt-1 text-xs text-slate-600 dark:text-white/60">
            TRACGIS surface waterbody health, wastewater pressure, air quality telemetry, and step-by-step ecological restoration visuals.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-4">
            <div className="text-[11px] text-slate-500 dark:text-white/50">Village Waterbodies (Tanks)</div>
            <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-cyan-600 dark:text-cyan-300">
              {village?.water.tanksTotal ?? "—"}
            </div>
            <div className="mt-1 text-[11px] text-slate-600 dark:text-white/60">
              {village ? `${village.water.tankDensity} per 10 km² · ${village.water.tanksGt40Ha} major (>40 ha)` : "Select village for tank count"}
            </div>
          </div>

          <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-4">
            <div className="text-[11px] text-slate-500 dark:text-white/50">Wastewater &amp; Runoff Risk</div>
            <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-amber-600 dark:text-amber-300">
              {village ? `${100 - village.health.closedDrainagePct}%` : "—"}
            </div>
            <div className="mt-1 text-[11px] text-slate-600 dark:text-white/60">
              Open/unlined drainage risking tank eutrophication
            </div>
          </div>

          <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-4">
            <div className="text-[11px] text-slate-500 dark:text-white/50">Biomass Smoke Pressure</div>
            <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-red-600 dark:text-red-400">
              {village ? `${village.environment.solidBiomassPct}%` : "—"}
            </div>
            <div className="mt-1 text-[11px] text-slate-600 dark:text-white/60">
              PM2.5 {village?.environment.pm25 ?? "—"} µg/m³ · US AQI {village?.environment.usAqi ?? "—"}
            </div>
          </div>

          <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-4">
            <div className="text-[11px] text-slate-500 dark:text-white/50">Clean Solar Potential</div>
            <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-lime-600 dark:text-lime-300">
              {village ? `${village.environment.avgSolarMj} MJ/m²` : "—"}
            </div>
            <div className="mt-1 text-[11px] text-slate-600 dark:text-white/60">
              Strong viability for PM-KUSUM &amp; GP solar grids
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 text-xs">
          <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-4">
            <div className="font-semibold text-lime-700 dark:text-lime-300 flex items-center gap-1.5">
              <Leaf size={13} />
              <span>Stage 1 · Tank Foreshore &amp; Desiltation</span>
            </div>
            <p className="mt-1.5 leading-5 text-slate-600 dark:text-white/70">
              Remove invasive weed mats, demarcate FTL tank buffer zones with native trees (Haritha Haram), and apply excavated tank silt as organic topsoil.
            </p>
          </div>
          <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-4">
            <div className="font-semibold text-cyan-700 dark:text-cyan-300 flex items-center gap-1.5">
              <AlertTriangle size={13} />
              <span>Stage 2 · Constructed Reed-Bed Filters</span>
            </div>
            <p className="mt-1.5 leading-5 text-slate-600 dark:text-white/70">
              Route village open-drain greywater through gravel-and-reed bio-filters before it reaches percolation tanks, cutting nitrate/pathogen loading.
            </p>
          </div>
          <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-4">
            <div className="font-semibold text-orange-600 dark:text-orange-300 flex items-center gap-1.5">
              <Leaf size={13} />
              <span>Stage 3 · Clean Cooking &amp; Solar Microgrid</span>
            </div>
            <p className="mt-1.5 leading-5 text-slate-600 dark:text-white/70">
              Combine PM Ujjwala clean-cooking adoption with solar agricultural feeders to cut tree-felling and PM2.5 household exposure.
            </p>
          </div>
        </div>
      </div>

      <HyperlocalWeatherObservatory village={village} />
    </div>
  );
}

/* =========================================================
   5. LIVELIHOOD: VISUAL VALUE-CHAIN & STORYBOARD PLAN
========================================================= */

export function LivelihoodVisualPlanPanel({
  lang,
  village,
}: {
  lang: LanguageCode;
  village: SectorInsightsVillage | null;
}) {
  const t = UI_TRANSLATIONS[lang];

  return (
    <div className="space-y-6">
      <div className="border border-slate-200 dark:border-white/12 bg-white dark:bg-[#070b12] p-6 space-y-5">
        <div className="border-b border-slate-200 dark:border-white/10 pb-4">
          <div className="text-xs font-semibold text-pink-600 dark:text-pink-300 flex items-center gap-2">
            <BriefcaseBusiness size={15} />
            <span>{t.livelihoodPlanTitle}</span>
          </div>
          <p className="mt-1 text-xs text-slate-600 dark:text-white/60">
            Transitioning rural households from seasonal marginal employment to year-round bank-linked FPOs, cold-chain value addition, and youth skilling.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 text-xs">
          <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-4">
            <div className="font-semibold text-pink-600 dark:text-pink-300">01. Off-Season Stability</div>
            <div className="mt-1 font-mono text-lg font-bold text-slate-900 dark:text-white">
              {village ? `${village.livelihood.marginalWorkerPct}% Marginal` : "MGNREGA Buffer"}
            </div>
            <p className="mt-1 leading-5 text-slate-600 dark:text-white/65">
              Align dry-season MGNREGA tank &amp; check-dam works to eliminate lean-month income drops.
            </p>
          </div>

          <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-4">
            <div className="font-semibold text-emerald-600 dark:text-emerald-300">02. Formal Credit Reach</div>
            <div className="mt-1 font-mono text-lg font-bold text-slate-900 dark:text-white">
              {village ? `${village.livelihood.bankingAccessPct}% Banked` : "SERP SHGs"}
            </div>
            <p className="mt-1 leading-5 text-slate-600 dark:text-white/65">
              Expand women SHG Stree Nidhi micro-loans &amp; UPI merchant rails to replace high-interest informal credit.
            </p>
          </div>

          <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-4">
            <div className="font-semibold text-amber-600 dark:text-amber-300">03. Solar Cold-Chain FPOs</div>
            <div className="mt-1 font-mono text-lg font-bold text-slate-900 dark:text-white">
              {village ? `${village.livelihood.nearestLivelihoodKm} km Hub` : "Agro Processing"}
            </div>
            <p className="mt-1 leading-5 text-slate-600 dark:text-white/65">
              Cluster-level cold storage &amp; millet/dal grading stop distress sales and dampen regional food inflation.
            </p>
          </div>

          <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-4">
            <div className="font-semibold text-cyan-600 dark:text-cyan-300">04. Rural Tech Skilling</div>
            <div className="mt-1 font-mono text-lg font-bold text-slate-900 dark:text-white">
              {village ? `${village.livelihood.wpr}% WPR` : "Youth Jobs"}
            </div>
            <p className="mt-1 leading-5 text-slate-600 dark:text-white/65">
              Train village youth in solar pump O&amp;M, drone agri-spraying &amp; digital CSC services linked to polytechnics.
            </p>
          </div>
        </div>
      </div>

      <MandiMarketObservatory village={village} />
    </div>
  );
}
