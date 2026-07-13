import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { requestAccountDeletion } from "../core/authActions";
import { downloadDecisionPdf, downloadWorkbook } from "../core/reportExports";
import { normalizeDealRow } from "../core/store";

const mocks = vi.hoisted(() => ({
  session: { value: { user: { id: "user-1" } } as { user: { id: string } } | null },
  user: { value: { id: "user-1", email: "edhemmer@gmail.com" } as { id: string; email: string } | null },
  upsert: vi.fn(async () => ({ error: null })),
  update: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })),
  signInWithPassword: vi.fn(async () => ({ error: null })),
  signUp: vi.fn(async () => ({ error: null })),
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
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
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
              order: vi.fn(async () => ({ data: [], error: null })),
            })),
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

describe("BRIX app module flow", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/app");
    mocks.session.value = { user: { id: "user-1" } };
    mocks.user.value = { id: "user-1", email: "edhemmer@gmail.com" };
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
    mocks.upsert.mockResolvedValueOnce({ error: new Error("free deal limit reached") });
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
});
