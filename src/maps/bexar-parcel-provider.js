import { environment } from "../config/environment.js";

export const EMPTY_FEATURE_COLLECTION = Object.freeze({
  type: "FeatureCollection",
  features: [],
});

const OUT_FIELDS = "PropID,Situs,TotVal,YrBlt,Acres,PropUse";

function buildQueryUrl(serviceUrl, geometry, geometryType, recordCount) {
  const params = new URLSearchParams({
    where: "1=1",
    geometry,
    geometryType,
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: OUT_FIELDS,
    returnGeometry: "true",
    outSR: "4326",
    geometryPrecision: "6",
    resultRecordCount: String(recordCount),
    f: "geojson",
  });
  return `${serviceUrl}?${params.toString()}`;
}

function addressPredicate(address) {
  const tokens =
    String(address)
      .toUpperCase()
      .match(/[A-Z0-9]+/g) || [];
  const streetNumber = tokens.find((token) => /^\d+$/.test(token));
  if (!streetNumber) return null;
  const streetToken = tokens
    .slice(tokens.indexOf(streetNumber) + 1)
    .find((token) => /^\d+$/.test(token) || token.length > 3);
  if (!streetToken) return null;
  return `UPPER(Situs) LIKE '${streetNumber}%${streetToken}%'`;
}

function buildAddressQueryUrl(serviceUrl, address) {
  const where = addressPredicate(address);
  if (!where) return null;
  const params = new URLSearchParams({
    where,
    outFields: OUT_FIELDS,
    returnGeometry: "true",
    outSR: "4326",
    geometryPrecision: "6",
    resultRecordCount: "5",
    f: "geojson",
  });
  return `${serviceUrl}?${params.toString()}`;
}

function normalizeFeatureCollection(value) {
  if (value?.type !== "FeatureCollection" || !Array.isArray(value.features)) {
    throw new Error("The Bexar parcel service returned an unexpected payload.");
  }
  return {
    type: "FeatureCollection",
    features: value.features.filter((feature) => feature.geometry),
  };
}

export function createBexarParcelProvider({
  serviceUrl = environment.parcelServiceUrl,
  fetchImpl = globalThis.fetch,
} = {}) {
  const cache = new Map();

  async function request(url, signal) {
    if (cache.has(url)) return cache.get(url);
    const response = await fetchImpl(url, { signal });
    if (!response.ok) {
      throw new Error(`Bexar parcel request failed with ${response.status}.`);
    }
    const collection = normalizeFeatureCollection(await response.json());
    cache.set(url, collection);
    return collection;
  }

  return {
    source: "Bexar County GIS / BCAD parcel snapshot",
    metadataDate: "County service metadata: October 2021",
    async queryBounds(bounds, { signal } = {}) {
      const geometry = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ]
        .map((value) => Number(value).toFixed(6))
        .join(",");
      return request(
        buildQueryUrl(serviceUrl, geometry, "esriGeometryEnvelope", 500),
        signal,
      );
    },
    async queryPoint(lng, lat, { signal } = {}) {
      const geometry = `${Number(lng).toFixed(6)},${Number(lat).toFixed(6)}`;
      return request(
        buildQueryUrl(serviceUrl, geometry, "esriGeometryPoint", 1),
        signal,
      );
    },
    async queryAddress(address, { signal } = {}) {
      const url = buildAddressQueryUrl(serviceUrl, address);
      if (!url) return EMPTY_FEATURE_COLLECTION;
      return request(url, signal);
    },
    clearCache() {
      cache.clear();
    },
  };
}
