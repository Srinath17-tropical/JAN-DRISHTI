import sdg04EducationImg from "../assets/images/sdg04_education_banner_1794975595835.jpg";
import sdg03HealthImg from "../assets/images/sdg03_health_banner_1794975596031.jpg";
import sdg06WaterImg from "../assets/images/sdg06_water_banner_1794975596086.jpg";
import sdg08LivelihoodImg from "../assets/images/sdg08_livelihood_banner_1794975597084.jpg";
import sdg13EnvironmentImg from "../assets/images/sdg13_environment_banner_1794975597144.jpg";

export type SdgSectorId =
  | "education"
  | "health"
  | "water"
  | "livelihood"
  | "environment";

export type SdgAssetMeta = {
  goalNumber: string;
  sdgLabel: string;
  officialColor: string;
  imageSrc: string;
  alt: string;
  caption: string;
};

export const SDG_SECTOR_ASSETS: Record<SdgSectorId, SdgAssetMeta> = {
  education: {
    goalNumber: "04",
    sdgLabel: "QUALITY EDUCATION",
    officialColor: "#C5192D",
    imageSrc: sdg04EducationImg,
    alt: "UN SDG 04 Quality Education — Telangana rural smart schoolhouse and students learning",
    caption: "SDG 04 · Inclusive Rural Classrooms, Female Literacy & Digital Access",
  },
  health: {
    goalNumber: "03",
    sdgLabel: "GOOD HEALTH & WELL-BEING",
    officialColor: "#4C9F38",
    imageSrc: sdg03HealthImg,
    alt: "UN SDG 03 Good Health and Well-being — Rural Palle Dawakhana clinic and clean waterways",
    caption: "SDG 03 · Palle Dawakhana Preventive Care, Sanitation & Clean Air",
  },
  water: {
    goalNumber: "06",
    sdgLabel: "CLEAN WATER & SANITATION",
    officialColor: "#26BDE2",
    imageSrc: sdg06WaterImg,
    alt: "UN SDG 06 Clean Water and Sanitation — Kakatiya cascading chain-tanks and village supply",
    caption: "SDG 06 · Golusu Kattu Chain-Tanks, 55 LPCD Taps & Aquifer Recharge",
  },
  livelihood: {
    goalNumber: "08",
    sdgLabel: "DECENT WORK & ECONOMIC GROWTH",
    officialColor: "#A21942",
    imageSrc: sdg08LivelihoodImg,
    alt: "UN SDG 08 Decent Work and Economic Growth — Rural SHG artisans, farmers and solar cold-chain",
    caption: "SDG 08 · SERP SHGs, FPO Value Chains & Year-Round Rural Work",
  },
  environment: {
    goalNumber: "13",
    sdgLabel: "CLIMATE ACTION & ECOLOGY",
    officialColor: "#3F7E44",
    imageSrc: sdg13EnvironmentImg,
    alt: "UN SDG 13 Climate Action — Sacred banyan-neem grove and rural solar micro-grid",
    caption: "SDG 13 · Haritha Haram Canopy, PM-KUSUM Solar & Thermal Resilience",
  },
};

export function SdgGoalBadge({
  sector,
  compact = false,
}: {
  sector: SdgSectorId;
  compact?: boolean;
}) {
  const meta = SDG_SECTOR_ASSETS[sector];
  return (
    <div
      className={`inline-flex items-center gap-2 border border-white/25 text-white shadow-sm ${
        compact ? "px-2 py-1" : "px-3 py-1.5"
      }`}
      style={{ backgroundColor: meta.officialColor }}
    >
      <span className={`font-black font-mono leading-none ${compact ? "text-sm" : "text-lg"}`}>
        {meta.goalNumber}
      </span>
      <span
        className={`font-bold tracking-wider uppercase leading-tight ${
          compact ? "text-[9px]" : "text-[10.5px]"
        }`}
      >
        {meta.sdgLabel}
      </span>
    </div>
  );
}
