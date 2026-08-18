import { describe, expect, it } from "vitest";
import { assertFinanceIQDoesNotCalculateDebtSchedule, calculateDebtSchedule, createDebtScheduleInput } from "../core/underwritingDebtSchedules";

const confirmedProvenance = {
  sourceClassification: "confirmed_fact",
  verificationState: "confirmed",
  confidence: 95,
};

function baseInput(overrides: Partial<Parameters<typeof createDebtScheduleInput>[0]> = {}) {
  return createDebtScheduleInput({
    workspaceId: "11111111-1111-4111-8111-111111111111",
    dealId: "22222222-2222-4222-8222-222222222222",
    financingStructureId: "33333333-3333-4333-8333-333333333333",
    financingStructureVersion: 2,
    debtTrancheId: "44444444-4444-4444-8444-444444444444",
    debtTrancheVersion: 3,
    principalAmount: 300000,
    currency: "USD",
    rateType: "fixed",
    annualInterestRate: 0.06,
    amortizationMonths: 360,
    maturityMonths: 360,
    interestOnlyMonths: 0,
    paymentFrequency: "monthly",
    hasBalloon: false,
    provenance: confirmedProvenance,
    ...overrides,
  });
}

describe("Spec 009 Slice 2 deterministic debt schedules", () => {
  it("calculates a fully amortizing fixed-rate schedule from canonical debt terms", () => {
    const result = calculateDebtSchedule(baseInput(), "2026-08-18T17:30:00.000Z");

    expect(result.resultVersion).toBe("underwriting-debt-schedule-result-v1");
    expect(result.engineVersion).toBe("underwriting-debt-schedule-engine-v1");
    expect(result.status).toBe("complete");
    expect(result.scheduleType).toBe("fully_amortizing_fixed");
    expect(result.periodCount).toBe(360);
    expect(result.firstPeriodicDebtService).toBe(1798.65);
    expect(result.totalPrincipalPaid + result.totalBalloonPaid).toBe(300000);
    expect(result.totalInterestPaid).toBe(347514.87);
    expect(result.totalDebtService).toBe(647514.87);
    expect(result.endingBalance).toBe(0);
    expect(result.periods[0]).toMatchObject({
      periodNumber: 1,
      beginningBalance: 300000,
      scheduledPayment: 1798.65,
      interestPayment: 1500,
      principalPayment: 298.65,
      endingBalance: 299701.35,
    });
  });

  it("supports fixed-rate interest-only then amortizing schedules", () => {
    const result = calculateDebtSchedule(baseInput({
      principalAmount: 500000,
      annualInterestRate: 0.0725,
      amortizationMonths: 360,
      maturityMonths: 360,
      interestOnlyMonths: 24,
    }), "2026-08-18T17:31:00.000Z");

    expect(result.status).toBe("complete");
    expect(result.scheduleType).toBe("interest_only_then_amortizing");
    expect(result.periods[0]).toMatchObject({
      periodType: "interest_only",
      scheduledPayment: 3020.83,
      interestPayment: 3020.83,
      principalPayment: 0,
      endingBalance: 500000,
    });
    expect(result.periods[24]).toMatchObject({
      periodType: "amortizing",
      scheduledPayment: 3480.78,
      interestPayment: 3020.83,
      principalPayment: 459.95,
    });
    expect(result.endingBalance).toBe(0);
  });

  it("calculates balloon maturity and preserves the balloon separately from scheduled principal", () => {
    const result = calculateDebtSchedule(baseInput({
      principalAmount: 250000,
      annualInterestRate: 0.07,
      amortizationMonths: 360,
      maturityMonths: 84,
      hasBalloon: true,
    }), "2026-08-18T17:32:00.000Z");

    expect(result.status).toBe("complete_with_warnings");
    expect(result.scheduleType).toBe("balloon_maturity");
    expect(result.warnings.map((warning) => warning.code)).toEqual([
      "balloon_due_at_maturity",
      "maturity_shorter_than_amortization",
    ]);
    expect(result.periodCount).toBe(84);
    expect(result.firstPeriodicDebtService).toBe(1663.26);
    expect(result.finalPeriodicDebtService).toBe(229531.63);
    expect(result.totalBalloonPaid).toBe(227868.37);
    expect(result.endingBalance).toBe(0);
  });

  it("supports full-term interest-only schedules with maturity principal payoff", () => {
    const result = calculateDebtSchedule(baseInput({
      principalAmount: 150000,
      annualInterestRate: 0.08,
      amortizationMonths: 360,
      maturityMonths: 60,
      interestOnlyMonths: 60,
      hasBalloon: true,
    }), "2026-08-18T17:33:00.000Z");

    expect(result.status).toBe("complete_with_warnings");
    expect(result.scheduleType).toBe("full_term_interest_only");
    expect(result.periods[0].totalDebtService).toBe(1000);
    expect(result.periods.at(-1)).toMatchObject({
      periodType: "maturity",
      scheduledPayment: 1000,
      balloonPayment: 150000,
      totalDebtService: 151000,
      endingBalance: 0,
    });
  });

  it("requires variable-rate schedules to use only a resolved current effective rate", () => {
    const result = calculateDebtSchedule(baseInput({
      rateType: "variable",
      annualInterestRate: undefined,
      resolvedAnnualInterestRate: 0.0675,
      rateIndexName: "SOFR",
      marginRate: 0.0275,
      rateFloor: 0.055,
      rateCap: 0.095,
      provenance: {
        sourceClassification: "quoted",
        verificationState: "quoted",
        confidence: 80,
      },
    }), "2026-08-18T17:34:00.000Z");

    expect(result.status).toBe("complete_with_warnings");
    expect(result.scheduleType).toBe("variable_rate_current_effective");
    expect(result.annualInterestRateUsed).toBe(0.0675);
    expect(result.warnings.map((warning) => warning.code)).toEqual([
      "accepted_assumption_input",
      "variable_rate_current_effective_only",
    ]);

    const invalid = calculateDebtSchedule(baseInput({
      rateType: "variable",
      annualInterestRate: undefined,
      resolvedAnnualInterestRate: undefined,
    }), "2026-08-18T17:35:00.000Z");
    expect(invalid.status).toBe("invalid_input");
    expect(invalid.errors).toContain("Variable-rate schedules require a resolved current effective rate.");
    expect(invalid.periods).toHaveLength(0);
  });

  it("keeps FinanceIQ out of debt schedule calculation authority", () => {
    expect(() => assertFinanceIQDoesNotCalculateDebtSchedule("export type DebtScheduleProjection = {};")).not.toThrow();
    expect(() => assertFinanceIQDoesNotCalculateDebtSchedule("function calculateDebtSchedule() { return []; }")).toThrow(
      "FinanceIQ may project canonical debt schedules but cannot calculate them.",
    );
  });
});
