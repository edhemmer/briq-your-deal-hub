import { describe, expect, it } from "vitest";
import {
  CANONICAL_SOURCE_CLASSES,
  SOURCE_CLASSIFICATION_VERSION,
  classificationForEmailAttachment,
  classificationForEmailSource,
  classificationForEvidenceFile,
  classificationForListingUrl,
  classificationForManualDraft,
  classificationForPackageSource,
  classifySource,
  sourceClassificationRegistry,
} from "../core/sourceClassification";
import { normalizeListingImportResult } from "../core/listingUrlIntake";
import { normalizeEmailIntakeImportResult } from "../core/emailIntake";
import { normalizeFileEvidenceImportResult } from "../core/fileEvidenceIntake";

describe("canonical source classification", () => {
  it("publishes a complete, deterministic registry for every supported source class", () => {
    const registry = sourceClassificationRegistry();
    expect(Object.keys(registry).sort()).toEqual([...CANONICAL_SOURCE_CLASSES].sort());
    expect(CANONICAL_SOURCE_CLASSES).toHaveLength(new Set(CANONICAL_SOURCE_CLASSES).size);
    for (const sourceClass of CANONICAL_SOURCE_CLASSES) {
      expect(registry[sourceClass].canonicalSubtype).toBeTruthy();
      expect(registry[sourceClass].eligibility.supportedDownstreamModules).toContain("intake");
    }
  });

  it("classifies manual sources without assigning extraction engines", () => {
    const classification = classificationForManualDraft({ source: "User entered from notebook" });
    expect(classification).toMatchObject({
      canonicalClass: "manual",
      canonicalSubtype: "user_entered",
      confidenceTier: "exact",
      classificationVersion: SOURCE_CLASSIFICATION_VERSION,
      classificationMethod: "source_type",
      reviewStatus: "needs_review",
    });
    expect(classification.allowedExtractionEngines).toEqual(["manual_review"]);
  });

  it("classifies listing URLs as listing identity only", () => {
    const classification = classificationForListingUrl("https://example.com/listing/123");
    expect(classification.canonicalClass).toBe("listing_url");
    expect(classification.allowedExtractionEngines).toEqual(["listing_parser", "manual_review"]);
    expect(classification.supportedDownstreamModules).toEqual(expect.arrayContaining(["intake", "dealiq"]));
  });

  it("classifies email and routes it only to email parser and attachment routing", () => {
    const classification = classificationForEmailSource({ subject: "Seller package" });
    expect(classification.canonicalClass).toBe("email");
    expect(classification.allowedExtractionEngines).toEqual(["email_parser", "attachment_routing"]);
    expect(classification.allowedExtractionEngines).not.toContain("contractiq");
    expect(classification.allowedExtractionEngines).not.toContain("vision");
  });

  it("classifies attachments using specific document keywords before the generic attachment class", () => {
    expect(classificationForEmailAttachment({ originalFilename: "roof inspection report.pdf" }).canonicalClass).toBe("roof_report");
    expect(classificationForEmailAttachment({ originalFilename: "seller-package-attachment.bin" }).canonicalClass).toBe("attachment");
  });

  it("classifies file evidence and photos without enabling ContractIQ", () => {
    const inspection = classificationForEvidenceFile({ originalFilename: "general inspection report.pdf", detectedMimeType: "application/pdf", evidenceType: "document" });
    expect(inspection.canonicalClass).toBe("inspection_report");
    expect(inspection.allowedExtractionEngines).toEqual(["ocr", "condition_engine", "repair_engine"]);
    expect(inspection.allowedExtractionEngines).not.toContain("contractiq");

    const photo = classificationForEvidenceFile({ originalFilename: "front-elevation.jpg", detectedMimeType: "image/jpeg", evidenceType: "image" });
    expect(photo.canonicalClass).toBe("photo");
    expect(photo.allowedExtractionEngines).toEqual(["vision", "condition_engine", "damage_observation"]);
    expect(photo.allowedExtractionEngines).not.toContain("contractiq");
  });

  it("classifies spreadsheets and package sources consistently", () => {
    expect(classificationForPackageSource({ sourceType: "csv", originalFilename: "deals.csv" }).canonicalClass).toBe("spreadsheet");
    expect(classificationForPackageSource({ sourceType: "xlsx", originalFilename: "rent roll.xlsx" }).canonicalClass).toBe("spreadsheet");
    expect(classificationForPackageSource({ sourceType: "listing_url", sourceUrl: "https://example.com/a" }).canonicalClass).toBe("listing_url");
  });

  it("classifies mixed package members independently", () => {
    const sources = [
      classificationForPackageSource({ sourceType: "xlsx", originalFilename: "batch.xlsx" }).canonicalClass,
      classificationForPackageSource({ sourceType: "image", originalFilename: "kitchen.png", declaredMimeType: "image/png" }).canonicalClass,
      classificationForPackageSource({ sourceType: "document", originalFilename: "purchase contract.pdf" }).canonicalClass,
      classificationForPackageSource({ sourceType: "unknown", originalFilename: "seller-notes.bin" }).canonicalClass,
    ];
    expect(sources).toEqual(["spreadsheet", "photo", "purchase_contract", "unknown"]);
  });

  it("keeps future MLS classification dormant and review-required", () => {
    const classification = classifySource({ sourceType: "mls_listing", providerKind: "mls" });
    expect(classification.canonicalClass).toBe("mls_listing");
    expect(classification.processingEligibility.state).toBe("deferred");
    expect(classification.allowedExtractionEngines).toEqual([]);
    expect(classification.requiredReview).toBe(true);
  });

  it("falls back to unknown when a source cannot be identified", () => {
    const classification = classifySource({ sourceType: "file", originalFilename: "unlabeled.bin" });
    expect(classification.canonicalClass).toBe("unknown");
    expect(classification.confidenceTier).toBe("unknown");
    expect(classification.reviewStatus).toBe("needs_review");
  });

  it("is repeatable and versioned", () => {
    const first = classifySource({ sourceType: "document", originalFilename: "lease.pdf" });
    const second = classifySource({ sourceType: "document", originalFilename: "lease.pdf" });
    expect(first).toEqual(second);
    expect(first.classificationVersion).toBe(SOURCE_CLASSIFICATION_VERSION);
  });

  it("adds classification metadata to normalized listing, file, email, and attachment intake results", () => {
    expect(normalizeListingImportResult({
      originalUrl: "https://example.com/listing/1",
      normalizedUrl: "https://example.com/listing/1",
      proposals: [],
    }).sourceClassification.canonicalClass).toBe("listing_url");

    expect(normalizeFileEvidenceImportResult({
      evidenceId: "evidence-1",
      intakeId: "intake-1",
      sourceRecordId: "source-1",
      originalFilename: "inspection report.pdf",
      sanitizedFilename: "inspection-report.pdf",
      detectedMimeType: "application/pdf",
      contentHash: "hash-1",
      evidenceType: "document",
      proposals: [],
    }).sourceClassification.canonicalClass).toBe("inspection_report");

    const email = normalizeEmailIntakeImportResult({
      intakeId: "intake-1",
      sourceRecordId: "source-1",
      emailSourceId: "email-1",
      bodyHash: "body-hash",
      subject: "Listing agent reply",
      attachments: [{ attachmentId: "attachment-1", originalFilename: "rent roll.xlsx", detectedMimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }],
      proposals: [],
    });
    expect(email.sourceClassification.canonicalClass).toBe("email");
    expect(email.attachments[0]?.sourceClassification.canonicalClass).toBe("rent_roll");
  });
});
