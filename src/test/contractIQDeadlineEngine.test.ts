import { describe, expect, it } from "vitest";

import {
  CONTRACTIQ_DEADLINE_ENGINE_VERSION,
  buildCustomSourceHolidayCalendar,
  buildUsFederalHolidayCalendar,
  calculateContractDeadline,
  planContractDeadlineCanonicalSync,
  type ContractDeadlineCalculationInput,
} from "../core/contractIQ";

const anchor = { kind: "clause" as const, page: 4, clause: "8" };
const chicagoCalendar = buildUsFederalHolidayCalendar([2026], "America/Chicago");

function input(overrides: Partial<ContractDeadlineCalculationInput> = {}): ContractDeadlineCalculationInput {
  return {
    workspaceId: "workspace-1",
    dealId: "deal-1",
    contractId: "contract-1",
    contractVersion: 3,
    contractDeadlineId: "contract-deadline-1",
    deadlineVersion: 2,
    deadlineType: "inspection",
    triggerType: "contract_execution",
    triggerTermId: "term-trigger-1",
    triggerSourceEvidenceId: "evidence-trigger-1",
    triggerSourceAnchor: anchor,
    verifiedTriggerAt: "2026-08-03T15:00:00.000Z",
    offsetValue: 5,
    offsetUnit: "calendar_days",
    countingRule: "exclude_trigger_day",
    businessDayRule: "none",
    weekendRule: "no_adjustment",
    holidayCalendarId: "us_federal",
    holidayCalendarVersion: 1,
    timezone: "America/Chicago",
    timeOfDayRule: "exact_stated_time",
    sourceVerificationState: "source_verified",
    effectiveDate: "2026-08-03",
    calculationContractVersion: CONTRACTIQ_DEADLINE_ENGINE_VERSION,
    correlationId: "corr-1",
    sourceEvidenceId: "evidence-1",
    sourceAnchor: anchor,
    ...overrides,
  };
}

describe("ContractIQ Slice 3 deterministic deadline engine", () => {
  it("calculates calendar-day deadlines without silently shifting weekends", () => {
    const result = calculateContractDeadline(input(), chicagoCalendar, { generatedAt: "2026-08-03T16:00:00.000Z" });

    expect(result.status).toBe("current");
    expect(result.dueAt).toBe("2026-08-08T15:00:00.000Z");
    expect(result.adjustmentApplied).toBeUndefined();
    expect(result.holidaysApplied).toEqual([]);
  });

  it("counts business days across a federal holiday using the configured calendar", () => {
    const result = calculateContractDeadline(
      input({
        verifiedTriggerAt: "2026-01-16T16:00:00.000Z",
        offsetValue: 1,
        offsetUnit: "business_days",
        countingRule: "business_day_offset",
        businessDayRule: "exclude_weekends_and_holidays",
      }),
      chicagoCalendar,
    );

    expect(result.dueAt).toBe("2026-01-20T16:00:00.000Z");
    expect(result.holidaysApplied).toEqual([{ date: "2026-01-19", name: "Martin Luther King Jr. Day" }]);
  });

  it("honors include-trigger-day versus exclude-trigger-day semantics", () => {
    const included = calculateContractDeadline(
      input({ offsetValue: 5, offsetUnit: "calendar_days", countingRule: "include_trigger_day" }),
      chicagoCalendar,
    );
    const excluded = calculateContractDeadline(
      input({ offsetValue: 5, offsetUnit: "calendar_days", countingRule: "exclude_trigger_day" }),
      chicagoCalendar,
    );

    expect(included.dueAt).toBe("2026-08-07T15:00:00.000Z");
    expect(excluded.dueAt).toBe("2026-08-08T15:00:00.000Z");
  });

  it("applies next-business-day adjustment only when the source rule requires it", () => {
    const result = calculateContractDeadline(
      input({ timeOfDayRule: "end_of_day", weekendRule: "next_business_day" }),
      chicagoCalendar,
    );

    expect(result.dueAt).toBe("2026-08-11T04:59:59.999Z");
    expect(result.adjustmentApplied).toEqual({
      from: "2026-08-08T23:59:59",
      to: "2026-08-10T23:59:59",
      reason: "next_business_day",
    });
  });

  it("supports source-defined custom holiday calendars", () => {
    const calendar = buildCustomSourceHolidayCalendar({
      calendarId: "title_company_closing_days",
      calendarVersion: 7,
      timezone: "America/Chicago",
      holidays: [{ date: "2026-08-04", name: "Title company closed" }],
    });
    const result = calculateContractDeadline(
      input({
        offsetValue: 1,
        offsetUnit: "business_days",
        countingRule: "business_day_offset",
        businessDayRule: "exclude_weekends_and_holidays",
        holidayCalendarId: "title_company_closing_days",
        holidayCalendarVersion: 7,
      }),
      calendar,
    );

    expect(result.dueAt).toBe("2026-08-05T15:00:00.000Z");
    expect(result.holidaysApplied).toEqual([{ date: "2026-08-04", name: "Title company closed" }]);
  });

  it("handles month offsets and clamps impossible month-end dates", () => {
    const result = calculateContractDeadline(
      input({
        verifiedTriggerAt: "2026-01-31T16:00:00.000Z",
        offsetValue: 1,
        offsetUnit: "months",
        countingRule: "calendar_date_offset",
      }),
      chicagoCalendar,
    );

    expect(result.dueAt).toBe("2026-02-28T16:00:00.000Z");
  });

  it("distinguishes exact elapsed hours from local calendar days across spring-forward DST", () => {
    const newYorkCalendar = buildUsFederalHolidayCalendar([2026], "America/New_York");
    const elapsed = calculateContractDeadline(
      input({
        verifiedTriggerAt: "2026-03-07T17:00:00.000Z",
        offsetValue: 24,
        offsetUnit: "hours",
        countingRule: "exact_elapsed_hours",
        timezone: "America/New_York",
      }),
      newYorkCalendar,
    );
    const calendarDayAtFive = calculateContractDeadline(
      input({
        verifiedTriggerAt: "2026-03-07T17:00:00.000Z",
        offsetValue: 1,
        offsetUnit: "calendar_days",
        countingRule: "calendar_date_offset",
        timezone: "America/New_York",
        timeOfDayRule: "exact_stated_time",
        statedLocalTime: "17:00",
      }),
      newYorkCalendar,
    );

    expect(elapsed.dueAt).toBe("2026-03-08T17:00:00.000Z");
    expect(calendarDayAtFive.dueAt).toBe("2026-03-08T21:00:00.000Z");
  });

  it("distinguishes exact elapsed hours from local calendar days across fall-back DST", () => {
    const elapsed = calculateContractDeadline(
      input({
        verifiedTriggerAt: "2026-10-31T15:00:00.000Z",
        offsetValue: 24,
        offsetUnit: "hours",
        countingRule: "exact_elapsed_hours",
      }),
      chicagoCalendar,
    );
    const nextCalendarDay = calculateContractDeadline(
      input({
        verifiedTriggerAt: "2026-10-31T15:00:00.000Z",
        offsetValue: 1,
        offsetUnit: "calendar_days",
        countingRule: "calendar_date_offset",
        statedLocalTime: "10:00",
      }),
      chicagoCalendar,
    );

    expect(elapsed.dueAt).toBe("2026-11-01T15:00:00.000Z");
    expect(nextCalendarDay.dueAt).toBe("2026-11-01T16:00:00.000Z");
  });

  it("returns uncertainty for ambiguous rules, conflicts, and non-authoritative triggers", () => {
    expect(calculateContractDeadline(input({ countingRule: undefined }), chicagoCalendar).warnings).toContain("MISSING_RULE");
    expect(calculateContractDeadline(input({ sourceVerificationState: "conflicted" }), chicagoCalendar)).toMatchObject({
      status: "uncertain",
      warnings: ["DEADLINE_CONFLICT"],
    });
    expect(calculateContractDeadline(input({ sourceVerificationState: "extracted_proposed" }), chicagoCalendar).status).toBe("proposed");
    expect(calculateContractDeadline(input({ timeOfDayRule: "close_of_business" }), chicagoCalendar)).toMatchObject({
      status: "uncertain",
      warnings: ["TIME_OF_DAY_UNCERTAIN"],
    });
  });

  it("marks missed only for current verified deadlines past due", () => {
    const result = calculateContractDeadline(input(), chicagoCalendar, { asOf: "2026-08-09T00:00:00.000Z" });
    const proposed = calculateContractDeadline(input({ sourceVerificationState: "extracted_proposed" }), chicagoCalendar, { asOf: "2026-08-09T00:00:00.000Z" });

    expect(result.status).toBe("missed");
    expect(proposed.status).toBe("proposed");
  });

  it("produces stable deterministic hashes for identical normalized inputs", () => {
    const a = calculateContractDeadline(input(), chicagoCalendar, { generatedAt: "2026-08-03T16:00:00.000Z" });
    const b = calculateContractDeadline(input(), chicagoCalendar, { generatedAt: "2026-08-04T16:00:00.000Z" });
    const changedCalendar = calculateContractDeadline(input({ holidayCalendarVersion: 2 }), { ...chicagoCalendar, calendarVersion: 2 }, { generatedAt: "2026-08-03T16:00:00.000Z" });

    expect(a.deterministicHash).toBe(b.deterministicHash);
    expect(a.deterministicHash).not.toBe(changedCalendar.deterministicHash);
  });

  it("plans canonical Deal deadline sync only for verified current results", () => {
    const current = calculateContractDeadline(input(), chicagoCalendar);
    const proposed = calculateContractDeadline(input({ sourceVerificationState: "extracted_proposed" }), chicagoCalendar);

    expect(planContractDeadlineCanonicalSync({
      result: current,
      deadlineType: "inspection",
      sourceRuleSummary: "5 calendar days after execution",
      triggerDate: "2026-08-03",
    })).toMatchObject({
      action: "create",
      mayCreateOperationalDeadline: true,
      deadlineInput: { source_type: "contractiq", verification_state: "source_verified" },
    });
    expect(planContractDeadlineCanonicalSync({
      result: proposed,
      deadlineType: "inspection",
      sourceRuleSummary: "5 calendar days after execution",
      triggerDate: "2026-08-03",
    })).toMatchObject({ action: "skip", mayCreateOperationalDeadline: false });
    expect(planContractDeadlineCanonicalSync({
      result: current,
      deadlineType: "inspection",
      sourceRuleSummary: "5 calendar days after execution",
      triggerDate: "2026-08-03",
      linkage: { canonicalDeadlineId: "deadline-1", canonicalStatus: "completed", canonicalDeadlineVersion: 4 },
    })).toMatchObject({ action: "skip", reason: expect.stringMatching(/completed/) });
  });
});
