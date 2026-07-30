import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("src/core/underwritingSnapshots.ts", "utf8");
const migration = readFileSync("supabase/migrations/20260730120000_underwriting_immutable_snapshots.sql", "utf8");

describe("underwriting snapshot source boundaries", () => {
  it("keeps snapshot creation provider-neutral and free of browser, AI, and credential behavior", () => {
    expect(source).not.toMatch(/fetch\s*\(|XMLHttpRequest|axios|supabase\.functions|invokeBrixFunction|api[_-]?key|secret|oauth|access_token|refresh_token|bearer/i);
    expect(source).not.toMatch(/zillow|realtor|loopnet|crexi|mls\s*api|openai|anthropic/i);
    expect(source).not.toMatch(/window\.|document\.|localStorage|sessionStorage|navigator\./);
  });

  it("does not create alternate Property, Deal, output, scenario, report, or recommendation paths", () => {
    expect(source).not.toMatch(/\.from\(["'](properties|brix_deals|domain_events|audit_events)["']\)|insert\s*\(|upsert\s*\(|update\s*\(|rpc\s*\(/i);
    expect(source).not.toMatch(/createProperty|createDeal|executeFormula\s*\(|underwriting\.requested|underwriting\.completed|underwriting\.failed/i);
    expect(source).not.toMatch(/scenario|sensitivity|recommendation|market[_-]?data|report[_-]?generation/i);
  });

  it("creates immutable snapshot persistence behind one server-owned RPC", () => {
    expect(migration).toContain("create table if not exists public.underwriting_snapshots");
    expect(migration).toContain("create table if not exists public.underwriting_snapshot_inputs");
    expect(migration).toContain("create table if not exists public.underwriting_snapshot_provenance");
    expect(migration).toContain("create table if not exists public.underwriting_snapshot_formula_manifest");
    expect(migration).toContain("create or replace function public.create_underwriting_snapshot");
    expect(migration).toContain("public.has_workspace_permission(target_workspace_id, 'deals:manage')");
    expect(migration).toContain("constraint underwriting_snapshots_deal_fk foreign key (workspace_id, deal_id)");
    expect(migration).toContain("references public.brix_deals(workspace_id, id) on delete restrict");
    expect(migration).not.toContain("public.create_canonical_deal(");
  });

  it("enforces RLS, direct mutation denial, immutability, idempotency, and lookup indexes", () => {
    for (const table of [
      "underwriting_snapshots",
      "underwriting_snapshot_requests",
      "underwriting_snapshot_inputs",
      "underwriting_snapshot_provenance",
      "underwriting_snapshot_formula_manifest",
    ]) {
      expect(migration).toContain(`alter table public.${table} enable row level security`);
      expect(migration).toContain(`${table.replace(/_/g, " ")} no direct insert`);
      expect(migration).toContain(`${table.replace(/_/g, " ")} no direct update`);
      expect(migration).toContain(`${table.replace(/_/g, " ")} no direct delete`);
    }
    expect(migration).toContain("unique (workspace_id, deal_id, content_hash)");
    expect(migration).toContain("unique (workspace_id, idempotency_key)");
    expect(migration).toContain("idx_underwriting_snapshots_workspace_deal_sequence");
    expect(migration).toContain("idx_underwriting_snapshot_inputs_lookup");
    expect(migration).toContain("create trigger underwriting_snapshots_immutable");
    expect(migration).toContain("raise exception 'Underwriting snapshots are immutable.'");
  });

  it("emits only the snapshot-created event and safe audit payload for this slice", () => {
    expect(migration).toContain("'underwriting.snapshot_created'");
    expect(migration).toContain("insert into public.domain_events");
    expect(migration).toContain("insert into public.audit_events");
    expect(migration).not.toMatch(/underwriting\.requested|underwriting\.completed|underwriting\.failed|password|access_token|refresh_token|service_role/i);
    expect(migration).not.toMatch(/api[_-]?key|oauth|provider_secret|raw_auth|raw_payload/i);
  });
});
