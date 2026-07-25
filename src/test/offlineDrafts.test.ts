import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  OFFLINE_DRAFT_LOCAL_FALLBACK_KEY,
  cancelOfflineDraft,
  createOfflineDraft,
  createOfflineDraftRepository,
  offlineScopeKey,
  processOfflineDraftQueue,
  queueOfflineDraft,
  transitionOfflineDraft,
  type OfflineDraft,
  type OfflineDraftRepository,
  type OfflineDraftScope,
} from "../core/offlineDrafts";
import type { DealFacts, DealWorkItem } from "../core/types";

const anonymousScope: OfflineDraftScope = { kind: "anonymous" };
const workspaceScope: OfflineDraftScope = { kind: "authenticated", userId: "user-1", workspaceId: "workspace-1" };

function deal(id = "local-deal-1"): DealFacts {
  return {
    id,
    createdAt: "2026-07-25T10:00:00.000Z",
    updatedAt: "2026-07-25T10:00:00.000Z",
    status: "draft",
    sourceUrl: "",
    sourceText: "",
    address: "10 Main St",
    city: "Dallas",
    state: "TX",
    zip: "75201",
    strategyId: "buy_and_hold",
    notes: [],
    photoUrls: [],
    uploadedPhotoNames: [],
    verification: {},
    dealVersion: 1,
    propertyVersion: 1,
  };
}

function taskItem(recordId = "task-1"): DealWorkItem {
  return {
    workspaceId: "workspace-1",
    dealId: "deal-1",
    recordId,
    recordType: "task",
    title: "Call lender",
    body: "",
    status: "open",
    priority: "normal",
    workType: "general",
    dueAt: undefined,
    dueDate: undefined,
    isAllDay: false,
    timezone: "America/Chicago",
    sourceType: "manual",
    verificationState: "unverified",
    createdAt: "2026-07-25T10:00:00.000Z",
    updatedAt: "2026-07-25T10:00:00.000Z",
    recordVersion: 3,
  };
}

class MemoryDraftRepository implements OfflineDraftRepository {
  drafts = new Map<string, OfflineDraft>();

  async list(scope?: OfflineDraftScope) {
    const rows = [...this.drafts.values()];
    return scope ? rows.filter((draft) => offlineScopeKey(draft.scope) === offlineScopeKey(scope)) : rows;
  }

  async get(localDraftId: string) {
    return this.drafts.get(localDraftId) ?? null;
  }

  async put(draft: OfflineDraft) {
    this.drafts.set(draft.localDraftId, draft);
  }

  async delete(localDraftId: string) {
    this.drafts.delete(localDraftId);
  }

  async clearScope(scope: OfflineDraftScope) {
    for (const draft of await this.list(scope)) this.drafts.delete(draft.localDraftId);
  }
}

describe("offline draft state model", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("persists scoped drafts in durable browser storage without leaking sensitive payload keys", async () => {
    const repository = createOfflineDraftRepository();
    const draft = queueOfflineDraft(createOfflineDraft({
      scope: workspaceScope,
      workspaceId: "workspace-1",
      dealId: "local-deal-1",
      draftType: "new_deal",
      commandType: "create_canonical_deal",
      payload: { deal: { ...deal(), authToken: "must-not-store" } as DealFacts & { authToken: string } },
      baseValues: { refreshToken: "secret", status: "draft" },
    }));

    await repository.put(draft);

    expect(await repository.list(workspaceScope)).toHaveLength(1);
    expect(await repository.list({ kind: "authenticated", userId: "user-2", workspaceId: "workspace-1" })).toHaveLength(0);
    expect(await repository.list(anonymousScope)).toHaveLength(0);
    expect(JSON.stringify(await repository.list())).not.toMatch(/authToken|refreshToken|must-not-store|secret/i);
  });

  it("allows only explicit status transitions", () => {
    const draft = createOfflineDraft({ scope: anonymousScope, draftType: "new_deal", commandType: "create_canonical_deal", payload: { deal: deal() } });

    expect(queueOfflineDraft(draft).status).toBe("queued");
    expect(cancelOfflineDraft(draft).status).toBe("cancelled");
    expect(() => transitionOfflineDraft(draft, "synced")).toThrow(/Invalid offline draft transition/);
  });

  it("recovers from corrupted local fallback storage", async () => {
    localStorage.setItem(OFFLINE_DRAFT_LOCAL_FALLBACK_KEY, "{bad json");
    const repository = createOfflineDraftRepository();

    await expect(repository.list()).resolves.toEqual([]);
  });
});

describe("offline draft synchronization queue", () => {
  it("runs supported commands in dependency order and stores canonical id mappings", async () => {
    const repository = new MemoryDraftRepository();
    const parent = queueOfflineDraft(createOfflineDraft({
      scope: workspaceScope,
      workspaceId: "workspace-1",
      dealId: "local-deal-1",
      draftType: "new_deal",
      commandType: "create_canonical_deal",
      payload: { deal: deal("local-deal-1") },
    }));
    const child = queueOfflineDraft(createOfflineDraft({
      scope: workspaceScope,
      workspaceId: "workspace-1",
      dealId: "local-deal-1",
      draftType: "task_create",
      commandType: "create_deal_task",
      dependencyLocalIds: [parent.localDraftId],
      payload: { dealId: "local-deal-1", draft: { title: "Inspect", taskType: "general", priority: "normal", status: "open", dueAt: "", dueDate: "", isAllDay: false, timezone: "UTC" } },
    }));
    await repository.put(child);
    await repository.put(parent);
    const calls: string[] = [];

    const result = await processOfflineDraftQueue({
      repository,
      scope: workspaceScope,
      userId: "user-1",
      workspaceId: "workspace-1",
      isOnline: true,
      commands: {
        createDeal: async (draft) => {
          calls.push(draft.localDraftId);
          return { canonicalId: "deal-1", canonicalVersion: 2, mappings: [{ localId: draft.payload.deal.id, canonicalId: "deal-1", canonicalType: "deal", canonicalVersion: 2, updatedAt: "2026-07-25T10:01:00.000Z" }] };
        },
        createTask: async (draft) => {
          calls.push(draft.localDraftId);
          return { canonicalId: "task-1", canonicalVersion: 1 };
        },
      },
    });

    expect(result).toMatchObject({ synced: 2, failed: 0, conflicted: 0, paused: false });
    expect(calls).toEqual([parent.localDraftId, child.localDraftId]);
    expect((await repository.get(parent.localDraftId))?.mappings[0]).toMatchObject({ localId: "local-deal-1", canonicalId: "deal-1" });
  });

  it("preserves idempotency keys and classifies conflicts without applying later drafts", async () => {
    const repository = new MemoryDraftRepository();
    const first = queueOfflineDraft(createOfflineDraft({
      scope: workspaceScope,
      workspaceId: "workspace-1",
      dealId: "deal-1",
      draftType: "task_update",
      commandType: "update_deal_task",
      baseRecordId: "task-1",
      baseVersion: 3,
      payload: { item: taskItem(), draft: { title: "Call lender again" } },
    }));
    await repository.put(first);
    const seenKeys: string[] = [];

    const result = await processOfflineDraftQueue({
      repository,
      scope: workspaceScope,
      userId: "user-1",
      workspaceId: "workspace-1",
      isOnline: true,
      commands: {
        updateTask: async (draft) => {
          seenKeys.push(draft.idempotencyKey);
          throw new Error("changed after you opened this task");
        },
      },
    });

    const stored = await repository.get(first.localDraftId);
    expect(result).toMatchObject({ synced: 0, conflicted: 1, failed: 0 });
    expect(stored?.status).toBe("conflicted");
    expect(stored?.lastSafeErrorCategory).toBe("conflict");
    expect(seenKeys).toEqual([first.idempotencyKey]);
  });

  it("pauses when auth scope changes or another processor already owns the scope", async () => {
    const repository = new MemoryDraftRepository();
    const draft = queueOfflineDraft(createOfflineDraft({
      scope: workspaceScope,
      workspaceId: "workspace-1",
      dealId: "deal-1",
      draftType: "task_create",
      commandType: "create_deal_task",
      payload: { dealId: "deal-1", draft: { title: "Inspect", taskType: "general", priority: "normal", status: "open", dueAt: "", dueDate: "", isAllDay: false, timezone: "UTC" } },
    }));
    await repository.put(draft);

    await expect(processOfflineDraftQueue({ repository, scope: workspaceScope, userId: "user-2", workspaceId: "workspace-1", isOnline: true })).resolves.toMatchObject({ processed: 0, paused: true });

    let releaseSync = () => {};
    const release = new Promise<void>((resolve) => {
      releaseSync = resolve;
    });
    const firstRun = processOfflineDraftQueue({
      repository,
      scope: workspaceScope,
      userId: "user-1",
      workspaceId: "workspace-1",
      isOnline: true,
      commands: { createTask: async () => { await release; return {}; } },
    });
    const secondRun = await processOfflineDraftQueue({ repository, scope: workspaceScope, userId: "user-1", workspaceId: "workspace-1", isOnline: true, commands: { createTask: async () => ({}) } });
    releaseSync();

    expect(secondRun).toMatchObject({ processed: 0, paused: true });
    await firstRun;
  });
});
