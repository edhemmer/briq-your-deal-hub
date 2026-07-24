import { normalizeStrategy } from "./strategyCatalog";
import { supabase } from "./supabase";
import type {
  CanonicalDealOperatingStatus,
  CanonicalDealStage,
  DealCoreUpdate,
  DealDetailProjection,
  DealFacts,
  DealLifecycleUpdate,
  DealListProjection,
  DealPriority,
  PropertySummary,
  PropertyUpdate,
  VerificationState,
} from "./types";

type UnknownRecord = Record<string, unknown>;

export type ProjectionPage = {
  deals: DealListProjection[];
  totalCount: number;
};

export async function listDealProjections(workspaceId: string, pageSize = 50, pageOffset = 0): Promise<ProjectionPage> {
  const { data, error } = await supabase.rpc("list_deal_projection", {
    target_workspace_id: workspaceId,
    page_size: pageSize,
    page_offset: pageOffset,
    sort_direction: "desc",
  });
  if (error) throw error;
  const deals = Array.isArray(data) ? data.map(normalizeDealListProjection).filter(isDealListProjection) : [];
  return { deals, totalCount: deals[0]?.totalCount ?? 0 };
}

export async function loadDealDetail(dealId: string): Promise<DealDetailProjection> {
  const { data, error } = await supabase.rpc("load_deal_detail_projection", { target_deal_id: dealId });
  if (error) throw error;
  const detail = normalizeDealDetail(Array.isArray(data) ? data[0] : data);
  if (!detail) throw new Error("BRIX could not load a usable Deal detail.");
  return detail;
}

export async function loadActiveDealShellProjection(dealId: string): Promise<DealDetailProjection> {
  const { data, error } = await supabase.rpc("load_active_deal_shell_projection", { target_deal_id: dealId });
  if (error) throw error;
  const detail = normalizeDealDetail(Array.isArray(data) ? data[0] : data);
  if (!detail) throw new Error("BRIX could not load a usable active Deal shell.");
  return detail;
}

export async function loadPropertySummary(propertyId: string): Promise<PropertySummary> {
  const { data, error } = await supabase.rpc("load_property_summary", { target_property_id: propertyId });
  if (error) throw error;
  const summary = normalizePropertySummary(Array.isArray(data) ? data[0] : data);
  if (!summary) throw new Error("BRIX could not load a usable Property summary.");
  return summary;
}

export async function updateDealCore(deal: DealFacts, update: DealCoreUpdate): Promise<DealDetailProjection> {
  if (!deal.dealVersion) throw new Error("Reload this Deal before saving.");
  const { error } = await supabase.rpc("update_canonical_deal", {
    target_deal_id: deal.id,
    expected_version: deal.dealVersion,
    idempotency_key: `deal:update:${deal.id}:${crypto.randomUUID()}`,
    deal_input: dealCoreInput(update),
  });
  if (error) throw error;
  return loadDealDetail(deal.id);
}

export async function updateProperty(property: PropertySummary, update: PropertyUpdate): Promise<PropertySummary> {
  const { data, error } = await supabase.rpc("update_canonical_property", {
    target_property_id: property.propertyId,
    expected_version: property.propertyVersion,
    idempotency_key: `property:update:${property.propertyId}:${crypto.randomUUID()}`,
    property_input: propertyInput(update),
  });
  if (error) throw error;
  const summary = normalizePropertySummary(Array.isArray(data) ? data[0] : data);
  if (!summary) throw new Error("BRIX could not load the saved Property.");
  return summary;
}

export async function updateDealLifecycle(deal: DealFacts, update: DealLifecycleUpdate): Promise<DealDetailProjection> {
  if (!deal.dealVersion) throw new Error("Reload this Deal before saving.");
  const { error } = await supabase.rpc("update_deal_lifecycle", {
    target_deal_id: deal.id,
    expected_version: deal.dealVersion,
    idempotency_key: `deal:lifecycle:${deal.id}:${crypto.randomUUID()}`,
    lifecycle_input: {
      stage: update.stage ?? null,
      operating_status: update.operatingStatus ?? null,
      reason: update.reason ?? "user_update",
    },
  });
  if (error) throw error;
  return loadDealDetail(deal.id);
}

export function projectionToDealFacts(projection: DealListProjection): DealFacts {
  const now = projection.updatedAt;
  return {
    id: projection.dealId,
    dealVersion: projection.dealVersion,
    propertyId: projection.primaryPropertyId,
    propertyVersion: projection.primaryPropertyVersion,
    createdAt: now,
    updatedAt: now,
    status: legacyStatusForOperatingStatus(projection.status),
    address: projection.primaryPropertyAddress ?? projection.displayName,
    strategyId: normalizeStrategy(projection.strategyIntent ?? "owner_occupant"),
    notes: [],
    photoUrls: [],
    uploadedPhotoNames: [],
    verification: {},
  };
}

function dealCoreInput(update: DealCoreUpdate) {
  return {
    display_name: update.displayName ?? update.facts?.address ?? null,
    deal_type: update.dealType ?? null,
    priority: update.priority ?? null,
    source: update.source ?? null,
    strategy_intent: update.strategyIntent ?? update.strategyId ?? null,
    source_url: update.sourceUrl ?? update.facts?.sourceUrl ?? null,
    source_text: update.sourceText ?? update.facts?.sourceText ?? null,
    strategy_id: update.strategyId ?? update.facts?.strategyId ?? null,
    facts: update.facts ?? null,
    verification: update.verification ?? update.facts?.verification ?? null,
  };
}

function propertyInput(update: PropertyUpdate) {
  return {
    display_address: update.displayAddress ?? null,
    address_line1: update.addressLine1 ?? null,
    address_line2: update.addressLine2 ?? null,
    city: update.city ?? null,
    region: update.region ?? null,
    postal_code: update.postalCode ?? null,
    country: update.country ?? null,
    parcel_identifier: update.parcelIdentifier ?? null,
  };
}

function normalizeDealListProjection(value: unknown): DealListProjection | null {
  if (!isRecord(value)) return null;
  const dealId = stringValue(value.deal_id);
  const workspaceId = stringValue(value.workspace_id);
  const displayName = stringValue(value.display_name);
  const stage = dealStage(value.stage);
  const status = operatingStatus(value.status);
  const priority = dealPriority(value.priority);
  const source = stringValue(value.source);
  const updatedAt = stringValue(value.updated_at);
  if (!dealId || !workspaceId || !displayName || !stage || !status || !priority || !source || !updatedAt) return null;
  return {
    dealId,
    dealVersion: numberValue(value.deal_version) ?? 1,
    workspaceId,
    displayName,
    primaryPropertyId: stringValue(value.primary_property_id),
    primaryPropertyVersion: numberValue(value.primary_property_version),
    primaryPropertyAddress: stringValue(value.primary_property_address),
    stage,
    status,
    priority,
    source,
    strategyIntent: stringValue(value.strategy_intent),
    updatedAt,
    openWorkCount: numberValue(value.open_work_count) ?? 0,
    relationshipCount: numberValue(value.relationship_count) ?? 0,
    nextDueAt: stringValue(value.next_due_at),
    totalCount: numberValue(value.total_count) ?? 0,
  };
}

function normalizeDealDetail(value: unknown): DealDetailProjection | null {
  if (!isRecord(value)) return null;
  const dealId = stringValue(value.deal_id);
  const workspaceId = stringValue(value.workspace_id);
  const displayName = stringValue(value.display_name);
  const stage = dealStage(value.stage);
  const operating = operatingStatus(value.status);
  const priority = dealPriority(value.priority);
  const source = stringValue(value.source);
  const updatedAt = stringValue(value.deal_updated_at);
  const loadedAt = stringValue(value.loaded_at);
  if (!dealId || !workspaceId || !displayName || !stage || !operating || !priority || !source || !updatedAt || !loadedAt) return null;

  const facts = normalizeFacts(value.facts);
  const property = normalizePropertySummary({
    property_id: value.primary_property_id,
    property_version: value.primary_property_version,
    workspace_id: workspaceId,
    display_address: value.primary_property_address,
    address_line1: value.primary_property_address_line1,
    address_line2: value.primary_property_address_line2,
    city: value.primary_property_city,
    region: value.primary_property_region,
    postal_code: value.primary_property_postal_code,
    country: value.primary_property_country,
    parcel_identifier: value.primary_property_parcel_identifier,
    updated_at: value.property_updated_at,
  });

  const deal: DealFacts = {
    ...facts,
    id: dealId,
    dealVersion: numberValue(value.deal_version) ?? 1,
    propertyId: property?.propertyId,
    propertyVersion: property?.propertyVersion,
    createdAt: facts.createdAt ?? updatedAt,
    updatedAt,
    status: facts.status ?? legacyStatusForOperatingStatus(operating),
    sourceUrl: stringValue(value.source_url) ?? facts.sourceUrl,
    sourceText: stringValue(value.source_text) ?? facts.sourceText,
    address: property?.displayAddress ?? facts.address ?? displayName,
    city: property?.city ?? facts.city,
    state: property?.region ?? facts.state,
    zip: property?.postalCode ?? facts.zip,
    strategyId: normalizeStrategy(stringValue(value.strategy_id) ?? stringValue(value.strategy_intent) ?? facts.strategyId ?? "owner_occupant"),
    notes: facts.notes ?? [],
    photoUrls: facts.photoUrls ?? [],
    uploadedPhotoNames: facts.uploadedPhotoNames ?? [],
    verification: verificationRecord(value.verification) ?? facts.verification ?? {},
  };

  return {
    deal,
    workspaceId,
    displayName,
    dealType: stringValue(value.deal_type) ?? "acquisition",
    stage,
    operatingStatus: operating,
    priority,
    source,
    strategyIntent: stringValue(value.strategy_intent),
    property,
    relationshipCount: numberValue(value.relationship_count) ?? 0,
    openTaskCount: numberValue(value.open_task_count) ?? 0,
    openDeadlineCount: numberValue(value.open_deadline_count) ?? 0,
    pinnedNoteCount: numberValue(value.pinned_note_count) ?? 0,
    recentEventCount: numberValue(value.recent_event_count) ?? 0,
    loadedAt,
  };
}

function normalizePropertySummary(value: unknown): PropertySummary | null {
  if (!isRecord(value)) return null;
  const propertyId = stringValue(value.property_id);
  const workspaceId = stringValue(value.workspace_id);
  const displayAddress = stringValue(value.display_address);
  const country = stringValue(value.country) ?? "US";
  const updatedAt = stringValue(value.updated_at);
  if (!propertyId || !workspaceId || !displayAddress || !updatedAt) return null;
  return {
    propertyId,
    propertyVersion: numberValue(value.property_version) ?? 1,
    workspaceId,
    displayAddress,
    addressLine1: stringValue(value.address_line1),
    addressLine2: stringValue(value.address_line2),
    city: stringValue(value.city),
    region: stringValue(value.region),
    postalCode: stringValue(value.postal_code),
    country,
    parcelIdentifier: stringValue(value.parcel_identifier),
    activeDealCount: numberValue(value.active_deal_count),
    updatedAt,
  };
}

function normalizeFacts(value: unknown): Partial<DealFacts> {
  return isRecord(value) ? value as Partial<DealFacts> : {};
}

function verificationRecord(value: unknown): Record<string, VerificationState> | undefined {
  if (!isRecord(value)) return undefined;
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, VerificationState] => (
    entry[1] === "entered" || entry[1] === "source_backed" || entry[1] === "estimated" || entry[1] === "missing"
  )));
}

function legacyStatusForOperatingStatus(status: CanonicalDealOperatingStatus): DealFacts["status"] {
  if (status === "passed") return "passed";
  if (status === "closed_won") return "closed";
  if (status === "closed_lost") return "passed";
  return "reviewing";
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function dealPriority(value: unknown): DealPriority | undefined {
  return value === "low" || value === "normal" || value === "high" || value === "urgent" ? value : undefined;
}

function operatingStatus(value: unknown): CanonicalDealOperatingStatus | undefined {
  return (
    value === "active" ||
    value === "needs_attention" ||
    value === "waiting" ||
    value === "blocked" ||
    value === "on_hold" ||
    value === "passed" ||
    value === "closed_won" ||
    value === "closed_lost" ||
    value === "archived" ||
    value === "deleted_pending"
  ) ? value : undefined;
}

function dealStage(value: unknown): CanonicalDealStage | undefined {
  return (
    value === "lead" ||
    value === "screening" ||
    value === "research" ||
    value === "visit_planned" ||
    value === "visited" ||
    value === "underwriting" ||
    value === "negotiation" ||
    value === "offer_preparation" ||
    value === "offer_submitted" ||
    value === "under_contract" ||
    value === "due_diligence" ||
    value === "financing" ||
    value === "closing" ||
    value === "owned" ||
    value === "stabilizing" ||
    value === "operating" ||
    value === "refinancing" ||
    value === "disposition" ||
    value === "sold" ||
    value === "passed" ||
    value === "archived"
  ) ? value : undefined;
}

function isDealListProjection(value: DealListProjection | null): value is DealListProjection {
  return value !== null;
}
