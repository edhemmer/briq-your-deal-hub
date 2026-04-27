/**
 * BRIX v1.9.0 — Public Record Resolver
 *
 * Lightweight resolver/normalizer for tax and public-record inputs
 * already available in the app flow.
 * No paid APIs, no scraping, no polling.
 */

import type { RawPropertyData, SourcedField } from "./propertyDataSources";

export interface PublicRecordInput {
  annualPropertyTax?: number | null;
  assessedValue?: number | null;
  yearBuilt?: number | null;
}

function publicField<T>(value: T): SourcedField<T> {
  return { value, source: "public_record", confidence: "high" };
}

/**
 * Merge public-record data into existing RawPropertyData.
 * Returns a new object — never mutates original.
 */
export function mergePublicRecordData(
  existing: RawPropertyData,
  input: PublicRecordInput
): RawPropertyData {
  const result = { ...existing, taxes: [...existing.taxes] };

  if (input.annualPropertyTax != null && Number.isFinite(input.annualPropertyTax) && input.annualPropertyTax > 0) {
    result.taxes.push(publicField(input.annualPropertyTax));
  }

  if (input.yearBuilt != null && Number.isFinite(input.yearBuilt) && input.yearBuilt > 1800 && !existing.yearBuilt) {
    result.yearBuilt = publicField(input.yearBuilt);
  }

  return result;
}
