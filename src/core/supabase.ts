import { createClient } from "@supabase/supabase-js";
import type { Database } from "./supabaseDatabase.types";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
const TEST_SUPABASE_KEY = "test-publishable-key";

function requiredEnvValue(name: string, value: unknown, testFallback: string) {
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  if (import.meta.env.MODE === "test") return testFallback;
  throw new Error(`Missing required BRIX environment variable: ${name}`);
}

function requiredHttpUrl(name: string, value: unknown, testFallback: string) {
  const candidate = requiredEnvValue(name, value, testFallback);
  try {
    const url = new URL(candidate);
    if (url.protocol === "https:" || (import.meta.env.MODE === "test" && url.protocol === "http:")) return candidate;
  } catch {
    // handled below
  }
  throw new Error(`Invalid BRIX environment variable ${name}: expected an HTTPS URL.`);
}

export const supabaseUrl = requiredHttpUrl("VITE_SUPABASE_URL", import.meta.env.VITE_SUPABASE_URL, TEST_SUPABASE_URL);
export const supabaseAnonKey = requiredEnvValue("VITE_SUPABASE_PUBLISHABLE_KEY", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, TEST_SUPABASE_KEY);

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export async function invokeBrixFunction<T>(name: string, body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw error;
  return data as T;
}
