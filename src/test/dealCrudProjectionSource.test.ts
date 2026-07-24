import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260724123000_crud_commands_query_projections.sql", "utf8");
const client = readFileSync("src/core/dealCrud.ts", "utf8");
const store = readFileSync("src/core/store.ts", "utf8");
const app = readFileSync("src/App.tsx", "utf8");

describe("Specification 003 CRUD commands and query projections", () => {
  it("adds server-owned commands for approved Property, Deal, and lifecycle mutations", () => {
    for (const rpc of ["update_canonical_property", "update_canonical_deal", "update_deal_lifecycle"]) {
      expect(migration).toContain(`create or replace function public.${rpc}`);
      expect(migration).toContain(`grant execute on function public.${rpc}`);
      expect(client).toContain(`"${rpc}"`);
    }
    expect(migration).toContain("create table if not exists public.deal_command_requests");
    expect(migration).toContain("unique (workspace_id, idempotency_key)");
    expect(migration).toContain("This retry key was already used for a different Deal command.");
  });

  it("enforces authorization, workspace ownership, and stale-version protection", () => {
    expect(migration).toContain("public.has_workspace_permission(existing_property.workspace_id, 'deals:manage')");
    expect(migration).toContain("public.get_authorized_deal(target_deal_id)");
    expect(migration).toContain("existing_property.version <> expected_version");
    expect(migration).toContain("existing_deal.version <> expected_version");
    expect(migration).toContain("This Property changed after you opened it. Reload and try again.");
    expect(migration).toContain("This Deal changed after you opened it. Reload and try again.");
    expect(migration).toContain("Use the lifecycle command to change Deal stage or status.");
  });

  it("creates bounded canonical query projections without shadow stores", () => {
    for (const rpc of ["list_deal_projection", "load_deal_detail_projection", "load_property_summary", "load_active_deal_shell_projection"]) {
      expect(migration).toContain(`create or replace function public.${rpc}`);
      expect(client).toContain(`"${rpc}"`);
    }
    expect(migration).toContain("limit greatest(1, least(coalesce(page_size, 30), 100))");
    expect(migration).toContain("offset greatest(0, coalesce(page_offset, 0))");
    expect(migration).toContain("total_count");
    expect(migration).not.toContain("create table if not exists public.deal_list_projection");
    expect(migration).not.toContain("create table if not exists public.deal_detail_projection");
  });

  it("returns current relationship, work, note, and timeline summaries from canonical records", () => {
    for (const source of ["public.deal_relationships", "public.tasks", "public.deadlines", "public.notes", "public.domain_events"]) {
      expect(migration).toContain(source);
    }
    expect(migration).toContain("open_task_count");
    expect(migration).toContain("open_deadline_count");
    expect(migration).toContain("pinned_note_count");
    expect(migration).toContain("recent_event_count");
  });

  it("emits safe audit and domain events for updates and lifecycle changes", () => {
    for (const event of ["property.updated", "deal.updated", "deal.stage_changed", "deal.status_changed"]) {
      expect(migration).toContain(`'${event}'`);
    }
    expect(migration).toContain("insert into public.domain_events");
    expect(migration).toContain("insert into public.audit_events");
    expect(migration).not.toMatch(/password|token|service_role|raw_user_meta_data/i);
  });

  it("moves authenticated Deal list and save adapters away from direct table mutation", () => {
    expect(store).toContain("listDealProjections");
    expect(store).toContain("updateDealCore");
    expect(store).not.toContain(".from(\"brix_deals\")\n    .select(\"*\")");
    expect(store).not.toContain(".from(\"brix_deals\").update({\n    status:");
  });

  it("adds focused canonical edit behavior in the Deal UI", () => {
    for (const text of ["Canonical Deal and Property details", "Deal name", "Property address", "Reload", "Versions: Deal"]) {
      expect(app).toContain(text);
    }
    expect(app).toContain("safeDealCommandMessage");
    expect(app).toContain("This record changed after you opened it. Reload to review the current version, then save again.");
  });
});
