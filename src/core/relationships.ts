import { supabase } from "./supabase";
import type {
  DealRelationship,
  DealRelationshipRole,
  DealRelationshipStatus,
  DuplicateCandidate,
  RelationshipTargetType,
} from "./types";

type UnknownRecord = Record<string, unknown>;

export const relationshipRoles: Array<{ id: DealRelationshipRole; label: string }> = [
  { id: "buyer_investor", label: "Buyer / Investor" },
  { id: "seller_owner", label: "Seller / Owner" },
  { id: "listing_broker", label: "Listing Broker" },
  { id: "buyer_broker", label: "Buyer Broker" },
  { id: "property_manager", label: "Property Manager" },
  { id: "lender", label: "Lender" },
  { id: "mortgage_broker", label: "Mortgage Broker" },
  { id: "attorney", label: "Attorney" },
  { id: "title_escrow", label: "Title / Escrow" },
  { id: "inspector", label: "Inspector" },
  { id: "appraiser", label: "Appraiser" },
  { id: "contractor", label: "Contractor" },
  { id: "architect_engineer", label: "Architect / Engineer" },
  { id: "insurance_professional", label: "Insurance Professional" },
  { id: "association_manager", label: "Association Manager" },
  { id: "tenant", label: "Tenant" },
  { id: "partner_investor", label: "Partner / Investor" },
  { id: "other", label: "Other" },
];

export const relationshipStatuses: Array<{ id: DealRelationshipStatus; label: string }> = [
  { id: "active", label: "Active" },
  { id: "prospective", label: "Prospective" },
  { id: "inactive", label: "Inactive" },
];

export type RelationshipDraft = {
  targetType: RelationshipTargetType;
  displayName: string;
  email?: string;
  phone?: string;
  website?: string;
  role: DealRelationshipRole;
  status: Exclude<DealRelationshipStatus, "removed">;
  notes?: string;
};

export async function listDealRelationships(dealId: string): Promise<DealRelationship[]> {
  const { data, error } = await supabase.rpc("list_deal_relationships", { target_deal_id: dealId });
  if (error) throw error;
  return Array.isArray(data) ? data.map(normalizeRelationship).filter(isRelationship) : [];
}

export async function findRelationshipCandidates(workspaceId: string, draft: RelationshipDraft): Promise<DuplicateCandidate[]> {
  const input = {
    display_name: draft.displayName,
    primary_email: draft.email || null,
    primary_phone: draft.phone || null,
    website: draft.website || null,
  };
  const rpcName = draft.targetType === "contact" ? "find_contact_candidates" : "find_organization_candidates";
  const args = draft.targetType === "contact"
    ? { target_workspace_id: workspaceId, contact_input: input }
    : { target_workspace_id: workspaceId, organization_input: input };
  const { data, error } = await supabase.rpc(rpcName, args);
  if (error) throw error;
  return Array.isArray(data) ? data.map(normalizeCandidate).filter(isCandidate) : [];
}

export async function createAndAttachRelationship(workspaceId: string, dealId: string, draft: RelationshipDraft) {
  const input = {
    display_name: draft.displayName,
    primary_email: draft.email || null,
    primary_phone: draft.phone || null,
    website: draft.website || null,
  };
  const createKey = `relationship:${dealId}:${draft.targetType}:create:${crypto.randomUUID()}`;
  const attachInput = { role: draft.role, status: draft.status, notes: draft.notes || null };

  if (draft.targetType === "contact") {
    const { data: created, error: createError } = await supabase.rpc("create_brix_contact", {
      target_workspace_id: workspaceId,
      contact_input: input,
      idempotency_key: createKey,
    });
    if (createError) throw createError;
    const contactId = firstString(created, "contact_id");
    if (!contactId) throw new Error("BRIX did not return the created contact.");
    const { error: attachError } = await supabase.rpc("attach_contact_to_deal", {
      target_deal_id: dealId,
      target_contact_id: contactId,
      relationship_input: attachInput,
      idempotency_key: `relationship:${dealId}:contact:${contactId}:${draft.role}`,
    });
    if (attachError) throw attachError;
    return;
  }

  const { data: created, error: createError } = await supabase.rpc("create_brix_organization", {
    target_workspace_id: workspaceId,
    organization_input: input,
    idempotency_key: createKey,
  });
  if (createError) throw createError;
  const organizationId = firstString(created, "organization_id");
  if (!organizationId) throw new Error("BRIX did not return the created organization.");
  const { error: attachError } = await supabase.rpc("attach_organization_to_deal", {
    target_deal_id: dealId,
    target_organization_id: organizationId,
    relationship_input: attachInput,
    idempotency_key: `relationship:${dealId}:organization:${organizationId}:${draft.role}`,
  });
  if (attachError) throw attachError;
}

export async function attachExistingRelationship(dealId: string, targetType: RelationshipTargetType, targetId: string, draft: Pick<RelationshipDraft, "role" | "status" | "notes">) {
  const relationshipInput = { role: draft.role, status: draft.status, notes: draft.notes || null };
  const idempotencyKey = `relationship:${dealId}:${targetType}:${targetId}:${draft.role}`;
  if (targetType === "contact") {
    const { error } = await supabase.rpc("attach_contact_to_deal", {
      target_deal_id: dealId,
      target_contact_id: targetId,
      relationship_input: relationshipInput,
      idempotency_key: idempotencyKey,
    });
    if (error) throw error;
    return;
  }
  const { error } = await supabase.rpc("attach_organization_to_deal", {
    target_deal_id: dealId,
    target_organization_id: targetId,
    relationship_input: relationshipInput,
    idempotency_key: idempotencyKey,
  });
  if (error) throw error;
}

export async function updateRelationship(relationship: DealRelationship, update: Pick<DealRelationship, "role" | "status" | "notes">) {
  const { error } = await supabase.rpc("update_deal_relationship", {
    target_relationship_id: relationship.relationshipId,
    expected_version: relationship.relationshipVersion,
    relationship_input: {
      role: update.role,
      status: update.status,
      notes: update.notes || null,
    },
  });
  if (error) throw error;
}

export async function removeRelationship(relationship: DealRelationship) {
  const { error } = await supabase.rpc("deactivate_deal_relationship", {
    target_relationship_id: relationship.relationshipId,
    expected_version: relationship.relationshipVersion,
  });
  if (error) throw error;
}

function normalizeRelationship(value: unknown): DealRelationship | null {
  if (!isRecord(value)) return null;
  const relationshipId = stringValue(value.relationship_id);
  const workspaceId = stringValue(value.workspace_id);
  const dealId = stringValue(value.deal_id);
  const targetType = relationshipTarget(value.target_type);
  const role = relationshipRole(value.role);
  const status = relationshipStatus(value.status);
  const targetDisplayName = stringValue(value.target_display_name);
  const updatedAt = stringValue(value.updated_at);
  if (!relationshipId || !workspaceId || !dealId || !targetType || !role || !status || !targetDisplayName || !updatedAt) return null;

  return {
    relationshipId,
    relationshipVersion: numberValue(value.relationship_version) ?? 1,
    workspaceId,
    dealId,
    targetType,
    contactId: stringValue(value.contact_id),
    organizationId: stringValue(value.organization_id),
    role,
    roleLabel: stringValue(value.role_label) ?? labelForRole(role),
    status,
    statusLabel: stringValue(value.status_label) ?? labelForStatus(status),
    isPrimary: value.is_primary === true,
    notes: stringValue(value.notes),
    communicationPreference: communicationPreference(value.communication_preference),
    targetDisplayName,
    targetEmail: stringValue(value.target_email),
    targetPhone: stringValue(value.target_phone),
    targetWebsite: stringValue(value.target_website),
    targetArchivedAt: stringValue(value.target_archived_at),
    updatedAt,
  };
}

function normalizeCandidate(value: unknown): DuplicateCandidate | null {
  if (!isRecord(value)) return null;
  const id = stringValue(value.contact_id) ?? stringValue(value.organization_id);
  const displayName = stringValue(value.display_name);
  if (!id || !displayName) return null;
  return {
    id,
    displayName,
    email: stringValue(value.primary_email),
    phone: stringValue(value.primary_phone),
    website: stringValue(value.website),
    version: numberValue(value.version) ?? 1,
    matchReasons: Array.isArray(value.match_reasons) ? value.match_reasons.filter((item): item is string => typeof item === "string") : [],
  };
}

function firstString(value: unknown, key: string) {
  const row = Array.isArray(value) ? value[0] : value;
  return isRecord(row) ? stringValue(row[key]) : undefined;
}

function labelForRole(role: DealRelationshipRole) {
  return relationshipRoles.find((item) => item.id === role)?.label ?? "Other";
}

function labelForStatus(status: DealRelationshipStatus) {
  return relationshipStatuses.find((item) => item.id === status)?.label ?? "Removed";
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function relationshipRole(value: unknown): DealRelationshipRole | undefined {
  return relationshipRoles.some((role) => role.id === value) ? value as DealRelationshipRole : undefined;
}

function relationshipStatus(value: unknown): DealRelationshipStatus | undefined {
  return [...relationshipStatuses, { id: "removed" as const, label: "Removed" }].some((status) => status.id === value)
    ? value as DealRelationshipStatus
    : undefined;
}

function relationshipTarget(value: unknown): RelationshipTargetType | undefined {
  return value === "contact" || value === "organization" ? value : undefined;
}

function communicationPreference(value: unknown) {
  return value === "email" || value === "phone" || value === "text" || value === "unknown" ? value : undefined;
}

function isRelationship(value: DealRelationship | null): value is DealRelationship {
  return value !== null;
}

function isCandidate(value: DuplicateCandidate | null): value is DuplicateCandidate {
  return value !== null;
}
