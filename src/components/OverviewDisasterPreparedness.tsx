"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
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
  Building2,
  CloudLightning,
  Droplets,
  Factory,
  Flame,
  MapPin,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Waves,
  Wheat,
} from "lucide-react";

export type TelanganaDisasterId =
  | "river_flood"
  | "urban_flash_flood"
  | "heatwave"
  | "drought"
  | "thunderstorm_hail"
  | "forest_fire"
  | "seismic"
  | "industrial_hazmat";

type DisasterPhase = "before" | "during" | "after";

interface HotspotLocation {
  district: string;
  corridor: string;
  severity: "Critical" | "High" | "Elevated";
  triggerThreshold: string;
  sheltersAndStaging: string;
  exposureIndex: number;
  readinessScore: number;
}

interface StrategyStep {
  code: string;
  title: string;
  action: string;
  leadBody: string;
  targetWindow: string;
}

interface MonthlyRiskPoint {
  month: string;
  intensity: number;
}

interface TelanganaDisasterProfile {
  id: TelanganaDisasterId;
  shortName: string;
  title: string;
  subtitle: string;
  peakSeason: string;
  primaryAgency: string;
  helplines: string;
  accentColor: string;
  affectedDistrictCount: number;
  populationAtRisk: string;
  visualTitle: string;
  visualSummary: string;
  mitigationUnitLabel: string;
  baselineImpactNote: string;
  protectedImpactNote: string;
  hotspots: HotspotLocation[];
  monthlyProfile: MonthlyRiskPoint[];
  strategies: Record<DisasterPhase, StrategyStep[]>;
}

const TELANGANA_DISASTERS: TelanganaDisasterProfile[] = [
  {
    id: "river_flood",
    shortName: "Riverine Floods",
    title: "Godavari & Krishna Basin Riverine Floods",
    subtitle:
      "Transboundary monsoon inflows across Bhadrachalam, Eturnagaram, Kaleshwaram, and Srisailam-Jurala backwater mandals.",
    peakSeason: "July – October",
    primaryAgency: "TSDMA · I&CAD · NDRF 10th Bn · District Collectorates",
    helplines: "1070 EOC · 1077 District · 112 ERSS · 108 Medical",
    accentColor: "#0ea5e9",
    affectedDistrictCount: 11,
    populationAtRisk: "14.2 Lakh basin residents",
    visualTitle: "Godavari Bhadrachalam Crest & Levee Evacuation Simulation",
    visualSummary:
      "Tracks river stage against Bhadrachalam's 43 ft (1st Warning), 48 ft (2nd Warning), and 53 ft (Danger) marks with boat rescue lanes and high-ground relief camps.",
    mitigationUnitLabel: "Embankment & Early-Evacuation Readiness",
    baselineImpactNote: "Unwarned low-lying bank inundation above 48 ft crest",
    protectedImpactNote: "6-hour Sachet CAP alert + pre-staged NDRF boats clear 96% households before peak",
    hotspots: [
      {
        district: "Bhadradri Kothagudem",
        corridor: "Bhadrachalam · Dummugudem · Cherla · Burgampahad",
        severity: "Critical",
        triggerThreshold: "43 ft Watch · 48 ft Warning · 53 ft Danger",
        sheltersAndStaging: "Bhadrachalam ITI, Sarapaka High School, Paloncha Staging Depot",
        exposureIndex: 94,
        readinessScore: 84,
      },
      {
        district: "Mulugu",
        corridor: "Eturnagaram · Mangapet · Wazeedu · Venkatapuram",
        severity: "Critical",
        triggerThreshold: "Perur gauge > 45.5 m & Indravati-Taliperu confluence surge",
        sheltersAndStaging: "Eturnagaram Tribal Welfare Hostel & Mangapet Polytechnic Hub",
        exposureIndex: 91,
        readinessScore: 79,
      },
      {
        district: "Jayashankar Bhupalpally",
        corridor: "Mahadevpur · Kaleshwaram · Kataram (Pranahita backwater)",
        severity: "High",
        triggerThreshold: "Medigadda barrage discharge > 12 Lakh cusecs",
        sheltersAndStaging: "Mahadevpur Junior College & Kaleshwaram Pilgrim Complex",
        exposureIndex: 82,
        readinessScore: 77,
      },
      {
        district: "Khammam",
        corridor: "Munneru sub-basin · Madhira · Wyra · Khammam Urban banks",
        severity: "High",
        triggerThreshold: "Munneru bridge gauge > 24 ft & Wyra surplus spill",
        sheltersAndStaging: "Khammam SR&BGNR College & Wyra Rythu Vedika",
        exposureIndex: 85,
        readinessScore: 81,
      },
      {
        district: "Jogulamba Gadwal",
        corridor: "Alampur · Rajoli · Priyadarshini Jurala downstream",
        severity: "Elevated",
        triggerThreshold: "Jurala + Tungabhadra combined outflow > 5.5 Lakh cusecs",
        sheltersAndStaging: "Gadwal Indoor Stadium & Alampur Mandal Parishad Campus",
        exposureIndex: 72,
        readinessScore: 76,
      },
    ],
    monthlyProfile: [
      { month: "Jan", intensity: 8 },
      { month: "Feb", intensity: 6 },
      { month: "Mar", intensity: 5 },
      { month: "Apr", intensity: 6 },
      { month: "May", intensity: 10 },
      { month: "Jun", intensity: 34 },
      { month: "Jul", intensity: 84 },
      { month: "Aug", intensity: 96 },
      { month: "Sep", intensity: 88 },
      { month: "Oct", intensity: 46 },
      { month: "Nov", intensity: 16 },
      { month: "Dec", intensity: 9 },
    ],
    strategies: {
      before: [
        {
          code: "01",
          title: "Barrage & Catchment Inflow Telemetry Sync",
          action: "Link CWC, SRSP, Medigadda, Taliperu, and Jurala hourly inflow logs to mandal Tahsildar dashboards before June 15.",
          leadBody: "I&CAD Flood Cell & CWC",
          targetWindow: "Pre-Monsoon (May–Jun)",
        },
        {
          code: "02",
          title: "Flood-Plain Encroachment Removal & Bund Armouring",
          action: "Inspect and sandbag weak earthen karakatta sections along Bhadrachalam and Munneru; clear bridge vent driftwood.",
          leadBody: "Irrigation Engineers & Panchayats",
          targetWindow: "30 Days Prior",
        },
        {
          code: "03",
          title: "Pre-Position Boats, OBM Fuel & Dry Ration Kits",
          action: "Stage motorized FRP boats, life jackets, ropes, and 15-day rice/pulse buffers in maroon-prone Gram Panchayats.",
          leadBody: "SDRF / NDRF & Civil Supplies",
          targetWindow: "Before Warning Level 1",
        },
      ],
      during: [
        {
          code: "01",
          title: "Mandatory Evacuation at 2nd Warning Level (48 ft)",
          action: "Shift elderly, pregnant mothers, and livestock from Zone-A habitations before road causeways submerge.",
          leadBody: "District Collector & Police",
          targetWindow: "T-12 to T-6 Hours",
        },
        {
          code: "02",
          title: "Geo-Tagged Sachet CAP SMS & Drumbeat Alerts",
          action: "Broadcast Telugu location-specific evacuation corridors and safe camp GPS pins to all active cell towers.",
          leadBody: "TSDMA & Telecom Nodal Desk",
          targetWindow: "Real-Time Crest Watch",
        },
        {
          code: "03",
          title: "Camp Sanitation, Chlorine & Antivenom Protocol",
          action: "Deploy mobile 108 units with snakebite antivenom, ORS, and drinking-water chlorination at all relief camps.",
          leadBody: "DM&HO & Mission Bhagiratha",
          targetWindow: "Active Submergence",
        },
      ],
      after: [
        {
          code: "01",
          title: "Super-Chlorination & Silt Clearance of Borewells",
          action: "Flush submerged handpumps, shock-chlorinate sumps, and restore Mission Bhagiratha trunk lines before return.",
          leadBody: "RWS&S & Gram Panchayat",
          targetWindow: "0–72 Hours Post-Recession",
        },
        {
          code: "02",
          title: "Vector & Waterborne Disease Doorstep Surveillance",
          action: "Screen households for leptospirosis, viral fever, and dengue breeding pools with ASHA and ANM rapid test kits.",
          leadBody: "Public Health & ANM Teams",
          targetWindow: "Days 3–21",
        },
        {
          code: "03",
          title: "Satellite Crop Loss Enumeration & Ex-Gratia",
          action: "Conduct joint Agriculture-Revenue drone verification for sand-cast paddy/cotton parcels to release input subsidy.",
          leadBody: "Revenue & Agriculture Dept",
          targetWindow: "Days 7–30",
        },
      ],
    },
  },
  {
    id: "urban_flash_flood",
    shortName: "Urban Flash Floods",
    title: "Urban Cloudbursts, Nala Surges & Pluvial Waterlogging",
    subtitle:
      "High-intensity rainfall (>65 mm/hr) overwhelming stormwater nalas, lake surplus weirs, and underpasses in Hyderabad and tier-2 cities.",
    peakSeason: "June – October",
    primaryAgency: "HYDRAA · GHMC DRF · HMWS&SB · Municipal Commissioners",
    helplines: "040-21111111 GHMC · 9000113667 DRF · 1070 · 112",
    accentColor: "#06b6d4",
    affectedDistrictCount: 7,
    populationAtRisk: "28.5 Lakh dense-urban corridor residents",
    visualTitle: "Hussain Sagar – Musi Nala Surge & Sluice Bypass Dynamics",
    visualSummary:
      "Visualizes road waterlogging and storm culvert flow under intense urban downpour versus desilted HYDRAA stormwater bypass channels.",
    mitigationUnitLabel: "Nala Desiltation & Lake Surplus Capacity",
    baselineImpactNote: "Silt-choked culverts spill over roads within 45 min of 80 mm/hr cloudburst",
    protectedImpactNote: "Pre-storm lake drawdown + clear box drains cut peak waterlogging depth by 64%",
    hotspots: [
      {
        district: "Hyderabad",
        corridor: "LB Nagar · Saroornagar · Tolichowki · Musi riverfront · Khairatabad",
        severity: "Critical",
        triggerThreshold: "> 50 mm/hr cloudburst or Osman Sagar / Himayat Sagar gate lift",
        sheltersAndStaging: "GHMC Community Halls, Amberpet & Malakpet Indoor Complexes",
        exposureIndex: 92,
        readinessScore: 80,
      },
      {
        district: "Medchal-Malkajgiri",
        corridor: "Nizampet · Alwal · Kapra · Uppal Chilkanagar nalas",
        severity: "Critical",
        triggerThreshold: "Chain-of-lakes weir overflow + > 45 mm/hr",
        sheltersAndStaging: "Uppal Stadium Annex & Malkajgiri Municipal Relief Hubs",
        exposureIndex: 88,
        readinessScore: 74,
      },
      {
        district: "Rangareddy",
        corridor: "Hayathnagar · Meerpet · Shamshabad · Manikonda tank chains",
        severity: "High",
        triggerThreshold: "Pallecheruvu / Gurram Cheruvu FTL breach warning",
        sheltersAndStaging: "Saroornagar Polytechnic & Shamshabad ZPHS High Ground",
        exposureIndex: 83,
        readinessScore: 73,
      },
      {
        district: "Warangal",
        corridor: "Hanumakonda · Bhadrakali bund · Bondivagu · Waddepally",
        severity: "High",
        triggerThreshold: "Nayeem Nagar nala capacity > 90% & > 90 mm/24h",
        sheltersAndStaging: "Hanumakonda Ambedkar Bhavan & KU Indoor Stadium",
        exposureIndex: 79,
        readinessScore: 75,
      },
    ],
    monthlyProfile: [
      { month: "Jan", intensity: 4 },
      { month: "Feb", intensity: 5 },
      { month: "Mar", intensity: 7 },
      { month: "Apr", intensity: 12 },
      { month: "May", intensity: 22 },
      { month: "Jun", intensity: 48 },
      { month: "Jul", intensity: 82 },
      { month: "Aug", intensity: 88 },
      { month: "Sep", intensity: 94 },
      { month: "Oct", intensity: 64 },
      { month: "Nov", intensity: 14 },
      { month: "Dec", intensity: 5 },
    ],
    strategies: {
      before: [
        {
          code: "01",
          title: "Fencing FTL Buffers & Desilting Catch-Pits",
          action: "Clear 100% of bottleneck culverts and restore buffer channels across HMDA chain-of-lakes under HYDRAA audits.",
          leadBody: "HYDRAA & GHMC Engineering",
          targetWindow: "April – May",
        },
        {
          code: "02",
          title: "Automated Ultrasonic Nala Water-Level Sensors",
          action: "Install ultrasonic telemetry at critical underpasses and lake weirs to trigger automatic traffic diversion barriers.",
          leadBody: "TSDMA & Traffic Police",
          targetWindow: "Pre-Monsoon Setup",
        },
        {
          code: "03",
          title: "Pre-Storm Controlled Reservoir Lowering",
          action: "Draw down Osman Sagar and Himayat Sagar by 1–2 ft when IMD red alerts project >100 mm basin rain.",
          leadBody: "HMWS&SB",
          targetWindow: "T-24 Hours",
        },
      ],
      during: [
        {
          code: "01",
          title: "Underpass Closure & Live Traffic Rerouting",
          action: "Deploy barricades at flooded RUBs (Khairatabad, Panjagutta, Begumpet) and publish live alternate GPS detours.",
          leadBody: "City Traffic Police & ICCC",
          targetWindow: "Immediate Onset",
        },
        {
          code: "02",
          title: "DRF High-Capacity Dewatering Pumps & Manhole Guards",
          action: "Station 150 HP dewatering pumps at chronic stagnation pockets and flag open storm drains with reflective cones.",
          leadBody: "GHMC DRF & TGSPDCL",
          targetWindow: "Active Downpour",
        },
        {
          code: "03",
          title: "Feeder Isolation to Prevent Electrocution",
          action: "Cut low-voltage pillar boxes in submerged colony basements until water drops below plinth level.",
          leadBody: "TGSPDCL / TGNPDCL",
          targetWindow: "Real-Time Safety",
        },
      ],
      after: [
        {
          code: "01",
          title: "Structural Audit of Weak Tank Bunds & Retaining Walls",
          action: "Inspect tank bund piping, old compound walls, and Musi bridges before lifting cordons.",
          leadBody: "Irrigation & Municipal Wing",
          targetWindow: "0–48 Hours",
        },
        {
          code: "02",
          title: "Fogging, Bleaching & Sump Water Quality Checks",
          action: "Conduct Orthotolidine chlorine testing in flooded colonies and supply tanker potable water where sumps contaminated.",
          leadBody: "HMWS&SB & Urban Health",
          targetWindow: "Days 1–10",
        },
        {
          code: "03",
          title: "Permeable Pavers & Rainwater Recharge Pits",
          action: "Convert chronic runoff hotspots into roadside bioswales and deep recharge shafts to cut future peak storm volume.",
          leadBody: "Municipal Town Planning",
          targetWindow: "30–90 Days",
        },
      ],
    },
  },
  {
    id: "heatwave",
    shortName: "Severe Heatwaves",
    title: "Extreme Summer Heatwaves, Urban Heat Islands & Loo",
    subtitle:
      "Max temperatures reaching 44.5°C–47.5°C across Godavari coal-thermal belt and interior Deccan agricultural districts.",
    peakSeason: "March – June",
    primaryAgency: "TSDMA · IMD Hyderabad · Health & Labour Depts",
    helplines: "108 Heatstroke Ambulance · 104 Health Advice · 1070",
    accentColor: "#f97316",
    affectedDistrictCount: 24,
    populationAtRisk: "62 Lakh outdoor labourers, elderly & farmers",
    visualTitle: "Thermal Load vs Chali-Kendram Cooling Shelter Mitigation",
    visualSummary:
      "Simulates afternoon ambient solar heat dome (46°C+) and tracks wet-bulb relief delivered by cool roofs, shaded MGNREGS shift timings, and ORS kiosks.",
    mitigationUnitLabel: "Cool Roofs, Shade & Work-Shift Adaptation",
    baselineImpactNote: "12:00–16:00 outdoor exposure exceeds wet-bulb heatstroke danger threshold",
    protectedImpactNote: "Cool-roof paint (-4.2°C indoor) + split work shifts drop heatstroke incidence by 78%",
    hotspots: [
      {
        district: "Peddapalli",
        corridor: "Ramagundam · Godavarikhani · Manthani thermal & coal belt",
        severity: "Critical",
        triggerThreshold: "IMD Max ≥ 45.0°C or +5°C departure for 2 consecutive days",
        sheltersAndStaging: "Singareni Area Hospital Heat Wards & NTPC Transit Shelters",
        exposureIndex: 96,
        readinessScore: 82,
      },
      {
        district: "Adilabad",
        corridor: "Adilabad Rural · Jainoor · Utnoor · Bela",
        severity: "Critical",
        triggerThreshold: "Tmax ≥ 45.5°C & relative humidity < 18% hot loo winds",
        sheltersAndStaging: "RIMS Adilabad Heat Ward & Gram Panchayat Chali-Kendrams",
        exposureIndex: 94,
        readinessScore: 76,
      },
      {
        district: "Mancherial",
        corridor: "Bellampalli · Mandamarri · Luxettipet · Chennur",
        severity: "Critical",
        triggerThreshold: "Tmax ≥ 45.0°C (heat-index > 50°C along Godavari valley)",
        sheltersAndStaging: "Area Hospital Bellampalli & Bus Stand Cooling Mist Tents",
        exposureIndex: 93,
        readinessScore: 78,
      },
      {
        district: "Nalgonda",
        corridor: "Miryalaguda · Devarakonda · Nakrekal lime/stone belt",
        severity: "High",
        triggerThreshold: "Tmax ≥ 44.5°C & warm night minimum ≥ 30°C",
        sheltersAndStaging: "GGH Nalgonda Heat Stabilization Rooms & PHCs",
        exposureIndex: 89,
        readinessScore: 75,
      },
      {
        district: "Khammam",
        corridor: "Kothagudem border · Sathupalli · Madhira",
        severity: "High",
        triggerThreshold: "High humidity coastal-inland mix pushing Heat Index > 52°C",
        sheltersAndStaging: "Khammam District Hospital Cold-Immersion Beds",
        exposureIndex: 87,
        readinessScore: 79,
      },
    ],
    monthlyProfile: [
      { month: "Jan", intensity: 14 },
      { month: "Feb", intensity: 28 },
      { month: "Mar", intensity: 64 },
      { month: "Apr", intensity: 88 },
      { month: "May", intensity: 98 },
      { month: "Jun", intensity: 72 },
      { month: "Jul", intensity: 24 },
      { month: "Aug", intensity: 18 },
      { month: "Sep", intensity: 26 },
      { month: "Oct", intensity: 32 },
      { month: "Nov", intensity: 18 },
      { month: "Dec", intensity: 12 },
    ],
    strategies: {
      before: [
        {
          code: "01",
          title: "Cool-Roof Coating Drive on Anganwadis & Slum Clusters",
          action: "Apply high-albedo white reflective lime/polymer coatings on tin/asbestos roofs under Telangana Cool Roof Policy.",
          leadBody: "MA&UD & Panchayat Raj",
          targetWindow: "February – March",
        },
        {
          code: "02",
          title: "Chali-Kendrams & Stockpile 10 Lakh+ ORS Packets",
          action: "Set up shaded terracotta water kiosks at mandal markets, auto stands, and bus bays; equip every ASHA with ORS.",
          leadBody: "Health Dept & Municipal Bodies",
          targetWindow: "By March 15",
        },
        {
          code: "03",
          title: "Reschedule MGNREGS, School & Construction Hours",
          action: "Shift outdoor MGNREGS and masonry tasks to 06:00–10:30 AM and enforce half-day morning school schedules.",
          leadBody: "Labour & School Education Dept",
          targetWindow: "Before 40°C Onset",
        },
      ],
      during: [
        {
          code: "01",
          title: "Noon Curfew Advisory (12:00–16:00) on Red-Alert Days",
          action: "Issue automated alerts halting traffic police/sanitation outdoor shifts and opening AC public libraries as cooling shelters.",
          leadBody: "TSDMA & District Collectors",
          targetWindow: "Tmax ≥ 45°C",
        },
        {
          code: "02",
          title: "Rapid Ice-Pack & Cold-Water Immersion at PHCs",
          action: "Treat heatstroke victims within the 30-minute golden window using cold-sheet wraps and IV fluids before referral.",
          leadBody: "108 EMT & PHC Doctors",
          targetWindow: "Immediate Stabilization",
        },
        {
          code: "03",
          title: "Livestock Shade & Afternoon Drinking Troughs",
          action: "Ensure cattle water troughs at village tank beds remain filled and suspend midday cart/draught animal transit.",
          leadBody: "Animal Husbandry Dept",
          targetWindow: "Peak Heat Days",
        },
      ],
      after: [
        {
          code: "01",
          title: "District Heat Mortality Audit & Aapada Mitra Relief",
          action: "Verify verbal-autopsy heatstroke cases swiftly to disburse statutory ex-gratia to bereaved worker families.",
          leadBody: "Revenue & Medical Boards",
          targetWindow: "Weekly Review",
        },
        {
          code: "02",
          title: "Dense Native Canopy Corridors (Telangana Haritha Haram)",
          action: "Plant Neem, Banyan, and Tamarind shade rows along high-heat highway junctions and weekly shandy grounds.",
          leadBody: "Forest & Rural Development",
          targetWindow: "Monsoon Onset (July)",
        },
      ],
    },
  },
  {
    id: "drought",
    shortName: "Hard-Rock Drought",
    title: "Agricultural & Deccan Hard-Rock Aquifer Drought",
    subtitle:
      "Prolonged dry spells (>21 days) and fractured-granite groundwater depletion stressing rainfed cotton, maize, and drinking water.",
    peakSeason: "March – July & Dry Kharif Spells",
    primaryAgency: "Groundwater Dept · Mission Bhagiratha · Agriculture Dept",
    helplines: "1916 Mission Bhagiratha · 155326 Kisan Call · 1070",
    accentColor: "#eab308",
    affectedDistrictCount: 16,
    populationAtRisk: "19.8 Lakh rainfed smallholders & borewell clusters",
    visualTitle: "Fractured Granite Borewell Drawdown vs Check-Dam Aquifer Recharge",
    visualSummary:
      "Depicts hard-rock Deccan water table collapse under unlined borewell pumping versus Mission Kakatiya tank + check-dam percolation recovery.",
    mitigationUnitLabel: "Tank Desiltation & Micro-Irrigation Coverage",
    baselineImpactNote: "Deep borewells (<120 m) go dry in April; 38% Kharif moisture stress",
    protectedImpactNote: "Percolation tanks + drip + contingency millets preserve 82% rural water security",
    hotspots: [
      {
        district: "Mahabubnagar",
        corridor: "Devarkadra · Koilkonda · Hanwada · Addakal",
        severity: "Critical",
        triggerThreshold: "Rainfall deficit > -25% & piezometer drop > 4.5 m YoY",
        sheltersAndStaging: "Tanker Water Filling Stations & Fodder Depots per Mandal",
        exposureIndex: 91,
        readinessScore: 77,
      },
      {
        district: "Narayanpet",
        corridor: "Makthal · Utkoor · Maddur · Maganoor",
        severity: "Critical",
        triggerThreshold: "Soil moisture < 22% for 21 consecutive Kharif days",
        sheltersAndStaging: "Narayanpet Market Yard Fodder Bank & Water Grid Nodes",
        exposureIndex: 90,
        readinessScore: 73,
      },
      {
        district: "Nagarkurnool",
        corridor: "Kalwakurthy · Achampet uplands · Veldanda",
        severity: "High",
        triggerThreshold: "Over-exploited mandal groundwater stage > 100%",
        sheltersAndStaging: "Kalwakurthy Lift Buffer & Mandal Seed Contingency Centers",
        exposureIndex: 86,
        readinessScore: 76,
      },
      {
        district: "Jangaon",
        corridor: "Devaruppula · Palakurthy · Kodakandla",
        severity: "High",
        triggerThreshold: "Kharif dry spell > 3 weeks + tank storage < 25% FTL",
        sheltersAndStaging: "Jangaon Agricultural Market & Rythu Vedika Seed Vaults",
        exposureIndex: 84,
        readinessScore: 74,
      },
      {
        district: "Vikarabad",
        corridor: "Tandur · Kodangal · Pargi rainfed red-gram belt",
        severity: "Elevated",
        triggerThreshold: "NDVI vegetation anomaly > -20% vs 10-yr baseline",
        sheltersAndStaging: "Tandur Pulse Seed Hub & Mission Bhagiratha Boosters",
        exposureIndex: 78,
        readinessScore: 79,
      },
    ],
    monthlyProfile: [
      { month: "Jan", intensity: 44 },
      { month: "Feb", intensity: 58 },
      { month: "Mar", intensity: 76 },
      { month: "Apr", intensity: 92 },
      { month: "May", intensity: 95 },
      { month: "Jun", intensity: 68 },
      { month: "Jul", intensity: 40 },
      { month: "Aug", intensity: 36 },
      { month: "Sep", intensity: 28 },
      { month: "Oct", intensity: 24 },
      { month: "Nov", intensity: 30 },
      { month: "Dec", intensity: 38 },
    ],
    strategies: {
      before: [
        {
          code: "01",
          title: "Mission Kakatiya Tank Desiltation & Feeder Channels",
          action: "Clear inflow nalas of minor irrigation tanks before monsoon so first rains recharge shallow dugwells.",
          leadBody: "Minor Irrigation Dept",
          targetWindow: "Feb – May",
        },
        {
          code: "02",
          title: "Reserve Drought-Tolerant Contingency Seed Kits",
          action: "Pre-position short-duration Bajra, Jowar, Green Gram, and Red Gram kits for failed-sowing re-planting.",
          leadBody: "Dept of Agriculture & TSSDC",
          targetWindow: "Before June 1",
        },
        {
          code: "03",
          title: "Micro-Irrigation & Borewell WALTA Spacing Audit",
          action: "Enforce Telangana WALTA spacing rules, cap new deep agricultural bores in over-exploited mandals, and subsidize drip.",
          leadBody: "Groundwater Dept",
          targetWindow: "Year-Round",
        },
      ],
      during: [
        {
          code: "01",
          title: "Mission Bhagiratha Priority Allocation & Tail-End Tankers",
          action: "Ring-fence drinking water reservoirs from irrigation drawals; deploy GPS-tracked tankers to dry habitations.",
          leadBody: "Mission Bhagiratha & RWS",
          targetWindow: "Immediate Trigger",
        },
        {
          code: "02",
          title: "MGNREGS Extra 50 Drought Employment Days & Fodder Camps",
          action: "Raise household wage days from 100 to 150 under notified drought mandals and open subsidized cattle fodder depots.",
          leadBody: "Rural Development & Animal Husbandry",
          targetWindow: "Drought Notification",
        },
        {
          code: "03",
          title: "Protective Life-Saving Mobile Sprinkler Passes",
          action: "Use farm ponds (Kunta) and portable solar pumps to save flowering cotton/red-gram during 21-day dry breaks.",
          leadBody: "AE Agriculture & Rythu Vedika",
          targetWindow: "Mid-Season Dry Spell",
        },
      ],
      after: [
        {
          code: "01",
          title: "PMFBY / Rythu Bima Crop Loss Settlement & Loan Rescheduling",
          action: "Use CCE crop-cutting + satellite yield index to credit insurance claims and convert short-term crop loans.",
          leadBody: "Lead District Bank & Agriculture",
          targetWindow: "Harvest Window",
        },
        {
          code: "02",
          title: "Farm Pond & Artificial Recharge Shaft Scaling",
          action: "Convert 10% of failed dryland plots into lined rainwater farm ponds coupled with injection wells.",
          leadBody: "MGNREGS & Watershed Wing",
          targetWindow: "Post-Drought Cycle",
        },
      ],
    },
  },
  {
    id: "thunderstorm_hail",
    shortName: "Hail & Lightning",
    title: "Unseasonal Hailstorms, Squalls (60+ km/h) & Lightning Strikes",
    subtitle:
      "Pre-monsoon convective cells destroying horticulture, standing Rabi paddy, and causing high rural lightning fatalities.",
    peakSeason: "March – May & Oct Withdrawal",
    primaryAgency: "TSDMA · IMD Doppler Radar · Agriculture & Forest Depts",
    helplines: "Damini Lightning App · 1070 · 108 · 1912 Power",
    accentColor: "#a855f7",
    affectedDistrictCount: 18,
    populationAtRisk: "11.5 Lakh Rabi farmers & open-field grazers",
    visualTitle: "Cumulonimbus Lightning Footprint & Agri-Hail Net Protection",
    visualSummary:
      "Maps convective storm anvil electrostatic discharge rings (Damini 20 km radius alert) alongside farmer anti-hail nets and grounded lightning arrestors.",
    mitigationUnitLabel: "Damini Early Alert & Protected Crop Area",
    baselineImpactNote: "Open-field cotton/paddy farmers suffer high strike fatalities & 60% hail shattering",
    protectedImpactNote: "25-minute Damini SMS warning + village lightning arrestors cut field casualties by 90%",
    hotspots: [
      {
        district: "Nizamabad",
        corridor: "Bodhan · Armoor · Balkonda · Dichpally turmeric/maize belt",
        severity: "Critical",
        triggerThreshold: "Doppler reflectivity > 55 dBZ + winds ≥ 60 km/h",
        sheltersAndStaging: "Bodhan & Armoor Grain Market Covered Sheds (Tarpaulins)",
        exposureIndex: 90,
        readinessScore: 76,
      },
      {
        district: "Kamareddy",
        corridor: "Banswada · Yellareddy · Kamareddy Rural",
        severity: "Critical",
        triggerThreshold: "Rabi harvest squall line + convective hail > 2 cm",
        sheltersAndStaging: "Kamareddy IKP Covered Procurement Yards",
        exposureIndex: 88,
        readinessScore: 74,
      },
      {
        district: "Siddipet",
        corridor: "Gajwel · Dubbak · Husnabad mango & paddy belt",
        severity: "High",
        triggerThreshold: "Cloud-to-ground lightning density > 8 strikes/km²/hr",
        sheltersAndStaging: "Siddipet Rythu Bazar Sheds & Gram Panchayat Roof Shelters",
        exposureIndex: 84,
        readinessScore: 78,
      },
      {
        district: "Jagtial",
        corridor: "Metpally · Korutla · Dharmapuri mango orchards",
        severity: "High",
        triggerThreshold: "March–April pre-monsoon hail & 70 km/h mango-drop squall",
        sheltersAndStaging: "Jagtial Mango Market Yard & Mandals Cold Rooms",
        exposureIndex: 86,
        readinessScore: 75,
      },
    ],
    monthlyProfile: [
      { month: "Jan", intensity: 8 },
      { month: "Feb", intensity: 16 },
      { month: "Mar", intensity: 66 },
      { month: "Apr", intensity: 92 },
      { month: "May", intensity: 86 },
      { month: "Jun", intensity: 48 },
      { month: "Jul", intensity: 28 },
      { month: "Aug", intensity: 30 },
      { month: "Sep", intensity: 44 },
      { month: "Oct", intensity: 58 },
      { month: "Nov", intensity: 14 },
      { month: "Dec", intensity: 6 },
    ],
    strategies: {
      before: [
        {
          code: "01",
          title: "Install Grounded Lightning Arrestors on Schools & Rythu Vedikas",
          action: "Fit copper ESE/Franklin rods with low-resistance earthing pits on tall Panchayat buildings and IKP yards.",
          leadBody: "Panchayat Raj & Energy Dept",
          targetWindow: "January – February",
        },
        {
          code: "02",
          title: "Pre-Position Waterproof Tarpaulins at 4,000+ IKP Centres",
          action: "Issue 2 heavy HDPE tarpaulins per paddy heap lot at procurement centres before Rabi harvest peaks in April.",
          leadBody: "Civil Supplies & Marketing",
          targetWindow: "March 15",
        },
        {
          code: "03",
          title: "Damini & Meghdoot App Onboarding in Gram Sabhas",
          action: "Ensure AEOs, sarpanchs, and shepherds receive 20-km lightning push notifications before afternoon clouds build.",
          leadBody: "TSDMA & IMD Hyderabad",
          targetWindow: "Pre-Summer",
        },
      ],
      during: [
        {
          code: "01",
          title: "Immediate Field Exit & 30-30 Lightning Safety Protocol",
          action: "Evacuate open paddy fields, water bodies, and isolated trees into concrete buildings or closed tractors immediately.",
          leadBody: "Village Revenue & Aapada Mitra",
          targetWindow: "30 Min Before Cell",
        },
        {
          code: "02",
          title: "11 kV Line Fault Isolation & Transformer Surge Safety",
          action: "Keep standby linemen crews ready to restore uprooted poles and isolate snapped live conductors immediately.",
          leadBody: "TGNPDCL / TGSPDCL",
          targetWindow: "Active Squall",
        },
      ],
      after: [
        {
          code: "01",
          title: "48-Hour Rapid Crop & Orchard Damage Panchanama",
          action: "Digitally map hail-flattened paddy/mango acreage via geo-tagged photos for SDRF input-subsidy disbursement.",
          leadBody: "Agriculture & Horticulture Dept",
          targetWindow: "0–48 Hours",
        },
        {
          code: "02",
          title: "Priority Procurement of Slightly Discoloured / Wet Grain",
          action: "Operate mobile grain-dryers at IKP centres so farmers do not lose their entire Rabi harvest to post-hail sprouting.",
          leadBody: "Civil Supplies Corp",
          targetWindow: "Days 1–5",
        },
      ],
    },
  },
  {
    id: "forest_fire",
    shortName: "Forest Fires",
    title: "Dry-Deciduous Forest & Scrubland Fires (Amrabad & Kawal)",
    subtitle:
      "Summer leaf-litter burns across Nallamala, Kawal, Eturnagaram, and Kinnerasani wildlife corridors threatening biodiversity and tribal hamlets.",
    peakSeason: "February – May",
    primaryAgency: "Telangana Forest Dept · FSI SNPP Satellite Alerts · TSDMA",
    helplines: "1926 Forest Toll-Free · 101 Fire & Rescue · 1070",
    accentColor: "#ef4444",
    affectedDistrictCount: 9,
    populationAtRisk: "3.4 Lakh Chenchu, Gond & Koya forest-fringe habitations",
    visualTitle: "Nallamala Perimeter Firebreak & FSI Thermal Suppression Grid",
    visualSummary:
      "Models dry teak leaf-litter fire propagation across slope contours versus cleared 15m mineral firebreaks, mist blowers, and rapid satellite dispatch.",
    mitigationUnitLabel: "Fireline Clearance & Base-Camp Rapid Response",
    baselineImpactNote: "Unchecked ground litter fire spreads 2.8 km/hr in March afternoon winds",
    protectedImpactNote: "Cleared 15m firelines + FSI 20-min SMS dispatch contain 91% ignitions below 2 hectares",
    hotspots: [
      {
        district: "Nagarkurnool",
        corridor: "Amrabad Tiger Reserve · Farahabad · Maddimadugu · Mannanur",
        severity: "Critical",
        triggerThreshold: "FSI VIIRS hotspot + dry humidity < 15% & slope > 18°",
        sheltersAndStaging: "Mannanur Forest Base Camp & Domalapenta Strike Unit",
        exposureIndex: 93,
        readinessScore: 83,
      },
      {
        district: "Komaram Bheem Asifabad",
        corridor: "Kawal Tiger Reserve Core · Jannaram · Kerameri ghats",
        severity: "Critical",
        triggerThreshold: "Consecutive 38°C+ days with teak litter depth > 8 cm",
        sheltersAndStaging: "Jannaram Range Strike Hub & Utnoor Fire Watchtower",
        exposureIndex: 90,
        readinessScore: 80,
      },
      {
        district: "Mulugu",
        corridor: "Eturnagaram Wildlife Sanctuary · Tadvai · Pasra belts",
        severity: "High",
        triggerThreshold: "Mahua collection season dry-grass ignition spikes",
        sheltersAndStaging: "Tadvai Eco-Tourism Staging Hub & Mulugu Fire Station",
        exposureIndex: 85,
        readinessScore: 77,
      },
      {
        district: "Bhadradri Kothagudem",
        corridor: "Kinnerasani Sanctuary · Paloncha · Yellandu hills",
        severity: "High",
        triggerThreshold: "Bamboo flowering dry-clump fuel load buildup",
        sheltersAndStaging: "Kinnerasani Range Office & Paloncha Fire Tender Station",
        exposureIndex: 82,
        readinessScore: 78,
      },
    ],
    monthlyProfile: [
      { month: "Jan", intensity: 28 },
      { month: "Feb", intensity: 74 },
      { month: "Mar", intensity: 96 },
      { month: "Apr", intensity: 92 },
      { month: "May", intensity: 68 },
      { month: "Jun", intensity: 16 },
      { month: "Jul", intensity: 3 },
      { month: "Aug", intensity: 2 },
      { month: "Sep", intensity: 4 },
      { month: "Oct", intensity: 8 },
      { month: "Nov", intensity: 12 },
      { month: "Dec", intensity: 18 },
    ],
    strategies: {
      before: [
        {
          code: "01",
          title: "Clear 15-Meter Firelines & Controlled Early Burns",
          action: "Cut dry grass along sanctuary boundaries, power-line right-of-ways, and highway edges by January 31.",
          leadBody: "Telangana Forest Dept",
          targetWindow: "Dec – Jan",
        },
        {
          code: "02",
          title: "Engage Tribal Fire Watchers & Vana Samrakshana Samithis",
          action: "Recruit local Chenchu and Gond youth as seasonal watchtower spotters armed with blowers and wireless sets.",
          leadBody: "FD & VSS Committees",
          targetWindow: "Feb – May Engagement",
        },
      ],
      during: [
        {
          code: "01",
          title: "FSI Satellite Alert Dispatch Within 15 Minutes",
          action: "Route MODIS/VIIRS thermal coordinates straight to Beat Officer mobiles for immediate leaf-blower and counter-fire containment.",
          leadBody: "Forest GIS Cell & Fire Tenders",
          targetWindow: "Real-Time Detection",
        },
        {
          code: "02",
          title: "Protect Fringe Hamlets, Check-Posts & Wildlife Waterholes",
          action: "Wet perimeter zones around Chenchu/Gond habitations and divert traffic on Srisailam/Mannanur ghat roads if smoke blinds visibility.",
          leadBody: "Forest & Fire Service (101)",
          targetWindow: "Active Front",
        },
      ],
      after: [
        {
          code: "01",
          title: "Wildlife Veterinary Patrol & Soil Erosion Trenches",
          action: "Treat injured fauna, fill forest saucers, and dig contour staggered trenches before July rains wash away ash.",
          leadBody: "Wildlife Wing",
          targetWindow: "Days 1–30",
        },
      ],
    },
  },
  {
    id: "seismic",
    shortName: "Seismic & Dams",
    title: "Seismic Zone-III Rift Monitoring & Major Reservoir Dam Safety",
    subtitle:
      "Godavari Rift Zone-III moderate tremor preparedness alongside structural instrumentation of Nagarjunasagar, SRSP, and Hyderabad dense blocks.",
    peakSeason: "Year-Round Monitoring",
    primaryAgency: "NCS · NGRI Hyderabad · State Dam Safety Org · TSDMA",
    helplines: "1070 EOC · 101 Collapse Rescue · 112 · 108",
    accentColor: "#6366f1",
    affectedDistrictCount: 8,
    populationAtRisk: "22 Lakh high-density urban & dam-downstream residents",
    visualTitle: "Godavari Rift P/S-Wave Seismograph & Dam Piezometer Check",
    visualSummary:
      "Plots live P-wave/S-wave crustal trace across the Godavari Graben Zone-III fault alongside dam gate interlocks and seismic masonry retrofitting.",
    mitigationUnitLabel: "Structural Retrofitting & Dam Instrumentation",
    baselineImpactNote: "Unreinforced brick infill & non-engineered urban extensions crack above M 4.8",
    protectedImpactNote: "IS-1893 ductile ties + dam accelerograph alerts protect critical lifelines",
    hotspots: [
      {
        district: "Bhadradri Kothagudem",
        corridor: "Godavari Graben Zone-III · Kothagudem · Bhadrachalam fault belt",
        severity: "High",
        triggerThreshold: "NCS M ≥ 4.0 shallow event (< 25 km depth)",
        sheltersAndStaging: "Open Stadium Assembly Grounds & Singareni Emergency Hub",
        exposureIndex: 76,
        readinessScore: 78,
      },
      {
        district: "Mulugu",
        corridor: "Godavari Rift margin · Eturnagaram · Medaram",
        severity: "High",
        triggerThreshold: "Zone-III tectonic swarm or > 0.15g peak ground acceleration",
        sheltersAndStaging: "Mulugu District Parade Ground & School Open Lawns",
        exposureIndex: 74,
        readinessScore: 74,
      },
      {
        district: "Nalgonda",
        corridor: "Nagarjunasagar Dam downstream & Miryalaguda corridor",
        severity: "Elevated",
        triggerThreshold: "Dam safety accelerograph check triggered at M ≥ 3.5 within 100 km",
        sheltersAndStaging: "Hill Colony Ground & Nalgonda Police Parade Lawn",
        exposureIndex: 68,
        readinessScore: 86,
      },
      {
        district: "Hyderabad",
        corridor: "Old City · Charminar heritage masonry · high-rise IT basements",
        severity: "Elevated",
        triggerThreshold: "Zone-II urban amplification & soft-storey vulnerability",
        sheltersAndStaging: "NTR Stadium, LB Stadium, Parade Grounds Safe Zones",
        exposureIndex: 71,
        readinessScore: 81,
      },
    ],
    monthlyProfile: [
      { month: "Jan", intensity: 42 },
      { month: "Feb", intensity: 42 },
      { month: "Mar", intensity: 42 },
      { month: "Apr", intensity: 42 },
      { month: "May", intensity: 42 },
      { month: "Jun", intensity: 42 },
      { month: "Jul", intensity: 45 },
      { month: "Aug", intensity: 46 },
      { month: "Sep", intensity: 46 },
      { month: "Oct", intensity: 44 },
      { month: "Nov", intensity: 42 },
      { month: "Dec", intensity: 42 },
    ],
    strategies: {
      before: [
        {
          code: "01",
          title: "IS-1893 Structural Audit of Schools, Hospitals & Old Bridges",
          action: "Retrofit masonry schools, PHCs, and water overhead tanks with seismic bands across Zone-III Godavari mandals.",
          leadBody: "R&B & State Dam Safety Org",
          targetWindow: "Ongoing Annual Audit",
        },
        {
          code: "02",
          title: "Real-Time NGRI Accelerographs on SRSP, Kaleshwaram & Sagar",
          action: "Calibrate automated strong-motion piezometers and spillway emergency power backup systems.",
          leadBody: "NGRI & I&CAD Dam Cell",
          targetWindow: "Continuous Telemetry",
        },
      ],
      during: [
        {
          code: "01",
          title: "Drop-Cover-Hold & Automatic Gas/Power Interlocks",
          action: "Conduct quarterly school mock drills; trigger industrial valve shutoffs and lift parking stops on P-wave detection.",
          leadBody: "TSDMA & NDRF USAR",
          targetWindow: "0–60 Seconds",
        },
      ],
      after: [
        {
          code: "01",
          title: "Dam Inspection Within 2 Hours & Rapid Visual Screening",
          action: "Verify spillway seepage, cracks, and multi-storey columns before re-occupying any buildings after aftershocks.",
          leadBody: "SDSO Engineers & GHMC Town Planning",
          targetWindow: "0–24 Hours",
        },
      ],
    },
  },
  {
    id: "industrial_hazmat",
    shortName: "Industrial Hazmat",
    title: "Pharma Chemical, Industrial Boiler & Coal Mining Emergencies",
    subtitle:
      "Solvent vapour leaks, reactor blasts, and colliery methane/water inrush across Telangana's bulk-drug IDA hubs and Singareni belts.",
    peakSeason: "Year-Round Industrial Operations",
    primaryAgency: "DISH Telangana · TSPCB · NDRF CBRN · Singareni Rescue",
    helplines: "112 Emergency · 101 Hazmat Fire · 1070 · 1800-425-1110 (TSPCB)",
    accentColor: "#ec4899",
    affectedDistrictCount: 6,
    populationAtRisk: "16.8 Lakh IDA perimeter workers & neighbouring settlements",
    visualTitle: "Downwind Toxic Dispersion Cone (1km / 3km / 5km Buffer Rings)",
    visualSummary:
      "Simulates downwind chemical plume spread from an IDA reactor unit with real-time wind-direction evacuation cones and NDRF CBRN decontamination barriers.",
    mitigationUnitLabel: "Off-Site Emergency Readiness & Gas Scrubber Locks",
    baselineImpactNote: "Unwarned solvent plume exposes downwind 3 km residential colonies",
    protectedImpactNote: "Automated gas sensors + crosswind sirens clear 1 km red zone within 18 minutes",
    hotspots: [
      {
        district: "Sangareddy",
        corridor: "Patancheru · Pashamylaram · Bollaram · Kazipally Pharma IDAs",
        severity: "Critical",
        triggerThreshold: "VOC / Ammonia / H2S sensor > IDLH or reactor thermal runaway",
        sheltersAndStaging: "Patancheru Government Hospital Decon Wing & Isnapur Crosswind Camp",
        exposureIndex: 92,
        readinessScore: 81,
      },
      {
        district: "Medchal-Malkajgiri",
        corridor: "Jeedimetla · Balanagar · Nacharam · Mallapur IDA zones",
        severity: "Critical",
        triggerThreshold: "High-density urban proximity within 500 m of chemical boilers",
        sheltersAndStaging: "Gandhi Hospital Burns/Toxicology & Jeedimetla Fire Hazmat Bay",
        exposureIndex: 90,
        readinessScore: 79,
      },
      {
        district: "Yadadri Bhuvanagiri",
        corridor: "Choutuppal · Dhotigudem · Gundrampally pharma cluster",
        severity: "High",
        triggerThreshold: "Solvent tanker highway accident (NH-65) or effluent surge",
        sheltersAndStaging: "Choutuppal CHC & Highway Hazmat Containment Depot",
        exposureIndex: 82,
        readinessScore: 75,
      },
      {
        district: "Peddapalli",
        corridor: "Singareni Collieries RG-1/2/3 & Ramagundam Fertilizer/NTPC",
        severity: "High",
        triggerThreshold: "Underground CO/Methane spike or ammonia pipeline drop",
        sheltersAndStaging: "SCCL Mine Rescue Station Godavarikhani & Area Hospital",
        exposureIndex: 84,
        readinessScore: 88,
      },
    ],
    monthlyProfile: [
      { month: "Jan", intensity: 64 },
      { month: "Feb", intensity: 68 },
      { month: "Mar", intensity: 76 },
      { month: "Apr", intensity: 84 },
      { month: "May", intensity: 88 },
      { month: "Jun", intensity: 72 },
      { month: "Jul", intensity: 65 },
      { month: "Aug", intensity: 64 },
      { month: "Sep", intensity: 66 },
      { month: "Oct", intensity: 70 },
      { month: "Nov", intensity: 72 },
      { month: "Dec", intensity: 68 },
    ],
    strategies: {
      before: [
        {
          code: "01",
          title: "Mandatory Off-Site Emergency Drills & MSDS Registry",
          action: "Require all Major Accident Hazard (MAH) pharma units to share real-time chemical inventories with Fire & Collectorate EOC.",
          leadBody: "Directorate of Factories (DISH)",
          targetWindow: "Bi-Annual Statutory Drill",
        },
        {
          code: "02",
          title: "Perimeter Gas-Leak Sirens & Windsocks in English/Telugu",
          action: "Maintain automated perimeter LEL/VOC analyzers and windsock towers so residents know crosswind evacuation paths.",
          leadBody: "TSPCB & IDA Associations",
          targetWindow: "Continuous Maintenance",
        },
      ],
      during: [
        {
          code: "01",
          title: "Crosswind Evacuation & Shelter-in-Place (Close Vents)",
          action: "Never evacuate downwind; seal wet cloth along door gaps for 3–5 km zone while clearing the 1 km red zone.",
          leadBody: "NDRF CBRN & Fire Dept",
          targetWindow: "0–20 Minutes",
        },
        {
          code: "02",
          title: "Zero-Runoff Firewater Containment & Antidote Dispatch",
          action: "Bund contaminated firefighting runoff away from stormwater lakes and stock atropine/methylene-blue antidotes at nearby PHCs.",
          leadBody: "TSPCB & Medical Teams",
          targetWindow: "Active Incident",
        },
      ],
      after: [
        {
          code: "01",
          title: "Air/Soil/Water Testing & Safety Closure Audit",
          action: "Clear VOC/heavy-metal residue from surrounding borewells and certify root-cause pressure valve fixes prior to restart.",
          leadBody: "TSPCB & DISH Investigation",
          targetWindow: "Days 1–14",
        },
      ],
    },
  },
];

const DISASTER_ICONS: Record<TelanganaDisasterId, typeof Waves> = {
  river_flood: Waves,
  urban_flash_flood: Droplets,
  heatwave: Sun,
  drought: Wheat,
  thunderstorm_hail: CloudLightning,
  forest_fire: Flame,
  seismic: Activity,
  industrial_hazmat: Factory,
};

function DisasterVisualCanvas({
  disaster,
  protectedMode,
  mitigationLevel,
}: {
  disaster: TelanganaDisasterProfile;
  protectedMode: boolean;
  mitigationLevel: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    const start = performance.now();

    const render = (now: number) => {
      const t = (now - start) / 1000;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth || 720;
      const h = canvas.clientHeight || 300;
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Deep slate background grid
      ctx.fillStyle = "#060b14";
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      for (let gx = 40; gx < w; gx += 48) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = 36; gy < h; gy += 36) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      const protectionFactor = protectedMode ? mitigationLevel / 100 : 0.15;

      if (disaster.id === "river_flood") {
        // River cross-section with warning levels 43/48/53 ft & levee + boat
        const dangerFt = 53;
        const crestFt = protectedMode
          ? 49 - protectionFactor * 3.5 + Math.sin(t * 1.4) * 0.4
          : 54.6 + Math.sin(t * 1.7) * 0.6;
        const waterY = h - 35 - ((crestFt - 32) / 28) * (h - 90);

        // Warning lines
        const levels = [
          { ft: 53, label: "53 ft Danger", col: "rgba(239,68,68,0.75)" },
          { ft: 48, label: "48 ft Warning II", col: "rgba(249,115,22,0.7)" },
          { ft: 43, label: "43 ft Warning I", col: "rgba(234,179,8,0.65)" },
        ];
        levels.forEach((lv) => {
          const ly = h - 35 - ((lv.ft - 32) / 28) * (h - 90);
          ctx.setLineDash([5, 5]);
          ctx.strokeStyle = lv.col;
          ctx.beginPath();
          ctx.moveTo(30, ly);
          ctx.lineTo(w - 190, ly);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = lv.col;
          ctx.font = "11px monospace";
          ctx.fillText(lv.label, 34, ly - 5);
        });

        // Water wave
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w - 180; x += 8) {
          const wave = Math.sin(x * 0.035 + t * 2.8) * 5 + Math.cos(x * 0.018 - t * 1.7) * 3;
          ctx.lineTo(x, waterY + wave);
        }
        ctx.lineTo(w - 180, h);
        ctx.closePath();
        const waterGrad = ctx.createLinearGradient(0, waterY, 0, h);
        waterGrad.addColorStop(0, "rgba(14,165,233,0.72)");
        waterGrad.addColorStop(1, "rgba(7,89,133,0.9)");
        ctx.fillStyle = waterGrad;
        ctx.fill();

        // High-ground levee embankment & shelter on right
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.moveTo(w - 210, h);
        ctx.lineTo(w - 165, h - 145);
        ctx.lineTo(w, h - 145);
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = protectedMode ? "#10b981" : "#64748b";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Relief Camp on elevated ground
        ctx.fillStyle = protectedMode ? "#065f46" : "#334155";
        ctx.fillRect(w - 140, h - 188, 98, 43);
        ctx.strokeStyle = protectedMode ? "#34d399" : "#94a3b8";
        ctx.strokeRect(w - 140, h - 188, 98, 43);
        ctx.fillStyle = "#f8fafc";
        ctx.font = "600 11px sans-serif";
        ctx.fillText("High-Ground Camp", w - 134, h - 168);
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "10px monospace";
        ctx.fillText(protectedMode ? "Evacuated: 96%" : "Pending Evac", w - 134, h - 153);

        // Moving NDRF Boat
        const boatX = 110 + ((Math.sin(t * 0.9) + 1) * 0.5) * (w - 360);
        const boatY = waterY + Math.sin(boatX * 0.035 + t * 2.8) * 4 - 8;
        ctx.fillStyle = "#f97316";
        ctx.beginPath();
        ctx.moveTo(boatX - 22, boatY);
        ctx.lineTo(boatX + 24, boatY);
        ctx.lineTo(boatX + 16, boatY + 10);
        ctx.lineTo(boatX - 16, boatY + 10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "10px monospace";
        ctx.fillText("NDRF BOAT", boatX - 22, boatY - 6);

        ctx.fillStyle = "#e2e8f0";
        ctx.font = "600 12px monospace";
        ctx.fillText(
          `Godavari Stage: ${crestFt.toFixed(1)} ft ${crestFt >= dangerFt ? "(DANGER)" : "(CONTROLLED)"}`,
          28,
          28
        );
      } else if (disaster.id === "urban_flash_flood") {
        // Cloudburst rain + urban road cross-section + stormwater culvert
        const surgeDepthCm = protectedMode
          ? Math.max(12, 68 * (1 - protectionFactor * 0.68)) + Math.sin(t * 2) * 2
          : 78 + Math.sin(t * 2.5) * 4;

        // Rain streaks
        ctx.strokeStyle = "rgba(56,189,248,0.38)";
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 42; i++) {
          const rx = ((i * 53 + t * 180) % (w + 40)) - 20;
          const ry = ((i * 37 + t * 340) % (h - 70));
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 6, ry + 16);
          ctx.stroke();
        }

        // City buildings silhouettes
        const bldgs = [40, 120, 210, 390, 490, 580];
        bldgs.forEach((bx, idx) => {
          const bh = 70 + (idx % 3) * 32;
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(bx, h - 92 - bh, 58, bh);
          ctx.strokeStyle = "rgba(148,163,184,0.22)";
          ctx.strokeRect(bx, h - 92 - bh, 58, bh);
        });

        // Road & Storm Culvert Tunnel
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, h - 92, w, 92);
        // Box drain cutaway
        ctx.fillStyle = "#020617";
        ctx.fillRect(60, h - 68, w - 120, 44);
        ctx.strokeStyle = protectedMode ? "#06b6d4" : "#ef4444";
        ctx.lineWidth = 2;
        ctx.strokeRect(60, h - 68, w - 120, 44);

        // Water inside culvert flowing fast if protected
        const flowOffset = (t * (protectedMode ? 120 : 25)) % 48;
        ctx.fillStyle = protectedMode ? "rgba(6,182,212,0.55)" : "rgba(239,68,68,0.45)";
        ctx.fillRect(62, h - 54, w - 124, 28);
        ctx.fillStyle = "#e0f2fe";
        for (let fx = 80 + flowOffset; fx < w - 90; fx += 48) {
          ctx.fillText("→", fx, h - 37);
        }

        // Road standing water
        const pondH = (surgeDepthCm / 100) * 42;
        ctx.fillStyle = "rgba(14,165,233,0.42)";
        ctx.fillRect(0, h - 92 - pondH, w, pondH);

        ctx.fillStyle = "#e2e8f0";
        ctx.font = "600 12px monospace";
        ctx.fillText(
          `Underpass Ponding: ${surgeDepthCm.toFixed(0)} cm · Nala Flow: ${protectedMode ? "HYDRAA Desilted" : "65% Silt Blockage"}`,
          28,
          28
        );
      } else if (disaster.id === "heatwave") {
        // Thermal Sun dome + outdoor worker thermal stress vs Chali-Kendram cool roof shelter
        const ambientC = 46.2;
        const indoorC = protectedMode ? ambientC - 4.4 * protectionFactor : ambientC - 0.8;

        // Solar heat arc
        const sunGrad = ctx.createRadialGradient(w * 0.28, 60, 12, w * 0.28, 60, 220);
        sunGrad.addColorStop(0, "rgba(251,146,60,0.92)");
        sunGrad.addColorStop(0.35, "rgba(239,68,68,0.32)");
        sunGrad.addColorStop(1, "rgba(239,68,68,0)");
        ctx.fillStyle = sunGrad;
        ctx.fillRect(0, 0, w, h);

        // Animated heat shimmer waves
        ctx.strokeStyle = "rgba(251,146,60,0.45)";
        ctx.lineWidth = 1.5;
        for (let row = 0; row < 4; row++) {
          ctx.beginPath();
          const baseY = 125 + row * 28;
          for (let x = 28; x < w * 0.52; x += 10) {
            const sy = baseY + Math.sin(x * 0.05 + t * 4 + row) * 4;
            if (x === 28) ctx.moveTo(x, sy);
            else ctx.lineTo(x, sy);
          }
          ctx.stroke();
        }

        // Cool-Roof Chali-Kendram Pavilion on right
        const sx = w * 0.58;
        const sw = w * 0.34;
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(sx, h - 145, sw, 105);
        ctx.strokeStyle = protectedMode ? "#34d399" : "#f97316";
        ctx.lineWidth = 2;
        ctx.strokeRect(sx, h - 145, sw, 105);

        // Reflective Cool Roof strip
        ctx.fillStyle = protectedMode ? "#f8fafc" : "#78350f";
        ctx.fillRect(sx - 8, h - 155, sw + 16, 10);

        ctx.fillStyle = "#f8fafc";
        ctx.font = "600 12px sans-serif";
        ctx.fillText(protectedMode ? "Cool-Roof Chali-Kendram" : "Unshaded Tin Shed", sx + 14, h - 118);
        ctx.fillStyle = protectedMode ? "#6ee7b7" : "#fca5a5";
        ctx.font = "600 18px monospace";
        ctx.fillText(`${indoorC.toFixed(1)}°C`, sx + 14, h - 90);
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "11px sans-serif";
        ctx.fillText(
          protectedMode ? "ORS + Misting + 06:00 Shift" : "Severe Heatstroke Zone",
          sx + 14,
          h - 62
        );

        ctx.fillStyle = "#fed7aa";
        ctx.font = "600 12px monospace";
        ctx.fillText(`Ambient Peak: ${ambientC.toFixed(1)}°C · Thermal Relief: -${(ambientC - indoorC).toFixed(1)}°C`, 28, 28);
      } else if (disaster.id === "drought") {
        // Fractured Granite Aquifer + Check-Dam Recharge vs Borewell Drawdown
        const tableY = protectedMode
          ? h * 0.56 - protectionFactor * 38 + Math.sin(t) * 2
          : h * 0.78 + Math.sin(t) * 1.5;

        // Soil + fractured basalt/granite layers
        ctx.fillStyle = "#292018";
        ctx.fillRect(0, h * 0.42, w, h * 0.58);
        ctx.fillStyle = "#1c1917";
        ctx.fillRect(0, h * 0.65, w, h * 0.35);

        // Aquifer saturation layer
        ctx.fillStyle = protectedMode ? "rgba(14,165,233,0.38)" : "rgba(234,179,8,0.2)";
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 12) {
          const cone = !protectedMode && Math.abs(x - w * 0.72) < 110
            ? (110 - Math.abs(x - w * 0.72)) * 0.35
            : 0;
          ctx.lineTo(x, tableY + cone);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();

        // Check-Dam + Mission Kakatiya Tank on left
        ctx.fillStyle = "rgba(56,189,248,0.65)";
        ctx.fillRect(45, h * 0.34, 170, h * 0.08);
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(215, h * 0.29, 14, h * 0.13);
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "11px sans-serif";
        ctx.fillText("Mission Kakatiya Tank & Check-Dam", 42, h * 0.27);

        // Percolation droplets down into water table when protected
        if (protectedMode) {
          ctx.fillStyle = "#38bdf8";
          for (let d = 0; d < 14; d++) {
            const dx = 65 + (d % 7) * 22;
            const dy = h * 0.43 + ((t * 48 + d * 19) % Math.max(24, tableY - h * 0.43));
            ctx.beginPath();
            ctx.arc(dx, dy, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Borewell casing on right
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(w * 0.72, h * 0.28);
        ctx.lineTo(w * 0.72, h - 20);
        ctx.stroke();
        ctx.fillStyle = "#fef08a";
        ctx.font = "11px monospace";
        ctx.fillText(
          protectedMode ? "Static Water Level: 11.4 m (Stable)" : "Drawdown Cone: 42.8 m (Dry)",
          w * 0.56,
          h * 0.24
        );
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "600 12px monospace";
        ctx.fillText("Deccan Hard-Rock Aquifer Section · Recharge vs Extraction", 28, 28);
      } else if (disaster.id === "thunderstorm_hail") {
        // Anvil cloud, lightning strike zones & farmer crop hail net + ESE lightning rod
        ctx.fillStyle = "#1e1b4b";
        ctx.beginPath();
        ctx.arc(w * 0.35, 76, 52, 0, Math.PI * 2);
        ctx.arc(w * 0.46, 70, 62, 0, Math.PI * 2);
        ctx.arc(w * 0.58, 78, 48, 0, Math.PI * 2);
        ctx.fill();

        // Damini 20km radius radar ring
        const pulseR = ((t * 55) % 160) + 25;
        ctx.strokeStyle = "rgba(168,85,247,0.45)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(w * 0.46, 120, pulseR, 0, Math.PI * 2);
        ctx.stroke();

        // Lightning bolt flash periodically
        const strikeCycle = Math.floor(t * 1.8) % 3 === 0;
        if (strikeCycle) {
          const lx = protectedMode ? w * 0.74 : w * 0.38;
          ctx.strokeStyle = "#facc15";
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.moveTo(w * 0.48, 108);
          ctx.lineTo(lx - 18, 165);
          ctx.lineTo(lx + 10, 185);
          ctx.lineTo(lx, h - 68);
          ctx.stroke();
        }

        // Hailstones
        ctx.fillStyle = "rgba(224,242,254,0.75)";
        for (let i = 0; i < 24; i++) {
          const hx = 120 + (i * 23) % (w - 220);
          const hy = 115 + ((t * 160 + i * 31) % (protectedMode ? 115 : h - 135));
          ctx.beginPath();
          ctx.arc(hx, hy, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Standing paddy/horticulture field & Hail Net + Lightning Arrestor mast
        ctx.fillStyle = "#14532d";
        ctx.fillRect(40, h - 55, w - 80, 35);
        if (protectedMode) {
          ctx.strokeStyle = "#34d399";
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(60, h - 82);
          ctx.lineTo(w * 0.62, h - 82);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "#6ee7b7";
          ctx.font = "11px sans-serif";
          ctx.fillText("Anti-Hail Orchard Netting", 70, h - 88);

          // Grounded ESE Lightning Mast
          ctx.strokeStyle = "#e2e8f0";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(w * 0.74, h - 140);
          ctx.lineTo(w * 0.74, h - 42);
          ctx.stroke();
          ctx.fillStyle = "#facc15";
          ctx.fillText("ESE Arrestor (Grounded)", w * 0.67, h - 148);
        }
        ctx.fillStyle = "#e9d5ff";
        ctx.font = "600 12px monospace";
        ctx.fillText("Damini 20 km Cell Tracker · Squall 68 km/h · Lightning Discharge", 28, 28);
      } else if (disaster.id === "forest_fire") {
        // Forest canopy slope + ember thermal front + 15m mineral firebreak
        ctx.fillStyle = "#14261c";
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(0, h - 90);
        ctx.lineTo(w * 0.55, h - 150);
        ctx.lineTo(w, h - 110);
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();

        const breakX = w * 0.56;
        // Cleared 15m Fireline gap
        if (protectedMode) {
          ctx.fillStyle = "#451a03";
          ctx.fillRect(breakX - 18, h - 165, 36, 155);
          ctx.strokeStyle = "#34d399";
          ctx.strokeRect(breakX - 18, h - 165, 36, 155);
          ctx.fillStyle = "#6ee7b7";
          ctx.font = "11px monospace";
          ctx.fillText("15m Cleared Firebreak", breakX - 62, h - 174);
        }

        // Advancing fire embers
        const fireMaxX = protectedMode ? breakX - 24 : Math.min(w - 40, breakX + 160 + Math.sin(t) * 20);
        for (let fx = 42; fx < fireMaxX; fx += 18) {
          const flameH = 22 + Math.sin(t * 7 + fx) * 9;
          const fg = ctx.createRadialGradient(fx, h - 115, 2, fx, h - 115, flameH);
          fg.addColorStop(0, "rgba(253,224,71,0.95)");
          fg.addColorStop(0.5, "rgba(239,68,68,0.75)");
          fg.addColorStop(1, "rgba(239,68,68,0)");
          ctx.fillStyle = fg;
          ctx.beginPath();
          ctx.arc(fx, h - 118, flameH, 0, Math.PI * 2);
          ctx.fill();
        }

        // Protected sanctuary trees on right
        for (let tx = breakX + 48; tx < w - 50; tx += 38) {
          ctx.fillStyle = protectedMode ? "#16a34a" : "#7f1d1d";
          ctx.beginPath();
          ctx.moveTo(tx, h - 175);
          ctx.lineTo(tx - 15, h - 115);
          ctx.lineTo(tx + 15, h - 115);
          ctx.closePath();
          ctx.fill();
        }

        ctx.fillStyle = "#fecaca";
        ctx.font = "600 12px monospace";
        ctx.fillText(
          protectedMode
            ? "FSI VIIRS Alert Dispatched · Fire Contained West of 15m Fireline"
            : "Unbroken Teak Litter Fuel · Spreading Across Sanctuary Core",
          28,
          28
        );
      } else if (disaster.id === "seismic") {
        // Real-time P/S Wave Seismograph + Concrete Dam Accelerometer
        const amp = protectedMode ? 18 : 42;
        ctx.strokeStyle = "#818cf8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 28; x < w * 0.58; x += 4) {
          const env = Math.exp(-Math.pow((x - ((t * 140) % (w * 0.55))) / 55, 2));
          const sy = h * 0.56 + Math.sin(x * 0.19 - t * 14) * amp * (0.25 + 0.85 * env);
          if (x === 28) ctx.moveTo(x, sy);
          else ctx.lineTo(x, sy);
        }
        ctx.stroke();

        // Dam Cross-section on right
        const dx = w * 0.66;
        ctx.fillStyle = "rgba(14,165,233,0.38)";
        ctx.fillRect(dx - 55, h * 0.42, 60, h * 0.42);
        ctx.fillStyle = "#334155";
        ctx.beginPath();
        ctx.moveTo(dx, h * 0.34);
        ctx.lineTo(dx + 22, h * 0.34);
        ctx.lineTo(dx + 75, h * 0.84);
        ctx.lineTo(dx, h * 0.84);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = protectedMode ? "#34d399" : "#f59e0b";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#c7d2fe";
        ctx.font = "600 12px monospace";
        ctx.fillText("Godavari Rift Zone-III Seismograph · Dam Safety Accelerometer", 28, 28);
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "11px monospace";
        ctx.fillText(
          protectedMode ? "Piezometer Nominal · IS-1893 Seismic Ties" : "Unretrofitted Masonry Risk",
          dx - 45,
          h * 0.28
        );
      } else {
        // Industrial Hazmat Plume Cones (1km / 3km / 5km)
        const cx = w * 0.24;
        const cy = h * 0.56;
        const plumeReach = protectedMode ? 175 * (1.15 - protectionFactor * 0.45) : 330;

        // Concentric distance rings
        [
          { r: 46, label: "1 km Red Evac", col: "rgba(239,68,68,0.8)" },
          { r: 92, label: "3 km Shelter-in-Place", col: "rgba(245,158,11,0.7)" },
          { r: 142, label: "5 km Air Buffer", col: "rgba(16,185,129,0.55)" },
        ].forEach((ring) => {
          ctx.strokeStyle = ring.col;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = ring.col;
          ctx.font = "10px monospace";
          ctx.fillText(ring.label, cx - 34, cy - ring.r - 4);
        });

        // Downwind dispersion cone moving ENE
        const plumeGrad = ctx.createLinearGradient(cx, cy, cx + plumeReach, cy);
        plumeGrad.addColorStop(0, "rgba(236,72,153,0.72)");
        plumeGrad.addColorStop(1, "rgba(236,72,153,0.04)");
        ctx.fillStyle = plumeGrad;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(
          cx + plumeReach,
          cy - 54 + Math.sin(t * 2) * 8
        );
        ctx.lineTo(
          cx + plumeReach,
          cy + 54 + Math.sin(t * 2) * 8
        );
        ctx.closePath();
        ctx.fill();

        // Source reactor box
        ctx.fillStyle = "#ec4899";
        ctx.fillRect(cx - 10, cy - 10, 20, 20);

        // Crosswind North Evacuation Arrow
        ctx.strokeStyle = "#34d399";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx + 75, cy + 40);
        ctx.lineTo(cx + 75, cy + 108);
        ctx.stroke();
        ctx.fillStyle = "#6ee7b7";
        ctx.font = "11px sans-serif";
        ctx.fillText("Crosswind Safe Exit ↓", cx + 84, cy + 92);

        ctx.fillStyle = "#fbcfe8";
        ctx.font = "600 12px monospace";
        ctx.fillText("IDA Dispersion Model · Wind Vector ENE 14 km/h · CBRN Zone Control", 28, 28);
      }

      ctx.restore();
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [disaster.id, protectedMode, mitigationLevel]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[300px] block bg-[#060b14]"
      aria-label={disaster.visualTitle}
    />
  );
}

export default function OverviewDisasterPreparedness({
  activeDistrict,
  activeVillage,
  currentTempC,
  rain7dMm,
}: {
  activeDistrict?: string | null;
  activeVillage?: string | null;
  currentTempC?: number | null;
  rain7dMm?: number | null;
}) {
  const [selectedId, setSelectedId] = useState<TelanganaDisasterId>("river_flood");
  const [phase, setPhase] = useState<DisasterPhase>("before");
  const [protectedMode, setProtectedMode] = useState<boolean>(true);
  const [mitigationLevel, setMitigationLevel] = useState<number>(82);
  const [selectedDistrictIdx, setSelectedDistrictIdx] = useState<number>(0);

  const disaster = useMemo(
    () => TELANGANA_DISASTERS.find((d) => d.id === selectedId) ?? TELANGANA_DISASTERS[0],
    [selectedId]
  );

  // Sync active hotspot highlight when switching disasters or when user's active district matches
  useEffect(() => {
    if (!activeDistrict) {
      setSelectedDistrictIdx(0);
      return;
    }
    const norm = activeDistrict.trim().toLowerCase();
    const matchIdx = disaster.hotspots.findIndex((h) =>
      h.district.toLowerCase().includes(norm) || norm.includes(h.district.toLowerCase())
    );
    setSelectedDistrictIdx(matchIdx >= 0 ? matchIdx : 0);
  }, [activeDistrict, disaster]);

  const activeHotspot = disaster.hotspots[selectedDistrictIdx] ?? disaster.hotspots[0];

  const districtMatchesActiveVillage = useMemo(() => {
    if (!activeDistrict) return false;
    const norm = activeDistrict.trim().toLowerCase();
    return disaster.hotspots.some(
      (h) => h.district.toLowerCase().includes(norm) || norm.includes(h.district.toLowerCase())
    );
  }, [activeDistrict, disaster]);

  const chartDistrictData = useMemo(
    () =>
      disaster.hotspots.map((h) => ({
        name: h.district.replace("Bhadradri ", "B. ").replace("Jayashankar ", "J. "),
        Exposure: h.exposureIndex,
        Readiness: h.readinessScore,
      })),
    [disaster]
  );

  const weatherContextSignal = useMemo(() => {
    if (typeof currentTempC === "number" && currentTempC >= 40) {
      return `Live settlement alert: ${currentTempC.toFixed(1)}°C observed — Heatwave & Forest Fire readiness elevated.`;
    }
    if (typeof rain7dMm === "number" && rain7dMm >= 65) {
      return `Live settlement alert: ${rain7dMm.toFixed(0)} mm 7-day rain forecast — Riverine & Urban Flood checks prioritized.`;
    }
    return `Active context: ${activeVillage ?? "Telangana State"} · Select any disaster profile below to inspect locations, strategies & visuals.`;
  }, [activeVillage, currentTempC, rain7dMm]);

  const DisasterIcon = DISASTER_ICONS[disaster.id];

  return (
    <section
      id="disaster-preparedness-section"
      className="scroll-mt-24 border-t border-white/10 bg-[#050912]"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 space-y-10">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-amber-300">
              <span>Telangana State Disaster Preparedness &amp; Multi-Hazard Observatory</span>
              <span aria-hidden="true">·</span>
              <span>8 Hazard Profiles</span>
              <span aria-hidden="true">·</span>
              <span>33 Districts</span>
            </div>
            <h3 className="mt-2.5 text-3xl md:text-4xl font-semibold tracking-tight text-white text-balance">
              Select Any Telangana Disaster for District Hotspots, Strategies &amp; Visual Simulations
            </h3>
            <p className="mt-2.5 text-sm leading-6 text-white/60">
              {weatherContextSignal}
            </p>
          </div>

          <div className="border border-white/10 bg-[#080d17] px-4 py-3 text-xs font-mono tabular-nums text-white/80 shrink-0">
            <div className="flex items-center gap-2 text-amber-300 font-medium">
              <PhoneCall size={14} />
              <span>State Emergency Helplines</span>
            </div>
            <div className="mt-1.5 text-white/65">
              {disaster.helplines}
            </div>
          </div>
        </div>

        {/* All Kinds of Disasters in Telangana Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2.5">
          {TELANGANA_DISASTERS.map((d) => {
            const Icon = DISASTER_ICONS[d.id];
            const isSelected = d.id === selectedId;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedId(d.id)}
                className={`text-left border p-3.5 transition-colors flex flex-col justify-between gap-2.5 ${
                  isSelected
                    ? "bg-[#0d1526] border-white/40 text-white"
                    : "bg-[#070c16] border-white/10 text-white/65 hover:bg-[#0b1220] hover:border-white/25 hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <Icon
                    size={16}
                    style={{ color: isSelected ? d.accentColor : "rgba(255,255,255,0.45)" }}
                  />
                  <span
                    className="font-mono text-[10px] tabular-nums"
                    style={{ color: isSelected ? d.accentColor : "rgba(255,255,255,0.4)" }}
                  >
                    {d.affectedDistrictCount} dist
                  </span>
                </div>
                <div>
                  <div className="text-xs font-semibold leading-tight text-white">
                    {d.shortName}
                  </div>
                  <div className="mt-1 text-[11px] text-white/45 truncate">
                    {d.peakSeason}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Disaster Overview Strip */}
        <div className="border border-white/12 bg-[#070b14] p-6 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/55 font-mono tabular-nums">
              <span style={{ color: disaster.accentColor }} className="font-semibold">
                {disaster.shortName}
              </span>
              <span aria-hidden="true">·</span>
              <span>Peak: {disaster.peakSeason}</span>
              <span aria-hidden="true">·</span>
              <span>{disaster.primaryAgency}</span>
            </div>
            <h4 className="mt-2 text-2xl font-semibold text-white flex items-center gap-2.5">
              <DisasterIcon size={22} style={{ color: disaster.accentColor }} />
              <span>{disaster.title}</span>
            </h4>
            <p className="mt-2 text-sm leading-6 text-white/65">
              {disaster.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6">
            <div>
              <div className="text-[11px] text-white/45">Exposed Districts</div>
              <div
                className="mt-1 text-2xl font-semibold font-mono tabular-nums"
                style={{ color: disaster.accentColor }}
              >
                {disaster.affectedDistrictCount}
              </div>
            </div>
            <div className="col-span-2">
              <div className="text-[11px] text-white/45">Vulnerable Population &amp; Hubs</div>
              <div className="mt-1 text-sm font-semibold text-white">
                {disaster.populationAtRisk}
              </div>
              {districtMatchesActiveVillage && (
                <div className="mt-1.5 text-[11px] text-emerald-300 font-medium">
                  Active village district ({activeDistrict}) lies inside this hazard belt
                </div>
              )}
            </div>
          </div>
        </div>

        {/* VISUALS ROW: Interactive 60fps Hazard Visual + Seasonal & District Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
          {/* Live Interactive Disaster Visual Simulation */}
          <div className="xl:col-span-7 border border-white/12 bg-[#070b14] flex flex-col justify-between">
            <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-medium" style={{ color: disaster.accentColor }}>
                  Interactive Hazard &amp; Mitigation Visual
                </div>
                <h5 className="mt-0.5 text-base font-semibold text-white">
                  {disaster.visualTitle}
                </h5>
              </div>

              <div className="flex items-center gap-1 p-1 bg-white/[0.04] border border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setProtectedMode(false)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    !protectedMode
                      ? "bg-red-500/25 text-red-100"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  Unprepared
                </button>
                <button
                  type="button"
                  onClick={() => setProtectedMode(true)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    protectedMode
                      ? "bg-emerald-500/25 text-emerald-100"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  TSDMA Protected
                </button>
              </div>
            </div>

            <DisasterVisualCanvas
              disaster={disaster}
              protectedMode={protectedMode}
              mitigationLevel={mitigationLevel}
            />

            <div className="p-5 border-t border-white/10 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="text-xs text-white/75 flex items-center gap-3 flex-1">
                  <span className="whitespace-nowrap">{disaster.mitigationUnitLabel}:</span>
                  <input
                    type="range"
                    min={25}
                    max={100}
                    value={mitigationLevel}
                    onChange={(e) => setMitigationLevel(Number(e.target.value))}
                    className="w-full max-w-[200px] accent-cyan-400"
                  />
                  <span className="font-mono tabular-nums text-white font-semibold">
                    {mitigationLevel}%
                  </span>
                </label>
              </div>
              <div className="text-xs leading-5 text-white/65">
                {protectedMode ? disaster.protectedImpactNote : disaster.baselineImpactNote}
              </div>
            </div>
          </div>

          {/* 2 Disaster-Specific Recharts Analytics Visuals */}
          <div className="xl:col-span-5 flex flex-col gap-6">
            <div className="border border-white/12 bg-[#070b14] p-5 flex-1">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <div className="text-xs text-white/45">Annual Hazard Cycle</div>
                  <h5 className="text-sm font-semibold text-white">
                    12-Month Intensity Profile (Jan – Dec)
                  </h5>
                </div>
                <span
                  className="text-xs font-mono tabular-nums"
                  style={{ color: disaster.accentColor }}
                >
                  {disaster.peakSeason}
                </span>
              </div>
              <div className="h-[155px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={disaster.monthlyProfile} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0a0f1c",
                        borderColor: "rgba(255,255,255,0.15)",
                        fontSize: "12px",
                        color: "#f8fafc",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="intensity"
                      stroke={disaster.accentColor}
                      fill={disaster.accentColor}
                      fillOpacity={0.22}
                      strokeWidth={2}
                      name="Hazard Index"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="border border-white/12 bg-[#070b14] p-5 flex-1">
              <div className="mb-3">
                <div className="text-xs text-white/45">District Vulnerability vs Preparedness</div>
                <h5 className="text-sm font-semibold text-white">
                  Hotspot Exposure vs Shelter &amp; EOC Readiness (%)
                </h5>
              </div>
              <div className="h-[165px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDistrictData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0a0f1c",
                        borderColor: "rgba(255,255,255,0.15)",
                        fontSize: "12px",
                        color: "#f8fafc",
                      }}
                    />
                    <Bar dataKey="Exposure" fill={disaster.accentColor} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Readiness" fill="#10b981" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* TELANGANA HOTSPOT LOCATIONS & SHELTERS + DETAILED PHASE STRATEGIES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Interactive Telangana District & Basin Hotspot Locations */}
          <div className="lg:col-span-5 border border-white/12 bg-[#070b14] p-6 space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium" style={{ color: disaster.accentColor }}>
                <MapPin size={14} />
                <span>High-Risk Locations &amp; Staging Hubs</span>
              </div>
              <h5 className="mt-1 text-lg font-semibold text-white">
                Telangana Vulnerable Districts &amp; Basins
              </h5>
            </div>

            <div className="space-y-2.5">
              {disaster.hotspots.map((loc, idx) => {
                const isActive = idx === selectedDistrictIdx;
                return (
                  <button
                    key={loc.district}
                    type="button"
                    onClick={() => setSelectedDistrictIdx(idx)}
                    className={`w-full text-left border p-3.5 transition-colors ${
                      isActive
                        ? "bg-[#0d1628] border-white/35"
                        : "bg-[#090e1a] border-white/10 hover:border-white/25"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-white">
                        {loc.district}
                      </span>
                      <span
                        className={`text-[11px] font-mono tabular-nums font-medium ${
                          loc.severity === "Critical"
                            ? "text-red-300"
                            : loc.severity === "High"
                            ? "text-amber-300"
                            : "text-cyan-300"
                        }`}
                      >
                        {loc.severity} · {loc.readinessScore}% Ready
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-white/60">
                      {loc.corridor}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Location Operational Detail */}
            {activeHotspot && (
              <div className="pt-4 border-t border-white/10 space-y-2.5 text-xs">
                <div className="font-semibold text-white flex items-center gap-2">
                  <Building2 size={14} style={{ color: disaster.accentColor }} />
                  <span>Selected Zone Command Brief · {activeHotspot.district}</span>
                </div>
                <div className="text-white/65 leading-5">
                  <span className="text-white/45">Trigger Threshold: </span>
                  <span className="font-mono text-white/85">{activeHotspot.triggerThreshold}</span>
                </div>
                <div className="text-white/65 leading-5">
                  <span className="text-white/45">Shelters &amp; Staging Hubs: </span>
                  <span>{activeHotspot.sheltersAndStaging}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Detailed Before / During / After Strategies */}
          <div className="lg:col-span-7 border border-white/12 bg-[#070b14] p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-medium text-emerald-300">
                  Operational Playbook · Multi-Agency SOP
                </div>
                <h5 className="mt-1 text-lg font-semibold text-white">
                  Detailed Preparedness, Response &amp; Recovery Strategies
                </h5>
              </div>

              <div className="flex items-center gap-1 p-1 bg-white/[0.04] border border-white/10 shrink-0">
                {(
                  [
                    { id: "before" as DisasterPhase, label: "Before · Prevent" },
                    { id: "during" as DisasterPhase, label: "During · Respond" },
                    { id: "after" as DisasterPhase, label: "After · Recover" },
                  ]
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPhase(tab.id)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      phase === tab.id
                        ? "bg-white text-slate-950 font-semibold"
                        : "text-white/65 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-white/10 border-t border-white/10">
              {disaster.strategies[phase].map((step) => (
                <div key={step.code} className="py-4 first:pt-4 last:pb-0 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="font-mono text-xs font-semibold tabular-nums"
                        style={{ color: disaster.accentColor }}
                      >
                        {step.code}.
                      </span>
                      <h6 className="text-sm font-semibold text-white">
                        {step.title}
                      </h6>
                    </div>
                    <span className="text-[11px] font-mono text-white/50">
                      {step.targetWindow}
                    </span>
                  </div>
                  <p className="text-xs leading-6 text-white/70 pl-6">
                    {step.action}
                  </p>
                  <div className="pl-6 flex items-center gap-2 text-[11px] text-white/50">
                    <ShieldCheck size={12} className="text-emerald-400" />
                    <span>Accountable Lead: {step.leadBody}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-white/55">
              <div className="flex items-center gap-2">
                <ShieldAlert size={14} className="text-amber-300" />
                <span>Integrated with TSDMA Sachet CAP, District Collectorate 1070 &amp; Aapada Mitra Volunteers</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-white/45">
                <AlertTriangle size={12} className="text-amber-300" />
                <span>Live district threshold matching active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
