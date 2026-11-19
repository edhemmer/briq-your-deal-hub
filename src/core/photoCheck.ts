import { supabase } from "./supabase";

export type PhotoObservation = { issue: string; severity: "high" | "medium" | "low"; detail: string };
export type PhotoFinding = {
  id: string;
  fileName: string;
  area: string;
  condition: "good" | "fair" | "poor";
  rehab: "none" | "cosmetic" | "moderate" | "heavy";
  summary: string;
  observations: PhotoObservation[];
  checkedAt: string;
};

let enabledPromise: Promise<boolean> | null = null;

/** Whether the free photo AI is configured on the backend. Hidden in the UI until it is. */
export function photoCheckEnabled(): Promise<boolean> {
  if (!enabledPromise) {
    enabledPromise = (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("photo-check", { method: "GET" });
        return !error && Boolean((data as { enabled?: boolean } | null)?.enabled);
      } catch {
        return false;
      }
    })();
    void enabledPromise.then((on) => { if (!on) enabledPromise = null; });
  }
  return enabledPromise;
}

/** Shrinks a photo to at most 1024px on the long side as JPEG so it uploads fast and stays small. */
export async function prepareImage(file: File, maxSide = 1024): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("That file isn't a photo we can read."));
      el.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser couldn't prepare that photo.");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function checkPhoto(file: File): Promise<PhotoFinding> {
  const image = await prepareImage(file);
  const { data, error } = await supabase.functions.invoke("photo-check", { method: "POST", body: { image } });
  if (error) {
    const context = (error as { context?: Response }).context;
    const body = context && typeof context.json === "function" ? await context.json().catch(() => null) : null;
    throw new Error(typeof body?.error === "string" ? body.error : "Photo check is unavailable right now.");
  }
  const result = data as Omit<PhotoFinding, "id" | "fileName">;
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    fileName: file.name.slice(0, 80),
    area: result.area,
    condition: result.condition,
    rehab: result.rehab,
    summary: result.summary,
    observations: Array.isArray(result.observations) ? result.observations : [],
    checkedAt: result.checkedAt ?? new Date().toISOString(),
  };
}

/** Rough 2026 rehab cost bands per finished square foot, by scope. Planning ranges, not bids. */
export const REHAB_PER_SQFT: Record<"cosmetic" | "moderate" | "heavy", [number, number]> = {
  cosmetic: [10, 25],
  moderate: [25, 50],
  heavy: [50, 100],
};

export type PhotoSummary = {
  scope: "none" | "cosmetic" | "moderate" | "heavy";
  photos: number;
  topIssues: (PhotoObservation & { area: string })[];
  estimate: { low: number; high: number } | null;
  budgetNote: string | null;
};

const RANK = { none: 0, cosmetic: 1, moderate: 2, heavy: 3 } as const;
const SEV = { high: 0, medium: 1, low: 2 } as const;

export function summarizePhotos(findings: PhotoFinding[], squareFeet: number | undefined, rehabBudget: number): PhotoSummary | null {
  if (!findings.length) return null;
  // Scope follows the worst rooms, but one heavy photo among many cosmetic ones reads as moderate overall.
  const ranks = findings.map((f) => RANK[f.rehab] ?? 1).sort((a, b) => b - a);
  const worst = ranks[0];
  const heavyCount = ranks.filter((r) => r === 3).length;
  const level = worst === 3 && heavyCount === 1 && findings.length >= 4 ? 2 : worst;
  const scope = (["none", "cosmetic", "moderate", "heavy"] as const)[level];
  const topIssues = findings
    .flatMap((f) => f.observations.map((o) => ({ ...o, area: f.area })))
    .sort((a, b) => SEV[a.severity] - SEV[b.severity])
    .slice(0, 6);
  let estimate: PhotoSummary["estimate"] = null;
  let budgetNote: string | null = null;
  if (scope !== "none" && squareFeet && squareFeet > 200) {
    const [lo, hi] = REHAB_PER_SQFT[scope];
    estimate = { low: Math.round((lo * squareFeet) / 1000) * 1000, high: Math.round((hi * squareFeet) / 1000) * 1000 };
    if (rehabBudget < estimate.low) {
      budgetNote = rehabBudget > 0
        ? `Your rehab budget is below the ${scope} range for this size. Consider raising it before you trust the numbers.`
        : `The photos suggest ${scope} work, but your rehab budget is $0.`;
    }
  } else if (scope !== "none" && rehabBudget <= 0) {
    budgetNote = `The photos suggest ${scope} work, but your rehab budget is $0. Add square feet in Property to get a dollar range.`;
  }
  return { scope, photos: findings.length, topIssues, estimate, budgetNote };
}
