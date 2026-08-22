import {
  FINANCEIQ_CONSTRAINT_CONTRACT_VERSION,
  FINANCEIQ_DEBT_SCHEDULE_PROJECTION_VERSION,
  FINANCEIQ_FEASIBILITY_PROJECTION_VERSION,
  FINANCEIQ_SCENARIO_COMPARISON_CONTRACT_VERSION,
  FINANCEIQ_PROJECTION_CONTRACT_VERSION,
  FINANCEIQ_SCENARIO_COMPARISON_RESULT_VERSION,
  FINANCEIQ_STRUCTURE_CONTRACT_VERSION,
  type ActiveFinancingSelectionResult,
  type CapitalSource,
  type DebtScheduleProjection,
  type DebtTranche,
  type EquityTranche,
  type FinancingCondition,
  type FinancingCovenant,
  type FinancingProjection,
  type FinancingScenarioComparisonResult,
  type FinancingStructure,
} from "./financeIQ";
import { supabase } from "./supabase";
import type { Json } from "./supabaseDatabase.types";

type RpcClient = {
  rpc<T = unknown>(name: string, args?: Record<string, unknown>): Promise<{ data: T | null; error: { message?: string } | null }>;
};

type JsonRecord = Record<string, unknown>;
type FinanceIQJsonRecord = Record<string, Json>;

export type FinanceIQWorkspaceData = {
  projections: FinancingProjection[];
  selectedStructure?: FinancingStructure;
  capitalSources: CapitalSource[];
  debtTranches: DebtTranche[];
  equityTranches: EquityTranche[];
  debtSchedules: DebtScheduleProjection[];
  conditions: FinancingCondition[];
  covenants: FinancingCovenant[];
  comparison?: FinancingScenarioComparisonResult;
};

export async function loadFinanceIQWorkspace(dealId: string, selectedStructureId?: string): Promise<FinanceIQWorkspaceData> {
  const projections = await callRpc<JsonRecord[]>("list_financing_structure_projection", { target_deal_id: dealId }).then((rows) => rows.map(mapProjection));
  const selected = projections.find((projection) => projection.financingStructureId === selectedStructureId)
    ?? projections.find((projection) => projection.isActive)
    ?? projections[0];
  if (!selected) {
    return { projections, capitalSources: [], debtTranches: [], equityTranches: [], debtSchedules: [], conditions: [], covenants: [] };
  }

  const [detailRows, debtSchedules, conditions, covenants, constraints] = await Promise.all([
    callRpc<JsonRecord[]>("load_financing_structure_detail", { target_financing_structure_id: selected.financingStructureId }),
    callRpc<JsonRecord[]>("list_financeiq_debt_schedule_projection", { target_financing_structure_id: selected.financingStructureId }).then((rows) => rows.map(mapDebtScheduleProjection)),
    callRpc<JsonRecord[]>("load_financing_conditions", { target_financing_structure_id: selected.financingStructureId }).then((rows) => rows.map(mapCondition)),
    callRpc<JsonRecord[]>("load_financing_covenants", { target_financing_structure_id: selected.financingStructureId }).then((rows) => rows.map(mapCovenant)),
    callRpc<JsonRecord[]>("load_financing_constraint_projection", { target_financing_structure_id: selected.financingStructureId }).catch(() => []),
  ]);
  const enrichedProjection = enrichProjection(selected, constraints[0]);
  const detail = splitStructureDetail(detailRows);

  return {
    projections: projections.map((projection) => projection.financingStructureId === enrichedProjection.financingStructureId ? enrichedProjection : projection),
    selectedStructure: detail.structure,
    capitalSources: detail.capitalSources,
    debtTranches: detail.debtTranches,
    equityTranches: detail.equityTranches,
    debtSchedules,
    conditions,
    covenants,
  };
}

export async function loadFinanceIQComparison(comparisonId: string): Promise<FinancingScenarioComparisonResult> {
  const [row] = await callRpc<JsonRecord[]>("load_financing_comparison", { target_comparison_id: comparisonId });
  if (!row) throw new Error("Financing comparison is not available.");
  return mapComparison(row);
}

export async function selectActiveFinancingStructure(financingStructureId: string, expectedVersion: number): Promise<ActiveFinancingSelectionResult> {
  const [row] = await callRpc<JsonRecord[]>("select_active_financing_structure", {
    target_financing_structure_id: financingStructureId,
    expected_version: expectedVersion,
    idempotency_key: `financeiq-ui-select-active-${financingStructureId}-${expectedVersion}-${Date.now()}`,
  });
  if (!row) throw new Error("BRIX did not confirm the active financing change.");
  return {
    financingStructureId: stringValue(row.financing_structure_id),
    financingStructureVersion: numberValue(row.financing_structure_version) ?? expectedVersion,
    workspaceId: stringValue(row.workspace_id),
    dealId: stringValue(row.deal_id),
    previouslyActiveFinancingStructureId: optionalString(row.previously_active_financing_structure_id),
    activeContext: (stringValue(row.active_context) || "current_deal") as ActiveFinancingSelectionResult["activeContext"],
    scenarioId: optionalString(row.scenario_id),
  };
}

export async function updateFinancingStructure(financingStructureId: string, expectedVersion: number, input: Partial<Pick<FinancingStructure, "name" | "purpose" | "status" | "verificationState" | "sourceClassification" | "confidence">>) {
  return callRpc<JsonRecord[]>("update_financing_structure", {
    target_financing_structure_id: financingStructureId,
    structure_input: input,
    expected_version: expectedVersion,
    idempotency_key: `financeiq-ui-update-structure-${financingStructureId}-${expectedVersion}-${Date.now()}`,
  });
}

export async function saveDebtTranche(financingStructureId: string, input: Partial<DebtTranche>, expectedVersion?: number) {
  const debtTrancheInput = { ...input, id: input.debtTrancheId };
  return callRpc<JsonRecord[]>("upsert_debt_tranche", {
    target_financing_structure_id: financingStructureId,
    debt_tranche_input: debtTrancheInput,
    expected_version: expectedVersion ?? null,
    idempotency_key: `financeiq-ui-upsert-debt-${financingStructureId}-${input.debtTrancheId ?? "new"}-${Date.now()}`,
  });
}

export async function saveEquityTranche(financingStructureId: string, input: Partial<EquityTranche>, expectedVersion?: number) {
  const equityTrancheInput = { ...input, id: input.equityTrancheId };
  return callRpc<JsonRecord[]>("upsert_equity_tranche", {
    target_financing_structure_id: financingStructureId,
    equity_tranche_input: equityTrancheInput,
    expected_version: expectedVersion ?? null,
    idempotency_key: `financeiq-ui-upsert-equity-${financingStructureId}-${input.equityTrancheId ?? "new"}-${Date.now()}`,
  });
}

async function callRpc<T>(name: string, args: Record<string, unknown>) {
  const client = supabase as unknown as RpcClient;
  const { data, error } = await client.rpc<T>(name, args);
  if (error) throw new Error(error.message ?? `BRIX could not load ${name}.`);
  return (data ?? []) as T;
}

function splitStructureDetail(rows: JsonRecord[]) {
  let structure: FinancingStructure | undefined;
  const capitalSources: CapitalSource[] = [];
  const debtTranches: DebtTranche[] = [];
  const equityTranches: EquityTranche[] = [];
  for (const row of rows) {
    const payload = objectValue(row.payload);
    const recordType = stringValue(row.record_type);
    if (recordType === "structure") structure = mapStructure(row, payload);
    if (recordType === "capital_source") capitalSources.push(mapCapitalSource(row, payload));
    if (recordType === "debt_tranche") debtTranches.push(mapDebtTranche(row, payload));
    if (recordType === "equity_tranche") equityTranches.push(mapEquityTranche(row, payload));
  }
  return { structure, capitalSources, debtTranches, equityTranches };
}

function enrichProjection(projection: FinancingProjection, row?: JsonRecord): FinancingProjection {
  if (!row) return projection;
  return {
    ...projection,
    unresolvedConditionCount: numberValue(row.unresolved_condition_count),
    blockingConditionCount: numberValue(row.blocking_condition_count),
    failedCovenantCount: numberValue(row.failed_covenant_count),
    uncertainCovenantCount: numberValue(row.uncertain_covenant_count),
    feasibilityStatus: optionalString(row.feasibility_status) as FinancingProjection["feasibilityStatus"],
    feasibilityVersion: numberValue(row.feasibility_version),
    lastEvaluatedAt: optionalString(row.last_evaluated_at),
    stale: Boolean(row.stale),
    verificationSummary: objectValue(row.verification_summary) as FinancingProjection["verificationSummary"],
  };
}

function mapProjection(row: JsonRecord): FinancingProjection {
  return {
    contractVersion: FINANCEIQ_PROJECTION_CONTRACT_VERSION,
    financingStructureId: stringValue(row.financing_structure_id),
    financingStructureVersion: numberValue(row.financing_structure_version) ?? 1,
    workspaceId: stringValue(row.workspace_id),
    dealId: stringValue(row.deal_id),
    name: stringValue(row.name) || "Financing structure",
    purpose: (stringValue(row.purpose) || "acquisition") as FinancingProjection["purpose"],
    status: (stringValue(row.status) || "draft") as FinancingProjection["status"],
    currency: stringValue(row.currency) || "USD",
    verificationState: (stringValue(row.verification_state) || "unknown") as FinancingProjection["verificationState"],
    sourceClassification: (stringValue(row.source_classification) || "unknown") as FinancingProjection["sourceClassification"],
    confidence: numberValue(row.confidence) ?? 0,
    isActive: Boolean(row.is_active),
    activeContext: (stringValue(row.active_context) || "current_deal") as FinancingProjection["activeContext"],
    scenarioId: optionalString(row.scenario_id),
    effectiveAt: optionalString(row.effective_at),
    expiresAt: optionalString(row.expires_at),
    isExpired: Boolean(row.is_expired),
    capitalSourceCount: numberValue(row.capital_source_count) ?? 0,
    debtTrancheCount: numberValue(row.debt_tranche_count) ?? 0,
    equityTrancheCount: numberValue(row.equity_tranche_count) ?? 0,
    updatedAt: stringValue(row.updated_at),
    loadedAt: stringValue(row.loaded_at),
  };
}

function mapStructure(row: JsonRecord, payload: JsonRecord): FinancingStructure {
  return {
    ...baseProvenance(row, payload),
    contractVersion: FINANCEIQ_STRUCTURE_CONTRACT_VERSION,
    financingStructureId: stringValue(row.record_id),
    financingStructureVersion: numberValue(row.record_version) ?? 1,
    workspaceId: stringValue(row.workspace_id),
    dealId: stringValue(row.deal_id),
    name: stringValue(row.label) || "Financing structure",
    purpose: (stringValue(payload.purpose) || "acquisition") as FinancingStructure["purpose"],
    status: (stringValue(row.status) || "draft") as FinancingStructure["status"],
    currency: stringValue(payload.currency) || "USD",
    isActive: Boolean(payload.is_active),
    activeContext: (stringValue(payload.active_context) || "current_deal") as FinancingStructure["activeContext"],
    scenarioId: optionalString(payload.scenario_id),
    activeUnderwritingSnapshotId: optionalString(payload.active_underwriting_snapshot_id),
    supersedesFinancingStructureId: optionalString(payload.supersedes_financing_structure_id),
    supersededByFinancingStructureId: optionalString(payload.superseded_by_financing_structure_id),
    archivedAt: optionalString(payload.archived_at),
    createdAt: stringValue(payload.created_at),
    updatedAt: stringValue(row.updated_at),
  };
}

function mapCapitalSource(row: JsonRecord, payload: JsonRecord): CapitalSource {
  return {
    ...baseProvenance(row, payload),
    capitalSourceId: stringValue(row.record_id),
    capitalSourceVersion: numberValue(row.record_version) ?? 1,
    workspaceId: stringValue(row.workspace_id),
    financingStructureId: stringValue(row.financing_structure_id),
    sourceType: (stringValue(payload.source_type) || "other") as CapitalSource["sourceType"],
    providerLabel: optionalString(payload.provider_label),
    providerContactId: optionalString(payload.provider_contact_id),
    providerOrganizationId: optionalString(payload.provider_organization_id),
    proposedAmount: numberValue(payload.proposed_amount),
    committedAmount: numberValue(payload.committed_amount),
    currency: stringValue(payload.currency) || "USD",
    status: (stringValue(row.status) || "draft") as CapitalSource["status"],
    position: numberValue(payload.position) ?? 0,
    archivedAt: optionalString(payload.archived_at),
  };
}

function mapDebtTranche(row: JsonRecord, payload: JsonRecord): DebtTranche {
  return {
    ...baseProvenance(row, payload),
    debtTrancheId: stringValue(row.record_id),
    debtTrancheVersion: numberValue(row.record_version) ?? 1,
    workspaceId: stringValue(row.workspace_id),
    financingStructureId: stringValue(row.financing_structure_id),
    capitalSourceId: optionalString(payload.capital_source_id),
    label: stringValue(row.label) || "Debt tranche",
    lenderLabel: optionalString(payload.lender_label),
    lenderContactId: optionalString(payload.lender_contact_id),
    lenderOrganizationId: optionalString(payload.lender_organization_id),
    principalAmount: numberValue(payload.principal_amount),
    commitmentAmount: numberValue(payload.commitment_amount),
    fundedAmount: numberValue(payload.funded_amount),
    rateType: (stringValue(payload.rate_type) || "unknown") as DebtTranche["rateType"],
    statedRate: numberValue(payload.stated_rate),
    indexName: optionalString(payload.index_name),
    marginRate: numberValue(payload.margin_rate),
    rateFloor: numberValue(payload.rate_floor),
    rateCap: numberValue(payload.rate_cap),
    amortizationMonths: numberValue(payload.amortization_months),
    maturityMonths: numberValue(payload.maturity_months),
    interestOnlyMonths: numberValue(payload.interest_only_months),
    paymentFrequency: (stringValue(payload.payment_frequency) || "monthly") as DebtTranche["paymentFrequency"],
    hasBalloon: Boolean(payload.has_balloon),
    points: numberValue(payload.points),
    fees: arrayValue(payload.fees),
    prepaymentType: (stringValue(payload.prepayment_type) || "unknown") as DebtTranche["prepaymentType"],
    prepaymentTerms: optionalString(payload.prepayment_terms),
    recourseType: (stringValue(payload.recourse_type) || "unknown") as DebtTranche["recourseType"],
    guaranteeTerms: optionalString(payload.guarantee_terms),
    collateralDescription: optionalString(payload.collateral_description),
    drawMetadata: jsonObjectValue(payload.draw_metadata),
    extensionMetadata: jsonObjectValue(payload.extension_metadata),
    reserveEscrowMetadata: jsonObjectValue(payload.reserve_escrow_metadata),
    status: (stringValue(row.status) || "draft") as DebtTranche["status"],
    archivedAt: optionalString(payload.archived_at),
  };
}

function mapEquityTranche(row: JsonRecord, payload: JsonRecord): EquityTranche {
  return {
    ...baseProvenance(row, payload),
    equityTrancheId: stringValue(row.record_id),
    equityTrancheVersion: numberValue(row.record_version) ?? 1,
    workspaceId: stringValue(row.workspace_id),
    financingStructureId: stringValue(row.financing_structure_id),
    capitalSourceId: optionalString(payload.capital_source_id),
    label: stringValue(row.label) || "Equity tranche",
    contributorLabel: optionalString(payload.contributor_label),
    contributorContactId: optionalString(payload.contributor_contact_id),
    contributorOrganizationId: optionalString(payload.contributor_organization_id),
    contributionAmount: numberValue(payload.contribution_amount),
    currency: stringValue(payload.currency) || "USD",
    contributionTiming: jsonObjectValue(payload.contribution_timing),
    ownershipPercentage: numberValue(payload.ownership_percentage),
    controlTerms: optionalString(payload.control_terms),
    votingTerms: optionalString(payload.voting_terms),
    preferredReturnTerms: jsonObjectValue(payload.preferred_return_terms),
    waterfallTerms: jsonObjectValue(payload.waterfall_terms),
    promoteTerms: jsonObjectValue(payload.promote_terms),
    distributionPriority: numberValue(payload.distribution_priority) ?? 1,
    capitalCallTerms: optionalString(payload.capital_call_terms),
    dilutionTerms: optionalString(payload.dilution_terms),
    fees: arrayValue(payload.fees),
    transferTerms: optionalString(payload.transfer_terms),
    removalTerms: optionalString(payload.removal_terms),
    buySellTerms: optionalString(payload.buy_sell_terms),
    status: (stringValue(row.status) || "draft") as EquityTranche["status"],
    archivedAt: optionalString(payload.archived_at),
  };
}

function mapDebtScheduleProjection(row: JsonRecord): DebtScheduleProjection {
  return {
    contractVersion: FINANCEIQ_DEBT_SCHEDULE_PROJECTION_VERSION,
    workspaceId: stringValue(row.workspace_id),
    dealId: stringValue(row.deal_id),
    financingStructureId: stringValue(row.financing_structure_id),
    financingStructureVersion: numberValue(row.financing_structure_version) ?? 1,
    debtTrancheId: stringValue(row.debt_tranche_id),
    debtTrancheVersion: numberValue(row.debt_tranche_version) ?? 1,
    debtTrancheLabel: stringValue(row.debt_tranche_label) || "Debt tranche",
    resultId: optionalString(row.result_id),
    scheduleType: optionalString(row.schedule_type),
    status: (stringValue(row.schedule_status) || "not_calculated") as DebtScheduleProjection["status"],
    engineVersion: optionalString(row.engine_version),
    inputHash: optionalString(row.input_hash),
    resultHash: optionalString(row.result_hash),
    currency: stringValue(row.currency) || "USD",
    periodCount: numberValue(row.period_count),
    firstPeriodicDebtService: numberValue(row.first_periodic_debt_service),
    finalPeriodicDebtService: numberValue(row.final_periodic_debt_service),
    totalPrincipalPaid: numberValue(row.total_principal_paid),
    totalInterestPaid: numberValue(row.total_interest_paid),
    totalBalloonPaid: numberValue(row.total_balloon_paid),
    totalDebtService: numberValue(row.total_debt_service),
    warningCount: numberValue(row.warning_count) ?? 0,
    latestCalculatedAt: optionalString(row.latest_calculated_at),
    loadedAt: stringValue(row.loaded_at),
  };
}

function mapCondition(row: JsonRecord): FinancingCondition {
  return {
    ...baseProvenance(row, row),
    contractVersion: FINANCEIQ_CONSTRAINT_CONTRACT_VERSION,
    conditionId: stringValue(row.id),
    conditionVersion: numberValue(row.version) ?? 1,
    workspaceId: stringValue(row.workspace_id),
    dealId: stringValue(row.deal_id),
    financingStructureId: stringValue(row.financing_structure_id),
    debtTrancheId: optionalString(row.debt_tranche_id),
    capitalSourceId: optionalString(row.capital_source_id),
    title: stringValue(row.title) || "Financing condition",
    description: optionalString(row.description),
    conditionType: (stringValue(row.condition_type) || "other") as FinancingCondition["conditionType"],
    status: (stringValue(row.status) || "unknown") as FinancingCondition["status"],
    responsiblePartyType: optionalString(row.responsible_party_type),
    responsibleUserId: optionalString(row.responsible_user_id),
    responsibleContactId: optionalString(row.responsible_contact_id),
    dueDate: optionalString(row.due_date),
    requiredBeforeStage: optionalString(row.required_before_stage),
    taskId: optionalString(row.task_id),
    deadlineId: optionalString(row.deadline_id),
    waiverState: (stringValue(row.waiver_state) || "none") as FinancingCondition["waiverState"],
    waiverSourceEvidenceId: optionalString(row.waiver_source_evidence_id),
    conflictState: (stringValue(row.conflict_state) || "none") as FinancingCondition["conflictState"],
    governingSourceStatus: (stringValue(row.governing_source_status) || "not_selected") as FinancingCondition["governingSourceStatus"],
    resolvedAt: optionalString(row.resolved_at),
    archivedAt: optionalString(row.archived_at),
    supersedesConditionId: optionalString(row.supersedes_condition_id),
    supersededByConditionId: optionalString(row.superseded_by_condition_id),
  };
}

function mapCovenant(row: JsonRecord): FinancingCovenant {
  return {
    ...baseProvenance(row, row),
    contractVersion: FINANCEIQ_CONSTRAINT_CONTRACT_VERSION,
    covenantId: stringValue(row.id),
    covenantVersion: numberValue(row.version) ?? 1,
    workspaceId: stringValue(row.workspace_id),
    dealId: stringValue(row.deal_id),
    financingStructureId: stringValue(row.financing_structure_id),
    debtTrancheId: optionalString(row.debt_tranche_id),
    covenantType: (stringValue(row.covenant_type) || "other") as FinancingCovenant["covenantType"],
    metricKey: optionalString(row.metric_key) as FinancingCovenant["metricKey"],
    comparisonOperator: optionalString(row.comparison_operator) as FinancingCovenant["comparisonOperator"],
    thresholdValue: numberValue(row.threshold_value),
    secondaryThresholdValue: numberValue(row.secondary_threshold_value),
    measurementPeriod: optionalString(row.measurement_period),
    testFrequency: optionalString(row.test_frequency),
    curePeriodDays: numberValue(row.cure_period_days),
    cureDescription: optionalString(row.cure_description),
    consequence: optionalString(row.consequence),
    isHardConstraint: Boolean(row.is_hard_constraint),
    status: (stringValue(row.status) || "unknown") as FinancingCovenant["status"],
    conflictState: (stringValue(row.conflict_state) || "none") as FinancingCovenant["conflictState"],
    governingSourceStatus: (stringValue(row.governing_source_status) || "not_selected") as FinancingCovenant["governingSourceStatus"],
    archivedAt: optionalString(row.archived_at),
    supersedesCovenantId: optionalString(row.supersedes_covenant_id),
    supersededByCovenantId: optionalString(row.superseded_by_covenant_id),
  };
}

function mapComparison(row: JsonRecord): FinancingScenarioComparisonResult {
  const payload = objectValue(row.result_payload);
  return {
    contractVersion: FINANCEIQ_SCENARIO_COMPARISON_CONTRACT_VERSION,
    resultVersion: FINANCEIQ_SCENARIO_COMPARISON_RESULT_VERSION,
    comparisonVersion: stringValue(payload.comparisonVersion) || "financeiq-scenario-comparison-v1",
    workspaceId: stringValue(row.workspace_id),
    dealId: stringValue(row.deal_id),
    comparedAt: stringValue(row.compared_at),
    comparisonEffectiveAt: stringValue(payload.comparisonEffectiveAt) || stringValue(row.compared_at),
    dimensionsEvaluated: arrayValue(payload.dimensionsEvaluated ?? payload.requestedDimensions) as FinancingScenarioComparisonResult["dimensionsEvaluated"],
    status: (stringValue(row.status) || "insufficient_options") as FinancingScenarioComparisonResult["status"],
    clearWinnerFinancingStructureId: optionalString(row.clear_winner_financing_structure_id),
    noDecisionReason: optionalString(payload.noDecisionReason),
    orderedStructures: arrayValue(payload.orderedStructures ?? payload.rows) as FinancingScenarioComparisonResult["orderedStructures"],
    tradeoffs: arrayValue(payload.tradeoffs) as FinancingScenarioComparisonResult["tradeoffs"],
    excludedStructures: arrayValue(payload.excludedStructures) as FinancingScenarioComparisonResult["excludedStructures"],
    missingComparisonInputs: arrayValue(payload.missingComparisonInputs) as FinancingScenarioComparisonResult["missingComparisonInputs"],
    blockingIssues: arrayValue(payload.blockingIssues) as FinancingScenarioComparisonResult["blockingIssues"],
    resultHash: stringValue(row.result_hash),
    stale: Boolean(row.stale),
    staleReasons: arrayValue(row.stale_reasons) as string[],
  };
}

function baseProvenance(row: JsonRecord, payload: JsonRecord) {
  return {
    sourceClassification: (stringValue(row.source_classification) || stringValue(payload.source_classification) || "unknown") as never,
    verificationState: (stringValue(row.verification_state) || stringValue(payload.verification_state) || "unknown") as never,
    sourceEvidenceId: optionalString(payload.source_evidence_id),
    sourceRecordId: optionalString(payload.source_record_id),
    sourceAnchor: jsonObjectValue(payload.source_anchor),
    effectiveAt: optionalString(payload.effective_at),
    expiresAt: optionalString(payload.expires_at),
    confidence: numberValue(payload.confidence) ?? 0,
  };
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function optionalString(value: unknown) {
  const candidate = stringValue(value).trim();
  return candidate.length > 0 ? candidate : undefined;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function objectValue(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function jsonObjectValue(value: unknown): FinanceIQJsonRecord {
  return objectValue(value) as FinanceIQJsonRecord;
}

function arrayValue(value: unknown) {
  return Array.isArray(value) ? value : [];
}
