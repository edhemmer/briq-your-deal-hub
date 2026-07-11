import { resolveCountyPropertyUrl, type PropertyResolverInput, type PropertyResolverResult } from "./countyPropertyResolver";
import { resolveTaxRecord, type TaxRecordResolution } from "./taxRecordResolver";

export interface PropertyEnrichmentData {
  assessed_value: number;
  annual_property_tax: number;
  tax_history?: unknown;
  tax_record_url?: string | null;
  tax_verification_status?: string | null;
  year_built: number;
  lot_size: string;
  zoning_type: string;
  property_record_url: string;
}

export interface PropertyIntelligenceResult {
  countyLookup: PropertyResolverResult;
  taxRecord: TaxRecordResolution;
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
  const taxRecord = resolveTaxRecord(input, {
    taxHistory: existingEnrichment?.tax_history,
    annualPropertyTax: existingEnrichment?.annual_property_tax,
    taxRecordUrl: existingEnrichment?.tax_record_url,
    taxVerificationStatus: existingEnrichment?.tax_verification_status,
  });

  const enrichment: PropertyEnrichmentData = {
    assessed_value: existingEnrichment?.assessed_value ?? 0,
    annual_property_tax: taxRecord.annualTax ?? existingEnrichment?.annual_property_tax ?? 0,
    tax_history: taxRecord.history,
    tax_record_url: taxRecord.recordUrl,
    tax_verification_status: taxRecord.status,
    year_built: existingEnrichment?.year_built ?? 0,
    lot_size: existingEnrichment?.lot_size ?? "",
    zoning_type: existingEnrichment?.zoning_type ?? "",
    property_record_url: existingEnrichment?.property_record_url ?? countyLookup.url,
  };

  return { countyLookup, taxRecord, enrichment };
}

export function openPropertyRecord(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}
