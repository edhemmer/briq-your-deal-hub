import type {
  DebtScheduleProjection,
  DebtTranche,
  EquityTranche,
  FinancingFeasibilityStatus,
  FinancingMetricKey,
  FinancingProjection,
  FinancingScenarioComparisonInput,
  FinancingScenarioComparisonResult,
  FinancingScenarioComparisonRow,
  FinancingScenarioDimension,
  FinancingScenarioTradeoff,
} from "./financeIQ";
import {
  FINANCEIQ_SCENARIO_COMPARISON_CONTRACT_VERSION,
  FINANCEIQ_SCENARIO_COMPARISON_RESULT_VERSION,
} from "./financeIQ";
import type { AuthoritativeMetricValue } from "./financeIQConstraints";

export const FINANCEIQ_SCENARIO_COMPARISON_VERSION = "financeiq-scenario-comparison-v1" as const;

export const FINANCEIQ_SUPPORTED_COMPARISON_DIMENSIONS: readonly FinancingScenarioDimension[] = [
  "feasibility",
  "debt_service",
  "cumulative_interest",
  "balloon_exposure",
  "ltv",
  "dscr",
  "fees",
  "rate_type",
  "prepayment",
  "recourse",
  "interest_only",
  "conditions",
  "covenants",
  "complexity",
  "equity_terms",
] as const;

type Candidate = {
  projection: FinancingProjection;
  debtSchedules?: readonly DebtScheduleProjection[];
  debtTranches?: readonly DebtTranche[];
  equityTranches?: readonly EquityTranche[];
  authoritativeMetrics?: readonly AuthoritativeMetricValue[];
};

export type FinancingScenarioComparisonRequest = {
  input: FinancingScenarioComparisonInput;
  candidates: readonly Candidate[];
  comparedAt: string;
};

export function compareFinancingScenarios(request: FinancingScenarioComparisonRequest): FinancingScenarioComparisonResult {
  validateInput(request);
  const dimensions = [...request.input.requestedDimensions].sort();
  const rows = request.candidates.map((candidate) => buildRow(request.input, candidate));
  const orderedRows = [...rows].sort(compareRows);
  orderedRows.forEach((row, index) => {
    row.deterministicOrder = index + 1;
  });
  const excludedStructures = orderedRows
    .filter((row) => !row.isWinnerEligible)
    .map((row) => ({ financingStructureId: row.financingStructureId, reasonCode: row.exclusionReason ?? "not_winner_eligible" }));
  const eligible = orderedRows.filter((row) => row.isWinnerEligible);
  const tradeoffs = buildTradeoffs(dimensions, eligible);
  const missingComparisonInputs = [...new Set(orderedRows.flatMap((row) => row.missingInputs))].sort();
  const blockingIssues = eligible.length === 0 ? ["comparison_requires_at_least_one_current_eligible_structure"] : [];
  const top = eligible[0];
  const second = eligible[1];
  const hasClearWinner = Boolean(top && ((second && isClearWinner(top, second, tradeoffs)) || (eligible.length === 1 && excludedStructures.length > 0)));
  const status = orderedRows.length < 2
    ? "insufficient_options"
    : hasClearWinner
      ? "clear_winner"
      : tradeoffs.some((tradeoff) => tradeoff.state !== "comparable")
        ? "not_comparable"
        : "no_clear_winner";
  const staleReasons = orderedRows.flatMap((row) => row.reasonCodes.filter((code) => code.startsWith("stale_")));
  const basis = {
    comparisonVersion: FINANCEIQ_SCENARIO_COMPARISON_VERSION,
    workspaceId: request.input.workspaceId,
    dealId: request.input.dealId,
    comparedAt: request.comparedAt,
    comparisonEffectiveAt: request.input.comparisonEffectiveAt,
    dimensionsEvaluated: dimensions,
    status,
    clearWinnerFinancingStructureId: hasClearWinner ? top?.financingStructureId : undefined,
    noDecisionReason: hasClearWinner ? undefined : noDecisionReason(status, tradeoffs, blockingIssues),
    orderedStructures: orderedRows,
    tradeoffs,
    excludedStructures,
    missingComparisonInputs,
    blockingIssues,
    stale: staleReasons.length > 0,
    staleReasons: [...new Set(staleReasons)].sort(),
  } satisfies Omit<FinancingScenarioComparisonResult, "contractVersion" | "resultVersion" | "resultHash">;

  return deepFreeze({
    contractVersion: FINANCEIQ_SCENARIO_COMPARISON_CONTRACT_VERSION,
    resultVersion: FINANCEIQ_SCENARIO_COMPARISON_RESULT_VERSION,
    ...basis,
    resultHash: stableHash(basis),
  });
}

export function assertFinanceIQScenarioComparisonDoesNotCalculateUnsupportedMetrics(sourceText: string): void {
  const inspectableSource = sourceText.replace(/const forbidden = \[[\s\S]*?\];/, "");
  const forbidden = [
    /loan_amount\s*\/\s*total_cost/i,
    /net_operating_income\s*\/\s*loan_amount/i,
    /occupied_units\s*\/\s*total_units/i,
    /internal_rate_of_return|xirr|effective_apr|effectiveApr/i,
    /weightedScore\s*=|comparisonScore\s*=|bestLoanScore\s*=/i,
  ];
  if (forbidden.some((pattern) => pattern.test(inspectableSource))) {
    throw new Error("FinanceIQ scenario comparison may order authoritative outputs but cannot calculate unsupported metrics or opaque scores.");
  }
}

function validateInput(request: FinancingScenarioComparisonRequest) {
  const { input, candidates } = request;
  if (input.contractVersion !== FINANCEIQ_SCENARIO_COMPARISON_CONTRACT_VERSION) throw new Error("Unsupported FinanceIQ comparison contract version.");
  if (!input.workspaceId.trim()) throw new Error("FinanceIQ comparison requires workspace scope.");
  if (!input.dealId.trim()) throw new Error("FinanceIQ comparison requires Deal scope.");
  if (input.financingStructureIds.length < 2) throw new Error("FinanceIQ comparison requires at least two financing structures.");
  const unsupported = input.requestedDimensions.filter((dimension) => !FINANCEIQ_SUPPORTED_COMPARISON_DIMENSIONS.includes(dimension));
  if (unsupported.length) throw new Error(`Unsupported FinanceIQ comparison dimension: ${unsupported.sort().join(", ")}`);
  const candidateIds = new Set(candidates.map((candidate) => candidate.projection.financingStructureId));
  for (const id of input.financingStructureIds) {
    if (!candidateIds.has(id)) throw new Error(`Missing comparison candidate for financing structure: ${id}`);
  }
  for (const candidate of candidates) {
    if (candidate.projection.workspaceId !== input.workspaceId) throw new Error("FinanceIQ comparison cannot cross workspace boundaries.");
    if (candidate.projection.dealId !== input.dealId) throw new Error("FinanceIQ comparison cannot cross Deal boundaries.");
  }
}

function buildRow(input: FinancingScenarioComparisonInput, candidate: Candidate): FinancingScenarioComparisonRow {
  const projection = candidate.projection;
  const reasonCodes: string[] = [];
  const missingInputs: string[] = [];
  const warnings: string[] = [];
  const unsupportedMetrics: FinancingMetricKey[] = [];
  const schedules = [...(candidate.debtSchedules ?? [])].sort((a, b) => a.debtTrancheId.localeCompare(b.debtTrancheId));
  const debtTranches = [...(candidate.debtTranches ?? [])].sort((a, b) => a.debtTrancheId.localeCompare(b.debtTrancheId));
  const equityTranches = [...(candidate.equityTranches ?? [])].sort((a, b) => a.equityTrancheId.localeCompare(b.equityTrancheId));
  const feasibilityStatus = projection.feasibilityStatus ?? "uncertain";
  const isCurrentMode = input.mode === "current";
  const exclusionReason = currentExclusionReason(projection, isCurrentMode);
  const isWinnerEligible = !exclusionReason;
  if (exclusionReason) reasonCodes.push(exclusionReason);
  if (projection.stale) reasonCodes.push("stale_feasibility_projection");
  const scheduleVersions = schedules.map((schedule) => ({
    debtTrancheId: schedule.debtTrancheId,
    debtTrancheVersion: schedule.debtTrancheVersion,
    resultId: schedule.resultId,
    resultHash: schedule.resultHash,
    status: schedule.status,
  }));
  const currentSchedules = schedules.filter((schedule) => schedule.status === "current");
  if (schedules.length !== debtTranches.length) missingInputs.push("debt_schedule_projection_per_tranche");
  if (schedules.some((schedule) => schedule.status === "stale")) reasonCodes.push("stale_debt_schedule");
  if (schedules.some((schedule) => schedule.status === "failed")) warnings.push("A prior debt schedule calculation failed; prior valid result remains available where present.");
  const debtServiceSummary = summarizeDebtService(currentSchedules, projection.currency, missingInputs);
  const balloonExposure = summarizeBalloon(currentSchedules, projection.currency);
  const metrics = (candidate.authoritativeMetrics ?? []).map((metric) => {
    if (metric.status === "unsupported" && metric.metricKey) unsupportedMetrics.push(metric.metricKey);
    if (metric.status === "missing") missingInputs.push(`${metric.metricKey}_authoritative_metric`);
    if (metric.status !== "calculated" && metric.status !== "calculated_with_warning" && metric.status !== "unsupported" && metric.status !== "missing") {
      warnings.push(`${metric.metricKey} is not final and remains uncertain.`);
    }
    return {
      metricKey: metric.metricKey,
      value: metric.value,
      status: metric.status,
      formulaId: metric.formulaId,
      underwritingSnapshotId: metric.underwritingSnapshotId,
      underwritingRunId: metric.underwritingRunId,
      resultHash: metric.resultHash,
    };
  });
  const costInputs = summarizeCosts(projection.currency, debtTranches, equityTranches);
  const riskCharacteristics = summarizeRisk(debtTranches);
  const complexity = {
    debtTrancheCount: projection.debtTrancheCount,
    equityTrancheCount: projection.equityTrancheCount,
    capitalSourceCount: projection.capitalSourceCount,
    unknownTermCount: countUnknownTerms(debtTranches),
    unverifiedTermCount: [...debtTranches, ...equityTranches].filter((tranche) => !["quoted", "confirmed", "lender_provided", "investor_provided"].includes(tranche.verificationState)).length,
  };
  const sourceReferences = [
    sourceReference(projection),
    ...debtTranches.map(sourceReference),
    ...equityTranches.map(sourceReference),
  ].filter((reference) => reference.sourceEvidenceId || reference.sourceRecordId || reference.sourceClassification !== "unknown");

  return {
    financingStructureId: projection.financingStructureId,
    structureVersion: projection.financingStructureVersion,
    name: projection.name,
    status: projection.status,
    isActive: projection.isActive,
    isWinnerEligible,
    exclusionReason,
    feasibilityStatus,
    unresolvedConditionCount: projection.unresolvedConditionCount ?? 0,
    failedCovenantCount: projection.failedCovenantCount ?? 0,
    uncertainCovenantCount: projection.uncertainCovenantCount ?? 0,
    debtScheduleVersions: scheduleVersions,
    debtServiceSummary,
    balloonExposure,
    underwritingMetrics: metrics,
    costInputs,
    riskCharacteristics,
    complexity,
    equityTerms: equityTranches.map((tranche) => ({
      equityTrancheId: tranche.equityTrancheId,
      equityTrancheVersion: tranche.equityTrancheVersion,
      contributionAmount: tranche.contributionAmount,
      ownershipPercentage: tranche.ownershipPercentage,
      preferredReturnTerms: tranche.preferredReturnTerms,
      distributionPriority: tranche.distributionPriority,
    })),
    warnings: [...new Set(warnings)].sort(),
    missingInputs: [...new Set(missingInputs)].sort(),
    unsupportedMetrics: [...new Set(unsupportedMetrics)].sort(),
    sourceReferences,
    deterministicOrder: 0,
    reasonCodes: [...new Set(reasonCodes)].sort(),
  };
}

function currentExclusionReason(projection: FinancingProjection, currentMode: boolean) {
  if (!currentMode) return undefined;
  if (projection.status === "expired" || projection.isExpired) return "excluded_expired_structure";
  if (projection.status === "superseded") return "excluded_superseded_structure";
  if (projection.status === "declined" || projection.status === "withdrawn") return "excluded_inactive_structure";
  return undefined;
}

function summarizeDebtService(schedules: DebtScheduleProjection[], currency: string, missingInputs: string[]) {
  if (!schedules.length) {
    missingInputs.push("current_authoritative_debt_schedule");
    return undefined;
  }
  if (schedules.some((schedule) => typeof schedule.firstPeriodicDebtService !== "number")) {
    missingInputs.push("periodic_debt_service");
    return undefined;
  }
  return {
    currency,
    periodicDebtService: roundMoney(schedules.reduce((sum, schedule) => sum + (schedule.firstPeriodicDebtService ?? 0), 0)),
    totalDebtService: roundMoney(schedules.reduce((sum, schedule) => sum + (schedule.totalDebtService ?? 0), 0)),
    cumulativeInterest: roundMoney(schedules.reduce((sum, schedule) => sum + (schedule.totalInterestPaid ?? 0), 0)),
  };
}

function summarizeBalloon(schedules: DebtScheduleProjection[], currency: string) {
  const maturityBalance = roundMoney(schedules.reduce((sum, schedule) => sum + (schedule.totalBalloonPaid ?? 0), 0));
  const maturityPeriod = Math.max(...schedules.map((schedule) => schedule.periodCount ?? 0), 0) || undefined;
  return maturityBalance > 0 ? { currency, maturityBalance, maturityPeriod } : undefined;
}

function summarizeCosts(currency: string, debtTranches: DebtTranche[], equityTranches: EquityTranche[]) {
  const pointValues = debtTranches.map((tranche) => tranche.points).filter((value): value is number => typeof value === "number");
  const sourceBackedFees = roundMoney([...debtTranches, ...equityTranches].reduce((sum, tranche) => sum + sumFeeArray(tranche.fees), 0));
  return pointValues.length || sourceBackedFees > 0
    ? { currency, points: pointValues.length ? roundMoney(pointValues.reduce((sum, value) => sum + value, 0)) : undefined, sourceBackedFees }
    : undefined;
}

function summarizeRisk(debtTranches: DebtTranche[]) {
  const risks: string[] = [];
  if (debtTranches.some((tranche) => tranche.rateType === "variable" || tranche.rateType === "hybrid")) risks.push("variable_rate_current_effective_only");
  if (debtTranches.some((tranche) => tranche.hasBalloon || (tranche.maturityMonths && tranche.amortizationMonths && tranche.maturityMonths < tranche.amortizationMonths))) risks.push("balloon_or_maturity_refinance_risk");
  if (debtTranches.some((tranche) => tranche.interestOnlyMonths && tranche.interestOnlyMonths > 0)) risks.push("interest_only_period");
  if (debtTranches.some((tranche) => !["none", "open"].includes(tranche.prepaymentType))) risks.push("prepayment_restriction");
  if (debtTranches.some((tranche) => tranche.recourseType === "full" || tranche.recourseType === "partial")) risks.push("recourse_or_guarantee_exposure");
  return risks.sort();
}

function compareRows(a: FinancingScenarioComparisonRow, b: FinancingScenarioComparisonRow) {
  return numericCompare(winnerEligibilityRank(a), winnerEligibilityRank(b))
    || numericCompare(feasibilityRank(a.feasibilityStatus), feasibilityRank(b.feasibilityStatus))
    || numericCompare(a.failedCovenantCount, b.failedCovenantCount)
    || numericCompare(a.uncertainCovenantCount, b.uncertainCovenantCount)
    || numericCompare(a.unresolvedConditionCount, b.unresolvedConditionCount)
    || numericCompare(a.debtServiceSummary?.periodicDebtService ?? Number.POSITIVE_INFINITY, b.debtServiceSummary?.periodicDebtService ?? Number.POSITIVE_INFINITY)
    || numericCompare(a.balloonExposure?.maturityBalance ?? 0, b.balloonExposure?.maturityBalance ?? 0)
    || a.name.localeCompare(b.name)
    || a.financingStructureId.localeCompare(b.financingStructureId);
}

function winnerEligibilityRank(row: FinancingScenarioComparisonRow) {
  return row.isWinnerEligible ? 0 : 1;
}

function feasibilityRank(status: FinancingFeasibilityStatus) {
  return ({
    feasible: 0,
    feasible_with_conditions: 1,
    uncertain: 2,
    not_feasible: 3,
    expired: 4,
    superseded: 5,
  } satisfies Record<FinancingFeasibilityStatus, number>)[status];
}

function buildTradeoffs(dimensions: FinancingScenarioDimension[], rows: FinancingScenarioComparisonRow[]): FinancingScenarioTradeoff[] {
  const tradeoffs: FinancingScenarioTradeoff[] = [];
  for (const dimension of dimensions) {
    if (dimension === "debt_service") tradeoffs.push(numericTradeoff(dimension, rows, (row) => row.debtServiceSummary?.periodicDebtService, "Lower periodic debt service is favorable."));
    if (dimension === "cumulative_interest") tradeoffs.push(numericTradeoff(dimension, rows, (row) => row.debtServiceSummary?.cumulativeInterest, "Lower cumulative interest is favorable."));
    if (dimension === "balloon_exposure") tradeoffs.push(numericTradeoff(dimension, rows, (row) => row.balloonExposure?.maturityBalance ?? 0, "Lower balloon exposure is favorable."));
    if (dimension === "conditions") tradeoffs.push(numericTradeoff(dimension, rows, (row) => row.unresolvedConditionCount, "Fewer unresolved lender conditions is favorable."));
    if (dimension === "covenants") tradeoffs.push(numericTradeoff(dimension, rows, (row) => row.failedCovenantCount + row.uncertainCovenantCount, "Fewer failed or uncertain hard covenants is favorable."));
    if (dimension === "fees") tradeoffs.push(numericTradeoff(dimension, rows, (row) => row.costInputs?.sourceBackedFees, "Lower source-backed financing fees are favorable."));
    if (dimension === "complexity") tradeoffs.push(numericTradeoff(dimension, rows, (row) => row.complexity.debtTrancheCount + row.complexity.equityTrancheCount + row.complexity.unknownTermCount, "Lower tranche and unknown-term complexity is favorable."));
    if (dimension === "dscr" || dimension === "ltv") tradeoffs.push(metricTradeoff(dimension, rows, dimension));
    if (["rate_type", "prepayment", "recourse", "interest_only", "equity_terms", "feasibility"].includes(dimension)) {
      tradeoffs.push({
        dimension,
        state: "comparable",
        structureIds: rows.map((row) => row.financingStructureId),
        reasonCode: `${dimension}_summarized`,
        explanation: `${dimension} differences are exposed as deterministic attributes rather than an opaque score.`,
      });
    }
  }
  return tradeoffs;
}

function numericTradeoff(
  dimension: FinancingScenarioDimension,
  rows: FinancingScenarioComparisonRow[],
  valueFor: (row: FinancingScenarioComparisonRow) => number | undefined,
  explanation: string,
): FinancingScenarioTradeoff {
  const values = rows.map((row) => ({ id: row.financingStructureId, value: valueFor(row) }));
  if (values.some((entry) => typeof entry.value !== "number" || !Number.isFinite(entry.value))) {
    return { dimension, state: "missing_input", structureIds: values.map((entry) => entry.id), reasonCode: `${dimension}_missing_comparable_value`, explanation: `${dimension} is not comparable for every eligible structure.` };
  }
  const sorted = [...values].sort((a, b) => (a.value ?? 0) - (b.value ?? 0) || a.id.localeCompare(b.id));
  return { dimension, state: "comparable", structureIds: sorted.map((entry) => entry.id), reasonCode: `${dimension}_ordered_by_authoritative_value`, explanation };
}

function metricTradeoff(dimension: FinancingScenarioDimension, rows: FinancingScenarioComparisonRow[], metricKey: FinancingMetricKey): FinancingScenarioTradeoff {
  const values = rows.map((row) => ({ id: row.financingStructureId, metric: row.underwritingMetrics.find((metric) => metric.metricKey === metricKey) }));
  if (values.some((entry) => entry.metric?.status === "unsupported")) {
    return { dimension, state: "unsupported_metric", structureIds: values.map((entry) => entry.id), reasonCode: `${metricKey}_unsupported_by_authoritative_underwriting`, explanation: `${metricKey.toUpperCase()} remains unsupported unless supplied by the authoritative underwriting engine.` };
  }
  if (values.some((entry) => typeof entry.metric?.value !== "number")) {
    return { dimension, state: "missing_input", structureIds: values.map((entry) => entry.id), reasonCode: `${metricKey}_missing_authoritative_value`, explanation: `${metricKey.toUpperCase()} is not available for every eligible structure.` };
  }
  const sorted = [...values].sort((a, b) => metricKey === "ltv" ? (a.metric!.value! - b.metric!.value!) : (b.metric!.value! - a.metric!.value!));
  return { dimension, state: "comparable", structureIds: sorted.map((entry) => entry.id), reasonCode: `${metricKey}_ordered_by_authoritative_value`, explanation: metricKey === "ltv" ? "Lower authoritative LTV is favorable." : "Higher authoritative DSCR is favorable." };
}

function isClearWinner(top: FinancingScenarioComparisonRow, second: FinancingScenarioComparisonRow, tradeoffs: FinancingScenarioTradeoff[]) {
  if (feasibilityRank(top.feasibilityStatus) < feasibilityRank(second.feasibilityStatus)) return true;
  if (top.failedCovenantCount < second.failedCovenantCount) return true;
  if (top.unresolvedConditionCount < second.unresolvedConditionCount && top.debtServiceSummary && second.debtServiceSummary) return true;
  const comparable = tradeoffs.filter((tradeoff) => tradeoff.state === "comparable" && tradeoff.structureIds.length >= 2);
  const topWins = comparable.filter((tradeoff) => tradeoff.structureIds[0] === top.financingStructureId).length;
  const secondWins = comparable.filter((tradeoff) => tradeoff.structureIds[0] === second.financingStructureId).length;
  return topWins >= 2 && secondWins === 0;
}

function noDecisionReason(status: string, tradeoffs: FinancingScenarioTradeoff[], blockingIssues: string[]) {
  if (blockingIssues.length) return "comparison_requires_more_current_options";
  if (status === "not_comparable") return "material_dimensions_not_comparable";
  if (tradeoffs.some((tradeoff) => tradeoff.state === "missing_input")) return "missing_authoritative_inputs";
  return "tradeoffs_do_not_support_single_clear_winner";
}

function countUnknownTerms(debtTranches: DebtTranche[]) {
  return debtTranches.reduce((sum, tranche) => sum
    + (tranche.rateType === "unknown" ? 1 : 0)
    + (tranche.prepaymentType === "unknown" ? 1 : 0)
    + (tranche.recourseType === "unknown" ? 1 : 0)
    + (tranche.principalAmount === undefined ? 1 : 0)
    + (tranche.statedRate === undefined && tranche.rateType !== "unknown" ? 1 : 0), 0);
}

function sourceReference(input: { sourceEvidenceId?: string; sourceRecordId?: string; sourceAnchor?: Record<string, unknown>; sourceClassification: string; verificationState: string }) {
  return {
    sourceEvidenceId: input.sourceEvidenceId,
    sourceRecordId: input.sourceRecordId,
    sourceAnchor: input.sourceAnchor as Record<string, never> | undefined,
    sourceClassification: input.sourceClassification as never,
    verificationState: input.verificationState as never,
  };
}

function sumFeeArray(fees: unknown) {
  if (!Array.isArray(fees)) return 0;
  return fees.reduce((sum, fee) => {
    if (!fee || typeof fee !== "object") return sum;
    const amount = (fee as { amount?: unknown }).amount;
    return sum + (typeof amount === "number" && Number.isFinite(amount) ? amount : 0);
  }, 0);
}

function numericCompare(a: number, b: number) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function stableHash(value: unknown) {
  const text = stableSerialize(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "undefined";
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`)
    .join(",")}}`;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      if (child && typeof child === "object") deepFreeze(child);
    }
  }
  return value;
}
