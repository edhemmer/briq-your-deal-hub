/**
 * BRIX v1.9.0 — Canonical Analysis Data Resolver
 *
 * Single canonical helper that resolves which values are used in analysis.
 * This is the ONLY allowed source for analysis-driving property values.
 *
 * Source hierarchy per field:
 *   address  → listing > user > estimate
 *   price    → listing > user > estimate
 *   taxes    → public_record > user > estimate
 *   rent     → lower of (user, estimate) when both exist
 *   beds/baths/sqft/yearBuilt → listing > public_record > user > estimate
 */

import type { RawPropertyData, SourcedField, ResolvedPropertyData } from "./propertyDataSources";

// ── Resolution Helpers ────────────────────────────────────────────────

const SOURCE_PRIORITY: Record<string, number> = {
  listing: 0,
  public_record: 1,
  user: 2,
  estimate: 3,
};

function pickByPriority<T>(candidates: (SourcedField<T> | null | undefined)[]): T | null {
  const valid = candidates.filter((c): c is SourcedField<T> => c != null);
  if (valid.length === 0) return null;
  valid.sort((a, b) => (SOURCE_PRIORITY[a.source] ?? 99) - (SOURCE_PRIORITY[b.source] ?? 99));
  return valid[0].value;
}

function pickTaxByPriority(taxes: SourcedField<number>[]): number | null {
  if (taxes.length === 0) return null;
  const sorted = [...taxes].sort((a, b) => (SOURCE_PRIORITY[a.source] ?? 99) - (SOURCE_PRIORITY[b.source] ?? 99));
  return sorted[0].value;
}

function resolveRent(rentUser: SourcedField<number> | null, rentEstimate: SourcedField<number> | null): number | null {
  if (rentUser && rentEstimate) {
    return Math.min(rentUser.value, rentEstimate.value);
  }
  return rentUser?.value ?? rentEstimate?.value ?? null;
}

// ── Completeness Scoring ──────────────────────────────────────────────

const COMPLETENESS_FIELDS: (keyof ResolvedPropertyData)[] = [
  "address", "price", "rent", "taxes", "beds", "baths", "sqft", "yearBuilt",
];

function computeCompleteness(resolved: Omit<ResolvedPropertyData, "completenessScore">): number {
  let present = 0;
  for (const key of COMPLETENESS_FIELDS) {
    const val = resolved[key];
    if (val != null && val !== 0 && val !== "") present++;
  }
  return Math.round((present / COMPLETENESS_FIELDS.length) * 100);
}

// ── Main Resolver ─────────────────────────────────────────────────────

/**
 * Resolve raw multi-source property data into a single deterministic
 * ResolvedPropertyData for analysis consumption.
 */
export function resolvePropertyForAnalysis(raw: RawPropertyData): ResolvedPropertyData {
  const partial = {
    address: raw.address?.value ?? null,
    price: pickByPriority([raw.price]),
    rent: resolveRent(raw.rentUser, raw.rentEstimate),
    taxes: pickTaxByPriority(raw.taxes),
    beds: pickByPriority([raw.beds]),
    baths: pickByPriority([raw.baths]),
    sqft: pickByPriority([raw.sqft]),
    yearBuilt: pickByPriority([raw.yearBuilt]),
  };

  return {
    ...partial,
    completenessScore: computeCompleteness(partial),
  };
}
