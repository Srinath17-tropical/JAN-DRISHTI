import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Gauge,
  Globe,
  IndianRupee,
  RefreshCw,
  Scale,
  TrendingUp,
} from "lucide-react";
import type { LanguageCode } from "../lib/i18n";
import { UI_TRANSLATIONS } from "../lib/i18n";

export type MacroInflationData = {
  headline_cpi_pct: number;
  food_inflation_pct: number;
  core_remaining_pct: number;
  fuel_light_pct: number;
  food_drivers: {
    item: string;
    share_pct: number;
    current_yoy_pct: number;
    rural_fix: string;
  }[];
  rupee_appreciation_drivers: {
    lever: string;
    mechanism: string;
    target_2047: string;
  }[];
};

type FxCurrencyItem = {
  code: string;
  rawCode: string;
  name: string;
  region: string;
  symbol: string;
  unitMultiplier: number;
  inrPerUnit: number;
  unitsPer1000Inr: number;
  pppAdjustedInr: number;
  target2047Inr: number;
};

type FxFeedPayload = {
  baseCurrency: string;
  inrPerUsd: number;
  updatedUtc: string;
  source: string;
  currencies: FxCurrencyItem[];
};

const FALLBACK_FX: FxFeedPayload = {
  baseCurrency: "INR",
  inrPerUsd: 93.51,
  updatedUtc: "Reference Baseline",
  source: "Global FX Reference Baseline",
  currencies: [
    { code: "KWD", rawCode: "KWD", name: "Kuwaiti Dinar", region: "Kuwait", symbol: "KD", unitMultiplier: 1, inrPerUnit: 300.84, unitsPer1000Inr: 3.32, pppAdjustedInr: 102.29, target2047Inr: 216.6 },
    { code: "BHD", rawCode: "BHD", name: "Bahraini Dinar", region: "Bahrain", symbol: "BD", unitMultiplier: 1, inrPerUnit: 248.7, unitsPer1000Inr: 4.02, pppAdjustedInr: 89.53, target2047Inr: 179.06 },
    { code: "OMR", rawCode: "OMR", name: "Omani Rial", region: "Oman", symbol: "RO", unitMultiplier: 1, inrPerUnit: 243.2, unitsPer1000Inr: 4.11, pppAdjustedInr: 89.98, target2047Inr: 175.1 },
    { code: "GBP", rawCode: "GBP", name: "British Pound", region: "United Kingdom", symbol: "£", unitMultiplier: 1, inrPerUnit: 123.04, unitsPer1000Inr: 8.13, pppAdjustedInr: 38.14, target2047Inr: 88.59 },
    { code: "CHF", rawCode: "CHF", name: "Swiss Franc", region: "Switzerland", symbol: "CHF", unitMultiplier: 1, inrPerUnit: 110.92, unitsPer1000Inr: 9.02, pppAdjustedInr: 29.95, target2047Inr: 79.86 },
    { code: "EUR", rawCode: "EUR", name: "Euro", region: "Eurozone", symbol: "€", unitMultiplier: 1, inrPerUnit: 102.62, unitsPer1000Inr: 9.74, pppAdjustedInr: 33.86, target2047Inr: 73.89 },
    { code: "USD", rawCode: "USD", name: "US Dollar", region: "United States", symbol: "$", unitMultiplier: 1, inrPerUnit: 93.51, unitsPer1000Inr: 10.69, pppAdjustedInr: 24.31, target2047Inr: 67.33 },
    { code: "SGD", rawCode: "SGD", name: "Singapore Dollar", region: "Singapore", symbol: "S$", unitMultiplier: 1, inrPerUnit: 72.53, unitsPer1000Inr: 13.79, pppAdjustedInr: 25.39, target2047Inr: 52.22 },
    { code: "AED", rawCode: "AED", name: "UAE Dirham", region: "UAE", symbol: "AED", unitMultiplier: 1, inrPerUnit: 25.46, unitsPer1000Inr: 39.28, pppAdjustedInr: 9.93, target2047Inr: 18.33 },
    { code: "100 JPY", rawCode: "JPY", name: "100 Japanese Yen", region: "Japan", symbol: "¥", unitMultiplier: 100, inrPerUnit: 58.68, unitsPer1000Inr: 1704.16, pppAdjustedInr: 22.3, target2047Inr: 42.25 },
  ],
};

const DEFAULT_MACRO: MacroInflationData = {
  headline_cpi_pct: 4.85,
  food_inflation_pct: 6.42,
  core_remaining_pct: 3.68,
  fuel_light_pct: 2.15,
  food_drivers: [
    { item: "Vegetables & Perishables", share_pct: 6.0, current_yoy_pct: 11.4, rural_fix: "Village-cluster solar cold storage + FPO direct e-NAM mandis" },
    { item: "Pulses & Protein", share_pct: 2.4, current_yoy_pct: 8.6, rural_fix: "Mandal dal-mill processing & protective irrigation from Kakatiya tanks" },
    { item: "Cereals & Staples", share_pct: 9.7, current_yoy_pct: 5.1, rural_fix: "Tank-fed double cropping & PDS buffer-stock smoothing" },
    { item: "Fuel, Freight & Power", share_pct: 6.8, current_yoy_pct: 2.2, rural_fix: "PM-KUSUM solar pumps cutting diesel irrigation & transport costs" },
  ],
  rupee_appreciation_drivers: [
    {
      lever: "Clean-Energy Import Substitution",
      mechanism: "Solar feeders, EV rural mobility & bio-CNG reduce crude/diesel import outflow, narrowing the Current Account Deficit (CAD).",
      target_2047: "Lower energy import bill strengthens INR structural fundamentals",
    },
    {
      lever: "Agro-Processing & High-Value Exports",
      mechanism: "Moving villages from raw crop distress-selling to FPO grading, millet processing & GI exports raises FX inflows.",
      target_2047: "Boosts rural per-capita income toward Vision 2047 USD 18,000 benchmark",
    },
    {
      lever: "Digital Public Infrastructure (UPI) & Services Surplus",
      mechanism: "Cross-border UPI rails, skilled rural-youth GCC/tech talent & formal banking inclusion deepen domestic capital.",
      target_2047: "Supports stable USD/INR trajectory alongside USD 30T economy scale",
    },
  ],
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 180) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 0 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

/* =========================================================
   GRAPHICAL CURRENCY STRENGTH & INR COMPARISON METER SVG
========================================================= */

function RupeeCurrencyComparisonMeter({
  selected,
  stabilizeActive,
  maxScaleInr,
}: {
  selected: FxCurrencyItem;
  stabilizeActive: boolean;
  maxScaleInr: number;
}) {
  const cx = 190;
  const cy = 175;
  const maxRef = Math.max(320, maxScaleInr * 1.05);

  const spotFrac = Math.min(1, selected.inrPerUnit / maxRef);
  const targetFrac = Math.min(1, selected.target2047Inr / maxRef);
  const pppFrac = Math.min(1, selected.pppAdjustedInr / maxRef);

  const activeInr = stabilizeActive ? selected.target2047Inr : selected.inrPerUnit;
  const activeFrac = stabilizeActive ? targetFrac : spotFrac;
  const needleAngle = activeFrac * 180;
  const needleTip = polarToCartesian(cx, cy, 114, needleAngle);

  const spotAngle = spotFrac * 180;
  const targetAngle = targetFrac * 180;
  const pppAngle = pppFrac * 180;

  // Parity Strength Score: Higher when 1 foreign unit costs fewer INR or PPP boosts domestic value
  const realPowerScore = Math.round(Math.max(12, Math.min(96, 100 - (activeInr / maxRef) * 78)));

  return (
    <svg viewBox="0 0 380 232" className="w-full h-auto select-none">
      <defs>
        <linearGradient id="fxSpotGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
        <linearGradient id="fxTargetGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>

      <rect width="380" height="232" rx="6" fill="#040812" />

      {/* Outer Track: Live Spot Exchange Burden (₹ per 1 Foreign Unit) */}
      <path
        d={describeArc(cx, cy, 134, 0, 180)}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <path
        d={describeArc(cx, cy, 134, 0, Math.max(4, spotAngle))}
        fill="none"
        stroke="url(#fxSpotGrad)"
        strokeWidth="16"
        strokeLinecap="round"
        style={{ transition: "all 600ms cubic-bezier(0.16, 1, 0.3, 1)" }}
      />

      {/* Middle Track: 2047 Export & Solar Convergence Target */}
      <path
        d={describeArc(cx, cy, 108, 0, 180)}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d={describeArc(cx, cy, 108, 0, Math.max(4, targetAngle))}
        fill="none"
        stroke="url(#fxTargetGrad)"
        strokeWidth="10"
        strokeLinecap="round"
        style={{ transition: "all 600ms cubic-bezier(0.16, 1, 0.3, 1)" }}
      />

      {/* Inner Track: Real Purchasing Power Parity (PPP) Basket Cost */}
      <path
        d={describeArc(cx, cy, 86, 0, 180)}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d={describeArc(cx, cy, 86, 0, Math.max(4, pppAngle))}
        fill="none"
        stroke="#38bdf8"
        strokeWidth="6"
        strokeLinecap="round"
        style={{ transition: "all 600ms cubic-bezier(0.16, 1, 0.3, 1)" }}
      />

      {/* Precision Tick Marks */}
      {[0, 45, 90, 135, 180].map((deg, idx) => {
        const pOut = polarToCartesian(cx, cy, 148, deg);
        const pIn = polarToCartesian(cx, cy, 141, deg);
        const val = Math.round((deg / 180) * maxRef);
        const lbl = polarToCartesian(cx, cy, 160, deg);
        return (
          <g key={idx}>
            <line
              x1={pIn.x}
              y1={pIn.y}
              x2={pOut.x}
              y2={pOut.y}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1.2"
            />
            <text
              x={lbl.x}
              y={lbl.y + 3}
              textAnchor="middle"
              fill="rgba(255,255,255,0.45)"
              fontSize="8.5"
              fontFamily="monospace"
            >
              ₹{val}
            </text>
          </g>
        );
      })}

      {/* Animated Instrument Needle */}
      <line
        x1={cx}
        y1={cy}
        x2={needleTip.x}
        y2={needleTip.y}
        stroke="#ffffff"
        strokeWidth="2.4"
        strokeLinecap="round"
        style={{ transition: "all 600ms cubic-bezier(0.16, 1, 0.3, 1)" }}
      />
      <circle cx={cx} cy={cy} r="7" fill="#0ea5e9" stroke="#ffffff" strokeWidth="2" />

      {/* Center Digital Instrument Readout */}
      <text
        x={cx}
        y={cy - 28}
        textAnchor="middle"
        fill="#38bdf8"
        fontSize="10"
        fontWeight="700"
        fontFamily="monospace"
      >
        1 {selected.code} VS INR ({stabilizeActive ? "2047 CONVERGED" : "LIVE SPOT"})
      </text>
      <text
        x={cx}
        y={cy + 30}
        textAnchor="middle"
        fill="#ffffff"
        fontSize="24"
        fontWeight="800"
        fontFamily="monospace"
      >
        ₹{activeInr.toFixed(2)}
      </text>

      {/* Bottom Meter Legend Strip */}
      <g transform="translate(22, 214)">
        <circle cx="4" cy="-3" r="3" fill="#f59e0b" />
        <text x="11" y="0" fill="#cbd5e1" fontSize="8.8" fontFamily="monospace">
          Spot: ₹{selected.inrPerUnit.toFixed(1)}
        </text>
        <circle cx="116" cy="-3" r="3" fill="#10b981" />
        <text x="123" y="0" fill="#6ee7b7" fontSize="8.8" fontFamily="monospace">
          2047: ₹{selected.target2047Inr.toFixed(1)}
        </text>
        <circle cx="228" cy="-3" r="3" fill="#38bdf8" />
        <text x="235" y="0" fill="#7dd3fc" fontSize="8.8" fontFamily="monospace">
          PPP: ₹{selected.pppAdjustedInr.toFixed(1)} (Idx {realPowerScore})
        </text>
      </g>
    </svg>
  );
}

export default function MacroInflationRupeePanel({
  lang,
  macroData,
}: {
  lang: LanguageCode;
  macroData?: MacroInflationData | null;
}) {
  const [stabilizeActive, setStabilizeActive] = useState<boolean>(true);
  const [fxFeed, setFxFeed] = useState<FxFeedPayload>(FALLBACK_FX);
  const [fxLoading, setFxLoading] = useState<boolean>(false);
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>("KWD");
  const [inrAmount, setInrAmount] = useState<number>(10000);

  const t = UI_TRANSLATIONS[lang];
  const data = macroData ?? DEFAULT_MACRO;

  const loadFxRates = useCallback(async () => {
    setFxLoading(true);
    try {
      const res = await fetch("/api/macro/fx-rates", { cache: "no-store" });
      if (res.ok) {
        const d = (await res.json()) as FxFeedPayload;
        if (d && Array.isArray(d.currencies) && d.currencies.length > 0) {
          setFxFeed(d);
        }
      }
    } catch {
      // Keep fallback reference gracefully
    } finally {
      setFxLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFxRates();
  }, [loadFxRates]);

  const selectedCurrency = useMemo(
    () =>
      fxFeed.currencies.find((c) => c.code === selectedCurrencyCode) ??
      fxFeed.currencies[0] ??
      FALLBACK_FX.currencies[0],
    [fxFeed.currencies, selectedCurrencyCode]
  );

  const maxScaleInr = useMemo(
    () => Math.max(...fxFeed.currencies.map((c) => c.inrPerUnit), 300),
    [fxFeed.currencies]
  );

  const chartData = data.food_drivers.map((d) => ({
    name: d.item.split(" ")[0],
    fullItem: d.item,
    Current: d.current_yoy_pct,
    Stabilized: Number((d.current_yoy_pct * (d.item.includes("Vegetables") ? 0.56 : 0.68)).toFixed(1)),
  }));

  const effectiveFood = stabilizeActive
    ? Number((data.food_inflation_pct * 0.64).toFixed(2))
    : data.food_inflation_pct;
  const effectiveHeadline = stabilizeActive
    ? Number((data.headline_cpi_pct - (data.food_inflation_pct - effectiveFood) * 0.45).toFixed(2))
    : data.headline_cpi_pct;

  const convertedForeign = Number(
    (
      (Math.max(0, inrAmount) / Math.max(0.01, selectedCurrency.inrPerUnit)) *
      selectedCurrency.unitMultiplier
    ).toFixed(2)
  );

  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 py-12">
      <div className="border border-slate-200 dark:border-white/12 bg-white dark:bg-[#070b12] p-6 md:p-8 space-y-7">
        {/* Top Macro Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-300">
              {t.macroEyebrow}
            </div>
            <h3 className="mt-1.5 text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white text-balance">
              {t.macroTitle}
            </h3>
            <p className="mt-2 text-xs md:text-sm leading-6 text-slate-600 dark:text-white/60">
              {t.macroSub}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setStabilizeActive((prev) => !prev)}
            className={`px-4 py-2.5 text-xs font-medium border transition whitespace-nowrap shrink-0 ${
              stabilizeActive
                ? "border-emerald-500/50 bg-emerald-600 text-white"
                : "border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-white/[0.04] text-slate-800 dark:text-white"
            }`}
          >
            {stabilizeActive
              ? "Rural Supply-Side Stabilization: Active (Target ≤4%)"
              : "Simulate Rural Cold-Chain & Solar Impact"}
          </button>
        </div>

        {/* Live Rupee (INR) Graphical Comparison Meter & High-Value Currency Ladder */}
        <div className="border border-cyan-500/25 bg-slate-50 dark:bg-[#04080e] p-5 md:p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-4">
            <div>
              <div className="text-xs font-semibold text-cyan-600 dark:text-cyan-300 flex items-center gap-2">
                <Gauge size={15} />
                <span>LIVE INDIAN RUPEE (INR) VALUE &amp; HIGH-VALUE CURRENCY PARITY METER</span>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-white/60">
                Real-time FX feed ({fxFeed.source}) · Updated {fxFeed.updatedUtc}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 border border-slate-300 dark:border-white/15 bg-white dark:bg-[#070b12] px-3 py-1.5 text-xs">
                <IndianRupee size={12} className="text-orange-500" />
                <input
                  type="number"
                  min={100}
                  step={500}
                  aria-label="INR amount to convert"
                  value={inrAmount}
                  onChange={(e) => setInrAmount(Math.max(0, Number(e.target.value)))}
                  className="w-24 bg-transparent font-mono tabular-nums text-slate-900 dark:text-white outline-none"
                />
                <span className="font-mono text-emerald-600 dark:text-emerald-300 font-semibold">
                  = {selectedCurrency.symbol} {convertedForeign.toLocaleString("en-IN")}
                </span>
              </div>

              <button
                type="button"
                onClick={() => void loadFxRates()}
                disabled={fxLoading}
                className="inline-flex items-center gap-1.5 border border-slate-300 dark:border-white/15 bg-white dark:bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-white hover:border-cyan-400 disabled:opacity-50"
              >
                <RefreshCw size={12} className={fxLoading ? "animate-spin" : ""} />
                <span>Refresh FX</span>
              </button>
            </div>
          </div>

          {/* Currency Selector Strip */}
          <div className="flex flex-wrap gap-1.5">
            {fxFeed.currencies.map((cur) => {
              const active = cur.code === selectedCurrency.code;
              return (
                <button
                  key={cur.code}
                  type="button"
                  onClick={() => setSelectedCurrencyCode(cur.code)}
                  className={`px-3 py-1.5 text-xs font-mono border transition flex items-center gap-1.5 ${
                    active
                      ? "border-cyan-500 bg-cyan-600 text-white font-semibold"
                      : "border-slate-300 dark:border-white/15 bg-white dark:bg-white/[0.03] text-slate-700 dark:text-white/75 hover:border-cyan-400"
                  }`}
                >
                  <span>{cur.code}</span>
                  <span className={active ? "text-cyan-100" : "text-slate-500 dark:text-white/50"}>
                    ₹{cur.inrPerUnit.toFixed(1)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-12 gap-6 items-center">
            {/* Left: Animated Graphical Semicircular Currency Meter */}
            <div className="lg:col-span-5 space-y-3">
              <div className="border border-slate-200 dark:border-white/12 bg-[#040812] overflow-hidden shadow-lg">
                <RupeeCurrencyComparisonMeter
                  selected={selectedCurrency}
                  stabilizeActive={stabilizeActive}
                  maxScaleInr={maxScaleInr}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono tabular-nums text-xs">
                <div className="border border-slate-200 dark:border-white/10 bg-white dark:bg-[#070b12] p-2.5">
                  <div className="text-[10px] font-sans text-slate-500 dark:text-white/50">Live Spot</div>
                  <div className="mt-0.5 font-bold text-amber-600 dark:text-amber-300">
                    ₹{selectedCurrency.inrPerUnit.toFixed(2)}
                  </div>
                </div>
                <div className="border border-slate-200 dark:border-white/10 bg-white dark:bg-[#070b12] p-2.5">
                  <div className="text-[10px] font-sans text-slate-500 dark:text-white/50">2047 Target</div>
                  <div className="mt-0.5 font-bold text-emerald-600 dark:text-emerald-300">
                    ₹{selectedCurrency.target2047Inr.toFixed(2)}
                  </div>
                </div>
                <div className="border border-slate-200 dark:border-white/10 bg-white dark:bg-[#070b12] p-2.5">
                  <div className="text-[10px] font-sans text-slate-500 dark:text-white/50">PPP Real Basket</div>
                  <div className="mt-0.5 font-bold text-cyan-600 dark:text-cyan-300">
                    ₹{selectedCurrency.pppAdjustedInr.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Proportional High-Valued Currencies Ladder */}
            <div className="lg:col-span-7 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-white/65 pb-1">
                <span className="font-semibold flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <Globe size={13} className="text-cyan-500" />
                  <span>INR vs Top World High-Valued Currencies (Click Row to Inspect Gauge)</span>
                </span>
                <span className="font-mono text-[11px]">USD/INR ₹{fxFeed.inrPerUsd}</span>
              </div>

              {fxFeed.currencies.map((cur) => {
                const isActive = cur.code === selectedCurrency.code;
                const widthPct = Math.max(8, Math.round((cur.inrPerUnit / maxScaleInr) * 100));
                const projectedPct = Math.max(6, Math.round((cur.target2047Inr / maxScaleInr) * 100));
                return (
                  <button
                    key={cur.code}
                    type="button"
                    onClick={() => setSelectedCurrencyCode(cur.code)}
                    className={`w-full text-left border px-3.5 py-2 transition ${
                      isActive
                        ? "border-cyan-500 bg-cyan-500/10"
                        : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#070b12] hover:border-cyan-400/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-bold text-slate-900 dark:text-white w-16 shrink-0">
                          {cur.code}
                        </span>
                        <span className="text-slate-600 dark:text-white/65 truncate">{cur.name}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono tabular-nums shrink-0">
                        <span className="text-slate-900 dark:text-white font-semibold">
                          ₹{cur.inrPerUnit.toFixed(2)}
                        </span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-300 hidden sm:inline">
                          → 2047: ₹{cur.target2047Inr.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full bg-slate-200 dark:bg-white/10 overflow-hidden relative">
                      <div
                        className="h-full bg-amber-500/75"
                        style={{ width: `${widthPct}%` }}
                      />
                      {stabilizeActive && (
                        <div
                          className="h-full bg-emerald-400 absolute top-0 left-0 opacity-85"
                          style={{ width: `${projectedPct}%` }}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top CPI Metric Strip */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-4">
            <div className="text-[11px] text-slate-500 dark:text-white/50">Headline CPI Rate</div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
                {effectiveHeadline}%
              </span>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                RBI Band: 4% ± 2%
              </span>
            </div>
          </div>
          <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-4">
            <div className="text-[11px] text-slate-500 dark:text-white/50">Food &amp; Beverages Inflation</div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-mono text-2xl font-semibold tabular-nums text-orange-600 dark:text-orange-300">
                {effectiveFood}%
              </span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                {stabilizeActive && <ArrowDownRight size={12} />}
                {stabilizeActive ? "Supply Buffered" : "Volatile Perishables"}
              </span>
            </div>
          </div>
          <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-4">
            <div className="text-[11px] text-slate-500 dark:text-white/50">Remaining / Core &amp; Fuel CPI</div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-mono text-2xl font-semibold tabular-nums text-cyan-600 dark:text-cyan-300">
                {data.core_remaining_pct}%
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-white/50">
                Fuel {data.fuel_light_pct}%
              </span>
            </div>
          </div>
          <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-4">
            <div className="text-[11px] text-slate-500 dark:text-white/50">Vision 2047 Macro Target</div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-mono text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-300">
                $30T
              </span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight size={12} /> INR Resilience
              </span>
            </div>
          </div>
        </div>

        {/* Chart + How to Balance Inflation + Rupee (INR) Appreciation */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Left: Food vs Core Inflation Chart & Rural Balance Fixes */}
          <div className="lg:col-span-6 space-y-4">
            <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Scale size={14} className="text-orange-500" />
                  <span>Food &amp; Freight CPI: Baseline vs. Rural-Stabilized (%)</span>
                </span>
              </div>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#080d14",
                        border: "1px solid rgba(255,255,255,0.15)",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="Current" name="Baseline YoY %" fill="#ef4444" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Stabilized" name="With Tank + Cold-Chain %" fill="#10b981" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-2">
              {data.food_drivers.map((row) => (
                <div
                  key={row.item}
                  className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      {row.item} · <span className="font-mono text-orange-600 dark:text-orange-300">{row.current_yoy_pct}% YoY</span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-white/60 mt-0.5">
                      Balance Fix: {row.rural_fix}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Balancing Levers + Rupee (INR) Appreciation Pathways */}
          <div className="lg:col-span-6 space-y-4">
            <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                <IndianRupee size={15} />
                <span>Structural Rupee (INR) Appreciation Drivers toward 2047</span>
              </div>
              <p className="text-xs leading-5 text-slate-600 dark:text-white/60">
                Sustainable Rupee appreciation comes from higher real productivity and lower import deficits—not artificial controls. Village-level JAN—DRISHTI interventions feed macro INR strength through three channels:
              </p>
              <div className="space-y-3 pt-1">
                {data.rupee_appreciation_drivers.map((drv, i) => (
                  <div
                    key={drv.lever}
                    className="border border-slate-200 dark:border-white/10 bg-white dark:bg-[#070b12] p-3.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        0{i + 1}. {drv.lever}
                      </span>
                      <TrendingUp size={13} className="text-emerald-500 shrink-0" />
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-white/65">
                      {drv.mechanism}
                    </p>
                    <div className="mt-1.5 text-[11px] font-medium text-cyan-700 dark:text-cyan-300">
                      Outcome: {drv.target_2047}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-4 text-xs leading-5 text-slate-600 dark:text-white/65">
              <strong className="text-slate-900 dark:text-white">How Monetary &amp; Spatial Policy Balance Together:</strong>{" "}
              RBI liquidity targeting anchors core inflation &amp; currency stability, while state-level geospatial storage, irrigation tank recharge, and FPO logistics directly crush perishable food-price spikes at the source.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
