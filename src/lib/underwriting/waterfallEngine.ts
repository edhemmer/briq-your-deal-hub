// Waterfall Engine — deterministic European-style distribution waterfall.
// Tiers: (1) Return of Capital, (2) Preferred Return to LP, (3) Catch-up to GP,
// (4) Promote splits at hurdle IRRs.
// No AI. Pure math. Conservative on missing inputs.

import { irr } from "@/lib/underwriting/returnsEngine";

export interface PromoteTier {
  hurdle_irr: number;             // 0.08 = 8% IRR
  gp_split: number;               // GP's share above hurdle (0..1)
  // lp_split is implied: 1 - gp_split
}

export interface WaterfallAssumptions {
  pref_rate: number;              // annual preferred return to LP (compounded), default 0.08
  gp_coinvest_pct: number;        // GP's share of total equity (0..1), default 0.10
  catch_up: boolean;              // whether GP catches up to promote split during pref
  tiers: PromoteTier[];           // promote tiers in ascending hurdle order
}

export const DEFAULT_WATERFALL: WaterfallAssumptions = {
  pref_rate: 0.08,
  gp_coinvest_pct: 0.10,
  catch_up: false,
  tiers: [
    { hurdle_irr: 0.08, gp_split: 0.20 },  // 80/20 above 8% pref
    { hurdle_irr: 0.15, gp_split: 0.30 },  // 70/30 above 15%
    { hurdle_irr: 0.20, gp_split: 0.40 },  // 60/40 above 20%
  ],
};

export interface WaterfallDistribution {
  tier: string;
  total: number;
  to_lp: number;
  to_gp: number;
}

export interface WaterfallResult {
  assumptions: WaterfallAssumptions;
  total_equity: number;
  gp_contribution: number;
  lp_contribution: number;
  hold_years: number;
  total_distributable: number;        // cumulative CF + net sale proceeds
  distributions: WaterfallDistribution[];
  totals: {
    lp_total: number;
    gp_total: number;
    lp_profit: number;                 // lp_total - lp_contribution
    gp_profit: number;
  };
  returns: {
    lp_multiple: number | null;
    gp_multiple: number | null;
    lp_irr: number | null;
    gp_irr: number | null;
    project_irr: number | null;
  };
  warnings: string[];
}

export interface WaterfallInputs {
  total_equity: number;
  annual_cash_flows: number[];        // year-1..year-N operating CF
  net_sale_proceeds: number;          // year-N exit (after debt + costs)
  hold_years: number;
}

export function buildWaterfall(
  inp: WaterfallInputs,
  assumptions: Partial<WaterfallAssumptions> = {}
): WaterfallResult {
  const a: WaterfallAssumptions = { ...DEFAULT_WATERFALL, ...assumptions };
  const warnings: string[] = [];

  const totalEquity = Math.max(0, inp.total_equity);
  const gpContrib = totalEquity * Math.max(0, Math.min(1, a.gp_coinvest_pct));
  const lpContrib = totalEquity - gpContrib;

  if (totalEquity <= 0) warnings.push("No equity in deal — waterfall suppressed.");

  // Total distributable = operating CF + sale proceeds
  const totalCF = inp.annual_cash_flows.reduce((s, c) => s + c, 0);
  const totalDist = totalCF + inp.net_sale_proceeds;

  // ── Tier 1: Return of Capital (pro-rata to GP and LP) ────────────────
  let remaining = Math.max(0, totalDist);
  const t1Total = Math.min(remaining, totalEquity);
  const t1Lp = totalEquity > 0 ? t1Total * (lpContrib / totalEquity) : 0;
  const t1Gp = t1Total - t1Lp;
  remaining -= t1Total;

  // ── Tier 2: Preferred Return to LP (8% compounded on LP contribution) ─
  // Accrued pref = lpContrib * ((1 + pref)^N - 1)
  const accruedPref = lpContrib * (Math.pow(1 + a.pref_rate, inp.hold_years) - 1);
  const t2Total = Math.min(remaining, accruedPref);
  const t2Lp = t2Total;
  const t2Gp = 0;
  remaining -= t2Total;

  const distributions: WaterfallDistribution[] = [
    { tier: "1. Return of Capital", total: t1Total, to_lp: t1Lp, to_gp: t1Gp },
    { tier: `2. Preferred Return (${(a.pref_rate * 100).toFixed(1)}%)`, total: t2Total, to_lp: t2Lp, to_gp: t2Gp },
  ];

  // ── Tier 3: Catch-up to GP (optional) ────────────────────────────────
  // GP gets 100% of next distribution until they've received pro-rata of the
  // promote split on the pref distributed to LP.
  if (a.catch_up && remaining > 0 && a.tiers.length > 0 && t2Lp > 0) {
    const firstPromote = a.tiers[0].gp_split;
    // GP catch-up target: such that gp / (gp + t2Lp) = firstPromote
    const catchUpAmount = (firstPromote / (1 - firstPromote)) * t2Lp;
    const t3Total = Math.min(remaining, catchUpAmount);
    distributions.push({ tier: "3. GP Catch-up", total: t3Total, to_lp: 0, to_gp: t3Total });
    remaining -= t3Total;
  }

  // ── Tier 4+: Promote splits across hurdle IRRs ───────────────────────
  // Allocate remaining distributable across tiers by computing the additional
  // distribution required to push LP IRR through each hurdle. This is the
  // standard "IRR look-back" waterfall.
  const sortedTiers = [...a.tiers].sort((x, y) => x.hurdle_irr - y.hurdle_irr);
  let lpRunning = t1Lp + t2Lp;
  let gpRunning = t1Gp + (a.catch_up && distributions.find(d => d.tier === "3. GP Catch-up") ? distributions.find(d => d.tier === "3. GP Catch-up")!.to_gp : 0);

  for (let i = 0; i < sortedTiers.length && remaining > 0; i++) {
    const tier = sortedTiers[i];
    const nextTier = sortedTiers[i + 1];

    // Solve for additional terminal distribution X such that LP IRR = hurdle.
    // LP CF: -lpContrib at t=0, then 0 mid-years, then (lpRunning + X * lpSplit) at year N.
    // For simplicity, assume distribution happens at exit (year N).
    const lpSplit = 1 - tier.gp_split;
    const targetIrr = nextTier ? nextTier.hurdle_irr : null;

    // X to reach next hurdle (or all remaining if last tier)
    let tierAmount: number;
    if (targetIrr == null) {
      tierAmount = remaining;
    } else {
      // LP IRR at hurdle: lpContrib * (1+r)^N = lpRunning + X * lpSplit
      const lpTargetTerminal = lpContrib * Math.pow(1 + targetIrr, inp.hold_years);
      const xToHurdle = lpSplit > 0 ? Math.max(0, (lpTargetTerminal - lpRunning) / lpSplit) : 0;
      tierAmount = Math.min(remaining, xToHurdle);
    }

    const tierToLp = tierAmount * lpSplit;
    const tierToGp = tierAmount * tier.gp_split;
    distributions.push({
      tier: `${distributions.length + 1}. Promote ≥${(tier.hurdle_irr * 100).toFixed(1)}% (LP/GP ${(lpSplit * 100).toFixed(0)}/${(tier.gp_split * 100).toFixed(0)})`,
      total: tierAmount,
      to_lp: tierToLp,
      to_gp: tierToGp,
    });
    lpRunning += tierToLp;
    gpRunning += tierToGp;
    remaining -= tierAmount;
  }

  const lpTotal = distributions.reduce((s, d) => s + d.to_lp, 0);
  const gpTotal = distributions.reduce((s, d) => s + d.to_gp, 0);

  // ── Returns: terminal-distribution IRR (operating CF assumed pro-rata) ─
  // Approximation: split annual cash flows pro-rata by contribution; terminal
  // distribution carries the promote.
  const lpProRata = totalEquity > 0 ? lpContrib / totalEquity : 0;
  const gpProRata = 1 - lpProRata;
  const lpAnnualCF = inp.annual_cash_flows.map(cf => cf * lpProRata);
  const gpAnnualCF = inp.annual_cash_flows.map(cf => cf * gpProRata);

  const lpCFSeries = [-lpContrib];
  const gpCFSeries = [-gpContrib];
  for (let y = 0; y < inp.hold_years; y++) {
    const isLast = y === inp.hold_years - 1;
    // Terminal extra (post-pro-rata) for LP and GP = waterfall total - annual CF share
    if (isLast) {
      const lpTerminal = lpTotal - lpAnnualCF.reduce((s, c) => s + c, 0);
      const gpTerminal = gpTotal - gpAnnualCF.reduce((s, c) => s + c, 0);
      lpCFSeries.push(lpAnnualCF[y] + Math.max(0, lpTerminal));
      gpCFSeries.push(gpAnnualCF[y] + Math.max(0, gpTerminal));
    } else {
      lpCFSeries.push(lpAnnualCF[y]);
      gpCFSeries.push(gpAnnualCF[y]);
    }
  }

  const projectCFSeries = [-totalEquity, ...inp.annual_cash_flows];
  projectCFSeries[projectCFSeries.length - 1] += inp.net_sale_proceeds;

  return {
    assumptions: a,
    total_equity: totalEquity,
    gp_contribution: gpContrib,
    lp_contribution: lpContrib,
    hold_years: inp.hold_years,
    total_distributable: totalDist,
    distributions,
    totals: {
      lp_total: lpTotal,
      gp_total: gpTotal,
      lp_profit: lpTotal - lpContrib,
      gp_profit: gpTotal - gpContrib,
    },
    returns: {
      lp_multiple: lpContrib > 0 ? lpTotal / lpContrib : null,
      gp_multiple: gpContrib > 0 ? gpTotal / gpContrib : null,
      lp_irr: irr(lpCFSeries),
      gp_irr: irr(gpCFSeries),
      project_irr: irr(projectCFSeries),
    },
    warnings,
  };
}
