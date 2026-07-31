import { resolveFormulaDefinition, type FormulaId } from "./formulaRegistry";
import {
  listUnderwritingInputDefinitions,
  type UnderwritingInputId,
} from "./underwritingInputSchemas";
import {
  STRATEGY_REGISTRY_VERSION,
  resolveStrategyDefinition,
  strategyDefinitions,
  type StrategyDefinition,
  type StrategyLifecycleStatus,
} from "./strategyRegistry";

export const STRATEGY_REQUIREMENT_REGISTRY_VERSION = "strategy-requirement-registry-v1";
export const STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION = "strategy-hard-disqualifier-registry-v1";

export type StrategyRequirementDependencyClassification =
  | "canonical_input"
  | "underwriting_output"
  | "market_dependency"
  | "financing_dependency"
  | "governance_legal_dependency"
  | "property_condition_dependency"
  | "investor_fit_dependency";

export type StrategyRequirementBlockingClassification = "blocking" | "informational";
export type StrategyDisqualifierSeverity = "critical" | "high" | "moderate";
export type StrategyDisqualifierBlockingClassification = "hard_block" | "professional_review_block" | "data_quality_block";

export type StrategyRequirementExplanationMetadata = {
  hookId: string;
  hookVersion: "pending";
  plainLanguagePurpose: string;
};

export type StrategyRequirementRemediationMetadata = {
  hookId: string;
  hookVersion: "pending";
  actionCategory: "collect_data" | "verify_source" | "professional_review" | "resolve_conflict";
};

export type StrategyRequirementDefinition = {
  requirementId: string;
  semanticVersion: string;
  registryVersion: typeof STRATEGY_REQUIREMENT_REGISTRY_VERSION;
  owningStrategyIds: string[];
  owningStrategyVersionRefs: Array<{ strategyId: string; semanticVersion: string }>;
  requiredCanonicalInputIds: UnderwritingInputId[];
  requiredUnderwritingOutputIds: FormulaId[];
  dependencyClassifications: StrategyRequirementDependencyClassification[];
  blockingClassification: StrategyRequirementBlockingClassification;
  explanationMetadata: StrategyRequirementExplanationMetadata;
  remediationMetadata: StrategyRequirementRemediationMetadata;
  lifecycleStatus: StrategyLifecycleStatus;
  stableOrdinal: number;
  deterministicHash: string;
};

export type StrategyHardDisqualifierDefinition = {
  disqualifierId: string;
  semanticVersion: string;
  registryVersion: typeof STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION;
  owningStrategyIds: string[];
  owningStrategyVersionRefs: Array<{ strategyId: string; semanticVersion: string }>;
  triggeringDependency: {
    dependencyType: StrategyRequirementDependencyClassification;
    canonicalInputId?: UnderwritingInputId;
    underwritingOutputId?: FormulaId;
    futureDependencyId?: string;
  };
  severity: StrategyDisqualifierSeverity;
  blockingClassification: StrategyDisqualifierBlockingClassification;
  explanationHook: { hookId: string; hookVersion: "pending" };
  remediationHook: { hookId: string; hookVersion: "pending"; actionCategory: StrategyRequirementRemediationMetadata["actionCategory"] };
  lifecycleStatus: StrategyLifecycleStatus;
  stableOrdinal: number;
  deterministicHash: string;
};

export type StrategyRequirementRegistryValidationResult = {
  valid: boolean;
  requirementRegistryVersion: typeof STRATEGY_REQUIREMENT_REGISTRY_VERSION;
  disqualifierRegistryVersion: typeof STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION;
  requirementCount: number;
  disqualifierCount: number;
  requirementContentHash: string;
  disqualifierContentHash: string;
  errors: string[];
};

export class StrategyRequirementRegistryError extends Error {
  constructor(
    public readonly code:
      | "requirement_not_found"
      | "disqualifier_not_found"
      | "invalid_requirement_id"
      | "invalid_disqualifier_id"
      | "invalid_semantic_version"
      | "duplicate_requirement"
      | "duplicate_disqualifier"
      | "orphan_strategy_reference"
      | "invalid_canonical_reference"
      | "invalid_hash"
      | "registry_invalid"
      | "internal_registry_error",
    message: string,
  ) {
    super(message);
    this.name = "StrategyRequirementRegistryError";
  }
}

type RequirementSeed = Omit<StrategyRequirementDefinition, "registryVersion" | "deterministicHash">;
type DisqualifierSeed = Omit<StrategyHardDisqualifierDefinition, "registryVersion" | "deterministicHash">;

const activeStrategyDefinitions = strategyDefinitions.filter((definition) => definition.lifecycleStatus === "active");

export const strategyRequirementDefinitions: readonly StrategyRequirementDefinition[] = Object.freeze(
  activeStrategyDefinitions.flatMap(buildRequirementSeeds).map(materializeRequirement).sort(compareRequirements),
);

export const strategyHardDisqualifierDefinitions: readonly StrategyHardDisqualifierDefinition[] = Object.freeze(
  activeStrategyDefinitions.flatMap(buildHardDisqualifierSeeds).map(materializeDisqualifier).sort(compareDisqualifiers),
);

const requirementsByKey = new Map(strategyRequirementDefinitions.map((definition) => [versionKey(definition.requirementId, definition.semanticVersion), definition]));
const disqualifiersByKey = new Map(strategyHardDisqualifierDefinitions.map((definition) => [versionKey(definition.disqualifierId, definition.semanticVersion), definition]));

export function listStrategyRequirements(options: { strategyId?: string; includeInformational?: boolean } = {}) {
  return strategyRequirementDefinitions
    .filter((definition) => (!options.strategyId || definition.owningStrategyIds.includes(options.strategyId)) && (options.includeInformational || definition.blockingClassification === "blocking"))
    .sort(compareRequirements);
}

export function listStrategyHardDisqualifiers(options: { strategyId?: string } = {}) {
  return strategyHardDisqualifierDefinitions
    .filter((definition) => !options.strategyId || definition.owningStrategyIds.includes(options.strategyId))
    .sort(compareDisqualifiers);
}

export function resolveStrategyRequirement(requirementId: string, semanticVersion = "1.0.0") {
  if (!isValidPermanentContractId(requirementId, "strategy_requirement")) {
    throw new StrategyRequirementRegistryError("invalid_requirement_id", "The requirement identifier is not valid.");
  }
  if (!isValidSemver(semanticVersion)) throw new StrategyRequirementRegistryError("invalid_semantic_version", "The requirement version is not a valid semantic version.");
  const definition = requirementsByKey.get(versionKey(requirementId, semanticVersion));
  if (!definition) throw new StrategyRequirementRegistryError("requirement_not_found", "The requested strategy requirement was not found.");
  return definition;
}

export function resolveStrategyHardDisqualifier(disqualifierId: string, semanticVersion = "1.0.0") {
  if (!isValidPermanentContractId(disqualifierId, "strategy_disqualifier")) {
    throw new StrategyRequirementRegistryError("invalid_disqualifier_id", "The hard-disqualifier identifier is not valid.");
  }
  if (!isValidSemver(semanticVersion)) throw new StrategyRequirementRegistryError("invalid_semantic_version", "The hard-disqualifier version is not a valid semantic version.");
  const definition = disqualifiersByKey.get(versionKey(disqualifierId, semanticVersion));
  if (!definition) throw new StrategyRequirementRegistryError("disqualifier_not_found", "The requested strategy hard disqualifier was not found.");
  return definition;
}

export function listStrategyRequirementContractsForStrategy(strategyId: string) {
  const strategy = resolveStrategyDefinition(strategyId);
  return {
    strategyId: strategy.strategyId,
    strategyVersion: strategy.semanticVersion,
    strategyRegistryVersion: STRATEGY_REGISTRY_VERSION,
    requirements: listStrategyRequirements({ strategyId: strategy.strategyId, includeInformational: true }),
    hardDisqualifiers: listStrategyHardDisqualifiers({ strategyId: strategy.strategyId }),
  };
}

export function validateStrategyRequirementRegistries(
  requirements: readonly StrategyRequirementDefinition[] = strategyRequirementDefinitions,
  disqualifiers: readonly StrategyHardDisqualifierDefinition[] = strategyHardDisqualifierDefinitions,
): StrategyRequirementRegistryValidationResult {
  const errors: string[] = [];
  const inputIds = new Set(listUnderwritingInputDefinitions().map((definition) => definition.inputId));
  const strategyKeys = new Set(strategyDefinitions.map((definition) => versionKey(definition.strategyId, definition.semanticVersion)));
  const requirementKeys = new Set<string>();
  const disqualifierKeys = new Set<string>();
  const requirementOrdinals = new Set<number>();
  const disqualifierOrdinals = new Set<number>();

  for (const definition of requirements) {
    const key = versionKey(definition.requirementId, definition.semanticVersion);
    if (!isValidPermanentContractId(definition.requirementId, "strategy_requirement")) errors.push(`Invalid requirement ID: ${definition.requirementId}.`);
    if (!isValidSemver(definition.semanticVersion)) errors.push(`Invalid requirement version: ${key}.`);
    if (requirementKeys.has(key)) errors.push(`Duplicate requirement ID/version: ${key}.`);
    requirementKeys.add(key);
    if (requirementOrdinals.has(definition.stableOrdinal)) errors.push(`Duplicate requirement stable ordinal: ${definition.stableOrdinal}.`);
    requirementOrdinals.add(definition.stableOrdinal);
    if (definition.deterministicHash !== computeStrategyRequirementHash(definition)) errors.push(`Requirement hash mismatch: ${key}.`);
    validateOwnerReferences(definition.owningStrategyVersionRefs, strategyKeys, errors, key);
    validateCanonicalInputs(definition.requiredCanonicalInputIds, inputIds, errors, key);
    validateFormulaOutputs(definition.requiredUnderwritingOutputIds, errors, key);
    if (definition.owningStrategyIds.length === 0) errors.push(`Requirement has no owning strategy: ${key}.`);
    if (definition.dependencyClassifications.length === 0) errors.push(`Requirement has no dependency classification: ${key}.`);
  }

  for (const definition of disqualifiers) {
    const key = versionKey(definition.disqualifierId, definition.semanticVersion);
    if (!isValidPermanentContractId(definition.disqualifierId, "strategy_disqualifier")) errors.push(`Invalid disqualifier ID: ${definition.disqualifierId}.`);
    if (!isValidSemver(definition.semanticVersion)) errors.push(`Invalid disqualifier version: ${key}.`);
    if (disqualifierKeys.has(key)) errors.push(`Duplicate disqualifier ID/version: ${key}.`);
    disqualifierKeys.add(key);
    if (disqualifierOrdinals.has(definition.stableOrdinal)) errors.push(`Duplicate disqualifier stable ordinal: ${definition.stableOrdinal}.`);
    disqualifierOrdinals.add(definition.stableOrdinal);
    if (definition.deterministicHash !== computeStrategyHardDisqualifierHash(definition)) errors.push(`Disqualifier hash mismatch: ${key}.`);
    validateOwnerReferences(definition.owningStrategyVersionRefs, strategyKeys, errors, key);
    if (definition.triggeringDependency.canonicalInputId && !inputIds.has(definition.triggeringDependency.canonicalInputId)) errors.push(`Invalid disqualifier input reference ${definition.triggeringDependency.canonicalInputId} for ${key}.`);
    if (definition.triggeringDependency.underwritingOutputId && !resolveFormulaDefinition(definition.triggeringDependency.underwritingOutputId)) errors.push(`Invalid disqualifier output reference ${definition.triggeringDependency.underwritingOutputId} for ${key}.`);
    if (!definition.triggeringDependency.canonicalInputId && !definition.triggeringDependency.underwritingOutputId && !definition.triggeringDependency.futureDependencyId) errors.push(`Disqualifier has no triggering dependency: ${key}.`);
  }

  if (requirements.some((definition, index) => definition !== [...requirements].sort(compareRequirements)[index])) errors.push("Requirement registry is not stored in deterministic order.");
  if (disqualifiers.some((definition, index) => definition !== [...disqualifiers].sort(compareDisqualifiers)[index])) errors.push("Hard-disqualifier registry is not stored in deterministic order.");

  return {
    valid: errors.length === 0,
    requirementRegistryVersion: STRATEGY_REQUIREMENT_REGISTRY_VERSION,
    disqualifierRegistryVersion: STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION,
    requirementCount: requirements.length,
    disqualifierCount: disqualifiers.length,
    requirementContentHash: computeStrategyRequirementRegistryHash(requirements),
    disqualifierContentHash: computeStrategyHardDisqualifierRegistryHash(disqualifiers),
    errors,
  };
}

export function assertValidStrategyRequirementRegistries() {
  const validation = validateStrategyRequirementRegistries();
  if (!validation.valid) throw new StrategyRequirementRegistryError("registry_invalid", validation.errors.join(" "));
  return validation;
}

export function computeStrategyRequirementHash(definition: Omit<StrategyRequirementDefinition, "deterministicHash"> | StrategyRequirementDefinition) {
  return stableHash({
    requirementId: definition.requirementId,
    semanticVersion: definition.semanticVersion,
    owningStrategyVersionRefs: [...definition.owningStrategyVersionRefs].sort(compareStrategyVersionRefs),
    requiredCanonicalInputIds: sortedStrings(definition.requiredCanonicalInputIds),
    requiredUnderwritingOutputIds: sortedStrings(definition.requiredUnderwritingOutputIds),
    dependencyClassifications: sortedStrings(definition.dependencyClassifications),
    blockingClassification: definition.blockingClassification,
    explanationHookId: definition.explanationMetadata.hookId,
    remediationHookId: definition.remediationMetadata.hookId,
    remediationActionCategory: definition.remediationMetadata.actionCategory,
    lifecycleStatus: definition.lifecycleStatus,
    stableOrdinal: definition.stableOrdinal,
  });
}

export function computeStrategyHardDisqualifierHash(definition: Omit<StrategyHardDisqualifierDefinition, "deterministicHash"> | StrategyHardDisqualifierDefinition) {
  return stableHash({
    disqualifierId: definition.disqualifierId,
    semanticVersion: definition.semanticVersion,
    owningStrategyVersionRefs: [...definition.owningStrategyVersionRefs].sort(compareStrategyVersionRefs),
    triggeringDependency: definition.triggeringDependency,
    severity: definition.severity,
    blockingClassification: definition.blockingClassification,
    explanationHookId: definition.explanationHook.hookId,
    remediationHookId: definition.remediationHook.hookId,
    remediationActionCategory: definition.remediationHook.actionCategory,
    lifecycleStatus: definition.lifecycleStatus,
    stableOrdinal: definition.stableOrdinal,
  });
}

export function computeStrategyRequirementRegistryHash(requirements: readonly StrategyRequirementDefinition[] = strategyRequirementDefinitions) {
  return stableHash([...requirements].map((definition) => ({ requirementId: definition.requirementId, semanticVersion: definition.semanticVersion, deterministicHash: definition.deterministicHash })).sort((a, b) => a.requirementId.localeCompare(b.requirementId) || compareSemver(a.semanticVersion, b.semanticVersion)));
}

export function computeStrategyHardDisqualifierRegistryHash(disqualifiers: readonly StrategyHardDisqualifierDefinition[] = strategyHardDisqualifierDefinitions) {
  return stableHash([...disqualifiers].map((definition) => ({ disqualifierId: definition.disqualifierId, semanticVersion: definition.semanticVersion, deterministicHash: definition.deterministicHash })).sort((a, b) => a.disqualifierId.localeCompare(b.disqualifierId) || compareSemver(a.semanticVersion, b.semanticVersion)));
}

function buildRequirementSeeds(strategy: StrategyDefinition): RequirementSeed[] {
  const owner = ownerRef(strategy);
  const seeds: RequirementSeed[] = [];
  if (strategy.requiredCanonicalInputIds.length > 0) {
    seeds.push({
      requirementId: `strategy_requirement.${strategy.machineKey}.canonical_inputs`,
      semanticVersion: "1.0.0",
      owningStrategyIds: [strategy.strategyId],
      owningStrategyVersionRefs: [owner],
      requiredCanonicalInputIds: [...strategy.requiredCanonicalInputIds],
      requiredUnderwritingOutputIds: [],
      dependencyClassifications: ["canonical_input"],
      blockingClassification: "blocking",
      explanationMetadata: explanation(`strategy_requirement.${strategy.machineKey}.canonical_inputs`),
      remediationMetadata: remediation(`strategy_requirement.${strategy.machineKey}.canonical_inputs`, "collect_data"),
      lifecycleStatus: strategy.lifecycleStatus,
      stableOrdinal: strategy.stableOrdinal * 10,
    });
  }
  if (strategy.requiredUnderwritingOutputIds.length > 0) {
    seeds.push({
      requirementId: `strategy_requirement.${strategy.machineKey}.underwriting_outputs`,
      semanticVersion: "1.0.0",
      owningStrategyIds: [strategy.strategyId],
      owningStrategyVersionRefs: [owner],
      requiredCanonicalInputIds: [],
      requiredUnderwritingOutputIds: [...strategy.requiredUnderwritingOutputIds],
      dependencyClassifications: ["underwriting_output"],
      blockingClassification: "blocking",
      explanationMetadata: explanation(`strategy_requirement.${strategy.machineKey}.underwriting_outputs`),
      remediationMetadata: remediation(`strategy_requirement.${strategy.machineKey}.underwriting_outputs`, "verify_source"),
      lifecycleStatus: strategy.lifecycleStatus,
      stableOrdinal: strategy.stableOrdinal * 10 + 1,
    });
  }
  seeds.push({
    requirementId: `strategy_requirement.${strategy.machineKey}.future_context`,
    semanticVersion: "1.0.0",
    owningStrategyIds: [strategy.strategyId],
    owningStrategyVersionRefs: [owner],
    requiredCanonicalInputIds: [],
    requiredUnderwritingOutputIds: [],
    dependencyClassifications: sortedUnique([
      ...(strategy.futureMarketDependencies.length ? ["market_dependency" as const] : []),
      ...(strategy.futureFinancingDependencies.length ? ["financing_dependency" as const] : []),
      ...(strategy.futureGovernanceLegalDependencies.length ? ["governance_legal_dependency" as const] : []),
      ...(strategy.futurePropertyConditionDependencies.length ? ["property_condition_dependency" as const] : []),
      ...(strategy.futureInvestorFitDependencies.length ? ["investor_fit_dependency" as const] : []),
    ]),
    blockingClassification: "informational",
    explanationMetadata: explanation(`strategy_requirement.${strategy.machineKey}.future_context`),
    remediationMetadata: remediation(`strategy_requirement.${strategy.machineKey}.future_context`, "professional_review"),
    lifecycleStatus: strategy.lifecycleStatus,
    stableOrdinal: strategy.stableOrdinal * 10 + 2,
  });
  return seeds;
}

function buildHardDisqualifierSeeds(strategy: StrategyDefinition): DisqualifierSeed[] {
  const owner = ownerRef(strategy);
  return [
    {
      disqualifierId: `strategy_disqualifier.${strategy.machineKey}.property_profile_ineligible`,
      semanticVersion: "1.0.0",
      owningStrategyIds: [strategy.strategyId],
      owningStrategyVersionRefs: [owner],
      triggeringDependency: { dependencyType: "canonical_input", canonicalInputId: "property_type" },
      severity: "critical",
      blockingClassification: "hard_block",
      explanationHook: { hookId: `strategy_disqualifier.${strategy.machineKey}.property_profile_ineligible.explanation`, hookVersion: "pending" },
      remediationHook: { hookId: `strategy_disqualifier.${strategy.machineKey}.property_profile_ineligible.remediation`, hookVersion: "pending", actionCategory: "verify_source" },
      lifecycleStatus: strategy.lifecycleStatus,
      stableOrdinal: strategy.stableOrdinal * 10,
    },
    {
      disqualifierId: `strategy_disqualifier.${strategy.machineKey}.legal_or_governance_prohibition`,
      semanticVersion: "1.0.0",
      owningStrategyIds: [strategy.strategyId],
      owningStrategyVersionRefs: [owner],
      triggeringDependency: { dependencyType: "governance_legal_dependency", futureDependencyId: firstFutureDependency(strategy.futureGovernanceLegalDependencies, "governance-legal-clearance") },
      severity: strategy.category === "transaction_structure" || strategy.category === "development" || strategy.category === "tax_or_exchange" ? "critical" : "high",
      blockingClassification: "professional_review_block",
      explanationHook: { hookId: `strategy_disqualifier.${strategy.machineKey}.legal_or_governance_prohibition.explanation`, hookVersion: "pending" },
      remediationHook: { hookId: `strategy_disqualifier.${strategy.machineKey}.legal_or_governance_prohibition.remediation`, hookVersion: "pending", actionCategory: "professional_review" },
      lifecycleStatus: strategy.lifecycleStatus,
      stableOrdinal: strategy.stableOrdinal * 10 + 1,
    },
    {
      disqualifierId: `strategy_disqualifier.${strategy.machineKey}.required_underwriting_unavailable`,
      semanticVersion: "1.0.0",
      owningStrategyIds: [strategy.strategyId],
      owningStrategyVersionRefs: [owner],
      triggeringDependency: strategy.requiredUnderwritingOutputIds[0]
        ? { dependencyType: "underwriting_output", underwritingOutputId: strategy.requiredUnderwritingOutputIds[0] }
        : { dependencyType: "canonical_input", canonicalInputId: strategy.requiredCanonicalInputIds[0] ?? "property_type" },
      severity: "high",
      blockingClassification: "data_quality_block",
      explanationHook: { hookId: `strategy_disqualifier.${strategy.machineKey}.required_underwriting_unavailable.explanation`, hookVersion: "pending" },
      remediationHook: { hookId: `strategy_disqualifier.${strategy.machineKey}.required_underwriting_unavailable.remediation`, hookVersion: "pending", actionCategory: "collect_data" },
      lifecycleStatus: strategy.lifecycleStatus,
      stableOrdinal: strategy.stableOrdinal * 10 + 2,
    },
  ];
}

function materializeRequirement(seed: RequirementSeed): StrategyRequirementDefinition {
  const base = { ...seed, registryVersion: STRATEGY_REQUIREMENT_REGISTRY_VERSION as typeof STRATEGY_REQUIREMENT_REGISTRY_VERSION };
  return { ...base, deterministicHash: computeStrategyRequirementHash(base) };
}

function materializeDisqualifier(seed: DisqualifierSeed): StrategyHardDisqualifierDefinition {
  const base = { ...seed, registryVersion: STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION as typeof STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION };
  return { ...base, deterministicHash: computeStrategyHardDisqualifierHash(base) };
}

function ownerRef(strategy: StrategyDefinition) {
  return { strategyId: strategy.strategyId, semanticVersion: strategy.semanticVersion };
}

function explanation(baseId: string): StrategyRequirementExplanationMetadata {
  return {
    hookId: `${baseId}.explanation`,
    hookVersion: "pending",
    plainLanguagePurpose: "Future Strategy Intelligence will use this contract to explain why this dependency matters. This slice defines the contract only.",
  };
}

function remediation(baseId: string, actionCategory: StrategyRequirementRemediationMetadata["actionCategory"]): StrategyRequirementRemediationMetadata {
  return { hookId: `${baseId}.remediation`, hookVersion: "pending", actionCategory };
}

function validateOwnerReferences(refs: Array<{ strategyId: string; semanticVersion: string }>, strategyKeys: Set<string>, errors: string[], parentKey: string) {
  if (refs.length === 0) errors.push(`Missing owning strategy reference for ${parentKey}.`);
  for (const ref of refs) {
    if (!strategyKeys.has(versionKey(ref.strategyId, ref.semanticVersion))) errors.push(`Orphan strategy reference ${versionKey(ref.strategyId, ref.semanticVersion)} for ${parentKey}.`);
  }
}

function validateCanonicalInputs(inputIds: readonly UnderwritingInputId[], validInputIds: Set<string>, errors: string[], parentKey: string) {
  for (const inputId of inputIds) if (!validInputIds.has(inputId)) errors.push(`Invalid canonical input reference ${inputId} for ${parentKey}.`);
}

function validateFormulaOutputs(outputIds: readonly FormulaId[], errors: string[], parentKey: string) {
  for (const outputId of outputIds) if (!resolveFormulaDefinition(outputId)) errors.push(`Invalid underwriting output reference ${outputId} for ${parentKey}.`);
}

function firstFutureDependency(values: readonly string[], fallback: string) {
  return values[0] ?? fallback;
}

function isValidPermanentContractId(value: string, prefix: "strategy_requirement" | "strategy_disqualifier") {
  return new RegExp(`^${prefix}\\.[a-z][a-z0-9_]*(\\.[a-z0-9][a-z0-9_]*)+$`).test(value);
}

function isValidSemver(value: string) {
  return /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value);
}

function compareRequirements(a: StrategyRequirementDefinition, b: StrategyRequirementDefinition) {
  return a.stableOrdinal - b.stableOrdinal || a.requirementId.localeCompare(b.requirementId) || compareSemver(a.semanticVersion, b.semanticVersion);
}

function compareDisqualifiers(a: StrategyHardDisqualifierDefinition, b: StrategyHardDisqualifierDefinition) {
  return a.stableOrdinal - b.stableOrdinal || a.disqualifierId.localeCompare(b.disqualifierId) || compareSemver(a.semanticVersion, b.semanticVersion);
}

function compareStrategyVersionRefs(a: { strategyId: string; semanticVersion: string }, b: { strategyId: string; semanticVersion: string }) {
  return a.strategyId.localeCompare(b.strategyId) || compareSemver(a.semanticVersion, b.semanticVersion);
}

function compareSemver(a: string, b: string) {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

function versionKey(id: string, semanticVersion: string) {
  return `${id}@${semanticVersion}`;
}

function sortedUnique<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function sortedStrings(values: readonly string[]) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function stableHash(value: unknown) {
  const source = stableStringify(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `strat_req_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

assertValidStrategyRequirementRegistries();
