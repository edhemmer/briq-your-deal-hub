import { describe, expect, it } from "vitest";
import {
  DEFAULT_ASSUMPTIONS,
  analyzeBrrrr,
  analyzeFlip,
  analyzeRental,
  inputsFromDeal,
  irr,
  maxRentalOffer,
  monthlyPayment,
  remainingBalance,
  rentalVerdict,
  type AnalyzerInputs,
} from "../core/investorMath";

// Golden values below were computed independently (Python, closed-form formulas), not from this module.
const base: AnalyzerInputs = {
  ...DEFAULT_ASSUMPTIONS,
  purchasePrice: 229000,
  monthlyRent: 2050,
  annualTaxes: 6100,
  annualInsurance: 1650,
  rehabBudget: 18000,
  arv: 265000,
};

describe("loan math", () => {
  it("matches the standard amortizing payment", () => {
    expect(monthlyPayment(200000, 6, 30)).toBeCloseTo(1199.1, 2);
    expect(monthlyPayment(120000, 0, 10)).toBeCloseTo(1000, 6);
    expect(monthlyPayment(0, 7, 30)).toBe(0);
  });

  it("amortizes the balance to zero at term", () => {
    expect(remainingBalance(200000, 6, 30, 12)).toBeCloseTo(197543.98, 1);
    expect(remainingBalance(200000, 6, 30, 360)).toBeCloseTo(0, 3);
  });

  it("solves IRR", () => {
    expect(irr([-100, 110])).toBeCloseTo(0.1, 6);
    expect(irr([-1000, 100, 100, 1100])).toBeCloseTo(0.1, 6);
    expect(irr([100, 100])).toBeNull();
  });
});

describe("rental analysis", () => {
  const r = analyzeRental(base);

  it("builds the operating statement with reserves and management on collected rent", () => {
    expect(r.loanAmount).toBe(171750);
    expect(r.totalCashInvested).toBe(82120);
    expect(r.monthlyPrincipalAndInterest).toBeCloseTo(1230.44, 2);
    expect(r.operating.grossScheduledIncome).toBe(24600);
    expect(r.operating.effectiveGrossIncome).toBe(23370);
    expect(r.operating.totalOperatingExpenses).toBeCloseTo(12079.6, 2);
    expect(r.operating.netOperatingIncome).toBeCloseTo(11290.4, 2);
  });

  it("reports cash flow, cap rate, cash-on-cash, DSCR and break-even occupancy", () => {
    expect(r.annualCashFlow).toBeCloseTo(-3474.86, 1);
    expect(r.capRate).toBeCloseTo(0.0493, 4);
    expect(r.cashOnCash!).toBeCloseTo(-0.04231, 4);
    expect(r.dscr!).toBeCloseTo(0.76466, 4);
    expect(r.breakEvenOccupancy!).toBeCloseTo(1.09125, 4);
  });

  it("flags a money-losing deal as weak", () => {
    expect(rentalVerdict(base, r).tone).toBe("weak");
  });

  it("projects equity and pays the loan down over the hold", () => {
    expect(r.projection).toHaveLength(10);
    expect(r.projection[9].loanBalance).toBeLessThan(r.loanAmount);
    expect(r.projection[9].propertyValue).toBeCloseTo(265000 * Math.pow(1.03, 10), 0);
  });

  it("treats an all-cash purchase as having no DSCR", () => {
    const cash = analyzeRental({ ...base, cashPurchase: true });
    expect(cash.loanAmount).toBe(0);
    expect(cash.dscr).toBeNull();
    expect(cash.annualCashFlow).toBeCloseTo(11290.4, 2);
  });
});

describe("max offer", () => {
  it("finds a price where every rental target is met", () => {
    const offer = maxRentalOffer(base)!;
    expect(offer).toBeGreaterThan(0);
    expect(offer).toBeLessThan(base.purchasePrice);
    const atOffer = analyzeRental({ ...base, purchasePrice: offer });
    expect(atOffer.dscr!).toBeGreaterThanOrEqual(base.targetDscr);
    expect(atOffer.cashOnCash!).toBeGreaterThanOrEqual(base.targetCashOnCashPct / 100);
    expect(atOffer.monthlyCashFlowPerUnit).toBeGreaterThanOrEqual(base.targetMonthlyCashFlowPerUnit);
  });
});

describe("fix and flip", () => {
  it("includes financing, carry, and selling costs", () => {
    const f = analyzeFlip(base)!;
    expect(f.loan).toBeCloseTo(209950, 2);
    expect(f.totalCost).toBeCloseTo(292041.25, 1);
    expect(f.netProfit).toBeCloseTo(-27041.25, 1);
    expect(f.cashInvested).toBeCloseTo(63541.25, 1);
    expect(f.maxAllowableOffer70).toBe(167500);
    expect(f.passesSeventyPercentRule).toBe(false);
  });

  it("requires ARV", () => {
    expect(analyzeFlip({ ...base, arv: undefined })).toBeNull();
  });
});

describe("BRRRR", () => {
  it("computes cash left in the deal after refinance", () => {
    const b = analyzeBrrrr(base)!;
    expect(b.totalProjectCost).toBeCloseTo(268350.5, 1);
    expect(b.cashInvestedBeforeRefi).toBeCloseTo(58400.5, 1);
    expect(b.refinanceLoan).toBe(198750);
    expect(b.cashOutAtRefi).toBeCloseTo(-17162.5, 1);
    expect(b.cashLeftInDeal).toBeCloseTo(75563, 0);
    expect(b.monthlyPrincipalAndInterest).toBeCloseTo(1493.14, 2);
    expect(b.allCashRecovered).toBe(false);
  });
});

describe("inputs from deal", () => {
  it("uses current market defaults and honors saved analyzer overrides", () => {
    const inputs = inputsFromDeal({ listPrice: 300000, monthlyRent: 2500, analyzer: { vacancyPct: 8, interestRate: 7.25 } });
    expect(inputs.purchasePrice).toBe(300000);
    expect(inputs.vacancyPct).toBe(8);
    expect(inputs.interestRate).toBe(7.25);
    expect(inputs.capexPct).toBe(5);
    expect(inputs.downPaymentPct).toBe(25);
  });

  it("derives the down payment percentage from a saved dollar amount", () => {
    expect(inputsFromDeal({ listPrice: 200000, downPayment: 40000 }).downPaymentPct).toBe(20);
  });
});

describe("reconciliation with the formula registry", () => {
  it("legacy deal analysis and the investor engine report the same headline numbers", async () => {
    const { analyzeDeal } = await import("../core/underwriting");
    const deal = {
      id: "d1", createdAt: "2026-11-18T00:00:00Z", updatedAt: "2026-11-18T00:00:00Z", status: "draft" as const,
      address: "1418 Maple St", listPrice: 229000, monthlyRent: 2050, annualTaxes: 6100, annualInsurance: 1650,
      rehabBudget: 18000, arv: 265000, strategyId: "long_term_rental" as const, notes: [], photoUrls: [], uploadedPhotoNames: [], verification: {},
    };
    const legacy = analyzeDeal(deal);
    const engine = analyzeRental(inputsFromDeal(deal));
    expect(legacy.monthlyCashFlow).toBe(Math.round(engine.monthlyCashFlow));
    expect(legacy.monthlyNOI).toBe(Math.round(engine.operating.netOperatingIncome / 12));
    expect(legacy.dscr).toBeCloseTo(engine.dscr!, 2);
    expect(legacy.capRate! / 100).toBeCloseTo(engine.capRate, 3);
    expect(legacy.cashOnCash! / 100).toBeCloseTo(engine.cashOnCash!, 3);
  });
});
