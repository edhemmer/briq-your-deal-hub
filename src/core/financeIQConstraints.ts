import {
  FINANCEIQ_CONSTRAINT_CONTRACT_VERSION,
  type FinancingComparisonOperator,
  type FinancingConditionStatus,
  type FinancingConstraintEvaluationState,
  type FinancingCovenant,
  type FinancingFeasibilityStatus,
  type FinancingMetricKey,
  type FinancingVerificationState,
  type FinancingWaiverState,
} from "./financeIQ";

export const FINANCEIQ_CONSTRAINT_EVALUATION_VERSION = "financeiq-constraint-evaluation-v1" as const;
export const FINANCEIQ_METRIC_BINDING_REGISTRY_VERSION = "financeiq-metric-binding-registry-v1" as const;

export type FinancingMetricBinding = {
  metricKey: FinancingMetricKey;
  formulaId: string;
  available: boolean;
  source: "spec005_underwriting_output";
};

export const FINANCEIQ_METRIC_BINDING_REGISTRY: readonly FinancingMetricBinding[] = [
  { metricKey: "dscr", formulaId: "debt_service_coverage_ratio", available: true, source: "spec005_underwriting_output" },
  { metricKey: "ltv", formulaId: "loan_to_value_ratio", available: true, source: "spec005_underwriting_output" },
  { metricKey: "ltc", formulaId: "loan_to_cost_ratio", available: false, source: "spec005_underwriting_output" },
  { metricKey: "debt_yield", formulaId: "debt_yield", available: false, source: "spec005_underwriting_output" },
  { metricKey: "occupancy", formulaId: "economic_occupancy", available: false, source: "spec005_underwriting_output" },
] as const;

export type AuthoritativeMetricValue = {
  metricKey: FinancingMetricKey;
  formulaId: string;
  value?: number;
  status: "calculated" | "calculated_with_warning" | "preliminary" | "incomplete" | "blocked_conflict" | "missing" | "unsupported";
  underwritingSnapshotId?: string;
  underwritingSnapshotVersion?: number;
  underwritingRunId?: string;
  resultHash?: string;
};

export type CovenantEvaluationInput = {
  covenant: Pick<
    FinancingCovenant,
    | "covenantId"
    | "covenantVersion"
    | "metricKey"
    | "comparisonOperator"
    | "thresholdValue"
    | "secondaryThresholdValue"
    | "verificationState"
    | "sourceClassification"
    | "confidence"
    | "isHardConstraint"
    | "status"
    | "conflictState"
    | "effectiveAt"
    | "expiresAt"
  >;
  authoritativeMetric?: AuthoritativeMetricValue;
  evaluatedAt: string;
};

export type CovenantEvaluation = {
  contractVersion: typeof FINANCEIQ_CONSTRAINT_CONTRACT_VERSION;
  evaluationVersion: typeof FINANCEIQ_CONSTRAINT_EVALUATION_VERSION;
  covenantId: string;
  covenantVersion: number;
  metricKey?: FinancingMetricKey;
  formulaId?: string;
  authoritativeMetricValue?: number;
  comparisonOperator?: FinancingComparisonOperator;
  thresholdValue?: number;
  secondaryThresholdValue?: number;
  evaluationState: FinancingConstraintEvaluationState;
  isHardConstraint: boolean;
  stale: false;
  reasonCodes: string[];
  resultHash: string;
  evaluatedAt: string;
};

export type FeasibilityConditionInput = {
  status: FinancingConditionStatus;
  verificationState: FinancingVerificationState;
  waiverState?: FinancingWaiverState;
  conflictState?: string;
  confidence?: number;
  effectiveAt?: string;
  expiresAt?: string;
  archivedAt?: string;
};

export type FeasibilitySummary = {
  status: FinancingFeasibilityStatus;
  unresolvedConditionCount: number;
  blockingConditionCount: number;
  failedCovenantCount: number;
  uncertainCovenantCount: number;
  verificationSummary: {
    unverifiedConditionCount: number;
    unverifiedCovenantCount: number;
    conflictedRequirementCount: number;
    expiredRequirementCount: number;
  };
  stale: boolean;
  resultHash: string;
};

export function evaluateFinancingCovenant(input: CovenantEvaluationInput): CovenantEvaluation {
  const covenant = input.covenant;
  const reasonCodes: string[] = [];
  const now = Date.parse(input.evaluatedAt);
  const binding = covenant.metricKey ? selectFinancingMetricBinding(covenant.metricKey) : undefined;
  let evaluationState: FinancingConstraintEvaluationState = "uncertain";

  if (covenant.status === "superseded") {
    evaluationState = "superseded";
    reasonCodes.push("covenant_superseded");
  } else if (covenant.status === "expired" || isExpired(covenant.expiresAt, now)) {
    evaluationState = "expired";
    reasonCodes.push("covenant_expired");
  } else if (covenant.status === "not_applicable") {
    evaluationState = "not_applicable";
    reasonCodes.push("covenant_not_applicable");
  } else if (!covenant.metricKey || !binding) {
    evaluationState = "missing_input";
    reasonCodes.push("metric_key_missing");
  } else if (!binding.available) {
    evaluationState = "unsupported_metric";
    reasonCodes.push("metric_not_produced_by_canonical_underwriting");
  } else if (!input.authoritativeMetric || input.authoritativeMetric.status === "missing") {
    evaluationState = "missing_input";
    reasonCodes.push("authoritative_metric_missing");
  } else if (input.authoritativeMetric.status === "unsupported") {
    evaluationState = "unsupported_metric";
    reasonCodes.push("authoritative_metric_unsupported");
  } else if (input.authoritativeMetric.status !== "calculated" && input.authoritativeMetric.status !== "calculated_with_warning") {
    evaluationState = "uncertain";
    reasonCodes.push("authoritative_metric_not_final");
  } else if (typeof input.authoritativeMetric.value !== "number" || !Number.isFinite(input.authoritativeMetric.value)) {
    evaluationState = "missing_input";
    reasonCodes.push("authoritative_metric_value_missing");
  } else if (!covenant.comparisonOperator || typeof covenant.thresholdValue !== "number") {
    evaluationState = "missing_input";
    reasonCodes.push("threshold_missing");
  } else if (covenant.conflictState === "unresolved" || covenant.sourceClassification === "conflict") {
    evaluationState = "uncertain";
    reasonCodes.push("binding_covenant_conflict");
  } else if (!isVerifiedEnough(covenant.verificationState)) {
    evaluationState = "uncertain";
    reasonCodes.push("covenant_source_unverified");
  } else {
    evaluationState = compareThreshold(
      input.authoritativeMetric.value,
      covenant.comparisonOperator,
      covenant.thresholdValue,
      covenant.secondaryThresholdValue,
    )
      ? "passes"
      : "fails";
    reasonCodes.push(evaluationState === "passes" ? "threshold_passed" : "threshold_failed");
  }

  const material = {
    evaluationVersion: FINANCEIQ_CONSTRAINT_EVALUATION_VERSION,
    covenantId: covenant.covenantId,
    covenantVersion: covenant.covenantVersion,
    metricKey: covenant.metricKey,
    formulaId: binding?.formulaId,
    authoritativeMetricValue: input.authoritativeMetric?.value,
    comparisonOperator: covenant.comparisonOperator,
    thresholdValue: covenant.thresholdValue,
    secondaryThresholdValue: covenant.secondaryThresholdValue,
    evaluationState,
    isHardConstraint: covenant.isHardConstraint,
    reasonCodes: reasonCodes.sort(),
  };

  return deepFreeze({
    contractVersion: FINANCEIQ_CONSTRAINT_CONTRACT_VERSION,
    ...material,
    stale: false,
    resultHash: stableHash(material),
    evaluatedAt: input.evaluatedAt,
  });
}

export function summarizeFinancingFeasibility(input: {
  structureStatus?: string;
  structureExpiresAt?: string;
  evaluatedAt: string;
  conditions: readonly FeasibilityConditionInput[];
  covenantEvaluations: readonly Pick<CovenantEvaluation, "evaluationState" | "isHardConstraint">[];
}): FeasibilitySummary {
  const now = Date.parse(input.evaluatedAt);
  const activeConditions = input.conditions.filter((condition) => !condition.archivedAt);
  const unresolvedConditionCount = activeConditions.filter((condition) => !["satisfied", "waived", "not_applicable"].includes(condition.status)).length;
  const blockingConditionCount = activeConditions.filter((condition) => ["pending", "submitted", "under_review", "failed", "disputed", "unknown"].includes(condition.status)).length;
  const unverifiedConditionCount = activeConditions.filter((condition) => !isVerifiedEnough(condition.verificationState) && !["not_applicable"].includes(condition.status)).length;
  const conflictedConditionCount = activeConditions.filter((condition) => condition.conflictState === "unresolved" || condition.conflictState === "source_conflict").length;
  const expiredConditionCount = activeConditions.filter((condition) => condition.status === "expired" || isExpired(condition.expiresAt, now)).length;
  const hardEvaluations = input.covenantEvaluations.filter((evaluation) => evaluation.isHardConstraint);
  const failedCovenantCount = hardEvaluations.filter((evaluation) => evaluation.evaluationState === "fails").length;
  const uncertainCovenantCount = hardEvaluations.filter((evaluation) => ["uncertain", "missing_input", "unsupported_metric"].includes(evaluation.evaluationState)).length;
  const expiredCovenantCount = hardEvaluations.filter((evaluation) => evaluation.evaluationState === "expired").length;
  const conflictedRequirementCount = conflictedConditionCount + uncertainCovenantCount;
  let status: FinancingFeasibilityStatus;

  if (input.structureStatus === "superseded") {
    status = "superseded";
  } else if (input.structureStatus === "expired" || isExpired(input.structureExpiresAt, now)) {
    status = "expired";
  } else if (failedCovenantCount > 0) {
    status = "not_feasible";
  } else if (uncertainCovenantCount > 0 || unverifiedConditionCount > 0 || conflictedRequirementCount > 0) {
    status = "uncertain";
  } else if (unresolvedConditionCount > 0) {
    status = "feasible_with_conditions";
  } else {
    status = "feasible";
  }

  const material = {
    status,
    unresolvedConditionCount,
    blockingConditionCount,
    failedCovenantCount,
    uncertainCovenantCount,
    verificationSummary: {
      unverifiedConditionCount,
      unverifiedCovenantCount: uncertainCovenantCount,
      conflictedRequirementCount,
      expiredRequirementCount: expiredConditionCount + expiredCovenantCount,
    },
    stale: false,
  };

  return deepFreeze({ ...material, resultHash: stableHash(material) });
}

export function selectFinancingMetricBinding(metricKey: FinancingMetricKey) {
  return FINANCEIQ_METRIC_BINDING_REGISTRY.find((entry) => entry.metricKey === metricKey);
}

export function assertFinanceIQDoesNotCalculateUnderwritingMetrics(sourceText: string): void {
  const forbidden = [
    /net_operating_income\s*\/\s*annual_debt_service/i,
    /loan_amount\s*\/\s*(value_basis|purchase_price|appraised_value)/i,
    /loan_amount\s*\/\s*(total_cost|project_cost)/i,
    /net_operating_income\s*\/\s*loan_amount/i,
    /occupied_units\s*\/\s*total_units/i,
  ];
  if (forbidden.some((pattern) => pattern.test(sourceText))) {
    throw new Error("FinanceIQ may compare covenant thresholds but cannot calculate authoritative underwriting metrics.");
  }
}

function compareThreshold(value: number, operator: FinancingComparisonOperator, threshold: number, secondary?: number) {
  if (operator === "gte") return value >= threshold;
  if (operator === "gt") return value > threshold;
  if (operator === "lte") return value <= threshold;
  if (operator === "lt") return value < threshold;
  if (operator === "eq") return value === threshold;
  if (operator === "between") return typeof secondary === "number" && value >= threshold && value <= secondary;
  return false;
}

function isVerifiedEnough(state: FinancingVerificationState) {
  return ["lender_provided", "investor_provided", "quoted", "confirmed"].includes(state);
}

function isExpired(expiresAt: string | undefined, now: number) {
  return Boolean(expiresAt && Number.isFinite(now) && Date.parse(expiresAt) <= now);
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
