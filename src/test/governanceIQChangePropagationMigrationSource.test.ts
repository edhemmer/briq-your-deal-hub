import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260824131203_spec010_governance_change_propagation.sql", "utf8");
const versionGuardRepair = readFileSync("supabase/migrations/20260824140030_spec010_governance_change_version_guard_repair.sql", "utf8");
const rpcAmbiguityRepair = readFileSync("supabase/migrations/20260824183200_spec010_governance_change_rpc_ambiguity_repair.sql", "utf8");
const impactDomainsRepair = readFileSync("supabase/migrations/20260824184334_spec010_governance_impact_domains_array_repair.sql", "utf8");
const versionColumnsRepair = readFileSync("supabase/migrations/20260824184959_spec010_governance_change_version_columns_repair.sql", "utf8");
const fkIndexRepair = readFileSync("supabase/migrations/20260824191255_spec010_governance_change_fk_index_repair.sql", "utf8");

describe("GovernanceIQ Slice 4 migration guardrails", () => {
  it("persists accepted governance propagation with RLS and direct write denial", () => {
    expect(migration).toContain("create table if not exists public.governance_change_propagations");
    expect(migration).toContain("create table if not exists public.governance_downstream_proposals");
    expect(migration).toContain("alter table public.governance_change_propagations enable row level security");
    expect(migration).toContain("alter table public.governance_downstream_proposals enable row level security");
    expect(migration).toContain("for insert to authenticated");
    expect(migration).toContain("with check (false)");
    expect(migration).toContain("revoke insert, update, delete on public.governance_change_propagations from authenticated");
    expect(migration).toContain("revoke insert, update, delete on public.governance_downstream_proposals from authenticated");
  });

  it("uses fixed search paths and exposes only the accepted propagation RPC", () => {
    expect(migration).toContain("set search_path = public");
    expect(migration).toContain("create or replace function public.propagate_accepted_governance_change");
    expect(migration).toContain("Governance finding must be explicitly accepted before propagation.");
    expect(migration).toContain("grant execute on function public.propagate_accepted_governance_change(uuid, jsonb, text) to authenticated");
    expect(migration).toContain("revoke all on function public.propagate_accepted_governance_change(uuid, jsonb, text) from public, anon");
  });

  it("rejects stale accepted finding versions before downstream proposals are written", () => {
    expect(versionGuardRepair).toContain("create or replace function public.enforce_governance_change_expected_version()");
    expect(versionGuardRepair).toContain("add column if not exists request_body jsonb");
    expect(versionGuardRepair).toContain("safe_request_body jsonb := public.safe_event_jsonb");
    expect(versionGuardRepair).toContain("request_body,");
    expect(versionGuardRepair).toContain("safe_request_body,");
    expect(versionGuardRepair).toContain("set search_path = public");
    expect(versionGuardRepair).toContain("expectedFindingVersion");
    expect(versionGuardRepair).toContain("command.request_body ->> 'expectedFindingVersion'");
    expect(versionGuardRepair).toContain("expected_finding_version <> new.finding_version");
    expect(versionGuardRepair).toContain("Stale governance finding version cannot overwrite newer accepted finding.");
    expect(versionGuardRepair).toContain("before insert or update of finding_version, idempotency_key");
    expect(versionGuardRepair).toContain("on public.governance_change_propagations");
    expect(versionGuardRepair).toContain("revoke all on function public.enforce_governance_change_expected_version() from public, anon, authenticated");
  });

  it("recompiles the propagation RPC with table-column precedence", () => {
    expect(rpcAmbiguityRepair).toContain("create or replace function public.propagate_accepted_governance_change");
    expect(rpcAmbiguityRepair).toContain("#variable_conflict use_column");
    expect(rpcAmbiguityRepair).toContain("returns table (");
    expect(rpcAmbiguityRepair).toContain("set search_path = public");
    expect(rpcAmbiguityRepair).toContain("where workspace_id = record.workspace_id");
  });

  it("uses valid Postgres array appends in the SQL impact classifier", () => {
    expect(impactDomainsRepair).toContain("create or replace function public.governance_impact_domains");
    expect(impactDomainsRepair).toContain("domains := domains || array['underwriting']");
    expect(impactDomainsRepair).toContain("domains := domains || array['strategy']");
    expect(impactDomainsRepair).toContain("domains := domains || array['finance']");
    expect(impactDomainsRepair).toContain("domains := domains || array['task_deadline']");
    expect(impactDomainsRepair).not.toContain("domains := domains || 'underwriting'");
    expect(impactDomainsRepair).toContain("revoke all on function public.governance_impact_domains");
  });

  it("keeps new propagation tables compatible with versioned touch triggers", () => {
    expect(versionColumnsRepair).toContain("alter table public.governance_change_propagations");
    expect(versionColumnsRepair).toContain("add column if not exists version integer not null default 1 check (version > 0)");
    expect(versionColumnsRepair).toContain("alter table public.governance_downstream_proposals");
  });

  it("adds leading-column indexes for every audited new-table FK path", () => {
    expect(fkIndexRepair).toContain("idx_governance_change_propagations_accepted_by");
    expect(fkIndexRepair).toContain("idx_governance_change_propagations_category");
    expect(fkIndexRepair).toContain("idx_governance_change_propagations_source_evidence_id");
    expect(fkIndexRepair).toContain("idx_governance_change_propagations_triggering_event_id");
    expect(fkIndexRepair).toContain("idx_governance_change_propagations_verification_state");
    expect(fkIndexRepair).toContain("idx_governance_downstream_proposals_source_evidence_id");
  });

  it("indexes every new FK path and records projection state without owning downstream calculations", () => {
    expect(migration).toContain("idx_governance_change_propagations_record");
    expect(migration).toContain("idx_governance_change_propagations_deal");
    expect(migration).toContain("idx_governance_change_propagations_property");
    expect(migration).toContain("idx_governance_change_propagations_finding");
    expect(migration).toContain("idx_governance_change_propagations_source_evidence");
    expect(migration).toContain("idx_governance_downstream_proposals_propagation");
    expect(migration).toContain("idx_governance_downstream_proposals_finding");
    expect(migration).toContain("idx_governance_downstream_proposals_source_evidence");
    expect(migration).toContain("with (security_invoker = true)");
    expect(migration).toContain("calculation_authority', 'spec005_underwriting_only");
    expect(migration).toContain("strategy_authority', 'spec006_strategy_only");
    expect(migration).toContain("finance_authority', 'spec009_financeiq_only");
    expect(migration).toContain("cockpit_authority', 'spec007_projection_only");
    expect(migration).not.toContain("insert into public.underwriting_results");
    expect(migration).not.toContain("update public.underwriting_results");
    expect(migration).not.toContain("update public.strategy_results");
    expect(migration).not.toContain("update public.financeiq_feasibility_results");
  });
});
