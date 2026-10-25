import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  CalendarRange,
  Database,
  Droplets,
  GraduationCap,
  HeartPulse,
  Leaf,
  Loader2,
  Network,
  TrendingUp,
} from "lucide-react";

const API_BASE = "/api";

type SectorKey =
  | "overview"
  | "education"
  | "health"
  | "water"
  | "livelihood"
  | "environment";

type DistrictRecord = {
  district_code: string;
  district_name: string;
  mandal_count: number;
  village_count: number;
  total_population: number;
  households: number;
  literacy_rate: number;
  female_literacy_rate: number;
  worker_participation_rate: number;
  marginal_worker_percent: number;
  tap_water_total_pct: number;
  treated_tap_pct: number;
  water_within_premises_pct: number;
  latrine_within_pct: number;
  clean_cooking_fuel_pct: number;
  solid_biomass_fuel_pct: number;
  banking_access_pct: number;
  solar_lighting_pct: number;
  tanks_total: number;
  avg_solar_radiation_mj_m2: number;
  pm2_5: number;
  education_score: number;
  health_score: number;
  water_score: number;
  livelihood_score: number;
  environment_score: number;
  overall_score: number;
};

type MandalScatterPoint = {
  mandal: string;
  district: string;
  code: string;
  edu: number;
  health: number;
  water: number;
  livelihood: number;
  environment: number;
  tap_water: number;
  sanitation: number;
  clean_fuel: number;
  banking: number;
  biomass: number;
  tanks: number;
};

type LongitudinalPoint = {
  year: string;
  milestone: string;
  education: number;
  health: number;
  water: number;
  livelihood: number;
  environment: number;
  overall: number;
  district_education?: number;
  district_health?: number;
  district_water?: number;
  district_livelihood?: number;
  district_environment?: number;
  district_overall?: number;
};

type SectorGainItem = {
  sector: string;
  key: string;
  baseline_2011: number;
  horizon_2026: number;
  delta: number;
  color: string;
};

type AnalyticsPayload = {
  state: string;
  total_districts: number;
  total_mandals: number;
  total_villages: number;
  total_population: number;
  total_households: number;
  total_irrigation_tanks: number;
  total_mapped_facilities: Record<string, number>;
  avg_literacy_rate: number;
  avg_female_literacy_rate: number;
  avg_worker_participation: number;
  avg_child_0_6_percent: number;
  avg_marginal_worker_percent: number;
  state_sector_averages: Record<string, number>;
  districts: DistrictRecord[];
  distributions: Record<string, { range: string; count: number }[]>;
  mandal_scatter: MandalScatterPoint[];
  data_sources: string[];
  village_comparison?: {
    village_code: string;
    village_name: string;
    mandal_name: string;
    district_name: string;
    percentiles: Record<string, number>;
    sectors: Record<string, Record<string, number | string>>;
    benchmarks: {
      mandal: Record<string, number | string>;
      district: Record<string, number | string>;
      telangana_state: Record<string, number | string>;
    };
  } | null;
  longitudinal_trends?: {
    scope: string;
    state_series: LongitudinalPoint[];
    village_series: LongitudinalPoint[] | null;
    sector_gains: SectorGainItem[];
    methodology_note: string;
  };
};

const MULTI_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#84cc16",
  "#14b8a6",
];

const SECTOR_META: Record<
  SectorKey,
  {
    label: string;
    color: string;
    secondaryColor: string;
    trendKey: keyof Pick<
      LongitudinalPoint,
      "overall" | "education" | "health" | "water" | "livelihood" | "environment"
    >;
    distScoreKey: keyof DistrictRecord;
    distSecondaryKey: keyof DistrictRecord;
    distScoreLabel: string;
    distSecondaryLabel: string;
    histogramKey: string;
    scatterX: keyof MandalScatterPoint;
    scatterY: keyof MandalScatterPoint;
    scatterXLabel: string;
    scatterYLabel: string;
    icon: typeof Network;
  }
> = {
  overview: {
    label: "All 5 Sectors",
    color: "#ff9933",
    secondaryColor: "#06b6d4",
    trendKey: "overall",
    distScoreKey: "overall_score",
    distSecondaryKey: "literacy_rate",
    distScoreLabel: "Composite Score",
    distSecondaryLabel: "Literacy %",
    histogramKey: "education",
    scatterX: "edu",
    scatterY: "livelihood",
    scatterXLabel: "Education Index",
    scatterYLabel: "Livelihood Index",
    icon: Network,
  },
  education: {
    label: "Education",
    color: "#ef4444",
    secondaryColor: "#f59e0b",
    trendKey: "education",
    distScoreKey: "literacy_rate",
    distSecondaryKey: "female_literacy_rate",
    distScoreLabel: "Total Literacy %",
    distSecondaryLabel: "Female Literacy %",
    histogramKey: "education",
    scatterX: "edu",
    scatterY: "banking",
    scatterXLabel: "Mandal Education Score",
    scatterYLabel: "Household Banking %",
    icon: GraduationCap,
  },
  health: {
    label: "Health",
    color: "#10b981",
    secondaryColor: "#34d399",
    trendKey: "health",
    distScoreKey: "latrine_within_pct",
    distSecondaryKey: "clean_cooking_fuel_pct",
    distScoreLabel: "Sanitation Within Premises %",
    distSecondaryLabel: "Clean Cooking Fuel %",
    histogramKey: "sanitation",
    scatterX: "clean_fuel",
    scatterY: "health",
    scatterXLabel: "Clean Cooking Fuel (LPG/Biogas %)",
    scatterYLabel: "Health Readiness Index",
    icon: HeartPulse,
  },
  water: {
    label: "Water",
    color: "#06b6d4",
    secondaryColor: "#38bdf8",
    trendKey: "water",
    distScoreKey: "tap_water_total_pct",
    distSecondaryKey: "water_within_premises_pct",
    distScoreLabel: "Tap Water Access %",
    distSecondaryLabel: "Water Within Premises %",
    histogramKey: "tap_water",
    scatterX: "tap_water",
    scatterY: "water",
    scatterXLabel: "Household Tap Water %",
    scatterYLabel: "Water Security Index",
    icon: Droplets,
  },
  livelihood: {
    label: "Livelihood",
    color: "#ec4899",
    secondaryColor: "#f97316",
    trendKey: "livelihood",
    distScoreKey: "banking_access_pct",
    distSecondaryKey: "worker_participation_rate",
    distScoreLabel: "Banking Inclusion %",
    distSecondaryLabel: "Worker Participation %",
    histogramKey: "banking",
    scatterX: "banking",
    scatterY: "livelihood",
    scatterXLabel: "Household Banking Access %",
    scatterYLabel: "Livelihood Opportunity Index",
    icon: BriefcaseBusiness,
  },
  environment: {
    label: "Environment",
    color: "#84cc16",
    secondaryColor: "#22c55e",
    trendKey: "environment",
    distScoreKey: "environment_score",
    distSecondaryKey: "solid_biomass_fuel_pct",
    distScoreLabel: "Environment Score",
    distSecondaryLabel: "Biomass Fuel Pressure %",
    histogramKey: "environment",
    scatterX: "biomass",
    scatterY: "environment",
    scatterXLabel: "Solid Biomass Cooking Fuel %",
    scatterYLabel: "Climate & Ecological Index",
    icon: Leaf,
  },
};

export default function AnalyticsPanel({
  sector: initialSector = "overview",
  selectedVillageCode = null,
}: {
  sector?: SectorKey;
  selectedVillageCode?: string | null;
}) {
  const [activeSector, setActiveSector] = useState<SectorKey>(initialSector);
  const [trendMode, setTrendMode] = useState<
    "all_sectors" | "benchmark_compare" | "cumulative_gain"
  >("all_sectors");
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [offline, setOffline] = useState<boolean>(false);

  useEffect(() => {
    setActiveSector(initialSector);
    if (initialSector !== "overview") {
      setTrendMode("benchmark_compare");
    } else {
      setTrendMode("all_sectors");
    }
  }, [initialSector]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const qs = selectedVillageCode
      ? `?village_code=${encodeURIComponent(selectedVillageCode)}`
      : "";
    fetch(`${API_BASE}/analytics/summary${qs}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Analytics endpoint unavailable");
        const payload = (await res.json()) as AnalyticsPayload;
        if (active) {
          setData(payload);
          setOffline(false);
        }
      })
      .catch(() => {
        if (active) setOffline(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedVillageCode]);

  const meta = SECTOR_META[activeSector];

  const villageRadarData = useMemo(() => {
    const vc = data?.village_comparison;
    if (!vc) return [];
    return [
      {
        sector: "Education",
        Village: Number(vc.sectors.education?.score ?? 0),
        Mandal: Number(vc.benchmarks.mandal.education_score ?? 0),
        District: Number(vc.benchmarks.district.education_score ?? 0),
        Telangana: Number(vc.benchmarks.telangana_state.education_score ?? 0),
      },
      {
        sector: "Health",
        Village: Number(vc.sectors.health?.score ?? 0),
        Mandal: Number(vc.benchmarks.mandal.health_score ?? 0),
        District: Number(vc.benchmarks.district.health_score ?? 0),
        Telangana: Number(vc.benchmarks.telangana_state.health_score ?? 0),
      },
      {
        sector: "Water",
        Village: Number(vc.sectors.water?.score ?? 0),
        Mandal: Number(vc.benchmarks.mandal.water_score ?? 0),
        District: Number(vc.benchmarks.district.water_score ?? 0),
        Telangana: Number(vc.benchmarks.telangana_state.water_score ?? 0),
      },
      {
        sector: "Livelihood",
        Village: Number(vc.sectors.livelihood?.score ?? 0),
        Mandal: Number(vc.benchmarks.mandal.livelihood_score ?? 0),
        District: Number(vc.benchmarks.district.livelihood_score ?? 0),
        Telangana: Number(vc.benchmarks.telangana_state.livelihood_score ?? 0),
      },
      {
        sector: "Environment",
        Village: Number(vc.sectors.environment?.score ?? 0),
        Mandal: Number(vc.benchmarks.mandal.environment_score ?? 0),
        District: Number(vc.benchmarks.district.environment_score ?? 0),
        Telangana: Number(vc.benchmarks.telangana_state.environment_score ?? 0),
      },
    ];
  }, [data]);

  // Build merged longitudinal benchmark comparison series for the active sector
  const longitudinalComparisonSeries = useMemo(() => {
    const lt = data?.longitudinal_trends;
    if (!lt) return [];
    const stateList = lt.state_series ?? [];
    const vilList = lt.village_series;
    const key = meta.trendKey;
    const distKey = `district_${key}` as keyof LongitudinalPoint;

    return stateList.map((sp, i) => {
      const vp = vilList?.[i];
      return {
        year: sp.year,
        milestone: sp.milestone,
        Telangana: sp[key],
        Village: vp ? Number(vp[key]) : undefined,
        District: vp && vp[distKey] !== undefined ? Number(vp[distKey]) : undefined,
      };
    });
  }, [data, meta.trendKey]);

  const activeFiveSectorSeries = useMemo(() => {
    const lt = data?.longitudinal_trends;
    if (!lt) return [];
    return lt.village_series ?? lt.state_series ?? [];
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center border border-white/10 bg-[#070b11] p-8">
        <div className="flex items-center gap-3 text-xs text-white/60">
          <Loader2 size={16} className="animate-spin text-orange-300" />
          <span>Loading Telangana 5-sector statistical &amp; longitudinal distributions…</span>
        </div>
      </div>
    );
  }

  if (offline || !data) {
    return (
      <div className="border border-white/10 bg-[#070b11] p-7">
        <div className="flex items-start gap-3">
          <Database size={18} className="mt-0.5 shrink-0 text-orange-300/70" />
          <div>
            <h3 className="text-base font-medium text-white/90">
              Statistical Analytics Service Unavailable
            </h3>
            <p className="mt-2 max-w-2xl text-xs leading-6 text-white/45">
              Unable to reach the Telangana multi-sector analytics engine.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const sAvg = data.state_sector_averages;
  const histogramSeries = data.distributions[meta.histogramKey] ?? [];
  const totalFacilitiesCount = Object.values(
    data.total_mapped_facilities ?? {}
  ).reduce((a, b) => a + b, 0);

  const kpiCards =
    activeSector === "education"
      ? [
          { label: "Telangana Literacy Rate", value: `${data.avg_literacy_rate}%`, sub: `Female: ${data.avg_female_literacy_rate}%`, accent: "#ef4444" },
          { label: "State Education Index", value: `${sAvg.education_score} / 100`, sub: "444 Mandals analysed", accent: "#f97316" },
          { label: "Telecom Household Reach", value: `${sAvg.mobile_coverage_pct}%`, sub: "Census HLPCA baseline", accent: "#f59e0b" },
          { label: "Mapped Schools & Colleges", value: (data.total_mapped_facilities?.education ?? 0).toLocaleString(), sub: "Geolocated OSM facilities", accent: "#06b6d4" },
        ]
      : activeSector === "health"
      ? [
          { label: "State Health Readiness", value: `${sAvg.health_score} / 100`, sub: "Sanitation + Clean Air + Reach", accent: "#10b981" },
          { label: "Sanitation In-Premises", value: `${sAvg.latrine_within_pct}%`, sub: "Mandal household mean", accent: "#34d399" },
          { label: "Clean Cooking Fuel", value: `${sAvg.clean_cooking_fuel_pct}%`, sub: "LPG / PNG / Biogas adoption", accent: "#06b6d4" },
          { label: "Mapped Hospitals & Clinics", value: (data.total_mapped_facilities?.health ?? 0).toLocaleString(), sub: "Geolocated OSM facilities", accent: "#8b5cf6" },
        ]
      : activeSector === "water"
      ? [
          { label: "State Water Security", value: `${sAvg.water_score} / 100`, sub: "Tap + Proximity + Tank buffer", accent: "#06b6d4" },
          { label: "Household Tap Water", value: `${sAvg.tap_water_total_pct}%`, sub: `Treated: ${sAvg.treated_tap_pct}%`, accent: "#38bdf8" },
          { label: "Water Within Premises", value: `${sAvg.water_within_premises_pct}%`, sub: "Zero fetch-travel households", accent: "#10b981" },
          { label: "TRACGIS Irrigation Tanks", value: data.total_irrigation_tanks.toLocaleString(), sub: "Mapped minor irrigation tanks", accent: "#f59e0b" },
        ]
      : activeSector === "livelihood"
      ? [
          { label: "State Livelihood Index", value: `${sAvg.livelihood_score} / 100`, sub: "Work + Stability + Banking", accent: "#ec4899" },
          { label: "Worker Participation", value: `${data.avg_worker_participation}%`, sub: `Marginal share: ${data.avg_marginal_worker_percent}%`, accent: "#f97316" },
          { label: "Household Banking Access", value: `${sAvg.banking_access_pct}%`, sub: "Formal financial inclusion", accent: "#8b5cf6" },
          { label: "Two-Wheeler Mobility", value: `${sAvg.two_wheeler_pct}%`, sub: `${(data.total_mapped_facilities?.livelihood ?? 0).toLocaleString()} markets/banks`, accent: "#06b6d4" },
        ]
      : activeSector === "environment"
      ? [
          { label: "Climate & Eco Index", value: `${sAvg.environment_score} / 100`, sub: "Clean energy + AQI + Tanks", accent: "#84cc16" },
          { label: "Biomass Fuel Pressure", value: `${sAvg.solid_biomass_fuel_pct}%`, sub: "Firewood / crop residue share", accent: "#f97316" },
          { label: "Surface Water Buffers", value: data.total_irrigation_tanks.toLocaleString(), sub: "TRACGIS percolation & tanks", accent: "#06b6d4" },
          { label: "Mapped Eco & Solar Assets", value: (data.total_mapped_facilities?.environment ?? 0).toLocaleString(), sub: "Reserves, forests & solar plants", accent: "#10b981" },
        ]
      : [
          { label: "Telangana Villages Indexed", value: data.total_villages.toLocaleString(), sub: `${data.total_mandals} Mandals · ${data.total_districts} Districts`, accent: "#ff9933" },
          { label: "State Population Baseline", value: `${(data.total_population / 1_000_000).toFixed(2)}M`, sub: `${data.total_households.toLocaleString()} households`, accent: "#06b6d4" },
          { label: "Composite Sector Mean", value: `${sAvg.overall_score} / 100`, sub: `Lit ${data.avg_literacy_rate}% · WPR ${data.avg_worker_participation}%`, accent: "#10b981" },
          { label: "Spatial Assets & Tanks", value: `${(totalFacilitiesCount + data.total_irrigation_tanks).toLocaleString()}`, sub: `${data.total_irrigation_tanks.toLocaleString()} tanks · ${totalFacilitiesCount.toLocaleString()} POIs`, accent: "#ec4899" },
        ];

  const longitudinal = data.longitudinal_trends;
  const activeVillageName = data.village_comparison?.village_name ?? null;

  return (
    <div className="space-y-6">
      {/* Interactive Sector Analytics Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border border-white/10 bg-[#070b11] p-5">
        <div className="flex items-center gap-2.5">
          <BarChart3 size={17} className="text-orange-300" />
          <div>
            <div className="text-xs font-semibold text-white">
              Telangana Multi-Sector Statistical &amp; Longitudinal Engine
            </div>
            <div className="text-[11px] text-white/45">
              Switch sectors to inspect 2011–2026 longitudinal trajectories, District benchmarks, and 444-Mandal distributions
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1 border border-white/10 bg-[#05080d] p-1">
          {(Object.keys(SECTOR_META) as SectorKey[]).map((key) => {
            const item = SECTOR_META[key];
            const Icon = item.icon;
            const selected = activeSector === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveSector(key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition whitespace-nowrap ${
                  selected
                    ? "bg-white/12 text-white"
                    : "text-white/50 hover:text-white/85"
                }`}
              >
                <Icon size={13} style={{ color: item.color }} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Multi-Coloured KPI Scorecards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="relative overflow-hidden border border-white/10 bg-[#070b11] p-5"
          >
            <div
              className="absolute inset-x-0 top-0 h-[3px]"
              style={{ backgroundColor: card.accent }}
            />
            <div className="text-xs text-white/50">{card.label}</div>
            <div className="mt-2 font-mono text-2xl font-semibold tabular-nums text-white">
              {card.value}
            </div>
            <div className="mt-1.5 text-[11px] text-white/40">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* =======================================================
          NEW: 5-SECTOR LONGITUDINAL TRENDS STUDIO (2011 – 2026)
      ======================================================= */}
      {longitudinal && activeFiveSectorSeries.length > 0 && (
        <div className="relative overflow-hidden border border-white/12 bg-[#070b12] p-6 space-y-6">
          <div
            className="absolute inset-x-0 top-0 h-[2px]"
            style={{
              background:
                "linear-gradient(90deg, #ef4444, #10b981, #06b6d4, #ec4899, #84cc16)",
            }}
          />

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-cyan-300">
                <CalendarRange size={15} />
                <span>
                  Longitudinal Development Trajectory (2011 – 2026) · {longitudinal.scope}
                </span>
              </div>
              <h4 className="mt-1.5 text-xl font-semibold text-white">
                15-Year Multi-Sector Progress &amp; Readiness Horizon
              </h4>
              <p className="mt-1 text-xs text-white/50 max-w-3xl">
                {longitudinal.methodology_note}
              </p>
            </div>

            {/* Interactive Longitudinal Mode Switcher */}
            <div className="flex flex-wrap items-center gap-1 border border-white/10 bg-[#05080d] p-1 self-start lg:self-auto">
              {[
                { id: "all_sectors", label: "All 5 Sectors (2011–2026)" },
                { id: "benchmark_compare", label: `${meta.label} vs Benchmarks` },
                { id: "cumulative_gain", label: "15-Year Gain (Δ)" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setTrendMode(
                      tab.id as
                        | "all_sectors"
                        | "benchmark_compare"
                        | "cumulative_gain"
                    )
                  }
                  className={`px-3 py-1.5 text-xs font-medium transition whitespace-nowrap ${
                    trendMode === tab.id
                      ? "bg-white/12 text-white"
                      : "text-white/50 hover:text-white/85"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Longitudinal Chart Area + 15-Year Delta Summary */}
          <div className="grid gap-6 xl:grid-cols-[1.45fr_.55fr]">
            <div className="h-[340px] border border-white/10 bg-[#05080d] p-4">
              {trendMode === "all_sectors" && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={activeFiveSectorSeries}
                    margin={{ top: 10, right: 18, left: -10, bottom: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.07)"
                    />
                    <XAxis
                      dataKey="year"
                      tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 12 }}
                    />
                    <YAxis
                      domain={[20, 100]}
                      tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || payload.length === 0) {
                          return null;
                        }
                        const row = payload[0].payload as LongitudinalPoint;
                        return (
                          <div className="border border-white/20 bg-[#070b12] p-3.5 text-xs text-white shadow-2xl">
                            <div className="font-mono font-semibold text-orange-300">
                              {label} · {row.milestone}
                            </div>
                            <div className="mt-2 space-y-1 font-mono tabular-nums">
                              {payload.map((entry) => (
                                <div
                                  key={String(entry.dataKey)}
                                  className="flex items-center justify-between gap-5"
                                >
                                  <span style={{ color: entry.color }}>
                                    {entry.name}
                                  </span>
                                  <span>{entry.value} pts</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Line
                      type="monotone"
                      dataKey="education"
                      name="Education"
                      stroke="#ef4444"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#ef4444" }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="health"
                      name="Health"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#10b981" }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="water"
                      name="Water"
                      stroke="#06b6d4"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#06b6d4" }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="livelihood"
                      name="Livelihood"
                      stroke="#ec4899"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#ec4899" }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="environment"
                      name="Environment"
                      stroke="#84cc16"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#84cc16" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {trendMode === "benchmark_compare" && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={longitudinalComparisonSeries}
                    margin={{ top: 10, right: 18, left: -10, bottom: 8 }}
                  >
                    <defs>
                      <linearGradient id="sectorGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={meta.color} stopOpacity={0.42} />
                        <stop offset="95%" stopColor={meta.color} stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="stateGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.22} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.07)"
                    />
                    <XAxis
                      dataKey="year"
                      tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 12 }}
                    />
                    <YAxis
                      domain={[20, 100]}
                      tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#070b12",
                        borderColor: "rgba(255,255,255,0.2)",
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    {activeVillageName && (
                      <Area
                        type="monotone"
                        dataKey="Village"
                        name={`${activeVillageName} (${meta.label})`}
                        stroke={meta.color}
                        strokeWidth={2.6}
                        fill="url(#sectorGrad)"
                      />
                    )}
                    {activeVillageName && (
                      <Area
                        type="monotone"
                        dataKey="District"
                        name={`${data.village_comparison?.district_name ?? "District"} Avg`}
                        stroke="#f59e0b"
                        strokeWidth={2}
                        strokeDasharray="5 4"
                        fillOpacity={0}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="Telangana"
                      name={`Telangana State (${meta.label})`}
                      stroke={activeVillageName ? "#38bdf8" : meta.color}
                      strokeWidth={2.4}
                      fill={activeVillageName ? "url(#stateGrad)" : "url(#sectorGrad)"}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {trendMode === "cumulative_gain" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={longitudinal.sector_gains}
                    margin={{ top: 12, right: 18, left: -10, bottom: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.07)"
                    />
                    <XAxis
                      dataKey="sector"
                      tick={{ fill: "rgba(255,255,255,0.78)", fontSize: 12 }}
                    />
                    <YAxis
                      tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#070b12",
                        borderColor: "rgba(255,255,255,0.2)",
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Bar
                      dataKey="baseline_2011"
                      name="2011 Baseline"
                      fill="rgba(255,255,255,0.22)"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="horizon_2026"
                      name="2026 Horizon"
                      radius={[3, 3, 0, 0]}
                    >
                      {longitudinal.sector_gains.map((g) => (
                        <Cell key={g.sector} fill={g.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Right Column: 5-Sector 2011 -> 2026 Velocity Ledger */}
            <div className="border border-white/10 bg-[#05080d] p-4 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-white">
                  Sector Velocity (2011 → 2026)
                </div>
                <div className="mt-0.5 text-[11px] text-white/45">
                  Index point expansion across the 5 pillars
                </div>

                <div className="mt-4 space-y-3">
                  {longitudinal.sector_gains.map((item) => (
                    <div key={item.sector} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-white/85">
                          {item.sector}
                        </span>
                        <span className="font-mono tabular-nums text-[11px]">
                          <span className="text-white/45">
                            {item.baseline_2011} → {item.horizon_2026}
                          </span>{" "}
                          <span
                            className="font-semibold"
                            style={{ color: item.color }}
                          >
                            (+{item.delta})
                          </span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, item.horizon_2026)}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 border-t border-white/10 pt-3 text-[11px] leading-5 text-white/45">
                Key Epochs: <span className="text-white/70">2011</span> Census ·{" "}
                <span className="text-white/70">2014</span> Statehood ·{" "}
                <span className="text-white/70">2017</span> Water &amp; Tank Missions ·{" "}
                <span className="text-white/70">2023</span> Rural Health &amp; Schools ·{" "}
                <span className="text-white/70">2026</span> Horizon
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Village Percentile & Multi-Tier Radar Benchmark (when a village is selected) */}
      {data.village_comparison && (
        <div className="grid gap-5 border border-orange-300/25 bg-[#070b11] p-6 xl:grid-cols-[1.15fr_.85fr]">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-orange-300">
              <TrendingUp size={15} />
              <span>
                Selected Village Statewide Standing —{" "}
                {data.village_comparison.village_name} (
                {data.village_comparison.mandal_name} Mandal,{" "}
                {data.village_comparison.district_name})
              </span>
            </div>
            <h4 className="mt-2 text-lg font-semibold text-white">
              Percentile Rank Across 11,154 Telangana Villages
            </h4>
            <p className="mt-1 text-xs text-white/45">
              Compares observed village &amp; mandal indicators directly against
              all settlements in Telangana.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { key: "education", label: "Education", color: "#ef4444" },
                { key: "health", label: "Health", color: "#10b981" },
                { key: "water", label: "Water", color: "#06b6d4" },
                { key: "livelihood", label: "Livelihood", color: "#ec4899" },
                { key: "environment", label: "Environment", color: "#84cc16" },
                { key: "overall", label: "Overall Composite", color: "#ff9933" },
              ].map((s) => {
                const pct = data.village_comparison?.percentiles[s.key] ?? 50;
                return (
                  <div
                    key={s.key}
                    className="border border-white/10 bg-white/[0.02] p-3.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/65">{s.label}</span>
                      <span
                        className="font-mono font-semibold tabular-nums"
                        style={{ color: s.color }}
                      >
                        P{pct}
                      </span>
                    </div>
                    <div className="mt-2.5 h-1.5 w-full bg-white/10">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${Math.max(4, pct)}%`,
                          backgroundColor: s.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="h-[290px] border border-white/10 bg-[#05080d] p-3">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={villageRadarData} outerRadius="72%">
                <PolarGrid stroke="rgba(255,255,255,0.12)" />
                <PolarAngleAxis
                  dataKey="sector"
                  tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 9 }}
                />
                <Radar
                  name={data.village_comparison.village_name}
                  dataKey="Village"
                  stroke="#ff9933"
                  fill="#ff9933"
                  fillOpacity={0.35}
                />
                <Radar
                  name="District"
                  dataKey="District"
                  stroke="#06b6d4"
                  fill="#06b6d4"
                  fillOpacity={0.14}
                />
                <Radar
                  name="Telangana"
                  dataKey="Telangana"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.08}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#070b12",
                    borderColor: "rgba(255,255,255,0.15)",
                    fontSize: 12,
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Primary Multi-Coloured Charts Grid */}
      <div className="grid gap-5 xl:grid-cols-2">
        {/* Chart 1: All 10 Telangana Districts Multi-Indicator Comparison */}
        <div className="border border-white/10 bg-[#070b11] p-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-medium text-orange-300/85">
                District Comparative Analytics · Telangana (10 Districts)
              </div>
              <h4 className="mt-1 text-base font-semibold text-white">
                {meta.distScoreLabel} vs {meta.distSecondaryLabel}
              </h4>
            </div>
          </div>

          <div className="mt-5 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.districts}
                margin={{ top: 8, right: 12, left: -12, bottom: 42 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.07)"
                />
                <XAxis
                  dataKey="district_name"
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 11 }}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#070b12",
                    borderColor: "rgba(255,255,255,0.18)",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                <Bar
                  dataKey={meta.distScoreKey as string}
                  name={meta.distScoreLabel}
                  fill={meta.color}
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  dataKey={meta.distSecondaryKey as string}
                  name={meta.distSecondaryLabel}
                  fill={meta.secondaryColor}
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: 444-Mandal Distribution Histogram */}
        <div className="border border-white/10 bg-[#070b11] p-6">
          <div>
            <div className="text-xs font-medium text-cyan-300/85">
              444-Mandal Frequency Distribution
            </div>
            <h4 className="mt-1 text-base font-semibold text-white">
              Telangana Mandal Spread ({meta.label})
            </h4>
          </div>

          <div className="mt-5 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={histogramSeries}
                margin={{ top: 8, right: 16, left: -10, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.07)"
                />
                <XAxis
                  dataKey="range"
                  tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#070b12",
                    borderColor: "rgba(255,255,255,0.18)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" name="Number of Mandals" radius={[3, 3, 0, 0]}>
                  {histogramSeries.map((entry, idx) => (
                    <Cell
                      key={entry.range}
                      fill={MULTI_COLORS[idx % MULTI_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cross-Sector 444-Mandal Scatter Plot + All-District 5-Sector Heatmap Table */}
      <div className="grid gap-5 xl:grid-cols-[1fr_1.15fr]">
        {/* Scatter Plot */}
        <div className="border border-white/10 bg-[#070b11] p-6">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-300/85">
            <Activity size={14} />
            <span>444-Mandal Cross-Indicator Relationship</span>
          </div>
          <h4 className="mt-1 text-base font-semibold text-white">
            {meta.scatterXLabel} vs {meta.scatterYLabel}
          </h4>

          <div className="mt-5 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 10, right: 16, bottom: 20, left: -10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.07)"
                />
                <XAxis
                  type="number"
                  dataKey={meta.scatterX as string}
                  name={meta.scatterXLabel}
                  tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey={meta.scatterY as string}
                  name={meta.scatterYLabel}
                  tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                />
                <ZAxis type="number" dataKey="tanks" range={[24, 120]} name="Tanks" />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const pt = payload[0].payload as MandalScatterPoint;
                    return (
                      <div className="border border-white/20 bg-[#070b12] p-3 text-xs text-white shadow-xl">
                        <div className="font-semibold">{pt.mandal} Mandal</div>
                        <div className="text-[11px] text-white/50">
                          {pt.district} District · {pt.tanks} Tanks
                        </div>
                        <div className="mt-1.5 font-mono text-[11px] text-orange-300">
                          {meta.scatterXLabel}: {pt[meta.scatterX]} ·{" "}
                          {meta.scatterYLabel}: {pt[meta.scatterY]}
                        </div>
                      </div>
                    );
                  }}
                />
                <Scatter
                  name="Telangana Mandals"
                  data={data.mandal_scatter}
                  fill={meta.color}
                  fillOpacity={0.68}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 10-District 5-Sector Matrix */}
        <div className="border border-white/10 bg-[#070b11] p-6 overflow-x-auto">
          <div className="text-xs font-semibold text-white/75">
            Telangana 10-District 5-Sector Benchmark Matrix
          </div>
          <h4 className="mt-1 text-base font-semibold text-white">
            Sector Indices &amp; Physical Infrastructure Summary
          </h4>

          <table className="mt-4 w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/15 text-[11px] text-white/45">
                <th className="py-2 pr-3 font-medium">District</th>
                <th className="py-2 px-2 font-medium text-right">Edu</th>
                <th className="py-2 px-2 font-medium text-right">Health</th>
                <th className="py-2 px-2 font-medium text-right">Water</th>
                <th className="py-2 px-2 font-medium text-right">Livelihood</th>
                <th className="py-2 px-2 font-medium text-right">Env</th>
                <th className="py-2 pl-2 font-medium text-right">Tanks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono tabular-nums">
              {data.districts.map((d) => (
                <tr
                  key={d.district_code}
                  className="hover:bg-white/[0.03] transition"
                >
                  <td className="py-2.5 pr-3 font-sans font-medium text-white/85">
                    {d.district_name}
                  </td>
                  <td className="py-2.5 px-2 text-right text-rose-300">
                    {d.education_score}
                  </td>
                  <td className="py-2.5 px-2 text-right text-emerald-300">
                    {d.health_score}
                  </td>
                  <td className="py-2.5 px-2 text-right text-cyan-300">
                    {d.water_score}
                  </td>
                  <td className="py-2.5 px-2 text-right text-pink-300">
                    {d.livelihood_score}
                  </td>
                  <td className="py-2.5 px-2 text-right text-lime-300">
                    {d.environment_score}
                  </td>
                  <td className="py-2.5 pl-2 text-right text-white/65">
                    {d.tanks_total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Authoritative Data Provenance Footer */}
      <div className="border border-white/10 bg-[#06090f] p-4 text-[11px] text-white/45">
        <span className="font-medium text-white/70">Connected Telangana Sources: </span>
        {data.data_sources.join(" · ")}
      </div>
    </div>
  );
}
