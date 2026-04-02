/**
 * BRIQ v1.9.0 — Canonical Property Data Sources
 *
 * Single source of truth for source-aware property input structure.
 * Raw storage and resolved analysis data are distinct types.
 */

// ── Source Types ──────────────────────────────────────────────────────

export type PropertySource = "listing" | "public_record" | "user" | "estimate";

export type SourceConfidence = "high" | "medium" | "low";

// ── Source-Aware Field ────────────────────────────────────────────────

export interface SourcedField<T> {
  value: T;
  source: PropertySource;
  confidence: SourceConfidence;
}

// ── Raw Property Data (multi-source storage) ──────────────────────────

export interface RawPropertyData {
  address: SourcedField<string> | null;
  price: SourcedField<number> | null;
  rentUser: SourcedField<number> | null;
  rentEstimate: SourcedField<number> | null;
  taxes: SourcedField<number>[];        // multiple sources allowed
  beds: SourcedField<number> | null;
  baths: SourcedField<number> | null;
  sqft: SourcedField<number> | null;
  yearBuilt: SourcedField<number> | null;
}

export function createEmptyRawPropertyData(): RawPropertyData {
  return {
    address: null,
    price: null,
    rentUser: null,
    rentEstimate: null,
    taxes: [],
    beds: null,
    baths: null,
    sqft: null,
    yearBuilt: null,
  };
}

// ── Resolved Property Data (single deterministic values for analysis) ─

export interface ResolvedPropertyData {
  address: string | null;
  price: number | null;
  rent: number | null;
  taxes: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  yearBuilt: number | null;
  completenessScore: number;
}
