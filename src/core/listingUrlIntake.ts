import { invokeBrixFunction } from "./supabase";
import type { ListingImportStatus, ListingProposalStatus, ListingSourceSupport, ListingUrlImportResult, ListingUrlProposal, ManualIntakeDraft } from "./types";

type UnknownRecord = Record<string, unknown>;

const sourceSupport: ListingSourceSupport[] = ["supported", "limited", "unsupported"];
const importStatuses: ListingImportStatus[] = ["complete", "partially_complete", "failed", "unsupported"];
const proposalStatuses: ListingProposalStatus[] = ["pending", "accepted", "rejected", "edited", "deferred", "conflicted", "superseded"];
const proposalFields = ["address", "city", "region", "postal_code", "property_type", "asking_price"] as const;

export async function importListingUrl(url: string): Promise<ListingUrlImportResult> {
  const result = await invokeBrixFunction<unknown>("extract-listing", { url });
  return normalizeListingImportResult(result);
}

export function normalizeListingImportResult(value: unknown): ListingUrlImportResult {
  if (!isRecord(value)) throw new Error("BRIX could not read the listing URL response.");
  const originalUrl = stringValue(value.originalUrl);
  const normalizedUrl = stringValue(value.normalizedUrl);
  if (!originalUrl || !normalizedUrl) throw new Error("BRIX could not confirm the listing URL.");
  const supportLevel = sourceSupport.includes(value.supportLevel as ListingSourceSupport) ? value.supportLevel as ListingSourceSupport : "unsupported";
  const status = importStatuses.includes(value.status as ListingImportStatus) ? value.status as ListingImportStatus : supportLevel === "unsupported" ? "unsupported" : "failed";
  return {
    originalUrl,
    normalizedUrl,
    sourceKey: stringValue(value.sourceKey) ?? "unknown",
    sourceDisplayName: stringValue(value.sourceDisplayName) ?? "Unsupported source",
    supportLevel,
    retrievalMethod: stringValue(value.retrievalMethod) ?? "none",
    adapterVersion: stringValue(value.adapterVersion) ?? "unknown",
    status,
    retrievedAt: stringValue(value.retrievedAt) ?? new Date().toISOString(),
    safeMessage: stringValue(value.safeMessage) ?? "BRIX saved the URL and left missing facts blank.",
    licensingNotes: stringValue(value.licensingNotes) ?? "Only permitted source metadata and user-provided values are retained.",
    proposals: Array.isArray(value.proposals) ? value.proposals.map(normalizeProposal).filter(isProposal) : [],
  };
}

export function applyListingProposal(draft: ManualIntakeDraft, proposalId: string, status: ListingProposalStatus): ManualIntakeDraft {
  const proposals = (draft.listingProposals ?? []).map((proposal) => {
    if (proposal.id !== proposalId) return proposal;
    const next = { ...proposal, status };
    return next;
  });
  const accepted = proposals.find((proposal) => proposal.id === proposalId && (proposal.status === "accepted" || proposal.status === "edited"));
  const nextDraft = accepted ? applyAcceptedProposal({ ...draft, listingProposals: proposals }, accepted) : { ...draft, listingProposals: proposals };
  return { ...nextDraft, updatedAt: new Date().toISOString() };
}

export function attachListingImportToDraft(draft: ManualIntakeDraft, listingImport: ListingUrlImportResult): ManualIntakeDraft {
  return {
    ...draft,
    sourceUrl: listingImport.normalizedUrl,
    source: listingImport.sourceDisplayName,
    listingImport,
    listingProposals: listingImport.proposals,
    updatedAt: new Date().toISOString(),
  };
}

export function proposalSummary(proposals?: ListingUrlProposal[]) {
  const list = proposals ?? [];
  return {
    pending: list.filter((proposal) => proposal.status === "pending").length,
    accepted: list.filter((proposal) => proposal.status === "accepted" || proposal.status === "edited").length,
    rejected: list.filter((proposal) => proposal.status === "rejected").length,
    deferred: list.filter((proposal) => proposal.status === "deferred").length,
  };
}

function applyAcceptedProposal(draft: ManualIntakeDraft, proposal: ListingUrlProposal): ManualIntakeDraft {
  switch (proposal.field) {
    case "address": return draft.address.trim() ? draft : { ...draft, address: proposal.normalizedValue };
    case "city": return draft.city?.trim() ? draft : { ...draft, city: proposal.normalizedValue };
    case "region": return draft.region?.trim() ? draft : { ...draft, region: proposal.normalizedValue.toUpperCase() };
    case "postal_code": return draft.postalCode?.trim() ? draft : { ...draft, postalCode: proposal.normalizedValue };
    case "property_type": return draft.propertyType?.trim() ? draft : { ...draft, propertyType: proposal.normalizedValue };
    case "asking_price": return draft.askingPrice?.trim() ? draft : { ...draft, askingPrice: proposal.normalizedValue };
  }
}

function normalizeProposal(value: unknown): ListingUrlProposal | null {
  if (!isRecord(value)) return null;
  const id = stringValue(value.id);
  const field = proposalFields.includes(value.field as ListingUrlProposal["field"]) ? value.field as ListingUrlProposal["field"] : undefined;
  const normalizedValue = stringValue(value.normalizedValue);
  if (!id || !field || !normalizedValue) return null;
  const status = proposalStatuses.includes(value.status as ListingProposalStatus) ? value.status as ListingProposalStatus : "pending";
  return {
    id,
    field,
    label: stringValue(value.label) ?? field,
    rawValue: stringValue(value.rawValue) ?? normalizedValue,
    normalizedValue,
    displayValue: stringValue(value.displayValue) ?? normalizedValue,
    classification: value.classification === "external_estimate" || value.classification === "unknown" ? value.classification : "source_backed_candidate",
    verificationState: "unverified",
    confidence: clampNumber(value.confidence, 0, 100) ?? 50,
    status,
    sourceKey: stringValue(value.sourceKey) ?? "unknown",
    evidenceRule: stringValue(value.evidenceRule) ?? "URL-derived candidate value",
  };
}

function clampNumber(value: unknown, min: number, max: number) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(min, Math.min(max, parsed));
}

function isProposal(value: ListingUrlProposal | null): value is ListingUrlProposal {
  return value !== null;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
