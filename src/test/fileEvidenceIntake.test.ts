import { describe, expect, it } from "vitest";
import { applyFileEvidenceProposal, attachFileEvidenceToDraft, fileEvidenceProposalSummary, normalizeFileEvidenceImportResult, validateEvidenceFile } from "../core/fileEvidenceIntake";
import { createManualIntakeDraft } from "../core/propertyIntake";

describe("file Evidence intake helpers", () => {
  it("validates supported file sizes and rejects unsafe extensions", () => {
    expect(validateEvidenceFile("listing.txt", "text/plain", new TextEncoder().encode("123 Main St"))).toBe(true);
    expect(() => validateEvidenceFile("script.js", "text/javascript", new TextEncoder().encode("alert(1)"))).toThrow(/not supported/i);
    expect(() => validateEvidenceFile("empty.txt", "text/plain", new Uint8Array())).toThrow(/not empty/i);
  });

  it("normalizes the Edge Function result and keeps proposals unaccepted", () => {
    const result = normalizeFileEvidenceImportResult({
      evidenceId: "e1",
      intakeId: "i1",
      sourceRecordId: "s1",
      status: "partially_complete",
      safeMessage: "Evidence saved.",
      originalFilename: "listing.txt",
      sanitizedFilename: "listing.txt",
      detectedMimeType: "text/plain",
      evidenceType: "document",
      byteSize: 24,
      contentHash: "a".repeat(64),
      uploadedAt: "2026-07-25T00:00:00.000Z",
      extractionStatus: "partially_complete",
      proposals: [{
        id: "address:1",
        field: "address",
        label: "Address",
        rawValue: "123 Main St",
        normalizedValue: "123 Main St",
        displayValue: "123 Main St",
        classification: "source_backed_candidate",
        confidence: 72,
        status: "pending",
        sourceKey: "file_evidence",
        evidenceRule: "Verify.",
        sourceAnchor: { line: 1 },
      }],
    });

    expect(result.evidenceId).toBe("e1");
    expect(result.proposals[0].status).toBe("pending");
    expect(result.proposals[0].verificationState).toBe("unverified");
  });

  it("attaches file Evidence to the draft and applies only accepted proposals to blank fields", () => {
    const draft = createManualIntakeDraft();
    const withEvidence = attachFileEvidenceToDraft(draft, {
      evidenceId: "e1",
      intakeId: "i1",
      sourceRecordId: "s1",
      status: "partially_complete",
      safeMessage: "Evidence saved.",
      originalFilename: "listing.txt",
      sanitizedFilename: "listing.txt",
      detectedMimeType: "text/plain",
      evidenceType: "document",
      byteSize: 24,
      contentHash: "b".repeat(64),
      uploadedAt: "2026-07-25T00:00:00.000Z",
      extractionStatus: "partially_complete",
      proposals: [{
        id: "address:1",
        field: "address",
        label: "Address",
        rawValue: "123 Main St",
        normalizedValue: "123 Main St",
        displayValue: "123 Main St",
        classification: "source_backed_candidate",
        verificationState: "unverified",
        confidence: 72,
        status: "pending",
        sourceKey: "file_evidence",
        evidenceRule: "Verify.",
      }],
    });

    expect(fileEvidenceProposalSummary(withEvidence.fileEvidenceProposals).pending).toBe(1);
    const accepted = applyFileEvidenceProposal(withEvidence, "address:1", "accepted");
    expect(accepted.address).toBe("123 Main St");
    expect(fileEvidenceProposalSummary(accepted.fileEvidenceProposals).accepted).toBe(1);
  });
});
