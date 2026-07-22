import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = readFileSync(join(root, "supabase", "migrations", "20260722100000_account_deletion_request_initiation.sql"), "utf8");
const functionSource = readFileSync(join(root, "supabase", "functions", "request-account-deletion", "index.ts"), "utf8");
const appSource = readFileSync(join(root, "src", "App.tsx"), "utf8");
const iosServices = readFileSync(join(root, "ios", "BRIXRealEstateiOS", "BRIXRealEstateiOS", "Services.swift"), "utf8");

describe("account deletion initiation source gates", () => {
  it("records one canonical deletion request and account-level events", () => {
    expect(migration).toContain("request_brix_account_deletion");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("public.account_deletion_requests");
    expect(migration).toContain("status in ('requested', 'processing')");
    expect(migration).toContain("'account.deletion_requested'");
    expect(migration).toContain("public.domain_events");
    expect(migration).toContain("public.audit_events");
  });

  it("uses the Edge Function boundary instead of direct client table writes", () => {
    expect(functionSource).toContain('rpc("request_brix_account_deletion"');
    expect(functionSource).toContain("Authentication required.");
    expect(functionSource).not.toContain(".from(\"brix_profiles\").update");
    expect(appSource).toContain("requestAccountDeletion()");
    expect(appSource).not.toContain(".from(\"account_deletion_requests\")");
  });

  it("marks native account deletion requests as iOS initiated", () => {
    expect(iosServices).toContain('forHTTPHeaderField: "x-brix-client"');
    expect(iosServices).toContain('request.setValue("ios"');
  });
});
