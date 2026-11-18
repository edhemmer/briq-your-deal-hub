/**
 * BRIX deal intelligence: turns raw underwriting into decisions.
 *
 * - whatItTakes: the single change (price, rent, down payment, or rate) that makes the deal meet
 *   the investor's targets, each solved independently.
 * - stressTest: how the deal holds up under realistic bad news.
 * - riskFlags: assumptions that are optimistic, missing, or out of line with 2026 norms.
 * - houseHack: owner-occupied FHA house hack (live in one unit, rent the rest).
 * - taxView: year-one depreciation and after-tax cash flow.
 *
 * Everything here is deterministic and built on core/investorMath.
 */
import {
  MARKET_DEFAULTS,
  analyzeRental,
  monthlyPayment,
  remainingBalance,
  usd,
  type AnalyzerInputs,
  type DealLike,
  type RentalAnalysis,
} from "./investorMath";

export function meetsTargets(input: AnalyzerInputs, r: RentalAnalysis = analyzeRental(input)) {
  const dscrOk = r.dscr === null || r.dscr >= input.targetDscr;
  const cocOk = r.cashOnCash !== null && r.cashOnCash >= input.targetCashOnCashPct / 100;
  const cfOk = r.monthlyCashFlowPerUnit >= input.targetMonthlyCashFlowPerUnit;
  return dscrOk && cocOk && cfOk;
}

function solve(lo: number, hi: number, ok: (x: number) => boolean, preferHigh: boolean, iterations = 60): number | null {
  // Finds the boundary where ok() flips; preferHigh=true returns the largest x that is ok.
  const okLo = ok(lo);
  const okHi = ok(hi);
  if (okLo === okHi) return okLo ? (preferHigh ? hi : lo) : null;
  let a = lo;
  let b = hi;
  for (let i = 0; i < iterations; i += 1) {
    const mid = (a + b) / 2;
    if (ok(mid) === okLo) a = mid;
    else b = mid;
  }
  return okLo ? a : b;
}

// ---------- What it takes ----------

export type Lever = {
  id: "price" | "rent" | "down" | "rate";
  label: string;
  current: string;
  needed: string | null;
  change: string | null;
  feasible: boolean;
  note: string;
};

export function whatItTakes(input: AnalyzerInputs): { alreadyMeets: boolean; levers: Lever[] } {
  if (input.purchasePrice <= 0 || input.monthlyRent <= 0) return { alreadyMeets: false, levers: [] };
  const alreadyMeets = meetsTargets(input);

  const price = solve(1, input.purchasePrice * 2, (p) => meetsTargets({ ...input, purchasePrice: p }), true);
  const rent = solve(input.monthlyRent * 0.3, input.monthlyRent * 3, (r) => meetsTargets({ ...input, monthlyRent: r }), false);
  const down = input.cashPurchase ? null : solve(0, 100, (d) => meetsTargets({ ...input, downPaymentPct: d }), false);
  const rate = input.cashPurchase ? null : solve(0, input.interestRate * 2, (r) => meetsTargets({ ...input, interestRate: r }), true);

  const levers: Lever[] = [
    {
      id: "price",
      label: "Purchase price",
      current: usd(input.purchasePrice),
      needed: price === null ? null : usd(Math.floor(price / 500) * 500),
      change: price === null ? null : pctChange(input.purchasePrice, price),
      feasible: price !== null && price >= input.purchasePrice * 0.85,
      note: price === null ? "No price works with this rent and financing." : price >= input.purchasePrice ? "Room to pay up to this and still hit your targets." : "Negotiate to this price, or walk.",
    },
    {
      id: "rent",
      label: "Monthly rent",
      current: usd(input.monthlyRent),
      needed: rent === null ? null : usd(Math.ceil(rent / 25) * 25),
      change: rent === null ? null : pctChange(input.monthlyRent, rent),
      feasible: rent !== null && rent <= input.monthlyRent * 1.08,
      note: rent === null ? "Rent alone can't fix this deal." : rent <= input.monthlyRent ? "Your rent already clears the bar." : "Only realistic if comps support it (an extra bedroom, ADU, or furnished mid-term).",
    },
    {
      id: "down",
      label: "Down payment",
      current: `${input.downPaymentPct.toFixed(1)}%`,
      needed: down === null ? null : `${Math.ceil(down)}%`,
      change: down === null ? null : `${(down - input.downPaymentPct).toFixed(0)} pts`,
      feasible: down !== null && down <= 40,
      note: down === null ? "More cash down alone doesn't get there (cash-on-cash falls as cash rises)." : down <= input.downPaymentPct ? "Your down payment is enough." : "More cash down lowers the payment but dilutes cash-on-cash.",
    },
    {
      id: "rate",
      label: "Interest rate",
      current: `${input.interestRate.toFixed(3)}%`,
      needed: rate === null ? null : `${(Math.floor(rate * 8) / 8).toFixed(3)}%`,
      change: rate === null ? null : `${(rate - input.interestRate).toFixed(2)} pts`,
      feasible: rate !== null && rate >= input.interestRate - 0.5,
      note: rate === null ? "Even a 0% rate wouldn't make this meet your targets." : rate >= input.interestRate ? "Rate isn't the constraint." : "Possible with points, a seller buydown, or an assumable loan.",
    },
  ];
  return { alreadyMeets, levers };
}

function belowAsk(ask: number, needed: string) {
  const value = Number(needed.replace(/[$,]/g, ""));
  const diff = (ask - value) / ask;
  return diff > 0 ? `${(diff * 100).toFixed(0)}% below ask` : `${(-diff * 100).toFixed(0)}% above ask`;
}

function pctChange(from: number, to: number) {
  const diff = (to - from) / from;
  return `${diff >= 0 ? "+" : ""}${(diff * 100).toFixed(1)}%`;
}

// ---------- Stress test ----------

export type StressScenario = { label: string; detail: string; monthlyCashFlow: number; dscr: number | null; survives: boolean };

export function stressTest(input: AnalyzerInputs): StressScenario[] {
  if (input.purchasePrice <= 0 || input.monthlyRent <= 0) return [];
  const scenarios: Array<{ label: string; detail: string; patch: Partial<AnalyzerInputs> }> = [
    { label: "As underwritten", detail: "Your current assumptions", patch: {} },
    { label: "Rent 10% lower", detail: "Comps come in soft or you cut rent to fill", patch: { monthlyRent: input.monthlyRent * 0.9 } },
    { label: "Two months vacant", detail: "Vacancy at 16.7% for a slow turnover year", patch: { vacancyPct: Math.max(input.vacancyPct, 16.7) } },
    { label: "Taxes & insurance +25%", detail: "Post-sale reassessment and a premium hike", patch: { annualTaxes: input.annualTaxes * 1.25, annualInsurance: input.annualInsurance * 1.25 } },
    { label: "Rate 1 point higher", detail: "Rates move before you lock", patch: { interestRate: input.interestRate + 1 } },
    {
      label: "Bad year",
      detail: "Rent −5%, vacancy 10%, taxes & insurance +15%, repairs 8%",
      patch: { monthlyRent: input.monthlyRent * 0.95, vacancyPct: Math.max(input.vacancyPct, 10), annualTaxes: input.annualTaxes * 1.15, annualInsurance: input.annualInsurance * 1.15, maintenancePct: Math.max(input.maintenancePct, 8) },
    },
  ];
  return scenarios.map(({ label, detail, patch }) => {
    const r = analyzeRental({ ...input, ...patch });
    return { label, detail, monthlyCashFlow: r.monthlyCashFlow, dscr: r.dscr, survives: r.monthlyCashFlow >= 0 && (r.dscr === null || r.dscr >= 1) };
  });
}

// ---------- Risk flags ----------

export type RiskFlag = { severity: "high" | "medium" | "info"; title: string; detail: string };

export function riskFlags(input: AnalyzerInputs, deal: DealLike, r: RentalAnalysis = analyzeRental(input)): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const price = input.purchasePrice;
  if (price <= 0) return flags;
  const year = new Date().getFullYear();

  if (input.annualInsurance <= 0) {
    flags.push({ severity: "high", title: "No insurance entered", detail: "Landlord (DP-3) policies commonly run about $1,500-$2,650 a year nationally in 2026, far more in FL, TX, CA and coastal areas. Get a quote before you offer." });
  } else if (input.annualInsurance / price < 0.004) {
    flags.push({ severity: "medium", title: "Insurance looks low", detail: `${usd(input.annualInsurance)}/yr is ${(input.annualInsurance / price * 100).toFixed(2)}% of price. Landlord policies cost more than homeowner policies; confirm it's a DP-3 quote, not an HO-3 estimate.` });
  }
  if (input.annualTaxes <= 0) {
    flags.push({ severity: "high", title: "No property taxes entered", detail: "Pull the county record and estimate taxes at your purchase price, since many counties reassess after a sale." });
  } else if (input.annualTaxes / price < 0.006) {
    flags.push({ severity: "medium", title: "Taxes may jump after purchase", detail: `Current taxes are ${(input.annualTaxes / price * 100).toFixed(2)}% of your price, which often signals a long-held assessment or a homestead exemption that ends at sale.` });
  }
  if (input.vacancyPct < 5) flags.push({ severity: "medium", title: "Vacancy is optimistic", detail: `${input.vacancyPct}% assumes almost no turnover. 5%-8% is standard; use more for student, seasonal, or Class C areas.` });
  if (input.managementPct === 0) flags.push({ severity: "info", title: "Self-managing", detail: "Your time isn't free. Lenders and buyers underwrite 8%-10% management, so your DSCR and resale math should too." });
  if (input.capexPct + input.maintenancePct < 8) flags.push({ severity: "medium", title: "Reserves are thin", detail: `Repairs + CapEx total ${input.capexPct + input.maintenancePct}% of rent. 10% is the usual floor; older homes need more.` });

  if (deal.yearBuilt && deal.yearBuilt > 1800) {
    const age = year - deal.yearBuilt;
    if (deal.yearBuilt < 1978) flags.push({ severity: "info", title: "Built before 1978", detail: "Federal lead-based paint disclosure rules apply to rentals, and renovations need lead-safe (RRP) contractors." });
    if (age >= 50 && input.capexPct < 8) flags.push({ severity: "medium", title: `${age}-year-old home with a ${input.capexPct}% CapEx reserve`, detail: "Original plumbing, electrical, and sewer laterals are common at this age. Consider 8%-10% CapEx and a sewer scope at inspection." });
  }

  if (r.dscr !== null && r.dscr < 1) flags.push({ severity: "high", title: `DSCR ${r.dscr.toFixed(2)}: rent doesn't cover the loan`, detail: "Most DSCR lenders require at least 1.0-1.25, so this likely won't qualify for a rental-income loan as structured." });
  else if (r.dscr !== null && r.dscr < 1.25) flags.push({ severity: "medium", title: `DSCR ${r.dscr.toFixed(2)}`, detail: "Expect worse pricing or a larger down payment requirement from DSCR lenders below 1.25." });

  if (r.onePercentRatio !== null && r.onePercentRatio < 0.006) flags.push({ severity: "info", title: "Appreciation play, not a cash-flow deal", detail: `Rent is ${(r.onePercentRatio * 100).toFixed(2)}% of price per month. At 2026 rates, deals under about 0.7% rarely cash flow with normal leverage.` });

  if (!input.cashPurchase && input.interestRate < MARKET_DEFAULTS.investmentRate30y - 0.5) {
    flags.push({ severity: "info", title: "Rate is below today's investment-loan market", detail: `You entered ${input.interestRate}%. Investment loans are averaging about ${MARKET_DEFAULTS.investmentRate30y}%. Make sure this is a real quote, an assumable loan, or a seller buydown.` });
  }

  if (input.arv && input.arv > 0) {
    const allIn = price + input.rehabBudget;
    if (input.arv > allIn * 1.4) flags.push({ severity: "medium", title: "ARV assumes a big lift", detail: `ARV is ${((input.arv / allIn - 1) * 100).toFixed(0)}% above price + rehab. Support it with 3+ renovated sold comps within 0.5 mile and 6 months.` });
    if (deal.squareFeet && input.rehabBudget > 0) {
      const perSf = input.rehabBudget / deal.squareFeet;
      if (perSf < 15 && input.arv > price * 1.15) flags.push({ severity: "medium", title: `Rehab is only $${perSf.toFixed(0)}/sq ft`, detail: "That's cosmetic-level money for a value jump this large. Add a 10%-15% contingency and get a contractor walk-through." });
    }
  }

  if (input.hoaMonthly > 0) flags.push({ severity: "info", title: "HOA: check rental restrictions", detail: "Many associations cap rentals, ban short-term stays, or require minimum lease terms. Review the declaration in GovernanceIQ before you offer." });
  if (input.units >= 2 && input.units <= 4 && price <= MARKET_DEFAULTS.fhaLoanLimitFloor1Unit * 2) {
    flags.push({ severity: "info", title: `${input.units}-unit: house-hack eligible`, detail: "Live in one unit and you can use owner-occupied financing (FHA 3.5% down). See the House hack view." });
  }
  return flags.sort((a, b) => rank(a.severity) - rank(b.severity));
}

function rank(severity: RiskFlag["severity"]) {
  return severity === "high" ? 0 : severity === "medium" ? 1 : 2;
}

// ---------- House hack ----------

export type HouseHackAnalysis = {
  baseLoan: number;
  totalLoan: number;
  downPayment: number;
  cashToClose: number;
  monthlyPrincipalAndInterest: number;
  monthlyMip: number;
  monthlyTaxesInsuranceHoa: number;
  monthlyReservesAndOther: number;
  rentFromOtherUnits: number;
  netMonthlyHousingCost: number;
  monthlyPrincipalPaydown: number;
  costAfterEquity: number;
  savingsVsRenting: number | null;
  savingsVsRentingAfterEquity: number | null;
  afterMoveOutCashFlow: number;
  overFhaLimit: boolean;
};

export function analyzeHouseHack(input: AnalyzerInputs): HouseHackAnalysis | null {
  if (input.purchasePrice <= 0) return null;
  const price = input.purchasePrice;
  const downPayment = price * (input.houseHackDownPct / 100);
  const baseLoan = price - downPayment;
  const upfrontMip = baseLoan * (input.houseHackUpfrontMipPct / 100);
  const totalLoan = baseLoan + upfrontMip; // UFMIP is normally financed
  const pi = monthlyPayment(totalLoan, input.houseHackRate, 30);
  const mip = (baseLoan * (input.houseHackMipPct / 100)) / 12;
  const tih = input.annualTaxes / 12 + input.annualInsurance / 12 + input.hoaMonthly;
  const ownerRent = Math.min(input.ownerUnitRent, input.monthlyRent);
  const rentFromOtherUnits = Math.max(0, input.monthlyRent - ownerRent) * (1 - input.vacancyPct / 100);
  // Reserves on the whole building; management only on the rented units.
  const reserves = (input.monthlyRent * (input.maintenancePct + input.capexPct)) / 100 + rentFromOtherUnits * (input.managementPct / 100) + input.utilitiesMonthly + input.otherMonthlyExpenses;
  const netMonthlyHousingCost = pi + mip + tih + reserves - rentFromOtherUnits;
  const monthlyPrincipalPaydown = (totalLoan - remainingBalance(totalLoan, input.houseHackRate, 30, 12)) / 12;
  const costAfterEquity = netMonthlyHousingCost - monthlyPrincipalPaydown;
  const afterMoveOut = analyzeRental({ ...input, cashPurchase: false });
  const afterMoveOutCashFlow = afterMoveOut.operating.netOperatingIncome / 12 - pi - mip;
  return {
    baseLoan,
    totalLoan,
    downPayment,
    cashToClose: downPayment + price * (input.closingCostPct / 100),
    monthlyPrincipalAndInterest: pi,
    monthlyMip: mip,
    monthlyTaxesInsuranceHoa: tih,
    monthlyReservesAndOther: reserves,
    rentFromOtherUnits,
    netMonthlyHousingCost,
    monthlyPrincipalPaydown,
    costAfterEquity,
    savingsVsRenting: input.comparableRentForYou > 0 ? input.comparableRentForYou - netMonthlyHousingCost : null,
    savingsVsRentingAfterEquity: input.comparableRentForYou > 0 ? input.comparableRentForYou - costAfterEquity : null,
    afterMoveOutCashFlow,
    overFhaLimit: baseLoan > MARKET_DEFAULTS.fhaLoanLimitFloor1Unit * (input.units >= 2 ? 1.28 : 1),
  };
}

// ---------- Taxes ----------

export type TaxView = {
  annualDepreciation: number;
  yearOneInterest: number;
  taxableIncome: number;
  taxEffect: number;
  afterTaxCashFlow: number;
};

export function taxView(input: AnalyzerInputs, r: RentalAnalysis = analyzeRental(input)): TaxView {
  const depreciableBasis = (input.purchasePrice + r.closingCosts) * (1 - input.landValuePct / 100) + input.rehabBudget;
  const annualDepreciation = depreciableBasis / 27.5;
  const yearOneInterest = r.annualDebtService - (r.loanAmount - remainingBalance(r.loanAmount, input.interestRate, input.loanTermYears, 12));
  const taxableIncome = r.operating.netOperatingIncome - yearOneInterest - annualDepreciation;
  const taxEffect = -taxableIncome * (input.taxBracketPct / 100);
  return { annualDepreciation, yearOneInterest, taxableIncome, taxEffect, afterTaxCashFlow: r.annualCashFlow + taxEffect };
}

// ---------- One-paragraph read ----------

export function brixRead(input: AnalyzerInputs, r: RentalAnalysis = analyzeRental(input)): string | null {
  if (input.purchasePrice <= 0 || input.monthlyRent <= 0) return null;
  const takes = whatItTakes(input);
  const price = takes.levers.find((l) => l.id === "price");
  const rent = takes.levers.find((l) => l.id === "rent");
  const stress = stressTest(input);
  const survived = stress.slice(1).filter((s) => s.survives).length;
  const cf = usd(r.monthlyCashFlow);
  if (takes.alreadyMeets) {
    return `Clears every target with ${cf}/mo cash flow and survives ${survived} of ${stress.length - 1} stress tests. ${price?.needed ? `You could pay up to ${price.needed} and still hit your numbers.` : ""}`.trim();
  }
  const fixes = [price?.feasible && price.needed ? `buying at ${price.needed}` : null, rent?.feasible && rent.needed ? `getting ${rent.needed} rent` : null].filter(Boolean);
  return `At this price it ${r.monthlyCashFlow >= 0 ? `cash flows ${cf}/mo but misses your targets` : `loses ${usd(-r.monthlyCashFlow)}/mo`}. ${fixes.length ? `It works if you can get to ${fixes.join(" or ")}.` : price?.needed ? `It only works near ${price.needed}, ${belowAsk(input.purchasePrice, price.needed)}, so treat it as a pass unless the seller is motivated.` : "No single change fixes it."} Survives ${survived} of ${stress.length - 1} stress tests.`;
}
