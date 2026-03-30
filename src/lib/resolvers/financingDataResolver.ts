/**
 * BRIQ v1.5.2 — Financing Data Resolver
 *
 * Canonical pathway for financing/rate data ingestion.
 * Structured for future real rate source integration.
 * Currently supports explicit user input only.
 *
 * Architecture: financingDataResolver → dataSourceLayer → normalizedDealState
 */

import type { SourcedValue } from "../dataSourceLayer";
import { userValue, unavailableValue } from "../dataSourceLayer";

// ── Types ──────────────────────────────────────────────────────────────

export interface FinancingDataInput {
  loanType?: string | null;
}

export interface ResolvedFinancingData {
  rateMin: SourcedValue<number | null>;
  rateAvg: SourcedValue<number | null>;
  rateMax: SourcedValue<number | null>;
  loanType: SourcedValue<string | null>;
  term: SourcedValue<number | null>;
  downPaymentPercent: SourcedValue<number | null>;
  purchasePrice: SourcedValue<number | null>;
  closingCosts: SourcedValue<number | null>;
  arv: SourcedValue<number | null>;
  source: "api" | "user_input" | "unavailable";
  lastUpdatedAt: string | null;
}

// ── Resolver ───────────────────────────────────────────────────────────

/**
 * Resolve financing data.
 *
 * Current capabilities:
 *   - User-entered financing passthrough (normalized with provenance)
 *
 * Future capabilities (architecture-ready):
 *   - Real-time mortgage rate API integration
 *   - Rate comparison across loan types
 *
 * @param _input - Loan type preferences (unused until API integration)
 * @param existingUserData - Any user-entered financing data
 * @returns Fully normalized ResolvedFinancingData with source provenance
 */
export function getFinancingData(
  _input?: FinancingDataInput,
  existingUserData?: {
    interestRate?: number;
    loanTermYears?: number;
    downPaymentPercent?: number;
    purchasePrice?: number | null;
    closingCosts?: number;
    arv?: number;
  }
): ResolvedFinancingData {
  const now = new Date().toISOString();

  const hasUserData = existingUserData &&
    (hasValidNumber(existingUserData.interestRate) ||
     hasValidNumber(existingUserData.purchasePrice));

  if (hasUserData) {
    const rate = existingUserData.interestRate;

    return {
      rateMin: unavailableValue<number | null>(null),
      rateAvg: hasValidNumber(rate) ? userValue<number | null>(rate!) : unavailableValue<number | null>(null),
      rateMax: unavailableValue<number | null>(null),
      loanType: unavailableValue<string | null>(null),
      term: hasValidNumber(existingUserData.loanTermYears)
        ? userValue<number | null>(existingUserData.loanTermYears!)
        : unavailableValue<number | null>(null),
      downPaymentPercent: hasValidNumber(existingUserData.downPaymentPercent)
        ? userValue<number | null>(existingUserData.downPaymentPercent!)
        : unavailableValue<number | null>(null),
      purchasePrice: hasValidNumber(existingUserData.purchasePrice)
        ? userValue<number | null>(existingUserData.purchasePrice!)
        : unavailableValue<number | null>(null),
      closingCosts: hasValidNumber(existingUserData.closingCosts)
        ? userValue<number | null>(existingUserData.closingCosts!)
        : unavailableValue<number | null>(null),
      arv: hasValidNumber(existingUserData.arv)
        ? userValue<number | null>(existingUserData.arv!)
        : unavailableValue<number | null>(null),
      source: "user_input",
      lastUpdatedAt: now,
    };
  }

  // No financing data available — do NOT inject "typical" rates
  return {
    rateMin: unavailableValue<number | null>(null),
    rateAvg: unavailableValue<number | null>(null),
    rateMax: unavailableValue<number | null>(null),
    loanType: unavailableValue<string | null>(null),
    term: unavailableValue<number | null>(null),
    downPaymentPercent: unavailableValue<number | null>(null),
    purchasePrice: unavailableValue<number | null>(null),
    closingCosts: unavailableValue<number | null>(null),
    arv: unavailableValue<number | null>(null),
    source: "unavailable",
    lastUpdatedAt: null,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────

function hasValidNumber(value: number | null | undefined): boolean {
  return value != null && Number.isFinite(value) && value !== 0;
}
