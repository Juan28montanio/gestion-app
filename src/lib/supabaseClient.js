import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://dmicvtkgbyoleckykzez.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_o58zwsv5E4AeoR8BBPwUPg_63oRLTVg";

function readEnv(...names) {
  for (const name of names) {
    const value = import.meta.env[name];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

const supabaseUrl =
  readEnv("VITE_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL") ||
  DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  readEnv(
    "VITE_SUPABASE_ANON_KEY",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
  ) || DEFAULT_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error(
      "Falta configurar las variables publicas de Supabase para usar la base de datos."
    );
  }

  return supabase;
}

export default supabase;
