import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BriefcaseBusiness,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
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
import type { SectorInsightsVillage } from "./SectorActionModules";

type ValueChainCommodity = {
  id: string;
  label: string;
  rawPriceInr: number;
  spoilageLossPct: number;
  middlemanCutPct: number;
  fpoGradingBoostPct: number;
  brandingExportBoostPct: number;
  valueStepNote: string;
};

const COMMODITIES: ValueChainCommodity[] = [
  {
    id: "chilli",
    label: "Dry Red Chilli",
    rawPriceInr: 100,
    spoilageLossPct: 16,
    middlemanCutPct: 20,
    fpoGradingBoostPct: 24,
    brandingExportBoostPct: 38,
    valueStepNote: "Solar cold storage + stem-less sorting & spice-pack branding avoids distress harvest dumps.",
  },
  {
    id: "turmeric",
    label: "Turmeric Fingers",
    rawPriceInr: 100,
    spoilageLossPct: 14,
    middlemanCutPct: 22,
    fpoGradingBoostPct: 26,
    brandingExportBoostPct: 44,
    valueStepNote: "Steam curing, polishing & curcumin testing converts raw rhizomes into export-grade powder.",
  },
  {
    id: "millets",
    label: "Foxtail & Jowar Millets",
    rawPriceInr: 100,
    spoilageLossPct: 12,
    middlemanCutPct: 18,
    fpoGradingBoostPct: 28,
    brandingExportBoostPct: 48,
    valueStepNote: "Women SHG de-husking & millet bakery cookies capture urban nutrition margins locally.",
  },
  {
    id: "dairy",
    label: "Village Milk & Dairy",
    rawPriceInr: 100,
    spoilageLossPct: 18,
    middlemanCutPct: 19,
    fpoGradingBoostPct: 22,
    brandingExportBoostPct: 42,
    valueStepNote: "Solar bulk-milk chillers + fat-transparent billing enable direct A2 ghee & paneer sales.",
  },
];

type CareerPathway = {
  id: string;
  title: string;
  category: string;
  startupInr: string;
  yr1MonthlyInr: number;
  yr3MonthlyInr: number;
  yr5MonthlyInr: number;
  note: string;
};

const CAREER_PATHWAYS: CareerPathway[] = [
  {
    id: "drone",
    title: "Agri-Drone Pilot & Soil Testing Hub",
    category: "Precision Agri-Tech",
    startupInr: "Subsidized (Namo Drone Didi / FPO)",
    yr1MonthlyInr: 28000,
    yr3MonthlyInr: 46000,
    yr5MonthlyInr: 68000,
    note: "Precision spraying + rapid NPK soil cards serve 10–15 nearby villages.",
  },
  {
    id: "solar",
    title: "Solar PV & PM-KUSUM Pump Technician",
    category: "Clean Energy Trades",
    startupInr: "₹35K Toolkit (Skill Grant)",
    yr1MonthlyInr: 22000,
    yr3MonthlyInr: 39000,
    yr5MonthlyInr: 58000,
    note: "High rural demand installing & maintaining rooftop solar, streetlamps & farm pumps.",
  },
  {
    id: "remote",
    title: "Broadband Remote BPO, Design & Data Desk",
    category: "Digital Economy",
    startupInr: "Gram Panchayat Co-Work Desk",
    yr1MonthlyInr: 24000,
    yr3MonthlyInr: 44000,
    yr5MonthlyInr: 72000,
    note: "Work for urban & global teams in Telugu/English without paying city rent.",
  },
  {
    id: "shg-food",
    title: "Women SHG Millet Bakery & Cloud Kitchen",
    category: "Food Processing",
    startupInr: "Stree Nidhi 0% + PMFME 35%",
    yr1MonthlyInr: 19000,
    yr3MonthlyInr: 36000,
    yr5MonthlyInr: 54000,
    note: "Hostel tiffins, packaged millet snacks & festival sweets sold via ONDC/retail.",
  },
  {
    id: "ev",
    title: "EV Auto / Two-Wheeler Charging & Repair",
    category: "Green Mobility",
    startupInr: "₹1.2L Mudra + Solar Canopy",
    yr1MonthlyInr: 25000,
    yr3MonthlyInr: 42000,
    yr5MonthlyInr: 64000,
    note: "Clean mobility diagnostics and solar charging along rural market junctions.",
  },
  {
    id: "ecotour",
    title: "Eco-Tourism, Lake Trails & GI Craft Studio",
    category: "Heritage & Services",
    startupInr: "Minimal Local Collective",
    yr1MonthlyInr: 18000,
    yr3MonthlyInr: 34000,
    yr5MonthlyInr: 52000,
    note: "Guided wetland bird-walks, farm stays & direct e-commerce craft storefronts.",
  },
];

const LIVELIHOOD_THREATS = [
  {
    name: "Distress Harvest Selling & Middleman Cuts",
    process: "Farmers sell raw crops immediately at harvest when mandis flood with supply.",
    threat: "Loses 25–38% of retail value before produce ever leaves the mandal.",
    fix: "FPO solar cold storage + pledge-loan liquidity so harvests wait for fair pricing.",
  },
  {
    name: "Post-Harvest Moisture & Fungal Spoilage",
    process: "Open-ground sun drying exposes chillies/turmeric to unseasonal rain & aflatoxins.",
    threat: "Destroys 14–20% harvest volume and disqualifies export quality batches.",
    fix: "Community solar-tunnel dryers & moisture meters at every Rythu Vedika.",
  },
  {
    name: "Diesel & Chemical Input Cost Squeeze",
    process: "Rising pump fuel and synthetic fertilizer prices eat farm profit margins.",
    threat: "Traps smallholders in high-interest seasonal debt cycles.",
    fix: "PM-KUSUM solar pumps, bio-fertilizers, apiculture pollination (+20% yield) & vermicompost.",
  },
  {
    name: "Youth Brain-Drain & Forced Urban Migration",
    process: "Educated rural youth see zero local tech, clean-energy, or digital jobs nearby.",
    threat: "Leaves villages aging while migrants face steep urban rent & health strain.",
    fix: "Local Agri-Drone, Solar PV, EV repair & fiber Remote-Work desks inside mandal centers.",
  },
];

/* =========================================================
   60FPS ANIMATED FARM-TO-MARKET VALUE-ADD PIPELINE CANVAS
========================================================= */
function ValueChainPipelineCanvas({ commodity }: { commodity: ValueChainCommodity }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ref = useRef({ commodity });
  ref.current = { commodity };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const crates = Array.from({ length: 12 }, (_, i) => ({
      t: i / 12,
      track: i % 2 === 0 ? "raw" : "fpo",
    }));

    let rafId = 0;

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(320, rect.width);
      const h = Math.max(255, rect.height);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }

      const { commodity: com } = ref.current;
      const rawFinal = Math.round(
        com.rawPriceInr * (1 - com.spoilageLossPct / 100) * (1 - com.middlemanCutPct / 100)
      );
      const fpoFinal = Math.round(
        com.rawPriceInr *
          (1 + com.fpoGradingBoostPct / 100) *
          (1 + com.brandingExportBoostPct / 100)
      );

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#050914";
      ctx.fillRect(0, 0, w, h);

      const topY = h * 0.31;
      const botY = h * 0.72;
      const startX = w * 0.08;
      const endX = w * 0.88;
      const span = endX - startX;

      // Track A (Distress Raw Sale)
      ctx.strokeStyle = "rgba(244, 63, 94, 0.45)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(startX, topY);
      ctx.lineTo(endX, topY);
      ctx.stroke();

      // Track B (FPO Solar Cold-Chain + Branding)
      ctx.strokeStyle = "rgba(16, 185, 129, 0.65)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(startX, botY);
      ctx.lineTo(endX, botY);
      ctx.stroke();

      // Stage Nodes along both pipelines
      const rawNodes = [
        { p: 0, lbl: `Harvest (₹100)` },
        { p: 0.35, lbl: `Spoilage (-${com.spoilageLossPct}%)` },
        { p: 0.7, lbl: `Middleman (-${com.middlemanCutPct}%)` },
        { p: 1, lbl: `Retained: ₹${rawFinal}` },
      ];
      const fpoNodes = [
        { p: 0, lbl: `Harvest (₹100)` },
        { p: 0.35, lbl: `Solar Grading (+${com.fpoGradingBoostPct}%)` },
        { p: 0.7, lbl: `SHG Branded (+${com.brandingExportBoostPct}%)` },
        { p: 1, lbl: `Retained: ₹${fpoFinal}` },
      ];

      rawNodes.forEach((n, idx) => {
        const nx = startX + n.p * span;
        ctx.beginPath();
        ctx.arc(nx, topY, 6, 0, Math.PI * 2);
        ctx.fillStyle = idx === 3 ? "#f43f5e" : "#fb7185";
        ctx.fill();
        ctx.fillStyle = idx === 3 ? "#fda4af" : "rgba(255,255,255,0.75)";
        ctx.font = idx === 3 ? "bold 11px Consolas, monospace" : "10.5px Calibri, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(n.lbl, nx, topY - 14);
      });

      fpoNodes.forEach((n, idx) => {
        const nx = startX + n.p * span;
        ctx.beginPath();
        ctx.arc(nx, botY, 7, 0, Math.PI * 2);
        ctx.fillStyle = idx === 3 ? "#10b981" : "#34d399";
        ctx.fill();
        ctx.fillStyle = idx === 3 ? "#6ee7b7" : "rgba(255,255,255,0.85)";
        ctx.font = idx === 3 ? "bold 11px Consolas, monospace" : "10.5px Calibri, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(n.lbl, nx, botY - 14);
      });

      // Track Titles
      ctx.textAlign = "left";
      ctx.font = "bold 11px Calibri, sans-serif";
      ctx.fillStyle = "#fda4af";
      ctx.fillText("TRACK A · RAW UNGRADED SALE (VALUE LEAKAGE)", startX, topY - 34);
      ctx.fillStyle = "#6ee7b7";
      ctx.fillText("TRACK B · FPO COLD-CHAIN + WOMEN SHG VALUE-ADD", startX, botY - 34);

      // Animated Moving Produce Crates
      for (const c of crates) {
        if (!prefersReduced) {
          c.t = (c.t + 0.0025) % 1;
        }
        const cx = startX + c.t * span;
        const isFpo = c.track === "fpo";
        const cy = isFpo ? botY : topY;
        const sizeScale = isFpo ? 1 + c.t * 0.45 : Math.max(0.65, 1 - c.t * 0.35);

        ctx.fillStyle = isFpo ? "#fbbf24" : "#94a3b8";
        const boxW = 12 * sizeScale;
        const boxH = 9 * sizeScale;
        ctx.fillRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH);
        ctx.strokeStyle = isFpo ? "#ffffff" : "#475569";
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH);
      }

      // Bottom Net Multiplier Banner inside Canvas
      ctx.fillStyle = "#fde68a";
      ctx.font = "bold 11.5px Consolas, monospace";
      ctx.fillText(
        `VALUE MULTIPLIER FOR ${com.label.toUpperCase()}: +${Math.round(((fpoFinal - rawFinal) / rawFinal) * 100)}% MORE INCOME RETAINED IN VILLAGE (₹${rawFinal} -> ₹${fpoFinal})`,
        startX,
        h - 14
      );

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
      className="w-full h-[255px] sm:h-[270px] rounded-lg border border-white/15 bg-[#050914] block"
    />
  );
}

export default function LivelihoodValueChainObservatory({
  village,
}: {
  village: SectorInsightsVillage | null;
}) {
  const [selectedCropId, setSelectedCropId] = useState<string>("chilli");
  const [selectedCareerId, setSelectedCareerId] = useState<string>("drone");
  const [soilTempC, setSoilTempC] = useState<number>(27.4);
  const [usdRate, setUsdRate] = useState<number>(93.5);
  const [loading, setLoading] = useState(false);

  const fetchAgriFx = useCallback(async () => {
    setLoading(true);
    try {
      const lat = village?.lat ?? 17.385;
      const lon = village?.lon ?? 78.4867;
      const [wRes, fxRes] = await Promise.all([
        fetch(`/api/telemetry/weather?lat=${lat}&lon=${lon}`),
        fetch("/api/macro/fx-rates"),
      ]);
      if (wRes.ok) {
        const wJson: any = await wRes.json();
        if (wJson?.agroHydro?.soilTemp6cm) {
          setSoilTempC(Number(wJson.agroHydro.soilTemp6cm));
        }
      }
      if (fxRes.ok) {
        const fxJson: any = await fxRes.json();
        if (fxJson?.inrPerUsd) {
          setUsdRate(Number(fxJson.inrPerUsd));
        }
      }
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  }, [village?.lat, village?.lon]);

  useEffect(() => {
    void fetchAgriFx();
  }, [fetchAgriFx]);

  const activeCommodity = useMemo(
    () => COMMODITIES.find((c) => c.id === selectedCropId) ?? COMMODITIES[0],
    [selectedCropId]
  );

  const activeCareer = useMemo(
    () => CAREER_PATHWAYS.find((c) => c.id === selectedCareerId) ?? CAREER_PATHWAYS[0],
    [selectedCareerId]
  );

  const careerChartData = useMemo(
    () => [
      { stage: "Year 1", monthlyInr: activeCareer.yr1MonthlyInr },
      { stage: "Year 3", monthlyInr: activeCareer.yr3MonthlyInr },
      { stage: "Year 5", monthlyInr: activeCareer.yr5MonthlyInr },
    ],
    [activeCareer]
  );

  return (
    <div className="space-y-6">
      {/* Animated Farm-to-Market Value Ladder Visual */}
      <section className="jd-keep-dark rounded-xl border border-white/15 bg-[#060c18] text-white p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
              <TrendingUp size={14} />
              <span>VILLAGE VALUE-ADD &amp; SUPPLY CHAIN ANIMATOR</span>
            </div>
            <h3 className="mt-1 text-xl font-bold text-white">
              Raw Distress Sale vs. Solar Cold-Chain &amp; FPO Branding
            </h3>
            <p className="mt-0.5 text-xs text-white/65">
              Watch how sorting, cold storage &amp; women SHG packaging multiply every ₹100 harvested in{" "}
              <span className="text-white font-medium">{village?.villageName ?? "your village"}</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {COMMODITIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCropId(c.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap ${
                  selectedCropId === c.id
                    ? "bg-amber-400 text-slate-950 border-amber-300 font-semibold"
                    : "bg-white/[0.04] border-white/15 text-white/80 hover:bg-white/10"
                }`}
              >
                {c.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => void fetchAgriFx()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/15 bg-white/5 hover:bg-white/10 text-xs text-white whitespace-nowrap"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              Sync Export FX
            </button>
          </div>
        </div>

        <ValueChainPipelineCanvas commodity={activeCommodity} />

        <div className="grid sm:grid-cols-3 gap-3 font-mono tabular-nums text-xs">
          <div className="rounded-lg border border-white/10 bg-black/40 p-3">
            <div className="text-[10px] text-white/55 font-sans">Live Soil Temp (6 cm Depth)</div>
            <div className="mt-1 text-lg font-bold text-emerald-300">{soilTempC}°C</div>
            <div className="text-[10px] text-white/60 font-sans">Optimal Kharif/Yasangi germination band</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/40 p-3">
            <div className="text-[10px] text-white/55 font-sans">Spice / Millet Export FX</div>
            <div className="mt-1 text-lg font-bold text-amber-300">₹{usdRate.toFixed(2)} / USD</div>
            <div className="text-[10px] text-white/60 font-sans">Higher export realization for graded FPO lots</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/40 p-3">
            <div className="text-[10px] text-white/55 font-sans">Processing Strategy</div>
            <div className="mt-1 text-xs font-sans text-white/90 leading-relaxed">
              {activeCommodity.valueStepNote}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Modern Rural Career & Income Multiplier + Threats */}
      <section className="border border-slate-200 dark:border-white/12 bg-white dark:bg-[#070b12] p-6 space-y-5">
        <div className="grid lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6 space-y-3">
            <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <BriefcaseBusiness size={15} />
              <span>LOCAL NON-MIGRATION CAREER &amp; INCOME SIMULATOR</span>
            </div>
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
              Compare 5-Year Monthly Income Across Modern Rural Enterprises
            </h4>

            <div className="grid sm:grid-cols-2 gap-2">
              {CAREER_PATHWAYS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedCareerId(p.id)}
                  className={`text-left border p-2.5 transition-colors ${
                    selectedCareerId === p.id
                      ? "border-slate-900 dark:border-white bg-slate-100 dark:bg-white/10"
                      : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#050911] hover:border-slate-400"
                  }`}
                >
                  <div className="text-[10px] font-mono text-amber-600 dark:text-amber-300">
                    {p.category}
                  </div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {p.title}
                  </div>
                </button>
              ))}
            </div>

            <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#050911] p-3 text-xs space-y-1">
              <div className="font-semibold text-slate-900 dark:text-white">
                Capital Support: <span className="text-emerald-600 dark:text-emerald-300">{activeCareer.startupInr}</span>
              </div>
              <div className="text-slate-600 dark:text-white/70">{activeCareer.note}</div>
            </div>
          </div>

          <div className="lg:col-span-6 h-[245px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={careerChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                <XAxis dataKey="stage" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                  formatter={(v) => [
                    `₹${Number(Array.isArray(v) ? v[0] : (v ?? 0)).toLocaleString("en-IN")}/month`,
                    "Projected Income",
                  ]}
                  contentStyle={{
                    backgroundColor: "#09111f",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="monthlyInr" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={46} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Livelihood Threats */}
        <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <ShieldAlert size={15} className="text-amber-500" />
            <span>Economic &amp; Climate Threats to Village Livelihoods</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {LIVELIHOOD_THREATS.map((lt) => (
              <div
                key={lt.name}
                className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#050911] p-4 space-y-1.5"
              >
                <div className="text-sm font-semibold text-amber-600 dark:text-amber-300">
                  {lt.name}
                </div>
                <div className="text-xs text-slate-700 dark:text-white/80">
                  <span className="font-semibold text-slate-900 dark:text-white">Pattern: </span>
                  {lt.process}
                </div>
                <div className="text-xs text-slate-700 dark:text-white/75">
                  <span className="font-semibold text-slate-900 dark:text-white">Impact: </span>
                  {lt.threat}
                </div>
                <div className="pt-1.5 border-t border-slate-200 dark:border-white/10 text-xs text-emerald-700 dark:text-emerald-300">
                  <span className="font-semibold">Resilience Strategy: </span>
                  {lt.fix}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
