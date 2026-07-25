import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260724150000_search_filter_archive_restore.sql", "utf8");
const client = readFileSync("src/core/dealCrud.ts", "utf8");
const store = readFileSync("src/core/store.ts", "utf8");
const app = readFileSync("src/App.tsx", "utf8");

describe("Specification 003 search, filter, archive, and restore", () => {
  it("extends the canonical Deal projection for search, filters, sort, counts, and pagination", () => {
    expect(migration).toContain("drop function if exists public.list_deal_projection(uuid, integer, integer, text)");
    expect(migration).toContain("create or replace function public.list_deal_projection");
    for (const field of ["search_query text", "filter_input jsonb", "include_archived boolean", "sort_key text"]) {
      expect(migration).toContain(field);
    }
    for (const source of ["public.contacts", "public.organizations", "public.tasks", "public.deadlines"]) {
      expect(migration).toContain(source);
    }
    expect(migration).toContain("limit greatest(1, least(coalesce(page_size, 30), 100))");
    expect(migration).toContain("offset greatest(0, coalesce(page_offset, 0))");
    expect(migration).toContain("deal.id asc");
    expect(migration).not.toMatch(/create table if not exists public\.(deal_search|deal_archive|search_deal)/);
  });

  it("adds one authorized archive command and one authorized restore command", () => {
    for (const rpc of ["archive_deal", "restore_deal"]) {
      expect(migration).toContain(`create or replace function public.${rpc}`);
      expect(migration).toContain(`grant execute on function public.${rpc}`);
      expect(client).toContain(`"${rpc}"`);
    }
    expect(migration).toContain("public.ensure_deal_command");
    expect(migration).toContain("existing_deal.version <> expected_version");
    expect(migration).toContain("public.has_workspace_permission(existing_deal.workspace_id, 'deals:manage')");
  });

  it("preserves canonical related records and records lifecycle history instead of deleting", () => {
    expect(migration).toContain("archived_at = coalesce(archived_at, now())");
    expect(migration).toContain("archived_at = null");
    expect(migration).toContain("insert into public.deal_stage_history");
    expect(migration).toContain("insert into public.deal_status_history");
    expect(migration).not.toMatch(/delete from public\.(properties|deal_relationships|tasks|deadlines|notes|domain_events|audit_events)/i);
  });

  it("emits exactly the canonical audit and domain events after persistence", () => {
    for (const event of ["deal.archived", "deal.restored"]) {
      expect(migration).toContain(`'${event}'`);
    }
    expect(migration).toContain("insert into public.domain_events");
    expect(migration).toContain("insert into public.audit_events");
    expect(migration).toContain("'prior_stage'");
    expect(migration).toContain("'resulting_status'");
    expect(migration).not.toMatch(/password|token|service_role|raw_user_meta_data/i);
  });

  it("supersedes legacy direct cloud delete mutation with canonical archive", () => {
    expect(store).toContain("archiveDeal(detail.deal");
    expect(store).not.toContain(".from(\"brix_deals\")\n    .update({ deleted_at:");
    expect(store).not.toContain(".eq(\"owner_id\", userId)");
  });

  it("adds investor-facing search, filter, pagination, archive, and restore controls", () => {
    for (const text of ["Search Deals", "Show archived Deals", "Archive Deal", "Restore Deal", "No matching Deals", "Previous", "Next"]) {
      expect(app).toContain(text);
    }
    expect(app).toContain("readDealProjectionFilters");
    expect(app).toContain("requestRef.current");
    expect(app).toContain("role=\"dialog\"");
  });
});
