import { describe, expect, it, vi } from "vitest";
import { applyListingProposal, attachListingImportToDraft, normalizeListingImportResult, proposalSummary } from "../core/listingUrlIntake";
import { createManualIntakeDraft, manualIntakeInput, normalizeManualIntakeDraft } from "../core/propertyIntake";

vi.mock("../core/supabase", () => ({
  invokeBrixFunction: vi.fn(),
}));

describe("Specification 004 listing URL intake contract", () => {
  it("normalizes server import results into pending proposals", () => {
    const result = normalizeListingImportResult({
      originalUrl: "https://www.zillow.com/homedetails/169-Sandalwood-Ln-Bolingbrook-IL-60440/5397652_zpid/",
      normalizedUrl: "https://www.zillow.com/homedetails/169-Sandalwood-Ln-Bolingbrook-IL-60440/5397652_zpid/",
      sourceKey: "zillow_public_listing",
      sourceDisplayName: "Public listing URL",
      supportLevel: "limited",
      retrievalMethod: "url_metadata",
      adapterVersion: "listing-url-v1",
      status: "partially_complete",
      retrievedAt: "2026-07-25T12:00:00.000Z",
      safeMessage: "Review candidates.",
      licensingNotes: "metadata only",
      proposals: [{ id: "p1", field: "address", normalizedValue: "169 Sandalwood Ln", confidence: 68 }],
    });

    expect(result.supportLevel).toBe("limited");
    expect(result.proposals[0].status).toBe("pending");
    expect(result.proposals[0].verificationState).toBe("unverified");
  });

  it("attaches listing URL imports to manual drafts without overwriting user edits", () => {
    const draft = { ...createManualIntakeDraft(), address: "User Typed Address" };
    const imported = attachListingImportToDraft(draft, normalizeListingImportResult({
      originalUrl: "https://www.zillow.com/homedetails/169-Sandalwood-Ln-Bolingbrook-IL-60440/5397652_zpid/",
      normalizedUrl: "https://www.zillow.com/homedetails/169-Sandalwood-Ln-Bolingbrook-IL-60440/5397652_zpid/",
      sourceKey: "zillow_public_listing",
      sourceDisplayName: "Public listing URL",
      supportLevel: "limited",
      retrievalMethod: "url_metadata",
      adapterVersion: "listing-url-v1",
      status: "partially_complete",
      retrievedAt: "2026-07-25T12:00:00.000Z",
      safeMessage: "Review candidates.",
      licensingNotes: "metadata only",
      proposals: [{ id: "address", field: "address", normalizedValue: "169 Sandalwood Ln", confidence: 68 }],
    }));
    const accepted = applyListingProposal(imported, "address", "accepted");

    expect(accepted.address).toBe("User Typed Address");
    expect(accepted.sourceUrl).toContain("zillow.com");
    expect(proposalSummary(accepted.listingProposals).accepted).toBe(1);
  });

  it("sends listing import and proposal decisions through the existing manual intake payload", () => {
    const draft = normalizeManualIntakeDraft({
      ...createManualIntakeDraft(),
      opportunityName: "Listing lead",
      address: "169 Sandalwood Ln",
      sourceUrl: "https://www.zillow.com/homedetails/169-Sandalwood-Ln-Bolingbrook-IL-60440/5397652_zpid/",
      listingProposals: [{ id: "address", field: "address", normalizedValue: "169 Sandalwood Ln", displayValue: "169 Sandalwood Ln", status: "accepted" }],
    });

    expect(draft).not.toBeNull();
    const input = manualIntakeInput(draft!);
    expect(input.source_url).toContain("zillow.com");
    expect(input.listing_proposals).toHaveLength(1);
    expect(input.listing_proposals[0].status).toBe("accepted");
  });
});
