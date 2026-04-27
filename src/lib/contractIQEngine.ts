/**
 * ContractIQ Engine — deterministic contract intelligence.
 * Mirrors DealIQ pattern: rules-based, no AI in scoring, perspective-aware (buyer/seller).
 */

export type Perspective = "buyer" | "seller";

export interface ContractInput {
  perspective: Perspective;
  contract_type?: string | null;
  buyer_name?: string | null;
  seller_name?: string | null;
  property_address?: string | null;
  purchase_price?: number | null;
  earnest_money?: number | null;
  closing_date?: string | null; // ISO
  inspection_period_days?: number | null;
  financing_contingency?: boolean | null;
  appraisal_contingency?: boolean | null;
  inspection_contingency?: boolean | null;
  contract_text?: string | null;
}

export type Severity = "high" | "moderate" | "low";

export interface RiskFlag {
  id: string;
  label: string;
  severity: Severity;
  detail: string;
  affects: Perspective | "both";
}

export interface LeveragePoint {
  id: string;
  label: string;
  detail: string;
  favors: Perspective;
}

export interface TimelineItem {
  id: string;
  label: string;
  date?: string | null;
  daysFromNow?: number | null;
  status: "set" | "missing" | "tight";
}

export interface ContractAnalysis {
  perspective: Perspective;
  summary: string;
  riskScore: number;        // 0-100, higher = riskier for the chosen perspective
  leverageScore: number;    // 0-100, higher = more leverage for the chosen perspective
  recommendation: "proceed" | "negotiate" | "caution";
  risks: RiskFlag[];
  leverage: LeveragePoint[];
  timeline: TimelineItem[];
  takeaways: string[];
  actions: string[];
  missingInputs: string[];
}

const daysBetween = (iso?: string | null): number | null => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.round((t - Date.now()) / (1000 * 60 * 60 * 24));
};

export function analyzeContract(input: ContractInput): ContractAnalysis {
  const p = input.perspective;
  const opposite: Perspective = p === "buyer" ? "seller" : "buyer";

  const risks: RiskFlag[] = [];
  const leverage: LeveragePoint[] = [];
  const timeline: TimelineItem[] = [];
  const missing: string[] = [];

  // ---- Inputs validation ----
  if (input.purchase_price == null) missing.push("Purchase price");
  if (input.earnest_money == null) missing.push("Earnest money");
  if (!input.closing_date) missing.push("Closing date");
  if (input.inspection_period_days == null) missing.push("Inspection period");

  // ---- Earnest money ratio ----
  const price = input.purchase_price ?? 0;
  const em = input.earnest_money ?? 0;
  const emRatio = price > 0 ? em / price : 0;

  if (price > 0 && em > 0) {
    if (emRatio < 0.005) {
      risks.push({
        id: "em_low",
        label: "Earnest money is unusually low",
        severity: p === "seller" ? "high" : "low",
        detail: `Earnest money is ${(emRatio * 100).toFixed(2)}% of purchase price (typical range is 1–3%).`,
        affects: "seller",
      });
      if (p === "buyer") {
        leverage.push({
          id: "em_low_buyer",
          label: "Low capital at risk",
          detail: "Buyer has minimal capital exposed if the deal terminates.",
          favors: "buyer",
        });
      }
    } else if (emRatio > 0.05) {
      risks.push({
        id: "em_high",
        label: "Earnest money is unusually high",
        severity: p === "buyer" ? "high" : "low",
        detail: `Earnest money is ${(emRatio * 100).toFixed(2)}% of purchase price — significant capital at risk.`,
        affects: "buyer",
      });
      if (p === "seller") {
        leverage.push({
          id: "em_high_seller",
          label: "Strong buyer commitment",
          detail: "Buyer has substantial capital at risk, signaling commitment.",
          favors: "seller",
        });
      }
    }
  }

  // ---- Contingencies ----
  const cFin = !!input.financing_contingency;
  const cApp = !!input.appraisal_contingency;
  const cIns = !!input.inspection_contingency;
  const contingencyCount = [cFin, cApp, cIns].filter(Boolean).length;

  if (cFin) {
    if (p === "seller") {
      risks.push({
        id: "fin_cont",
        label: "Financing contingency present",
        severity: "moderate",
        detail: "Buyer can terminate if financing falls through.",
        affects: "seller",
      });
    } else {
      leverage.push({
        id: "fin_cont_b",
        label: "Financing contingency protects buyer",
        detail: "Buyer can exit without forfeiting earnest money if financing fails.",
        favors: "buyer",
      });
    }
  } else if (price > 0) {
    if (p === "buyer") {
      risks.push({
        id: "no_fin",
        label: "No financing contingency",
        severity: "high",
        detail: "Buyer is on the hook even if a loan is denied.",
        affects: "buyer",
      });
    } else {
      leverage.push({
        id: "no_fin_s",
        label: "Cash-equivalent commitment",
        detail: "Seller is protected from financing-related fall-through.",
        favors: "seller",
      });
    }
  }

  if (cApp) {
    if (p === "seller") {
      risks.push({
        id: "app_cont",
        label: "Appraisal contingency present",
        severity: "moderate",
        detail: "Buyer can renegotiate or exit if appraisal comes in low.",
        affects: "seller",
      });
    }
  } else if (p === "buyer") {
    risks.push({
      id: "no_app",
      label: "No appraisal contingency",
      severity: "moderate",
      detail: "Buyer must close even if the property appraises below contract price.",
      affects: "buyer",
    });
  }

  if (cIns) {
    if (p === "seller") {
      risks.push({
        id: "ins_cont",
        label: "Inspection contingency present",
        severity: "low",
        detail: "Buyer may request repairs, credits, or termination after inspection.",
        affects: "seller",
      });
    }
  } else if (p === "buyer") {
    risks.push({
      id: "no_ins",
      label: "No inspection contingency",
      severity: "high",
      detail: "Buyer accepts property condition as-is with no recourse.",
      affects: "buyer",
    });
  }

  // ---- Inspection period ----
  const ip = input.inspection_period_days;
  if (ip != null) {
    if (ip < 7 && cIns) {
      risks.push({
        id: "ip_tight",
        label: "Tight inspection period",
        severity: p === "buyer" ? "moderate" : "low",
        detail: `Only ${ip} days to complete inspections — limited time to identify issues.`,
        affects: "buyer",
      });
    }
    if (ip > 21) {
      if (p === "seller") {
        risks.push({
          id: "ip_long",
          label: "Long inspection period",
          severity: "low",
          detail: `${ip}-day inspection window keeps the property off-market longer.`,
          affects: "seller",
        });
      } else {
        leverage.push({
          id: "ip_long_b",
          label: "Generous inspection window",
          detail: `${ip} days provides ample time for due diligence.`,
          favors: "buyer",
        });
      }
    }
  }

  // ---- Timeline ----
  const daysToClose = daysBetween(input.closing_date);
  if (input.closing_date) {
    timeline.push({
      id: "close",
      label: "Closing",
      date: input.closing_date,
      daysFromNow: daysToClose,
      status: daysToClose != null && daysToClose < 14 ? "tight" : "set",
    });
    if (daysToClose != null && daysToClose < 14) {
      risks.push({
        id: "close_tight",
        label: "Tight closing timeline",
        severity: "moderate",
        detail: `${daysToClose} days to closing — limited room for delays.`,
        affects: "both",
      });
    }
  } else {
    timeline.push({ id: "close", label: "Closing", status: "missing" });
  }

  if (ip != null && input.closing_date) {
    timeline.push({
      id: "insp_end",
      label: "Inspection period ends",
      daysFromNow: ip,
      status: "set",
    });
  }

  // ---- Scoring ----
  const sevWeight: Record<Severity, number> = { high: 30, moderate: 15, low: 5 };
  const myRisks = risks.filter((r) => r.affects === p || r.affects === "both");
  const rawRisk = myRisks.reduce((sum, r) => sum + sevWeight[r.severity], 0);
  const riskScore = Math.min(100, rawRisk);

  const myLeverage = leverage.filter((l) => l.favors === p);
  const oppLeverage = leverage.filter((l) => l.favors === opposite);
  const leverageScore = Math.min(
    100,
    Math.max(0, 50 + myLeverage.length * 12 - oppLeverage.length * 12 - riskScore * 0.3)
  );

  let recommendation: ContractAnalysis["recommendation"];
  if (riskScore >= 60) recommendation = "caution";
  else if (riskScore >= 30 || myRisks.some((r) => r.severity === "high")) recommendation = "negotiate";
  else recommendation = "proceed";

  // ---- Plain English ----
  const partyLabel = p === "buyer" ? "buyer" : "seller";
  const summary =
    recommendation === "proceed"
      ? `From the ${partyLabel}'s perspective, this contract appears balanced with manageable risk.`
      : recommendation === "negotiate"
      ? `From the ${partyLabel}'s perspective, this contract has terms worth negotiating before signing.`
      : `From the ${partyLabel}'s perspective, this contract carries significant risk and warrants careful review.`;

  const takeaways: string[] = [];
  if (myRisks.length === 0) takeaways.push(`No material risks detected for the ${partyLabel}.`);
  myRisks
    .filter((r) => r.severity === "high")
    .slice(0, 3)
    .forEach((r) => takeaways.push(r.label));
  if (myLeverage.length > 0) takeaways.push(`${myLeverage.length} leverage point${myLeverage.length > 1 ? "s" : ""} favor the ${partyLabel}.`);
  if (missing.length > 0) takeaways.push(`Missing inputs may affect accuracy: ${missing.join(", ")}.`);

  const actions: string[] = [];
  myRisks
    .filter((r) => r.severity === "high")
    .forEach((r) => actions.push(`Negotiate or address: ${r.label.toLowerCase()}.`));
  if (recommendation === "proceed" && actions.length === 0) {
    actions.push("Proceed to standard due diligence.");
  }
  if (missing.length > 0) {
    actions.push("Provide the missing fields to refine analysis.");
  }

  return {
    perspective: p,
    summary,
    riskScore: Math.round(riskScore),
    leverageScore: Math.round(leverageScore),
    recommendation,
    risks,
    leverage,
    timeline,
    takeaways,
    actions,
    missingInputs: missing,
  };
}
