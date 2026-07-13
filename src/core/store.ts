import { createBlankDeal, parseListingInput } from "./listingParser";
import { getStrategy, normalizeStrategy, type StrategyId } from "./strategyCatalog";
import type { DealFacts } from "./types";
import { supabase } from "./supabase";

const KEY = "brix.deals";

export function loadDeals(): DealFacts[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]") as DealFacts[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDeals(deals: DealFacts[]) {
  localStorage.setItem(KEY, JSON.stringify(deals));
}

export function createDealFromInput(input: string, strategyId: StrategyId) {
  const deal = parseListingInput(input, strategyId);
  if (!deal.address) deal.address = input.trim();
  return deal;
}

export function createManualDeal(strategyId: StrategyId) {
  return createBlankDeal(strategyId);
}

export async function loadRemoteDeals(): Promise<DealFacts[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data, error } = await supabase
    .from("brix_deals")
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  if (!data) return [];
  return data.map(normalizeDealRow);
}

export async function persistRemoteDeal(deal: DealFacts) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Sign in before saving deal files.");
  const { error } = await supabase.from("brix_deals").upsert({
    id: deal.id,
    owner_id: userData.user.id,
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
  });
  if (error) throw error;
}

export async function softDeleteRemoteDeal(id: string) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Sign in before deleting deal files.");
  const { error } = await supabase.from("brix_deals").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export function normalizeDealRow(row: any): DealFacts {
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
