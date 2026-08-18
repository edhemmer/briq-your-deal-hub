import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260818162851_spec009_preexisting_rpc_lint_hardening.sql",
  "utf8",
);
const defectRepairMigration = readFileSync(
  "supabase/migrations/20260818163331_spec009_active_rpc_defect_repairs.sql",
  "utf8",
);
const emailHashRepairMigration = readFileSync(
  "supabase/migrations/20260818163518_spec009_email_hash_value_repair.sql",
  "utf8",
);

describe("pre-existing active RPC lint hardening", () => {
  it("pins PL/pgSQL name resolution for active canonical RPCs surfaced by Supabase lint", () => {
    for (const signature of [
      "record_source_conflict(uuid,text,jsonb)",
      "record_source_conflict_resolution(uuid,text,text,jsonb)",
      "create_underwriting_snapshot(uuid,uuid,text,jsonb)",
      "create_underwriting_core_output_run(uuid,uuid,uuid,text,text,jsonb)",
      "create_underwriting_scenario_run(uuid,uuid,uuid,uuid,text,text,text,jsonb)",
      "create_underwriting_sensitivity_run(uuid,uuid,uuid,uuid,text,text,text,jsonb)",
      "record_email_intake_result(uuid,text,jsonb,jsonb,jsonb)",
      "record_file_evidence_intake_result(uuid,text,jsonb,jsonb)",
      "attach_file_evidence_to_deal(uuid,uuid,uuid,uuid,uuid)",
      "attach_email_source_to_deal(uuid,uuid,uuid,uuid,uuid)",
      "complete_manual_property_intake(uuid,text,jsonb,text,uuid)",
      "record_listing_url_import_result(uuid,uuid,uuid,jsonb,jsonb)",
      "record_intake_batch_review(uuid,text,jsonb,jsonb)",
      "record_duplicate_decision(uuid,text,jsonb)",
      "record_source_classification(uuid,text,text,uuid,jsonb)",
      "create_brix_contact(uuid,jsonb,text)",
      "create_brix_organization(uuid,jsonb,text)",
      "attach_contact_to_deal(uuid,uuid,jsonb,text)",
      "attach_organization_to_deal(uuid,uuid,jsonb,text)",
      "list_deal_relationships(uuid)",
      "load_brix_contact(uuid)",
      "load_brix_organization(uuid)",
      "list_deal_work(uuid)",
    ]) {
      expect(migration).toContain(`'public.${signature}'`);
    }

    expect(migration).toContain("pg_get_functiondef(target_oid)");
    expect(migration).toContain("#variable_conflict use_column");
    expect(migration).toContain("execute target_definition");
  });

  it("marks recursive JSON helper routines with stable volatility", () => {
    expect(migration).toContain("alter function public.safe_event_jsonb(jsonb) stable;");
    expect(migration).toContain("alter function public.normalize_manual_location(jsonb) stable;");
  });

  it("repairs the two non-ambiguity active lint defects", () => {
    expect(defectRepairMigration).toContain("public.record_email_intake_result(uuid,text,jsonb,jsonb,jsonb)");
    expect(defectRepairMigration).toContain("E'\\n      email_body_hash,\\n      plain_text_body,\\n'");
    expect(defectRepairMigration).toContain("E'\\n      body_hash,\\n      plain_text_body,\\n'");
    expect(emailHashRepairMigration).toContain("$needle$");
    expect(emailHashRepairMigration).toContain("      body_hash,\n      nullif(safe_meta ->> 'plainTextBody', ''),");
    expect(emailHashRepairMigration).toContain(
      "      email_body_hash,\n      nullif(safe_meta ->> 'plainTextBody', ''),",
    );

    expect(defectRepairMigration).toContain("create or replace function public.list_deal_work(target_deal_id uuid)");
    expect(defectRepairMigration).toContain("from (");
    expect(defectRepairMigration).toContain("as sort_at");
    expect(defectRepairMigration).toContain("order by work.sort_at asc, work.updated_at desc;");
  });
});
