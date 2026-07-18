import { createClient } from "@supabase/supabase-js";

function requiredEnvValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

export const supabaseUrl = requiredEnvValue(import.meta.env.VITE_SUPABASE_URL, "https://luwaqrkhmxcqsozmilbw.supabase.co");
export const supabaseAnonKey = requiredEnvValue(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "sb_publishable_gl6bNZ2T_sGmO7SbDlcdUA_9UzzNB3f");

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
