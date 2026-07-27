import { createManualIntakeDuplicateRequest } from "./propertyIntake";
import { classifySource, classificationForManualDraft } from "./sourceClassification";
import { normalizeStrategy } from "./strategyCatalog";
import type { SourceConflictResult } from "./sourceConflicts";
import type { FileEvidenceProposal, ListingUrlProposal, ManualIntakeDraft } from "./types";

export const manualFallbackSources = [
  "manual_intake",
  "listing_url",
  "file_intake",
  "image_intake",
  "document_intake",
  "email_intake",
  "share_extension",
  "package_intake",
  "batch_intake",
  "future_provider_adapter",
  "future_mls_provider",
] as const;

export const manualFallbackStates = [
  "automatic",
  "partial",
  "requires_review",
  "manual_required",
  "manual_in_progress",
  "manual_completed",
  "manual_cancelled",
] as const;

export const manualFallbackFieldStatuses = [
  "accepted",
  "needs_review",
  "missing",
  "conflicted",
  "deferred",
] as const;

export const manualFallbackEvents = [
  "manual.fallback_started",
  "manual.field_completed",
  "manual.fallback_completed",
] as const;

export const canonicalManualFallbackPath = [
  "existing_manual_intake_draft",
  "existing_source_recording",
  "existing_proposal_acceptance",
  "existing_duplicate_detection",
  "existing_canonical_property_creation",
  "existing_canonical_deal_creation",
  "existing_evidence_attachment",
  "existing_domain_events",
  "existing_audit",
] as const;

export type ManualFallbackSource = typeof manualFallbackSources[number];
export type ManualFallbackState = typeof manualFallbackStates[number];
export type ManualFallbackFieldStatus = typeof manualFallbackFieldStatuses[number];
export type ManualFallbackEventType = typeof manualFallbackEvents[number];
export type ManualFallbackFieldKey =
  | "opportunityName"
  | "address"
  | "unitNumber"
  | "city"
  | "region"
  | "postalCode"
  | "country"
  | "propertyType"
  | "askingPrice"
  | "expectedPrice"
  | "intendedStrategy"
  | "source"
  | "sourceUrl"
  | "sourceContact"
  | "notes";

export type ManualFallbackEvidence = {
  id: string;
  source: ManualFallbackSource | string;
  label: string;
  status: "preserved";
  proposalId?: string;
  confidence?: number;
};

export type ManualFallbackField = {
  field: ManualFallbackFieldKey;
  label: string;
  status: ManualFallbackFieldStatus;
  editable: boolean;
  locked: boolean;
  blocked: boolean;
  currentValue?: string;
  proposalIds: string[];
  sourceEvidence: ManualFallbackEvidence[];
  reason: string;
};

export type ManualFallbackEvent = {
  type: ManualFallbackEventType;
  fallbackId: string;
  source: ManualFallbackSource;
  field?: ManualFallbackFieldKey;
  occurredAt: string;
};

export type ManualFallbackPlan = {
  fallbackId: string;
  source: ManualFallbackSource;
  state: ManualFallbackState;
  draft: ManualIntakeDraft;
  requiredFields: ManualFallbackFieldKey[];
  fields: ManualFallbackField[];
  unresolvedFields: ManualFallbackField[];
  events: ManualFallbackEvent[];
  canonicalPath: typeof canonicalManualFallbackPath;
  duplicateDetectionRequest?: ReturnType<typeof createManualIntakeDuplicateRequest>;
  sourceClassification: ReturnType<typeof classificationForManualDraft>;
  sourceEvidence: ManualFallbackEvidence[];
  conflicts: SourceConflictResult[];
};

export type ManualFallbackPlanInput = {
  workspaceId?: string;
  source: ManualFallbackSource;
  draft: ManualIntakeDraft;
  proposals?: Array<ListingUrlProposal | FileEvidenceProposal>;
  conflicts?: SourceConflictResult[];
  requiredFields?: ManualFallbackFieldKey[];
  acceptedFields?: ManualFallbackFieldKey[];
  state?: ManualFallbackState;
  occurredAt?: string;
};

const defaultRequiredFields: ManualFallbackFieldKey[] = ["opportunityName", "address", "intendedStrategy"];
const supportedProposalFields = ["address", "city", "region", "postal_code", "property_type", "asking_price"] as const;
const fieldMetadata: Record<ManualFallbackFieldKey, { label: string; proposalField?: typeof supportedProposalFields[number] }> = {
  opportunityName: { label: "Opportunity name" },
  address: { label: "Address", proposalField: "address" },
  unitNumber: { label: "Unit number" },
  city: { label: "City", proposalField: "city" },
  region: { label: "State or region", proposalField: "region" },
  postalCode: { label: "Postal code", proposalField: "postal_code" },
  country: { label: "Country" },
  propertyType: { label: "Property type", proposalField: "property_type" },
  askingPrice: { label: "Asking price", proposalField: "asking_price" },
  expectedPrice: { label: "Expected price" },
  intendedStrategy: { label: "Strategy" },
  source: { label: "Source" },
  sourceUrl: { label: "Source URL" },
  sourceContact: { label: "Source contact" },
  notes: { label: "Notes" },
};

export function createManualFallbackPlan(input: ManualFallbackPlanInput): ManualFallbackPlan {
  assertManualFallbackSource(input.source);
  const occurredAt = input.occurredAt ?? new Date().toISOString();
  const proposals = input.proposals ?? allDraftProposals(input.draft);
  const conflicts = input.conflicts ?? [];
  const requiredFields = input.requiredFields?.length ? input.requiredFields : defaultRequiredFields;
  const accepted = new Set(input.acceptedFields ?? acceptedFieldsFromDraft(input.draft, proposals));
  const sourceEvidence = preserveSourceEvidence(input.source, input.draft, proposals);
  const fields = uniqueFields([...requiredFields, ...fieldsWithValues(input.draft), ...proposalBackedFields(proposals), ...conflictedFields(conflicts)])
    .map((field) => buildFallbackField(field, input.draft, proposals, conflicts, accepted, sourceEvidence, requiredFields.includes(field)));
  const unresolvedFields = fields.filter((field) => field.status !== "accepted");
  const state = input.state ?? stateFor(fields, requiredFields);
  return {
    fallbackId: `manual-fallback:${input.source}:${input.draft.id}`,
    source: input.source,
    state,
    draft: input.draft,
    requiredFields,
    fields,
    unresolvedFields,
    events: [{ type: "manual.fallback_started", fallbackId: `manual-fallback:${input.source}:${input.draft.id}`, source: input.source, occurredAt }],
    canonicalPath: canonicalManualFallbackPath,
    duplicateDetectionRequest: input.workspaceId ? createManualIntakeDuplicateRequest(input.workspaceId, input.draft) : undefined,
    sourceClassification: classifyFallbackSource(input.source, input.draft),
    sourceEvidence,
    conflicts,
  };
}

export function completeManualFallbackField(plan: ManualFallbackPlan, field: ManualFallbackFieldKey, value: string, occurredAt = new Date().toISOString()): ManualFallbackPlan {
  const target = plan.fields.find((candidate) => candidate.field === field);
  if (!target) throw new Error("This field is not part of the manual fallback review.");
  if (!target.editable || target.locked || target.blocked) throw new Error("This field must be resolved through the existing proposal or conflict review workflow.");
  const nextDraft = writeDraftField(plan.draft, field, value);
  const completed = buildFallbackField(field, nextDraft, allDraftProposals(nextDraft), plan.conflicts, new Set([field]), plan.sourceEvidence, true);
  const fields = plan.fields.map((candidate) => candidate.field === field ? completed : candidate);
  return {
    ...plan,
    draft: { ...nextDraft, updatedAt: occurredAt },
    fields,
    unresolvedFields: fields.filter((candidate) => candidate.status !== "accepted"),
    state: stateFor(fields, plan.requiredFields),
    events: [...plan.events, { type: "manual.field_completed", fallbackId: plan.fallbackId, source: plan.source, field, occurredAt }],
  };
}

export function completeManualFallback(plan: ManualFallbackPlan, occurredAt = new Date().toISOString()): ManualFallbackPlan {
  const requiredUnresolved = plan.fields.filter((field) => plan.requiredFields.includes(field.field) && field.status !== "accepted" && (field.status === "missing" || field.status === "needs_review" || field.status === "conflicted"));
  if (requiredUnresolved.some((field) => field.blocked || !field.currentValue?.trim())) {
    throw new Error("Complete unresolved manual fallback fields before creating the canonical Deal.");
  }
  return {
    ...plan,
    state: "manual_completed",
    events: [...plan.events, { type: "manual.fallback_completed", fallbackId: plan.fallbackId, source: plan.source, occurredAt }],
  };
}

export function cancelManualFallback(plan: ManualFallbackPlan): ManualFallbackPlan {
  return { ...plan, state: "manual_cancelled" };
}

export function manualFallbackReviewModel(plan: ManualFallbackPlan) {
  return {
    source: plan.source,
    state: plan.state,
    canonicalPath: plan.canonicalPath,
    sections: {
      accepted: plan.fields.filter((field) => field.status === "accepted"),
      needsReview: plan.fields.filter((field) => field.status === "needs_review"),
      missing: plan.fields.filter((field) => field.status === "missing"),
      conflicted: plan.fields.filter((field) => field.status === "conflicted"),
      deferred: plan.fields.filter((field) => field.status === "deferred"),
    },
    unresolvedFields: plan.unresolvedFields,
    sourceEvidence: plan.sourceEvidence,
    safePrimaryAction: "Continue manual intake",
  };
}

export function assertManualFallbackSource(source: string): asserts source is ManualFallbackSource {
  if (!manualFallbackSources.includes(source as ManualFallbackSource)) throw new Error("Unsupported manual fallback source.");
}

function buildFallbackField(
  field: ManualFallbackFieldKey,
  draft: ManualIntakeDraft,
  proposals: Array<ListingUrlProposal | FileEvidenceProposal>,
  conflicts: SourceConflictResult[],
  acceptedFields: Set<ManualFallbackFieldKey>,
  sourceEvidence: ManualFallbackEvidence[],
  required: boolean,
): ManualFallbackField {
  const proposalField = fieldMetadata[field].proposalField;
  const fieldProposals = proposalField ? proposals.filter((proposal) => proposal.field === proposalField) : [];
  const conflict = conflicts.find((candidate) => candidate.targetField === proposalField || candidate.targetField === field);
  const currentValue = readDraftField(draft, field);
  const hasAccepted = acceptedFields.has(field) && Boolean(currentValue?.trim());
  const hasDeferred = fieldProposals.some((proposal) => proposal.status === "deferred");
  const hasRejected = fieldProposals.some((proposal) => proposal.status === "rejected");
  const pending = fieldProposals.filter((proposal) => proposal.status === "pending" || proposal.status === "superseded");
  const evidence = sourceEvidence.filter((item) => !item.proposalId || fieldProposals.some((proposal) => proposal.id === item.proposalId));

  if (conflict && conflict.lifecycleState !== "resolved" && conflict.classification !== "no_conflict") {
    return fieldModel(field, "conflicted", currentValue, fieldProposals, evidence, "Resolve the source conflict before this field can be used.", false, true, true);
  }
  if (hasAccepted) {
    return fieldModel(field, "accepted", currentValue, fieldProposals, evidence, "Accepted value is locked and will not be overwritten by automation.", false, true, false);
  }
  if (hasDeferred) {
    return fieldModel(field, "deferred", currentValue, fieldProposals, evidence, "Deferred value remains preserved for later proposal review.", false, false, false);
  }
  if (pending.length) {
    return fieldModel(field, "needs_review", currentValue, fieldProposals, evidence, "Review the proposed value or complete this field manually.", true, false, false);
  }
  if (required || !currentValue?.trim()) {
    return fieldModel(field, "missing", currentValue, fieldProposals, evidence, hasRejected ? "Rejected source values remain rejected; enter the field manually." : "Manual completion is required.", true, false, false);
  }
  return fieldModel(field, "needs_review", currentValue, fieldProposals, evidence, "Confirm this user-entered value before completing intake.", true, false, false);
}

function fieldModel(
  field: ManualFallbackFieldKey,
  status: ManualFallbackFieldStatus,
  currentValue: string | undefined,
  proposals: Array<ListingUrlProposal | FileEvidenceProposal>,
  evidence: ManualFallbackEvidence[],
  reason: string,
  editable: boolean,
  locked: boolean,
  blocked: boolean,
): ManualFallbackField {
  return {
    field,
    label: fieldMetadata[field].label,
    status,
    editable,
    locked,
    blocked,
    currentValue,
    proposalIds: proposals.map((proposal) => proposal.id),
    sourceEvidence: evidence,
    reason,
  };
}

function stateFor(fields: ManualFallbackField[], requiredFields: ManualFallbackFieldKey[]): ManualFallbackState {
  const required = fields.filter((field) => requiredFields.includes(field.field));
  if (required.some((field) => field.status === "conflicted")) return "requires_review";
  if (required.some((field) => field.status === "missing")) return "manual_required";
  if (required.some((field) => field.status === "needs_review" || field.status === "deferred")) return "partial";
  if (required.length && required.every((field) => field.status === "accepted")) return "manual_completed";
  return "manual_in_progress";
}

function classifyFallbackSource(source: ManualFallbackSource, draft: ManualIntakeDraft) {
  if (source === "listing_url" || draft.sourceUrl) return classificationForManualDraft(draft);
  if (source === "email_intake") return classifySource({ sourceType: "email", sourceName: draft.source });
  if (source === "image_intake") return classifySource({ sourceType: "image", evidenceType: "image", sourceName: draft.source });
  if (source === "file_intake" || source === "document_intake" || source === "package_intake" || source === "batch_intake") return classifySource({ sourceType: "file", sourceName: draft.source });
  if (source === "future_mls_provider") return classifySource({ sourceType: "mls_listing", providerKind: "mls" });
  if (source === "future_provider_adapter") return classifySource({ sourceType: "future_reserved" });
  return classificationForManualDraft({ source: draft.source });
}

function preserveSourceEvidence(source: ManualFallbackSource, draft: ManualIntakeDraft, proposals: Array<ListingUrlProposal | FileEvidenceProposal>): ManualFallbackEvidence[] {
  const base: ManualFallbackEvidence[] = [];
  if (draft.sourceUrl) base.push({ id: `source-url:${draft.sourceUrl}`, source, label: draft.sourceUrl, status: "preserved" });
  if (draft.listingImport) base.push({ id: `listing:${draft.listingImport.normalizedUrl}`, source, label: draft.listingImport.sourceDisplayName, status: "preserved" });
  if (draft.fileEvidenceImport) base.push({ id: `evidence:${draft.fileEvidenceImport.evidenceId}`, source, label: draft.fileEvidenceImport.originalFilename, status: "preserved" });
  if (draft.emailImport) base.push({ id: `email:${draft.emailImport.emailSourceId}`, source, label: draft.emailImport.subject ?? "Email source", status: "preserved" });
  return [
    ...base,
    ...proposals.map((proposal) => ({
      id: `proposal:${proposal.id}`,
      source,
      label: `${proposal.label}: ${proposal.displayValue}`,
      status: "preserved" as const,
      proposalId: proposal.id,
      confidence: proposal.confidence,
    })),
  ];
}

function allDraftProposals(draft: ManualIntakeDraft) {
  return [
    ...(draft.listingProposals ?? []),
    ...(draft.fileEvidenceProposals ?? []),
    ...(draft.emailProposals ?? []),
  ];
}

function acceptedFieldsFromDraft(draft: ManualIntakeDraft, proposals: Array<ListingUrlProposal | FileEvidenceProposal>) {
  const accepted = new Set<ManualFallbackFieldKey>();
  for (const proposal of proposals) {
    if (proposal.status === "accepted" || proposal.status === "edited") accepted.add(fieldFromProposal(proposal.field));
  }
  for (const field of fieldsWithValues(draft)) accepted.add(field);
  return [...accepted];
}

function proposalBackedFields(proposals: Array<ListingUrlProposal | FileEvidenceProposal>) {
  return proposals.map((proposal) => fieldFromProposal(proposal.field));
}

function conflictedFields(conflicts: SourceConflictResult[]) {
  return conflicts
    .filter((conflict) => conflict.lifecycleState !== "resolved" && conflict.classification !== "no_conflict")
    .map((conflict) => fieldFromConflictTarget(conflict.targetField))
    .filter((field): field is ManualFallbackFieldKey => Boolean(field));
}

function fieldsWithValues(draft: ManualIntakeDraft): ManualFallbackFieldKey[] {
  return (Object.keys(fieldMetadata) as ManualFallbackFieldKey[]).filter((field) => Boolean(readDraftField(draft, field)?.trim()));
}

function fieldFromProposal(field: ListingUrlProposal["field"]): ManualFallbackFieldKey {
  if (field === "postal_code") return "postalCode";
  if (field === "property_type") return "propertyType";
  if (field === "asking_price") return "askingPrice";
  return field;
}

function fieldFromConflictTarget(field: string): ManualFallbackFieldKey | undefined {
  if (field === "postal_code") return "postalCode";
  if (field === "property_type") return "propertyType";
  if (field === "asking_price") return "askingPrice";
  if ((Object.keys(fieldMetadata) as string[]).includes(field)) return field as ManualFallbackFieldKey;
  return undefined;
}

function uniqueFields(fields: ManualFallbackFieldKey[]) {
  return [...new Set(fields)];
}

function readDraftField(draft: ManualIntakeDraft, field: ManualFallbackFieldKey) {
  const value = draft[field];
  return typeof value === "string" ? value : value ?? undefined;
}

function writeDraftField(draft: ManualIntakeDraft, field: ManualFallbackFieldKey, value: string): ManualIntakeDraft {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Enter a value before completing the field.");
  if (field === "region") return { ...draft, region: trimmed.toUpperCase() };
  if (field === "intendedStrategy") return { ...draft, intendedStrategy: normalizeStrategy(trimmed) };
  return { ...draft, [field]: trimmed };
}
