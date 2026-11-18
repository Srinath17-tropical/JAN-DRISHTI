import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, IndianRupee, Scale, TrendingUp } from "lucide-react";
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

export default function MacroInflationRupeePanel({
  lang,
  macroData,
}: {
  lang: LanguageCode;
  macroData?: MacroInflationData | null;
}) {
  const [stabilizeActive, setStabilizeActive] = useState<boolean>(true);
  const t = UI_TRANSLATIONS[lang];
  const data = macroData ?? DEFAULT_MACRO;

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

  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 py-12">
      <div className="border border-slate-200 dark:border-white/12 bg-white dark:bg-[#070b12] p-6 md:p-8 space-y-6">
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
            <div className="text-[11px] text-slate-500 dark:text-white/50">Food & Beverages Inflation</div>
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
            <div className="text-[11px] text-slate-500 dark:text-white/50">Remaining / Core & Fuel CPI</div>
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

        {/* Chart + How to Balance Inflation + Rupee Value Appreciation */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Left: Food vs Core Inflation Chart & Rural Balance Fixes */}
          <div className="lg:col-span-6 space-y-4">
            <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#04080e] p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Scale size={14} className="text-orange-500" />
                  <span>Food & Freight CPI: Baseline vs. Rural-Stabilized (%)</span>
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
