import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Brain,
  Check,
  Compass,
  Copy,
  Layers,
  Loader2,
  MessageSquarePlus,
  Send,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from "lucide-react";

export type AiPersona =
  | "District Collector"
  | "Sarpanch & Gram Sabha"
  | "Youth & SHG Citizen"
  | "Policy & Technical Jury";

export type AiHorizon =
  | "90-Day Rapid Strike"
  | "1-Year Convergence"
  | "Viksit Telangana 2047";

export type PromptCategory =
  | "all"
  | "triage"
  | "convergence"
  | "scientific"
  | "citizen";

export interface SectorPromptMission {
  id: string;
  category: Exclude<PromptCategory, "all">;
  categoryLabel: string;
  title: string;
  subtitle: string;
  query: string;
}

export interface TheaterVillageSnapshot {
  profile: {
    village_code: string;
    village_name: string;
    mandal_name: string;
    district_name: string;
  };
  population: {
    households: number;
    total: number;
  };
  education: {
    literacy_rate: number;
    female_literacy_rate: number;
    mobile_coverage_pct: number;
    nearest_school_km: number;
    nearest_school_name: string;
    education_score: number;
  };
  health: {
    latrine_within_pct: number;
    clean_cooking_fuel_pct: number;
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
    nearest_water_km: number;
    nearest_water_name: string;
    water_score: number;
  };
  livelihood: {
    worker_participation_rate: number;
    marginal_worker_percent: number;
    banking_access_pct: number;
    nearest_livelihood_km: number;
    nearest_livelihood_name: string;
    livelihood_score: number;
  };
  environment: {
    solid_biomass_fuel_pct: number;
    solar_lighting_pct: number;
    current_temp_c: number;
    avg_solar_radiation_mj_m2: number;
    pm2_5: number;
    us_aqi: number;
    environment_score: number;
  };
  jan_drishti: {
    education_score: number;
    health_score: number;
    water_score: number;
    livelihood_score: number;
    environment_score: number;
    overall_score: number;
  };
}

export interface FeaturedVillageRef {
  village_code: string;
  area_name: string;
  district_name?: string;
}

const PERSONAS: { id: AiPersona; roleHint: string }[] = [
  { id: "District Collector", roleHint: "Budget sanction & convergent execution" },
  { id: "Sarpanch & Gram Sabha", roleHint: "GPDP shelf of works & social audit" },
  { id: "Youth & SHG Citizen", roleHint: "Entitlements, SHG loans & 14416 help" },
  { id: "Policy & Technical Jury", roleHint: "Empirical citations & 2047 roadmap" },
];

const HORIZONS: AiHorizon[] = [
  "90-Day Rapid Strike",
  "1-Year Convergence",
  "Viksit Telangana 2047",
];

const CATEGORY_TABS: { id: PromptCategory; label: string }[] = [
  { id: "all", label: "All 8 Missions" },
  { id: "triage", label: "Crisis & Root Cause" },
  { id: "convergence", label: "Scheme & Budget" },
  { id: "scientific", label: "Sub-Portal & Tech" },
  { id: "citizen", label: "Gram Sabha & Citizen" },
];

export const SECTOR_PROMPT_ARSENAL: Record<string, SectorPromptMission[]> = {
  overview: [
    {
      id: "ov-1",
      category: "triage",
      categoryLabel: "Crisis & Root Cause",
      title: "Composite Vulnerability Bottleneck Audit",
      subtitle: "Diagnose which of the 5 sectors drags VVI down most vs Mandal benchmark",
      query:
        "Audit all 5 sectors (Education, Health, Water, Livelihood, Environment) for this village against Mandal, District, and Telangana benchmarks. Pinpoint the top 2 compound vulnerabilities driving the VVI risk band and state what local verification is needed.",
    },
    {
      id: "ov-2",
      category: "convergence",
      categoryLabel: "Scheme & Budget",
      title: "Collectorate 5-Sector Budget Priority Matrix",
      subtitle: "Weighted Gram Panchayat budget mix across State & Central missions",
      query:
        "Design a balanced Gram Panchayat Development Plan (GPDP) budget priority mix across all 5 sectors weighted by observed deficits, linking candidate Telangana & Central schemes with verification steps.",
    },
    {
      id: "ov-3",
      category: "scientific",
      categoryLabel: "Sub-Portal & Tech",
      title: "Water-Health-Environment Nexus Simulation",
      subtitle: "Link irrigation tanks, biomass indoor air, sanitation, and heat telemetry",
      query:
        "Analyze how surface tank density, treated tap water reach, household sanitation/drainage, and solid biomass PM2.5 interact structurally in this settlement, and prioritize high-multiplier co-interventions.",
    },
    {
      id: "ov-4",
      category: "citizen",
      categoryLabel: "Gram Sabha & Citizen",
      title: "Gram Sabha 100-Day Saturation Charter",
      subtitle: "Actionable agenda ready for Sarpanch and ward-level social audit",
      query:
        "Draft a clear Gram Sabha resolution agenda covering household tap pressure checks, IHHL soak-pit saturation, youth health outreach (Tele-MANAS 14416), and SHG bank linkage.",
    },
    {
      id: "ov-5",
      category: "triage",
      categoryLabel: "Crisis & Root Cause",
      title: "Spatial Facility Distance & Last-Mile Deficit",
      subtitle: "Evaluate OpenStreetMap km travel penalties for schools, clinics, and mandis",
      query:
        "Evaluate the spatial access distances to the nearest school, healthcare facility, water infrastructure, and market/bank hub. Identify where distance compounds demographic vulnerability.",
    },
    {
      id: "ov-6",
      category: "convergence",
      categoryLabel: "Scheme & Budget",
      title: "Viksit Telangana 2047 Transformation Trajectory",
      subtitle: "Staged 90-day, 1-year, and 5-year milestones to exceed 75+ score",
      query:
        "Build a staged 90-day, 1-year, and 2047 transformation roadmap lifting this settlement above state averages in literacy, treated water, clean cooking, and formal banking.",
    },
    {
      id: "ov-7",
      category: "scientific",
      categoryLabel: "Sub-Portal & Tech",
      title: "Climate-Resilient Agriculture & Clean Energy Loop",
      subtitle: "Align PM-KUSUM solar, minor irrigation tanks, and PMFME value addition",
      query:
        "Connect the village's solar insolation potential, irrigation tank inventory, and cultivator/labour workforce mix into an integrated climate-resilient agro-processing & solar feeder plan.",
    },
    {
      id: "ov-8",
      category: "citizen",
      categoryLabel: "Gram Sabha & Citizen",
      title: "Household Welfare & Entitlement Audit Brief",
      subtitle: "Citizen-facing checklist without claiming automatic scheme eligibility",
      query:
        "Prepare a clear citizen-focused verification checklist highlighting observed household amenity gaps and the exact Gram Panchayat / Mandal offices to validate candidate scheme rosters.",
    },
  ],
  education: [
    {
      id: "ed-1",
      category: "triage",
      categoryLabel: "Crisis & Root Cause",
      title: "Female Literacy & Gender Parity Rescue Plan",
      subtitle: "Close male-female literacy gaps and prevent upper-primary girl dropouts",
      query:
        "Analyze the effective literacy rate, female literacy rate, and gender literacy gap in this village. Diagnose social and school-distance barriers holding back adolescent girls and propose measurable retention actions.",
    },
    {
      id: "ed-2",
      category: "convergence",
      categoryLabel: "Scheme & Budget",
      title: "Mana Ooru – Mana Badi Infrastructure Convergence",
      subtitle: "Prioritize school WASH toilets, smart boards, and Samagra Shiksha grants",
      query:
        "Formulate a candidate convergence proposal linking Mana Ooru – Mana Badi and Samagra Shiksha priorities to this village's school reach distance and child (0–6) population share, citing UDISE+ audit checks.",
    },
    {
      id: "ed-3",
      category: "scientific",
      categoryLabel: "Sub-Portal & Tech",
      title: "Digital Learning & Internet Divide Bridge",
      subtitle: "Counter low household computer/internet reach via GP digital labs",
      query:
        "Address the gap between mobile ownership and household computer/internet penetration through shared Gram Panchayat smart-learning centers, offline Diksha content, and solar-backed school ICT labs.",
    },
    {
      id: "ed-4",
      category: "scientific",
      categoryLabel: "Sub-Portal & Tech",
      title: "STEM, T-SAT Vidya & TASK Youth Career Pipeline",
      subtitle: "Connect rural secondary students with TS ePASS scholarships, ITI & coding labs",
      query:
        "Design a high-aspiration rural STEM, T-SAT Vidya digital coaching, and Telangana Academy for Skill and Knowledge (TASK) mentorship pipeline leveraging nearest secondary schools and mobile/TV outreach.",
    },
    {
      id: "ed-5",
      category: "triage",
      categoryLabel: "Crisis & Root Cause",
      title: "Anganwadi (0–6 Cohort) Foundational Transition",
      subtitle: "Map early-childhood nutrition and pre-primary readiness cohort",
      query:
        "Examine the 0–6 child cohort percentage alongside female literacy and nearest school distance to strengthen Anganwadi-to-Grade 1 foundational literacy and numeracy (FLN) readiness.",
    },
    {
      id: "ed-6",
      category: "convergence",
      categoryLabel: "Scheme & Budget",
      title: "Mandal Education Officer (MEO) Field Audit Brief",
      subtitle: "Verify pupil-teacher ratios, girl toilets, and transport passes",
      query:
        "Draft an inspection-ready brief for the Mandal Education Officer covering observed Census education baselines, OSM school distance checks, and post-2011 UDISE+ verification gaps.",
    },
    {
      id: "ed-7",
      category: "citizen",
      categoryLabel: "Gram Sabha & Citizen",
      title: "Parents & SMC Evening Library Charter",
      subtitle: "Community-owned reading room and scholarship awareness timetable",
      query:
        "Outline a community-led School Management Committee (SMC) charter for evening bridge classes, girls' bicycle/bus pass verification, and digital literacy nights.",
    },
    {
      id: "ed-8",
      category: "citizen",
      categoryLabel: "Gram Sabha & Citizen",
      title: "First-Generation Career & ITI Skilling Link",
      subtitle: "Bridge secondary dropouts toward polytechnic, agritech & food-tech skilling",
      query:
        "Map pathways from rural secondary schooling to District ITI/polytechnic and PMFME/agritech micro-enterprise skills aligned with this village's workforce structure.",
    },
  ],
  health: [
    {
      id: "he-1",
      category: "scientific",
      categoryLabel: "Sub-Portal & Tech",
      title: "Student Suicide Prevention & Tele-MANAS 14416 Grid",
      subtitle: "Deploy 3-tier school counseling, peer gatekeepers & crisis helpline flow",
      query:
        "Formulate a village-and-mandal Youth Mental Health & Student Suicide Prevention action plan integrating the 24/7 Tele-MANAS (14416) helpline, trained school peer-gatekeepers, parent de-stigmatization circles, and Palle Dawakhana triage.",
    },
    {
      id: "he-2",
      category: "scientific",
      categoryLabel: "Sub-Portal & Tech",
      title: "Youth Cardiovascular & Hypertension Screening Plan",
      subtitle: "Early young-adult arterial risk camps at nearest health facility",
      query:
        "Design an early-detection protocol for rising youth cardiovascular stress and hypertension grounded in nearest primary clinic distance, mobile outreach rosters, and blood-pressure/stress lifestyle checks.",
    },
    {
      id: "he-3",
      category: "scientific",
      categoryLabel: "Sub-Portal & Tech",
      title: "Young Citizen Diabetes & Low-GI Millet Transition",
      subtitle: "Curb rural/peri-urban pre-diabetes via HbA1c checks & Telangana millet diets",
      query:
        "Propose a preventive Youth Diabetes & Metabolic Resilience campaign combining ASHA/ANM HbA1c screening, school physical activity, and Deccan low-GI millet nutrition through Anganwadi & PDS convergence.",
    },
    {
      id: "he-4",
      category: "triage",
      categoryLabel: "Crisis & Root Cause",
      title: "Indoor Biomass Smoke & Maternal Lung Exit",
      subtitle: "Quantify respiratory burden from solid fuel vs clean cooking share",
      query:
        "Diagnose household respiratory and maternal health risk from the village's solid biomass fuel percentage vs clean LPG/biogas adoption, and build a refill-affordability transition strategy under PM Ujjwala.",
    },
    {
      id: "he-5",
      category: "triage",
      categoryLabel: "Crisis & Root Cause",
      title: "Sanitation, Open Defecation & Closed-Drainage Audit",
      subtitle: "Target enteric & vector disease hotspots linked to untreated greywater",
      query:
        "Evaluate in-premises latrine access, open defecation gap, and closed wastewater drainage deficits, recommending SBM-G Phase II soak-pit and ODF-Plus remediation steps.",
    },
    {
      id: "he-6",
      category: "convergence",
      categoryLabel: "Scheme & Budget",
      title: "Palle Dawakhana & Aarogyasri Last-Mile Triage",
      subtitle: "Bridge healthcare travel distance with 104/108 & tele-consultations",
      query:
        "Address the village's distance to its nearest hospital/clinic by organizing weekly Palle Dawakhana / 104 mobile medical unit rosters, Aarogyasri card verification, and maternal anemia tracking.",
    },
    {
      id: "he-7",
      category: "convergence",
      categoryLabel: "Scheme & Budget",
      title: "Heat-Health & Monsoon Vector Preparedness Charter",
      subtitle: "Match district temperature/PM2.5 telemetry with ORS & larvicide drives",
      query:
        "Align live district ambient temperature, rainfall forecast, and PM2.5 particulate load with village heatwave ORS corners, school cooling breaks, and monsoon dengue/malaria source reduction.",
    },
    {
      id: "he-8",
      category: "citizen",
      categoryLabel: "Gram Sabha & Citizen",
      title: "ASHA-Youth Club Confidential Well-Being Compact",
      subtitle: "Non-judgmental village mental & preventive health support calendar",
      query:
        "Create a compassionate, stigma-free community well-being calendar led by ASHA workers, teachers, and youth volunteers promoting Tele-MANAS 14416, BP/sugar screening, and clean-kitchen support.",
    },
  ],
  water: [
    {
      id: "wa-1",
      category: "convergence",
      categoryLabel: "Scheme & Budget",
      title: "Mission Kakatiya Tank Desiltation & Bund Revival",
      subtitle: "Restore surface percolation storage across mapped TRACGIS village tanks",
      query:
        "Assess the village's TRACGIS minor irrigation tank count and density per 10 km². Formulate a Mission Kakatiya + MGNREGA desiltation, feeder-channel clearing, and bund-strengthening plan to boost groundwater recharge.",
    },
    {
      id: "wa-2",
      category: "triage",
      categoryLabel: "Crisis & Root Cause",
      title: "Zero Pipe Leakage & Functional 55 LPCD Audit",
      subtitle: "Eliminate treated tap loss and women's away-fetching water burden",
      query:
        "Contrast total tap reach, treated tap share, and away-fetching percentage against the normative 55 LPCD rural demand. Specify an RWS&S-Gram Panchayat pressure, valve-leakage, and chlorination audit.",
    },
    {
      id: "wa-3",
      category: "scientific",
      categoryLabel: "Sub-Portal & Tech",
      title: "10–15 Floor Apartment RWH + Greywater Closed Loop",
      subtitle: "Scale multi-storey dual-plumbing rainwater + greywater reuse architecture",
      query:
        "Translate our 10–15 floor Apartment Closed-Loop Rooftop Rainwater Harvesting and Greywater Treatment engineering model into a mandal/peri-urban building-bye-law & community recharge blueprint cutting fresh groundwater draw.",
    },
    {
      id: "wa-4",
      category: "scientific",
      categoryLabel: "Sub-Portal & Tech",
      title: "India & Telangana BCM Budget vs Borewell Extraction",
      subtitle: "Contextualize local hard-rock granite aquifer stress in state BCM terms",
      query:
        "Place this village's water vulnerability within Telangana's river-basin storage vs hard-rock granite borewell over-extraction reality, recommending strict pump-hour and per-capita conservation limits.",
    },
    {
      id: "wa-5",
      category: "triage",
      categoryLabel: "Crisis & Root Cause",
      title: "Source Proximity & Safe Storage Vulnerability Check",
      subtitle: "Close gap between near-premises standposts and inside-home taps",
      query:
        "Analyze why households still fetch water near or away from premises despite tap availability, proposing tail-end FHTC stabilization and household greywater soak-pits.",
    },
    {
      id: "wa-6",
      category: "convergence",
      categoryLabel: "Scheme & Budget",
      title: "Mission Bhagiratha + JJM Tail-End Convergence",
      subtitle: "Ensure treated surface supply reaches SC/ST and outer hamlets",
      query:
        "Prepare a candidate Mission Bhagiratha / Jal Jeevan Mission O&M convergence brief targeting outer habitations, school/Anganwadi tap connections, and Field Test Kit (FTK) water-quality surveillance.",
    },
    {
      id: "wa-7",
      category: "citizen",
      categoryLabel: "Gram Sabha & Citizen",
      title: "Village Water Committee Zero-Wastage Pact",
      subtitle: "Metering, float-valve prevention of overhead overflow, and pond cleanup",
      query:
        "Draft a practical Gram Sabha Water Stewardship Compact introducing float valves on overhead tanks, immediate leak reporting, plastic-free pond cleanups, and greywater kitchen gardens.",
    },
    {
      id: "wa-8",
      category: "citizen",
      categoryLabel: "Gram Sabha & Citizen",
      title: "Summer Tanker-Elimination Contingency Plan",
      subtitle: "Pre-April recharge triggers before borewell water tables plunge",
      query:
        "Outline a pre-summer drought-proofing checklist triggered by tank storage and 7-day rain telemetry so the village avoids emergency private water tankers.",
    },
  ],
  livelihood: [
    {
      id: "li-1",
      category: "scientific",
      categoryLabel: "Sub-Portal & Tech",
      title: "Doubling Farmers' Income: Soil-Water Crop Engine",
      subtitle: "Match soil/water availability to drip horticulture & pulses over paddy",
      query:
        "Recommend a climate-smart crop diversification shift matched to this village's soil, tank water, and cultivator/agri-labourer structure that doubles net farmer income while cutting electricity and borewell water use.",
    },
    {
      id: "li-2",
      category: "scientific",
      categoryLabel: "Sub-Portal & Tech",
      title: "Adilabad Apple & Deccan Microclimate Replication",
      subtitle: "Explore low-chill orchard & multi-tier agroforestry economics",
      query:
        "Evaluate agroforestry bund systems and microclimate crop replication models (inspired by Adilabad low-chill apple & high-value fruit clusters) suited to smallholders in this district.",
    },
    {
      id: "li-3",
      category: "scientific",
      categoryLabel: "Sub-Portal & Tech",
      title: "Food Processing Sunrise Sector (8.9% GVA) Cluster",
      subtitle: "Move villagers up the value chain from raw grain to 3.8× processed goods",
      query:
        "Design a rural value-addition blueprint leveraging India's Sunrise Food Processing sector (#1 livestock, #2 fruits & veg, 8.9% GVA) tailored to this village's nearest market hub distance and workforce mix.",
    },
    {
      id: "li-4",
      category: "convergence",
      categoryLabel: "Scheme & Budget",
      title: "PMFME 35% Subsidy & SERP Stree Nidhi SHG Micro-Units",
      subtitle: "Launch women-led millet flour, spice, dairy, or cold-press oil units",
      query:
        "Link SERP Stree Nidhi Women SHGs and One District One Product (ODOP) PMFME 35% credit-linked subsidy options to close the village's banking inclusion and marginal work gap.",
    },
    {
      id: "li-5",
      category: "triage",
      categoryLabel: "Crisis & Root Cause",
      title: "Seasonal Marginal Worker Income Stabilization",
      subtitle: "Guarantee post-kharif wage days & cut distress rural migration",
      query:
        "Diagnose why marginal under-6-month employment and agricultural labour dependence persist in this village, scheduling year-round MGNREGA watershed/tank works and Rythu Vedika skilling.",
    },
    {
      id: "li-6",
      category: "triage",
      categoryLabel: "Crisis & Root Cause",
      title: "Banking Inclusion & Informal Debt Exit Audit",
      subtitle: "Close credit exclusion via BC Sakhis, KCC saturation & Mudra camps",
      query:
        "Compare the village's banking penetration against Telangana State average and nearest bank/market distance, outlining a BC Sakhi doorstep KYC & Kisan Credit Card saturation drive.",
    },
    {
      id: "li-7",
      category: "convergence",
      categoryLabel: "Scheme & Budget",
      title: "FPO Cold-Storage & Rythu Vedika Aggregation Plan",
      subtitle: "Reduce 20–30% post-harvest distress sales through solar cold rooms",
      query:
        "Propose a mandal-level Farmer Producer Organisation (FPO) aggregation & solar cold-storage plan grounded in district solar radiation and 10 km market hub connectivity.",
    },
    {
      id: "li-8",
      category: "citizen",
      categoryLabel: "Gram Sabha & Citizen",
      title: "SHG & Smallholder Income Diversification Guide",
      subtitle: "Clear steps for backyard poultry, dairy chilling, and custom hiring",
      query:
        "Produce a citizen-friendly Gram Sabha briefing explaining how marginal farmers and SHG women can combine backyard dairy, FPO custom hiring centers, and food-processing micro-grants.",
    },
  ],
  environment: [
    {
      id: "en-1",
      category: "triage",
      categoryLabel: "Crisis & Root Cause",
      title: "PM2.5 & Biomass Smoke Dual-Exposure Audit",
      subtitle: "Contrast ambient Open-Meteo AQI with indoor wood-stove smoke exposure",
      query:
        "Assess both ambient Open-Meteo PM2.5 / US AQI telemetry and indoor solid-biomass cooking smoke pressure in this village, recommending immediate clean-cooking refill & smokeless transition steps.",
    },
    {
      id: "en-2",
      category: "scientific",
      categoryLabel: "Sub-Portal & Tech",
      title: "PM-KUSUM Solar Feeder & Deccan Insolation Plan",
      subtitle: "Convert peak MJ/m² solar radiation into daytime farm pump power",
      query:
        "Quantify how this district's daily solar radiation (MJ/m²/day) can power PM-KUSUM solar agri-pumps, Gram Panchayat rooftop arrays, and solar street lighting to replace kerosene/diesel.",
    },
    {
      id: "en-3",
      category: "triage",
      categoryLabel: "Crisis & Root Cause",
      title: "Telangana Heatwave Stress & Cooling Corridor Plan",
      subtitle: "Protect outdoor agri-labourers & children under rising max temperatures",
      query:
        "Build a Heat Action Protocol tuned to current and forecast max temperatures, integrating shaded tank-bund rest shelters, school hours shifts, and cool-roof paint on public buildings.",
    },
    {
      id: "en-4",
      category: "convergence",
      categoryLabel: "Scheme & Budget",
      title: "Telangana Ku Haritha Haram Canopy Survival Audit",
      subtitle: "Convert tank bunds, avenue belts & barren patches into carbon sinks",
      query:
        "Plan native drought-hardy Haritha Haram avenue and tank-bund plantation synchronized with 7-day rain telemetry and MGNREGA tree-guard watering wages.",
    },
    {
      id: "en-5",
      category: "scientific",
      categoryLabel: "Sub-Portal & Tech",
      title: "Crop-Residue Briquetting vs Open Stubble Burning",
      subtitle: "Eliminate seasonal air spikes while creating SHG biomass pellet income",
      query:
        "Propose a zero-stubble-burning rural bio-economy model converting paddy straw and agri-waste into compressed biomass pellets or organic compost instead of smoke-emitting field fires.",
    },
    {
      id: "en-6",
      category: "convergence",
      categoryLabel: "Scheme & Budget",
      title: "Compressed Biogas & GOBARdhan Village Circular Loop",
      subtitle: "Link livestock dung and greywater silt to rural clean cooking & slurry",
      query:
        "Design a SBM-G GOBARdhan household & cluster biogas model linking cattle waste to clean kitchen fuel and nutrient-rich organic slurry for farmers.",
    },
    {
      id: "en-7",
      category: "citizen",
      categoryLabel: "Gram Sabha & Citizen",
      title: "Zero-Plastic Tank Bund & Ecological Watch Charter",
      subtitle: "School Eco-Club and Gram Panchayat biodiversity protection rules",
      query:
        "Draft a Village Ecological Watch charter engaging school Eco-Clubs and youth in monthly pond plastic clearance, native seed-ball drives, and groundwater level logging.",
    },
    {
      id: "en-8",
      category: "citizen",
      categoryLabel: "Gram Sabha & Citizen",
      title: "Net-Zero Gram Panchayat @2047 Energy Transition",
      subtitle: "Step-by-step clean power, clean kitchen & green cover milestones",
      query:
        "Create a citizen-friendly 2047 Net-Zero Gram Panchayat roadmap detailing solar rooftops, electric agri-tools, biogas kitchens, and 33% village green canopy targets.",
    },
  ],
};

interface SimSliderConfig {
  key: string;
  label: string;
  unit: string;
  baseline: number;
  max: number;
  weight: number;
}

function getSectorSliders(
  sector: string,
  v: TheaterVillageSnapshot | null
): SimSliderConfig[] {
  const s = sector.toLowerCase();
  if (s === "education") {
    return [
      { key: "lit", label: "Effective Literacy Rate", unit: "%", baseline: v?.education.literacy_rate ?? 61, max: 98, weight: 0.35 },
      { key: "fem", label: "Female Literacy Parity", unit: "%", baseline: v?.education.female_literacy_rate ?? 52, max: 96, weight: 0.32 },
      { key: "dig", label: "Digital & Telecom Access", unit: "%", baseline: v?.education.mobile_coverage_pct ?? 58, max: 95, weight: 0.18 },
      { key: "sch", label: "Smart Lab & Retention Boost", unit: "%", baseline: 42, max: 95, weight: 0.15 },
    ];
  }
  if (s === "health") {
    return [
      { key: "san", label: "In-Premises Sanitation", unit: "%", baseline: v?.health.latrine_within_pct ?? 48, max: 100, weight: 0.30 },
      { key: "fuel", label: "Clean LPG / Smoke Exit", unit: "%", baseline: v?.health.clean_cooking_fuel_pct ?? 45, max: 98, weight: 0.25 },
      { key: "drn", label: "Closed Greywater Drainage", unit: "%", baseline: v?.health.closed_drainage_pct ?? 28, max: 95, weight: 0.20 },
      { key: "yth", label: "Youth Tele-MANAS & NCD Screen", unit: "%", baseline: 35, max: 95, weight: 0.25 },
    ];
  }
  if (s === "water") {
    return [
      { key: "tap", label: "Functional Treated Tap", unit: "%", baseline: v?.water.treated_tap_pct ?? 55, max: 100, weight: 0.32 },
      { key: "hom", label: "In-Premises Water Access", unit: "%", baseline: v?.water.water_within_premises_pct ?? 46, max: 98, weight: 0.26 },
      { key: "tnk", label: "Tank Desilt & Aquifer Recharge", unit: "%", baseline: Math.min(85, (v?.water.tanks_total ?? 2) * 14 + 25), max: 100, weight: 0.24 },
      { key: "rwh", label: "Greywater & RWH Loop Adoption", unit: "%", baseline: 22, max: 95, weight: 0.18 },
    ];
  }
  if (s === "livelihood") {
    return [
      { key: "bnk", label: "Formal Banking & KCC Reach", unit: "%", baseline: v?.livelihood.banking_access_pct ?? 59, max: 98, weight: 0.28 },
      { key: "div", label: "2× Crop / Horticulture Shift", unit: "%", baseline: 30, max: 90, weight: 0.28 },
      { key: "pmf", label: "PMFME SHG Food Processing", unit: "%", baseline: 18, max: 85, weight: 0.24 },
      { key: "wpr", label: "Off-Season Wage Security", unit: "%", baseline: v?.livelihood.worker_participation_rate ?? 49, max: 85, weight: 0.20 },
    ];
  }
  if (s === "environment") {
    return [
      { key: "bio", label: "Biomass-to-Clean Fuel Exit", unit: "%", baseline: Math.max(15, 100 - (v?.environment.solid_biomass_fuel_pct ?? 55)), max: 98, weight: 0.30 },
      { key: "sol", label: "PM-KUSUM & Solar Microgrid", unit: "%", baseline: Math.max(12, (v?.environment.solar_lighting_pct ?? 4) + 18), max: 95, weight: 0.28 },
      { key: "grn", label: "Haritha Haram Canopy Cover", unit: "%", baseline: 28, max: 85, weight: 0.22 },
      { key: "air", label: "Zero-Burn Clean Air Index", unit: "%", baseline: Math.max(25, Math.round(100 - (v?.environment.pm2_5 ?? 22))), max: 95, weight: 0.20 },
    ];
  }
  return [
    { key: "tap", label: "Treated Tap Water Saturation", unit: "%", baseline: v?.water.treated_tap_pct ?? 55, max: 100, weight: 0.25 },
    { key: "san", label: "ODF-Plus Sanitation & Drain", unit: "%", baseline: v?.health.latrine_within_pct ?? 48, max: 100, weight: 0.25 },
    { key: "bnk", label: "SHG Banking & 2× Farm Link", unit: "%", baseline: v?.livelihood.banking_access_pct ?? 59, max: 98, weight: 0.25 },
    { key: "sol", label: "Clean Energy & Literacy Push", unit: "%", baseline: v?.education.literacy_rate ?? 61, max: 98, weight: 0.25 },
  ];
}

function StreamedBriefRenderer({ text }: { text: string }) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return (
    <div className="space-y-3 text-sm leading-7 text-white/85">
      {lines.map((line, i) => {
        const cleaned = line
          .replace(/^#{1,6}\s*/, "")
          .replace(/\*\*/g, "")
          .trim();
        const isNumberedHeader = /^[1-4]\.\s+[A-Z]/.test(cleaned);
        const isBullet = /^[-*•]\s+/.test(cleaned);
        if (isNumberedHeader) {
          const [head, ...rest] = cleaned.split(":");
          return (
            <div key={i} className="pt-2 first:pt-0">
              <div className="text-xs font-semibold tracking-wide text-orange-300 uppercase">
                {head}
              </div>
              {rest.length > 0 && (
                <p className="mt-1 text-sm leading-7 text-white/85">
                  {rest.join(":").trim()}
                </p>
              )}
            </div>
          );
        }
        if (isBullet) {
          return (
            <div key={i} className="flex items-start gap-2.5 pl-1">
              <ArrowRight size={13} className="text-cyan-300 mt-1.5 shrink-0" />
              <p className="text-sm leading-6 text-white/80">
                {cleaned.replace(/^[-*•]\s+/, "")}
              </p>
            </div>
          );
        }
        return (
          <p key={i} className="text-sm leading-7 text-white/80">
            {cleaned}
          </p>
        );
      })}
    </div>
  );
}

export function SectorAiCommandTheater({
  sectorKey,
  aiTitle,
  accentColor,
  selectedVillage,
  featuredVillages,
  onSelectVillage,
  onRunFullDashboard,
  runningFull,
}: {
  sectorKey: string;
  aiTitle: string;
  accentColor: string;
  selectedVillage: TheaterVillageSnapshot | null;
  featuredVillages: FeaturedVillageRef[];
  onSelectVillage?: (code: string) => void;
  onRunFullDashboard: (query: string, opts?: { persona: AiPersona; horizon: AiHorizon }) => void;
  runningFull: boolean;
}) {
  const normalizedSector = sectorKey.toLowerCase();
  const missions =
    SECTOR_PROMPT_ARSENAL[normalizedSector] ?? SECTOR_PROMPT_ARSENAL.overview;

  const [category, setCategory] = useState<PromptCategory>("all");
  const [persona, setPersona] = useState<AiPersona>("District Collector");
  const [horizon, setHorizon] = useState<AiHorizon>("1-Year Convergence");
  const [activeMissionId, setActiveMissionId] = useState<string>(missions[0]?.id ?? "");
  const [localQuery, setLocalQuery] = useState<string>(missions[0]?.query ?? "");
  const [followUpInput, setFollowUpInput] = useState<string>("");

  // What-If Simulator State
  const sliderDefs = useMemo(
    () => getSectorSliders(normalizedSector, selectedVillage),
    [normalizedSector, selectedVillage]
  );
  const [simValues, setSimValues] = useState<Record<string, number>>({});

  useEffect(() => {
    const defaults: Record<string, number> = {};
    for (const sl of sliderDefs) {
      defaults[sl.key] = Math.min(sl.max, Math.round(sl.baseline + 18));
    }
    setSimValues(defaults);
  }, [sliderDefs]);

  useEffect(() => {
    setActiveMissionId(missions[0]?.id ?? "");
    setLocalQuery(missions[0]?.query ?? "");
    setCategory("all");
  }, [normalizedSector, missions]);

  // Live SSE Stream State
  const [streamText, setStreamText] = useState<string>("");
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [streamLatencyMs, setStreamLatencyMs] = useState<number | null>(null);
  const [streamModel, setStreamModel] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const abortRef = useRef<AbortController | null>(null);

  const visibleMissions = useMemo(
    () =>
      category === "all"
        ? missions
        : missions.filter((m) => m.category === category),
    [missions, category]
  );

  // Live Simulated Score Projection
  const currentSectorScore = useMemo(() => {
    if (!selectedVillage) return 54.0;
    const j = selectedVillage.jan_drishti;
    if (normalizedSector === "education") return j.education_score;
    if (normalizedSector === "health") return j.health_score;
    if (normalizedSector === "water") return j.water_score;
    if (normalizedSector === "livelihood") return j.livelihood_score;
    if (normalizedSector === "environment") return j.environment_score;
    return j.overall_score;
  }, [selectedVillage, normalizedSector]);

  const projectedLift = useMemo(() => {
    let delta = 0;
    for (const sl of sliderDefs) {
      const target = simValues[sl.key] ?? sl.baseline;
      const gain = Math.max(0, target - sl.baseline);
      delta += gain * sl.weight * 0.65;
    }
    const projectedSector = Math.min(96.5, Number((currentSectorScore + delta).toFixed(1)));
    const compositeDelta = normalizedSector === "overview" ? delta : delta * 0.2;
    const projectedComposite = Math.min(
      95.0,
      Number(((selectedVillage?.jan_drishti.overall_score ?? 54) + compositeDelta).toFixed(1))
    );
    return {
      sectorGain: Number((projectedSector - currentSectorScore).toFixed(1)),
      projectedSector,
      projectedComposite,
    };
  }, [sliderDefs, simValues, currentSectorScore, normalizedSector, selectedVillage]);

  async function launchLiveStream(customPrompt?: string, withSimContext = false) {
    const q = (customPrompt ?? localQuery).trim();
    if (!q) return;

    const vc = selectedVillage?.profile.village_code;
    if (!vc) {
      setStreamError("Select a Telangana village from the search bar or featured quick-picks above to stream intelligence.");
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setStreamActive(true);
    setStreamError(null);
    setStreamText("");
    setStreamLatencyMs(null);
    setStreamModel(null);

    const simulationContext = withSimContext
      ? `Target Levers for ${selectedVillage.profile.village_name}: ${sliderDefs
          .map((sl) => `${sl.label}: ${sl.baseline}${sl.unit} → ${simValues[sl.key] ?? sl.baseline}${sl.unit}`)
          .join(" | ")}. Projected Sector Index: ${currentSectorScore} → ${projectedLift.projectedSector}/100.`
      : undefined;

    try {
      const res = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          village_code: vc,
          query: q,
          sector: normalizedSector,
          persona,
          horizon,
          simulationContext,
        }),
      });

      if (!res.ok) {
        const errPayload = await res.json().catch(() => ({}));
        throw new Error(errPayload.error || `Stream failed (${res.status})`);
      }

      if (!res.body) {
        throw new Error("Streaming reader unavailable in this browser.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const rawEv of events) {
          const eventMatch = rawEv.match(/^event:\s*(.+)$/m);
          const dataMatch = rawEv.match(/^data:\s*(.+)$/m);
          if (!dataMatch) continue;
          const evName = eventMatch?.[1]?.trim() || "message";
          try {
            const parsed = JSON.parse(dataMatch[1]);
            if (evName === "chunk" && parsed.text) {
              setStreamText((prev) => prev + parsed.text);
              if (parsed.model) setStreamModel(parsed.model);
            } else if (evName === "done") {
              setStreamLatencyMs(parsed.latency_ms ?? null);
              if (parsed.model) setStreamModel(parsed.model);
            } else if (evName === "error") {
              setStreamError(parsed.error || "Stream interrupted.");
            }
          } catch {
            // ignore partial JSON frames
          }
        }
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setStreamError(err?.message || "Failed to stream Gemini intelligence.");
      }
    } finally {
      setStreamActive(false);
    }
  }

  function handleCombinedExecute(promptOverride?: string, includeSim = false) {
    const queryToRun = (promptOverride ?? localQuery).trim();
    if (!queryToRun) return;
    void launchLiveStream(queryToRun, includeSim);
    onRunFullDashboard(queryToRun, { persona, horizon });
  }

  async function copyStreamedBrief() {
    if (!streamText) return;
    await navigator.clipboard.writeText(streamText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="space-y-6">
      {/* HEADER BAR WITH QUICK SETTLEMENT SELECTOR & POSTURE CONTROLS */}
      <div className="border border-white/10 bg-[#070b11] p-6 md:p-7 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div
              className="text-xs font-medium tracking-wide"
              style={{ color: accentColor }}
            >
              JAN—DRISHTI SPATIAL AI COMMAND THEATER · TELANGANA
            </div>
            <h2 className="mt-1.5 text-2xl md:text-3xl font-semibold tracking-tight text-white">
              {aiTitle} — Live Multi-Horizon Intelligence
            </h2>
            <p className="mt-1.5 text-sm text-white/55 max-w-3xl">
              Sub-second Gemini streaming synthesis paired with full 5-sector visual analytics, scenario simulation, and citizen-to-collector decision postures.
            </p>
          </div>

          {selectedVillage ? (
            <div className="shrink-0 border border-white/12 bg-black/40 px-4 py-3 text-right">
              <div className="text-[11px] text-white/45">Active Village Settlement</div>
              <div className="mt-0.5 text-sm font-semibold text-white">
                {selectedVillage.profile.village_name}
              </div>
              <div className="mt-0.5 font-mono text-xs tabular-nums text-white/60">
                {selectedVillage.profile.mandal_name} · {selectedVillage.profile.district_name} · Score{" "}
                <span style={{ color: accentColor }}>{currentSectorScore}</span>/100
              </div>
            </div>
          ) : (
            <div className="shrink-0 border border-orange-300/25 bg-orange-300/[0.05] px-4 py-3">
              <div className="text-xs text-orange-200 font-medium">
                Pick a Telangana settlement to unlock AI
              </div>
              {featuredVillages.length > 0 && onSelectVillage && (
                <div className="mt-2 flex flex-wrap gap-1.5 max-w-md">
                  {featuredVillages.slice(0, 5).map((fv) => (
                    <button
                      key={fv.village_code}
                      type="button"
                      onClick={() => onSelectVillage(fv.village_code)}
                      className="border border-orange-300/30 bg-orange-300/10 px-2.5 py-1 text-xs text-orange-100 hover:bg-orange-300/20 transition"
                    >
                      {fv.area_name}{fv.district_name ? ` (${fv.district_name})` : ""}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* DECISION POSTURE + HORIZON CONTROLS */}
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-white/50">
              <Compass size={13} style={{ color: accentColor }} />
              <span>Decision-Maker Persona Lens</span>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {PERSONAS.map((p) => {
                const active = persona === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPersona(p.id)}
                    className={`text-left px-3.5 py-2.5 border transition ${
                      active
                        ? "border-orange-300/50 bg-orange-300/10 text-white"
                        : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/25 hover:text-white"
                    }`}
                  >
                    <div className="text-xs font-medium">{p.id}</div>
                    <div className="mt-0.5 text-[11px] text-white/45 truncate">
                      {p.roleHint}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-white/50">
              <Layers size={13} style={{ color: accentColor }} />
              <span>Execution Planning Horizon</span>
            </div>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {HORIZONS.map((h) => {
                const active = horizon === h;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHorizon(h)}
                    className={`px-3 py-3 border text-center text-xs font-medium transition ${
                      active
                        ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100"
                        : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/25 hover:text-white"
                    }`}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 text-xs text-white/45">
              Active Focus:{" "}
              <span className="text-white/80 font-medium">{persona}</span>
              {" · "}
              <span className="text-cyan-200/80">{horizon}</span>
            </div>
          </div>
        </div>

        {/* 8-MISSION SECTOR PROMPT ARSENAL */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-white/60">
              <Sparkles size={13} style={{ color: accentColor }} />
              <span>Sector Intelligence Missions (8 Specialised Playbooks)</span>
            </div>
            <div className="flex flex-wrap gap-1 p-1 bg-black/40 border border-white/10">
              {CATEGORY_TABS.map((tab) => {
                const active = category === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCategory(tab.id)}
                    className={`px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "bg-white/15 text-white"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            {visibleMissions.map((m) => {
              const isSelected = activeMissionId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setActiveMissionId(m.id);
                    setLocalQuery(m.query);
                  }}
                  className={`group text-left p-4 border transition flex flex-col justify-between ${
                    isSelected
                      ? "border-orange-300/55 bg-orange-300/[0.08]"
                      : "border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]"
                  }`}
                >
                  <div>
                    <div className="text-[11px] font-medium text-white/45">
                      {m.categoryLabel}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white leading-snug">
                      {m.title}
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-white/55">
                      {m.subtitle}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-orange-200/80">
                    <span>{isSelected ? "Loaded in command box" : "Select mission"}</span>
                    <ArrowRight
                      size={12}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* PROMPT EDITOR + DUAL EXECUTION CTA */}
        <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr] pt-2">
          <div className="space-y-3">
            <label className="block text-xs font-medium text-white/50">
              Custom Planning Directive / Field Question
            </label>
            <textarea
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder={`Ask any specific ${sectorKey} question about ${
                selectedVillage?.profile.village_name ?? "this village"
              }...`}
              className="w-full h-28 resize-none bg-black/40 border border-white/15 p-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-orange-300/50"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleCombinedExecute(localQuery, false)}
                disabled={streamActive || runningFull || !localQuery.trim()}
                className="flex-1 min-w-[240px] py-3.5 px-5 border border-orange-300/45 bg-orange-300/15 hover:bg-orange-300/25 disabled:opacity-40 transition flex items-center justify-center gap-2.5 text-xs font-semibold text-orange-50"
              >
                {streamActive || runningFull ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>
                      {streamActive
                        ? "Streaming Live Brief & Building Charts…"
                        : "Finalizing Multi-Chart Dashboard…"}
                    </span>
                  </>
                ) : (
                  <>
                    <Zap size={15} />
                    <span>Launch Instant Stream + Full Intelligence Suite</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => void launchLiveStream(localQuery, false)}
                disabled={streamActive || !localQuery.trim()}
                className="py-3.5 px-4 border border-cyan-300/35 bg-cyan-300/10 hover:bg-cyan-300/20 disabled:opacity-40 transition flex items-center justify-center gap-2 text-xs font-medium text-cyan-100"
              >
                <Brain size={14} />
                <span>Fast Stream Only (~0.6s)</span>
              </button>
            </div>
          </div>

          {/* LIVE WHAT-IF SCORE TRAJECTORY SIMULATOR */}
          <div className="border border-white/12 bg-black/35 p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-medium text-cyan-200">
                <SlidersHorizontal size={14} />
                <span>What-If Impact Simulator</span>
              </div>
              <div className="font-mono text-xs tabular-nums text-emerald-300">
                +{projectedLift.sectorGain} pts → {projectedLift.projectedSector}/100
              </div>
            </div>

            <div className="space-y-3">
              {sliderDefs.map((sl) => {
                const val = simValues[sl.key] ?? sl.baseline;
                return (
                  <div key={sl.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/70">{sl.label}</span>
                      <span className="font-mono tabular-nums text-white/90">
                        {sl.baseline}
                        {sl.unit} →{" "}
                        <span className="text-cyan-300 font-semibold">
                          {val}
                          {sl.unit}
                        </span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min={sl.baseline}
                      max={sl.max}
                      value={val}
                      onChange={(e) =>
                        setSimValues((prev) => ({
                          ...prev,
                          [sl.key]: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10"
                    />
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
              <div className="text-[11px] text-white/55 font-mono tabular-nums">
                Composite Forecast: {projectedLift.projectedComposite}/100
              </div>
              <button
                type="button"
                onClick={() =>
                  handleCombinedExecute(
                    `Stress-test our simulated ${sectorKey} intervention targets (${sliderDefs
                      .map((sl) => `${sl.label} from ${sl.baseline}${sl.unit} to ${simValues[sl.key] ?? sl.baseline}${sl.unit}`)
                      .join(", ")}) for ${selectedVillage?.profile.village_name ?? "this village"}. Quantify institutional capacity, capital phasing, and maintenance risks.`,
                    true
                  )
                }
                disabled={streamActive}
                className="px-3 py-2 border border-cyan-300/35 bg-cyan-300/10 hover:bg-cyan-300/20 text-xs font-medium text-cyan-100 transition disabled:opacity-40"
              >
                Simulate with AI
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* STREAMING LIVE STRATEGIC DOSSIER PANEL */}
      {(streamText || streamActive || streamError) && (
        <div className="border border-cyan-300/30 bg-[#060d14] p-6 md:p-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="text-xs font-medium text-cyan-300">
                LIVE GEMINI STRATEGIC BRIEF · {persona.toUpperCase()} · {horizon.toUpperCase()}
              </div>
              <h3 className="mt-1 text-xl font-semibold text-white">
                {selectedVillage
                  ? `${selectedVillage.profile.village_name} (${selectedVillage.profile.mandal_name}) — Executive Intelligence`
                  : "Executive Intelligence Stream"}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              {streamModel && (
                <span className="font-mono text-xs text-white/45">
                  {streamModel}
                  {streamLatencyMs ? ` · ${(streamLatencyMs / 1000).toFixed(2)}s` : ""}
                </span>
              )}
              {streamText && (
                <button
                  type="button"
                  onClick={() => void copyStreamedBrief()}
                  className="px-3 py-1.5 border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-xs text-white/80 flex items-center gap-1.5 transition"
                >
                  {copied ? <Check size={13} className="text-emerald-300" /> : <Copy size={13} />}
                  <span>{copied ? "Copied" : "Copy Brief"}</span>
                </button>
              )}
            </div>
          </div>

          {streamError ? (
            <div className="border border-red-400/30 bg-red-400/[0.06] p-4 text-sm text-red-100">
              {streamError}
            </div>
          ) : streamText ? (
            <StreamedBriefRenderer text={streamText} />
          ) : (
            <div className="flex items-center gap-3 py-6 text-sm text-white/60">
              <Loader2 size={16} className="animate-spin text-cyan-300" />
              <span>Synthesizing live village telemetry and sectoral evidence…</span>
            </div>
          )}

          {/* FOLLOW-UP INTERROGATION BAR */}
          {streamText && !streamActive && (
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
                <MessageSquarePlus size={13} className="text-orange-300" />
                <span>Interrogate this Brief Further:</span>
                {[
                  "Estimate MGNREGA person-days & local budget sizing",
                  "Write 4 bullet points for Gram Sabha resolution",
                  "List the top 3 field checks for MPDO inspection",
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => void launchLiveStream(chip, false)}
                    className="border border-white/12 bg-white/[0.03] hover:border-orange-300/40 hover:text-orange-100 px-2.5 py-1 text-xs text-white/70 transition"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={followUpInput}
                  onChange={(e) => setFollowUpInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && followUpInput.trim()) {
                      const nextQ = followUpInput.trim();
                      setFollowUpInput("");
                      void launchLiveStream(nextQ, false);
                    }
                  }}
                  placeholder={`Ask a follow-up question about ${
                    selectedVillage?.profile.village_name ?? "this village"
                  }...`}
                  className="flex-1 bg-black/40 border border-white/15 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan-300/50"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!followUpInput.trim()) return;
                    const nextQ = followUpInput.trim();
                    setFollowUpInput("");
                    void launchLiveStream(nextQ, false);
                  }}
                  disabled={!followUpInput.trim()}
                  className="px-4 py-2.5 border border-cyan-300/40 bg-cyan-300/15 hover:bg-cyan-300/25 disabled:opacity-35 text-xs font-medium text-cyan-100 flex items-center gap-2 transition"
                >
                  <Send size={13} />
                  <span>Ask</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
