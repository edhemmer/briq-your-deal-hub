import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";

const upsertMock = vi.fn(async () => ({ error: null }));
const updateMock = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }));

vi.mock("../core/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: { user: { id: "user-1" } } } })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getUser: vi.fn(async () => ({ data: { user: { id: "user-1", email: "edhemmer@gmail.com" } } })),
      signInWithPassword: vi.fn(async () => ({ error: null })),
      signUp: vi.fn(async () => ({ error: null })),
      resetPasswordForEmail: vi.fn(async () => ({ error: null })),
      signOut: vi.fn(async () => ({ error: null })),
    },
    from: vi.fn((table: string) => {
      if (table === "brix_deals") {
        return {
          select: vi.fn(() => ({
            is: vi.fn(() => ({
              order: vi.fn(async () => ({ data: [], error: null })),
            })),
          })),
          upsert: upsertMock,
          update: updateMock,
        };
      }
      return {};
    }),
    functions: { invoke: vi.fn(async () => ({ data: {}, error: null })) },
  },
}));

vi.mock("../core/reportExports", () => ({
  downloadDecisionPdf: vi.fn(async () => undefined),
  downloadWorkbook: vi.fn(async () => undefined),
}));

vi.mock("../core/authActions", () => ({
  requestAccountDeletion: vi.fn(async () => undefined),
}));

describe("BRIX app module flow", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/app");
    upsertMock.mockClear();
  });

  it("creates a deal in FindIQ and opens every connected module without a dead end", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "FindIQ" });
    fireEvent.change(screen.getByLabelText("Address, listing URL, or listing text"), {
      target: { value: "https://example.com/homedetails/1615-Augusta-Ln-Shorewood-IL-60404/63210803_zpid/ $399000 4 bed 2 bath Taxes $9000 HOA $250" },
    });
    fireEvent.change(screen.getByLabelText("Primary strategy"), { target: { value: "owner_occupant" } });
    fireEvent.click(screen.getByRole("button", { name: /create deal file/i }));

    expect(await screen.findByRole("heading", { name: /Visit|Research first|Do not visit yet/i })).toBeInTheDocument();
    expect(screen.getAllByText(/1615 Augusta Ln/i).length).toBeGreaterThan(0);
    expect(upsertMock).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Buy & Hold/i }));
    expect(await screen.findByText(/Buy & Hold:/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /ContractIQ/i }));
    expect(await screen.findByRole("heading", { name: /1615 Augusta Ln/i })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Paste contract text or key clauses"), {
      target: { value: "As-is purchase with inspection, financing, HOA, appraisal, earnest money, and tax proration." },
    });
    expect(await screen.findByText(/As-is condition/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /OfferIQ/i }));
    expect(await screen.findByText(/Conservative:/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /PipelineIQ/i }));
    expect(await screen.findByText("New")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Reports/i }));
    await screen.findByText("Recommendation");
    expect(screen.getAllByText(/Decision memo/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /PortfolioIQ/i }));
    expect(await screen.findByText(/No portfolio assets yet/i)).toBeInTheDocument();

    await waitFor(() => expect(screen.queryByText(/Sync needs attention/i)).not.toBeInTheDocument());
  });
});
