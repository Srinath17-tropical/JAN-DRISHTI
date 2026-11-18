import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Award,
  BookOpen,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Copy,
  Download,
  Droplets,
  FileText,
  GraduationCap,
  Handshake,
  HeartPulse,
  Landmark,
  Leaf,
  MapPin,
  Mic,
  MicOff,
  PackagePlus,
  PhoneCall,
  Plus,
  Printer,
  Search,
  Send,
  ShieldCheck,
  Sprout,
  ThumbsUp,
  Users,
  Vote,
} from "lucide-react";
import LiveCameraCapture from "./LiveCameraCapture";
import IndiaMapTransitionBackdrop from "./IndiaMapTransitionBackdrop";
import {
  analyzeComplaintSolution,
  AREA_SABHA_GUIDE_STEPS,
  CIVIC_LEARNING_CURRICULUM,
  COMPLAINT_CATEGORIES,
  haversineMeters,
  NGO_PARTNER_DIRECTORY,
  PILLAR_META,
  PILLAR_ORDER,
  type CommunitySectorKey,
  type ResolutionPathwayType,
  type SettlementType,
} from "../lib/communityPortalEngine";

type CommunityObligationStatus = "Pending" | "In Progress" | "Completed";

type CommunityObligationRecord = {
  id: string;
  sector: CommunitySectorKey;
  title: string;
  description: string;
  youthAndKidsRole: string;
  targetMetric: string;
  status: CommunityObligationStatus;
  contributorsCount: number;
  lastUpdated: string;
};

type CommunityResourceNeed = {
  id: string;
  item: string;
  neededQty: number;
  pledgedQty: number;
  unit: string;
  pledgers: string[];
};

type CaseTimelineEntry = {
  id: string;
  date: string;
  actor: string;
  action: string;
  note: string;
};

type CommunityActionRoom = {
  id: string;
  sector: CommunitySectorKey;
  categoryId: string;
  categoryLabel: string;
  title: string;
  description: string;
  institutionName: string;
  villageName: string;
  mandalName: string;
  districtName: string;
  settlementType: SettlementType;
  affectedPeople: number;
  reporterName: string;
  severity: "Critical" | "High" | "Moderate";
  status: "open" | "mobilizing" | "resolved";
  recommendedPathway: ResolutionPathwayType;
  pathwayHeadline: string;
  escalationStatus:
    | "Not Escalated"
    | "Petition Generated"
    | "Submitted to Officer / MLA"
    | "Acknowledged"
    | "Resolved";
  escalatedTo?: string;
  govtTicketRef?: string;
  escalatedAt?: string;
  youthDriveTitle?: string;
  petitionText?: string;
  upvotes: number;
  createdAt: string;
  gpsLabel: string;
  lat: number;
  lon: number;
  voiceTranscript?: string;
  audioDataUrl?: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  peerVerified: boolean;
  verifiedBy?: string;
  adoptedNgo?: string;
  csrMatchStatus?: string;
  needs: CommunityResourceNeed[];
  timeline: CaseTimelineEntry[];
};

type CommunityDrive = {
  id: string;
  sector: CommunitySectorKey;
  linkedIssueId?: string;
  title: string;
  dateLabel: string;
  timeSlot: string;
  landmark: string;
  organizer: string;
  capacity: number;
  rsvpCount: number;
  joinedByUser: boolean;
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

type SaplingAdoption = {
  id: string;
  guardianName: string;
  species: string;
  landmark: string;
  villageName: string;
  adoptedAt: string;
};

type BudgetProposalStatus = "Proposed" | "Shortlisted in Ward Budget" | "Sanctioned";

type BudgetProposal = {
  id: string;
  sector: CommunitySectorKey;
  title: string;
  rationale: string;
  location: string;
  estimatedCostLakhs: number;
  votes: number;
  votedByUser: boolean;
  proposerName: string;
  status: BudgetProposalStatus;
  assignedLeaderRole: string;
  createdAt: string;
};

type WardSabhaMeeting = {
  id: string;
  title: string;
  sabhaType: "Area Sabha" | "Ward Committee" | "Gram Sabha";
  dateLabel: string;
  timeSlot: string;
  venue: string;
  chairRole: string;
  agendaItems: string[];
  attendeeCount: number;
  rsvpedByUser: boolean;
  status: "Upcoming" | "Minutes Filed";
  resolutionSummary?: string;
};

type WardLeaderProfile = {
  id: string;
  roleTitle: string;
  tier: "Elected Ward / GP" | "Mandal / Municipal Officer" | "Constituency MLA / Collectorate";
  officeName: string;
  statutoryMandate: string;
  helplineOrPortal: string;
  slaDays: number;
  resolvedCount: number;
  budgetUtilizedPct: number;
  dispatchedRequests: {
    id: string;
    subject: string;
    sender: string;
    date: string;
    linkedRef?: string;
  }[];
};

type CivicLearningRecord = {
  moduleId: string;
  completionsCount: number;
  completedByUser: boolean;
  latestReflection?: string;
  lastCompletedAt?: string;
};

type CommunityHubState = {
  schemaVersion?: number;
  obligations: CommunityObligationRecord[];
  saplings: SaplingAdoption[];
  issues: CommunityActionRoom[];
  drives: CommunityDrive[];
  wishlists: InstitutionWishlist[];
  certificates: BalMitraCert[];
  champions: CivicChampionEntry[];
  budgetProposals: BudgetProposal[];
  wardMeetings: WardSabhaMeeting[];
  wardLeaders: WardLeaderProfile[];
  learningProgress: CivicLearningRecord[];
  ngoDirectory: { name: string; focus: string; wardReach: string; sectors?: CommunitySectorKey[] }[];
};

type CivicStrandTab = "engagement" | "civic_tech" | "leaders" | "learning";

function getIssueSlaMetrics(issue: CommunityActionRoom) {
  const targetDays = issue.severity === "Critical" ? 4 : issue.severity === "High" ? 7 : 14;
  const startRaw = issue.escalatedAt || issue.createdAt;
  const startMs = Date.parse(startRaw);
  const safeStartMs = Number.isFinite(startMs) ? startMs : Date.now() - 2 * 86400000;
  const deadlineMs = safeStartMs + targetDays * 86400000;
  const remainingMs = deadlineMs - Date.now();
  const elapsedDays = Math.max(0, Math.floor((Date.now() - safeStartMs) / 86400000));
  const progressPct = Math.min(100, Math.max(6, Math.round(((Date.now() - safeStartMs) / (targetDays * 86400000)) * 100)));

  if (issue.status === "resolved") {
    return {
      targetDays,
      elapsedDays,
      progressPct: 100,
      status: "resolved" as const,
      countdownLabel: `Closed in ${elapsedDays}d (SLA ${targetDays}d)`,
    };
  }
  if (remainingMs <= 0) {
    const overdueDays = Math.max(1, Math.ceil(Math.abs(remainingMs) / 86400000));
    return {
      targetDays,
      elapsedDays,
      progressPct: 100,
      status: "overdue" as const,
      countdownLabel: `OVERDUE +${overdueDays}d (SLA ${targetDays}d breached)`,
    };
  }
  const remDays = Math.floor(remainingMs / 86400000);
  const remHours = Math.floor((remainingMs % 86400000) / 3600000);
  const approaching = remainingMs <= 48 * 3600000;
  return {
    targetDays,
    elapsedDays,
    progressPct,
    status: approaching ? ("due_soon" as const) : ("on_track" as const),
    countdownLabel: `${remDays}d ${remHours}h left of ${targetDays}d SLA`,
  };
}

const SECTOR_ICONS: Record<CommunitySectorKey, typeof HeartPulse> = {
  health: HeartPulse,
  education: GraduationCap,
  water: Droplets,
  livelihood: BriefcaseBusiness,
  environment: Leaf,
};

function downloadFile(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function BeforeAfterProofCompare({ issue }: { issue: CommunityActionRoom }) {
  const [splitPct, setSplitPct] = useState(50);

  if (!issue.beforePhotoUrl && !issue.afterPhotoUrl) {
    return (
      <div className="border border-white/10 bg-[#050912] p-3 text-xs text-slate-400">
        {issue.status === "resolved"
          ? `Verified resolved by ${issue.verifiedBy ?? "Neighborhood Peer Audit"}. Attach an after-photo during resolution to compare before/after images.`
          : "No site photos uploaded yet. Capture a live baseline or after-resolution photo for transparent audit verification."}
      </div>
    );
  }
  if (issue.beforePhotoUrl && !issue.afterPhotoUrl) {
    return (
      <div className="border border-white/10 bg-[#050912] p-3 space-y-2">
        <div className="text-xs font-medium text-amber-300">Baseline Civic Issue Photo</div>
        <img
          src={issue.beforePhotoUrl}
          alt="Reported civic issue evidence"
          className="w-full h-48 object-cover border border-white/10"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }
  if (!issue.beforePhotoUrl && issue.afterPhotoUrl) {
    return (
      <div className="border border-emerald-500/30 bg-[#050912] p-3 space-y-2">
        <div className="text-xs font-medium text-emerald-300">After-Resolution Verification Photo</div>
        <img
          src={issue.afterPhotoUrl}
          alt="Resolved civic verification"
          className="w-full h-48 object-cover border border-emerald-500/20"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div className="border border-emerald-500/35 bg-[#050a14] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
          <CheckCircle2 size={14} />
          <span>Before &amp; After Visual Verification</span>
        </span>
        <span className="font-mono text-slate-400">{issue.verifiedBy ?? "Peer Verified"}</span>
      </div>
      <div className="relative w-full h-52 overflow-hidden border border-white/15 select-none">
        <img
          src={issue.afterPhotoUrl}
          alt="After resolution"
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${splitPct}%` }}>
          <img
            src={issue.beforePhotoUrl}
            alt="Before resolution"
            className="h-full max-w-none object-cover"
            style={{ width: "680px" }}
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-y-0 w-0.5 bg-amber-300" style={{ left: `${splitPct}%` }} />
        <span className="absolute top-2 left-2 px-2 py-0.5 text-[11px] font-mono bg-black/80 text-amber-300">
          Before ({splitPct}%)
        </span>
        <span className="absolute top-2 right-2 px-2 py-0.5 text-[11px] font-mono bg-black/80 text-emerald-300">
          After Verified
        </span>
      </div>
      <input
        type="range"
        min={5}
        max={95}
        value={splitPct}
        onChange={(e) => setSplitPct(Number(e.target.value))}
        aria-label="Slide to compare before and after photos"
        className="w-full accent-emerald-400 cursor-ew-resize"
      />
    </div>
  );
}

export default function CommunityDevelopmentHub({
  activeVillageName,
  activeMandalName = "Mandal HQ",
  activeDistrictName,
  activeVillageCode,
  activeVillageType,
  activeNearestSchool,
  activeNearestHealth,
  activeLat,
  activeLon,
  sectorScores,
}: {
  activeVillageName: string;
  activeMandalName?: string;
  activeDistrictName: string;
  activeVillageCode?: string;
  activeVillageType?: string;
  activeNearestSchool?: string;
  activeNearestHealth?: string;
  activeLat?: number;
  activeLon?: number;
  sectorScores?: {
    health: number;
    education: number;
    water: number;
    livelihood: number;
    environment: number;
    overall: number;
  };
}) {
  const [state, setState] = useState<CommunityHubState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState<CivicStrandTab>("engagement");
  const [noticeBanner, setNoticeBanner] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Shared Citizen Identity & Jurisdiction
  const [reporterName, setReporterName] = useState("Srinath S. (Resident)");
  const [settlementType, setSettlementType] = useState<SettlementType>(
    activeVillageType?.toLowerCase().includes("town") || activeVillageType?.toLowerCase().includes("muni")
      ? "Municipal Ward / Town"
      : "Rural Gram Panchayat"
  );

  // Strand 1: Participatory Budgeting & Area Sabha
  const [budgetSectorFilter, setBudgetSectorFilter] = useState<CommunitySectorKey | "all">("all");
  const [propTitle, setPropTitle] = useState("");
  const [propSector, setPropSector] = useState<CommunitySectorKey>("water");
  const [propLocation, setPropLocation] = useState("");
  const [propCostLakhs, setPropCostLakhs] = useState(4.0);
  const [propLeader, setPropLeader] = useState("Gram Sarpanch / Ward Corporator");
  const [propRationale, setPropRationale] = useState("");
  const [agendaInput, setAgendaInput] = useState("");

  // Strand 2: Civic Tech (4-step Report + Live Camera + Solution Engine)
  const [reportSector, setReportSector] = useState<CommunitySectorKey>("water");
  const [categoryId, setCategoryId] = useState("wat-pipe");
  const [reportTitle, setReportTitle] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reportInst, setReportInst] = useState("");
  const [affectedPeople, setAffectedPeople] = useState(120);
  const [reportSeverity, setReportSeverity] = useState<"Critical" | "High" | "Moderate">("High");
  const [gpsCoords, setGpsCoords] = useState({
    lat: activeLat ?? 17.7824,
    lon: activeLon ?? 78.2641,
    label: `${(activeLat ?? 17.7824).toFixed(4)}°N, ${(activeLon ?? 78.2641).toFixed(4)}°E · ${activeVillageName}`,
  });
  const [beforePhotoUrl, setBeforePhotoUrl] = useState("");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioDataUrl, setAudioDataUrl] = useState("");
  const [selectedNgoForNew, setSelectedNgoForNew] = useState(NGO_PARTNER_DIRECTORY[0].name);
  const [ticketRefForNew, setTicketRefForNew] = useState("");

  // Issue Board Selection
  const [caseSearch, setCaseSearch] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [caseTicketInput, setCaseTicketInput] = useState("");
  const [caseEscalationTarget, setCaseEscalationTarget] = useState("");
  const [caseNgoSelect, setCaseNgoSelect] = useState(NGO_PARTNER_DIRECTORY[0].name);
  const [caseAfterPhotoUrl, setCaseAfterPhotoUrl] = useState("");

  // Strand 3: Elected Leaders & Officers Accountability
  const [leaderSubjects, setLeaderSubjects] = useState<Record<string, string>>({});
  const [leaderTicketRefs, setLeaderTicketRefs] = useState<Record<string, string>>({});
  const [auditSector, setAuditSector] = useState<CommunitySectorKey>("water");

  // Strand 4: Civic Learning, Youth Drives, Tree Buddy & Badges
  const [learningReflections, setLearningReflections] = useState<Record<string, string>>({});
  const [newDriveTitle, setNewDriveTitle] = useState("");
  const [newDriveDate, setNewDriveDate] = useState("Sun, 06 Dec 2026");
  const [newDriveLandmark, setNewDriveLandmark] = useState("");
  const [wishItemName, setWishItemName] = useState("");
  const [wishQty, setWishQty] = useState(20);
  const [saplingSpecies, setSaplingSpecies] = useState("Native Neem (Azadirachta)");
  const [saplingLandmark, setSaplingLandmark] = useState("");
  const [kidName, setKidName] = useState("");
  const [kidSchool, setKidSchool] = useState("");
  const [selectedBadge, setSelectedBadge] = useState("Water Guardian");
  const [kidActivity, setKidActivity] = useState("Tap Leakage Audit & Tank Conservation");
  const [parentConsent, setParentConsent] = useState(false);
  const [latestCert, setLatestCert] = useState<BalMitraCert | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    fetch("/api/community/state")
      .then((r) => {
        if (!r.ok) throw new Error("Could not load Civic Participation portal state");
        return r.json();
      })
      .then((data: CommunityHubState) => {
        setState(data);
        if (data.issues.length > 0) setSelectedCaseId(data.issues[0].id);
        setLoading(false);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Unable to connect to Civic Participation server.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (activeLat && activeLon) {
      setGpsCoords({
        lat: activeLat,
        lon: activeLon,
        label: `${activeLat.toFixed(4)}°N, ${activeLon.toFixed(4)}°E · ${activeVillageName}`,
      });
    }
    setSettlementType(
      activeVillageType?.toLowerCase().includes("town") || activeVillageType?.toLowerCase().includes("muni")
        ? "Municipal Ward / Town"
        : "Rural Gram Panchayat"
    );
    setPropLocation(`${activeVillageName} Ward / Main Road`);
    setNewDriveLandmark(`${activeVillageName} Community Grounds`);
    setSaplingLandmark(`${activeNearestSchool || activeVillageName} Approach Road`);
  }, [activeLat, activeLon, activeVillageName, activeVillageType, activeNearestSchool]);

  const sectorCategories = useMemo(
    () => COMPLAINT_CATEGORIES.filter((c) => c.sector === reportSector),
    [reportSector]
  );

  useEffect(() => {
    const first = sectorCategories[0];
    if (first && !sectorCategories.some((c) => c.id === categoryId)) {
      setCategoryId(first.id);
    }
    const matchingNgo = NGO_PARTNER_DIRECTORY.find((n) => n.sectors.includes(reportSector));
    if (matchingNgo) setSelectedNgoForNew(matchingNgo.name);

    if (reportSector === "education" && activeNearestSchool) {
      setReportInst(activeNearestSchool);
    } else if (reportSector === "health" && activeNearestHealth) {
      setReportInst(activeNearestHealth);
    } else if (reportSector === "water") {
      setReportInst(`Ward Pipeline / Tank, ${activeVillageName}`);
    } else if (reportSector === "livelihood") {
      setReportInst(`SHG / Panchayat Bhavan, ${activeVillageName}`);
    } else {
      setReportInst(`East Bund / Approach Road, ${activeVillageName}`);
    }
  }, [reportSector, sectorCategories, categoryId, activeNearestSchool, activeNearestHealth, activeVillageName]);

  // 50-meter Smart Deduplication Check
  const nearbyDuplicatePin = useMemo(() => {
    if (!state) return null;
    for (const iss of state.issues) {
      if (iss.status === "resolved") continue;
      if (iss.sector !== reportSector) continue;
      const dist = haversineMeters(gpsCoords.lat, gpsCoords.lon, iss.lat, iss.lon);
      if (dist <= 50) {
        return { issue: iss, distanceMeters: Math.round(dist) };
      }
    }
    return null;
  }, [state, reportSector, gpsCoords.lat, gpsCoords.lon]);

  // Live Solution Plan Computation
  const liveSolution = useMemo(
    () =>
      analyzeComplaintSolution({
        sector: reportSector,
        categoryId,
        title: reportTitle,
        description: reportDesc,
        severity: reportSeverity,
        affectedPeople,
        settlementType,
        villageName: activeVillageName,
        mandalName: activeMandalName,
        districtName: activeDistrictName,
        villageCode: activeVillageCode,
        institutionName: reportInst || activeVillageName,
        gpsLabel: gpsCoords.label,
        reporterName,
      }),
    [
      reportSector,
      categoryId,
      reportTitle,
      reportDesc,
      reportSeverity,
      affectedPeople,
      settlementType,
      activeVillageName,
      activeMandalName,
      activeDistrictName,
      activeVillageCode,
      reportInst,
      gpsCoords.label,
      reporterName,
    ]
  );

  // Locality Composite Score blending GIS metrics + Obligations
  const localityScore = useMemo(() => {
    if (!state) return sectorScores?.overall ?? 62;
    const sum = PILLAR_ORDER.reduce((acc, k) => {
      const obls = state.obligations.filter((o) => o.sector === k);
      const comp = obls.filter((o) => o.status === "Completed").length;
      const inProg = obls.filter((o) => o.status === "In Progress").length;
      const oblPct = ((comp * 100 + inProg * 50) / Math.max(1, obls.length * 100)) * 100;
      const gisPct = sectorScores ? sectorScores[k] : 64;
      return acc + Math.round(gisPct * 0.55 + oblPct * 0.45);
    }, 0);
    return Math.round(sum / PILLAR_ORDER.length);
  }, [state, sectorScores]);

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

  function handlePinLocation() {
    if (!("geolocation" in navigator)) {
      setNoticeBanner("Browser geolocation unavailable; using locality GIS coordinates.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setGpsCoords({
          lat,
          lon,
          label: `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E · Device GPS (±${Math.round(pos.coords.accuracy)}m)`,
        });
        setNoticeBanner("GPS coordinates locked onto civic issue report.");
      },
      () => {
        setNoticeBanner(`Using ${activeVillageName} GIS centroid (${gpsCoords.lat.toFixed(4)}°N, ${gpsCoords.lon.toFixed(4)}°E).`);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  }

  function handleStartVoiceDictation() {
    const win = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        onresult: (e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void;
        onend: () => void;
        onerror: () => void;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        onresult: (e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void;
        onend: () => void;
        onerror: () => void;
        start: () => void;
      };
    };
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) {
      setNoticeBanner("Speech recognition unavailable in this browser. Type your note or record audio.");
      return;
    }
    try {
      const recog = new SR();
      recog.lang = "te-IN";
      setIsListening(true);
      recog.onresult = (ev) => {
        const text = ev.results?.[0]?.[0]?.transcript;
        if (text) setVoiceTranscript((prev) => (prev ? `${prev} ${text}` : text));
      };
      recog.onend = () => setIsListening(false);
      recog.onerror = () => setIsListening(false);
      recog.start();
    } catch {
      setIsListening(false);
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
      setNoticeBanner("Microphone access denied in browser settings.");
    }
  }

  async function submitCivicIssueWithAction(
    initialAction: "escalate_govt" | "collab_ngo" | "mobilize_youth" | "submit_only"
  ) {
    const cat = sectorCategories.find((c) => c.id === categoryId) ?? sectorCategories[0];
    const effectiveTitle = reportTitle.trim() || cat?.label || `${reportSector} Civic Complaint`;
    setSubmitting(true);
    try {
      const data = await mutateCommunity("/api/community/issues", {
        sector: reportSector,
        categoryId: cat?.id,
        categoryLabel: cat?.label,
        title: effectiveTitle,
        description:
          reportDesc.trim() ||
          `${cat?.label} flagged at ${reportInst || activeVillageName} impacting ~${affectedPeople} residents.`,
        institutionName: reportInst || activeVillageName,
        villageName: activeVillageName,
        mandalName: activeMandalName,
        districtName: activeDistrictName,
        settlementType,
        affectedPeople,
        reporterName,
        severity: reportSeverity,
        recommendedPathway: liveSolution.primaryPathway,
        pathwayHeadline: liveSolution.primaryHeadline,
        initialAction,
        escalatedTo: liveSolution.escalationTiers[0]?.authority + " / MLA",
        govtTicketRef: ticketRefForNew.trim() || undefined,
        ngoName: selectedNgoForNew,
        youthDriveTitle: `Action Drive: ${effectiveTitle.slice(0, 48)}`,
        petitionText: liveSolution.petitionText,
        gpsLabel: gpsCoords.label,
        lat: gpsCoords.lat,
        lon: gpsCoords.lon,
        voiceTranscript,
        audioDataUrl,
        beforePhotoUrl: beforePhotoUrl || undefined,
        needs: (cat?.defaultNeeds ?? []).map((n, idx) => ({
          id: `n-${Date.now()}-${idx}`,
          item: n.item,
          neededQty: n.qty,
          pledgedQty: 0,
          unit: n.unit,
          pledgers: [],
        })),
      });
      if (data?.issue?.id) setSelectedCaseId(data.issue.id);
      setReportTitle("");
      setReportDesc("");
      setBeforePhotoUrl("");
      setVoiceTranscript("");
      setAudioDataUrl("");
      setTicketRefForNew("");
      setNoticeBanner(
        initialAction === "escalate_govt"
          ? "Issue logged & formal Officer / Corporator / MLA representation generated."
          : initialAction === "collab_ngo"
          ? `Issue logged & NGO collaboration dispatched to ${selectedNgoForNew}.`
          : initialAction === "mobilize_youth"
          ? "Issue logged & linked Community Action Drive scheduled."
          : "Civic issue published to Locality Ledger."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleCopy(id: string, text: string) {
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopiedId(id);
        window.setTimeout(() => setCopiedId(""), 2200);
      })
      .catch(() => setNoticeBanner("Copy blocked; use Download instead."));
  }

  function handleExportSabhaBrief() {
    if (!state) return;
    const shortlisted = state.budgetProposals.filter((b) => b.status !== "Proposed");
    const upcoming = state.wardMeetings.find((m) => m.status === "Upcoming");
    const openIssues = state.issues.filter((i) => i.status !== "resolved");

    const lines = [
      "================================================================",
      "JAN-DRISHTI · WARD COMMITTEE / GRAM SABHA CIVIC BRIEF",
      "================================================================",
      `Locality: ${activeVillageName}, ${activeMandalName} Mandal, ${activeDistrictName} District`,
      `Code: ${activeVillageCode ?? "N/A"} | Jurisdiction: ${settlementType}`,
      `Locality Governance Score: ${localityScore}/100`,
      `Generated: ${new Date().toLocaleString("en-IN")}`,
      "",
      `1. PARTICIPATORY BUDGET PRIORITIES ("MY LOCALITY, MY BUDGET" — ${shortlisted.length} SHORTLISTED/SANCTIONED)`,
      ...state.budgetProposals.map(
        (p, idx) =>
          ` ${idx + 1}. [${p.status}] ${p.title} — ₹${p.estimatedCostLakhs}L (${p.votes} citizen votes)\n    Location: ${p.location} | Authority: ${p.assignedLeaderRole}`
      ),
      "",
      `2. UPCOMING SABHA DOCKET (${upcoming?.title ?? "Scheduled Area / Gram Sabha"})`,
      ...(upcoming?.agendaItems ?? []).map((a, i) => ` ${i + 1}. ${a}`),
      "",
      `3. OPEN CIVIC TECH ISSUES REQUIRING OFFICER / CORPORATOR / MLA ACTION (${openIssues.length})`,
      ...openIssues.map(
        (i, idx) =>
          ` ${idx + 1}. [${i.severity.toUpperCase()}] ${i.title} (${i.upvotes} co-signs)\n    Asset: ${i.institutionName} | GPS: ${i.gpsLabel}\n    Pathway: ${i.pathwayHeadline}\n    Ticket/NGO: ${i.govtTicketRef || i.escalationStatus} | NGO: ${i.adoptedNgo || "Unassigned"}`
      ),
    ];

    downloadFile(
      `sabha-civic-brief-${activeVillageName.toLowerCase().replace(/\s+/g, "-")}.txt`,
      lines.join("\n")
    );
    setNoticeBanner("Ward Committee / Gram Sabha brief downloaded.");
  }

  const activeCase = useMemo(() => {
    if (!state) return null;
    return state.issues.find((i) => i.id === selectedCaseId) ?? state.issues[0] ?? null;
  }, [state, selectedCaseId]);

  useEffect(() => {
    if (activeCase) {
      setCaseTicketInput(activeCase.govtTicketRef || "");
      setCaseEscalationTarget(
        activeCase.escalatedTo ||
          `${activeCase.settlementType === "Municipal Ward / Town" ? "Ward Corporator & Municipal Officer" : "Gram Sarpanch & MPDO"} · MLA (${activeCase.districtName})`
      );
      setCaseAfterPhotoUrl("");
    }
  }, [activeCase?.id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-slate-400">
        Loading Civic Participation Platform...
      </div>
    );
  }

  if (loadError || !state) {
    return (
      <div className="max-w-3xl mx-auto my-12 border border-red-500/40 bg-[#0b101b] p-6 text-sm text-red-200 space-y-2">
        <div className="font-semibold">Unable to load Civic Participation Platform</div>
        <p className="text-xs text-slate-300">{loadError}</p>
      </div>
    );
  }

  const WARD_BUDGET_ENVELOPE_LAKHS = 25;
  const allocatedBudgetLakhs = state.budgetProposals
    .filter((b) => b.status === "Shortlisted in Ward Budget" || b.status === "Sanctioned")
    .reduce((acc, b) => acc + b.estimatedCostLakhs, 0);
  const openIssuesCount = state.issues.filter((i) => i.status !== "resolved").length;
  const resolvedIssuesCount = state.issues.filter((i) => i.status === "resolved").length;
  const upcomingSabha = state.wardMeetings.find((m) => m.status === "Upcoming") ?? state.wardMeetings[0];
  const completedModulesCount = state.learningProgress.filter((m) => m.completedByUser).length;

  const sortedProposals = [...state.budgetProposals]
    .filter((p) => budgetSectorFilter === "all" || p.sector === budgetSectorFilter)
    .sort((a, b) => b.votes - a.votes);

  const filteredIssues = state.issues.filter((iss) => {
    if (!caseSearch.trim()) return true;
    const q = caseSearch.toLowerCase();
    return `${iss.title} ${iss.villageName} ${iss.institutionName} ${iss.districtName}`
      .toLowerCase()
      .includes(q);
  });

  const auditObligations = state.obligations.filter((o) => o.sector === auditSector);

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 pb-16">
      {/* =========================================================
          CIVIC PARTICIPATION HEADER & 4-STRAND NAVIGATION
      ========================================================= */}
      <header className="relative overflow-hidden border-b border-white/10 bg-[#090e1a] px-6 md:px-10 py-6">
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-72 w-72 opacity-15"
          aria-hidden="true"
        >
          <IndiaMapTransitionBackdrop />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="text-slate-300 font-medium">Participatory Governance for Viksit Bharat</span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-300 font-medium">
                  {activeVillageName}, {activeMandalName}, {activeDistrictName}
                </span>
                <span aria-hidden="true">·</span>
                <span>{settlementType}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
                {activeVillageName} Civic Participation &amp; Local Governance
              </h1>
            </div>

            {/* Clean KPI Strip */}
            <div className="flex flex-wrap items-center gap-5 border border-white/12 bg-[#060a13] px-5 py-3 shrink-0">
              <div>
                <div className="text-[11px] text-slate-400">Locality Score</div>
                <div className="text-lg font-semibold font-mono tabular-nums text-amber-300">
                  {localityScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
                </div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <div className="text-[11px] text-slate-400">Budget Shortlisted</div>
                <div className="text-lg font-semibold font-mono tabular-nums text-emerald-300">
                  ₹{allocatedBudgetLakhs.toFixed(1)}L{" "}
                  <span className="text-xs font-normal text-slate-400">/ ₹{WARD_BUDGET_ENVELOPE_LAKHS}L</span>
                </div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <div className="text-[11px] text-slate-400">Open Civic Issues</div>
                <div className="text-lg font-semibold font-mono tabular-nums text-rose-300">
                  {openIssuesCount}{" "}
                  <span className="text-xs font-normal text-slate-400">({resolvedIssuesCount} closed)</span>
                </div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <div className="text-[11px] text-slate-400">Next Sabha RSVPs</div>
                <div className="text-lg font-semibold font-mono tabular-nums text-cyan-300">
                  {upcomingSabha?.attendeeCount ?? 0}
                </div>
              </div>
            </div>
          </div>

          {/* 4 Janaagraha-Aligned Civic Participation Strands */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {(
              [
                {
                  id: "engagement",
                  label: `1. Citizen Engagement · MyBudget & Sabhas (${state.budgetProposals.length})`,
                },
                {
                  id: "civic_tech",
                  label: `2. Civic Tech · Report Issue & Solution (${state.issues.length})`,
                },
                {
                  id: "leaders",
                  label: `3. Leaders' Accountability · Corporator, Officer & MLA (${state.wardLeaders.length})`,
                },
                {
                  id: "learning",
                  label: `4. Civic Learning · Bala Sabha & Youth (${completedModulesCount}/${CIVIC_LEARNING_CURRICULUM.length})`,
                },
              ] as { id: CivicStrandTab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-medium border transition whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? "border-amber-400 bg-amber-600 text-white"
                    : "border-white/12 bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {noticeBanner && (
            <div className="border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-200 flex items-center justify-between gap-4">
              <span>{noticeBanner}</span>
              <button
                type="button"
                onClick={() => setNoticeBanner("")}
                className="text-xs underline text-emerald-300 hover:text-white shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8 space-y-8">
        {/* =========================================================
            STRAND 1: CITIZEN ENGAGEMENT (MY VILLAGE/WARD, MY BUDGET + AREA SABHAS)
        ========================================================= */}
        {activeTab === "engagement" && (
          <div className="space-y-8">
            {/* Top Overview Strip: How Participatory Budgeting + Sabhas Work */}
            <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {AREA_SABHA_GUIDE_STEPS.map((st) => (
                <div key={st.step} className="border border-white/10 bg-[#0a0f1c] p-4 space-y-1.5">
                  <div className="text-[11px] font-mono text-amber-300">{st.step}</div>
                  <div className="text-xs font-semibold text-white">{st.title}</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{st.detail}</p>
                </div>
              ))}
            </section>

            <div className="grid lg:grid-cols-12 gap-6 items-start">
              {/* LEFT: My Village / Ward, My Budget Participatory Budgeting */}
              <section className="lg:col-span-7 border border-white/12 bg-[#0a0f1c] p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <div className="text-xs font-medium text-amber-300 flex items-center gap-1.5">
                      <Vote size={14} />
                      <span>My {settlementType === "Municipal Ward / Town" ? "Ward" : "Village"}, My Budget</span>
                    </div>
                    <h2 className="text-lg font-semibold text-white mt-0.5">
                      Participatory Budget Priorities — {activeVillageName}
                    </h2>
                  </div>
                  <div className="text-right font-mono tabular-nums">
                    <div className="text-xs text-slate-400">Ward Discretionary Pool</div>
                    <div className="text-sm font-semibold text-emerald-300">
                      ₹{allocatedBudgetLakhs.toFixed(1)}L committed / ₹{WARD_BUDGET_ENVELOPE_LAKHS}.0L envelope
                    </div>
                  </div>
                </div>

                {/* Envelope Utilization Bar */}
                <div className="space-y-1.5">
                  <div className="h-2 bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 transition-all"
                      style={{
                        width: `${Math.min(100, Math.round((allocatedBudgetLakhs / WARD_BUDGET_ENVELOPE_LAKHS) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                    <span>Residents submit concrete neighborhood works &amp; vote; shortlisted items enter the official Area / Gram Sabha docket.</span>
                  </div>
                </div>

                {/* Propose New Ward / GP Budget Demand */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!propTitle.trim()) return;
                    await mutateCommunity("/api/community/budget-proposals", {
                      sector: propSector,
                      title: propTitle,
                      location: propLocation || `${activeVillageName} Ward`,
                      estimatedCostLakhs: propCostLakhs,
                      proposerName: reporterName,
                      assignedLeaderRole: propLeader,
                      rationale: propRationale || `Citizen budget request in ${activeVillageName}.`,
                    });
                    setPropTitle("");
                    setPropRationale("");
                    setNoticeBanner("Budget proposal added to community ballot.");
                  }}
                  className="border border-white/10 bg-[#060a13] p-4 space-y-3"
                >
                  <div className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                    <Plus size={13} />
                    <span>Submit a Neighborhood Budget Demand</span>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-2">
                    <select
                      value={propSector}
                      onChange={(e) => setPropSector(e.target.value as CommunitySectorKey)}
                      className="border border-white/15 bg-[#0a0f1c] px-2.5 py-2 text-xs text-white"
                    >
                      {PILLAR_ORDER.map((k) => (
                        <option key={k} value={k}>
                          {PILLAR_META[k].title}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      required
                      value={propTitle}
                      onChange={(e) => setPropTitle(e.target.value)}
                      placeholder="Work title (e.g., Covered Drain at SC Colony)"
                      className="sm:col-span-2 border border-white/15 bg-[#0a0f1c] px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={propLocation}
                      onChange={(e) => setPropLocation(e.target.value)}
                      placeholder="Exact street / asset"
                      className="border border-white/15 bg-[#0a0f1c] px-2.5 py-2 text-xs text-white"
                    />
                    <div className="flex items-center border border-white/15 bg-[#0a0f1c] px-2.5">
                      <span className="text-[11px] text-slate-400 mr-1.5">₹ Lakhs:</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="50"
                        value={propCostLakhs}
                        onChange={(e) => setPropCostLakhs(Math.max(0.5, Number(e.target.value) || 1))}
                        className="w-full py-2 text-xs font-mono text-white bg-transparent focus:outline-none"
                      />
                    </div>
                    <select
                      value={propLeader}
                      onChange={(e) => setPropLeader(e.target.value)}
                      className="border border-white/15 bg-[#0a0f1c] px-2.5 py-2 text-xs text-white"
                    >
                      <option>Gram Sarpanch / Ward Corporator</option>
                      <option>MPDO / Municipal Engineer</option>
                      <option>Constituency MLA (CDF Fund)</option>
                    </select>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={propRationale}
                      onChange={(e) => setPropRationale(e.target.value)}
                      placeholder="Why do residents prioritize this work?"
                      className="flex-1 border border-white/15 bg-[#0a0f1c] px-3 py-2 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white whitespace-nowrap"
                    >
                      Add to Ballot
                    </button>
                  </div>
                </form>

                {/* Filter + Ranked Proposal Cards */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setBudgetSectorFilter("all")}
                    className={`px-2.5 py-1 text-[11px] border whitespace-nowrap ${
                      budgetSectorFilter === "all"
                        ? "border-amber-400 bg-amber-500/20 text-amber-200"
                        : "border-white/12 text-slate-400"
                    }`}
                  >
                    All Sectors ({state.budgetProposals.length})
                  </button>
                  {PILLAR_ORDER.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setBudgetSectorFilter(k)}
                      className={`px-2.5 py-1 text-[11px] border whitespace-nowrap ${
                        budgetSectorFilter === k
                          ? "border-amber-400 bg-amber-500/20 text-amber-200"
                          : "border-white/12 text-slate-400"
                      }`}
                    >
                      {PILLAR_META[k].title}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {sortedProposals.map((p) => {
                    const meta = PILLAR_META[p.sector];
                    return (
                      <div key={p.id} className="border border-white/10 bg-[#060a13] p-4 space-y-2.5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1 max-w-xl">
                            <div className="flex flex-wrap items-center gap-2 text-[11px]">
                              <span style={{ color: meta.color }} className="font-semibold">
                                {meta.title}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums text-amber-300">
                                Est. ₹{p.estimatedCostLakhs.toFixed(1)} Lakhs
                              </span>
                              <span aria-hidden="true">·</span>
                              <span
                                className={
                                  p.status === "Sanctioned"
                                    ? "text-emerald-300 font-medium"
                                    : p.status === "Shortlisted in Ward Budget"
                                    ? "text-cyan-300 font-medium"
                                    : "text-slate-400"
                                }
                              >
                                {p.status}
                              </span>
                            </div>
                            <h3 className="text-sm font-semibold text-white">{p.title}</h3>
                            <p className="text-xs text-slate-300 leading-relaxed">{p.rationale}</p>
                            <div className="text-[11px] text-slate-400">
                              {p.location} · Authority: {p.assignedLeaderRole} · Proposed by {p.proposerName}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => mutateCommunity(`/api/community/budget-proposals/${p.id}/vote`)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border transition ${
                                p.votedByUser
                                  ? "border-emerald-400 bg-emerald-600 text-white"
                                  : "border-cyan-500/45 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25"
                              }`}
                            >
                              <ThumbsUp size={12} />
                              <span className="font-mono tabular-nums">Vote ({p.votes})</span>
                            </button>

                            <select
                              value={p.status}
                              onChange={(e) =>
                                mutateCommunity(`/api/community/budget-proposals/${p.id}/status`, {
                                  status: e.target.value,
                                })
                              }
                              aria-label={`Budget status for ${p.title}`}
                              className="border border-white/15 bg-[#0a0f1c] px-2 py-1 text-[11px] text-slate-200"
                            >
                              <option value="Proposed">Proposed</option>
                              <option value="Shortlisted in Ward Budget">Shortlisted in Ward Budget</option>
                              <option value="Sanctioned">Sanctioned</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* RIGHT: Ward Committees, Area Sabhas & Gram Sabhas */}
              <section className="lg:col-span-5 space-y-6">
                {state.wardMeetings.map((mtg) => (
                  <div
                    key={mtg.id}
                    className={`border p-5 space-y-4 ${
                      mtg.status === "Upcoming"
                        ? "border-cyan-500/40 bg-[#0a0f1c]"
                        : "border-white/12 bg-[#0a0f1c]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-mono text-cyan-300">
                          {mtg.sabhaType} · {mtg.status}
                        </div>
                        <h3 className="text-base font-semibold text-white mt-0.5">{mtg.title}</h3>
                        <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-1.5">
                          <Calendar size={12} className="text-amber-300" />
                          <span>{mtg.dateLabel} ({mtg.timeSlot})</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Venue: {mtg.venue} · Chair: {mtg.chairRole}
                        </div>
                      </div>

                      {mtg.status === "Upcoming" && (
                        <button
                          type="button"
                          onClick={() => mutateCommunity(`/api/community/ward-meetings/${mtg.id}/rsvp`)}
                          className={`px-3 py-1.5 text-xs font-semibold shrink-0 whitespace-nowrap ${
                            mtg.rsvpedByUser
                              ? "bg-emerald-600 text-white"
                              : "border border-cyan-500/45 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25"
                          }`}
                        >
                          {mtg.rsvpedByUser ? `Attending (${mtg.attendeeCount})` : `RSVP (${mtg.attendeeCount})`}
                        </button>
                      )}
                    </div>

                    <div className="border-t border-white/10 pt-3 space-y-2">
                      <div className="text-xs font-semibold text-slate-200">
                        Official Agenda Items ({mtg.agendaItems.length})
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {mtg.agendaItems.map((ag, i) => (
                          <li key={i} className="border border-white/10 bg-[#060a13] px-3 py-2">
                            {i + 1}. {ag}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {mtg.status === "Upcoming" ? (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!agendaInput.trim()) return;
                          await mutateCommunity("/api/community/ward-meetings/agenda", {
                            meetingId: mtg.id,
                            agendaItem: agendaInput,
                          });
                          setAgendaInput("");
                          setNoticeBanner("Citizen agenda item added to upcoming Sabha docket.");
                        }}
                        className="flex gap-2 pt-1"
                      >
                        <input
                          type="text"
                          value={agendaInput}
                          onChange={(e) => setAgendaInput(e.target.value)}
                          placeholder="Add resident agenda item for this Sabha..."
                          className="flex-1 border border-white/15 bg-[#060911] px-3 py-1.5 text-xs text-white"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white whitespace-nowrap"
                        >
                          Add Agenda
                        </button>
                      </form>
                    ) : (
                      mtg.resolutionSummary && (
                        <div className="border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                          <strong>Signed Resolution:</strong> {mtg.resolutionSummary}
                        </div>
                      )
                    )}
                  </div>
                ))}

                {/* Export Sabha Brief Box */}
                <div className="border border-white/12 bg-[#0a0f1c] p-5 space-y-3">
                  <div className="text-sm font-semibold text-white">
                    Take Verified Citizen Priorities to the Sabha
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Download the complete Ward Committee / Gram Sabha Docket combining top-voted Participatory Budget items, Sabha agenda lines, and open Civic Tech tickets.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleExportSabhaBrief}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white"
                    >
                      <Download size={13} />
                      <span>Export Sabha Civic Brief (.txt)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-white/15 bg-white/[0.04] hover:bg-white/10 text-slate-200"
                    >
                      <Printer size={13} />
                      <span>Print</span>
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* =========================================================
            STRAND 2: CIVIC TECH (REPORT ISSUE WITH LIVE CAMERA + SOLUTION ROUTER)
        ========================================================= */}
        {activeTab === "civic_tech" && (
          <div className="space-y-8">
            <div className="grid lg:grid-cols-12 gap-6 items-start">
              {/* LEFT: Geo-Tagged Civic Issue Intake + Live Camera */}
              <section className="lg:col-span-6 border border-white/12 bg-[#0a0f1c] p-6 space-y-4">
                <div className="border-b border-white/10 pb-3">
                  <div className="text-xs font-medium text-amber-300">
                    Civic Tech · Geo-Tagged Grievance Intake
                  </div>
                  <h2 className="text-lg font-semibold text-white mt-0.5">
                    Report a Neighborhood Issue &amp; Route the Solution
                  </h2>
                </div>

                {/* Jurisdiction & Sector */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Local Body Jurisdiction</label>
                    <select
                      value={settlementType}
                      onChange={(e) => setSettlementType(e.target.value as SettlementType)}
                      className="w-full border border-white/15 bg-[#060911] px-2.5 py-2 text-xs text-white"
                    >
                      <option value="Rural Gram Panchayat">Rural Gram Panchayat</option>
                      <option value="Municipal Ward / Town">Municipal Ward / Town</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Sector Category</label>
                    <select
                      value={reportSector}
                      onChange={(e) => setReportSector(e.target.value as CommunitySectorKey)}
                      className="w-full border border-white/15 bg-[#060911] px-2.5 py-2 text-xs text-white"
                    >
                      {PILLAR_ORDER.map((k) => (
                        <option key={k} value={k}>
                          {PILLAR_META[k].title} ({PILLAR_META[k].sdg})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Specific Issue Type</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full border border-white/15 bg-[#060911] px-3 py-2 text-xs text-white"
                  >
                    {sectorCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Issue Title</label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="e.g., Broken drinking water valve flooding SC Colony lane"
                    className="w-full border border-white/15 bg-[#060911] px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">Landmark / Street / Asset</label>
                    <input
                      type="text"
                      value={reportInst}
                      onChange={(e) => setReportInst(e.target.value)}
                      className="w-full border border-white/15 bg-[#060911] px-2.5 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Residents Impacted</label>
                    <input
                      type="number"
                      min={1}
                      value={affectedPeople}
                      onChange={(e) => setAffectedPeople(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full border border-white/15 bg-[#060911] px-2.5 py-2 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Detailed Evidence &amp; Duration</label>
                  <textarea
                    rows={2}
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    placeholder="How long has this persisted? Which officer or committee needs to inspect?"
                    className="w-full border border-white/15 bg-[#060911] px-3 py-2 text-xs text-white"
                  />
                </div>

                {/* Working Live Camera Capture */}
                <div className="border border-white/10 bg-[#060a13] p-3.5 space-y-2">
                  <div className="text-xs font-medium text-white">
                    Live Camera / Device Photo Evidence (GPS-Stamped)
                  </div>
                  <LiveCameraCapture
                    mode="before"
                    villageLabel={`${activeVillageName}, ${activeDistrictName}`}
                    gpsLabel={gpsCoords.label}
                    caption={reportTitle || sectorCategories[0]?.label || "Civic Evidence"}
                    photoUrl={beforePhotoUrl}
                    onPhotoChange={setBeforePhotoUrl}
                  />
                </div>

                {/* GPS Pin + Voice Dictation */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePinLocation}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-cyan-500/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20"
                  >
                    <MapPin size={13} />
                    <span>Lock GPS Location</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleStartVoiceDictation}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border ${
                      isListening
                        ? "border-amber-400 bg-amber-500/20 text-amber-200"
                        : "border-white/15 bg-white/[0.04] text-slate-200"
                    }`}
                  >
                    {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                    <span>{isListening ? "Listening..." : "Dictate (Telugu/English)"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleAudioRecording()}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border ${
                      isRecordingAudio
                        ? "border-red-400 bg-red-500/20 text-red-200"
                        : "border-white/15 bg-white/[0.04] text-slate-200"
                    }`}
                  >
                    <Mic size={13} />
                    <span>{isRecordingAudio ? "Stop Audio" : audioDataUrl ? "Audio Attached" : "Voice Note"}</span>
                  </button>
                </div>

                <div className="text-[11px] font-mono text-slate-400">GPS: {gpsCoords.label}</div>

                {/* 50m Smart Proximity Deduplication Alert */}
                {nearbyDuplicatePin && (
                  <div className="border border-cyan-500/45 bg-cyan-500/10 p-3.5 text-xs space-y-2">
                    <div className="font-semibold text-cyan-200">
                      Duplicate Check: Similar issue open {nearbyDuplicatePin.distanceMeters}m away
                    </div>
                    <p className="text-slate-300">
                      &ldquo;{nearbyDuplicatePin.issue.title}&rdquo; already has{" "}
                      <strong>{nearbyDuplicatePin.issue.upvotes} co-signs</strong>. Add strength to the existing report instead of duplicating:
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        void mutateCommunity(`/api/community/issues/${nearbyDuplicatePin.issue.id}/upvote`);
                        setSelectedCaseId(nearbyDuplicatePin.issue.id);
                        setNoticeBanner("Supported nearby civic report (+1 co-sign).");
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white"
                    >
                      Support Existing Report (+1)
                    </button>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Urgency Level</label>
                    <select
                      value={reportSeverity}
                      onChange={(e) => setReportSeverity(e.target.value as "Critical" | "High" | "Moderate")}
                      className="w-full border border-white/15 bg-[#060911] px-2.5 py-2 text-xs text-white"
                    >
                      <option value="Critical">Critical (Immediate Hazard)</option>
                      <option value="High">High Priority</option>
                      <option value="Moderate">Moderate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Your Name / Role</label>
                    <input
                      type="text"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      className="w-full border border-white/15 bg-[#060911] px-2.5 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              </section>

              {/* RIGHT: Actionable Solution Router (Govt Officer/MLA vs NGO vs Youth) */}
              <section className="lg:col-span-6 space-y-5">
                <div className="border border-amber-500/40 bg-[#0a0f1c] p-6 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-medium text-amber-300">Recommended Solution Route</div>
                      <h3 className="text-lg font-semibold text-white mt-0.5">{liveSolution.primaryHeadline}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{liveSolution.decisionSummary}</p>

                  {/* 3-Pathway Suitability Comparison */}
                  <div className="space-y-2.5 pt-1">
                    {liveSolution.pathwayScores.map((ps) => (
                      <div key={ps.key} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-white">
                            {ps.label} — <span className="text-slate-400 font-normal">{ps.roleSummary}</span>
                          </span>
                          <span className="font-mono tabular-nums text-amber-300">{ps.suitabilityPct}%</span>
                        </div>
                        <div className="h-1.5 bg-white/10 overflow-hidden">
                          <div
                            className={`h-full ${
                              ps.key === "govt" ? "bg-amber-400" : ps.key === "ngo" ? "bg-indigo-400" : "bg-emerald-400"
                            }`}
                            style={{ width: `${ps.suitabilityPct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Path 1: Officer / Sarpanch / Corporator / MLA Petition */}
                <div className="border border-white/12 bg-[#0a0f1c] p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                      <Landmark size={15} />
                      <span>Path 1 · Contact Govt Officer / {settlementType === "Municipal Ward / Town" ? "Corporator" : "Sarpanch"} / MLA</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {liveSolution.escalationTiers.map((t) => (
                      <div key={t.tier} className="border border-white/10 bg-[#060a13] p-2.5">
                        <div className="flex justify-between gap-2">
                          <span className="font-medium text-white">{t.authority}</span>
                          <span className="font-mono text-amber-300 shrink-0">{t.slaWindow}</span>
                        </div>
                        <div className="text-slate-400 mt-0.5">{t.channel}</div>
                      </div>
                    ))}
                  </div>

                  <div className="border border-white/10 bg-[#050912] p-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-slate-400">Draft Official Citizen Representation</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy("draft-pet", liveSolution.petitionText)}
                          className="inline-flex items-center gap-1 text-amber-300 hover:underline"
                        >
                          <Copy size={11} />
                          <span>{copiedId === "draft-pet" ? "Copied" : "Copy Petition"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadFile("citizen-petition.txt", liveSolution.petitionText)}
                          className="inline-flex items-center gap-1 text-slate-300 hover:text-white"
                        >
                          <Download size={11} />
                          <span>.TXT</span>
                        </button>
                      </div>
                    </div>
                    <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap max-h-28 overflow-y-auto leading-relaxed">
                      {liveSolution.petitionText}
                    </pre>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={ticketRefForNew}
                      onChange={(e) => setTicketRefForNew(e.target.value)}
                      placeholder="Optional Prajavani / CPGRAMS Ticket ID"
                      className="flex-1 border border-white/15 bg-[#060911] px-2.5 py-2 text-xs font-mono text-white"
                    />
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void submitCivicIssueWithAction("escalate_govt")}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white whitespace-nowrap"
                    >
                      <Send size={13} />
                      <span>Submit &amp; Escalate to Officer / MLA</span>
                    </button>
                  </div>
                </div>

                {/* Action Paths 2 & 3: NGO Collaboration + Youth & Student Squad */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="border border-white/12 bg-[#0a0f1c] p-4 space-y-2.5">
                    <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                      <Handshake size={14} />
                      <span>Path 2 · Collaborate with NGO</span>
                    </div>
                    <select
                      value={selectedNgoForNew}
                      onChange={(e) => setSelectedNgoForNew(e.target.value)}
                      className="w-full border border-white/15 bg-[#060911] px-2 py-1.5 text-xs text-white"
                    >
                      {NGO_PARTNER_DIRECTORY.map((n) => (
                        <option key={n.name} value={n.name}>
                          {n.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void submitCivicIssueWithAction("collab_ngo")}
                      className="w-full py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
                    >
                      Publish &amp; Dispatch NGO Brief
                    </button>
                  </div>

                  <div className="border border-white/12 bg-[#0a0f1c] p-4 space-y-2.5">
                    <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                      <Users size={14} />
                      <span>Path 3 · Youth &amp; Student Action</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                      {PILLAR_META[reportSector].youthKidsRoleSummary}
                    </p>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void submitCivicIssueWithAction("mobilize_youth")}
                      className="w-full py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      Publish &amp; Launch Youth Drive
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {/* Public Issue Redressal Tracker & Before/After Verification */}
            <section className="border border-white/12 bg-[#0a0f1c] p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Public Issue Redressal Ledger &amp; Before/After Verification ({filteredIssues.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Inspect any community report to co-sign (+1), save Prajavani ticket IDs, link an NGO, or verify closure with a live After-photo.
                  </p>
                </div>
                <div className="relative w-64">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={caseSearch}
                    onChange={(e) => setCaseSearch(e.target.value)}
                    placeholder="Filter civic issues..."
                    className="w-full border border-white/15 bg-[#060911] pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
                  {filteredIssues.map((iss) => (
                    <button
                      key={iss.id}
                      type="button"
                      onClick={() => setSelectedCaseId(iss.id)}
                      className={`w-full text-left border p-3.5 space-y-1.5 transition ${
                        activeCase?.id === iss.id
                          ? "border-amber-400 bg-[#0e1526]"
                          : "border-white/10 bg-[#060a13] hover:bg-[#0b111e]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span style={{ color: PILLAR_META[iss.sector].color }} className="font-medium">
                          {PILLAR_META[iss.sector].title}
                        </span>
                        <span className="font-mono text-slate-400 uppercase">{iss.status}</span>
                      </div>
                      <div className="text-xs font-semibold text-white">{iss.title}</div>
                      <div className="text-[11px] text-slate-400">
                        {iss.institutionName} · {iss.villageName} · {iss.upvotes} co-signs
                      </div>
                    </button>
                  ))}
                </div>

                {activeCase && (
                  <div className="lg:col-span-7 border border-white/10 bg-[#060a13] p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-amber-300 font-medium">
                          {PILLAR_META[activeCase.sector].title} · {activeCase.severity} Priority
                        </div>
                        <h4 className="text-base font-semibold text-white mt-0.5">{activeCase.title}</h4>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {activeCase.institutionName} · {activeCase.gpsLabel}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => mutateCommunity(`/api/community/issues/${activeCase.id}/upvote`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-cyan-500/45 bg-cyan-500/15 text-cyan-200 shrink-0"
                      >
                        <ThumbsUp size={12} />
                        <span className="font-mono tabular-nums">Support Issue ({activeCase.upvotes})</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{activeCase.description}</p>

                    {(() => {
                      const sla = getIssueSlaMetrics(activeCase);
                      const toneClass =
                        sla.status === "overdue"
                          ? "border-rose-500/45 bg-rose-500/10 text-rose-200"
                          : sla.status === "due_soon"
                          ? "border-amber-400/45 bg-amber-500/10 text-amber-200"
                          : sla.status === "resolved"
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                          : "border-cyan-400/35 bg-cyan-500/10 text-cyan-200";
                      const barClass =
                        sla.status === "overdue"
                          ? "bg-rose-500"
                          : sla.status === "due_soon"
                          ? "bg-amber-400"
                          : sla.status === "resolved"
                          ? "bg-emerald-400"
                          : "bg-cyan-400";
                      return (
                        <div className={`border p-3 space-y-2 ${toneClass}`}>
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono tabular-nums">
                            <span className="flex items-center gap-1.5 font-semibold">
                              <Clock size={13} />
                              <span>Prajavani SLA Watch · {sla.countdownLabel}</span>
                            </span>
                            <span>Elapsed: {sla.elapsedDays}d</span>
                          </div>
                          <div className="h-1.5 w-full bg-black/40 overflow-hidden">
                            <div className={`h-full ${barClass}`} style={{ width: `${sla.progressPct}%` }} />
                          </div>
                        </div>
                      );
                    })()}

                    <div className="grid sm:grid-cols-2 gap-3 text-xs">
                      <div className="border border-white/10 bg-[#0a0f1c] p-3 space-y-2">
                        <div className="font-semibold text-amber-300">Log Officer / MLA Ticket Ref</div>
                        <input
                          type="text"
                          value={caseEscalationTarget}
                          onChange={(e) => setCaseEscalationTarget(e.target.value)}
                          className="w-full border border-white/15 bg-[#060911] px-2.5 py-1.5 text-xs text-white"
                        />
                        <input
                          type="text"
                          value={caseTicketInput}
                          onChange={(e) => setCaseTicketInput(e.target.value)}
                          placeholder="Prajavani / CPGRAMS Ref"
                          className="w-full border border-white/15 bg-[#060911] px-2.5 py-1.5 text-xs font-mono text-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            void mutateCommunity(`/api/community/issues/${activeCase.id}/escalate`, {
                              escalatedTo: caseEscalationTarget,
                              govtTicketRef: caseTicketInput,
                              actorName: reporterName,
                            });
                            setNoticeBanner("Escalation target & ticket ref saved.");
                          }}
                          className="px-3 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-500 text-white"
                        >
                          Save Escalation Ticket
                        </button>
                      </div>

                      <div className="border border-white/10 bg-[#0a0f1c] p-3 space-y-2">
                        <div className="font-semibold text-indigo-300">Link NGO or Turn into Drive</div>
                        <select
                          value={caseNgoSelect}
                          onChange={(e) => setCaseNgoSelect(e.target.value)}
                          className="w-full border border-white/15 bg-[#060911] px-2 py-1.5 text-xs text-white"
                        >
                          {NGO_PARTNER_DIRECTORY.map((n) => (
                            <option key={n.name} value={n.name}>
                              {n.name}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              mutateCommunity(`/api/community/issues/${activeCase.id}/adopt`, {
                                ngoName: caseNgoSelect,
                              })
                            }
                            className="flex-1 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white"
                          >
                            Link NGO
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              mutateCommunity(`/api/community/issues/${activeCase.id}/mobilize-youth`, {
                                driveTitle: `Fix Drive: ${activeCase.title.slice(0, 45)}`,
                              })
                            }
                            className="flex-1 py-1.5 text-xs font-medium border border-emerald-500/45 bg-emerald-500/15 text-emerald-200"
                          >
                            Make Drive
                          </button>
                        </div>
                      </div>
                    </div>

                    <BeforeAfterProofCompare issue={activeCase} />

                    {activeCase.status !== "resolved" && (
                      <div className="border border-emerald-500/35 bg-[#0a0f1c] p-3.5 space-y-3">
                        <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                          <ShieldCheck size={14} />
                          <span>Verify Completion with After-Resolution Photo</span>
                        </div>
                        <LiveCameraCapture
                          mode="after"
                          villageLabel={`${activeCase.villageName}, ${activeCase.districtName}`}
                          gpsLabel={activeCase.gpsLabel}
                          caption={`Resolved: ${activeCase.title}`}
                          photoUrl={caseAfterPhotoUrl}
                          onPhotoChange={setCaseAfterPhotoUrl}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            mutateCommunity(`/api/community/issues/${activeCase.id}/resolve`, {
                              verifierName: reporterName,
                              peerVerified: true,
                              afterPhotoUrl: caseAfterPhotoUrl || undefined,
                            })
                          }
                          className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          Verify &amp; Mark Resolved
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* =========================================================
            STRAND 3: COUNCILLORS' & ELECTED LEADERS' ACCOUNTABILITY
        ========================================================= */}
        {activeTab === "leaders" && (
          <div className="space-y-8">
            {/* Prajavani / Officer SLA Countdown Watch Summary */}
            <section className="border border-white/12 bg-[#0a0f1c] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                    <Clock size={14} />
                    <span>Prajavani &amp; Officer Statutory SLA Countdown Watch</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time clock against Telangana citizen charter turnaround targets (4d Critical · 7d GP/Ward · 14d Mandal/District).
                  </p>
                </div>
                {(() => {
                  const openIssues = state.issues.filter((i) => i.status !== "resolved");
                  const overdueCount = openIssues.filter((i) => getIssueSlaMetrics(i).status === "overdue").length;
                  const dueSoonCount = openIssues.filter((i) => getIssueSlaMetrics(i).status === "due_soon").length;
                  const onTrackCount = Math.max(0, openIssues.length - overdueCount - dueSoonCount);
                  return (
                    <div className="flex flex-wrap gap-2 text-xs font-mono tabular-nums">
                      <span className="border border-rose-500/40 bg-rose-500/15 px-2.5 py-1 text-rose-200">
                        {overdueCount} SLA Overdue
                      </span>
                      <span className="border border-amber-400/40 bg-amber-500/15 px-2.5 py-1 text-amber-200">
                        {dueSoonCount} Due &lt;48h
                      </span>
                      <span className="border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-1 text-emerald-200">
                        {onTrackCount} On Track
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {state.issues
                  .filter((i) => i.status !== "resolved")
                  .slice(0, 6)
                  .map((iss) => {
                    const sla = getIssueSlaMetrics(iss);
                    const tone =
                      sla.status === "overdue"
                        ? "border-rose-500/45 text-rose-200"
                        : sla.status === "due_soon"
                        ? "border-amber-400/45 text-amber-200"
                        : "border-white/10 text-cyan-200";
                    return (
                      <div key={iss.id} className={`border ${tone} bg-[#060a13] p-3 space-y-2`}>
                        <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                          <span>{iss.severity} · {PILLAR_META[iss.sector].title}</span>
                          <span className="font-semibold">{sla.status === "overdue" ? "OVERDUE" : `${sla.targetDays}d SLA`}</span>
                        </div>
                        <div className="text-xs font-semibold text-white truncate">{iss.title}</div>
                        <div className="text-[11px] font-mono tabular-nums opacity-90">{sla.countdownLabel}</div>
                        <div className="h-1 bg-white/10 overflow-hidden">
                          <div
                            className={`h-full ${
                              sla.status === "overdue"
                                ? "bg-rose-500"
                                : sla.status === "due_soon"
                                ? "bg-amber-400"
                                : "bg-cyan-400"
                            }`}
                            style={{ width: `${sla.progressPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>

            {/* 3 Governance Leadership Cards */}
            <section className="grid lg:grid-cols-3 gap-5 items-start">
              {state.wardLeaders.map((leader) => (
                <div key={leader.id} className="border border-white/12 bg-[#0a0f1c] p-5 space-y-4">
                  <div className="space-y-1 border-b border-white/10 pb-3">
                    <div className="text-[11px] font-mono text-amber-300">{leader.tier}</div>
                    <h2 className="text-base font-semibold text-white">{leader.roleTitle}</h2>
                    <div className="text-xs text-slate-400">
                      {leader.officeName} · {activeVillageName} ({activeDistrictName})
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{leader.statutoryMandate}</p>

                  <div className="grid grid-cols-3 gap-2 border border-white/10 bg-[#060a13] p-3 text-center font-mono tabular-nums">
                    <div>
                      <div className="text-[10px] text-slate-400">Target SLA</div>
                      <div className="text-sm font-semibold text-amber-300">{leader.slaDays}d</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Resolved</div>
                      <div className="text-sm font-semibold text-emerald-300">{leader.resolvedCount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Fund Use</div>
                      <div className="text-sm font-semibold text-cyan-300">{leader.budgetUtilizedPct}%</div>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400">
                    Channel: {leader.helplineOrPortal}
                  </div>

                  {/* Direct Dispatch to This Leader */}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const subj = (leaderSubjects[leader.id] || "").trim();
                      if (!subj) return;
                      await mutateCommunity(`/api/community/leaders/${leader.id}/dispatch`, {
                        subject: subj,
                        sender: reporterName,
                        linkedRef: (leaderTicketRefs[leader.id] || "").trim() || undefined,
                      });
                      setLeaderSubjects((prev) => ({ ...prev, [leader.id]: "" }));
                      setLeaderTicketRefs((prev) => ({ ...prev, [leader.id]: "" }));
                      setNoticeBanner(`Formal representation logged for ${leader.roleTitle}.`);
                    }}
                    className="border border-white/10 bg-[#060a13] p-3 space-y-2"
                  >
                    <div className="text-[11px] font-semibold text-cyan-300">
                      Dispatch Citizen Representation
                    </div>
                    <input
                      type="text"
                      value={leaderSubjects[leader.id] || ""}
                      onChange={(e) =>
                        setLeaderSubjects((prev) => ({ ...prev, [leader.id]: e.target.value }))
                      }
                      placeholder="Issue, budget item, or inspection request..."
                      className="w-full border border-white/15 bg-[#0a0f1c] px-2.5 py-1.5 text-xs text-white"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={leaderTicketRefs[leader.id] || ""}
                        onChange={(e) =>
                          setLeaderTicketRefs((prev) => ({ ...prev, [leader.id]: e.target.value }))
                        }
                        placeholder="Ticket Ref (optional)"
                        className="flex-1 border border-white/15 bg-[#0a0f1c] px-2.5 py-1.5 text-xs font-mono text-white"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white whitespace-nowrap"
                      >
                        Dispatch
                      </button>
                    </div>
                  </form>

                  {/* Dispatched Requests Log */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-medium text-slate-400">
                      Recent Dispatches ({leader.dispatchedRequests.length})
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {leader.dispatchedRequests.length === 0 ? (
                        <div className="text-[11px] text-slate-500 italic">
                          No escalations queued yet.
                        </div>
                      ) : (
                        leader.dispatchedRequests.map((req) => (
                          <div key={req.id} className="border border-white/10 bg-[#050811] p-2 text-[11px]">
                            <div className="text-slate-200 font-medium">{req.subject}</div>
                            <div className="text-slate-400 mt-0.5">
                              {req.sender} · {req.date}
                              {req.linkedRef ? ` · Ref: ${req.linkedRef}` : ""}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </section>

            {/* Bottom Grid: Statutory Ward Audit Matrix + Official Telangana Helplines */}
            <section className="grid lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 border border-white/12 bg-[#0a0f1c] p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <div className="text-xs font-medium text-amber-300 flex items-center gap-1.5">
                      <ClipboardCheck size={14} />
                      <span>Ward / Panchayat Statutory Performance Audit</span>
                    </div>
                    <h3 className="text-base font-semibold text-white mt-0.5">
                      Verify Service Delivery Benchmarks Before Sabha Meetings
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {PILLAR_ORDER.map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setAuditSector(k)}
                        className={`px-2.5 py-1 text-[11px] border whitespace-nowrap ${
                          auditSector === k
                            ? "border-amber-400 bg-amber-500/20 text-amber-200"
                            : "border-white/12 text-slate-400"
                        }`}
                      >
                        {PILLAR_META[k].title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  {auditObligations.map((obl) => (
                    <div
                      key={obl.id}
                      className="border border-white/10 bg-[#060a13] p-3.5 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5 max-w-xl">
                        <div className="text-xs font-semibold text-white">{obl.title}</div>
                        <div className="text-[11px] text-slate-400">
                          {obl.description}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          Target: {obl.targetMetric} · Verified Contributors: {obl.contributorsCount}
                        </div>
                      </div>
                      <select
                        value={obl.status}
                        onChange={(e) =>
                          mutateCommunity(`/api/community/obligations/${obl.id}/status`, {
                            status: e.target.value,
                          })
                        }
                        aria-label={`Audit status for ${obl.title}`}
                        className={`border px-2.5 py-1 text-xs font-medium focus:outline-none ${
                          obl.status === "Completed"
                            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                            : obl.status === "In Progress"
                            ? "border-amber-500/40 bg-amber-500/15 text-amber-200"
                            : "border-white/15 bg-[#0a0f1c] text-slate-300"
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4 border border-white/12 bg-[#0a0f1c] p-5 space-y-4">
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <PhoneCall size={15} className="text-amber-400" />
                  <span>Official Grievance Helplines</span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="border border-white/10 bg-[#060a13] p-3">
                    <div className="font-semibold text-white">Telangana Collectorate Prajavani</div>
                    <div className="text-amber-300 font-mono mt-0.5">prajavani.telangana.gov.in</div>
                    <div className="text-slate-400 mt-0.5">Weekly District Collector grievance review</div>
                  </div>
                  <div className="border border-white/10 bg-[#060a13] p-3">
                    <div className="font-semibold text-white">Municipal &amp; Panchayat Helpline</div>
                    <div className="text-cyan-300 font-mono mt-0.5">Dial 1902 · CPGRAMS pgportal.gov.in</div>
                    <div className="text-slate-400 mt-0.5">Sanitation, streetlights, drains &amp; schemes</div>
                  </div>
                  <div className="border border-white/10 bg-[#060a13] p-3">
                    <div className="font-semibold text-white">Essential Sectoral Helplines</div>
                    <div className="text-slate-300 mt-1 space-y-0.5 font-mono">
                      <div>Mission Bhagiratha Water: 1800-425-7470</div>
                      <div>Health Advisory / PHC: Dial 104</div>
                      <div>Childline / Dropout Help: Dial 1098</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* =========================================================
            STRAND 4: CIVIC LEARNING (BALA JANAAGRAHA, YOUTH DRIVES & CERTIFICATES)
        ========================================================= */}
        {activeTab === "learning" && (
          <div className="space-y-8">
            {/* Bala Janaagraha Experiential Civic Labs */}
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-medium text-emerald-300 flex items-center gap-1.5">
                    <BookOpen size={14} />
                    <span>Bala Civic Labs · Experiential School &amp; Youth Curriculum</span>
                  </div>
                  <h2 className="text-xl font-semibold text-white mt-0.5">
                    Hands-On Civic Learning for Students &amp; Young Citizens ({completedModulesCount}/{CIVIC_LEARNING_CURRICULUM.length} Completed)
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Learner: {reporterName}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {CIVIC_LEARNING_CURRICULUM.map((mod) => {
                  const prog = state.learningProgress.find((lp) => lp.moduleId === mod.id);
                  const isDone = Boolean(prog?.completedByUser);
                  const meta = PILLAR_META[mod.sector];

                  return (
                    <div
                      key={mod.id}
                      className={`border p-5 space-y-3 ${
                        isDone ? "border-emerald-500/45 bg-[#0a0f1c]" : "border-white/12 bg-[#0a0f1c]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[11px] font-mono" style={{ color: meta.color }}>
                            {mod.code} · {mod.ageGroup} · {mod.duration}
                          </div>
                          <h3 className="text-base font-semibold text-white mt-0.5">{mod.title}</h3>
                        </div>
                        <span
                          className={`text-[11px] font-mono px-2 py-0.5 border shrink-0 ${
                            isDone
                              ? "border-emerald-500/45 bg-emerald-500/15 text-emerald-300"
                              : "border-white/15 text-slate-400"
                          }`}
                        >
                          {isDone ? "Completed" : `${prog?.completionsCount ?? 0} learners`}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{mod.objective}</p>
                      <div className="border border-white/10 bg-[#060a13] p-3 text-xs text-slate-300">
                        <strong className="text-cyan-300">Field Task:</strong> {mod.fieldTask}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={learningReflections[mod.id] ?? prog?.latestReflection ?? ""}
                          onChange={(e) =>
                            setLearningReflections((prev) => ({ ...prev, [mod.id]: e.target.value }))
                          }
                          placeholder={mod.discussionPrompt}
                          className="flex-1 border border-white/15 bg-[#060911] px-2.5 py-1.5 text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            await mutateCommunity(`/api/community/learning/${mod.id}/complete`, {
                              learnerName: kidName.trim() || reporterName,
                              reflection: learningReflections[mod.id] || prog?.latestReflection || "",
                            });
                            setNoticeBanner(`Completed "${mod.title}" (+1 Civic Hour logged).`);
                          }}
                          className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white whitespace-nowrap"
                        >
                          {isDone ? "Update Field Note" : "Complete Civic Lab"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Scheduled Youth Action Drives & Wishlist */}
            <section className="grid lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 border border-white/12 bg-[#0a0f1c] p-6 space-y-4">
                <div className="border-b border-white/10 pb-3">
                  <h3 className="text-base font-semibold text-white">
                    Youth &amp; Neighborhood Action Drives ({state.drives.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Schedule daytime community drives (18+ NSS or teacher-consented Eco-Clubs) and RSVP.
                  </p>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newDriveTitle.trim()) return;
                    await mutateCommunity("/api/community/drives", {
                      sector: reportSector,
                      title: newDriveTitle,
                      dateLabel: newDriveDate,
                      landmark: newDriveLandmark || `${activeVillageName} School / Grounds`,
                      organizer: `${reporterName} + Civic Youth Squad`,
                      capacity: 35,
                    });
                    setNewDriveTitle("");
                    setNoticeBanner("Youth action drive scheduled.");
                  }}
                  className="grid sm:grid-cols-4 gap-2"
                >
                  <input
                    type="text"
                    required
                    value={newDriveTitle}
                    onChange={(e) => setNewDriveTitle(e.target.value)}
                    placeholder="New drive title (e.g., Tank Bund Clean-Up)"
                    className="sm:col-span-2 border border-white/15 bg-[#060911] px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={newDriveDate}
                    onChange={(e) => setNewDriveDate(e.target.value)}
                    className="border border-white/15 bg-[#060911] px-2.5 py-2 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white"
                  >
                    Create Drive
                  </button>
                </form>

                <div className="grid sm:grid-cols-2 gap-3.5">
                  {state.drives.map((drv) => (
                    <div key={drv.id} className="border border-white/10 bg-[#060a13] p-4 flex flex-col justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-[11px] font-medium" style={{ color: PILLAR_META[drv.sector].color }}>
                          {PILLAR_META[drv.sector].title}
                        </div>
                        <div className="text-sm font-semibold text-white">{drv.title}</div>
                        <div className="text-xs text-slate-400">
                          {drv.dateLabel} · {drv.timeSlot}
                        </div>
                        <div className="text-xs font-mono text-cyan-300 flex items-center gap-1">
                          <MapPin size={11} />
                          <span>{drv.landmark}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-xs">
                        <span className="font-mono tabular-nums text-slate-300">
                          {drv.rsvpCount}/{drv.capacity} Volunteers
                        </span>
                        <button
                          type="button"
                          onClick={() => mutateCommunity(`/api/community/drives/${drv.id}/rsvp`)}
                          className={`px-3 py-1.5 text-xs font-medium ${
                            drv.joinedByUser
                              ? "bg-emerald-600 text-white"
                              : "border border-cyan-500/45 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25"
                          }`}
                        >
                          {drv.joinedByUser ? "Joined" : "Join Drive"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Material Wishlist + My Tree Buddy */}
              <div className="lg:col-span-5 space-y-6">
                <div className="border border-white/12 bg-[#0a0f1c] p-5 space-y-3.5">
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <PackagePlus size={16} className="text-amber-400" />
                    <span>School &amp; Ward Supply Wishlist</span>
                  </div>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!wishItemName.trim()) return;
                      await mutateCommunity("/api/community/wishlist", {
                        sector: reportSector,
                        institution: `${activeNearestSchool || activeVillageName}`,
                        item: wishItemName,
                        needed: wishQty,
                        unit: "units",
                      });
                      setWishItemName("");
                    }}
                    className="grid grid-cols-4 gap-2"
                  >
                    <input
                      type="text"
                      value={wishItemName}
                      onChange={(e) => setWishItemName(e.target.value)}
                      placeholder="Need (e.g., Books, Test Kits)"
                      className="col-span-2 border border-white/15 bg-[#060911] px-2.5 py-1.5 text-xs text-white"
                    />
                    <input
                      type="number"
                      min={1}
                      value={wishQty}
                      onChange={(e) => setWishQty(Math.max(1, Number(e.target.value) || 1))}
                      className="border border-white/15 bg-[#060911] px-2 py-1.5 text-xs font-mono text-white"
                    />
                    <button type="submit" className="px-2 py-1.5 text-xs font-medium bg-amber-600 text-white">
                      Add
                    </button>
                  </form>

                  <div className="space-y-2.5">
                    {state.wishlists.map((w) => {
                      const pct = Math.min(100, Math.round((w.fulfilled / Math.max(1, w.needed)) * 100));
                      return (
                        <div key={w.id} className="border border-white/10 bg-[#060a13] p-3 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="font-semibold text-white">{w.item}</div>
                              <div className="text-[11px] text-slate-400">{w.institution}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => mutateCommunity(`/api/community/wishlist/${w.id}/pledge`)}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
                            >
                              + Sponsor 1
                            </button>
                          </div>
                          <div className="flex justify-between text-[11px] font-mono text-slate-400 tabular-nums">
                            <span>{pct}% funded</span>
                            <span>{w.fulfilled}/{w.needed} {w.unit}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* My Tree Buddy */}
                <div className="border border-lime-500/35 bg-[#0a0f1c] p-5 space-y-3">
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <Sprout size={16} className="text-lime-400" />
                    <span>&ldquo;My Tree Buddy&rdquo; Sapling Stewardship ({state.saplings.length})</span>
                  </div>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await mutateCommunity("/api/community/saplings/adopt", {
                        guardianName: kidName.trim() || reporterName,
                        species: saplingSpecies,
                        landmark: saplingLandmark || `${activeVillageName} School Bund`,
                        villageName: activeVillageName,
                      });
                      setNoticeBanner("Sapling adopted! Added to 24-month guardian tracker.");
                    }}
                    className="grid sm:grid-cols-3 gap-2"
                  >
                    <select
                      value={saplingSpecies}
                      onChange={(e) => setSaplingSpecies(e.target.value)}
                      className="border border-white/15 bg-[#060911] px-2 py-1.5 text-xs text-white"
                    >
                      <option>Native Neem (Azadirachta)</option>
                      <option>Pongamia / Kanuga</option>
                      <option>Jamun (Syzygium cumini)</option>
                    </select>
                    <input
                      type="text"
                      value={saplingLandmark}
                      onChange={(e) => setSaplingLandmark(e.target.value)}
                      placeholder="Location"
                      className="border border-white/15 bg-[#060911] px-2.5 py-1.5 text-xs text-white"
                    />
                    <button type="submit" className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white">
                      Adopt Sapling
                    </button>
                  </form>
                </div>
              </div>
            </section>

            {/* Youth Civic Badges & Downloadable Certificates */}
            <section className="border border-white/12 bg-[#0a0f1c] p-6 grid lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-6 space-y-3">
                <div className="flex items-center gap-2 text-base font-semibold text-white">
                  <Award size={17} className="text-amber-400" />
                  <span>Student &amp; Youth Civic Champion Certificate</span>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!kidName.trim() || !parentConsent) return;
                    const res = await mutateCommunity("/api/community/bal-mitra", {
                      studentName: kidName,
                      schoolOrWard: kidSchool || activeNearestSchool || `${activeVillageName} School`,
                      activity: `${selectedBadge}: ${kidActivity}`,
                      badgeName: selectedBadge,
                      sector:
                        selectedBadge === "Water Guardian"
                          ? "water"
                          : selectedBadge === "Vidya Mentor"
                          ? "education"
                          : selectedBadge === "Home Mosquito Patrol"
                          ? "health"
                          : "environment",
                      parentConsent,
                    });
                    if (res?.certificate) setLatestCert(res.certificate);
                    setKidName("");
                    setNoticeBanner(`Issued "${selectedBadge}" certificate.`);
                  }}
                  className="space-y-2.5"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {["Water Guardian", "Plastic Warrior", "Vidya Mentor", "Home Mosquito Patrol"].map((badge) => (
                      <button
                        key={badge}
                        type="button"
                        onClick={() => setSelectedBadge(badge)}
                        className={`px-2 py-1.5 text-[11px] font-medium border ${
                          selectedBadge === badge
                            ? "border-amber-400 bg-amber-600/25 text-amber-200"
                            : "border-white/12 bg-[#060911] text-slate-300"
                        }`}
                      >
                        {badge}
                      </button>
                    ))}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={kidName}
                      onChange={(e) => setKidName(e.target.value)}
                      placeholder="Student / Youth Full Name"
                      className="border border-white/15 bg-[#060911] px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={kidSchool}
                      onChange={(e) => setKidSchool(e.target.value)}
                      placeholder={activeNearestSchool || "School / Ward"}
                      className="border border-white/15 bg-[#060911] px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <input
                    type="text"
                    value={kidActivity}
                    onChange={(e) => setKidActivity(e.target.value)}
                    className="w-full border border-white/15 bg-[#060911] px-3 py-2 text-xs text-white"
                  />
                  <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={parentConsent}
                      onChange={(e) => setParentConsent(e.target.checked)}
                      className="accent-emerald-400"
                    />
                    <span>Parent / Teacher Written Consent Confirmed (Safe Daytime Role)</span>
                  </label>
                  <button
                    type="submit"
                    disabled={!parentConsent}
                    className="w-full py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white"
                  >
                    Generate &amp; Issue Certificate
                  </button>
                </form>
              </div>

              <div className="lg:col-span-6 space-y-4">
                {(latestCert ?? state.certificates[0]) && (
                  <div className="border border-amber-400/45 bg-[#07111b] p-5 space-y-2">
                    <div className="text-[11px] font-mono text-amber-300">
                      CIVIC PARTICIPATION · DIGITAL STUDENT BADGE CERTIFICATE
                    </div>
                    <div className="text-base font-semibold text-white">
                      {(latestCert ?? state.certificates[0]).studentName}
                    </div>
                    <div className="text-xs text-emerald-200">
                      {(latestCert ?? state.certificates[0]).activity} ·{" "}
                      {(latestCert ?? state.certificates[0]).schoolOrWard}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] font-mono text-slate-400">
                      <span>
                        ID: {(latestCert ?? state.certificates[0]).certCode} · {(latestCert ?? state.certificates[0]).issuedAt}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const c = latestCert ?? state.certificates[0];
                          downloadFile(
                            `${c.certCode}.txt`,
                            `CIVIC PARTICIPATION CERTIFICATE\nID: ${c.certCode}\nRecipient: ${c.studentName}\nSchool/Ward: ${c.schoolOrWard}\nActivity: ${c.activity}\nParent/Teacher Consent: Verified\nDate: ${c.issuedAt}\nLocality: ${activeVillageName}, ${activeDistrictName}`
                          );
                        }}
                        className="inline-flex items-center gap-1 text-amber-300 hover:underline"
                      >
                        <FileText size={12} />
                        <span>Download Certificate</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="border border-white/10 bg-[#060a13] p-4 space-y-2">
                  <div className="text-xs font-semibold text-white">Active Civic Stewards</div>
                  <div className="divide-y divide-white/10">
                    {state.champions.slice(0, 4).map((ch) => (
                      <div key={ch.id} className="py-2 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-medium text-white">{ch.name}</span>
                          <span className="text-slate-400"> · {ch.badge}</span>
                        </div>
                        <span className="font-mono tabular-nums text-emerald-300">{ch.hours} hrs</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
