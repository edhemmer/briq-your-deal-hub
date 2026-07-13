import { createBlankDeal, parseListingInput } from "./listingParser";
import { getStrategy, normalizeStrategy, type StrategyId } from "./strategyCatalog";
import type { DealFacts } from "./types";
import { supabase } from "./supabase";

export const ANONYMOUS_DEALS_KEY = "brix.deals";
// Anonymous draft migration is intentionally deferred to the next contained task.

type BrixDealRow = {
  id: string;
  owner_id?: string;
  status?: DealFacts["status"];
  source_url?: string | null;
  source_text?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  county?: string | null;
  strategy_id?: string | null;
  facts?: (Partial<Omit<DealFacts, "strategyId">> & { strategyId?: string }) | null;
  verification?: DealFacts["verification"] | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export function loadAnonymousDeals(): DealFacts[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(ANONYMOUS_DEALS_KEY) ?? "[]") as DealFacts[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAnonymousDeals(deals: DealFacts[]) {
  localStorage.setItem(ANONYMOUS_DEALS_KEY, JSON.stringify(deals));
}

export function createDealFromInput(input: string, strategyId: StrategyId) {
  const deal = parseListingInput(input, strategyId);
  if (!deal.address) deal.address = input.trim();
  return deal;
}

export function createManualDeal(strategyId: StrategyId) {
  return createBlankDeal(strategyId);
}

async function requireAuthenticatedUser(expectedUserId?: string) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Sign in before using cloud deal files.");
  if (expectedUserId && user.id !== expectedUserId) throw new Error("Session changed before BRIX could finish the request.");
  return user;
}

export async function loadRemoteDeals(userId: string): Promise<DealFacts[]> {
  await requireAuthenticatedUser(userId);
  const { data, error } = await supabase
    .from("brix_deals")
    .select("*")
    .eq("owner_id", userId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  if (!data) return [];
  return (data as BrixDealRow[]).map(normalizeDealRow);
}

export async function persistRemoteDeal(deal: DealFacts, userId: string): Promise<DealFacts> {
  await requireAuthenticatedUser(userId);
  const { data, error } = await supabase.from("brix_deals").upsert({
    id: deal.id,
    owner_id: userId,
    status: deal.status,
    source_url: deal.sourceUrl || null,
    source_text: deal.sourceText || null,
    address: deal.address,
    city: deal.city || null,
    state: deal.state || null,
    zip: deal.zip || null,
    county: deal.county || null,
    strategy_id: deal.strategyId,
    facts: deal,
    verification: deal.verification,
    updated_at: new Date().toISOString(),
  }).select("*").single();
  if (error) throw error;
  if (!data) throw new Error("Supabase did not return the saved deal.");
  return normalizeDealRow(data as BrixDealRow);
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

export function normalizeDealRow(row: BrixDealRow): DealFacts {
  const facts = row.facts ?? {};
  const createdAt = row.created_at ?? facts.createdAt ?? new Date().toISOString();
  const updatedAt = row.updated_at ?? facts.updatedAt ?? createdAt;
  const strategyId = getStrategy(row.strategy_id ?? facts.strategyId)?.id ?? normalizeStrategy("owner_occupant");
  return {
    ...facts,
    id: row.id ?? facts.id,
    status: row.status ?? facts.status ?? "draft",
    sourceUrl: row.source_url ?? facts.sourceUrl,
    sourceText: row.source_text ?? facts.sourceText,
    address: row.address ?? facts.address ?? "",
    city: row.city ?? facts.city,
    state: row.state ?? facts.state,
    zip: row.zip ?? facts.zip,
    county: row.county ?? facts.county,
    strategyId,
    verification: row.verification ?? facts.verification ?? {},
    createdAt,
    updatedAt,
    notes: facts.notes ?? [],
    photoUrls: facts.photoUrls ?? [],
    uploadedPhotoNames: facts.uploadedPhotoNames ?? [],
  };
}
