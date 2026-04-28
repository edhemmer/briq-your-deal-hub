/**
 * BRIX v1.5.2 — Rent Data Resolver
 *
 * Canonical pathway for rent data ingestion.
 * Structured for future rental intelligence API integration.
 * Currently supports explicit user input only.
 *
 * Architecture: rentDataResolver → dataSourceLayer → normalizedDealState
 */

import type { SourcedValue } from "../dataSourceLayer";
import { userValue, unavailableValue } from "../dataSourceLayer";

// ── Types ──────────────────────────────────────────────────────────────

export interface RentDataInput {
  address: string;
  city: string;
  state: string;
  zipCode?: string | null;
  propertyType?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  squareFootage?: number | null;
}

export interface ResolvedRentData {
  estimatedRentLow: SourcedValue<number | null>;
  estimatedRentMedian: SourcedValue<number | null>;
  estimatedRentHigh: SourcedValue<number | null>;
  rentPerSqft: SourcedValue<number | null>;
  source: "api" | "user_input" | "unavailable";
  confidenceLevel: "high" | "medium" | "low" | "unavailable";
  lastUpdatedAt: string | null;
}

// ── Resolver ───────────────────────────────────────────────────────────

/**
 * Resolve rent data for a given property profile.
 *
 * Current capabilities:
 *   - User-entered rent passthrough (normalized with provenance)
 *
 * Future capabilities (architecture-ready):
 *   - Rental intelligence API integration (e.g., Rentometer, HUD FMR)
 *   - Comparable rent analysis
 *
 * @param _input - Property profile for rent estimation (unused until API integration)
 * @param existingUserData - Any user-entered rent data
 * @returns Fully normalized ResolvedRentData with source provenance
 */
export function getRentData(
  _input: RentDataInput,
  existingUserData?: {
    monthlyRent?: number;
    otherIncome?: number;
  }
): ResolvedRentData {
  const now = new Date().toISOString();

  // If user has entered rent data, normalize it
  if (existingUserData?.monthlyRent && existingUserData.monthlyRent > 0) {
    const rent = existingUserData.monthlyRent;

    return {
      estimatedRentLow: unavailableValue<number | null>(null),
      estimatedRentMedian: userValue<number | null>(rent),
      estimatedRentHigh: unavailableValue<number | null>(null),
      rentPerSqft: unavailableValue<number | null>(null),
      source: "user_input",
      confidenceLevel: "medium",
      lastUpdatedAt: now,
    };
  }

  // No rent data available — do NOT fabricate values
  return {
    estimatedRentLow: unavailableValue<number | null>(null),
    estimatedRentMedian: unavailableValue<number | null>(null),
    estimatedRentHigh: unavailableValue<number | null>(null),
    rentPerSqft: unavailableValue<number | null>(null),
    source: "unavailable",
    confidenceLevel: "unavailable",
    lastUpdatedAt: null,
  };
}
