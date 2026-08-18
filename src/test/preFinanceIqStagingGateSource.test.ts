import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const advisorHardening = readFileSync(
  "supabase/migrations/20260818120000_pre_financeiq_advisor_hardening.sql",
  "utf8",
);
const createDealWorkspaceStatus = readFileSync(
  "supabase/migrations/20260818121000_fix_create_canonical_deal_workspace_status.sql",
  "utf8",
);
const createDealIdempotency = readFileSync(
  "supabase/migrations/20260818122000_fix_create_canonical_deal_idempotency_ambiguity.sql",
  "utf8",
);
const createDealReturning = readFileSync(
  "supabase/migrations/20260818123000_fix_create_canonical_deal_returning_ambiguity.sql",
  "utf8",
);
const commandRetry = readFileSync(
  "supabase/migrations/20260818124000_fix_command_retry_idempotency_ambiguity.sql",
  "utf8",
);
const mutationResolution = readFileSync(
  "supabase/migrations/20260818130000_stabilize_canonical_deal_rpc_variable_resolution.sql",
  "utf8",
);

describe("Pre-FinanceIQ staging gate database repairs", () => {
  it("keeps underwriting views subject to caller RLS and pins helper search paths", () => {
    for (const viewName of [
      "underwriting_run_summaries",
      "underwriting_core_outputs",
      "underwriting_output_group_results",
      "underwriting_result_details",
      "underwriting_latest_confirmed_results",
      "underwriting_run_comparison_basis",
      "underwriting_scenario_summaries",
      "underwriting_scenario_override_details",
      "underwriting_scenario_comparison_details",
      "underwriting_latest_scenario_versions",
      "underwriting_sensitivity_summaries",
      "underwriting_sensitivity_point_results",
    ]) {
      expect(advisorHardening).toContain(`alter view public.${viewName} set (security_invoker = true);`);
    }

    for (const functionName of [
      "underwriting_scenario_text_array(jsonb)",
      "underwriting_scenario_numeric_array(jsonb)",
      "normalize_contact_phone(text)",
      "normalize_website_domain(text)",
    ]) {
      expect(advisorHardening).toContain(`alter function public.${functionName} set search_path = public, pg_temp;`);
    }
  });

  it("disambiguates canonical Deal creation workspace, idempotency, and returned Deal fields", () => {
    expect(createDealWorkspaceStatus).toContain("workspace_record.status = 'active'");
    expect(createDealIdempotency).toContain(
      "on conflict on constraint deal_creation_requests_workspace_id_idempotency_key_key do nothing",
    );
    expect(createDealIdempotency).toContain("public.deal_creation_requests.idempotency_key = cleaned_key");
    expect(createDealReturning).toContain("insert into public.brix_deals as inserted_deal");
    expect(createDealReturning).toContain(
      "returning inserted_deal.id, inserted_deal.version, inserted_deal.stage, inserted_deal.operating_status",
    );
  });

  it("disambiguates shared command idempotency helpers", () => {
    expect(commandRetry).toContain(
      "on conflict on constraint deal_command_requests_workspace_id_idempotency_key_key do nothing",
    );
    expect(commandRetry).toContain("public.deal_command_requests.idempotency_key = cleaned_key");
    expect(commandRetry).toContain(
      "on conflict on constraint work_command_requests_workspace_id_idempotency_key_key do nothing",
    );
    expect(commandRetry).toContain("public.work_command_requests.idempotency_key = cleaned_key");
  });

  it("stabilizes PL/pgSQL variable resolution for canonical mutation RPCs", () => {
    for (const functionName of [
      "create_canonical_deal",
      "update_canonical_property",
      "update_canonical_deal",
      "update_deal_lifecycle",
      "archive_deal",
      "restore_deal",
    ]) {
      expect(mutationResolution).toContain(`create or replace function public.${functionName}`);
    }

    expect(mutationResolution.match(/#variable_conflict use_variable/g)).toHaveLength(6);
    expect(mutationResolution).toContain("update public.properties as updated_property");
    expect(mutationResolution).toContain("update public.brix_deals as updated_deal");
    expect(mutationResolution).toContain("returning updated_deal.id, updated_deal.version");
  });
});
