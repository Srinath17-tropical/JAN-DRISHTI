/// <reference types="google.maps" />
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  APIProvider,
  APILoadingStatus,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import {
  Activity,
  AlertTriangle,
  Car,
  Compass,
  Layers,
  MapPin,
  Navigation,
  RefreshCw,
  Route,
  Send,
  ShieldAlert,
} from "lucide-react";
import type { SectorInsightsVillage } from "./SectorActionModules";

type CorridorKey = "health" | "education" | "livelihood";

export type CorridorRouteInfo = {
  id: CorridorKey;
  label: string;
  sectorName: string;
  destinationName: string;
  destinationCategory: string;
  destination: { lat: number; lng: number };
  distanceKm: number;
  liveMinutes: number;
  baselineMinutes: number;
  delayMinutes: number;
  congestionLevel: string;
  encodedPolyline: string | null;
  viewport: {
    high?: { latitude: number; longitude: number };
    low?: { latitude: number; longitude: number };
  } | null;
  source: string;
};

type CorridorsResponse = {
  origin: { lat: number; lng: number; villageName: string };
  travelMode: "DRIVE" | "TWO_WHEELER";
  corridors: CorridorRouteInfo[];
};

const CORRIDOR_COLORS: Record<CorridorKey, string> = {
  health: "#10b981",
  education: "#38bdf8",
  livelihood: "#f472b6",
};

function decodePolylineFallback(encoded: string): google.maps.LatLngLiteral[] {
  const path: google.maps.LatLngLiteral[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dLat;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dLng;

    path.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return path;
}

function getOriginCoords(village: SectorInsightsVillage | null): { lat: number; lng: number } {
  if (typeof village?.lat === "number" && typeof village?.lon === "number") {
    return { lat: village.lat, lng: village.lon };
  }
  const g = village?.geometry as { type?: string; coordinates?: unknown } | undefined;
  if (g && typeof g === "object") {
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
      return {
        lat: Number((sLat / ring.length).toFixed(5)),
        lng: Number((sLon / ring.length).toFixed(5)),
      };
    }
  }
  return { lat: 17.85, lng: 78.82 };
}

function TrafficAndTransitOverlays({
  showTraffic,
  showTransit,
}: {
  showTraffic: boolean;
  showTransit: boolean;
}) {
  const map = useMap();
  const mapsLib = useMapsLibrary("maps");

  useEffect(() => {
    if (!map || !mapsLib) return;
    if (!showTraffic) return;
    const trafficLayer = new mapsLib.TrafficLayer();
    trafficLayer.setMap(map);
    return () => {
      trafficLayer.setMap(null);
    };
  }, [map, mapsLib, showTraffic]);

  useEffect(() => {
    if (!map || !mapsLib) return;
    if (!showTransit) return;
    const transitLayer = new mapsLib.TransitLayer();
    transitLayer.setMap(map);
    return () => {
      transitLayer.setMap(null);
    };
  }, [map, mapsLib, showTransit]);

  return null;
}

function ActiveCorridorPolyline({
  corridor,
  origin,
}: {
  corridor: CorridorRouteInfo | null;
  origin: { lat: number; lng: number };
}) {
  const map = useMap();
  const mapsLib = useMapsLibrary("maps");
  const coreLib = useMapsLibrary("core");

  useEffect(() => {
    if (!map || !mapsLib || !corridor) return;

    const path = corridor.encodedPolyline
      ? decodePolylineFallback(corridor.encodedPolyline)
      : [origin, corridor.destination];

    const polyline = new mapsLib.Polyline({
      path,
      geodesic: true,
      strokeColor: CORRIDOR_COLORS[corridor.id],
      strokeOpacity: corridor.encodedPolyline ? 0.92 : 0.6,
      strokeWeight: corridor.encodedPolyline ? 5 : 3,
      map,
    });

    if (corridor.viewport?.high && corridor.viewport?.low) {
      map.fitBounds({
        north: corridor.viewport.high.latitude,
        south: corridor.viewport.low.latitude,
        east: corridor.viewport.high.longitude,
        west: corridor.viewport.low.longitude,
      });
    } else if (coreLib) {
      const bounds = new coreLib.LatLngBounds();
      bounds.extend(origin);
      bounds.extend(corridor.destination);
      map.fitBounds(bounds, 65);
    }

    return () => {
      polyline.setMap(null);
    };
  }, [map, mapsLib, coreLib, corridor, origin]);

  return null;
}

function CorridorMarkerPin({
  position,
  title,
  subtitle,
  meta,
  background,
  glyphText,
  onSelect,
}: {
  position: google.maps.LatLngLiteral;
  title: string;
  subtitle: string;
  meta: string;
  background: string;
  glyphText: string;
  onSelect?: () => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={position}
        onClick={() => {
          setOpen(true);
          onSelect?.();
        }}
      >
        <Pin
          background={background}
          borderColor="#0f172a"
          glyphColor="#ffffff"
          glyphText={glyphText}
        />
      </AdvancedMarker>
      {open && marker && (
        <InfoWindow anchor={marker} onCloseClick={() => setOpen(false)}>
          <div className="p-1 text-slate-900 max-w-[230px] space-y-1">
            <div className="text-xs font-bold leading-snug">{title}</div>
            <div className="text-[11px] text-slate-600">{subtitle}</div>
            <div className="text-[11px] font-mono text-slate-800 pt-1 border-t border-slate-200">
              {meta}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function MapsAuthStatusMonitor() {
  const status = useApiLoadingStatus();
  useEffect(() => {
    if (status === APILoadingStatus.AUTH_FAILURE || status === APILoadingStatus.FAILED) {
      window.dispatchEvent(new CustomEvent("gmp-quota-exceeded"));
    }
  }, [status]);

  if (status === APILoadingStatus.AUTH_FAILURE || status === APILoadingStatus.FAILED) {
    return (
      <div className="flex items-center gap-2 border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
        <AlertTriangle size={14} />
        <span>
          Live map tiles could not authenticate right now. Distance corridor metrics remain available below.
        </span>
      </div>
    );
  }
  return null;
}

export default function LiveTrafficCorridorStudio({
  village,
  onEscalateBottleneck,
}: {
  village: SectorInsightsVillage | null;
  onEscalateBottleneck?: (corridor: CorridorRouteInfo, villageName: string) => void;
}) {
  const origin = useMemo(() => getOriginCoords(village), [village]);
  const [apiKey, setApiKey] = useState<string>(
    () => (import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "").trim()
  );
  const [configChecked, setConfigChecked] = useState<boolean>(
    Boolean((import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "").trim())
  );

  const [travelMode, setTravelMode] = useState<"DRIVE" | "TWO_WHEELER">("DRIVE");
  const [showTraffic, setShowTraffic] = useState(true);
  const [showTransit, setShowTransit] = useState(false);
  const [mapTypeId, setMapTypeId] = useState<"roadmap" | "hybrid">("roadmap");
  const [selectedCorridorId, setSelectedCorridorId] = useState<CorridorKey>("health");
  const [corridors, setCorridors] = useState<CorridorRouteInfo[]>([]);
  const [loadingCorridors, setLoadingCorridors] = useState(false);
  const [escalatingNote, setEscalatingNote] = useState<string | null>(null);

  const checkMapsConfig = useCallback(async (attempt = 0): Promise<void> => {
    if ((import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "").trim()) {
      setApiKey((import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "").trim());
      setConfigChecked(true);
      return;
    }
    try {
      const res = await fetch(`/api/maps/config?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const d = (await res.json()) as { hasKey?: boolean; apiKey?: string };
        if (d?.apiKey) {
          setApiKey(d.apiKey.trim());
          setConfigChecked(true);
          return;
        }
      }
      if (attempt < 2) {
        setTimeout(() => {
          void checkMapsConfig(attempt + 1);
        }, 1200);
        return;
      }
      setConfigChecked(true);
    } catch {
      if (attempt < 2) {
        setTimeout(() => {
          void checkMapsConfig(attempt + 1);
        }, 1200);
        return;
      }
      setConfigChecked(true);
    }
  }, []);

  useEffect(() => {
    if (apiKey) {
      setConfigChecked(true);
      return;
    }
    void checkMapsConfig(0);
  }, [apiKey, checkMapsConfig]);

  const fetchCorridors = useCallback(async () => {
    setLoadingCorridors(true);
    try {
      const res = await fetch("/api/maps/corridors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          villageCode: village?.villageCode ?? "",
          travelMode,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | (CorridorsResponse & { error?: { status?: string } })
        | null;

      if (res.status === 429 || data?.error?.status === "RESOURCE_EXHAUSTED") {
        window.dispatchEvent(new CustomEvent("gmp-quota-exceeded"));
      }
      if (data && Array.isArray(data.corridors)) {
        setCorridors(data.corridors);
      }
    } catch {
      // Non-fatal fallback handled gracefully
    } finally {
      setLoadingCorridors(false);
    }
  }, [origin, village?.villageCode, travelMode]);

  useEffect(() => {
    void fetchCorridors();
  }, [fetchCorridors]);

  const activeCorridor = useMemo(
    () => corridors.find((c) => c.id === selectedCorridorId) ?? corridors[0] ?? null,
    [corridors, selectedCorridorId]
  );

  async function handleQuickEscalateBottleneck(corridor: CorridorRouteInfo) {
    const vName = village?.villageName ?? "Active Village";
    if (onEscalateBottleneck) {
      onEscalateBottleneck(corridor, vName);
      setEscalatingNote(`Opened Community Civic Tech pre-filled for ${corridor.destinationName} corridor.`);
      return;
    }
    try {
      const sectorMap: Record<CorridorKey, "health" | "education" | "livelihood"> = {
        health: "health",
        education: "education",
        livelihood: "livelihood",
      };
      const res = await fetch("/api/community/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sector: sectorMap[corridor.id],
          categoryId: corridor.id === "health" ? "health_ambulance_road" : "liv_mandi_road",
          title: `Corridor Congestion Bottleneck: ${vName} → ${corridor.destinationName}`,
          description: `Traffic corridor monitor recorded ${corridor.liveMinutes} min travel time (${corridor.distanceKm} km, +${corridor.delayMinutes} min delay vs ${corridor.baselineMinutes} min baseline; status: ${corridor.congestionLevel}). Escalated for road widening/culvert clearing.`,
          institutionName: corridor.destinationName,
          villageName: vName,
          mandalName: village?.mandalName ?? "Mandal HQ",
          districtName: village?.districtName ?? "Telangana",
          affectedPeople: Math.min(2500, village?.population ?? 850),
          reporterName: "Traffic Corridor Monitor",
          lat: origin.lat,
          lon: origin.lng,
          gpsLabel: `${origin.lat.toFixed(4)}°N, ${origin.lng.toFixed(4)}°E`,
          actionMode: "escalate_govt",
        }),
      });
      if (res.ok) {
        setEscalatingNote(
          `Logged bottleneck issue to Community Civic Tech Ledger for ${vName} → ${corridor.destinationName}.`
        );
      }
    } catch {
      setEscalatingNote("Could not auto-dispatch bottleneck report right now.");
    }
  }

  return (
    <section className="border border-white/12 bg-[#070b12] p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="text-xs font-semibold text-orange-300 flex items-center gap-2">
            <Navigation size={15} />
            <span>Live Traffic &amp; Rural Infrastructure Corridor Monitor · Google Maps Platform</span>
          </div>
          <h3 className="mt-1 text-lg md:text-xl font-semibold text-white">
            Real-Time Road Congestion &amp; Public Access Corridors for{" "}
            {village ? `${village.villageName} (${village.districtName})` : "Telangana"}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Live Google Traffic overlay + Routes API travel-time diagnostics from{" "}
            <span className="font-mono text-slate-200 tabular-nums">
              {origin.lat.toFixed(4)}°N, {origin.lng.toFixed(4)}°E
            </span>{" "}
            to the nearest Health Facility, School, and APMC/Banking Hub.
          </p>
        </div>

        {/* Map Overlay & Mode Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTraffic((v) => !v)}
            className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium transition ${
              showTraffic
                ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-200"
                : "border-white/15 bg-white/[0.03] text-slate-300"
            }`}
          >
            <Activity size={13} />
            <span>Live Traffic {showTraffic ? "ON" : "OFF"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTransit((v) => !v)}
            className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium transition ${
              showTransit
                ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-200"
                : "border-white/15 bg-white/[0.03] text-slate-300"
            }`}
          >
            <Layers size={13} />
            <span>Transit Layer</span>
          </button>

          <button
            type="button"
            onClick={() => setMapTypeId((m) => (m === "roadmap" ? "hybrid" : "roadmap"))}
            className="inline-flex items-center gap-1.5 border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-white/30"
          >
            <Compass size={13} />
            <span>{mapTypeId === "roadmap" ? "Satellite Hybrid" : "Road Vector"}</span>
          </button>

          <button
            type="button"
            onClick={() => setTravelMode((t) => (t === "DRIVE" ? "TWO_WHEELER" : "DRIVE"))}
            className="inline-flex items-center gap-1.5 border border-orange-400/35 bg-orange-500/15 px-3 py-1.5 text-xs font-medium text-orange-200"
          >
            <Car size={13} />
            <span>{travelMode === "DRIVE" ? "4-Wheeler / Bus" : "2-Wheeler"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!apiKey) void checkMapsConfig(0);
              void fetchCorridors();
            }}
            disabled={loadingCorridors}
            className="inline-flex items-center gap-1.5 border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white hover:border-orange-300/40 disabled:opacity-50"
          >
            <RefreshCw size={13} className={loadingCorridors ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 3 Corridor Accessibility Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {corridors.map((c) => {
          const isSelected = activeCorridor?.id === c.id;
          const accentBorder =
            c.id === "health"
              ? isSelected
                ? "border-emerald-400 bg-emerald-500/10"
                : "border-white/10 bg-[#04080e]"
              : c.id === "education"
              ? isSelected
                ? "border-sky-400 bg-sky-500/10"
                : "border-white/10 bg-[#04080e]"
              : isSelected
              ? "border-pink-400 bg-pink-500/10"
              : "border-white/10 bg-[#04080e]";

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCorridorId(c.id)}
              className={`border ${accentBorder} p-4 text-left space-y-2.5 transition hover:border-white/30`}
            >
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span
                  className="font-semibold flex items-center gap-1.5"
                  style={{ color: CORRIDOR_COLORS[c.id] }}
                >
                  <Route size={13} />
                  <span>{c.label}</span>
                </span>
                <span
                  className={`font-mono px-1.5 py-0.5 text-[10px] border ${
                    c.delayMinutes >= 5
                      ? "border-rose-400/40 bg-rose-500/15 text-rose-200"
                      : c.delayMinutes >= 2
                      ? "border-amber-400/40 bg-amber-500/15 text-amber-200"
                      : "border-emerald-400/35 bg-emerald-500/10 text-emerald-200"
                  }`}
                >
                  {c.congestionLevel}
                </span>
              </div>

              <div className="text-sm font-semibold text-white truncate">{c.destinationName}</div>

              <div className="flex items-baseline justify-between font-mono tabular-nums pt-1 border-t border-white/10">
                <div>
                  <span className="text-2xl font-bold text-white">{c.liveMinutes} min</span>
                  <span className="ml-2 text-xs text-slate-400">({c.distanceKm} km)</span>
                </div>
                <div className="text-right text-[11px]">
                  <div className="text-slate-400">Baseline {c.baselineMinutes} min</div>
                  <div className={c.delayMinutes > 0 ? "text-amber-300" : "text-emerald-300"}>
                    {c.delayMinutes > 0 ? `+${c.delayMinutes} min traffic` : "No traffic delay"}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Explicit Height Map Viewport + Action Sidebar */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-2">
          {apiKey ? (
            <APIProvider
              apiKey={apiKey}
              language="en"
              region="IN"
              libraries={["maps", "routes", "marker"]}
            >
              <MapsAuthStatusMonitor />
              <div className="h-[460px] w-full overflow-hidden border border-white/15 bg-[#04080e]">
                <GoogleMap
                  defaultCenter={origin}
                  center={origin}
                  defaultZoom={12}
                  mapId="DEMO_MAP_ID"
                  mapTypeId={mapTypeId}
                  gestureHandling="greedy"
                  internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                  style={{ width: "100%", height: "100%" }}
                >
                  <TrafficAndTransitOverlays
                    showTraffic={showTraffic}
                    showTransit={showTransit}
                  />
                  <ActiveCorridorPolyline corridor={activeCorridor} origin={origin} />

                  <CorridorMarkerPin
                    position={origin}
                    title={village?.villageName ?? "Active Telangana Village"}
                    subtitle={`${village?.mandalName ?? "Mandal"} · ${village?.districtName ?? "Telangana"}`}
                    meta={`Origin · Pop ${(village?.population ?? 0).toLocaleString("en-IN")}`}
                    background="#ff9933"
                    glyphText="V"
                  />

                  {corridors.map((c) => (
                    <CorridorMarkerPin
                      key={c.id}
                      position={c.destination}
                      title={c.destinationName}
                      subtitle={c.destinationCategory}
                      meta={`${c.liveMinutes} min (${c.distanceKm} km) · +${c.delayMinutes}m delay`}
                      background={CORRIDOR_COLORS[c.id]}
                      glyphText={c.id === "health" ? "H" : c.id === "education" ? "E" : "M"}
                      onSelect={() => setSelectedCorridorId(c.id)}
                    />
                  ))}
                </GoogleMap>
              </div>
            </APIProvider>
          ) : (
            <div className="h-[460px] w-full border border-white/15 bg-[#04080e] flex flex-col items-center justify-center p-6 text-center space-y-3">
              <MapPin size={24} className="text-orange-300" />
              <div className="text-sm font-semibold text-white">
                {configChecked
                  ? "Waiting for Google Maps Tile Session"
                  : "Connecting to Google Maps Traffic Tiles…"}
              </div>
              <p className="text-xs text-slate-400 max-w-md">
                {configChecked
                  ? "Live map tiles require an active browser refresh or an enabled Google Maps API key for this runtime. Corridor travel-time calculations above remain available."
                  : "Initializing Google Maps Platform runtime environment."}
              </p>
              {configChecked && (
                <button
                  type="button"
                  onClick={() => {
                    setConfigChecked(false);
                    void checkMapsConfig(0);
                  }}
                  className="inline-flex items-center gap-1.5 border border-cyan-400/50 bg-cyan-500/15 hover:bg-cyan-500/25 px-4 py-2 text-xs font-semibold text-cyan-200 transition"
                >
                  <RefreshCw size={13} />
                  <span>Retry Map Connection</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Selected Corridor Diagnostic & Civic Escalation Panel */}
        <div className="lg:col-span-4 border border-white/12 bg-[#04080e] p-5 space-y-4">
          <div className="border-b border-white/10 pb-3">
            <div className="text-[11px] font-mono text-orange-300">Active Corridor Dossier</div>
            <h4 className="text-base font-semibold text-white mt-0.5">
              {activeCorridor?.destinationName ?? "Select a Corridor"}
            </h4>
            <div className="text-xs text-slate-400 mt-0.5">
              {activeCorridor?.destinationCategory ?? "Public Service Asset"}
            </div>
          </div>

          {activeCorridor && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5 font-mono tabular-nums">
                <div className="border border-white/10 bg-[#070c16] p-3">
                  <div className="text-[10px] text-slate-400">Current Travel Time</div>
                  <div className="text-xl font-bold text-white mt-0.5">
                    {activeCorridor.liveMinutes} min
                  </div>
                </div>
                <div className="border border-white/10 bg-[#070c16] p-3">
                  <div className="text-[10px] text-slate-400">Road Distance</div>
                  <div className="text-xl font-bold text-cyan-300 mt-0.5">
                    {activeCorridor.distanceKm} km
                  </div>
                </div>
              </div>

              <div className="border border-white/10 bg-[#070c16] p-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Historical Static Time</span>
                  <span className="font-mono text-slate-200 tabular-nums">
                    {activeCorridor.baselineMinutes} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Congestion Delta</span>
                  <span className="font-mono text-amber-300 tabular-nums">
                    +{activeCorridor.delayMinutes} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Telemetry Source</span>
                  <span className="font-mono text-emerald-300 text-right truncate max-w-[165px]">
                    {activeCorridor.source}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleQuickEscalateBottleneck(activeCorridor)}
                className="w-full inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 px-4 py-2.5 text-xs font-semibold text-white transition"
              >
                <Send size={13} />
                <span>Escalate Road Bottleneck to Civic Tech</span>
              </button>

              {escalatingNote && (
                <div className="border border-emerald-400/35 bg-emerald-500/10 p-2.5 text-[11px] text-emerald-200">
                  {escalatingNote}
                </div>
              )}

              <div className="border border-white/10 bg-white/[0.02] p-3 text-[11px] text-slate-400 flex items-start gap-2 leading-relaxed">
                <ShieldAlert size={14} className="text-amber-300 shrink-0 mt-0.5" />
                <span>
                  Travel-time and live traffic overlays are provided strictly for rural accessibility &amp; infrastructure gap planning, not for active emergency vehicle dispatch or turn-by-turn navigation.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
