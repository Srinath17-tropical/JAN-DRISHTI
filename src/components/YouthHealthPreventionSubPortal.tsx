import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Brain,
  CheckCircle2,
  HeartPulse,
  PhoneCall,
  Play,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type HealthCategoryTab = "mental_health" | "cardiovascular" | "diabetes";

const TIERED_COUNSELING_MODEL = [
  {
    tier: "Tier 1 · Digital & Anonymous Triage",
    detail:
      "24/7 confidential campus helpline & tele-counseling linked directly to national crisis desk Tele-MANAS (14416).",
    ratio: "Zero Waiting Queue · Instant Response",
    accent: "bg-indigo-600",
  },
  {
    tier: "Tier 2 · On-Site Wellness Hubs",
    detail:
      "Stigma-free private counseling rooms inside colleges & hostels staffed with at least 1 full-time psychologist per 500 students.",
    ratio: "1 Psychologist : 500 Students",
    accent: "bg-purple-600",
  },
  {
    tier: "Tier 3 · Rapid Clinical Referral",
    detail:
      "Direct fast-track escalation to specialist psychiatric care for acute suicidal distress, bypassing routine outpatient queues.",
    ratio: "Priority Emergency Pathway",
    accent: "bg-rose-600",
  },
];

const SELF_CHECK_SIGNALS = [
  "Persistent trouble sleeping or waking exhausted for 1+ week",
  "Withdrawing from hostel friends, classes, or favorite hobbies",
  "Overwhelming dread around single high-stakes exams or placements",
  "Feeling trapped, hopeless, or like a burden to family",
  "Sharp drops in appetite, focus, or sudden emotional exhaustion",
];

export default function YouthHealthPreventionSubPortal({
  villageName = "Telangana Ward / Campus Cluster",
  districtName = "Telangana",
}: {
  villageName?: string;
  districtName?: string;
}) {
  const [showIntro, setShowIntro] = useState(true);
  const [introProgress, setIntroProgress] = useState(0);
  const [category, setCategory] = useState<HealthCategoryTab>("mental_health");

  // Design Baseline Sliders (Default = Attached PDF Urban Ward / University Cluster Baseline)
  const [youthPop, setYouthPop] = useState<number>(100000);
  const [screeningReachPct, setScreeningReachPct] = useState<number>(80);
  const [suicideReductionPct, setSuicideReductionPct] = useState<number>(45);
  const [diabetesReversalPct, setDiabetesReversalPct] = useState<number>(45);

  // Policy / Lifestyle Toggles
  const [examReformOn, setExamReformOn] = useState<boolean>(true);
  const [cleanCanteenOn, setCleanCanteenOn] = useState<boolean>(true);
  const [activeMobilityOn, setActiveMobilityOn] = useState<boolean>(true);

  // Interactive Category-Specific Visual Controls
  const [checkedSignals, setCheckedSignals] = useState<number[]>([]);
  const [systolicBp, setSystolicBp] = useState<number>(138);
  const [dailyActivityMin, setDailyActivityMin] = useState<number>(45);
  const [canteenDietMode, setCanteenDietMode] = useState<"low_gi" | "ultra_processed">("low_gi");

  const systemCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const categoryCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const replayIntro = useCallback(() => {
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

  // Exact Epidemiological Math synced with PDF Pages 3 & 4
  const math = useMemo(() => {
    const scale = youthPop / 100000;
    const policyFactor =
      0.85 +
      (examReformOn ? 0.05 : 0) +
      (cleanCanteenOn ? 0.05 : 0) +
      (activeMobilityOn ? 0.05 : 0);

    // A. Mental Health & Suicide Prevention
    const highDistressPool = Math.round(12000 * scale); // ~10-12%
    const capturedAtRisk = Math.round(highDistressPool * (screeningReachPct / 100));
    const baselineDeathsYr = Math.max(1, Math.round(19 * scale)); // 18-20 per 100k
    const effectiveMentalDrop = Math.min(
      60,
      Math.round(suicideReductionPct * (screeningReachPct / 80) * policyFactor)
    );
    const livesSavedYr = Math.max(1, Math.round(baselineDeathsYr * (effectiveMentalDrop / 100)));
    const remainingDeathsYr = Math.max(0, baselineDeathsYr - livesSavedYr);
    const crisesAvertedYr = Math.round(350 * scale * (effectiveMentalDrop / 100));
    const gatekeepersNeeded = Math.round(youthPop / 18); // 1 per 15-20 students
    const psychologistsNeeded = Math.round(youthPop / 500); // 1 per 500 students

    // B. Diabetes & CVD Prevention
    const preDiabeticPool = Math.round(13500 * scale); // ~13.5%
    const effectiveReversalPct = Math.min(
      62,
      Math.round(diabetesReversalPct * policyFactor)
    );
    const diabetesCasesAverted = Math.round(
      preDiabeticPool * (screeningReachPct / 80) * (effectiveReversalPct / 100)
    );
    const postReversalPreDiabetic = Math.max(0, preDiabeticPool - diabetesCasesAverted);

    const earlyHypertensionPool = Math.round(16000 * scale); // ~16%
    const hypertensionControlled = Math.round(
      earlyHypertensionPool * (screeningReachPct / 80) * (effectiveReversalPct / 100)
    );
    const remainingHypertension = Math.max(0, earlyHypertensionPool - hypertensionControlled);
    const prematureCvdMortalityDropPct = Math.min(45, Math.round(35 * policyFactor));

    return {
      highDistressPool,
      capturedAtRisk,
      baselineDeathsYr,
      livesSavedYr,
      remainingDeathsYr,
      effectiveMentalDrop,
      crisesAvertedYr,
      gatekeepersNeeded,
      psychologistsNeeded,
      preDiabeticPool,
      diabetesCasesAverted,
      postReversalPreDiabetic,
      earlyHypertensionPool,
      hypertensionControlled,
      remainingHypertension,
      prematureCvdMortalityDropPct,
    };
  }, [
    youthPop,
    screeningReachPct,
    suicideReductionPct,
    diabetesReversalPct,
    examReformOn,
    cleanCanteenOn,
    activeMobilityOn,
  ]);

  const impactChartData = useMemo(
    () => [
      {
        category: "Pre-Diabetes Pool",
        Baseline: math.preDiabeticPool,
        WithArchitecture: math.postReversalPreDiabetic,
      },
      {
        category: "Early Hypertension",
        Baseline: math.earlyHypertensionPool,
        WithArchitecture: math.remainingHypertension,
      },
      {
        category: "Untreated Distress",
        Baseline: math.highDistressPool,
        WithArchitecture: Math.max(0, math.highDistressPool - math.capturedAtRisk),
      },
    ],
    [math]
  );

  // 1) Grand 60fps Closed-Loop System Flow Canvas (Matches PDF Page 2 Blueprint)
  useEffect(() => {
    if (showIntro) return;
    const canvas = systemCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let rafId = 0;
    let tick = 0;

    const drawNode = (
      x: number,
      y: number,
      bw: number,
      bh: number,
      title: string,
      sub: string,
      borderCol: string,
      fillCol: string
    ) => {
      ctx.fillStyle = fillCol;
      ctx.fillRect(x, y, bw, bh);
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(x, y, bw, bh);

      ctx.fillStyle = "#ffffff";
      ctx.font = "700 10.5px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(title, x + bw / 2, y + 17);
      ctx.fillStyle = "rgba(226,232,240,0.8)";
      ctx.font = "500 9px system-ui, sans-serif";
      ctx.fillText(sub, x + bw / 2, y + 31);
      ctx.textAlign = "left";
    };

    const drawPulseLine = (
      pts: Array<[number, number]>,
      color: string,
      active: boolean
    ) => {
      ctx.strokeStyle = active ? color : "rgba(148,163,184,0.28)";
      ctx.lineWidth = active ? 2.5 : 1.4;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();

      if (!active) return;
      let total = 0;
      const segs: Array<{ x1: number; y1: number; x2: number; y2: number; len: number }> = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const len = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
        segs.push({ x1: pts[i][0], y1: pts[i][1], x2: pts[i + 1][0], y2: pts[i + 1][1], len });
        total += len;
      }
      for (let p = 0; p < 3; p++) {
        const dist = (((tick * 1.9 + p * (total / 3)) % total));
        let acc = 0;
        for (const s of segs) {
          if (acc + s.len >= dist) {
            const frac = (dist - acc) / Math.max(1, s.len);
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(s.x1 + (s.x2 - s.x1) * frac, s.y1 + (s.y2 - s.y1) * frac, 3, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
          acc += s.len;
        }
      }
    };

    const draw = () => {
      const parent = canvas.parentElement;
      const w = Math.max(520, parent ? parent.clientWidth : 900);
      const h = 325;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#060c18");
      bg.addColorStop(1, "#0b1426");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const boxW = Math.min(250, w * 0.28);

      // Top node: Youth Population
      drawNode(
        cx - boxW / 2,
        12,
        boxW,
        38,
        `YOUTH COHORT: ${youthPop.toLocaleString("en-IN")} (Ages 15–29)`,
        "Urban Wards & University Campuses",
        "#38bdf8",
        "#0c2340"
      );

      // Stage 1: Primary Environment (Prevention)
      drawNode(
        cx - boxW * 0.65,
        66,
        boxW * 1.3,
        38,
        "1 · PRIMARY ENVIRONMENT (PREVENTION)",
        "Active Mobility · Clean Low-GI Canteens · Exam Reform",
        "#10b981",
        "#082921"
      );

      // Stage 2: Early Screening (Filtration)
      drawNode(
        cx - boxW * 0.65,
        120,
        boxW * 1.3,
        38,
        `2 · EARLY SCREENING & FILTRATION (${screeningReachPct}% Reach)`,
        "Age-15 Yearly BP / HbA1c / Lipids + 1:18 Peer Gatekeepers",
        "#f59e0b",
        "#291a08"
      );

      const leftX = w * 0.27 - boxW / 2;
      const rightX = w * 0.73 - boxW / 2;
      const isMental = category === "mental_health";
      const isMetabolic = category === "cardiovascular" || category === "diabetes";

      // Animated connectors down & branching
      drawPulseLine([[cx, 50], [cx, 66]], "#38bdf8", true);
      drawPulseLine([[cx, 104], [cx, 120]], "#10b981", true);
      drawPulseLine([[cx, 158], [cx, 168], [leftX + boxW / 2, 168], [leftX + boxW / 2, 180]], "#c084fc", isMental || true);
      drawPulseLine([[cx, 158], [cx, 168], [rightX + boxW / 2, 168], [rightX + boxW / 2, 180]], "#f43f5e", isMetabolic || true);

      // Left Branch: Mental Health Pathway (Purple)
      drawNode(
        leftX,
        180,
        boxW,
        40,
        "MENTAL HEALTH PATHWAY",
        `Tier 1 Tele-MANAS → Tier 2 Campus Hub → Tier 3 Psych`,
        isMental ? "#c084fc" : "#64748b",
        isMental ? "#2e1065" : "#111827"
      );

      // Right Branch: Metabolic / CVD Pathway (Rose/Amber)
      drawNode(
        rightX,
        180,
        boxW,
        40,
        "CVD & DIABETES PATHWAY",
        `6-Mo Reversal (${math.diabetesCasesAverted.toLocaleString("en-IN")} Averted) + BP Care`,
        isMetabolic ? "#f43f5e" : "#64748b",
        isMetabolic ? "#3b0a1c" : "#111827"
      );

      // Merge lines down to Final Outcome
      drawPulseLine(
        [[leftX + boxW / 2, 220], [leftX + boxW / 2, 250], [cx, 250], [cx, 266]],
        "#a855f7",
        true
      );
      drawPulseLine(
        [[rightX + boxW / 2, 220], [rightX + boxW / 2, 250], [cx, 250], [cx, 266]],
        "#f43f5e",
        true
      );

      // Outcome Basin
      drawNode(
        cx - boxW * 0.75,
        266,
        boxW * 1.5,
        44,
        `REDUCED PREMATURE MORTALITY & THRIVING YOUTH`,
        `${math.livesSavedYr} Lives Saved/Yr · ${math.diabetesCasesAverted.toLocaleString("en-IN")} Diabetes Cases Averted · -${math.prematureCvdMortalityDropPct}% Early CVD Deaths`,
        "#34d399",
        "#064e3b"
      );

      if (!prefersReduced) {
        tick += 1;
        rafId = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [showIntro, youthPop, screeningReachPct, category, math]);

  // 2) Category-Specific Interactive 60fps Physiology / Psychosocial Canvas
  useEffect(() => {
    if (showIntro) return;
    const canvas = categoryCanvasRef.current;
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
      const w = Math.max(420, parent ? parent.clientWidth : 640);
      const h = 230;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = "#070f1d";
      ctx.fillRect(0, 0, w, h);

      if (category === "mental_health") {
        // Draw Unbuffered High-Stakes Exam Wave (top half red/amber) vs Peer Gatekeeper + Modular Buffer Wave (bottom emerald/purple)
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.beginPath();
        ctx.moveTo(20, h * 0.5);
        ctx.lineTo(w - 20, h * 0.5);
        ctx.stroke();

        // Top Wave: Acute Exam Spike -> Crisis threshold
        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let x = 20; x < w - 20; x += 4) {
          const t = (x - tick * 2) * 0.025;
          const spike = Math.pow(Math.abs(Math.sin(t * 0.55)), 6) * 52;
          const y = h * 0.42 - spike - Math.sin(t) * 6;
          if (x === 20) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Bottom Wave: Continuous Modular + Peer Gatekeeper + Tele-MANAS Steady Rhythm
        ctx.strokeStyle = "#c084fc";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let x = 20; x < w - 20; x += 4) {
          const t = (x - tick * 1.5) * 0.025;
          const y = h * 0.76 + Math.sin(t) * 14;
          if (x === 20) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Peer Gatekeeper Nodes catching distress
        for (let n = 0; n < 4; n++) {
          const nx = w * (0.2 + n * 0.2);
          ctx.fillStyle = "#a855f7";
          ctx.beginPath();
          ctx.arc(nx, h * 0.76, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(192,132,252,0.5)";
          ctx.beginPath();
          ctx.arc(nx, h * 0.76, 10 + ((tick * 0.3 + n * 4) % 8), 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = "#fda4af";
        ctx.font = "700 11px system-ui, sans-serif";
        ctx.fillText("Unbuffered High-Stakes Exam Shockwave (Crisis Risk Spikes)", 20, 24);
        ctx.fillStyle = "#e9d5ff";
        ctx.fillText("Modular Assessment + 1:18 Peer Gatekeepers + Tele-MANAS Safety Net", 20, h - 14);
      } else if (category === "cardiovascular") {
        // Split Arterial Lumen Comparison driven by Systolic BP & Daily Activity Minutes
        const halfH = h / 2;
        const stiffnessFactor = Math.max(0, Math.min(1, (systolicBp - 115) / 45));
        const activeBonus = Math.min(1, dailyActivityMin / 45);

        // Top Vessel: High BP / Sedentary Constriction
        ctx.fillStyle = "#2b0d17";
        ctx.fillRect(24, 34, w - 48, 56);
        const topWall = 8 + stiffnessFactor * 12;
        ctx.fillStyle = "#f59e0b"; // Lipid/plaque lining
        ctx.fillRect(24, 34, w - 48, topWall);
        ctx.fillRect(24, 90 - topWall, w - 48, topWall);

        for (let rbc = 0; rbc < 14; rbc++) {
          const rx = 30 + ((tick * (1.2 + stiffnessFactor * 1.4) + rbc * 48) % (w - 60));
          const ry = 62 + Math.sin(tick * 0.09 + rbc) * 4;
          ctx.fillStyle = "#fb7185";
          ctx.beginPath();
          ctx.ellipse(rx, ry, 6, 4, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Bottom Vessel: 45m Daily Activity + Clean Canteen Wide Clear Flow
        ctx.fillStyle = "#082925";
        ctx.fillRect(24, halfH + 22, w - 48, 62);
        const speedGood = 1.6 + activeBonus * 1.3;
        for (let rbc = 0; rbc < 16; rbc++) {
          const rx = 30 + ((tick * speedGood + rbc * 42) % (w - 60));
          const ry = halfH + 53 + Math.sin(tick * 0.05 + rbc) * 14;
          ctx.fillStyle = "#34d399";
          ctx.beginPath();
          ctx.ellipse(rx, ry, 7, 4.5, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = "#fda4af";
        ctx.font = "700 11px system-ui, sans-serif";
        ctx.fillText(`Elevated Endothelial Stress (${systolicBp} mmHg Systolic + Trans-Fat Diet)`, 24, 24);
        ctx.fillStyle = "#6ee7b7";
        ctx.fillText(`Active Mobility Lumen (${dailyActivityMin} min/day · -${math.prematureCvdMortalityDropPct}% Early CVD Risk)`, 24, h - 14);
      } else {
        // Diabetes & Glycemic Curve Simulation (Ultra-Processed Sugar Spike vs Low-GI High-Fiber Steady Zone)
        // Normal HbA1c Green Band (<5.7%)
        ctx.fillStyle = "rgba(16, 185, 129, 0.14)";
        ctx.fillRect(24, h * 0.45, w - 48, h * 0.34);
        ctx.strokeStyle = "rgba(52, 211, 153, 0.5)";
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(24, h * 0.45, w - 48, h * 0.34);
        ctx.setLineDash([]);

        // High-sugar spike curve (amber/rose dashed)
        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 24; x < w - 24; x += 4) {
          const norm = ((x - 24 + tick * 1.2) % 240) / 240;
          const spike = Math.exp(-Math.pow((norm - 0.32) * 5, 2)) * 96;
          const crash = Math.exp(-Math.pow((norm - 0.72) * 5, 2)) * 20;
          const y = h * 0.65 - spike + crash;
          if (x === 24) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Low-GI High-Fiber + Walk curve (bright cyan/emerald solid)
        ctx.strokeStyle = canteenDietMode === "low_gi" ? "#22d3ee" : "#fb923c";
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let x = 24; x < w - 24; x += 4) {
          const norm = ((x - 24 + tick * 1.2) % 240) / 240;
          const amp = canteenDietMode === "low_gi" ? 26 : 84;
          const hump = Math.exp(-Math.pow((norm - 0.45) * 3.5, 2)) * amp;
          const y = h * 0.68 - hump;
          if (x === 24) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.fillStyle = "#6ee7b7";
        ctx.font = "700 10.5px system-ui, sans-serif";
        ctx.fillText("Safe Glycemic Zone (Normal HbA1c < 5.7% · Reversal Target)", 32, h * 0.45 + 14);
        ctx.fillStyle = "#fda4af";
        ctx.fillText("Sugary Beverages & Fried Snacks Spike", 24, 24);
        ctx.fillStyle = canteenDietMode === "low_gi" ? "#67e8f9" : "#fdba74";
        ctx.fillText(
          canteenDietMode === "low_gi"
            ? `Low-GI High-Fiber Campus Meal (${math.diabetesCasesAverted.toLocaleString("en-IN")} Type-2 Diabetes Cases Prevented)`
            : "Current Diet Risk: High Post-Meal Insulin Surge",
          24,
          h - 14
        );
      }

      if (!prefersReduced) {
        tick += 1;
        rafId = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [showIntro, category, systolicBp, dailyActivityMin, canteenDietMode, math]);

  const toggleSignal = (idx: number) => {
    setCheckedSignals((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <section
      aria-label="Jeevan-Raksha Integrated Youth Health and Mortality Prevention Sub-Portal"
      className="relative border border-purple-500/30 bg-white dark:bg-[#070b14] shadow-sm overflow-hidden"
    >
      {showIntro ? (
        /* 3-Second Cinematic Title Opening */
        <div
          className="jd-keep-dark relative min-h-[540px] flex flex-col items-center justify-center p-6 sm:p-10 text-center text-white overflow-hidden"
          style={{
            background:
              "radial-gradient(circle at 50% 35%, rgba(168,85,247,0.34) 0%, rgba(244,63,94,0.18) 40%, #050811 85%)",
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-35"
          >
            <div className="h-[380px] w-[380px] rounded-full border border-purple-400/40 animate-[spin_14s_linear_infinite]" />
            <div className="absolute h-[260px] w-[260px] rounded-full border border-rose-400/40 animate-[spin_10s_linear_infinite_reverse]" />
          </div>

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="text-xs font-semibold tracking-widest text-purple-300 uppercase">
              Youth Health &amp; Mortality Prevention Sub-Portal · {districtName}
            </div>

            <h2
              className="font-samarkan text-4xl sm:text-5xl md:text-6xl text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(110deg, #e879f9 10%, #fb7185 52%, #34d399 95%)",
              }}
            >
              Jeevan · Raksha
            </h2>

            <p className="text-sm sm:text-base text-slate-200 max-w-xl mx-auto leading-relaxed">
              A closed-loop Campus &amp; Community Architecture intercepting{" "}
              <strong className="text-purple-300">Youth Suicide</strong>,{" "}
              <strong className="text-rose-300">Premature CVD</strong>, and{" "}
              <strong className="text-emerald-300">Type-2 Diabetes</strong> across ages 15–29.
            </p>

            <div className="grid grid-cols-3 gap-2.5 max-w-lg mx-auto pt-2 text-left">
              <div className="border border-white/15 bg-white/5 px-3 py-2">
                <div className="text-[11px] text-purple-300">Suicide Mortality</div>
                <div className="text-xs font-semibold font-mono tabular-nums text-white">
                  ~{math.effectiveMentalDrop}% Reduction
                </div>
              </div>
              <div className="border border-white/15 bg-white/5 px-3 py-2">
                <div className="text-[11px] text-emerald-300">Diabetes Averted</div>
                <div className="text-xs font-semibold font-mono tabular-nums text-white">
                  {math.diabetesCasesAverted.toLocaleString("en-IN")} / {youthPop >= 100000 ? "100k" : `${Math.round(youthPop / 1000)}k`}
                </div>
              </div>
              <div className="border border-white/15 bg-white/5 px-3 py-2">
                <div className="text-[11px] text-rose-300">Early CVD Deaths</div>
                <div className="text-xs font-semibold font-mono tabular-nums text-white">
                  -{math.prematureCvdMortalityDropPct}% (&lt;50 yrs)
                </div>
              </div>
            </div>

            <div className="max-w-md mx-auto pt-2 space-y-2">
              <div className="h-1.5 w-full bg-white/15 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-400 via-rose-400 to-emerald-400 transition-all duration-75"
                  style={{ width: `${introProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-white/70 font-mono tabular-nums">
                <span>Initializing Mental &amp; Metabolic Filtration Architecture…</span>
                <span>{((introProgress / 100) * 3).toFixed(1)}s / 3.0s</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIntro(false)}
              className="mt-2 inline-flex items-center gap-2 border border-purple-300/50 bg-purple-400/20 px-4 py-2 text-xs font-semibold text-purple-100 hover:bg-purple-400/30 transition"
            >
              <span>Enter Sub-Portal Now</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="jd-transition-reveal">
          {/* Header & 3 Youth Mortality Category Switchers */}
          <div className="border-b border-slate-200 dark:border-white/10 bg-gradient-to-r from-purple-500/10 via-rose-500/10 to-emerald-500/10 p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                  Jeevan-Raksha Sub-Portal · {villageName} · Closed-Loop Prevention Architecture
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  Youth Mental Health, Cardiovascular &amp; Type-2 Diabetes Mortality Prevention
                </h3>
              </div>

              <button
                type="button"
                onClick={replayIntro}
                className="inline-flex items-center gap-1.5 border border-slate-300 dark:border-white/15 bg-white dark:bg-[#09121e] px-3 py-2 text-xs font-medium text-slate-700 dark:text-white/80 hover:border-purple-400 transition whitespace-nowrap"
              >
                <Play size={13} className="text-purple-500" />
                <span>Replay 3s Intro</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setCategory("mental_health")}
                className={`flex items-center gap-3 p-3.5 text-left border transition ${
                  category === "mental_health"
                    ? "border-purple-500 bg-purple-500/15 dark:bg-purple-500/20"
                    : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#09121e] hover:border-purple-400/50"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-purple-600 text-white">
                  <Brain size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    01 · Mental Health &amp; Students
                  </div>
                  <div className="text-xs text-slate-600 dark:text-white/70 truncate">
                    3-Tier Counseling · Peer Gatekeepers · Exam Reform
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCategory("cardiovascular")}
                className={`flex items-center gap-3 p-3.5 text-left border transition ${
                  category === "cardiovascular"
                    ? "border-rose-500 bg-rose-500/15 dark:bg-rose-500/20"
                    : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#09121e] hover:border-rose-400/50"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-rose-600 text-white">
                  <HeartPulse size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    02 · Cardiovascular &amp; Hypertension
                  </div>
                  <div className="text-xs text-slate-600 dark:text-white/70 truncate">
                    Age-15 BP &amp; Lipid Check · Active Campus Zones
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCategory("diabetes")}
                className={`flex items-center gap-3 p-3.5 text-left border transition ${
                  category === "diabetes"
                    ? "border-emerald-500 bg-emerald-500/15 dark:bg-emerald-500/20"
                    : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#09121e] hover:border-emerald-400/50"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-emerald-600 text-white">
                  <Activity size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    03 · Youth Type-2 Diabetes Reversal
                  </div>
                  <div className="text-xs text-slate-600 dark:text-white/70 truncate">
                    HbA1c 5.7–6.4% Screen · Clean Low-GI Canteens
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-6">
            {/* UNIFIED CLOSED-LOOP SYSTEM ARCHITECTURE BLUEPRINT CANVAS */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Closed-Loop Prevention → Filtration → Treatment Flow Architecture
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-white/70">
                    Just as dual plumbing separates water at the source, this 3-stage blueprint intercepts distress and metabolic risk early.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setExamReformOn((v) => !v)}
                    className={`px-2.5 py-1 border font-semibold transition ${
                      examReformOn
                        ? "border-purple-500 bg-purple-600 text-white"
                        : "border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#050911] text-slate-600 dark:text-white/70"
                    }`}
                  >
                    Modular Exams
                  </button>
                  <button
                    type="button"
                    onClick={() => setCleanCanteenOn((v) => !v)}
                    className={`px-2.5 py-1 border font-semibold transition ${
                      cleanCanteenOn
                        ? "border-emerald-500 bg-emerald-600 text-white"
                        : "border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#050911] text-slate-600 dark:text-white/70"
                    }`}
                  >
                    Clean Canteens
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMobilityOn((v) => !v)}
                    className={`px-2.5 py-1 border font-semibold transition ${
                      activeMobilityOn
                        ? "border-rose-500 bg-rose-600 text-white"
                        : "border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#050911] text-slate-600 dark:text-white/70"
                    }`}
                  >
                    45m Active Mobility
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-white/10 bg-[#060c18] overflow-hidden jd-keep-dark">
                <canvas ref={systemCanvasRef} className="block w-full h-[325px]" />
              </div>
            </div>

            {/* CATEGORY-SPECIFIC GRAND VISUAL + INTERACTIVE PRACTICAL HELPER */}
            <div className="border border-slate-200 dark:border-white/12 bg-slate-50 dark:bg-[#08101c] p-4 sm:p-5 space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                <div className="lg:col-span-7 space-y-3">
                  <div className="border border-slate-200 dark:border-white/10 bg-[#070f1d] overflow-hidden jd-keep-dark">
                    <canvas ref={categoryCanvasRef} className="block w-full h-[230px]" />
                  </div>
                </div>

                {/* Interactive Clinical / Counseling Control Panel */}
                <div className="lg:col-span-5 space-y-3">
                  {category === "mental_health" && (
                    <div className="space-y-3">
                      <div className="bg-purple-600 text-white p-3.5 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-bold">
                          <PhoneCall size={14} />
                          <span>Immediate 24×7 Confidential Support</span>
                        </div>
                        <div className="text-sm font-bold font-mono tabular-nums">
                          Tele-MANAS: 14416 / 1800-891-4416
                        </div>
                        <div className="text-[11px] text-purple-100">
                          Kiran Helpline: 1800-599-0019 · Emergency: 112 (Free · Anonymous)
                        </div>
                      </div>

                      <div className="border border-slate-200 dark:border-white/10 bg-white dark:bg-[#050911] p-3 space-y-2">
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                          <span>Peer &ldquo;First-Flush&rdquo; Early Check-In Signals</span>
                          <span className="font-mono text-purple-600 dark:text-purple-300">
                            {checkedSignals.length}/5 Flagged
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {SELF_CHECK_SIGNALS.map((sig, i) => {
                            const active = checkedSignals.includes(i);
                            return (
                              <button
                                key={sig}
                                type="button"
                                onClick={() => toggleSignal(i)}
                                className={`w-full text-left px-2.5 py-1.5 text-[11px] border transition ${
                                  active
                                    ? "border-purple-500 bg-purple-500/15 text-purple-900 dark:text-purple-200 font-semibold"
                                    : "border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/75"
                                }`}
                              >
                                {active ? "✓ " : "○ "}
                                {sig}
                              </button>
                            );
                          })}
                        </div>
                        <div className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 pt-1">
                          {checkedSignals.length >= 2
                            ? "Tier 1/2 Trigger: Connect immediately with a Campus Peer Gatekeeper or call Tele-MANAS 14416."
                            : "Select signals above to preview Peer Gatekeeper routing."}
                        </div>
                      </div>
                    </div>
                  )}

                  {category === "cardiovascular" && (
                    <div className="space-y-3">
                      <div className="border border-rose-500/25 bg-white dark:bg-[#050911] p-4 space-y-3">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          Interactive Arterial Stress &amp; Activity Simulator
                        </div>

                        <label className="block space-y-1 text-xs">
                          <div className="flex justify-between font-medium text-slate-700 dark:text-white/80">
                            <span>Youth Systolic Blood Pressure</span>
                            <span className="font-mono font-bold tabular-nums text-rose-600 dark:text-rose-300">
                              {systolicBp} mmHg
                            </span>
                          </div>
                          <input
                            type="range"
                            min={110}
                            max={165}
                            step={2}
                            value={systolicBp}
                            onChange={(e) => setSystolicBp(Number(e.target.value))}
                            className="w-full accent-rose-600"
                          />
                        </label>

                        <label className="block space-y-1 text-xs">
                          <div className="flex justify-between font-medium text-slate-700 dark:text-white/80">
                            <span>Daily Campus Cycling / Activity</span>
                            <span className="font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-300">
                              {dailyActivityMin} min/day
                            </span>
                          </div>
                          <input
                            type="range"
                            min={10}
                            max={75}
                            step={5}
                            value={dailyActivityMin}
                            onChange={(e) => setDailyActivityMin(Number(e.target.value))}
                            className="w-full accent-emerald-600"
                          />
                        </label>

                        <div className="text-xs text-slate-600 dark:text-white/75 pt-1 leading-relaxed">
                          Mandatory annual Age-15 biomarker screening catches pre-hypertensive youth (15–18%) early, cutting premature heart attacks &amp; strokes before age 50 by{" "}
                          <strong className="text-rose-600 dark:text-rose-300">
                            {math.prematureCvdMortalityDropPct}%
                          </strong>.
                        </div>
                      </div>
                    </div>
                  )}

                  {category === "diabetes" && (
                    <div className="space-y-3">
                      <div className="border border-emerald-500/25 bg-white dark:bg-[#050911] p-4 space-y-3">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          Canteen Food Environment &amp; HbA1c Reversal Test
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setCanteenDietMode("low_gi")}
                            className={`px-3 py-2 text-xs font-bold border transition ${
                              canteenDietMode === "low_gi"
                                ? "border-emerald-500 bg-emerald-600 text-white"
                                : "border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#09121e] text-slate-700 dark:text-white/75"
                            }`}
                          >
                            High-Fiber Low-GI Meal
                          </button>
                          <button
                            type="button"
                            onClick={() => setCanteenDietMode("ultra_processed")}
                            className={`px-3 py-2 text-xs font-bold border transition ${
                              canteenDietMode === "ultra_processed"
                                ? "border-rose-500 bg-rose-600 text-white"
                                : "border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#09121e] text-slate-700 dark:text-white/75"
                            }`}
                          >
                            High-Sugar + Trans-Fat
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] font-mono tabular-nums pt-1">
                          <div className="bg-emerald-500/15 p-2 border border-emerald-500/30">
                            <div className="font-bold text-emerald-700 dark:text-emerald-300">&lt; 5.7%</div>
                            <div className="text-slate-600 dark:text-white/70">Normal</div>
                          </div>
                          <div className="bg-amber-500/15 p-2 border border-amber-500/30">
                            <div className="font-bold text-amber-700 dark:text-amber-300">5.7–6.4%</div>
                            <div className="text-slate-600 dark:text-white/70">6-Mo Reversal</div>
                          </div>
                          <div className="bg-rose-500/15 p-2 border border-rose-500/30">
                            <div className="font-bold text-rose-700 dark:text-rose-300">&ge; 6.5%</div>
                            <div className="text-slate-600 dark:text-white/70">Clinical Care</div>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-white/75 leading-relaxed">
                          Flagging pre-diabetic youth (HbA1c 5.7–6.4%) into a structured 6-month nutrition &amp; activity cohort prevents{" "}
                          <strong className="text-emerald-600 dark:text-emerald-300">
                            {math.diabetesCasesAverted.toLocaleString("en-IN")} cases
                          </strong>{" "}
                          of full Type-2 Diabetes.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tiered Counseling Strip (Mental Health Mode) or Prevention Protocol Cards */}
              {category === "mental_health" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  {TIERED_COUNSELING_MODEL.map((item) => (
                    <div
                      key={item.tier}
                      className="border border-slate-200 dark:border-white/10 bg-white dark:bg-[#050911] p-3.5 space-y-2"
                    >
                      <div className={`${item.accent} text-white px-2.5 py-1 text-xs font-bold`}>
                        {item.tier}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-white/75 leading-relaxed">
                        {item.detail}
                      </p>
                      <div className="text-[11px] font-mono font-semibold text-purple-700 dark:text-purple-300">
                        {item.ratio}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* EPIDEMIOLOGICAL CALCULATOR SLIDERS & ANNUAL IMPACT SUMMARY */}
            <div className="border border-emerald-500/25 bg-white dark:bg-[#050911] p-4 sm:p-5 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users size={17} className="text-purple-500" />
                    <span>Epidemiological Impact Calculator &amp; Annual Summary</span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-white/70">
                    Baseline = 100,000 youth (4–5 university campuses or urban municipal ward). Adjust cohort scale &amp; reach live.
                  </p>
                </div>
                <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-300">
                  Gatekeepers Required: {math.gatekeepersNeeded.toLocaleString("en-IN")} · Psychologists: {math.psychologistsNeeded}
                </span>
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs border-y border-slate-200 dark:border-white/10 py-4">
                <label className="block space-y-1">
                  <div className="flex justify-between font-medium text-slate-700 dark:text-white/80">
                    <span>Youth Cohort (15–29)</span>
                    <span className="font-mono font-bold tabular-nums text-cyan-600 dark:text-cyan-300">
                      {youthPop.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={20000}
                    max={250000}
                    step={10000}
                    value={youthPop}
                    onChange={(e) => setYouthPop(Number(e.target.value))}
                    className="w-full accent-cyan-600"
                  />
                </label>

                <label className="block space-y-1">
                  <div className="flex justify-between font-medium text-slate-700 dark:text-white/80">
                    <span>Screening &amp; Peer Reach</span>
                    <span className="font-mono font-bold tabular-nums text-purple-600 dark:text-purple-300">
                      {screeningReachPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={95}
                    step={5}
                    value={screeningReachPct}
                    onChange={(e) => setScreeningReachPct(Number(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                </label>

                <label className="block space-y-1">
                  <div className="flex justify-between font-medium text-slate-700 dark:text-white/80">
                    <span>Suicide Risk Reduction</span>
                    <span className="font-mono font-bold tabular-nums text-rose-600 dark:text-rose-300">
                      {suicideReductionPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={25}
                    max={55}
                    step={5}
                    value={suicideReductionPct}
                    onChange={(e) => setSuicideReductionPct(Number(e.target.value))}
                    className="w-full accent-rose-600"
                  />
                </label>

                <label className="block space-y-1">
                  <div className="flex justify-between font-medium text-slate-700 dark:text-white/80">
                    <span>6-Mo Lifestyle Reversal</span>
                    <span className="font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-300">
                      {diabetesReversalPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={60}
                    step={5}
                    value={diabetesReversalPct}
                    onChange={(e) => setDiabetesReversalPct(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </label>
              </div>

              {/* Impact Visual Chart + Summary Table */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                <div className="lg:col-span-5 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#08101c] p-3.5 space-y-2">
                  <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Sparkles size={14} className="text-emerald-500" />
                    <span>At-Risk Youth: No System vs. Integrated Architecture</span>
                  </div>
                  <div className="h-[205px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={impactChartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                        <XAxis dataKey="category" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                        <Tooltip
                          formatter={(v) => [
                            `${Number(Array.isArray(v) ? v[0] : (v ?? 0)).toLocaleString("en-IN")} youth`,
                            "Cohort",
                          ]}
                          contentStyle={{
                            backgroundColor: "#09111f",
                            border: "1px solid rgba(255,255,255,0.15)",
                            color: "#fff",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="Baseline" name="Baseline (No System)" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="WithArchitecture" name="Post-Architecture" fill="#10b981" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-7 overflow-x-auto border border-slate-200 dark:border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/80 font-semibold border-b border-slate-200 dark:border-white/10">
                      <tr>
                        <th className="px-3.5 py-2.5">Health Metric</th>
                        <th className="px-3.5 py-2.5">Baseline (No System)</th>
                        <th className="px-3.5 py-2.5">With Architecture</th>
                        <th className="px-3.5 py-2.5">Net Annual Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/10 text-slate-700 dark:text-white/85">
                      <tr>
                        <td className="px-3.5 py-2.5 font-semibold">Youth Suicide Mortality</td>
                        <td className="px-3.5 py-2.5 font-mono tabular-nums">~{math.baselineDeathsYr} deaths/yr</td>
                        <td className="px-3.5 py-2.5 font-mono tabular-nums">~{math.remainingDeathsYr} deaths/yr</td>
                        <td className="px-3.5 py-2.5 font-bold text-purple-700 dark:text-purple-300">
                          {math.livesSavedYr} lives saved · {math.crisesAvertedYr}+ crises averted
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3.5 py-2.5 font-semibold">Undiagnosed Pre-Diabetes</td>
                        <td className="px-3.5 py-2.5 font-mono tabular-nums">~{math.preDiabeticPool.toLocaleString("en-IN")} youth</td>
                        <td className="px-3.5 py-2.5 font-mono tabular-nums">~{math.postReversalPreDiabetic.toLocaleString("en-IN")} youth</td>
                        <td className="px-3.5 py-2.5 font-bold text-emerald-700 dark:text-emerald-300">
                          {math.diabetesCasesAverted.toLocaleString("en-IN")} Type-2 Diabetes cases prevented
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3.5 py-2.5 font-semibold">Uncontrolled Early Hypertension</td>
                        <td className="px-3.5 py-2.5 font-mono tabular-nums">~{math.earlyHypertensionPool.toLocaleString("en-IN")} youth</td>
                        <td className="px-3.5 py-2.5 font-mono tabular-nums">~{math.remainingHypertension.toLocaleString("en-IN")} youth</td>
                        <td className="px-3.5 py-2.5 font-bold text-rose-700 dark:text-rose-300">
                          {math.hypertensionControlled.toLocaleString("en-IN")} controlled early
                        </td>
                      </tr>
                      <tr className="bg-emerald-500/10">
                        <td className="px-3.5 py-2.5 font-semibold">Premature CVD Mortality (&lt;50)</td>
                        <td className="px-3.5 py-2.5">High lifetime risk</td>
                        <td className="px-3.5 py-2.5 font-mono font-bold tabular-nums">{math.prematureCvdMortalityDropPct}% lower trajectory</td>
                        <td className="px-3.5 py-2.5 font-bold text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1">
                          <CheckCircle2 size={13} /> Hundreds of healthy life-years saved
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-white/55 border-t border-slate-200 dark:border-white/10 pt-3">
                <ShieldCheck size={14} className="shrink-0 text-slate-400" />
                <span>
                  Informational planning architecture &amp; screening simulations only; for clinical diagnosis, cardiac evaluation, or urgent mental health intervention, consult a qualified physician or dial Tele-MANAS (14416) / 112.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
