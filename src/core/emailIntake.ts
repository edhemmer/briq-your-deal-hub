import { createDuplicateDetectionRequest } from "./duplicateDetection";
import { classificationForEmailAttachment, classificationForEmailSource } from "./sourceClassification";
import { invokeBrixFunction, supabase } from "./supabase";
import type { FileEvidenceProposal, ListingProposalStatus, ManualIntakeDraft, EmailIntakeImportResult, EmailAttachmentImportResult } from "./types";

type UnknownRecord = Record<string, unknown>;

const proposalStatuses: ListingProposalStatus[] = ["pending", "accepted", "rejected", "edited", "deferred", "conflicted", "superseded"];
const proposalFields = ["address", "city", "region", "postal_code", "property_type", "asking_price"] as const;

export async function importEmailSource(workspaceId: string, input: { emailText?: string; file?: File }): Promise<EmailIntakeImportResult> {
  const emailText = input.emailText?.trim();
  let payload: Record<string, unknown> = { workspaceId };
  if (input.file) {
    const bytes = new Uint8Array(await input.file.arrayBuffer());
    validateEmailInput(input.file.name, bytes, emailText);
    payload = {
      ...payload,
      fileName: input.file.name,
      declaredMimeType: input.file.type || undefined,
      contentBase64: bytesToBase64(bytes),
    };
  } else {
    validateEmailInput("pasted-email.txt", new TextEncoder().encode(emailText ?? ""), emailText);
    payload = { ...payload, emailText };
  }
  const result = await invokeBrixFunction<unknown>("process-email-intake", payload);
  return normalizeEmailIntakeImportResult(result);
}

export function validateEmailInput(fileName: string, bytes: Uint8Array, emailText?: string) {
  if (emailText?.trim()) return true;
  if (!fileName.trim()) throw new Error("Choose an email file with a usable name.");
  if (bytes.byteLength === 0) throw new Error("Choose an email file that is not empty.");
  if (bytes.byteLength > 5 * 1024 * 1024) throw new Error("Choose an email file that is 5 MB or smaller.");
  const extension = fileName.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  if (!["eml", "msg", "txt"].includes(extension)) throw new Error("Use pasted email text, .eml, .msg, or raw MIME text.");
  return true;
}

export function attachEmailImportToDraft(draft: ManualIntakeDraft, emailImport: EmailIntakeImportResult): ManualIntakeDraft {
  return {
    ...draft,
    emailImport,
    emailProposals: emailImport.proposals,
    updatedAt: new Date().toISOString(),
  };
}

export function applyEmailProposal(draft: ManualIntakeDraft, proposalId: string, status: ListingProposalStatus): ManualIntakeDraft {
  const proposals = (draft.emailProposals ?? []).map((proposal) => proposal.id === proposalId ? { ...proposal, status } : proposal);
  const accepted = proposals.find((proposal) => proposal.id === proposalId && (proposal.status === "accepted" || proposal.status === "edited"));
  const nextDraft = accepted ? applyAcceptedProposal({ ...draft, emailProposals: proposals }, accepted) : { ...draft, emailProposals: proposals };
  return { ...nextDraft, updatedAt: new Date().toISOString() };
}

export function emailProposalSummary(proposals?: FileEvidenceProposal[]) {
  const list = proposals ?? [];
  return {
    pending: list.filter((proposal) => proposal.status === "pending").length,
    accepted: list.filter((proposal) => proposal.status === "accepted" || proposal.status === "edited").length,
    rejected: list.filter((proposal) => proposal.status === "rejected").length,
    deferred: list.filter((proposal) => proposal.status === "deferred").length,
  };
}

export function createEmailSourceDuplicateRequest(workspaceId: string, emailImport: EmailIntakeImportResult) {
  return createDuplicateDetectionRequest({
    workspaceId,
    subjectType: "email_source",
    identity: {
      canonicalId: emailImport.emailSourceId,
      intakeId: emailImport.intakeId,
      sourceRecordId: emailImport.sourceRecordId,
      messageId: emailImport.messageId,
      bodyHash: emailImport.bodyHash,
      attachmentHashes: emailImport.attachments.map((attachment) => attachment.contentHash).filter((hash): hash is string => Boolean(hash)),
    },
  });
}

export async function attachEmailSourceToDeal(workspaceId: string, result: { dealId: string; propertyId: string }, emailImport: EmailIntakeImportResult) {
  const rpc = supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: Error | null }>;
  const { error } = await rpc("attach_email_source_to_deal", {
    target_workspace_id: workspaceId,
    target_email_source_id: emailImport.emailSourceId,
    target_intake_id: emailImport.intakeId,
    target_deal_id: result.dealId,
    target_property_id: result.propertyId,
  });
  if (error) throw error;
}

export function normalizeEmailIntakeImportResult(value: unknown): EmailIntakeImportResult {
  if (!isRecord(value)) throw new Error("BRIX could not read the email intake response.");
  const intakeId = stringValue(value.intakeId);
  const sourceRecordId = stringValue(value.sourceRecordId);
  const emailSourceId = stringValue(value.emailSourceId);
  const bodyHash = stringValue(value.bodyHash);
  if (!intakeId || !sourceRecordId || !emailSourceId || !bodyHash) throw new Error("BRIX could not confirm the email source record.");
  return {
    intakeId,
    sourceRecordId,
    emailSourceId,
    duplicateOfEmailSourceId: stringValue(value.duplicateOfEmailSourceId),
    jobId: stringValue(value.jobId),
    status: value.status === "duplicate" || value.status === "partially_complete" || value.status === "failed" ? value.status : "complete",
    safeMessage: stringValue(value.safeMessage) ?? "Email source saved.",
    subject: stringValue(value.subject),
    fromAddress: stringValue(value.fromAddress),
    toAddresses: stringArray(value.toAddresses),
    ccAddresses: stringArray(value.ccAddresses),
    bccAddresses: stringArray(value.bccAddresses),
    replyToAddress: stringValue(value.replyToAddress),
    messageId: stringValue(value.messageId),
    threadId: stringValue(value.threadId),
    sentAt: stringValue(value.sentAt),
    bodyHash,
    receivedHeaderCount: numberValue(value.receivedHeaderCount) ?? 0,
    attachmentCount: numberValue(value.attachmentCount) ?? 0,
    importedAt: stringValue(value.importedAt) ?? new Date().toISOString(),
    sourceClassification: classificationForEmailSource({
      subject: stringValue(value.subject),
      originalFilename: stringValue(value.originalFilename),
      declaredMimeType: stringValue(value.detectedMimeType),
    }),
    attachments: Array.isArray(value.attachments) ? value.attachments.map(normalizeAttachment).filter(isAttachment) : [],
    proposals: Array.isArray(value.proposals) ? value.proposals.map(normalizeEmailProposal).filter(isEmailProposal) : [],
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

function normalizeEmailProposal(value: unknown): FileEvidenceProposal | null {
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
    sourceKey: stringValue(value.sourceKey) ?? "email_source",
    evidenceRule: stringValue(value.evidenceRule) ?? "Email-derived candidate value",
    sourceAnchor: jsonRecord(value.sourceAnchor),
    extractorVersion: stringValue(value.extractorVersion),
    unit: stringValue(value.unit),
    currency: stringValue(value.currency),
  };
}

function normalizeAttachment(value: unknown): EmailAttachmentImportResult | null {
  if (!isRecord(value)) return null;
  const attachmentId = stringValue(value.attachmentId);
  const originalFilename = stringValue(value.originalFilename);
  if (!attachmentId || !originalFilename) return null;
  const status = value.status === "duplicate" || value.status === "rejected" || value.status === "metadata_only" ? value.status : "imported";
  return {
    attachmentId,
    evidenceId: stringValue(value.evidenceId),
    originalFilename,
    detectedMimeType: stringValue(value.detectedMimeType),
    byteSize: numberValue(value.byteSize),
    contentHash: stringValue(value.contentHash),
    status,
    safeMessage: stringValue(value.safeMessage) ?? "Attachment recorded.",
    sourceClassification: classificationForEmailAttachment({ originalFilename, detectedMimeType: stringValue(value.detectedMimeType) }),
  };
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) binary += String.fromCharCode(...bytes.slice(index, index + chunkSize));
  return btoa(binary);
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

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()) : [];
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonRecord(value: unknown): Record<string, string | number | boolean | null> | undefined {
  if (!isRecord(value)) return undefined;
  const entries = Object.entries(value).filter((entry): entry is [string, string | number | boolean | null] => entry[1] === null || ["string", "number", "boolean"].includes(typeof entry[1]));
  return entries.length ? Object.fromEntries(entries) : undefined;
}

function isEmailProposal(value: FileEvidenceProposal | null): value is FileEvidenceProposal {
  return value !== null;
}

function isAttachment(value: EmailAttachmentImportResult | null): value is EmailAttachmentImportResult {
  return value !== null;
}
