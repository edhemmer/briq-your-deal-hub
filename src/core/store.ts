import { createBlankDeal, parseListingInput } from "./listingParser";
import { listDealProjections, projectionToDealFacts, updateDealCore } from "./dealCrud";
import { getStrategy, normalizeStrategy, type StrategyId } from "./strategyCatalog";
import type { DealFacts, DealStatus, VerificationState } from "./types";
import { supabase } from "./supabase";

export const ANONYMOUS_DEALS_KEY = "brix.deals";
// Anonymous draft migration is intentionally deferred to the next contained task.

type UnknownRecord = Record<string, unknown>;

const dealStatuses: DealStatus[] = ["draft", "reviewing", "underwriting", "pursuing", "under_contract", "closed", "passed"];
const verificationStates: VerificationState[] = ["entered", "source_backed", "estimated", "missing"];
const numberFields = [
  "listPrice",
  "beds",
  "baths",
  "squareFeet",
  "yearBuilt",
  "hoaMonthly",
  "annualTaxes",
  "annualInsurance",
  "monthlyRent",
  "arv",
  "rehabBudget",
  "downPayment",
  "interestRate",
  "loanYears",
] as const satisfies ReadonlyArray<keyof DealFacts>;
const stringFields = ["sourceUrl", "sourceText", "city", "state", "zip", "county", "lotSize", "propertyType"] as const satisfies ReadonlyArray<keyof DealFacts>;

export type DealPersistenceRepository = {
  list: () => Promise<DealFacts[]> | DealFacts[];
  create: (deal: DealFacts) => Promise<DealFacts> | DealFacts;
  update: (deal: DealFacts) => Promise<DealFacts> | DealFacts;
  softDelete: (id: string) => Promise<void> | void;
};

export function loadAnonymousDeals(): DealFacts[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(ANONYMOUS_DEALS_KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeDealRecord).filter(isDealFacts);
  } catch {
    return [];
  }
}

export function saveAnonymousDeals(deals: DealFacts[]) {
  localStorage.setItem(ANONYMOUS_DEALS_KEY, JSON.stringify(deals.map(normalizeDealRecord).filter(isDealFacts)));
}

export function createDealFromInput(input: string, strategyId: StrategyId) {
  const deal = parseListingInput(input, strategyId);
  if (!deal.address) deal.address = input.trim();
  return deal;
}

export function createManualDeal(strategyId: StrategyId) {
  return createBlankDeal(strategyId);
}

export const anonymousDealRepository: DealPersistenceRepository = {
  list: loadAnonymousDeals,
  create(deal) {
    const saved = saveAnonymousDeal(deal);
    return saved;
  },
  update(deal) {
    const saved = saveAnonymousDeal(deal);
    return saved;
  },
  softDelete(id) {
    saveAnonymousDeals(loadAnonymousDeals().filter((deal) => deal.id !== id));
  },
};

export function cloudDealRepository(userId: string, workspaceId?: string): DealPersistenceRepository {
  return {
    list: () => loadRemoteDeals(userId, workspaceId),
    create: (deal) => persistRemoteDeal(deal, userId),
    update: (deal) => persistRemoteDeal(deal, userId),
    softDelete: (id) => softDeleteRemoteDeal(id, userId),
  };
}

function saveAnonymousDeal(deal: DealFacts) {
  const normalized = normalizeDealRecord(deal);
  if (!normalized) throw new Error("Deal record is missing a usable ID.");
  const current = loadAnonymousDeals();
  saveAnonymousDeals([normalized, ...current.filter((item) => item.id !== normalized.id)]);
  return normalized;
}

async function requireAuthenticatedUser(expectedUserId?: string) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Sign in before using cloud deal files.");
  if (expectedUserId && user.id !== expectedUserId) throw new Error("Session changed before BRIX could finish the request.");
  return user;
}

export async function loadRemoteDeals(userId: string, workspaceId?: string): Promise<DealFacts[]> {
  await requireAuthenticatedUser(userId);
  if (!workspaceId) throw new Error("BRIX workspace is not ready.");
  const { deals } = await listDealProjections(workspaceId, 50, 0);
  return deals.map(projectionToDealFacts);
}

export async function persistRemoteDeal(deal: DealFacts, userId: string): Promise<DealFacts> {
  await requireAuthenticatedUser(userId);
  const now = new Date().toISOString();
  const canonicalDeal = normalizeDealRecord({ ...deal, updatedAt: now });
  if (!canonicalDeal) throw new Error("Deal record is missing a usable ID.");
  const saved = await updateDealCore(canonicalDeal, {
    displayName: canonicalDeal.address,
    sourceUrl: canonicalDeal.sourceUrl,
    sourceText: canonicalDeal.sourceText,
    strategyId: canonicalDeal.strategyId,
    strategyIntent: canonicalDeal.strategyId,
    facts: canonicalDeal,
    verification: canonicalDeal.verification,
  });
  return saved.deal;
}

type CanonicalDealCreateResult = {
  property_id: string;
  property_version: number;
  deal_id: string;
  deal_version: number;
  deal_property_id: string;
  deal_property_version: number;
  stage: string;
  status: string;
  idempotency_key_out: string;
};

export async function createRemoteDeal(deal: DealFacts, userId: string, workspaceId: string): Promise<DealFacts> {
  await requireAuthenticatedUser(userId);
  const canonicalDeal = normalizeDealRecord(deal);
  if (!canonicalDeal) throw new Error("Deal record is missing a usable ID.");
  const idempotencyKey = `deal:create:${canonicalDeal.id}`;
  const { data, error } = await supabase.rpc("create_canonical_deal", {
    target_workspace_id: workspaceId,
    idempotency_key: idempotencyKey,
    property_input: {
      display_address: canonicalDeal.address,
      address_line1: canonicalDeal.address,
      city: canonicalDeal.city ?? null,
      region: canonicalDeal.state ?? null,
      postal_code: canonicalDeal.zip ?? null,
      country: "US",
      source_identifiers: canonicalDeal.sourceUrl ? { listing_url: canonicalDeal.sourceUrl } : {},
    },
    deal_input: {
      id: canonicalDeal.id,
      display_name: canonicalDeal.address,
      deal_type: "acquisition",
      source: canonicalDeal.sourceUrl ? "listing_url" : "manual",
      source_url: canonicalDeal.sourceUrl ?? null,
      source_text: canonicalDeal.sourceText ?? null,
      address: canonicalDeal.address,
      city: canonicalDeal.city ?? null,
      state: canonicalDeal.state ?? null,
      zip: canonicalDeal.zip ?? null,
      county: canonicalDeal.county ?? null,
      strategy_id: canonicalDeal.strategyId,
      strategy_intent: canonicalDeal.strategyId,
      facts: canonicalDeal,
      verification: canonicalDeal.verification,
    },
    existing_property_id: null,
  });
  if (error) throw error;

  const row = normalizeCanonicalDealCreateResult(data);
  if (!row) throw new Error("BRIX cloud did not return a usable Deal creation result.");
  return normalizeDealRecord({
    ...canonicalDeal,
    id: row.deal_id,
    dealVersion: row.deal_version,
    propertyId: row.property_id,
    propertyVersion: row.property_version,
    updatedAt: new Date().toISOString(),
  }) as DealFacts;
}

export async function softDeleteRemoteDeal(id: string, userId: string) {
  await requireAuthenticatedUser(userId);
  const { error } = await supabase
    .from("brix_deals")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", userId)
    .select("id")
    .single();
  if (error) throw error;
}

export function normalizeDealRow(row: unknown): DealFacts | null {
  if (!isRecord(row)) return null;
  const facts = isRecord(row.facts) ? row.facts : {};
  const merged = {
    ...facts,
    id: row.id ?? facts.id,
    dealVersion: row.version ?? facts.dealVersion,
    status: row.status ?? facts.status,
    sourceUrl: row.source_url ?? facts.sourceUrl,
    sourceText: row.source_text ?? facts.sourceText,
    address: row.address ?? facts.address,
    city: row.city ?? facts.city,
    state: row.state ?? facts.state,
    zip: row.zip ?? facts.zip,
    county: row.county ?? facts.county,
    strategyId: row.strategy_id ?? facts.strategyId,
    verification: row.verification ?? facts.verification,
    createdAt: row.created_at ?? facts.createdAt,
    updatedAt: row.updated_at ?? facts.updatedAt,
  };
  return normalizeDealRecord(merged);
}

export function normalizeDealRecord(value: unknown): DealFacts | null {
  if (!isRecord(value)) return null;
  const id = optionalString(value.id);
  if (!id) return null;
  const createdAt = optionalString(value.createdAt) ?? new Date().toISOString();
  const updatedAt = optionalString(value.updatedAt) ?? createdAt;
  const strategyId = getStrategy(optionalString(value.strategyId))?.id ?? normalizeStrategy("owner_occupant");
  const deal: DealFacts = {
    id,
    dealVersion: optionalNumber(value.dealVersion),
    propertyId: optionalString(value.propertyId),
    propertyVersion: optionalNumber(value.propertyVersion),
    createdAt,
    updatedAt,
    status: dealStatuses.includes(value.status as DealStatus) ? value.status as DealStatus : "draft",
    address: optionalString(value.address) ?? "",
    strategyId,
    notes: stringArray(value.notes),
    photoUrls: stringArray(value.photoUrls),
    uploadedPhotoNames: stringArray(value.uploadedPhotoNames),
    verification: verificationRecord(value.verification),
  };

  for (const field of stringFields) {
    const stringValue = optionalString(value[field]);
    if (stringValue !== undefined) Object.assign(deal, { [field]: stringValue });
  }

  for (const field of numberFields) {
    const numberValue = optionalNumber(value[field]);
    if (numberValue !== undefined) Object.assign(deal, { [field]: numberValue });
  }

  return deal;
}

function isDealFacts(value: DealFacts | null): value is DealFacts {
  return value !== null;
}

function normalizeCanonicalDealCreateResult(value: unknown): CanonicalDealCreateResult | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (!isRecord(row)) return null;
  if (
    typeof row.property_id !== "string" ||
    typeof row.deal_id !== "string" ||
    typeof row.deal_property_id !== "string" ||
    typeof row.stage !== "string" ||
    typeof row.status !== "string" ||
    typeof row.idempotency_key_out !== "string"
  ) {
    return null;
  }

  return {
    property_id: row.property_id,
    property_version: optionalNumber(row.property_version) ?? 1,
    deal_id: row.deal_id,
    deal_version: optionalNumber(row.deal_version) ?? 1,
    deal_property_id: row.deal_property_id,
    deal_property_version: optionalNumber(row.deal_property_version) ?? 1,
    stage: row.stage,
    status: row.status,
    idempotency_key_out: row.idempotency_key_out,
  };
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function optionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function verificationRecord(value: unknown) {
  if (!isRecord(value)) return {};
  const entries = Object.entries(value).filter((entry): entry is [string, VerificationState] => verificationStates.includes(entry[1] as VerificationState));
  return Object.fromEntries(entries);
}
