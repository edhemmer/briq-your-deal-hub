import type { Json } from "./supabaseDatabase.types";

export const GOVERNANCEIQ_FOUNDATION_CONTRACT_VERSION = "governanceiq-foundation-v1" as const;
export const GOVERNANCEIQ_PROJECTION_CONTRACT_VERSION = "governanceiq-projection-v1" as const;
export const GOVERNANCEIQ_DOCUMENT_ANALYSIS_CONTRACT_VERSION = "governanceiq-document-analysis-v1" as const;
export const GOVERNANCEIQ_EXTRACTION_CONTRACT_VERSION = "governanceiq-extraction-v1" as const;
export const GOVERNANCEIQ_FINANCIAL_ANALYSIS_CONTRACT_VERSION = "governanceiq-financial-analysis-v1" as const;
export const GOVERNANCEIQ_RESTRICTION_INTELLIGENCE_CONTRACT_VERSION = "governanceiq-restriction-intelligence-v1" as const;
export const GOVERNANCEIQ_CHANGE_PROPAGATION_CONTRACT_VERSION = "governanceiq-change-propagation-v1" as const;
export const GOVERNANCEIQ_CHANGE_VERSION_GRAPH_VERSION = "governanceiq-change-version-graph-v1" as const;
export const GOVERNANCEIQ_IMPACT_CLASSIFICATION_VERSION = "governanceiq-impact-classification-v1" as const;

export const GOVERNANCE_TYPES = [
  "homeowners_association",
  "condominium_association",
  "property_owners_association",
  "master_association",
  "sub_association",
  "cooperative",
  "architectural_review",
  "private_road_maintenance",
  "shared_utility",
  "shared_well",
  "shared_septic",
  "business_park",
  "industrial_park",
  "mixed_use_association",
  "other_private_governance",
] as const;

export const GOVERNANCE_RECORD_STATUSES = [
  "suspected",
  "identified",
  "documents_requested",
  "documents_received",
  "partial",
  "awaiting_verification",
  "current",
  "current_with_conflicts",
  "stale",
  "professional_review_required",
  "failed_with_prior_analysis",
  "superseded",
  "archived",
] as const;

export const GOVERNANCE_DOCUMENT_TYPES = [
  "declaration_ccrs",
  "bylaws",
  "rules_regulations",
  "amendment",
  "articles",
  "budget",
  "financial_statement",
  "reserve_study",
  "insurance_summary",
  "insurance_policy",
  "meeting_minutes",
  "assessment_notice",
  "violation_notice",
  "resale_certificate",
  "disclosure",
  "estoppel",
  "architectural_standard",
  "architectural_application",
  "parking_vehicle_rules",
  "pet_rules",
  "leasing_rental_rules",
  "short_term_rental_rules",
  "maintenance_matrix",
  "litigation_notice",
  "management_agreement",
  "fee_schedule",
  "right_of_first_refusal",
  "other",
] as const;

export const GOVERNANCE_FINDING_CATEGORIES = [
  "dues",
  "assessment",
  "reserve",
  "delinquency",
  "debt",
  "budget",
  "litigation",
  "insurance",
  "rental",
  "occupancy",
  "short_term_rental",
  "room_rental",
  "entity_ownership",
  "parking",
  "commercial_vehicle",
  "pickup_truck",
  "trailer",
  "rv",
  "boat",
  "towing",
  "pet",
  "residential_use",
  "commercial_use",
  "home_business",
  "signage",
  "noise",
  "storage",
  "maintenance",
  "architectural_approval",
  "renovation",
  "contractor_requirement",
  "work_hours",
  "materials_colors",
  "landscaping",
  "fencing",
  "solar",
  "ev",
  "antenna",
  "structural_work",
  "transfer",
  "right_of_first_refusal",
  "board_approval",
  "transfer_fee",
  "lender_requirement",
  "governance_financing_risk",
  "other",
] as const;

export type GovernanceType = (typeof GOVERNANCE_TYPES)[number];
export type GovernanceRecordStatus = (typeof GOVERNANCE_RECORD_STATUSES)[number];
export type GovernanceDocumentType = (typeof GOVERNANCE_DOCUMENT_TYPES)[number];
export type GovernanceFindingCategory = (typeof GOVERNANCE_FINDING_CATEGORIES)[number];

export type GovernanceDocumentHierarchyState =
  | "candidate_current"
  | "candidate_superseded"
  | "conflicting"
  | "hierarchy_uncertain"
  | "professional_review_required";

export const GOVERNANCE_DOCUMENT_CLASSIFICATION_STATES = [
  "unclassified",
  "classified_proposed",
  "classified_verified",
  "classification_conflict",
  "insufficient_content",
  "illegible",
  "unsupported_format",
  "provider_failed",
  "manual_review_required",
] as const;

export const GOVERNANCE_DOCUMENT_RELATIONSHIP_TYPES = [
  "amends",
  "amended_by",
  "supersedes",
  "superseded_by",
  "supplements",
  "incorporated_by_reference",
  "restates",
  "related_to",
  "conflicts_with",
  "unknown_relationship",
] as const;

export const GOVERNANCE_DOCUMENT_RELATIONSHIP_STATES = ["proposed", "verified", "rejected", "superseded"] as const;

export const GOVERNANCE_HIERARCHY_CANDIDATE_STATES = [
  "candidate_current",
  "candidate_superseded",
  "conflicting",
  "hierarchy_uncertain",
  "professional_review_required",
] as const;

export const GOVERNANCE_EXTRACTION_TYPES = ["restriction", "financial_input", "missing_document", "question"] as const;

export const GOVERNANCE_CONFLICT_TYPES = [
  "value_conflict",
  "restriction_conflict",
  "date_conflict",
  "effective_period_conflict",
  "hierarchy_conflict",
  "financial_conflict",
  "source_conflict",
  "verification_conflict",
  "supersession_conflict",
  "ambiguity_conflict",
] as const;

export const GOVERNANCE_ANALYSIS_RUN_STATUSES = [
  "queued",
  "processing",
  "partial",
  "completed",
  "failed",
  "provider_failed",
  "malformed_response",
  "unsupported_file",
  "stale",
  "superseded",
] as const;

export const GOVERNANCE_ANALYSIS_ERROR_CODES = [
  "provider_unavailable",
  "provider_timeout",
  "malformed_response",
  "insufficient_context",
  "unsupported_file",
  "source_anchor_incomplete",
  "validation_failed",
  "unknown_error",
] as const;

export const GOVERNANCE_QUESTION_TARGET_ROLES = [
  "association_manager",
  "seller",
  "realtor",
  "attorney",
  "lender",
  "insurer",
  "contractor_architect",
  "title_closing_professional",
  "unknown",
] as const;

export type GovernanceDocumentClassificationState = (typeof GOVERNANCE_DOCUMENT_CLASSIFICATION_STATES)[number];
export type GovernanceDocumentRelationshipType = (typeof GOVERNANCE_DOCUMENT_RELATIONSHIP_TYPES)[number];
export type GovernanceDocumentRelationshipState = (typeof GOVERNANCE_DOCUMENT_RELATIONSHIP_STATES)[number];
export type GovernanceExtractionType = (typeof GOVERNANCE_EXTRACTION_TYPES)[number];
export type GovernanceConflictType = (typeof GOVERNANCE_CONFLICT_TYPES)[number];
export type GovernanceAnalysisRunStatus = (typeof GOVERNANCE_ANALYSIS_RUN_STATUSES)[number];
export type GovernanceAnalysisErrorCode = (typeof GOVERNANCE_ANALYSIS_ERROR_CODES)[number];
export type GovernanceQuestionTargetRole = (typeof GOVERNANCE_QUESTION_TARGET_ROLES)[number];

export type GovernanceSeverity = "informational" | "low" | "moderate" | "high" | "critical" | "unknown";
export type GovernanceImpactType =
  | "cost"
  | "strategy"
  | "financing"
  | "insurance"
  | "renovation"
  | "leasing"
  | "operations"
  | "parking"
  | "transfer"
  | "legal_review"
  | "deadline"
  | "documentation"
  | "other";
export type GovernanceAcceptanceState =
  | "proposed"
  | "accepted"
  | "accepted_with_verification"
  | "accepted_professional"
  | "confirmed"
  | "rejected"
  | "disputed"
  | "superseded"
  | "expired";
export type GovernanceVerificationState =
  | "unknown"
  | "unverified"
  | "user_entered_assumption"
  | "document_extracted"
  | "association_provided"
  | "manager_provided"
  | "professional_review_recommended"
  | "confirmed"
  | "conflicting"
  | "expired"
  | "superseded"
  | "rejected";
export type GovernanceSourceClassification =
  | "unknown"
  | "user_entered_assumption"
  | "system_observation"
  | "document_extracted"
  | "association_provided"
  | "manager_provided"
  | "seller_disclosure"
  | "professional_opinion"
  | "confirmed_fact"
  | "conflict"
  | "expired"
  | "superseded";
export type GovernanceProjectionState =
  | "no_governance_identified"
  | "documents_requested"
  | "processing"
  | "partial"
  | "awaiting_verification"
  | "current"
  | "current_with_conflicts"
  | "stale"
  | "failed_with_prior_analysis"
  | "professional_review_required";

export type GovernanceSourceAnchor = Partial<{
  page: number;
  pageNumber: number;
  section: string;
  sectionHeading: string;
  clause: string;
  article: string;
  paragraph: string;
  table: string;
  row: string | number;
  line: string | number;
  meetingDate: string;
  budgetLine: string;
  amendmentSection: string;
}>;

export type GovernanceProvenance = {
  sourceEvidenceId?: string;
  sourceRecordId?: string;
  sourceAnchor?: GovernanceSourceAnchor;
  sourceClassification: GovernanceSourceClassification;
  verificationState: GovernanceVerificationState;
  confidence: number;
  effectiveAt?: string;
  expiresAt?: string;
};

export type GovernanceRecord = GovernanceProvenance & {
  contractVersion: typeof GOVERNANCEIQ_FOUNDATION_CONTRACT_VERSION;
  governanceRecordId: string;
  governanceRecordVersion: number;
  workspaceId: string;
  dealId?: string;
  propertyId?: string;
  governanceType: GovernanceType;
  name: string;
  legalName?: string;
  status: GovernanceRecordStatus;
  parentGovernanceRecordId?: string;
  managementOrganizationId?: string;
  managementContactId?: string;
  archivedAt?: string;
  updatedAt: string;
};

export type GovernanceDocument = {
  contractVersion: typeof GOVERNANCEIQ_FOUNDATION_CONTRACT_VERSION;
  governanceDocumentId: string;
  governanceDocumentVersion: number;
  workspaceId: string;
  governanceRecordId: string;
  evidenceId: string;
  documentType: GovernanceDocumentType;
  title: string;
  hierarchyClassification: GovernanceDocumentHierarchyState;
  analysisState: "not_started" | "processing" | "partial" | "awaiting_verification" | "current" | "failed_with_prior_analysis" | "professional_review_required";
} & GovernanceProvenance;

export type GovernanceDocumentClassification = {
  contractVersion: typeof GOVERNANCEIQ_DOCUMENT_ANALYSIS_CONTRACT_VERSION;
  governanceDocumentId: string;
  proposedDocumentType?: GovernanceDocumentType;
  classificationState: GovernanceDocumentClassificationState;
  confidence: number;
  evidenceBasis: string[];
  sourceAnchor: GovernanceSourceAnchor;
  classificationMethod: "content_pattern" | "provider_structured" | "manual" | "filename_hint" | "fallback";
  verificationState: GovernanceVerificationState;
  warnings: string[];
  ambiguityCandidates: GovernanceDocumentType[];
};

export type GovernanceDocumentRelationship = {
  contractVersion: typeof GOVERNANCEIQ_DOCUMENT_ANALYSIS_CONTRACT_VERSION;
  governanceDocumentRelationshipId: string;
  workspaceId: string;
  governanceRecordId: string;
  sourceGovernanceDocumentId: string;
  targetGovernanceDocumentId: string;
  relationshipType: GovernanceDocumentRelationshipType;
  relationshipState: GovernanceDocumentRelationshipState;
  sourceAnchor: GovernanceSourceAnchor;
  confidence: number;
  effectiveAt?: string;
  adoptedAt?: string;
  reasoningCode: string;
  professionalReviewRecommended: boolean;
};

export type GovernanceHierarchyCandidate = {
  contractVersion: typeof GOVERNANCEIQ_DOCUMENT_ANALYSIS_CONTRACT_VERSION;
  governanceHierarchyCandidateId: string;
  governanceDocumentId: string;
  hierarchyState: (typeof GOVERNANCE_HIERARCHY_CANDIDATE_STATES)[number];
  relationshipIds: string[];
  sourceAnchor: GovernanceSourceAnchor;
  reasoningCode: string;
  confidence: number;
  professionalReviewRecommended: boolean;
};

export type GovernanceFinding = GovernanceProvenance & {
  contractVersion: typeof GOVERNANCEIQ_FOUNDATION_CONTRACT_VERSION;
  governanceFindingId: string;
  governanceFindingVersion: number;
  workspaceId: string;
  governanceRecordId: string;
  governanceDocumentId?: string;
  dealId?: string;
  propertyId?: string;
  findingType: string;
  findingCategory: GovernanceFindingCategory;
  summary: string;
  normalizedValue: Record<string, Json>;
  normalizedRequirement?: string;
  severity: GovernanceSeverity;
  impactType: GovernanceImpactType;
  acceptanceState: GovernanceAcceptanceState;
  professionalReviewRecommended: boolean;
};

export type GovernanceExtractionCandidate = GovernanceProvenance & {
  contractVersion: typeof GOVERNANCEIQ_EXTRACTION_CONTRACT_VERSION;
  governanceRecordId: string;
  governanceDocumentId: string;
  evidenceId: string;
  extractionType: GovernanceExtractionType;
  findingCategory: GovernanceFindingCategory;
  normalizedValue: Record<string, Json>;
  normalizedRequirement?: string;
  sourceAnchor: GovernanceSourceAnchor;
  ambiguity?: string;
  warnings: string[];
  providerMetadata: {
    providerId: string;
    method: "deterministic_fixture" | "provider_structured" | "manual";
    modelId?: string;
    promptVersion?: string;
  };
};

export type GovernanceDetectedConflict = {
  conflictType: GovernanceConflictType;
  severity: GovernanceSeverity;
  category: GovernanceFindingCategory;
  summary: string;
  sourceAAnchor: GovernanceSourceAnchor;
  sourceBAnchor: GovernanceSourceAnchor;
  normalizedA: Record<string, Json>;
  normalizedB: Record<string, Json>;
  confidence: number;
  detectionMethod: "deterministic_normalized_value";
  professionalReviewRecommended: boolean;
};

export type GovernanceProjection = {
  contractVersion: typeof GOVERNANCEIQ_PROJECTION_CONTRACT_VERSION;
  governanceRecordId: string;
  governanceRecordVersion: number;
  workspaceId: string;
  dealId?: string;
  propertyId?: string;
  name: string;
  governanceType: GovernanceType;
  status: GovernanceRecordStatus;
  projectionState: GovernanceProjectionState;
  documentCount: number;
  findingCount: number;
  unresolvedConflictCount: number;
  acceptedFindingCount: number;
  highSeverityFindingCount: number;
  professionalReviewRequired: boolean;
  sourceCompleteness: "missing_documents" | "partial_sources" | "source_linked";
  verificationSummary: Record<string, Json>;
  updatedAt: string;
  loadedAt: string;
};

export const GOVERNANCEIQ_ALLOWED_SOURCE_ANCHOR_KEYS = [
  "page",
  "pageNumber",
  "section",
  "sectionHeading",
  "clause",
  "article",
  "paragraph",
  "table",
  "row",
  "line",
  "meetingDate",
  "budgetLine",
  "amendmentSection",
] as const;

export const GOVERNANCEIQ_FORBIDDEN_SOURCE_ANCHOR_KEYS = [
  "rawText",
  "rawDocumentText",
  "fullText",
  "documentText",
  "fileContents",
  "ocrText",
] as const;

export const GOVERNANCEIQ_FORBIDDEN_DOWNSTREAM_MUTATION_FIELDS = [
  "underwritingInput",
  "underwritingSnapshotId",
  "strategyCompatibilityOverride",
  "financeIQAssumptionOverride",
  "cockpitRecommendation",
  "dealRecommendation",
  "legalConclusion",
  "isLegallyAllowed",
  "reserveAdequacyConclusion",
  "budgetHealthScore",
] as const;

export const GOVERNANCE_ASSESSMENT_STATUSES = ["PROPOSED", "ADOPTED", "BILLED", "PAID", "DISPUTED", "UNKNOWN"] as const;

export const GOVERNANCE_FINANCIAL_COMPLETENESS_STATES = [
  "complete_for_available_analysis",
  "partial",
  "missing_budget",
  "missing_financial_statement",
  "missing_reserve_data",
  "missing_delinquency_data",
  "missing_assessment_status",
  "conflicting_financial_sources",
  "stale",
  "professional_review_recommended",
] as const;

export const GOVERNANCE_RESTRICTION_STATES = [
  "allowed",
  "allowed_with_conditions",
  "restricted",
  "prohibited",
  "approval_required",
  "uncertain",
  "conflicted",
  "unknown",
  "not_applicable",
  "expired",
  "superseded",
] as const;

export const GOVERNANCE_RESTRICTION_FORCE_LEVELS = ["hard", "advisory", "ambiguous", "professional_review_required"] as const;

export const GOVERNANCE_RISK_GROUPS = [
  "financial",
  "rental",
  "parking_vehicle",
  "renovation",
  "insurance",
  "transfer_financing",
  "legal_review",
  "data_quality",
] as const;

export const GOVERNANCE_RISK_STATES = ["clear", "low_attention", "attention", "high_attention", "blocked", "uncertain"] as const;

export type GovernanceAssessmentStatus = (typeof GOVERNANCE_ASSESSMENT_STATUSES)[number];
export type GovernanceFinancialCompletenessState = (typeof GOVERNANCE_FINANCIAL_COMPLETENESS_STATES)[number];
export type GovernanceRestrictionState = (typeof GOVERNANCE_RESTRICTION_STATES)[number];
export type GovernanceRestrictionForceLevel = (typeof GOVERNANCE_RESTRICTION_FORCE_LEVELS)[number];
export type GovernanceRiskGroup = (typeof GOVERNANCE_RISK_GROUPS)[number];
export type GovernanceRiskState = (typeof GOVERNANCE_RISK_STATES)[number];

export type GovernanceSourceRef = {
  governanceDocumentId?: string;
  governanceDocumentVersion?: number;
  governanceFindingId?: string;
  governanceFindingVersion?: number;
  governanceFinancialId?: string;
  governanceFinancialVersion?: number;
  evidenceId?: string;
  sourceRecordId?: string;
  sourceAnchor?: GovernanceSourceAnchor;
  verificationState: GovernanceVerificationState;
  sourceClassification: GovernanceSourceClassification;
  confidence: number;
  effectiveAt?: string;
  expiresAt?: string;
};

export type GovernanceFinancialPeriodInput = {
  periodId: string;
  periodStart?: string;
  periodEnd?: string;
  amountBasis: "actual" | "budget" | "projected" | "proposed" | "unknown";
  duesAmount?: number;
  duesFrequency?: "monthly" | "quarterly" | "semiannual" | "annual" | "one_time" | "other";
  revenueAmount?: number;
  expenseAmount?: number;
  reserveBalance?: number;
  delinquencyAmount?: number;
  delinquencyRate?: number;
  assessmentAmount?: number;
  assessmentStatus?: GovernanceAssessmentStatus;
  associationDebtAmount?: number;
  associationDebtServiceAmount?: number;
  associationDebtMaturityDate?: string;
  associationDebtPurpose?: string;
  insuranceExpenseAmount?: number;
  insuranceDeductibleAmount?: number;
  plannedProjectAmount?: number;
  unitCount?: number;
  currency: string;
  sourceRefs: GovernanceSourceRef[];
};

export type GovernanceFinancialAnalysisInput = {
  contractVersion: typeof GOVERNANCEIQ_FINANCIAL_ANALYSIS_CONTRACT_VERSION;
  governanceRecordId: string;
  governanceRecordVersion: number;
  generatedAt: string;
  periods: GovernanceFinancialPeriodInput[];
};

export type GovernanceFinancialAnalysisResult = {
  contractVersion: typeof GOVERNANCEIQ_FINANCIAL_ANALYSIS_CONTRACT_VERSION;
  governanceRecordId: string;
  governanceRecordVersion: number;
  periodsAnalyzed: number;
  analysisState: "current" | "partial" | "stale" | "failed_with_prior_analysis";
  completeness: GovernanceFinancialCompletenessState[];
  duesIndicator: {
    currentAmount?: number;
    frequency?: string;
    annualizedCurrentAmount?: number;
    growthPct?: number;
    trendState: "calculated" | "incomplete" | "incompatible_periods";
  };
  reserveIndicator: {
    reserveBalance?: number;
    reserveToAnnualExpenseRatio?: number;
    reservePerUnit?: number;
    reserveChangePct?: number;
    reserveToKnownProjectCostRatio?: number;
    state: "calculated" | "missing_denominator" | "missing_reserve_data";
  };
  delinquencyIndicator: {
    delinquencyAmount?: number;
    delinquencyRate?: number;
    state: "calculated" | "missing_denominator" | "missing_delinquency_data";
  };
  budgetIndicator: {
    revenueAmount?: number;
    expenseAmount?: number;
    surplusDeficitAmount?: number;
    expenseGrowthPct?: number;
    state: "calculated" | "missing_budget" | "incompatible_periods";
  };
  assessmentIndicator: {
    currentAssessmentAmount?: number;
    currentAssessmentStatus?: GovernanceAssessmentStatus;
    adoptedAssessmentAmount?: number;
    proposedAssessmentAmount?: number;
    state: "none_found" | "proposed_only" | "adopted_or_billed" | "missing_assessment_status";
  };
  associationDebtIndicator: {
    principalAmount?: number;
    debtServiceAmount?: number;
    maturityDate?: string;
    purpose?: string;
    state: "present" | "not_found";
  };
  insuranceIndicator: {
    insuranceExpenseAmount?: number;
    deductibleAmount?: number;
    state: "descriptive_only" | "not_found";
  };
  warnings: string[];
  sourceRefs: GovernanceSourceRef[];
  resultHash: string;
  generatedAt: string;
};

export type GovernanceRestrictionSourceFinding = {
  governanceFindingId: string;
  governanceFindingVersion: number;
  governanceRecordId: string;
  governanceDocumentId?: string;
  governanceDocumentVersion?: number;
  evidenceId?: string;
  findingCategory: GovernanceFindingCategory | string;
  normalizedValue: Record<string, Json>;
  normalizedRequirement?: string;
  acceptanceState: GovernanceAcceptanceState;
  conflictState?: "none" | "potential_conflict" | "unresolved_conflict" | "resolved_conflict" | "superseded_conflict";
  sourceAnchor: GovernanceSourceAnchor;
  sourceClassification: GovernanceSourceClassification;
  verificationState: GovernanceVerificationState;
  confidence: number;
  effectiveAt?: string;
  expiresAt?: string;
  professionalReviewRecommended: boolean;
};

export type GovernanceRestrictionIntelligenceResult = {
  contractVersion: typeof GOVERNANCEIQ_RESTRICTION_INTELLIGENCE_CONTRACT_VERSION;
  governanceRecordId: string;
  governanceRecordVersion: number;
  category: string;
  subcategory?: string;
  normalizedRestriction: string;
  applicability: "deal" | "property" | "unit" | "occupant" | "vehicle" | "project" | "unknown";
  state: GovernanceRestrictionState;
  forceLevel: GovernanceRestrictionForceLevel;
  conditions: string[];
  exceptions: string[];
  effectiveAt?: string;
  expiresAt?: string;
  sourceFindingId: string;
  sourceFindingVersion: number;
  sourceDocumentId?: string;
  sourceDocumentVersion?: number;
  sourceEvidenceId?: string;
  sourceAnchor: GovernanceSourceAnchor;
  confidence: number;
  verificationState: GovernanceVerificationState;
  conflictState: "none" | "potential_conflict" | "unresolved_conflict" | "resolved_conflict" | "superseded_conflict";
  professionalReviewRecommended: boolean;
  strategyCompatibilityCandidates: string[];
  financingImpactCandidates: string[];
  operationalImpact: string[];
  explanationCode: string;
  generatedAt: string;
  resultHash: string;
};

export type GovernanceRiskGroupResult = {
  group: GovernanceRiskGroup;
  state: GovernanceRiskState;
  reasons: string[];
  sourceResultHashes: string[];
};

export type GovernanceImpactDomain = "underwriting" | "strategy" | "finance" | "cockpit" | "task_deadline" | "reporting" | "none";
export type GovernanceChangeMateriality = "material" | "not_material" | "upcoming" | "expired" | "uncertain" | "blocked";
export type GovernancePropagationState = "current" | "stale" | "queued" | "recalculating" | "failed_with_prior_valid" | "blocked" | "not_affected" | "superseded";
export type GovernanceDownstreamProposalType = "underwriting_input" | "strategy_constraint" | "finance_condition" | "cockpit_warning" | "task_proposal";

export type GovernanceChange = {
  contractVersion: typeof GOVERNANCEIQ_CHANGE_PROPAGATION_CONTRACT_VERSION;
  classificationVersion: typeof GOVERNANCEIQ_IMPACT_CLASSIFICATION_VERSION;
  workspaceId: string;
  dealId: string;
  propertyId: string;
  governanceRecordId: string;
  governanceFindingId: string;
  findingVersion: number;
  acceptanceVersion: number;
  category: string;
  normalizedValue: Record<string, Json>;
  previousAcceptedValue?: Record<string, Json>;
  sourceEvidenceId?: string;
  sourceAnchor: GovernanceSourceAnchor;
  verificationState: GovernanceVerificationState;
  confidence: number;
  materiality: GovernanceChangeMateriality;
  impactDomains: GovernanceImpactDomain[];
  effectiveAt?: string;
  expiresAt?: string;
  acceptedBy: string;
  acceptedAt: string;
  triggeringEventId: string;
  correlationId: string;
  idempotencyKey: string;
  reasonCodes: string[];
};

export type GovernanceDownstreamProposal = {
  proposalType: GovernanceDownstreamProposalType;
  domain: Exclude<GovernanceImpactDomain, "none" | "reporting">;
  proposalKey: string;
  targetField?: string;
  targetStrategyIds: string[];
  normalizedValue: Record<string, Json>;
  sourceFindingId: string;
  sourceFindingVersion: number;
  sourceEvidenceId?: string;
  sourceAnchor: GovernanceSourceAnchor;
  state: "proposed" | "queued" | "stale" | "superseded" | "blocked";
  explanation: string;
  idempotencyKey: string;
};

export type GovernanceChangeVersionGraph = {
  graphVersion: typeof GOVERNANCEIQ_CHANGE_VERSION_GRAPH_VERSION;
  workspaceId: string;
  dealId: string;
  propertyId: string;
  governanceRecordId: string;
  governanceFindingId: string;
  findingVersion: number;
  acceptanceVersion: number;
  triggeringEventId: string;
  downstreamProposalKeys: string[];
  underwritingSnapshotId?: string;
  underwritingSnapshotVersion?: number;
  strategyEvaluationId?: string;
  strategyEvaluationVersion?: string;
  financeConditionId?: string;
  financeConditionVersion?: number;
  cockpitProjectionId?: string;
  cockpitProjectionVersion?: string;
  graphHash: string;
};

export type GovernancePropagationFailure = {
  domain: Exclude<GovernanceImpactDomain, "none" | "reporting">;
  code: string;
  safeMessage: string;
  retryable: boolean;
};

export type GovernancePropagationResult = {
  contractVersion: typeof GOVERNANCEIQ_CHANGE_PROPAGATION_CONTRACT_VERSION;
  governanceChange: GovernanceChange;
  downstreamStates: Record<Exclude<GovernanceImpactDomain, "none" | "reporting">, GovernancePropagationState>;
  proposals: GovernanceDownstreamProposal[];
  versionGraph: GovernanceChangeVersionGraph;
  explanations: string[];
  staleDownstreamResultIds: string[];
  priorValidDownstream: boolean;
  failures: GovernancePropagationFailure[];
  resultHash: string;
  propagatedAt: string;
};

export type GovernanceChangeBuildInput = {
  workspaceId: string;
  dealId: string;
  propertyId: string;
  governanceRecordId: string;
  governanceFindingId: string;
  findingVersion: number;
  acceptanceVersion: number;
  acceptanceState: GovernanceAcceptanceState;
  category: GovernanceFindingCategory | string;
  normalizedValue: Record<string, Json>;
  previousAcceptedValue?: Record<string, Json>;
  sourceEvidenceId?: string;
  sourceAnchor?: GovernanceSourceAnchor;
  verificationState: GovernanceVerificationState;
  confidence: number;
  conflictState?: GovernanceRestrictionSourceFinding["conflictState"];
  effectiveAt?: string;
  expiresAt?: string;
  acceptedBy: string;
  acceptedAt: string;
  triggeringEventId: string;
  correlationId: string;
  idempotencyKey: string;
  activeStrategyIds?: string[];
  affectedStrategyUses?: string[];
  asOf?: string;
};

export type GovernancePropagationInput = {
  change: GovernanceChange;
  existingProposalKeys?: string[];
  staleDownstreamResultIds?: string[];
  priorValidDownstream?: boolean;
  failures?: GovernancePropagationFailure[];
  completedRefs?: Partial<Pick<
    GovernanceChangeVersionGraph,
    | "underwritingSnapshotId"
    | "underwritingSnapshotVersion"
    | "strategyEvaluationId"
    | "strategyEvaluationVersion"
    | "financeConditionId"
    | "financeConditionVersion"
    | "cockpitProjectionId"
    | "cockpitProjectionVersion"
  >>;
  propagatedAt: string;
};

const frequencyToAnnualMultiplier: Record<string, number | undefined> = {
  monthly: 12,
  quarterly: 4,
  semiannual: 2,
  annual: 1,
  one_time: undefined,
  other: undefined,
};

export function buildGovernanceChange(input: GovernanceChangeBuildInput): GovernanceChange {
  if (!isAcceptedGovernanceState(input.acceptanceState)) throw new Error("Governance finding must be explicitly accepted before downstream propagation.");
  if (!input.workspaceId || !input.dealId || !input.propertyId || !input.governanceRecordId || !input.governanceFindingId) {
    throw new Error("Governance change propagation requires workspace, Deal, Property, record, and finding identity.");
  }
  if (!input.acceptedBy || !input.triggeringEventId || !input.correlationId || !input.idempotencyKey) {
    throw new Error("Governance change propagation requires accepted actor, triggering event, correlation ID, and idempotency key.");
  }

  const temporal = temporalMateriality(input.effectiveAt, input.expiresAt, input.asOf ?? input.acceptedAt);
  const uncertainty = uncertaintyReason(input);
  const classification = classifyGovernanceImpact({
    category: input.category,
    normalizedValue: input.normalizedValue,
    verificationState: input.verificationState,
    conflictState: input.conflictState,
    temporalMateriality: temporal,
    activeStrategyIds: input.activeStrategyIds ?? [],
    affectedStrategyUses: input.affectedStrategyUses ?? [],
  });
  const materiality: GovernanceChangeMateriality = uncertainty ? "uncertain" : temporal === "material" ? classification.materiality : temporal;
  const impactDomains: GovernanceImpactDomain[] = materiality === "material" || materiality === "upcoming" || materiality === "uncertain"
    ? classification.impactDomains
    : ["none" as const];

  return deepFreeze({
    contractVersion: GOVERNANCEIQ_CHANGE_PROPAGATION_CONTRACT_VERSION,
    classificationVersion: GOVERNANCEIQ_IMPACT_CLASSIFICATION_VERSION,
    workspaceId: input.workspaceId,
    dealId: input.dealId,
    propertyId: input.propertyId,
    governanceRecordId: input.governanceRecordId,
    governanceFindingId: input.governanceFindingId,
    findingVersion: input.findingVersion,
    acceptanceVersion: input.acceptanceVersion,
    category: String(input.category),
    normalizedValue: stableObject(input.normalizedValue) as Record<string, Json>,
    previousAcceptedValue: input.previousAcceptedValue ? stableObject(input.previousAcceptedValue) as Record<string, Json> : undefined,
    sourceEvidenceId: input.sourceEvidenceId,
    sourceAnchor: normalizeGovernanceSourceAnchor(input.sourceAnchor),
    verificationState: input.verificationState,
    confidence: input.confidence,
    materiality,
    impactDomains: sortedImpactDomains(impactDomains),
    effectiveAt: input.effectiveAt,
    expiresAt: input.expiresAt,
    acceptedBy: input.acceptedBy,
    acceptedAt: input.acceptedAt,
    triggeringEventId: input.triggeringEventId,
    correlationId: input.correlationId,
    idempotencyKey: input.idempotencyKey,
    reasonCodes: sortedUniqueStrings([
      ...classification.reasonCodes,
      ...(uncertainty ? [uncertainty] : []),
      ...(temporal !== "material" ? [`temporal_${temporal}`] : []),
    ]),
  });
}

export function buildGovernancePropagationResult(input: GovernancePropagationInput): GovernancePropagationResult {
  const proposals = buildDownstreamProposals(input.change, input.existingProposalKeys ?? []);
  const failures = [...(input.failures ?? [])].sort((a, b) => `${a.domain}:${a.code}`.localeCompare(`${b.domain}:${b.code}`));
  const downstreamStates = downstreamStatesFor(input.change, failures, Boolean(input.priorValidDownstream), proposals);
  const versionGraph = buildGovernanceChangeVersionGraph({
    change: input.change,
    proposals,
    completedRefs: input.completedRefs,
  });
  const resultBasis = {
    changeId: `${input.change.governanceFindingId}:${input.change.findingVersion}:${input.change.acceptanceVersion}`,
    downstreamStates,
    proposalKeys: proposals.map((proposal) => proposal.proposalKey).sort(),
    staleDownstreamResultIds: [...(input.staleDownstreamResultIds ?? [])].sort(),
    failures,
    versionGraphHash: versionGraph.graphHash,
  };

  return deepFreeze({
    contractVersion: GOVERNANCEIQ_CHANGE_PROPAGATION_CONTRACT_VERSION,
    governanceChange: input.change,
    downstreamStates,
    proposals,
    versionGraph,
    explanations: buildGovernanceChangeExplanations(input.change, proposals, failures),
    staleDownstreamResultIds: [...(input.staleDownstreamResultIds ?? [])].sort(),
    priorValidDownstream: Boolean(input.priorValidDownstream),
    failures,
    resultHash: deterministicHash(resultBasis),
    propagatedAt: input.propagatedAt,
  });
}

export function buildGovernanceChangeVersionGraph(input: {
  change: GovernanceChange;
  proposals: GovernanceDownstreamProposal[];
  completedRefs?: GovernancePropagationInput["completedRefs"];
}): GovernanceChangeVersionGraph {
  const downstreamProposalKeys = input.proposals.map((proposal) => proposal.proposalKey).sort();
  const basis = {
    graphVersion: GOVERNANCEIQ_CHANGE_VERSION_GRAPH_VERSION,
    workspaceId: input.change.workspaceId,
    dealId: input.change.dealId,
    propertyId: input.change.propertyId,
    governanceRecordId: input.change.governanceRecordId,
    governanceFindingId: input.change.governanceFindingId,
    findingVersion: input.change.findingVersion,
    acceptanceVersion: input.change.acceptanceVersion,
    triggeringEventId: input.change.triggeringEventId,
    downstreamProposalKeys,
    completedRefs: input.completedRefs ?? {},
  };
  return deepFreeze({
    graphVersion: GOVERNANCEIQ_CHANGE_VERSION_GRAPH_VERSION,
    workspaceId: input.change.workspaceId,
    dealId: input.change.dealId,
    propertyId: input.change.propertyId,
    governanceRecordId: input.change.governanceRecordId,
    governanceFindingId: input.change.governanceFindingId,
    findingVersion: input.change.findingVersion,
    acceptanceVersion: input.change.acceptanceVersion,
    triggeringEventId: input.change.triggeringEventId,
    downstreamProposalKeys,
    underwritingSnapshotId: input.completedRefs?.underwritingSnapshotId,
    underwritingSnapshotVersion: input.completedRefs?.underwritingSnapshotVersion,
    strategyEvaluationId: input.completedRefs?.strategyEvaluationId,
    strategyEvaluationVersion: input.completedRefs?.strategyEvaluationVersion,
    financeConditionId: input.completedRefs?.financeConditionId,
    financeConditionVersion: input.completedRefs?.financeConditionVersion,
    cockpitProjectionId: input.completedRefs?.cockpitProjectionId,
    cockpitProjectionVersion: input.completedRefs?.cockpitProjectionVersion,
    graphHash: deterministicHash(basis),
  });
}

export function governancePropagationStateAfterFailure(input: {
  domain: Exclude<GovernanceImpactDomain, "none" | "reporting">;
  hasPriorValidResult: boolean;
}): GovernancePropagationState {
  if (input.domain === "cockpit") return input.hasPriorValidResult ? "failed_with_prior_valid" : "blocked";
  return input.hasPriorValidResult ? "failed_with_prior_valid" : "blocked";
}

export function analyzeGovernanceFinancialHealth(input: GovernanceFinancialAnalysisInput): GovernanceFinancialAnalysisResult {
  if (input.contractVersion !== GOVERNANCEIQ_FINANCIAL_ANALYSIS_CONTRACT_VERSION) throw new Error("Unsupported GovernanceIQ financial analysis contract version.");
  const periods = [...input.periods].sort((a, b) => (a.periodEnd ?? a.periodStart ?? a.periodId).localeCompare(b.periodEnd ?? b.periodStart ?? b.periodId));
  const latest = periods.at(-1);
  const previous = periods.length > 1 ? periods.at(-2) : undefined;
  const warnings = new Set<string>();
  const completeness = new Set<GovernanceFinancialCompletenessState>();

  if (!periods.length) completeness.add("partial");
  if (!periods.some((period) => period.revenueAmount !== undefined && period.expenseAmount !== undefined)) completeness.add("missing_budget");
  if (!periods.some((period) => period.reserveBalance !== undefined)) completeness.add("missing_reserve_data");
  if (!periods.some((period) => period.delinquencyRate !== undefined || period.delinquencyAmount !== undefined)) completeness.add("missing_delinquency_data");
  if (periods.some((period) => period.assessmentAmount !== undefined && !period.assessmentStatus)) completeness.add("missing_assessment_status");
  if (hasConflictingFinancialSources(periods)) completeness.add("conflicting_financial_sources");

  const latestDues = latest?.duesAmount !== undefined ? latest : [...periods].reverse().find((period) => period.duesAmount !== undefined);
  const previousComparableDues = previous && latestDues && previous.duesAmount !== undefined && previous.duesFrequency === latestDues.duesFrequency ? previous : undefined;
  const annualizedCurrentAmount = latestDues?.duesAmount !== undefined ? annualizeDues(latestDues.duesAmount, latestDues.duesFrequency) : undefined;
  const duesGrowthPct = latestDues && previousComparableDues && previousComparableDues.duesAmount ? pctChange(previousComparableDues.duesAmount, latestDues.duesAmount) : undefined;
  if (latestDues && previous && previous.duesAmount !== undefined && previous.duesFrequency !== latestDues.duesFrequency) warnings.add("Dues trend was not calculated because periods use incompatible units.");

  const latestReserve = [...periods].reverse().find((period) => period.reserveBalance !== undefined);
  const previousReserve = latestReserve ? [...periods].filter((period) => period !== latestReserve && period.reserveBalance !== undefined).at(-1) : undefined;
  const reserveToAnnualExpenseRatio = latestReserve?.reserveBalance !== undefined && latestReserve.expenseAmount ? round(latestReserve.reserveBalance / latestReserve.expenseAmount) : undefined;
  const reservePerUnit = latestReserve?.reserveBalance !== undefined && latestReserve.unitCount ? round(latestReserve.reserveBalance / latestReserve.unitCount) : undefined;
  const reserveToKnownProjectCostRatio = latestReserve?.reserveBalance !== undefined && latestReserve.plannedProjectAmount ? round(latestReserve.reserveBalance / latestReserve.plannedProjectAmount) : undefined;
  const reserveChangePct = latestReserve && previousReserve && previousReserve.reserveBalance ? pctChange(previousReserve.reserveBalance, latestReserve.reserveBalance) : undefined;
  if (latestReserve?.reserveBalance !== undefined && reserveToAnnualExpenseRatio === undefined) warnings.add("Reserve coverage ratio was not calculated because annual expenses are missing.");

  const latestDelinquency = [...periods].reverse().find((period) => period.delinquencyRate !== undefined || period.delinquencyAmount !== undefined);
  const computedDelinquencyRate = latestDelinquency?.delinquencyRate ?? (
    latestDelinquency?.delinquencyAmount !== undefined && latestDelinquency.revenueAmount ? round(latestDelinquency.delinquencyAmount / latestDelinquency.revenueAmount, 6) : undefined
  );
  if (latestDelinquency?.delinquencyAmount !== undefined && computedDelinquencyRate === undefined) warnings.add("Delinquency percentage was not calculated because the denominator is missing.");

  const latestBudget = [...periods].reverse().find((period) => period.revenueAmount !== undefined || period.expenseAmount !== undefined);
  const previousBudget = latestBudget ? [...periods].filter((period) => period !== latestBudget && period.expenseAmount !== undefined && period.amountBasis === latestBudget.amountBasis).at(-1) : undefined;
  const surplusDeficitAmount = latestBudget?.revenueAmount !== undefined && latestBudget.expenseAmount !== undefined ? round(latestBudget.revenueAmount - latestBudget.expenseAmount) : undefined;
  const expenseGrowthPct = latestBudget?.expenseAmount !== undefined && previousBudget?.expenseAmount ? pctChange(previousBudget.expenseAmount, latestBudget.expenseAmount) : undefined;

  const assessmentPeriods = periods.filter((period) => period.assessmentAmount !== undefined);
  const currentAssessment = assessmentPeriods.at(-1);
  const sourceRefs = uniqueSourceRefs(periods.flatMap((period) => period.sourceRefs));
  const resultWithoutHash = {
    contractVersion: GOVERNANCEIQ_FINANCIAL_ANALYSIS_CONTRACT_VERSION,
    governanceRecordId: input.governanceRecordId,
    governanceRecordVersion: input.governanceRecordVersion,
    periodsAnalyzed: periods.length,
    analysisState: completeness.size ? "partial" : "current",
    completeness: [...(completeness.size ? completeness : new Set<GovernanceFinancialCompletenessState>(["complete_for_available_analysis"]))].sort(),
    duesIndicator: {
      currentAmount: latestDues?.duesAmount,
      frequency: latestDues?.duesFrequency,
      annualizedCurrentAmount,
      growthPct: duesGrowthPct,
      trendState: duesGrowthPct !== undefined ? "calculated" : previous && latestDues && previous.duesFrequency !== latestDues.duesFrequency ? "incompatible_periods" : "incomplete",
    },
    reserveIndicator: {
      reserveBalance: latestReserve?.reserveBalance,
      reserveToAnnualExpenseRatio,
      reservePerUnit,
      reserveChangePct,
      reserveToKnownProjectCostRatio,
      state: latestReserve?.reserveBalance === undefined ? "missing_reserve_data" : reserveToAnnualExpenseRatio === undefined ? "missing_denominator" : "calculated",
    },
    delinquencyIndicator: {
      delinquencyAmount: latestDelinquency?.delinquencyAmount,
      delinquencyRate: computedDelinquencyRate,
      state: latestDelinquency === undefined ? "missing_delinquency_data" : computedDelinquencyRate === undefined ? "missing_denominator" : "calculated",
    },
    budgetIndicator: {
      revenueAmount: latestBudget?.revenueAmount,
      expenseAmount: latestBudget?.expenseAmount,
      surplusDeficitAmount,
      expenseGrowthPct,
      state: latestBudget === undefined || latestBudget.revenueAmount === undefined || latestBudget.expenseAmount === undefined ? "missing_budget" : "calculated",
    },
    assessmentIndicator: {
      currentAssessmentAmount: currentAssessment?.assessmentAmount,
      currentAssessmentStatus: currentAssessment?.assessmentStatus,
      adoptedAssessmentAmount: assessmentPeriods.find((period) => ["ADOPTED", "BILLED", "PAID"].includes(period.assessmentStatus ?? ""))?.assessmentAmount,
      proposedAssessmentAmount: assessmentPeriods.find((period) => period.assessmentStatus === "PROPOSED")?.assessmentAmount,
      state: assessmentState(assessmentPeriods),
    },
    associationDebtIndicator: {
      principalAmount: latest?.associationDebtAmount,
      debtServiceAmount: latest?.associationDebtServiceAmount,
      maturityDate: latest?.associationDebtMaturityDate,
      purpose: latest?.associationDebtPurpose,
      state: periods.some((period) => period.associationDebtAmount !== undefined) ? "present" : "not_found",
    },
    insuranceIndicator: {
      insuranceExpenseAmount: latest?.insuranceExpenseAmount,
      deductibleAmount: latest?.insuranceDeductibleAmount,
      state: periods.some((period) => period.insuranceExpenseAmount !== undefined || period.insuranceDeductibleAmount !== undefined) ? "descriptive_only" : "not_found",
    },
    warnings: [...warnings].sort(),
    sourceRefs,
    generatedAt: input.generatedAt,
  } satisfies Omit<GovernanceFinancialAnalysisResult, "resultHash">;

  return { ...resultWithoutHash, resultHash: deterministicHash(resultWithoutHash) };
}

export function analyzeGovernanceRestrictionIntelligence(input: {
  contractVersion: typeof GOVERNANCEIQ_RESTRICTION_INTELLIGENCE_CONTRACT_VERSION;
  governanceRecordId: string;
  governanceRecordVersion: number;
  generatedAt: string;
  findings: GovernanceRestrictionSourceFinding[];
}): GovernanceRestrictionIntelligenceResult[] {
  if (input.contractVersion !== GOVERNANCEIQ_RESTRICTION_INTELLIGENCE_CONTRACT_VERSION) throw new Error("Unsupported GovernanceIQ restriction intelligence contract version.");
  return input.findings
    .filter((finding) => finding.acceptanceState === "accepted")
    .map((finding) => {
      const normalized = normalizeRestrictionState(finding);
      const candidates = downstreamCandidates(finding.findingCategory);
      const resultWithoutHash = {
        contractVersion: GOVERNANCEIQ_RESTRICTION_INTELLIGENCE_CONTRACT_VERSION,
        governanceRecordId: input.governanceRecordId,
        governanceRecordVersion: input.governanceRecordVersion,
        category: String(finding.findingCategory),
        subcategory: stringValue(finding.normalizedValue.subcategory),
        normalizedRestriction: finding.normalizedRequirement ?? stringValue(finding.normalizedValue.requirement) ?? "source_backed_restriction",
        applicability: applicabilityFor(finding.findingCategory),
        state: normalized.state,
        forceLevel: normalized.forceLevel,
        conditions: arrayOfStrings(finding.normalizedValue.conditions),
        exceptions: arrayOfStrings(finding.normalizedValue.exceptions ?? finding.normalizedValue.exception),
        effectiveAt: finding.effectiveAt,
        expiresAt: finding.expiresAt,
        sourceFindingId: finding.governanceFindingId,
        sourceFindingVersion: finding.governanceFindingVersion,
        sourceDocumentId: finding.governanceDocumentId,
        sourceDocumentVersion: finding.governanceDocumentVersion,
        sourceEvidenceId: finding.evidenceId,
        sourceAnchor: finding.sourceAnchor,
        confidence: finding.confidence,
        verificationState: finding.verificationState,
        conflictState: finding.conflictState ?? "none",
        professionalReviewRecommended: normalized.forceLevel === "professional_review_required" || finding.professionalReviewRecommended,
        strategyCompatibilityCandidates: candidates.strategy,
        financingImpactCandidates: candidates.financing,
        operationalImpact: operationalImpactsFor(finding.findingCategory),
        explanationCode: normalized.explanationCode,
        generatedAt: input.generatedAt,
      } satisfies Omit<GovernanceRestrictionIntelligenceResult, "resultHash">;
      return { ...resultWithoutHash, resultHash: deterministicHash(resultWithoutHash) };
    });
}

export function buildGovernanceRiskGroups(input: {
  financial?: GovernanceFinancialAnalysisResult;
  restrictions?: GovernanceRestrictionIntelligenceResult[];
}): GovernanceRiskGroupResult[] {
  const restrictions = input.restrictions ?? [];
  return GOVERNANCE_RISK_GROUPS.map((group) => {
    const reasons: string[] = [];
    const hashes: string[] = [];
    let state: GovernanceRiskState = "clear";
    if (group === "financial" && input.financial) {
      hashes.push(input.financial.resultHash);
      if (input.financial.completeness.some((item) => item.startsWith("missing") || item === "partial")) state = "uncertain";
      if (input.financial.budgetIndicator.surplusDeficitAmount !== undefined && input.financial.budgetIndicator.surplusDeficitAmount < 0) state = "attention";
      if (input.financial.assessmentIndicator.state === "proposed_only") state = "attention";
      reasons.push(...input.financial.completeness);
    }
    for (const restriction of restrictions.filter((item) => riskGroupForRestriction(item.category) === group)) {
      hashes.push(restriction.resultHash);
      reasons.push(restriction.explanationCode);
      if (restriction.state === "prohibited") state = "blocked";
      else if (restriction.state === "restricted" || restriction.state === "approval_required") state = state === "blocked" ? state : "high_attention";
      else if (restriction.state === "uncertain" || restriction.state === "conflicted") state = state === "blocked" ? state : "uncertain";
      else if (restriction.state === "allowed_with_conditions") state = state === "clear" ? "low_attention" : state;
    }
    if (group === "data_quality" && (input.financial?.completeness.includes("conflicting_financial_sources") || restrictions.some((item) => item.conflictState === "unresolved_conflict"))) {
      state = "uncertain";
      reasons.push("source_conflict_or_unresolved_conflict");
      if (input.financial) hashes.push(input.financial.resultHash);
      hashes.push(...restrictions.filter((item) => item.conflictState === "unresolved_conflict").map((item) => item.resultHash));
    }
    if (group === "legal_review" && restrictions.some((item) => item.professionalReviewRecommended)) {
      state = "attention";
      reasons.push("professional_review_recommended");
      hashes.push(...restrictions.filter((item) => item.professionalReviewRecommended).map((item) => item.resultHash));
    }
    return { group, state, reasons: [...new Set(reasons)].sort(), sourceResultHashes: [...new Set(hashes)].sort() };
  });
}

const documentClassificationRules: Array<{
  documentType: GovernanceDocumentType;
  pattern: RegExp;
  evidenceLabel: string;
}> = [
  { documentType: "declaration_ccrs", pattern: /\b(declaration|covenants conditions and restrictions|cc&rs?|declaration of covenants)\b/i, evidenceLabel: "declaration language" },
  { documentType: "bylaws", pattern: /\bbylaws?\b/i, evidenceLabel: "bylaws language" },
  { documentType: "rules_regulations", pattern: /\brules? and regulations?\b/i, evidenceLabel: "rules/regulations language" },
  { documentType: "amendment", pattern: /\b(amendment|amended|deleted and replaced|is hereby amended)\b/i, evidenceLabel: "amendment language" },
  { documentType: "budget", pattern: /\b(annual budget|budgeted revenue|budgeted expenses)\b/i, evidenceLabel: "budget table language" },
  { documentType: "reserve_study", pattern: /\b(reserve study|reserve balance|component reserve)\b/i, evidenceLabel: "reserve-study language" },
  { documentType: "meeting_minutes", pattern: /\b(minutes of|board meeting|meeting minutes)\b/i, evidenceLabel: "meeting-minutes language" },
  { documentType: "assessment_notice", pattern: /\b(special assessment notice|assessment notice|notice of assessment)\b/i, evidenceLabel: "assessment-notice language" },
  { documentType: "right_of_first_refusal", pattern: /\bright of first refusal\b/i, evidenceLabel: "ROFR language" },
  { documentType: "architectural_standard", pattern: /\b(architectural standards?|architectural review|architectural approval)\b/i, evidenceLabel: "architectural-control language" },
  { documentType: "short_term_rental_rules", pattern: /\b(short[- ]term rental|airbnb|vrbo)\b/i, evidenceLabel: "short-term-rental language" },
  { documentType: "parking_vehicle_rules", pattern: /\b(parking|commercial vehicle|trailer|rv|boat)\b/i, evidenceLabel: "parking/vehicle language" },
];

export function assertGovernanceIQFoundationIsProposalOnly(candidate: Record<string, unknown>): void {
  const forbidden = new Set<string>(GOVERNANCEIQ_FORBIDDEN_DOWNSTREAM_MUTATION_FIELDS);
  for (const key of Object.keys(candidate)) {
    if (forbidden.has(key)) {
      throw new Error(`GovernanceIQ Slice 1 cannot accept downstream or legal-conclusion field: ${key}`);
    }
  }
}

export function normalizeGovernanceSourceAnchor(anchor: Record<string, unknown> | null | undefined): GovernanceSourceAnchor {
  if (!anchor) return {};
  const allowed = new Set<string>(GOVERNANCEIQ_ALLOWED_SOURCE_ANCHOR_KEYS);
  const forbidden = new Set<string>(GOVERNANCEIQ_FORBIDDEN_SOURCE_ANCHOR_KEYS);
  const normalized: GovernanceSourceAnchor = {};

  for (const [key, value] of Object.entries(anchor)) {
    if (forbidden.has(key)) {
      throw new Error(`GovernanceIQ source anchors cannot store raw document content: ${key}`);
    }
    if (!allowed.has(key) || value === null || value === undefined || value === "") continue;
    (normalized as Record<string, string | number>)[key] = typeof value === "number" ? value : String(value);
  }

  return normalized;
}

export function classifyGovernanceDocument(input: {
  filename?: string;
  extractedText?: string;
  sourceAnchor?: Record<string, unknown>;
  providerFailed?: boolean;
  unsupportedFormat?: boolean;
  illegible?: boolean;
}): GovernanceDocumentClassification {
  const anchor = normalizeGovernanceSourceAnchor(input.sourceAnchor);
  if (input.providerFailed) return classification("provider_failed", undefined, 0, [], anchor, "fallback", ["Provider failed; prior valid classification must be preserved."], []);
  if (input.unsupportedFormat) return classification("unsupported_format", undefined, 0, [], anchor, "fallback", ["Unsupported governance document format."], []);
  if (input.illegible) return classification("illegible", undefined, 0, [], anchor, "fallback", ["Document content is illegible."], []);

  const text = cleanText(input.extractedText);
  if (!text) {
    const filenameHint = documentClassificationRules.find((rule) => rule.pattern.test(input.filename ?? ""));
    return classification(
      filenameHint ? "manual_review_required" : "insufficient_content",
      filenameHint?.documentType,
      filenameHint ? 35 : 0,
      filenameHint ? [`filename_hint:${filenameHint.evidenceLabel}`] : [],
      anchor,
      filenameHint ? "filename_hint" : "fallback",
      ["Filename alone is not authoritative for GovernanceIQ classification."],
      filenameHint ? [filenameHint.documentType] : [],
    );
  }

  const matches = documentClassificationRules.filter((rule) => rule.pattern.test(text));
  if (!matches.length) return classification("manual_review_required", "other", 30, ["content reviewed without supported type match"], anchor, "content_pattern", ["No supported GovernanceIQ document type was deterministically identified."], ["other"]);
  const [first, ...rest] = matches;
  return classification(
    rest.length ? "classification_conflict" : "classified_proposed",
    first.documentType,
    rest.length ? 62 : 78,
    matches.map((match) => `content:${match.evidenceLabel}`),
    anchor,
    "content_pattern",
    rest.length ? ["Multiple plausible governance document types require review."] : [],
    rest.map((match) => match.documentType),
  );
}

export function validateGovernanceExtractionCandidate(candidate: GovernanceExtractionCandidate): GovernanceExtractionCandidate {
  assertGovernanceIQFoundationIsProposalOnly(candidate.normalizedValue as Record<string, unknown>);
  if (candidate.contractVersion !== GOVERNANCEIQ_EXTRACTION_CONTRACT_VERSION) throw new Error("Unsupported GovernanceIQ extraction contract version.");
  if (!GOVERNANCE_EXTRACTION_TYPES.includes(candidate.extractionType)) throw new Error(`Unsupported GovernanceIQ extraction type: ${candidate.extractionType}`);
  if (!GOVERNANCE_FINDING_CATEGORIES.includes(candidate.findingCategory)) throw new Error(`Unsupported GovernanceIQ finding category: ${candidate.findingCategory}`);
  if (candidate.confidence < 0 || candidate.confidence > 100) throw new Error("GovernanceIQ extraction confidence must be between 0 and 100.");
  if (!candidate.sourceAnchor || Object.keys(normalizeGovernanceSourceAnchor(candidate.sourceAnchor)).length === 0) {
    throw new Error("SOURCE_ANCHOR_INCOMPLETE");
  }
  if (JSON.stringify(candidate.normalizedValue).length > 4_000) throw new Error("GovernanceIQ normalized extraction payload is too large.");
  return candidate;
}

export function detectGovernanceFindingConflicts(findings: GovernanceExtractionCandidate[]): GovernanceDetectedConflict[] {
  const conflicts: GovernanceDetectedConflict[] = [];
  for (let i = 0; i < findings.length; i += 1) {
    for (let j = i + 1; j < findings.length; j += 1) {
      const a = findings[i];
      const b = findings[j];
      if (a.findingCategory !== b.findingCategory) continue;
      const conflictType = conflictTypeFor(a, b);
      if (!conflictType) continue;
      conflicts.push({
        conflictType,
        severity: severityForConflict(a.findingCategory, a.normalizedValue, b.normalizedValue),
        category: a.findingCategory,
        summary: `${a.findingCategory} provisions conflict and require review.`,
        sourceAAnchor: a.sourceAnchor,
        sourceBAnchor: b.sourceAnchor,
        normalizedA: a.normalizedValue,
        normalizedB: b.normalizedValue,
        confidence: Math.min(a.confidence, b.confidence),
        detectionMethod: "deterministic_normalized_value",
        professionalReviewRecommended: true,
      });
    }
  }
  return conflicts;
}

export function proposeGovernanceHierarchyCandidate(input: {
  documentType: GovernanceDocumentType;
  documentUploadedAt?: string;
  documentEffectiveAt?: string;
  explicitRelationshipType?: GovernanceDocumentRelationshipType;
  sourceAnchor?: Record<string, unknown>;
  relationshipIds?: string[];
}): GovernanceHierarchyCandidate {
  const anchor = normalizeGovernanceSourceAnchor(input.sourceAnchor);
  if (input.explicitRelationshipType === "supersedes" || input.explicitRelationshipType === "amends" || input.explicitRelationshipType === "restates") {
    return {
      contractVersion: GOVERNANCEIQ_DOCUMENT_ANALYSIS_CONTRACT_VERSION,
      governanceHierarchyCandidateId: "candidate",
      governanceDocumentId: "document",
      hierarchyState: "candidate_current",
      relationshipIds: input.relationshipIds ?? [],
      sourceAnchor: anchor,
      reasoningCode: "explicit_source_relationship",
      confidence: 82,
      professionalReviewRecommended: input.explicitRelationshipType === "amends",
    };
  }
  return {
    contractVersion: GOVERNANCEIQ_DOCUMENT_ANALYSIS_CONTRACT_VERSION,
    governanceHierarchyCandidateId: "candidate",
    governanceDocumentId: "document",
    hierarchyState: "hierarchy_uncertain",
    relationshipIds: input.relationshipIds ?? [],
    sourceAnchor: anchor,
    reasoningCode: input.documentUploadedAt || input.documentEffectiveAt ? "date_without_explicit_supersession_not_controlling" : "insufficient_hierarchy_evidence",
    confidence: 35,
    professionalReviewRecommended: true,
  };
}

function classification(
  classificationState: GovernanceDocumentClassificationState,
  proposedDocumentType: GovernanceDocumentType | undefined,
  confidence: number,
  evidenceBasis: string[],
  sourceAnchor: GovernanceSourceAnchor,
  classificationMethod: GovernanceDocumentClassification["classificationMethod"],
  warnings: string[],
  ambiguityCandidates: GovernanceDocumentType[],
): GovernanceDocumentClassification {
  return {
    contractVersion: GOVERNANCEIQ_DOCUMENT_ANALYSIS_CONTRACT_VERSION,
    governanceDocumentId: "pending",
    proposedDocumentType,
    classificationState,
    confidence,
    evidenceBasis,
    sourceAnchor,
    classificationMethod,
    verificationState: classificationState === "classified_verified" ? "confirmed" : "document_extracted",
    warnings,
    ambiguityCandidates,
  };
}

function conflictTypeFor(a: GovernanceExtractionCandidate, b: GovernanceExtractionCandidate): GovernanceConflictType | undefined {
  const av = a.normalizedValue;
  const bv = b.normalizedValue;
  if (av.allowed !== undefined && bv.allowed !== undefined && av.allowed !== bv.allowed) return "restriction_conflict";
  if (av.amount !== undefined && bv.amount !== undefined && av.amount !== bv.amount) return a.extractionType === "financial_input" || b.extractionType === "financial_input" ? "financial_conflict" : "value_conflict";
  if (a.normalizedRequirement && b.normalizedRequirement && a.normalizedRequirement !== b.normalizedRequirement) return "value_conflict";
  return undefined;
}

function severityForConflict(category: GovernanceFindingCategory, a: Record<string, Json>, b: Record<string, Json>): GovernanceSeverity {
  if (["rental", "short_term_rental", "trailer", "parking", "right_of_first_refusal", "board_approval"].includes(category)) return "high";
  if (a.amount !== undefined && b.amount !== undefined) return "high";
  return "moderate";
}

function annualizeDues(amount: number, frequency?: string) {
  const multiplier = frequency ? frequencyToAnnualMultiplier[frequency] : undefined;
  return multiplier ? round(amount * multiplier) : undefined;
}

function pctChange(previous: number, current: number) {
  return previous === 0 ? undefined : round((current - previous) / previous, 6);
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function uniqueSourceRefs(refs: GovernanceSourceRef[]) {
  const seen = new Set<string>();
  return refs.filter((ref) => {
    const key = deterministicHash(ref);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hasConflictingFinancialSources(periods: GovernanceFinancialPeriodInput[]) {
  return periods.some((period) => period.sourceRefs.some((ref) => ref.verificationState === "conflicting" || ref.sourceClassification === "conflict"));
}

function assessmentState(periods: GovernanceFinancialPeriodInput[]): GovernanceFinancialAnalysisResult["assessmentIndicator"]["state"] {
  if (!periods.length) return "none_found";
  if (periods.some((period) => !period.assessmentStatus)) return "missing_assessment_status";
  if (periods.some((period) => ["ADOPTED", "BILLED", "PAID"].includes(period.assessmentStatus ?? ""))) return "adopted_or_billed";
  if (periods.some((period) => period.assessmentStatus === "PROPOSED")) return "proposed_only";
  return "none_found";
}

function normalizeRestrictionState(finding: GovernanceRestrictionSourceFinding): {
  state: GovernanceRestrictionState;
  forceLevel: GovernanceRestrictionForceLevel;
  explanationCode: string;
} {
  if (finding.acceptanceState === "expired") return { state: "expired", forceLevel: "advisory", explanationCode: "restriction_expired" };
  if (finding.acceptanceState === "superseded") return { state: "superseded", forceLevel: "advisory", explanationCode: "restriction_superseded" };
  if (finding.conflictState === "unresolved_conflict" || finding.verificationState === "conflicting") {
    return { state: "conflicted", forceLevel: "professional_review_required", explanationCode: "source_conflict_requires_review" };
  }

  const value = finding.normalizedValue;
  const category = String(finding.findingCategory);
  const explicitlyAllowed = value.allowed === true || value.isAllowed === true;
  const explicitlyProhibited = value.allowed === false || value.prohibited === true || value.isProhibited === true;
  const approvalRequired = value.approvalRequired === true || value.boardApprovalRequired === true;
  const hasConditions = arrayOfStrings(value.conditions).length > 0 || value.minimumLeaseMonths !== undefined || value.maximumLeaseDays !== undefined;
  const hasExceptions = arrayOfStrings(value.exceptions ?? value.exception).length > 0;

  if (category === "commercial_vehicle" && value.pickupIncluded !== true && /pickup/i.test(String(value.vehicleType ?? value.requirement ?? ""))) {
    return { state: "uncertain", forceLevel: "professional_review_required", explanationCode: "commercial_vehicle_pickup_scope_uncertain" };
  }
  if (category === "room_rental" && !explicitlyAllowed && !explicitlyProhibited && !approvalRequired) {
    return { state: "uncertain", forceLevel: "professional_review_required", explanationCode: "room_rental_scope_uncertain" };
  }
  if (explicitlyProhibited) {
    return {
      state: "prohibited",
      forceLevel: "hard",
      explanationCode: hasExceptions ? "prohibited_with_source_exception" : "source_states_prohibited",
    };
  }
  if (approvalRequired) return { state: "approval_required", forceLevel: "hard", explanationCode: "source_requires_approval" };
  if (explicitlyAllowed && hasConditions) return { state: "allowed_with_conditions", forceLevel: "advisory", explanationCode: "allowed_with_source_conditions" };
  if (explicitlyAllowed) return { state: "allowed", forceLevel: "advisory", explanationCode: "source_states_allowed" };
  if (hasConditions) return { state: "restricted", forceLevel: "ambiguous", explanationCode: "source_conditions_without_clear_permission_state" };
  return { state: "unknown", forceLevel: finding.professionalReviewRecommended ? "professional_review_required" : "ambiguous", explanationCode: "restriction_state_not_normalized" };
}

function downstreamCandidates(category: string | GovernanceFindingCategory) {
  const key = String(category);
  const strategy = new Set<string>();
  const financing = new Set<string>();
  if (["rental", "short_term_rental", "room_rental", "occupancy", "entity_ownership", "corporate_entity_ownership"].includes(key)) strategy.add("rental_strategy_compatibility");
  if (["renovation", "architectural_approval", "contractor_requirement", "work_hours", "materials_colors", "landscaping", "fencing", "solar", "ev", "antenna", "structural_work"].includes(key)) strategy.add("renovation_strategy_compatibility");
  if (["parking", "commercial_vehicle", "pickup_truck", "trailer", "rv", "boat", "towing"].includes(key)) strategy.add("vehicle_parking_operational_fit");
  if (["right_of_first_refusal", "board_approval", "transfer", "lender_requirement", "governance_financing_risk"].includes(key)) financing.add("financing_or_transfer_review_candidate");
  return { strategy: [...strategy].sort(), financing: [...financing].sort() };
}

function applicabilityFor(category: string | GovernanceFindingCategory): GovernanceRestrictionIntelligenceResult["applicability"] {
  const key = String(category);
  if (["parking", "commercial_vehicle", "pickup_truck", "trailer", "rv", "boat", "towing"].includes(key)) return "vehicle";
  if (["renovation", "architectural_approval", "contractor_requirement", "work_hours", "materials_colors", "landscaping", "fencing", "solar", "ev", "antenna", "structural_work"].includes(key)) return "project";
  if (["rental", "short_term_rental", "room_rental", "occupancy"].includes(key)) return "occupant";
  if (["transfer", "right_of_first_refusal", "board_approval", "lender_requirement", "governance_financing_risk"].includes(key)) return "deal";
  return "property";
}

function operationalImpactsFor(category: string | GovernanceFindingCategory) {
  const key = String(category);
  if (["parking", "commercial_vehicle", "pickup_truck", "trailer", "rv", "boat", "towing"].includes(key)) return ["parking_vehicle_operations"];
  if (["pet", "noise", "storage", "home_business", "signage"].includes(key)) return ["occupancy_operations"];
  if (["renovation", "architectural_approval", "contractor_requirement", "work_hours"].includes(key)) return ["project_execution"];
  return [];
}

function riskGroupForRestriction(category: string): GovernanceRiskGroup {
  if (["rental", "short_term_rental", "room_rental", "occupancy", "entity_ownership", "corporate_entity_ownership"].includes(category)) return "rental";
  if (["parking", "commercial_vehicle", "pickup_truck", "trailer", "rv", "boat", "towing"].includes(category)) return "parking_vehicle";
  if (["renovation", "architectural_approval", "contractor_requirement", "work_hours", "materials_colors", "landscaping", "fencing", "solar", "ev", "antenna", "structural_work"].includes(category)) return "renovation";
  if (["insurance", "insurance_expense", "deductible"].includes(category)) return "insurance";
  if (["transfer", "right_of_first_refusal", "board_approval", "lender_requirement", "governance_financing_risk"].includes(category)) return "transfer_financing";
  return "legal_review";
}

function isAcceptedGovernanceState(state: GovernanceAcceptanceState) {
  return ["accepted", "accepted_with_verification", "accepted_professional", "confirmed"].includes(state);
}

function temporalMateriality(effectiveAt: string | undefined, expiresAt: string | undefined, asOf: string): GovernanceChangeMateriality {
  const now = Date.parse(asOf);
  if (Number.isNaN(now)) return "material";
  if (effectiveAt && Date.parse(effectiveAt) > now) return "upcoming";
  if (expiresAt && Date.parse(expiresAt) <= now) return "expired";
  return "material";
}

function uncertaintyReason(input: Pick<GovernanceChangeBuildInput, "verificationState" | "conflictState">): string | undefined {
  if (input.conflictState === "unresolved_conflict" || input.verificationState === "conflicting") return "uncertain_conflicted_governance";
  if (["unknown", "unverified", "document_extracted", "professional_review_recommended"].includes(input.verificationState)) return "uncertain_requires_review";
  return undefined;
}

function classifyGovernanceImpact(input: {
  category: string | GovernanceFindingCategory;
  normalizedValue: Record<string, Json>;
  verificationState: GovernanceVerificationState;
  conflictState?: GovernanceRestrictionSourceFinding["conflictState"];
  temporalMateriality: GovernanceChangeMateriality;
  activeStrategyIds: string[];
  affectedStrategyUses: string[];
}): { materiality: GovernanceChangeMateriality; impactDomains: GovernanceImpactDomain[]; reasonCodes: string[] } {
  const category = String(input.category);
  const domains = new Set<GovernanceImpactDomain>(["cockpit", "reporting"]);
  const reasons = new Set<string>();
  const assessmentStatus = String(input.normalizedValue.assessmentStatus ?? input.normalizedValue.status ?? "").toUpperCase();
  const hasRelevantVehicleUse = input.affectedStrategyUses.some((use) => /trailer|rv|boat|vehicle|parking/i.test(use));

  if (["dues", "recurring_governance_fee", "association_fee"].includes(category)) {
    domains.add("underwriting");
    reasons.add("recurring_governance_cost");
  } else if (category === "assessment") {
    if (["ADOPTED", "BILLED", "PAID"].includes(assessmentStatus)) {
      domains.add("underwriting");
      reasons.add("adopted_assessment_cost");
    } else {
      domains.add("task_deadline");
      reasons.add("assessment_not_authoritative_for_underwriting");
    }
  } else if (["insurance"].includes(category) && input.normalizedValue.amount !== undefined) {
    domains.add("underwriting");
    domains.add("finance");
    reasons.add("accepted_insurance_cost_or_gap");
  } else if (["short_term_rental", "rental", "room_rental", "occupancy"].includes(category)) {
    domains.add("strategy");
    reasons.add("rental_strategy_constraint");
  } else if (["trailer", "rv", "boat", "parking", "commercial_vehicle", "pickup_truck"].includes(category)) {
    if (hasRelevantVehicleUse || category === "parking") {
      domains.add("strategy");
      reasons.add("vehicle_or_parking_strategy_constraint");
    } else {
      reasons.add("vehicle_restriction_no_active_dependent_strategy");
    }
  } else if (["architectural_approval", "renovation", "contractor_requirement", "work_hours", "materials_colors"].includes(category)) {
    domains.add("strategy");
    domains.add("task_deadline");
    reasons.add("renovation_condition_or_task_candidate");
  } else if (["litigation", "lender_requirement", "governance_financing_risk", "entity_ownership", "board_approval", "right_of_first_refusal", "transfer"].includes(category)) {
    domains.add("finance");
    if (category === "entity_ownership") domains.add("strategy");
    if (["right_of_first_refusal", "board_approval"].includes(category)) domains.add("task_deadline");
    reasons.add("financing_or_transfer_condition_candidate");
  }

  if (input.temporalMateriality === "upcoming") reasons.add("future_effective_not_current");
  if (domains.size === 2 && domains.has("cockpit") && domains.has("reporting")) {
    domains.clear();
    domains.add("none");
    return { materiality: "not_material", impactDomains: ["none"], reasonCodes: sortedUniqueStrings([...reasons, "no_targeted_downstream_domain"]) };
  }
  return { materiality: "material", impactDomains: [...domains], reasonCodes: sortedUniqueStrings([...reasons]) };
}

function buildDownstreamProposals(change: GovernanceChange, existingProposalKeys: string[]): GovernanceDownstreamProposal[] {
  if (!["material", "upcoming", "uncertain"].includes(change.materiality)) return [];
  const existing = new Set(existingProposalKeys);
  const proposals: GovernanceDownstreamProposal[] = [];
  const add = (
    domain: Exclude<GovernanceImpactDomain, "none" | "reporting">,
    proposalType: GovernanceDownstreamProposalType,
    targetField: string | undefined,
    explanation: string,
    targetStrategyIds: string[] = [],
  ) => {
    const proposalKey = `${change.governanceFindingId}:v${change.findingVersion}:${domain}:${targetField ?? proposalType}`;
    if (existing.has(proposalKey)) return;
    proposals.push({
      proposalType,
      domain,
      proposalKey,
      targetField,
      targetStrategyIds: sortedUniqueStrings(targetStrategyIds),
      normalizedValue: change.normalizedValue,
      sourceFindingId: change.governanceFindingId,
      sourceFindingVersion: change.findingVersion,
      sourceEvidenceId: change.sourceEvidenceId,
      sourceAnchor: change.sourceAnchor,
      state: change.materiality === "uncertain" ? "blocked" : change.materiality === "upcoming" ? "queued" : "proposed",
      explanation,
      idempotencyKey: `${change.idempotencyKey}:${domain}:${targetField ?? proposalType}`,
    });
  };

  if (change.impactDomains.includes("underwriting")) {
    add("underwriting", "underwriting_input", underwritingFieldFor(change.category), explanationForChange(change));
  }
  if (change.impactDomains.includes("strategy")) {
    add("strategy", "strategy_constraint", strategyConstraintFor(change.category), explanationForChange(change), strategyTargetsFor(change.category));
  }
  if (change.impactDomains.includes("finance")) {
    add("finance", "finance_condition", financeConditionFor(change.category), explanationForChange(change));
  }
  if (change.impactDomains.includes("cockpit")) {
    add("cockpit", "cockpit_warning", "governance_impact", explanationForChange(change));
  }
  if (change.impactDomains.includes("task_deadline")) {
    add("task_deadline", "task_proposal", taskProposalFor(change.category), explanationForChange(change));
  }
  return proposals.sort((a, b) => a.domain.localeCompare(b.domain) || a.proposalKey.localeCompare(b.proposalKey));
}

function downstreamStatesFor(
  change: GovernanceChange,
  failures: GovernancePropagationFailure[],
  hasPriorValidResult: boolean,
  proposals: GovernanceDownstreamProposal[],
): Record<Exclude<GovernanceImpactDomain, "none" | "reporting">, GovernancePropagationState> {
  const domains: Array<Exclude<GovernanceImpactDomain, "none" | "reporting">> = ["underwriting", "strategy", "finance", "cockpit", "task_deadline"];
  const state = Object.fromEntries(domains.map((domain) => [domain, "not_affected" as GovernancePropagationState])) as Record<Exclude<GovernanceImpactDomain, "none" | "reporting">, GovernancePropagationState>;
  for (const proposal of proposals) {
    state[proposal.domain] = proposal.state === "blocked" ? "blocked" : proposal.state === "queued" ? "queued" : "stale";
  }
  for (const failure of failures) state[failure.domain] = governancePropagationStateAfterFailure({ domain: failure.domain, hasPriorValidResult });
  if (change.materiality === "expired") {
    for (const domain of domains) if (state[domain] !== "not_affected") state[domain] = "superseded";
  }
  return state;
}

function buildGovernanceChangeExplanations(
  change: GovernanceChange,
  proposals: GovernanceDownstreamProposal[],
  failures: GovernancePropagationFailure[],
): string[] {
  const explanations = new Set<string>();
  explanations.add(explanationForChange(change));
  if (change.materiality === "upcoming" && change.effectiveAt) explanations.add(`Accepted ${humanCategory(change.category)} is future-effective on ${change.effectiveAt}; current downstream results remain current until that date.`);
  if (change.materiality === "uncertain") explanations.add(`Accepted ${humanCategory(change.category)} remains uncertain and is routed for review, not as a verified hard downstream fact.`);
  for (const proposal of proposals) explanations.add(proposal.explanation);
  for (const failure of failures) explanations.add(`${humanDomain(failure.domain)} propagation failed with prior valid result preserved: ${failure.safeMessage}`);
  return sortedUniqueStrings([...explanations]);
}

function explanationForChange(change: GovernanceChange): string {
  const previous = conciseValue(change.previousAcceptedValue);
  const current = conciseValue(change.normalizedValue);
  if (previous !== "unset" && current !== "unset") return `Accepted ${humanCategory(change.category)} changed from ${previous} to ${current}.`;
  if (change.category === "short_term_rental" && change.normalizedValue.allowed === false) return "Short-term rentals are prohibited by accepted governance finding.";
  if (change.category === "architectural_approval") return "Architectural approval is required by accepted governance finding.";
  if (change.category === "litigation") return "Governance litigation requires FinanceIQ condition review.";
  return `Accepted ${humanCategory(change.category)} changed.`;
}

function underwritingFieldFor(category: string) {
  if (category === "dues") return "operating_expenses.hoa_dues";
  if (category === "assessment") return "project_costs.governance_assessment";
  if (category === "insurance") return "operating_expenses.insurance";
  return "accepted_governance_input";
}

function strategyConstraintFor(category: string) {
  if (category === "short_term_rental" || category === "rental" || category === "room_rental") return "governance_rental_constraint";
  if (category === "architectural_approval" || category === "renovation") return "governance_renovation_condition";
  if (["trailer", "rv", "boat", "parking", "commercial_vehicle"].includes(category)) return "governance_vehicle_parking_constraint";
  if (category === "entity_ownership") return "governance_entity_ownership_constraint";
  return "governance_strategy_constraint";
}

function financeConditionFor(category: string) {
  if (category === "litigation") return "governance_litigation_review";
  if (category === "insurance") return "governance_master_insurance_review";
  if (category === "entity_ownership") return "governance_entity_ownership_review";
  if (category === "lender_requirement") return "association_lender_questionnaire";
  return "governance_financing_condition";
}

function taskProposalFor(category: string) {
  if (category === "architectural_approval") return "obtain_architectural_approval";
  if (category === "right_of_first_refusal") return "attorney_review_right_of_first_refusal";
  if (category === "assessment") return "confirm_special_assessment";
  if (category === "lender_requirement") return "obtain_lender_questionnaire";
  return "review_governance_requirement";
}

function strategyTargetsFor(category: string) {
  if (category === "short_term_rental") return ["residential.short_term_rental", "residential.medium_term_rental"];
  if (category === "room_rental") return ["residential.rent_by_room", "residential.co_living"];
  if (category === "architectural_approval" || category === "renovation") return ["residential.fix_and_flip", "residential.brrrr", "residential.light_value_add"];
  return [];
}

function conciseValue(value?: Record<string, Json>) {
  if (!value) return "unset";
  const amount = value.amount ?? value.duesAmount ?? value.assessmentAmount;
  const frequency = value.frequency ?? value.duesFrequency;
  if (typeof amount === "number") return `${amount}${frequency ? ` ${frequency}` : ""}`;
  if (value.allowed === false) return "prohibited";
  if (value.approvalRequired === true) return "approval required";
  return stableStringify(value);
}

function humanCategory(category: string) {
  return category.replace(/_/g, " ");
}

function humanDomain(domain: string) {
  return domain.replace(/_/g, " ");
}

function sortedImpactDomains(domains: GovernanceImpactDomain[]) {
  return [...new Set(domains.filter(Boolean))].sort((a, b) => impactDomainOrder(a) - impactDomainOrder(b));
}

function impactDomainOrder(domain: GovernanceImpactDomain) {
  return ["underwriting", "strategy", "finance", "cockpit", "task_deadline", "reporting", "none"].indexOf(domain);
}

function sortedUniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function stableObject(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, entryValue]) => entryValue !== undefined).sort(([a], [b]) => a.localeCompare(b)));
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) if (child && typeof child === "object") deepFreeze(child);
  }
  return value;
}

function arrayOfStrings(value: Json | undefined): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function stringValue(value: Json | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function deterministicHash(value: unknown) {
  const source = stableStringify(value);
  let hash = 0x811c9dc5;
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entryValue]) => entryValue !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`).join(",")}}`;
}

function cleanText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}
