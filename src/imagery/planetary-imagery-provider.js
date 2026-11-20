import { environment } from "../config/environment.js";

const CACHE_PREFIX = "siteledger:naip-history:v2:";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const COMPARISON_ZOOM = 17;

function imageryBounds(lng, lat, radiusMeters = 180) {
  const latitudeDegrees = radiusMeters / 111_320;
  const longitudeDegrees =
    radiusMeters / (111_320 * Math.cos((Number(lat) * Math.PI) / 180));
  return [
    Number(lng) - longitudeDegrees,
    Number(lat) - latitudeDegrees,
    Number(lng) + longitudeDegrees,
    Number(lat) + latitudeDegrees,
  ].map((value) => Number(value.toFixed(6)));
}

function cacheKey(lng, lat) {
  return `${CACHE_PREFIX}${Number(lng).toFixed(4)}:${Number(lat).toFixed(4)}`;
}

function readCache(lng, lat) {
  if (typeof localStorage === "undefined") return null;
  try {
    const cached = JSON.parse(
      localStorage.getItem(cacheKey(lng, lat)) || "null",
    );
    if (!cached || Date.now() - cached.storedAt > CACHE_TTL_MS) return null;
    return cached.scenes;
  } catch {
    return null;
  }
}

function writeCache(lng, lat, scenes) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(
      cacheKey(lng, lat),
      JSON.stringify({ storedAt: Date.now(), scenes }),
    );
  } catch (error) {
    console.warn("Imagery metadata cache could not be written.", error);
  }
}

function webMercatorTile(lng, lat, zoom = COMPARISON_ZOOM) {
  const scale = 2 ** zoom;
  const latitude = Math.max(-85.05112878, Math.min(85.05112878, Number(lat)));
  const latitudeRadians = (latitude * Math.PI) / 180;
  return {
    zoom,
    x: Math.floor(((Number(lng) + 180) / 360) * scale),
    y: Math.floor(
      ((1 - Math.asinh(Math.tan(latitudeRadians)) / Math.PI) / 2) * scale,
    ),
  };
}

function tileUrl(baseUrl, itemId, tile) {
  const params = new URLSearchParams({
    collection: "naip",
    item: itemId,
    assets: "image",
    asset_bidx: "image|1,2,3",
  });
  return `${baseUrl}/${tile.zoom}/${tile.x}/${tile.y}@2x.png?${params.toString()}`;
}

export function createPlanetaryImageryProvider({
  stacApiUrl = environment.stacApiUrl,
  tileBaseUrl = environment.imageryTileUrl,
  fetchImpl = globalThis.fetch,
} = {}) {
  return {
    source: "Microsoft Planetary Computer / USDA NAIP",
    async searchHistory(lng, lat, { signal, useCache = true } = {}) {
      const cached = useCache ? readCache(lng, lat) : null;
      if (cached) return cached;
      const bbox = imageryBounds(lng, lat);
      const tile = webMercatorTile(lng, lat);
      const response = await fetchImpl(stacApiUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          collections: ["naip"],
          bbox,
          datetime: "2010-01-01T00:00:00Z/..",
          limit: 20,
          sortby: [{ field: "properties.datetime", direction: "asc" }],
        }),
        signal,
      });
      if (!response.ok) {
        throw new Error(
          `Imagery history request failed with ${response.status}.`,
        );
      }
      const data = await response.json();
      const scenes = (data.features || [])
        .filter((feature) => feature.id && feature.properties?.datetime)
        .map((feature) => ({
          id: feature.id,
          capturedAt: feature.properties.datetime,
          year: new Date(feature.properties.datetime).getUTCFullYear(),
          resolutionMeters: Number(feature.properties.gsd || 1),
          previewUrl: tileUrl(tileBaseUrl, feature.id, tile),
          bbox,
          tile,
        }))
        .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
      writeCache(lng, lat, scenes);
      return scenes;
    },
  };
}

export { imageryBounds, webMercatorTile };
