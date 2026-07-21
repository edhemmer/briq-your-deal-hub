import { supabase } from "./supabase";

export type WorkspaceAccessRole = {
  id: string;
  name: string;
  description: string;
};

export type WorkspaceAccessMember = {
  membershipId: string;
  workspaceId: string;
  userId: string;
  email: string;
  fullName?: string;
  roleId: string;
  roleName: string;
  roleDescription: string;
  status: "active" | "revoked";
  joinedAt?: string;
  invitedAt?: string;
  updatedAt: string;
  revokedAt?: string;
  canChangeRole: boolean;
  canRevoke: boolean;
};

type RoleRow = {
  role_id?: string | null;
  role_name?: string | null;
  role_description?: string | null;
};

type MemberRow = {
  membership_id?: string | null;
  workspace_id?: string | null;
  user_id?: string | null;
  email?: string | null;
  full_name?: string | null;
  role_id?: string | null;
  role_name?: string | null;
  role_description?: string | null;
  status?: string | null;
  joined_at?: string | null;
  invited_at?: string | null;
  updated_at?: string | null;
  revoked_at?: string | null;
  can_change_role?: boolean | null;
  can_revoke?: boolean | null;
};

type MutationRow = {
  membership_id?: string | null;
  workspace_id?: string | null;
  user_id?: string | null;
  role_id?: string | null;
  status?: string | null;
  updated_at?: string | null;
};

export async function listWorkspaceAccessRoles(): Promise<WorkspaceAccessRole[]> {
  const { data, error } = await supabase.rpc("list_workspace_access_roles");
  if (error) throw error;
  return Array.isArray(data)
    ? data.map(normalizeRoleRow).filter((role): role is WorkspaceAccessRole => Boolean(role))
    : [];
}

export async function listWorkspaceAccessMembers(workspaceId: string): Promise<WorkspaceAccessMember[]> {
  const { data, error } = await supabase.rpc("list_workspace_memberships", {
    target_workspace_id: workspaceId,
  });
  if (error) throw error;
  return Array.isArray(data)
    ? data.map(normalizeMemberRow).filter((member): member is WorkspaceAccessMember => Boolean(member))
    : [];
}

export async function changeWorkspaceMemberRole(membershipId: string, newRoleId: string, expectedUpdatedAt: string) {
  const { data, error } = await supabase.rpc("change_workspace_member_role", {
    target_membership_id: membershipId,
    new_role_id: newRoleId,
    expected_updated_at: expectedUpdatedAt,
  });
  if (error) throw error;
  return normalizeMutationRow(firstRow(data));
}

export async function revokeWorkspaceMemberAccess(membershipId: string, expectedUpdatedAt: string) {
  const { data, error } = await supabase.rpc("revoke_workspace_member", {
    target_membership_id: membershipId,
    expected_updated_at: expectedUpdatedAt,
    revoke_reason: "Removed from workspace access screen",
  });
  if (error) throw error;
  return normalizeMutationRow(firstRow(data));
}

function normalizeRoleRow(row: unknown): WorkspaceAccessRole | null {
  if (!isRecord(row)) return null;
  const value = row as RoleRow;
  if (!value.role_id || !value.role_name) return null;
  return {
    id: value.role_id,
    name: value.role_name,
    description: value.role_description ?? "",
  };
}

function normalizeMemberRow(row: unknown): WorkspaceAccessMember | null {
  if (!isRecord(row)) return null;
  const value = row as MemberRow;
  const status = value.status ?? "";
  if (
    !value.membership_id ||
    !value.workspace_id ||
    !value.user_id ||
    !value.role_id ||
    !value.role_name ||
    !isMembershipStatus(status) ||
    !value.updated_at
  ) return null;

  return {
    membershipId: value.membership_id,
    workspaceId: value.workspace_id,
    userId: value.user_id,
    email: value.email ?? "",
    fullName: value.full_name ?? undefined,
    roleId: value.role_id,
    roleName: value.role_name,
    roleDescription: value.role_description ?? "",
    status,
    joinedAt: value.joined_at ?? undefined,
    invitedAt: value.invited_at ?? undefined,
    updatedAt: value.updated_at,
    revokedAt: value.revoked_at ?? undefined,
    canChangeRole: Boolean(value.can_change_role),
    canRevoke: Boolean(value.can_revoke),
  };
}

function normalizeMutationRow(row: unknown) {
  if (!isRecord(row)) return null;
  const value = row as MutationRow;
  if (!value.membership_id || !value.workspace_id || !value.user_id || !value.role_id || !value.status || !value.updated_at) return null;
  return {
    membershipId: value.membership_id,
    workspaceId: value.workspace_id,
    userId: value.user_id,
    roleId: value.role_id,
    status: value.status,
    updatedAt: value.updated_at,
  };
}

function firstRow(data: unknown) {
  return Array.isArray(data) ? data[0] : data;
}

function isMembershipStatus(value: string): value is WorkspaceAccessMember["status"] {
  return value === "active" || value === "revoked";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
