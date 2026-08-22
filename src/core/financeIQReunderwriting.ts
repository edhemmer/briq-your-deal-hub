import type {
  DebtTranche,
  EquityTranche,
  FinancingActiveContext,
  FinancingFeasibilityStatus,
  FinancingProjection,
} from "./financeIQ";
import type { DebtScheduleResult } from "./underwritingDebtSchedules";

export const FINANCEIQ_REUNDERWRITING_CONTRACT_VERSION = "financeiq-reunderwriting-contract-v1" as const;
export const FINANCEIQ_REUNDERWRITING_MATERIAL_RULE_VERSION = "financeiq-reunderwriting-material-rules-v1" as const;
export const FINANCEIQ_REUNDERWRITING_VERSION_GRAPH_VERSION = "financeiq-reunderwriting-version-graph-v1" as const;

export type FinancingReunderwritingReason =
  | "active_financing_structure_changed"
  | "financing_terms_changed"
  | "debt_tranche_changed"
  | "equity_terms_changed"
  | "feasibility_changed"
  | "lender_constraint_changed"
  | "retry";

export type FinancingReunderwritingStatus =
  | "queued"
  | "recalculating"
  | "current"
  | "stale"
  | "failed_with_prior_valid_result"
  | "failed_without_prior_valid_result"
  | "blocked";

export type FinancingReunderwritingStage = "underwriting" | "strategy" | "cockpit" | "comparison";

export type FinancingMaterialChangeCode =
  | "active_financing_structure_changed"
  | "financing_structure_version_changed"
  | "active_context_changed"
  | "scenario_changed"
  | "principal_changed"
  | "funded_amount_changed"
  | "commitment_amount_changed"
  | "rate_changed"
  | "amortization_changed"
  | "maturity_changed"
  | "interest_only_changed"
  | "payment_frequency_changed"
  | "balloon_changed"
  | "fees_changed"
  | "prepayment_changed"
  | "debt_tranche_composition_changed"
  | "equity_contribution_changed"
  | "equity_terms_changed"
  | "feasibility_changed"
  | "binding_constraint_state_changed";

export type FinancingMaterialChange = {
  code: FinancingMaterialChangeCode;
  fieldPath: string;
  before?: unknown;
  after?: unknown;
  description: string;
};

export type FinancingMaterialChangeInput = {
  before?: FinancingProjection;
  after: FinancingProjection;
  beforeDebtTranches?: readonly DebtTranche[];
  afterDebtTranches?: readonly DebtTranche[];
  beforeEquityTranches?: readonly EquityTranche[];
  afterEquityTranches?: readonly EquityTranche[];
  beforeFeasibilityStatus?: FinancingFeasibilityStatus;
  afterFeasibilityStatus?: FinancingFeasibilityStatus;
  beforeBindingConstraintHash?: string;
  afterBindingConstraintHash?: string;
};

export type FinancingReunderwritingRequest = {
  contractVersion: typeof FINANCEIQ_REUNDERWRITING_CONTRACT_VERSION;
  workspaceId: string;
  dealId: string;
  financingStructureId: string;
  financingStructureVersion: number;
  activeContext: FinancingActiveContext;
  scenarioId?: string;
  priorUnderwritingSnapshotId?: string;
  reason: FinancingReunderwritingReason;
  triggeringEventId: string;
  requestedBy: string;
  correlationId: string;
  idempotencyKey: string;
  materialChanges: FinancingMaterialChange[];
  requestedAt: string;
};

export type FinancingVersionGraph = {
  graphVersion: typeof FINANCEIQ_REUNDERWRITING_VERSION_GRAPH_VERSION;
  workspaceId: string;
  dealId: string;
  financingStructureId: string;
  financingStructureVersion: number;
  activeContext: FinancingActiveContext;
  scenarioId?: string;
  debtScheduleResultIds: string[];
  debtScheduleResultHashes: string[];
  underwritingSnapshotId?: string;
  underwritingSnapshotVersion?: number;
  underwritingRunId?: string;
  strategyRankingId?: string;
  strategyRankingVersion?: string;
  cockpitProjectionId?: string;
  cockpitProjectionVersion?: string;
};

export type FinancingDebtScheduleVersionRef = Pick<DebtScheduleResult, "resultHash"> & {
  id?: string;
  resultId?: string;
};

export type FinancingReunderwritingFailure = {
  stage: FinancingReunderwritingStage;
  code: string;
  safeMessage: string;
  retryable: boolean;
};

export type FinancingReunderwritingResult = {
  contractVersion: typeof FINANCEIQ_REUNDERWRITING_CONTRACT_VERSION;
  workspaceId: string;
  dealId: string;
  financingStructureId: string;
  financingStructureVersion: number;
  activeContext: FinancingActiveContext;
  scenarioId?: string;
  priorUnderwritingSnapshotId?: string;
  newUnderwritingSnapshotId?: string;
  newUnderwritingSnapshotVersion?: number;
  calculationStatus: FinancingReunderwritingStatus;
  changedAuthoritativeMetrics: FinancingMaterialChange[];
  staleDownstreamResultIds: string[];
  strategyReevaluationStatus: FinancingReunderwritingStatus;
  decisionCockpitRefreshStatus: FinancingReunderwritingStatus;
  comparisonRefreshStatus: FinancingReunderwritingStatus;
  versionGraph: FinancingVersionGraph;
  warnings: string[];
  failures: FinancingReunderwritingFailure[];
  resultHash: string;
  generatedAt: string;
};

export function detectMaterialFinancingChanges(input: FinancingMaterialChangeInput): FinancingMaterialChange[] {
  const changes: FinancingMaterialChange[] = [];
  const before = input.before;
  const after = input.after;

  if (!before) {
    changes.push(change("active_financing_structure_changed", "financingStructureId", undefined, after.financingStructureId));
  } else {
    pushIfChanged(changes, "active_financing_structure_changed", "financingStructureId", before.financingStructureId, after.financingStructureId);
    pushIfChanged(changes, "financing_structure_version_changed", "financingStructureVersion", before.financingStructureVersion, after.financingStructureVersion);
    pushIfChanged(changes, "active_context_changed", "activeContext", before.activeContext, after.activeContext);
    pushIfChanged(changes, "scenario_changed", "scenarioId", before.scenarioId, after.scenarioId);
  }

  compareDebtTranches(changes, input.beforeDebtTranches ?? [], input.afterDebtTranches ?? []);
  compareEquityTranches(changes, input.beforeEquityTranches ?? [], input.afterEquityTranches ?? []);
  pushIfChanged(changes, "feasibility_changed", "feasibilityStatus", input.beforeFeasibilityStatus, input.afterFeasibilityStatus);
  pushIfChanged(changes, "binding_constraint_state_changed", "bindingConstraintHash", input.beforeBindingConstraintHash, input.afterBindingConstraintHash);

  return dedupeChanges(changes);
}

export function isMaterialFinancingChange(input: FinancingMaterialChangeInput): boolean {
  return detectMaterialFinancingChanges(input).length > 0;
}

export function buildFinancingReunderwritingRequest(input: Omit<FinancingReunderwritingRequest, "contractVersion" | "materialChanges"> & {
  materialChangeInput: FinancingMaterialChangeInput;
}): FinancingReunderwritingRequest {
  const materialChanges = detectMaterialFinancingChanges(input.materialChangeInput);
  return deepFreeze({
    contractVersion: FINANCEIQ_REUNDERWRITING_CONTRACT_VERSION,
    workspaceId: input.workspaceId,
    dealId: input.dealId,
    financingStructureId: input.financingStructureId,
    financingStructureVersion: input.financingStructureVersion,
    activeContext: input.activeContext,
    scenarioId: input.scenarioId,
    priorUnderwritingSnapshotId: input.priorUnderwritingSnapshotId,
    reason: input.reason,
    triggeringEventId: input.triggeringEventId,
    requestedBy: input.requestedBy,
    correlationId: input.correlationId,
    idempotencyKey: input.idempotencyKey,
    materialChanges,
    requestedAt: input.requestedAt,
  });
}

export function buildFinancingVersionGraph(input: Omit<FinancingVersionGraph, "graphVersion" | "debtScheduleResultIds" | "debtScheduleResultHashes"> & {
  debtSchedules?: readonly FinancingDebtScheduleVersionRef[];
}): FinancingVersionGraph {
  const debtScheduleResultIds = (input.debtSchedules ?? [])
    .map((schedule) => schedule.id ?? schedule.resultId)
    .filter((id): id is string => Boolean(id))
    .sort();
  const debtScheduleResultHashes = (input.debtSchedules ?? []).map((schedule) => schedule.resultHash).sort();

  return deepFreeze({
    graphVersion: FINANCEIQ_REUNDERWRITING_VERSION_GRAPH_VERSION,
    workspaceId: input.workspaceId,
    dealId: input.dealId,
    financingStructureId: input.financingStructureId,
    financingStructureVersion: input.financingStructureVersion,
    activeContext: input.activeContext,
    scenarioId: input.scenarioId,
    debtScheduleResultIds,
    debtScheduleResultHashes,
    underwritingSnapshotId: input.underwritingSnapshotId,
    underwritingSnapshotVersion: input.underwritingSnapshotVersion,
    underwritingRunId: input.underwritingRunId,
    strategyRankingId: input.strategyRankingId,
    strategyRankingVersion: input.strategyRankingVersion,
    cockpitProjectionId: input.cockpitProjectionId,
    cockpitProjectionVersion: input.cockpitProjectionVersion,
  });
}

export function buildFinancingReunderwritingResult(input: Omit<FinancingReunderwritingResult, "contractVersion" | "resultHash">): FinancingReunderwritingResult {
  const basis = {
    workspaceId: input.workspaceId,
    dealId: input.dealId,
    financingStructureId: input.financingStructureId,
    financingStructureVersion: input.financingStructureVersion,
    activeContext: input.activeContext,
    scenarioId: input.scenarioId,
    priorUnderwritingSnapshotId: input.priorUnderwritingSnapshotId,
    newUnderwritingSnapshotId: input.newUnderwritingSnapshotId,
    newUnderwritingSnapshotVersion: input.newUnderwritingSnapshotVersion,
    calculationStatus: input.calculationStatus,
    changedAuthoritativeMetrics: input.changedAuthoritativeMetrics,
    staleDownstreamResultIds: [...input.staleDownstreamResultIds].sort(),
    strategyReevaluationStatus: input.strategyReevaluationStatus,
    decisionCockpitRefreshStatus: input.decisionCockpitRefreshStatus,
    comparisonRefreshStatus: input.comparisonRefreshStatus,
    versionGraph: input.versionGraph,
    warnings: [...input.warnings].sort(),
    failures: [...input.failures].sort((a, b) => `${a.stage}:${a.code}`.localeCompare(`${b.stage}:${b.code}`)),
    generatedAt: input.generatedAt,
  };

  return deepFreeze({
    contractVersion: FINANCEIQ_REUNDERWRITING_CONTRACT_VERSION,
    ...basis,
    resultHash: stableHash(basis),
  });
}

export function statusAfterFailure(input: {
  stage: FinancingReunderwritingStage;
  hasPriorValidResult: boolean;
}): FinancingReunderwritingStatus {
  if (input.stage === "underwriting") {
    return input.hasPriorValidResult ? "failed_with_prior_valid_result" : "failed_without_prior_valid_result";
  }
  return input.hasPriorValidResult ? "failed_with_prior_valid_result" : "blocked";
}

function compareDebtTranches(changes: FinancingMaterialChange[], before: readonly DebtTranche[], after: readonly DebtTranche[]) {
  const beforeIds = sortedIds(before, (tranche) => tranche.debtTrancheId);
  const afterIds = sortedIds(after, (tranche) => tranche.debtTrancheId);
  pushIfChanged(changes, "debt_tranche_composition_changed", "debtTranches", beforeIds, afterIds);

  for (const tranche of after) {
    const prior = before.find((entry) => entry.debtTrancheId === tranche.debtTrancheId);
    if (!prior) continue;
    const prefix = `debtTranches.${tranche.debtTrancheId}`;
    pushIfChanged(changes, "principal_changed", `${prefix}.principalAmount`, prior.principalAmount, tranche.principalAmount);
    pushIfChanged(changes, "funded_amount_changed", `${prefix}.fundedAmount`, prior.fundedAmount, tranche.fundedAmount);
    pushIfChanged(changes, "commitment_amount_changed", `${prefix}.commitmentAmount`, prior.commitmentAmount, tranche.commitmentAmount);
    pushIfChanged(changes, "rate_changed", `${prefix}.rate`, rateBasis(prior), rateBasis(tranche));
    pushIfChanged(changes, "amortization_changed", `${prefix}.amortizationMonths`, prior.amortizationMonths, tranche.amortizationMonths);
    pushIfChanged(changes, "maturity_changed", `${prefix}.maturityMonths`, prior.maturityMonths, tranche.maturityMonths);
    pushIfChanged(changes, "interest_only_changed", `${prefix}.interestOnlyMonths`, prior.interestOnlyMonths, tranche.interestOnlyMonths);
    pushIfChanged(changes, "payment_frequency_changed", `${prefix}.paymentFrequency`, prior.paymentFrequency, tranche.paymentFrequency);
    pushIfChanged(changes, "balloon_changed", `${prefix}.hasBalloon`, prior.hasBalloon, tranche.hasBalloon);
    pushIfChanged(changes, "fees_changed", `${prefix}.fees`, prior.fees, tranche.fees);
    pushIfChanged(changes, "prepayment_changed", `${prefix}.prepayment`, prepaymentBasis(prior), prepaymentBasis(tranche));
  }
}

function compareEquityTranches(changes: FinancingMaterialChange[], before: readonly EquityTranche[], after: readonly EquityTranche[]) {
  const beforeIds = sortedIds(before, (tranche) => tranche.equityTrancheId);
  const afterIds = sortedIds(after, (tranche) => tranche.equityTrancheId);
  pushIfChanged(changes, "equity_terms_changed", "equityTranches", beforeIds, afterIds);

  for (const tranche of after) {
    const prior = before.find((entry) => entry.equityTrancheId === tranche.equityTrancheId);
    if (!prior) continue;
    const prefix = `equityTranches.${tranche.equityTrancheId}`;
    pushIfChanged(changes, "equity_contribution_changed", `${prefix}.contributionAmount`, prior.contributionAmount, tranche.contributionAmount);
    pushIfChanged(changes, "equity_terms_changed", `${prefix}.terms`, equityTermsBasis(prior), equityTermsBasis(tranche));
  }
}

function pushIfChanged(changes: FinancingMaterialChange[], code: FinancingMaterialChangeCode, fieldPath: string, before: unknown, after: unknown) {
  if (stableSerialize(before) !== stableSerialize(after)) {
    changes.push(change(code, fieldPath, before, after));
  }
}

function change(code: FinancingMaterialChangeCode, fieldPath: string, before: unknown, after: unknown): FinancingMaterialChange {
  return { code, fieldPath, before, after, description: descriptionFor(code, before, after) };
}

function descriptionFor(code: FinancingMaterialChangeCode, before: unknown, after: unknown) {
  const label = code.replace(/_/g, " ");
  return `${label} from ${displayValue(before)} to ${displayValue(after)}`;
}

function displayValue(value: unknown) {
  if (value === undefined) return "unset";
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return stableHash(value);
}

function sortedIds<T>(items: readonly T[], select: (item: T) => string) {
  return items.map(select).sort();
}

function rateBasis(tranche: DebtTranche) {
  return {
    rateType: tranche.rateType,
    statedRate: tranche.statedRate,
    indexName: tranche.indexName,
    marginRate: tranche.marginRate,
    rateFloor: tranche.rateFloor,
    rateCap: tranche.rateCap,
  };
}

function prepaymentBasis(tranche: DebtTranche) {
  return {
    prepaymentType: tranche.prepaymentType,
    prepaymentTerms: tranche.prepaymentTerms,
  };
}

function equityTermsBasis(tranche: EquityTranche) {
  return {
    contributionTiming: tranche.contributionTiming,
    ownershipPercentage: tranche.ownershipPercentage,
    preferredReturnTerms: tranche.preferredReturnTerms,
    waterfallTerms: tranche.waterfallTerms,
    promoteTerms: tranche.promoteTerms,
    distributionPriority: tranche.distributionPriority,
    capitalCallTerms: tranche.capitalCallTerms,
    dilutionTerms: tranche.dilutionTerms,
    fees: tranche.fees,
  };
}

function dedupeChanges(changes: FinancingMaterialChange[]) {
  const seen = new Set<string>();
  return changes.filter((entry) => {
    const key = `${entry.code}:${entry.fieldPath}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => `${a.fieldPath}:${a.code}`.localeCompare(`${b.fieldPath}:${b.code}`));
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
    for (const entry of Object.values(value)) deepFreeze(entry);
  }
  return value;
}
