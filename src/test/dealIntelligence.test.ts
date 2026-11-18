import { describe, expect, it } from "vitest";
import { DEFAULT_ASSUMPTIONS, analyzeRental, maxRentalOffer, type AnalyzerInputs } from "../core/investorMath";
import { analyzeHouseHack, brixRead, meetsTargets, riskFlags, stressTest, taxView, whatItTakes } from "../core/dealIntelligence";

const base: AnalyzerInputs = {
  ...DEFAULT_ASSUMPTIONS,
  purchasePrice: 229000,
  monthlyRent: 2050,
  annualTaxes: 6100,
  annualInsurance: 1650,
  rehabBudget: 18000,
  arv: 265000,
};

describe("what it takes", () => {
  const result = whatItTakes(base);
  const lever = (id: string) => result.levers.find((l) => l.id === id)!;

  it("reports the deal as failing today", () => {
    expect(result.alreadyMeets).toBe(false);
  });

  it("price lever agrees with the max-offer solver", () => {
    const offer = maxRentalOffer(base)!;
    expect(Number(lever("price").needed!.replace(/[$,]/g, ""))).toBeCloseTo(offer, -3);
  });

  it("rent lever is the minimum rent that meets every target", () => {
    const needed = Number(lever("rent").needed!.replace(/[$,]/g, ""));
    expect(meetsTargets({ ...base, monthlyRent: needed })).toBe(true);
    expect(meetsTargets({ ...base, monthlyRent: needed - 50 })).toBe(false);
  });

  it("returns no levers without price and rent", () => {
    expect(whatItTakes({ ...base, monthlyRent: 0 }).levers).toHaveLength(0);
  });
});

describe("stress test", () => {
  it("starts from the as-underwritten case and only gets worse", () => {
    const s = stressTest(base);
    const r = analyzeRental(base);
    expect(s[0].monthlyCashFlow).toBeCloseTo(r.monthlyCashFlow, 6);
    for (const scenario of s.slice(1)) expect(scenario.monthlyCashFlow).toBeLessThan(s[0].monthlyCashFlow);
  });
});

describe("risk flags", () => {
  it("flags sub-1.0 DSCR as high severity first", () => {
    const flags = riskFlags(base, { yearBuilt: 1962, squareFeet: 1450 });
    expect(flags[0].severity).toBe("high");
    expect(flags.some((f) => f.title.startsWith("DSCR 0.76"))).toBe(true);
    expect(flags.some((f) => f.title === "Built before 1978")).toBe(true);
  });

  it("flags missing insurance and optimistic vacancy", () => {
    const flags = riskFlags({ ...base, annualInsurance: 0, vacancyPct: 2 }, {});
    expect(flags.some((f) => f.title === "No insurance entered")).toBe(true);
    expect(flags.some((f) => f.title === "Vacancy is optimistic")).toBe(true);
  });
});

describe("house hack (FHA)", () => {
  // Golden values match HUD's published example: $289,500 base loan -> $294,566.25 with UFMIP, $132.69/mo MIP.
  const hh = analyzeHouseHack({
    ...base,
    purchasePrice: 300000,
    monthlyRent: 2400,
    units: 2,
    ownerUnitRent: 1200,
    annualTaxes: 6000,
    annualInsurance: 2000,
    rehabBudget: 0,
    comparableRentForYou: 1500,
  })!;

  it("finances the upfront MIP and charges annual MIP on the base loan", () => {
    expect(hh.baseLoan).toBe(289500);
    expect(hh.totalLoan).toBeCloseTo(294566.25, 2);
    expect(hh.monthlyPrincipalAndInterest).toBeCloseTo(1959.76, 2);
    expect(hh.monthlyMip).toBeCloseTo(132.69, 2);
  });

  it("nets the other unit's rent against the full housing cost", () => {
    expect(hh.netMonthlyHousingCost).toBeCloseTo(1950.31, 2);
    expect(hh.savingsVsRenting!).toBeCloseTo(-450.31, 2);
    expect(hh.cashToClose).toBe(19500);
  });
});

describe("tax view", () => {
  it("depreciates the building over 27.5 years and applies the bracket", () => {
    const t = taxView(base);
    expect(t.annualDepreciation).toBeCloseTo(7516.22, 1);
    expect(t.yearOneInterest).toBeCloseTo(13257.83, 1);
    expect(t.taxableIncome).toBeCloseTo(-9483.64, 0);
    expect(t.afterTaxCashFlow).toBeCloseTo(-1198.79, 0);
  });
});

describe("BRIX read", () => {
  it("explains a failing deal in plain English", () => {
    const read = brixRead(base)!;
    expect(read).toMatch(/loses \$290\/mo/);
    expect(read).toMatch(/stress tests/);
  });
});
