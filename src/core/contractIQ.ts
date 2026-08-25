export const CONTRACTIQ_FOUNDATION_CONTRACT_VERSION = "contractiq-foundation-v1" as const;
export const CONTRACTIQ_PROJECTION_CONTRACT_VERSION = "contractiq-projection-v1" as const;

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

export type ContractType = (typeof CONTRACT_TYPES)[number];
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];
export type ContractPerspective = (typeof CONTRACT_PERSPECTIVES)[number];
export type ContractVerificationState = (typeof CONTRACT_VERIFICATION_STATES)[number];
export type ContractAnalysisState = (typeof CONTRACT_ANALYSIS_STATES)[number];
export type ContractProposalState = (typeof CONTRACT_PROPOSAL_STATES)[number];
export type ContractDeadlineStatus = (typeof CONTRACT_DEADLINE_STATUSES)[number];
export type ContractRelationshipType = (typeof CONTRACT_RELATIONSHIP_TYPES)[number];

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
