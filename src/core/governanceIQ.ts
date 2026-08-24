import type { Json } from "./supabaseDatabase.types";

export const GOVERNANCEIQ_FOUNDATION_CONTRACT_VERSION = "governanceiq-foundation-v1" as const;
export const GOVERNANCEIQ_PROJECTION_CONTRACT_VERSION = "governanceiq-projection-v1" as const;
export const GOVERNANCEIQ_DOCUMENT_ANALYSIS_CONTRACT_VERSION = "governanceiq-document-analysis-v1" as const;
export const GOVERNANCEIQ_EXTRACTION_CONTRACT_VERSION = "governanceiq-extraction-v1" as const;

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
export type GovernanceAcceptanceState = "proposed" | "accepted" | "rejected" | "disputed" | "superseded" | "expired";
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

function cleanText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}
