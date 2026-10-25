import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  Check,
  Copy,
  FileText,
  Landmark,
  Layers,
  MapPin,
  Scale,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

function formatReadable(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map(formatReadable).filter(Boolean).join(", ");
  }
  return JSON.stringify(value);
}

function humanize(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const SECTOR_COLOR_MAP: Record<string, string> = {
  education: "#ef4444",
  health: "#10b981",
  water: "#06b6d4",
  livelihood: "#ec4899",
  environment: "#84cc16",
  overview: "#ff9933",
};

const PALETTE = [
  "#ef4444",
  "#10b981",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f59e0b",
  "#8b5cf6",
  "#38bdf8",
];

function sectorColor(name: string, idx = 0): string {
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(SECTOR_COLOR_MAP)) {
    if (lower.includes(k)) return v;
  }
  return PALETTE[idx % PALETTE.length];
}

/* =========================================================
   BIG MULTI-COLOURED INTERACTIVE COMMAND DASHBOARD
========================================================= */

export function InteractiveDashboard({
  dashboard,
  analysis,
}: {
  dashboard: unknown;
  analysis: unknown;
}) {
  const [activeTab, setActiveTab] = useState<
    "all" | "benchmarks" | "spatial_budget"
  >("all");

  const dashRecord = asRecord(dashboard);
  const analysisRecord = asRecord(analysis);
  const stats = asRecord(analysisRecord.statistics);

  const kpis = asArray(dashRecord.kpis ?? dashRecord.metrics ?? dashRecord.cards);
  const radarData = asArray(dashRecord.radar_comparison).map((r) => asRecord(r));
  const householdBars = asArray(dashRecord.household_indicators).map((r) =>
    asRecord(r)
  );
  const spatialReach = asArray(dashRecord.spatial_reach).map((r) => asRecord(r));
  const workforceMix = asArray(dashRecord.workforce_mix).map((r) => asRecord(r));
  const budgetMix = asArray(dashRecord.budget_priority_mix).map((r, i) => {
    const rec = asRecord(r);
    const secName = String(rec.sector ?? `Sector ${i + 1}`);
    return {
      sector: secName,
      allocation_percent: Number(rec.allocation_percent ?? 20),
      rationale: String(rec.rationale ?? ""),
      color: sectorColor(secName, i),
    };
  });

  const statEntries = Object.entries(stats).filter(
    ([, val]) => val !== null && val !== undefined
  );

  if (kpis.length === 0 && statEntries.length === 0 && radarData.length === 0) {
    return null;
  }

  const villageTitle = String(dashRecord.village_name ?? "Selected Village");
  const locationSub = [dashRecord.mandal_name, dashRecord.district_name]
    .filter(Boolean)
    .join(" Mandal · ");

  return (
    <section className="border border-white/15 bg-[#070b12] p-7 md:p-8 space-y-7">
      {/* Command Header + Interactive View Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-orange-300">
            <BarChart3 size={16} />
            <span>Multi-Sector Interactive Command Dashboard · Telangana</span>
          </div>
          <h3 className="mt-2 text-2xl md:text-3xl font-semibold text-white">
            {villageTitle} — 5-Sector Quantitative Intelligence
          </h3>
          {locationSub && (
            <p className="mt-1 text-xs text-white/50">
              {locationSub} District · Benchmarked against Mandal, District &amp; Telangana State
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1 border border-white/10 bg-[#05080d] p-1">
          {[
            { id: "all", label: "Full Command View" },
            { id: "benchmarks", label: "Benchmarks & Household" },
            { id: "spatial_budget", label: "Spatial Reach & Policy Mix" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`px-3.5 py-1.5 text-xs font-medium transition ${
                activeTab === t.id
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white/85"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Multi-Coloured 6-Sector KPI Cards */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {kpis.map((item, idx) => {
            const record = asRecord(item);
            const label = String(
              record.label ?? record.title ?? `Indicator ${idx + 1}`
            );
            const value = formatReadable(
              record.value ?? record.score ?? record.metric
            );
            const delta = String(record.delta ?? "");
            const color = String(record.color ?? PALETTE[idx % PALETTE.length]);
            return (
              <div
                key={`${label}-${idx}`}
                className="relative overflow-hidden border border-white/10 bg-[#050910] p-4"
              >
                <div
                  className="absolute inset-x-0 top-0 h-[3px]"
                  style={{ backgroundColor: color }}
                />
                <div className="text-[11px] font-medium text-white/50">
                  {label}
                </div>
                <div
                  className="mt-2 font-mono text-xl font-semibold tabular-nums"
                  style={{ color }}
                >
                  {value}
                </div>
                {delta && (
                  <div className="mt-1.5 font-mono text-[10px] tabular-nums text-white/45">
                    {delta}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Row 1: 5-Sector Radar Comparison + Household Outcomes Multi-Colour Bar Chart */}
      {(activeTab === "all" || activeTab === "benchmarks") &&
        (radarData.length > 0 || householdBars.length > 0) && (
          <div className="grid gap-5 xl:grid-cols-2">
            {/* 5-Sector Multi-Tier Radar */}
            {radarData.length > 0 && (
              <div className="border border-white/10 bg-[#050910] p-5">
                <div className="flex items-center gap-2 text-xs font-medium text-cyan-300">
                  <TrendingUp size={14} />
                  <span>5-Sector Multi-Tier Radar (0–100)</span>
                </div>
                <h4 className="mt-1 text-base font-semibold text-white">
                  Village vs Mandal vs District vs Telangana State
                </h4>

                <div className="mt-4 h-[330px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="74%">
                      <PolarGrid stroke="rgba(255,255,255,0.12)" />
                      <PolarAngleAxis
                        dataKey="sector"
                        tick={{ fill: "rgba(255,255,255,0.85)", fontSize: 12 }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                      />
                      <Radar
                        name={villageTitle}
                        dataKey="Village"
                        stroke="#ff9933"
                        strokeWidth={2.2}
                        fill="#ff9933"
                        fillOpacity={0.35}
                      />
                      <Radar
                        name="Mandal"
                        dataKey="Mandal"
                        stroke="#06b6d4"
                        strokeWidth={1.8}
                        fill="#06b6d4"
                        fillOpacity={0.14}
                      />
                      <Radar
                        name="District"
                        dataKey="District"
                        stroke="#10b981"
                        strokeWidth={1.6}
                        fill="#10b981"
                        fillOpacity={0.08}
                      />
                      <Radar
                        name="Telangana"
                        dataKey="Telangana"
                        stroke="#a855f7"
                        strokeWidth={1.5}
                        fill="#a855f7"
                        fillOpacity={0.06}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#070b12",
                          borderColor: "rgba(255,255,255,0.18)",
                          fontSize: 12,
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Household Infrastructure & Outcomes vs Telangana State */}
            {householdBars.length > 0 && (
              <div className="border border-white/10 bg-[#050910] p-5">
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-300">
                  <Layers size={14} />
                  <span>Household &amp; Social Coverage (%)</span>
                </div>
                <h4 className="mt-1 text-base font-semibold text-white">
                  Observed Settlement Coverage vs Telangana Mean
                </h4>

                <div className="mt-4 h-[330px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={householdBars}
                      margin={{ top: 10, right: 14, left: -12, bottom: 26 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.07)"
                      />
                      <XAxis
                        dataKey="name"
                        angle={-22}
                        textAnchor="end"
                        interval={0}
                        tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#070b12",
                          borderColor: "rgba(255,255,255,0.18)",
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                      <Bar
                        dataKey="Village"
                        name={villageTitle}
                        radius={[3, 3, 0, 0]}
                      >
                        {householdBars.map((entry, idx) => (
                          <Cell
                            key={`cell-${idx}`}
                            fill={String(
                              entry.fill ?? PALETTE[idx % PALETTE.length]
                            )}
                          />
                        ))}
                      </Bar>
                      <Bar
                        dataKey="Telangana"
                        name="Telangana Avg"
                        fill="rgba(255,255,255,0.25)"
                        radius={[3, 3, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

      {/* Row 2: Spatial Facility Reach + LLM Policy Budget Allocation Mix + Workforce Structure */}
      {(activeTab === "all" || activeTab === "spatial_budget") &&
        (spatialReach.length > 0 || budgetMix.length > 0) && (
          <div className="grid gap-5 xl:grid-cols-3">
            {/* Spatial Facility Travel Distance */}
            {spatialReach.length > 0 && (
              <div className="border border-white/10 bg-[#050910] p-5">
                <div className="flex items-center gap-2 text-xs font-medium text-amber-300">
                  <MapPin size={14} />
                  <span>OSM Spatial Facility Proximity</span>
                </div>
                <h4 className="mt-1 text-base font-semibold text-white">
                  Distance to Nearest Sector Asset (km)
                </h4>

                <div className="mt-4 h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={spatialReach}
                      layout="vertical"
                      margin={{ top: 6, right: 18, left: 18, bottom: 6 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.07)"
                      />
                      <XAxis
                        type="number"
                        unit=" km"
                        tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="sector"
                        tick={{ fill: "rgba(255,255,255,0.8)", fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#070b12",
                          borderColor: "rgba(255,255,255,0.18)",
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="distance_km"
                        name="Nearest Asset (km)"
                        radius={[0, 3, 3, 0]}
                      >
                        {spatialReach.map((entry, idx) => (
                          <Cell
                            key={`sp-${idx}`}
                            fill={String(
                              entry.color ?? PALETTE[idx % PALETTE.length]
                            )}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* LLM Recommended Policy Budget Mix */}
            {budgetMix.length > 0 && (
              <div className="border border-white/10 bg-[#050910] p-5">
                <div className="flex items-center gap-2 text-xs font-medium text-pink-300">
                  <Scale size={14} />
                  <span>AI Policy Priority Mix (100%)</span>
                </div>
                <h4 className="mt-1 text-base font-semibold text-white">
                  Recommended Sector Resource Weighting
                </h4>

                <div className="mt-3 h-[210px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={budgetMix}
                        dataKey="allocation_percent"
                        nameKey="sector"
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={78}
                        paddingAngle={3}
                      >
                        {budgetMix.map((entry, idx) => (
                          <Cell key={`bm-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: unknown) => `${String(val)}%`}
                        contentStyle={{
                          backgroundColor: "#070b12",
                          borderColor: "rgba(255,255,255,0.18)",
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                  {budgetMix.map((b) => (
                    <div
                      key={b.sector}
                      className="flex items-center justify-between border border-white/5 bg-white/[0.02] px-2.5 py-1"
                    >
                      <span className="flex items-center gap-1.5 truncate text-white/75">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: b.color }}
                        />
                        <span className="truncate">{b.sector}</span>
                      </span>
                      <span className="font-mono font-semibold tabular-nums text-white">
                        {b.allocation_percent}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Workforce Occupational Composition */}
            {workforceMix.length > 0 && (
              <div className="border border-white/10 bg-[#050910] p-5">
                <div className="flex items-center gap-2 text-xs font-medium text-lime-300">
                  <Landmark size={14} />
                  <span>Census Workforce Composition</span>
                </div>
                <h4 className="mt-1 text-base font-semibold text-white">
                  Occupational Livelihood Structure (%)
                </h4>

                <div className="mt-3 h-[210px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={workforceMix}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={76}
                        paddingAngle={3}
                      >
                        {workforceMix.map((entry, idx) => (
                          <Cell
                            key={`wf-${idx}`}
                            fill={String(
                              entry.color ?? PALETTE[idx % PALETTE.length]
                            )}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: unknown) => `${String(val)}%`}
                        contentStyle={{
                          backgroundColor: "#070b12",
                          borderColor: "rgba(255,255,255,0.18)",
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                  {workforceMix.map((w, idx) => (
                    <div
                      key={String(w.name ?? idx)}
                      className="flex items-center justify-between border border-white/5 bg-white/[0.02] px-2.5 py-1"
                    >
                      <span className="flex items-center gap-1.5 truncate text-white/75">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor: String(
                              w.color ?? PALETTE[idx % PALETTE.length]
                            ),
                          }}
                        />
                        <span className="truncate">{String(w.name)}</span>
                      </span>
                      <span className="font-mono tabular-nums text-white/90">
                        {String(w.value)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      {/* Structured Statistical Evidence Tables */}
      {statEntries.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statEntries.map(([groupKey, groupValue], gIdx) => {
            const nested = asRecord(groupValue);
            const nestedEntries = Object.entries(nested);
            return (
              <div
                key={groupKey}
                className="border border-white/10 bg-[#050910] p-5"
              >
                <div
                  className="text-xs font-semibold"
                  style={{ color: PALETTE[gIdx % PALETTE.length] }}
                >
                  {humanize(groupKey)}
                </div>
                {nestedEntries.length > 0 ? (
                  <dl className="mt-3.5 space-y-2">
                    {nestedEntries.map(([k, v]) => (
                      <div
                        key={k}
                        className="flex items-center justify-between gap-3 border-b border-white/5 pb-1.5 text-xs"
                      >
                        <dt className="text-white/45">{humanize(k)}</dt>
                        <dd className="font-mono tabular-nums text-white/85">
                          {formatReadable(v)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="mt-3 font-mono text-sm tabular-nums text-white/80">
                    {formatReadable(groupValue)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* =========================================================
   VILLAGE-SPECIFIC POLICY FORMULATION & COMMITTEE WORKSPACE
========================================================= */

export function DecisionWorkspace({
  policy,
  report,
}: {
  policy: unknown;
  report: unknown;
}) {
  const [copied, setCopied] = useState(false);

  const policyRecord = asRecord(policy);
  const charterTitle = String(
    policyRecord.charter_title ?? "Village Multi-Sector Policy Formulation"
  );
  const strategicSummary = String(policyRecord.strategic_summary ?? "");
  const schemeAlignments = asArray(policyRecord.scheme_alignments).map(asRecord);
  const phasedRoadmap = asArray(policyRecord.phased_roadmap).map(asRecord);
  const governanceRows = asArray(policyRecord.governance_accountability).map(
    asRecord
  );
  const fallbackPolicyEntries =
    schemeAlignments.length === 0 && phasedRoadmap.length === 0
      ? Object.entries(asRecord(policyRecord.policy_framework ?? policy)).filter(
          ([, v]) => v !== undefined && v !== null
        )
      : [];

  const reportRecord = asRecord(report);
  const reportEntries = Object.entries(
    asRecord(reportRecord.content ?? report)
  ).filter(
    ([k, v]) => k !== "executive_summary" && v !== undefined && v !== null
  );

  if (
    !strategicSummary &&
    schemeAlignments.length === 0 &&
    fallbackPolicyEntries.length === 0 &&
    reportEntries.length === 0
  ) {
    return null;
  }

  function handleCopyPolicyBrief() {
    const lines: string[] = [
      `JAN-DRISHTI VILLAGE POLICY FORMULATION BRIEF`,
      charterTitle,
      "",
      strategicSummary,
      "",
      "ALIGNED TELANGANA & CENTRAL PROGRAMMES (FOR DEPARTMENTAL VERIFICATION):",
      ...schemeAlignments.map(
        (s) =>
          `- [${String(s.tier ?? "Programme")} · ${String(s.sector ?? "")}] ${String(s.scheme_name ?? "")}: ${String(s.village_rationale ?? "")} (Verify: ${String(s.verification_protocol ?? "")})`
      ),
      "",
      "PHASED IMPLEMENTATION ROADMAP:",
      ...phasedRoadmap.map(
        (p) =>
          `- ${String(p.phase ?? "")} (${String(p.horizon ?? "")}): ${String(p.priority_actions ?? "")} | Lead: ${String(p.lead_department ?? "")} | Target: ${String(p.measurable_target ?? "")}`
      ),
    ];
    void navigator.clipboard?.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    });
  }

  return (
    <div className="space-y-6">
      {/* Village Policy Charter Banner */}
      <section className="border border-orange-300/25 bg-[#070b12] p-7 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-orange-300">
              <Scale size={16} />
              <span>
                Village-Specific Policy Formulation · Telangana &amp; Central Convergence
              </span>
            </div>
            <h3 className="mt-2 text-2xl font-semibold text-white">
              {charterTitle}
            </h3>
            {strategicSummary && (
              <p className="mt-3 max-w-4xl text-sm leading-7 text-white/65">
                {strategicSummary}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleCopyPolicyBrief}
            className="inline-flex shrink-0 items-center gap-2 border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/85 transition hover:border-orange-300/40 hover:bg-orange-300/[0.08]"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-300" />
                <span>Policy Brief Copied</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Policy Charter</span>
              </>
            )}
          </button>
        </div>

        {/* Telangana State & Central Scheme Convergence Cards */}
        {schemeAlignments.length > 0 && (
          <div className="mt-7">
            <div className="text-xs font-semibold text-white/75">
              Candidate Telangana State &amp; Central Schemes for Field Verification
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {schemeAlignments.map((scheme, idx) => {
                const sec = String(scheme.sector ?? "Multi-Sector");
                const accent = sectorColor(sec, idx);
                return (
                  <article
                    key={`${String(scheme.scheme_name)}-${idx}`}
                    className="relative flex flex-col justify-between border border-white/10 bg-[#050910] p-5"
                  >
                    <div
                      className="absolute inset-x-0 top-0 h-[2px]"
                      style={{ backgroundColor: accent }}
                    />
                    <div>
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span
                          className="font-semibold"
                          style={{ color: accent }}
                        >
                          {sec}
                        </span>
                        <span className="font-mono text-white/45">
                          {String(scheme.tier ?? "Official Scheme")}
                        </span>
                      </div>
                      <h4 className="mt-2 text-base font-semibold text-white/95">
                        {String(scheme.scheme_name ?? "Programme Option")}
                      </h4>
                      <p className="mt-2 text-xs leading-6 text-white/55">
                        {String(scheme.village_rationale ?? "")}
                      </p>
                    </div>

                    <div className="mt-4 border-t border-white/10 pt-3 text-[11px] leading-5 text-white/45">
                      <span className="font-medium text-white/70">
                        Verification step:{" "}
                      </span>
                      {String(scheme.verification_protocol ?? "Verify via MPDO / Gram Sabha")}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* Phased Implementation Roadmap */}
        {phasedRoadmap.length > 0 && (
          <div className="mt-8">
            <div className="text-xs font-semibold text-white/75">
              Phased Village Implementation Roadmap
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {phasedRoadmap.map((phase, idx) => (
                <div
                  key={`${String(phase.phase)}-${idx}`}
                  className="border border-white/10 bg-[#050910] p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-cyan-300">
                        {String(phase.horizon ?? `Horizon ${idx + 1}`)}
                      </span>
                      <span className="text-white/40">
                        Phase {String(idx + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h4 className="mt-2 text-base font-semibold text-white">
                      {String(phase.phase ?? "Implementation Horizon")}
                    </h4>
                    <p className="mt-2.5 text-xs leading-6 text-white/55">
                      {String(phase.priority_actions ?? "")}
                    </p>
                  </div>

                  <div className="mt-4 space-y-1.5 border-t border-white/10 pt-3 text-[11px]">
                    <div>
                      <span className="text-white/40">Lead Agency: </span>
                      <span className="text-white/80 font-medium">
                        {String(phase.lead_department ?? "Gram Panchayat & MPDO")}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40">Target KPI: </span>
                      <span className="font-mono text-emerald-300/90">
                        {String(phase.measurable_target ?? "")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fallback generic policy entries if custom format returned */}
        {fallbackPolicyEntries.length > 0 && (
          <div className="mt-6 space-y-4">
            {fallbackPolicyEntries.map(([key, value]) => (
              <div
                key={key}
                className="border-b border-white/10 pb-4 last:border-b-0"
              >
                <div className="text-xs font-medium text-white/65">
                  {humanize(key)}
                </div>
                <p className="mt-1.5 text-xs leading-6 text-white/50">
                  {formatReadable(value)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Governance Matrix + Committee Technical Review Note */}
      <div className="grid gap-5 xl:grid-cols-2">
        {/* Governance & Institutional Accountability */}
        <section className="border border-white/10 bg-[#070b12] p-7">
          <div className="flex items-center gap-2 text-xs font-medium text-cyan-300">
            <ShieldCheck size={16} />
            <span>Institutional Governance &amp; Review Cadence</span>
          </div>
          <h3 className="mt-2 text-xl font-semibold text-white">
            Gram Panchayat · Mandal · District Accountability
          </h3>

          {governanceRows.length > 0 ? (
            <div className="mt-5 divide-y divide-white/10">
              {governanceRows.map((gov, idx) => (
                <div key={`${String(gov.institution)}-${idx}`} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-white/90">
                      {String(gov.institution ?? "Administrative Tier")}
                    </span>
                    <span className="font-mono text-[11px] text-orange-300/85">
                      {String(gov.cadence ?? "Periodic Review")}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-6 text-white/55">
                    {String(gov.role ?? "")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-xs text-white/45">
              Verify proposed interventions through Gram Sabha resolution, MPDO
              technical sanction, and District Collectorate convergence review.
            </p>
          )}
        </section>

        {/* Draft Committee Technical Report */}
        <section className="border border-white/10 bg-[#070b12] p-7">
          <div className="flex items-center gap-2 text-xs font-medium text-orange-300">
            <FileText size={16} />
            <span>Draft Committee Evidence Note</span>
          </div>
          <h3 className="mt-2 text-xl font-semibold text-white">
            Technical Review &amp; Human Sign-Off Gates
          </h3>

          {reportEntries.length > 0 ? (
            <div className="mt-5 space-y-4">
              {reportEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="border-b border-white/10 pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="text-xs font-semibold text-white/75">
                    {humanize(key)}
                  </div>
                  <p className="mt-1.5 text-xs leading-6 text-white/55">
                    {formatReadable(value)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-xs text-white/40">
              No draft technical report sections were returned for this query.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
