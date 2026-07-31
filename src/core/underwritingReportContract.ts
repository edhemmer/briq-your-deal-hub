import { FORMULA_REGISTRY_VERSION, resolveFormulaDefinition, type FormulaId } from "./formulaRegistry";
import {
  PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION,
  UNDERWRITING_INPUT_REGISTRY_VERSION,
  resolveUnderwritingInputDefinition,
  type UnderwritingInputId,
  type UnderwritingMode,
  type UnderwritingPropertyProfile,
} from "./underwritingInputSchemas";
import {
  UNDERWRITING_CORE_OUTPUT_RUN_VERSION,
  projectCoreOutputs,
  summarizeUnderwritingCoreOutputRun,
  type UnderwritingCoreFormulaResultRecord,
  type UnderwritingCoreOutputRunRecord,
  type UnderwritingOutputGroup,
} from "./underwritingCoreOutputs";
import {
  UNDERWRITING_SNAPSHOT_CONTRACT_VERSION,
  summarizeUnderwritingSnapshot,
  type UnderwritingSnapshotInputRecord,
  type UnderwritingSnapshotProvenanceReference,
  type UnderwritingSnapshotRecord,
} from "./underwritingSnapshots";
import {
  UNDERWRITING_SCENARIO_CONTRACT_VERSION,
  projectScenarioComparison,
  projectScenarioOverrides,
  projectScenarioSummary,
  projectSensitivityPoints,
  type UnderwritingScenarioRunRecord,
  type UnderwritingSensitivityRunRecord,
} from "./underwritingScenarios";

export const UNDERWRITING_REPORT_CONTRACT_REGISTRY_VERSION = "underwriting-report-contract-registry-v1";
export const UNDERWRITING_REPORT_CONTRACT_VERSION = "underwriting-report-contract-v1";
export const UNDERWRITING_REPORT_PAYLOAD_HASH_VERSION = "underwriting-report-payload-hash-v1";

export type UnderwritingReportType =
  | "underwriting_summary"
  | "underwriting_detail"
  | "underwriting_table_export"
  | "underwriting_native_summary";

export type UnderwritingReportContractStatus = "draft" | "active" | "deprecated" | "disabled";

export type UnderwritingReportSectionStatus =
  | "available"
  | "available_with_warnings"
  | "preliminary"
  | "incomplete"
  | "blocked"
  | "unavailable"
  | "not_applicable"
  | "historical";

export type UnderwritingReportIssueSeverity = "info" | "warning" | "blocking";

export type UnderwritingReportIssueCategory =
  | "missing_input"
  | "conflict"
  | "preliminary_input"
  | "invalid_input"
  | "snapshot_warning"
  | "run_warning"
  | "run_error"
  | "result_warning"
  | "result_error"
  | "contract";

export type UnderwritingReportReviewState = "accepted" | "needs_review" | "missing" | "conflicted" | "deferred" | "rejected";

export type UnderwritingReportContractDefinition = {
  contractId: "canonical_underwriting_report";
  reportType: UnderwritingReportType;
  status: UnderwritingReportContractStatus;
  semanticVersion: string;
  contractVersion: typeof UNDERWRITING_REPORT_CONTRACT_VERSION;
  registryVersion: typeof UNDERWRITING_REPORT_CONTRACT_REGISTRY_VERSION;
  supportedPropertyProfiles: UnderwritingPropertyProfile[];
  supportedUnderwritingModes: UnderwritingMode[];
  requiredSourceProjections: Array<"underwriting_snapshot" | "underwriting_core_output_run">;
  optionalSourceProjections: Array<"underwriting_scenario_run" | "underwriting_sensitivity_run">;
  sectionOrder: UnderwritingReportSectionId[];
};

export type UnderwritingReportSectionId =
  | "executive_summary"
  | "property_deal_context"
  | "source_limitations"
  | "input_summary"
  | "core_outputs"
  | "financing"
  | "income"
  | "operating_expenses"
  | "operating_performance"
  | "leverage_and_coverage"
  | "returns"
  | "assumptions_and_preliminary_values"
  | "issues"
  | "scenario_comparison"
  | "sensitivity_summary"
  | "formula_and_version_manifest"
  | "provenance_index"
  | "methodology_and_boundaries";

export type UnderwritingReportRequest = {
  workspaceId: string;
  dealId: string;
  reportType: UnderwritingReportType;
  snapshotId: string;
  runId: string;
  expectedSnapshotHash: string;
  expectedResultSetHash: string;
  requestedBy: string;
  requestedAt: string;
  idempotencyKey: string;
  contractVersion?: string | "latest";
  locale?: string;
  timezone?: string;
  displayCurrency?: string;
  includeScenarioIds?: string[];
  includeSensitivityIds?: string[];
};

export type UnderwritingReportBuildInput = {
  request: UnderwritingReportRequest;
  dealDisplayName?: string;
  propertyDisplayName?: string;
  propertyProfile?: UnderwritingPropertyProfile;
  underwritingMode?: UnderwritingMode;
  snapshot: UnderwritingSnapshotRecord;
  run: UnderwritingCoreOutputRunRecord;
  scenarios?: UnderwritingScenarioRunRecord[];
  sensitivities?: UnderwritingSensitivityRunRecord[];
};

export type UnderwritingReportPayload = {
  contract: {
    contractId: UnderwritingReportContractDefinition["contractId"];
    contractVersion: typeof UNDERWRITING_REPORT_CONTRACT_VERSION;
    contractSemanticVersion: string;
    registryVersion: typeof UNDERWRITING_REPORT_CONTRACT_REGISTRY_VERSION;
    reportType: UnderwritingReportType;
    payloadHashVersion: typeof UNDERWRITING_REPORT_PAYLOAD_HASH_VERSION;
  };
  identity: {
    workspaceId: string;
    dealId: string;
    dealDisplayName: string;
    propertyDisplayName?: string;
    primaryPropertyId?: string;
    propertyIds: string[];
    propertyProfile?: UnderwritingPropertyProfile;
    underwritingMode?: UnderwritingMode;
    requestedBy: string;
    requestedAt: string;
    locale: string;
    timezone: string;
    displayCurrency: string;
  };
  reconciliation: {
    snapshotId: string;
    runId: string;
    snapshotHash: string;
    resultSetHash: string;
    manifestHash: string;
    dependencyGraphHash: string;
    formulaVersionManifestHash: string;
    schemaId: string;
    schemaVersion: string;
    engineVersion: typeof UNDERWRITING_CORE_OUTPUT_RUN_VERSION;
    snapshotContractVersion: typeof UNDERWRITING_SNAPSHOT_CONTRACT_VERSION;
    scenarioContractVersion?: typeof UNDERWRITING_SCENARIO_CONTRACT_VERSION;
  };
  status: {
    sectionStatus: UnderwritingReportSectionStatus;
    readinessState: string;
    runStatus: string;
    isExecutable: boolean;
    issueCount: number;
    blockingIssueCount: number;
    warningIssueCount: number;
    sourceLimitationSummary: string[];
  };
  sections: UnderwritingReportSection[];
  appendices: {
    formulaManifest: UnderwritingReportFormulaManifestRow[];
    provenanceIndex: UnderwritingReportProvenanceRow[];
    versionManifest: UnderwritingReportVersionManifest;
  };
  warnings: string[];
  errors: string[];
  contentHash: string;
};

export type UnderwritingReportSection = {
  id: UnderwritingReportSectionId;
  title: string;
  status: UnderwritingReportSectionStatus;
  rows: UnderwritingReportRow[];
};

export type UnderwritingReportRow =
  | UnderwritingReportSummaryRow
  | UnderwritingReportInputRow
  | UnderwritingReportMetricRow
  | UnderwritingReportIssueRow
  | UnderwritingReportAssumptionRow
  | UnderwritingReportScenarioRow
  | UnderwritingReportSensitivityRow
  | UnderwritingReportManifestRow
  | UnderwritingReportFormulaManifestRow
  | UnderwritingReportProvenanceRow
  | UnderwritingReportBoundaryRow;

export type UnderwritingReportSummaryRow = {
  rowType: "summary";
  label: string;
  value: string;
  detail?: string;
  stableOrdinal: number;
};

export type UnderwritingReportInputRow = {
  rowType: "input";
  inputId: UnderwritingInputId;
  label: string;
  displayValue: string;
  normalizedValue: string | number | boolean | null;
  requirementState: string;
  reviewState: UnderwritingReportReviewState;
  validationStatus: string;
  completenessState: string;
  assumptionState: string;
  conflictState: string;
  canonicalUnit: string;
  canonicalPeriod: string;
  canonicalCurrency?: string;
  provenanceRefs: UnderwritingReportProvenanceReference[];
  deterministicInputHash: string;
  stableOrdinal: number;
};

export type UnderwritingReportMetricRow = {
  rowType: "metric";
  formulaId: FormulaId;
  label: string;
  group: UnderwritingOutputGroup;
  status: string;
  displayText: string;
  rawValue?: number;
  outputUnit?: string;
  outputPeriod?: string;
  currency?: string;
  formulaVersion: string;
  formulaRegistryVersion: typeof FORMULA_REGISTRY_VERSION;
  formulaExplanation: string;
  warnings: string[];
  errors: string[];
  assumptions: string[];
  inputRefs: string[];
  dependencyResultIds: string[];
  provenanceRefs: UnderwritingReportProvenanceReference[];
  deterministicHash: string;
  stableOrdinal: number;
};

export type UnderwritingReportIssueRow = {
  rowType: "issue";
  category: UnderwritingReportIssueCategory;
  severity: UnderwritingReportIssueSeverity;
  message: string;
  inputId?: UnderwritingInputId;
  formulaId?: FormulaId;
  stableOrdinal: number;
};

export type UnderwritingReportAssumptionRow = {
  rowType: "assumption";
  label: string;
  source: "snapshot_input" | "formula_disclosure";
  inputId?: UnderwritingInputId;
  formulaIds: FormulaId[];
  disclosure: string;
  stableOrdinal: number;
};

export type UnderwritingReportScenarioRow = {
  rowType: "scenario";
  scenarioId: string;
  name: string;
  scenarioType: string;
  status: string;
  readiness: string;
  changedInputCount: number;
  changedOutputCount: number;
  comparisonRows: Array<{
    formulaId: FormulaId;
    label: string;
    baseRawValue?: number;
    scenarioRawValue?: number;
    rawDelta?: number;
    percentageDelta?: number;
    statusChanged: boolean;
    formulaVersionMatches: boolean;
  }>;
  overrideRows: Array<{
    inputId: UnderwritingInputId;
    label: string;
    proposedDisplayValue: string;
    rationaleCategory: string;
    sourceProvenanceType: string;
  }>;
  warnings: string[];
  errors: string[];
  stableOrdinal: number;
};

export type UnderwritingReportSensitivityRow = {
  rowType: "sensitivity";
  sensitivityId: string;
  inputId: UnderwritingInputId;
  inputLabel: string;
  method: string;
  status: string;
  pointCount: number;
  targetFormulaIds: FormulaId[];
  points: Array<{
    pointOrdinal: number;
    testedInputValue: number;
    status: string;
    resultSetHash: string;
    targetOutputs: Array<{
      formulaId: FormulaId;
      label: string;
      status?: string;
      displayText?: string;
      rawValue?: number;
      resultHash?: string;
    }>;
  }>;
  warnings: string[];
  errors: string[];
  stableOrdinal: number;
};

export type UnderwritingReportManifestRow = {
  rowType: "manifest";
  key: string;
  value: string;
  stableOrdinal: number;
};

export type UnderwritingReportBoundaryRow = {
  rowType: "boundary";
  label: string;
  value: string;
  stableOrdinal: number;
};

export type UnderwritingReportFormulaManifestRow = {
  rowType: "formula_manifest";
  formulaId: FormulaId;
  label: string;
  formulaVersion: string;
  formulaRegistryVersion: typeof FORMULA_REGISTRY_VERSION;
  supportedBySchema: boolean;
  readinessStatus: string;
  requiredInputIds: string[];
  missingInputIds: string[];
  blockedInputIds: string[];
  assumptionDependentInputIds: string[];
  preliminaryInputIds: string[];
  executable: boolean;
  resultStatus?: string;
  resultHash?: string;
  stableOrdinal: number;
};

export type UnderwritingReportProvenanceReference = {
  inputId: UnderwritingInputId;
  sourceFactId?: string;
  acceptedAssumptionId?: string;
  preliminaryAssumptionId?: string;
  sourceRecordId?: string;
  evidenceId?: string;
  sourceAnchor?: string | Record<string, unknown>;
  sourceClassification?: string;
  verificationState?: string;
};

export type UnderwritingReportProvenanceRow = UnderwritingReportProvenanceReference & {
  rowType: "provenance";
  inputLabel: string;
  referencedByFormulaIds: FormulaId[];
  stableOrdinal: number;
};

export type UnderwritingReportVersionManifest = {
  schemaRegistryVersion: typeof PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION | string;
  inputRegistryVersion: typeof UNDERWRITING_INPUT_REGISTRY_VERSION | string;
  formulaRegistryVersion: typeof FORMULA_REGISTRY_VERSION | string;
  snapshotContractVersion: typeof UNDERWRITING_SNAPSHOT_CONTRACT_VERSION | string;
  coreOutputRunVersion: typeof UNDERWRITING_CORE_OUTPUT_RUN_VERSION | string;
  scenarioContractVersion?: typeof UNDERWRITING_SCENARIO_CONTRACT_VERSION;
  reportContractVersion: typeof UNDERWRITING_REPORT_CONTRACT_VERSION;
  reportContractRegistryVersion: typeof UNDERWRITING_REPORT_CONTRACT_REGISTRY_VERSION;
};

export type UnderwritingReportContractErrorCode =
  | "contract_not_found"
  | "contract_disabled"
  | "unsupported_report_type"
  | "workspace_required"
  | "deal_required"
  | "snapshot_required"
  | "run_required"
  | "scope_mismatch"
  | "snapshot_hash_mismatch"
  | "result_set_hash_mismatch"
  | "stale_run"
  | "scenario_scope_mismatch"
  | "sensitivity_scope_mismatch";

export class UnderwritingReportContractError extends Error {
  readonly code: UnderwritingReportContractErrorCode;
  readonly safeMessage: string;

  constructor(code: UnderwritingReportContractErrorCode, safeMessage: string) {
    super(safeMessage);
    this.name = "UnderwritingReportContractError";
    this.code = code;
    this.safeMessage = safeMessage;
  }
}

const sectionOrder: UnderwritingReportSectionId[] = [
  "executive_summary",
  "property_deal_context",
  "source_limitations",
  "input_summary",
  "core_outputs",
  "financing",
  "income",
  "operating_expenses",
  "operating_performance",
  "leverage_and_coverage",
  "returns",
  "assumptions_and_preliminary_values",
  "issues",
  "scenario_comparison",
  "sensitivity_summary",
  "formula_and_version_manifest",
  "provenance_index",
  "methodology_and_boundaries",
];

const activeSupportedProfiles: UnderwritingPropertyProfile[] = [
  "single_family",
  "condominium",
  "townhouse",
  "two_to_four_unit",
  "multifamily",
  "office",
  "retail",
  "industrial",
  "warehouse",
  "self_storage",
  "hospitality",
  "mobile_home_park",
  "mixed_use",
  "land",
  "special_purpose",
  "other_residential",
  "other_commercial",
  "unknown",
];

const activeSupportedModes: UnderwritingMode[] = [
  "rental",
  "owner_occupied",
  "flip",
  "wholesale",
  "development",
  "land_hold",
  "commercial_income",
  "mixed_use_income",
  "unknown",
];

const reportContractRegistry: UnderwritingReportContractDefinition[] = [
  {
    contractId: "canonical_underwriting_report",
    reportType: "underwriting_summary",
    status: "active",
    semanticVersion: "1.0.0",
    contractVersion: UNDERWRITING_REPORT_CONTRACT_VERSION,
    registryVersion: UNDERWRITING_REPORT_CONTRACT_REGISTRY_VERSION,
    supportedPropertyProfiles: activeSupportedProfiles,
    supportedUnderwritingModes: activeSupportedModes,
    requiredSourceProjections: ["underwriting_snapshot", "underwriting_core_output_run"],
    optionalSourceProjections: ["underwriting_scenario_run", "underwriting_sensitivity_run"],
    sectionOrder,
  },
  {
    contractId: "canonical_underwriting_report",
    reportType: "underwriting_detail",
    status: "disabled",
    semanticVersion: "0.0.0-disabled",
    contractVersion: UNDERWRITING_REPORT_CONTRACT_VERSION,
    registryVersion: UNDERWRITING_REPORT_CONTRACT_REGISTRY_VERSION,
    supportedPropertyProfiles: [],
    supportedUnderwritingModes: [],
    requiredSourceProjections: ["underwriting_snapshot", "underwriting_core_output_run"],
    optionalSourceProjections: ["underwriting_scenario_run", "underwriting_sensitivity_run"],
    sectionOrder,
  },
  {
    contractId: "canonical_underwriting_report",
    reportType: "underwriting_table_export",
    status: "disabled",
    semanticVersion: "0.0.0-disabled",
    contractVersion: UNDERWRITING_REPORT_CONTRACT_VERSION,
    registryVersion: UNDERWRITING_REPORT_CONTRACT_REGISTRY_VERSION,
    supportedPropertyProfiles: [],
    supportedUnderwritingModes: [],
    requiredSourceProjections: ["underwriting_snapshot", "underwriting_core_output_run"],
    optionalSourceProjections: ["underwriting_scenario_run", "underwriting_sensitivity_run"],
    sectionOrder,
  },
  {
    contractId: "canonical_underwriting_report",
    reportType: "underwriting_native_summary",
    status: "disabled",
    semanticVersion: "0.0.0-disabled",
    contractVersion: UNDERWRITING_REPORT_CONTRACT_VERSION,
    registryVersion: UNDERWRITING_REPORT_CONTRACT_REGISTRY_VERSION,
    supportedPropertyProfiles: [],
    supportedUnderwritingModes: [],
    requiredSourceProjections: ["underwriting_snapshot", "underwriting_core_output_run"],
    optionalSourceProjections: ["underwriting_scenario_run", "underwriting_sensitivity_run"],
    sectionOrder,
  },
];

export function listUnderwritingReportContracts(): UnderwritingReportContractDefinition[] {
  return reportContractRegistry.map((contract) => deepFreeze({ ...contract, sectionOrder: [...contract.sectionOrder] }));
}

export function resolveUnderwritingReportContract(reportType: UnderwritingReportType, version: string | "latest" = "latest"): UnderwritingReportContractDefinition {
  const candidates = reportContractRegistry.filter((contract) => contract.reportType === reportType);
  if (!candidates.length) throw reportError("contract_not_found", "The requested underwriting report contract does not exist.");
  const contract = version === "latest" ? candidates[0] : candidates.find((item) => item.semanticVersion === version);
  if (!contract) throw reportError("contract_not_found", "The requested underwriting report contract version does not exist.");
  if (contract.status !== "active") throw reportError("contract_disabled", "The requested underwriting report contract is not enabled.");
  return deepFreeze({ ...contract, sectionOrder: [...contract.sectionOrder] });
}

export function buildUnderwritingReportPayload(input: UnderwritingReportBuildInput): UnderwritingReportPayload {
  const contract = resolveUnderwritingReportContract(input.request.reportType, input.request.contractVersion ?? "latest");
  validateReportInput(input);

  const issues = issueRows(input.snapshot, input.run);
  const inputRows = inputRowsFor(input.snapshot);
  const metricRows = metricRowsFor(input.run);
  const formulaManifest = formulaManifestRows(input.snapshot, input.run);
  const provenanceIndex = provenanceRows(input.snapshot, input.run);
  const assumptions = assumptionRows(input.snapshot, input.run);
  const scenarioRows = scenarioRowsFor(input);
  const sensitivityRows = sensitivityRowsFor(input);
  const warnings = unique([
    ...input.snapshot.warnings,
    ...input.snapshot.blockingReasons,
    ...input.run.warnings,
    ...input.run.results.flatMap((result) => result.warnings),
  ]);
  const errors = unique([
    ...input.run.errors,
    ...input.run.results.flatMap((result) => result.errors),
  ]);
  const sourceLimitationSummary = sourceLimitations(input.snapshot, input.run);
  const versionManifest: UnderwritingReportVersionManifest = {
    schemaRegistryVersion: input.snapshot.schemaRegistryVersion,
    inputRegistryVersion: input.snapshot.inputRegistryVersion,
    formulaRegistryVersion: input.snapshot.formulaRegistryVersion,
    snapshotContractVersion: input.snapshot.snapshotContractVersion,
    coreOutputRunVersion: input.run.engineVersion,
    scenarioContractVersion: scenarioRows.length ? UNDERWRITING_SCENARIO_CONTRACT_VERSION : undefined,
    reportContractVersion: UNDERWRITING_REPORT_CONTRACT_VERSION,
    reportContractRegistryVersion: UNDERWRITING_REPORT_CONTRACT_REGISTRY_VERSION,
  };

  const payloadWithoutHash: Omit<UnderwritingReportPayload, "contentHash"> = {
    contract: {
      contractId: contract.contractId,
      contractVersion: contract.contractVersion,
      contractSemanticVersion: contract.semanticVersion,
      registryVersion: contract.registryVersion,
      reportType: contract.reportType,
      payloadHashVersion: UNDERWRITING_REPORT_PAYLOAD_HASH_VERSION,
    },
    identity: {
      workspaceId: input.request.workspaceId,
      dealId: input.request.dealId,
      dealDisplayName: input.dealDisplayName?.trim() || "Deal",
      propertyDisplayName: input.propertyDisplayName?.trim() || undefined,
      primaryPropertyId: input.snapshot.primaryPropertyId,
      propertyIds: [...input.snapshot.propertyIds],
      propertyProfile: input.propertyProfile,
      underwritingMode: input.underwritingMode ?? (input.snapshot.intendedUnderwritingMode as UnderwritingMode | undefined),
      requestedBy: input.request.requestedBy,
      requestedAt: input.request.requestedAt,
      locale: input.request.locale ?? "en-US",
      timezone: input.request.timezone ?? "UTC",
      displayCurrency: input.request.displayCurrency ?? input.snapshot.calculationCurrency,
    },
    reconciliation: {
      snapshotId: input.snapshot.snapshotId,
      runId: input.run.runId,
      snapshotHash: input.snapshot.contentHash,
      resultSetHash: input.run.resultSetHash,
      manifestHash: input.snapshot.manifestHash,
      dependencyGraphHash: input.run.dependencyGraphHash,
      formulaVersionManifestHash: input.run.formulaVersionManifestHash,
      schemaId: input.snapshot.schemaId,
      schemaVersion: input.snapshot.schemaVersion,
      engineVersion: input.run.engineVersion,
      snapshotContractVersion: input.snapshot.snapshotContractVersion,
      scenarioContractVersion: scenarioRows.length ? UNDERWRITING_SCENARIO_CONTRACT_VERSION : undefined,
    },
    status: {
      sectionStatus: reportStatus(input.snapshot, input.run),
      readinessState: input.snapshot.readinessState,
      runStatus: input.run.status,
      isExecutable: input.snapshot.isExecutable,
      issueCount: issues.length,
      blockingIssueCount: issues.filter((issue) => issue.severity === "blocking").length,
      warningIssueCount: issues.filter((issue) => issue.severity === "warning").length,
      sourceLimitationSummary,
    },
    sections: sectionRows(contract, {
      input,
      inputRows,
      metricRows,
      issues,
      assumptions,
      scenarioRows,
      sensitivityRows,
      formulaManifest,
      provenanceIndex,
      versionManifest,
      sourceLimitationSummary,
    }),
    appendices: {
      formulaManifest,
      provenanceIndex,
      versionManifest,
    },
    warnings,
    errors,
  };

  return deepFreeze({
    ...payloadWithoutHash,
    contentHash: stableHash({
      hashVersion: UNDERWRITING_REPORT_PAYLOAD_HASH_VERSION,
      payload: payloadWithoutHash,
    }),
  });
}

function validateReportInput(input: UnderwritingReportBuildInput) {
  const { request, snapshot, run } = input;
  if (!request.workspaceId.trim()) throw reportError("workspace_required", "A workspace is required to build an underwriting report payload.");
  if (!request.dealId.trim()) throw reportError("deal_required", "A Deal is required to build an underwriting report payload.");
  if (!snapshot) throw reportError("snapshot_required", "An underwriting snapshot is required to build an underwriting report payload.");
  if (!run) throw reportError("run_required", "An underwriting run is required to build an underwriting report payload.");
  if (snapshot.workspaceId !== request.workspaceId || run.workspaceId !== request.workspaceId) throw reportError("scope_mismatch", "The underwriting report records do not belong to the requested workspace.");
  if (snapshot.dealId !== request.dealId || run.dealId !== request.dealId) throw reportError("scope_mismatch", "The underwriting report records do not belong to the requested Deal.");
  if (snapshot.snapshotId !== request.snapshotId || run.snapshotId !== request.snapshotId) throw reportError("scope_mismatch", "The requested snapshot does not match the underwriting report source records.");
  if (run.runId !== request.runId) throw reportError("scope_mismatch", "The requested run does not match the underwriting report source record.");
  if (snapshot.contentHash !== request.expectedSnapshotHash) throw reportError("snapshot_hash_mismatch", "The underwriting snapshot hash does not match the report request.");
  if (run.resultSetHash !== request.expectedResultSetHash) throw reportError("result_set_hash_mismatch", "The underwriting result set hash does not match the report request.");
  if (run.snapshotHash !== snapshot.contentHash) throw reportError("stale_run", "The underwriting run no longer matches the selected snapshot.");

  const allowedScenarioIds = request.includeScenarioIds ? new Set(request.includeScenarioIds) : undefined;
  for (const scenario of input.scenarios ?? []) {
    if (allowedScenarioIds && !allowedScenarioIds.has(scenario.scenario.scenarioId)) continue;
    if (scenario.scenario.workspaceId !== request.workspaceId || scenario.scenario.dealId !== request.dealId) {
      throw reportError("scenario_scope_mismatch", "A scenario in the report request belongs to a different workspace or Deal.");
    }
    if (scenario.comparison.baseSnapshotId !== snapshot.snapshotId || scenario.comparison.baseRunId !== run.runId) {
      throw reportError("scenario_scope_mismatch", "A scenario in the report request does not reconcile to the selected underwriting run.");
    }
  }

  const allowedSensitivityIds = request.includeSensitivityIds ? new Set(request.includeSensitivityIds) : undefined;
  for (const sensitivity of input.sensitivities ?? []) {
    if (allowedSensitivityIds && !allowedSensitivityIds.has(sensitivity.definition.sensitivityId)) continue;
    if (sensitivity.definition.workspaceId !== request.workspaceId || sensitivity.definition.dealId !== request.dealId) {
      throw reportError("sensitivity_scope_mismatch", "A sensitivity run in the report request belongs to a different workspace or Deal.");
    }
    if (sensitivity.definition.baseSnapshotId !== snapshot.snapshotId || sensitivity.definition.baseRunId !== run.runId) {
      throw reportError("sensitivity_scope_mismatch", "A sensitivity run in the report request does not reconcile to the selected underwriting run.");
    }
  }
}

function sectionRows(
  contract: UnderwritingReportContractDefinition,
  data: {
    input: UnderwritingReportBuildInput;
    inputRows: UnderwritingReportInputRow[];
    metricRows: UnderwritingReportMetricRow[];
    issues: UnderwritingReportIssueRow[];
    assumptions: UnderwritingReportAssumptionRow[];
    scenarioRows: UnderwritingReportScenarioRow[];
    sensitivityRows: UnderwritingReportSensitivityRow[];
    formulaManifest: UnderwritingReportFormulaManifestRow[];
    provenanceIndex: UnderwritingReportProvenanceRow[];
    versionManifest: UnderwritingReportVersionManifest;
    sourceLimitationSummary: string[];
  },
): UnderwritingReportSection[] {
  const metricGroups = groupMetrics(data.metricRows);
  const rowsBySection: Record<UnderwritingReportSectionId, UnderwritingReportRow[]> = {
    executive_summary: executiveSummaryRows(data.input.snapshot, data.input.run, data.issues),
    property_deal_context: dealContextRows(data.input),
    source_limitations: data.sourceLimitationSummary.map((value, index) => ({ rowType: "boundary", label: `Limitation ${index + 1}`, value, stableOrdinal: index + 1 })),
    input_summary: data.inputRows,
    core_outputs: data.metricRows,
    financing: metricGroups.financing ?? [],
    income: metricGroups.income ?? [],
    operating_expenses: metricGroups.expenses ?? [],
    operating_performance: metricGroups.operating_performance ?? [],
    leverage_and_coverage: metricGroups.leverage ?? [],
    returns: metricGroups.returns ?? [],
    assumptions_and_preliminary_values: data.assumptions,
    issues: data.issues,
    scenario_comparison: data.scenarioRows,
    sensitivity_summary: data.sensitivityRows,
    formula_and_version_manifest: [
      ...versionRows(data.versionManifest),
      ...data.formulaManifest,
    ],
    provenance_index: data.provenanceIndex,
    methodology_and_boundaries: methodologyRows(),
  };

  return contract.sectionOrder.map((id) => ({
    id,
    title: sectionTitle(id),
    status: sectionStatus(id, rowsBySection[id], data.issues, data.input.snapshot, data.input.run),
    rows: rowsBySection[id],
  }));
}

function executiveSummaryRows(snapshot: UnderwritingSnapshotRecord, run: UnderwritingCoreOutputRunRecord, issues: UnderwritingReportIssueRow[]): UnderwritingReportSummaryRow[] {
  const snapshotSummary = summarizeUnderwritingSnapshot(snapshot);
  const runSummary = summarizeUnderwritingCoreOutputRun(run);
  return [
    { rowType: "summary", label: "Readiness", value: readable(snapshotSummary.readinessState), detail: snapshot.isExecutable ? "Executable snapshot" : "Requires review before reliance", stableOrdinal: 1 },
    { rowType: "summary", label: "Run Status", value: readable(runSummary.status), detail: `${runSummary.calculatedResultCount}/${runSummary.resultCount} outputs calculated`, stableOrdinal: 2 },
    { rowType: "summary", label: "Issues", value: String(issues.length), detail: `${issues.filter((issue) => issue.severity === "blocking").length} blocking`, stableOrdinal: 3 },
    { rowType: "summary", label: "Snapshot", value: snapshot.snapshotId, detail: `Sequence ${snapshot.snapshotSequence}`, stableOrdinal: 4 },
  ];
}

function dealContextRows(input: UnderwritingReportBuildInput): UnderwritingReportSummaryRow[] {
  return [
    { rowType: "summary", label: "Deal", value: input.dealDisplayName?.trim() || "Deal", detail: input.request.dealId, stableOrdinal: 1 },
    { rowType: "summary", label: "Property", value: input.propertyDisplayName?.trim() || input.snapshot.primaryPropertyId || "Property", detail: input.snapshot.propertyIds.join(", "), stableOrdinal: 2 },
    { rowType: "summary", label: "Schema", value: input.snapshot.schemaId, detail: input.snapshot.schemaVersion, stableOrdinal: 3 },
    { rowType: "summary", label: "Currency", value: input.snapshot.calculationCurrency, detail: `${readable(input.snapshot.unitSystem)} units`, stableOrdinal: 4 },
    { rowType: "summary", label: "Reporting Period", value: readable(input.snapshot.reportingPeriod), detail: input.snapshot.valuationDate ? `Valuation date ${input.snapshot.valuationDate}` : undefined, stableOrdinal: 5 },
  ];
}

function inputRowsFor(snapshot: UnderwritingSnapshotRecord): UnderwritingReportInputRow[] {
  const provenanceByInput = provenanceByInputId(snapshot.provenance);
  return [...snapshot.inputs].sort(byStableOrdinal).map((input) => ({
    rowType: "input",
    inputId: input.inputId,
    label: inputLabel(input.inputId),
    displayValue: input.displayValue,
    normalizedValue: input.normalizedValue,
    requirementState: input.requirementState,
    reviewState: reviewStateFor(input),
    validationStatus: input.validationStatus,
    completenessState: input.completenessState,
    assumptionState: input.assumptionState,
    conflictState: input.conflictState,
    canonicalUnit: input.canonicalUnit,
    canonicalPeriod: input.canonicalPeriod,
    canonicalCurrency: input.canonicalCurrency,
    provenanceRefs: provenanceByInput.get(input.inputId) ?? [],
    deterministicInputHash: input.deterministicInputHash,
    stableOrdinal: input.stableOrdinal,
  }));
}

function metricRowsFor(run: UnderwritingCoreOutputRunRecord): UnderwritingReportMetricRow[] {
  const projected = new Set(projectCoreOutputs(run).map((row) => row.formulaId));
  return [...run.results]
    .filter((result) => projected.has(result.formulaId))
    .sort(byStableOrdinal)
    .map(metricRow);
}

function metricRow(result: UnderwritingCoreFormulaResultRecord): UnderwritingReportMetricRow {
  return {
    rowType: "metric",
    formulaId: result.formulaId,
    label: formulaLabel(result.formulaId, result.formulaVersion),
    group: result.outputGroup,
    status: result.status,
    displayText: result.displayText,
    rawValue: result.rawValue,
    outputUnit: result.outputUnit,
    outputPeriod: result.outputPeriod,
    currency: result.currency,
    formulaVersion: result.formulaVersion,
    formulaRegistryVersion: result.formulaRegistryVersion,
    formulaExplanation: result.formulaExplanation,
    warnings: [...result.warnings],
    errors: [...result.errors],
    assumptions: [...result.assumptionDisclosure],
    inputRefs: [...result.inputRefs],
    dependencyResultIds: [...result.dependencyResultIds],
    provenanceRefs: result.provenance.map(provenanceReference),
    deterministicHash: result.deterministicHash,
    stableOrdinal: result.stableOrdinal,
  };
}

function issueRows(snapshot: UnderwritingSnapshotRecord, run: UnderwritingCoreOutputRunRecord): UnderwritingReportIssueRow[] {
  const rows: UnderwritingReportIssueRow[] = [];
  let stableOrdinal = 1;
  for (const inputId of snapshot.missingRequiredInputIds) rows.push(issue("missing_input", "blocking", `${inputLabel(inputId)} is missing.`, stableOrdinal++, inputId));
  for (const inputId of snapshot.conflictedRequiredInputIds) rows.push(issue("conflict", "blocking", `${inputLabel(inputId)} has an unresolved source conflict.`, stableOrdinal++, inputId));
  for (const inputId of snapshot.invalidRequiredInputIds) rows.push(issue("invalid_input", "blocking", `${inputLabel(inputId)} is invalid.`, stableOrdinal++, inputId));
  for (const inputId of snapshot.provisionalRequiredInputIds) rows.push(issue("preliminary_input", "warning", `${inputLabel(inputId)} is preliminary and should be verified before reliance.`, stableOrdinal++, inputId));
  for (const message of snapshot.blockingReasons) rows.push(issue("contract", "blocking", message, stableOrdinal++));
  for (const message of snapshot.warnings) rows.push(issue("snapshot_warning", "warning", message, stableOrdinal++));
  for (const message of run.warnings) rows.push(issue("run_warning", "warning", message, stableOrdinal++));
  for (const message of run.errors) rows.push(issue("run_error", "blocking", message, stableOrdinal++));
  for (const result of run.results) {
    for (const message of result.warnings) rows.push(issue("result_warning", "warning", message, stableOrdinal++, undefined, result.formulaId));
    for (const message of result.errors) rows.push(issue("result_error", "blocking", message, stableOrdinal++, undefined, result.formulaId));
  }
  return rows;
}

function assumptionRows(snapshot: UnderwritingSnapshotRecord, run: UnderwritingCoreOutputRunRecord): UnderwritingReportAssumptionRow[] {
  const rows: UnderwritingReportAssumptionRow[] = [];
  let stableOrdinal = 1;
  const formulaIdsByInput = new Map<UnderwritingInputId, Set<FormulaId>>();
  for (const result of run.results) {
    for (const inputId of [...result.inputRefs, ...result.assumptionIds, ...result.preliminaryInputIds]) {
      const key = inputId as UnderwritingInputId;
      formulaIdsByInput.set(key, (formulaIdsByInput.get(key) ?? new Set()).add(result.formulaId));
    }
  }
  for (const input of [...snapshot.inputs].sort(byStableOrdinal)) {
    if (input.assumptionState === "none" && input.completenessState !== "preliminary_allowed") continue;
    rows.push({
      rowType: "assumption",
      label: inputLabel(input.inputId),
      source: "snapshot_input",
      inputId: input.inputId,
      formulaIds: [...(formulaIdsByInput.get(input.inputId) ?? new Set())].sort(),
      disclosure: `${input.displayValue} is classified as ${readable(input.assumptionState || input.completenessState)}.`,
      stableOrdinal: stableOrdinal++,
    });
  }
  for (const disclosure of unique([...run.assumptionDisclosures, ...run.results.flatMap((result) => result.assumptionDisclosure)])) {
    rows.push({
      rowType: "assumption",
      label: "Formula disclosure",
      source: "formula_disclosure",
      formulaIds: run.results.filter((result) => result.assumptionDisclosure.includes(disclosure)).map((result) => result.formulaId).sort(),
      disclosure,
      stableOrdinal: stableOrdinal++,
    });
  }
  return rows;
}

function scenarioRowsFor(input: UnderwritingReportBuildInput): UnderwritingReportScenarioRow[] {
  const allowed = input.request.includeScenarioIds ? new Set(input.request.includeScenarioIds) : undefined;
  return (input.scenarios ?? [])
    .filter((scenario) => !allowed || allowed.has(scenario.scenario.scenarioId))
    .map((scenario, index) => {
      const summary = projectScenarioSummary(scenario);
      return {
        rowType: "scenario" as const,
        scenarioId: summary.scenarioId,
        name: summary.name,
        scenarioType: summary.type,
        status: summary.status,
        readiness: summary.readiness,
        changedInputCount: summary.changedInputCount,
        changedOutputCount: scenario.comparison.changedOutputIds.length,
        comparisonRows: projectScenarioComparison(scenario).map((row) => ({
          formulaId: row.formulaId,
          label: formulaLabel(row.formulaId),
          baseRawValue: row.baseRawValue,
          scenarioRawValue: row.scenarioRawValue,
          rawDelta: row.rawDelta,
          percentageDelta: row.percentageDelta,
          statusChanged: row.statusChanged,
          formulaVersionMatches: row.formulaVersionMatches,
        })),
        overrideRows: projectScenarioOverrides(scenario).map((row) => ({
          inputId: row.inputId,
          label: inputLabel(row.inputId),
          proposedDisplayValue: String(row.scenarioValue ?? "Not available"),
          rationaleCategory: "scenario_override",
          sourceProvenanceType: "scenario_user_entry",
        })),
        warnings: [...summary.warnings, ...scenario.warnings],
        errors: scenario.errors.map((error) => error.safeMessage),
        stableOrdinal: index + 1,
      };
    })
    .sort((a, b) => a.stableOrdinal - b.stableOrdinal);
}

function sensitivityRowsFor(input: UnderwritingReportBuildInput): UnderwritingReportSensitivityRow[] {
  const allowed = input.request.includeSensitivityIds ? new Set(input.request.includeSensitivityIds) : undefined;
  return (input.sensitivities ?? [])
    .filter((sensitivity) => !allowed || allowed.has(sensitivity.definition.sensitivityId))
    .map((sensitivity, index) => ({
      rowType: "sensitivity" as const,
      sensitivityId: sensitivity.definition.sensitivityId,
      inputId: sensitivity.definition.inputId,
      inputLabel: inputLabel(sensitivity.definition.inputId),
      method: sensitivity.definition.method,
      status: sensitivity.definition.status,
      pointCount: sensitivity.definition.pointCount,
      targetFormulaIds: [...sensitivity.definition.targetFormulaIds],
      points: projectSensitivityPoints(sensitivity).map((point) => ({
        pointOrdinal: point.pointOrdinal,
        testedInputValue: point.testedInputValue,
        status: point.status,
        resultSetHash: point.resultSetHash,
        targetOutputs: point.targetOutputs.map((output) => ({
          formulaId: output.formulaId,
          label: formulaLabel(output.formulaId),
          status: output.status,
          displayText: output.displayText,
          rawValue: output.rawValue,
          resultHash: output.resultHash,
        })),
      })),
      warnings: [...sensitivity.warnings],
      errors: sensitivity.errors.map((error) => error.safeMessage),
      stableOrdinal: index + 1,
    }));
}

function formulaManifestRows(snapshot: UnderwritingSnapshotRecord, run: UnderwritingCoreOutputRunRecord): UnderwritingReportFormulaManifestRow[] {
  const resultByFormula = new Map(run.results.map((result) => [result.formulaId, result]));
  return [...snapshot.formulaManifest].sort(byStableOrdinal).map((entry) => {
    const result = resultByFormula.get(entry.formulaId);
    return {
      rowType: "formula_manifest",
      formulaId: entry.formulaId,
      label: formulaLabel(entry.formulaId, entry.formulaVersion),
      formulaVersion: entry.formulaVersion,
      formulaRegistryVersion: entry.formulaRegistryVersion,
      supportedBySchema: entry.supportedBySchema,
      readinessStatus: entry.readinessStatus,
      requiredInputIds: [...entry.requiredInputIds],
      missingInputIds: [...entry.missingInputIds],
      blockedInputIds: [...entry.blockedInputIds],
      assumptionDependentInputIds: [...entry.assumptionDependentInputIds],
      preliminaryInputIds: [...entry.preliminaryInputIds],
      executable: entry.executable,
      resultStatus: result?.status,
      resultHash: result?.deterministicHash,
      stableOrdinal: entry.stableOrdinal,
    };
  });
}

function provenanceRows(snapshot: UnderwritingSnapshotRecord, run: UnderwritingCoreOutputRunRecord): UnderwritingReportProvenanceRow[] {
  const referencedByFormulaIds = new Map<string, Set<FormulaId>>();
  for (const result of run.results) {
    for (const provenance of result.provenance) {
      const key = provenanceKey(provenanceReference(provenance));
      referencedByFormulaIds.set(key, (referencedByFormulaIds.get(key) ?? new Set()).add(result.formulaId));
    }
  }
  const rows = new Map<string, UnderwritingReportProvenanceRow>();
  let stableOrdinal = 1;
  for (const provenance of [...snapshot.provenance, ...run.results.flatMap((result) => result.provenance)].map(provenanceReference)) {
    const key = provenanceKey(provenance);
    if (rows.has(key)) continue;
    rows.set(key, {
      rowType: "provenance",
      ...provenance,
      inputLabel: inputLabel(provenance.inputId),
      referencedByFormulaIds: [...(referencedByFormulaIds.get(key) ?? new Set())].sort(),
      stableOrdinal: stableOrdinal++,
    });
  }
  return [...rows.values()];
}

function sourceLimitations(snapshot: UnderwritingSnapshotRecord, run: UnderwritingCoreOutputRunRecord) {
  const limitations: string[] = [];
  if (snapshot.missingRequiredInputIds.length) limitations.push(`${snapshot.missingRequiredInputIds.length} required input${snapshot.missingRequiredInputIds.length === 1 ? " is" : "s are"} missing.`);
  if (snapshot.conflictedRequiredInputIds.length) limitations.push(`${snapshot.conflictedRequiredInputIds.length} required input${snapshot.conflictedRequiredInputIds.length === 1 ? " has" : "s have"} unresolved source conflicts.`);
  if (snapshot.provisionalRequiredInputIds.length) limitations.push(`${snapshot.provisionalRequiredInputIds.length} required input${snapshot.provisionalRequiredInputIds.length === 1 ? " is" : "s are"} preliminary.`);
  if (run.preliminaryResultCount) limitations.push(`${run.preliminaryResultCount} output${run.preliminaryResultCount === 1 ? " is" : "s are"} preliminary.`);
  if (run.incompleteResultCount) limitations.push(`${run.incompleteResultCount} output${run.incompleteResultCount === 1 ? " is" : "s are"} incomplete.`);
  if (run.blockedResultCount) limitations.push(`${run.blockedResultCount} output${run.blockedResultCount === 1 ? " is" : "s are"} blocked.`);
  if (!limitations.length) limitations.push("All displayed outputs are copied from the selected canonical underwriting run.");
  return limitations;
}

function groupMetrics(rows: UnderwritingReportMetricRow[]): Partial<Record<UnderwritingOutputGroup, UnderwritingReportMetricRow[]>> {
  const groups: Partial<Record<UnderwritingOutputGroup, UnderwritingReportMetricRow[]>> = {};
  for (const row of rows) groups[row.group] = [...(groups[row.group] ?? []), row];
  return groups;
}

function versionRows(manifest: UnderwritingReportVersionManifest): UnderwritingReportManifestRow[] {
  return Object.entries(manifest)
    .filter(([, value]) => value !== undefined)
    .map(([key, value], index) => ({ rowType: "manifest", key, value: String(value), stableOrdinal: index + 1 }));
}

function methodologyRows(): UnderwritingReportBoundaryRow[] {
  return [
    { rowType: "boundary", label: "Calculation boundary", value: "This payload copies canonical underwriting snapshot and run records. It does not calculate, estimate, enrich, rank, or recommend.", stableOrdinal: 1 },
    { rowType: "boundary", label: "Rendering boundary", value: "Future PDF, spreadsheet, CSV, web, and native clients must render this payload without changing values or formulas.", stableOrdinal: 2 },
    { rowType: "boundary", label: "Verification boundary", value: "Source quality, missing inputs, conflicts, warnings, and preliminary assumptions remain visible in the payload.", stableOrdinal: 3 },
  ];
}

function sectionStatus(
  id: UnderwritingReportSectionId,
  rows: UnderwritingReportRow[],
  issues: UnderwritingReportIssueRow[],
  snapshot: UnderwritingSnapshotRecord,
  run: UnderwritingCoreOutputRunRecord,
): UnderwritingReportSectionStatus {
  if (!rows.length) return id === "scenario_comparison" || id === "sensitivity_summary" ? "not_applicable" : "unavailable";
  if (id === "issues") return issues.some((issue) => issue.severity === "blocking") ? "blocked" : issues.length ? "available_with_warnings" : "available";
  if (id === "input_summary") {
    if (snapshot.conflictedRequiredInputIds.length) return "blocked";
    if (snapshot.missingRequiredInputIds.length) return "incomplete";
    if (snapshot.provisionalRequiredInputIds.length) return "preliminary";
  }
  if (id === "core_outputs" && run.status !== "complete") {
    if (run.status === "blocked" || run.blockedResultCount > 0) return "blocked";
    if (run.status === "incomplete" || run.incompleteResultCount > 0) return "incomplete";
    if (run.status === "preliminary" || run.preliminaryResultCount > 0) return "preliminary";
    if (run.warningCount > 0) return "available_with_warnings";
  }
  return issues.some((issue) => issue.severity === "warning") ? "available_with_warnings" : "available";
}

function reportStatus(snapshot: UnderwritingSnapshotRecord, run: UnderwritingCoreOutputRunRecord): UnderwritingReportSectionStatus {
  if (snapshot.conflictedRequiredInputIds.length || run.blockedResultCount) return "blocked";
  if (snapshot.missingRequiredInputIds.length || run.incompleteResultCount) return "incomplete";
  if (snapshot.provisionalRequiredInputIds.length || run.preliminaryResultCount) return "preliminary";
  if (snapshot.warnings.length || run.warningCount) return "available_with_warnings";
  return "available";
}

function reviewStateFor(input: UnderwritingSnapshotInputRecord): UnderwritingReportReviewState {
  if (input.conflictState === "unresolved") return "conflicted";
  if (input.completenessState === "missing") return "missing";
  if (input.completenessState === "deferred") return "deferred";
  if (input.completenessState === "rejected") return "rejected";
  if (input.validationStatus !== "valid" || input.completenessState === "preliminary_allowed") return "needs_review";
  return "accepted";
}

function provenanceByInputId(provenance: UnderwritingSnapshotProvenanceReference[]) {
  const byInput = new Map<UnderwritingInputId, UnderwritingReportProvenanceReference[]>();
  for (const item of provenance.map(provenanceReference)) byInput.set(item.inputId, [...(byInput.get(item.inputId) ?? []), item]);
  return byInput;
}

function provenanceReference(item: UnderwritingSnapshotProvenanceReference | UnderwritingCoreFormulaResultRecord["provenance"][number]): UnderwritingReportProvenanceReference {
  return {
    inputId: item.inputId as UnderwritingInputId,
    sourceFactId: item.sourceFactId,
    acceptedAssumptionId: item.acceptedAssumptionId,
    preliminaryAssumptionId: item.preliminaryAssumptionId,
    sourceRecordId: item.sourceRecordId,
    evidenceId: item.evidenceId,
    sourceAnchor: item.sourceAnchor,
    sourceClassification: "sourceClassification" in item ? item.sourceClassification : undefined,
    verificationState: item.verificationState,
  };
}

function provenanceKey(item: UnderwritingReportProvenanceReference) {
  return stableSerialize({
    inputId: item.inputId,
    sourceFactId: item.sourceFactId,
    acceptedAssumptionId: item.acceptedAssumptionId,
    preliminaryAssumptionId: item.preliminaryAssumptionId,
    sourceRecordId: item.sourceRecordId,
    evidenceId: item.evidenceId,
    sourceAnchor: item.sourceAnchor,
  });
}

function issue(
  category: UnderwritingReportIssueCategory,
  severity: UnderwritingReportIssueSeverity,
  message: string,
  stableOrdinal: number,
  inputId?: UnderwritingInputId,
  formulaId?: FormulaId,
): UnderwritingReportIssueRow {
  return { rowType: "issue", category, severity, message, inputId, formulaId, stableOrdinal };
}

function formulaLabel(formulaId: FormulaId, version: string | "latest" = "latest") {
  return resolveFormulaDefinition(formulaId, version)?.displayName ?? readable(formulaId);
}

function inputLabel(inputId: UnderwritingInputId) {
  return resolveUnderwritingInputDefinition(inputId)?.displayName ?? readable(inputId);
}

function sectionTitle(sectionId: UnderwritingReportSectionId) {
  const titles: Record<UnderwritingReportSectionId, string> = {
    executive_summary: "Executive Summary",
    property_deal_context: "Property and Deal Context",
    source_limitations: "Source Limitations",
    input_summary: "Underwriting Inputs",
    core_outputs: "Core Outputs",
    financing: "Financing",
    income: "Income",
    operating_expenses: "Operating Expenses",
    operating_performance: "Operating Performance",
    leverage_and_coverage: "Leverage and Coverage",
    returns: "Returns",
    assumptions_and_preliminary_values: "Assumptions and Preliminary Values",
    issues: "Issues",
    scenario_comparison: "Scenario Comparison",
    sensitivity_summary: "Sensitivity Summary",
    formula_and_version_manifest: "Formula and Version Manifest",
    provenance_index: "Provenance Index",
    methodology_and_boundaries: "Methodology and Boundaries",
  };
  return titles[sectionId];
}

function readable(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function unique(values: string[]) {
  return [...new Set(values.filter((value) => value.trim().length > 0))].sort();
}

function byStableOrdinal<T extends { stableOrdinal: number }>(left: T, right: T) {
  return left.stableOrdinal - right.stableOrdinal;
}

function reportError(code: UnderwritingReportContractErrorCode, safeMessage: string) {
  return new UnderwritingReportContractError(code, safeMessage);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const entry of Object.values(value as Record<string, unknown>)) deepFreeze(entry);
  }
  return value;
}

function stableHash(value: unknown) {
  const serialized = stableSerialize(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `report_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function stableSerialize(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "undefined";
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`)
    .join(",")}}`;
}
