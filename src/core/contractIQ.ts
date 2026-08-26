export const CONTRACTIQ_FOUNDATION_CONTRACT_VERSION = "contractiq-foundation-v1" as const;
export const CONTRACTIQ_PROJECTION_CONTRACT_VERSION = "contractiq-projection-v1" as const;
export const CONTRACTIQ_DOCUMENT_ANALYSIS_CONTRACT_VERSION = "contractiq-document-analysis-v1" as const;
export const CONTRACTIQ_EXTRACTION_CONTRACT_VERSION = "contractiq-extraction-v1" as const;

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
