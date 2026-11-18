import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = fs.existsSync(path.join(process.cwd(), "server", "data"))
  ? path.join(process.cwd(), "server", "data")
  : path.join(__dirname, "server", "data");
const PORT = Number(process.env.PORT) || 3000;

/* =========================================================
   GEMINI LLM CLIENT (SERVER-SIDE ONLY)
========================================================= */

function getGeminiClient(): GoogleGenAI | null {
  const key = (process.env.GEMINI_API_KEY ?? "").trim();
  if (!key || key === "YOUR_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      timeout: 25000,
      retryOptions: {
        attempts: 2,
        initialDelay: 0.6,
        maxDelay: 1.5,
      },
    },
  });
}

/* =========================================================
   IN-MEMORY TELANGANA DATASET CACHE
========================================================= */

type CompactVillage = {
  vc: string;
  vn: string;
  mc: string;
  mn: string;
  dc: string;
  dn: string;
  lat: number;
  lon: number;
  area: number;
  pop: number;
  hh: number;
  lit: number;
  wpr: number;
  marg: number;
  ch06: number;
  tanks: number;
  tanks_gt40: number;
  edu_s: number;
  hea_s: number;
  wat_s: number;
  liv_s: number;
  env_s: number;
  ovr_s: number;
  vvi: number;
  vvi_lvl: string;
  edu_km: number;
  edu_10: number;
  edu_nm: string;
  hea_km: number;
  hea_10: number;
  hea_nm: string;
  wat_km: number;
  wat_10: number;
  wat_nm: string;
  liv_km: number;
  liv_10: number;
  liv_nm: string;
  env_km: number;
  env_10: number;
  env_nm: string;
};

let villagesList: CompactVillage[] | null = null;
let villagesByCode: Map<string, CompactVillage> | null = null;
let mandalsByCode: Record<string, any> | null = null;
let analyticsSummaryCache: any | null = null;
let districtsGeoCache: any | null = null;
const sectorGisCache = new Map<string, any>();
const districtVillageGeomCache = new Map<string, Record<string, any>>();

function readJsonFile<T = any>(relPath: string): T {
  const fullPath = path.join(DATA_DIR, relPath);
  const raw = fs.readFileSync(fullPath, "utf-8");
  return JSON.parse(raw) as T;
}

function ensureCoreDataLoaded() {
  if (!villagesList) {
    villagesList = readJsonFile<CompactVillage[]>("villages_catalog.json");
    villagesByCode = new Map();
    for (const v of villagesList) {
      villagesByCode.set(v.vc, v);
    }
  }
  if (!mandalsByCode) {
    mandalsByCode = readJsonFile<Record<string, any>>("mandals_catalog.json");
  }
  if (!analyticsSummaryCache) {
    analyticsSummaryCache = readJsonFile<any>("analytics_summary.json");
  }
  if (!districtsGeoCache) {
    districtsGeoCache = readJsonFile<any>(path.join("gis", "districts.geojson"));
  }
}

function getVillageGeometry(dc: string, vc: string): any | null {
  const padded = String(dc).padStart(2, "0");
  if (!districtVillageGeomCache.has(padded)) {
    const geomPath = path.join("village_geometries", `${padded}.json`);
    if (fs.existsSync(path.join(DATA_DIR, geomPath))) {
      districtVillageGeomCache.set(padded, readJsonFile<Record<string, any>>(geomPath));
    } else {
      districtVillageGeomCache.set(padded, {});
    }
  }
  return districtVillageGeomCache.get(padded)?.[vc] ?? null;
}

const TELANGANA_UNIVERSITIES_EXTRA = [
  { id: "univ_ou", name: "Osmania University", category: "University", lat: 17.4135, lon: 78.5287, operator: "State Public University · Hyderabad" },
  { id: "univ_jntuh", name: "Jawaharlal Nehru Technological University Hyderabad (JNTUH)", category: "University", lat: 17.4933, lon: 78.3914, operator: "State Technical University · Kukatpally" },
  { id: "univ_uoh", name: "University of Hyderabad (UoH Central)", category: "University", lat: 17.4567, lon: 78.3264, operator: "Central University · Gachibowli" },
  { id: "univ_iith", name: "IIT Hyderabad (Kandi Campus)", category: "University", lat: 17.5947, lon: 78.1230, operator: "Institute of National Importance · Sangareddy/Medak" },
  { id: "univ_iiith", name: "IIIT Hyderabad", category: "University", lat: 17.4449, lon: 78.3498, operator: "Research University · Gachibowli" },
  { id: "univ_ku", name: "Kakatiya University", category: "University", lat: 18.0273, lon: 79.5594, operator: "State Public University · Warangal" },
  { id: "univ_nitw", name: "NIT Warangal", category: "University", lat: 17.9835, lon: 79.5308, operator: "Institute of National Importance · Hanamkonda/Warangal" },
  { id: "univ_pjtsau", name: "Prof. Jayashankar Telangana State Agricultural University (PJTSAU)", category: "University", lat: 17.3227, lon: 78.4143, operator: "Agricultural University · Rajendranagar, Rangareddy" },
  { id: "univ_tu", name: "Telangana University", category: "University", lat: 18.5985, lon: 78.1980, operator: "State Public University · Dichpally, Nizamabad" },
  { id: "univ_mgu", name: "Mahatma Gandhi University", category: "University", lat: 17.0725, lon: 79.2869, operator: "State Public University · Nalgonda" },
  { id: "univ_pu", name: "Palamuru University", category: "University", lat: 16.7582, lon: 78.0124, operator: "State Public University · Mahbubnagar" },
  { id: "univ_su", name: "Satavahana University", category: "University", lat: 18.4316, lon: 79.1045, operator: "State Public University · Karimnagar" },
  { id: "univ_rgukt", name: "RGUKT IIIT Basar", category: "University", lat: 18.8816, lon: 77.9219, operator: "State Technological University · Adilabad/Nirmal" },
  { id: "univ_knruhs", name: "Kaloji Narayana Rao University of Health Sciences", category: "University", lat: 17.9912, lon: 79.5892, operator: "Health Sciences University · Warangal" },
  { id: "univ_nalsar", name: "NALSAR University of Law", category: "University", lat: 17.6119, lon: 78.5540, operator: "National Law University · Shamirpet, Rangareddy" },
  { id: "univ_braou", name: "Dr. B.R. Ambedkar Open University", category: "University", lat: 17.4241, lon: 78.4126, operator: "State Open University · Jubilee Hills, Hyderabad" },
];

function getSectorGis(sector: string): any {
  ensureCoreDataLoaded();
  const normalized = sector.toLowerCase();
  if (sectorGisCache.has(normalized)) {
    return sectorGisCache.get(normalized);
  }
  const validSectors = ["education", "health", "water", "livelihood", "environment"];
  if (validSectors.includes(normalized)) {
    const data = readJsonFile<any>(path.join("gis", `${normalized}_gis.json`));
    let facilities = Array.isArray(data.facilities) ? data.facilities : [];
    if (normalized === "education") {
      const existingNames = new Set(facilities.map((f: any) => String(f.name ?? "").toLowerCase()));
      const additions = TELANGANA_UNIVERSITIES_EXTRA.filter(
        (u) => !existingNames.has(u.name.toLowerCase())
      );
      facilities = [...additions, ...facilities];
    }
    const enriched = {
      ...data,
      facilities,
      total_facilities_statewide:
        normalized === "education"
          ? Math.max(Number(data.total_facilities_statewide ?? 0), facilities.length)
          : data.total_facilities_statewide,
      districts: districtsGeoCache,
    };
    sectorGisCache.set(normalized, enriched);
    return enriched;
  }

  // Overview composite GIS across all 444 Telangana Mandals
  const eduData = readJsonFile<any>(path.join("gis", "education_gis.json"));
  const overviewFeatures = eduData.mandals.features.map((f: any) => {
    const mc = f.properties.mandal_code;
    const mp = mandalsByCode?.[mc] ?? {};
    return {
      type: "Feature",
      properties: {
        mandal_code: mc,
        mandal_name: f.properties.mandal_name,
        district_code: f.properties.district_code,
        district_name: f.properties.district_name,
        area_sq_km: f.properties.area_sq_km,
        village_count: f.properties.village_count,
        sample_village_code: f.properties.sample_village_code,
        overall_score: mp.overall_score ?? f.properties.overall_score,
        vvi_v2: mp.vvi_v2 ?? f.properties.vvi_v2,
        education_score: mp.education_score ?? 50,
        health_score: mp.health_score ?? 50,
        water_score: mp.water_score ?? 50,
        livelihood_score: mp.livelihood_score ?? 50,
        environment_score: mp.environment_score ?? 50,
        tanks_total: mp.tanks_total ?? 0,
      },
      geometry: f.geometry,
    };
  });

  const overviewPayload = {
    sector: "overview",
    state: "Telangana",
    title: "Telangana Multi-Dimensional Composite GIS",
    accent: "#ff9933",
    palette: ["#431407", "#9a3412", "#ea580c", "#f59e0b", "#10b981", "#34d399"],
    default_metric: "overall_score",
    metrics: [
      { key: "overall_score", label: "Composite Development Score (0–100)", unit: "pts" },
      { key: "vvi_v2", label: "Composite Vulnerability Index (VVI)", unit: "pts" },
      { key: "education_score", label: "Education Sector Index", unit: "pts" },
      { key: "health_score", label: "Health & Sanitation Index", unit: "pts" },
      { key: "water_score", label: "Water Security Index", unit: "pts" },
      { key: "livelihood_score", label: "Livelihood & Banking Index", unit: "pts" },
      { key: "environment_score", label: "Environment & Climate Index", unit: "pts" },
    ],
    total_mandals: overviewFeatures.length,
    total_facilities_statewide: 5607,
    facilities: [],
    districts: districtsGeoCache,
    mandals: {
      type: "FeatureCollection",
      features: overviewFeatures,
    },
  };
  sectorGisCache.set("overview", overviewPayload);
  return overviewPayload;
}

function buildFullVillageResponse(v: CompactVillage) {
  ensureCoreDataLoaded();
  const mp = mandalsByCode?.[v.mc] ?? {};
  const pca = mp.pca ?? {};
  const hlpca = mp.hlpca ?? {};
  const climate = mp.climate ?? {};
  const distSummary =
    analyticsSummaryCache?.districts?.find((d: any) => d.district_code === v.dc) ?? {};
  const stateAvg = analyticsSummaryCache?.state_sector_averages ?? {};
  const geometry = getVillageGeometry(v.dc, v.vc);

  const femaleShare = Number(pca.female_share ?? 49.6);
  const malePop = Math.round(v.pop * (1 - femaleShare / 100));
  const femalePop = Math.max(0, v.pop - malePop);
  const childPop = Math.round((v.pop * v.ch06) / 100);
  const scPct = Number(pca.sc_percent ?? 16.5);
  const stPct = Number(pca.st_percent ?? 9.8);
  const scPop = Math.round((v.pop * scPct) / 100);
  const stPop = Math.round((v.pop * stPct) / 100);

  const pop7Plus = Math.max(1, v.pop - childPop);
  const litPop = Math.round((pop7Plus * v.lit) / 100);
  const illitPop = Math.max(0, v.pop - litPop);

  const totWorkers = Math.round((v.pop * v.wpr) / 100);
  const margWorkers = Math.round((totWorkers * v.marg) / 100);
  const mainWorkers = Math.max(0, totWorkers - margWorkers);
  const nonWorkers = Math.max(0, v.pop - totWorkers);

  const tankDensity = Number(((v.tanks / Math.max(0.4, v.area)) * 10).toFixed(2));
  const normativeWaterLiters = Math.round(v.pop * 55);

  return {
    population: {
      state_code: "36 (Telangana · Census 28)",
      district_code: `${v.dc} · ${v.dn}`,
      subdistrict_code: `${v.mc} · ${v.mn}`,
      village_code: v.vc,
      area_name: v.vn,
      mandal_name: v.mn,
      district_name: v.dn,
      tru: v.dc === "06" ? "Urban Ward / Settlement" : "Gram Panchayat / Village",
      households: v.hh,
      total_population: v.pop,
      male_population: malePop,
      female_population: femalePop,
      population_0_6: childPop,
      sc_population: scPop,
      st_population: stPop,
      literate_population: litPop,
      illiterate_population: illitPop,
      literacy_rate: v.lit,
      total_workers: totWorkers,
      main_workers: mainWorkers,
      marginal_workers: margWorkers,
      non_workers: nonWorkers,
      worker_participation_rate: v.wpr,
      marginal_worker_percent: v.marg,
      child_0_6_percent: v.ch06,
    },
    analytics: {
      village_code: v.vc,
      area_name: v.vn,
      district_code: v.dc,
      district_name: v.dn,
      subdistrict_code: v.mc,
      mandal_name: v.mn,
      literacy_rate: v.lit,
      female_literacy_rate: Number(pca.female_literacy_rate ?? (v.lit - 9.2).toFixed(1)),
      male_literacy_rate: Number(pca.male_literacy_rate ?? (v.lit + 9.2).toFixed(1)),
      worker_participation_rate: v.wpr,
      marginal_worker_percent: v.marg,
      female_share: femaleShare,
      sc_percent: scPct,
      st_percent: stPct,
      child_0_6_percent: v.ch06,
      education_score: v.edu_s,
      health_score: v.hea_s,
      water_score: v.wat_s,
      livelihood_score: v.liv_s,
      environment_score: v.env_s,
      overall_score: v.ovr_s,
      education_vulnerability: Number((100 - v.edu_s).toFixed(1)),
      livelihood_vulnerability: Number((100 - v.liv_s).toFixed(1)),
      demographic_vulnerability: Number((v.ch06 * 1.8 + stPct * 0.4).toFixed(1)),
      vulnerability_index: v.vvi,
      vulnerability_level: v.vvi_lvl,
      vvi_v2: v.vvi,
      vvi_v2_level: v.vvi_lvl,
    },
    vulnerability: {
      education_score: v.edu_s,
      health_score: v.hea_s,
      water_score: v.wat_s,
      livelihood_score: v.liv_s,
      environment_score: v.env_s,
      overall_score: v.ovr_s,
      jan_drishti_score: v.ovr_s,
    },
    sectors: {
      education: {
        score: v.edu_s,
        literacy_rate: v.lit,
        female_literacy_rate: Number(pca.female_literacy_rate ?? 52.0),
        gender_literacy_gap: Number(pca.gender_literacy_gap ?? 17.5),
        child_0_6_percent: v.ch06,
        mobile_coverage_pct: Number(hlpca.mobile_coverage_pct ?? 58.0),
        television_pct: Number(hlpca.television_pct ?? 54.0),
        computer_internet_pct: Number(hlpca.computer_internet_pct ?? 1.5),
        computer_total_pct: Number(hlpca.computer_total_pct ?? 6.2),
        nearest_school_km: v.edu_km,
        schools_within_10km: v.edu_10,
        nearest_school_name: v.edu_nm,
      },
      health: {
        score: v.hea_s,
        latrine_within_pct: Number(hlpca.latrine_within_pct ?? 38.0),
        open_defecation_pct: Number(hlpca.open_defecation_pct ?? 58.0),
        bathroom_within_pct: Number(hlpca.bathroom_within_pct ?? 46.0),
        clean_cooking_fuel_pct: Number(hlpca.clean_cooking_fuel_pct ?? 34.0),
        solid_biomass_fuel_pct: Number(hlpca.solid_biomass_fuel_pct ?? 62.0),
        good_housing_pct: Number(hlpca.good_housing_pct ?? 64.0),
        dilapidated_housing_pct: Number(hlpca.dilapidated_housing_pct ?? 4.2),
        closed_drainage_pct: Number(hlpca.closed_drainage_pct ?? 14.0),
        nearest_health_km: v.hea_km,
        health_within_10km: v.hea_10,
        nearest_health_name: v.hea_nm,
      },
      water: {
        score: v.wat_s,
        tap_water_total_pct: Number(hlpca.tap_water_total_pct ?? 56.0),
        treated_tap_pct: Number(hlpca.treated_tap_pct ?? 32.0),
        untreated_tap_pct: Number(hlpca.untreated_tap_pct ?? 24.0),
        borewell_handpump_pct: Number(hlpca.borewell_handpump_pct ?? 34.0),
        water_within_premises_pct: Number(hlpca.water_within_premises_pct ?? 42.0),
        water_near_premises_pct: Number(hlpca.water_near_premises_pct ?? 36.0),
        water_away_pct: Number(hlpca.water_away_pct ?? 22.0),
        tanks_total: v.tanks,
        tanks_gt_40ha: v.tanks_gt40,
        tank_density_per_10sqkm: tankDensity,
        normative_55lpcd_liters_day: normativeWaterLiters,
        nearest_water_km: v.wat_km,
        water_within_10km: v.wat_10,
        nearest_water_name: v.wat_nm,
      },
      livelihood: {
        score: v.liv_s,
        worker_participation_rate: v.wpr,
        marginal_worker_percent: v.marg,
        cultivator_percent: Number(pca.cultivator_percent ?? 28.0),
        agri_labourer_percent: Number(pca.agri_labourer_percent ?? 44.0),
        hh_industry_percent: Number(pca.hh_industry_percent ?? 4.5),
        other_worker_percent: Number(pca.other_worker_percent ?? 23.5),
        banking_access_pct: Number(hlpca.banking_access_pct ?? 52.0),
        two_wheeler_pct: Number(hlpca.two_wheeler_pct ?? 18.0),
        bicycle_pct: Number(hlpca.bicycle_pct ?? 36.0),
        asset_deprivation_pct: Number(hlpca.asset_deprivation_pct ?? 16.0),
        nearest_livelihood_km: v.liv_km,
        livelihood_within_10km: v.liv_10,
        nearest_livelihood_name: v.liv_nm,
      },
      environment: {
        score: v.env_s,
        solid_biomass_fuel_pct: Number(hlpca.solid_biomass_fuel_pct ?? 62.0),
        solar_lighting_pct: Number(hlpca.solar_lighting_pct ?? 0.5),
        electricity_lighting_pct: Number(hlpca.electricity_lighting_pct ?? 89.0),
        kerosene_lighting_pct: Number(hlpca.kerosene_lighting_pct ?? 9.5),
        tanks_total: v.tanks,
        tank_density_per_10sqkm: tankDensity,
        current_temp_c: Number(climate.current_temp_c ?? 31.2),
        forecast_max_temp_c: Number(climate.forecast_max_temp_c ?? 33.0),
        forecast_7d_rain_mm: Number(climate.forecast_7d_rain_mm ?? 8.5),
        avg_solar_radiation_mj_m2: Number(climate.avg_solar_radiation_mj_m2 ?? 16.8),
        pm2_5: Number(climate.pm2_5 ?? 38.5),
        pm10: Number(climate.pm10 ?? 58.0),
        us_aqi: Number(climate.us_aqi ?? 112),
        nearest_env_km: v.env_km,
        env_within_10km: v.env_10,
        nearest_env_name: v.env_nm,
      },
    },
    benchmarks: {
      mandal: {
        name: v.mn,
        education_score: mp.education_score ?? v.edu_s,
        health_score: mp.health_score ?? v.hea_s,
        water_score: mp.water_score ?? v.wat_s,
        livelihood_score: mp.livelihood_score ?? v.liv_s,
        environment_score: mp.environment_score ?? v.env_s,
        overall_score: mp.overall_score ?? v.ovr_s,
      },
      district: {
        name: v.dn,
        education_score: distSummary.education_score ?? 58,
        health_score: distSummary.health_score ?? 52,
        water_score: distSummary.water_score ?? 56,
        livelihood_score: distSummary.livelihood_score ?? 57,
        environment_score: distSummary.environment_score ?? 54,
        overall_score: distSummary.overall_score ?? 55,
      },
      telangana_state: {
        name: "Telangana State",
        education_score: stateAvg.education_score ?? 58.5,
        health_score: stateAvg.health_score ?? 51.8,
        water_score: stateAvg.water_score ?? 56.2,
        livelihood_score: stateAvg.livelihood_score ?? 57.4,
        environment_score: stateAvg.environment_score ?? 53.9,
        overall_score: stateAvg.overall_score ?? 55.6,
        tap_water_total_pct: stateAvg.tap_water_total_pct ?? 58.0,
        latrine_within_pct: stateAvg.latrine_within_pct ?? 39.0,
        clean_cooking_fuel_pct: stateAvg.clean_cooking_fuel_pct ?? 35.0,
        banking_access_pct: stateAvg.banking_access_pct ?? 54.0,
      },
    },
    spatial: {
      available: Boolean(geometry),
      lat: v.lat,
      lon: v.lon,
      area_sq_km: v.area,
      geometry,
    },
  };
}

/* =========================================================
   STRUCTURED GEMINI RESPONSE SCHEMA FOR VILLAGE INTELLIGENCE
========================================================= */

const AGENT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    executive_summary: {
      type: Type.STRING,
      description:
        "2-3 paragraph authoritative synthesis of the selected Telangana village across Education, Health, Water, Livelihood, and Environment citing exact figures and Mandal/District/State benchmarks.",
    },
    reasoning_points: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "5-7 step-by-step analytical deductions linking observed Census HLPCA/PCA indicators, TRACGIS tank hydrology, OpenStreetMap spatial facility reach, and Open-Meteo climate signals.",
    },
    spatial_reasoning: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "3-4 spatial GIS observations on village polygon area, facility travel distances across the 5 sectors, and surface water tank density.",
    },
    development_gaps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          sector: { type: Type.STRING },
          severity: { type: Type.STRING },
          observed_metric: { type: Type.STRING },
          finding: { type: Type.STRING },
        },
        required: ["title", "sector", "severity", "observed_metric", "finding"],
      },
    },
    recommended_actions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          sector: { type: Type.STRING },
          finding: { type: Type.STRING },
          gap: { type: Type.STRING },
          intervention: { type: Type.STRING },
          kpi: { type: Type.STRING },
          horizon: { type: Type.STRING },
        },
        required: ["sector", "finding", "gap", "intervention", "kpi", "horizon"],
      },
    },
    policy_formulation: {
      type: Type.OBJECT,
      properties: {
        charter_title: { type: Type.STRING },
        strategic_summary: { type: Type.STRING },
        scheme_alignments: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              scheme_name: { type: Type.STRING },
              tier: { type: Type.STRING },
              sector: { type: Type.STRING },
              village_rationale: { type: Type.STRING },
              verification_protocol: { type: Type.STRING },
            },
            required: [
              "scheme_name",
              "tier",
              "sector",
              "village_rationale",
              "verification_protocol",
            ],
          },
        },
        phased_roadmap: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              phase: { type: Type.STRING },
              horizon: { type: Type.STRING },
              priority_actions: { type: Type.STRING },
              lead_department: { type: Type.STRING },
              measurable_target: { type: Type.STRING },
            },
            required: [
              "phase",
              "horizon",
              "priority_actions",
              "lead_department",
              "measurable_target",
            ],
          },
        },
        budget_priority_mix: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sector: { type: Type.STRING },
              allocation_percent: { type: Type.NUMBER },
              rationale: { type: Type.STRING },
            },
            required: ["sector", "allocation_percent", "rationale"],
          },
        },
        governance_accountability: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              institution: { type: Type.STRING },
              role: { type: Type.STRING },
              cadence: { type: Type.STRING },
            },
            required: ["institution", "role", "cadence"],
          },
        },
      },
      required: [
        "charter_title",
        "strategic_summary",
        "scheme_alignments",
        "phased_roadmap",
        "budget_priority_mix",
        "governance_accountability",
      ],
    },
    committee_report: {
      type: Type.OBJECT,
      properties: {
        scope_and_baseline: { type: Type.STRING },
        cross_sector_synthesis: { type: Type.STRING },
        future_readiness_outlook: { type: Type.STRING },
        data_limitations_and_field_audits: { type: Type.STRING },
        decisions_requiring_human_signoff: { type: Type.STRING },
      },
      required: [
        "scope_and_baseline",
        "cross_sector_synthesis",
        "future_readiness_outlook",
        "data_limitations_and_field_audits",
        "decisions_requiring_human_signoff",
      ],
    },
  },
  required: [
    "executive_summary",
    "reasoning_points",
    "spatial_reasoning",
    "development_gaps",
    "recommended_actions",
    "policy_formulation",
    "committee_report",
  ],
};

/* =========================================================
   EXPRESS SERVER
========================================================= */

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "8mb" }));

  // Health & Metadata
  app.get(["/api", "/api/", "/api/health"], (_req, res) => {
    try {
      ensureCoreDataLoaded();
      res.json({
        status: "online",
        engine: "JAN-DRISHTI Telangana Development Intelligence",
        state: "Telangana",
        villages: villagesList?.length ?? 0,
        mandals: Object.keys(mandalsByCode ?? {}).length,
        districts: analyticsSummaryCache?.total_districts ?? 10,
        sectors: ["education", "health", "water", "livelihood", "environment"],
      });
    } catch (err) {
      res.status(500).json({
        status: "error",
        error: err instanceof Error ? err.message : "Dataset loading error",
      });
    }
  });

  // Featured Telangana Villages (1 representative settlement per District)
  app.get("/api/villages/featured", (_req, res) => {
    try {
      ensureCoreDataLoaded();
      const seenDistricts = new Set<string>();
      const featured: any[] = [];
      for (const v of villagesList ?? []) {
        if (!seenDistricts.has(v.dc) && v.pop >= 900 && v.tanks >= 1) {
          seenDistricts.add(v.dc);
          featured.push({
            village_code: v.vc,
            area_name: v.vn,
            mandal_name: v.mn,
            district_name: v.dn,
            district_code: v.dc,
            subdistrict_code: v.mc,
            total_population: v.pop,
            literacy_rate: v.lit,
            marginal_worker_percent: v.marg,
            child_0_6_percent: v.ch06,
            overall_score: v.ovr_s,
            vvi_v2: v.vvi,
            vvi_v2_level: v.vvi_lvl,
          });
        }
        if (featured.length >= 10) break;
      }
      res.json({ results: featured });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // Search 11,154 Telangana Villages
  app.get("/api/villages/search", (req, res) => {
    try {
      ensureCoreDataLoaded();
      const q = String(req.query.name ?? "").trim().toLowerCase();
      const districtFilter = String(req.query.district ?? "").trim().toLowerCase();
      const limit = Math.min(40, Math.max(5, Number(req.query.limit ?? 16)));

      if (!q && !districtFilter) {
        res.json({ results: [] });
        return;
      }

      const startsWithMatches: CompactVillage[] = [];
      const containsMatches: CompactVillage[] = [];

      for (const v of villagesList ?? []) {
        if (districtFilter && v.dc.toLowerCase() !== districtFilter && !v.dn.toLowerCase().includes(districtFilter)) {
          continue;
        }
        const vLower = v.vn.toLowerCase();
        const mLower = v.mn.toLowerCase();
        const dLower = v.dn.toLowerCase();
        if (!q || vLower.startsWith(q) || v.vc.startsWith(q)) {
          startsWithMatches.push(v);
        } else if (vLower.includes(q) || mLower.includes(q) || dLower.includes(q)) {
          containsMatches.push(v);
        }
        if (startsWithMatches.length >= limit) break;
      }

      const combined = [...startsWithMatches, ...containsMatches].slice(0, limit);
      res.json({
        results: combined.map((v) => ({
          village_code: v.vc,
          area_name: v.vn,
          mandal_name: v.mn,
          district_name: v.dn,
          district_code: v.dc,
          subdistrict_code: v.mc,
          total_population: v.pop,
          literacy_rate: v.lit,
          marginal_worker_percent: v.marg,
          child_0_6_percent: v.ch06,
          education_score: v.edu_s,
          health_score: v.hea_s,
          water_score: v.wat_s,
          livelihood_score: v.liv_s,
          environment_score: v.env_s,
          overall_score: v.ovr_s,
          vvi_v2: v.vvi,
          vvi_v2_level: v.vvi_lvl,
        })),
      });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // Full 5-Sector Village Dossier
  app.get("/api/villages/:code", (req, res) => {
    try {
      ensureCoreDataLoaded();
      const code = String(req.params.code).trim();
      const village = villagesByCode?.get(code);
      if (!village) {
        res.status(404).json({ error: `Telangana village ${code} not found.` });
        return;
      }
      res.json(buildFullVillageResponse(village));
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // Separate 5-Sector Telangana GIS Layers
  app.get("/api/gis/sector/:sector", (req, res) => {
    try {
      const payload = getSectorGis(req.params.sector);
      res.json(payload);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // Statewide Telangana Insights: Groundwater Observatory, Hospital Capabilities, Waterbodies & Macro Inflation/INR
  app.get("/api/state/insights", (req, res) => {
    try {
      ensureCoreDataLoaded();
      const healthGis = getSectorGis("health");
      const eduGis = getSectorGis("education");
      const waterGis = getSectorGis("water");
      const districtCode = String(req.query.district_code ?? "").trim().padStart(2, "0");

      const districtGroundwater = [
        {
          district_code: "01",
          district_name: "Adilabad",
          pre_monsoon_mbgl: 9.4,
          post_monsoon_mbgl: 4.6,
          fluctuation_m: 4.8,
          stage_of_extraction_pct: 42.5,
          status: "Safe",
          net_availability_mcm: 1420,
          primary_aquifer: "Basalt & Gondwana Sandstone",
          recharge_priority: "Contour trenching, forest-margin check-dams & Godavari tributary percolation",
        },
        {
          district_code: "02",
          district_name: "Nizamabad",
          pre_monsoon_mbgl: 12.8,
          post_monsoon_mbgl: 6.4,
          fluctuation_m: 6.4,
          stage_of_extraction_pct: 71.2,
          status: "Semi-Critical",
          net_availability_mcm: 1185,
          primary_aquifer: "Granite & Fractured Gneiss",
          recharge_priority: "Desiltation of Nizamsagar ayacut feeder tanks & drip irrigation shift",
        },
        {
          district_code: "03",
          district_name: "Karimnagar",
          pre_monsoon_mbgl: 11.2,
          post_monsoon_mbgl: 5.5,
          fluctuation_m: 5.7,
          stage_of_extraction_pct: 64.8,
          status: "Safe",
          net_availability_mcm: 1510,
          primary_aquifer: "Archaean Granite Gneiss",
          recharge_priority: "Kakatiya chain-tank interlinking & SRSP canal seepage capture",
        },
        {
          district_code: "04",
          district_name: "Medak",
          pre_monsoon_mbgl: 16.9,
          post_monsoon_mbgl: 9.8,
          fluctuation_m: 7.1,
          stage_of_extraction_pct: 91.4,
          status: "Critical",
          net_availability_mcm: 940,
          primary_aquifer: "Weathered & Fractured Granite",
          recharge_priority: "Borewell recharge shafts, Manjeera basin check-dams & solar micro-drip",
        },
        {
          district_code: "05",
          district_name: "Hyderabad",
          pre_monsoon_mbgl: 15.6,
          post_monsoon_mbgl: 11.2,
          fluctuation_m: 4.4,
          stage_of_extraction_pct: 98.5,
          status: "Over-Exploited",
          net_availability_mcm: 195,
          primary_aquifer: "Hard-Rock Urban Fractured Granite",
          recharge_priority: "Mandatory rooftop rainwater harvesting, Musi-basin lake revival & greywater reuse",
        },
        {
          district_code: "06",
          district_name: "Rangareddy",
          pre_monsoon_mbgl: 17.8,
          post_monsoon_mbgl: 10.6,
          fluctuation_m: 7.2,
          stage_of_extraction_pct: 94.6,
          status: "Critical",
          net_availability_mcm: 875,
          primary_aquifer: "Deccan Granite & Pegmatite",
          recharge_priority: "Osmansagar/Himayatsagar catchment protection, peri-urban lake desiltation & recharge wells",
        },
        {
          district_code: "07",
          district_name: "Mahbubnagar",
          pre_monsoon_mbgl: 14.9,
          post_monsoon_mbgl: 8.1,
          fluctuation_m: 6.8,
          stage_of_extraction_pct: 83.2,
          status: "Semi-Critical",
          net_availability_mcm: 1290,
          primary_aquifer: "Peninsular Gneissic Complex",
          recharge_priority: "Golusu Kattu chain-tank cascading restoration & drought-resilient millets",
        },
        {
          district_code: "08",
          district_name: "Nalgonda",
          pre_monsoon_mbgl: 13.7,
          post_monsoon_mbgl: 7.2,
          fluctuation_m: 6.5,
          stage_of_extraction_pct: 77.4,
          status: "Semi-Critical",
          net_availability_mcm: 1360,
          primary_aquifer: "Granitic Aquifer (Fluoride-Sensitive)",
          recharge_priority: "Dilution recharge via Mission Kakatiya tanks + treated Mission Bhagiratha potable supply",
        },
        {
          district_code: "09",
          district_name: "Warangal",
          pre_monsoon_mbgl: 10.4,
          post_monsoon_mbgl: 4.9,
          fluctuation_m: 5.5,
          stage_of_extraction_pct: 61.8,
          status: "Safe",
          net_availability_mcm: 1640,
          primary_aquifer: "Granite Gneiss & Pakhal Sediments",
          recharge_priority: "Kakatiya heritage tank bund strengthening & silt organic-manure reuse",
        },
        {
          district_code: "10",
          district_name: "Khammam",
          pre_monsoon_mbgl: 8.2,
          post_monsoon_mbgl: 3.8,
          fluctuation_m: 4.4,
          stage_of_extraction_pct: 38.9,
          status: "Safe",
          net_availability_mcm: 1890,
          primary_aquifer: "Gondwana Alluvium & Archean Gneiss",
          recharge_priority: "Conjunctive Godavari-Kinnerasani tank management & solar feeder optimization",
        },
      ];

      const healthcareTiers = [
        {
          tier: "Tier 1 · Village Screening",
          facility_type: "Palle Dawakhana / Sub-Centre / Clinic",
          serves_what: [
            "Fever, Malaria, Dengue & Diarrhoea rapid screening",
            "Antenatal checkups (ANC), immunization & child growth monitoring",
            "Blood pressure, diabetes NCD screening & essential generic medicines",
          ],
          referral_trigger: "High-risk pregnancy, trauma, or acute respiratory distress referred to Tier 2 CHC.",
          scheme_link: "NHM Telangana · Palle Dawakhana · Poshan 2.0",
        },
        {
          tier: "Tier 2 · Mandal Secondary Care",
          facility_type: "Primary Health Centre (PHC) & Community Health Centre (CHC)",
          serves_what: [
            "24×7 normal & assisted maternal deliveries",
            "Basic laboratory diagnostics, X-ray, snakebite anti-venom & stabilization",
            "Dental, ophthalmology & TB DOTS / IDSP weekly surveillance reporting",
          ],
          referral_trigger: "Surgical emergencies, ICU/NICU & multi-organ cases referred to Tier 3.",
          scheme_link: "Telangana Vaidya Vidhana Parishad (TVVP)",
        },
        {
          tier: "Tier 3 · District & Tertiary Referral",
          facility_type: "District Area Hospital & Empanelled Tertiary Hospitals",
          serves_what: [
            "24×7 Emergency Trauma, ICU, NICU & Blood Bank",
            "Dialysis centres, Cardiology, Oncology & Orthopedic surgery",
            "Cashless tertiary procedures under Rajiv Aarogyasri (₹10 lakh cover)",
          ],
          referral_trigger: "Telemedicine follow-up linked back to village ANM/ASHA.",
          scheme_link: "Rajiv Aarogyasri · Ayushman Bharat PM-JAY · 108 Ambulance",
        },
      ];

      const inflationAndRupee = {
        headline_cpi_pct: 4.85,
        food_inflation_pct: 6.42,
        core_remaining_pct: 3.68,
        fuel_light_pct: 2.15,
        food_drivers: [
          { item: "Vegetables & Perishables", share_pct: 6.0, current_yoy_pct: 11.4, rural_fix: "Village-cluster solar cold storage + FPO direct e-NAM mandis" },
          { item: "Pulses & Protein", share_pct: 2.4, current_yoy_pct: 8.6, rural_fix: "Mandal dal-mill processing & protective irrigation from Kakatiya tanks" },
          { item: "Cereals & Staples", share_pct: 9.7, current_yoy_pct: 5.1, rural_fix: "Tank-fed double cropping & PDS buffer-stock smoothing" },
          { item: "Fuel, Freight & Power", share_pct: 6.8, current_yoy_pct: 2.2, rural_fix: "PM-KUSUM solar pumps cutting diesel irrigation & transport costs" },
        ],
        rupee_appreciation_drivers: [
          {
            lever: "Clean-Energy Import Substitution",
            mechanism: "Solar feeders, EV rural mobility & bio-CNG reduce crude/diesel import outflow, narrowing the Current Account Deficit (CAD).",
            target_2047: "Lower energy import bill strengthens INR structural fundamentals",
          },
          {
            lever: "Agro-Processing & High-Value Exports",
            mechanism: "Moving villages from raw crop distress-selling to FPO grading, millet processing & GI exports raises FX inflows.",
            target_2047: "Boosts rural per-capita income toward Vision 2047 USD 18,000 benchmark",
          },
          {
            lever: "Digital Public Infrastructure (UPI) & Services Surplus",
            mechanism: "Cross-border UPI rails, skilled rural-youth GCC/tech talent & formal banking inclusion deepen domestic capital.",
            target_2047: "Supports stable USD/INR trajectory alongside USD 30T economy scale",
          },
        ],
      };

      res.json({
        groundwater_by_district: districtGroundwater,
        selected_district_groundwater: districtCode
          ? districtGroundwater.find((d) => d.district_code === districtCode) ?? null
          : null,
        healthcare_tiers: healthcareTiers,
        education_facility_counts: (eduGis.facilities ?? []).reduce(
          (acc: Record<string, number>, f: any) => {
            const cat = String(f.category ?? "Other");
            acc[cat] = (acc[cat] ?? 0) + 1;
            return acc;
          },
          {}
        ),
        health_facility_counts: (healthGis.facilities ?? []).reduce(
          (acc: Record<string, number>, f: any) => {
            const cat = String(f.category ?? "Other");
            acc[cat] = (acc[cat] ?? 0) + 1;
            return acc;
          },
          {}
        ),
        water_facility_counts: (waterGis.facilities ?? []).reduce(
          (acc: Record<string, number>, f: any) => {
            const cat = String(f.category ?? "Other");
            acc[cat] = (acc[cat] ?? 0) + 1;
            return acc;
          },
          {}
        ),
        inflation_and_rupee: inflationAndRupee,
      });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // Telangana Village Boundaries GeoJSON (by Mandal, District, or Statewide sample)
  app.get("/api/gis/villages", (req, res) => {
    try {
      ensureCoreDataLoaded();
      const mandalCode = String(req.query.mandal_code ?? "").trim();
      const districtCode = String(req.query.district_code ?? "").trim();
      const limit = Math.min(800, Math.max(20, Number(req.query.limit ?? 350)));

      if (mandalCode) {
        const subset = (villagesList ?? []).filter((v) => v.mc === mandalCode);
        const features = subset.map((v) => ({
          type: "Feature",
          properties: {
            village_code: v.vc,
            area_name: v.vn,
            village_name: v.vn,
            mandal_code: v.mc,
            mandal_name: v.mn,
            district_code: v.dc,
            district_name: v.dn,
            total_population: v.pop,
            literacy_rate: v.lit,
            marginal_worker_percent: v.marg,
            education_score: v.edu_s,
            health_score: v.hea_s,
            water_score: v.wat_s,
            livelihood_score: v.liv_s,
            environment_score: v.env_s,
            overall_score: v.ovr_s,
            vvi_v2: v.vvi,
            vvi_v2_level: v.vvi_lvl,
            tanks_total: v.tanks,
            area_sq_km: v.area,
          },
          geometry: getVillageGeometry(v.dc, v.vc),
        }));
        res.json({ type: "FeatureCollection", features });
        return;
      }

      if (districtCode) {
        const padded = districtCode.padStart(2, "0");
        const subset = (villagesList ?? []).filter((v) => v.dc === padded).slice(0, limit);
        const features = subset.map((v) => ({
          type: "Feature",
          properties: {
            village_code: v.vc,
            area_name: v.vn,
            village_name: v.vn,
            mandal_code: v.mc,
            mandal_name: v.mn,
            district_code: v.dc,
            district_name: v.dn,
            total_population: v.pop,
            literacy_rate: v.lit,
            education_score: v.edu_s,
            health_score: v.hea_s,
            water_score: v.wat_s,
            livelihood_score: v.liv_s,
            environment_score: v.env_s,
            overall_score: v.ovr_s,
            vvi_v2: v.vvi,
            vvi_v2_level: v.vvi_lvl,
            tanks_total: v.tanks,
            area_sq_km: v.area,
          },
          geometry: getVillageGeometry(v.dc, v.vc),
        }));
        res.json({ type: "FeatureCollection", features });
        return;
      }

      // Evenly strided statewide village index with centroids for instant directory/point lookup
      const list = villagesList ?? [];
      const stride = Math.max(1, Math.floor(list.length / limit));
      const sampled = list.filter((_, i) => i % stride === 0).slice(0, limit);
      const features = sampled.map((v) => ({
        type: "Feature",
        properties: {
          village_code: v.vc,
          area_name: v.vn,
          village_name: v.vn,
          mandal_code: v.mc,
          mandal_name: v.mn,
          district_code: v.dc,
          district_name: v.dn,
          total_population: v.pop,
          literacy_rate: v.lit,
          marginal_worker_percent: v.marg,
          education_score: v.edu_s,
          health_score: v.hea_s,
          water_score: v.wat_s,
          livelihood_score: v.liv_s,
          environment_score: v.env_s,
          overall_score: v.ovr_s,
          vvi_v2: v.vvi,
          vvi_v2_level: v.vvi_lvl,
          tanks_total: v.tanks,
          area_sq_km: v.area,
        },
        geometry: {
          type: "Point",
          coordinates: [v.lon, v.lat],
        },
      }));
      res.json({ type: "FeatureCollection", features });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // Statewide & Sector Detailed Analytics + 5-Sector Longitudinal Trends (2011–2026)
  app.get("/api/analytics/summary", (req, res) => {
    try {
      ensureCoreDataLoaded();
      const villageCode = String(req.query.village_code ?? "").trim();
      let villageComparison: any = null;

      const sAvg = analyticsSummaryCache?.state_sector_averages ?? {};
      const clampScore = (val: number) =>
        Number(Math.min(96, Math.max(12, val)).toFixed(1));

      // Telangana State 2011 Census-anchored baseline -> 2026 modelled programme trajectory
      const baseEdu = Number(sAvg.education_score ?? 58.5) - 11.4;
      const baseHea = Number(sAvg.health_score ?? 51.8) - 16.8;
      const baseWat = Number(sAvg.water_score ?? 56.2) - 19.6;
      const baseLiv = Number(sAvg.livelihood_score ?? 57.4) - 12.8;
      const baseEnv = Number(sAvg.environment_score ?? 53.9) - 10.6;

      const milestones = [
        { year: "2011", milestone: "Census PCA & HLPCA Baseline", edu: 0, hea: 0, wat: 0, liv: 0, env: 0 },
        { year: "2014", milestone: "Telangana State Formation", edu: 2.8, hea: 3.6, wat: 4.1, liv: 3.1, env: 2.1 },
        { year: "2017", milestone: "Mission Bhagiratha & Kakatiya Rollout", edu: 6.4, hea: 9.8, wat: 13.4, liv: 6.9, env: 5.4 },
        { year: "2020", milestone: "SHG Credit & Rural Sanitation Push", edu: 9.8, hea: 15.2, wat: 19.8, liv: 10.6, env: 8.3 },
        { year: "2023", milestone: "Mana Ooru–Mana Badi & Palle Dawakhana", edu: 13.6, hea: 19.9, wat: 24.2, liv: 14.8, env: 11.9 },
        { year: "2026", milestone: "Simulated Current / Readiness Horizon", edu: 16.9, hea: 23.8, wat: 27.6, liv: 18.2, env: 15.4 },
      ];

      const stateSeries = milestones.map((m) => {
        const education = clampScore(baseEdu + m.edu);
        const health = clampScore(baseHea + m.hea);
        const water = clampScore(baseWat + m.wat);
        const livelihood = clampScore(baseLiv + m.liv);
        const environment = clampScore(baseEnv + m.env);
        const overall = clampScore(
          (education + health + water + livelihood + environment) / 5
        );
        return {
          year: m.year,
          milestone: m.milestone,
          education,
          health,
          water,
          livelihood,
          environment,
          overall,
        };
      });

      let villageSeries: any[] | null = null;

      if (villageCode && villagesByCode?.has(villageCode)) {
        const v = villagesByCode.get(villageCode)!;
        const full = buildFullVillageResponse(v);
        const list = villagesList ?? [];
        const pctRank = (key: keyof CompactVillage) => {
          const val = Number(v[key]);
          const below = list.filter((item) => Number(item[key]) <= val).length;
          return Math.round((below / Math.max(1, list.length)) * 100);
        };
        villageComparison = {
          village_code: v.vc,
          village_name: v.vn,
          mandal_name: v.mn,
          district_name: v.dn,
          percentiles: {
            education: pctRank("edu_s"),
            health: pctRank("hea_s"),
            water: pctRank("wat_s"),
            livelihood: pctRank("liv_s"),
            environment: pctRank("env_s"),
            overall: pctRank("ovr_s"),
          },
          sectors: full.sectors,
          benchmarks: full.benchmarks,
        };

        // Village-calibrated trajectory factoring spatial reach & tank hydrology
        const reachBoostEdu = v.edu_km <= 3 ? 1.12 : v.edu_km <= 7 ? 1.0 : 0.88;
        const reachBoostHea = v.hea_km <= 4 ? 1.12 : v.hea_km <= 8 ? 1.0 : 0.87;
        const reachBoostWat = v.tanks >= 3 ? 1.15 : v.tanks >= 1 ? 1.04 : 0.9;
        const reachBoostLiv = v.liv_km <= 5 ? 1.1 : 0.94;
        const reachBoostEnv = v.tanks >= 2 ? 1.1 : 0.96;

        const vBaseEdu = v.edu_s - 10.5 * reachBoostEdu;
        const vBaseHea = v.hea_s - 15.4 * reachBoostHea;
        const vBaseWat = v.wat_s - 18.2 * reachBoostWat;
        const vBaseLiv = v.liv_s - 11.8 * reachBoostLiv;
        const vBaseEnv = v.env_s - 9.8 * reachBoostEnv;

        const distBench = full.benchmarks.district;

        villageSeries = milestones.map((m, idx) => {
          const frac = idx / (milestones.length - 1);
          const education = clampScore(vBaseEdu + m.edu * reachBoostEdu);
          const health = clampScore(vBaseHea + m.hea * reachBoostHea);
          const water = clampScore(vBaseWat + m.wat * reachBoostWat);
          const livelihood = clampScore(vBaseLiv + m.liv * reachBoostLiv);
          const environment = clampScore(vBaseEnv + m.env * reachBoostEnv);
          const overall = clampScore(
            (education + health + water + livelihood + environment) / 5
          );
          return {
            year: m.year,
            milestone: m.milestone,
            education,
            health,
            water,
            livelihood,
            environment,
            overall,
            district_education: clampScore(
              Number(distBench.education_score ?? 58) - 11 + 16.5 * frac
            ),
            district_health: clampScore(
              Number(distBench.health_score ?? 52) - 16 + 23.0 * frac
            ),
            district_water: clampScore(
              Number(distBench.water_score ?? 56) - 19 + 26.8 * frac
            ),
            district_livelihood: clampScore(
              Number(distBench.livelihood_score ?? 57) - 12 + 17.8 * frac
            ),
            district_environment: clampScore(
              Number(distBench.environment_score ?? 54) - 10 + 15.0 * frac
            ),
            district_overall: clampScore(
              Number(distBench.overall_score ?? 55) - 13.6 + 19.8 * frac
            ),
          };
        });
      }

      const activeSeries = villageSeries ?? stateSeries;
      const firstPt = activeSeries[0];
      const lastPt = activeSeries[activeSeries.length - 1];
      const sectorGains = [
        {
          sector: "Education",
          key: "education",
          baseline_2011: firstPt.education,
          horizon_2026: lastPt.education,
          delta: Number((lastPt.education - firstPt.education).toFixed(1)),
          color: "#ef4444",
        },
        {
          sector: "Health",
          key: "health",
          baseline_2011: firstPt.health,
          horizon_2026: lastPt.health,
          delta: Number((lastPt.health - firstPt.health).toFixed(1)),
          color: "#10b981",
        },
        {
          sector: "Water",
          key: "water",
          baseline_2011: firstPt.water,
          horizon_2026: lastPt.water,
          delta: Number((lastPt.water - firstPt.water).toFixed(1)),
          color: "#06b6d4",
        },
        {
          sector: "Livelihood",
          key: "livelihood",
          baseline_2011: firstPt.livelihood,
          horizon_2026: lastPt.livelihood,
          delta: Number((lastPt.livelihood - firstPt.livelihood).toFixed(1)),
          color: "#ec4899",
        },
        {
          sector: "Environment",
          key: "environment",
          baseline_2011: firstPt.environment,
          horizon_2026: lastPt.environment,
          delta: Number((lastPt.environment - firstPt.environment).toFixed(1)),
          color: "#84cc16",
        },
      ];

      res.json({
        ...analyticsSummaryCache,
        village_comparison: villageComparison,
        longitudinal_trends: {
          scope: villageComparison
            ? `${villageComparison.village_name} (${villageComparison.mandal_name} Mandal, ${villageComparison.district_name})`
            : "Telangana State Aggregate (444 Mandals · 11,154 Villages)",
          state_series: stateSeries,
          village_series: villageSeries,
          sector_gains: sectorGains,
          methodology_note:
            "2011 anchor values derive from observed Census PCA & HLPCA baselines; 2014–2026 points model sector progress trajectories calibrated to Telangana infrastructure rollouts, TRACGIS tank density, and OpenStreetMap facility proximity.",
        },
      });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // LLM Development Intelligence & Village Policy Formulation Engine
  app.post("/api/ai/agent", async (req, res) => {
    try {
      ensureCoreDataLoaded();
      const { query, village_code } = req.body ?? {};
      if (!village_code) {
        res.status(400).json({
          error: "A Telangana village_code is required to run village-specific intelligence.",
        });
        return;
      }

      const v = villagesByCode?.get(String(village_code).trim());
      if (!v) {
        res.status(404).json({
          error: `Village code ${village_code} was not found in the Telangana village registry.`,
        });
        return;
      }

      const full = buildFullVillageResponse(v);
      const sec = full.sectors;
      const bench = full.benchmarks;

      const ai = getGeminiClient();

      const systemInstruction = `You are the JAN-DRISHTI Development Intelligence & Policy Formulation Engine for Telangana State, India.
Your mandate is to generate rigorous, non-fabricated, spatially grounded multi-sector development analysis and village-specific policy formulations across ALL 5 sectors:
1. Education (SDG 04)
2. Health & Sanitation (SDG 03)
3. Water & Minor Irrigation (SDG 06)
4. Livelihood, Banking & Workforce (SDG 08)
5. Environment, Clean Energy & Climate Action (SDG 13)

CRITICAL EVIDENCE RULES:
- Cite ONLY the exact numbers provided in the Telangana Village Evidence Dossier (Census 2011 HLPCA Mandal indicators, Census 2011 PCA District Rural/Urban baseline, TRACGIS Village Minor Irrigation Tank inventory & polygon area, OpenStreetMap geolocated facility distances, and Open-Meteo District climate/solar/AQI telemetry).
- Compare the village's metrics directly against its Mandal (${v.mn}), District (${v.dn}), and Telangana State benchmarks.
- Formulate concrete, tailored policy options referencing authentic Telangana State & Central Government programmes where relevant (e.g., Mission Bhagiratha for safe drinking water, Mission Kakatiya for minor irrigation tank restoration, Palle Dawakhana / Aarogyasri / Ayushman Arogya Mandir for primary health, Mana Ooru - Mana Badi & Samagra Shiksha for schools, Rythu Bharosa / Rythu Vedika / SERP Stree Nidhi SHGs / MGNREGA for livelihoods, Telangana Ku Haritha Haram / PM-KUSUM solar pumps / Pradhan Mantri Ujjwala clean cooking / SBM-G Phase II greywater & ODF Plus).
- NEVER claim automatic scheme eligibility, sanctioned funds, or administrative approval; frame scheme references as candidate programmes for Gram Sabha, MPDO, and District Collectorate verification.
- Ensure budget_priority_mix contains exactly 5 items (Education, Health, Water, Livelihood, Environment) whose allocation_percent values sum to 100, weighted proportionately to the village's biggest observed gaps.`;

      const evidencePrompt = `USER PLANNING QUERY:
${String(query || "Prepare a comprehensive 5-sector development intelligence review and village-specific policy formulation.")}

TELANGANA VILLAGE EVIDENCE DOSSIER:
- Village: ${v.vn} (Code: ${v.vc}), Mandal: ${v.mn} (${v.mc}), District: ${v.dn} (${v.dc}), State: Telangana
- GIS Spatial Polygon: Area ${v.area} km², Centroid (${v.lat}°N, ${v.lon}°E)
- Demography: Est. Settlement Population ${v.pop.toLocaleString()} (${v.hh.toLocaleString()} households), Children 0-6: ${v.ch06}%, Female share: ${full.analytics.female_share}%, SC: ${full.analytics.sc_percent}%, ST: ${full.analytics.st_percent}%
- Composite Scores (0-100):
  * Overall JAN-DRISHTI Score: ${v.ovr_s} (Telangana Avg: ${bench.telangana_state.overall_score}, ${v.dn} District Avg: ${bench.district.overall_score}, ${v.mn} Mandal Avg: ${bench.mandal.overall_score})
  * Vulnerability Index (VVI v2): ${v.vvi} (${v.vvi_lvl})
  * Education Score: ${v.edu_s} | Health Score: ${v.hea_s} | Water Score: ${v.wat_s} | Livelihood Score: ${v.liv_s} | Environment Score: ${v.env_s}

SECTOR 1 — EDUCATION (SDG 04):
- Effective Literacy Rate: ${sec.education.literacy_rate}% | Female Literacy: ${sec.education.female_literacy_rate}% | Gender Gap: ${sec.education.gender_literacy_gap}%
- Household Digital/Learning Assets (Mandal HLPCA): Mobile Phone ${sec.education.mobile_coverage_pct}%, Television ${sec.education.television_pct}%, Computer/Laptop ${sec.education.computer_total_pct}% (with Internet: ${sec.education.computer_internet_pct}%)
- Spatial School Reach (OSM GIS): Nearest mapped school/college "${sec.education.nearest_school_name}" at ${sec.education.nearest_school_km} km; ${sec.education.schools_within_10km} educational institutions within 10 km.

SECTOR 2 — HEALTH & SANITATION (SDG 03):
- Household Sanitation (Mandal HLPCA): Latrine within premises ${sec.health.latrine_within_pct}% (State avg ${bench.telangana_state.latrine_within_pct}%), Open defecation ${sec.health.open_defecation_pct}%, Bathroom within premises ${sec.health.bathroom_within_pct}%
- Indoor Air & Housing Health: Clean cooking fuel (LPG/PNG/Biogas) ${sec.health.clean_cooking_fuel_pct}% vs Solid biomass smoke exposure ${sec.health.solid_biomass_fuel_pct}%; Good housing ${sec.health.good_housing_pct}%, Dilapidated housing ${sec.health.dilapidated_housing_pct}%; Closed wastewater drainage ${sec.health.closed_drainage_pct}%
- Spatial Health Reach (OSM GIS): Nearest mapped hospital/clinic "${sec.health.nearest_health_name}" at ${sec.health.nearest_health_km} km; ${sec.health.health_within_10km} facilities within 10 km.

SECTOR 3 — WATER & MINOR IRRIGATION (SDG 06):
- Drinking Water Access (Mandal HLPCA): Total Tap Water ${sec.water.tap_water_total_pct}% (Treated Tap ${sec.water.treated_tap_pct}%, Untreated Tap ${sec.water.untreated_tap_pct}%), Borewell/Handpump ${sec.water.borewell_handpump_pct}%
- Source Proximity: Within premises ${sec.water.water_within_premises_pct}%, Near premises ${sec.water.water_near_premises_pct}%, Away ${sec.water.water_away_pct}%
- TRACGIS Village Tank Inventory: ${sec.water.tanks_total} minor irrigation/percolation tanks inside village boundary (${sec.water.tanks_gt_40ha} >40 ha; density ${sec.water.tank_density_per_10sqkm} tanks/10 km²). Normative JJM 55 LPCD baseline: ${sec.water.normative_55lpcd_liters_day.toLocaleString()} L/day.
- Spatial Water Infrastructure (OSM GIS): Nearest mapped reservoir/water-works "${sec.water.nearest_water_name}" at ${sec.water.nearest_water_km} km; ${sec.water.water_within_10km} assets within 10 km.

SECTOR 4 — LIVELIHOOD & FINANCIAL INCLUSION (SDG 08):
- Workforce Structure: Worker Participation Rate ${sec.livelihood.worker_participation_rate}%, Marginal Worker Share ${sec.livelihood.marginal_worker_percent}%, Cultivators ${sec.livelihood.cultivator_percent}%, Agricultural Labourers ${sec.livelihood.agri_labourer_percent}%, Household Industry ${sec.livelihood.hh_industry_percent}%, Other Workers ${sec.livelihood.other_worker_percent}%
- Financial & Mobility Assets (Mandal HLPCA): Banking access ${sec.livelihood.banking_access_pct}% (State avg ${bench.telangana_state.banking_access_pct}%), Two-wheelers ${sec.livelihood.two_wheeler_pct}%, Bicycles ${sec.livelihood.bicycle_pct}%, Asset deprivation (none) ${sec.livelihood.asset_deprivation_pct}%
- Spatial Market/Bank Reach (OSM GIS): Nearest mapped bank/mandi/hub "${sec.livelihood.nearest_livelihood_name}" at ${sec.livelihood.nearest_livelihood_km} km; ${sec.livelihood.livelihood_within_10km} hubs within 10 km.

SECTOR 5 — ENVIRONMENT, CLEAN ENERGY & CLIMATE (SDG 13):
- Clean Energy vs Biomass: Electricity lighting ${sec.environment.electricity_lighting_pct}%, Solar lighting ${sec.environment.solar_lighting_pct}%, Kerosene ${sec.environment.kerosene_lighting_pct}%, Solid biomass cooking pressure ${sec.environment.solid_biomass_fuel_pct}%
- Open-Meteo Live District Telemetry (${v.dn}): Current Temp ${sec.environment.current_temp_c}°C (Forecast Max ${sec.environment.forecast_max_temp_c}°C), 7-Day Forecast Rain ${sec.environment.forecast_7d_rain_mm} mm, Shortwave Solar Potential ${sec.environment.avg_solar_radiation_mj_m2} MJ/m²/day, Ambient PM2.5 ${sec.environment.pm2_5} µg/m³ (US AQI ${sec.environment.us_aqi})
- Spatial Ecological/Solar Assets (OSM GIS): Nearest mapped forest/reserve/solar asset "${sec.environment.nearest_env_name}" at ${sec.environment.nearest_env_km} km.`;

      const llm = await generateVillageIntelligence(
        ai,
        systemInstruction,
        evidencePrompt,
        v,
        full,
        String(query || "")
      );

      // Construct Big Multi-Coloured Interactive Dashboard payload grounded in exact village + benchmark numbers + LLM budget priority mix
      const bigDashboard = {
        village_name: v.vn,
        mandal_name: v.mn,
        district_name: v.dn,
        kpis: [
          {
            label: "Composite Score",
            value: `${v.ovr_s} / 100`,
            delta: `${(v.ovr_s - bench.telangana_state.overall_score) >= 0 ? "+" : ""}${(v.ovr_s - bench.telangana_state.overall_score).toFixed(1)} vs State`,
            sector: "overview",
            color: "#ff9933",
          },
          {
            label: "Education Index",
            value: `${v.edu_s} / 100`,
            delta: `${sec.education.literacy_rate}% Literacy`,
            sector: "education",
            color: "#ef4444",
          },
          {
            label: "Health & Sanitation",
            value: `${v.hea_s} / 100`,
            delta: `${sec.health.latrine_within_pct}% Sanitation`,
            sector: "health",
            color: "#10b981",
          },
          {
            label: "Water Security",
            value: `${v.wat_s} / 100`,
            delta: `${sec.water.tap_water_total_pct}% Tap · ${v.tanks} Tanks`,
            sector: "water",
            color: "#06b6d4",
          },
          {
            label: "Livelihood & Banking",
            value: `${v.liv_s} / 100`,
            delta: `${sec.livelihood.banking_access_pct}% Banked`,
            sector: "livelihood",
            color: "#ec4899",
          },
          {
            label: "Environment & Solar",
            value: `${v.env_s} / 100`,
            delta: `${sec.environment.avg_solar_radiation_mj_m2} MJ/m² Solar`,
            sector: "environment",
            color: "#84cc16",
          },
        ],
        radar_comparison: [
          {
            sector: "Education",
            Village: v.edu_s,
            Mandal: bench.mandal.education_score,
            District: bench.district.education_score,
            Telangana: bench.telangana_state.education_score,
          },
          {
            sector: "Health",
            Village: v.hea_s,
            Mandal: bench.mandal.health_score,
            District: bench.district.health_score,
            Telangana: bench.telangana_state.health_score,
          },
          {
            sector: "Water",
            Village: v.wat_s,
            Mandal: bench.mandal.water_score,
            District: bench.district.water_score,
            Telangana: bench.telangana_state.water_score,
          },
          {
            sector: "Livelihood",
            Village: v.liv_s,
            Mandal: bench.mandal.livelihood_score,
            District: bench.district.livelihood_score,
            Telangana: bench.telangana_state.livelihood_score,
          },
          {
            sector: "Environment",
            Village: v.env_s,
            Mandal: bench.mandal.environment_score,
            District: bench.district.environment_score,
            Telangana: bench.telangana_state.environment_score,
          },
        ],
        household_indicators: [
          { name: "Literacy", Village: sec.education.literacy_rate, Telangana: analyticsSummaryCache?.avg_literacy_rate ?? 66.5, fill: "#ef4444" },
          { name: "Tap Water", Village: sec.water.tap_water_total_pct, Telangana: bench.telangana_state.tap_water_total_pct, fill: "#06b6d4" },
          { name: "Water In-Home", Village: sec.water.water_within_premises_pct, Telangana: analyticsSummaryCache?.state_sector_averages?.water_within_premises_pct ?? 44.0, fill: "#38bdf8" },
          { name: "Sanitation", Village: sec.health.latrine_within_pct, Telangana: bench.telangana_state.latrine_within_pct, fill: "#10b981" },
          { name: "Clean Fuel", Village: sec.health.clean_cooking_fuel_pct, Telangana: bench.telangana_state.clean_cooking_fuel_pct, fill: "#34d399" },
          { name: "Banking", Village: sec.livelihood.banking_access_pct, Telangana: bench.telangana_state.banking_access_pct, fill: "#ec4899" },
          { name: "Telecom", Village: sec.education.mobile_coverage_pct, Telangana: analyticsSummaryCache?.state_sector_averages?.mobile_coverage_pct ?? 62.0, fill: "#f59e0b" },
          { name: "Clean Grid", Village: sec.environment.electricity_lighting_pct, Telangana: 90.2, fill: "#84cc16" },
        ],
        spatial_reach: [
          { sector: "Education", distance_km: v.edu_km, count_10km: v.edu_10, nearest: v.edu_nm, color: "#ef4444" },
          { sector: "Health", distance_km: v.hea_km, count_10km: v.hea_10, nearest: v.hea_nm, color: "#10b981" },
          { sector: "Water", distance_km: v.wat_km, count_10km: v.wat_10, nearest: v.wat_nm, color: "#06b6d4" },
          { sector: "Livelihood", distance_km: v.liv_km, count_10km: v.liv_10, nearest: v.liv_nm, color: "#ec4899" },
          { sector: "Environment", distance_km: v.env_km, count_10km: v.env_10, nearest: v.env_nm, color: "#84cc16" },
        ],
        workforce_mix: [
          { name: "Cultivators", value: sec.livelihood.cultivator_percent, color: "#ec4899" },
          { name: "Agri Labour", value: sec.livelihood.agri_labourer_percent, color: "#f97316" },
          { name: "HH Industry", value: sec.livelihood.hh_industry_percent, color: "#eab308" },
          { name: "Other Services", value: sec.livelihood.other_worker_percent, color: "#06b6d4" },
        ],
        budget_priority_mix: llm.policy_formulation?.budget_priority_mix ?? [],
      };

      const statistics = {
        population: {
          total: v.pop,
          households: v.hh,
          children_0_6_pct: `${v.ch06}%`,
          mandal: v.mn,
          district: v.dn,
        },
        social_indicators: {
          literacy_rate: v.lit,
          female_literacy_rate: sec.education.female_literacy_rate,
          worker_participation: v.wpr,
          marginal_worker_share: `${v.marg}%`,
        },
        water_and_health: {
          tap_water_access: `${sec.water.tap_water_total_pct}%`,
          water_within_premises: `${sec.water.water_within_premises_pct}%`,
          irrigation_tanks: v.tanks,
          latrine_within_premises: `${sec.health.latrine_within_pct}%`,
          clean_cooking_fuel: `${sec.health.clean_cooking_fuel_pct}%`,
        },
        environment_and_livelihood: {
          banking_inclusion: `${sec.livelihood.banking_access_pct}%`,
          solid_biomass_exposure: `${sec.environment.solid_biomass_fuel_pct}%`,
          solar_radiation_mj_m2: sec.environment.avg_solar_radiation_mj_m2,
          ambient_pm2_5: `${sec.environment.pm2_5} µg/m³`,
        },
      };

      const sdgPayload = {
        sdgs: [
          {
            sdg: "SDG 04",
            name: "Quality Education",
            priority: v.edu_s < 52 ? "High" : v.edu_s < 66 ? "Medium" : "Low",
            signal: `Literacy ${v.lit}% (Female ${sec.education.female_literacy_rate}%), Telecom ${sec.education.mobile_coverage_pct}%, nearest school ${v.edu_km} km.`,
          },
          {
            sdg: "SDG 03",
            name: "Good Health & Well-being",
            priority: v.hea_s < 50 ? "High" : v.hea_s < 65 ? "Medium" : "Low",
            signal: `Sanitation ${sec.health.latrine_within_pct}%, Clean fuel ${sec.health.clean_cooking_fuel_pct}%, nearest health facility ${v.hea_km} km.`,
          },
          {
            sdg: "SDG 06",
            name: "Clean Water & Sanitation",
            priority: v.wat_s < 52 ? "High" : v.wat_s < 66 ? "Medium" : "Low",
            signal: `Tap water ${sec.water.tap_water_total_pct}%, In-premises ${sec.water.water_within_premises_pct}%, ${v.tanks} TRACGIS tanks.`,
          },
          {
            sdg: "SDG 08",
            name: "Decent Work & Economic Growth",
            priority: v.liv_s < 52 ? "High" : v.liv_s < 66 ? "Medium" : "Low",
            signal: `WPR ${v.wpr}%, Marginal workers ${v.marg}%, Banking ${sec.livelihood.banking_access_pct}%.`,
          },
          {
            sdg: "SDG 13",
            name: "Climate Action",
            priority: v.env_s < 50 ? "High" : v.env_s < 64 ? "Medium" : "Low",
            signal: `Biomass fuel ${sec.environment.solid_biomass_fuel_pct}%, Solar potential ${sec.environment.avg_solar_radiation_mj_m2} MJ/m², PM2.5 ${sec.environment.pm2_5} µg/m³.`,
          },
        ],
      };

      const riskPayload = {
        model_available: false,
        risk_level: v.vvi_lvl,
        risk_percent: v.vvi,
        indicator_coverage: {
          available: 5,
          required: 5,
          missing_or_invalid: [],
        },
        risk_drivers: {
          education_shortfall: Number(((100 - v.edu_s) / 100).toFixed(3)),
          health_sanitation_gap: Number(((100 - v.hea_s) / 100).toFixed(3)),
          water_security_gap: Number(((100 - v.wat_s) / 100).toFixed(3)),
          livelihood_fragility: Number(((100 - v.liv_s) / 100).toFixed(3)),
          climate_biomass_exposure: Number(((100 - v.env_s) / 100).toFixed(3)),
        },
        indicator_weights: {
          education_shortfall: 0.2,
          health_sanitation_gap: 0.2,
          water_security_gap: 0.2,
          livelihood_fragility: 0.2,
          climate_biomass_exposure: 0.2,
        },
      };

      const gisPayload = {
        available: true,
        state: "Telangana",
        district: v.dn,
        mandal: v.mn,
        area_sq_km: v.area,
        centroid: `${v.lat}°N, ${v.lon}°E`,
        minor_irrigation_tanks: `${v.tanks} mapped tanks (${ tankDensityLabel(v.tanks, v.area) } / 10 km²)`,
        nearest_school: `${v.edu_nm} (${v.edu_km} km)`,
        nearest_healthcare: `${v.hea_nm} (${v.hea_km} km)`,
        nearest_water_asset: `${v.wat_nm} (${v.wat_km} km)`,
        nearest_market_bank: `${v.liv_nm} (${v.liv_km} km)`,
      };

      res.json({
        village_code: v.vc,
        outputs: {
          analysis: {
            data: full,
            statistics,
            ml_risk_screening: riskPayload,
            gis_intelligence: gisPayload,
            sdg_intelligence: sdgPayload,
            development_gaps: llm.development_gaps,
            recommended_actions: llm.recommended_actions,
            dashboard: bigDashboard,
            policy: llm.policy_formulation,
            report: {
              executive_summary: llm.executive_summary,
              content: llm.committee_report,
            },
          },
          reasoning: {
            conclusion: llm.executive_summary,
            reasoning_points: llm.reasoning_points,
            spatial_reasoning: llm.spatial_reasoning,
            decision_chain: [
              {
                stage: "01 · Multi-Sector Evidence Ingestion",
                result: `Loaded ${v.vn} (${v.mn} Mandal, ${v.dn} District) across Census PCA/HLPCA, TRACGIS (${v.area} km², ${v.tanks} tanks), OSM facility reach, and Open-Meteo telemetry.`,
              },
              {
                stage: "02 · Telangana Benchmark Screening",
                result: `Evaluated 5 sector indices (Composite ${v.ovr_s}/100 vs Telangana ${bench.telangana_state.overall_score}/100).`,
              },
              {
                stage: "03 · Gemini LLM Policy Synthesis",
                result: `Formulated village-specific Telangana & Central scheme alignments, 3-horizon roadmap, and budget allocation mix.`,
              },
            ],
          },
          big_dashboard: bigDashboard,
          policy: llm.policy_formulation,
          report: {
            executive_summary: llm.executive_summary,
            content: llm.committee_report,
          },
          development_gaps: llm.development_gaps,
          recommended_actions: llm.recommended_actions,
          gis: gisPayload,
          sdg_alignment: sdgPayload,
          risk_prediction: riskPayload,
        },
      });
    } catch (err) {
      console.error("AI Engine Error:", err);
      res.status(500).json({
        error:
          err instanceof Error
            ? `Gemini Intelligence Engine error: ${err.message}`
            : "Gemini Intelligence Engine encountered an unexpected error.",
      });
    }
  });

  /* =========================================================
     COMMUNITY DEVELOPMENT FACILITY (FULL-STACK PERSISTENT HUB)
  ========================================================= */

  type CommunitySectorKey = "education" | "health" | "water" | "livelihood" | "environment";

  type CommunityResourceNeed = {
    id: string;
    item: string;
    neededQty: number;
    pledgedQty: number;
    unit: string;
    pledgers: string[];
  };

  type CommunityActionRoom = {
    id: string;
    sector: CommunitySectorKey;
    title: string;
    description: string;
    institutionName: string;
    villageName: string;
    districtName: string;
    reporterName: string;
    severity: "Critical" | "High" | "Moderate";
    status: "open" | "mobilizing" | "resolved";
    upvotes: number;
    createdAt: string;
    gpsLabel: string;
    lat: number;
    lon: number;
    voiceTranscript?: string;
    audioDataUrl?: string;
    videoClipLabel?: string;
    beforePhotoUrl?: string;
    afterPhotoUrl?: string;
    peerVerified: boolean;
    verifiedBy?: string;
    adoptedNgo?: string;
    csrMatchStatus?: string;
    needs: CommunityResourceNeed[];
  };

  type CommunityDrive = {
    id: string;
    sector: CommunitySectorKey;
    title: string;
    dateLabel: string;
    timeSlot: string;
    landmark: string;
    organizer: string;
    capacity: number;
    rsvpCount: number;
    joinedByUser: boolean;
  };

  type VolunteerTeachingSlot = {
    id: string;
    schoolName: string;
    subject: string;
    dayTime: string;
    skillLevel: "Beginner-Friendly" | "STEM Graduate" | "Telugu Bilingual";
    slotsOpen: number;
    bookedByUser: boolean;
  };

  type InstitutionWishlist = {
    id: string;
    sector: CommunitySectorKey;
    institution: string;
    item: string;
    needed: number;
    fulfilled: number;
    unit: string;
  };

  type BalMitraCert = {
    id: string;
    studentName: string;
    schoolOrWard: string;
    activity: string;
    sector: CommunitySectorKey;
    parentConsent: boolean;
    issuedAt: string;
    certCode: string;
  };

  type CivicChampionEntry = {
    id: string;
    name: string;
    role: string;
    sector: CommunitySectorKey;
    hours: number;
    badge: string;
    verifiedActions: number;
  };

  type CommunityHubState = {
    issues: CommunityActionRoom[];
    drives: CommunityDrive[];
    volunteerSlots: VolunteerTeachingSlot[];
    wishlists: InstitutionWishlist[];
    certificates: BalMitraCert[];
    champions: CivicChampionEntry[];
    ngoDirectory: { name: string; focus: string; wardReach: string }[];
  };

  const COMMUNITY_STATE_FILE = path.join(DATA_DIR, "community_hub_state.json");

  function createSeedCommunityState(): CommunityHubState {
    return {
      issues: [
        {
          id: "iss-edu-01",
          sector: "education",
          title: "Broken Desk Benches & Missing Science Kit in Upper Primary Wing",
          description: "Class 6–8 rooms need 14 bench repairs and solar study lamps before pre-board remedial camp.",
          institutionName: "ZPHS Siddipet Rural",
          villageName: "Narsapur",
          districtName: "Medak",
          reporterName: "Kavitha Reddy (SMC Parent)",
          severity: "High",
          status: "mobilizing",
          upvotes: 34,
          createdAt: "2026-11-15T09:30:00Z",
          gpsLabel: "17.7824°N, 78.2641°E · Within 1.4 km",
          lat: 17.7824,
          lon: 78.2641,
          voiceTranscript: "పాఠశాలలో బెంచీలు విరిగిపోయాయి, పిల్లలకు వారాంతపు ట్యూషన్ అవసరం.",
          adoptedNgo: "Pratham Deccan Chapter",
          csrMatchStatus: "₹18,000 Hardware Micro-Grant Tagged",
          needs: [
            { id: "n1", item: "Dual Desk Benches (Repair Kits)", neededQty: 14, pledgedQty: 9, unit: "sets", pledgers: ["Youth Club Medak", "Ramesh Carpenter"] },
            { id: "n2", item: "Solar Reading Lamps", neededQty: 20, pledgedQty: 12, unit: "units", pledgers: ["GreenGrid CSR"] },
          ],
          peerVerified: false,
        },
        {
          id: "iss-wat-01",
          sector: "water",
          title: "Feeder Channel Siltation & Main Distribution Valve Leak near Pedda Cheruvu",
          description: "Overflow feeder kula has vegetation blockage reducing percolation recharge alongside a slow gate-valve leak.",
          institutionName: "Pedda Cheruvu & RWS Overhead Tank",
          villageName: "Chinna Shankarampet",
          districtName: "Medak",
          reporterName: "Mallesh Goud (Neeruganti)",
          severity: "Critical",
          status: "resolved",
          upvotes: 58,
          createdAt: "2026-11-10T07:15:00Z",
          gpsLabel: "17.9120°N, 78.3185°E · Within 0.8 km",
          lat: 17.912,
          lon: 78.3185,
          voiceTranscript: "చెరువు తూము వద్ద లీకేజీ అరికట్టి కాలువ పూడిక తీత పూర్తి చేయాలి.",
          adoptedNgo: "Kakatiya Jala Samithi",
          csrMatchStatus: "Gram Sabha Shramdaan + GP Tool Kit Verified",
          needs: [
            { id: "n3", item: "Desiltation Spades & Crowbars", neededQty: 12, pledgedQty: 12, unit: "tools", pledgers: ["Ward 3 Youth Squad"] },
            { id: "n4", item: "HDPE Pipe Gasket Collars", neededQty: 4, pledgedQty: 4, unit: "kits", pledgers: ["Panchayat Water Comm."] },
          ],
          peerVerified: true,
          verifiedBy: "Sarpanch & Ward 3 Peer Audit (52 Residents Verified)",
        },
        {
          id: "iss-hea-01",
          sector: "health",
          title: "Open Greywater Drain Stagnation & Mosquito Breeding Behind Anganwadi-2",
          description: "Post-rain greywater pools behind kitchen shed require soak-pit trenching and lime/larvicide sanitization.",
          institutionName: "Anganwadi Centre 02 · SC Colony",
          villageName: "Gajwel Ward",
          districtName: "Siddipet",
          reporterName: "Lakshmi Bai (ASHA Worker)",
          severity: "Critical",
          status: "open",
          upvotes: 41,
          createdAt: "2026-11-16T08:00:00Z",
          gpsLabel: "17.8542°N, 78.6810°E · Within 0.6 km",
          lat: 17.8542,
          lon: 78.681,
          voiceTranscript: "అంగన్‌వాడీ వెనుక మురుగు నీరు నిలిచి దోమలు పెరుగుతున్నాయి.",
          needs: [
            { id: "n5", item: "Soak-Pit Gravel & Bio-Filter Rings", neededQty: 6, pledgedQty: 2, unit: "rings", pledgers: ["SBM-G Volunteer"] },
            { id: "n6", item: "Bleaching Powder & Larvicide Sprayers", neededQty: 8, pledgedQty: 5, unit: "packs", pledgers: ["PHC Sub-Centre"] },
          ],
          peerVerified: false,
        },
        {
          id: "iss-liv-01",
          sector: "livelihood",
          title: "SHG Turmeric & Millet Value-Add Packaging Hub Needs Solar Dryer Shelves",
          description: "28 women artisans seek direct ONDC/CSR buyer catalogue onboarding and 6 hygienic stainless drying trays.",
          institutionName: "Stree Nidhi SHG Bhavan",
          villageName: "Kamareddy Cluster",
          districtName: "Nizamabad",
          reporterName: "Padma Vani (VAO / VO Leader)",
          severity: "Moderate",
          status: "mobilizing",
          upvotes: 29,
          createdAt: "2026-11-14T11:20:00Z",
          gpsLabel: "18.3204°N, 78.3412°E · Within 2.1 km",
          lat: 18.3204,
          lon: 78.3412,
          adoptedNgo: "Deccan Artisan Collective",
          csrMatchStatus: "Matched with Regional FPO Export Buyer",
          needs: [
            { id: "n7", item: "Food-Grade Drying Trays", neededQty: 10, pledgedQty: 6, unit: "trays", pledgers: ["FPO Cooperative"] },
            { id: "n8", item: "1-Hour E-Commerce Onboarding Mentorship", neededQty: 4, pledgedQty: 2, unit: "sessions", pledgers: ["Hyd Tech Volunteer"] },
          ],
          peerVerified: false,
        },
        {
          id: "iss-env-01",
          sector: "environment",
          title: "Katta Maisamma Tank-Bund Gap: 180 Native Neem & Pongamia Saplings Needed",
          description: "Micro-heat island stretch along East Main Road requires avenue tree-guards and e-waste drop box.",
          institutionName: "East Bund Green Belt",
          villageName: "Nalgonda Rural",
          districtName: "Nalgonda",
          reporterName: "Srinivas Rao (Eco Club Teacher)",
          severity: "Moderate",
          status: "open",
          upvotes: 24,
          createdAt: "2026-11-16T14:10:00Z",
          gpsLabel: "17.0575°N, 79.2684°E · Within 1.9 km",
          lat: 17.0575,
          lon: 79.2684,
          needs: [
            { id: "n9", item: "Native Neem / Jamun Saplings", neededQty: 180, pledgedQty: 110, unit: "saplings", pledgers: ["Haritha Nursery", "Eco Squad"] },
            { id: "n10", item: "Bamboo Tree Guards", neededQty: 90, pledgedQty: 45, unit: "guards", pledgers: ["Rotary Rural Wing"] },
          ],
          peerVerified: false,
        },
      ],
      drives: [
        {
          id: "drv-01",
          sector: "water",
          title: "Sunday Kakatiya Tank Bund Desiltation & RWH Pit Shramdaan",
          dateLabel: "Sun, 22 Nov 2026",
          timeSlot: "06:30 AM – 09:30 AM",
          landmark: "Pedda Cheruvu Weir Gate, Narsapur",
          organizer: "Gram Sabha Water Committee + NSS",
          capacity: 45,
          rsvpCount: 31,
          joinedByUser: false,
        },
        {
          id: "drv-02",
          sector: "education",
          title: "Weekend STEM Toy Lab & Digital Literacy Camp for ZPHS Class 7–9",
          dateLabel: "Sat, 21 Nov 2026",
          timeSlot: "10:00 AM – 01:00 PM",
          landmark: "ZPHS Library Hall, Mandal HQ",
          organizer: "Yuva Vidya Kendra",
          capacity: 20,
          rsvpCount: 14,
          joinedByUser: false,
        },
        {
          id: "drv-03",
          sector: "health",
          title: "Ward-Wide Cleanliness, Anti-Vector Fogging & Nutrition Screening Drive",
          dateLabel: "Sun, 29 Nov 2026",
          timeSlot: "07:00 AM – 10:30 AM",
          landmark: "Anganwadi-2 & Palle Dawakhana",
          organizer: "ASHA & Red Cross Volunteers",
          capacity: 35,
          rsvpCount: 22,
          joinedByUser: false,
        },
        {
          id: "drv-04",
          sector: "environment",
          title: "E-Waste Drop-Off & 200-Sapling Geo-Tagged Avenue Plantation",
          dateLabel: "Sat, 28 Nov 2026",
          timeSlot: "07:30 AM – 10:30 AM",
          landmark: "Panchayat Bhavan East Bund",
          organizer: "Bal Mitra Eco Squad",
          capacity: 50,
          rsvpCount: 27,
          joinedByUser: false,
        },
      ],
      volunteerSlots: [
        {
          id: "vs-01",
          schoolName: "ZPHS Narsapur",
          subject: "Mathematics & Science Experiments",
          dayTime: "Saturday · 10:00 – 11:00 AM",
          skillLevel: "STEM Graduate",
          slotsOpen: 3,
          bookedByUser: false,
        },
        {
          id: "vs-02",
          schoolName: "MPPS SC Colony School",
          subject: "Telugu Phonics & Reading Circle",
          dayTime: "Sunday · 09:30 – 10:30 AM",
          skillLevel: "Telugu Bilingual",
          slotsOpen: 4,
          bookedByUser: false,
        },
        {
          id: "vs-03",
          schoolName: "KGBV Girls Residential High School",
          subject: "Spoken English & Career Guidance",
          dayTime: "Saturday · 03:00 – 04:00 PM",
          skillLevel: "Beginner-Friendly",
          slotsOpen: 2,
          bookedByUser: false,
        },
      ],
      wishlists: [
        { id: "wl-01", sector: "education", institution: "ZPHS Narsapur Library", item: "Telugu & English Illustrated Storybooks", needed: 80, fulfilled: 54, unit: "books" },
        { id: "wl-02", sector: "education", institution: "MPPS Digital Corner", item: "Solar Study Lamps for Girl Students", needed: 30, fulfilled: 21, unit: "lamps" },
        { id: "wl-03", sector: "health", institution: "Palle Dawakhana Booth", item: "Pediatric Pulse Oximeters & Nutrition Kits", needed: 25, fulfilled: 18, unit: "kits" },
        { id: "wl-04", sector: "water", institution: "Ward 4 Drinking Stand", item: "Terracotta Cooling Vessels & Filters", needed: 12, fulfilled: 8, unit: "sets" },
      ],
      certificates: [
        {
          id: "bm-01",
          studentName: "Ananya Verma (Class 7)",
          schoolOrWard: "ZPHS Narsapur · Ward 2",
          activity: "Tree-Tagging & Cleanliness Rally",
          sector: "environment",
          parentConsent: true,
          issuedAt: "2026-11-12",
          certCode: "JD-JCC-2026-0412",
        },
      ],
      champions: [
        { id: "ch-01", name: "Kavitha Reddy", role: "SMC Parent Lead", sector: "education", hours: 18, badge: "Vidya Mitra Gold", verifiedActions: 6 },
        { id: "ch-02", name: "Mallesh Goud", role: "Neeruganti Steward", sector: "water", hours: 32, badge: "Jala Rakshak", verifiedActions: 11 },
        { id: "ch-03", name: "Lakshmi Bai", role: "ASHA Community Lead", sector: "health", hours: 24, badge: "Swachh Warrior", verifiedActions: 9 },
        { id: "ch-04", name: "Padma Vani", role: "SERP SHG Mentor", sector: "livelihood", hours: 15, badge: "Shreni Catalyst", verifiedActions: 5 },
      ],
      ngoDirectory: [
        { name: "Pratham Deccan Chapter", focus: "Education · Foundational Literacy", wardReach: "18 Mandals" },
        { name: "Kakatiya Jala Samithi", focus: "Water · Chain-Tank Revival", wardReach: "32 Villages" },
        { name: "Deccan Artisan Collective", focus: "Livelihood · SHG & FPO Links", wardReach: "14 Clusters" },
        { name: "Telangana Green Youth Network", focus: "Environment · Native Groves & E-Waste", wardReach: "27 Wards" },
      ],
    };
  }

  let communityCache: CommunityHubState | null = null;

  function getCommunityState(): CommunityHubState {
    if (communityCache) return communityCache;
    try {
      if (fs.existsSync(COMMUNITY_STATE_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(COMMUNITY_STATE_FILE, "utf8")) as CommunityHubState;
        if (parsed && Array.isArray(parsed.issues)) {
          communityCache = parsed;
          return communityCache;
        }
      }
    } catch (err) {
      console.warn("Community state load fallback to seed:", err);
    }
    communityCache = createSeedCommunityState();
    saveCommunityState(communityCache);
    return communityCache;
  }

  function saveCommunityState(state: CommunityHubState) {
    communityCache = state;
    try {
      fs.writeFileSync(COMMUNITY_STATE_FILE, JSON.stringify(state, null, 2), "utf8");
    } catch {
      // Non-fatal in read-only sandbox environments; kept in-memory
    }
  }

  app.get("/api/community/state", (_req, res) => {
    res.json(getCommunityState());
  });

  app.post("/api/community/issues", (req, res) => {
    const state = getCommunityState();
    const b = req.body ?? {};
    const sector: CommunitySectorKey = ["education", "health", "water", "livelihood", "environment"].includes(b.sector)
      ? b.sector
      : "water";
    const newIssue: CommunityActionRoom = {
      id: `iss-${Date.now()}`,
      sector,
      title: String(b.title || "Citizen Field Gap Report").slice(0, 140),
      description: String(b.description || "Verified multi-modal citizen report from ward capture.").slice(0, 500),
      institutionName: String(b.institutionName || "Village Public Asset").slice(0, 120),
      villageName: String(b.villageName || "Telangana Ward").slice(0, 80),
      districtName: String(b.districtName || "Telangana").slice(0, 80),
      reporterName: String(b.reporterName || "Citizen Volunteer").slice(0, 80),
      severity: ["Critical", "High", "Moderate"].includes(b.severity) ? b.severity : "High",
      status: "open",
      upvotes: 1,
      createdAt: new Date().toISOString(),
      gpsLabel: String(b.gpsLabel || "17.78°N, 78.26°E · Hyperlocal Pin"),
      lat: Number(b.lat) || 17.78,
      lon: Number(b.lon) || 78.26,
      voiceTranscript: b.voiceTranscript ? String(b.voiceTranscript).slice(0, 300) : undefined,
      audioDataUrl: typeof b.audioDataUrl === "string" ? b.audioDataUrl : undefined,
      videoClipLabel: b.videoClipLabel ? String(b.videoClipLabel).slice(0, 100) : undefined,
      beforePhotoUrl: typeof b.beforePhotoUrl === "string" ? b.beforePhotoUrl : undefined,
      peerVerified: false,
      needs: Array.isArray(b.needs) && b.needs.length > 0
        ? b.needs
        : [
            {
              id: `n-${Date.now()}`,
              item: sector === "education" ? "Classroom Supplies & Mentor Hours" : sector === "water" ? "Pipe Collar & Shramdaan Tools" : "Community Mobilization Kit",
              neededQty: 6,
              pledgedQty: 0,
              unit: "units",
              pledgers: [],
            },
          ],
    };
    state.issues.unshift(newIssue);
    saveCommunityState(state);
    res.status(201).json({ issue: newIssue, state });
  });

  app.post("/api/community/issues/:id/upvote", (req, res) => {
    const state = getCommunityState();
    const issue = state.issues.find((i) => i.id === req.params.id);
    if (!issue) return res.status(404).json({ error: "Issue not found" });
    issue.upvotes += 1;
    saveCommunityState(state);
    res.json({ issue, state });
  });

  app.post("/api/community/issues/:id/adopt", (req, res) => {
    const state = getCommunityState();
    const issue = state.issues.find((i) => i.id === req.params.id);
    if (!issue) return res.status(404).json({ error: "Issue not found" });
    const ngo = String(req.body?.ngoName || "Pratham Deccan Chapter");
    issue.adoptedNgo = ngo;
    issue.csrMatchStatus = "CSR / Institutional Adoption Active";
    if (issue.status === "open") issue.status = "mobilizing";
    saveCommunityState(state);
    res.json({ issue, state });
  });

  app.post("/api/community/issues/:id/pledge", (req, res) => {
    const state = getCommunityState();
    const issue = state.issues.find((i) => i.id === req.params.id);
    if (!issue) return res.status(404).json({ error: "Issue not found" });
    const needId = String(req.body?.needId || "");
    const pledger = String(req.body?.pledgerName || "Community Citizen");
    const need = issue.needs.find((n) => n.id === needId) ?? issue.needs[0];
    if (need) {
      need.pledgedQty = Math.min(need.neededQty, need.pledgedQty + 1);
      if (!need.pledgers.includes(pledger)) need.pledgers.push(pledger);
      if (issue.status === "open") issue.status = "mobilizing";
    }
    saveCommunityState(state);
    res.json({ issue, state });
  });

  app.post("/api/community/issues/:id/resolve", (req, res) => {
    const state = getCommunityState();
    const issue = state.issues.find((i) => i.id === req.params.id);
    if (!issue) return res.status(404).json({ error: "Issue not found" });
    const verifier = String(req.body?.verifierName || "Neighborhood Peer Audit");
    issue.status = "resolved";
    issue.peerVerified = Boolean(req.body?.peerVerified ?? true);
    issue.verifiedBy = `${verifier} · Verified`;
    if (typeof req.body?.afterPhotoUrl === "string") {
      issue.afterPhotoUrl = req.body.afterPhotoUrl;
    }
    const champ = state.champions.find((c) => c.name === verifier);
    if (champ) {
      champ.hours += 4;
      champ.verifiedActions += 1;
    } else {
      state.champions.unshift({
        id: `ch-${Date.now()}`,
        name: verifier,
        role: "Verified Citizen Steward",
        sector: issue.sector,
        hours: 4,
        badge: "Shramdaan Verifier",
        verifiedActions: 1,
      });
    }
    saveCommunityState(state);
    res.json({ issue, state });
  });

  app.post("/api/community/drives", (req, res) => {
    const state = getCommunityState();
    const b = req.body ?? {};
    const sector: CommunitySectorKey = ["education", "health", "water", "livelihood", "environment"].includes(b.sector)
      ? b.sector
      : "water";
    const drv: CommunityDrive = {
      id: `drv-${Date.now()}`,
      sector,
      title: String(b.title || "Weekend Shramdaan Drive").slice(0, 120),
      dateLabel: String(b.dateLabel || "Sun, 06 Dec 2026"),
      timeSlot: String(b.timeSlot || "07:00 AM – 09:30 AM"),
      landmark: String(b.landmark || "Gram Panchayat Kendra"),
      organizer: String(b.organizer || "Citizen Action Group"),
      capacity: Math.max(5, Number(b.capacity) || 30),
      rsvpCount: 1,
      joinedByUser: true,
    };
    state.drives.unshift(drv);
    saveCommunityState(state);
    res.status(201).json({ drive: drv, state });
  });

  app.post("/api/community/drives/:id/rsvp", (req, res) => {
    const state = getCommunityState();
    const drv = state.drives.find((d) => d.id === req.params.id);
    if (!drv) return res.status(404).json({ error: "Drive not found" });
    drv.joinedByUser = !drv.joinedByUser;
    drv.rsvpCount = Math.max(0, drv.rsvpCount + (drv.joinedByUser ? 1 : -1));
    saveCommunityState(state);
    res.json({ drive: drv, state });
  });

  app.post("/api/community/volunteer-slots/:id/book", (req, res) => {
    const state = getCommunityState();
    const slot = state.volunteerSlots.find((s) => s.id === req.params.id);
    if (!slot) return res.status(404).json({ error: "Slot not found" });
    if (!slot.bookedByUser && slot.slotsOpen > 0) {
      slot.bookedByUser = true;
      slot.slotsOpen -= 1;
    } else if (slot.bookedByUser) {
      slot.bookedByUser = false;
      slot.slotsOpen += 1;
    }
    saveCommunityState(state);
    res.json({ slot, state });
  });

  app.post("/api/community/wishlist/:id/pledge", (req, res) => {
    const state = getCommunityState();
    const item = state.wishlists.find((w) => w.id === req.params.id);
    if (!item) return res.status(404).json({ error: "Wishlist item not found" });
    item.fulfilled = Math.min(item.needed, item.fulfilled + 1);
    saveCommunityState(state);
    res.json({ item, state });
  });

  app.post("/api/community/bal-mitra", (req, res) => {
    const state = getCommunityState();
    const b = req.body ?? {};
    const sector: CommunitySectorKey = ["education", "health", "water", "livelihood", "environment"].includes(b.sector)
      ? b.sector
      : "environment";
    const cert: BalMitraCert = {
      id: `bm-${Date.now()}`,
      studentName: String(b.studentName || "Young Civic Champion").slice(0, 80),
      schoolOrWard: String(b.schoolOrWard || "Village School").slice(0, 80),
      activity: String(b.activity || "Wall Painting & Tree-Tagging").slice(0, 100),
      sector,
      parentConsent: Boolean(b.parentConsent),
      issuedAt: new Date().toISOString().slice(0, 10),
      certCode: `JD-JCC-${new Date().getFullYear()}-${String(1000 + state.certificates.length + 1)}`,
    };
    state.certificates.unshift(cert);
    state.champions.unshift({
      id: `ch-bm-${Date.now()}`,
      name: cert.studentName,
      role: "Bal Mitra / Yuva Squad",
      sector,
      hours: 2,
      badge: "Junior Civic Champion",
      verifiedActions: 1,
    });
    saveCommunityState(state);
    res.status(201).json({ certificate: cert, state });
  });

  // Return JSON 404 for unknown /api/* routes instead of SPA HTML
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
  });

  // Serve pre-built dist/ in Production / Render; use Vite Middleware in local dev
  const distPath = fs.existsSync(path.join(process.cwd(), "dist", "index.html"))
    ? path.join(process.cwd(), "dist")
    : path.join(__dirname, "dist");
  const shouldServeStaticDist =
    (process.env.NODE_ENV === "production" || Boolean(process.env.RENDER)) &&
    fs.existsSync(path.join(distPath, "index.html"));

  if (shouldServeStaticDist) {
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`JAN-DRISHTI Telangana Server running on http://0.0.0.0:${PORT}`);
  });
}

function tankDensityLabel(tanks: number, area: number): string {
  return ((tanks / Math.max(0.4, area)) * 10).toFixed(1);
}

function cleanJsonString(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }
  return trimmed;
}

async function generateVillageIntelligence(
  ai: GoogleGenAI | null,
  systemInstruction: string,
  evidencePrompt: string,
  v: CompactVillage,
  full: ReturnType<typeof buildFullVillageResponse>,
  userQuery: string
): Promise<any> {
  if (!ai) {
    return buildDeterministicTelanganaSynthesis(v, full, userQuery);
  }

  // Ordered cascade of Gemini models for fast, schema-locked JSON policy synthesis
  const candidateModels = [
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
    "gemini-flash-latest",
  ];

  let lastError: unknown = null;

  for (const modelName of candidateModels) {
    try {
      const llmResponse = await ai.models.generateContent({
        model: modelName,
        contents: evidencePrompt,
        config: {
          systemInstruction,
          temperature: 0.35,
          thinkingConfig: {
            thinkingLevel:
              modelName === "gemini-3.1-flash-lite"
                ? ThinkingLevel.MINIMAL
                : ThinkingLevel.LOW,
          },
          responseMimeType: "application/json",
          responseSchema: AGENT_RESPONSE_SCHEMA,
        },
      });

      const rawText = llmResponse.text;
      if (!rawText) {
        throw new Error(`Empty response from ${modelName}`);
      }
      const parsed = JSON.parse(cleanJsonString(rawText));
      if (parsed && parsed.executive_summary && parsed.policy_formulation) {
        return parsed;
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err?.message ?? err ?? "");
      const status = Number(err?.status ?? 0);
      if (
        status === 401 ||
        status === 403 ||
        errMsg.includes("API_KEY_INVALID") ||
        errMsg.includes("PERMISSION_DENIED")
      ) {
        console.warn(
          "[JAN-DRISHTI AI] Invalid or unauthorized GEMINI_API_KEY; serving deterministic Telangana evidence synthesis."
        );
        return buildDeterministicTelanganaSynthesis(v, full, userQuery);
      }
      console.warn(
        `[JAN-DRISHTI AI] Model ${modelName} unavailable (${status || "transient"}): ${errMsg.slice(0, 140)} — trying next model...`
      );
    }
  }

  // If all upstream LLM models hit transient 503 UNAVAILABLE / 429 capacity spikes, synthesize directly from the verified Telangana dossier
  const lastMsg = String((lastError as any)?.message ?? lastError ?? "");
  if (
    lastMsg.includes("503") ||
    lastMsg.includes("UNAVAILABLE") ||
    lastMsg.includes("429") ||
    lastMsg.includes("RESOURCE_EXHAUSTED") ||
    lastMsg.includes("timeout") ||
    lastMsg.includes("Timeout") ||
    lastMsg.includes("fetch")
  ) {
    console.warn(
      `[JAN-DRISHTI AI] All Gemini models reported transient 503/429 demand spike; serving deterministic Telangana evidence synthesis for ${v.vn} (${v.vc}).`
    );
    return buildDeterministicTelanganaSynthesis(v, full, userQuery);
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Gemini Intelligence Engine encountered an unexpected error.");
}

function buildDeterministicTelanganaSynthesis(
  v: CompactVillage,
  full: ReturnType<typeof buildFullVillageResponse>,
  userQuery: string
) {
  const sec = full.sectors;
  const bench = full.benchmarks;

  // Compute proportional budget weights inversely proportional to sector scores
  const deficits = [
    { sector: "Education", raw: Math.max(10, 100 - v.edu_s), rationale: `Address ${sec.education.literacy_rate}% literacy (female ${sec.education.female_literacy_rate}%) and digital learning gap (${sec.education.computer_internet_pct}% internet).` },
    { sector: "Health", raw: Math.max(10, 100 - v.hea_s), rationale: `Expand household sanitation from ${sec.health.latrine_within_pct}% and reduce ${sec.health.solid_biomass_fuel_pct}% solid-biomass indoor smoke exposure.` },
    { sector: "Water", raw: Math.max(10, 100 - v.wat_s), rationale: `Upgrade ${sec.water.tap_water_total_pct}% tap coverage (${sec.water.water_within_premises_pct}% in-premises) and desilt ${v.tanks} TRACGIS minor irrigation tanks.` },
    { sector: "Livelihood", raw: Math.max(10, 100 - v.liv_s), rationale: `Stabilize ${sec.livelihood.marginal_worker_percent}% marginal workforce share and expand ${sec.livelihood.banking_access_pct}% household banking inclusion.` },
    { sector: "Environment", raw: Math.max(10, 100 - v.env_s), rationale: `Harness ${sec.environment.avg_solar_radiation_mj_m2} MJ/m²/day solar radiation while mitigating ${sec.environment.pm2_5} µg/m³ PM2.5 and biomass pressure.` },
  ];
  const totalDeficit = deficits.reduce((acc, d) => acc + d.raw, 0);
  let allocatedSum = 0;
  const budgetMix = deficits.map((d, idx) => {
    if (idx === deficits.length - 1) {
      return {
        sector: d.sector,
        allocation_percent: Math.max(5, 100 - allocatedSum),
        rationale: d.rationale,
      };
    }
    const pct = Math.max(8, Math.round((d.raw / totalDeficit) * 100));
    allocatedSum += pct;
    return {
      sector: d.sector,
      allocation_percent: pct,
      rationale: d.rationale,
    };
  });

  return {
    executive_summary: `${v.vn} (${v.mn} Mandal, ${v.dn} District, Telangana; Village Code ${v.vc}) encompasses ${v.area} km² with an estimated ${v.pop.toLocaleString()} residents across ${v.hh.toLocaleString()} households. Its composite JAN-DRISHTI score stands at ${v.ovr_s}/100 against the ${v.mn} Mandal benchmark (${bench.mandal.overall_score}/100), ${v.dn} District benchmark (${bench.district.overall_score}/100), and Telangana State benchmark (${bench.telangana_state.overall_score}/100), placing the settlement in the ${v.vvi_lvl} vulnerability band (VVI ${v.vvi}). Across the 5 sectors, observed evidence highlights tap-water access at ${sec.water.tap_water_total_pct}% alongside ${v.tanks} mapped TRACGIS minor irrigation tanks, household sanitation at ${sec.health.latrine_within_pct}%, effective literacy at ${sec.education.literacy_rate}%, banking reach at ${sec.livelihood.banking_access_pct}%, and solar insolation of ${sec.environment.avg_solar_radiation_mj_m2} MJ/m²/day.`,
    reasoning_points: [
      `Demography & Education: Effective literacy in ${v.vn} is ${sec.education.literacy_rate}% (female literacy ${sec.education.female_literacy_rate}%, gender gap ${sec.education.gender_literacy_gap}%), with ${v.ch06}% children aged 0–6 requiring Anganwadi and foundational schooling linkages.`,
      `Health & Indoor Air: In-premises latrine coverage is ${sec.health.latrine_within_pct}% (Telangana avg ${bench.telangana_state.latrine_within_pct}%), while ${sec.health.solid_biomass_fuel_pct}% of Mandal households rely on solid biomass fuel compared to ${sec.health.clean_cooking_fuel_pct}% clean LPG/biogas.`,
      `Water & Surface Hydrology: ${sec.water.tap_water_total_pct}% of households access tap water (${sec.water.treated_tap_pct}% treated; ${sec.water.water_within_premises_pct}% within premises), supported spatially by ${v.tanks} TRACGIS tanks (${sec.water.tank_density_per_10sqkm} tanks/10 km²) against a normative 55 LPCD demand of ${sec.water.normative_55lpcd_liters_day.toLocaleString()} L/day.`,
      `Livelihood & Financial Inclusion: Worker participation is ${sec.livelihood.worker_participation_rate}% with ${sec.livelihood.marginal_worker_percent}% marginal employment (${sec.livelihood.agri_labourer_percent}% agri-labourers, ${sec.livelihood.cultivator_percent}% cultivators) and ${sec.livelihood.banking_access_pct}% formal banking penetration.`,
      `Environment & Climate Telemetry: ${v.dn} District records ${sec.environment.current_temp_c}°C current temperature, ${sec.environment.forecast_7d_rain_mm} mm 7-day forecast rainfall, ${sec.environment.avg_solar_radiation_mj_m2} MJ/m²/day solar potential, and ${sec.environment.pm2_5} µg/m³ PM2.5 (US AQI ${sec.environment.us_aqi}).`,
    ],
    spatial_reasoning: [
      `Polygon & Surface Tanks: ${v.vn} spans ${v.area} km² centered at (${v.lat}°N, ${v.lon}°E) with ${v.tanks} mapped percolation/irrigation tanks inside the settlement boundary.`,
      `Social Infrastructure Reach: Nearest mapped educational facility "${v.edu_nm}" is ${v.edu_km} km away (${v.edu_10} within 10 km); nearest healthcare facility "${v.hea_nm}" is ${v.hea_km} km away (${v.hea_10} within 10 km).`,
      `Economic & Water Asset Reach: Nearest water infrastructure "${v.wat_nm}" is at ${v.wat_km} km and nearest banking/market hub "${v.liv_nm}" is at ${v.liv_km} km (${v.liv_10} hubs within 10 km).`,
    ],
    development_gaps: [
      {
        title: "Household Sanitation & Greywater Drainage Deficit",
        sector: "Health",
        severity: v.hea_s < 52 ? "High" : "Medium",
        observed_metric: `${sec.health.latrine_within_pct}% latrine within premises · ${sec.health.closed_drainage_pct}% closed drainage`,
        finding: `Open-defecation exposure (${sec.health.open_defecation_pct}%) and limited closed wastewater drainage (${sec.health.closed_drainage_pct}%) elevate enteric and vector-borne health risk.`,
      },
      {
        title: "In-Premises Treated Drinking Water Gap",
        sector: "Water",
        severity: v.wat_s < 54 ? "High" : "Medium",
        observed_metric: `${sec.water.treated_tap_pct}% treated tap · ${sec.water.water_away_pct}% fetching water away`,
        finding: `While overall tap reach is ${sec.water.tap_water_total_pct}%, ${sec.water.water_away_pct}% of households still fetch water away from premises.`,
      },
      {
        title: "Female Literacy & Digital Learning Divide",
        sector: "Education",
        severity: v.edu_s < 54 ? "High" : "Medium",
        observed_metric: `${sec.education.literacy_rate}% literacy · ${sec.education.gender_literacy_gap}% gender gap`,
        finding: `Female literacy (${sec.education.female_literacy_rate}%) trails male literacy by ${sec.education.gender_literacy_gap} percentage points, compounded by ${sec.education.computer_internet_pct}% household internet reach.`,
      },
      {
        title: "Marginal Workforce Seasonality & Credit Reach",
        sector: "Livelihood",
        severity: v.liv_s < 54 ? "High" : "Medium",
        observed_metric: `${sec.livelihood.marginal_worker_percent}% marginal workers · ${sec.livelihood.banking_access_pct}% banked`,
        finding: `High reliance on agricultural labour (${sec.livelihood.agri_labourer_percent}%) and ${sec.livelihood.marginal_worker_percent}% under-6-month employment create seasonal income volatility.`,
      },
      {
        title: "Solid Biomass Smoke & Clean Energy Transition",
        sector: "Environment",
        severity: v.env_s < 54 ? "High" : "Medium",
        observed_metric: `${sec.environment.solid_biomass_fuel_pct}% solid biomass · ${sec.environment.solar_lighting_pct}% solar lighting`,
        finding: `High household biomass combustion (${sec.environment.solid_biomass_fuel_pct}%) contrasts with strong ${sec.environment.avg_solar_radiation_mj_m2} MJ/m²/day solar potential.`,
      },
    ],
    recommended_actions: [
      {
        sector: "Water",
        finding: `${sec.water.water_within_premises_pct}% in-premises water and ${v.tanks} village tanks`,
        gap: `${sec.water.water_away_pct}% households fetch water away from premises`,
        intervention: `Audit functional household tap connections and schedule desiltation/bund strengthening across ${v.vn}'s ${v.tanks} minor irrigation tanks.`,
        kpi: "Share of households with verified 55 LPCD treated in-premises tap supply (%)",
        horizon: "Immediate (0–12 Months)",
      },
      {
        sector: "Health",
        finding: `${sec.health.latrine_within_pct}% latrine access and ${sec.health.nearest_health_km} km to ${v.hea_nm}`,
        gap: `${sec.health.open_defecation_pct}% without in-home sanitation; ${sec.health.closed_drainage_pct}% closed drains`,
        intervention: "Conduct household IHHL & soak-pit saturation drive and schedule mobile Palle Dawakhana preventive screening camps.",
        kpi: "Verified ODF-Plus household coverage & greywater soak-pit completion (%)",
        horizon: "Immediate (0–12 Months)",
      },
      {
        sector: "Education",
        finding: `${sec.education.literacy_rate}% literacy and ${sec.education.nearest_school_km} km to ${v.edu_nm}`,
        gap: `${sec.education.gender_literacy_gap}% gender literacy gap and ${sec.education.computer_internet_pct}% digital access`,
        intervention: "Upgrade school WASH/digital classrooms and run adolescent girls' bridge-learning & Gram Panchayat digital library hours.",
        kpi: "Upper-primary-to-secondary girl transition rate & digital lab utilization (%)",
        horizon: "Medium-Term (1–3 Years)",
      },
      {
        sector: "Livelihood",
        finding: `${sec.livelihood.marginal_worker_percent}% marginal workers and ${sec.livelihood.banking_access_pct}% banking`,
        gap: "Seasonal off-kharif underemployment and informal credit dependence",
        intervention: "Align off-season watershed/tank works with SHG bank-linkage camps and Rythu Vedika crop-diversification advisories.",
        kpi: "Active SHG credit-linked households & person-days of off-season wage employment",
        horizon: "Medium-Term (1–3 Years)",
      },
      {
        sector: "Environment",
        finding: `${sec.environment.solid_biomass_fuel_pct}% biomass cooking and ${sec.environment.avg_solar_radiation_mj_m2} MJ/m² solar insolation`,
        gap: "Indoor PM2.5 exposure and low decentralized solar adoption",
        intervention: "Promote clean LPG/biogas refill affordability alongside solar street-lighting, GP rooftop solar, and bund plantation.",
        kpi: "Clean cooking fuel adoption (%) & decentralized solar kW installed",
        horizon: "Long-Term (3–5 Years)",
      },
    ],
    policy_formulation: {
      charter_title: `Draft Integrated 5-Sector Gram Panchayat Development Charter — ${v.vn} (${v.mn} Mandal, ${v.dn})`,
      strategic_summary: `Tailored multi-sector convergence proposal for ${v.vn} prioritizing household water-and-sanitation completion, minor irrigation tank rejuvenation (${v.tanks} tanks), female literacy & digital readiness, SHG-anchored livelihood resilience, and clean cooking/solar transition. Prepared in response to: "${userQuery.slice(0, 140) || "5-sector development review"}". All programme linkages are candidate options requiring Gram Sabha, MPDO, and ${v.dn} District Collectorate verification.`,
      scheme_alignments: [
        {
          scheme_name: "Mission Bhagiratha & Jal Jeevan Mission (JJM)",
          tier: "Telangana State + Central",
          sector: "Water",
          village_rationale: `Verify tail-end pressure and functional household tap supply for the ${sec.water.water_away_pct}% away-fetching baseline toward 55 LPCD (${sec.water.normative_55lpcd_liters_day.toLocaleString()} L/day).`,
          verification_protocol: "Joint Gram Panchayat water-committee & RWS&S pressure/chlorination field audit.",
        },
        {
          scheme_name: "Mission Kakatiya & MGNREGA Watershed Convergence",
          tier: "Telangana State + Central",
          sector: "Water & Livelihood",
          village_rationale: `Rejuvenate ${v.vn}'s ${v.tanks} TRACGIS-mapped minor irrigation tanks while generating off-season wage work for ${sec.livelihood.marginal_worker_percent}% marginal workers.`,
          verification_protocol: "Minor Irrigation (I&CAD) technical sanction & Gram Sabha shelf-of-works approval.",
        },
        {
          scheme_name: "Palle Dawakhana, Aarogyasri & SBM-G Phase II (ODF Plus)",
          tier: "Telangana State + Central",
          sector: "Health",
          village_rationale: `Bridge the ${sec.health.nearest_health_km} km primary care distance to ${v.hea_nm} and expand ${sec.health.latrine_within_pct}% sanitation & greywater soak-pits.`,
          verification_protocol: "DM&HO sub-centre outreach roster & MPDO Swachh Bharat household verification.",
        },
        {
          scheme_name: "Mana Ooru – Mana Badi & Samagra Shiksha",
          tier: "Telangana State + Central",
          sector: "Education",
          village_rationale: `Strengthen school infrastructure near ${v.edu_nm} (${v.edu_km} km) and narrow the ${sec.education.gender_literacy_gap}% gender literacy gap.`,
          verification_protocol: "Mandal Educational Officer (MEO) & School Management Committee UDISE+ audit.",
        },
        {
          scheme_name: "SERP Stree Nidhi SHGs, PM Ujjwala & PM-KUSUM / Haritha Haram",
          tier: "Telangana State + Central",
          sector: "Livelihood & Environment",
          village_rationale: `Expand ${sec.livelihood.banking_access_pct}% banking via SHG micro-credit, reduce ${sec.environment.solid_biomass_fuel_pct}% biomass smoke, and leverage ${sec.environment.avg_solar_radiation_mj_m2} MJ/m² solar radiation.`,
          verification_protocol: "SERP Mandal Samakhya, Civil Supplies LPG roster & TGREDCO technical feasibility check.",
        },
      ],
      phased_roadmap: [
        {
          phase: "Phase I · Immediate Stabilization",
          horizon: "0–12 Months",
          priority_actions: "Household FHTC tap pressure audit, IHHL/greywater soak-pit drive, ANM/Palle Dawakhana screening camp, and SHG banking camp.",
          lead_department: "Gram Panchayat, MPDO & RWS&S / DM&HO",
          measurable_target: "100% functional tap & sanitation roster verification across all households",
        },
        {
          phase: "Phase II · Structural Asset Upgradation",
          horizon: "1–3 Years",
          priority_actions: `Desiltation & bund planting of ${v.tanks} village tanks, digital classroom & girls' bridge learning, and clean-cooking refill linkages.`,
          lead_department: "I&CAD Minor Irrigation, MEO & SERP Mandal Samakhya",
          measurable_target: "+15 percentage-point improvement in clean cooking, female transition & groundwater recharge",
        },
        {
          phase: "Phase III · Climate & Economic Resilience",
          horizon: "3–5 Years",
          priority_actions: "Solarized drinking-water/irrigation feeders, FPO value-addition linkage within 10 km market cluster, and heat/AQI early-warning protocol.",
          lead_department: "District Collectorate, TGREDCO & Agriculture Dept",
          measurable_target: "Composite JAN-DRISHTI score > 70/100 and sustained reduction in marginal employment",
        },
      ],
      budget_priority_mix: budgetMix,
      governance_accountability: [
        {
          institution: `${v.vn} Gram Sabha & Gram Panchayat`,
          role: "Beneficiary prioritization, social audit of household water/sanitation gaps, and GPDP resolution.",
          cadence: "Quarterly Gram Sabha review",
        },
        {
          institution: `MPDO & Mandal Parishad (${v.mn} Mandal)`,
          role: "Cross-departmental convergence across RWS&S, MEO, Primary Health, and MGNREGA works.",
          cadence: "Monthly Mandal convergence review",
        },
        {
          institution: `District Collectorate (${v.dn} District)`,
          role: "Technical sanction, budget release verification, and SDG benchmark tracking.",
          cadence: "Bi-annual District Planning Committee audit",
        },
      ],
    },
    committee_report: {
      scope_and_baseline: `Draft technical evidence review for ${v.vn} (${v.vc}), ${v.mn} Mandal, ${v.dn} District, Telangana (${v.area} km², est. ${v.pop.toLocaleString()} population, ${v.hh.toLocaleString()} households). Composite score: ${v.ovr_s}/100 (VVI ${v.vvi} · ${v.vvi_lvl}).`,
      cross_sector_synthesis: `Water (${v.wat_s}/100), Health (${v.hea_s}/100), and Environment (${v.env_s}/100) interact directly in ${v.vn}: ${sec.health.solid_biomass_fuel_pct}% biomass cooking and ${sec.health.open_defecation_pct}% unimproved sanitation compound household health burden, while ${v.tanks} minor irrigation tanks underpin both drinking-water recharge and ${sec.livelihood.cultivator_percent}%/${sec.livelihood.agri_labourer_percent}% agrarian livelihoods.`,
      future_readiness_outlook: `With ${sec.environment.current_temp_c}°C ambient temperature, ${sec.environment.avg_solar_radiation_mj_m2} MJ/m²/day solar insolation, and ${sec.environment.pm2_5} µg/m³ PM2.5, long-term readiness depends on per-capita groundwater buffering, heat-health outreach, and clean energy adoption.`,
      data_limitations_and_field_audits: "Amenity rates reflect Census 2011 Mandal HLPCA baselines combined with TRACGIS village tank polygons, OpenStreetMap facility coordinates, and live Open-Meteo District telemetry. Field verification of post-2011 Mission Bhagiratha/SBM-G household saturation is mandatory prior to capital allocation.",
      decisions_requiring_human_signoff: "1) Gram Sabha validation of household gap lists; 2) Engineering sanction by RWS&S and Minor Irrigation for tank/pipe works; 3) Administrative & budgetary approval by MPDO and District Collector.",
    },
  };
}

startServer();
