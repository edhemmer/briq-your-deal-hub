import { supabase } from "./supabase";
import type { Json } from "./supabaseDatabase.types";

type RpcClient = {
  rpc<T = unknown>(name: string, args?: Record<string, unknown>): Promise<{ data: T | null; error: { message?: string } | null }>;
  from(name: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        order(column: string, options?: { ascending?: boolean }): Promise<{ data: JsonRecord[] | null; error: { message?: string } | null }>;
      };
    };
  };
};

type JsonRecord = Record<string, unknown>;
type JsonObject = Record<string, Json>;

export type ContractChangePropagationProjection = {
  contractChangePropagationId: string;
  propagationVersion: number;
  workspaceId: string;
  dealId: string;
  propertyId?: string;
  contractId: string;
  contractVersion: number;
  contractTermId: string;
  contractTermVersion: number;
  contractFindingId?: string;
  contractFindingVersion?: number;
  acceptedProposalId: string;
  acceptedProposalVersion: number;
  sourceEvidenceId: string;
  sourceAnchor: JsonObject;
  verificationState: string;
  perspective: string;
  proposalType: string;
  targetDomain: string;
  materiality: string;
  propagationStatus: string;
  affectedDomains: string[];
  underwritingStatus: string;
  strategyStatus: string;
  financeStatus: string;
  deadlineTaskStatus: string;
  cockpitStatus: string;
  timelineStatus: string;
  retryCount: number;
  priorValidReferences: string[];
  versionGraph: JsonObject;
  deterministicRequestHash: string;
  downstreamProposalCount: number;
  failedDownstreamCount: number;
  generatedAt: string;
  updatedAt: string;
  loadedAt: string;
};

export async function propagateAcceptedContractChange(proposalId: string, expectedContractVersion: number, input: JsonObject = {}) {
  const [row] = await callRpc<JsonRecord[]>("propagate_accepted_contract_change", {
    target_contract_change_proposal_id: proposalId,
    propagation_input: input,
    expected_contract_version: expectedContractVersion,
    idempotency_key: `contractiq-ui-propagate-${proposalId}-${expectedContractVersion}-${Date.now()}`,
  });
  if (!row) throw new Error("BRIX did not confirm ContractIQ change propagation.");
  return {
    contractChangePropagationId: stringValue(row.contract_change_propagation_id),
    workspaceId: stringValue(row.workspace_id),
    contractId: stringValue(row.contract_id),
    acceptedProposalId: stringValue(row.accepted_proposal_id),
    targetDomain: stringValue(row.target_domain),
    propagationStatus: stringValue(row.propagation_status),
    downstreamProposalCount: numberValue(row.downstream_proposal_count) ?? 0,
    deterministicRequestHash: stringValue(row.deterministic_request_hash),
  };
}

export async function loadContractChangePropagations(contractId: string): Promise<ContractChangePropagationProjection[]> {
  const client = supabase as unknown as RpcClient;
  const { data, error } = await client
    .from("contract_change_propagation_projection")
    .select("*")
    .eq("contract_id", contractId)
    .order("generated_at", { ascending: false });
  if (error) throw new Error(error.message ?? "BRIX could not load ContractIQ propagation state.");
  return (data ?? []).map(mapPropagation);
}

async function callRpc<T>(name: string, args: Record<string, unknown>) {
  const client = supabase as unknown as RpcClient;
  const { data, error } = await client.rpc<T>(name, args);
  if (error) throw new Error(error.message ?? `BRIX could not load ${name}.`);
  return (data ?? []) as T;
}

function mapPropagation(row: JsonRecord): ContractChangePropagationProjection {
  return {
    contractChangePropagationId: stringValue(row.contract_change_propagation_id),
    propagationVersion: numberValue(row.propagation_version) ?? 1,
    workspaceId: stringValue(row.workspace_id),
    dealId: stringValue(row.deal_id),
    propertyId: optionalString(row.property_id),
    contractId: stringValue(row.contract_id),
    contractVersion: numberValue(row.contract_version) ?? 1,
    contractTermId: stringValue(row.contract_term_id),
    contractTermVersion: numberValue(row.contract_term_version) ?? 1,
    contractFindingId: optionalString(row.contract_finding_id),
    contractFindingVersion: numberValue(row.contract_finding_version),
    acceptedProposalId: stringValue(row.accepted_proposal_id),
    acceptedProposalVersion: numberValue(row.accepted_proposal_version) ?? 1,
    sourceEvidenceId: stringValue(row.source_evidence_id),
    sourceAnchor: objectValue(row.source_anchor) as JsonObject,
    verificationState: stringValue(row.verification_state),
    perspective: stringValue(row.perspective),
    proposalType: stringValue(row.proposal_type),
    targetDomain: stringValue(row.target_domain),
    materiality: stringValue(row.materiality),
    propagationStatus: stringValue(row.propagation_status),
    affectedDomains: arrayOfStrings(row.affected_domains),
    underwritingStatus: stringValue(row.underwriting_status),
    strategyStatus: stringValue(row.strategy_status),
    financeStatus: stringValue(row.finance_status),
    deadlineTaskStatus: stringValue(row.deadline_task_status),
    cockpitStatus: stringValue(row.cockpit_status),
    timelineStatus: stringValue(row.timeline_status),
    retryCount: numberValue(row.retry_count) ?? 0,
    priorValidReferences: arrayOfStrings(row.prior_valid_references),
    versionGraph: objectValue(row.version_graph) as JsonObject,
    deterministicRequestHash: stringValue(row.deterministic_request_hash),
    downstreamProposalCount: numberValue(row.downstream_proposal_count) ?? 0,
    failedDownstreamCount: numberValue(row.failed_downstream_count) ?? 0,
    generatedAt: stringValue(row.generated_at),
    updatedAt: stringValue(row.updated_at),
    loadedAt: stringValue(row.loaded_at),
  };
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function optionalString(value: unknown) {
  const candidate = stringValue(value).trim();
  return candidate.length > 0 ? candidate : undefined;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function objectValue(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function arrayOfStrings(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}
