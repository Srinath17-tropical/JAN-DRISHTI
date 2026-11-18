import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  Bookmark,
  CheckCircle2,
  CloudRain,
  Download,
  HelpCircle,
  Layers,
  Maximize2,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import type {
  DistrictGroundwaterRow,
  SectorInsightsVillage,
} from "./SectorActionModules";

type PresetId =
  | "balanced"
  | "water_shield"
  | "human_capital"
  | "livelihood_clean"
  | "bau_zero"
  | "custom";

type ClimateScenarioId = "normal" | "dry_15" | "drought_30";
type ChartMetricKey =
  | "score"
  | "diseaseRisk"
  | "groundwaterMbgl"
  | "incomeIndex"
  | "femaleLiteracy";

type PolicyLevers = {
  waterEffort: number; // 0..100
  sanitationEffort: number; // 0..100
  educationEffort: number; // 0..100
  cleanEnergyEffort: number; // 0..100
  livelihoodEffort: number; // 0..100
};

type AnnualForecastRow = {
  year: number;
  yearLabel: string;
  bauScore: number;
  p50Score: number;
  p15Score: number;
  p85Score: number;
  scoreBand: [number, number];
  bauVvi: number;
  p50Vvi: number;
  bauDisease: number;
  p50Disease: number;
  p15Disease: number;
  p85Disease: number;
  diseaseBand: [number, number];
  bauMbgl: number;
  p50Mbgl: number;
  p15Mbgl: number;
  p85Mbgl: number;
  mbglBand: [number, number];
  bauIncome: number;
  p50Income: number;
  p15Income: number;
  p85Income: number;
  incomeBand: [number, number];
  bauFemaleLit: number;
  p50FemaleLit: number;
  p15FemaleLit: number;
  p85FemaleLit: number;
  femaleLitBand: [number, number];
  cumCapexLakhs: number;
};

type PinnedScenario = {
  name: string;
  levers: PolicyLevers;
  climate: ClimateScenarioId;
  rows: AnnualForecastRow[];
};

type SensitivityDriver = {
  key: keyof PolicyLevers;
  label: string;
  gainPer10PctPts: number;
  riskReductionPct: number;
  roiPer10Lakhs: number;
};

const PRESET_PROFILES: Record<
  Exclude<PresetId, "custom">,
  { label: string; description: string; levers: PolicyLevers }
> = {
  balanced: {
    label: "Balanced Viksit Convergence",
    description: "85% saturation across water recharge, WASH, schools, clean energy & FPOs",
    levers: {
      waterEffort: 85,
      sanitationEffort: 85,
      educationEffort: 85,
      cleanEnergyEffort: 80,
      livelihoodEffort: 85,
    },
  },
  water_shield: {
    label: "Water & Drought Shield",
    description: "Maxes out Kakatiya tank desiltation, tap supply & groundwater recharge",
    levers: {
      waterEffort: 100,
      sanitationEffort: 80,
      educationEffort: 60,
      cleanEnergyEffort: 75,
      livelihoodEffort: 65,
    },
  },
  human_capital: {
    label: "Health & Schools Fast-Track",
    description: "Prioritizes closed drainage, sanitation, disease control & female literacy",
    levers: {
      waterEffort: 75,
      sanitationEffort: 100,
      educationEffort: 100,
      cleanEnergyEffort: 70,
      livelihoodEffort: 65,
    },
  },
  livelihood_clean: {
    label: "FPO Cold-Chain & Clean Energy",
    description: "Drives household income via SHG credit, agro-processing & PM-KUSUM solar",
    levers: {
      waterEffort: 70,
      sanitationEffort: 65,
      educationEffort: 70,
      cleanEnergyEffort: 95,
      livelihoodEffort: 100,
    },
  },
  bau_zero: {
    label: "No Additional Capex (BAU)",
    description: "Zero incremental convergence effort; isolates structural climate/extraction drift",
    levers: {
      waterEffort: 0,
      sanitationEffort: 0,
      educationEffort: 0,
      cleanEnergyEffort: 0,
      livelihoodEffort: 0,
    },
  },
};

const CLIMATE_META: Record<
  ClimateScenarioId,
  { label: string; shortLabel: string; rainShock: number; uncertaintyMult: number; note: string }
> = {
  normal: {
    label: "Normal Monsoon (0% Deficit)",
    shortLabel: "Normal Rain",
    rainShock: 0,
    uncertaintyMult: 1.0,
    note: "Assumes long-period average SW/NE Telangana rainfall with seasonal recharge.",
  },
  dry_15: {
    label: "Dry Stress (-15% Monsoon)",
    shortLabel: "Dry (-15%)",
    rainShock: 0.15,
    uncertaintyMult: 1.28,
    note: "Models 15% weaker monsoon recharge (+0.75m drawdown pressure & heat stress).",
  },
  drought_30: {
    label: "Severe Drought (-30% Monsoon)",
    shortLabel: "Drought (-30%)",
    rainShock: 0.3,
    uncertaintyMult: 1.6,
    note: "Models multi-year El Niño dry cycle; exposes unbuffered villages to sharp depletion.",
  },
};

const SLIDER_DEFS: {
  key: keyof PolicyLevers;
  label: string;
  scheme: string;
  accent: string;
}[] = [
  {
    key: "waterEffort",
    label: "Tap Water & Kakatiya Tank Recharge",
    scheme: "Mission Bhagiratha + Tank Desiltation",
    accent: "#06b6d4",
  },
  {
    key: "sanitationEffort",
    label: "Closed Drainage & WASH Sanitation",
    scheme: "Swachh Bharat Grameen + Soak Pits",
    accent: "#10b981",
  },
  {
    key: "educationEffort",
    label: "School WASH & Digital Literacy Labs",
    scheme: "Mana Ooru–Mana Badi + Retention",
    accent: "#ef4444",
  },
  {
    key: "cleanEnergyEffort",
    label: "Clean Cooking (LPG) & PM-KUSUM Solar",
    scheme: "PM Ujjwala + Solar Agri Feeders",
    accent: "#84cc16",
  },
  {
    key: "livelihoodEffort",
    label: "FPO Cold-Chain, SHG Credit & Skilling",
    scheme: "SERP SHGs + Cold Storage Clusters",
    accent: "#ec4899",
  },
];

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function round1(v: number): number {
  return Number(v.toFixed(1));
}

function round2(v: number): number {
  return Number(v.toFixed(2));
}

function runForecastEngine(
  village: SectorInsightsVillage | null,
  groundwaterList: DistrictGroundwaterRow[],
  levers: PolicyLevers,
  climateId: ClimateScenarioId
) {
  const vn = village?.villageName ?? "Telangana Benchmark Village";
  const dn = village?.districtName ?? "Medak";
  const mn = village?.mandalName ?? "Representative Mandal";
  const households = Math.max(80, village?.households ?? 420);
  const population = Math.max(300, village?.population ?? 1850);

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

  const climate = CLIMATE_META[climateId];

  const rawDisease =
    openDef * 0.34 +
    (100 - closedDrain) * 0.18 +
    (100 - tapPct) * 0.22 +
    Math.min(100, pm25 * 1.1) * 0.16 +
    Math.min(40, rain7d * 0.45) * 0.1;
  const baseDiseaseRisk = round1(clamp(rawDisease, 12, 86));

  // Normalize levers 0..1
  const wL = levers.waterEffort / 100;
  const sL = levers.sanitationEffort / 100;
  const eL = levers.educationEffort / 100;
  const cL = levers.cleanEnergyEffort / 100;
  const lL = levers.livelihoodEffort / 100;

  // Weighted composite intervention elasticity
  const compositeEffort = wL * 0.23 + sL * 0.21 + eL * 0.19 + cL * 0.17 + lL * 0.2;

  // Structural drift (worsens with drought and critical groundwater extraction)
  const stressDrift =
    (gwExtractPct > 85 ? 2.6 : 1.1) +
    (openDef > 35 ? 1.5 : 0.6) +
    (biomass > 50 ? 1.2 : 0.4) +
    climate.rainShock * 11.5;

  // Gap budgets derived from village baseline deficits
  const watHeadroom = Math.max(6, 97 - watS);
  const heaHeadroom = Math.max(6, 96 - heaS);
  const eduHeadroom = Math.max(6, 96 - eduS);
  const envHeadroom = Math.max(6, 96 - envS);
  const livHeadroom = Math.max(6, 95 - livS);

  // Capex cost model grounded in actual village household & tank gaps
  const tapGapHh = Math.round(households * (Math.max(5, 100 - tapPct) / 100));
  const sanGapHh = Math.round(households * (Math.max(8, 100 - closedDrain) / 100));
  const bioGapHh = Math.round(households * (Math.max(8, biomass) / 100));
  const margWorkersEst = Math.round(population * 0.42 * (Math.max(6, marginal) / 100));

  const totalFullCapexLakhs =
    (tapGapHh * 0.14 + Math.max(1, tanks) * 18) * wL +
    (sanGapHh * 0.19) * sL +
    ((population / 100) * 1.25) * eL +
    (bioGapHh * 0.095 + households * 0.05) * cL +
    (margWorkersEst * 0.12 + 22) * lL;

  const years = Array.from({ length: 22 }, (_, i) => 2026 + i);

  const rows: AnnualForecastRow[] = years.map((yr, idx) => {
    const frac = idx / 21; // 0..1
    const ease = 1 - Math.pow(1 - frac, 1.48);
    const ciWidth = Math.sqrt(frac) * climate.uncertaintyMult * (1.08 - 0.18 * compositeEffort);

    // Sectoral incremental score gains (accounting for drought resistance via water + energy)
    const droughtDrag = climate.rainShock * (10.5 - 6.8 * wL - 2.2 * cL);
    const weightedSectorGain =
      watHeadroom * wL * 0.92 * ease * 0.21 +
      heaHeadroom * (sL * 0.72 + wL * 0.28) * 0.92 * ease * 0.21 +
      eduHeadroom * (eL * 0.78 + sL * 0.22) * 0.9 * ease * 0.19 +
      envHeadroom * (cL * 0.65 + wL * 0.35) * 0.9 * ease * 0.19 +
      livHeadroom * (lL * 0.78 + wL * 0.12 + cL * 0.1) * 0.9 * ease * 0.2;

    const bauScore = round1(clamp(baseScore - stressDrift * frac * 1.45, 18, 92));
    const p50Score = round1(
      clamp(
        baseScore + weightedSectorGain - droughtDrag * frac + (compositeEffort < 0.05 ? -stressDrift * frac * 1.45 : 0),
        18,
        97
      )
    );
    const scoreBandPad = 1.4 + ciWidth * 5.8;
    const p15Score = round1(clamp(p50Score - scoreBandPad, 15, p50Score));
    const p85Score = round1(clamp(p50Score + scoreBandPad * 0.85, p50Score, 99));

    const bauVvi = round1(100 - bauScore);
    const p50Vvi = round1(100 - p50Score);

    // Disease model: sanitation (50%), treated tap water (30%), clean cooking smoke reduction (20%)
    const diseaseControlPotency = sL * 0.5 + wL * 0.3 + cL * 0.2;
    const bauDisease = round1(
      clamp(baseDiseaseRisk + (rain7d > 20 ? 8.5 : 4.2 + climate.rainShock * 18) * frac, 8, 94)
    );
    const p50Disease = round1(
      clamp(
        baseDiseaseRisk * (1 - 0.78 * diseaseControlPotency * ease) +
          climate.rainShock * (1 - diseaseControlPotency * 0.65) * 14 * frac,
        4.5,
        92
      )
    );
    const disBandPad = 0.8 + ciWidth * 4.4;
    const p15Disease = round1(clamp(p50Disease - disBandPad * 0.85, 3, p50Disease));
    const p85Disease = round1(clamp(p50Disease + disBandPad, p50Disease, 95));

    // Hydrogeology balance: extraction + climate rain deficit vs tank desiltation + water recharge
    const gwDepletionDelta = (gwExtractPct / 100) * (4.6 + climate.rainShock * 9.5) * frac;
    const maxRecharge = Math.min(5.6, 1.9 + tanks * 0.48 + (100 - tapPct) * 0.02);
    const actualRecharge = maxRecharge * (wL * 0.82 + cL * 0.18) * (1 - climate.rainShock * 0.45) * ease;
    const bauMbgl = round2(clamp(baseMbgl + gwDepletionDelta, 2.0, 32.0));
    const p50Mbgl = round2(clamp(baseMbgl + gwDepletionDelta * (1 - wL * 0.72) - actualRecharge, 2.0, 30.0));
    const gwPad = 0.2 + ciWidth * 1.15;
    const p15Mbgl = round2(clamp(p50Mbgl - gwPad, 1.8, p50Mbgl));
    const p85Mbgl = round2(clamp(p50Mbgl + gwPad * 1.1, p50Mbgl, 32.0));

    // Household Real Income Index (2026 = 100)
    const bauIncome = Math.round(
      clamp(100 + (16 - marginal * 0.35 - climate.rainShock * 38) * frac, 72, 145)
    );
    const livPotency = lL * 0.68 + wL * 0.18 + cL * 0.14;
    const p50Income = Math.round(
      clamp(
        100 +
          (148 * livPotency + (banking - 50) * 0.42 + (solar - 15) * 2.8 * cL) * ease -
          climate.rainShock * (36 - 24 * wL) * frac,
        75,
        295
      )
    );
    const incPad = Math.round(3 + ciWidth * 14);
    const p15Income = Math.max(70, p50Income - incPad);
    const p85Income = Math.min(310, p50Income + incPad);

    // Female Literacy (%)
    const bauFemaleLit = round1(clamp(femLit + 4.2 * frac, 20, 82));
    const eduPotency = eL * 0.78 + sL * 0.12 + wL * 0.1;
    const p50FemaleLit = round1(
      clamp(femLit + (97.5 - femLit) * eduPotency * ease, femLit, 98.5)
    );
    const litPad = 0.7 + ciWidth * 2.4;
    const p15FemaleLit = round1(clamp(p50FemaleLit - litPad, femLit, p50FemaleLit));
    const p85FemaleLit = round1(clamp(p50FemaleLit + litPad * 0.7, p50FemaleLit, 99.2));

    return {
      year: yr,
      yearLabel: String(yr),
      bauScore,
      p50Score,
      p15Score,
      p85Score,
      scoreBand: [p15Score, p85Score],
      bauVvi,
      p50Vvi,
      bauDisease,
      p50Disease,
      p15Disease,
      p85Disease,
      diseaseBand: [p15Disease, p85Disease],
      bauMbgl,
      p50Mbgl,
      p15Mbgl,
      p85Mbgl,
      mbglBand: [p15Mbgl, p85Mbgl],
      bauIncome,
      p50Income,
      p15Income,
      p85Income,
      incomeBand: [p15Income, p85Income],
      bauFemaleLit,
      p50FemaleLit,
      p15FemaleLit,
      p85FemaleLit,
      femaleLitBand: [p15FemaleLit, p85FemaleLit],
      cumCapexLakhs: round1(totalFullCapexLakhs * ease),
    };
  });

  // Compute Exact Threshold Crossing Years
  const score75Row = rows.find((r) => r.p50Score >= 75);
  const score85Row = rows.find((r) => r.p50Score >= 85);
  const disease15Row = rows.find((r) => r.p50Disease <= 15);
  const female85Row = rows.find((r) => r.p50FemaleLit >= 85);
  const gwRecoverRow = rows.find((r, i) => i > 0 && r.p50Mbgl <= baseMbgl - 0.5);

  // Compute Marginal Sensitivity for +10% slider bump around current settings (at 2047)
  const endRow = rows[rows.length - 1];

  return {
    villageName: vn,
    districtName: dn,
    mandalName: mn,
    districtGw: gwRow,
    households,
    population,
    tanks,
    tapPct,
    openDef,
    closedDrain,
    pm25,
    rain7d,
    biomass,
    femLit,
    marginal,
    banking,
    solar,
    gwExtractPct,
    baselineScore: baseScore,
    baselineDiseaseRisk: baseDiseaseRisk,
    baselineMbgl: baseMbgl,
    totalFullCapexLakhs: round1(totalFullCapexLakhs),
    rows,
    endRow,
    milestones: {
      score75Year: score75Row ? score75Row.year : null,
      score85Year: score85Row ? score85Row.year : null,
      disease15Year: disease15Row ? disease15Row.year : null,
      female85Year: female85Row ? female85Row.year : null,
      gwRecoverYear: gwRecoverRow ? gwRecoverRow.year : null,
    },
    explanations: [
      {
        id: "water",
        domain: "Water & Hydrogeological Balance",
        accent: "#06b6d4",
        observedInput: `${dn} post-monsoon water table is ${baseMbgl}m bgl (${gwExtractPct}% stage of extraction); ${vn} has ${tanks} TRACGIS irrigation tanks & ${tapPct}% tap coverage.`,
        bauLogic: `Under ${climate.shortLabel} and ${gwExtractPct}% extraction without percolation recharge, water table declines to ${endRow.bauMbgl}m bgl by 2047.`,
        interventionLogic: `At ${levers.waterEffort}% water allocation, tank desiltation & borewell recharge shift 2047 depth to ${endRow.p50Mbgl}m bgl (${(endRow.bauMbgl - endRow.p50Mbgl).toFixed(1)}m better than BAU).`,
        netDeltaLabel: `${(endRow.bauMbgl - endRow.p50Mbgl) >= 0 ? "+" : ""}${(endRow.bauMbgl - endRow.p50Mbgl).toFixed(1)}m Table Recovery`,
      },
      {
        id: "health",
        domain: "Sanitation & Preventive Disease Burden",
        accent: "#10b981",
        observedInput: `Baseline enteric/respiratory susceptibility sits at ${baseDiseaseRisk}% from ${openDef}% open defecation, ${closedDrain}% closed drainage & ${pm25} µg/m³ PM2.5.`,
        bauLogic: `Unlined greywater runoff (${rain7d}mm 7d telemetry) and climate stress push 2047 exposure risk to ${endRow.bauDisease}%.`,
        interventionLogic: `${levers.sanitationEffort}% WASH/drainage + ${levers.cleanEnergyEffort}% clean cooking saturation lower 2047 disease burden to ${endRow.p50Disease}%.`,
        netDeltaLabel: `${(endRow.p50Disease - endRow.bauDisease).toFixed(1)}% Risk Delta`,
      },
      {
        id: "education",
        domain: "Female Literacy & Human Capital Transition",
        accent: "#ef4444",
        observedInput: `Current education score ${eduS}/100 with ${femLit}% female literacy and ${village?.education.nearestSchoolKm ?? 2.4} km to ${village?.education.nearestSchoolName ?? "nearest school"}.`,
        bauLogic: `Persistent water-fetching labor and absenteeism stall female literacy around ${endRow.bauFemaleLit}% by 2047.`,
        interventionLogic: `${levers.educationEffort}% school WASH/digital lab allocation + tap access lifts female literacy to ${endRow.p50FemaleLit}%.`,
        netDeltaLabel: `+${(endRow.p50FemaleLit - endRow.bauFemaleLit).toFixed(1)}% Literacy Gain`,
      },
      {
        id: "livelihood_env",
        domain: "FPO Value-Chain, Clean Energy & Income Multiplier",
        accent: "#f59e0b",
        observedInput: `Livelihood ${livS}/100 (${marginal}% marginal workers, ${banking}% banked) paired with ${biomass}% biomass fuel & ${solar} MJ/m² solar irradiance.`,
        bauLogic: `Distress grain sales and drought exposure constrain 2047 household real income index to ${endRow.bauIncome} (2026=100).`,
        interventionLogic: `${levers.livelihoodEffort}% FPO cold-storage & SHG credit + ${levers.cleanEnergyEffort}% solar power lifts income index to ${endRow.p50Income}.`,
        netDeltaLabel: `+${Math.round(((endRow.p50Income - endRow.bauIncome) / Math.max(1, endRow.bauIncome)) * 100)}% Real Income Lift`,
      },
    ],
  };
}

function downloadForecastCsv(
  villageName: string,
  climateLabel: string,
  levers: PolicyLevers,
  rows: AnnualForecastRow[]
) {
  const headers = [
    "Year",
    "Village",
    "Climate_Scenario",
    "Water_Effort_Pct",
    "Sanitation_Effort_Pct",
    "Education_Effort_Pct",
    "CleanEnergy_Effort_Pct",
    "Livelihood_Effort_Pct",
    "BAU_Composite_Score",
    "Forecast_P50_Score",
    "Forecast_P15_Score",
    "Forecast_P85_Score",
    "BAU_Disease_Risk_Pct",
    "Forecast_P50_Disease_Pct",
    "BAU_Groundwater_mbgl",
    "Forecast_P50_Groundwater_mbgl",
    "BAU_Female_Literacy_Pct",
    "Forecast_P50_Female_Literacy_Pct",
    "BAU_Income_Index",
    "Forecast_P50_Income_Index",
    "Cumulative_Est_Capex_Lakhs_INR",
  ];

  const lines = rows.map((r) =>
    [
      r.year,
      `"${villageName.replace(/"/g, '""')}"`,
      `"${climateLabel}"`,
      levers.waterEffort,
      levers.sanitationEffort,
      levers.educationEffort,
      levers.cleanEnergyEffort,
      levers.livelihoodEffort,
      r.bauScore,
      r.p50Score,
      r.p15Score,
      r.p85Score,
      r.bauDisease,
      r.p50Disease,
      r.bauMbgl,
      r.p50Mbgl,
      r.bauFemaleLit,
      r.p50FemaleLit,
      r.bauIncome,
      r.p50Income,
      r.cumCapexLakhs,
    ].join(",")
  );

  const blob = new Blob([[headers.join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${villageName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_2026_2047_forecast.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* =========================================================
   EXPANDED WORKBENCH MODAL (NO "CINEMA" WORDING)
========================================================= */

function ExpandedForecastWorkbench({
  open,
  onClose,
  model,
  chartData,
  activeMetricCfg,
  chartMetric,
  setChartMetric,
  inspectYear,
  setInspectYear,
  pinnedScenario,
}: {
  open: boolean;
  onClose: () => void;
  model: ReturnType<typeof runForecastEngine>;
  chartData: Record<string, unknown>[];
  activeMetricCfg: {
    label: string;
    unit: string;
    domain: [number | "auto", number | "auto"];
  };
  chartMetric: ChartMetricKey;
  setChartMetric: (k: ChartMetricKey) => void;
  inspectYear: number;
  setInspectYear: (y: number) => void;
  pinnedScenario: PinnedScenario | null;
}) {
  if (!open) return null;

  const inspectRow =
    model.rows.find((r) => r.year === inspectYear) ?? model.endRow;

  return (
    <div className="fixed inset-0 z-[155] flex flex-col justify-between overflow-y-auto bg-white dark:bg-[#050911] text-slate-900 dark:text-white p-5 md:p-8">
      <div className="max-w-6xl w-full mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
          <div>
            <div className="text-xs font-mono font-semibold text-cyan-600 dark:text-cyan-300">
              EXPANDED FORECAST WORKBENCH · {model.villageName} ({model.districtName})
            </div>
            <h2 className="mt-1 text-xl md:text-2xl font-semibold">
              Annualized 2026–2047 Multi-Variable Projection &amp; P15–P85 Confidence Envelope
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium border border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 shrink-0"
          >
            <X size={14} />
            <span>Close Expanded View</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: "score", label: "Composite Score" },
                { id: "diseaseRisk", label: "Disease Risk" },
                { id: "groundwaterMbgl", label: "Groundwater (m bgl)" },
                { id: "incomeIndex", label: "Income Index" },
                { id: "femaleLiteracy", label: "Female Literacy" },
              ] as { id: ChartMetricKey; label: string }[]
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setChartMetric(m.id)}
                className={`px-3 py-1.5 text-xs font-medium border transition ${
                  chartMetric === m.id
                    ? "border-cyan-500 bg-cyan-600 text-white"
                    : "border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-white/[0.03] text-slate-700 dark:text-white/75"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
            <span className="text-slate-500 dark:text-white/60">Inspect Year:</span>
            <input
              type="range"
              min={2026}
              max={2047}
              value={inspectYear}
              onChange={(e) => setInspectYear(Number(e.target.value))}
              className="w-40 accent-cyan-500"
            />
            <span className="px-2 py-1 border border-cyan-500/40 bg-cyan-500/10 font-bold text-cyan-700 dark:text-cyan-300">
              {inspectYear}
            </span>
          </div>
        </div>

        <div className="border border-slate-200 dark:border-white/12 bg-slate-50 dark:bg-[#04070d] p-5">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                <XAxis dataKey="yearLabel" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis domain={activeMetricCfg.domain} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#070b12",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <ReferenceLine
                  x={String(inspectYear)}
                  stroke="#06b6d4"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                />
                <Area
                  type="monotone"
                  dataKey="band"
                  name={`70% Uncertainty Envelope (${activeMetricCfg.unit})`}
                  stroke="none"
                  fill="rgba(6,182,212,0.16)"
                />
                <Line
                  type="monotone"
                  dataKey="p50"
                  name={`Forecast Median P50 (${activeMetricCfg.unit})`}
                  stroke="#10b981"
                  strokeWidth={2.8}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="bau"
                  name={`BAU Baseline Drift (${activeMetricCfg.unit})`}
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
                {pinnedScenario && (
                  <Line
                    type="monotone"
                    dataKey="pinned"
                    name={`Pinned ${pinnedScenario.name} (${activeMetricCfg.unit})`}
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    dot={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs font-mono tabular-nums">
          <div className="border border-slate-200 dark:border-white/10 p-3.5">
            <div className="text-[11px] font-sans text-slate-500 dark:text-white/55">
              {inspectYear} P50 Score
            </div>
            <div className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-300">
              {inspectRow.p50Score}/100
            </div>
            <div className="text-[10px] text-slate-500 dark:text-white/50">
              CI: {inspectRow.p15Score}–{inspectRow.p85Score} · BAU {inspectRow.bauScore}
            </div>
          </div>
          <div className="border border-slate-200 dark:border-white/10 p-3.5">
            <div className="text-[11px] font-sans text-slate-500 dark:text-white/55">
              Groundwater Table
            </div>
            <div className="mt-1 text-lg font-bold text-cyan-600 dark:text-cyan-300">
              {inspectRow.p50Mbgl}m bgl
            </div>
            <div className="text-[10px] text-slate-500 dark:text-white/50">
              BAU: {inspectRow.bauMbgl}m bgl
            </div>
          </div>
          <div className="border border-slate-200 dark:border-white/10 p-3.5">
            <div className="text-[11px] font-sans text-slate-500 dark:text-white/55">
              Disease Burden
            </div>
            <div className="mt-1 text-lg font-bold text-amber-600 dark:text-amber-300">
              {inspectRow.p50Disease}%
            </div>
            <div className="text-[10px] text-slate-500 dark:text-white/50">
              BAU: {inspectRow.bauDisease}%
            </div>
          </div>
          <div className="border border-slate-200 dark:border-white/10 p-3.5">
            <div className="text-[11px] font-sans text-slate-500 dark:text-white/55">
              Female Literacy
            </div>
            <div className="mt-1 text-lg font-bold text-rose-600 dark:text-rose-300">
              {inspectRow.p50FemaleLit}%
            </div>
            <div className="text-[10px] text-slate-500 dark:text-white/50">
              BAU: {inspectRow.bauFemaleLit}%
            </div>
          </div>
          <div className="border border-slate-200 dark:border-white/10 p-3.5">
            <div className="text-[11px] font-sans text-slate-500 dark:text-white/55">
              Cum. Capex Est.
            </div>
            <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
              ₹{inspectRow.cumCapexLakhs}L
            </div>
            <div className="text-[10px] text-slate-500 dark:text-white/50">
              Income Idx: {inspectRow.p50Income}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN EXPORTED 2026–2047 VILLAGE PREDICTION TOOL
========================================================= */

export default function PredictionHorizonStudio({
  village,
  groundwater,
}: {
  village: SectorInsightsVillage | null;
  groundwater: DistrictGroundwaterRow[];
}) {
  const [presetId, setPresetId] = useState<PresetId>("balanced");
  const [levers, setLevers] = useState<PolicyLevers>(PRESET_PROFILES.balanced.levers);
  const [climateId, setClimateId] = useState<ClimateScenarioId>("normal");
  const [targetHorizon, setTargetHorizon] = useState<number>(2047);
  const [chartMetric, setChartMetric] = useState<ChartMetricKey>("score");
  const [pinnedScenario, setPinnedScenario] = useState<PinnedScenario | null>(null);
  const [expandedOpen, setExpandedOpen] = useState<boolean>(false);

  const model = useMemo(
    () => runForecastEngine(village, groundwater, levers, climateId),
    [village, groundwater, levers, climateId]
  );

  // Marginal +10% Sensitivity Ranking for this village around current sliders
  const sensitivityRanking: SensitivityDriver[] = useMemo(() => {
    const baseEnd = model.endRow;
    return SLIDER_DEFS.map((def) => {
      const bumpedVal = Math.min(100, levers[def.key] + 10);
      if (bumpedVal === levers[def.key]) {
        // If already at 100%, test -10% delta to compute marginal elasticity
        const downLevers = { ...levers, [def.key]: levers[def.key] - 10 };
        const downOut = runForecastEngine(village, groundwater, downLevers, climateId);
        const capexDelta = Math.max(0.5, model.totalFullCapexLakhs - downOut.totalFullCapexLakhs);
        const ptsDelta = round2(baseEnd.p50Score - downOut.endRow.p50Score);
        return {
          key: def.key,
          label: def.label,
          gainPer10PctPts: ptsDelta,
          riskReductionPct: round1(downOut.endRow.p50Disease - baseEnd.p50Disease),
          roiPer10Lakhs: round2((ptsDelta / capexDelta) * 10),
        };
      }
      const upLevers = { ...levers, [def.key]: bumpedVal };
      const upOut = runForecastEngine(village, groundwater, upLevers, climateId);
      const capexDelta = Math.max(0.5, upOut.totalFullCapexLakhs - model.totalFullCapexLakhs);
      const ptsDelta = round2(upOut.endRow.p50Score - baseEnd.p50Score);
      return {
        key: def.key,
        label: def.label,
        gainPer10PctPts: ptsDelta,
        riskReductionPct: round1(baseEnd.p50Disease - upOut.endRow.p50Disease),
        roiPer10Lakhs: round2((ptsDelta / capexDelta) * 10),
      };
    }).sort((a, b) => b.roiPer10Lakhs - a.roiPer10Lakhs);
  }, [village, groundwater, levers, climateId, model]);

  const metricConfigs: Record<
    ChartMetricKey,
    {
      label: string;
      unit: string;
      domain: [number | "auto", number | "auto"];
      getRow: (r: AnnualForecastRow) => {
        p50: number;
        bau: number;
        band: [number, number];
      };
    }
  > = {
    score: {
      label: "Composite Development Score",
      unit: "/100",
      domain: [20, 100],
      getRow: (r) => ({ p50: r.p50Score, bau: r.bauScore, band: r.scoreBand }),
    },
    diseaseRisk: {
      label: "Preventable Disease Burden",
      unit: "%",
      domain: [0, 95],
      getRow: (r) => ({ p50: r.p50Disease, bau: r.bauDisease, band: r.diseaseBand }),
    },
    groundwaterMbgl: {
      label: "Groundwater Depth (Lower = Closer to Surface)",
      unit: "m bgl",
      domain: ["auto", "auto"],
      getRow: (r) => ({ p50: r.p50Mbgl, bau: r.bauMbgl, band: r.mbglBand }),
    },
    incomeIndex: {
      label: "Real Household Income Index (2026 = 100)",
      unit: "idx",
      domain: ["auto", "auto"],
      getRow: (r) => ({ p50: r.p50Income, bau: r.bauIncome, band: r.incomeBand }),
    },
    femaleLiteracy: {
      label: "Female Literacy Rate",
      unit: "%",
      domain: [25, 100],
      getRow: (r) => ({ p50: r.p50FemaleLit, bau: r.bauFemaleLit, band: r.femaleLitBand }),
    },
  };

  const activeMetricCfg = metricConfigs[chartMetric];

  const chartData = useMemo(() => {
    return model.rows.map((r, idx) => {
      const vals = activeMetricCfg.getRow(r);
      const pinnedRow = pinnedScenario?.rows[idx];
      const pinnedVals = pinnedRow ? activeMetricCfg.getRow(pinnedRow) : null;
      return {
        yearLabel: r.yearLabel,
        year: r.year,
        p50: vals.p50,
        bau: vals.bau,
        band: vals.band,
        pinned: pinnedVals ? pinnedVals.p50 : undefined,
      };
    });
  }, [model.rows, activeMetricCfg, pinnedScenario]);

  const targetRow =
    model.rows.find((r) => r.year === targetHorizon) ?? model.endRow;
  const pinnedTargetRow =
    pinnedScenario?.rows.find((r) => r.year === targetHorizon) ?? null;

  function applyPreset(id: Exclude<PresetId, "custom">) {
    setPresetId(id);
    setLevers({ ...PRESET_PROFILES[id].levers });
  }

  function updateSlider(key: keyof PolicyLevers, value: number) {
    setPresetId("custom");
    setLevers((prev) => ({ ...prev, [key]: value }));
  }

  function handlePinScenario() {
    if (pinnedScenario) {
      setPinnedScenario(null);
      return;
    }
    const label =
      presetId === "custom"
        ? `Custom Plan (${CLIMATE_META[climateId].shortLabel})`
        : `${PRESET_PROFILES[presetId].label.split(" ")[0]} (${CLIMATE_META[climateId].shortLabel})`;
    setPinnedScenario({
      name: label,
      levers: { ...levers },
      climate: climateId,
      rows: model.rows,
    });
  }

  const topDriver = sensitivityRanking[0];
  const scoreGainVsBau = round1(targetRow.p50Score - targetRow.bauScore);
  const roiPtsPerCrore =
    targetRow.cumCapexLakhs > 0
      ? round1((scoreGainVsBau / targetRow.cumCapexLakhs) * 100)
      : 0;

  const comparisonRows = [
    {
      metric: "Composite Score",
      baseline: `${model.baselineScore}/100`,
      bauTarget: `${targetRow.bauScore}/100`,
      p50Target: `${targetRow.p50Score}/100`,
      ciRange: `${targetRow.p15Score}–${targetRow.p85Score}`,
      pinnedVal: pinnedTargetRow ? `${pinnedTargetRow.p50Score}/100` : null,
      delta: `${scoreGainVsBau >= 0 ? "+" : ""}${scoreGainVsBau} pts`,
    },
    {
      metric: "Vulnerability Index (VVI)",
      baseline: `${round1(100 - model.baselineScore)}`,
      bauTarget: `${targetRow.bauVvi}`,
      p50Target: `${targetRow.p50Vvi}`,
      ciRange: `${round1(100 - targetRow.p85Score)}–${round1(100 - targetRow.p15Score)}`,
      pinnedVal: pinnedTargetRow ? `${pinnedTargetRow.p50Vvi}` : null,
      delta: `${round1(targetRow.p50Vvi - targetRow.bauVvi)} pts`,
    },
    {
      metric: "Groundwater Table",
      baseline: `${model.baselineMbgl}m bgl`,
      bauTarget: `${targetRow.bauMbgl}m bgl`,
      p50Target: `${targetRow.p50Mbgl}m bgl`,
      ciRange: `${targetRow.p15Mbgl}–${targetRow.p85Mbgl}m`,
      pinnedVal: pinnedTargetRow ? `${pinnedTargetRow.p50Mbgl}m` : null,
      delta: `${(targetRow.bauMbgl - targetRow.p50Mbgl) >= 0 ? "+" : ""}${(
        targetRow.bauMbgl - targetRow.p50Mbgl
      ).toFixed(2)}m`,
    },
    {
      metric: "Preventable Disease Risk",
      baseline: `${model.baselineDiseaseRisk}%`,
      bauTarget: `${targetRow.bauDisease}%`,
      p50Target: `${targetRow.p50Disease}%`,
      ciRange: `${targetRow.p15Disease}–${targetRow.p85Disease}%`,
      pinnedVal: pinnedTargetRow ? `${pinnedTargetRow.p50Disease}%` : null,
      delta: `${round1(targetRow.p50Disease - targetRow.bauDisease)}%`,
    },
    {
      metric: "Female Literacy",
      baseline: `${model.femLit}%`,
      bauTarget: `${targetRow.bauFemaleLit}%`,
      p50Target: `${targetRow.p50FemaleLit}%`,
      ciRange: `${targetRow.p15FemaleLit}–${targetRow.p85FemaleLit}%`,
      pinnedVal: pinnedTargetRow ? `${pinnedTargetRow.p50FemaleLit}%` : null,
      delta: `+${round1(targetRow.p50FemaleLit - targetRow.bauFemaleLit)}%`,
    },
    {
      metric: "Household Income Index",
      baseline: "100",
      bauTarget: `${targetRow.bauIncome}`,
      p50Target: `${targetRow.p50Income}`,
      ciRange: `${targetRow.p15Income}–${targetRow.p85Income}`,
      pinnedVal: pinnedTargetRow ? `${pinnedTargetRow.p50Income}` : null,
      delta: `${Math.round(((targetRow.p50Income - targetRow.bauIncome) / Math.max(1, targetRow.bauIncome)) * 100) >= 0 ? "+" : ""}${Math.round(
        ((targetRow.p50Income - targetRow.bauIncome) / Math.max(1, targetRow.bauIncome)) * 100
      )}%`,
    },
  ];

  return (
    <section id="prediction-engine-section" className="max-w-7xl mx-auto px-6 md:px-8 pb-14">
      <div className="border border-slate-200 dark:border-white/12 bg-white dark:bg-[#070b12] p-6 md:p-8 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold text-cyan-600 dark:text-cyan-300 flex items-center gap-2">
              <SlidersHorizontal size={14} />
              <span>2026–2047 VILLAGE PREDICTIVE FORECASTING &amp; RESOURCE ALLOCATION TOOL</span>
            </div>
            <h3 className="mt-1.5 text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white text-balance">
              Multi-Variable Horizon Forecast &amp; Sensitivity Tool ({model.villageName})
            </h3>
            <p className="mt-1.5 text-xs md:text-sm leading-6 text-slate-600 dark:text-white/60">
              Adjust sectoral investment intensity and monsoon stress to compute annualized trajectories (P50 median with P15–P85 confidence bounds), tipping-point milestone years, capex ROI, and downloadable CSV schedules from {model.villageName}&apos;s live Census, TRACGIS, and {model.districtName} groundwater baselines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePinScenario}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border transition whitespace-nowrap ${
                pinnedScenario
                  ? "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  : "border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-white/[0.03] text-slate-700 dark:text-white/80 hover:border-amber-400"
              }`}
            >
              <Bookmark size={13} />
              <span>{pinnedScenario ? "Clear Pinned Plan A" : "Pin Baseline as Plan A"}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                downloadForecastCsv(
                  model.villageName,
                  CLIMATE_META[climateId].label,
                  levers,
                  model.rows
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-white/[0.03] text-slate-700 dark:text-white/80 hover:border-emerald-400 transition whitespace-nowrap"
            >
              <Download size={13} />
              <span>Export Forecast (.CSV)</span>
            </button>

            <button
              type="button"
              onClick={() => setExpandedOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition whitespace-nowrap"
            >
              <Maximize2 size={13} />
              <span>Expanded Workbench View</span>
            </button>
          </div>
        </div>

        {/* Top Control Matrix: Policy Presets + Climate Stress + Horizon Selector */}
        <div className="grid lg:grid-cols-12 gap-5 items-start">
          {/* Left Control Column: Sliders & Presets */}
          <div className="lg:col-span-5 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-5 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                01. Policy Allocation Parameters
              </span>
              <button
                type="button"
                onClick={() => applyPreset("balanced")}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-600 dark:text-cyan-300 hover:underline"
              >
                <RotateCcw size={11} />
                <span>Reset Defaults</span>
              </button>
            </div>

            {/* Preset Buttons */}
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(PRESET_PROFILES) as Exclude<PresetId, "custom">[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => applyPreset(id)}
                  className={`px-2.5 py-1.5 text-[11px] font-medium border transition ${
                    presetId === id
                      ? "border-cyan-500 bg-cyan-600 text-white"
                      : "border-slate-300 dark:border-white/15 bg-white dark:bg-white/[0.03] text-slate-700 dark:text-white/75 hover:border-cyan-400"
                  }`}
                >
                  {PRESET_PROFILES[id].label}
                </button>
              ))}
            </div>

            {/* 5 Interactive Policy Sliders */}
            <div className="space-y-3.5 pt-1 border-t border-slate-200 dark:border-white/10">
              {SLIDER_DEFS.map((s) => (
                <div key={s.key} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-slate-800 dark:text-white/90">
                      {s.label}
                    </span>
                    <span
                      className="font-mono font-bold tabular-nums shrink-0"
                      style={{ color: s.accent }}
                    >
                      {levers[s.key]}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    aria-label={s.label}
                    value={levers[s.key]}
                    onChange={(e) => updateSlider(s.key, Number(e.target.value))}
                    className="w-full h-1.5 cursor-pointer accent-cyan-500"
                  />
                  <div className="text-[10.5px] text-slate-500 dark:text-white/45">
                    {s.scheme}
                  </div>
                </div>
              ))}
            </div>

            {/* Monsoon & Climate Sensitivity Selector */}
            <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                <CloudRain size={13} className="text-amber-500" />
                <span>02. Monsoon &amp; Climate Stress Assumption</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(Object.keys(CLIMATE_META) as ClimateScenarioId[]).map((cid) => (
                  <button
                    key={cid}
                    type="button"
                    onClick={() => setClimateId(cid)}
                    className={`px-2 py-2 text-[11px] font-medium border text-center transition ${
                      climateId === cid
                        ? "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-200 font-semibold"
                        : "border-slate-300 dark:border-white/15 bg-white dark:bg-white/[0.02] text-slate-600 dark:text-white/65"
                    }`}
                  >
                    {CLIMATE_META[cid].shortLabel}
                  </button>
                ))}
              </div>
              <p className="text-[11px] leading-4 text-slate-500 dark:text-white/55">
                {CLIMATE_META[climateId].note}
              </p>
            </div>

            {/* Marginal ROI Sensitivity Callout */}
            {topDriver && (
              <div className="border border-emerald-500/30 bg-emerald-500/[0.06] p-3.5 space-y-1 text-xs">
                <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <Target size={13} />
                  <span>Highest-ROI Marginal Lever for {model.villageName}</span>
                </div>
                <div className="font-medium text-slate-900 dark:text-white">
                  {topDriver.label}
                </div>
                <div className="text-[11px] font-mono tabular-nums text-slate-600 dark:text-white/70">
                  +{topDriver.gainPer10PctPts} pts per 10% step · Efficiency {topDriver.roiPer10Lakhs} pts / ₹10L
                </div>
              </div>
            )}
          </div>

          {/* Right Output Column: KPI Strip + Confidence Band Chart + Milestones */}
          <div className="lg:col-span-7 space-y-5">
            {/* Target Horizon Year Inspection Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-white/80">
                  Target Horizon:
                </span>
                {[2030, 2035, 2040, 2047].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setTargetHorizon(yr)}
                    className={`px-3 py-1 text-xs font-mono font-semibold border transition ${
                      targetHorizon === yr
                        ? "border-emerald-500 bg-emerald-600 text-white"
                        : "border-slate-300 dark:border-white/15 bg-white dark:bg-white/[0.03] text-slate-700 dark:text-white/70"
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
                <span className="text-slate-500 dark:text-white/50">Year:</span>
                <input
                  type="range"
                  min={2026}
                  max={2047}
                  value={targetHorizon}
                  onChange={(e) => setTargetHorizon(Number(e.target.value))}
                  aria-label="Scrub target forecast year"
                  className="w-28 accent-emerald-500"
                />
                <span className="font-bold text-emerald-600 dark:text-emerald-300">
                  {targetHorizon}
                </span>
              </div>
            </div>

            {/* 4 Key Quantitative Output Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono tabular-nums">
              <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-3.5">
                <div className="text-[11px] font-sans text-slate-500 dark:text-white/55">
                  {targetHorizon} Score (P50)
                </div>
                <div className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-300">
                  {targetRow.p50Score}
                  <span className="text-xs font-normal text-slate-400">/100</span>
                </div>
                <div className="mt-0.5 text-[10.5px] text-slate-600 dark:text-white/55">
                  CI {targetRow.p15Score}–{targetRow.p85Score} ({scoreGainVsBau >= 0 ? "+" : ""}
                  {scoreGainVsBau} vs BAU)
                </div>
              </div>

              <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-3.5">
                <div className="text-[11px] font-sans text-slate-500 dark:text-white/55">
                  Groundwater ({targetHorizon})
                </div>
                <div className="mt-1 text-xl font-bold text-cyan-600 dark:text-cyan-300">
                  {targetRow.p50Mbgl}m
                </div>
                <div className="mt-0.5 text-[10.5px] text-slate-600 dark:text-white/55">
                  BAU {targetRow.bauMbgl}m · Band {targetRow.p15Mbgl}–{targetRow.p85Mbgl}
                </div>
              </div>

              <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-3.5">
                <div className="text-[11px] font-sans text-slate-500 dark:text-white/55">
                  Disease Risk ({targetHorizon})
                </div>
                <div className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-300">
                  {targetRow.p50Disease}%
                </div>
                <div className="mt-0.5 text-[10.5px] text-slate-600 dark:text-white/55">
                  BAU {targetRow.bauDisease}% ({round1(targetRow.p50Disease - targetRow.bauDisease)}%)
                </div>
              </div>

              <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-3.5">
                <div className="text-[11px] font-sans text-slate-500 dark:text-white/55">
                  Est. Capex &amp; ROI
                </div>
                <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                  ₹{targetRow.cumCapexLakhs}L
                </div>
                <div className="mt-0.5 text-[10.5px] text-slate-600 dark:text-white/55">
                  {model.households} HH · {roiPtsPerCrore} pts/₹1Cr
                </div>
              </div>
            </div>

            {/* Annualized Trajectory Chart with P15-P85 Confidence Envelope */}
            <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Layers size={14} className="text-cyan-500" />
                  <span>{activeMetricCfg.label} · 2026–2047 P15/P50/P85 Trajectory</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      { id: "score", label: "Score" },
                      { id: "diseaseRisk", label: "Disease Risk" },
                      { id: "groundwaterMbgl", label: "Groundwater" },
                      { id: "incomeIndex", label: "Income" },
                      { id: "femaleLiteracy", label: "Fem. Literacy" },
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

              <div className="h-[290px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                    <XAxis
                      dataKey="yearLabel"
                      tick={{ fontSize: 10.5, fill: "#94a3b8" }}
                      interval={2}
                    />
                    <YAxis
                      domain={activeMetricCfg.domain}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#070b12",
                        border: "1px solid rgba(255,255,255,0.15)",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <ReferenceLine
                      x={String(targetHorizon)}
                      stroke="#06b6d4"
                      strokeDasharray="3 3"
                      strokeWidth={1.5}
                    />
                    <Area
                      type="monotone"
                      dataKey="band"
                      name={`70% Uncertainty Band P15–P85 (${activeMetricCfg.unit})`}
                      stroke="none"
                      fill="rgba(6,182,212,0.16)"
                    />
                    <Line
                      type="monotone"
                      dataKey="p50"
                      name={`Policy Forecast P50 (${activeMetricCfg.unit})`}
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="bau"
                      name={`BAU Baseline Drift (${activeMetricCfg.unit})`}
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                    {pinnedScenario && (
                      <Line
                        type="monotone"
                        dataKey="pinned"
                        name={`Pinned ${pinnedScenario.name} (${activeMetricCfg.unit})`}
                        stroke="#f59e0b"
                        strokeWidth={2}
                        strokeDasharray="4 3"
                        dot={false}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600 dark:text-white/60 pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-4 bg-emerald-500 inline-block" />
                  <span>P50 Policy Forecast</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-4 bg-cyan-500/25 border border-cyan-500/40 inline-block" />
                  <span>P15–P85 Confidence Interval</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-4 border-t-2 border-dashed border-red-500 inline-block" />
                  <span>Business-As-Usual Drift</span>
                </span>
                {pinnedScenario && (
                  <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-300 font-medium">
                    <span className="h-0.5 w-4 border-t-2 border-dashed border-amber-500 inline-block" />
                    <span>Pinned: {pinnedScenario.name}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Threshold Tipping-Point Milestone Years */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-3">
                <div className="text-[11px] text-slate-500 dark:text-white/55">
                  Score ≥ 75/100 Year
                </div>
                <div className="mt-1 font-mono text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  <span>{model.milestones.score75Year ?? "Not reached"}</span>
                </div>
              </div>
              <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-3">
                <div className="text-[11px] text-slate-500 dark:text-white/55">
                  Disease Risk ≤ 15%
                </div>
                <div className="mt-1 font-mono text-base font-bold tabular-nums text-cyan-600 dark:text-cyan-300">
                  {model.milestones.disease15Year ?? "Above 15%"}
                </div>
              </div>
              <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-3">
                <div className="text-[11px] text-slate-500 dark:text-white/55">
                  Female Lit. ≥ 85%
                </div>
                <div className="mt-1 font-mono text-base font-bold tabular-nums text-rose-600 dark:text-rose-300">
                  {model.milestones.female85Year ?? "Not reached"}
                </div>
              </div>
              <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-3">
                <div className="text-[11px] text-slate-500 dark:text-white/55">
                  Aquifer Net Gain (-0.5m)
                </div>
                <div className="mt-1 font-mono text-base font-bold tabular-nums text-amber-600 dark:text-amber-300">
                  {model.milestones.gwRecoverYear ?? "Stabilizing"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full Outcome Comparison Table */}
        <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] overflow-x-auto">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-900 dark:text-white">
              Quantitative Projection Table: 2026 Baseline vs {targetHorizon} Forecasts
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-white/50">
              {CLIMATE_META[climateId].label} · P15–P85 Bounds Included
            </span>
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/55">
                <th className="px-4 py-2.5 font-medium">Indicator</th>
                <th className="px-4 py-2.5 font-medium">2026 Base</th>
                <th className="px-4 py-2.5 font-medium text-red-500">BAU {targetHorizon}</th>
                <th className="px-4 py-2.5 font-medium text-emerald-500">
                  Forecast P50 ({targetHorizon})
                </th>
                <th className="px-4 py-2.5 font-medium">70% CI (P15–P85)</th>
                {pinnedScenario && (
                  <th className="px-4 py-2.5 font-medium text-amber-500">
                    Pinned Plan A
                  </th>
                )}
                <th className="px-4 py-2.5 font-medium">Net vs BAU</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5 font-mono tabular-nums">
              {comparisonRows.map((row) => (
                <tr key={row.metric} className="hover:bg-slate-100/60 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 font-sans font-medium text-slate-900 dark:text-white">
                    {row.metric}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-white/65">
                    {row.baseline}
                  </td>
                  <td className="px-4 py-2.5 text-red-600 dark:text-red-300">
                    {row.bauTarget}
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-emerald-600 dark:text-emerald-300">
                    {row.p50Target}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-white/60">
                    {row.ciRange}
                  </td>
                  {pinnedScenario && (
                    <td className="px-4 py-2.5 text-amber-600 dark:text-amber-300">
                      {row.pinnedVal ?? "—"}
                    </td>
                  )}
                  <td className="px-4 py-2.5 font-bold text-cyan-600 dark:text-cyan-300 whitespace-nowrap">
                    {row.delta}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Causal Formula & Elasticity Documentation */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-white/10 pb-2.5">
            <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle size={14} className="text-orange-500" />
              <span>Model Drivers &amp; Causal Equations for {model.villageName}</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 dark:text-white/50">
              Auditable Elasticity Weights · Zero Black-Box
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
                  <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    {ex.netDeltaLabel}
                  </span>
                </div>

                <div className="text-xs leading-5 text-slate-700 dark:text-white/80">
                  <strong className="text-slate-900 dark:text-white">Observed Baseline Input:</strong>{" "}
                  {ex.observedInput}
                </div>

                <div className="grid sm:grid-cols-2 gap-2.5 pt-1 text-[11.5px] leading-5">
                  <div className="border border-red-500/30 bg-red-500/[0.05] p-2.5">
                    <div className="font-semibold text-red-600 dark:text-red-300 flex items-center gap-1">
                      <TrendingDown size={12} />
                      <span>BAU Drift Equation</span>
                    </div>
                    <p className="mt-1 text-slate-600 dark:text-white/70">{ex.bauLogic}</p>
                  </div>

                  <div className="border border-emerald-500/35 bg-emerald-500/[0.06] p-2.5">
                    <div className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <TrendingUp size={12} />
                      <span>Active Allocation Output</span>
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
              <strong>Methodology:</strong> Deterministic parametric projections calibrated against{" "}
              {model.villageName}&apos;s Census 2011 HLPCA baselines, TRACGIS tank polygons, CGWB/TGWB groundwater extraction stages, and live Open-Meteo rainfall telemetry.
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

      <ExpandedForecastWorkbench
        open={expandedOpen}
        onClose={() => setExpandedOpen(false)}
        model={model}
        chartData={chartData}
        activeMetricCfg={activeMetricCfg}
        chartMetric={chartMetric}
        setChartMetric={setChartMetric}
        inspectYear={targetHorizon}
        setInspectYear={setTargetHorizon}
        pinnedScenario={pinnedScenario}
      />
    </section>
  );
}
