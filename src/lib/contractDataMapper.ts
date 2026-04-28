/**
 * Canonical mapper for ContractIQ AI extractions.
 *
 * - Coerces AI output to strict types (number, ISO date, boolean, string[]).
 * - Drops anything unexpected (no schema drift).
 * - Returns per-field confidence + verbatim excerpt.
 *
 * This layer is intentionally *not* AI: same AI output -> same mapped record.
 */

export type CanonicalConfidence = "high" | "medium" | "low" | "none";
export type PaidBy = "buyer" | "seller" | "split" | null;

export interface CanonicalContractField<T> {
  value: T | null;
  confidence: CanonicalConfidence;
  excerpt: string;
}

export interface CanonicalContractExtraction {
  // Core
  contract_type: CanonicalContractField<string>;
  buyer_name: CanonicalContractField<string>;
  seller_name: CanonicalContractField<string>;
  buyer_entity_type: CanonicalContractField<string>;
  seller_entity_type: CanonicalContractField<string>;
  property_address: CanonicalContractField<string>;
  property_legal_description: CanonicalContractField<string>;
  purchase_price: CanonicalContractField<number>;
  earnest_money: CanonicalContractField<number>;
  earnest_money_due_days: CanonicalContractField<number>;
  down_payment: CanonicalContractField<number>;
  loan_amount: CanonicalContractField<number>;
  seller_concessions: CanonicalContractField<number>;
  // Dates
  effective_date: CanonicalContractField<string>;
  closing_date: CanonicalContractField<string>;
  possession_date: CanonicalContractField<string>;
  inspection_period_days: CanonicalContractField<number>;
  financing_contingency_days: CanonicalContractField<number>;
  appraisal_contingency_days: CanonicalContractField<number>;
  title_review_days: CanonicalContractField<number>;
  attorney_review_period_days: CanonicalContractField<number>;
  // Contingencies
  financing_contingency: CanonicalContractField<boolean>;
  appraisal_contingency: CanonicalContractField<boolean>;
  inspection_contingency: CanonicalContractField<boolean>;
  sale_of_other_home_contingency: CanonicalContractField<boolean>;
  as_is_clause: CanonicalContractField<boolean>;
  // Allocations
  title_insurance_paid_by: CanonicalContractField<PaidBy>;
  survey_paid_by: CanonicalContractField<PaidBy>;
  transfer_tax_paid_by: CanonicalContractField<PaidBy>;
  hoa_transfer_fee_paid_by: CanonicalContractField<PaidBy>;
  home_warranty_paid_by: CanonicalContractField<PaidBy>;
  // Clauses
  liquidated_damages_clause: CanonicalContractField<boolean>;
  specific_performance_clause: CanonicalContractField<boolean>;
  assignment_allowed: CanonicalContractField<boolean>;
  governing_law_state: CanonicalContractField<string>;
  // Free-text arrays
  special_stipulations: CanonicalContractField<string[]>;
  included_personal_property: CanonicalContractField<string[]>;
  excluded_personal_property: CanonicalContractField<string[]>;
  seller_disclosures_referenced: CanonicalContractField<string[]>;
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

const toPaidBy = (v: unknown): PaidBy => {
  const s = toStr(v)?.toLowerCase();
  if (s === "buyer" || s === "seller" || s === "split") return s;
  return null;
};

const toStrArr = (v: unknown): string[] | null => {
  if (!Array.isArray(v)) return null;
  const out = v
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter((x) => x.length > 0)
    .slice(0, 30); // safety cap
  return out.length ? out : null;
};

const excerpt = (raw: unknown): string => {
  const s = typeof raw === "string" ? raw.trim() : "";
  return s.slice(0, 200);
};

type RawAi = Record<string, unknown> & {
  confidence?: Record<string, unknown>;
  source_excerpts?: Record<string, unknown>;
};

export function mapAiExtraction(
  raw: RawAi | null | undefined,
): CanonicalContractExtraction {
  const r = raw ?? {};
  const conf = (r.confidence ?? {}) as Record<string, unknown>;
  const ex = (r.source_excerpts ?? {}) as Record<string, unknown>;

  const make = <T>(key: string, value: T | null): CanonicalContractField<T> => ({
    value,
    confidence: toBand(conf[key]),
    excerpt: excerpt(ex[key]),
  });

  return {
    contract_type: make("contract_type", toStr(r.contract_type)),
    buyer_name: make("buyer_name", toStr(r.buyer_name)),
    seller_name: make("seller_name", toStr(r.seller_name)),
    buyer_entity_type: make("buyer_entity_type", toStr(r.buyer_entity_type)),
    seller_entity_type: make("seller_entity_type", toStr(r.seller_entity_type)),
    property_address: make("property_address", toStr(r.property_address)),
    property_legal_description: make(
      "property_legal_description",
      toStr(r.property_legal_description),
    ),
    purchase_price: make("purchase_price", toNum(r.purchase_price)),
    earnest_money: make("earnest_money", toNum(r.earnest_money)),
    earnest_money_due_days: make(
      "earnest_money_due_days",
      toInt(r.earnest_money_due_days),
    ),
    down_payment: make("down_payment", toNum(r.down_payment)),
    loan_amount: make("loan_amount", toNum(r.loan_amount)),
    seller_concessions: make("seller_concessions", toNum(r.seller_concessions)),

    effective_date: make("effective_date", toIsoDate(r.effective_date)),
    closing_date: make("closing_date", toIsoDate(r.closing_date)),
    possession_date: make("possession_date", toIsoDate(r.possession_date)),
    inspection_period_days: make(
      "inspection_period_days",
      toInt(r.inspection_period_days),
    ),
    financing_contingency_days: make(
      "financing_contingency_days",
      toInt(r.financing_contingency_days),
    ),
    appraisal_contingency_days: make(
      "appraisal_contingency_days",
      toInt(r.appraisal_contingency_days),
    ),
    title_review_days: make("title_review_days", toInt(r.title_review_days)),
    attorney_review_period_days: make(
      "attorney_review_period_days",
      toInt(r.attorney_review_period_days),
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
    sale_of_other_home_contingency: make(
      "sale_of_other_home_contingency",
      toBool(r.sale_of_other_home_contingency),
    ),
    as_is_clause: make("as_is_clause", toBool(r.as_is_clause)),

    title_insurance_paid_by: make(
      "title_insurance_paid_by",
      toPaidBy(r.title_insurance_paid_by),
    ),
    survey_paid_by: make("survey_paid_by", toPaidBy(r.survey_paid_by)),
    transfer_tax_paid_by: make(
      "transfer_tax_paid_by",
      toPaidBy(r.transfer_tax_paid_by),
    ),
    hoa_transfer_fee_paid_by: make(
      "hoa_transfer_fee_paid_by",
      toPaidBy(r.hoa_transfer_fee_paid_by),
    ),
    home_warranty_paid_by: make(
      "home_warranty_paid_by",
      toPaidBy(r.home_warranty_paid_by),
    ),

    liquidated_damages_clause: make(
      "liquidated_damages_clause",
      toBool(r.liquidated_damages_clause),
    ),
    specific_performance_clause: make(
      "specific_performance_clause",
      toBool(r.specific_performance_clause),
    ),
    assignment_allowed: make("assignment_allowed", toBool(r.assignment_allowed)),
    governing_law_state: make(
      "governing_law_state",
      toStr(r.governing_law_state),
    ),

    special_stipulations: make(
      "special_stipulations",
      toStrArr(r.special_stipulations),
    ),
    included_personal_property: make(
      "included_personal_property",
      toStrArr(r.included_personal_property),
    ),
    excluded_personal_property: make(
      "excluded_personal_property",
      toStrArr(r.excluded_personal_property),
    ),
    seller_disclosures_referenced: make(
      "seller_disclosures_referenced",
      toStrArr(r.seller_disclosures_referenced),
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
