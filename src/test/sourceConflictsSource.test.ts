import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const core = readFileSync("src/core/sourceConflicts.ts", "utf8");
const migration = readFileSync("supabase/migrations/20260727143000_canonical_source_conflict_handling.sql", "utf8");

describe("canonical source conflict source boundaries", () => {
  it("adds one conflict ledger and one explicit resolution ledger without a second proposal model", () => {
    expect(migration).toContain("create table if not exists public.source_conflicts");
    expect(migration).toContain("create table if not exists public.source_conflict_resolutions");
    expect(migration).toContain("references public.intake_value_proposals");
    expect(migration).not.toMatch(/create table if not exists public\.(value_proposals|accepted_facts|property_fact_values|deal_fact_values)/i);
  });

  it("keeps canonical Property and Deal mutation out of conflict recording", () => {
    expect(migration).not.toMatch(/update public\.(properties|brix_deals|deal_properties)\b/i);
    expect(migration).not.toMatch(/delete from public\.(properties|brix_deals|intake_value_proposals|manual_source_records)/i);
    expect(migration).not.toMatch(/merge_property|merge_deal|accept_value_proposal/i);
  });

  it("defines the approved classification, materiality, lifecycle, and resolution vocabularies", () => {
    for (const value of ["no_conflict", "informational_difference", "material_conflict", "identity_conflict", "temporal_change", "unit_scope_conflict", "unresolved_ambiguity"]) {
      expect(migration).toContain(value);
      expect(core).toContain(value);
    }
    for (const value of ["informational", "review", "material", "blocking_identity"]) {
      expect(migration).toContain(value);
      expect(core).toContain(value);
    }
    for (const value of ["keep_current", "accept_proposal", "accept_edited_value", "preserve_as_temporal_change", "preserve_as_different_scope", "mark_not_conflict", "defer", "return_to_identity_review", "cancel_intake_action"]) {
      expect(migration).toContain(value);
      expect(core).toContain(value);
    }
  });

  it("protects conflict records with RLS and RPC-only mutations", () => {
    expect(migration).toContain("alter table public.source_conflicts enable row level security");
    expect(migration).toContain("alter table public.source_conflict_resolutions enable row level security");
    expect(migration).toContain("source conflicts no direct insert");
    expect(migration).toContain("source conflicts no direct update");
    expect(migration).toContain("source conflicts no direct delete");
    expect(migration).toContain("source conflict resolutions no direct insert");
    expect(migration).toContain("source conflict resolutions no direct update");
    expect(migration).toContain("source conflict resolutions no direct delete");
    expect(migration).toContain("public.has_workspace_permission(target_workspace_id, 'deals:manage')");
  });

  it("records safe conflict events and audit records without raw source bodies, tokens, or passwords", () => {
    for (const eventType of ["conflict.detected", "conflict.resolved", "conflict.deferred", "conflict.superseded"]) {
      expect(migration).toContain(eventType);
    }
    expect(migration).toContain("public.safe_event_jsonb");
    expect(migration).toContain("insert into public.domain_events");
    expect(migration).toContain("insert into public.audit_events");
    expect(migration).not.toMatch(/password|access_token|refresh_token|raw_body|raw_snapshot/i);
  });

  it("adds bounded indexes for unresolved review and deterministic ordering", () => {
    for (const indexName of [
      "idx_source_conflicts_workspace_state",
      "idx_source_conflicts_workspace_subject_field",
      "idx_source_conflicts_workspace_order",
      "idx_source_conflict_resolutions_conflict",
    ]) {
      expect(migration).toContain(indexName);
    }
  });

  it("does not activate providers, underwriting, StrategyIQ, ContractIQ, or AI orchestration", () => {
    expect(core).not.toMatch(/invokeBrixFunction|extract-listing|analyze-deal|openai|prompt/i);
    expect(migration).not.toMatch(/provider_credentials|http_post|net\.http|edge function|openai|prompt/i);
  });
});
