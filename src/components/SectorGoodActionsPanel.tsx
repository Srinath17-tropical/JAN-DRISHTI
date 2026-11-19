import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { SDG_SECTOR_ASSETS, type SdgSectorId } from "./SdgVisualAssets";
import type { SectorInsightsVillage } from "./SectorActionModules";

export type StakeholderGroup =
  | "all"
  | "Children"
  | "Women"
  | "Senior Citizens"
  | "Youth & Students"
  | "Working Adults & Farmers"
  | "Gram Panchayat & All Residents";

const STAKEHOLDER_FILTERS: { key: StakeholderGroup; label: string }[] = [
  { key: "all", label: "All Stakeholders" },
  { key: "Children", label: "Children" },
  { key: "Women", label: "Women" },
  { key: "Senior Citizens", label: "Senior Citizens" },
  { key: "Youth & Students", label: "Youth & Students" },
  { key: "Working Adults & Farmers", label: "Working Adults & Farmers" },
  { key: "Gram Panchayat & All Residents", label: "Gram Panchayat & Remaining" },
];

type SectorGoodAction = {
  id: string;
  title: string;
  summary: string;
  stakeholders: Exclude<StakeholderGroup, "all">[];
  obligation: string;
  cadence: string;
};

type SectorCharterMeta = {
  sectorTitle: string;
  subtitle: string;
  accentHex: string;
  accentSoft: string;
  obligationsByRole: {
    group: string;
    obligation: string;
  }[];
  actions: SectorGoodAction[];
};

const SECTOR_GOOD_ACTIONS: Record<SdgSectorId, SectorCharterMeta> = {
  environment: {
    sectorTitle: "Environment & Climate Action Charter",
    subtitle:
      "Everyday ecological stewardship pairing children, women, senior citizens, farmers, and civic bodies to restore canopy, biodiversity, and clean air.",
    accentHex: "#10b981",
    accentSoft: "rgba(16, 185, 129, 0.16)",
    obligationsByRole: [
      {
        group: "Children",
        obligation: "Adopt 1 school sapling, join weekend bird-spotting walks, and keep campuses plastic-free.",
      },
      {
        group: "Women",
        obligation: "Lead household kitchen-herb plots, clean-cooking transitions, and SHG cloth-bag drives.",
      },
      {
        group: "Senior Citizens",
        obligation: "Guide intergenerational bird & heritage-tree walks and share native seed knowledge.",
      },
      {
        group: "Working Adults, Farmers & Remaining",
        obligation: "Avoid crop-stubble burning, install avenue tree guards, and separate wet/e-waste at markets.",
      },
    ],
    actions: [
      {
        id: "env-trees",
        title: "Native & Fruit-Tree Plantations (Vanamahotsavam Drives)",
        summary:
          "Plant neem, tamarind, jamun, mango, and banyan saplings along school perimeters, waterbody bunds, and village lanes with family caretaking tags.",
        stakeholders: ["Children", "Senior Citizens", "Gram Panchayat & All Residents"],
        obligation: "Each participating household waters 2 tagged saplings twice weekly for the first 18 months.",
        cadence: "Seasonal + Weekly Care",
      },
      {
        id: "env-birds",
        title: "Local Area Bird-Watching & Checklist Walks",
        summary:
          "Sunrise weekend nature walks around village groves, wetlands, and lakes pairing kids and senior citizens with field guides and binoculars.",
        stakeholders: ["Children", "Senior Citizens", "Youth & Students"],
        obligation: "Record sightings in a shared seasonal bird diary without disturbing nesting zones.",
        cadence: "Every Sunday Morning",
      },
      {
        id: "env-miyawaki",
        title: "Miyawaki Mini-Forests on Barren Corners",
        summary:
          "Transform unused 100–300 sq. mtr panchayat plots into dense multi-layer native groves that drop local ambient heat by 2–4 °C.",
        stakeholders: ["Youth & Students", "Gram Panchayat & All Residents"],
        obligation: "Panchayat allocates waste parcel & fencing; youth volunteers handle soil mulching.",
        cadence: "Annual Drive",
      },
      {
        id: "env-butterfly",
        title: "School & Anganwadi Butterfly Pollinator Gardens",
        summary:
          "Plant marigold, tulsi, curry leaf, and milkweed beds inside campuses to revive bees, butterflies, and kitchen herbs.",
        stakeholders: ["Children", "Women"],
        obligation: "Zero chemical pesticide spraying inside or within 20 meters of campus beds.",
        cadence: "Daily School Care",
      },
      {
        id: "env-seedballs",
        title: "Summer Seed-Ball Campaigns",
        summary:
          "Children and elders roll clay-compost seed balls before May and scatter them across fallow hillocks and common grazing lands prior to rains.",
        stakeholders: ["Children", "Senior Citizens", "Women"],
        obligation: "Use only verified local native tree and grass seeds to prevent invasive weeds.",
        cadence: "Pre-Monsoon",
      },
      {
        id: "env-plastic",
        title: "Zero-Plastic Weekly Haat & Shandy Days",
        summary:
          "Replace single-use carry bags at village weekly markets with stitched cloth and jute bags produced by local women collectives.",
        stakeholders: ["Women", "Working Adults & Farmers", "Gram Panchayat & All Residents"],
        obligation: "Market vendors refuse sub-120 micron bags; shoppers carry reusable cloth totes.",
        cadence: "Every Market Day",
      },
      {
        id: "env-compost",
        title: "Neighborhood Wet-Waste & Vermicompost Pits",
        summary:
          "Convert organic kitchen scraps, market greens, and livestock litter into nutrient-rich compost sold affordably to home gardens.",
        stakeholders: ["Women", "Working Adults & Farmers"],
        obligation: "Households segregate dry recyclables from wet kitchen compostables at source.",
        cadence: "Daily",
      },
      {
        id: "env-coolroof",
        title: "Heatwave Cool White-Roof Coating Drives",
        summary:
          "Apply reflective solar-white lime coating onto anganwadi, school, and tin-roofed homes before April to reduce indoor summer temperatures.",
        stakeholders: ["Youth & Students", "Women", "Senior Citizens"],
        obligation: "Prioritize elderly, infant, and outdoor worker households before peak May heat.",
        cadence: "Pre-Summer",
      },
      {
        id: "env-mulching",
        title: "Zero Residue Burning & Soil Mulching Pledge",
        summary:
          "Share tractor-mounted shredders and bio-decomposers so crop stalks enrich topsoil humus instead of creating seasonal smoke haze.",
        stakeholders: ["Working Adults & Farmers", "Gram Panchayat & All Residents"],
        obligation: "Commit zero open-field burning; use PACS shared mulcher calendar.",
        cadence: "Post-Harvest",
      },
      {
        id: "env-sacred",
        title: "Heritage Tree & Sacred Grove Mapping",
        summary:
          "Document century-old peepal, banyan, and temple groves with QR plaques detailing biodiversity age, bird species, and local stories.",
        stakeholders: ["Senior Citizens", "Children", "Youth & Students"],
        obligation: "Prohibit concrete paving right up to heritage tree trunks; keep 2m permeable soil rings.",
        cadence: "Quarterly Audit",
      },
      {
        id: "env-ewaste",
        title: "E-Waste, Bulb & Used Battery Drop Boxes",
        summary:
          "Safe weatherproof collection bins at panchayat offices and high schools preventing heavy metals from entering agricultural soil.",
        stakeholders: ["Youth & Students", "Working Adults & Farmers", "Gram Panchayat & All Residents"],
        obligation: "Never burn bulbs or dump dead batteries in open drains; dispatch quarterly to authorized recyclers.",
        cadence: "Monthly Collection",
      },
      {
        id: "env-cooking",
        title: "Clean-Cooking & Smoke-Free Home Transition",
        summary:
          "Peer demonstrations pairing LPG refill subsidies and induction/clean-pellet stoves to eliminate indoor PM2.5 exposure.",
        stakeholders: ["Women", "Children", "Senior Citizens"],
        obligation: "Ensure kitchen ventilation louvers stay clear and assist eligible families with subsidy e-KYC.",
        cadence: "Monthly Demo",
      },
      {
        id: "env-quiet",
        title: "Quiet Dawn Hours & Wildlife-Safe Lighting",
        summary:
          "Downward-shielded warm LEDs and vehicle-horn restraint near schools, hospitals, and roosting groves between 5–8 AM and after 9 PM.",
        stakeholders: ["Senior Citizens", "Children", "Gram Panchayat & All Residents"],
        obligation: "Observe low-noise zones near care centers and wetland edges.",
        cadence: "Daily Civic Norm",
      },
    ],
  },
  health: {
    sectorTitle: "Health & Preventive Well-Being Charter",
    subtitle:
      "Practical neighborhood habits protecting children, working adults, mothers, and seniors—from quitting ultra-processed junk food to rapid emergency readiness.",
    accentHex: "#4C9F38",
    accentSoft: "rgba(76, 159, 56, 0.16)",
    obligationsByRole: [
      {
        group: "Children",
        obligation: "Join no-junk school tiffin challenges, practice 6-step handwashing, and spend 1 hour in outdoor play.",
      },
      {
        group: "Women",
        obligation: "Track maternal iron/haemoglobin checkups, lead millet recipe circles, and promote smoke-free kitchens.",
      },
      {
        group: "Senior Citizens",
        obligation: "Attend dawn mobility walks, monthly BP/sugar checks, and evening social companionship circles.",
      },
      {
        group: "Working Adults & Remaining",
        obligation: "Eliminate sugary drinks/tobacco at worksites, eliminate mosquito breeding pots Sunday mornings, and learn 108/CPR steps.",
      },
    ],
    actions: [
      {
        id: "hlth-junk",
        title: "Stop-Junk-Food & Hidden-Sugar Awareness Camps",
        summary:
          "Interactive visual booths for kids and working people displaying exact spoonfuls of sugar, salt, and trans-fat inside packaged chips, noodles, and colas.",
        stakeholders: ["Children", "Working Adults & Farmers", "Youth & Students"],
        obligation: "Enforce 100m junk-free healthy snack zones outside school gates and replace office tea snacks with roasted pulses.",
        cadence: "Bi-Weekly Camps",
      },
      {
        id: "hlth-millet",
        title: "Sunday Millet & Traditional Breakfast Fairs",
        summary:
          "Community tastings of ragi malt, jowar rotis, sprouted moong, and seasonal greens prepared hygienically by local women groups.",
        stakeholders: ["Women", "Children", "Senior Citizens"],
        obligation: "Families swap at least 3 refined-flour breakfasts/week for whole millets & seasonal fruit.",
        cadence: "Every Sunday",
      },
      {
        id: "hlth-yoga",
        title: "Dawn Walking, Stretching & Pranayama Circles",
        summary:
          "Open-air 30-minute guided mobility and breathing sessions in school grounds or parks tailored for joint health and stress relief.",
        stakeholders: ["Senior Citizens", "Working Adults & Farmers", "Women"],
        obligation: "Keep public park loops clean, level, and vehicle-free between 5:30 AM and 7:30 AM.",
        cadence: "Daily 6:00 AM",
      },
      {
        id: "hlth-screening",
        title: "Monthly BP, Diabetes & Anaemia Screening",
        summary:
          "PHC & ASHA doorstep checks every first Sunday catching silent hypertension, high blood sugar, and iron deficiency early.",
        stakeholders: ["Senior Citizens", "Women", "Working Adults & Farmers"],
        obligation: "Every resident aged 30+ and adolescent girl completes one quarterly screening entry.",
        cadence: "1st Sunday Monthly",
      },
      {
        id: "hlth-hygiene",
        title: "School Handwash, Dental & Vision Festivals",
        summary:
          "Fun visual soap-hygiene drills paired with early vision screening so schoolchildren never fall behind due to undiagnosed eyesight gaps.",
        stakeholders: ["Children", "Youth & Students"],
        obligation: "Schools maintain functional soap & clean water stations outside every classroom and lunch shed.",
        cadence: "Quarterly Camp",
      },
      {
        id: "hlth-adulteration",
        title: "Kitchen Purity & Safe Milk/Oil Demo Drives",
        summary:
          "Simple home tests empowering families to check cooking oil, milk, turmeric, and spices for harmful dyes or starch adulterants.",
        stakeholders: ["Women", "Working Adults & Farmers"],
        obligation: "Report unsafe bulk food vendors to Mandal Food Safety inspectors via civic helpline.",
        cadence: "Monthly Workshop",
      },
      {
        id: "hlth-dryday",
        title: "Sunday 15-Minute Dengue & Malaria Dry Day",
        summary:
          "Synchronized neighborhood sweeps draining stagnant water from desert coolers, spare tires, coconut shells, and flower trays.",
        stakeholders: ["Gram Panchayat & All Residents", "Children", "Women"],
        obligation: "Every household inspects and scrubs rooftop tanks & outdoor containers every Sunday at 8 AM.",
        cadence: "Weekly Monsoon Check",
      },
      {
        id: "hlth-firstaid",
        title: "Community First-Aid, Snakebite & CPR Squads",
        summary:
          "Hands-on emergency training equipping 10 youth and farmers per hamlet in CPR, heatstroke ice-packs, and 108 ambulance stabilization.",
        stakeholders: ["Youth & Students", "Working Adults & Farmers", "Gram Panchayat & All Residents"],
        obligation: "Keep a stocked trauma first-aid box & laminated 108 protocol at every Gram Panchayat and school.",
        cadence: "Half-Yearly Drills",
      },
      {
        id: "hlth-maternal",
        title: "1,000-Day Maternal & Infant Nutrition Circles",
        summary:
          "Practical iron-folic, drumstick-leaf, egg, and safe complementary-feeding demonstrations at Anganwadis for expectant mothers.",
        stakeholders: ["Women", "Children"],
        obligation: "Ensure timely antenatal registration and 100% safe institutional delivery planning.",
        cadence: "Weekly Anganwadi Meet",
      },
      {
        id: "hlth-elders",
        title: "Senior Companionship, Cataract & Hearing Clinics",
        summary:
          "Evening intergenerational reading/tea corners easing elder isolation alongside doorstep spectacle and hearing-aid camps.",
        stakeholders: ["Senior Citizens", "Youth & Students"],
        obligation: "Youth volunteers visit housebound seniors weekly to check medication refills and hydration.",
        cadence: "Weekly Check-In",
      },
      {
        id: "hlth-tobacco",
        title: "Tobacco-Free Workplaces & Youth Sports Leagues",
        summary:
          "Peer sports clubs and clear health-pledge walls keeping teenagers and daily workers away from gutkha, smoking, and energy drinks.",
        stakeholders: ["Youth & Students", "Working Adults & Farmers"],
        obligation: "Enforce 100-yard tobacco-sale ban around all schools and public clinics.",
        cadence: "Year-Round Drive",
      },
      {
        id: "hlth-ergo",
        title: "Safe Lifting, Posture & Hydration for Workers",
        summary:
          "Electrolyte break guidelines, shaded rest tents, and protective gloves/boots awareness for agricultural laborers and artisans.",
        stakeholders: ["Working Adults & Farmers", "Women"],
        obligation: "Reschedule heavy outdoor labor before 11 AM and after 4 PM during heat alerts.",
        cadence: "Seasonal Advisory",
      },
      {
        id: "hlth-sleep",
        title: "Screen-Balance & Phone-Free Family Dinners",
        summary:
          "Simple family challenges switching off phones 45 minutes before sleep and prioritizing outdoor sunset games for children.",
        stakeholders: ["Children", "Youth & Students", "Working Adults & Farmers"],
        obligation: "Parents model phone-free dinner hours and ensure children get 8–9 hours of restful sleep.",
        cadence: "Daily Family Habit",
      },
    ],
  },
  water: {
    sectorTitle: "Water Security & All-Waterbody Stewardship",
    subtitle:
      "Community protection across EVERY local waterbody—lakes, village ponds (kuntas), tanks, checkdams, feeder canals, streams (nalas), stepwells, open wells, and wetlands.",
    accentHex: "#26BDE2",
    accentSoft: "rgba(38, 189, 226, 0.16)",
    obligationsByRole: [
      {
        group: "Children",
        obligation: "Spot and report leaking standposts, protect school water coolers, and join waterbody walks.",
      },
      {
        group: "Women",
        obligation: "Manage household kitchen-garden greywater reuse and monitor clean tap pressure & tariff fairness.",
      },
      {
        group: "Senior Citizens",
        obligation: "Guide community mapping of historic feeder channels, stepwells, and seasonal flood paths.",
      },
      {
        group: "Farmers, Youth & Remaining",
        obligation: "Adopt drip irrigation, keep plastic/chemicals out of all lakes & streams, and log monthly well water levels.",
      },
    ],
    actions: [
      {
        id: "wat-allbodies",
        title: "All-Waterbody Desilting & Feeder Channel Clearing",
        summary:
          "Pre-monsoon community shramdaan clearing invasive weeds and silt across local ponds (kuntas), lakes, tanks, streams (nalas), checkdams, and feeder canals—returning fertile silt to farms.",
        stakeholders: ["Working Adults & Farmers", "Gram Panchayat & All Residents", "Youth & Students"],
        obligation: "Keep natural inflow feeder channels 100% free of encroachments and garbage dumping year-round.",
        cadence: "Pre-Monsoon Shramdaan",
      },
      {
        id: "wat-rwh",
        title: "School & Household Rooftop Rainwater Harvesting",
        summary:
          "Route roof rainwater through clean sand-charcoal-gravel filters straight into campus recharge pits or underground storage sumps.",
        stakeholders: ["Children", "Youth & Students", "Gram Panchayat & All Residents"],
        obligation: "Clean roof gutters and first-flush diverters every May prior to arrival of monsoon showers.",
        cadence: "Annual Maintenance",
      },
      {
        id: "wat-greywater",
        title: "Kitchen-Garden Greywater Soak Pits",
        summary:
          "Channel household bath and wash water into banana, papaya, and drumstick soak beds—eliminating street puddles while growing nutrition.",
        stakeholders: ["Women", "Working Adults & Farmers"],
        obligation: "Never discharge untreated septic or detergent sludge directly into neighborhood streams or ponds.",
        cadence: "Daily Household Reuse",
      },
      {
        id: "wat-jalmitra",
        title: "Youth & Women 'Jal Mitra' Water Quality Testing",
        summary:
          "Weekly field-kit checks testing tap points, wells, and tanks for fluoride, TDS, nitrate, pH, and bacterial safety.",
        stakeholders: ["Women", "Youth & Students"],
        obligation: "Post test readings transparently on the Panchayat notice board every Monday.",
        cadence: "Weekly Testing",
      },
      {
        id: "wat-leaks",
        title: "Zero-Leak Tap & Valve Student Patrols",
        summary:
          "Student water clubs tag dripping public standposts and cracked valve joints for same-day repair by village watermen.",
        stakeholders: ["Children", "Gram Panchayat & All Residents"],
        obligation: "Fit spring-loaded auto-shutoff taps on public standposts and school washing troughs.",
        cadence: "Weekly Audit",
      },
      {
        id: "wat-drip",
        title: "Drip & Sprinkler Micro-Irrigation Peer Demos",
        summary:
          "Live plot comparisons helping farmers cut groundwater extraction by 40–50% while improving horticulture and vegetable income.",
        stakeholders: ["Working Adults & Farmers", "Youth & Students"],
        obligation: "Match high-water crops to canal/tank command zones and switch upland plots to drip/millets.",
        cadence: "Crop Season",
      },
      {
        id: "wat-borewell",
        title: "Defunct Borewell Vertical Recharge Shafts",
        summary:
          "Transform dried-up borewells into filtered rainwater injection wells topped with safe concrete collars instead of open hazards.",
        stakeholders: ["Working Adults & Farmers", "Gram Panchayat & All Residents"],
        obligation: "Seal or recharge 100% of abandoned open borewells to guarantee child safety and aquifer recovery.",
        cadence: "One-Time + Seasonal Filter",
      },
      {
        id: "wat-budget",
        title: "Grama Sabha Village Water Budgeting Wall Chart",
        summary:
          "Shared balance sheet comparing stored lake/aquifer water against drinking, livestock, and irrigation crop demand before sowing.",
        stakeholders: ["Working Adults & Farmers", "Women", "Senior Citizens"],
        obligation: "Reserve minimum summer drinking-water buffer in local ponds and tanks before approving secondary irrigation.",
        cadence: "Pre-Kharif & Pre-Rabi",
      },
      {
        id: "wat-checkdam",
        title: "Contour Bunds, Farm Ponds (Kuntas) & Checkdams",
        summary:
          "Build cascading micro-barriers along sloping streams and farmland borders so intense bursts of rain soak deep into local soil.",
        stakeholders: ["Working Adults & Farmers", "Gram Panchayat & All Residents"],
        obligation: "Inspect checkdam aprons and stone pitching after heavy monsoon storms.",
        cadence: "Post-Storm Check",
      },
      {
        id: "wat-float",
        title: "Auto-Cutout Float Valves on Overhead Tanks",
        summary:
          "Install low-cost float switches on community and household sumps so borewell pumps stop automatically before spilling a single liter.",
        stakeholders: ["Gram Panchayat & All Residents", "Youth & Students"],
        obligation: "Zero daily tank-overflow waste across public buildings and homes.",
        cadence: "Continuous Automation",
      },
      {
        id: "wat-ecofest",
        title: "Clay-Idol Immersion & Plastic-Free Lake Bunds",
        summary:
          "Dedicated temporary immersion pools alongside natural clay idols so toxic paints and plastics never enter village lakes or rivers.",
        stakeholders: ["Children", "Women", "Senior Citizens", "Gram Panchayat & All Residents"],
        obligation: "Enforce zero soap washing, zero chemical paint, and clean floral-waste bins along every shore.",
        cadence: "Festival & Weekly",
      },
      {
        id: "wat-stepwell",
        title: "Historic Stepwell (Baori), Dug Well & Spring Revival",
        summary:
          "Clean, desilt, and install safety mesh covers over historic wells and natural springs so they serve as living drought reserves.",
        stakeholders: ["Senior Citizens", "Youth & Students", "Gram Panchayat & All Residents"],
        obligation: "Fence heritage wells safely while preserving natural groundwater seepage veins.",
        cadence: "Quarterly Care",
      },
      {
        id: "wat-walk",
        title: "Watershed Walks Across Lakes, Streams & Wetlands",
        summary:
          "Elders guide schoolchildren along local streams, ponds, canals, and wetlands so every generation learns how water moves across land.",
        stakeholders: ["Children", "Senior Citizens"],
        obligation: "Map every stream & pond boundary digitally and in school notebooks to prevent future encroachment.",
        cadence: "Quarterly Walk",
      },
    ],
  },
  education: {
    sectorTitle: "Education, Youth Skills & Lifelong Learning",
    subtitle:
      "Closing learning and digital divides through joyful reading rooms, grandparent wisdom, cyber-safety for elders, and career roadmaps for youth.",
    accentHex: "#C5192D",
    accentSoft: "rgba(197, 25, 45, 0.16)",
    obligationsByRole: [
      {
        group: "Children",
        obligation: "Read 1 storybook weekly, participate in tinkering labs, and help maintain the school nutrition garden.",
      },
      {
        group: "Women",
        obligation: "Support zero girl-child dropout pledges, co-host mother-child reading evenings, and build digital banking fluency.",
      },
      {
        group: "Senior Citizens",
        obligation: "Share local heritage stories, folk wisdom, and traditional crafts in weekend intergenerational circles.",
      },
      {
        group: "Youth, Workers & Remaining",
        obligation: "Mentor younger buddy learners, safeguard families from UPI scams, and connect students to scholarship portals.",
      },
    ],
    actions: [
      {
        id: "edu-story",
        title: "Grandparents' Storytelling & Oral History Evenings",
        summary:
          "Seniors gather children under village shade trees or libraries to share local history, crop calendars, proverbs, and folk songs.",
        stakeholders: ["Senior Citizens", "Children"],
        obligation: "Youth record audio/text transcripts so priceless village heritage stays preserved for future generations.",
        cadence: "Bi-Weekly Evening",
      },
      {
        id: "edu-library",
        title: "Bright Reading Corners & Toy/STEM Book Libraries",
        summary:
          "Open community study rooms stocked with illustrated Telugu-English storybooks, science comics, puzzles, and quiet study lamps.",
        stakeholders: ["Children", "Youth & Students", "Women"],
        obligation: "Households donate gently used textbooks & storybooks; panchayat keeps rooms open after school hours.",
        cadence: "Daily 4 PM – 8 PM",
      },
      {
        id: "edu-spoken",
        title: "Bilingual Spoken English & Communication Clubs",
        summary:
          "Playful theater, debate, and conversation circles helping rural learners speak clearly in both mother tongue and English without hesitation.",
        stakeholders: ["Children", "Youth & Students"],
        obligation: "Encourage fear-free participation with zero mockery; rotate student moderators every week.",
        cadence: "Every Saturday",
      },
      {
        id: "edu-tinker",
        title: "DIY Science Tinkering & Weather/Solar Kits",
        summary:
          "Hands-on experiments where students build sand water-filters, solar toy circuits, and backyard rain gauges from everyday materials.",
        stakeholders: ["Children", "Youth & Students"],
        obligation: "Every school hosts at least two open community science demonstration fairs each academic year.",
        cadence: "Monthly Workshop",
      },
      {
        id: "edu-cyber",
        title: "Cyber-Safety & UPI Fraud Shield Clinics",
        summary:
          "Practical demonstrations teaching working adults, women, and senior citizens how to spot fake KYC calls, OTP traps, and scam links.",
        stakeholders: ["Senior Citizens", "Working Adults & Farmers", "Women"],
        obligation: "Never share OTP/PIN; memorize helpline 1930 for instant financial fraud reporting.",
        cadence: "Monthly Clinic",
      },
      {
        id: "edu-buddy",
        title: "'No Child Left Behind' Peer-Buddy Circles",
        summary:
          "College & senior-school volunteers tutor primary students who struggle with foundational reading, arithmetic, or attendance.",
        stakeholders: ["Youth & Students", "Children"],
        obligation: "Track any child absent for 5+ days via ASHA/teacher check-in to prevent early dropout.",
        cadence: "Weekly Tutoring",
      },
      {
        id: "edu-career",
        title: "Career, ITI, Polytechnic & Scholarship Clinics",
        summary:
          "Step-by-step counseling after Class 10 & 12 covering ePASS scholarships, ITI trades, nursing, polytechnics, and apprenticeship stipends.",
        stakeholders: ["Youth & Students", "Women", "Working Adults & Farmers"],
        obligation: "Ensure zero eligible student misses scholarship renewal deadlines due to missing caste/income papers.",
        cadence: "Quarterly Counseling",
      },
      {
        id: "edu-ai",
        title: "Youth AI & Digital Productivity Bootcamps",
        summary:
          "Practical sessions on spreadsheets, resume design, smart-agri advisories, coding basics, and responsible digital skills.",
        stakeholders: ["Youth & Students", "Working Adults & Farmers"],
        obligation: "Keep public computer kiosks free for learners with verified ethical digital usage guidelines.",
        cadence: "Weekend Bootcamp",
      },
      {
        id: "edu-girls",
        title: "Girl-Child STEM & Leadership Role-Model Talks",
        summary:
          "Interactive sessions connecting village schoolgirls with women doctors, engineers, teachers, police officers, and FPO founders.",
        stakeholders: ["Children", "Women", "Youth & Students"],
        obligation: "Guarantee safe transport, functional girls' washrooms, and 100% transition from Class 8 to 12.",
        cadence: "Monthly Talk",
      },
      {
        id: "edu-poshan",
        title: "School Nutrition Gardens ('Poshan Vatika')",
        summary:
          "Students cultivate organic spinach, tomatoes, beans, and lemon trees inside campus plots feeding straight into Mid-Day Meals.",
        stakeholders: ["Children", "Women"],
        obligation: "Use campus greywater/compost only; integrate plant biology straight into classroom science.",
        cadence: "Daily Gardening",
      },
      {
        id: "edu-science",
        title: "Citizen Science Biodiversity & Rain Notebooks",
        summary:
          "Students maintain seasonal logs of rainfall mm, migratory birds, butterflies, and flowering native trees across their panchayat.",
        stakeholders: ["Children", "Senior Citizens", "Youth & Students"],
        obligation: "Share compiled annual village nature calendar with Grama Sabha for environmental planning.",
        cadence: "Weekly Observations",
      },
      {
        id: "edu-adult",
        title: "Evening Adult Financial & Smartphone Literacy",
        summary:
          "Warm evening sessions helping parents read bank passbooks, check e-NAM mandi prices, and access citizen certificates independently.",
        stakeholders: ["Women", "Senior Citizens", "Working Adults & Farmers"],
        obligation: "Local youth donate 2 hours weekly to patiently coach adult learners one-on-one.",
        cadence: "Twice Weekly Evening",
      },
      {
        id: "edu-arts",
        title: "Local Folk Arts, Pottery & Weaving Apprenticeships",
        summary:
          "Preserve cherished cultural crafts alongside academics through master-artisan workshops for children during school holidays.",
        stakeholders: ["Children", "Senior Citizens", "Women"],
        obligation: "Compensate master artisans fairly via cultural grants and display student work at local fairs.",
        cadence: "Holiday Workshops",
      },
    ],
  },
  livelihood: {
    sectorTitle: "Livelihood & Diverse Economic Opportunities",
    subtitle:
      "Multi-stream income pathways spanning modern agri-tech, clean energy jobs, women SHG brands, remote digital hubs, crafts, and green micro-enterprises.",
    accentHex: "#A21942",
    accentSoft: "rgba(162, 25, 66, 0.16)",
    obligationsByRole: [
      {
        group: "Youth & Students",
        obligation: "Complete certified solar, EV, agri-drone, or digital courses and build local service micro-firms.",
      },
      {
        group: "Women",
        obligation: "Maintain collective SHG accounting transparency, FSSAI food hygiene standards, and direct e-commerce quality.",
      },
      {
        group: "Working Adults & Farmers",
        obligation: "Grade & moisture-test harvests via FPOs before sale rather than accepting distress raw-crop prices.",
      },
      {
        group: "Senior Citizens & Panchayat",
        obligation: "Mentorship on craft authenticity, common shed allocation, and fair transparent credit linkage.",
      },
    ],
    actions: [
      {
        id: "liv-drone",
        title: "Agri-Drone Spraying & Rapid Soil-Testing Hubs",
        summary:
          "Trained rural youth teams run certified precision-spray drones and quick-NPK soil labs as local service enterprises.",
        stakeholders: ["Youth & Students", "Working Adults & Farmers"],
        obligation: "Follow calibrated pesticide dosage guidelines to reduce chemical runoff and boost farmer margins.",
        cadence: "Year-Round Agri Service",
      },
      {
        id: "liv-fpo",
        title: "FPO Grading, Cold-Chain & Branded Direct Sales",
        summary:
          "Shift farmers from distress harvest dumping to solar cold-stored, moisture-graded, packaged turmeric, chillies, millets, and pulses.",
        stakeholders: ["Working Adults & Farmers", "Women", "Gram Panchayat & All Residents"],
        obligation: "Ensure fair weighing, moisture meters, and transparent profit distribution among all member growers.",
        cadence: "Harvest & Marketing Cycles",
      },
      {
        id: "liv-solar",
        title: "Solar Pump, Rooftop PV & Inverter Technician Firms",
        summary:
          "Fast-growing green trades installing, cleaning, and repairing PM-KUSUM solar irrigation pumps, home panels, and streetlamps.",
        stakeholders: ["Youth & Students", "Working Adults & Farmers"],
        obligation: "Deliver certified safe earthing & wiring plus 24-hour local maintenance turnaround.",
        cadence: "On-Demand Service",
      },
      {
        id: "liv-bakery",
        title: "Women SHG Millet Bakeries & Cloud Kitchens",
        summary:
          "Hygienic commercial kitchens run by women groups supplying hostel tiffins, packaged millet cookies, pickles, and nutritious snacks.",
        stakeholders: ["Women", "Youth & Students"],
        obligation: "Adhere strictly to FSSAI hygiene, batch expiry dating, and zero-plastic eco packaging.",
        cadence: "Daily Enterprise",
      },
      {
        id: "liv-remote",
        title: "Rural Broadband Remote-Work, BPO & Data Desks",
        summary:
          "Shared solar-backed fiber co-working rooms enabling educated youth to earn remote IT, design, accounting, and support incomes at home.",
        stakeholders: ["Youth & Students", "Women"],
        obligation: "Provide reliable backup power, quiet study acoustics, and strict professional data-privacy norms.",
        cadence: "Full-Time Hybrid Careers",
      },
      {
        id: "liv-ev",
        title: "EV Auto & Two-Wheeler Charging & Repair Kiosks",
        summary:
          "Clean solar-assisted battery swap, charging, and motor repair hubs keeping rural passenger autos and cargo bikes moving cleanly.",
        stakeholders: ["Youth & Students", "Working Adults & Farmers"],
        obligation: "Train certified diagnostics technicians and recycle degraded batteries responsibly.",
        cadence: "Daily Transit Hub",
      },
      {
        id: "liv-ecotour",
        title: "Eco-Tourism, Bird-Trail Guides & Farm-Stays",
        summary:
          "Curated weekend nature walks, lakeside trails, artisan village visits, and authentic millet meals hosted safely for city visitors.",
        stakeholders: ["Senior Citizens", "Youth & Students", "Women"],
        obligation: "Guarantee zero littering, authentic hospitality, and conservation-first wildlife spacing.",
        cadence: "Weekends & Holidays",
      },
      {
        id: "liv-bees",
        title: "Apiculture (Beekeeping) & Pure Honey Packaging",
        summary:
          "Low-footprint bee boxes sited safely beside orchards and farms—lifting crop pollination yields by ~20% while harvesting pure honey.",
        stakeholders: ["Working Adults & Farmers", "Women", "Youth & Students"],
        obligation: "Eliminate daytime insecticide sprays during peak flowering to safeguard bee colonies.",
        cadence: "Seasonal Harvest",
      },
      {
        id: "liv-mushroom",
        title: "Mushroom Sheds & Hydroponic Green Fodder",
        summary:
          "Year-round indoor livelihood turning surplus paddy straw into oyster mushrooms and high-protein cattle fodder in tiny backyards.",
        stakeholders: ["Women", "Youth & Students", "Senior Citizens"],
        obligation: "Maintain sterile humidity controls and direct cold-box delivery to nearby town markets.",
        cadence: "25-Day Harvest Cycles",
      },
      {
        id: "liv-dairy",
        title: "Village Dairy Chilling, A2 Ghee & Paneer Units",
        summary:
          "Automated fat-testing collection centers paired with solar chillers transforming raw milk into high-margin ghee, curd, and paneer.",
        stakeholders: ["Women", "Working Adults & Farmers"],
        obligation: "Pay transparent digital rates immediately on milk quality readings; protect fodder water balance.",
        cadence: "Morning & Evening Shifts",
      },
      {
        id: "liv-aquaculture",
        title: "Integrated Fish, Duck & Bund-Horticulture",
        summary:
          "Multi-tier livelihood along perennial tanks & ponds combining fingerling fisheries, duck rearing, and banana/papaya bund crops.",
        stakeholders: ["Working Adults & Farmers", "Gram Panchayat & All Residents"],
        obligation: "Prohibit toxic chemicals and respect breeding-season catch rest periods.",
        cadence: "Year-Round Cycle",
      },
      {
        id: "liv-craft",
        title: "Handloom, Pottery & GI-Craft E-Commerce Studios",
        summary:
          "Shared photography, barcoding, and online marketplace desks helping weavers and traditional artisans sell globally without middlemen.",
        stakeholders: ["Women", "Senior Citizens", "Youth & Students"],
        obligation: "Preserve genuine handmade GI quality stamps while mentoring younger apprentices.",
        cadence: "Order-Based Studio",
      },
      {
        id: "liv-tailoring",
        title: "Modern Tailoring, School Uniform & Bag Units",
        summary:
          "High-speed industrial stitching clusters handling school uniforms, hospital linen, and plastic-alternative retail cloth bags.",
        stakeholders: ["Women", "Youth & Students"],
        obligation: "Guaranteed fair piece-rates, ergonomic seating, and local institutional procurement priority.",
        cadence: "Year-Round Production",
      },
      {
        id: "liv-nursery",
        title: "Vermicompost, Bio-Inputs & Fruit Nursery Hubs",
        summary:
          "Growing grafted fruit saplings, disease-free vegetable seedlings, and organic bio-fertilizers supplying nearby panchayat plantations.",
        stakeholders: ["Working Adults & Farmers", "Women", "Senior Citizens"],
        obligation: "Ensure certified pest-free mother stock and fair pricing for smallholders.",
        cadence: "Pre-Planting Seasons",
      },
    ],
  },
};

export default function SectorGoodActionsPanel({
  sector,
  village,
}: {
  sector: SdgSectorId;
  village: SectorInsightsVillage | null;
}) {
  const meta = SECTOR_GOOD_ACTIONS[sector];
  const sdgAsset = SDG_SECTOR_ASSETS[sector];

  const [stakeholderFilter, setStakeholderFilter] = useState<StakeholderGroup>("all");
  const [selectedActionIdx, setSelectedActionIdx] = useState<number>(0);
  const [autoCycle, setAutoCycle] = useState<boolean>(false);
  const [committedIds, setCommittedIds] = useState<Record<string, boolean>>({});
  const [copiedCharter, setCopiedCharter] = useState<boolean>(false);

  // Reset filter & index with smooth reveal whenever sector switches
  useEffect(() => {
    setStakeholderFilter("all");
    setSelectedActionIdx(0);
    setAutoCycle(false);
  }, [sector]);

  const filteredActions = useMemo(() => {
    if (stakeholderFilter === "all") return meta.actions;
    return meta.actions.filter((a) =>
      a.stakeholders.includes(stakeholderFilter)
    );
  }, [meta.actions, stakeholderFilter]);

  useEffect(() => {
    if (selectedActionIdx >= filteredActions.length) {
      setSelectedActionIdx(0);
    }
  }, [filteredActions.length, selectedActionIdx]);

  useEffect(() => {
    if (!autoCycle || filteredActions.length <= 1) return;
    const timer = window.setInterval(() => {
      setSelectedActionIdx((prev) => (prev + 1) % filteredActions.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [autoCycle, filteredActions.length]);

  const spotlightAction =
    filteredActions[selectedActionIdx] ?? meta.actions[0];

  const committedCount = useMemo(
    () => meta.actions.filter((a) => Boolean(committedIds[a.id])).length,
    [meta.actions, committedIds]
  );

  const toggleCommit = (id: string) => {
    setCommittedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopySectorCharter = async () => {
    const vName = village?.villageName ?? "Selected Settlement";
    const lines = [
      `JAN-DRISHTI · ${meta.sectorTitle.toUpperCase()} (${vName})`,
      `${sdgAsset.caption}`,
      ``,
      `STAKEHOLDER OBLIGATIONS:`,
      ...meta.obligationsByRole.map((o) => `- ${o.group}: ${o.obligation}`),
      ``,
      `MUST-DO GOOD ACTIONS (${filteredActions.length}):`,
      ...filteredActions.map(
        (a, i) =>
          `${i + 1}. ${a.title}\n   Stakeholders: ${a.stakeholders.join(", ")}\n   Obligation: ${a.obligation}`
      ),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(lines);
      setCopiedCharter(true);
      setTimeout(() => setCopiedCharter(false), 2400);
    } catch {
      setCopiedCharter(false);
    }
  };

  return (
    <section
      key={sector}
      aria-label={meta.sectorTitle}
      className="jd-transition-reveal border border-slate-200 dark:border-white/12 bg-white dark:bg-[#070b12] overflow-hidden"
    >
      {/* Top Sector Header */}
      <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 dark:text-white/60">
            <span style={{ color: meta.accentHex }} className="font-semibold">
              UN SDG {sdgAsset.goalNumber} · {sdgAsset.sdgLabel}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {meta.actions.length} Must-Do Good Actions
            </span>
            <span aria-hidden="true">·</span>
            <span>{village?.villageName ?? "Telangana Community"}</span>
          </div>
          <h3 className="mt-1.5 text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white text-balance">
            {meta.sectorTitle}
          </h3>
          <p className="mt-1 text-xs md:text-sm text-slate-600 dark:text-white/65">
            {meta.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="px-3.5 py-2 border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/[0.03] text-xs font-mono tabular-nums">
            <span className="text-slate-500 dark:text-white/55">Adopted: </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {committedCount}/{meta.actions.length}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopySectorCharter}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-white/15 bg-slate-900 dark:bg-white/10 hover:opacity-90 text-white text-xs font-medium transition-opacity whitespace-nowrap shrink-0"
          >
            {copiedCharter ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Copied Charter
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Sector Charter
              </>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================
          VISUAL STAGE WITH OFFICIAL SDG IMAGE EMBEDDED INSIDE VISUAL
      ========================================================= */}
      <div className="p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-[#050911]">
        <div
          className="jd-keep-dark relative overflow-hidden border border-white/15 bg-[#060d19] text-white"
          style={{
            backgroundImage: `radial-gradient(circle at 18% 35%, ${meta.accentSoft} 0%, transparent 52%), radial-gradient(circle at 86% 78%, rgba(56, 189, 248, 0.14) 0%, transparent 48%)`,
          }}
        >
          {/* Decorative Architectural SVG Backdrop Inside the Visual */}
          <svg
            aria-hidden="true"
            viewBox="0 0 1100 300"
            className="pointer-events-none absolute inset-0 w-full h-full opacity-35"
            preserveAspectRatio="none"
          >
            <circle
              cx="190"
              cy="150"
              r="118"
              fill="none"
              stroke={meta.accentHex}
              strokeWidth="1"
              strokeDasharray="6 6"
            />
            <circle
              cx="190"
              cy="150"
              r="146"
              fill="none"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="0.8"
            />
            <path
              d="M 330 250 Q 620 140 1080 210"
              fill="none"
              stroke={meta.accentHex}
              strokeWidth="1.2"
              strokeOpacity="0.45"
            />
            <path
              d="M 330 272 Q 660 190 1080 246"
              fill="none"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1"
            />
          </svg>

          <div className="relative z-10 p-5 md:p-7 grid lg:grid-cols-12 gap-6 items-center">
            {/* LEFT VISUAL FRAME: SDG Image inside Custom Architectural Visual Frame */}
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-center gap-4">
              <div
                className="relative p-3 border border-white/20 bg-black/55 backdrop-blur-sm transition-transform duration-500"
                style={{
                  boxShadow: `0 18px 45px -16px ${meta.accentSoft}`,
                }}
              >
                <div className="w-40 h-40 sm:w-44 sm:h-44 overflow-hidden border border-white/25 bg-[#0b1322] flex items-center justify-center">
                  <img
                    src={sdgAsset.imageSrc}
                    alt={sdgAsset.alt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-white/80 tabular-nums">
                  <span>GOAL {sdgAsset.goalNumber}</span>
                  <span style={{ color: meta.accentHex }}>
                    ACTION {String(selectedActionIdx + 1).padStart(2, "0")}/
                    {String(filteredActions.length).padStart(2, "0")}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT SPOTLIGHT: Smoothly Transitioning Active Action, Stakeholders & Obligations */}
            <div
              key={spotlightAction.id}
              className="lg:col-span-8 jd-transition-reveal space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-white/75">
                  <Sparkles className="w-4 h-4 shrink-0" style={{ color: meta.accentHex }} />
                  <span className="font-medium text-white">Spotlight Good Practice</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{spotlightAction.cadence}</span>
                </div>

                {/* Carousel / Transition Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setAutoCycle((c) => !c)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-white/20 bg-white/5 hover:bg-white/10 text-white transition-colors whitespace-nowrap"
                  >
                    {autoCycle ? (
                      <>
                        <Pause className="w-3.5 h-3.5 text-amber-300" />
                        Pause Cycle
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-emerald-300" />
                        Auto Showcase
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label="Previous action"
                    onClick={() =>
                      setSelectedActionIdx(
                        (prev) =>
                          (prev - 1 + filteredActions.length) %
                          Math.max(1, filteredActions.length)
                      )
                    }
                    className="p-1.5 border border-white/20 bg-white/5 hover:bg-white/15 text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next action"
                    onClick={() =>
                      setSelectedActionIdx(
                        (prev) =>
                          (prev + 1) % Math.max(1, filteredActions.length)
                      )
                    }
                    className="p-1.5 border border-white/20 bg-white/5 hover:bg-white/15 text-white transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h4 className="text-xl md:text-2xl font-semibold text-white leading-snug text-balance">
                {spotlightAction.title}
              </h4>

              <p className="text-sm text-white/80 leading-relaxed max-w-3xl">
                {spotlightAction.summary}
              </p>

              {/* Stakeholders + Obligations Split inside Spotlight */}
              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                <div className="border border-white/15 bg-black/35 p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span>Stakeholders</span>
                  </div>
                  <div className="text-xs text-white/90 leading-relaxed">
                    {spotlightAction.stakeholders.join(" · ")}
                  </div>
                </div>

                <div className="border border-white/15 bg-black/35 p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                    <ClipboardCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Obligations</span>
                  </div>
                  <div className="text-xs text-white/90 leading-relaxed">
                    {spotlightAction.obligation}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          DEDICATED SECTOR "OBLIGATIONS" BY STAKEHOLDER GROUP
      ========================================================= */}
      <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: meta.accentHex }} />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              Shared Community Obligations
            </h4>
          </div>
          <span className="text-xs text-slate-500 dark:text-white/55">
            Children · Women · Senior Citizens · Working Adults &amp; Local Bodies
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {meta.obligationsByRole.map((item) => (
            <div
              key={item.group}
              className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-3.5 space-y-1.5"
            >
              <div
                className="text-xs font-semibold"
                style={{ color: meta.accentHex }}
              >
                {item.group}
              </div>
              <p className="text-xs text-slate-700 dark:text-white/75 leading-relaxed">
                {item.obligation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================
          STAKEHOLDER FILTER BAR + ALL 13–14 SECTOR GOOD ACTIONS
      ========================================================= */}
      <div className="p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-xs font-semibold text-slate-800 dark:text-white/85">
            Filter Must-Do Initiatives by Stakeholder ({filteredActions.length} shown)
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {STAKEHOLDER_FILTERS.map((f) => {
              const isActive = stakeholderFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => {
                    setStakeholderFilter(f.key);
                    setSelectedActionIdx(0);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white font-semibold"
                      : "bg-slate-50 dark:bg-white/[0.03] text-slate-700 dark:text-white/75 border-slate-200 dark:border-white/12 hover:bg-slate-100 dark:hover:bg-white/10"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Transitioning Grid of Sector Actions */}
        <div
          key={`${sector}-${stakeholderFilter}`}
          className="jd-transition-reveal grid md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {filteredActions.map((action, index) => {
            const isSpotlighted = index === selectedActionIdx;
            const isAdopted = Boolean(committedIds[action.id]);
            return (
              <div
                key={action.id}
                onClick={() => setSelectedActionIdx(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedActionIdx(index);
                  }
                }}
                className={`cursor-pointer text-left border p-4 flex flex-col justify-between gap-3 transition-all duration-200 ${
                  isSpotlighted
                    ? "border-slate-900 dark:border-white/60 bg-slate-100/90 dark:bg-white/[0.06]"
                    : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#050911] hover:border-slate-400 dark:hover:border-white/30"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-white/50 font-mono tabular-nums">
                    <span>
                      {String(index + 1).padStart(2, "0")} · {action.cadence}
                    </span>
                    {isSpotlighted && (
                      <span
                        className="font-semibold font-sans"
                        style={{ color: meta.accentHex }}
                      >
                        In Spotlight
                      </span>
                    )}
                  </div>

                  <h5 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                    {action.title}
                  </h5>

                  <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed">
                    {action.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-white/10 space-y-2 text-[11px]">
                  <div className="text-slate-600 dark:text-white/65">
                    <span className="font-semibold text-slate-900 dark:text-white/90">
                      Stakeholders:{" "}
                    </span>
                    {action.stakeholders.join(" · ")}
                  </div>
                  <div className="text-slate-600 dark:text-white/65">
                    <span className="font-semibold text-slate-900 dark:text-white/90">
                      Obligation:{" "}
                    </span>
                    {action.obligation}
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCommit(action.id);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                        isAdopted
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "bg-slate-50 dark:bg-white/[0.04] border-slate-300 dark:border-white/15 text-slate-800 dark:text-white/85 hover:bg-slate-100 dark:hover:bg-white/10"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isAdopted ? "Adopted Pledge" : "Commit Action"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
