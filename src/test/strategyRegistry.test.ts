import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertStrategySelectable,
  computeStrategyMetadataHash,
  computeStrategyRegistryHash,
  getStrategyLookup,
  identifyReplacementStrategy,
  inspectHistoricalStrategyVersion,
  listStrategiesByCategory,
  listStrategiesByPropertyProfile,
  listStrategiesBySupportStatus,
  listStrategyDefinitions,
  loadStrategyDependencyMetadata,
  resolveLegacyStrategyAlias,
  resolveLatestActiveStrategyDefinition,
  resolveStrategyDefinition,
  strategyDefinitions,
  validateStrategyRegistry,
  StrategyRegistryError,
} from "../core/strategyRegistry";

describe("permanent strategy registry", () => {
  it("stores unique permanent IDs, versions, aliases, and ordinals in deterministic order", () => {
    const validation = validateStrategyRegistry();

    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(validation.definitionCount).toBeGreaterThanOrEqual(60);
    expect(strategyDefinitions).toEqual([...strategyDefinitions].sort((a, b) => a.stableOrdinal - b.stableOrdinal || a.strategyId.localeCompare(b.strategyId)));
    expect(new Set(strategyDefinitions.map((definition) => `${definition.strategyId}@${definition.semanticVersion}`)).size).toBe(strategyDefinitions.length);
    expect(new Set(strategyDefinitions.map((definition) => definition.stableOrdinal)).size).toBe(strategyDefinitions.length);
    expect(strategyDefinitions.every((definition) => /^[a-z][a-z0-9_]*(\.[a-z0-9][a-z0-9_]*)+$/.test(definition.strategyId))).toBe(true);
    expect(strategyDefinitions.every((definition) => /^\d+\.\d+\.\d+$/.test(definition.semanticVersion))).toBe(true);
  });

  it("covers the documented residential, multifamily, commercial, specialty, land, development, distressed, transaction, tax, and partnership scope", () => {
    const ids = new Set(strategyDefinitions.map((definition) => definition.strategyId));
    const categories = new Set(strategyDefinitions.map((definition) => definition.category));

    expect(categories).toEqual(new Set(["residential", "multifamily", "commercial", "specialty", "land", "development", "distressed", "transaction_structure", "tax_or_exchange", "portfolio_or_partnership"]));
    [
      "residential.long_term_rental",
      "residential.house_hack",
      "residential.brrrr",
      "residential.fix_and_flip",
      "residential.owner_occupied",
      "multifamily.stabilized_hold",
      "commercial.retail_nnn",
      "commercial.owner_user",
      "commercial.mixed_use",
      "specialty.self_storage",
      "land.raw_land_hold",
      "development.entitlement",
      "distressed.foreclosure",
      "transaction.seller_financed_acquisition",
      "tax_or_exchange.1031_replacement_evaluation",
      "portfolio_or_partnership.joint_venture",
    ].forEach((id) => expect(ids.has(id)).toBe(true));
  });

  it("resolves exact, latest active, deprecated historical, disabled historical, and replacement versions without silent upgrades", () => {
    const latest = resolveLatestActiveStrategyDefinition("residential.long_term_rental");
    const historical = inspectHistoricalStrategyVersion("residential.long_term_rental", "0.9.0");
    const disabled = inspectHistoricalStrategyVersion("transaction.wrap", "0.9.0");
    const replacement = identifyReplacementStrategy("residential.long_term_rental", "0.9.0");

    expect(latest.semanticVersion).toBe("1.0.0");
    expect(resolveStrategyDefinition("residential.long_term_rental", "0.9.0").semanticVersion).toBe("0.9.0");
    expect(historical.lifecycleStatus).toBe("deprecated");
    expect(historical.eligibleForNewSelection).toBe(false);
    expect(disabled.lifecycleStatus).toBe("disabled");
    expect(disabled.eligibleForNewSelection).toBe(false);
    expect(replacement?.strategyId).toBe("residential.long_term_rental");
    expect(replacement?.semanticVersion).toBe("1.0.0");
    expect(() => resolveStrategyDefinition("residential.long_term_rental", "9.9.9")).toThrow(StrategyRegistryError);
  });

  it("keeps registry presence separate from production support and new selection eligibility", () => {
    const registered = listStrategiesBySupportStatus("registered");

    expect(registered.length).toBe(strategyDefinitions.length);
    expect(listStrategiesBySupportStatus("fully_supported")).toEqual([]);
    expect(listStrategyDefinitions()).toEqual([]);
    expect(getStrategyLookup("residential.long_term_rental").supportStatus).toBe("registered");
    expect(getStrategyLookup("residential.long_term_rental").eligibleForNewSelection).toBe(false);
    expect(getStrategyLookup("residential.long_term_rental").safeUnavailableReason).toContain("registered");
    expect(() => assertStrategySelectable("residential.long_term_rental")).toThrow(/not ready|registered|not available/i);
  });

  it("filters registry lookups deterministically by category, property profile, support status, and dependencies", () => {
    const residential = listStrategiesByCategory("residential", { includeUnavailable: true });
    const singleFamily = listStrategiesByPropertyProfile("single_family", { includeUnavailable: true });
    const dependencies = loadStrategyDependencyMetadata("residential.brrrr");

    expect(residential.map((lookup) => lookup.definition.category).every((category) => category === "residential")).toBe(true);
    expect(singleFamily.some((lookup) => lookup.strategyId === "residential.owner_occupied")).toBe(true);
    expect(singleFamily.every((lookup, index, values) => index === 0 || values[index - 1].definition.stableOrdinal <= lookup.definition.stableOrdinal)).toBe(true);
    expect(dependencies.requiredCanonicalInputIds).toContain("initial_repairs");
    expect(dependencies.requiredUnderwritingOutputIds).toContain("net_operating_income");
    expect(dependencies.futureInvestorFitDependencies).toContain("risk-profile");
  });

  it("resolves legacy aliases safely and preserves the raw value", () => {
    const exact = resolveLegacyStrategyAlias("  OWNER occupied ");
    const exactAlias = resolveLegacyStrategyAlias("BRRRR");
    const ambiguous = resolveLegacyStrategyAlias("land");
    const unresolved = resolveLegacyStrategyAlias("sell");

    expect(exact.status).toBe("exact");
    if (exact.status === "exact") {
      expect(exact.rawValue).toBe("  OWNER occupied ");
      expect(exact.strategyId).toBe("residential.owner_occupied");
    }
    expect(exactAlias.status).toBe("exact");
    if (exactAlias.status === "exact") expect(exactAlias.strategyId).toBe("residential.brrrr");
    expect(ambiguous.status).toBe("ambiguous");
    if (ambiguous.status === "ambiguous") expect(ambiguous.candidates.length).toBeGreaterThan(1);
    expect(unresolved.status).toBe("unresolved");
  });

  it("hashes material metadata deterministically while excluding display-only copy", () => {
    const definition = resolveLatestActiveStrategyDefinition("residential.long_term_rental");
    const displayCopyChange = { ...definition, displayName: "Long Lease Rental", conciseDescription: "Changed copy only." };
    const materialChange = { ...definition, requiredCanonicalInputIds: [...definition.requiredCanonicalInputIds, "hoa" as const] };

    expect(computeStrategyMetadataHash(definition)).toBe(definition.metadataHash);
    expect(computeStrategyMetadataHash(displayCopyChange)).toBe(definition.metadataHash);
    expect(computeStrategyMetadataHash(materialChange)).not.toBe(definition.metadataHash);
    expect(computeStrategyRegistryHash(strategyDefinitions)).toBe(computeStrategyRegistryHash([...strategyDefinitions].reverse()));
    expect(computeStrategyRegistryHash(strategyDefinitions)).not.toBe(computeStrategyRegistryHash(strategyDefinitions.filter((item) => item.strategyId !== "residential.brrrr")));
  });

  it("fails closed for duplicate IDs, duplicate aliases, invalid references, missing replacement targets, and mutated hashes", () => {
    const base = resolveLatestActiveStrategyDefinition("residential.long_term_rental");
    const duplicateVersion = { ...base, stableOrdinal: 9999 };
    const duplicateAliasOwner = { ...resolveLatestActiveStrategyDefinition("residential.house_hack"), aliases: ["long term rental"], metadataHash: "temporary" };
    const badInput = { ...base, strategyId: "residential.bad_input", semanticVersion: "1.0.0", stableOrdinal: 10000, requiredCanonicalInputIds: ["not_real" as never], metadataHash: "temporary" };
    const badReplacement = { ...base, strategyId: "residential.bad_replacement", semanticVersion: "1.0.0", stableOrdinal: 10001, replacementStrategy: { strategyId: "missing.strategy", semanticVersion: "1.0.0" }, lifecycleStatus: "deprecated" as const, deprecatedDate: "2026-07-31", metadataHash: "temporary" };
    duplicateAliasOwner.metadataHash = computeStrategyMetadataHash(duplicateAliasOwner);
    badInput.metadataHash = computeStrategyMetadataHash(badInput);
    badReplacement.metadataHash = computeStrategyMetadataHash(badReplacement);

    const validation = validateStrategyRegistry([...strategyDefinitions, duplicateVersion, duplicateAliasOwner, badInput, badReplacement]);

    expect(validation.valid).toBe(false);
    expect(validation.errors.some((error) => error.includes("Duplicate strategy ID/version"))).toBe(true);
    expect(validation.errors.some((error) => error.includes("Duplicate alias"))).toBe(true);
    expect(validation.errors.some((error) => error.includes("Invalid underwriting input reference"))).toBe(true);
    expect(validation.errors.some((error) => error.includes("Replacement strategy not found"))).toBe(true);
  });

  it("keeps the registry runtime-neutral and free of calculation, scoring, ranking, AI, network, and UI dependencies", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src", "core", "strategyRegistry.ts"), "utf8");

    expect(source).not.toMatch(/from\s+["']react["']/i);
    expect(source).not.toMatch(/SwiftUI|UIKit|ViewBuilder|JSX/i);
    expect(source).not.toMatch(/\bfetch\s*\(|supabase\.|OpenAI|ai\./i);
    expect(source).not.toMatch(/\bexecuteFormula\b|\bbuildUnderwritingCoreOutputRun\b|\brankStrategies\b|\bscoreStrategy\b|\bevaluateCompatibility\b|\bexecuteDisqualifier\b/i);
    expect(source).not.toMatch(/recommendation/i);
  });
});
