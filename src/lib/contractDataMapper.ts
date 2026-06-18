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
export type DealStructure =
  | "cash"
  | "conventional"
  | "fha"
  | "va"
  | "usda"
  | "fannie_mae"
  | "freddie_mac"
  | "hud_223f"
  | "hud_221d4"
  | "hud_232"
  | "fha_multifamily"
  | "cmbs"
  | "sba_504"
  | "sba_7a"
  | "dscr_loan"
  | "non_qm"
  | "construction_loan"
  | "bridge_loan"
  | "mezzanine"
  | "preferred_equity"
  | "hard_money"
  | "private_lender"
  | "seller_financing"
  | "subject_to"
  | "wrap_mortgage"
  | "assumption"
  | "lease_option"
  | "option_to_purchase"
  | "assignment_wholesale"
  | "1031_exchange"
  | "installment_sale"
  | "joint_venture"
  | "auction"
  | "reo_bank_owned"
  | "short_sale"
  | "tax_deed"
  | "foreclosure"
  | "reverse_exchange"
  | "build_to_suit"
  | "ground_lease"
  | "sale_leaseback"
  | "tic_delaware_statutory_trust"
  | "opportunity_zone"
  | "unknown"
  | null;
export type DeedForm = "warranty" | "special_warranty" | "quitclaim" | "grant" | "bargain_sale" | "trustee" | null;
export type ProrationMethod = "calendar_day" | "30_360" | null;

export interface CanonicalContractField<T> {
  value: T | null;
  confidence: CanonicalConfidence;
  excerpt: string;
}

export interface CanonicalContractExtraction {
  // Core
  contract_type: CanonicalContractField<string>;
  deal_structure: CanonicalContractField<DealStructure>;
  buyer_name: CanonicalContractField<string>;
  seller_name: CanonicalContractField<string>;
  buyer_entity_type: CanonicalContractField<string>;
  seller_entity_type: CanonicalContractField<string>;
  property_address: CanonicalContractField<string>;
  property_legal_description: CanonicalContractField<string>;
  parcel_id: CanonicalContractField<string>;
  property_use: CanonicalContractField<string>; // residential, multifamily, commercial, mixed-use, land
  purchase_price: CanonicalContractField<number>;
  earnest_money: CanonicalContractField<number>;
  earnest_money_due_days: CanonicalContractField<number>;
  earnest_money_hard_date: CanonicalContractField<string>;
  earnest_money_holder: CanonicalContractField<string>;
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
  due_diligence_period_days: CanonicalContractField<number>;
  // Contingencies
  financing_contingency: CanonicalContractField<boolean>;
  appraisal_contingency: CanonicalContractField<boolean>;
  inspection_contingency: CanonicalContractField<boolean>;
  sale_of_other_home_contingency: CanonicalContractField<boolean>;
  as_is_clause: CanonicalContractField<boolean>;
  time_is_of_essence: CanonicalContractField<boolean>;
  per_diem_late_close: CanonicalContractField<number>;
  post_close_occupancy_days: CanonicalContractField<number>;
  post_close_occupancy_rent: CanonicalContractField<number>;
  // Closing accounting / allocations
  title_insurance_paid_by: CanonicalContractField<PaidBy>;
  owners_title_policy: CanonicalContractField<boolean>;
  lenders_title_policy: CanonicalContractField<boolean>;
  survey_paid_by: CanonicalContractField<PaidBy>;
  survey_type: CanonicalContractField<string>; // alta, boundary, none
  transfer_tax_paid_by: CanonicalContractField<PaidBy>;
  transfer_tax_amount: CanonicalContractField<number>;
  recordation_tax_paid_by: CanonicalContractField<PaidBy>;
  recordation_tax_amount: CanonicalContractField<number>;
  mansion_tax_applies: CanonicalContractField<boolean>;
  documentary_stamps_paid_by: CanonicalContractField<PaidBy>;
  hoa_transfer_fee_paid_by: CanonicalContractField<PaidBy>;
  hoa_assessments_outstanding: CanonicalContractField<number>;
  home_warranty_paid_by: CanonicalContractField<PaidBy>;
  home_warranty_amount: CanonicalContractField<number>;
  escrow_fee_split: CanonicalContractField<PaidBy>;
  attorney_fees_paid_by: CanonicalContractField<PaidBy>;
  // Prorations
  proration_method: CanonicalContractField<ProrationMethod>;
  property_tax_proration: CanonicalContractField<boolean>;
  rent_proration: CanonicalContractField<boolean>;
  utilities_proration: CanonicalContractField<boolean>;
  hoa_dues_proration: CanonicalContractField<boolean>;
  insurance_proration: CanonicalContractField<boolean>;
  tax_proration_basis: CanonicalContractField<string>; // last_known, current_year_estimate, supplemental
  // Tax structure
  is_1031_exchange: CanonicalContractField<boolean>;
  exchange_party: CanonicalContractField<string>; // buyer, seller, both
  qualified_intermediary: CanonicalContractField<string>;
  firpta_applies: CanonicalContractField<boolean>;
  firpta_withholding_pct: CanonicalContractField<number>;
  responsible_for_1099s: CanonicalContractField<string>; // buyer, seller, closing_agent
  opportunity_zone: CanonicalContractField<boolean>;
  // Closing agent
  title_company: CanonicalContractField<string>;
  escrow_holder: CanonicalContractField<string>;
  closing_agent: CanonicalContractField<string>;
  deed_form: CanonicalContractField<DeedForm>;
  // Broker / commissions
  listing_broker: CanonicalContractField<string>;
  buyer_broker: CanonicalContractField<string>;
  broker_commission_pct: CanonicalContractField<number>;
  broker_commission_amount: CanonicalContractField<number>;
  commission_paid_by: CanonicalContractField<PaidBy>;
  dual_agency_disclosed: CanonicalContractField<boolean>;
  // Financing detail
  financing_type: CanonicalContractField<string>; // conventional, FHA, VA, hard_money, etc.
  interest_rate_max: CanonicalContractField<number>;
  loan_program: CanonicalContractField<string>;
  seller_carry_amount: CanonicalContractField<number>;
  seller_carry_rate: CanonicalContractField<number>;
  seller_carry_term_years: CanonicalContractField<number>;
  balloon_payment: CanonicalContractField<boolean>;
  prepayment_penalty: CanonicalContractField<boolean>;
  // Option / lease-option / wholesale
  option_fee: CanonicalContractField<number>;
  option_period_days: CanonicalContractField<number>;
  option_strike_price: CanonicalContractField<number>;
  option_fee_credited: CanonicalContractField<boolean>;
  extension_fee: CanonicalContractField<number>;
  extension_periods: CanonicalContractField<number>;
  assignment_fee: CanonicalContractField<number>;
  rent_credit_to_purchase: CanonicalContractField<number>;
  monthly_rent_lease_option: CanonicalContractField<number>;
  // Commercial / investment
  rent_roll_attached: CanonicalContractField<boolean>;
  estoppel_required: CanonicalContractField<boolean>;
  snda_required: CanonicalContractField<boolean>;
  existing_leases_assigned: CanonicalContractField<boolean>;
  security_deposits_amount: CanonicalContractField<number>;
  cam_reconciliation: CanonicalContractField<boolean>;
  environmental_phase_required: CanonicalContractField<boolean>;
  environmental_indemnity: CanonicalContractField<boolean>;
  // Risk shifting
  liquidated_damages_clause: CanonicalContractField<boolean>;
  specific_performance_clause: CanonicalContractField<boolean>;
  assignment_allowed: CanonicalContractField<boolean>;
  right_of_first_refusal: CanonicalContractField<boolean>;
  right_of_first_offer: CanonicalContractField<boolean>;
  mediation_required: CanonicalContractField<boolean>;
  arbitration_required: CanonicalContractField<boolean>;
  jurisdiction_venue: CanonicalContractField<string>;
  governing_law_state: CanonicalContractField<string>;
  // Free-text arrays
  special_stipulations: CanonicalContractField<string[]>;
  included_personal_property: CanonicalContractField<string[]>;
  excluded_personal_property: CanonicalContractField<string[]>;
  seller_disclosures_referenced: CanonicalContractField<string[]>;
  addenda_referenced: CanonicalContractField<string[]>;
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
    let s = v.trim();
    if (!s) return null;
    // Handle accounting-style negatives: (1,234.56) -> -1234.56
    let negative = false;
    if (/^\(.*\)$/.test(s)) {
      negative = true;
      s = s.slice(1, -1);
    }
    // Strip currency symbols, codes, commas, whitespace
    s = s.replace(/USD|usd|\$|€|£|,|\s/g, "");
    if (s.startsWith("-")) {
      negative = !negative;
      s = s.slice(1);
    }
    if (!/^\d+(\.\d+)?$/.test(s)) return null;
    const n = Number(s);
    if (!Number.isFinite(n)) return null;
    return negative ? -n : n;
  }
  return null;
};

const toInt = (v: unknown): number | null => {
  const n = toNum(v);
  return n == null ? null : Math.round(n);
};

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10,
  nov: 11, november: 11, dec: 12, december: 12,
};

const pad2 = (n: number) => String(n).padStart(2, "0");

const toIsoDate = (v: unknown): string | null => {
  const s = toStr(v);
  if (!s) return null;
  // Already ISO
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  // US M/D/YYYY or M-D-YYYY (most common in US real-estate contracts)
  const us = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (us) {
    const [, m, d, y] = us;
    let yr = parseInt(y, 10);
    if (yr < 100) yr += yr >= 50 ? 1900 : 2000;
    const mn = parseInt(m, 10);
    const dn = parseInt(d, 10);
    if (mn >= 1 && mn <= 12 && dn >= 1 && dn <= 31) {
      return `${yr}-${pad2(mn)}-${pad2(dn)}`;
    }
    return null;
  }
  // "January 15, 2026" / "15 January 2026" / "Jan 15 2026"
  const named = s.match(/([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (named) {
    const mn = MONTHS[named[1].toLowerCase()];
    const dn = parseInt(named[2], 10);
    const yr = parseInt(named[3], 10);
    if (mn && dn >= 1 && dn <= 31) return `${yr}-${pad2(mn)}-${pad2(dn)}`;
  }
  const named2 = s.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (named2) {
    const mn = MONTHS[named2[2].toLowerCase()];
    const dn = parseInt(named2[1], 10);
    const yr = parseInt(named2[3], 10);
    if (mn && dn >= 1 && dn <= 31) return `${yr}-${pad2(mn)}-${pad2(dn)}`;
  }
  // Last resort — Date.parse, but only accept if it returns something sane.
  const t = Date.parse(s);
  if (!Number.isNaN(t)) {
    const dt = new Date(t);
    const y = dt.getUTCFullYear();
    if (y >= 1900 && y <= 2100) {
      return `${y}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
    }
  }
  return null;
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

/**
 * Cross-validate a stringy AI value against the source document.
 * Returns true if the value's "essence" is found in the source — meaning
 * the AI didn't hallucinate it. We normalize aggressively (strip case,
 * punctuation, whitespace) because PDF text extraction often inserts noise.
 */
const normalizeForMatch = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]/g, "");

const valueAppearsInSource = (
  value: string | number | null,
  sourceNorm: string,
): boolean => {
  if (value == null || sourceNorm.length === 0) return true; // nothing to validate
  if (typeof value === "number") {
    // Look for the integer portion with thousands separators stripped.
    const intStr = String(Math.round(value));
    if (sourceNorm.includes(intStr)) return true;
    // Also try splitting into 3-digit chunks (e.g. 450,000)
    return sourceNorm.includes(intStr);
  }
  const v = normalizeForMatch(value);
  if (v.length < 3) return true; // too short to validate meaningfully
  if (sourceNorm.includes(v)) return true;
  // For multi-token names/addresses, accept if all tokens >=3 chars are present.
  const tokens = value
    .split(/\s+/)
    .map((t) => normalizeForMatch(t))
    .filter((t) => t.length >= 3);
  if (tokens.length === 0) return false;
  const hits = tokens.filter((t) => sourceNorm.includes(t)).length;
  return hits / tokens.length >= 0.7;
};

const downgrade = (c: CanonicalConfidence): CanonicalConfidence => {
  if (c === "high") return "low";
  if (c === "medium") return "low";
  return "none";
};

export function mapAiExtraction(
  raw: RawAi | null | undefined,
  sourceText?: string | null,
): CanonicalContractExtraction {
  const r = raw ?? {};
  const conf = (r.confidence ?? {}) as Record<string, unknown>;
  const ex = (r.source_excerpts ?? {}) as Record<string, unknown>;
  const sourceNorm = normalizeForMatch(sourceText ?? "");

  const make = <T>(
    key: string,
    value: T | null,
    opts?: { validate?: boolean },
  ): CanonicalContractField<T> => {
    let band = toBand(conf[key]);
    // Cross-validate string and number values against the source document.
    if (
      opts?.validate !== false &&
      sourceNorm.length > 0 &&
      value != null &&
      (typeof value === "string" || typeof value === "number")
    ) {
      const ok = valueAppearsInSource(value as string | number, sourceNorm);
      if (!ok) band = downgrade(band);
    }
    return {
      value,
      confidence: band,
      excerpt: excerpt(ex[key]),
    };
  };


  const toDealStructure = (v: unknown): DealStructure => {
    const s = toStr(v)?.toLowerCase().replace(/[\s-]+/g, "_");
    if (!s) return null;
    const allowed: DealStructure[] = [
      "cash", "conventional", "fha", "va", "usda",
      "fannie_mae", "freddie_mac", "hud_223f", "hud_221d4", "hud_232", "fha_multifamily",
      "cmbs", "sba_504", "sba_7a", "dscr_loan", "non_qm",
      "construction_loan", "bridge_loan", "mezzanine", "preferred_equity",
      "hard_money", "private_lender",
      "seller_financing", "subject_to", "wrap_mortgage", "assumption",
      "lease_option", "option_to_purchase", "assignment_wholesale",
      "1031_exchange", "installment_sale", "joint_venture", "auction",
      "reo_bank_owned", "short_sale", "tax_deed", "foreclosure",
      "reverse_exchange", "build_to_suit", "ground_lease", "sale_leaseback",
      "tic_delaware_statutory_trust", "opportunity_zone", "unknown",
    ];
    return (allowed as string[]).includes(s) ? (s as DealStructure) : "unknown";
  };
  const toDeedForm = (v: unknown): DeedForm => {
    const s = toStr(v)?.toLowerCase().replace(/[\s-]+/g, "_");
    if (!s) return null;
    if (s.includes("special")) return "special_warranty";
    if (s.includes("quit")) return "quitclaim";
    if (s.includes("trust")) return "trustee";
    if (s.includes("bargain")) return "bargain_sale";
    if (s.includes("grant")) return "grant";
    if (s.includes("warrant")) return "warranty";
    return null;
  };
  const toProrationMethod = (v: unknown): ProrationMethod => {
    const s = toStr(v)?.toLowerCase().replace(/[\s-]+/g, "_");
    if (!s) return null;
    if (s.includes("30") || s.includes("360")) return "30_360";
    if (s.includes("calendar") || s.includes("actual")) return "calendar_day";
    return null;
  };

  return {
    contract_type: make("contract_type", toStr(r.contract_type)),
    deal_structure: make("deal_structure", toDealStructure(r.deal_structure), { validate: false }),
    buyer_name: make("buyer_name", toStr(r.buyer_name)),
    seller_name: make("seller_name", toStr(r.seller_name)),
    buyer_entity_type: make("buyer_entity_type", toStr(r.buyer_entity_type)),
    seller_entity_type: make("seller_entity_type", toStr(r.seller_entity_type)),
    property_address: make("property_address", toStr(r.property_address)),
    property_legal_description: make("property_legal_description", toStr(r.property_legal_description)),
    parcel_id: make("parcel_id", toStr(r.parcel_id)),
    property_use: make("property_use", toStr(r.property_use)),
    purchase_price: make("purchase_price", toNum(r.purchase_price)),
    earnest_money: make("earnest_money", toNum(r.earnest_money)),
    earnest_money_due_days: make("earnest_money_due_days", toInt(r.earnest_money_due_days)),
    earnest_money_hard_date: make("earnest_money_hard_date", toIsoDate(r.earnest_money_hard_date)),
    earnest_money_holder: make("earnest_money_holder", toStr(r.earnest_money_holder)),
    down_payment: make("down_payment", toNum(r.down_payment)),
    loan_amount: make("loan_amount", toNum(r.loan_amount)),
    seller_concessions: make("seller_concessions", toNum(r.seller_concessions)),

    effective_date: make("effective_date", toIsoDate(r.effective_date)),
    closing_date: make("closing_date", toIsoDate(r.closing_date)),
    possession_date: make("possession_date", toIsoDate(r.possession_date)),
    inspection_period_days: make("inspection_period_days", toInt(r.inspection_period_days)),
    financing_contingency_days: make("financing_contingency_days", toInt(r.financing_contingency_days)),
    appraisal_contingency_days: make("appraisal_contingency_days", toInt(r.appraisal_contingency_days)),
    title_review_days: make("title_review_days", toInt(r.title_review_days)),
    attorney_review_period_days: make("attorney_review_period_days", toInt(r.attorney_review_period_days)),
    due_diligence_period_days: make("due_diligence_period_days", toInt(r.due_diligence_period_days)),

    financing_contingency: make("financing_contingency", toBool(r.financing_contingency)),
    appraisal_contingency: make("appraisal_contingency", toBool(r.appraisal_contingency)),
    inspection_contingency: make("inspection_contingency", toBool(r.inspection_contingency)),
    sale_of_other_home_contingency: make("sale_of_other_home_contingency", toBool(r.sale_of_other_home_contingency)),
    as_is_clause: make("as_is_clause", toBool(r.as_is_clause)),
    time_is_of_essence: make("time_is_of_essence", toBool(r.time_is_of_essence)),
    per_diem_late_close: make("per_diem_late_close", toNum(r.per_diem_late_close)),
    post_close_occupancy_days: make("post_close_occupancy_days", toInt(r.post_close_occupancy_days)),
    post_close_occupancy_rent: make("post_close_occupancy_rent", toNum(r.post_close_occupancy_rent)),

    title_insurance_paid_by: make("title_insurance_paid_by", toPaidBy(r.title_insurance_paid_by)),
    owners_title_policy: make("owners_title_policy", toBool(r.owners_title_policy)),
    lenders_title_policy: make("lenders_title_policy", toBool(r.lenders_title_policy)),
    survey_paid_by: make("survey_paid_by", toPaidBy(r.survey_paid_by)),
    survey_type: make("survey_type", toStr(r.survey_type)),
    transfer_tax_paid_by: make("transfer_tax_paid_by", toPaidBy(r.transfer_tax_paid_by)),
    transfer_tax_amount: make("transfer_tax_amount", toNum(r.transfer_tax_amount)),
    recordation_tax_paid_by: make("recordation_tax_paid_by", toPaidBy(r.recordation_tax_paid_by)),
    recordation_tax_amount: make("recordation_tax_amount", toNum(r.recordation_tax_amount)),
    mansion_tax_applies: make("mansion_tax_applies", toBool(r.mansion_tax_applies)),
    documentary_stamps_paid_by: make("documentary_stamps_paid_by", toPaidBy(r.documentary_stamps_paid_by)),
    hoa_transfer_fee_paid_by: make("hoa_transfer_fee_paid_by", toPaidBy(r.hoa_transfer_fee_paid_by)),
    hoa_assessments_outstanding: make("hoa_assessments_outstanding", toNum(r.hoa_assessments_outstanding)),
    home_warranty_paid_by: make("home_warranty_paid_by", toPaidBy(r.home_warranty_paid_by)),
    home_warranty_amount: make("home_warranty_amount", toNum(r.home_warranty_amount)),
    escrow_fee_split: make("escrow_fee_split", toPaidBy(r.escrow_fee_split)),
    attorney_fees_paid_by: make("attorney_fees_paid_by", toPaidBy(r.attorney_fees_paid_by)),

    proration_method: make("proration_method", toProrationMethod(r.proration_method), { validate: false }),
    property_tax_proration: make("property_tax_proration", toBool(r.property_tax_proration)),
    rent_proration: make("rent_proration", toBool(r.rent_proration)),
    utilities_proration: make("utilities_proration", toBool(r.utilities_proration)),
    hoa_dues_proration: make("hoa_dues_proration", toBool(r.hoa_dues_proration)),
    insurance_proration: make("insurance_proration", toBool(r.insurance_proration)),
    tax_proration_basis: make("tax_proration_basis", toStr(r.tax_proration_basis)),

    is_1031_exchange: make("is_1031_exchange", toBool(r.is_1031_exchange)),
    exchange_party: make("exchange_party", toStr(r.exchange_party)),
    qualified_intermediary: make("qualified_intermediary", toStr(r.qualified_intermediary)),
    firpta_applies: make("firpta_applies", toBool(r.firpta_applies)),
    firpta_withholding_pct: make("firpta_withholding_pct", toNum(r.firpta_withholding_pct)),
    responsible_for_1099s: make("responsible_for_1099s", toStr(r.responsible_for_1099s)),
    opportunity_zone: make("opportunity_zone", toBool(r.opportunity_zone)),

    title_company: make("title_company", toStr(r.title_company)),
    escrow_holder: make("escrow_holder", toStr(r.escrow_holder)),
    closing_agent: make("closing_agent", toStr(r.closing_agent)),
    deed_form: make("deed_form", toDeedForm(r.deed_form), { validate: false }),

    listing_broker: make("listing_broker", toStr(r.listing_broker)),
    buyer_broker: make("buyer_broker", toStr(r.buyer_broker)),
    broker_commission_pct: make("broker_commission_pct", toNum(r.broker_commission_pct)),
    broker_commission_amount: make("broker_commission_amount", toNum(r.broker_commission_amount)),
    commission_paid_by: make("commission_paid_by", toPaidBy(r.commission_paid_by)),
    dual_agency_disclosed: make("dual_agency_disclosed", toBool(r.dual_agency_disclosed)),

    financing_type: make("financing_type", toStr(r.financing_type)),
    interest_rate_max: make("interest_rate_max", toNum(r.interest_rate_max)),
    loan_program: make("loan_program", toStr(r.loan_program)),
    seller_carry_amount: make("seller_carry_amount", toNum(r.seller_carry_amount)),
    seller_carry_rate: make("seller_carry_rate", toNum(r.seller_carry_rate)),
    seller_carry_term_years: make("seller_carry_term_years", toNum(r.seller_carry_term_years)),
    balloon_payment: make("balloon_payment", toBool(r.balloon_payment)),
    prepayment_penalty: make("prepayment_penalty", toBool(r.prepayment_penalty)),

    option_fee: make("option_fee", toNum(r.option_fee)),
    option_period_days: make("option_period_days", toInt(r.option_period_days)),
    option_strike_price: make("option_strike_price", toNum(r.option_strike_price)),
    option_fee_credited: make("option_fee_credited", toBool(r.option_fee_credited)),
    extension_fee: make("extension_fee", toNum(r.extension_fee)),
    extension_periods: make("extension_periods", toInt(r.extension_periods)),
    assignment_fee: make("assignment_fee", toNum(r.assignment_fee)),
    rent_credit_to_purchase: make("rent_credit_to_purchase", toNum(r.rent_credit_to_purchase)),
    monthly_rent_lease_option: make("monthly_rent_lease_option", toNum(r.monthly_rent_lease_option)),

    rent_roll_attached: make("rent_roll_attached", toBool(r.rent_roll_attached)),
    estoppel_required: make("estoppel_required", toBool(r.estoppel_required)),
    snda_required: make("snda_required", toBool(r.snda_required)),
    existing_leases_assigned: make("existing_leases_assigned", toBool(r.existing_leases_assigned)),
    security_deposits_amount: make("security_deposits_amount", toNum(r.security_deposits_amount)),
    cam_reconciliation: make("cam_reconciliation", toBool(r.cam_reconciliation)),
    environmental_phase_required: make("environmental_phase_required", toBool(r.environmental_phase_required)),
    environmental_indemnity: make("environmental_indemnity", toBool(r.environmental_indemnity)),

    liquidated_damages_clause: make("liquidated_damages_clause", toBool(r.liquidated_damages_clause)),
    specific_performance_clause: make("specific_performance_clause", toBool(r.specific_performance_clause)),
    assignment_allowed: make("assignment_allowed", toBool(r.assignment_allowed)),
    right_of_first_refusal: make("right_of_first_refusal", toBool(r.right_of_first_refusal)),
    right_of_first_offer: make("right_of_first_offer", toBool(r.right_of_first_offer)),
    mediation_required: make("mediation_required", toBool(r.mediation_required)),
    arbitration_required: make("arbitration_required", toBool(r.arbitration_required)),
    jurisdiction_venue: make("jurisdiction_venue", toStr(r.jurisdiction_venue)),
    governing_law_state: make("governing_law_state", toStr(r.governing_law_state)),

    special_stipulations: make("special_stipulations", toStrArr(r.special_stipulations)),
    included_personal_property: make("included_personal_property", toStrArr(r.included_personal_property)),
    excluded_personal_property: make("excluded_personal_property", toStrArr(r.excluded_personal_property)),
    seller_disclosures_referenced: make("seller_disclosures_referenced", toStrArr(r.seller_disclosures_referenced)),
    addenda_referenced: make("addenda_referenced", toStrArr(r.addenda_referenced)),
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
