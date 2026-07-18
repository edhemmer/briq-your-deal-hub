import { supabase } from "./supabase";

type WorkspaceContextRow = {
  profile_id: string;
  workspace_id: string;
  workspace_name: string;
  role_id: string;
};

export type WorkspaceContext = {
  profileId: string;
  workspaceId: string;
  workspaceName: string;
  roleId: string;
};

export async function ensureWorkspaceContext(): Promise<WorkspaceContext> {
  const { data, error } = await supabase.rpc("ensure_workspace_context");
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  const context = normalizeWorkspaceContext(row);
  if (!context) throw new Error("BRIX cloud did not return a usable workspace.");
  return context;
}

export function normalizeWorkspaceContext(value: unknown): WorkspaceContext | null {
  if (!isWorkspaceContextRow(value)) return null;
  return {
    profileId: value.profile_id,
    workspaceId: value.workspace_id,
    workspaceName: value.workspace_name,
    roleId: value.role_id,
  };
}

function isWorkspaceContextRow(value: unknown): value is WorkspaceContextRow {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.profile_id === "string" &&
    typeof row.workspace_id === "string" &&
    typeof row.workspace_name === "string" &&
    typeof row.role_id === "string"
  );
}
