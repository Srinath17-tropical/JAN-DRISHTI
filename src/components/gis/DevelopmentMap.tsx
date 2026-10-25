import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  BriefcaseBusiness,
  Compass,
  Droplets,
  GraduationCap,
  HeartPulse,
  Layers,
  Leaf,
  Loader2,
  MapPin,
  Network,
  RotateCcw,
  Search,
} from "lucide-react";

const API_BASE = "/api";

type DomainType =
  | "overview"
  | "education"
  | "health"
  | "water"
  | "livelihood"
  | "environment";

type MetricMeta = {
  key: string;
  label: string;
  unit: string;
};

type FacilityPoint = {
  id: string;
  name: string;
  category: string;
  lat: number;
  lon: number;
  operator?: string;
};

type SectorGisResponse = {
  sector: DomainType;
  state: string;
  title: string;
  accent: string;
  palette: string[];
  default_metric: string;
  metrics: MetricMeta[];
  total_mandals: number;
  total_facilities_statewide: number;
  facilities: FacilityPoint[];
  districts?: GeoJSON.FeatureCollection;
  mandals: GeoJSON.FeatureCollection;
};

type DevelopmentMapProps = {
  activeDomain: DomainType;
  selectedLayer?: string;
  selectedVillageCode: string | null;
  selectedVillageGeometry?: unknown;
  selectedMandalCode?: string | null;
  onVillageSelect: (village: {
    village_code?: string | number;
    [key: string]: unknown;
  }) => void;
};

const SECTOR_TABS: {
  id: DomainType;
  label: string;
  color: string;
  icon: typeof Network;
}[] = [
  { id: "overview", label: "Composite", color: "#ff9933", icon: Network },
  { id: "education", label: "Education GIS", color: "#ef4444", icon: GraduationCap },
  { id: "health", label: "Health GIS", color: "#10b981", icon: HeartPulse },
  { id: "water", label: "Water GIS", color: "#06b6d4", icon: Droplets },
  { id: "livelihood", label: "Livelihood GIS", color: "#ec4899", icon: BriefcaseBusiness },
  { id: "environment", label: "Environment GIS", color: "#84cc16", icon: Leaf },
];

const TELANGANA_CENTER: [number, number] = [17.92, 79.12];
const TELANGANA_ZOOM = 7;

export default function DevelopmentMap({
  activeDomain,
  selectedVillageCode,
  selectedVillageGeometry,
  selectedMandalCode,
  onVillageSelect,
}: DevelopmentMapProps) {
  const [sector, setSector] = useState<DomainType>(activeDomain);
  const [gisData, setGisData] = useState<SectorGisResponse | null>(null);
  const [metricKey, setMetricKey] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [showMandals, setShowMandals] = useState<boolean>(true);
  const [showDistricts, setShowDistricts] = useState<boolean>(true);
  const [showFacilities, setShowFacilities] = useState<boolean>(true);

  const [focusedMandalCode, setFocusedMandalCode] = useState<string | null>(
    selectedMandalCode ?? null
  );
  const [mandalVillages, setMandalVillages] =
    useState<GeoJSON.FeatureCollection | null>(null);
  const [loadingVillages, setLoadingVillages] = useState<boolean>(false);

  const [searchFilter, setSearchFilter] = useState<string>("");
  const [hoveredInfo, setHoveredInfo] = useState<{
    title: string;
    subtitle: string;
    primaryLabel: string;
    primaryValue: string;
    extra: string;
  } | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const canvasRendererRef = useRef<L.Canvas | null>(null);
  const mandalLayerRef = useRef<L.GeoJSON | null>(null);
  const districtLayerRef = useRef<L.GeoJSON | null>(null);
  const villageLayerRef = useRef<L.GeoJSON | null>(null);
  const selectedPolyLayerRef = useRef<L.GeoJSON | null>(null);
  const facilityLayerRef = useRef<L.LayerGroup | null>(null);

  // Sync sector tab when parent domain changes
  useEffect(() => {
    setSector(activeDomain);
  }, [activeDomain]);

  useEffect(() => {
    if (selectedMandalCode) {
      setFocusedMandalCode(selectedMandalCode);
    }
  }, [selectedMandalCode]);

  // Fetch sector-specific Telangana GIS payload
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    fetch(`${API_BASE}/gis/sector/${encodeURIComponent(sector)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load ${sector} GIS (${res.status})`);
        }
        return (await res.json()) as SectorGisResponse;
      })
      .then((payload) => {
        if (!active) return;
        setGisData(payload);
        setMetricKey((prev) =>
          payload.metrics.some((m) => m.key === prev)
            ? prev
            : payload.default_metric
        );
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load Telangana GIS layers."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [sector]);

  // Fetch exact village polygons when a Mandal is focused
  useEffect(() => {
    if (!focusedMandalCode) {
      setMandalVillages(null);
      return;
    }
    let active = true;
    setLoadingVillages(true);
    fetch(
      `${API_BASE}/gis/villages?mandal_code=${encodeURIComponent(focusedMandalCode)}`,
      { cache: "no-store" }
    )
      .then(async (res) => {
        if (!res.ok) throw new Error("Village polygons unavailable");
        return (await res.json()) as GeoJSON.FeatureCollection;
      })
      .then((fc) => {
        if (active) setMandalVillages(fc);
      })
      .catch(() => {
        if (active) setMandalVillages(null);
      })
      .finally(() => {
        if (active) setLoadingVillages(false);
      });

    return () => {
      active = false;
    };
  }, [focusedMandalCode]);

  // Compute min/max domain for active choropleth metric
  const metricStats = useMemo(() => {
    if (!gisData || !metricKey) {
      return { min: 0, max: 100, mean: 50, unit: "", label: "Score" };
    }
    const meta =
      gisData.metrics.find((m) => m.key === metricKey) ?? gisData.metrics[0];
    const values = gisData.mandals.features
      .map((f) => Number((f.properties as Record<string, unknown>)?.[metricKey]))
      .filter((n) => Number.isFinite(n));
    if (values.length === 0) {
      return {
        min: 0,
        max: 100,
        mean: 50,
        unit: meta?.unit ?? "",
        label: meta?.label ?? metricKey,
      };
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return {
      min: Number(min.toFixed(1)),
      max: Number(max.toFixed(1)),
      mean: Number(mean.toFixed(1)),
      unit: meta?.unit ?? "",
      label: meta?.label ?? metricKey,
    };
  }, [gisData, metricKey]);

  function getColorForValue(val: number): string {
    const palette = gisData?.palette ?? [
      "#1e293b",
      "#0284c7",
      "#06b6d4",
      "#10b981",
      "#f59e0b",
      "#ef4444",
    ];
    const span = Math.max(0.001, metricStats.max - metricStats.min);
    const ratio = Math.max(0, Math.min(0.999, (val - metricStats.min) / span));
    const idx = Math.floor(ratio * palette.length);
    return palette[idx] ?? palette[palette.length - 1];
  }

  // Initialize Leaflet Vector Canvas Map (zero external raster tile images)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const renderer = L.canvas({ padding: 0.5 });
    canvasRendererRef.current = renderer;

    const map = L.map(mapContainerRef.current, {
      center: TELANGANA_CENTER,
      zoom: TELANGANA_ZOOM,
      minZoom: 6,
      maxZoom: 14,
      zoomControl: true,
      attributionControl: false,
      preferCanvas: true,
      renderer,
    });

    mapInstanceRef.current = map;

    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      window.clearTimeout(resizeTimer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Render Mandal Choropleth + District Borders + Sector Facilities
  useEffect(() => {
    const map = mapInstanceRef.current;
    const renderer = canvasRendererRef.current;
    if (!map || !renderer || !gisData) return;

    if (mandalLayerRef.current) {
      mandalLayerRef.current.remove();
      mandalLayerRef.current = null;
    }
    if (districtLayerRef.current) {
      districtLayerRef.current.remove();
      districtLayerRef.current = null;
    }
    if (facilityLayerRef.current) {
      facilityLayerRef.current.remove();
      facilityLayerRef.current = null;
    }

    const q = searchFilter.trim().toLowerCase();

    if (showMandals) {
      const mandalLayer = L.geoJSON(gisData.mandals, {
        style: (feature) => {
          const p = (feature?.properties ?? {}) as Record<string, unknown>;
          const mName = String(p.mandal_name ?? "").toLowerCase();
          const dName = String(p.district_name ?? "").toLowerCase();
          const val = Number(p[metricKey] ?? 0);
          const matchesSearch = !q || mName.includes(q) || dName.includes(q);
          const isFocused = focusedMandalCode === String(p.mandal_code ?? "");

          return {
            renderer,
            fillColor: getColorForValue(val),
            fillOpacity: isFocused ? 0.25 : matchesSearch ? 0.78 : 0.14,
            color: isFocused ? "#fde047" : "rgba(255,255,255,0.22)",
            weight: isFocused ? 2.2 : 0.75,
          };
        },
        onEachFeature: (feature, layer) => {
          const p = (feature.properties ?? {}) as Record<string, unknown>;
          layer.on("mouseover", () => {
            const val = Number(p[metricKey] ?? 0);
            const nearKm = p.nearest_facility_km;
            const nearNm = p.nearest_facility_name;
            setHoveredInfo({
              title: `${String(p.mandal_name ?? "Mandal")} Mandal`,
              subtitle: `${String(p.district_name ?? "")} District · ${Number(p.village_count ?? 0)} Villages`,
              primaryLabel: metricStats.label,
              primaryValue: `${val.toLocaleString()} ${metricStats.unit}`,
              extra:
                nearKm !== undefined
                  ? `Nearest ${sector} facility: ${String(nearNm)} (${String(nearKm)} km) · Click to inspect villages`
                  : `Area: ${String(p.area_sq_km ?? "—")} km² · Click to inspect villages`,
            });
            if (layer instanceof L.Path) {
              layer.setStyle({
                color: "#ffffff",
                weight: 1.8,
              });
            }
          });

          layer.on("mouseout", () => {
            setHoveredInfo(null);
            mandalLayer.resetStyle(layer as L.Path);
          });

          layer.on("click", (e) => {
            const mCode = String(p.mandal_code ?? "");
            if (mCode) {
              setFocusedMandalCode(mCode);
            }
            const sampleVillage = String(p.sample_village_code ?? "");
            if (sampleVillage) {
              onVillageSelect({
                village_code: sampleVillage,
                mandal_code: mCode,
                mandal_name: p.mandal_name,
                district_name: p.district_name,
              });
            }
            const bounds = (e.target as L.Polygon).getBounds?.();
            if (bounds && bounds.isValid()) {
              map.fitBounds(bounds, { padding: [28, 28], maxZoom: 11 });
            }
          });
        },
      }).addTo(map);

      mandalLayerRef.current = mandalLayer;
    }

    if (showDistricts && gisData.districts) {
      const distLayer = L.geoJSON(gisData.districts, {
        interactive: false,
        style: () => ({
          renderer,
          fill: false,
          color: "rgba(255,255,255,0.62)",
          weight: 1.6,
          dashArray: "4 3",
        }),
      }).addTo(map);
      districtLayerRef.current = distLayer;
    }

    if (showFacilities && gisData.facilities.length > 0) {
      const group = L.layerGroup();
      for (const fac of gisData.facilities) {
        if (
          q &&
          !fac.name.toLowerCase().includes(q) &&
          !fac.category.toLowerCase().includes(q)
        ) {
          continue;
        }
        const marker = L.circleMarker([fac.lat, fac.lon], {
          renderer,
          radius: sector === "environment" && fac.id.startsWith("meteo_") ? 6.5 : 3.6,
          fillColor:
            sector === "environment" && fac.id.startsWith("meteo_")
              ? "#fde047"
              : "#ffffff",
          fillOpacity: 0.92,
          color: gisData.accent,
          weight: 1.5,
        });
        marker.on("mouseover", () => {
          setHoveredInfo({
            title: fac.name,
            subtitle: `${fac.category} · Telangana ${sector.toUpperCase()} GIS Asset`,
            primaryLabel: "Coordinates",
            primaryValue: `${fac.lat.toFixed(4)}°N, ${fac.lon.toFixed(4)}°E`,
            extra: fac.operator ? `Operator: ${fac.operator}` : "Geolocated OpenStreetMap / Telemetry Point",
          });
        });
        marker.addTo(group);
      }
      group.addTo(map);
      facilityLayerRef.current = group;
    }
  }, [
    gisData,
    metricKey,
    showMandals,
    showDistricts,
    showFacilities,
    searchFilter,
    focusedMandalCode,
    sector,
  ]);

  // Render Focused Mandal's Village Boundary Polygons
  useEffect(() => {
    const map = mapInstanceRef.current;
    const renderer = canvasRendererRef.current;
    if (!map || !renderer) return;

    if (villageLayerRef.current) {
      villageLayerRef.current.remove();
      villageLayerRef.current = null;
    }

    if (!mandalVillages || mandalVillages.features.length === 0) return;

    const scoreField =
      sector === "education"
        ? "education_score"
        : sector === "health"
        ? "health_score"
        : sector === "water"
        ? "water_score"
        : sector === "livelihood"
        ? "livelihood_score"
        : sector === "environment"
        ? "environment_score"
        : "overall_score";

    const vLayer = L.geoJSON(mandalVillages, {
      style: (feature) => {
        const p = (feature?.properties ?? {}) as Record<string, unknown>;
        const code = String(p.village_code ?? "");
        const isSelected = selectedVillageCode === code;
        const sVal = Number(p[scoreField] ?? 55);
        return {
          renderer,
          fillColor: isSelected
            ? "#ff9933"
            : sVal >= 62
            ? "#10b981"
            : sVal >= 48
            ? "#06b6d4"
            : "#f97316",
          fillOpacity: isSelected ? 0.72 : 0.45,
          color: isSelected ? "#ffffff" : "#fde047",
          weight: isSelected ? 2.6 : 1.1,
        };
      },
      onEachFeature: (feature, layer) => {
        const p = (feature.properties ?? {}) as Record<string, unknown>;
        layer.on("mouseover", () => {
          setHoveredInfo({
            title: `${String(p.village_name ?? p.area_name ?? "Village")}`,
            subtitle: `${String(p.mandal_name ?? "")} Mandal · ${String(p.district_name ?? "")} District`,
            primaryLabel: `${sector.toUpperCase()} Score`,
            primaryValue: `${String(p[scoreField] ?? p.overall_score ?? "—")} / 100`,
            extra: `Pop ${Number(p.total_population ?? 0).toLocaleString()} · Area ${String(p.area_sq_km ?? "—")} km² · Tanks ${String(p.tanks_total ?? 0)}`,
          });
        });
        layer.on("click", () => {
          onVillageSelect(p);
        });
      },
    }).addTo(map);

    villageLayerRef.current = vLayer;
  }, [mandalVillages, selectedVillageCode, sector]);

  // Highlight & Zoom to Selected Village Polygon when selected via Search
  useEffect(() => {
    const map = mapInstanceRef.current;
    const renderer = canvasRendererRef.current;
    if (!map || !renderer) return;

    if (selectedPolyLayerRef.current) {
      selectedPolyLayerRef.current.remove();
      selectedPolyLayerRef.current = null;
    }

    if (
      !selectedVillageGeometry ||
      typeof selectedVillageGeometry !== "object"
    ) {
      return;
    }

    try {
      const feature: GeoJSON.Feature = {
        type: "Feature",
        properties: { village_code: selectedVillageCode },
        geometry: selectedVillageGeometry as GeoJSON.Geometry,
      };
      const layer = L.geoJSON(feature, {
        style: () => ({
          renderer,
          fillColor: "#ff9933",
          fillOpacity: 0.42,
          color: "#ffffff",
          weight: 2.8,
        }),
      }).addTo(map);

      selectedPolyLayerRef.current = layer;
      const bounds = layer.getBounds();
      if (bounds && bounds.isValid()) {
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 });
      }
    } catch {
      // Ignore malformed geometry
    }
  }, [selectedVillageCode, selectedVillageGeometry]);

  function resetTelanganaView() {
    setFocusedMandalCode(null);
    setMandalVillages(null);
    setSearchFilter("");
    mapInstanceRef.current?.setView(TELANGANA_CENTER, TELANGANA_ZOOM);
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#050a10] text-white">
      {/* Top Sector GIS Switcher & Choropleth Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#070c14] px-4 py-3">
        <div className="flex flex-wrap items-center gap-1">
          {SECTOR_TABS.map((tab) => {
            const TabIcon = tab.icon;
            const active = sector === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSector(tab.id)}
                className={`inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-[11px] font-medium transition ${
                  active
                    ? "border-white/25 bg-white/10 text-white"
                    : "border-transparent text-white/50 hover:bg-white/[0.04] hover:text-white/85"
                }`}
              >
                <TabIcon size={12} style={{ color: tab.color }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {gisData && gisData.metrics.length > 0 && (
            <select
              value={metricKey}
              onChange={(e) => setMetricKey(e.target.value)}
              aria-label="Select GIS choropleth indicator"
              className="border border-white/15 bg-[#05080d] px-2.5 py-1.5 text-xs text-white/90 outline-none focus:border-orange-300/50"
            >
              {gisData.metrics.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1.5 border border-white/10 bg-black/30 px-2.5 py-1.5">
            <Search size={12} className="text-white/40" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Highlight mandal / asset..."
              className="w-36 bg-transparent text-xs text-white placeholder:text-white/30 outline-none"
            />
          </div>

          <button
            type="button"
            onClick={resetTelanganaView}
            title="Reset to full Telangana state extent"
            className="inline-flex items-center gap-1 border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-white/70 transition hover:border-white/25 hover:text-white"
          >
            <RotateCcw size={12} />
            <span>Telangana Extent</span>
          </button>
        </div>
      </div>

      {/* Map Canvas Surface */}
      <div className="relative flex-1 min-h-[360px] bg-[#04080e]">
        <div
          ref={mapContainerRef}
          className="h-full w-full"
          style={{ background: "#04080e" }}
        />

        {/* Loading Overlay */}
        {(loading || loadingVillages) && (
          <div className="pointer-events-none absolute top-3 left-14 z-[500] flex items-center gap-2 border border-white/15 bg-[#070b12]/90 px-3 py-1.5 text-xs text-orange-200 backdrop-blur-md">
            <Loader2 size={13} className="animate-spin" />
            <span>
              {loading
                ? `Loading Telangana ${sector} GIS…`
                : "Loading Mandal village polygons…"}
            </span>
          </div>
        )}

        {/* Error Overlay */}
        {error && !loading && (
          <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center bg-[#050910]/90 p-6 text-center">
            <Layers size={24} className="text-orange-300" />
            <p className="mt-3 text-sm font-medium text-white/90">{error}</p>
          </div>
        )}

        {/* Layer Visibility Toggles (Top-Right) */}
        <div className="absolute top-3 right-3 z-[450] flex flex-col gap-1.5 border border-white/15 bg-[#070b12]/92 p-2.5 text-[11px] backdrop-blur-md">
          <div className="flex items-center gap-1.5 font-medium text-white/75 pb-1 border-b border-white/10">
            <Compass size={12} className="text-orange-300" />
            <span>Telangana GIS Layers</span>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-white/70 hover:text-white">
            <input
              type="checkbox"
              checked={showMandals}
              onChange={(e) => setShowMandals(e.target.checked)}
              className="accent-orange-400"
            />
            <span>444 Mandal Choropleth</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-white/70 hover:text-white">
            <input
              type="checkbox"
              checked={showDistricts}
              onChange={(e) => setShowDistricts(e.target.checked)}
              className="accent-orange-400"
            />
            <span>10 District Boundaries</span>
          </label>
          {sector !== "overview" && (
            <label className="flex cursor-pointer items-center gap-2 text-white/70 hover:text-white">
              <input
                type="checkbox"
                checked={showFacilities}
                onChange={(e) => setShowFacilities(e.target.checked)}
                className="accent-orange-400"
              />
              <span>
                Mapped {sector} Assets (
                {(gisData?.facilities.length ?? 0).toLocaleString()})
              </span>
            </label>
          )}
          {mandalVillages && (
            <div className="mt-1 border-t border-white/10 pt-1.5 text-[10px] text-amber-200">
              Showing {mandalVillages.features.length} Village Polygons
            </div>
          )}
        </div>

        {/* Live Spatial Feature Inspector (Bottom-Right) */}
        <div className="pointer-events-none absolute bottom-3 right-3 z-[450] max-w-xs border border-white/15 bg-[#070b12]/92 p-3.5 text-xs backdrop-blur-md">
          {hoveredInfo ? (
            <div>
              <div className="font-semibold text-white">{hoveredInfo.title}</div>
              <div className="mt-0.5 text-[11px] text-white/50">
                {hoveredInfo.subtitle}
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-white/10 pt-2">
                <span className="text-[11px] text-white/55">
                  {hoveredInfo.primaryLabel}
                </span>
                <span className="font-mono text-sm font-semibold tabular-nums text-orange-300">
                  {hoveredInfo.primaryValue}
                </span>
              </div>
              <div className="mt-1.5 text-[10px] leading-4 text-white/45">
                {hoveredInfo.extra}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-[11px] text-white/55">
              <MapPin size={14} className="mt-0.5 shrink-0 text-orange-300" />
              <div>
                <div className="font-medium text-white/85">
                  Telangana State Spatial Engine
                </div>
                <div className="mt-0.5 text-white/45">
                  Hover any Mandal or facility point; click a Mandal to drill into
                  clickable village polygons.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Multi-Stop Choropleth Legend (Bottom-Left) */}
        {gisData && (
          <div className="pointer-events-none absolute bottom-3 left-3 z-[450] border border-white/15 bg-[#070b12]/92 p-3 text-[11px] backdrop-blur-md">
            <div className="font-medium text-white/80">{metricStats.label}</div>
            <div className="mt-2 flex h-2.5 w-44 overflow-hidden border border-white/10">
              {gisData.palette.map((c, idx) => (
                <div
                  key={`${c}-${idx}`}
                  className="flex-1"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="mt-1 flex justify-between font-mono text-[10px] tabular-nums text-white/55">
              <span>
                {metricStats.min}
                {metricStats.unit ? ` ${metricStats.unit}` : ""}
              </span>
              <span>Avg {metricStats.mean}</span>
              <span>
                {metricStats.max}
                {metricStats.unit ? ` ${metricStats.unit}` : ""}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Provenance Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-[#070c14] px-4 py-2 font-mono text-[11px] tabular-nums text-white/45">
        <span>
          Telangana GIS · 10 Districts · {gisData?.total_mandals ?? 444} Mandals ·
          11,154 Villages
        </span>
        <span>
          {selectedVillageCode
            ? `Active Village Code: ${selectedVillageCode}`
            : `Statewide ${sector} facilities indexed: ${(gisData?.total_facilities_statewide ?? 0).toLocaleString()}`}
        </span>
      </div>
    </div>
  );
}
