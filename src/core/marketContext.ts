import { supabase } from "./supabase";

export type MarketContext = {
  zip: string;
  survey: string;
  rentAdjustment: { factor: number; through: string; source: string } | null;
  medianGrossRent: number | null;
  medianGrossRentToday: number | null;
  medianRentByBedroomsToday: Record<"studio" | "1" | "2" | "3" | "4" | "5", number | null>;
  medianHomeValue: number | null;
  medianHouseholdIncome: number | null;
  renterShare: number | null;
  rentalVacancyRate: number | null;
  housingUnits: number | null;
};

const cache = new Map<string, Promise<MarketContext | null>>();

/** Census + BLS context for a ZIP code from the free market-context function. Null when unavailable. */
export function loadMarketContext(zip: string | undefined): Promise<MarketContext | null> {
  const clean = (zip ?? "").trim().slice(0, 5);
  if (!/^\d{5}$/.test(clean)) return Promise.resolve(null);
  if (!cache.has(clean)) {
    cache.set(clean, (async () => {
      try {
        const { data, error } = await supabase.functions.invoke(`market-context?zip=${clean}`, { method: "GET" });
        if (error || !data || typeof data !== "object" || Array.isArray(data) || "error" in data) return null;
        const ctx = data as Partial<MarketContext>;
        if (typeof ctx.zip !== "string" || !ctx.medianRentByBedroomsToday || typeof ctx.medianRentByBedroomsToday !== "object") return null;
        return ctx as MarketContext;
      } catch {
        return null;
      }
    })());
  }
  return cache.get(clean)!;
}
