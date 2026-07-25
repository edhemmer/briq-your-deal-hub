import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260725122000_events_audit_consolidation.sql", "utf8");
const allMigrations = [
  "20260718090000_auth_workspace_foundation.sql",
  "20260723143000_canonical_property_deal_foundation.sql",
  "20260723170000_contacts_organizations_deal_relationships.sql",
  "20260724103000_tasks_deadlines_notes_timeline_activity.sql",
  "20260724123000_crud_commands_query_projections.sql",
  "20260724150000_search_filter_archive_restore.sql",
  "20260725122000_events_audit_consolidation.sql",
]
  .map((file) => readFileSync(`supabase/migrations/${file}`, "utf8"))
  .join("\n");
const app = readFileSync("src/App.tsx", "utf8");

function functionBody(name: string) {
  const marker = `create or replace function public.${name}`;
  const start = migration.indexOf(marker);
  expect(start).toBeGreaterThanOrEqual(0);
  const next = migration.indexOf("\ncreate or replace function public.", start + marker.length);
  return migration.slice(start, next === -1 ? undefined : next);
}

describe("Specification 003 events and audit consolidation", () => {
  it("extends the existing canonical ledgers instead of creating duplicate systems", () => {
    expect(migration).toContain("alter table public.domain_events add column if not exists event_version");
    expect(migration).toContain("alter table public.audit_events add column if not exists before_values");
    expect(migration).not.toMatch(/create table if not exists public\.(?!domain_events|audit_events)[a-z_]*(events|audit|timeline|activity_log)/i);
    expect(allMigrations.match(/create table if not exists public\.domain_events/g)).toHaveLength(1);
    expect(allMigrations.match(/create table if not exists public\.audit_events/g)).toHaveLength(1);
  });

  it("defines a safe canonical domain event envelope", () => {
    for (const column of [
      "event_version",
      "property_id",
      "entity_type",
      "entity_id",
      "entity_version",
      "actor_type",
      "source_client",
      "source_command",
      "idempotency_key",
      "correlation_id",
      "causation_id",
      "occurred_at",
      "persisted_at",
      "metadata",
    ]) {
      expect(migration).toContain(`public.domain_events add column if not exists ${column}`);
    }
    expect(migration).toContain("domain_events_event_version_supported check (event_version = 1)");
    expect(migration).toContain("source_client in ('web', 'ios', 'system', 'migration', 'server')");
    expect(migration).toContain("create trigger normalize_domain_event_envelope");
    expect(migration).toContain("create unique index if not exists idx_domain_events_command_event_once");
  });

  it("defines a safe canonical audit envelope", () => {
    for (const column of [
      "target_type",
      "before_values",
      "after_values",
      "changed_fields",
      "reason",
      "source_client",
      "source_command",
      "idempotency_key",
      "correlation_id",
      "causation_id",
      "occurred_at",
      "success",
    ]) {
      expect(migration).toContain(`public.audit_events add column if not exists ${column}`);
    }
    expect(migration).toContain("create trigger normalize_audit_event_envelope");
    expect(migration).toContain("create unique index if not exists idx_audit_events_command_action_once");
    expect(migration).toContain("public.safe_changed_fields");
  });

  it("keeps event and audit ledgers immutable and server-owned", () => {
    expect(migration).toContain("create trigger domain_events_immutable");
    expect(migration).toContain("create trigger audit_events_immutable");
    expect(migration).toContain("raise exception 'Canonical event and audit history is immutable.'");
    expect(migration).toContain('drop policy if exists "domain events insert actor"');
    expect(migration).toContain('create policy "domain events no direct insert"');
    expect(migration).toContain('create policy "audit events no direct insert"');
    expect(migration).toContain('create policy "audit events read actor or access managers"');
    expect(app).not.toContain('supabase.from("audit_events").insert');
    expect(app).not.toContain('supabase.from("domain_events").insert');
  });

  it("filters unsafe payload and audit data before persistence", () => {
    expect(migration).toContain("create or replace function public.safe_event_jsonb");
    expect(migration).toMatch(/password\|token\|secret\|authorization\|api\[_-\]\?key\|refresh\|service\[_-\]\?role\|recovery/i);
    expect(migration).toContain("Domain event payload must be a JSON object.");
    expect(migration).toContain("Audit metadata must be a JSON object.");
    expect(migration).not.toMatch(/raw_user_meta_data|service_role_key|access_token/i);
  });

  it("maps every implemented Spec 003 material event and does not invent unsupported ones", () => {
    for (const event of [
      "property.created",
      "property.updated",
      "deal.created",
      "deal.updated",
      "deal.stage_changed",
      "deal.status_changed",
      "deal.archived",
      "deal.restored",
      "relationship.created",
      "relationship.updated",
      "relationship.deactivated",
      "task.created",
      "task.updated",
      "task.completed",
      "task.cancelled",
      "deadline.created",
      "deadline.changed",
      "deadline.completed",
      "note.created",
      "note.updated",
      "note.archived",
    ]) {
      expect(allMigrations).toContain(`'${event}'`);
      expect(functionBody("load_deal_timeline")).toContain(`'${event}'`);
    }
    for (const unsupported of ["property.merge_proposed", "property.merged", "deal.assigned", "decision.recorded"]) {
      expect(allMigrations).not.toContain(`'${unsupported}'`);
    }
  });

  it("prevents duplicate completion history for tasks and deadlines", () => {
    expect(functionBody("complete_deal_task")).not.toContain("update_deal_task");
    expect(functionBody("cancel_deal_task")).not.toContain("update_deal_task");
    expect(functionBody("complete_deal_deadline")).not.toContain("update_deal_deadline");
    expect(functionBody("complete_deal_task")).toContain("'task.completed'");
    expect(functionBody("cancel_deal_task")).toContain("'task.cancelled'");
    expect(functionBody("complete_deal_deadline")).toContain("'deadline.completed'");
  });

  it("keeps Deal History investor-facing and sourced only from domain events", () => {
    const timeline = functionBody("load_deal_timeline");
    expect(timeline).toContain("from public.domain_events event");
    expect(timeline).not.toContain("audit_events");
    for (const title of [
      "Deal created",
      "Deal details updated",
      "Property updated",
      "Stage changed",
      "Status changed",
      "Person added to Deal",
      "Task completed",
      "Deadline updated",
      "Note added",
      "Deal archived",
      "Deal restored",
    ]) {
      expect(timeline).toContain(title);
    }
    expect(timeline).not.toMatch(/'[^']*(RPC|SQL|trigger|audit row|outbox)[^']*'/i);
  });
});
