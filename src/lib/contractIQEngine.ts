/**
 * ContractIQ Engine v2 — comprehensive deterministic contract intelligence.
 *
 * Pure rules-based — no AI in scoring. Same input -> same output.
 * Perspective-aware: every finding is evaluated for buyer or seller.
 *
 * Inputs come from two sources:
 *   1. Structured form fields (price, EM, dates, contingency toggles)
 *   2. Optional `extraction` object — the canonical extraction from the AI,
 *      which carries deeper signals (special stipulations, allocations,
 *      attorney review window, as-is, assignment, etc.)
 *
 * Output covers what an investor / attorney / broker actually needs:
 *   - Decision summary + scores
 *   - Pros (favorable to your side)
 *   - Cons (unfavorable to your side, severity-graded)
 *   - Weakness areas (drafting gaps that put you at risk)
 *   - Questions to ask (concrete diligence prompts before signing)
 *   - Deadlines (every dated milestone, sorted)
 *   - Negotiation moves (specific asks)
 */

import type {
  CanonicalConfidence,
  CanonicalContractExtraction,
  CanonicalContractField,
  PaidBy,
} from "./contractDataMapper";
import { runParalegalRules, type ClosingAccountingRow } from "./contractIQRules";
import {
  priceFinding,
  totalExposure as sumExposure,
  type DollarImpact,
  type PricingContext,
} from "./contractIQDollarImpact";
export type { ClosingAccountingRow } from "./contractIQRules";
export type { DollarImpact } from "./contractIQDollarImpact";
export { fmtUsd, fmtImpactRange } from "./contractIQDollarImpact";

export type Perspective = "buyer" | "seller";
export type Severity = "high" | "moderate" | "low";

/**
 * ClauseEvidence — a traceable, auditable pointer from a finding back to
 * the source clause that triggered it. Findings without evidence are
 * implicitly derived from structured form inputs.
 */
export interface ClauseEvidence {
  /** Canonical field name (e.g., "earnest_money", "as_is_clause"). */
  field: string;
  /** Human-readable label for the field (e.g., "Earnest money"). */
  label: string;
  /** Verbatim excerpt from the contract, or a derived computation note. */
  excerpt: string;
  /** Confidence in the underlying extraction (or "derived" for form inputs). */
  confidence: CanonicalConfidence | "derived";
  /** Stringified value at the time of evaluation. */
  value?: string | null;
}

export interface ContractInput {
  perspective: Perspective;
  contract_type?: string | null;
  buyer_name?: string | null;
  seller_name?: string | null;
  property_address?: string | null;
  purchase_price?: number | null;
  earnest_money?: number | null;
  closing_date?: string | null; // ISO YYYY-MM-DD
  inspection_period_days?: number | null;
  financing_contingency?: boolean | null;
  appraisal_contingency?: boolean | null;
  inspection_contingency?: boolean | null;
  contract_text?: string | null;
  /** Optional richer signals from the AI extraction layer. */
  extraction?: CanonicalContractExtraction | null;
}

export interface Pro {
  id: string;
  label: string;
  detail: string;
  evidence?: ClauseEvidence[];
  dollarImpact?: DollarImpact;
}

export interface Con {
  id: string;
  label: string;
  severity: Severity;
  detail: string;
  evidence?: ClauseEvidence[];
  /** True when severity was downgraded due to low-confidence evidence. */
  confidenceAdjusted?: boolean;
  dollarImpact?: DollarImpact;
}

export interface Weakness {
  id: string;
  label: string;
  detail: string;
  evidence?: ClauseEvidence[];
  dollarImpact?: DollarImpact;
}

export interface Question {
  id: string;
  question: string;
  why: string;
  category: "financial" | "legal" | "timeline" | "property" | "contingency";
  evidence?: ClauseEvidence[];
}

export interface Deadline {
  id: string;
  label: string;
  date?: string | null;
  daysFromNow?: number | null;
  daysFromEffective?: number | null;
  status: "set" | "missing" | "tight" | "past";
}

export interface NegotiationMove {
  id: string;
  ask: string;
  rationale: string;
  evidence?: ClauseEvidence[];
  dollarImpact?: DollarImpact;
}

export interface RiskMatrixRow {
  id: string;
  risk: string;
  severity: Severity;
  mitigation: string;
  owner: Perspective | "both";
  dollarImpact?: DollarImpact;
}

export interface LiabilityRow {
  id: string;
  item: string;
  party: Perspective | "split" | "unspecified";
  when: string;
  why: string;
}

export interface WhoPaysRow {
  id: string;
  item: string;
  buyer: boolean;
  seller: boolean;
  notes: string;
}

export interface TimelineRow {
  id: string;
  milestone: string;
  date: string | null;
  daysFromEffective: number | null;
  party: Perspective | "both";
}

export interface BrokerQuestion {
  id: string;
  question: string;
  why: string;
}

export interface ContractAnalysis {
  perspective: Perspective;
  summary: string;
  executiveSummary: string;
  riskScore: number; // 0-100, higher = riskier for chosen perspective
  leverageScore: number; // 0-100
  recommendation: "proceed" | "negotiate" | "caution";
  decision: "Proceed" | "Renegotiate" | "Pause";
  decisionRationale: string;
  pros: Pro[];
  cons: Con[];
  weaknesses: Weakness[];
  questions: Question[];
  attorneyQuestions: Question[];
  brokerQuestions: BrokerQuestion[];
  deadlines: Deadline[];
  timeline: TimelineRow[];
  riskMatrix: RiskMatrixRow[];
  liabilityAllocation: LiabilityRow[];
  whoPaysWhat: WhoPaysRow[];
  negotiation: NegotiationMove[];
  takeaways: string[];
  missingInputs: string[];
  dealStructureLabel?: string;
  closingAccounting?: ClosingAccountingRow[];
  /** Sum of downside dollar exposure across cons that have a pricing rule. */
  totalExposure?: { low: number; mid: number; high: number; count: number };
  computedAt: string;
}

// ----- helpers -----
const daysBetween = (iso?: string | null, from?: string | null): number | null => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const base = from ? new Date(from).getTime() : Date.now();
  if (Number.isNaN(base)) return null;
  return Math.round((t - base) / (1000 * 60 * 60 * 24));
};

const fmtMoney = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;

const val = <T>(f?: { value: T | null } | null): T | null => (f ? f.value : null);

// ----- evidence helpers -----

/**
 * Build a ClauseEvidence entry from a canonical extraction field.
 * Returns null when the field is missing entirely (no value AND no excerpt),
 * so callers can spread the result and skip empty evidence safely.
 */
const ev = (
  field: string,
  label: string,
  f: CanonicalContractField<unknown> | undefined | null,
): ClauseEvidence | null => {
  if (!f) return null;
  const hasExcerpt = typeof f.excerpt === "string" && f.excerpt.trim().length > 0;
  const hasValue = f.value !== null && f.value !== undefined;
  if (!hasExcerpt && !hasValue) return null;
  return {
    field,
    label,
    excerpt: hasExcerpt ? f.excerpt.trim() : "(no clause excerpt captured)",
    confidence: f.confidence ?? "none",
    value: hasValue ? String(f.value) : null,
  };
};

/**
 * Derived evidence — for findings computed from structured form inputs
 * with no direct clause excerpt (e.g., EM/price ratio).
 */
const derivedEv = (
  field: string,
  label: string,
  computation: string,
  value?: string | number | null,
): ClauseEvidence => ({
  field,
  label,
  excerpt: computation,
  confidence: "derived",
  value: value == null ? null : String(value),
});

/** Drop nulls and return undefined when list is empty. */
const compact = (items: (ClauseEvidence | null | undefined)[]): ClauseEvidence[] | undefined => {
  const out = items.filter((x): x is ClauseEvidence => !!x);
  return out.length > 0 ? out : undefined;
};

/**
 * Confidence-gated severity. If every piece of evidence is low/none
 * confidence (i.e., the AI is not sure what it read), we de-rate by one
 * notch so a hallucinated extraction never drives a "high" finding.
 * Derived (form-input) evidence is treated as high-confidence.
 */
const gateSeverity = (
  severity: Severity,
  evidence: ClauseEvidence[] | undefined,
): { severity: Severity; adjusted: boolean } => {
  if (!evidence || evidence.length === 0) return { severity, adjusted: false };
  const allWeak = evidence.every(
    (x) => x.confidence === "low" || x.confidence === "none",
  );
  if (!allWeak) return { severity, adjusted: false };
  if (severity === "high") return { severity: "moderate", adjusted: true };
  if (severity === "moderate") return { severity: "low", adjusted: true };
  return { severity, adjusted: false };
};

// ----- engine -----
export function analyzeContract(input: ContractInput): ContractAnalysis {
  const p = input.perspective;
  const opp: Perspective = p === "buyer" ? "seller" : "buyer";
  const e = input.extraction ?? null;

  const pros: Pro[] = [];
  const cons: Con[] = [];
  const weaknesses: Weakness[] = [];
  const questions: Question[] = [];
  const deadlines: Deadline[] = [];
  const negotiation: NegotiationMove[] = [];
  const missing: string[] = [];

  // Pre-compute the pricing context so every helper can attach a
  // deterministic dollar impact to its finding.
  const price = input.purchase_price ?? 0;
  const em = input.earnest_money ?? 0;
  const emRatio = price > 0 ? em / price : 0;
  const closingISO = input.closing_date ?? val(e?.closing_date) ?? null;
  const daysToCloseCtx = daysBetween(closingISO);
  const pricingCtx: PricingContext = {
    perspective: p,
    price,
    earnestMoney: em,
    daysToClose: daysToCloseCtx,
    inspectionDays: input.inspection_period_days ?? null,
  };

  const addCon = (
    id: string,
    label: string,
    severity: Severity,
    detail: string,
    perspectiveAffected: Perspective | "both" = p,
    evidence?: (ClauseEvidence | null | undefined)[],
  ) => {
    if (perspectiveAffected === p || perspectiveAffected === "both") {
      const ev = compact(evidence ?? []);
      const gated = gateSeverity(severity, ev);
      const dollarImpact = priceFinding(id, pricingCtx) ?? undefined;
      cons.push({
        id,
        label,
        severity: gated.severity,
        detail: gated.adjusted
          ? `${detail} Severity de-rated because the source clause was extracted with low confidence — verify in the contract.`
          : detail,
        evidence: ev,
        confidenceAdjusted: gated.adjusted || undefined,
        dollarImpact,
      });
    }
  };
  const addPro = (
    id: string,
    label: string,
    detail: string,
    favors: Perspective | "both" = p,
    evidence?: (ClauseEvidence | null | undefined)[],
  ) => {
    if (favors === p || favors === "both") {
      const dollarImpact = priceFinding(id, pricingCtx) ?? undefined;
      pros.push({ id, label, detail, evidence: compact(evidence ?? []), dollarImpact });
    }
  };
  const addWeak = (
    id: string,
    label: string,
    detail: string,
    evidence?: (ClauseEvidence | null | undefined)[],
  ) => {
    const dollarImpact = priceFinding(id, pricingCtx) ?? undefined;
    weaknesses.push({ id, label, detail, evidence: compact(evidence ?? []), dollarImpact });
  };
  const addQ = (
    id: string,
    question: string,
    why: string,
    category: Question["category"],
    evidence?: (ClauseEvidence | null | undefined)[],
  ) => questions.push({ id, question, why, category, evidence: compact(evidence ?? []) });
  const addMove = (
    id: string,
    ask: string,
    rationale: string,
    evidence?: (ClauseEvidence | null | undefined)[],
  ) => {
    const dollarImpact = priceFinding(id, pricingCtx) ?? undefined;
    negotiation.push({ id, ask, rationale, evidence: compact(evidence ?? []), dollarImpact });
  };


  // ===== Required field coverage =====
  if (input.purchase_price == null) missing.push("Purchase price");
  if (input.earnest_money == null) missing.push("Earnest money");
  if (!input.closing_date) missing.push("Closing date");
  if (input.inspection_period_days == null) missing.push("Inspection period");

  const price = input.purchase_price ?? 0;
  const em = input.earnest_money ?? 0;
  const emRatio = price > 0 ? em / price : 0;

  // Pre-build commonly-reused evidence for form-derived findings.
  const emEv = derivedEv(
    "earnest_money",
    "Earnest money vs. purchase price",
    `Earnest money ${fmtMoney(em)} ÷ purchase price ${fmtMoney(price)} = ${fmtPct(emRatio)}`,
    em,
  );
  const emExtractionEv = ev("earnest_money", "Earnest money", e?.earnest_money);
  const priceExtractionEv = ev("purchase_price", "Purchase price", e?.purchase_price);

  // ===== Earnest money =====
  if (price > 0 && em > 0) {
    if (emRatio < 0.005) {
      addCon(
        "em_low",
        "Earnest money is unusually low",
        p === "seller" ? "high" : "low",
        `Earnest money is ${fmtPct(emRatio)} of purchase price (typical 1–3%). Weak commitment signal.`,
        "seller",
        [emEv, emExtractionEv, priceExtractionEv],
      );
      if (p === "buyer")
        addPro(
          "em_low_b",
          "Minimal capital at risk",
          `Only ${fmtMoney(em)} exposed if you terminate.`,
          p,
          [emEv, emExtractionEv],
        );
      if (p === "seller") {
        addMove(
          "em_increase",
          `Increase earnest money to 1–3% (${fmtMoney(price * 0.01)}–${fmtMoney(price * 0.03)})`,
          "Standard market range; signals genuine buyer commitment.",
          [emEv, emExtractionEv],
        );
        addQ(
          "em_proof",
          "What proof of funds will the buyer provide?",
          "Low earnest money + no proof = high re-trade risk.",
          "financial",
          [emEv],
        );
      }
    } else if (emRatio > 0.05) {
      addCon(
        "em_high",
        "Earnest money is unusually high",
        p === "buyer" ? "high" : "low",
        `Earnest money is ${fmtPct(emRatio)} of purchase price — significant capital at risk.`,
        "buyer",
        [emEv, emExtractionEv, priceExtractionEv],
      );
      if (p === "seller")
        addPro(
          "em_high_s",
          "Strong buyer commitment",
          `${fmtMoney(em)} on the line indicates serious buyer.`,
          p,
          [emEv, emExtractionEv],
        );
      if (p === "buyer") {
        addMove(
          "em_reduce",
          "Negotiate earnest money down to 1–3%",
          "Reduces capital exposure if a contingency triggers.",
          [emEv],
        );
        addQ(
          "em_release",
          "Under what conditions does the earnest money become non-refundable?",
          "Any 'hard' EM milestones materially raise your downside.",
          "financial",
          [emEv],
        );
      }
    } else {
      addPro(
        "em_market",
        "Earnest money is within market norms",
        `${fmtPct(emRatio)} of price — standard commitment.`,
        "both",
        [emEv, emExtractionEv],
      );
    }
  } else if (price > 0 && em === 0) {
    addCon(
      "em_zero",
      "No earnest money documented",
      p === "seller" ? "high" : "low",
      "Buyer has no skin in the game.",
      "seller",
      [derivedEv("earnest_money", "Earnest money", "Value is $0 / not present in structured inputs.", 0)],
    );
  }

  // ===== Contingencies =====
  const cFin = !!input.financing_contingency;
  const cApp = !!input.appraisal_contingency;
  const cIns = !!input.inspection_contingency;
  const asIs = val(e?.as_is_clause) === true;
  const saleHome = val(e?.sale_of_other_home_contingency) === true;

  const finEv = ev("financing_contingency", "Financing contingency", e?.financing_contingency);
  const appEv = ev("appraisal_contingency", "Appraisal contingency", e?.appraisal_contingency);
  const insEv = ev("inspection_contingency", "Inspection contingency", e?.inspection_contingency);
  const asIsEv = ev("as_is_clause", "AS-IS clause", e?.as_is_clause);
  const saleHomeEv = ev("sale_of_other_home_contingency", "Sale-of-other-home contingency", e?.sale_of_other_home_contingency);

  const finDerived = derivedEv(
    "financing_contingency",
    "Financing contingency (form input)",
    cFin ? "Toggle: present" : "Toggle: absent",
    cFin ? "true" : "false",
  );
  const appDerived = derivedEv(
    "appraisal_contingency",
    "Appraisal contingency (form input)",
    cApp ? "Toggle: present" : "Toggle: absent",
    cApp ? "true" : "false",
  );
  const insDerived = derivedEv(
    "inspection_contingency",
    "Inspection contingency (form input)",
    cIns ? "Toggle: present" : "Toggle: absent",
    cIns ? "true" : "false",
  );

  // Financing
  if (cFin) {
    if (p === "buyer")
      addPro("fin_pro", "Financing contingency protects you", "Exit without forfeiting earnest money if financing fails.", p, [finEv, finDerived]);
    else
      addCon("fin_con", "Financing contingency present", "moderate", "Buyer can terminate if loan falls through.", "seller", [finEv, finDerived]);
  } else if (price > 0) {
    if (p === "buyer") {
      addCon("no_fin", "No financing contingency", "high", "You are obligated to close even if the loan is denied — earnest money at risk.", "buyer", [finEv, finDerived]);
      addQ("fin_proof", "Do you have a written loan commitment, not just pre-approval?", "Without a financing contingency, only a firm commitment protects your earnest money.", "financial", [finDerived]);
      addMove("add_fin_cont", "Add a 21-day financing contingency", "Standard protection against lender denial.", [finDerived]);
    } else {
      addPro("no_fin_s", "No financing contingency", "Buyer cannot exit due to loan issues.", p, [finEv, finDerived]);
      addQ("cash_proof_s", "Has the buyer demonstrated proof of funds?", "Confirms cash-equivalent strength of the offer.", "financial", [finDerived]);
    }
  }

  // Appraisal
  if (cApp) {
    if (p === "buyer")
      addPro("app_pro", "Appraisal contingency protects you", "Renegotiate or exit if the property appraises low.", p, [appEv, appDerived]);
    else
      addCon("app_con", "Appraisal contingency present", "moderate", "Buyer may renegotiate or walk if appraisal is low.", "seller", [appEv, appDerived]);
  } else if (price > 0) {
    if (p === "buyer") {
      addCon("no_app", "No appraisal contingency", "moderate", "If appraisal comes in low, you must cover the gap or forfeit EM.", "buyer", [appEv, appDerived]);
      addQ("app_gap", "How will you cover an appraisal shortfall in cash?", "Without an appraisal contingency, gaps come out of your pocket.", "financial", [appDerived]);
      addMove("add_app_cont", "Add appraisal contingency or appraisal gap cap", "Caps your exposure to a low appraisal.", [appDerived]);
    } else {
      addPro("no_app_s", "No appraisal contingency", "Sale price is locked even if appraisal is low.", p, [appEv, appDerived]);
    }
  }

  // Inspection
  if (cIns) {
    if (p === "buyer")
      addPro("ins_pro", "Inspection contingency protects you", "You can negotiate repairs, credits, or terminate after inspection.", p, [insEv, insDerived]);
    else
      addCon("ins_con", "Inspection contingency present", "low", "Buyer may request repairs, credits, or termination.", "seller", [insEv, insDerived]);
  } else if (price > 0) {
    if (p === "buyer") {
      addCon("no_ins", "No inspection contingency", "high", "You accept the property as-is with no recourse for defects.", "buyer", [insEv, insDerived]);
      addQ("ins_pre", "Have you completed pre-offer inspections?", "Without an inspection contingency, defects are 100% your problem post-close.", "property", [insDerived]);
      addMove("add_ins_cont", "Add a 7–10 day inspection contingency", "Provides minimum due-diligence window without delaying close.", [insDerived]);
    } else {
      addPro("no_ins_s", "No inspection contingency", "Buyer cannot use inspection findings to retrade.", p, [insEv, insDerived]);
    }
  }

  // ===== Inspection period length =====
  const ip = input.inspection_period_days;
  const ipEv = ev("inspection_period_days", "Inspection period", e?.inspection_period_days);
  const ipDerived = ip != null
    ? derivedEv("inspection_period_days", "Inspection period (form input)", `${ip} days`, ip)
    : null;
  if (ip != null) {
    if (cIns && ip < 7) {
      addCon("ip_tight", "Tight inspection period", p === "buyer" ? "moderate" : "low", `Only ${ip} days — limited time to schedule contractors and review reports.`, "buyer", [ipEv, ipDerived]);
      if (p === "buyer") addMove("extend_ip", "Extend inspection to 10–14 days", "Standard window for thorough due diligence.", [ipEv, ipDerived]);
    } else if (ip > 21) {
      if (p === "seller") {
        addCon("ip_long", "Long inspection period", "low", `${ip}-day window keeps property off-market and gives buyer optionality.`, "seller", [ipEv, ipDerived]);
        addMove("shorten_ip", "Shorten inspection to ≤14 days", "Reduces seller risk window.", [ipEv, ipDerived]);
      } else {
        addPro("ip_long_b", "Generous inspection window", `${ip} days for full diligence.`, p, [ipEv, ipDerived]);
      }
    } else if (ip >= 7 && ip <= 21) {
      addPro("ip_market", "Inspection period within market norms", `${ip} days is standard.`, "both", [ipEv, ipDerived]);
    }
  }

  // ===== As-is clause =====
  if (asIs) {
    if (p === "buyer") {
      addCon("as_is", "Property sold AS-IS", "high", "Seller has no obligation to repair or credit any defects discovered.", "buyer", [asIsEv]);
      addQ("as_is_dd", "Have you budgeted for unknown repair costs?", "AS-IS shifts all post-inspection risk to you.", "property", [asIsEv]);
    } else {
      addPro("as_is_s", "AS-IS clause limits seller exposure", "No obligation to remediate inspection findings.", p, [asIsEv]);
    }
  }

  // ===== Sale-of-other-home contingency =====
  if (saleHome) {
    if (p === "seller") {
      addCon("kick_out", "Sale-of-other-home contingency", "high", "Buyer's offer depends on selling another property — closing is uncertain.", "seller", [saleHomeEv]);
      addMove("kick_out_clause", "Add a 'kick-out' clause (48–72 hr) allowing seller to accept a stronger offer", "Preserves seller flexibility if buyer's home does not sell.", [saleHomeEv]);
      addQ("home_listed", "Is the buyer's home already listed and under contract?", "If not, this deal could drag for months.", "timeline", [saleHomeEv]);
    } else {
      addPro("kick_out_b", "Sale-of-other-home contingency protects you", "You can terminate if your current home does not sell.", p, [saleHomeEv]);
    }
  }

  // ===== Allocations / who pays what =====
  type AllocKey =
    | "title_insurance_paid_by"
    | "survey_paid_by"
    | "transfer_tax_paid_by"
    | "hoa_transfer_fee_paid_by"
    | "home_warranty_paid_by";
  const allocLabels: Record<AllocKey, string> = {
    title_insurance_paid_by: "Title insurance",
    survey_paid_by: "Survey",
    transfer_tax_paid_by: "Transfer tax",
    hoa_transfer_fee_paid_by: "HOA transfer fee",
    home_warranty_paid_by: "Home warranty",
  };

  if (e) {
    (Object.keys(allocLabels) as AllocKey[]).forEach((k) => {
      const paidBy = val(e[k]);
      const label = allocLabels[k];
      const allocEv = ev(k, label, e[k]);
      if (paidBy === p) {
        addCon(`alloc_${k}`, `${label} paid by you`, "low", `Allocation: ${p} pays ${label.toLowerCase()}. Estimate the cost as part of net proceeds.`, p, [allocEv]);
      } else if (paidBy === opp) {
        addPro(`alloc_${k}_p`, `${label} paid by ${opp}`, `Reduces your closing costs.`, p, [allocEv]);
      } else if (paidBy === "split") {
        addPro(`alloc_${k}_s`, `${label} split`, `Costs shared between parties.`, "both", [allocEv]);
      }
    });
  }

  // ===== Liquidated damages / specific performance =====
  const liqEv = ev("liquidated_damages_clause", "Liquidated damages clause", e?.liquidated_damages_clause);
  if (val(e?.liquidated_damages_clause) === true) {
    if (p === "buyer") addCon("liq_dmg", "Liquidated damages clause", "moderate", "Earnest money is the seller's exclusive remedy if you default.", "buyer", [liqEv]);
    else addCon("liq_dmg_s", "Liquidated damages cap seller recovery", "moderate", "You're limited to retaining the earnest money on buyer default.", "seller", [liqEv]);
    addQ("liq_calc", "How is the liquidated damages amount calculated?", "Confirms your maximum financial exposure on default.", "legal", [liqEv]);
  }
  const specEv = ev("specific_performance_clause", "Specific performance clause", e?.specific_performance_clause);
  if (val(e?.specific_performance_clause) === true) {
    if (p === "seller") addCon("spec_perf", "Specific performance available to buyer", "moderate", "Buyer can sue to force the sale, not just claim damages.", "seller", [specEv]);
    else addPro("spec_perf_b", "Specific performance available", "You can compel the seller to close, not just collect damages.", p, [specEv]);
  }

  // ===== Assignment =====
  const assign = val(e?.assignment_allowed);
  const assignEv = ev("assignment_allowed", "Assignment clause", e?.assignment_allowed);
  if (assign === true) {
    if (p === "seller") {
      addCon("assign", "Buyer can assign the contract", "moderate", "Final buyer may differ from signer — undermines buyer vetting.", "seller", [assignEv]);
      addQ("assign_who", "Will an assignee be vetted before closing?", "Protects against assignment to an unqualified party.", "legal", [assignEv]);
      addMove("limit_assign", "Restrict assignment to affiliates or require seller consent", "Preserves your control over the counterparty.", [assignEv]);
    } else {
      addPro("assign_b", "Assignment allowed", "Flexibility to assign to a partner, entity, or 1031 exchange accommodator.", p, [assignEv]);
    }
  } else if (assign === false && p === "buyer") {
    addCon("no_assign", "No assignment allowed", "low", "Cannot assign to an entity, partner, or 1031 accommodator.", "buyer", [assignEv]);
  }

  // ===== Attorney review =====
  const arev = val(e?.attorney_review_period_days);
  const arevEv = ev("attorney_review_period_days", "Attorney review period", e?.attorney_review_period_days);
  if (arev != null && arev > 0) {
    addPro("att_rev", `${arev}-day attorney review`, "Provides legal escape hatch and amendment window after signing.", "both", [arevEv]);
  } else if (e && val(e.attorney_review_period_days) === null && val(e.governing_law_state) && ["IL", "NJ", "NY"].includes(val(e.governing_law_state) ?? "")) {
    addWeak(
      "no_att_rev",
      "No attorney review period detected",
      "In IL/NJ/NY, attorney review is customary. Confirm this period exists in the contract.",
      [ev("governing_law_state", "Governing law state", e.governing_law_state), arevEv],
    );
  }

  // ===== Special stipulations =====
  const stipsField = e?.special_stipulations;
  const stips = val(stipsField) ?? [];
  stips.forEach((s, i) => {
    addQ(
      `stip_${i}`,
      `What does this stipulation mean for you: "${s.slice(0, 120)}${s.length > 120 ? "…" : ""}"`,
      "Custom stipulations override standard language and frequently shift risk.",
      "legal",
      [
        {
          field: `special_stipulations[${i}]`,
          label: `Special stipulation #${i + 1}`,
          excerpt: s,
          confidence: stipsField?.confidence ?? "none",
          value: s,
        },
      ],
    );
  });
  if (stips.length >= 5) {
    addCon(
      "many_stips",
      `${stips.length} special stipulations`,
      "moderate",
      "Heavy customization increases risk of overlooked terms.",
      "both" as Perspective,
      [ev("special_stipulations", "Special stipulations", stipsField)],
    );
  }

  // ===== Disclosures =====
  const disc = val(e?.seller_disclosures_referenced) ?? [];
  if (p === "buyer" && disc.length === 0 && price > 0) {
    addWeak("no_disc", "No seller disclosures referenced", "Verify lead-based paint, property condition, and HOA disclosures were delivered.");
    addQ("disc_q", "Have you received and reviewed all seller disclosures?", "Required by law in most states; protects against undisclosed defects.", "property");
  }

  // ===== Personal property included/excluded =====
  const incl = val(e?.included_personal_property) ?? [];
  const excl = val(e?.excluded_personal_property) ?? [];
  if (p === "buyer" && incl.length === 0 && price > 0) {
    addWeak("no_incl", "No included personal property listed", "Confirm appliances, fixtures, and any negotiated items are explicitly listed.");
  }
  if (excl.length > 0 && p === "buyer") {
    addQ("excl_q", `Are you OK with ${excl.length} explicitly excluded item${excl.length > 1 ? "s" : ""}?`, "Excluded items will not convey at closing.", "property");
  }

  // ===== Timeline / deadlines =====
  const eff = val(e?.effective_date);
  const today = new Date().toISOString().slice(0, 10);

  const pushDeadline = (id: string, label: string, isoDate?: string | null, daysFromEff?: number | null) => {
    let date = isoDate ?? null;
    if (!date && eff && daysFromEff != null) {
      const d = new Date(eff);
      d.setDate(d.getDate() + daysFromEff);
      date = d.toISOString().slice(0, 10);
    }
    const dfn = daysBetween(date);
    let status: Deadline["status"] = "set";
    if (!date) status = "missing";
    else if (dfn != null && dfn < 0) status = "past";
    else if (dfn != null && dfn < 7) status = "tight";
    deadlines.push({
      id,
      label,
      date,
      daysFromNow: dfn,
      daysFromEffective: daysFromEff ?? null,
      status,
    });
  };

  if (eff) pushDeadline("effective", "Effective date", eff);
  pushDeadline("em_due", "Earnest money due", null, val(e?.earnest_money_due_days));
  pushDeadline("inspection_end", "Inspection period ends", null, ip);
  pushDeadline("financing_end", "Financing contingency ends", null, val(e?.financing_contingency_days));
  pushDeadline("appraisal_end", "Appraisal contingency ends", null, val(e?.appraisal_contingency_days));
  pushDeadline("title_review", "Title review ends", null, val(e?.title_review_days));
  pushDeadline("attorney_review", "Attorney review ends", null, val(e?.attorney_review_period_days));
  pushDeadline("close", "Closing", input.closing_date ?? val(e?.closing_date));
  pushDeadline("possession", "Possession", val(e?.possession_date));

  const daysToClose = daysBetween(input.closing_date ?? val(e?.closing_date));
  if (daysToClose != null && daysToClose >= 0 && daysToClose < 14) {
    addCon("close_tight", "Tight closing timeline", "moderate", `${daysToClose} days to close — limited room for delays in title, financing, or repairs.`, "both" as Perspective);
  }
  if (daysToClose != null && daysToClose < 0) {
    addCon("close_past", "Closing date is in the past", "high", "Update the contract or confirm extension was executed.", "both" as Perspective);
  }

  // ===== Standard buyer/seller diligence questions =====
  if (p === "buyer") {
    if (val(e?.property_legal_description) == null) addQ("legal_desc", "Has the legal description been verified against title?", "Catches parcel-ID or boundary errors that cause closing delays.", "property");
    if (val(e?.title_insurance_paid_by) == null) addQ("title_who", "Who is paying for title insurance?", "Local custom varies; confirm in writing to avoid closing-cost surprises.", "financial");
    addQ("hoa_q", "Are HOA fees, special assessments, and rules disclosed?", "Undisclosed assessments are a common post-close surprise.", "property");
  } else {
    if (val(e?.buyer_entity_type) == null) addQ("buyer_entity", "Is the buyer a person or an entity?", "Entity buyers may have weaker recourse if they default.", "legal");
    addQ("backup_offer", "Should we accept backup offers during the contingency period?", "Maintains leverage if the primary buyer terminates.", "timeline");
  }

  // ===== Paralegal rules merge (deal structure, tax, commercial diligence) =====
  const paralegal = runParalegalRules(e, p, price, val(e?.governing_law_state) ?? null);
  pros.push(...paralegal.pros);
  cons.push(...paralegal.cons);
  weaknesses.push(...paralegal.weaknesses);
  questions.push(...paralegal.questions);
  negotiation.push(...paralegal.negotiation);

  // ===== Scoring =====
  const sevWeight: Record<Severity, number> = { high: 30, moderate: 15, low: 5 };
  const rawRisk = cons.reduce((sum, c) => sum + sevWeight[c.severity], 0);
  const riskScore = Math.min(100, rawRisk);

  const leverageScore = Math.min(
    100,
    Math.max(0, 50 + pros.length * 6 - cons.length * 4 - riskScore * 0.2),
  );

  let recommendation: ContractAnalysis["recommendation"];
  const hasHighCon = cons.some((c) => c.severity === "high");
  if (riskScore >= 60 || hasHighCon) recommendation = "caution";
  else if (riskScore >= 25) recommendation = "negotiate";
  else recommendation = "proceed";

  // Decision label (CBRE-style)
  const decision: "Proceed" | "Renegotiate" | "Pause" =
    recommendation === "proceed" ? "Proceed" : recommendation === "negotiate" ? "Renegotiate" : "Pause";

  // ===== Summary =====
  const partyLabel = p === "buyer" ? "buyer" : "seller";
  const summary =
    recommendation === "proceed"
      ? `From the ${partyLabel}'s perspective, this contract is balanced. ${pros.length} favorable term${pros.length === 1 ? "" : "s"}, ${cons.length} concern${cons.length === 1 ? "" : "s"}, and no high-severity issues. Standard due diligence applies.`
      : recommendation === "negotiate"
      ? `From the ${partyLabel}'s perspective, this contract has terms worth negotiating. ${cons.filter((c) => c.severity !== "low").length} material concern${cons.filter((c) => c.severity !== "low").length === 1 ? "" : "s"} identified — see negotiation moves below before signing.`
      : `From the ${partyLabel}'s perspective, this contract carries significant risk. ${cons.filter((c) => c.severity === "high").length} high-severity issue${cons.filter((c) => c.severity === "high").length === 1 ? "" : "s"} require resolution before signing.`;

  // ===== Executive summary (CBRE/McKinsey deal-book voice) =====
  const counterparty = p === "buyer" ? input.seller_name : input.buyer_name;
  const cpLabel = counterparty ? counterparty : `the ${opp}`;
  const priceLabel = price > 0 ? ` at ${fmtMoney(price)}` : "";
  const propLabel = input.property_address ? ` for ${input.property_address}` : "";
  const highCount = cons.filter((c) => c.severity === "high").length;
  const modCount = cons.filter((c) => c.severity === "moderate").length;
  const execParts: string[] = [];
  execParts.push(
    `Bottom line: ${decision.toUpperCase()}. This ${input.contract_type ?? "contract"}${propLabel}${priceLabel} is being evaluated from the ${partyLabel}'s side against ${cpLabel}.`,
  );
  if (highCount > 0 || modCount > 0) {
    execParts.push(
      `We identified ${highCount} high-severity and ${modCount} moderate-severity issue${highCount + modCount === 1 ? "" : "s"}, balanced against ${pros.length} favorable term${pros.length === 1 ? "" : "s"}.`,
    );
  } else {
    execParts.push(
      `No material risks were detected. ${pros.length} favorable term${pros.length === 1 ? "" : "s"} support a clean close.`,
    );
  }
  if (recommendation === "caution") {
    execParts.push(
      `Recommend pausing execution until the high-severity items below are resolved or repriced. Forwarding to counsel before any further commitment is appropriate.`,
    );
  } else if (recommendation === "negotiate") {
    execParts.push(
      `Recommend a focused negotiation pass on the moderate items below before signing. The negotiation playbook lists each ask with rationale.`,
    );
  } else {
    execParts.push(
      `Recommend proceeding with standard diligence. Confirm the deadlines section is calendared and the disclosures are received.`,
    );
  }
  const executiveSummary = execParts.join(" ");

  const decisionRationale =
    decision === "Proceed"
      ? `Risk score is ${Math.round(riskScore)}/100 with no high-severity items. Leverage for the ${partyLabel} is ${Math.round(leverageScore)}/100. Standard close path.`
      : decision === "Renegotiate"
      ? `Risk score is ${Math.round(riskScore)}/100, driven by ${modCount} moderate item${modCount === 1 ? "" : "s"}. Leverage is ${Math.round(leverageScore)}/100 — sufficient to push back. See negotiation playbook.`
      : `Risk score is ${Math.round(riskScore)}/100 with ${highCount} high-severity item${highCount === 1 ? "" : "s"}. Pause execution until resolved; route to attorney.`;

  // ===== Risk matrix (one row per con) =====
  const riskMatrix: RiskMatrixRow[] = cons.map((c) => {
    const move = negotiation.find((n) => n.id.startsWith(c.id) || n.rationale.toLowerCase().includes(c.label.toLowerCase().slice(0, 12)));
    return {
      id: `rm_${c.id}`,
      risk: c.label,
      severity: c.severity,
      mitigation: move ? move.ask : "Flag to counsel; document the trade-off in writing before signing.",
      owner: p,
    };
  });

  // ===== Liability allocation =====
  const liabilityAllocation: LiabilityRow[] = [];
  const allocLabels2: Record<string, string> = {
    title_insurance_paid_by: "Title insurance",
    survey_paid_by: "Survey",
    transfer_tax_paid_by: "Transfer tax",
    hoa_transfer_fee_paid_by: "HOA transfer fee",
    home_warranty_paid_by: "Home warranty",
  };
  if (e) {
    Object.keys(allocLabels2).forEach((k) => {
      const paidBy = val(e[k as keyof CanonicalContractExtraction] as { value: string | null } | null);
      const item = allocLabels2[k];
      const party: LiabilityRow["party"] =
        paidBy === "buyer" || paidBy === "seller" || paidBy === "split" ? paidBy : "unspecified";
      liabilityAllocation.push({
        id: `liab_${k}`,
        item,
        party,
        when: "At closing",
        why: party === "unspecified"
          ? "Not allocated in the contract — defaults to local custom. Confirm in writing."
          : party === "split"
          ? "Contract splits this cost between parties."
          : `Contract assigns this to the ${party}.`,
      });
    });
  }
  // Property tax / rezoning liability
  liabilityAllocation.push({
    id: "liab_proptax",
    item: "Property tax (post-close, including any reassessment after rezoning)",
    party: "buyer",
    when: "Pro-rated at closing; full liability post-close",
    why: "Buyer assumes property tax obligations from closing forward. If rezoning occurs (pre- or post-close), the reassessed tax bill follows the buyer. Verify pending reassessment notices in title work.",
  });
  liabilityAllocation.push({
    id: "liab_ins",
    item: "Hazard / property insurance",
    party: "buyer",
    when: "From closing",
    why: "Buyer must bind coverage effective at closing. Lender will require proof.",
  });
  liabilityAllocation.push({
    id: "liab_env",
    item: "Environmental conditions discovered post-close",
    party: val(e?.as_is_clause) === true ? "buyer" : "unspecified",
    when: "Post-close",
    why: val(e?.as_is_clause) === true
      ? "AS-IS clause shifts environmental risk to the buyer. Order Phase I if any commercial use was historic."
      : "Allocation is unclear in the contract. Confirm seller representations and warranties on environmental status.",
  });
  liabilityAllocation.push({
    id: "liab_liens",
    item: "Existing liens / unpaid assessments",
    party: "seller",
    when: "Cleared at closing",
    why: "Seller is responsible for delivering clear title. Title commitment will reveal any liens or unpaid HOA/special assessments.",
  });
  if (val(e?.liquidated_damages_clause) === true) {
    liabilityAllocation.push({
      id: "liab_liq",
      item: "Buyer default — damages",
      party: "buyer",
      when: "On default",
      why: "Liquidated damages clause caps seller's recovery at the earnest money. Buyer forfeits earnest money but no further liability.",
    });
  }

  // ===== Who pays what (table for highlight brief) =====
  const whoPaysWhat: WhoPaysRow[] = [];
  const pushPays = (id: string, item: string, paidBy: PaidBy | "unspecified", notes: string) => {
    whoPaysWhat.push({
      id,
      item,
      buyer: paidBy === "buyer",
      seller: paidBy === "seller",
      notes: paidBy === "split" ? "Split between buyer and seller" : paidBy === "unspecified" ? "Not specified — defaults to local custom" : notes,
    });
  };
  pushPays("wp_title", "Title insurance", (val(e?.title_insurance_paid_by) as PaidBy) ?? "unspecified", "Per contract");
  pushPays("wp_survey", "Survey", (val(e?.survey_paid_by) as PaidBy) ?? "unspecified", "Per contract");
  pushPays("wp_transfer", "Transfer / recording tax", (val(e?.transfer_tax_paid_by) as PaidBy) ?? "unspecified", "Per contract");
  pushPays("wp_hoa", "HOA transfer fee", (val(e?.hoa_transfer_fee_paid_by) as PaidBy) ?? "unspecified", "Per contract");
  pushPays("wp_warranty", "Home warranty", (val(e?.home_warranty_paid_by) as PaidBy) ?? "unspecified", "Per contract");
  whoPaysWhat.push({
    id: "wp_proptax",
    item: "Property tax (post-close)",
    buyer: true,
    seller: false,
    notes: "Pro-rated at closing. Reassessment after rezoning is buyer's responsibility.",
  });
  whoPaysWhat.push({
    id: "wp_ins",
    item: "Property insurance (post-close)",
    buyer: true,
    seller: false,
    notes: "Buyer binds coverage at close.",
  });
  whoPaysWhat.push({
    id: "wp_em",
    item: "Earnest money",
    buyer: true,
    seller: false,
    notes: em > 0 ? `${fmtMoney(em)} (${(emRatio * 100).toFixed(2)}% of price)` : "Not yet posted",
  });

  // ===== Timeline rows from deadlines =====
  const timeline: TimelineRow[] = deadlines.map((d) => ({
    id: `tl_${d.id}`,
    milestone: d.label,
    date: d.date ?? null,
    daysFromEffective: d.daysFromEffective ?? null,
    party:
      d.id.includes("inspection") || d.id.includes("financing") || d.id.includes("appraisal") || d.id.includes("em_due")
        ? "buyer"
        : d.id === "close" || d.id === "possession"
        ? "both"
        : "both",
  }));

  // ===== Split questions: attorney vs broker =====
  const attorneyQuestions: Question[] = questions.filter((q) => q.category === "legal" || q.category === "contingency" || q.category === "financial");
  const brokerQuestions: BrokerQuestion[] = [];
  // Property/timeline questions become broker questions; add CBRE-style broker prompts
  questions
    .filter((q) => q.category === "property" || q.category === "timeline")
    .forEach((q) => brokerQuestions.push({ id: `bq_${q.id}`, question: q.question, why: q.why }));

  brokerQuestions.push({
    id: "bq_market",
    question: "What comparable sales support the contract price within the last 90 days?",
    why: "Validates price discipline and informs appraisal exposure.",
  });
  brokerQuestions.push({
    id: "bq_dom",
    question: "How long was the property on market and how many offers were received?",
    why: "Gauges true market demand and seller leverage.",
  });
  brokerQuestions.push({
    id: "bq_back",
    question: "Are there backup offers, and at what terms?",
    why: "Affects re-negotiation leverage if a contingency triggers.",
  });
  brokerQuestions.push({
    id: "bq_zone",
    question: "Has the seller received any rezoning, special-assessment, or eminent-domain notices?",
    why: "Pending zoning or assessment changes can swing post-close property tax materially.",
  });
  if (p === "seller") {
    brokerQuestions.push({
      id: "bq_buyer_strength",
      question: "What is the buyer's verified financial strength beyond pre-approval?",
      why: "Lender pre-approval is not a commitment; verify reserves and DTI before reliance.",
    });
  } else {
    brokerQuestions.push({
      id: "bq_seller_motive",
      question: "What is the seller's motivation and timing flexibility?",
      why: "Drives both pricing leverage and willingness to credit repairs.",
    });
  }

  // Merge paralegal-rules supplemental rows (deal-structure aware allocations,
  // commercial diligence, broker prompts). De-dup by id where keys overlap.
  const mergeById = <T extends { id: string }>(base: T[], extra: T[]): T[] => {
    const ids = new Set(base.map((x) => x.id));
    return [...base, ...extra.filter((x) => !ids.has(x.id))];
  };
  const mergedWhoPays = mergeById(whoPaysWhat, paralegal.whoPaysWhat);
  const mergedLiability = mergeById(liabilityAllocation, paralegal.liabilityAllocation);
  const mergedBrokerQs = mergeById(brokerQuestions, paralegal.brokerQuestions);
  deadlines.sort((a, b) => {
    if (a.status === "missing" && b.status !== "missing") return 1;
    if (b.status === "missing" && a.status !== "missing") return -1;
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });

  // Sort cons by severity desc
  const sevOrder: Record<Severity, number> = { high: 0, moderate: 1, low: 2 };
  cons.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);

  // Takeaways = top 3 cons + leverage count
  const takeaways: string[] = [];
  cons
    .filter((c) => c.severity === "high")
    .slice(0, 3)
    .forEach((c) => takeaways.push(c.label));
  if (cons.length === 0) takeaways.push(`No material concerns detected for the ${partyLabel}.`);
  if (pros.length > 0) takeaways.push(`${pros.length} favorable term${pros.length > 1 ? "s" : ""} identified.`);
  if (missing.length > 0) takeaways.push(`Missing inputs may affect accuracy: ${missing.join(", ")}.`);

  return {
    perspective: p,
    summary,
    executiveSummary,
    riskScore: Math.round(riskScore),
    leverageScore: Math.round(leverageScore),
    recommendation,
    decision,
    decisionRationale,
    pros,
    cons,
    weaknesses,
    questions,
    attorneyQuestions,
    brokerQuestions: mergedBrokerQs,
    deadlines,
    timeline,
    riskMatrix,
    liabilityAllocation: mergedLiability,
    whoPaysWhat: mergedWhoPays,
    negotiation,
    takeaways,
    missingInputs: missing,
    dealStructureLabel: paralegal.dealStructureLabel,
    closingAccounting: paralegal.closingAccounting,
    computedAt: new Date().toISOString(),
  };
}
