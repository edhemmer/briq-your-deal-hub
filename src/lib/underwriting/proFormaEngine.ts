// Pro Forma Engine — deterministic T-12 income statement, NOI bridge, OpEx categorization.
// No AI. No external calls. Pure math from inputs.

import type { DealInput } from "@/lib/dealAnalysisEngine";
import type { AnalysisResult } from "@/lib/dealAnalysisEngine";

export interface MonthRow {
  month: number; // 1..12
  label: string;
  gross_rent: number;
  vacancy_loss: number;
  other_income: number;
  effective_income: number;
  taxes: number;
  insurance: number;
  maintenance: number;
  management: number;
  capex_reserve: number;
  total_opex: number;
  noi: number;
}

export interface OpExCategory {
  key: string;
  label: string;
  annual: number;
  monthly: number;
  pct_of_egi: number;
}

export interface NoiBridgeStep {
  label: string;
  amount: number;
  type: "income" | "deduction" | "subtotal" | "total";
}

export interface ProFormaResult {
  units: number;
  monthly: MonthRow[];
  annual: {
    gross_potential_income: number;
    vacancy_loss: number;
    other_income: number;
    effective_gross_income: number;
    operating_expenses: number;
    noi: number;
    debt_service: number;
    cash_flow: number;
  };
  opexBreakdown: OpExCategory[];
  noiBridge: NoiBridgeStep[];
  ratios: {
    opex_ratio: number;            // OpEx / EGI
    expense_per_unit: number;      // Annual OpEx / units
    income_per_unit: number;       // EGI / units
    noi_per_unit: number;
    dscr: number;
    debt_yield: number;            // NOI / loan amount
    break_even_occupancy: number;  // (OpEx + DS) / GPI
  };
  // Truthful partial degradation
  warnings: string[];
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function estimateUnits(d: DealInput, propertyType?: string | null): number {
  if (!propertyType) return 1;
  const t = propertyType.toLowerCase();
  if (t.includes("multi")) {
    // Heuristic: derive from rent vs single-family median (~$2000/door).
    // Conservative: assume 4 if multi-family flagged with no detail.
    return 4;
  }
  return 1;
}

export function buildProForma(
  input: DealInput,
  analysis: AnalysisResult,
  opts?: { units?: number; propertyType?: string | null }
): ProFormaResult {
  const warnings: string[] = [];
  const units = opts?.units && opts.units > 0 ? opts.units : estimateUnits(input, opts?.propertyType);

  const gpi = analysis.income.gross_rent;                        // annual
  const vacancyLoss = gpi * (input.vacancy_percent || 0);
  const otherIncome = analysis.income.other_income;
  const egi = gpi - vacancyLoss + otherIncome;
  const opex = analysis.expenses.operating_expenses;
  const noi = analysis.metrics.noi;
  const ds = analysis.financing.annual_debt_service;
  const cf = noi - ds;
  const loanAmount = analysis.financing.loan_amount;

  if (gpi === 0) warnings.push("Gross rent is zero — pro forma reflects no income.");
  if (loanAmount === 0) warnings.push("No loan modeled — DSCR and debt yield are N/A.");

  // Monthly distribution: flat — taxes/insurance modeled as straight-line monthly accrual.
  // (Many lenders evaluate trailing-12 this way; seasonality requires unit-level data.)
  const monthlyGross = gpi / 12;
  const monthlyVacancy = vacancyLoss / 12;
  const monthlyOther = otherIncome / 12;
  const monthlyTaxes = analysis.expenses.taxes / 12;
  const monthlyIns = analysis.expenses.insurance / 12;
  const monthlyMaint = analysis.expenses.maintenance / 12;
  const monthlyMgmt = analysis.expenses.management / 12;
  const monthlyCapex = analysis.expenses.capex / 12;
  const monthlyOpex = opex / 12;
  const monthlyNoi = noi / 12;

  const monthly: MonthRow[] = MONTH_LABELS.map((label, i) => ({
    month: i + 1,
    label,
    gross_rent: monthlyGross,
    vacancy_loss: monthlyVacancy,
    other_income: monthlyOther,
    effective_income: monthlyGross - monthlyVacancy + monthlyOther,
    taxes: monthlyTaxes,
    insurance: monthlyIns,
    maintenance: monthlyMaint,
    management: monthlyMgmt,
    capex_reserve: monthlyCapex,
    total_opex: monthlyOpex,
    noi: monthlyNoi,
  }));

  const pct = (x: number) => (egi > 0 ? x / egi : 0);

  const opexBreakdown: OpExCategory[] = [
    { key: "taxes", label: "Property Taxes", annual: analysis.expenses.taxes, monthly: monthlyTaxes, pct_of_egi: pct(analysis.expenses.taxes) },
    { key: "insurance", label: "Insurance", annual: analysis.expenses.insurance, monthly: monthlyIns, pct_of_egi: pct(analysis.expenses.insurance) },
    { key: "maintenance", label: "Repairs & Maintenance", annual: analysis.expenses.maintenance, monthly: monthlyMaint, pct_of_egi: pct(analysis.expenses.maintenance) },
    { key: "management", label: "Property Management", annual: analysis.expenses.management, monthly: monthlyMgmt, pct_of_egi: pct(analysis.expenses.management) },
    { key: "capex", label: "CapEx Reserve", annual: analysis.expenses.capex, monthly: monthlyCapex, pct_of_egi: pct(analysis.expenses.capex) },
  ];

  const noiBridge: NoiBridgeStep[] = [
    { label: "Gross Potential Income", amount: gpi, type: "income" },
    { label: "Vacancy Loss", amount: -vacancyLoss, type: "deduction" },
    { label: "Other Income", amount: otherIncome, type: "income" },
    { label: "Effective Gross Income", amount: egi, type: "subtotal" },
    { label: "Operating Expenses", amount: -opex, type: "deduction" },
    { label: "Net Operating Income", amount: noi, type: "total" },
  ];

  return {
    units,
    monthly,
    annual: {
      gross_potential_income: gpi,
      vacancy_loss: vacancyLoss,
      other_income: otherIncome,
      effective_gross_income: egi,
      operating_expenses: opex,
      noi,
      debt_service: ds,
      cash_flow: cf,
    },
    opexBreakdown,
    noiBridge,
    ratios: {
      opex_ratio: egi > 0 ? opex / egi : 0,
      expense_per_unit: units > 0 ? opex / units : 0,
      income_per_unit: units > 0 ? egi / units : 0,
      noi_per_unit: units > 0 ? noi / units : 0,
      dscr: ds > 0 ? noi / ds : 0,
      debt_yield: loanAmount > 0 ? noi / loanAmount : 0,
      break_even_occupancy: gpi > 0 ? (opex + ds) / gpi : 0,
    },
    warnings,
  };
}
