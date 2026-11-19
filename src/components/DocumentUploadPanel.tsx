import { useState } from "react";
import { FileUp } from "lucide-react";
import { importEvidenceFile } from "../core/fileEvidenceIntake";
import { supabase } from "../core/supabase";

type Kind = "contract" | "governance";
type RpcResult = { data: unknown; error: { message: string } | null };
// Same pattern as contractIQClient: these RPCs are newer than the generated database types.
const rpc = (name: string, args: Record<string, unknown>) => (supabase as unknown as { rpc: (n: string, a: Record<string, unknown>) => Promise<RpcResult> }).rpc(name, args);

const CONTRACT_TYPES: Array<[string, string]> = [
  ["purchase_agreement", "Purchase agreement"],
  ["offer", "Offer"],
  ["counteroffer", "Counteroffer"],
  ["amendment", "Amendment"],
  ["addendum", "Addendum"],
  ["seller_disclosure", "Seller disclosure"],
  ["residential_lease", "Residential lease"],
  ["commercial_lease", "Commercial lease"],
  ["loan_agreement", "Loan agreement"],
  ["promissory_note", "Promissory note"],
  ["title_commitment", "Title commitment"],
  ["settlement_statement", "Settlement statement"],
  ["option_agreement", "Option agreement"],
  ["operating_agreement", "Operating agreement"],
];

const GOVERNANCE_TYPES: Array<[string, string]> = [
  ["homeowners_association", "Homeowners association (HOA)"],
  ["condominium_association", "Condominium association"],
  ["property_owners_association", "Property owners association"],
  ["master_association", "Master association"],
  ["cooperative", "Cooperative"],
  ["private_road_maintenance", "Private road maintenance"],
  ["other_private_governance", "Other"],
];

const GOVERNANCE_DOCS: Array<[string, string]> = [
  ["declaration_ccrs", "Declaration / CC&Rs"],
  ["bylaws", "Bylaws"],
  ["rules_regulations", "Rules & regulations"],
  ["budget", "Budget"],
  ["financial_statement", "Financial statement"],
  ["reserve_study", "Reserve study"],
  ["resale_certificate", "Resale certificate"],
  ["meeting_minutes", "Meeting minutes"],
  ["assessment_notice", "Assessment notice"],
  ["insurance_summary", "Master insurance summary"],
  ["amendment", "Amendment"],
];

/** Upload a document as private Evidence and create the ContractIQ or GovernanceIQ record that uses it. */
export function DocumentUploadPanel({ kind, workspaceId, dealId, dealName, onCreated }: { kind: Kind; workspaceId: string; dealId: string; dealName: string; onCreated: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState(kind === "contract" ? "purchase_agreement" : "homeowners_association");
  const [docType, setDocType] = useState("declaration_ccrs");
  const [perspective, setPerspective] = useState("buyer");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "creating" | "done" | "failed">("idle");
  const [message, setMessage] = useState("");

  async function submit() {
    if (!file) return;
    setStatus("uploading");
    setMessage("");
    try {
      const evidence = await importEvidenceFile(workspaceId, file);
      const evidenceId = evidence.duplicateOfEvidenceId ?? evidence.evidenceId;
      if (!evidenceId) throw new Error(evidence.safeMessage || "BRIX could not preserve this file.");
      setStatus("creating");
      if (kind === "contract") {
        const label = CONTRACT_TYPES.find(([key]) => key === type)?.[1] ?? "Contract";
        const { error } = await rpc("create_contract", {
          target_workspace_id: workspaceId,
          contract_input: { dealId, title: name.trim() || `${label} — ${dealName}`, contractType: type, perspective, sourceEvidenceId: evidenceId, analysisState: "uploaded" },
          idempotency_key: `contract:create:${dealId}:${evidenceId}`,
        });
        if (error) throw new Error(error.message);
      } else {
        const label = GOVERNANCE_TYPES.find(([key]) => key === type)?.[1] ?? "Association";
        const { data, error } = await rpc("create_governance_record", {
          target_workspace_id: workspaceId,
          record_input: { dealId, name: name.trim() || `${label} — ${dealName}`, governanceType: type, sourceEvidenceId: evidenceId },
          idempotency_key: `governance:create:${dealId}:${evidenceId}`,
        });
        if (error) throw new Error(error.message);
        const row = (Array.isArray(data) ? data[0] : data) as { governance_record_id?: string } | null;
        if (row?.governance_record_id) {
          const { error: linkError } = await rpc("link_governance_document", {
            target_governance_record_id: row.governance_record_id,
            document_input: { evidenceId, documentType: docType },
            idempotency_key: `governance:link:${row.governance_record_id}:${evidenceId}`,
          });
          if (linkError && !/already|duplicate/i.test(linkError.message)) throw new Error(linkError.message);
        }
      }
      setStatus("done");
      setMessage(kind === "contract" ? "Contract saved. BRIX is ready to review it." : "Governance record created from your document.");
      setFile(null);
      onCreated();
    } catch (error) {
      setStatus("failed");
      setMessage(error instanceof Error ? error.message : "Upload failed. Nothing was saved; you can retry safely.");
    }
  }

  const busy = status === "uploading" || status === "creating";
  const types = kind === "contract" ? CONTRACT_TYPES : GOVERNANCE_TYPES;
  return (
    <section className="workspace-card upload-panel" aria-label={kind === "contract" ? "Add a contract" : "Add association documents"}>
      <p className="eyebrow"><FileUp size={14} aria-hidden="true" /> {kind === "contract" ? "Add a contract" : "Add HOA / association documents"}</p>
      <p className="quiet">
        {kind === "contract"
          ? "Upload a purchase agreement, lease, loan document, or addendum (PDF, DOCX, image, or text up to 5 MB). The original is stored privately as Evidence on this Deal."
          : "Upload the declaration, bylaws, budget, reserve study, or resale certificate. BRIX stores it privately and starts a governance record for rental limits, dues, and special-assessment risk."}
      </p>
      <div className="property-facts-grid">
        <label className="field compact-field">
          <span>File</span>
          <input type="file" accept=".pdf,.docx,.txt,.csv,.xlsx,.png,.jpg,.jpeg,.webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        </label>
        <label className="field compact-field">
          <span>{kind === "contract" ? "Document type" : "Association type"}</span>
          <select value={type} onChange={(event) => setType(event.target.value)}>
            {types.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        {kind === "contract" ? (
          <label className="field compact-field">
            <span>Your role</span>
            <select value={perspective} onChange={(event) => setPerspective(event.target.value)}>
              {["buyer", "seller", "landlord", "tenant", "borrower", "investor"].map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
            </select>
          </label>
        ) : (
          <label className="field compact-field">
            <span>Document</span>
            <select value={docType} onChange={(event) => setDocType(event.target.value)}>
              {GOVERNANCE_DOCS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </label>
        )}
        <label className="field compact-field">
          <span>Name (optional)</span>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder={kind === "contract" ? "e.g. Signed PA 11/18" : "e.g. Maple Ridge HOA"} />
        </label>
      </div>
      <div className="button-row">
        <button className="primary compact" type="button" disabled={!file || busy} onClick={() => void submit()}>
          <FileUp size={16} /> {status === "uploading" ? "Uploading…" : status === "creating" ? "Creating record…" : "Upload and add"}
        </button>
      </div>
      {message ? <p className={status === "failed" ? "analyzer-banner failed" : "analyzer-save-state saved"} role="status">{message}</p> : null}
    </section>
  );
}
