import { updateDealCore, updateProperty as updateCanonicalProperty } from "./dealCrud";
import { createRemoteDeal } from "./store";
import {
  createDealDeadline,
  createDealNote,
  createDealTask,
  updateDealDeadline,
  updateDealNote,
  updateDealTask,
  type DeadlineDraft,
  type NoteDraft,
  type TaskDraft,
} from "./workHistory";
import type { DealCoreUpdate, DealFacts, DealNote, DealWorkItem, PropertySummary, PropertyUpdate } from "./types";

type UnknownRecord = Record<string, unknown>;

export const OFFLINE_DRAFT_SCHEMA_VERSION = 1;
export const OFFLINE_DRAFT_DB_NAME = "brix-offline-drafts";
export const OFFLINE_DRAFT_STORE_NAME = "drafts";
export const OFFLINE_DRAFT_LOCAL_FALLBACK_KEY = "brix.offlineDrafts.v1";
export const OFFLINE_DRAFT_MAX_RETRIES = 5;

export type OfflineDraftStatus = "local" | "queued" | "syncing" | "synced" | "conflicted" | "failed" | "cancelled";
export type OfflineDraftType =
  | "new_deal"
  | "deal_core_update"
  | "property_update"
  | "note_create"
  | "note_update"
  | "task_create"
  | "task_update"
  | "deadline_create"
  | "deadline_update";
export type OfflineCommandType =
  | "create_canonical_deal"
  | "update_canonical_deal"
  | "update_canonical_property"
  | "create_deal_note"
  | "update_deal_note"
  | "create_deal_task"
  | "update_deal_task"
  | "create_deal_deadline"
  | "update_deal_deadline";
export type OfflineDraftErrorCategory = "none" | "offline" | "authentication" | "permission" | "conflict" | "validation" | "quota" | "storage" | "server";
export type OfflineDraftScopeKind = "anonymous" | "authenticated";

export type OfflineDraftScope = {
  kind: OfflineDraftScopeKind;
  userId?: string;
  workspaceId?: string;
};

export type LocalCanonicalMapping = {
  localId: string;
  canonicalId: string;
  canonicalVersion?: number;
  canonicalType: "deal" | "property" | "task" | "deadline" | "note";
  updatedAt: string;
};

export type OfflineDraft<TPayload = UnknownRecord> = {
  schemaVersion: 1;
  localDraftId: string;
  scope: OfflineDraftScope;
  workspaceId?: string;
  dealId?: string;
  propertyId?: string;
  draftType: OfflineDraftType;
  commandType: OfflineCommandType;
  baseRecordId?: string;
  baseVersion?: number;
  baseValues?: UnknownRecord;
  payload: TPayload;
  createdAt: string;
  updatedAt: string;
  status: OfflineDraftStatus;
  retryCount: number;
  lastAttemptedAt?: string;
  lastSyncedAt?: string;
  lastSafeErrorCategory: OfflineDraftErrorCategory;
  idempotencyKey: string;
  clientId: string;
  resultingCanonicalId?: string;
  resultingCanonicalVersion?: number;
  dependencyLocalIds: string[];
  mappings: LocalCanonicalMapping[];
};

export type OfflineDraftDiagnosticsEvent = {
  event:
    | "draft.created"
    | "draft.queued"
    | "sync.started"
    | "sync.succeeded"
    | "sync.failed"
    | "conflict.detected"
    | "conflict.resolved"
    | "draft.cancelled"
    | "storage.migration_failed"
    | "authorization.changed";
  draftId?: string;
  draftType?: OfflineDraftType;
  status?: OfflineDraftStatus;
  errorCategory?: OfflineDraftErrorCategory;
  scopeKey?: string;
};

export type OfflineDraftRepository = {
  list(scope?: OfflineDraftScope): Promise<OfflineDraft[]>;
  get(localDraftId: string): Promise<OfflineDraft | null>;
  put(draft: OfflineDraft): Promise<void>;
  delete(localDraftId: string): Promise<void>;
  clearScope(scope: OfflineDraftScope): Promise<void>;
};

export type OfflineSyncCommands = {
  createDeal?: (draft: OfflineDraft<NewDealDraftPayload>) => Promise<SyncCanonicalResult>;
  updateDeal?: (draft: OfflineDraft<DealCoreUpdateDraftPayload>) => Promise<SyncCanonicalResult>;
  updateProperty?: (draft: OfflineDraft<PropertyUpdateDraftPayload>) => Promise<SyncCanonicalResult>;
  createTask?: (draft: OfflineDraft<TaskDraftPayload>) => Promise<SyncCanonicalResult>;
  updateTask?: (draft: OfflineDraft<TaskUpdateDraftPayload>) => Promise<SyncCanonicalResult>;
  createDeadline?: (draft: OfflineDraft<DeadlineDraftPayload>) => Promise<SyncCanonicalResult>;
  updateDeadline?: (draft: OfflineDraft<DeadlineUpdateDraftPayload>) => Promise<SyncCanonicalResult>;
  createNote?: (draft: OfflineDraft<NoteDraftPayload>) => Promise<SyncCanonicalResult>;
  updateNote?: (draft: OfflineDraft<NoteUpdateDraftPayload>) => Promise<SyncCanonicalResult>;
};

export type SyncCanonicalResult = {
  canonicalId?: string;
  canonicalVersion?: number;
  propertyId?: string;
  propertyVersion?: number;
  mappings?: LocalCanonicalMapping[];
};

export type SyncQueueResult = {
  processed: number;
  synced: number;
  failed: number;
  conflicted: number;
  paused: boolean;
};

export type NewDealDraftPayload = { deal: DealFacts };
export type DealCoreUpdateDraftPayload = { deal: DealFacts; update: DealCoreUpdate };
export type PropertyUpdateDraftPayload = { property: PropertySummary; update: PropertyUpdate };
export type TaskDraftPayload = { dealId: string; draft: TaskDraft };
export type TaskUpdateDraftPayload = { item: DealWorkItem; draft: Partial<TaskDraft> };
export type DeadlineDraftPayload = { dealId: string; draft: DeadlineDraft };
export type DeadlineUpdateDraftPayload = { item: DealWorkItem; draft: Partial<DeadlineDraft> };
export type NoteDraftPayload = { dealId: string; draft: NoteDraft };
export type NoteUpdateDraftPayload = { note: DealNote; draft: Partial<NoteDraft> };

const allowedTransitions: Record<OfflineDraftStatus, OfflineDraftStatus[]> = {
  local: ["queued", "cancelled"],
  queued: ["syncing", "cancelled"],
  syncing: ["synced", "failed", "conflicted"],
  synced: [],
  conflicted: ["queued", "cancelled"],
  failed: ["queued", "cancelled"],
  cancelled: [],
};

export function offlineScopeKey(scope: OfflineDraftScope) {
  if (scope.kind === "anonymous") return "anonymous";
  return `user:${scope.userId ?? "unknown"}:workspace:${scope.workspaceId ?? "unknown"}`;
}

export function createOfflineDraft<TPayload extends UnknownRecord>(
  input: {
    scope: OfflineDraftScope;
    draftType: OfflineDraftType;
    commandType: OfflineCommandType;
    payload: TPayload;
    workspaceId?: string;
    dealId?: string;
    propertyId?: string;
    baseRecordId?: string;
    baseVersion?: number;
    baseValues?: UnknownRecord;
    dependencyLocalIds?: string[];
    clientId?: string;
    now?: string;
  },
) {
  const now = input.now ?? new Date().toISOString();
  const localDraftId = `draft_${safeRandomId()}`;
  const draft: OfflineDraft<TPayload> = {
    schemaVersion: OFFLINE_DRAFT_SCHEMA_VERSION,
    localDraftId,
    scope: input.scope,
    workspaceId: input.workspaceId ?? input.scope.workspaceId,
    dealId: input.dealId,
    propertyId: input.propertyId,
    draftType: input.draftType,
    commandType: input.commandType,
    baseRecordId: input.baseRecordId,
    baseVersion: input.baseVersion,
    baseValues: scrubSecrets(input.baseValues ?? {}),
    payload: scrubSecrets(input.payload) as TPayload,
    createdAt: now,
    updatedAt: now,
    status: "local",
    retryCount: 0,
    lastSafeErrorCategory: "none",
    idempotencyKey: `${input.commandType}:${localDraftId}`,
    clientId: input.clientId ?? getOrCreateClientId(),
    dependencyLocalIds: input.dependencyLocalIds ?? [],
    mappings: [],
  };
  validateOfflineDraft(draft);
  emitDraftDiagnostic({ event: "draft.created", draftId: draft.localDraftId, draftType: draft.draftType, status: draft.status, scopeKey: offlineScopeKey(draft.scope) });
  return draft;
}

export function transitionOfflineDraft<TPayload>(draft: OfflineDraft<TPayload>, nextStatus: OfflineDraftStatus, now = new Date().toISOString()): OfflineDraft<TPayload> {
  if (!allowedTransitions[draft.status].includes(nextStatus)) {
    throw new Error(`Invalid offline draft transition from ${draft.status} to ${nextStatus}.`);
  }
  return {
    ...draft,
    status: nextStatus,
    updatedAt: now,
    lastAttemptedAt: nextStatus === "syncing" ? now : draft.lastAttemptedAt,
  };
}

export function queueOfflineDraft<TPayload>(draft: OfflineDraft<TPayload>) {
  const queued = transitionOfflineDraft(draft, "queued");
  emitDraftDiagnostic({ event: "draft.queued", draftId: queued.localDraftId, draftType: queued.draftType, status: queued.status, scopeKey: offlineScopeKey(queued.scope) });
  return queued;
}

export function cancelOfflineDraft<TPayload>(draft: OfflineDraft<TPayload>) {
  const cancelled = transitionOfflineDraft(draft, "cancelled");
  emitDraftDiagnostic({ event: "draft.cancelled", draftId: cancelled.localDraftId, draftType: cancelled.draftType, status: cancelled.status, scopeKey: offlineScopeKey(cancelled.scope) });
  return cancelled;
}

export function validateOfflineDraft(draft: OfflineDraft) {
  if (draft.schemaVersion !== OFFLINE_DRAFT_SCHEMA_VERSION) throw new Error("Unsupported offline draft schema.");
  if (!draft.localDraftId || !draft.idempotencyKey || !draft.clientId) throw new Error("Offline draft identity is incomplete.");
  if (draft.scope.kind === "authenticated" && (!draft.scope.userId || !draft.scope.workspaceId)) throw new Error("Authenticated offline drafts require user and workspace scope.");
  if (draft.scope.kind === "anonymous" && (draft.scope.userId || draft.scope.workspaceId)) throw new Error("Anonymous drafts cannot carry authenticated scope.");
  if (!isRecord(draft.payload)) throw new Error("Offline draft payload is not usable.");
  if (containsSecretKey(draft.payload)) throw new Error("Offline draft payload contains a sensitive field.");
}

export function normalizeOfflineDraft(value: unknown): OfflineDraft | null {
  if (!isRecord(value)) return null;
  const migrated = migrateOfflineDraft(value);
  if (!migrated) return null;
  try {
    validateOfflineDraft(migrated);
    return migrated;
  } catch {
    return null;
  }
}

export function migrateOfflineDraft(value: UnknownRecord): OfflineDraft | null {
  const schemaVersion = value.schemaVersion === 1 ? 1 : value.version === 1 ? 1 : undefined;
  if (schemaVersion !== 1) return null;
  if (!isRecord(value.scope) || !isRecord(value.payload)) return null;
  const status = isDraftStatus(value.status) ? value.status : "failed";
  const draftType = isDraftType(value.draftType) ? value.draftType : undefined;
  const commandType = isCommandType(value.commandType) ? value.commandType : undefined;
  if (!draftType || !commandType) return null;
  return {
    schemaVersion: 1,
    localDraftId: stringValue(value.localDraftId) ?? `draft_${safeRandomId()}`,
    scope: normalizeScope(value.scope),
    workspaceId: stringValue(value.workspaceId),
    dealId: stringValue(value.dealId),
    propertyId: stringValue(value.propertyId),
    draftType,
    commandType,
    baseRecordId: stringValue(value.baseRecordId),
    baseVersion: numberValue(value.baseVersion),
    baseValues: isRecord(value.baseValues) ? scrubSecrets(value.baseValues) : {},
    payload: scrubSecrets(value.payload),
    createdAt: stringValue(value.createdAt) ?? new Date().toISOString(),
    updatedAt: stringValue(value.updatedAt) ?? new Date().toISOString(),
    status,
    retryCount: numberValue(value.retryCount) ?? 0,
    lastAttemptedAt: stringValue(value.lastAttemptedAt),
    lastSyncedAt: stringValue(value.lastSyncedAt),
    lastSafeErrorCategory: isErrorCategory(value.lastSafeErrorCategory) ? value.lastSafeErrorCategory : "none",
    idempotencyKey: stringValue(value.idempotencyKey) ?? `${commandType}:draft_${safeRandomId()}`,
    clientId: stringValue(value.clientId) ?? getOrCreateClientId(),
    resultingCanonicalId: stringValue(value.resultingCanonicalId),
    resultingCanonicalVersion: numberValue(value.resultingCanonicalVersion),
    dependencyLocalIds: stringArray(value.dependencyLocalIds),
    mappings: Array.isArray(value.mappings) ? value.mappings.map(normalizeMapping).filter(isMapping) : [],
  };
}

export function createOfflineDraftRepository(): OfflineDraftRepository {
  if (typeof indexedDB !== "undefined") return new IndexedDbDraftRepository();
  return new LocalStorageDraftRepository();
}

const processingScopeKeys = new Set<string>();

export async function processOfflineDraftQueue(options: {
  repository: OfflineDraftRepository;
  scope: OfflineDraftScope;
  userId?: string | null;
  workspaceId?: string | null;
  isOnline: boolean;
  commands?: OfflineSyncCommands;
  refresh?: (draft: OfflineDraft) => Promise<void> | void;
}) {
  const result: SyncQueueResult = { processed: 0, synced: 0, failed: 0, conflicted: 0, paused: false };
  if (!options.isOnline) return { ...result, paused: true };
  if (options.scope.kind === "authenticated" && (!options.userId || options.userId !== options.scope.userId || options.workspaceId !== options.scope.workspaceId)) {
    emitDraftDiagnostic({ event: "authorization.changed", scopeKey: offlineScopeKey(options.scope), errorCategory: "authentication" });
    return { ...result, paused: true };
  }
  const scopeKey = offlineScopeKey(options.scope);
  if (processingScopeKeys.has(scopeKey)) return { ...result, paused: true };
  processingScopeKeys.add(scopeKey);
  try {
  const commands = { ...defaultSyncCommands(options.userId ?? undefined, options.workspaceId ?? undefined), ...options.commands };
  const drafts = (await options.repository.list(options.scope))
    .filter((draft) => draft.status === "queued" || draft.status === "syncing")
    .sort(compareDraftDependencyOrder);
  const syncedLocalIds = new Set<string>();
  for (const draft of drafts) {
    if (draft.dependencyLocalIds.some((id) => !syncedLocalIds.has(id) && drafts.some((candidate) => candidate.localDraftId === id && candidate.status !== "synced"))) {
      continue;
    }
    result.processed += 1;
    const syncing = draft.status === "syncing" ? draft : transitionOfflineDraft(draft, "syncing");
    await options.repository.put(syncing);
    emitDraftDiagnostic({ event: "sync.started", draftId: syncing.localDraftId, draftType: syncing.draftType, status: syncing.status, scopeKey: offlineScopeKey(syncing.scope) });
    try {
      const canonical = await executeDraftCommand(syncing, commands);
      const synced: OfflineDraft = {
        ...syncing,
        status: "synced",
        updatedAt: new Date().toISOString(),
        lastSyncedAt: new Date().toISOString(),
        lastSafeErrorCategory: "none",
        resultingCanonicalId: canonical.canonicalId ?? syncing.resultingCanonicalId,
        resultingCanonicalVersion: canonical.canonicalVersion ?? syncing.resultingCanonicalVersion,
        propertyId: canonical.propertyId ?? syncing.propertyId,
        mappings: [...syncing.mappings, ...(canonical.mappings ?? [])],
      };
      await options.repository.put(synced);
      syncedLocalIds.add(synced.localDraftId);
      await options.refresh?.(synced);
      result.synced += 1;
      emitDraftDiagnostic({ event: "sync.succeeded", draftId: synced.localDraftId, draftType: synced.draftType, status: synced.status, scopeKey: offlineScopeKey(synced.scope) });
    } catch (error) {
      const category = classifyOfflineSyncError(error);
      const nextStatus: OfflineDraftStatus = category === "conflict" || category === "permission" ? "conflicted" : "failed";
      const failed: OfflineDraft = {
        ...syncing,
        status: nextStatus,
        retryCount: syncing.retryCount + 1,
        updatedAt: new Date().toISOString(),
        lastSafeErrorCategory: category,
      };
      await options.repository.put(failed);
      if (nextStatus === "conflicted") {
        result.conflicted += 1;
        emitDraftDiagnostic({ event: "conflict.detected", draftId: failed.localDraftId, draftType: failed.draftType, status: failed.status, errorCategory: category, scopeKey: offlineScopeKey(failed.scope) });
      } else {
        result.failed += 1;
        emitDraftDiagnostic({ event: "sync.failed", draftId: failed.localDraftId, draftType: failed.draftType, status: failed.status, errorCategory: category, scopeKey: offlineScopeKey(failed.scope) });
      }
      if (category === "offline" || category === "authentication") return { ...result, paused: true };
    }
  }
  return result;
  } finally {
    processingScopeKeys.delete(scopeKey);
  }
}

export function classifyOfflineSyncError(error: unknown): OfflineDraftErrorCategory {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  if (/network|fetch|offline|unavailable|timeout/i.test(raw)) return "offline";
  if (/sign in|session|jwt|auth|401/i.test(raw)) return "authentication";
  if (/permission|not have|revoked|403|42501/i.test(raw)) return "permission";
  if (/changed after|stale|version|conflict|40001|409/i.test(raw)) return "conflict";
  if (/required|invalid|validation|22023/i.test(raw)) return "validation";
  if (/quota|exceeded/i.test(raw)) return "quota";
  return "server";
}

function defaultSyncCommands(userId?: string, workspaceId?: string): OfflineSyncCommands {
  return {
    async createDeal(draft) {
      if (!userId || !workspaceId) throw new Error("Sign in before synchronizing Deal drafts.");
      const deal = await createRemoteDeal(draft.payload.deal, userId, workspaceId, draft.idempotencyKey);
      return {
        canonicalId: deal.id,
        canonicalVersion: deal.dealVersion,
        propertyId: deal.propertyId,
        propertyVersion: deal.propertyVersion,
        mappings: [
          mapping(draft.payload.deal.id, deal.id, deal.dealVersion, "deal"),
          ...(deal.propertyId && draft.payload.deal.propertyId ? [mapping(draft.payload.deal.propertyId, deal.propertyId, deal.propertyVersion, "property")] : []),
        ],
      };
    },
    async updateDeal(draft) {
      const detail = await updateDealCore(draft.payload.deal, draft.payload.update, draft.idempotencyKey);
      return { canonicalId: detail.deal.id, canonicalVersion: detail.deal.dealVersion };
    },
    async updateProperty(draft) {
      const property = await updateCanonicalProperty(draft.payload.property, draft.payload.update, draft.idempotencyKey);
      return { canonicalId: property.propertyId, canonicalVersion: property.propertyVersion };
    },
    async createTask(draft) {
      await createDealTask(draft.payload.dealId, draft.payload.draft, draft.idempotencyKey);
      return {};
    },
    async updateTask(draft) {
      await updateDealTask(draft.payload.item, draft.payload.draft);
      return { canonicalId: draft.payload.item.recordId, canonicalVersion: draft.payload.item.recordVersion + 1 };
    },
    async createDeadline(draft) {
      await createDealDeadline(draft.payload.dealId, draft.payload.draft, draft.idempotencyKey);
      return {};
    },
    async updateDeadline(draft) {
      await updateDealDeadline(draft.payload.item, draft.payload.draft);
      return { canonicalId: draft.payload.item.recordId, canonicalVersion: draft.payload.item.recordVersion + 1 };
    },
    async createNote(draft) {
      await createDealNote(draft.payload.dealId, draft.payload.draft, draft.idempotencyKey);
      return {};
    },
    async updateNote(draft) {
      await updateDealNote(draft.payload.note, draft.payload.draft);
      return { canonicalId: draft.payload.note.noteId, canonicalVersion: draft.payload.note.noteVersion + 1 };
    },
  };
}

async function executeDraftCommand(draft: OfflineDraft, commands: OfflineSyncCommands): Promise<SyncCanonicalResult> {
  switch (draft.draftType) {
    case "new_deal": return required(commands.createDeal, draft);
    case "deal_core_update": return required(commands.updateDeal, draft);
    case "property_update": return required(commands.updateProperty, draft);
    case "task_create": return required(commands.createTask, draft);
    case "task_update": return required(commands.updateTask, draft);
    case "deadline_create": return required(commands.createDeadline, draft);
    case "deadline_update": return required(commands.updateDeadline, draft);
    case "note_create": return required(commands.createNote, draft);
    case "note_update": return required(commands.updateNote, draft);
  }
}

async function required<TDraft extends OfflineDraft>(command: ((draft: TDraft) => Promise<SyncCanonicalResult>) | undefined, draft: OfflineDraft) {
  if (!command) throw new Error(`No sync command is registered for ${draft.draftType}.`);
  return command(draft as TDraft);
}

class LocalStorageDraftRepository implements OfflineDraftRepository {
  async list(scope?: OfflineDraftScope) {
    const drafts = this.readAll();
    return scope ? drafts.filter((draft) => offlineScopeKey(draft.scope) === offlineScopeKey(scope)) : drafts;
  }

  async get(localDraftId: string) {
    return this.readAll().find((draft) => draft.localDraftId === localDraftId) ?? null;
  }

  async put(draft: OfflineDraft) {
    validateOfflineDraft(draft);
    const current = this.readAll().filter((item) => item.localDraftId !== draft.localDraftId);
    this.writeAll([draft, ...current]);
  }

  async delete(localDraftId: string) {
    this.writeAll(this.readAll().filter((draft) => draft.localDraftId !== localDraftId));
  }

  async clearScope(scope: OfflineDraftScope) {
    this.writeAll(this.readAll().filter((draft) => offlineScopeKey(draft.scope) !== offlineScopeKey(scope)));
  }

  private readAll() {
    try {
      const raw = localStorage.getItem(OFFLINE_DRAFT_LOCAL_FALLBACK_KEY);
      const parsed = JSON.parse(raw ?? "[]") as unknown;
      return Array.isArray(parsed) ? parsed.map(normalizeOfflineDraft).filter(isDraft) : [];
    } catch {
      emitDraftDiagnostic({ event: "storage.migration_failed", errorCategory: "storage" });
      return [];
    }
  }

  private writeAll(drafts: OfflineDraft[]) {
    try {
      localStorage.setItem(OFFLINE_DRAFT_LOCAL_FALLBACK_KEY, JSON.stringify(drafts));
    } catch (error) {
      const category = classifyOfflineSyncError(error) === "quota" ? "quota" : "storage";
      emitDraftDiagnostic({ event: "sync.failed", errorCategory: category });
      throw error;
    }
  }
}

class IndexedDbDraftRepository implements OfflineDraftRepository {
  private dbPromise?: Promise<IDBDatabase>;

  async list(scope?: OfflineDraftScope) {
    const rows = await this.readAll();
    return scope ? rows.filter((draft) => offlineScopeKey(draft.scope) === offlineScopeKey(scope)) : rows;
  }

  async get(localDraftId: string) {
    const db = await this.open();
    return new Promise<OfflineDraft | null>((resolve, reject) => {
      const request = db.transaction(OFFLINE_DRAFT_STORE_NAME, "readonly").objectStore(OFFLINE_DRAFT_STORE_NAME).get(localDraftId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(normalizeOfflineDraft(request.result));
    });
  }

  async put(draft: OfflineDraft) {
    validateOfflineDraft(draft);
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const request = db.transaction(OFFLINE_DRAFT_STORE_NAME, "readwrite").objectStore(OFFLINE_DRAFT_STORE_NAME).put(draft);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(localDraftId: string) {
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const request = db.transaction(OFFLINE_DRAFT_STORE_NAME, "readwrite").objectStore(OFFLINE_DRAFT_STORE_NAME).delete(localDraftId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearScope(scope: OfflineDraftScope) {
    const drafts = await this.list(scope);
    await Promise.all(drafts.map((draft) => this.delete(draft.localDraftId)));
  }

  private async readAll() {
    const db = await this.open();
    return new Promise<OfflineDraft[]>((resolve, reject) => {
      const request = db.transaction(OFFLINE_DRAFT_STORE_NAME, "readonly").objectStore(OFFLINE_DRAFT_STORE_NAME).getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result.map(normalizeOfflineDraft).filter(isDraft) : []);
    });
  }

  private open() {
    this.dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(OFFLINE_DRAFT_DB_NAME, OFFLINE_DRAFT_SCHEMA_VERSION);
      request.onerror = () => reject(request.error);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(OFFLINE_DRAFT_STORE_NAME)) {
          const store = db.createObjectStore(OFFLINE_DRAFT_STORE_NAME, { keyPath: "localDraftId" });
          store.createIndex("scope", "scope.kind", { unique: false });
          store.createIndex("status", "status", { unique: false });
          store.createIndex("dealId", "dealId", { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
    });
    return this.dbPromise;
  }
}

function compareDraftDependencyOrder(a: OfflineDraft, b: OfflineDraft) {
  if (a.dependencyLocalIds.includes(b.localDraftId)) return 1;
  if (b.dependencyLocalIds.includes(a.localDraftId)) return -1;
  if (a.dealId && b.dealId && a.dealId === b.dealId) return a.createdAt.localeCompare(b.createdAt);
  return a.createdAt.localeCompare(b.createdAt);
}

function mapping(localId: string, canonicalId: string, canonicalVersion: number | undefined, canonicalType: LocalCanonicalMapping["canonicalType"]): LocalCanonicalMapping {
  return { localId, canonicalId, canonicalVersion, canonicalType, updatedAt: new Date().toISOString() };
}

function normalizeMapping(value: unknown): LocalCanonicalMapping | null {
  if (!isRecord(value)) return null;
  const localId = stringValue(value.localId);
  const canonicalId = stringValue(value.canonicalId);
  const canonicalType = value.canonicalType === "deal" || value.canonicalType === "property" || value.canonicalType === "task" || value.canonicalType === "deadline" || value.canonicalType === "note" ? value.canonicalType : undefined;
  if (!localId || !canonicalId || !canonicalType) return null;
  return { localId, canonicalId, canonicalVersion: numberValue(value.canonicalVersion), canonicalType, updatedAt: stringValue(value.updatedAt) ?? new Date().toISOString() };
}

function normalizeScope(value: UnknownRecord): OfflineDraftScope {
  return value.kind === "authenticated"
    ? { kind: "authenticated", userId: stringValue(value.userId), workspaceId: stringValue(value.workspaceId) }
    : { kind: "anonymous" };
}

function scrubSecrets(value: unknown): UnknownRecord {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !secretPattern.test(key))
    .map(([key, entry]) => [key, isRecord(entry) ? scrubSecrets(entry) : Array.isArray(entry) ? entry.map((item) => isRecord(item) ? scrubSecrets(item) : item) : entry]));
}

function containsSecretKey(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return Object.entries(value).some(([key, entry]) => secretPattern.test(key) || containsSecretKey(entry));
}

function getOrCreateClientId() {
  const key = "brix.offlineDraftClientId";
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const next = `client_${safeRandomId()}`;
    localStorage.setItem(key, next);
    return next;
  } catch {
    return `client_${safeRandomId()}`;
  }
}

function safeRandomId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function emitDraftDiagnostic(event: OfflineDraftDiagnosticsEvent) {
  if (typeof console === "undefined") return;
  console.info("[brix.offlineDraft]", event);
}

const secretPattern = /password|token|secret|authorization|apikey|api_key|refresh/i;
const draftStatuses: OfflineDraftStatus[] = ["local", "queued", "syncing", "synced", "conflicted", "failed", "cancelled"];
const draftTypes: OfflineDraftType[] = ["new_deal", "deal_core_update", "property_update", "note_create", "note_update", "task_create", "task_update", "deadline_create", "deadline_update"];
const commandTypes: OfflineCommandType[] = ["create_canonical_deal", "update_canonical_deal", "update_canonical_property", "create_deal_note", "update_deal_note", "create_deal_task", "update_deal_task", "create_deal_deadline", "update_deal_deadline"];
const errorCategories: OfflineDraftErrorCategory[] = ["none", "offline", "authentication", "permission", "conflict", "validation", "quota", "storage", "server"];

function isDraft(value: OfflineDraft | null): value is OfflineDraft {
  return value !== null;
}

function isMapping(value: LocalCanonicalMapping | null): value is LocalCanonicalMapping {
  return value !== null;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function isDraftStatus(value: unknown): value is OfflineDraftStatus {
  return draftStatuses.includes(value as OfflineDraftStatus);
}

function isDraftType(value: unknown): value is OfflineDraftType {
  return draftTypes.includes(value as OfflineDraftType);
}

function isCommandType(value: unknown): value is OfflineCommandType {
  return commandTypes.includes(value as OfflineCommandType);
}

function isErrorCategory(value: unknown): value is OfflineDraftErrorCategory {
  return errorCategories.includes(value as OfflineDraftErrorCategory);
}
