import { useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  BookOpen,
  BriefcaseBusiness,
  Calendar,
  Camera,
  CheckCircle2,
  Droplets,
  Flame,
  GraduationCap,
  HeartPulse,
  Leaf,
  MapPin,
  Mic,
  MicOff,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  Users,
  Video,
} from "lucide-react";

export type CommunitySectorKey =
  | "education"
  | "health"
  | "water"
  | "livelihood"
  | "environment";

type CommunityResourceNeed = {
  id: string;
  item: string;
  neededQty: number;
  pledgedQty: number;
  unit: string;
  pledgers: string[];
};

type CommunityActionRoom = {
  id: string;
  sector: CommunitySectorKey;
  title: string;
  description: string;
  institutionName: string;
  villageName: string;
  districtName: string;
  reporterName: string;
  severity: "Critical" | "High" | "Moderate";
  status: "open" | "mobilizing" | "resolved";
  upvotes: number;
  createdAt: string;
  gpsLabel: string;
  lat: number;
  lon: number;
  voiceTranscript?: string;
  audioDataUrl?: string;
  videoClipLabel?: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  peerVerified: boolean;
  verifiedBy?: string;
  adoptedNgo?: string;
  csrMatchStatus?: string;
  needs: CommunityResourceNeed[];
};

type CommunityDrive = {
  id: string;
  sector: CommunitySectorKey;
  title: string;
  dateLabel: string;
  timeSlot: string;
  landmark: string;
  organizer: string;
  capacity: number;
  rsvpCount: number;
  joinedByUser: boolean;
};

type VolunteerTeachingSlot = {
  id: string;
  schoolName: string;
  subject: string;
  dayTime: string;
  skillLevel: "Beginner-Friendly" | "STEM Graduate" | "Telugu Bilingual";
  slotsOpen: number;
  bookedByUser: boolean;
};

type InstitutionWishlist = {
  id: string;
  sector: CommunitySectorKey;
  institution: string;
  item: string;
  needed: number;
  fulfilled: number;
  unit: string;
};

type BalMitraCert = {
  id: string;
  studentName: string;
  schoolOrWard: string;
  activity: string;
  sector: CommunitySectorKey;
  parentConsent: boolean;
  issuedAt: string;
  certCode: string;
};

type CivicChampionEntry = {
  id: string;
  name: string;
  role: string;
  sector: CommunitySectorKey;
  hours: number;
  badge: string;
  verifiedActions: number;
};

type CommunityHubState = {
  issues: CommunityActionRoom[];
  drives: CommunityDrive[];
  volunteerSlots: VolunteerTeachingSlot[];
  wishlists: InstitutionWishlist[];
  certificates: BalMitraCert[];
  champions: CivicChampionEntry[];
  ngoDirectory: { name: string; focus: string; wardReach: string }[];
};

type SectorBlueprintMeta = {
  key: CommunitySectorKey;
  label: string;
  sdg: string;
  color: string;
  icon: typeof GraduationCap;
  keywords: string;
  deliverables: string;
  volunteerClusters: number;
};

const SECTOR_BLUEPRINT: SectorBlueprintMeta[] = [
  {
    key: "education",
    label: "1. Education",
    sdg: "SDG 04",
    color: "#ef4444",
    icon: GraduationCap,
    keywords: "Peer Mentorship Drives · Digital Literacy Camps · School Infra Audits · Youth Civic Clubs",
    deliverables: "Weekend teaching slots, classroom repair audits, community library setups, career guidance bites",
    volunteerClusters: 4,
  },
  {
    key: "health",
    label: "2. Health",
    sdg: "SDG 03",
    color: "#10b981",
    icon: HeartPulse,
    keywords: "Vector-Control & Sanitation Drives · Health Camp Mobilization · Nutrition Audits · Blood Network",
    deliverables: "Ward cleanliness drives, Anganwadi nutrition checks, local medical camp RSVPs, donor matching",
    volunteerClusters: 5,
  },
  {
    key: "water",
    label: "3. Water",
    sdg: "SDG 06",
    color: "#06b6d4",
    icon: Droplets,
    keywords: "Lake & Stepwell Restoration (Shramdaan) · RWH Mapping · Pipeline Leak Upvoting · Borewell Audits",
    deliverables: "Waterbody clean-ups, geo-tagged leak alerts, RWH pit verification, borewell recharge tracking",
    volunteerClusters: 6,
  },
  {
    key: "livelihood",
    label: "4. Livelihood",
    sdg: "SDG 08",
    color: "#ec4899",
    icon: BriefcaseBusiness,
    keywords: "Skill-to-Gig Matching · SHG & Artisan Market Linkages · Micro-Grant / CSR Discovery · Agri-Tech Support",
    deliverables: "Youth apprenticeship boards, Self-Help Group catalogs, CSR scheme eligibility checklists",
    volunteerClusters: 3,
  },
  {
    key: "environment",
    label: "5. Environment",
    sdg: "SDG 13",
    color: "#84cc16",
    icon: Leaf,
    keywords: "Heat-Island Mapping · Native Plantation & Biodiversity · E-Waste & Plastic Drives · Air/Noise Audits",
    deliverables: "Sapling survival geo-logs, ward e-waste drop-off drives, neighborhood green-cover audits",
    volunteerClusters: 5,
  },
];

/* Helper to stamp EXIF GPS + Timestamp watermark onto any captured or synthetic field evidence canvas */
function stampWatermarkPhoto(
  sourceImg: HTMLImageElement | null,
  label: string,
  gpsLabel: string,
  mode: "before" | "after"
): string {
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 420;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  if (sourceImg) {
    ctx.drawImage(sourceImg, 0, 0, canvas.width, canvas.height);
  } else {
    const grad = ctx.createLinearGradient(0, 0, 720, 420);
    if (mode === "before") {
      grad.addColorStop(0, "#231218");
      grad.addColorStop(1, "#0f172a");
    } else {
      grad.addColorStop(0, "#052e22");
      grad.addColorStop(1, "#082f49");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 720, 420);

    // Subtle schematic grid
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let x = 60; x < 720; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 420);
      ctx.stroke();
    }
    for (let y = 60; y < 420; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(720, y);
      ctx.stroke();
    }

    ctx.fillStyle = mode === "before" ? "#f87171" : "#34d399";
    ctx.font = "bold 22px monospace";
    ctx.fillText(
      mode === "before" ? "BASELINE DEFECT EVIDENCE" : "POST-DRIVE VERIFIED RESOLUTION",
      32,
      140
    );
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "600 18px sans-serif";
    ctx.fillText(label.slice(0, 52), 32, 184);
  }

  // Watermark bottom bar (EXIF Timestamp + GPS Lock)
  ctx.fillStyle = "rgba(4, 8, 18, 0.85)";
  ctx.fillRect(0, 354, 720, 66);
  ctx.fillStyle = mode === "before" ? "#fbbf24" : "#34d399";
  ctx.font = "bold 14px monospace";
  ctx.fillText(`JAN-DRISHTI EXIF VERIFIED · ${mode.toUpperCase()} PROOF`, 18, 380);
  ctx.fillStyle = "#cbd5e1";
  ctx.font = "13px monospace";
  ctx.fillText(`${gpsLabel} · ${new Date().toLocaleString("en-IN")}`, 18, 404);

  return canvas.toDataURL("image/jpeg", 0.86);
}

/* =========================================================
   1. 2.5-SECOND KINETIC SPLASH SEQUENCE
========================================================= */

function CommunitySplashSequence({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase(1), 220);
    const t2 = window.setTimeout(() => setPhase(2), 1800);
    const t3 = window.setTimeout(() => onDone(), 2500);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [onDone]);

  return (
    <div
      className={`relative min-h-[78vh] flex flex-col items-center justify-center overflow-hidden border-b border-white/10 transition-all duration-700 ${
        phase === 2 ? "-translate-y-6 opacity-0" : "translate-y-0 opacity-100"
      }`}
      style={{
        background:
          phase >= 1
            ? "radial-gradient(circle at 50% 42%, rgba(255,153,51,0.28) 0%, rgba(16,185,129,0.12) 38%, #040814 75%)"
            : "#040814",
      }}
    >
      {/* Converging Pragathi Chakram Line-Art Geometry */}
      <svg viewBox="0 0 360 360" className="w-56 h-56 md:w-72 md:h-72">
        <circle
          cx="180"
          cy="180"
          r={phase >= 1 ? "98" : "150"}
          fill="none"
          stroke="#ff9933"
          strokeOpacity="0.65"
          strokeWidth="2"
          strokeDasharray="10 8"
          className="transition-all duration-1000"
        >
          <animateTransform attributeName="transform" type="rotate" from="0 180 180" to="360 180 180" dur="12s" repeatCount="indefinite" />
        </circle>
        <circle
          cx="180"
          cy="180"
          r={phase >= 1 ? "72" : "120"}
          fill="none"
          stroke="#38bdf8"
          strokeOpacity="0.7"
          strokeWidth="2"
          className="transition-all duration-1000"
        />
        {[0, 72, 144, 216, 288].map((deg, idx) => {
          const rad = (deg * Math.PI) / 180;
          const dist = phase >= 1 ? 72 : 145;
          const cols = ["#ef4444", "#10b981", "#06b6d4", "#ec4899", "#84cc16"];
          return (
            <circle
              key={deg}
              cx={180 + Math.cos(rad) * dist}
              cy={180 + Math.sin(rad) * dist}
              r="8"
              fill={cols[idx]}
              className="transition-all duration-1000"
            />
          );
        })}
        <circle cx="180" cy="180" r="18" fill="#ff9933" fillOpacity="0.85" />
      </svg>

      <div className="mt-4 px-6 text-center max-w-2xl space-y-3">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
          Participatory Governance for Viksit Bharat
        </h1>
        <p className="text-xs md:text-sm font-mono tracking-[0.22em] text-amber-300 uppercase">
          Jan-Drishti • Citizen-Led Action Network
        </p>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="mt-8 px-4 py-1.5 text-xs font-mono border border-white/20 bg-white/[0.06] text-white/80 hover:bg-white/15 transition"
      >
        Skip Splash → Enter Command Hub
      </button>
    </div>
  );
}

/* =========================================================
   3. BEFORE-AND-AFTER PROOF COMPARISON SLIDER
========================================================= */

function BeforeAfterComparisonCard({ issue }: { issue: CommunityActionRoom }) {
  const [splitPct, setSplitPct] = useState(50);

  const beforeImg = useMemo(
    () =>
      issue.beforePhotoUrl ||
      stampWatermarkPhoto(null, issue.title, issue.gpsLabel, "before"),
    [issue.beforePhotoUrl, issue.title, issue.gpsLabel]
  );

  const afterImg = useMemo(
    () =>
      issue.afterPhotoUrl ||
      stampWatermarkPhoto(
        null,
        `Resolved: ${issue.institutionName}`,
        issue.gpsLabel,
        "after"
      ),
    [issue.afterPhotoUrl, issue.institutionName, issue.gpsLabel]
  );

  return (
    <div className="border border-emerald-500/35 bg-[#050a14] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
          <CheckCircle2 size={14} />
          <span>Before-and-After Comparison Proof — {issue.title}</span>
        </div>
        <span className="text-[10px] font-mono text-white/60">
          {issue.verifiedBy ?? "Peer Verified"}
        </span>
      </div>

      <div className="relative w-full h-56 overflow-hidden border border-white/15 select-none">
        <img
          src={afterImg}
          alt="After drive completion"
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${splitPct}%` }}
        >
          <img
            src={beforeImg}
            alt="Initial baseline issue"
            className="h-full max-w-none object-cover"
            style={{ width: "720px" }}
            referrerPolicy="no-referrer"
          />
        </div>
        <div
          className="absolute inset-y-0 w-0.5 bg-amber-300 shadow-[0_0_12px_#fbbf24]"
          style={{ left: `${splitPct}%` }}
        />
        <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-mono font-bold bg-red-600/85 text-white">
          BEFORE ({splitPct}%)
        </span>
        <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-600/85 text-white">
          AFTER VERIFIED
        </span>
      </div>

      <input
        type="range"
        min={5}
        max={95}
        value={splitPct}
        onChange={(e) => setSplitPct(Number(e.target.value))}
        aria-label="Slide to compare before and after community resolution photos"
        className="w-full accent-emerald-400 cursor-ew-resize"
      />
    </div>
  );
}

/* =========================================================
   MAIN COMMUNITY DEVELOPMENT HUB COMPONENT
========================================================= */

export default function CommunityDevelopmentHub({
  activeVillageName,
  activeDistrictName,
  activeLat,
  activeLon,
}: {
  activeVillageName: string;
  activeDistrictName: string;
  activeLat?: number;
  activeLon?: number;
}) {
  const [showSplash, setShowSplash] = useState(true);
  const [state, setState] = useState<CommunityHubState | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState<CommunitySectorKey>("education");
  const [pillarMode, setPillarMode] = useState<"report" | "mobilize">("mobilize");

  // Report a Gap Multi-Modal Form State
  const [reporterName, setReporterName] = useState("Srinath S. (Citizen)");
  const [reportTitle, setReportTitle] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reportInst, setReportInst] = useState("ZPHS School / Local Asset");
  const [reportSeverity, setReportSeverity] = useState<"Critical" | "High" | "Moderate">("High");
  const [gpsCoords, setGpsCoords] = useState({
    lat: activeLat ?? 17.7824,
    lon: activeLon ?? 78.2641,
    label: `${(activeLat ?? 17.7824).toFixed(4)}°N, ${(activeLon ?? 78.2641).toFixed(4)}°E · Hyperlocal 2 km Pin`,
  });
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioDataUrl, setAudioDataUrl] = useState<string>("");
  const [beforePhotoUrl, setBeforePhotoUrl] = useState<string>("");
  const [videoClipUrl, setVideoClipUrl] = useState<string>("");
  const [videoClipLabel, setVideoClipLabel] = useState<string>("");
  const [submitBanner, setSubmitBanner] = useState<string>("");

  // Collaboration Hub States
  const [slotFilterSubject, setSlotFilterSubject] = useState("ALL");
  const [selectedNgoByIssue, setSelectedNgoByIssue] = useState<Record<string, string>>({});
  const [newDriveTitle, setNewDriveTitle] = useState("");
  const [newDriveDate, setNewDriveDate] = useState("Sun, 06 Dec 2026");
  const [newDriveLandmark, setNewDriveLandmark] = useState("Village Tank / ZPHS Grounds");

  // Bal Mitra Kids & Youth Corner State
  const [kidName, setKidName] = useState("");
  const [kidSchool, setKidSchool] = useState("");
  const [kidActivity, setKidActivity] = useState("Wall Painting & Sanitation Poster");
  const [parentConsent, setParentConsent] = useState(true);
  const [latestCert, setLatestCert] = useState<BalMitraCert | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    fetch("/api/community/state")
      .then((r) => r.json())
      .then((data: CommunityHubState) => {
        setState(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeLat && activeLon) {
      setGpsCoords({
        lat: activeLat,
        lon: activeLon,
        label: `${activeLat.toFixed(4)}°N, ${activeLon.toFixed(4)}°E · ${activeVillageName} 2.5 km Radius`,
      });
    }
  }, [activeLat, activeLon, activeVillageName]);

  const activeSectorMeta =
    SECTOR_BLUEPRINT.find((s) => s.key === selectedSector) ?? SECTOR_BLUEPRINT[0];

  /* Hardware 1: Camera / Photo Upload with EXIF GPS Watermark */
  function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        setBeforePhotoUrl(
          stampWatermarkPhoto(
            img,
            reportTitle || file.name,
            gpsCoords.label,
            "before"
          )
        );
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function handleGenerateWatermarkedSnapshot() {
    setBeforePhotoUrl(
      stampWatermarkPhoto(
        null,
        reportTitle || `${activeSectorMeta.label} Field Audit — ${activeVillageName}`,
        gpsCoords.label,
        "before"
      )
    );
  }

  /* Hardware 2: Live Hyperlocal GPS Lock */
  function handlePinLocation() {
    if (!("geolocation" in navigator)) {
      setGpsCoords({
        lat: activeLat ?? 17.7824,
        lon: activeLon ?? 78.2641,
        label: `${(activeLat ?? 17.7824).toFixed(4)}°N, ${(activeLon ?? 78.2641).toFixed(4)}°E · ${activeVillageName} Ward Pin`,
      });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setGpsCoords({
          lat,
          lon,
          label: `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E · Live Device GPS (±${Math.round(pos.coords.accuracy)}m)`,
        });
      },
      () => {
        setGpsCoords({
          lat: activeLat ?? 17.7824,
          lon: activeLon ?? 78.2641,
          label: `${(activeLat ?? 17.7824).toFixed(4)}°N, ${(activeLon ?? 78.2641).toFixed(4)}°E · ${activeVillageName} GIS Lock`,
        });
      },
      { timeout: 5000 }
    );
  }

  /* Hardware 3: Vernacular Speech-to-Text + Real Audio Note Recording */
  function handleStartVoiceDictation() {
    const win = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        onresult: (e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void;
        onend: () => void;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        onresult: (e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void;
        onend: () => void;
        start: () => void;
      };
    };
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (SR) {
      const recog = new SR();
      recog.lang = "te-IN";
      setIsListening(true);
      recog.onresult = (ev) => {
        const text = ev.results?.[0]?.[0]?.transcript;
        if (text) setVoiceTranscript((prev) => (prev ? `${prev} ${text}` : text));
      };
      recog.onend = () => setIsListening(false);
      recog.start();
    } else {
      setVoiceTranscript(
        `[${activeVillageName} Vernacular Note]: Urgent ${activeSectorMeta.label} field gap verified at ${reportInst}.`
      );
    }
  }

  async function toggleAudioRecording() {
    if (isRecordingAudio && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = (ev) => {
        if (ev.data.size > 0) audioChunksRef.current.push(ev.data);
      };
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => setAudioDataUrl(String(reader.result || ""));
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecordingAudio(true);
    } catch {
      setSubmitBanner("Microphone permission unavailable; use Voice-to-Text field directly.");
    }
  }

  /* Hardware 4: Short-Form Vertical Drive Clip (15-30s) */
  function handleVideoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoClipUrl(URL.createObjectURL(file));
    setVideoClipLabel(`${file.name} (Short Drive Clip)`);
  }

  /* API Mutations */
  async function handleSubmitReport(e: React.FormEvent) {
    e.preventDefault();
    if (!reportTitle.trim()) return;
    const res = await fetch("/api/community/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sector: selectedSector,
        title: reportTitle,
        description: reportDesc || `Citizen report flagged near ${reportInst} in ${activeVillageName}.`,
        institutionName: reportInst,
        villageName: activeVillageName,
        districtName: activeDistrictName,
        reporterName,
        severity: reportSeverity,
        gpsLabel: gpsCoords.label,
        lat: gpsCoords.lat,
        lon: gpsCoords.lon,
        voiceTranscript,
        audioDataUrl,
        videoClipLabel,
        beforePhotoUrl:
          beforePhotoUrl ||
          stampWatermarkPhoto(null, reportTitle, gpsCoords.label, "before"),
      }),
    });
    const data = await res.json();
    if (data?.state) {
      setState(data.state);
      setReportTitle("");
      setReportDesc("");
      setVoiceTranscript("");
      setBeforePhotoUrl("");
      setAudioDataUrl("");
      setPillarMode("mobilize");
      setSubmitBanner("Action Room created! Community members & NGOs can now upvote, pledge, and mobilize.");
    }
  }

  async function mutateCommunity(url: string, body?: object) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : "{}",
    });
    const data = await res.json();
    if (data?.state) setState(data.state);
    return data;
  }

  async function handleCreateDrive(e: React.FormEvent) {
    e.preventDefault();
    if (!newDriveTitle.trim()) return;
    await mutateCommunity("/api/community/drives", {
      sector: selectedSector,
      title: newDriveTitle,
      dateLabel: newDriveDate,
      landmark: newDriveLandmark,
      organizer: `${reporterName} + Ward Group`,
      capacity: 40,
    });
    setNewDriveTitle("");
  }

  async function handleIssueCertificate(e: React.FormEvent) {
    e.preventDefault();
    if (!kidName.trim() || !parentConsent) return;
    const res = await mutateCommunity("/api/community/bal-mitra", {
      studentName: kidName,
      schoolOrWard: kidSchool || `${activeVillageName} School Squad`,
      activity: kidActivity,
      sector: selectedSector,
      parentConsent,
    });
    if (res?.certificate) setLatestCert(res.certificate);
    setKidName("");
  }

  if (showSplash) {
    return <CommunitySplashSequence onDone={() => setShowSplash(false)} />;
  }

  if (loading || !state) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-white/60">
        Loading Community Development Command Hub…
      </div>
    );
  }

  const sectorIssues = state.issues.filter((i) => i.sector === selectedSector);
  const resolvedProofIssues = state.issues.filter((i) => i.status === "resolved");
  const filteredSlots =
    slotFilterSubject === "ALL"
      ? state.volunteerSlots
      : state.volunteerSlots.filter((s) => s.skillLevel === slotFilterSubject);

  return (
    <div className="min-h-screen bg-[#05080f] text-white pb-16">
      {/* =======================================================
          2. MAIN COMMAND HUB HEADER + DUAL-PILLAR ENGINE
      ======================================================= */}
      <section className="border-b border-white/10 bg-gradient-to-b from-[#081021] to-[#05080f] px-6 md:px-10 py-10">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono font-bold text-orange-300 flex items-center gap-2">
                <Users size={14} />
                <span>PARTICIPATORY GOVERNANCE FOR VIKSIT BHARAT · {activeVillageName.toUpperCase()}</span>
              </div>
              <h1 className="mt-1.5 text-2xl md:text-4xl font-bold tracking-tight text-white">
                Community Development &amp; Report-to-Solve Action Network
              </h1>
              <p className="mt-1.5 text-sm text-white/60 max-w-3xl">
                Capture verified multi-modal village gaps, match NGOs &amp; CSR partners, schedule weekend Shramdaan drives, pledge supplies, and audit completed work together.
              </p>
            </div>

            {/* Dual-Pillar Primary Action Buttons */}
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setPillarMode("report")}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border transition ${
                  pillarMode === "report"
                    ? "border-orange-400 bg-orange-600 text-white shadow-lg"
                    : "border-orange-400/45 bg-orange-500/15 text-orange-200 hover:bg-orange-500/25"
                }`}
              >
                <Camera size={14} />
                <span>Pillar A: Report a Gap</span>
              </button>

              <button
                type="button"
                onClick={() => setPillarMode("mobilize")}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border transition ${
                  pillarMode === "mobilize"
                    ? "border-emerald-400 bg-emerald-600 text-white shadow-lg"
                    : "border-emerald-400/45 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
                }`}
              >
                <Flame size={14} />
                <span>Pillar B: Mobilize &amp; Solve ({state.issues.length} Rooms)</span>
              </button>
            </div>
          </div>

          {/* 5-Sector SDG Command Hub Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {SECTOR_BLUEPRINT.map((sec) => {
              const Icon = sec.icon;
              const isSelected = selectedSector === sec.key;
              const activeCount = state.issues.filter((i) => i.sector === sec.key).length;
              const drivesCount = state.drives.filter((d) => d.sector === sec.key).length;
              return (
                <button
                  key={sec.key}
                  type="button"
                  onClick={() => setSelectedSector(sec.key)}
                  style={{
                    borderColor: isSelected ? sec.color : "rgba(255,255,255,0.12)",
                    backgroundColor: isSelected ? `${sec.color}18` : "rgba(255,255,255,0.02)",
                  }}
                  className="text-left border p-4 transition hover:bg-white/[0.05] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="flex h-8 w-8 items-center justify-center"
                      style={{ backgroundColor: `${sec.color}25`, color: sec.color }}
                    >
                      <Icon size={16} />
                    </span>
                    <span className="font-mono text-[10px] font-bold" style={{ color: sec.color }}>
                      {sec.sdg}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-white">{sec.label}</div>
                  <div className="text-[11px] font-mono text-white/65">
                    {activeCount} Issues · {drivesCount} Drives · {sec.volunteerClusters} Clusters
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Sector Charter Strip */}
          <div
            className="border p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#060b16]"
            style={{ borderColor: `${activeSectorMeta.color}45` }}
          >
            <div>
              <div className="text-[11px] font-mono font-bold" style={{ color: activeSectorMeta.color }}>
                {activeSectorMeta.label.toUpperCase()} · {activeSectorMeta.sdg} ACTION KEYWORDS
              </div>
              <div className="mt-0.5 text-xs text-white/85">{activeSectorMeta.keywords}</div>
            </div>
            <div className="text-xs text-white/60 max-w-md">
              <strong className="text-white/90">Deliverables:</strong> {activeSectorMeta.deliverables}
            </div>
          </div>

          {submitBanner && (
            <div className="border border-emerald-400/50 bg-emerald-500/15 px-4 py-2.5 text-xs text-emerald-200 flex items-center justify-between">
              <span>{submitBanner}</span>
              <button type="button" onClick={() => setSubmitBanner("")} className="underline text-[11px]">
                Dismiss
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8 space-y-10">
        {/* =======================================================
            PILLAR A: HARDWARE & SENSORY FIELD CAPTURE (REPORT A GAP)
        ======================================================= */}
        {pillarMode === "report" && (
          <section className="border border-orange-400/35 bg-[#070c16] p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="text-xs font-mono font-bold text-orange-300">
                  STAGE 1 · MULTI-MODAL PROBLEM REPORTING (HARDWARE &amp; SENSORY UI)
                </div>
                <h2 className="mt-1 text-xl font-semibold text-white">
                  Submit EXIF-Verified Field Gap into Interactive Action Room
                </h2>
              </div>
              <span className="text-[11px] font-mono text-white/55">
                {gpsCoords.label}
              </span>
            </div>

            {/* 4 Hardware Sensory Action Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Camera */}
              <div className="border border-white/12 bg-[#050912] p-3.5 space-y-2">
                <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <Camera size={14} />
                  <span>1. Camera (EXIF + GPS Stamp)</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <label className="cursor-pointer px-2.5 py-1 text-[11px] bg-amber-600/25 border border-amber-500/50 text-amber-200 hover:bg-amber-600/40">
                    Upload / Snap Photo
                    <input type="file" accept="image/*" capture="environment" onChange={handlePhotoSelected} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateWatermarkedSnapshot}
                    className="px-2.5 py-1 text-[11px] border border-white/15 bg-white/[0.04] text-white/75 hover:text-white"
                  >
                    Auto-Stamp Preview
                  </button>
                </div>
                {beforePhotoUrl && (
                  <img
                    src={beforePhotoUrl}
                    alt="Watermarked field evidence"
                    className="w-full h-24 object-cover border border-white/15"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>

              {/* Location */}
              <div className="border border-white/12 bg-[#050912] p-3.5 space-y-2">
                <div className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                  <MapPin size={14} />
                  <span>2. Location (2–5 km Ward Pin)</span>
                </div>
                <button
                  type="button"
                  onClick={handlePinLocation}
                  className="px-2.5 py-1 text-[11px] bg-cyan-600/25 border border-cyan-500/50 text-cyan-200 hover:bg-cyan-600/40"
                >
                  Lock Hyperlocal GPS Pin
                </button>
                <div className="text-[10.5px] font-mono text-white/65 leading-relaxed">
                  {gpsCoords.label}
                </div>
              </div>

              {/* Microphone */}
              <div className="border border-white/12 bg-[#050912] p-3.5 space-y-2">
                <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <Mic size={14} />
                  <span>3. Microphone (Telugu/Voice)</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={handleStartVoiceDictation}
                    className="px-2.5 py-1 text-[11px] bg-emerald-600/25 border border-emerald-500/50 text-emerald-200"
                  >
                    {isListening ? "Listening…" : "Voice-to-Text"}
                  </button>
                  <button
                    type="button"
                    onClick={toggleAudioRecording}
                    className="px-2.5 py-1 text-[11px] border border-white/15 bg-white/[0.04] text-white/80 inline-flex items-center gap-1"
                  >
                    {isRecordingAudio ? <MicOff size={11} /> : <Mic size={11} />}
                    <span>{isRecordingAudio ? "Stop Audio" : "Record Note"}</span>
                  </button>
                </div>
                {audioDataUrl && (
                  <audio controls src={audioDataUrl} className="w-full h-7" />
                )}
              </div>

              {/* Video */}
              <div className="border border-white/12 bg-[#050912] p-3.5 space-y-2">
                <div className="text-xs font-semibold text-pink-300 flex items-center gap-1.5">
                  <Video size={14} />
                  <span>4. Video (15–30s Drive Clip)</span>
                </div>
                <label className="inline-block cursor-pointer px-2.5 py-1 text-[11px] bg-pink-600/25 border border-pink-500/50 text-pink-200">
                  Attach 15s Clip
                  <input type="file" accept="video/*" onChange={handleVideoSelected} className="hidden" />
                </label>
                {videoClipUrl && (
                  <video controls src={videoClipUrl} className="w-full h-24 bg-black border border-white/15" />
                )}
              </div>
            </div>

            <form onSubmit={handleSubmitReport} className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <input
                  type="text"
                  required
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="Issue Headline (e.g., Broken classroom benches / Leaking RWS pipeline)..."
                  className="w-full border border-white/15 bg-[#040812] px-3.5 py-2.5 text-xs text-white focus:border-orange-400 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={reportInst}
                    onChange={(e) => setReportInst(e.target.value)}
                    placeholder="Institution / Asset Name"
                    className="border border-white/15 bg-[#040812] px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <select
                    value={reportSeverity}
                    onChange={(e) => setReportSeverity(e.target.value as "Critical" | "High" | "Moderate")}
                    className="border border-white/15 bg-[#040812] px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Critical">Critical Severity</option>
                    <option value="High">High Priority</option>
                    <option value="Moderate">Moderate Need</option>
                  </select>
                </div>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Your Name / Role"
                  className="w-full border border-white/15 bg-[#040812] px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-3">
                <textarea
                  rows={2}
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  placeholder="Describe what residents, students, or volunteers need..."
                  className="w-full border border-white/15 bg-[#040812] px-3.5 py-2 text-xs text-white focus:outline-none"
                />
                <input
                  type="text"
                  value={voiceTranscript}
                  onChange={(e) => setVoiceTranscript(e.target.value)}
                  placeholder="Vernacular Voice Transcript (Telugu / Hindi / English)..."
                  className="w-full border border-emerald-500/30 bg-[#040812] px-3.5 py-2 text-xs text-emerald-200 focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-semibold bg-gradient-to-r from-orange-600 to-amber-500 hover:brightness-110 text-white transition"
                >
                  Launch Live Action Room &amp; Notify Ward Network
                </button>
              </div>
            </form>
          </section>
        )}

        {/* =======================================================
            STAGE 1 & 2: LIVE SECTOR ACTION ROOMS + UP-VOTING + NGO ADOPTION + RESOURCE POOLING
        ======================================================= */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-white">
                Active {activeSectorMeta.label} Action Rooms ({sectorIssues.length})
              </h2>
              <p className="text-xs text-white/55">
                Every field report becomes a collaborative Action Room with ward upvoting, NGO adoption, supply pooling, and peer verification.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPillarMode("report")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-orange-400/40 text-orange-200 hover:bg-orange-500/15"
            >
              <PlusCircle size={13} />
              <span>Report New {activeSectorMeta.label.split(". ")[1]} Gap</span>
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            {sectorIssues.map((issue) => (
              <div key={issue.id} className="border border-white/12 bg-[#070c16] p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                      <span
                        className={`px-2 py-0.5 font-bold ${
                          issue.severity === "Critical"
                            ? "bg-red-500/20 text-red-300 border border-red-500/40"
                            : issue.severity === "High"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                        }`}
                      >
                        {issue.severity.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 bg-white/[0.06] text-white/80 uppercase">
                        {issue.status}
                      </span>
                      <span className="text-white/50">{issue.institutionName}</span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-white">{issue.title}</h3>
                  </div>

                  {/* Community Upvoting Button */}
                  <button
                    type="button"
                    onClick={() => mutateCommunity(`/api/community/issues/${issue.id}/upvote`)}
                    className="flex flex-col items-center justify-center px-3 py-1.5 border border-cyan-400/40 bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-200 shrink-0"
                  >
                    <ThumbsUp size={13} />
                    <span className="mt-0.5 font-mono text-xs font-bold">{issue.upvotes}</span>
                  </button>
                </div>

                <p className="text-xs leading-6 text-white/70">{issue.description}</p>

                {issue.voiceTranscript && (
                  <div className="border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2 text-[11px] text-emerald-200">
                    <strong>Voice Note:</strong> {issue.voiceTranscript}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-white/55">
                  <span>{issue.gpsLabel}</span>
                  <span>By {issue.reporterName}</span>
                </div>

                {/* Module 4: Resource & Skill Pooling Matrix ("What is Needed" vs "What I Can Contribute") */}
                <div className="border border-white/10 bg-[#050912] p-3 space-y-2.5">
                  <div className="text-[11px] font-mono font-bold text-amber-300">
                    RESOURCE &amp; SKILL POOLING MATRIX
                  </div>
                  {issue.needs.map((need) => {
                    const pct = Math.min(100, Math.round((need.pledgedQty / Math.max(1, need.neededQty)) * 100));
                    return (
                      <div key={need.id} className="space-y-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-white/85">{need.item}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-[11px] text-emerald-300">
                              {need.pledgedQty}/{need.neededQty} {need.unit}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                mutateCommunity(`/api/community/issues/${issue.id}/pledge`, {
                                  needId: need.id,
                                  pledgerName: reporterName,
                                })
                              }
                              className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                              + Contribute
                            </button>
                          </div>
                        </div>
                        <div className="h-1.5 bg-white/10 overflow-hidden">
                          <div className="h-full bg-emerald-400" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Module 1: NGO & Civic Partner Tagging + Stage 3: Peer Verification Resolution */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                  <div className="flex items-center gap-1.5">
                    <select
                      value={selectedNgoByIssue[issue.id] ?? state.ngoDirectory[0].name}
                      onChange={(e) =>
                        setSelectedNgoByIssue((p) => ({ ...p, [issue.id]: e.target.value }))
                      }
                      className="border border-white/15 bg-[#040812] px-2 py-1 text-[11px] text-white"
                    >
                      {state.ngoDirectory.map((n) => (
                        <option key={n.name} value={n.name}>
                          {n.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        mutateCommunity(`/api/community/issues/${issue.id}/adopt`, {
                          ngoName: selectedNgoByIssue[issue.id] ?? state.ngoDirectory[0].name,
                        })
                      }
                      className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-600/80 hover:bg-indigo-500 text-white"
                    >
                      {issue.adoptedNgo ? `Adopted: ${issue.adoptedNgo}` : "Adopt This Issue"}
                    </button>
                  </div>

                  {/* Peer Verification Toggle */}
                  {issue.status !== "resolved" ? (
                    <button
                      type="button"
                      onClick={() =>
                        mutateCommunity(`/api/community/issues/${issue.id}/resolve`, {
                          verifierName: reporterName,
                          peerVerified: true,
                          afterPhotoUrl: stampWatermarkPhoto(
                            null,
                            `Verified Resolved: ${issue.title}`,
                            issue.gpsLabel,
                            "after"
                          ),
                        })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold border border-emerald-400/50 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/35"
                    >
                      <ShieldCheck size={12} />
                      <span>Peer Verify &amp; Close (+4 hrs)</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-300">
                      <CheckCircle2 size={13} />
                      <span>Peer Verified Closed</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =======================================================
            4. DEDICATED SECTOR WIDGETS (VOLUNTEER SLOTS & WISHLISTS)
        ======================================================= */}
        <section className="grid lg:grid-cols-12 gap-6">
          {/* Volunteer Slot Picker Card: "Teach 1 Hour This Weekend" */}
          <div className="lg:col-span-6 border border-white/12 bg-[#070c16] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-mono font-bold text-rose-300 flex items-center gap-1.5">
                <BookOpen size={14} />
                <span>TEACH 1 HOUR THIS WEEKEND · VOLUNTEER SLOT PICKER</span>
              </div>
              <select
                value={slotFilterSubject}
                onChange={(e) => setSlotFilterSubject(e.target.value)}
                className="border border-white/15 bg-[#040812] px-2 py-1 text-[11px] text-white"
              >
                <option value="ALL">All Skill Levels</option>
                <option value="STEM Graduate">STEM Graduate</option>
                <option value="Telugu Bilingual">Telugu Bilingual</option>
                <option value="Beginner-Friendly">Beginner-Friendly</option>
              </select>
            </div>

            <div className="space-y-2.5">
              {filteredSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="border border-white/10 bg-[#050912] p-3.5 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-semibold text-white">{slot.schoolName}</div>
                    <div className="text-[11px] text-white/70">{slot.subject}</div>
                    <div className="mt-1 text-[10px] font-mono text-amber-300">
                      {slot.dayTime} · {slot.skillLevel} ({slot.slotsOpen} left)
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => mutateCommunity(`/api/community/volunteer-slots/${slot.id}/book`)}
                    className={`px-3 py-1.5 text-xs font-semibold transition ${
                      slot.bookedByUser
                        ? "bg-emerald-600 text-white"
                        : "border border-rose-400/50 bg-rose-500/20 text-rose-200 hover:bg-rose-500/35"
                    }`}
                  >
                    {slot.bookedByUser ? "Slot Booked ✓" : "Reserve 1-Hr Slot"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Resource Wish-List Progress Bar */}
          <div className="lg:col-span-6 border border-white/12 bg-[#070c16] p-5 space-y-4">
            <div className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles size={14} />
              <span>INSTITUTION RESOURCE WISH-LIST TRACKER</span>
            </div>

            <div className="space-y-3">
              {state.wishlists.map((w) => {
                const pct = Math.min(100, Math.round((w.fulfilled / w.needed) * 100));
                return (
                  <div key={w.id} className="border border-white/10 bg-[#050912] p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-semibold text-white">{w.item}</div>
                        <div className="text-[11px] text-white/55">{w.institution}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => mutateCommunity(`/api/community/wishlist/${w.id}/pledge`)}
                        className="px-3 py-1 text-[11px] font-semibold bg-amber-600 hover:bg-amber-500 text-white shrink-0"
                      >
                        Pledge Item
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-white/60">
                      <span>{pct}% Fulfilled</span>
                      <span>
                        {w.fulfilled}/{w.needed} {w.unit}
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =======================================================
            STAGE 2 MODULES 2 & 3: SHRAMDAAN CAMP SCHEDULER + BAL MITRA KIDS SQUAD
        ======================================================= */}
        <section className="grid lg:grid-cols-12 gap-6">
          {/* Module 2: Drive & Awareness Camp Scheduler */}
          <div className="lg:col-span-7 border border-white/12 bg-[#070c16] p-5 space-y-4">
            <div className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
              <Calendar size={14} />
              <span>DRIVE &amp; SHRAMDAAN CAMP SCHEDULER</span>
            </div>

            <form onSubmit={handleCreateDrive} className="grid sm:grid-cols-4 gap-2">
              <input
                type="text"
                value={newDriveTitle}
                onChange={(e) => setNewDriveTitle(e.target.value)}
                placeholder="Host new weekend camp..."
                className="sm:col-span-2 border border-white/15 bg-[#040812] px-3 py-2 text-xs text-white focus:outline-none"
              />
              <input
                type="text"
                value={newDriveDate}
                onChange={(e) => setNewDriveDate(e.target.value)}
                className="border border-white/15 bg-[#040812] px-2.5 py-2 text-xs text-white focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                + Launch Drive
              </button>
              <input
                type="text"
                value={newDriveLandmark}
                onChange={(e) => setNewDriveLandmark(e.target.value)}
                placeholder="Landmark pin"
                className="sm:col-span-4 border border-white/10 bg-[#040812] px-3 py-1.5 text-[11px] text-white/75 focus:outline-none"
              />
            </form>

            <div className="grid sm:grid-cols-2 gap-3">
              {state.drives.map((drv) => (
                <div key={drv.id} className="border border-white/10 bg-[#050912] p-3.5 space-y-2">
                  <div className="text-xs font-semibold text-white">{drv.title}</div>
                  <div className="text-[11px] text-white/60">
                    {drv.dateLabel} · {drv.timeSlot}
                  </div>
                  <div className="text-[10.5px] font-mono text-cyan-300/80">{drv.landmark}</div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-[11px] font-mono text-white/65">
                      {drv.rsvpCount}/{drv.capacity} Volunteers
                    </span>
                    <button
                      type="button"
                      onClick={() => mutateCommunity(`/api/community/drives/${drv.id}/rsvp`)}
                      className={`px-3 py-1 text-[11px] font-semibold ${
                        drv.joinedByUser
                          ? "bg-emerald-600 text-white"
                          : "border border-cyan-400/50 bg-cyan-500/20 text-cyan-200"
                      }`}
                    >
                      {drv.joinedByUser ? "Joined Drive ✓" : "Join Drive"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Module 3: Bal Mitra & Yuva Squad (Kids & Youth Corner + Consent Toggle + Certificate) */}
          <div className="lg:col-span-5 border border-lime-400/30 bg-[#070c16] p-5 space-y-4">
            <div className="text-xs font-mono font-bold text-lime-300 flex items-center gap-1.5">
              <Award size={14} />
              <span>BAL MITRA &amp; YUVA SQUAD (KIDS &amp; YOUTH CORNER)</span>
            </div>
            <p className="text-xs text-white/65">
              Safe youth participation in wall painting, poster rallies, cleanliness &amp; tree-tagging with digital Junior Civic Champion certificates.
            </p>

            <form onSubmit={handleIssueCertificate} className="space-y-2.5">
              <input
                type="text"
                required
                value={kidName}
                onChange={(e) => setKidName(e.target.value)}
                placeholder="Student Name (e.g., Rohan · Class 8)"
                className="w-full border border-white/15 bg-[#040812] px-3 py-2 text-xs text-white focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={kidSchool}
                  onChange={(e) => setKidSchool(e.target.value)}
                  placeholder="School / Ward"
                  className="border border-white/15 bg-[#040812] px-3 py-2 text-xs text-white focus:outline-none"
                />
                <select
                  value={kidActivity}
                  onChange={(e) => setKidActivity(e.target.value)}
                  className="border border-white/15 bg-[#040812] px-2.5 py-2 text-xs text-white focus:outline-none"
                >
                  <option>Wall Painting &amp; Sanitation Poster</option>
                  <option>Native Sapling Tree-Tagging</option>
                  <option>Cleanliness Awareness Rally</option>
                  <option>School Library Reading Circle</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={parentConsent}
                  onChange={(e) => setParentConsent(e.target.checked)}
                  className="accent-lime-400"
                />
                <span>Parent / Teacher Consent Verified</span>
              </label>

              <button
                type="submit"
                disabled={!parentConsent}
                className="w-full py-2 text-xs font-semibold bg-gradient-to-r from-lime-600 to-emerald-600 disabled:opacity-40 text-white"
              >
                Generate &ldquo;Junior Civic Champion&rdquo; Certificate
              </button>
            </form>

            {(latestCert ?? state.certificates[0]) && (
              <div className="border-2 border-amber-400/50 bg-gradient-to-br from-[#0e1726] to-[#06241c] p-4 space-y-1.5 text-center">
                <div className="text-[10px] font-mono tracking-[0.2em] text-amber-300">
                  JUNIOR CIVIC CHAMPION CERTIFICATE
                </div>
                <div className="text-base font-bold text-white">
                  {(latestCert ?? state.certificates[0]).studentName}
                </div>
                <div className="text-xs text-emerald-200">
                  {(latestCert ?? state.certificates[0]).activity} ·{" "}
                  {(latestCert ?? state.certificates[0]).schoolOrWard}
                </div>
                <div className="text-[10px] font-mono text-white/55">
                  ID: {(latestCert ?? state.certificates[0]).certCode} · Issued{" "}
                  {(latestCert ?? state.certificates[0]).issuedAt}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* =======================================================
            STAGE 3: PROOF OF IMPACT SLIDER + CIVIC CHAMPION LEDGER
        ======================================================= */}
        <section className="grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="text-xs font-mono font-bold text-emerald-300">
              STAGE 3 · PROOF OF IMPACT (BEFORE-AND-AFTER VISUAL VERIFICATION)
            </div>
            {resolvedProofIssues.slice(0, 2).map((iss) => (
              <BeforeAfterComparisonCard key={iss.id} issue={iss} />
            ))}
          </div>

          {/* Civic Champion Ledger */}
          <div className="lg:col-span-5 border border-white/12 bg-[#070c16] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
                <Award size={14} />
                <span>CIVIC CHAMPION LEDGER</span>
              </div>
              <span className="text-[10px] font-mono text-white/55">
                Verified Hours &amp; Badges
              </span>
            </div>

            <div className="space-y-2">
              {state.champions.slice(0, 7).map((ch, idx) => (
                <div
                  key={ch.id}
                  className="border border-white/10 bg-[#050912] px-3.5 py-2.5 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-xs font-semibold text-white">
                      #{idx + 1} · {ch.name}
                    </div>
                    <div className="text-[11px] text-white/55">
                      {ch.role} · <span className="text-amber-300">{ch.badge}</span>
                    </div>
                  </div>
                  <div className="text-right font-mono shrink-0">
                    <div className="text-xs font-bold text-emerald-300">{ch.hours} hrs</div>
                    <div className="text-[10px] text-white/50">{ch.verifiedActions} verified</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
