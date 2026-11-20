const requestedMode = import.meta.env.VITE_DATA_MODE || "auto";

export const environment = Object.freeze({
  dataMode: ["auto", "local", "supabase"].includes(requestedMode)
    ? requestedMode
    : "auto",
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
});

export function hasSupabaseConfiguration() {
  return Boolean(environment.supabaseUrl && environment.supabaseAnonKey);
}
