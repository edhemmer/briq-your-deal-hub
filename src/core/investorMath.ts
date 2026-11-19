/**
 * BRIX investor math: deterministic, pure, unit-tested.
 *
 * Every formula follows the standard U.S. residential investment definitions used by
 * lenders and investors:
 * - Gross scheduled income (GSI) = (rent + other income) x 12
 * - Effective gross income (EGI) = GSI - vacancy & credit loss
 * - Net operating income (NOI) = EGI - operating expenses (excludes debt service, capex financing, depreciation)
 * - Cap rate = NOI / purchase price
 * - Cash-on-cash = annual pre-tax cash flow / total cash invested
 * - DSCR = NOI / annual debt service
 * - Break-even occupancy = (operating expenses + debt service) / GSI
 * - IRR = discount rate where NPV of [-cash invested, annual cash flows, sale proceeds] = 0
 *
 * Property management is charged on collected rent (EGI). Maintenance and CapEx reserves are
 * charged on gross scheduled rent, which keeps reserves stable when vacancy changes.
 */

export const MARKET_DEFAULTS = {
  asOf: "2026-11-12",
  primaryRate30y: 7.11,
  investmentRate30y: 7.75,
  dscrRate30y: 8.25,
  hardMoneyRate: 11,
  hardMoneyPointsPct: 2,
  fhaRate30y: 7.0,
  fhaUpfrontMipPct: 1.75,
  fhaAnnualMipPct: 0.55,
  fhaLoanLimitFloor1Unit: 541287,
  sources: [
    "Freddie Mac PMMS: 30-year fixed averaged 7.11% for the week of Nov 12, 2026.",
    "Conventional investment-property loans typically price about 0.50%-0.75% above primary-residence rates.",
    "DSCR loans typically price about 1.0%-1.5% above primary-residence rates.",
    "Hard-money / fix-and-flip loans in 2026 commonly run about 10%-12% interest plus 1.5-3 points.",
    "FHA: 3.5% minimum down, 1.75% upfront MIP and 0.55% annual MIP on a standard 30-year loan; 2026 one-unit floor limit $541,287.",
  ],
} as const;

export type AnalyzerInputs = {
  purchasePrice: number;
  closingCostPct: number;
  rehabBudget: number;
  arv?: number;
  units: number;
  // Long-term financing
  cashPurchase: boolean;
  downPaymentPct: number;
  interestRate: number;
  loanTermYears: number;
  loanPointsPct: number;
  // Income
  monthlyRent: number;
  otherMonthlyIncome: number;
  vacancyPct: number;
  // Operating expenses
  annualTaxes: number;
  annualInsurance: number;
  hoaMonthly: number;
  managementPct: number;
  maintenancePct: number;
  capexPct: number;
  utilitiesMonthly: number;
  otherMonthlyExpenses: number;
  // Growth and exit
  appreciationPct: number;
  rentGrowthPct: number;
  expenseGrowthPct: number;
  holdYears: number;
  sellingCostPct: number;
  // Short-term (acquisition/rehab) financing used by BRRRR and flips
  shortTermLoanToCostPct: number;
  shortTermRate: number;
  shortTermPointsPct: number;
  rehabMonths: number;
  // BRRRR refinance
  refiLtvPct: number;
  refiRate: number;
  refiTermYears: number;
  refiClosingCostPct: number;
  // Flip
  flipHoldMonths: number;
  // House hack (owner-occupied 1-4 units, FHA by default)
  ownerUnitRent: number;
  houseHackDownPct: number;
  houseHackRate: number;
  houseHackMipPct: number;
  houseHackUpfrontMipPct: number;
  comparableRentForYou: number;
  // Taxes
  landValuePct: number;
  taxBracketPct: number;
  // Investor targets
  targetCashOnCashPct: number;
  targetDscr: number;
  targetMonthlyCashFlowPerUnit: number;
};

export const DEFAULT_ASSUMPTIONS: Omit<AnalyzerInputs, "purchasePrice" | "monthlyRent" | "annualTaxes" | "annualInsurance" | "rehabBudget" | "arv"> = {
  closingCostPct: 3,
  units: 1,
  cashPurchase: false,
  downPaymentPct: 25,
  interestRate: MARKET_DEFAULTS.investmentRate30y,
  loanTermYears: 30,
  loanPointsPct: 0,
  otherMonthlyIncome: 0,
  vacancyPct: 5,
  hoaMonthly: 0,
  managementPct: 8,
  maintenancePct: 5,
  capexPct: 5,
  utilitiesMonthly: 0,
  otherMonthlyExpenses: 0,
  appreciationPct: 3,
  rentGrowthPct: 3,
  expenseGrowthPct: 3,
  holdYears: 10,
  sellingCostPct: 7,
  shortTermLoanToCostPct: 85,
  shortTermRate: MARKET_DEFAULTS.hardMoneyRate,
  shortTermPointsPct: MARKET_DEFAULTS.hardMoneyPointsPct,
  rehabMonths: 4,
  refiLtvPct: 75,
  refiRate: MARKET_DEFAULTS.dscrRate30y,
  refiTermYears: 30,
  refiClosingCostPct: 3,
  flipHoldMonths: 6,
  ownerUnitRent: 0,
  houseHackDownPct: 3.5,
  houseHackRate: MARKET_DEFAULTS.fhaRate30y,
  houseHackMipPct: MARKET_DEFAULTS.fhaAnnualMipPct,
  houseHackUpfrontMipPct: MARKET_DEFAULTS.fhaUpfrontMipPct,
  comparableRentForYou: 0,
  landValuePct: 20,
  taxBracketPct: 24,
  targetCashOnCashPct: 8,
  targetDscr: 1.25,
  targetMonthlyCashFlowPerUnit: 100,
};

// ---------- Loan math ----------

/** Fixed-rate monthly principal & interest payment. */
export function monthlyPayment(principal: number, annualRatePct: number, years: number): number {
  if (principal <= 0 || years <= 0) return 0;
  const n = Math.round(years * 12);
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

/** Remaining balance after `monthsPaid` payments on a fixed-rate amortizing loan. */
export function remainingBalance(principal: number, annualRatePct: number, years: number, monthsPaid: number): number {
  if (principal <= 0) return 0;
  const n = Math.round(years * 12);
  const k = Math.min(Math.max(0, Math.round(monthsPaid)), n);
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal * (1 - k / n);
  const pmt = monthlyPayment(principal, annualRatePct, years);
  return principal * Math.pow(1 + r, k) - pmt * ((Math.pow(1 + r, k) - 1) / r);
}

/** Internal rate of return for evenly spaced (annual) cash flows. Returns null when undefined. */
export function irr(cashFlows: number[]): number | null {
  if (cashFlows.length < 2) return null;
  const hasNegative = cashFlows.some((v) => v < 0);
  const hasPositive = cashFlows.some((v) => v > 0);
  if (!hasNegative || !hasPositive) return null;
  const npv = (rate: number) => cashFlows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0);
  let low = -0.9999;
  let high = 10;
  let fLow = npv(low);
  const fHigh = npv(high);
  if (fLow * fHigh > 0) return null;
  for (let i = 0; i < 200; i += 1) {
    const mid = (low + high) / 2;
    const fMid = npv(mid);
    if (Math.abs(fMid) < 1e-7) return mid;
    if (fLow * fMid < 0) {
      high = mid;
    } else {
      low = mid;
      fLow = fMid;
    }
  }
  return (low + high) / 2;
}

// ---------- Operating statement ----------

export type OperatingStatement = {
  grossScheduledIncome: number;
  vacancyLoss: number;
  effectiveGrossIncome: number;
  expenses: {
    taxes: number;
    insurance: number;
    hoa: number;
    management: number;
    maintenance: number;
    capex: number;
    utilities: number;
    other: number;
  };
  totalOperatingExpenses: number;
  netOperatingIncome: number;
};

export function operatingStatement(input: AnalyzerInputs, yearIndex = 0): OperatingStatement {
  const incomeGrowth = Math.pow(1 + input.rentGrowthPct / 100, yearIndex);
  const expenseGrowth = Math.pow(1 + input.expenseGrowthPct / 100, yearIndex);
  const grossRent = input.monthlyRent * 12 * incomeGrowth;
  const grossScheduledIncome = grossRent + input.otherMonthlyIncome * 12 * incomeGrowth;
  const vacancyLoss = grossScheduledIncome * (input.vacancyPct / 100);
  const effectiveGrossIncome = grossScheduledIncome - vacancyLoss;
  const expenses = {
    taxes: input.annualTaxes * expenseGrowth,
    insurance: input.annualInsurance * expenseGrowth,
    hoa: input.hoaMonthly * 12 * expenseGrowth,
    management: effectiveGrossIncome * (input.managementPct / 100),
    maintenance: grossRent * (input.maintenancePct / 100),
    capex: grossRent * (input.capexPct / 100),
    utilities: input.utilitiesMonthly * 12 * expenseGrowth,
    other: input.otherMonthlyExpenses * 12 * expenseGrowth,
  };
  const totalOperatingExpenses = Object.values(expenses).reduce((a, b) => a + b, 0);
  return {
    grossScheduledIncome,
    vacancyLoss,
    effectiveGrossIncome,
    expenses,
    totalOperatingExpenses,
    netOperatingIncome: effectiveGrossIncome - totalOperatingExpenses,
  };
}

// ---------- Long-term rental (buy & hold) ----------

export type ProjectionYear = {
  year: number;
  grossRent: number;
  netOperatingIncome: number;
  debtService: number;
  cashFlow: number;
  propertyValue: number;
  loanBalance: number;
  equity: number;
  cumulativeCashFlow: number;
};

export type RentalAnalysis = {
  loanAmount: number;
  downPayment: number;
  closingCosts: number;
  loanPoints: number;
  totalCashInvested: number;
  monthlyPrincipalAndInterest: number;
  annualDebtService: number;
  operating: OperatingStatement;
  annualCashFlow: number;
  monthlyCashFlow: number;
  monthlyCashFlowPerUnit: number;
  capRate: number;
  capRateAllIn: number;
  cashOnCash: number | null;
  dscr: number | null;
  grossRentMultiplier: number | null;
  onePercentRatio: number | null;
  breakEvenOccupancy: number | null;
  expenseRatio: number | null;
  yearOnePrincipalPaydown: number;
  yearOneAppreciation: number;
  yearOneTotalReturn: number | null;
  projection: ProjectionYear[];
  saleProceeds: number;
  irr: number | null;
  equityMultiple: number | null;
  totalProfit: number;
};

export function analyzeRental(input: AnalyzerInputs): RentalAnalysis {
  const price = Math.max(0, input.purchasePrice);
  const loanAmount = input.cashPurchase ? 0 : price * (1 - input.downPaymentPct / 100);
  const downPayment = price - loanAmount;
  const closingCosts = price * (input.closingCostPct / 100);
  const loanPoints = loanAmount * (input.loanPointsPct / 100);
  const totalCashInvested = downPayment + closingCosts + loanPoints + Math.max(0, input.rehabBudget);
  const monthlyPI = monthlyPayment(loanAmount, input.interestRate, input.loanTermYears);
  const annualDebtService = monthlyPI * 12;
  const operating = operatingStatement(input, 0);
  const annualCashFlow = operating.netOperatingIncome - annualDebtService;
  const basisValue = input.arv && input.arv > 0 ? input.arv : price;
  const allInBasis = price + closingCosts + Math.max(0, input.rehabBudget);
  const yearOnePrincipalPaydown = loanAmount - remainingBalance(loanAmount, input.interestRate, input.loanTermYears, 12);
  const yearOneAppreciation = basisValue * (input.appreciationPct / 100);

  const holdYears = Math.max(1, Math.round(input.holdYears));
  const projection: ProjectionYear[] = [];
  let cumulative = 0;
  for (let y = 1; y <= holdYears; y += 1) {
    const op = operatingStatement(input, y - 1);
    const cashFlow = op.netOperatingIncome - annualDebtService;
    cumulative += cashFlow;
    const propertyValue = basisValue * Math.pow(1 + input.appreciationPct / 100, y);
    const loanBalance = remainingBalance(loanAmount, input.interestRate, input.loanTermYears, y * 12);
    projection.push({
      year: y,
      grossRent: op.grossScheduledIncome,
      netOperatingIncome: op.netOperatingIncome,
      debtService: annualDebtService,
      cashFlow,
      propertyValue,
      loanBalance,
      equity: propertyValue - loanBalance,
      cumulativeCashFlow: cumulative,
    });
  }
  const exit = projection[projection.length - 1];
  const saleProceeds = exit.propertyValue * (1 - input.sellingCostPct / 100) - exit.loanBalance;
  const flows = [-totalCashInvested, ...projection.map((p, i) => p.cashFlow + (i === projection.length - 1 ? saleProceeds : 0))];
  const inflows = flows.slice(1).reduce((a, b) => a + b, 0);

  return {
    loanAmount,
    downPayment,
    closingCosts,
    loanPoints,
    totalCashInvested,
    monthlyPrincipalAndInterest: monthlyPI,
    annualDebtService,
    operating,
    annualCashFlow,
    monthlyCashFlow: annualCashFlow / 12,
    monthlyCashFlowPerUnit: annualCashFlow / 12 / Math.max(1, input.units),
    capRate: price > 0 ? operating.netOperatingIncome / price : 0,
    capRateAllIn: allInBasis > 0 ? operating.netOperatingIncome / allInBasis : 0,
    cashOnCash: totalCashInvested > 0 ? annualCashFlow / totalCashInvested : null,
    dscr: annualDebtService > 0 ? operating.netOperatingIncome / annualDebtService : null,
    grossRentMultiplier: input.monthlyRent > 0 ? price / (input.monthlyRent * 12) : null,
    onePercentRatio: price + input.rehabBudget > 0 ? input.monthlyRent / (price + Math.max(0, input.rehabBudget)) : null,
    breakEvenOccupancy: operating.grossScheduledIncome > 0 ? (operating.totalOperatingExpenses + annualDebtService) / operating.grossScheduledIncome : null,
    expenseRatio: operating.effectiveGrossIncome > 0 ? operating.totalOperatingExpenses / operating.effectiveGrossIncome : null,
    yearOnePrincipalPaydown,
    yearOneAppreciation,
    yearOneTotalReturn: totalCashInvested > 0 ? (annualCashFlow + yearOnePrincipalPaydown + yearOneAppreciation) / totalCashInvested : null,
    projection,
    saleProceeds,
    irr: irr(flows),
    equityMultiple: totalCashInvested > 0 ? inflows / totalCashInvested : null,
    totalProfit: inflows - totalCashInvested,
  };
}

// ---------- Short-term project carry (shared by BRRRR and flip) ----------

function projectCarry(input: AnalyzerInputs, months: number) {
  const price = Math.max(0, input.purchasePrice);
  const rehab = Math.max(0, input.rehabBudget);
  const loan = (price + rehab) * (input.shortTermLoanToCostPct / 100);
  const points = loan * (input.shortTermPointsPct / 100);
  // Interest-only on the full draw is conservative: rehab draws are usually staged.
  const interest = loan * (input.shortTermRate / 100 / 12) * months;
  const carry = ((input.annualTaxes + input.annualInsurance) / 12 + input.utilitiesMonthly + input.hoaMonthly) * months;
  const closing = price * (input.closingCostPct / 100);
  return { loan, points, interest, carry, closing, price, rehab };
}

// ---------- BRRRR ----------

export type BrrrrAnalysis = {
  acquisitionLoan: number;
  totalProjectCost: number;
  cashInvestedBeforeRefi: number;
  refinanceLoan: number;
  refinanceCosts: number;
  cashOutAtRefi: number;
  cashLeftInDeal: number;
  equityCaptured: number;
  monthlyPrincipalAndInterest: number;
  monthlyCashFlow: number;
  dscr: number | null;
  cashOnCash: number | null;
  allCashRecovered: boolean;
  holdingCosts: number;
};

export function analyzeBrrrr(input: AnalyzerInputs): BrrrrAnalysis | null {
  if (!input.arv || input.arv <= 0) return null;
  const p = projectCarry(input, input.rehabMonths);
  const holdingCosts = p.points + p.interest + p.carry;
  const totalProjectCost = p.price + p.closing + p.rehab + holdingCosts;
  const cashInvestedBeforeRefi = totalProjectCost - p.loan;
  const refinanceLoan = input.arv * (input.refiLtvPct / 100);
  const refinanceCosts = refinanceLoan * (input.refiClosingCostPct / 100);
  const cashOutAtRefi = refinanceLoan - refinanceCosts - p.loan;
  const cashLeftInDeal = cashInvestedBeforeRefi - cashOutAtRefi;
  const monthlyPI = monthlyPayment(refinanceLoan, input.refiRate, input.refiTermYears);
  const op = operatingStatement(input, 0);
  const annualCashFlow = op.netOperatingIncome - monthlyPI * 12;
  return {
    acquisitionLoan: p.loan,
    totalProjectCost,
    cashInvestedBeforeRefi,
    refinanceLoan,
    refinanceCosts,
    cashOutAtRefi,
    cashLeftInDeal,
    equityCaptured: input.arv - refinanceLoan,
    monthlyPrincipalAndInterest: monthlyPI,
    monthlyCashFlow: annualCashFlow / 12,
    dscr: monthlyPI > 0 ? op.netOperatingIncome / (monthlyPI * 12) : null,
    cashOnCash: cashLeftInDeal > 0 ? annualCashFlow / cashLeftInDeal : null,
    allCashRecovered: cashLeftInDeal <= 0,
    holdingCosts,
  };
}

// ---------- Fix & flip ----------

export type FlipAnalysis = {
  loan: number;
  purchaseClosingCosts: number;
  holdingCosts: number;
  financingCosts: number;
  sellingCosts: number;
  totalCost: number;
  netProfit: number;
  cashInvested: number;
  roi: number | null;
  annualizedRoi: number | null;
  profitMargin: number;
  maxAllowableOffer70: number;
  passesSeventyPercentRule: boolean;
};

export function analyzeFlip(input: AnalyzerInputs): FlipAnalysis | null {
  if (!input.arv || input.arv <= 0) return null;
  const months = Math.max(1, input.flipHoldMonths);
  const p = projectCarry(input, months);
  const sellingCosts = input.arv * (input.sellingCostPct / 100);
  const financingCosts = p.points + p.interest;
  const totalCost = p.price + p.closing + p.rehab + financingCosts + p.carry + sellingCosts;
  const netProfit = input.arv - totalCost;
  const cashInvested = p.price + p.closing + p.rehab + financingCosts + p.carry - p.loan;
  const roi = cashInvested > 0 ? netProfit / cashInvested : null;
  const maxAllowableOffer70 = input.arv * 0.7 - p.rehab;
  return {
    loan: p.loan,
    purchaseClosingCosts: p.closing,
    holdingCosts: p.carry,
    financingCosts,
    sellingCosts,
    totalCost,
    netProfit,
    cashInvested,
    roi,
    annualizedRoi: roi !== null && roi > -1 ? Math.pow(1 + roi, 12 / months) - 1 : null,
    profitMargin: netProfit / input.arv,
    maxAllowableOffer70,
    passesSeventyPercentRule: p.price <= maxAllowableOffer70,
  };
}

// ---------- Offer math ----------

/** Highest purchase price that still meets the investor's rental targets (DSCR, cash-on-cash, cash flow). */
export function maxRentalOffer(input: AnalyzerInputs): number | null {
  if (input.monthlyRent <= 0) return null;
  const meets = (price: number) => {
    const r = analyzeRental({ ...input, purchasePrice: price });
    const dscrOk = r.dscr === null || r.dscr >= input.targetDscr;
    const cocOk = r.cashOnCash !== null && r.cashOnCash >= input.targetCashOnCashPct / 100;
    const cfOk = r.monthlyCashFlowPerUnit >= input.targetMonthlyCashFlowPerUnit;
    return dscrOk && cocOk && cfOk;
  };
  let low = 0;
  let high = Math.max(input.purchasePrice * 3, input.monthlyRent * 12 * 30, 100000);
  if (!meets(1)) return null;
  if (meets(high)) return high;
  for (let i = 0; i < 60; i += 1) {
    const mid = (low + high) / 2;
    if (meets(mid)) low = mid;
    else high = mid;
  }
  return Math.floor(low / 500) * 500;
}

// ---------- Verdict ----------

export type CheckResult = { label: string; value: string; pass: boolean; benchmark: string };
export type Verdict = { tone: "strong" | "workable" | "weak" | "incomplete"; headline: string; checks: CheckResult[] };

export function rentalVerdict(input: AnalyzerInputs, r: RentalAnalysis): Verdict {
  if (input.purchasePrice <= 0 || input.monthlyRent <= 0) {
    return { tone: "incomplete", headline: "Add a price and rent to see whether this deal works.", checks: [] };
  }
  const pct = (v: number | null) => (v === null ? "n/a" : `${(v * 100).toFixed(1)}%`);
  const checks: CheckResult[] = [
    {
      label: "Monthly cash flow per unit",
      value: usd(r.monthlyCashFlowPerUnit),
      pass: r.monthlyCashFlowPerUnit >= input.targetMonthlyCashFlowPerUnit,
      benchmark: `≥ ${usd(input.targetMonthlyCashFlowPerUnit)} after reserves`,
    },
    {
      label: "Cash-on-cash return",
      value: pct(r.cashOnCash),
      pass: (r.cashOnCash ?? -1) >= input.targetCashOnCashPct / 100,
      benchmark: `≥ ${input.targetCashOnCashPct}%`,
    },
    {
      label: "Debt service coverage (DSCR)",
      value: r.dscr === null ? "No loan" : r.dscr.toFixed(2),
      pass: r.dscr === null || r.dscr >= input.targetDscr,
      benchmark: `≥ ${input.targetDscr.toFixed(2)} (typical DSCR-lender minimum)`,
    },
    {
      label: "Break-even occupancy",
      value: pct(r.breakEvenOccupancy),
      pass: (r.breakEvenOccupancy ?? 2) <= 0.85,
      benchmark: "≤ 85%",
    },
  ];
  const passed = checks.filter((c) => c.pass).length;
  if (passed === checks.length) return { tone: "strong", headline: "Meets all of your rental targets.", checks };
  if (r.annualCashFlow >= 0 && (r.dscr === null || r.dscr >= 1)) {
    return { tone: "workable", headline: `Cash flows, but misses ${checks.length - passed} of your targets.`, checks };
  }
  return { tone: "weak", headline: "Loses money at this price and these assumptions.", checks };
}

// ---------- Inputs from a deal ----------

export type DealLike = {
  listPrice?: number;
  monthlyRent?: number;
  annualTaxes?: number;
  annualInsurance?: number;
  hoaMonthly?: number;
  rehabBudget?: number;
  arv?: number;
  downPayment?: number;
  interestRate?: number;
  loanYears?: number;
  analyzer?: Partial<AnalyzerInputs>;
  yearBuilt?: number;
  squareFeet?: number;
  beds?: number;
  baths?: number;
  propertyType?: string;
  state?: string;
  zip?: string;
  address?: string;
  city?: string;
};

export type MarketRateDefaults = { investmentRate30y: number; dscrRate30y: number };

export function inputsFromDeal(deal: DealLike, market?: MarketRateDefaults): AnalyzerInputs {
  const saved = deal.analyzer ?? {};
  const purchasePrice = num(saved.purchasePrice) ?? deal.listPrice ?? 0;
  const derivedDownPct = deal.downPayment !== undefined && purchasePrice > 0 ? (deal.downPayment / purchasePrice) * 100 : undefined;
  const merged: AnalyzerInputs = {
    ...DEFAULT_ASSUMPTIONS,
    purchasePrice,
    monthlyRent: deal.monthlyRent ?? 0,
    annualTaxes: deal.annualTaxes ?? 0,
    annualInsurance: deal.annualInsurance ?? 0,
    hoaMonthly: deal.hoaMonthly ?? DEFAULT_ASSUMPTIONS.hoaMonthly,
    rehabBudget: deal.rehabBudget ?? 0,
    arv: deal.arv,
    downPaymentPct: derivedDownPct ?? DEFAULT_ASSUMPTIONS.downPaymentPct,
    interestRate: deal.interestRate ?? market?.investmentRate30y ?? DEFAULT_ASSUMPTIONS.interestRate,
    refiRate: market?.dscrRate30y ?? DEFAULT_ASSUMPTIONS.refiRate,
    loanTermYears: deal.loanYears ?? DEFAULT_ASSUMPTIONS.loanTermYears,
  };
  for (const [key, value] of Object.entries(saved)) {
    if (key in merged && (typeof value === "number" ? Number.isFinite(value) : typeof value === "boolean")) {
      (merged as Record<string, unknown>)[key] = value;
    }
  }
  return merged;
}

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function usd(value: number, digits = 0) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
}
