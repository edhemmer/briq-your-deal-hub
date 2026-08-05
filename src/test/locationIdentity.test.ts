import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  LOCATION_IDENTITY_CONTRACT_VERSION,
  buildCanonicalLocationIdentity,
  buildExternalLocationReference,
  buildPropertyLocationAssociation,
  locationIdentityDiagnostics,
  locationKinds,
  matchLocationCandidates,
  normalizeLocationInput,
  type AdministrativeIdentifier,
  type Coordinate,
  type LocationIdentityInput,
} from "../core/locationIdentity";

const observedAt = "2026-08-05T12:00:00.000Z";
const workspaceId = "workspace-a";
const otherWorkspaceId = "workspace-b";

function location(overrides: Partial<LocationIdentityInput> = {}) {
  return buildCanonicalLocationIdentity({
    workspaceId,
    propertyId: "property-1",
    locationKind: "property_site",
    geographicLevel: "address",
    addressLine1: "101 Main St",
    unitOrSubpremise: "Unit 1",
    municipality: "Naperville",
    regionCode: "il",
    postalCode: "06040",
    countryCode: "us",
    observedAt,
    ...overrides,
  });
}

function parcel(value: string): AdministrativeIdentifier {
  return {
    authorityId: "Will County Assessor",
    identifierType: "parcel_id",
    value,
    verificationState: "source_backed",
    source: { sourceRecordId: `source-${value}`, sourceName: "County assessor", observedAt },
  };
}

function coordinate(overrides: Partial<Coordinate> = {}): Coordinate {
  return {
    latitude: 41.750839,
    longitude: -88.153535,
    coordinateSystem: "WGS84",
    precisionMeters: 5,
    method: "authority",
    verificationState: "source_backed",
    acceptanceState: "accepted",
    observedAt,
    ...overrides,
  };
}

describe("provider-neutral location identity", () => {
  it("normalizes spacing, case, postal values, and preserves the original supplied text without inventing fields", () => {
    const normalized = normalizeLocationInput({
      originalLocationString: "  101   Main   St  ",
      unitOrSubpremise: "  Apt   2B ",
      municipality: " Naperville ",
      regionCode: " il ",
      postalCode: " 06040 ",
    });

    expect(normalized.originalLocationString).toBe("101 Main St");
    expect(normalized.unitOrSubpremise).toBe("Apt 2B");
    expect(normalized.regionCode).toBe("IL");
    expect(normalized.postalCode).toBe("06040");
    expect(normalized.countryCode).toBeUndefined();
    expect(normalized.county).toBeUndefined();
    expect(normalized.comparisonKey).toContain("apt 2b");
  });

  it("creates deterministic runtime-neutral identities for supported kinds and geographic levels", () => {
    const first = location();
    const second = location({ originalLocationString: "display copy only" });

    expect(locationKinds).toContain("property_site");
    expect(first.contractVersion).toBe(LOCATION_IDENTITY_CONTRACT_VERSION);
    expect(first.locationId).toBe(second.locationId);
    expect(first.deterministicContentHash).toBe(second.deterministicContentHash);
    expect(first.locationId).toMatch(/^loc_/);
    expect(first.components.normalizedFullAddress).toBe("101 Main St, Unit 1, Naperville, IL, 06040, US");
  });

  it("keeps location associated with canonical Property instead of replacing Property identity", () => {
    const identity = location();
    const association = buildPropertyLocationAssociation({
      workspaceId,
      propertyId: "property-1",
      locationId: identity.locationId,
      associationType: "primary_site",
      propertyVersion: 7,
    });

    expect(identity.propertyId).toBe("property-1");
    expect(association.propertyId).toBe("property-1");
    expect(association.locationId).toBe(identity.locationId);
    expect(association.associationId).toMatch(/^pla_/);
  });

  it("distinguishes physical, mailing, building, unit, parcel, commercial, rural, administrative, historical, and non-US fixtures", () => {
    const fixtures = [
      location({ addressLine1: "12 Elm Rd", unitOrSubpremise: undefined, propertyId: "sfh" }),
      location({ unitOrSubpremise: "Apt 4C", propertyId: "apartment", locationKind: "unit", geographicLevel: "unit" }),
      location({ addressLine1: "88 Maple Ave", propertyId: "multifamily", locationKind: "building", geographicLevel: "building" }),
      location({ addressLine1: "200 Commerce Blvd", unitOrSubpremise: "Suite 300", propertyId: "commercial", locationKind: "unit", geographicLevel: "unit" }),
      location({ addressLine1: undefined, originalLocationString: "Parcel 00001234 on County Road 8", locationKind: "parcel", geographicLevel: "parcel", administrativeIdentifiers: [parcel("00001234")] }),
      location({ addressLine1: undefined, originalLocationString: "Rural route near Highway 8 and River Bend", locationKind: "unknown", geographicLevel: "unknown", propertyId: "rural" }),
      location({ locationKind: "mailing_address", addressLine1: "PO Box 55", propertyId: "mailing" }),
      location({ geographicLevel: "county", locationKind: "county", county: "Will County", addressLine1: undefined, propertyId: "county" }),
      location({ freshnessState: "superseded", supersededLocationId: "loc_prior", propertyId: "historical" }),
      location({ countryCode: "CA", regionCode: "ON", postalCode: "K1A 0B1", propertyId: "non-us" }),
    ];

    expect(new Set(fixtures.map((fixture) => fixture.locationId)).size).toBe(fixtures.length);
    expect(fixtures.find((fixture) => fixture.propertyId === "rural")?.resolutionState).toBe("unresolved");
    expect(fixtures.find((fixture) => fixture.propertyId === "historical")?.freshnessState).toBe("superseded");
  });

  it("preserves unit distinctions and changes the material hash when unit changes", () => {
    const unit1 = location({ unitOrSubpremise: "Unit 1" });
    const unit2 = location({ unitOrSubpremise: "Unit 2" });

    expect(unit1.locationId).not.toBe(unit2.locationId);
    expect(unit1.deterministicContentHash).not.toBe(unit2.deterministicContentHash);
  });

  it("keeps provider-scoped references external and noncanonical", () => {
    const identity = location();
    const first = buildExternalLocationReference({
      workspaceId,
      locationId: identity.locationId,
      providerOrAuthorityId: "provider-a",
      providerScopedExternalId: "123",
      externalIdentityType: "provider_record",
      observedAt,
    });
    const second = buildExternalLocationReference({
      workspaceId,
      locationId: identity.locationId,
      providerOrAuthorityId: "provider-b",
      providerScopedExternalId: "123",
      externalIdentityType: "provider_record",
      observedAt,
    });

    expect(first.externalReferenceId).not.toBe(second.externalReferenceId);
    expect(first.externalReferenceId).not.toBe(identity.locationId);
    expect(first.providerScopedExternalId).toBe("123");
    expect(second.providerScopedExternalId).toBe("123");
  });

  it("supports multiple provider references to the same location without treating either as canonical", () => {
    const identity = location();
    const references = ["provider-a", "provider-b"].map((provider) => buildExternalLocationReference({
      workspaceId,
      locationId: identity.locationId,
      providerOrAuthorityId: provider,
      providerScopedExternalId: "external-1",
      externalIdentityType: "listing_record",
      observedAt,
    }));

    expect(references.map((reference) => reference.locationId)).toEqual([identity.locationId, identity.locationId]);
    expect(new Set(references.map((reference) => reference.externalReferenceId)).size).toBe(2);
  });

  it("represents unresolved, partial, verified, ambiguous, conflicted, stale, superseded, unavailable, and not-applicable states explicitly", () => {
    expect(location({ locationKind: "unknown", geographicLevel: "unknown" }).resolutionState).toBe("unresolved");
    expect(location({ resolutionState: "partially_resolved" }).resolutionState).toBe("partially_resolved");
    expect(location({ resolutionState: "resolved_verified", verificationState: "verified", confidenceTier: "high" }).verificationState).toBe("verified");
    expect(location({ resolutionState: "ambiguous", ambiguityState: "ambiguous" }).ambiguityState).toBe("ambiguous");
    expect(location({ conflictReferences: ["conflict-1"] }).resolutionState).toBe("conflicted");
    expect(location({ freshnessState: "stale" }).freshnessState).toBe("stale");
    expect(location({ supersededLocationId: "loc-old" }).resolutionState).toBe("superseded");
    expect(location({ resolutionState: "unavailable" }).resolutionState).toBe("unavailable");
    expect(location({ resolutionState: "not_applicable" }).resolutionState).toBe("not_applicable");
  });

  it("matches exact normalized address and unit deterministically within the same workspace", () => {
    const target = location({ propertyId: "target" });
    const candidate = location({ propertyId: "candidate" });
    const result = matchLocationCandidates({ workspaceId, target, candidates: [candidate] });

    expect(result.resolutionState).toBe("resolved_unverified");
    expect(result.selectedLocationId).toBe(candidate.locationId);
    expect(result.candidates[0]?.reasons.map((reason) => reason.code)).toContain("exact_address_unit");
  });

  it("uses parcel and coordinate support while preserving conflicts and ambiguity", () => {
    const target = location({ administrativeIdentifiers: [parcel("00001234")], coordinate: coordinate() });
    const sameParcel = location({ propertyId: "parcel-match", unitOrSubpremise: undefined, administrativeIdentifiers: [parcel("00001234")] });
    const conflictingParcel = location({ propertyId: "parcel-conflict", administrativeIdentifiers: [parcel("99999999")] });
    const coordinateOnly = location({ propertyId: "coord", addressLine1: "999 Other Rd", unitOrSubpremise: undefined, coordinate: coordinate() });
    const result = matchLocationCandidates({ workspaceId, target, candidates: [coordinateOnly, conflictingParcel, sameParcel] });

    expect(result.candidates.map((candidate) => candidate.candidateLocationId)).toEqual(result.candidates.map((candidate) => candidate.candidateLocationId).sort());
    expect(result.candidates.some((candidate) => candidate.reasons.some((reason) => reason.code === "same_parcel"))).toBe(true);
    expect(result.candidates.some((candidate) => candidate.reasons.some((reason) => reason.code === "parcel_conflict"))).toBe(true);
    expect(result.candidates.some((candidate) => candidate.reasons.some((reason) => reason.code === "coordinate_supporting_only"))).toBe(true);
  });

  it("does not silently merge ambiguous equal candidates or cross-workspace candidates", () => {
    const target = location({ propertyId: "target" });
    const one = location({ propertyId: "one" });
    const two = location({ propertyId: "two" });
    const outside = location({ workspaceId: otherWorkspaceId, propertyId: "outside" });
    const result = matchLocationCandidates({ workspaceId, target, candidates: [outside, two, one] });

    expect(result.resolutionState).toBe("ambiguous");
    expect(result.selectedLocationId).toBeUndefined();
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates.every((candidate) => candidate.workspaceId === workspaceId)).toBe(true);
  });

  it("validates coordinate ranges and keeps proposed coordinates from affecting material identity", () => {
    expect(() => location({ coordinate: coordinate({ latitude: 120 }) })).toThrow(expect.objectContaining({ code: "invalid_coordinate" }));
    const proposed = location({ coordinate: coordinate({ acceptanceState: "proposed" }) });
    const absent = location({ coordinate: undefined });

    expect(proposed.deterministicContentHash).toBe(absent.deterministicContentHash);
  });

  it("preserves authority-scoped identifiers, leading zeros, and source requirements", () => {
    const identity = location({
      administrativeIdentifiers: [
        parcel("00001234"),
        { authorityId: "US Census", identifierType: "fips", value: "01719712345", verificationState: "source_backed", source: { sourceRecordId: "census-1" } },
      ],
    });

    expect(identity.administrativeIdentifiers.map((identifier) => identifier.value)).toContain("00001234");
    expect(identity.administrativeIdentifiers.map((identifier) => identifier.value)).toContain("01719712345");
    expect(identity.administrativeIdentifiers.every((identifier) => identifier.authorityId)).toBe(true);
  });

  it("excludes display-only copy but includes parcel, accepted coordinates, boundary version, and effective date in hashes", () => {
    const base = location({ boundary: { boundaryId: "boundary-1", boundaryVersion: "2026" }, coordinate: coordinate(), administrativeIdentifiers: [parcel("00001234")], effectiveAt: "2026-01-01" });
    expect(location({ boundary: { boundaryId: "boundary-1", boundaryVersion: "2027" }, coordinate: coordinate(), administrativeIdentifiers: [parcel("00001234")], effectiveAt: "2026-01-01" }).locationId).not.toBe(base.locationId);
    expect(location({ boundary: { boundaryId: "boundary-1", boundaryVersion: "2026" }, coordinate: coordinate({ longitude: -88.1536 }), administrativeIdentifiers: [parcel("00001234")], effectiveAt: "2026-01-01" }).locationId).not.toBe(base.locationId);
    expect(location({ boundary: { boundaryId: "boundary-1", boundaryVersion: "2026" }, coordinate: coordinate(), administrativeIdentifiers: [parcel("00009999")], effectiveAt: "2026-01-01" }).locationId).not.toBe(base.locationId);
    expect(location({ boundary: { boundaryId: "boundary-1", boundaryVersion: "2026" }, coordinate: coordinate(), administrativeIdentifiers: [parcel("00001234")], effectiveAt: "2026-02-01" }).locationId).not.toBe(base.locationId);
  });

  it("uses safe diagnostics without exposing exact location strings or source payloads", () => {
    expect(locationIdentityDiagnostics("authorization_denied", {
      workspaceId,
      propertyId: "property-1",
      locationId: "loc_x",
      code: "unauthorized_location",
    })).toEqual({
      event: "authorization_denied",
      workspaceScoped: true,
      propertyScoped: true,
      locationScoped: true,
      state: undefined,
      code: "unauthorized_location",
    });
  });

  it("keeps location identity runtime-neutral and out of presentation/provider/source-boundary layers", () => {
    const root = process.cwd();
    const locationSource = readFileSync(join(root, "src/core/locationIdentity.ts"), "utf8");
    expect(locationSource).not.toMatch(/\bfrom\s+["']react["']|useState|localStorage|sessionStorage|fetch\s*\(|invokeBrixFunction|supabase|OpenAI|URLSession|Zillow|Realtor|LoopNet|Crexi/i);

    for (const file of [
      "src/App.tsx",
      "src/core/providerAdapters.ts",
      "src/core/reportExports.ts",
      "src/core/deepLinks.ts",
      "ios/BRIXRealEstateiOS/BRIXRealEstateiOS/AppState.swift",
      "ios/BRIXRealEstateiOS/BRIXRealEstateiOS/AppModels.swift",
    ]) {
      const source = readFileSync(join(root, file), "utf8");
      expect(source).not.toContain("buildCanonicalLocationIdentity");
      expect(source).not.toContain("matchLocationCandidates");
      expect(source).not.toContain("normalizeLocationInput");
    }
  });
});
