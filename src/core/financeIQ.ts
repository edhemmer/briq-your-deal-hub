import type { Json } from "./supabaseDatabase.types";

export const FINANCEIQ_STRUCTURE_CONTRACT_VERSION = "financeiq-structure-foundation-v1" as const;
export const FINANCEIQ_PROJECTION_CONTRACT_VERSION = "financeiq-structure-projection-v1" as const;
export const FINANCEIQ_DEBT_SCHEDULE_PROJECTION_VERSION = "financeiq-debt-schedule-projection-v1" as const;
export const FINANCEIQ_CONSTRAINT_CONTRACT_VERSION = "financeiq-constraint-foundation-v1" as const;
export const FINANCEIQ_FEASIBILITY_PROJECTION_VERSION = "financeiq-feasibility-projection-v1" as const;

export type FinancingStructureStatus =
  | "draft"
  | "scenario"
  | "proposed"
  | "quoted"
  | "application_started"
  | "application_submitted"
  | "conditional_approval"
  | "approved"
  | "commitment_issued"
  | "clear_to_close"
  | "closed"
  | "declined"
  | "withdrawn"
  | "expired"
  | "superseded"
  | "refinance_candidate";

export type FinancingVerificationState =
  | "unknown"
  | "unverified"
  | "user_entered_assumption"
  | "estimated"
  | "proposed"
  | "document_extracted"
  | "lender_provided"
  | "investor_provided"
  | "quoted"
  | "confirmed"
  | "professional_review_recommended"
  | "expired"
  | "superseded"
  | "rejected";

export type FinancingSourceClassification =
  | "unknown"
  | "user_entered_assumption"
  | "system_estimate"
  | "external_estimate"
  | "proposed"
  | "quoted"
  | "lender_provided"
  | "investor_provided"
  | "document_extracted"
  | "confirmed_fact"
  | "professional_opinion"
  | "conflict"
  | "expired"
  | "superseded";

export type FinancingConditionType =
  | "appraisal"
  | "inspection"
  | "environmental"
  | "insurance"
  | "title"
  | "survey"
  | "entity_documentation"
  | "guarantor_liquidity"
  | "guarantor_net_worth"
  | "borrower_experience"
  | "occupancy"
  | "stabilization"
  | "permit"
  | "zoning"
  | "governance"
  | "reporting"
  | "closing_timeline"
  | "repair_completion"
  | "reserve_funding"
  | "document_delivery"
  | "other";

export type FinancingConditionStatus =
  | "pending"
  | "submitted"
  | "under_review"
  | "satisfied"
  | "waived"
  | "failed"
  | "expired"
  | "not_applicable"
  | "disputed"
  | "unknown";

export type FinancingCovenantType =
  | "minimum_dscr"
  | "maximum_ltv"
  | "maximum_ltc"
  | "minimum_debt_yield"
  | "minimum_occupancy"
  | "minimum_liquidity"
  | "minimum_net_worth"
  | "reporting_covenant"
  | "cash_management_lockbox_trigger"
  | "sweep_trigger"
  | "completion_test"
  | "stabilization_test"
  | "leasing_test"
  | "insurance_requirement"
  | "environmental_requirement"
  | "property_management_requirement"
  | "transfer_restriction"
  | "additional_debt_restriction"
  | "other";

export type FinancingMetricKey = "dscr" | "ltv" | "ltc" | "debt_yield" | "occupancy";
export type FinancingComparisonOperator = "gte" | "gt" | "lte" | "lt" | "eq" | "between";
export type FinancingConstraintEvaluationState =
  | "passes"
  | "fails"
  | "uncertain"
  | "missing_input"
  | "unsupported_metric"
  | "expired"
  | "superseded"
  | "not_applicable";
export type FinancingFeasibilityStatus = "feasible" | "feasible_with_conditions" | "uncertain" | "not_feasible" | "expired" | "superseded";
export type FinancingConflictState = "none" | "source_conflict" | "governing_source_selected" | "superseded_source" | "unresolved";
export type FinancingWaiverState = "none" | "requested" | "granted" | "denied" | "expired" | "unresolved";
export type FinancingCovenantStatus = "draft" | "active" | "waived" | "cured" | "breached" | "expired" | "superseded" | "not_applicable" | "unknown";

export type FinancingPurpose = "acquisition" | "renovation" | "development" | "refinance" | "disposition" | "operation" | "scenario" | "other";
export type FinancingActiveContext = "current_deal" | "scenario";
export type CapitalSourceType = "debt" | "equity" | "seller_credit" | "seller_note" | "lender_credit" | "grant_incentive" | "insurance_proceeds" | "other";
export type CapitalSourceStatus = "draft" | "proposed" | "quoted" | "committed" | "funded" | "declined" | "withdrawn" | "expired" | "superseded";
export type DebtRateType = "fixed" | "variable" | "hybrid" | "unknown";
export type DebtPaymentFrequency = "monthly" | "quarterly" | "semiannual" | "annual" | "interest_only_periodic" | "maturity" | "other";
export type DebtPrepaymentType = "none" | "step_down" | "yield_maintenance" | "defeasance" | "open" | "unknown" | "other";
export type DebtRecourseType = "full" | "partial" | "non_recourse" | "bad_boy_carveout" | "unknown" | "other";

export type FinancingProvenance = {
  sourceEvidenceId?: string;
  sourceRecordId?: string;
  sourceAnchor?: Record<string, Json>;
  sourceClassification: FinancingSourceClassification;
  verificationState: FinancingVerificationState;
  effectiveAt?: string;
  expiresAt?: string;
  confidence: number;
};

export type FinancingStructure = FinancingProvenance & {
  contractVersion: typeof FINANCEIQ_STRUCTURE_CONTRACT_VERSION;
  financingStructureId: string;
  financingStructureVersion: number;
  workspaceId: string;
  dealId: string;
  name: string;
  purpose: FinancingPurpose;
  status: FinancingStructureStatus;
  currency: string;
  isActive: boolean;
  activeContext: FinancingActiveContext;
  scenarioId?: string;
  activeUnderwritingSnapshotId?: string;
  supersedesFinancingStructureId?: string;
  supersededByFinancingStructureId?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CapitalSource = FinancingProvenance & {
  capitalSourceId: string;
  capitalSourceVersion: number;
  workspaceId: string;
  financingStructureId: string;
  sourceType: CapitalSourceType;
  providerLabel?: string;
  providerContactId?: string;
  providerOrganizationId?: string;
  proposedAmount?: number;
  committedAmount?: number;
  currency: string;
  status: CapitalSourceStatus;
  position: number;
  archivedAt?: string;
};

export type DebtTranche = FinancingProvenance & {
  debtTrancheId: string;
  debtTrancheVersion: number;
  workspaceId: string;
  financingStructureId: string;
  capitalSourceId?: string;
  label: string;
  lenderLabel?: string;
  lenderContactId?: string;
  lenderOrganizationId?: string;
  principalAmount?: number;
  commitmentAmount?: number;
  fundedAmount?: number;
  rateType: DebtRateType;
  statedRate?: number;
  indexName?: string;
  marginRate?: number;
  rateFloor?: number;
  rateCap?: number;
  amortizationMonths?: number;
  maturityMonths?: number;
  interestOnlyMonths?: number;
  paymentFrequency: DebtPaymentFrequency;
  hasBalloon: boolean;
  points?: number;
  fees: Json[];
  prepaymentType: DebtPrepaymentType;
  prepaymentTerms?: string;
  recourseType: DebtRecourseType;
  guaranteeTerms?: string;
  collateralDescription?: string;
  drawMetadata: Record<string, Json>;
  extensionMetadata: Record<string, Json>;
  reserveEscrowMetadata: Record<string, Json>;
  status: Exclude<FinancingStructureStatus, "scenario" | "refinance_candidate">;
  archivedAt?: string;
};

export type EquityTranche = FinancingProvenance & {
  equityTrancheId: string;
  equityTrancheVersion: number;
  workspaceId: string;
  financingStructureId: string;
  capitalSourceId?: string;
  label: string;
  contributorLabel?: string;
  contributorContactId?: string;
  contributorOrganizationId?: string;
  contributionAmount?: number;
  currency: string;
  contributionTiming: Record<string, Json>;
  ownershipPercentage?: number;
  controlTerms?: string;
  votingTerms?: string;
  preferredReturnTerms: Record<string, Json>;
  waterfallTerms: Record<string, Json>;
  promoteTerms: Record<string, Json>;
  distributionPriority: number;
  capitalCallTerms?: string;
  dilutionTerms?: string;
  fees: Json[];
  transferTerms?: string;
  removalTerms?: string;
  buySellTerms?: string;
  status: "draft" | "proposed" | "committed" | "funded" | "withdrawn" | "expired" | "superseded";
  archivedAt?: string;
};

export type FinancingStructureCommandInput = Partial<Pick<
  FinancingStructure,
  | "name"
  | "purpose"
  | "status"
  | "currency"
  | "effectiveAt"
  | "expiresAt"
  | "verificationState"
  | "sourceClassification"
  | "confidence"
  | "activeContext"
  | "scenarioId"
  | "sourceEvidenceId"
  | "sourceRecordId"
  | "sourceAnchor"
>>;

export type FinancingProjection = {
  contractVersion: typeof FINANCEIQ_PROJECTION_CONTRACT_VERSION;
  financingStructureId: string;
  financingStructureVersion: number;
  workspaceId: string;
  dealId: string;
  name: string;
  purpose: FinancingPurpose;
  status: FinancingStructureStatus;
  currency: string;
  verificationState: FinancingVerificationState;
  sourceClassification: FinancingSourceClassification;
  confidence: number;
  isActive: boolean;
  activeContext: FinancingActiveContext;
  scenarioId?: string;
  effectiveAt?: string;
  expiresAt?: string;
  isExpired: boolean;
  capitalSourceCount: number;
  debtTrancheCount: number;
  equityTrancheCount: number;
  updatedAt: string;
  loadedAt: string;
  unresolvedConditionCount?: number;
  blockingConditionCount?: number;
  failedCovenantCount?: number;
  uncertainCovenantCount?: number;
  feasibilityStatus?: FinancingFeasibilityStatus;
  feasibilityVersion?: number;
  lastEvaluatedAt?: string;
  stale?: boolean;
  verificationSummary?: {
    unverifiedConditionCount: number;
    unverifiedCovenantCount: number;
    conflictedRequirementCount: number;
    expiredRequirementCount: number;
  };
};

export type FinancingCondition = FinancingProvenance & {
  contractVersion: typeof FINANCEIQ_CONSTRAINT_CONTRACT_VERSION;
  conditionId: string;
  conditionVersion: number;
  workspaceId: string;
  dealId: string;
  financingStructureId: string;
  debtTrancheId?: string;
  capitalSourceId?: string;
  title: string;
  description?: string;
  conditionType: FinancingConditionType;
  status: FinancingConditionStatus;
  responsiblePartyType?: string;
  responsibleUserId?: string;
  responsibleContactId?: string;
  dueDate?: string;
  requiredBeforeStage?: string;
  taskId?: string;
  deadlineId?: string;
  waiverState: FinancingWaiverState;
  waiverSourceEvidenceId?: string;
  conflictState: FinancingConflictState;
  governingSourceStatus: "not_selected" | "selected" | "disputed" | "superseded";
  resolvedAt?: string;
  archivedAt?: string;
  supersedesConditionId?: string;
  supersededByConditionId?: string;
};

export type FinancingCovenant = FinancingProvenance & {
  contractVersion: typeof FINANCEIQ_CONSTRAINT_CONTRACT_VERSION;
  covenantId: string;
  covenantVersion: number;
  workspaceId: string;
  dealId: string;
  financingStructureId: string;
  debtTrancheId?: string;
  covenantType: FinancingCovenantType;
  metricKey?: FinancingMetricKey;
  comparisonOperator?: FinancingComparisonOperator;
  thresholdValue?: number;
  secondaryThresholdValue?: number;
  measurementPeriod?: string;
  testFrequency?: string;
  curePeriodDays?: number;
  cureDescription?: string;
  consequence?: string;
  isHardConstraint: boolean;
  status: FinancingCovenantStatus;
  conflictState: FinancingConflictState;
  governingSourceStatus: "not_selected" | "selected" | "disputed" | "superseded";
  archivedAt?: string;
  supersedesCovenantId?: string;
  supersededByCovenantId?: string;
};

export type FinancingConstraintEvaluationResult = {
  contractVersion: typeof FINANCEIQ_CONSTRAINT_CONTRACT_VERSION;
  evaluationVersion: string;
  evaluationResultId: string;
  workspaceId: string;
  dealId: string;
  financingStructureId: string;
  covenantId: string;
  covenantVersion: number;
  underwritingSnapshotId?: string;
  underwritingSnapshotVersion?: number;
  underwritingRunId?: string;
  metricKey?: FinancingMetricKey;
  authoritativeMetricValue?: number;
  thresholdValue?: number;
  secondaryThresholdValue?: number;
  comparisonOperator?: FinancingComparisonOperator;
  evaluationState: FinancingConstraintEvaluationState;
  isHardConstraint: boolean;
  resultHash: string;
  stale: boolean;
  failureCode?: string;
  evaluatedAt: string;
};

export type DebtScheduleProjectionStatus = "current" | "stale" | "failed" | "not_calculated";

export type DebtScheduleProjection = {
  contractVersion: typeof FINANCEIQ_DEBT_SCHEDULE_PROJECTION_VERSION;
  workspaceId: string;
  dealId: string;
  financingStructureId: string;
  financingStructureVersion: number;
  debtTrancheId: string;
  debtTrancheVersion: number;
  debtTrancheLabel: string;
  resultId?: string;
  scheduleType?: string;
  status: DebtScheduleProjectionStatus;
  engineVersion?: string;
  inputHash?: string;
  resultHash?: string;
  currency: string;
  periodCount?: number;
  firstPeriodicDebtService?: number;
  finalPeriodicDebtService?: number;
  totalPrincipalPaid?: number;
  totalInterestPaid?: number;
  totalBalloonPaid?: number;
  totalDebtService?: number;
  warningCount: number;
  latestCalculatedAt?: string;
  loadedAt: string;
};

export type ActiveFinancingSelectionResult = {
  financingStructureId: string;
  financingStructureVersion: number;
  workspaceId: string;
  dealId: string;
  previouslyActiveFinancingStructureId?: string;
  activeContext: FinancingActiveContext;
  scenarioId?: string;
};

export type FinancingConflictError = {
  code: "stale_expected_version" | "idempotency_key_reused" | "unauthorized" | "not_found" | "invalid_financing_state";
  message: string;
  retryable: boolean;
  expectedVersion?: number;
  actualVersion?: number;
  correlationId?: string;
};

export const FINANCEIQ_NON_GOAL_CALCULATION_FIELDS = [
  "payment",
  "monthlyPayment",
  "debtService",
  "dscr",
  "ltv",
  "ltc",
  "debtYield",
  "fundingGap",
  "cashRequired",
  "blendedCost",
  "irr",
  "xirr",
  "equityMultiple",
  "waterfallDistribution",
] as const;

export function assertFinanceIQFoundationIsStructuralOnly(candidate: Record<string, unknown>): void {
  const forbidden = new Set<string>(FINANCEIQ_NON_GOAL_CALCULATION_FIELDS);
  for (const key of Object.keys(candidate)) {
    if (forbidden.has(key)) {
      throw new Error(`FinanceIQ Slice 1 cannot accept calculated output field: ${key}`);
    }
  }
}
