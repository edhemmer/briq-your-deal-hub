import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const core = readFileSync("src/core/packageBatchIntake.ts", "utf8");
const app = readFileSync("src/App.tsx", "utf8");
const migration = readFileSync("supabase/migrations/20260726110000_package_batch_intake.sql", "utf8");

describe("package / batch intake source boundaries", () => {
  it("defines durable batch and item models without creating duplicate Property or Deal tables", () => {
    expect(migration).toContain("create table if not exists public.intake_batches");
    expect(migration).toContain("create table if not exists public.intake_batch_items");
    expect(migration).toContain("references public.properties");
    expect(migration).toContain("references public.brix_deals");
    expect(migration).not.toMatch(/create table if not exists public\.properties/i);
    expect(migration).not.toMatch(/create table if not exists public\.brix_deals/i);
  });

  it("keeps package records server-owned and workspace scoped through RLS", () => {
    expect(migration).toContain("alter table public.intake_batches enable row level security");
    expect(migration).toContain("alter table public.intake_batch_items enable row level security");
    expect(migration).toContain("public.has_workspace_permission(workspace_id, 'deals:manage')");
    expect(migration).toContain("intake batches no direct insert");
    expect(migration).toContain("intake batch items no direct update");
    expect(migration).toContain("grant execute on function public.record_intake_batch_review");
  });

  it("records events and audit without exposing raw client ownership of canonical facts", () => {
    expect(migration).toContain("'intake.batch_reviewed'");
    expect(migration).toContain("insert into public.domain_events");
    expect(migration).toContain("insert into public.audit_events");
    expect(migration).toContain("public.safe_event_jsonb");
  });

  it("uses existing manual intake for explicit deal creation instead of a second creation path", () => {
    expect(core).toContain("createManualIntakeDraft");
    expect(core).not.toContain("create_canonical_deal");
    expect(core).not.toContain("createRemoteDeal");
    expect(app).toContain("createManualDraftFromPackageItem");
    expect(app).toContain("Package / Batch");
  });

  it("keeps provider integrations dormant and absent from the package UI", () => {
    expect(core).not.toMatch(/mls|idx|rets|provider credential/i);
    expect(app).not.toMatch(/MLS package|provider search|licensed listing package/i);
  });
});
