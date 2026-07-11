import { resolveCountyPropertyUrl, type PropertyResolverInput } from "./countyPropertyResolver";

export type TaxVerificationStatus =
  | "missing"
  | "lookup_available"
  | "user_verified"
  | "official_verified"
  | "provider_required"
  | "unsupported";

export interface TaxHistoryEntry {
  year: number;
  amount: number;
  source: "county_record" | "user_verified" | "listing_clue";
  status: "verified" | "needs_verification";
}

export interface TaxRecordResolution {
  status: TaxVerificationStatus;
  recordUrl: string | null;
  county: string;
  message: string;
  history: TaxHistoryEntry[];
  annualTax: number | null;
}

const VERIFIED_STATUSES = new Set(["user_verified", "official_verified"]);

export function resolveTaxRecord(
  input: PropertyResolverInput,
  existing?: {
    taxHistory?: unknown;
    annualPropertyTax?: number | null;
    taxRecordUrl?: string | null;
    taxVerificationStatus?: string | null;
  }
): TaxRecordResolution {
  const countyLookup = resolveCountyPropertyUrl(input);
  const history = normalizeTaxHistory(existing?.taxHistory);
  const existingStatus = normalizeStatus(existing?.taxVerificationStatus);
  const verifiedHistory = history.filter((item) => item.status === "verified");
  const annualFromHistory = calculateAverageAnnualTax(verifiedHistory);
  const annualFromExisting = isPlausibleAnnualTax(existing?.annualPropertyTax) ? existing?.annualPropertyTax ?? null : null;
  const annualTax = annualFromHistory ?? (VERIFIED_STATUSES.has(existingStatus) ? annualFromExisting : null);

  if (annualTax && verifiedHistory.length > 0) {
    return {
      status: existingStatus === "official_verified" ? "official_verified" : "user_verified",
      recordUrl: existing?.taxRecordUrl ?? countyLookup.url,
      county: countyLookup.county,
      message: "Tax history is present and can be used in underwriting.",
      history,
      annualTax,
    };
  }

  if (countyLookup.source === "registry") {
    return {
      status: "lookup_available",
      recordUrl: existing?.taxRecordUrl ?? countyLookup.url,
      county: countyLookup.county,
      message: "Official tax lookup is available. Annual taxes remain unverified until tax history is entered or retrieved.",
      history,
      annualTax: null,
    };
  }

  return {
    status: "provider_required",
    recordUrl: existing?.taxRecordUrl ?? countyLookup.url,
    county: countyLookup.county,
    message: "No direct county tax connector is available for this location yet. Use the official lookup path or connect a property data provider.",
    history,
    annualTax: null,
  };
}

export function normalizeTaxHistory(value: unknown): TaxHistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const year = Number(row.year);
      const amount = Number(row.amount);
      if (!Number.isInteger(year) || !isPlausibleAnnualTax(amount)) return null;
      return {
        year,
        amount,
        source: row.source === "county_record" ? "county_record" : row.source === "listing_clue" ? "listing_clue" : "user_verified",
        status: row.status === "verified" ? "verified" : "needs_verification",
      } satisfies TaxHistoryEntry;
    })
    .filter((item): item is TaxHistoryEntry => Boolean(item))
    .sort((a, b) => b.year - a.year);
}

export function calculateAverageAnnualTax(history: TaxHistoryEntry[]): number | null {
  const verified = history.filter((item) => item.status === "verified" && isPlausibleAnnualTax(item.amount));
  if (verified.length === 0) return null;
  const newestThree = verified.sort((a, b) => b.year - a.year).slice(0, 3);
  return Math.round(newestThree.reduce((sum, item) => sum + item.amount, 0) / newestThree.length);
}

export function isPlausibleAnnualTax(value: unknown): value is number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 500 && n <= 250000;
}

function normalizeStatus(value: string | null | undefined): TaxVerificationStatus {
  switch (value) {
    case "lookup_available":
    case "user_verified":
    case "official_verified":
    case "provider_required":
    case "unsupported":
      return value;
    default:
      return "missing";
  }
}
