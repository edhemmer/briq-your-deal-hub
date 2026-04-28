/**
 * BRIQ v1.6.3 — Global Market Outlook Engine (3–5 Year Forward Intelligence)
 *
 * Deterministic, source-aware, confidence-graded forward outlook.
 * Uses only defensible public data signals. Returns null for missing data — never estimates.
 *
 * Architecture: market_conditions (existing) → marketOutlookEngine → CanonicalAnalysisOutput
 */

// ── Types ──────────────────────────────────────────────────────────────

export type MigrationTrend = "inflow" | "outflow" | "stable";
export type SupplyPipelineRisk = "low" | "moderate" | "high";
export type OutlookLabel = "strong_growth" | "stable" | "declining";
export type OutlookConfidence = "low" | "medium" | "high";

export interface OutlookSources {
  population?: string;
  jobs?: string;
  rent?: string;
  migration?: string;
  supply?: string;
}

export interface MarketOutlook {
  population_trend_pct: number | null;
  job_growth_trend_pct: number | null;
  rent_growth_trend_pct: number | null;
  migration_trend: MigrationTrend | null;
  supply_pipeline_risk: SupplyPipelineRisk | null;

  outlook_score: number;
  outlook_label: OutlookLabel;

  signals_used_count: number;
  data_confidence: OutlookConfidence;

  sources: OutlookSources;
  last_updated_at: string;

  investor_guidance: string;
}

// ── Input (from existing market_conditions + NormalizedDealState) ──────

export interface MarketOutlookInput {
  /** Population growth rate (annual %) — source: Census 5-year trend */
  population_growth_rate: number | null;
  /** Job growth rate (annual %) — source: BLS regional employment */
  job_growth_rate: number | null;
  /** Rent growth 36-month (%) — source: HUD dataset */
  rent_growth_36mo: number | null;
  /** Rent growth 12-month (%) — proxy for momentum */
  rent_growth_12mo: number | null;
  /** Price growth 36-month (%) — supplementary signal */
  price_growth_36mo: number | null;
  /** Absorption rate (%) — used to derive supply pipeline risk */
  absorption_rate: number | null;
  /** Months of supply — used to derive supply pipeline risk */
  months_of_supply: number | null;
  /** Inventory level — supporting signal for supply risk */
  inventory_level: number | null;
}

// ── Signal Weights ─────────────────────────────────────────────────────

const WEIGHTS = {
  population: 25,
  jobs: 25,
  rent: 20,
  migration: 15,
  supply: 15, // negative weight applied internally
} as const;

// ── Helpers ────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function isPresent(v: number | null | undefined): v is number {
  return v != null && Number.isFinite(v);
}

// ── Signal Derivation (strict null handling) ───────────────────────────

/**
 * Derive population trend from Census-style annual rate.
 * Returns null if data missing. No estimation.
 */
function derivePopulationTrend(rate: number | null): number | null {
  if (!isPresent(rate)) return null;
  return rate;
}

/**
 * Derive job growth trend from BLS-style annual rate.
 * Returns null if data missing. No estimation.
 */
function deriveJobTrend(rate: number | null): number | null {
  if (!isPresent(rate)) return null;
  return rate;
}

/**
 * Derive rent growth trend from HUD 36-month data.
 * Annualized from 36-month figure.
 * Returns null if data missing. No estimation.
 */
function deriveRentTrend(growth36mo: number | null): number | null {
  if (!isPresent(growth36mo)) return null;
  // Annualize: approximate compound annual from 3-year cumulative
  return growth36mo / 3;
}

/**
 * Derive migration trend from population + job signals.
 * Only if both are available. No guessing.
 */
function deriveMigrationTrend(
  popRate: number | null,
  jobRate: number | null,
  rentGrowth12mo: number | null
): MigrationTrend | null {
  // Need at least 2 of 3 signals
  const signals = [popRate, jobRate, rentGrowth12mo].filter(isPresent);
  if (signals.length < 2) return null;

  const avg = signals.reduce((a, b) => a + b, 0) / signals.length;
  if (avg >= 1.5) return "inflow";
  if (avg <= -0.5) return "outflow";
  return "stable";
}

/**
 * Derive supply pipeline risk from inventory signals.
 * Uses absorption rate + months of supply as proxy.
 * Returns null if insufficient data.
 */
function deriveSupplyPipelineRisk(
  absorptionRate: number | null,
  monthsOfSupply: number | null,
  inventoryLevel: number | null
): SupplyPipelineRisk | null {
  // Need at least one inventory signal
  if (!isPresent(monthsOfSupply) && !isPresent(absorptionRate)) return null;

  let riskScore = 0;
  let signalCount = 0;

  if (isPresent(monthsOfSupply)) {
    signalCount++;
    if (monthsOfSupply >= 7) riskScore += 2;
    else if (monthsOfSupply >= 5) riskScore += 1;
    else riskScore += 0;
  }

  if (isPresent(absorptionRate)) {
    signalCount++;
    if (absorptionRate < 15) riskScore += 2; // low absorption = high risk
    else if (absorptionRate < 30) riskScore += 1;
    else riskScore += 0;
  }

  if (isPresent(inventoryLevel)) {
    signalCount++;
    if (inventoryLevel >= 3000) riskScore += 1;
  }

  const avgRisk = riskScore / signalCount;
  if (avgRisk >= 1.5) return "high";
  if (avgRisk >= 0.75) return "moderate";
  return "low";
}

// ── Score individual signals (0–100 per signal) ────────────────────────

function scorePopulation(trend: number | null): number | null {
  if (!isPresent(trend)) return null;
  // 2%+ = excellent, 0% = neutral, negative = weak
  if (trend >= 2) return 90;
  if (trend >= 1.5) return 80;
  if (trend >= 1) return 70;
  if (trend >= 0.5) return 55;
  if (trend >= 0) return 40;
  if (trend >= -1) return 25;
  return 10;
}

function scoreJobs(trend: number | null): number | null {
  if (!isPresent(trend)) return null;
  if (trend >= 3) return 95;
  if (trend >= 2) return 80;
  if (trend >= 1) return 65;
  if (trend >= 0) return 40;
  if (trend >= -1) return 25;
  return 10;
}

function scoreRent(trend: number | null): number | null {
  if (!isPresent(trend)) return null;
  // Annualized rent growth
  if (trend >= 5) return 90;
  if (trend >= 3) return 75;
  if (trend >= 1.5) return 60;
  if (trend >= 0) return 40;
  if (trend >= -2) return 20;
  return 10;
}

function scoreMigration(trend: MigrationTrend | null): number | null {
  if (trend == null) return null;
  if (trend === "inflow") return 85;
  if (trend === "stable") return 50;
  return 15; // outflow
}

function scoreSupplyRisk(risk: SupplyPipelineRisk | null): number | null {
  if (risk == null) return null;
  // Inverted: low risk = high score
  if (risk === "low") return 80;
  if (risk === "moderate") return 45;
  return 15; // high
}

// ── Composite Scoring ──────────────────────────────────────────────────

interface ScoredSignal {
  key: keyof typeof WEIGHTS;
  score: number;
  weight: number;
}

function computeOutlookScore(signals: ScoredSignal[]): {
  score: number;
  signalsUsed: number;
} {
  if (signals.length === 0) {
    return { score: 50, signalsUsed: 0 }; // neutral baseline
  }

  if (signals.length === 1) {
    return { score: 50, signalsUsed: 1 }; // neutral baseline per spec
  }

  const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
  const weightedSum = signals.reduce((sum, s) => {
    // Supply risk weight is subtracted (penalty for high supply risk)
    if (s.key === "supply") {
      // Invert: low score on supply = penalty
      return sum + (100 - s.score) * (s.weight / totalWeight) * -1 + s.weight / totalWeight * 50;
    }
    return sum + s.score * (s.weight / totalWeight);
  }, 0);

  return {
    score: clamp(Math.round(weightedSum), 0, 100),
    signalsUsed: signals.length,
  };
}

// ── Confidence ─────────────────────────────────────────────────────────

function deriveConfidence(signalsUsed: number): OutlookConfidence {
  if (signalsUsed >= 4) return "high";
  if (signalsUsed >= 2) return "medium";
  return "low";
}

// ── Label ──────────────────────────────────────────────────────────────

function deriveLabel(score: number): OutlookLabel {
  if (score >= 70) return "strong_growth";
  if (score >= 40) return "stable";
  return "declining";
}

// ── Investor Guidance (strict 2-line max) ──────────────────────────────

function deriveGuidance(label: OutlookLabel): string {
  switch (label) {
    case "strong_growth":
      return "Forward signals indicate expansion potential. Population, employment, and rent trends support growth positioning.";
    case "stable":
      return "Market outlook is balanced. Signals do not indicate strong directional movement over the forward period.";
    case "declining":
      return "Weakening forward signals detected. Employment, population, or rent trends suggest caution in this market.";
  }
}

// ── Source Tags ─────────────────────────────────────────────────────────

function buildSources(input: MarketOutlookInput): OutlookSources {
  const sources: OutlookSources = {};
  if (isPresent(input.population_growth_rate)) sources.population = "Census Bureau (5-Year ACS)";
  if (isPresent(input.job_growth_rate)) sources.jobs = "Bureau of Labor Statistics (BLS)";
  if (isPresent(input.rent_growth_36mo)) sources.rent = "HUD Fair Market Rent";
  if (isPresent(input.population_growth_rate) && isPresent(input.job_growth_rate)) {
    sources.migration = "Derived (Census + BLS Composite)";
  }
  if (isPresent(input.months_of_supply) || isPresent(input.absorption_rate)) {
    sources.supply = "Market Inventory Proxy";
  }
  return sources;
}

// ── Main Engine Function ───────────────────────────────────────────────

/**
 * Evaluate 3–5 year market outlook from existing market condition signals.
 * Deterministic. Source-aware. Strict null handling.
 *
 * Returns null if no usable signals exist.
 */
export function evaluateMarketOutlook(input: MarketOutlookInput): MarketOutlook | null {
  // Derive individual trends
  const populationTrend = derivePopulationTrend(input.population_growth_rate);
  const jobTrend = deriveJobTrend(input.job_growth_rate);
  const rentTrend = deriveRentTrend(input.rent_growth_36mo);
  const migrationTrend = deriveMigrationTrend(
    input.population_growth_rate,
    input.job_growth_rate,
    input.rent_growth_12mo
  );
  const supplyRisk = deriveSupplyPipelineRisk(
    input.absorption_rate,
    input.months_of_supply,
    input.inventory_level
  );

  // Score each signal
  const popScore = scorePopulation(populationTrend);
  const jobScore = scoreJobs(jobTrend);
  const rentScore = scoreRent(rentTrend);
  const migScore = scoreMigration(migrationTrend);
  const supScore = scoreSupplyRisk(supplyRisk);

  // Collect available scored signals
  const scoredSignals: ScoredSignal[] = [];
  if (popScore != null) scoredSignals.push({ key: "population", score: popScore, weight: WEIGHTS.population });
  if (jobScore != null) scoredSignals.push({ key: "jobs", score: jobScore, weight: WEIGHTS.jobs });
  if (rentScore != null) scoredSignals.push({ key: "rent", score: rentScore, weight: WEIGHTS.rent });
  if (migScore != null) scoredSignals.push({ key: "migration", score: migScore, weight: WEIGHTS.migration });
  if (supScore != null) scoredSignals.push({ key: "supply", score: supScore, weight: WEIGHTS.supply });

  // If zero signals → return null (no outlook possible)
  if (scoredSignals.length === 0) return null;

  const { score, signalsUsed } = computeOutlookScore(scoredSignals);
  const confidence = deriveConfidence(signalsUsed);
  const label = deriveLabel(score);

  return {
    population_trend_pct: populationTrend,
    job_growth_trend_pct: jobTrend,
    rent_growth_trend_pct: rentTrend,
    migration_trend: migrationTrend,
    supply_pipeline_risk: supplyRisk,

    outlook_score: score,
    outlook_label: label,

    signals_used_count: signalsUsed,
    data_confidence: confidence,

    sources: buildSources(input),
    last_updated_at: new Date().toISOString(),

    investor_guidance: deriveGuidance(label),
  };
}
