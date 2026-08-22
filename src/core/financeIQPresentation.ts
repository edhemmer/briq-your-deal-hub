import type {
  CapitalSource,
  DebtScheduleProjection,
  DebtTranche,
  EquityTranche,
  FinancingCovenant,
  FinancingFeasibilityStatus,
  FinancingProjection,
  FinancingScenarioComparisonResult,
  FinancingStructure,
} from "./financeIQ";
import type { FinancingReunderwritingResult } from "./financeIQReunderwriting";
import type { PresentationMode } from "./presentationMode";

export type FinanceIQSourceTerm = {
  id: string;
  label: string;
  recordType: "structure" | "capital_source" | "debt_tranche" | "equity_tranche" | "condition" | "covenant" | "schedule" | "comparison";
  sourceClassification: string;
  verificationState: string;
  confidence?: number;
  sourceEvidenceId?: string;
  sourceRecordId?: string;
  effectiveAt?: string;
  expiresAt?: string;
};

export type FinanceIQCapitalSegment = {
  id: string;
  label: string;
  sourceType: string;
  kind: "debt" | "equity" | "seller_credit" | "seller_note" | "other";
  amount?: number;
  currency: string;
  percentOfKnownStack?: number;
  verificationState: string;
  sourceClassification: string;
  status: string;
};

export type FinanceIQPresentationModel = {
  dealId: string;
  dealName: string;
  mode: PresentationMode;
  loadedAt?: string;
  projections: FinancingProjection[];
  selectedProjection?: FinancingProjection;
  selectedStructure?: FinancingStructure;
  capitalSources: CapitalSource[];
  debtTranches: DebtTranche[];
  equityTranches: EquityTranche[];
  debtSchedules: DebtScheduleProjection[];
  conditions: import("./financeIQ").FinancingCondition[];
  covenants: FinancingCovenant[];
  comparison?: FinancingScenarioComparisonResult;
  reunderwriting?: FinancingReunderwritingResult;
  overview: Array<{ label: string; value: string; detail?: string; tone: "neutral" | "good" | "warning" | "danger" }>;
  capitalStack: {
    label: "Partial capital stack" | "Known capital stack";
    knownAmount: number;
    currency: string;
    segments: FinanceIQCapitalSegment[];
    unknownSegmentCount: number;
  };
  sourcesUses: {
    status: "authoritative_unavailable" | "empty";
    title: string;
    detail: string;
  };
  requirementCounts: {
    unresolvedConditions: number;
    blockingConditions: number;
    failedCovenants: number;
    uncertainCovenants: number;
  };
  sourceTerms: FinanceIQSourceTerm[];
  activeSelection: {
    canSelect: boolean;
    label: string;
    warning?: string;
  };
  emptyState?: { title: string; detail: string };
};

type BuildFinanceIQPresentationInput = {
  dealId: string;
  dealName: string;
  mode: PresentationMode;
  projections: FinancingProjection[];
  selectedStructureId?: string;
  selectedStructure?: FinancingStructure;
  capitalSources?: CapitalSource[];
  debtTranches?: DebtTranche[];
  equityTranches?: EquityTranche[];
  debtSchedules?: DebtScheduleProjection[];
  conditions?: import("./financeIQ").FinancingCondition[];
  covenants?: FinancingCovenant[];
  comparison?: FinancingScenarioComparisonResult;
  reunderwriting?: FinancingReunderwritingResult;
};

export function buildFinanceIQPresentation(input: BuildFinanceIQPresentationInput): FinanceIQPresentationModel {
  const projections = input.projections;
  const selectedProjection = projections.find((projection) => projection.financingStructureId === input.selectedStructureId)
    ?? projections.find((projection) => projection.isActive)
    ?? projections[0];
  const currency = selectedProjection?.currency ?? input.selectedStructure?.currency ?? "USD";
  const capitalSources = input.capitalSources ?? [];
  const debtTranches = input.debtTranches ?? [];
  const equityTranches = input.equityTranches ?? [];
  const debtSchedules = input.debtSchedules ?? [];
  const conditions = input.conditions ?? [];
  const covenants = input.covenants ?? [];
  const requirementCounts = {
    unresolvedConditions: selectedProjection?.unresolvedConditionCount ?? conditions.filter((condition) => !["satisfied", "waived", "not_applicable"].includes(condition.status)).length,
    blockingConditions: selectedProjection?.blockingConditionCount ?? conditions.filter((condition) => ["failed", "expired", "disputed"].includes(condition.status)).length,
    failedCovenants: selectedProjection?.failedCovenantCount ?? covenants.filter((covenant) => covenant.status === "breached").length,
    uncertainCovenants: selectedProjection?.uncertainCovenantCount ?? covenants.filter((covenant) => covenant.status === "unknown").length,
  };
  const capitalStack = buildCapitalStack(capitalSources, debtTranches, equityTranches, currency);
  const scheduleSummary = summarizeDebtSchedules(debtSchedules);
  const status = selectedProjection?.status ?? "draft";
  const freshness = freshnessLabel(selectedProjection, input.reunderwriting);
  const feasibility = selectedProjection?.feasibilityStatus ?? "uncertain";
  const overview = selectedProjection ? [
    { label: "Active structure", value: selectedProjection.isActive ? selectedProjection.name : "No active structure selected", detail: selectedProjection.isActive ? "Current Deal context" : selectedProjection.name, tone: selectedProjection.isActive ? "good" as const : "warning" as const },
    { label: "Structure status", value: labelize(status), detail: selectedProjection.isExpired ? "Expired terms remain visible, but cannot be treated as current." : undefined, tone: toneForStructureStatus(status, selectedProjection.isExpired) },
    { label: "Verification", value: labelize(selectedProjection.verificationState), detail: labelize(selectedProjection.sourceClassification), tone: toneForVerification(selectedProjection.verificationState) },
    { label: "Feasibility", value: labelize(feasibility), detail: selectedProjection.stale ? "Feasibility is stale." : "Latest canonical feasibility projection.", tone: toneForFeasibility(feasibility, selectedProjection.stale) },
    { label: "Debt service", value: scheduleSummary.payment, detail: scheduleSummary.detail, tone: scheduleSummary.tone },
    { label: "Maturity exposure", value: scheduleSummary.balloon, detail: "From underwriting-owned schedule projection.", tone: scheduleSummary.balloonTone },
    { label: "Open conditions", value: String(requirementCounts.unresolvedConditions), detail: `${requirementCounts.blockingConditions} blocking`, tone: requirementCounts.blockingConditions > 0 ? "danger" as const : requirementCounts.unresolvedConditions > 0 ? "warning" as const : "good" as const },
    { label: "Covenant issues", value: String(requirementCounts.failedCovenants + requirementCounts.uncertainCovenants), detail: `${requirementCounts.failedCovenants} failed / ${requirementCounts.uncertainCovenants} uncertain`, tone: requirementCounts.failedCovenants > 0 ? "danger" as const : requirementCounts.uncertainCovenants > 0 ? "warning" as const : "good" as const },
    { label: "Comparison", value: input.comparison ? labelize(input.comparison.status) : "No result yet", detail: input.comparison?.stale ? "Comparison result is stale." : "Uses saved comparison output only.", tone: input.comparison?.stale ? "warning" as const : input.comparison ? "neutral" as const : "warning" as const },
    { label: "Underwriting freshness", value: freshness.value, detail: freshness.detail, tone: freshness.tone },
  ] : [];

  return {
    dealId: input.dealId,
    dealName: input.dealName,
    mode: input.mode,
    loadedAt: selectedProjection?.loadedAt,
    projections,
    selectedProjection,
    selectedStructure: input.selectedStructure,
    capitalSources,
    debtTranches,
    equityTranches,
    debtSchedules,
    conditions,
    covenants,
    comparison: input.comparison,
    reunderwriting: input.reunderwriting,
    overview,
    capitalStack,
    sourcesUses: {
      status: selectedProjection ? "authoritative_unavailable" : "empty",
      title: selectedProjection ? "Sources & Uses not yet reconciled" : "No source terms available",
      detail: selectedProjection
        ? "FinanceIQ is showing source-backed capital terms only. BRIX will not display funding gap, required cash, reserves, or surplus until Spec 005 authoritative Sources & Uses outputs are present."
        : "Add a financing structure before BRIX can show source terms.",
    },
    requirementCounts,
    sourceTerms: buildSourceTerms(input.selectedStructure, capitalSources, debtTranches, equityTranches, conditions, covenants, debtSchedules, input.comparison),
    activeSelection: selectedProjection ? activeSelectionState(selectedProjection) : { canSelect: false, label: "No structure to activate" },
    emptyState: selectedProjection ? undefined : {
      title: "No FinanceIQ structure yet",
      detail: "Create or extract financing terms to connect debt, equity, conditions, covenants, and comparisons to this Deal.",
    },
  };
}

function buildCapitalStack(capitalSources: CapitalSource[], debtTranches: DebtTranche[], equityTranches: EquityTranche[], currency: string) {
  const sourceById = new Map(capitalSources.map((source) => [source.capitalSourceId, source]));
  const segments: FinanceIQCapitalSegment[] = [
    ...debtTranches.map((tranche) => {
      const source = tranche.capitalSourceId ? sourceById.get(tranche.capitalSourceId) : undefined;
      return {
        id: tranche.debtTrancheId,
        label: tranche.label,
        sourceType: source?.sourceType ?? "debt",
        kind: "debt" as const,
        amount: firstNumber(tranche.fundedAmount, tranche.principalAmount, tranche.commitmentAmount, source?.committedAmount, source?.proposedAmount),
        currency,
        verificationState: tranche.verificationState,
        sourceClassification: tranche.sourceClassification,
        status: tranche.status,
      };
    }),
    ...equityTranches.map((tranche) => {
      const source = tranche.capitalSourceId ? sourceById.get(tranche.capitalSourceId) : undefined;
      return {
        id: tranche.equityTrancheId,
        label: tranche.label,
        sourceType: source?.sourceType ?? "equity",
        kind: "equity" as const,
        amount: firstNumber(tranche.contributionAmount, source?.committedAmount, source?.proposedAmount),
        currency: tranche.currency ?? currency,
        verificationState: tranche.verificationState,
        sourceClassification: tranche.sourceClassification,
        status: tranche.status,
      };
    }),
    ...capitalSources
      .filter((source) => !debtTranches.some((tranche) => tranche.capitalSourceId === source.capitalSourceId) && !equityTranches.some((tranche) => tranche.capitalSourceId === source.capitalSourceId))
      .map((source) => ({
        id: source.capitalSourceId,
        label: source.providerLabel ?? labelize(source.sourceType),
        sourceType: source.sourceType,
        kind: source.sourceType === "seller_credit" || source.sourceType === "seller_note" ? source.sourceType : "other" as const,
        amount: firstNumber(source.committedAmount, source.proposedAmount),
        currency: source.currency ?? currency,
        verificationState: source.verificationState,
        sourceClassification: source.sourceClassification,
        status: source.status,
      })),
  ];
  const knownAmount = segments.reduce((total, segment) => total + (typeof segment.amount === "number" && Number.isFinite(segment.amount) ? segment.amount : 0), 0);
  const enriched = segments.map((segment) => ({
    ...segment,
    percentOfKnownStack: knownAmount > 0 && typeof segment.amount === "number" ? segment.amount / knownAmount : undefined,
  }));
  const unknownSegmentCount = segments.filter((segment) => typeof segment.amount !== "number").length;
  return {
    label: unknownSegmentCount > 0 ? "Partial capital stack" as const : "Known capital stack" as const,
    knownAmount,
    currency,
    segments: enriched,
    unknownSegmentCount,
  };
}

function summarizeDebtSchedules(schedules: DebtScheduleProjection[]) {
  const current = schedules.filter((schedule) => schedule.status === "current");
  const firstKnown = current.find((schedule) => typeof schedule.firstPeriodicDebtService === "number");
  const balloonKnown = current.find((schedule) => typeof schedule.totalBalloonPaid === "number" && schedule.totalBalloonPaid > 0);
  if (firstKnown) {
    return {
      payment: formatCurrencyDisplay(firstKnown.firstPeriodicDebtService, firstKnown.currency),
      detail: `${firstKnown.debtTrancheLabel} / ${labelize(firstKnown.scheduleType ?? "schedule")}`,
      tone: "neutral" as const,
      balloon: balloonKnown ? formatCurrencyDisplay(balloonKnown.totalBalloonPaid, balloonKnown.currency) : "None shown",
      balloonTone: balloonKnown ? "warning" as const : "good" as const,
    };
  }
  const failed = schedules.some((schedule) => schedule.status === "failed");
  return {
    payment: failed ? "Failed" : "Not calculated",
    detail: failed ? "Prior valid result retained where available." : "No underwriting-owned debt schedule projection.",
    tone: failed ? "danger" as const : "warning" as const,
    balloon: "Unknown",
    balloonTone: "warning" as const,
  };
}

function activeSelectionState(projection: FinancingProjection) {
  if (projection.isActive) return { canSelect: false, label: "Active structure" };
  if (projection.isExpired || ["expired", "declined", "withdrawn", "superseded"].includes(projection.status)) {
    return { canSelect: false, label: "Cannot activate", warning: "Expired, withdrawn, declined, or superseded structures cannot become active." };
  }
  if (projection.activeContext === "scenario") {
    return { canSelect: false, label: "Scenario only", warning: "Scenario structures stay separate from the current Deal until promoted by a canonical workflow." };
  }
  return { canSelect: true, label: "Make active", warning: projection.feasibilityStatus && projection.feasibilityStatus !== "feasible" ? "Review unresolved feasibility items before relying on this as the closing plan." : undefined };
}

function buildSourceTerms(
  structure: FinancingStructure | undefined,
  capitalSources: CapitalSource[],
  debtTranches: DebtTranche[],
  equityTranches: EquityTranche[],
  conditions: import("./financeIQ").FinancingCondition[],
  covenants: FinancingCovenant[],
  schedules: DebtScheduleProjection[],
  comparison: FinancingScenarioComparisonResult | undefined,
): FinanceIQSourceTerm[] {
  const terms: FinanceIQSourceTerm[] = [];
  if (structure) terms.push(sourceTerm("structure", structure.financingStructureId, structure.name, structure));
  for (const source of capitalSources) terms.push(sourceTerm("capital_source", source.capitalSourceId, source.providerLabel ?? source.sourceType, source));
  for (const tranche of debtTranches) terms.push(sourceTerm("debt_tranche", tranche.debtTrancheId, tranche.label, tranche));
  for (const tranche of equityTranches) terms.push(sourceTerm("equity_tranche", tranche.equityTrancheId, tranche.label, tranche));
  for (const condition of conditions) terms.push(sourceTerm("condition", condition.conditionId, condition.title, condition));
  for (const covenant of covenants) terms.push(sourceTerm("covenant", covenant.covenantId, labelize(covenant.covenantType), covenant));
  for (const schedule of schedules) {
    terms.push({
      id: schedule.resultId ?? schedule.debtTrancheId,
      label: `${schedule.debtTrancheLabel} debt schedule`,
      recordType: "schedule",
      sourceClassification: "underwriting_output",
      verificationState: schedule.status,
      effectiveAt: schedule.latestCalculatedAt,
    });
  }
  if (comparison) {
    terms.push({
      id: comparison.resultHash,
      label: "Financing comparison",
      recordType: "comparison",
      sourceClassification: "underwriting_output",
      verificationState: comparison.stale ? "stale" : comparison.status,
      effectiveAt: comparison.comparedAt,
    });
  }
  return terms;
}

function sourceTerm(recordType: FinanceIQSourceTerm["recordType"], id: string, label: string, value: { sourceClassification: string; verificationState: string; confidence?: number; sourceEvidenceId?: string; sourceRecordId?: string; effectiveAt?: string; expiresAt?: string }): FinanceIQSourceTerm {
  return {
    id,
    label,
    recordType,
    sourceClassification: value.sourceClassification,
    verificationState: value.verificationState,
    confidence: value.confidence,
    sourceEvidenceId: value.sourceEvidenceId,
    sourceRecordId: value.sourceRecordId,
    effectiveAt: value.effectiveAt,
    expiresAt: value.expiresAt,
  };
}

function freshnessLabel(projection: FinancingProjection | undefined, reunderwriting: FinancingReunderwritingResult | undefined) {
  if (reunderwriting?.calculationStatus === "failed_with_prior_valid_result") {
    return { value: "Failed - prior valid result retained", detail: "Review the failure before relying on new edits.", tone: "warning" as const };
  }
  if (reunderwriting?.calculationStatus === "failed_without_prior_valid_result") {
    return { value: "Failed - no valid result", detail: "No current underwriting result is available.", tone: "danger" as const };
  }
  if (reunderwriting?.calculationStatus === "recalculating" || reunderwriting?.calculationStatus === "queued") {
    return { value: "Recalculating", detail: "Prior valid result remains available while BRIX recalculates.", tone: "warning" as const };
  }
  if (projection?.stale) return { value: "Stale", detail: "Financing terms changed after the latest projection.", tone: "warning" as const };
  return { value: "Current", detail: "Loaded from canonical FinanceIQ projections.", tone: "good" as const };
}

function toneForStructureStatus(status: string, expired?: boolean) {
  if (expired || ["expired", "declined", "withdrawn", "superseded"].includes(status)) return "danger" as const;
  if (["approved", "commitment_issued", "clear_to_close", "closed"].includes(status)) return "good" as const;
  if (["draft", "scenario", "proposed", "quoted", "application_started", "application_submitted", "conditional_approval"].includes(status)) return "warning" as const;
  return "neutral" as const;
}

function toneForVerification(state: string) {
  if (["confirmed", "lender_provided", "investor_provided"].includes(state)) return "good" as const;
  if (["unknown", "unverified", "estimated", "user_entered_assumption", "professional_review_recommended"].includes(state)) return "warning" as const;
  if (["expired", "superseded", "rejected"].includes(state)) return "danger" as const;
  return "neutral" as const;
}

function toneForFeasibility(status: FinancingFeasibilityStatus, stale?: boolean) {
  if (stale) return "warning" as const;
  if (status === "feasible") return "good" as const;
  if (status === "not_feasible" || status === "expired" || status === "superseded") return "danger" as const;
  return "warning" as const;
}

export function labelize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatCurrencyDisplay(value: number | undefined, currency = "USD") {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Not provided";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export function formatPercentDisplay(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Not provided";
  return new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 }).format(value);
}

function firstNumber(...values: Array<number | undefined>) {
  return values.find((value) => typeof value === "number" && Number.isFinite(value));
}
