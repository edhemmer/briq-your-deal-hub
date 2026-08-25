import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260825130622_spec011_contractiq_document_extraction.sql", "utf8");

describe("ContractIQ Slice 2 migration", () => {
  it("adds source-linked analysis and extraction proposal storage without duplicate authority", () => {
    [
      "public.contract_analysis_runs",
      "public.contract_extraction_items",
      "public.contract_party_match_proposals",
      "public.contract_base_match_candidates",
      "public.contract_supersession_candidates",
    ].forEach((tableName) => expect(migration).toContain(`create table if not exists ${tableName}`));

    expect(migration).toContain("classification_state text not null default 'unclassified'");
    expect(migration).toContain("classification_source_anchor jsonb not null default '{}'::jsonb");
    expect(migration).toContain("source_anchor jsonb not null default '{}'::jsonb");
    expect(migration).toContain("constraint contract_extraction_items_anchor_present check");
    expect(migration).toContain("references public.evidence_items(workspace_id, id)");
    expect(migration).not.toMatch(/create table if not exists public\.contract_documents/i);
  });

  it("keeps provider output bounded to proposals and rejects unsafe persisted fields", () => {
    expect(migration).toContain("ContractIQ extraction cannot persist raw private document text.");
    expect(migration).toContain("ContractIQ extraction cannot persist legal authority, downstream mutations, or calculated deadlines.");
    expect(migration).toContain("'legal_conclusion_authority', false");
    expect(migration).toContain("'downstream_mutation', false");
    expect(migration).toContain("'upload_order_authority', false");
    expect(migration).not.toMatch(/create table if not exists public\.contract_deadline_engine|calculated_due_at\s*:=|offer_iq|strategy_iq|public\.strateg/i);
  });

  it("exposes idempotent server-owned RPCs with RLS, audit, prior valid, and stale state", () => {
    [
      "public.start_contract_analysis_run",
      "public.complete_contract_analysis_run",
      "public.record_contract_document_classification",
      "public.record_contract_extraction_item",
      "public.propose_contract_party_match",
      "public.propose_contract_base_match",
      "public.record_contract_supersession_candidate",
      "public.mark_contract_analysis_stale",
    ].forEach((functionName) => {
      expect(migration).toContain(`create or replace function ${functionName}`);
      expect(migration).toContain(`revoke execute on function ${functionName}`);
      expect(migration).toContain(`grant execute on function ${functionName}`);
    });

    expect(migration.match(/set search_path = public/g)?.length ?? 0).toBeGreaterThanOrEqual(8);
    expect(migration).toContain("alter table public.contract_analysis_runs enable row level security");
    expect(migration).toContain("for insert to authenticated with check (false)");
    expect(migration).toContain("prior_valid_analysis_run_id");
    expect(migration).toContain("failed_with_prior_valid");
    expect(migration).toContain("insert into public.domain_events");
    expect(migration).toContain("insert into public.audit_events");
  });

  it("indexes every new foreign key column family used by Supabase advisors", () => {
    [
      "idx_contract_analysis_runs_workspace_fk",
      "idx_contract_analysis_runs_evidence_fk",
      "idx_contract_analysis_runs_prior_fk",
      "idx_contract_extraction_items_workspace_fk",
      "idx_contract_extraction_items_evidence_fk",
      "idx_contract_extraction_items_run_fk",
      "idx_contract_extraction_items_verification_state_fk",
      "idx_contract_extraction_items_applicable_perspective_fk",
      "idx_contract_party_match_workspace_fk",
      "idx_contract_party_match_contact_fk",
      "idx_contract_party_match_org_fk",
      "idx_contract_party_match_status_fk",
      "idx_contract_base_match_workspace_fk",
      "idx_contract_base_match_base_fk",
      "idx_contract_base_match_status_fk",
      "idx_contract_supersession_workspace_fk",
      "idx_contract_supersession_old_term_fk",
      "idx_contract_supersession_replacement_term_fk",
      "idx_contract_supersession_status_fk",
    ].forEach((indexName) => expect(migration).toContain(`create index if not exists ${indexName}`));
  });
});
