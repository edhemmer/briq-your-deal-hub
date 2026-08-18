import type { DebtRateType } from "./financeIQ";

export const UNDERWRITING_DEBT_SCHEDULE_ENGINE_VERSION = "underwriting-debt-schedule-engine-v1" as const;
export const UNDERWRITING_DEBT_SCHEDULE_INPUT_VERSION = "underwriting-debt-schedule-input-v1" as const;
export const UNDERWRITING_DEBT_SCHEDULE_RESULT_VERSION = "underwriting-debt-schedule-result-v1" as const;
export const UNDERWRITING_DEBT_SCHEDULE_HASH_VERSION = "underwriting-debt-schedule-hash-v1" as const;

export type DebtScheduleType =
  | "fully_amortizing_fixed"
  | "interest_only_then_amortizing"
  | "balloon_maturity"
  | "full_term_interest_only"
  | "variable_rate_current_effective";

export type DebtScheduleStatus = "complete" | "complete_with_warnings" | "invalid_input";

export type DebtScheduleWarningCode =
  | "accepted_assumption_input"
  | "variable_rate_current_effective_only"
  | "balloon_due_at_maturity"
  | "interest_only_full_term"
  | "maturity_shorter_than_amortization"
  | "unsupported_payment_frequency_normalized";

export type DebtScheduleWarning = {
  code: DebtScheduleWarningCode;
  message: string;
};

export type DebtScheduleInputProvenance = {
  sourceClassification: string;
  verificationState: string;
  sourceEvidenceId?: string;
  sourceRecordId?: string;
  sourceAnchor?: Record<string, unknown>;
  confidence?: number;
};

export type DebtScheduleInput = {
  inputVersion: typeof UNDERWRITING_DEBT_SCHEDULE_INPUT_VERSION;
  hashVersion: typeof UNDERWRITING_DEBT_SCHEDULE_HASH_VERSION;
  workspaceId: string;
  dealId: string;
  financingStructureId: string;
  financingStructureVersion: number;
  debtTrancheId: string;
  debtTrancheVersion: number;
  principalAmount: number;
  currency: string;
  rateType: DebtRateType;
  annualInterestRate?: number;
  resolvedAnnualInterestRate?: number;
  rateIndexName?: string;
  marginRate?: number;
  rateFloor?: number;
  rateCap?: number;
  amortizationMonths: number;
  maturityMonths: number;
  interestOnlyMonths: number;
  paymentFrequency: "monthly" | "quarterly" | "semiannual" | "annual" | "interest_only_periodic" | "maturity" | "other";
  hasBalloon: boolean;
  provenance: DebtScheduleInputProvenance;
};

export type DebtSchedulePeriod = {
  periodNumber: number;
  periodType: "interest_only" | "amortizing" | "maturity";
  beginningBalance: number;
  scheduledPayment: number;
  interestPayment: number;
  principalPayment: number;
  balloonPayment: number;
  totalDebtService: number;
  endingBalance: number;
};

export type DebtScheduleResult = {
  resultVersion: typeof UNDERWRITING_DEBT_SCHEDULE_RESULT_VERSION;
  engineVersion: typeof UNDERWRITING_DEBT_SCHEDULE_ENGINE_VERSION;
  hashVersion: typeof UNDERWRITING_DEBT_SCHEDULE_HASH_VERSION;
  workspaceId: string;
  dealId: string;
  financingStructureId: string;
  financingStructureVersion: number;
  debtTrancheId: string;
  debtTrancheVersion: number;
  scheduleType: DebtScheduleType;
  status: DebtScheduleStatus;
  inputHash: string;
  resultHash: string;
  input: DebtScheduleInput;
  annualInterestRateUsed?: number;
  currency: string;
  periodCount: number;
  paymentFrequency: "monthly";
  firstPeriodicDebtService?: number;
  finalPeriodicDebtService?: number;
  totalPrincipalPaid: number;
  totalInterestPaid: number;
  totalBalloonPaid: number;
  totalDebtService: number;
  endingBalance: number;
  warnings: DebtScheduleWarning[];
  errors: string[];
  calculatedAt: string;
  periods: DebtSchedulePeriod[];
};

export function createDebtScheduleInput(input: Omit<DebtScheduleInput, "inputVersion" | "hashVersion">): DebtScheduleInput {
  return deepFreeze({
    ...input,
    inputVersion: UNDERWRITING_DEBT_SCHEDULE_INPUT_VERSION,
    hashVersion: UNDERWRITING_DEBT_SCHEDULE_HASH_VERSION,
  });
}

export function calculateDebtSchedule(input: DebtScheduleInput, calculatedAt: string): DebtScheduleResult {
  const validationErrors = validateInput(input);
  const warnings = inputWarnings(input);
  const inputHash = stableHash(input);
  if (validationErrors.length) {
    return resultForInvalidInput(input, inputHash, calculatedAt, validationErrors, warnings);
  }

  const annualRate = effectiveAnnualRate(input);
  const monthlyRate = annualRate / 12;
  const maturityMonths = Math.trunc(input.maturityMonths);
  const amortizationMonths = Math.trunc(input.amortizationMonths);
  const interestOnlyMonths = Math.min(Math.trunc(input.interestOnlyMonths), maturityMonths);
  const scheduleType = scheduleTypeFor(input, interestOnlyMonths);
  const periods: DebtSchedulePeriod[] = [];
  let balance = roundCurrency(input.principalAmount);

  for (let periodNumber = 1; periodNumber <= maturityMonths; periodNumber += 1) {
    const beginningBalance = roundCurrency(balance);
    const isMaturity = periodNumber === maturityMonths;
    const isInterestOnly = periodNumber <= interestOnlyMonths;
    const interestPayment = roundCurrency(beginningBalance * monthlyRate);
    let scheduledPayment = 0;
    let principalPayment = 0;
    let balloonPayment = 0;

    if (isInterestOnly) {
      scheduledPayment = interestPayment;
    } else {
      const remainingAmortizationMonths = Math.max(amortizationMonths - Math.min(interestOnlyMonths, amortizationMonths - 1), 1);
      const amortizingPeriodIndex = periodNumber - interestOnlyMonths;
      const periodsLeftInAmortization = Math.max(remainingAmortizationMonths - amortizingPeriodIndex + 1, 1);
      scheduledPayment = roundCurrency(paymentFor(beginningBalance, monthlyRate, periodsLeftInAmortization));
      principalPayment = roundCurrency(Math.min(beginningBalance, Math.max(0, scheduledPayment - interestPayment)));
    }

    const balanceAfterScheduledPrincipal = roundCurrency(beginningBalance - principalPayment);
    if (isMaturity) {
      balloonPayment = roundCurrency(balanceAfterScheduledPrincipal);
    }
    const endingBalance = roundCurrency(balanceAfterScheduledPrincipal - balloonPayment);
    periods.push({
      periodNumber,
      periodType: isMaturity ? "maturity" : isInterestOnly ? "interest_only" : "amortizing",
      beginningBalance,
      scheduledPayment,
      interestPayment,
      principalPayment,
      balloonPayment,
      totalDebtService: roundCurrency(scheduledPayment + balloonPayment),
      endingBalance,
    });
    balance = endingBalance;
  }

  const totals = periods.reduce(
    (sum, period) => ({
      principal: roundCurrency(sum.principal + period.principalPayment),
      interest: roundCurrency(sum.interest + period.interestPayment),
      balloon: roundCurrency(sum.balloon + period.balloonPayment),
      service: roundCurrency(sum.service + period.totalDebtService),
    }),
    { principal: 0, interest: 0, balloon: 0, service: 0 },
  );

  const basis = {
    resultVersion: UNDERWRITING_DEBT_SCHEDULE_RESULT_VERSION,
    engineVersion: UNDERWRITING_DEBT_SCHEDULE_ENGINE_VERSION,
    hashVersion: UNDERWRITING_DEBT_SCHEDULE_HASH_VERSION,
    workspaceId: input.workspaceId,
    dealId: input.dealId,
    financingStructureId: input.financingStructureId,
    financingStructureVersion: input.financingStructureVersion,
    debtTrancheId: input.debtTrancheId,
    debtTrancheVersion: input.debtTrancheVersion,
    scheduleType,
    status: warnings.length ? "complete_with_warnings" : "complete",
    inputHash,
    input,
    annualInterestRateUsed: annualRate,
    currency: input.currency,
    periodCount: periods.length,
    paymentFrequency: "monthly",
    firstPeriodicDebtService: periods[0]?.totalDebtService,
    finalPeriodicDebtService: periods.at(-1)?.totalDebtService,
    totalPrincipalPaid: totals.principal,
    totalInterestPaid: totals.interest,
    totalBalloonPaid: totals.balloon,
    totalDebtService: totals.service,
    endingBalance: periods.at(-1)?.endingBalance ?? 0,
    warnings,
    errors: [],
    calculatedAt,
    periods,
  } satisfies Omit<DebtScheduleResult, "resultHash">;

  return deepFreeze({
    ...basis,
    resultHash: stableHash(basis),
  });
}

export function assertFinanceIQDoesNotCalculateDebtSchedule(sourceText: string): void {
  const forbidden = [
    /function\s+(calculate|build|create).*debt.*schedule/i,
    /Math\.pow\([^)]*annualInterestRate/i,
    /amortizationSchedule/i,
    /principalPayment/i,
    /balloonPayment/i,
  ];
  if (forbidden.some((pattern) => pattern.test(sourceText))) {
    throw new Error("FinanceIQ may project canonical debt schedules but cannot calculate them.");
  }
}

function resultForInvalidInput(
  input: DebtScheduleInput,
  inputHash: string,
  calculatedAt: string,
  errors: string[],
  warnings: DebtScheduleWarning[],
): DebtScheduleResult {
  const basis = {
    resultVersion: UNDERWRITING_DEBT_SCHEDULE_RESULT_VERSION,
    engineVersion: UNDERWRITING_DEBT_SCHEDULE_ENGINE_VERSION,
    hashVersion: UNDERWRITING_DEBT_SCHEDULE_HASH_VERSION,
    workspaceId: input.workspaceId,
    dealId: input.dealId,
    financingStructureId: input.financingStructureId,
    financingStructureVersion: input.financingStructureVersion,
    debtTrancheId: input.debtTrancheId,
    debtTrancheVersion: input.debtTrancheVersion,
    scheduleType: scheduleTypeFor(input, Math.max(0, input.interestOnlyMonths || 0)),
    status: "invalid_input",
    inputHash,
    input,
    currency: input.currency,
    periodCount: 0,
    paymentFrequency: "monthly",
    totalPrincipalPaid: 0,
    totalInterestPaid: 0,
    totalBalloonPaid: 0,
    totalDebtService: 0,
    endingBalance: roundCurrency(input.principalAmount || 0),
    warnings,
    errors,
    calculatedAt,
    periods: [],
  } satisfies Omit<DebtScheduleResult, "resultHash">;

  return deepFreeze({ ...basis, resultHash: stableHash(basis) });
}

function validateInput(input: DebtScheduleInput) {
  const errors: string[] = [];
  if (input.inputVersion !== UNDERWRITING_DEBT_SCHEDULE_INPUT_VERSION) errors.push("Unsupported debt schedule input version.");
  if (input.hashVersion !== UNDERWRITING_DEBT_SCHEDULE_HASH_VERSION) errors.push("Unsupported debt schedule hash version.");
  if (!input.workspaceId.trim()) errors.push("Workspace is required.");
  if (!input.dealId.trim()) errors.push("Deal is required.");
  if (!input.financingStructureId.trim()) errors.push("Financing structure is required.");
  if (!input.debtTrancheId.trim()) errors.push("Debt tranche is required.");
  if (!Number.isFinite(input.principalAmount) || input.principalAmount <= 0) errors.push("Principal amount must be greater than zero.");
  if (!/^[A-Z]{3}$/.test(input.currency)) errors.push("Currency must be an ISO 4217 code.");
  if (!Number.isInteger(input.financingStructureVersion) || input.financingStructureVersion <= 0) errors.push("Financing structure version must be positive.");
  if (!Number.isInteger(input.debtTrancheVersion) || input.debtTrancheVersion <= 0) errors.push("Debt tranche version must be positive.");
  if (!Number.isInteger(input.amortizationMonths) || input.amortizationMonths <= 0) errors.push("Amortization months must be positive.");
  if (!Number.isInteger(input.maturityMonths) || input.maturityMonths <= 0) errors.push("Maturity months must be positive.");
  if (!Number.isInteger(input.interestOnlyMonths) || input.interestOnlyMonths < 0) errors.push("Interest-only months cannot be negative.");
  if (!Number.isFinite(effectiveAnnualRate(input)) || effectiveAnnualRate(input) < 0) errors.push("A non-negative effective annual interest rate is required.");
  if ((input.rateType === "variable" || input.rateType === "hybrid") && input.resolvedAnnualInterestRate === undefined) errors.push("Variable-rate schedules require a resolved current effective rate.");
  if (input.rateCap !== undefined && input.rateFloor !== undefined && input.rateCap < input.rateFloor) errors.push("Rate cap cannot be less than rate floor.");
  return errors.sort();
}

function inputWarnings(input: DebtScheduleInput): DebtScheduleWarning[] {
  const warnings: DebtScheduleWarning[] = [];
  if (input.provenance.sourceClassification !== "confirmed_fact" || input.provenance.verificationState !== "confirmed") {
    warnings.push({ code: "accepted_assumption_input", message: "Schedule uses unconfirmed or assumption-backed financing terms." });
  }
  if (input.rateType === "variable" || input.rateType === "hybrid") {
    warnings.push({ code: "variable_rate_current_effective_only", message: "Variable-rate schedule uses only the resolved current effective rate and does not forecast future resets." });
  }
  if (input.paymentFrequency !== "monthly") {
    warnings.push({ code: "unsupported_payment_frequency_normalized", message: "Debt schedule periods are normalized to monthly periods for Slice 2." });
  }
  if (input.interestOnlyMonths >= input.maturityMonths) {
    warnings.push({ code: "interest_only_full_term", message: "Debt tranche is interest-only through maturity with principal due at maturity." });
  }
  if (input.hasBalloon || input.maturityMonths < input.amortizationMonths || input.interestOnlyMonths >= input.maturityMonths) {
    warnings.push({ code: "balloon_due_at_maturity", message: "Remaining principal is due as a balloon payment at maturity." });
  }
  if (input.maturityMonths < input.amortizationMonths) {
    warnings.push({ code: "maturity_shorter_than_amortization", message: "Maturity is shorter than amortization, so scheduled payments do not fully amortize before maturity." });
  }
  return dedupeWarnings(warnings);
}

function scheduleTypeFor(input: DebtScheduleInput, interestOnlyMonths: number): DebtScheduleType {
  if (input.rateType === "variable" || input.rateType === "hybrid") return "variable_rate_current_effective";
  if (interestOnlyMonths >= input.maturityMonths) return "full_term_interest_only";
  if (input.hasBalloon || input.maturityMonths < input.amortizationMonths) return "balloon_maturity";
  if (interestOnlyMonths > 0) return "interest_only_then_amortizing";
  return "fully_amortizing_fixed";
}

function effectiveAnnualRate(input: DebtScheduleInput) {
  const rate = input.resolvedAnnualInterestRate ?? input.annualInterestRate;
  if (rate === undefined) return Number.NaN;
  const floored = input.rateFloor === undefined ? rate : Math.max(rate, input.rateFloor);
  const capped = input.rateCap === undefined ? floored : Math.min(floored, input.rateCap);
  return normalizeRate(capped);
}

function paymentFor(balance: number, periodicRate: number, periods: number) {
  if (periodicRate === 0) return balance / periods;
  const factor = Math.pow(1 + periodicRate, periods);
  return balance * (periodicRate * factor) / (factor - 1);
}

function normalizeRate(value: number) {
  return value > 1 ? value / 100 : value;
}

function roundCurrency(value: number) {
  return applyPrecision(value, 2);
}

function applyPrecision(value: number, scale: number) {
  const factor = 10 ** scale;
  const sign = value < 0 ? -1 : 1;
  return sign * Math.round((Math.abs(value) + Number.EPSILON) * factor) / factor;
}

function dedupeWarnings(warnings: DebtScheduleWarning[]) {
  return [...new Map(warnings.map((warning) => [warning.code, warning])).values()].sort((a, b) => a.code.localeCompare(b.code));
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

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      if (child && typeof child === "object") deepFreeze(child);
    }
  }
  return value;
}
