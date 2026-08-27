import { supabase } from "./supabase";
import type { Json } from "./supabaseDatabase.types";
import type {
  ContractAnalysisState,
  ContractCurrentnessState,
  ContractDocumentClassificationState,
  ContractPerspective,
  ContractType,
  ContractVerificationState,
} from "./contractIQ";

type QueryBuilder = {
  select(columns: string): {
    eq(column: string, value: string): {
      order(column: string, options?: { ascending?: boolean }): Promise<{ data: JsonRecord[] | null; error: { message?: string } | null }>;
    };
  };
};

type RpcClient = {
  rpc<T = unknown>(name: string, args?: Record<string, unknown>): Promise<{ data: T | null; error: { message?: string } | null }>;
  from(name: string): QueryBuilder;
};

type JsonRecord = Record<string, unknown>;
type JsonObject = Record<string, Json>;

export type ContractSourceAnchorValue = JsonObject;

export type ContractProjectionRecord = {
  contractId: string;
  contractVersion: number;
  workspaceId: string;
  dealId: string;
  propertyId?: string;
  contractType: ContractType;
  title: string;
  perspective: ContractPerspective;
  status: string;
  verificationState: ContractVerificationState;
  analysisState: ContractAnalysisState;
  classificationState?: ContractDocumentClassificationState;
  extractionFreshnessState?: ContractCurrentnessState | "stale" | "failed_with_prior_valid";
  confidence: number;
  evidenceCount: number;
  partyCount: number;
  verifiedPartyCount: number;
  unverifiedPartyCount: number;
  termCount: number;
  acceptedTermCount: number;
  proposedTermCount: number;
  contingencyCount: number;
  amendmentCount: number;
  deadlineCount: number;
  findingCount: number;
  missingInputCount: number;
  unresolvedConflictCount: number;
  openQuestionCount: number;
  professionalReviewCount: number;
  priorValidAfterFailure: boolean;
  professionalReviewRequired: boolean;
  verificationSummary: JsonObject;
  projectionState: ContractAnalysisState | "archived";
  verifiedCurrentDeadlineCount: number;
  proposedDeadlineCount: number;
  uncertainDeadlineCount: number;
  missedDeadlineCount: number;
  deadlineStaleCount: number;
  deadlineConflictCount: number;
  nextDeadlineDueAt?: string;
  currentPerspectiveAnalysisState?: string;
  currentPerspective?: ContractPerspective;
  perspectiveBenefitCount: number;
  perspectiveRiskCount: number;
  perspectiveUnusualTermCount: number;
  perspectiveMissingProtectionCount: number;
  perspectiveMissingInformationCount: number;
  perspectiveConflictCount: number;
  perspectiveAmendmentImpactCount: number;
  perspectiveObligationCount: number;
  perspectiveQuestionCount: number;
  perspectiveNegotiationConceptCount: number;
  perspectiveDownstreamCandidateCount: number;
  perspectivePriorValidAvailable: boolean;
  updatedAt?: string;
  loadedAt?: string;
};

export type ContractDetailRow = {
  recordType: string;
  recordId: string;
  recordVersion: number;
  workspaceId: string;
  contractId: string;
  dealId?: string;
  propertyId?: string;
  label: string;
  status: string;
  verificationState: string;
  sourceEvidenceId?: string;
  sourceAnchor: ContractSourceAnchorValue;
  payload: JsonObject;
  updatedAt?: string;
};

export type ContractRecordDetail = {
  contractId: string;
  contractVersion: number;
  workspaceId: string;
  dealId?: string;
  propertyId?: string;
  title: string;
  contractType: ContractType;
  perspective: ContractPerspective;
  status: string;
  verificationState: ContractVerificationState;
  analysisState: ContractAnalysisState;
  confidence: number;
  sourceEvidenceId?: string;
  sourceAnchor: ContractSourceAnchorValue;
  effectiveDate?: string;
  executionDate?: string;
  expirationDate?: string;
  closingDate?: string;
  updatedAt?: string;
};

export type ContractWorkspaceDetail = {
  record?: ContractRecordDetail;
  evidenceLinks: ContractDetailRow[];
  parties: ContractDetailRow[];
  terms: ContractDetailRow[];
  deadlines: ContractDetailRow[];
  findings: ContractDetailRow[];
  conflicts: ContractDetailRow[];
  relationships: ContractDetailRow[];
  changeProposals: ContractDetailRow[];
  questions: ContractDetailRow[];
};

export type ContractDeadlineResultProjection = {
  calculationId: string;
  workspaceId: string;
  dealId?: string;
  contractId: string;
  contractDeadlineId: string;
  calculationVersion: number;
  contractDeadlineVersion: number;
  triggerAt?: string;
  triggerVerification: string;
  dueAt?: string;
  timezone: string;
  offsetValue?: number;
  offsetUnit?: string;
  countingRule?: string;
  businessDayRule?: string;
  weekendRule?: string;
  holidayCalendarVersion?: number;
  holidaysApplied: Json[];
  adjustmentApplied: JsonObject;
  sourceEvidenceId?: string;
  sourceAnchor: ContractSourceAnchorValue;
  status: string;
  warnings: string[];
  staleReason?: string;
  calculationContractVersion: string;
  deterministicHash: string;
  generatedAt?: string;
};

export type ContractPerspectiveAnalysisItem = {
  itemId: string;
  itemVersion: number;
  workspaceId: string;
  dealId?: string;
  propertyId?: string;
  contractId: string;
  analysisRunId: string;
  itemKind: "finding" | "question" | "negotiation_concept" | "professional_review_item" | "downstream_impact_candidate" | string;
  findingGroup?: string;
  findingType?: string;
  category?: string;
  severity?: string;
  title: string;
  summary: string;
  perspective?: ContractPerspective;
  sourceRefs: Json[];
  payload: JsonObject;
  professionalReviewRequired: boolean;
  downstreamMutationAllowed: boolean;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ContractAmendmentImpactProjection = {
  impactId: string;
  impactVersion: number;
  workspaceId: string;
  dealId?: string;
  propertyId?: string;
  contractId: string;
  analysisRunId: string;
  relationshipId?: string;
  baseContractId?: string;
  amendmentContractId?: string;
  impactType: string;
  impactSummary: string;
  changedTermIds: string[];
  supersededTermIds: string[];
  addedTermIds: string[];
  changedDeadlineIds: string[];
  conflictIds: string[];
  sourceRefs: Json[];
  professionalReviewRequired: boolean;
  downstreamMutationAllowed: boolean;
  deterministicHash: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ContractChangePropagationProjection = {
  contractChangePropagationId: string;
  propagationVersion: number;
  workspaceId: string;
  dealId: string;
  propertyId?: string;
  contractId: string;
  contractVersion: number;
  contractTermId: string;
  contractTermVersion: number;
  contractFindingId?: string;
  contractFindingVersion?: number;
  acceptedProposalId: string;
  acceptedProposalVersion: number;
  sourceEvidenceId: string;
  sourceAnchor: JsonObject;
  verificationState: string;
  perspective: string;
  proposalType: string;
  targetDomain: string;
  materiality: string;
  propagationStatus: string;
  affectedDomains: string[];
  underwritingStatus: string;
  strategyStatus: string;
  financeStatus: string;
  deadlineTaskStatus: string;
  cockpitStatus: string;
  timelineStatus: string;
  retryCount: number;
  priorValidReferences: string[];
  versionGraph: JsonObject;
  deterministicRequestHash: string;
  downstreamProposalCount: number;
  failedDownstreamCount: number;
  generatedAt: string;
  updatedAt: string;
  loadedAt: string;
};

export type ContractIQWorkspaceData = {
  projections: ContractProjectionRecord[];
  selectedProjection?: ContractProjectionRecord;
  detail: ContractWorkspaceDetail;
  perspectiveItems: ContractPerspectiveAnalysisItem[];
  deadlineResults: ContractDeadlineResultProjection[];
  amendmentImpacts: ContractAmendmentImpactProjection[];
  propagations: ContractChangePropagationProjection[];
};

export async function loadContractIQWorkspace(dealId: string, selectedContractId?: string): Promise<ContractIQWorkspaceData> {
  const projections = await loadContractProjections(dealId);
  const selectedProjection = projections.find((projection) => projection.contractId === selectedContractId) ?? projections[0];
  if (!selectedProjection) {
    return { projections, detail: emptyDetail(), perspectiveItems: [], deadlineResults: [], amendmentImpacts: [], propagations: [] };
  }

  const [detailRows, perspectiveItems, deadlineResults, amendmentImpacts, propagations] = await Promise.all([
    callRpc<JsonRecord[]>("load_contract_detail", { target_contract_id: selectedProjection.contractId }),
    loadContractPerspectiveItems(selectedProjection.contractId),
    loadContractDeadlineResults(selectedProjection.contractId),
    loadContractAmendmentImpacts(selectedProjection.contractId),
    loadContractChangePropagations(selectedProjection.contractId),
  ]);

  return {
    projections,
    selectedProjection,
    detail: splitContractDetail(detailRows),
    perspectiveItems,
    deadlineResults,
    amendmentImpacts,
    propagations,
  };
}

export async function propagateAcceptedContractChange(proposalId: string, expectedContractVersion: number, input: JsonObject = {}) {
  const [row] = await callRpc<JsonRecord[]>("propagate_accepted_contract_change", {
    target_contract_change_proposal_id: proposalId,
    propagation_input: input,
    expected_contract_version: expectedContractVersion,
    idempotency_key: `contractiq-ui-propagate-${proposalId}-${expectedContractVersion}-${Date.now()}`,
  });
  if (!row) throw new Error("BRIX did not confirm ContractIQ change propagation.");
  return {
    contractChangePropagationId: stringValue(row.contract_change_propagation_id),
    workspaceId: stringValue(row.workspace_id),
    contractId: stringValue(row.contract_id),
    acceptedProposalId: stringValue(row.accepted_proposal_id),
    targetDomain: stringValue(row.target_domain),
    propagationStatus: stringValue(row.propagation_status),
    downstreamProposalCount: numberValue(row.downstream_proposal_count) ?? 0,
    deterministicRequestHash: stringValue(row.deterministic_request_hash),
  };
}

export async function loadContractChangePropagations(contractId: string): Promise<ContractChangePropagationProjection[]> {
  const { data, error } = await table("contract_change_propagation_projection")
    .select("*")
    .eq("contract_id", contractId)
    .order("generated_at", { ascending: false });
  if (error) throw new Error(error.message ?? "BRIX could not load ContractIQ propagation state.");
  return (data ?? []).map(mapPropagation);
}

async function loadContractProjections(dealId: string): Promise<ContractProjectionRecord[]> {
  const { data, error } = await table("contract_projection")
    .select("*")
    .eq("deal_id", dealId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message ?? "BRIX could not load ContractIQ projections.");
  return (data ?? []).map(mapProjection);
}

async function loadContractPerspectiveItems(contractId: string): Promise<ContractPerspectiveAnalysisItem[]> {
  const { data, error } = await table("contract_perspective_analysis_items")
    .select("*")
    .eq("contract_id", contractId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message ?? "BRIX could not load ContractIQ perspective analysis.");
  return (data ?? []).map(mapPerspectiveItem);
}

async function loadContractDeadlineResults(contractId: string): Promise<ContractDeadlineResultProjection[]> {
  const { data, error } = await table("contract_deadline_results")
    .select("*")
    .eq("contract_id", contractId)
    .order("generated_at", { ascending: false });
  if (error) throw new Error(error.message ?? "BRIX could not load ContractIQ deadline results.");
  return (data ?? []).map(mapDeadlineResult);
}

async function loadContractAmendmentImpacts(contractId: string): Promise<ContractAmendmentImpactProjection[]> {
  const { data, error } = await table("contract_amendment_impact_results")
    .select("*")
    .eq("contract_id", contractId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message ?? "BRIX could not load ContractIQ amendment impacts.");
  return (data ?? []).map(mapAmendmentImpact);
}

async function callRpc<T>(name: string, args: Record<string, unknown>) {
  const { data, error } = await (supabase as unknown as RpcClient).rpc<T>(name, args);
  if (error) throw new Error(error.message ?? `BRIX could not load ${name}.`);
  return (data ?? []) as T;
}

function table(name: string) {
  return (supabase as unknown as RpcClient).from(name);
}

function splitContractDetail(rows: JsonRecord[]): ContractWorkspaceDetail {
  const detail = emptyDetail();
  for (const row of rows) {
    const normalized = mapDetailRow(row);
    if (normalized.recordType === "contract") detail.record = mapContractRecord(normalized);
    else if (normalized.recordType === "evidence_link") detail.evidenceLinks.push(normalized);
    else if (normalized.recordType === "party") detail.parties.push(normalized);
    else if (normalized.recordType === "term") detail.terms.push(normalized);
    else if (normalized.recordType === "deadline") detail.deadlines.push(normalized);
    else if (normalized.recordType === "finding") detail.findings.push(normalized);
    else if (normalized.recordType === "conflict") detail.conflicts.push(normalized);
    else if (normalized.recordType === "relationship") detail.relationships.push(normalized);
    else if (normalized.recordType === "change_proposal") detail.changeProposals.push(normalized);
    else if (normalized.recordType === "question") detail.questions.push(normalized);
  }
  return detail;
}

function emptyDetail(): ContractWorkspaceDetail {
  return { evidenceLinks: [], parties: [], terms: [], deadlines: [], findings: [], conflicts: [], relationships: [], changeProposals: [], questions: [] };
}

function mapProjection(row: JsonRecord): ContractProjectionRecord {
  return {
    contractId: stringValue(row.contract_id),
    contractVersion: numberValue(row.contract_version) ?? 1,
    workspaceId: stringValue(row.workspace_id),
    dealId: stringValue(row.deal_id),
    propertyId: optionalString(row.property_id),
    contractType: (stringValue(row.contract_type) || "other") as ContractType,
    title: stringValue(row.title) || "Contract",
    perspective: (stringValue(row.perspective) || "buyer") as ContractPerspective,
    status: stringValue(row.status) || "under_review",
    verificationState: (stringValue(row.verification_state) || "unknown") as ContractVerificationState,
    analysisState: (stringValue(row.analysis_state) || "partial") as ContractAnalysisState,
    classificationState: optionalString(row.classification_state) as ContractDocumentClassificationState | undefined,
    extractionFreshnessState: optionalString(row.extraction_freshness_state) as ContractCurrentnessState | "stale" | "failed_with_prior_valid" | undefined,
    confidence: numberValue(row.confidence) ?? 0,
    evidenceCount: numberValue(row.evidence_count) ?? 0,
    partyCount: numberValue(row.party_count) ?? 0,
    verifiedPartyCount: numberValue(row.verified_party_count) ?? 0,
    unverifiedPartyCount: numberValue(row.unverified_party_count) ?? 0,
    termCount: numberValue(row.term_count) ?? 0,
    acceptedTermCount: numberValue(row.accepted_term_count) ?? 0,
    proposedTermCount: numberValue(row.proposed_term_count) ?? 0,
    contingencyCount: numberValue(row.contingency_count) ?? 0,
    amendmentCount: numberValue(row.amendment_count) ?? 0,
    deadlineCount: numberValue(row.deadline_count) ?? 0,
    findingCount: numberValue(row.finding_count) ?? 0,
    missingInputCount: numberValue(row.missing_input_count) ?? 0,
    unresolvedConflictCount: numberValue(row.unresolved_conflict_count) ?? 0,
    openQuestionCount: numberValue(row.open_question_count) ?? 0,
    professionalReviewCount: numberValue(row.professional_review_count) ?? 0,
    priorValidAfterFailure: Boolean(row.prior_valid_after_failure),
    professionalReviewRequired: Boolean(row.professional_review_required),
    verificationSummary: objectValue(row.verification_summary) as JsonObject,
    projectionState: (stringValue(row.projection_state) || "partial") as ContractAnalysisState | "archived",
    verifiedCurrentDeadlineCount: numberValue(row.verified_current_deadline_count) ?? 0,
    proposedDeadlineCount: numberValue(row.proposed_deadline_count) ?? 0,
    uncertainDeadlineCount: numberValue(row.uncertain_deadline_count) ?? 0,
    missedDeadlineCount: numberValue(row.missed_deadline_count) ?? 0,
    deadlineStaleCount: numberValue(row.deadline_stale_count) ?? 0,
    deadlineConflictCount: numberValue(row.deadline_conflict_count) ?? 0,
    nextDeadlineDueAt: optionalString(row.next_deadline_due_at),
    currentPerspectiveAnalysisState: optionalString(row.current_perspective_analysis_state),
    currentPerspective: optionalString(row.current_perspective) as ContractPerspective | undefined,
    perspectiveBenefitCount: numberValue(row.perspective_benefit_count) ?? 0,
    perspectiveRiskCount: numberValue(row.perspective_risk_count) ?? 0,
    perspectiveUnusualTermCount: numberValue(row.perspective_unusual_term_count) ?? 0,
    perspectiveMissingProtectionCount: numberValue(row.perspective_missing_protection_count) ?? 0,
    perspectiveMissingInformationCount: numberValue(row.perspective_missing_information_count) ?? 0,
    perspectiveConflictCount: numberValue(row.perspective_conflict_count) ?? 0,
    perspectiveAmendmentImpactCount: numberValue(row.perspective_amendment_impact_count) ?? 0,
    perspectiveObligationCount: numberValue(row.perspective_obligation_count) ?? 0,
    perspectiveQuestionCount: numberValue(row.perspective_question_count) ?? 0,
    perspectiveNegotiationConceptCount: numberValue(row.perspective_negotiation_concept_count) ?? 0,
    perspectiveDownstreamCandidateCount: numberValue(row.perspective_downstream_candidate_count) ?? 0,
    perspectivePriorValidAvailable: Boolean(row.perspective_prior_valid_available),
    updatedAt: optionalString(row.updated_at),
    loadedAt: optionalString(row.loaded_at),
  };
}

function mapDetailRow(row: JsonRecord): ContractDetailRow {
  const payload = objectValue(row.payload) as JsonObject;
  return {
    recordType: stringValue(row.record_type),
    recordId: stringValue(row.record_id),
    recordVersion: numberValue(row.record_version) ?? 1,
    workspaceId: stringValue(row.workspace_id),
    contractId: stringValue(row.contract_id),
    dealId: optionalString(row.deal_id),
    propertyId: optionalString(row.property_id),
    label: stringValue(row.label) || "Contract record",
    status: stringValue(row.status) || "unknown",
    verificationState: stringValue(row.verification_state) || stringValue(payload.verification_state) || "unknown",
    sourceEvidenceId: optionalString(row.source_evidence_id) ?? optionalString(payload.source_evidence_id) ?? optionalString(payload.evidence_id),
    sourceAnchor: objectValue(row.source_anchor ?? payload.source_anchor) as ContractSourceAnchorValue,
    payload,
    updatedAt: optionalString(row.updated_at),
  };
}

function mapContractRecord(row: ContractDetailRow): ContractRecordDetail {
  return {
    contractId: row.recordId,
    contractVersion: row.recordVersion,
    workspaceId: row.workspaceId,
    dealId: row.dealId,
    propertyId: row.propertyId,
    title: row.label || "Contract",
    contractType: (stringValue(row.payload.contract_type) || "other") as ContractType,
    perspective: (stringValue(row.payload.perspective) || "buyer") as ContractPerspective,
    status: row.status,
    verificationState: row.verificationState as ContractVerificationState,
    analysisState: (stringValue(row.payload.analysis_state) || "partial") as ContractAnalysisState,
    confidence: numberValue(row.payload.confidence) ?? 0,
    sourceEvidenceId: row.sourceEvidenceId,
    sourceAnchor: row.sourceAnchor,
    effectiveDate: optionalString(row.payload.effective_date),
    executionDate: optionalString(row.payload.execution_date),
    expirationDate: optionalString(row.payload.expiration_date),
    closingDate: optionalString(row.payload.closing_date),
    updatedAt: row.updatedAt,
  };
}

function mapPerspectiveItem(row: JsonRecord): ContractPerspectiveAnalysisItem {
  return {
    itemId: stringValue(row.id),
    itemVersion: numberValue(row.version) ?? 1,
    workspaceId: stringValue(row.workspace_id),
    dealId: optionalString(row.deal_id),
    propertyId: optionalString(row.property_id),
    contractId: stringValue(row.contract_id),
    analysisRunId: stringValue(row.analysis_run_id),
    itemKind: stringValue(row.item_kind),
    findingGroup: optionalString(row.finding_group),
    findingType: optionalString(row.finding_type),
    category: optionalString(row.category),
    severity: optionalString(row.severity),
    title: stringValue(row.title) || "Perspective item",
    summary: stringValue(row.summary),
    perspective: optionalString(row.perspective) as ContractPerspective | undefined,
    sourceRefs: arrayValue(row.source_refs),
    payload: objectValue(row.payload) as JsonObject,
    professionalReviewRequired: Boolean(row.professional_review_required),
    downstreamMutationAllowed: Boolean(row.downstream_mutation_allowed),
    status: stringValue(row.status) || "current",
    createdAt: optionalString(row.created_at),
    updatedAt: optionalString(row.updated_at),
  };
}

function mapDeadlineResult(row: JsonRecord): ContractDeadlineResultProjection {
  return {
    calculationId: stringValue(row.id),
    workspaceId: stringValue(row.workspace_id),
    dealId: optionalString(row.deal_id),
    contractId: stringValue(row.contract_id),
    contractDeadlineId: stringValue(row.contract_deadline_id),
    calculationVersion: numberValue(row.calculation_version) ?? 1,
    contractDeadlineVersion: numberValue(row.contract_deadline_version) ?? 1,
    triggerAt: optionalString(row.trigger_at),
    triggerVerification: stringValue(row.trigger_verification) || "unknown",
    dueAt: optionalString(row.due_at),
    timezone: stringValue(row.timezone) || "UTC",
    offsetValue: numberValue(row.offset_value),
    offsetUnit: optionalString(row.offset_unit),
    countingRule: optionalString(row.counting_rule),
    businessDayRule: optionalString(row.business_day_rule),
    weekendRule: optionalString(row.weekend_rule),
    holidayCalendarVersion: numberValue(row.holiday_calendar_version),
    holidaysApplied: arrayValue(row.holidays_applied),
    adjustmentApplied: objectValue(row.adjustment_applied) as JsonObject,
    sourceEvidenceId: optionalString(row.source_evidence_id),
    sourceAnchor: objectValue(row.source_anchor) as ContractSourceAnchorValue,
    status: stringValue(row.status) || "unknown",
    warnings: arrayOfStrings(row.warnings),
    staleReason: optionalString(row.stale_reason),
    calculationContractVersion: stringValue(row.calculation_contract_version),
    deterministicHash: stringValue(row.deterministic_hash),
    generatedAt: optionalString(row.generated_at),
  };
}

function mapAmendmentImpact(row: JsonRecord): ContractAmendmentImpactProjection {
  return {
    impactId: stringValue(row.id),
    impactVersion: numberValue(row.version) ?? 1,
    workspaceId: stringValue(row.workspace_id),
    dealId: optionalString(row.deal_id),
    propertyId: optionalString(row.property_id),
    contractId: stringValue(row.contract_id),
    analysisRunId: stringValue(row.analysis_run_id),
    relationshipId: optionalString(row.relationship_id),
    baseContractId: optionalString(row.base_contract_id),
    amendmentContractId: optionalString(row.amendment_contract_id),
    impactType: stringValue(row.impact_type) || "amendment",
    impactSummary: stringValue(row.impact_summary),
    changedTermIds: arrayOfStrings(row.changed_term_ids),
    supersededTermIds: arrayOfStrings(row.superseded_term_ids),
    addedTermIds: arrayOfStrings(row.added_term_ids),
    changedDeadlineIds: arrayOfStrings(row.changed_deadline_ids),
    conflictIds: arrayOfStrings(row.conflict_ids),
    sourceRefs: arrayValue(row.source_refs),
    professionalReviewRequired: Boolean(row.professional_review_required),
    downstreamMutationAllowed: Boolean(row.downstream_mutation_allowed),
    deterministicHash: stringValue(row.deterministic_hash),
    status: stringValue(row.status) || "candidate_only",
    createdAt: optionalString(row.created_at),
    updatedAt: optionalString(row.updated_at),
  };
}

function mapPropagation(row: JsonRecord): ContractChangePropagationProjection {
  return {
    contractChangePropagationId: stringValue(row.contract_change_propagation_id),
    propagationVersion: numberValue(row.propagation_version) ?? 1,
    workspaceId: stringValue(row.workspace_id),
    dealId: stringValue(row.deal_id),
    propertyId: optionalString(row.property_id),
    contractId: stringValue(row.contract_id),
    contractVersion: numberValue(row.contract_version) ?? 1,
    contractTermId: stringValue(row.contract_term_id),
    contractTermVersion: numberValue(row.contract_term_version) ?? 1,
    contractFindingId: optionalString(row.contract_finding_id),
    contractFindingVersion: numberValue(row.contract_finding_version),
    acceptedProposalId: stringValue(row.accepted_proposal_id),
    acceptedProposalVersion: numberValue(row.accepted_proposal_version) ?? 1,
    sourceEvidenceId: stringValue(row.source_evidence_id),
    sourceAnchor: objectValue(row.source_anchor) as JsonObject,
    verificationState: stringValue(row.verification_state),
    perspective: stringValue(row.perspective),
    proposalType: stringValue(row.proposal_type),
    targetDomain: stringValue(row.target_domain),
    materiality: stringValue(row.materiality),
    propagationStatus: stringValue(row.propagation_status),
    affectedDomains: arrayOfStrings(row.affected_domains),
    underwritingStatus: stringValue(row.underwriting_status),
    strategyStatus: stringValue(row.strategy_status),
    financeStatus: stringValue(row.finance_status),
    deadlineTaskStatus: stringValue(row.deadline_task_status),
    cockpitStatus: stringValue(row.cockpit_status),
    timelineStatus: stringValue(row.timeline_status),
    retryCount: numberValue(row.retry_count) ?? 0,
    priorValidReferences: arrayOfStrings(row.prior_valid_references),
    versionGraph: objectValue(row.version_graph) as JsonObject,
    deterministicRequestHash: stringValue(row.deterministic_request_hash),
    downstreamProposalCount: numberValue(row.downstream_proposal_count) ?? 0,
    failedDownstreamCount: numberValue(row.failed_downstream_count) ?? 0,
    generatedAt: stringValue(row.generated_at),
    updatedAt: stringValue(row.updated_at),
    loadedAt: stringValue(row.loaded_at),
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
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function objectValue(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function arrayValue(value: unknown): Json[] {
  return Array.isArray(value) ? value as Json[] : [];
}

function arrayOfStrings(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}
