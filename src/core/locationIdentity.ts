import type { SourceClassificationResult } from "./sourceClassification";

export const LOCATION_IDENTITY_CONTRACT_VERSION = "location-identity-v1";
export const LOCATION_EXTERNAL_REFERENCE_CONTRACT_VERSION = "external-location-reference-v1";
export const LOCATION_RESOLUTION_CONTRACT_VERSION = "location-resolution-v1";
export const LOCATION_MATCHING_CONTRACT_VERSION = "location-matching-v1";

export const locationKinds = [
  "property_site",
  "mailing_address",
  "parcel",
  "point",
  "street_address",
  "building",
  "unit",
  "municipality",
  "county",
  "region",
  "postal_area",
  "neighborhood",
  "submarket",
  "metropolitan_area",
  "census_or_statistical_area",
  "custom_market_area",
  "unknown",
] as const;

export const geographicLevels = [
  "point",
  "parcel",
  "address",
  "building",
  "unit",
  "postal_area",
  "neighborhood",
  "municipality",
  "county",
  "region",
  "metropolitan_area",
  "country",
  "custom_market_boundary",
  "unknown",
] as const;

export const locationResolutionStates = [
  "unresolved",
  "partially_resolved",
  "resolved_unverified",
  "resolved_verified",
  "ambiguous",
  "conflicted",
  "stale",
  "superseded",
  "unavailable",
  "not_applicable",
] as const;

export const locationVerificationStates = [
  "verified",
  "source_backed",
  "corroborated",
  "estimated",
  "user_entered",
  "proposed",
  "missing",
  "unknown",
] as const;

export const locationConfidenceTiers = ["high", "moderate", "low", "insufficient"] as const;
export const locationAmbiguityStates = ["none", "possible", "ambiguous", "conflicted", "unresolved"] as const;
export const locationFreshnessStates = ["current", "stale", "historical", "superseded", "unknown"] as const;

export type LocationKind = typeof locationKinds[number];
export type GeographicLevel = typeof geographicLevels[number];
export type LocationResolutionState = typeof locationResolutionStates[number];
export type LocationVerificationState = typeof locationVerificationStates[number];
export type LocationConfidenceTier = typeof locationConfidenceTiers[number];
export type LocationAmbiguityState = typeof locationAmbiguityStates[number];
export type LocationFreshnessState = typeof locationFreshnessStates[number];

export type LocationFieldState = "accepted" | "needs_review" | "missing" | "conflicted" | "deferred" | "rejected";
export type LocationAssociationType = "primary_site" | "alternate_site" | "historical_site" | "mailing_address" | "parcel_component" | "building_component" | "unit_component";
export type ExternalLocationIdentityType = "provider_record" | "listing_record" | "parcel_id" | "assessor_id" | "municipality_id" | "postal_authority_id" | "fips" | "census_geography" | "school_district" | "tax_district" | "boundary_id" | "other";
export type ExternalLocationMatchState = "unresolved" | "matched" | "ambiguous" | "conflicted" | "rejected" | "superseded";
export type CoordinateMethod = "provider" | "authority" | "user_entered" | "survey" | "geocoded" | "estimated" | "unknown";
export type CoordinateAcceptanceState = "accepted" | "proposed" | "rejected" | "superseded";

export type LocationIdentityErrorCode =
  | "location_not_found"
  | "location_version_not_found"
  | "location_unresolved"
  | "location_ambiguous"
  | "location_conflicted"
  | "invalid_location_kind"
  | "invalid_geographic_level"
  | "invalid_country_code"
  | "invalid_region_code"
  | "invalid_postal_code"
  | "invalid_coordinate"
  | "invalid_coordinate_precision"
  | "external_reference_invalid"
  | "external_reference_conflict"
  | "property_location_mismatch"
  | "workspace_mismatch"
  | "unauthorized_location"
  | "unauthorized_property"
  | "unauthorized_evidence"
  | "location_hash_mismatch"
  | "idempotency_conflict"
  | "internal_location_identity_error";

export type LocationIdentityError = {
  code: LocationIdentityErrorCode;
  safeMessage: string;
  retryable: boolean;
  field?: string;
};

export type SourceEvidenceReference = {
  sourceRecordId?: string;
  evidenceId?: string;
  sourceClassification?: SourceClassificationResult;
  sourceName?: string;
  sourceUrl?: string;
  sourceAnchor?: Record<string, unknown>;
  observedAt?: string;
  effectiveAt?: string;
};

export type AcceptedFactReference = {
  factId: string;
  factVersion?: number;
  field: string;
  acceptedAt?: string;
  sourceRecordId?: string;
  evidenceId?: string;
};

export type AdministrativeIdentifier = {
  authorityId: string;
  identifierType: ExternalLocationIdentityType;
  value: string;
  label?: string;
  version?: string;
  effectiveAt?: string;
  verificationState: LocationVerificationState;
  source?: SourceEvidenceReference;
};

export type Coordinate = {
  latitude: number;
  longitude: number;
  coordinateSystem: "WGS84" | "NAD83" | "unknown";
  precisionMeters?: number;
  method: CoordinateMethod;
  providerOrAuthority?: string;
  observedAt?: string;
  verificationState: LocationVerificationState;
  source?: SourceEvidenceReference;
  acceptanceState: CoordinateAcceptanceState;
};

export type NormalizedAddressComponents = {
  originalLocationString?: string;
  streetNumber?: string;
  streetName?: string;
  streetSuffix?: string;
  streetDirection?: string;
  unitOrSubpremise?: string;
  municipality?: string;
  locality?: string;
  county?: string;
  regionCode?: string;
  postalCode?: string;
  countryCode?: string;
  normalizedFullAddress?: string;
  displayLocation: string;
  comparisonKey: string;
};

export type CanonicalLocationIdentity = {
  locationId: string;
  workspaceId: string;
  propertyId?: string;
  locationKind: LocationKind;
  geographicLevel: GeographicLevel;
  components: NormalizedAddressComponents;
  administrativeIdentifiers: AdministrativeIdentifier[];
  coordinate?: Coordinate;
  boundary?: {
    boundaryId: string;
    boundaryVersion?: string;
    parentLocationIds?: string[];
    childLocationIds?: string[];
    effectiveAt?: string;
  };
  verificationState: LocationVerificationState;
  confidenceTier: LocationConfidenceTier;
  resolutionState: LocationResolutionState;
  ambiguityState: LocationAmbiguityState;
  freshnessState: LocationFreshnessState;
  fieldStates: Partial<Record<keyof NormalizedAddressComponents | "coordinate" | "boundary" | "administrativeIdentifiers", LocationFieldState>>;
  originalSource?: SourceEvidenceReference;
  sourceReferences: SourceEvidenceReference[];
  acceptedFactReferences: AcceptedFactReference[];
  conflictReferences: string[];
  supersededLocationId?: string;
  effectiveAt?: string;
  observedAt?: string;
  deterministicContentHash: string;
  contractVersion: typeof LOCATION_IDENTITY_CONTRACT_VERSION;
};

export type PropertyLocationAssociation = {
  associationId: string;
  workspaceId: string;
  propertyId: string;
  locationId: string;
  associationType: LocationAssociationType;
  associationState: "current" | "historical" | "superseded" | "proposed" | "rejected";
  propertyVersion?: number;
  sourceReferences: SourceEvidenceReference[];
  acceptedFactReferences: AcceptedFactReference[];
  effectiveAt?: string;
  supersededAt?: string;
  deterministicHash: string;
  contractVersion: typeof LOCATION_IDENTITY_CONTRACT_VERSION;
};

export type ExternalLocationReference = {
  externalReferenceId: string;
  locationId?: string;
  workspaceId: string;
  providerOrAuthorityId: string;
  providerScopedExternalId: string;
  externalIdentityType: ExternalLocationIdentityType;
  providerRecordVersion?: string;
  providerGeographyType?: string;
  providerReportedLabel?: string;
  observedAt: string;
  effectiveAt?: string;
  verificationState: LocationVerificationState;
  matchState: ExternalLocationMatchState;
  matchMethod: "exact_external_id" | "provider_reported_location" | "user_linked" | "source_record_linked" | "unresolved" | "conflict_review";
  confidenceTier: LocationConfidenceTier;
  source?: SourceEvidenceReference;
  deterministicHash: string;
  contractVersion: typeof LOCATION_EXTERNAL_REFERENCE_CONTRACT_VERSION;
};

export type LocationMatchReason = {
  code: "exact_address_unit" | "same_parcel" | "same_coordinate" | "same_admin_identifier" | "same_provider_reference" | "same_property_association" | "workspace_filtered" | "unit_differs" | "parcel_conflict" | "coordinate_supporting_only" | "ambiguous_evidence";
  message: string;
  strength: "blocking" | "strong" | "supporting" | "conflict" | "informational";
};

export type LocationMatchCandidate = {
  candidateLocationId: string;
  workspaceId: string;
  propertyId?: string;
  score: number;
  confidenceTier: LocationConfidenceTier;
  matchState: "candidate" | "ambiguous" | "conflicted" | "not_candidate";
  reasons: LocationMatchReason[];
  deterministicCandidateHash: string;
  stableOrderingKey: string;
};

export type LocationResolutionResult = {
  resultId: string;
  workspaceId: string;
  requestLocationHash: string;
  resolutionState: LocationResolutionState;
  ambiguityState: LocationAmbiguityState;
  candidates: LocationMatchCandidate[];
  selectedLocationId?: string;
  errors: LocationIdentityError[];
  warnings: string[];
  deterministicHash: string;
  contractVersion: typeof LOCATION_RESOLUTION_CONTRACT_VERSION;
};

export type LocationIdentityInput = {
  workspaceId: string;
  propertyId?: string;
  locationKind: LocationKind;
  geographicLevel: GeographicLevel;
  originalLocationString?: string;
  addressLine1?: string;
  addressLine2?: string;
  unitOrSubpremise?: string;
  municipality?: string;
  locality?: string;
  county?: string;
  regionCode?: string;
  postalCode?: string;
  countryCode?: string;
  administrativeIdentifiers?: AdministrativeIdentifier[];
  coordinate?: Coordinate;
  boundary?: CanonicalLocationIdentity["boundary"];
  verificationState?: LocationVerificationState;
  confidenceTier?: LocationConfidenceTier;
  resolutionState?: LocationResolutionState;
  ambiguityState?: LocationAmbiguityState;
  freshnessState?: LocationFreshnessState;
  fieldStates?: CanonicalLocationIdentity["fieldStates"];
  sourceReferences?: SourceEvidenceReference[];
  acceptedFactReferences?: AcceptedFactReference[];
  conflictReferences?: string[];
  supersededLocationId?: string;
  effectiveAt?: string;
  observedAt?: string;
};

export function normalizeLocationInput(input: {
  originalLocationString?: string;
  addressLine1?: string;
  addressLine2?: string;
  unitOrSubpremise?: string;
  municipality?: string;
  locality?: string;
  county?: string;
  regionCode?: string;
  postalCode?: string;
  countryCode?: string;
}): NormalizedAddressComponents {
  const originalLocationString = cleanDisplay(input.originalLocationString);
  const addressLine1 = cleanDisplay(input.addressLine1 ?? originalLocationString);
  const addressLine2 = cleanDisplay(input.addressLine2);
  const unitOrSubpremise = cleanDisplay(input.unitOrSubpremise ?? addressLine2);
  const parsedStreet = parseStreet(addressLine1);
  const municipality = cleanDisplay(input.municipality);
  const locality = cleanDisplay(input.locality);
  const county = cleanDisplay(input.county);
  const regionCode = normalizeRegionCode(input.regionCode);
  const postalCode = normalizePostalCode(input.postalCode);
  const countryCode = normalizeCountryCode(input.countryCode);
  const normalizedFullAddress = [
    addressLine1,
    unitOrSubpremise,
    municipality ?? locality,
    regionCode,
    postalCode,
    countryCode,
  ].filter(Boolean).join(", ") || undefined;
  const displayLocation = normalizedFullAddress ?? originalLocationString ?? "Unresolved location";
  const comparisonKey = comparisonKeyFor([
    parsedStreet.streetNumber,
    parsedStreet.streetDirection,
    parsedStreet.streetName,
    parsedStreet.streetSuffix,
    unitOrSubpremise,
    municipality,
    locality,
    county,
    regionCode,
    postalCode,
    countryCode,
  ]);

  return {
    originalLocationString,
    streetNumber: parsedStreet.streetNumber,
    streetName: parsedStreet.streetName,
    streetSuffix: parsedStreet.streetSuffix,
    streetDirection: parsedStreet.streetDirection,
    unitOrSubpremise,
    municipality,
    locality,
    county,
    regionCode,
    postalCode,
    countryCode,
    normalizedFullAddress,
    displayLocation,
    comparisonKey,
  };
}

export function buildCanonicalLocationIdentity(input: LocationIdentityInput): CanonicalLocationIdentity {
  const workspaceId = requiredClean(input.workspaceId, "Location identity requires workspace scope.");
  if (!locationKinds.includes(input.locationKind)) throw locationError("invalid_location_kind", "Location kind is not supported.", false, "locationKind");
  if (!geographicLevels.includes(input.geographicLevel)) throw locationError("invalid_geographic_level", "Geographic level is not supported.", false, "geographicLevel");
  const components = normalizeLocationInput(input);
  const coordinate = input.coordinate ? normalizeCoordinate(input.coordinate) : undefined;
  const administrativeIdentifiers = (input.administrativeIdentifiers ?? []).map(normalizeAdministrativeIdentifier).sort(compareAdministrativeIdentifier);
  const base = {
    workspaceId,
    propertyId: clean(input.propertyId),
    locationKind: input.locationKind,
    geographicLevel: input.geographicLevel,
    components,
    administrativeIdentifiers,
    coordinate,
    boundary: normalizeBoundary(input.boundary),
    verificationState: input.verificationState ?? defaultVerificationState(input),
    confidenceTier: input.confidenceTier ?? "insufficient",
    resolutionState: input.resolutionState ?? defaultResolutionState(input, coordinate, administrativeIdentifiers),
    ambiguityState: input.ambiguityState ?? "unresolved",
    freshnessState: input.freshnessState ?? "unknown",
    fieldStates: input.fieldStates ?? defaultFieldStates(components, coordinate, administrativeIdentifiers),
    originalSource: input.sourceReferences?.[0],
    sourceReferences: stableSourceReferences(input.sourceReferences ?? []),
    acceptedFactReferences: stableAcceptedFacts(input.acceptedFactReferences ?? []),
    conflictReferences: uniqueSorted(input.conflictReferences ?? []),
    supersededLocationId: clean(input.supersededLocationId),
    effectiveAt: clean(input.effectiveAt),
    observedAt: clean(input.observedAt),
  };
  const deterministicContentHash = locationMaterialHash(base);
  return {
    ...base,
    locationId: `loc_${deterministicContentHash.slice(0, 24)}`,
    deterministicContentHash,
    contractVersion: LOCATION_IDENTITY_CONTRACT_VERSION,
  };
}

export function buildPropertyLocationAssociation(input: {
  workspaceId: string;
  propertyId: string;
  locationId: string;
  associationType: LocationAssociationType;
  associationState?: PropertyLocationAssociation["associationState"];
  propertyVersion?: number;
  sourceReferences?: SourceEvidenceReference[];
  acceptedFactReferences?: AcceptedFactReference[];
  effectiveAt?: string;
  supersededAt?: string;
}): PropertyLocationAssociation {
  const basis = {
    workspaceId: requiredClean(input.workspaceId, "Property-location association requires workspace scope."),
    propertyId: requiredClean(input.propertyId, "Property-location association requires a Property."),
    locationId: requiredClean(input.locationId, "Property-location association requires a location."),
    associationType: input.associationType,
    associationState: input.associationState ?? "current",
    propertyVersion: input.propertyVersion,
    sourceReferences: stableSourceReferences(input.sourceReferences ?? []),
    acceptedFactReferences: stableAcceptedFacts(input.acceptedFactReferences ?? []),
    effectiveAt: clean(input.effectiveAt),
    supersededAt: clean(input.supersededAt),
  };
  return {
    ...basis,
    associationId: `pla_${stableHash(basis).slice(0, 24)}`,
    deterministicHash: `plah_${stableHash({ ...basis, associationState: undefined }).slice(0, 24)}`,
    contractVersion: LOCATION_IDENTITY_CONTRACT_VERSION,
  };
}

export function buildExternalLocationReference(input: {
  workspaceId: string;
  locationId?: string;
  providerOrAuthorityId: string;
  providerScopedExternalId: string;
  externalIdentityType: ExternalLocationIdentityType;
  providerRecordVersion?: string;
  providerGeographyType?: string;
  providerReportedLabel?: string;
  observedAt: string;
  effectiveAt?: string;
  verificationState?: LocationVerificationState;
  matchState?: ExternalLocationMatchState;
  matchMethod?: ExternalLocationReference["matchMethod"];
  confidenceTier?: LocationConfidenceTier;
  source?: SourceEvidenceReference;
}): ExternalLocationReference {
  const providerOrAuthorityId = normalizeAuthority(input.providerOrAuthorityId);
  const providerScopedExternalId = requiredClean(input.providerScopedExternalId, "External location reference requires a provider-scoped id.");
  if (!providerOrAuthorityId) throw locationError("external_reference_invalid", "External location reference requires provider or authority scope.", false, "providerOrAuthorityId");
  const basis = {
    workspaceId: requiredClean(input.workspaceId, "External location reference requires workspace scope."),
    locationId: clean(input.locationId),
    providerOrAuthorityId,
    providerScopedExternalId,
    externalIdentityType: input.externalIdentityType,
    providerRecordVersion: clean(input.providerRecordVersion),
    providerGeographyType: clean(input.providerGeographyType),
    providerReportedLabel: cleanDisplay(input.providerReportedLabel),
    observedAt: requiredClean(input.observedAt, "External location reference requires observed time."),
    effectiveAt: clean(input.effectiveAt),
    verificationState: input.verificationState ?? "source_backed",
    matchState: input.matchState ?? (input.locationId ? "matched" : "unresolved"),
    matchMethod: input.matchMethod ?? (input.locationId ? "user_linked" : "unresolved"),
    confidenceTier: input.confidenceTier ?? "low",
    source: input.source,
  };
  const deterministicHash = `xrefh_${stableHash(basis).slice(0, 24)}`;
  return {
    ...basis,
    externalReferenceId: `xref_${stableHash({
      workspaceId: basis.workspaceId,
      providerOrAuthorityId,
      providerScopedExternalId,
      externalIdentityType: basis.externalIdentityType,
      locationId: basis.locationId,
    }).slice(0, 24)}`,
    deterministicHash,
    contractVersion: LOCATION_EXTERNAL_REFERENCE_CONTRACT_VERSION,
  };
}

export function matchLocationCandidates(input: {
  workspaceId: string;
  target: CanonicalLocationIdentity;
  candidates: CanonicalLocationIdentity[];
  externalReferences?: ExternalLocationReference[];
  candidateLimit?: number;
}): LocationResolutionResult {
  const workspaceId = requiredClean(input.workspaceId, "Location matching requires workspace scope.");
  if (input.target.workspaceId !== workspaceId) throw locationError("workspace_mismatch", "Target location is outside the active workspace.", false);
  const referencesByLocation = referencesForWorkspace(input.externalReferences ?? [], workspaceId);
  const results = input.candidates
    .filter((candidate) => candidate.workspaceId === workspaceId)
    .filter((candidate) => candidate.locationId !== input.target.locationId)
    .map((candidate) => scoreCandidate(input.target, candidate, referencesByLocation))
    .filter((candidate) => candidate.matchState !== "not_candidate")
    .sort((a, b) => a.stableOrderingKey.localeCompare(b.stableOrderingKey))
    .slice(0, clampInteger(input.candidateLimit ?? 10, 1, 25));

  const topScore = results[0]?.score ?? 0;
  const tiedTop = results.filter((candidate) => candidate.score === topScore);
  const hasConflict = results.some((candidate) => candidate.matchState === "conflicted");
  const resolutionState: LocationResolutionState = hasConflict
    ? "conflicted"
    : results.length === 0
      ? "unresolved"
      : tiedTop.length > 1
        ? "ambiguous"
        : topScore >= 90
          ? "resolved_unverified"
          : "partially_resolved";
  const ambiguityState: LocationAmbiguityState = resolutionState === "ambiguous" ? "ambiguous" : hasConflict ? "conflicted" : results.length ? "possible" : "unresolved";
  const basis = {
    workspaceId,
    requestLocationHash: input.target.deterministicContentHash,
    resolutionState,
    ambiguityState,
    candidates: results.map((candidate) => ({
      candidateLocationId: candidate.candidateLocationId,
      score: candidate.score,
      matchState: candidate.matchState,
      reasons: candidate.reasons.map((reason) => reason.code).sort(),
    })),
  };
  return {
    resultId: `lres_${stableHash(basis).slice(0, 24)}`,
    workspaceId,
    requestLocationHash: input.target.deterministicContentHash,
    resolutionState,
    ambiguityState,
    candidates: results,
    selectedLocationId: resolutionState === "resolved_unverified" ? results[0]?.candidateLocationId : undefined,
    errors: resolutionState === "conflicted" ? [locationError("location_conflicted", "Location candidates conflict and require review.", false)] : resolutionState === "ambiguous" ? [locationError("location_ambiguous", "Location candidates are ambiguous and require review.", false)] : [],
    warnings: results.some((candidate) => candidate.reasons.some((reason) => reason.code === "same_coordinate")) ? ["Coordinate-only matches are supporting evidence and do not confirm a street address."] : [],
    deterministicHash: `lresh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: LOCATION_RESOLUTION_CONTRACT_VERSION,
  };
}

export function locationMaterialHash(input: Omit<CanonicalLocationIdentity, "locationId" | "deterministicContentHash" | "contractVersion"> | Record<string, unknown>) {
  return stableHash({
    workspaceId: input.workspaceId,
    propertyId: input.propertyId,
    locationKind: input.locationKind,
    geographicLevel: input.geographicLevel,
    components: materialComponents(input.components as NormalizedAddressComponents | undefined),
    administrativeIdentifiers: input.administrativeIdentifiers,
    coordinate: materialCoordinate(input.coordinate as Coordinate | undefined),
    boundary: input.boundary,
    verificationState: input.verificationState,
    confidenceTier: input.confidenceTier,
    resolutionState: input.resolutionState,
    ambiguityState: input.ambiguityState,
    freshnessState: input.freshnessState,
    acceptedFactReferences: input.acceptedFactReferences,
    conflictReferences: input.conflictReferences,
    supersededLocationId: input.supersededLocationId,
    effectiveAt: input.effectiveAt,
  });
}

export function locationIdentityDiagnostics(event: "normalization_requested" | "location_candidate_generated" | "ambiguity_detected" | "conflict_detected" | "identity_accepted" | "identity_superseded" | "external_reference_attached" | "authorization_denied" | "idempotent_result_reused" | "operation_failed", input: {
  workspaceId?: string;
  propertyId?: string;
  locationId?: string;
  state?: string;
  code?: string;
}) {
  return {
    event,
    workspaceScoped: Boolean(clean(input.workspaceId)),
    propertyScoped: Boolean(clean(input.propertyId)),
    locationScoped: Boolean(clean(input.locationId)),
    state: clean(input.state),
    code: clean(input.code),
  };
}

function scoreCandidate(target: CanonicalLocationIdentity, candidate: CanonicalLocationIdentity, referencesByLocation: Map<string, ExternalLocationReference[]>): LocationMatchCandidate {
  const reasons: LocationMatchReason[] = [];
  let score = 0;
  if (target.components.comparisonKey && target.components.comparisonKey === candidate.components.comparisonKey) {
    score += 92;
    reasons.push(reason("exact_address_unit", "Normalized address and unit match exactly.", "strong"));
  }
  const targetUnit = normalizedToken(target.components.unitOrSubpremise);
  const candidateUnit = normalizedToken(candidate.components.unitOrSubpremise);
  if (target.components.comparisonKey && removeUnit(target.components.comparisonKey, targetUnit) === removeUnit(candidate.components.comparisonKey, candidateUnit) && targetUnit !== candidateUnit) {
    score -= 35;
    reasons.push(reason("unit_differs", "Street address matches but unit/subpremise differs.", "conflict"));
  }
  const sameParcel = acceptedIdentifierValues(target, ["parcel_id", "assessor_id"]).filter((value) => acceptedIdentifierValues(candidate, ["parcel_id", "assessor_id"]).includes(value));
  if (sameParcel.length) {
    score += 88;
    reasons.push(reason("same_parcel", "Accepted parcel or assessor identifier matches.", "strong"));
  }
  const conflictingParcel = acceptedIdentifierValues(target, ["parcel_id", "assessor_id"]).length && acceptedIdentifierValues(candidate, ["parcel_id", "assessor_id"]).length && !sameParcel.length;
  if (conflictingParcel) {
    score -= 80;
    reasons.push(reason("parcel_conflict", "Accepted parcel or assessor identifiers conflict.", "conflict"));
  }
  if (coordinatesSame(target.coordinate, candidate.coordinate)) {
    score += 35;
    reasons.push(reason("same_coordinate", "Accepted coordinates match within declared precision.", "supporting"));
    reasons.push(reason("coordinate_supporting_only", "Coordinates support review but do not confirm address identity alone.", "informational"));
  }
  if (target.propertyId && target.propertyId === candidate.propertyId) {
    score += 20;
    reasons.push(reason("same_property_association", "Both identities are associated with the same canonical Property.", "supporting"));
  }
  const sharedReferences = sharedProviderReferences(target, candidate, referencesByLocation);
  if (sharedReferences.length) {
    score += 35;
    reasons.push(reason("same_provider_reference", "Provider-scoped external references match for the same provider.", "supporting"));
  }
  const matchState: LocationMatchCandidate["matchState"] = reasons.some((item) => item.strength === "conflict")
    ? "conflicted"
    : score >= 90
      ? "candidate"
      : score >= 35
        ? "ambiguous"
        : "not_candidate";
  const confidenceTier: LocationConfidenceTier = score >= 90 ? "high" : score >= 60 ? "moderate" : score >= 35 ? "low" : "insufficient";
  const basis = {
    target: target.locationId,
    candidate: candidate.locationId,
    score,
    reasons: reasons.map((item) => item.code).sort(),
  };
  return {
    candidateLocationId: candidate.locationId,
    workspaceId: candidate.workspaceId,
    propertyId: candidate.propertyId,
    score: Math.max(0, Math.min(100, score)),
    confidenceTier,
    matchState,
    reasons: reasons.sort((a, b) => a.code.localeCompare(b.code)),
    deterministicCandidateHash: `lmatch_${stableHash(basis).slice(0, 24)}`,
    stableOrderingKey: [String(1000 - score).padStart(4, "0"), matchState, candidate.locationId].join(":"),
  };
}

function normalizeCoordinate(input: Coordinate): Coordinate {
  if (!Number.isFinite(input.latitude) || input.latitude < -90 || input.latitude > 90) throw locationError("invalid_coordinate", "Latitude must be between -90 and 90.", false, "latitude");
  if (!Number.isFinite(input.longitude) || input.longitude < -180 || input.longitude > 180) throw locationError("invalid_coordinate", "Longitude must be between -180 and 180.", false, "longitude");
  if (input.precisionMeters !== undefined && (!Number.isFinite(input.precisionMeters) || input.precisionMeters < 0)) throw locationError("invalid_coordinate_precision", "Coordinate precision must be a positive meter value.", false, "precisionMeters");
  return {
    latitude: input.latitude,
    longitude: input.longitude,
    coordinateSystem: input.coordinateSystem,
    precisionMeters: input.precisionMeters,
    method: input.method,
    providerOrAuthority: clean(input.providerOrAuthority),
    observedAt: clean(input.observedAt),
    verificationState: input.verificationState,
    source: input.source,
    acceptanceState: input.acceptanceState,
  };
}

function normalizeAdministrativeIdentifier(input: AdministrativeIdentifier): AdministrativeIdentifier {
  const authorityId = normalizeAuthority(input.authorityId);
  const value = requiredClean(input.value, "Administrative identifier requires a value.");
  if (!authorityId) throw locationError("external_reference_invalid", "Administrative identifier requires authority scope.", false, "authorityId");
  return {
    authorityId,
    identifierType: input.identifierType,
    value,
    label: cleanDisplay(input.label),
    version: clean(input.version),
    effectiveAt: clean(input.effectiveAt),
    verificationState: input.verificationState,
    source: input.source,
  };
}

function parseStreet(value?: string) {
  const cleaned = cleanDisplay(value);
  if (!cleaned) return {};
  const parts = cleaned.split(/\s+/);
  const streetNumber = /^\d+[A-Za-z-]*$/.test(parts[0] ?? "") ? parts.shift() : undefined;
  const suffixes = new Set(["st", "street", "ave", "avenue", "rd", "road", "dr", "drive", "ln", "lane", "ct", "court", "blvd", "boulevard", "hwy", "highway", "pkwy", "parkway", "way", "pl", "place", "cir", "circle", "trl", "trail"]);
  const streetSuffix = parts.length > 1 && suffixes.has((parts.at(-1) ?? "").toLowerCase().replace(/\./g, "")) ? parts.pop() : undefined;
  const directions = new Set(["n", "s", "e", "w", "ne", "nw", "se", "sw", "north", "south", "east", "west"]);
  const streetDirection = parts.length > 1 && directions.has((parts[0] ?? "").toLowerCase().replace(/\./g, "")) ? parts.shift() : undefined;
  return {
    streetNumber: cleanDisplay(streetNumber),
    streetDirection: normalizeStreetToken(streetDirection),
    streetName: cleanDisplay(parts.join(" ")),
    streetSuffix: normalizeStreetToken(streetSuffix),
  };
}

function defaultVerificationState(input: LocationIdentityInput): LocationVerificationState {
  if (input.sourceReferences?.length) return "source_backed";
  if (input.acceptedFactReferences?.length) return "verified";
  if (input.originalLocationString || input.addressLine1) return "user_entered";
  return "missing";
}

function defaultResolutionState(input: LocationIdentityInput, coordinate: Coordinate | undefined, identifiers: AdministrativeIdentifier[]): LocationResolutionState {
  if (input.conflictReferences?.length) return "conflicted";
  if (input.supersededLocationId) return "superseded";
  if (input.locationKind === "unknown" || input.geographicLevel === "unknown") return "unresolved";
  if (input.addressLine1 || input.originalLocationString || coordinate || identifiers.length) return "resolved_unverified";
  return "unresolved";
}

function defaultFieldStates(components: NormalizedAddressComponents, coordinate: Coordinate | undefined, identifiers: AdministrativeIdentifier[]): CanonicalLocationIdentity["fieldStates"] {
  return {
    normalizedFullAddress: components.normalizedFullAddress ? "needs_review" : "missing",
    countryCode: components.countryCode ? "needs_review" : "missing",
    regionCode: components.regionCode ? "needs_review" : "missing",
    county: components.county ? "needs_review" : "missing",
    municipality: components.municipality ? "needs_review" : "missing",
    postalCode: components.postalCode ? "needs_review" : "missing",
    unitOrSubpremise: components.unitOrSubpremise ? "needs_review" : "missing",
    coordinate: coordinate ? "needs_review" : "missing",
    administrativeIdentifiers: identifiers.length ? "needs_review" : "missing",
  };
}

function materialComponents(input?: NormalizedAddressComponents) {
  if (!input) return undefined;
  return {
    streetNumber: normalizedToken(input.streetNumber),
    streetDirection: normalizedToken(input.streetDirection),
    streetName: normalizedToken(input.streetName),
    streetSuffix: normalizedToken(input.streetSuffix),
    unitOrSubpremise: normalizedToken(input.unitOrSubpremise),
    municipality: normalizedToken(input.municipality),
    locality: normalizedToken(input.locality),
    county: normalizedToken(input.county),
    regionCode: normalizedToken(input.regionCode),
    postalCode: normalizedToken(input.postalCode),
    countryCode: normalizedToken(input.countryCode),
    comparisonKey: input.comparisonKey,
  };
}

function materialCoordinate(input?: Coordinate) {
  if (!input || input.acceptanceState !== "accepted") return undefined;
  return {
    latitude: input.latitude,
    longitude: input.longitude,
    coordinateSystem: input.coordinateSystem,
    precisionMeters: input.precisionMeters,
    method: input.method,
    verificationState: input.verificationState,
  };
}

function coordinatesSame(left?: Coordinate, right?: Coordinate) {
  if (!left || !right || left.acceptanceState !== "accepted" || right.acceptanceState !== "accepted") return false;
  const precision = Math.max(left.precisionMeters ?? 0, right.precisionMeters ?? 0);
  return left.coordinateSystem === right.coordinateSystem && Math.abs(left.latitude - right.latitude) <= Math.max(0.000001, precision / 111_320) && Math.abs(left.longitude - right.longitude) <= Math.max(0.000001, precision / 111_320);
}

function acceptedIdentifierValues(identity: CanonicalLocationIdentity, types: ExternalLocationIdentityType[]) {
  return identity.administrativeIdentifiers
    .filter((identifier) => types.includes(identifier.identifierType))
    .filter((identifier) => identifier.verificationState === "verified" || identifier.verificationState === "source_backed" || identifier.verificationState === "corroborated")
    .map((identifier) => `${identifier.identifierType}:${identifier.authorityId}:${identifier.value}`)
    .sort();
}

function referencesForWorkspace(references: ExternalLocationReference[], workspaceId: string) {
  const map = new Map<string, ExternalLocationReference[]>();
  for (const reference of references) {
    if (reference.workspaceId !== workspaceId || !reference.locationId) continue;
    const list = map.get(reference.locationId) ?? [];
    list.push(reference);
    map.set(reference.locationId, list);
  }
  return map;
}

function sharedProviderReferences(target: CanonicalLocationIdentity, candidate: CanonicalLocationIdentity, referencesByLocation: Map<string, ExternalLocationReference[]>) {
  const targetRefs = referencesByLocation.get(target.locationId) ?? [];
  const candidateRefs = referencesByLocation.get(candidate.locationId) ?? [];
  const candidateKeys = new Set(candidateRefs.map((reference) => `${reference.providerOrAuthorityId}:${reference.providerScopedExternalId}:${reference.externalIdentityType}`));
  return targetRefs.filter((reference) => candidateKeys.has(`${reference.providerOrAuthorityId}:${reference.providerScopedExternalId}:${reference.externalIdentityType}`));
}

function removeUnit(key: string, unit?: string) {
  return unit ? key.replace(`|${unit}`, "") : key;
}

function reason(code: LocationMatchReason["code"], message: string, strength: LocationMatchReason["strength"]): LocationMatchReason {
  return { code, message, strength };
}

function normalizeBoundary(boundary?: CanonicalLocationIdentity["boundary"]) {
  if (!boundary) return undefined;
  return {
    boundaryId: requiredClean(boundary.boundaryId, "Boundary identity requires a boundary id."),
    boundaryVersion: clean(boundary.boundaryVersion),
    parentLocationIds: uniqueSorted(boundary.parentLocationIds ?? []),
    childLocationIds: uniqueSorted(boundary.childLocationIds ?? []),
    effectiveAt: clean(boundary.effectiveAt),
  };
}

function stableSourceReferences(input: SourceEvidenceReference[]) {
  return input
    .map((source) => ({
      ...source,
      sourceRecordId: clean(source.sourceRecordId),
      evidenceId: clean(source.evidenceId),
      sourceName: cleanDisplay(source.sourceName),
      sourceUrl: clean(source.sourceUrl),
      observedAt: clean(source.observedAt),
      effectiveAt: clean(source.effectiveAt),
    }))
    .sort((a, b) => stableSerialize(a).localeCompare(stableSerialize(b)));
}

function stableAcceptedFacts(input: AcceptedFactReference[]) {
  return input
    .map((fact) => ({
      factId: requiredClean(fact.factId, "Accepted fact reference requires a fact id."),
      factVersion: fact.factVersion,
      field: requiredClean(fact.field, "Accepted fact reference requires a field."),
      acceptedAt: clean(fact.acceptedAt),
      sourceRecordId: clean(fact.sourceRecordId),
      evidenceId: clean(fact.evidenceId),
    }))
    .sort((a, b) => stableSerialize(a).localeCompare(stableSerialize(b)));
}

function compareAdministrativeIdentifier(left: AdministrativeIdentifier, right: AdministrativeIdentifier) {
  return stableSerialize(left).localeCompare(stableSerialize(right));
}

function normalizeStreetToken(value?: string) {
  return cleanDisplay(value)?.replace(/\.$/, "");
}

function normalizeCountryCode(value?: string) {
  const cleaned = clean(value);
  if (!cleaned) return undefined;
  if (!/^[A-Za-z]{2,3}$/.test(cleaned)) throw locationError("invalid_country_code", "Country code must be an ISO-style two or three letter code when supplied.", false, "countryCode");
  return cleaned.toUpperCase() === "USA" ? "US" : cleaned.toUpperCase();
}

function normalizeRegionCode(value?: string) {
  const cleaned = clean(value);
  if (!cleaned) return undefined;
  if (!/^[A-Za-z0-9 .'-]{1,80}$/.test(cleaned)) throw locationError("invalid_region_code", "Region code contains unsupported characters.", false, "regionCode");
  return cleaned.length <= 3 ? cleaned.toUpperCase() : cleaned;
}

function normalizePostalCode(value?: string) {
  const cleaned = clean(value);
  if (!cleaned) return undefined;
  if (!/^[A-Za-z0-9][A-Za-z0-9 -]{0,20}$/.test(cleaned)) throw locationError("invalid_postal_code", "Postal code contains unsupported characters.", false, "postalCode");
  return cleaned.toUpperCase().replace(/\s+/g, " ");
}

function normalizeAuthority(value?: string) {
  return clean(value).toLowerCase().replace(/[^a-z0-9_:-]+/g, "_").replace(/^_+|_+$/g, "");
}

function comparisonKeyFor(values: Array<string | undefined>) {
  return values.map(normalizedToken).filter(Boolean).join("|");
}

function normalizedToken(value?: string) {
  const cleaned = clean(value);
  return cleaned?.toLowerCase().normalize("NFKC").replace(/[.,#]/g, " ").replace(/\s+/g, " ").trim() || undefined;
}

function cleanDisplay(value: unknown) {
  return typeof value === "string" && value.trim() ? value.replace(/\s+/g, " ").trim() : undefined;
}

function clean(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function requiredClean(value: unknown, message: string) {
  const cleaned = clean(value);
  if (!cleaned) throw locationError("internal_location_identity_error", message, false);
  return cleaned;
}

function clampInteger(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.trunc(Number.isFinite(value) ? value : min)));
}

function uniqueSorted(values: readonly string[]) {
  return [...new Set(values.map(clean).filter((value): value is string => Boolean(value)))].sort();
}

function locationError(code: LocationIdentityErrorCode, safeMessage: string, retryable: boolean, field?: string): LocationIdentityError {
  return { code, safeMessage, retryable, field };
}

function stableHash(value: unknown) {
  const text = stableSerialize(value);
  let hash = 5381;
  for (let index = 0; index < text.length; index += 1) hash = ((hash << 5) + hash) ^ text.charCodeAt(index);
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function stableSerialize(value: unknown): string {
  if (value === undefined) return "";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`)
    .join(",")}}`;
}
