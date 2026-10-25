export type GisVillageFeature = {
  type: "Feature";
  properties: {
    village_code?: string | number;
    area_name?: string;
    village_name?: string;
    mandal_code?: string;
    mandal_name?: string;
    district_code?: string;
    district_name?: string;
    subdistrict_code?: string;
    total_population?: number;
    literacy_rate?: number;
    marginal_worker_percent?: number;
    education_score?: number;
    health_score?: number;
    water_score?: number;
    livelihood_score?: number;
    environment_score?: number;
    overall_score?: number;
    tanks_total?: number;
    vvi_v2?: number;
    vvi_v2_level?: string;
    area_sq_km?: number;
    [key: string]: unknown;
  };
  geometry?: {
    type: string;
    coordinates: unknown;
  } | null;
};

export type GisFeatureCollection = {
  type: "FeatureCollection";
  features: GisVillageFeature[];
};

const collectionCache = new Map<string, GisFeatureCollection>();
const inFlightMap = new Map<string, Promise<GisFeatureCollection>>();

export async function loadVillageGIS(url: string): Promise<GisFeatureCollection> {
  if (collectionCache.has(url)) {
    return collectionCache.get(url)!;
  }

  if (inFlightMap.has(url)) {
    return inFlightMap.get(url)!;
  }

  const request: Promise<GisFeatureCollection> = fetch(url, { cache: "no-store" })
    .then(async (response): Promise<GisFeatureCollection> => {
      if (!response.ok) {
        throw new Error(`GIS endpoint returned status ${response.status}`);
      }
      const payload = (await response.json()) as unknown;
      if (
        payload &&
        typeof payload === "object" &&
        Array.isArray((payload as { features?: unknown[] }).features)
      ) {
        const fc = payload as GisFeatureCollection;
        collectionCache.set(url, fc);
        return fc;
      }
      return { type: "FeatureCollection", features: [] };
    })
    .finally(() => {
      inFlightMap.delete(url);
    });

  inFlightMap.set(url, request);
  return request;
}

export function getCachedVillageGIS(url?: string): GisFeatureCollection | null {
  if (url) return collectionCache.get(url) ?? null;
  const first = collectionCache.values().next();
  return first.done ? null : first.value;
}
