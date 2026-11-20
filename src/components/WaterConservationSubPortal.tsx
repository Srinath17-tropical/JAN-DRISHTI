import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  CheckCircle2,
  CloudRain,
  Droplets,
  Gauge,
  Layers,
  Play,
  Recycle,
  ShieldCheck,
  Waves,
} from "lucide-react";

type FlowLayerMode = "all" | "rwh" | "greywater" | "cloudburst";
type SubPortalTab = "apartment_architecture" | "waterbody_revival";

const APARTMENT_SCALE_BENCHMARKS = [
  {
    size: "Small (20 flats)",
    residents: "~80–100",
    rawCollected: "7,000 – 9,000 L/day",
    reusableYield: "6,500 – 8,500 L/day",
  },
  {
    size: "Mid-sized (50 flats)",
    residents: "~200–250",
    rawCollected: "18,000 – 22,500 L/day",
    reusableYield: "16,500 – 21,000 L/day",
  },
  {
    size: "Large (100 flats)",
    residents: "~400–500",
    rawCollected: "36,000 – 45,000 L/day",
    reusableYield: "33,000 – 42,000 L/day",
  },
  {
    size: "Gated Community (300+ flats)",
    residents: "~1,200–1,500",
    rawCollected: "108,000 – 135,000 L/day",
    reusableYield: "100,000 – 125,000+ L/day",
  },
];

const LOCAL_WATERBODY_REVIVAL_STEPS = [
  {
    step: "01 · Zero-Sewage Diversion & Constructed Wetlands",
    detail:
      "Intercept incoming residential drains through bar screens and root-zone reed beds (Canna & Typha phytoremediation) before water enters city lakes or village tanks.",
    impact: "Cuts BOD/COD pollution by 70–85% before lake entry",
    accent: "bg-cyan-600",
  },
  {
    step: "02 · Scientific De-Silting & Bund Strengthening",
    detail:
      "Excavate nutrient-rich silt (given free to local farmers as organic top-dressing) and armor earthen bunds with Vetiver grass to stop monsoon breaches.",
    impact: "Restores +35% to +60% historic live water storage depth",
    accent: "bg-emerald-600",
  },
  {
    step: "03 · Solar Floating Aerators & Aquatic Bio-Islands",
    detail:
      "Deploy solar fountain aerators and floating bamboo-wetland rafts (proven at Hyderabad's Neknampur Lake) to infuse dissolved oxygen and break algal blooms.",
    impact: "Stops foul odors & revives native fish ecosystems",
    accent: "bg-teal-600",
  },
  {
    step: "04 · Aquifer Recharge Shafts & Zero-Encroachment Guards",
    detail:
      "Embed 25–30m slotted recharge borewells in lakebeds and demark strict Full Tank Level (FTL) geo-boundaries with community Lake Protection Committees.",
    impact: "Lifts surrounding village & apartment borewells by 4–8 meters",
    accent: "bg-indigo-600",
  },
];

export default function WaterConservationSubPortal({
  villageName = "Telangana Settlement",
  districtName = "Hyderabad / Telangana",
}: {
  villageName?: string;
  districtName?: string;
}) {
  const [showIntro, setShowIntro] = useState(true);
  const [introProgress, setIntroProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<SubPortalTab>("apartment_architecture");

  // Interactive 10-15 Floor Apartment Engineering Parameters (Default = PDF 12-Floor Baseline)
  const [floors, setFloors] = useState<number>(12);
  const [flatsPerFloor, setFlatsPerFloor] = useState<number>(4);
  const [residentsPerFlat, setResidentsPerFlat] = useState<number>(4.5);
  const [rooftopSqm, setRooftopSqm] = useState<number>(850);
  const [podiumSqm, setPodiumSqm] = useState<number>(1200);
  const [annualRainMm, setAnnualRainMm] = useState<number>(800);
  const [includeKitchenGreywater, setIncludeKitchenGreywater] = useState<boolean>(false);
  const [flowMode, setFlowMode] = useState<FlowLayerMode>("all");

  const archCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const replayIntro = useCallback(() => {
    setShowIntro(true);
    setIntroProgress(0);
  }, []);

  // Exact 3.0-second cinematic opening timeline
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
      const pct = Math.min(100, Math.round((elapsed / totalMs) * 100));
      setIntroProgress(pct);
      if (elapsed >= totalMs) {
        setShowIntro(false);
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [showIntro]);

  // Complete Hydraulic & Water-Saving Equations (Synced with Attached Engineering PDF)
  const calc = useMemo(() => {
    const totalFlats = floors * flatsPerFloor;
    const totalResidents = Math.round(totalFlats * residentsPerFlat);

    // A. CPHEEO 135 LPCD Norm
    const totalDailyDemandL = totalResidents * 135;
    const bathingWashL = totalResidents * 55;
    const toiletFlushL = totalResidents * 40;
    const laundryCleanL = totalResidents * 25;
    const kitchenDemandL = totalResidents * 15;

    // B. Greywater Regeneration (80 LPCD without kitchen, 95 LPCD with kitchen grease trap)
    const greyLpcd = includeKitchenGreywater ? 95 : 80;
    const rawGreywaterL = totalResidents * greyLpcd;
    const netRegeneratedL = Math.round(rawGreywaterL * 0.9); // 90% recovery

    // Daily Non-Potable Reuse
    const landscapeScale = Math.round(3500 * (totalFlats / 48));
    const landscapingCarWashL = Math.min(landscapeScale, Math.max(0, netRegeneratedL - toiletFlushL));
    const directGreyReuseL = Math.min(netRegeneratedL, toiletFlushL + landscapingCarWashL);
    const surplusPolishedGwL = Math.max(0, netRegeneratedL - directGreyReuseL);

    // C. Rainwater Harvesting & Peak Cloudburst (50 mm/hr)
    const rainM = annualRainMm / 1000;
    const rooftopRwhYearL = Math.round(rooftopSqm * rainM * 0.85);
    const podiumRwhYearL = Math.round(podiumSqm * rainM * 0.65);
    const peakCloudburstLph = Math.round((rooftopSqm * 0.85 + podiumSqm * 0.65) * 0.05);
    const recommendedRechargeWells = Math.max(2, Math.ceil(peakCloudburstLph / 40000));

    // D. Annual Water Conservation Summary
    const annualBaselineDemandL = totalDailyDemandL * 365;
    const annualGreywaterSavedL = directGreyReuseL * 365;
    const annualSurplusGwRechargeL = surplusPolishedGwL * 365;
    const annualDirectGroundwaterRechargeL = podiumRwhYearL + annualSurplusGwRechargeL;
    const totalFreshwaterCutL = annualGreywaterSavedL + rooftopRwhYearL;
    const freshwaterDependencyCutPct = Number(
      ((totalFreshwaterCutL / Math.max(1, annualBaselineDemandL)) * 100).toFixed(1)
    );
    const greywaterOffsetPct = Number(
      ((annualGreywaterSavedL / Math.max(1, annualBaselineDemandL)) * 100).toFixed(1)
    );
    const rwhOffsetPct = Number(
      ((rooftopRwhYearL / Math.max(1, annualBaselineDemandL)) * 100).toFixed(1)
    );
    const tankersSavedYear = Math.round(totalFreshwaterCutL / 10000); // 10,000L tankers
    const annualTankerBillSavedInr = tankersSavedYear * 1000; // ₹1,000 avg Hyderabad tanker

    // Recommended Tank Sizing
    const freshSumpCapacityL = Math.max(25000, Math.round((rooftopRwhYearL / 22) / 1000) * 1000);
    const greywaterTankCapacityL = Math.max(15000, Math.round((netRegeneratedL * 1.15) / 1000) * 1000);

    return {
      totalFlats,
      totalResidents,
      totalDailyDemandL,
      bathingWashL,
      toiletFlushL,
      laundryCleanL,
      kitchenDemandL,
      greyLpcd,
      rawGreywaterL,
      netRegeneratedL,
      landscapingCarWashL,
      directGreyReuseL,
      surplusPolishedGwL,
      rooftopRwhYearL,
      podiumRwhYearL,
      peakCloudburstLph,
      recommendedRechargeWells,
      annualBaselineDemandL,
      annualGreywaterSavedL,
      annualDirectGroundwaterRechargeL,
      totalFreshwaterCutL,
      freshwaterDependencyCutPct,
      greywaterOffsetPct,
      rwhOffsetPct,
      tankersSavedYear,
      annualTankerBillSavedInr,
      freshSumpCapacityL,
      greywaterTankCapacityL,
    };
  }, [
    floors,
    flatsPerFloor,
    residentsPerFlat,
    rooftopSqm,
    podiumSqm,
    annualRainMm,
    includeKitchenGreywater,
  ]);

  // Grand 60fps Architectural Elevation & Hydraulic Flow Canvas (10-15 Floor Apartment)
  useEffect(() => {
    if (showIntro || activeTab !== "apartment_architecture") return;
    const canvas = archCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let rafId = 0;
    let tick = 0;

    const drawFlowBeads = (
      points: Array<[number, number]>,
      color: string,
      speed: number,
      count: number,
      radius = 3.2
    ) => {
      if (points.length < 2) return;
      // Draw pipe segment
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.stroke();

      // Compute cumulative segment lengths
      const segs: Array<{ x1: number; y1: number; x2: number; y2: number; len: number }> = [];
      let totalLen = 0;
      for (let i = 0; i < points.length - 1; i++) {
        const dx = points[i + 1][0] - points[i][0];
        const dy = points[i + 1][1] - points[i][1];
        const len = Math.hypot(dx, dy);
        segs.push({ x1: points[i][0], y1: points[i][1], x2: points[i + 1][0], y2: points[i + 1][1], len });
        totalLen += len;
      }

      for (let b = 0; b < count; b++) {
        const targetDist = (((tick * speed) / 100 + b / count) % 1) * totalLen;
        let acc = 0;
        for (const s of segs) {
          if (acc + s.len >= targetDist) {
            const frac = (targetDist - acc) / Math.max(1, s.len);
            const bx = s.x1 + (s.x2 - s.x1) * frac;
            const by = s.y1 + (s.y2 - s.y1) * frac;
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(bx, by, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.4;
            ctx.stroke();
            break;
          }
          acc += s.len;
        }
      }
    };

    const draw = () => {
      const parent = canvas.parentElement;
      const w = Math.max(540, parent ? parent.clientWidth : 920);
      const h = 560;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 1. Atmospheric Sky & Subsurface Cross-Section Backdrop
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 395);
      skyGrad.addColorStop(0, flowMode === "cloudburst" ? "#0b1a2e" : "#071d33");
      skyGrad.addColorStop(0.65, "#0d3552");
      skyGrad.addColorStop(1, "#134e63");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, 395);

      // Ground / Soil / Fractured Granite Aquifer Zone
      const groundY = 395;
      ctx.fillStyle = "#1c2430"; // Basement & Stilt slab zone
      ctx.fillRect(0, groundY, w, 92);
      ctx.fillStyle = "#082f49"; // Deep Deccan Fractured Granite Aquifer
      ctx.fillRect(0, groundY + 92, w, h - (groundY + 92));

      // Subtle aquifer strata lines
      ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
      ctx.lineWidth = 1;
      for (let ay = groundY + 105; ay < h - 10; ay += 14) {
        ctx.beginPath();
        ctx.moveTo(0, ay);
        ctx.lineTo(w, ay);
        ctx.stroke();
      }

      // 2. Animated Monsoon Clouds & Falling Rain
      const showRain = flowMode === "all" || flowMode === "rwh" || flowMode === "cloudburst";
      const rainDrops = flowMode === "cloudburst" ? 55 : 26;
      if (showRain) {
        for (let c = 0; c < 3; c++) {
          const cx = w * (0.2 + c * 0.3) + Math.sin(tick * 0.015 + c) * 14;
          ctx.fillStyle = flowMode === "cloudburst" ? "rgba(148, 163, 184, 0.55)" : "rgba(226, 232, 240, 0.35)";
          ctx.beginPath();
          ctx.arc(cx, 28, 22, 0, Math.PI * 2);
          ctx.arc(cx + 22, 24, 26, 0, Math.PI * 2);
          ctx.arc(cx + 46, 30, 20, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = flowMode === "cloudburst" ? "rgba(56, 189, 248, 0.85)" : "rgba(103, 232, 249, 0.6)";
        ctx.lineWidth = flowMode === "cloudburst" ? 2 : 1.4;
        for (let r = 0; r < rainDrops; r++) {
          const rx = ((r * 47 + tick * 0.8) % (w - 40)) + 20;
          const ry = 48 + ((tick * (flowMode === "cloudburst" ? 5.2 : 3.1) + r * 39) % (groundY - 60));
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 3, ry + 11);
          ctx.stroke();
        }
      }

      // 3. Main 10–15 Floor Apartment Building Structure (Left-Center Stage)
      const bldgX = Math.max(70, w * 0.14);
      const bldgW = Math.min(310, w * 0.34);
      const roofY = 92;
      const bldgH = groundY - roofY; // ~303px divided across 10..15 floors
      const floorH = bldgH / floors;

      // Building outer facade
      ctx.fillStyle = "#162235";
      ctx.fillRect(bldgX, roofY, bldgW, bldgH);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.strokeRect(bldgX, roofY, bldgW, bldgH);

      // Draw each floor (10 to 15 floors cleanly!)
      for (let f = 0; f < floors; f++) {
        const fy = roofY + f * floorH;
        const floorNum = floors - f;
        ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bldgX, fy);
        ctx.lineTo(bldgX + bldgW, fy);
        ctx.stroke();

        // Floor number badge on left margin
        ctx.fillStyle = "rgba(226, 232, 240, 0.85)";
        ctx.font = "600 9px ui-monospace, monospace";
        ctx.fillText(`F${String(floorNum).padStart(2, "0")}`, bldgX - 26, fy + floorH * 0.65);

        // Warm lit apartment windows (4 columns)
        const winCount = 4;
        const winGap = (bldgW - 60) / winCount;
        for (let wc = 0; wc < winCount; wc++) {
          const wx = bldgX + 44 + wc * winGap;
          ctx.fillStyle = (floorNum + wc) % 3 === 0 ? "#fde047" : "#38bdf8";
          ctx.globalAlpha = 0.78;
          ctx.fillRect(wx, fy + 3, Math.max(12, winGap - 12), Math.max(6, floorH - 7));
          ctx.globalAlpha = 1;
        }
      }

      // Pressure Zoning Marker between Floor 7 & Floor 8 (PRV Dual Zone from PDF!)
      const prvFloorIndex = Math.max(2, floors - 7);
      const prvY = roofY + prvFloorIndex * floorH;
      ctx.strokeStyle = "#f43f5e";
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(bldgX - 32, prvY);
      ctx.lineTo(bldgX + bldgW + 14, prvY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#fda4af";
      ctx.font = "700 9px system-ui, sans-serif";
      ctx.fillText("PRV Pressure Split (F1–7 / F8–15)", bldgX - 4, prvY - 3);

      // 4. Rooftop Catchment & Dual Overhead Tank (OHT: Fresh + Purple Greywater Flushing)
      // Rooftop rain catch parapet tray
      ctx.fillStyle = "#0ea5e9";
      ctx.fillRect(bldgX - 6, roofY - 8, bldgW + 12, 8);
      ctx.fillStyle = "#e0f2fe";
      ctx.font = "700 10px system-ui, sans-serif";
      ctx.fillText(`Rooftop Rain Catch (${rooftopSqm} m²)`, bldgX + 6, roofY - 14);

      // Dual Compartment Overhead Tank (OHT) on Roof
      const ohtX = bldgX + bldgW - 115;
      const ohtY = roofY - 46;
      // Compartment 1: Fresh Potable OHT
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(ohtX, ohtY, 52, 36);
      ctx.strokeStyle = "#7dd3fc";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ohtX, ohtY, 52, 36);
      // Compartment 2: Purple Treated Greywater Flushing OHT
      ctx.fillStyle = "#7e22ce";
      ctx.fillRect(ohtX + 54, ohtY, 56, 36);
      ctx.strokeStyle = "#d8b4fe";
      ctx.strokeRect(ohtX + 54, ohtY, 56, 36);

      ctx.fillStyle = "#ffffff";
      ctx.font = "700 9px system-ui, sans-serif";
      ctx.fillText("Fresh", ohtX + 10, ohtY + 15);
      ctx.fillText("OHT", ohtX + 13, ohtY + 27);
      ctx.fillText("Purple", ohtX + 66, ohtY + 15);
      ctx.fillText("Flush OHT", ohtX + 58, ohtY + 27);

      // 5. Ground/Basement Tanks & Courtyard Architecture (Right of Tower + Below Tower)
      // Underground Fresh RWH Sump (under left side of tower)
      const sumpX = bldgX + 6;
      const sumpY = groundY + 14;
      const sumpW = 138;
      const sumpH = 66;
      ctx.fillStyle = "#0369a1";
      ctx.fillRect(sumpX, sumpY, sumpW, sumpH);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.strokeRect(sumpX, sumpY, sumpW, sumpH);
      ctx.fillStyle = "#e0f2fe";
      ctx.font = "700 11px system-ui, sans-serif";
      ctx.fillText("FRESH WATER RWH SUMP", sumpX + 8, sumpY + 22);
      ctx.font = "600 10px ui-monospace, monospace";
      ctx.fillText(`${(calc.freshSumpCapacityL / 1000).toFixed(0)} KL Capacity`, sumpX + 8, sumpY + 38);
      ctx.fillText(`+${(calc.rooftopRwhYearL / 1000).toFixed(0)} KL/yr Rain`, sumpX + 8, sumpY + 53);

      // Basement Greywater Treatment Plant (GWTP: MBBR/MBR + Carbon + UV)
      const gwtpX = bldgX + 156;
      const gwtpY = groundY + 14;
      const gwtpW = 175;
      const gwtpH = 66;
      ctx.fillStyle = "#3b0764";
      ctx.fillRect(gwtpX, gwtpY, gwtpW, gwtpH);
      ctx.strokeStyle = "#c084fc";
      ctx.lineWidth = 2;
      ctx.strokeRect(gwtpX, gwtpY, gwtpW, gwtpH);
      ctx.fillStyle = "#f3e8ff";
      ctx.font = "700 11px system-ui, sans-serif";
      ctx.fillText("BASEMENT GWTP TANK", gwtpX + 10, gwtpY + 20);
      ctx.font = "600 9.5px system-ui, sans-serif";
      ctx.fillStyle = "#e9d5ff";
      ctx.fillText("Screen → MBBR → Carbon → UV", gwtpX + 10, gwtpY + 36);
      ctx.font = "700 10px ui-monospace, monospace";
      ctx.fillStyle = "#d8b4fe";
      ctx.fillText(`${(calc.netRegeneratedL / 1000).toFixed(1)} KLD Recycled`, gwtpX + 10, gwtpY + 53);

      // First-Flush + Rapid Sand Filter Unit (to left of tower base)
      const ffX = bldgX - 66;
      const ffY = groundY - 46;
      ctx.fillStyle = "#0e7490";
      ctx.fillRect(ffX, ffY, 54, 42);
      ctx.strokeStyle = "#67e8f9";
      ctx.strokeRect(ffX, ffY, 54, 42);
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 8.5px system-ui, sans-serif";
      ctx.fillText("1st-Flush", ffX + 5, ffY + 17);
      ctx.fillText("+ Filter", ffX + 8, ffY + 30);

      // 6. Podium Landscaping, Car Wash & Deep Aquifer Recharge Borewells (Right Side of Building)
      const podX = bldgX + bldgW + 24;
      const podW = w - podX - 24;

      // Landscaped Green Podium & Trees
      ctx.fillStyle = "#15803d";
      ctx.fillRect(podX, groundY - 12, podW * 0.48, 12);
      // Trees / Garden visuals on Podium
      for (let t = 0; t < 2; t++) {
        const tx = podX + 35 + t * 58;
        ctx.fillStyle = "#78350f";
        ctx.fillRect(tx - 3, groundY - 38, 6, 26);
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.arc(tx, groundY - 46, 17, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#bbf7d0";
      ctx.font = "700 10px system-ui, sans-serif";
      ctx.fillText(`Garden & Car Wash`, podX + 8, groundY - 70);
      ctx.font = "600 9.5px ui-monospace, monospace";
      ctx.fillText(`${calc.landscapingCarWashL.toLocaleString("en-IN")} L/d (Greywater)`, podX + 8, groundY - 82);

      // Paved Podium/Driveway Surface (Right Edge)
      const driveX = podX + podW * 0.52;
      const driveW = podW * 0.48;
      ctx.fillStyle = "#475569";
      ctx.fillRect(driveX, groundY - 10, driveW, 10);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "700 10px system-ui, sans-serif";
      ctx.fillText(`Podium & Driveway (${podiumSqm} m²)`, driveX, groundY - 22);

      // Silt & Oil Trap Box below Podium
      const siltX = driveX + 12;
      const siltY = groundY + 14;
      ctx.fillStyle = "#0f766e";
      ctx.fillRect(siltX, siltY, 104, 42);
      ctx.strokeStyle = "#5eead4";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(siltX, siltY, 104, 42);
      ctx.fillStyle = "#ccfbf1";
      ctx.font = "700 9.5px system-ui, sans-serif";
      ctx.fillText("Silt & Oil Trap", siltX + 12, siltY + 18);
      ctx.font = "600 9px system-ui, sans-serif";
      ctx.fillText("Desilting Chamber", siltX + 8, siltY + 33);

      // 2x Deep Aquifer Recharge Borewells down into Granite Water Table (Bottom Right)
      const wellXs = [siltX + 35, Math.min(w - 60, siltX + 120)];
      wellXs.forEach((wx, idx) => {
        ctx.fillStyle = "#0284c7";
        ctx.fillRect(wx - 12, groundY + 92, 24, 58);
        ctx.strokeStyle = "#7dd3fc";
        ctx.lineWidth = 2;
        ctx.strokeRect(wx - 12, groundY + 92, 24, 58);
        // Recharge ripples spreading inside granite aquifer
        const rippleR = 14 + ((tick * 0.6 + idx * 12) % 28);
        ctx.strokeStyle = `rgba(56, 189, 248, ${Math.max(0.08, 0.7 - rippleR / 42)})`;
        ctx.beginPath();
        ctx.arc(wx, groundY + 132, rippleR, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.fillStyle = "#7dd3fc";
      ctx.font = "700 10.5px system-ui, sans-serif";
      ctx.fillText(
        `${calc.recommendedRechargeWells}× Aquifer Recharge Borewells (25–30m Slotted Granite)`,
        Math.max(siltX - 40, w - 345),
        h - 10
      );

      // 7. Vertical Stacks & Animated Fluid Pipes (All 4 Closed Hydraulic Loops!)
      const activeRwh = flowMode === "all" || flowMode === "rwh" || flowMode === "cloudburst";
      const activeGw = flowMode === "all" || flowMode === "greywater";

      // Pipe 1 (Cyan): Rooftop Rainwater -> First Flush -> Fresh Sump
      if (activeRwh) {
        drawFlowBeads(
          [
            [bldgX - 6, roofY - 4],
            [ffX + 27, roofY - 4],
            [ffX + 27, ffY],
            [ffX + 27, ffY + 42],
            [ffX + 27, sumpY + 30],
            [sumpX, sumpY + 30],
          ],
          "#22d3ee",
          2.2,
          8
        );
        // Podium Runoff -> Silt Trap -> Deep Recharge Wells
        drawFlowBeads(
          [
            [driveX + 60, groundY - 4],
            [siltX + 52, siltY],
            [siltX + 52, siltY + 42],
            [wellXs[0], groundY + 115],
          ],
          "#38bdf8",
          2.1,
          5
        );
      }

      // Pipe 2 (Bright Blue Line A): Fresh Sump -> Fresh OHT -> Baths & Kitchens
      if (activeRwh || activeGw) {
        drawFlowBeads(
          [
            [sumpX + 70, sumpY],
            [sumpX + 70, roofY + 30],
            [ohtX + 26, ohtY + 36],
          ],
          "#3b82f6",
          1.7,
          6
        );
      }

      // Pipe 3 (Teal/Amber Raw Greywater Stack): Showers/Laundry flowing DOWN to Basement GWTP
      if (activeGw) {
        drawFlowBeads(
          [
            [bldgX + bldgW - 60, roofY + 40],
            [bldgX + bldgW - 60, groundY + 14],
            [gwtpX + 55, gwtpY + 14],
          ],
          "#14b8a6",
          2.0,
          7
        );

        // Pipe 4 (Purple Recycled Riser Line B): Basement GWTP -> Purple Flushing OHT -> Toilets
        drawFlowBeads(
          [
            [gwtpX + 115, gwtpY],
            [gwtpX + 115, ohtY + 18],
            [ohtX + 110, ohtY + 18],
          ],
          "#c084fc",
          2.0,
          8
        );

        // Purple Pipe branch feeding Podium Garden & Car Wash
        drawFlowBeads(
          [
            [gwtpX + gwtpW, gwtpY + 28],
            [podX + 42, gwtpY + 28],
            [podX + 42, groundY - 12],
          ],
          "#a855f7",
          1.8,
          5
        );

        // Polished Surplus Greywater -> Recharge Well!
        drawFlowBeads(
          [
            [gwtpX + gwtpW, gwtpY + 52],
            [wellXs[0], gwtpY + 52],
            [wellXs[0], groundY + 115],
          ],
          "#6ee7b7",
          1.5,
          5
        );
      }

      // 8. Top HUD Architectural Title Banner
      ctx.fillStyle = "rgba(4, 10, 20, 0.82)";
      ctx.fillRect(10, 10, 322, 42);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, 322, 42);
      ctx.fillStyle = "#67e8f9";
      ctx.font = "700 11.5px system-ui, sans-serif";
      ctx.fillText(`${floors}-Floor High-Rise Closed-Loop Water Blueprint`, 18, 27);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "600 10.5px ui-monospace, monospace";
      ctx.fillText(
        `${calc.totalFlats} Flats · ${calc.totalResidents} Residents · -${calc.freshwaterDependencyCutPct}% Fresh Draw`,
        18,
        44
      );

      if (!prefersReduced) {
        tick += 1;
        rafId = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [showIntro, activeTab, floors, rooftopSqm, podiumSqm, flowMode, calc]);

  return (
    <section
      aria-label="Jal-Raksha Water Conservation for Future Generations Sub-Portal"
      className="relative border border-cyan-500/30 bg-white dark:bg-[#060d17] shadow-sm overflow-hidden"
    >
      {showIntro ? (
        /* 3-Second Cinematic Opening Stage */
        <div
          className="jd-keep-dark relative min-h-[540px] flex flex-col items-center justify-center p-6 sm:p-10 text-center text-white overflow-hidden"
          style={{
            background:
              "radial-gradient(circle at 50% 35%, rgba(6,182,212,0.34) 0%, rgba(16,185,129,0.16) 40%, #030914 84%)",
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-35"
          >
            <div className="h-[380px] w-[380px] rounded-full border border-cyan-400/35 animate-[spin_14s_linear_infinite]" />
            <div className="absolute h-[260px] w-[260px] rounded-full border border-purple-400/40 animate-[spin_10s_linear_infinite_reverse]" />
          </div>

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="text-xs font-semibold tracking-widest text-cyan-300 uppercase">
              Water Conservation for Future Generations · {districtName}
            </div>

            <h2
              className="font-samarkan text-4xl sm:text-5xl md:text-6xl text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(110deg, #67e8f9 12%, #34d399 55%, #c084fc 95%)",
              }}
            >
              Jal · Raksha
            </h2>

            <p className="text-sm sm:text-base text-slate-200 max-w-xl mx-auto leading-relaxed">
              Closed-loop <strong className="text-purple-300">Greywater Recycling</strong>, 10–15 floor{" "}
              <strong className="text-cyan-300">Dual-Mode Rainwater Harvesting</strong> &amp; Local Waterbody
              Restoration engineered for every future generation.
            </p>

            <div className="grid grid-cols-3 gap-2.5 max-w-lg mx-auto pt-2 text-left">
              <div className="border border-white/15 bg-white/5 px-3 py-2">
                <div className="text-[11px] text-cyan-300">Target Site</div>
                <div className="text-xs font-semibold text-white truncate">{villageName}</div>
              </div>
              <div className="border border-white/15 bg-white/5 px-3 py-2">
                <div className="text-[11px] text-purple-300">Freshwater Cut</div>
                <div className="text-xs font-semibold font-mono tabular-nums text-white">
                  ~{calc.freshwaterDependencyCutPct}% Saved/Yr
                </div>
              </div>
              <div className="border border-white/15 bg-white/5 px-3 py-2">
                <div className="text-[11px] text-emerald-300">Tankers Eliminated</div>
                <div className="text-xs font-semibold font-mono tabular-nums text-white">
                  {calc.tankersSavedYear} Tankers/Yr
                </div>
              </div>
            </div>

            <div className="max-w-md mx-auto pt-2 space-y-2">
              <div className="h-1.5 w-full bg-white/15 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-purple-400 transition-all duration-75"
                  style={{ width: `${introProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-white/70 font-mono tabular-nums">
                <span>Loading High-Rise Hydraulic Blueprint &amp; Calculations…</span>
                <span>{((introProgress / 100) * 3).toFixed(1)}s / 3.0s</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIntro(false)}
              className="mt-2 inline-flex items-center gap-2 border border-cyan-300/50 bg-cyan-400/20 px-4 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-400/30 transition"
            >
              <span>Enter Sub-Portal Now</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="jd-transition-reveal">
          {/* Sub-Portal Top Controls */}
          <div className="border-b border-slate-200 dark:border-white/10 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-emerald-500/10 p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                  Jal-Raksha Sub-Portal · Water Conservation for Future Generations
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  High-Rise Closed-Loop Water Architecture &amp; Local Waterbody Restoration
                </h3>
              </div>

              <button
                type="button"
                onClick={replayIntro}
                className="inline-flex items-center gap-1.5 border border-slate-300 dark:border-white/15 bg-white dark:bg-[#09121e] px-3 py-2 text-xs font-medium text-slate-700 dark:text-white/80 hover:border-cyan-400 transition whitespace-nowrap"
              >
                <Play size={13} className="text-cyan-500" />
                <span>Replay 3s Opening</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("apartment_architecture")}
                className={`flex items-center gap-3 p-3.5 text-left border transition ${
                  activeTab === "apartment_architecture"
                    ? "border-cyan-500 bg-cyan-500/15 dark:bg-cyan-500/20"
                    : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#09121e] hover:border-cyan-400/50"
                }`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-cyan-600 text-white">
                  <Building2 size={22} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    01 · 10–15 Floor Apartment RWH + Greywater Architecture
                  </div>
                  <div className="text-xs text-slate-600 dark:text-white/70 truncate">
                    3-Pipe Vertical Shafts · Basement GWTP · Purple Riser · Live Engineering Math
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("waterbody_revival")}
                className={`flex items-center gap-3 p-3.5 text-left border transition ${
                  activeTab === "waterbody_revival"
                    ? "border-emerald-500 bg-emerald-500/15 dark:bg-emerald-500/20"
                    : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#09121e] hover:border-emerald-400/50"
                }`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-emerald-600 text-white">
                  <Waves size={22} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    02 · Cleaning Local Waterbodies &amp; Apartment Benchmarks
                  </div>
                  <div className="text-xs text-slate-600 dark:text-white/70 truncate">
                    Lakes, Village Ponds, Stepwells · Scale Table (20 to 300+ Flats)
                  </div>
                </div>
              </button>
            </div>
          </div>

          {activeTab === "apartment_architecture" && (
            <div className="p-4 sm:p-5 space-y-6">
              {/* Interactive Architectural Parameter Sliders & Flow Filter */}
              <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#09121e] p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Gauge size={14} className="text-cyan-500" />
                    Configure High-Rise Apartment Scale (Default = 12-Floor Hyderabad Engineering Baseline)
                  </span>

                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: "all", label: "All Loops" },
                        { id: "rwh", label: "Rainwater (RWH)" },
                        { id: "greywater", label: "Greywater Only" },
                        { id: "cloudburst", label: "50mm/hr Cloudburst" },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setFlowMode(m.id)}
                        className={`px-2.5 py-1 text-[11px] font-semibold border transition ${
                          flowMode === m.id
                            ? "border-cyan-500 bg-cyan-600 text-white"
                            : "border-slate-300 dark:border-white/15 bg-white dark:bg-[#050911] text-slate-700 dark:text-white/75"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <label className="block space-y-1">
                    <div className="flex justify-between font-medium text-slate-700 dark:text-white/80">
                      <span>Building Floors</span>
                      <span className="font-mono font-bold tabular-nums text-cyan-600 dark:text-cyan-300">
                        {floors} Floors
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={15}
                      step={1}
                      value={floors}
                      onChange={(e) => setFloors(Number(e.target.value))}
                      className="w-full accent-cyan-600"
                    />
                  </label>

                  <label className="block space-y-1">
                    <div className="flex justify-between font-medium text-slate-700 dark:text-white/80">
                      <span>Flats per Floor</span>
                      <span className="font-mono font-bold tabular-nums text-cyan-600 dark:text-cyan-300">
                        {flatsPerFloor}/floor ({calc.totalFlats} Flats)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={8}
                      step={1}
                      value={flatsPerFloor}
                      onChange={(e) => setFlatsPerFloor(Number(e.target.value))}
                      className="w-full accent-cyan-600"
                    />
                  </label>

                  <label className="block space-y-1">
                    <div className="flex justify-between font-medium text-slate-700 dark:text-white/80">
                      <span>Rooftop Area</span>
                      <span className="font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-300">
                        {rooftopSqm} m²
                      </span>
                    </div>
                    <input
                      type="range"
                      min={600}
                      max={1400}
                      step={50}
                      value={rooftopSqm}
                      onChange={(e) => setRooftopSqm(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </label>

                  <label className="block space-y-1">
                    <div className="flex justify-between font-medium text-slate-700 dark:text-white/80">
                      <span>Annual Rainfall</span>
                      <span className="font-mono font-bold tabular-nums text-purple-600 dark:text-purple-300">
                        {annualRainMm} mm/yr
                      </span>
                    </div>
                    <input
                      type="range"
                      min={500}
                      max={1200}
                      step={50}
                      value={annualRainMm}
                      onChange={(e) => setAnnualRainMm(Number(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <label className="block space-y-1">
                    <div className="flex justify-between font-medium text-slate-700 dark:text-white/80">
                      <span>Podium &amp; Driveway Area</span>
                      <span className="font-mono font-bold tabular-nums">{podiumSqm} m²</span>
                    </div>
                    <input
                      type="range"
                      min={600}
                      max={2000}
                      step={100}
                      value={podiumSqm}
                      onChange={(e) => setPodiumSqm(Number(e.target.value))}
                      className="w-full accent-teal-600"
                    />
                  </label>

                  <label className="block space-y-1">
                    <div className="flex justify-between font-medium text-slate-700 dark:text-white/80">
                      <span>Residents / Flat</span>
                      <span className="font-mono font-bold tabular-nums">
                        {residentsPerFlat} ({calc.totalResidents} Total)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={3.5}
                      max={5.0}
                      step={0.5}
                      value={residentsPerFlat}
                      onChange={(e) => setResidentsPerFlat(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </label>

                  <div className="flex items-center justify-between border border-slate-200 dark:border-white/10 bg-white dark:bg-[#050911] px-3 py-2">
                    <span className="font-medium text-slate-700 dark:text-white/80">
                      Kitchen Drain Stream
                    </span>
                    <button
                      type="button"
                      onClick={() => setIncludeKitchenGreywater((p) => !p)}
                      className={`px-2.5 py-1 text-[11px] font-bold transition ${
                        includeKitchenGreywater
                          ? "bg-amber-600 text-white"
                          : "bg-emerald-600 text-white"
                      }`}
                    >
                      {includeKitchenGreywater ? "Included (95 LPCD)" : "Excluded (80 LPCD Recommended)"}
                    </button>
                  </div>
                </div>
              </div>

              {/* GRAND ANIMATED ARCHITECTURAL CROSS-SECTION DIAGRAM */}
              <div className="border border-cyan-500/30 bg-[#071d33] overflow-hidden jd-keep-dark">
                <canvas ref={archCanvasRef} className="block w-full h-[560px]" />
                {/* Architectural Color Legend */}
                <div className="border-t border-white/15 bg-[#050c17] px-4 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] text-white/85">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 bg-cyan-400 inline-block" /> Rooftop RWH → First-Flush → Fresh Sump
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 bg-blue-500 inline-block" /> Line A Fresh Riser → Baths &amp; Kitchens
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 bg-teal-400 inline-block" /> Raw Greywater Stack → Basement GWTP
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 bg-purple-400 inline-block" /> Line B Purple Flushing OHT + Podium Garden
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 bg-emerald-400 inline-block" /> Polished Surplus + Podium → Granite Borewells
                  </span>
                </div>
              </div>

              {/* Vertical Shafts & Basement GWTP Explanation Strip */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#08101c] p-3.5 space-y-1.5">
                  <div className="font-bold text-cyan-700 dark:text-cyan-300 flex items-center gap-1.5">
                    <Layers size={14} /> 3-Pipe Vertical Shaft System
                  </div>
                  <p className="text-slate-600 dark:text-white/75 leading-relaxed">
                    Every shaft from Floor {floors} to basement separates <strong>Soil Stack</strong> (toilets → sewer/STP),
                    <strong> Waste Stack</strong> (showers/laundry → GWTP), and <strong>Stormwater Downpipes</strong> (roof → silt trap),
                    paired with Fresh (Line A) + Purple Greywater (Line B) risers.
                  </p>
                </div>

                <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#08101c] p-3.5 space-y-1.5">
                  <div className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                    <Recycle size={14} /> Basement MBBR/MBR + UV Plant
                  </div>
                  <p className="text-slate-600 dark:text-white/75 leading-relaxed">
                    Bar Screen &amp; Equalization → MBBR/MBR Bioreactor (eliminates soaps/odors) → Activated Carbon &amp; UV.
                    Treated crystal-clear water feeds Rooftop Flushing OHT across <strong>2 pressure zones (PRVs at Floor 7)</strong>.
                  </p>
                </div>

                <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#08101c] p-3.5 space-y-1.5">
                  <div className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <CloudRain size={14} /> Dual-Mode RWH &amp; Granite Recharge
                  </div>
                  <p className="text-slate-600 dark:text-white/75 leading-relaxed">
                    Clean terrace water fills the <strong>{(calc.freshSumpCapacityL / 1000).toFixed(0)} KL Fresh Sump</strong>;
                    oily podium runoff clears Silt/Oil Traps into <strong>{calc.recommendedRechargeWells} × 25–30m slotted granite recharge wells</strong>
                    handling {(calc.peakCloudburstLph / 1000).toFixed(1)} KL/hr cloudburst surges.
                  </p>
                </div>
              </div>

              {/* COMPLETE ENGINEERING & WATER-SAVING CALCULATIONS UNDER ARCHITECTURE */}
              <div className="border border-emerald-500/30 bg-gradient-to-br from-emerald-50/60 via-white to-cyan-50/60 dark:from-[#081611] dark:via-[#060d17] dark:to-[#071521] p-4 sm:p-5 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      Live Engineering Calculations · {floors} Floors · {calc.totalFlats} Flats · {calc.totalResidents} Residents
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      Annual Water Conservation Summary &amp; Tanker Payback
                    </h4>
                  </div>
                  <span className="bg-emerald-600 text-white px-3 py-1.5 text-xs font-bold font-mono tabular-nums">
                    -{calc.freshwaterDependencyCutPct}% Total Freshwater Dependency
                  </span>
                </div>

                {/* Big 4 Impact Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-slate-900 text-white p-3.5">
                    <div className="text-[11px] text-slate-300">CPHEEO Daily Demand (135 LPCD)</div>
                    <div className="text-xl font-bold font-mono tabular-nums mt-0.5">
                      {calc.totalDailyDemandL.toLocaleString("en-IN")} L/d
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 font-mono tabular-nums">
                      {(calc.annualBaselineDemandL / 1_000_000).toFixed(2)} ML / year baseline
                    </div>
                  </div>

                  <div className="bg-purple-700 text-white p-3.5">
                    <div className="text-[11px] text-purple-100">Net Greywater Regenerated (90%)</div>
                    <div className="text-xl font-bold font-mono tabular-nums mt-0.5">
                      {calc.netRegeneratedL.toLocaleString("en-IN")} L/d
                    </div>
                    <div className="text-[11px] text-purple-100 mt-1 font-mono tabular-nums">
                      100% Flush ({calc.toiletFlushL.toLocaleString("en-IN")} L) + Garden ({calc.landscapingCarWashL.toLocaleString("en-IN")} L)
                    </div>
                  </div>

                  <div className="bg-cyan-700 text-white p-3.5">
                    <div className="text-[11px] text-cyan-100">Total RWH (Roof + Podium)</div>
                    <div className="text-xl font-bold font-mono tabular-nums mt-0.5">
                      {(calc.rooftopRwhYearL + calc.podiumRwhYearL).toLocaleString("en-IN")} L/yr
                    </div>
                    <div className="text-[11px] text-cyan-100 mt-1 font-mono tabular-nums">
                      Roof {(calc.rooftopRwhYearL / 1000).toFixed(0)} KL + Aquifer {(calc.podiumRwhYearL / 1000).toFixed(0)} KL
                    </div>
                  </div>

                  <div className="bg-emerald-700 text-white p-3.5">
                    <div className="text-[11px] text-emerald-100">Tankers &amp; Cash Saved / Year</div>
                    <div className="text-xl font-bold font-mono tabular-nums mt-0.5">
                      ~{calc.tankersSavedYear} Tankers/yr
                    </div>
                    <div className="text-[11px] text-emerald-100 mt-1 font-mono tabular-nums">
                      ₹{calc.annualTankerBillSavedInr.toLocaleString("en-IN")}/yr saved (3–4 yr payback)
                    </div>
                  </div>
                </div>

                {/* Detailed Engineering Ledger Table */}
                <div className="overflow-x-auto border border-slate-200 dark:border-white/10 bg-white dark:bg-[#050911]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/80 font-semibold border-b border-slate-200 dark:border-white/10">
                      <tr>
                        <th className="px-4 py-2.5">Hydraulic Stream &amp; Formula</th>
                        <th className="px-4 py-2.5 text-right">Volume / Year</th>
                        <th className="px-4 py-2.5">Measured Urban Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/10 text-slate-700 dark:text-white/85">
                      <tr>
                        <td className="px-4 py-2.5 font-medium">
                          Baseline Annual Demand ({calc.totalResidents} × 135 LPCD × 365)
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold tabular-nums">
                          {calc.annualBaselineDemandL.toLocaleString("en-IN")} L ({(calc.annualBaselineDemandL / 1_000_000).toFixed(2)} ML)
                        </td>
                        <td className="px-4 py-2.5">100% municipal / borewell tanker load without recycling</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-medium text-purple-700 dark:text-purple-300">
                          Freshwater Saved via Greywater Reuse ({calc.directGreyReuseL.toLocaleString("en-IN")} L/d × 365)
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold tabular-nums text-purple-700 dark:text-purple-300">
                          {calc.annualGreywaterSavedL.toLocaleString("en-IN")} L ({(calc.annualGreywaterSavedL / 1_000_000).toFixed(2)} ML)
                        </td>
                        <td className="px-4 py-2.5">{calc.greywaterOffsetPct}% cut in daily municipal/borewell draw</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-medium text-cyan-700 dark:text-cyan-300">
                          Freshwater Offset via Rooftop RWH ({rooftopSqm}m² × {annualRainMm}mm × 0.85)
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold tabular-nums text-cyan-700 dark:text-cyan-300">
                          {calc.rooftopRwhYearL.toLocaleString("en-IN")} L ({(calc.rooftopRwhYearL / 1_000_000).toFixed(2)} ML)
                        </td>
                        <td className="px-4 py-2.5">{calc.rwhOffsetPct}% direct municipal / tanker offset</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-medium text-teal-700 dark:text-teal-300">
                          Direct Groundwater Recharge (Podium {podiumSqm}m² × 0.65 + Surplus {calc.surplusPolishedGwL} L/d)
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold tabular-nums text-teal-700 dark:text-teal-300">
                          {calc.annualDirectGroundwaterRechargeL.toLocaleString("en-IN")} L ({(calc.annualDirectGroundwaterRechargeL / 1_000_000).toFixed(2)} ML)
                        </td>
                        <td className="px-4 py-2.5">Net positive deep aquifer replenishment + cloudburst flood buffer</td>
                      </tr>
                      <tr className="bg-emerald-500/10 font-bold text-slate-900 dark:text-white">
                        <td className="px-4 py-3">Total Freshwater Dependency Cut (Greywater + Rooftop RWH)</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-300">
                          {calc.totalFreshwaterCutL.toLocaleString("en-IN")} L/yr ({(calc.totalFreshwaterCutL / 1_000_000).toFixed(2)} ML)
                        </td>
                        <td className="px-4 py-3 text-emerald-700 dark:text-emerald-300">
                          ~{calc.freshwaterDependencyCutPct}% total freshwater saved · {calc.recommendedRechargeWells} recharge borewells
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "waterbody_revival" && (
            <div className="p-4 sm:p-5 space-y-6">
              {/* 4-Step Urban & Rural Local Waterbody Cleaning Model */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck size={17} className="text-emerald-500" />
                    <span>4-Stage Local Waterbody Cleaning &amp; Aquifer Sponge Protocol</span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-white/70 mt-0.5">
                    Applies to Hyderabad lakes (Hussainsagar, Durgam Cheruvu, Neknampur), Mission Kakatiya cheruvus, village ponds, stepwells &amp; checkdams.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {LOCAL_WATERBODY_REVIVAL_STEPS.map((item) => (
                    <div
                      key={item.step}
                      className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#050911] p-4 space-y-2"
                    >
                      <div className={`${item.accent} text-white px-2.5 py-1 text-xs font-bold`}>
                        {item.step}
                      </div>
                      <p className="text-xs text-slate-700 dark:text-white/80 leading-relaxed">
                        {item.detail}
                      </p>
                      <div className="pt-2 border-t border-slate-200 dark:border-white/10 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        <span>{item.impact}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PDF Part 1 Estimated Output by Indian Apartment Size Table */}
              <div className="border border-slate-200 dark:border-white/10 bg-white dark:bg-[#050911] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Droplets size={15} className="text-cyan-500" />
                      Standard Greywater Regeneration Benchmarks Across Indian Apartment Scales
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-white/70">
                      Every flat regenerates 320–450 litres of reusable water daily (85–95 LPCD collected × 90–95% net recovery).
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/80 font-semibold border-b border-slate-200 dark:border-white/10">
                      <tr>
                        <th className="px-4 py-2.5">Complex Size</th>
                        <th className="px-4 py-2.5">Approx. Residents</th>
                        <th className="px-4 py-2.5">Raw Greywater Collected</th>
                        <th className="px-4 py-2.5">Reusable Water Regenerated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/10 text-slate-700 dark:text-white/85 font-mono tabular-nums">
                      {APARTMENT_SCALE_BENCHMARKS.map((row) => (
                        <tr key={row.size}>
                          <td className="px-4 py-2.5 font-sans font-semibold">{row.size}</td>
                          <td className="px-4 py-2.5">{row.residents}</td>
                          <td className="px-4 py-2.5">{row.rawCollected}</td>
                          <td className="px-4 py-2.5 font-bold text-emerald-700 dark:text-emerald-300">
                            {row.reusableYield}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
