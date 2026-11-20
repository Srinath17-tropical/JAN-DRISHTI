import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const INDIA_VS_TELANGANA_BCM = {
  india: {
    title: "India National Water Endowment (in BCM / Year)",
    subtitle:
      "Although India receives ~4,000 BCM in rain & snowfall annually, uneven monsoon distribution limits utilizable water to 1,123 BCM.",
    metrics: [
      { label: "Annual Precipitation", value: "4,000 BCM", note: "Rain & Himalayan snowmelt", color: "bg-sky-600" },
      { label: "Total Natural Runoff", value: "1,869 BCM", note: "River basins potential", color: "bg-cyan-600" },
      { label: "Utilizable Potential", value: "1,123 BCM", note: "690 Surface + 433 Groundwater", color: "bg-emerald-600" },
      { label: "Major Reservoir Storage", value: "257.8 BCM", note: "CWC 150+ monitored live dams", color: "bg-indigo-600" },
    ],
    chart: [
      { stage: "Precipitation", bcm: 4000, fill: "#38bdf8" },
      { stage: "Natural Runoff", bcm: 1869, fill: "#06b6d4" },
      { stage: "Utilizable Total", bcm: 1123, fill: "#10b981" },
      { stage: "Surface Utilizable", bcm: 690, fill: "#3b82f6" },
      { stage: "GW Recharge", bcm: 433, fill: "#14b8a6" },
      { stage: "Live Dam Storage", bcm: 258, fill: "#8b5cf6" },
    ],
  },
  telangana: {
    title: "Telangana State Water Budget & Basin Capacity (in BCM & TMC)",
    subtitle:
      "Anchored by the Godavari & Krishna basins plus 46,531 Mission Kakatiya minor-irrigation tanks & lakes.",
    metrics: [
      { label: "Godavari Basin Share", value: "27.4 BCM", note: "~968 TMC assured yield", color: "bg-emerald-600" },
      { label: "Krishna Basin Share", value: "8.47 BCM", note: "~299 TMC assured (KWDT)", color: "bg-cyan-600" },
      { label: "Extractable Groundwater", value: "20.35 BCM", note: "Annual replenishable recharge", color: "bg-amber-600" },
      { label: "Minor Tanks (Kakatiya)", value: "7.50 BCM", note: "~265 TMC across 46,531 tanks", color: "bg-teal-600" },
    ],
    chart: [
      { stage: "Total Utilizable", bcm: 56.2, fill: "#10b981" },
      { stage: "Godavari Basin", bcm: 27.4, fill: "#06b6d4" },
      { stage: "GW Replenishable", bcm: 20.4, fill: "#f59e0b" },
      { stage: "Major Dams FRL", bcm: 19.6, fill: "#6366f1" },
      { stage: "Krishna Share", bcm: 8.5, fill: "#3b82f6" },
      { stage: "46.5k Tanks", bcm: 7.5, fill: "#14b8a6" },
    ],
  },
};

type ReservoirItem = {
  name: string;
  basin: "Godavari" | "Krishna" | "Manjeera / Musi" | "Heritage Tanks";
  capacityTmc: number;
  capacityBcm: number;
  liveStoragePct: number;
  district: string;
  role: string;
};

const TELANGANA_DAMS_TANKS: ReservoirItem[] = [
  {
    name: "Nagarjuna Sagar Reservoir",
    basin: "Krishna",
    capacityTmc: 312.05,
    capacityBcm: 8.84,
    liveStoragePct: 74,
    district: "Nalgonda (Border)",
    role: "Major irrigation, hydel power & Hyderabad drinking lifeline",
  },
  {
    name: "Srisailam Reservoir",
    basin: "Krishna",
    capacityTmc: 215.81,
    capacityBcm: 6.11,
    liveStoragePct: 78,
    district: "Nagarkurnool / Kurnool",
    role: "Primary Krishna cascade storage & Palamuru lift feeder",
  },
  {
    name: "Sriram Sagar (SRSP · Pochampad)",
    basin: "Godavari",
    capacityTmc: 90.31,
    capacityBcm: 2.56,
    liveStoragePct: 68,
    district: "Nizamabad",
    role: "Northern Telangana Kakatiya Canal irrigation backbone",
  },
  {
    name: "Singur Reservoir",
    basin: "Manjeera / Musi",
    capacityTmc: 29.91,
    capacityBcm: 0.85,
    liveStoragePct: 62,
    district: "Sangareddy",
    role: "Municipal drinking water reservoir for Greater Hyderabad & Medak",
  },
  {
    name: "Lower Manair Dam (LMD)",
    basin: "Godavari",
    capacityTmc: 24.07,
    capacityBcm: 0.68,
    liveStoragePct: 71,
    district: "Karimnagar",
    role: "Mid-Godavari irrigation & Karimnagar municipal water supply",
  },
  {
    name: "Sripada Yellampally + Kaleshwaram",
    basin: "Godavari",
    capacityTmc: 20.18,
    capacityBcm: 0.57,
    liveStoragePct: 81,
    district: "Peddapalli / Mancherial",
    role: "Pump-lift balancing hub feeding Mid-Manair & Mallanna Sagar (50 TMC)",
  },
  {
    name: "Nizam Sagar & Jurala Dams",
    basin: "Godavari",
    capacityTmc: 27.46,
    capacityBcm: 0.78,
    liveStoragePct: 58,
    district: "Kamareddy & Gadwal",
    role: "Historic Manjeera & upper Krishna border ayacut",
  },
  {
    name: "Osmansagar & Himayatsagar + 46,531 Cheruvus",
    basin: "Heritage Tanks",
    capacityTmc: 271.87,
    capacityBcm: 7.7,
    liveStoragePct: 66,
    district: "Statewide (Hyderabad, Warangal, Mulugu)",
    role: "Includes Laknavaram, Ramappa, Pakhal, Gandipet & restored village tanks",
  },
];

const USAGE_COMPARISON = [
  {
    group: "Rural Essential (JJM Norm)",
    litersPerPerson: 55,
    fill: "#10b981",
    note: "Minimum potable drinking, cooking & basic hygiene",
  },
  {
    group: "Smart Recycled Urban Norm",
    litersPerPerson: 85,
    fill: "#06b6d4",
    note: "Net freshwater needed when toilets & gardens use greywater",
  },
  {
    group: "Standard CPHEEO Urban Norm",
    litersPerPerson: 135,
    fill: "#3b82f6",
    note: "55L bath + 40L flush + 25L laundry + 15L kitchen",
  },
  {
    group: "Actual Unregulated City Use",
    litersPerPerson: 245,
    fill: "#f97316",
    note: "Excess shower flow, hose-washing cars, dripping cisterns",
  },
  {
    group: "Municipal Network + Leakage",
    litersPerPerson: 310,
    fill: "#ef4444",
    note: "Includes 25–35% Non-Revenue Water underground pipe losses",
  },
];

const SCARCITY_CAUSES = [
  {
    title: "25–38% Underground Pipe & Distribution Leakages",
    detail:
      "Aging municipal mains, cracked agricultural supply risers, and unmetered junctions bleed treated reservoir water before it reaches taps.",
  },
  {
    title: "Excess Freshwater Waste on Non-Potable Uses",
    detail:
      "High-rise toilets (40 LPCD), driveways, gardens, and car washing consume drinking-grade water instead of treated greywater.",
  },
  {
    title: "Over-Extraction of Deep Groundwater Aquifers",
    detail:
      "Borewells pump past 200m into hard Deccan granite faster than monsoon rain can percolate through concrete-paved urban surfaces.",
  },
  {
    title: "Siltation & Sewage Pollution in Local Waterbodies",
    detail:
      "Encroached cheruvus, silted village tanks, and untreated sewage inflow shrink natural sponge capacity and poison surface lakes.",
  },
];

const PROVEN_SOLUTIONS = [
  {
    title: "Zero Pipe Leakage Acoustic Telemetry",
    impact: "Recovers 28–35% lost municipal & apartment riser flow",
    action: "Smart bulk pressure sensors + automated valve shutoff & rapid gasket maintenance.",
  },
  {
    title: "Strict Volumetric Limits & Aerator Fixtures",
    impact: "Cuts daily household draw from 245 L down to ≤135 L/person",
    action: "Dual-flush 3L/6L cisterns, 6 LPM tap aerators, smart meters & excess-slab tariffs.",
  },
  {
    title: "Mandatory Dual Plumbing + Greywater + RWH",
    impact: "Cuts fresh municipal/borewell dependency by ~47% per apartment",
    action: "Separate purple flush lines + basement GWTP + deep granite recharge borewells.",
  },
  {
    title: "Revive Lakes, Tanks, Ponds & Stepwells",
    impact: "Unlocks 265+ TMC decentralized drought-buffer storage statewide",
    action: "Decentralized reed-bed wetlands, silt traps & zero raw sewage discharge.",
  },
];

export default function WaterNationalTelanganaCapacity() {
  const [regionTab, setRegionTab] = useState<"telangana" | "india">("telangana");
  const [basinFilter, setBasinFilter] = useState<string>("All");

  const activeRegion = INDIA_VS_TELANGANA_BCM[regionTab];
  const filteredDams =
    basinFilter === "All"
      ? TELANGANA_DAMS_TANKS
      : TELANGANA_DAMS_TANKS.filter((d) => d.basin === basinFilter);

  return (
    <section className="space-y-6">
      {/* BLOCK 1: INDIA & TELANGANA WATER POTENTIAL (BCM) */}
      <div className="border border-cyan-500/25 bg-white dark:bg-[#070e18] p-5 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-cyan-700 dark:text-cyan-300">
              National &amp; State Hydrological Accounting · Billion Cubic Meters (BCM)
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              Water Potential &amp; Reservoir Capacity: Telangana &amp; India
            </h3>
            <p className="text-xs text-slate-600 dark:text-white/70 mt-1 max-w-3xl">
              {activeRegion.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-1.5 border border-slate-200 dark:border-white/15 bg-slate-100 dark:bg-[#050911] p-1 self-start shrink-0">
            <button
              type="button"
              onClick={() => setRegionTab("telangana")}
              className={`px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
                regionTab === "telangana"
                  ? "bg-cyan-600 text-white"
                  : "text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Telangana (56.2 BCM)
            </button>
            <button
              type="button"
              onClick={() => setRegionTab("india")}
              className={`px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
                regionTab === "india"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              India Total (1,123 BCM)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {activeRegion.metrics.map((m) => (
            <div key={m.label} className={`${m.color} p-4 text-white`}>
              <div className="text-[11px] text-white/85 font-medium">{m.label}</div>
              <div className="text-2xl font-extrabold font-mono tabular-nums mt-1">
                {m.value}
              </div>
              <div className="text-[11px] text-white/85 mt-1">{m.note}</div>
            </div>
          ))}
        </div>

        {/* BCM Visual Breakdown Chart + Usage Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-6 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#050911] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {activeRegion.title}
              </span>
              <span className="font-mono text-xs text-cyan-600 dark:text-cyan-300 font-semibold">
                1 BCM = 35.31 TMC = 1 Trillion Litres
              </span>
            </div>
            <div className="h-[225px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeRegion.chart} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                  <XAxis dataKey="stage" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} unit=" BCM" />
                  <Tooltip
                    formatter={(v) => [`${Number(Array.isArray(v) ? v[0] : (v ?? 0))} BCM`, "Volume"]}
                    contentStyle={{
                      backgroundColor: "#09111f",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="bcm" radius={[4, 4, 0, 0]} barSize={36}>
                    {activeRegion.chart.map((item) => (
                      <Cell key={item.stage} fill={item.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-6 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#050911] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Gauge size={16} className="text-amber-500" />
                Litres Required vs What People Actually Use (LPCD)
              </span>
              <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                Up to 2.3× Overshoot
              </span>
            </div>
            <div className="space-y-2.5 pt-1">
              {USAGE_COMPARISON.map((row) => {
                const widthPct = Math.round((row.litersPerPerson / 320) * 100);
                return (
                  <div key={row.group} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-white">
                        {row.group}
                      </span>
                      <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                        {row.litersPerPerson} L/person/day
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{ width: `${widthPct}%`, backgroundColor: row.fill }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-white/60">
                      {row.note}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* BLOCK 2: TELANGANA DAMS, RESERVOIRS & BIG TANKS REGISTRY */}
      <div className="border border-slate-200 dark:border-white/12 bg-white dark:bg-[#070d16] p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Landmark size={18} className="text-cyan-500" />
              <span>Telangana Major Dams, Reservoirs &amp; Heritage Irrigation Tanks</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-white/70 mt-0.5">
              Gross storage across Godavari, Krishna, Manjeera reservoirs &amp; 46,531 restored lakes/cheruvus (Laknavaram, Ramappa, Pakhal, Gandipet).
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["All", "Godavari", "Krishna", "Manjeera / Musi", "Heritage Tanks"].map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBasinFilter(b)}
                className={`px-2.5 py-1.5 text-xs font-semibold border transition whitespace-nowrap ${
                  basinFilter === b
                    ? "border-cyan-500 bg-cyan-600 text-white"
                    : "border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#050911] text-slate-700 dark:text-white/80"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {filteredDams.map((dam) => (
            <div
              key={dam.name}
              className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#050911] p-3.5 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="font-semibold text-cyan-700 dark:text-cyan-300">
                  {dam.basin} Basin
                </span>
                <span className="font-mono font-bold tabular-nums text-slate-700 dark:text-white/80">
                  {dam.capacityBcm} BCM ({dam.capacityTmc} TMC)
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                {dam.name}
              </div>
              <div className="space-y-1">
                <div className="h-2 w-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                    style={{ width: `${dam.liveStoragePct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-600 dark:text-white/65">
                  <span>Observed Fill: {dam.liveStoragePct}%</span>
                  <span>{dam.district}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-white/70 leading-relaxed">
                {dam.role}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* BLOCK 3: SCARCITY CAUSES VS ZERO-LEAK & STRICT-LIMIT SOLUTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-rose-500/25 bg-rose-50/55 dark:bg-[#150a0d] p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-rose-800 dark:text-rose-300">
            <AlertTriangle size={17} />
            <span>Why Water Scarcity Happens (Core Structural Causes)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SCARCITY_CAUSES.map((c) => (
              <div
                key={c.title}
                className="border border-rose-500/20 bg-white dark:bg-black/30 p-3 space-y-1"
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {c.title}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-white/75 leading-relaxed">
                  {c.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-emerald-500/25 bg-emerald-50/55 dark:bg-[#071510] p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-300">
            <ShieldCheck size={17} />
            <span>Zero-Leakage &amp; Strict-Limit Action Blueprint</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PROVEN_SOLUTIONS.map((s) => (
              <div
                key={s.title}
                className="border border-emerald-500/20 bg-white dark:bg-black/30 p-3 space-y-1"
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>{s.title}</span>
                </div>
                <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  {s.impact}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-white/75 leading-relaxed">
                  {s.action}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
