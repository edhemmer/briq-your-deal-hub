/**
 * BRIQ v1.9.0 — Listing Data Normalizer
 *
 * Accepts listing-derived property values and normalizes them
 * into the canonical source-aware model.
 */

import type { RawPropertyData, SourcedField } from "./propertyDataSources";
import { createEmptyRawPropertyData } from "./propertyDataSources";

export interface ListingInput {
  address?: string | null;
  price?: number | null;
  rent?: number | null;
  taxes?: number | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  yearBuilt?: number | null;
}

function listingField<T>(value: T): SourcedField<T> {
  return { value, source: "listing", confidence: "high" };
}

/**
 * Normalize listing-derived values into canonical RawPropertyData.
 * Only present values are stored. Missing fields remain null.
 */
export function normalizeListingData(input: ListingInput): RawPropertyData {
  const raw = createEmptyRawPropertyData();

  if (input.address && input.address.trim().length > 0) {
    raw.address = listingField(input.address.trim());
  }
  if (input.price != null && Number.isFinite(input.price) && input.price > 0) {
    raw.price = listingField(input.price);
  }
  if (input.rent != null && Number.isFinite(input.rent) && input.rent > 0) {
    raw.rentEstimate = listingField(input.rent);
  }
  if (input.taxes != null && Number.isFinite(input.taxes) && input.taxes > 0) {
    raw.taxes.push(listingField(input.taxes));
  }
  if (input.beds != null && Number.isFinite(input.beds) && input.beds > 0) {
    raw.beds = listingField(input.beds);
  }
  if (input.baths != null && Number.isFinite(input.baths) && input.baths > 0) {
    raw.baths = listingField(input.baths);
  }
  if (input.sqft != null && Number.isFinite(input.sqft) && input.sqft > 0) {
    raw.sqft = listingField(input.sqft);
  }
  if (input.yearBuilt != null && Number.isFinite(input.yearBuilt) && input.yearBuilt > 1800) {
    raw.yearBuilt = listingField(input.yearBuilt);
  }

  return raw;
}
