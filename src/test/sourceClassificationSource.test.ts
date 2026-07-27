import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260727110000_canonical_source_classification.sql", "utf8");
const source = readFileSync("src/core/sourceClassification.ts", "utf8");
const listingIntake = readFileSync("src/core/listingUrlIntake.ts", "utf8");
const fileIntake = readFileSync("src/core/fileEvidenceIntake.ts", "utf8");
const emailIntake = readFileSync("src/core/emailIntake.ts", "utf8");
const packageIntake = readFileSync("src/core/packageBatchIntake.ts", "utf8");

describe("canonical source classification source contract", () => {
  it("does not activate extraction, MLS integration, OCR, AI, underwriting, or reports", () => {
    expect(source).not.toMatch(/invokeBrixFunction|openai|analyze|underwriting|scoreDeal|generateReport/i);
    expect(migration).not.toMatch(/extract-listing|process-evidence-upload|process-email-intake|provider credential|mls credential/i);
    expect(migration).toContain("This does not enable extraction, MLS access, OCR, AI, underwriting, or reports.");
  });

  it("adds classification columns to every existing source-bearing table", () => {
    for (const table of [
      "manual_source_records",
      "evidence_items",
      "email_sources",
      "email_source_attachments",
      "intake_batch_items",
    ]) {
      expect(migration).toContain(table);
    }
    for (const column of [
      "canonical_source_class",
      "canonical_source_subtype",
      "classification_confidence_tier",
      "classification_version",
      "classification_method",
      "classification_evidence",
      "classification_review_status",
      "processing_eligibility",
      "allowed_extraction_engines",
      "supported_downstream_modules",
    ]) {
      expect(migration).toContain(column);
    }
  });

  it("keeps classification server-owned through an authenticated workspace RPC", () => {
    expect(migration).toContain("create or replace function public.record_source_classification");
    expect(migration).toContain("security definer");
    expect(migration).toContain("auth.uid()");
    expect(migration).toContain("public.has_workspace_permission(target_workspace_id, 'deals:manage')");
    expect(migration).toContain("grant execute on function public.record_source_classification");
  });

  it("emits only the permitted classification events", () => {
    const eventMatches = [...migration.matchAll(/'([a-z_]+(?:\.[a-z_]+)+)'/g)].map((match) => match[1]).filter((event) => event.includes("classified") || event.includes("classification."));
    expect(new Set(eventMatches)).toEqual(new Set(["source.classified", "classification.changed", "classification.confirmed"]));
    expect(migration).not.toContain("source.extracted");
    expect(migration).not.toContain("source.analyzed");
  });

  it("routes required example classes to the correct engines and excludes incorrect engines", () => {
    expect(source).toContain("inspection_report: entry(\"general_inspection\", \"eligible\", [\"ocr\", \"condition_engine\", \"repair_engine\"]");
    expect(source).toContain("purchase_contract: entry(\"purchase_contract\", \"eligible\", [\"contractiq\", \"timeline_extraction\", \"clause_engine\", \"question_generator\"]");
    expect(source).toContain("photo: entry(\"uploaded_photo\", \"eligible\", [\"vision\", \"condition_engine\", \"damage_observation\"]");
    expect(source).toContain("email: entry(\"email_message\", \"eligible\", [\"email_parser\", \"attachment_routing\"]");
  });

  it("threads classification through existing intake normalization paths", () => {
    expect(listingIntake).toContain("classificationForListingUrl");
    expect(fileIntake).toContain("classificationForEvidenceFile");
    expect(emailIntake).toContain("classificationForEmailSource");
    expect(emailIntake).toContain("classificationForEmailAttachment");
    expect(packageIntake).toContain("classificationForPackageSource");
  });
});
