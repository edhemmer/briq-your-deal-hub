import { beforeEach, describe, expect, it, vi } from "vitest";
import { classificationForEvidenceFile, classificationForListingUrl } from "../core/sourceClassification";
import {
  SOURCE_CONFLICT_RULE_REGISTRY_VERSION,
  buildSourceConflictReviewModel,
  createProposalConflictRequest,
  createSourceConflictRequest,
  evaluateSourceConflict,
  evaluateSourceConflicts,
  recordSourceConflict,
  recordSourceConflictResolution,
  resolveSourceConflict,
  sourceConflictRuleRegistrySnapshot,
} from "../core/sourceConflicts";

const rpc = vi.fn();

vi.mock("../core/supabase", () => ({
  supabase: { rpc: (...args: unknown[]) => rpc(...args) },
}));

describe("canonical source conflict handling", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("publishes one deterministic, versioned rule registry with disabled non-deterministic rules skipped", () => {
    const registry = sourceConflictRuleRegistrySnapshot();
    expect(registry.every((rule) => rule.version >= 1)).toBe(true);
    expect(registry.map((rule) => rule.priority)).toEqual([...registry.map((rule) => rule.priority)].sort((a, b) => a - b));
    expect(registry.some((rule) => rule.id === "disabled.ai.semantic_judge" && !rule.enabled)).toBe(true);
    expect(registry.filter((rule) => rule.enabled).map((rule) => rule.id)).not.toContain("disabled.ai.semantic_judge");
  });

  it("treats normalized equivalent address values as no conflict", () => {
    const request = createSourceConflictRequest({
      workspaceId: "workspace-1",
      subjectType: "property",
      subjectId: "property-1",
      targetField: "display_address",
      currentAccepted: { role: "accepted", rawValue: "123 Main Street", acceptedValueVersion: 2, sourceName: "User" },
      proposedValues: [{ role: "proposal", proposalId: "proposal-1", rawValue: "123 Main St.", sourceName: "Listing" }],
    });

    const result = evaluateSourceConflict(request);

    expect(result).toMatchObject({
      classification: "no_conflict",
      materialityTier: "informational",
      lifecycleState: "resolved",
      ruleRegistryVersion: SOURCE_CONFLICT_RULE_REGISTRY_VERSION,
    });
    expect(result.downstreamSafety.blocksAffectedFieldAcceptance).toBe(false);
  });

  it("detects material conflicts between accepted canonical values and new proposals", () => {
    const request = createSourceConflictRequest({
      workspaceId: "workspace-1",
      subjectType: "property",
      targetField: "asking_price",
      currentAccepted: { role: "accepted", rawValue: "$249,000", acceptedValueVersion: 3, currency: "USD", sourceName: "Manual" },
      proposedValues: [{ role: "proposal", proposalId: "proposal-1", rawValue: "$259,000", currency: "USD", sourceName: "Listing URL" }],
    });

    const result = evaluateSourceConflict(request);

    expect(result.classification).toBe("material_conflict");
    expect(result.materialityTier).toBe("material");
    expect(result.involvedAcceptedValueVersion).toBe(3);
    expect(result.involvedProposalIds).toEqual(["proposal-1"]);
    expect(result.downstreamSafety.blocksAffectedFieldAcceptance).toBe(true);
    expect(result.safeSummary).toMatch(/competing values/i);
  });

  it("keeps proposal-versus-proposal differences material when the field context is the same", () => {
    const result = evaluateSourceConflict(createSourceConflictRequest({
      workspaceId: "workspace-1",
      subjectType: "batch_row_value",
      targetField: "year_built",
      proposedValues: [
        { role: "proposal", proposalId: "proposal-a", rawValue: "1998", sourceName: "Package row" },
        { role: "proposal", proposalId: "proposal-b", rawValue: "2001", sourceName: "Attachment" },
      ],
    }));

    expect(result.classification).toBe("material_conflict");
    expect(result.involvedProposalIds).toEqual(["proposal-a", "proposal-b"]);
  });

  it("classifies annual versus monthly values as informational when the period is explicit", () => {
    const result = evaluateSourceConflict(createSourceConflictRequest({
      workspaceId: "workspace-1",
      subjectType: "property",
      targetField: "tax_amount",
      currentAccepted: { role: "accepted", rawValue: "6000", unit: "annual", period: "annual" },
      proposedValues: [{ role: "proposal", proposalId: "proposal-1", rawValue: "500", unit: "monthly", period: "monthly" }],
    }));

    expect(result.classification).toBe("informational_difference");
    expect(result.materialityTier).toBe("informational");
    expect(result.downstreamSafety.allowsPreliminaryAnalysis).toBe(true);
  });

  it("preserves stale accepted versus newer unverified values as temporal changes", () => {
    const result = evaluateSourceConflict(createSourceConflictRequest({
      workspaceId: "workspace-1",
      subjectType: "deal",
      targetField: "listing_price",
      currentAccepted: { role: "accepted", rawValue: "$300,000", acceptedValueVersion: 1, effectiveDate: "2026-01-01" },
      proposedValues: [{ role: "proposal", proposalId: "proposal-1", rawValue: "$289,000", effectiveDate: "2026-07-27", verificationState: "unverified" }],
    }));

    expect(result.classification).toBe("temporal_change");
    expect(result.materialityTier).toBe("informational");
    expect(buildSourceConflictReviewModel(result).availableActions).toContain("preserve_as_temporal_change");
  });

  it("blocks identity-dependent processing for possible wrong Property or duplicate identity conflicts", () => {
    const result = evaluateSourceConflict(createSourceConflictRequest({
      workspaceId: "workspace-1",
      subjectType: "duplicate_identity",
      targetField: "property_identity",
      proposedValues: [
        { role: "proposal", rawValue: "123 Main St" },
        { role: "proposal", rawValue: "123 Main St Unit 2" },
      ],
      duplicateContext: { hasIdentityConflict: true, conflictingSignals: ["Unit differs"] },
    }));

    expect(result.classification).toBe("identity_conflict");
    expect(result.materialityTier).toBe("blocking_identity");
    expect(result.downstreamSafety.allowsDealCreation).toBe(false);
    expect(buildSourceConflictReviewModel(result).availableActions).toEqual(["return_to_identity_review", "cancel_intake_action", "defer"]);
  });

  it("detects conflicting source classifications before routing extraction", () => {
    const result = evaluateSourceConflict(createSourceConflictRequest({
      workspaceId: "workspace-1",
      subjectType: "source_classification",
      targetField: "source_classification",
      proposedValues: [
        { role: "proposal", proposalId: "proposal-1", rawValue: "listing", sourceClassification: classificationForListingUrl("https://example.com/listing/1") },
        { role: "proposal", proposalId: "proposal-2", rawValue: "inspection", sourceClassification: classificationForEvidenceFile({ originalFilename: "home inspection report.pdf", detectedMimeType: "application/pdf" }) },
      ],
    }));

    expect(result.classification).toBe("material_conflict");
    expect(result.materialityTier).toBe("review");
    expect(result.sourceSummaries.map((summary) => summary.sourceClass).sort()).toEqual(["inspection_report", "listing_url"]);
  });

  it("creates conflict requests from existing intake proposal shapes without a second proposal model", () => {
    const request = createProposalConflictRequest({
      workspaceId: "workspace-1",
      subjectType: "listing_value",
      targetField: "asking_price",
      currentAccepted: { role: "accepted", rawValue: "250000", acceptedValueVersion: 1 },
      proposals: [
        { id: "proposal-ignored", canonicalField: "address", normalizedValue: "123 Main St" },
        { id: "proposal-kept", canonicalField: "asking_price", normalizedValue: "255000", sourceKey: "listing_url" },
      ],
    });

    expect(request.proposedValues).toHaveLength(1);
    expect(request.proposedValues[0]?.proposalId).toBe("proposal-kept");
    expect(evaluateSourceConflict(request).classification).toBe("material_conflict");
  });

  it("orders conflicts deterministically by blocking impact before informational differences", () => {
    const identityRequest = createSourceConflictRequest({
      workspaceId: "workspace-1",
      subjectType: "property_identity",
      targetField: "parcel_id",
      proposedValues: [{ role: "proposal", rawValue: "A" }, { role: "proposal", rawValue: "B" }],
    });
    const informationalRequest = createSourceConflictRequest({
      workspaceId: "workspace-1",
      subjectType: "property",
      targetField: "tax_amount",
      proposedValues: [{ role: "proposal", rawValue: "1200", period: "annual" }, { role: "proposal", rawValue: "100", period: "monthly" }],
    });

    expect(evaluateSourceConflicts([informationalRequest, identityRequest])[0]?.classification).toBe("identity_conflict");
  });

  it("validates explicit resolution actions and stale accepted-value versions", () => {
    const conflict = evaluateSourceConflict(createSourceConflictRequest({
      workspaceId: "workspace-1",
      subjectType: "property",
      targetField: "asking_price",
      currentAccepted: { role: "accepted", rawValue: "250000", acceptedValueVersion: 5 },
      proposedValues: [{ role: "proposal", proposalId: "proposal-1", rawValue: "245000" }],
    }));

    expect(() => resolveSourceConflict(conflict, {
      conflictId: conflict.conflictId,
      workspaceId: "workspace-1",
      idempotencyKey: "conflict-resolution:1",
      action: "accept_proposal",
      acceptedValueVersion: 4,
      selectedProposalId: "proposal-1",
      rationaleCategory: "source_preferred",
    })).toThrow("STALE_CONFLICT_RESOLUTION");

    const resolved = resolveSourceConflict(conflict, {
      conflictId: conflict.conflictId,
      workspaceId: "workspace-1",
      idempotencyKey: "conflict-resolution:2",
      action: "accept_proposal",
      acceptedValueVersion: 5,
      selectedProposalId: "proposal-1",
      rationaleCategory: "source_preferred",
    });

    expect(resolved).toMatchObject({
      action: "accept_proposal",
      lifecycleState: "resolved",
      priorAcceptedVersion: 5,
      resultingAcceptedVersion: 6,
      requiresCanonicalMutation: true,
    });
  });

  it("records conflicts and resolutions through server-owned RPC boundaries", async () => {
    rpc
      .mockResolvedValueOnce({ data: [{ source_conflict_id: "conflict-row", conflict_key: "abc", lifecycle_state: "detected", idempotency_key_out: "conflict:1" }], error: null })
      .mockResolvedValueOnce({ data: [{ source_conflict_resolution_id: "resolution-row", source_conflict_id: "conflict-row", conflict_key: "abc", resolution_action: "defer", lifecycle_state: "deferred", idempotency_key_out: "resolution:1" }], error: null });

    const conflict = evaluateSourceConflict(createSourceConflictRequest({
      workspaceId: "workspace-1",
      subjectType: "property",
      targetField: "asking_price",
      proposedValues: [{ role: "proposal", proposalId: "proposal-1", rawValue: "1" }, { role: "proposal", proposalId: "proposal-2", rawValue: "2" }],
    }));

    await recordSourceConflict("workspace-1", "conflict:1", conflict);
    await recordSourceConflictResolution("workspace-1", {
      conflictId: conflict.conflictId,
      workspaceId: "workspace-1",
      idempotencyKey: "resolution:1",
      action: "defer",
      rationaleCategory: "needs_more_evidence",
    });

    expect(rpc).toHaveBeenNthCalledWith(1, "record_source_conflict", expect.objectContaining({
      target_workspace_id: "workspace-1",
      idempotency_key: "conflict:1",
      conflict_input: expect.objectContaining({
        ruleRegistryVersion: SOURCE_CONFLICT_RULE_REGISTRY_VERSION,
        classification: "material_conflict",
      }),
    }));
    expect(rpc).toHaveBeenNthCalledWith(2, "record_source_conflict_resolution", expect.objectContaining({
      target_workspace_id: "workspace-1",
      target_conflict_key: conflict.conflictId,
      resolution_input: expect.objectContaining({ action: "defer" }),
    }));
  });
});
