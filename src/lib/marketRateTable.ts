/**
 * BRIQ — Canonical Market Rate Reference
 *
 * Centralized, dated source of base financing rate ranges and assumption defaults.
 * Deterministic. Update `RATE_TABLE_AS_OF` whenever ranges change.
 *
 * NOTE: These are reference ranges, not real-time quotes. The UI surfaces the
 * "as of" date so investors see exactly when the model was last calibrated.
 * When a real rate API is wired in, replace `BASE_RATES` lookups with the
 * resolver output and keep this table as the deterministic fallback.
 */

export const RATE_TABLE_AS_OF = "2026-04-01"; // YYYY-MM-DD — update when rate ranges change

// Annualized rate ranges by financing type (decimal, e.g. 0.07 = 7.00%)
export const BASE_RATES: Record<string, [number, number]> = {
  conventional:       [0.0625, 0.0775],
  dscr:               [0.0700, 0.0875],
  bridge:             [0.0900, 0.1250],
  portfolio:          [0.0675, 0.0875],
  commercial_bank:    [0.0675, 0.0875],
  agency:             [0.0575, 0.0750],
  sba:                [0.0675, 0.0825],
  cash:               [0,      0     ],
  local_bank:         [0.0700, 0.1000],
  developer:          [0.0600, 0.0900],
  private_hard_money: [0.0950, 0.1450],
};

// Down-payment ranges by financing type (decimal, e.g. 0.20 = 20%)
export const DOWN_PAYMENT_RANGES: Record<string, [number, number]> = {
  conventional:       [0.20, 0.25],
  dscr:               [0.20, 0.30],
  bridge:             [0.10, 0.20],
  portfolio:          [0.15, 0.25],
  commercial_bank:    [0.25, 0.35],
  agency:             [0.20, 0.30],
  sba:                [0.10, 0.20],
  cash:               [1.00, 1.00],
  local_bank:         [0.20, 0.35],
  developer:          [0.10, 0.30],
  private_hard_money: [0.15, 0.30],
};

// Standard underwriting assumption defaults (decimals where applicable).
// Used by intake and as fallback when user has not entered a value.
export const ASSUMPTION_DEFAULTS = {
  closingCostPercent: 0.06,        // 6% of purchase price
  downPaymentPercent: 0.25,        // 25% conventional investor default
  interestRate: 0.0700,            // midpoint of conventional range
  loanTermYears: 30,
  vacancyPercent: 0.05,            // 5% LTR baseline
  maintenancePercent: 0.05,        // 5% of gross rent
  managementPercent: 0.08,         // 8% of gross rent
  capexPercent: 0.05,              // 5% of gross rent
  rehabContingencyPercent: 0.10,   // 10% of rehab cost
  refinanceLtv: 0.75,              // 75% LTV cash-out refinance
  insuranceOfPricePercent: 0.0035, // 0.35% of purchase price as annual insurance estimate
  taxOfPricePercent: 0.0125,       // 1.25% of purchase price as annual tax estimate (national mid)
} as const;

export interface RateLineage {
  asOf: string;       // ISO date of the rate table
  source: string;     // human-readable source label
}

export function getRateLineage(): RateLineage {
  return {
    asOf: RATE_TABLE_AS_OF,
    source: "DealIQ Market Rate Reference",
  };
}
