/**
 * Canonical mapper for ContractIQ AI extractions.
 *
 * - Coerces AI output to strict types (number, ISO date, boolean).
 * - Drops anything unexpected (no schema drift).
 * - Returns per-field confidence in [0, 1] from the model AND a
 *   deterministic "validated" flag (e.g. closing_date parsed cleanly).
 *
 * This layer is intentionally *not* AI: same AI output -> same mapped record.
 */

export type CanonicalConfidence = "high" | "medium" | "low" | "none";

export interface CanonicalContractField<T> {
  value: T | null;
  confidence: CanonicalConfidence;
  excerpt: string;
}

export interface CanonicalContractExtraction {
  contract_type: CanonicalContractField<string>;
  buyer_name: CanonicalContractField<string>;
  seller_name: CanonicalContractField<string>;
  property_address: CanonicalContractField<string>;
  purchase_price: CanonicalContractField<number>;
  earnest_money: CanonicalContractField<number>;
  closing_date: CanonicalContractField<string>; // YYYY-MM-DD
  inspection_period_days: CanonicalContractField<number>;
  financing_contingency: CanonicalContractField<boolean>;
  appraisal_contingency: CanonicalContractField<boolean>;
  inspection_contingency: CanonicalContractField<boolean>;
}

const toBand = (n: unknown): CanonicalConfidence => {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  if (v >= 0.85) return "high";
  if (v >= 0.6) return "medium";
  if (v > 0) return "low";
  return "none";
};

const toStr = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
};

const toNum = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[$,\s]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const toInt = (v: unknown): number | null => {
  const n = toNum(v);
  return n == null ? null : Math.round(n);
};

const toIsoDate = (v: unknown): string | null => {
  const s = toStr(v);
  if (!s) return null;
  // Accept YYYY-MM-DD as-is.
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const t = new Date(s).getTime();
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString().slice(0, 10);
};

const toBool = (v: unknown): boolean | null => {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const t = v.trim().toLowerCase();
    if (["true", "yes", "y"].includes(t)) return true;
    if (["false", "no", "n"].includes(t)) return false;
  }
  return null;
};

const excerpt = (raw: unknown): string => {
  const s = typeof raw === "string" ? raw.trim() : "";
  return s.slice(0, 160);
};

interface RawAiExtraction {
  contract_type?: unknown;
  buyer_name?: unknown;
  seller_name?: unknown;
  property_address?: unknown;
  purchase_price?: unknown;
  earnest_money?: unknown;
  closing_date?: unknown;
  inspection_period_days?: unknown;
  financing_contingency?: unknown;
  appraisal_contingency?: unknown;
  inspection_contingency?: unknown;
  confidence?: Record<string, unknown>;
  source_excerpts?: Record<string, unknown>;
}

export function mapAiExtraction(
  raw: RawAiExtraction | null | undefined,
): CanonicalContractExtraction {
  const r = raw ?? {};
  const conf = r.confidence ?? {};
  const ex = r.source_excerpts ?? {};

  const make = <T>(
    key: keyof RawAiExtraction,
    value: T | null,
  ): CanonicalContractField<T> => ({
    value,
    confidence: toBand((conf as Record<string, unknown>)[key as string]),
    excerpt: excerpt((ex as Record<string, unknown>)[key as string]),
  });

  return {
    contract_type: make("contract_type", toStr(r.contract_type)),
    buyer_name: make("buyer_name", toStr(r.buyer_name)),
    seller_name: make("seller_name", toStr(r.seller_name)),
    property_address: make("property_address", toStr(r.property_address)),
    purchase_price: make("purchase_price", toNum(r.purchase_price)),
    earnest_money: make("earnest_money", toNum(r.earnest_money)),
    closing_date: make("closing_date", toIsoDate(r.closing_date)),
    inspection_period_days: make(
      "inspection_period_days",
      toInt(r.inspection_period_days),
    ),
    financing_contingency: make(
      "financing_contingency",
      toBool(r.financing_contingency),
    ),
    appraisal_contingency: make(
      "appraisal_contingency",
      toBool(r.appraisal_contingency),
    ),
    inspection_contingency: make(
      "inspection_contingency",
      toBool(r.inspection_contingency),
    ),
  };
}

/** Convert canonical extraction into plain form values for the intake form. */
export function extractionToFormValues(e: CanonicalContractExtraction) {
  return {
    contract_type: e.contract_type.value ?? "",
    buyer_name: e.buyer_name.value ?? "",
    seller_name: e.seller_name.value ?? "",
    property_address: e.property_address.value ?? "",
    purchase_price:
      e.purchase_price.value != null ? String(e.purchase_price.value) : "",
    earnest_money:
      e.earnest_money.value != null ? String(e.earnest_money.value) : "",
    closing_date: e.closing_date.value ?? "",
    inspection_period_days:
      e.inspection_period_days.value != null
        ? String(e.inspection_period_days.value)
        : "",
    financing_contingency: e.financing_contingency.value === true,
    appraisal_contingency: e.appraisal_contingency.value === true,
    inspection_contingency: e.inspection_contingency.value === true,
  };
}
