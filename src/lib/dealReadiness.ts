type DealReadinessInput = {
  property_address?: string | null;
  city?: string | null;
  state?: string | null;
  purchase_price?: number | null;
  monthly_rent?: number | null;
  annual_property_tax?: number | null;
  taxes?: number | null;
  tax_history?: unknown;
  tax_verification_status?: string | null;
  insurance?: number | null;
  property_type?: string | null;
  strategy_primary?: string | null;
  listing_url?: string | null;
  property_record_url?: string | null;
  listing_remarks?: string | null;
};

type ReadinessOptions = {
  requireLocation?: boolean;
  requireSource?: boolean;
};

const VERIFIED_TAX_STATUSES = new Set(["user_verified", "official_verified"]);

export function positiveNumber(value: number | string | null | undefined) {
  return value != null && Number.isFinite(Number(value)) && Number(value) > 0;
}

export function hasVerifiedTax(deal: DealReadinessInput) {
  const taxValue = deal.annual_property_tax ?? deal.taxes;
  if (!positiveNumber(taxValue)) return false;
  if (VERIFIED_TAX_STATUSES.has(deal.tax_verification_status ?? "")) return true;
  return hasVerifiedTaxHistory(deal.tax_history);
}

export function hasDealSource(deal: DealReadinessInput) {
  return Boolean(deal.listing_url || deal.property_record_url || deal.listing_remarks);
}

export function dealReadinessScore(deal: DealReadinessInput, options: ReadinessOptions = {}) {
  const checks = [
    options.requireLocation ? Boolean(deal.property_address) : true,
    options.requireLocation ? Boolean(deal.city) : true,
    options.requireLocation ? Boolean(deal.state) : true,
    positiveNumber(deal.purchase_price),
    positiveNumber(deal.monthly_rent),
    hasVerifiedTax(deal),
    positiveNumber(deal.insurance),
    Boolean(deal.property_type),
    Boolean(deal.strategy_primary),
    options.requireSource ? hasDealSource(deal) : true,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function missingDealInputs(deal: DealReadinessInput, options: ReadinessOptions = {}) {
  const missing: string[] = [];
  if (options.requireLocation && !deal.property_address) missing.push("property address");
  if (options.requireLocation && !deal.city) missing.push("city");
  if (options.requireLocation && !deal.state) missing.push("state");
  if (!positiveNumber(deal.purchase_price)) missing.push("purchase price");
  if (!positiveNumber(deal.monthly_rent)) missing.push("rent support");
  if (!hasVerifiedTax(deal)) missing.push("verified annual taxes");
  if (!positiveNumber(deal.insurance)) missing.push("annual insurance quote");
  if (!deal.property_type) missing.push("property type");
  if (!deal.strategy_primary) missing.push("strategy");
  if (options.requireSource && !hasDealSource(deal)) missing.push("source listing or notes");
  return missing;
}

export function taxStatusText(deal: DealReadinessInput) {
  if (hasVerifiedTax(deal)) return "Verified";
  if (positiveNumber(deal.annual_property_tax ?? deal.taxes)) return "Needs source";
  return "Missing";
}

function hasVerifiedTaxHistory(value: unknown) {
  if (!Array.isArray(value)) return false;
  return value.some((item) => {
    if (!item || typeof item !== "object") return false;
    const row = item as Record<string, unknown>;
    return row.status === "verified" && positiveNumber(row.amount as number | string | null | undefined);
  });
}
