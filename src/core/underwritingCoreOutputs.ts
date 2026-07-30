import {
  FORMULA_REGISTRY_VERSION,
  executeFormula,
  resolveFormulaDefinition,
  type FormulaExecutionResult,
  type FormulaId,
  type FormulaInputClassification,
  type FormulaInputValue,
  type FormulaPeriod,
  type FormulaUnit,
} from "./formulaRegistry";
import type {
  UnderwritingSnapshotFormulaManifestEntry,
  UnderwritingSnapshotInputRecord,
  UnderwritingSnapshotProvenanceReference,
  UnderwritingSnapshotRecord,
} from "./underwritingSnapshots";

export const UNDERWRITING_CORE_OUTPUT_RUN_VERSION = "underwriting-core-output-run-v1";
export const UNDERWRITING_CORE_OUTPUT_HASH_VERSION = "underwriting-core-output-result-set-hash-v1";

export type UnderwritingRunStatus =
  | "queued"
  | "validating_snapshot"
  | "calculating"
  | "complete"
  | "complete_with_warnings"
  | "preliminary"
  | "incomplete"
  | "blocked"
  | "failed"
  | "cancelled";

export type UnderwritingCoreFormulaResultStatus =
  | "calculated"
  | "calculated_with_warning"
  | "preliminary"
  | "incomplete"
  | "blocked_conflict"
  | "invalid_input"
  | "unsupported_unit"
  | "unsupported_currency"
  | "divide_by_zero"
  | "dependency_failed"
  | "formula_disabled"
  | "formula_not_found"
  | "version_not_found"
  | "schema_unsupported";

export type UnderwritingOutputGroup =
  | "acquisition"
  | "financing"
  | "income"
  | "expenses"
  | "operating_performance"
  | "leverage"
  | "returns";

export type UnderwritingCoreOutputRunRequest = {
  workspaceId: string;
  dealId: string;
  snapshotId: string;
  expectedSnapshotHash: string;
  actorId: string;
  idempotencyKey: string;
  requestedAt: string;
};

export type UnderwritingCoreOutputCreationResult = {
  run: UnderwritingCoreOutputRunRecord;
  reusedByIdempotency: boolean;
  reusedByResultSetHash: boolean;
};

export type UnderwritingCoreOutputRunStore = {
  loadSnapshot(workspaceId: string, snapshotId: string): Promise<UnderwritingSnapshotRecord | undefined>;
  findByIdempotencyKey(workspaceId: string, idempotencyKey: string): Promise<UnderwritingCoreOutputRunRecord | undefined>;
  findByResultSetHash(workspaceId: string, snapshotId: string, resultSetHash: string): Promise<UnderwritingCoreOutputRunRecord | undefined>;
  saveRun(run: UnderwritingCoreOutputRunRecord): Promise<UnderwritingCoreOutputRunRecord>;
};

export type UnderwritingCoreOutputRunRecord = {
  runId: string;
  workspaceId: string;
  dealId: string;
  snapshotId: string;
  snapshotHash: string;
  snapshotManifestHash: string;
  engineVersion: typeof UNDERWRITING_CORE_OUTPUT_RUN_VERSION;
  formulaRegistryVersion: typeof FORMULA_REGISTRY_VERSION;
  hashVersion: typeof UNDERWRITING_CORE_OUTPUT_HASH_VERSION;
  status: UnderwritingRunStatus;
  requestedBy: string;
  idempotencyKey: string;
  requestedAt: string;
  startedAt: string;
  completedAt?: string;
  calculationOrder: string[];
  resultSetHash: string;
  dependencyGraphHash: string;
  formulaVersionManifestHash: string;
  resultCount: number;
  calculatedResultCount: number;
  warningCount: number;
  blockedResultCount: number;
  incompleteResultCount: number;
  preliminaryResultCount: number;
  warnings: string[];
  errors: string[];
  assumptionDisclosures: string[];
  snapshotReadinessState: string;
  results: UnderwritingCoreFormulaResultRecord[];
};

export type UnderwritingCoreFormulaResultRecord = {
  resultId: string;
  runId: string;
  workspaceId: string;
  dealId: string;
  snapshotId: string;
  formulaId: FormulaId;
  formulaVersion: string;
  formulaRegistryVersion: typeof FORMULA_REGISTRY_VERSION;
  outputGroup: UnderwritingOutputGroup;
  status: UnderwritingCoreFormulaResultStatus;
  rawValue?: number;
  displayValue?: number;
  displayText: string;
  outputUnit?: FormulaUnit;
  outputPeriod?: FormulaPeriod;
  currency?: string;
  precision?: unknown;
  inputRefs: string[];
  dependencyResultIds: string[];
  sourceFactIds: string[];
  assumptionIds: string[];
  preliminaryInputIds: string[];
  missingInputIds: string[];
  blockedInputIds: string[];
  warnings: string[];
  errors: string[];
  formulaExplanation: string;
  assumptionDisclosure: string[];
  provenance: UnderwritingCoreOutputProvenance[];
  deterministicHash: string;
  stableOrdinal: number;
};

export type UnderwritingCoreOutputProvenance = {
  inputId: string;
  sourceFactId?: string;
  acceptedAssumptionId?: string;
  preliminaryAssumptionId?: string;
  sourceRecordId?: string;
  evidenceId?: string;
  sourceAnchor?: string | Record<string, unknown>;
  verificationState?: string;
};

export type UnderwritingRunSummaryProjection = {
  runId: string;
  workspaceId: string;
  dealId: string;
  snapshotId: string;
  status: UnderwritingRunStatus;
  resultSetHash: string;
  resultCount: number;
  calculatedResultCount: number;
  warningCount: number;
  blockedResultCount: number;
  incompleteResultCount: number;
  preliminaryResultCount: number;
  requestedAt: string;
  completedAt?: string;
};

export type UnderwritingCoreOutputProjection = {
  runId: string;
  formulaId: FormulaId;
  outputGroup: UnderwritingOutputGroup;
  status: UnderwritingCoreFormulaResultStatus;
  displayText: string;
  rawValue?: number;
  currency?: string;
  outputUnit?: FormulaUnit;
  outputPeriod?: FormulaPeriod;
};

export type UnderwritingCoreOutputComparison = {
  leftRunId: string;
  rightRunId: string;
  sameResultSetHash: boolean;
  changedFormulaIds: FormulaId[];
  changedStatusFormulaIds: FormulaId[];
  changedValueFormulaIds: FormulaId[];
};

export async function createUnderwritingCoreOutputRun(
  request: UnderwritingCoreOutputRunRequest,
  store: UnderwritingCoreOutputRunStore,
): Promise<UnderwritingCoreOutputCreationResult> {
  validateRunRequest(request);
  const snapshot = await store.loadSnapshot(request.workspaceId, request.snapshotId);
  if (!snapshot) throw runError("snapshot_not_found", "The underwriting snapshot is not available in this BRIX workspace.");
  if (snapshot.workspaceId !== request.workspaceId || snapshot.dealId !== request.dealId) throw runError("snapshot_scope_mismatch", "The underwriting snapshot does not match the requested workspace and Deal.");
  if (snapshot.contentHash !== request.expectedSnapshotHash) throw runError("snapshot_hash_mismatch", "The underwriting snapshot changed before calculation. Refresh and retry.");

  const draft = buildUnderwritingCoreOutputRun(snapshot, request);
  const existingByKey = await store.findByIdempotencyKey(request.workspaceId, request.idempotencyKey.trim());
  if (existingByKey) {
    if (existingByKey.resultSetHash !== draft.resultSetHash || existingByKey.snapshotHash !== draft.snapshotHash) {
      throw runError("idempotency_conflict", "This underwriting run retry key was already used with different snapshot output.");
    }
    return { run: deepFreeze(existingByKey), reusedByIdempotency: true, reusedByResultSetHash: false };
  }

  const existingByHash = await store.findByResultSetHash(request.workspaceId, request.snapshotId, draft.resultSetHash);
  if (existingByHash) return { run: deepFreeze(existingByHash), reusedByIdempotency: false, reusedByResultSetHash: true };

  const saved = await store.saveRun(draft);
  return { run: deepFreeze(saved), reusedByIdempotency: false, reusedByResultSetHash: false };
}

export function buildUnderwritingCoreOutputRun(
  snapshot: UnderwritingSnapshotRecord,
  request: UnderwritingCoreOutputRunRequest,
): UnderwritingCoreOutputRunRecord {
  const base = {
    workspaceId: snapshot.workspaceId,
    dealId: snapshot.dealId,
    snapshotId: snapshot.snapshotId,
    snapshotHash: snapshot.contentHash,
    snapshotManifestHash: snapshot.manifestHash,
    engineVersion: UNDERWRITING_CORE_OUTPUT_RUN_VERSION,
    formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
    hashVersion: UNDERWRITING_CORE_OUTPUT_HASH_VERSION,
    requestedBy: request.actorId,
    idempotencyKey: request.idempotencyKey.trim(),
    requestedAt: request.requestedAt,
    startedAt: request.requestedAt,
    snapshotReadinessState: snapshot.readinessState,
  } satisfies Partial<UnderwritingCoreOutputRunRecord>;

  const blocking = snapshotBlockingState(snapshot);
  const allowedManifest = executableManifest(snapshot);
  const dependencyGraphHash = stableHash(allowedManifest.map((entry) => ({
    formulaId: entry.formulaId,
    formulaVersion: entry.formulaVersion,
    dependencies: entry.dependencyFormulaVersions,
  })));
  const formulaVersionManifestHash = stableHash(allowedManifest.map((entry) => ({
    formulaId: entry.formulaId,
    formulaVersion: entry.formulaVersion,
    registryVersion: entry.formulaRegistryVersion,
  })));

  if (blocking) {
    const results = [...snapshot.formulaManifest]
      .sort(compareManifest)
      .map((entry, index) => blockedResultForSnapshot(entry, snapshot, request, blocking.resultStatus, blocking.message, index + 1));
    const resultSetHash = resultSetHashFor(results, snapshot, dependencyGraphHash, formulaVersionManifestHash);
    return deepFreeze(finishRun({
      ...base,
      runId: runIdFromHash(stableHash({ snapshotId: snapshot.snapshotId, resultSetHash, idempotencyKey: request.idempotencyKey.trim() })),
      status: blocking.runStatus,
      completedAt: request.requestedAt,
      calculationOrder: results.map((result) => result.formulaId),
      resultSetHash,
      dependencyGraphHash,
      formulaVersionManifestHash,
      warnings: blocking.runStatus === "preliminary" ? [blocking.message] : [],
      errors: blocking.runStatus === "preliminary" ? [] : [blocking.message],
      assumptionDisclosures: [],
      results,
    } as UnderwritingCoreOutputRunRecord));
  }

  const engine = new CoreOutputExecutionEngine(snapshot, request, allowedManifest);
  const results = engine.executeAll();
  const resultSetHash = resultSetHashFor(results, snapshot, dependencyGraphHash, formulaVersionManifestHash);
  return deepFreeze(finishRun({
    ...base,
    runId: runIdFromHash(stableHash({ snapshotId: snapshot.snapshotId, resultSetHash, idempotencyKey: request.idempotencyKey.trim() })),
    status: runStatusForResults(results),
    completedAt: request.requestedAt,
    calculationOrder: results.map((result) => result.formulaId),
    resultSetHash,
    dependencyGraphHash,
    formulaVersionManifestHash,
    warnings: sortedUniqueStrings(results.flatMap((result) => result.warnings)),
    errors: sortedUniqueStrings(results.flatMap((result) => result.errors)),
    assumptionDisclosures: sortedUniqueStrings(results.flatMap((result) => result.assumptionDisclosure)),
    results,
  } as UnderwritingCoreOutputRunRecord));
}

export function summarizeUnderwritingCoreOutputRun(run: UnderwritingCoreOutputRunRecord): UnderwritingRunSummaryProjection {
  return {
    runId: run.runId,
    workspaceId: run.workspaceId,
    dealId: run.dealId,
    snapshotId: run.snapshotId,
    status: run.status,
    resultSetHash: run.resultSetHash,
    resultCount: run.resultCount,
    calculatedResultCount: run.calculatedResultCount,
    warningCount: run.warningCount,
    blockedResultCount: run.blockedResultCount,
    incompleteResultCount: run.incompleteResultCount,
    preliminaryResultCount: run.preliminaryResultCount,
    requestedAt: run.requestedAt,
    completedAt: run.completedAt,
  };
}

export function projectCoreOutputs(run: UnderwritingCoreOutputRunRecord): UnderwritingCoreOutputProjection[] {
  return run.results.map((result) => ({
    runId: run.runId,
    formulaId: result.formulaId,
    outputGroup: result.outputGroup,
    status: result.status,
    displayText: result.displayText,
    rawValue: result.rawValue,
    currency: result.currency,
    outputUnit: result.outputUnit,
    outputPeriod: result.outputPeriod,
  }));
}

export function projectCoreOutputGroup(run: UnderwritingCoreOutputRunRecord, outputGroup: UnderwritingOutputGroup): UnderwritingCoreOutputProjection[] {
  return projectCoreOutputs(run).filter((result) => result.outputGroup === outputGroup);
}

export function getCoreOutputResultDetail(run: UnderwritingCoreOutputRunRecord, formulaId: FormulaId) {
  return run.results.find((result) => result.formulaId === formulaId);
}

export function getLatestConfirmedExecutableResultSet(runs: UnderwritingCoreOutputRunRecord[]) {
  return [...runs]
    .filter((run) => ["complete", "complete_with_warnings"].includes(run.status))
    .sort((a, b) => (b.completedAt ?? b.requestedAt).localeCompare(a.completedAt ?? a.requestedAt) || b.runId.localeCompare(a.runId))[0];
}

export function compareUnderwritingCoreOutputRuns(left: UnderwritingCoreOutputRunRecord, right: UnderwritingCoreOutputRunRecord): UnderwritingCoreOutputComparison {
  const leftByFormula = new Map(left.results.map((result) => [result.formulaId, result]));
  const rightByFormula = new Map(right.results.map((result) => [result.formulaId, result]));
  const formulaIds = sortedUniqueStrings([...leftByFormula.keys(), ...rightByFormula.keys()]) as FormulaId[];
  return {
    leftRunId: left.runId,
    rightRunId: right.runId,
    sameResultSetHash: left.resultSetHash === right.resultSetHash,
    changedFormulaIds: formulaIds.filter((formulaId) => leftByFormula.get(formulaId)?.deterministicHash !== rightByFormula.get(formulaId)?.deterministicHash),
    changedStatusFormulaIds: formulaIds.filter((formulaId) => leftByFormula.get(formulaId)?.status !== rightByFormula.get(formulaId)?.status),
    changedValueFormulaIds: formulaIds.filter((formulaId) => leftByFormula.get(formulaId)?.rawValue !== rightByFormula.get(formulaId)?.rawValue),
  };
}

class CoreOutputExecutionEngine {
  private readonly byFormulaId: Map<FormulaId, UnderwritingSnapshotFormulaManifestEntry>;
  private readonly snapshotInputs: Map<string, FormulaInputValue>;
  private readonly snapshotInputRecords: Map<string, UnderwritingSnapshotInputRecord>;
  private readonly provenanceByInput: Map<string, UnderwritingCoreOutputProvenance[]>;
  private readonly results = new Map<FormulaId, UnderwritingCoreFormulaResultRecord>();
  private readonly executing = new Set<FormulaId>();

  constructor(
    private readonly snapshot: UnderwritingSnapshotRecord,
    private readonly request: UnderwritingCoreOutputRunRequest,
    manifest: UnderwritingSnapshotFormulaManifestEntry[],
  ) {
    this.byFormulaId = new Map(manifest.map((entry) => [entry.formulaId, entry]));
    this.snapshotInputRecords = new Map(snapshot.inputs.map((input) => [input.inputId, input]));
    this.snapshotInputs = new Map(snapshot.inputs.map((input) => [input.inputId, toFormulaInputValue(input)]));
    this.provenanceByInput = groupProvenance(snapshot.provenance);
  }

  executeAll() {
    return [...this.byFormulaId.values()]
      .sort(compareManifest)
      .map((entry, index) => this.execute(entry.formulaId, index + 1));
  }

  private execute(formulaId: FormulaId, ordinal: number): UnderwritingCoreFormulaResultRecord {
    const existing = this.results.get(formulaId);
    if (existing) return existing;
    const manifest = this.byFormulaId.get(formulaId);
    if (!manifest) {
      const result = missingFormulaResult(formulaId, this.snapshot, this.request, "schema_unsupported", "Formula is not present in the snapshot manifest.", ordinal);
      this.results.set(formulaId, result);
      return result;
    }
    if (this.executing.has(formulaId)) {
      const result = missingFormulaResult(formulaId, this.snapshot, this.request, "dependency_failed", "Formula dependency cycle detected.", ordinal);
      this.results.set(formulaId, result);
      return result;
    }
    this.executing.add(formulaId);
    const definition = resolveFormulaDefinition(manifest.formulaId, manifest.formulaVersion);
    if (!definition) {
      const result = missingFormulaResult(formulaId, this.snapshot, this.request, "version_not_found", "Snapshot formula version is not available in the registry.", ordinal);
      this.executing.delete(formulaId);
      this.results.set(formulaId, result);
      return result;
    }
    if (definition.status !== "active") {
      const result = missingFormulaResult(formulaId, this.snapshot, this.request, "formula_disabled", "Snapshot formula is not active.", ordinal);
      this.executing.delete(formulaId);
      this.results.set(formulaId, result);
      return result;
    }

    const dependencyResultIds: string[] = [];
    const dependencyResults: UnderwritingCoreFormulaResultRecord[] = [];
    const formulaInputs: Record<string, FormulaInputValue> = {};
    for (const input of definition.inputs) {
      const direct = this.snapshotInputs.get(input.id);
      if (direct && direct.value !== null && direct.value !== undefined && direct.value !== "") {
        formulaInputs[input.id] = direct;
        continue;
      }
      const dependencyFormulaId = resolveDependencyFormulaId(input.id, manifest, definition.dependencies.map((item) => item.formulaId));
      if (dependencyFormulaId) {
        const dependency = this.execute(dependencyFormulaId, ordinal);
        dependencyResultIds.push(dependency.resultId);
        dependencyResults.push(dependency);
        if (!isCalculatedStatus(dependency.status) || dependency.rawValue === undefined) {
          const result = dependencyFailedResult(manifest, this.snapshot, this.request, definition.inputs.map((item) => item.id), dependency, ordinal);
          this.executing.delete(formulaId);
          this.results.set(formulaId, result);
          return result;
        }
        formulaInputs[input.id] = {
          value: dependency.rawValue,
          unit: dependency.outputUnit ?? input.unit,
          period: dependency.outputPeriod ?? input.period,
          currency: dependency.currency,
          classification: dependency.status === "preliminary" ? "preliminary_assumption" : dependency.assumptionIds.length ? "accepted_user_assumption" : "accepted_fact",
          sourceFactIds: dependency.sourceFactIds,
          acceptedAssumptionIds: dependency.assumptionIds,
          inputVersion: dependency.deterministicHash,
          conflictState: "none",
          proposalStatus: "accepted",
        };
      }
    }

    const raw = executeFormula({
      formulaId: manifest.formulaId,
      formulaVersion: manifest.formulaVersion,
      registryVersion: FORMULA_REGISTRY_VERSION,
      calculationId: `${this.request.idempotencyKey}:${manifest.formulaId}`,
      workspaceId: this.snapshot.workspaceId,
      dealId: this.snapshot.dealId,
      propertyIds: this.snapshot.propertyIds,
      inputs: formulaInputs,
      requestedAt: this.request.requestedAt,
      context: {
        snapshotId: this.snapshot.snapshotId,
        snapshotHash: this.snapshot.contentHash,
      },
    });
    const result = this.toCoreResult(manifest, raw, dependencyResultIds, dependencyResults, ordinal);
    this.executing.delete(formulaId);
    this.results.set(formulaId, result);
    return result;
  }

  private toCoreResult(
    manifest: UnderwritingSnapshotFormulaManifestEntry,
    execution: FormulaExecutionResult,
    dependencyResultIds: string[],
    dependencyResults: UnderwritingCoreFormulaResultRecord[],
    ordinal: number,
  ): UnderwritingCoreFormulaResultRecord {
    const status = normalizeFormulaStatus(execution);
    const inputRefs = sortedUniqueStrings(Object.keys(execution.inputsUsed));
    const assumptionDisclosure = [
      ...manifest.assumptionDependentInputIds.map((inputId) => `${inputId} uses an accepted assumption.`),
      ...manifest.preliminaryInputIds.map((inputId) => `${inputId} remains preliminary and cannot be treated as verified.`),
    ].sort();
    const provenance = uniqueProvenance([
      ...inputRefs.flatMap((inputId) => this.provenanceByInput.get(inputId) ?? []),
      ...dependencyResults.flatMap((dependency) => dependency.provenance),
    ]);
    const warnings = sortedUniqueStrings([
      ...execution.warnings,
      ...assumptionDisclosure,
    ]);
    const errors = status === "calculated" || status === "calculated_with_warning" || status === "preliminary" ? [] : [execution.explanation];
    const displayText = displayTextFor(execution);
    const deterministicHash = stableHash({
      formulaId: manifest.formulaId,
      formulaVersion: manifest.formulaVersion,
      registryVersion: manifest.formulaRegistryVersion,
      status,
      rawValue: execution.rawResult,
      displayValue: execution.displayResult,
      outputUnit: execution.outputUnit,
      outputPeriod: execution.period,
      currency: execution.currency,
      inputRefs,
      dependencyResultIds: sortedUniqueStrings(dependencyResultIds),
      sourceFactIds: sortedUniqueStrings(execution.sourceFactIds),
      assumptionIds: sortedUniqueStrings(execution.assumptionIds),
      missingInputIds: sortedUniqueStrings(execution.missingInputs),
      blockedInputIds: sortedUniqueStrings(execution.blockedInputs),
      warnings,
      snapshotHash: this.snapshot.contentHash,
    });
    return {
      resultId: resultIdFromHash(deterministicHash),
      runId: "",
      workspaceId: this.snapshot.workspaceId,
      dealId: this.snapshot.dealId,
      snapshotId: this.snapshot.snapshotId,
      formulaId: manifest.formulaId,
      formulaVersion: manifest.formulaVersion,
      formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
      outputGroup: outputGroupFor(manifest.formulaId),
      status,
      rawValue: execution.rawResult,
      displayValue: execution.displayResult,
      displayText,
      outputUnit: execution.outputUnit,
      outputPeriod: execution.period,
      currency: execution.currency,
      precision: execution.precision,
      inputRefs,
      dependencyResultIds: sortedUniqueStrings(dependencyResultIds),
      sourceFactIds: sortedUniqueStrings(execution.sourceFactIds),
      assumptionIds: sortedUniqueStrings(execution.assumptionIds),
      preliminaryInputIds: sortedUniqueStrings(manifest.preliminaryInputIds),
      missingInputIds: sortedUniqueStrings([...manifest.missingInputIds, ...execution.missingInputs]),
      blockedInputIds: sortedUniqueStrings([...manifest.blockedInputIds, ...execution.blockedInputs]),
      warnings,
      errors,
      formulaExplanation: execution.explanation,
      assumptionDisclosure,
      provenance,
      deterministicHash,
      stableOrdinal: ordinal,
    };
  }
}

function executableManifest(snapshot: UnderwritingSnapshotRecord) {
  return snapshot.formulaManifest
    .filter((entry) => entry.supportedBySchema && entry.formulaRegistryVersion === FORMULA_REGISTRY_VERSION)
    .sort(compareManifest);
}

function snapshotBlockingState(snapshot: UnderwritingSnapshotRecord): { runStatus: UnderwritingRunStatus; resultStatus: UnderwritingCoreFormulaResultStatus; message: string } | undefined {
  if (snapshot.readinessState === "preliminary") return { runStatus: "preliminary", resultStatus: "preliminary", message: "The snapshot is preliminary. BRIX will not present these outputs as confirmed." };
  if (snapshot.readinessState === "incomplete") return { runStatus: "incomplete", resultStatus: "incomplete", message: "Complete missing required underwriting inputs before running Core Outputs." };
  if (snapshot.readinessState === "blocked_conflict") return { runStatus: "blocked", resultStatus: "blocked_conflict", message: "Resolve material source conflicts before running Core Outputs." };
  if (snapshot.readinessState === "unsupported" || snapshot.readinessState === "unresolved_schema") return { runStatus: "blocked", resultStatus: "schema_unsupported", message: "The snapshot schema is not supported by Core Outputs." };
  if (snapshot.readinessState === "invalid") return { runStatus: "failed", resultStatus: "invalid_input", message: "Fix invalid underwriting inputs before running Core Outputs." };
  if (!snapshot.isExecutable) return { runStatus: "blocked", resultStatus: "invalid_input", message: "The snapshot is not executable." };
  if (snapshot.formulaRegistryVersion !== FORMULA_REGISTRY_VERSION) return { runStatus: "blocked", resultStatus: "version_not_found", message: "The snapshot formula registry version is not available." };
  return undefined;
}

function blockedResultForSnapshot(
  manifest: UnderwritingSnapshotFormulaManifestEntry,
  snapshot: UnderwritingSnapshotRecord,
  request: UnderwritingCoreOutputRunRequest,
  status: UnderwritingCoreFormulaResultStatus,
  message: string,
  ordinal: number,
): UnderwritingCoreFormulaResultRecord {
  const deterministicHash = stableHash({
    snapshotHash: snapshot.contentHash,
    formulaId: manifest.formulaId,
    formulaVersion: manifest.formulaVersion,
    status,
    message,
  });
  return {
    resultId: resultIdFromHash(deterministicHash),
    runId: "",
    workspaceId: snapshot.workspaceId,
    dealId: snapshot.dealId,
    snapshotId: snapshot.snapshotId,
    formulaId: manifest.formulaId,
    formulaVersion: manifest.formulaVersion,
    formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
    outputGroup: outputGroupFor(manifest.formulaId),
    status,
    displayText: "Not calculated",
    inputRefs: sortedUniqueStrings(manifest.requiredInputIds),
    dependencyResultIds: [],
    sourceFactIds: [],
    assumptionIds: [],
    preliminaryInputIds: sortedUniqueStrings(manifest.preliminaryInputIds),
    missingInputIds: sortedUniqueStrings(manifest.missingInputIds),
    blockedInputIds: sortedUniqueStrings(manifest.blockedInputIds),
    warnings: status === "preliminary" ? [message] : [],
    errors: status === "preliminary" ? [] : [message],
    formulaExplanation: message,
    assumptionDisclosure: [],
    provenance: [],
    deterministicHash,
    stableOrdinal: ordinal,
  };
}

function missingFormulaResult(
  formulaId: FormulaId,
  snapshot: UnderwritingSnapshotRecord,
  request: UnderwritingCoreOutputRunRequest,
  status: UnderwritingCoreFormulaResultStatus,
  message: string,
  ordinal: number,
): UnderwritingCoreFormulaResultRecord {
  return blockedResultForSnapshot({
    formulaId,
    formulaVersion: "unknown",
    formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
    supportedBySchema: false,
    readinessStatus: "version_not_found",
    requiredInputIds: [],
    missingInputIds: [],
    blockedInputIds: [],
    assumptionDependentInputIds: [],
    preliminaryInputIds: [],
    dependencyFormulaVersions: [],
    executable: false,
    stableOrdinal: ordinal,
  }, snapshot, request, status, message, ordinal);
}

function dependencyFailedResult(
  manifest: UnderwritingSnapshotFormulaManifestEntry,
  snapshot: UnderwritingSnapshotRecord,
  request: UnderwritingCoreOutputRunRequest,
  inputRefs: string[],
  dependency: UnderwritingCoreFormulaResultRecord,
  ordinal: number,
): UnderwritingCoreFormulaResultRecord {
  const deterministicHash = stableHash({
    formulaId: manifest.formulaId,
    formulaVersion: manifest.formulaVersion,
    dependencyHash: dependency.deterministicHash,
    status: "dependency_failed",
    snapshotHash: snapshot.contentHash,
  });
  return {
    resultId: resultIdFromHash(deterministicHash),
    runId: "",
    workspaceId: snapshot.workspaceId,
    dealId: snapshot.dealId,
    snapshotId: snapshot.snapshotId,
    formulaId: manifest.formulaId,
    formulaVersion: manifest.formulaVersion,
    formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
    outputGroup: outputGroupFor(manifest.formulaId),
    status: "dependency_failed",
    displayText: "Not calculated",
    inputRefs: sortedUniqueStrings(inputRefs),
    dependencyResultIds: [dependency.resultId],
    sourceFactIds: [],
    assumptionIds: [],
    preliminaryInputIds: sortedUniqueStrings(manifest.preliminaryInputIds),
    missingInputIds: sortedUniqueStrings(manifest.missingInputIds),
    blockedInputIds: sortedUniqueStrings([...manifest.blockedInputIds, dependency.formulaId]),
    warnings: [],
    errors: [`${dependency.formulaId} did not calculate.`],
    formulaExplanation: `Dependency ${dependency.formulaId} did not calculate.`,
    assumptionDisclosure: [],
    provenance: [],
    deterministicHash,
    stableOrdinal: ordinal,
  };
}

function finishRun(run: UnderwritingCoreOutputRunRecord): UnderwritingCoreOutputRunRecord {
  const results = run.results.map((result) => ({ ...result, runId: run.runId }));
  return {
    ...run,
    results,
    resultCount: results.length,
    calculatedResultCount: results.filter((result) => result.status === "calculated" || result.status === "calculated_with_warning").length,
    warningCount: results.reduce((count, result) => count + result.warnings.length, 0),
    blockedResultCount: results.filter((result) => ["blocked_conflict", "dependency_failed", "schema_unsupported", "formula_disabled", "formula_not_found", "version_not_found"].includes(result.status)).length,
    incompleteResultCount: results.filter((result) => result.status === "incomplete").length,
    preliminaryResultCount: results.filter((result) => result.status === "preliminary").length,
  };
}

function runStatusForResults(results: UnderwritingCoreFormulaResultRecord[]): UnderwritingRunStatus {
  if (results.some((result) => result.status === "preliminary")) return "preliminary";
  if (results.every((result) => result.status === "calculated")) return "complete";
  if (results.some((result) => result.status === "calculated_with_warning")) return "complete_with_warnings";
  if (results.some((result) => result.status === "incomplete")) return "incomplete";
  if (results.some((result) => ["blocked_conflict", "dependency_failed", "schema_unsupported"].includes(result.status))) return "blocked";
  if (results.some((result) => ["invalid_input", "unsupported_unit", "unsupported_currency", "divide_by_zero", "formula_disabled", "formula_not_found", "version_not_found"].includes(result.status))) return "failed";
  return "complete";
}

function resultSetHashFor(
  results: UnderwritingCoreFormulaResultRecord[],
  snapshot: UnderwritingSnapshotRecord,
  dependencyGraphHash: string,
  formulaVersionManifestHash: string,
) {
  return stableHash({
    hashVersion: UNDERWRITING_CORE_OUTPUT_HASH_VERSION,
    snapshotId: snapshot.snapshotId,
    snapshotHash: snapshot.contentHash,
    manifestHash: snapshot.manifestHash,
    dependencyGraphHash,
    formulaVersionManifestHash,
    results: results.map((result) => ({
      formulaId: result.formulaId,
      formulaVersion: result.formulaVersion,
      status: result.status,
      rawValue: result.rawValue,
      displayValue: result.displayValue,
      deterministicHash: result.deterministicHash,
    })).sort((a, b) => a.formulaId.localeCompare(b.formulaId)),
  });
}

function normalizeFormulaStatus(result: FormulaExecutionResult): UnderwritingCoreFormulaResultStatus {
  if (result.status === "calculated" && result.confidenceState === "preliminary") return "preliminary";
  if (result.status === "calculated" && result.confidenceState === "accepted_assumptions") return "calculated_with_warning";
  if (result.status === "calculated" && result.warnings.length > 0) return "calculated_with_warning";
  return result.status;
}

function resolveDependencyFormulaId(inputId: string, manifest: UnderwritingSnapshotFormulaManifestEntry, dependencies: FormulaId[]): FormulaId | undefined {
  const direct = dependencies.find((dependency) => dependency === inputId);
  if (direct) return direct;
  const manifestDependency = manifest.dependencyFormulaVersions.find((dependency) => dependency.formulaId === inputId)?.formulaId;
  if (manifestDependency) return manifestDependency;
  if (inputId === "monthly_principal_interest" && dependencies.includes("monthly_principal_interest_fixed")) return "monthly_principal_interest_fixed";
  return undefined;
}

function toFormulaInputValue(input: UnderwritingSnapshotInputRecord): FormulaInputValue {
  return {
    value: typeof input.normalizedValue === "boolean" ? Number(input.normalizedValue) : input.normalizedValue,
    unit: input.canonicalUnit as FormulaUnit,
    period: input.canonicalPeriod as FormulaPeriod,
    currency: input.canonicalCurrency,
    classification: classificationFor(input),
    inputVersion: input.inputVersion,
    conflictState: input.conflictState === "unresolved" ? "unresolved" : "none",
    proposalStatus: input.completenessState === "conflicted" ? "conflicted" : input.completenessState === "missing" ? "pending" : "accepted",
  };
}

function classificationFor(input: UnderwritingSnapshotInputRecord): FormulaInputClassification {
  if (input.assumptionState === "accepted") return "accepted_user_assumption";
  if (input.assumptionState === "preliminary" || input.completenessState === "preliminary") return "preliminary_assumption";
  if (input.completenessState === "missing") return "unknown";
  return "accepted_fact";
}

function groupProvenance(provenance: UnderwritingSnapshotProvenanceReference[]) {
  const map = new Map<string, UnderwritingCoreOutputProvenance[]>();
  for (const item of provenance) {
    const list = map.get(item.inputId) ?? [];
    list.push({
      inputId: item.inputId,
      sourceFactId: item.sourceFactId,
      acceptedAssumptionId: item.acceptedAssumptionId,
      preliminaryAssumptionId: item.preliminaryAssumptionId,
      sourceRecordId: item.sourceRecordId,
      evidenceId: item.evidenceId,
      sourceAnchor: item.sourceAnchor,
      verificationState: item.verificationState,
    });
    map.set(item.inputId, list);
  }
  return map;
}

function uniqueProvenance(provenance: UnderwritingCoreOutputProvenance[]) {
  const seen = new Set<string>();
  const unique: UnderwritingCoreOutputProvenance[] = [];
  for (const item of provenance) {
    const key = stableHash(item);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique.sort((a, b) => a.inputId.localeCompare(b.inputId));
}

function displayTextFor(result: FormulaExecutionResult) {
  if (!["calculated", "calculated_with_warning"].includes(result.status) || result.displayResult === undefined) return "Not calculated";
  if (result.outputUnit === "currency") return `${result.currency ?? "USD"} ${result.displayResult.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (result.outputUnit === "percentage") return `${result.displayResult.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}%`;
  if (result.outputUnit === "ratio") return `${result.displayResult.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}x`;
  return String(result.displayResult);
}

function outputGroupFor(formulaId: FormulaId): UnderwritingOutputGroup {
  if (["down_payment_amount"].includes(formulaId)) return "acquisition";
  if (["loan_amount", "monthly_principal_interest_fixed", "annual_debt_service"].includes(formulaId)) return "financing";
  if (["gross_scheduled_income", "effective_gross_income"].includes(formulaId)) return "income";
  if (["total_operating_expenses"].includes(formulaId)) return "expenses";
  if (["net_operating_income", "pre_tax_cash_flow"].includes(formulaId)) return "operating_performance";
  if (["loan_to_value_ratio", "debt_service_coverage_ratio"].includes(formulaId)) return "leverage";
  return "returns";
}

function compareManifest(a: UnderwritingSnapshotFormulaManifestEntry, b: UnderwritingSnapshotFormulaManifestEntry) {
  return a.stableOrdinal - b.stableOrdinal || a.formulaId.localeCompare(b.formulaId);
}

function isCalculatedStatus(status: UnderwritingCoreFormulaResultStatus) {
  return status === "calculated" || status === "calculated_with_warning" || status === "preliminary";
}

function validateRunRequest(request: UnderwritingCoreOutputRunRequest) {
  if (!request.actorId?.trim()) throw runError("authentication_required", "Authentication is required to request Core Outputs.");
  if (!request.workspaceId?.trim()) throw runError("workspace_required", "Workspace is required to request Core Outputs.");
  if (!request.dealId?.trim()) throw runError("deal_required", "Deal is required to request Core Outputs.");
  if (!request.snapshotId?.trim()) throw runError("snapshot_required", "An immutable underwriting snapshot is required to request Core Outputs.");
  if (!request.expectedSnapshotHash?.trim()) throw runError("snapshot_hash_required", "Snapshot hash is required to request Core Outputs.");
  if (!request.idempotencyKey?.trim()) throw runError("idempotency_required", "A retry key is required to safely request Core Outputs.");
}

function runError(code: string, safeMessage: string) {
  const error = new Error(safeMessage) as Error & { code: string };
  error.code = code;
  return error;
}

function runIdFromHash(hash: string) {
  return `uwrun_${hash.replace(/[^a-z0-9]/gi, "").slice(0, 32)}`;
}

function resultIdFromHash(hash: string) {
  return `uwresult_${hash.replace(/[^a-z0-9]/gi, "").slice(0, 32)}`;
}

function stableHash(value: unknown) {
  const text = stableSerialize(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "undefined";
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`)
    .join(",")}}`;
}

function sortedUniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      if (child && typeof child === "object") deepFreeze(child);
    }
  }
  return value;
}
