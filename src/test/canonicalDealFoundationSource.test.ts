import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260723143000_canonical_property_deal_foundation.sql", "utf8");

describe("Specification 003 canonical Property and Deal foundation migration", () => {
  it("creates or adapts exactly one canonical property, deal, and relationship foundation", () => {
    expect(migration).toContain("create table if not exists public.properties");
    expect(migration).toContain("alter table public.brix_deals");
    expect(migration).toContain("create table if not exists public.deal_properties");
    expect(migration).not.toContain("create table if not exists public.canonical_deals");
    expect(migration).not.toContain("create table if not exists public.property_deals");
  });

  it("keeps lifecycle stage and operating status separate with deterministic defaults", () => {
    expect(migration).toContain("create table if not exists public.deal_stage_definitions");
    expect(migration).toContain("create table if not exists public.deal_operating_status_definitions");
    expect(migration).toContain("add column if not exists stage text not null default 'lead'");
    expect(migration).toContain("add column if not exists operating_status text not null default 'active'");
    expect(migration).toContain("'lead', 'Lead'");
    expect(migration).toContain("'active', 'Active'");
    expect(migration).toContain("brix_deals_stage_fk");
    expect(migration).toContain("brix_deals_operating_status_fk");
  });

  it("enforces primary relationship and workspace consistency constraints", () => {
    expect(migration).toContain("idx_deal_properties_one_active_primary");
    expect(migration).toContain("idx_deal_properties_no_duplicate_active_relationship");
    expect(migration).toContain("constraint deal_properties_deal_fk foreign key (workspace_id, deal_id)");
    expect(migration).toContain("constraint deal_properties_property_fk foreign key (workspace_id, property_id)");
    expect(migration).toContain("references public.brix_deals(workspace_id, id)");
    expect(migration).toContain("references public.properties(workspace_id, id)");
  });

  it("provides an idempotent server-side creation contract", () => {
    expect(migration).toContain("create table if not exists public.deal_creation_requests");
    expect(migration).toContain("unique (workspace_id, idempotency_key)");
    expect(migration).toContain("create or replace function public.create_canonical_deal");
    expect(migration).toContain("public.has_workspace_permission(target_workspace_id, 'deals:manage')");
    expect(migration).toContain("on conflict (workspace_id, idempotency_key) do nothing");
    expect(migration).toContain("This Deal creation request has already been used with different data.");
    expect(migration).toContain("returning id, version, stage, operating_status");
  });

  it("protects canonical tables with RLS and denies direct creation where the RPC owns mutation", () => {
    expect(migration).toContain("alter table public.properties enable row level security");
    expect(migration).toContain("alter table public.deal_properties enable row level security");
    expect(migration).toContain("alter table public.deal_creation_requests enable row level security");
    expect(migration).toContain("properties no direct insert");
    expect(migration).toContain("deal properties no direct insert");
    expect(migration).toContain("deal creation requests no direct insert");
    expect(migration).toContain("brix deals no direct insert");
    expect(migration).toContain("grant execute on function public.create_canonical_deal");
  });

  it("creates transition history and emits safe audit/domain events once per creation request", () => {
    expect(migration).toContain("create table if not exists public.deal_stage_history");
    expect(migration).toContain("create table if not exists public.deal_status_history");
    expect(migration).toContain("'property.created'");
    expect(migration).toContain("'deal.created'");
    expect(migration).toContain("insert into public.domain_events");
    expect(migration).toContain("insert into public.audit_events");
    expect(migration).not.toMatch(/password|token|service_role|raw_user_meta_data/i);
  });
});
