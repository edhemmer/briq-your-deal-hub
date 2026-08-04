import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  DECISION_COCKPIT_READ_PROJECTION_CONTRACT_VERSION,
  buildDecisionCockpitReadProjection,
} from "../core/decisionCockpitProjection";
import { STRATEGY_PRESENTATION_CONTRACT_VERSION, type StrategyPresentationModel } from "../core/strategyPresentation";
import {
  UNDERWRITING_PRESENTATION_CONTRACT_VERSION,
  type UnderwritingPresentationModel,
} from "../core/underwritingPresentation";
import {
  UNDERWRITING_REPORT_CONTRACT_REGISTRY_VERSION,
  UNDERWRITING_REPORT_CONTRACT_VERSION,
  type UnderwritingReportPayload,
} from "../core/underwritingReportContract";

describe("decision cockpit read projection contract", () => {
  it("returns an empty read projection without fabricating underwriting, strategy, or report data", () => {
    const projection = buildDecisionCockpitReadProjection({
      dealId: "deal-empty",
      dealName: "Empty Deal",
    });

    expect(projection.contractVersion).toBe(DECISION_COCKPIT_READ_PROJECTION_CONTRACT_VERSION);
    expect(projection.freshness.state).toBe("no_source_results");
    expect(projection.underwriting.available).toBe(false);
    expect(projection.underwriting.coreOutputCount).toBe(0);
    expect(projection.strategy.available).toBe(false);
    expect(projection.strategy.rankedStrategies).toEqual([]);
    expect(projection.report.available).toBe(false);
    expect(projection.sourceBoundary).toMatchObject({
      recalculationProhibited: true,
      rankingMutationProhibited: true,
      recommendationMutationProhibited: true,
      persistenceProhibited: true,
      providerCallsProhibited: true,
    });
  });

  it("aggregates existing underwriting, strategy, and report projections without changing their values", () => {
    const underwriting = underwritingPresentation();
    const strategy = strategyPresentation();
    const report = underwritingReport();

    const projection = buildDecisionCockpitReadProjection({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      dealName: "1615 Augusta",
      property: {
        propertyId: "property-1",
        displayName: "1615 Augusta Ln",
        address: "1615 Augusta Ln, Shorewood, IL 60404",
        propertyType: "single_family",
      },
      underwriting,
      strategy,
      report,
      generatedAt: "2026-08-04T12:00:00.000Z",
    });

    expect(projection.freshness.state).toBe("current");
    expect(projection.underwriting).toMatchObject({
      contractVersion: UNDERWRITING_PRESENTATION_CONTRACT_VERSION,
      available: true,
      readinessLabel: "Decision Ready",
      coreOutputGroupCount: 1,
      coreOutputCount: 1,
      scenarioCount: 1,
      sensitivityCount: 1,
    });
    expect(projection.strategy).toMatchObject({
      contractVersion: STRATEGY_PRESENTATION_CONTRACT_VERSION,
      available: true,
      rankingId: "ranking-1",
      rankingHash: "ranking-hash-1",
      topRankedViable: {
        strategyId: "owner_occupied",
        displayName: "Owner Occupied",
        rank: 1,
      },
    });
    expect(projection.confidence.primaryLabel).toBe("High");
    expect(projection.report).toMatchObject({
      available: true,
      contractVersion: UNDERWRITING_REPORT_CONTRACT_VERSION,
      registryVersion: UNDERWRITING_REPORT_CONTRACT_REGISTRY_VERSION,
      reportType: "underwriting_summary",
      contentHash: "report-content-hash",
    });
    expect(projection.underwriting.outputs).toBe(underwriting.coreOutputGroups);
    expect(projection.strategy.rankedStrategies).toBe(strategy.rankedStrategies);
    expect(projection.report.sectionCount).toBe(1);
  });

  it("keeps intended strategy separate from the top ranked viable strategy", () => {
    const strategy = strategyPresentation({
      userPreference: {
        strategyId: "long_term_rental",
        strategyVersion: "1.0.0",
        displayName: "Long-Term Rental",
        acknowledgementRequired: true,
        compatibilityStatus: "compatible_with_conditions",
      },
      userSelectionMatchesSystemRank: false,
    });

    const projection = buildDecisionCockpitReadProjection({
      dealId: "deal-1",
      strategy,
    });

    expect(projection.strategy.intendedStrategy?.strategyId).toBe("long_term_rental");
    expect(projection.strategy.topRankedViable?.strategyId).toBe("owner_occupied");
    expect(projection.strategy.userSelectionMatchesSystemRank).toBe(false);
  });

  it("surfaces stale state, warnings, assumptions, provenance, and professional review flags from source projections", () => {
    const underwriting = underwritingPresentation({
      blockedReasons: ["Insurance quote missing"],
      sourceWarnings: ["Rent support is preliminary"],
    });
    const strategy = strategyPresentation({
      stale: true,
      professionalReviewCount: 2,
    });

    const projection = buildDecisionCockpitReadProjection({
      dealId: "deal-1",
      underwriting,
      strategy,
    });

    expect(projection.freshness.state).toBe("stale");
    expect(projection.freshness.reevaluationRequired).toBe(true);
    expect(projection.freshness.staleEventCount).toBe(1);
    expect(projection.warnings.underwriting).toContain("Insurance quote missing");
    expect(projection.warnings.sources).toContain("Rent support is preliminary");
    expect(projection.assumptions).toEqual({ count: 1, items: ["Projected monthly rent"] });
    expect(projection.provenance.sourceCount).toBe(1);
    expect(projection.professionalReviewFlags).toEqual({
      count: 2,
      strategyFlags: [{ strategyId: "owner_occupied", displayName: "Owner Occupied", count: 2 }],
    });
  });

  it("does not import or call calculators, rankers, UI, Supabase, providers, or persistence paths", () => {
    const source = readFileSync("src/core/decisionCockpitProjection.ts", "utf8");

    expect(source).not.toMatch(/from "\.\/underwritingCoreOutputs"/);
    expect(source).not.toMatch(/from "\.\/underwritingScenarios"/);
    expect(source).not.toMatch(/from "\.\/strategyScoring"/);
    expect(source).not.toMatch(/from "\.\/strategyCompatibility"/);
    expect(source).not.toMatch(/from "\.\/strategyExplanation"/);
    expect(source).not.toMatch(/from "react"/);
    expect(source).not.toMatch(/supabase/i);
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/\binsert\s*\(/);
    expect(source).not.toMatch(/\bupdate\s*\(/);
    expect(source).not.toMatch(/\bdelete\s*\(/);
    expect(source).not.toMatch(/buildUnderwritingPresentation\s*\(/);
    expect(source).not.toMatch(/buildStrategyPresentation\s*\(/);
    expect(source).not.toMatch(/buildUnderwritingReportPayload\s*\(/);
  });
});

function underwritingPresentation(overrides: {
  blockedReasons?: string[];
  sourceWarnings?: string[];
} = {}): UnderwritingPresentationModel {
  return {
    contractVersion: UNDERWRITING_PRESENTATION_CONTRACT_VERSION,
    dealId: "deal-1",
    dealName: "1615 Augusta",
    mode: "guided",
    hasCanonicalUnderwriting: true,
    schema: {
      schemaId: "residential_purchase",
      schemaVersion: "1.0.0",
      formulaRegistryVersion: "formula-registry-v1",
    },
    readiness: {
      label: "Decision Ready",
      isExecutable: true,
      missingRequiredInputCount: 0,
      conflictedRequiredInputCount: 0,
      provisionalRequiredInputCount: 1,
      warnings: ["Verify HOA rules"],
      blockedReasons: overrides.blockedReasons ?? [],
    },
    summary: [{ label: "Readiness", value: "Decision Ready", tone: "success" }],
    inputs: [],
    coreOutputGroups: [{
      id: "returns",
      label: "Returns",
      outputs: [{
        formulaId: "cash_on_cash_return",
        label: "Cash-on-cash return",
        value: "8.2%",
        status: "Calculated",
        group: "returns",
        formulaVersion: "1.0.0",
        formulaRegistryVersion: "formula-registry-v1",
        explanation: "Existing canonical output.",
        warnings: [],
        errors: [],
        assumptions: ["Projected monthly rent"],
        provenanceCount: 1,
        technicalReferences: ["result:result-1"],
        stableOrdinal: 1,
      }],
    }],
    snapshots: [{
      snapshotId: "snapshot-1",
      sequence: 1,
      readiness: "Decision Ready",
      executable: true,
      createdAt: "2026-08-04T12:00:00.000Z",
      reason: "Initial Run",
      inputCount: 10,
      changedInputIds: [],
      changedFormulaIds: [],
      contentHash: "snapshot-hash-1",
    }],
    scenarios: [{
      scenarioId: "scenario-1",
      name: "Stress Case",
      type: "Stress",
      status: "Complete",
      readiness: "Executable",
      changedInputCount: 2,
      changedOutputCount: 1,
      warnings: ["Stress case lowers coverage"],
      comparisonRows: [],
    }],
    sensitivities: [{
      sensitivityId: "sensitivity-1",
      inputId: "monthly_rent",
      inputLabel: "Monthly rent",
      status: "Complete",
      pointCount: 3,
      targetFormulaIds: ["cash_on_cash_return"],
      points: [],
    }],
    sourcesAndAssumptions: {
      sourceCount: 1,
      assumptionCount: 1,
      warningCount: overrides.sourceWarnings?.length ?? 0,
      provenance: [{
        inputId: "monthly_rent",
        inputLabel: "Monthly rent",
        sourceFactId: "source-fact-1",
        evidenceId: "evidence-1",
        sourceRecordId: "source-record-1",
        verificationState: "source_backed",
      }],
      assumptions: ["Projected monthly rent"],
      warnings: overrides.sourceWarnings ?? [],
    },
  } as unknown as UnderwritingPresentationModel;
}

function strategyPresentation(overrides: {
  userPreference?: StrategyPresentationModel["userPreference"];
  userSelectionMatchesSystemRank?: boolean;
  stale?: boolean;
  professionalReviewCount?: number;
} = {}): StrategyPresentationModel {
  const userPreference = overrides.userPreference;
  const staleEvents = overrides.stale ? [{
    eventId: "stale-1",
    eventType: "underwriting_changed",
    staleStatus: "stale",
    triggeredBy: "underwriting_snapshot",
    affectedStrategies: ["owner_occupied"],
    affectedEngines: ["strategy-engine-v1"],
    requiredScope: "full_strategy_reevaluation",
    reason: "Underwriting inputs changed",
    eventHash: "stale-hash-1",
    occurredAt: "2026-08-04T12:05:00.000Z",
  }] : [];

  return {
    contractVersion: STRATEGY_PRESENTATION_CONTRACT_VERSION,
    dealId: "deal-1",
    dealName: "1615 Augusta",
    mode: "guided",
    hasCanonicalStrategyResults: true,
    overview: {
      rankingId: "ranking-1",
      rankingVersion: "strategy-ranking-v1",
      rankingHash: "ranking-hash-1",
      createdAt: "2026-08-04T12:00:00.000Z",
      snapshotId: "snapshot-1",
      underwritingRunId: "run-1",
      freshnessState: overrides.stale ? "stale" : "current",
      candidateCount: 2,
      compatibleCount: 1,
      compatibleWithConditionsCount: 1,
      uncertainCount: 0,
      incompatibleCount: 0,
      notEvaluatedCount: 0,
      missingDependencyCount: 1,
      professionalReviewCount: overrides.professionalReviewCount ?? 0,
      topRankedViable: {
        strategyId: "owner_occupied",
        strategyVersion: "1.0.0",
        displayName: "Owner Occupied",
        rank: 1,
      },
      userSelected: userPreference,
      userSelectionMatchesSystemRank: overrides.userSelectionMatchesSystemRank ?? null,
      staleWarning: overrides.stale ? "One or more canonical dependency changes may require reevaluation. Prior valid results remain visible." : undefined,
    },
    rankedStrategies: [{
      scoreResultId: "score-1",
      strategyId: "owner_occupied",
      strategyVersion: "1.0.0",
      displayName: "Owner Occupied",
      rank: 1,
      canonicalOrdinal: 1,
      compatibilityStatus: "compatible",
      scoreEligibility: "scored",
      totalScore: 88,
      confidenceLabel: "High",
      confidenceDescription: "Evidence quality, not certainty.",
      strengths: ["Fits budget"],
      weaknesses: ["HOA parking needs verification"],
      hardDisqualifierCount: 0,
      hardDisqualifiers: [],
      conditions: [],
      acceptedAssumptionCount: 1,
      preliminaryAssumptionCount: 0,
      missingDependencyCount: 0,
      professionalReviewCount: overrides.professionalReviewCount ?? 0,
      freshnessState: overrides.stale ? "stale" : "current",
      selectedByUser: false,
      explanation: {
        contractVersion: "strategy-explanation-projection-v1",
        resultId: "explanation-1",
        strategyId: "owner_occupied",
        strategyVersion: "1.0.0",
        displayName: "Owner Occupied",
        confidenceLabel: "High",
        sections: [{ title: "Why it fits", items: [{ text: "Fits budget and location profile.", tone: "success" }] }],
        sourceBoundary: {
          usesCanonicalScore: true,
          usesCanonicalCompatibility: true,
          aiGenerated: false,
          clientBusinessLogicProhibited: true,
        },
      },
      hash: "score-hash-1",
    }],
    selectedStrategy: undefined,
    comparison: {
      limit: 4,
      selectedStrategyIds: ["owner_occupied"],
      rows: [{
        rowId: "confidence",
        label: "Evidence quality",
        values: [{ strategyId: "owner_occupied", value: "High", state: overrides.stale ? "stale" : "same" }],
      }],
      columns: [],
    },
    userPreference,
    staleEvents,
    history: [],
    sourceBoundary: {
      usesCanonicalRanking: true,
      usesCanonicalCompatibility: true,
      usesCanonicalScoring: true,
      usesCanonicalExplanation: true,
      usesCanonicalReevaluation: overrides.stale ?? false,
      clientBusinessLogicProhibited: true,
    },
  } as unknown as StrategyPresentationModel;
}

function underwritingReport(): UnderwritingReportPayload {
  return {
    contract: {
      contractId: "canonical_underwriting_report",
      contractVersion: UNDERWRITING_REPORT_CONTRACT_VERSION,
      contractSemanticVersion: "1.0.0",
      registryVersion: UNDERWRITING_REPORT_CONTRACT_REGISTRY_VERSION,
      reportType: "underwriting_summary",
      payloadHashVersion: "underwriting-report-payload-hash-v1",
    },
    identity: {
      workspaceId: "workspace-1",
      dealId: "deal-1",
      dealDisplayName: "1615 Augusta",
      propertyIds: ["property-1"],
      requestedBy: "user-1",
      requestedAt: "2026-08-04T12:00:00.000Z",
      locale: "en-US",
      timezone: "America/Chicago",
      displayCurrency: "USD",
    },
    reconciliation: {
      snapshotId: "snapshot-1",
      runId: "run-1",
      snapshotHash: "snapshot-hash-1",
      resultSetHash: "result-set-hash-1",
      manifestHash: "manifest-hash-1",
      dependencyGraphHash: "dependency-hash-1",
      formulaVersionManifestHash: "formula-hash-1",
      schemaId: "residential_purchase",
      schemaVersion: "1.0.0",
      engineVersion: "underwriting-core-output-run-v1",
      snapshotContractVersion: "underwriting-snapshot-contract-v1",
    },
    status: {
      sectionStatus: "available",
      readinessState: "decision_ready",
      runStatus: "complete",
      isExecutable: true,
      issueCount: 1,
      blockingIssueCount: 0,
      warningIssueCount: 1,
      sourceLimitationSummary: ["HOA rules require verification"],
    },
    sections: [{ id: "executive_summary", title: "Executive Summary", status: "available", rows: [] }],
    appendices: {
      formulaManifest: [],
      provenanceIndex: [],
      versionManifest: {
        reportContractVersion: UNDERWRITING_REPORT_CONTRACT_VERSION,
        reportRegistryVersion: UNDERWRITING_REPORT_CONTRACT_REGISTRY_VERSION,
        formulaRegistryVersion: "formula-registry-v1",
        inputRegistryVersion: "underwriting-input-registry-v1",
        snapshotContractVersion: "underwriting-snapshot-contract-v1",
        coreOutputContractVersion: "underwriting-core-output-run-v1",
        scenarioContractVersion: "underwriting-scenario-contract-v1",
      },
    },
    warnings: [],
    errors: [],
    contentHash: "report-content-hash",
  } as unknown as UnderwritingReportPayload;
}
