import type { Json } from "./supabaseDatabase.types";

export const GOVERNANCEIQ_FOUNDATION_CONTRACT_VERSION = "governanceiq-foundation-v1" as const;
export const GOVERNANCEIQ_PROJECTION_CONTRACT_VERSION = "governanceiq-projection-v1" as const;

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
  | "superseded"
  | "conflicting"
  | "hierarchy_uncertain"
  | "professional_review_required";

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
