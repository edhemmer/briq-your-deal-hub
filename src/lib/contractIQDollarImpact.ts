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
