import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  LISTING_PROVIDER_FEATURE_FLAG,
  createListingProviderRegistry,
  defaultListingProviderFeatureState,
  disabledListingProviderCapabilities,
  disabledListingProviderRestrictions,
  isListingProviderFeatureAvailable,
  listingProviderRegistry,
  normalizeProviderKey,
  providerListingIdentityKey,
  resolveListingProviderRouteAccess,
  validateListingProviderSourceIdentity,
  type ListingProviderDefinition,
  type ServerListingProviderFeatureState,
} from "../core/licensedListingProviders";

const scaffoldSource = readFileSync("src/core/licensedListingProviders.ts", "utf8");
const appSource = readFileSync("src/App.tsx", "utf8");
const propertyIntakeSource = readFileSync("src/core/propertyIntake.ts", "utf8");
const listingUrlIntakeSource = readFileSync("src/core/listingUrlIntake.ts", "utf8");
const listingMigration = readFileSync("supabase/migrations/20260725170000_listing_url_intake.sql", "utf8");
const fileEvidenceMigration = readFileSync("supabase/migrations/20260725203000_file_evidence_intake.sql", "utf8");
const emailMigration = readFileSync("supabase/migrations/20260726093000_email_intake_foundation.sql", "utf8");

describe("dormant licensed listing provider scaffold", () => {
  it("loads an empty disabled registry with no enabled, configured, or default provider", () => {
    expect(listingProviderRegistry.providers).toEqual([]);
    expect(listingProviderRegistry.enabledProviders()).toEqual([]);
    expect(listingProviderRegistry.configuredProviders()).toEqual([]);
    expect(listingProviderRegistry.hasDefaultProvider).toBe(false);
    expect(listingProviderRegistry.getDefaultProvider()).toBeUndefined();
  });

  it("normalizes provider keys deterministically and rejects duplicates", () => {
    expect(normalizeProviderKey(" Licensed Provider 01 ")).toBe("licensed_provider_01");
    expect(() => createListingProviderRegistry([
      definition({ providerKey: "Future Provider" }),
      definition({ providerKey: "future_provider" }),
    ])).toThrow(/Duplicate listing provider key/);
  });

  it("returns safe errors for unknown, disabled, and unconfigured providers", async () => {
    const unknown = listingProviderRegistry.getAdapter("not_real_provider");
    await expect(unknown.searchListings()).resolves.toMatchObject({ ok: false, error: { code: "unknown_provider" } });

    const disabled = createListingProviderRegistry([definition({ providerKey: "future_provider" })]).getAdapter("future_provider");
    await expect(disabled.getListing(identity("future_provider", "123"))).resolves.toMatchObject({ ok: false, error: { code: "disabled" } });

    const unconfigured = createListingProviderRegistry([definition({
      providerKey: "configured_later",
      enabled: true,
    })]).getAdapter("configured_later", {
      ...defaultListingProviderFeatureState,
      enabledByServer: true,
      approvedProviderKeys: ["configured_later"],
      licensingConfirmed: true,
      configurationConfirmed: true,
    });
    await expect(unconfigured.searchListings()).resolves.toMatchObject({ ok: false, error: { code: "not_configured" } });
  });

  it("keeps capability declarations deterministic and non-operational", () => {
    const adapter = listingProviderRegistry.getAdapter("anything");
    expect(adapter.getCapabilities()).toEqual({ ok: true, data: disabledListingProviderCapabilities });
    expect(adapter.getRetentionPolicy()).toMatchObject({ ok: true, data: { retentionCategory: "none" } });
  });

  it("keeps source identity provider-scoped and separate from canonical Property identity", () => {
    const first = identity("provider_one", "shared-listing-id", "provider-property-id");
    const second = identity("provider_two", "shared-listing-id", "provider-property-id");

    expect(providerListingIdentityKey(first)).toBe("provider_one:shared-listing-id");
    expect(providerListingIdentityKey(second)).toBe("provider_two:shared-listing-id");
    expect(providerListingIdentityKey(first)).not.toBe(providerListingIdentityKey(second));
    expect(first.providerPropertyId).not.toBe(providerListingIdentityKey(first));
    expect(validateListingProviderSourceIdentity({ ...first, providerKey: "" })).toMatchObject({
      ok: false,
      error: { code: "invalid_provider_identity" },
    });
    expect(first.licensing?.retentionCategory).toBe("metadata_only");
    expect(first.attribution?.providerNotice).toBe("source terms required");
  });

  it("requires server-controlled feature state and licensing before any provider route can become available", () => {
    const provider = definition({
      providerKey: "future_licensed_provider",
      enabled: true,
      configured: true,
      licensingState: "licensed",
    });
    const registry = createListingProviderRegistry([provider]);
    const clientOnlyAttempt: ServerListingProviderFeatureState = {
      featureFlag: LISTING_PROVIDER_FEATURE_FLAG,
      enabledByServer: true,
      approvedProviderKeys: ["future_licensed_provider"],
      licensingConfirmed: false,
      configurationConfirmed: true,
    };

    expect(isListingProviderFeatureAvailable(defaultListingProviderFeatureState, provider)).toBe(false);
    expect(isListingProviderFeatureAvailable(clientOnlyAttempt, provider)).toBe(false);
    expect(resolveListingProviderRouteAccess("/licensed-listing-providers", clientOnlyAttempt, [provider])).toBe(false);
    expect(registry.routeAvailable("/licensed-listing-providers", defaultListingProviderFeatureState)).toBe(false);
  });

  it("does not expose a licensed-provider product surface in the production application shell", () => {
    expect(appSource).not.toMatch(/Add Deal MLS|provider picker|connect-provider|listing search screen|listing results/i);
    expect(appSource).not.toMatch(/licensed-listing-providers|provider-listings/i);
    expect(appSource).not.toContain(LISTING_PROVIDER_FEATURE_FLAG);
  });

  it("does not introduce credentials, browser storage secrets, provider endpoints, or arbitrary network access", () => {
    expect(scaffoldSource).not.toMatch(/api[_-]?key|access[_-]?token|client[_-]?secret|oauth|password|credential table/i);
    expect(scaffoldSource).not.toMatch(/localStorage|sessionStorage|document\.cookie/i);
    expect(scaffoldSource).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|axios|WebSocket/i);
    expect(scaffoldSource).not.toMatch(/\b(zillow|redfin|realtor|reso)\b/i);
  });

  it("reuses current Spec 004 intake/source/proposal systems instead of creating duplicate paths", () => {
    expect(propertyIntakeSource).toContain("complete_manual_property_intake");
    expect(propertyIntakeSource).toContain("record_listing_url_import_result");
    expect(listingUrlIntakeSource).toContain('invokeBrixFunction<unknown>("extract-listing"');
    expect(listingMigration).toContain("intake_value_proposals");
    expect(listingMigration).toContain("record_listing_url_import_result");
    expect(fileEvidenceMigration).toContain("record_file_evidence_intake_result");
    expect(emailMigration).toContain("record_email_intake_result");
    expect(scaffoldSource).not.toMatch(/createDeal|createProperty|completeManualPropertyIntake|record_listing_url_import_result/);
  });

  it("keeps existing Add Deal intake source types unchanged", () => {
    expect(fileEvidenceMigration).toContain("source_type in ('manual', 'listing_url', 'file', 'image', 'document')");
    expect(emailMigration).toContain("source_type in ('manual', 'listing_url', 'file', 'image', 'document', 'email')");
    expect(listingMigration).not.toMatch(/mls_listings|provider_credentials|zillow_|redfin_|realtor_/i);
  });
});

function definition(overrides: Partial<ListingProviderDefinition> = {}): ListingProviderDefinition {
  return {
    providerKey: "future_provider",
    displayName: "Future licensed listing provider",
    providerType: "licensed_listing_provider",
    enabled: false,
    configured: false,
    configurationState: "not_configured",
    licensingState: "not_licensed",
    environmentAvailability: "disabled",
    adapterVersion: "test-fixture",
    featureFlag: LISTING_PROVIDER_FEATURE_FLAG,
    licenseRequired: true,
    capabilities: disabledListingProviderCapabilities,
    restrictions: disabledListingProviderRestrictions,
    ...overrides,
  };
}

function identity(providerKey: string, providerListingId: string, providerPropertyId?: string) {
  return {
    providerKey,
    providerListingId,
    providerPropertyId,
    sourceUrl: "https://example.invalid/listing",
    sourceVersion: "test",
    retrievedAt: "2026-07-26T12:00:00.000Z",
    effectiveAt: "2026-07-25T12:00:00.000Z",
    geographicScope: "test market",
    attribution: { providerNotice: "source terms required" },
    licensing: {
      retentionCategory: "metadata_only" as const,
      displayRestrictions: ["fixture only"],
      attributionRequired: true,
      deletionRequirement: "provider_terms_required" as const,
      licensingNotes: "fixture metadata",
    },
  };
}
