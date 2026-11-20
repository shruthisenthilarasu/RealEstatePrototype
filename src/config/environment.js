const requestedMode = import.meta.env.VITE_DATA_MODE || "auto";

export const environment = Object.freeze({
  dataMode: ["auto", "local", "supabase"].includes(requestedMode)
    ? requestedMode
    : "auto",
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "",
  supabasePublishableKey:
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    "",
  satelliteTileUrl:
    import.meta.env.VITE_SATELLITE_TILE_URL ||
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  parcelServiceUrl:
    import.meta.env.VITE_PARCEL_SERVICE_URL ||
    "https://maps.bexar.org/arcgis/rest/services/Parcels/MapServer/0/query",
  stacApiUrl:
    import.meta.env.VITE_STAC_API_URL ||
    "https://planetarycomputer.microsoft.com/api/stac/v1/search",
  imageryTileUrl:
    import.meta.env.VITE_IMAGERY_TILE_URL ||
    "https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad",
});

export function hasSupabaseConfiguration() {
  return Boolean(environment.supabaseUrl && environment.supabasePublishableKey);
}
