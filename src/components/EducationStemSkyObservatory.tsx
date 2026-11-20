import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  GraduationCap,
  RefreshCw,
  Satellite,
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

type IssTelemetry = {
  source: string;
  latitude: number;
  longitude: number;
  altitudeKm: number;
  velocityKmh: number;
  visibility: string;
  footprintKm: number;
  solarLat: number;
  solarLon: number;
  timestampIso: string;
};

type SunTelemetry = {
  current?: { solarRadiationWm2?: number };
  agroHydro?: { sunriseIso?: string; sunsetIso?: string };
};

const EDUCATION_THREATS = [
  {
    name: "Adolescent Girls' Transport & WASH Dropout Trap",
    cause: "Long unsafe walks past Class 8 + missing separate functional toilets & sanitation.",
    consequence: "Sharp female literacy drop-off between ages 13 and 17 despite strong primary scores.",
    action: "Free RTC student transit pass + clean school WASH blocks + girl-STEM role-model circles.",
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
    action: "Seasonal bridge-learning booklets + ePASS hostel/scholarship continuity tracking.",
  },
];

function getLatLon(village: SectorInsightsVillage | null): [number, number] {
  if (typeof village?.lat === "number" && typeof village?.lon === "number") {
    return [village.lat, village.lon];
  }
  return [17.385, 78.4867];
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/* =========================================================
   LIVE ISS ORBITAL TRACKER & EARTH DAY/NIGHT TERMINATOR CANVAS
========================================================= */
function StemSkyTrackerCanvas({
  iss,
  villageLat,
  villageLon,
  villageName,
}: {
  iss: IssTelemetry | null;
  villageLat: number;
  villageLon: number;
  villageName: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ref = useRef({ iss, villageLat, villageLon, villageName });
  ref.current = { iss, villageLat, villageLon, villageName };

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

    const lonToX = (lon: number, w: number) => ((lon + 180) / 360) * w;
    const latToY = (lat: number, h: number) => ((90 - lat) / 180) * h;

    const draw = () => {
      tick += prefersReduced ? 0 : 1;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(320, rect.width);
      const h = Math.max(290, rect.height);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }

      const { iss: curIss, villageLat: vLat, villageLon: vLon, villageName: vName } = ref.current;
      const issLat = curIss?.latitude ?? 15.2;
      const issLon = curIss?.longitude ?? 74.8;
      const solLat = curIss?.solarLat ?? -19.5;
      const solLon = curIss?.solarLon ?? 82.0;

      ctx.save();
      ctx.scale(dpr, dpr);

      // Base Night Ocean
      ctx.fillStyle = "#040916";
      ctx.fillRect(0, 0, w, h);

      // Subtle Lat/Lon Scientific Graticule
      ctx.strokeStyle = "rgba(148, 163, 184, 0.14)";
      ctx.lineWidth = 1;
      for (let lon = -150; lon <= 150; lon += 30) {
        const x = lonToX(lon, w);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let lat = -60; lat <= 60; lat += 30) {
        const y = latToY(lat, h);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Simplified World Continents Silhouettes (for clear STEM orbital orientation)
      const continents: [number, number][][] = [
        // Americas
        [[70, -165], [68, -95], [48, -55], [25, -80], [10, -78], [-52, -70], [-20, -40], [10, -60], [28, -110], [52, -135]],
        // Eurasia + India
        [[70, -10], [72, 160], [50, 140], [22, 115], [8, 102], [20, 88], [8, 77], [24, 66], [15, 42], [35, 34], [38, -8]],
        // Africa
        [[35, -6], [30, 32], [12, 50], [-34, 24], [-30, 15], [4, 6], [14, -17]],
        // Australia
        [[-12, 130], [-25, 153], [-38, 145], [-34, 115], [-20, 115]],
      ];
      continents.forEach((poly) => {
        ctx.beginPath();
        poly.forEach(([lt, ln], i) => {
          const px = lonToX(ln, w);
          const py = latToY(lt, h);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.fillStyle = "rgba(56, 189, 248, 0.14)";
        ctx.fill();
        ctx.strokeStyle = "rgba(56, 189, 248, 0.38)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Real-Time Solar Illumination Glow Centered at Sub-Solar Coordinate
      const sx = lonToX(solLon, w);
      const sy = latToY(solLat, h);
      const dayGlow = ctx.createRadialGradient(sx, sy, 10, sx, sy, w * 0.44);
      dayGlow.addColorStop(0, "rgba(251, 191, 36, 0.28)");
      dayGlow.addColorStop(0.55, "rgba(251, 191, 36, 0.08)");
      dayGlow.addColorStop(1, "rgba(4, 9, 22, 0)");
      ctx.fillStyle = dayGlow;
      ctx.fillRect(0, 0, w, h);

      // Sub-Solar Icon
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#fbbf24";
      ctx.fill();
      ctx.fillStyle = "#fde68a";
      ctx.font = "10px Consolas, monospace";
      ctx.fillText("SUN OVERHEAD", sx + 10, sy + 3);

      // Sinusoidal 51.6° Inclination Orbital Ground Track passing through current ISS position
      const phaseOffset = Math.asin(Math.max(-1, Math.min(1, issLat / 51.6)));
      ctx.beginPath();
      for (let step = -180; step <= 180; step += 3) {
        const lon = step;
        const radShift = ((lon - issLon) * Math.PI) / 180;
        const lat = 51.6 * Math.sin(phaseOffset + radShift);
        const px = lonToX(lon, w);
        const py = latToY(lat, h);
        if (step === -180) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = "rgba(167, 139, 250, 0.65)";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Village Pin (Telangana)
      const vx = lonToX(vLon, w);
      const vy = latToY(vLat, h);
      ctx.beginPath();
      ctx.arc(vx, vy, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = "#10b981";
      ctx.fill();
      ctx.fillStyle = "#6ee7b7";
      ctx.font = "bold 10.5px Calibri, sans-serif";
      ctx.fillText(vName.slice(0, 18), vx + 8, vy + 3);

      // Live ISS Position + Radar Visibility Footprint
      const ix = lonToX(issLon, w);
      const iy = latToY(issLat, h);
      const pulse = prefersReduced ? 0 : (Math.sin(tick * 0.08) + 1) * 5;

      ctx.beginPath();
      ctx.arc(ix, iy, 28 + pulse, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(167, 139, 250, 0.14)";
      ctx.fill();
      ctx.strokeStyle = "rgba(167, 139, 250, 0.7)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // ISS Solar Array Glyph
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(ix - 9, iy - 3, 5, 6);
      ctx.fillRect(ix + 4, iy - 3, 5, 6);
      ctx.fillStyle = "#c4b5fd";
      ctx.fillRect(ix - 3, iy - 2, 6, 4);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px Consolas, monospace";
      ctx.fillText(`ISS (${issLat}°, ${issLon}°)`, ix + 14, iy - 8);

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
      className="w-full h-[300px] sm:h-[330px] rounded-lg border border-white/15 bg-[#040916] block cursor-crosshair"
    />
  );
}

export default function EducationStemSkyObservatory({
  village,
}: {
  village: SectorInsightsVillage | null;
}) {
  const [vLat, vLon] = useMemo(() => getLatLon(village), [village]);
  const [iss, setIss] = useState<IssTelemetry | null>(null);
  const [sun, setSun] = useState<SunTelemetry | null>(null);
  const [loading, setLoading] = useState(false);

  const [digitalSkillPct, setDigitalSkillPct] = useState<number>(65);
  const [femaleCompletionPct, setFemaleCompletionPct] = useState<number>(80);

  const fetchStemFeeds = useCallback(async () => {
    setLoading(true);
    try {
      const [iRes, wRes] = await Promise.all([
        fetch("/api/telemetry/iss"),
        fetch(`/api/telemetry/weather?lat=${vLat}&lon=${vLon}`),
      ]);
      if (iRes.ok) setIss((await iRes.json()) as IssTelemetry);
      if (wRes.ok) setSun((await wRes.json()) as SunTelemetry);
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  }, [vLat, vLon]);

  useEffect(() => {
    void fetchStemFeeds();
  }, [fetchStemFeeds]);

  const distanceToIssKm = useMemo(() => {
    if (!iss) return 0;
    return haversineKm(vLat, vLon, iss.latitude, iss.longitude);
  }, [iss, vLat, vLon]);

  // Interactive 2026-2047 Education Income Multiplier Curve
  const learningProjection = useMemo(() => {
    const baseLit = village?.education.literacyRate ?? 66;
    const years = [2026, 2030, 2034, 2038, 2042, 2047];
    return years.map((yr, idx) => {
      const frac = idx / (years.length - 1);
      const lift = (digitalSkillPct * 0.45 + femaleCompletionPct * 0.55) / 100;
      const baselineIndex = Math.round(baseLit + frac * 11);
      const empoweredIndex = Math.min(99, Math.round(baseLit + frac * (28 * lift + 8)));
      return {
        year: String(yr),
        baseline: baselineIndex,
        empowered: empoweredIndex,
      };
    });
  }, [village?.education.literacyRate, digitalSkillPct, femaleCompletionPct]);

  return (
    <div className="space-y-6">
      {/* Live ISS Space Lab & Earth-Sun Telemetry */}
      <section className="jd-keep-dark rounded-xl border border-white/15 bg-[#060b18] text-white p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="text-xs font-semibold text-violet-300 flex items-center gap-1.5">
              <Satellite size={14} />
              <span>LIVE STEM SPACE &amp; ASTRONOMY CLASSROOM · NORAD 25544</span>
            </div>
            <h3 className="mt-1 text-xl font-bold text-white">
              Live International Space Station Orbit &amp; Solar Day-Night Map
            </h3>
            <p className="mt-0.5 text-xs text-white/65">
              {iss?.source ?? "Real-time Orbital Telemetry"} — watch Earth&apos;s sunlight terminator and track the ISS live relative to{" "}
              <span className="text-white font-medium">{village?.villageName ?? "Telangana"}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchStemFeeds()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-medium text-white whitespace-nowrap shrink-0"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Update ISS Orbit
          </button>
        </div>

        <StemSkyTrackerCanvas
          iss={iss}
          villageLat={vLat}
          villageLon={vLon}
          villageName={village?.villageName ?? "Telangana Village"}
        />

        {/* 4 Live Orbital & Solar Telemetry Gauges */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono tabular-nums">
          <div className="rounded-lg border border-white/10 bg-black/40 p-3">
            <div className="text-[10px] text-white/55 font-sans">ISS Altitude &amp; Speed</div>
            <div className="mt-1 text-lg font-bold text-violet-300">
              {iss?.altitudeKm ?? "422"} km
            </div>
            <div className="text-[10px] text-white/60">
              {(iss?.velocityKmh ?? 27580).toLocaleString("en-IN")} km/h
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/40 p-3">
            <div className="text-[10px] text-white/55 font-sans">Ground Distance to Village</div>
            <div className="mt-1 text-lg font-bold text-emerald-300">
              {distanceToIssKm.toLocaleString("en-IN")} km
            </div>
            <div className="text-[10px] text-white/60 capitalize">
              Status: {iss?.visibility ?? "daylight"}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/40 p-3">
            <div className="text-[10px] text-white/55 font-sans">Live Solar Irradiance</div>
            <div className="mt-1 text-lg font-bold text-amber-300">
              {sun?.current?.solarRadiationWm2 ?? "610"} W/m²
            </div>
            <div className="text-[10px] text-white/60">
              Sun lat: {iss?.solarLat ?? "-19.5"}°
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/40 p-3">
            <div className="text-[10px] text-white/55 font-sans">Village Sunrise / Sunset</div>
            <div className="mt-1 text-sm font-bold text-cyan-300">
              {sun?.agroHydro?.sunriseIso ? sun.agroHydro.sunriseIso.slice(11, 16) : "06:18"} /{" "}
              {sun?.agroHydro?.sunsetIso ? sun.agroHydro.sunsetIso.slice(11, 16) : "17:42"}
            </div>
            <div className="text-[10px] text-white/60">IST Local Horizon</div>
          </div>
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
                  <span className="font-bold text-violet-600 dark:text-violet-300 tabular-nums">{digitalSkillPct}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={digitalSkillPct}
                  onChange={(e) => setDigitalSkillPct(Number(e.target.value))}
                  className="w-full accent-violet-500 cursor-pointer"
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
                  name="STEM + Retention Target"
                  stroke="#a78bfa"
                  fill="rgba(167,139,250,0.24)"
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
