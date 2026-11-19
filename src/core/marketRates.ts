import { MARKET_DEFAULTS } from "./investorMath";
import { supabase } from "./supabase";

/** Spreads over the Freddie Mac 30-year primary-residence average (2026 market norms). */
export const INVESTMENT_SPREAD = 0.625;
export const DSCR_SPREAD = 1.125;

export type MarketRates = {
  asOf: string;
  primaryRate30y: number;
  investmentRate30y: number;
  dscrRate30y: number;
  live: boolean;
  source: string;
};

const roundEighth = (value: number) => Math.round(value * 8) / 8;

export const STATIC_MARKET_RATES: MarketRates = {
  asOf: MARKET_DEFAULTS.asOf,
  primaryRate30y: MARKET_DEFAULTS.primaryRate30y,
  investmentRate30y: MARKET_DEFAULTS.investmentRate30y,
  dscrRate30y: MARKET_DEFAULTS.dscrRate30y,
  live: false,
  source: "Freddie Mac PMMS (built-in snapshot)",
};

export function ratesFromPrimary(primary: number, asOf: string, live: boolean): MarketRates {
  return {
    asOf,
    primaryRate30y: primary,
    investmentRate30y: roundEighth(primary + INVESTMENT_SPREAD),
    dscrRate30y: roundEighth(primary + DSCR_SPREAD),
    live,
    source: "Freddie Mac PMMS via FRED",
  };
}

let inflight: Promise<MarketRates> | null = null;

/** Latest weekly rates from the free market-rates function; falls back to the built-in snapshot. */
export function loadMarketRates(): Promise<MarketRates> {
  inflight ??= (async () => {
    try {
      const { data, error } = await supabase.functions.invoke("market-rates", { method: "GET" });
      if (error) throw error;
      const primary = Number((data as { primaryRate30y?: unknown })?.primaryRate30y);
      const asOf = String((data as { asOf?: unknown })?.asOf ?? "");
      if (!Number.isFinite(primary) || primary <= 0 || primary > 20 || !/^\d{4}-\d{2}-\d{2}$/.test(asOf)) throw new Error("Bad rate payload");
      return asOf >= STATIC_MARKET_RATES.asOf ? ratesFromPrimary(primary, asOf, true) : STATIC_MARKET_RATES;
    } catch {
      inflight = null;
      return STATIC_MARKET_RATES;
    }
  })();
  return inflight;
}
