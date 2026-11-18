export type CommunitySectorKey =
  | "health"
  | "education"
  | "water"
  | "livelihood"
  | "environment";

export type SettlementType = "Rural Gram Panchayat" | "Municipal Ward / Town";

export type ResolutionPathwayType =
  | "govt_escalation"
  | "ngo_collab"
  | "youth_mobilization"
  | "hybrid";

export interface ObligationTemplate {
  id: string;
  sector: CommunitySectorKey;
  title: string;
  description: string;
  youthAndKidsRole: string;
  defaultTargetMetric: string;
}

export interface PillarBlueprintMeta {
  key: CommunitySectorKey;
  pillarLabel: string;
  title: string;
  sdg: string;
  sdgNumber: number;
  color: string;
  blockersPrompt: string;
  youthKidsRoleSummary: string;
}

export const PILLAR_META: Record<CommunitySectorKey, PillarBlueprintMeta> = {
  health: {
    key: "health",
    pillarLabel: "Pillar 1",
    title: "Health & Well-being",
    sdg: "UN SDG 3",
    sdgNumber: 3,
    color: "#16a34a",
    blockersPrompt:
      "Stagnant water or mosquito breeding hotspots, overflowing medical/toxic waste, absent staff at PHCs, medicine shortages, or malnourished children.",
    youthKidsRoleSummary:
      'Kids act as "Home Mosquito Patrols" checking flowerpots and coolers; college and medical students organize health camp registrations.',
  },
  education: {
    key: "education",
    pillarLabel: "Pillar 2",
    title: "Quality Education",
    sdg: "UN SDG 4",
    sdgNumber: 4,
    color: "#dc2626",
    blockersPrompt:
      "Children working instead of studying, broken school toilets or classrooms, lack of school drinking water, teacher absenteeism, or unsafe road crossings outside school gates.",
    youthKidsRoleSummary:
      "School kids donate old books and buddy up with peers; youth volunteers lead weekend tutoring and digital literacy sessions.",
  },
  water: {
    key: "water",
    pillarLabel: "Pillar 3",
    title: "Clean Water & Sanitation",
    sdg: "UN SDG 6",
    sdgNumber: 6,
    color: "#0284c7",
    blockersPrompt:
      "Contaminated or foul-smelling tap water, leaking main pipelines, broken handpumps, overflowing sewage manholes, or illegal sewage dumping into local lakes.",
    youthKidsRoleSummary:
      "Kids track household water wastage and leaky taps; youth squads lead pre-monsoon drain clearing and lake clean-up drives.",
  },
  livelihood: {
    key: "livelihood",
    pillarLabel: "Pillar 4",
    title: "Livelihood & Local Economy",
    sdg: "UN SDG 8",
    sdgNumber: 8,
    color: "#9f1239",
    blockersPrompt:
      "Youth needing skill training, women's SHGs lacking market access or raw materials, street vendors lacking vending zones, or eligible families missing welfare documentation.",
    youthKidsRoleSummary:
      "Youth help local artisans and vendors create digital profiles, catalog products, and set up digital payments.",
  },
  environment: {
    key: "environment",
    pillarLabel: "Pillar 5",
    title: "Environment & Climate Action",
    sdg: "UN SDG 13",
    sdgNumber: 13,
    color: "#15803d",
    blockersPrompt:
      "Illegal garbage or plastic dumping blackspots, open burning of waste, illegal tree felling, or barren public land suitable for plantation drives.",
    youthKidsRoleSummary:
      'Every child adopts one geo-tagged tree sapling ("My Tree Buddy"); youth lead weekend plastic drives and anti-plastic vendor campaigns.',
  },
};

export const PILLAR_ORDER: CommunitySectorKey[] = [
  "health",
  "education",
  "water",
  "livelihood",
  "environment",
];

export const OBLIGATIONS_CATALOG: ObligationTemplate[] = [
  // Pillar 1: Health (SDG 3)
  {
    id: "obl-hea-1",
    sector: "health",
    title: "Vector-Free Zone",
    description:
      "Conduct monthly inspections to eliminate stagnant water in open drains, tires, and vacant plots to prevent dengue and malaria.",
    youthAndKidsRole: 'Kids check home flowerpots & coolers ("Home Mosquito Patrols").',
    defaultTargetMetric: "Monthly Ward Inspection",
  },
  {
    id: "obl-hea-2",
    sector: "health",
    title: "100% Maternal & Child Tracking",
    description:
      "Verify that every pregnant woman and child under age 5 in the locality is registered with the nearest Anganwadi or PHC for immunization & nutrition.",
    youthAndKidsRole: "NSS/Nursing youth assist ASHA & Anganwadi house verification.",
    defaultTargetMetric: "100% Anganwadi Coverage",
  },
  {
    id: "obl-hea-3",
    sector: "health",
    title: "Quarterly Preventive Health Camps",
    description:
      "Partner with local clinics or NGOs to host free blood pressure, diabetes, anemia, and eye screening camps every 90 days.",
    youthAndKidsRole: "College & medical students manage camp registration desks.",
    defaultTargetMetric: "1 Camp / 90 Days",
  },
  {
    id: "obl-hea-4",
    sector: "health",
    title: "Community First-Responder Squad",
    description:
      "Train at least 10 local youth volunteers per ward in basic CPR, first aid, and heatstroke or snakebite emergency response.",
    youthAndKidsRole: "10 certified Youth First-Responders per ward.",
    defaultTargetMetric: "10 Trained Youth",
  },
  {
    id: "obl-hea-5",
    sector: "health",
    title: "Mental Health & Substance Abuse Awareness",
    description:
      "Host bi-annual youth and parent workshops addressing stress, addiction, and emotional well-being.",
    youthAndKidsRole: "Youth clubs host peer support & counselor Q&A circles.",
    defaultTargetMetric: "2 Workshops / Year",
  },

  // Pillar 2: Education (SDG 4)
  {
    id: "obl-edu-1",
    sector: "education",
    title: "Zero Out-of-School Children",
    description:
      "Conduct a neighborhood survey to identify school dropouts or child laborers and enroll 100% of them in local schools.",
    youthAndKidsRole: "Youth volunteers map households & coordinate SMC enrollment.",
    defaultTargetMetric: "100% Enrollment",
  },
  {
    id: "obl-edu-2",
    sector: "education",
    title: "School Infrastructure Audit",
    description:
      "Ensure every government or community school in the boundary has functional separate toilets, clean drinking water, electricity, and intact roofs.",
    youthAndKidsRole: "Youth/SMC parents log quarterly school checklist & GPS photos.",
    defaultTargetMetric: "Quarterly School Check",
  },
  {
    id: "obl-edu-3",
    sector: "education",
    title: "Weekend Remedial & Reading Clubs",
    description:
      "College students and retired residents run 2-hour weekend classes for slow learners, foundational literacy, and English/math tutoring.",
    youthAndKidsRole: "Youth lead weekend tutoring; seniors buddy up with younger peers.",
    defaultTargetMetric: "2 Hrs Every Weekend",
  },
  {
    id: "obl-edu-4",
    sector: "education",
    title: "Digital Literacy for Elders & Women",
    description:
      "Youth volunteers host monthly workshops teaching smartphone banking, UPI safety, and basic computer skills.",
    youthAndKidsRole: "Tech-literate youth run 1-on-1 UPI & e-governance clinics.",
    defaultTargetMetric: "Monthly Clinic",
  },
  {
    id: "obl-edu-5",
    sector: "education",
    title: "Neighborhood Book & Stationery Bank",
    description:
      "Maintain a community drop-box at a local library or community hall to recycle textbooks, uniforms, and school bags.",
    youthAndKidsRole: "School kids donate old books & organize the community shelf.",
    defaultTargetMetric: "Active Drop-Box",
  },

  // Pillar 3: Water & Sanitation (SDG 6)
  {
    id: "obl-wat-1",
    sector: "water",
    title: "100% Safe Drinking Water Access",
    description:
      "Conduct quarterly water-quality testing (TDS and contamination checks) at public taps, borewells, and school filters.",
    youthAndKidsRole: "Science students & youth test tap TDS using Field Test Kits.",
    defaultTargetMetric: "Quarterly Lab / FTK Test",
  },
  {
    id: "obl-wat-2",
    sector: "water",
    title: "Zero Open Defecation & Urination Spots",
    description:
      "Maintain clean, well-lit public toilets and eliminate open urination corners through community monitoring and beautification.",
    youthAndKidsRole: "Community murals & school sanitation awareness teams.",
    defaultTargetMetric: "Zero Open Spots",
  },
  {
    id: "obl-wat-3",
    sector: "water",
    title: "Rainwater Harvesting & Groundwater Recharge",
    description:
      "Build or revive at least one rainwater recharge pit per street, apartment complex, or public building.",
    youthAndKidsRole: "Youth civil/NSS teams audit roof-to-pit recharge connections.",
    defaultTargetMetric: "1 Pit / Street",
  },
  {
    id: "obl-wat-4",
    sector: "water",
    title: "Local Water Body Adoption",
    description:
      "Adopt nearby lakes, stepwells, or ponds for quarterly silt removal, weeding, and boundary protection.",
    youthAndKidsRole: "18+ youth squads lead lake clean-up & feeder channel drives.",
    defaultTargetMetric: "Quarterly Tank Audit",
  },
  {
    id: "obl-wat-5",
    sector: "water",
    title: "Greywater & Drain Maintenance",
    description:
      "Keep neighborhood storm drains free of plastic silt before the monsoon arrives.",
    youthAndKidsRole: "Kids flag household leaks; youth coordinate pre-monsoon desiltation.",
    defaultTargetMetric: "Pre-Monsoon Clearance",
  },

  // Pillar 4: Livelihood (SDG 8)
  {
    id: "obl-liv-1",
    sector: "livelihood",
    title: "Local Skill & Unemployment Registry",
    description:
      "Maintain an opt-in directory of unemployed youth and homemakers looking for vocational training or local jobs.",
    youthAndKidsRole: "Youth coordinators maintain ward skill & job-matching desk.",
    defaultTargetMetric: "Updated Monthly",
  },
  {
    id: "obl-liv-2",
    sector: "livelihood",
    title: "Active Women's Self-Help Groups (SHGs)",
    description:
      "Support local women in forming or strengthening SHGs for tailoring, food processing, handicrafts, or urban farming.",
    youthAndKidsRole: "College youth help SHGs design product catalogs & ONDC onboarding.",
    defaultTargetMetric: "All SHGs Market-Linked",
  },
  {
    id: "obl-liv-3",
    sector: "livelihood",
    title: "100% Government Scheme Saturation",
    description:
      "Run camps to ensure all eligible artisans, street vendors, and workers receive PM-SVANidhi, PM-Vishwakarma, Mudra loans, or e-Shram cards.",
    youthAndKidsRole: "Youth help residents verify documents & MeeSeva/PM portal forms.",
    defaultTargetMetric: "100% Eligible Enrolled",
  },
  {
    id: "obl-liv-4",
    sector: "livelihood",
    title: 'Hyper-Local Circular Economy ("Vocal for Local")',
    description:
      "Map and promote neighborhood carpenters, plumbers, tailors, farmers, and small vendors inside the app so residents hire locally first.",
    youthAndKidsRole: "Youth geo-tag artisans & enable UPI QR digital payments.",
    defaultTargetMetric: "Local Vendor Map",
  },
  {
    id: "obl-liv-5",
    sector: "livelihood",
    title: "Youth Apprenticeship & Mentorship",
    description:
      "Connect local business owners with young adults for 3-month paid or certified skill internships.",
    youthAndKidsRole: "Local workshops host youth trainees with mentor sign-off.",
    defaultTargetMetric: "3-Month Internships",
  },

  // Pillar 5: Environment (SDG 13)
  {
    id: "obl-env-1",
    sector: "environment",
    title: "Plastic-Free Streets & Markets",
    description:
      "Organize monthly plastic collection drives and convince local vegetable and grocery vendors to switch to cloth or paper bags.",
    youthAndKidsRole: "Youth lead weekend plastic drives & cloth-bag vendor pledges.",
    defaultTargetMetric: "Monthly Market Drive",
  },
  {
    id: "obl-env-2",
    sector: "environment",
    title: "Native Tree Plantation & 2-Year Survival Tracking",
    description:
      "Plant native trees on barren plots and assign geo-tagged ownership so every sapling is watered and tracked for 24 months.",
    youthAndKidsRole: 'Every child adopts 1 geo-tagged sapling ("My Tree Buddy").',
    defaultTargetMetric: "24-Month Survival Log",
  },
  {
    id: "obl-env-3",
    sector: "environment",
    title: "100% Household Waste Segregation",
    description:
      "Ensure households separate wet (kitchen) waste from dry (recyclable) waste before collection.",
    youthAndKidsRole: "Bal Mitra school ambassadors teach wet/dry bin sorting at home.",
    defaultTargetMetric: "100% Ward Segregation",
  },
  {
    id: "obl-env-4",
    sector: "environment",
    title: "Community Composting Pits",
    description:
      "Set up aerobic compost bins in parks or apartments to convert wet waste and dry leaves into organic manure.",
    youthAndKidsRole: "Youth eco-clubs manage leaf-compost turning & park soil reuse.",
    defaultTargetMetric: "Active Compost Units",
  },
  {
    id: "obl-env-5",
    sector: "environment",
    title: "Zero Waste Burning",
    description:
      "Enforce a strict neighborhood ban on burning dry leaves, plastic, or garbage.",
    youthAndKidsRole: "Resident & youth patrol flags burning hotspots for GP penalty/action.",
    defaultTargetMetric: "Zero Burning Incidents",
  },
];

export interface ComplaintCategoryOption {
  id: string;
  sector: CommunitySectorKey;
  label: string;
  defaultPathway: ResolutionPathwayType;
  requiresGovtBudget: boolean;
  suitableForNgo: boolean;
  suitableForYouth: boolean;
  suitableForChildrenSafe: boolean;
  govtOfficerRole: string;
  electedRepRole: string;
  schemeOrAct: string;
  slaDays: number;
  defaultNeeds: { item: string; qty: number; unit: string }[];
}

export interface EscalationTier {
  tier: string;
  authority: string;
  roleDetail: string;
  whenToContact: string;
  slaWindow: string;
  channel: string;
}

export interface PathwayScore {
  key: "govt" | "ngo" | "youth";
  label: string;
  suitabilityPct: number;
  roleSummary: string;
  recommended: boolean;
}

export interface ComplaintSolutionPlan {
  primaryPathway: ResolutionPathwayType;
  primaryHeadline: string;
  decisionSummary: string;
  pathwayScores: PathwayScore[];
  escalationTiers: EscalationTier[];
  officialPortals: { name: string; channel: string; purpose: string }[];
  ngoRecommendations: {
    name: string;
    focus: string;
    howTheyHelp: string;
    reach: string;
  }[];
  youthAndChildrenPlan: {
    childrenSafeRoles: string[];
    youthNssRoles: string[];
    safetyRule: string;
  };
  petitionSubject: string;
  petitionText: string;
}

export const COMPLAINT_CATEGORIES: ComplaintCategoryOption[] = [
  // HEALTH
  {
    id: "hea-drain",
    sector: "health",
    label: "Stagnant Water / Mosquito Breeding Hotspot / Overflowing Waste",
    defaultPathway: "govt_escalation",
    requiresGovtBudget: true,
    suitableForNgo: false,
    suitableForYouth: true,
    suitableForChildrenSafe: true,
    govtOfficerRole: "Sanitary Inspector / MPDO / Municipal Health Officer (MHO)",
    electedRepRole: "Ward Corporator / Gram Sarpanch & Sanitation Committee",
    schemeOrAct: "Swachh Bharat Mission & Telangana Panchayat Raj / Municipal Act",
    slaDays: 3,
    defaultNeeds: [
      { item: "Larvicide & Bleaching Supply", qty: 10, unit: "packs" },
      { item: "Drain Silt Clearance Crew", qty: 1, unit: "team" },
    ],
  },
  {
    id: "hea-phc",
    sector: "health",
    label: "Absent Staff at Local PHC / Shortage of Essential Medicines",
    defaultPathway: "govt_escalation",
    requiresGovtBudget: true,
    suitableForNgo: true,
    suitableForYouth: false,
    suitableForChildrenSafe: false,
    govtOfficerRole: "District Medical & Health Officer (DMHO) & PHC Medical Officer",
    electedRepRole: "Constituency MLA & District Hospital Development Committee",
    schemeOrAct: "National Health Mission (NHM) & Palle Dawakhana Charter",
    slaDays: 3,
    defaultNeeds: [
      { item: "Essential Drug Replenishment", qty: 1, unit: "indent" },
      { item: "NGO Preventive Screening Van", qty: 1, unit: "camp" },
    ],
  },
  {
    id: "hea-nutrition",
    sector: "health",
    label: "Malnourished Children / Unregistered Maternal Tracking Needing NGO/ICDS",
    defaultPathway: "hybrid",
    requiresGovtBudget: false,
    suitableForNgo: true,
    suitableForYouth: true,
    suitableForChildrenSafe: false,
    govtOfficerRole: "CDPO (ICDS) & District Welfare Officer (WCD)",
    electedRepRole: "Gram Sarpanch / Ward Corporator & Anganwadi Committee",
    schemeOrAct: "POSHAN Abhiyaan & ICDS Supplementary Nutrition",
    slaDays: 7,
    defaultNeeds: [
      { item: "Pediatric Nutrition Kits", qty: 20, unit: "kits" },
      { item: "Preventive Health Camp Volunteers", qty: 6, unit: "volunteers" },
    ],
  },

  // EDUCATION
  {
    id: "edu-infra",
    sector: "education",
    label: "Broken School Toilets / Roofs / Lack of School Drinking Water / Unsafe Gate",
    defaultPathway: "govt_escalation",
    requiresGovtBudget: true,
    suitableForNgo: true,
    suitableForYouth: false,
    suitableForChildrenSafe: false,
    govtOfficerRole: "Mandal Educational Officer (MEO) & District Educational Officer (DEO)",
    electedRepRole: "Constituency MLA (CDF Fund) & Gram Sarpanch / Municipal Corporator",
    schemeOrAct: "Mana Ooru - Mana Badi / Samagra Shiksha & RTE Infrastructure Norms",
    slaDays: 10,
    defaultNeeds: [
      { item: "Desk / Toilet / Tap Repair Kits", qty: 10, unit: "sets" },
      { item: "Engineering & Gate Safety Signboards", qty: 2, unit: "units" },
    ],
  },
  {
    id: "edu-dropout",
    sector: "education",
    label: "Out-of-School Children / Child Labor / Teacher Absenteeism",
    defaultPathway: "hybrid",
    requiresGovtBudget: true,
    suitableForNgo: true,
    suitableForYouth: true,
    suitableForChildrenSafe: true,
    govtOfficerRole: "MEO, DEO & District Child Protection Officer (DCPO)",
    electedRepRole: "Constituency MLA & School Management Committee (SMC)",
    schemeOrAct: "Right to Education (RTE) Act & Childline 1098",
    slaDays: 5,
    defaultNeeds: [
      { item: "School Enrollment Bridge Kits", qty: 15, unit: "kits" },
      { item: "Weekend Youth Tutors", qty: 4, unit: "volunteers" },
    ],
  },
  {
    id: "edu-library",
    sector: "education",
    label: "Weekend Remedial Tutoring, Digital Literacy or Book Bank Setup",
    defaultPathway: "youth_mobilization",
    requiresGovtBudget: false,
    suitableForNgo: true,
    suitableForYouth: true,
    suitableForChildrenSafe: true,
    govtOfficerRole: "School Headmaster & Panchayat Secretary (Library Room)",
    electedRepRole: "SMC Parent Lead & Ward Member / Corporator",
    schemeOrAct: "NIPUN Bharat & Community Reading Mission",
    slaDays: 7,
    defaultNeeds: [
      { item: "Recycled Textbooks & Storybooks", qty: 60, unit: "books" },
      { item: "Weekend 2-Hr Mentors", qty: 4, unit: "mentors" },
    ],
  },

  // WATER
  {
    id: "wat-pipe",
    sector: "water",
    label: "Contaminated Tap Water / Leaking Main Pipeline / Broken Handpump",
    defaultPathway: "govt_escalation",
    requiresGovtBudget: true,
    suitableForNgo: false,
    suitableForYouth: false,
    suitableForChildrenSafe: false,
    govtOfficerRole: "Assistant Engineer (RWS / Mission Bhagiratha) & Municipal Water Works",
    electedRepRole: "Ward Corporator / Sarpanch & Constituency MLA",
    schemeOrAct: "Jal Jeevan Mission / Mission Bhagiratha & BIS IS-10500",
    slaDays: 3,
    defaultNeeds: [
      { item: "HDPE Pipe Collar & Valve Repair", qty: 2, unit: "kits" },
      { item: "FTK Water Contamination Test Strips", qty: 10, unit: "tests" },
    ],
  },
  {
    id: "wat-sewage",
    sector: "water",
    label: "Overflowing Sewage Manhole / Illegal Sewage Dumping into Local Lake",
    defaultPathway: "govt_escalation",
    requiresGovtBudget: true,
    suitableForNgo: true,
    suitableForYouth: false,
    suitableForChildrenSafe: false,
    govtOfficerRole: "Municipal Engineer / Irrigation EE & TSPCB Regional Officer",
    electedRepRole: "Ward Corporator / Sarpanch, MLA & District Collector Prajavani",
    schemeOrAct: "Water (Prevention & Control of Pollution) Act & Mission Kakatiya",
    slaDays: 4,
    defaultNeeds: [
      { item: "Manhole Safety Cover & Jetting Unit", qty: 1, unit: "dispatch" },
    ],
  },
  {
    id: "wat-cheruvu",
    sector: "water",
    label: "Lake / Stepwell Siltation, Pre-Monsoon Drain Block or Recharge Pit Need",
    defaultPathway: "hybrid",
    requiresGovtBudget: false,
    suitableForNgo: true,
    suitableForYouth: true,
    suitableForChildrenSafe: true,
    govtOfficerRole: "Irrigation AE (Minor Irrigation) & MPDO (MGNREGS)",
    electedRepRole: "Gram Sabha / Water Users Association & MLA",
    schemeOrAct: "Mission Kakatiya & MGNREGS Water Conservation Works",
    slaDays: 14,
    defaultNeeds: [
      { item: "RWH Recharge Filter Rings & Gravel", qty: 6, unit: "sets" },
      { item: "Lake Clean-Up Shramdaan Gloves/Tools", qty: 20, unit: "sets" },
    ],
  },

  // LIVELIHOOD
  {
    id: "liv-welfare",
    sector: "livelihood",
    label: "Missing PM-SVANidhi / PM-Vishwakarma / Mudra / MGNREGS Documentation",
    defaultPathway: "govt_escalation",
    requiresGovtBudget: true,
    suitableForNgo: true,
    suitableForYouth: true,
    suitableForChildrenSafe: false,
    govtOfficerRole: "MPDO / SERP & MEPMA Project Officer & Lead Bank Manager",
    electedRepRole: "Ward Corporator / Sarpanch & Constituency MLA",
    schemeOrAct: "PM-SVANidhi, PM-Vishwakarma, Mudra & MGNREGA Guarantee",
    slaDays: 7,
    defaultNeeds: [
      { item: "Scheme Saturation Camp Desk Volunteers", qty: 3, unit: "volunteers" },
    ],
  },
  {
    id: "liv-shg",
    sector: "livelihood",
    label: "Women's SHGs Lacking Market Access / Youth Skill Training / Vending Zones",
    defaultPathway: "ngo_collab",
    requiresGovtBudget: false,
    suitableForNgo: true,
    suitableForYouth: true,
    suitableForChildrenSafe: false,
    govtOfficerRole: "SERP / MEPMA APM & District Industries Centre (DIC)",
    electedRepRole: "Village Organisation (VO) Lead & Municipal Vending Committee",
    schemeOrAct: "NRLM / Stree Nidhi & Street Vendors Livelihood Act",
    slaDays: 10,
    defaultNeeds: [
      { item: "Digital Profile & UPI Payment Onboarding", qty: 5, unit: "sessions" },
      { item: "SHG Packaging / Raw Material Kits", qty: 8, unit: "kits" },
    ],
  },

  // ENVIRONMENT
  {
    id: "env-waste",
    sector: "environment",
    label: "Illegal Garbage / Plastic Dumping Blackspot or Open Waste Burning",
    defaultPathway: "govt_escalation",
    requiresGovtBudget: true,
    suitableForNgo: true,
    suitableForYouth: true,
    suitableForChildrenSafe: true,
    govtOfficerRole: "Panchayat Secretary / Municipal Commissioner & TSPCB Regional Officer",
    electedRepRole: "Ward Corporator / Gram Sarpanch & Sanitation Committee",
    schemeOrAct: "Solid Waste Management Rules 2016 & Pattana/Palle Pragathi",
    slaDays: 4,
    defaultNeeds: [
      { item: "Wet/Dry Twin Dustbins & Composting Drum", qty: 6, unit: "units" },
      { item: "Cotton Gloves & Plastic Collection Bags", qty: 30, unit: "kits" },
    ],
  },
  {
    id: "env-plantation",
    sector: "environment",
    label: "Illegal Tree Felling or Barren Public Land Suitable for Native Plantation",
    defaultPathway: "youth_mobilization",
    requiresGovtBudget: false,
    suitableForNgo: true,
    suitableForYouth: true,
    suitableForChildrenSafe: true,
    govtOfficerRole: "Forest Range Officer (Telangana Haritha Haram) & Panchayat Nursery",
    electedRepRole: "School Eco-Club Teacher, Ward Member & Sarpanch",
    schemeOrAct: "WALTA Act (Tree Protection) & Haritha Haram",
    slaDays: 7,
    defaultNeeds: [
      { item: "Native Saplings (Neem / Jamun / Pongamia)", qty: 120, unit: "saplings" },
      { item: "Bamboo Tree Guards", qty: 60, unit: "guards" },
    ],
  },
];

export const NGO_PARTNER_DIRECTORY: {
  name: string;
  sectors: CommunitySectorKey[];
  focus: string;
  howTheyHelp: string;
  reach: string;
}[] = [
  {
    name: "Doctors For You / Rural Swachh Health Collective",
    sectors: ["health"],
    focus: "Quarterly Preventive Health Camps, Anemia Drives & Vector Control",
    howTheyHelp: "Deploys screening vans, BP/diabetes/eye kits, and trains youth CPR responders.",
    reach: "15 Clusters · Telangana",
  },
  {
    name: "Pratham Telangana & Deccan Education Chapter",
    sectors: ["education"],
    focus: "Remedial Reading Clubs, Zero Dropout Surveys & Book Banks",
    howTheyHelp: "Equips weekend volunteer tutors with TaRL toolkits and recycled book shelves.",
    reach: "24 Districts · Telangana",
  },
  {
    name: "Akshaya Patra / Naandi Rural School Support",
    sectors: ["education", "health"],
    focus: "School Infrastructure Audits, Washrooms & Child Nutrition",
    howTheyHelp: "Co-funds school drinking water filters, girls' toilets, and supplementary nutrition.",
    reach: "18 Mandals · Medak, Siddipet, Nalgonda",
  },
  {
    name: "Kakatiya Jala Samithi & Bala Vikasa Water Network",
    sectors: ["water", "environment"],
    focus: "Lake Restoration, RWH Recharge Pits & Quarterly FTK Water Testing",
    howTheyHelp: "Provides civil engineers for recharge pits, tank desiltation, and testing kits.",
    reach: "32 Mandals · Telangana",
  },
  {
    name: "Deccan Artisan & SERP FPO Support Collective",
    sectors: ["livelihood"],
    focus: "Women's SHG Market Linkage, Apprenticeship & PM Scheme Camps",
    howTheyHelp: "Onboards local artisans to ONDC/FPO buyers and sets up scheme enrollment camps.",
    reach: "14 Clusters · Kamareddy, Nizamabad, Warangal",
  },
  {
    name: "Telangana Green Youth & Haritha Eco Alliance",
    sectors: ["environment", "water"],
    focus: "Plastic-Free Markets, Composting Pits & 24-Month Sapling Survival",
    howTheyHelp: "Supplies native saplings, aerobic composters, and cloth bags for local markets.",
    reach: "27 Wards & Gram Panchayats",
  },
];

export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function analyzeComplaintSolution(params: {
  sector: CommunitySectorKey;
  categoryId?: string;
  title: string;
  description: string;
  severity: "Critical" | "High" | "Moderate";
  affectedPeople: number;
  settlementType: SettlementType;
  villageName: string;
  mandalName: string;
  districtName: string;
  villageCode?: string;
  institutionName: string;
  gpsLabel: string;
  reporterName: string;
}): ComplaintSolutionPlan {
  const category =
    COMPLAINT_CATEGORIES.find((c) => c.id === params.categoryId) ??
    COMPLAINT_CATEGORIES.find((c) => c.sector === params.sector) ??
    COMPLAINT_CATEGORIES[0];

  const text = `${params.title} ${params.description}`.toLowerCase();

  let govtScore = category.requiresGovtBudget ? 88 : 42;
  let ngoScore = category.suitableForNgo ? 68 : 28;
  let youthScore = category.suitableForYouth ? 64 : 22;

  if (params.severity === "Critical") govtScore = Math.min(98, govtScore + 10);
  if (params.affectedPeople >= 100) {
    govtScore = Math.min(98, govtScore + 8);
    ngoScore = Math.min(92, ngoScore + 6);
  }
  if (
    /mla|corporator|officer|road|drain|sewage|pipe|leak|building|roof|doctor|medicine|pension|wage|contaminated|burning/.test(
      text
    )
  ) {
    govtScore = Math.min(98, govtScore + 12);
  }
  if (/ngo|csr|kit|camp|funding|grant|shg|artisan|screen|equipment|solar/.test(text)) {
    ngoScore = Math.min(95, ngoScore + 15);
  }
  if (
    /student|child|kid|youth|nss|rally|plant|tree|sapling|library|tuition|teach|clean|poster|compost|plastic/.test(
      text
    )
  ) {
    youthScore = Math.min(96, youthScore + 22);
  }

  let primaryPathway: ResolutionPathwayType = category.defaultPathway;
  if (govtScore >= 82 && ngoScore >= 72) {
    primaryPathway = params.severity === "Critical" ? "govt_escalation" : "hybrid";
  } else if (govtScore >= 78) {
    primaryPathway = "govt_escalation";
  } else if (youthScore >= 80 && !category.requiresGovtBudget) {
    primaryPathway = "youth_mobilization";
  } else if (ngoScore >= 75 && !category.requiresGovtBudget) {
    primaryPathway = "ngo_collab";
  } else {
    primaryPathway = "hybrid";
  }

  const isUrban = params.settlementType === "Municipal Ward / Town";
  const localBodyTitle = isUrban
    ? `Municipal Ward Officer & Ward Corporator (${params.villageName})`
    : `Gram Panchayat Secretary & Sarpanch (${params.villageName} GP)`;
  const mlaTitle = `Constituency MLA Grievance Office (${params.mandalName} / ${params.districtName})`;

  let primaryHeadline = "";
  let decisionSummary = "";

  if (primaryPathway === "govt_escalation") {
    primaryHeadline = `Escalate to ${category.govtOfficerRole.split("&")[0].trim()} & ${
      isUrban ? "Ward Corporator / MLA" : "Gram Sarpanch / MLA"
    }`;
    decisionSummary = `Because "${category.label}" involves ${
      params.severity.toLowerCase()
    } public infrastructure, health hazard, or statutory budget sanction affecting ~${
      params.affectedPeople
    } residents, file the official representation with ${
      category.govtOfficerRole
    } under ${category.schemeOrAct} (${category.slaDays}-day SLA), and copy your Constituency MLA / ${
      isUrban ? "Corporator" : "Sarpanch"
    }.`;
  } else if (primaryPathway === "ngo_collab") {
    primaryHeadline = "Collaborate with Sector NGO Partner + Local Authority Intimation";
    decisionSummary = `This blocker can be resolved fastest through specialized NGO programs, market linkages, or screening camps without waiting for multi-month municipal tenders—while keeping ${localBodyTitle} informed.`;
  } else if (primaryPathway === "youth_mobilization") {
    primaryHeadline = "Mobilize Youth Volunteers (18+) & Supervised School Eco/Reading Clubs";
    decisionSummary = `Trained youth volunteers and parent/teacher-consented school squads can launch action this weekend while updating the community obligation status.`;
  } else {
    primaryHeadline = "Hybrid Action: Govt Officer / MLA Sanction + NGO & Youth Support";
    decisionSummary = `Dual-track execution: escalate structural/budget duties to ${category.govtOfficerRole} & ${mlaTitle}, while partnering with NGOs and youth volunteers for immediate interim relief for ~${params.affectedPeople} residents.`;
  }

  const escalationTiers: EscalationTier[] = [
    {
      tier: "Tier 1 · Immediate Local Office",
      authority: localBodyTitle,
      roleDetail: category.govtOfficerRole,
      whenToContact: `First escalation point for field inspection and entry into the ${
        isUrban ? "Municipal Ward Grievance Register" : "Gram Panchayat Register"
      }.`,
      slaWindow: `Within ${Math.min(4, category.slaDays)} Days`,
      channel: isUrban
        ? "Municipal Ward Office / Dial 1902"
        : "Gram Panchayat Bhavan / MPDO Office",
    },
    {
      tier: "Tier 2 · District Sectoral & Collectorate",
      authority: `District Collectorate (Prajavani) & Sector Head — ${params.districtName}`,
      roleDetail: `MPDO (${params.mandalName}) · ${category.govtOfficerRole}`,
      whenToContact:
        "If Tier-1 does not act within SLA or departmental engineering/budget sanction is required.",
      slaWindow: `Within ${category.slaDays} Days`,
      channel: "Monday Prajavani Cell / prajavani.telangana.gov.in",
    },
    {
      tier: "Tier 3 · Elected Representative Escalation",
      authority: isUrban
        ? `Ward Corporator / Municipal Chairperson & ${mlaTitle}`
        : `Gram Sarpanch, ZPTC & ${mlaTitle}`,
      roleDetail: "Constituency Development Funds (CDF) & Departmental Accountability",
      whenToContact:
        "When major capital works (pipelines, school blocks, drains, PHC staffing) need priority sanction.",
      slaWindow: "7–21 Days",
      channel: "MLA Camp Office / Co-Signed Resident Petition",
    },
  ];

  const officialPortals = [
    {
      name: "Telangana Prajavani",
      channel: "prajavani.telangana.gov.in",
      purpose: "State grievance tracker with District Collector oversight",
    },
    {
      name: "CPGRAMS (Central Portal)",
      channel: "pgportal.gov.in",
      purpose: "Escalates Central/State schemes (Samagra Shiksha, JJM, NHM, MGNREGS)",
    },
    ...(params.sector === "water"
      ? [
          {
            name: "Mission Bhagiratha / RWS",
            channel: "1800-425-7470 · Dial 1902",
            purpose: "Pipeline bursts, contaminated tap water & tank supply",
          },
        ]
      : params.sector === "health"
      ? [
          {
            name: "Health & Civic Helpline",
            channel: "Dial 104 · Dial 1902",
            purpose: "PHC stockouts, vector spraying & drainage blocks",
          },
        ]
      : params.sector === "education"
      ? [
          {
            name: "Childline & RTE Desk",
            channel: "Dial 1098 · DEO Office",
            purpose: "Dropout rescue, school safety & RTE compliance",
          },
        ]
      : [
          {
            name: "Panchayat / Municipal Helpline",
            channel: "Dial 1902 · e-Panchayat",
            purpose: "Sanitation, waste burning & local scheme grievances",
          },
        ]),
  ];

  const ngoRecommendations = NGO_PARTNER_DIRECTORY.filter((n) =>
    n.sectors.includes(params.sector)
  ).map((n) => ({
    name: n.name,
    focus: n.focus,
    howTheyHelp: n.howTheyHelp,
    reach: n.reach,
  }));

  const pillarMeta = PILLAR_META[params.sector];
  const childrenSafeRoles = category.suitableForChildrenSafe
    ? [
        pillarMeta.youthKidsRoleSummary,
        `Supervised student activity near ${params.institutionName} (ages 10–16, written parent/teacher consent required; zero hazardous drain/road/electrical work).`,
      ]
    : [
        "Direct site work is NOT suitable for children due to safety or infrastructure hazards. Students only participate via safe school awareness posters or classroom book drives.",
      ];

  const youthNssRoles = category.suitableForYouth
    ? [
        `College & Youth Brigade (18+ NSS): Conduct geo-tagged verification across ~${params.affectedPeople} affected residents, organize weekend action drives, and co-sign the petition.`,
        pillarMeta.youthKidsRoleSummary,
      ]
    : [
        "College Youth Monitors (18+): Gather co-signers, verify Prajavani Ticket status, and capture Before/After photographic evidence once officers resolve the site.",
      ];

  const todayStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const petitionSubject = `Citizen Representation: ${params.title || category.label} at ${
    params.institutionName
  }, ${params.villageName} (${params.mandalName} Mandal, ${params.districtName})`;

  const petitionText = `To,
1. ${category.govtOfficerRole}
2. ${isUrban ? "The Ward Corporator / Municipal Commissioner" : "The Gram Sarpanch & MPDO"}, ${params.mandalName}
3. The Hon'ble Member of Legislative Assembly (MLA) / District Collector, ${params.districtName}

Date: ${todayStr}
Subject: ${petitionSubject}

Respected Sir / Madam,

On behalf of the residents of ${params.villageName}${
    params.villageCode ? ` (Village Code: ${params.villageCode})` : ""
  }, ${params.mandalName} Mandal, ${params.districtName} District, I wish to report an urgent ${
    params.severity.toLowerCase()
  }-priority ${pillarMeta.title} blocker preventing achievement of our community milestone:

• Blocker Reported: ${params.title || category.label}
• SDG Pillar & Framework: ${pillarMeta.title} (${pillarMeta.sdg}) — ${category.schemeOrAct}
• Exact Location / Asset: ${params.institutionName}
• Verified GPS Coordinates: ${params.gpsLabel}
• Residents Impacted: ~${params.affectedPeople}
• Ground Evidence: ${
    params.description ||
    "Geo-tagged photographic evidence and resident verification logged on the Jan-Drishti Viksit Bharat 2047 portal."
  }

Requested Action:
We respectfully request an on-site inspection within ${Math.min(
    4,
    category.slaDays
  )} days and full resolution under ${category.schemeOrAct} within ${
    category.slaDays
  } days. Kindly issue an official Prajavani / Departmental Ticket Reference so residents can track completion.

Yours faithfully,
${params.reporterName || "Concerned Resident"}
${params.villageName}, ${params.mandalName}, ${params.districtName}`;

  return {
    primaryPathway,
    primaryHeadline,
    decisionSummary,
    pathwayScores: [
      {
        key: "govt",
        label: "Govt Officer / MLA / Corporator",
        suitabilityPct: govtScore,
        roleSummary: `${category.govtOfficerRole.split("&")[0].trim()} & ${
          isUrban ? "Corporator / MLA" : "Sarpanch / MLA"
        }`,
        recommended: govtScore >= 70,
      },
      {
        key: "ngo",
        label: "NGO & CSR Collaboration",
        suitabilityPct: ngoScore,
        roleSummary: ngoRecommendations[0]?.name ?? "Sector NGO Partner",
        recommended: ngoScore >= 65,
      },
      {
        key: "youth",
        label: "Youth & Kids Mobilization",
        suitabilityPct: youthScore,
        roleSummary: category.suitableForChildrenSafe
          ? "NSS Youth + Supervised Kids Squad"
          : "18+ NSS Audit & Resident Co-Sign",
        recommended: youthScore >= 65,
      },
    ],
    escalationTiers,
    officialPortals,
    ngoRecommendations,
    youthAndChildrenPlan: {
      childrenSafeRoles,
      youthNssRoles,
      safetyRule:
        "Youth & Kids Safety Rule: Minors (<17) only join parent/teacher-consented daytime roles (My Tree Buddy, Home Mosquito Patrols, Book Drives) — never hazardous drains, construction, or roadways.",
    },
    petitionSubject,
    petitionText,
  };
}

export interface CivicLearningModule {
  id: string;
  code: string;
  title: string;
  ageGroup: string;
  duration: string;
  sector: CommunitySectorKey;
  objective: string;
  fieldTask: string;
  discussionPrompt: string;
  suggestedBadge: string;
}

export const CIVIC_LEARNING_CURRICULUM: CivicLearningModule[] = [
  {
    id: "learn-budget-01",
    code: "Module 01",
    title: "Know Your Local Body & Ward / Panchayat Budget",
    ageGroup: "Classes 7–10 & Youth",
    duration: "45 min field exercise",
    sector: "livelihood",
    objective:
      "Understand the difference between Gram Panchayat / Municipal Ward funds, MLA Constituency Development Funds (CDF), and State schemes — and how citizens submit a My Village / Ward, My Budget proposal.",
    fieldTask:
      "Inspect the local notice board at the Gram Panchayat Bhavan or Ward Office, list the top 2 infrastructure needs on your street, and cast a priority vote in Tab 1.",
    discussionPrompt: "Which single ₹2–5 Lakh local investment benefits the largest number of households on your street?",
    suggestedBadge: "Civic Budget Scholar",
  },
  {
    id: "learn-health-02",
    code: "Module 02",
    title: "Neighborhood Sanitation & Mosquito Source Audit",
    ageGroup: "Classes 6–9 (Parent/Teacher Consented)",
    duration: "30 min safe home & school check",
    sector: "health",
    objective:
      "Learn how vector-borne diseases start in stagnant household containers and why open storm-drain siltation requires timely Municipal Sanitary Officer / Panchayat intervention.",
    fieldTask:
      "Complete a safe daytime Home Mosquito Patrol checklist (flowerpots, desert coolers, roof tyres) and verify whether public drains are marked on Tab 2.",
    discussionPrompt: "What prevents stagnation in your lane without touching hazardous sewage?",
    suggestedBadge: "Home Mosquito Patrol",
  },
  {
    id: "learn-water-03",
    code: "Module 03",
    title: "Water Security, FTK Testing & Lake Stewardship",
    ageGroup: "Classes 8–12 & College NSS",
    duration: "60 min lab + bund walk",
    sector: "water",
    objective:
      "Learn how Telangana Mission Bhagiratha treated tap supply works alongside traditional Kakatiya chain-tanks and rainwater recharge pits.",
    fieldTask:
      "Record one leaking public standpost or silt-blocked recharge pit with GPS proof in Tab 2, or test tap TDS using a Field Test Kit with your science teacher.",
    discussionPrompt: "How many liters of clean water can be saved monthly by fixing one dripping public tap?",
    suggestedBadge: "Water Guardian",
  },
  {
    id: "learn-sabha-04",
    code: "Module 04",
    title: "Presenting a Citizen Petition at Area Sabha / Gram Sabha",
    ageGroup: "Youth 16+ & Student Councils",
    duration: "45 min mock & real Sabha",
    sector: "education",
    objective:
      "Learn how Area Sabhas (under Telangana Municipalities Act) and Gram Sabhas (under Telangana Panchayat Raj Act) hold officers and elected Corporators/Sarpanchs accountable.",
    fieldTask:
      "Draft an evidence-backed agenda item (with co-signers and GPS proof) and submit it to the upcoming Area Sabha / Gram Sabha docket in Tab 1.",
    discussionPrompt: "Why does a documented Prajavani ticket + Area Sabha resolution move files faster than verbal complaints?",
    suggestedBadge: "Sabha Advocate",
  },
];

export const AREA_SABHA_GUIDE_STEPS: {
  step: string;
  title: string;
  detail: string;
}[] = [
  {
    step: "Step 01",
    title: "Diagnose & Vote Together (Participatory Budgeting)",
    detail:
      "Citizens pool neighborhood needs into quantified budget demands and vote on top priorities instead of fragmented individual demands.",
  },
  {
    step: "Step 02",
    title: "Geo-Tag Blocker Evidence & Route the Solution",
    detail:
      "Use live camera + GPS evidence on Civic Tech. Structural works go to Govt Officers / Corporator / MLA; camps & kits go to NGOs; upkeep goes to Youth Drives.",
  },
  {
    step: "Step 03",
    title: "Table Formal Agenda at Area Sabha / Gram Sabha",
    detail:
      "Top voted budget items and unresolved SLA tickets are tabled in statutory Ward Committee / Gram Sabha minutes requiring official engineer & Corporator sign-off.",
  },
  {
    step: "Step 04",
    title: "Verify Closure Before/After & Sustain via Civic Learning",
    detail:
      "No ticket closes until residents upload verified After-photos. Schools and youth labs sustain behavior change across generations.",
  },
];

