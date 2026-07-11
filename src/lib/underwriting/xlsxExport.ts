import type { DealInput, AnalysisResult } from "@/lib/dealAnalysisEngine";
import type { ReturnsResult, ReturnsAssumptions } from "@/lib/underwriting/returnsEngine";
import type { ProFormaResult } from "@/lib/underwriting/proFormaEngine";

interface BuildArgs {
  dealName: string;
  address: string;
  input: DealInput;
  analysis: AnalysisResult;
  proForma: ProFormaResult | null;
  returns: ReturnsResult | null;
  returnsAssumptions: ReturnsAssumptions;
}

type SheetRow = Array<string | number | null | { f: string }>;

export async function exportInvestorModel(args: BuildArgs): Promise<void> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(buildSummaryRows(args)), "Summary");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(buildAssumptionsRows(args)), "Assumptions");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(buildSourcesUsesRows(args)), "Sources & Uses");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(buildProFormaRows(args)), "Pro Forma");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(buildReturnsRows(args)), "Returns");

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array", cellStyles: false });
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeName(args.dealName)}_Investor_Model.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function buildSummaryRows(args: BuildArgs): SheetRow[] {
  const { input, analysis, returns } = args;
  return [
    ["BRIX DealIQ Investor Model"],
    ["Deal", args.dealName],
    ["Address", args.address],
    [],
    ["Metric", "Value"],
    ["Purchase Price", input.purchase_price],
    ["ARV", input.arv],
    ["Monthly Rent", input.monthly_rent],
    ["Monthly Cash Flow", analysis.metrics.monthly_cashflow],
    ["NOI", analysis.metrics.noi],
    ["Cap Rate", analysis.metrics.cap_rate],
    ["Cash-on-Cash Return", analysis.metrics.cash_on_cash],
    ["DSCR", analysis.metrics.dscr],
    ["Total Cash Needed", analysis.metrics.total_cash_needed],
    ["Projected Profit", returns?.summary.total_return ?? null],
    ["Equity Multiple", returns?.summary.equity_multiple ?? null],
    ["Levered IRR", returns?.summary.levered_irr ?? null],
    ["Average Annual Return", returns?.summary.aar ?? null],
    [],
    ["Decision Use"],
    ["Inputs are exported from BRIX saved deal data. Verify source documents before relying on final numbers."],
  ];
}

function buildAssumptionsRows(args: BuildArgs): SheetRow[] {
  const input = args.input;
  return [
    ["Assumption", "Value"],
    ["Purchase Price", input.purchase_price],
    ["Closing Costs", input.closing_costs],
    ["Rehab Cost", input.rehab_cost],
    ["Rehab Contingency", input.rehab_contingency],
    ["Down Payment Percent", input.down_payment_percent],
    ["Interest Rate", input.interest_rate],
    ["Loan Term Years", input.loan_term_years],
    ["Monthly Rent", input.monthly_rent],
    ["Other Income", input.other_income],
    ["Annual Taxes", input.taxes],
    ["Annual Insurance", input.insurance],
    ["Maintenance Percent", input.maintenance_percent],
    ["Vacancy Percent", input.vacancy_percent],
    ["Management Percent", input.management_percent],
    ["CapEx Percent", input.capex_percent],
    ["ARV", input.arv],
  ];
}

function buildSourcesUsesRows(args: BuildArgs): SheetRow[] {
  const input = args.input;
  const loanAmount = input.purchase_price * (1 - input.down_payment_percent);
  const downPayment = input.purchase_price * input.down_payment_percent;
  return [
    ["Sources & Uses", "Amount"],
    ["Purchase Price", input.purchase_price],
    ["Down Payment", downPayment],
    ["Loan Amount", loanAmount],
    ["Closing Costs", input.closing_costs],
    ["Rehab + Contingency", input.rehab_cost + input.rehab_contingency],
    ["Total Cash Needed", args.analysis.metrics.total_cash_needed],
  ];
}

function buildProFormaRows(args: BuildArgs): SheetRow[] {
  const proForma = args.proForma;
  if (!proForma) {
    return [["Pro Forma"], ["Enter required income, expense, and financing inputs to generate pro forma rows."]];
  }

  return [
    ["Pro Forma", "Monthly", "Annual"],
    ["Gross Income", proForma.annual.gross_potential_income / 12, proForma.annual.gross_potential_income],
    ["Vacancy Loss", proForma.annual.vacancy_loss / 12, proForma.annual.vacancy_loss],
    ["Effective Gross Income", proForma.annual.effective_gross_income / 12, proForma.annual.effective_gross_income],
    ["Operating Expenses", proForma.annual.operating_expenses / 12, proForma.annual.operating_expenses],
    ["NOI", proForma.annual.noi / 12, proForma.annual.noi],
    ["Debt Service", proForma.annual.debt_service / 12, proForma.annual.debt_service],
    ["Cash Flow", proForma.annual.cash_flow / 12, proForma.annual.cash_flow],
  ];
}

function buildReturnsRows(args: BuildArgs): SheetRow[] {
  const returns = args.returns;
  const assumptions = args.returnsAssumptions;
  if (!returns) {
    return [["Returns"], ["Enter required deal data to generate return metrics."]];
  }

  return [
    ["Returns", "Value"],
    ["Hold Years", assumptions.hold_years],
    ["Rent Growth", assumptions.rent_growth],
    ["Expense Growth", assumptions.expense_growth],
    ["Appreciation Rate", assumptions.appreciation],
    ["Selling Cost Percent", assumptions.cost_of_sale_pct],
    ["Exit Value", returns.exit?.projected_value ?? null],
    ["Sale Costs", returns.exit?.sale_costs ?? null],
    ["Loan Payoff", returns.exit?.loan_balance_at_exit ?? null],
    ["Net Sale Proceeds", returns.exit?.net_sale_proceeds ?? null],
    ["Cumulative Cash Flow", returns.summary.total_cash_flow],
    ["Projected Profit", returns.summary.total_return],
    ["Equity Multiple", returns.summary.equity_multiple],
    ["Levered IRR", returns.summary.levered_irr],
    ["Average Annual Return", returns.summary.aar],
  ];
}

function safeName(value: string) {
  return value.replace(/[^a-z0-9-_]+/gi, "_").replace(/^_+|_+$/g, "") || "BRIX_Deal";
}
