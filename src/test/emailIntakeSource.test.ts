import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260726093000_email_intake_foundation.sql", "utf8");
const edgeFunction = readFileSync("supabase/functions/process-email-intake/index.ts", "utf8");
const emailIntake = readFileSync("src/core/emailIntake.ts", "utf8");
const propertyIntake = readFileSync("src/core/propertyIntake.ts", "utf8");
const app = readFileSync("src/App.tsx", "utf8");

describe("Specification 004 email intake source controls", () => {
  it("adds email source records without creating a duplicate Evidence or Deal model", () => {
    expect(migration).toContain("create table if not exists public.email_sources");
    expect(migration).toContain("create table if not exists public.email_source_attachments");
    expect(migration).toContain("references public.evidence_items");
    expect(migration).toContain("source_type in ('manual', 'listing_url', 'file', 'image', 'document', 'email')");
    expect(migration).toContain("job_type in ('file_evidence_intake', 'email_intake')");
    expect(migration).toContain("record_email_intake_result");
    expect(migration).toContain("attach_email_source_to_deal");
    expect(migration).not.toContain("create or replace function public.create_email_deal");
  });

  it("uses RPC authorization, RLS, duplicate detection, events, and audit", () => {
    expect(migration).toContain("alter table public.email_sources enable row level security");
    expect(migration).toContain("email sources no direct insert");
    expect(migration).toContain("can_record_email_intake");
    expect(migration).toContain("message_id");
    expect(migration).toContain("body_hash");
    expect(migration).toContain("email.received");
    expect(migration).toContain("email.parsed");
    expect(migration).toContain("email.attachment_imported");
    expect(migration).toContain("email.value_proposed");
    expect(migration).toContain("audit_events");
  });

  it("parses only deterministic email metadata and routes supported attachments through Evidence", () => {
    expect(edgeFunction).toContain("parseEmail(rawEmail)");
    expect(edgeFunction).toContain("subject");
    expect(edgeFunction).toContain("receivedHeaders");
    expect(edgeFunction).toContain("messageId");
    expect(edgeFunction).toContain("threadId");
    expect(edgeFunction).toContain("plainTextBody");
    expect(edgeFunction).toContain("htmlBody");
    expect(edgeFunction).toContain("record_file_evidence_intake_result");
    expect(edgeFunction).toContain("findDuplicateEvidence");
    expect(edgeFunction).toContain(".from(BUCKET).upload");
    expect(edgeFunction).not.toMatch(/openai|gpt-|ocr|vision model|contractiq|legal interpretation/i);
  });

  it("keeps email values as unverified proposals in the existing intake workflow", () => {
    expect(emailIntake).toContain("applyEmailProposal");
    expect(emailIntake).toContain("verificationState: \"unverified\"");
    expect(propertyIntake).toContain("email_import");
    expect(propertyIntake).toContain("email_proposals");
    expect(propertyIntake).toContain("attachEmailSourceToDeal");
    expect(app).toContain("Email");
    expect(app).toContain("Import Email");
    expect(app).toContain("Email proposals");
    expect(app).toContain("Accept/edit");
  });
});
