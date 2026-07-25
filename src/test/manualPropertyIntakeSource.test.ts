import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260725152000_manual_property_intake.sql", "utf8");
const app = readFileSync("src/App.tsx", "utf8");
const propertyIntake = readFileSync("src/core/propertyIntake.ts", "utf8");
const offlineDrafts = readFileSync("src/core/offlineDrafts.ts", "utf8");
const dbTypes = readFileSync("src/core/supabaseDatabase.types.ts", "utf8");

describe("Specification 004 manual address and Property intake slice", () => {
  it("adds manual intake/source records without duplicating canonical Deal or Property foundations", () => {
    expect(migration).toContain("create table if not exists public.property_intakes");
    expect(migration).toContain("create table if not exists public.manual_source_records");
    expect(migration).not.toContain("create table if not exists public.canonical_deals");
    expect(migration).not.toContain("create table if not exists public.property_deals");
    expect(migration).not.toContain("create table if not exists public.properties");
    expect(migration).not.toContain("create table if not exists public.brix_deals");
    expect(migration).toContain("public.create_canonical_deal");
    expect(offlineDrafts).toContain('"create_canonical_deal"');
  });

  it("keeps the slice manual-only and defers listing, file, email, package, and enrichment intake", () => {
    expect(propertyIntake).toContain("manualIntakeInput");
    expect(propertyIntake).not.toMatch(/listing_url|listingUrl|extract-listing|sourceUrl|email_intake|batch_intake|package_intake|enrichment/i);
    expect(app).not.toContain("Address, listing URL, or listing text");
    expect(app).not.toMatch(/Create deal file/i);
  });

  it("normalizes address input without inventing unavailable facts", () => {
    expect(migration).toContain("create or replace function public.normalize_manual_location");
    expect(migration).toContain("raw_location");
    expect(migration).toContain("unit_number");
    expect(migration).toContain("display_address");
    expect(migration).toContain("original_input");
    expect(migration).toContain("raise exception 'Enter an address or descriptive location to start manual intake.'");
    expect(propertyIntake).toContain("region: stringValue(value.region)?.toUpperCase()");
    expect(propertyIntake).toContain('country: stringValue(value.country)?.toUpperCase() ?? "US"');
  });

  it("classifies manual values as user-entered, assumption, descriptive, unknown, and unverified", () => {
    expect(migration).toContain("create or replace function public.classify_manual_intake_values");
    expect(migration).toContain("user_entered_fact");
    expect(migration).toContain("user_assumption");
    expect(migration).toContain("descriptive_input");
    expect(migration).toContain("unknown");
    expect(migration).toContain("'verification_state', 'unverified'");
    expect(migration).toContain("verification_state text not null default 'unverified'");
  });

  it("requires an explicit duplicate decision before canonical creation", () => {
    expect(migration).toContain("search_manual_property_candidates");
    expect(migration).toContain("requested_decision not in ('use_existing_property', 'create_new_property')");
    expect(migration).toContain("selected_property_id is null");
    expect(migration).toContain("case when requested_decision = 'use_existing_property' then selected_property_id else null end");
    expect(app).toContain("Use this Property");
    expect(app).toContain("Create a new Property instead");
    expect(app).toContain("Choose the existing Property to use.");
  });

  it("creates the canonical records and source trail through idempotent server commands", () => {
    expect(migration).toContain("unique (workspace_id, idempotency_key)");
    expect(migration).toContain("'manual-intake:deal:' || cleaned_key");
    expect(migration).not.toContain("'id', gen_random_uuid()");
    expect(migration).toContain("insert into public.manual_source_records");
    expect(migration).toContain("'intake.created'");
    expect(migration).toContain("'property.match_candidates_found'");
    expect(migration).toContain("'property.match_resolved'");
    expect(migration).toContain("'intake.completed'");
    expect(migration).toContain("insert into public.audit_events");
  });

  it("protects intake tables with RLS and grants mutation only through RPCs", () => {
    expect(migration).toContain("alter table public.property_intakes enable row level security");
    expect(migration).toContain("alter table public.manual_source_records enable row level security");
    expect(migration).toContain("property intakes no direct insert");
    expect(migration).toContain("manual source records no direct insert");
    expect(migration).toContain("with check (false)");
    expect(migration).toContain("grant execute on function public.search_manual_property_candidates");
    expect(migration).toContain("grant execute on function public.complete_manual_property_intake");
  });

  it("reuses existing offline draft infrastructure for manual intake sync", () => {
    expect(offlineDrafts).toContain("ManualIntakeDraftPayload");
    expect(offlineDrafts).toContain("completeManualPropertyIntake");
    expect(offlineDrafts).toContain("manualIntakeDealFromResult");
    expect(app).toContain("payload: { manualIntake: draft }");
    expect(app).toContain('draftType: "new_deal"');
    expect(app).toContain('commandType: "create_canonical_deal"');
  });

  it("keeps Supabase client types aware of the new tables and functions", () => {
    expect(dbTypes).toContain("manual_source_records:");
    expect(dbTypes).toContain("property_intakes:");
    expect(dbTypes).toContain("search_manual_property_candidates:");
    expect(dbTypes).toContain("complete_manual_property_intake:");
    expect(dbTypes).toContain("source_record_id: string");
  });
});
