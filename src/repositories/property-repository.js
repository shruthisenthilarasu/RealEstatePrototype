import {
  environment,
  hasSupabaseConfiguration,
} from "../config/environment.js";
import { localProperties } from "../data/local-properties.js";
import { getSupabaseClient } from "../lib/supabase.js";
import { propertyCollectionSchema } from "../schemas/property-schema.js";

export const SAN_ANTONIO_BOUNDS = Object.freeze({
  west: -99.05,
  south: 29.1,
  east: -98.15,
  north: 29.85,
});

const CACHE_KEY = "siteledger:properties:v1";

function readBrowserCache() {
  if (typeof localStorage === "undefined") return null;
  try {
    return propertyCollectionSchema.parse(
      JSON.parse(localStorage.getItem(CACHE_KEY) || "null"),
    );
  } catch {
    return null;
  }
}

function writeBrowserCache(properties) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(properties));
  } catch (error) {
    console.warn("Property cache could not be written.", error);
  }
}

function normalizedQuery(query = "") {
  return query.trim().toLowerCase();
}

function matchesQuery(property, query) {
  const value = normalizedQuery(query);
  if (!value) return true;
  const haystack = [
    property.name,
    property.address,
    property.zone,
    property.legal,
    property.recorded,
    property.observed,
    ...property.tags,
    ...property.detections.flat(),
  ]
    .join(" ")
    .toLowerCase();
  return value
    .split(/\s+/)
    .filter((term) => term.length > 2)
    .every((term) => haystack.includes(term));
}

export function createLocalPropertyRepository(properties = localProperties) {
  const validated = propertyCollectionSchema.parse(properties);
  return {
    mode: "offline",
    async listPropertiesInBounds(bounds = SAN_ANTONIO_BOUNDS, query = "") {
      return validated.filter(
        (property) =>
          property.lng >= bounds.west &&
          property.lng <= bounds.east &&
          property.lat >= bounds.south &&
          property.lat <= bounds.north &&
          matchesQuery(property, query),
      );
    },
    async searchPropertyMemory() {
      return null;
    },
  };
}

function toUiProperty(row, events, observations) {
  const propertyEvents = events
    .filter((event) => event.property_id === row.id)
    .sort((a, b) => String(a.valid_at).localeCompare(String(b.valid_at)))
    .map((event) => [event.display_date, event.title]);
  const detections = observations
    .filter((observation) => observation.property_id === row.id)
    .flatMap(observationDetections);

  return {
    id: row.reference_code,
    name: row.name,
    address: row.address,
    city: row.city,
    state: row.state,
    lat: Number(row.latitude),
    lng: Number(row.longitude),
    zone: row.zoning_code || "Not stated",
    legal: row.legal_state,
    recorded: row.recorded_state,
    confidence: Math.round(Number(row.confidence) * 100),
    tags: row.tags || [],
    status: row.status,
    observed: row.observed_state,
    imageDate: row.image_label,
    detections,
    events: propertyEvents,
  };
}

function observationDetections(observation) {
  const confidence = Math.round(Number(observation.confidence) * 100);
  const entries = Object.entries(observation.payload || {});
  if (!entries.length) return [[observation.label, confidence]];
  return entries.map(([key, value]) => {
    const label = key.replaceAll("_", " ");
    if (Array.isArray(value)) {
      return [`${label}: ${value.join(", ")}`, confidence];
    }
    if (value && typeof value === "object") {
      return [`${label}: ${Object.values(value).join(", ")}`, confidence];
    }
    return [`${label}: ${value}`, confidence];
  });
}

export function createSupabasePropertyRepository(client) {
  return {
    mode: "supabase",
    async listPropertiesInBounds(bounds = SAN_ANTONIO_BOUNDS, query = "") {
      const { data: properties, error } = await client.rpc(
        "get_properties_in_bounds",
        {
          p_west: bounds.west,
          p_south: bounds.south,
          p_east: bounds.east,
          p_north: bounds.north,
          p_query: query || null,
        },
      );
      if (error) throw error;
      if (!properties?.length) return [];

      const ids = properties.map((property) => property.id);
      const [eventResult, observationResult] = await Promise.all([
        client
          .from("property_events")
          .select("property_id,title,valid_at,display_date")
          .in("property_id", ids),
        client
          .from("observations")
          .select("property_id,label,confidence,payload")
          .in("property_id", ids),
      ]);
      if (eventResult.error) throw eventResult.error;
      if (observationResult.error) throw observationResult.error;

      return propertyCollectionSchema.parse(
        properties.map((property) =>
          toUiProperty(
            property,
            eventResult.data || [],
            observationResult.data || [],
          ),
        ),
      );
    },
    async searchPropertyMemory(
      bounds = SAN_ANTONIO_BOUNDS,
      query = "",
      { limit = 20 } = {},
    ) {
      const { data, error } = await client.rpc("search_property_memory", {
        p_query: query,
        p_west: bounds.west,
        p_south: bounds.south,
        p_east: bounds.east,
        p_north: bounds.north,
        p_query_embedding: null,
        p_limit: limit,
      });
      if (error) throw error;
      return data || [];
    },
  };
}

export function createPropertyRepository() {
  const local = createLocalPropertyRepository();
  if (environment.dataMode === "local") return local;
  const client = getSupabaseClient();
  if (!client || !hasSupabaseConfiguration()) {
    if (environment.dataMode === "supabase") {
      throw new Error(
        "Supabase mode requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.",
      );
    }
    return local;
  }

  const remote = createSupabasePropertyRepository(client);
  return {
    mode: "supabase",
    async listPropertiesInBounds(bounds, query) {
      try {
        const properties = await remote.listPropertiesInBounds(bounds, query);
        writeBrowserCache(properties);
        return properties;
      } catch (error) {
        if (environment.dataMode === "supabase") throw error;
        console.warn(
          "Supabase unavailable; using offline property cache.",
          error,
        );
        const cached = readBrowserCache();
        this.mode = cached ? "cached-fallback" : "offline-fallback";
        if (cached) return cached;
        return local.listPropertiesInBounds(bounds, query);
      }
    },
    async searchPropertyMemory(bounds, query, options) {
      try {
        return await remote.searchPropertyMemory(bounds, query, options);
      } catch (error) {
        if (environment.dataMode === "supabase") throw error;
        console.warn(
          "Supabase memory search unavailable; keeping local ranking.",
          error,
        );
        return null;
      }
    },
  };
}
