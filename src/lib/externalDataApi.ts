/**
 * BRIX External Data API client.
 *
 * Thin wrappers around the geocode-address, fetch-bls-employment, and
 * fetch-fred-series edge functions. Returns null on failure — the
 * deterministic engines downstream handle partial degradation truthfully.
 */
import { supabase } from "@/integrations/supabase/client";

export interface GeocodeResult {
  found: boolean;
  formatted_address?: string;
  location?: { lat: number; lng: number } | null;
  place_id?: string | null;
  city?: string | null;
  county?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!address?.trim()) return null;
  try {
    const { data, error } = await supabase.functions.invoke("geocode-address", {
      body: { address },
    });
    if (error) {
      console.warn("geocodeAddress error:", error.message);
      return null;
    }
    return data as GeocodeResult;
  } catch (e) {
    console.warn("geocodeAddress threw:", e);
    return null;
  }
}

export interface BlsSeriesResult {
  seriesId: string;
  latest: { year: number; period: string; value: number } | null;
  yoy_pct: number | null;
  points: Array<{ year: number; period: string; value: number }>;
}

export async function fetchBlsSeries(
  seriesIds: string[],
  opts?: { startYear?: number; endYear?: number },
): Promise<BlsSeriesResult[] | null> {
  if (!seriesIds.length) return null;
  try {
    const { data, error } = await supabase.functions.invoke("fetch-bls-employment", {
      body: { seriesIds, ...opts },
    });
    if (error) {
      console.warn("fetchBlsSeries error:", error.message);
      return null;
    }
    return (data?.series ?? []) as BlsSeriesResult[];
  } catch (e) {
    console.warn("fetchBlsSeries threw:", e);
    return null;
  }
}

export interface FredSeriesResult {
  seriesId: string;
  latest: { date: string; value: number | null } | null;
  yoy_pct: number | null;
  observations: Array<{ date: string; value: number | null }>;
}

export async function fetchFredSeries(
  seriesId: string,
  limit = 24,
): Promise<FredSeriesResult | null> {
  try {
    const { data, error } = await supabase.functions.invoke("fetch-fred-series", {
      body: { seriesId, limit },
    });
    if (error) {
      console.warn("fetchFredSeries error:", error.message);
      return null;
    }
    return data as FredSeriesResult;
  } catch (e) {
    console.warn("fetchFredSeries threw:", e);
    return null;
  }
}

// Common FRED series IDs for real estate underwriting
export const FRED_SERIES = {
  MORTGAGE_30Y: "MORTGAGE30US",
  FED_FUNDS: "FEDFUNDS",
  CPI: "CPIAUCSL",
  UNEMPLOYMENT: "UNRATE",
  CASE_SHILLER: "CSUSHPINSA",
} as const;
