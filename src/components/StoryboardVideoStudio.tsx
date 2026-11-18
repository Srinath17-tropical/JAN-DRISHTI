import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Film,
  Image as ImageIcon,
  Layers,
  Pause,
  Play,
  RectangleHorizontal,
  RectangleVertical,
  Sparkles,
  Trash2,
  Upload,
  Video,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { LanguageCode } from "../lib/i18n";
import { UI_TRANSLATIONS } from "../lib/i18n";

export type StoryboardVillageInput = {
  villageName: string;
  villageCode: string;
  mandalName: string;
  districtName: string;
  population: number;
  households: number;
  areaSqKm: number;
  overallScore: number;
  vvi: number;
  vviLevel: string;
  geometry?: unknown;
  education: {
    score: number;
    literacyRate: number;
    femaleLiteracyRate: number;
    nearestSchoolKm: number;
    nearestSchoolName: string;
  };
  health: {
    score: number;
    latrinePct: number;
    cleanFuelPct: number;
    nearestHealthKm: number;
    nearestHealthName: string;
  };
  water: {
    score: number;
    tapPct: number;
    tanksTotal: number;
    waterWithinPct: number;
    nearestWaterKm: number;
  };
  livelihood: {
    score: number;
    wpr: number;
    marginalPct: number;
    bankingPct: number;
    nearestHubKm: number;
  };
  environment: {
    score: number;
    solarMj: number;
    biomassPct: number;
    tempC: number;
    pm25: number;
  };
};

type AspectRatioMode = "16:9" | "9:16";
type RenderScope = "documentary" | "single";

type StoryScene = {
  id: string;
  sector: string;
  accent: string;
  title: string;
  kpis: { label: string; value: string; numValue?: number; suffix?: string }[];
  diagnosis: string;
  visualPlan: string[];
  narration: string;
};

type GeneratedVideoArtifact = {
  url: string;
  ext: "mp4" | "webm";
  mimeType: string;
  sizeBytes: number;
  durationSec: number;
  aspectRatio: AspectRatioMode;
  dimensions: string;
  hasAudioTrack: boolean;
};

type CanvasWithCapture = HTMLCanvasElement & {
  captureStream?: (frameRate?: number) => MediaStream;
};

function extractPolygonRings(geometry: unknown): number[][][] {
  if (!geometry || typeof geometry !== "object") return [];
  const g = geometry as { type?: string; coordinates?: unknown };
  if (g.type === "Polygon" && Array.isArray(g.coordinates)) {
    return (g.coordinates as number[][][]).slice(0, 1);
  }
  if (g.type === "MultiPolygon" && Array.isArray(g.coordinates)) {
    const polys = g.coordinates as number[][][][];
    return polys.map((p) => p[0]).filter(Array.isArray);
  }
  return [];
}

function easeOutCubic(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - clamped, 3);
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 4
) {
  const words = text.split(" ");
  let line = "";
  let currY = y;
  let count = 0;
  for (const w of words) {
    const test = line + w + " ";
    if (ctx.measureText(test).width > maxWidth && line) {
      count += 1;
      if (count >= maxLines) {
        ctx.fillText(`${line.trim()}...`, x, currY);
        return;
      }
      ctx.fillText(line.trim(), x, currY);
      line = w + " ";
      currY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line.trim() && count < maxLines) {
    ctx.fillText(line.trim(), x, currY);
  }
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawAnimatedVisualStage(
  ctx: CanvasRenderingContext2D,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  scene: StoryScene,
  village: StoryboardVillageInput,
  progress: number,
  sceneIndex: number,
  uploadedImage: HTMLImageElement | null
) {
  ctx.save();
  drawRoundedRectPath(ctx, boxX, boxY, boxW, boxH, 10);
  ctx.fillStyle = "rgba(8, 14, 26, 0.92)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.clip();

  // Subtle animated blueprint grid
  const gridShift = (progress * 36) % 36;
  ctx.strokeStyle = "rgba(56, 189, 248, 0.06)";
  ctx.lineWidth = 1;
  for (let gx = boxX - 36 + gridShift; gx < boxX + boxW; gx += 36) {
    ctx.beginPath();
    ctx.moveTo(gx, boxY);
    ctx.lineTo(gx, boxY + boxH);
    ctx.stroke();
  }
  for (let gy = boxY; gy < boxY + boxH; gy += 36) {
    ctx.beginPath();
    ctx.moveTo(boxX, gy);
    ctx.lineTo(boxX + boxW, gy);
    ctx.stroke();
  }

  if (uploadedImage && uploadedImage.complete && uploadedImage.naturalWidth > 0) {
    // Ken Burns Cinema Camera Motion over uploaded photo
    const zoom = 1.02 + 0.12 * easeOutCubic(progress);
    const panX = (sceneIndex % 2 === 0 ? -1 : 1) * (progress - 0.5) * 28;
    const panY = (progress - 0.5) * -18;

    const imgAspect = uploadedImage.naturalWidth / uploadedImage.naturalHeight;
    const boxAspect = boxW / boxH;
    let drawW = boxW;
    let drawH = boxH;
    if (imgAspect > boxAspect) {
      drawH = boxH;
      drawW = boxH * imgAspect;
    } else {
      drawW = boxW;
      drawH = boxW / imgAspect;
    }
    drawW *= zoom;
    drawH *= zoom;

    const dx = boxX + (boxW - drawW) / 2 + panX;
    const dy = boxY + (boxH - drawH) / 2 + panY;

    ctx.drawImage(uploadedImage, dx, dy, drawW, drawH);

    // Cinematic bottom & top vignette over photo
    const scrim = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxH);
    scrim.addColorStop(0, "rgba(4,8,14,0.55)");
    scrim.addColorStop(0.35, "rgba(4,8,14,0.10)");
    scrim.addColorStop(0.7, "rgba(4,8,14,0.28)");
    scrim.addColorStop(1, "rgba(4,8,14,0.88)");
    ctx.fillStyle = scrim;
    ctx.fillRect(boxX, boxY, boxW, boxH);

    // Top-left live camera badge
    ctx.fillStyle = "rgba(4,8,14,0.75)";
    ctx.fillRect(boxX + 14, boxY + 14, 178, 26);
    ctx.fillStyle = scene.accent;
    ctx.beginPath();
    ctx.arc(boxX + 27, boxY + 27, 4 + Math.sin(progress * Math.PI * 8) * 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "600 11px monospace";
    ctx.textAlign = "left";
    ctx.fillText("FIELD PHOTO · MOTION", boxX + 38, boxY + 31);
  } else {
    // Animated GIS Settlement Polygon + Orbiting Radar Scan Beam
    const rings = extractPolygonRings(village.geometry);
    const pad = 28;
    const drawAreaW = boxW - pad * 2;
    const drawAreaH = boxH - 110;
    const centerX = boxX + boxW / 2;
    const centerY = boxY + 48 + drawAreaH / 2;

    // Radar range circles
    [0.25, 0.5, 0.78].forEach((frac) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (Math.min(drawAreaW, drawAreaH) / 2) * frac, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Sweep beam
    const angle = progress * Math.PI * 2.4 + sceneIndex * 1.1;
    const beamRadius = Math.min(drawAreaW, drawAreaH) * 0.44;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, beamRadius, angle - 0.55, angle);
    ctx.closePath();
    const beamGrad = ctx.createRadialGradient(centerX, centerY, 4, centerX, centerY, beamRadius);
    beamGrad.addColorStop(0, `${scene.accent}44`);
    beamGrad.addColorStop(1, `${scene.accent}05`);
    ctx.fillStyle = beamGrad;
    ctx.fill();
    ctx.restore();

    if (rings.length > 0 && rings[0].length > 2) {
      let minLon = Infinity,
        maxLon = -Infinity,
        minLat = Infinity,
        maxLat = -Infinity;
      for (const ring of rings) {
        for (const [lon, lat] of ring) {
          if (lon < minLon) minLon = lon;
          if (lon > maxLon) maxLon = lon;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        }
      }
      const spanLon = Math.max(0.001, maxLon - minLon);
      const spanLat = Math.max(0.001, maxLat - minLat);
      const scale = Math.min(drawAreaW / spanLon, drawAreaH / spanLat) * (0.86 + 0.06 * easeOutCubic(progress));

      ctx.save();
      ctx.beginPath();
      for (const ring of rings) {
        ring.forEach(([lon, lat], pIdx) => {
          const px = centerX + (lon - (minLon + maxLon) / 2) * scale;
          const py = centerY + ((minLat + maxLat) / 2 - lat) * scale;
          if (pIdx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
      }
      ctx.fillStyle = `${scene.accent}30`;
      ctx.fill();
      ctx.strokeStyle = scene.accent;
      ctx.lineWidth = 2.6;
      ctx.setLineDash([8, 4]);
      ctx.lineDashOffset = -progress * 90;
      ctx.stroke();
      ctx.restore();
    }

    // Pulsing settlement centroid beacon
    const pulseR = 6 + ((progress * 24) % 18);
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseR, 0, Math.PI * 2);
    ctx.strokeStyle = `${scene.accent}66`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.font = "600 12px monospace";
    ctx.textAlign = "left";
    ctx.fillText("GIS BOUNDARY · RADAR TELEMETRY", boxX + 20, boxY + 28);
  }

  // Bottom HUD strip inside Visual Stage
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 20px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`Composite: ${village.overallScore}/100`, boxX + 20, boxY + boxH - 42);
  ctx.fillStyle = "#fb923c";
  ctx.font = "600 14px monospace";
  ctx.fillText(
    `VVI Risk: ${village.vvi} (${village.vviLevel}) · ${village.areaSqKm} km²`,
    boxX + 20,
    boxY + boxH - 18
  );

  ctx.restore();
}

function drawMotionFrame(
  ctx: CanvasRenderingContext2D,
  scene: StoryScene,
  village: StoryboardVillageInput,
  sceneIndex: number,
  totalScenes: number,
  sceneProgress: number,
  aspectRatio: AspectRatioMode,
  uploadedImage: HTMLImageElement | null,
  customCaption: string
) {
  const isPortrait = aspectRatio === "9:16";
  const W = isPortrait ? 720 : 1280;
  const H = isPortrait ? 1280 : 720;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#04080f");
  grad.addColorStop(0.55, "#091326");
  grad.addColorStop(1, "#050a14");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Moving subtle Viksit Bharat @2047 watermark
  ctx.save();
  ctx.font = isPortrait ? "700 58px sans-serif" : "700 96px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.032)";
  ctx.textAlign = "center";
  const driftX = (sceneProgress - 0.5) * 32;
  ctx.fillText("VIKSIT BHARAT @2047", W / 2 + driftX, isPortrait ? H * 0.56 : H * 0.54);
  ctx.restore();

  // Animated top tricolor accent bar
  const third = W / 3;
  ctx.fillStyle = "#ff9933";
  ctx.fillRect(0, 0, third, 6);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(third, 0, third, 6);
  ctx.fillStyle = "#10b981";
  ctx.fillRect(third * 2, 0, third + 2, 6);

  const margin = isPortrait ? 34 : 52;

  // Eyebrow badge
  ctx.fillStyle = scene.accent;
  ctx.font = isPortrait ? "700 14px monospace" : "700 15px monospace";
  ctx.textAlign = "left";
  ctx.fillText(
    `JAN—DRISHTI TELANGANA  ·  SCENE 0${sceneIndex + 1}/0${totalScenes}  ·  ${scene.sector.toUpperCase()}`,
    margin,
    isPortrait ? 44 : 46
  );

  // Village Title
  ctx.fillStyle = "#ffffff";
  ctx.font = isPortrait ? "700 28px sans-serif" : "700 35px sans-serif";
  ctx.fillText(
    `${village.villageName} · ${village.mandalName} (${village.districtName})`,
    margin,
    isPortrait ? 84 : 92
  );

  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font = isPortrait ? "500 16px sans-serif" : "500 20px sans-serif";
  ctx.fillText(scene.title, margin, isPortrait ? 114 : 126);

  // Animated KPI Count-up Cards
  const countEase = easeOutCubic(Math.min(1, sceneProgress * 1.45));
  const kpiCount = scene.kpis.length;
  const kpiY = isPortrait ? 138 : 154;
  const kpiGap = 14;
  const kpiAreaW = isPortrait ? W - margin * 2 : 736;
  const kpiW = (kpiAreaW - kpiGap * (kpiCount - 1)) / kpiCount;
  const kpiH = isPortrait ? 92 : 100;

  scene.kpis.forEach((kpi, idx) => {
    const x = margin + idx * (kpiW + kpiGap);
    ctx.fillStyle = "rgba(255,255,255,0.045)";
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 1.2;
    ctx.fillRect(x, kpiY, kpiW, kpiH);
    ctx.strokeRect(x, kpiY, kpiW, kpiH);

    // Animated left border fill
    ctx.fillStyle = scene.accent;
    ctx.fillRect(x, kpiY, kpiW * countEase, 3.5);

    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = isPortrait ? "500 13px sans-serif" : "500 14px sans-serif";
    ctx.fillText(kpi.label, x + 14, kpiY + 30);

    let displayVal = kpi.value;
    if (typeof kpi.numValue === "number") {
      const val = kpi.numValue * countEase;
      const formatted =
        kpi.numValue >= 100
          ? Math.round(val).toLocaleString()
          : Number.isInteger(kpi.numValue)
          ? String(Math.round(val))
          : val.toFixed(1);
      displayVal = `${formatted}${kpi.suffix ?? ""}`;
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = isPortrait ? "700 24px monospace" : "700 28px monospace";
    ctx.fillText(displayVal, x + 14, kpiY + 72);
  });

  if (isPortrait) {
    // Portrait layout (9:16): Visual Stage in middle, Diagnosis + Action Plan below
    drawAnimatedVisualStage(
      ctx,
      margin,
      252,
      W - margin * 2,
      440,
      scene,
      village,
      sceneProgress,
      sceneIndex,
      uploadedImage
    );

    const panelY = 716;
    const panelH = 472;
    ctx.fillStyle = "rgba(255,255,255,0.035)";
    ctx.strokeStyle = "rgba(255,255,255,0.13)";
    ctx.fillRect(margin, panelY, W - margin * 2, panelH);
    ctx.strokeRect(margin, panelY, W - margin * 2, panelH);

    ctx.fillStyle = scene.accent;
    ctx.font = "700 13px monospace";
    ctx.fillText("OBSERVED EVIDENCE", margin + 20, panelY + 34);

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "400 17px sans-serif";
    wrapCanvasText(ctx, customCaption.trim() || scene.diagnosis, margin + 20, panelY + 64, W - margin * 2 - 40, 25, 4);

    ctx.fillStyle = "#34d399";
    ctx.font = "700 13px monospace";
    ctx.fillText("ACTIONABLE SOLUTIONS", margin + 20, panelY + 196);

    scene.visualPlan.forEach((step, idx) => {
      const reveal = Math.max(0, Math.min(1, (sceneProgress - idx * 0.14) * 3.5));
      const slideX = (1 - easeOutCubic(reveal)) * 20;
      const stepY = panelY + 230 + idx * 72;
      ctx.fillStyle = `rgba(255,255,255,${0.2 + 0.78 * reveal})`;
      ctx.font = "500 16px sans-serif";
      wrapCanvasText(ctx, `${idx + 1}. ${step}`, margin + 20 + slideX, stepY, W - margin * 2 - 40, 23, 2);
    });
  } else {
    // Landscape layout (16:9): Evidence & Plan on Left, Visual Stage on Right
    const leftW = 736;
    const panelY = 276;
    const panelH = 358;

    ctx.fillStyle = "rgba(255,255,255,0.035)";
    ctx.strokeStyle = "rgba(255,255,255,0.13)";
    ctx.fillRect(margin, panelY, leftW, panelH);
    ctx.strokeRect(margin, panelY, leftW, panelH);

    ctx.fillStyle = scene.accent;
    ctx.font = "700 14px monospace";
    ctx.fillText("OBSERVED VILLAGE EVIDENCE", margin + 24, panelY + 36);

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "400 17px sans-serif";
    wrapCanvasText(ctx, customCaption.trim() || scene.diagnosis, margin + 24, panelY + 68, leftW - 48, 25, 3);

    ctx.fillStyle = "#34d399";
    ctx.font = "700 14px monospace";
    ctx.fillText("ACTIONABLE GRAM PANCHAYAT SOLUTION PLAN", margin + 24, panelY + 168);

    scene.visualPlan.forEach((step, idx) => {
      const reveal = Math.max(0, Math.min(1, (sceneProgress - idx * 0.16) * 3.5));
      const slideX = (1 - easeOutCubic(reveal)) * 22;
      const stepY = panelY + 204 + idx * 46;
      ctx.fillStyle = `rgba(255,255,255,${0.25 + 0.75 * reveal})`;
      ctx.font = "500 16px sans-serif";
      ctx.fillText(`${idx + 1}. ${step}`, margin + 24 + slideX, stepY);
    });

    drawAnimatedVisualStage(
      ctx,
      margin + leftW + 24,
      154,
      W - (margin * 2 + leftW + 24),
      480,
      scene,
      village,
      sceneProgress,
      sceneIndex,
      uploadedImage
    );
  }

  // Bottom cinema timeline & ticker
  const barY = H - 52;
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(margin, barY, W - margin * 2, 7);
  const overallProgress = (sceneIndex + sceneProgress) / Math.max(1, totalScenes);
  ctx.fillStyle = scene.accent;
  ctx.fillRect(margin, barY, (W - margin * 2) * overallProgress, 7);

  ctx.fillStyle = "rgba(255,255,255,0.52)";
  ctx.font = "500 12px monospace";
  ctx.textAlign = "left";
  ctx.fillText(
    "JAN—DRISHTI MOTION ENGINE · EVIDENCE-LOCKED AUDIOVISUAL BRIEF",
    margin,
    H - 22
  );
  ctx.textAlign = "right";
  ctx.fillText(
    `${aspectRatio} · ${Math.round(overallProgress * 100)}%`,
    W - margin,
    H - 22
  );
  ctx.textAlign = "left";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function StoryboardVideoStudio({
  lang,
  village,
  focusSector = "overview",
}: {
  lang: LanguageCode;
  village: StoryboardVillageInput | null;
  focusSector?: string;
}) {
  const t = UI_TRANSLATIONS[lang];
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [sceneProgress, setSceneProgress] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // Studio controls
  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>("16:9");
  const [renderScope, setRenderScope] = useState<RenderScope>("documentary");
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [uploadedPhotoName, setUploadedPhotoName] = useState<string>("");
  const [customCaption, setCustomCaption] = useState<string>("");
  const [includeAudioTrack, setIncludeAudioTrack] = useState<boolean>(true);

  // Video encoding & playback state
  const [renderingVideo, setRenderingVideo] = useState(false);
  const [renderPct, setRenderPct] = useState(0);
  const [studioStatus, setStudioStatus] = useState<string>("");
  const [studioError, setStudioError] = useState<string>("");
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideoArtifact | null>(null);
  const [viewMode, setViewMode] = useState<"canvas" | "video">("canvas");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const uploadedImgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cancelRenderRef = useRef(false);

  const canvasWidth = aspectRatio === "16:9" ? 1280 : 720;
  const canvasHeight = aspectRatio === "16:9" ? 720 : 1280;

  const scenes: StoryScene[] = useMemo(() => {
    if (!village) return [];
    return [
      {
        id: "overview",
        sector: "Composite Overview",
        accent: "#ff9933",
        title: "Settlement Vulnerability Profile & Non-Compensatory Baseline",
        kpis: [
          { label: "Population", value: village.population.toLocaleString(), numValue: village.population },
          { label: "JAN-DRISHTI", value: `${village.overallScore}/100`, numValue: village.overallScore, suffix: "/100" },
          { label: "VVI Risk", value: `${village.vvi}`, numValue: village.vvi },
        ],
        diagnosis: `${village.villageName} houses ${village.households.toLocaleString()} households over ${village.areaSqKm} km². Its non-compensatory index prevents strong sectors from hiding critical local deficits.`,
        visualPlan: [
          "Audit Gram Sabha priority roster against non-compensatory sector gaps",
          "Converge Mandal & District schemes across lagging SDGs first",
          "Track quarterly household saturation transparently via GPDP",
        ],
        narration: `Village briefing for ${village.villageName}, ${village.mandalName} Mandal, ${village.districtName}. Population is ${village.population}, and overall development score is ${village.overallScore} out of 100.`,
      },
      {
        id: "education",
        sector: "Education · SDG 04",
        accent: "#ef4444",
        title: "Literacy Gap, Female Transition & Institutional School Reach",
        kpis: [
          { label: "Edu Score", value: `${village.education.score}/100`, numValue: village.education.score, suffix: "/100" },
          { label: "Literacy", value: `${village.education.literacyRate}%`, numValue: village.education.literacyRate, suffix: "%" },
          { label: "Nearest School", value: `${village.education.nearestSchoolKm} km`, numValue: village.education.nearestSchoolKm, suffix: " km" },
        ],
        diagnosis: `Female literacy stands at ${village.education.femaleLiteracyRate}% against ${village.education.literacyRate}% overall. Nearest institution (${village.education.nearestSchoolName}) is ${village.education.nearestSchoolKm} km away.`,
        visualPlan: [
          "Launch Gram Panchayat digital library & evening bridge-learning for girls",
          "Coordinate Mana Ooru–Mana Badi WASH toilets & smart classrooms",
          "Link rural high schools with Telangana Universities & polytechnic skills",
        ],
        narration: `In Education, literacy is ${village.education.literacyRate} percent, female literacy is ${village.education.femaleLiteracyRate} percent, and nearest school distance is ${village.education.nearestSchoolKm} kilometers.`,
      },
      {
        id: "water",
        sector: "Water & Groundwater · SDG 06",
        accent: "#06b6d4",
        title: "Drinking Tap Reach, Surface Tanks & Aquifer Recharge Blueprint",
        kpis: [
          { label: "Water Score", value: `${village.water.score}/100`, numValue: village.water.score, suffix: "/100" },
          { label: "Tap Coverage", value: `${village.water.tapPct}%`, numValue: village.water.tapPct, suffix: "%" },
          { label: "TRACGIS Tanks", value: `${village.water.tanksTotal}`, numValue: village.water.tanksTotal },
        ],
        diagnosis: `Tap water reaches ${village.water.tapPct}% of households (${village.water.waterWithinPct}% in-premises), backed by ${village.water.tanksTotal} minor irrigation tanks inside settlement boundaries.`,
        visualPlan: [
          "Step 1: Desilt & strengthen bunds of village Kakatiya chain-tanks",
          "Step 2: Install percolation recharge pits near depleted agricultural borewells",
          "Step 3: Audit Mission Bhagiratha tail-end pressure for 55 LPCD supply",
        ],
        narration: `Water security score is ${village.water.score}, with ${village.water.tapPct} percent tap access and ${village.water.tanksTotal} minor irrigation tanks available for groundwater recharge.`,
      },
      {
        id: "health",
        sector: "Health & Sanitation · SDG 03",
        accent: "#10b981",
        title: "Sanitation Saturation, Indoor Smoke & Preventive Disease Shield",
        kpis: [
          { label: "Health Score", value: `${village.health.score}/100`, numValue: village.health.score, suffix: "/100" },
          { label: "Latrine Reach", value: `${village.health.latrinePct}%`, numValue: village.health.latrinePct, suffix: "%" },
          { label: "Nearest Clinic", value: `${village.health.nearestHealthKm} km`, numValue: village.health.nearestHealthKm, suffix: " km" },
        ],
        diagnosis: `In-premises sanitation is ${village.health.latrinePct}% and clean cooking fuel is ${village.health.cleanFuelPct}%, with nearest medical care (${village.health.nearestHealthName}) at ${village.health.nearestHealthKm} km.`,
        visualPlan: [
          "Run pre-monsoon vector fogging & tap chlorination in high-risk wards",
          "Close IHHL & greywater soak-pit gaps under Swachh Bharat Phase II",
          "Connect village ANM roster to Palle Dawakhana & Aarogyasri referrals",
        ],
        narration: `Health score is ${village.health.score}. Latrine coverage is ${village.health.latrinePct} percent and nearest healthcare facility is ${village.health.nearestHealthKm} kilometers away.`,
      },
      {
        id: "environment",
        sector: "Environment & Waterbodies · SDG 13",
        accent: "#84cc16",
        title: "Waterbody Revival, Biomass Reduction & Solar Transition",
        kpis: [
          { label: "Env Score", value: `${village.environment.score}/100`, numValue: village.environment.score, suffix: "/100" },
          { label: "Solar Potential", value: `${village.environment.solarMj} MJ`, numValue: village.environment.solarMj, suffix: " MJ" },
          { label: "Ambient PM2.5", value: `${village.environment.pm25} µg`, numValue: village.environment.pm25, suffix: " µg" },
        ],
        diagnosis: `${village.environment.biomassPct}% solid biomass pressure and PM2.5 at ${village.environment.pm25} µg/m³ contrast with strong ${village.environment.solarMj} MJ/m²/day solar radiation.`,
        visualPlan: [
          "Protect tank foreshores & construct greywater reed-bed wetlands",
          "Expand PM Ujjwala clean-cooking refills to eliminate indoor PM2.5",
          "Deploy PM-KUSUM solar agri feeders & Gram Panchayat rooftop solar",
        ],
        narration: `Environment score is ${village.environment.score} with ${village.environment.solarMj} megajoules per square meter solar potential and ${village.environment.biomassPct} percent biomass fuel reliance.`,
      },
      {
        id: "livelihood",
        sector: "Livelihood & Macro Value · SDG 08",
        accent: "#ec4899",
        title: "Off-Season Income Stability, SHG Credit & Cold-Chain FPOs",
        kpis: [
          { label: "Liv Score", value: `${village.livelihood.score}/100`, numValue: village.livelihood.score, suffix: "/100" },
          { label: "Banking", value: `${village.livelihood.bankingPct}%`, numValue: village.livelihood.bankingPct, suffix: "%" },
          { label: "Marginal Work", value: `${village.livelihood.marginalPct}%`, numValue: village.livelihood.marginalPct, suffix: "%" },
        ],
        diagnosis: `${village.livelihood.marginalPct}% of workers hold seasonal under-6-month employment while ${village.livelihood.bankingPct}% access formal banking.`,
        visualPlan: [
          "Schedule MGNREGA tank-desiltation works during non-kharif dry months",
          "Link women self-help groups via SERP Stree Nidhi micro-enterprise credit",
          "Build cluster solar cold-storage & FPO grading to cut food inflation",
        ],
        narration: `Livelihood score is ${village.livelihood.score}, with ${village.livelihood.bankingPct} percent banking access and ${village.livelihood.marginalPct} percent marginal workers.`,
      },
    ];
  }, [village]);

  useEffect(() => {
    const idx = scenes.findIndex((s) => s.id === focusSector);
    if (idx >= 0) setActiveSceneIdx(idx);
  }, [focusSector, scenes]);

  // Revoke previous video Blob URL when replaced or unmounted
  useEffect(() => {
    return () => {
      if (generatedVideo?.url) {
        URL.revokeObjectURL(generatedVideo.url);
      }
    };
  }, [generatedVideo]);

  // Load uploaded image into Image object for canvas compositing
  useEffect(() => {
    if (!uploadedPhotoUrl) {
      uploadedImgRef.current = null;
      return;
    }
    const img = new Image();
    img.onload = () => {
      uploadedImgRef.current = img;
      // Redraw immediate frame
      if (canvasRef.current && village && scenes.length > 0 && !renderingVideo) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          const scene = scenes[activeSceneIdx] ?? scenes[0];
          drawMotionFrame(
            ctx,
            scene,
            village,
            activeSceneIdx,
            scenes.length,
            sceneProgress,
            aspectRatio,
            img,
            customCaption
          );
        }
      }
    };
    img.src = uploadedPhotoUrl;
    return () => {
      URL.revokeObjectURL(uploadedPhotoUrl);
    };
  }, [uploadedPhotoUrl]);

  // Redraw canvas cleanly on idle state changes
  useEffect(() => {
    if (!canvasRef.current || !village || scenes.length === 0 || renderingVideo) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const scene = scenes[activeSceneIdx] ?? scenes[0];
    drawMotionFrame(
      ctx,
      scene,
      village,
      activeSceneIdx,
      scenes.length,
      sceneProgress,
      aspectRatio,
      uploadedImgRef.current,
      customCaption
    );
  }, [activeSceneIdx, sceneProgress, scenes, village, aspectRatio, customCaption, renderingVideo]);

  // Smooth 60fps real-time requestAnimationFrame preview playback + Web Speech voiceover
  useEffect(() => {
    if (!playing || renderingVideo || scenes.length === 0 || !village) return;
    setViewMode("canvas");

    const current = scenes[activeSceneIdx];
    if (voiceEnabled && typeof window !== "undefined" && "speechSynthesis" in window && current) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(current.narration);
      utter.lang = lang === "hi" ? "hi-IN" : lang === "te" ? "te-IN" : "en-IN";
      utter.rate = 0.98;
      window.speechSynthesis.speak(utter);
    }

    const durationMs = 4200;
    const startTs = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - startTs;
      const frac = Math.min(1, elapsed / durationMs);
      setSceneProgress(frac);

      if (frac < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setActiveSceneIdx((prev) => {
          if (prev + 1 >= scenes.length) {
            setPlaying(false);
            setSceneProgress(1);
            return 0;
          }
          setSceneProgress(0);
          return prev + 1;
        });
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [playing, activeSceneIdx, renderingVideo, scenes, village, voiceEnabled, lang]);

  function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStudioError("Please select a PNG, JPEG, or WebP photo file.");
      return;
    }
    setStudioError("");
    const objUrl = URL.createObjectURL(file);
    setUploadedPhotoUrl(objUrl);
    setUploadedPhotoName(file.name);
    setViewMode("canvas");
    setStudioStatus(`Loaded photo "${file.name}" for Ken Burns video animation.`);
  }

  function handleDownloadPng() {
    if (!canvasRef.current || !village) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `JAN-DRISHTI-${village.villageName.replace(/\s+/g, "_")}-Scene${activeSceneIdx + 1}-${aspectRatio.replace(":", "x")}.png`;
    a.click();
    setStudioStatus(`Saved ${canvasWidth}×${canvasHeight} PNG poster.`);
  }

  async function handleRenderVideo() {
    if (!canvasRef.current || !village || scenes.length === 0) return;

    const canvasEl = canvasRef.current as CanvasWithCapture;
    if (typeof MediaRecorder === "undefined" || typeof canvasEl.captureStream !== "function") {
      setStudioError("Video encoding requires a modern Chromium, Edge, or Firefox browser with MediaRecorder.");
      return;
    }

    setPlaying(false);
    setViewMode("canvas");
    setStudioError("");
    setRenderingVideo(true);
    setRenderPct(0);
    cancelRenderRef.current = false;

    const targetScenes =
      renderScope === "single"
        ? [{ scene: scenes[activeSceneIdx] ?? scenes[0], originalIndex: activeSceneIdx }]
        : scenes.map((scene, originalIndex) => ({ scene, originalIndex }));

    const fps = 30;
    const msPerScene = renderScope === "single" ? 5000 : 3000;
    const totalMs = targetScenes.length * msPerScene;
    const totalDurationSec = Number((totalMs / 1000).toFixed(1));

    setStudioStatus(
      `Encoding ${totalDurationSec}s ${aspectRatio} (${canvasWidth}×${canvasHeight} @ 30fps) audiovisual documentary...`
    );

    let audioCtx: AudioContext | null = null;
    let combinedStream: MediaStream | null = null;
    let hasAudioTrack = false;

    try {
      const videoStream = canvasEl.captureStream(fps);
      const tracks: MediaStreamTrack[] = [...videoStream.getVideoTracks()];

      // Mux clean Web Audio harmonic pad + scene transition chimes into video track
      if (includeAudioTrack) {
        try {
          const AudioCtxCtor =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (AudioCtxCtor) {
            audioCtx = new AudioCtxCtor();
            const dest = audioCtx.createMediaStreamDestination();
            const masterGain = audioCtx.createGain();
            masterGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            masterGain.connect(dest);

            // Warm subtle harmonic drone (C3 + G3 + E4 triangle/sine)
            const freqs = [130.81, 196.0, 329.63];
            freqs.forEach((f, idx) => {
              if (!audioCtx) return;
              const osc = audioCtx.createOscillator();
              const oscGain = audioCtx.createGain();
              osc.type = idx === 0 ? "sine" : "triangle";
              osc.frequency.setValueAtTime(f, audioCtx.currentTime);
              oscGain.gain.setValueAtTime(idx === 0 ? 0.35 : 0.14, audioCtx.currentTime);
              osc.connect(oscGain);
              oscGain.connect(masterGain);
              osc.start();
              osc.stop(audioCtx.currentTime + totalDurationSec + 0.5);
            });

            // Gentle scene change chime markers
            targetScenes.forEach((_, idx) => {
              if (!audioCtx) return;
              const tStart = audioCtx.currentTime + (idx * msPerScene) / 1000;
              const chime = audioCtx.createOscillator();
              const chimeGain = audioCtx.createGain();
              chime.type = "sine";
              chime.frequency.setValueAtTime(523.25 + idx * 44, tStart);
              chimeGain.gain.setValueAtTime(0.001, tStart);
              chimeGain.gain.exponentialRampToValueAtTime(0.18, tStart + 0.04);
              chimeGain.gain.exponentialRampToValueAtTime(0.001, tStart + 0.45);
              chime.connect(chimeGain);
              chimeGain.connect(masterGain);
              chime.start(tStart);
              chime.stop(tStart + 0.5);
            });

            const audioTracks = dest.stream.getAudioTracks();
            if (audioTracks.length > 0) {
              tracks.push(...audioTracks);
              hasAudioTrack = true;
            }
          }
        } catch {
          // Proceed video-only if AudioContext is blocked
          hasAudioTrack = false;
        }
      }

      combinedStream = new MediaStream(tracks);

      const candidateMimes: { mime: string; ext: "mp4" | "webm" }[] = [
        { mime: "video/mp4;codecs=avc1,mp4a.40.2", ext: "mp4" },
        { mime: "video/mp4", ext: "mp4" },
        { mime: "video/webm;codecs=vp9,opus", ext: "webm" },
        { mime: "video/webm;codecs=vp8,opus", ext: "webm" },
        { mime: "video/webm;codecs=vp9", ext: "webm" },
        { mime: "video/webm", ext: "webm" },
      ];

      const chosen =
        candidateMimes.find((c) => MediaRecorder.isTypeSupported(c.mime)) ?? {
          mime: "video/webm",
          ext: "webm" as const,
        };

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: chosen.mime,
        videoBitsPerSecond: 4_500_000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };

      const finishedPromise = new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: chosen.mime }));
        recorder.onerror = () => reject(new Error("MediaRecorder encoding failed."));
      });

      const ctx = canvasEl.getContext("2d")!;
      recorder.start(250);

      const frameIntervalMs = 1000 / fps;
      const startTime = performance.now();

      for (let i = 0; i < targetScenes.length; i++) {
        if (cancelRenderRef.current) break;
        const { scene, originalIndex } = targetScenes[i];
        setActiveSceneIdx(originalIndex);
        const sceneStart = performance.now();

        while (!cancelRenderRef.current) {
          const elapsedScene = performance.now() - sceneStart;
          const frac = Math.min(1, elapsedScene / msPerScene);
          setSceneProgress(frac);

          drawMotionFrame(
            ctx,
            scene,
            village,
            originalIndex,
            scenes.length,
            frac,
            aspectRatio,
            uploadedImgRef.current,
            customCaption
          );

          // Subtle cross-fade transition wipe during last 280ms between scenes
          if (i < targetScenes.length - 1 && elapsedScene > msPerScene - 280) {
            const fadeAlpha = ((elapsedScene - (msPerScene - 280)) / 280) * 0.65;
            ctx.fillStyle = `rgba(4, 8, 15, ${Math.min(0.65, Math.max(0, fadeAlpha))})`;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          }

          const globalPct = Math.min(
            99,
            Math.round(((performance.now() - startTime) / totalMs) * 100)
          );
          setRenderPct(globalPct);

          if (frac >= 1) break;
          await new Promise((r) => setTimeout(r, frameIntervalMs));
        }
      }

      if (recorder.state !== "inactive") {
        recorder.stop();
      }

      const blob = await finishedPromise;
      if (cancelRenderRef.current) {
        setStudioStatus("Video render cancelled.");
        return;
      }

      const videoUrl = URL.createObjectURL(blob);
      setRenderPct(100);
      setGeneratedVideo({
        url: videoUrl,
        ext: chosen.ext,
        mimeType: chosen.mime,
        sizeBytes: blob.size,
        durationSec: totalDurationSec,
        aspectRatio,
        dimensions: `${canvasWidth}×${canvasHeight}`,
        hasAudioTrack,
      });
      setViewMode("video");
      setStudioStatus(
        `Ready! ${totalDurationSec}s ${chosen.ext.toUpperCase()} video rendered (${formatBytes(blob.size)}) — playing in studio.`
      );
    } catch (err) {
      setStudioError(
        err instanceof Error
          ? err.message
          : "Could not encode video in this browser. PNG poster export remains available."
      );
    } finally {
      if (combinedStream) {
        combinedStream.getTracks().forEach((tr) => tr.stop());
      }
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
      setRenderingVideo(false);
    }
  }

  function handleDownloadVideoFile() {
    if (!generatedVideo || !village) return;
    const a = document.createElement("a");
    a.href = generatedVideo.url;
    a.download = `JAN-DRISHTI-${village.villageName.replace(/\s+/g, "_")}-${generatedVideo.aspectRatio.replace(":", "x")}.${generatedVideo.ext}`;
    a.click();
  }

  if (!village) {
    return (
      <div className="border border-slate-200 dark:border-white/12 bg-white dark:bg-[#070b12] p-6 text-xs text-slate-600 dark:text-white/60">
        Select any Telangana village to render an animated audiovisual Video Documentary, animate uploaded field photos, or export a high-resolution Storyboard PNG.
      </div>
    );
  }

  const activeScene = scenes[activeSceneIdx] ?? scenes[0];

  return (
    <div className="border border-slate-200 dark:border-white/12 bg-white dark:bg-[#070b12] p-6 space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
        <div>
          <div className="text-xs font-semibold text-cyan-600 dark:text-cyan-300 flex items-center gap-2">
            <Film size={14} />
            <span>{t.storyboardTitle}</span>
          </div>
          <p className="mt-1 text-xs text-slate-600 dark:text-white/60">{t.storyboardSub}</p>
        </div>

        {/* View Mode Switcher (Canvas Animator vs Rendered Video Player) */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {generatedVideo && (
            <div className="inline-flex border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-white/[0.03] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("video")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition ${
                  viewMode === "video"
                    ? "bg-cyan-600 text-white"
                    : "text-slate-700 dark:text-white/75 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Video size={13} />
                <span>Rendered Video Player</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("canvas")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition ${
                  viewMode === "canvas"
                    ? "bg-orange-600 text-white"
                    : "text-slate-700 dark:text-white/75 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Layers size={13} />
                <span>Motion Composer</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleRenderVideo}
            disabled={renderingVideo}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white transition whitespace-nowrap"
          >
            <Sparkles size={13} />
            <span>
              {renderingVideo
                ? `Rendering Video (${renderPct}%)`
                : generatedVideo
                ? "Re-Render Video"
                : t.exportVideo}
            </span>
          </button>
        </div>
      </div>

      {/* Studio Control Toolbar: Photo Upload, Aspect Ratio, Scope, Audio & Quick Export */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 bg-slate-50 dark:bg-white/[0.025] border border-slate-200 dark:border-white/10 p-3.5">
        {/* 1. Photo Upload for Ken Burns Video Animation */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">
            1. Photo Overlay (Optional)
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-white/15 bg-white dark:bg-white/[0.04] text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition truncate"
            >
              <Upload size={13} className="text-orange-500 shrink-0" />
              <span className="truncate">
                {uploadedPhotoName ? uploadedPhotoName : "Upload Field Photo"}
              </span>
            </button>
            {uploadedPhotoUrl && (
              <button
                type="button"
                title="Remove uploaded photo"
                onClick={() => {
                  setUploadedPhotoUrl(null);
                  setUploadedPhotoName("");
                  uploadedImgRef.current = null;
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="p-1.5 border border-rose-300 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* 2. Aspect Ratio */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">
            2. Video Aspect Ratio
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              disabled={renderingVideo}
              onClick={() => setAspectRatio("16:9")}
              className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border transition ${
                aspectRatio === "16:9"
                  ? "border-cyan-500 bg-cyan-500/15 text-cyan-800 dark:text-cyan-200"
                  : "border-slate-300 dark:border-white/15 bg-white dark:bg-white/[0.03] text-slate-700 dark:text-white/70"
              }`}
            >
              <RectangleHorizontal size={13} />
              <span>16:9 HD</span>
            </button>
            <button
              type="button"
              disabled={renderingVideo}
              onClick={() => setAspectRatio("9:16")}
              className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border transition ${
                aspectRatio === "9:16"
                  ? "border-cyan-500 bg-cyan-500/15 text-cyan-800 dark:text-cyan-200"
                  : "border-slate-300 dark:border-white/15 bg-white dark:bg-white/[0.03] text-slate-700 dark:text-white/70"
              }`}
            >
              <RectangleVertical size={13} />
              <span>9:16 Reels</span>
            </button>
          </div>
        </div>

        {/* 3. Video Scope + Audio Track */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">
            3. Documentary Scope
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              disabled={renderingVideo}
              onClick={() => setRenderScope("documentary")}
              className={`px-2 py-1.5 text-xs font-medium border transition truncate ${
                renderScope === "documentary"
                  ? "border-orange-500 bg-orange-500/15 text-orange-800 dark:text-orange-200"
                  : "border-slate-300 dark:border-white/15 bg-white dark:bg-white/[0.03] text-slate-700 dark:text-white/70"
              }`}
            >
              6-Scene (18s)
            </button>
            <button
              type="button"
              disabled={renderingVideo}
              onClick={() => setRenderScope("single")}
              className={`px-2 py-1.5 text-xs font-medium border transition truncate ${
                renderScope === "single"
                  ? "border-orange-500 bg-orange-500/15 text-orange-800 dark:text-orange-200"
                  : "border-slate-300 dark:border-white/15 bg-white dark:bg-white/[0.03] text-slate-700 dark:text-white/70"
              }`}
            >
              Focus Clip (5s)
            </button>
          </div>
        </div>

        {/* 4. Quick Preview, Sound & PNG Export */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">
            4. Live Controls & Export
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={renderingVideo}
              onClick={() => {
                if (playing && typeof window !== "undefined" && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                }
                setSceneProgress(0);
                setPlaying((p) => !p);
              }}
              className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white transition"
            >
              {playing ? <Pause size={12} /> : <Play size={12} />}
              <span>{playing ? "Pause" : "Preview"}</span>
            </button>

            <button
              type="button"
              title="Toggle Voiceover & Ambient Sound"
              onClick={() => {
                if (voiceEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                }
                setVoiceEnabled((v) => !v);
                setIncludeAudioTrack((a) => !a);
              }}
              className={`p-1.5 border transition ${
                voiceEnabled || includeAudioTrack
                  ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  : "border-slate-300 dark:border-white/15 text-slate-700 dark:text-white/75"
              }`}
            >
              {voiceEnabled || includeAudioTrack ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>

            <button
              type="button"
              title={t.downloadPng}
              onClick={handleDownloadPng}
              className="p-1.5 border border-slate-300 dark:border-white/15 bg-white dark:bg-white/[0.04] text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08]"
            >
              <ImageIcon size={14} className="text-cyan-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Optional Custom Caption Input */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50 shrink-0">
          Custom Overlay Note:
        </label>
        <input
          type="text"
          value={customCaption}
          onChange={(e) => setCustomCaption(e.target.value)}
          placeholder={`Optional custom commentary on ${village.villageName} (leave blank for automated village data insight)...`}
          className="flex-1 px-3 py-1.5 text-xs border border-slate-300 dark:border-white/15 bg-white dark:bg-white/[0.03] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/35 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {studioError && (
        <div className="border border-rose-400/50 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-700 dark:text-rose-300">
          {studioError}
        </div>
      )}

      {/* Main Stage + 6-Scene Storyboard Selector */}
      <div className="grid xl:grid-cols-12 gap-5 items-start">
        <div className="xl:col-span-8 space-y-3">
          {/* Render Progress Overlay Bar */}
          {renderingVideo && (
            <div className="border border-cyan-500/40 bg-cyan-500/10 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-cyan-800 dark:text-cyan-200 font-medium">
                <span>Encoding real 30fps audiovisual video frames...</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono">{renderPct}%</span>
                  <button
                    type="button"
                    onClick={() => {
                      cancelRenderRef.current = true;
                    }}
                    className="text-[11px] underline text-rose-600 dark:text-rose-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-cyan-500 transition-all duration-150"
                  style={{ width: `${renderPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Embedded Real Playable <video controls> Output */}
          {viewMode === "video" && generatedVideo ? (
            <div className="space-y-3">
              <div
                className={`relative border border-cyan-500/40 bg-black overflow-hidden flex justify-center ${
                  generatedVideo.aspectRatio === "9:16" ? "max-h-[560px]" : ""
                }`}
              >
                <video
                  key={generatedVideo.url}
                  src={generatedVideo.url}
                  controls
                  autoPlay
                  playsInline
                  className={
                    generatedVideo.aspectRatio === "9:16"
                      ? "h-[520px] w-auto max-w-full bg-black"
                      : "w-full aspect-video bg-black"
                  }
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 dark:border-white/12 bg-slate-50 dark:bg-white/[0.02] px-4 py-2.5 text-xs">
                <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-slate-600 dark:text-white/70">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    ✓ REAL PLAYABLE VIDEO
                  </span>
                  <span>{generatedVideo.dimensions}</span>
                  <span>{generatedVideo.durationSec}s · 30fps</span>
                  <span>{formatBytes(generatedVideo.sizeBytes)}</span>
                  <span>{generatedVideo.hasAudioTrack ? "Audio + Video" : "Video Only"}</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadVideoFile}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition"
                >
                  <Download size={13} />
                  <span>Download .{generatedVideo.ext} Video</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* Motion Composer Canvas (always mounted during recording, hidden only when viewing finished video) */}
          <div className={viewMode === "video" && generatedVideo && !renderingVideo ? "hidden" : "block"}>
            <div
              className={`relative border border-slate-200 dark:border-white/15 bg-[#04080e] overflow-hidden flex justify-center ${
                aspectRatio === "9:16" ? "max-h-[560px]" : ""
              }`}
            >
              <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className={
                  aspectRatio === "9:16"
                    ? "h-[540px] w-auto max-w-full block"
                    : "w-full h-auto block"
                }
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-xs">
              <button
                type="button"
                disabled={renderingVideo}
                onClick={() => {
                  setSceneProgress(1);
                  setActiveSceneIdx((p) => (p - 1 + scenes.length) % scenes.length);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 dark:border-white/15 text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/[0.05] disabled:opacity-50"
              >
                <ChevronLeft size={13} />
                <span>Prev Scene</span>
              </button>
              <span className="font-mono text-[11px] text-slate-500 dark:text-white/55 text-center truncate">
                {studioStatus ||
                  `Scene ${activeSceneIdx + 1} of ${scenes.length} · ${activeScene?.sector} (${aspectRatio})`}
              </span>
              <button
                type="button"
                disabled={renderingVideo}
                onClick={() => {
                  setSceneProgress(1);
                  setActiveSceneIdx((p) => (p + 1) % scenes.length);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 dark:border-white/15 text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/[0.05] disabled:opacity-50"
              >
                <span>Next Scene</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* 6-Scene Storyboard Selector */}
        <div className="xl:col-span-4 space-y-2">
          {scenes.map((scene, idx) => {
            const active = idx === activeSceneIdx;
            return (
              <button
                key={scene.id}
                type="button"
                disabled={renderingVideo}
                onClick={() => {
                  setPlaying(false);
                  setViewMode("canvas");
                  setSceneProgress(1);
                  setActiveSceneIdx(idx);
                }}
                className={`w-full text-left p-3 border transition ${
                  active
                    ? "border-orange-400/60 bg-orange-500/[0.08]"
                    : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/25"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold" style={{ color: scene.accent }}>
                    0{idx + 1}. {scene.sector}
                  </span>
                  <span className="font-mono text-[10px] tabular-nums text-slate-500 dark:text-white/45">
                    {scene.kpis[0]?.value}
                  </span>
                </div>
                <div className="mt-1 text-xs font-medium text-slate-900 dark:text-white truncate">
                  {scene.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
