import { createClient } from "@supabase/supabase-js";
import {
  environment,
  hasSupabaseConfiguration,
} from "../config/environment.js";

let client;

export function getSupabaseClient() {
  if (!hasSupabaseConfiguration()) return null;
  client ??= createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
    {
      auth: { persistSession: true, autoRefreshToken: true },
    },
  );
  return client;
}
