/**
 * BRIX v1.6.1 — Property Source Resolver
 *
 * Canonical module for normalizing addresses/URLs, resolving US county/jurisdiction,
 * mapping to official property record sources, and providing a source hierarchy.
 *
 * Reusable — not tied to UI components.
 * Pure functions only. No side effects. No paid APIs.
 */

import { resolveCountyPropertyUrl, type PropertyResolverResult } from "./property/countyPropertyResolver";
import { findCountyEntry } from "./property/countyRegistry";

// ── Source Hierarchy ───────────────────────────────────────────────────

/**
 * Deterministic source quality ranking.
 * Higher rank = more trustworthy. Centralized — do not duplicate in UI.
 */
export type SourceQuality = "official" | "listing" | "estimate" | "user_entered" | "unavailable";

const SOURCE_RANK: Record<SourceQuality, number> = {
  official: 4,
  listing: 3,
  estimate: 2,
  user_entered: 1,
  unavailable: 0,
};

export function compareSourceQuality(a: SourceQuality, b: SourceQuality): number {
  return SOURCE_RANK[a] - SOURCE_RANK[b];
}

export function isHigherQuality(candidate: SourceQuality, current: SourceQuality): boolean {
  return SOURCE_RANK[candidate] > SOURCE_RANK[current];
}

export const SOURCE_QUALITY_LABELS: Record<SourceQuality, string> = {
  official: "Official Record",
  listing: "Listing Data",
  estimate: "Estimate",
  user_entered: "User Entered",
  unavailable: "Unavailable",
};

// ── Address Normalization ──────────────────────────────────────────────

export interface NormalizedAddress {
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string | null;
  raw: string;
}

/**
 * Normalize a raw address string into structured components.
 * Best-effort parsing — not geocoding.
 */
export function normalizeAddress(raw: string): NormalizedAddress | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Try to parse "123 Main St, City, ST 12345" pattern
  const parts = trimmed.split(",").map(s => s.trim());
  if (parts.length >= 3) {
    const streetAddress = parts[0];
    const city = parts[1];
    const stateZip = parts[parts.length - 1];
    const stateMatch = stateZip.match(/^([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?$/i);
    if (stateMatch) {
      return {
        streetAddress,
        city,
        state: stateMatch[1].toUpperCase(),
        zipCode: stateMatch[2] || null,
        raw: trimmed,
      };
    }
  }

  // Two-part: "123 Main St, City ST 12345"
  if (parts.length === 2) {
    const streetAddress = parts[0];
    const rest = parts[1];
    const match = rest.match(/^(.+?)\s+([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?$/i);
    if (match) {
      return {
        streetAddress,
        city: match[1].trim(),
        state: match[2].toUpperCase(),
        zipCode: match[3] || null,
        raw: trimmed,
      };
    }
  }

  return null;
}

// ── Listing URL Detection ──────────────────────────────────────────────

export type ListingPlatform = "zillow" | "redfin" | "realtor" | "trulia" | "unknown";

export interface ListingUrlInfo {
  platform: ListingPlatform;
  url: string;
  isValid: boolean;
}

const LISTING_PATTERNS: { platform: ListingPlatform; pattern: RegExp }[] = [
  { platform: "zillow", pattern: /zillow\.com/i },
  { platform: "redfin", pattern: /redfin\.com/i },
  { platform: "realtor", pattern: /realtor\.com/i },
  { platform: "trulia", pattern: /trulia\.com/i },
];

export function detectListingUrl(input: string): ListingUrlInfo | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("http")) return null;

  try {
    new URL(trimmed);
  } catch {
    return null;
  }

  for (const { platform, pattern } of LISTING_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { platform, url: trimmed, isValid: true };
    }
  }

  return { platform: "unknown", url: trimmed, isValid: true };
}

// ── Source Resolution Result ───────────────────────────────────────────

export interface PropertySource {
  type: "official_record" | "listing" | "manual";
  label: string;
  url: string | null;
  quality: SourceQuality;
  county?: string;
  description: string;
}

export interface SourceResolutionResult {
  address: NormalizedAddress | null;
  listingUrl: ListingUrlInfo | null;
  countyLookup: PropertyResolverResult | null;
  availableSources: PropertySource[];
  hasOfficialSource: boolean;
  hasListingSource: boolean;
  message: string;
}

/**
 * Resolve available property data sources for a given address or listing URL.
 * Returns available sources ranked by quality. No auto-fetching.
 */
export function resolvePropertySources(
  addressInput: string,
  listingUrlInput: string,
  dealAddress?: { property_address: string; city: string; state: string; zip_code?: string | null }
): SourceResolutionResult {
  const sources: PropertySource[] = [];
  let address: NormalizedAddress | null = null;
  let listingUrl: ListingUrlInfo | null = null;
  let countyLookup: PropertyResolverResult | null = null;

  // Try to parse address from input
  address = normalizeAddress(addressInput);

  // If no parsed address, use deal address
  if (!address && dealAddress) {
    address = {
      streetAddress: dealAddress.property_address,
      city: dealAddress.city,
      state: dealAddress.state,
      zipCode: dealAddress.zip_code ?? null,
      raw: `${dealAddress.property_address}, ${dealAddress.city}, ${dealAddress.state}`,
    };
  }

  // Detect listing URL
  listingUrl = detectListingUrl(listingUrlInput);

  // Resolve official county source
  if (address) {
    countyLookup = resolveCountyPropertyUrl({
      property_address: address.streetAddress,
      city: address.city,
      state: address.state,
      zip_code: address.zipCode,
    });

    if (countyLookup.source === "registry") {
      sources.push({
        type: "official_record",
        label: `${countyLookup.county} County Property Records`,
        url: countyLookup.url,
        quality: "official",
        county: countyLookup.county,
        description: "Official county assessor or property tax records. Most reliable source for assessed value, tax history, and property details.",
      });
    } else {
      sources.push({
        type: "official_record",
        label: `${countyLookup.county} County Records (Search)`,
        url: countyLookup.url,
        quality: "official",
        county: countyLookup.county,
        description: "Google search for county property records. Locate the official assessor site and search by address.",
      });
    }
  }

  // Add listing source
  if (listingUrl) {
    sources.push({
      type: "listing",
      label: `${listingUrl.platform !== "unknown" ? listingUrl.platform.charAt(0).toUpperCase() + listingUrl.platform.slice(1) : "Property"} Listing`,
      url: listingUrl.url,
      quality: "listing",
      description: "Listing data from a real estate platform. Useful for asking price, photos, and property description. Verify key figures independently.",
    });
  }

  // Always offer manual entry
  sources.push({
    type: "manual",
    label: "Manual Entry",
    url: null,
    quality: "user_entered",
    description: "Enter property data manually from your own research or documents.",
  });

  const hasOfficialSource = sources.some(s => s.type === "official_record");
  const hasListingSource = sources.some(s => s.type === "listing");

  let message: string;
  if (hasOfficialSource && hasListingSource) {
    message = "Official county records and listing data are available. Use official records for the most reliable property data.";
  } else if (hasOfficialSource) {
    message = "Official county records are available. Open the record to find assessed value, tax history, and property details.";
  } else if (hasListingSource) {
    message = "No official county record matched. Listing data and manual entry are available.";
  } else if (address) {
    message = "No verified property source found. Enter property data manually or provide a listing URL.";
  } else {
    message = "Enter a property address or listing URL to find data sources.";
  }

  return {
    address,
    listingUrl,
    countyLookup,
    availableSources: sources,
    hasOfficialSource,
    hasListingSource,
    message,
  };
}

// ── Draft Property Data ────────────────────────────────────────────────

export interface DraftFieldValue<T = number | string> {
  value: T;
  source: SourceQuality;
  confidence: "verified" | "user_reported" | "estimated" | "unavailable";
  status: "pending" | "accepted" | "edited" | "discarded";
}

export interface DraftPropertyData {
  assessedValue: DraftFieldValue<number> | null;
  annualPropertyTax: DraftFieldValue<number> | null;
  yearBuilt: DraftFieldValue<number> | null;
  lotSize: DraftFieldValue<string> | null;
  zoningType: DraftFieldValue<string> | null;
  squareFootage: DraftFieldValue<number> | null;
  purchasePrice: DraftFieldValue<number> | null;
  monthlyRent: DraftFieldValue<number> | null;
}

export function createEmptyDraft(): DraftPropertyData {
  return {
    assessedValue: null,
    annualPropertyTax: null,
    yearBuilt: null,
    lotSize: null,
    zoningType: null,
    squareFootage: null,
    purchasePrice: null,
    monthlyRent: null,
  };
}

export function createDraftField<T>(
  value: T,
  source: SourceQuality,
  confidence: DraftFieldValue["confidence"] = "user_reported"
): DraftFieldValue<T> {
  return { value, source, confidence, status: "pending" };
}

export function acceptDraftField<T>(field: DraftFieldValue<T>): DraftFieldValue<T> {
  return { ...field, status: "accepted" };
}

export function editDraftField<T>(field: DraftFieldValue<T>, newValue: T): DraftFieldValue<T> {
  return { ...field, value: newValue, status: "edited" };
}

export function discardDraftField<T>(_field: DraftFieldValue<T>): null {
  return null;
}
