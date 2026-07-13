import { getStrategy, strategyCatalog } from "./strategyCatalog";
import type { DealAnalysis, DealFacts, StrategyScore } from "./types";

const REQUIRED_CORE: Array<keyof DealFacts> = ["address", "listPrice", "annualTaxes", "annualInsurance"];

export function analyzeDeal(deal: DealFacts): DealAnalysis {
  const scores = strategyCatalog.map((strategy) => scoreStrategy(deal, strategy.id));
  const primary = scores.find((score) => score.strategyId === deal.strategyId) ?? scores[0];
  const missing = missingFields(deal);
  const readiness = clamp(100 - missing.length * 12 - (deal.photoUrls.length + deal.uploadedPhotoNames.length === 0 ? 8 : 0));
  const confidence = clamp(Math.round((primary.confidence + readiness) / 2));
  const affordability = calculateAffordability(deal);
  const decision = confidence >= 78 && readiness >= 74 ? "Visit" : confidence >= 55 ? "Research first" : "Do not visit yet";

  return {
    decision,
    confidence,
    readiness,
    affordability,
    monthlyPayment: estimateMonthlyPayment(deal),
    estimatedCashNeeded: estimateCashNeeded(deal),
    primaryStrategy: primary,
    strategyScores: scores.sort((a, b) => b.score - a.score),
    nextActions: nextActions(deal, missing),
    evidence: evidence(deal),
    missing,
  };
}

export function scoreStrategy(deal: DealFacts, strategyId: string): StrategyScore {
  const strategy = getStrategy(strategyId) ?? strategyCatalog[0];
  const missing = missingFields(deal);
  const why: string[] = [];
  const risks: string[] = [];
  let score = 50;

  if (deal.address) {
    score += 8;
    why.push("Property has an identifiable address.");
  }
  if (deal.listPrice) {
    score += 10;
    why.push("Purchase price is available for underwriting.");
  }
  if (deal.annualTaxes) {
    score += 6;
    why.push("Tax information is available.");
  }
  if (deal.photoUrls.length || deal.uploadedPhotoNames.length) {
    score += 8;
    why.push("Photos are available for condition review.");
  }

  if (strategy.category === "live_in") {
    if ((deal.beds ?? 0) >= 3) score += 6;
    if ((deal.baths ?? 0) >= 2) score += 6;
    if (/ranch|basement|garage/i.test(deal.sourceText ?? deal.notes.join(" "))) score += 4;
    if (!deal.hoaMonthly) risks.push("HOA cost and restrictions need confirmation when applicable.");
  }

  if (strategy.category === "rental") {
    if (deal.monthlyRent) score += 14;
    else risks.push("Rent support is missing.");
    if (deal.annualInsurance) score += 5;
    else risks.push("Annual insurance quote is missing.");
  }

  if (strategy.category === "renovation") {
    if (deal.rehabBudget) score += 12;
    else risks.push("Renovation scope and budget are missing.");
    if (deal.arv) score += 10;
    else risks.push("After repair value support is missing.");
  }

  if (strategy.category === "financing" && !deal.downPayment) {
    risks.push("Capital stack and financing terms are incomplete.");
  }

  if (missing.length > 0) score -= missing.length * 4;
  const confidence = clamp(score - risks.length * 5);
  const recommendation = score >= 78 ? "Strong fit" : score >= 62 ? "Possible fit" : score >= 45 ? "Needs verification" : "Weak fit";

  return {
    strategyId: strategy.id,
    name: strategy.name,
    score: clamp(score),
    confidence,
    recommendation,
    why: why.length ? why : ["Needs more source-backed facts before BRIX can explain fit."],
    risks,
    missing,
  };
}

export function missingFields(deal: DealFacts) {
  const labels: string[] = [];
  for (const field of REQUIRED_CORE) {
    if (!deal[field]) labels.push(label(field));
  }
  const strategy = getStrategy(deal.strategyId);
  if (strategy?.category === "rental" && !deal.monthlyRent) labels.push("Monthly rent support");
  if (strategy?.category === "rental" && !deal.annualInsurance) labels.push("Annual insurance");
  if (strategy?.category === "renovation" && !deal.rehabBudget) labels.push("Rehab budget");
  if (strategy?.category === "renovation" && !deal.arv) labels.push("After repair value");
  return [...new Set(labels)];
}

function nextActions(deal: DealFacts, missing: string[]) {
  const actions = missing.slice(0, 4).map((item) => `Add or verify ${item.toLowerCase()}.`);
  if (!deal.photoUrls.length && !deal.uploadedPhotoNames.length) actions.push("Add listing or field photos for condition review.");
  if (!deal.county) actions.push("Confirm county and tax source.");
  return actions.length ? actions : ["Compare strategy scores and decide whether to visit, pass, or pursue."];
}

function evidence(deal: DealFacts) {
  const items = [];
  if (deal.sourceUrl) items.push("Listing URL saved.");
  if (deal.listPrice) items.push(`Price captured: ${formatCurrency(deal.listPrice)}.`);
  if (deal.annualTaxes) items.push(`Annual taxes captured: ${formatCurrency(deal.annualTaxes)}.`);
  if (deal.beds || deal.baths) items.push(`Beds/baths captured: ${deal.beds ?? "?"}/${deal.baths ?? "?"}.`);
  return items.length ? items : ["No source-backed facts have been captured yet."];
}

function estimateMonthlyPayment(deal: DealFacts) {
  if (!deal.listPrice) return undefined;
  const down = deal.downPayment ?? Math.round(deal.listPrice * 0.2);
  const principal = Math.max(deal.listPrice - down, 0);
  const rate = (deal.interestRate ?? 7) / 100 / 12;
  const months = (deal.loanYears ?? 30) * 12;
  const debt = rate > 0 ? principal * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1) : principal / months;
  return Math.round(debt + (deal.annualTaxes ?? 0) / 12 + (deal.annualInsurance ?? 0) / 12 + (deal.hoaMonthly ?? 0));
}

function estimateCashNeeded(deal: DealFacts) {
  if (!deal.listPrice) return undefined;
  return Math.round((deal.downPayment ?? deal.listPrice * 0.2) + deal.listPrice * 0.025 + (deal.rehabBudget ?? 0));
}

function calculateAffordability(deal: DealFacts) {
  if (!deal.listPrice) return 0;
  const cash = estimateCashNeeded(deal) ?? 0;
  const down = deal.downPayment ?? deal.listPrice * 0.2;
  return clamp(Math.round(100 - Math.max(0, cash - down) / Math.max(deal.listPrice, 1) * 100));
}

function label(field: string) {
  if (field === "listPrice") return "Purchase price";
  if (field === "annualTaxes") return "Annual taxes";
  if (field === "annualInsurance") return "Annual insurance";
  return field.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function formatCurrency(value?: number) {
  if (value === undefined) return "Missing";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}
