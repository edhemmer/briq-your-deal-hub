import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const deadlineMigration = readFileSync("supabase/migrations/20260826111957_spec011_contractiq_deadline_engine.sql", "utf8");
const indexRepairMigration = readFileSync("supabase/migrations/20260826113005_spec011_contractiq_deadline_engine_fk_indexes.sql", "utf8");
const rpcRepairMigration = readFileSync("supabase/migrations/20260826114500_spec011_contractiq_deadline_engine_rpc_repairs.sql", "utf8");
const syncLintRepairMigration = readFileSync("supabase/migrations/20260826115000_spec011_contractiq_deadline_sync_lint_repair.sql", "utf8");
const migration = `${deadlineMigration}\n${indexRepairMigration}\n${rpcRepairMigration}\n${syncLintRepairMigration}`;

describe("ContractIQ Slice 3 deadline engine source contract", () => {
  it("persists versioned deadline results, calendar definitions, and canonical linkage", () => {
    for (const table of [
      "public.contract_holiday_calendars",
      "public.contract_deadline_results",
      "public.contract_deadline_canonical_links",
    ]) {
      expect(migration).toContain(`create table if not exists ${table}`);
      expect(migration).toContain(`alter table ${table.replace("public.", "public.")} enable row level security`);
    }

    expect(migration).toContain("unique (workspace_id, contract_deadline_id, deterministic_hash)");
    expect(migration).toContain("create unique index if not exists idx_contract_deadline_results_current");
    expect(migration).toContain("foreign key (workspace_id, canonical_deadline_id) references public.deadlines(workspace_id, id)");
    expect(migration).toContain("foreign key (workspace_id, canonical_task_id) references public.tasks(workspace_id, id)");

    for (const index of [
      "idx_contract_holiday_calendars_workspace_source_evidence",
      "idx_contract_deadline_results_workspace_source_evidence",
      "idx_contract_deadline_results_status",
      "idx_contract_deadline_links_canonical_task_fk",
      "idx_contract_deadline_links_contract_deadline_fk",
    ]) {
      expect(migration).toContain(`create index if not exists ${index}`);
    }
  });

  it("keeps authoritative date arithmetic out of SQL and reuses the canonical Deal deadline RPCs", () => {
    expect(migration).not.toMatch(/business_day\s*\+\s*interval|extract\s*\(\s*dow|generate_series\s*\(/i);
    expect(migration).toContain("TypeScript domain code owns deadline arithmetic.");
    expect(migration).toContain("public.create_deal_deadline");
    expect(migration).toContain("public.update_deal_deadline");
    expect(migration).not.toContain("create table if not exists public.contract_tasks");
  });

  it("accepts semantic holiday calendar keys without treating them as row UUIDs", () => {
    expect(rpcRepairMigration).toContain("holidayCalendarUuid");
    expect(rpcRepairMigration).toContain("requested_calendar_key");
    expect(rpcRepairMigration).toContain("requested_calendar_uuid_text");
    expect(rpcRepairMigration).not.toContain("nullif(safe_input ->> 'holidayCalendarId', '')::uuid");
  });

  it("qualifies canonical link sync increments to avoid output-variable ambiguity", () => {
    expect(syncLintRepairMigration).toContain("sync_version = public.contract_deadline_canonical_links.sync_version + 1");
    expect(syncLintRepairMigration).toContain("perform *");
    expect(syncLintRepairMigration).not.toContain("update_deadline record");
    expect(syncLintRepairMigration).not.toContain("sync_version = sync_version + 1");
  });

  it("denies direct calculated-output mutation and exposes authenticated RPC boundaries", () => {
    for (const table of ["contract_holiday_calendars", "contract_deadline_results", "contract_deadline_canonical_links"]) {
      expect(migration).toContain(`revoke insert, update, delete on public.${table} from authenticated`);
      expect(migration).toContain(`for insert to authenticated with check (false)`);
      expect(migration).toContain(`for update to authenticated using (false) with check (false)`);
      expect(migration).toContain(`for delete to authenticated using (false)`);
    }

    expect(migration).toContain("revoke execute on function public.record_contract_deadline_result(uuid, jsonb, integer, text) from public, anon");
    expect(migration).toContain("grant execute on function public.record_contract_deadline_result(uuid, jsonb, integer, text) to authenticated");
    expect(migration).toContain("revoke execute on function public.sync_contract_deadline_to_deal(uuid, text) from public, anon");
    expect(migration).toContain("grant execute on function public.sync_contract_deadline_to_deal(uuid, text) to authenticated");
  });

  it("extends ContractIQ projection and detail without creating a competing timeline", () => {
    for (const field of [
      "verified_current_deadline_count",
      "proposed_deadline_count",
      "uncertain_deadline_count",
      "missed_deadline_count",
      "deadline_stale_count",
      "deadline_conflict_count",
      "next_deadline_due_at",
    ]) {
      expect(migration).toContain(field);
    }

    expect(migration).toContain("'deadline_result'::text");
    expect(migration).toContain("'deadline_link'::text");
    expect(migration).not.toContain("create table if not exists public.contract_timeline");
  });

  it("records required domain and audit events", () => {
    for (const event of [
      "contract.deadline_calculated",
      "contract.deadline_stale",
      "contract.deadline_failed",
      "deal.deadline_updated",
    ]) {
      expect(migration).toContain(event);
    }
    expect(migration).toContain("public.domain_events");
    expect(migration).toContain("public.audit_events");
  });
});
