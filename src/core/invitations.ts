import { supabase } from "./supabase";

export type WorkspaceInvitationRole = string;

export type WorkspaceInvitation = {
  id: string;
  email: string;
  roleId: WorkspaceInvitationRole;
  status: "pending" | "accepted" | "revoked" | "expired" | "already_member";
  expiresAt?: string;
  invitationLink?: string;
};

export type InvitationAcceptance = {
  invitationId: string;
  workspaceId: string;
  workspaceName: string;
  membershipId: string;
  roleId: string;
  status: "accepted";
};

type InvitationRpcRow = {
  invitation_id?: string | null;
  id?: string | null;
  invited_email?: string | null;
  email?: string | null;
  role_id?: string | null;
  status?: string | null;
  expires_at?: string | null;
  invitation_link?: string | null;
};

type AcceptanceRpcRow = {
  invitation_id?: string | null;
  workspace_id?: string | null;
  workspace_name?: string | null;
  membership_id?: string | null;
  role_id?: string | null;
  status?: string | null;
};

export async function createWorkspaceInvitation(workspaceId: string, email: string, roleId: WorkspaceInvitationRole): Promise<WorkspaceInvitation> {
  const { data, error } = await supabase.rpc("create_workspace_invitation", {
    target_workspace_id: workspaceId,
    invite_email: email,
    invite_role_id: roleId,
  });
  if (error) throw error;
  const invitation = normalizeInvitationRow(firstRow(data));
  if (!invitation) throw new Error("BRIX could not create a usable invitation.");
  return invitation;
}

export async function acceptWorkspaceInvitation(invitationToken: string): Promise<InvitationAcceptance> {
  const { data, error } = await supabase.rpc("accept_workspace_invitation", {
    invitation_token: invitationToken,
  });
  if (error) throw error;
  const acceptance = normalizeAcceptanceRow(firstRow(data));
  if (!acceptance) throw new Error("BRIX could not accept this invitation.");
  return acceptance;
}

export async function resendWorkspaceInvitation(invitationId: string): Promise<WorkspaceInvitation> {
  const { data, error } = await supabase.rpc("resend_workspace_invitation", {
    target_invitation_id: invitationId,
  });
  if (error) throw error;
  const invitation = normalizeInvitationRow(firstRow(data));
  if (!invitation) throw new Error("BRIX could not resend this invitation.");
  return invitation;
}

export async function revokeWorkspaceInvitation(invitationId: string): Promise<WorkspaceInvitation> {
  const { data, error } = await supabase.rpc("revoke_workspace_invitation", {
    target_invitation_id: invitationId,
  });
  if (error) throw error;
  const invitation = normalizeInvitationRow(firstRow(data)) ?? normalizeRevocationRow(firstRow(data));
  if (!invitation) throw new Error("BRIX could not revoke this invitation.");
  return invitation;
}

export async function listWorkspaceInvitations(workspaceId: string): Promise<WorkspaceInvitation[]> {
  const { data, error } = await supabase
    .from("workspace_invitations")
    .select("id,email,role_id,status,expires_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return Array.isArray(data)
    ? data.map(normalizeInvitationRow).filter((value): value is WorkspaceInvitation => Boolean(value))
    : [];
}

export function invitationTokenFromLocation(location: Location = window.location) {
  const token = new URLSearchParams(location.search).get("invite");
  return token?.trim() || null;
}

function firstRow(data: unknown) {
  return Array.isArray(data) ? data[0] : data;
}

function normalizeInvitationRow(row: unknown): WorkspaceInvitation | null {
  if (typeof row !== "object" || row === null || Array.isArray(row)) return null;
  const value = row as InvitationRpcRow;
  const id = value.invitation_id ?? value.id ?? "";
  const email = value.invited_email ?? value.email ?? "";
  const roleId = value.role_id ?? "";
  const status = value.status ?? "";
  if (!email || !isInvitationStatus(status)) return null;
  return {
    id,
    email,
    roleId: roleId || "viewer",
    status,
    expiresAt: value.expires_at ?? undefined,
    invitationLink: value.invitation_link ?? undefined,
  };
}

function normalizeRevocationRow(row: unknown): WorkspaceInvitation | null {
  if (typeof row !== "object" || row === null || Array.isArray(row)) return null;
  const value = row as InvitationRpcRow;
  const id = value.invitation_id ?? value.id ?? "";
  const status = value.status ?? "";
  if (!id || !isInvitationStatus(status)) return null;
  return {
    id,
    email: value.invited_email ?? value.email ?? "",
    roleId: value.role_id || "viewer",
    status,
    expiresAt: value.expires_at ?? undefined,
    invitationLink: value.invitation_link ?? undefined,
  };
}

function normalizeAcceptanceRow(row: unknown): InvitationAcceptance | null {
  if (typeof row !== "object" || row === null || Array.isArray(row)) return null;
  const value = row as AcceptanceRpcRow;
  if (
    typeof value.invitation_id !== "string" ||
    typeof value.workspace_id !== "string" ||
    typeof value.workspace_name !== "string" ||
    typeof value.membership_id !== "string" ||
    typeof value.role_id !== "string" ||
    value.status !== "accepted"
  ) return null;
  return {
    invitationId: value.invitation_id,
    workspaceId: value.workspace_id,
    workspaceName: value.workspace_name,
    membershipId: value.membership_id,
    roleId: value.role_id,
    status: "accepted",
  };
}

function isInvitationStatus(value: string): value is WorkspaceInvitation["status"] {
  return value === "pending" || value === "accepted" || value === "revoked" || value === "expired" || value === "already_member";
}
