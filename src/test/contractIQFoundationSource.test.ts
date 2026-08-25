import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { assertContractIQSourceBoundary } from "../core/contractIQ";

const migration = readdirSync("supabase/migrations")
  .filter((filename) => filename.includes("spec011_contractiq"))
  .sort()
  .map((filename) => readFileSync(`supabase/migrations/${filename}`, "utf8"))
  .join("\n");

describe("ContractIQ foundation migration", () => {
  it("retrofifts the historical contracts table instead of creating a duplicate ContractIQ source of truth", () => {
    expect(migration).toContain("alter table public.contracts");
    expect(migration).toContain("add column if not exists workspace_id uuid");
    expect(migration).toContain("legacy_payload");
    expect(migration).toContain("contracts_deal_fk");
    expect(migration).toContain("references public.brix_deals(workspace_id, id)");
    expect(migration).not.toMatch(/create table if not exists public\.contract_records/i);
  });

  it("models canonical ContractIQ children with source anchors and canonical cross-module references", () => {
    [
      "public.contract_evidence_links",
      "public.contract_parties",
      "public.contract_terms",
      "public.contract_deadlines",
      "public.contract_findings",
      "public.contract_conflicts",
      "public.contract_relationships",
      "public.contract_change_proposals",
      "public.contract_questions",
      "public.contract_record_versions",
      "public.contract_command_requests",
    ].forEach((tableName) => expect(migration).toContain(`create table if not exists ${tableName}`));

    expect(migration).toContain("references public.evidence_items(workspace_id, id)");
    expect(migration).toContain("references public.contacts(workspace_id, id)");
    expect(migration).toContain("references public.organizations(workspace_id, id)");
    expect(migration).toContain("references public.deadlines(workspace_id, id)");
    expect(migration).toContain("source_anchor jsonb not null default '{}'::jsonb");
    expect(migration).toContain("source_quote_ref text");
  });

  it("keeps ContractIQ mutations server-owned, idempotent, versioned, and auditable", () => {
    expect(migration).toContain("unique (workspace_id, idempotency_key)");
    expect(migration).toContain("create or replace function public.ensure_contract_command");
    expect(migration).toContain("create or replace function public.create_contract");
    expect(migration).toContain("create or replace function public.accept_contract_term");
    expect(migration).toContain("create or replace function public.resolve_contract_conflict");
    expect(migration).toContain("create or replace function public.record_contract_version");
    expect(migration).toContain("insert into public.domain_events");
    expect(migration).toContain("insert into public.audit_events");
    expect(migration).toContain("'downstream_mutation', false");
  });

  it("enforces RLS, fixed search paths, anon denial, and direct write denial", () => {
    expect(migration).toContain("alter table public.contracts enable row level security");
    expect(migration).toContain("for select to authenticated using ((select public.is_workspace_member(workspace_id)))");
    expect(migration).toContain("for insert to authenticated with check (false)");
    expect(migration).toContain("for update to authenticated using (false) with check (false)");
    expect(migration).toContain("for delete to authenticated using (false)");
    expect(migration).toContain("set search_path = public");
    expect(migration).toContain("revoke execute on function public.create_contract(uuid, jsonb, text) from public, anon");
    expect(migration).toContain("grant execute on function public.create_contract(uuid, jsonb, text) to authenticated");
  });

  it("exposes source-linked read projections without opaque risk scores or report outputs", () => {
    expect(migration).toContain("create or replace view public.contract_projection");
    expect(migration).toContain("with (security_invoker = true)");
    expect(migration).toContain("create or replace function public.list_contract_projection");
    expect(migration).toContain("create or replace function public.load_contract_detail");
    expect(migration).toContain("unresolved_conflict_count");
    expect(migration).toContain("open_question_count");
    expect(migration).not.toMatch(/risk_score|legal conclusion|full due diligence report|summary due diligence report/i);
    expect(() => assertContractIQSourceBoundary(migration)).not.toThrow();
  });
});
