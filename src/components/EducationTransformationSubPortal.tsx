import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  BookOpen,
  BriefcaseBusiness,
  GraduationCap,
  Laptop,
  Play,
  Sparkles,
  Users,
} from "lucide-react";

type EduSubTab = "girls_retention" | "smart_classrooms" | "career_bridge";

export default function EducationTransformationSubPortal({
  villageName = "Telangana Settlement",
  districtName = "Telangana",
  baseLiteracyPct = 66.5,
  baseFemaleLitPct = 57.9,
}: {
  villageName?: string;
  districtName?: string;
  baseLiteracyPct?: number;
  baseFemaleLitPct?: number;
}) {
  const [showIntro, setShowIntro] = useState(true);
  const [introProgress, setIntroProgress] = useState(0);
  const [tab, setTab] = useState<EduSubTab>("girls_retention");

  // Interactive Calculator Sliders
  const [cohortStudents, setCohortStudents] = useState<number>(420);
  const [washTransitPct, setWashTransitPct] = useState<number>(85);
  const [tsatLabHours, setTsatLabHours] = useState<number>(6);
  const [taskSkillMatchPct, setTaskSkillMatchPct] = useState<number>(70);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const replayIntro = useCallback(() => {
    setShowIntro(true);
    setIntroProgress(0);
  }, []);

  // 3.0-second cinematic opening timeline
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
      setIntroProgress(Math.min(100, Math.round((elapsed / totalMs) * 100)));
      if (elapsed >= totalMs) {
        setShowIntro(false);
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [showIntro]);

  const metrics = useMemo(() => {
    const baseGirlShare = Math.round(cohortStudents * 0.49);
    const savedGirls = Math.round(
      baseGirlShare * ((washTransitPct / 100) * 0.34)
    );
    const smartReadyYouth = Math.round(
      cohortStudents * Math.min(0.95, 0.28 + tsatLabHours * 0.075)
    );
    const placedSkilledGraduates = Math.round(
      (cohortStudents * 0.32) * (taskSkillMatchPct / 100)
    );
    const projected2035Lit = Math.min(
      98.4,
      Number(
        (
          baseLiteracyPct +
          (washTransitPct * 0.14 + tsatLabHours * 1.4 + taskSkillMatchPct * 0.08)
        ).toFixed(1)
      )
    );
    const annualIncomeGainLakhs = Math.round(placedSkilledGraduates * 1.85);
    return {
      savedGirls,
      smartReadyYouth,
      placedSkilledGraduates,
      projected2035Lit,
      annualIncomeGainLakhs,
    };
  }, [cohortStudents, washTransitPct, tsatLabHours, taskSkillMatchPct, baseLiteracyPct]);

  // Interactive 60fps School-to-Career Architecture Canvas
  useEffect(() => {
    if (showIntro) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let rafId = 0;
    let tick = 0;

    const draw = () => {
      tick += prefersReduced ? 0 : 1;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(320, rect.width);
      const h = Math.max(250, rect.height);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      ctx.fillStyle = "#060b16";
      ctx.fillRect(0, 0, w, h);

      // Subtle Diagonal Architectural Lines
      ctx.strokeStyle = "rgba(244, 63, 94, 0.08)";
      ctx.lineWidth = 1;
      for (let x = -h; x < w + h; x += 36) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + h, h);
        ctx.stroke();
      }

      const nodes =
        tab === "girls_retention"
          ? [
              { title: "KGBV & ZPHS", kpi: `${washTransitPct}% WASH`, color: "#fb7185" },
              { title: "TGRTC Free Bus", kpi: "0 Dropouts/km", color: "#f59e0b" },
              { title: "Girls STEM Club", kpi: `${metrics.savedGirls} Retained`, color: "#38bdf8" },
              { title: "TS ePASS Grant", kpi: "100% Hostel Link", color: "#10b981" },
            ]
          : tab === "smart_classrooms"
          ? [
              { title: "Anganwadi FLN", kpi: "Telugu + English", color: "#f59e0b" },
              { title: "Mana Ooru Lab", kpi: `${tsatLabHours}h/wk Digital`, color: "#06b6d4" },
              { title: "T-SAT Vidya TV", kpi: "NEET / JEE / Poly", color: "#a78bfa" },
              { title: "Evening Library", kpi: `${metrics.smartReadyYouth} Active`, color: "#10b981" },
            ]
          : [
              { title: "Class 10–12", kpi: `${cohortStudents} Cohort`, color: "#38bdf8" },
              { title: "District ITI / YISC", kpi: "Drone + EV + Food", color: "#f59e0b" },
              { title: "TASK Finishing", kpi: `${taskSkillMatchPct}% Match`, color: "#ec4899" },
              { title: "Formal Placement", kpi: `₹${metrics.annualIncomeGainLakhs}L/yr`, color: "#10b981" },
            ];

      const pad = 24;
      const spacing = (w - pad * 2) / nodes.length;
      const cy = h * 0.54;

      // Connecting beam
      const startX = pad + spacing * 0.5;
      const endX = pad + spacing * (nodes.length - 0.5);
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(startX, cy);
      ctx.lineTo(endX, cy);
      ctx.stroke();

      for (let i = 0; i < 6; i++) {
        const p = ((tick * 0.008 + i / 6) % 1);
        const px = startX + p * (endX - startX);
        ctx.beginPath();
        ctx.arc(px, cy, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = "#fb7185";
        ctx.fill();
      }

      nodes.forEach((n, idx) => {
        const cx = pad + spacing * (idx + 0.5);
        const bw = Math.min(176, spacing - 14);
        const bh = 112;
        const bx = cx - bw / 2;
        const by = cy - bh / 2;

        ctx.fillStyle = "#0a1222";
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = n.color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, by, bw, bh);

        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "bold 10px monospace";
        ctx.fillText(`STAGE 0${idx + 1}`, bx + 12, by + 22);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(n.title, bx + 12, by + 48);

        ctx.fillStyle = n.color;
        ctx.font = "bold 14px monospace";
        ctx.fillText(n.kpi, bx + 12, by + 82);
      });

      ctx.restore();
      if (!prefersReduced) rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [showIntro, tab, washTransitPct, tsatLabHours, taskSkillMatchPct, cohortStudents, metrics]);

  return (
    <section
      id="sector-subportal-anchor"
      className="relative border border-rose-400/25 bg-[#060a14] text-white overflow-hidden"
    >
      {/* 3-SECOND CINEMATIC OPENING OVERLAY */}
      {showIntro && (
        <div className="relative min-h-[340px] flex flex-col items-center justify-center p-8 text-center bg-[#04070e]">
          <div
            className="text-xs font-medium tracking-[0.25em] text-rose-300 uppercase"
          >
            EDUCATION TRANSFORMATION SUB-PORTAL · TELANGANA
          </div>
          <h3 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Vidya—Sankalp 2047
          </h3>
          <p className="mt-3 max-w-xl text-sm text-white/65">
            Closing the {baseFemaleLitPct}% Female Literacy Gap · Mana Ooru Smart Classrooms · Direct TS ePASS &amp; TASK Career Bridges for {villageName}.
          </p>
          <div className="mt-6 w-64 h-1 bg-white/10 overflow-hidden">
            <div
              className="h-full bg-rose-400 transition-all duration-75"
              style={{ width: `${introProgress}%` }}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowIntro(false)}
            className="mt-5 px-4 py-1.5 border border-white/15 bg-white/5 hover:bg-white/10 text-xs text-white/75 transition"
          >
            Enter Sub-Portal
          </button>
        </div>
      )}

      {!showIntro && (
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <div className="text-xs font-medium text-rose-300 flex items-center gap-2">
                <GraduationCap size={14} />
                <span>VIDYA—SANKALP EDUCATION SUB-PORTAL · {villageName.toUpperCase()} ({districtName})</span>
              </div>
              <h3 className="mt-1.5 text-2xl font-bold text-white">
                Girls&apos; Retention, Bilingual Smart Labs &amp; Rural Career Engineering
              </h3>
            </div>
            <button
              type="button"
              onClick={replayIntro}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-white/15 bg-white/5 hover:bg-white/10 text-xs text-white/80 shrink-0"
            >
              <Play size={12} />
              <span>Replay 3s Intro</span>
            </button>
          </div>

          {/* 3 Interactive Pillars */}
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "girls_retention", label: "01 · Girls' Safe Transit & KGBV Parity", icon: Users },
                { id: "smart_classrooms", label: "02 · Mana Ooru Smart Labs & T-SAT", icon: Laptop },
                { id: "career_bridge", label: "03 · ITI, TASK & TS ePASS Careers", icon: BriefcaseBusiness },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 border text-xs font-medium transition ${
                    active
                      ? "border-rose-400/60 bg-rose-500/15 text-white"
                      : "border-white/10 bg-white/[0.02] text-white/60 hover:text-white"
                  }`}
                >
                  <Icon size={14} className={active ? "text-rose-300" : ""} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive 60fps Architecture Visual */}
          <canvas
            ref={canvasRef}
            className="w-full h-[250px] sm:h-[260px] border border-white/12 bg-[#060b16] block"
          />

          {/* Live Epidemiological / Educational Outcome Calculator */}
          <div className="grid lg:grid-cols-12 gap-6 items-center border border-white/10 bg-black/30 p-5">
            <div className="lg:col-span-6 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-rose-300 font-semibold">
                <Sparkles size={14} />
                <span>Interactive Intervention Calculator</span>
              </div>

              <label className="block space-y-1">
                <div className="flex justify-between font-mono tabular-nums">
                  <span className="text-white/75">Village School-Age Cohort (Classes 6–12)</span>
                  <span className="text-white font-semibold">{cohortStudents} Students</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={1200}
                  step={20}
                  value={cohortStudents}
                  onChange={(e) => setCohortStudents(Number(e.target.value))}
                  className="w-full accent-rose-400 cursor-pointer"
                />
              </label>

              <label className="block space-y-1">
                <div className="flex justify-between font-mono tabular-nums">
                  <span className="text-white/75">Functional Girls&apos; WASH + Free Bus Coverage</span>
                  <span className="text-rose-300 font-semibold">{washTransitPct}%</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={100}
                  value={washTransitPct}
                  onChange={(e) => setWashTransitPct(Number(e.target.value))}
                  className="w-full accent-rose-400 cursor-pointer"
                />
              </label>

              <label className="block space-y-1">
                <div className="flex justify-between font-mono tabular-nums">
                  <span className="text-white/75">Weekly Smart Lab &amp; T-SAT Digital Hours</span>
                  <span className="text-cyan-300 font-semibold">{tsatLabHours} hrs/wk</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={12}
                  value={tsatLabHours}
                  onChange={(e) => setTsatLabHours(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </label>

              <label className="block space-y-1">
                <div className="flex justify-between font-mono tabular-nums">
                  <span className="text-white/75">ITI / TASK Job &amp; Scholarship Alignment</span>
                  <span className="text-emerald-300 font-semibold">{taskSkillMatchPct}%</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={taskSkillMatchPct}
                  onChange={(e) => setTaskSkillMatchPct(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </label>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 gap-3 font-mono tabular-nums">
              <div className="border border-white/10 bg-[#08101c] p-4">
                <div className="text-[11px] font-sans text-white/55">Adolescent Girls Kept in School</div>
                <div className="mt-1 text-2xl font-bold text-rose-300">+{metrics.savedGirls}</div>
                <div className="mt-1 text-[11px] font-sans text-white/45">Prevented post-Class 8 dropout</div>
              </div>
              <div className="border border-white/10 bg-[#08101c] p-4">
                <div className="text-[11px] font-sans text-white/55">Digitally Fluent Students</div>
                <div className="mt-1 text-2xl font-bold text-cyan-300">{metrics.smartReadyYouth}</div>
                <div className="mt-1 text-[11px] font-sans text-white/45">Equipped for competitive &amp; AI workflows</div>
              </div>
              <div className="border border-white/10 bg-[#08101c] p-4">
                <div className="text-[11px] font-sans text-white/55">Projected 2035 Literacy Rate</div>
                <div className="mt-1 text-2xl font-bold text-amber-300">{metrics.projected2035Lit}%</div>
                <div className="mt-1 text-[11px] font-sans text-white/45">Up from {baseLiteracyPct}% baseline</div>
              </div>
              <div className="border border-white/10 bg-[#08101c] p-4">
                <div className="text-[11px] font-sans text-white/55">Village Youth Wage Addition</div>
                <div className="mt-1 text-2xl font-bold text-emerald-300">₹{metrics.annualIncomeGainLakhs}L/yr</div>
                <div className="mt-1 text-[11px] font-sans text-white/45">{metrics.placedSkilledGraduates} formal placements</div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3 text-xs text-white/75">
            <div className="border border-white/10 bg-white/[0.02] p-4 space-y-1">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <BookOpen size={13} className="text-rose-300" />
                <span>Bilingual Reading + FLN Mission</span>
              </div>
              <p className="leading-5 text-white/60">
                Daily 45-minute Telugu &amp; English foundational fluency blocks eliminate Class 6–8 comprehension backlogs.
              </p>
            </div>
            <div className="border border-white/10 bg-white/[0.02] p-4 space-y-1">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Award size={13} className="text-amber-300" />
                <span>TS ePASS &amp; Gurukulam Continuity</span>
              </div>
              <p className="leading-5 text-white/60">
                Proactive Gram Panchayat scholarship camps guarantee zero first-generation families miss residential Gurukulam seats.
              </p>
            </div>
            <div className="border border-white/10 bg-white/[0.02] p-4 space-y-1">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Laptop size={13} className="text-cyan-300" />
                <span>Solarized Gram Panchayat Smart Hub</span>
              </div>
              <p className="leading-5 text-white/60">
                Turns every closed 5 PM schoolroom into a solar-powered evening study &amp; TASK digital certification center.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
