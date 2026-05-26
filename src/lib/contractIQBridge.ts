// ContractIQ ↔ DealIQ Bridge
// Deterministic cross-check between an executed/draft contract and the
// underwritten deal. No AI. Produces variance findings with severity and
// (optional) dollar impact so an investor can immediately see where the
// paper diverges from the model.

export type BridgeSeverity = "high" | "moderate" | "low" | "info";

export type BridgeDirection = "worse" | "better" | "neutral" | "missing";

export interface BridgeFinding {
  id: string;
  field: string;                 // e.g. "Purchase price"
  label: string;                 // short headline
  detail: string;                // 1–2 sentences, plain English
  severity: BridgeSeverity;
  direction: BridgeDirection;    // worse / better for the investor
  contractValue?: string;
  dealValue?: string;
  deltaAbs?: number;             // numeric absolute delta where meaningful
  deltaPct?: number;             // numeric percentage delta
  dollarImpact?: number;         // signed: negative = downside, positive = upside
  category: "price" | "timing" | "earnest" | "parties" | "address" | "structure";
}

export interface DealLite {
  property_address?: string | null;
  city?: string | null;
  state?: string | null;
  purchase_price?: number | null;
  closing_costs?: number | null;
  rehab_cost?: number | null;
  estimated_arv?: number | null;
  buyer_name?: string | null;
  seller_name?: string | null;
  strategy_primary?: string | null;
}

export interface ContractLite {
  property_address?: string | null;
  purchase_price?: number | null;
  earnest_money?: number | null;
  closing_date?: string | null;
  inspection_period_days?: number | null;
  buyer_name?: string | null;
  seller_name?: string | null;
  financing_contingency?: boolean | null;
  appraisal_contingency?: boolean | null;
  inspection_contingency?: boolean | null;
  created_at?: string | null;
}

export interface BridgeResult {
  alignmentScore: number;        // 0..100, 100 = perfectly aligned
  findings: BridgeFinding[];
  totalDownside: number;         // sum of negative dollarImpact (>=0)
  totalUpside: number;           // sum of positive dollarImpact
  hasDeal: boolean;
}

const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const pct = (n: number) =>
  `${(n * 100).toFixed(n >= 0.1 || n <= -0.1 ? 1 : 2)}%`;

function normAddress(a?: string | null) {
  return (a ?? "")
    .toLowerCase()
    .replace(/[.,#]/g, " ")
    .replace(/\b(street|st|road|rd|avenue|ave|boulevard|blvd|drive|dr|lane|ln|court|ct|place|pl)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normName(a?: string | null) {
  return (a ?? "").toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

function daysBetween(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

export function bridgeContractWithDeal(
  contract: ContractLite,
  deal: DealLite | null | undefined,
  perspective: "buyer" | "seller" = "buyer",
): BridgeResult {
  const findings: BridgeFinding[] = [];

  if (!deal) {
    return {
      alignmentScore: 0,
      findings: [
        {
          id: "no_deal",
          field: "Deal link",
          label: "No DealIQ underwriting linked",
          detail:
            "This contract is not tied to a DealIQ deal. Link it from the contract list to cross-check price, timing and parties against your model.",
          severity: "info",
          direction: "missing",
          category: "structure",
        },
      ],
      totalDownside: 0,
      totalUpside: 0,
      hasDeal: false,
    };
  }

  // ── Purchase price ──────────────────────────────────────────────
  if (contract.purchase_price != null && deal.purchase_price != null && deal.purchase_price > 0) {
    const delta = contract.purchase_price - deal.purchase_price;
    const pctDelta = delta / deal.purchase_price;
    const worseForBuyer = delta > 0;
    const isMaterial = Math.abs(pctDelta) >= 0.005; // 0.5%
    if (isMaterial) {
      const investorWorse = (perspective === "buyer" && worseForBuyer) || (perspective === "seller" && !worseForBuyer);
      const sev: BridgeSeverity =
        Math.abs(pctDelta) >= 0.05 ? "high" : Math.abs(pctDelta) >= 0.02 ? "moderate" : "low";
      findings.push({
        id: "price_delta",
        field: "Purchase price",
        label: investorWorse
          ? `Contract price is ${pct(Math.abs(pctDelta))} ${worseForBuyer ? "above" : "below"} underwriting`
          : `Contract price is ${pct(Math.abs(pctDelta))} ${worseForBuyer ? "above" : "below"} underwriting (favorable to you)`,
        detail: `Modeled at ${money(deal.purchase_price)} in DealIQ, signed at ${money(contract.purchase_price)}. ${
          investorWorse
            ? "Returns will compress unless the model is updated or the price is renegotiated."
            : "Improves your modeled returns; verify nothing else gave to make the price work."
        }`,
        severity: investorWorse ? sev : "info",
        direction: investorWorse ? "worse" : "better",
        contractValue: money(contract.purchase_price),
        dealValue: money(deal.purchase_price),
        deltaAbs: delta,
        deltaPct: pctDelta,
        dollarImpact: investorWorse ? -Math.abs(delta) : Math.abs(delta),
        category: "price",
      });
    }
  } else if (contract.purchase_price != null && (deal.purchase_price == null || deal.purchase_price === 0)) {
    findings.push({
      id: "price_no_model",
      field: "Purchase price",
      label: "No modeled price in DealIQ",
      detail: `Contract is at ${money(contract.purchase_price)} but DealIQ has no purchase price set. Run underwriting to validate the number.`,
      severity: "moderate",
      direction: "missing",
      contractValue: money(contract.purchase_price),
      category: "price",
    });
  }

  // ── Earnest money vs price ──────────────────────────────────────
  if (contract.earnest_money != null && contract.purchase_price && contract.purchase_price > 0) {
    const emPct = contract.earnest_money / contract.purchase_price;
    if (perspective === "seller" && emPct < 0.01) {
      findings.push({
        id: "em_low_seller",
        field: "Earnest money",
        label: `Earnest money is only ${pct(emPct)} of price`,
        detail: `As seller, weak earnest money (${money(contract.earnest_money)}) means low cost for the buyer to walk. Industry norm is 1–3%.`,
        severity: emPct < 0.005 ? "high" : "moderate",
        direction: "worse",
        contractValue: money(contract.earnest_money),
        category: "earnest",
      });
    }
    if (perspective === "buyer" && emPct > 0.05) {
      findings.push({
        id: "em_high_buyer",
        field: "Earnest money",
        label: `Earnest money is ${pct(emPct)} of price`,
        detail: `As buyer, ${money(contract.earnest_money)} at risk is above the 1–3% norm. Confirm refund conditions are airtight.`,
        severity: emPct > 0.1 ? "high" : "moderate",
        direction: "worse",
        contractValue: money(contract.earnest_money),
        dollarImpact: -contract.earnest_money * 0.25,
        category: "earnest",
      });
    }
  }

  // ── Closing timing ──────────────────────────────────────────────
  if (contract.closing_date) {
    const close = new Date(contract.closing_date);
    const from = contract.created_at ? new Date(contract.created_at) : new Date();
    if (!isNaN(close.getTime())) {
      const days = daysBetween(close, from);
      if (days < 0) {
        findings.push({
          id: "close_past",
          field: "Closing date",
          label: "Closing date is in the past",
          detail: `Contract closing date (${close.toLocaleDateString()}) is before today. Verify whether the deal closed, was extended, or is dead.`,
          severity: "high",
          direction: "worse",
          contractValue: close.toLocaleDateString(),
          category: "timing",
        });
      } else if (days < 14 && perspective === "buyer") {
        findings.push({
          id: "close_tight_buyer",
          field: "Closing date",
          label: `Only ${days} days to close`,
          detail: "Tight timeline for buyer: financing, inspection, title and insurance all need to clear quickly. Confirm lender can meet the date.",
          severity: days < 7 ? "high" : "moderate",
          direction: "worse",
          contractValue: close.toLocaleDateString(),
          category: "timing",
        });
      } else if (days > 120) {
        findings.push({
          id: "close_long",
          field: "Closing date",
          label: `${days} days until closing`,
          detail: "Long close exposes both sides to market drift. Confirm whether rate locks, insurance quotes and the underwriting assumptions still hold at that date.",
          severity: "moderate",
          direction: "worse",
          contractValue: close.toLocaleDateString(),
          category: "timing",
        });
      }
    }
  } else {
    findings.push({
      id: "no_close_date",
      field: "Closing date",
      label: "No closing date in contract",
      detail: "DealIQ holding-cost and financing assumptions depend on a closing date. Add one to make the underwriting accurate.",
      severity: "moderate",
      direction: "missing",
      category: "timing",
    });
  }

  // ── Address mismatch ────────────────────────────────────────────
  const ca = normAddress(contract.property_address);
  const da = normAddress(deal.property_address);
  if (ca && da) {
    const tokensC = new Set(ca.split(" ").filter(Boolean));
    const tokensD = new Set(da.split(" ").filter(Boolean));
    let overlap = 0;
    tokensC.forEach((t) => tokensD.has(t) && overlap++);
    const ratio = overlap / Math.max(1, Math.min(tokensC.size, tokensD.size));
    if (ratio < 0.5) {
      findings.push({
        id: "addr_mismatch",
        field: "Property address",
        label: "Contract address does not match the deal",
        detail: `Contract: ${contract.property_address}. Deal: ${deal.property_address}. Confirm you are working on the right property before signing.`,
        severity: "high",
        direction: "worse",
        contractValue: contract.property_address ?? "",
        dealValue: deal.property_address ?? "",
        category: "address",
      });
    }
  }

  // ── Party names ─────────────────────────────────────────────────
  const cBuyer = normName(contract.buyer_name);
  const dBuyer = normName(deal.buyer_name);
  if (cBuyer && dBuyer && !cBuyer.includes(dBuyer) && !dBuyer.includes(cBuyer)) {
    findings.push({
      id: "buyer_name_mismatch",
      field: "Buyer name",
      label: "Buyer entity differs from DealIQ",
      detail: `Contract names "${contract.buyer_name}" as buyer; deal expected "${deal.buyer_name}". Confirm the right entity is taking title (impacts liability, taxes, financing).`,
      severity: "moderate",
      direction: "worse",
      contractValue: contract.buyer_name ?? "",
      dealValue: deal.buyer_name ?? "",
      category: "parties",
    });
  }
  const cSeller = normName(contract.seller_name);
  const dSeller = normName(deal.seller_name);
  if (cSeller && dSeller && !cSeller.includes(dSeller) && !dSeller.includes(cSeller)) {
    findings.push({
      id: "seller_name_mismatch",
      field: "Seller name",
      label: "Seller of record differs from DealIQ",
      detail: `Contract seller "${contract.seller_name}" vs deal seller "${deal.seller_name}". Verify chain of title and signing authority.`,
      severity: "moderate",
      direction: "worse",
      contractValue: contract.seller_name ?? "",
      dealValue: deal.seller_name ?? "",
      category: "parties",
    });
  }

  // ── Strategy-specific contingency checks ────────────────────────
  const strat = (deal.strategy_primary ?? "").toLowerCase();
  if (perspective === "buyer") {
    if (!contract.financing_contingency && strat && !strat.includes("cash")) {
      findings.push({
        id: "no_fin_vs_strategy",
        field: "Financing contingency",
        label: "No financing contingency, but strategy assumes a loan",
        detail: `DealIQ strategy "${deal.strategy_primary}" relies on leverage, yet the contract waives the financing contingency. Earnest money is at risk if the loan fails.`,
        severity: "high",
        direction: "worse",
        category: "structure",
        dollarImpact: contract.earnest_money ? -contract.earnest_money : undefined,
      });
    }
    if (!contract.inspection_contingency && (strat.includes("brrrr") || strat.includes("flip") || strat.includes("rehab"))) {
      findings.push({
        id: "no_insp_vs_rehab",
        field: "Inspection contingency",
        label: "No inspection period for a rehab-heavy strategy",
        detail: `Strategy "${deal.strategy_primary}" depends on a controlled scope of work. Without an inspection period you cannot revise rehab budget after seeing the property.`,
        severity: "high",
        direction: "worse",
        category: "structure",
        dollarImpact: deal.rehab_cost ? -deal.rehab_cost * 0.15 : undefined,
      });
    }
    if (!contract.appraisal_contingency && deal.purchase_price && deal.estimated_arv && deal.estimated_arv > 0) {
      const spread = (deal.estimated_arv - deal.purchase_price) / deal.estimated_arv;
      if (spread < 0.1) {
        findings.push({
          id: "no_appraisal_thin",
          field: "Appraisal contingency",
          label: "No appraisal contingency on a thin-margin deal",
          detail: `ARV spread is only ${pct(spread)}. A low appraisal forces extra cash to close or losing earnest money. Add an appraisal contingency or widen the spread.`,
          severity: "moderate",
          direction: "worse",
          category: "structure",
        });
      }
    }
  }

  // ── All-in cost sanity check (buyer) ────────────────────────────
  if (
    perspective === "buyer" &&
    contract.purchase_price != null &&
    deal.estimated_arv != null &&
    deal.estimated_arv > 0
  ) {
    const totalIn =
      (contract.purchase_price ?? 0) +
      (deal.closing_costs ?? 0) +
      (deal.rehab_cost ?? 0);
    const ratio = totalIn / deal.estimated_arv;
    if (ratio > 0.8) {
      findings.push({
        id: "all_in_over_80",
        field: "All-in vs ARV",
        label: `All-in cost is ${pct(ratio)} of ARV`,
        detail: `Price + closing + rehab = ${money(totalIn)} vs ARV ${money(deal.estimated_arv)}. Above 75–80% leaves no margin for surprises (overruns, lower-than-expected ARV, refi haircut).`,
        severity: ratio > 0.9 ? "high" : "moderate",
        direction: "worse",
        contractValue: money(totalIn),
        dealValue: money(deal.estimated_arv),
        category: "price",
      });
    }
  }

  // ── Alignment score ─────────────────────────────────────────────
  let score = 100;
  for (const f of findings) {
    if (f.direction === "better") continue;
    if (f.severity === "high") score -= 18;
    else if (f.severity === "moderate") score -= 9;
    else if (f.severity === "low") score -= 4;
    else if (f.direction === "missing") score -= 6;
  }
  score = Math.max(0, Math.min(100, Math.round(score)));

  const totalDownside = findings.reduce(
    (s, f) => (f.dollarImpact && f.dollarImpact < 0 ? s + Math.abs(f.dollarImpact) : s),
    0,
  );
  const totalUpside = findings.reduce(
    (s, f) => (f.dollarImpact && f.dollarImpact > 0 ? s + f.dollarImpact : s),
    0,
  );

  // Sort: high → moderate → low → info, downside before upside
  const sevRank: Record<BridgeSeverity, number> = { high: 0, moderate: 1, low: 2, info: 3 };
  findings.sort((a, b) => {
    const s = sevRank[a.severity] - sevRank[b.severity];
    if (s !== 0) return s;
    if (a.direction === "worse" && b.direction !== "worse") return -1;
    if (b.direction === "worse" && a.direction !== "worse") return 1;
    return 0;
  });

  return {
    alignmentScore: score,
    findings,
    totalDownside,
    totalUpside,
    hasDeal: true,
  };
}

export const formatBridgeMoney = money;
