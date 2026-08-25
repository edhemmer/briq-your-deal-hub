import { describe, expect, it } from "vitest";

import {
  CONTRACTIQ_DOCUMENT_ANALYSIS_CONTRACT_VERSION,
  CONTRACTIQ_EXTRACTION_CONTRACT_VERSION,
  classifyContractDocument,
  contractAnalysisStateAfterProviderFailure,
  detectContractExtractionConflicts,
  deterministicContractExtractionHash,
  proposeContractBaseMatch,
  proposeContractPartyMatch,
  validateContractExtractionCandidate,
  validateContractPartyExtraction,
  type ContractExtractionCandidate,
} from "../core/contractIQ";
import { classificationForEvidenceFile } from "../core/sourceClassification";

const providerMetadata = {
  providerId: "deterministic_fixture",
  method: "deterministic_fixture" as const,
};

const baseExtraction: ContractExtractionCandidate = {
  contractVersion: CONTRACTIQ_EXTRACTION_CONTRACT_VERSION,
  contractId: "contract-1",
  evidenceId: "evidence-1",
  extractionType: "economic_term",
  normalizedType: "purchase_price",
  rawSourceRef: "clause:2",
  sourceAnchor: { kind: "clause", page: 2, clause: "2" },
  proposedNormalizedValue: { amount: 350000, currency: "USD" },
  displayValue: "$350,000",
  currency: "USD",
  confidence: 86,
  verificationState: "source_backed",
  ambiguityState: "none",
  applicablePerspective: "buyer",
  warnings: [],
  providerMetadata,
  currentnessState: "current_candidate",
};

describe("ContractIQ Slice 2 document extraction contract", () => {
  it("classifies supported real estate document families from source text, not filename alone", () => {
    const cases = [
      ["Residential Real Estate Purchase Agreement between Buyer and Seller with purchase price", "purchase_agreement"],
      ["Commercial purchase agreement for acquisition of industrial property", "purchase_agreement"],
      ["Counteroffer to purchase agreement", "counteroffer"],
      ["First Amendment to Purchase Agreement Section 4.2 deleted and replaced", "amendment"],
      ["Inspection Addendum containing inspection contingency", "addendum"],
      ["Financing Addendum and financing contingency", "addendum"],
      ["Attorney review notice delivered after contract", "other"],
      ["Residential Lease between Landlord and Tenant", "residential_lease"],
      ["Commercial Lease for retail premises", "commercial_lease"],
      ["Guaranty signed by guarantor", "guaranty"],
      ["Loan Agreement between borrower and lender", "loan_agreement"],
      ["Promissory Note secured by mortgage", "promissory_note"],
      ["Mortgage and deed of trust", "mortgage_deed_of_trust"],
      ["Title Commitment Schedule B", "title_commitment"],
      ["Plat of survey", "survey"],
      ["ALTA settlement statement", "settlement_statement"],
      ["Warranty deed", "deed"],
      ["Repair agreement and construction change order", "service_agreement"],
      ["Unusual transaction letter with unclear purpose", "other"],
    ] as const;

    for (const [extractedText, expectedType] of cases) {
      const result = classifyContractDocument({ extractedText, sourceAnchor: { kind: "page", page: 1 } });
      expect(result.contractVersion).toBe(CONTRACTIQ_DOCUMENT_ANALYSIS_CONTRACT_VERSION);
      expect(result.proposedContractType).toBe(expectedType);
      expect(result.classificationState).toMatch(/classified_proposed|manual_review_required/);
    }

    const misleadingFilename = classifyContractDocument({ filename: "signed-purchase-agreement.pdf", sourceAnchor: { kind: "attachment" } });
    expect(misleadingFilename.classificationState).toBe("insufficient_content");
    expect(misleadingFilename.warnings).toContain("Filename alone is not authoritative for ContractIQ classification.");
  });

  it("keeps governance-owned HOA documents out of ContractIQ routing", () => {
    const result = classifyContractDocument({
      extractedText: "Declaration of Covenants Conditions and Restrictions for the Homeowners Association",
      sourceAnchor: { kind: "page", page: 1 },
    });

    expect(result.classificationState).toBe("manual_review_required");
    expect(result.warnings[0]).toMatch(/GovernanceIQ/);

    const ccr = classificationForEvidenceFile({ originalFilename: "hoa-ccrs.pdf", detectedMimeType: "application/pdf" });
    expect(ccr.supportedDownstreamModules).toContain("governanceiq");
    expect(ccr.supportedDownstreamModules).not.toContain("contractiq");
  });

  it("validates source-linked extraction and rejects raw text, legal conclusions, downstream mutation, and calculated deadlines", () => {
    const validated = validateContractExtractionCandidate(baseExtraction);
    expect(validated.proposedNormalizedValue).toEqual({ amount: 350000, currency: "USD" });
    expect(Object.isFrozen(validated)).toBe(true);

    expect(() => validateContractExtractionCandidate({ ...baseExtraction, sourceAnchor: { kind: "raw_full_text" as "page" } })).toThrow("SOURCE_ANCHOR_INCOMPLETE");
    expect(() => validateContractExtractionCandidate({ ...baseExtraction, proposedNormalizedValue: { legalConclusion: true } })).toThrow(/legal authority/);
    expect(() => validateContractExtractionCandidate({ ...baseExtraction, proposedNormalizedValue: { financeIqMutation: true } })).toThrow(/downstream/);
    expect(() => validateContractExtractionCandidate({ ...baseExtraction, proposedNormalizedValue: { calculatedDueAt: "2026-09-01" } })).toThrow(/deadline/);
  });

  it("preserves party, signature, period, unit, and assignment exception details without silent canonical merge", () => {
    const party = validateContractPartyExtraction({
      legalName: "Smoke Seller LLC",
      displayName: "Smoke Seller LLC",
      entityType: "organization",
      partyRole: "seller",
      authorityCapacity: "manager",
      signatureStatus: "signed",
      signatureDate: "2026-08-25",
      signatoryName: "Sam Seller",
      initialsPresent: true,
    });
    const match = proposeContractPartyMatch({
      matchState: "ambiguous_match",
      targetType: "organization",
      targetId: "organization-1",
      deterministicSignals: ["normalized_name_match", "deal_relationship_overlap"],
      confidence: 78,
      sourceAnchor: { kind: "signature_block", page: 14 },
    });
    const assignment = validateContractExtractionCandidate({
      ...baseExtraction,
      extractionType: "assignment_transfer",
      normalizedType: "affiliate_assignment",
      proposedNormalizedValue: {
        assignmentAllowed: true,
        consentRequired: false,
        exception: "Buyer may assign to an affiliate without Seller consent.",
      },
      displayValue: "Buyer may assign to an affiliate without Seller consent.",
      sourceAnchor: { kind: "clause", page: 8, clause: "13" },
    });
    const financing = validateContractExtractionCandidate({
      ...baseExtraction,
      extractionType: "financing_term",
      normalizedType: "rate_ceiling",
      proposedNormalizedValue: { rate: 7.25, unit: "percent", ceiling: true, basis: "annual" },
      unit: "percent",
      sourceAnchor: { kind: "clause", page: 5, clause: "6" },
    });

    expect(party.signatureStatus).toBe("signed");
    expect(match.matchState).toBe("ambiguous_match");
    expect(assignment.proposedNormalizedValue).toMatchObject({ consentRequired: false });
    expect(financing.proposedNormalizedValue).not.toHaveProperty("basisPoints");
  });

  it("models contingency proposals without calculating authoritative deadlines", () => {
    const contingency = validateContractExtractionCandidate({
      ...baseExtraction,
      extractionType: "contingency",
      normalizedType: "inspection",
      proposedNormalizedValue: {
        trigger: "contract execution",
        offsetValue: 10,
        offsetUnit: "business_days",
        satisfactionLanguage: "Buyer may terminate before expiration.",
        timezoneSourceLocation: "property",
      },
      displayValue: "10 business days after execution",
      unit: "business_days",
      sourceAnchor: { kind: "clause", page: 4, clause: "8" },
    });

    expect(contingency.proposedNormalizedValue.offsetUnit).toBe("business_days");
    expect(contingency.proposedNormalizedValue).not.toHaveProperty("calculatedDueAt");
  });

  it("proposes amendment base matches and supersession candidates from explicit source evidence only", () => {
    const base = proposeContractBaseMatch({
      matchState: "likely_base_match",
      baseContractId: "contract-base",
      evidenceSignals: ["referenced_agreement_title", "referenced_agreement_date", "same_property"],
      sourceAnchor: { kind: "clause", page: 1, clause: "Recitals" },
      confidence: 82,
      professionalReviewRequired: true,
    });

    expect(base.evidenceSignals).toEqual(["referenced_agreement_date", "referenced_agreement_title", "same_property"]);
    expect(() =>
      proposeContractBaseMatch({
        matchState: "likely_base_match",
        evidenceSignals: [],
        sourceAnchor: { kind: "reference" },
        confidence: 20,
        professionalReviewRequired: true,
      }),
    ).toThrow(/upload order/);
  });

  it("detects conflicts while preserving both source-backed candidates", () => {
    const amendedPrice: ContractExtractionCandidate = {
      ...baseExtraction,
      evidenceId: "evidence-amendment",
      proposedNormalizedValue: { amount: 340000, currency: "USD" },
      sourceAnchor: { kind: "clause", page: 1, clause: "2" },
    };

    const conflicts = detectContractExtractionConflicts([baseExtraction, amendedPrice]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({
      conflictType: "purchase_price_conflict",
      professionalReviewRequired: true,
    });
    expect(conflicts[0]).not.toHaveProperty("winner");
  });

  it("preserves prior valid analysis on provider failure and keeps idempotency tied to source/version/provider", () => {
    const failure = contractAnalysisStateAfterProviderFailure({ hasPriorValidRun: true, errorCode: "provider_timeout" });
    const hashA = deterministicContractExtractionHash({
      evidenceHash: "abc",
      evidenceVersion: 1,
      analysisContractVersion: CONTRACTIQ_EXTRACTION_CONTRACT_VERSION,
      providerId: "deterministic_fixture",
      providerMethod: "provider_structured",
    });
    const hashB = deterministicContractExtractionHash({
      evidenceHash: "abc",
      evidenceVersion: 2,
      analysisContractVersion: CONTRACTIQ_EXTRACTION_CONTRACT_VERSION,
      providerId: "deterministic_fixture",
      providerMethod: "provider_structured",
    });

    expect(failure).toMatchObject({ analysisState: "failed_with_prior_analysis", priorValidPreserved: true });
    expect(hashA).not.toBe(hashB);
  });
});
