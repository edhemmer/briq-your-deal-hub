export const CONTRACTIQ_FOUNDATION_CONTRACT_VERSION = "contractiq-foundation-v1" as const;
export const CONTRACTIQ_PROJECTION_CONTRACT_VERSION = "contractiq-projection-v1" as const;
export const CONTRACTIQ_DOCUMENT_ANALYSIS_CONTRACT_VERSION = "contractiq-document-analysis-v1" as const;
export const CONTRACTIQ_EXTRACTION_CONTRACT_VERSION = "contractiq-extraction-v1" as const;
export const CONTRACTIQ_DEADLINE_ENGINE_VERSION = "contractiq-deadline-engine-v1" as const;

export const CONTRACT_TYPES = [
  "purchase_agreement",
  "offer",
  "counteroffer",
  "amendment",
  "addendum",
  "seller_disclosure",
  "land_purchase_agreement",
  "option_agreement",
  "development_agreement",
  "easement",
  "residential_lease",
  "commercial_lease",
  "ground_lease",
  "lease_amendment",
  "guaranty",
  "loan_agreement",
  "promissory_note",
  "mortgage_deed_of_trust",
  "operating_agreement",
  "title_commitment",
  "survey",
  "settlement_statement",
  "deed",
  "escrow_agreement",
  "service_agreement",
  "other",
] as const;

export const CONTRACT_STATUSES = [
  "draft",
  "proposed",
  "submitted",
  "countered",
  "partially_executed",
  "executed",
  "under_review",
  "contingent",
  "amended",
  "superseded",
  "terminated",
  "cancelled",
  "expired",
  "closed",
  "unknown",
] as const;

export const CONTRACT_PERSPECTIVES = ["buyer", "seller", "landlord", "tenant", "borrower", "lender", "developer", "investor", "guarantor"] as const;
export const CONTRACT_VERIFICATION_STATES = ["unverified", "source_backed", "verified", "professional_verified", "conflicted", "unknown"] as const;
export const CONTRACT_ANALYSIS_STATES = [
  "no_contract",
  "uploaded",
  "processing",
  "partial",
  "awaiting_verification",
  "current",
  "current_with_conflicts",
  "stale",
  "failed_with_prior_analysis",
  "professional_review_required",
  "superseded",
  "expired",
] as const;

export const CONTRACT_PROPOSAL_STATES = ["proposed", "accepted", "rejected", "disputed", "superseded", "expired"] as const;
export const CONTRACT_DEADLINE_STATUSES = ["proposed", "pending_verification", "current", "completed", "waived", "missed", "expired", "superseded", "cancelled", "unknown"] as const;
export const CONTRACT_RELATIONSHIP_TYPES = ["amends", "amended_by", "supersedes", "superseded_by", "supplements", "restates", "related_to"] as const;
export const CONTRACT_DOCUMENT_CLASSIFICATION_STATES = [
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
export const CONTRACT_CLASSIFICATION_METHODS = ["content_pattern", "provider_structured", "manual", "filename_hint", "fallback"] as const;
export const CONTRACT_ANALYSIS_RUN_STATUSES = [
  "queued",
  "processing",
  "partial",
  "completed",
  "failed",
  "provider_failed",
  "malformed_response",
  "unsupported_file",
  "insufficient_content",
  "illegible",
  "stale",
  "superseded",
] as const;
export const CONTRACT_ANALYSIS_ERROR_CODES = [
  "provider_unavailable",
  "provider_timeout",
  "malformed_response",
  "incomplete_extraction",
  "insufficient_context",
  "unsupported_file",
  "illegible_source",
  "source_anchor_incomplete",
  "validation_failed",
  "unknown_error",
] as const;
export const CONTRACT_EXTRACTION_TYPES = [
  "party",
  "signature",
  "property_identity",
  "economic_term",
  "financing_term",
  "contingency",
  "due_diligence",
  "closing_possession",
  "representation_warranty",
  "default_remedy",
  "assignment_transfer",
  "notice",
  "amendment_relationship",
  "base_contract_match",
  "supersession_candidate",
  "conflict_candidate",
  "finding",
  "question",
] as const;
export const CONTRACT_CONTINGENCY_TYPES = [
  "inspection",
  "financing",
  "appraisal",
  "attorney_review",
  "title",
  "survey",
  "environmental",
  "zoning",
  "association",
  "lease_review",
  "financial_review",
  "feasibility",
  "sale_of_existing_property",
  "access_testing",
  "other",
] as const;
export const CONTRACT_PARTY_MATCH_STATES = ["exact_match", "likely_match", "ambiguous_match", "no_match", "manual_review_required"] as const;
export const CONTRACT_BASE_MATCH_STATES = ["exact_base_match", "likely_base_match", "ambiguous_base_match", "missing_base_contract", "manual_review_required"] as const;
export const CONTRACT_CURRENTNESS_STATES = ["current_candidate", "historical", "superseded_candidate", "conflicting", "uncertain"] as const;
export const CONTRACT_AMBIGUITY_STATES = ["none", "ambiguous", "conflicting", "incomplete", "manual_review_required"] as const;
export const CONTRACT_DEADLINE_TRIGGER_TYPES = [
  "contract_execution",
  "mutual_acceptance",
  "effective_date",
  "delivery",
  "receipt",
  "notice",
  "deposit",
  "inspection",
  "disclosure_delivery",
  "title_delivery",
  "survey_delivery",
  "financing_application",
  "loan_commitment",
  "appraisal",
  "attorney_review_start",
  "amendment_execution",
  "closing",
  "possession",
  "custom_verified_date",
] as const;
export const CONTRACT_DEADLINE_OFFSET_UNITS = ["hours", "calendar_days", "business_days", "weeks", "months", "years"] as const;
export const CONTRACT_DEADLINE_COUNTING_RULES = [
  "start_after_trigger",
  "include_trigger_day",
  "exclude_trigger_day",
  "exact_elapsed_hours",
  "calendar_date_offset",
  "business_day_offset",
] as const;
export const CONTRACT_DEADLINE_BUSINESS_DAY_RULES = ["none", "exclude_weekends_and_holidays", "source_specific", "uncertain"] as const;
export const CONTRACT_DEADLINE_WEEKEND_RULES = ["no_adjustment", "next_business_day", "previous_business_day", "next_calendar_day", "source_specific", "uncertain"] as const;
export const CONTRACT_DEADLINE_TIME_OF_DAY_RULES = ["exact_stated_time", "end_of_day", "close_of_business", "noon", "midnight", "time_unspecified"] as const;
export const CONTRACT_DEADLINE_TRIGGER_VERIFICATION_STATES = ["extracted_proposed", "user_confirmed", "source_verified", "professional_verified", "conflicted", "unknown"] as const;
export const CONTRACT_DEADLINE_RESULT_STATUSES = [
  "proposed",
  "current",
  "uncertain",
  "missing_trigger",
  "missing_rule",
  "stale",
  "superseded",
  "failed_with_prior_valid",
  "waived",
  "completed",
  "missed",
  "cancelled",
  "expired",
] as const;

export type ContractType = (typeof CONTRACT_TYPES)[number];
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];
export type ContractPerspective = (typeof CONTRACT_PERSPECTIVES)[number];
export type ContractVerificationState = (typeof CONTRACT_VERIFICATION_STATES)[number];
export type ContractAnalysisState = (typeof CONTRACT_ANALYSIS_STATES)[number];
export type ContractProposalState = (typeof CONTRACT_PROPOSAL_STATES)[number];
export type ContractDeadlineStatus = (typeof CONTRACT_DEADLINE_STATUSES)[number];
export type ContractRelationshipType = (typeof CONTRACT_RELATIONSHIP_TYPES)[number];
export type ContractDocumentClassificationState = (typeof CONTRACT_DOCUMENT_CLASSIFICATION_STATES)[number];
export type ContractClassificationMethod = (typeof CONTRACT_CLASSIFICATION_METHODS)[number];
export type ContractAnalysisRunStatus = (typeof CONTRACT_ANALYSIS_RUN_STATUSES)[number];
export type ContractAnalysisErrorCode = (typeof CONTRACT_ANALYSIS_ERROR_CODES)[number];
export type ContractExtractionType = (typeof CONTRACT_EXTRACTION_TYPES)[number];
export type ContractContingencyType = (typeof CONTRACT_CONTINGENCY_TYPES)[number];
export type ContractPartyMatchState = (typeof CONTRACT_PARTY_MATCH_STATES)[number];
export type ContractBaseMatchState = (typeof CONTRACT_BASE_MATCH_STATES)[number];
export type ContractCurrentnessState = (typeof CONTRACT_CURRENTNESS_STATES)[number];
export type ContractAmbiguityState = (typeof CONTRACT_AMBIGUITY_STATES)[number];
export type ContractDeadlineTriggerType = (typeof CONTRACT_DEADLINE_TRIGGER_TYPES)[number];
export type ContractDeadlineOffsetUnit = (typeof CONTRACT_DEADLINE_OFFSET_UNITS)[number];
export type ContractDeadlineCountingRule = (typeof CONTRACT_DEADLINE_COUNTING_RULES)[number];
export type ContractDeadlineBusinessDayRule = (typeof CONTRACT_DEADLINE_BUSINESS_DAY_RULES)[number];
export type ContractDeadlineWeekendRule = (typeof CONTRACT_DEADLINE_WEEKEND_RULES)[number];
export type ContractDeadlineTimeOfDayRule = (typeof CONTRACT_DEADLINE_TIME_OF_DAY_RULES)[number];
export type ContractDeadlineTriggerVerificationState = (typeof CONTRACT_DEADLINE_TRIGGER_VERIFICATION_STATES)[number];
export type ContractDeadlineResultStatus = (typeof CONTRACT_DEADLINE_RESULT_STATUSES)[number];

export type ContractSourceAnchorKind =
  | "page"
  | "section"
  | "article"
  | "clause"
  | "paragraph"
  | "exhibit"
  | "schedule"
  | "addendum"
  | "signature_block"
  | "table"
  | "row"
  | "email_message"
  | "attachment"
  | "quoted_line"
  | "reference";

export interface ContractSourceAnchor {
  kind: ContractSourceAnchorKind;
  label?: string;
  page?: number;
  section?: string;
  clause?: string;
  paragraph?: string;
  evidenceId?: string;
  lineRef?: string;
}

export interface ContractProviderMetadata {
  providerId: string;
  method: "deterministic_fixture" | "provider_structured" | "manual" | "content_pattern";
  modelId?: string;
  promptVersion?: string;
  providerContractVersion?: string;
}

export interface ContractFoundationRecord {
  contractId: string;
  contractVersion: number;
  workspaceId: string;
  dealId: string;
  propertyId: string;
  contractType: ContractType;
  title: string;
  perspective: ContractPerspective;
  status: ContractStatus;
  verificationState: ContractVerificationState;
  analysisState: ContractAnalysisState;
  confidence: number;
}

export interface ContractTermProposal {
  contractTermId: string;
  contractId: string;
  termCategory: string;
  termType: string;
  title: string;
  normalizedValue: Record<string, unknown>;
  displayValue?: string;
  sourceEvidenceId?: string;
  sourceAnchor: ContractSourceAnchor;
  sourceQuoteRef?: string;
  verificationState: ContractVerificationState;
  proposalState: ContractProposalState;
  materiality: "immaterial" | "informational" | "material" | "critical" | "unknown";
}

export interface ContractProjection {
  contractId: string;
  contractVersion: number;
  workspaceId: string;
  dealId: string;
  propertyId: string;
  title: string;
  perspective: ContractPerspective;
  status: ContractStatus;
  projectionState: ContractAnalysisState | "archived";
  evidenceCount: number;
  partyCount: number;
  termCount: number;
  acceptedTermCount: number;
  deadlineCount: number;
  findingCount: number;
  unresolvedConflictCount: number;
  openQuestionCount: number;
  professionalReviewRequired: boolean;
  classificationState?: ContractDocumentClassificationState;
  extractionFreshnessState?: ContractCurrentnessState | "stale" | "failed_with_prior_valid";
  verifiedPartyCount?: number;
  unverifiedPartyCount?: number;
  proposedTermCount?: number;
  contingencyCount?: number;
  amendmentCount?: number;
  missingInputCount?: number;
  professionalReviewCount?: number;
  priorValidAfterFailure?: boolean;
}

export interface ContractDocumentClassification {
  contractVersion: typeof CONTRACTIQ_DOCUMENT_ANALYSIS_CONTRACT_VERSION;
  evidenceId?: string;
  proposedContractType?: ContractType;
  candidatePerspectives: ContractPerspective[];
  confidence: number;
  verificationState: ContractVerificationState;
  classificationState: ContractDocumentClassificationState;
  classificationMethod: ContractClassificationMethod;
  sourceAnchor: ContractSourceAnchor;
  ambiguity: ContractType[];
  warnings: string[];
  providerMetadata: ContractProviderMetadata;
  analysisState: ContractAnalysisState;
}

export interface ContractExtractionCandidate {
  contractVersion: typeof CONTRACTIQ_EXTRACTION_CONTRACT_VERSION;
  contractId: string;
  evidenceId: string;
  extractionType: ContractExtractionType;
  normalizedType: string;
  rawSourceRef?: string;
  sourceAnchor: ContractSourceAnchor;
  proposedNormalizedValue: Record<string, unknown>;
  displayValue?: string;
  unit?: string;
  currency?: string;
  confidence: number;
  verificationState: ContractVerificationState;
  ambiguityState: ContractAmbiguityState;
  applicablePartyId?: string;
  applicablePerspective?: ContractPerspective;
  effectiveDate?: string;
  expirationDate?: string;
  warnings: string[];
  providerMetadata: ContractProviderMetadata;
  currentnessState: ContractCurrentnessState;
}

export interface ContractPartyExtraction {
  legalName?: string;
  displayName: string;
  entityType?: "person" | "organization" | "trust" | "estate" | "government" | "unknown";
  partyRole: string;
  authorityCapacity?: string;
  signatureStatus?: "not_required" | "unsigned" | "partially_signed" | "signed" | "unknown";
  signatureDate?: string;
  signatoryName?: string;
  initialsPresent?: boolean;
}

export interface ContractPartyMatchProposal {
  matchState: ContractPartyMatchState;
  targetType?: "contact" | "organization";
  targetId?: string;
  deterministicSignals: string[];
  confidence: number;
  sourceAnchor: ContractSourceAnchor;
}

export interface ContractBaseMatchCandidate {
  matchState: ContractBaseMatchState;
  baseContractId?: string;
  evidenceSignals: string[];
  sourceAnchor: ContractSourceAnchor;
  confidence: number;
  professionalReviewRequired: boolean;
}

export interface ContractSupersessionCandidate {
  oldTermId?: string;
  replacementExtraction: ContractExtractionCandidate;
  relationshipType: Extract<ContractRelationshipType, "amends" | "supersedes" | "supplements" | "restates">;
  sourceAnchor: ContractSourceAnchor;
  currentnessState: Extract<ContractCurrentnessState, "superseded_candidate" | "conflicting" | "uncertain">;
}

export interface ContractDetectedConflict {
  conflictType: string;
  severity: "informational" | "low" | "moderate" | "high" | "critical" | "unknown";
  summary: string;
  sourceAAnchor: ContractSourceAnchor;
  sourceBAnchor: ContractSourceAnchor;
  normalizedA: Record<string, unknown>;
  normalizedB: Record<string, unknown>;
  confidence: number;
  detectionMethod: "deterministic_normalized_value";
  professionalReviewRequired: boolean;
}

export interface ContractHolidayCalendarDefinition {
  calendarId: string;
  calendarVersion: number;
  calendarType: "us_federal" | "custom_source_defined";
  timezone: string;
  weekendDays: number[];
  holidays: Array<{
    date: string;
    name: string;
    source: "rule" | "source_defined";
  }>;
}

export interface ContractDeadlineCalculationInput {
  workspaceId: string;
  dealId: string;
  contractId: string;
  contractVersion: number;
  contractDeadlineId: string;
  deadlineVersion: number;
  deadlineType: string;
  triggerType: ContractDeadlineTriggerType;
  triggerTermId: string;
  triggerSourceEvidenceId: string;
  triggerSourceAnchor: ContractSourceAnchor;
  verifiedTriggerAt?: string;
  offsetValue?: number;
  offsetUnit?: ContractDeadlineOffsetUnit;
  countingRule?: ContractDeadlineCountingRule;
  businessDayRule?: ContractDeadlineBusinessDayRule;
  weekendRule?: ContractDeadlineWeekendRule;
  holidayCalendarId?: string;
  holidayCalendarVersion?: number;
  timezone?: string;
  timeOfDayRule?: ContractDeadlineTimeOfDayRule;
  sourceVerificationState: ContractDeadlineTriggerVerificationState;
  effectiveDate: string;
  calculationContractVersion: typeof CONTRACTIQ_DEADLINE_ENGINE_VERSION | string;
  correlationId: string;
  sourceEvidenceId: string;
  sourceAnchor: ContractSourceAnchor;
  statedLocalTime?: string;
  supersedesCalculationId?: string;
}

export interface ContractDeadlineCalculationResult {
  calculationId: string;
  calculationVersion: number;
  contractDeadlineId: string;
  contractDeadlineVersion: number;
  triggerAt?: string;
  triggerVerification: ContractDeadlineTriggerVerificationState;
  dueAt?: string;
  timezone: string;
  offsetValue?: number;
  offsetUnit?: ContractDeadlineOffsetUnit;
  countingRule?: ContractDeadlineCountingRule;
  weekendRule?: ContractDeadlineWeekendRule;
  holidayCalendarId?: string;
  holidayCalendarVersion?: number;
  holidaysApplied: Array<{ date: string; name: string }>;
  adjustmentApplied?: { from: string; to: string; reason: string };
  sourceEvidenceId: string;
  sourceAnchor: ContractSourceAnchor;
  status: ContractDeadlineResultStatus;
  warnings: string[];
  staleReason?: string;
  generatedAt: string;
  deterministicHash: string;
}

export interface ContractDeadlineCanonicalLinkageState {
  canonicalDeadlineId?: string;
  canonicalTaskId?: string;
  canonicalDeadlineVersion?: number;
  canonicalStatus?: "open" | "changed" | "completed" | "cancelled";
  linkedCalculationVersion?: number;
  syncVersion?: number;
}

export type ContractDeadlineCanonicalSyncPlan =
  | { action: "skip"; reason: string; mayCreateOperationalDeadline: false }
  | {
      action: "create" | "update";
      mayCreateOperationalDeadline: true;
      contractDeadlineId: string;
      calculationVersion: number;
      canonicalDeadlineId?: string;
      expectedCanonicalVersion?: number;
      source: "contractiq_deadline_calculation";
      syncVersion: number;
      deadlineInput: {
        title: string;
        due_at: string;
        is_all_day: false;
        timezone: string;
        source_type: "contractiq";
        source_record_id: string;
        source_term: string;
        source_description: string;
        trigger_date: string;
        calculation_rule: string;
        verification_state: "source_verified";
        status: "open" | "changed";
      };
    };

export function assertContractIQSourceBoundary(source: string) {
  const forbidden = [
    /create\s+table\s+(?:if\s+not\s+exists\s+)?public\.contract_people/i,
    /create\s+table\s+(?:if\s+not\s+exists\s+)?public\.contract_organizations/i,
    /create\s+table\s+(?:if\s+not\s+exists\s+)?public\.contract_tasks/i,
    /create\s+table\s+(?:if\s+not\s+exists\s+)?public\.contract_deadline_calculations/i,
    /service_role/i,
    /contract_risk_score/i,
    /legal_conclusion\s+(?:text|jsonb|boolean|not\s+null|default\s+true)/i,
    /full_due_diligence_report/i,
    /buyer_due_diligence_summary_report/i,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(source)) {
      throw new Error(`ContractIQ Slice 1 crossed a deferred boundary: ${pattern.source}`);
    }
  }
}

export function isContractSourceAnchor(value: unknown): value is ContractSourceAnchor {
  if (!value || typeof value !== "object") return false;
  const anchor = value as Partial<ContractSourceAnchor>;
  return typeof anchor.kind === "string" && (CONTRACT_SOURCE_ANCHOR_KINDS as readonly string[]).includes(anchor.kind);
}

export const CONTRACT_SOURCE_ANCHOR_KINDS = [
  "page",
  "section",
  "article",
  "clause",
  "paragraph",
  "exhibit",
  "schedule",
  "addendum",
  "signature_block",
  "table",
  "row",
  "email_message",
  "attachment",
  "quoted_line",
  "reference",
] as const;

const forbiddenProviderFields = new Set([
  "rawText",
  "rawDocumentText",
  "fullText",
  "documentText",
  "fileContents",
  "ocrText",
  "legalConclusion",
  "isLegallyEnforceable",
  "canonicalDealMutation",
  "propertyIdentityOverwrite",
  "financeIqMutation",
  "deadlineDueDate",
  "calculatedDueAt",
]);

const documentClassificationRules: Array<{
  type: ContractType;
  patterns: RegExp[];
  perspectives?: ContractPerspective[];
  warning?: string;
}> = [
  { type: "purchase_agreement", patterns: [/\bresidential real estate purchase (agreement|contract)\b/i, /\bbuyer.*seller.*purchase price\b/i], perspectives: ["buyer", "seller"] },
  { type: "purchase_agreement", patterns: [/\bcommercial (real estate )?(purchase|sale) agreement\b/i], perspectives: ["buyer", "seller", "investor"] },
  { type: "counteroffer", patterns: [/\bcounter ?offer\b/i], perspectives: ["buyer", "seller"] },
  { type: "amendment", patterns: [/\bamendment\b/i, /\bdeleted and replaced\b/i], perspectives: ["buyer", "seller"] },
  { type: "addendum", patterns: [/\baddendum\b/i], perspectives: ["buyer", "seller"] },
  { type: "addendum", patterns: [/\binspection addendum\b/i, /\binspection contingency\b/i], perspectives: ["buyer", "seller"] },
  { type: "addendum", patterns: [/\bfinancing addendum\b/i, /\bfinancing contingency\b/i], perspectives: ["buyer", "borrower", "seller"] },
  { type: "other", patterns: [/\battorney review\b/i], perspectives: ["buyer", "seller"], warning: "Attorney-review notice remains a ContractIQ review item, not a legal conclusion." },
  { type: "residential_lease", patterns: [/\bresidential lease\b/i, /\blandlord.*tenant\b/i], perspectives: ["landlord", "tenant"] },
  { type: "commercial_lease", patterns: [/\bcommercial lease\b/i], perspectives: ["landlord", "tenant", "investor"] },
  { type: "guaranty", patterns: [/\bguarant(y|or)\b/i], perspectives: ["guarantor", "lender"] },
  { type: "loan_agreement", patterns: [/\bloan agreement\b/i], perspectives: ["borrower", "lender"] },
  { type: "promissory_note", patterns: [/\bpromissory note\b/i], perspectives: ["borrower", "lender"] },
  { type: "mortgage_deed_of_trust", patterns: [/\bmortgage\b/i, /\bdeed of trust\b/i], perspectives: ["borrower", "lender"] },
  { type: "title_commitment", patterns: [/\btitle commitment\b/i], perspectives: ["buyer"] },
  { type: "survey", patterns: [/\bsurvey\b/i, /\bplat of survey\b/i], perspectives: ["buyer"] },
  { type: "settlement_statement", patterns: [/\bsettlement statement\b/i, /\bclosing statement\b/i, /\balta\b/i, /\bhud-1\b/i], perspectives: ["buyer", "seller"] },
  { type: "deed", patterns: [/\bwarranty deed\b/i, /\bquitclaim deed\b/i], perspectives: ["buyer", "seller"] },
  { type: "service_agreement", patterns: [/\brepair agreement\b/i, /\bconstruction change order\b/i, /\bchange order\b/i], perspectives: ["buyer", "seller", "investor"] },
];

const governanceOwnedPatterns = [/\bdeclaration of covenants\b/i, /\bcc&r\b/i, /\bhoa\b/i, /\bhomeowners association\b/i, /\brules and regulations\b/i];
const classificationPrecedence: ContractType[] = [
  "counteroffer",
  "amendment",
  "addendum",
  "promissory_note",
  "loan_agreement",
  "mortgage_deed_of_trust",
  "commercial_lease",
  "residential_lease",
  "purchase_agreement",
];

export function classifyContractDocument(input: {
  evidenceId?: string;
  extractedText?: string;
  filename?: string;
  sourceAnchor?: Partial<ContractSourceAnchor>;
  providerFailed?: boolean;
  illegible?: boolean;
  unsupportedFormat?: boolean;
  manualType?: ContractType;
  providerMetadata?: Partial<ContractProviderMetadata>;
}): ContractDocumentClassification {
  const sourceAnchor = normalizeAnchor(input.sourceAnchor);
  const providerMetadata = normalizeProviderMetadata(input.providerMetadata, "content_pattern");
  const warnings: string[] = [];
  if (input.providerFailed) return classificationResult("provider_failed", undefined, [], 0, sourceAnchor, ["Provider failed; prior valid classification must be preserved."], providerMetadata, "failed_with_prior_analysis", input.evidenceId);
  if (input.illegible) return classificationResult("illegible", undefined, [], 0, sourceAnchor, ["Source is illegible; manual review is required."], providerMetadata, "professional_review_required", input.evidenceId);
  if (input.unsupportedFormat) return classificationResult("unsupported_format", undefined, [], 0, sourceAnchor, ["Unsupported file format for ContractIQ extraction."], providerMetadata, "partial", input.evidenceId);
  if (input.manualType) return classificationResult("classified_verified", input.manualType, [], 100, sourceAnchor, [], normalizeProviderMetadata(input.providerMetadata, "manual"), "awaiting_verification", input.evidenceId);

  const text = clean(input.extractedText);
  if (!text) {
    return classificationResult("insufficient_content", undefined, [], 0, sourceAnchor, ["Filename alone is not authoritative for ContractIQ classification."], providerMetadata, "partial", input.evidenceId);
  }
  if (governanceOwnedPatterns.some((pattern) => pattern.test(text)) && !/\bpurchase agreement|lease|contract for sale\b/i.test(text)) {
    return classificationResult("manual_review_required", undefined, [], 30, sourceAnchor, ["Governance-owned HOA declarations/rules must route to GovernanceIQ, not ContractIQ."], providerMetadata, "professional_review_required", input.evidenceId);
  }

  const matches = documentClassificationRules.filter((rule) => rule.patterns.some((pattern) => pattern.test(text)));
  const distinct = [...new Set(matches.map((match) => match.type))];
  if (distinct.length > 1) {
    const preferredType = distinct
      .slice()
      .sort((left, right) => precedenceFor(left) - precedenceFor(right))[0];
    if (preferredType && distinct.every((type) => compatibleClassificationTypes(preferredType, type))) {
      const match = matches.find((rule) => rule.type === preferredType) ?? matches[0];
      if (match.warning) warnings.push(match.warning);
      warnings.push("Referenced document language was treated as context, not a competing classification.");
      return classificationResult("classified_proposed", preferredType, distinct.filter((type) => type !== preferredType), 78, sourceAnchor, warnings, providerMetadata, "awaiting_verification", input.evidenceId, match.perspectives);
    }
    return classificationResult("classification_conflict", distinct[0], distinct.slice(1), 65, sourceAnchor, ["Multiple contract classifications matched source text."], providerMetadata, "current_with_conflicts", input.evidenceId);
  }
  if (distinct.length === 1) {
    const match = matches[0];
    if (match.warning) warnings.push(match.warning);
    return classificationResult("classified_proposed", match.type, [], match.type === "other" ? 62 : 82, sourceAnchor, warnings, providerMetadata, "awaiting_verification", input.evidenceId, match.perspectives);
  }
  return classificationResult("manual_review_required", "other", [], 35, sourceAnchor, ["Contract-like document could not be classified with supported source-backed patterns."], providerMetadata, "partial", input.evidenceId);
}

export function validateContractExtractionCandidate(candidate: ContractExtractionCandidate): ContractExtractionCandidate {
  if (candidate.contractVersion !== CONTRACTIQ_EXTRACTION_CONTRACT_VERSION) throw new Error("Unsupported ContractIQ extraction contract version.");
  if (!clean(candidate.contractId) || !clean(candidate.evidenceId)) throw new Error("ContractIQ extraction requires contract and evidence identity.");
  if (!CONTRACT_EXTRACTION_TYPES.includes(candidate.extractionType)) throw new Error(`Unsupported ContractIQ extraction type: ${candidate.extractionType}`);
  if (!clean(candidate.normalizedType)) throw new Error("ContractIQ extraction requires a normalized type.");
  if (!isContractSourceAnchor(candidate.sourceAnchor)) throw new Error("SOURCE_ANCHOR_INCOMPLETE");
  if (candidate.confidence < 0 || candidate.confidence > 100) throw new Error("ContractIQ confidence must be between 0 and 100.");
  if (!CONTRACT_VERIFICATION_STATES.includes(candidate.verificationState)) throw new Error("Unsupported ContractIQ verification state.");
  if (!CONTRACT_AMBIGUITY_STATES.includes(candidate.ambiguityState)) throw new Error("Unsupported ContractIQ ambiguity state.");
  rejectForbiddenFields(candidate.proposedNormalizedValue, "ContractIQ extraction");
  rejectForbiddenFields(candidate.providerMetadata as unknown as Record<string, unknown>, "ContractIQ provider metadata");
  return deepFreeze({
    ...candidate,
    warnings: [...new Set(candidate.warnings.filter(Boolean))].sort(),
    providerMetadata: normalizeProviderMetadata(candidate.providerMetadata, candidate.providerMetadata.method),
  });
}

export function validateContractPartyExtraction(input: ContractPartyExtraction): ContractPartyExtraction {
  if (!clean(input.displayName)) throw new Error("Contract party extraction requires a display name.");
  if (!clean(input.partyRole)) throw new Error("Contract party extraction requires a party role.");
  if (input.signatureDate && Number.isNaN(Date.parse(input.signatureDate))) throw new Error("Contract party signature date must be ISO parseable.");
  return deepFreeze({ ...input });
}

export function proposeContractPartyMatch(input: ContractPartyMatchProposal): ContractPartyMatchProposal {
  if (!CONTRACT_PARTY_MATCH_STATES.includes(input.matchState)) throw new Error("Unsupported party match state.");
  if (!isContractSourceAnchor(input.sourceAnchor)) throw new Error("SOURCE_ANCHOR_INCOMPLETE");
  if (["exact_match", "likely_match", "ambiguous_match"].includes(input.matchState) && !input.deterministicSignals.length) {
    throw new Error("Party match proposals require deterministic signals.");
  }
  if (input.matchState === "ambiguous_match" && input.confidence > 89) throw new Error("Ambiguous matches cannot be stored as high-confidence merges.");
  return deepFreeze({ ...input, deterministicSignals: [...new Set(input.deterministicSignals)].sort() });
}

export function proposeContractBaseMatch(input: ContractBaseMatchCandidate): ContractBaseMatchCandidate {
  if (!CONTRACT_BASE_MATCH_STATES.includes(input.matchState)) throw new Error("Unsupported base contract match state.");
  if (!isContractSourceAnchor(input.sourceAnchor)) throw new Error("SOURCE_ANCHOR_INCOMPLETE");
  if (!input.evidenceSignals.length && input.matchState !== "missing_base_contract") throw new Error("Base contract matching cannot rely on upload order.");
  return deepFreeze({ ...input, evidenceSignals: [...new Set(input.evidenceSignals)].sort() });
}

export function detectContractExtractionConflicts(candidates: ContractExtractionCandidate[]): ContractDetectedConflict[] {
  const validated = candidates.map(validateContractExtractionCandidate);
  const conflicts: ContractDetectedConflict[] = [];
  for (let i = 0; i < validated.length; i += 1) {
    for (let j = i + 1; j < validated.length; j += 1) {
      const left = validated[i];
      const right = validated[j];
      if (left.normalizedType !== right.normalizedType) continue;
      if (stableStringify(left.proposedNormalizedValue) === stableStringify(right.proposedNormalizedValue)) continue;
      const conflictType = conflictTypeFor(left.normalizedType, left.extractionType);
      conflicts.push({
        conflictType,
        severity: conflictType.includes("price") || conflictType.includes("date") ? "high" : "moderate",
        summary: `Conflicting ${left.normalizedType.replace(/_/g, " ")} candidates require verification.`,
        sourceAAnchor: left.sourceAnchor,
        sourceBAnchor: right.sourceAnchor,
        normalizedA: left.proposedNormalizedValue,
        normalizedB: right.proposedNormalizedValue,
        confidence: Math.min(left.confidence, right.confidence),
        detectionMethod: "deterministic_normalized_value",
        professionalReviewRequired: true,
      });
    }
  }
  return conflicts;
}

export function contractAnalysisStateAfterProviderFailure(input: { hasPriorValidRun: boolean; errorCode: ContractAnalysisErrorCode }) {
  return {
    status: input.errorCode === "malformed_response" ? "malformed_response" : "provider_failed",
    analysisState: input.hasPriorValidRun ? "failed_with_prior_analysis" : "partial",
    priorValidPreserved: input.hasPriorValidRun,
    manualContinuationAvailable: true,
  } as const;
}

export function calculateContractDeadline(
  input: ContractDeadlineCalculationInput,
  calendar: ContractHolidayCalendarDefinition | undefined,
  options: { generatedAt?: string; asOf?: string } = {},
): ContractDeadlineCalculationResult {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const warnings: string[] = [];
  const timezone = clean(input.timezone) ?? "";
  const triggerVerification = input.sourceVerificationState;
  const base = {
    calculationVersion: 1,
    contractDeadlineId: input.contractDeadlineId,
    contractDeadlineVersion: input.deadlineVersion,
    triggerVerification,
    timezone,
    offsetValue: input.offsetValue,
    offsetUnit: input.offsetUnit,
    countingRule: input.countingRule,
    weekendRule: input.weekendRule,
    holidayCalendarId: input.holidayCalendarId,
    holidayCalendarVersion: input.holidayCalendarVersion,
    holidaysApplied: [] as Array<{ date: string; name: string }>,
    sourceEvidenceId: input.sourceEvidenceId,
    sourceAnchor: input.sourceAnchor,
    generatedAt,
  };

  const requiredIssue = validateDeadlineCalculationInput(input, calendar);
  if (requiredIssue) {
    warnings.push(requiredIssue);
    return finalizeDeadlineResult(input, { ...base, status: requiredIssue === "MISSING_TRIGGER" ? "missing_trigger" : "missing_rule", warnings });
  }
  if (!isContractSourceAnchor(input.sourceAnchor) || !isContractSourceAnchor(input.triggerSourceAnchor)) {
    warnings.push("SOURCE_ANCHOR_INCOMPLETE");
    return finalizeDeadlineResult(input, { ...base, status: "missing_rule", warnings });
  }
  if (!isAuthoritativeTimezone(timezone)) {
    warnings.push("TIMEZONE_UNCERTAIN");
    return finalizeDeadlineResult(input, { ...base, status: "missing_rule", warnings });
  }
  if (triggerVerification === "conflicted") {
    warnings.push("DEADLINE_CONFLICT");
    return finalizeDeadlineResult(input, { ...base, status: "uncertain", triggerAt: input.verifiedTriggerAt, warnings });
  }
  if (triggerVerification === "unknown") {
    warnings.push("TRIGGER_UNKNOWN");
    return finalizeDeadlineResult(input, { ...base, status: "missing_trigger", triggerAt: input.verifiedTriggerAt, warnings });
  }
  if (input.countingRule === undefined) {
    warnings.push("COUNTING_RULE_UNCERTAIN");
    return finalizeDeadlineResult(input, { ...base, status: "missing_rule", triggerAt: input.verifiedTriggerAt, warnings });
  }
  if (!calendar) {
    warnings.push("HOLIDAY_CALENDAR_UNCERTAIN");
    return finalizeDeadlineResult(input, { ...base, status: "missing_rule", triggerAt: input.verifiedTriggerAt, warnings });
  }
  if (calendar.calendarId !== input.holidayCalendarId || calendar.calendarVersion !== input.holidayCalendarVersion) {
    warnings.push("HOLIDAY_CALENDAR_UNCERTAIN");
    return finalizeDeadlineResult(input, { ...base, status: "missing_rule", triggerAt: input.verifiedTriggerAt, warnings });
  }
  if (input.timeOfDayRule === "close_of_business") {
    warnings.push("TIME_OF_DAY_UNCERTAIN");
    return finalizeDeadlineResult(input, { ...base, status: "uncertain", triggerAt: input.verifiedTriggerAt, warnings });
  }
  if (input.weekendRule === "uncertain" || input.weekendRule === "source_specific") {
    warnings.push("WEEKEND_RULE_UNCERTAIN");
    return finalizeDeadlineResult(input, { ...base, status: "uncertain", triggerAt: input.verifiedTriggerAt, warnings });
  }
  if (input.businessDayRule === "uncertain" || input.businessDayRule === "source_specific") {
    warnings.push("BUSINESS_DAY_RULE_UNCERTAIN");
    return finalizeDeadlineResult(input, { ...base, status: "uncertain", triggerAt: input.verifiedTriggerAt, warnings });
  }

  const triggerInstant = new Date(input.verifiedTriggerAt ?? "");
  const triggerLocal = zonedParts(triggerInstant, timezone);
  const holidaysApplied = new Map<string, string>();
  let dueAt: string;
  let adjustmentApplied: ContractDeadlineCalculationResult["adjustmentApplied"];

  if (input.countingRule === "exact_elapsed_hours") {
    if (input.offsetUnit !== "hours") {
      warnings.push("COUNTING_RULE_UNCERTAIN");
      return finalizeDeadlineResult(input, { ...base, status: "missing_rule", triggerAt: input.verifiedTriggerAt, warnings });
    }
    dueAt = new Date(triggerInstant.getTime() + (input.offsetValue ?? 0) * 60 * 60 * 1000).toISOString();
  } else {
    const dueDate = calculateLocalDueDate(triggerLocal, input, calendar, holidaysApplied);
    const dueTime = resolveDeadlineTime(input, triggerLocal);
    if (!dueTime) {
      warnings.push("TIME_OF_DAY_UNCERTAIN");
      return finalizeDeadlineResult(input, { ...base, status: "uncertain", triggerAt: input.verifiedTriggerAt, warnings });
    }
    let dueLocal = { ...dueDate, ...dueTime };
    const beforeAdjustment = formatLocalDateTime(dueLocal);
    dueLocal = applyWeekendHolidayAdjustment(dueLocal, input.weekendRule ?? "no_adjustment", calendar, holidaysApplied);
    const afterAdjustment = formatLocalDateTime(dueLocal);
    if (beforeAdjustment !== afterAdjustment) adjustmentApplied = { from: beforeAdjustment, to: afterAdjustment, reason: input.weekendRule ?? "no_adjustment" };
    dueAt = zonedTimeToUtcIso(dueLocal, timezone);
  }

  const status = triggerVerification === "extracted_proposed"
    ? "proposed"
    : options.asOf && new Date(dueAt).getTime() < new Date(options.asOf).getTime()
      ? "missed"
      : "current";

  return finalizeDeadlineResult(input, {
    ...base,
    triggerAt: input.verifiedTriggerAt,
    dueAt,
    status,
    warnings,
    holidaysApplied: [...holidaysApplied.entries()].map(([date, name]) => ({ date, name })).sort((a, b) => a.date.localeCompare(b.date)),
    adjustmentApplied,
  });
}

export function buildUsFederalHolidayCalendar(years: number[], timezone: string, calendarVersion = 1): ContractHolidayCalendarDefinition {
  const uniqueYears = [...new Set(years)].sort((a, b) => a - b);
  return deepFreeze({
    calendarId: "us_federal",
    calendarVersion,
    calendarType: "us_federal",
    timezone,
    weekendDays: [0, 6],
    holidays: uniqueYears.flatMap(usFederalHolidaysForYear).sort((a, b) => a.date.localeCompare(b.date)),
  });
}

export function buildCustomSourceHolidayCalendar(input: {
  calendarId: string;
  calendarVersion: number;
  timezone: string;
  weekendDays?: number[];
  holidays: Array<{ date: string; name: string }>;
}): ContractHolidayCalendarDefinition {
  return deepFreeze({
    calendarId: clean(input.calendarId) ?? "custom_source_defined",
    calendarVersion: input.calendarVersion,
    calendarType: "custom_source_defined",
    timezone: input.timezone,
    weekendDays: [...new Set(input.weekendDays ?? [0, 6])].sort((a, b) => a - b),
    holidays: input.holidays.map((holiday) => ({ date: holiday.date, name: holiday.name, source: "source_defined" as const })).sort((a, b) => a.date.localeCompare(b.date)),
  });
}

export function planContractDeadlineCanonicalSync(input: {
  result: ContractDeadlineCalculationResult;
  deadlineType: string;
  sourceRuleSummary: string;
  triggerDate: string;
  linkage?: ContractDeadlineCanonicalLinkageState;
}): ContractDeadlineCanonicalSyncPlan {
  const result = input.result;
  if (result.status !== "current" || !result.dueAt) {
    return { action: "skip", reason: `Contract deadline result is ${result.status}; operational deadline creation is not allowed.`, mayCreateOperationalDeadline: false };
  }
  if (input.linkage?.canonicalStatus === "completed" || input.linkage?.canonicalStatus === "cancelled") {
    return { action: "skip", reason: `Canonical deadline is ${input.linkage.canonicalStatus}; ContractIQ will not resurrect historical operational work.`, mayCreateOperationalDeadline: false };
  }
  const syncVersion = (input.linkage?.syncVersion ?? 0) + 1;
  return {
    action: input.linkage?.canonicalDeadlineId ? "update" : "create",
    mayCreateOperationalDeadline: true,
    contractDeadlineId: result.contractDeadlineId,
    calculationVersion: result.calculationVersion,
    canonicalDeadlineId: input.linkage?.canonicalDeadlineId,
    expectedCanonicalVersion: input.linkage?.canonicalDeadlineVersion,
    source: "contractiq_deadline_calculation",
    syncVersion,
    deadlineInput: {
      title: `Contract deadline: ${input.deadlineType}`,
      due_at: result.dueAt,
      is_all_day: false,
      timezone: result.timezone,
      source_type: "contractiq",
      source_record_id: result.contractDeadlineId,
      source_term: input.sourceRuleSummary,
      source_description: `ContractIQ calculation ${result.calculationId} from ${result.triggerVerification} trigger.`,
      trigger_date: input.triggerDate,
      calculation_rule: `${result.offsetValue} ${result.offsetUnit} / ${result.countingRule} / ${result.weekendRule}`,
      verification_state: "source_verified",
      status: input.linkage?.canonicalDeadlineId ? "changed" : "open",
    },
  };
}

export function deterministicContractExtractionHash(input: {
  evidenceHash: string;
  evidenceVersion: number;
  analysisContractVersion: string;
  providerId: string;
  providerMethod: string;
}) {
  return deterministicHash({
    evidenceHash: clean(input.evidenceHash),
    evidenceVersion: input.evidenceVersion,
    analysisContractVersion: clean(input.analysisContractVersion),
    providerId: clean(input.providerId),
    providerMethod: clean(input.providerMethod),
  });
}

function classificationResult(
  classificationState: ContractDocumentClassificationState,
  proposedContractType: ContractType | undefined,
  ambiguity: ContractType[],
  confidence: number,
  sourceAnchor: ContractSourceAnchor,
  warnings: string[],
  providerMetadata: ContractProviderMetadata,
  analysisState: ContractAnalysisState,
  evidenceId?: string,
  candidatePerspectives: ContractPerspective[] = [],
): ContractDocumentClassification {
  return deepFreeze({
    contractVersion: CONTRACTIQ_DOCUMENT_ANALYSIS_CONTRACT_VERSION,
    evidenceId: clean(evidenceId),
    proposedContractType,
    candidatePerspectives,
    confidence,
    verificationState: classificationState === "classified_verified" ? "verified" : classificationState === "classification_conflict" ? "conflicted" : "unverified",
    classificationState,
    classificationMethod: providerMetadata.method === "manual" ? "manual" : "content_pattern",
    sourceAnchor,
    ambiguity,
    warnings,
    providerMetadata,
    analysisState,
  });
}

function normalizeAnchor(anchor: Partial<ContractSourceAnchor> | undefined): ContractSourceAnchor {
  const kind = anchor?.kind && CONTRACT_SOURCE_ANCHOR_KINDS.includes(anchor.kind) ? anchor.kind : "reference";
  return { ...anchor, kind };
}

function normalizeProviderMetadata(input: Partial<ContractProviderMetadata> | undefined, method: ContractProviderMetadata["method"]): ContractProviderMetadata {
  return {
    providerId: clean(input?.providerId) || "deterministic_contractiq",
    method: input?.method ?? method,
    modelId: clean(input?.modelId),
    promptVersion: clean(input?.promptVersion),
    providerContractVersion: clean(input?.providerContractVersion) || CONTRACTIQ_EXTRACTION_CONTRACT_VERSION,
  };
}

function rejectForbiddenFields(value: Record<string, unknown>, scope: string) {
  for (const key of Object.keys(value)) {
    if (forbiddenProviderFields.has(key)) {
      const reason = /deadline|due/i.test(key) ? "deadline calculation" : "authoritative, raw-document, downstream, or legal authority";
      throw new Error(`${scope} cannot accept ${reason} field: ${key}`);
    }
    const child = value[key];
    if (child && typeof child === "object" && !Array.isArray(child)) rejectForbiddenFields(child as Record<string, unknown>, scope);
  }
}

function precedenceFor(type: ContractType) {
  const index = classificationPrecedence.indexOf(type);
  return index === -1 ? classificationPrecedence.length : index;
}

function compatibleClassificationTypes(preferredType: ContractType, candidateType: ContractType) {
  if (candidateType === preferredType) return true;
  if (candidateType === "purchase_agreement") return ["counteroffer", "amendment", "addendum"].includes(preferredType);
  if (candidateType === "mortgage_deed_of_trust") return preferredType === "promissory_note" || preferredType === "loan_agreement";
  if (candidateType === "residential_lease") return preferredType === "commercial_lease";
  return false;
}

function conflictTypeFor(normalizedType: string, extractionType: ContractExtractionType) {
  if (/price|money|deposit|earnest|credit|rent|cost/i.test(normalizedType)) return "purchase_price_conflict";
  if (/date|closing|execution|possession/i.test(normalizedType)) return "closing_date_conflict";
  if (/party|buyer|seller|landlord|tenant/i.test(normalizedType) || extractionType === "party") return "party_name_conflict";
  if (/property|address|legal_description|parcel/i.test(normalizedType)) return "property_identity_conflict";
  if (/financing|loan|lender/i.test(normalizedType)) return "financing_contingency_conflict";
  if (/assignment|transfer/i.test(normalizedType)) return "assignment_rights_conflict";
  if (/inspection|contingency/i.test(normalizedType)) return "inspection_period_conflict";
  return "term_conflict";
}

type LocalDate = { year: number; month: number; day: number };
type LocalTime = { hour: number; minute: number; second: number; millisecond: number };
type LocalDateTime = LocalDate & LocalTime;

function validateDeadlineCalculationInput(input: ContractDeadlineCalculationInput, calendar: ContractHolidayCalendarDefinition | undefined) {
  const requiredStrings = [
    input.workspaceId,
    input.dealId,
    input.contractId,
    input.contractDeadlineId,
    input.deadlineType,
    input.triggerType,
    input.triggerTermId,
    input.triggerSourceEvidenceId,
    input.effectiveDate,
    input.calculationContractVersion,
    input.correlationId,
    input.sourceEvidenceId,
  ];
  if (requiredStrings.some((value) => !clean(value))) return "MISSING_RULE";
  if (!input.verifiedTriggerAt || Number.isNaN(Date.parse(input.verifiedTriggerAt))) return "MISSING_TRIGGER";
  if (!Number.isInteger(input.contractVersion) || !Number.isInteger(input.deadlineVersion)) return "MISSING_RULE";
  if (!Number.isFinite(input.offsetValue) || (input.offsetValue ?? 0) < 0 || !input.offsetUnit) return "MISSING_RULE";
  if (!input.countingRule || !input.businessDayRule || !input.weekendRule || !input.timeOfDayRule) return "MISSING_RULE";
  if (!input.holidayCalendarId || !input.holidayCalendarVersion || !calendar) return "HOLIDAY_CALENDAR_UNCERTAIN";
  if (!CONTRACT_DEADLINE_TRIGGER_TYPES.includes(input.triggerType)) return "MISSING_RULE";
  if (!CONTRACT_DEADLINE_OFFSET_UNITS.includes(input.offsetUnit)) return "MISSING_RULE";
  if (!CONTRACT_DEADLINE_COUNTING_RULES.includes(input.countingRule)) return "COUNTING_RULE_UNCERTAIN";
  if (!CONTRACT_DEADLINE_TRIGGER_VERIFICATION_STATES.includes(input.sourceVerificationState)) return "MISSING_TRIGGER";
  return undefined;
}

function finalizeDeadlineResult(
  input: ContractDeadlineCalculationInput,
  result: Omit<ContractDeadlineCalculationResult, "calculationId" | "deterministicHash">,
): ContractDeadlineCalculationResult {
  const uniqueWarnings = [...new Set(result.warnings)].sort();
  const hashBasis = {
    workspaceId: input.workspaceId,
    dealId: input.dealId,
    contractId: input.contractId,
    contractVersion: input.contractVersion,
    contractDeadlineId: input.contractDeadlineId,
    deadlineVersion: input.deadlineVersion,
    deadlineType: input.deadlineType,
    triggerType: input.triggerType,
    triggerTermId: input.triggerTermId,
    triggerSourceEvidenceId: input.triggerSourceEvidenceId,
    triggerSourceAnchor: input.triggerSourceAnchor,
    verifiedTriggerAt: result.triggerAt,
    triggerVerification: result.triggerVerification,
    dueAt: result.dueAt,
    timezone: result.timezone,
    offsetValue: result.offsetValue,
    offsetUnit: result.offsetUnit,
    countingRule: result.countingRule,
    businessDayRule: input.businessDayRule,
    weekendRule: result.weekendRule,
    holidayCalendarId: result.holidayCalendarId,
    holidayCalendarVersion: result.holidayCalendarVersion,
    holidaysApplied: result.holidaysApplied,
    adjustmentApplied: result.adjustmentApplied,
    sourceEvidenceId: result.sourceEvidenceId,
    sourceAnchor: result.sourceAnchor,
    status: result.status,
    warnings: uniqueWarnings,
    staleReason: result.staleReason,
    calculationContractVersion: input.calculationContractVersion,
  };
  const resultHash = deterministicHash(hashBasis);
  return deepFreeze({
    ...result,
    warnings: uniqueWarnings,
    calculationId: `contract-deadline:${resultHash.replace("fnv1a32:", "")}`,
    deterministicHash: resultHash,
  });
}

function calculateLocalDueDate(
  trigger: LocalDateTime,
  input: ContractDeadlineCalculationInput,
  calendar: ContractHolidayCalendarDefinition,
  holidaysApplied: Map<string, string>,
): LocalDate {
  const offset = input.offsetValue ?? 0;
  if (input.offsetUnit === "business_days" || input.countingRule === "business_day_offset") {
    return addBusinessDays(trigger, offset, input.countingRule ?? "business_day_offset", calendar, holidaysApplied);
  }
  if (input.offsetUnit === "months") return addLocalMonths(trigger, offset);
  if (input.offsetUnit === "years") return addLocalMonths(trigger, offset * 12);
  const days = input.offsetUnit === "weeks" ? offset * 7 : offset;
  return addLocalDays(trigger, daysForCountingRule(days, input.countingRule ?? "calendar_date_offset"));
}

function daysForCountingRule(days: number, rule: ContractDeadlineCountingRule) {
  if (rule === "include_trigger_day") return Math.max(0, days - 1);
  return days;
}

function addBusinessDays(
  trigger: LocalDate,
  offset: number,
  rule: ContractDeadlineCountingRule,
  calendar: ContractHolidayCalendarDefinition,
  holidaysApplied: Map<string, string>,
): LocalDate {
  if (offset === 0) return trigger;
  let current = { year: trigger.year, month: trigger.month, day: trigger.day };
  let counted = rule === "include_trigger_day" && isBusinessDay(current, calendar, holidaysApplied) ? 1 : 0;
  while (counted < offset) {
    current = addLocalDays(current, 1);
    if (isBusinessDay(current, calendar, holidaysApplied)) counted += 1;
  }
  return current;
}

function resolveDeadlineTime(input: ContractDeadlineCalculationInput, triggerLocal: LocalDateTime): LocalTime | undefined {
  switch (input.timeOfDayRule) {
    case "exact_stated_time":
      return parseLocalTime(input.statedLocalTime) ?? { hour: triggerLocal.hour, minute: triggerLocal.minute, second: triggerLocal.second, millisecond: triggerLocal.millisecond };
    case "end_of_day":
      return { hour: 23, minute: 59, second: 59, millisecond: 999 };
    case "noon":
      return { hour: 12, minute: 0, second: 0, millisecond: 0 };
    case "midnight":
      return { hour: 0, minute: 0, second: 0, millisecond: 0 };
    case "time_unspecified":
      return { hour: triggerLocal.hour, minute: triggerLocal.minute, second: triggerLocal.second, millisecond: triggerLocal.millisecond };
    case "close_of_business":
      return undefined;
  }
}

function applyWeekendHolidayAdjustment(
  dueLocal: LocalDateTime,
  weekendRule: ContractDeadlineWeekendRule,
  calendar: ContractHolidayCalendarDefinition,
  holidaysApplied: Map<string, string>,
): LocalDateTime {
  if (weekendRule === "no_adjustment") return dueLocal;
  if (weekendRule === "next_calendar_day") return addLocalDays(dueLocal, 1);
  let adjusted = dueLocal;
  const direction = weekendRule === "previous_business_day" ? -1 : 1;
  while (!isBusinessDay(adjusted, calendar, holidaysApplied)) adjusted = addLocalDays(adjusted, direction);
  return adjusted;
}

function isBusinessDay(local: LocalDate, calendar: ContractHolidayCalendarDefinition, holidaysApplied: Map<string, string>) {
  const date = formatLocalDate(local);
  const weekend = calendar.weekendDays.includes(localDayOfWeek(local));
  const holiday = calendar.holidays.find((candidate) => candidate.date === date);
  if (holiday) holidaysApplied.set(holiday.date, holiday.name);
  return !weekend && !holiday;
}

function zonedParts(date: Date, timezone: string): LocalDateTime {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second"), millisecond: date.getUTCMilliseconds() };
}

function zonedTimeToUtcIso(local: LocalDateTime, timezone: string) {
  let utc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second, local.millisecond);
  for (let i = 0; i < 4; i += 1) {
    const actual = zonedParts(new Date(utc), timezone);
    const deltaMinutes = localDateTimeDifferenceMinutes(local, actual);
    if (deltaMinutes === 0) break;
    utc += deltaMinutes * 60 * 1000;
  }
  return new Date(utc).toISOString();
}

function localDateTimeDifferenceMinutes(target: LocalDateTime, actual: LocalDateTime) {
  const targetUtc = Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute, target.second, target.millisecond);
  const actualUtc = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second, actual.millisecond);
  return Math.round((targetUtc - actualUtc) / 60000);
}

function addLocalDays<T extends LocalDate>(local: T, days: number): T {
  const date = new Date(Date.UTC(local.year, local.month - 1, local.day + days));
  return { ...local, year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function addLocalMonths(local: LocalDate, months: number): LocalDate {
  const targetMonthZero = local.month - 1 + months;
  const year = local.year + Math.floor(targetMonthZero / 12);
  const monthZero = ((targetMonthZero % 12) + 12) % 12;
  const maxDay = new Date(Date.UTC(year, monthZero + 1, 0)).getUTCDate();
  return { year, month: monthZero + 1, day: Math.min(local.day, maxDay) };
}

function localDayOfWeek(local: LocalDate) {
  return new Date(Date.UTC(local.year, local.month - 1, local.day)).getUTCDay();
}

function parseLocalTime(value?: string): LocalTime | undefined {
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(clean(value) ?? "");
  if (!match) return undefined;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = Number(match[3] ?? 0);
  if (hour > 23 || minute > 59 || second > 59) return undefined;
  return { hour, minute, second, millisecond: 0 };
}

function formatLocalDate(local: LocalDate) {
  return `${local.year.toString().padStart(4, "0")}-${local.month.toString().padStart(2, "0")}-${local.day.toString().padStart(2, "0")}`;
}

function formatLocalDateTime(local: LocalDateTime) {
  return `${formatLocalDate(local)}T${local.hour.toString().padStart(2, "0")}:${local.minute.toString().padStart(2, "0")}:${local.second.toString().padStart(2, "0")}`;
}

function isAuthoritativeTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return timezone.includes("/");
  } catch {
    return false;
  }
}

function usFederalHolidaysForYear(year: number): ContractHolidayCalendarDefinition["holidays"] {
  const holidays = [
    observedFixedHoliday(year, 1, 1, "New Year's Day"),
    nthWeekday(year, 1, 1, 3, "Martin Luther King Jr. Day"),
    nthWeekday(year, 2, 1, 3, "Washington's Birthday"),
    lastWeekday(year, 5, 1, "Memorial Day"),
    observedFixedHoliday(year, 6, 19, "Juneteenth National Independence Day"),
    observedFixedHoliday(year, 7, 4, "Independence Day"),
    nthWeekday(year, 9, 1, 1, "Labor Day"),
    nthWeekday(year, 10, 1, 2, "Columbus Day"),
    observedFixedHoliday(year, 11, 11, "Veterans Day"),
    nthWeekday(year, 11, 4, 4, "Thanksgiving Day"),
    observedFixedHoliday(year, 12, 25, "Christmas Day"),
  ];
  return holidays.map((holiday) => ({ ...holiday, source: "rule" as const }));
}

function observedFixedHoliday(year: number, month: number, day: number, name: string) {
  const date = { year, month, day };
  const weekday = localDayOfWeek(date);
  if (weekday === 6) return { date: formatLocalDate(addLocalDays(date, -1)), name };
  if (weekday === 0) return { date: formatLocalDate(addLocalDays(date, 1)), name };
  return { date: formatLocalDate(date), name };
}

function nthWeekday(year: number, month: number, weekday: number, nth: number, name: string) {
  let cursor = { year, month, day: 1 };
  while (localDayOfWeek(cursor) !== weekday) cursor = addLocalDays(cursor, 1);
  return { date: formatLocalDate(addLocalDays(cursor, (nth - 1) * 7)), name };
}

function lastWeekday(year: number, month: number, weekday: number, name: string) {
  let cursor = { year, month, day: new Date(Date.UTC(year, month, 0)).getUTCDate() };
  while (localDayOfWeek(cursor) !== weekday) cursor = addLocalDays(cursor, -1);
  return { date: formatLocalDate(cursor), name };
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

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) if (child && typeof child === "object") deepFreeze(child);
  }
  return value;
}

function clean(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
