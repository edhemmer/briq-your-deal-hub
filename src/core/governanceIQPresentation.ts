import { buildFinancialAnalysis, buildRestrictionAnalysis, type GovernancePropagationProjection, type GovernanceWorkspaceData } from "./governanceIQClient";
import type {
  GovernanceAcceptanceState,
  GovernanceDetectedConflict,
  GovernanceDocument,
  GovernanceDocumentHierarchyState,
  GovernanceFinding,
  GovernanceFindingCategory,
  GovernanceFinancialAnalysisResult,
  GovernanceProjection,
  GovernanceProjectionState,
  GovernanceQuestionTargetRole,
  GovernanceRestrictionIntelligenceResult,
  GovernanceRestrictionState,
  GovernanceSourceAnchor,
} from "./governanceIQ";
import type { PresentationMode } from "./presentationMode";

export const GOVERNANCEIQ_WEB_EXPERIENCE_CONTRACT_VERSION = "governanceiq-web-experience-v1";

export type GovernanceIQSectionId =
  | "overview"
  | "documents"
  | "restrictions"
  | "financials"
  | "conflicts"
  | "questions"
  | "changes";

export type GovernanceIQTone = "neutral" | "good" | "warning" | "danger";

export type GovernanceIQMetric = {
  label: string;
  value: string;
  detail?: string;
  tone: GovernanceIQTone;
};

export type GovernanceIQDocumentGroup = {
  groupId: string;
  label: string;
  documents: GovernanceDocument[];
};

export type GovernanceIQFindingGroup = {
  groupId: string;
  label: string;
  findings: GovernanceFinding[];
};

export type GovernanceIQQuestionGroup = {
  groupId: GovernanceQuestionTargetRole;
  label: string;
  questions: GovernanceWorkspaceData["questions"];
};

export type GovernanceIQPresentationModel = {
  contractVersion: typeof GOVERNANCEIQ_WEB_EXPERIENCE_CONTRACT_VERSION;
  dealId: string;
  dealName: string;
  mode: PresentationMode;
  selectedProjection?: GovernanceProjection;
  projections: GovernanceProjection[];
  stateLabel: string;
  statusDetail: string;
  metrics: GovernanceIQMetric[];
  documents: GovernanceIQDocumentGroup[];
  findings: GovernanceIQFindingGroup[];
  restrictions: GovernanceRestrictionIntelligenceResult[];
  financial?: GovernanceFinancialAnalysisResult;
  conflicts: GovernanceDetectedConflict[];
  questions: GovernanceIQQuestionGroup[];
  propagations: GovernancePropagationProjection[];
  latestMaterialChange?: GovernancePropagationProjection;
  guidedPriorities: string[];
  professionalDetails: string[];
  emptyState?: { title: string; detail: string; nextAction: string };
};

const sectionOrder: GovernanceIQSectionId[] = ["overview", "documents", "restrictions", "financials", "conflicts", "questions", "changes"];

export const governanceIqSections: Array<{ id: GovernanceIQSectionId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "documents", label: "Documents" },
  { id: "restrictions", label: "Restrictions" },
  { id: "financials", label: "Financials" },
  { id: "conflicts", label: "Conflicts" },
  { id: "questions", label: "Questions / Review" },
  { id: "changes", label: "Changes / Impact" },
];

export function buildGovernanceIQPresentation(input: {
  dealId: string;
  dealName: string;
  mode: PresentationMode;
  data: GovernanceWorkspaceData;
}): GovernanceIQPresentationModel {
  const { data } = input;
  const selectedProjection = data.selectedProjection;
  const financial = buildFinancialAnalysis(data.record, data.financialPeriods);
  const restrictions = buildRestrictionAnalysis(data.record, data.findings);
  const latestMaterialChange = data.propagations.find((item) => item.materiality === "material" || item.materiality === "upcoming");
  const acceptedCount = selectedProjection?.acceptedFindingCount ?? data.findings.filter((finding) => isAccepted(finding.acceptanceState)).length;
  const highAttentionCount = selectedProjection?.highSeverityFindingCount ?? data.findings.filter((finding) => ["high", "critical"].includes(finding.severity)).length;
  const unresolvedConflictCount = selectedProjection?.unresolvedConflictCount ?? data.conflicts.length;
  const professionalReviewCount = data.findings.filter((finding) => finding.professionalReviewRecommended).length
    + data.conflicts.filter((conflict) => conflict.professionalReviewRecommended).length
    + data.questions.filter((question) => question.professionalReviewRecommended).length;

  const metrics: GovernanceIQMetric[] = selectedProjection ? [
    { label: "Status", value: stateLabel(selectedProjection.projectionState), detail: sourceCompletenessLabel(selectedProjection.sourceCompleteness), tone: toneForProjection(selectedProjection.projectionState) },
    { label: "Documents", value: String(selectedProjection.documentCount), detail: documentCompletenessDetail(selectedProjection), tone: selectedProjection.documentCount > 0 ? "neutral" : "warning" },
    { label: "Accepted findings", value: String(acceptedCount), detail: `${data.findings.filter((finding) => finding.acceptanceState === "proposed").length} awaiting review`, tone: acceptedCount > 0 ? "good" : "warning" },
    { label: "High attention", value: String(highAttentionCount), detail: "Restriction or financial items marked high/critical", tone: highAttentionCount > 0 ? "warning" : "good" },
    { label: "Conflicts", value: String(unresolvedConflictCount), detail: "No legal winner is chosen by BRIX", tone: unresolvedConflictCount > 0 ? "danger" : "good" },
    { label: "Professional review", value: String(professionalReviewCount), detail: selectedProjection.professionalReviewRequired ? "Recommended by source state" : "No review flag in current projection", tone: professionalReviewCount > 0 || selectedProjection.professionalReviewRequired ? "warning" : "good" },
    { label: "Current dues", value: formatMoney(financial?.duesIndicator.currentAmount), detail: financial?.duesIndicator.frequency ? labelize(financial.duesIndicator.frequency) : "Source-backed financial input", tone: financial?.duesIndicator.currentAmount ? "neutral" : "warning" },
    { label: "Assessments", value: assessmentLabel(financial), detail: assessmentDetail(financial), tone: financial?.assessmentIndicator.state === "adopted_or_billed" ? "warning" : "neutral" },
    { label: "Financial health", value: financial ? labelize(financial.analysisState) : "No financials", detail: financial?.completeness.join(" / ") ?? "Upload budget, reserve, or assessment evidence", tone: financial && financial.analysisState === "current" ? "good" : "warning" },
    { label: "Propagation", value: propagationSummary(data.propagations), detail: latestMaterialChange?.explanations[0] ?? "No accepted-change propagation yet", tone: data.propagations.some((item) => item.blockedProposalCount > 0) ? "danger" : data.propagations.some((item) => item.hasPendingDownstreamReview) ? "warning" : data.propagations.length ? "good" : "neutral" },
  ] : [];

  return {
    contractVersion: GOVERNANCEIQ_WEB_EXPERIENCE_CONTRACT_VERSION,
    dealId: input.dealId,
    dealName: input.dealName,
    mode: input.mode,
    selectedProjection,
    projections: data.projections,
    stateLabel: selectedProjection ? stateLabel(selectedProjection.projectionState) : "No Governance Identified",
    statusDetail: selectedProjection ? statusDetail(selectedProjection) : "No association or private-governance record is linked to this Deal.",
    metrics,
    documents: groupDocuments(data.documents),
    findings: groupFindings(data.findings),
    restrictions,
    financial,
    conflicts: data.conflicts,
    questions: groupQuestions(data.questions),
    propagations: data.propagations,
    latestMaterialChange,
    guidedPriorities: guidedPriorities(data.findings, restrictions, financial),
    professionalDetails: professionalDetails(data, financial, restrictions),
    emptyState: selectedProjection ? undefined : {
      title: "No Governance Identified",
      detail: "GovernanceIQ will appear after an association, declaration, resale certificate, budget, rules packet, or private-governance evidence is linked to this Deal.",
      nextAction: "Upload / link governance Evidence through the canonical Evidence intake.",
    },
  };
}

export function governanceSectionFromFocus(focus?: string | null): GovernanceIQSectionId {
  if (!focus) return "overview";
  if (focus.includes("document") || focus.includes("evidence") || focus.includes("source")) return "documents";
  if (focus.includes("restriction")) return "restrictions";
  if (focus.includes("financial") || focus.includes("assessment")) return "financials";
  if (focus.includes("conflict")) return "conflicts";
  if (focus.includes("question") || focus.includes("professional")) return "questions";
  if (focus.includes("change") || focus.includes("propagation")) return "changes";
  return sectionOrder.includes(focus as GovernanceIQSectionId) ? focus as GovernanceIQSectionId : "overview";
}

export function stateLabel(state: GovernanceProjectionState | string) {
  const labels: Record<string, string> = {
    no_governance_identified: "No Governance Identified",
    documents_requested: "Documents Requested",
    processing: "Processing",
    partial: "Partial",
    awaiting_verification: "Awaiting Verification",
    current: "Current",
    current_with_conflicts: "Current with Conflicts",
    stale: "Stale",
    failed_with_prior_analysis: "Failed - Prior Analysis Preserved",
    professional_review_required: "Professional Review Required",
  };
  return labels[state] ?? labelize(state);
}

export function hierarchyLabel(state: GovernanceDocumentHierarchyState | string) {
  const labels: Record<string, string> = {
    candidate_current: "Candidate Current",
    candidate_superseded: "Superseded Candidate",
    conflicting: "Conflicting",
    hierarchy_uncertain: "Hierarchy Uncertain",
    professional_review_required: "Professional Review Required",
  };
  return labels[state] ?? labelize(state);
}

export function restrictionStateLabel(state: GovernanceRestrictionState | string) {
  const labels: Record<string, string> = {
    allowed: "Allowed",
    allowed_with_conditions: "Allowed with Conditions",
    restricted: "Restricted",
    prohibited: "Prohibited",
    approval_required: "Approval Required",
    uncertain: "Uncertain",
    conflicted: "Conflicted",
    unknown: "Unknown",
    not_applicable: "Not Applicable",
    expired: "Expired",
    superseded: "Superseded",
  };
  return labels[state] ?? labelize(state);
}

export function findingCategoryLabel(category: GovernanceFindingCategory | string) {
  const groups: Record<string, string> = {
    dues: "Costs",
    assessment: "Costs",
    reserve: "Financial Health",
    delinquency: "Financial Health",
    debt: "Financial Health",
    budget: "Financial Health",
    litigation: "Transfer / Financing",
    insurance: "Transfer / Financing",
    rental: "Leasing",
    occupancy: "Leasing",
    short_term_rental: "Leasing",
    room_rental: "Leasing",
    entity_ownership: "Transfer / Financing",
    parking: "Parking / Vehicles / Trailers",
    commercial_vehicle: "Parking / Vehicles / Trailers",
    pickup_truck: "Parking / Vehicles / Trailers",
    trailer: "Parking / Vehicles / Trailers",
    rv: "Parking / Vehicles / Trailers",
    boat: "Parking / Vehicles / Trailers",
    towing: "Parking / Vehicles / Trailers",
    architectural_approval: "Renovation",
    renovation: "Renovation",
    contractor_requirement: "Renovation",
    work_hours: "Renovation",
    materials_colors: "Renovation",
    landscaping: "Renovation",
    fencing: "Renovation",
    solar: "Renovation",
    ev: "Renovation",
    antenna: "Renovation",
    structural_work: "Renovation",
    transfer: "Transfer / Financing",
    right_of_first_refusal: "Transfer / Financing",
    board_approval: "Transfer / Financing",
    transfer_fee: "Transfer / Financing",
    lender_requirement: "Transfer / Financing",
    governance_financing_risk: "Transfer / Financing",
  };
  return groups[String(category)] ?? "Use / Operations";
}

export function sourceAnchorLabel(anchor: GovernanceSourceAnchor | undefined) {
  if (!anchor || Object.keys(anchor).length === 0) return "Source anchor unavailable";
  const parts = [
    anchor.page ?? anchor.pageNumber ? `Page ${anchor.page ?? anchor.pageNumber}` : undefined,
    anchor.article ? `Article ${anchor.article}` : undefined,
    anchor.section ? `Section ${anchor.section}` : undefined,
    anchor.clause ? `Clause ${anchor.clause}` : undefined,
    anchor.table ? `Table ${anchor.table}` : undefined,
    anchor.row ? `Row ${anchor.row}` : undefined,
    anchor.budgetLine ? `Budget line ${anchor.budgetLine}` : undefined,
    anchor.meetingDate ? `Meeting ${anchor.meetingDate}` : undefined,
  ].filter(Boolean);
  return parts.join(" / ") || "Source anchor available";
}

export function labelize(value: string | undefined) {
  if (!value) return "Not provided";
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatMoney(value: number | undefined, currency = "USD") {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Not provided";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export function formatPercent(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Not provided";
  return new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 }).format(value);
}

export function possibleImpactLabels(finding: GovernanceFinding) {
  const category = String(finding.findingCategory);
  const impacts = new Set<string>(["Decision Cockpit"]);
  if (["dues", "assessment", "insurance"].includes(category)) impacts.add("underwriting");
  if (["rental", "short_term_rental", "room_rental", "occupancy", "parking", "commercial_vehicle", "pickup_truck", "trailer", "rv", "boat", "architectural_approval", "renovation", "entity_ownership"].includes(category)) impacts.add("strategy");
  if (["litigation", "lender_requirement", "governance_financing_risk", "insurance", "entity_ownership", "board_approval", "right_of_first_refusal", "transfer"].includes(category)) impacts.add("FinanceIQ");
  if (["assessment", "architectural_approval", "board_approval", "right_of_first_refusal"].includes(category)) impacts.add("tasks/deadlines");
  return [...impacts].sort();
}

function groupDocuments(documents: GovernanceDocument[]): GovernanceIQDocumentGroup[] {
  const groups = new Map<string, GovernanceDocument[]>();
  for (const document of documents) {
    const label = labelize(document.documentType);
    groups.set(label, [...(groups.get(label) ?? []), document]);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([label, docs]) => ({
    groupId: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    label,
    documents: docs.sort((a, b) => hierarchySort(a.hierarchyClassification) - hierarchySort(b.hierarchyClassification) || a.title.localeCompare(b.title)),
  }));
}

function groupFindings(findings: GovernanceFinding[]): GovernanceIQFindingGroup[] {
  const groups = new Map<string, GovernanceFinding[]>();
  for (const finding of findings) {
    const label = findingCategoryLabel(finding.findingCategory);
    groups.set(label, [...(groups.get(label) ?? []), finding]);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([label, items]) => ({
    groupId: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    label,
    findings: items.sort((a, b) => severitySort(b.severity) - severitySort(a.severity) || a.summary.localeCompare(b.summary)),
  }));
}

function groupQuestions(questions: GovernanceWorkspaceData["questions"]): GovernanceIQQuestionGroup[] {
  const groups = new Map<GovernanceQuestionTargetRole, GovernanceWorkspaceData["questions"]>();
  for (const question of questions) groups.set(question.targetRole, [...(groups.get(question.targetRole) ?? []), question]);
  return [...groups.entries()].sort(([a], [b]) => questionRoleLabel(a).localeCompare(questionRoleLabel(b))).map(([role, items]) => ({
    groupId: role,
    label: questionRoleLabel(role),
    questions: items,
  }));
}

function guidedPriorities(
  findings: GovernanceFinding[],
  restrictions: GovernanceRestrictionIntelligenceResult[],
  financial: GovernanceFinancialAnalysisResult | undefined,
) {
  const priorities: string[] = [];
  if (financial?.duesIndicator.currentAmount !== undefined) priorities.push(`Dues: ${formatMoney(financial.duesIndicator.currentAmount)} ${financial.duesIndicator.frequency ? labelize(financial.duesIndicator.frequency) : ""}`.trim());
  if (financial?.assessmentIndicator.state === "proposed_only") priorities.push("Assessment: proposed only, not presented as current billed cost.");
  if (financial?.assessmentIndicator.state === "adopted_or_billed") priorities.push("Assessment: adopted or billed source-backed amount needs underwriting review.");
  for (const category of ["short_term_rental", "rental", "trailer", "commercial_vehicle", "architectural_approval", "litigation"]) {
    const restriction = restrictions.find((item) => item.category === category);
    if (restriction) priorities.push(`${labelize(category)}: ${restrictionStateLabel(restriction.state)}`);
  }
  if (!priorities.length && findings.length) priorities.push("Review proposed findings before BRIX treats any governance item as accepted truth.");
  return priorities.length ? priorities : ["Upload or link governance documents to answer dues, assessments, rental, parking, renovation, and financing questions."];
}

function professionalDetails(
  data: GovernanceWorkspaceData,
  financial: GovernanceFinancialAnalysisResult | undefined,
  restrictions: GovernanceRestrictionIntelligenceResult[],
) {
  return [
    `Projection records: ${data.projections.length}`,
    `Documents: ${data.documents.length}`,
    `Findings: ${data.findings.length}`,
    `Questions: ${data.questions.length}`,
    `Propagation records: ${data.propagations.length}`,
    financial ? `Financial result: ${financial.resultHash}` : "Financial result: unavailable",
    restrictions.length ? `Restriction hashes: ${restrictions.map((item) => item.resultHash).slice(0, 3).join(" / ")}` : "Restriction hashes: unavailable",
  ];
}

function statusDetail(projection: GovernanceProjection) {
  if (projection.projectionState === "failed_with_prior_analysis") return "Latest analysis failed. Prior verified analysis remains available.";
  if (projection.projectionState === "stale") return "New or changed governance evidence may affect existing analysis.";
  if (projection.projectionState === "current_with_conflicts") return "Current analysis includes unresolved conflicts. BRIX does not choose a legal winner.";
  if (projection.projectionState === "professional_review_required") return "One or more findings, documents, or questions should be reviewed by a qualified professional.";
  if (projection.projectionState === "awaiting_verification") return "Proposed findings are waiting for governed review.";
  return "Loaded from canonical GovernanceIQ projections.";
}

function documentCompletenessDetail(projection: GovernanceProjection) {
  if (projection.sourceCompleteness === "missing_documents") return "Referenced or expected documents are missing.";
  if (projection.sourceCompleteness === "partial_sources") return "Partial source coverage.";
  return "Documents and findings are source-linked.";
}

function sourceCompletenessLabel(value: GovernanceProjection["sourceCompleteness"]) {
  if (value === "missing_documents") return "Missing documents";
  if (value === "partial_sources") return "Partial sources";
  return "Source linked";
}

function assessmentLabel(financial?: GovernanceFinancialAnalysisResult) {
  if (!financial) return "Not provided";
  const amount = financial.assessmentIndicator.currentAssessmentAmount ?? financial.assessmentIndicator.adoptedAssessmentAmount ?? financial.assessmentIndicator.proposedAssessmentAmount;
  return amount === undefined ? labelize(financial.assessmentIndicator.state) : formatMoney(amount);
}

function assessmentDetail(financial?: GovernanceFinancialAnalysisResult) {
  if (!financial) return "No source-backed assessment data.";
  if (financial.assessmentIndicator.state === "proposed_only") return "Proposed only; not current billed cost.";
  if (financial.assessmentIndicator.state === "adopted_or_billed") return labelize(financial.assessmentIndicator.currentAssessmentStatus);
  return "No active assessment found in current source set.";
}

function propagationSummary(propagations: GovernancePropagationProjection[]) {
  if (!propagations.length) return "No accepted change";
  if (propagations.some((item) => item.blockedProposalCount > 0)) return "Failed - Prior Valid Result Preserved";
  if (propagations.some((item) => item.hasPendingDownstreamReview)) return "Queued / Updating";
  return "Current";
}

function toneForProjection(state: GovernanceProjectionState): GovernanceIQTone {
  if (state === "current") return "good";
  if (state === "failed_with_prior_analysis" || state === "current_with_conflicts") return "danger";
  if (state === "stale" || state === "awaiting_verification" || state === "professional_review_required" || state === "partial" || state === "documents_requested") return "warning";
  return "neutral";
}

function isAccepted(state: GovernanceAcceptanceState) {
  return ["accepted", "accepted_with_verification", "accepted_professional", "confirmed"].includes(state);
}

function hierarchySort(state: GovernanceDocumentHierarchyState) {
  return ["candidate_current", "professional_review_required", "hierarchy_uncertain", "conflicting", "candidate_superseded"].indexOf(state);
}

function severitySort(severity: string) {
  return ["unknown", "informational", "low", "moderate", "high", "critical"].indexOf(severity);
}

function questionRoleLabel(role: GovernanceQuestionTargetRole) {
  const labels: Record<GovernanceQuestionTargetRole, string> = {
    association_manager: "Association / Manager",
    seller: "Seller",
    realtor: "Realtor",
    attorney: "Attorney",
    lender: "Lender",
    insurer: "Insurer",
    contractor_architect: "Contractor / Architect",
    title_closing_professional: "Title / Closing",
    unknown: "Unassigned",
  };
  return labels[role];
}
