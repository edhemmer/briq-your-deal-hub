import { createDuplicateDetectionRequest } from "./duplicateDetection";
import { invokeBrixFunction, supabase } from "./supabase";
import type { Json } from "./supabaseDatabase.types";
import type { FileEvidenceImportResult, FileEvidenceProposal, FileEvidenceStatus, FileEvidenceType, ListingProposalStatus, ManualIntakeDraft } from "./types";

type UnknownRecord = Record<string, unknown>;

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const supportedMimes = [
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
const proposalStatuses: ListingProposalStatus[] = ["pending", "accepted", "rejected", "edited", "deferred", "conflicted", "superseded"];
const proposalFields = ["address", "city", "region", "postal_code", "property_type", "asking_price"] as const;

export async function importEvidenceFile(workspaceId: string, file: File): Promise<FileEvidenceImportResult> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  validateEvidenceFile(file.name, file.type, bytes);
  const contentBase64 = bytesToBase64(bytes);
  const result = await invokeBrixFunction<unknown>("process-evidence-upload", {
    workspaceId,
    fileName: file.name,
    declaredMimeType: file.type || undefined,
    contentBase64,
  });
  return normalizeFileEvidenceImportResult(result);
}

export function validateEvidenceFile(fileName: string, declaredMimeType: string | undefined, bytes: Uint8Array) {
  if (!fileName.trim()) throw new Error("Choose a file with a usable name.");
  if (bytes.byteLength === 0) throw new Error("Choose a file that is not empty.");
  if (bytes.byteLength > MAX_FILE_BYTES) throw new Error("Choose a file that is 5 MB or smaller.");
  const extension = fileName.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  if (["exe", "js", "mjs", "cjs", "html", "htm", "svg", "zip", "rar", "7z", "mp4", "mov", "mp3", "wav", "heic", "heif", "xlsm", "docm"].includes(extension)) {
    throw new Error("That file type is not supported for Evidence intake.");
  }
  const declared = declaredMimeType?.toLowerCase();
  if (declared && !supportedMimes.includes(declared as typeof supportedMimes[number]) && !["", "application/octet-stream"].includes(declared)) {
    throw new Error("That file type is not supported for Evidence intake.");
  }
  return true;
}

export function attachFileEvidenceToDraft(draft: ManualIntakeDraft, fileImport: FileEvidenceImportResult): ManualIntakeDraft {
  return {
    ...draft,
    fileEvidenceImport: fileImport,
    fileEvidenceProposals: fileImport.proposals,
    updatedAt: new Date().toISOString(),
  };
}

export function applyFileEvidenceProposal(draft: ManualIntakeDraft, proposalId: string, status: ListingProposalStatus): ManualIntakeDraft {
  const proposals = (draft.fileEvidenceProposals ?? []).map((proposal) => proposal.id === proposalId ? { ...proposal, status } : proposal);
  const accepted = proposals.find((proposal) => proposal.id === proposalId && (proposal.status === "accepted" || proposal.status === "edited"));
  const nextDraft = accepted ? applyAcceptedProposal({ ...draft, fileEvidenceProposals: proposals }, accepted) : { ...draft, fileEvidenceProposals: proposals };
  return { ...nextDraft, updatedAt: new Date().toISOString() };
}

export function fileEvidenceProposalSummary(proposals?: FileEvidenceProposal[]) {
  const list = proposals ?? [];
  return {
    pending: list.filter((proposal) => proposal.status === "pending").length,
    accepted: list.filter((proposal) => proposal.status === "accepted" || proposal.status === "edited").length,
    rejected: list.filter((proposal) => proposal.status === "rejected").length,
    deferred: list.filter((proposal) => proposal.status === "deferred").length,
  };
}

export function createFileEvidenceDuplicateRequest(workspaceId: string, fileImport: FileEvidenceImportResult) {
  return createDuplicateDetectionRequest({
    workspaceId,
    subjectType: "evidence",
    identity: {
      canonicalId: fileImport.evidenceId,
      evidenceId: fileImport.evidenceId,
      intakeId: fileImport.intakeId,
      sourceRecordId: fileImport.sourceRecordId,
      contentHash: fileImport.contentHash,
    },
  });
}

export async function attachFileEvidenceToDeal(workspaceId: string, result: { dealId: string; propertyId: string }, fileImport: FileEvidenceImportResult) {
  const rpc = supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: Error | null }>;
  const { error } = await rpc("attach_file_evidence_to_deal", {
    target_workspace_id: workspaceId,
    target_evidence_id: fileImport.evidenceId,
    target_intake_id: fileImport.intakeId,
    target_deal_id: result.dealId,
    target_property_id: result.propertyId,
  });
  if (error) throw error;
}

export function normalizeFileEvidenceImportResult(value: unknown): FileEvidenceImportResult {
  if (!isRecord(value)) throw new Error("BRIX could not read the Evidence upload response.");
  const evidenceId = stringValue(value.evidenceId);
  const intakeId = stringValue(value.intakeId);
  const sourceRecordId = stringValue(value.sourceRecordId);
  const originalFilename = stringValue(value.originalFilename);
  const sanitizedFilename = stringValue(value.sanitizedFilename);
  const detectedMimeType = stringValue(value.detectedMimeType);
  const contentHash = stringValue(value.contentHash);
  if (!evidenceId || !intakeId || !sourceRecordId || !originalFilename || !sanitizedFilename || !detectedMimeType || !contentHash) {
    throw new Error("BRIX could not confirm the Evidence record.");
  }
  const status = normalizeStatus(value.status);
  const evidenceType = normalizeEvidenceType(value.evidenceType);
  const extractionStatus = value.extractionStatus === "not_started" || value.extractionStatus === "complete" || value.extractionStatus === "partially_complete" || value.extractionStatus === "unsupported" || value.extractionStatus === "failed"
    ? value.extractionStatus
    : "unsupported";
  return {
    evidenceId,
    intakeId,
    sourceRecordId,
    jobId: stringValue(value.jobId),
    duplicateOfEvidenceId: stringValue(value.duplicateOfEvidenceId),
    status,
    safeMessage: stringValue(value.safeMessage) ?? "Evidence saved.",
    originalFilename,
    sanitizedFilename,
    detectedMimeType,
    evidenceType,
    byteSize: numberValue(value.byteSize) ?? 0,
    contentHash,
    uploadedAt: stringValue(value.uploadedAt) ?? new Date().toISOString(),
    extractionStatus,
    proposals: Array.isArray(value.proposals) ? value.proposals.map(normalizeFileProposal).filter(isFileProposal) : [],
  };
}

function applyAcceptedProposal(draft: ManualIntakeDraft, proposal: FileEvidenceProposal): ManualIntakeDraft {
  switch (proposal.field) {
    case "address": return draft.address.trim() ? draft : { ...draft, address: proposal.normalizedValue };
    case "city": return draft.city?.trim() ? draft : { ...draft, city: proposal.normalizedValue };
    case "region": return draft.region?.trim() ? draft : { ...draft, region: proposal.normalizedValue.toUpperCase() };
    case "postal_code": return draft.postalCode?.trim() ? draft : { ...draft, postalCode: proposal.normalizedValue };
    case "property_type": return draft.propertyType?.trim() ? draft : { ...draft, propertyType: proposal.normalizedValue };
    case "asking_price": return draft.askingPrice?.trim() ? draft : { ...draft, askingPrice: proposal.normalizedValue };
  }
}

function normalizeFileProposal(value: unknown): FileEvidenceProposal | null {
  if (!isRecord(value)) return null;
  const id = stringValue(value.id);
  const field = proposalFields.includes(value.field as FileEvidenceProposal["field"]) ? value.field as FileEvidenceProposal["field"] : undefined;
  const normalizedValue = stringValue(value.normalizedValue);
  if (!id || !field || !normalizedValue) return null;
  const status = proposalStatuses.includes(value.status as ListingProposalStatus) ? value.status as ListingProposalStatus : "pending";
  return {
    id,
    field,
    label: stringValue(value.label) ?? field,
    rawValue: stringValue(value.rawValue) ?? normalizedValue,
    normalizedValue,
    displayValue: stringValue(value.displayValue) ?? normalizedValue,
    classification: value.classification === "external_estimate" || value.classification === "unknown" ? value.classification : "source_backed_candidate",
    verificationState: "unverified",
    confidence: clampNumber(value.confidence, 0, 100) ?? 50,
    status,
    sourceKey: stringValue(value.sourceKey) ?? "file_evidence",
    evidenceRule: stringValue(value.evidenceRule) ?? "Evidence-derived candidate value",
    sourceAnchor: jsonRecord(value.sourceAnchor),
    extractorVersion: stringValue(value.extractorVersion),
    unit: stringValue(value.unit),
    currency: stringValue(value.currency),
  };
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(index, index + chunkSize));
  }
  return btoa(binary);
}

function normalizeStatus(value: unknown): FileEvidenceStatus {
  return value === "duplicate" || value === "complete" || value === "partially_complete" || value === "failed" || value === "unsupported" ? value : "preserved";
}

function normalizeEvidenceType(value: unknown): FileEvidenceType {
  return value === "image" || value === "document" ? value : "file";
}

function clampNumber(value: unknown, min: number, max: number) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(min, Math.min(max, parsed));
}

function numberValue(value: unknown) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
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

function isFileProposal(value: FileEvidenceProposal | null): value is FileEvidenceProposal {
  return value !== null;
}
