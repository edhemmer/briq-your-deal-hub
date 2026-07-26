import { describe, expect, it } from "vitest";
import { applyEmailProposal, attachEmailImportToDraft, emailProposalSummary, normalizeEmailIntakeImportResult, validateEmailInput } from "../core/emailIntake";
import { createManualIntakeDraft } from "../core/propertyIntake";

describe("email intake helpers", () => {
  it("validates pasted email and supported email files", () => {
    expect(validateEmailInput("lead.eml", new TextEncoder().encode("Subject: Lead\n\n123 Main St"))).toBe(true);
    expect(validateEmailInput("paste.txt", new Uint8Array(), "Subject: Lead\n\n123 Main St")).toBe(true);
    expect(() => validateEmailInput("lead.pdf", new TextEncoder().encode("not email"))).toThrow(/pasted email text/i);
    expect(() => validateEmailInput("empty.eml", new Uint8Array())).toThrow(/not empty/i);
  });

  it("normalizes email import results and keeps proposals unverified", () => {
    const result = normalizeEmailIntakeImportResult({
      intakeId: "i1",
      sourceRecordId: "s1",
      emailSourceId: "m1",
      status: "complete",
      safeMessage: "Email saved.",
      subject: "Property lead",
      fromAddress: "agent@example.com",
      toAddresses: ["buyer@example.com"],
      bodyHash: "a".repeat(64),
      receivedHeaderCount: 1,
      attachmentCount: 1,
      importedAt: "2026-07-26T00:00:00.000Z",
      attachments: [{ attachmentId: "a1", originalFilename: "listing.pdf", status: "imported", safeMessage: "Attachment preserved." }],
      proposals: [{
        id: "email:address:1",
        field: "address",
        label: "Address",
        rawValue: "123 Main St",
        normalizedValue: "123 Main St",
        displayValue: "123 Main St",
        classification: "source_backed_candidate",
        confidence: 70,
        status: "pending",
      }],
    });

    expect(result.emailSourceId).toBe("m1");
    expect(result.attachments[0].status).toBe("imported");
    expect(result.proposals[0].verificationState).toBe("unverified");
  });

  it("attaches email source to draft and accepts proposals only into blank fields", () => {
    const draft = createManualIntakeDraft();
    const withEmail = attachEmailImportToDraft(draft, {
      intakeId: "i1",
      sourceRecordId: "s1",
      emailSourceId: "m1",
      status: "complete",
      safeMessage: "Email saved.",
      toAddresses: [],
      ccAddresses: [],
      bccAddresses: [],
      bodyHash: "b".repeat(64),
      receivedHeaderCount: 0,
      attachmentCount: 0,
      importedAt: "2026-07-26T00:00:00.000Z",
      attachments: [],
      proposals: [{
        id: "email:address:1",
        field: "address",
        label: "Address",
        rawValue: "123 Main St",
        normalizedValue: "123 Main St",
        displayValue: "123 Main St",
        classification: "source_backed_candidate",
        verificationState: "unverified",
        confidence: 70,
        status: "pending",
        sourceKey: "email_source",
        evidenceRule: "Verify.",
      }],
    });

    expect(emailProposalSummary(withEmail.emailProposals).pending).toBe(1);
    const accepted = applyEmailProposal(withEmail, "email:address:1", "accepted");
    expect(accepted.address).toBe("123 Main St");
    expect(emailProposalSummary(accepted.emailProposals).accepted).toBe(1);
  });
});
