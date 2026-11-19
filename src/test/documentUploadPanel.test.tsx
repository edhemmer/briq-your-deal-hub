import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const rpc = vi.fn();
const importEvidenceFile = vi.fn();
vi.mock("../core/supabase", () => ({ supabase: { rpc: (...args: unknown[]) => rpc(...args) } }));
vi.mock("../core/fileEvidenceIntake", () => ({ importEvidenceFile: (...args: unknown[]) => importEvidenceFile(...args) }));

import { DocumentUploadPanel } from "../components/DocumentUploadPanel";

function pickFile() {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(["%PDF-1.4"], "PA.pdf", { type: "application/pdf" });
  fireEvent.change(input, { target: { files: [file] } });
}

describe("DocumentUploadPanel", () => {
  beforeEach(() => {
    rpc.mockReset();
    importEvidenceFile.mockReset();
    importEvidenceFile.mockResolvedValue({ evidenceId: "ev-1", safeMessage: "ok" });
  });

  it("stores the file as Evidence, then creates a contract that cites it", async () => {
    rpc.mockResolvedValue({ data: [{ contract_id: "c-1" }], error: null });
    const onCreated = vi.fn();
    render(<DocumentUploadPanel kind="contract" workspaceId="ws-1" dealId="deal-1" dealName="1418 Maple St" onCreated={onCreated} />);
    pickFile();
    fireEvent.click(screen.getByRole("button", { name: /Upload and add/ }));
    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(importEvidenceFile).toHaveBeenCalledWith("ws-1", expect.any(File));
    expect(rpc).toHaveBeenCalledWith("create_contract", expect.objectContaining({
      target_workspace_id: "ws-1",
      idempotency_key: "contract:create:deal-1:ev-1",
      contract_input: expect.objectContaining({ dealId: "deal-1", contractType: "purchase_agreement", sourceEvidenceId: "ev-1" }),
    }));
  });

  it("creates a governance record and links the document", async () => {
    rpc.mockImplementation((name: string) => Promise.resolve(name === "create_governance_record"
      ? { data: [{ governance_record_id: "g-1" }], error: null }
      : { data: [{ governance_document_id: "gd-1" }], error: null }));
    const onCreated = vi.fn();
    render(<DocumentUploadPanel kind="governance" workspaceId="ws-1" dealId="deal-1" dealName="Deal" onCreated={onCreated} />);
    pickFile();
    fireEvent.click(screen.getByRole("button", { name: /Upload and add/ }));
    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(rpc).toHaveBeenCalledWith("link_governance_document", expect.objectContaining({
      target_governance_record_id: "g-1",
      document_input: { evidenceId: "ev-1", documentType: "declaration_ccrs" },
    }));
  });

  it("reports a failure without claiming success", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "You do not have permission to manage ContractIQ in this BRIX workspace." } });
    const onCreated = vi.fn();
    render(<DocumentUploadPanel kind="contract" workspaceId="ws-1" dealId="deal-1" dealName="Deal" onCreated={onCreated} />);
    pickFile();
    fireEvent.click(screen.getByRole("button", { name: /Upload and add/ }));
    expect(await screen.findByText(/do not have permission/)).toBeInTheDocument();
    expect(onCreated).not.toHaveBeenCalled();
  });
});
