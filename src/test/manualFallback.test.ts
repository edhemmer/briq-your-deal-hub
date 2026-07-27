import { describe, expect, it } from "vitest";
import { createEmailManualFallback } from "../core/emailIntake";
import { createFileEvidenceManualFallback } from "../core/fileEvidenceIntake";
import { createListingUrlManualFallback, normalizeListingImportResult } from "../core/listingUrlIntake";
import {
  canonicalManualFallbackPath,
  completeManualFallback,
  completeManualFallbackField,
  createManualFallbackPlan,
  manualFallbackEvents,
  manualFallbackReviewModel,
  manualFallbackSources,
  manualFallbackStates,
} from "../core/manualFallback";
import { createManualIntakeDraft } from "../core/propertyIntake";
import type { SourceConflictResult } from "../core/sourceConflicts";
import type { EmailIntakeImportResult, FileEvidenceImportResult, FileEvidenceProposal, ListingUrlProposal } from "../core/types";

const listingProposal: ListingUrlProposal = {
  id: "proposal-address",
  field: "address",
  label: "Address",
  rawValue: "100 Main St",
  normalizedValue: "100 Main St",
  displayValue: "100 Main St",
  classification: "source_backed_candidate",
  verificationState: "unverified",
  confidence: 82,
  status: "pending",
  sourceKey: "listing",
  evidenceRule: "Listing candidate",
};

function draft() {
  return { ...createManualIntakeDraft(), id: "draft-1", opportunityName: "100 Main St", intendedStrategy: "owner_occupant" as const };
}

describe("canonical manual fallback engine", () => {
  it("supports every requested fallback source and state without adding provider credentials", () => {
    expect(manualFallbackSources).toEqual([
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
    ]);
    expect(manualFallbackStates).toEqual([
      "automatic",
      "partial",
      "requires_review",
      "manual_required",
      "manual_in_progress",
      "manual_completed",
      "manual_cancelled",
    ]);
    expect(manualFallbackEvents).toEqual(["manual.fallback_started", "manual.field_completed", "manual.fallback_completed"]);
  });

  it("keeps the canonical creation path on existing manual intake only", () => {
    expect(canonicalManualFallbackPath).toEqual([
      "existing_manual_intake_draft",
      "existing_source_recording",
      "existing_proposal_acceptance",
      "existing_duplicate_detection",
      "existing_canonical_property_creation",
      "existing_canonical_deal_creation",
      "existing_evidence_attachment",
      "existing_domain_events",
      "existing_audit",
    ]);
  });

  it("shows exactly unresolved fields without asking for accepted fields again", () => {
    const plan = createManualFallbackPlan({
      source: "listing_url",
      draft: { ...draft(), address: "100 Main St" },
      proposals: [{ ...listingProposal, status: "accepted" }],
      requiredFields: ["opportunityName", "address", "propertyType"],
    });

    const review = manualFallbackReviewModel(plan);
    expect(review.sections.accepted.map((field) => field.field)).toContain("address");
    expect(review.sections.missing.map((field) => field.field)).toContain("propertyType");
    expect(plan.unresolvedFields.map((field) => field.field)).toEqual(["propertyType"]);
    expect(plan.fields.find((field) => field.field === "address")).toMatchObject({ locked: true, editable: false });
  });

  it("does not overwrite accepted values when manual fallback completes another field", () => {
    const plan = createManualFallbackPlan({
      source: "listing_url",
      draft: { ...draft(), address: "User accepted address" },
      proposals: [{ ...listingProposal, normalizedValue: "Automation address", displayValue: "Automation address", status: "accepted" }],
      requiredFields: ["address", "propertyType"],
    });

    const updated = completeManualFallbackField(plan, "propertyType", "Single Family", "2026-07-27T12:00:00.000Z");
    expect(updated.draft.address).toBe("User accepted address");
    expect(updated.draft.propertyType).toBe("Single Family");
    expect(updated.events.map((event) => event.type)).toEqual(["manual.fallback_started", "manual.field_completed"]);
  });

  it("preserves rejected and deferred proposals instead of reusing them as facts", () => {
    const plan = createManualFallbackPlan({
      source: "file_intake",
      draft: draft(),
      proposals: [
        { ...listingProposal, id: "rejected", status: "rejected", normalizedValue: "Rejected address" },
        { ...listingProposal, id: "deferred", field: "asking_price", label: "Asking price", status: "deferred", normalizedValue: "250000", displayValue: "$250,000" },
      ],
      requiredFields: ["address", "askingPrice"],
    });

    expect(plan.fields.find((field) => field.field === "address")).toMatchObject({ status: "missing", editable: true });
    expect(plan.fields.find((field) => field.field === "askingPrice")).toMatchObject({ status: "deferred", editable: false });
    expect(plan.sourceEvidence.map((evidence) => evidence.id)).toEqual(expect.arrayContaining(["proposal:rejected", "proposal:deferred"]));
  });

  it("blocks conflicted fields until source conflict resolution", () => {
    const conflict = {
      targetField: "address",
      classification: "material_conflict",
      lifecycleState: "detected",
    } as SourceConflictResult;
    const plan = createManualFallbackPlan({
      source: "email_intake",
      draft: { ...draft(), address: "100 Main St" },
      conflicts: [conflict],
      requiredFields: ["address"],
    });

    expect(plan.state).toBe("requires_review");
    expect(plan.fields[0]).toMatchObject({ status: "conflicted", blocked: true, editable: false });
    expect(() => completeManualFallbackField(plan, "address", "101 Main St")).toThrow(/proposal or conflict review/);
  });

  it("completes only after required unresolved fields are manually finished", () => {
    const plan = createManualFallbackPlan({ source: "manual_intake", draft: draft(), requiredFields: ["address"] });
    expect(() => completeManualFallback(plan)).toThrow(/Complete unresolved/);

    const updated = completeManualFallbackField(plan, "address", "100 Main St");
    expect(completeManualFallback(updated).events.map((event) => event.type)).toEqual([
      "manual.fallback_started",
      "manual.field_completed",
      "manual.fallback_completed",
    ]);
  });

  it("connects URL, file, image, document, and email intake to the same fallback contract", () => {
    const listingImport = normalizeListingImportResult({
      originalUrl: "https://example.com/listing",
      normalizedUrl: "https://example.com/listing",
      proposals: [listingProposal],
    });
    const fileImport = fileEvidence("file");
    const imageImport = fileEvidence("image");
    const documentImport = fileEvidence("document");
    const emailImport: EmailIntakeImportResult = {
      intakeId: "email-intake",
      sourceRecordId: "email-source-record",
      emailSourceId: "email-source",
      status: "partially_complete",
      safeMessage: "Email saved.",
      toAddresses: [],
      ccAddresses: [],
      bccAddresses: [],
      bodyHash: "body-hash",
      receivedHeaderCount: 0,
      attachmentCount: 0,
      importedAt: "2026-07-27T12:00:00.000Z",
      sourceClassification: listingImport.sourceClassification,
      attachments: [],
      proposals: [listingProposal as FileEvidenceProposal],
    };

    expect(createListingUrlManualFallback(draft(), listingImport).source).toBe("listing_url");
    expect(createFileEvidenceManualFallback(draft(), fileImport).source).toBe("file_intake");
    expect(createFileEvidenceManualFallback(draft(), imageImport).source).toBe("image_intake");
    expect(createFileEvidenceManualFallback(draft(), documentImport).source).toBe("document_intake");
    expect(createEmailManualFallback(draft(), emailImport).source).toBe("email_intake");
  });
});

function fileEvidence(evidenceType: FileEvidenceImportResult["evidenceType"]): FileEvidenceImportResult {
  return {
    evidenceId: `evidence-${evidenceType}`,
    intakeId: `intake-${evidenceType}`,
    sourceRecordId: `source-${evidenceType}`,
    status: "partially_complete",
    safeMessage: "Evidence saved.",
    originalFilename: `${evidenceType}.pdf`,
    sanitizedFilename: `${evidenceType}.pdf`,
    detectedMimeType: "application/pdf",
    evidenceType,
    byteSize: 120,
    contentHash: `hash-${evidenceType}`,
    uploadedAt: "2026-07-27T12:00:00.000Z",
    extractionStatus: "partially_complete",
    sourceClassification: createManualFallbackPlan({ source: "manual_intake", draft: draft() }).sourceClassification,
    proposals: [listingProposal as FileEvidenceProposal],
  };
}
