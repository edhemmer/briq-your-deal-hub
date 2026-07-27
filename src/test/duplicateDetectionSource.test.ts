import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const core = readFileSync("src/core/duplicateDetection.ts", "utf8");
const propertyIntake = readFileSync("src/core/propertyIntake.ts", "utf8");
const listingIntake = readFileSync("src/core/listingUrlIntake.ts", "utf8");
const fileIntake = readFileSync("src/core/fileEvidenceIntake.ts", "utf8");
const emailIntake = readFileSync("src/core/emailIntake.ts", "utf8");
const shareIntake = readFileSync("src/core/shareIntake.ts", "utf8");
const packageBatch = readFileSync("src/core/packageBatchIntake.ts", "utf8");
const migration = readFileSync("supabase/migrations/20260726143000_canonical_duplicate_detection.sql", "utf8");

describe("canonical duplicate detection source boundaries", () => {
  it("defines one canonical request, result, decision, and versioned rule registry", () => {
    expect(core).toContain("DUPLICATE_DETECTION_REQUEST_VERSION");
    expect(core).toContain("DUPLICATE_RULE_REGISTRY_VERSION");
    expect(core).toContain("DuplicateDetectionRequest");
    expect(core).toContain("DuplicateCandidateResult");
    expect(core).toContain("DuplicateDecisionRecordInput");
    expect(core).toContain("duplicateRuleRegistrySnapshot");
    expect(core).not.toMatch(/openai|chat|completion|llm|model/i);
  });

  it("covers all Specification 004 duplicate subject types", () => {
    for (const subject of [
      "property",
      "deal",
      "evidence",
      "listing_source",
      "email_source",
      "source_record",
      "intake",
      "shared_handoff",
      "batch_item",
    ]) {
      expect(core).toContain(`"${subject}"`);
    }
  });

  it("keeps package intake on the canonical duplicate engine instead of local ad hoc matching", () => {
    expect(packageBatch).toContain("findDuplicateCandidates");
    expect(packageBatch).toContain("packageBatchDuplicateCandidate");
    expect(packageBatch).not.toContain("Same normalized address or source URL appears earlier in this package.");
    expect(packageBatch).not.toContain("function duplicateKey");
  });

  it("exposes canonical duplicate request builders for every implemented intake entry point", () => {
    expect(propertyIntake).toContain("createManualIntakeDuplicateRequest");
    expect(propertyIntake).toContain("createDuplicateDetectionRequest");
    expect(listingIntake).toContain("createListingSourceDuplicateRequest");
    expect(fileIntake).toContain("createFileEvidenceDuplicateRequest");
    expect(emailIntake).toContain("createEmailSourceDuplicateRequest");
    expect(shareIntake).toContain("createSharedHandoffDuplicateRequest");
  });

  it("adds a server-owned duplicate decision ledger without merge execution", () => {
    expect(migration).toContain("create table if not exists public.duplicate_decisions");
    expect(migration).toContain("record_duplicate_decision");
    expect(migration).toContain("check (decision in ('reuse_existing', 'attach_existing', 'create_separate', 'not_duplicate', 'defer', 'cancel'))");
    expect(migration).not.toMatch(/merge_duplicate|execute_merge|delete from public\.properties|delete from public\.brix_deals/i);
  });

  it("protects duplicate decisions with workspace RLS and a privileged command boundary", () => {
    expect(migration).toContain("alter table public.duplicate_decisions enable row level security");
    expect(migration).toContain("public.has_workspace_permission(workspace_id, 'deals:manage')");
    expect(migration).toContain("duplicate decisions no direct insert");
    expect(migration).toContain("duplicate decisions no direct update");
    expect(migration).toContain("duplicate decisions no direct delete");
    expect(migration).toContain("grant execute on function public.record_duplicate_decision");
  });

  it("records safe audit and domain events without raw source bodies or tokens", () => {
    expect(migration).toContain("'duplicate.decision_recorded'");
    expect(migration).toContain("insert into public.domain_events");
    expect(migration).toContain("insert into public.audit_events");
    expect(migration).toContain("public.safe_event_jsonb");
    expect(migration).not.toMatch(/plain_text_body|html_body|token|password/i);
  });

  it("adds bounded indexes for existing duplicate query paths", () => {
    for (const indexName of [
      "idx_duplicate_decisions_workspace_subject",
      "idx_properties_workspace_address_unit_lookup",
      "idx_properties_workspace_parcel_lookup",
      "idx_deal_properties_workspace_property_duplicate_lookup",
      "idx_manual_source_records_workspace_url_lookup",
      "idx_manual_source_records_workspace_hash_lookup",
      "idx_intakes_workspace_idempotency_lookup",
      "idx_batch_items_workspace_hash_lookup",
    ]) {
      expect(migration).toContain(indexName);
    }
  });
});
