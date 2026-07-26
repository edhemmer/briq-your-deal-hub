import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260725203000_file_evidence_intake.sql", "utf8");
const edgeFunction = readFileSync("supabase/functions/process-evidence-upload/index.ts", "utf8");
const fileEvidence = readFileSync("src/core/fileEvidenceIntake.ts", "utf8");
const propertyIntake = readFileSync("src/core/propertyIntake.ts", "utf8");
const app = readFileSync("src/App.tsx", "utf8");

describe("Specification 004 file, image, and document intake source controls", () => {
  it("creates one private workspace-scoped Evidence model without direct client mutation", () => {
    expect(migration).toContain("insert into storage.buckets");
    expect(migration).toContain("'brix-evidence'");
    expect(migration).toContain("public, file_size_limit, allowed_mime_types");
    expect(migration).toContain("false");
    expect(migration).toContain("create table if not exists public.evidence_items");
    expect(migration).toContain("workspace_id uuid not null");
    expect(migration).toContain("content_hash text not null");
    expect(migration).toContain("storage_object_key text not null");
    expect(migration).toContain("unique (workspace_id, content_hash)");
    expect(migration).toContain("alter table public.evidence_items enable row level security");
    expect(migration).toContain("evidence items no direct insert");
    expect(migration).toContain("with check (false)");
  });

  it("extends canonical intake, source, proposal, and job records instead of creating another deal path", () => {
    expect(migration).toContain("create table if not exists public.intake_processing_jobs");
    expect(migration).toContain("alter table public.manual_source_records");
    expect(migration).toContain("add column if not exists evidence_id");
    expect(migration).toContain("drop not null");
    expect(migration).toContain("source_type in ('manual', 'listing_url', 'file', 'image', 'document')");
    expect(migration).toContain("alter table public.intake_value_proposals");
    expect(migration).toContain("source_anchor jsonb");
    expect(migration).toContain("record_file_evidence_intake_result");
    expect(migration).toContain("attach_file_evidence_to_deal");
    expect(migration).not.toContain("create or replace function public.create_file_evidence_deal");
  });

  it("uses server-controlled validation, hashing, duplicate detection, storage, and cleanup", () => {
    expect(edgeFunction).toContain("const MAX_BYTES = 5 * 1024 * 1024");
    expect(edgeFunction).toContain("detectSupportedFile(originalFilename, declaredMimeType, bytes)");
    expect(edgeFunction).toContain("sha256Hex(bytes)");
    expect(edgeFunction).toContain("findDuplicateEvidence(serviceClient, workspaceId, contentHash)");
    expect(edgeFunction).toContain(".from(BUCKET)");
    expect(edgeFunction).toContain(".upload(storageObjectKey, bytes");
    expect(edgeFunction).toContain(".remove([storageObjectKey])");
    expect(edgeFunction).toContain("record_file_evidence_intake_result");
    expect(edgeFunction).toContain("can_record_file_evidence_intake");
    expect(edgeFunction).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(edgeFunction).not.toContain("fetch(");
  });

  it("rejects unsafe files and does not claim OCR, AI, or photo-condition analysis", () => {
    expect(edgeFunction).toContain('"svg"');
    expect(edgeFunction).toContain('"heic"');
    expect(edgeFunction).toContain('"xlsm"');
    expect(edgeFunction).toContain('"docm"');
    expect(edgeFunction).toContain("isPdf(bytes)");
    expect(edgeFunction).toContain("isPng(bytes)");
    expect(edgeFunction).toContain("isJpeg(bytes)");
    expect(edgeFunction).toContain("isWebp(bytes)");
    expect(edgeFunction).toContain("Image preserved. Photo condition analysis belongs to PhotoIQ.");
    expect(edgeFunction).toContain("PDF preserved. Text extraction is deferred");
    expect(edgeFunction).not.toMatch(/openai|gpt-|vision model|ocr provider/i);
  });

  it("keeps extracted values as unverified proposals with Evidence and anchors", () => {
    expect(fileEvidence).toContain("normalizeFileEvidenceImportResult");
    expect(fileEvidence).toContain("verificationState");
    expect(fileEvidence).toContain("unverified");
    expect(fileEvidence).toContain("sourceAnchor");
    expect(fileEvidence).toContain("applyFileEvidenceProposal");
    expect(propertyIntake).toContain("file_evidence_import");
    expect(propertyIntake).toContain("file_evidence_proposals");
    expect(propertyIntake).toContain("attachFileEvidenceToDeal");
    expect(propertyIntake).toContain("evidence:");
  });

  it("adds a focused Evidence upload surface to the existing Add Deal flow", () => {
    expect(app).toContain("Evidence file");
    expect(app).toContain("Choose one file");
    expect(app).toContain("Upload Evidence");
    expect(app).toContain("Continue manually");
    expect(app).toContain("Extracted proposals");
    expect(app).toContain("Accept/edit");
    expect(app).toContain("Reject");
    expect(app).toContain("Import Email");
    expect(app).not.toContain("Share extension");
    expect(app).not.toContain("Package intake");
  });
});
