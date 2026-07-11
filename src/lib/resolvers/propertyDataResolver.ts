/**
 * BRIX v1.5.2 — Property Data Resolver
 *
 * Canonical pathway for property data ingestion.
 * Resolves property information via county-based logic
 * and normalizes into SourcedValue objects.
 *
 * Architecture: propertyDataResolver → dataSourceLayer → normalizedDealState
 */

import type { SourcedValue } from "../dataSourceLayer";
import { userValue, countyValue, unavailableValue } from "../dataSourceLayer";
import { resolveCountyPropertyUrl } from "../property/countyPropertyResolver";
import { resolveTaxRecord, type TaxRecordResolution } from "../property/taxRecordResolver";

// ── Types ──────────────────────────────────────────────────────────────

export interface PropertyDataInput {
  address: string;
  city: string;
  state: string;
  zipCode?: string | null;
  county?: string;
}

export interface ResolvedPropertyData {
  address: SourcedValue<string>;
  propertyType: SourcedValue<string | null>;
  yearBuilt: SourcedValue<number | null>;
  squareFootage: SourcedValue<number | null>;
  lotSize: SourcedValue<string | null>;
  assessedValue: SourcedValue<number | null>;
  annualPropertyTax: SourcedValue<number | null>;
  taxRecord: TaxRecordResolution;
  zoningType: SourcedValue<string | null>;
  propertyRecordUrl: SourcedValue<string | null>;
  source: "county_record" | "user_input" | "unavailable";
  lastUpdatedAt: string | null;
}

// ── Resolver ───────────────────────────────────────────────────────────

/**
 * Resolve property data for a given address.
 *
 * Current capabilities:
 *   - County property record URL resolution (via countyPropertyResolver)
 *   - User-entered enrichment data passthrough
 *
 * Future capabilities (architecture-ready):
 *   - County tax record API integration
 *   - Third-party property data API integration
 *
 * @param input - Address and location data
 * @param existingUserData - Any existing user-entered property data
 * @returns Fully normalized ResolvedPropertyData with source provenance
 */
export function getPropertyData(
  input: PropertyDataInput,
  existingUserData?: {
    propertyType?: string | null;
    yearBuilt?: number | null;
    squareFootage?: number | null;
    lotSize?: string | null;
    assessedValue?: number | null;
    annualPropertyTax?: number | null;
    taxHistory?: unknown;
    taxRecordUrl?: string | null;
    taxVerificationStatus?: string | null;
    zoningType?: string | null;
    propertyRecordUrl?: string | null;
  }
): ResolvedPropertyData {
  const now = new Date().toISOString();

  // Resolve county property record URL
  const countyResult = resolveCountyPropertyUrl({
    property_address: input.address,
    city: input.city,
    state: input.state,
    zip_code: input.zipCode,
    county: input.county,
  });

  // Determine property record URL: user-provided takes precedence, then county resolution
  const recordUrl = existingUserData?.propertyRecordUrl
    ? userValue(existingUserData.propertyRecordUrl)
    : countyResult.source === "registry"
      ? countyValue(countyResult.url)
      : unavailableValue<string | null>(null);

  const taxRecord = resolveTaxRecord(
    {
      property_address: input.address,
      city: input.city,
      state: input.state,
      zip_code: input.zipCode,
      county: input.county,
    },
    {
      taxHistory: existingUserData?.taxHistory,
      annualPropertyTax: existingUserData?.annualPropertyTax,
      taxRecordUrl: existingUserData?.taxRecordUrl,
      taxVerificationStatus: existingUserData?.taxVerificationStatus,
    }
  );

  // Normalize all property fields with source provenance
  return {
    address: userValue(input.address),
    propertyType: normalizeOptional(existingUserData?.propertyType),
    yearBuilt: normalizeOptionalNumber(existingUserData?.yearBuilt),
    squareFootage: normalizeOptionalNumber(existingUserData?.squareFootage),
    lotSize: normalizeOptional(existingUserData?.lotSize),
    assessedValue: normalizeOptionalNumber(existingUserData?.assessedValue),
    annualPropertyTax: taxRecord.annualTax != null
      ? countyValue(taxRecord.annualTax)
      : normalizeOptionalNumber(existingUserData?.annualPropertyTax),
    taxRecord,
    zoningType: normalizeOptional(existingUserData?.zoningType),
    propertyRecordUrl: recordUrl,
    source: existingUserData ? "user_input" : countyResult.source === "registry" ? "county_record" : "unavailable",
    lastUpdatedAt: now,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────

function normalizeOptional(value: string | null | undefined): SourcedValue<string | null> {
  if (value && value.trim().length > 0) {
    return userValue(value);
  }
  return unavailableValue<string | null>(null);
}

function normalizeOptionalNumber(value: number | null | undefined): SourcedValue<number | null> {
  if (value != null && Number.isFinite(value) && value !== 0) {
    return userValue(value);
  }
  return unavailableValue<number | null>(null);
}
