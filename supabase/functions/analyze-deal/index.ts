import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { deal = {} } = await req.json();
    const facts = deal.facts ?? deal;
    const missing = ["address", "listPrice", "annualTaxes", "annualInsurance"].filter((key) => !facts[key] && !deal[key]);
    const strategy = deal.strategy_id ?? deal.strategyId ?? facts.strategyId ?? "owner_occupant";
    if (strategy !== "owner_occupant" && !facts.monthlyRent) missing.push("monthlyRent");
    const score = Math.max(0, Math.min(100, 86 - missing.length * 12));
    const strategyComparison = compareStrategies(strategy, facts, missing);
    return json({
      decision: score >= 78 ? "Visit" : score >= 55 ? "Research first" : "Do not visit yet",
      confidence: score,
      readiness: Math.max(0, 100 - missing.length * 15),
      missing,
      next_actions: missing.map((item) => `Add or verify ${item}.`),
      key_risks: missing.map((item) => `${item} is not verified.`),
      what_must_be_true: whatMustBeTrue(strategy),
      failure_scenarios: failureScenarios(strategy),
      strategy_comparison: strategyComparison,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to analyze deal." }, 400);
  }
});

function compareStrategies(selected: string, facts: Record<string, unknown>, missing: string[]) {
  const candidates = ["owner_occupant", "buy_and_hold", "long_term_rental", "brrrr", "fix_and_flip", "seller_finance", "hold", "sell"]
    .map((strategy) => ({ strategy, score: scoreStrategy(strategy, facts, missing) }))
    .sort((a, b) => b.score - a.score);
  const selectedScore = candidates.find((candidate) => candidate.strategy === selected) ?? { strategy: selected, score: scoreStrategy(selected, facts, missing) };
  const best = candidates[0] ?? selectedScore;
  const gap = Math.max(0, best.score - selectedScore.score);
  return {
    selected: selectedScore,
    best,
    score_gap: gap,
    headline: gap <= 3 ? `${label(selectedScore.strategy)} is currently the strongest fit.` : `${label(best.strategy)} may fit better than ${label(selectedScore.strategy)}.`,
    verification: verificationFor(best.strategy),
  };
}

function scoreStrategy(strategy: string, facts: Record<string, unknown>, missing: string[]) {
  let score = 50;
  if (facts.address || facts.sourceText) score += 8;
  if (facts.listPrice) score += 10;
  if (facts.annualTaxes) score += 6;
  if (Array.isArray(facts.photoUrls) && facts.photoUrls.length > 0) score += 8;
  if (strategy === "owner_occupant") {
    if (Number(facts.beds ?? 0) >= 3) score += 6;
    if (Number(facts.baths ?? 0) >= 2) score += 6;
  }
  if (["buy_and_hold", "long_term_rental", "brrrr"].includes(strategy)) score += facts.monthlyRent ? 14 : -8;
  if (["brrrr", "fix_and_flip"].includes(strategy)) {
    score += facts.rehabBudget ? 12 : -8;
    score += facts.arv ? 10 : -8;
  }
  return Math.max(0, Math.min(100, Math.round(score - missing.length * 3)));
}

function whatMustBeTrue(strategy: string) {
  if (strategy === "owner_occupant") return ["Monthly payment, commute, HOA rules, condition, and resale risk must fit the household."];
  if (["brrrr", "fix_and_flip"].includes(strategy)) return ["Rehab budget, timeline, after repair value, and exit demand must verify."];
  return ["Rent support, expenses, insurance, taxes, reserves, and financing must verify."];
}

function failureScenarios(strategy: string) {
  if (strategy === "owner_occupant") return ["Payment stress", "HOA or parking restriction", "Inspection reveals condition beyond tolerance."];
  if (["brrrr", "fix_and_flip"].includes(strategy)) return ["Rehab overrun", "ARV miss", "Permit or resale delay."];
  return ["Rent overstated", "Insurance/tax shock", "Vacancy or repairs exceed reserves."];
}

function verificationFor(strategy: string) {
  if (strategy === "owner_occupant") return ["County tax record", "Insurance quote", "HOA rules", "Area convenience map", "Inspection"];
  if (["brrrr", "fix_and_flip"].includes(strategy)) return ["Rehab scope", "Contractor estimate", "ARV comps", "Permit requirements", "Exit timeline"];
  return ["Rent comps", "Taxes", "Insurance", "Financing", "Vacancy and maintenance assumptions"];
}

function label(strategy: string) {
  return strategy.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()).replace("Brrrr", "BRRRR");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
