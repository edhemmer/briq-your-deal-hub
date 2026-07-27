import { supabase } from "./supabase";

export const DUPLICATE_DETECTION_REQUEST_VERSION = 1;
export const DUPLICATE_RULE_REGISTRY_VERSION = "duplicate-detection-v1";

export const duplicateSubjectTypes = [
  "property",
  "deal",
  "evidence",
  "listing_source",
  "email_source",
  "source_record",
  "intake",
  "shared_handoff",
  "batch_item",
] as const;

export const duplicateDecisionActions = [
  "reuse_existing",
  "attach_existing",
  "create_separate",
  "not_duplicate",
  "defer",
  "cancel",
] as const;

export type DuplicateSubjectType = typeof duplicateSubjectTypes[number];
export type DuplicateDecisionAction = typeof duplicateDecisionActions[number];
export type DuplicateConfidenceBand = "exact" | "strong" | "possible";

export type DuplicateIdentity = {
  workspaceId: string;
  canonicalId?: string;
  displayName?: string;
  subjectType?: DuplicateSubjectType;
  propertyId?: string;
  dealId?: string;
  evidenceId?: string;
  intakeId?: string;
  sourceRecordId?: string;
  handoffId?: string;
  batchId?: string;
  batchItemId?: string;
  normalizedAddress?: string;
  unitNumber?: string;
  parcelId?: string;
  latitude?: number;
  longitude?: number;
  listingProviderKey?: string;
  listingId?: string;
  sourceUrl?: string;
  contentHash?: string;
  messageId?: string;
  bodyHash?: string;
  attachmentHashes?: readonly string[];
  idempotencyKey?: string;
  status?: string;
  archivedAt?: string;
};

export type DuplicateDetectionRequest = {
  requestVersion: typeof DUPLICATE_DETECTION_REQUEST_VERSION;
  ruleRegistryVersion: typeof DUPLICATE_RULE_REGISTRY_VERSION;
  requestHash: string;
  workspaceId: string;
  subjectType: DuplicateSubjectType;
  identity: DuplicateIdentity;
  candidateLimit: number;
  includeArchived: boolean;
};

export type DuplicateCandidateInput = {
  subjectType: DuplicateSubjectType;
  identity: DuplicateIdentity;
};

export type DuplicateCandidateResult = {
  candidateKey: string;
  subjectType: DuplicateSubjectType;
  candidateCanonicalId?: string;
  ruleId: string;
  ruleVersion: number;
  score: number;
  confidence: DuplicateConfidenceBand;
  explanation: string[];
  conflicts: string[];
  recommendedDecision: Extract<DuplicateDecisionAction, "reuse_existing" | "attach_existing" | "defer">;
  sortKey: string;
  identity: DuplicateIdentity;
};

export type DuplicateDecisionRecordInput = {
  workspaceId: string;
  idempotencyKey: string;
  subjectType: DuplicateSubjectType;
  subjectIdentity: DuplicateIdentity;
  candidate?: DuplicateCandidateResult;
  decision: DuplicateDecisionAction;
  rationaleCategory: "exact_identity" | "same_property" | "same_source" | "same_evidence" | "not_same" | "needs_review" | "user_cancelled";
  userNote?: string;
};

export type DuplicateDecisionRecordResult = {
  duplicateDecisionId: string;
  decision: DuplicateDecisionAction;
  subjectType: DuplicateSubjectType;
  candidateSubjectType?: DuplicateSubjectType;
  idempotencyKeyOut: string;
};

type DuplicateRule = {
  id: string;
  version: number;
  priority: number;
  subjectTypes: readonly DuplicateSubjectType[];
  evaluate: (request: DuplicateDetectionRequest, candidate: DuplicateCandidateInput) => Omit<DuplicateCandidateResult, "candidateKey" | "sortKey" | "identity" | "subjectType" | "candidateCanonicalId"> | null;
};

export function createDuplicateDetectionRequest(input: {
  workspaceId: string;
  subjectType: DuplicateSubjectType;
  identity: Partial<DuplicateIdentity>;
  candidateLimit?: number;
  includeArchived?: boolean;
}): DuplicateDetectionRequest {
  if (!duplicateSubjectTypes.includes(input.subjectType)) throw new Error("Unsupported duplicate subject type.");
  const workspaceId = clean(input.workspaceId);
  if (!workspaceId) throw new Error("Duplicate detection requires a workspace.");
  const identity = normalizeDuplicateIdentity({ ...input.identity, workspaceId, subjectType: input.subjectType });
  const requestBase = {
    requestVersion: DUPLICATE_DETECTION_REQUEST_VERSION,
    ruleRegistryVersion: DUPLICATE_RULE_REGISTRY_VERSION,
    workspaceId,
    subjectType: input.subjectType,
    identity,
    candidateLimit: clampInteger(input.candidateLimit ?? 10, 1, 25),
    includeArchived: Boolean(input.includeArchived),
  } satisfies Omit<DuplicateDetectionRequest, "requestHash">;
  return {
    ...requestBase,
    requestHash: stableHash(stableSerialize(requestBase)),
  };
}

export function normalizeDuplicateIdentity(input: Partial<DuplicateIdentity>): DuplicateIdentity {
  const workspaceId = clean(input.workspaceId);
  if (!workspaceId) throw new Error("Duplicate identity requires workspace scope.");
  return {
    workspaceId,
    canonicalId: clean(input.canonicalId),
    displayName: clean(input.displayName),
    subjectType: duplicateSubjectTypes.includes(input.subjectType as DuplicateSubjectType) ? input.subjectType : undefined,
    propertyId: clean(input.propertyId),
    dealId: clean(input.dealId),
    evidenceId: clean(input.evidenceId),
    intakeId: clean(input.intakeId),
    sourceRecordId: clean(input.sourceRecordId),
    handoffId: clean(input.handoffId),
    batchId: clean(input.batchId),
    batchItemId: clean(input.batchItemId),
    normalizedAddress: normalizeAddress(input.normalizedAddress),
    unitNumber: normalizeUnit(input.unitNumber),
    parcelId: clean(input.parcelId)?.toUpperCase(),
    latitude: finiteNumber(input.latitude),
    longitude: finiteNumber(input.longitude),
    listingProviderKey: normalizeKey(input.listingProviderKey),
    listingId: clean(input.listingId),
    sourceUrl: normalizeSourceUrl(input.sourceUrl),
    contentHash: normalizeHash(input.contentHash),
    messageId: normalizeMessageId(input.messageId),
    bodyHash: normalizeHash(input.bodyHash),
    attachmentHashes: normalizeHashArray(input.attachmentHashes),
    idempotencyKey: clean(input.idempotencyKey),
    status: clean(input.status),
    archivedAt: clean(input.archivedAt),
  };
}

export function findDuplicateCandidates(request: DuplicateDetectionRequest, candidates: DuplicateCandidateInput[]): DuplicateCandidateResult[] {
  const normalizedCandidates = candidates
    .map((candidate) => ({
      subjectType: candidate.subjectType,
      identity: normalizeDuplicateIdentity({ ...candidate.identity, subjectType: candidate.subjectType }),
    }))
    .filter((candidate) => candidate.identity.workspaceId === request.workspaceId)
    .filter((candidate) => request.includeArchived || !candidate.identity.archivedAt);

  const results = normalizedCandidates.flatMap((candidate) => {
    const result = evaluateBestRule(request, candidate);
    if (!result) return [];
    const candidateCanonicalId = candidate.identity.canonicalId ?? candidate.identity.propertyId ?? candidate.identity.dealId ?? candidate.identity.evidenceId ?? candidate.identity.sourceRecordId ?? candidate.identity.intakeId ?? candidate.identity.batchItemId ?? candidate.identity.handoffId;
    const candidateKey = stableHash(stableSerialize({
      requestHash: request.requestHash,
      subjectType: candidate.subjectType,
      candidateCanonicalId,
      identity: candidate.identity,
      ruleId: result.ruleId,
    }));
    return [{
      ...result,
      candidateKey,
      subjectType: candidate.subjectType,
      candidateCanonicalId,
      identity: candidate.identity,
      sortKey: [
        String(1000 - result.score).padStart(4, "0"),
        result.ruleId,
        candidateCanonicalId ?? "",
        candidateKey,
      ].join(":"),
    }];
  });

  return dedupeResults(results)
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .slice(0, request.candidateLimit);
}

export function createCanonicalCandidateInputs(subjectType: DuplicateSubjectType, identities: Array<Partial<DuplicateIdentity>>): DuplicateCandidateInput[] {
  return identities.map((identity) => ({
    subjectType,
    identity: normalizeDuplicateIdentity({ ...identity, subjectType }),
  }));
}

export function packageBatchDuplicateCandidate(input: {
  workspaceId: string;
  batchId: string;
  itemId: string;
  address?: string;
  sourceUrl?: string;
  contentHash?: string;
}): DuplicateCandidateInput {
  return {
    subjectType: "batch_item",
    identity: normalizeDuplicateIdentity({
      workspaceId: input.workspaceId,
      batchId: input.batchId,
      batchItemId: input.itemId,
      normalizedAddress: input.address,
      sourceUrl: input.sourceUrl,
      contentHash: input.contentHash,
    }),
  };
}

export function validateDuplicateDecision(input: DuplicateDecisionRecordInput): DuplicateDecisionRecordInput {
  if (!duplicateDecisionActions.includes(input.decision)) throw new Error("Unsupported duplicate decision.");
  if (!clean(input.idempotencyKey)) throw new Error("Duplicate decision requires a retry key.");
  const subjectType = duplicateSubjectTypes.includes(input.subjectType) ? input.subjectType : undefined;
  if (!subjectType) throw new Error("Duplicate decision requires a supported subject type.");
  return {
    ...input,
    workspaceId: clean(input.workspaceId) ?? "",
    idempotencyKey: clean(input.idempotencyKey) ?? "",
    subjectType,
    subjectIdentity: normalizeDuplicateIdentity(input.subjectIdentity),
    userNote: clean(input.userNote),
  };
}

export async function recordDuplicateDecision(input: DuplicateDecisionRecordInput): Promise<DuplicateDecisionRecordResult> {
  const validated = validateDuplicateDecision(input);
  const rpc = supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: Error | null }>;
  const { data, error } = await rpc("record_duplicate_decision", {
    target_workspace_id: validated.workspaceId,
    idempotency_key: validated.idempotencyKey,
    decision_input: {
      subjectType: validated.subjectType,
      subjectIdentity: validated.subjectIdentity,
      candidate: validated.candidate,
      decision: validated.decision,
      rationaleCategory: validated.rationaleCategory,
      userNote: validated.userNote,
      ruleRegistryVersion: DUPLICATE_RULE_REGISTRY_VERSION,
    },
  });
  if (error) throw error;
  return normalizeDuplicateDecisionRecordResult(Array.isArray(data) ? data[0] : data);
}

export function duplicateRuleRegistrySnapshot() {
  return duplicateRules.map(({ id, version, priority, subjectTypes }) => ({ id, version, priority, subjectTypes: [...subjectTypes] }))
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
}

function normalizeDuplicateDecisionRecordResult(value: unknown): DuplicateDecisionRecordResult {
  if (!isRecord(value)) throw new Error("BRIX could not confirm the duplicate decision.");
  const duplicateDecisionId = clean(value.duplicate_decision_id);
  const decision = duplicateDecisionActions.includes(value.decision as DuplicateDecisionAction) ? value.decision as DuplicateDecisionAction : undefined;
  const subjectType = duplicateSubjectTypes.includes(value.subject_type as DuplicateSubjectType) ? value.subject_type as DuplicateSubjectType : undefined;
  const candidateSubjectType = duplicateSubjectTypes.includes(value.candidate_subject_type as DuplicateSubjectType) ? value.candidate_subject_type as DuplicateSubjectType : undefined;
  const idempotencyKeyOut = clean(value.idempotency_key_out);
  if (!duplicateDecisionId || !decision || !subjectType || !idempotencyKeyOut) throw new Error("BRIX could not confirm the duplicate decision.");
  return {
    duplicateDecisionId,
    decision,
    subjectType,
    candidateSubjectType,
    idempotencyKeyOut,
  };
}

function evaluateBestRule(request: DuplicateDetectionRequest, candidate: DuplicateCandidateInput) {
  return duplicateRules
    .filter((rule) => rule.subjectTypes.includes(request.subjectType))
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id))
    .map((rule) => rule.evaluate(request, candidate))
    .filter((result): result is NonNullable<typeof result> => result !== null)
    .sort((a, b) => b.score - a.score || a.ruleId.localeCompare(b.ruleId))[0] ?? null;
}

const duplicateRules: DuplicateRule[] = [
  {
    id: "property.parcel.exact",
    version: 1,
    priority: 10,
    subjectTypes: ["property"],
    evaluate: (request, candidate) => {
      if (candidate.subjectType !== "property" || !same(request.identity.parcelId, candidate.identity.parcelId)) return null;
      return exact("property.parcel.exact", 1, "Parcel/APN matches exactly.", request, candidate);
    },
  },
  {
    id: "property.address_unit.exact",
    version: 1,
    priority: 20,
    subjectTypes: ["property"],
    evaluate: (request, candidate) => {
      if (candidate.subjectType !== "property" || !same(request.identity.normalizedAddress, candidate.identity.normalizedAddress) || !same(request.identity.unitNumber ?? "", candidate.identity.unitNumber ?? "")) return null;
      return exact("property.address_unit.exact", 1, "Normalized address and unit match exactly.", request, candidate);
    },
  },
  {
    id: "property.address.possible_missing_unit",
    version: 1,
    priority: 30,
    subjectTypes: ["property"],
    evaluate: (request, candidate) => {
      if (candidate.subjectType !== "property" || !same(request.identity.normalizedAddress, candidate.identity.normalizedAddress)) return null;
      const conflicts = request.identity.unitNumber || candidate.identity.unitNumber ? ["Unit number is missing or differs."] : [];
      return candidateResult("property.address.possible_missing_unit", 1, 72, "possible", "Same normalized address needs unit verification.", conflicts, "defer");
    },
  },
  {
    id: "property.coordinates.supporting_only",
    version: 1,
    priority: 40,
    subjectTypes: ["property"],
    evaluate: (request, candidate) => {
      if (candidate.subjectType !== "property" || request.identity.latitude == null || request.identity.longitude == null || candidate.identity.latitude == null || candidate.identity.longitude == null) return null;
      const close = Math.abs(request.identity.latitude - candidate.identity.latitude) <= 0.00025 && Math.abs(request.identity.longitude - candidate.identity.longitude) <= 0.00025;
      if (!close) return null;
      return candidateResult("property.coordinates.supporting_only", 1, 55, "possible", "Coordinates are close, but coordinates alone are not enough to reuse a Property.", [], "defer");
    },
  },
  {
    id: "deal.same_property.active",
    version: 1,
    priority: 50,
    subjectTypes: ["deal"],
    evaluate: (request, candidate) => {
      if (candidate.subjectType !== "deal" || !same(request.identity.propertyId, candidate.identity.propertyId) || candidate.identity.archivedAt) return null;
      return candidateResult("deal.same_property.active", 1, 94, "strong", "An active Deal already exists for this Property.", [], "defer");
    },
  },
  {
    id: "deal.same_property.archived",
    version: 1,
    priority: 60,
    subjectTypes: ["deal"],
    evaluate: (request, candidate) => {
      if (candidate.subjectType !== "deal" || !same(request.identity.propertyId, candidate.identity.propertyId) || !candidate.identity.archivedAt) return null;
      return candidateResult("deal.same_property.archived", 1, 70, "possible", "An archived Deal exists for this Property.", ["Archived Deals require explicit review before reuse."], "defer");
    },
  },
  {
    id: "deal.source_url.exact",
    version: 1,
    priority: 70,
    subjectTypes: ["deal"],
    evaluate: (request, candidate) => {
      if (candidate.subjectType !== "deal" || !same(request.identity.sourceUrl, candidate.identity.sourceUrl)) return null;
      return candidateResult("deal.source_url.exact", 1, 88, "strong", "The Deal source URL matches an existing Deal.", [], "defer");
    },
  },
  {
    id: "evidence.content_hash.exact",
    version: 1,
    priority: 80,
    subjectTypes: ["evidence"],
    evaluate: (request, candidate) => {
      if (candidate.subjectType !== "evidence" || !same(request.identity.contentHash, candidate.identity.contentHash)) return null;
      return exact("evidence.content_hash.exact", 1, "Evidence bytes match an existing item.", request, candidate, "attach_existing");
    },
  },
  {
    id: "listing.provider_listing.exact",
    version: 1,
    priority: 90,
    subjectTypes: ["listing_source"],
    evaluate: (request, candidate) => {
      if (candidate.subjectType !== "listing_source" || !same(request.identity.listingProviderKey, candidate.identity.listingProviderKey) || !same(request.identity.listingId, candidate.identity.listingId)) return null;
      return exact("listing.provider_listing.exact", 1, "Provider and listing identifier match exactly.", request, candidate, "attach_existing");
    },
  },
  {
    id: "listing.url.exact",
    version: 1,
    priority: 100,
    subjectTypes: ["listing_source"],
    evaluate: (request, candidate) => {
      if (candidate.subjectType !== "listing_source" || !same(request.identity.sourceUrl, candidate.identity.sourceUrl)) return null;
      return candidateResult("listing.url.exact", 1, 92, "strong", "Normalized listing URL matches an existing source.", [], "attach_existing");
    },
  },
  {
    id: "email.message_id.exact",
    version: 1,
    priority: 110,
    subjectTypes: ["email_source"],
    evaluate: (request, candidate) => {
      if (candidate.subjectType !== "email_source" || !same(request.identity.messageId, candidate.identity.messageId)) return null;
      return exact("email.message_id.exact", 1, "Email Message-ID matches an existing source.", request, candidate, "attach_existing");
    },
  },
  {
    id: "email.body_attachments.exact",
    version: 1,
    priority: 120,
    subjectTypes: ["email_source"],
    evaluate: (request, candidate) => {
      if (candidate.subjectType !== "email_source" || !same(request.identity.bodyHash, candidate.identity.bodyHash)) return null;
      const attachmentMatch = sameHashArrays(request.identity.attachmentHashes, candidate.identity.attachmentHashes);
      return candidateResult(
        "email.body_attachments.exact",
        1,
        attachmentMatch ? 95 : 82,
        attachmentMatch ? "strong" : "possible",
        attachmentMatch ? "Email body and attachment hashes match." : "Email body hash matches, but attachment set needs review.",
        attachmentMatch ? [] : ["Attachment hashes are missing or different."],
        "attach_existing",
      );
    },
  },
  {
    id: "source_record.content_hash.exact",
    version: 1,
    priority: 130,
    subjectTypes: ["source_record"],
    evaluate: (request, candidate) => {
      if (candidate.subjectType !== "source_record" || !same(request.identity.contentHash, candidate.identity.contentHash)) return null;
      return exact("source_record.content_hash.exact", 1, "Source record content hash matches exactly.", request, candidate, "attach_existing");
    },
  },
  {
    id: "source_record.url.exact",
    version: 1,
    priority: 140,
    subjectTypes: ["source_record"],
    evaluate: (request, candidate) => {
      if (candidate.subjectType !== "source_record" || !same(request.identity.sourceUrl, candidate.identity.sourceUrl)) return null;
      return candidateResult("source_record.url.exact", 1, 90, "strong", "Source record URL matches exactly.", [], "attach_existing");
    },
  },
  {
    id: "intake.idempotency.exact",
    version: 1,
    priority: 150,
    subjectTypes: ["intake"],
    evaluate: (request, candidate) => {
      if (candidate.subjectType !== "intake" || !same(request.identity.idempotencyKey, candidate.identity.idempotencyKey)) return null;
      return exact("intake.idempotency.exact", 1, "Intake retry key matches an existing intake.", request, candidate);
    },
  },
  {
    id: "shared_handoff.identity.exact",
    version: 1,
    priority: 160,
    subjectTypes: ["shared_handoff"],
    evaluate: (request, candidate) => {
      if (candidate.subjectType !== "shared_handoff" || !same(request.identity.handoffId, candidate.identity.handoffId)) return null;
      return exact("shared_handoff.identity.exact", 1, "Shared handoff identifier matches.", request, candidate);
    },
  },
  {
    id: "batch_item.same_batch_key",
    version: 1,
    priority: 170,
    subjectTypes: ["batch_item"],
    evaluate: (request, candidate) => {
      if (candidate.subjectType !== "batch_item" || !same(request.identity.batchId, candidate.identity.batchId)) return null;
      if (same(request.identity.normalizedAddress, candidate.identity.normalizedAddress)) {
        return candidateResult("batch_item.same_batch_key", 1, 94, "strong", "Same normalized address appears earlier in this batch.", [], "defer");
      }
      if (same(request.identity.sourceUrl, candidate.identity.sourceUrl)) {
        return candidateResult("batch_item.same_batch_key", 1, 94, "strong", "Same source URL appears earlier in this batch.", [], "defer");
      }
      if (same(request.identity.contentHash, candidate.identity.contentHash)) {
        return candidateResult("batch_item.same_batch_key", 1, 94, "strong", "Same content hash appears earlier in this batch.", [], "defer");
      }
      return null;
    },
  },
];

function exact(ruleId: string, ruleVersion: number, reason: string, request: DuplicateDetectionRequest, candidate: DuplicateCandidateInput, decision: Extract<DuplicateDecisionAction, "reuse_existing" | "attach_existing" | "defer"> = "reuse_existing") {
  return candidateResult(ruleId, ruleVersion, 100, "exact", reason, buildExactConflicts(request, candidate), decision);
}

function candidateResult(
  ruleId: string,
  ruleVersion: number,
  score: number,
  confidence: DuplicateConfidenceBand,
  explanation: string,
  conflicts: string[],
  recommendedDecision: Extract<DuplicateDecisionAction, "reuse_existing" | "attach_existing" | "defer">,
) {
  return {
    ruleId,
    ruleVersion,
    score,
    confidence,
    explanation: [explanation],
    conflicts,
    recommendedDecision,
  };
}

function buildExactConflicts(request: DuplicateDetectionRequest, candidate: DuplicateCandidateInput) {
  const conflicts: string[] = [];
  if (request.identity.normalizedAddress && candidate.identity.normalizedAddress && request.identity.normalizedAddress !== candidate.identity.normalizedAddress) conflicts.push("Address differs.");
  if ((request.identity.unitNumber ?? "") !== (candidate.identity.unitNumber ?? "")) conflicts.push("Unit number differs.");
  if (request.identity.propertyId && candidate.identity.propertyId && request.identity.propertyId !== candidate.identity.propertyId) conflicts.push("Property identifier differs.");
  return conflicts;
}

function dedupeResults(results: DuplicateCandidateResult[]) {
  const byKey = new Map<string, DuplicateCandidateResult>();
  for (const result of results) {
    const key = `${result.subjectType}:${result.candidateCanonicalId ?? result.candidateKey}`;
    const existing = byKey.get(key);
    if (!existing || result.score > existing.score || (result.score === existing.score && result.ruleId.localeCompare(existing.ruleId) < 0)) {
      byKey.set(key, result);
    }
  }
  return [...byKey.values()];
}

function normalizeAddress(value?: string) {
  return clean(value)?.toLowerCase().replace(/\b(street)\b/g, "st").replace(/\b(avenue)\b/g, "ave").replace(/\b(road)\b/g, "rd").replace(/\b(lane)\b/g, "ln").replace(/\b(court)\b/g, "ct").replace(/[^a-z0-9# ]+/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeUnit(value?: string) {
  return clean(value)?.toLowerCase().replace(/^(unit|apt|apartment|suite|ste)\s+/i, "").replace(/[^a-z0-9]+/g, "").trim();
}

function normalizeKey(value?: string) {
  return clean(value)?.toLowerCase().replace(/[^a-z0-9:_-]+/g, "_").replace(/^_+|_+$/g, "");
}

function normalizeSourceUrl(value?: string) {
  const cleaned = clean(value);
  if (!cleaned) return undefined;
  try {
    const url = new URL(cleaned);
    url.hash = "";
    const params = [...url.searchParams.entries()]
      .filter(([key]) => !/^utm_|^(fbclid|gclid)$/i.test(key))
      .sort(([a], [b]) => a.localeCompare(b));
    url.search = "";
    params.forEach(([key, paramValue]) => url.searchParams.set(key, paramValue));
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return cleaned.toLowerCase().replace(/\s+/g, "");
  }
}

function normalizeMessageId(value?: string) {
  return clean(value)?.replace(/^<|>$/g, "").toLowerCase();
}

function normalizeHash(value?: string) {
  const cleaned = clean(value)?.toLowerCase();
  return cleaned && /^[a-f0-9]{8,64}$/.test(cleaned) ? cleaned : undefined;
}

function normalizeHashArray(value?: readonly string[]) {
  const hashes = [...new Set((value ?? []).map(normalizeHash).filter((hash): hash is string => Boolean(hash)))].sort();
  return hashes.length ? hashes : undefined;
}

function sameHashArrays(left?: readonly string[], right?: readonly string[]) {
  const a = normalizeHashArray(left);
  const b = normalizeHashArray(right);
  if (!a?.length || !b?.length || a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function same(left?: string, right?: string) {
  return Boolean(left && right && left === right);
}

function finiteNumber(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function clampInteger(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function clean(value?: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>).filter(([, entry]) => entry !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`).join(",")}}`;
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
