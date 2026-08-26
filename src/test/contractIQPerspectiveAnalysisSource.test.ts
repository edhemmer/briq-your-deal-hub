import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const perspectiveMigration = readFileSync("supabase/migrations/20260826132028_spec011_contractiq_perspective_analysis.sql", "utf8");
const indexRepairMigration = readFileSync("supabase/migrations/20260826133629_spec011_contractiq_perspective_fk_index_repair.sql", "utf8");
const conflictTargetRepairMigration = readFileSync("supabase/migrations/20260826133831_spec011_contractiq_perspective_conflict_target_repair.sql", "utf8");
const migration = `${perspectiveMigration}\n${indexRepairMigration}\n${conflictTargetRepairMigration}`;

describe("ContractIQ Slice 4 perspective analysis migration", () => {
  it("adds versioned perspective analysis storage without report, legal, score, or downstream mutation authority", () => {
    for (const table of [
      "public.contract_perspective_analysis_runs",
      "public.contract_perspective_analysis_items",
      "public.contract_amendment_impact_results",
    ]) {
      expect(migration).toContain(`create table if not exists ${table}`);
      expect(migration).toContain(`alter table ${table} enable row level security`);
      expect(migration).toContain(`revoke insert, update, delete on ${table} from authenticated`);
    }

    expect(migration).toContain("contractiq-perspective-analysis-v1");
    expect(migration).toContain("source_version_graph jsonb not null");
    expect(migration).toContain("result_payload jsonb not null");
    expect(migration).toContain("downstream_mutation_allowed boolean not null default false");
    expect(migration).toContain("constraint contract_perspective_items_no_mutation check (downstream_mutation_allowed = false)");
    expect(migration).toContain("constraint contract_amendment_impacts_no_mutation check (downstream_mutation_allowed = false)");
    expect(migration).toContain("constraint contract_amendment_impacts_run_hash_unique unique");
    expect(migration).not.toMatch(/contract_risk_score|risk_score\s+numeric|legal_conclusion\s+(text|jsonb|boolean)|full_due_diligence_report|buyer_due_diligence_summary_report|create table .*offeriq/i);
  });

  it("uses authenticated server-owned RPCs with idempotency, authorization, prior-valid, stale, and event behavior", () => {
    expect(migration).toContain("create or replace function public.record_contract_perspective_analysis_result");
    expect(migration).toContain("public.authorized_contract(target_contract_id)");
    expect(migration).toContain("public.has_workspace_permission(target_contract.workspace_id, 'deals:manage')");
    expect(migration).toContain("public.ensure_contract_command");
    expect(migration).toContain("prior_valid_analysis_run_id");
    expect(migration).toContain("prior_valid_preserved");
    expect(migration).toContain("Superseded by newer ContractIQ perspective analysis result.");
    expect(migration).toContain("contract.perspective_analysis_completed");
    expect(migration).toContain("contract.perspective_analysis_failed_with_prior_valid");
    expect(migration).toContain("contract.amendment_impact_identified");
    expect(migration).toContain("public.domain_events");
    expect(migration).toContain("public.audit_events");
    expect(migration).toContain("revoke execute on function public.record_contract_perspective_analysis_result(uuid, jsonb, integer, text) from public, anon");
    expect(migration).toContain("grant execute on function public.record_contract_perspective_analysis_result(uuid, jsonb, integer, text) to authenticated");
  });

  it("indexes foreign keys and current lookup paths for Supabase advisor hygiene", () => {
    for (const indexName of [
      "idx_contract_perspective_runs_current",
      "idx_contract_perspective_runs_contract",
      "idx_contract_perspective_runs_deal",
      "idx_contract_perspective_runs_property",
      "idx_contract_perspective_runs_prior_fk",
      "idx_contract_perspective_items_run",
      "idx_contract_perspective_items_contract_kind",
      "idx_contract_perspective_items_deal",
      "idx_contract_perspective_items_property",
      "idx_contract_perspective_items_perspective_fk",
      "idx_contract_amendment_impacts_run",
      "idx_contract_amendment_impacts_contract",
      "idx_contract_amendment_impacts_relationship_fk",
      "idx_contract_amendment_impacts_base_contract_fk",
      "idx_contract_amendment_impacts_amendment_contract_fk",
      "idx_contract_amendment_impacts_deal_fk",
      "idx_contract_amendment_impacts_property_fk",
    ]) {
      expect(migration).toMatch(new RegExp(`create\\s+(unique\\s+)?index\\s+if\\s+not\\s+exists\\s+${indexName}`, "i"));
    }
  });

  it("connects projection and detail surfaces while leaving canonical task/deadline/timeline ownership alone", () => {
    for (const field of [
      "current_perspective_analysis_state",
      "perspective_benefit_count",
      "perspective_risk_count",
      "perspective_unusual_term_count",
      "perspective_missing_protection_count",
      "perspective_missing_information_count",
      "perspective_amendment_impact_count",
      "perspective_negotiation_concept_count",
      "perspective_downstream_candidate_count",
      "perspective_prior_valid_available",
      "'perspective_analysis_run'::text",
      "'perspective_analysis_item'::text",
      "'amendment_impact_result'::text",
    ]) {
      expect(migration).toContain(field);
    }

    expect(migration).not.toMatch(/create table if not exists public\.contract_tasks|create table if not exists public\.contract_timeline|insert into public\.tasks|insert into public\.deadlines/i);
  });

  it("keeps negotiation concepts bounded to discussion drafts for licensed professional review", () => {
    expect(migration).toContain("DISCUSSION DRAFT");
    expect(migration).toContain("FOR LICENSED PROFESSIONAL REVIEW");
    expect(migration).toContain("'negotiation_concept'");
    expect(migration).toContain("'candidate_only'");
  });
});
