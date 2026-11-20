const requestedMode = import.meta.env.VITE_DATA_MODE || "auto";

export const environment = Object.freeze({
  dataMode: ["auto", "local", "supabase"].includes(requestedMode)
    ? requestedMode
    : "auto",
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  satelliteTileUrl:
    import.meta.env.VITE_SATELLITE_TILE_URL ||
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  parcelServiceUrl:
    import.meta.env.VITE_PARCEL_SERVICE_URL ||
    "https://maps.bexar.org/arcgis/rest/services/Parcels/MapServer/0/query",
});

export function hasSupabaseConfiguration() {
  return Boolean(environment.supabaseUrl && environment.supabaseAnonKey);
}
