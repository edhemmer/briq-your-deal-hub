import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DUPLICATE_RULE_REGISTRY_VERSION,
  createCanonicalCandidateInputs,
  createDuplicateDetectionRequest,
  duplicateRuleRegistrySnapshot,
  findDuplicateCandidates,
  recordDuplicateDecision,
  validateDuplicateDecision,
} from "../core/duplicateDetection";

const rpc = vi.fn();

vi.mock("../core/supabase", () => ({
  supabase: { rpc: (...args: unknown[]) => rpc(...args) },
}));

describe("canonical duplicate detection", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("publishes one deterministic versioned rule registry covering all required subjects", () => {
    const registry = duplicateRuleRegistrySnapshot();
    expect(registry.map((rule) => rule.id)).toEqual([...registry.map((rule) => rule.id)].sort((a, b) => {
      const left = registry.find((rule) => rule.id === a);
      const right = registry.find((rule) => rule.id === b);
      if (!left || !right) return 0;
      return left.priority - right.priority || a.localeCompare(b);
    }));
    expect(registry.every((rule) => rule.version >= 1)).toBe(true);
    const covered = new Set(registry.flatMap((rule) => rule.subjectTypes));
    expect([...covered].sort()).toEqual([
      "batch_item",
      "deal",
      "email_source",
      "evidence",
      "intake",
      "listing_source",
      "property",
      "shared_handoff",
      "source_record",
    ]);
  });

  it("matches properties by parcel or exact normalized address without using coordinate-only certainty", () => {
    const request = createDuplicateDetectionRequest({
      workspaceId: "workspace-1",
      subjectType: "property",
      identity: { parcelId: "19-01-100-001", normalizedAddress: "123 Main Street", unitNumber: "A" },
    });
    const results = findDuplicateCandidates(request, [
      { subjectType: "property", identity: { workspaceId: "workspace-1", canonicalId: "property-parcel", parcelId: "19-01-100-001", normalizedAddress: "999 Other Rd" } },
      { subjectType: "property", identity: { workspaceId: "workspace-1", canonicalId: "property-address", normalizedAddress: "123 Main St", unitNumber: "A" } },
      { subjectType: "property", identity: { workspaceId: "workspace-1", canonicalId: "property-coordinate", latitude: 41.1, longitude: -88.1 } },
    ]);

    expect(results).toEqual(expect.arrayContaining([
      expect.objectContaining({ candidateCanonicalId: "property-parcel", ruleId: "property.parcel.exact", confidence: "exact", score: 100 }),
      expect.objectContaining({ candidateCanonicalId: "property-address", ruleId: "property.address_unit.exact", confidence: "exact" }),
    ]));
    expect(results.map((result) => result.candidateCanonicalId)).not.toContain("property-coordinate");
  });

  it("flags missing unit property matches as possible and deterministic", () => {
    const request = createDuplicateDetectionRequest({
      workspaceId: "workspace-1",
      subjectType: "property",
      identity: { normalizedAddress: "44 Oak Lane", unitNumber: "2" },
    });
    const candidates = createCanonicalCandidateInputs("property", [
      { workspaceId: "workspace-1", canonicalId: "p1", normalizedAddress: "44 Oak Ln" },
    ]);

    const first = findDuplicateCandidates(request, candidates);
    const second = findDuplicateCandidates(request, [...candidates].reverse());

    expect(first).toEqual(second);
    expect(first[0]).toMatchObject({ confidence: "possible", recommendedDecision: "defer" });
    expect(first[0].conflicts[0]).toMatch(/unit/i);
  });

  it("keeps candidate scope inside the workspace and excludes archived candidates unless requested", () => {
    const request = createDuplicateDetectionRequest({
      workspaceId: "workspace-1",
      subjectType: "deal",
      identity: { propertyId: "property-1" },
    });
    const hidden = findDuplicateCandidates(request, [
      { subjectType: "deal", identity: { workspaceId: "workspace-2", canonicalId: "wrong-workspace", propertyId: "property-1" } },
      { subjectType: "deal", identity: { workspaceId: "workspace-1", canonicalId: "archived", propertyId: "property-1", archivedAt: "2026-01-01T00:00:00.000Z" } },
    ]);
    const visible = findDuplicateCandidates({ ...request, includeArchived: true }, [
      { subjectType: "deal", identity: { workspaceId: "workspace-1", canonicalId: "archived", propertyId: "property-1", archivedAt: "2026-01-01T00:00:00.000Z" } },
    ]);

    expect(hidden).toEqual([]);
    expect(visible[0]).toMatchObject({ candidateCanonicalId: "archived", ruleId: "deal.same_property.archived" });
  });

  it("detects evidence, listing, email, source, intake, share, and batch duplicates without LLM matching", () => {
    const cases = [
      ["evidence", { contentHash: "a".repeat(64) }, { canonicalId: "e1", contentHash: "a".repeat(64) }, "evidence.content_hash.exact"],
      ["listing_source", { listingProviderKey: "provider", listingId: "L-1" }, { canonicalId: "l1", listingProviderKey: "provider", listingId: "L-1" }, "listing.provider_listing.exact"],
      ["listing_source", { sourceUrl: "https://source.example/listing?utm_source=x&id=1" }, { canonicalId: "l2", sourceUrl: "https://source.example/listing?id=1" }, "listing.url.exact"],
      ["email_source", { messageId: "<ABC@example.com>" }, { canonicalId: "m1", messageId: "abc@example.com" }, "email.message_id.exact"],
      ["email_source", { bodyHash: "b".repeat(64), attachmentHashes: ["c".repeat(64)] }, { canonicalId: "m2", bodyHash: "b".repeat(64), attachmentHashes: ["c".repeat(64)] }, "email.body_attachments.exact"],
      ["source_record", { contentHash: "d".repeat(64) }, { canonicalId: "s1", contentHash: "d".repeat(64) }, "source_record.content_hash.exact"],
      ["intake", { idempotencyKey: "manual-intake:1" }, { canonicalId: "i1", idempotencyKey: "manual-intake:1" }, "intake.idempotency.exact"],
      ["shared_handoff", { handoffId: "handoff-1" }, { canonicalId: "h1", handoffId: "handoff-1" }, "shared_handoff.identity.exact"],
      ["batch_item", { batchId: "batch-1", normalizedAddress: "10 Pine Road" }, { batchItemId: "row-1", batchId: "batch-1", normalizedAddress: "10 Pine Rd" }, "batch_item.same_batch_key"],
    ] as const;

    for (const [subjectType, requestIdentity, candidateIdentity, ruleId] of cases) {
      const request = createDuplicateDetectionRequest({ workspaceId: "workspace-1", subjectType, identity: requestIdentity });
      const [result] = findDuplicateCandidates(request, [{ subjectType, identity: { workspaceId: "workspace-1", ...candidateIdentity } }]);
      expect(result.ruleId).toBe(ruleId);
      expect(result.explanation.join(" ")).not.toMatch(/\b(?:LLM|model)\b|OpenAI/i);
    }
  });

  it("validates explicit duplicate decisions without silently merging records", () => {
    const decision = validateDuplicateDecision({
      workspaceId: "workspace-1",
      idempotencyKey: "duplicate-decision:1",
      subjectType: "property",
      subjectIdentity: { workspaceId: "workspace-1", normalizedAddress: "1 Main St" },
      decision: "create_separate",
      rationaleCategory: "not_same",
    });

    expect(decision.decision).toBe("create_separate");
    expect(() => validateDuplicateDecision({ ...decision, decision: "merge" as never })).toThrow(/unsupported/i);
  });

  it("records duplicate decisions through one server-owned RPC and safe payload", async () => {
    rpc.mockResolvedValue({
      data: [{
        duplicate_decision_id: "00000000-0000-0000-0000-000000000001",
        decision: "defer",
        subject_type: "property",
        candidate_subject_type: "property",
        idempotency_key_out: "duplicate-decision:2",
      }],
      error: null,
    });

    const result = await recordDuplicateDecision({
      workspaceId: "workspace-1",
      idempotencyKey: "duplicate-decision:2",
      subjectType: "property",
      subjectIdentity: { workspaceId: "workspace-1", normalizedAddress: "1 Main St" },
      candidate: {
        candidateKey: "candidate-1",
        subjectType: "property",
        candidateCanonicalId: "00000000-0000-0000-0000-000000000010",
        ruleId: "property.address_unit.exact",
        ruleVersion: 1,
        score: 100,
        confidence: "exact",
        explanation: ["Normalized address and unit match exactly."],
        conflicts: [],
        recommendedDecision: "reuse_existing",
        sortKey: "0000",
        identity: { workspaceId: "workspace-1", canonicalId: "00000000-0000-0000-0000-000000000010", normalizedAddress: "1 Main St" },
      },
      decision: "defer",
      rationaleCategory: "needs_review",
      userNote: "Need owner confirmation.",
    });

    expect(result.duplicateDecisionId).toBe("00000000-0000-0000-0000-000000000001");
    expect(rpc).toHaveBeenCalledWith("record_duplicate_decision", expect.objectContaining({
      target_workspace_id: "workspace-1",
      decision_input: expect.objectContaining({
        ruleRegistryVersion: DUPLICATE_RULE_REGISTRY_VERSION,
        decision: "defer",
      }),
    }));
  });
});
