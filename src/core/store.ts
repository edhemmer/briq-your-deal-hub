import { createBlankDeal, parseListingInput } from "./listingParser";
import type { StrategyId } from "./strategyCatalog";
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
  if (error || !data) return [];
  return data.map(fromRow);
}

export async function persistRemoteDeal(deal: DealFacts) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  await supabase.from("brix_deals").upsert({
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
}

export async function softDeleteRemoteDeal(id: string) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  await supabase.from("brix_deals").update({ deleted_at: new Date().toISOString() }).eq("id", id);
}

function fromRow(row: any): DealFacts {
  const facts = row.facts ?? {};
  return {
    ...facts,
    id: row.id,
    status: row.status,
    sourceUrl: row.source_url ?? facts.sourceUrl,
    sourceText: row.source_text ?? facts.sourceText,
    address: row.address ?? facts.address ?? "",
    city: row.city ?? facts.city,
    state: row.state ?? facts.state,
    zip: row.zip ?? facts.zip,
    county: row.county ?? facts.county,
    strategyId: row.strategy_id ?? facts.strategyId ?? "owner_occupant",
    verification: row.verification ?? facts.verification ?? {},
    createdAt: row.created_at ?? facts.createdAt,
    updatedAt: row.updated_at ?? facts.updatedAt,
    notes: facts.notes ?? [],
    photoUrls: facts.photoUrls ?? [],
    uploadedPhotoNames: facts.uploadedPhotoNames ?? [],
  };
}
