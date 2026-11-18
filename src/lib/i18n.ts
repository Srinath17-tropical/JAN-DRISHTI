export type LanguageCode = "en" | "te" | "hi";

export const LANGUAGE_OPTIONS: { id: LanguageCode; label: string; native: string }[] = [
  { id: "en", label: "English", native: "EN" },
  { id: "te", label: "Telugu", native: "తెలుగు" },
  { id: "hi", label: "Hindi", native: "हिन्दी" },
];

type TranslationDictionary = {
  searchPlaceholder: string;
  backendOnline: string;
  backendOffline: string;
  checkingBackend: string;
  aiIntelligence: string;
  lightMode: string;
  darkMode: string;
  developmentSectors: string;
  futureReadiness: string;
  overview: string;
  education: string;
  health: string;
  water: string;
  livelihood: string;
  environment: string;
  viksitBackdrop: string;
  cycleSectionEyebrow: string;
  cycleSectionTitle: string;
  cycleSectionSub: string;
  cycleViciousBtn: string;
  cycleVirtuousBtn: string;
  macroEyebrow: string;
  macroTitle: string;
  macroSub: string;
  storyboardTitle: string;
  storyboardSub: string;
  playBriefing: string;
  pauseBriefing: string;
  downloadPng: string;
  exportVideo: string;
  voiceNarration: string;
  groundwaterTitle: string;
  educationInstitutionsTitle: string;
  hospitalMatrixTitle: string;
  waterbodyConditionTitle: string;
  livelihoodPlanTitle: string;
};

export const UI_TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
  en: {
    searchPlaceholder: "Search Telangana village by name...",
    backendOnline: "Backend Online",
    backendOffline: "Backend Offline",
    checkingBackend: "Checking Backend",
    aiIntelligence: "AI Intelligence",
    lightMode: "Light",
    darkMode: "Dark",
    developmentSectors: "Development Sectors",
    futureReadiness: "Future Readiness",
    overview: "Overview",
    education: "Education",
    health: "Health",
    water: "Water",
    livelihood: "Livelihood",
    environment: "Environment",
    viksitBackdrop: "VIKSIT BHARAT @2047",
    cycleSectionEyebrow: "SYSTEMIC TRANSFORMATION · BREAKING THE VICIOUS CYCLE",
    cycleSectionTitle: "Breaking the Vicious Cycle of Uneven Development",
    cycleSectionSub:
      "Toggle between the current compounding rural trap and how JAN—DRISHTI AI + GIS + Ancient Kakatiya Wisdom converts every vulnerability into a self-reinforcing Viksit Cycle.",
    cycleViciousBtn: "Vicious Cycle (Current Trap)",
    cycleVirtuousBtn: "Break Cycle → Virtuous Viksit Transition",
    macroEyebrow: "MACROECONOMIC BRIDGE · VIKSIT BHARAT @2047 ($30 TRILLION VISION)",
    macroTitle: "Inflation Balance (Food & Core) & Rupee Value Appreciation",
    macroSub:
      "How rural cold-chain infrastructure, tank-irrigated yields, PM-KUSUM solar pumps, and agro-value exports stabilize CPI inflation and strengthen INR purchasing power.",
    storyboardTitle: "Video Documentary, Photo Animator & Storyboard Studio (Free)",
    storyboardSub:
      "Render a real 30fps playable audiovisual video with photo Ken Burns motion, animated GIS boundaries, live metrics, and audio track — 100% free in your browser.",
    playBriefing: "Live Motion Preview",
    pauseBriefing: "Pause Preview",
    downloadPng: "Download PNG Poster",
    exportVideo: "Render Proper Video",
    voiceNarration: "Voiceover Narration",
    groundwaterTitle: "Telangana Latest Groundwater Levels & Visual Recharge Plan",
    educationInstitutionsTitle: "Education GIS Institutions Directory (Schools · Colleges · Universities)",
    hospitalMatrixTitle: "Telangana Healthcare Directory, Service Capabilities & Preventive Risk",
    waterbodyConditionTitle: "Environment & Waterbodies Condition + Visual Restoration Plan",
    livelihoodPlanTitle: "Livelihood Resilience Matrix & Visual Income Action Plan",
  },
  te: {
    searchPlaceholder: "తెలంగాణ గ్రామం పేరుతో శోధించండి...",
    backendOnline: "బ్యాకెండ్ ఆన్‌లైన్",
    backendOffline: "బ్యాకెండ్ ఆఫ్‌లైన్",
    checkingBackend: "పరిశీలిస్తోంది",
    aiIntelligence: "AI విశ్లేషణ",
    lightMode: "లైట్",
    darkMode: "డార్క్",
    developmentSectors: "అభివృద్ధి రంగాలు",
    futureReadiness: "భవిష్యత్ సంసిద్ధత",
    overview: "సమగ్ర వీక్షణ",
    education: "విద్య",
    health: "ఆరోగ్యం",
    water: "నీరు & భూగర్భజలం",
    livelihood: "జీవనోపాధి",
    environment: "పర్యావరణం",
    viksitBackdrop: "వికసిత్ భారత్ @2047",
    cycleSectionEyebrow: "అసమాన అభివృద్ధి విషవలయాన్ని ఛేదించడం",
    cycleSectionTitle: "అసమాన అభివృద్ధి విషవలయాన్ని అభివృద్ధి చక్రంగా మార్చడం",
    cycleSectionSub:
      "ప్రస్తుత గ్రామీణ సమస్యల వలయం నుండి JAN—DRISHTI AI + GIS + కాకతీయ జల సంప్రదాయంతో వికసిత్ అభివృద్ధి చక్రంగా మారే విధానాన్ని చూడండి.",
    cycleViciousBtn: "విషవలయం (ప్రస్తుత పరిస్థితి)",
    cycleVirtuousBtn: "వలయాన్ని ఛేదించు → వికసిత్ అభివృద్ధి",
    macroEyebrow: "ఆర్థిక సమతుల్యత · వికసిత్ భారత్ @2047",
    macroTitle: "ద్రవ్యోల్బణ నియంత్రణ (ఆహార & కోర్) మరియు రూపాయి విలువ బలోపేతం",
    macroSub:
      "గ్రామీణ కోల్డ్-చైన్, చెరువుల పునరుద్ధరణ, సోలార్ పంపులు మరియు ఎఫ్‌పీఓ ఎగుమతులు ఆహార ద్రవ్యోల్బణాన్ని తగ్గించి రూపాయి విలువను ఎలా బలోపేతం చేస్తాయో చూడండి.",
    storyboardTitle: "వీడియో డాక్యుమెంటరీ, ఫోటో యానిమేటర్ & స్టోరీబోర్డ్ స్టూడియో (ఉచితం)",
    storyboardSub:
      "ఫోటో యానిమేషన్, కదిలే GIS మ్యాప్ మరియు ఆడియో ట్రాక్‌తో నిజమైన 30fps వీడియోను తయారు చేసి ఇక్కడే ప్లే మరియు డౌన్‌లోడ్ చేయండి.",
    playBriefing: "లైవ్ మోషన్ ప్రివ్యూ",
    pauseBriefing: "ఆపండి",
    downloadPng: "PNG పోస్టర్ డౌన్‌లోడ్",
    exportVideo: "పూర్తి వీడియో తయారు చేయండి",
    voiceNarration: "వాయిస్ వివరణ",
    groundwaterTitle: "తెలంగాణ తాజా భూగర్భజల మట్టాలు & నీటి పరిష్కార ప్రణాళిక",
    educationInstitutionsTitle: "విద్యా సంస్థల GIS జాబితా (పాఠశాలలు · కళాశాలలు · విశ్వవిద్యాలయాలు)",
    hospitalMatrixTitle: "ఆరోగ్య సేవల డైరెక్టరీ, ఆసుపత్రి సామర్థ్యాలు & వ్యాధి ముందస్తు అంచనా",
    waterbodyConditionTitle: "పర్యావరణం & జలాశయాల స్థితి + పునరుద్ధరణ విజువల్ ప్రణాళిక",
    livelihoodPlanTitle: "జీవనోపాధి బలోపేతం & ఆదాయ వృద్ధి విజువల్ ప్రణాళిక",
  },
  hi: {
    searchPlaceholder: "तेलंगाना गाँव का नाम खोजें...",
    backendOnline: "सर्वर ऑनलाइन",
    backendOffline: "सर्वर ऑफलाइन",
    checkingBackend: "जाँच हो रही है",
    aiIntelligence: "AI नीति विश्लेषण",
    lightMode: "लाइट",
    darkMode: "डार्क",
    developmentSectors: "विकास क्षेत्र",
    futureReadiness: "भविष्य की तैयारी",
    overview: "समग्र अवलोकन",
    education: "शिक्षा",
    health: "स्वास्थ्य",
    water: "जल एवं भूजल",
    livelihood: "आजीविका",
    environment: "पर्यावरण",
    viksitBackdrop: "विकसित भारत @2047",
    cycleSectionEyebrow: "असमान विकास के दुष्चक्र को तोड़ना",
    cycleSectionTitle: "असमान विकास के दुष्चक्र से समृद्धि के सुचक्र की ओर",
    cycleSectionSub:
      "देखें कि कैसे JAN—DRISHTI AI + GIS और पारंपरिक काकतीय जल ज्ञान वर्तमान ग्रामीण दुष्चक्र को आत्मनिर्भर विकसित चक्र में बदलता है।",
    cycleViciousBtn: "दुष्चक्र (वर्तमान चुनौती)",
    cycleVirtuousBtn: "चक्र तोड़ें → विकसित भारत रूपांतरण",
    macroEyebrow: "वृहद आर्थिक संतुलन · विकसित भारत @2047 ($30 ट्रिलियन लक्ष्य)",
    macroTitle: "मुद्रास्फीति संतुलन (खाद्य एवं कोर) और रुपये की मजबूती",
    macroSub:
      "ग्रामीण कोल्ड-चेन, तालाब सिंचाई, पीएम-कुसुम सौर पंप और कृषि-प्रसंस्करण निर्यात किस प्रकार खाद्य महंगाई कम कर रुपये को मजबूत करते हैं।",
    storyboardTitle: "वीडियो डॉक्यूमेंट्री, फोटो एनिमेटर एवं स्टोरीबोर्ड स्टूडियो (निःशुल्क)",
    storyboardSub:
      "फोटो केन-बर्न्स मोशन, एनिमेटेड GIS सीमा और ऑडियो ट्रैक के साथ असली 30fps वीडियो यहीं रेंडर करें, चलाएँ और डाउनलोड करें।",
    playBriefing: "लाइव मोशन प्रीव्यू",
    pauseBriefing: "रोकें",
    downloadPng: "PNG पोस्टर डाउनलोड",
    exportVideo: "असली वीडियो बनाएँ",
    voiceNarration: "आवाज़ विवरण",
    groundwaterTitle: "तेलंगाना नवीनतम भूजल स्तर एवं जल समाधान विज़ुअल योजना",
    educationInstitutionsTitle: "शिक्षा GIS संस्थान निर्देशिका (स्कूल · कॉलेज · विश्वविद्यालय)",
    hospitalMatrixTitle: "स्वास्थ्य सेवा निर्देशिका, अस्पताल क्षमता एवं रोग जोखिम स्क्रीनिंग",
    waterbodyConditionTitle: "पर्यावरण एवं जल निकायों की स्थिति + विज़ुअल समाधान",
    livelihoodPlanTitle: "आजीविका सशक्तिकरण एवं आय वृद्धि विज़ुअल योजना",
  },
};

export function translateDomainLabel(
  id: string,
  lang: LanguageCode,
  fallback: string
): string {
  const t = UI_TRANSLATIONS[lang];
  if (id === "overview") return t.overview;
  if (id === "education") return t.education;
  if (id === "health") return t.health;
  if (id === "water") return t.water;
  if (id === "livelihood") return t.livelihood;
  if (id === "environment") return t.environment;
  return fallback;
}
