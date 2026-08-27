import { CONTRACT_PERSPECTIVES, type ContractPerspective } from "./contractIQ";
import type {
  ContractAmendmentImpactProjection,
  ContractChangePropagationProjection,
  ContractDetailRow,
  ContractIQWorkspaceData,
  ContractPerspectiveAnalysisItem,
  ContractProjectionRecord,
  ContractSourceAnchorValue,
} from "./contractIQClient";
import type { PresentationMode } from "./presentationMode";

export const CONTRACTIQ_WEB_EXPERIENCE_CONTRACT_VERSION = "contractiq-web-experience-v1";

export type ContractIQSectionId =
  | "overview"
  | "documents"
  | "parties_money"
  | "deadlines"
  | "contingencies"
  | "risks"
  | "amendments"
  | "questions"
  | "changes";

export type ContractIQTone = "neutral" | "good" | "warning" | "danger";

export type ContractIQMetric = {
  label: string;
  value: string;
  detail?: string;
  tone: ContractIQTone;
};

export type ContractIQPresentationModel = {
  contractVersion: typeof CONTRACTIQ_WEB_EXPERIENCE_CONTRACT_VERSION;
  dealId: string;
  dealName: string;
  mode: PresentationMode;
  perspective: ContractPerspective;
  selectedProjection?: ContractProjectionRecord;
  projections: ContractProjectionRecord[];
  stateLabel: string;
  statusDetail: string;
  metrics: ContractIQMetric[];
  sourceRows: ContractDetailRow[];
  parties: ContractDetailRow[];
  moneyTerms: ContractDetailRow[];
  terms: ContractDetailRow[];
  deadlines: ContractDetailRow[];
  deadlineResults: ContractIQWorkspaceData["deadlineResults"];
  contingencies: ContractDetailRow[];
  perspectiveGroups: ContractPerspectiveItemGroup[];
  risks: ContractPerspectiveAnalysisItem[];
  conflicts: ContractDetailRow[];
  relationships: ContractDetailRow[];
  amendmentImpacts: ContractAmendmentImpactProjection[];
  questions: ContractQuestionGroup[];
  negotiationConcepts: ContractPerspectiveAnalysisItem[];
  changeProposals: ContractDetailRow[];
  acceptedChangeProposals: ContractDetailRow[];
  propagations: ContractChangePropagationProjection[];
  guidedPriorities: string[];
  professionalDetails: string[];
  emptyState?: { title: string; detail: string; nextAction: string };
};

export type ContractPerspectiveItemGroup = {
  groupId: string;
  label: string;
  items: ContractPerspectiveAnalysisItem[];
};

export type ContractQuestionGroup = {
  groupId: string;
  label: string;
  questions: Array<ContractDetailRow | ContractPerspectiveAnalysisItem>;
};

export const contractIqSections: Array<{ id: ContractIQSectionId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "documents", label: "Documents" },
  { id: "parties_money", label: "Parties & Money" },
  { id: "deadlines", label: "Deadlines" },
  { id: "contingencies", label: "Contingencies" },
  { id: "risks", label: "Risks / Analysis" },
  { id: "amendments", label: "Amendments & Conflicts" },
  { id: "questions", label: "Questions / Review" },
  { id: "changes", label: "Changes / Deal Impact" },
];

export function buildContractIQPresentation(input: {
  dealId: string;
  dealName: string;
  mode: PresentationMode;
  perspective: ContractPerspective;
  data: ContractIQWorkspaceData;
}): ContractIQPresentationModel {
  const { data } = input;
  const selectedProjection = data.selectedProjection;
  const perspective = input.perspective;
  const perspectiveItems = data.perspectiveItems.filter((item) => !item.perspective || item.perspective === perspective);
  const sourceRows = [data.detail.record, ...data.detail.evidenceLinks].filter(Boolean) as ContractDetailRow[];
  const moneyTerms = data.detail.terms.filter(isMoneyTerm);
  const contingencies = data.detail.terms.filter(isContingencyTerm);
  const questionsFromItems = perspectiveItems.filter((item) => item.itemKind === "question" || item.itemKind === "professional_review_item");
  const negotiationConcepts = perspectiveItems.filter((item) => item.itemKind === "negotiation_concept");
  const risks = perspectiveItems.filter((item) => ["risk", "unusual_term", "missing_protection", "missing_information", "conflict", "professional_review"].includes(String(item.findingGroup)));
  const acceptedChangeProposals = data.detail.changeProposals.filter((proposal) => proposal.status === "accepted");
  const reviewCount = (selectedProjection?.professionalReviewCount ?? 0)
    + data.detail.questions.filter((question) => question.status === "open").length
    + perspectiveItems.filter((item) => item.professionalReviewRequired).length
    + data.amendmentImpacts.filter((impact) => impact.professionalReviewRequired).length;

  const metrics = selectedProjection ? [
    { label: "Status", value: analysisStateLabel(selectedProjection.projectionState), detail: statusDetail(selectedProjection), tone: toneForState(selectedProjection.projectionState) },
    { label: "Sources", value: String(selectedProjection.evidenceCount), detail: `${sourceRows.length} source-linked rows`, tone: selectedProjection.evidenceCount > 0 ? "good" : "warning" },
    { label: "Terms", value: String(selectedProjection.termCount), detail: `${selectedProjection.acceptedTermCount} accepted / ${selectedProjection.proposedTermCount} proposed`, tone: selectedProjection.acceptedTermCount > 0 ? "good" : "warning" },
    { label: "Deadlines", value: String(selectedProjection.deadlineCount), detail: deadlineSummary(selectedProjection), tone: selectedProjection.missedDeadlineCount || selectedProjection.deadlineConflictCount ? "danger" : selectedProjection.uncertainDeadlineCount || selectedProjection.deadlineStaleCount ? "warning" : "neutral" },
    { label: "Conflicts", value: String(selectedProjection.unresolvedConflictCount), detail: "BRIX keeps source disagreements unresolved until authorized review.", tone: selectedProjection.unresolvedConflictCount > 0 ? "danger" : "good" },
    { label: "Questions", value: String(selectedProjection.openQuestionCount + questionsFromItems.length), detail: "Follow-up and professional-review queue", tone: selectedProjection.openQuestionCount + questionsFromItems.length > 0 ? "warning" : "good" },
    { label: "Perspective", value: perspectiveLabel(perspective), detail: `${analysisStateLabel(selectedProjection.currentPerspectiveAnalysisState ?? selectedProjection.analysisState)} / facts unchanged`, tone: selectedProjection.perspectivePriorValidAvailable ? "warning" : "neutral" },
    { label: "Review", value: String(reviewCount), detail: selectedProjection.professionalReviewRequired ? "Professional review recommended" : "No review flag in current projection", tone: reviewCount > 0 || selectedProjection.professionalReviewRequired ? "warning" : "good" },
    { label: "Propagation", value: propagationSummary(data.propagations), detail: data.propagations[0]?.targetDomain ? targetDomainLabel(data.propagations[0].targetDomain) : "No accepted-change propagation yet", tone: data.propagations.some((item) => item.failedDownstreamCount > 0) ? "danger" : data.propagations.length ? "good" : "neutral" },
    { label: "Prior valid", value: selectedProjection.priorValidAfterFailure || selectedProjection.perspectivePriorValidAvailable ? "Available" : "Not needed", detail: "Used when newer analysis is stale or failed", tone: selectedProjection.priorValidAfterFailure ? "warning" : "neutral" },
  ] satisfies ContractIQMetric[] : [];

  return {
    contractVersion: CONTRACTIQ_WEB_EXPERIENCE_CONTRACT_VERSION,
    dealId: input.dealId,
    dealName: input.dealName,
    mode: input.mode,
    perspective,
    selectedProjection,
    projections: data.projections,
    stateLabel: selectedProjection ? analysisStateLabel(selectedProjection.projectionState) : "No Contract Identified",
    statusDetail: selectedProjection ? statusDetail(selectedProjection) : "No contract record is linked to this Deal.",
    metrics,
    sourceRows,
    parties: data.detail.parties,
    moneyTerms,
    terms: data.detail.terms,
    deadlines: data.detail.deadlines,
    deadlineResults: data.deadlineResults,
    contingencies,
    perspectiveGroups: groupPerspectiveItems(perspectiveItems.filter((item) => item.itemKind === "finding")),
    risks,
    conflicts: data.detail.conflicts,
    relationships: data.detail.relationships,
    amendmentImpacts: data.amendmentImpacts,
    questions: groupQuestions(data.detail.questions, questionsFromItems),
    negotiationConcepts,
    changeProposals: data.detail.changeProposals,
    acceptedChangeProposals,
    propagations: data.propagations,
    guidedPriorities: guidedPriorities(selectedProjection, data, perspectiveItems),
    professionalDetails: professionalDetails(data),
    emptyState: selectedProjection ? undefined : {
      title: "No Contract Identified",
      detail: "ContractIQ appears after a contract, amendment, addendum, disclosure, lease, loan document, or related real estate agreement is linked as canonical Evidence.",
      nextAction: "Upload / link contract Evidence through the canonical Evidence intake.",
    },
  };
}

export function contractSectionFromFocus(focus?: string | null): ContractIQSectionId {
  if (!focus) return "overview";
  if (focus.includes("document") || focus.includes("evidence") || focus.includes("source")) return "documents";
  if (focus.includes("party") || focus.includes("money") || focus.includes("term")) return "parties_money";
  if (focus.includes("deadline")) return "deadlines";
  if (focus.includes("contingency")) return "contingencies";
  if (focus.includes("risk") || focus.includes("analysis")) return "risks";
  if (focus.includes("amendment") || focus.includes("conflict")) return "amendments";
  if (focus.includes("question") || focus.includes("professional") || focus.includes("negotiation")) return "questions";
  if (focus.includes("change") || focus.includes("impact") || focus.includes("propagation")) return "changes";
  return contractIqSections.some((section) => section.id === focus) ? focus as ContractIQSectionId : "overview";
}

export function perspectiveLabel(value: string | undefined) {
  return labelize(value || "investor");
}

export function analysisStateLabel(value: string | undefined) {
  const labels: Record<string, string> = {
    no_contract: "No Contract",
    uploaded: "Uploaded",
    processing: "Processing",
    partial: "Partial",
    awaiting_verification: "Awaiting Verification",
    current: "Current",
    current_with_conflicts: "Current with Conflicts",
    stale: "Stale",
    failed_with_prior_analysis: "Failed - Prior Analysis Preserved",
    professional_review_required: "Professional Review Required",
    superseded: "Superseded",
    expired: "Expired",
  };
  return labels[value ?? ""] ?? labelize(value);
}

export function sourceAnchorLabel(anchor: ContractSourceAnchorValue | undefined) {
  if (!anchor || Object.keys(anchor).length === 0) return "Source anchor unavailable";
  const parts = [
    anchor.label ? String(anchor.label) : undefined,
    anchor.page ? `Page ${anchor.page}` : undefined,
    anchor.section ? `Section ${anchor.section}` : undefined,
    anchor.article ? `Article ${anchor.article}` : undefined,
    anchor.clause ? `Clause ${anchor.clause}` : undefined,
    anchor.paragraph ? `Paragraph ${anchor.paragraph}` : undefined,
    anchor.exhibit ? `Exhibit ${anchor.exhibit}` : undefined,
    anchor.table ? `Table ${anchor.table}` : undefined,
    anchor.row ? `Row ${anchor.row}` : undefined,
    anchor.lineRef ? `Line ${anchor.lineRef}` : undefined,
  ].filter(Boolean);
  return parts.join(" / ") || "Source anchor available";
}

export function formatDateTime(value?: string) {
  if (!value) return "Not provided";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function formatMoney(value: unknown, currency = "USD") {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(number)) return "Not provided";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(number);
}

export function formatPercent(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Not provided";
  return new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 }).format(value / 100);
}

export function labelize(value: string | undefined) {
  if (!value) return "Not provided";
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function compactJson(value: unknown) {
  if (!value || (typeof value === "object" && Object.keys(value).length === 0)) return "Not provided";
  return JSON.stringify(value).replace(/[{}"]/g, "").slice(0, 180);
}

export function targetDomainLabel(value: string | undefined) {
  const labels: Record<string, string> = {
    deal_fact: "Deal",
    property_fact: "Property",
    finance: "FinanceIQ",
    underwriting_input: "Underwriting",
    strategy_requirement: "Strategy",
    governance_reference: "GovernanceIQ",
    task_deadline: "Tasks / Deadlines",
    cockpit_attention: "Decision Cockpit",
    reporting_candidate: "Reports Candidate",
    offer_candidate: "Offer Candidate",
    none: "No downstream target",
  };
  return labels[value ?? ""] ?? labelize(value);
}

export function availablePerspectives() {
  return [...CONTRACT_PERSPECTIVES];
}

function groupPerspectiveItems(items: ContractPerspectiveAnalysisItem[]): ContractPerspectiveItemGroup[] {
  const groups = new Map<string, ContractPerspectiveAnalysisItem[]>();
  for (const item of items) {
    const key = item.findingGroup ?? "other";
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.entries()].sort(([a], [b]) => groupSort(a) - groupSort(b) || a.localeCompare(b)).map(([groupId, grouped]) => ({
    groupId,
    label: labelize(groupId),
    items: grouped.sort((a, b) => severitySort(b.severity) - severitySort(a.severity) || a.title.localeCompare(b.title)),
  }));
}

function groupQuestions(detailQuestions: ContractDetailRow[], perspectiveQuestions: ContractPerspectiveAnalysisItem[]): ContractQuestionGroup[] {
  return [
    { groupId: "canonical_questions", label: "Canonical Questions", questions: detailQuestions },
    { groupId: "perspective_questions", label: "Perspective Questions", questions: perspectiveQuestions },
  ].filter((group) => group.questions.length > 0);
}

function guidedPriorities(
  projection: ContractProjectionRecord | undefined,
  data: ContractIQWorkspaceData,
  perspectiveItems: ContractPerspectiveAnalysisItem[],
) {
  if (!projection) return ["Upload or link contract Evidence to begin ContractIQ review."];
  const priorities: string[] = [];
  if (projection.nextDeadlineDueAt) priorities.push(`Next deadline: ${formatDateTime(projection.nextDeadlineDueAt)}`);
  if (projection.unresolvedConflictCount > 0) priorities.push(`${projection.unresolvedConflictCount} unresolved source conflict${projection.unresolvedConflictCount === 1 ? "" : "s"}.`);
  if (projection.professionalReviewRequired) priorities.push("Professional review recommended before relying on this contract state.");
  const risk = perspectiveItems.find((item) => item.findingGroup === "risk" || item.severity === "critical" || item.severity === "high");
  if (risk) priorities.push(`${risk.title}: ${risk.summary}`);
  const accepted = data.detail.changeProposals.filter((proposal) => proposal.status === "accepted").length;
  if (accepted > data.propagations.length) priorities.push("Accepted ContractIQ changes are ready for server-owned propagation.");
  if (!priorities.length) priorities.push("Review source-linked terms, deadlines, and questions before accepting downstream Deal impact.");
  return priorities.slice(0, 5);
}

function professionalDetails(data: ContractIQWorkspaceData) {
  return [
    `Projection records: ${data.projections.length}`,
    `Detail rows: ${Object.values(data.detail).flat().length}`,
    `Perspective items: ${data.perspectiveItems.length}`,
    `Deadline result rows: ${data.deadlineResults.length}`,
    `Amendment impact rows: ${data.amendmentImpacts.length}`,
    `Propagation records: ${data.propagations.length}`,
    data.propagations[0]?.deterministicRequestHash ? `Latest propagation hash: ${data.propagations[0].deterministicRequestHash}` : "Latest propagation hash: unavailable",
  ];
}

function isMoneyTerm(term: ContractDetailRow) {
  const haystack = `${term.label} ${term.payload.term_category ?? ""} ${term.payload.term_type ?? ""}`.toLowerCase();
  return ["price", "deposit", "earnest", "fee", "rent", "credit", "seller_credit", "loan", "financing", "escrow", "proration", "cost", "money", "payment"].some((needle) => haystack.includes(needle));
}

function isContingencyTerm(term: ContractDetailRow) {
  const haystack = `${term.label} ${term.payload.term_category ?? ""} ${term.payload.term_type ?? ""}`.toLowerCase();
  return ["contingency", "inspection", "financing", "appraisal", "title", "survey", "attorney", "review", "feasibility", "association"].some((needle) => haystack.includes(needle));
}

function deadlineSummary(projection: ContractProjectionRecord) {
  const alerts = [
    projection.verifiedCurrentDeadlineCount ? `${projection.verifiedCurrentDeadlineCount} current` : undefined,
    projection.proposedDeadlineCount ? `${projection.proposedDeadlineCount} proposed` : undefined,
    projection.uncertainDeadlineCount ? `${projection.uncertainDeadlineCount} uncertain` : undefined,
    projection.missedDeadlineCount ? `${projection.missedDeadlineCount} missed` : undefined,
    projection.deadlineStaleCount ? `${projection.deadlineStaleCount} stale` : undefined,
  ].filter(Boolean);
  return alerts.join(" / ") || "No deterministic deadline result yet";
}

function statusDetail(projection: ContractProjectionRecord) {
  if (projection.projectionState === "failed_with_prior_analysis") return "Latest analysis failed. Prior valid ContractIQ result remains available.";
  if (projection.projectionState === "stale") return "New or changed contract Evidence may affect this projection.";
  if (projection.projectionState === "current_with_conflicts") return "Current analysis has unresolved source conflicts.";
  if (projection.projectionState === "professional_review_required") return "Professional review is recommended before relying on this item.";
  return `${labelize(projection.status)} / ${labelize(projection.verificationState)} / Confidence ${formatPercent(projection.confidence)}`;
}

function propagationSummary(items: ContractChangePropagationProjection[]) {
  if (!items.length) return "None";
  const failed = items.filter((item) => item.failedDownstreamCount > 0).length;
  if (failed) return `${failed} Needs Review`;
  return `${items.length} Propagated`;
}

function toneForState(state: string): ContractIQTone {
  if (state === "current") return "good";
  if (state === "current_with_conflicts" || state === "failed_with_prior_analysis" || state === "professional_review_required") return "danger";
  if (state === "stale" || state === "partial" || state === "awaiting_verification" || state === "processing") return "warning";
  return "neutral";
}

function groupSort(group: string) {
  const order = ["risk", "missing_protection", "conflict", "unusual_term", "obligation", "missing_information", "professional_review", "amendment_impact", "benefit"];
  const index = order.indexOf(group);
  return index >= 0 ? index : order.length;
}

function severitySort(severity: string | undefined) {
  const order: Record<string, number> = { critical: 5, high: 4, moderate: 3, low: 2, informational: 1, unknown: 0 };
  return order[severity ?? "unknown"] ?? 0;
}
