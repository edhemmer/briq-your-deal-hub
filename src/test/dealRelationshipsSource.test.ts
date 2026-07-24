import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260723170000_contacts_organizations_deal_relationships.sql", "utf8");
const client = readFileSync("src/core/relationships.ts", "utf8");
const app = readFileSync("src/App.tsx", "utf8");

describe("Specification 003 contacts, organizations, and Deal relationships", () => {
  it("creates canonical workspace-scoped contact, organization, and relationship tables", () => {
    expect(migration).toContain("create table if not exists public.contacts");
    expect(migration).toContain("create table if not exists public.organizations");
    expect(migration).toContain("create table if not exists public.deal_relationships");
    expect(migration).toContain("workspace_id uuid not null references public.workspaces(id)");
    expect(migration).toContain("constraint deal_relationships_exactly_one_target");
    expect(migration).toContain("constraint deal_relationships_deal_fk foreign key (workspace_id, deal_id)");
    expect(migration).toContain("constraint deal_relationships_contact_fk foreign key (workspace_id, contact_id)");
    expect(migration).toContain("constraint deal_relationships_organization_fk foreign key (workspace_id, organization_id)");
  });

  it("keeps lifecycle roles and statuses explicit without building workflow state", () => {
    expect(migration).toContain("create table if not exists public.deal_relationship_role_definitions");
    expect(migration).toContain("create table if not exists public.deal_relationship_status_definitions");
    expect(migration).toContain("'seller_owner', 'Seller / Owner'");
    expect(migration).toContain("'listing_broker', 'Listing Broker'");
    expect(migration).toContain("'lender', 'Lender'");
    expect(migration).toContain("'inspector', 'Inspector'");
    expect(migration).toContain("'contractor', 'Contractor'");
    expect(migration).toContain("'active', 'Active'");
    expect(migration).toContain("'prospective', 'Prospective'");
    expect(migration).toContain("'removed', 'Removed'");
    expect(migration).not.toContain("create table if not exists public.tasks");
    expect(migration).not.toContain("create table if not exists public.deadlines");
  });

  it("prevents duplicate active relationships and supports duplicate candidate warnings", () => {
    expect(migration).toContain("idx_deal_relationships_active_contact_role");
    expect(migration).toContain("idx_deal_relationships_active_organization_role");
    expect(migration).toContain("create or replace function public.find_contact_candidates");
    expect(migration).toContain("create or replace function public.find_organization_candidates");
    expect(migration).toContain("then 'email'");
    expect(migration).toContain("then 'phone'");
    expect(migration).toContain("then 'website'");
    expect(client).toContain("findRelationshipCandidates");
    expect(app).toContain("Possible existing records");
    expect(app).toContain("Create separate record");
  });

  it("requires server RPC mutation, workspace permissions, RLS, and idempotency", () => {
    for (const table of ["contacts", "organizations", "deal_relationships", "relationship_command_requests"]) {
      const policyPrefix = table.replace(/_/g, " ");
      expect(migration).toContain(`alter table public.${table} enable row level security`);
      expect(migration).toContain(`${policyPrefix} no direct insert`);
      expect(migration).toContain(`${policyPrefix} no direct update`);
      expect(migration).toContain(`${policyPrefix} no direct delete`);
    }
    expect(migration).toContain("public.has_workspace_permission(target_workspace_id, 'deals:manage')");
    expect(migration).toContain("public.has_workspace_permission(existing_contact.workspace_id, 'deals:manage')");
    expect(migration).toContain("public.has_workspace_permission(existing_organization.workspace_id, 'deals:manage')");
    expect(migration).toContain("public.has_workspace_permission(existing_relationship.workspace_id, 'deals:manage')");
    expect(migration).toContain("unique (workspace_id, command_name, idempotency_key)");
    expect(migration).toContain("This relationship request has already been used with different data.");
  });

  it("emits safe audit and domain events only from relationship RPCs", () => {
    for (const event of [
      "contact.created",
      "contact.updated",
      "organization.created",
      "organization.updated",
      "relationship.created",
      "relationship.updated",
      "relationship.deactivated",
    ]) {
      expect(migration).toContain(`'${event}'`);
    }
    expect(migration).toContain("relationship_was_created");
    expect(migration).toContain("if relationship_was_created then");
    expect(migration).not.toMatch(/password|token|service_role|raw_user_meta_data/i);
  });

  it("adds a focused Deal-level UI without exposing backend implementation labels", () => {
    expect(app).toContain("Who is involved in this Deal?");
    expect(app).toContain("Add to Deal");
    expect(app).toContain("Relationship removed from this Deal. The person or organization record was kept.");
    expect(app).not.toContain("CRM");
    expect(app).not.toContain("PDRM");
  });

  it("uses the approved client RPC surface for the slice", () => {
    for (const rpc of [
      "list_deal_relationships",
      "find_contact_candidates",
      "find_organization_candidates",
      "create_brix_contact",
      "create_brix_organization",
      "attach_contact_to_deal",
      "attach_organization_to_deal",
      "update_deal_relationship",
      "deactivate_deal_relationship",
    ]) {
      expect(client).toContain(`"${rpc}"`);
    }
  });
});
