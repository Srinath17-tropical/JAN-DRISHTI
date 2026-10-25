import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Compass,
  Eye,
  Globe2,
  Layers,
  Loader2,
  MapPin,
  RotateCcw,
} from "lucide-react";

const API_BASE = "/api";

type DomainType =
  | "overview"
  | "education"
  | "health"
  | "water"
  | "livelihood"
  | "environment";

type FacilityPoint = {
  id: string;
  name: string;
  category: string;
  lat: number;
  lon: number;
  operator?: string;
};

type SectorGisPayload = {
  sector: DomainType;
  accent: string;
  facilities: FacilityPoint[];
  districts?: GeoJSON.FeatureCollection;
  mandals: GeoJSON.FeatureCollection;
};

type SatelliteMapProps = {
  activeDomain: DomainType;
  selectedVillageCode: string | null;
  selectedVillageName?: string | null;
  selectedVillageGeometry?: unknown;
  selectedMandalCode?: string | null;
  villageAreaSqKm?: number;
  onVillageSelect: (village: {
    village_code?: string | number;
    [key: string]: unknown;
  }) => void;
};

const DOMAIN_ACCENTS: Record<DomainType, string> = {
  overview: "#ff9933",
  education: "#ef4444",
  health: "#10b981",
  water: "#06b6d4",
  livelihood: "#ec4899",
  environment: "#84cc16",
};

const TELANGANA_CENTER: [number, number] = [17.92, 79.12];
const TELANGANA_ZOOM = 7;

export default function SatelliteMap({
  activeDomain,
  selectedVillageCode,
  selectedVillageName,
  selectedVillageGeometry,
  selectedMandalCode,
  villageAreaSqKm,
  onVillageSelect,
}: SatelliteMapProps) {
  const [imageryMode, setImageryMode] = useState<"satellite" | "hybrid" | "terrain">(
    "hybrid"
  );
  const [showBoundaries, setShowBoundaries] = useState<boolean>(true);
  const [showFacilities, setShowFacilities] = useState<boolean>(true);
  const [gisData, setGisData] = useState<SectorGisPayload | null>(null);
  const [mandalVillages, setMandalVillages] =
    useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [cursorCoords, setCursorCoords] = useState<{
    lat: number;
    lon: number;
    zoom: number;
  }>({
    lat: TELANGANA_CENTER[0],
    lon: TELANGANA_CENTER[1],
    zoom: TELANGANA_ZOOM,
  });
  const [hoveredTarget, setHoveredTarget] = useState<string>("");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const canvasRendererRef = useRef<L.Canvas | null>(null);
  const baseTileRef = useRef<L.TileLayer | null>(null);
  const labelTileRef = useRef<L.TileLayer | null>(null);
  const roadTileRef = useRef<L.TileLayer | null>(null);
  const vectorGroupRef = useRef<L.LayerGroup | null>(null);

  const accent = DOMAIN_ACCENTS[activeDomain] ?? "#06b6d4";

  // Fetch sector GIS vector overlays (districts, mandals, geolocated POIs)
  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`${API_BASE}/gis/sector/${activeDomain}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Unable to load sector spatial overlay");
        const payload = (await res.json()) as SectorGisPayload;
        if (active) setGisData(payload);
      })
      .catch(() => {
        if (active) setGisData(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeDomain]);

  // Fetch clickable village polygons for focused mandal
  useEffect(() => {
    if (!selectedMandalCode) {
      setMandalVillages(null);
      return;
    }
    let active = true;
    fetch(
      `${API_BASE}/gis/villages?mandal_code=${encodeURIComponent(selectedMandalCode)}`,
      { cache: "no-store" }
    )
      .then(async (res) => {
        if (!res.ok) return;
        const fc = (await res.json()) as GeoJSON.FeatureCollection;
        if (active) setMandalVillages(fc);
      })
      .catch(() => {
        // Ignore village boundary fetch error
      });
    return () => {
      active = false;
    };
  }, [selectedMandalCode]);

  // Initialize Leaflet Satellite Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const renderer = L.canvas({ padding: 0.5 });
    canvasRendererRef.current = renderer;

    const map = L.map(containerRef.current, {
      center: TELANGANA_CENTER,
      zoom: TELANGANA_ZOOM,
      minZoom: 6,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
      renderer,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    map.on("mousemove", (evt: L.LeafletMouseEvent) => {
      setCursorCoords({
        lat: Number(evt.latlng.lat.toFixed(4)),
        lon: Number(evt.latlng.lng.toFixed(4)),
        zoom: map.getZoom(),
      });
    });

    map.on("zoomend", () => {
      const c = map.getCenter();
      setCursorCoords({
        lat: Number(c.lat.toFixed(4)),
        lon: Number(c.lng.toFixed(4)),
        zoom: map.getZoom(),
      });
    });

    vectorGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize();
    }, 180);

    return () => {
      window.clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Manage Satellite / Hybrid / Terrain tile layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (baseTileRef.current) {
      map.removeLayer(baseTileRef.current);
      baseTileRef.current = null;
    }
    if (roadTileRef.current) {
      map.removeLayer(roadTileRef.current);
      roadTileRef.current = null;
    }
    if (labelTileRef.current) {
      map.removeLayer(labelTileRef.current);
      labelTileRef.current = null;
    }

    const baseUrl =
      imageryMode === "terrain"
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
        : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

    baseTileRef.current = L.tileLayer(baseUrl, {
      maxZoom: 18,
    }).addTo(map);
    baseTileRef.current.bringToBack();

    if (imageryMode === "hybrid") {
      roadTileRef.current = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 18,
          opacity: 0.65,
        }
      ).addTo(map);

      labelTileRef.current = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 18,
          opacity: 0.9,
        }
      ).addTo(map);
    }
  }, [imageryMode]);

  // Render Vector Boundaries, Mandal Village Footprints & Sector Facilities over Satellite Imagery
  useEffect(() => {
    const map = mapRef.current;
    const group = vectorGroupRef.current;
    const renderer = canvasRendererRef.current;
    if (!map || !group || !renderer) return;

    group.clearLayers();

    if (showBoundaries && gisData?.districts) {
      L.geoJSON(gisData.districts, {
        style: () => ({
          renderer,
          fill: false,
          color: "rgba(255, 255, 255, 0.55)",
          weight: 1.5,
          dashArray: "5 4",
        }),
        interactive: false,
      }).addTo(group);
    }

    if (showBoundaries && mandalVillages) {
      L.geoJSON(mandalVillages, {
        style: (feature) => {
          const vc = String(feature?.properties?.village_code ?? "");
          const isSelected = vc === String(selectedVillageCode ?? "");
          return {
            renderer,
            fillColor: isSelected ? accent : "#ffffff",
            fillOpacity: isSelected ? 0.28 : 0.06,
            color: isSelected ? accent : "rgba(255,255,255,0.5)",
            weight: isSelected ? 2.6 : 1,
          };
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties ?? {};
          layer.on({
            mouseover: () => {
              setHoveredTarget(
                `${p.area_name ?? "Village"} · ${p.mandal_name ?? ""} Mandal · ${p.tanks_total ?? 0} Tanks`
              );
            },
            mouseout: () => setHoveredTarget(""),
            click: () => {
              if (p.village_code) {
                onVillageSelect({
                  village_code: String(p.village_code),
                  area_name: p.area_name,
                });
              }
            },
          });
        },
      }).addTo(group);
    }

    // Selected Village High-Contrast Glowing Footprint over Satellite Orthoimagery
    if (
      selectedVillageGeometry &&
      typeof selectedVillageGeometry === "object" &&
      (selectedVillageGeometry as { type?: string }).type
    ) {
      const villageFeature: GeoJSON.Feature = {
        type: "Feature",
        properties: {},
        geometry: selectedVillageGeometry as GeoJSON.Geometry,
      };
      const highlightLayer = L.geoJSON(villageFeature, {
        style: () => ({
          renderer,
          fillColor: accent,
          fillOpacity: 0.22,
          color: "#ffffff",
          weight: 3.2,
        }),
        interactive: false,
      }).addTo(group);

      L.geoJSON(villageFeature, {
        style: () => ({
          renderer,
          fill: false,
          color: accent,
          weight: 1.8,
          dashArray: "6 4",
        }),
        interactive: false,
      }).addTo(group);

      try {
        const bounds = highlightLayer.getBounds();
        if (bounds.isValid()) {
          map.flyToBounds(bounds.pad(0.65), {
            duration: 0.85,
            maxZoom: 14,
          });
        }
      } catch {
        // Ignore bounds error
      }
    }

    // Geolocated Sector Infrastructure Markers on Satellite
    if (showFacilities && gisData?.facilities?.length) {
      for (const fac of gisData.facilities) {
        const marker = L.circleMarker([fac.lat, fac.lon], {
          renderer,
          radius: 4.5,
          fillColor: accent,
          fillOpacity: 0.95,
          color: "#05080d",
          weight: 1.4,
        });
        marker.on({
          mouseover: () => {
            setHoveredTarget(
              `${fac.name} (${fac.category.replace(/_/g, " ")})`
            );
          },
          mouseout: () => setHoveredTarget(""),
        });
        marker.addTo(group);
      }
    }
  }, [
    gisData,
    mandalVillages,
    selectedVillageCode,
    selectedVillageGeometry,
    showBoundaries,
    showFacilities,
    accent,
    onVillageSelect,
  ]);

  function resetExtent() {
    if (mapRef.current) {
      mapRef.current.flyTo(TELANGANA_CENTER, TELANGANA_ZOOM, { duration: 0.65 });
    }
  }

  return (
    <div className="relative flex h-full w-full flex-col bg-[#04080e] text-white select-none">
      {/* Top Satellite Control Bar */}
      <div className="z-20 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#070b12]/95 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <Globe2 size={14} style={{ color: accent }} />
          <span className="text-xs font-semibold text-white">
            Orbital Satellite &amp; Hybrid Terrain
          </span>
          <span className="hidden sm:inline font-mono text-[10px] text-white/45">
            · Telangana Earth Observation
          </span>
        </div>

        {/* Imagery Mode Switcher */}
        <div className="flex flex-wrap items-center gap-1 border border-white/10 bg-[#04070c] p-0.5">
          {(
            [
              { id: "hybrid", label: "Hybrid Ortho" },
              { id: "satellite", label: "Pure Satellite" },
              { id: "terrain", label: "Topo Relief" },
            ] as const
          ).map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setImageryMode(mode.id)}
              className={`px-2.5 py-1 text-[11px] font-medium transition whitespace-nowrap ${
                imageryMode === mode.id
                  ? "bg-white/15 text-white"
                  : "text-white/50 hover:text-white/85"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Secondary Overlay Toggles */}
      <div className="z-20 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#050910] px-3.5 py-2 text-[11px]">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowBoundaries((v) => !v)}
            className={`inline-flex items-center gap-1.5 border px-2.5 py-1 transition ${
              showBoundaries
                ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                : "border-white/10 text-white/45"
            }`}
          >
            <Layers size={11} />
            <span>Settlement Footprints</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFacilities((v) => !v)}
            className={`inline-flex items-center gap-1.5 border px-2.5 py-1 transition ${
              showFacilities
                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                : "border-white/10 text-white/45"
            }`}
          >
            <MapPin size={11} />
            <span>
              Sector POIs ({gisData?.facilities?.length ?? 0})
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={resetExtent}
          className="inline-flex items-center gap-1 border border-white/15 bg-white/[0.03] px-2.5 py-1 text-white/70 hover:text-white transition"
        >
          <RotateCcw size={11} />
          <span>State View</span>
        </button>
      </div>

      {/* Map Viewport */}
      <div className="relative flex-1 min-h-[340px]">
        <div ref={containerRef} className="h-full w-full bg-[#03060b]" />

        {loading && (
          <div className="pointer-events-none absolute top-3 right-3 z-[500] flex items-center gap-2 border border-white/15 bg-[#05080d]/90 px-3 py-1.5 text-[11px] text-white/75">
            <Loader2 size={12} className="animate-spin" style={{ color: accent }} />
            <span>Syncing vector footprints…</span>
          </div>
        )}

        {/* Active Settlement / Hover Overlay */}
        <div className="pointer-events-none absolute top-3 left-3 z-[500] max-w-[270px] border border-white/20 bg-[#05080d]/90 p-3 backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-cyan-300">
            <Eye size={11} />
            <span>Satellite Target Lock</span>
          </div>
          <div className="mt-1 text-xs font-semibold text-white truncate">
            {selectedVillageName
              ? `${selectedVillageName} Footprint`
              : "Telangana Regional Orthoimagery"}
          </div>
          <div className="mt-1 font-mono text-[10px] tabular-nums text-white/55">
            {hoveredTarget
              ? hoveredTarget
              : villageAreaSqKm
              ? `Boundary ${villageAreaSqKm} km² · Click polygons to inspect`
              : "Select a village in GIS or Search to lock footprint"}
          </div>
        </div>

        {/* Bottom Orbital Telemetry Bar */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex flex-wrap items-center gap-3 border border-white/15 bg-[#05080d]/90 px-3 py-1.5 font-mono text-[10px] tabular-nums text-white/70 backdrop-blur-md">
          <span className="inline-flex items-center gap-1">
            <Compass size={11} style={{ color: accent }} />
            {cursorCoords.lat}°N, {cursorCoords.lon}°E
          </span>
          <span aria-hidden="true">·</span>
          <span>Zoom Z{cursorCoords.zoom}</span>
          <span aria-hidden="true">·</span>
          <span className="text-white/50">Esri World Imagery + JAN-DRISHTI Vectors</span>
        </div>
      </div>
    </div>
  );
}
