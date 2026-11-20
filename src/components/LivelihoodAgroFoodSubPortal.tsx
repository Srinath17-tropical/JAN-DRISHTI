import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Droplets,
  Factory,
  Layers,
  Maximize2,
  Minimize2,
  Play,
  RefreshCw,
  Sparkles,
  Sprout,
  Sun,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  DistrictGroundwaterRow,
  SectorInsightsVillage,
} from "./SectorActionModules";
import farmersHeroImg from "../assets/images/farmers_agroforestry_telangana_1795152434844.jpg";
import foodProcessingHeroImg from "../assets/images/sunrise_food_processing_india_1795152435624.jpg";

type SubPortalCategory = "farmers" | "food_processing";
type IrrigationTech = "flood" | "drip_mulch" | "solar_iot";
type CropPriority = "balanced" | "income_max" | "water_shield";

type LiveWeatherAgro = {
  current?: {
    tempC: number;
    apparentTempC: number;
    humidityPct: number;
    windKmh: number;
    uvIndex?: number;
    solarRadiationWm2?: number;
    rainMm: number;
  };
  agroHydro?: {
    soilTemp6cm: number;
    soilMoistureTop: number;
    soilMoistureRoot: number;
    et0MmDay: number;
    sunriseIso?: string;
    sunsetIso?: string;
    elevationM?: number;
  };
  forecast7dRainMm?: number;
  fetchedAt?: string;
};

type DistrictSoilProfile = {
  soilName: string;
  soilOrder: string;
  agroZone: string;
  clayPct: number;
  siltPct: number;
  sandPct: number;
  ph: string;
  organicCarbonPct: string;
  drainage: string;
  waterHolding: string;
  naturalStrengths: string;
  keyAmendment: string;
  accentHex: string;
};

function getDistrictSoilProfile(districtName: string): DistrictSoilProfile {
  const d = districtName.toLowerCase();
  if (
    d.includes("adilabad") ||
    d.includes("asifabad") ||
    d.includes("mancherial") ||
    d.includes("nirmal")
  ) {
    return {
      soilName: "Deep Black Cotton Soil & Basaltic Forest Loam",
      soilOrder: "Vertisol / High-Clay Plateau",
      agroZone: "Northern Telangana High-Elevation Zone",
      clayPct: 52,
      siltPct: 26,
      sandPct: 22,
      ph: "7.2 – 7.9",
      organicCarbonPct: "0.68%",
      drainage: "Moderate · Sub-soil moisture retention 85 days",
      waterHolding: "High (210 mm/m)",
      naturalStrengths: "Rich calcium-magnesium clay ideal for orchards, pulses, chillies & winter-chill pockets.",
      keyAmendment: "Raised-bed drainage + paddy-straw root mulching + Trichoderma bio-compost.",
      accentHex: "#10b981",
    };
  }
  if (
    d.includes("khammam") ||
    d.includes("kothagudem") ||
    d.includes("mulugu") ||
    d.includes("bhupalpally") ||
    d.includes("warangal") ||
    d.includes("hanumakonda") ||
    d.includes("mahabubabad")
  ) {
    return {
      soilName: "Godavari Alluvial & Heavy Black Loam",
      soilOrder: "Vertic Inceptisol · Fertile Silty Clay",
      agroZone: "Central & Eastern Riverine Zone",
      clayPct: 44,
      siltPct: 32,
      sandPct: 24,
      ph: "6.9 – 7.6",
      organicCarbonPct: "0.74%",
      drainage: "Good in sandy-clay ridges; deep root support",
      waterHolding: "High (195 mm/m)",
      naturalStrengths: "High potassium & humus reserves supporting turmeric, GI dry chillies & multi-tier mango.",
      keyAmendment: "Neem-cake basal dressing + drip fertigation to stop nutrient leaching.",
      accentHex: "#f59e0b",
    };
  }
  if (
    d.includes("nizamabad") ||
    d.includes("kamareddy") ||
    d.includes("karimnagar") ||
    d.includes("jagtial") ||
    d.includes("peddapalli") ||
    d.includes("sircilla")
  ) {
    return {
      soilName: "Fertile Black-to-Red Loamy Transitional Soil",
      soilOrder: "Vertic Alfisol · Turmeric & Maize Belt",
      agroZone: "Northern–Central Irrigated Zone",
      clayPct: 36,
      siltPct: 29,
      sandPct: 35,
      ph: "6.8 – 7.5",
      organicCarbonPct: "0.61%",
      drainage: "Well-drained aeration ideal for rhizomes",
      waterHolding: "Medium-High (165 mm/m)",
      naturalStrengths: "Premier Telangana curcumin-turmeric, sweet corn, and seed-production soil structure.",
      keyAmendment: "Jeevamrutham + vermicompost beds with micro-sprinklers.",
      accentHex: "#eab308",
    };
  }
  return {
    soilName: "Deccan Red Chalkas (Sandy Loam) & Mixed Patches",
    soilOrder: "Alfisol / Granite Weathering",
    agroZone: "Southern Telangana Rain-Shadow Zone",
    clayPct: 24,
    siltPct: 22,
    sandPct: 54,
    ph: "6.3 – 7.2",
    organicCarbonPct: "0.49%",
    drainage: "Rapid percolation — needs mulch cover",
    waterHolding: "Medium (125 mm/m)",
    naturalStrengths: "Clean friable soil perfect for millets, groundnut, dragon fruit, pomegranate & fodder.",
    keyAmendment: "Tank-silt application + organic straw mulch + sub-surface drip lines.",
    accentHex: "#f97316",
  };
}

type IdealCropModel = {
  id: string;
  name: string;
  seasonWindow: string;
  category: string;
  conventionalComparison: string;
  baseIncomePerAcre: number;
  targetIncomePerAcre: number;
  waterNeedIndex: number; // 1 = ultra low, 10 = very high
  waterSavedPct: number;
  electricitySavedPct: number;
  soilAffinity: string[];
  colorHex: string;
  rationale: string;
  methodTag: string;
};

const IDEAL_CROP_MODELS: IdealCropModel[] = [
  {
    id: "turmeric-intercrop",
    name: "GI Turmeric + Intercrop Maize & Red Gram",
    seasonWindow: "June – Feb (240 days)",
    category: "High-Value Spice Polyculture",
    conventionalComparison: "Flood Monocrop Paddy",
    baseIncomePerAcre: 52000,
    targetIncomePerAcre: 148000,
    waterNeedIndex: 5,
    waterSavedPct: 58,
    electricitySavedPct: 54,
    soilAffinity: ["Vertic Alfisol", "Vertic Inceptisol", "Vertisol"],
    colorHex: "#f59e0b",
    rationale: "Raised-bed drip + maize wind-shade boosts rhizome weight 28% while halving pump runs.",
    methodTag: "Drip + Solar Boiling",
  },
  {
    id: "millet-pulses",
    name: "Foxtail & Jowar Millets + Pigeon Pea Strips",
    seasonWindow: "Kharif + Rabi (105 days)",
    category: "Climate-Resilient Nutri-Cereal",
    conventionalComparison: "Borewell Watered Cotton",
    baseIncomePerAcre: 39000,
    targetIncomePerAcre: 96000,
    waterNeedIndex: 2,
    waterSavedPct: 76,
    electricitySavedPct: 72,
    soilAffinity: ["Alfisol", "Vertisol", "Vertic Alfisol"],
    colorHex: "#10b981",
    rationale: "Survives mid-season dry spells; pigeon pea fixes natural atmospheric nitrogen in root zone.",
    methodTag: "Zero-Borewell + FPO",
  },
  {
    id: "horti-understory",
    name: "Guava / Mango Orchard + Ginger & Turmeric Shade",
    seasonWindow: "Perennial Multi-Tier Harvest",
    category: "Agri-Horti-Forestry",
    conventionalComparison: "Single-Crop Rainfed Field",
    baseIncomePerAcre: 44000,
    targetIncomePerAcre: 162000,
    waterNeedIndex: 4,
    waterSavedPct: 64,
    electricitySavedPct: 60,
    soilAffinity: ["Vertic Inceptisol", "Vertisol", "Alfisol"],
    colorHex: "#06b6d4",
    rationale: "Double-deck farming harvests ground spices in Year 1–3 before fruit canopy closes.",
    methodTag: "Sub-Surface Drip",
  },
  {
    id: "chilli-solar",
    name: "Guntur/Khammam Stemless Red Chilli + Trap Marigold",
    seasonWindow: "Aug – Mar (210 days)",
    category: "Export Spice Cluster",
    conventionalComparison: "Open Chemical Chilli",
    baseIncomePerAcre: 62000,
    targetIncomePerAcre: 174000,
    waterNeedIndex: 5,
    waterSavedPct: 52,
    electricitySavedPct: 48,
    soilAffinity: ["Vertic Inceptisol", "Vertisol"],
    colorHex: "#ef4444",
    rationale: "Marigold border traps thrips naturally, cutting pesticide bills 40% for aflatoxin-free export.",
    methodTag: "IPM + Solar Tunnel Dry",
  },
  {
    id: "dragon-arid",
    name: "Red-Flesh Dragon Fruit + Intercrop Sesame",
    seasonWindow: "Perennial · Year-Round Flushes",
    category: "Arid Aquifer Saver",
    conventionalComparison: "Exhausted Paddy Borewell",
    baseIncomePerAcre: 38000,
    targetIncomePerAcre: 215000,
    waterNeedIndex: 1,
    waterSavedPct: 84,
    electricitySavedPct: 81,
    soilAffinity: ["Alfisol", "Vertic Alfisol"],
    colorHex: "#ec4899",
    rationale: "Nocturnal CAM photosynthesis keeps stomata shut during harsh afternoon heat, saving 84% water.",
    methodTag: "Trellis + CAM Drip",
  },
  {
    id: "adilabad-apple",
    name: "Low-Chill HRMN-99 Apple & Pear Microclimate",
    seasonWindow: "Perennial + Winter Mulch",
    category: "Ecosystem Replication",
    conventionalComparison: "Low-Margin Rainfed Soybean",
    baseIncomePerAcre: 42000,
    targetIncomePerAcre: 295000,
    waterNeedIndex: 4,
    waterSavedPct: 62,
    electricitySavedPct: 58,
    soilAffinity: ["Vertisol", "Vertic Alfisol", "Vertic Inceptisol"],
    colorHex: "#f43f5e",
    rationale: "Replicates Himalayan winter dormancy across Telangana winter pockets (Adilabad–Vikarabad plateaus).",
    methodTag: "Straw Mulch + Micro-Mist",
  },
];

type AgroforestryMethod = {
  id: string;
  name: string;
  canopyTop: string;
  midTier: string;
  groundTier: string;
  soilBenefit: string;
  incomeBoost: string;
  carbonTonnesYr: number;
  waterRetentionBoost: string;
  accentHex: string;
};

const AGROFORESTRY_METHODS: AgroforestryMethod[] = [
  {
    id: "agri_horti",
    name: "Agri-Horti-Forestry",
    canopyTop: "Teak / Malabar Neem (Boundary)",
    midTier: "Mango / Guava / Custard Apple",
    groundTier: "Turmeric, Ginger & Pulses",
    soilBenefit: "Drops soil temp by 4.2°C, builds 1.4 cm topsoil humus per 3 yrs.",
    incomeBoost: "+175% Multi-Season Income",
    carbonTonnesYr: 6.4,
    waterRetentionBoost: "+38% Soil Moisture Lock",
    accentHex: "#10b981",
  },
  {
    id: "silvipasture",
    name: "Silvipasture + Dairy",
    canopyTop: "Hardwickia & Moringa Fodder Trees",
    midTier: "Subabul Protein Hedgerows",
    groundTier: "CO-4 Napier Grass + Stylo Legumes",
    soilBenefit: "Year-round green protein cuts commercial cattle feed costs by 55%.",
    incomeBoost: "+145% Milk + Goat Revenue",
    carbonTonnesYr: 5.8,
    waterRetentionBoost: "+42% Runoff Absorbed",
    accentHex: "#f59e0b",
  },
  {
    id: "alley_nfix",
    name: "Alley Nitrogen Cropping",
    canopyTop: "Gliricidia & Leucaena Alleys (every 8m)",
    midTier: "Pigeon Pea (Red Gram)",
    groundTier: "Foxtail Millet & Groundnut",
    soilBenefit: "Root rhizobia fix 65–90 kg atmospheric N₂/acre — cuts urea usage 60%.",
    incomeBoost: "+125% + Zero Chemical Drop",
    carbonTonnesYr: 4.9,
    waterRetentionBoost: "+31% Organic Sponge",
    accentHex: "#06b6d4",
  },
  {
    id: "riparian_bamboo",
    name: "Bamboo & Bund Shield",
    canopyTop: "Bheema Bamboo & Tamarind Windbreaks",
    midTier: "Lemon & Drumstick Borders",
    groundTier: "Vetiver Bund Grass + Main Crop",
    soilBenefit: "Slows hot dry Deccan winds by 45%, cutting crop evapotranspiration loss 22%.",
    incomeBoost: "+160% Carbon + Pole Crafts",
    carbonTonnesYr: 8.2,
    waterRetentionBoost: "+46% Aquifer Check",
    accentHex: "#84cc16",
  },
];

type EcosystemReplicationCase = {
  id: string;
  title: string;
  telanganaHub: string;
  nativeOrigin: string;
  cultivarTech: string;
  originTemp: string;
  telanganaProtocol: string;
  waterSavedNote: string;
  grossReturnAcre: string;
  badgeColor: string;
};

const ECOSYSTEM_REPLICATIONS: EcosystemReplicationCase[] = [
  {
    id: "adilabad_apple",
    title: "Low-Chill Apples Flourishing in Adilabad",
    telanganaHub: "Adilabad (Utnoor · Boath · Bazarhathnoor Plateaus)",
    nativeOrigin: "Himachal & Kashmir (1,500m elevation · 800+ chill hrs)",
    cultivarTech: "HRMN-99, Anna & Dorsett Golden (<250 chill-hr self-pollinating varieties)",
    originTemp: "Himachal: 2°C – 26°C natural mountain chill",
    telanganaProtocol: "460m elevation plateau winter nights (6–11°C) + thick 6-inch paddy-straw root cooling mulch + whitewash bark thermal shield + drip fertigation.",
    waterSavedNote: "62% less water than flooded paddy via buried drip rings",
    grossReturnAcre: "₹4.8L – ₹6.4L / acre (by Year 4)",
    badgeColor: "#f43f5e",
  },
  {
    id: "ananthagiri_coffee",
    title: "Ananthagiri Shade Coffee & Black Pepper",
    telanganaHub: "Vikarabad & Visakhapatnam-Border Agency Belts",
    nativeOrigin: "Chikmagalur & Coorg Western Ghats (1,000m hills)",
    cultivarTech: "Arabica Sln-9 & Panniyur-1 Black Pepper climbers",
    originTemp: "Western Ghats: 18°C – 28°C dappled forest canopy",
    telanganaProtocol: "Replicates 65% filtered shade using fast-growing Silver Oak + Bamboo overstory and micro-mist sprayers during April–May blossoms.",
    waterSavedNote: "54% lower evaporative loss under 3-tier tree shade",
    grossReturnAcre: "₹3.6L – ₹4.5L / acre combined",
    badgeColor: "#10b981",
  },
  {
    id: "aeroponic_saffron",
    title: "Controlled Indoor Saffron & Exotic Herbs",
    telanganaHub: "Hyderabad Peri-Urban, Siddipet & Warangal Agri-Hubs",
    nativeOrigin: "Pampore, Kashmir (Oct–Nov frost-dormant valleys)",
    cultivarTech: "Aeroponic vertical corm racks + LED spectrum & cooling pads",
    originTemp: "Pampore: 8°C – 17°C autumn bloom trigger",
    telanganaProtocol: "Solar fan-pad evaporative chambers + rainwater misting trigger Kashmir autumn humidity (75%) and 15°C bloom cycle in a single room.",
    waterSavedNote: "95% water recycled vs open field irrigation",
    grossReturnAcre: "₹12L+ per 400 sq.ft climate room",
    badgeColor: "#a855f7",
  },
  {
    id: "dryland_dragon",
    title: "Red Chalkas Dragon Fruit & Tissue Date Palm",
    telanganaHub: "Nalgonda, Mahbubnagar & Suryapet Dryland Belts",
    nativeOrigin: "Arid Mesoamerica & Gulf Oasis Belts",
    cultivarTech: "Siam Red Dragon Fruit (CAM crop) + Barhee Date Palm",
    originTemp: "Arid deserts: high radiation, <400mm annual rain",
    telanganaProtocol: "Uses nocturnal CO₂ stomata opening + porous red gravel drainage + concrete-ring trellis harvesting both rainy flushes and zero waterlogging.",
    waterSavedNote: "84% aquifer water saved vs borewell paddy",
    grossReturnAcre: "₹3.8L – ₹5.2L / acre",
    badgeColor: "#ec4899",
  },
];

type FoodProcessingTrack = {
  id: string;
  label: string;
  indiaEdge: string;
  telanganaOdop: string;
  rawInrPerUnit: number;
  stage2Multiplier: number;
  stage3Multiplier: number;
  finalRetailMultiplier: number;
  stage1Name: string;
  stage2Name: string;
  stage3Name: string;
  stage4Name: string;
  capexPerTpdLakhs: number;
  spoilageReductionPct: number;
  accentHex: string;
  productsList: string[];
};

const FOOD_PROCESSING_TRACKS: FoodProcessingTrack[] = [
  {
    id: "dairy",
    label: "Dairy & Livestock Value-Add",
    indiaEdge: "India Ranks #1 Globally in Livestock Population & Milk Output",
    telanganaOdop: "Siddipet · Karimnagar · Nalgonda Milk Routes",
    rawInrPerUnit: 100,
    stage2Multiplier: 1.75,
    stage3Multiplier: 2.65,
    finalRetailMultiplier: 3.45,
    stage1Name: "Bulk Solar Chill & Fat Test",
    stage2Name: "Pasteurize / Bilona Churn",
    stage3Name: "Paneer, A2 Ghee & Whey Pack",
    stage4Name: "Cold Chain Retail & Export",
    capexPerTpdLakhs: 14,
    spoilageReductionPct: 92,
    accentHex: "#06b6d4",
    productsList: ["A2 Bilona Ghee", "Vacuum Paneer", "Flavoured Lassi", "Milk Powder"],
  },
  {
    id: "fruits_veg",
    label: "Fruits & Veg Dehydration & Pulp",
    indiaEdge: "India Ranks #2 Globally in Fruits & Vegetables Production",
    telanganaOdop: "Nalgonda Sweet Orange · Khammam & Jagtial Mango · Tomato",
    rawInrPerUnit: 100,
    stage2Multiplier: 1.95,
    stage3Multiplier: 2.9,
    finalRetailMultiplier: 3.85,
    stage1Name: "Ozone Wash & AI Ripeness Sort",
    stage2Name: "Solar Osmotic Dehydration",
    stage3Name: "Aseptic Pulp & Veg Flakes",
    stage4Name: "QSR, Bakery & Export Shelf",
    capexPerTpdLakhs: 16,
    spoilageReductionPct: 88,
    accentHex: "#f97316",
    productsList: ["Aseptic Mango Pulp", "Sun-Dried Tomato Powder", "Banana Flour", "Citrus Zest Oil"],
  },
  {
    id: "spices",
    label: "Spices, Curcumin & Oleoresins",
    indiaEdge: "India Commands 48%+ Global Spice Trade & Export Leadership",
    telanganaOdop: "Nizamabad Turmeric · Khammam Chilli · Warangal Ginger",
    rawInrPerUnit: 100,
    stage2Multiplier: 1.85,
    stage3Multiplier: 2.8,
    finalRetailMultiplier: 3.9,
    stage1Name: "Stem-Cut & De-Stone Cleaning",
    stage2Name: "Steam Boiler Cure & Cold-Grind",
    stage3Name: "Curcumin Lab Seal + GI Pack",
    stage4Name: "Pharma & Global Spice Export",
    capexPerTpdLakhs: 18,
    spoilageReductionPct: 90,
    accentHex: "#ef4444",
    productsList: ["High-Curcumin Turmeric", "Aflatoxin-Free Chilli Flakes", "Ginger Oleoresin"],
  },
  {
    id: "millets_rte",
    label: "Shree Anna Millet Bakery & RTE",
    indiaEdge: "Global Shree Anna Hub · Fastest Growing Urban Clean-Label Shelf",
    telanganaOdop: "Mahbubnagar · Narayanpet · Vikarabad Millet Clusters",
    rawInrPerUnit: 100,
    stage2Multiplier: 2.1,
    stage3Multiplier: 3.15,
    finalRetailMultiplier: 4.15,
    stage1Name: "De-Hulling & Destoner Mill",
    stage2Name: "Extrusion / Solar Roasting",
    stage3Name: "Iron-Fortified SHG Baking",
    stage4Name: "School Mid-Day & ONDC Mart",
    capexPerTpdLakhs: 11,
    spoilageReductionPct: 95,
    accentHex: "#10b981",
    productsList: ["Foxtail Noodles", "Ragi Cookies", "Jowar Malt Mix", "Hostel Nutri-Bars"],
  },
  {
    id: "oils_pulses",
    label: "Cold-Pressed Oil & Dal Mini-Mill",
    indiaEdge: "Cuts Edible Oil Imports & Retains 100% Oilcake Fodder Locally",
    telanganaOdop: "Nagarkurnool Groundnut · Adilabad Sesame & Red Gram",
    rawInrPerUnit: 100,
    stage2Multiplier: 1.65,
    stage3Multiplier: 2.45,
    finalRetailMultiplier: 3.1,
    stage1Name: "Moisture Grade & Shelling",
    stage2Name: "Wood-Ghani Cold Pressing",
    stage3Name: "Glass Bottle + Protein Cake",
    stage4Name: "Direct D2C & Dairy Fodder Loop",
    capexPerTpdLakhs: 9.5,
    spoilageReductionPct: 94,
    accentHex: "#eab308",
    productsList: ["Wood-Pressed Groundnut Oil", "Cold Sesame Oil", "Unpolished Toor Dal"],
  },
];

const PROCESSING_BENCHMARK_CHART = [
  { country: "India Today", processedPct: 11, fill: "#f97316" },
  { country: "Target 2030", processedPct: 35, fill: "#10b981" },
  { country: "Brazil / China", processedPct: 48, fill: "#06b6d4" },
  { country: "Malaysia / EU", processedPct: 74, fill: "#8b5cf6" },
  { country: "USA Benchmark", processedPct: 80, fill: "#eab308" },
];

export default function LivelihoodAgroFoodSubPortal({
  village,
  groundwater,
  isExpanded = false,
  onToggleExpand,
}: {
  village: SectorInsightsVillage | null;
  groundwater?: DistrictGroundwaterRow[];
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}) {
  const [showIntro, setShowIntro] = useState(true);
  const [introProgress, setIntroProgress] = useState(0);
  const [category, setCategory] = useState<SubPortalCategory>("farmers");

  // Live Open-Meteo water/soil/weather state
  const [liveAgro, setLiveAgro] = useState<LiveWeatherAgro | null>(null);
  const [loadingAgro, setLoadingAgro] = useState(false);

  // Farmers interactive states
  const [acres, setAcres] = useState<number>(3);
  const [irrigationTech, setIrrigationTech] = useState<IrrigationTech>("drip_mulch");
  const [cropPriority, setCropPriority] = useState<CropPriority>("balanced");
  const [selectedAgroforestryId, setSelectedAgroforestryId] = useState<string>("agri_horti");
  const [selectedReplicationId, setSelectedReplicationId] = useState<string>("adilabad_apple");

  // Food Processing interactive states
  const [selectedTrackId, setSelectedTrackId] = useState<string>("fruits_veg");
  const [throughputTpd, setThroughputTpd] = useState<number>(2.0);

  const agroCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const factoryCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const lat = village?.lat ?? 17.85;
  const lon = village?.lon ?? 79.12;
  const districtName = village?.districtName ?? "Adilabad Plateau";
  const villageName = village?.villageName ?? "Telangana Village";

  const triggerIntro = useCallback(() => {
    setShowIntro(true);
    setIntroProgress(0);
  }, []);

  // Exact 3.0-second cinematic opening timeline
  useEffect(() => {
    if (!showIntro) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const totalMs = prefersReduced ? 1800 : 3000;
    const start = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(100, Math.round((elapsed / totalMs) * 100));
      setIntroProgress(pct);
      if (elapsed >= totalMs) {
        setShowIntro(false);
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [showIntro]);

  // Fetch live Open-Meteo weather + soil moisture + ET0 + elevation
  const fetchLiveAgro = useCallback(async () => {
    setLoadingAgro(true);
    try {
      const res = await fetch(
        `/api/telemetry/weather?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`
      );
      if (res.ok) {
        const data = (await res.json()) as LiveWeatherAgro;
        setLiveAgro(data);
      }
    } catch {
      // keep existing or fallback smoothly
    } finally {
      setLoadingAgro(false);
    }
  }, [lat, lon]);

  useEffect(() => {
    fetchLiveAgro();
  }, [fetchLiveAgro]);

  const soilProfile = useMemo(
    () => getDistrictSoilProfile(districtName),
    [districtName]
  );

  const matchedGroundwater = useMemo(() => {
    if (!groundwater || groundwater.length === 0) return null;
    const dLower = districtName.toLowerCase();
    return (
      groundwater.find((g) => dLower.includes(g.district_name.toLowerCase())) ??
      groundwater[0]
    );
  }, [groundwater, districtName]);

  // Live computed scenario indicators
  const currentTemp = liveAgro?.current?.tempC ?? village?.environment.currentTempC ?? 27.4;
  const humidityPct = liveAgro?.current?.humidityPct ?? 52;
  const solarWm2 = liveAgro?.current?.solarRadiationWm2 ?? 640;
  const forecastRainMm = liveAgro?.forecast7dRainMm ?? village?.environment.forecastRainMm ?? 12.4;
  const rootMoisture = liveAgro?.agroHydro?.soilMoistureRoot ?? 0.21;
  const topMoisture = liveAgro?.agroHydro?.soilMoistureTop ?? 0.14;
  const et0MmDay = liveAgro?.agroHydro?.et0MmDay ?? 4.6;
  const elevationM = liveAgro?.agroHydro?.elevationM ?? 465;

  const gwStagePct = matchedGroundwater?.stage_of_extraction_pct ?? 64;
  const gwStatus = matchedGroundwater?.status ?? (gwStagePct > 85 ? "Over-Exploited" : gwStagePct > 70 ? "Semi-Critical" : "Safe");

  // Dynamic Water Stress Assessment
  const waterAvailabilityScore = useMemo(() => {
    const moisturePart = Math.min(100, rootMoisture * 260);
    const rainPart = Math.min(100, forecastRainMm * 3.2);
    const gwSafety = Math.max(0, 115 - gwStagePct);
    const tankBonus = Math.min(25, (village?.water.tanksTotal ?? 3) * 3);
    return Math.round(
      moisturePart * 0.3 + rainPart * 0.2 + gwSafety * 0.35 + tankBonus * 0.6
    );
  }, [rootMoisture, forecastRainMm, gwStagePct, village?.water.tanksTotal]);

  const waterScenarioLabel =
    waterAvailabilityScore >= 65
      ? "Favourable Surface + Moisture Balance"
      : waterAvailabilityScore >= 44
      ? "Moderate Tension — Precision Drip Needed"
      : "High Aquifer Stress — Water-Saver Crops Essential";

  // Multi-factor ideal crop recommendation engine (Water + Soil + Climate + Tech)
  const rankedCrops = useMemo(() => {
    const techIncomeMult =
      irrigationTech === "solar_iot" ? 1.18 : irrigationTech === "drip_mulch" ? 1.08 : 0.78;
    const techWaterMult =
      irrigationTech === "solar_iot" ? 1.08 : irrigationTech === "drip_mulch" ? 1.0 : 0.48;
    const techPowerMult =
      irrigationTech === "solar_iot" ? 1.25 : irrigationTech === "drip_mulch" ? 1.0 : 0.42;

    return IDEAL_CROP_MODELS.map((crop) => {
      const soilMatch = crop.soilAffinity.some((s) =>
        soilProfile.soilOrder.toLowerCase().includes(s.toLowerCase())
      )
        ? 22
        : 10;

      // Penalize high-water crops if village has groundwater stress
      const waterFit =
        waterAvailabilityScore < 50
          ? (8 - crop.waterNeedIndex) * 7
          : (7 - Math.abs(crop.waterNeedIndex - 4)) * 5;

      // Bonus for Adilabad/Northern low-chill apple if elevation > 380m or northern district
      const ecoFit =
        crop.id === "adilabad-apple"
          ? districtName.toLowerCase().includes("adilabad") || elevationM >= 410
            ? 24
            : 8
          : 15;

      const calcIncomePerAcre = Math.round(crop.targetIncomePerAcre * techIncomeMult);
      const calcWaterSaved = Math.min(92, Math.round(crop.waterSavedPct * techWaterMult));
      const calcPowerSaved = Math.min(95, Math.round(crop.electricitySavedPct * techPowerMult));

      const priorityBonus =
        cropPriority === "income_max"
          ? calcIncomePerAcre / 8500
          : cropPriority === "water_shield"
          ? calcWaterSaved * 0.55
          : (calcIncomePerAcre / 12000) + calcWaterSaved * 0.25;

      const fitScore = Math.min(
        99,
        Math.round(40 + soilMatch * 0.8 + waterFit * 0.65 + ecoFit * 0.5 + priorityBonus * 0.45)
      );

      return {
        ...crop,
        fitScore,
        calcIncomePerAcre,
        calcWaterSaved,
        calcPowerSaved,
        incomeMultiple: Number((calcIncomePerAcre / crop.baseIncomePerAcre).toFixed(2)),
        totalProfitAcres: calcIncomePerAcre * acres,
        conventionalProfitAcres: crop.baseIncomePerAcre * acres,
        litersSavedYearLakhs: Number(((calcWaterSaved / 100) * 44 * acres).toFixed(1)),
        kwhSavedYear: Math.round((calcPowerSaved / 100) * 2400 * acres),
      };
    }).sort((a, b) => b.fitScore - a.fitScore);
  }, [
    irrigationTech,
    soilProfile.soilOrder,
    waterAvailabilityScore,
    districtName,
    elevationM,
    cropPriority,
    acres,
  ]);

  const topCrop = rankedCrops[0];
  const activeAgroforestry =
    AGROFORESTRY_METHODS.find((m) => m.id === selectedAgroforestryId) ??
    AGROFORESTRY_METHODS[0];
  const activeReplication =
    ECOSYSTEM_REPLICATIONS.find((e) => e.id === selectedReplicationId) ??
    ECOSYSTEM_REPLICATIONS[0];
  const activeTrack =
    FOOD_PROCESSING_TRACKS.find((t) => t.id === selectedTrackId) ??
    FOOD_PROCESSING_TRACKS[1];

  // PMFME & Unit Economics Calculator
  const plantEconomics = useMemo(() => {
    const capexLakhs = Number((activeTrack.capexPerTpdLakhs * throughputTpd).toFixed(1));
    const pmfmeSubsidyLakhs = Number(Math.min(10 * Math.ceil(throughputTpd / 2), capexLakhs * 0.35).toFixed(1));
    const shgMonthlyProfitLakhs = Number(
      ((activeTrack.finalRetailMultiplier - 1) * throughputTpd * 1.45).toFixed(2)
    );
    const localJobs = Math.round(8 + throughputTpd * 9);
    const spoilageSavedTonnesYr = Math.round(
      throughputTpd * 260 * (activeTrack.spoilageReductionPct / 100) * 0.24
    );
    return {
      capexLakhs,
      pmfmeSubsidyLakhs,
      shgMonthlyProfitLakhs,
      localJobs,
      spoilageSavedTonnesYr,
    };
  }, [activeTrack, throughputTpd]);

  // 1) 60fps Agroforestry & Soil-Water Ecosystem Canvas (Farmers Mode)
  useEffect(() => {
    if (category !== "farmers" || showIntro) return;
    const canvas = agroCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let rafId = 0;
    let phase = 0;

    const draw = () => {
      const parent = canvas.parentElement;
      const w = Math.max(320, parent ? parent.clientWidth : 640);
      const h = 235;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Sky gradient (warm sunrise gold -> crisp azure -> horizon mint)
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.64);
      sky.addColorStop(0, "#0b2439");
      sky.addColorStop(0.55, "#154e5d");
      sky.addColorStop(1, "#2a7c6f");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h * 0.64);

      // Glowing morning sun + rays
      const sunX = w * 0.86;
      const sunY = 44;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 72);
      sunGlow.addColorStop(0, "rgba(253, 224, 71, 0.95)");
      sunGlow.addColorStop(0.45, "rgba(251, 146, 60, 0.32)");
      sunGlow.addColorStop(1, "rgba(251, 146, 60, 0)");
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 72, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.arc(sunX, sunY, 15, 0, Math.PI * 2);
      ctx.fill();

      // Animated photosynthesis solar beams hitting canopies
      for (let i = 0; i < 4; i++) {
        const beamOffset = ((phase * 0.4 + i * 0.25) % 1);
        ctx.strokeStyle = `rgba(253, 224, 71, ${0.14 * (1 - beamOffset)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sunX - 10, sunY + 10);
        ctx.lineTo(w * (0.15 + i * 0.2), h * 0.42);
        ctx.stroke();
      }

      // Soil Strata Layers (Top Humus -> Root Clay/Loam -> Aquifer Bedrock)
      const groundY = h * 0.64;
      ctx.fillStyle = "#3f2718";
      ctx.fillRect(0, groundY, w, 24);
      ctx.fillStyle = soilProfile.clayPct > 40 ? "#241913" : "#7c371c";
      ctx.fillRect(0, groundY + 24, w, 34);
      ctx.fillStyle = "#0f273d";
      ctx.fillRect(0, groundY + 58, w, h - (groundY + 58));

      // Labels on soil cross-section
      ctx.fillStyle = "rgba(255,255,255,0.78)";
      ctx.font = "600 10px system-ui, sans-serif";
      ctx.fillText(`0–7cm Topsoil · ${Math.round(topMoisture * 100)}% moisture`, 12, groundY + 16);
      ctx.fillText(`Root Zone · ${soilProfile.soilOrder.split(" ")[0]} (${soilProfile.ph} pH)`, 12, groundY + 45);
      ctx.fillStyle = "#67e8f9";
      ctx.fillText(`Deep Aquifer Water Table · ${gwStatus}`, 12, h - 9);

      // Drip Pipe & Animated Water Droplets
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(20, groundY + 4);
      ctx.lineTo(w - 20, groundY + 4);
      ctx.stroke();

      const dripCount = irrigationTech === "flood" ? 12 : 7;
      for (let d = 0; d < dripCount; d++) {
        const dx = 45 + (d * (w - 90)) / (dripCount - 1);
        const dropProgress = (phase * 0.035 + d * 0.17) % 1;
        const dy = groundY + 6 + dropProgress * 46;
        ctx.fillStyle =
          irrigationTech === "flood"
            ? "rgba(251, 146, 60, 0.85)"
            : "rgba(56, 189, 248, 0.92)";
        ctx.beginPath();
        ctx.arc(dx, dy, irrigationTech === "flood" ? 4.2 : 2.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Agroforestry Tiers (Tall Timber Canopy, Fruit Orchard Mid-tier, Ground Crops)
      const sway = Math.sin(phase * 0.03) * 2.5;
      // Canopy trees (left & right boundary shield)
      [w * 0.12, w * 0.88].forEach((tx) => {
        ctx.fillStyle = "#5c3a21";
        ctx.fillRect(tx - 5, groundY - 82, 10, 82);
        ctx.fillStyle = activeAgroforestry.accentHex;
        ctx.beginPath();
        ctx.arc(tx + sway, groundY - 94, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.16)";
        ctx.beginPath();
        ctx.arc(tx + sway - 8, groundY - 104, 14, 0, Math.PI * 2);
        ctx.fill();
      });

      // Orchard mid-tier trees (apples/guava/mango fruits!)
      [w * 0.34, w * 0.64].forEach((ox) => {
        ctx.fillStyle = "#6e4628";
        ctx.fillRect(ox - 4, groundY - 54, 8, 54);
        ctx.fillStyle = "#16a34a";
        ctx.beginPath();
        ctx.arc(ox + sway * 0.6, groundY - 62, 24, 0, Math.PI * 2);
        ctx.fill();
        // Colorful fruit dots
        ctx.fillStyle = selectedAgroforestryId === "silvipasture" ? "#fde047" : "#f43f5e";
        [
          [-10, -68],
          [8, -60],
          [-2, -52],
          [11, -72],
        ].forEach(([fx, fy]) => {
          ctx.beginPath();
          ctx.arc(ox + fx + sway * 0.5, groundY + fy, 3.2, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      // Ground understory crop rows (turmeric / millets / vegetables)
      for (let gx = w * 0.22; gx <= w * 0.78; gx += 22) {
        if (Math.abs(gx - w * 0.34) < 16 || Math.abs(gx - w * 0.64) < 16) continue;
        ctx.fillStyle = "#84cc16";
        ctx.beginPath();
        ctx.moveTo(gx - 6, groundY);
        ctx.lineTo(gx + sway * 0.3, groundY - 22);
        ctx.lineTo(gx + 6, groundY);
        ctx.fill();
      }

      // Floating Nitrogen & CO2 capture particles
      for (let p = 0; p < 10; p++) {
        const px = ((phase * 0.9 + p * 73) % (w - 40)) + 20;
        const py = groundY - 25 - Math.abs(Math.sin(phase * 0.02 + p)) * 55;
        ctx.fillStyle = p % 2 === 0 ? "rgba(167, 243, 208, 0.72)" : "rgba(253, 224, 71, 0.72)";
        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // HUD Pill top-left inside dark canvas
      ctx.fillStyle = "rgba(6, 12, 20, 0.76)";
      ctx.fillRect(10, 10, 268, 28);
      ctx.fillStyle = "#a7f3d0";
      ctx.font = "600 11px system-ui, sans-serif";
      ctx.fillText(
        `${activeAgroforestry.name} · ${activeAgroforestry.carbonTonnesYr}t CO₂/ac`,
        18,
        28
      );

      if (!prefersReduced) {
        phase += 1;
        rafId = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [
    category,
    showIntro,
    activeAgroforestry,
    selectedAgroforestryId,
    soilProfile,
    topMoisture,
    gwStatus,
    irrigationTech,
  ]);

  // 2) 60fps Sunrise Food Processing Conveyor Canvas (Food Processing Mode)
  useEffect(() => {
    if (category !== "food_processing" || showIntro) return;
    const canvas = factoryCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let rafId = 0;
    let tick = 0;

    const draw = () => {
      const parent = canvas.parentElement;
      const w = Math.max(320, parent ? parent.clientWidth : 640);
      const h = 215;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Clean industrial teal-navy backdrop
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#081421");
      bg.addColorStop(1, "#0d202d");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Subtle architectural grid
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      for (let gx = 0; gx < w; gx += 32) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }

      // Conveyor belt horizontal track
      const beltY = h * 0.56;
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(26, beltY - 8, w - 52, 16);
      ctx.strokeStyle = activeTrack.accentHex;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(26, beltY - 8, w - 52, 16);

      // Moving conveyor roller dashes
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      const dashOffset = (tick * 1.4) % 24;
      for (let rx = 30 + dashOffset; rx < w - 34; rx += 24) {
        ctx.fillRect(rx, beltY - 2, 10, 4);
      }

      // 4 Stage Hubs along the track
      const stageXs = [w * 0.14, w * 0.38, w * 0.62, w * 0.86];
      const stageTitles = [
        activeTrack.stage1Name,
        activeTrack.stage2Name,
        activeTrack.stage3Name,
        activeTrack.stage4Name,
      ];
      const stagePrices = [
        `₹${activeTrack.rawInrPerUnit}`,
        `₹${Math.round(activeTrack.rawInrPerUnit * activeTrack.stage2Multiplier)}`,
        `₹${Math.round(activeTrack.rawInrPerUnit * activeTrack.stage3Multiplier)}`,
        `₹${Math.round(activeTrack.rawInrPerUnit * activeTrack.finalRetailMultiplier)}`,
      ];
      const stageColors = ["#94a3b8", "#38bdf8", "#f59e0b", "#10b981"];

      // Animated crates/items transforming along conveyor
      for (let i = 0; i < 6; i++) {
        const progress = ((tick * 0.0042 * Math.max(0.7, throughputTpd * 0.45) + i / 6) % 1);
        const cx = 36 + progress * (w - 72);
        const isPackaged = progress > 0.55;
        const isProcessed = progress > 0.28;

        ctx.fillStyle = isPackaged
          ? "#10b981"
          : isProcessed
          ? activeTrack.accentHex
          : "#fb923c";
        if (isPackaged) {
          ctx.fillRect(cx - 10, beltY - 24, 20, 16);
          ctx.fillStyle = "#ecfdf5";
          ctx.fillRect(cx - 6, beltY - 20, 12, 4);
        } else {
          ctx.beginPath();
          ctx.arc(cx, beltY - 16, isProcessed ? 8 : 6.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Render Stage Station Towers
      stageXs.forEach((sx, idx) => {
        ctx.fillStyle = "#0b1929";
        ctx.fillRect(sx - 56, 20, 112, 48);
        ctx.strokeStyle = stageColors[idx];
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sx - 56, 20, 112, 48);

        ctx.fillStyle = stageColors[idx];
        ctx.font = "700 13px ui-monospace, monospace";
        ctx.textAlign = "center";
        ctx.fillText(stagePrices[idx], sx, 40);

        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = "600 10px system-ui, sans-serif";
        const shortLabel =
          stageTitles[idx].length > 18
            ? stageTitles[idx].slice(0, 17) + "…"
            : stageTitles[idx];
        ctx.fillText(shortLabel, sx, 56);

        // Connector pillar down to conveyor
        ctx.strokeStyle = "rgba(255,255,255,0.18)";
        ctx.beginPath();
        ctx.moveTo(sx, 68);
        ctx.lineTo(sx, beltY - 10);
        ctx.stroke();

        ctx.fillStyle = "#94a3b8";
        ctx.font = "600 10px system-ui, sans-serif";
        ctx.fillText(`Stage 0${idx + 1}`, sx, beltY + 30);
      });

      ctx.textAlign = "left";
      ctx.fillStyle = "#6ee7b7";
      ctx.font = "700 12px system-ui, sans-serif";
      ctx.fillText(
        `Value Multiplication: ${activeTrack.finalRetailMultiplier}× retained inside ${villageName} FPO / SHG`,
        24,
        h - 14
      );

      if (!prefersReduced) {
        tick += 1;
        rafId = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [category, showIntro, activeTrack, throughputTpd, villageName]);

  return (
    <section
      aria-label="Krishi-Samriddhi Farmers and Food Processing Sub-Portal"
      className="relative border border-emerald-500/25 bg-white dark:bg-[#070d16] shadow-sm overflow-hidden"
    >
      {showIntro ? (
        /* 3-Second Cinematic Title Opening Stage (Right Beside Livelihood GIS) */
        <div
          className="jd-keep-dark relative min-h-[608px] flex flex-col items-center justify-center p-6 sm:p-10 text-center text-white overflow-hidden"
          style={{
            background:
              "radial-gradient(circle at 50% 35%, rgba(16,185,129,0.32) 0%, rgba(245,158,11,0.16) 38%, #040912 82%)",
          }}
        >
          {/* Animated Sunbeam Rings */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-35"
          >
            <div className="h-[380px] w-[380px] rounded-full border border-amber-300/35 animate-[spin_14s_linear_infinite]" />
            <div className="absolute h-[265px] w-[265px] rounded-full border border-emerald-400/45 animate-[spin_10s_linear_infinite_reverse]" />
          </div>

          <div className="relative z-10 max-w-xl space-y-4">
            <div className="text-xs font-semibold tracking-widest text-amber-300 uppercase">
              Livelihood Transformation Sub-Portal · {districtName}
            </div>

            <h2
              className="font-samarkan text-4xl sm:text-5xl md:text-6xl text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(110deg, #fde047 10%, #34d399 55%, #38bdf8 95%)",
              }}
            >
              Krishi · Samriddhi
            </h2>

            <p className="text-sm sm:text-base text-slate-200 max-w-lg mx-auto leading-relaxed">
              Doubling rural farm income through soil-water crop science &amp; agroforestry — and unlocking India&apos;s{" "}
              <strong className="text-amber-300">8.9% GVA</strong> Sunrise Food Processing economy.
            </p>

            {/* Quick Visual Lock-in Strip */}
            <div className="grid grid-cols-3 gap-2.5 max-w-lg mx-auto pt-2 text-left">
              <div className="border border-white/15 bg-white/5 px-3 py-2">
                <div className="text-[11px] text-emerald-300">Village Soil</div>
                <div className="text-xs font-semibold text-white truncate">
                  {soilProfile.soilOrder.split("·")[0]}
                </div>
              </div>
              <div className="border border-white/15 bg-white/5 px-3 py-2">
                <div className="text-[11px] text-cyan-300">Root Moisture</div>
                <div className="text-xs font-semibold font-mono tabular-nums text-white">
                  {Math.round(rootMoisture * 100)}% · {currentTemp}°C
                </div>
              </div>
              <div className="border border-white/15 bg-white/5 px-3 py-2">
                <div className="text-[11px] text-amber-300">India Food Rank</div>
                <div className="text-xs font-semibold text-white">
                  #1 Milk · #2 Produce
                </div>
              </div>
            </div>

            {/* 3.0s Progress Bar */}
            <div className="max-w-md mx-auto pt-2 space-y-2">
              <div className="h-1.5 w-full bg-white/15 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-cyan-400 transition-all duration-75"
                  style={{ width: `${introProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-white/70 font-mono tabular-nums">
                <span>Initializing Rural Wealth &amp; Sunrise Industry View…</span>
                <span>{((introProgress / 100) * 3).toFixed(1)}s / 3.0s</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIntro(false)}
              className="mt-2 inline-flex items-center gap-2 border border-amber-300/50 bg-amber-400/20 px-4 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-400/30 transition"
            >
              <span>Enter Sub-Portal Now</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="jd-transition-reveal">

      {/* Top Sub-Portal Header & Two Core Categories */}
      <div className="border-b border-slate-200 dark:border-white/10 bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-cyan-500/10 p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-white/65">
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                Krishi-Samriddhi Sub-Portal
              </span>
              <span aria-hidden="true">·</span>
              <span>{villageName}</span>
              <span aria-hidden="true">·</span>
              <span>{districtName} District</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5 text-balance">
              Farmers Income Engine &amp; India Sunrise Food Processing Hub
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={triggerIntro}
              className="inline-flex items-center gap-1.5 border border-slate-300 dark:border-white/15 bg-white dark:bg-[#09121e] px-3 py-2 text-xs font-medium text-slate-700 dark:text-white/80 hover:border-amber-400 transition whitespace-nowrap"
            >
              <Play size={13} className="text-amber-500" />
              <span>Replay 3s Intro</span>
            </button>
            <button
              type="button"
              onClick={fetchLiveAgro}
              disabled={loadingAgro}
              className="inline-flex items-center gap-1.5 border border-slate-300 dark:border-white/15 bg-white dark:bg-[#09121e] px-3 py-2 text-xs font-medium text-slate-700 dark:text-white/80 hover:border-emerald-400 transition whitespace-nowrap disabled:opacity-60"
            >
              <RefreshCw size={13} className={loadingAgro ? "animate-spin" : ""} />
              <span>Refresh Field</span>
            </button>
            {onToggleExpand && (
              <button
                type="button"
                onClick={onToggleExpand}
                className="inline-flex items-center gap-1.5 border border-slate-300 dark:border-white/15 bg-white dark:bg-[#09121e] px-3 py-2 text-xs font-medium text-slate-700 dark:text-white/80 hover:border-cyan-400 transition whitespace-nowrap"
                title={isExpanded ? "Return beside Livelihood GIS" : "Expand Sub-Portal wide"}
              >
                {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                <span>{isExpanded ? "Side-by-Side GIS" : "Expand Full"}</span>
              </button>
            )}
          </div>
        </div>

        {/* 2 Primary Category Switcher Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setCategory("farmers")}
            className={`flex items-center gap-3 p-3.5 text-left border transition ${
              category === "farmers"
                ? "border-emerald-500 bg-emerald-500/15 dark:bg-emerald-500/20 shadow-sm"
                : "border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0a1320] hover:border-emerald-400/60"
            }`}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-emerald-600 text-white">
              <Sprout size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                01 · Farmers &amp; Agriculture
              </div>
              <div className="text-xs text-slate-600 dark:text-white/70 truncate">
                Water · Soil · Climate · 2× Income Crops · Adilabad Ecosystem Replication
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCategory("food_processing")}
            className={`flex items-center gap-3 p-3.5 text-left border transition ${
              category === "food_processing"
                ? "border-amber-500 bg-amber-500/15 dark:bg-amber-500/20 shadow-sm"
                : "border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0a1320] hover:border-amber-400/60"
            }`}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-amber-600 text-white">
              <Factory size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                02 · Food Processing Sector
              </div>
              <div className="text-xs text-slate-600 dark:text-white/70 truncate">
                8.9% India GVA Sunrise · #1 Livestock · #2 Fruits &amp; Veg · Value Chain
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* =========================================================
         CATEGORY 1: FARMERS & REGENERATIVE AGRICULTURE
      ========================================================= */}
      {category === "farmers" && (
        <div className="p-4 sm:p-5 space-y-6">
          {/* Colorful Hero Showcase Visual */}
          <div className="relative h-48 sm:h-56 overflow-hidden border border-emerald-500/25 bg-emerald-950 jd-keep-dark">
            <img
              src={farmersHeroImg}
              alt="Multi-tier Telangana agroforestry, drip soil layers, solar pond and highland orchard"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-emerald-300">
                    {soilProfile.agroZone} · Elevation {elevationM} m
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-white">
                    Live Village Agronomy &amp; Double-Income Crop Blueprint for {villageName}
                  </h4>
                </div>
                <div className="bg-emerald-600/90 px-3 py-1.5 text-xs font-bold text-white font-mono tabular-nums">
                  Best Fit: {topCrop.incomeMultiple}× Income · -{topCrop.calcWaterSaved}% Water
                </div>
              </div>
            </div>
          </div>

          {/* 3-Pillar Live Diagnostic: Water Scenario + Soil Type + Climate & Weather */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pillar 1: Water Scenario */}
            <div className="border border-cyan-500/25 bg-cyan-50/70 dark:bg-[#071522] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-800 dark:text-cyan-300">
                  <Droplets size={15} />
                  Current Water Scenario
                </span>
                <span className="font-mono text-xs font-bold tabular-nums text-cyan-700 dark:text-cyan-200">
                  {gwStagePct}% Drawn
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {waterScenarioLabel}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/80 dark:bg-black/30 p-2 border border-cyan-500/15">
                  <div className="text-[11px] text-slate-500 dark:text-white/60">Root Moisture</div>
                  <div className="font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                    {Math.round(rootMoisture * 100)}% vol
                  </div>
                </div>
                <div className="bg-white/80 dark:bg-black/30 p-2 border border-cyan-500/15">
                  <div className="text-[11px] text-slate-500 dark:text-white/60">Evaporation ET₀</div>
                  <div className="font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                    {et0MmDay} mm/day
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-700 dark:text-white/75">
                Aquifer status: <strong>{gwStatus}</strong> · 7d Rain forecast:{" "}
                <strong className="font-mono tabular-nums">{forecastRainMm} mm</strong> ·{" "}
                {village?.water.tanksTotal ?? 4} local village tanks/ponds
              </div>
            </div>

            {/* Pillar 2: Soil Type & Composition */}
            <div className="border border-amber-500/25 bg-amber-50/70 dark:bg-[#141008] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <Layers size={15} />
                  Soil Classification
                </span>
                <span className="font-mono text-xs font-bold tabular-nums text-amber-700 dark:text-amber-200">
                  pH {soilProfile.ph}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {soilProfile.soilName}
              </div>
              {/* Multi-Color Clay / Silt / Sand Bar */}
              <div className="space-y-1">
                <div className="flex h-3 w-full overflow-hidden border border-black/10 dark:border-white/10">
                  <div
                    style={{ width: `${soilProfile.clayPct}%` }}
                    className="bg-amber-700"
                    title={`Clay ${soilProfile.clayPct}%`}
                  />
                  <div
                    style={{ width: `${soilProfile.siltPct}%` }}
                    className="bg-amber-500"
                    title={`Silt ${soilProfile.siltPct}%`}
                  />
                  <div
                    style={{ width: `${soilProfile.sandPct}%` }}
                    className="bg-yellow-300"
                    title={`Sand ${soilProfile.sandPct}%`}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono tabular-nums text-slate-600 dark:text-white/65">
                  <span>Clay {soilProfile.clayPct}%</span>
                  <span>Silt {soilProfile.siltPct}%</span>
                  <span>Sand {soilProfile.sandPct}%</span>
                </div>
              </div>
              <div className="text-xs text-slate-700 dark:text-white/75">
                {soilProfile.naturalStrengths}
              </div>
            </div>

            {/* Pillar 3: Climate & Weather */}
            <div className="border border-emerald-500/25 bg-emerald-50/70 dark:bg-[#071611] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <Sun size={15} />
                  Live Climate &amp; Weather
                </span>
                <span className="font-mono text-xs font-bold tabular-nums text-emerald-700 dark:text-emerald-200">
                  {solarWm2} W/m²
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {currentTemp}°C
                </span>
                <span className="text-xs text-slate-600 dark:text-white/70">
                  Humidity {humidityPct}% · Wind {liveAgro?.current?.windKmh ?? 8} km/h
                </span>
              </div>
              <div className="text-xs text-slate-700 dark:text-white/75 space-y-1">
                <div>
                  Solar Pump Window:{" "}
                  <strong className="text-emerald-700 dark:text-emerald-300">
                    {solarWm2 >= 450 ? "High PV Output (6.5+ hrs free pump)" : "Moderate PV"}
                  </strong>
                </div>
                <div>
                  Key Soil Fix: <span className="text-slate-600 dark:text-white/70">{soilProfile.keyAmendment}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Multi-Factor Crop Recommender & Resource-Saver Calculator */}
          <div className="border border-slate-200 dark:border-white/12 bg-slate-50/70 dark:bg-[#09111d] p-4 sm:p-5 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp size={17} className="text-emerald-500" />
                  <span>Ideal Crop Calculator (2× Farm Income + Water &amp; Power Saver)</span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-white/70 mt-0.5">
                  Scores local crops live using {districtName} soil, moisture ({Math.round(rootMoisture * 100)}%),
                  aquifer stress ({gwStagePct}%), and selected irrigation technology.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: "balanced", label: "Balanced 2× + Water" },
                    { id: "income_max", label: "Max Income/Acre" },
                    { id: "water_shield", label: "Aquifer Saver" },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setCropPriority(p.id)}
                    className={`px-3 py-1.5 text-xs font-semibold border transition whitespace-nowrap ${
                      cropPriority === p.id
                        ? "border-emerald-500 bg-emerald-600 text-white"
                        : "border-slate-300 dark:border-white/15 bg-white dark:bg-[#050911] text-slate-700 dark:text-white/75"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Farm Size & Technology Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center border-y border-slate-200 dark:border-white/10 py-4">
              <label className="block space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-white/80">
                  <span>Farm Holding Size</span>
                  <span className="font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-300">
                    {acres} Acres
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={15}
                  step={1}
                  value={acres}
                  onChange={(e) => setAcres(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </label>

              <div className="space-y-1.5">
                <div className="text-xs font-medium text-slate-700 dark:text-white/80">
                  Irrigation &amp; Energy Method
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: "flood", label: "Flood Bore" },
                      { id: "drip_mulch", label: "Drip + Mulch" },
                      { id: "solar_iot", label: "Solar + IoT" },
                    ] as const
                  ).map((tech) => (
                    <button
                      key={tech.id}
                      type="button"
                      onClick={() => setIrrigationTech(tech.id)}
                      className={`px-2 py-2 text-xs font-semibold border transition ${
                        irrigationTech === tech.id
                          ? "border-cyan-500 bg-cyan-600 text-white"
                          : "border-slate-300 dark:border-white/15 bg-white dark:bg-[#050911] text-slate-700 dark:text-white/75"
                      }`}
                    >
                      {tech.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Big Visual Doubling Impact Strip for Top Recommended Plan */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-3.5 text-white">
                <div className="text-[11px] text-emerald-100">Calculated Net Income</div>
                <div className="text-xl font-bold font-mono tabular-nums mt-0.5">
                  ₹{topCrop.totalProfitAcres.toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-emerald-100 mt-1">
                  vs ₹{topCrop.conventionalProfitAcres.toLocaleString("en-IN")} old crop ({topCrop.incomeMultiple}×)
                </div>
              </div>

              <div className="bg-gradient-to-br from-cyan-600 to-blue-700 p-3.5 text-white">
                <div className="text-[11px] text-cyan-100">Irrigation Water Conserved</div>
                <div className="text-xl font-bold font-mono tabular-nums mt-0.5">
                  -{topCrop.calcWaterSaved}%
                </div>
                <div className="text-[11px] text-cyan-100 mt-1 font-mono tabular-nums">
                  {topCrop.litersSavedYearLakhs}L Liters saved / yr
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3.5 text-white">
                <div className="text-[11px] text-amber-100">Grid Power Saved</div>
                <div className="text-xl font-bold font-mono tabular-nums mt-0.5">
                  -{topCrop.calcPowerSaved}%
                </div>
                <div className="text-[11px] text-amber-100 mt-1 font-mono tabular-nums">
                  {topCrop.kwhSavedYear.toLocaleString("en-IN")} kWh pump load off
                </div>
              </div>

              <div className="bg-gradient-to-br from-fuchsia-600 to-rose-600 p-3.5 text-white">
                <div className="text-[11px] text-rose-100">Top Village Crop Match</div>
                <div className="text-xl font-bold font-mono tabular-nums mt-0.5">
                  {topCrop.fitScore}% Fit
                </div>
                <div className="text-[11px] text-rose-100 mt-1 truncate">
                  {topCrop.methodTag}
                </div>
              </div>
            </div>

            {/* Top 3 Visual Ideal Crop Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {rankedCrops.slice(0, 3).map((crop, idx) => (
                <div
                  key={crop.id}
                  className="border border-slate-200 dark:border-white/10 bg-white dark:bg-[#050911] p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span
                      className="font-bold px-2 py-0.5 text-white"
                      style={{ backgroundColor: crop.colorHex }}
                    >
                      #{idx + 1} · {crop.fitScore}% Fit
                    </span>
                    <span className="font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-300">
                      {crop.incomeMultiple}× Income
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {crop.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-white/60">
                    {crop.seasonWindow} · {crop.category}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-white/75 leading-relaxed">
                    {crop.rationale}
                  </p>
                  <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex justify-between text-[11px] font-mono tabular-nums text-slate-600 dark:text-white/70">
                    <span>₹{crop.calcIncomePerAcre.toLocaleString("en-IN")}/ac</span>
                    <span>-{crop.calcWaterSaved}% H₂O</span>
                    <span>-{crop.calcPowerSaved}% kWh</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 60fps Agroforestry Multi-Tier Canvas + Method Selector */}
          <div className="border border-emerald-500/25 bg-white dark:bg-[#050911] p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Agroforestry Methods &amp; Multi-Tier Living Farm Simulator
                </h4>
                <p className="text-xs text-slate-600 dark:text-white/70">
                  Stack timber, orchard fruit, shade spices, and fodder grasses on the same acre to slash heat stress and multiply output.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {AGROFORESTRY_METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedAgroforestryId(m.id)}
                    className={`px-2.5 py-1.5 text-xs font-semibold border transition whitespace-nowrap ${
                      selectedAgroforestryId === m.id
                        ? "border-emerald-500 bg-emerald-600 text-white"
                        : "border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#09121e] text-slate-700 dark:text-white/80"
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-slate-200 dark:border-white/10 overflow-hidden bg-[#0b2439] jd-keep-dark">
              <canvas ref={agroCanvasRef} className="block w-full h-[235px]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 dark:bg-white/5 p-3 border border-slate-200 dark:border-white/10">
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                  Top Canopy Tier
                </div>
                <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {activeAgroforestry.canopyTop}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 p-3 border border-slate-200 dark:border-white/10">
                <div className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
                  Middle Fruit / Fodder Tier
                </div>
                <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {activeAgroforestry.midTier}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 p-3 border border-slate-200 dark:border-white/10">
                <div className="text-[11px] text-cyan-700 dark:text-cyan-300 font-semibold">
                  Ground Understory Tier
                </div>
                <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {activeAgroforestry.groundTier}
                </div>
              </div>
              <div className="bg-emerald-600/10 border border-emerald-500/30 p-3">
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                  Ecological Dividend
                </div>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {activeAgroforestry.incomeBoost}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-white/70">
                  {activeAgroforestry.waterRetentionBoost}
                </div>
              </div>
            </div>
          </div>

          {/* Ecosystem Replication Lab (Adilabad Apples + 3 More Breakthroughs) */}
          <div className="border border-rose-500/25 bg-gradient-to-br from-rose-50/70 via-white to-amber-50/50 dark:from-[#170b14] dark:via-[#080d16] dark:to-[#130f08] p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={17} className="text-rose-500" />
                  <span>Ecosystem Replication Lab (Growing Himalayan &amp; Exotic Crops in Telangana)</span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-white/70">
                  Engineered microclimates, low-chill cultivars, and mulching replicate high-value ecosystems right in rural mandals.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {ECOSYSTEM_REPLICATIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedReplicationId(item.id)}
                  className={`p-3 text-left border transition ${
                    selectedReplicationId === item.id
                      ? "border-rose-500 bg-rose-500/15 dark:bg-rose-500/20"
                      : "border-slate-200 dark:border-white/10 bg-white/80 dark:bg-black/25 hover:border-rose-400/50"
                  }`}
                >
                  <div
                    className="h-1.5 w-10 mb-2"
                    style={{ backgroundColor: item.badgeColor }}
                  />
                  <div className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-white/65 mt-1 font-mono tabular-nums">
                    {item.grossReturnAcre}
                  </div>
                </button>
              ))}
            </div>

            {/* Active Replication Blueprint Detail */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-200 dark:border-white/15 bg-white dark:bg-[#050911] p-4">
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-300">
                  Original Ecosystem
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {activeReplication.nativeOrigin}
                </div>
                <div className="text-xs text-slate-600 dark:text-white/70">
                  {activeReplication.originTemp}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-300">
                  Telangana Replication Protocol
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  {activeReplication.telanganaHub}
                </div>
                <p className="text-xs text-slate-700 dark:text-white/75 leading-relaxed">
                  {activeReplication.telanganaProtocol}
                </p>
              </div>

              <div className="space-y-2 bg-slate-50 dark:bg-white/5 p-3 border border-slate-200 dark:border-white/10">
                <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-300">
                  Cultivar &amp; Economic Proof
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  {activeReplication.cultivarTech}
                </div>
                <div className="text-xs text-cyan-700 dark:text-cyan-300 font-medium">
                  {activeReplication.waterSavedNote}
                </div>
                <div className="text-sm font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-300 pt-1">
                  Gross Potential: {activeReplication.grossReturnAcre}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
         CATEGORY 2: FOOD PROCESSING SECTOR (INDIA'S SUNRISE ECONOMY)
      ========================================================= */}
      {category === "food_processing" && (
        <div className="p-4 sm:p-5 space-y-6">
          {/* Colorful Sunrise Industrial Hero Visual */}
          <div className="relative h-52 sm:h-60 overflow-hidden border border-amber-500/30 bg-slate-950 jd-keep-dark">
            <img
              src={foodProcessingHeroImg}
              alt="Rural Indian solar food processing facility handling spices, fruits, millets and dairy cold-chain"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent flex flex-col justify-end p-4 sm:p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-amber-300">
                    India&apos;s Sunrise Economy Pillar · Telangana ODOP &amp; PMFME Hub
                  </div>
                  <h4 className="text-lg sm:text-xl font-bold text-white">
                    From Raw Village Spoilage to 3.8× Value-Added Shelf Power
                  </h4>
                </div>
                <div className="bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 font-mono tabular-nums">
                  8.9% Manufacturing GVA Share
                </div>
              </div>
            </div>
          </div>

          {/* Crystal-Clear Colourful Macro Scorecard (Understandable at a Glance) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 text-white">
              <div className="text-xs text-amber-100 font-medium">Sunrise Economic Engine</div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums mt-1">
                8.9%
              </div>
              <div className="text-xs text-amber-50 mt-1 font-medium">
                Share of India Manufacturing GVA &amp; top rural value creator
              </div>
            </div>

            <div className="bg-gradient-to-br from-cyan-600 to-teal-700 p-4 text-white">
              <div className="text-xs text-cyan-100 font-medium">Global Dairy &amp; Protein Base</div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums mt-1">
                #1 World
              </div>
              <div className="text-xs text-cyan-50 mt-1 font-medium">
                Largest livestock population (300M+ bovines) &amp; global milk leader
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-600 to-green-700 p-4 text-white">
              <div className="text-xs text-emerald-100 font-medium">Horticulture Raw Advantage</div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums mt-1">
                #2 World
              </div>
              <div className="text-xs text-emerald-50 mt-1 font-medium">
                2nd largest producer of Fruits &amp; Vegetables globally
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-4 text-white">
              <div className="text-xs text-indigo-100 font-medium">Factory Jobs &amp; Grant</div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums mt-1">
                12.4%
              </div>
              <div className="text-xs text-indigo-50 mt-1 font-medium">
                Registered factory jobs · 35% PMFME capital subsidy (up to ₹10L)
              </div>
            </div>
          </div>

          {/* Visual Why-It-Matters Split: Processing Gap Bar Chart + Telangana Commodity Strength */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            <div className="lg:col-span-6 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#08101c] p-4 space-y-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  The Huge Processing Opportunity Gap (% of Harvest Processed)
                </h4>
                <p className="text-xs text-slate-600 dark:text-white/70">
                  India currently processes ~11% of agri produce vs 48–80% in peer economies — leaving ₹92,000+ Cr/yr of post-harvest wastage ready to convert into village factory profits.
                </p>
              </div>
              <div className="h-[205px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={PROCESSING_BENCHMARK_CHART}
                    layout="vertical"
                    margin={{ left: 16, right: 20, top: 6, bottom: 6 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      unit="%"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="country"
                      width={96}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <Tooltip
                      formatter={(v) => [`${Number(Array.isArray(v) ? v[0] : (v ?? 0))}% processed`, "Processing Share"]}
                      contentStyle={{
                        backgroundColor: "#09111f",
                        border: "1px solid rgba(255,255,255,0.15)",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="processedPct" radius={[0, 4, 4, 0]} barSize={20}>
                      {PROCESSING_BENCHMARK_CHART.map((entry) => (
                        <Cell key={entry.country} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-6 border border-amber-500/25 bg-amber-50/60 dark:bg-[#120e07] p-4 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Why Rural Telangana &amp; FPO Processing Plants Win Fast
                </h4>
                <p className="text-xs text-slate-600 dark:text-white/70 mt-1">
                  Processing inside the mandal stops distress mandi dumps and turns perishable harvests into 12-month branded pantry products.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="bg-white dark:bg-black/30 p-3 border border-amber-500/20">
                  <div className="font-bold text-amber-700 dark:text-amber-300">PMFME 35% Grant</div>
                  <div className="text-slate-600 dark:text-white/75 mt-0.5">
                    35% credit-linked subsidy up to ₹10L for women SHGs &amp; rural youths.
                  </div>
                </div>
                <div className="bg-white dark:bg-black/30 p-3 border border-emerald-500/20">
                  <div className="font-bold text-emerald-700 dark:text-emerald-300">100% FDI &amp; PLI</div>
                  <div className="text-slate-600 dark:text-white/75 mt-0.5">
                    ₹10,900 Cr PLISFPI + Mega Food Parks connecting mandal clusters globally.
                  </div>
                </div>
                <div className="bg-white dark:bg-black/30 p-3 border border-cyan-500/20">
                  <div className="font-bold text-cyan-700 dark:text-cyan-300">#1 Spices &amp; Pulses</div>
                  <div className="text-slate-600 dark:text-white/75 mt-0.5">
                    World&apos;s top spice &amp; pulse grower — turmeric &amp; red chilli export margins.
                  </div>
                </div>
                <div className="bg-white dark:bg-black/30 p-3 border border-rose-500/20">
                  <div className="font-bold text-rose-700 dark:text-rose-300">Zero-Waste Circular</div>
                  <div className="text-slate-600 dark:text-white/75 mt-0.5">
                    Mango peels, whey &amp; oilcakes convert into bio-enzyme, feed &amp; compost.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 60fps Animated Factory Pipeline Canvas & Track Selector */}
          <div className="border border-slate-200 dark:border-white/12 bg-white dark:bg-[#050911] p-4 sm:p-5 space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Live Micro-Processing Line &amp; PMFME Plant Economics
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-white/70">
                    Select any Indian sunrise value-add industry to see raw produce multiply 3.1×–4.1× step by step.
                  </p>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-300">
                  {activeTrack.indiaEdge}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {FOOD_PROCESSING_TRACKS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTrackId(t.id)}
                    className={`px-3 py-1.5 text-xs font-semibold border transition whitespace-nowrap ${
                      selectedTrackId === t.id
                        ? "border-amber-500 bg-amber-600 text-white"
                        : "border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#09121e] text-slate-700 dark:text-white/80"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-slate-200 dark:border-white/10 overflow-hidden bg-[#081421] jd-keep-dark">
              <canvas ref={factoryCanvasRef} className="block w-full h-[215px]" />
            </div>

            {/* Interactive Capacity Slider + Financial & Job Outcomes */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center pt-1">
              <div className="lg:col-span-5 space-y-2 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#09121e] p-3.5">
                <div className="flex justify-between text-xs font-semibold text-slate-800 dark:text-white">
                  <span>Village Unit Daily Throughput</span>
                  <span className="font-mono tabular-nums text-amber-600 dark:text-amber-300">
                    {throughputTpd.toFixed(1)} Tonnes / Day
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={5.0}
                  step={0.5}
                  value={throughputTpd}
                  onChange={(e) => setThroughputTpd(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <div className="text-[11px] text-slate-600 dark:text-white/70">
                  Telangana ODOP Match: <strong>{activeTrack.telanganaOdop}</strong>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-white/70">
                  Products: {activeTrack.productsList.join(" · ")}
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#09121e] p-3">
                  <div className="text-[11px] text-slate-500 dark:text-white/60">Plant Capex</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                    ₹{plantEconomics.capexLakhs}L
                  </div>
                </div>
                <div className="border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                    35% PMFME Grant
                  </div>
                  <div className="text-lg font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-300 mt-0.5">
                    ₹{plantEconomics.pmfmeSubsidyLakhs}L
                  </div>
                </div>
                <div className="border border-amber-500/30 bg-amber-500/10 p-3">
                  <div className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
                    Monthly Net Profit
                  </div>
                  <div className="text-lg font-bold font-mono tabular-nums text-amber-700 dark:text-amber-300 mt-0.5">
                    ₹{plantEconomics.shgMonthlyProfitLakhs}L
                  </div>
                </div>
                <div className="border border-cyan-500/30 bg-cyan-500/10 p-3">
                  <div className="text-[11px] text-cyan-700 dark:text-cyan-300 font-semibold">
                    SHG &amp; Youth Jobs
                  </div>
                  <div className="text-lg font-bold font-mono tabular-nums text-cyan-700 dark:text-cyan-300 mt-0.5">
                    {plantEconomics.localJobs} Jobs
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-white/65 font-mono tabular-nums">
                    {plantEconomics.spoilageSavedTonnesYr}t rot saved/yr
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </section>
  );
}
