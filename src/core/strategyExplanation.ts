import { FORMULA_REGISTRY_VERSION } from "./formulaRegistry";
import {
  STRATEGY_COMPATIBILITY_RESULT_HASH_VERSION,
  STRATEGY_COMPATIBILITY_RESULT_VERSION,
  type StrategyCompatibilityResult,
  type StrategyCompatibilityStatus,
  type StrategyHardDisqualifierEvaluationResult,
  type StrategyRequirementEvaluationResult,
} from "./strategyCompatibility";
import {
  STRATEGY_CONFIDENCE_MODEL_VERSION,
  STRATEGY_RANKING_RESULT_HASH_VERSION,
  STRATEGY_RANKING_RESULT_VERSION,
  STRATEGY_RANKING_TIE_BREAK_VERSION,
  STRATEGY_SCORING_ENGINE_REGISTRY_VERSION,
  STRATEGY_SCORING_RESULT_HASH_VERSION,
  STRATEGY_SCORING_RESULT_VERSION,
  STRATEGY_SCORING_WEIGHT_REGISTRY_VERSION,
  type StrategyCategoryScore,
  type StrategyRankingResult,
  type StrategyScoreResult,
} from "./strategyScoring";
import {
  STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION,
  STRATEGY_REQUIREMENT_REGISTRY_VERSION,
} from "./strategyRequirements";
import { STRATEGY_REGISTRY_VERSION, resolveStrategyDefinition } from "./strategyRegistry";
import {
  UNDERWRITING_CORE_OUTPUT_HASH_VERSION,
  UNDERWRITING_CORE_OUTPUT_RUN_VERSION,
  type UnderwritingCoreFormulaResultRecord,
  type UnderwritingCoreOutputRunRecord,
} from "./underwritingCoreOutputs";
import { UNDERWRITING_SNAPSHOT_CONTRACT_VERSION } from "./underwritingSnapshots";

export const STRATEGY_EXPLANATION_CONTRACT_ID = "strategy_explanation_contract";
export const STRATEGY_EXPLANATION_CONTRACT_VERSION = "1.0.0";
export const STRATEGY_EXPLANATION_CONTRACT_REGISTRY_VERSION = "strategy-explanation-contract-registry-v1";
export const STRATEGY_EXPLANATION_TEMPLATE_SET_VERSION = "strategy-explanation-template-set-v1";
export const STRATEGY_EXPLANATION_TERMINOLOGY_VERSION = "strategy-explanation-terminology-v1";
export const STRATEGY_EXPLANATION_SECTION_ORDERING_VERSION = "strategy-explanation-section-order-v1";
export const STRATEGY_EXPLANATION_PROFESSIONAL_BOUNDARY_VERSION = "strategy-explanation-professional-boundary-v1";
export const STRATEGY_EXPLANATION_RESULT_VERSION = "strategy-explanation-result-v1";
export const STRATEGY_EXPLANATION_HASH_VERSION = "strategy-explanation-result-hash-v1";
export const STRATEGY_EXPLANATION_CONFIDENCE_HASH_VERSION = "strategy-explanation-confidence-hash-v1";

export type StrategyExplanationContractStatus = "draft" | "active" | "deprecated" | "disabled";
export type StrategyExplanationDetailLevel = "summary" | "standard" | "detailed";
export type StrategyExplanationPresentationMode = "guided" | "professional";
export type StrategyExplanationLocale = "en-US";
export type StrategyExplanationPermission = "strategy.explain" | "strategy.evaluate" | "strategy.read";
export type StrategyExplanationMembershipStatus = "active" | "revoked" | "missing";
export type StrategyExplanationSourceClient = "server" | "web" | "iphone" | "ipad" | "report" | "test";
export type StrategyExplanationSectionId =
  | "result_summary"
  | "compatibility"
  | "hard_disqualifiers"
  | "conditions_and_constraints"
  | "score_breakdown"
  | "ranking_rationale"
  | "confidence_and_evidence_quality"
  | "key_strengths"
  | "key_weaknesses"
  | "missing_or_uncertain_information"
  | "assumptions_and_preliminary_values"
  | "sensitivity"
  | "professional_verification"
  | "what_could_change_the_result"
  | "sources_and_versions";
export type StrategyExplanationSectionStatus = "complete" | "needs_attention" | "blocked" | "not_applicable";
export type StrategyExplanationSeverity = "positive" | "informational" | "caution" | "critical" | "blocking";
export type StrategyExplanationReasonType =
  | "compatibility_reason"
  | "satisfied_requirement"
  | "conditional_requirement"
  | "unsatisfied_requirement"
  | "triggered_disqualifier"
  | "score_dimension_strength"
  | "score_dimension_weakness"
  | "ranking_tiebreaker"
  | "confidence_reducer"
  | "missing_dependency"
  | "stale_dependency"
  | "conflict"
  | "accepted_assumption"
  | "preliminary_assumption"
  | "sensitivity_exposure"
  | "professional_review"
  | "material_change_factor"
  | "historical_version_note";
export type StrategyExplanationErrorCode =
  | "explanation_contract_disabled"
  | "explanation_contract_not_found"
  | "unauthorized_strategy_explanation"
  | "workspace_mismatch"
  | "deal_mismatch"
  | "property_mismatch"
  | "snapshot_mismatch"
  | "underwriting_run_mismatch"
  | "strategy_mismatch"
  | "compatibility_hash_mismatch"
  | "score_hash_mismatch"
  | "ranking_hash_mismatch"
  | "confidence_hash_mismatch"
  | "underwriting_hash_mismatch";

export type StrategyExplanationContractDefinition = {
  contractId: typeof STRATEGY_EXPLANATION_CONTRACT_ID;
  semanticVersion: string;
  registryVersion: typeof STRATEGY_EXPLANATION_CONTRACT_REGISTRY_VERSION;
  status: StrategyExplanationContractStatus;
  templateSetVersion: typeof STRATEGY_EXPLANATION_TEMPLATE_SET_VERSION;
  terminologyVersion: typeof STRATEGY_EXPLANATION_TERMINOLOGY_VERSION;
  sectionOrderingVersion: typeof STRATEGY_EXPLANATION_SECTION_ORDERING_VERSION;
  professionalBoundaryVersion: typeof STRATEGY_EXPLANATION_PROFESSIONAL_BOUNDARY_VERSION;
  supportedLocales: StrategyExplanationLocale[];
  supportedDetailLevels: StrategyExplanationDetailLevel[];
  supportedPresentationModes: StrategyExplanationPresentationMode[];
  supportedStrategyRegistryVersions: Array<typeof STRATEGY_REGISTRY_VERSION>;
  supportedCompatibilityResultVersions: Array<typeof STRATEGY_COMPATIBILITY_RESULT_VERSION>;
  supportedScoringResultVersions: Array<typeof STRATEGY_SCORING_RESULT_VERSION>;
  supportedRankingResultVersions: Array<typeof STRATEGY_RANKING_RESULT_VERSION>;
  effectiveDate: string;
  deprecatedDate: string | null;
  replacementContractVersion: string | null;
};

export type StrategyExplanationActorContext = {
  actorId?: string;
  workspaceId: string;
  membershipStatus: StrategyExplanationMembershipStatus;
  permissions: StrategyExplanationPermission[];
  sourceClient: StrategyExplanationSourceClient;
};

export type StrategyExplanationRequest = {
  explanationRequestId: string;
  workspaceId: string;
  dealId: string;
  propertyId: string;
  underwritingSnapshotId: string;
  underwritingRunId: string;
  strategyId: string;
  strategyVersion: string | "latest";
  expectedCompatibilityResultId: string;
  expectedCompatibilityResultHash: string;
  expectedScoreResultId: string;
  expectedScoreHash: string;
  expectedConfidenceHash: string;
  expectedUnderwritingResultSetHash: string;
  expectedRankingResultId?: string;
  expectedRankingHash?: string;
  explanationContractVersion: string;
  detailLevel: StrategyExplanationDetailLevel;
  presentationMode: StrategyExplanationPresentationMode;
  locale: StrategyExplanationLocale;
  actorContext: StrategyExplanationActorContext;
  idempotencyKey: string;
  requestedAt: string;
};

export type StrategyExplanationItem = {
  itemId: string;
  stableOrdinal: number;
  reasonType: StrategyExplanationReasonType;
  severity: StrategyExplanationSeverity;
  sourceSystem:
    | "strategy_registry"
    | "strategy_compatibility"
    | "strategy_scoring"
    | "strategy_ranking"
    | "underwriting_result"
    | "explanation_contract";
  sourceRef: string;
  sourceHash: string | null;
  shortText: string;
  professionalText: string;
  sourceRefs: string[];
  evidenceRefs: string[];
  versionRefs: string[];
};

export type StrategyExplanationSection = {
  sectionId: StrategyExplanationSectionId;
  title: string;
  stableOrdinal: number;
  status: StrategyExplanationSectionStatus;
  itemCount: number;
  items: StrategyExplanationItem[];
};

export type StrategyExplanationResult = {
  explanationResultId: string;
  explanationRequestId: string;
  workspaceId: string;
  dealId: string;
  propertyId: string;
  snapshotId: string;
  underwritingRunId: string;
  compatibilityResultId: string;
  scoreResultId: string;
  rankingResultId: string | null;
  strategyId: string;
  strategyVersion: string;
  compatibilityStatus: StrategyCompatibilityStatus;
  scoreEligibility: StrategyScoreResult["scoreEligibility"];
  overallScore: number | null;
  rank: number | null;
  confidenceLevel: StrategyScoreResult["confidence"]["confidenceLevel"];
  confidenceScore: number | null;
  sections: StrategyExplanationSection[];
  sourceHashes: {
    compatibilityResultHash: string;
    scoreHash: string;
    confidenceHash: string;
    rankingHash: string | null;
    underwritingResultSetHash: string;
  };
  versionReferences: StrategyExplanationVersionReferences;
  semanticExplanationHash: string;
  requestedAt: string;
  completedAt: string;
  version: typeof STRATEGY_EXPLANATION_RESULT_VERSION;
  errors: Array<{ code: StrategyExplanationErrorCode; safeMessage: string }>;
};

export type StrategyExplanationProjection = {
  explanationResultId: string;
  semanticExplanationHash: string;
  presentationMode: StrategyExplanationPresentationMode;
  detailLevel: StrategyExplanationDetailLevel;
  locale: StrategyExplanationLocale;
  sections: Array<{
    sectionId: StrategyExplanationSectionId;
    title: string;
    status: StrategyExplanationSectionStatus;
    items: Array<{
      itemId: string;
      reasonType: StrategyExplanationReasonType;
      severity: StrategyExplanationSeverity;
      text: string;
      sourceRefs: string[];
      evidenceRefs: string[];
    }>;
  }>;
};

export type StrategyExplanationVersionReferences = {
  explanationContractVersion: string;
  explanationContractRegistryVersion: typeof STRATEGY_EXPLANATION_CONTRACT_REGISTRY_VERSION;
  explanationTemplateSetVersion: typeof STRATEGY_EXPLANATION_TEMPLATE_SET_VERSION;
  explanationTerminologyVersion: typeof STRATEGY_EXPLANATION_TERMINOLOGY_VERSION;
  explanationSectionOrderingVersion: typeof STRATEGY_EXPLANATION_SECTION_ORDERING_VERSION;
  explanationProfessionalBoundaryVersion: typeof STRATEGY_EXPLANATION_PROFESSIONAL_BOUNDARY_VERSION;
  explanationResultVersion: typeof STRATEGY_EXPLANATION_RESULT_VERSION;
  explanationHashVersion: typeof STRATEGY_EXPLANATION_HASH_VERSION;
  confidenceHashVersion: typeof STRATEGY_EXPLANATION_CONFIDENCE_HASH_VERSION;
  strategyRegistryVersion: typeof STRATEGY_REGISTRY_VERSION;
  compatibilityResultVersion: typeof STRATEGY_COMPATIBILITY_RESULT_VERSION;
  compatibilityHashVersion: typeof STRATEGY_COMPATIBILITY_RESULT_HASH_VERSION;
  requirementRegistryVersion: typeof STRATEGY_REQUIREMENT_REGISTRY_VERSION;
  disqualifierRegistryVersion: typeof STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION;
  scoringEngineRegistryVersion: typeof STRATEGY_SCORING_ENGINE_REGISTRY_VERSION;
  scoringResultVersion: typeof STRATEGY_SCORING_RESULT_VERSION;
  scoringHashVersion: typeof STRATEGY_SCORING_RESULT_HASH_VERSION;
  scoringWeightRegistryVersion: typeof STRATEGY_SCORING_WEIGHT_REGISTRY_VERSION;
  confidenceModelVersion: typeof STRATEGY_CONFIDENCE_MODEL_VERSION;
  rankingResultVersion: typeof STRATEGY_RANKING_RESULT_VERSION;
  rankingHashVersion: typeof STRATEGY_RANKING_RESULT_HASH_VERSION;
  rankingTieBreakVersion: typeof STRATEGY_RANKING_TIE_BREAK_VERSION;
  formulaRegistryVersion: typeof FORMULA_REGISTRY_VERSION;
  underwritingRunVersion: typeof UNDERWRITING_CORE_OUTPUT_RUN_VERSION;
  underwritingHashVersion: typeof UNDERWRITING_CORE_OUTPUT_HASH_VERSION;
  snapshotContractVersion: typeof UNDERWRITING_SNAPSHOT_CONTRACT_VERSION;
};

export const strategyExplanationContractDefinitions: readonly StrategyExplanationContractDefinition[] = Object.freeze([
  contract("0.9.0", "deprecated", "2026-07-01", "2026-08-03", STRATEGY_EXPLANATION_CONTRACT_VERSION),
  contract(STRATEGY_EXPLANATION_CONTRACT_VERSION, "active", "2026-08-03", null, null),
  contract("2.0.0", "disabled", "2027-01-01", null, null),
]);

export const strategyExplanationSectionOrder: readonly StrategyExplanationSectionId[] = Object.freeze([
  "result_summary",
  "compatibility",
  "hard_disqualifiers",
  "conditions_and_constraints",
  "score_breakdown",
  "ranking_rationale",
  "confidence_and_evidence_quality",
  "key_strengths",
  "key_weaknesses",
  "missing_or_uncertain_information",
  "assumptions_and_preliminary_values",
  "sensitivity",
  "professional_verification",
  "what_could_change_the_result",
  "sources_and_versions",
]);

export function resolveLatestActiveStrategyExplanationContract() {
  return strategyExplanationContractDefinitions.find((definition) => definition.status === "active") ?? strategyExplanationContractDefinitions[0];
}

export function resolveStrategyExplanationContractVersion(version: string) {
  const contractDefinition = strategyExplanationContractDefinitions.find((definition) => definition.semanticVersion === version);
  if (!contractDefinition) throw explanationError("explanation_contract_not_found", "The requested strategy explanation contract version is not available.");
  return contractDefinition;
}

export function computeStrategyConfidenceHash(confidence: StrategyScoreResult["confidence"]) {
  return stableHash({
    hashVersion: STRATEGY_EXPLANATION_CONFIDENCE_HASH_VERSION,
    confidenceLevel: confidence.confidenceLevel,
    confidenceScore: confidence.confidenceScore,
    confidenceBasis: confidence.confidenceBasis,
    modelVersion: confidence.modelVersion,
    drivers: confidence.drivers,
    penalties: confidence.penalties,
  });
}

export function assembleStrategyExplanation(
  request: StrategyExplanationRequest,
  compatibility: StrategyCompatibilityResult,
  score: StrategyScoreResult,
  underwritingRun: UnderwritingCoreOutputRunRecord,
  ranking?: StrategyRankingResult,
): StrategyExplanationResult {
  const contractDefinition = safeContract(request.explanationContractVersion);
  const errors = validateRequest(request, compatibility, score, underwritingRun, ranking, contractDefinition);
  if (errors.length) return failedExplanation(request, compatibility, score, underwritingRun, ranking, contractDefinition, errors);
  const strategy = resolveStrategyDefinition(score.strategyId, score.strategyVersion);
  const sectionBuilder = createSectionBuilder();

  sectionBuilder.add("result_summary", {
    reasonType: "compatibility_reason",
    severity: severityForCompatibility(score.compatibilityStatus),
    sourceSystem: "strategy_compatibility",
    sourceRef: compatibility.compatibilityResultId,
    sourceHash: compatibility.deterministicResultHash,
    shortText: `${strategy.displayName} evaluated as ${labelCompatibility(score.compatibilityStatus)} with score ${score.overallScore ?? "not scored"}.`,
    professionalText: `${strategy.displayName} uses compatibility result ${compatibility.compatibilityResultId}, score result ${score.scoreResultId}, and underwriting run ${underwritingRun.runId}.`,
    sourceRefs: [],
    evidenceRefs: [],
    versionRefs: [compatibility.version, score.version, underwritingRun.engineVersion],
  });
  for (const reason of compatibility.controllingReasons) {
    sectionBuilder.add("compatibility", itemFromText("compatibility_reason", severityForCompatibility(compatibility.compatibilityStatus), "strategy_compatibility", compatibility.compatibilityResultId, compatibility.deterministicResultHash, reason));
  }
  for (const requirement of compatibility.requirementResultManifest) addRequirement(sectionBuilder, requirement);
  for (const disqualifier of compatibility.disqualifierResultManifest) addDisqualifier(sectionBuilder, disqualifier);
  for (const category of score.categoryScores) addScoreCategory(sectionBuilder, category);
  addRanking(sectionBuilder, score, ranking);
  addConfidence(sectionBuilder, score);
  addMissingAndAssumptions(sectionBuilder, compatibility);
  addUnderwritingSources(sectionBuilder, underwritingRun);
  addVersions(sectionBuilder, request, contractDefinition, compatibility, score, underwritingRun, ranking);

  const sections = sectionBuilder.sections();
  const base = {
    explanationRequestId: request.explanationRequestId,
    workspaceId: request.workspaceId,
    dealId: request.dealId,
    propertyId: request.propertyId,
    snapshotId: request.underwritingSnapshotId,
    underwritingRunId: request.underwritingRunId,
    compatibilityResultId: compatibility.compatibilityResultId,
    scoreResultId: score.scoreResultId,
    rankingResultId: ranking?.rankingResultId ?? null,
    strategyId: score.strategyId,
    strategyVersion: score.strategyVersion,
    compatibilityStatus: score.compatibilityStatus,
    scoreEligibility: score.scoreEligibility,
    overallScore: score.overallScore,
    rank: ranking?.rankedResults.find((item) => item.scoreResultId === score.scoreResultId)?.rank ?? score.rank,
    confidenceLevel: score.confidence.confidenceLevel,
    confidenceScore: score.confidence.confidenceScore,
    sections,
    sourceHashes: sourceHashes(compatibility, score, underwritingRun, ranking),
    versionReferences: versionReferences(contractDefinition, compatibility, score, underwritingRun),
    requestedAt: request.requestedAt,
    completedAt: request.requestedAt,
    version: STRATEGY_EXPLANATION_RESULT_VERSION as typeof STRATEGY_EXPLANATION_RESULT_VERSION,
    errors: [],
  };
  const semanticExplanationHash = stableHash({
    hashVersion: STRATEGY_EXPLANATION_HASH_VERSION,
    ...base,
    explanationRequestId: undefined,
    requestedAt: undefined,
    completedAt: undefined,
  });
  return deepFreeze({
    explanationResultId: `strategy_explanation_${semanticExplanationHash.replace(/[^a-z0-9]/gi, "").slice(0, 32)}`,
    ...base,
    semanticExplanationHash,
  });
}

export function projectStrategyExplanation(
  result: StrategyExplanationResult,
  options: {
    presentationMode: StrategyExplanationPresentationMode;
    detailLevel: StrategyExplanationDetailLevel;
    locale: StrategyExplanationLocale;
  },
): StrategyExplanationProjection {
  return {
    explanationResultId: result.explanationResultId,
    semanticExplanationHash: result.semanticExplanationHash,
    presentationMode: options.presentationMode,
    detailLevel: options.detailLevel,
    locale: options.locale,
    sections: result.sections.map((section) => ({
      sectionId: section.sectionId,
      title: section.title,
      status: section.status,
      items: section.items.map((item) => ({
        itemId: item.itemId,
        reasonType: item.reasonType,
        severity: item.severity,
        text: options.presentationMode === "professional" || options.detailLevel === "detailed" ? item.professionalText : item.shortText,
        sourceRefs: [...item.sourceRefs],
        evidenceRefs: [...item.evidenceRefs],
      })),
    })),
  };
}

function addRequirement(sectionBuilder: SectionBuilder, requirement: StrategyRequirementEvaluationResult) {
  if (requirement.evaluationStatus === "satisfied") {
    sectionBuilder.add("compatibility", itemFromRequirement("satisfied_requirement", "positive", requirement));
    return;
  }
  if (requirement.evaluationStatus === "satisfied_with_condition") {
    sectionBuilder.add("conditions_and_constraints", itemFromRequirement("conditional_requirement", "caution", requirement));
    sectionBuilder.add("what_could_change_the_result", materialChangeFromRequirement(requirement));
    if (requirement.assumptionState === "accepted") sectionBuilder.add("assumptions_and_preliminary_values", itemFromRequirement("accepted_assumption", "caution", requirement));
    if (requirement.assumptionState === "preliminary") sectionBuilder.add("assumptions_and_preliminary_values", itemFromRequirement("preliminary_assumption", "caution", requirement));
    if (requirement.professionalReviewRequired) sectionBuilder.add("professional_verification", itemFromRequirement("professional_review", "caution", requirement));
    return;
  }
  if (requirement.evaluationStatus === "missing") {
    sectionBuilder.add("missing_or_uncertain_information", itemFromRequirement("missing_dependency", "caution", requirement));
    sectionBuilder.add("what_could_change_the_result", materialChangeFromRequirement(requirement));
    return;
  }
  if (requirement.evaluationStatus === "conflicted") {
    sectionBuilder.add("missing_or_uncertain_information", itemFromRequirement("conflict", "critical", requirement));
    sectionBuilder.add("what_could_change_the_result", materialChangeFromRequirement(requirement));
    return;
  }
  if (requirement.evaluationStatus === "unavailable_dependency") {
    sectionBuilder.add("missing_or_uncertain_information", itemFromRequirement("stale_dependency", "caution", requirement));
    return;
  }
  if (requirement.evaluationStatus === "unsatisfied") {
    sectionBuilder.add("conditions_and_constraints", itemFromRequirement("unsatisfied_requirement", "blocking", requirement));
  }
  if (requirement.assumptionState === "accepted") sectionBuilder.add("assumptions_and_preliminary_values", itemFromRequirement("accepted_assumption", "caution", requirement));
  if (requirement.assumptionState === "preliminary") sectionBuilder.add("assumptions_and_preliminary_values", itemFromRequirement("preliminary_assumption", "caution", requirement));
  if (requirement.professionalReviewRequired) sectionBuilder.add("professional_verification", itemFromRequirement("professional_review", "caution", requirement));
}

function addDisqualifier(sectionBuilder: SectionBuilder, disqualifier: StrategyHardDisqualifierEvaluationResult) {
  if (disqualifier.evaluationStatus === "triggered") {
    sectionBuilder.add("hard_disqualifiers", itemFromDisqualifier("triggered_disqualifier", "blocking", disqualifier));
    sectionBuilder.add("what_could_change_the_result", materialChangeFromDisqualifier(disqualifier));
  } else if (disqualifier.professionalReviewRequired) {
    sectionBuilder.add("professional_verification", itemFromDisqualifier("professional_review", "caution", disqualifier));
  } else if (disqualifier.evaluationStatus === "uncertain" || disqualifier.evaluationStatus === "unavailable_dependency") {
    sectionBuilder.add("missing_or_uncertain_information", itemFromDisqualifier("missing_dependency", "caution", disqualifier));
  }
}

function addScoreCategory(sectionBuilder: SectionBuilder, category: StrategyCategoryScore) {
  if (category.normalizedBasis >= 7_500) {
    sectionBuilder.add("key_strengths", itemFromCategory("score_dimension_strength", "positive", category));
  } else if (category.normalizedBasis <= 5_000) {
    sectionBuilder.add("key_weaknesses", itemFromCategory("score_dimension_weakness", "caution", category));
    sectionBuilder.add("sensitivity", {
      reasonType: "sensitivity_exposure",
      severity: "caution",
      sourceSystem: "strategy_scoring",
      sourceRef: category.categoryId,
      sourceHash: String(category.normalizedBasis),
      shortText: `${category.label} is sensitive because its score is ${category.normalizedScore}.`,
      professionalText: `${category.label} has normalized basis ${category.normalizedBasis} and metric refs ${category.metricRefs.join(", ")}.`,
      sourceRefs: [],
      evidenceRefs: [],
      versionRefs: [STRATEGY_SCORING_RESULT_VERSION],
    });
  }
  sectionBuilder.add("score_breakdown", itemFromCategory(category.normalizedBasis >= 7_500 ? "score_dimension_strength" : "score_dimension_weakness", category.normalizedBasis >= 7_500 ? "positive" : "informational", category));
}

function addRanking(sectionBuilder: SectionBuilder, score: StrategyScoreResult, ranking?: StrategyRankingResult) {
  if (!ranking) return;
  const position = ranking.rankedResults.find((item) => item.scoreResultId === score.scoreResultId);
  if (!position) return;
  sectionBuilder.add("ranking_rationale", {
    reasonType: "ranking_tiebreaker",
    severity: "informational",
    sourceSystem: "strategy_ranking",
    sourceRef: ranking.rankingResultId,
    sourceHash: ranking.deterministicRankingHash,
    shortText: `Rank ${position.rank} follows the stored ranking order.`,
    professionalText: `Stored order ${ranking.stableRankingOrder.join(" > ")} uses compatibility, score, unresolved risk, assumption burden, registry order, and ID tie-breaks.`,
    sourceRefs: [],
    evidenceRefs: [],
    versionRefs: [ranking.version, STRATEGY_RANKING_TIE_BREAK_VERSION],
  });
}

function addConfidence(sectionBuilder: SectionBuilder, score: StrategyScoreResult) {
  for (const driver of score.confidence.drivers) {
    sectionBuilder.add("confidence_and_evidence_quality", itemFromText("compatibility_reason", "informational", "strategy_scoring", score.scoreResultId, score.deterministicScoreHash, driver));
  }
  for (const penalty of score.confidence.penalties) {
    sectionBuilder.add("confidence_and_evidence_quality", {
      reasonType: "confidence_reducer",
      severity: "caution",
      sourceSystem: "strategy_scoring",
      sourceRef: score.scoreResultId,
      sourceHash: score.deterministicScoreHash,
      shortText: penalty.reason,
      professionalText: `${penalty.reason} Penalty basis: ${penalty.penaltyBasis}.`,
      sourceRefs: [],
      evidenceRefs: [],
      versionRefs: [score.confidence.modelVersion],
    });
  }
}

function addMissingAndAssumptions(sectionBuilder: SectionBuilder, compatibility: StrategyCompatibilityResult) {
  for (const dependency of compatibility.missingDependencies) {
    sectionBuilder.add("missing_or_uncertain_information", {
      reasonType: "missing_dependency",
      severity: "caution",
      sourceSystem: "strategy_compatibility",
      sourceRef: dependency,
      sourceHash: compatibility.deterministicResultHash,
      shortText: `${dependency} is missing or not available.`,
      professionalText: `${dependency} is listed by compatibility result ${compatibility.compatibilityResultId} as an unresolved dependency.`,
      sourceRefs: [],
      evidenceRefs: [],
      versionRefs: [compatibility.version],
    });
  }
  for (const review of compatibility.requiredProfessionalReviews) {
    sectionBuilder.add("professional_verification", {
      reasonType: "professional_review",
      severity: "caution",
      sourceSystem: "strategy_compatibility",
      sourceRef: review,
      sourceHash: compatibility.deterministicResultHash,
      shortText: `${review} requires professional verification.`,
      professionalText: `${review} is required by compatibility result ${compatibility.compatibilityResultId}.`,
      sourceRefs: [],
      evidenceRefs: [],
      versionRefs: [compatibility.version],
    });
  }
}

function addUnderwritingSources(sectionBuilder: SectionBuilder, underwritingRun: UnderwritingCoreOutputRunRecord) {
  for (const result of underwritingRun.results.filter(isMaterialUnderwritingResult).sort((left, right) => left.stableOrdinal - right.stableOrdinal)) {
    sectionBuilder.add("sources_and_versions", itemFromUnderwritingResult(result));
  }
}

function addVersions(
  sectionBuilder: SectionBuilder,
  request: StrategyExplanationRequest,
  contractDefinition: StrategyExplanationContractDefinition | undefined,
  compatibility: StrategyCompatibilityResult,
  score: StrategyScoreResult,
  underwritingRun: UnderwritingCoreOutputRunRecord,
  ranking?: StrategyRankingResult,
) {
  const versionRefs = [
    contractDefinition?.semanticVersion ?? request.explanationContractVersion,
    compatibility.version,
    score.version,
    ranking?.version,
    underwritingRun.engineVersion,
  ].filter((item): item is string => Boolean(item));
  sectionBuilder.add("sources_and_versions", {
    reasonType: contractDefinition?.status === "deprecated" ? "historical_version_note" : "compatibility_reason",
    severity: contractDefinition?.status === "deprecated" ? "informational" : "positive",
    sourceSystem: "explanation_contract",
    sourceRef: STRATEGY_EXPLANATION_CONTRACT_ID,
    sourceHash: contractDefinition?.semanticVersion ?? null,
    shortText: `Explanation assembled from ${versionRefs.length} source version references.`,
    professionalText: `Version refs: ${versionRefs.join(", ")}.`,
    sourceRefs: [],
    evidenceRefs: [],
    versionRefs,
  });
}

function validateRequest(
  request: StrategyExplanationRequest,
  compatibility: StrategyCompatibilityResult,
  score: StrategyScoreResult,
  underwritingRun: UnderwritingCoreOutputRunRecord,
  ranking: StrategyRankingResult | undefined,
  contractDefinition: StrategyExplanationContractDefinition | undefined,
) {
  const errors: StrategyExplanationResult["errors"] = [];
  const add = (code: StrategyExplanationErrorCode, safeMessage: string) => errors.push({ code, safeMessage });
  if (!contractDefinition) add("explanation_contract_not_found", "The requested explanation contract is not available.");
  if (contractDefinition?.status === "disabled") add("explanation_contract_disabled", "The requested explanation contract is disabled for new assembly.");
  if (request.actorContext.membershipStatus !== "active" || request.actorContext.workspaceId !== request.workspaceId || !hasExplainPermission(request.actorContext.permissions)) {
    add("unauthorized_strategy_explanation", "The actor is not authorized to assemble this strategy explanation.");
  }
  if (request.workspaceId !== compatibility.workspaceId || request.workspaceId !== score.workspaceId || request.workspaceId !== underwritingRun.workspaceId) add("workspace_mismatch", "Source records do not share the same workspace.");
  if (request.dealId !== compatibility.dealId || request.dealId !== score.dealId || request.dealId !== underwritingRun.dealId) add("deal_mismatch", "Source records do not share the same Deal.");
  if (request.propertyId !== compatibility.propertyId || request.propertyId !== score.propertyId) add("property_mismatch", "Source records do not share the same Property.");
  if (request.underwritingSnapshotId !== compatibility.snapshotId || request.underwritingSnapshotId !== score.snapshotId || request.underwritingSnapshotId !== underwritingRun.snapshotId) add("snapshot_mismatch", "Source records do not share the same underwriting snapshot.");
  if (request.underwritingRunId !== compatibility.underwritingRunId || request.underwritingRunId !== score.underwritingRunId || request.underwritingRunId !== underwritingRun.runId) add("underwriting_run_mismatch", "Source records do not share the same underwriting run.");
  if (request.strategyId !== compatibility.strategyId || request.strategyId !== score.strategyId) add("strategy_mismatch", "Source records do not share the same strategy.");
  if (request.expectedCompatibilityResultId !== compatibility.compatibilityResultId || request.expectedCompatibilityResultHash !== compatibility.deterministicResultHash) add("compatibility_hash_mismatch", "Compatibility source hash does not match the explanation request.");
  if (request.expectedScoreResultId !== score.scoreResultId || request.expectedScoreHash !== score.deterministicScoreHash) add("score_hash_mismatch", "Score source hash does not match the explanation request.");
  if (request.expectedConfidenceHash !== computeStrategyConfidenceHash(score.confidence)) add("confidence_hash_mismatch", "Confidence source hash does not match the explanation request.");
  if (request.expectedUnderwritingResultSetHash !== underwritingRun.resultSetHash) add("underwriting_hash_mismatch", "Underwriting source hash does not match the explanation request.");
  if (ranking && (request.expectedRankingResultId !== ranking.rankingResultId || request.expectedRankingHash !== ranking.deterministicRankingHash)) add("ranking_hash_mismatch", "Ranking source hash does not match the explanation request.");
  return errors;
}

function failedExplanation(
  request: StrategyExplanationRequest,
  compatibility: StrategyCompatibilityResult,
  score: StrategyScoreResult,
  underwritingRun: UnderwritingCoreOutputRunRecord,
  ranking: StrategyRankingResult | undefined,
  contractDefinition: StrategyExplanationContractDefinition | undefined,
  errors: StrategyExplanationResult["errors"],
): StrategyExplanationResult {
  const base = {
    explanationRequestId: request.explanationRequestId,
    workspaceId: request.workspaceId,
    dealId: request.dealId,
    propertyId: request.propertyId,
    snapshotId: request.underwritingSnapshotId,
    underwritingRunId: request.underwritingRunId,
    compatibilityResultId: compatibility.compatibilityResultId,
    scoreResultId: score.scoreResultId,
    rankingResultId: ranking?.rankingResultId ?? null,
    strategyId: request.strategyId,
    strategyVersion: score.strategyVersion,
    compatibilityStatus: score.compatibilityStatus,
    scoreEligibility: score.scoreEligibility,
    overallScore: null,
    rank: null,
    confidenceLevel: score.confidence.confidenceLevel,
    confidenceScore: score.confidence.confidenceScore,
    sections: emptySections(),
    sourceHashes: sourceHashes(compatibility, score, underwritingRun, ranking),
    versionReferences: versionReferences(contractDefinition, compatibility, score, underwritingRun),
    requestedAt: request.requestedAt,
    completedAt: request.requestedAt,
    version: STRATEGY_EXPLANATION_RESULT_VERSION as typeof STRATEGY_EXPLANATION_RESULT_VERSION,
    errors,
  };
  const semanticExplanationHash = stableHash({
    hashVersion: STRATEGY_EXPLANATION_HASH_VERSION,
    ...base,
    explanationRequestId: undefined,
    requestedAt: undefined,
    completedAt: undefined,
  });
  return deepFreeze({
    explanationResultId: `strategy_explanation_failed_${semanticExplanationHash.replace(/[^a-z0-9]/gi, "").slice(0, 28)}`,
    ...base,
    semanticExplanationHash,
  });
}

type SectionBuilder = ReturnType<typeof createSectionBuilder>;

function createSectionBuilder() {
  const buckets = new Map<StrategyExplanationSectionId, StrategyExplanationItem[]>();
  for (const sectionId of strategyExplanationSectionOrder) buckets.set(sectionId, []);
  return {
    add(sectionId: StrategyExplanationSectionId, item: Omit<StrategyExplanationItem, "itemId" | "stableOrdinal">) {
      const bucket = buckets.get(sectionId);
      if (!bucket) return;
      const stableOrdinal = bucket.length + 1;
      const itemId = `${sectionId}_${stableOrdinal}_${stableHash({ sectionId, stableOrdinal, ...item }).replace(/[^a-z0-9]/gi, "").slice(0, 16)}`;
      bucket.push({ ...item, itemId, stableOrdinal });
    },
    sections() {
      return strategyExplanationSectionOrder.map((sectionId, index) => {
        const items = buckets.get(sectionId) ?? [];
        return {
          sectionId,
          title: sectionTitle(sectionId),
          stableOrdinal: index + 1,
          status: sectionStatus(sectionId, items),
          itemCount: items.length,
          items,
        };
      });
    },
  };
}

function emptySections() {
  return strategyExplanationSectionOrder.map((sectionId, index) => ({
    sectionId,
    title: sectionTitle(sectionId),
    stableOrdinal: index + 1,
    status: "not_applicable" as const,
    itemCount: 0,
    items: [],
  }));
}

function sectionStatus(sectionId: StrategyExplanationSectionId, items: StrategyExplanationItem[]): StrategyExplanationSectionStatus {
  if (!items.length) return "not_applicable";
  if (items.some((item) => item.severity === "blocking")) return "blocked";
  if (items.some((item) => item.severity === "critical" || item.severity === "caution")) return "needs_attention";
  if (sectionId === "missing_or_uncertain_information" || sectionId === "professional_verification") return "needs_attention";
  return "complete";
}

function itemFromText(
  reasonType: StrategyExplanationReasonType,
  severity: StrategyExplanationSeverity,
  sourceSystem: StrategyExplanationItem["sourceSystem"],
  sourceRef: string,
  sourceHash: string | null,
  text: string,
): Omit<StrategyExplanationItem, "itemId" | "stableOrdinal"> {
  return {
    reasonType,
    severity,
    sourceSystem,
    sourceRef,
    sourceHash,
    shortText: text,
    professionalText: text,
    sourceRefs: [],
    evidenceRefs: [],
    versionRefs: [],
  };
}

function itemFromRequirement(
  reasonType: StrategyExplanationReasonType,
  severity: StrategyExplanationSeverity,
  requirement: StrategyRequirementEvaluationResult,
): Omit<StrategyExplanationItem, "itemId" | "stableOrdinal"> {
  return {
    reasonType,
    severity,
    sourceSystem: "strategy_compatibility",
    sourceRef: requirement.requirementId,
    sourceHash: requirement.deterministicResultHash,
    shortText: requirement.explanation,
    professionalText: `${requirement.explanation} Status: ${requirement.evaluationStatus}. Inputs: ${requirement.requiredInputRefs.join(", ") || "none"}. Outputs: ${requirement.requiredOutputRefs.join(", ") || "none"}.`,
    sourceRefs: [...requirement.sourceRefs],
    evidenceRefs: [...requirement.evidenceRefs],
    versionRefs: [requirement.requirementVersion],
  };
}

function itemFromDisqualifier(
  reasonType: StrategyExplanationReasonType,
  severity: StrategyExplanationSeverity,
  disqualifier: StrategyHardDisqualifierEvaluationResult,
): Omit<StrategyExplanationItem, "itemId" | "stableOrdinal"> {
  return {
    reasonType,
    severity,
    sourceSystem: "strategy_compatibility",
    sourceRef: disqualifier.disqualifierId,
    sourceHash: disqualifier.deterministicResultHash,
    shortText: disqualifier.explanation,
    professionalText: `${disqualifier.explanation} Status: ${disqualifier.evaluationStatus}. Severity: ${disqualifier.severity}.`,
    sourceRefs: [...disqualifier.sourceRefs],
    evidenceRefs: [...disqualifier.evidenceRefs],
    versionRefs: [disqualifier.disqualifierVersion],
  };
}

function itemFromCategory(
  reasonType: StrategyExplanationReasonType,
  severity: StrategyExplanationSeverity,
  category: StrategyCategoryScore,
): Omit<StrategyExplanationItem, "itemId" | "stableOrdinal"> {
  return {
    reasonType,
    severity,
    sourceSystem: "strategy_scoring",
    sourceRef: category.categoryId,
    sourceHash: String(category.normalizedBasis),
    shortText: `${category.label}: ${category.normalizedScore}. ${category.explanation}`,
    professionalText: `${category.label}: score ${category.normalizedScore}, basis ${category.normalizedBasis}, metrics ${category.metricRefs.join(", ")}.`,
    sourceRefs: [],
    evidenceRefs: [],
    versionRefs: [STRATEGY_SCORING_RESULT_VERSION],
  };
}

function itemFromUnderwritingResult(result: UnderwritingCoreFormulaResultRecord): Omit<StrategyExplanationItem, "itemId" | "stableOrdinal"> {
  return {
    reasonType: "compatibility_reason",
    severity: result.status === "calculated" || result.status === "calculated_with_warning" ? "informational" : "caution",
    sourceSystem: "underwriting_result",
    sourceRef: result.resultId,
    sourceHash: result.deterministicHash,
    shortText: `${result.formulaId}: ${result.displayText}`,
    professionalText: `${result.formulaId} version ${result.formulaVersion}, status ${result.status}, hash ${result.deterministicHash}.`,
    sourceRefs: [...result.sourceFactIds],
    evidenceRefs: [...result.provenance.map((item) => item.evidenceId ?? item.sourceRecordId).filter((item): item is string => Boolean(item))],
    versionRefs: [result.formulaVersion, result.formulaRegistryVersion],
  };
}

function materialChangeFromRequirement(requirement: StrategyRequirementEvaluationResult): Omit<StrategyExplanationItem, "itemId" | "stableOrdinal"> {
  return {
    ...itemFromRequirement("material_change_factor", "caution", requirement),
    shortText: `${requirement.requirementId} could change the result if resolved.`,
    professionalText: `${requirement.requirementId} status ${requirement.evaluationStatus} is a material source-bound factor.`,
  };
}

function materialChangeFromDisqualifier(disqualifier: StrategyHardDisqualifierEvaluationResult): Omit<StrategyExplanationItem, "itemId" | "stableOrdinal"> {
  return {
    ...itemFromDisqualifier("material_change_factor", "blocking", disqualifier),
    shortText: `${disqualifier.disqualifierId} blocks or could change the result.`,
    professionalText: `${disqualifier.disqualifierId} status ${disqualifier.evaluationStatus} is a material source-bound factor.`,
  };
}

function isMaterialUnderwritingResult(result: UnderwritingCoreFormulaResultRecord) {
  return result.status !== "formula_not_found" && result.status !== "formula_disabled";
}

function hasExplainPermission(permissions: StrategyExplanationPermission[]) {
  return permissions.includes("strategy.explain") || permissions.includes("strategy.evaluate") || permissions.includes("strategy.read");
}

function severityForCompatibility(status: StrategyCompatibilityStatus): StrategyExplanationSeverity {
  if (status === "compatible") return "positive";
  if (status === "compatible_with_conditions" || status === "uncertain") return "caution";
  if (status === "incompatible") return "blocking";
  return "informational";
}

function labelCompatibility(status: StrategyCompatibilityStatus) {
  return status.replace(/_/g, " ");
}

function sourceHashes(
  compatibility: StrategyCompatibilityResult,
  score: StrategyScoreResult,
  underwritingRun: UnderwritingCoreOutputRunRecord,
  ranking?: StrategyRankingResult,
) {
  return {
    compatibilityResultHash: compatibility.deterministicResultHash,
    scoreHash: score.deterministicScoreHash,
    confidenceHash: computeStrategyConfidenceHash(score.confidence),
    rankingHash: ranking?.deterministicRankingHash ?? null,
    underwritingResultSetHash: underwritingRun.resultSetHash,
  };
}

function versionReferences(
  contractDefinition: StrategyExplanationContractDefinition | undefined,
  compatibility: StrategyCompatibilityResult,
  score: StrategyScoreResult,
  underwritingRun: UnderwritingCoreOutputRunRecord,
): StrategyExplanationVersionReferences {
  return {
    explanationContractVersion: contractDefinition?.semanticVersion ?? STRATEGY_EXPLANATION_CONTRACT_VERSION,
    explanationContractRegistryVersion: STRATEGY_EXPLANATION_CONTRACT_REGISTRY_VERSION,
    explanationTemplateSetVersion: STRATEGY_EXPLANATION_TEMPLATE_SET_VERSION,
    explanationTerminologyVersion: STRATEGY_EXPLANATION_TERMINOLOGY_VERSION,
    explanationSectionOrderingVersion: STRATEGY_EXPLANATION_SECTION_ORDERING_VERSION,
    explanationProfessionalBoundaryVersion: STRATEGY_EXPLANATION_PROFESSIONAL_BOUNDARY_VERSION,
    explanationResultVersion: STRATEGY_EXPLANATION_RESULT_VERSION,
    explanationHashVersion: STRATEGY_EXPLANATION_HASH_VERSION,
    confidenceHashVersion: STRATEGY_EXPLANATION_CONFIDENCE_HASH_VERSION,
    strategyRegistryVersion: STRATEGY_REGISTRY_VERSION,
    compatibilityResultVersion: compatibility.version,
    compatibilityHashVersion: STRATEGY_COMPATIBILITY_RESULT_HASH_VERSION,
    requirementRegistryVersion: compatibility.requirementRegistryVersion,
    disqualifierRegistryVersion: compatibility.disqualifierRegistryVersion,
    scoringEngineRegistryVersion: STRATEGY_SCORING_ENGINE_REGISTRY_VERSION,
    scoringResultVersion: score.version,
    scoringHashVersion: STRATEGY_SCORING_RESULT_HASH_VERSION,
    scoringWeightRegistryVersion: STRATEGY_SCORING_WEIGHT_REGISTRY_VERSION,
    confidenceModelVersion: score.confidence.modelVersion,
    rankingResultVersion: STRATEGY_RANKING_RESULT_VERSION,
    rankingHashVersion: STRATEGY_RANKING_RESULT_HASH_VERSION,
    rankingTieBreakVersion: STRATEGY_RANKING_TIE_BREAK_VERSION,
    formulaRegistryVersion: underwritingRun.formulaRegistryVersion,
    underwritingRunVersion: underwritingRun.engineVersion,
    underwritingHashVersion: underwritingRun.hashVersion,
    snapshotContractVersion: UNDERWRITING_SNAPSHOT_CONTRACT_VERSION,
  };
}

function sectionTitle(sectionId: StrategyExplanationSectionId) {
  const titles: Record<StrategyExplanationSectionId, string> = {
    result_summary: "Result Summary",
    compatibility: "Compatibility",
    hard_disqualifiers: "Hard Disqualifiers",
    conditions_and_constraints: "Conditions and Constraints",
    score_breakdown: "Score Breakdown",
    ranking_rationale: "Ranking Rationale",
    confidence_and_evidence_quality: "Confidence and Evidence Quality",
    key_strengths: "Key Strengths",
    key_weaknesses: "Key Weaknesses",
    missing_or_uncertain_information: "Missing or Uncertain Information",
    assumptions_and_preliminary_values: "Assumptions and Preliminary Values",
    sensitivity: "Sensitivity",
    professional_verification: "Professional Verification",
    what_could_change_the_result: "What Could Change the Result",
    sources_and_versions: "Sources and Versions",
  };
  return titles[sectionId];
}

function contract(
  semanticVersion: string,
  status: StrategyExplanationContractStatus,
  effectiveDate: string,
  deprecatedDate: string | null,
  replacementContractVersion: string | null,
): StrategyExplanationContractDefinition {
  return {
    contractId: STRATEGY_EXPLANATION_CONTRACT_ID,
    semanticVersion,
    registryVersion: STRATEGY_EXPLANATION_CONTRACT_REGISTRY_VERSION,
    status,
    templateSetVersion: STRATEGY_EXPLANATION_TEMPLATE_SET_VERSION,
    terminologyVersion: STRATEGY_EXPLANATION_TERMINOLOGY_VERSION,
    sectionOrderingVersion: STRATEGY_EXPLANATION_SECTION_ORDERING_VERSION,
    professionalBoundaryVersion: STRATEGY_EXPLANATION_PROFESSIONAL_BOUNDARY_VERSION,
    supportedLocales: ["en-US"],
    supportedDetailLevels: ["summary", "standard", "detailed"],
    supportedPresentationModes: ["guided", "professional"],
    supportedStrategyRegistryVersions: [STRATEGY_REGISTRY_VERSION],
    supportedCompatibilityResultVersions: [STRATEGY_COMPATIBILITY_RESULT_VERSION],
    supportedScoringResultVersions: [STRATEGY_SCORING_RESULT_VERSION],
    supportedRankingResultVersions: [STRATEGY_RANKING_RESULT_VERSION],
    effectiveDate,
    deprecatedDate,
    replacementContractVersion,
  };
}

function safeContract(version: string) {
  try {
    return resolveStrategyExplanationContractVersion(version);
  } catch {
    return undefined;
  }
}

function explanationError(code: StrategyExplanationErrorCode, safeMessage: string) {
  const error = new Error(safeMessage) as Error & { code: StrategyExplanationErrorCode };
  error.code = code;
  return error;
}

function stableHash(value: unknown) {
  const text = stableSerialize(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `strat_explain_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function stableSerialize(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "undefined";
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`)
    .join(",")}}`;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) if (child && typeof child === "object") deepFreeze(child);
  }
  return value;
}
