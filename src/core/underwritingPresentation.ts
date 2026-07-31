import { resolveFormulaDefinition, type FormulaId } from "./formulaRegistry";
import { resolveUnderwritingInputDefinition, type UnderwritingInputId } from "./underwritingInputSchemas";
import {
  getLatestConfirmedExecutableResultSet,
  projectCoreOutputs,
  summarizeUnderwritingCoreOutputRun,
  type UnderwritingCoreFormulaResultRecord,
  type UnderwritingCoreOutputRunRecord,
  type UnderwritingOutputGroup,
} from "./underwritingCoreOutputs";
import {
  compareUnderwritingSnapshots,
  summarizeUnderwritingSnapshot,
  type UnderwritingSnapshotRecord,
} from "./underwritingSnapshots";
import {
  projectScenarioComparison,
  projectScenarioSummary,
  projectSensitivityPoints,
  type UnderwritingScenarioRunRecord,
  type UnderwritingSensitivityRunRecord,
} from "./underwritingScenarios";
import type { UnderwritingValidationResult } from "./underwritingValidation";
import type { PresentationMode } from "./presentationMode";

export const UNDERWRITING_PRESENTATION_CONTRACT_VERSION = "underwriting-presentation-contract-v1";

export type UnderwritingPresentationInput = {
  dealId: string;
  dealName?: string;
  mode: PresentationMode;
  validationResult?: UnderwritingValidationResult;
  snapshots?: UnderwritingSnapshotRecord[];
  runs?: UnderwritingCoreOutputRunRecord[];
  scenarios?: UnderwritingScenarioRunRecord[];
  sensitivities?: UnderwritingSensitivityRunRecord[];
  selectedSnapshotId?: string;
  selectedRunId?: string;
};

export type UnderwritingPresentationModel = {
  contractVersion: typeof UNDERWRITING_PRESENTATION_CONTRACT_VERSION;
  dealId: string;
  dealName: string;
  mode: PresentationMode;
  hasCanonicalUnderwriting: boolean;
  emptyState?: {
    title: string;
    detail: string;
  };
  schema: {
    schemaId?: string;
    schemaVersion?: string;
    schemaRegistryVersion?: string;
    inputRegistryVersion?: string;
    validationRegistryVersion?: string;
    normalizationRegistryVersion?: string;
    formulaRegistryVersion?: string;
    snapshotContractVersion?: string;
  };
  readiness: {
    label: string;
    isExecutable: boolean;
    missingRequiredInputCount: number;
    conflictedRequiredInputCount: number;
    provisionalRequiredInputCount: number;
    warnings: string[];
    blockedReasons: string[];
  };
  summary: UnderwritingPresentationSummaryItem[];
  inputs: UnderwritingPresentationInputRow[];
  coreOutputGroups: UnderwritingPresentationOutputGroup[];
  snapshots: UnderwritingPresentationSnapshotRow[];
  scenarios: UnderwritingPresentationScenarioRow[];
  sensitivities: UnderwritingPresentationSensitivityRow[];
  sourcesAndAssumptions: {
    sourceCount: number;
    assumptionCount: number;
    warningCount: number;
    provenance: UnderwritingPresentationProvenanceRow[];
    assumptions: string[];
    warnings: string[];
  };
};

export type UnderwritingPresentationSummaryItem = {
  label: string;
  value: string;
  detail?: string;
  tone: "neutral" | "success" | "warning" | "danger";
};

export type UnderwritingPresentationInputRow = {
  inputId: UnderwritingInputId;
  label: string;
  value: string;
  requirement: string;
  status: string;
  sourceState: string;
  unit: string;
  period: string;
  currency?: string;
  locked: boolean;
  needsAttention: boolean;
  stableOrdinal: number;
};

export type UnderwritingPresentationOutputGroup = {
  id: UnderwritingOutputGroup;
  label: string;
  outputs: UnderwritingPresentationOutputRow[];
};

export type UnderwritingPresentationOutputRow = {
  formulaId: FormulaId;
  label: string;
  value: string;
  status: string;
  group: UnderwritingOutputGroup;
  unit?: string;
  period?: string;
  formulaVersion: string;
  formulaRegistryVersion: string;
  explanation: string;
  warnings: string[];
  errors: string[];
  assumptions: string[];
  provenanceCount: number;
  technicalReferences: string[];
  stableOrdinal: number;
};

export type UnderwritingPresentationSnapshotRow = {
  snapshotId: string;
  sequence: number;
  readiness: string;
  executable: boolean;
  createdAt: string;
  reason: string;
  inputCount: number;
  changedInputIds: string[];
  changedFormulaIds: string[];
  contentHash?: string;
};

export type UnderwritingPresentationScenarioRow = {
  scenarioId: string;
  name: string;
  type: string;
  status: string;
  readiness: string;
  changedInputCount: number;
  changedOutputCount: number;
  warnings: string[];
  comparisonRows: Array<{
    formulaId: FormulaId;
    label: string;
    baseValue: string;
    scenarioValue: string;
    delta: string;
    statusChanged: boolean;
  }>;
};

export type UnderwritingPresentationSensitivityRow = {
  sensitivityId: string;
  inputId: UnderwritingInputId;
  inputLabel: string;
  status: string;
  pointCount: number;
  targetFormulaIds: FormulaId[];
  points: Array<{
    ordinal: number;
    testedValue: string;
    status: string;
    outputs: Array<{ formulaId: FormulaId; label: string; value: string; status?: string }>;
  }>;
};

export type UnderwritingPresentationProvenanceRow = {
  inputId: UnderwritingInputId;
  inputLabel: string;
  sourceFactId?: string;
  evidenceId?: string;
  sourceRecordId?: string;
  verificationState?: string;
};

export function buildUnderwritingPresentation(input: UnderwritingPresentationInput): UnderwritingPresentationModel {
  const snapshots = [...(input.snapshots ?? [])]
    .filter((snapshot) => snapshot.dealId === input.dealId)
    .sort((a, b) => b.snapshotSequence - a.snapshotSequence || b.createdAt.localeCompare(a.createdAt));
  const selectedSnapshot = snapshots.find((snapshot) => snapshot.snapshotId === input.selectedSnapshotId) ?? snapshots[0];
  const runs = [...(input.runs ?? [])]
    .filter((run) => run.dealId === input.dealId && (!selectedSnapshot || run.snapshotId === selectedSnapshot.snapshotId))
    .sort((a, b) => (b.completedAt ?? b.requestedAt).localeCompare(a.completedAt ?? a.requestedAt));
  const selectedRun = runs.find((run) => run.runId === input.selectedRunId)
    ?? getLatestConfirmedExecutableResultSet(runs)
    ?? runs[0];

  const hasCanonicalUnderwriting = Boolean(selectedSnapshot || selectedRun || input.validationResult);
  return {
    contractVersion: UNDERWRITING_PRESENTATION_CONTRACT_VERSION,
    dealId: input.dealId,
    dealName: input.dealName?.trim() || "Deal",
    mode: input.mode,
    hasCanonicalUnderwriting,
    emptyState: hasCanonicalUnderwriting ? undefined : {
      title: "No underwriting record yet",
      detail: "Run canonical underwriting for this Deal to view inputs, outputs, snapshots, scenarios, sensitivity, sources, and assumptions here.",
    },
    schema: schemaProjection(selectedSnapshot, input.validationResult),
    readiness: readinessProjection(selectedSnapshot, input.validationResult),
    summary: summaryProjection(selectedSnapshot, selectedRun, snapshots.length, runs.length),
    inputs: inputProjection(selectedSnapshot),
    coreOutputGroups: outputGroupProjection(selectedRun, input.mode),
    snapshots: snapshotProjection(snapshots, input.mode),
    scenarios: scenarioProjection((input.scenarios ?? []).filter((scenario) => scenario.scenario.dealId === input.dealId)),
    sensitivities: sensitivityProjection((input.sensitivities ?? []).filter((sensitivity) => sensitivity.definition.dealId === input.dealId)),
    sourcesAndAssumptions: sourcesAndAssumptionsProjection(selectedSnapshot, selectedRun),
  };
}

function schemaProjection(snapshot?: UnderwritingSnapshotRecord, validation?: UnderwritingValidationResult): UnderwritingPresentationModel["schema"] {
  return {
    schemaId: snapshot?.schemaId ?? validation?.schemaId,
    schemaVersion: snapshot?.schemaVersion ?? validation?.schemaVersion,
    schemaRegistryVersion: snapshot?.schemaRegistryVersion ?? validation?.schemaRegistryVersion,
    inputRegistryVersion: snapshot?.inputRegistryVersion ?? validation?.inputRegistryVersion,
    validationRegistryVersion: snapshot?.validationRegistryVersion ?? validation?.validationRegistryVersion,
    normalizationRegistryVersion: snapshot?.normalizationRegistryVersion ?? validation?.normalizationRegistryVersion,
    formulaRegistryVersion: snapshot?.formulaRegistryVersion ?? validation?.formulaRegistryVersion,
    snapshotContractVersion: snapshot?.snapshotContractVersion,
  };
}

function readinessProjection(snapshot?: UnderwritingSnapshotRecord, validation?: UnderwritingValidationResult): UnderwritingPresentationModel["readiness"] {
  return {
    label: readable(snapshot?.readinessState ?? validation?.overallStatus ?? "not_started"),
    isExecutable: Boolean(snapshot?.isExecutable),
    missingRequiredInputCount: snapshot?.missingRequiredInputIds.length ?? validation?.missingRequiredInputs.length ?? 0,
    conflictedRequiredInputCount: snapshot?.conflictedRequiredInputIds.length ?? validation?.conflictedRequiredInputs.length ?? 0,
    provisionalRequiredInputCount: snapshot?.provisionalRequiredInputIds.length ?? validation?.provisionalRequiredInputs.length ?? 0,
    warnings: [...(snapshot?.warnings ?? []), ...(validation?.warnings ?? [])],
    blockedReasons: snapshot?.blockingReasons ?? validation?.blockingReasons ?? [],
  };
}

function summaryProjection(snapshot: UnderwritingSnapshotRecord | undefined, run: UnderwritingCoreOutputRunRecord | undefined, snapshotCount: number, runCount: number): UnderwritingPresentationSummaryItem[] {
  if (!snapshot && !run) return [];
  const runSummary = run ? summarizeUnderwritingCoreOutputRun(run) : undefined;
  return [
    { label: "Readiness", value: readable(snapshot?.readinessState ?? run?.snapshotReadinessState ?? "not_started"), tone: snapshot?.isExecutable ? "success" : "warning" },
    { label: "Core Outputs", value: runSummary ? `${runSummary.calculatedResultCount}/${runSummary.resultCount}` : "Not run", detail: runSummary?.status ? readable(runSummary.status) : undefined, tone: runSummary?.status === "complete" ? "success" : runSummary ? "warning" : "neutral" },
    { label: "Warnings", value: String((snapshot?.warnings.length ?? 0) + (run?.warningCount ?? 0)), tone: (snapshot?.warnings.length ?? 0) + (run?.warningCount ?? 0) > 0 ? "warning" : "success" },
    { label: "History", value: `${snapshotCount} snapshot${snapshotCount === 1 ? "" : "s"}`, detail: `${runCount} run${runCount === 1 ? "" : "s"}`, tone: "neutral" },
  ];
}

function inputProjection(snapshot?: UnderwritingSnapshotRecord): UnderwritingPresentationInputRow[] {
  if (!snapshot) return [];
  return [...snapshot.inputs].sort((a, b) => a.stableOrdinal - b.stableOrdinal).map((input) => {
    const definition = resolveUnderwritingInputDefinition(input.inputId);
    const needsAttention = input.completenessState === "missing" || input.conflictState === "unresolved" || input.validationStatus.startsWith("invalid");
    return {
      inputId: input.inputId,
      label: definition?.displayName ?? readable(input.inputId),
      value: input.displayValue,
      requirement: readable(input.requirementState),
      status: readable(input.validationStatus),
      sourceState: readable(input.completenessState),
      unit: readable(input.canonicalUnit),
      period: readable(input.canonicalPeriod),
      currency: input.canonicalCurrency,
      locked: input.completenessState !== "missing" && input.conflictState !== "unresolved",
      needsAttention,
      stableOrdinal: input.stableOrdinal,
    };
  });
}

function outputGroupProjection(run: UnderwritingCoreOutputRunRecord | undefined, mode: PresentationMode): UnderwritingPresentationOutputGroup[] {
  if (!run) return [];
  const rowsByGroup = new Map<UnderwritingOutputGroup, UnderwritingPresentationOutputRow[]>();
  for (const projected of projectCoreOutputs(run)) {
    const detail = run.results.find((result) => result.formulaId === projected.formulaId);
    if (!detail) continue;
    const row = outputRow(detail, mode);
    rowsByGroup.set(row.group, [...(rowsByGroup.get(row.group) ?? []), row]);
  }
  return [...rowsByGroup.entries()].map(([id, outputs]) => ({
    id,
    label: readable(id),
    outputs: outputs.sort((a, b) => a.stableOrdinal - b.stableOrdinal),
  }));
}

function outputRow(result: UnderwritingCoreFormulaResultRecord, mode: PresentationMode): UnderwritingPresentationOutputRow {
  const definition = resolveFormulaDefinition(result.formulaId, result.formulaVersion);
  return {
    formulaId: result.formulaId,
    label: definition?.displayName ?? readable(result.formulaId),
    value: result.displayText,
    status: readable(result.status),
    group: result.outputGroup,
    unit: result.outputUnit ? readable(result.outputUnit) : undefined,
    period: result.outputPeriod ? readable(result.outputPeriod) : undefined,
    formulaVersion: result.formulaVersion,
    formulaRegistryVersion: result.formulaRegistryVersion,
    explanation: result.formulaExplanation,
    warnings: result.warnings,
    errors: result.errors,
    assumptions: result.assumptionDisclosure,
    provenanceCount: result.provenance.length,
    technicalReferences: mode === "professional" ? [
      `result:${result.resultId}`,
      `snapshot:${result.snapshotId}`,
      `hash:${result.deterministicHash}`,
    ] : [],
    stableOrdinal: result.stableOrdinal,
  };
}

function snapshotProjection(snapshots: UnderwritingSnapshotRecord[], mode: PresentationMode): UnderwritingPresentationSnapshotRow[] {
  return snapshots.map((snapshot, index) => {
    const summary = summarizeUnderwritingSnapshot(snapshot);
    const previous = snapshots[index + 1];
    const comparison = previous ? compareUnderwritingSnapshots(previous, snapshot) : undefined;
    return {
      snapshotId: snapshot.snapshotId,
      sequence: summary.snapshotSequence,
      readiness: readable(summary.readinessState),
      executable: summary.isExecutable,
      createdAt: summary.createdAt,
      reason: readable(summary.reason),
      inputCount: summary.inputCount,
      changedInputIds: comparison?.changedInputIds ?? [],
      changedFormulaIds: comparison?.changedFormulaIds ?? [],
      contentHash: mode === "professional" ? summary.contentHash : undefined,
    };
  });
}

function scenarioProjection(scenarios: UnderwritingScenarioRunRecord[]): UnderwritingPresentationScenarioRow[] {
  return scenarios.map((scenario) => {
    const summary = projectScenarioSummary(scenario);
    return {
      scenarioId: summary.scenarioId,
      name: summary.name,
      type: readable(summary.type),
      status: readable(summary.status),
      readiness: readable(summary.readiness),
      changedInputCount: summary.changedInputCount,
      changedOutputCount: scenario.comparison.changedOutputIds.length,
      warnings: summary.warnings,
      comparisonRows: projectScenarioComparison(scenario).map((row) => ({
        formulaId: row.formulaId,
        label: resolveFormulaDefinition(row.formulaId, "latest")?.displayName ?? readable(row.formulaId),
        baseValue: formatMaybeNumber(row.baseRawValue),
        scenarioValue: formatMaybeNumber(row.scenarioRawValue),
        delta: formatMaybeNumber(row.rawDelta),
        statusChanged: row.statusChanged,
      })),
    };
  }).sort((a, b) => a.name.localeCompare(b.name) || a.scenarioId.localeCompare(b.scenarioId));
}

function sensitivityProjection(sensitivities: UnderwritingSensitivityRunRecord[]): UnderwritingPresentationSensitivityRow[] {
  return sensitivities.map((sensitivity) => ({
    sensitivityId: sensitivity.definition.sensitivityId,
    inputId: sensitivity.definition.inputId,
    inputLabel: resolveUnderwritingInputDefinition(sensitivity.definition.inputId)?.displayName ?? readable(sensitivity.definition.inputId),
    status: readable(sensitivity.definition.status),
    pointCount: sensitivity.definition.pointCount,
    targetFormulaIds: sensitivity.definition.targetFormulaIds,
    points: projectSensitivityPoints(sensitivity).map((point) => ({
      ordinal: point.pointOrdinal,
      testedValue: formatMaybeNumber(point.testedInputValue),
      status: readable(point.status),
      outputs: point.targetOutputs.map((output) => ({
        formulaId: output.formulaId,
        label: resolveFormulaDefinition(output.formulaId, "latest")?.displayName ?? readable(output.formulaId),
        value: output.displayText ?? "Not available",
        status: output.status ? readable(output.status) : undefined,
      })),
    })),
  }));
}

function sourcesAndAssumptionsProjection(snapshot: UnderwritingSnapshotRecord | undefined, run: UnderwritingCoreOutputRunRecord | undefined): UnderwritingPresentationModel["sourcesAndAssumptions"] {
  const snapshotProvenance = snapshot?.provenance ?? [];
  const resultProvenance = run?.results.flatMap((result) => result.provenance) ?? [];
  const provenance: UnderwritingPresentationProvenanceRow[] = [...snapshotProvenance, ...resultProvenance].map((item) => ({
    inputId: item.inputId as UnderwritingInputId,
    inputLabel: resolveUnderwritingInputDefinition(item.inputId as UnderwritingInputId)?.displayName ?? readable(item.inputId),
    sourceFactId: item.sourceFactId,
    evidenceId: item.evidenceId,
    sourceRecordId: item.sourceRecordId,
    verificationState: item.verificationState,
  }));
  const assumptions = [...new Set([...(run?.assumptionDisclosures ?? []), ...(run?.results.flatMap((result) => result.assumptionDisclosure) ?? [])])].sort();
  const warnings = [...new Set([...(snapshot?.warnings ?? []), ...(run?.warnings ?? []), ...(run?.results.flatMap((result) => result.warnings) ?? [])])].sort();
  return {
    sourceCount: provenance.length,
    assumptionCount: assumptions.length,
    warningCount: warnings.length,
    provenance,
    assumptions,
    warnings,
  };
}

function formatMaybeNumber(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Not available";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function readable(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
