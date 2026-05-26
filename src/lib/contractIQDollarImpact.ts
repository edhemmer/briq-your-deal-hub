/**
 * ContractIQ — Dollar Impact Pricing (Module D)
 *
 * Deterministic, perspective-aware dollar exposure for contract findings.
 * Same input -> same output. No AI, no randomness.
 *
 * Every supported finding id maps to a low/mid/high USD range with a
 * documented basis so a counterparty can audit the math.
 *
 * Findings without a pricing rule simply return null — they remain
 * narrative-only and the UI omits the pill.
 */

import type { Perspective } from "./contractIQEngine";

export type ImpactKind =
  /** Dollar amount of downside / loss exposure if the risk materializes. */
  | "exposure"
  /** Cap on liability (e.g., liquidated damages — bounded loss). */
  | "cap"
  /** Cost saving / value captured by the favorable term. */
  | "savings"
  /** Cost the party will pay (closing allocation, fee). */
  | "cost";

export interface DollarImpact {
  /** USD low end of estimated impact. */
  low: number;
  /** USD point estimate (used for portfolio totals). */
  mid: number;
  /** USD high end. */
  high: number;
  /** Plain-English description of how the range was computed. */
  basis: string;
  /** Short formula label for audit (e.g., "0.03 × price"). */
  formula: string;
  kind: ImpactKind;
  /** True when the party would pay / lose this; false when it's saved / capped. */
  isDownside: boolean;
}

export interface PricingContext {
  perspective: Perspective;
  price: number;
  earnestMoney: number;
  daysToClose: number | null;
  inspectionDays: number | null;
}

const round = (n: number) => Math.round(n / 100) * 100;

const range = (mid: number, spread = 0.4): { low: number; mid: number; high: number } => ({
  low: round(mid * (1 - spread)),
  mid: round(mid),
  high: round(mid * (1 + spread)),
});

const ZERO_CTX = (ctx: PricingContext) => ctx.price <= 0;

/**
 * Compute the dollar impact for a finding id. Returns null when no
 * pricing rule applies or required inputs are missing.
 */
export function priceFinding(id: string, ctx: PricingContext): DollarImpact | null {
  if (ZERO_CTX(ctx)) return null;
  const { perspective: p, price, earnestMoney: em, daysToClose, inspectionDays } = ctx;

  switch (id) {
    // ── Earnest money ────────────────────────────────────────────────
    case "em_low": {
      const gap = Math.max(0, price * 0.01 - em);
      if (gap <= 0) return null;
      return {
        ...range(gap, 0.25),
        basis: "Earnest money below 1% market floor — the missing commitment cushion the seller is forgoing.",
        formula: "1% × price − EM",
        kind: "exposure",
        isDownside: p === "seller",
      };
    }
    case "em_high": {
      const overage = Math.max(0, em - price * 0.03);
      if (overage <= 0) return null;
      return {
        ...range(overage, 0.2),
        basis: "Earnest money above 3% market norm — incremental capital exposed if a contingency triggers.",
        formula: "EM − 3% × price",
        kind: "exposure",
        isDownside: p === "buyer",
      };
    }
    case "em_zero": {
      const mid = price * 0.01;
      return {
        ...range(mid, 0.4),
        basis: "No earnest money posted — seller has no liquidated cushion if the buyer walks.",
        formula: "1% × price (foregone commitment)",
        kind: "exposure",
        isDownside: p === "seller",
      };
    }

    // ── Contingency gaps ─────────────────────────────────────────────
    case "no_fin": {
      const mid = em > 0 ? em : price * 0.02;
      return {
        ...range(mid, 0.1),
        basis: "Without a financing contingency, the full earnest money is forfeit if the loan is denied.",
        formula: em > 0 ? "EM (forfeit on lender denial)" : "~2% × price (typical EM)",
        kind: "exposure",
        isDownside: p === "buyer",
      };
    }
    case "no_app": {
      return {
        ...range(price * 0.05, 0.6),
        basis: "Typical low-appraisal gap exposure (3%–8% of price). Without the contingency, the buyer covers the shortfall in cash.",
        formula: "~5% × price",
        kind: "exposure",
        isDownside: p === "buyer",
      };
    }
    case "no_ins": {
      return {
        ...range(price * 0.02, 0.75),
        basis: "Hidden defects discovered post-close (roof, HVAC, structural). Buyer absorbs the full repair cost with no recourse.",
        formula: "~2% × price (defect reserve)",
        kind: "exposure",
        isDownside: p === "buyer",
      };
    }
    case "as_is": {
      return {
        ...range(price * 0.03, 0.7),
        basis: "AS-IS shifts all latent-defect risk to the buyer. Reserve roughly 1%–5% of price for post-close repairs.",
        formula: "~3% × price (repair reserve)",
        kind: "exposure",
        isDownside: p === "buyer",
      };
    }

    // ── Inspection timing ────────────────────────────────────────────
    case "ip_tight": {
      if (inspectionDays == null) return null;
      return {
        ...range(price * 0.01, 0.5),
        basis: `Only ${inspectionDays} days of inspection — high probability of missing a material defect that surfaces post-close.`,
        formula: "~1% × price (missed-defect cost)",
        kind: "exposure",
        isDownside: p === "buyer",
      };
    }

    // ── Closing timing ───────────────────────────────────────────────
    case "close_tight": {
      if (daysToClose == null || daysToClose >= 14) return null;
      const days = Math.max(1, 14 - daysToClose);
      const perDay = price * 0.0001; // ~1bps/day rate-lock + carry estimate
      const mid = perDay * days * 14;
      return {
        ...range(mid, 0.5),
        basis: `Tight ${daysToClose}-day close — rate-lock extensions, expediting fees, and per-diem carry add up.`,
        formula: "~1bps × price × days short",
        kind: "exposure",
        isDownside: "buyer" === p ? true : true, // both bear some risk
      };
    }
    case "close_past": {
      return {
        ...range(price * 0.005, 0.8),
        basis: "Closing date has passed — escrow extension fees, rate re-locks, and possible re-trade exposure.",
        formula: "~0.5% × price",
        kind: "exposure",
        isDownside: true,
      };
    }

    // ── Liquidated damages (cap, not loss) ──────────────────────────
    case "liq_dmg": {
      if (em <= 0) return null;
      return {
        low: em,
        mid: em,
        high: em,
        basis: "Liquidated damages clause caps buyer's exposure on default at the earnest money.",
        formula: "= EM (capped exposure)",
        kind: "cap",
        isDownside: p === "buyer",
      };
    }
    case "liq_dmg_s": {
      if (em <= 0) return null;
      return {
        low: em,
        mid: em,
        high: em,
        basis: "Seller's recovery on buyer default is capped at the earnest money — actual damages above EM are not recoverable.",
        formula: "= EM (capped recovery)",
        kind: "cap",
        isDownside: p === "seller",
      };
    }

    // ── Assignment / kick-out ───────────────────────────────────────
    case "kick_out": {
      const mid = price * 0.005 * 2; // ~2 months of carry while waiting
      return {
        ...range(mid, 0.5),
        basis: "Sale-of-other-home contingency lengthens days-on-market. Estimate ~2 months of carrying cost while the buyer's home sells.",
        formula: "~0.5% × price × 2 months carry",
        kind: "exposure",
        isDownside: p === "seller",
      };
    }
    case "many_stips": {
      return {
        ...range(price * 0.005, 0.6),
        basis: "Heavy custom stipulations create overlooked-term risk. Reserve ~0.5% of price for re-trade or counsel time.",
        formula: "~0.5% × price",
        kind: "exposure",
        isDownside: true,
      };
    }

    // ── Negotiation moves (savings if accepted) ─────────────────────
    case "em_increase": {
      const gap = Math.max(0, price * 0.01 - em);
      if (gap <= 0) return null;
      return {
        ...range(gap, 0.25),
        basis: "Raising EM to 1% of price increases the buyer's committed capital, strengthening seller protection.",
        formula: "1% × price − EM",
        kind: "savings",
        isDownside: false,
      };
    }
    case "em_reduce": {
      const overage = Math.max(0, em - price * 0.03);
      if (overage <= 0) return null;
      return {
        ...range(overage, 0.2),
        basis: "Reducing EM to 3% market norm frees committed capital and trims downside if a contingency triggers.",
        formula: "EM − 3% × price",
        kind: "savings",
        isDownside: false,
      };
    }
    case "add_fin_cont":
    case "add_app_cont":
    case "add_ins_cont": {
      const map: Record<string, { mid: number; basis: string; formula: string }> = {
        add_fin_cont: {
          mid: em > 0 ? em : price * 0.02,
          basis: "Adding a financing contingency protects the full earnest money from lender denial.",
          formula: em > 0 ? "= EM protected" : "~2% × price",
        },
        add_app_cont: {
          mid: price * 0.05,
          basis: "Appraisal contingency caps exposure to a low appraisal shortfall.",
          formula: "~5% × price",
        },
        add_ins_cont: {
          mid: price * 0.02,
          basis: "Inspection contingency preserves recourse for material defects.",
          formula: "~2% × price",
        },
      };
      const spec = map[id];
      return {
        ...range(spec.mid, 0.5),
        basis: spec.basis,
        formula: spec.formula,
        kind: "savings",
        isDownside: false,
      };
    }

    // ── Paralegal rules — financing structure (Module D-bis) ────────
    case "hm_cost": {
      // 2–4 pts + ~3% rate premium over ~12 mo on a ~70% LTV loan ≈ 4% of price
      return {
        ...range(price * 0.04, 0.4),
        basis: "Hard-money premium: 2–4 origination points plus a ~3% rate spread over a typical 12-month hold, on roughly 70% LTV.",
        formula: "~4% × price",
        kind: "cost",
        isDownside: p === "buyer",
      };
    }
    case "hm_seller": {
      return {
        ...range(em > 0 ? em : price * 0.02, 0.3),
        basis: "Hard-money lenders pull funding more often than banks; seller's downside if buyer's loan fails is the EM forfeit (which may not cover days-on-market lost).",
        formula: em > 0 ? "= EM (best-case recovery)" : "~2% × price",
        kind: "exposure",
        isDownside: p === "seller",
      };
    }
    case "agency_prepay":
    case "cmbs_def": {
      return {
        ...range(price * 0.05, 0.6),
        basis: "Yield maintenance / defeasance on agency or CMBS debt can cost 3%–15% of loan balance in a falling-rate exit. Estimate ~5% of price assuming ~70% LTV.",
        formula: "~5% × price (rate-environment dependent)",
        kind: "exposure",
        isDownside: p === "buyer",
      };
    }
    case "cmbs_serv": {
      return {
        ...range(75_000, 0.5),
        basis: "Special-servicer fees, legal, and rating-agency consents on CMBS modifications / assumptions.",
        formula: "Flat ~$50k–$125k",
        kind: "cost",
        isDownside: p === "buyer",
      };
    }
    case "dscr_rate": {
      // ~1.25% spread × 70% LTV × price × 5 yr hold
      return {
        ...range(price * 0.7 * 0.0125 * 5, 0.4),
        basis: "DSCR rate premium (~1.25% over conforming) on a ~70% LTV loan across a 5-year hold.",
        formula: "spread × LTV × price × years",
        kind: "cost",
        isDownside: p === "buyer",
      };
    }
    case "constr_complex": {
      return {
        ...range(price * 0.05, 0.6),
        basis: "Construction overruns and schedule slippage typically consume 5%–15% of project cost; reserve at least 5% of price-equivalent.",
        formula: "~5% × price (contingency)",
        kind: "exposure",
        isDownside: p === "buyer",
      };
    }
    case "bridge_cost": {
      // 1 pt in + 1 pt out + ~3% spread over 18 mo on 70% LTV
      return {
        ...range(price * 0.035, 0.4),
        basis: "Bridge debt: 1–2 points in + out, plus ~3% spread over an 18-month hold, on roughly 70% LTV.",
        formula: "~3.5% × price",
        kind: "cost",
        isDownside: p === "buyer",
      };
    }
    case "mezz_cost": {
      return {
        ...range(price * 0.025, 0.5),
        basis: "Mezzanine / pref pay rate of 10–14% on a ~15% slice of capital stack across a 2-year hold.",
        formula: "~2.5% × price",
        kind: "cost",
        isDownside: p === "buyer",
      };
    }
    case "sba_pg": {
      return {
        ...range(price * 0.1, 0.5),
        basis: "Personal-guaranty exposure on SBA debt — typically 10%–20% of price recoverable post-foreclosure deficiency.",
        formula: "~10% × price (recourse risk)",
        kind: "exposure",
        isDownside: p === "buyer",
      };
    }

    // ── Paralegal rules — distressed / title ─────────────────────────
    case "reo_asis": {
      return {
        ...range(price * 0.03, 0.7),
        basis: "REO sellers refuse repair credits and use override addenda. Reserve ~3% of price for post-close repairs and per-diem late penalties.",
        formula: "~3% × price",
        kind: "exposure",
        isDownside: p === "buyer",
      };
    }
    case "ss_time": {
      if (daysToClose == null) return { ...range(price * 0.005, 0.6), basis: "Short-sale carry while awaiting lender approval (60–180 days).", formula: "~0.5% × price", kind: "exposure", isDownside: true };
      return {
        ...range(price * 0.005, 0.6),
        basis: "Carrying cost (rate-lock extensions, opportunity cost) over a 60–180 day short-sale approval window.",
        formula: "~0.5% × price",
        kind: "exposure",
        isDownside: true,
      };
    }
    case "td_title": {
      return {
        ...range(8_000, 0.5),
        basis: "Quiet-title action to clear redemption / junior-lien clouds — typically 6–18 months and $3k–$10k in legal fees.",
        formula: "Flat ~$3k–$12k legal",
        kind: "cost",
        isDownside: p === "buyer",
      };
    }
    case "quitclaim": {
      return {
        ...range(price * 0.03, 0.7),
        basis: "Quitclaim deed offers no title warranties; if the title policy has any gap, the buyer absorbs the loss. Reserve ~3% of price.",
        formula: "~3% × price",
        kind: "exposure",
        isDownside: p === "buyer",
      };
    }
    case "spec_warr": {
      return {
        ...range(price * 0.005, 0.5),
        basis: "Special warranty deed leaves pre-seller defects uncovered by the deed itself — small residual exposure beyond the title policy.",
        formula: "~0.5% × price",
        kind: "exposure",
        isDownside: p === "buyer",
      };
    }

    // ── Paralegal rules — seller carry / sub-to ──────────────────────
    case "sf_risk": {
      return {
        ...range(price * 0.08, 0.5),
        basis: "Seller-carryback default exposure: foreclosure cost, lost interest, and re-sale discount typically consume 5%–15% of price.",
        formula: "~8% × price",
        kind: "exposure",
        isDownside: p === "seller",
      };
    }
    case "sf_balloon": {
      return {
        ...range(price * 0.05, 0.5),
        basis: "Balloon refinance risk: if rates rise or DSCR slips, buyer faces a forced sale at the balloon date.",
        formula: "~5% × price",
        kind: "exposure",
        isDownside: p === "buyer",
      };
    }
    case "sub2_dos":
    case "wrap_dos": {
      return {
        ...range(price * 0.7, 0.3),
        basis: "Due-on-sale acceleration on a sub-to / wrap can force full payoff of the underlying loan at any time post-close (~70% LTV exposure).",
        formula: "~70% × price (loan balance at risk)",
        kind: "exposure",
        isDownside: true,
      };
    }
    case "assume_qual": {
      return {
        ...range(price * 0.7 * 0.0075, 0.3),
        basis: "Loan assumption fees typically run 0.5%–1% of the assumed balance.",
        formula: "~0.75% × loan balance",
        kind: "cost",
        isDownside: p === "buyer",
      };
    }

    // ── Paralegal rules — tax / regulatory ───────────────────────────
    case "firpta": {
      const pct = 0.15;
      return {
        ...range(price * pct, 0.1),
        basis: "FIRPTA requires the buyer to withhold 15% of gross sales price from a foreign seller and remit to the IRS within 20 days of close.",
        formula: "15% × price",
        kind: "cost",
        isDownside: p === "buyer",
      };
    }
    case "mansion": {
      return {
        ...range(price * 0.01, 0.2),
        basis: "Mansion / additional transfer tax on sales ≥ $1M; brackets escalate in NY above $2M.",
        formula: "~1% × price (base bracket)",
        kind: "cost",
        isDownside: p === "buyer",
      };
    }

    // ── Paralegal rules — commercial diligence ───────────────────────
    case "no_estoppel": {
      return {
        ...range(price * 0.01, 0.6),
        basis: "Without tenant estoppels, lease economics and deposits cannot be confirmed at close — reserve ~1% of price for post-close lease disputes.",
        formula: "~1% × price",
        kind: "exposure",
        isDownside: p === "buyer",
      };
    }

    // ── Paralegal rules — risk-shifting clauses ──────────────────────
    case "toe": {
      return {
        ...range(em > 0 ? em : price * 0.02, 0.2),
        basis: "Time-is-of-essence converts any missed deadline into a material breach with no cure — the full earnest money is at risk.",
        formula: em > 0 ? "= EM" : "~2% × price",
        kind: "exposure",
        isDownside: p === "buyer",
      };
    }
    case "perdiem": {
      const perDiemEst = price * 0.0002; // ~2bps/day proxy
      return {
        ...range(perDiemEst * 14, 0.6),
        basis: "Per-diem late-close penalty over a typical 14-day slip in lender funding.",
        formula: "per-diem × ~14 days",
        kind: "exposure",
        isDownside: p === "buyer",
      };
    }
    case "occ_buyer": {
      return {
        ...range(price * 0.005, 0.6),
        basis: "Seller rent-back exposes the buyer to holdover, damage, and insurance gap risk during occupancy.",
        formula: "~0.5% × price",
        kind: "exposure",
        isDownside: p === "buyer",
      };
    }
    case "rofr_b": {
      return {
        ...range(price * 0.005, 0.6),
        basis: "ROFR exposure: sunk diligence cost (inspection, legal, appraisal) if the holder exercises and takes the property.",
        formula: "~0.5% × price (DD sunk cost)",
        kind: "exposure",
        isDownside: p === "buyer",
      };
    }
    case "hoa_assess": {
      // Pulled from contract value if present; engine passes id only, but we can't see amount here.
      // Skip — accounting line already captures the dollar figure.
      return null;
    }

    default:
      return null;
  }
}

/**
 * Aggregate downside exposure across findings. Caps are excluded from
 * the sum (they bound but do not create new loss). Savings are not
 * netted in — those belong to the negotiation playbook.
 */
export function totalExposure(impacts: (DollarImpact | null | undefined)[]): {
  low: number;
  mid: number;
  high: number;
  count: number;
} {
  let low = 0,
    mid = 0,
    high = 0,
    count = 0;
  for (const i of impacts) {
    if (!i) continue;
    if (i.kind === "exposure" && i.isDownside) {
      low += i.low;
      mid += i.mid;
      high += i.high;
      count++;
    }
  }
  return { low: round(low), mid: round(mid), high: round(high), count };
}

export const fmtUsd = (n: number) =>
  n >= 1000
    ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
    : `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export const fmtImpactRange = (i: DollarImpact): string => {
  if (i.kind === "cap") return `${fmtUsd(i.mid)} cap`;
  if (i.low === i.high) return fmtUsd(i.mid);
  return `${fmtUsd(i.low)}–${fmtUsd(i.high)}`;
};
