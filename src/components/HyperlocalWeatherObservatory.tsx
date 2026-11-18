import { useEffect, useMemo, useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CloudRain,
  Droplets,
  Flame,
  RefreshCw,
  Sun,
  ThermometerSun,
  Waves,
  Wind,
} from "lucide-react";
import type { SectorInsightsVillage } from "./SectorActionModules";

type WeatherTelemetryResponse = {
  source: string;
  lat: number;
  lon: number;
  villageName: string;
  districtName: string;
  fetchedAt: string;
  current: {
    tempC: number;
    apparentTempC: number;
    humidityPct: number;
    windKmh: number;
    weatherCode: number;
    rainMm: number;
    pm25: number;
    pm10: number;
    usAqi: number;
  };
  forecast7dRainMm: number;
  heatAdvisory: {
    level: string;
    tone: "critical" | "amber" | "emerald";
    workWindow: string;
    guidance: string;
  };
  hourly: {
    hour: string;
    tempC: number;
    rainMm: number;
    rainProbPct: number;
  }[];
  daily: {
    date: string;
    label: string;
    maxTempC: number;
    minTempC: number;
    rainMm: number;
    uvMax: number;
    weatherCode: number;
  }[];
};

function weatherCodeLabel(code: number): string {
  if (code >= 95) return "Thunderstorm";
  if (code >= 80) return "Rain Showers";
  if (code >= 61) return "Steady Rain";
  if (code >= 51) return "Light Drizzle";
  if (code >= 45) return "Morning Mist";
  if (code >= 3) return "Overcast";
  if (code >= 1) return "Partly Cloudy";
  return "Clear Sky";
}

function getGeometryLatLon(geometry: unknown, fallbackLat?: number, fallbackLon?: number): [number, number] {
  if (typeof fallbackLat === "number" && typeof fallbackLon === "number") {
    return [fallbackLat, fallbackLon];
  }
  if (geometry && typeof geometry === "object") {
    const g = geometry as { type?: string; coordinates?: unknown };
    let ring: number[][] = [];
    if (g.type === "Polygon" && Array.isArray(g.coordinates)) {
      ring = (g.coordinates as number[][][])[0] ?? [];
    } else if (g.type === "MultiPolygon" && Array.isArray(g.coordinates)) {
      ring = (g.coordinates as number[][][][])[0]?.[0] ?? [];
    }
    if (ring.length > 0) {
      let sLat = 0;
      let sLon = 0;
      for (const pt of ring) {
        sLon += pt[0];
        sLat += pt[1];
      }
      return [Number((sLat / ring.length).toFixed(3)), Number((sLon / ring.length).toFixed(3))];
    }
  }
  return [17.385, 78.4867];
}

export default function HyperlocalWeatherObservatory({
  village,
}: {
  village: SectorInsightsVillage | null;
}) {
  const [coordsLat, coordsLon] = useMemo(
    () => getGeometryLatLon(village?.geometry, village?.lat, village?.lon),
    [village]
  );

  const [data, setData] = useState<WeatherTelemetryResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchWeather(lat: number, lon: number, vName: string, dName: string) {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        village: vName,
        district: dName,
      });
      const res = await fetch(`/api/telemetry/weather?${qs.toString()}`);
      if (res.ok) {
        const json = (await res.json()) as WeatherTelemetryResponse;
        setData(json);
      }
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchWeather(
      coordsLat,
      coordsLon,
      village?.villageName ?? "Telangana State Center",
      village?.districtName ?? "Hyderabad"
    );
  }, [coordsLat, coordsLon, village?.villageName, village?.districtName]);

  const estimatedTankCaptureMl = useMemo(() => {
    const rain = data?.forecast7dRainMm ?? village?.environment.forecastRainMm ?? 0;
    const areaSqKm = village?.areaSqKm ?? 6.5;
    // Conservative 14% surface runoff capture factor across village watershed
    return Number((rain * areaSqKm * 0.14).toFixed(1));
  }, [data?.forecast7dRainMm, village]);

  const aqiLevel = useMemo(() => {
    const aqi = data?.current.usAqi ?? village?.environment.usAqi ?? 65;
    if (aqi <= 50) return { label: "Good", color: "text-emerald-300", border: "border-emerald-400/30" };
    if (aqi <= 100) return { label: "Moderate", color: "text-cyan-300", border: "border-cyan-400/30" };
    if (aqi <= 150) return { label: "Sensitive Risk", color: "text-amber-300", border: "border-amber-400/30" };
    return { label: "Unhealthy", color: "text-rose-300", border: "border-rose-400/30" };
  }, [data?.current.usAqi, village?.environment.usAqi]);

  const heatBannerStyle =
    data?.heatAdvisory.tone === "critical"
      ? "border-rose-500/40 bg-rose-500/10 text-rose-100"
      : data?.heatAdvisory.tone === "amber"
      ? "border-amber-400/40 bg-amber-500/10 text-amber-100"
      : "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";

  return (
    <section className="border border-white/12 bg-[#070b12] p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="text-xs font-semibold text-cyan-300 flex items-center gap-2">
            <ThermometerSun size={15} />
            <span>Hyperlocal Climate, Heatwave &amp; Tank Inflow Early-Warning</span>
          </div>
          <h3 className="mt-1 text-lg font-semibold text-white">
            {village ? `${village.villageName} (${village.districtName})` : "Telangana Live Weather"} ·{" "}
            <span className="font-mono text-xs text-slate-400 tabular-nums">
              {coordsLat.toFixed(3)}°N, {coordsLon.toFixed(3)}°E
            </span>
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            {data?.source ?? "Loading live meteorological telemetry…"} · Synchronized with SDGs 6 (Tank Inflow) &amp; 13 (Heat &amp; Air Alert)
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void fetchWeather(
              coordsLat,
              coordsLon,
              village?.villageName ?? "Telangana State Center",
              village?.districtName ?? "Hyderabad"
            )
          }
          disabled={loading}
          className="inline-flex items-center gap-1.5 border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50 shrink-0"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span>{loading ? "Syncing…" : "Refresh Live Telemetry"}</span>
        </button>
      </div>

      {/* Top 4 Live Telemetry KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-white/10 bg-[#04080e] p-4 space-y-1">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Ambient &amp; Feels-Like</span>
            <Sun size={13} className="text-amber-400" />
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums text-white">
            {data ? `${data.current.tempC.toFixed(1)}°C` : "—"}
          </div>
          <div className="text-[11px] font-mono text-amber-300 tabular-nums">
            Feels {data ? `${data.current.apparentTempC.toFixed(1)}°C` : "—"} ·{" "}
            {data ? weatherCodeLabel(data.current.weatherCode) : "Syncing"}
          </div>
        </div>

        <div className="border border-white/10 bg-[#04080e] p-4 space-y-1">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Humidity &amp; Wind</span>
            <Wind size={13} className="text-cyan-400" />
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums text-cyan-300">
            {data ? `${data.current.humidityPct}%` : "—"}
          </div>
          <div className="text-[11px] font-mono text-slate-400 tabular-nums">
            Wind {data ? `${data.current.windKmh} km/h` : "—"} · Rain now{" "}
            {data ? `${data.current.rainMm} mm` : "0 mm"}
          </div>
        </div>

        <div className="border border-white/10 bg-[#04080e] p-4 space-y-1">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>7-Day Rain &amp; Tank Capture</span>
            <Waves size={13} className="text-sky-400" />
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums text-sky-300">
            {data ? `${data.forecast7dRainMm} mm` : "—"}
          </div>
          <div className="text-[11px] font-mono text-slate-400 tabular-nums">
            Est. {estimatedTankCaptureMl} ML runoff across {village?.water.tanksTotal ?? 0} tanks
          </div>
        </div>

        <div className={`border ${aqiLevel.border} bg-[#04080e] p-4 space-y-1`}>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>CAMS Air Quality</span>
            <Droplets size={13} className="text-lime-400" />
          </div>
          <div className={`font-mono text-2xl font-bold tabular-nums ${aqiLevel.color}`}>
            {data ? `AQI ${data.current.usAqi}` : "—"}
          </div>
          <div className="text-[11px] font-mono text-slate-400 tabular-nums">
            {aqiLevel.label} · PM2.5 {data?.current.pm25 ?? "—"} µg/m³
          </div>
        </div>
      </div>

      {/* Heatwave & Outdoor Worker Advisory Strip */}
      {data && (
        <div className={`border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${heatBannerStyle}`}>
          <div className="space-y-1">
            <div className="text-xs font-semibold flex items-center gap-2">
              <Flame size={14} />
              <span>{data.heatAdvisory.level} · Recommended Outdoor Work Window: {data.heatAdvisory.workWindow}</span>
            </div>
            <p className="text-xs opacity-90">{data.heatAdvisory.guidance}</p>
          </div>
          <div className="text-[11px] font-mono shrink-0 border border-white/15 bg-black/25 px-3 py-1.5">
            Synced {new Date(data.fetchedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      )}

      {/* 24-Hour Temperature vs Rainfall Chart + 7-Day Daily Strip */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 border border-white/10 bg-[#04080e] p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white">24-Hour Diurnal Heat &amp; Precipitation Curve</span>
            <span className="font-mono text-[11px] text-slate-400">Temp (°C) · Rain Prob (%)</span>
          </div>
          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data?.hourly ?? []} margin={{ top: 8, right: 10, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                <XAxis
                  dataKey="hour"
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  interval={2}
                />
                <YAxis
                  yAxisId="temp"
                  tick={{ fill: "#fbbf24", fontSize: 10 }}
                  domain={["auto", "auto"]}
                />
                <YAxis
                  yAxisId="rain"
                  orientation="right"
                  tick={{ fill: "#38bdf8", fontSize: 10 }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a0f1c",
                    borderColor: "rgba(255,255,255,0.16)",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  yAxisId="rain"
                  dataKey="rainProbPct"
                  name="Rain Probability (%)"
                  fill="rgba(56,189,248,0.35)"
                  barSize={10}
                />
                <Area
                  yAxisId="temp"
                  type="monotone"
                  dataKey="tempC"
                  name="Temp (°C)"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  fill="url(#tempGrad)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 border border-white/10 bg-[#04080e] p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white">7-Day Village Forecast &amp; UV Window</span>
            <CloudRain size={14} className="text-sky-400" />
          </div>
          <div className="space-y-1.5">
            {(data?.daily ?? []).map((d) => (
              <div
                key={d.date}
                className="flex items-center justify-between border border-white/8 bg-[#070c16] px-3 py-2 text-xs font-mono tabular-nums"
              >
                <span className="text-slate-200 w-24 shrink-0">{d.label}</span>
                <span className="text-slate-400 text-[11px] truncate flex-1 px-2">
                  {weatherCodeLabel(d.weatherCode)}
                </span>
                <span className="text-sky-300 w-16 text-right">{d.rainMm} mm</span>
                <span className="text-amber-300 w-20 text-right">
                  {d.maxTempC}°/{d.minTempC}°
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
