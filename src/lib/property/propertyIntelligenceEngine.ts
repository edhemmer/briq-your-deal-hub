import { resolveCountyPropertyUrl, type PropertyResolverInput, type PropertyResolverResult } from "./countyPropertyResolver";

export interface PropertyEnrichmentData {
  assessed_value: number;
  annual_property_tax: number;
  year_built: number;
  lot_size: string;
  zoning_type: string;
  property_record_url: string;
}

export interface PropertyIntelligenceResult {
  countyLookup: PropertyResolverResult;
  enrichment: PropertyEnrichmentData;
}

/**
 * Canonical Property Intelligence Engine.
 * Resolves county property URLs and manages enrichment data.
 */
export function resolvePropertyIntelligence(
  input: PropertyResolverInput,
  existingEnrichment?: Partial<PropertyEnrichmentData>
): PropertyIntelligenceResult {
  const countyLookup = resolveCountyPropertyUrl(input);

  const enrichment: PropertyEnrichmentData = {
    assessed_value: existingEnrichment?.assessed_value ?? 0,
    annual_property_tax: existingEnrichment?.annual_property_tax ?? 0,
    year_built: existingEnrichment?.year_built ?? 0,
    lot_size: existingEnrichment?.lot_size ?? "",
    zoning_type: existingEnrichment?.zoning_type ?? "",
    property_record_url: existingEnrichment?.property_record_url ?? countyLookup.url,
  };

  return { countyLookup, enrichment };
}

export function openPropertyRecord(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}
