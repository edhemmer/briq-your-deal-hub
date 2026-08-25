import {
  GOVERNANCEIQ_FOUNDATION_CONTRACT_VERSION,
  GOVERNANCEIQ_PROJECTION_CONTRACT_VERSION,
  analyzeGovernanceFinancialHealth,
  analyzeGovernanceRestrictionIntelligence,
  type GovernanceAcceptanceState,
  type GovernanceDetectedConflict,
  type GovernanceDocument,
  type GovernanceDocumentHierarchyState,
  type GovernanceDocumentType,
  type GovernanceFinding,
  type GovernanceFindingCategory,
  type GovernanceFinancialPeriodInput,
  type GovernanceProjection,
  type GovernanceProjectionState,
  type GovernanceQuestionTargetRole,
  type GovernanceRestrictionSourceFinding,
  type GovernanceSourceAnchor,
  type GovernanceSourceClassification,
  type GovernanceType,
  type GovernanceVerificationState,
} from "./governanceIQ";
import { supabase } from "./supabase";
import type { Json } from "./supabaseDatabase.types";

type RpcClient = {
  rpc<T = unknown>(name: string, args?: Record<string, unknown>): Promise<{ data: T | null; error: { message?: string } | null }>;
  from(name: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        order(column: string, options?: { ascending?: boolean }): Promise<{ data: JsonRecord[] | null; error: { message?: string } | null }>;
      };
    };
  };
};

type JsonRecord = Record<string, unknown>;
type JsonObject = Record<string, Json>;

export type GovernanceQuestion = {
  questionId: string;
  questionVersion: number;
  workspaceId: string;
  governanceRecordId: string;
  governanceDocumentId?: string;
  governanceConflictId?: string;
  governanceFindingId?: string;
  question: string;
  targetRole: GovernanceQuestionTargetRole;
  whyItMatters: string;
  sourceReason: string;
  sourceAnchor: GovernanceSourceAnchor;
  status: "open" | "answered" | "dismissed" | "superseded";
  professionalReviewRecommended: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type GovernancePropagationProjection = {
  governanceChangePropagationId: string;
  workspaceId: string;
  dealId: string;
  propertyId: string;
  governanceRecordId: string;
  governanceFindingId: string;
  findingVersion: number;
  acceptanceVersion: number;
  category: string;
  materiality: string;
  impactDomains: string[];
  propagationStatus: string;
  downstreamStates: JsonObject;
  priorValidDownstream: JsonObject;
  failures: Json[];
  explanations: string[];
  versionGraph: JsonObject;
  resultHash: string;
  propagatedAt?: string;
  lastPropagatedAt?: string;
  downstreamProposalCount: number;
  underwritingProposalCount: number;
  strategyProposalCount: number;
  financeProposalCount: number;
  cockpitProposalCount: number;
  taskProposalCount: number;
  blockedProposalCount: number;
  hasPendingDownstreamReview: boolean;
};

export type GovernanceWorkspaceData = {
  projections: GovernanceProjection[];
  selectedProjection?: GovernanceProjection;
  record?: GovernanceFindingRecord;
  documents: GovernanceDocument[];
  findings: GovernanceFinding[];
  conflicts: GovernanceDetectedConflict[];
  financialPeriods: GovernanceFinancialPeriodInput[];
  questions: GovernanceQuestion[];
  propagations: GovernancePropagationProjection[];
};

export type GovernanceFindingRecord = {
  governanceRecordId: string;
  governanceRecordVersion: number;
  workspaceId: string;
  dealId?: string;
  propertyId?: string;
  name: string;
  governanceType: GovernanceType;
  status: string;
  sourceClassification: GovernanceSourceClassification;
  verificationState: GovernanceVerificationState;
  confidence: number;
  effectiveAt?: string;
  expiresAt?: string;
  updatedAt: string;
};

export async function loadGovernanceIQWorkspace(dealId: string, selectedGovernanceRecordId?: string): Promise<GovernanceWorkspaceData> {
  const projections = await callRpc<JsonRecord[]>("list_governance_record_projection", {
    target_deal_id: dealId,
    target_property_id: null,
  }).then((rows) => rows.map(mapProjection));
  const selected = projections.find((projection) => projection.governanceRecordId === selectedGovernanceRecordId) ?? projections[0];
  if (!selected) {
    return { projections, documents: [], findings: [], conflicts: [], financialPeriods: [], questions: [], propagations: [] };
  }

  const [detailRows, questions, propagationRows] = await Promise.all([
    callRpc<JsonRecord[]>("load_governance_record_detail", { target_governance_record_id: selected.governanceRecordId }),
    loadGovernanceQuestions(selected.governanceRecordId),
    loadGovernancePropagations(selected.governanceRecordId),
  ]);
  const detail = splitGovernanceDetail(detailRows);
  return {
    projections,
    selectedProjection: selected,
    ...detail,
    questions,
    propagations: propagationRows,
  };
}

export async function setGovernanceFindingAcceptance(
  findingId: string,
  acceptanceState: Extract<GovernanceAcceptanceState, "accepted" | "rejected" | "disputed">,
  expectedVersion: number,
  reason: string,
) {
  const [row] = await callRpc<JsonRecord[]>("set_governance_finding_acceptance", {
    target_governance_finding_id: findingId,
    target_acceptance_state: acceptanceState,
    expected_version: expectedVersion,
    idempotency_key: `governanceiq-ui-acceptance-${findingId}-${acceptanceState}-${expectedVersion}-${Date.now()}`,
    decision_reason: reason,
  });
  if (!row) throw new Error("BRIX did not confirm the GovernanceIQ decision.");
  return {
    governanceFindingId: stringValue(row.governance_finding_id),
    governanceFindingVersion: numberValue(row.governance_finding_version) ?? expectedVersion,
    acceptanceState: stringValue(row.acceptance_state) as GovernanceAcceptanceState,
  };
}

export async function propagateAcceptedGovernanceFinding(findingId: string, expectedVersion: number) {
  const [row] = await callRpc<JsonRecord[]>("propagate_accepted_governance_change", {
    target_governance_finding_id: findingId,
    propagation_input: { expectedFindingVersion: expectedVersion },
    idempotency_key: `governanceiq-ui-propagate-${findingId}-${expectedVersion}-${Date.now()}`,
  });
  if (!row) throw new Error("BRIX did not confirm GovernanceIQ propagation.");
  return row;
}

function splitGovernanceDetail(rows: JsonRecord[]) {
  let record: GovernanceFindingRecord | undefined;
  const documents: GovernanceDocument[] = [];
  const findings: GovernanceFinding[] = [];
  const conflicts: GovernanceDetectedConflict[] = [];
  const financialPeriods: GovernanceFinancialPeriodInput[] = [];

  for (const row of rows) {
    const recordType = stringValue(row.record_type);
    const payload = objectValue(row.payload);
    if (recordType === "record") record = mapRecord(row, payload);
    if (recordType === "document") documents.push(mapDocument(row, payload));
    if (recordType === "finding") findings.push(mapFinding(row, payload));
    if (recordType === "conflict") conflicts.push(mapConflict(row, payload));
    if (recordType === "financial") financialPeriods.push(mapFinancialPeriod(row, payload));
  }

  return { record, documents, findings, conflicts, financialPeriods };
}

function mapProjection(row: JsonRecord): GovernanceProjection {
  return {
    contractVersion: GOVERNANCEIQ_PROJECTION_CONTRACT_VERSION,
    governanceRecordId: stringValue(row.governance_record_id),
    governanceRecordVersion: numberValue(row.governance_record_version) ?? 1,
    workspaceId: stringValue(row.workspace_id),
    dealId: optionalString(row.deal_id),
    propertyId: optionalString(row.property_id),
    name: stringValue(row.name) || "Governance record",
    governanceType: (stringValue(row.governance_type) || "other_private_governance") as GovernanceType,
    status: (stringValue(row.status) || "identified") as GovernanceProjection["status"],
    projectionState: (stringValue(row.projection_state) || "partial") as GovernanceProjectionState,
    documentCount: numberValue(row.document_count) ?? 0,
    findingCount: numberValue(row.finding_count) ?? 0,
    unresolvedConflictCount: numberValue(row.unresolved_conflict_count) ?? 0,
    acceptedFindingCount: numberValue(row.accepted_finding_count) ?? 0,
    highSeverityFindingCount: numberValue(row.high_severity_finding_count) ?? 0,
    professionalReviewRequired: Boolean(row.professional_review_required),
    sourceCompleteness: (stringValue(row.source_completeness) || "partial_sources") as GovernanceProjection["sourceCompleteness"],
    verificationSummary: objectValue(row.verification_summary) as Record<string, Json>,
    updatedAt: stringValue(row.updated_at),
    loadedAt: stringValue(row.loaded_at),
  };
}

function mapRecord(row: JsonRecord, payload: JsonRecord): GovernanceFindingRecord {
  return {
    governanceRecordId: stringValue(row.record_id),
    governanceRecordVersion: numberValue(row.record_version) ?? 1,
    workspaceId: stringValue(row.workspace_id),
    dealId: optionalString(row.deal_id),
    propertyId: optionalString(row.property_id),
    name: stringValue(row.label) || "Governance record",
    governanceType: (stringValue(payload.governance_type) || "other_private_governance") as GovernanceType,
    status: stringValue(row.status) || "identified",
    sourceClassification: sourceClassification(row, payload),
    verificationState: verificationState(row, payload),
    confidence: numberValue(payload.confidence) ?? 0,
    effectiveAt: optionalString(payload.effective_at),
    expiresAt: optionalString(payload.expires_at),
    updatedAt: stringValue(row.updated_at),
  };
}

function mapDocument(row: JsonRecord, payload: JsonRecord): GovernanceDocument {
  return {
    contractVersion: GOVERNANCEIQ_FOUNDATION_CONTRACT_VERSION,
    governanceDocumentId: stringValue(row.record_id),
    governanceDocumentVersion: numberValue(row.record_version) ?? 1,
    workspaceId: stringValue(row.workspace_id),
    governanceRecordId: stringValue(row.governance_record_id),
    evidenceId: stringValue(payload.evidence_id),
    documentType: (stringValue(payload.document_type) || "other") as GovernanceDocumentType,
    title: stringValue(row.label) || "Governance document",
    hierarchyClassification: (stringValue(payload.hierarchy_classification) || "hierarchy_uncertain") as GovernanceDocumentHierarchyState,
    analysisState: (stringValue(row.status) || "not_started") as GovernanceDocument["analysisState"],
    sourceClassification: sourceClassification(row, payload),
    verificationState: verificationState(row, payload),
    confidence: numberValue(payload.confidence) ?? 0,
    sourceEvidenceId: optionalString(payload.source_evidence_id) ?? stringValue(payload.evidence_id),
    sourceRecordId: optionalString(payload.source_record_id),
    sourceAnchor: sourceAnchor(payload.source_anchor),
    effectiveAt: optionalString(payload.effective_at),
    expiresAt: optionalString(payload.expires_at),
  };
}

function mapFinding(row: JsonRecord, payload: JsonRecord): GovernanceFinding {
  return {
    contractVersion: GOVERNANCEIQ_FOUNDATION_CONTRACT_VERSION,
    governanceFindingId: stringValue(row.record_id),
    governanceFindingVersion: numberValue(row.record_version) ?? 1,
    workspaceId: stringValue(row.workspace_id),
    governanceRecordId: stringValue(row.governance_record_id),
    governanceDocumentId: optionalString(payload.governance_document_id),
    dealId: optionalString(row.deal_id),
    propertyId: optionalString(row.property_id),
    findingType: stringValue(payload.finding_type) || stringValue(payload.finding_category) || "other",
    findingCategory: (stringValue(payload.finding_category) || "other") as GovernanceFindingCategory,
    summary: stringValue(row.label) || "Governance finding",
    normalizedValue: objectValue(payload.normalized_value) as Record<string, Json>,
    normalizedRequirement: optionalString(payload.normalized_requirement),
    severity: (stringValue(payload.severity) || "unknown") as GovernanceFinding["severity"],
    impactType: (stringValue(payload.impact_type) || "other") as GovernanceFinding["impactType"],
    acceptanceState: (stringValue(row.status) || "proposed") as GovernanceAcceptanceState,
    professionalReviewRecommended: Boolean(payload.professional_review_recommended),
    sourceClassification: sourceClassification(row, payload),
    verificationState: verificationState(row, payload),
    confidence: numberValue(payload.confidence) ?? 0,
    sourceEvidenceId: optionalString(payload.source_evidence_id),
    sourceRecordId: optionalString(payload.source_record_id),
    sourceAnchor: sourceAnchor(payload.source_anchor),
    effectiveAt: optionalString(payload.effective_at),
    expiresAt: optionalString(payload.expires_at),
  };
}

function mapConflict(row: JsonRecord, payload: JsonRecord): GovernanceDetectedConflict {
  return {
    conflictType: (stringValue(payload.conflict_type) || "source_conflict") as GovernanceDetectedConflict["conflictType"],
    severity: (stringValue(payload.severity) || "unknown") as GovernanceDetectedConflict["severity"],
    category: (stringValue(payload.finding_category) || stringValue(payload.category) || "other") as GovernanceFindingCategory,
    summary: stringValue(row.label) || "Governance conflict",
    sourceAAnchor: sourceAnchor(payload.source_a_anchor),
    sourceBAnchor: sourceAnchor(payload.source_b_anchor),
    normalizedA: objectValue(payload.normalized_a) as Record<string, Json>,
    normalizedB: objectValue(payload.normalized_b) as Record<string, Json>,
    confidence: numberValue(payload.confidence) ?? 0,
    detectionMethod: "deterministic_normalized_value",
    professionalReviewRecommended: Boolean(payload.professional_review_required ?? payload.professional_review_recommended),
  };
}

function mapFinancialPeriod(row: JsonRecord, payload: JsonRecord): GovernanceFinancialPeriodInput {
  return {
    periodId: stringValue(row.record_id),
    periodStart: optionalString(payload.period_start),
    periodEnd: optionalString(payload.period_end),
    amountBasis: (stringValue(payload.amount_basis) || "unknown") as GovernanceFinancialPeriodInput["amountBasis"],
    duesAmount: numberValue(payload.dues_amount),
    duesFrequency: optionalString(payload.dues_frequency) as GovernanceFinancialPeriodInput["duesFrequency"],
    revenueAmount: numberValue(payload.revenue_amount),
    expenseAmount: numberValue(payload.expense_amount),
    reserveBalance: numberValue(payload.reserve_balance),
    delinquencyAmount: numberValue(payload.delinquency_amount),
    delinquencyRate: numberValue(payload.delinquency_rate),
    assessmentAmount: numberValue(payload.assessment_amount),
    assessmentStatus: optionalString(payload.assessment_status) as GovernanceFinancialPeriodInput["assessmentStatus"],
    associationDebtAmount: numberValue(payload.association_debt_amount),
    associationDebtServiceAmount: numberValue(payload.association_debt_service_amount),
    associationDebtMaturityDate: optionalString(payload.association_debt_maturity_date),
    associationDebtPurpose: optionalString(payload.association_debt_purpose),
    insuranceExpenseAmount: numberValue(payload.insurance_expense_amount),
    insuranceDeductibleAmount: numberValue(payload.insurance_deductible_amount),
    plannedProjectAmount: numberValue(payload.planned_project_amount),
    unitCount: numberValue(payload.unit_count),
    currency: stringValue(payload.currency) || "USD",
    sourceRefs: [{
      governanceFinancialId: stringValue(row.record_id),
      governanceFinancialVersion: numberValue(row.record_version) ?? 1,
      governanceDocumentId: optionalString(payload.governance_document_id),
      evidenceId: optionalString(payload.source_evidence_id),
      sourceRecordId: optionalString(payload.source_record_id),
      sourceAnchor: sourceAnchor(payload.source_anchor),
      verificationState: verificationState(row, payload),
      sourceClassification: sourceClassification(row, payload),
      confidence: numberValue(payload.confidence) ?? 0,
      effectiveAt: optionalString(payload.effective_at),
      expiresAt: optionalString(payload.expires_at),
    }],
  };
}

async function loadGovernanceQuestions(governanceRecordId: string): Promise<GovernanceQuestion[]> {
  const client = supabase as unknown as RpcClient;
  const { data, error } = await client
    .from("governance_questions")
    .select("*")
    .eq("governance_record_id", governanceRecordId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message ?? "BRIX could not load GovernanceIQ questions.");
  return (data ?? []).map(mapQuestion);
}

async function loadGovernancePropagations(governanceRecordId: string): Promise<GovernancePropagationProjection[]> {
  const client = supabase as unknown as RpcClient;
  const { data, error } = await client
    .from("governance_change_propagation_projection")
    .select("*")
    .eq("governance_record_id", governanceRecordId)
    .order("propagated_at", { ascending: false });
  if (error) throw new Error(error.message ?? "BRIX could not load GovernanceIQ propagation state.");
  return (data ?? []).map(mapPropagation);
}

function mapQuestion(row: JsonRecord): GovernanceQuestion {
  return {
    questionId: stringValue(row.id),
    questionVersion: numberValue(row.version) ?? 1,
    workspaceId: stringValue(row.workspace_id),
    governanceRecordId: stringValue(row.governance_record_id),
    governanceDocumentId: optionalString(row.governance_document_id),
    governanceConflictId: optionalString(row.governance_conflict_id),
    governanceFindingId: optionalString(row.governance_finding_id),
    question: stringValue(row.question),
    targetRole: (stringValue(row.target_role) || "unknown") as GovernanceQuestionTargetRole,
    whyItMatters: stringValue(row.why_it_matters),
    sourceReason: stringValue(row.source_reason),
    sourceAnchor: sourceAnchor(row.source_anchor),
    status: (stringValue(row.status) || "open") as GovernanceQuestion["status"],
    professionalReviewRecommended: Boolean(row.professional_review_recommended),
    createdAt: optionalString(row.created_at),
    updatedAt: optionalString(row.updated_at),
  };
}

function mapPropagation(row: JsonRecord): GovernancePropagationProjection {
  return {
    governanceChangePropagationId: stringValue(row.governance_change_propagation_id),
    workspaceId: stringValue(row.workspace_id),
    dealId: stringValue(row.deal_id),
    propertyId: stringValue(row.property_id),
    governanceRecordId: stringValue(row.governance_record_id),
    governanceFindingId: stringValue(row.governance_finding_id),
    findingVersion: numberValue(row.finding_version) ?? 1,
    acceptanceVersion: numberValue(row.acceptance_version) ?? 1,
    category: stringValue(row.category),
    materiality: stringValue(row.materiality),
    impactDomains: arrayOfStrings(row.impact_domains),
    propagationStatus: stringValue(row.propagation_status),
    downstreamStates: objectValue(row.downstream_states) as JsonObject,
    priorValidDownstream: objectValue(row.prior_valid_downstream) as JsonObject,
    failures: arrayValue(row.failures),
    explanations: arrayOfStrings(row.explanations),
    versionGraph: objectValue(row.version_graph) as JsonObject,
    resultHash: stringValue(row.result_hash),
    propagatedAt: optionalString(row.propagated_at),
    lastPropagatedAt: optionalString(row.last_propagated_at),
    downstreamProposalCount: numberValue(row.downstream_proposal_count) ?? 0,
    underwritingProposalCount: numberValue(row.underwriting_proposal_count) ?? 0,
    strategyProposalCount: numberValue(row.strategy_proposal_count) ?? 0,
    financeProposalCount: numberValue(row.finance_proposal_count) ?? 0,
    cockpitProposalCount: numberValue(row.cockpit_proposal_count) ?? 0,
    taskProposalCount: numberValue(row.task_proposal_count) ?? 0,
    blockedProposalCount: numberValue(row.blocked_proposal_count) ?? 0,
    hasPendingDownstreamReview: Boolean(row.has_pending_downstream_review),
  };
}

export function buildFinancialAnalysis(record: GovernanceFindingRecord | undefined, financialPeriods: GovernanceFinancialPeriodInput[]) {
  if (!record || financialPeriods.length === 0) return undefined;
  return analyzeGovernanceFinancialHealth({
    contractVersion: "governanceiq-financial-analysis-v1",
    governanceRecordId: record.governanceRecordId,
    governanceRecordVersion: record.governanceRecordVersion,
    generatedAt: new Date().toISOString(),
    periods: financialPeriods,
  });
}

export function buildRestrictionAnalysis(record: GovernanceFindingRecord | undefined, findings: GovernanceFinding[]) {
  if (!record) return [];
  return analyzeGovernanceRestrictionIntelligence({
    contractVersion: "governanceiq-restriction-intelligence-v1",
    governanceRecordId: record.governanceRecordId,
    governanceRecordVersion: record.governanceRecordVersion,
    generatedAt: new Date().toISOString(),
    findings: findings.map((finding): GovernanceRestrictionSourceFinding => ({
      governanceFindingId: finding.governanceFindingId,
      governanceFindingVersion: finding.governanceFindingVersion,
      governanceRecordId: finding.governanceRecordId,
      governanceDocumentId: finding.governanceDocumentId,
      evidenceId: finding.sourceEvidenceId,
      findingCategory: finding.findingCategory,
      normalizedValue: finding.normalizedValue,
      normalizedRequirement: finding.normalizedRequirement,
      acceptanceState: finding.acceptanceState,
      conflictState: finding.verificationState === "conflicting" ? "unresolved_conflict" : "none",
      sourceAnchor: finding.sourceAnchor,
      sourceClassification: finding.sourceClassification,
      verificationState: finding.verificationState,
      confidence: finding.confidence,
      effectiveAt: finding.effectiveAt,
      expiresAt: finding.expiresAt,
      professionalReviewRecommended: finding.professionalReviewRecommended,
    })),
  });
}

async function callRpc<T>(name: string, args: Record<string, unknown>) {
  const client = supabase as unknown as RpcClient;
  const { data, error } = await client.rpc<T>(name, args);
  if (error) throw new Error(error.message ?? `BRIX could not load ${name}.`);
  return (data ?? []) as T;
}

function sourceClassification(row: JsonRecord, payload: JsonRecord): GovernanceSourceClassification {
  return (stringValue(row.source_classification) || stringValue(payload.source_classification) || "unknown") as GovernanceSourceClassification;
}

function verificationState(row: JsonRecord, payload: JsonRecord): GovernanceVerificationState {
  return (stringValue(row.verification_state) || stringValue(payload.verification_state) || "unknown") as GovernanceVerificationState;
}

function sourceAnchor(value: unknown): GovernanceSourceAnchor {
  return objectValue(value) as GovernanceSourceAnchor;
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
