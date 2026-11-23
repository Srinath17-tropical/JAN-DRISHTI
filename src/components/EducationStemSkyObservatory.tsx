import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  BookOpen,
  GraduationCap,
  Laptop,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SectorInsightsVillage } from "./SectorActionModules";

type WeatherTelemetry = {
  current?: { tempC?: number; solarRadiationWm2?: number };
  agroHydro?: { sunriseIso?: string; sunsetIso?: string };
};

const EDUCATION_THREATS = [
  {
    name: "Adolescent Girls' Transport & WASH Dropout Trap",
    cause: "Long unsafe walks past Class 8 + missing separate functional toilets & sanitation.",
    consequence: "Sharp female literacy drop-off between ages 13 and 17 despite strong primary scores.",
    action: "Free TGRTC student transit pass + clean school WASH blocks + girl-STEM role-model circles.",
  },
  {
    name: "Digital Divide & Cyber / UPI Scam Vulnerability",
    cause: "First-generation smartphone use without fraud literacy or practical career guidance.",
    consequence: "Families lose savings to KYC/OTP scams while rural youth miss online scholarships.",
    action: "Monthly school Cyber-Safety & 1930 Shield clinics + evening adult digital literacy.",
  },
  {
    name: "Foundational Reading & Math Lag",
    cause: "Crowded multi-grade classrooms with limited bilingual reading corners or peer support.",
    consequence: "Students reach Class 9 struggling with fractions and English comprehension.",
    action: "Bright evening community libraries + college volunteer 'No Child Left Behind' peer buddies.",
  },
  {
    name: "Seasonal Agricultural Migration Disruption",
    cause: "Children travel away for 2–3 months during peak cotton/harvest seasons.",
    consequence: "Broken exam continuity and early shift into low-paid informal manual labor.",
    action: "Seasonal bridge-learning booklets + TS ePASS hostel/scholarship continuity tracking.",
  },
];

function getLatLon(village: SectorInsightsVillage | null): [number, number] {
  if (typeof village?.lat === "number" && typeof village?.lon === "number") {
    return [village.lat, village.lon];
  }
  return [17.385, 78.4867];
}

/* =========================================================
   TELANGANA STUDENT LIFECYCLE & DIGITAL READINESS CANVAS
========================================================= */
function StudentPipelineCanvas({
  villageName,
  literacyRate,
  femaleLiteracyRate,
  mobileCoveragePct,
  nearestSchoolKm,
}: {
  villageName: string;
  literacyRate: number;
  femaleLiteracyRate: number;
  mobileCoveragePct: number;
  nearestSchoolKm: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dataRef = useRef({
    villageName,
    literacyRate,
    femaleLiteracyRate,
    mobileCoveragePct,
    nearestSchoolKm,
  });
  dataRef.current = {
    villageName,
    literacyRate,
    femaleLiteracyRate,
    mobileCoveragePct,
    nearestSchoolKm,
  };

  useEffect(() => {
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
      const h = Math.max(270, rect.height);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }

      const {
        villageName: vName,
        literacyRate: lit,
        femaleLiteracyRate: fLit,
        mobileCoveragePct: mob,
        nearestSchoolKm: km,
      } = dataRef.current;

      const stageRetention = [
        {
          title: "01 · Anganwadi FLN",
          sub: "Ages 3–6 Nutrition + Play",
          pct: 92,
          color: "#f59e0b",
        },
        {
          title: "02 · Primary Class 1–5",
          sub: "Mana Ooru – Mana Badi",
          pct: Math.min(96, Math.round(lit + 18)),
          color: "#06b6d4",
        },
        {
          title: "03 · Girl Secondary 8–12",
          sub: `${km.toFixed(1)} km reach · TGRTC Pass`,
          pct: Math.min(94, Math.round(fLit + 8)),
          color: "#f43f5e",
        },
        {
          title: "04 · Career & TASK Skill",
          sub: `${mob}% digital link · ePASS`,
          pct: Math.min(92, Math.round((fLit + mob) / 2)),
          color: "#10b981",
        },
      ];

      ctx.save();
      ctx.scale(dpr, dpr);

      ctx.fillStyle = "#040915";
      ctx.fillRect(0, 0, w, h);

      // Subtle Engineering Grid
      ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
      ctx.lineWidth = 1;
      for (let gx = 40; gx < w; gx += 48) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = 36; gy < h; gy += 48) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      // Header Label
      ctx.fillStyle = "rgba(255,255,255,0.72)";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(
        `${vName.toUpperCase()} · STUDENT LEARNING & CAREER TRANSITION CORRIDOR`,
        18,
        24
      );

      const padX = 28;
      const usableW = w - padX * 2;
      const stepW = usableW / 4;
      const midY = h * 0.52;

      // Connector Track
      const trackStart = padX + stepW * 0.5;
      const trackEnd = padX + stepW * 3.5;
      ctx.strokeStyle = "rgba(255,255,255,0.16)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(trackStart, midY);
      ctx.lineTo(trackEnd, midY);
      ctx.stroke();

      // Animated Student Progress Pulses along track
      for (let p = 0; p < 7; p++) {
        const phase = ((tick * 0.006 + p / 7) % 1);
        const px = trackStart + phase * (trackEnd - trackStart);
        ctx.beginPath();
        ctx.arc(px, midY, 4, 0, Math.PI * 2);
        ctx.fillStyle =
          phase < 0.33
            ? "#f59e0b"
            : phase < 0.66
            ? "#f43f5e"
            : "#10b981";
        ctx.fill();
      }

      // 4 Stage Nodes
      stageRetention.forEach((st, idx) => {
        const cx = padX + stepW * (idx + 0.5);
        const boxW = Math.min(185, stepW - 18);
        const boxH = 128;
        const bx = cx - boxW / 2;
        const by = midY - boxH / 2;

        ctx.fillStyle = "#081122";
        ctx.fillRect(bx, by, boxW, boxH);
        ctx.strokeStyle = st.color;
        ctx.lineWidth = 1.4;
        ctx.strokeRect(bx, by, boxW, boxH);

        // Node Title
        ctx.fillStyle = st.color;
        ctx.font = "bold 11px sans-serif";
        ctx.fillText(st.title, bx + 10, by + 20);

        ctx.fillStyle = "rgba(226, 232, 240, 0.72)";
        ctx.font = "10px sans-serif";
        ctx.fillText(st.sub, bx + 10, by + 37);

        // Percentage Gauge
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 22px monospace";
        ctx.fillText(`${st.pct}%`, bx + 10, by + 76);

        ctx.fillStyle = "rgba(148,163,184,0.8)";
        ctx.font = "10px sans-serif";
        ctx.fillText("Cohort Transition", bx + 10, by + 93);

        // Progress Bar at bottom of node
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.fillRect(bx + 10, by + 106, boxW - 20, 6);
        ctx.fillStyle = st.color;
        ctx.fillRect(bx + 10, by + 106, ((boxW - 20) * st.pct) / 100, 6);
      });

      ctx.restore();
      if (!prefersReduced) {
        rafId = requestAnimationFrame(draw);
      }
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[270px] sm:h-[290px] border border-white/15 bg-[#040915] block"
    />
  );
}

export default function EducationStemSkyObservatory({
  village,
  mobileCoveragePct: mobileProp,
}: {
  village: SectorInsightsVillage | null;
  mobileCoveragePct?: number;
}) {
  const [vLat, vLon] = useMemo(() => getLatLon(village), [village]);
  const [weather, setWeather] = useState<WeatherTelemetry | null>(null);
  const [loading, setLoading] = useState(false);

  const [digitalSkillPct, setDigitalSkillPct] = useState<number>(68);
  const [femaleCompletionPct, setFemaleCompletionPct] = useState<number>(84);

  const fetchDaylightTelemetry = useCallback(async () => {
    setLoading(true);
    try {
      const wRes = await fetch(`/api/telemetry/weather?lat=${vLat}&lon=${vLon}`);
      if (wRes.ok) setWeather((await wRes.json()) as WeatherTelemetry);
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  }, [vLat, vLon]);

  useEffect(() => {
    void fetchDaylightTelemetry();
  }, [fetchDaylightTelemetry]);

  const literacyRate = village?.education.literacyRate ?? 66.5;
  const femaleLiteracyRate = village?.education.femaleLiteracyRate ?? 57.9;
  const genderGap = Number(Math.max(0, literacyRate - femaleLiteracyRate).toFixed(1));
  const mobileCoveragePct = mobileProp ?? 62.0;
  const nearestSchoolKm = village?.education.nearestSchoolKm ?? 1.8;
  const nearestSchoolName = village?.education.nearestSchoolName ?? "ZPHS Mandal High School";

  // Interactive 2026-2047 Education Income Multiplier Curve
  const learningProjection = useMemo(() => {
    const years = [2026, 2030, 2034, 2038, 2042, 2047];
    return years.map((yr, idx) => {
      const frac = idx / (years.length - 1);
      const lift = (digitalSkillPct * 0.45 + femaleCompletionPct * 0.55) / 100;
      const baselineIndex = Math.round(literacyRate + frac * 11);
      const empoweredIndex = Math.min(99, Math.round(literacyRate + frac * (28 * lift + 8)));
      return {
        year: String(yr),
        baseline: baselineIndex,
        empowered: empoweredIndex,
      };
    });
  }, [literacyRate, digitalSkillPct, femaleCompletionPct]);

  return (
    <div className="space-y-6">
      {/* TELANGANA STUDENT PIPELINE, SCHOLARSHIP & DIGITAL CAREER OBSERVATORY */}
      <section className="jd-keep-dark border border-white/15 bg-[#060b18] text-white p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
              <Laptop size={14} />
              <span>TELANGANA SCHOOL-TO-CAREER, SCHOLARSHIP &amp; DIGITAL OBSERVATORY</span>
            </div>
            <h3 className="mt-1 text-xl font-bold text-white">
              Village Learning Transition, Female Parity &amp; Career Pipeline
            </h3>
            <p className="mt-0.5 text-xs text-white/65">
              Real-time progression diagnostics for{" "}
              <span className="text-white font-medium">{village?.villageName ?? "Telangana Settlement"}</span>{" "}
              linking Anganwadi FLN, {nearestSchoolName}, T-SAT Vidya digital access, and TS ePASS career retention.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchDaylightTelemetry()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-medium text-white whitespace-nowrap shrink-0"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh Campus Conditions
          </button>
        </div>

        <StudentPipelineCanvas
          villageName={village?.villageName ?? "Telangana Settlement"}
          literacyRate={literacyRate}
          femaleLiteracyRate={femaleLiteracyRate}
          mobileCoveragePct={mobileCoveragePct}
          nearestSchoolKm={nearestSchoolKm}
        />

        {/* 4 Actionable Education Gauges */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono tabular-nums">
          <div className="border border-white/10 bg-black/40 p-3">
            <div className="text-[11px] text-white/55 font-sans">Female Literacy &amp; Parity Gap</div>
            <div className="mt-1 text-lg font-bold text-rose-300">
              {femaleLiteracyRate}%
            </div>
            <div className="text-[11px] text-white/60 font-sans">
              Gap vs Overall: {genderGap} pts
            </div>
          </div>

          <div className="border border-white/10 bg-black/40 p-3">
            <div className="text-[11px] text-white/55 font-sans">Nearest Secondary School</div>
            <div className="mt-1 text-lg font-bold text-cyan-300">
              {nearestSchoolKm.toFixed(1)} km
            </div>
            <div className="text-[11px] text-white/60 font-sans truncate">
              {nearestSchoolName}
            </div>
          </div>

          <div className="border border-white/10 bg-black/40 p-3">
            <div className="text-[11px] text-white/55 font-sans">T-SAT &amp; Telecom Reach</div>
            <div className="mt-1 text-lg font-bold text-emerald-300">
              {mobileCoveragePct}%
            </div>
            <div className="text-[11px] text-white/60 font-sans">
              Household phone readiness
            </div>
          </div>

          <div className="border border-white/10 bg-black/40 p-3">
            <div className="text-[11px] text-white/55 font-sans">Campus Daylight &amp; Heat</div>
            <div className="mt-1 text-sm font-bold text-amber-300">
              {weather?.agroHydro?.sunriseIso ? weather.agroHydro.sunriseIso.slice(11, 16) : "06:18"} –{" "}
              {weather?.agroHydro?.sunsetIso ? weather.agroHydro.sunsetIso.slice(11, 16) : "17:42"} IST
            </div>
            <div className="text-[11px] text-white/60 font-sans">
              {weather?.current?.tempC ?? 29}°C ambient · Evening solar library window
            </div>
          </div>
        </div>

        {/* Telangana Scholarship & Career Bridges */}
        <div className="grid md:grid-cols-3 gap-3 pt-1">
          {[
            {
              title: "TS ePASS & Post-Matric Scholarships",
              detail: "Direct tuition & hostel fee reimbursement preventing Class 10–Degree financial dropouts.",
              tag: "Financial Retention",
            },
            {
              title: "TASK & Telangana Skill University",
              detail: "Free Finishing School in coding, EV servicing, agritech drones, and food-tech QC for rural graduates.",
              tag: "Youth Employability",
            },
            {
              title: "T-SAT Vidya & Mana Ooru Smart Labs",
              detail: "Bilingual Telugu/English live JEE/EAPCET/polytechnic coaching beamed free to every ZPHS & KGBV.",
              tag: "Zero-Cost Coaching",
            },
          ].map((card) => (
            <div key={card.title} className="border border-white/10 bg-[#081020] p-4 space-y-1.5">
              <div className="text-[11px] font-medium text-amber-300 flex items-center gap-1.5">
                <Award size={12} />
                <span>{card.tag}</span>
              </div>
              <div className="text-sm font-semibold text-white">{card.title}</div>
              <p className="text-xs leading-5 text-white/65">{card.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive 2026-2047 Learning & Gender Parity Simulator + Threats */}
      <section className="border border-slate-200 dark:border-white/12 bg-white dark:bg-[#070b12] p-6 space-y-5">
        <div className="grid lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <GraduationCap size={15} />
              <span>2026–2047 LITERACY &amp; STEM COMPOUNDING ENGINE</span>
            </div>
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
              Test How Girl-Child Retention &amp; Digital Labs Lift Future Readiness
            </h4>

            <div className="space-y-3 text-xs">
              <label className="block space-y-1">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-700 dark:text-white/80">Female Class 10–12 Completion</span>
                  <span className="font-bold text-rose-600 dark:text-rose-300 tabular-nums">{femaleCompletionPct}%</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={femaleCompletionPct}
                  onChange={(e) => setFemaleCompletionPct(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </label>

              <label className="block space-y-1">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-700 dark:text-white/80">Tinkering &amp; Digital Lab Access</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-300 tabular-nums">{digitalSkillPct}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={digitalSkillPct}
                  onChange={(e) => setDigitalSkillPct(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          <div className="lg:col-span-7 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={learningProjection}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis domain={[40, 100]} unit="%" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#09111f",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="empowered"
                  name="Career & Retention Target"
                  stroke="#fb7185"
                  fill="rgba(251,113,133,0.22)"
                  strokeWidth={2.5}
                />
                <Area
                  type="monotone"
                  dataKey="baseline"
                  name="Business as Usual"
                  stroke="#64748b"
                  fill="rgba(100,116,139,0.12)"
                  strokeDasharray="4 4"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Education Threats Breakdown */}
        <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <ShieldAlert size={15} className="text-rose-500" />
            <span>Threats to Rural Learning &amp; Youth Readiness</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {EDUCATION_THREATS.map((et) => (
              <div
                key={et.name}
                className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#050911] p-4 space-y-1.5"
              >
                <div className="text-sm font-semibold text-rose-600 dark:text-rose-300 flex items-center gap-1.5">
                  <BookOpen size={13} />
                  {et.name}
                </div>
                <div className="text-xs text-slate-700 dark:text-white/80">
                  <span className="font-semibold text-slate-900 dark:text-white">Root Cause: </span>
                  {et.cause}
                </div>
                <div className="text-xs text-slate-700 dark:text-white/75">
                  <span className="font-semibold text-slate-900 dark:text-white">Impact: </span>
                  {et.consequence}
                </div>
                <div className="pt-1.5 border-t border-slate-200 dark:border-white/10 text-xs text-emerald-700 dark:text-emerald-300">
                  <span className="font-semibold">Bridge Fix: </span>
                  {et.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
