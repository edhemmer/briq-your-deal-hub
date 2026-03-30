/**
 * BRIQ v1.5.1 — Canonical Data Source Layer
 * 
 * Centralized data orchestration for analytical inputs.
 * All future data ingestion (property APIs, rental intelligence,
 * financing/rate sources, market/risk sources) flows through this layer.
 * 
 * Architecture direction:
 *   dataSourceLayer → normalizedDealState → canonical engines → UI
 * 
 * In this patch: architecture and clean interfaces only.
 * No broad live integrations yet.
 */

// ── Source Types ────────────────────────────────────────────────────────

export type DataSourceOrigin =
  | "user_input"         // Explicitly entered by the user
  | "extracted"          // AI-extracted from listing image/text
  | "county_record"      // From county property record lookup
  | "market_data"        // From market conditions (user-entered or future API)
  | "calculated"         // Derived deterministically from other values
  | "unavailable";       // No data available

export interface SourcedValue<T> {
  value: T;
  origin: DataSourceOrigin;
  timestamp: string | null;       // ISO date when value was last sourced
  confidence: "verified" | "user_reported" | "estimated" | "unavailable";
}

// ── Source Constructors ────────────────────────────────────────────────

export function userValue<T>(value: T): SourcedValue<T> {
  return {
    value,
    origin: "user_input",
    timestamp: new Date().toISOString(),
    confidence: "user_reported",
  };
}

export function extractedValue<T>(value: T): SourcedValue<T> {
  return {
    value,
    origin: "extracted",
    timestamp: new Date().toISOString(),
    confidence: "estimated",
  };
}

export function calculatedValue<T>(value: T): SourcedValue<T> {
  return {
    value,
    origin: "calculated",
    timestamp: new Date().toISOString(),
    confidence: "verified",
  };
}

export function countyValue<T>(value: T): SourcedValue<T> {
  return {
    value,
    origin: "county_record",
    timestamp: new Date().toISOString(),
    confidence: "verified",
  };
}

export function marketValue<T>(value: T): SourcedValue<T> {
  return {
    value,
    origin: "market_data",
    timestamp: new Date().toISOString(),
    confidence: "user_reported",
  };
}

export function unavailableValue<T>(fallback: T): SourcedValue<T> {
  return {
    value: fallback,
    origin: "unavailable",
    timestamp: null,
    confidence: "unavailable",
  };
}

// ── Data Source Registry ───────────────────────────────────────────────
// Future integration points. Each source category will have its own
// fetcher/resolver that returns SourcedValue objects.

export interface DataSourceRegistry {
  property: {
    /** County tax/property record APIs */
    countyRecords: boolean;
    /** Third-party property data APIs (future) */
    propertyDataAPI: boolean;
  };
  rental: {
    /** Rental intelligence APIs (future) */
    rentalIntelligenceAPI: boolean;
  };
  financing: {
    /** Rate sources / mortgage data (future) */
    rateSourceAPI: boolean;
  };
  market: {
    /** Market condition data sources (future) */
    marketDataAPI: boolean;
  };
  risk: {
    /** Crime and risk data sources (future) */
    crimeDataAPI: boolean;
  };
}

/**
 * Current data source availability.
 * Updated as integrations are added in future patches.
 */
export const CURRENT_DATA_SOURCES: DataSourceRegistry = {
  property: {
    countyRecords: true,   // County URL resolver is active
    propertyDataAPI: false,
  },
  rental: {
    rentalIntelligenceAPI: false,
  },
  financing: {
    rateSourceAPI: false,
  },
  market: {
    marketDataAPI: false,
  },
  risk: {
    crimeDataAPI: false,
  },
};

// ── Availability Helpers ───────────────────────────────────────────────

export function isSourced<T>(sv: SourcedValue<T>): boolean {
  return sv.origin !== "unavailable";
}

export function isUserEntered<T>(sv: SourcedValue<T>): boolean {
  return sv.origin === "user_input" || sv.origin === "extracted";
}

export function hasValue(n: number | null | undefined): boolean {
  return n != null && Number.isFinite(n) && n !== 0;
}
