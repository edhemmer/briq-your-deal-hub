import { getStrategy, normalizeStrategy } from "./strategyCatalog";
import { classificationForManualDraft, serializeSourceClassification } from "./sourceClassification";
import { supabase } from "./supabase";
import { attachFileEvidenceToDeal, normalizeFileEvidenceImportResult } from "./fileEvidenceIntake";
import { attachEmailSourceToDeal, normalizeEmailIntakeImportResult } from "./emailIntake";
import { createDuplicateDetectionRequest } from "./duplicateDetection";
import type { Json } from "./supabaseDatabase.types";
import type { DealFacts, EmailIntakeImportResult, FileEvidenceImportResult, FileEvidenceProposal, ListingUrlImportResult, ListingUrlProposal, ManualIntakeDraft, ManualIntakeResult, ManualPropertyCandidate } from "./types";

type UnknownRecord = Record<string, unknown>;

export const MANUAL_INTAKE_DRAFT_PREFIX = "brix.manualIntakeDraft:";

export function createManualIntakeDraft(): ManualIntakeDraft {
  const now = new Date().toISOString();
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `manual_${Date.now()}`,
    opportunityName: "",
    address: "",
    country: "US",
    intendedStrategy: "owner_occupant",
    updatedAt: now,
  };
}

export function normalizeManualIntakeDraft(value: unknown): ManualIntakeDraft | null {
  if (!isRecord(value)) return null;
  const id = stringValue(value.id);
  if (!id) return null;
  const intendedStrategy = getStrategy(stringValue(value.intendedStrategy))?.id ?? normalizeStrategy("owner_occupant");
  return {
    id,
    opportunityName: stringValue(value.opportunityName) ?? "",
    address: stringValue(value.address) ?? "",
    unitNumber: stringValue(value.unitNumber),
    city: stringValue(value.city),
    region: stringValue(value.region)?.toUpperCase(),
    postalCode: stringValue(value.postalCode),
    country: stringValue(value.country)?.toUpperCase() ?? "US",
    propertyType: stringValue(value.propertyType),
    askingPrice: stringValue(value.askingPrice),
    expectedPrice: stringValue(value.expectedPrice),
    intendedStrategy,
    source: stringValue(value.source),
    sourceUrl: stringValue(value.sourceUrl),
    sourceContact: stringValue(value.sourceContact),
    notes: stringValue(value.notes),
    listingImport: normalizeListingImport(value.listingImport),
    listingProposals: Array.isArray(value.listingProposals) ? value.listingProposals.map(normalizeListingProposal).filter(isListingProposal) : undefined,
    fileEvidenceImport: normalizeFileEvidenceImport(value.fileEvidenceImport),
    fileEvidenceProposals: Array.isArray(value.fileEvidenceProposals) ? value.fileEvidenceProposals.map(normalizeFileEvidenceProposal).filter(isFileEvidenceProposal) : undefined,
    emailImport: normalizeEmailImport(value.emailImport),
    emailProposals: Array.isArray(value.emailProposals) ? value.emailProposals.map(normalizeFileEvidenceProposal).filter(isFileEvidenceProposal) : undefined,
    sourceClassification: classificationForManualDraft({ source: stringValue(value.source), sourceUrl: stringValue(value.sourceUrl) }),
    duplicateDecision: value.duplicateDecision === "use_existing_property" || value.duplicateDecision === "create_new_property" ? value.duplicateDecision : undefined,
    selectedPropertyId: stringValue(value.selectedPropertyId),
    updatedAt: stringValue(value.updatedAt) ?? new Date().toISOString(),
  };
}

export function loadManualIntakeDraft(scopeKey: string): ManualIntakeDraft | null {
  try {
    return normalizeManualIntakeDraft(JSON.parse(localStorage.getItem(`${MANUAL_INTAKE_DRAFT_PREFIX}${scopeKey}`) ?? "null"));
  } catch {
    return null;
  }
}

export function saveManualIntakeDraft(scopeKey: string, draft: ManualIntakeDraft) {
  const normalized = normalizeManualIntakeDraft({ ...draft, updatedAt: new Date().toISOString() });
  if (!normalized) throw new Error("Manual intake draft is not usable.");
  localStorage.setItem(`${MANUAL_INTAKE_DRAFT_PREFIX}${scopeKey}`, JSON.stringify(normalized));
  return normalized;
}

export function clearManualIntakeDraft(scopeKey: string) {
  localStorage.removeItem(`${MANUAL_INTAKE_DRAFT_PREFIX}${scopeKey}`);
}

export function manualIntakeInput(draft: ManualIntakeDraft) {
  return {
    opportunity_name: draft.opportunityName.trim(),
    address: draft.address.trim(),
    unit_number: draft.unitNumber?.trim() || null,
    city: draft.city?.trim() || null,
    region: draft.region?.trim() || null,
    postal_code: draft.postalCode?.trim() || null,
    country: draft.country?.trim() || "US",
    property_type: draft.propertyType?.trim() || null,
    asking_price: numericString(draft.askingPrice),
    expected_price: numericString(draft.expectedPrice),
    intended_strategy: draft.intendedStrategy || null,
    source: draft.source?.trim() || null,
    source_url: draft.sourceUrl?.trim() || null,
    source_contact: draft.sourceContact?.trim() || null,
    notes: draft.notes?.trim() || null,
    listing_import: draft.listingImport ?? null,
    listing_proposals: draft.listingProposals ?? [],
    file_evidence_import: draft.fileEvidenceImport ?? null,
    file_evidence_proposals: draft.fileEvidenceProposals ?? [],
    email_import: draft.emailImport ?? null,
    email_proposals: draft.emailProposals ?? [],
    source_classification: serializeSourceClassification(classificationForManualDraft(draft)),
  };
}

export function validateManualIntakeDraft(draft: ManualIntakeDraft) {
  const errors: string[] = [];
  if (!draft.address.trim()) errors.push("Enter an address or descriptive location.");
  if (!draft.opportunityName.trim()) errors.push("Enter an opportunity name.");
  if (draft.askingPrice && numericString(draft.askingPrice) === null) errors.push("Asking price must be a number when supplied.");
  if (draft.expectedPrice && numericString(draft.expectedPrice) === null) errors.push("Expected price must be a number when supplied.");
  return errors;
}

export function createManualIntakeDuplicateRequest(workspaceId: string, draft: ManualIntakeDraft) {
  return createDuplicateDetectionRequest({
    workspaceId,
    subjectType: "property",
    identity: {
      normalizedAddress: [draft.address, draft.city, draft.region, draft.postalCode].filter(Boolean).join(" "),
      unitNumber: draft.unitNumber,
      sourceUrl: draft.sourceUrl,
      idempotencyKey: `manual-intake:${draft.id}`,
    },
  });
}

export async function searchManualPropertyCandidates(workspaceId: string, draft: ManualIntakeDraft): Promise<ManualPropertyCandidate[]> {
  const { data, error } = await supabase.rpc("search_manual_property_candidates", {
    target_workspace_id: workspaceId,
    manual_input: manualIntakeInput(draft),
    candidate_limit: 5,
  });
  if (error) throw error;
  return Array.isArray(data) ? data.map(normalizeCandidate).filter(isCandidate) : [];
}

export async function completeManualPropertyIntake(workspaceId: string, draft: ManualIntakeDraft, idempotencyKey?: string): Promise<ManualIntakeResult> {
  const decision = draft.duplicateDecision ?? "create_new_property";
  const { data, error } = await supabase.rpc("complete_manual_property_intake", {
    target_workspace_id: workspaceId,
    idempotency_key: idempotencyKey ?? `manual-intake:${draft.id}`,
    manual_input: manualIntakeInput(draft),
    duplicate_decision: decision,
    selected_property_id: decision === "use_existing_property" ? draft.selectedPropertyId ?? null : null,
  });
  if (error) throw error;
  const result = normalizeManualIntakeResult(Array.isArray(data) ? data[0] : data);
  if (!result) throw new Error("BRIX could not confirm the manual intake result.");
  if (draft.sourceUrl && draft.listingImport) {
    await recordListingUrlImportResult(workspaceId, result, draft);
  }
  if (draft.fileEvidenceImport) {
    await attachFileEvidenceToDeal(workspaceId, result, draft.fileEvidenceImport);
  }
  if (draft.emailImport) {
    await attachEmailSourceToDeal(workspaceId, result, draft.emailImport);
  }
  return result;
}

export function manualIntakeDealFromResult(draft: ManualIntakeDraft, result: ManualIntakeResult): DealFacts {
  const now = new Date().toISOString();
  return {
    id: result.dealId,
    dealVersion: result.dealVersion,
    propertyId: result.propertyId,
    propertyVersion: result.propertyVersion,
    createdAt: now,
    updatedAt: now,
    status: "draft",
    address: draft.address.trim(),
    city: draft.city?.trim() || undefined,
    state: draft.region?.trim() || undefined,
    zip: draft.postalCode?.trim() || undefined,
    propertyType: draft.propertyType?.trim() || undefined,
    sourceUrl: draft.sourceUrl?.trim() || undefined,
    sourceText: draft.source?.trim() || undefined,
    listPrice: numberValue(draft.askingPrice),
    strategyId: draft.intendedStrategy || "owner_occupant",
    notes: draft.notes?.trim() ? [draft.notes.trim()] : [],
    photoUrls: [],
    uploadedPhotoNames: [],
    verification: {
      address: "entered",
      manual_source: "entered",
      listing_url: draft.sourceUrl ? "source_backed" : "missing",
      evidence: draft.fileEvidenceImport ? "source_backed" : "missing",
      email_source: draft.emailImport ? "source_backed" : "missing",
      propertyType: draft.propertyType ? "entered" : "missing",
      listPrice: draft.askingPrice ? "entered" : "missing",
    },
  };
}

async function recordListingUrlImportResult(workspaceId: string, result: ManualIntakeResult, draft: ManualIntakeDraft) {
  const rpc = supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: Error | null }>;
  const { error } = await rpc("record_listing_url_import_result", {
    target_workspace_id: workspaceId,
    target_intake_id: result.intakeId,
    target_source_record_id: result.sourceRecordId,
    listing_import: draft.listingImport,
    listing_proposals: draft.listingProposals ?? [],
  });
  if (error) throw error;
}

function normalizeCandidate(value: unknown): ManualPropertyCandidate | null {
  if (!isRecord(value)) return null;
  const propertyId = stringValue(value.property_id);
  const displayAddress = stringValue(value.display_address);
  const updatedAt = stringValue(value.updated_at);
  if (!propertyId || !displayAddress || !updatedAt) return null;
  return {
    propertyId,
    propertyVersion: numberValue(value.property_version) ?? 1,
    displayAddress,
    city: stringValue(value.city),
    region: stringValue(value.region),
    postalCode: stringValue(value.postal_code),
    country: stringValue(value.country) ?? "US",
    matchReasons: stringArray(value.match_reasons),
    materialDifferences: stringArray(value.material_differences),
    activeDealCount: numberValue(value.active_deal_count) ?? 0,
    updatedAt,
  };
}

function normalizeManualIntakeResult(value: unknown): ManualIntakeResult | null {
  if (!isRecord(value)) return null;
  const intakeId = stringValue(value.intake_id);
  const dealId = stringValue(value.deal_id);
  const propertyId = stringValue(value.property_id);
  const dealPropertyId = stringValue(value.deal_property_id);
  const sourceRecordId = stringValue(value.source_record_id);
  const idempotencyKeyOut = stringValue(value.idempotency_key_out);
  if (!intakeId || !dealId || !propertyId || !dealPropertyId || !sourceRecordId || !idempotencyKeyOut) return null;
  return {
    intakeId,
    intakeState: stringValue(value.intake_state) ?? "complete",
    propertyId,
    propertyVersion: numberValue(value.property_version) ?? 1,
    dealId,
    dealVersion: numberValue(value.deal_version) ?? 1,
    dealPropertyId,
    sourceRecordId,
    idempotencyKeyOut,
  };
}

function normalizeListingImport(value: unknown): ListingUrlImportResult | undefined {
  if (!isRecord(value)) return undefined;
  const originalUrl = stringValue(value.originalUrl);
  const normalizedUrl = stringValue(value.normalizedUrl);
  if (!originalUrl || !normalizedUrl) return undefined;
  const supportLevel = value.supportLevel === "supported" || value.supportLevel === "limited" || value.supportLevel === "unsupported" ? value.supportLevel : "unsupported";
  const status = value.status === "complete" || value.status === "partially_complete" || value.status === "failed" || value.status === "unsupported" ? value.status : "failed";
  return {
    originalUrl,
    normalizedUrl,
    sourceKey: stringValue(value.sourceKey) ?? "unknown",
    sourceDisplayName: stringValue(value.sourceDisplayName) ?? "Unsupported source",
    supportLevel,
    retrievalMethod: stringValue(value.retrievalMethod) ?? "none",
    adapterVersion: stringValue(value.adapterVersion) ?? "unknown",
    status,
    retrievedAt: stringValue(value.retrievedAt) ?? new Date().toISOString(),
    safeMessage: stringValue(value.safeMessage) ?? "BRIX saved the URL and left missing facts blank.",
    licensingNotes: stringValue(value.licensingNotes) ?? "Only permitted source metadata and user-provided values are retained.",
    sourceClassification: classificationForManualDraft({ sourceUrl: normalizedUrl }),
    proposals: Array.isArray(value.proposals) ? value.proposals.map(normalizeListingProposal).filter(isListingProposal) : [],
  };
}

function normalizeListingProposal(value: unknown): ListingUrlProposal | null {
  if (!isRecord(value)) return null;
  const id = stringValue(value.id);
  const field = value.field === "address" || value.field === "city" || value.field === "region" || value.field === "postal_code" || value.field === "property_type" || value.field === "asking_price" ? value.field : undefined;
  const normalizedValue = stringValue(value.normalizedValue);
  if (!id || !field || !normalizedValue) return null;
  const status = value.status === "accepted" || value.status === "rejected" || value.status === "edited" || value.status === "deferred" || value.status === "conflicted" || value.status === "superseded" ? value.status : "pending";
  return {
    id,
    field,
    label: stringValue(value.label) ?? field,
    rawValue: stringValue(value.rawValue) ?? normalizedValue,
    normalizedValue,
    displayValue: stringValue(value.displayValue) ?? normalizedValue,
    classification: value.classification === "external_estimate" || value.classification === "unknown" ? value.classification : "source_backed_candidate",
    verificationState: "unverified",
    confidence: numberValue(value.confidence) ?? 50,
    status,
    sourceKey: stringValue(value.sourceKey) ?? "unknown",
    evidenceRule: stringValue(value.evidenceRule) ?? "URL-derived candidate value",
  };
}

function normalizeFileEvidenceImport(value: unknown): FileEvidenceImportResult | undefined {
  try {
    return normalizeFileEvidenceImportResult(value);
  } catch {
    return undefined;
  }
}

function normalizeEmailImport(value: unknown): EmailIntakeImportResult | undefined {
  try {
    return normalizeEmailIntakeImportResult(value);
  } catch {
    return undefined;
  }
}

function normalizeFileEvidenceProposal(value: unknown): FileEvidenceProposal | null {
  const proposal = normalizeListingProposal(value);
  if (!proposal || !isRecord(value)) return proposal;
  return {
    ...proposal,
    sourceAnchor: jsonRecord(value.sourceAnchor),
    extractorVersion: stringValue(value.extractorVersion),
    unit: stringValue(value.unit),
    currency: stringValue(value.currency),
  };
}

function isListingProposal(value: ListingUrlProposal | null): value is ListingUrlProposal {
  return value !== null;
}

function isFileEvidenceProposal(value: FileEvidenceProposal | null): value is FileEvidenceProposal {
  return value !== null;
}

function numericString(value?: string) {
  if (!value?.trim()) return null;
  const cleaned = value.replace(/[$,]/g, "").trim();
  return Number.isFinite(Number(cleaned)) ? cleaned : null;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;
  const cleaned = value.replace(/[$,]/g, "").trim();
  if (!cleaned) return undefined;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonRecord(value: unknown): Record<string, Json> | undefined {
  if (!isRecord(value)) return undefined;
  const entries = Object.entries(value).filter((entry): entry is [string, Json] => isJson(entry[1]));
  return entries.length ? Object.fromEntries(entries) : undefined;
}

function isJson(value: unknown): value is Json {
  if (value === null) return true;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.every(isJson);
  if (!isRecord(value)) return false;
  return Object.values(value).every(isJson);
}

function isCandidate(value: ManualPropertyCandidate | null): value is ManualPropertyCandidate {
  return value !== null;
}
