import { createDuplicateDetectionRequest } from "./duplicateDetection";
import { createManualFallbackPlan } from "./manualFallback";
import { createManualIntakeDraft, saveManualIntakeDraft } from "./propertyIntake";
import { classifySource, type SourceClassificationResult } from "./sourceClassification";
import type { ManualIntakeDraft } from "./types";

type UnknownRecord = Record<string, unknown>;

export const SHARED_INTAKE_SCHEMA_VERSION = 1;
export const SHARED_INTAKE_STORAGE_PREFIX = "brix.sharedIntake.";
export const SHARED_INTAKE_MAX_TEXT_CHARS = 8_000;
export const SHARED_INTAKE_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const SHARED_INTAKE_DEEP_LINK_PREFIX = "/share-intake";

export const sharedIntakeContentTypes = ["url", "text", "file", "image", "email_file", "mixed_url_text"] as const;
export const sharedIntakeStatuses = [
  "received_locally",
  "awaiting_app_open",
  "importing",
  "awaiting_authentication",
  "awaiting_workspace",
  "awaiting_review",
  "queued",
  "syncing",
  "complete",
  "failed",
  "conflicted",
  "cancelled",
  "expired",
] as const;

export type SharedIntakeContentType = typeof sharedIntakeContentTypes[number];
export type SharedIntakeStatus = typeof sharedIntakeStatuses[number];
export type SharedIntakePlatform = "ios" | "ipados" | "web" | "unknown";
export type SharedIntakeRoute = "listing_url" | "file_evidence" | "email_intake" | "manual_review";
export type SharedIntakeSafeErrorCategory =
  | "none"
  | "unsupported"
  | "oversized"
  | "invalid_mime"
  | "malformed"
  | "authentication"
  | "workspace"
  | "permission"
  | "offline"
  | "expired"
  | "conflict"
  | "storage"
  | "server";

export type SharedIntakeFileReference = {
  localReference: string;
  originalFilename: string;
  declaredMimeType?: string;
  detectedMimeType?: string;
  byteSize?: number;
  contentHash?: string;
};

export type SharedIntakeResult = {
  intakeId?: string;
  evidenceId?: string;
  sourceRecordId?: string;
  propertyId?: string;
  dealId?: string;
};

export type SharedIntakePayload = {
  version: 1;
  handoffId: string;
  sourcePlatform: SharedIntakePlatform;
  sourceApplicationName?: string;
  sourceApplicationIdentifier?: string;
  contentType: SharedIntakeContentType;
  originalUrl?: string;
  normalizedUrl?: string;
  originalText?: string;
  file?: SharedIntakeFileReference;
  createdAt: string;
  receivedAt?: string;
  authenticatedUserId?: string;
  workspaceId?: string;
  intendedDealId?: string;
  intendedPropertyId?: string;
  idempotencyKey: string;
  payloadHash: string;
  status: SharedIntakeStatus;
  result?: SharedIntakeResult;
  sourceClassification: SourceClassificationResult;
  safeErrorCategory: SharedIntakeSafeErrorCategory;
};

export type SharedIntakeInput = {
  sourcePlatform?: SharedIntakePlatform;
  sourceApplicationName?: string;
  sourceApplicationIdentifier?: string;
  url?: string;
  text?: string;
  file?: SharedIntakeFileReference;
  authenticatedUserId?: string;
  workspaceId?: string;
  intendedDealId?: string;
  intendedPropertyId?: string;
  now?: string;
};

export type SharedIntakeReview = {
  handoffId: string;
  contentType: SharedIntakeContentType;
  status: SharedIntakeStatus;
  selectedRoute: SharedIntakeRoute;
  displayTitle: string;
  sourceApplication?: string;
  primarySource?: string;
  localOnly: boolean;
  nextAction: "sign_in" | "select_workspace" | "review" | "retry" | "open_result" | "none";
  statusMessage: string;
  actions: Array<"create_new_deal" | "attach_existing_deal" | "continue_manually" | "cancel" | "retry" | "open_result">;
};

export const supportedSharedMimeTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "message/rfc822",
  "text/plain",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const nativeShareActivationRules = {
  maxUrls: 1,
  maxTextItems: 1,
  maxFiles: 1,
  maxImages: 1,
  supportsText: true,
  supportsUrl: true,
  supportsEmailFile: true,
  rejectedKinds: ["video", "audio", "executable", "script", "archive", "multiple_unrelated_files"],
  appGroupIdentifier: "group.BrixRE.BRIX-Real-Estate",
  mainAppUrlScheme: "brixrealestate",
} as const;

const statusTransitions: Record<SharedIntakeStatus, SharedIntakeStatus[]> = {
  received_locally: ["awaiting_app_open", "awaiting_authentication", "awaiting_workspace", "awaiting_review", "cancelled", "expired", "failed"],
  awaiting_app_open: ["awaiting_authentication", "awaiting_workspace", "awaiting_review", "cancelled", "expired", "failed"],
  importing: ["awaiting_review", "queued", "complete", "failed", "conflicted", "expired"],
  awaiting_authentication: ["awaiting_workspace", "awaiting_review", "cancelled", "expired", "failed"],
  awaiting_workspace: ["awaiting_review", "cancelled", "expired", "failed"],
  awaiting_review: ["queued", "importing", "cancelled", "expired", "failed", "conflicted"],
  queued: ["syncing", "cancelled", "expired", "failed"],
  syncing: ["complete", "failed", "conflicted"],
  complete: [],
  failed: ["queued", "awaiting_review", "cancelled", "expired"],
  conflicted: ["awaiting_review", "queued", "cancelled", "expired"],
  cancelled: [],
  expired: [],
};

export function createSharedIntakePayload(input: SharedIntakeInput): SharedIntakePayload {
  const now = input.now ?? new Date().toISOString();
  const originalText = sanitizeText(input.text);
  const urlFromInput = stringValue(input.url) ?? extractFirstUrl(originalText);
  const normalizedUrl = urlFromInput ? normalizeSharedUrl(urlFromInput) : undefined;
  const file = normalizeFileReference(input.file);
  const contentType = detectSharedContentType({ text: originalText, normalizedUrl, file });
  const handoffId = `share_${safeRandomId()}`;
  const payloadBasis = {
    contentType,
    normalizedUrl,
    textHash: originalText ? stableHash(originalText) : undefined,
    fileHash: file?.contentHash ?? stableHash(`${file?.originalFilename ?? ""}:${file?.declaredMimeType ?? ""}:${file?.byteSize ?? ""}`),
    intendedDealId: stringValue(input.intendedDealId),
    intendedPropertyId: stringValue(input.intendedPropertyId),
  };
  const payloadHash = stableHash(stableSerialize(payloadBasis));
  const sourceClassification = classifySharedIntakeSource({ contentType, normalizedUrl, file });
  const payload: SharedIntakePayload = {
    version: SHARED_INTAKE_SCHEMA_VERSION,
    handoffId,
    sourcePlatform: input.sourcePlatform ?? "unknown",
    sourceApplicationName: safeLabel(input.sourceApplicationName),
    sourceApplicationIdentifier: safeIdentifier(input.sourceApplicationIdentifier),
    contentType,
    originalUrl: urlFromInput,
    normalizedUrl,
    originalText,
    file,
    createdAt: now,
    receivedAt: now,
    authenticatedUserId: safeIdentifier(input.authenticatedUserId),
    workspaceId: safeIdentifier(input.workspaceId),
    intendedDealId: safeIdentifier(input.intendedDealId),
    intendedPropertyId: safeIdentifier(input.intendedPropertyId),
    idempotencyKey: `share-intake:${payloadHash}`,
    payloadHash,
    status: "received_locally",
    sourceClassification,
    safeErrorCategory: "none",
  };
  validateSharedIntakePayload(payload);
  return payload;
}

export function parseSharedIntakePayload(serialized: string): SharedIntakePayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new Error("Shared intake payload is malformed.");
  }
  const payload = normalizeSharedIntakePayload(parsed);
  if (!payload) throw new Error("Shared intake payload is malformed.");
  return payload;
}

export function serializeSharedIntakePayload(payload: SharedIntakePayload) {
  validateSharedIntakePayload(payload);
  return stableSerialize(payload);
}

export function normalizeSharedIntakePayload(value: unknown): SharedIntakePayload | null {
  if (!isRecord(value) || value.version !== SHARED_INTAKE_SCHEMA_VERSION) return null;
  const handoffId = safeHandoffId(value.handoffId);
  const contentType = sharedIntakeContentTypes.includes(value.contentType as SharedIntakeContentType) ? value.contentType as SharedIntakeContentType : undefined;
  const status = sharedIntakeStatuses.includes(value.status as SharedIntakeStatus) ? value.status as SharedIntakeStatus : undefined;
  const createdAt = stringValue(value.createdAt);
  const idempotencyKey = stringValue(value.idempotencyKey);
  const payloadHash = stringValue(value.payloadHash);
  if (!handoffId || !contentType || !status || !createdAt || !idempotencyKey || !payloadHash) return null;
  const payload: SharedIntakePayload = {
    version: 1,
    handoffId,
    sourcePlatform: value.sourcePlatform === "ios" || value.sourcePlatform === "ipados" || value.sourcePlatform === "web" ? value.sourcePlatform : "unknown",
    sourceApplicationName: safeLabel(value.sourceApplicationName),
    sourceApplicationIdentifier: safeIdentifier(value.sourceApplicationIdentifier),
    contentType,
    originalUrl: stringValue(value.originalUrl),
    normalizedUrl: stringValue(value.normalizedUrl),
    originalText: sanitizeText(value.originalText),
    file: normalizeFileReference(value.file),
    createdAt,
    receivedAt: stringValue(value.receivedAt),
    authenticatedUserId: safeIdentifier(value.authenticatedUserId),
    workspaceId: safeIdentifier(value.workspaceId),
    intendedDealId: safeIdentifier(value.intendedDealId),
    intendedPropertyId: safeIdentifier(value.intendedPropertyId),
    idempotencyKey,
    payloadHash,
    status,
    result: normalizeResult(value.result),
    sourceClassification: classifySharedIntakeSource({ contentType, normalizedUrl: stringValue(value.normalizedUrl), file: normalizeFileReference(value.file) }),
    safeErrorCategory: isSafeError(value.safeErrorCategory) ? value.safeErrorCategory : "none",
  };
  try {
    validateSharedIntakePayload(payload);
    return payload;
  } catch {
    return null;
  }
}

export function validateSharedIntakePayload(payload: SharedIntakePayload) {
  if (payload.version !== SHARED_INTAKE_SCHEMA_VERSION) throw new Error("Unsupported shared intake schema.");
  if (!safeHandoffId(payload.handoffId)) throw new Error("Shared intake handoff identity is invalid.");
  if (!sharedIntakeContentTypes.includes(payload.contentType)) throw new Error("Shared intake content type is unsupported.");
  if (!sharedIntakeStatuses.includes(payload.status)) throw new Error("Shared intake status is unsupported.");
  if (/token|password|authorization|service_role|apikey|api_key/i.test(stableSerialize(redactedDiagnostics(payload)))) {
    throw new Error("Shared intake payload contains sensitive diagnostic fields.");
  }
  if (payload.originalText && payload.originalText.length > SHARED_INTAKE_MAX_TEXT_CHARS) throw new Error("Shared text is too large.");
  if (payload.file) validateSharedFileReference(payload.file, payload.contentType);
  if (payload.contentType === "url" && !payload.normalizedUrl) throw new Error("Shared URL is missing.");
  if (payload.contentType === "mixed_url_text" && (!payload.normalizedUrl || !payload.originalText)) throw new Error("Shared URL and text are incomplete.");
  if (payload.contentType === "text" && !payload.originalText) throw new Error("Shared text is missing.");
}

export function transitionSharedIntake(payload: SharedIntakePayload, nextStatus: SharedIntakeStatus, now = new Date().toISOString()): SharedIntakePayload {
  if (!statusTransitions[payload.status].includes(nextStatus)) {
    throw new Error(`Invalid shared intake transition from ${payload.status} to ${nextStatus}.`);
  }
  return {
    ...payload,
    status: nextStatus,
    receivedAt: payload.receivedAt ?? now,
  };
}

export function routeSharedIntakePayload(payload: SharedIntakePayload): SharedIntakeRoute {
  if (payload.contentType === "url" || payload.contentType === "mixed_url_text") return "listing_url";
  if (payload.contentType === "image" || payload.contentType === "file") return "file_evidence";
  if (payload.contentType === "email_file") return "email_intake";
  return "manual_review";
}

export function classifySharedIntakeSource(input: { contentType: SharedIntakeContentType; normalizedUrl?: string; file?: SharedIntakeFileReference }) {
  if (input.contentType === "url" || input.contentType === "mixed_url_text") {
    return classifySource({ sourceType: "listing_url", sourceUrl: input.normalizedUrl });
  }
  if (input.contentType === "email_file") {
    return classifySource({ sourceType: "email", originalFilename: input.file?.originalFilename, declaredMimeType: input.file?.declaredMimeType, detectedMimeType: input.file?.detectedMimeType });
  }
  if (input.contentType === "image") {
    return classifySource({ sourceType: "image", originalFilename: input.file?.originalFilename, declaredMimeType: input.file?.declaredMimeType, detectedMimeType: input.file?.detectedMimeType, evidenceType: "image" });
  }
  if (input.contentType === "file") {
    return classifySource({ sourceType: "file", originalFilename: input.file?.originalFilename, declaredMimeType: input.file?.declaredMimeType, detectedMimeType: input.file?.detectedMimeType });
  }
  return classifySource({ sourceType: "manual", sourceName: "shared text" });
}

export function scopeSharedIntakeForReview(payload: SharedIntakePayload, scope: { userId?: string | null; workspaceId?: string | null }): SharedIntakePayload {
  if (!scope.userId) return { ...payload, status: "awaiting_authentication", authenticatedUserId: undefined, workspaceId: undefined };
  if (!scope.workspaceId) return { ...payload, status: "awaiting_workspace", authenticatedUserId: scope.userId, workspaceId: undefined };
  return { ...payload, status: "awaiting_review", authenticatedUserId: scope.userId, workspaceId: scope.workspaceId };
}

export function createSharedIntakeReview(payload: SharedIntakePayload): SharedIntakeReview {
  const selectedRoute = routeSharedIntakePayload(payload);
  const primarySource = payload.normalizedUrl ?? payload.file?.originalFilename ?? (payload.originalText ? "Shared text" : undefined);
  const sourceApplication = payload.sourceApplicationName ?? payload.sourceApplicationIdentifier;
  return {
    handoffId: payload.handoffId,
    contentType: payload.contentType,
    status: payload.status,
    selectedRoute,
    displayTitle: titleForRoute(selectedRoute),
    sourceApplication,
    primarySource,
    localOnly: !payload.result?.intakeId && payload.status !== "complete",
    nextAction: nextActionForStatus(payload),
    statusMessage: messageForStatus(payload),
    actions: actionsForStatus(payload),
  };
}

export function createSharedHandoffDuplicateRequest(workspaceId: string, payload: SharedIntakePayload) {
  return createDuplicateDetectionRequest({
    workspaceId,
    subjectType: "shared_handoff",
    identity: {
      handoffId: payload.handoffId,
      sourceUrl: payload.normalizedUrl,
      contentHash: payload.file?.contentHash ?? payload.payloadHash,
      idempotencyKey: payload.idempotencyKey,
    },
  });
}

export function sharedIntakeDeepLink(handoffId: string) {
  const safe = safeHandoffId(handoffId);
  if (!safe) throw new Error("Shared intake handoff identity is invalid.");
  return `${SHARED_INTAKE_DEEP_LINK_PREFIX}/${encodeURIComponent(safe)}`;
}

export function resolveSharedIntakeDeepLink(
  handoffId: string,
  loader: (id: string) => SharedIntakePayload | null,
  scope: { userId?: string | null; workspaceId?: string | null } = {},
) {
  const safe = safeHandoffId(handoffId);
  if (!safe) return { ok: false as const, reason: "malformed" as const };
  const payload = loader(safe);
  if (!payload) return { ok: false as const, reason: "unknown" as const };
  if (payload.status === "expired") return { ok: false as const, reason: "expired" as const };
  if (payload.status === "cancelled") return { ok: false as const, reason: "cancelled" as const };
  if (payload.workspaceId && scope.workspaceId && payload.workspaceId !== scope.workspaceId) return { ok: false as const, reason: "unauthorized" as const };
  if (payload.authenticatedUserId && scope.userId && payload.authenticatedUserId !== scope.userId) return { ok: false as const, reason: "unauthorized" as const };
  return { ok: true as const, payload };
}

export function saveSharedIntakeHandoff(payload: SharedIntakePayload, storage: Storage = localStorage) {
  validateSharedIntakePayload(payload);
  storage.setItem(`${SHARED_INTAKE_STORAGE_PREFIX}${payload.handoffId}`, serializeSharedIntakePayload(payload));
  return payload;
}

export function loadSharedIntakeHandoff(handoffId: string, storage: Storage = localStorage): SharedIntakePayload | null {
  const safe = safeHandoffId(handoffId);
  if (!safe) return null;
  const raw = storage.getItem(`${SHARED_INTAKE_STORAGE_PREFIX}${safe}`);
  if (!raw) return null;
  try {
    return parseSharedIntakePayload(raw);
  } catch {
    return null;
  }
}

export function removeSharedIntakeHandoff(handoffId: string, storage: Storage = localStorage) {
  const safe = safeHandoffId(handoffId);
  if (safe) storage.removeItem(`${SHARED_INTAKE_STORAGE_PREFIX}${safe}`);
}

export function prepareManualDraftFromSharedIntake(payload: SharedIntakePayload, storageScope: string): ManualIntakeDraft {
  const draft = createManualIntakeDraft();
  const route = routeSharedIntakePayload(payload);
  const notes = payload.originalText && route !== "listing_url" ? payload.originalText : undefined;
  const next: ManualIntakeDraft = {
    ...draft,
    opportunityName: payload.normalizedUrl ? "Shared listing" : payload.file?.originalFilename ?? "Shared property source",
    address: payload.normalizedUrl ?? payload.originalText ?? payload.file?.originalFilename ?? "",
    source: sourceLabel(payload),
    sourceUrl: payload.normalizedUrl,
    notes,
  };
  return saveManualIntakeDraft(storageScope, next);
}

export function createSharedIntakeManualFallback(payload: SharedIntakePayload, storageScope: string, workspaceId?: string) {
  return createManualFallbackPlan({
    workspaceId,
    source: "share_extension",
    draft: prepareManualDraftFromSharedIntake(payload, storageScope),
  });
}

export function sharedIntakeDiagnosticsEvent(
  event:
    | "intake.share_received"
    | "intake.share_import_started"
    | "intake.share_import_completed"
    | "intake.share_import_failed"
    | "intake.share_cancelled"
    | "intake.share_expired",
  payload: SharedIntakePayload,
) {
  return {
    event,
    handoffId: payload.handoffId,
    contentType: payload.contentType,
    status: payload.status,
    selectedRoute: routeSharedIntakePayload(payload),
    safeErrorCategory: payload.safeErrorCategory,
    workspaceId: payload.workspaceId,
    result: payload.result,
  };
}

export function redactedDiagnostics(payload: SharedIntakePayload) {
  return {
    handoffId: payload.handoffId,
    contentType: payload.contentType,
    status: payload.status,
    selectedRoute: routeSharedIntakePayload(payload),
    hasUrl: Boolean(payload.normalizedUrl),
    hasText: Boolean(payload.originalText),
    file: payload.file ? {
      originalFilename: payload.file.originalFilename,
      declaredMimeType: payload.file.declaredMimeType,
      detectedMimeType: payload.file.detectedMimeType,
      byteSize: payload.file.byteSize,
      contentHash: payload.file.contentHash,
    } : undefined,
    safeErrorCategory: payload.safeErrorCategory,
    workspaceId: payload.workspaceId,
    result: payload.result,
  };
}

function detectSharedContentType(input: { text?: string; normalizedUrl?: string; file?: SharedIntakeFileReference }): SharedIntakeContentType {
  if (input.file) {
    const mime = (input.file.detectedMimeType ?? input.file.declaredMimeType ?? "").toLowerCase();
    const extension = input.file.originalFilename.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
    if (extension === "eml" || mime === "message/rfc822") return "email_file";
    if (mime.startsWith("image/")) return "image";
    return "file";
  }
  if (input.normalizedUrl && input.text && input.text.replace(input.normalizedUrl, "").trim()) return "mixed_url_text";
  if (input.normalizedUrl) return "url";
  if (input.text) return "text";
  throw new Error("Share a URL, text, supported file, or supported image.");
}

function normalizeFileReference(value: unknown): SharedIntakeFileReference | undefined {
  if (!isRecord(value)) return undefined;
  const localReference = stringValue(value.localReference);
  const originalFilename = stringValue(value.originalFilename);
  if (!localReference || !originalFilename) return undefined;
  const file = {
    localReference,
    originalFilename,
    declaredMimeType: stringValue(value.declaredMimeType)?.toLowerCase(),
    detectedMimeType: stringValue(value.detectedMimeType)?.toLowerCase(),
    byteSize: numberValue(value.byteSize),
    contentHash: stringValue(value.contentHash),
  };
  validateSharedFileReference(file, detectFileContentType(file));
  return file;
}

function validateSharedFileReference(file: SharedIntakeFileReference, contentType: SharedIntakeContentType) {
  if (file.byteSize !== undefined && file.byteSize > SHARED_INTAKE_MAX_FILE_BYTES) throw new Error("Shared file is too large.");
  const extension = file.originalFilename.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  if (["exe", "js", "mjs", "cjs", "html", "htm", "svg", "zip", "rar", "7z", "mp4", "mov", "mp3", "wav", "heic", "heif", "xlsm", "docm"].includes(extension)) {
    throw new Error("Shared file type is unsupported.");
  }
  const mime = (file.detectedMimeType ?? file.declaredMimeType ?? "").toLowerCase();
  if (mime && !supportedSharedMimeTypes.includes(mime as typeof supportedSharedMimeTypes[number]) && mime !== "application/octet-stream") {
    throw new Error("Shared file MIME type is unsupported.");
  }
  if (contentType === "email_file" && extension !== "eml" && mime !== "message/rfc822") throw new Error("Shared email file must be a .eml source.");
}

function detectFileContentType(file: SharedIntakeFileReference): SharedIntakeContentType {
  const mime = (file.detectedMimeType ?? file.declaredMimeType ?? "").toLowerCase();
  const extension = file.originalFilename.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  if (extension === "eml" || mime === "message/rfc822") return "email_file";
  if (mime.startsWith("image/")) return "image";
  return "file";
}

function normalizeSharedUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Unsupported URL scheme.");
    url.hash = "";
    url.username = "";
    url.password = "";
    return url.toString();
  } catch {
    throw new Error("Shared URL is not usable.");
  }
}

function extractFirstUrl(text?: string) {
  const match = text?.match(/\bhttps?:\/\/[^\s<>"']+/i);
  return match?.[0];
}

function sanitizeText(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > SHARED_INTAKE_MAX_TEXT_CHARS) throw new Error("Shared text is too large.");
  return trimmed;
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  const entries = Object.entries(value as UnknownRecord)
    .filter(([, entry]) => entry !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`).join(",")}}`;
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function safeRandomId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function titleForRoute(route: SharedIntakeRoute) {
  if (route === "listing_url") return "Listing URL intake";
  if (route === "file_evidence") return "Evidence intake";
  if (route === "email_intake") return "Email intake";
  return "Manual intake review";
}

function sourceLabel(payload: SharedIntakePayload) {
  return payload.sourceApplicationName ? `Shared from ${payload.sourceApplicationName}` : "Shared source";
}

function nextActionForStatus(payload: SharedIntakePayload): SharedIntakeReview["nextAction"] {
  if (payload.status === "awaiting_authentication") return "sign_in";
  if (payload.status === "awaiting_workspace") return "select_workspace";
  if (payload.status === "failed" || payload.status === "conflicted") return "retry";
  if (payload.status === "complete") return "open_result";
  if (payload.status === "cancelled" || payload.status === "expired") return "none";
  return "review";
}

function messageForStatus(payload: SharedIntakePayload) {
  if (payload.status === "awaiting_authentication") return "Sign in before this shared item can reach BRIX.";
  if (payload.status === "awaiting_workspace") return "Choose an authorized workspace before importing.";
  if (payload.status === "complete") return "This shared item has reached BRIX.";
  if (payload.status === "failed") return "The shared item is preserved locally. Retry is available.";
  if (payload.status === "conflicted") return "Review is required before BRIX can continue.";
  if (payload.status === "expired") return "The operating system no longer provides this shared item.";
  if (payload.status === "cancelled") return "This shared item was cancelled and will not synchronize.";
  return "Review this shared item before creating or attaching canonical records.";
}

function actionsForStatus(payload: SharedIntakePayload): SharedIntakeReview["actions"] {
  if (payload.status === "complete") return ["open_result"];
  if (payload.status === "cancelled" || payload.status === "expired") return [];
  if (payload.status === "failed" || payload.status === "conflicted") return ["retry", "cancel"];
  return ["create_new_deal", "attach_existing_deal", "continue_manually", "cancel"];
}

function normalizeResult(value: unknown): SharedIntakeResult | undefined {
  if (!isRecord(value)) return undefined;
  const result: SharedIntakeResult = {
    intakeId: safeIdentifier(value.intakeId),
    evidenceId: safeIdentifier(value.evidenceId),
    sourceRecordId: safeIdentifier(value.sourceRecordId),
    propertyId: safeIdentifier(value.propertyId),
    dealId: safeIdentifier(value.dealId),
  };
  return Object.values(result).some(Boolean) ? result : undefined;
}

function safeHandoffId(value: unknown) {
  const raw = stringValue(value);
  return raw && /^share_[A-Za-z0-9._:-]{8,160}$/.test(raw) ? raw : undefined;
}

function safeIdentifier(value: unknown) {
  const raw = stringValue(value);
  return raw && /^[A-Za-z0-9._:@-]{1,200}$/.test(raw) ? raw : undefined;
}

function safeLabel(value: unknown) {
  const raw = stringValue(value);
  return raw ? raw.replace(/[^\w .:@-]/g, "").slice(0, 120).trim() || undefined : undefined;
}

function isSafeError(value: unknown): value is SharedIntakeSafeErrorCategory {
  return ["none", "unsupported", "oversized", "invalid_mime", "malformed", "authentication", "workspace", "permission", "offline", "expired", "conflict", "storage", "server"].includes(value as string);
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
