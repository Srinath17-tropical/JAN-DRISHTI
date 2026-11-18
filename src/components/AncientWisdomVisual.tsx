import { useEffect, useMemo, useState } from "react";
import { Calendar, Maximize2, Sparkles, Sun, CloudRain, Wheat, Compass, X } from "lucide-react";

export type AncientWisdomDomain =
  | "overview"
  | "education"
  | "health"
  | "water"
  | "livelihood"
  | "environment";

export type CroppingSeasonKey = "all" | "kharif" | "rabi" | "zaid";

type WisdomVisualMeta = {
  title: string;
  heritageBadge: string;
  eraTag: string;
  modernEcho: string;
  accent: string;
  secondaryAccent: string;
};

type SeasonalWisdomRule = {
  rituTag: string;
  cropWindow: string;
  classicalPrinciple: string;
  actionDirective: string;
};

type SeasonPresetMeta = {
  key: CroppingSeasonKey;
  label: string;
  shortLabel: string;
  defaultFrom: string;
  defaultTo: string;
  rituName: string;
  accent: string;
};

const SEASON_PRESETS: SeasonPresetMeta[] = [
  {
    key: "rabi",
    label: "Yasangi / Rabi (Nov–Feb)",
    shortLabel: "Rabi / Yasangi",
    defaultFrom: "2026-11-01",
    defaultTo: "2027-02-28",
    rituName: "Hemanta–Shishira Ritu (Harvest & Stored Tank Ayacut)",
    accent: "#fbbf24",
  },
  {
    key: "kharif",
    label: "Vanakalam / Kharif (Jun–Oct)",
    shortLabel: "Kharif / Vanakalam",
    defaultFrom: "2026-06-01",
    defaultTo: "2026-10-31",
    rituName: "Varsha–Sharad Ritu (SW Monsoon Inflow & Sowing)",
    accent: "#38bdf8",
  },
  {
    key: "zaid",
    label: "Grishma / Summer (Mar–May)",
    shortLabel: "Summer / Zaid",
    defaultFrom: "2027-03-01",
    defaultTo: "2027-05-31",
    rituName: "Vasanta–Grishma Ritu (Desiltation & Heat Resilience)",
    accent: "#fb923c",
  },
  {
    key: "all",
    label: "Full Annual Cycle (Jan–Dec)",
    shortLabel: "Annual Cycle",
    defaultFrom: "2026-01-01",
    defaultTo: "2026-12-31",
    rituName: "Samvatsara (Year-Round Civilisational Equilibrium)",
    accent: "#34d399",
  },
];

function classifyDateRangeToSeason(fromStr: string, toStr: string): CroppingSeasonKey {
  if (!fromStr || !toStr) return "rabi";
  const start = new Date(`${fromStr}T00:00:00`);
  const end = new Date(`${toStr}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return "rabi";
  }

  const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (diffDays >= 220) return "all";

  let kharifDays = 0;
  let rabiDays = 0;
  let zaidDays = 0;

  const step = Math.max(1, Math.floor(diffDays / 90));
  for (let d = 0; d < diffDays; d += step) {
    const cur = new Date(start.getTime() + d * 86400000);
    const m = cur.getMonth() + 1; // 1..12
    if (m >= 6 && m <= 10) kharifDays += step;
    else if (m >= 3 && m <= 5) zaidDays += step;
    else rabiDays += step;
  }

  if (kharifDays >= rabiDays && kharifDays >= zaidDays) return "kharif";
  if (zaidDays >= kharifDays && zaidDays >= rabiDays) return "zaid";
  return "rabi";
}

function formatShortDate(dateStr: string): string {
  const dt = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return dateStr;
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const SEASONAL_WISDOM: Record<AncientWisdomDomain, Record<CroppingSeasonKey, SeasonalWisdomRule>> = {
  overview: {
    all: {
      rituTag: "SAMVATSARA GOVERNANCE · FULL ANNUAL CYCLE",
      cropWindow: "Jan – Dec Continuum",
      classicalPrinciple: "Kautilya mandates triple yearly Sabha audits—before monsoon sowing, post-harvest granary stock, and summer tank maintenance.",
      actionDirective: "Align Gram Panchayat action plans across monsoon conservation, Yasangi harvest procurement, and Grishma civil works.",
    },
    kharif: {
      rituTag: "VARSHA GRAM SABHA · KHARIF READINESS",
      cropWindow: "Vanakalam (Jun – Oct)",
      classicalPrinciple: "Satavahana–Kakatiya inscriptions record communal inspection of bunds, feeder channels, and seed loans prior to the first rains.",
      actionDirective: "Activate pre-monsoon tank spillway checks, Kharif crop insurance enrollment, and flood-vulnerable ward alerts.",
    },
    rabi: {
      rituTag: "HEMANTA GRAM SABHA · HARVEST & STORAGE AUDIT",
      cropWindow: "Yasangi / Rabi (Nov – Feb)",
      classicalPrinciple: "Classical Rajadharma anchors tax fairness and grain-bank (Kosthagara) buffers during post-monsoon winter harvest.",
      actionDirective: "Coordinate Rythu Vedika paddy procurement centers, SHG credit disbursement, and Rabi canal water budgeting.",
    },
    zaid: {
      rituTag: "GRISHMA GRAM SABHA · SCARCITY PREPAREDNESS",
      cropWindow: "Grishma / Summer (Mar – May)",
      classicalPrinciple: "Dharma-shastra civic charters treat dry-season drinking water stations and public shaded groves as sacred state duty.",
      actionDirective: "Deploy tanker/tap pressure audits, MGNREGA tank desiltation works, and village Chalivendram cooling kiosks.",
    },
  },
  education: {
    all: {
      rituTag: "YEAR-ROUND PATHASHALA · CONTINUOUS VIDYA",
      cropWindow: "Jan – Dec Continuum",
      classicalPrinciple: "Ghatika academies adapted schedules around agricultural rhythms so rural children never forfeited schooling for labour.",
      actionDirective: "Combine digital classrooms, midday nutrition, and girls' bridge fellowships across every cropping transition.",
    },
    kharif: {
      rituTag: "VARSHA PATHASHALA · MONSOON ATTENDANCE SHIELD",
      cropWindow: "Vanakalam (Jun – Oct)",
      classicalPrinciple: "During heavy monsoon sowing, ancient village pathashalas became dry sheltered halls protecting youth from agricultural drift.",
      actionDirective: "Prevent monsoon transport disruption & peak-sowing child absenteeism via safe school buses and waterproof walkways.",
    },
    rabi: {
      rituTag: "HEMANTA–SHISHIRA VIDYA · POST-HARVEST SCHOLARSHIP",
      cropWindow: "Yasangi / Rabi (Nov – Feb)",
      classicalPrinciple: "Autumn–winter Vasanta Panchami & winter study festivals marked intense scripture, astronomy, and craft apprenticeship.",
      actionDirective: "Run remedial STEM labs, pre-board scholarship camps, and university skill bridge workshops in peak pleasant weather.",
    },
    zaid: {
      rituTag: "GRISHMA BRIDGE CAMPS · MORNING SHALA HOURS",
      cropWindow: "Grishma / Summer (Mar – May)",
      classicalPrinciple: "Traditional Gurukulas shifted instruction to cool dawn hours beneath banyan groves to beat Deccan afternoon heat.",
      actionDirective: "Shift summer remedial libraries to 7–11 AM solar-fan rooms with chilled clean water and free NEET/Polytechnic prep.",
    },
  },
  health: {
    all: {
      rituTag: "RITU-CHARYA CYCLE · PREVENTIVE AYURVEDA",
      cropWindow: "Jan – Dec Continuum",
      classicalPrinciple: "Charaka Samhita prescribes seasonal adjustments (Ritu-charya) in diet, boiled water, and ventilation as the root of immunity.",
      actionDirective: "Synchronize Palle Dawakhana screenings with seasonal vector, waterborne, and thermal morbidity surges.",
    },
    kharif: {
      rituTag: "VARSHA RITU-CHARYA · ANTI-VECTOR & WATER PURITY",
      cropWindow: "Vanakalam (Jun – Oct)",
      classicalPrinciple: "Ayurveda warns that stagnant rainwater mixes soil toxins (Kleda), demanding boiled herbal water and zero standing greywater.",
      actionDirective: "Trigger pre-monsoon chlorination, closed drain clearing, mosquito larvicide drives, and weekly ANM fever surveillance.",
    },
    rabi: {
      rituTag: "HEMANTA RITU-CHARYA · CLEAN INDOOR AIR",
      cropWindow: "Yasangi / Rabi (Nov – Feb)",
      classicalPrinciple: "Winter nights increase indoor hearth burning; Charaka warns smoke-filled homes trigger chronic cough and pediatric stunting.",
      actionDirective: "Enforce 100% LPG Ujjwala refills, iron/millets winter nutrition for mothers, and hypertension/diabetes screenings.",
    },
    zaid: {
      rituTag: "GRISHMA RITU-CHARYA · HEAT & HYDRATION SHIELD",
      cropWindow: "Grishma / Summer (Mar – May)",
      classicalPrinciple: "Classical summer regimens call for earthen pot cooling, buttermilk/electrolytes, and halting midday outdoor toil.",
      actionDirective: "Stock ORS hydration kits at Anganwadis, reschedule outdoor labor away from 12–4 PM, and monitor senior heat stress.",
    },
  },
  water: {
    all: {
      rituTag: "GOLUSU KATTU ANNUAL HYDROLOGY",
      cropWindow: "Jan – Dec Continuum",
      classicalPrinciple: "Kakatiya engineers treated rainwater as an indivisible annual bank: catch in monsoon, ration in winter, desilt in summer.",
      actionDirective: "Manage TRACGIS chain-tanks, FHTC 55 LPCD taps, and groundwater extraction in one continuous yearly loop.",
    },
    kharif: {
      rituTag: "VARSHA INFLOW · CHAIN-TANK SURPLUS HARVEST",
      cropWindow: "Vanakalam (Jun – Oct)",
      classicalPrinciple: "When upland cheruvus fill, Kakatiya weir overflows cascade cleanly down feeder nalas into lower village tanks.",
      actionDirective: "Clear feeder channels (kaluvas) and monitor real-time weir surpluses to maximize aquifer recharge per rainy day.",
    },
    rabi: {
      rituTag: "YASANGI AYACUT · THUMU SLUICE EQUITABLE RATIONING",
      cropWindow: "Yasangi / Rabi (Nov – Feb)",
      classicalPrinciple: "Neeruganti water-managers opened stone Thumu sluices by community turn so tail-end fields also matured Rabi crops.",
      actionDirective: "Balance stored tank releases with drip/sprinkler micro-irrigation to prevent wasteful borewell drawdown.",
    },
    zaid: {
      rituTag: "GRISHMA DESILTATION · PRE-MONSOON CAPACITY RESTORE",
      cropWindow: "Grishma / Summer (Mar – May)",
      classicalPrinciple: "Traditional Kudimaramat held villages dug nutrient-rich silt from dry tank beds each summer and spread it on farm fields.",
      actionDirective: "Execute Mission Kakatiya / MGNREGA desiltation and dig borewell recharge shafts before June rains arrive.",
    },
  },
  livelihood: {
    all: {
      rituTag: "SHRENI CYCLE · YEAR-ROUND RURAL SURPLUS",
      cropWindow: "Jan – Dec Continuum",
      classicalPrinciple: "Thirukkural and Arthashastra celebrate the cultivator-artisan alliance as the true axis turning regional prosperity.",
      actionDirective: "Link farm gate production to SHG processing and cold storage so households earn steady income in all 12 months.",
    },
    kharif: {
      rituTag: "KHARIF SOWING · SEED GUILD & INPUT CREDIT",
      cropWindow: "Vanakalam (Jun – Oct)",
      classicalPrinciple: "Shreni guilds guaranteed timely seed grain & plough credit before monsoon so peasants never fell into usurious debt.",
      actionDirective: "Deliver formal zero-middleman Rythu Bharosa & SHG working-capital loans ahead of peak kharif planting.",
    },
    rabi: {
      rituTag: "YASANGI HARVEST · MANDI FAIR PRICE & STORAGE",
      cropWindow: "Yasangi / Rabi (Nov – Feb)",
      classicalPrinciple: "Santalu market charters protected growers against forced harvest distress sales through shared granary storage.",
      actionDirective: "Route winter grain & horticultural harvests into FPO solar cold-storage and direct digital mandi auctions.",
    },
    zaid: {
      rituTag: "OFF-SEASON PROTECTION · ARTISAN & WATERSHED WAGES",
      cropWindow: "Grishma / Summer (Mar – May)",
      classicalPrinciple: "When dry soil pauses ploughing, craft guilds, textile looms, and earthen-works sustained full household employment.",
      actionDirective: "Eliminate marginal worker distress via dry-season MGNREGA watershed wages & Stree Nidhi micro-enterprises.",
    },
  },
  environment: {
    all: {
      rituTag: "PANCHA-MAHABHUTA BALANCE · ANNUAL STEWARDSHIP",
      cropWindow: "Jan – Dec Continuum",
      classicalPrinciple: "Atharvaveda prays that everything drawn from Earth replenishes swiftly without wounding living habitats.",
      actionDirective: "Pair native afforestation, smokeless kitchens, and PM-KUSUM solar energy into self-sustaining village commons.",
    },
    kharif: {
      rituTag: "VANAMAHOTSAVA · MONSOON SAPLING SURVIVAL",
      cropWindow: "Vanakalam (Jun – Oct)",
      classicalPrinciple: "Vrikshayurveda prescribes planting tank-bund trees with the first soaking showers so deep taproots anchor before winter.",
      actionDirective: "Execute Haritha Haram bund plantations, seed-balling on barren hillocks, and vegetative soil erosion checks.",
    },
    rabi: {
      rituTag: "SHARAD CLEAN AIR · STUBBLE TO BIO-COMPOST",
      cropWindow: "Yasangi / Rabi (Nov – Feb)",
      classicalPrinciple: "Ancient farm Dharma returned dry stalks to compost pits (Gobbar-Khad), nourishing humus while keeping winter skies clear.",
      actionDirective: "Ban crop-residue & biomass burning to keep rural PM2.5 low while converting paddy straw into bio-fertilizer.",
    },
    zaid: {
      rituTag: "GRISHMA SOLAR HARVEST · HEAT-ISLAND COOLING",
      cropWindow: "Grishma / Summer (Mar – May)",
      classicalPrinciple: "Deccan groves (Katta Maisamma vanams) and thick lime courtyards shielded villages from scorching 44°C sun.",
      actionDirective: "Harvest peak 20+ MJ/m² summer solar insolation via PM-KUSUM feeders while watering young saplings from greywater reed-beds.",
    },
  },
};

const WISDOM_META: Record<AncientWisdomDomain, WisdomVisualMeta> = {
  overview: {
    title: "Gram Sabha Chakra & Inscription Mandapam",
    heritageBadge: "LOKASANGRAHA · KAUTILYA ARTHASHASTRA",
    eraTag: "Satavahana–Kakatiya Records",
    modernEcho: "Transparent 5-Sector GIS Observatory",
    accent: "#ff9933",
    secondaryAccent: "#06b6d4",
  },
  education: {
    title: "Palm-Leaf Scroll, Akhanda Deepa & Pathashala",
    heritageBadge: "VIDYA-DHANAM · GHATIKA TRADITION",
    eraTag: "Vemulawada & Warangal Hubs",
    modernEcho: "100% Literacy & Girls' Retention",
    accent: "#ef4444",
    secondaryAccent: "#fbbf24",
  },
  health: {
    title: "Dhanvantari Kalasha, Lotus & Dinacharya",
    heritageBadge: "AROGYA-MULAM · CHARAKA SAMHITA",
    eraTag: "Classical Preventive Hygiene",
    modernEcho: "Clean Air, WASH & Palle Dawakhana",
    accent: "#10b981",
    secondaryAccent: "#14b8a6",
  },
  water: {
    title: "Golusu Kattu Cheruvulu (Chain-Tanks)",
    heritageBadge: "JALA-SAMRAKSHANA · KAKATIYA",
    eraTag: "12th–14th c. Deccan Engineers",
    modernEcho: "TRACGIS Tanks + Aquifer Recharge",
    accent: "#06b6d4",
    secondaryAccent: "#38bdf8",
  },
  livelihood: {
    title: "Shreni Guild Wheel & Balanced Scales",
    heritageBadge: "VARTA & SHRENI · THIRUKKURAL",
    eraTag: "Craft & Cultivator Collectives",
    modernEcho: "SERP SHGs & FPO Value Chains",
    accent: "#ec4899",
    secondaryAccent: "#f59e0b",
  },
  environment: {
    title: "Pancha-Vruksha Grove & Solar Disc",
    heritageBadge: "BHUMI-DHARMA · ATHARVAVEDA",
    eraTag: "Katta Maisamma Bund Groves",
    modernEcho: "Haritha Haram & PM-KUSUM Solar",
    accent: "#84cc16",
    secondaryAccent: "#22c55e",
  },
};

function useContinuousWisdomPhase(durationMs = 8400): number {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let rafId = 0;
    let lastEmit = 0;
    const start = performance.now();

    const tick = (now: number) => {
      if (now - lastEmit >= 32) {
        lastEmit = now;
        const p = ((now - start) % durationMs) / durationMs;
        setPhase(p);
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [durationMs]);

  return phase;
}

export function AncientWisdomSVG({
  domain,
  season,
  dateWindowLabel,
  progress,
  uidPrefix,
}: {
  domain: AncientWisdomDomain;
  season: CroppingSeasonKey;
  dateWindowLabel: string;
  progress: number; // Continuous 0..1 loop
  uidPrefix: string;
}) {
  const meta = WISDOM_META[domain];
  const seasonMeta = SEASON_PRESETS.find((s) => s.key === season) ?? SEASON_PRESETS[0];
  const wave = 0.5 + 0.5 * Math.sin(progress * Math.PI * 2);
  const pulse = 0.5 + 0.5 * Math.cos(progress * Math.PI * 2);

  // Subtle seasonal sky tint blending domain identity with cropping season atmosphere
  const seasonTint =
    season === "kharif"
      ? "#38bdf8"
      : season === "rabi"
      ? "#fbbf24"
      : season === "zaid"
      ? "#fb923c"
      : meta.secondaryAccent;

  return (
    <svg viewBox="0 0 760 360" className="w-full h-auto select-none">
      <defs>
        <radialGradient id={`${uidPrefix}-aura`} cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor={`${meta.accent}34`} />
          <stop offset="55%" stopColor={`${seasonTint}22`} />
          <stop offset="100%" stopColor="rgba(4,8,14,0)" />
        </radialGradient>
      </defs>

      {/* Cosmic Heritage Manuscript Stage */}
      <rect width="760" height="360" rx="8" fill="#040812" />
      <rect width="760" height="360" rx="8" fill={`url(#${uidPrefix}-aura)`} />

      {/* Seasonal Atmosphere Ambient Motion (Raindrops in Kharif, Golden Embers in Rabi, Solar Waves in Zaid) */}
      {season === "kharif" && (
        <g stroke="#7dd3fc" strokeOpacity="0.28" strokeWidth="1.5" strokeDasharray="6 14">
          {[95, 195, 295, 465, 565, 665].map((rx, idx) => (
            <line key={rx} x1={rx} y1="48" x2={rx - 22} y2="305">
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-40"
                dur={`${1.1 + (idx % 3) * 0.25}s`}
                repeatCount="indefinite"
              />
            </line>
          ))}
        </g>
      )}

      {season === "rabi" && (
        <g>
          {[110, 210, 310, 450, 550, 650].map((gx, idx) => {
            const floatY = 280 - (((progress + idx * 0.17) % 1) * 210);
            return (
              <circle
                key={gx}
                cx={gx + Math.sin((progress + idx) * 6.28) * 10}
                cy={floatY}
                r="2.4"
                fill="#fde68a"
                fillOpacity="0.45"
              />
            );
          })}
        </g>
      )}

      {season === "zaid" && (
        <g transform="translate(380, 178)">
          <circle
            r={85 + wave * 80}
            fill="none"
            stroke="#fb923c"
            strokeOpacity={0.22 * (1 - wave)}
            strokeWidth="2"
          />
        </g>
      )}

      {/* Subtle Mandala / Coordinate Grid */}
      <g stroke="rgba(255,255,255,0.04)" strokeWidth="1">
        {[72, 144, 216, 288].map((y) => (
          <line key={y} x1="0" y1={y} x2="760" y2={y} />
        ))}
        {[152, 304, 456, 608].map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2="360" />
        ))}
      </g>

      {/* Dual Counter-Rotating Celestial Mandala Orbit Rings Behind Scene */}
      <g transform="translate(380, 178)">
        <circle r="138" fill="none" stroke={meta.accent} strokeOpacity="0.16" strokeWidth="1.3" strokeDasharray="10 8">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="28s" repeatCount="indefinite" />
        </circle>
        <circle r="112" fill="none" stroke={seasonTint} strokeOpacity="0.26" strokeWidth="1.6" strokeDasharray="6 6">
          <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="18s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Top Non-Overlapping Heritage + Active Season HUD Strip */}
      <g transform="translate(18, 12)">
        <rect width="348" height="26" rx="4" fill="rgba(7,12,24,0.92)" stroke={`${meta.accent}55`} />
        <text x="12" y="17" fill={meta.accent} fontSize="10" fontWeight="800" fontFamily="monospace">
          {meta.heritageBadge}
        </text>
      </g>

      <g transform="translate(386, 12)">
        <rect width="356" height="26" rx="4" fill="rgba(7,12,24,0.92)" stroke={`${seasonMeta.accent}66`} />
        <text x="178" y="17" textAnchor="middle" fill={seasonMeta.accent} fontSize="9.5" fontWeight="800" fontFamily="monospace">
          {seasonMeta.shortLabel.toUpperCase()} · {dateWindowLabel}
        </text>
      </g>

      {/* ==========================================================
          1. OVERVIEW: GRAM SABHA CHAKRA & KAKATIYA MANDAPAM PILLARS
      ========================================================== */}
      {domain === "overview" && (
        <g>
          <rect x="195" y="256" width="370" height="16" rx="3" fill="#1e293b" stroke="#ff9933" strokeWidth="1.8" />
          <rect x="215" y="242" width="330" height="14" rx="2" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.2" />
          {[245, 312, 380, 448, 515].map((px, i) => (
            <g key={px}>
              <rect x={px - 7} y="158" width="14" height="84" fill="#1e293b" stroke="#ff9933" strokeOpacity="0.65" strokeWidth="1.4" />
              <circle cx={px} cy="154" r="5" fill={i % 2 === 0 ? "#ff9933" : seasonTint} />
            </g>
          ))}
          <polygon points="190,152 380,104 570,152" fill="#0b1526" stroke="#ff9933" strokeWidth="2.2" />

          <g transform="translate(380, 178)">
            <circle r="54" fill="rgba(255,153,51,0.12)" stroke="#fbbf24" strokeWidth="3" />
            <circle r="14" fill="#ff9933" />
            <g>
              <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="14s" repeatCount="indefinite" />
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                <line
                  key={deg}
                  x1="0"
                  y1="0"
                  x2={Math.cos((deg * Math.PI) / 180) * 52}
                  y2={Math.sin((deg * Math.PI) / 180) * 52}
                  stroke="#fde68a"
                  strokeWidth="2"
                />
              ))}
            </g>
          </g>

          <path d="M 85 180 C 175 140, 240 165, 326 178" fill="none" stroke="#ff9933" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M 434 178 C 520 165, 585 140, 675 180" fill="none" stroke={seasonTint} strokeWidth="2.5" strokeDasharray="6 6" />
          <circle r="5" fill="#fbbf24">
            <animateMotion dur="2.6s" repeatCount="indefinite" path="M 85 180 C 175 140, 240 165, 326 178" />
          </circle>
          <circle r="5" fill={seasonTint}>
            <animateMotion dur="2.6s" repeatCount="indefinite" path="M 434 178 C 520 165, 585 140, 675 180" />
          </circle>

          <g transform="translate(24, 150)">
            <rect width="116" height="58" rx="4" fill="rgba(15,23,42,0.92)" stroke="#ff9933" strokeWidth="1.3" />
            <text x="58" y="24" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="800">GRAM SABHA</text>
            <text x="58" y="42" textAnchor="middle" fill="#e2e8f0" fontSize="9.5">Copper &amp; Stone</text>
          </g>
          <g transform="translate(620, 150)">
            <rect width="116" height="58" rx="4" fill="rgba(15,23,42,0.92)" stroke={seasonTint} strokeWidth="1.3" />
            <text x="58" y="24" textAnchor="middle" fill={seasonTint} fontSize="10" fontWeight="800">JAN—DRISHTI</text>
            <text x="58" y="42" textAnchor="middle" fill="#e2e8f0" fontSize="9.5">Season Action Plan</text>
          </g>
        </g>
      )}

      {/* ==========================================================
          2. EDUCATION: PALM-LEAF MANUSCRIPT + AKHANDA DEEPA
      ========================================================== */}
      {domain === "education" && (
        <g>
          <rect x="200" y="218" width="360" height="58" rx="8" fill="#1e150e" stroke="#f59e0b" strokeWidth="2.2" />
          <circle cx="242" cy="247" r="6" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.8" />
          <circle cx="518" cy="247" r="6" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.8" />
          {[234, 248, 262].map((ly, idx) => (
            <line
              key={ly}
              x1="268"
              y1={ly}
              x2={395 + ((wave + idx * 0.3) % 1) * 95}
              y2={ly}
              stroke={idx % 2 === 0 ? "#fde68a" : "#fb923c"}
              strokeWidth="2.5"
              strokeDasharray="6 4"
            />
          ))}

          <g transform="translate(380, 178)">
            <circle cx="0" cy="-42" r={22 + wave * 64} fill="none" stroke="#fbbf24" strokeWidth="2" strokeOpacity={1 - wave} />
            <circle cx="0" cy="-42" r={16 + pulse * 58} fill="none" stroke="#ef4444" strokeWidth="1.6" strokeOpacity={1 - pulse} />
            <polygon points="-34,26 34,26 22,12 -22,12" fill="#d97706" />
            <rect x="-8" y="-8" width="16" height="22" fill="#f59e0b" />
            <ellipse cx="0" cy="-10" rx="34" ry="10" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />
            <path
              d={`M 0 -58 C ${-14 - wave * 3} -34, -12 -14, 0 -14 C 12 -14, ${14 + wave * 3} -34, 0 -58 Z`}
              fill="#fef08a"
              stroke="#ef4444"
              strokeWidth="2"
            />
          </g>

          {["M 380 120 Q 255 92 145 130", "M 380 120 Q 505 92 615 130"].map((p, idx) => (
            <g key={idx}>
              <path d={p} fill="none" stroke="#fbbf24" strokeOpacity="0.45" strokeWidth="2" strokeDasharray="5 5" />
              <circle r="4.5" fill="#fde68a">
                <animateMotion dur="2.4s" repeatCount="indefinite" path={p} />
              </circle>
            </g>
          ))}

          <g transform="translate(30, 128)">
            <rect width="142" height="54" rx="4" fill="rgba(15,23,42,0.92)" stroke="#ef4444" strokeWidth="1.3" />
            <text x="71" y="23" textAnchor="middle" fill="#fca5a5" fontSize="10" fontWeight="800">ANCIENT GHATIKA</text>
            <text x="71" y="40" textAnchor="middle" fill="#e2e8f0" fontSize="9.5">Shared Niti Learning</text>
          </g>
          <g transform="translate(588, 128)">
            <rect width="142" height="54" rx="4" fill="rgba(15,23,42,0.92)" stroke="#fbbf24" strokeWidth="1.3" />
            <text x="71" y="23" textAnchor="middle" fill="#fde68a" fontSize="10" fontWeight="800">DIGITAL SCHOOLS</text>
            <text x="71" y="40" textAnchor="middle" fill="#e2e8f0" fontSize="9.5">Girls&apos; STEM &amp; Bridge</text>
          </g>
        </g>
      )}

      {/* ==========================================================
          3. HEALTH: DHANVANTARI KALASHA, LOTUS & RITU-CHARYA
      ========================================================== */}
      {domain === "health" && (
        <g>
          <g transform="translate(380, 224)">
            {[-48, -24, 0, 24, 48].map((ang, i) => (
              <ellipse
                key={ang}
                cx="0"
                cy="-30"
                rx="16"
                ry="44"
                transform={`rotate(${ang * (0.85 + 0.15 * wave)})`}
                fill={i === 2 ? "#10b981" : "#14b8a6"}
                fillOpacity={0.28 + (i === 2 ? 0.28 : 0.12)}
                stroke="#34d399"
                strokeWidth="1.4"
              />
            ))}
            <ellipse cx="0" cy="-16" rx="38" ry="30" fill="#064e3b" stroke="#34d399" strokeWidth="2.4" />
            <rect x="-18" y="-52" width="36" height="14" rx="3" fill="#0f766e" stroke="#6ee7b7" strokeWidth="1.6" />
            <path d="M 0 -52 C -24 -86 -42 -68 -14 -48 Z" fill="#22c55e" />
            <path d="M 0 -52 C 24 -86 42 -68 14 -48 Z" fill="#10b981" />
            <path d="M 0 -52 C -8 -98 8 -98 0 -52 Z" fill="#4ade80" />
          </g>

          <path d="M 135 200 C 215 110, 285 265, 380 185 C 475 105, 545 260, 625 180" fill="none" stroke="#10b981" strokeWidth="2.8" strokeOpacity="0.48" />
          {[0, 0.8, 1.6].map((d, idx) => (
            <circle key={idx} r="5" fill={idx === 1 ? seasonTint : "#6ee7b7"}>
              <animateMotion
                dur="3.2s"
                begin={`${d}s`}
                repeatCount="indefinite"
                path="M 135 200 C 215 110, 285 265, 380 185 C 475 105, 545 260, 625 180"
              />
            </circle>
          ))}

          <g transform="translate(26, 152)">
            <rect width="136" height="58" rx="4" fill="rgba(15,23,42,0.92)" stroke="#10b981" strokeWidth="1.3" />
            <text x="68" y="23" textAnchor="middle" fill="#6ee7b7" fontSize="10" fontWeight="800">RITU-CHARYA</text>
            <text x="68" y="41" textAnchor="middle" fill="#e2e8f0" fontSize="9.5">Seasonal Hygiene</text>
          </g>
          <g transform="translate(598, 152)">
            <rect width="136" height="58" rx="4" fill="rgba(15,23,42,0.92)" stroke="#14b8a6" strokeWidth="1.3" />
            <text x="68" y="23" textAnchor="middle" fill="#5eead4" fontSize="10" fontWeight="800">WASH SHIELD</text>
            <text x="68" y="41" textAnchor="middle" fill="#e2e8f0" fontSize="9.5">Palle Dawakhana</text>
          </g>
        </g>
      )}

      {/* ==========================================================
          4. WATER: KAKATIYA GOLUSU KATTU (LEVELS ADAPT BY SEASON!)
      ========================================================== */}
      {domain === "water" && (
        <g>
          {(() => {
            // Monsoon = brimming high, Rabi = medium-full active release, Summer = low bed showing desiltation focus
            const levelOffset = season === "kharif" ? 16 : season === "zaid" ? 42 : 26;
            const flowSpeed = season === "kharif" ? "1.35s" : season === "zaid" ? "3.2s" : "2.1s";
            return (
              <g>
                <g transform="translate(86, 86)">
                  <rect width="142" height="62" rx="4" fill="#082f49" stroke="#38bdf8" strokeWidth="2" />
                  <path
                    d={`M 4 ${levelOffset + wave * 3} Q 40 ${levelOffset - 4} 72 ${levelOffset} T 138 ${levelOffset} L 138 58 L 4 58 Z`}
                    fill="#06b6d4"
                    fillOpacity="0.65"
                  />
                  <text x="71" y="18" textAnchor="middle" fill="#e0f2fe" fontSize="9.5" fontWeight="800">1. UPLAND TANK</text>
                </g>

                <g transform="translate(308, 146)">
                  <rect width="144" height="64" rx="4" fill="#082f49" stroke="#38bdf8" strokeWidth="2" />
                  <path
                    d={`M 4 ${levelOffset + pulse * 3} Q 42 ${levelOffset - 4} 74 ${levelOffset} T 140 ${levelOffset} L 140 60 L 4 60 Z`}
                    fill="#0ea5e9"
                    fillOpacity="0.68"
                  />
                  <text x="72" y="18" textAnchor="middle" fill="#e0f2fe" fontSize="9.5" fontWeight="800">2. CHAIN TANK (GOLUSU)</text>
                </g>

                <g transform="translate(532, 206)">
                  <rect width="146" height="64" rx="4" fill="#082f49" stroke="#10b981" strokeWidth="2" />
                  <path
                    d={`M 4 ${levelOffset + wave * 3} Q 42 ${levelOffset - 4} 74 ${levelOffset} T 142 ${levelOffset} L 142 60 L 4 60 Z`}
                    fill="#10b981"
                    fillOpacity="0.58"
                  />
                  <text x="73" y="18" textAnchor="middle" fill="#d1fae5" fontSize="9.5" fontWeight="800">3. AQUIFER &amp; TAP</text>
                </g>

                <path d="M 228 118 Q 272 118 308 176" fill="none" stroke="#38bdf8" strokeWidth="5" strokeDasharray="7 5" />
                <path d="M 452 178 Q 496 178 532 236" fill="none" stroke="#22d3ee" strokeWidth="5" strokeDasharray="7 5" />
                <path d="M 157 152 Q 280 282 595 274" fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeDasharray="4 6" />

                {[0, 0.7, 1.4].map((d, idx) => (
                  <g key={idx}>
                    <circle r="5" fill="#bae6fd">
                      <animateMotion dur={flowSpeed} begin={`${d}s`} repeatCount="indefinite" path="M 228 118 Q 272 118 308 176" />
                    </circle>
                    <circle r="5" fill="#6ee7b7">
                      <animateMotion dur={flowSpeed} begin={`${d}s`} repeatCount="indefinite" path="M 452 178 Q 496 178 532 236" />
                    </circle>
                    <circle r="4" fill="#38bdf8">
                      <animateMotion dur="3.4s" begin={`${d}s`} repeatCount="indefinite" path="M 157 152 Q 280 282 595 274" />
                    </circle>
                  </g>
                ))}
              </g>
            );
          })()}
        </g>
      )}

      {/* ==========================================================
          5. LIVELIHOOD: SHRENI GUILD WHEEL + BALANCED SCALES
      ========================================================== */}
      {domain === "livelihood" && (
        <g>
          <g transform="translate(380, 174)">
            <circle r="68" fill="rgba(236,72,153,0.1)" stroke="#ec4899" strokeWidth="4" />
            <circle r="52" fill="none" stroke="#f59e0b" strokeWidth="8" strokeDasharray="16 12">
              <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="12s" repeatCount="indefinite" />
            </circle>
            <g>
              <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="16s" repeatCount="indefinite" />
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <line
                  key={deg}
                  x1="0"
                  y1="0"
                  x2={Math.cos((deg * Math.PI) / 180) * 50}
                  y2={Math.sin((deg * Math.PI) / 180) * 50}
                  stroke="#fde68a"
                  strokeWidth="2.5"
                />
              ))}
            </g>
            <circle r="16" fill="#ec4899" stroke="#ffffff" strokeWidth="2" />
          </g>

          <g transform={`translate(380, 174) rotate(${(wave - 0.5) * 9})`}>
            <line x1="-148" y1="0" x2="148" y2="0" stroke="#fbbf24" strokeWidth="3.5" />
            <line x1="-148" y1="0" x2="-148" y2="46" stroke="#cbd5e1" strokeWidth="2" />
            <line x1="148" y1="0" x2="148" y2="46" stroke="#cbd5e1" strokeWidth="2" />
            <path d="M -174 46 Q -148 70 -122 46 Z" fill="#f97316" />
            <path d="M 122 46 Q 148 70 174 46 Z" fill="#10b981" />
          </g>

          <g transform="translate(28, 228)">
            <rect width="144" height="52" rx="4" fill="rgba(15,23,42,0.92)" stroke="#ec4899" strokeWidth="1.3" />
            <text x="72" y="21" textAnchor="middle" fill="#f9a8d4" fontSize="10" fontWeight="800">SHRENI COLLECTIVE</text>
            <text x="72" y="39" textAnchor="middle" fill="#e2e8f0" fontSize="9.5">Mutual Craft &amp; Grain</text>
          </g>
          <g transform="translate(588, 228)">
            <rect width="144" height="52" rx="4" fill="rgba(15,23,42,0.92)" stroke="#10b981" strokeWidth="1.3" />
            <text x="72" y="21" textAnchor="middle" fill="#6ee7b7" fontSize="10" fontWeight="800">SHG &amp; FPO CREDIT</text>
            <text x="72" y="39" textAnchor="middle" fill="#e2e8f0" fontSize="9.5">Dignified Fair Price</text>
          </g>
        </g>
      )}

      {/* ==========================================================
          6. ENVIRONMENT: SACRED GROVE + PANCHA-MAHABHUTA ORBIT
      ========================================================== */}
      {domain === "environment" && (
        <g>
          <g transform="translate(380, 96)">
            <circle
              r={(season === "zaid" ? 30 : 24) + wave * 6}
              fill={season === "kharif" ? "#bae6fd" : "#fbbf24"}
              fillOpacity={season === "kharif" ? "0.6" : "0.85"}
            />
            <circle r={42 + pulse * 10} fill="none" stroke="#fde68a" strokeOpacity="0.45" strokeWidth="1.8" strokeDasharray="5 5" />
          </g>

          <path d="M 190 278 Q 380 250 570 278 L 570 296 L 190 296 Z" fill="#064e3b" stroke="#84cc16" strokeWidth="2" />
          <path d="M 368 272 L 372 174 L 344 146 L 354 138 L 378 162 L 384 134 L 394 164 L 418 140 L 426 148 L 392 176 L 394 272 Z" fill="#92400e" />
          <g transform={`translate(382, 156) scale(${0.92 + wave * 0.08})`}>
            <circle cx="0" cy="-16" r="44" fill="#16a34a" fillOpacity="0.9" />
            <circle cx="-38" cy="8" r="34" fill="#22c55e" fillOpacity="0.86" />
            <circle cx="38" cy="8" r="34" fill="#10b981" fillOpacity="0.86" />
            <circle cx="0" cy="20" r="36" fill="#4ade80" fillOpacity="0.72" />
          </g>

          <g transform="translate(380, 178)">
            <animateTransform attributeName="transform" type="rotate" from="0 380 178" to="360 380 178" dur="18s" repeatCount="indefinite" additive="sum" />
            {[
              { deg: 0, label: "PRITHVI", col: "#84cc16" },
              { deg: 72, label: "JALA", col: "#38bdf8" },
              { deg: 144, label: "AGNI/SOLAR", col: "#fbbf24" },
              { deg: 216, label: "VAYU", col: "#6ee7b7" },
              { deg: 288, label: "AKASHA", col: "#c084fc" },
            ].map((el) => {
              const x = Math.cos((el.deg * Math.PI) / 180) * 124;
              const y = Math.sin((el.deg * Math.PI) / 180) * 92;
              return (
                <g key={el.label} transform={`translate(${x}, ${y})`}>
                  <circle r="7" fill={el.col} stroke="#0f172a" strokeWidth="2" />
                </g>
              );
            })}
          </g>

          <g transform="translate(26, 152)">
            <rect width="136" height="58" rx="4" fill="rgba(15,23,42,0.92)" stroke="#84cc16" strokeWidth="1.3" />
            <text x="68" y="23" textAnchor="middle" fill="#bef264" fontSize="10" fontWeight="800">SACRED GROVE</text>
            <text x="68" y="41" textAnchor="middle" fill="#e2e8f0" fontSize="9.5">Bhumi Stewardship</text>
          </g>
          <g transform="translate(598, 152)">
            <rect width="136" height="58" rx="4" fill="rgba(15,23,42,0.92)" stroke="#22c55e" strokeWidth="1.3" />
            <text x="68" y="23" textAnchor="middle" fill="#86efac" fontSize="10" fontWeight="800">CLEAN SOLAR</text>
            <text x="68" y="41" textAnchor="middle" fill="#e2e8f0" fontSize="9.5">Haritha + KUSUM</text>
          </g>
        </g>
      )}

      {/* Bottom Non-Overlapping Synthesis Bridge Strip */}
      <g transform="translate(18, 316)">
        <rect width="724" height="30" rx="4" fill="rgba(7,12,24,0.92)" stroke="rgba(255,255,255,0.14)" />
        <text x="14" y="19" fill={meta.accent} fontSize="9.5" fontWeight="800" fontFamily="monospace">
          ● {meta.title.toUpperCase()}
        </text>
        <text x="710" y="19" textAnchor="end" fill="#6ee7b7" fontSize="9.5" fontWeight="700" fontFamily="monospace">
          → {meta.modernEcho}
        </text>
      </g>
    </svg>
  );
}

export default function AncientWisdomVisual({
  domain,
  compact = false,
}: {
  domain: AncientWisdomDomain;
  compact?: boolean;
}) {
  const progress = useContinuousWisdomPhase(8400);
  const [cinemaOpen, setCinemaOpen] = useState(false);

  // Default to current November 2026 Rabi / Yasangi cropping season date window
  const [fromDate, setFromDate] = useState("2026-11-01");
  const [toDate, setToDate] = useState("2027-02-28");

  const activeSeason = useMemo(
    () => classifyDateRangeToSeason(fromDate, toDate),
    [fromDate, toDate]
  );

  const seasonMeta =
    SEASON_PRESETS.find((s) => s.key === activeSeason) ?? SEASON_PRESETS[0];
  const seasonalRule = SEASONAL_WISDOM[domain][activeSeason];
  const meta = WISDOM_META[domain];

  const dateWindowLabel = `${formatShortDate(fromDate)} – ${formatShortDate(toDate)}`;

  const handlePresetClick = (preset: SeasonPresetMeta) => {
    setFromDate(preset.defaultFrom);
    setToDate(preset.defaultTo);
  };

  return (
    <div className="space-y-3.5">
      {/* Header + Date-Range / Cropping Season Filter Controls */}
      <div className="border border-white/12 bg-[#060b14] p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-300">
            <Sparkles size={13} />
            <span>LIVE CONTINUOUS ANCIENT WISDOM · SEASONAL &amp; CROPPING FILTER</span>
          </div>

          <button
            type="button"
            onClick={() => setCinemaOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold bg-gradient-to-r from-amber-600 to-cyan-600 hover:opacity-95 text-white transition shrink-0"
          >
            <Maximize2 size={12} />
            <span>Expanded Wisdom View</span>
          </button>
        </div>

        {/* Date Range Picker + Quick Cropping Season Pills */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-t border-white/10 pt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {SEASON_PRESETS.map((preset) => {
              const isSelected = activeSeason === preset.key;
              const PresetIcon =
                preset.key === "kharif"
                  ? CloudRain
                  : preset.key === "rabi"
                  ? Wheat
                  : preset.key === "zaid"
                  ? Sun
                  : Compass;
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium border transition whitespace-nowrap ${
                    isSelected
                      ? "text-white bg-white/12"
                      : "border-white/15 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/30"
                  }`}
                  style={{
                    borderColor: isSelected ? preset.accent : undefined,
                  }}
                >
                  <PresetIcon size={12} style={{ color: preset.accent }} />
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>

          {/* Custom Date-Range Inputs */}
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 text-white/60 font-mono">
              <Calendar size={12} className="text-amber-300" />
              <span>Date Range:</span>
            </span>
            <input
              type="date"
              aria-label="Seasonal wisdom start date"
              value={fromDate}
              onChange={(e) => {
                const next = e.target.value;
                setFromDate(next);
                if (next && toDate && next > toDate) setToDate(next);
              }}
              className="border border-white/15 bg-[#040812] px-2 py-1 text-[11px] font-mono text-white focus:border-amber-400 focus:outline-none"
            />
            <span className="text-white/40">to</span>
            <input
              type="date"
              aria-label="Seasonal wisdom end date"
              value={toDate}
              onChange={(e) => {
                const next = e.target.value;
                setToDate(next);
                if (next && fromDate && next < fromDate) setFromDate(next);
              }}
              className="border border-white/15 bg-[#040812] px-2 py-1 text-[11px] font-mono text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Continuous Graphical Visual */}
      <div
        className={`border border-white/12 bg-[#040812] overflow-hidden shadow-xl ${
          compact ? "max-w-full" : ""
        }`}
      >
        <AncientWisdomSVG
          domain={domain}
          season={activeSeason}
          dateWindowLabel={dateWindowLabel}
          progress={progress}
          uidPrefix={`wisdom-${domain}-${compact ? "banner" : "overview"}`}
        />
      </div>

      {/* Context-Specific Cropping Season & Ritu Wisdom Directive */}
      <div
        className="border bg-[#060b14]/90 p-4 grid md:grid-cols-2 gap-4"
        style={{ borderColor: `${seasonMeta.accent}45` }}
      >
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono font-bold" style={{ color: seasonMeta.accent }}>
            <span>{seasonalRule.rituTag}</span>
            <span className="text-white/30">·</span>
            <span className="text-white/70 font-normal">{seasonalRule.cropWindow}</span>
          </div>
          <p className="text-xs leading-6 text-white/85">
            <strong className="text-white">Classical Seasonal Wisdom:</strong>{" "}
            {seasonalRule.classicalPrinciple}
          </p>
        </div>

        <div className="space-y-1 md:border-l md:border-white/10 md:pl-4">
          <div className="text-[11px] font-mono font-bold text-emerald-300">
            CONTEXTUAL VILLAGE EXECUTION ({dateWindowLabel})
          </div>
          <p className="text-xs leading-6 text-white/75">
            {seasonalRule.actionDirective}
          </p>
        </div>
      </div>

      {/* Full-Screen Cinema Modal */}
      {cinemaOpen && (
        <div className="fixed inset-0 z-[160] flex flex-col justify-between overflow-y-auto bg-[#03060d]/97 backdrop-blur-2xl text-white p-5 md:p-8">
          <div className="max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono font-bold tracking-[0.2em]" style={{ color: seasonMeta.accent }}>
                {seasonalRule.rituTag} · {dateWindowLabel}
              </div>
              <h2 className="mt-1 text-xl md:text-3xl font-bold text-white">
                {meta.title}
              </h2>
              <p className="mt-1 text-xs md:text-sm text-white/75">
                {seasonalRule.classicalPrinciple}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCinemaOpen(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white text-slate-900 hover:bg-orange-100 shrink-0"
            >
              <X size={14} />
              <span>Close Expanded View</span>
            </button>
          </div>

          <div className="max-w-5xl w-full mx-auto my-4">
            <AncientWisdomSVG
              domain={domain}
              season={activeSeason}
              dateWindowLabel={dateWindowLabel}
              progress={progress}
              uidPrefix={`wisdom-${domain}-modal`}
            />
          </div>

          <div className="max-w-6xl w-full mx-auto space-y-2">
            <div className="text-xs text-emerald-300 font-medium">
              Seasonal Action: <span className="text-white/85">{seasonalRule.actionDirective}</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 overflow-hidden">
              <div
                className="h-full"
                style={{
                  width: `${Math.round(progress * 100)}%`,
                  background: `linear-gradient(90deg, ${meta.accent}, ${seasonMeta.accent}, ${meta.secondaryAccent})`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
