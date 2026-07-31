import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { strategyDefinitions } from "../core/strategyRegistry";
import {
  computeStrategyHardDisqualifierHash,
  computeStrategyHardDisqualifierRegistryHash,
  computeStrategyRequirementHash,
  computeStrategyRequirementRegistryHash,
  listStrategyHardDisqualifiers,
  listStrategyRequirementContractsForStrategy,
  listStrategyRequirements,
  resolveStrategyHardDisqualifier,
  resolveStrategyRequirement,
  strategyHardDisqualifierDefinitions,
  strategyRequirementDefinitions,
  validateStrategyRequirementRegistries,
} from "../core/strategyRequirements";

describe("strategy requirements and hard-disqualifier registries", () => {
  it("validates deterministic requirement and hard-disqualifier registry integrity", () => {
    const validation = validateStrategyRequirementRegistries();
    const activeStrategyCount = strategyDefinitions.filter((definition) => definition.lifecycleStatus === "active").length;

    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(validation.requirementCount).toBeGreaterThanOrEqual(activeStrategyCount * 2);
    expect(validation.disqualifierCount).toBe(activeStrategyCount * 3);
    expect(strategyRequirementDefinitions).toEqual([...strategyRequirementDefinitions].sort((a, b) => a.stableOrdinal - b.stableOrdinal || a.requirementId.localeCompare(b.requirementId)));
    expect(strategyHardDisqualifierDefinitions).toEqual([...strategyHardDisqualifierDefinitions].sort((a, b) => a.stableOrdinal - b.stableOrdinal || a.disqualifierId.localeCompare(b.disqualifierId)));
  });

  it("uses permanent IDs, semantic versions, lifecycle state, severities, and blocking classifications", () => {
    expect(strategyRequirementDefinitions.every((definition) => /^strategy_requirement\.[a-z][a-z0-9_]*(\.[a-z0-9][a-z0-9_]*)+$/.test(definition.requirementId))).toBe(true);
    expect(strategyHardDisqualifierDefinitions.every((definition) => /^strategy_disqualifier\.[a-z][a-z0-9_]*(\.[a-z0-9][a-z0-9_]*)+$/.test(definition.disqualifierId))).toBe(true);
    expect(strategyRequirementDefinitions.every((definition) => /^\d+\.\d+\.\d+$/.test(definition.semanticVersion))).toBe(true);
    expect(strategyHardDisqualifierDefinitions.every((definition) => ["critical", "high", "moderate"].includes(definition.severity))).toBe(true);
    expect(new Set(strategyRequirementDefinitions.map((definition) => `${definition.requirementId}@${definition.semanticVersion}`)).size).toBe(strategyRequirementDefinitions.length);
    expect(new Set(strategyHardDisqualifierDefinitions.map((definition) => `${definition.disqualifierId}@${definition.semanticVersion}`)).size).toBe(strategyHardDisqualifierDefinitions.length);
  });

  it("resolves requirements and hard disqualifiers for a permanent strategy without evaluating them", () => {
    const contracts = listStrategyRequirementContractsForStrategy("residential.brrrr");
    const inputRequirement = resolveStrategyRequirement("strategy_requirement.residential_brrrr.canonical_inputs");
    const underwritingDisqualifier = resolveStrategyHardDisqualifier("strategy_disqualifier.residential_brrrr.required_underwriting_unavailable");

    expect(contracts.strategyId).toBe("residential.brrrr");
    expect(contracts.requirements.map((definition) => definition.requirementId)).toContain("strategy_requirement.residential_brrrr.canonical_inputs");
    expect(contracts.hardDisqualifiers.map((definition) => definition.disqualifierId)).toContain("strategy_disqualifier.residential_brrrr.property_profile_ineligible");
    expect(inputRequirement.requiredCanonicalInputIds).toContain("initial_repairs");
    expect(inputRequirement.blockingClassification).toBe("blocking");
    expect(underwritingDisqualifier.triggeringDependency.dependencyType).toBe("underwriting_output");
    expect(underwritingDisqualifier.blockingClassification).toBe("data_quality_block");
  });

  it("reuses canonical strategy, input, and underwriting output references", () => {
    const strategyIds = new Set(strategyDefinitions.map((definition) => definition.strategyId));
    const rentalRequirements = listStrategyRequirements({ strategyId: "residential.long_term_rental", includeInformational: true });
    const retailDisqualifiers = listStrategyHardDisqualifiers({ strategyId: "commercial.retail_nnn" });

    expect(rentalRequirements.every((definition) => definition.owningStrategyIds.every((strategyId) => strategyIds.has(strategyId)))).toBe(true);
    expect(rentalRequirements.some((definition) => definition.requiredCanonicalInputIds.includes("scheduled_income_monthly"))).toBe(true);
    expect(rentalRequirements.some((definition) => definition.requiredUnderwritingOutputIds.includes("net_operating_income"))).toBe(true);
    expect(retailDisqualifiers.some((definition) => definition.triggeringDependency.futureDependencyId === "governance-legal-clearance")).toBe(true);
  });

  it("keeps deterministic hashes stable and changes hashes for material contract changes", () => {
    const requirement = resolveStrategyRequirement("strategy_requirement.residential_brrrr.canonical_inputs");
    const disqualifier = resolveStrategyHardDisqualifier("strategy_disqualifier.residential_brrrr.property_profile_ineligible");
    const displayOnlyChange = {
      ...requirement,
      explanationMetadata: { ...requirement.explanationMetadata, plainLanguagePurpose: "Copy change only." },
    };
    const materialRequirementChange = {
      ...requirement,
      requiredCanonicalInputIds: [...requirement.requiredCanonicalInputIds, "hoa" as const],
    };
    const materialDisqualifierChange = {
      ...disqualifier,
      severity: "moderate" as const,
    };

    expect(computeStrategyRequirementHash(requirement)).toBe(requirement.deterministicHash);
    expect(computeStrategyRequirementHash(displayOnlyChange)).toBe(requirement.deterministicHash);
    expect(computeStrategyRequirementHash(materialRequirementChange)).not.toBe(requirement.deterministicHash);
    expect(computeStrategyHardDisqualifierHash(materialDisqualifierChange)).not.toBe(disqualifier.deterministicHash);
    expect(computeStrategyRequirementRegistryHash(strategyRequirementDefinitions)).toBe(computeStrategyRequirementRegistryHash([...strategyRequirementDefinitions].reverse()));
    expect(computeStrategyHardDisqualifierRegistryHash(strategyHardDisqualifierDefinitions)).not.toBe(computeStrategyHardDisqualifierRegistryHash(strategyHardDisqualifierDefinitions.slice(1)));
  });

  it("fails closed for duplicates, orphan strategy references, invalid canonical references, and invalid hashes", () => {
    const requirement = resolveStrategyRequirement("strategy_requirement.residential_brrrr.canonical_inputs");
    const disqualifier = resolveStrategyHardDisqualifier("strategy_disqualifier.residential_brrrr.property_profile_ineligible");
    const duplicateRequirement = { ...requirement, stableOrdinal: 999999 };
    const orphanRequirement = {
      ...requirement,
      requirementId: "strategy_requirement.test.orphan",
      owningStrategyIds: ["missing.strategy"],
      owningStrategyVersionRefs: [{ strategyId: "missing.strategy", semanticVersion: "1.0.0" }],
      stableOrdinal: 1000000,
      deterministicHash: "temporary",
    };
    const invalidInputRequirement = {
      ...requirement,
      requirementId: "strategy_requirement.test.invalid_input",
      requiredCanonicalInputIds: ["not_real" as never],
      stableOrdinal: 1000001,
      deterministicHash: "temporary",
    };
    const invalidDisqualifier = {
      ...disqualifier,
      disqualifierId: "strategy_disqualifier.test.invalid_output",
      triggeringDependency: { dependencyType: "underwriting_output" as const, underwritingOutputId: "not_real" as never },
      stableOrdinal: 1000002,
      deterministicHash: "temporary",
    };
    orphanRequirement.deterministicHash = computeStrategyRequirementHash(orphanRequirement);
    invalidInputRequirement.deterministicHash = computeStrategyRequirementHash(invalidInputRequirement);
    invalidDisqualifier.deterministicHash = computeStrategyHardDisqualifierHash(invalidDisqualifier);

    const validation = validateStrategyRequirementRegistries(
      [...strategyRequirementDefinitions, duplicateRequirement, orphanRequirement, invalidInputRequirement],
      [...strategyHardDisqualifierDefinitions, invalidDisqualifier],
    );

    expect(validation.valid).toBe(false);
    expect(validation.errors.some((error) => error.includes("Duplicate requirement ID/version"))).toBe(true);
    expect(validation.errors.some((error) => error.includes("Orphan strategy reference"))).toBe(true);
    expect(validation.errors.some((error) => error.includes("Invalid canonical input reference"))).toBe(true);
    expect(validation.errors.some((error) => error.includes("Invalid disqualifier output reference"))).toBe(true);
  });

  it("keeps the contract layer runtime-neutral and free of evaluation, scoring, ranking, AI, UI, and network behavior", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src", "core", "strategyRequirements.ts"), "utf8");

    expect(source).not.toMatch(/from\s+["']react["']/i);
    expect(source).not.toMatch(/SwiftUI|UIKit|ViewBuilder|JSX/i);
    expect(source).not.toMatch(/\bfetch\s*\(|supabase\.|OpenAI|ai\./i);
    expect(source).not.toMatch(/\bevaluate[A-Z]|\bexecute[A-Z]|\brank[A-Z]|\bscore[A-Z]|\brecommend/i);
    expect(source).not.toMatch(/\bexecuteFormula\b|\bbuildUnderwritingCoreOutputRun\b|\bDecisionCockpit\b/i);
  });
});
