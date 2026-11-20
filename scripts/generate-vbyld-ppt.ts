import path from "path";
import fs from "fs";
import PptxGenJS from "pptxgenjs";

const ROOT = process.cwd();
const OUT_PATH = path.join(ROOT, "public", "JAN-DRISHTI_VBYLD_IITH_Pitch.pptx");
const SDG_DIR = path.join(ROOT, "public", "assets", "sdg");

const C = {
  bg: "070C16",
  panel: "0E1628",
  panelAlt: "111C33",
  border: "23324D",
  white: "FFFFFF",
  text: "E2E8F0",
  muted: "94A3B8",
  saffron: "F59E0B",
  emerald: "10B981",
  cyan: "38BDF8",
  rose: "F43F5E",
  violet: "A78BFA",
};

function addFooter(slide: PptxGenJS.Slide, pageNum: number, totalPages: number, tag: string) {
  slide.addShape("rect", {
    x: 0.6,
    y: 7.02,
    w: 12.133,
    h: 0.015,
    fill: { color: C.border },
    line: { color: C.border, width: 0 },
  });
  slide.addText(
    `JAN—DRISHTI  |  VBYLD Hack for Social Cause (State Level · IITH Jury)  |  ${tag}`,
    {
      x: 0.6,
      y: 7.08,
      w: 10.5,
      h: 0.28,
      fontSize: 9,
      color: C.muted,
      fontFace: "Calibri",
    }
  );
  slide.addText(`${pageNum} / ${totalPages}`, {
    x: 11.4,
    y: 7.08,
    w: 1.333,
    h: 0.28,
    fontSize: 9,
    bold: true,
    color: C.saffron,
    align: "right",
    fontFace: "Consolas",
  });
}

function addHeader(
  slide: PptxGenJS.Slide,
  kicker: string,
  title: string,
  accentHex: string = C.cyan
) {
  slide.addShape("rect", {
    x: 0.6,
    y: 0.42,
    w: 0.08,
    h: 0.72,
    fill: { color: accentHex },
    line: { color: accentHex, width: 0 },
  });
  slide.addText(kicker.toUpperCase(), {
    x: 0.82,
    y: 0.38,
    w: 11.5,
    h: 0.24,
    fontSize: 10,
    bold: true,
    color: accentHex,
    charSpacing: 1.4,
    fontFace: "Calibri",
  });
  slide.addText(title, {
    x: 0.82,
    y: 0.63,
    w: 11.9,
    h: 0.52,
    fontSize: 24,
    bold: true,
    color: C.white,
    fontFace: "Calibri",
  });
}

async function buildDeck() {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
  pptx.author = "Team JAN-DRISHTI · VBYLD State Level";
  pptx.company = "JAN-DRISHTI";
  pptx.subject = "VBYLD Hack for Social Cause — IIT Hyderabad Jury Pitch";
  pptx.title = "JAN-DRISHTI: Rural Spatial Intelligence & Citizen Action (Viksit Bharat @ 2047)";

  const totalSlides = 8;

  // =========================================================================
  // SLIDE 1: TITLE & OPENING HOOK
  // =========================================================================
  {
    const s = pptx.addSlide();
    s.background = { color: C.bg };

    // Top Saffron + Emerald accent bar
    s.addShape("rect", { x: 0, y: 0, w: 6.67, h: 0.08, fill: { color: C.saffron } });
    s.addShape("rect", { x: 6.67, y: 0, w: 6.663, h: 0.08, fill: { color: C.emerald } });

    s.addText("VBYLD · HACK FOR SOCIAL CAUSE  |  STATE LEVEL FINALS · IIT HYDERABAD JURY", {
      x: 0.7,
      y: 0.55,
      w: 11.9,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: C.saffron,
      charSpacing: 1.5,
      fontFace: "Calibri",
    });

    // Hook Box
    s.addShape("rect", {
      x: 0.7,
      y: 1.05,
      w: 11.93,
      h: 2.35,
      fill: { color: C.panel },
      line: { color: C.border, width: 1.2 },
    });
    s.addShape("rect", {
      x: 0.7,
      y: 1.05,
      w: 0.1,
      h: 2.35,
      fill: { color: C.emerald },
    });

    s.addText(
      `“Imagine walking on a clean road, drinking clean water, breathing fresh air, finding real job opportunities near home, and having affordable education for every child and affordable healthcare services.”`,
      {
        x: 1.05,
        y: 1.25,
        w: 11.25,
        h: 1.95,
        fontSize: 23,
        italic: true,
        bold: true,
        color: C.white,
        fontFace: "Calibri",
        valign: "middle",
      }
    );

    // Brand Title
    s.addText("JAN—DRISHTI", {
      x: 0.7,
      y: 3.72,
      w: 8.5,
      h: 0.75,
      fontSize: 42,
      bold: true,
      color: C.white,
      fontFace: "Calibri",
    });
    s.addText(
      "Village-Scale Spatial Intelligence, 2047 Policy Simulation & Citizen Obligation Engine",
      {
        x: 0.7,
        y: 4.46,
        w: 11.8,
        h: 0.38,
        fontSize: 16,
        color: C.cyan,
        fontFace: "Calibri",
      }
    );

    // 6-Pillars Mapping Strip matching the hook 1-to-1
    const hookMap = [
      { label: "Clean Roads & Air", sector: "Environment", col: C.emerald },
      { label: "Clean Drinking Water", sector: "Water & Lakes", col: C.cyan },
      { label: "Jobs Near Home", sector: "Livelihood", col: C.saffron },
      { label: "Affordable Education", sector: "Education", col: C.rose },
      { label: "Affordable Healthcare", sector: "Health", col: C.violet },
    ];
    hookMap.forEach((item, idx) => {
      const xPos = 0.7 + idx * 2.42;
      s.addShape("rect", {
        x: xPos,
        y: 5.25,
        w: 2.26,
        h: 1.25,
        fill: { color: C.panelAlt },
        line: { color: C.border, width: 1 },
      });
      s.addShape("rect", {
        x: xPos,
        y: 5.25,
        w: 2.26,
        h: 0.06,
        fill: { color: item.col },
      });
      s.addText(item.sector.toUpperCase(), {
        x: xPos + 0.14,
        y: 5.42,
        w: 1.98,
        h: 0.25,
        fontSize: 10,
        bold: true,
        color: item.col,
        fontFace: "Calibri",
      });
      s.addText(item.label, {
        x: xPos + 0.14,
        y: 5.72,
        w: 1.98,
        h: 0.65,
        fontSize: 13.5,
        bold: true,
        color: C.white,
        fontFace: "Calibri",
      });
    });

    addFooter(s, 1, totalSlides, "Opening Hook & Vision 2047");
    s.addNotes(
      `[0:00-0:25] Pause 1 second, look at the IITH jury, and deliver the exact hook slowly:\n` +
        `"Imagine walking on a clean road, drinking clean water, breathing fresh air, finding real job opportunities near home, and having affordable education for every child and affordable healthcare services."\n` +
        `(Pause 2 seconds.)\n` +
        `"For most of us at IIT Hyderabad today, that feels normal. For Raju, a 17-year-old growing up in a small Telangana village, it still feels like a distant city. That is why we built JAN—DRISHTI."`
    );
  }

  // =========================================================================
  // SLIDE 2: THE STORY — RAJU'S MORNING & THE SILO TRAP (RELEVANCE)
  // =========================================================================
  {
    const s = pptx.addSlide();
    s.background = { color: C.bg };
    addHeader(
      s,
      "Relevance & Real-World Problem",
      "Raju's Morning: Why Rural Challenges Compound in Silos",
      C.rose
    );

    const morningSteps = [
      {
        time: "06:00 AM",
        pillar: "ENVIRONMENT & HEALTH",
        story: "Mother cooks over indoor smoke because nobody helped complete clean-fuel e-KYC.",
        col: C.saffron,
      },
      {
        time: "07:15 AM",
        pillar: "WATER SECURITY",
        story: "Local pond & feeder channel stay silted until summer borewells run dry.",
        col: C.cyan,
      },
      {
        time: "09:00 AM",
        pillar: "LIVELIHOOD & MANDI",
        story: "Father sells raw chillies locally at a ₹1,800/qtl loss vs. another yard 18 km away.",
        col: C.emerald,
      },
      {
        time: "11:30 AM",
        pillar: "HEALTHCARE & EDUCATION",
        story: "Clinic distance & scattered portals hide ₹10L Aarogyasri cover & ePASS scholarships.",
        col: C.violet,
      },
    ];

    morningSteps.forEach((step, idx) => {
      const xPos = 0.6 + idx * 3.08;
      s.addShape("rect", {
        x: xPos,
        y: 1.45,
        w: 2.9,
        h: 3.1,
        fill: { color: C.panel },
        line: { color: C.border, width: 1 },
      });
      s.addShape("rect", {
        x: xPos,
        y: 1.45,
        w: 2.9,
        h: 0.08,
        fill: { color: step.col },
      });
      s.addText(step.time, {
        x: xPos + 0.18,
        y: 1.66,
        w: 2.54,
        h: 0.32,
        fontSize: 16,
        bold: true,
        color: step.col,
        fontFace: "Consolas",
      });
      s.addText(step.pillar, {
        x: xPos + 0.18,
        y: 2.02,
        w: 2.54,
        h: 0.25,
        fontSize: 10,
        bold: true,
        color: C.muted,
        fontFace: "Calibri",
      });
      s.addText(step.story, {
        x: xPos + 0.18,
        y: 2.38,
        w: 2.54,
        h: 1.95,
        fontSize: 13.5,
        color: C.text,
        fontFace: "Calibri",
        valign: "top",
      });
    });

    // Bottom Root-Cause Insight
    s.addShape("rect", {
      x: 0.6,
      y: 4.85,
      w: 12.13,
      h: 1.85,
      fill: { color: C.panelAlt },
      line: { color: C.rose, width: 1.2 },
    });
    s.addText("TWO CORE SYSTEM FAILURES WE ARE SOLVING", {
      x: 0.85,
      y: 5.02,
      w: 11.6,
      h: 0.28,
      fontSize: 11,
      bold: true,
      color: C.rose,
      fontFace: "Calibri",
    });
    s.addText(
      "1. The Aggregation Blindspot: District & state dashboards hide struggling villages inside broad averages.\n" +
        "2. The Silo & Citizen Gap: Unsafe water causes illness, illness drains crop income, lost income drives youth migration—yet citizens never get one unified tool showing both entitlements and civic action.",
      {
        x: 0.85,
        y: 5.36,
        w: 11.6,
        h: 1.2,
        fontSize: 14,
        color: C.white,
        fontFace: "Calibri",
      }
    );

    addFooter(s, 2, totalSlides, "The Vicious Cycle Story");
    s.addNotes(
      `[0:25-0:55] Walk through Raju's morning: indoor biomass smoke, a silted neighborhood pond, distress crop pricing, and missing scheme paperwork.\n` +
        `Key insight for IITH jury: "These five failures compound on each other in a vicious cycle, yet existing portals inspect them in disconnected silos and only serve officers—never the citizen."`
    );
  }

  // =========================================================================
  // SLIDE 3: INTRODUCING JAN-DRISHTI (3-LAYER SYSTEM)
  // =========================================================================
  {
    const s = pptx.addSlide();
    s.background = { color: C.bg };
    addHeader(
      s,
      "Creativity & Unified Solution",
      "JAN—DRISHTI: Diagnose Locally · Simulate 2047 · Act Together",
      C.emerald
    );

    const layers = [
      {
        num: "01",
        title: "DIAGNOSE THE VILLAGE",
        sub: "Dual GIS + Live Telemetry",
        bullets:
          "• Vector GIS & Satellite views for 11,154 villages\n• Real distance to nearest PHC, school & waterbodies\n• Live Open-Meteo weather, heat alerts & PM2.5\n• Real-time e-NAM mandi price comparison",
        col: C.cyan,
      },
      {
        num: "02",
        title: "SIMULATE TO 2047",
        sub: "Policy & Macro Intelligence",
        bullets:
          "• 5 policy levers with climate stress scenarios\n• Quantitative P50 & P15–P85 uncertainty bands\n• Scenario A vs B comparison + ROI sensitivity\n• Food CPI & Live INR Currency Parity Meter",
        col: C.saffron,
      },
      {
        num: "03",
        title: "ACT AS CITIZENS",
        sub: "30-Sec Relief + Obligations",
        bullets:
          "• Living Village Ecosystem Twin simulator\n• 30-sec Scheme Finder with exact ₹/yr benefits\n• 24×7 Toll-free emergency lifelines (108/104/181)\n• Per-sector UN SDG Actions & Obligations",
        col: C.emerald,
      },
    ];

    layers.forEach((L, idx) => {
      const xPos = 0.6 + idx * 4.11;
      s.addShape("rect", {
        x: xPos,
        y: 1.42,
        w: 3.91,
        h: 3.85,
        fill: { color: C.panel },
        line: { color: L.col, width: 1.2 },
      });
      s.addText(L.num, {
        x: xPos + 0.22,
        y: 1.6,
        w: 0.75,
        h: 0.45,
        fontSize: 22,
        bold: true,
        color: L.col,
        fontFace: "Consolas",
      });
      s.addText(L.title, {
        x: xPos + 0.22,
        y: 2.08,
        w: 3.47,
        h: 0.34,
        fontSize: 15,
        bold: true,
        color: C.white,
        fontFace: "Calibri",
      });
      s.addText(L.sub, {
        x: xPos + 0.22,
        y: 2.42,
        w: 3.47,
        h: 0.28,
        fontSize: 11.5,
        color: L.col,
        fontFace: "Calibri",
      });
      s.addText(L.bullets, {
        x: xPos + 0.22,
        y: 2.85,
        w: 3.47,
        h: 2.25,
        fontSize: 12.5,
        color: C.text,
        fontFace: "Calibri",
        valign: "top",
      });
    });

    // Official SDG visual strip at bottom
    const sdgs = [
      { img: "sdg04.jpg", label: "SDG 04 · Education" },
      { img: "sdg03.jpg", label: "SDG 03 · Health" },
      { img: "sdg06.jpg", label: "SDG 06 · Water" },
      { img: "sdg08.jpg", label: "SDG 08 · Livelihood" },
      { img: "sdg13.jpg", label: "SDG 13 · Environment" },
    ];
    sdgs.forEach((g, idx) => {
      const xPos = 0.6 + idx * 2.45;
      const imgPath = path.join(SDG_DIR, g.img);
      s.addShape("rect", {
        x: xPos,
        y: 5.52,
        w: 2.33,
        h: 1.25,
        fill: { color: C.panelAlt },
        line: { color: C.border, width: 1 },
      });
      if (fs.existsSync(imgPath)) {
        s.addImage({ path: imgPath, x: xPos + 0.12, y: 5.64, w: 1.0, h: 1.0 });
      }
      s.addText(g.label, {
        x: xPos + 1.2,
        y: 5.75,
        w: 1.05,
        h: 0.8,
        fontSize: 11,
        bold: true,
        color: C.white,
        fontFace: "Calibri",
        valign: "middle",
      });
    });

    addFooter(s, 3, totalSlides, "Unified 3-Layer Solution & UN SDGs");
    s.addNotes(
      `[0:55-1:25] Show how JAN—DRISHTI breaks the silo trap in three connected layers aligned to UN SDGs 03, 04, 06, 08, and 13: Diagnose locally, Simulate to 2047, and Act together.`
    );
  }

  // =========================================================================
  // SLIDE 4: TECHNICAL STRENGTH & ZERO-COST SCALABILITY (IITH JURY FOCUS)
  // =========================================================================
  {
    const s = pptx.addSlide();
    s.background = { color: C.bg };
    addHeader(
      s,
      "Technical Strength & Scalability",
      "Real Full-Stack Engineering Built on Zero-Cost Open Data",
      C.cyan
    );

    const kpis = [
      { val: "11,154", lbl: "Villages Mapped", col: C.cyan },
      { val: "444 / 10", lbl: "Mandals & Districts", col: C.emerald },
      { val: "₹0", lbl: "Paid API Dependencies", col: C.saffron },
      { val: "6.4 Lakh", lbl: "Pan-India Ready Scale", col: C.violet },
    ];
    kpis.forEach((k, idx) => {
      const xPos = 0.6 + idx * 3.08;
      s.addShape("rect", {
        x: xPos,
        y: 1.4,
        w: 2.9,
        h: 1.2,
        fill: { color: C.panel },
        line: { color: C.border, width: 1 },
      });
      s.addText(k.val, {
        x: xPos + 0.15,
        y: 1.52,
        w: 2.6,
        h: 0.55,
        fontSize: 26,
        bold: true,
        color: k.col,
        fontFace: "Consolas",
      });
      s.addText(k.lbl, {
        x: xPos + 0.15,
        y: 2.12,
        w: 2.6,
        h: 0.3,
        fontSize: 12,
        color: C.text,
        fontFace: "Calibri",
      });
    });

    // Left Card: Stack & Open Telemetry
    s.addShape("rect", {
      x: 0.6,
      y: 2.85,
      w: 5.9,
      h: 3.9,
      fill: { color: C.panel },
      line: { color: C.border, width: 1 },
    });
    s.addText("PRODUCTION ARCHITECTURE & OPEN TELEMETRY", {
      x: 0.85,
      y: 3.05,
      w: 5.4,
      h: 0.3,
      fontSize: 12,
      bold: true,
      color: C.cyan,
      fontFace: "Calibri",
    });
    s.addText(
      "• Frontend: React 19, TypeScript, Vite, Tailwind v4 & Leaflet Dual GIS\n" +
        "• Backend: Express TypeScript server with pre-warmed spatial indexing\n" +
        "• Hyperlocal Weather & Air: Live Open-Meteo API (Temp, Rain, PM2.5, Heat Risk)\n" +
        "• Waterbodies & Boundaries: TRACGIS minor irrigation tanks + village GeoJSON\n" +
        "• Macroeconomic Feed: Live FX proxy (open.er-api.com) with 15-min TTL cache & offline fallback",
      {
        x: 0.85,
        y: 3.45,
        w: 5.4,
        h: 3.1,
        fontSize: 13,
        color: C.text,
        fontFace: "Calibri",
        valign: "top",
      }
    );

    // Right Card: Quantitative Rigor & Pan-India Scaling
    s.addShape("rect", {
      x: 6.83,
      y: 2.85,
      w: 5.9,
      h: 3.9,
      fill: { color: C.panel },
      line: { color: C.border, width: 1 },
    });
    s.addText("QUANTITATIVE RIGOR & WHY IT SCALES NATIONALLY", {
      x: 7.08,
      y: 3.05,
      w: 5.4,
      h: 0.3,
      fontSize: 12,
      bold: true,
      color: C.emerald,
      fontFace: "Calibri",
    });
    s.addText(
      "• 2026–2047 Simulation Engine: Computes P50 median + P15–P85 uncertainty bands under climate stress & policy ROI sensitivity\n" +
        "• Scenario A vs B Pinning + One-Click CSV Export for district planning\n" +
        "• Zero API Lock-In: No Google Maps billing walls; plug in any state's Census + GeoJSON layer to onboard all 6.4 lakh Indian villages\n" +
        "• Fast & Accessible: Full bilingual UI + dual light/dark contrast modes",
      {
        x: 7.08,
        y: 3.45,
        w: 5.4,
        h: 3.1,
        fontSize: 13,
        color: C.text,
        fontFace: "Calibri",
        valign: "top",
      }
    );

    addFooter(s, 4, totalSlides, "Technical Architecture & National Scale");
    s.addNotes(
      `[1:25-1:55] Directly address IITH technical evaluation:\n` +
        `"We avoided fragile paid APIs and toy mock data. Our Express backend pre-indexes 11,154 real villages, merges TRACGIS waterbodies, streams Open-Meteo weather and global FX with resilient caching, and quantifies 2047 forecast uncertainty with P15–P85 bands."`
    );
  }

  // =========================================================================
  // SLIDE 5: LIVE PROTOTYPE WALKTHROUGH (FUNCTIONALITY)
  // =========================================================================
  {
    const s = pptx.addSlide();
    s.background = { color: C.bg };
    addHeader(
      s,
      "Functionality & Live Demo Cue",
      "75-Second Live Walkthrough: From Map Click to Citizen Relief",
      C.saffron
    );

    const demoSteps = [
      {
        sec: "0:00 – 0:20",
        title: "1. Pick Raju's Village on Dual GIS + Satellite",
        desc: "Show live literacy, sanitation, nearest clinic km, Open-Meteo heat alert, and nearby e-NAM mandi price comparison.",
        col: C.cyan,
      },
      {
        sec: "0:20 – 0:38",
        title: "2. Run 2026–2047 Workbench & Rupee Meter",
        desc: "Move policy sliders, inspect Scenario A vs B uncertainty bands, and view live Rupee comparison against global currencies (KWD, GBP, USD).",
        col: C.saffron,
      },
      {
        sec: "0:38 – 0:58",
        title: "3. Living Village Twin + 30-Sec Scheme Finder",
        desc: "Drag uplift slider (water fills, smoke clears, solar glows) and compute exact family ₹/yr benefits + 108/104 lifelines.",
        col: C.emerald,
      },
      {
        sec: "0:58 – 1:15",
        title: "4. Open Per-Sector SDG Actions & Obligations",
        desc: "Switch to Environment or Water or Health tab, show embedded SDG visual transition, and filter Children / Women / Senior Citizens.",
        col: C.violet,
      },
    ];

    demoSteps.forEach((d, idx) => {
      const yPos = 1.45 + idx * 1.32;
      s.addShape("rect", {
        x: 0.6,
        y: yPos,
        w: 12.13,
        h: 1.12,
        fill: { color: C.panel },
        line: { color: C.border, width: 1 },
      });
      s.addShape("rect", {
        x: 0.6,
        y: yPos,
        w: 1.85,
        h: 1.12,
        fill: { color: C.panelAlt },
      });
      s.addShape("rect", {
        x: 0.6,
        y: yPos,
        w: 0.08,
        h: 1.12,
        fill: { color: d.col },
      });
      s.addText(d.sec, {
        x: 0.78,
        y: yPos + 0.34,
        w: 1.55,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: d.col,
        fontFace: "Consolas",
      });
      s.addText(d.title, {
        x: 2.68,
        y: yPos + 0.14,
        w: 9.8,
        h: 0.36,
        fontSize: 16,
        bold: true,
        color: C.white,
        fontFace: "Calibri",
      });
      s.addText(d.desc, {
        x: 2.68,
        y: yPos + 0.54,
        w: 9.8,
        h: 0.45,
        fontSize: 13,
        color: C.text,
        fontFace: "Calibri",
      });
    });

    addFooter(s, 5, totalSlides, "Live Working Prototype Demo Plan");
    s.addNotes(
      `[1:55-3:10] SWITCH TO LIVE APP WINDOW HERE. While one teammate drives clicks smoothly, keep narrating Raju's story across these 4 live checkpoints.`
    );
  }

  // =========================================================================
  // SLIDE 6: SOCIAL CAUSE IMPACT — MEASURABLE CITIZEN VALUE
  // =========================================================================
  {
    const s = pptx.addSlide();
    s.background = { color: C.bg };
    addHeader(
      s,
      "Social Cause Impact",
      "Real Rupee Relief, Waterbody Revival & Anti-Migration Opportunities",
      C.emerald
    );

    const impacts = [
      {
        heading: "HOUSEHOLD CASH & PROTECTION UNLOCKED",
        items:
          "• Rythu Bharosa: ₹15,000 / acre / year\n" +
          "• Gruha Jyothi + Mahalakshmi LPG: ~₹29,400 / yr saved\n" +
          "• ePASS Scholarship & Hostel Support: ₹28,000+ / yr\n" +
          "• Rajiv Aarogyasri & Rythu Bima: ₹15 Lakh safety net",
        col: C.emerald,
      },
      {
        heading: "AGRICULTURE & ALL-WATERBODY RESILIENCE",
        items:
          "• Protects ALL local waterbodies: lakes, ponds (kuntas), tanks, checkdams, streams (nalas), stepwells & feeder canals\n" +
          "• Real-time e-NAM mandi price discovery avoids distress crop dumping\n" +
          "• Heatwave work-window & PM2.5 advisories protect outdoor farm labor",
        col: C.cyan,
      },
      {
        heading: "14 MODERN LIVELIHOOD PATHS NEAR HOME",
        items:
          "• Rural youth: Agri-drones, Solar PV/pump techs, EV repair & remote broadband BPO desks\n" +
          "• Women SHGs: Millet cloud kitchens, dairy chilling, mushroom sheds & GI craft storefronts\n" +
          "• Seniors & locals: Eco-tourism trails, nurseries & apiculture",
        col: C.saffron,
      },
    ];

    impacts.forEach((card, idx) => {
      const xPos = 0.6 + idx * 4.11;
      s.addShape("rect", {
        x: xPos,
        y: 1.45,
        w: 3.91,
        h: 5.25,
        fill: { color: C.panel },
        line: { color: C.border, width: 1 },
      });
      s.addShape("rect", {
        x: xPos,
        y: 1.45,
        w: 3.91,
        h: 0.08,
        fill: { color: card.col },
      });
      s.addText(card.heading, {
        x: xPos + 0.2,
        y: 1.72,
        w: 3.51,
        h: 0.55,
        fontSize: 12.5,
        bold: true,
        color: card.col,
        fontFace: "Calibri",
      });
      s.addText(card.items, {
        x: xPos + 0.2,
        y: 2.38,
        w: 3.51,
        h: 4.1,
        fontSize: 13.5,
        color: C.text,
        fontFace: "Calibri",
        valign: "top",
      });
    });

    addFooter(s, 6, totalSlides, "Quantifiable Social & Economic Impact");
    s.addNotes(
      `[3:10-3:35] Show tangible, verifiable impact: welfare rupees unlocked, all-waterbody stewardship across ponds/lakes/streams/checkdams, and 14 local livelihood pathways keeping youth from forced migration.`
    );
  }

  // =========================================================================
  // SLIDE 7: JAN BHAGIDARI — PER-SECTOR GOOD ACTIONS & OBLIGATIONS
  // =========================================================================
  {
    const s = pptx.addSlide();
    s.background = { color: C.bg };
    addHeader(
      s,
      "Jan Bhagidari · Civic Participation",
      "66 Good Actions Across 5 Sectors With Clear Stakeholder Obligations",
      C.violet
    );

    const sectors = [
      {
        img: "sdg13.jpg",
        name: "ENVIRONMENT (13)",
        ex: "Native tree plantations, kid-senior bird watching, Miyawaki groves, zero-plastic markets.",
        col: C.emerald,
      },
      {
        img: "sdg03.jpg",
        name: "HEALTH (13)",
        ex: "Stop-junk-food camps (kids & workers), millet Sundays, dawn yoga, 108 CPR squads.",
        col: "4C9F38",
      },
      {
        img: "sdg06.jpg",
        name: "WATER (13)",
        ex: "Desilting ponds, lakes, streams & checkdams; RWH filters; weekly Jal Mitra tests.",
        col: C.cyan,
      },
      {
        img: "sdg04.jpg",
        name: "EDUCATION (13)",
        ex: "Grandparent storytelling, DIY tinkering, UPI cyber-safety, girl-STEM circles.",
        col: C.rose,
      },
      {
        img: "sdg08.jpg",
        name: "LIVELIHOOD (14)",
        ex: "Agri-drones, solar/EV kiosks, SHG bakeries, remote BPO desks, GI craft portals.",
        col: C.saffron,
      },
    ];

    sectors.forEach((sec, idx) => {
      const xPos = 0.6 + idx * 2.45;
      const imgPath = path.join(SDG_DIR, sec.img);
      s.addShape("rect", {
        x: xPos,
        y: 1.4,
        w: 2.33,
        h: 3.15,
        fill: { color: C.panel },
        line: { color: C.border, width: 1 },
      });
      if (fs.existsSync(imgPath)) {
        s.addImage({ path: imgPath, x: xPos + 0.56, y: 1.56, w: 1.2, h: 1.2 });
      }
      s.addText(sec.name, {
        x: xPos + 0.12,
        y: 2.86,
        w: 2.09,
        h: 0.28,
        fontSize: 10.5,
        bold: true,
        color: sec.col,
        align: "center",
        fontFace: "Calibri",
      });
      s.addText(sec.ex, {
        x: xPos + 0.14,
        y: 3.18,
        w: 2.05,
        h: 1.25,
        fontSize: 11,
        color: C.text,
        fontFace: "Calibri",
        valign: "top",
      });
    });

    // Explicit Obligations Matrix across stakeholders
    s.addShape("rect", {
      x: 0.6,
      y: 4.78,
      w: 12.13,
      h: 1.95,
      fill: { color: C.panelAlt },
      line: { color: C.violet, width: 1.1 },
    });
    s.addText("SHARED OBLIGATIONS CHARTER — EVERY GENERATION OWNS A PIECE", {
      x: 0.82,
      y: 4.92,
      w: 11.7,
      h: 0.28,
      fontSize: 11,
      bold: true,
      color: C.violet,
      fontFace: "Calibri",
    });

    const roles = [
      { r: "Children", o: "Water 2 saplings, join bird walks, eat zero-junk school tiffins, spot leaky taps." },
      { r: "Women", o: "Lead clean-cooking e-KYC, kitchen greywater pits, SHG millet & craft enterprises." },
      { r: "Senior Citizens", o: "Guide bird & watershed walks, mentor oral history & craft heritage, check vitals." },
      { r: "Youth, Farmers & GP", o: "Zero burning, drip irrigation, UPI scam safety clinics, & transparent water budgets." },
    ];
    roles.forEach((item, idx) => {
      const xPos = 0.82 + idx * 2.95;
      s.addText(item.r, {
        x: xPos,
        y: 5.26,
        w: 2.8,
        h: 0.26,
        fontSize: 12,
        bold: true,
        color: C.white,
        fontFace: "Calibri",
      });
      s.addText(item.o, {
        x: xPos,
        y: 5.56,
        w: 2.8,
        h: 1.05,
        fontSize: 11,
        color: C.text,
        fontFace: "Calibri",
        valign: "top",
      });
    });

    addFooter(s, 7, totalSlides, "Sector Good Actions & Shared Obligations");
    s.addNotes(
      `[3:35-4:00] Emphasize VBYLD's core theme of Jan Bhagidari: technology pairs with human Obligations across Children, Women, Senior Citizens, Youth, Farmers, and Gram Panchayats.`
    );
  }

  // =========================================================================
  // SLIDE 8: TEAMWORK & FULL-CIRCLE CLOSING
  // =========================================================================
  {
    const s = pptx.addSlide();
    s.background = { color: C.bg };
    addHeader(
      s,
      "Teamwork & Closing Promise",
      "Team Collaboration, Role Ownership & Vision 2047",
      C.saffron
    );

    const teamRoles = [
      {
        role: "Geospatial & Data Pipeline",
        member: "[Teammate 1 Name]",
        owned: "11,154-village GeoJSON indexing, TRACGIS tank integration, dual GIS & Satellite map sync.",
        col: C.cyan,
      },
      {
        role: "2047 Simulation & Macro Engine",
        member: "[Teammate 2 Name]",
        owned: "Policy sliders, P15–P85 forecasting, Open-Meteo weather proxy, & Live Rupee Currency Meter.",
        col: C.saffron,
      },
      {
        role: "Citizen UX & SDG Charters",
        member: "[Teammate 3 Name]",
        owned: "Living Village Twin, 30-sec Scheme Finder, bilingual UI, & per-sector SDG Obligations.",
        col: C.emerald,
      },
      {
        role: "Field Research & Pitch Lead",
        member: "[Teammate 4 / Your Name]",
        owned: "Ground validation across mandals, scheme eligibility rules, & storytelling presentation.",
        col: C.violet,
      },
    ];

    teamRoles.forEach((t, idx) => {
      const xPos = 0.6 + idx * 3.08;
      s.addShape("rect", {
        x: xPos,
        y: 1.45,
        w: 2.9,
        h: 2.55,
        fill: { color: C.panel },
        line: { color: C.border, width: 1 },
      });
      s.addShape("rect", {
        x: xPos,
        y: 1.45,
        w: 2.9,
        h: 0.08,
        fill: { color: t.col },
      });
      s.addText(t.member, {
        x: xPos + 0.18,
        y: 1.66,
        w: 2.54,
        h: 0.34,
        fontSize: 15,
        bold: true,
        color: C.white,
        fontFace: "Calibri",
      });
      s.addText(t.role, {
        x: xPos + 0.18,
        y: 2.02,
        w: 2.54,
        h: 0.32,
        fontSize: 11.5,
        bold: true,
        color: t.col,
        fontFace: "Calibri",
      });
      s.addText(t.owned, {
        x: xPos + 0.18,
        y: 2.42,
        w: 2.54,
        h: 1.4,
        fontSize: 12,
        color: C.text,
        fontFace: "Calibri",
        valign: "top",
      });
    });

    // Full-Circle Closing Callback Box
    s.addShape("rect", {
      x: 0.6,
      y: 4.35,
      w: 12.13,
      h: 2.35,
      fill: { color: C.panelAlt },
      line: { color: C.saffron, width: 1.4 },
    });
    s.addText("FULL-CIRCLE PROMISE — VIKSIT BHARAT @ 2047", {
      x: 0.9,
      y: 4.55,
      w: 11.5,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: C.saffron,
      fontFace: "Calibri",
    });
    s.addText(
      "Clean roads. Clean water. Fresh air. Real jobs near home. Affordable education & healthcare.\n" +
        "With JAN—DRISHTI, rural India doesn't have to imagine that future—we can measure it, simulate it, and build it together.",
      {
        x: 0.9,
        y: 4.95,
        w: 11.5,
        h: 1.15,
        fontSize: 18,
        bold: true,
        color: C.white,
        fontFace: "Calibri",
      }
    );
    s.addText("Thank You  |  Open for IIT Hyderabad Jury Questions", {
      x: 0.9,
      y: 6.18,
      w: 11.5,
      h: 0.35,
      fontSize: 13,
      bold: true,
      color: C.emerald,
      fontFace: "Calibri",
    });

    addFooter(s, 8, totalSlides, "Teamwork & Full-Circle Closing");
    s.addNotes(
      `[4:00-4:25] Briefly introduce each teammate's exact contribution, pause 1 second, and land the final callback sentence connecting straight back to Slide 1's hook.`
    );
  }

  await pptx.writeFile({ fileName: OUT_PATH });
  const stat = fs.statSync(OUT_PATH);
  console.log(`Generated ${OUT_PATH} (${Math.round(stat.size / 1024)} KB)`);
}

buildDeck().catch((err) => {
  console.error("Failed generating PPT:", err);
  process.exit(1);
});
