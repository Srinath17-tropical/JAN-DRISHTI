"use client";

import dynamic from "next/dynamic";
import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Circle,
  Columns2,
  Compass,
  Database,
  Droplets,
  FileText,
  Globe2,
  GraduationCap,
  HeartPulse,
  Leaf,
  Loader2,
  Map,
  Moon,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";

import {
  DecisionWorkspace,
  InteractiveDashboard,
} from "../components/ai/IntelligenceStudio";
import AnalyticsPanel from "../components/analytics/AnalyticsPanel";
import { loadVillageGIS } from "../lib/gis";
import {
  LANGUAGE_OPTIONS,
  translateDomainLabel,
  UI_TRANSLATIONS,
  type LanguageCode,
} from "../lib/i18n";
import ViciousToVirtuousCycle, {
  ViciousCycleCinematicOverlay,
} from "../components/ViciousToVirtuousCycle";
import MacroInflationRupeePanel, {
  type MacroInflationData,
} from "../components/MacroInflationRupeePanel";
import {
  EducationInstitutionsPanel,
  EnvironmentWaterbodiesPanel,
  HealthcareServiceMatrixPanel,
  LivelihoodVisualPlanPanel,
  WaterGroundwaterPanel,
  type DistrictGroundwaterRow,
  type HealthcareTierInfo,
  type SectorInsightsVillage,
} from "../components/SectorActionModules";
import SectorGraphicalVisual, {
  type GraphicalDomain,
} from "../components/SectorGraphicalVisual";
import PredictionHorizonStudio from "../components/PredictionHorizonStudio";
import AncientWisdomVisual, {
  type AncientWisdomDomain,
} from "../components/AncientWisdomVisual";
import CommunityDevelopmentHub from "../components/CommunityDevelopmentHub";
import {
  SDG_SECTOR_ASSETS,
  SdgGoalBadge,
  type SdgSectorId,
} from "../components/SdgVisualAssets";
import IndiaMapTransitionBackdrop from "../components/IndiaMapTransitionBackdrop";
import HyperlocalWeatherObservatory from "../components/HyperlocalWeatherObservatory";
import MandiMarketObservatory from "../components/MandiMarketObservatory";
import CitizenLifelineSchemeStudio from "../components/CitizenLifelineSchemeStudio";
import SectorGoodActionsPanel from "../components/SectorGoodActionsPanel";

const DevelopmentMap = dynamic(
  () => import("../components/gis/DevelopmentMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[420px] items-center justify-center border border-white/10 bg-black/30 text-sm text-white/50">
        Loading spatial intelligence…
      </div>
    ),
  }
);

const SatelliteMap = dynamic(
  () => import("../components/gis/SatelliteMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[420px] items-center justify-center border border-white/10 bg-black/30 text-sm text-white/50">
        Loading orbital satellite imagery…
      </div>
    ),
  }
);

/* =========================================================
   TYPES
========================================================= */

type Section =
  | "overview"
  | "community"
  | "education"
  | "health"
  | "water"
  | "livelihood"
  | "environment";

type FutureReadinessDomain = "health" | "water" | "environment";

type Panel = "map" | "analytics" | "ai" | "gaps" | "readiness";

type TransitionMode =
  | "section"
  | "community"
  | "map"
  | "analytics"
  | "ai"
  | "gaps"
  | "readiness";

type HorizonFilter = "all" | "immediate" | "medium" | "long_term";

type DomainConfig = {
  title: string;
  shortTitle: string;
  subtitle: string;
  sdg: string;
  sdgTitle: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  accent: string;
  question: string;
  metrics: string[];
  mapTitle: string;
  analyticsTitle: string;
  aiTitle: string;
  gapsTitle: string;
  readinessTitle?: string;
  explanation: string;
};

type ReadinessPillar = {
  id: string;
  horizonKey: Exclude<HorizonFilter, "all">;
  horizonLabel: string;
  title: string;
  focus: string;
  verificationMetric: string;
  programmeReference: string;
};

type FutureReadinessConfig = {
  domain: FutureReadinessDomain;
  title: string;
  shortLabel: string;
  sdg: string;
  sdgTitle: string;
  accentBorder: string;
  accentText: string;
  accentBg: string;
  question: string;
  summary: string;
  pillars: ReadinessPillar[];
  requiredDatasets: string[];
  checklist: string[];
  aiPrompt: string;
};

type VillageSearchResult = {
  village_code: string;
  area_name: string;
  mandal_name?: string;
  district_name?: string;
  district_code: string;
  subdistrict_code: string;
  total_population: number;
  literacy_rate: number;
  marginal_worker_percent: number;
  child_0_6_percent: number;
  overall_score?: number;
  vvi_v2: number;
  vvi_v2_level: string;
};

type VillageData = {
  profile: {
    state_code: string;
    district_code: string;
    subdistrict_code: string;
    mandal_code: string;
    mandal_name: string;
    district_name: string;
    village_code: string;
    village_name: string;
    type: string;
  };
  population: {
    households: number;
    total: number;
    male: number;
    female: number;
    children_0_6: number;
    sc_population: number;
    st_population: number;
  };
  education: {
    literate_population: number;
    illiterate_population: number;
    literacy_rate: number;
    female_literacy_rate: number;
    mobile_coverage_pct: number;
    nearest_school_km: number;
    nearest_school_name: string;
    education_vulnerability: number;
    education_score: number;
  };
  health: {
    latrine_within_pct: number;
    open_defecation_pct?: number;
    clean_cooking_fuel_pct: number;
    good_housing_pct: number;
    closed_drainage_pct: number;
    nearest_health_km: number;
    nearest_health_name: string;
    health_score: number;
  };
  water: {
    tap_water_total_pct: number;
    treated_tap_pct: number;
    water_within_premises_pct: number;
    tanks_total: number;
    tanks_gt_40ha?: number;
    tank_density_per_10sqkm: number;
    nearest_water_km: number;
    nearest_water_name: string;
    water_score: number;
  };
  livelihood: {
    total_workers: number;
    main_workers: number;
    marginal_workers: number;
    non_workers: number;
    worker_participation_rate: number;
    marginal_worker_percent: number;
    banking_access_pct: number;
    two_wheeler_pct: number;
    nearest_livelihood_km: number;
    nearest_livelihood_name: string;
    livelihood_vulnerability: number;
    livelihood_score: number;
  };
  environment: {
    solid_biomass_fuel_pct: number;
    solar_lighting_pct: number;
    electricity_lighting_pct: number;
    current_temp_c: number;
    forecast_7d_rain_mm?: number;
    avg_solar_radiation_mj_m2: number;
    pm2_5: number;
    us_aqi: number;
    nearest_env_km: number;
    nearest_env_name: string;
    environment_score: number;
  };
  demography: {
    female_share: number;
    sc_percent: number;
    st_percent: number;
    child_0_6_percent: number;
    demographic_vulnerability: number;
  };
  vulnerability: {
    vulnerability_index: number;
    vulnerability_level: string;
    vvi_v2: number;
    vvi_v2_level: string;
  };
  jan_drishti: {
    education_score: number;
    health_score: number;
    water_score: number;
    livelihood_score: number;
    environment_score: number;
    overall_score: number;
  };
  gis: {
    available: boolean;
    lat?: number;
    lon?: number;
    area_sq_km: number;
    mandal_code: string;
    geometry?: unknown;
  };
};

type StateInsightsPayload = {
  groundwater_by_district: DistrictGroundwaterRow[];
  healthcare_tiers: HealthcareTierInfo[];
  inflation_and_rupee: MacroInflationData;
};

type AgentResult = {
  query?: string;
  village_code?: string | null;
  outputs?: Record<string, unknown>;
  detail?: unknown;
  village?: unknown;
  agents?: Record<string, unknown>;
  statistics?: Record<string, unknown>;
  execution_summary?: Record<string, unknown>;
  evidence_chain?: unknown[];
  analysis?: unknown;
  analysis_error?: unknown;
  gis?: unknown;
  sdg?: unknown;
  risk?: unknown;
  gaps?: unknown;
  actions?: unknown;
  big_dashboard?: unknown;
  policy?: unknown;
  report?: unknown;
  reasoning?: unknown;
  error?: string;
};

/* =========================================================
   CONSTANTS
========================================================= */

const API_BASE = "/api";

const DOMAIN_ORDER: Section[] = [
  "education",
  "health",
  "water",
  "livelihood",
  "environment",
];

const FUTURE_READINESS_DOMAINS: FutureReadinessDomain[] = [
  "health",
  "water",
  "environment",
];

const DOMAINS: Record<Section, DomainConfig> = {
  overview: {
    title: "National Development Intelligence",
    shortTitle: "Overview",
    subtitle:
      "From fragmented evidence to spatially contextualised development intelligence.",
    sdg: "SDG INTELLIGENCE",
    sdgTitle: "Development across multiple dimensions",
    icon: Network,
    accent: "#ff9933",
    question: "Are we developing everywhere?",
    metrics: [
      "Population",
      "Outcomes",
      "Infrastructure",
      "Spatial patterns",
    ],
    mapTitle: "National Spatial Intelligence",
    analyticsTitle: "Development Analytics",
    aiTitle: "Development AI",
    gapsTitle: "Development Signals",
    explanation:
      "JAN—DRISHTI connects people, places, outcomes and evidence so that development gaps become visible without reducing communities to a single score.",
  },

  community: {
    title: "Community Development",
    shortTitle: "Community",
    subtitle:
      "Participatory Governance for Viksit Bharat — report gaps, mobilize Shramdaan drives, and co-solve across all 5 SDGs.",
    sdg: "VIKSIT BHARAT",
    sdgTitle: "Citizen-Led Action Network",
    icon: Users,
    accent: "#f97316",
    question: "How can citizens, youth, and NGOs turn village data into immediate action?",
    metrics: ["Action Rooms", "Shramdaan Drives", "Bal Mitra", "Civic Ledger"],
    mapTitle: "Community Action Map",
    analyticsTitle: "Civic Participation",
    aiTitle: "Community AI",
    gapsTitle: "Field Gap Reports",
    explanation:
      "Translates 5-sector village evidence into verifiable citizen action rooms with EXIF camera capture, vernacular voice notes, NGO adoption, and before/after proof.",
  },

  education: {
    title: "Education Intelligence",
    shortTitle: "Education",
    subtitle:
      "Understand how population, literacy, children and opportunity interact across settlements.",
    sdg: "SDG 04",
    sdgTitle: "Quality Education",
    icon: GraduationCap,
    accent: "#c5192d",
    question:
      "Can educational opportunity keep pace with people?",
    metrics: [
      "Literacy",
      "Children 0–6",
      "Population",
      "Opportunity",
    ],
    mapTitle: "Education Spatial Intelligence",
    analyticsTitle: "Education Analytics",
    aiTitle: "Education AI Engine",
    gapsTitle: "Education Gaps & Opportunities",
    explanation:
      "Education intelligence connects population structure, literacy and spatial evidence to reveal where further investigation may be useful.",
  },

  health: {
    title: "Health Intelligence",
    shortTitle: "Health",
    subtitle:
      "Understand population-linked health access, service distribution, spatial disparities and future health-system readiness.",
    sdg: "SDG 03",
    sdgTitle: "Good Health & Well-being",
    icon: HeartPulse,
    accent: "#4c9f38",
    question:
      "Does health infrastructure reach people where they live — and is it ready for tomorrow's demand?",
    metrics: [
      "Population",
      "Health access",
      "Service distribution",
      "Future readiness",
    ],
    mapTitle: "Health Spatial Intelligence",
    analyticsTitle: "Health Analytics",
    aiTitle: "Health AI Engine",
    gapsTitle: "Health Gaps & Opportunities",
    readinessTitle: "Health Future Readiness",
    explanation:
      "Health intelligence separates health-service evidence from demographic and education indicators so that service-access patterns and future capacity needs can be investigated without fabricating health statistics.",
  },

  water: {
    title: "Water Intelligence",
    shortTitle: "Water",
    subtitle:
      "Explore water-access conditions, infrastructure, settlement distribution and long-horizon water security.",
    sdg: "SDG 06",
    sdgTitle: "Clean Water & Sanitation",
    icon: Droplets,
    accent: "#26bde2",
    question:
      "Does essential water infrastructure reach every settlement — and will supply hold through seasonal stress?",
    metrics: [
      "Water access",
      "Infrastructure",
      "Settlement coverage",
      "Future readiness",
    ],
    mapTitle: "Water Spatial Intelligence",
    analyticsTitle: "Water Analytics",
    aiTitle: "Water AI Engine",
    gapsTitle: "Water Gaps & Opportunities",
    readinessTitle: "Water Future Readiness",
    explanation:
      "Water intelligence creates a dedicated spatial and forward-planning layer for household access, aquifer sustainability, infrastructure and settlement coverage.",
  },

  livelihood: {
    title: "Livelihood Intelligence",
    shortTitle: "Livelihood",
    subtitle:
      "Study work participation, population structure and livelihood opportunity signals.",
    sdg: "SDG 08",
    sdgTitle: "Decent Work & Economic Growth",
    icon: BriefcaseBusiness,
    accent: "#a21942",
    question:
      "Where does economic opportunity meet human potential?",
    metrics: [
      "Work participation",
      "Marginal workers",
      "Population",
      "Opportunity",
    ],
    mapTitle: "Livelihood Spatial Intelligence",
    analyticsTitle: "Livelihood Analytics",
    aiTitle: "Livelihood AI Engine",
    gapsTitle: "Livelihood Gaps & Opportunities",
    explanation:
      "Livelihood intelligence uses Census work-participation and marginal-worker evidence to understand local labour patterns without treating one indicator as a complete measure of development.",
  },

  environment: {
    title: "Environment Intelligence",
    shortTitle: "Environment",
    subtitle:
      "Connect settlement patterns with environmental vulnerability, spatial signals and climate readiness.",
    sdg: "SDG 13",
    sdgTitle: "Climate Action",
    icon: Leaf,
    accent: "#3f7e44",
    question:
      "Where are communities and environmental pressures intersecting — and how prepared are local systems?",
    metrics: [
      "Environmental exposure",
      "Settlement pattern",
      "Renewable energy assets",
      "Future readiness",
    ],
    mapTitle: "Environmental Spatial Intelligence",
    analyticsTitle: "Environmental Analytics",
    aiTitle: "Environment AI Engine",
    gapsTitle: "Environmental Gaps & Opportunities",
    readinessTitle: "Environmental Future Readiness",
    explanation:
      "Environmental intelligence is reserved for environmental evidence such as land, climate, exposure, renewable-energy assets, ecological datasets and climate-resilience preparedness rather than using unrelated social indicators as substitutes.",
  },
};

type AncientWisdomEntry = {
  sector: Section;
  label: string;
  principle: string;
  source: string;
  scriptVerse: string;
  transliteration: string;
  translation: string;
  deccanHeritage: string;
  modernBridge: string;
  accent: string;
  secondaryAccent: string;
};

const ANCIENT_WISDOM: Record<Section, AncientWisdomEntry> = {
  overview: {
    sector: "overview",
    label: "Lokasangraha · Holistic Public Welfare",
    principle: "People-Centred Rajadharma",
    source: "Kautilya · Arthashastra (1.19.34)",
    scriptVerse: "प्रजासुखे सुखं राज्ञः प्रजानां च हिते हितम्",
    transliteration:
      "Praja-sukhe sukham rajnah, prajanam cha hite hitam; natma-priyam hitam rajnah, prajanam tu priyam hitam.",
    translation:
      "In the well-being of the citizens lies the well-being of governance; in their flourishing lies its true purpose.",
    deccanHeritage:
      "Across historic Telangana Gram Sabhas and Satavahana–Kakatiya inscriptions, village administration rested on visible public records of land, water, granaries, and craft guilds.",
    modernBridge:
      "Unites demography, 5-sector GIS, and transparent statistical evidence so every Gram Panchayat decision serves measurable household flourishing.",
    accent: "#ff9933",
    secondaryAccent: "#06b6d4",
  },
  community: {
    sector: "community",
    label: "Samgachhadhvam · Collective Civic Action",
    principle: "Shared Shramdaan & Community Trust",
    source: "Rigveda Samjnana Sukta (10.191.2)",
    scriptVerse: "संगच्छध्वं संवदध्वं सं वो मनांसि जानताम्",
    transliteration:
      "Samgachhadhvam samvadadhvam sam vo manamsi janatam — Walk together, speak with shared purpose, let your minds unite for common good.",
    translation:
      "True rural transformation arises when residents, youth, artisans, and local institutions act together in harmony.",
    deccanHeritage:
      "Kakatiya village communities built and maintained thousands of tanks, dharmasalas, and pathashalas through voluntary Shramdaan and Kudimaramat labour.",
    modernBridge:
      "Powers JAN—DRISHTI's Community Development Hub with participatory field reporting, NGO adoption, and peer-verified impact ledgers.",
    accent: "#f97316",
    secondaryAccent: "#10b981",
  },
  education: {
    sector: "education",
    label: "Vidya-Dhanam · Imperishable Knowledge",
    principle: "Universal Learning & Shared Wisdom",
    source: "Subhashita Ratnabhandagara · Classical Niti Tradition",
    scriptVerse: "न चौरहार्यं न च राजहार्यं न भ्रातृभाज्यं न च भारकारि । व्यये कृते वर्धत एव नित्यं विद्याधनं सर्वधनप्रधानम् ॥",
    transliteration:
      "Na chora-haryam na cha raja-haryam, na bhratri-bhajyam na cha bharakari; vyaye krite vardhata eva nityam, vidya-dhanam sarva-dhana-pradhanam.",
    translation:
      "Neither stolen by thieves nor seized by rulers, neither divided among kin nor burdensome to carry—the more it is shared, the more it grows; learning is the supreme wealth.",
    deccanHeritage:
      "From ancient Ghatikas and Vemulawada–Warangal scholarly centres of Telangana to neighbourhood village pathashalas, learning thrived as a community trust.",
    modernBridge:
      "Guides foundational literacy, narrowing the gender literacy gap, and extending digital classroom reach to every rural child.",
    accent: "#ef4444",
    secondaryAccent: "#f59e0b",
  },
  health: {
    sector: "health",
    label: "Arogya-Mulam · Preventive Vitality",
    principle: "Swasthya & Environmental Hygiene",
    source: "Acharya Charaka · Charaka Samhita (Sutrasthana 1.15)",
    scriptVerse: "धर्मार्थकाममोक्षाणामारोग्यं मूलमुत्तमम्",
    transliteration:
      "Dharmartha-kama-mokshanam arogyam mulam uttamam.",
    translation:
      "Good health and preventive vitality are the foremost root of ethical duty, productive livelihood, human aspiration, and liberation.",
    deccanHeritage:
      "Classical Ayurveda emphasised Dinacharya (clean water, clean indoor air, waste drainage) and Ritu-charya (seasonal disease preparedness) centuries before modern epidemiology.",
    modernBridge:
      "Directly informs in-premises sanitation, clean LPG/biogas cooking to eliminate indoor biomass smoke, and Palle Dawakhana preventive primary care.",
    accent: "#10b981",
    secondaryAccent: "#14b8a6",
  },
  water: {
    sector: "water",
    label: "Jala-Samrakshana & Golusu Kattu Cheruvulu",
    principle: "Cascading Tank Hydrology & Sacred Waters",
    source: "Rigveda (10.9.1) & Kakatiya Tank Sasanas (12th–14th c. CE)",
    scriptVerse: "आपो हि ष्ठा मयोभुवस्ता न ऊर्जे दधातन",
    transliteration:
      "Apo hi stha mayo-bhuvah, ta na urje dadhatana — Waters are truly the sustainers of healing, nourishment, and life-force.",
    translation:
      "Treat every drop of monsoon runoff as a shared generational covenant linking upland catchments to lowland habitations.",
    deccanHeritage:
      "Telangana's Kakatiya engineers pioneered Golusu Kattu Cheruvulu—interlinked cascading chain-tanks across the Deccan granite plateau so overflow from one tank recharged the next.",
    modernBridge:
      "Directly reflected in JAN—DRISHTI's TRACGIS village minor-irrigation tank inventory, groundwater recharge, and Mission Bhagiratha / Mission Kakatiya planning.",
    accent: "#06b6d4",
    secondaryAccent: "#3b82f6",
  },
  livelihood: {
    sector: "livelihood",
    label: "Varta & Shreni · Dignified Rural Enterprise",
    principle: "Productive Labour, Guild Solidarity & Credit",
    source: "Thiruvalluvar · Thirukkural (1031) & Arthashastra (Varta)",
    scriptVerse: "சுழன்றும் ஏர்ப்பின்னது உலகம் · कृषिपाशुपाल्ये वणिज्या च वार्ता",
    transliteration:
      "Suzhandrum erpinnadhu ulagam — Krishi-pashupalye vanijya cha varta.",
    translation:
      "Though diverse pursuits turn the wheel of the world, sustainable cultivation, skilled craft, and ethical exchange remain its enduring axis.",
    deccanHeritage:
      "Medieval Telangana's Srenis and Panchahanam craft-and-cultivator collectives pooled mutual credit, tools, and market access across weekly santalu (mandis).",
    modernBridge:
      "Echoes in today's SERP Stree Nidhi Women's Self-Help Groups, formal banking inclusion, and off-season employment stability for marginal workers.",
    accent: "#ec4899",
    secondaryAccent: "#f97316",
  },
  environment: {
    sector: "environment",
    label: "Prakriti & Bhumi-Dharma · Ecological Stewardship",
    principle: "Regenerative Balance with Earth & Sun",
    source: "Atharvaveda · Bhumi Sukta (12.1.35)",
    scriptVerse: "यत्ते भूमे विखनामि क्षिप्रं तदपि रोहतु । मा ते मर्म विमृग्वरि मा ते हृदयमर्पिपम् ॥",
    transliteration:
      "Yat te bhume vikhanami kshipram tad api rohatu; ma te marma vimrigvari ma te hridayam arpipam.",
    translation:
      "Whatever I draw from you, O Earth, may that replenish swiftly; let us never injure your vital ecosystems or wound your living heart.",
    deccanHeritage:
      "Traditional Deccan villages preserved sacred groves, tank-bund plantations (Katta Maisamma vanams), and passive solar courtyard architecture.",
    modernBridge:
      "Guides Telangana Ku Haritha Haram afforestation, clean solar transition (17+ MJ/m² insolation), and ambient PM2.5 air-quality stewardship.",
    accent: "#84cc16",
    secondaryAccent: "#22c55e",
  },
};

const FUTURE_READINESS: Record<FutureReadinessDomain, FutureReadinessConfig> = {
  health: {
    domain: "health",
    title: "Health Future Readiness",
    shortLabel: "Health",
    sdg: "SDG 03",
    sdgTitle: "Good Health & Well-being",
    accentBorder: "border-emerald-400/25",
    accentText: "text-emerald-300",
    accentBg: "bg-emerald-400/[0.06]",
    question:
      "Can primary health care, maternal-child services, and outbreak surveillance scale ahead of demographic and climate stress?",
    summary:
      "Evaluates settlement health preparedness across demographic cohort pressure, primary-care travel reach, cold-chain continuity, and disease-surveillance readiness without fabricating clinical incidence data.",
    pillars: [
      {
        id: "health-cohort-capacity",
        horizonKey: "immediate",
        horizonLabel: "0–2 Yrs · Immediate",
        title: "Maternal & Early-Childhood Service Capacity",
        focus:
          "Align Sub-Health Centre (SHC), immunization session frequency, and Anganwadi nutrition screening with the observed 0–6 child cohort and household count.",
        verificationMetric:
          "ANM/ASHA staffing ratio, monthly VHND session coverage, and sub-centre catchment distance.",
        programmeReference: "NHM · Ayushman Arogya Mandir (SHC/PHC) & POSHAN 2.0",
      },
      {
        id: "health-emergency-reach",
        horizonKey: "medium",
        horizonLabel: "3–5 Yrs · Medium-Term",
        title: "Referral Mobility & Cold-Chain Resilience",
        focus:
          "Ensure all-weather ambulance travel times within golden-hour thresholds across the village's spatial extent and solar/inverter backup for vaccine and essential-drug storage.",
        verificationMetric:
          "PHC/CHC road travel-time isochrone (minutes) and power-backup uptime at nearest health facility.",
        programmeReference: "PM-ABHIM · Critical Care & Block Public Health Units",
      },
      {
        id: "health-surveillance",
        horizonKey: "medium",
        horizonLabel: "3–5 Yrs · Medium-Term",
        title: "Heat-Stress & Vector-Borne Early Warning",
        focus:
          "Integrate seasonal water-logging, heatwave alerts, and fever/water-borne syndrome reporting so frontline workers can act before localized outbreaks escalate.",
        verificationMetric:
          "Weekly IDSP reporting completeness and village heat/vector contingency protocol availability.",
        programmeReference: "Integrated Disease Surveillance Programme (IDSP)",
      },
      {
        id: "health-digital-continuity",
        horizonKey: "long_term",
        horizonLabel: "5–10 Yrs · Structural",
        title: "Longitudinal Preventive Care & Tele-Consultation",
        focus:
          "Build interoperable community screening workflows for non-communicable diseases (NCDs) and specialist tele-consultation links to reduce out-of-pocket referral travel.",
        verificationMetric:
          "Tele-consultation connectivity uptime and population-based NCD screening registry coverage.",
        programmeReference: "Ayushman Bharat Digital Mission (ABDM) & eSanjeevani",
      },
    ],
    requiredDatasets: [
      "Geolocated Sub-Health Centre, PHC, and CHC facility coordinates",
      "All-weather road network & ambulance travel-time isochrones",
      "ANM, ASHA, and MPW sanctioned vs. posted staffing records",
      "Block-level IDSP seasonal vector and water-borne surveillance logs",
    ],
    checklist: [
      "Nearest SHC/PHC distance and travel time verified on field road network",
      "0–6 child cohort immunization & Anganwadi catchment capacity reviewed",
      "Facility vaccine/medicine cold-chain power backup verified",
      "Seasonal heat-stress and vector/water-borne reporting link confirmed",
    ],
    aiPrompt:
      "Prepare a Future Readiness assessment for Health in this village. Use observed demographic and spatial indicators (population, households, children 0–6 share, village area) to size baseline service demand, clearly list unmeasured clinical/facility datasets required for verification, outline 0–2 year, 3–5 year, and 5–10 year health-system preparedness actions, and reference relevant public health programmes to verify without claiming automatic eligibility.",
  },

  water: {
    domain: "water",
    title: "Water Future Readiness",
    shortLabel: "Water",
    sdg: "SDG 06",
    sdgTitle: "Clean Water & Sanitation",
    accentBorder: "border-cyan-400/25",
    accentText: "text-cyan-300",
    accentBg: "bg-cyan-400/[0.06]",
    question:
      "Will household water security, aquifer recharge, and quality assurance hold across seasonal droughts and multi-year demand?",
    summary:
      "Links household settlement scale with source sustainability, pre/post-monsoon groundwater buffering, water-quality testing, and greywater circularity—strictly separating normative demand benchmarks from measured supply.",
    pillars: [
      {
        id: "water-fhtc-reliability",
        horizonKey: "immediate",
        horizonLabel: "0–2 Yrs · Immediate",
        title: "Household Tap Functionality & Tail-End Equity",
        focus:
          "Verify that distribution pressure, daily supply duration, and storage reach every hamlet and household cluster, including SC/ST habitations and peripheral settlements.",
        verificationMetric:
          "Functional Household Tap Connection (FHTC) audit rate and tail-end LPCD delivery consistency.",
        programmeReference: "Jal Jeevan Mission (JJM) · Village Action Plan",
      },
      {
        id: "water-quality-surveillance",
        horizonKey: "immediate",
        horizonLabel: "0–2 Yrs · Immediate",
        title: "Contamination Screening & Sanitary Protection",
        focus:
          "Institutionalise periodic field-test kit (FTK) and laboratory checks for fluoride, nitrate, salinity, and bacteriological safety across all drinking-water sources.",
        verificationMetric:
          "Pre- and post-monsoon water quality lab test completion and source sanitary survey status.",
        programmeReference: "JJM — Water Quality Management Information System (WQMIS)",
      },
      {
        id: "water-aquifer-buffer",
        horizonKey: "medium",
        horizonLabel: "3–5 Yrs · Medium-Term",
        title: "Source Sustainability & Aquifer Recharge Buffering",
        focus:
          "Pair drinking-water extraction with check-dams, percolation tanks, rooftop rainwater harvesting, and borewell recharge shafts so summer drawdown does not interrupt supply.",
        verificationMetric:
          "Pre/post-monsoon piezometer water-table delta and recharge structure storage capacity.",
        programmeReference: "Atal Bhujal Yojana · Jal Shakti Abhiyan & MGNREGA Water Works",
      },
      {
        id: "water-circular-greywater",
        horizonKey: "long_term",
        horizonLabel: "5–10 Yrs · Structural",
        title: "Greywater Reuse & Solarised Pumping Resilience",
        focus:
          "Treat household greywater via soak-pits/stabilisation ponds to prevent contamination and transition overhead-tank pumping to solar-hybrid power to cut outage downtime.",
        verificationMetric:
          "Drainage/greywater treatment coverage (%) and solar-backed pumping hours per day.",
        programmeReference: "Swachh Bharat Mission (Grameen) Phase II — Greywater Management",
      },
    ],
    requiredDatasets: [
      "Habitation-wise FHTC coverage and actual LPCD supply telemetry",
      "CGWB / State groundwater pre- and post-monsoon depth logs",
      "Laboratory & Field Test Kit (FTK) chemical/bacteriological quality records",
      "Mapped surface water bodies, overhead tanks (OHTs), and recharge assets",
    ],
    checklist: [
      "All habitations and tail-end households audited for reliable tap supply",
      "Pre- and post-monsoon drinking-water quality tests logged and reviewed",
      "Source sustainability & summer contingency storage plan verified",
      "Greywater drainage and soak-pit/treatment separation from water sources checked",
    ],
    aiPrompt:
      "Prepare a Future Readiness assessment for Water & Sanitation in this village. Use observed household, population, and spatial area indicators to establish normative demand context (explicitly noting 55 LPCD as a planning benchmark rather than measured supply), identify required groundwater/FHTC/water-quality datasets, and structure short-, medium-, and long-term water resilience actions with official programme references to verify.",
  },

  environment: {
    domain: "environment",
    title: "Environment Future Readiness",
    shortLabel: "Environment",
    sdg: "SDG 13",
    sdgTitle: "Climate Action",
    accentBorder: "border-lime-400/25",
    accentText: "text-lime-300",
    accentBg: "bg-lime-400/[0.06]",
    question:
      "Are settlement land-use, climate-sensitive livelihoods, ecological buffers, and clean-energy assets prepared for environmental extremes?",
    summary:
      "Connects mapped settlement area, demographic density, and marginal-workforce exposure with multi-hazard climate preparedness, watershed restoration, and decentralised renewable energy readiness.",
    pillars: [
      {
        id: "env-heat-climate-shield",
        horizonKey: "immediate",
        horizonLabel: "0–2 Yrs · Immediate",
        title: "Heatwave, Drought & Extreme-Rainfall Preparedness",
        focus:
          "Establish local heat-stress advisories, shaded rest/hydration points for outdoor workers, and storm-drainage clearance ahead of peak summer and monsoon extremes.",
        verificationMetric:
          "Gram Panchayat heat/flood contingency protocol, shaded work-hour scheduling, and drainage audit.",
        programmeReference: "State Action Plan on Climate Change (SAPCC) & NDMA Heat Guidelines",
      },
      {
        id: "env-commons-watershed",
        horizonKey: "medium",
        horizonLabel: "3–5 Yrs · Medium-Term",
        title: "Watershed, Soil & Ecological Commons Restoration",
        focus:
          "Protect village common lands, shelterbelts, tank foreshore plantations, and contour bunding to buffer soil erosion, flash runoff, and micro-climatic heat islands.",
        verificationMetric:
          "Hectares of restored common/watershed land and native tree-cover survival rate.",
        programmeReference: "MGNREGA Natural Resource Management & Green India Mission",
      },
      {
        id: "env-clean-energy-transition",
        horizonKey: "medium",
        horizonLabel: "3–5 Yrs · Medium-Term",
        title: "Decentralised Solar & Clean Rural Infrastructure",
        focus:
          "Deploy solar agricultural feeders/pumps, solar street lighting, and clean backup power for schools, health sub-centres, and drinking-water pumping stations.",
        verificationMetric:
          "Verified installed solar capacity (kW) across public institutions and agricultural feeders.",
        programmeReference: "PM-KUSUM & Decentralized Renewable Energy Livelihood Programmes",
      },
      {
        id: "env-climate-resilient-livelihoods",
        horizonKey: "long_term",
        horizonLabel: "5–10 Yrs · Structural",
        title: "Climate-Resilient Cropping & Livelihood Diversification",
        focus:
          "Reduce vulnerability of marginal and seasonal workers to rainfall shocks through drought-tolerant advisories, decentralized cold/dry storage, and non-farm green skills.",
        verificationMetric:
          "Share of seasonal workers covered by climate-resilient advisories and post-harvest storage access.",
        programmeReference: "NICRA (Climate Resilient Agriculture) & NRLM Green Livelihoods",
      },
    ],
    requiredDatasets: [
      "IMD gridded rainfall variability, dry-spell, and heat-index anomaly records",
      "High-resolution Land Use / Land Cover (LULC) and green-cover change layers",
      "Watershed Digital Elevation Model (DEM) flood and erosion susceptibility maps",
      "Geolocated renewable-energy assets with verified installed capacity (kW)",
    ],
    checklist: [
      "Heat-stress and extreme-rainfall early warning protocol reviewed for outdoor workers",
      "Watershed runoff channels, tanks, and village ecological commons mapped",
      "Public-facility & agricultural feeder solarisation opportunities audited",
      "Authoritative climate, LULC, and renewable-asset datasets queued for linkage",
    ],
    aiPrompt:
      "Prepare a Future Readiness assessment for Environment & Climate Action in this village. Use observed spatial area, settlement density, and marginal-worker indicators as contextual exposure signals without fabricating climate or emissions figures, specify missing environmental/renewable-energy datasets, and propose phased 0–2 year, 3–5 year, and 5–10 year climate-resilience and clean-energy actions with official programme references to verify.",
  },
};

/* =========================================================
   HELPERS
========================================================= */

function isFutureReadinessDomain(
  section: Section
): section is FutureReadinessDomain {
  return (
    section === "health" ||
    section === "water" ||
    section === "environment"
  );
}

function safeNumber(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "number") {
    return value.toLocaleString();
  }

  if (typeof value === "boolean") {
    return value ? "YES" : "NO";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function humanizeKey(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function extractText(value: unknown): string {
  if (value === null || value === undefined) return "";

  if (typeof value === "string") return value;

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => extractText(item))
      .filter(Boolean)
      .join(" ");
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferred = [
      "summary",
      "finding",
      "gap",
      "intervention",
      "recommendation",
      "description",
      "text",
      "message",
      "result",
      "answer",
    ];

    for (const key of preferred) {
      if (record[key] !== undefined) {
        const text = extractText(record[key]);
        if (text) return text;
      }
    }
  }

  return "";
}

function objectEntries(value: unknown): [string, unknown][] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  return Object.entries(value as Record<string, unknown>);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

function getObservedReadinessBaseline(
  domain: FutureReadinessDomain,
  village: VillageData | null
): { label: string; value: string; note: string }[] {
  if (!village) {
    return [
      {
        label: "Observed Village Context",
        value: "No village selected",
        note: "Search or select a Telangana village boundary to populate observed Census, HLPCA & GIS baseline context.",
      },
    ];
  }

  if (domain === "health") {
    return [
      {
        label: "Resident Catchment & 0–6 Cohort",
        value: `${village.population.total.toLocaleString()} people`,
        note: `${village.population.households.toLocaleString()} HH · ${village.population.children_0_6.toLocaleString()} children (0–6)`,
      },
      {
        label: "Sanitation Within Premises",
        value: `${village.health.latrine_within_pct}%`,
        note: `Closed drainage: ${village.health.closed_drainage_pct}% (Mandal HLPCA)`,
      },
      {
        label: "Clean Cooking Air Protection",
        value: `${village.health.clean_cooking_fuel_pct}%`,
        note: `Good housing: ${village.health.good_housing_pct}%`,
      },
      {
        label: "Nearest Mapped Health Facility",
        value: `${village.health.nearest_health_km} km`,
        note: `${village.health.nearest_health_name} (OSM GIS)`,
      },
    ];
  }

  if (domain === "water") {
    const normativeLitresPerDay = Math.round(village.population.total * 55);
    return [
      {
        label: "Household Tap Water Access",
        value: `${village.water.tap_water_total_pct}%`,
        note: `Treated tap: ${village.water.treated_tap_pct}% · In-premises: ${village.water.water_within_premises_pct}%`,
      },
      {
        label: "TRACGIS Minor Irrigation Tanks",
        value: `${village.water.tanks_total} tanks`,
        note: `${village.water.tank_density_per_10sqkm} tanks / 10 km² across ${village.gis.area_sq_km} km²`,
      },
      {
        label: "Normative 55 LPCD Benchmark",
        value: `${normativeLitresPerDay.toLocaleString()} L/day`,
        note: "JJM planning demand reference (not measured supply)",
      },
      {
        label: "Nearest Water Works / Reservoir",
        value: `${village.water.nearest_water_km} km`,
        note: `${village.water.nearest_water_name} (OSM GIS)`,
      },
    ];
  }

  return [
    {
      label: "Solar Radiation Potential",
      value: `${village.environment.avg_solar_radiation_mj_m2} MJ/m²`,
      note: `Temp ${village.environment.current_temp_c}°C · Solar lighting ${village.environment.solar_lighting_pct}%`,
    },
    {
      label: "Solid Biomass Fuel Exposure",
      value: `${village.environment.solid_biomass_fuel_pct}%`,
      note: `Grid electricity lighting: ${village.environment.electricity_lighting_pct}%`,
    },
    {
      label: "Ambient PM2.5 & Air Quality",
      value: `${village.environment.pm2_5} µg/m³`,
      note: `US AQI ${village.environment.us_aqi} (Open-Meteo District feed)`,
    },
    {
      label: "Ecological & Tank Buffer",
      value: `${village.water.tanks_total} tanks · ${village.gis.area_sq_km} km²`,
      note: `Nearest reserve/solar asset: ${village.environment.nearest_env_km} km`,
    },
  ];
}

function normalizeVillageData(value: unknown): VillageData {
  const source = asRecord(value);
  const population = asRecord(source.population);
  const analytics = asRecord(source.analytics);
  const vulnerability = asRecord(source.vulnerability);
  const spatial = asRecord(source.spatial);
  const sectors = asRecord(source.sectors);
  const secEdu = asRecord(sectors.education);
  const secHea = asRecord(sectors.health);
  const secWat = asRecord(sectors.water);
  const secLiv = asRecord(sectors.livelihood);
  const secEnv = asRecord(sectors.environment);

  const villageCode = String(
    population.village_code ?? analytics.village_code ?? ""
  );
  const literacyRate = safeNumber(
    population.literacy_rate ?? analytics.literacy_rate
  );
  const marginalWorkerPercent = safeNumber(
    population.marginal_worker_percent ??
      analytics.marginal_worker_percent
  );
  const childPopulationPercent = safeNumber(
    population.child_0_6_percent ??
      analytics.child_0_6_percent
  );
  const vvi = safeNumber(analytics.vvi_v2);
  const rawMandalCode = String(analytics.subdistrict_code ?? "");

  return {
    profile: {
      state_code: String(population.state_code ?? "Telangana"),
      district_code: String(
        population.district_code ?? analytics.district_code ?? ""
      ),
      subdistrict_code: String(
        population.subdistrict_code ??
          analytics.subdistrict_code ??
          ""
      ),
      mandal_code: rawMandalCode,
      mandal_name: String(
        population.mandal_name ?? analytics.mandal_name ?? ""
      ),
      district_name: String(
        population.district_name ?? analytics.district_name ?? ""
      ),
      village_code: villageCode,
      village_name: String(
        population.area_name ??
          analytics.area_name ??
          `Village ${villageCode}`
      ),
      type: String(population.tru ?? population.type ?? "Village"),
    },
    population: {
      households: safeNumber(population.households),
      total: safeNumber(population.total_population),
      male: safeNumber(population.male_population),
      female: safeNumber(population.female_population),
      children_0_6: safeNumber(population.population_0_6),
      sc_population: safeNumber(population.sc_population),
      st_population: safeNumber(population.st_population),
    },
    education: {
      literate_population: safeNumber(population.literate_population),
      illiterate_population: safeNumber(population.illiterate_population),
      literacy_rate: literacyRate,
      female_literacy_rate: safeNumber(
        secEdu.female_literacy_rate ?? analytics.female_literacy_rate
      ),
      mobile_coverage_pct: safeNumber(secEdu.mobile_coverage_pct),
      nearest_school_km: safeNumber(secEdu.nearest_school_km),
      nearest_school_name: String(secEdu.nearest_school_name ?? "Mapped School"),
      education_vulnerability: safeNumber(
        analytics.education_vulnerability
      ),
      education_score: safeNumber(
        analytics.education_score ?? vulnerability.education_score
      ),
    },
    health: {
      latrine_within_pct: safeNumber(secHea.latrine_within_pct),
      open_defecation_pct: safeNumber(secHea.open_defecation_pct),
      clean_cooking_fuel_pct: safeNumber(secHea.clean_cooking_fuel_pct),
      good_housing_pct: safeNumber(secHea.good_housing_pct),
      closed_drainage_pct: safeNumber(secHea.closed_drainage_pct),
      nearest_health_km: safeNumber(secHea.nearest_health_km),
      nearest_health_name: String(secHea.nearest_health_name ?? "Health Facility"),
      health_score: safeNumber(
        analytics.health_score ?? vulnerability.health_score ?? secHea.score
      ),
    },
    water: {
      tap_water_total_pct: safeNumber(secWat.tap_water_total_pct),
      treated_tap_pct: safeNumber(secWat.treated_tap_pct),
      water_within_premises_pct: safeNumber(secWat.water_within_premises_pct),
      tanks_total: safeNumber(secWat.tanks_total),
      tanks_gt_40ha: safeNumber(secWat.tanks_gt_40ha),
      tank_density_per_10sqkm: safeNumber(secWat.tank_density_per_10sqkm),
      nearest_water_km: safeNumber(secWat.nearest_water_km),
      nearest_water_name: String(secWat.nearest_water_name ?? "Water Asset"),
      water_score: safeNumber(
        analytics.water_score ?? vulnerability.water_score ?? secWat.score
      ),
    },
    livelihood: {
      total_workers: safeNumber(population.total_workers),
      main_workers: safeNumber(population.main_workers),
      marginal_workers: safeNumber(population.marginal_workers),
      non_workers: safeNumber(population.non_workers),
      worker_participation_rate: safeNumber(
        population.worker_participation_rate ??
          analytics.worker_participation_rate
      ),
      marginal_worker_percent: marginalWorkerPercent,
      banking_access_pct: safeNumber(secLiv.banking_access_pct),
      two_wheeler_pct: safeNumber(secLiv.two_wheeler_pct),
      nearest_livelihood_km: safeNumber(secLiv.nearest_livelihood_km),
      nearest_livelihood_name: String(
        secLiv.nearest_livelihood_name ?? "Market / Bank"
      ),
      livelihood_vulnerability: safeNumber(
        analytics.livelihood_vulnerability
      ),
      livelihood_score: safeNumber(
        analytics.livelihood_score ?? vulnerability.livelihood_score
      ),
    },
    environment: {
      solid_biomass_fuel_pct: safeNumber(secEnv.solid_biomass_fuel_pct),
      solar_lighting_pct: safeNumber(secEnv.solar_lighting_pct),
      electricity_lighting_pct: safeNumber(secEnv.electricity_lighting_pct),
      current_temp_c: safeNumber(secEnv.current_temp_c),
      forecast_7d_rain_mm: safeNumber(secEnv.forecast_7d_rain_mm),
      avg_solar_radiation_mj_m2: safeNumber(secEnv.avg_solar_radiation_mj_m2),
      pm2_5: safeNumber(secEnv.pm2_5),
      us_aqi: safeNumber(secEnv.us_aqi),
      nearest_env_km: safeNumber(secEnv.nearest_env_km),
      nearest_env_name: String(secEnv.nearest_env_name ?? "Ecological Asset"),
      environment_score: safeNumber(
        analytics.environment_score ??
          vulnerability.environment_score ??
          secEnv.score
      ),
    },
    demography: {
      female_share: safeNumber(analytics.female_share),
      sc_percent: safeNumber(analytics.sc_percent),
      st_percent: safeNumber(analytics.st_percent),
      child_0_6_percent: childPopulationPercent,
      demographic_vulnerability: safeNumber(
        analytics.demographic_vulnerability
      ),
    },
    vulnerability: {
      vulnerability_index: safeNumber(
        analytics.vulnerability_index
      ),
      vulnerability_level: String(
        analytics.vulnerability_level ?? ""
      ),
      vvi_v2: vvi,
      vvi_v2_level: String(analytics.vvi_v2_level ?? ""),
    },
    jan_drishti: {
      education_score: safeNumber(
        analytics.education_score ?? vulnerability.education_score
      ),
      health_score: safeNumber(
        analytics.health_score ?? vulnerability.health_score ?? secHea.score
      ),
      water_score: safeNumber(
        analytics.water_score ?? vulnerability.water_score ?? secWat.score
      ),
      livelihood_score: safeNumber(
        analytics.livelihood_score ?? vulnerability.livelihood_score
      ),
      environment_score: safeNumber(
        analytics.environment_score ??
          vulnerability.environment_score ??
          secEnv.score
      ),
      overall_score: safeNumber(
        vulnerability.jan_drishti_score ??
          vulnerability.overall_score ??
          analytics.overall_score
      ),
    },
    gis: {
      available: Boolean(spatial.geometry),
      lat: safeNumber(spatial.lat),
      lon: safeNumber(spatial.lon),
      area_sq_km: safeNumber(spatial.area_sq_km),
      mandal_code: rawMandalCode,
      geometry: spatial.geometry,
    },
  };
}

function toSectorInsightsVillage(v: VillageData | null): SectorInsightsVillage | null {
  if (!v) return null;
  return {
    villageCode: v.profile.village_code,
    villageName: v.profile.village_name,
    mandalName: v.profile.mandal_name,
    districtName: v.profile.district_name,
    districtCode: String(v.profile.district_code ?? "").split(" ")[0].trim().padStart(2, "0"),
    lat: v.gis.lat || undefined,
    lon: v.gis.lon || undefined,
    population: v.population.total,
    households: v.population.households,
    areaSqKm: v.gis.area_sq_km,
    overallScore: v.jan_drishti.overall_score,
    vvi: v.vulnerability.vvi_v2,
    vviLevel: v.vulnerability.vvi_v2_level,
    geometry: v.gis.geometry,
    education: {
      score: v.jan_drishti.education_score,
      literacyRate: v.education.literacy_rate,
      femaleLiteracyRate: v.education.female_literacy_rate,
      nearestSchoolKm: v.education.nearest_school_km,
      nearestSchoolName: v.education.nearest_school_name,
    },
    health: {
      score: v.jan_drishti.health_score,
      latrineWithinPct: v.health.latrine_within_pct,
      openDefecationPct: v.health.open_defecation_pct ?? 55,
      cleanCookingFuelPct: v.health.clean_cooking_fuel_pct,
      closedDrainagePct: v.health.closed_drainage_pct,
      nearestHealthKm: v.health.nearest_health_km,
      nearestHealthName: v.health.nearest_health_name,
    },
    water: {
      score: v.jan_drishti.water_score,
      tapWaterTotalPct: v.water.tap_water_total_pct,
      treatedTapPct: v.water.treated_tap_pct,
      waterWithinPremisesPct: v.water.water_within_premises_pct,
      tanksTotal: v.water.tanks_total,
      tanksGt40Ha: v.water.tanks_gt_40ha ?? 0,
      tankDensity: v.water.tank_density_per_10sqkm,
      nearestWaterKm: v.water.nearest_water_km,
      nearestWaterName: v.water.nearest_water_name,
    },
    livelihood: {
      score: v.jan_drishti.livelihood_score,
      wpr: v.livelihood.worker_participation_rate,
      marginalWorkerPct: v.livelihood.marginal_worker_percent,
      bankingAccessPct: v.livelihood.banking_access_pct,
      nearestLivelihoodKm: v.livelihood.nearest_livelihood_km,
      nearestLivelihoodName: v.livelihood.nearest_livelihood_name,
    },
    environment: {
      score: v.jan_drishti.environment_score,
      solidBiomassPct: v.environment.solid_biomass_fuel_pct,
      solarLightingPct: v.environment.solar_lighting_pct,
      avgSolarMj: v.environment.avg_solar_radiation_mj_m2,
      currentTempC: v.environment.current_temp_c,
      forecastRainMm: v.environment.forecast_7d_rain_mm ?? 6.5,
      pm25: v.environment.pm2_5,
      usAqi: v.environment.us_aqi,
    },
  };
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function Home() {
  const [intro, setIntro] = useState(true);

  const [section, setSection] =
    useState<Section>("overview");

  const [panel, setPanel] =
    useState<Panel | null>(null);

  const [transition, setTransition] =
    useState(false);

  const [transitionMode, setTransitionMode] =
    useState<TransitionMode>("section");

  const transitionTimers = useRef<number[]>([]);

  const [apiStatus, setApiStatus] =
    useState<"checking" | "online" | "offline">("checking");

  const [villageSearch, setVillageSearch] =
    useState("");

  const [searchResults, setSearchResults] =
    useState<VillageSearchResult[]>([]);

  const [searching, setSearching] =
    useState(false);

  const [selectedVillage, setSelectedVillage] =
    useState<VillageData | null>(null);

  const [selectedVillageCode, setSelectedVillageCode] =
    useState<string | null>(null);

  const [villageLoading, setVillageLoading] =
    useState(false);

  const [villageError, setVillageError] =
    useState("");

  const [agentResult, setAgentResult] =
    useState<AgentResult | null>(null);

  const [agentRunning, setAgentRunning] =
    useState(false);

  const [featuredVillages, setFeaturedVillages] = useState<
    VillageSearchResult[]
  >([]);

  const [readinessChecks, setReadinessChecks] = useState<
    Record<string, boolean>
  >({});

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [lang, setLang] = useState<LanguageCode>("en");
  const [stateInsights, setStateInsights] = useState<StateInsightsPayload | null>(null);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIntro(false);
    }, 1400);

    void loadVillageGIS(`${API_BASE}/gis/villages?limit=350`).catch(
      (error: unknown) => {
        console.error("Unable to preload village GIS data.", error);
      }
    );

    fetch(`${API_BASE}/villages/featured`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return;
        const payload = await res.json();
        const list = Array.isArray(payload?.results) ? payload.results : [];
        setFeaturedVillages(list);
        if (list.length > 0 && list[0]?.village_code) {
          void loadVillage(String(list[0].village_code), true);
        }
      })
      .catch(() => {
        // Ignore featured fetch errors
      });

    fetch(`${API_BASE}/state/insights`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return;
        const payload = await res.json();
        setStateInsights(payload);
      })
      .catch(() => {
        // Ignore insights fetch errors
      });

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("API unavailable");
        setApiStatus("online");
      })
      .catch(() => setApiStatus("offline"));
  }, []);

  function toggleReadinessCheck(key: string) {
    setReadinessChecks((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  async function searchVillages(value: string) {
    setVillageSearch(value);
    setVillageError("");

    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);

      const response = await fetch(
        `${API_BASE}/villages/search?name=${encodeURIComponent(value)}`
      );

      if (!response.ok) {
        throw new Error("Village search failed.");
      }

      const data = await response.json();

      setSearchResults(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
          ? data.results
          : []
      );
    } catch (error) {
      setSearchResults([]);

      setVillageError(
        error instanceof Error
          ? error.message
          : "Village search failed."
      );
    } finally {
      setSearching(false);
    }
  }

  async function loadVillage(villageCode: string, keepPanel = false) {
    try {
      setVillageLoading(true);
      setVillageError("");
      setSearchResults([]);

      const response = await fetch(
        `${API_BASE}/villages/${encodeURIComponent(villageCode)}`
      );

      if (!response.ok) {
        throw new Error(
          "Village intelligence could not be loaded."
        );
      }

      const data = normalizeVillageData(await response.json());

      if (!data.profile.village_code) {
        throw new Error(
          "Village intelligence response is missing its village code."
        );
      }

      setSelectedVillage(data);
      setSelectedVillageCode(
        data.profile.village_code
      );
      setVillageSearch(data.profile.village_name);
      if (!keepPanel) setPanel(null);
      setAgentResult(null);
    } catch (error) {
      setVillageError(
        error instanceof Error
          ? error.message
          : "Unable to load village intelligence."
      );
    } finally {
      setVillageLoading(false);
    }
  }

  async function runAgent(
    query: string,
    currentSection: Section = section
  ) {
    if (!query.trim() || agentRunning) return;

    const villageCode =
      selectedVillageCode ||
      selectedVillage?.profile.village_code;

    if (!villageCode) {
      setAgentResult({
        query,
        error:
          "Select a village from search or the GIS map before running development intelligence.",
      });
      return;
    }

    try {
      setAgentRunning(true);
      setAgentResult(null);

      const response = await fetch(
        `${API_BASE}/ai/agent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `${query.trim()}\n\nFocus: ${currentSection === "overview" ? "development" : currentSection}. Prepare a draft committee-style evidence review and policy options with relevant official scheme references where supported. Clearly separate observed data, screening, future readiness horizons, recommendations, and missing evidence. Do not claim scheme eligibility, coverage, or approvals.`,
            village_code: String(villageCode),
          }),
        }
      );

      const raw = await response.text();

      let data: AgentResult;

      try {
        data = raw
          ? JSON.parse(raw)
          : {};
      } catch {
        data = {
          error:
            raw ||
            "AI engine returned an unreadable response.",
        };
      }

      if (!response.ok || data.error) {
        throw new Error(
          data.error ||
            extractText(data.detail) ||
            `AI engine request failed (${response.status}).`
        );
      }

      const outputs = asRecord(data.outputs);
      const rawAnalysis = asRecord(outputs.analysis ?? data.analysis);

      const analysisError =
        outputs.analysis_error ?? data.analysis_error;

      if (analysisError) {
        throw new Error(String(analysisError));
      }

      /*
       * JAN-DRISHTI AI ENGINE
       * Backend contract:
       *
       * outputs.analysis
       * ├── data
       * ├── statistics
       * ├── ml_risk_screening
       * ├── gis_intelligence
       * ├── sdg_intelligence
       * ├── development_gaps
       * ├── recommended_actions
       * ├── dashboard
       * ├── report
       * └── policy
       */

      const analysisData = asRecord(rawAnalysis.data);
      const statistics = asRecord(rawAnalysis.statistics);
      const riskScreening =
        outputs.risk_prediction ?? rawAnalysis.ml_risk_screening;
      const gisIntelligence =
        outputs.gis ?? rawAnalysis.gis_intelligence;
      const sdgIntelligence =
        outputs.sdg_alignment ?? rawAnalysis.sdg_intelligence;
      const developmentGaps =
        outputs.development_gaps ?? rawAnalysis.development_gaps;
      const recommendedActions =
        outputs.recommended_actions ?? rawAnalysis.recommended_actions;
      const dashboard =
        outputs.big_dashboard ?? rawAnalysis.dashboard;
      const report = outputs.report ?? rawAnalysis.report;
      const policy = outputs.policy ?? rawAnalysis.policy;

      const analysis = {
        data: analysisData,
        statistics,
        ml_risk_screening: riskScreening,
        gis_intelligence: gisIntelligence,
        sdg_intelligence: sdgIntelligence,
        development_gaps: developmentGaps,
        recommended_actions: recommendedActions,
        dashboard,
        report,
        policy,
      };

      setAgentResult({
        query: query.trim(),
        village_code: data.village_code ?? String(villageCode),
        analysis,
        village: analysisData,
        statistics,
        gis: gisIntelligence,
        sdg: sdgIntelligence,
        risk: riskScreening,
        gaps: developmentGaps,
        actions: recommendedActions,
        big_dashboard: dashboard,
        policy,
        report,
        reasoning: outputs.reasoning ?? data.reasoning,
        evidence_chain: data.evidence_chain ?? [],
        agents: asRecord(data.agents ?? data.execution_summary),
      });
    } catch (error) {
      setAgentResult({
        query,
        village_code:
          selectedVillageCode ||
          selectedVillage?.profile.village_code ||
          null,
        error:
          error instanceof Error
            ? error.message
            : "AI engine failed.",
      });
    } finally {
      setAgentRunning(false);
    }
  }

  function triggerTransition(
    callback: () => void,
    mode: TransitionMode = "section"
  ) {
    transitionTimers.current.forEach((timer) =>
      window.clearTimeout(timer)
    );
    setTransitionMode(mode);
    setTransition(true);

    const isCommunityCinema = mode === "community";
    const swapDelayMs = isCommunityCinema ? 1200 : 450;
    const totalDurationMs = isCommunityCinema ? 3000 : 950;

    transitionTimers.current = [
      window.setTimeout(() => {
        callback();
        if (mode === "ai") {
          window.setTimeout(() => {
            const aiPanel = document.getElementById(
              "ai-intelligence-panel"
            );

            if (aiPanel) {
              const top =
                aiPanel.getBoundingClientRect().top +
                window.scrollY -
                88;

              window.scrollTo({
                top: Math.max(0, top),
                behavior: "smooth",
              });
            }
          }, 80);
        }
      }, swapDelayMs),
      window.setTimeout(() => {
        setTransition(false);
        transitionTimers.current = [];
      }, totalDurationMs),
    ];
  }

  function changeSection(next: Section, initialPanel: Panel | null = null) {
    if (next === section && panel === initialPanel && section !== "overview") {
      return;
    }

    const mode: TransitionMode =
      next === "community" ? "community" : initialPanel ?? "section";

    triggerTransition(
      () => {
        setSection(next);
        setPanel(initialPanel);
      },
      mode
    );
  }

  function openPanel(next: Panel) {
    triggerTransition(() => {
      setPanel(next);
    }, next);
  }

  function launchReadinessReview(domain: FutureReadinessDomain) {
    const prompt = FUTURE_READINESS[domain].aiPrompt;
    triggerTransition(() => {
      setSection(domain);
      setPanel("ai");
      void runAgent(prompt, domain);
    }, "ai");
  }

  if (intro) {
    return (
      <IntroSequence
        onSkip={() => setIntro(false)}
      />
    );
  }

  const config = DOMAINS[section];
  const t = UI_TRANSLATIONS[lang];
  const insightsVillage = toSectorInsightsVillage(selectedVillage);

  return (
    <>
      <main className="jd-shell relative min-h-screen bg-[#05080d] text-white overflow-x-hidden">
        {/* Subtle Moving Multi-Sector Ambient Background + Large Viksit Bharat @2047 Backdrop */}
        <div
          className="ambient-bg-canvas fixed inset-0 z-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          <div className="ambient-bg-wash" />
          <div className="ambient-bg-orb ambient-bg-orb-1" />
          <div className="ambient-bg-orb ambient-bg-orb-2" />
          <div className="ambient-bg-orb ambient-bg-orb-3" />
        </div>

        {transition && (
          <CinematicTransition
            config={config}
            mode={transitionMode}
            onSkip={() => {
              transitionTimers.current.forEach((t) => window.clearTimeout(t));
              transitionTimers.current = [];
              if (transitionMode === "community") {
                setSection("community");
                setPanel(null);
              }
              setTransition(false);
            }}
          />
        )}

        {/* =================================================
            TOP BAR
        ================================================= */}

        <header className="jd-topbar fixed top-0 left-0 right-0 z-40 h-[72px] border-b border-white/10 bg-[#05080d]/95 backdrop-blur-xl">
          <div
            className="absolute inset-x-0 top-0 h-[2px]"
            style={{
              background:
                "linear-gradient(90deg, #ff9933 0%, #ef4444 22%, #10b981 45%, #06b6d4 68%, #ec4899 85%, #84cc16 100%)",
            }}
          />

          <div className="h-full px-6 flex items-center justify-between gap-6">

            <div className="flex items-center gap-6 shrink-0">

              <button
                onClick={() =>
                  changeSection("overview")
                }
                className="font-samarkan text-[28px] sm:text-[32px] whitespace-nowrap shrink-0 flex items-center gap-1 group"
              >
                <span className="bg-gradient-to-r from-[#ff9933] via-amber-200 to-white bg-clip-text text-transparent">
                  Jan
                </span>
                <span className="font-sans text-lg font-light text-orange-400 mx-0.5">
                  —
                </span>
                <span className="bg-gradient-to-r from-white via-emerald-200 to-[#22c55e] bg-clip-text text-transparent">
                  Drishti
                </span>
              </button>

            </div>

            {/* SEARCH */}

            <div className="relative hidden md:block w-[340px]">

              <div className="flex items-center gap-2 px-3.5 py-2 border border-white/15 bg-white/[0.03] focus-within:border-orange-300/45 transition">

                {searching ? (
                  <Loader2
                    size={14}
                    className="animate-spin text-orange-300 shrink-0"
                  />
                ) : (
                  <Search
                    size={14}
                    className="text-orange-300/75 shrink-0"
                  />
                )}

                <input
                  value={villageSearch}
                  onChange={(e) =>
                    searchVillages(e.target.value)
                  }
                  placeholder={t.searchPlaceholder}
                  className="w-full bg-transparent outline-none text-xs text-white placeholder:text-white/40"
                />

                {villageSearch && (
                  <button
                    onClick={() => {
                      setVillageSearch("");
                      setSearchResults([]);
                      setSelectedVillage(null);
                      setSelectedVillageCode(null);
                      setAgentResult(null);
                    }}
                    className="text-white/35 hover:text-white shrink-0"
                    aria-label="Clear village search"
                  >
                    <X size={13} />
                  </button>
                )}

              </div>

              {searchResults.length > 0 && (
                <div className="absolute top-[46px] left-0 right-0 border border-white/15 bg-[#080d14] shadow-2xl overflow-hidden z-50">

                  <div className="px-4 py-2.5 border-b border-white/10 text-[10px] font-medium text-orange-300/80">
                    Telangana Village Search Results
                  </div>

                  {searchResults
                    .slice(0, 8)
                    .map((village) => (
                      <button
                        key={village.village_code}
                        onClick={() =>
                          loadVillage(
                            village.village_code,
                            panel === "ai" || panel === "readiness"
                          )
                        }
                        className="w-full px-4 py-3.5 text-left border-b border-white/5 hover:bg-white/[0.05] transition"
                      >

                        <div className="flex items-center justify-between">

                          <span className="text-sm font-medium text-white/90">
                            {village.area_name}
                          </span>

                          <ChevronRight
                            size={14}
                            className="text-orange-300/60"
                          />

                        </div>

                        <div className="mt-1.5 font-mono text-[11px] tabular-nums text-white/45">
                          Pop{" "}
                          {safeNumber(
                            village.total_population
                          ).toLocaleString()}
                          {" · "}
                          Literacy{" "}
                          {formatValue(
                            village.literacy_rate
                          )}
                          %
                          {" · "}
                          VVI{" "}
                          {formatValue(
                            village.vvi_v2
                          )}
                        </div>

                      </button>
                    ))}

                </div>
              )}

            </div>

            <div className="flex items-center gap-2.5 shrink-0">

              <div className="hidden xl:flex items-center gap-2 text-xs text-white/60 whitespace-nowrap mr-1">

                <span
                  className={`h-2 w-2 rounded-full ${
                    apiStatus === "online"
                      ? "bg-emerald-400"
                      : apiStatus === "offline"
                      ? "bg-red-400"
                      : "bg-amber-400"
                  }`}
                />

                <span>
                  {apiStatus === "online"
                    ? t.backendOnline
                    : apiStatus === "offline"
                    ? t.backendOffline
                    : t.checkingBackend}
                </span>

              </div>

              {/* Language Switcher: English / Telugu / Hindi */}
              <div
                className="flex items-center border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-white/[0.04] p-0.5 shrink-0"
                role="group"
                aria-label="Language selector"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLang(opt.id)}
                    className={`px-2 py-1 text-[11px] font-medium transition whitespace-nowrap ${
                      lang === opt.id
                        ? "bg-orange-600 text-white"
                        : "text-slate-700 dark:text-white/65 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {opt.native}
                  </button>
                ))}
              </div>

              {/* Light / Dark Theme Toggle */}
              <button
                type="button"
                onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
                aria-label="Toggle light and dark theme"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] transition text-xs font-medium text-slate-800 dark:text-white whitespace-nowrap shrink-0"
              >
                {theme === "dark" ? (
                  <>
                    <Sun size={13} className="text-amber-300" />
                    <span className="hidden sm:inline">{t.lightMode}</span>
                  </>
                ) : (
                  <>
                    <Moon size={13} className="text-slate-700" />
                    <span className="hidden sm:inline">{t.darkMode}</span>
                  </>
                )}
              </button>

              <button
                onClick={() =>
                  openPanel("ai")
                }
                type="button"
                aria-label="Open AI intelligence"
                className="jd-keep-dark flex items-center gap-2 px-3.5 py-2 border border-orange-400/40 bg-gradient-to-r from-orange-600 via-pink-600 to-cyan-600 hover:brightness-110 transition text-xs font-medium text-white whitespace-nowrap shrink-0"
              >
                <Brain size={14} className="text-amber-200" />
                <span>{t.aiIntelligence}</span>
              </button>

            </div>

          </div>
        </header>

        {/* =================================================
            COLOURFUL SECTOR SIDEBAR
        ================================================= */}

        <aside className="jd-sidebar fixed left-0 top-[72px] bottom-0 z-30 w-[235px] border-r border-white/12 bg-gradient-to-b from-[#080d16] via-[#070b12] to-[#050910] px-3.5 py-6 hidden md:flex flex-col overflow-y-auto">

          <div className="px-3 mb-2.5 text-[11px] font-semibold tracking-wide text-orange-300/85">
            {t.developmentSectors}
          </div>

          <NavButton
            active={section === "overview"}
            icon={<Network size={16} />}
            label={translateDomainLabel("overview", lang, "Overview")}
            accentColor="#ff9933"
            onClick={() =>
              changeSection("overview")
            }
          />

          <NavButton
            active={section === "community"}
            icon={<Users size={16} />}
            label="Community Development"
            accentColor="#f97316"
            badge="Action Hub"
            onClick={() =>
              changeSection("community")
            }
          />

          <NavButton
            active={section === "education"}
            icon={<GraduationCap size={16} />}
            label={translateDomainLabel("education", lang, "Education")}
            accentColor="#ef4444"
            badge="SDG 04"
            onClick={() =>
              changeSection("education")
            }
          />

          <NavButton
            active={section === "health"}
            icon={<HeartPulse size={16} />}
            label={translateDomainLabel("health", lang, "Health")}
            accentColor="#10b981"
            badge="Readiness"
            onClick={() =>
              changeSection("health")
            }
          />

          <NavButton
            active={section === "water"}
            icon={<Droplets size={16} />}
            label={translateDomainLabel("water", lang, "Water")}
            accentColor="#06b6d4"
            badge="Readiness"
            onClick={() =>
              changeSection("water")
            }
          />

          <NavButton
            active={section === "livelihood"}
            icon={<BriefcaseBusiness size={16} />}
            label={translateDomainLabel("livelihood", lang, "Livelihood")}
            accentColor="#ec4899"
            badge="SDG 08"
            onClick={() =>
              changeSection("livelihood")
            }
          />

          <NavButton
            active={section === "environment"}
            icon={<Leaf size={16} />}
            label={translateDomainLabel("environment", lang, "Environment")}
            accentColor="#84cc16"
            badge="Readiness"
            onClick={() =>
              changeSection("environment")
            }
          />

          <div className="mt-5 border-t border-white/10 pt-4">
            <div className="px-3 mb-2 text-[11px] font-semibold tracking-wide text-cyan-300/85">
              {t.futureReadiness}
            </div>
            <div className="space-y-1.5">
              {FUTURE_READINESS_DOMAINS.map((domainKey) => {
                const item = DOMAINS[domainKey];
                const Icon = item.icon;
                const isActive =
                  section === domainKey && panel === "readiness";
                const rColor =
                  domainKey === "health"
                    ? "#10b981"
                    : domainKey === "water"
                    ? "#06b6d4"
                    : "#84cc16";
                return (
                  <button
                    key={domainKey}
                    type="button"
                    onClick={() => changeSection(domainKey, "readiness")}
                    style={{
                      borderColor: isActive ? `${rColor}70` : `${rColor}22`,
                      background: isActive
                        ? `linear-gradient(90deg, ${rColor}28, ${rColor}08)`
                        : `linear-gradient(90deg, ${rColor}0d, transparent)`,
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left text-xs transition border hover:brightness-125"
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <span
                        className="flex h-6 w-6 items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${rColor}20`,
                          color: rColor,
                        }}
                      >
                        <Icon size={13} />
                      </span>
                      <span
                        className={`truncate font-medium ${
                          isActive ? "text-white" : "text-white/80"
                        }`}
                      >
                        {item.shortTitle} Readiness
                      </span>
                    </span>
                    <Compass
                      size={12}
                      className="shrink-0"
                      style={{ color: rColor }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 border-t border-white/10 pt-4 space-y-2 px-3">
            <div className="mb-1 text-[10px] font-semibold text-white/45">
              Intelligence Layers
            </div>

            <SidebarSignal
              icon={<Target size={13} />}
              text="SDG Alignment"
              color="#ff9933"
            />

            <SidebarSignal
              icon={<Globe2 size={13} />}
              text="GIS + Satellite Ortho"
              color="#06b6d4"
            />

            <SidebarSignal
              icon={<TrendingUp size={13} />}
              text="Longitudinal Trends"
              color="#ec4899"
            />

            <SidebarSignal
              icon={<BookOpen size={13} />}
              text="Ancient Wisdom"
              color="#f59e0b"
            />

            <SidebarSignal
              icon={<FileText size={13} />}
              text="AI Policy Charters"
              color="#10b981"
            />

          </div>

          {selectedVillage && (
            <div
              className="mt-auto pt-4"
            >
              <div
                className="relative overflow-hidden border border-orange-300/30 p-3.5"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,153,51,0.14), rgba(6,182,212,0.10), rgba(16,185,129,0.10))",
                }}
              >
                <div
                  className="absolute inset-x-0 top-0 h-[2px]"
                  style={{
                    background:
                      "linear-gradient(90deg, #ff9933, #06b6d4, #10b981)",
                  }}
                />
                <div className="text-[10px] font-semibold text-orange-300">
                  Active Telangana Village
                </div>

                <div className="mt-1 text-sm font-semibold text-white truncate">
                  {selectedVillage.profile.village_name}
                </div>

                <div className="mt-0.5 text-[11px] text-cyan-200/75 truncate">
                  {selectedVillage.profile.mandal_name} · {selectedVillage.profile.district_name}
                </div>

                <div className="mt-1 font-mono text-[10px] tabular-nums text-white/55">
                  Code {selectedVillage.profile.village_code}
                </div>
              </div>
            </div>
          )}

        </aside>

        {/* =================================================
            MAIN
        ================================================= */}

        <section className="relative z-10 pt-[72px] md:pl-[235px] min-h-screen">
          {/* Mobile Quick Switcher (Overview, Community Development, 5 Sectors) */}
          <div className="md:hidden flex items-center gap-1.5 overflow-x-auto border-b border-white/10 bg-[#060a12] px-4 py-2">
            {(["overview", "community", ...DOMAIN_ORDER] as Section[]).map((tabKey) => (
              <button
                key={tabKey}
                type="button"
                onClick={() => changeSection(tabKey)}
                className={`px-3 py-1.5 text-xs font-medium border whitespace-nowrap ${
                  section === tabKey
                    ? "border-orange-400 bg-orange-600 text-white"
                    : "border-white/15 bg-white/[0.03] text-white/70"
                }`}
              >
                {DOMAINS[tabKey].shortTitle}
              </button>
            ))}
          </div>

          {section === "overview" ? (
            <OverviewScreen
              onSection={(next, initialPanel) =>
                changeSection(next, initialPanel)
              }
              onAI={() => openPanel("ai")}
              onGeneratePolicy={() => {
                openPanel("ai");
                void runAgent(
                  "Prepare a comprehensive 5-sector development intelligence review, multi-tier benchmark analysis, and village-specific Telangana & Central scheme policy formulation.",
                  "overview"
                );
              }}
              aiPanelOpen={panel === "ai"}
              agentRunning={agentRunning}
              onRunAI={(query) => runAgent(query, "overview")}
              selectedVillage={selectedVillage}
              featuredVillages={featuredVillages}
              onSelectVillage={(code) => loadVillage(code, true)}
              agentResult={agentResult}
              readinessChecks={readinessChecks}
              onToggleReadinessCheck={toggleReadinessCheck}
              onLaunchReadinessReview={launchReadinessReview}
              lang={lang}
              stateInsights={stateInsights}
              insightsVillage={insightsVillage}
            />
          ) : section === "community" ? (
            <CommunityDevelopmentHub
              activeVillageName={selectedVillage?.profile.village_name ?? "Telangana Ward"}
              activeMandalName={selectedVillage?.profile.mandal_name ?? "Mandal HQ"}
              activeDistrictName={selectedVillage?.profile.district_name ?? "Medak"}
              activeVillageCode={selectedVillage?.profile.village_code}
              activeVillageType={selectedVillage?.profile.type}
              activeNearestSchool={selectedVillage?.education.nearest_school_name}
              activeNearestHealth={selectedVillage?.health.nearest_health_name}
              activeLat={selectedVillage?.gis.lat}
              activeLon={selectedVillage?.gis.lon}
              sectorScores={
                selectedVillage
                  ? {
                      health: Math.round(selectedVillage.jan_drishti.health_score),
                      education: Math.round(selectedVillage.jan_drishti.education_score),
                      water: Math.round(selectedVillage.jan_drishti.water_score),
                      livelihood: Math.round(selectedVillage.jan_drishti.livelihood_score),
                      environment: Math.round(selectedVillage.jan_drishti.environment_score),
                      overall: Math.round(selectedVillage.jan_drishti.overall_score),
                    }
                  : undefined
              }
            />
          ) : (
            <DomainScreen
              section={section}
              config={config}
              panel={panel}
              onPanel={openPanel}
              selectedVillage={selectedVillage}
              featuredVillages={featuredVillages}
              villageLoading={villageLoading}
              villageError={villageError}
              agentResult={agentResult}
              agentRunning={agentRunning}
              onSelectVillage={(code) => loadVillage(code, true)}
              onRunAgent={(query) =>
                runAgent(query, section)
              }
              readinessChecks={readinessChecks}
              onToggleReadinessCheck={toggleReadinessCheck}
              onLaunchReadinessReview={launchReadinessReview}
              lang={lang}
              stateInsights={stateInsights}
              insightsVillage={insightsVillage}
            />
          )}

        </section>

      </main>

      <CinematicStyles />
    </>
  );
}

/* =========================================================
   OPENING INTRO
========================================================= */

function IntroSequence({
  onSkip,
}: {
  onSkip: () => void;
}) {
  return (
    <main className="opening-intro fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-[#04070d] px-6 text-center text-white">
      <div className="opening-intro-halo" aria-hidden="true" />
      <div className="opening-intro-prism" aria-hidden="true" />
      <div className="opening-intro-grid" aria-hidden="true" />
      <div className="opening-intro-content relative z-10">
        <p className="text-xs font-medium tracking-[0.22em] text-amber-200/80">
          Telangana Multi-Sector Development Intelligence
        </p>
        <h1 className="font-samarkan mt-5 text-6xl sm:text-8xl">
          <span className="bg-gradient-to-r from-[#ff9933] via-amber-200 to-white bg-clip-text text-transparent">
            Jan
          </span>
          <span className="font-sans text-4xl sm:text-6xl font-light text-orange-400 mx-2">
            —
          </span>
          <span className="bg-gradient-to-r from-white via-cyan-200 to-[#10b981] bg-clip-text text-transparent">
            Drishti
          </span>
        </h1>
        <div className="mx-auto mt-7 h-[3px] w-56 overflow-hidden bg-white/10">
          <div className="opening-intro-tricolor h-full w-full" />
        </div>
        <p className="mt-6 text-xs tracking-[0.16em] text-white/70">
          Observe · Analyse · Understand · Prepare
        </p>
        <p className="mt-2.5 text-xs text-cyan-200/55">
          5-Sector GIS · Satellite Ortho · Longitudinal Analytics · Ancient Wisdom · Gemini AI
        </p>
      </div>

      <button
        onClick={onSkip}
        className="absolute bottom-7 right-7 z-30 border border-white/15 bg-white/[0.05] px-4 py-2 text-xs text-white/75 transition hover:border-orange-300/40 hover:text-white"
      >
        Skip Intro
      </button>
    </main>
  );
}

/* =========================================================
   HIGH-CRAFT MULTI-CHROMATIC CINEMATIC TRANSITION
========================================================= */

function CinematicTransition({
  config,
  mode,
  onSkip,
}: {
  config: DomainConfig;
  mode: TransitionMode;
  onSkip?: () => void;
}) {
  const Icon = config.icon;
  const domainKey = config.shortTitle.toLowerCase();

  if (mode === "community") {
    return (
      <div
        className="cinematic-transition fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#04070d]/97 backdrop-blur-xl"
        data-transition-mode="community"
        role="status"
        aria-live="polite"
      >
        {/* Tricolor Aurora Ambient Field */}
        <div
          className="cinematic-prism-aurora absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(circle at 26% 30%, rgba(255, 153, 51, 0.22) 0%, transparent 48%),
              radial-gradient(circle at 74% 68%, rgba(16, 185, 129, 0.22) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.14) 0%, transparent 56%)
            `,
          }}
          aria-hidden="true"
        />

        {/* Top & Bottom Tricolor Framing Bars */}
        <div
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{
            background: "linear-gradient(90deg, #ff9933, #ffffff, #10b981)",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[3px]"
          style={{
            background: "linear-gradient(90deg, #10b981, #ffffff, #ff9933)",
          }}
          aria-hidden="true"
        />

        {/* INDIA MAP DIRECTLY BEHIND THE CENTERED TEXT */}
        <div
          className="absolute inset-0 z-0 flex items-center justify-center opacity-80"
          aria-hidden="true"
        >
          <IndiaMapTransitionBackdrop />
        </div>

        {/* Radial Soft Scrim for High Legibility Over India Map */}
        <div
          className="absolute inset-0 z-[5] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(4,7,13,0.72) 0%, rgba(4,7,13,0.35) 52%, rgba(4,7,13,0.78) 100%)",
          }}
          aria-hidden="true"
        />

        {/* Centered Headline Text Over India Map */}
        <div className="cinematic-transition-content relative z-10 max-w-4xl px-6 text-center flex flex-col items-center">
          <div className="text-xs sm:text-sm font-mono tracking-[0.26em] uppercase text-amber-300">
            Jan—Drishti · Viksit Bharat @ 2047
          </div>

          <h2 className="mt-4 text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.08] drop-shadow-[0_8px_28px_rgba(0,0,0,0.95)] text-balance">
            <span className="bg-gradient-to-r from-[#ff9933] via-white to-[#10b981] bg-clip-text text-transparent">
              Participatory Governance
            </span>
            <br />
            <span className="text-white">for Viksit Bharat</span>
          </h2>

          <p className="mt-4 text-xs sm:text-sm text-slate-200 max-w-xl leading-relaxed">
            Citizen Engagement · Civic Tech · Elected Leaders&apos; Accountability · Civic Learning
          </p>

          {/* 3-Second Progress Sweep Bar */}
          <div className="mt-7 w-72 sm:w-80 space-y-2">
            <div className="h-[3px] w-full overflow-hidden bg-white/15">
              <div
                className="cinematic-progress-3s h-full w-0"
                style={{
                  background: "linear-gradient(90deg, #ff9933, #ffffff, #10b981)",
                }}
              />
            </div>
            <div className="text-[11px] font-mono text-slate-300">
              Initializing Community Development &amp; Civic Participation...
            </div>
          </div>
        </div>

        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="absolute bottom-6 right-6 z-20 border border-white/20 bg-black/50 px-3.5 py-1.5 text-xs text-slate-200 hover:text-white hover:border-amber-300/60 transition"
          >
            Enter Hub
          </button>
        )}
      </div>
    );
  }

  const palette =
    domainKey === "education"
      ? { c1: "#ef4444", c2: "#f59e0b", c3: "#fb7185" }
      : domainKey === "health"
      ? { c1: "#10b981", c2: "#06b6d4", c3: "#34d399" }
      : domainKey === "water"
      ? { c1: "#06b6d4", c2: "#3b82f6", c3: "#38bdf8" }
      : domainKey === "livelihood"
      ? { c1: "#ec4899", c2: "#f97316", c3: "#a855f7" }
      : domainKey === "environment"
      ? { c1: "#84cc16", c2: "#10b981", c3: "#eab308" }
      : { c1: "#ff9933", c2: "#06b6d4", c3: "#10b981" };

  const modeText =
    mode === "map"
      ? "Synchronising Vector GIS & Orbital Satellite Layers"
      : mode === "analytics"
      ? "Compiling Statistical & Longitudinal Trajectories"
      : mode === "ai"
      ? "Initialising Gemini Multi-Sector Policy Studio"
      : mode === "gaps"
      ? "Screening Multi-Dimensional Development Signals"
      : mode === "readiness"
      ? "Calibrating Horizon Preparedness Matrix"
      : `${config.sdg} · ${config.sdgTitle}`;

  return (
    <div
      className="cinematic-transition fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#04070d]/95 backdrop-blur-xl"
      data-transition-mode={mode}
      role="status"
      aria-live="polite"
    >
      {/* Dynamic Multi-Chromatic Aurora Backdrop */}
      <div
        className="cinematic-prism-aurora absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 24% 34%, ${palette.c1}38 0%, transparent 44%),
            radial-gradient(circle at 76% 66%, ${palette.c2}35 0%, transparent 46%),
            radial-gradient(circle at 52% 50%, ${palette.c3}24 0%, transparent 52%)
          `,
        }}
        aria-hidden="true"
      />

      {/* Sweeping Diagonal Prism Ribbons */}
      <div
        className="cinematic-ribbon-sweep absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(115deg, transparent 22%, ${palette.c1}22 42%, ${palette.c2}26 52%, ${palette.c3}1e 60%, transparent 78%)`,
        }}
        aria-hidden="true"
      />

      {/* Top & Bottom Spectrum Framing Bars */}
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{
          background: `linear-gradient(90deg, ${palette.c1}, ${palette.c2}, ${palette.c3}, #ff9933, #10b981)`,
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[3px]"
        style={{
          background: `linear-gradient(90deg, #10b981, ${palette.c3}, ${palette.c2}, ${palette.c1})`,
        }}
        aria-hidden="true"
      />

      <div className="cinematic-transition-content relative z-10 flex flex-col items-center px-6 text-center">
        {/* Counter-Rotating Multi-Coloured Geometric Mandala / Chakra */}
        <div className="relative flex h-28 w-28 items-center justify-center">
          <div
            className="absolute inset-0 rounded-full blur-xl opacity-55"
            style={{
              background: `conic-gradient(from 0deg, ${palette.c1}, ${palette.c2}, ${palette.c3}, ${palette.c1})`,
            }}
          />

          <svg
            className="cinematic-transition-chakra absolute inset-0 h-full w-full"
            viewBox="0 0 120 120"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="prismGradOuter" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={palette.c1} />
                <stop offset="50%" stopColor={palette.c2} />
                <stop offset="100%" stopColor={palette.c3} />
              </linearGradient>
            </defs>
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="url(#prismGradOuter)"
              strokeWidth="2"
              strokeDasharray="14 8"
            />
            <polygon
              points="60,12 102,36 102,84 60,108 18,84 18,36"
              fill="none"
              stroke={palette.c2}
              strokeOpacity="0.45"
              strokeWidth="1.2"
            />
          </svg>

          <svg
            className="cinematic-transition-reverse absolute inset-2 h-[calc(100%-16px)] w-[calc(100%-16px)]"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={palette.c3}
              strokeWidth="1.6"
              strokeDasharray="6 6"
            />
          </svg>

          <div
            className="relative flex h-16 w-16 items-center justify-center rounded-full border bg-[#05080f]/90 shadow-2xl"
            style={{
              borderColor: `${palette.c1}80`,
              boxShadow: `0 0 28px ${palette.c1}45`,
              color: palette.c1,
            }}
          >
            <Icon size={26} strokeWidth={1.6} />
          </div>
        </div>

        <div className="font-samarkan mt-6 text-3xl sm:text-4xl tracking-normal">
          <span style={{ color: palette.c1 }}>Jan</span>
          <span className="font-sans text-xl text-white/50 mx-1.5">—</span>
          <span style={{ color: palette.c2 }}>Drishti</span>
        </div>

        <span className="mt-2 text-sm font-semibold text-white">
          {config.title}
        </span>

        <span
          className="mt-1.5 text-xs font-medium"
          style={{ color: palette.c2 }}
        >
          {modeText}
        </span>

        {/* Animated 5-Sector Chromatic Progress Ribbon */}
        <div className="mt-5 h-[3px] w-56 overflow-hidden bg-white/10">
          <div
            className="cinematic-progress-sweep h-full w-full"
            style={{
              background: `linear-gradient(90deg, ${palette.c1}, ${palette.c2}, ${palette.c3}, #ff9933)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   OVERVIEW SCREEN
========================================================= */

function OverviewScreen({
  onSection,
  onAI,
  onGeneratePolicy,
  aiPanelOpen,
  agentRunning,
  onRunAI,
  selectedVillage,
  featuredVillages,
  onSelectVillage,
  agentResult,
  readinessChecks,
  onToggleReadinessCheck,
  onLaunchReadinessReview,
  lang,
  stateInsights,
  insightsVillage,
}: {
  onSection: (section: Section, initialPanel?: Panel | null) => void;
  onAI: () => void;
  onGeneratePolicy: () => void;
  aiPanelOpen: boolean;
  agentRunning: boolean;
  onRunAI: (query: string) => void;
  selectedVillage: VillageData | null;
  featuredVillages: VillageSearchResult[];
  onSelectVillage: (code: string) => void;
  agentResult: AgentResult | null;
  readinessChecks: Record<string, boolean>;
  onToggleReadinessCheck: (key: string) => void;
  onLaunchReadinessReview: (domain: FutureReadinessDomain) => void;
  lang: LanguageCode;
  stateInsights: StateInsightsPayload | null;
  insightsVillage: SectorInsightsVillage | null;
}) {
  const [cycleCinemaOpen, setCycleCinemaOpen] = useState(false);

  return (
    <div className="domain-overview-workspace min-h-screen pb-16">

      {/* HERO */}

      <section className="relative min-h-[580px] overflow-hidden border-b border-white/10 bg-[#060a10]/55">

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_45%,rgba(255,153,51,.12),transparent_38%),radial-gradient(ellipse_at_82%_65%,rgba(19,136,8,.10),transparent_42%)]" />

        <div className="absolute inset-0 overview-data-field" />

        <div className="relative z-10 max-w-7xl mx-auto px-8 py-20 grid xl:grid-cols-[1fr_320px] gap-12 items-end">

          <div className="max-w-3xl">

            {/* 100% Opacity Viksit Bharat @2047 Overview Banner */}
            <div className="mb-6 opacity-100">
              <div className="text-3xl sm:text-5xl md:text-6xl font-black tracking-[0.12em] uppercase leading-none opacity-100 bg-gradient-to-r from-[#ff9933] via-slate-900 to-[#047857] dark:from-[#ff9933] dark:via-white dark:to-[#10b981] bg-clip-text text-transparent">
                {UI_TRANSLATIONS[lang].viksitBackdrop}
              </div>
              <div className="mt-2 h-[3px] w-48 bg-gradient-to-r from-[#ff9933] via-amber-400 to-[#10b981] opacity-100" />
            </div>

            <div className="font-samarkan text-4xl sm:text-5xl mb-3">
              <span className="bg-gradient-to-r from-[#ff9933] via-amber-200 to-white bg-clip-text text-transparent">
                Jan
              </span>
              <span className="font-sans text-2xl font-light text-orange-400 mx-1.5">
                —
              </span>
              <span className="bg-gradient-to-r from-white via-cyan-200 to-[#10b981] bg-clip-text text-transparent">
                Drishti
              </span>
            </div>

            <div className="text-xs font-medium text-orange-300">
              From Growth to Spatially Grounded Development · Telangana State
            </div>

            <h2 className="mt-4 text-5xl md:text-7xl font-semibold leading-[1.02] tracking-[-0.03em] text-balance">
              Make the{" "}
              <span className="bg-gradient-to-r from-orange-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                development gap
              </span>{" "}
              visible.
            </h2>

            <p className="mt-7 max-w-2xl text-base md:text-lg leading-8 text-white/60">
              Jan—Drishti unites Telangana&apos;s multi-sector development evidence —
              population, 5-sector GIS &amp; orbital satellite footprints, longitudinal
              trajectories, civilisational wisdom, and Gemini AI policy formulation —
              into one verifiable decision-support layer.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-white/45">
              <span>Population</span>
              <span aria-hidden="true">·</span>
              <span>SDGs</span>
              <span aria-hidden="true">·</span>
              <span>GIS Boundaries</span>
              <span aria-hidden="true">·</span>
              <span>Statistics</span>
              <span aria-hidden="true">·</span>
              <span>Future Readiness</span>
              <span aria-hidden="true">·</span>
              <span>Policy Review</span>
            </div>

            <div className="mt-9 flex flex-wrap gap-3">

              <button
                onClick={onAI}
                className="group px-6 py-3 border border-orange-300/30 bg-orange-300/[0.08] hover:bg-orange-300/[0.15] transition flex items-center gap-3 text-xs font-medium text-orange-100 whitespace-nowrap"
              >
                <Brain size={15} />
                <span>Open Development AI</span>
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-1 transition"
                />
              </button>

              <a
                href="#future-readiness-segment"
                className="px-6 py-3 border border-white/15 bg-white/[0.03] hover:bg-white/[0.07] transition flex items-center gap-2.5 text-xs font-medium text-white/80 whitespace-nowrap"
              >
                <Compass size={15} className="text-cyan-300" />
                <span>Explore Future Readiness</span>
              </a>

              <button
                type="button"
                onClick={() => setCycleCinemaOpen(true)}
                className="px-6 py-3 border border-emerald-400/50 bg-gradient-to-r from-red-500/20 via-orange-500/20 to-emerald-500/25 hover:from-red-500/30 hover:to-emerald-500/35 transition flex items-center gap-2.5 text-xs font-semibold text-white whitespace-nowrap"
              >
                <Sparkles size={15} className="text-emerald-300" />
                <span>Break Vicious Cycle</span>
              </button>

              <a
                href="#prediction-engine-section"
                className="px-6 py-3 border border-cyan-400/45 bg-cyan-500/15 hover:bg-cyan-500/25 transition flex items-center gap-2.5 text-xs font-semibold text-cyan-100 whitespace-nowrap"
              >
                <TrendingUp size={15} className="text-cyan-300" />
                <span>2026–2047 Prediction Tool</span>
              </a>

            </div>

          </div>

          <div className="hidden xl:block border border-white/10 bg-[#070b11]/90 p-6">

            <div className="text-xs font-medium text-white/45">
              Decision Cycle
            </div>

            <div className="mt-5 space-y-4">

              <SignalRow number="01" text="Observe" />
              <SignalRow number="02" text="Analyse" />
              <SignalRow number="03" text="Understand" />
              <SignalRow number="04" text="Prepare & Act" />

            </div>

            {selectedVillage && (
              <div className="mt-6 pt-5 border-t border-white/10">

                <div className="text-[11px] text-white/40">
                  Active Evidence Context
                </div>

                <div className="mt-1.5 text-sm font-medium text-white/90">
                  {selectedVillage.profile.village_name}
                </div>

              </div>
            )}

          </div>

        </div>

      </section>

      {/* OVERVIEW AI INTELLIGENCE STUDIO (FRONT & CENTER WHEN OPEN) */}
      {aiPanelOpen && (
        <section className="border-b border-orange-300/20 bg-[#050910]/60">
          <div className="max-w-7xl mx-auto px-8 py-14">
            <DomainAI
              config={DOMAINS.overview}
              selectedVillage={selectedVillage}
              featuredVillages={featuredVillages}
              onSelectVillage={onSelectVillage}
              agentResult={agentResult}
              running={agentRunning}
              onRun={onRunAI}
            />
          </div>
        </section>
      )}

      {/* DOMAIN LENSES */}

      <section className="px-8 py-20 max-w-7xl mx-auto">

        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">

          <div>

            <p className="text-xs font-medium text-white/40">
              Development Lenses
            </p>

            <h3 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
              One system. Multiple dimensions.
            </h3>

          </div>

          <div className="text-xs text-white/35">
            SDGs · GIS · Statistics · Future Readiness · AI
          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">

          {DOMAIN_ORDER.map((id) => {

            const item = DOMAINS[id];
            const Icon = item.icon;
            const hasReadiness = isFutureReadinessDomain(id);
            const sdgAsset = SDG_SECTOR_ASSETS[id as SdgSectorId];

            return (
              <button
                key={id}
                onClick={() => onSection(id)}
                data-domain={id}
                className="domain-card group relative min-h-[340px] overflow-hidden border transition-all duration-300 text-left flex flex-col justify-between"
              >

                <div className="domain-card-bar absolute inset-x-0 top-0 h-[2.5px] z-20" />

                {/* Official UN SDG Square Icon Header on Sector Card */}
                {sdgAsset && (
                  <div
                    className="relative h-36 w-full flex items-center justify-between px-4 py-3 border-b border-white/15 shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${sdgAsset.officialColor}ee 0%, ${sdgAsset.officialColor}bb 100%)`,
                    }}
                  >
                    <img
                      src={sdgAsset.imageSrc}
                      alt={sdgAsset.alt}
                      className="h-28 w-28 object-contain border border-white/25 shadow-lg transition-transform duration-500 group-hover:scale-105 shrink-0"
                    />
                    <div className="pl-3 text-right">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-white/80">
                        UN SDG Goal
                      </div>
                      <div className="text-2xl font-black font-mono text-white leading-none mt-0.5">
                        {sdgAsset.goalNumber}
                      </div>
                    </div>
                  </div>
                )}

                <div className="relative z-10 flex-1 flex flex-col justify-between p-5">

                  <div className="flex items-center justify-between">

                    <span className="domain-card-icon flex h-9 w-9 items-center justify-center transition-all duration-300">
                      <Icon
                        size={19}
                        strokeWidth={1.6}
                      />
                    </span>

                    <span className="domain-card-sdg font-mono text-[11px] font-medium">
                      {item.sdg}
                    </span>

                  </div>

                  <div className="mt-4">

                    <div className="domain-card-kicker text-[11px] font-medium">
                      {hasReadiness ? "Intelligence + Future Readiness" : "Domain Intelligence"}
                    </div>

                    <h4 className="mt-1 text-xl font-semibold text-white">
                      {item.shortTitle}
                    </h4>

                    <p className="mt-2 text-xs leading-5 text-white/60">
                      {item.subtitle}
                    </p>

                    <div className="domain-card-cta mt-4 flex items-center gap-2 text-xs font-medium transition">
                      <span>Enter Domain</span>
                      <ArrowRight size={13} className="group-hover:translate-x-1 transition" />
                    </div>

                  </div>

                </div>

              </button>
            );
          })}

        </div>

      </section>

      {/* =================================================
          TELANGANA 5-SECTOR INTERACTIVE GIS & ANALYTICS HUB
      ================================================= */}

      <section className="border-t border-white/10 bg-[#050910]/50">
        <div className="max-w-7xl mx-auto px-8 py-16 space-y-10">
          {/* Quick-Select Telangana Villages Strip */}
          {featuredVillages.length > 0 && (
            <div className="border border-white/10 bg-[#070b12] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 text-xs font-medium text-orange-300">
                  <Map size={14} />
                  <span>
                    Telangana State Settlement Selector · 11,154 Villages Indexed
                  </span>
                </div>
                <span className="text-[11px] text-white/40">
                  Click a representative settlement or search any Telangana village in the top bar
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {featuredVillages.map((fv) => {
                  const isActive =
                    selectedVillage?.profile.village_code === fv.village_code;
                  return (
                    <button
                      key={fv.village_code}
                      type="button"
                      onClick={() => onSelectVillage(fv.village_code)}
                      className={`border px-3 py-2 text-left text-xs transition ${
                        isActive
                          ? "border-orange-300/50 bg-orange-300/[0.12] text-white"
                          : "border-white/10 bg-white/[0.02] text-white/65 hover:border-white/25 hover:text-white"
                      }`}
                    >
                      <span className="font-medium">{fv.area_name}</span>
                      <span className="ml-1.5 font-mono text-[10px] text-white/40">
                        {fv.district_name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Telangana 5-Sector Interactive GIS Map */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="text-xs font-medium text-cyan-300">
                  Separate 5-Sector Spatial GIS · Telangana State
                </div>
                <h3 className="mt-1.5 text-2xl md:text-3xl font-semibold">
                  Education · Health · Water · Livelihood · Environment GIS
                </h3>
                <p className="mt-1.5 text-xs text-white/50">
                  Switch across all 5 sector GIS layers, toggle 444 Mandal choropleths and 5,607 geolocated facilities, or click any Mandal to inspect village boundary polygons.
                </p>
              </div>
              <button
                type="button"
                onClick={onGeneratePolicy}
                className="inline-flex items-center gap-2 border border-orange-300/35 bg-orange-300/[0.09] px-4 py-2.5 text-xs font-medium text-orange-100 transition hover:bg-orange-300/[0.16] shrink-0"
              >
                <Brain size={14} />
                <span>Generate AI Policy Formulation for Selected Village</span>
              </button>
            </div>

            <div className="h-[540px] overflow-hidden border border-white/10 bg-[#04080e]">
              <DevelopmentMap
                activeDomain="overview"
                selectedVillageCode={selectedVillage?.profile.village_code ?? null}
                selectedVillageGeometry={selectedVillage?.gis.geometry}
                selectedMandalCode={selectedVillage?.gis.mandal_code ?? null}
                onVillageSelect={(v) => {
                  if (v.village_code !== undefined) {
                    onSelectVillage(String(v.village_code));
                  }
                }}
              />
            </div>
          </div>

          {/* Telangana Multi-Coloured Detailed Analytics */}
          <div className="pt-4">
            <AnalyticsPanel
              sector="overview"
              selectedVillageCode={selectedVillage?.profile.village_code ?? null}
            />
          </div>
        </div>
      </section>

      {/* =================================================
          NEW SEGMENT: VICIOUS CYCLE -> VIRTUOUS TRANSITION
      ================================================= */}
      <ViciousToVirtuousCycle
        lang={lang}
        onOpenFullCinema={() => setCycleCinemaOpen(true)}
        villageMetrics={
          insightsVillage
            ? {
                villageName: insightsVillage.villageName,
                districtName: insightsVillage.districtName,
                envScore: insightsVillage.environment.score,
                waterScore: insightsVillage.water.score,
                healthScore: insightsVillage.health.score,
                eduScore: insightsVillage.education.score,
                livScore: insightsVillage.livelihood.score,
                solidBiomassPct: insightsVillage.environment.solidBiomassPct,
                tapWaterPct: insightsVillage.water.tapWaterTotalPct,
                tanksTotal: insightsVillage.water.tanksTotal,
                openDefecationPct: insightsVillage.health.openDefecationPct,
                literacyRate: insightsVillage.education.literacyRate,
                marginalWorkerPct: insightsVillage.livelihood.marginalWorkerPct,
              }
            : null
        }
      />

      <ViciousCycleCinematicOverlay
        open={cycleCinemaOpen}
        onClose={() => setCycleCinemaOpen(false)}
        villageName={selectedVillage?.profile.village_name ?? "Telangana State"}
      />

      {/* =================================================
          GRAND PREDICTIVE INTELLIGENCE, COMPARISON & EXPLAINER
      ================================================= */}
      <PredictionHorizonStudio
        village={insightsVillage}
        groundwater={stateInsights?.groundwater_by_district ?? []}
      />

      {/* =================================================
          NEW SEGMENT: FUTURE READINESS (HEALTH, WATER, ENVIRONMENT)
      ================================================= */}

      <FutureReadinessOverviewSegment
        selectedVillage={selectedVillage}
        readinessChecks={readinessChecks}
        onToggleCheck={onToggleReadinessCheck}
        onOpenDomainReadiness={(domain) =>
          onSection(domain, "readiness")
        }
        onLaunchReadinessReview={onLaunchReadinessReview}
      />

      {/* =================================================
          MACROECONOMIC BRIDGE: INFLATION BALANCE & INR APPRECIATION
      ================================================= */}
      <MacroInflationRupeePanel
        lang={lang}
        macroData={stateInsights?.inflation_and_rupee}
      />

      {/* =================================================
          CITIZEN WELFARE TWIN + WEATHER / HEATWAVE + e-NAM MANDI OBSERVATORIES
      ================================================= */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 pb-12 space-y-8">
        <CitizenLifelineSchemeStudio village={insightsVillage} defaultPersona="farmer" />
        <HyperlocalWeatherObservatory village={insightsVillage} />
        <MandiMarketObservatory village={insightsVillage} />
      </section>

      {/* =================================================
          ANCIENT CIVILISATIONAL WISDOM ACROSS ALL SECTORS
      ================================================= */}
      <OverviewAncientWisdomSection onEnterSector={(sec) => onSection(sec)} />

      {/* DATA → INTELLIGENCE */}

      <section className="border-y border-white/10 bg-white/[0.015]">

        <div className="max-w-7xl mx-auto px-8 py-20">

          <div className="grid lg:grid-cols-2 gap-16 items-center">

            <div>

              <p className="text-xs font-medium text-orange-300">
                Why JAN—DRISHTI
              </p>

              <h3 className="mt-4 text-3xl md:text-5xl leading-tight font-semibold tracking-tight text-balance">
                Data should not merely
                <span className="text-white/45">
                  {" "}describe a place.
                </span>
              </h3>

              <p className="mt-6 text-sm leading-7 text-white/50">
                It should help planners understand what is happening, where it
                is happening, which patterns deserve field investigation, and
                how settlements can prepare ahead of health, water, and
                environmental stress.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3">

                {[
                  ["01", "Data", "Observed Census & sector records"],
                  ["02", "Analytics", "Statistical distributions"],
                  ["03", "GIS", "Spatial boundaries & reach"],
                  ["04", "Readiness & AI", "Horizon planning & review"],
                ].map(([number, title, text]) => (
                  <div
                    key={number}
                    className="border border-white/10 bg-[#070b11] p-5"
                  >

                    <div className="font-mono text-xs text-orange-300/75 tabular-nums">
                      {number}
                    </div>

                    <div className="mt-2.5 text-sm font-medium text-white/90">
                      {title}
                    </div>

                    <div className="mt-1.5 text-xs text-white/45">
                      {text}
                    </div>

                  </div>
                ))}

              </div>

            </div>

            <div className="relative h-[370px] border border-white/10 bg-[#070b11] overflow-hidden">

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,153,51,.12),transparent_32%),radial-gradient(circle_at_70%_70%,rgba(19,136,8,.10),transparent_36%)]" />

              <div className="absolute inset-0 overview-data-field" />

              <div className="absolute inset-0 flex items-center justify-center">

                <div className="relative h-44 w-44 rounded-full border border-white/10">

                  <div className="absolute inset-8 rounded-full border border-orange-400/25" />

                  <div className="absolute inset-0 flex items-center justify-center">

                    <Network
                      size={44}
                      strokeWidth={1.2}
                      className="text-white/75"
                    />

                  </div>

                </div>

              </div>

              <div className="absolute top-7 left-7 text-xs text-white/40">
                People
              </div>

              <div className="absolute top-7 right-7 text-xs text-white/40">
                Places
              </div>

              <div className="absolute bottom-7 left-7 text-xs text-white/40">
                Outcomes
              </div>

              <div className="absolute bottom-7 right-7 text-xs text-white/40">
                Future Readiness
              </div>

              <div className="absolute left-1/2 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

              <div className="absolute top-1/2 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            </div>

          </div>

        </div>

      </section>

      {/* AGENT RESULT ON OVERVIEW (WHEN PANEL NOT ALREADY OPEN ABOVE) */}

      {!aiPanelOpen && agentResult && (
        <section className="max-w-7xl mx-auto px-8 py-16">

          <AgentWorkspace
            result={agentResult}
            running={false}
          />

        </section>
      )}

    </div>
  );
}

/* =========================================================
   FUTURE READINESS — OVERVIEW SEGMENT (HEALTH, WATER, ENVIRONMENT)
========================================================= */

function FutureReadinessOverviewSegment({
  selectedVillage,
  readinessChecks,
  onToggleCheck,
  onOpenDomainReadiness,
  onLaunchReadinessReview,
}: {
  selectedVillage: VillageData | null;
  readinessChecks: Record<string, boolean>;
  onToggleCheck: (key: string) => void;
  onOpenDomainReadiness: (domain: FutureReadinessDomain) => void;
  onLaunchReadinessReview: (domain: FutureReadinessDomain) => void;
}) {
  const [activeDomain, setActiveDomain] =
    useState<FutureReadinessDomain>("health");
  const [horizonFilter, setHorizonFilter] =
    useState<HorizonFilter>("all");

  const activeConfig = FUTURE_READINESS[activeDomain];
  const villageKey = selectedVillage?.profile.village_code ?? "global";

  const filteredPillars =
    horizonFilter === "all"
      ? activeConfig.pillars
      : activeConfig.pillars.filter(
          (pillar) => pillar.horizonKey === horizonFilter
        );

  const baselineItems = getObservedReadinessBaseline(
    activeDomain,
    selectedVillage
  );

  const completedCount = activeConfig.checklist.filter(
    (_, idx) => readinessChecks[`${villageKey}:${activeDomain}:${idx}`]
  ).length;

  return (
    <section
      id="future-readiness-segment"
      className="border-t border-white/10 bg-[#060a10]/55 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-8 py-20">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-medium text-cyan-300">
              <Compass size={15} />
              <span>Future Readiness Segment · Health · Water · Environment</span>
            </div>
            <h3 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-balance">
              Preparing settlements for health, water, and environmental horizons.
            </h3>
            <p className="mt-3 text-sm leading-7 text-white/50">
              Connects observed demographic and spatial baselines with
              forward-looking infrastructure, surveillance, and ecological
              preparedness—without inventing unmeasured sector figures.
            </p>
          </div>

          {/* Interactive Sector Switcher */}
          <div
            className="flex flex-wrap items-center gap-1 border border-white/10 bg-[#080d14] p-1 self-start lg:self-auto"
            role="tablist"
            aria-label="Future readiness sectors"
          >
            {FUTURE_READINESS_DOMAINS.map((domainKey) => {
              const sector = FUTURE_READINESS[domainKey];
              const DomainIcon = DOMAINS[domainKey].icon;
              const isSelected = activeDomain === domainKey;
              return (
                <button
                  key={domainKey}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveDomain(domainKey)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-medium transition whitespace-nowrap ${
                    isSelected
                      ? "bg-white/10 text-white"
                      : "text-white/50 hover:text-white/85"
                  }`}
                >
                  <DomainIcon size={14} />
                  <span>{sector.shortLabel}</span>
                  <span className="font-mono text-[10px] text-white/40">
                    {sector.sdg}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3-Domain Summary Strip */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {FUTURE_READINESS_DOMAINS.map((domainKey) => {
            const item = FUTURE_READINESS[domainKey];
            const DomainIcon = DOMAINS[domainKey].icon;
            const isSelected = activeDomain === domainKey;
            const checkedInSector = item.checklist.filter(
              (_, idx) => readinessChecks[`${villageKey}:${domainKey}:${idx}`]
            ).length;

            return (
              <div
                key={domainKey}
                onClick={() => setActiveDomain(domainKey)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveDomain(domainKey);
                  }
                }}
                className={`cursor-pointer border p-6 transition ${
                  isSelected
                    ? `${item.accentBorder} ${item.accentBg}`
                    : "border-white/10 bg-[#080d14] hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <DomainIcon size={18} className={item.accentText} />
                    <span className="text-base font-semibold text-white">
                      {item.title}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-white/45">
                    {item.sdg}
                  </span>
                </div>

                <p className="mt-3 text-xs leading-6 text-white/55">
                  {item.question}
                </p>

                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-3 text-xs">
                  <span className="font-mono tabular-nums text-white/45">
                    Checklist: {checkedInSector}/{item.checklist.length} verified
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDomainReadiness(domainKey);
                    }}
                    className={`inline-flex items-center gap-1.5 font-medium ${item.accentText} hover:underline whitespace-nowrap`}
                  >
                    <span>Open Workspace</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Active Domain Readiness Workspace */}
        <div className="mt-6">
          <FutureReadinessDetailCard
            config={activeConfig}
            selectedVillage={selectedVillage}
            horizonFilter={horizonFilter}
            onHorizonChange={setHorizonFilter}
            filteredPillars={filteredPillars}
            baselineItems={baselineItems}
            readinessChecks={readinessChecks}
            villageKey={villageKey}
            completedCount={completedCount}
            onToggleCheck={onToggleCheck}
            onRunAIReview={() => onLaunchReadinessReview(activeDomain)}
            onOpenWorkspace={() => onOpenDomainReadiness(activeDomain)}
          />
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   SHARED FUTURE READINESS DETAIL WORKSPACE
========================================================= */

function FutureReadinessDetailCard({
  config,
  selectedVillage,
  horizonFilter,
  onHorizonChange,
  filteredPillars,
  baselineItems,
  readinessChecks,
  villageKey,
  completedCount,
  onToggleCheck,
  onRunAIReview,
  onOpenWorkspace,
}: {
  config: FutureReadinessConfig;
  selectedVillage: VillageData | null;
  horizonFilter: HorizonFilter;
  onHorizonChange: (next: HorizonFilter) => void;
  filteredPillars: ReadinessPillar[];
  baselineItems: { label: string; value: string; note: string }[];
  readinessChecks: Record<string, boolean>;
  villageKey: string;
  completedCount: number;
  onToggleCheck: (key: string) => void;
  onRunAIReview: () => void;
  onOpenWorkspace?: () => void;
}) {
  return (
    <div className="border border-white/10 bg-[#080d14] p-7 md:p-8 space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <div className={`text-xs font-medium ${config.accentText}`}>
            {config.sdg} · {config.sdgTitle} · Readiness Blueprint
          </div>
          <h4 className="mt-2 text-2xl font-semibold text-white">
            {config.title}
          </h4>
          <p className="mt-2 max-w-3xl text-xs leading-6 text-white/50">
            {config.summary}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {selectedVillage && (
            <button
              type="button"
              onClick={onRunAIReview}
              className="inline-flex items-center gap-2 border border-orange-300/30 bg-orange-300/[0.08] px-4 py-2.5 text-xs font-medium text-orange-100 transition hover:bg-orange-300/[0.15] whitespace-nowrap"
            >
              <Brain size={14} />
              <span>Run {config.shortLabel} Readiness AI Review</span>
            </button>
          )}
          {onOpenWorkspace && (
            <button
              type="button"
              onClick={onOpenWorkspace}
              className="inline-flex items-center gap-2 border border-white/15 bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-white/80 transition hover:bg-white/[0.08] whitespace-nowrap"
            >
              <span>Enter {config.shortLabel} Domain</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Observed Baseline Strip */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-xs font-medium text-white/60">
            Observed Demographic &amp; Spatial Context
            {selectedVillage
              ? ` — ${selectedVillage.profile.village_name}`
              : ""}
          </span>
          <span className="text-[11px] text-white/35">
            Strict non-fabrication: unmeasured {config.shortLabel.toLowerCase()} figures are never estimated
          </span>
        </div>

        <div
          className={`grid grid-cols-1 gap-px border border-white/10 bg-white/10 ${
            baselineItems.length > 1
              ? "sm:grid-cols-2 lg:grid-cols-4"
              : "grid-cols-1"
          }`}
        >
          {baselineItems.map((item) => (
            <div key={item.label} className="bg-[#070b11] p-5">
              <div className="text-xs text-white/40">{item.label}</div>
              <div className="mt-2 font-mono text-lg font-medium tabular-nums text-white/90">
                {item.value}
              </div>
              <div className="mt-1.5 text-[11px] leading-5 text-white/40">
                {item.note}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Horizon Filter + Pillars */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="text-xs font-medium text-white/65">
            Preparedness Horizons &amp; Programme Pathways
          </div>

          <div className="flex flex-wrap items-center gap-1 border border-white/10 bg-[#05080d] p-1">
            {(
              [
                ["all", "All Horizons"],
                ["immediate", "0–2 Yrs"],
                ["medium", "3–5 Yrs"],
                ["long_term", "5–10 Yrs"],
              ] as [HorizonFilter, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => onHorizonChange(key)}
                className={`px-3 py-1.5 text-xs transition whitespace-nowrap ${
                  horizonFilter === key
                    ? "bg-white/10 font-medium text-white"
                    : "text-white/45 hover:text-white/80"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPillars.map((pillar) => (
            <article
              key={pillar.id}
              className="border border-white/10 bg-[#070b11] p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className={`font-medium ${config.accentText}`}>
                    {pillar.horizonLabel}
                  </span>
                  <span className="text-white/35">Readiness Pillar</span>
                </div>

                <h5 className="mt-3 text-base font-semibold text-white/90">
                  {pillar.title}
                </h5>

                <p className="mt-2.5 text-xs leading-6 text-white/50">
                  {pillar.focus}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-white/10 space-y-2 text-xs">
                <div>
                  <span className="text-white/35">Verification metric: </span>
                  <span className="text-white/70">{pillar.verificationMetric}</span>
                </div>
                <div>
                  <span className="text-white/35">Programme reference to verify: </span>
                  <span className="text-white/75 font-medium">
                    {pillar.programmeReference}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Checklist + Required Datasets */}
      <div className="grid lg:grid-cols-2 gap-6 pt-2">
        {/* Field Readiness Checklist */}
        <div className="border border-white/10 bg-[#070b11] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-medium text-white/80">
                Departmental &amp; Field Verification Checklist
              </div>
              <p className="mt-1 text-[11px] text-white/40">
                Track human-verified readiness steps during committee review
              </p>
            </div>
            <span className="font-mono text-xs tabular-nums text-white/70">
              {completedCount}/{config.checklist.length} confirmed
            </span>
          </div>

          <div className="mt-5 space-y-2.5">
            {config.checklist.map((item, idx) => {
              const checkKey = `${villageKey}:${config.domain}:${idx}`;
              const checked = Boolean(readinessChecks[checkKey]);
              return (
                <button
                  key={checkKey}
                  type="button"
                  onClick={() => onToggleCheck(checkKey)}
                  className={`w-full flex items-start gap-3 p-3 border text-left transition ${
                    checked
                      ? "border-emerald-400/30 bg-emerald-400/[0.06] text-white/90"
                      : "border-white/10 bg-white/[0.015] text-white/55 hover:border-white/20 hover:text-white/80"
                  }`}
                >
                  {checked ? (
                    <CheckCircle2
                      size={16}
                      className="mt-0.5 text-emerald-300 shrink-0"
                    />
                  ) : (
                    <Circle
                      size={16}
                      className="mt-0.5 text-white/30 shrink-0"
                    />
                  )}
                  <span className="text-xs leading-5">{item}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Authoritative Datasets Needed */}
        <div className="border border-white/10 bg-[#070b11] p-6">
          <div className="flex items-center gap-2 text-xs font-medium text-white/80">
            <Database size={15} className={config.accentText} />
            <span>Authoritative Datasets for Full {config.shortLabel} Readiness</span>
          </div>
          <p className="mt-1.5 text-[11px] leading-5 text-white/40">
            Connect these verified departmental layers to upgrade baseline
            screening into full quantitative readiness modelling:
          </p>

          <ul className="mt-5 space-y-3">
            {config.requiredDatasets.map((dataset, idx) => (
              <li
                key={dataset}
                className="flex items-start gap-3 border-b border-white/5 pb-3 last:border-b-0 last:pb-0 text-xs text-white/60"
              >
                <span className="font-mono text-[11px] tabular-nums text-orange-300/70 shrink-0">
                  {String(idx + 1).padStart(2, "0")}.
                </span>
                <span className="leading-5">{dataset}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DOMAIN SCREEN
========================================================= */

function DomainScreen({
  section,
  config,
  panel,
  onPanel,
  selectedVillage,
  featuredVillages,
  onSelectVillage,
  villageLoading,
  villageError,
  agentResult,
  agentRunning,
  onRunAgent,
  readinessChecks,
  onToggleReadinessCheck,
  onLaunchReadinessReview,
  lang,
  stateInsights,
  insightsVillage,
}: {
  section: Section;
  config: DomainConfig;
  panel: Panel | null;
  onPanel: (panel: Panel) => void;
  selectedVillage: VillageData | null;
  featuredVillages: VillageSearchResult[];
  onSelectVillage: (code: string) => void;
  villageLoading: boolean;
  villageError: string;
  agentResult: AgentResult | null;
  agentRunning: boolean;
  onRunAgent: (query: string) => void;
  readinessChecks: Record<string, boolean>;
  onToggleReadinessCheck: (key: string) => void;
  onLaunchReadinessReview: (domain: FutureReadinessDomain) => void;
  lang: LanguageCode;
  stateInsights: StateInsightsPayload | null;
  insightsVillage: SectorInsightsVillage | null;
}) {
  const Icon = config.icon;
  const hasFutureReadiness = isFutureReadinessDomain(section);

  return (
    <div
      className="domain-workspace min-h-screen pb-14"
      data-domain={config.shortTitle.toLowerCase()}
    >

      {/* HERO */}

      <section className="relative min-h-[380px] overflow-hidden border-b border-white/10 bg-[#060a10]/55">

        <div
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{ backgroundColor: config.accent }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_38%,rgba(255,255,255,.06),transparent_45%)]" />

        <div className="absolute inset-0 domain-data-sweep" />

        <div className="relative z-10 px-8 md:px-12 py-12 max-w-7xl mx-auto">
          <div className="grid gap-8 lg:grid-cols-[1.08fr_.92fr] items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3.5">
                <div className="relative h-12 w-12 rounded-full border border-white/15 bg-white/[0.03] flex items-center justify-center shrink-0">
                  <Icon size={22} strokeWidth={1.3} />
                </div>

                {section in SDG_SECTOR_ASSETS ? (
                  <SdgGoalBadge sector={section as SdgSectorId} />
                ) : (
                  <div>
                    <div className="font-mono text-xs text-white/45">{config.sdg}</div>
                    <div className="text-xs text-white/65">{config.sdgTitle}</div>
                  </div>
                )}
              </div>

              <h1 className="mt-6 text-4xl md:text-5xl font-semibold tracking-[-0.03em] text-balance">
                {config.title}
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-8 text-white/55">
                {config.subtitle}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-white/45">
                {config.metrics.map((metric, index) => (
                  <span key={metric} className="inline-flex items-center gap-2">
                    {index > 0 && <span aria-hidden="true">·</span>}
                    <span>{metric}</span>
                  </span>
                ))}
              </div>
            </div>

            {section in SDG_SECTOR_ASSETS && (
              <div className="relative border border-white/15 bg-[#040812] p-5 flex flex-col sm:flex-row items-center gap-5 shadow-2xl">
                <div
                  className="p-2 border border-white/20 shrink-0"
                  style={{ backgroundColor: SDG_SECTOR_ASSETS[section as SdgSectorId].officialColor }}
                >
                  <img
                    src={SDG_SECTOR_ASSETS[section as SdgSectorId].imageSrc}
                    alt={SDG_SECTOR_ASSETS[section as SdgSectorId].alt}
                    className="h-36 w-36 sm:h-40 sm:w-40 object-contain"
                  />
                </div>
                <div className="space-y-2.5 text-center sm:text-left">
                  <div className="text-[11px] font-mono uppercase tracking-widest text-white/55">
                    Official United Nations Sustainable Development Goal
                  </div>
                  <SdgGoalBadge sector={section as SdgSectorId} />
                  <p className="text-xs text-white/75 leading-relaxed">
                    {SDG_SECTOR_ASSETS[section as SdgSectorId].caption}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </section>

      {/* VILLAGE LOADING */}

      {villageLoading && (
        <section className="border-b border-white/10 bg-[#070b11]">

          <div className="max-w-7xl mx-auto px-8 md:px-12 py-10 flex items-center gap-4">

            <Loader2
              size={20}
              className="animate-spin text-orange-300"
            />

            <div>

              <div className="text-xs font-medium text-orange-300">
                Retrieving Village Intelligence
              </div>

              <div className="mt-1 text-xs text-white/45">
                Querying population, development indicators and GIS evidence…
              </div>

            </div>

          </div>

        </section>
      )}

      {/* ERROR */}

      {villageError && (
        <section className="border-b border-white/10 bg-[#070b11]">

          <div className="max-w-7xl mx-auto px-8 md:px-12 py-6 text-sm text-red-300/80">
            {villageError}
          </div>

        </section>
      )}

      {/* VILLAGE */}

      {selectedVillage && !villageLoading && (
        <VillageIntelligence
          data={selectedVillage}
        />
      )}

      {/* QUESTION */}

      <section className="border-b border-white/10 bg-[#070b11]/60">

        <div className="max-w-7xl mx-auto px-8 md:px-12 py-10">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

            <div>

              <p className="text-xs font-medium text-white/40">
                Development Question
              </p>

              <h2 className="mt-2 text-2xl md:text-3xl font-medium text-balance">
                {config.question}
              </h2>

            </div>

            <div className="md:text-right shrink-0">

              <div className="text-xs text-white/35">
                Active Domain
              </div>

              <div className="mt-1 font-mono text-sm text-white/80">
                {config.sdg} · {config.shortTitle}
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ANCIENT WISDOM FOR THIS SECTOR */}
      <SectorAncientWisdomBanner section={section} />

      {/* TOOLS */}

      <section className="max-w-7xl mx-auto px-8 md:px-12 py-12">

        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
            hasFutureReadiness ? "xl:grid-cols-5" : "xl:grid-cols-4"
          }`}
        >

          <ToolButton
            active={panel === "map"}
            icon={<Map size={20} />}
            title={config.mapTitle}
            description="Explore this domain's spatial evidence and GIS boundaries."
            onClick={() => onPanel("map")}
          />

          <ToolButton
            active={panel === "analytics"}
            icon={<BarChart3 size={20} />}
            title={config.analyticsTitle}
            description="Understand distributions, relationships and patterns."
            onClick={() => onPanel("analytics")}
          />

          {hasFutureReadiness && (
            <ToolButton
              active={panel === "readiness"}
              icon={<Compass size={20} />}
              title={config.readinessTitle ?? `${config.shortTitle} Future Readiness`}
              description="Assess short-, medium-, and long-horizon preparedness and datasets."
              onClick={() => onPanel("readiness")}
            />
          )}

          <ToolButton
            active={panel === "ai"}
            icon={<Brain size={20} />}
            title={config.aiTitle}
            description="Run the development intelligence planning engine."
            onClick={() => onPanel("ai")}
          />

          <ToolButton
            active={panel === "gaps"}
            icon={<AlertTriangle size={20} />}
            title={config.gapsTitle}
            description="Surface development signals and intervention pathways."
            onClick={() => onPanel("gaps")}
          />

        </div>

        <div className="mt-8">

          {!panel && (
            <DomainLanding
              section={section}
              config={config}
              selectedVillage={selectedVillage}
              agentResult={agentResult}
              readinessChecks={readinessChecks}
              onToggleReadinessCheck={onToggleReadinessCheck}
              onLaunchReadinessReview={onLaunchReadinessReview}
            />
          )}

          {panel === "map" && (
            <DomainMap
              config={config}
              selectedVillage={selectedVillage}
              onSelectVillage={onSelectVillage}
              lang={lang}
              stateInsights={stateInsights}
              insightsVillage={insightsVillage}
            />
          )}

          {panel === "analytics" && (
            <DomainAnalytics
              config={config}
              selectedVillage={selectedVillage}
            />
          )}

          {panel === "readiness" && hasFutureReadiness && (
            <DomainFutureReadiness
              domain={section}
              selectedVillage={selectedVillage}
              readinessChecks={readinessChecks}
              onToggleCheck={onToggleReadinessCheck}
              onRunAIReview={() => onLaunchReadinessReview(section)}
            />
          )}

          {panel === "ai" && (
            <DomainAI
              config={config}
              selectedVillage={selectedVillage}
              featuredVillages={featuredVillages}
              onSelectVillage={onSelectVillage}
              agentResult={agentResult}
              running={agentRunning}
              onRun={onRunAgent}
            />
          )}

          {panel === "gaps" && (
            <DomainGaps
              config={config}
              selectedVillage={selectedVillage}
              agentResult={agentResult}
            />
          )}

        </div>

      </section>

    </div>
  );
}

/* =========================================================
   DOMAIN FUTURE READINESS PANEL (HEALTH, WATER, ENVIRONMENT)
========================================================= */

function DomainFutureReadiness({
  domain,
  selectedVillage,
  readinessChecks,
  onToggleCheck,
  onRunAIReview,
}: {
  domain: FutureReadinessDomain;
  selectedVillage: VillageData | null;
  readinessChecks: Record<string, boolean>;
  onToggleCheck: (key: string) => void;
  onRunAIReview: () => void;
}) {
  const [horizonFilter, setHorizonFilter] =
    useState<HorizonFilter>("all");

  const readinessConfig = FUTURE_READINESS[domain];
  const villageKey = selectedVillage?.profile.village_code ?? "global";

  const filteredPillars =
    horizonFilter === "all"
      ? readinessConfig.pillars
      : readinessConfig.pillars.filter(
          (pillar) => pillar.horizonKey === horizonFilter
        );

  const baselineItems = getObservedReadinessBaseline(
    domain,
    selectedVillage
  );

  const completedCount = readinessConfig.checklist.filter(
    (_, idx) => readinessChecks[`${villageKey}:${domain}:${idx}`]
  ).length;

  return (
    <div className="space-y-5 animate-[fadeUp_.4s_ease-out]">
      <PanelHeader
        icon={<Compass size={18} />}
        eyebrow="FUTURE READINESS SEGMENT"
        title={readinessConfig.title}
        description="Horizon-based preparedness pillars, observed baseline context, field verification checklist, and authoritative dataset requirements."
      />

      <FutureReadinessDetailCard
        config={readinessConfig}
        selectedVillage={selectedVillage}
        horizonFilter={horizonFilter}
        onHorizonChange={setHorizonFilter}
        filteredPillars={filteredPillars}
        baselineItems={baselineItems}
        readinessChecks={readinessChecks}
        villageKey={villageKey}
        completedCount={completedCount}
        onToggleCheck={onToggleCheck}
        onRunAIReview={onRunAIReview}
      />
    </div>
  );
}

/* =========================================================
   VILLAGE INTELLIGENCE
========================================================= */

function VillageIntelligence({
  data,
}: {
  data: VillageData;
}) {
  const profile = data.profile;
  const population = data.population;
  const education = data.education;
  const livelihood = data.livelihood;
  const demography = data.demography;
  const vulnerability = data.vulnerability;
  const jan = data.jan_drishti;
  const gis = data.gis;

  return (
    <section className="village-intelligence-section border-b border-white/10 bg-[#060a10]">

      <div className="max-w-7xl mx-auto px-8 md:px-12 py-12">

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">

          <div>

            <div className="flex items-center gap-2.5 text-xs font-medium text-orange-300">
              <Database size={14} />
              <span>Live Village Intelligence</span>
            </div>

            <h2 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight">
              {profile.village_name}
            </h2>

            <p className="mt-2.5 font-mono text-xs tabular-nums text-white/40">
              State {profile.state_code}
              {" · "}
              District {profile.district_code}
              {" · "}
              Subdistrict {profile.subdistrict_code}
              {" · "}
              {profile.type}
            </p>

          </div>

          <div className="border border-white/10 bg-white/[0.025] px-6 py-5 min-w-[200px]">

            <div className="text-xs text-white/40">
              JAN—DRISHTI Score
            </div>

            <div className="mt-2 font-mono text-4xl font-light tabular-nums">
              {jan.overall_score}
            </div>

            <div className="mt-1 font-mono text-xs tabular-nums text-white/45">
              VVI {vulnerability.vvi_v2}
              {vulnerability.vvi_v2_level ? ` · ${vulnerability.vvi_v2_level}` : ""}
            </div>

          </div>

        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 border border-white/10">

          <VillageMetric
            label="Population"
            value={population.total.toLocaleString()}
          />

          <VillageMetric
            label="Households"
            value={population.households.toLocaleString()}
          />

          <VillageMetric
            label="Literacy"
            value={`${education.literacy_rate}%`}
          />

          <VillageMetric
            label="Work Participation"
            value={`${livelihood.worker_participation_rate}%`}
          />

        </div>

        <div className="mt-8 grid lg:grid-cols-3 gap-4">

          <IntelligenceCard
            icon={<GraduationCap size={18} />}
            eyebrow="Education · SDG 04"
            title="Learning & Digital Signal"
          >
            <SignalValue
              label="Effective literacy rate"
              value={`${education.literacy_rate}%`}
            />
            <SignalValue
              label="Female literacy rate"
              value={`${education.female_literacy_rate}%`}
            />
            <SignalValue
              label="Household telecom reach"
              value={`${education.mobile_coverage_pct}%`}
            />
            <SignalValue
              label="Nearest mapped school"
              value={`${education.nearest_school_km} km`}
            />
          </IntelligenceCard>

          <IntelligenceCard
            icon={<HeartPulse size={18} />}
            eyebrow="Health · SDG 03"
            title="Sanitation, Clean Air & Care"
          >
            <SignalValue
              label="Sanitation within premises"
              value={`${data.health.latrine_within_pct}%`}
            />
            <SignalValue
              label="Clean cooking fuel (LPG/Biogas)"
              value={`${data.health.clean_cooking_fuel_pct}%`}
            />
            <SignalValue
              label="Safe good-condition housing"
              value={`${data.health.good_housing_pct}%`}
            />
            <SignalValue
              label="Nearest health facility"
              value={`${data.health.nearest_health_km} km`}
            />
          </IntelligenceCard>

          <IntelligenceCard
            icon={<Droplets size={18} />}
            eyebrow="Water · SDG 06"
            title="Tap Supply & Irrigation Tanks"
          >
            <SignalValue
              label="Household tap water"
              value={`${data.water.tap_water_total_pct}%`}
            />
            <SignalValue
              label="Water within premises"
              value={`${data.water.water_within_premises_pct}%`}
            />
            <SignalValue
              label="TRACGIS irrigation tanks"
              value={`${data.water.tanks_total} (${data.water.tank_density_per_10sqkm}/10km²)`}
            />
            <SignalValue
              label="Nearest water infrastructure"
              value={`${data.water.nearest_water_km} km`}
            />
          </IntelligenceCard>

          <IntelligenceCard
            icon={<BriefcaseBusiness size={18} />}
            eyebrow="Livelihood · SDG 08"
            title="Workforce & Financial Inclusion"
          >
            <SignalValue
              label="Worker participation"
              value={`${livelihood.worker_participation_rate}%`}
            />
            <SignalValue
              label="Marginal worker share"
              value={`${livelihood.marginal_worker_percent}%`}
            />
            <SignalValue
              label="Household banking access"
              value={`${livelihood.banking_access_pct}%`}
            />
            <SignalValue
              label="Nearest mandi / bank"
              value={`${livelihood.nearest_livelihood_km} km`}
            />
          </IntelligenceCard>

          <IntelligenceCard
            icon={<Leaf size={18} />}
            eyebrow="Environment · SDG 13"
            title="Solar, Biomass & Air Telemetry"
          >
            <SignalValue
              label="Solar radiation potential"
              value={`${data.environment.avg_solar_radiation_mj_m2} MJ/m²`}
            />
            <SignalValue
              label="Solid biomass fuel exposure"
              value={`${data.environment.solid_biomass_fuel_pct}%`}
            />
            <SignalValue
              label="Ambient PM2.5 / US AQI"
              value={`${data.environment.pm2_5} µg/m³ · AQI ${data.environment.us_aqi}`}
            />
            <SignalValue
              label="Nearest reserve / solar asset"
              value={`${data.environment.nearest_env_km} km`}
            />
          </IntelligenceCard>

          <IntelligenceCard
            icon={<Users size={18} />}
            eyebrow="Demography"
            title="Population Structure"
          >
            <SignalValue
              label="Female share"
              value={`${demography.female_share}%`}
            />
            <SignalValue
              label="Children 0–6"
              value={`${demography.child_0_6_percent}%`}
            />
            <SignalValue
              label="SC population"
              value={`${demography.sc_percent}%`}
            />
            <SignalValue
              label="ST population"
              value={`${demography.st_percent}%`}
            />
          </IntelligenceCard>

        </div>

        <div className="mt-4 grid lg:grid-cols-[1.3fr_.7fr] gap-4">

          <div className="border border-white/10 bg-white/[0.02] p-7">

            <div className="flex items-center gap-2.5 text-xs font-medium text-orange-300">
              <Brain size={15} />
              <span>Multi-Sector Evidence Synthesis</span>
            </div>

            <h3 className="mt-4 text-xl md:text-2xl font-medium">
              What the Telangana 5-sector evidence suggests
            </h3>

            <p className="mt-4 text-sm leading-7 text-white/55">
              {profile.village_name} ({profile.mandal_name} Mandal, {profile.district_name} District) records an estimated catchment of{" "}
              <span className="font-mono tabular-nums text-white/90">
                {population.total.toLocaleString()}
              </span>{" "}
              residents across{" "}
              <span className="font-mono tabular-nums text-white/90">
                {population.households.toLocaleString()}
              </span>{" "}
              households, with{" "}
              <span className="font-mono tabular-nums text-white/90">
                {education.literacy_rate}%
              </span>{" "}
              literacy,{" "}
              <span className="font-mono tabular-nums text-white/90">
                {data.water.tap_water_total_pct}%
              </span>{" "}
              tap water coverage,{" "}
              <span className="font-mono tabular-nums text-white/90">
                {data.health.latrine_within_pct}%
              </span>{" "}
              in-premises sanitation, and{" "}
              <span className="font-mono tabular-nums text-white/90">
                {livelihood.banking_access_pct}%
              </span>{" "}
              formal banking access.
            </p>

            <p className="mt-4 text-sm leading-7 text-white/50">
              Across its{" "}
              <span className="font-mono tabular-nums text-white/80">
                {gis.area_sq_km} km²
              </span>{" "}
              mapped boundary, TRACGIS records{" "}
              <span className="font-mono tabular-nums text-white/80">
                {data.water.tanks_total}
              </span>{" "}
              minor irrigation tanks while Open-Meteo shows{" "}
              <span className="font-mono tabular-nums text-white/80">
                {data.environment.avg_solar_radiation_mj_m2} MJ/m²
              </span>{" "}
              daily solar potential. Run the AI Engine to generate a tailored policy formulation and interactive command dashboard for {profile.village_name}.
            </p>

            <div className="mt-6 flex items-center gap-2 text-xs text-white/35">
              <ShieldCheck size={14} />
              <span>Census PCA &amp; HLPCA · TRACGIS · OSM GIS · Open-Meteo</span>
            </div>

          </div>

          <div className="border border-white/10 bg-white/[0.02] p-7">

            <div className="flex items-center gap-2.5 text-xs font-medium text-white/45">
              <AlertTriangle size={15} />
              <span>Development Signal</span>
            </div>

            <div className="mt-6">

              <div className="text-xs text-white/35">
                Vulnerability Index (VVI v2)
              </div>

              <div className="mt-2 font-mono text-3xl tabular-nums">
                {vulnerability.vulnerability_index}
              </div>

              <div className="mt-1.5 text-xs font-medium text-orange-300/80">
                {vulnerability.vulnerability_level || "Unclassified"}
              </div>

            </div>

            <div className="mt-6 pt-6 border-t border-white/10">

              <div className="text-xs text-white/35">
                Telangana GIS Coverage
              </div>

              <div className="mt-2 font-mono text-xl tabular-nums">
                {gis.area_sq_km} km²
              </div>

              <div className="mt-1 text-xs text-emerald-300/75">
                {gis.available
                  ? "Exact village polygon verified"
                  : "GIS unavailable"}
              </div>

            </div>

          </div>

        </div>

        <div className="mt-4 border border-white/10 bg-white/[0.02] p-7">

          <div className="flex items-center gap-2.5 text-xs font-medium text-white/45">
            <Activity size={15} />
            <span>JAN—DRISHTI 5-Sector Dimensional Signals (0–100)</span>
          </div>

          <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-6 gap-5">

            <ScoreBar
              label="Education"
              score={jan.education_score}
              color="linear-gradient(90deg, #c5192d, #f97316)"
            />

            <ScoreBar
              label="Health"
              score={jan.health_score}
              color="linear-gradient(90deg, #047857, #34d399)"
            />

            <ScoreBar
              label="Water"
              score={jan.water_score}
              color="linear-gradient(90deg, #0e7490, #22d3ee)"
            />

            <ScoreBar
              label="Livelihood"
              score={jan.livelihood_score}
              color="linear-gradient(90deg, #a21942, #ec4899)"
            />

            <ScoreBar
              label="Environment"
              score={jan.environment_score}
              color="linear-gradient(90deg, #4d7c0f, #a3e635)"
            />

            <ScoreBar
              label="Overall"
              score={jan.overall_score}
              color="linear-gradient(90deg, #ff9933, #22c55e)"
            />

          </div>

        </div>

      </div>

    </section>
  );
}

/* =========================================================
   SCORE BAR
========================================================= */

function ScoreBar({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: string;
}) {
  const width = Math.max(
    0,
    Math.min(100, Number(score))
  );

  return (
    <div>

      <div className="flex items-center justify-between">

        <span className="text-xs text-white/45">
          {label}
        </span>

        <span className="font-mono text-xs tabular-nums text-white/80">
          {score}
        </span>

      </div>

      <div className="mt-3 h-2 bg-white/10 overflow-hidden">

        <div
          className="h-full transition-all duration-700"
          style={{
            width: `${width}%`,
            background: color,
          }}
        />

      </div>

    </div>
  );
}

/* =========================================================
   DOMAIN LANDING
========================================================= */

function DomainLanding({
  section,
  config,
  selectedVillage,
  agentResult,
  readinessChecks,
  onToggleReadinessCheck,
  onLaunchReadinessReview,
}: {
  section: Section;
  config: DomainConfig;
  selectedVillage: VillageData | null;
  agentResult: AgentResult | null;
  readinessChecks: Record<string, boolean>;
  onToggleReadinessCheck: (key: string) => void;
  onLaunchReadinessReview: (domain: FutureReadinessDomain) => void;
}) {
  const Icon = config.icon;
  const hasFutureReadiness = isFutureReadinessDomain(section);

  return (
    <div className="space-y-8">

      <div className="relative border border-white/10 overflow-hidden bg-[#080d14] p-10 md:p-12">

        <div className="absolute inset-0 domain-data-sweep" />

        <div className="relative z-10 max-w-3xl">

          <div className="h-12 w-12 rounded-full border border-white/15 flex items-center justify-center">
            <Icon
              size={22}
              strokeWidth={1.3}
            />
          </div>

          <p className="mt-6 font-mono text-xs text-white/40">
            {config.sdg} · {config.sdgTitle}
          </p>

          <h3 className="mt-3 text-2xl md:text-4xl font-semibold text-balance">
            {config.question}
          </h3>

          <p className="mt-4 text-sm leading-7 text-white/50">
            {config.explanation}
          </p>

          <div className="mt-8 flex items-center gap-2.5 text-xs text-white/40">
            <Sparkles size={14} />
            <span>Select a domain intelligence layer above to inspect GIS, analytics, or AI planning</span>
          </div>

        </div>

      </div>

      {/* Render the dedicated Future Readiness segment automatically for Health, Water, and Environment */}
      {hasFutureReadiness && (
        <DomainFutureReadiness
          domain={section}
          selectedVillage={selectedVillage}
          readinessChecks={readinessChecks}
          onToggleCheck={onToggleReadinessCheck}
          onRunAIReview={() => onLaunchReadinessReview(section)}
        />
      )}

      {agentResult && (
        <AgentWorkspace
          result={agentResult}
          running={false}
        />
      )}

    </div>
  );
}

/* =========================================================
   MAP
========================================================= */

function DomainMap({
  config,
  selectedVillage,
  onSelectVillage,
  lang,
  stateInsights,
  insightsVillage,
}: {
  config: DomainConfig;
  selectedVillage: VillageData | null;
  onSelectVillage: (code: string) => void;
  lang: LanguageCode;
  stateInsights: StateInsightsPayload | null;
  insightsVillage: SectorInsightsVillage | null;
}) {
  const [spatialLayout, setSpatialLayout] = useState<
    "split" | "gis_only" | "satellite_only"
  >("split");

  const activeDomain = config.shortTitle.toLowerCase() as
    | "overview"
    | "education"
    | "health"
    | "water"
    | "livelihood"
    | "environment";
  const selectedLayer =
    activeDomain === "education"
      ? "Education"
      : activeDomain === "health"
      ? "Healthcare"
      : activeDomain === "water"
      ? "Water"
      : activeDomain === "livelihood"
      ? "Livelihood"
      : activeDomain === "environment"
      ? "Environment"
      : "Vulnerability";

  return (
    <div className="space-y-5 animate-[fadeUp_.4s_ease-out]">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <PanelHeader
          icon={<Map size={18} />}
          eyebrow="DUAL SPATIAL INTELLIGENCE · VECTOR GIS + SATELLITE ORTHOIMAGERY"
          title={`${config.mapTitle} & Orbital Satellite View`}
          description={`Side-by-side Telangana ${config.shortTitle.toLowerCase()} choropleth GIS (444 Mandals & geolocated POIs) paired with live Orbital Satellite & Hybrid Terrain imagery.`}
        />

        {/* Workspace View Switcher */}
        <div className="flex flex-wrap items-center gap-1 border border-white/15 bg-[#070b12] p-1 self-start lg:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setSpatialLayout("split")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition whitespace-nowrap ${
              spatialLayout === "split"
                ? "bg-white/15 text-white"
                : "text-white/50 hover:text-white/85"
            }`}
          >
            <Columns2 size={13} className="text-cyan-300" />
            <span>GIS + Satellite Side-by-Side</span>
          </button>
          <button
            type="button"
            onClick={() => setSpatialLayout("gis_only")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition whitespace-nowrap ${
              spatialLayout === "gis_only"
                ? "bg-white/15 text-white"
                : "text-white/50 hover:text-white/85"
            }`}
          >
            <Map size={13} className="text-orange-300" />
            <span>Vector GIS Full</span>
          </button>
          <button
            type="button"
            onClick={() => setSpatialLayout("satellite_only")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition whitespace-nowrap ${
              spatialLayout === "satellite_only"
                ? "bg-white/15 text-white"
                : "text-white/50 hover:text-white/85"
            }`}
          >
            <Globe2 size={13} className="text-emerald-300" />
            <span>Satellite Map Full</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Vector GIS + Separate Satellite Map */}
      <div
        className={`grid gap-5 ${
          spatialLayout === "split" ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"
        }`}
      >
        {(spatialLayout === "split" || spatialLayout === "gis_only") && (
          <div className="flex flex-col border border-white/12 bg-[#060c12] overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 bg-[#080e17] px-4 py-2 text-xs">
              <span className="font-semibold text-orange-200">
                01 · {config.shortTitle} Vector Choropleth GIS
              </span>
              <span className="font-mono text-[10px] text-white/45">
                444 Mandals · Village Polygons
              </span>
            </div>
            <div className="h-[540px] min-h-[440px]">
              <DevelopmentMap
                activeDomain={activeDomain}
                selectedLayer={selectedLayer}
                selectedVillageCode={selectedVillage?.profile.village_code ?? null}
                selectedVillageGeometry={selectedVillage?.gis.geometry}
                selectedMandalCode={selectedVillage?.gis.mandal_code ?? null}
                onVillageSelect={(village: { village_code?: string | number }) => {
                  if (village.village_code !== undefined) {
                    onSelectVillage(String(village.village_code));
                  }
                }}
              />
            </div>
          </div>
        )}

        {(spatialLayout === "split" || spatialLayout === "satellite_only") && (
          <div className="flex flex-col border border-cyan-400/25 bg-[#04080e] overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 bg-[#071019] px-4 py-2 text-xs">
              <span className="font-semibold text-cyan-200">
                02 · {config.shortTitle} Satellite &amp; Hybrid Terrain Map
              </span>
              <span className="font-mono text-[10px] text-white/45">
                Synced Settlement Footprint
              </span>
            </div>
            <div className="h-[540px] min-h-[440px]">
              <SatelliteMap
                activeDomain={activeDomain}
                selectedVillageCode={selectedVillage?.profile.village_code ?? null}
                selectedVillageName={selectedVillage?.profile.village_name ?? null}
                selectedVillageGeometry={selectedVillage?.gis.geometry}
                selectedMandalCode={selectedVillage?.gis.mandal_code ?? null}
                villageAreaSqKm={selectedVillage?.gis.area_sq_km}
                onVillageSelect={(village: { village_code?: string | number }) => {
                  if (village.village_code !== undefined) {
                    onSelectVillage(String(village.village_code));
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>

      {selectedVillage && (
        <GISContextStrip
          config={config}
          selectedVillage={selectedVillage}
        />
      )}

      {/* Sectoral Graphical Visual & Cinematic Transition Directly Below GIS */}
      {activeDomain !== "overview" && (
        <SectorGraphicalVisual
          domain={activeDomain as GraphicalDomain}
          village={insightsVillage}
          lang={lang}
        />
      )}

      {/* Sector-Specific Directory, Groundwater Observatory, Hospital Matrix & Visual Solution Plans */}
      {activeDomain === "education" && (
        <div className="space-y-8">
          <EducationInstitutionsPanel lang={lang} village={insightsVillage} />
          <SectorGoodActionsPanel sector="education" village={insightsVillage} />
        </div>
      )}
      {activeDomain === "water" && (
        <div className="space-y-8">
          <WaterGroundwaterPanel
            lang={lang}
            village={insightsVillage}
            groundwater={stateInsights?.groundwater_by_district ?? []}
          />
          <SectorGoodActionsPanel sector="water" village={insightsVillage} />
        </div>
      )}
      {activeDomain === "health" && (
        <div className="space-y-8">
          <HealthcareServiceMatrixPanel
            lang={lang}
            village={insightsVillage}
            healthcareTiers={stateInsights?.healthcare_tiers ?? []}
          />
          <SectorGoodActionsPanel sector="health" village={insightsVillage} />
          <CitizenLifelineSchemeStudio village={insightsVillage} defaultPersona="health" />
        </div>
      )}
      {activeDomain === "environment" && (
        <div className="space-y-8">
          <EnvironmentWaterbodiesPanel lang={lang} village={insightsVillage} />
          <SectorGoodActionsPanel sector="environment" village={insightsVillage} />
        </div>
      )}
      {activeDomain === "livelihood" && (
        <div className="space-y-8">
          <LivelihoodVisualPlanPanel lang={lang} village={insightsVillage} />
          <SectorGoodActionsPanel sector="livelihood" village={insightsVillage} />
        </div>
      )}
    </div>
  );
}

/* =========================================================
   GIS CONTEXT STRIP
========================================================= */

function GISContextStrip({
  config,
  selectedVillage,
}: {
  config: DomainConfig;
  selectedVillage: VillageData;
}) {
  const sectorIndicator =
    config.shortTitle === "Education"
      ? {
          label: "Education & school reach",
          value: `${selectedVillage.education.literacy_rate}% lit · ${selectedVillage.education.nearest_school_km} km`,
        }
      : config.shortTitle === "Health"
        ? {
            label: "Sanitation & health reach",
            value: `${selectedVillage.health.latrine_within_pct}% latrine · ${selectedVillage.health.nearest_health_km} km`,
          }
        : config.shortTitle === "Water"
          ? {
              label: "Tap water & tanks",
              value: `${selectedVillage.water.tap_water_total_pct}% tap · ${selectedVillage.water.tanks_total} tanks`,
            }
          : config.shortTitle === "Livelihood"
            ? {
                label: "Workforce & banking",
                value: `${selectedVillage.livelihood.banking_access_pct}% banked · ${selectedVillage.livelihood.marginal_worker_percent}% marg.`,
              }
            : config.shortTitle === "Environment"
              ? {
                  label: "Solar & air telemetry",
                  value: `${selectedVillage.environment.avg_solar_radiation_mj_m2} MJ/m² · PM2.5 ${selectedVillage.environment.pm2_5}`,
                }
              : {
                  label: "Composite signal",
                  value: `${selectedVillage.vulnerability.vvi_v2} · ${selectedVillage.vulnerability.vvi_v2_level}`,
                };

  return (
    <div className="border border-white/10 bg-[#070b11] p-6">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

        <div>

          <div className="text-xs font-medium text-orange-300/80">
            Selected Telangana GIS Context
          </div>

          <div className="mt-1.5 text-lg font-medium">
            {selectedVillage.profile.village_name}
          </div>

          <div className="mt-1 font-mono text-xs tabular-nums text-white/40">
            {selectedVillage.profile.mandal_name} Mandal · {selectedVillage.profile.district_name} District · Code {selectedVillage.profile.village_code}
          </div>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

          <SignalValue
            label={sectorIndicator.label}
            value={sectorIndicator.value}
          />

          <SignalValue
            label="Area"
            value={`${selectedVillage.gis.area_sq_km} km²`}
          />

          <SignalValue
            label="Map boundary"
            value={
              selectedVillage.gis.available
                ? "Verified Polygon"
                : "Unavailable"
            }
          />

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   ANALYTICS
========================================================= */

function DomainAnalytics({
  config,
  selectedVillage,
}: {
  config: DomainConfig;
  selectedVillage: VillageData | null;
}) {
  const sectorKey = config.shortTitle.toLowerCase() as
    | "overview"
    | "education"
    | "health"
    | "water"
    | "livelihood"
    | "environment";

  return (
    <div className="space-y-5 animate-[fadeUp_.4s_ease-out]">
      <PanelHeader
        icon={<BarChart3 size={18} />}
        eyebrow="TELANGANA MULTI-SECTOR ANALYTICS"
        title={config.analyticsTitle}
        description={`District comparisons, 444-Mandal statistical distributions, cross-indicator scatter relationships, and village percentile benchmarks for ${config.shortTitle}.`}
      />

      <AnalyticsPanel
        sector={sectorKey}
        selectedVillageCode={selectedVillage?.profile.village_code ?? null}
      />
    </div>
  );
}

/* =========================================================
   LIVELIHOOD ANALYTICS
========================================================= */

function LivelihoodAnalytics({
  selectedVillage,
}: {
  selectedVillage: VillageData | null;
}) {
  return (
    <div className="space-y-5 animate-[fadeUp_.4s_ease-out]">

      <PanelHeader
        icon={<BarChart3 size={18} />}
        eyebrow="CENSUS ANALYTICS"
        title="Livelihood Evidence Analytics"
        description="Work participation, main workers and marginal-worker structure."
      />

      {!selectedVillage ? (
        <EmptyDomainState
          icon={<BarChart3 size={28} />}
          title="Village context required"
          text="Search and select a village to inspect its available livelihood indicators."
        />
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">

          <AnalyticsMetricPanel
            title="Work structure"
            items={[
              [
                "Worker participation",
                `${selectedVillage.livelihood.worker_participation_rate}%`,
              ],
              [
                "Total workers",
                selectedVillage.livelihood.total_workers.toLocaleString(),
              ],
              [
                "Main workers",
                selectedVillage.livelihood.main_workers.toLocaleString(),
              ],
              [
                "Marginal workers",
                selectedVillage.livelihood.marginal_workers.toLocaleString(),
              ],
            ]}
          />

          <AnalyticsMetricPanel
            title="Opportunity signals"
            items={[
              [
                "Marginal-worker share",
                `${selectedVillage.livelihood.marginal_worker_percent}%`,
              ],
              [
                "Non-workers",
                selectedVillage.livelihood.non_workers.toLocaleString(),
              ],
              [
                "Livelihood vulnerability",
                selectedVillage.livelihood.livelihood_vulnerability,
              ],
              [
                "Livelihood score",
                selectedVillage.livelihood.livelihood_score,
              ],
            ]}
          />

        </div>
      )}

    </div>
  );
}

/* =========================================================
   DOMAIN ANALYTICS FRAMEWORK
========================================================= */

function DomainAnalyticsFramework({
  config,
  selectedVillage,
}: {
  config: DomainConfig;
  selectedVillage: VillageData | null;
}) {
  const Icon = config.icon;

  return (
    <div className="domain-analytics-framework animate-[fadeUp_.4s_ease-out]">

      <PanelHeader
        icon={<BarChart3 size={18} />}
        eyebrow="DOMAIN ANALYTICS"
        title={config.analyticsTitle}
        description="The analytical framework is prepared for verified domain-specific datasets."
      />

      <div className="mt-5 grid lg:grid-cols-[.8fr_1.2fr] gap-4">

        <div className="border border-white/10 bg-[#070b11] p-7">

          <div className="h-12 w-12 border border-white/10 flex items-center justify-center">
            <Icon
              size={22}
              strokeWidth={1.3}
            />
          </div>

          <div className="mt-6 text-xs font-medium text-orange-300/80">
            Analytical Model
          </div>

          <h3 className="mt-2 text-2xl font-medium">
            {config.shortTitle} evidence model
          </h3>

          <p className="mt-3 text-sm leading-7 text-white/45">
            This framework is ready for verified{" "}
            {config.shortTitle.toLowerCase()} datasets. No unsupported sector
            values are invented; connect authoritative measures before
            interpreting this domain.
            {config.shortTitle === "Environment" &&
              " Renewable-energy analytics require verified capacity and generation records."}
          </p>

        </div>

        <div className="border border-white/10 bg-[#070b11] p-7">

          <div className="text-xs font-medium text-white/45">
            Analytical Dimensions
          </div>

          <div className="mt-5 grid md:grid-cols-2 gap-3">

            {config.metrics.map((metric, index) => (
              <div
                key={metric}
                className="border border-white/10 bg-white/[0.02] p-5"
              >

                <div className="font-mono text-xs tabular-nums text-orange-300/70">
                  {String(index + 1).padStart(
                    2,
                    "0"
                  )}
                </div>

                <div className="mt-3 text-sm font-medium text-white/90">
                  {metric}
                </div>

                <div className="mt-1.5 text-xs text-white/35">
                  Dataset required
                </div>

              </div>
            ))}

          </div>

          {selectedVillage && (
            <div className="mt-6 pt-6 border-t border-white/10">

              <div className="text-xs text-white/40">
                Selected Location
              </div>

              <div className="mt-1.5 text-sm font-medium">
                {selectedVillage.profile.village_name}
              </div>

              <div className="mt-1 font-mono text-xs tabular-nums text-white/45">
                Population context:{" "}
                {selectedVillage.population.total.toLocaleString()}
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   AI ENGINE
========================================================= */

function DomainAI({
  config,
  selectedVillage,
  featuredVillages = [],
  onSelectVillage,
  agentResult,
  running,
  onRun,
}: {
  config: DomainConfig;
  selectedVillage: VillageData | null;
  featuredVillages?: VillageSearchResult[];
  onSelectVillage?: (code: string) => void;
  agentResult: AgentResult | null;
  running: boolean;
  onRun: (query: string) => void;
}) {
  const [localQuery, setLocalQuery] =
    useState(
      "Review this village's available indicators across Education, Health, Water, Livelihood, and Environment. Identify evidence-backed priorities, propose practical actions, and formulate a village-specific Telangana & Central scheme policy charter and draft committee report."
    );

  const sector = config.shortTitle.toLowerCase();
  const hasReadiness =
    sector === "health" || sector === "water" || sector === "environment";

  const suggestedQueries = [
    {
      label: `Review ${sector} evidence`,
      query: `Review available ${sector} evidence for this village. State the observed measures, what they can and cannot establish, and the most useful next verification steps.`,
    },
    {
      label: `Formulate ${sector} policy`,
      query: `Prepare a draft ${sector} policy formulation from available Telangana evidence. Identify practical interventions, relevant Telangana State & Central government programmes to verify, accountable implementation steps, measurable indicators, and missing data. Do not claim eligibility or scheme coverage.`,
    },
    ...(hasReadiness
      ? [
          {
            label: `Assess ${sector} future readiness`,
            query:
              FUTURE_READINESS[sector as FutureReadinessDomain].aiPrompt,
          },
        ]
      : []),
    {
      label: "Draft committee report",
      query: `Draft a committee-style technical review of available ${sector} indicators for this village: scope, evidence table, interpretation, limitations, priority actions, government programme options with official sources, implementation plan, monitoring framework, and decisions requiring human approval. Clearly label it as a draft, not an official committee finding.`,
    },
  ];

  return (
    <div
      id="ai-intelligence-panel"
      className="domain-ai-panel animate-[fadeUp_.4s_ease-out] space-y-5 scroll-mt-24"
    >

      <PanelHeader
        icon={<Brain size={18} />}
        eyebrow="GEMINI LLM DEVELOPMENT INTELLIGENCE · TELANGANA"
        title={config.aiTitle}
        description="Synthesises Telangana village indicators across all 5 sectors to generate interactive multi-coloured dashboards, village policy formulations, and draft committee reports."
      />

      <div className="grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <div className="border border-white/10 bg-[#070b11] p-7 md:p-8">

          <div className="text-xs font-medium text-white/45">
            Village-Level Planning Question
          </div>

          {!selectedVillage && (
            <div className="mt-3 border border-orange-300/20 bg-orange-300/[0.04] p-4 space-y-3">
              <p className="text-xs leading-6 text-white/70">
                Select a Telangana village below (or via the top search bar / GIS map) before running intelligence:
              </p>
              {featuredVillages.length > 0 && onSelectVillage && (
                <div className="flex flex-wrap gap-1.5">
                  {featuredVillages.slice(0, 6).map((fv) => (
                    <button
                      key={fv.village_code}
                      type="button"
                      onClick={() => onSelectVillage(fv.village_code)}
                      className="border border-orange-300/30 bg-orange-300/[0.08] px-2.5 py-1.5 text-xs text-orange-100 hover:bg-orange-300/[0.16] transition"
                    >
                      {fv.area_name} ({fv.district_name})
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedVillage && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-orange-300/90">
              <Target size={13} />
              <span>
                Active Settlement: <strong>{selectedVillage.profile.village_name}</strong> · {selectedVillage.profile.mandal_name} Mandal · {selectedVillage.profile.district_name} District (Code {selectedVillage.profile.village_code})
              </span>
            </div>
          )}

          <textarea
            value={localQuery}
            onChange={(e) =>
              setLocalQuery(e.target.value)
            }
            placeholder={`Ask a ${config.shortTitle.toLowerCase()} development question...`}
            className="mt-4 w-full h-36 resize-none bg-black/25 border border-white/10 p-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-orange-300/40"
          />

          <div className="mt-4">
            <div className="text-xs font-medium text-white/40">
              Suggested Evidence Prompts
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {suggestedQueries.map(({ label, query }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setLocalQuery(query)}
                  className="border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-white/65 transition hover:border-orange-300/35 hover:bg-orange-300/[0.06] hover:text-orange-100"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() =>
              onRun(localQuery)
            }
            disabled={
              running ||
              !localQuery.trim()
            }
            className="domain-run-button mt-5 w-full py-3.5 border border-orange-300/30 bg-orange-300/[0.08] hover:bg-orange-300/[0.14] disabled:opacity-35 transition flex items-center justify-center gap-2.5 text-xs font-medium text-orange-100"
          >

            {running ? (
              <>
                <Loader2
                  size={15}
                  className="animate-spin"
                />
                <span>Analysing Available Evidence…</span>
              </>
            ) : (
              <>
                <Zap size={15} />
                <span>Run Analysis &amp; Prepare Options</span>
              </>
            )}

          </button>

        </div>

        <aside className="border border-white/10 bg-[#070b11] p-6">
          <div className="text-xs font-medium text-cyan-200/80">
            Execution Provenance
          </div>
          <h3 className="mt-2.5 text-lg font-medium">
            Analysis runs against connected village evidence.
          </h3>
          <dl className="mt-5 space-y-4 text-xs leading-6">
            <div>
              <dt className="text-white/40">Village indicators</dt>
              <dd className="text-white/75">Loaded from the JAN—DRISHTI backend</dd>
            </div>
            <div>
              <dt className="text-white/40">Output scope</dt>
              <dd className="text-white/75">
                Textual evidence review, statistical summaries, GIS signals, future readiness options, and draft reports
              </dd>
            </div>
          </dl>
        </aside>
      </div>

      {agentResult && (
        <AgentWorkspace
          result={agentResult}
          running={running}
        />
      )}

    </div>
  );
}

/* =========================================================
   AGENT WORKSPACE
========================================================= */

function AgentWorkspace({
  result,
  running,
}: {
  result: AgentResult;
  running: boolean;
}) {
  if (result.error) {
    return (
      <div className="border border-red-400/25 bg-red-400/[0.04] p-7">

        <div className="flex items-center gap-2.5 text-red-300">

          <AlertTriangle size={18} />

          <div className="text-xs font-medium">
            AI Engine Error
          </div>

        </div>

        <p className="mt-4 text-sm text-red-100/75">
          {result.error}
        </p>

      </div>
    );
  }

  const analysisRecord = asRecord(result.analysis);
  const analysisReport = asRecord(analysisRecord.report);
  const reasoning = asRecord(result.reasoning);
  const analysisText =
    extractText(analysisReport.executive_summary) ||
    extractText(reasoning.conclusion) ||
    "The evidence review is complete. See the observed indicators, screening results and draft actions below.";
  const decisionSteps = asArray(reasoning.decision_chain)
    .map((step) => {
      const item = asRecord(step);
      const stage = extractText(item.stage);
      const detail = extractText(item.result);
      return stage && detail ? `${stage}: ${detail}` : stage || detail;
    })
    .filter(Boolean);
  const reasoningItems = [
    ...decisionSteps,
    ...asArray(reasoning.reasoning_points).map(extractText),
    ...asArray(reasoning.spatial_reasoning).map(extractText),
    extractText(reasoning.conclusion),
  ]
    .filter(Boolean)
    .slice(0, 10);

  const gapPayload = asRecord(result.gaps);
  const gapItems = Array.isArray(result.gaps)
    ? result.gaps
    : asArray(gapPayload.gaps ?? gapPayload.items);

  const actionItems = asArray(
    result.actions
  );

  return (
    <section className="space-y-5">

      {/* HEADER */}

      <div className="border border-orange-300/20 bg-orange-300/[0.03] p-7 relative overflow-hidden">

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">

          <div>

            <div className="flex items-center gap-2.5 text-xs font-medium text-orange-300">

              <Sparkles size={15} />

              <span>Development Intelligence Result</span>

            </div>

            <h2 className="mt-3 text-2xl md:text-3xl font-medium">
              Evidence review and planning outputs are ready.
            </h2>

            {result.query && (
              <p className="mt-2.5 text-sm text-white/45">
                Query:{" "}
                <span className="text-white/75">
                  {result.query}
                </span>
              </p>
            )}

          </div>

          <div className="flex items-center gap-3 shrink-0">

            <div className="px-4 py-3 border border-white/10 bg-black/25">

              <div className="text-[11px] text-white/40">
                Engine Status
              </div>

              <div className="mt-1 text-xs font-medium text-emerald-300">
                {running
                  ? "Processing"
                  : "Evidence + Screening"}
              </div>

            </div>

            {result.village_code && (
              <div className="px-4 py-3 border border-white/10 bg-black/25">

                <div className="text-[11px] text-white/40">
                  Location
                </div>

                <div className="mt-1 font-mono text-xs tabular-nums text-white/80">
                  {result.village_code}
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

      {/* ANALYSIS + REASONING */}

      <div className="grid xl:grid-cols-[1.2fr_.8fr] gap-5">

        <IntelligenceResultPanel
          icon={<Brain size={18} />}
          eyebrow="Evidence Summary"
          title="What the available evidence shows"
        >
          <p className="text-sm leading-8 text-white/65">
            {analysisText}
          </p>
        </IntelligenceResultPanel>

        <IntelligenceResultPanel
          icon={<Network size={18} />}
          eyebrow="Reasoning Chain"
          title="How the engine reached the result"
        >

          {reasoningItems.length > 0 ? (
            <div className="space-y-3">

              {reasoningItems.map(
                (item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="flex gap-3"
                  >

                    <span className="shrink-0 font-mono text-xs tabular-nums text-orange-300/75">
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <p className="text-xs leading-6 text-white/55">
                      {item}
                    </p>

                  </div>
                )
              )}

            </div>
          ) : (
            <p className="text-xs leading-6 text-white/40">
              Structured reasoning metadata was not returned by the
              engine. The observed evidence should therefore be
              distinguished from inference during review.
            </p>
          )}

        </IntelligenceResultPanel>

      </div>

      {/* GIS + SDG + RISK */}

      <div className="grid xl:grid-cols-3 gap-5">

        <StructuredObjectPanel
          icon={<Map size={17} />}
          eyebrow="GIS SIGNAL"
          title="Spatial intelligence"
          value={result.gis}
        />

        <StructuredObjectPanel
          icon={<Target size={17} />}
          eyebrow="SDG ALIGNMENT"
          title="Development goals"
          value={result.sdg}
        />

        <StructuredObjectPanel
          icon={<AlertTriangle size={17} />}
          eyebrow="RISK SCREENING"
          title="Risk signals"
          value={result.risk}
        />

      </div>

      {/* DEVELOPMENT GAPS */}

      <DevelopmentGapWorkspace
        gaps={gapItems}
      />

      {/* ACTIONS */}

      <InterventionStory
        actions={actionItems}
      />

      {/* DASHBOARD */}

      <InteractiveDashboard
        dashboard={result.big_dashboard}
        analysis={result.analysis}
      />

      {/* POLICY / REPORT */}

      <DecisionWorkspace
        policy={result.policy}
        report={result.report}
      />

      <SocialImpactCapabilitySummary
        risk={result.risk}
        gis={result.gis}
        analysis={result.analysis}
        actionCount={actionItems.length}
        report={result.report}
        policy={result.policy}
      />

      {/* DISCLAIMER */}

      <div className="border border-white/10 bg-white/[0.015] p-5 flex items-start gap-3">

        <ShieldCheck
          size={15}
          className="text-white/40 mt-0.5 shrink-0"
        />

        <p className="text-xs leading-6 text-white/40">
          AI-generated interpretation is decision support, not an
          automatic administrative decision. Observed data, model
          inference, spatial evidence and proposed interventions must
          be reviewed by the responsible human authority before action.
        </p>

      </div>

    </section>
  );
}

function SocialImpactCapabilitySummary({
  risk,
  gis,
  analysis,
  actionCount,
  report,
  policy,
}: {
  risk: unknown;
  gis: unknown;
  analysis: unknown;
  actionCount: number;
  report: unknown;
  policy: unknown;
}) {
  const riskResult = asRecord(risk);
  const gisResult = asRecord(gis);
  const analysisResult = asRecord(analysis);
  const statistics = asRecord(analysisResult.statistics);
  const social = asRecord(statistics.social_indicators);
  const riskAvailable = riskResult.model_available === true;
  const reportResult = asRecord(report);
  const reportContent = asRecord(reportResult.content ?? report);
  const policyResult = asRecord(policy);
  const policyContent = asRecord(
    policyResult.policy_framework ?? policy
  );

  const analytics = [
    ["Population", asRecord(statistics.population).total, "people"],
    ["Literacy", social.literacy_rate, "%"],
    ["Worker participation", social.worker_participation, "%"],
  ]
    .filter(([, value]) => value !== undefined && value !== null)
    .map(
      ([label, value, unit]) =>
        `${label}: ${formatValue(value)}${unit === "%" ? "%" : unit ? ` ${unit}` : ""}`
    )
    .join(" · ");

  const rows = [
    {
      label: "Risk screening",
      status: riskAvailable ? "Trained model loaded" : "Screening only",
      detail: riskAvailable
        ? `Model output: ${formatValue(riskResult.model_prediction)}; probability: ${formatValue(riskResult.model_probability)}.`
        : `No trained predictive model is loaded. ${formatValue(riskResult.risk_percent)}% is an exploratory weighted-indicator screen, not a validated prediction.`,
      tone: riskAvailable ? "text-violet-200" : "text-amber-200",
    },
    {
      label: "GIS / geospatial evidence",
      status:
        gisResult.available === true
          ? "Village boundary available"
          : "Unavailable",
      detail:
        gisResult.available === true
          ? `Mapped extent: ${formatValue(gisResult.area_sq_km)} km². The current boundary does not supply sector service locations.`
          : "No geospatial record was returned for this village.",
      tone: gisResult.available === true ? "text-cyan-200" : "text-white/55",
    },
    {
      label: "Data analytics",
      status: analytics || "No summary indicators returned",
      detail: "Observed values only; missing sector measures are not estimated.",
      tone: "text-amber-100",
    },
    {
      label: "Decision support",
      status: `${actionCount} evidence-linked action${actionCount === 1 ? "" : "s"} · ${Object.keys(reportContent).length ? "draft report" : "no report"} · ${Object.keys(policyContent).length ? "policy options" : "no policy options"}`,
      detail:
        "Draft actions, scheme candidates and monitoring steps require verification by the responsible department.",
      tone: "text-emerald-200",
    },
  ];

  return (
    <section className="border border-white/10 bg-[#070b11] p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="text-xs font-medium text-cyan-200/80">
            Social Impact Decision Support
          </div>
          <h3 className="mt-2 text-xl font-medium">
            Village evidence, GIS and analytics for public-service planning
          </h3>
        </div>
        <p className="max-w-xl text-xs leading-6 text-white/45">
          Turn observed evidence into priorities, geospatial context and reviewable public-service options.
        </p>
      </div>
      <dl className="divide-y divide-white/10">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-2 py-4 md:grid-cols-[200px_1fr] md:gap-6"
          >
            <dt className="text-xs font-medium text-white/50">
              {row.label}
            </dt>
            <dd>
              <div className={`text-sm font-medium tabular-nums ${row.tone}`}>
                {row.status}
              </div>
              <p className="mt-1 text-xs leading-6 text-white/45">
                {row.detail}
              </p>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* =========================================================
   DEVELOPMENT GAPS
========================================================= */

function DevelopmentGapWorkspace({
  gaps,
}: {
  gaps: unknown[];
}) {
  const normalized = gaps.map((gap, index) => {
    const gapRecord = asRecord(gap);
    return {
      title:
        typeof gap === "string"
          ? `Development Gap ${String(index + 1).padStart(2, "0")}`
          : humanizeKey(
              String(
                gapRecord.title ||
                  gapRecord.name ||
                  gapRecord.type ||
                  `gap_${index + 1}`
              )
            ),
      description:
        extractText(gap) ||
        "No finding text was returned for this signal.",
      icon:
        index % 4 === 0
          ? Target
          : index % 4 === 1
          ? TrendingUp
          : index % 4 === 2
          ? Users
          : Search,
    };
  });

  return (
    <section className="border border-white/10 bg-[#070b11] p-7">

      <PanelHeader
        icon={<AlertTriangle size={17} />}
        eyebrow="DEVELOPMENT GAPS"
        title="What deserves investigation?"
        description="Signals are investigation prompts, not labels assigned to communities."
      />

      {normalized.length > 0 ? (
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          {normalized.map((signal, index) => {
            const Icon = signal.icon;

            return (
              <div
                key={`${signal.title}-${index}`}
                className="border border-white/10 bg-white/[0.02] p-6 hover:border-white/20 transition"
              >

                <div className="flex items-start justify-between">

                  <div className="h-10 w-10 border border-white/10 flex items-center justify-center">
                    <Icon
                      size={18}
                      strokeWidth={1.3}
                    />
                  </div>

                  <span className="font-mono text-xs tabular-nums text-white/30">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                </div>

                <h3 className="mt-5 text-base font-medium text-white/90">
                  {signal.title}
                </h3>

                <p className="mt-2.5 text-xs leading-6 text-white/50">
                  {signal.description}
                </p>

              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-6 border border-white/10 bg-white/[0.02] p-5 text-sm leading-6 text-white/45">
          No specific gap signal was returned from the available indicators. Add sector-specific records and local comparison data before drawing conclusions.
        </p>
      )}

    </section>
  );
}

/* =========================================================
   INTERVENTION STORY
========================================================= */

function InterventionStory({
  actions,
}: {
  actions: unknown[];
}) {
  return (
    <section className="border border-white/10 bg-[#070b11] p-7">

      <PanelHeader
        icon={<Zap size={17} />}
        eyebrow="INTERVENTION INTELLIGENCE"
        title="What could change this?"
        description="Evidence-derived recommendations for human review."
      />

      <div className="mt-7 space-y-4">

        {actions.length > 0 ? (
          actions.map((action, index) => {
            if (typeof action === "string") {
              return (
                <div
                  key={`${action}-${index}`}
                  className="border border-white/10 bg-white/[0.02] p-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-full border border-orange-300/25 flex items-center justify-center font-mono text-xs tabular-nums text-orange-200/80">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="text-xs font-medium text-orange-300/80">
                      Evidence-Based Recommendation
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-white/70">{action}</p>
                </div>
              );
            }

            const actionRecord = asRecord(action);
            const fields = [
              {
                label: "Finding",
                value: extractText(
                  actionRecord.finding ??
                    actionRecord.observation ??
                    actionRecord.evidence
                ),
              },
              {
                label: "Gap",
                value: extractText(actionRecord.gap ?? actionRecord.problem),
              },
              {
                label: "Intervention",
                value: extractText(
                  actionRecord.intervention ??
                    actionRecord.recommendation ??
                    actionRecord.action
                ),
              },
              {
                label: "KPI",
                value: extractText(
                  actionRecord.kpi ??
                    actionRecord.metric ??
                    actionRecord.measure
                ),
              },
            ].filter((field) => field.value);

            return (
              <div
                key={index}
                className="border border-white/10 bg-white/[0.02] p-6"
              >
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full border border-orange-300/25 flex items-center justify-center font-mono text-xs tabular-nums text-orange-200/80">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="text-xs font-medium text-orange-300/80">
                    Recommendation Details
                  </div>
                </div>
                {fields.length > 0 ? (
                  <div className="mt-5 grid md:grid-cols-2 gap-px bg-white/10 border border-white/10">
                    {fields.map((field) => (
                      <StoryCell key={field.label} {...field} />
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-white/45">
                    No recommendation details were returned for this item.
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <p className="border border-white/10 bg-white/[0.02] p-5 text-sm text-white/45">
            No recommendations were returned for this analysis.
          </p>
        )}

      </div>

      <div className="mt-5 border border-orange-300/15 bg-orange-300/[0.025] p-5">

        <div className="flex items-start gap-3">

          <ShieldCheck
            size={15}
            className="text-orange-200/60 mt-0.5 shrink-0"
          />

          <p className="text-xs leading-6 text-white/50">
            Recommendations are decision-support prompts, not automatic
            policy decisions. Validate them against current departmental,
            field and community evidence before action.
          </p>

        </div>

      </div>

    </section>
  );
}

/* =========================================================
   DOMAIN GAPS
========================================================= */

function DomainGaps({
  config,
  selectedVillage,
  agentResult,
}: {
  config: DomainConfig;
  selectedVillage: VillageData | null;
  agentResult: AgentResult | null;
}) {
  if (agentResult) {
    const gapData = asRecord(agentResult.gaps);
    const gapItems = Array.isArray(agentResult.gaps)
      ? agentResult.gaps
      : asArray(gapData.gaps ?? gapData.items);

    return (
      <div className="domain-gaps-panel animate-[fadeUp_.4s_ease-out] space-y-5">

        <DevelopmentGapWorkspace
          gaps={gapItems}
        />

        <InterventionStory
          actions={asArray(
            agentResult.actions
          )}
        />

      </div>
    );
  }

  return (
    <div className="domain-gaps-panel animate-[fadeUp_.4s_ease-out]">

      <PanelHeader
        icon={<AlertTriangle size={18} />}
        eyebrow="DEVELOPMENT SIGNALS"
        title={config.gapsTitle}
        description="Signals are prompts for investigation — not labels assigned to communities."
      />

      <p className="mt-5 border border-white/10 bg-white/[0.02] p-5 text-sm leading-7 text-white/55">
        {selectedVillage
          ? `No gap assessment has been run for ${selectedVillage.profile.village_name} yet. Run the evidence analysis to see findings based on the indicators currently available.`
          : "Select a village and run the evidence analysis to see findings. No gap scores or recommendations are fabricated before data is available."}
      </p>

      <div className="mt-5 border border-white/10 bg-[#070b11] p-7">

        <div className="flex items-start gap-4">

          <Network
            size={20}
            className="text-orange-300/75 mt-0.5 shrink-0"
          />

          <div>

            <div className="text-xs font-medium text-white/45">
              JAN—DRISHTI Principle
            </div>

            <p className="mt-2.5 text-sm leading-7 text-white/55">

              The system asks{" "}
              <span className="text-white/85">
                “where does potential exist, but opportunity appear unevenly
                distributed?”
              </span>{" "}
              rather than simply calling one village good and another bad.

            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   STRUCTURED PANELS
========================================================= */

function IntelligenceResultPanel({
  icon,
  eyebrow,
  title,
  children,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border border-white/10 bg-[#070b11] p-7">

      <div className="flex items-center gap-2.5 text-xs font-medium text-orange-300/80">
        {icon}
        <span>{eyebrow}</span>
      </div>

      <h3 className="mt-3 text-xl font-medium">
        {title}
      </h3>

      <div className="mt-5">
        {children}
      </div>

    </div>
  );
}

function StructuredObjectPanel({
  icon,
  eyebrow,
  title,
  value,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  value: unknown;
}) {
  const entries = objectEntries(value).filter(
    ([key, item]) =>
      !["geometry", "coordinates", "features"].includes(key.toLowerCase()) &&
      item !== null &&
      item !== undefined &&
      item !== ""
  );

  return (
    <div className="border border-white/10 bg-[#070b11] p-6">

      <div className="flex items-center gap-2.5 text-xs font-medium text-orange-300/80">
        {icon}
        <span>{eyebrow}</span>
      </div>

      <h3 className="mt-3 text-lg font-medium">
        {title}
      </h3>

      {entries.length > 0 ? (
        <div className="mt-5 space-y-4">
          {eyebrow === "SDG ALIGNMENT" ? (
            <SdgSummary value={value} />
          ) : eyebrow === "RISK SCREENING" ? (
            <RiskScreeningSummary value={value} />
          ) : (
            entries.map(([key, item]) => (
              <div
                key={key}
                className="border-b border-white/5 pb-3.5 last:border-b-0"
              >
                <div className="text-xs text-white/40">
                  {humanizeKey(key)}
                </div>

                <div className="mt-1.5 text-xs leading-6 text-white/65 tabular-nums">
                  {extractText(item) || formatValue(item)}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="mt-5 text-xs leading-6 text-white/35">
          {extractText(value) ||
            "No structured evidence was returned for this panel."}
        </div>
      )}

    </div>
  );
}

function SdgSummary({ value }: { value: unknown }) {
  const goals = asArray(asRecord(value).sdgs).map(asRecord);

  if (goals.length === 0) {
    return (
      <p className="text-xs leading-6 text-white/45">
        No development-goal evidence was returned for this village.
      </p>
    );
  }

  const priorityTone = (priority: string) => {
    if (priority.toLowerCase() === "high") return "text-rose-200";
    if (priority.toLowerCase() === "medium") return "text-amber-200";
    return "text-emerald-200";
  };

  return (
    <div className="space-y-3">
      {goals.map((goal, index) => {
        const goalId = extractText(goal.sdg) || `Goal ${index + 1}`;
        const priority = extractText(goal.priority) || "Review";
        return (
          <article
            key={`${goalId}-${extractText(goal.name)}`}
            className="border border-white/10 bg-white/[0.025] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-mono text-xs text-cyan-200/75">
                  {goalId}
                </div>
                <h4 className="mt-1 text-sm font-medium text-white/90">
                  {extractText(goal.name) || "Development goal"}
                </h4>
              </div>
              <span className={`text-xs font-medium ${priorityTone(priority)}`}>
                {priority} priority
              </span>
            </div>
            <p className="mt-2.5 text-xs leading-5 text-white/55">
              {extractText(goal.signal) || "No specific indicator was provided."}
            </p>
          </article>
        );
      })}
      <p className="border-t border-white/10 pt-3 text-[11px] leading-5 text-white/40">
        Planning prompts based on available village indicators, not official SDG ratings or scheme eligibility decisions.
      </p>
    </div>
  );
}

const RISK_DRIVER_LABELS: Record<string, string> = {
  literacy_risk: "Literacy shortfall signal",
  employment_risk: "Worker participation shortfall signal",
  marginal_worker_risk: "Marginal worker signal",
  vulnerability_risk: "Village vulnerability index",
  vvi_risk: "Composite vulnerability indicator",
};

function RiskScreeningSummary({ value }: { value: unknown }) {
  const risk = asRecord(value);
  const drivers = asRecord(risk.risk_drivers);
  const weights = asRecord(risk.indicator_weights);
  const coverage = asRecord(risk.indicator_coverage);
  const available = coverage.available == null ? NaN : Number(coverage.available);
  const required = coverage.required == null ? NaN : Number(coverage.required);
  const missing = asArray(coverage.missing_or_invalid)
    .map((item) => RISK_DRIVER_LABELS[String(item)] || humanizeKey(String(item)))
    .filter(Boolean);
  const driverRows = Object.entries(drivers);
  const riskPercent =
    risk.risk_percent == null ? NaN : Number(risk.risk_percent);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-amber-200/20 bg-amber-200/[0.04] p-4">
          <div className="text-xs text-white/45">Screening Band</div>
          <div className="mt-1.5 text-base font-medium text-amber-100">
            {extractText(risk.risk_level) || "Not assessed"}
          </div>
        </div>
        <div className="border border-white/10 bg-white/[0.025] p-4">
          <div className="text-xs text-white/45">Screening Score</div>
          <div className="mt-1.5 font-mono text-base font-medium tabular-nums text-white/90">
            {Number.isFinite(riskPercent) ? `${riskPercent.toFixed(2)} / 100` : "Not available"}
          </div>
        </div>
      </div>

      <div className="border border-white/10 bg-white/[0.025] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-white/80">Indicator coverage</div>
            <p className="mt-1 text-[11px] text-white/45">
              {Number.isFinite(available) && Number.isFinite(required)
                ? `${available} of ${required} required indicators available`
                : "Coverage information was not returned"}
            </p>
          </div>
          <div className="font-mono text-sm font-medium tabular-nums text-cyan-200">
            {Number.isFinite(available) && Number.isFinite(required)
              ? `${available}/${required}`
              : "—"}
          </div>
        </div>
        <p className="mt-2 text-[11px] leading-5 text-white/40">
          {missing.length > 0
            ? `Missing or invalid: ${missing.join(", ")}.`
            : available === required && required > 0
              ? "All indicators required by this screening calculation are present."
              : "Some required indicators may be missing."}
        </p>
      </div>

      {driverRows.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-medium text-white/50">
            Score Contributors
          </h4>
          <div className="space-y-2">
            {driverRows.map(([key, rawValue]) => {
              const valueNumber = Number(rawValue);
              const weightNumber = weights[key] == null ? NaN : Number(weights[key]);
              const score = Number.isFinite(valueNumber) ? valueNumber * 100 : null;
              const weight = Number.isFinite(weightNumber) ? weightNumber * 100 : null;
              return (
                <div key={key} className="flex items-center justify-between gap-3 border-b border-white/5 pb-2">
                  <div>
                    <div className="text-xs text-white/75">
                      {RISK_DRIVER_LABELS[key] || humanizeKey(key)}
                    </div>
                    <div className="mt-0.5 text-[11px] text-white/40">
                      {weight === null ? "Weight not supplied" : `${weight.toFixed(0)}% weight`}
                    </div>
                  </div>
                  <div className="shrink-0 font-mono text-xs font-medium tabular-nums text-white/80">
                    {score === null ? "—" : `${score.toFixed(2)} / 100`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="border border-white/10 bg-white/[0.02] p-3 text-[11px] leading-5 text-white/45">
        Exploratory weighted-indicator screen, not a trained-model prediction, individual diagnosis, or official classification.
      </p>
    </div>
  );
}

/* =========================================================
   ANALYTICS METRIC PANEL
========================================================= */

function AnalyticsMetricPanel({
  title,
  items,
}: {
  title: string;
  items: [string, string | number][];
}) {
  return (
    <div className="border border-white/10 bg-[#070b11] p-7">

      <div className="text-xs font-medium text-white/50">
        {title}
      </div>

      <div className="mt-5 space-y-4">

        {items.map(
          ([label, value]) => (
            <SignalValue
              key={label}
              label={label}
              value={value}
            />
          )
        )}

      </div>

    </div>
  );
}

/* =========================================================
   STORY CELL
========================================================= */

function StoryCell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#070b11] p-5">

      <div className="text-xs font-medium text-white/40">
        {label}
      </div>

      <p className="mt-2 text-xs leading-6 text-white/60">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyDomainState({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="min-h-[320px] border border-white/10 bg-[#070b11] flex items-center justify-center">

      <div className="text-center max-w-md px-8">

        <div className="mx-auto h-14 w-14 rounded-full border border-white/10 flex items-center justify-center text-white/50">
          {icon}
        </div>

        <h3 className="mt-5 text-lg font-medium">
          {title}
        </h3>

        <p className="mt-2.5 text-sm leading-6 text-white/40">
          {text}
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   VILLAGE METRIC
========================================================= */

function VillageMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#070b11] p-6">

      <div className="text-xs text-white/40">
        {label}
      </div>

      <div className="mt-2.5 font-mono text-2xl md:text-3xl font-light tabular-nums">
        {value}
      </div>

    </div>
  );
}

/* =========================================================
   INTELLIGENCE CARD
========================================================= */

function IntelligenceCard({
  icon,
  eyebrow,
  title,
  children,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border border-white/10 bg-white/[0.02] p-6">

      <div className="flex items-center gap-2.5 text-xs font-medium text-orange-300/75">
        {icon}
        <span>{eyebrow}</span>
      </div>

      <h3 className="mt-3 text-lg font-medium">
        {title}
      </h3>

      <div className="mt-5 space-y-3.5">
        {children}
      </div>

    </div>
  );
}

/* =========================================================
   SIGNAL VALUE
========================================================= */

function SignalValue({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3">

      <span className="text-xs text-white/45">
        {label}
      </span>

      <span className="font-mono text-xs tabular-nums text-white/85 text-right">
        {value}
      </span>

    </div>
  );
}

/* =========================================================
   ANCIENT CIVILISATIONAL WISDOM COMPONENTS
========================================================= */

function SectorAncientWisdomBanner({ section }: { section: Section }) {
  const wisdom = ANCIENT_WISDOM[section] ?? ANCIENT_WISDOM.overview;

  return (
    <section className="border-b border-white/10 bg-[#060a12] relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-80"
        style={{
          background: `radial-gradient(circle at 12% 50%, ${wisdom.accent}1a 0%, transparent 45%), radial-gradient(circle at 88% 50%, ${wisdom.secondaryAccent}16 0%, transparent 45%)`,
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, ${wisdom.accent}, ${wisdom.secondaryAccent}, transparent)`,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-8 md:px-12 py-9 space-y-6">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr] items-center">
          <div>
            <div
              className="flex flex-wrap items-center gap-2 text-xs font-semibold"
              style={{ color: wisdom.accent }}
            >
              <BookOpen size={14} />
              <span>Ancient Wisdom · {wisdom.label}</span>
              <span className="text-white/35">·</span>
              <span className="text-white/60 font-normal">{wisdom.source}</span>
            </div>

            <div className="mt-3 text-lg md:text-xl font-medium text-amber-100/95 tracking-wide">
              {wisdom.scriptVerse}
            </div>

            <p className="mt-2 text-xs italic text-white/60">
              &ldquo;{wisdom.transliteration}&rdquo;
            </p>

            <p className="mt-3 text-sm md:text-base leading-7 text-white/90 font-medium">
              {wisdom.translation}
            </p>
          </div>

          <div className="border border-white/12 bg-[#05080f]/85 p-5 space-y-3">
            <div>
              <div
                className="text-[11px] font-semibold"
                style={{ color: wisdom.secondaryAccent }}
              >
                Deccan &amp; Telangana Civilisational Continuity
              </div>
              <p className="mt-1 text-xs leading-6 text-white/65">
                {wisdom.deccanHeritage}
              </p>
            </div>
            <div className="border-t border-white/10 pt-3">
              <div className="text-[11px] font-semibold text-white/80">
                Modern Planning Application
              </div>
              <p className="mt-1 text-xs leading-6 text-white/60">
                {wisdom.modernBridge}
              </p>
            </div>
          </div>
        </div>

        <AncientWisdomVisual
          domain={
            (section in ANCIENT_WISDOM ? section : "overview") as AncientWisdomDomain
          }
          compact
        />
      </div>
    </section>
  );
}

function OverviewAncientWisdomSection({
  onEnterSector,
}: {
  onEnterSector: (sector: Section) => void;
}) {
  const [selectedTab, setSelectedTab] = useState<Section>("water");
  const entry = ANCIENT_WISDOM[selectedTab];
  const allTabs: Section[] = [
    "overview",
    "education",
    "health",
    "water",
    "livelihood",
    "environment",
  ];

  return (
    <section className="border-t border-white/10 bg-[#050911]/55 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 20% 35%, ${entry.accent}18 0%, transparent 44%), radial-gradient(circle at 80% 70%, ${entry.secondaryAccent}16 0%, transparent 46%)`,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-8 py-20 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <BookOpen size={15} />
              <span>Civilisational Ethos · Ancient Wisdom Across All Sectors</span>
            </div>
            <h3 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-balance">
              Timeless Indian &amp; Deccan wisdom paired with modern spatial evidence.
            </h3>
            <p className="mt-3 text-sm leading-7 text-white/55">
              Every development pillar in Jan—Drishti draws inspiration from classical
              ethics, ecological stewardship, and Telangana&apos;s own engineering heritage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 border border-white/12 bg-[#070c14] p-1 self-start lg:self-auto">
            {allTabs.map((sec) => {
              const w = ANCIENT_WISDOM[sec];
              const isSelected = selectedTab === sec;
              const title =
                sec === "overview" ? "Governance" : DOMAINS[sec].shortTitle;
              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSelectedTab(sec)}
                  style={{
                    borderColor: isSelected ? `${w.accent}70` : "transparent",
                    backgroundColor: isSelected ? `${w.accent}22` : "transparent",
                  }}
                  className={`border px-3 py-1.5 text-xs font-medium transition whitespace-nowrap ${
                    isSelected ? "text-white" : "text-white/55 hover:text-white/90"
                  }`}
                >
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full mr-1.5 align-middle"
                    style={{ backgroundColor: w.accent }}
                  />
                  {title}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative overflow-hidden border border-white/15 bg-[#070c15] p-8 md:p-10">
          <div
            className="absolute inset-x-0 top-0 h-[3px]"
            style={{
              background: `linear-gradient(90deg, ${entry.accent}, ${entry.secondaryAccent})`,
            }}
          />

          <div className="grid gap-8 lg:grid-cols-[1.25fr_.75fr] items-center">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className="font-semibold"
                  style={{ color: entry.accent }}
                >
                  {entry.label}
                </span>
                <span className="text-white/35">·</span>
                <span className="text-white/60">{entry.source}</span>
              </div>

              <div className="text-xl md:text-2xl font-medium text-amber-100 leading-relaxed">
                {entry.scriptVerse}
              </div>

              <p className="text-xs md:text-sm italic text-white/60 leading-6">
                &ldquo;{entry.transliteration}&rdquo;
              </p>

              <p className="text-base md:text-lg font-medium text-white/95 leading-8">
                {entry.translation}
              </p>

              {selectedTab !== "overview" && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onEnterSector(selectedTab)}
                    style={{
                      borderColor: `${entry.accent}55`,
                      backgroundColor: `${entry.accent}18`,
                    }}
                    className="inline-flex items-center gap-2 border px-4 py-2 text-xs font-medium text-white hover:brightness-125 transition"
                  >
                    <span>Explore {DOMAINS[selectedTab].shortTitle} Intelligence</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4 border border-white/10 bg-[#05080f] p-6">
              <div>
                <div
                  className="text-xs font-semibold"
                  style={{ color: entry.secondaryAccent }}
                >
                  Telangana &amp; Deccan Heritage
                </div>
                <p className="mt-1.5 text-xs leading-6 text-white/65">
                  {entry.deccanHeritage}
                </p>
              </div>
              <div className="border-t border-white/10 pt-4">
                <div className="text-xs font-semibold text-white/85">
                  Connection to Village Evidence
                </div>
                <p className="mt-1.5 text-xs leading-6 text-white/60">
                  {entry.modernBridge}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-6">
            <AncientWisdomVisual
              domain={selectedTab as AncientWisdomDomain}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   COLOURFUL NAV BUTTON
========================================================= */

function NavButton({
  active,
  icon,
  label,
  accentColor = "#ff9933",
  badge,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  accentColor?: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      data-domain={label.toLowerCase()}
      style={{
        borderColor: active ? `${accentColor}75` : `${accentColor}1f`,
        background: active
          ? `linear-gradient(90deg, ${accentColor}30 0%, ${accentColor}0c 100%)`
          : `linear-gradient(90deg, ${accentColor}0a 0%, transparent 100%)`,
      }}
      className={`domain-nav-item group w-full flex items-center gap-3 px-2.5 py-2 mb-1.5 text-left border transition hover:brightness-125 ${
        active ? "text-white shadow-sm" : "text-white/75 hover:text-white"
      }`}
    >
      <span
        className="flex h-7 w-7 items-center justify-center shrink-0 transition"
        style={{
          backgroundColor: active ? `${accentColor}38` : `${accentColor}20`,
          color: accentColor,
          boxShadow: active ? `0 0 14px ${accentColor}40` : "none",
        }}
      >
        {icon}
      </span>

      <span className="text-xs font-medium truncate">{label}</span>

      {badge && !active && (
        <span
          className="ml-auto font-mono text-[10px]"
          style={{ color: `${accentColor}cc` }}
        >
          {badge}
        </span>
      )}

      {active && (
        <ChevronRight
          size={13}
          className="ml-auto shrink-0"
          style={{ color: accentColor }}
        />
      )}
    </button>
  );
}

/* =========================================================
   SIDEBAR SIGNAL
========================================================= */

function SidebarSignal({
  icon,
  text,
  color = "#38bdf8",
}: {
  icon: ReactNode;
  text: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 text-xs text-white/65">
      <span style={{ color }}>{icon}</span>
      <span>{text}</span>
    </div>
  );
}

/* =========================================================
   TOOL BUTTON
========================================================= */

function ToolButton({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`group min-h-[140px] p-5 border text-left transition relative overflow-hidden ${
        active
          ? "domain-tool domain-tool-active border-orange-300/45 bg-gradient-to-br from-orange-400/[0.12] via-cyan-400/[0.06] to-transparent"
          : "domain-tool border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]"
      }`}
    >

      <div className="relative z-10 flex h-full flex-col justify-between">

        <div className="flex items-start justify-between">

          <div
            className={
              active
                ? "domain-tool-icon text-orange-200"
                : "text-cyan-200/70 group-hover:text-white"
            }
          >
            {icon}
          </div>

          <ArrowRight
            size={14}
            className="text-white/30 group-hover:text-orange-300 transition"
          />

        </div>

        <div className="mt-5">
          <h3 className="text-sm font-medium text-white/95">
            {title}
          </h3>

          <p className="mt-1.5 text-xs leading-5 text-white/50">
            {description}
          </p>
        </div>

      </div>

    </button>
  );
}

/* =========================================================
   PANEL HEADER
========================================================= */

function PanelHeader({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="domain-panel-heading flex flex-col md:flex-row md:items-end justify-between gap-4">

      <div>

        <div className="domain-panel-kicker flex items-center gap-2 text-xs font-medium text-orange-300/85">
          {icon}
          <span>{eyebrow}</span>
        </div>

        <h2 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight">
          {title}
        </h2>

        <p className="mt-1.5 text-xs leading-6 text-white/50">
          {description}
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   SIGNAL ROW
========================================================= */

function SignalRow({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-4">

      <span className="font-mono text-xs tabular-nums text-orange-300/85">
        {number}
      </span>

      <div className="h-px flex-1 bg-white/10" />

      <span className="text-xs text-white/65">
        {text}
      </span>

    </div>
  );
}

/* =========================================================
   MULTI-CHROMATIC VECTOR & TRANSITION ANIMATION STYLES
========================================================= */

function CinematicStyles() {
  return (
    <style>{`
      @keyframes fadeUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes shimmer {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }

      @keyframes dataSweep {
        0% {
          transform: translateX(-100%);
          opacity: 0;
        }
        25% {
          opacity: .42;
        }
        50% {
          opacity: .16;
        }
        100% {
          transform: translateX(100%);
          opacity: 0;
        }
      }

      @keyframes gridDrift {
        0% {
          background-position: 0 0;
        }
        100% {
          background-position: 112px 84px;
        }
      }

      @keyframes chakraRotate {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes chakraReverse {
        from {
          transform: rotate(360deg);
        }
        to {
          transform: rotate(0deg);
        }
      }

      @keyframes prismPulse {
        0% {
          opacity: 0.65;
          transform: scale(0.96);
        }
        50% {
          opacity: 1;
          transform: scale(1.04);
        }
        100% {
          opacity: 0.75;
          transform: scale(0.98);
        }
      }

      @keyframes ribbonSweep {
        0% {
          transform: translateX(-65%) skewX(-12deg);
          opacity: 0.25;
        }
        50% {
          transform: translateX(0%) skewX(-12deg);
          opacity: 0.9;
        }
        100% {
          transform: translateX(65%) skewX(-12deg);
          opacity: 0.25;
        }
      }

      @keyframes tricolorSlide {
        0% {
          transform: translateX(-100%);
        }
        50% {
          transform: translateX(0%);
        }
        100% {
          transform: translateX(100%);
        }
      }

      .opening-intro-halo {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at 26% 36%, rgba(255, 153, 51, 0.24), transparent 38%),
          radial-gradient(circle at 74% 62%, rgba(16, 185, 129, 0.22), transparent 40%),
          radial-gradient(circle at 52% 28%, rgba(6, 182, 212, 0.18), transparent 42%),
          radial-gradient(circle at 48% 76%, rgba(236, 72, 153, 0.15), transparent 42%);
        pointer-events: none;
      }

      .opening-intro-prism {
        position: absolute;
        inset: 0;
        background: linear-gradient(120deg, transparent 25%, rgba(255,153,51,0.09) 45%, rgba(6,182,212,0.11) 55%, transparent 75%);
        animation: ribbonSweep 2.4s ease-in-out infinite;
        pointer-events: none;
      }

      .opening-intro-grid {
        position: absolute;
        inset: 0;
        background-image:
          radial-gradient(circle, rgba(255, 255, 255, 0.16) 1px, transparent 1px);
        background-size: 32px 32px;
        opacity: 0.45;
        pointer-events: none;
      }

      .opening-intro-tricolor {
        background: linear-gradient(90deg, #ff9933, #ef4444, #06b6d4, #10b981, #84cc16);
        animation: tricolorSlide 1.5s ease-in-out infinite;
      }

      .cinematic-prism-aurora {
        animation: prismPulse 1.1s ease-in-out infinite;
      }

      .cinematic-ribbon-sweep {
        animation: ribbonSweep 0.95s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }

      .cinematic-transition-chakra {
        animation: chakraRotate 6s linear infinite;
      }

      .cinematic-transition-reverse {
        animation: chakraReverse 4.5s linear infinite;
      }

      .cinematic-progress-sweep {
        animation: tricolorSlide 0.95s cubic-bezier(0.16, 1, 0.3, 1) infinite;
      }

      @keyframes fillProgress3s {
        0% {
          width: 0%;
        }
        100% {
          width: 100%;
        }
      }

      .cinematic-progress-3s {
        animation: fillProgress3s 3s linear forwards;
      }

      .overview-data-field {
        background-image:
          radial-gradient(
            circle,
            rgba(255,255,255,.13) 1px,
            transparent 1px
          );
        background-size: 28px 28px;
        animation: gridDrift 16s linear infinite;
        mask-image: linear-gradient(
          to bottom,
          transparent,
          black,
          transparent
        );
      }

      .domain-data-sweep {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255,255,255,.05),
          transparent
        );
        animation: dataSweep 6s linear infinite;
        pointer-events: none;
      }

      @keyframes ambientWashShift {
        0% {
          background-position: 0% 35%;
        }
        33% {
          background-position: 85% 20%;
        }
        66% {
          background-position: 50% 90%;
        }
        100% {
          background-position: 0% 35%;
        }
      }

      @keyframes ambientOrbDriftA {
        0% {
          transform: translate3d(-6%, -4%, 0) scale(1);
        }
        50% {
          transform: translate3d(28%, 18%, 0) scale(1.14);
        }
        100% {
          transform: translate3d(-6%, -4%, 0) scale(1);
        }
      }

      @keyframes ambientOrbDriftB {
        0% {
          transform: translate3d(8%, -6%, 0) scale(1.06);
        }
        50% {
          transform: translate3d(-26%, 22%, 0) scale(0.94);
        }
        100% {
          transform: translate3d(8%, -6%, 0) scale(1.06);
        }
      }

      @keyframes ambientOrbDriftC {
        0% {
          transform: translate3d(-10%, 10%, 0) scale(0.96);
        }
        50% {
          transform: translate3d(22%, -20%, 0) scale(1.12);
        }
        100% {
          transform: translate3d(-10%, 10%, 0) scale(0.96);
        }
      }

      .ambient-bg-wash {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          125deg,
          rgba(255, 153, 51, 0.045) 0%,
          rgba(239, 68, 68, 0.04) 20%,
          rgba(16, 185, 129, 0.05) 42%,
          rgba(6, 182, 212, 0.05) 64%,
          rgba(236, 72, 153, 0.04) 82%,
          rgba(132, 204, 22, 0.045) 100%
        );
        background-size: 320% 320%;
        animation: ambientWashShift 26s ease-in-out infinite;
      }

      .ambient-bg-orb {
        position: absolute;
        border-radius: 9999px;
        filter: blur(100px);
        will-change: transform;
      }

      .ambient-bg-orb-1 {
        top: -8%;
        left: 8%;
        width: 46vw;
        height: 46vw;
        max-width: 640px;
        max-height: 640px;
        background: radial-gradient(
          circle,
          rgba(255, 153, 51, 0.085) 0%,
          rgba(239, 68, 68, 0.055) 45%,
          transparent 72%
        );
        animation: ambientOrbDriftA 28s ease-in-out infinite;
      }

      .ambient-bg-orb-2 {
        top: 22%;
        right: -6%;
        width: 48vw;
        height: 48vw;
        max-width: 680px;
        max-height: 680px;
        background: radial-gradient(
          circle,
          rgba(6, 182, 212, 0.085) 0%,
          rgba(16, 185, 129, 0.06) 46%,
          transparent 72%
        );
        animation: ambientOrbDriftB 34s ease-in-out infinite;
      }

      .ambient-bg-orb-3 {
        bottom: -12%;
        left: 26%;
        width: 44vw;
        height: 44vw;
        max-width: 620px;
        max-height: 620px;
        background: radial-gradient(
          circle,
          rgba(236, 72, 153, 0.07) 0%,
          rgba(132, 204, 22, 0.055) 48%,
          transparent 72%
        );
        animation: ambientOrbDriftC 38s ease-in-out infinite;
      }

      /* 5-Domain Cards Matched to Left Sidebar Palette */
      .domain-card {
        --domain-rgb: 255, 153, 51;
        --domain-hex: #ff9933;
        --domain-soft: #fdba74;
        border-color: rgba(var(--domain-rgb), 0.28);
        background: linear-gradient(
          155deg,
          rgba(var(--domain-rgb), 0.14) 0%,
          rgba(var(--domain-rgb), 0.04) 48%,
          rgba(8, 13, 20, 0.88) 100%
        );
      }

      .domain-card[data-domain="education"] {
        --domain-rgb: 239, 68, 68;
        --domain-hex: #ef4444;
        --domain-soft: #fca5a5;
      }

      .domain-card[data-domain="health"] {
        --domain-rgb: 16, 185, 129;
        --domain-hex: #10b981;
        --domain-soft: #6ee7b7;
      }

      .domain-card[data-domain="water"] {
        --domain-rgb: 6, 182, 212;
        --domain-hex: #06b6d4;
        --domain-soft: #67e8f9;
      }

      .domain-card[data-domain="livelihood"] {
        --domain-rgb: 236, 72, 153;
        --domain-hex: #ec4899;
        --domain-soft: #f9a8d4;
      }

      .domain-card[data-domain="environment"] {
        --domain-rgb: 132, 204, 22;
        --domain-hex: #84cc16;
        --domain-soft: #bef264;
      }

      .domain-card:hover {
        border-color: rgba(var(--domain-rgb), 0.62);
        background: linear-gradient(
          155deg,
          rgba(var(--domain-rgb), 0.22) 0%,
          rgba(var(--domain-rgb), 0.07) 52%,
          rgba(9, 15, 24, 0.92) 100%
        );
        box-shadow: 0 14px 34px -14px rgba(var(--domain-rgb), 0.32);
      }

      .domain-card-bar {
        background: linear-gradient(
          90deg,
          var(--domain-hex),
          var(--domain-soft)
        );
      }

      .domain-card-icon {
        background-color: rgba(var(--domain-rgb), 0.16);
        border: 1px solid rgba(var(--domain-rgb), 0.28);
        color: var(--domain-hex);
      }

      .domain-card:hover .domain-card-icon {
        background-color: rgba(var(--domain-rgb), 0.26);
        border-color: rgba(var(--domain-rgb), 0.52);
        box-shadow: 0 0 16px rgba(var(--domain-rgb), 0.28);
      }

      .domain-card-sdg {
        color: var(--domain-soft);
      }

      .domain-card-kicker {
        color: rgba(var(--domain-rgb), 0.9);
      }

      .domain-card-cta {
        color: var(--domain-soft);
      }

      .domain-card:hover .domain-card-cta {
        color: #ffffff;
      }

      .domain-card-sweep {
        background: linear-gradient(
          110deg,
          transparent 30%,
          rgba(var(--domain-rgb), 0.14) 48%,
          transparent 65%
        );
        transform: translateX(-100%);
        pointer-events: none;
      }

      .domain-card:hover .domain-card-sweep {
        animation: shimmer 0.9s ease-out;
      }

      .score-bar-fill.education {
        background: linear-gradient(90deg, #c5192d, #f97316);
      }

      .score-bar-fill.livelihood {
        background: linear-gradient(90deg, #a21942, #ec4899);
      }

      .score-bar-fill.overall {
        background: linear-gradient(90deg, #ff9933, #22c55e);
      }

      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: .001ms !important;
          animation-iteration-count: 1 !important;
          scroll-behavior: auto !important;
        }
      }
    `}</style>
  );
}

