// Centralized help content for tooltips and Help Center

export const DEAL_INPUT_HELP = {
  purchase_price: "The total acquisition price of the property before closing costs or rehab.",
  rehab_cost: "Estimated cost of all renovations and repairs needed to bring the property to target condition.",
  monthly_rent: "Projected gross monthly rental income from all units.",
  taxes: "Annual property taxes. These are treated as an operating expense in cash flow calculations.",
  insurance: "Annual property insurance premium.",
  arv: "After Repair Value — the estimated market value of the property after all renovations are complete.",
  vacancy_percent: "Expected percentage of time the property will be vacant annually. Industry standard is 5-10%.",
  maintenance_percent: "Annual maintenance costs as a percentage of gross rent. Typically 5-10%.",
  management_percent: "Property management fees as a percentage of gross rent. Typically 8-12%.",
  capex_percent: "Capital expenditure reserve for major repairs (roof, HVAC, etc.) as a percentage of gross rent.",
  closing_costs: "One-time costs at purchase including title, escrow, inspections, and lender fees.",
  down_payment_percent: "Percentage of purchase price paid as equity at closing.",
  interest_rate: "Annual mortgage interest rate for the loan.",
  loan_term_years: "Length of the mortgage in years.",
  other_income: "Additional annual income from sources like laundry, parking, or storage.",
} as const;

export const METRIC_HELP = {
  cap_rate: "Capitalization Rate — Net Operating Income divided by purchase price. Measures property return independent of financing. Higher is better; 5-10% is typical.",
  cash_on_cash: "Cash-on-Cash Return — Annual pre-tax cash flow divided by total cash invested. Measures return on your actual cash outlay. 8%+ is generally strong.",
  monthly_cashflow: "Monthly Cash Flow — Net income after all expenses, vacancy, and debt service. Positive cash flow means the property pays for itself.",
  dscr: "Debt Service Coverage Ratio — NOI divided by annual debt payments. Above 1.25 is strong; below 1.0 means negative cash flow.",
  roi: "Return on Investment — Total first-year return including cash flow and equity gains, relative to cash invested.",
} as const;

export const STRATEGY_HELP = "Strategy fit signals indicate how well your deal aligns with common investment approaches. These are directional indicators, not guarantees. Always validate with your own due diligence.";

export const MARKET_HELP = "Market conditions reflect local demand indicators, rent trends, price movements, and inventory pressure. These signals provide context for your deal but should be combined with on-the-ground research.";

export const CRIME_HELP = "The crime score (0-10) represents a relative risk signal for the property's area. It is not a prediction of future events. Use it as one factor among many when evaluating location risk.";

export const HELP_CENTER_SECTIONS = [
  {
    id: "getting-started",
    title: "Getting Started",
    content: [
      "BRIX is a deal intelligence platform that helps real estate investors evaluate properties using financial analysis, market data, and strategy evaluation.",
      "To begin, create a new deal from the Dashboard or Deals page. Enter the property address and basic financial assumptions. BRIX will calculate key investment metrics automatically.",
      "Your first deal analysis is free. Additional analyses require an active subscription.",
    ],
  },
  {
    id: "deal-metrics",
    title: "Understanding Deal Metrics",
    content: [
      "Cap Rate measures the property's income potential relative to its price, independent of how you finance it. A higher cap rate suggests better income yield.",
      "Cash-on-Cash Return shows the annual return on your actual cash invested. This accounts for financing and gives a clearer picture of your equity return.",
      "Monthly Cash Flow is your net income after all expenses and debt service. Positive cash flow means the property generates income beyond its costs.",
      "DSCR (Debt Service Coverage Ratio) measures whether the property's income can cover its debt payments. Lenders typically require 1.2x or higher.",
      "The Deal Score (0-100) is a composite rating based on cash flow strength, return metrics, risk factors, and market alignment.",
    ],
  },
  {
    id: "strategies",
    title: "Investment Strategies",
    content: [
      "Buy & Hold evaluates long-term rental income potential with steady cash flow and appreciation.",
      "Fix & Flip analyzes the spread between purchase-plus-rehab cost and the after-repair value (ARV).",
      "BRRRR (Buy, Rehab, Rent, Refinance, Repeat) looks at whether you can recover your investment through refinancing after improving the property.",
      "Wholesale evaluates the assignment potential based on the discount to market value.",
      "Strategy signals are directional indicators. They highlight which approaches best match your deal's financial profile, but every deal requires independent verification.",
    ],
  },
  {
    id: "market-signals",
    title: "Market Signals",
    content: [
      "Market Strength Score reflects the overall health of the local real estate market based on price trends, rent growth, and demand indicators.",
      "Demand Pressure measures buyer and renter competition using inventory levels, days on market, and absorption rates.",
      "Crime Score provides a relative safety signal for the property's area on a 0-10 scale. Lower scores indicate less crime risk.",
      "All market data should be entered manually from trusted local sources. BRIX evaluates the data you provide to generate market intelligence signals.",
    ],
  },
  {
    id: "reports",
    title: "Reports and Exports",
    content: [
      "Investor PDF Reports compile your deal analysis, intelligence signals, strategy fit, market conditions, and stress test results into a professional document.",
      "CSV Data Exports provide raw numerical data for further analysis in spreadsheets or other tools.",
      "Reports can be generated from the Analysis page using the Generate Report button.",
    ],
  },
  {
    id: "billing",
    title: "Billing and Access",
    content: [
      "Every user receives one free deal analysis to explore the platform.",
      "Additional deal analyses require an active subscription at $155.99/month.",
      "Administrators can grant premium access overrides for promotional or support purposes.",
      "If subscription billing is not yet configured, upgrade options will be temporarily disabled with clear messaging.",
    ],
  },
] as const;
