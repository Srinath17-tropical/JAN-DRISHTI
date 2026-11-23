import { useEffect, useMemo, useRef } from "react";
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
  Activity,
  Award,
  BarChart3,
  Handshake,
  ShieldCheck,
  Sprout,
  Target,
  Users,
  Vote,
} from "lucide-react";

interface VisualIssue {
  id: string;
  sector: string;
  status: "open" | "mobilizing" | "resolved";
  escalationStatus: string;
  adoptedNgo?: string;
  upvotes: number;
  affectedPeople?: number;
}

interface VisualProposal {
  id: string;
  sector: string;
  estimatedCostLakhs: number;
  status: "Proposed" | "Shortlisted in Ward Budget" | "Sanctioned";
  votes: number;
}

interface VisualLeader {
  id: string;
  roleTitle: string;
  resolvedCount: number;
  budgetUtilizedPct: number;
  slaDays: number;
}

interface VisualDrive {
  id: string;
  sector: string;
  title: string;
  capacity: number;
  rsvpCount: number;
}

interface VisualWishlist {
  id: string;
  sector: string;
  institution: string;
  item: string;
  needed: number;
  fulfilled: number;
  unit: string;
}

interface VisualObligation {
  id: string;
  sector: string;
  status: "Pending" | "In Progress" | "Completed";
  contributorsCount: number;
}

interface VisualChampion {
  id: string;
  name: string;
  role: string;
  sector: string;
  hours: number;
  verifiedActions: number;
}

const SECTOR_ORDER = ["education", "health", "water", "livelihood", "environment"] as const;

const SECTOR_NAMES: Record<string, string> = {
  education: "Education",
  health: "Health",
  water: "Water",
  livelihood: "Livelihood",
  environment: "Environment",
};

const SECTOR_COLORS: Record<string, string> = {
  education: "#fb7185",
  health: "#10b981",
  water: "#06b6d4",
  livelihood: "#ec4899",
  environment: "#84cc16",
};

export default function ParticipatoryVisualObservatory({
  villageName,
  issues,
  budgetProposals,
  wardLeaders,
  budgetEnvelopeLakhs,
  drives = [],
  wishlists = [],
  obligations = [],
  champions = [],
  saplingsCount = 0,
  certificatesCount = 0,
  sabhaAttendeesCount = 0,
}: {
  villageName: string;
  issues: VisualIssue[];
  budgetProposals: VisualProposal[];
  wardLeaders: VisualLeader[];
  budgetEnvelopeLakhs: number;
  drives?: VisualDrive[];
  wishlists?: VisualWishlist[];
  obligations?: VisualObligation[];
  champions?: VisualChampion[];
  saplingsCount?: number;
  certificatesCount?: number;
  sabhaAttendeesCount?: number;
}) {
  const flowCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const summaryStats = useMemo(() => {
    const openCount = issues.filter((i) => i.status === "open").length;
    const mobilizingCount = issues.filter((i) => i.status === "mobilizing").length;
    const resolvedCount = issues.filter((i) => i.status === "resolved").length;
    const totalUpvotes = issues.reduce((s, i) => s + (i.upvotes || 0), 0);
    const totalAffected = issues.reduce((s, i) => s + (i.affectedPeople || 60), 0);
    const ngoAdopted = issues.filter((i) => Boolean(i.adoptedNgo)).length;
    const totalBudgetVotes = budgetProposals.reduce((s, p) => s + (p.votes || 0), 0);
    const committedLakhs = budgetProposals
      .filter((p) => p.status !== "Proposed")
      .reduce((s, p) => s + p.estimatedCostLakhs, 0);
    const totalDriveRsvps = drives.reduce((s, d) => s + d.rsvpCount, 0);
    const totalDriveCap = Math.max(1, drives.reduce((s, d) => s + d.capacity, 0));
    const totalWishNeeded = Math.max(1, wishlists.reduce((s, w) => s + w.needed, 0));
    const totalWishFulfilled = wishlists.reduce((s, w) => s + w.fulfilled, 0);
    const obligationsDone = obligations.filter((o) => o.status === "Completed").length;

    return {
      openCount,
      mobilizingCount,
      resolvedCount,
      totalIssues: issues.length,
      totalUpvotes,
      totalAffected,
      ngoAdopted,
      totalBudgetVotes,
      committedLakhs,
      totalDriveRsvps,
      totalDriveCap,
      driveFillPct: Math.min(100, Math.round((totalDriveRsvps / totalDriveCap) * 100)),
      wishFulfillPct: Math.min(100, Math.round((totalWishFulfilled / totalWishNeeded) * 100)),
      obligationsDone,
      obligationsTotal: obligations.length,
    };
  }, [issues, budgetProposals, drives, wishlists, obligations]);

  // Chart 1: Sector Budget Demand vs Committed
  const budgetBySector = useMemo(() => {
    const map: Record<string, { sector: string; Proposed: number; Shortlisted: number }> = {
      education: { sector: "Education", Proposed: 0, Shortlisted: 0 },
      health: { sector: "Health", Proposed: 0, Shortlisted: 0 },
      water: { sector: "Water", Proposed: 0, Shortlisted: 0 },
      livelihood: { sector: "Livelihood", Proposed: 0, Shortlisted: 0 },
      environment: { sector: "Environment", Proposed: 0, Shortlisted: 0 },
    };
    for (const p of budgetProposals) {
      const bucket = map[p.sector] ?? map.water;
      if (p.status === "Proposed") {
        bucket.Proposed = Number((bucket.Proposed + p.estimatedCostLakhs).toFixed(1));
      } else {
        bucket.Shortlisted = Number((bucket.Shortlisted + p.estimatedCostLakhs).toFixed(1));
      }
    }
    return Object.values(map);
  }, [budgetProposals]);

  // Chart 2: Civic Case Resolution Donut Split
  const issueStatusData = useMemo(() => {
    return [
      { name: "Open Triage", value: summaryStats.openCount, color: "#fb7185" },
      { name: "Mobilizing / Govt SLA", value: summaryStats.mobilizingCount, color: "#f59e0b" },
      { name: "Peer Verified Closed", value: summaryStats.resolvedCount, color: "#10b981" },
    ].filter((d) => d.value > 0);
  }, [summaryStats]);

  // Chart 3: 5-Sector Community Participation & Civic Action Radar
  const sectorParticipationRadar = useMemo(() => {
    return SECTOR_ORDER.map((sec) => {
      const propVotes = budgetProposals
        .filter((p) => p.sector === sec)
        .reduce((s, p) => s + p.votes, 0);
      const secIssues = issues.filter((i) => i.sector === sec);
      const secResolved = secIssues.filter((i) => i.status === "resolved").length;
      const secDrives = drives.filter((d) => d.sector === sec).length;
      const secContributors = obligations
        .filter((o) => o.sector === sec)
        .reduce((s, o) => s + o.contributorsCount, 0);

      const engagement = Math.min(100, Math.round(35 + propVotes * 0.45 + secContributors * 1.1));
      const actionMomentum = Math.min(100, Math.round(30 + secDrives * 22 + secResolved * 25));
      return {
        sector: SECTOR_NAMES[sec],
        "Citizen Engagement": engagement,
        "Action Momentum": actionMomentum,
      };
    });
  }, [budgetProposals, issues, drives, obligations]);

  // Chart 4: Youth Champions & Volunteer Hours BarChart
  const championChartData = useMemo(() => {
    return champions.slice(0, 6).map((c) => ({
      name: c.name.split(" ")[0],
      Hours: c.hours,
      Actions: c.verifiedActions * 4,
      color: SECTOR_COLORS[c.sector] ?? "#f59e0b",
    }));
  }, [champions]);

  // Interactive 60fps Civic Escalation & Social Audit Flow Canvas
  useEffect(() => {
    const canvas = flowCanvasRef.current;
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
      const h = Math.max(200, rect.height);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      ctx.fillStyle = "#060b14";
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "rgba(255,255,255,0.68)";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(
        `${villageName.toUpperCase()} · PARTICIPATORY GOVERNANCE, BUDGET & SOCIAL AUDIT PIPELINE`,
        16,
        22
      );

      const stages = [
        {
          label: "1. Citizen Voice",
          stat: `${summaryStats.totalBudgetVotes + summaryStats.totalUpvotes} Votes`,
          sub: `${summaryStats.totalAffected.toLocaleString()} impacted residents`,
          color: "#f59e0b",
        },
        {
          label: "2. Ward Budget Pool",
          stat: `₹${summaryStats.committedLakhs.toFixed(1)}L / ₹${budgetEnvelopeLakhs}L`,
          sub: `${sabhaAttendeesCount} Area/Gram Sabha RSVPs`,
          color: "#06b6d4",
        },
        {
          label: "3. Officer / NGO / NSS",
          stat: `${summaryStats.mobilizingCount + summaryStats.openCount} Active Cases`,
          sub: `${summaryStats.ngoAdopted} NGO-adopted · ${summaryStats.driveFillPct}% drives filled`,
          color: "#a78bfa",
        },
        {
          label: "4. Citizen Closure",
          stat: `${summaryStats.resolvedCount} Peer Verified`,
          sub: `${saplingsCount} saplings · ${certificatesCount} Bala certs`,
          color: "#10b981",
        },
      ];

      const pad = 20;
      const spacing = (w - pad * 2) / stages.length;
      const cy = h * 0.58;

      const x0 = pad + spacing * 0.5;
      const x1 = pad + spacing * 3.5;
      ctx.strokeStyle = "rgba(255,255,255,0.16)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x0, cy);
      ctx.lineTo(x1, cy);
      ctx.stroke();

      for (let i = 0; i < 6; i++) {
        const p = (tick * 0.007 + i / 6) % 1;
        const px = x0 + p * (x1 - x0);
        ctx.beginPath();
        ctx.arc(px, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = p > 0.66 ? "#10b981" : p > 0.33 ? "#06b6d4" : "#f59e0b";
        ctx.fill();
      }

      stages.forEach((st, idx) => {
        const cx = pad + spacing * (idx + 0.5);
        const bw = Math.min(220, spacing - 14);
        const bh = 104;
        const bx = cx - bw / 2;
        const by = cy - bh / 2;

        ctx.fillStyle = "#0a1220";
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = st.color;
        ctx.lineWidth = 1.4;
        ctx.strokeRect(bx, by, bw, bh);

        ctx.fillStyle = "rgba(255,255,255,0.68)";
        ctx.font = "11px sans-serif";
        ctx.fillText(st.label, bx + 10, by + 24);

        ctx.fillStyle = st.color;
        ctx.font = "bold 15px monospace";
        ctx.fillText(st.stat, bx + 10, by + 54);

        ctx.fillStyle = "rgba(148,163,184,0.85)";
        ctx.font = "10px sans-serif";
        ctx.fillText(st.sub, bx + 10, by + 80);
      });

      ctx.restore();
      if (!prefersReduced) rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [villageName, summaryStats, budgetEnvelopeLakhs, sabhaAttendeesCount, saplingsCount, certificatesCount]);

  return (
    <section className="space-y-4">
      <div className="border border-white/12 bg-[#0a0f1c] p-5 md:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
          <div>
            <div className="text-xs font-medium text-amber-300 flex items-center gap-1.5">
              <Activity size={14} />
              <span>CIVIC PARTICIPATION VISUAL OBSERVATORY · LIVE COMMUNITY METRICS</span>
            </div>
            <h2 className="mt-0.5 text-lg font-semibold text-white">
              Ward Budget Allocation, Grievance Funnel, 5-Sector Radar &amp; Youth Action Visuals
            </h2>
          </div>
          <div className="font-mono text-xs tabular-nums text-white/60">
            {summaryStats.obligationsDone}/{summaryStats.obligationsTotal} Community Pledges Complete · {wardLeaders.length} Tiers
          </div>
        </div>

        {/* 1. Live Animated Governance Flow Canvas */}
        <canvas
          ref={flowCanvasRef}
          className="w-full h-[200px] border border-white/10 bg-[#060b14] block"
        />

        {/* 2. Row 1 Charts: Budget Demand + Case Donut + 5-Sector Participation Radar */}
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-5 border border-white/10 bg-[#060b14] p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-white/75">
              <Vote size={14} className="text-emerald-300" />
              <span>Sector Budget Demand vs Committed (₹ Lakhs)</span>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetBySector} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
                  <XAxis dataKey="sector" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#09111f",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="Shortlisted" fill="#10b981" name="Shortlisted / Sanctioned" />
                  <Bar dataKey="Proposed" fill="#f59e0b" name="Proposed Backlog" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-3 border border-white/10 bg-[#060b14] p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-white/75">
              <BarChart3 size={14} className="text-cyan-300" />
              <span>Civic Case Resolution Split</span>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={issueStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={66}
                    paddingAngle={3}
                  >
                    {issueStatusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#09111f",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 border border-white/10 bg-[#060b14] p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-white/75">
              <Target size={14} className="text-amber-300" />
              <span>5-Sector Citizen Engagement Radar</span>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="68%" data={sectorParticipationRadar}>
                  <PolarGrid stroke="rgba(148,163,184,0.22)" />
                  <PolarAngleAxis dataKey="sector" tick={{ fontSize: 10, fill: "#cbd5e1" }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Citizen Engagement"
                    dataKey="Citizen Engagement"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.28}
                  />
                  <Radar
                    name="Action Momentum"
                    dataKey="Action Momentum"
                    stroke="#06b6d4"
                    fill="#06b6d4"
                    fillOpacity={0.24}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#09111f",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 3. Row 2 Visuals: Community Action Gauges + Champions Hours + Leader SLA Speed */}
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Youth Drives & Institution Wishlist Visuals */}
          <div className="lg:col-span-4 border border-white/10 bg-[#060b14] p-4 space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-white/75">
              <Handshake size={14} className="text-rose-300" />
              <span>Community Drives, Wishlists &amp; Green Action</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 font-mono tabular-nums">
              <div className="border border-white/10 bg-[#0a1220] p-3">
                <div className="text-[10px] font-sans text-white/55 flex items-center gap-1">
                  <Users size={11} className="text-cyan-300" />
                  <span>Drive RSVPs Filled</span>
                </div>
                <div className="mt-1 text-lg font-bold text-cyan-300">
                  {summaryStats.driveFillPct}%
                </div>
                <div className="mt-1 h-1.5 bg-white/10 overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: `${summaryStats.driveFillPct}%` }} />
                </div>
              </div>

              <div className="border border-white/10 bg-[#0a1220] p-3">
                <div className="text-[10px] font-sans text-white/55 flex items-center gap-1">
                  <Award size={11} className="text-amber-300" />
                  <span>School Wishlists Met</span>
                </div>
                <div className="mt-1 text-lg font-bold text-amber-300">
                  {summaryStats.wishFulfillPct}%
                </div>
                <div className="mt-1 h-1.5 bg-white/10 overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${summaryStats.wishFulfillPct}%` }} />
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {wishlists.slice(0, 3).map((w) => {
                const pct = Math.min(100, Math.round((w.fulfilled / Math.max(1, w.needed)) * 100));
                return (
                  <div key={w.id} className="space-y-1">
                    <div className="flex justify-between gap-2 text-[11px]">
                      <span className="text-white/80 truncate">{w.item} ({w.institution})</span>
                      <span className="font-mono tabular-nums text-emerald-300 shrink-0">
                        {w.fulfilled}/{w.needed}
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/10 overflow-hidden">
                      <div className="h-full bg-emerald-400" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono tabular-nums text-white/70">
              <span className="flex items-center gap-1.5 text-lime-300">
                <Sprout size={12} />
                {saplingsCount} Adopted Saplings
              </span>
              <span className="text-amber-200">{certificatesCount} Bala Certificates</span>
            </div>
          </div>

          {/* Civic Champions Volunteer BarChart */}
          <div className="lg:col-span-4 border border-white/10 bg-[#060b14] p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-white/75">
              <Award size={14} className="text-amber-300" />
              <span>Civic Champions Volunteer Hours &amp; Impact</span>
            </div>
            <div className="h-[205px]">
              {championChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={championChartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#09111f",
                        border: "1px solid rgba(255,255,255,0.15)",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="Hours" name="Civic Hours">
                      {championChartData.map((entry, idx) => (
                        <Cell key={`${entry.name}-${idx}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-white/45">
                  Log civic volunteer drives to populate champion leaderboard visuals.
                </div>
              )}
            </div>
          </div>

          {/* Leader Budget Utilization & SLA Pace */}
          <div className="lg:col-span-4 border border-white/10 bg-[#060b14] p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-white/75">
              <ShieldCheck size={14} className="text-emerald-300" />
              <span>Elected &amp; Officer Budget Utilization &amp; SLA Pace</span>
            </div>
            <div className="space-y-3">
              {wardLeaders.slice(0, 4).map((ldr) => (
                <div key={ldr.id} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white/85 truncate">{ldr.roleTitle}</span>
                    <span className="font-mono tabular-nums text-emerald-300 shrink-0">
                      {ldr.budgetUtilizedPct}% utilized
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-emerald-400"
                      style={{ width: `${Math.min(100, ldr.budgetUtilizedPct)}%` }}
                    />
                  </div>
                  <div className="font-mono text-[10px] text-white/50 tabular-nums">
                    {ldr.resolvedCount} grievances closed · {ldr.slaDays}d statutory SLA
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
