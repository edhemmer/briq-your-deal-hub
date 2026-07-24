import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260724103000_tasks_deadlines_notes_timeline_activity.sql", "utf8");
const client = readFileSync("src/core/workHistory.ts", "utf8");
const app = readFileSync("src/App.tsx", "utf8");

describe("Specification 003 tasks, deadlines, notes, timeline, and activity", () => {
  it("creates one canonical Deal-scoped work and history model", () => {
    for (const table of ["tasks", "deadlines", "notes", "note_versions", "work_command_requests"]) {
      expect(migration).toContain(`create table if not exists public.${table}`);
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }
    expect(migration).toContain("constraint tasks_deal_fk foreign key (workspace_id, deal_id)");
    expect(migration).toContain("constraint deadlines_deal_fk foreign key (workspace_id, deal_id)");
    expect(migration).toContain("constraint notes_deal_fk foreign key (workspace_id, deal_id)");
    expect(migration).toContain("references public.brix_deals(workspace_id, id) on delete cascade");
    expect(migration).toContain("Legacy public.brix_tasks and public.brix_project_tasks are superseded");
  });

  it("keeps task, deadline, and note definitions explicit and policy-grade", () => {
    for (const definition of [
      "task_status_definitions",
      "task_priority_definitions",
      "task_type_definitions",
      "deadline_status_definitions",
      "deadline_verification_state_definitions",
      "note_type_definitions",
    ]) {
      expect(migration).toContain(`create table if not exists public.${definition}`);
    }
    for (const value of [
      "'open', 'Open'",
      "'blocked', 'Blocked'",
      "'completed', 'Completed'",
      "'urgent', 'Urgent'",
      "'due_diligence', 'Due Diligence'",
      "'source_verified', 'Source Verified'",
      "'professional_review_recommended', 'Professional Review Recommended'",
      "'decision', 'Decision'",
    ]) {
      expect(migration).toContain(value);
    }
    expect(migration).toContain("timezone text not null default 'UTC'");
    expect(migration).toContain("source_type text not null default 'manual'");
    expect(migration).toContain("verification_state text not null default 'unverified'");
  });

  it("requires server-owned commands, idempotency, permissions, and optimistic concurrency", () => {
    expect(migration).toContain("create or replace function public.ensure_work_command");
    expect(migration).toContain("unique (workspace_id, idempotency_key)");
    expect(migration).toContain("This retry key was already used for different Deal work.");
    expect(migration).toContain("public.has_workspace_permission(target_deal.workspace_id, 'deals:manage')");
    expect(migration).toContain("existing_task.version <> expected_version");
    expect(migration).toContain("existing_deadline.version <> expected_version");
    expect(migration).toContain("existing_note.version <> expected_version");
  });

  it("denies direct mutation for canonical work tables", () => {
    for (const table of ["tasks", "deadlines", "notes"]) {
      expect(migration).toContain(`${table} no direct insert`);
      expect(migration).toContain(`${table} no direct update`);
      expect(migration).toContain(`${table} no direct delete`);
    }
    expect(migration).toContain("note versions no direct insert");
    expect(migration).toContain("work command requests no direct insert");
  });

  it("emits domain/audit activity and derives timeline from domain events", () => {
    for (const event of [
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
      expect(migration).toContain(`'${event}'`);
    }
    expect(migration).toContain("insert into public.domain_events");
    expect(migration).toContain("insert into public.audit_events");
    expect(migration).toContain("create or replace function public.load_deal_timeline");
    expect(migration).toContain("from public.domain_events event");
    expect(migration).not.toContain("create table if not exists public.timeline");
    expect(migration).not.toMatch(/password|token|service_role|raw_user_meta_data/i);
  });

  it("uses the approved RPC surface from the client", () => {
    for (const rpc of [
      "list_deal_work",
      "list_deal_notes",
      "load_deal_timeline",
      "create_deal_task",
      "update_deal_task",
      "complete_deal_task",
      "cancel_deal_task",
      "create_deal_deadline",
      "update_deal_deadline",
      "complete_deal_deadline",
      "create_deal_note",
      "update_deal_note",
      "archive_deal_note",
    ]) {
      expect(client).toContain(`"${rpc}"`);
    }
    expect(client).toContain("crypto.randomUUID()");
  });

  it("adds focused Deal-level work UX without rendering unsafe note HTML", () => {
    for (const text of ["Work and history", "What needs attention on this Deal?", "Add task", "Add deadline", "Add note", "Deal history"]) {
      expect(app).toContain(text);
    }
    expect(app).toContain("<WorkHistoryPanel");
    expect(app).not.toContain("dangerouslySetInnerHTML");
  });
});
