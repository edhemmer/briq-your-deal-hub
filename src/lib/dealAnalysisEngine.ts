// BRIX Deal Analysis Engine — deterministic, reusable, divide-by-zero safe.

export interface DealInput {
  purchase_price: number;
  closing_costs: number;
  rehab_cost: number;
  rehab_contingency: number;
  down_payment_percent: number;
  interest_rate: number;
  loan_term_years: number;
  monthly_rent: number;
  other_income: number;
  taxes: number;
  insurance: number;
  maintenance_percent: number;
  vacancy_percent: number;
  management_percent: number;
  capex_percent: number;
  arv: number;
}

export interface AnalysisResult {
  acquisition: {
    purchase_price: number;
    closing_costs: number;
    total_acquisition: number;
  };
  rehab: {
    rehab_cost: number;
    rehab_contingency: number;
    total_rehab: number;
  };
  financing: {
    down_payment: number;
    loan_amount: number;
    monthly_payment: number;
    annual_debt_service: number;
  };
  income: {
    gross_rent: number;
    effective_rent: number;
    other_income: number;
    total_income: number;
  };
  expenses: {
    taxes: number;
    insurance: number;
    maintenance: number;
    management: number;
    capex: number;
    operating_expenses: number;
  };
  metrics: {
    noi: number;
    cap_rate: number;
    monthly_cashflow: number;
    annual_cashflow: number;
    cash_on_cash: number;
    dscr: number;
    initial_cash_required: number;
  };
  refinance: {
    total_project_cost: number;
    equity_created: number;
    refinance_amount: number;
    cash_out: number;
  };
  strategyInsights: string[];
}

function safe(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

function safeDivide(a: number, b: number): number {
  if (!b || !Number.isFinite(b)) return 0;
  const r = a / b;
  return Number.isFinite(r) ? r : 0;
}

function calcMortgagePayment(loanAmount: number, annualRate: number, termYears: number): number {
  if (loanAmount <= 0 || termYears <= 0) return 0;
  if (annualRate <= 0) return safeDivide(loanAmount, termYears * 12);
  const r = annualRate / 12;
  const n = termYears * 12;
  const factor = Math.pow(1 + r, n);
  return safe(loanAmount * (r * factor) / (factor - 1));
}

export function analyzeDeal(d: DealInput): AnalysisResult {
  const pp = safe(d.purchase_price);
  const cc = safe(d.closing_costs);
  const rc = safe(d.rehab_cost);
  const rcont = safe(d.rehab_contingency);
  const dpPct = safe(d.down_payment_percent);
  const ir = safe(d.interest_rate);
  const lt = safe(d.loan_term_years);
  const mr = safe(d.monthly_rent);
  const oi = safe(d.other_income);
  const tx = safe(d.taxes);
  const ins = safe(d.insurance);
  const maintPct = safe(d.maintenance_percent);
  const vacPct = safe(d.vacancy_percent);
  const mgmtPct = safe(d.management_percent);
  const capPct = safe(d.capex_percent);
  const arv = safe(d.arv);

  // Acquisition
  const total_acquisition = pp + cc;

  // Rehab
  const total_rehab = rc + rcont;

  // Financing
  const down_payment = pp * dpPct;
  const loan_amount = pp - down_payment;
  const monthly_payment = calcMortgagePayment(loan_amount, ir, lt);
  const annual_debt_service = monthly_payment * 12;

  // Income
  const gross_rent = mr * 12;
  const effective_rent = gross_rent * (1 - vacPct);
  const total_income = effective_rent + oi;

  // Expenses
  const maintenance = gross_rent * maintPct;
  const management = gross_rent * mgmtPct;
  const capex = gross_rent * capPct;
  const operating_expenses = tx + ins + maintenance + management + capex;

  // NOI
  const noi = effective_rent + oi - operating_expenses;

  // Cap Rate
  const cap_rate = safeDivide(noi, pp);

  // Cash Flow
  const monthly_cashflow = (mr + oi / 12) - operating_expenses / 12 - monthly_payment;
  const annual_cashflow = monthly_cashflow * 12;

  // Cash on Cash
  const initial_cash_required = down_payment + cc + rc + rcont;
  const cash_on_cash = safeDivide(annual_cashflow, initial_cash_required);

  // DSCR
  const dscr = safeDivide(noi, annual_debt_service);

  // BRRRR / Refinance
  const total_project_cost = pp + cc + rc;
  const equity_created = arv - total_project_cost;
  const refinance_amount = arv * 0.75;
  const cash_out = refinance_amount - loan_amount;

  // Strategy insights
  const strategyInsights: string[] = [];
  if (monthly_cashflow > 0 && cap_rate >= 0.06) {
    strategyInsights.push("Strong rental candidate — positive cash flow with ≥6% cap rate.");
  }
  if (arv - total_project_cost > 0.15 * arv) {
    strategyInsights.push("Flip candidate — projected profit exceeds 15% of ARV.");
  }
  if (equity_created > initial_cash_required) {
    strategyInsights.push("BRRRR candidate — equity created exceeds initial cash invested.");
  }

  return {
    acquisition: { purchase_price: pp, closing_costs: cc, total_acquisition },
    rehab: { rehab_cost: rc, rehab_contingency: rcont, total_rehab },
    financing: { down_payment, loan_amount, monthly_payment, annual_debt_service },
    income: { gross_rent, effective_rent, other_income: oi, total_income },
    expenses: { taxes: tx, insurance: ins, maintenance, management, capex, operating_expenses },
    metrics: { noi, cap_rate, monthly_cashflow, annual_cashflow, cash_on_cash, dscr, initial_cash_required },
    refinance: { total_project_cost, equity_created, refinance_amount, cash_out },
    strategyInsights,
  };
}
