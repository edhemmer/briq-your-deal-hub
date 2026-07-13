import type { DealFacts } from "./types";

export function portfolioMetrics(deals: DealFacts[]) {
  const assets = deals.filter((deal) => deal.status === "closed");
  const value = sum(assets.map((deal) => deal.arv ?? deal.listPrice ?? 0));
  const basis = sum(assets.map((deal) => (deal.listPrice ?? 0) + (deal.rehabBudget ?? 0)));
  const annualRent = sum(assets.map((deal) => (deal.monthlyRent ?? 0) * 12));
  const annualExpense = sum(assets.map((deal) => (deal.annualTaxes ?? 0) + (deal.annualInsurance ?? 0)));
  return {
    count: assets.length,
    estimatedValue: value,
    investedBasis: basis,
    estimatedEquity: Math.max(0, value - basis * 0.8),
    annualRent,
    annualExpense,
    annualNet: annualRent - annualExpense,
  };
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
