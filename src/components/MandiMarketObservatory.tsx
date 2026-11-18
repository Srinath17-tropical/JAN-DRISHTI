import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  MapPin,
  Scale,
  TrendingUp,
  Truck,
} from "lucide-react";
import type { SectorInsightsVillage } from "./SectorActionModules";

type CropCommodityKey = "paddy" | "cotton" | "turmeric" | "chilli" | "maize" | "redgram";

type CropProfile = {
  key: CropCommodityKey;
  label: string;
  mspBenchmarkInr: number;
  unitLabel: string;
  fpoValueAddPct: number;
  gradeNote: string;
};

type ApmcMandiYard = {
  id: string;
  name: string;
  district: string;
  lat: number;
  lon: number;
  eNamEnabled: boolean;
  coldStorageMt: number;
  pricesByCrop: Record<CropCommodityKey, number>;
};

const COMMODITY_PROFILES: CropProfile[] = [
  {
    key: "paddy",
    label: "Paddy (Grade-A / Sona Masoori)",
    mspBenchmarkInr: 2320,
    unitLabel: "₹ / quintal",
    fpoValueAddPct: 14,
    gradeNote: "Telangana Kharif/Yasangi staple · ₹500/qtl fine-variety State bonus eligible at PACS",
  },
  {
    key: "cotton",
    label: "Cotton (Medium/Long Staple Kapas)",
    mspBenchmarkInr: 7521,
    unitLabel: "₹ / quintal",
    fpoValueAddPct: 11,
    gradeNote: "Moisture ≤ 8% fetches CCI/e-NAM premium across central Telangana ginning clusters",
  },
  {
    key: "turmeric",
    label: "Turmeric (Curcuma Finger)",
    mspBenchmarkInr: 11800,
    unitLabel: "₹ / quintal (benchmark)",
    fpoValueAddPct: 22,
    gradeNote: "Steam-cured solar-dried fingers earn direct export premiums via Nizamabad/Warangal FPOs",
  },
  {
    key: "chilli",
    label: "Dry Red Chilli (Teja / Sannam)",
    mspBenchmarkInr: 15500,
    unitLabel: "₹ / quintal (benchmark)",
    fpoValueAddPct: 19,
    gradeNote: "Solar cold-storage deferral avoids distress harvest drops of ₹1,800–₹2,600/qtl",
  },
  {
    key: "maize",
    label: "Maize (Yellow Feed/Starch Grade)",
    mspBenchmarkInr: 2225,
    unitLabel: "₹ / quintal",
    fpoValueAddPct: 12,
    gradeNote: "Poultry & ethanol off-take contracts stabilize farm-gate realization above MSP",
  },
  {
    key: "redgram",
    label: "Red Gram (Tur / Arhar Dal)",
    mspBenchmarkInr: 7550,
    unitLabel: "₹ / quintal",
    fpoValueAddPct: 18,
    gradeNote: "Mandal mini-dal-mill grading keeps ₹1,300+/qtl margin inside village SHG federations",
  },
];

const TELANGANA_APMC_YARDS: ApmcMandiYard[] = [
  {
    id: "enam_wgl",
    name: "Enumamula Agricultural Market (e-NAM)",
    district: "Warangal",
    lat: 17.988,
    lon: 79.622,
    eNamEnabled: true,
    coldStorageMt: 18500,
    pricesByCrop: {
      paddy: 2490,
      cotton: 7680,
      turmeric: 12450,
      chilli: 17400,
      maize: 2340,
      redgram: 7890,
    },
  },
  {
    id: "enam_nzb",
    name: "Nizamabad APMC Market Yard (e-NAM)",
    district: "Nizamabad",
    lat: 18.672,
    lon: 78.094,
    eNamEnabled: true,
    coldStorageMt: 11200,
    pricesByCrop: {
      paddy: 2450,
      cotton: 7490,
      turmeric: 13650,
      chilli: 16100,
      maize: 2390,
      redgram: 7740,
    },
  },
  {
    id: "enam_khm",
    name: "Khammam Wyra Road APMC Yard",
    district: "Khammam",
    lat: 17.247,
    lon: 80.151,
    eNamEnabled: true,
    coldStorageMt: 22000,
    pricesByCrop: {
      paddy: 2440,
      cotton: 7610,
      turmeric: 11900,
      chilli: 18150,
      maize: 2310,
      redgram: 7680,
    },
  },
  {
    id: "enam_sdp",
    name: "Siddipet Integrated APMC Hub",
    district: "Siddipet / Medak",
    lat: 18.101,
    lon: 78.852,
    eNamEnabled: true,
    coldStorageMt: 8400,
    pricesByCrop: {
      paddy: 2515,
      cotton: 7590,
      turmeric: 12100,
      chilli: 16250,
      maize: 2375,
      redgram: 7810,
    },
  },
  {
    id: "enam_srp",
    name: "Suryapet Hi-Tech APMC Yard",
    district: "Nalgonda / Suryapet",
    lat: 17.139,
    lon: 79.623,
    eNamEnabled: true,
    coldStorageMt: 9600,
    pricesByCrop: {
      paddy: 2530,
      cotton: 7540,
      turmeric: 11750,
      chilli: 16850,
      maize: 2285,
      redgram: 7960,
    },
  },
  {
    id: "enam_krm",
    name: "Karimnagar Cotton & Grain APMC",
    district: "Karimnagar",
    lat: 18.438,
    lon: 79.128,
    eNamEnabled: true,
    coldStorageMt: 9200,
    pricesByCrop: {
      paddy: 2475,
      cotton: 7740,
      turmeric: 12280,
      chilli: 16300,
      maize: 2360,
      redgram: 7790,
    },
  },
  {
    id: "enam_mbn",
    name: "Mahbubnagar Jadcherla APMC Hub",
    district: "Mahbubnagar",
    lat: 16.759,
    lon: 78.136,
    eNamEnabled: true,
    coldStorageMt: 7800,
    pricesByCrop: {
      paddy: 2460,
      cotton: 7560,
      turmeric: 11620,
      chilli: 16450,
      maize: 2335,
      redgram: 8040,
    },
  },
  {
    id: "enam_hyd",
    name: "Bowenpally / Rajendranagar Urban Mandi",
    district: "Hyderabad / Rangareddy",
    lat: 17.465,
    lon: 78.474,
    eNamEnabled: true,
    coldStorageMt: 16400,
    pricesByCrop: {
      paddy: 2545,
      cotton: 7510,
      turmeric: 12800,
      chilli: 17200,
      maize: 2410,
      redgram: 8120,
    },
  },
];

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return Number((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
}

export default function MandiMarketObservatory({
  village,
}: {
  village: SectorInsightsVillage | null;
}) {
  const [selectedCrop, setSelectedCrop] = useState<CropCommodityKey>("paddy");

  const [vLat, vLon] = useMemo(() => {
    if (typeof village?.lat === "number" && typeof village?.lon === "number") {
      return [village.lat, village.lon];
    }
    return [17.85, 78.82];
  }, [village]);

  const cropMeta = useMemo(
    () => COMMODITY_PROFILES.find((c) => c.key === selectedCrop) ?? COMMODITY_PROFILES[0],
    [selectedCrop]
  );

  // Compute freight cost & net farm-gate realization per quintal from active village coordinates
  const rankedYards = useMemo(() => {
    return TELANGANA_APMC_YARDS.map((yard) => {
      const roadKm = Number((haversineKm(vLat, vLon, yard.lat, yard.lon) * 1.24).toFixed(1));
      const transportPerQtl = Math.round(roadKm * 1.45 + 32); // Diesel tractor/DCM + hamali loading
      const grossModal = yard.pricesByCrop[selectedCrop];
      const netRealization = grossModal - transportPerQtl;
      const spreadVsMsp = netRealization - cropMeta.mspBenchmarkInr;
      return {
        ...yard,
        shortLabel: yard.district.split("/")[0].trim(),
        roadKm,
        transportPerQtl,
        grossModal,
        netRealization,
        spreadVsMsp,
      };
    }).sort((a, b) => b.netRealization - a.netRealization);
  }, [vLat, vLon, selectedCrop, cropMeta.mspBenchmarkInr]);

  const bestYard = rankedYards[0];
  const nearestYard = [...rankedYards].sort((a, b) => a.roadKm - b.roadKm)[0];
  const fpoProcessedPrice = Math.round(
    bestYard.netRealization * (1 + cropMeta.fpoValueAddPct / 100)
  );

  return (
    <section className="border border-white/12 bg-[#070b12] p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="text-xs font-semibold text-pink-300 flex items-center gap-2">
            <Scale size={15} />
            <span>e-NAM APMC Price vs Rural Transport Margin Tracker (SDG 8)</span>
          </div>
          <h3 className="mt-1 text-lg font-semibold text-white">
            Net Farm-Gate Realization from {village?.villageName ?? "Active Village"} to Nearest Telangana Mandis
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Accounts for estimated road haulage &amp; hamali deductions (₹1.45/km/qtl + ₹32 handling) so village farmers pick the highest net margin—not just highest sticker price.
          </p>
        </div>

        {/* Commodity Selector */}
        <div className="flex flex-wrap gap-1.5">
          {COMMODITY_PROFILES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setSelectedCrop(c.key)}
              className={`px-3 py-1.5 text-xs font-medium border transition ${
                selectedCrop === c.key
                  ? "border-pink-400 bg-pink-500/20 text-pink-100"
                  : "border-white/12 bg-white/[0.02] text-slate-300 hover:border-white/25"
              }`}
            >
              {c.label.split("(")[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Top Recommendation Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-emerald-400/30 bg-[#04080e] p-4 space-y-1">
          <div className="text-[11px] text-emerald-300 flex items-center justify-between">
            <span>Highest Net-Margin Yard</span>
            <TrendingUp size={13} />
          </div>
          <div className="text-sm font-semibold text-white truncate">{bestYard.name}</div>
          <div className="font-mono text-2xl font-bold tabular-nums text-emerald-300">
            ₹{bestYard.netRealization.toLocaleString("en-IN")}
            <span className="text-xs font-normal text-slate-400"> /qtl net</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 tabular-nums">
            {bestYard.roadKm} km · Freight ₹{bestYard.transportPerQtl}/qtl deducted
          </div>
        </div>

        <div className="border border-white/10 bg-[#04080e] p-4 space-y-1">
          <div className="text-[11px] text-cyan-300 flex items-center justify-between">
            <span>Nearest APMC Hub</span>
            <MapPin size={13} />
          </div>
          <div className="text-sm font-semibold text-white truncate">{nearestYard.name}</div>
          <div className="font-mono text-2xl font-bold tabular-nums text-white">
            {nearestYard.roadKm} km
          </div>
          <div className="text-[11px] font-mono text-slate-400 tabular-nums">
            Net ₹{nearestYard.netRealization.toLocaleString("en-IN")}/qtl · Cold cap{" "}
            {nearestYard.coldStorageMt.toLocaleString()} MT
          </div>
        </div>

        <div className="border border-white/10 bg-[#04080e] p-4 space-y-1">
          <div className="text-[11px] text-amber-300 flex items-center justify-between">
            <span>MSP / Fair Reference Spread</span>
            <Truck size={13} />
          </div>
          <div className="text-sm font-semibold text-white truncate">{cropMeta.label}</div>
          <div className="font-mono text-2xl font-bold tabular-nums text-amber-300">
            {bestYard.spreadVsMsp >= 0 ? "+" : ""}₹{bestYard.spreadVsMsp.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] font-mono text-slate-400 tabular-nums">
            vs ₹{cropMeta.mspBenchmarkInr.toLocaleString("en-IN")}/qtl {cropMeta.unitLabel}
          </div>
        </div>

        <div className="border border-pink-400/25 bg-[#04080e] p-4 space-y-1">
          <div className="text-[11px] text-pink-300 flex items-center justify-between">
            <span>FPO Grading + Cold-Chain Upside</span>
            <ArrowUpRight size={13} />
          </div>
          <div className="text-sm font-semibold text-white">+{cropMeta.fpoValueAddPct}% Value Capture</div>
          <div className="font-mono text-2xl font-bold tabular-nums text-pink-300">
            ₹{fpoProcessedPrice.toLocaleString("en-IN")}
            <span className="text-xs font-normal text-slate-400"> /qtl</span>
          </div>
          <div className="text-[11px] text-slate-400 line-clamp-2">{cropMeta.gradeNote}</div>
        </div>
      </div>

      {/* Comparative Recharts Bar Chart + Freight Deduction Ledger */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 border border-white/10 bg-[#04080e] p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white">
              Gross Modal Price vs Net Farm-Gate Realization Across Telangana Mandis
            </span>
            <span className="font-mono text-[11px] text-slate-400">₹ per quintal</span>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rankedYards.slice(0, 6)}
                margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                <XAxis dataKey="shortLabel" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a0f1c",
                    borderColor: "rgba(255,255,255,0.16)",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar
                  dataKey="grossModal"
                  name="APMC Gross Modal (₹/qtl)"
                  fill="rgba(244,114,182,0.55)"
                />
                <Bar
                  dataKey="netRealization"
                  name="Net Realization After Freight (₹/qtl)"
                  fill="#10b981"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 border border-white/10 bg-[#04080e] p-4 space-y-2.5">
          <div className="text-xs font-semibold text-white flex items-center gap-2">
            <BriefcaseBusiness size={14} className="text-pink-300" />
            <span>Top Market Yard Margin Ledger</span>
          </div>
          <div className="space-y-1.5 max-h-[265px] overflow-y-auto pr-1">
            {rankedYards.slice(0, 6).map((yard, idx) => (
              <div
                key={yard.id}
                className="border border-white/8 bg-[#070c16] px-3 py-2 flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-medium text-white truncate">
                    #{idx + 1} {yard.name}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 tabular-nums">
                    {yard.roadKm} km · Freight -₹{yard.transportPerQtl} · Gross ₹
                    {yard.grossModal.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="text-right shrink-0 font-mono tabular-nums">
                  <div className="font-bold text-emerald-300">
                    ₹{yard.netRealization.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[10px] text-slate-400">Net/qtl</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
