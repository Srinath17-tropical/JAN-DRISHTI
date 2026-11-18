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
    imageSrc: "/assets/sdg/sdg04.jpg",
    alt: "Official United Nations Sustainable Development Goal 4: Quality Education",
    caption: "UN SDG 04 · Inclusive Quality Education & Lifelong Learning",
  },
  health: {
    goalNumber: "03",
    sdgLabel: "GOOD HEALTH & WELL-BEING",
    officialColor: "#4C9F38",
    imageSrc: "/assets/sdg/sdg03.jpg",
    alt: "Official United Nations Sustainable Development Goal 3: Good Health and Well-Being",
    caption: "UN SDG 03 · Healthy Lives & Preventive Well-Being for All Ages",
  },
  water: {
    goalNumber: "06",
    sdgLabel: "CLEAN WATER & SANITATION",
    officialColor: "#26BDE2",
    imageSrc: "/assets/sdg/sdg06.jpg",
    alt: "Official United Nations Sustainable Development Goal 6: Clean Water and Sanitation",
    caption: "UN SDG 06 · Safe Drinking Water, Sanitation & Tank Sustainability",
  },
  livelihood: {
    goalNumber: "08",
    sdgLabel: "DECENT WORK & ECONOMIC GROWTH",
    officialColor: "#A21942",
    imageSrc: "/assets/sdg/sdg08.jpg",
    alt: "Official United Nations Sustainable Development Goal 8: Decent Work and Economic Growth",
    caption: "UN SDG 08 · Productive Employment, SHG Enterprise & Economic Growth",
  },
  environment: {
    goalNumber: "13",
    sdgLabel: "CLIMATE ACTION",
    officialColor: "#3F7E44",
    imageSrc: "/assets/sdg/sdg13.jpg",
    alt: "Official United Nations Sustainable Development Goal 13: Climate Action",
    caption: "UN SDG 13 · Urgent Climate Resilience, Green Canopy & Clean Energy",
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
      className={`inline-flex items-center gap-2 border border-white/25 text-white ${
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
