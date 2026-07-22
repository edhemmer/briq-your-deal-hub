import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { downloadDecisionPdf, downloadWorkbook } from "../core/reportExports";
import { loadAnonymousDeals, loadRemoteDeals, normalizeDealRecord, normalizeDealRow, persistRemoteDeal, saveAnonymousDeals } from "../core/store";
import type { DealFacts } from "../core/types";

const mocks = vi.hoisted(() => ({
  session: { value: { user: { id: "user-1" } } as { user: { id: string } } | null },
  user: { value: { id: "user-1", email: "edhemmer@gmail.com" } as { id: string; email: string } | null },
  remoteDeals: { value: [] as Array<Record<string, unknown>> },
  invitations: { value: [] as Array<Record<string, unknown>> },
  accessRoles: { value: [
    { role_id: "admin", role_name: "Administrator", role_description: "Can manage workspace settings, invitations, members, and deal work." },
    { role_id: "analyst", role_name: "Analyst", role_description: "Can review deal information and run analysis without managing trusted access." },
    { role_id: "contributor", role_name: "Contributor", role_description: "Can add and update deal work without managing trusted access." },
    { role_id: "viewer", role_name: "Viewer", role_description: "Can view workspace information without changing deal work or access." },
    { role_id: "billing_admin", role_name: "Billing Administrator", role_description: "Can manage billing-related settings without managing deal work or access." },
  ] as Array<Record<string, unknown>> },
  workspaceMembers: { value: [
    {
      membership_id: "membership-owner",
      workspace_id: "workspace-1",
      user_id: "user-1",
      email: "edhemmer@gmail.com",
      full_name: "Ed Hemmer",
      role_id: "owner",
      role_name: "Owner",
      role_description: "Full workspace ownership and billing authority.",
      status: "active",
      joined_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
      can_change_role: false,
      can_revoke: false,
    },
  ] as Array<Record<string, unknown>> },
  workspaceContext: { value: { profile_id: "user-1", workspace_id: "workspace-1", workspace_name: "edhemmer's BRIX Workspace", role_id: "owner" } as Record<string, string> },
  authChangeCallback: { value: null as null | ((_event: string, session: { user: { id: string } } | null) => void) },
  queriedOwnerIds: { value: [] as string[] },
  rpc: vi.fn(async (name: string, args?: Record<string, unknown>) => {
    if (name === "ensure_workspace_context") return { data: [mocks.workspaceContext.value], error: null };
    if (name === "list_workspace_access_roles") return { data: mocks.accessRoles.value, error: null };
    if (name === "list_workspace_memberships") return { data: mocks.workspaceMembers.value, error: null };
    if (name === "change_workspace_member_role") {
      const updatedAt = "2026-01-02T00:00:00.000Z";
      mocks.workspaceMembers.value = mocks.workspaceMembers.value.map((row) => row.membership_id === args?.target_membership_id ? {
        ...row,
        role_id: args?.new_role_id,
        role_name: mocks.accessRoles.value.find((role) => role.role_id === args?.new_role_id)?.role_name,
        role_description: mocks.accessRoles.value.find((role) => role.role_id === args?.new_role_id)?.role_description,
        updated_at: updatedAt,
      } : row);
      return {
        data: [{
          membership_id: args?.target_membership_id,
          workspace_id: "workspace-1",
          user_id: "user-2",
          role_id: args?.new_role_id,
          status: "active",
          updated_at: updatedAt,
        }],
        error: null,
      };
    }
    if (name === "revoke_workspace_member") {
      const updatedAt = "2026-01-03T00:00:00.000Z";
      mocks.workspaceMembers.value = mocks.workspaceMembers.value.map((row) => row.membership_id === args?.target_membership_id ? {
        ...row,
        status: "revoked",
        revoked_at: updatedAt,
        updated_at: updatedAt,
        can_change_role: false,
        can_revoke: false,
      } : row);
      return {
        data: [{
          membership_id: args?.target_membership_id,
          workspace_id: "workspace-1",
          user_id: "user-2",
          role_id: "viewer",
          status: "revoked",
          updated_at: updatedAt,
        }],
        error: null,
      };
    }
    if (name === "create_workspace_invitation") {
      const row = {
        invitation_id: "invite-1",
        invited_email: args?.invite_email,
        role_id: args?.invite_role_id ?? "viewer",
        status: "pending",
        expires_at: "2026-01-08T00:00:00.000Z",
        invitation_link: "https://www.brixrealestate.app/account?invite=raw-token-1",
      };
      mocks.invitations.value = [{
        id: row.invitation_id,
        email: row.invited_email,
        role_id: row.role_id,
        status: row.status,
        expires_at: row.expires_at,
      }];
      return { data: [row], error: null };
    }
    if (name === "accept_workspace_invitation") {
      return {
        data: [{
          invitation_id: "invite-1",
          workspace_id: "workspace-1",
          workspace_name: "Invited Workspace",
          membership_id: "membership-1",
          role_id: "member",
          status: "accepted",
        }],
        error: null,
      };
    }
    if (name === "resend_workspace_invitation") {
      return {
        data: [{
          invitation_id: args?.target_invitation_id ?? "invite-1",
          invited_email: "teammate@example.com",
          role_id: "member",
          status: "pending",
          expires_at: "2026-01-09T00:00:00.000Z",
          invitation_link: "https://www.brixrealestate.app/account?invite=raw-token-2",
        }],
        error: null,
      };
    }
    if (name === "revoke_workspace_invitation") {
      mocks.invitations.value = mocks.invitations.value.map((row) => row.id === args?.target_invitation_id ? { ...row, status: "revoked" } : row);
      return {
        data: [{
          invitation_id: args?.target_invitation_id ?? "invite-1",
          invited_email: "teammate@example.com",
          role_id: "member",
          status: "revoked",
          expires_at: "2026-01-09T00:00:00.000Z",
        }],
        error: null,
      };
    }
    return { data: null, error: null };
  }),
  upsert: vi.fn((row: Record<string, unknown>) => ({
    select: vi.fn(() => ({
      single: vi.fn(async () => ({ data: { ...row, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, error: null })),
    })),
  })),
  update: vi.fn(() => ({
    eq: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({ data: { id: "deleted-id" }, error: null })),
        })),
      })),
    })),
  })),
  signInWithPassword: vi.fn(async () => ({ data: { session: mocks.session.value }, error: null })),
  signUp: vi.fn(async () => ({ data: { session: mocks.session.value }, error: null })),
  resetPasswordForEmail: vi.fn(async () => ({ data: {}, error: null })),
  updateUser: vi.fn(async () => ({ data: { user: mocks.user.value }, error: null })),
  signOut: vi.fn(async () => ({ error: null })),
  getSession: vi.fn(async () => ({ data: { session: mocks.session.value } })),
  insert: vi.fn(async () => ({ data: null, error: null })),
  invokeFunction: vi.fn(async (_name: string, _options?: { body?: unknown }) => ({ data: { ok: true, requestId: "delete-request-1", status: "requested", requestedAt: "2026-01-04T00:00:00.000Z" }, error: null })),
  downloadDecisionPdf: vi.fn(async () => undefined),
  downloadWorkbook: vi.fn(async () => undefined),
}));

vi.mock("../core/supabase", () => ({
  invokeBrixFunction: vi.fn(async (name: string, body: unknown) => {
    const { data, error } = await mocks.invokeFunction(name, { body });
    if (error) throw error;
    return data;
  }),
  supabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: vi.fn((callback: (_event: string, session: { user: { id: string } } | null) => void) => {
        mocks.authChangeCallback.value = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      getUser: vi.fn(async () => ({ data: { user: mocks.user.value } })),
      signInWithPassword: mocks.signInWithPassword,
      signUp: mocks.signUp,
      resetPasswordForEmail: mocks.resetPasswordForEmail,
      updateUser: mocks.updateUser,
      signOut: mocks.signOut,
    },
    from: vi.fn((table: string) => {
      if (table === "brix_deals") {
        const activeRemoteRows = () => mocks.remoteDeals.value.filter((row) => row.deleted_at === undefined || row.deleted_at === null);
        return {
          select: vi.fn(() => ({
            is: vi.fn((field: string, value: unknown) => ({
              order: vi.fn(async () => ({ data: field === "deleted_at" && value === null ? activeRemoteRows() : mocks.remoteDeals.value, error: null })),
            })),
            eq: vi.fn((field: string, value: string) => {
              if (field === "owner_id") mocks.queriedOwnerIds.value.push(value);
              return {
                is: vi.fn((isField: string, isValue: unknown) => ({
                  order: vi.fn(async () => ({ data: isField === "deleted_at" && isValue === null ? activeRemoteRows() : mocks.remoteDeals.value, error: null })),
                })),
              };
            }),
          })),
          upsert: mocks.upsert,
          update: mocks.update,
        };
      }
      if (table === "audit_events" || table === "domain_events") {
        return { insert: mocks.insert };
      }
      if (table === "workspace_invitations") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(async () => ({ data: mocks.invitations.value, error: null })),
              })),
            })),
          })),
        };
      }
      return { insert: mocks.insert };
    }),
    rpc: mocks.rpc,
    functions: { invoke: mocks.invokeFunction },
  },
}));

vi.mock("../core/reportExports", () => ({
  downloadDecisionPdf: mocks.downloadDecisionPdf,
  downloadWorkbook: mocks.downloadWorkbook,
}));

function installDefaultRpcMock() {
  mocks.rpc.mockImplementation(async (name: string, args?: Record<string, unknown>) => {
    if (name === "ensure_workspace_context") return { data: [mocks.workspaceContext.value], error: null };
    if (name === "list_workspace_access_roles") return { data: mocks.accessRoles.value, error: null };
    if (name === "list_workspace_memberships") return { data: mocks.workspaceMembers.value, error: null };
    if (name === "change_workspace_member_role") {
      const updatedAt = "2026-01-02T00:00:00.000Z";
      mocks.workspaceMembers.value = mocks.workspaceMembers.value.map((row) => row.membership_id === args?.target_membership_id ? {
        ...row,
        role_id: args?.new_role_id,
        role_name: mocks.accessRoles.value.find((role) => role.role_id === args?.new_role_id)?.role_name,
        role_description: mocks.accessRoles.value.find((role) => role.role_id === args?.new_role_id)?.role_description,
        updated_at: updatedAt,
      } : row);
      return {
        data: [{
          membership_id: args?.target_membership_id,
          workspace_id: "workspace-1",
          user_id: "user-2",
          role_id: args?.new_role_id,
          status: "active",
          updated_at: updatedAt,
        }],
        error: null,
      };
    }
    if (name === "revoke_workspace_member") {
      const updatedAt = "2026-01-03T00:00:00.000Z";
      mocks.workspaceMembers.value = mocks.workspaceMembers.value.map((row) => row.membership_id === args?.target_membership_id ? {
        ...row,
        status: "revoked",
        revoked_at: updatedAt,
        updated_at: updatedAt,
        can_change_role: false,
        can_revoke: false,
      } : row);
      return {
        data: [{
          membership_id: args?.target_membership_id,
          workspace_id: "workspace-1",
          user_id: "user-2",
          role_id: "viewer",
          status: "revoked",
          updated_at: updatedAt,
        }],
        error: null,
      };
    }
    if (name === "create_workspace_invitation") {
      const row = {
        invitation_id: "invite-1",
        invited_email: args?.invite_email,
        role_id: args?.invite_role_id ?? "viewer",
        status: "pending",
        expires_at: "2026-01-08T00:00:00.000Z",
        invitation_link: "https://www.brixrealestate.app/account?invite=raw-token-1",
      };
      mocks.invitations.value = [{
        id: row.invitation_id,
        email: row.invited_email,
        role_id: row.role_id,
        status: row.status,
        expires_at: row.expires_at,
      }];
      return { data: [row], error: null };
    }
    if (name === "accept_workspace_invitation") {
      return {
        data: [{
          invitation_id: "invite-1",
          workspace_id: "workspace-1",
          workspace_name: "Invited Workspace",
          membership_id: "membership-1",
          role_id: "member",
          status: "accepted",
        }],
        error: null,
      };
    }
    if (name === "resend_workspace_invitation") {
      return {
        data: [{
          invitation_id: args?.target_invitation_id ?? "invite-1",
          invited_email: "teammate@example.com",
          role_id: "member",
          status: "pending",
          expires_at: "2026-01-09T00:00:00.000Z",
          invitation_link: "https://www.brixrealestate.app/account?invite=raw-token-2",
        }],
        error: null,
      };
    }
    if (name === "revoke_workspace_invitation") {
      mocks.invitations.value = mocks.invitations.value.map((row) => row.id === args?.target_invitation_id ? { ...row, status: "revoked" } : row);
      return {
        data: [{
          invitation_id: args?.target_invitation_id ?? "invite-1",
          invited_email: "teammate@example.com",
          role_id: "member",
          status: "revoked",
          expires_at: "2026-01-09T00:00:00.000Z",
        }],
        error: null,
      };
    }
    return { data: null, error: null };
  });
}

function installDefaultSupabaseMocks() {
  installDefaultRpcMock();
  mocks.upsert.mockImplementation((row: Record<string, unknown>) => ({
    select: vi.fn(() => ({
      single: vi.fn(async () => ({ data: { ...row, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, error: null })),
    })),
  }));
  mocks.update.mockImplementation(() => ({
    eq: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({ data: { id: "deleted-id" }, error: null })),
        })),
      })),
    })),
  }));
  mocks.signInWithPassword.mockImplementation(async () => ({ data: { session: mocks.session.value }, error: null }));
  mocks.signUp.mockImplementation(async () => ({ data: { session: mocks.session.value }, error: null }));
  mocks.resetPasswordForEmail.mockImplementation(async () => ({ data: {}, error: null }));
  mocks.updateUser.mockImplementation(async () => ({ data: { user: mocks.user.value }, error: null }));
  mocks.signOut.mockImplementation(async () => ({ error: null }));
  mocks.getSession.mockImplementation(async () => ({ data: { session: mocks.session.value } }));
  mocks.insert.mockImplementation(async () => ({ data: null, error: null }));
  mocks.invokeFunction.mockImplementation(async (_name: string, _options?: { body?: unknown }) => ({
    data: { ok: true, requestId: "delete-request-1", status: "requested", requestedAt: "2026-01-04T00:00:00.000Z" },
    error: null,
  }));
  mocks.downloadDecisionPdf.mockImplementation(async () => undefined);
  mocks.downloadWorkbook.mockImplementation(async () => undefined);
}

function draftDeal(id: string, address: string): DealFacts {
  return {
    id,
    address,
    status: "draft",
    strategyId: "owner_occupant",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    notes: [],
    photoUrls: [],
    uploadedPhotoNames: [],
    verification: {},
  };
}

function remoteDealRow(id: string, ownerId: string, address: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    owner_id: ownerId,
    address,
    status: "draft",
    strategy_id: "owner_occupant",
    facts: draftDeal(id, address),
    ...extra,
  };
}

describe("BRIX app module flow", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/app");
    mocks.session.value = { user: { id: "user-1" } };
    mocks.user.value = { id: "user-1", email: "edhemmer@gmail.com" };
    mocks.remoteDeals.value = [];
    mocks.invitations.value = [];
    mocks.workspaceMembers.value = [{
      membership_id: "membership-owner",
      workspace_id: "workspace-1",
      user_id: "user-1",
      email: "edhemmer@gmail.com",
      full_name: "Ed Hemmer",
      role_id: "owner",
      role_name: "Owner",
      role_description: "Full workspace ownership and billing authority.",
      status: "active",
      joined_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
      can_change_role: false,
      can_revoke: false,
    }];
    mocks.workspaceContext.value = { profile_id: "user-1", workspace_id: "workspace-1", workspace_name: "edhemmer's BRIX Workspace", role_id: "owner" };
    mocks.authChangeCallback.value = null;
    mocks.queriedOwnerIds.value = [];
    vi.clearAllMocks();
    mocks.rpc.mockReset();
    mocks.upsert.mockReset();
    mocks.update.mockReset();
    mocks.signInWithPassword.mockReset();
    mocks.signUp.mockReset();
    mocks.resetPasswordForEmail.mockReset();
    mocks.updateUser.mockReset();
    mocks.signOut.mockReset();
    mocks.getSession.mockReset();
    mocks.insert.mockReset();
    mocks.invokeFunction.mockReset();
    mocks.downloadDecisionPdf.mockReset();
    mocks.downloadWorkbook.mockReset();
    installDefaultSupabaseMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    Object.defineProperty(window.navigator, "onLine", { value: true, configurable: true });
  });

  it("renders the verified shell with only safe primary destinations", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "Home" });
    expect(window.location.pathname).toBe("/app");
    const primaryNav = screen.getByRole("navigation", { name: "Primary" });
    expect(within(primaryNav).getByRole("button", { name: /Home Resume your BRIX account/i })).toBeInTheDocument();
    expect(within(primaryNav).getByRole("button", { name: /Deals Review saved deal work/i })).toBeInTheDocument();
    expect(within(primaryNav).getByRole("button", { name: /Settings Account and access/i })).toBeInTheDocument();
    expect(within(primaryNav).queryByRole("button", { name: /FindIQ/i })).not.toBeInTheDocument();
    expect(within(primaryNav).queryByRole("button", { name: /ContractIQ/i })).not.toBeInTheDocument();
    expect(within(primaryNav).queryByRole("button", { name: /PipelineIQ/i })).not.toBeInTheDocument();
    expect(within(primaryNav).queryByRole("button", { name: /OfferIQ/i })).not.toBeInTheDocument();
    expect(within(primaryNav).queryByRole("button", { name: /PortfolioIQ/i })).not.toBeInTheDocument();
    expect(within(primaryNav).queryByRole("button", { name: /Reports/i })).not.toBeInTheDocument();
    expect(screen.getByText("No saved Deals yet")).toBeInTheDocument();
    expect(screen.getByText(/will not display fabricated deal counts/i)).toBeInTheDocument();
    expect(screen.getByText("Loading")).toBeInTheDocument();
    expect(screen.getByText("Recoverable")).toBeInTheDocument();

    await waitFor(() => expect(screen.queryByText(/Sync needs attention/i)).not.toBeInTheDocument());
  }, 60000);

  it("handles account sign-in, password reset entry, and sign-out", async () => {
    mocks.session.value = null;
    mocks.signInWithPassword.mockResolvedValueOnce({ data: { session: { user: { id: "user-1" } } }, error: null });
    window.history.replaceState({}, "", "/account");

    render(<App />);

    await screen.findByRole("heading", { name: "Sign in to BRIX" });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "edhemmer@gmail.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "inlight" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in to BRIX" }));

    await waitFor(() => expect(mocks.signInWithPassword).toHaveBeenCalledWith({ email: "edhemmer@gmail.com", password: "inlight" }));
    expect(window.location.pathname).toBe("/app");

    fireEvent.click(screen.getByRole("button", { name: /Settings Account and access/i }));
    await screen.findByRole("heading", { name: "My Account" });
    fireEvent.click(screen.getByRole("button", { name: /Request account deletion/i }));
    await waitFor(() => expect(mocks.invokeFunction).toHaveBeenCalledWith("request-account-deletion", { body: {} }));
    expect(await screen.findByText(/Account deletion request requested/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Sign out/i }));
    await waitFor(() => expect(mocks.signOut).toHaveBeenCalled());
    expect(await screen.findByRole("heading", { name: "Home" })).toBeInTheDocument();
  });

  it("requests a password reset with a safe response and recovery redirect", async () => {
    mocks.session.value = null;
    mocks.user.value = null;
    window.history.replaceState({}, "", "/account");
    render(<App />);

    await screen.findByRole("heading", { name: "Sign in to BRIX" });
    fireEvent.click(screen.getByRole("button", { name: /Forgot password/i }));
    expect(await screen.findByRole("heading", { name: "Reset your password" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "investor@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith("investor@example.com", {
      redirectTo: "http://localhost:3000/account?flow=reset-password",
    }));
    expect(await screen.findByText("If that email has a BRIX account, a password reset link has been sent.")).toBeInTheDocument();
  });

  it("validates reset completion passwords before updating Supabase Auth", async () => {
    mocks.session.value = { user: { id: "user-1" } };
    window.history.replaceState({}, "", "/account?flow=reset-password");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Set a new password" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "newpassword1" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "differentpass" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect((await screen.findAllByText("Passwords must match.")).length).toBeGreaterThan(1);
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("completes password recovery, records security events, and returns to the workspace", async () => {
    mocks.session.value = { user: { id: "user-1" } };
    mocks.user.value = { id: "user-1", email: "edhemmer@gmail.com" };
    window.history.replaceState({}, "", "/account?flow=reset-password");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Set a new password" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "newpassword1" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "newpassword1" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(() => expect(mocks.updateUser).toHaveBeenCalledWith({ password: "newpassword1" }));
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ action: "account.password_updated" }));
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ event_type: "account.password_updated" }));
    expect(await screen.findByRole("heading", { name: "Home" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/app");
  });

  it("changes password for a signed-in user after current password reauthentication", async () => {
    window.history.replaceState({}, "", "/account");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "My Account" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));
    expect(await screen.findByRole("heading", { name: "Change password" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "oldpassword1" } });
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "newpassword1" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "newpassword1" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(() => expect(mocks.signInWithPassword).toHaveBeenCalledWith({ email: "edhemmer@gmail.com", password: "oldpassword1" }));
    expect(mocks.updateUser).toHaveBeenCalledWith({ password: "newpassword1" });
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ action: "account.password_updated" }));
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ event_type: "account.password_updated" }));
    expect(await screen.findByText("Password updated.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "My Account" })).toBeInTheDocument();
  });

  it("creates, resends, and revokes workspace invitations from an owner account", async () => {
    window.history.replaceState({}, "", "/account");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "My Account" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "People with access" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open Trusted Access" }));
    expect(await screen.findByRole("heading", { name: "Share access" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "teammate@example.com" } });
    fireEvent.change(screen.getByLabelText("Access level"), { target: { value: "contributor" } });
    fireEvent.click(screen.getByRole("button", { name: "Send invite" }));

    await waitFor(() => expect(mocks.rpc).toHaveBeenCalledWith("create_workspace_invitation", {
      target_workspace_id: "workspace-1",
      invite_email: "teammate@example.com",
      invite_role_id: "contributor",
    }));
    expect((await screen.findByLabelText("Invitation link") as HTMLInputElement).value).toContain("/account?invite=raw-token-1");
    expect(await screen.findByText("teammate@example.com")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Resend" }));
    await waitFor(() => expect(mocks.rpc).toHaveBeenCalledWith("resend_workspace_invitation", { target_invitation_id: "invite-1" }));
    expect((screen.getByLabelText("Invitation link") as HTMLInputElement).value).toContain("/account?invite=raw-token-2");

    fireEvent.click(screen.getByRole("button", { name: "Revoke" }));
    await waitFor(() => expect(mocks.rpc).toHaveBeenCalledWith("revoke_workspace_invitation", { target_invitation_id: "invite-1" }));
    expect(await screen.findByText("Invitation revoked.")).toBeInTheDocument();
  });

  it("shows workspace access and lets an owner change an eligible collaborator role", async () => {
    mocks.workspaceMembers.value = [
      ...mocks.workspaceMembers.value,
      {
        membership_id: "membership-partner",
        workspace_id: "workspace-1",
        user_id: "user-2",
        email: "partner@example.com",
        full_name: "Partner Investor",
        role_id: "viewer",
        role_name: "Viewer",
        role_description: "Can view workspace information without changing deal work or access.",
        status: "active",
        joined_at: "2026-01-02T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
        can_change_role: true,
        can_revoke: true,
      },
    ];
    window.history.replaceState({}, "", "/account");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "My Account" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open Trusted Access" }));
    expect(await screen.findByRole("heading", { name: "People with access" })).toBeInTheDocument();
    const partnerRow = screen.getByText("Partner Investor").closest("article");
    expect(partnerRow).not.toBeNull();
    fireEvent.change(within(partnerRow as HTMLElement).getByLabelText("Access level"), { target: { value: "analyst" } });
    fireEvent.click(within(partnerRow as HTMLElement).getByRole("button", { name: "Change" }));

    await waitFor(() => expect(mocks.rpc).toHaveBeenCalledWith("change_workspace_member_role", {
      target_membership_id: "membership-partner",
      new_role_id: "analyst",
      expected_updated_at: "2026-01-02T00:00:00.000Z",
    }));
    expect(await screen.findByText("Access level updated.")).toBeInTheDocument();
    expect((await screen.findAllByText("Analyst")).length).toBeGreaterThan(0);
  });

  it("does not expose role mutation controls to collaborators without member-management permission", async () => {
    mocks.workspaceContext.value = { profile_id: "user-2", workspace_id: "workspace-1", workspace_name: "Shared Workspace", role_id: "analyst" };
    mocks.workspaceMembers.value = [
      {
        membership_id: "membership-owner",
        workspace_id: "workspace-1",
        user_id: "user-1",
        email: "owner@example.com",
        full_name: "Owner User",
        role_id: "owner",
        role_name: "Owner",
        role_description: "Full workspace ownership and billing authority.",
        status: "active",
        joined_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        can_change_role: false,
        can_revoke: false,
      },
      {
        membership_id: "membership-analyst",
        workspace_id: "workspace-1",
        user_id: "user-2",
        email: "analyst@example.com",
        full_name: "Analyst User",
        role_id: "analyst",
        role_name: "Analyst",
        role_description: "Can review deal information and run analysis without managing trusted access.",
        status: "active",
        joined_at: "2026-01-02T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
        can_change_role: false,
        can_revoke: false,
      },
    ];
    window.history.replaceState({}, "", "/account");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "My Account" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open Trusted Access" }));
    expect(await screen.findByRole("heading", { name: "People with access" })).toBeInTheDocument();
    expect(screen.getByText("Only the account owner or an administrator can change trusted access.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Change" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Remove access/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Share access" })).not.toBeInTheDocument();
  });

  it("removes eligible collaborator access without deleting the user or workspace data", async () => {
    mocks.workspaceMembers.value = [
      ...mocks.workspaceMembers.value,
      {
        membership_id: "membership-partner",
        workspace_id: "workspace-1",
        user_id: "user-2",
        email: "partner@example.com",
        full_name: "Partner Investor",
        role_id: "viewer",
        role_name: "Viewer",
        role_description: "Can view workspace information without changing deal work or access.",
        status: "active",
        joined_at: "2026-01-02T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
        can_change_role: true,
        can_revoke: true,
      },
    ];
    window.history.replaceState({}, "", "/account");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "My Account" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open Trusted Access" }));
    const partnerRow = (await screen.findByText("Partner Investor")).closest("article");
    expect(partnerRow).not.toBeNull();
    fireEvent.click(within(partnerRow as HTMLElement).getByRole("button", { name: /Remove access/i }));

    await waitFor(() => expect(mocks.rpc).toHaveBeenCalledWith("revoke_workspace_member", {
      target_membership_id: "membership-partner",
      expected_updated_at: "2026-01-02T00:00:00.000Z",
      revoke_reason: "Removed from workspace access screen",
    }));
    expect(await screen.findByText("Trusted access removed.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Delete user/i })).not.toBeInTheDocument();
  });

  it("surfaces stale workspace-access failures with a safe retry message", async () => {
    mocks.workspaceMembers.value = [
      ...mocks.workspaceMembers.value,
      {
        membership_id: "membership-partner",
        workspace_id: "workspace-1",
        user_id: "user-2",
        email: "partner@example.com",
        full_name: "Partner Investor",
        role_id: "viewer",
        role_name: "Viewer",
        role_description: "Can view workspace information without changing deal work or access.",
        status: "active",
        joined_at: "2026-01-02T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
        can_change_role: true,
        can_revoke: true,
      },
    ];
    mocks.rpc.mockImplementation(async (name: string, args?: Record<string, unknown>) => {
      if (name === "ensure_workspace_context") return { data: [mocks.workspaceContext.value], error: null };
      if (name === "list_workspace_access_roles") return { data: mocks.accessRoles.value, error: null };
      if (name === "list_workspace_memberships") return { data: mocks.workspaceMembers.value, error: null };
      if (name === "change_workspace_member_role") return { data: null, error: new Error("Workspace access changed. Refresh and try again.") };
      return { data: null, error: null };
    });
    window.history.replaceState({}, "", "/account");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "My Account" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open Trusted Access" }));
    const partnerRow = (await screen.findByText("Partner Investor")).closest("article");
    expect(partnerRow).not.toBeNull();
    fireEvent.change(within(partnerRow as HTMLElement).getByLabelText("Access level"), { target: { value: "analyst" } });
    fireEvent.click(within(partnerRow as HTMLElement).getByRole("button", { name: "Change" }));

    expect(await screen.findByText("Trusted access changed. Refresh and try again.")).toBeInTheDocument();
  });

  it("accepts an invitation token after sign-in before workspace bootstrap", async () => {
    const rpcOrder: string[] = [];
    mocks.session.value = null;
    mocks.user.value = null;
    mocks.signInWithPassword.mockImplementationOnce(async () => {
      mocks.session.value = { user: { id: "invite-user" } };
      mocks.user.value = { id: "invite-user", email: "teammate@example.com" };
      return { data: { session: { user: { id: "invite-user" } } }, error: null };
    });
    mocks.rpc.mockImplementation(async (name: string) => {
      rpcOrder.push(name);
      if (name === "accept_workspace_invitation") {
        return {
          data: [{
            invitation_id: "invite-1",
            workspace_id: "workspace-1",
            workspace_name: "Invited Workspace",
            membership_id: "membership-1",
            role_id: "member",
            status: "accepted",
          }],
          error: null,
        };
      }
      if (name === "ensure_workspace_context") {
        return { data: [{ profile_id: "invite-user", workspace_id: "workspace-1", workspace_name: "Invited Workspace", role_id: "member" }], error: null };
      }
      return { data: null, error: null };
    });
    window.history.replaceState({}, "", "/account?invite=raw-token-1");
    render(<App />);

    expect(await screen.findByText("Sign in or create an account with the invited email address to accept trusted access.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "teammate@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in to BRIX" }));

    expect(await screen.findByText("Trusted access accepted.")).toBeInTheDocument();
    expect(rpcOrder.slice(0, 2)).toEqual(["accept_workspace_invitation", "ensure_workspace_context"]);
    expect(window.location.search).not.toContain("invite=");
    expect(screen.getByText("Invited Workspace")).toBeInTheDocument();
  });

  it("fails closed when invitation acceptance fails during authenticated bootstrap", async () => {
    mocks.rpc.mockImplementationOnce(async () => ({ data: null, error: new Error("Invitation has expired.") }));
    window.history.replaceState({}, "", "/account?invite=expired-token");
    render(<App />);

    expect(await screen.findByText("Sign in required")).toBeInTheDocument();
    expect(screen.getByText(/Your session has expired. Sign in again to continue./i)).toBeInTheDocument();
    expect(screen.queryByText("Trusted access accepted.")).not.toBeInTheDocument();
    expect(mocks.queriedOwnerIds.value).toEqual([]);
  });

  it("does not update a signed-in password when current password verification fails", async () => {
    mocks.signInWithPassword.mockResolvedValueOnce({ data: { session: null }, error: new Error("Invalid login credentials") });
    window.history.replaceState({}, "", "/account");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "My Account" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));
    fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "wrongpassword" } });
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "newpassword1" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "newpassword1" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect(await screen.findByText("Current password is incorrect.")).toBeInTheDocument();
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("normalizes older or sparse remote deal rows before modules consume them", () => {
    const deal = normalizeDealRow({
      id: "deal-1",
      address: "10 Test St",
      facts: { listPrice: 250000, strategyId: "not-a-real-strategy" },
    });

    expect(deal?.id).toBe("deal-1");
    expect(deal?.address).toBe("10 Test St");
    expect(deal?.status).toBe("draft");
    expect(deal?.strategyId).toBe("owner_occupant");
    expect(deal?.createdAt).toBeTruthy();
    expect(deal?.updatedAt).toBeTruthy();
    expect(deal?.notes).toEqual([]);
    expect(deal?.photoUrls).toEqual([]);
  });

  it("does not expose hidden deal-creation controls from the first shell", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "Home" });
    expect(screen.queryByLabelText("Address, listing URL, or listing text")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /create deal file/i })).not.toBeInTheDocument();
    expect(window.location.pathname).toBe("/app");
    expect(screen.queryByRole("heading", { name: /Visit|Research first|Do not visit yet/i })).not.toBeInTheDocument();
  });

  it("opens the app workspace when signed out instead of forcing the account screen", async () => {
    mocks.session.value = null;
    mocks.user.value = null;
    render(<App />);

    await screen.findByRole("heading", { name: "Home" });
    expect(window.location.pathname).toBe("/app");
  });

  it("keeps signed-out shell local without writing cloud deal records", async () => {
    mocks.session.value = null;
    mocks.user.value = null;
    render(<App />);

    await screen.findByRole("heading", { name: "Home" });
    expect(screen.getByText(/Local drafts stay on this device/i)).toBeInTheDocument();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("mocked: authenticated deal create and reopen uses Supabase records", async () => {
    const created = await persistRemoteDeal({
      ...draftDeal("cloud-roundtrip", "Cloud Roundtrip Deal"),
      listPrice: 325000,
      notes: ["Preserve this note"],
    }, "user-1");
    mocks.remoteDeals.value = [remoteDealRow(created.id, "user-1", "Cloud Roundtrip Deal", { facts: created, created_at: created.createdAt, updated_at: created.updatedAt })];

    const reopened = await loadRemoteDeals("user-1");

    expect(mocks.upsert).toHaveBeenCalled();
    expect(reopened[0].id).toBe("cloud-roundtrip");
    expect(reopened[0].listPrice).toBe(325000);
    expect(reopened[0].notes).toEqual(["Preserve this note"]);
  });

  it("mocked: anonymous drafts load only when signed out", async () => {
    localStorage.setItem("brix.deals", JSON.stringify([draftDeal("anon-only", "Anonymous Only Draft")]));
    mocks.session.value = null;
    mocks.user.value = null;
    render(<App />);

    expect(await screen.findByText("Anonymous Only Draft")).toBeInTheDocument();
    expect(mocks.queriedOwnerIds.value).toEqual([]);
  });

  it("mocked: authenticated users see only cloud deals while device drafts stay untouched", async () => {
    localStorage.setItem("brix.deals", JSON.stringify([draftDeal("anon-hidden", "Hidden Anonymous Draft")]));
    mocks.remoteDeals.value = [remoteDealRow("cloud-visible", "user-1", "Visible Cloud Deal")];
    render(<App />);

    expect(await screen.findByText("Visible Cloud Deal")).toBeInTheDocument();
    expect(screen.queryByText("Hidden Anonymous Draft")).not.toBeInTheDocument();
    expect(localStorage.getItem("brix.deals")).toContain("Hidden Anonymous Draft");
    expect(screen.getByText("Local drafts are saved on this device and are not part of your BRIX account.")).toBeInTheDocument();
    expect(screen.getByText("Sign out to view local drafts.")).toBeInTheDocument();
  });

  it("mocked: signing in does not delete or merge anonymous drafts into cloud deals", async () => {
    localStorage.setItem("brix.deals", JSON.stringify([draftDeal("anon-preserved", "Preserved Anonymous Draft")]));
    mocks.session.value = null;
    mocks.user.value = null;
    mocks.signInWithPassword.mockImplementationOnce(async () => {
      mocks.session.value = { user: { id: "user-1" } };
      mocks.user.value = { id: "user-1", email: "edhemmer@gmail.com" };
      return { data: { session: { user: { id: "user-1" } } }, error: null };
    });
    mocks.remoteDeals.value = [remoteDealRow("cloud-after-sign-in", "user-1", "Cloud After Sign In")];
    window.history.replaceState({}, "", "/account");
    render(<App />);

    await screen.findByRole("heading", { name: "Sign in to BRIX" });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "edhemmer@gmail.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "inlight" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in to BRIX" }));

    expect(await screen.findByText("Cloud After Sign In")).toBeInTheDocument();
    expect(screen.queryByText("Preserved Anonymous Draft")).not.toBeInTheDocument();
    expect(localStorage.getItem("brix.deals")).toContain("Preserved Anonymous Draft");
    expect(screen.getByText("Local drafts are saved on this device and are not part of your BRIX account.")).toBeInTheDocument();
    expect(mocks.upsert).not.toHaveBeenCalledWith(expect.objectContaining({ id: "anon-preserved" }));
  });

  it("mocked: authenticated shell does not write cloud deals to the shared anonymous browser key", async () => {
    mocks.remoteDeals.value = [remoteDealRow("cloud-only-shell", "user-1", "Cloud Only Shell Deal")];
    render(<App />);

    expect(await screen.findByText("Cloud Only Shell Deal")).toBeInTheDocument();
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(localStorage.getItem("brix.deals")).toBeNull();
  });

  it("preserves canonical optional data and zero values through anonymous save and reopen", () => {
    const deal = {
      ...draftDeal("roundtrip-zero", "Zero Value House"),
      city: "Naperville",
      state: "IL",
      zip: "60540",
      county: "Will",
      propertyType: "Single family",
      sourceUrl: "https://example.com/listing",
      sourceText: "Listing text",
      listPrice: 0,
      annualTaxes: 0,
      annualInsurance: 0,
      monthlyRent: 0,
      notes: [],
      photoUrls: [],
      uploadedPhotoNames: [],
      verification: { listPrice: "entered" as const },
    };

    saveAnonymousDeals([deal]);
    const reopened = loadAnonymousDeals()[0];

    expect(reopened.id).toBe("roundtrip-zero");
    expect(reopened.city).toBe("Naperville");
    expect(reopened.listPrice).toBe(0);
    expect(reopened.annualTaxes).toBe(0);
    expect(reopened.annualInsurance).toBe(0);
    expect(reopened.monthlyRent).toBe(0);
    expect(reopened.notes).toEqual([]);
    expect(reopened.photoUrls).toEqual([]);
    expect(reopened.verification.listPrice).toBe("entered");
  });

  it("rejects malformed anonymous storage without crashing the app", async () => {
    localStorage.setItem("brix.deals", "{not json");
    mocks.session.value = null;
    mocks.user.value = null;
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Home" })).toBeInTheDocument();
    expect(loadAnonymousDeals()).toEqual([]);
  });

  it("rejects malformed stored records and normalizes sparse usable records", () => {
    const normalized = normalizeDealRecord({ id: "usable", address: "Sparse Deal", listPrice: 0, notes: "bad-notes" });

    expect(normalizeDealRecord({ address: "Missing ID" })).toBeNull();
    expect(normalized?.id).toBe("usable");
    expect(normalized?.listPrice).toBe(0);
    expect(normalized?.notes).toEqual([]);
    expect(normalized?.photoUrls).toEqual([]);
    expect(normalized?.verification).toEqual({});
  });

  it("deleting one anonymous deal does not delete another and safely selects the next deal", async () => {
    localStorage.setItem("brix.deals", JSON.stringify([draftDeal("delete-1", "Delete This Deal"), draftDeal("keep-1", "Keep This Deal")]));
    mocks.session.value = null;
    mocks.user.value = null;
    render(<App />);

    expect(await screen.findByText("Delete This Deal")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Deals Review saved deal work/i }));
    fireEvent.click(screen.getByRole("button", { name: /Delete deal/i }));

    await waitFor(() => expect(screen.queryByText("Delete This Deal")).not.toBeInTheDocument());
    expect(screen.getAllByText("Keep This Deal").length).toBeGreaterThan(0);
    expect(localStorage.getItem("brix.deals")).toContain("Keep This Deal");
    expect(localStorage.getItem("brix.deals")).not.toContain("Delete This Deal");
  });

  it("mocked: failed authenticated delete leaves the deal visible", async () => {
    mocks.remoteDeals.value = [remoteDealRow("remote-delete-fails", "user-1", "Still Visible Deal")];
    mocks.update.mockReturnValueOnce({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => ({ data: null, error: new Error("delete failed") })),
          })),
        })),
      })),
    });
    render(<App />);

    expect(await screen.findByText("Still Visible Deal")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Deals Review saved deal work/i }));
    fireEvent.click(screen.getByRole("button", { name: /Delete deal/i }));

    expect(await screen.findByText(/Deal was not deleted: delete failed/i)).toBeInTheDocument();
    expect(screen.getAllByText("Still Visible Deal").length).toBeGreaterThan(0);
  });

  it("mocked: soft-deleted remote deals are excluded from active list results", async () => {
    mocks.remoteDeals.value = [
      remoteDealRow("active-cloud", "user-1", "Active Cloud Deal"),
      remoteDealRow("deleted-cloud", "user-1", "Deleted Cloud Deal", { deleted_at: "2026-01-02" }),
    ];

    const records = await loadRemoteDeals("user-1");

    expect(records.map((deal) => deal.address)).toEqual(["Active Cloud Deal"]);
  });

  it("reopens an existing anonymous record from local storage without cloud writes", async () => {
    mocks.session.value = null;
    mocks.user.value = null;
    localStorage.setItem("brix.deals", JSON.stringify([{ ...draftDeal("roundtrip-existing", "44 Round Trip Ave"), listPrice: 250000 }]));
    const first = render(<App />);

    expect((await screen.findAllByText(/44 Round Trip Ave/i)).length).toBeGreaterThan(0);
    expect(mocks.upsert).not.toHaveBeenCalled();

    first.unmount();
    render(<App />);

    expect((await screen.findAllByText(/44 Round Trip Ave/i)).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /Deals Review saved deal work/i }));
    expect((screen.getByLabelText("Purchase price") as HTMLInputElement).value).toBe("250000");
  });

  it("mocked: sign out clears authenticated deals and can show preserved anonymous records only", async () => {
    localStorage.setItem("brix.deals", JSON.stringify([{ id: "anon-1", address: "Anonymous Draft", status: "draft", strategyId: "owner_occupant", createdAt: "2026-01-01", updatedAt: "2026-01-01", notes: [], photoUrls: [], uploadedPhotoNames: [], verification: {} }]));
    mocks.remoteDeals.value = [{ id: "remote-1", owner_id: "user-1", address: "User One Deal", status: "draft", strategy_id: "owner_occupant", facts: { id: "remote-1", address: "User One Deal", strategyId: "owner_occupant", status: "draft", createdAt: "2026-01-01", updatedAt: "2026-01-01", notes: [], photoUrls: [], uploadedPhotoNames: [], verification: {} } }];
    window.history.replaceState({}, "", "/account");
    render(<App />);

    await screen.findByRole("heading", { name: "My Account" });
    fireEvent.click(screen.getByRole("button", { name: /Deals Review saved deal work/i }));
    expect((await screen.findAllByText("User One Deal")).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /Settings Account and access/i }));
    fireEvent.click(screen.getByRole("button", { name: /Sign out/i }));
    await waitFor(() => expect(screen.queryByText("User One Deal")).not.toBeInTheDocument());
    expect(await screen.findByText("Anonymous Draft")).toBeInTheDocument();
    expect(localStorage.getItem("brix.deals")).toContain("Anonymous Draft");
  });

  it("mocked: switching authenticated users clears the prior user's remote deals before loading the next user", async () => {
    mocks.remoteDeals.value = [{ id: "remote-a", owner_id: "user-a", address: "User A Deal", status: "draft", strategy_id: "owner_occupant", facts: { id: "remote-a", address: "User A Deal", strategyId: "owner_occupant", status: "draft", createdAt: "2026-01-01", updatedAt: "2026-01-01", notes: [], photoUrls: [], uploadedPhotoNames: [], verification: {} } }];
    mocks.session.value = { user: { id: "user-a" } };
    mocks.user.value = { id: "user-a", email: "a@example.com" };
    render(<App />);

    await screen.findByText("User A Deal");
    mocks.remoteDeals.value = [{ id: "remote-b", owner_id: "user-b", address: "User B Deal", status: "draft", strategy_id: "owner_occupant", facts: { id: "remote-b", address: "User B Deal", strategyId: "owner_occupant", status: "draft", createdAt: "2026-01-01", updatedAt: "2026-01-01", notes: [], photoUrls: [], uploadedPhotoNames: [], verification: {} } }];
    mocks.user.value = { id: "user-b", email: "b@example.com" };
    act(() => {
      mocks.authChangeCallback.value?.("SIGNED_IN", { user: { id: "user-b" } });
    });

    await waitFor(() => expect(screen.queryByText("User A Deal")).not.toBeInTheDocument());
    expect(await screen.findByText("User B Deal")).toBeInTheDocument();
  });

  it("mocked: email-confirmation signup does not mark the app authenticated without a session", async () => {
    mocks.session.value = null;
    mocks.user.value = null;
    mocks.signUp.mockResolvedValueOnce({ data: { session: null }, error: null });
    window.history.replaceState({}, "", "/account");
    render(<App />);

    await screen.findByRole("heading", { name: "Sign in to BRIX" });
    fireEvent.click(screen.getByRole("tab", { name: "Create account" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Confirm User" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "confirm@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Create BRIX account" }));

    expect(await screen.findByText(/Check your email to finish account activation/i)).toBeInTheDocument();
    expect(window.location.pathname).toBe("/account");
  });

  it("creates an account and hands the signed-in user into workspace bootstrap when Supabase returns a session", async () => {
    mocks.session.value = null;
    mocks.user.value = null;
    mocks.signUp.mockImplementationOnce(async () => {
      mocks.session.value = { user: { id: "new-user" } };
      mocks.user.value = { id: "new-user", email: "new@example.com" };
      return { data: { session: { user: { id: "new-user" } } }, error: null };
    });
    mocks.workspaceContext.value = { profile_id: "new-user", workspace_id: "workspace-new", workspace_name: "New User BRIX Workspace", role_id: "owner" };
    mocks.remoteDeals.value = [remoteDealRow("new-user-cloud", "new-user", "New User Cloud Deal")];
    window.history.replaceState({}, "", "/account");
    render(<App />);

    await screen.findByRole("heading", { name: "Sign in to BRIX" });
    fireEvent.click(screen.getByRole("tab", { name: "Create account" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "New User" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Create BRIX account" }));

    await waitFor(() => expect(mocks.signUp).toHaveBeenCalledWith({
      email: "new@example.com",
      password: "password123",
      options: { data: { full_name: "New User" } },
    }));
    expect(await screen.findByText("New User Cloud Deal")).toBeInTheDocument();
    expect(mocks.rpc).toHaveBeenCalledWith("ensure_workspace_context");
    expect(window.location.pathname).toBe("/app");
  });

  it("validates sign-up inputs before calling Supabase", async () => {
    mocks.session.value = null;
    mocks.user.value = null;
    window.history.replaceState({}, "", "/account");
    render(<App />);

    await screen.findByRole("heading", { name: "Sign in to BRIX" });
    fireEvent.click(screen.getByRole("tab", { name: "Create account" }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "not-an-email" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: "Create BRIX account" }));

    expect(await screen.findByText("Check these fields")).toBeInTheDocument();
    expect(screen.getAllByText("Enter your name.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Enter a valid email address.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Use at least 8 characters.").length).toBeGreaterThan(0);
    expect(mocks.signUp).not.toHaveBeenCalled();
  });

  it("prevents duplicate sign-in submissions while authentication is in flight", async () => {
    mocks.session.value = null;
    mocks.user.value = null;
    let resolveSignIn: (value: { data: { session: { user: { id: string } } }; error: null }) => void = () => undefined;
    mocks.signInWithPassword.mockImplementationOnce(async () => new Promise((resolve) => {
      resolveSignIn = resolve;
    }));
    window.history.replaceState({}, "", "/account");
    render(<App />);

    await screen.findByRole("heading", { name: "Sign in to BRIX" });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "edhemmer@gmail.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "inlight" } });
    const submit = screen.getByRole("button", { name: "Sign in to BRIX" });
    fireEvent.click(submit);
    fireEvent.click(submit);

    expect(mocks.signInWithPassword).toHaveBeenCalledTimes(1);
    resolveSignIn({ data: { session: { user: { id: "user-1" } } }, error: null });
    expect(await screen.findByRole("heading", { name: "Home" })).toBeInTheDocument();
  });

  it("shows safe authentication errors for invalid credentials, rate limits, and offline attempts", async () => {
    mocks.session.value = null;
    mocks.user.value = null;
    window.history.replaceState({}, "", "/account");
    render(<App />);

    await screen.findByRole("heading", { name: "Sign in to BRIX" });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "edhemmer@gmail.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrongpassword" } });
    mocks.signInWithPassword.mockResolvedValueOnce({ data: { session: null }, error: new Error("Invalid login credentials") });
    fireEvent.click(screen.getByRole("button", { name: "Sign in to BRIX" }));
    expect(await screen.findByText("Email or password is incorrect.")).toBeInTheDocument();
    expect(screen.queryByText(/Invalid login credentials/i)).not.toBeInTheDocument();

    mocks.signInWithPassword.mockResolvedValueOnce({ data: { session: null }, error: new Error("429 rate limit exceeded") });
    fireEvent.click(screen.getByRole("button", { name: "Sign in to BRIX" }));
    expect(await screen.findByText("Too many attempts. Wait a few minutes, then try again.")).toBeInTheDocument();

    Object.defineProperty(window.navigator, "onLine", { value: false, configurable: true });
    mocks.signInWithPassword.mockRejectedValueOnce(new Error("Failed to fetch auth service"));
    fireEvent.click(screen.getByRole("button", { name: "Sign in to BRIX" }));
    expect(await screen.findByText(/You appear to be offline/i)).toBeInTheDocument();
  });

  it("shows session restoration state before the initial auth check resolves", async () => {
    let resolveSession: (value: { data: { session: null } }) => void = () => undefined;
    mocks.session.value = null;
    mocks.user.value = null;
    mocks.getSession.mockImplementationOnce(async () => new Promise((resolve) => {
      resolveSession = resolve;
    }));
    render(<App />);

    expect(await screen.findByText("Restoring session")).toBeInTheDocument();
    resolveSession({ data: { session: null } });
    expect(await screen.findByRole("heading", { name: "Home" })).toBeInTheDocument();
  });

  it("allows retry after workspace bootstrap fails without loading cloud deals first", async () => {
    mocks.rpc
      .mockResolvedValueOnce({ data: null, error: new Error("workspace unavailable") })
      .mockResolvedValueOnce({ data: [mocks.workspaceContext.value], error: null });
    mocks.remoteDeals.value = [remoteDealRow("retry-cloud", "user-1", "Retry Cloud Deal")];
    render(<App />);

    expect(await screen.findByText(/BRIX could not prepare your workspace/i)).toBeInTheDocument();
    expect(screen.queryByText("Retry Cloud Deal")).not.toBeInTheDocument();
    expect(mocks.queriedOwnerIds.value).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Retry setup" }));

    expect(await screen.findByText("Retry Cloud Deal")).toBeInTheDocument();
    expect(mocks.queriedOwnerIds.value).toEqual(["user-1"]);
  });

  it("fails closed when a restored authenticated session is expired or revoked", async () => {
    localStorage.setItem("brix.deals", JSON.stringify([draftDeal("anon-after-expire", "Anonymous After Expire")]));
    mocks.rpc.mockResolvedValueOnce({ data: null, error: Object.assign(new Error("JWT expired"), { status: 401 }) });
    mocks.remoteDeals.value = [remoteDealRow("expired-cloud", "user-1", "Expired Cloud Deal")];
    render(<App />);

    expect(await screen.findByText("Sign in required")).toBeInTheDocument();
    expect(screen.getByText(/Your session has expired. Sign in again to continue./i)).toBeInTheDocument();
    expect(screen.queryByText("Expired Cloud Deal")).not.toBeInTheDocument();
    expect(await screen.findByText("Anonymous After Expire")).toBeInTheDocument();
    expect(mocks.queriedOwnerIds.value).toEqual([]);
  });

  it("treats deleted-user workspace bootstrap failures as expired sessions", async () => {
    localStorage.setItem("brix.deals", JSON.stringify([draftDeal("anon-after-deleted-user", "Anonymous After Deleted User")]));
    mocks.rpc.mockResolvedValueOnce({ data: null, error: new Error("insert or update on table \"profiles\" violates foreign key constraint \"profiles_id_fkey\" because auth.users is missing") });
    mocks.remoteDeals.value = [remoteDealRow("deleted-user-cloud", "user-1", "Deleted User Cloud Deal")];
    render(<App />);

    expect(await screen.findByText("Sign in required")).toBeInTheDocument();
    expect(screen.getByText(/Your session has expired. Sign in again to continue./i)).toBeInTheDocument();
    expect(mocks.signOut).toHaveBeenCalled();
    expect(screen.queryByText("Deleted User Cloud Deal")).not.toBeInTheDocument();
    expect(await screen.findByText("Anonymous After Deleted User")).toBeInTheDocument();
    expect(mocks.queriedOwnerIds.value).toEqual([]);
  });

  it("keeps sensitive auth failures out of console output", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mocks.session.value = null;
    mocks.user.value = null;
    mocks.signInWithPassword.mockResolvedValueOnce({ data: { session: null }, error: new Error("Invalid login credentials: leaked provider detail") });
    window.history.replaceState({}, "", "/account");
    render(<App />);

    await screen.findByRole("heading", { name: "Sign in to BRIX" });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "edhemmer@gmail.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrongpassword" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in to BRIX" }));

    expect(await screen.findByText("Email or password is incorrect.")).toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();
    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });

  it("mocked: remote loading is scoped to the current authenticated user", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "Home" });
    await waitFor(() => expect(mocks.queriedOwnerIds.value).toContain("user-1"));
  });

  it("mocked: authenticated sessions establish workspace context before cloud deals are shown", async () => {
    mocks.remoteDeals.value = [remoteDealRow("workspace-deal", "user-1", "Workspace Loaded Deal")];
    render(<App />);

    expect(await screen.findByText("Workspace Loaded Deal")).toBeInTheDocument();
    expect(mocks.rpc).toHaveBeenCalledWith("ensure_workspace_context");
    expect(mocks.queriedOwnerIds.value).toEqual(["user-1"]);
  });

  it("mocked: workspace bootstrap failure blocks cloud deal loading", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: new Error("workspace unavailable") });
    mocks.remoteDeals.value = [remoteDealRow("blocked-deal", "user-1", "Blocked Cloud Deal")];
    render(<App />);

    expect(await screen.findByText(/BRIX could not prepare your workspace/i)).toBeInTheDocument();
    expect(screen.queryByText("Blocked Cloud Deal")).not.toBeInTheDocument();
    expect(mocks.queriedOwnerIds.value).toEqual([]);
  });
});
