// Sources & Uses Engine — deterministic capital stack composition.
// No AI. Pure math. Conservative-bias on missing inputs.

import type { DealInput, AnalysisResult } from "@/lib/dealAnalysisEngine";

export interface CapitalSlice {
  name: string;
  amount: number;
  pct_of_total: number;
  category: "senior_debt" | "mezz_debt" | "preferred_equity" | "gp_equity" | "lp_equity";
}

export interface UseRow {
  name: string;
  amount: number;
  pct_of_total: number;
}

export interface CapitalStackInput {
  gp_coinvest_pct: number;        // share of total equity contributed by GP (0..1)
  mezz_amount: number;            // optional mezzanine layer
  pref_equity_amount: number;     // optional preferred-equity layer
}

export const DEFAULT_CAPITAL_STACK: CapitalStackInput = {
  gp_coinvest_pct: 0.10,
  mezz_amount: 0,
  pref_equity_amount: 0,
};

export interface SourcesUsesResult {
  uses: UseRow[];
  sources: CapitalSlice[];
  total_uses: number;
  total_sources: number;
  ltv: number;                    // senior loan / purchase price
  ltc: number;                    // senior loan / total uses
  combined_ltv: number;           // (senior + mezz) / purchase price
  combined_ltc: number;           // (senior + mezz + pref) / total uses
  total_equity: number;
  gp_equity: number;
  lp_equity: number;
  balanced: boolean;              // sources match uses (within $1)
  warnings: string[];
}

export function buildSourcesUses(
  input: DealInput,
  analysis: AnalysisResult,
  stack: Partial<CapitalStackInput> = {}
): SourcesUsesResult {
  const s: CapitalStackInput = { ...DEFAULT_CAPITAL_STACK, ...stack };
  const warnings: string[] = [];

  const purchasePrice = input.purchase_price || 0;
  const closingCosts = input.closing_costs || 0;
  const rehab = input.rehab_cost || 0;
  const contingency = input.rehab_contingency || 0;

  const uses: UseRow[] = [
    { name: "Purchase Price", amount: purchasePrice, pct_of_total: 0 },
    { name: "Closing Costs", amount: closingCosts, pct_of_total: 0 },
    { name: "Rehab / CapEx", amount: rehab, pct_of_total: 0 },
    { name: "Rehab Contingency", amount: contingency, pct_of_total: 0 },
  ].filter(u => u.amount > 0);

  const totalUses = uses.reduce((sum, u) => sum + u.amount, 0);
  uses.forEach(u => { u.pct_of_total = totalUses > 0 ? u.amount / totalUses : 0; });

  const seniorLoan = analysis.financing.loan_amount;
  const mezz = Math.max(0, s.mezz_amount);
  const pref = Math.max(0, s.pref_equity_amount);
  const totalDebtAndPref = seniorLoan + mezz + pref;
  const totalEquityRequired = Math.max(0, totalUses - totalDebtAndPref);

  if (totalEquityRequired <= 0 && totalUses > 0) {
    warnings.push("Debt + preferred equity exceeds total uses — over-leveraged structure.");
  }

  const gpEquity = totalEquityRequired * Math.max(0, Math.min(1, s.gp_coinvest_pct));
  const lpEquity = totalEquityRequired - gpEquity;

  const sources: CapitalSlice[] = [];
  if (seniorLoan > 0) sources.push({ name: "Senior Debt", amount: seniorLoan, pct_of_total: 0, category: "senior_debt" });
  if (mezz > 0) sources.push({ name: "Mezzanine Debt", amount: mezz, pct_of_total: 0, category: "mezz_debt" });
  if (pref > 0) sources.push({ name: "Preferred Equity", amount: pref, pct_of_total: 0, category: "preferred_equity" });
  if (gpEquity > 0) sources.push({ name: "GP Co-Invest", amount: gpEquity, pct_of_total: 0, category: "gp_equity" });
  if (lpEquity > 0) sources.push({ name: "LP Equity", amount: lpEquity, pct_of_total: 0, category: "lp_equity" });

  const totalSources = sources.reduce((sum, c) => sum + c.amount, 0);
  sources.forEach(c => { c.pct_of_total = totalSources > 0 ? c.amount / totalSources : 0; });

  const ltv = purchasePrice > 0 ? seniorLoan / purchasePrice : 0;
  const ltc = totalUses > 0 ? seniorLoan / totalUses : 0;
  const combinedLtv = purchasePrice > 0 ? (seniorLoan + mezz) / purchasePrice : 0;
  const combinedLtc = totalUses > 0 ? (seniorLoan + mezz + pref) / totalUses : 0;

  if (ltv > 0.80) warnings.push(`Senior LTV ${(ltv * 100).toFixed(1)}% exceeds 80% — agency financing unlikely.`);
  if (combinedLtv > 0.90) warnings.push(`Combined LTV ${(combinedLtv * 100).toFixed(1)}% exceeds 90% — high refinance risk.`);

  return {
    uses,
    sources,
    total_uses: totalUses,
    total_sources: totalSources,
    ltv,
    ltc,
    combined_ltv: combinedLtv,
    combined_ltc: combinedLtc,
    total_equity: totalEquityRequired,
    gp_equity: gpEquity,
    lp_equity: lpEquity,
    balanced: Math.abs(totalSources - totalUses) < 1,
    warnings,
  };
}
