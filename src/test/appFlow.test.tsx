import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { requestAccountDeletion } from "../core/authActions";
import { downloadDecisionPdf, downloadWorkbook } from "../core/reportExports";
import { normalizeDealRow } from "../core/store";

const mocks = vi.hoisted(() => ({
  session: { value: { user: { id: "user-1" } } as { user: { id: string } } | null },
  user: { value: { id: "user-1", email: "edhemmer@gmail.com" } as { id: string; email: string } | null },
  remoteDeals: { value: [] as Array<Record<string, unknown>> },
  authChangeCallback: { value: null as null | ((_event: string, session: { user: { id: string } } | null) => void) },
  queriedOwnerIds: { value: [] as string[] },
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
  resetPasswordForEmail: vi.fn(async () => ({ error: null })),
  signOut: vi.fn(async () => ({ error: null })),
  downloadDecisionPdf: vi.fn(async () => undefined),
  downloadWorkbook: vi.fn(async () => undefined),
  requestAccountDeletion: vi.fn(async () => undefined),
}));

vi.mock("../core/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: mocks.session.value } })),
      onAuthStateChange: vi.fn((callback: (_event: string, session: { user: { id: string } } | null) => void) => {
        mocks.authChangeCallback.value = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      getUser: vi.fn(async () => ({ data: { user: mocks.user.value } })),
      signInWithPassword: mocks.signInWithPassword,
      signUp: mocks.signUp,
      resetPasswordForEmail: mocks.resetPasswordForEmail,
      signOut: mocks.signOut,
    },
    from: vi.fn((table: string) => {
      if (table === "brix_deals") {
        return {
          select: vi.fn(() => ({
            is: vi.fn(() => ({
              order: vi.fn(async () => ({ data: mocks.remoteDeals.value, error: null })),
            })),
            eq: vi.fn((field: string, value: string) => {
              if (field === "owner_id") mocks.queriedOwnerIds.value.push(value);
              return {
                is: vi.fn(() => ({
                  order: vi.fn(async () => ({ data: mocks.remoteDeals.value, error: null })),
                })),
              };
            }),
          })),
          upsert: mocks.upsert,
          update: mocks.update,
        };
      }
      return {};
    }),
    functions: { invoke: vi.fn(async () => ({ data: {}, error: null })) },
  },
}));

vi.mock("../core/reportExports", () => ({
  downloadDecisionPdf: mocks.downloadDecisionPdf,
  downloadWorkbook: mocks.downloadWorkbook,
}));

vi.mock("../core/authActions", () => ({
  requestAccountDeletion: mocks.requestAccountDeletion,
}));

function draftDeal(id: string, address: string) {
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

function remoteDealRow(id: string, ownerId: string, address: string) {
  return {
    id,
    owner_id: ownerId,
    address,
    status: "draft",
    strategy_id: "owner_occupant",
    facts: draftDeal(id, address),
  };
}

describe("BRIX app module flow", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/app");
    mocks.session.value = { user: { id: "user-1" } };
    mocks.user.value = { id: "user-1", email: "edhemmer@gmail.com" };
    mocks.remoteDeals.value = [];
    mocks.authChangeCallback.value = null;
    mocks.queriedOwnerIds.value = [];
    vi.clearAllMocks();
  });

  it("creates a deal in FindIQ and opens every connected module without a dead end", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "FindIQ" });
    expect(window.location.pathname).toBe("/app");
    fireEvent.change(screen.getByLabelText("Address, listing URL, or listing text"), {
      target: { value: "https://example.com/homedetails/1615-Augusta-Ln-Shorewood-IL-60404/63210803_zpid/ $399000 4 bed 2 bath Taxes $9000 HOA $250" },
    });
    fireEvent.change(screen.getByLabelText("Primary strategy"), { target: { value: "owner_occupant" } });
    fireEvent.click(screen.getByRole("button", { name: /create deal file/i }));

    expect(await screen.findByRole("heading", { name: /Visit|Research first|Do not visit yet/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/dealiq");
    expect(screen.getAllByText(/1615 Augusta Ln/i).length).toBeGreaterThan(0);
    expect(mocks.upsert).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Buy & Hold/i }));
    await waitFor(() => expect(mocks.upsert).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(/Buy & Hold:/i)).toBeInTheDocument();
    expect(screen.getByText(/Top fit/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /ContractIQ/i }));
    expect(window.location.pathname).toBe("/contractiq");
    expect(await screen.findByRole("heading", { name: /1615 Augusta Ln/i })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Paste contract text or key clauses"), {
      target: { value: "As-is purchase with inspection, financing, HOA, appraisal, earnest money, and tax proration." },
    });
    expect(await screen.findByText(/As-is condition/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /OfferIQ/i }));
    expect(window.location.pathname).toBe("/offeriq");
    expect(await screen.findByText(/Conservative:/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /PipelineIQ/i }));
    expect(window.location.pathname).toBe("/pipelineiq");
    expect(await screen.findByText("New")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Reports/i }));
    expect(window.location.pathname).toBe("/reports");
    await screen.findByText("Recommendation");
    expect(screen.getAllByText(/What must be true/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Decision memo/i).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /Download PDF/i }));
    fireEvent.click(screen.getByRole("button", { name: /Download XLS/i }));
    expect(downloadDecisionPdf).toHaveBeenCalled();
    expect(downloadWorkbook).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /PortfolioIQ/i }));
    expect(window.location.pathname).toBe("/portfolioiq");
    expect(await screen.findByText(/No portfolio assets yet/i)).toBeInTheDocument();

    await waitFor(() => expect(screen.queryByText(/Sync needs attention/i)).not.toBeInTheDocument());
  }, 10000);

  it("handles account sign-in, reset, and deletion request wiring", async () => {
    mocks.session.value = null;
    mocks.signInWithPassword.mockResolvedValueOnce({ data: { session: { user: { id: "user-1" } } }, error: null });
    window.history.replaceState({}, "", "/account");

    render(<App />);

    await screen.findByRole("heading", { name: "Account" });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "edhemmer@gmail.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "inlight" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(mocks.signInWithPassword).toHaveBeenCalledWith({ email: "edhemmer@gmail.com", password: "inlight" }));
    expect(window.location.pathname).toBe("/findiq");

    fireEvent.click(screen.getByRole("button", { name: /Account/i }));
    await screen.findByRole("heading", { name: "Account" });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "edhemmer@gmail.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Reset password/i }));
    await waitFor(() => expect(mocks.resetPasswordForEmail).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /Request account deletion/i }));
    await waitFor(() => expect(requestAccountDeletion).toHaveBeenCalled());
  });

  it("normalizes older or sparse remote deal rows before modules consume them", () => {
    const deal = normalizeDealRow({
      id: "deal-1",
      address: "10 Test St",
      facts: { listPrice: 250000, strategyId: "not-a-real-strategy" },
    });

    expect(deal.id).toBe("deal-1");
    expect(deal.address).toBe("10 Test St");
    expect(deal.status).toBe("draft");
    expect(deal.strategyId).toBe("owner_occupant");
    expect(deal.createdAt).toBeTruthy();
    expect(deal.updatedAt).toBeTruthy();
    expect(deal.notes).toEqual([]);
    expect(deal.photoUrls).toEqual([]);
  });

  it("does not open DealIQ when cloud deal creation is rejected", async () => {
    mocks.upsert.mockReturnValueOnce({
      select: vi.fn(() => ({
        single: vi.fn(async () => ({ data: null, error: new Error("free deal limit reached") })),
      })),
    });
    render(<App />);

    await screen.findByRole("heading", { name: "FindIQ" });
    fireEvent.change(screen.getByLabelText("Address, listing URL, or listing text"), {
      target: { value: "10 Failed Save St, Test, IL 60000 $250000 3 bed 2 bath" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create deal file/i }));

    await screen.findByText(/BRIX could not save this deal/i);
    expect(window.location.pathname).toBe("/findiq");
    expect(screen.queryByRole("heading", { name: /Visit|Research first|Do not visit yet/i })).not.toBeInTheDocument();
  });

  it("opens the app workspace when signed out instead of forcing the account screen", async () => {
    mocks.session.value = null;
    mocks.user.value = null;
    render(<App />);

    await screen.findByRole("heading", { name: "FindIQ" });
    expect(window.location.pathname).toBe("/app");
  });

  it("creates a device-local deal when signed out and sends the user into DealIQ", async () => {
    mocks.session.value = null;
    mocks.user.value = null;
    render(<App />);

    await screen.findByRole("heading", { name: "FindIQ" });
    fireEvent.change(screen.getByLabelText("Address, listing URL, or listing text"), {
      target: { value: "20 Local Save St, Test, IL 60000 $250000 3 bed 2 bath" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create deal file/i }));

    expect(await screen.findByRole("heading", { name: /Visit|Research first|Do not visit yet/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/dealiq");
    expect(await screen.findByText(/Sign in from Account/i)).toBeInTheDocument();
    expect(mocks.upsert).not.toHaveBeenCalled();
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

    await screen.findByRole("heading", { name: "Account" });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "edhemmer@gmail.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "inlight" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Cloud After Sign In")).toBeInTheDocument();
    expect(screen.queryByText("Preserved Anonymous Draft")).not.toBeInTheDocument();
    expect(localStorage.getItem("brix.deals")).toContain("Preserved Anonymous Draft");
    expect(screen.getByText("Local drafts are saved on this device and are not part of your BRIX account.")).toBeInTheDocument();
    expect(mocks.upsert).not.toHaveBeenCalledWith(expect.objectContaining({ id: "anon-preserved" }));
  });

  it("mocked: does not write authenticated cloud deals to the shared anonymous browser key", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "FindIQ" });
    fireEvent.change(screen.getByLabelText("Address, listing URL, or listing text"), {
      target: { value: "30 Cloud Only St, Test, IL 60000 $300000 3 bed 2 bath" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create deal file/i }));

    await screen.findByRole("heading", { name: /Visit|Research first|Do not visit yet/i });
    expect(mocks.upsert).toHaveBeenCalled();
    expect(localStorage.getItem("brix.deals")).toBeNull();
  });

  it("mocked: sign out clears authenticated deals and can show preserved anonymous records only", async () => {
    localStorage.setItem("brix.deals", JSON.stringify([{ id: "anon-1", address: "Anonymous Draft", status: "draft", strategyId: "owner_occupant", createdAt: "2026-01-01", updatedAt: "2026-01-01", notes: [], photoUrls: [], uploadedPhotoNames: [], verification: {} }]));
    mocks.remoteDeals.value = [{ id: "remote-1", owner_id: "user-1", address: "User One Deal", status: "draft", strategy_id: "owner_occupant", facts: { id: "remote-1", address: "User One Deal", strategyId: "owner_occupant", status: "draft", createdAt: "2026-01-01", updatedAt: "2026-01-01", notes: [], photoUrls: [], uploadedPhotoNames: [], verification: {} } }];
    window.history.replaceState({}, "", "/account");
    render(<App />);

    await screen.findByText("User One Deal");
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

    await screen.findByRole("heading", { name: "Account" });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "confirm@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText(/Confirm your email before signing in/i)).toBeInTheDocument();
    expect(window.location.pathname).toBe("/account");
  });

  it("mocked: remote loading is scoped to the current authenticated user", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "FindIQ" });
    await waitFor(() => expect(mocks.queriedOwnerIds.value).toContain("user-1"));
  });
});
