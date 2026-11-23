import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Flame,
  Leaf,
  Play,
  Sun,
  Trees,
  Wind,
} from "lucide-react";

type EnvSubTab = "solar_microgrid" | "clean_air" | "canopy_cooling";

export default function EnvironmentClimateActionSubPortal({
  villageName = "Telangana Settlement",
  districtName = "Telangana",
  baseBiomassPct = 55,
  baseSolarMJ = 18.5,
  basePm25 = 24,
  baseTempC = 32,
}: {
  villageName?: string;
  districtName?: string;
  baseBiomassPct?: number;
  baseSolarMJ?: number;
  basePm25?: number;
  baseTempC?: number;
}) {
  const [showIntro, setShowIntro] = useState(true);
  const [introProgress, setIntroProgress] = useState(0);
  const [tab, setTab] = useState<EnvSubTab>("solar_microgrid");

  // Interactive Ecological & Clean Energy Levers
  const [households, setHouseholds] = useState<number>(600);
  const [solarKw, setSolarKw] = useState<number>(85);
  const [cleanCookingShiftPct, setCleanCookingShiftPct] = useState<number>(75);
  const [bundTrees, setBundTrees] = useState<number>(2400);

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

  const impact = useMemo(() => {
    const cleanUnitsMwhYear = Math.round(solarKw * 1.55); // Deccan solar factor (~1550 kWh/kWp/yr -> /10 here *1.55? Wait: 1 kW = 1,550 kWh = 1.55 MWh/yr!)
    const smokeFreedHomes = Math.round(
      households * (baseBiomassPct / 100) * (cleanCookingShiftPct / 100)
    );
    const dieselGridSavedLakhs = Number((solarKw * 0.145 + smokeFreedHomes * 0.012).toFixed(1));
    const co2TonnesAvoided = Math.round(
      cleanUnitsMwhYear * 0.82 + smokeFreedHomes * 1.4 + bundTrees * 0.022
    );
    const peakCoolingDegC = Number(
      Math.min(3.8, (bundTrees / 1200) * 1.15 + (cleanCookingShiftPct / 100) * 0.4).toFixed(1)
    );
    return {
      cleanUnitsMwhYear,
      smokeFreedHomes,
      dieselGridSavedLakhs,
      co2TonnesAvoided,
      peakCoolingDegC,
    };
  }, [households, solarKw, cleanCookingShiftPct, bundTrees, baseBiomassPct]);

  // 60fps Interactive Net-Zero Gram Panchayat & Heat-Resilience Visual Canvas
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

      // Night-Sky to Emerald Eco Terrain Backdrop
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, "#040a10");
      bgGrad.addColorStop(1, "#07140d");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Rising / Pulsing Deccan Sun
      const sunX = w * 0.16;
      const sunY = h * 0.25;
      const glow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 72);
      glow.addColorStop(0, "rgba(251, 191, 36, 0.55)");
      glow.addColorStop(1, "rgba(251, 191, 36, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      ctx.beginPath();
      ctx.arc(sunX, sunY, 16, 0, Math.PI * 2);
      ctx.fillStyle = "#fbbf24";
      ctx.fill();

      const stages =
        tab === "solar_microgrid"
          ? [
              { label: "Deccan Irradiance", val: `${baseSolarMJ} MJ/m²`, color: "#fbbf24" },
              { label: "PM-KUSUM Pumps", val: `${solarKw} kW Array`, color: "#84cc16" },
              { label: "Daytime Power", val: `${impact.cleanUnitsMwhYear} MWh/yr`, color: "#38bdf8" },
              { label: "Farmer & GP Savings", val: `₹${impact.dieselGridSavedLakhs}L/yr`, color: "#10b981" },
            ]
          : tab === "clean_air"
          ? [
              { label: "Ambient PM2.5", val: `${basePm25} µg/m³`, color: "#f97316" },
              { label: "GOBARdhan + LPG", val: `${cleanCookingShiftPct}% Shift`, color: "#fbbf24" },
              { label: "Zero-Stubble Pellets", val: "Briquette SHGs", color: "#84cc16" },
              { label: "Smoke-Free Kitchens", val: `${impact.smokeFreedHomes} Homes`, color: "#10b981" },
            ]
          : [
              { label: "Peak Heat Stress", val: `${baseTempC}°C Max`, color: "#f87171" },
              { label: "Haritha Bunds", val: `${bundTrees.toLocaleString()} Trees`, color: "#84cc16" },
              { label: "Cooling Relief", val: `-${impact.peakCoolingDegC}°C Canopy`, color: "#38bdf8" },
              { label: "Annual Carbon Sink", val: `${impact.co2TonnesAvoided} t CO₂`, color: "#10b981" },
            ];

      const pad = 26;
      const step = (w - pad * 2) / stages.length;
      const cy = h * 0.58;

      // Energy flow connector
      const x0 = pad + step * 0.5;
      const x1 = pad + step * 3.5;
      ctx.strokeStyle = "rgba(132, 204, 22, 0.28)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x0, cy);
      ctx.lineTo(x1, cy);
      ctx.stroke();

      for (let i = 0; i < 6; i++) {
        const phase = ((tick * 0.008 + i / 6) % 1);
        const px = x0 + phase * (x1 - x0);
        ctx.beginPath();
        ctx.arc(px, cy, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = "#84cc16";
        ctx.fill();
      }

      stages.forEach((st, idx) => {
        const cx = pad + step * (idx + 0.5);
        const bw = Math.min(182, step - 14);
        const bh = 110;
        const bx = cx - bw / 2;
        const by = cy - bh / 2;

        ctx.fillStyle = "#08120e";
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = st.color;
        ctx.lineWidth = 1.4;
        ctx.strokeRect(bx, by, bw, bh);

        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "bold 10px monospace";
        ctx.fillText(`NODE 0${idx + 1}`, bx + 12, by + 22);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(st.label, bx + 12, by + 48);

        ctx.fillStyle = st.color;
        ctx.font = "bold 15px monospace";
        ctx.fillText(st.val, bx + 12, by + 82);
      });

      ctx.restore();
      if (!prefersReduced) rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [showIntro, tab, solarKw, cleanCookingShiftPct, bundTrees, baseSolarMJ, basePm25, baseTempC, impact]);

  return (
    <section
      id="sector-subportal-anchor"
      className="relative border border-lime-400/25 bg-[#050a08] text-white overflow-hidden"
    >
      {/* 3-SECOND CINEMATIC OPENING */}
      {showIntro && (
        <div className="relative min-h-[340px] flex flex-col items-center justify-center p-8 text-center bg-[#040907]">
          <div className="text-xs font-medium tracking-[0.25em] text-lime-300 uppercase">
            CLIMATE RESILIENCE &amp; NET-ZERO SUB-PORTAL · TELANGANA
          </div>
          <h3 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Haritha—NetZero 2047
          </h3>
          <p className="mt-3 max-w-xl text-sm text-white/65">
            PM-KUSUM Solar Pumping ({baseSolarMJ} MJ/m²) · Smokeless Kitchens · Haritha Haram Cooling Canopies for {villageName}.
          </p>
          <div className="mt-6 w-64 h-1 bg-white/10 overflow-hidden">
            <div
              className="h-full bg-lime-400 transition-all duration-75"
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
              <div className="text-xs font-medium text-lime-300 flex items-center gap-2">
                <Leaf size={14} />
                <span>HARITHA—NETZERO ENVIRONMENT SUB-PORTAL · {villageName.toUpperCase()} ({districtName})</span>
              </div>
              <h3 className="mt-1.5 text-2xl font-bold text-white">
                Decentralized Solar Microgrids, Clean Air &amp; Tank-Bund Cooling Canopies
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

          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "solar_microgrid", label: "01 · PM-KUSUM Solar Feeder & Cold Storage", icon: Sun },
                { id: "clean_air", label: "02 · Smokeless Kitchens & Stubble Pellets", icon: Wind },
                { id: "canopy_cooling", label: "03 · Haritha Haram & Heat-Shield Shelter", icon: Trees },
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
                      ? "border-lime-400/60 bg-lime-500/15 text-white"
                      : "border-white/10 bg-white/[0.02] text-white/60 hover:text-white"
                  }`}
                >
                  <Icon size={14} className={active ? "text-lime-300" : ""} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <canvas
            ref={canvasRef}
            className="w-full h-[250px] sm:h-[260px] border border-white/12 bg-[#050a08] block"
          />

          {/* Interactive Ecological & Carbon Savings Calculator */}
          <div className="grid lg:grid-cols-12 gap-6 items-center border border-white/10 bg-black/30 p-5">
            <div className="lg:col-span-6 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-lime-300 font-semibold">
                <Flame size={14} />
                <span>Net-Zero Village Carbon &amp; Savings Simulator</span>
              </div>

              <label className="block space-y-1">
                <div className="flex justify-between font-mono tabular-nums">
                  <span className="text-white/75">Target Settlement Households</span>
                  <span className="text-white font-semibold">{households} HH</span>
                </div>
                <input
                  type="range"
                  min={150}
                  max={2000}
                  step={50}
                  value={households}
                  onChange={(e) => setHouseholds(Number(e.target.value))}
                  className="w-full accent-lime-400 cursor-pointer"
                />
              </label>

              <label className="block space-y-1">
                <div className="flex justify-between font-mono tabular-nums">
                  <span className="text-white/75">Community Solar &amp; PM-KUSUM Array</span>
                  <span className="text-amber-300 font-semibold">{solarKw} kW</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={300}
                  step={5}
                  value={solarKw}
                  onChange={(e) => setSolarKw(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </label>

              <label className="block space-y-1">
                <div className="flex justify-between font-mono tabular-nums">
                  <span className="text-white/75">Solid Biomass → Clean Fuel Shift</span>
                  <span className="text-emerald-300 font-semibold">{cleanCookingShiftPct}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={cleanCookingShiftPct}
                  onChange={(e) => setCleanCookingShiftPct(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </label>

              <label className="block space-y-1">
                <div className="flex justify-between font-mono tabular-nums">
                  <span className="text-white/75">Tank-Bund &amp; Avenue Native Trees</span>
                  <span className="text-lime-300 font-semibold">{bundTrees.toLocaleString()} Saplings</span>
                </div>
                <input
                  type="range"
                  min={400}
                  max={8000}
                  step={200}
                  value={bundTrees}
                  onChange={(e) => setBundTrees(Number(e.target.value))}
                  className="w-full accent-lime-400 cursor-pointer"
                />
              </label>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 gap-3 font-mono tabular-nums">
              <div className="border border-white/10 bg-[#08130d] p-4">
                <div className="text-[11px] font-sans text-white/55">Clean Solar Energy Generated</div>
                <div className="mt-1 text-2xl font-bold text-amber-300">{impact.cleanUnitsMwhYear} MWh/yr</div>
                <div className="mt-1 text-[11px] font-sans text-white/45">Powers daytime borewells &amp; cold rooms</div>
              </div>
              <div className="border border-white/10 bg-[#08130d] p-4">
                <div className="text-[11px] font-sans text-white/55">Smoke-Free Families</div>
                <div className="mt-1 text-2xl font-bold text-emerald-300">{impact.smokeFreedHomes} HH</div>
                <div className="mt-1 text-[11px] font-sans text-white/45">Removed from indoor PM2.5 hazard</div>
              </div>
              <div className="border border-white/10 bg-[#08130d] p-4">
                <div className="text-[11px] font-sans text-white/55">Annual Carbon Offset</div>
                <div className="mt-1 text-2xl font-bold text-lime-300">{impact.co2TonnesAvoided} t CO₂</div>
                <div className="mt-1 text-[11px] font-sans text-white/45">Eligible for rural carbon-credit pools</div>
              </div>
              <div className="border border-white/10 bg-[#08130d] p-4">
                <div className="text-[11px] font-sans text-white/55">Local Heat Cooling &amp; Savings</div>
                <div className="mt-1 text-2xl font-bold text-cyan-300">-{impact.peakCoolingDegC}°C · ₹{impact.dieselGridSavedLakhs}L</div>
                <div className="mt-1 text-[11px] font-sans text-white/45">Reduced summer heat stress &amp; energy bills</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
