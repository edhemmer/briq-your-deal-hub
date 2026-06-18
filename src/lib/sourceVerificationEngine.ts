import type { HiddenRiskResult } from "./hiddenRiskEngine";
import type { ResolvedPropertyData } from "./propertyDataSources";

export type VerificationStatus = "verified" | "partially_verified" | "needs_verification";

export interface TaxHistoryInput {
  year1?: number | null;
  year2?: number | null;
  year3?: number | null;
}

export interface VerifiedTaxResult {
  annualTax: number | null;
  method: "three_year_average" | "single_year_verified" | "missing";
  yearsUsed: number;
  confidence: VerificationStatus;
  note: string;
}

export interface TrustGateResult {
  status: VerificationStatus;
  score: number;
  blockers: string[];
  warnings: string[];
  verifiedFields: string[];
  reportLanguage: string;
}

function validMoney(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value) && value > 0;
}

export function calculateVerifiedAnnualTax(input: TaxHistoryInput, fallbackAnnualTax?: number | null): VerifiedTaxResult {
  const values = [input.year1, input.year2, input.year3].filter(validMoney);
  if (values.length === 3) {
    const annualTax = values.reduce((sum, value) => sum + value, 0) / values.length;
    return {
      annualTax,
      method: "three_year_average",
      yearsUsed: 3,
      confidence: "verified",
      note: "Annual tax is the average of the last three verified tax years entered from public records.",
    };
  }

  if (validMoney(fallbackAnnualTax)) {
    return {
      annualTax: fallbackAnnualTax,
      method: "single_year_verified",
      yearsUsed: 1,
      confidence: "partially_verified",
      note: "Annual tax uses one verified public-record value. Add the prior two years for a stronger tax basis.",
    };
  }

  return {
    annualTax: null,
    method: "missing",
    yearsUsed: 0,
    confidence: "needs_verification",
    note: "Annual tax is not verified. Do not rely on final returns until county tax history is entered.",
  };
}

export function evaluateTrustGate(input: {
  resolved: ResolvedPropertyData | null;
  tax: VerifiedTaxResult;
  hiddenRisks: HiddenRiskResult | null;
  hasCountyRecordUrl: boolean;
  hasMarketData: boolean;
  hasRentData: boolean;
  hasInsurance: boolean;
}): TrustGateResult {
  let score = 100;
  const blockers: string[] = [];
  const warnings: string[] = [];
  const verifiedFields: string[] = [];

  if (input.hasCountyRecordUrl) verifiedFields.push("Official county property-record path");
  else {
    score -= 15;
    warnings.push("No official county record link resolved for this property.");
  }

  if (input.tax.confidence === "verified") verifiedFields.push("Three-year property tax average");
  else if (input.tax.confidence === "partially_verified") {
    score -= 8;
    verifiedFields.push("Single-year property tax");
    warnings.push("Tax history is not a three-year average yet.");
  } else {
    score -= 22;
    blockers.push("Property taxes are not verified.");
  }

  if (input.hasRentData) verifiedFields.push("Rent input or rent comp");
  else {
    score -= 15;
    blockers.push("Rent is not validated against a comp, rent roll, lease, or market estimate.");
  }

  if (input.hasInsurance) verifiedFields.push("Insurance input");
  else {
    score -= 10;
    warnings.push("Insurance premium is not verified.");
  }

  if (input.hasMarketData) verifiedFields.push("Market context");
  else {
    score -= 10;
    warnings.push("Market data is incomplete.");
  }

  if ((input.hiddenRisks?.flagCount ?? 0) > 0) {
    score -= Math.min(18, (input.hiddenRisks?.flagCount ?? 0) * 4);
    warnings.push("Hidden-risk flags need inspection or specialist confirmation before final decision.");
  }

  if ((input.resolved?.completenessScore ?? 0) < 60) {
    score -= 10;
    warnings.push("Property source completeness is below the final-analysis threshold.");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const status: VerificationStatus =
    blockers.length > 0 || score < 60 ? "needs_verification" :
    warnings.length > 0 || score < 85 ? "partially_verified" :
    "verified";

  const reportLanguage =
    status === "verified"
      ? "Verified report: core deal facts have sourced support and calculations are deterministic."
      : status === "partially_verified"
      ? "Provisional report: calculations are deterministic, but some source checks still need confirmation."
      : "Draft report only: do not rely on this deal for purchase decisions until blockers are resolved.";

  return { status, score, blockers, warnings, verifiedFields, reportLanguage };
}

export interface PublicSourceConnector {
  name: string;
  category: "property" | "rent" | "market" | "risk" | "financing" | "news";
  status: "connected" | "requires_key" | "manual_verified" | "planned";
  trustUse: string;
}

export const PUBLIC_SOURCE_CONNECTORS: PublicSourceConnector[] = [
  {
    name: "County assessor / recorder direct path",
    category: "property",
    status: "manual_verified",
    trustUse: "Official tax, assessment, deed, permit, and ownership facts are entered from the county record and labeled as public-record verified.",
  },
  {
    name: "FRED",
    category: "financing",
    status: "requires_key",
    trustUse: "Mortgage and macro-rate series for financing assumptions and trend context.",
  },
  {
    name: "BLS Public Data API",
    category: "market",
    status: "connected",
    trustUse: "Employment trend inputs for market demand confidence.",
  },
  {
    name: "Census ACS",
    category: "market",
    status: "requires_key",
    trustUse: "Population, household income, tenure, and growth context by tract/county.",
  },
  {
    name: "FEMA National Risk Index",
    category: "risk",
    status: "planned",
    trustUse: "Natural-hazard risk context for insurance and downside diligence.",
  },
  {
    name: "Rent/comps provider",
    category: "rent",
    status: "requires_key",
    trustUse: "Rent estimates, sale comps, and property facts from a licensed data provider such as RentCast, ATTOM, HouseCanary, or similar.",
  },
  {
    name: "Property news/search provider",
    category: "news",
    status: "requires_key",
    trustUse: "Searches address/entity mentions for lawsuits, nuisance, zoning, environmental, and local article risk.",
  },
];
