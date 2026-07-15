import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

loadDotEnv();

const supabaseUrl = env("SUPABASE_URL") ?? env("VITE_SUPABASE_URL");
const supabaseAnonKey = env("SUPABASE_PUBLISHABLE_KEY") ?? env("VITE_SUPABASE_PUBLISHABLE_KEY");
const testEmail = env("BRIX_LIVE_TEST_EMAIL");
const testPassword = env("BRIX_LIVE_TEST_PASSWORD");

assert(supabaseUrl, "Missing SUPABASE_URL or VITE_SUPABASE_URL.");
assert(supabaseAnonKey, "Missing SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_PUBLISHABLE_KEY.");
assert(testEmail, "Missing BRIX_LIVE_TEST_EMAIL.");
assert(testPassword, "Missing BRIX_LIVE_TEST_PASSWORD.");

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const dealId = randomUUID();
const initialCreatedAt = new Date().toISOString();
let createdRecord = false;

try {
  step("Signing in test account");
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });
  if (signInError) throw signInError;
  const user = signInData.user;
  assert(user?.id, "Authenticated session did not return a user ID.");
  pass(`Authenticated user ${user.id}`);

  const address = `BRIX LIVE CRUD TEST - ${timestamp}`;
  const initialDeal = {
    id: dealId,
    createdAt: initialCreatedAt,
    updatedAt: initialCreatedAt,
    status: "draft",
    sourceUrl: "https://example.com/brix-live-crud-test",
    sourceText: "Live authenticated CRUD proof record.",
    address,
    city: "Initial City",
    state: "IL",
    zip: "60540",
    county: "Will",
    propertyType: "Single family",
    listPrice: 123456,
    annualTaxes: 7890,
    annualInsurance: 1200,
    monthlyRent: 2500,
    strategyId: "owner_occupant",
    notes: ["Initial note"],
    photoUrls: [],
    uploadedPhotoNames: [],
    verification: { address: "entered", listPrice: "entered" },
  };

  step("Creating live test deal through brix_deals upsert");
  const created = await upsertDeal(user.id, initialDeal);
  createdRecord = true;
  assertEqual(created.id, dealId, "Created deal ID should match.");
  assert(created.created_at, "Created row must include created_at.");
  assert(created.updated_at, "Created row must include updated_at.");
  pass(`Created ${dealId}`);

  step("Reloading active deal list and reopening created deal");
  const firstReload = await activeDeals(user.id);
  const reopened = firstReload.find((row) => row.id === dealId);
  assert(reopened, "Created deal was not found in active deal list.");
  assertEqual(reopened.id, dealId, "Reopened deal ID should match.");
  pass("Created deal reopened from active list");

  const editedUpdatedAt = new Date(Date.now() + 1000).toISOString();
  const editedDeal = {
    ...initialDeal,
    updatedAt: editedUpdatedAt,
    city: "Edited City",
    listPrice: 234567,
    annualTaxes: 0,
    notes: [...initialDeal.notes, "Edited note"],
  };

  step("Editing text, non-zero numeric, and intentional zero numeric fields");
  const edited = await upsertDeal(user.id, editedDeal);
  assertEqual(edited.id, dealId, "Edited deal ID should remain stable.");
  assertEqual(edited.created_at, created.created_at, "created_at should remain stable after edit.");
  assert(edited.updated_at !== created.updated_at, "updated_at should change after edit.");
  assertEqual(edited.city, "Edited City", "Edited text field should persist.");
  assertEqual(edited.facts.listPrice, 234567, "Edited non-zero numeric field should persist.");
  assertEqual(edited.facts.annualTaxes, 0, "Intentional zero numeric field should persist.");
  assertEqual(edited.address, initialDeal.address, "Unrelated address should remain intact.");
  assertEqual(edited.source_url, initialDeal.sourceUrl, "Unrelated source URL should remain intact.");
  pass("Edit persisted with stable identity and timestamps");

  step("Reloading active deal list after edit");
  const secondReload = await activeDeals(user.id);
  const reopenedEdited = secondReload.find((row) => row.id === dealId);
  assert(reopenedEdited, "Edited deal was not found in active deal list.");
  assertEqual(reopenedEdited.facts.listPrice, 234567, "Reloaded edit should preserve non-zero numeric field.");
  assertEqual(reopenedEdited.facts.annualTaxes, 0, "Reloaded edit should preserve intentional zero.");
  assertEqual(reopenedEdited.city, "Edited City", "Reloaded edit should preserve text field.");
  pass("Edited values survived reload");

  step("Soft deleting live test deal");
  await softDelete(user.id, dealId);
  pass("Soft delete returned successfully");

  step("Confirming soft-deleted deal is absent from active list");
  const afterDelete = await activeDeals(user.id);
  assert(!afterDelete.some((row) => row.id === dealId), "Soft-deleted deal still appeared in active list.");
  pass("Soft-deleted deal excluded from active list");

  await supabase.auth.signOut();
  console.log("LIVE CRUD PROOF PASSED");
} catch (error) {
  console.error("LIVE CRUD PROOF FAILED");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  if (createdRecord) {
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user?.id) await softDelete(data.user.id, dealId);
      console.log(`Cleanup confirmed for ${dealId}`);
    } catch (cleanupError) {
      console.error(`Cleanup failed for ${dealId}: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
      process.exitCode = 1;
    }
  }
}

async function upsertDeal(ownerId, deal) {
  const row = {
    id: deal.id,
    owner_id: ownerId,
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
    updated_at: deal.updatedAt,
  };
  const { data, error } = await supabase.from("brix_deals").upsert(row).select("*").single();
  if (error) throw error;
  assert(data, "Supabase did not return the saved deal.");
  return data;
}

async function activeDeals(ownerId) {
  const { data, error } = await supabase
    .from("brix_deals")
    .select("*")
    .eq("owner_id", ownerId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

async function softDelete(ownerId, id) {
  const { error } = await supabase
    .from("brix_deals")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select("id")
    .single();
  if (error) throw error;
}

function loadDotEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const delimiter = line.indexOf("=");
    if (delimiter < 1) continue;
    const key = line.slice(0, delimiter).trim();
    const value = line.slice(delimiter + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function env(name) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

function step(message) {
  console.log(`- ${message}`);
}

function pass(message) {
  console.log(`  ok: ${message}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) throw new Error(`${message} Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}.`);
}
