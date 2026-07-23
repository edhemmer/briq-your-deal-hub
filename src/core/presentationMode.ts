import { supabase } from "./supabase";

export type PresentationMode = "guided" | "professional";

export const DEFAULT_PRESENTATION_MODE: PresentationMode = "guided";

const ANONYMOUS_PRESENTATION_MODE_KEY = "brix.presentationMode:anonymous";

export function normalizePresentationMode(value: unknown): PresentationMode {
  return value === "professional" ? "professional" : DEFAULT_PRESENTATION_MODE;
}

export function loadAnonymousPresentationMode(): PresentationMode {
  try {
    return normalizePresentationMode(localStorage.getItem(ANONYMOUS_PRESENTATION_MODE_KEY));
  } catch {
    return DEFAULT_PRESENTATION_MODE;
  }
}

export function saveAnonymousPresentationMode(mode: PresentationMode) {
  localStorage.setItem(ANONYMOUS_PRESENTATION_MODE_KEY, mode);
}

export async function loadProfilePresentationMode(userId: string): Promise<PresentationMode> {
  const { data, error } = await supabase
    .from("profiles")
    .select("presentation_mode")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return normalizePresentationMode(data?.presentation_mode);
}

export async function saveProfilePresentationMode(userId: string, mode: PresentationMode): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ presentation_mode: mode })
    .eq("id", userId);

  if (error) throw error;
}
