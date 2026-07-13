export type StrategyCategory =
  | "live_in"
  | "rental"
  | "renovation"
  | "financing"
  | "equity"
  | "tax"
  | "development"
  | "exit";

export type StrategyId =
  | "owner_occupant"
  | "buy_and_hold"
  | "long_term_rental"
  | "mid_term_rental"
  | "short_term_rental"
  | "hybrid_rental"
  | "house_hack"
  | "brrrr"
  | "hybrid_brrrr"
  | "fix_and_flip"
  | "value_add"
  | "adu"
  | "lot_split"
  | "mixed_use_conversion"
  | "commercial_repositioning"
  | "development"
  | "refinance"
  | "hold"
  | "sell"
  | "seller_finance"
  | "subject_to"
  | "lease_option"
  | "wrap_mortgage"
  | "assumable_financing"
  | "private_money"
  | "hard_money"
  | "dscr_financing"
  | "cash_out_refinance"
  | "equity_redeployment"
  | "portfolio_refinance"
  | "exchange_1031"
  | "installment_sale"
  | "cost_segregation"
  | "joint_venture"
  | "equity_partner"
  | "waterfall_partnership";

export type StrategyRule = {
  id: StrategyId;
  name: string;
  category: StrategyCategory;
  plainEnglish: string;
  requiredInputs: string[];
  keyMetrics: string[];
  assumptions: string[];
  successCriteria: string[];
  failureScenarios: string[];
  verification: string[];
  professionalReview?: string[];
  complexity: "Low" | "Moderate" | "High" | "Expert";
};

const baseRentalVerification = [
  "Current rent or market rent support",
  "Annual taxes",
  "Annual insurance",
  "Vacancy and maintenance assumptions",
  "Financing terms",
  "Property condition",
];

export const strategyCatalog: StrategyRule[] = [
  {
    id: "owner_occupant",
    name: "Owner Occupant",
    category: "live_in",
    complexity: "Low",
    plainEnglish: "Buy the property to live in it. BRIX weighs affordability, daily life fit, condition, resale, and downside protection.",
    requiredInputs: ["Purchase price", "Down payment", "Rate", "Taxes", "Insurance", "HOA", "Commute", "Area fit", "Condition", "Resale support"],
    keyMetrics: ["Total monthly payment", "Housing cost comfort", "Cash required", "Area fit", "Resale risk"],
    assumptions: ["The buyer can comfortably carry the full payment", "Daily conveniences and commute fit the household", "Condition risk is acceptable"],
    successCriteria: ["Affordable monthly payment", "Strong location convenience", "Broad resale buyer pool", "Manageable renovation burden"],
    failureScenarios: ["Payment stress", "Traffic or commute friction", "HOA/parking restriction", "Tax or insurance shock", "Condition exceeds tolerance"],
    verification: ["County tax record", "Insurance quote", "HOA rules", "Map/street context", "Inspection", "School/commute/essential services check"],
  },
  {
    id: "buy_and_hold",
    name: "Buy & Hold",
    category: "rental",
    complexity: "Low",
    plainEnglish: "Own long term for income, equity growth, and optionality.",
    requiredInputs: baseRentalVerification,
    keyMetrics: ["NOI", "DSCR", "Cap rate", "Cash-on-cash", "Monthly cash flow", "Equity growth"],
    assumptions: ["Rent is durable", "Expenses are complete", "Debt service is stable", "Reserves are maintained"],
    successCriteria: ["Positive risk-adjusted cash flow", "DSCR above 1.20", "Expense assumptions survive stress", "Tenant demand is broad"],
    failureScenarios: ["Rent overstated", "Insurance/tax shock", "Vacancy", "CapEx surprise", "Debt service consumes cash flow"],
    verification: baseRentalVerification,
  },
  {
    id: "long_term_rental",
    name: "Long-Term Rental",
    category: "rental",
    complexity: "Low",
    plainEnglish: "Lease to long-term tenants with emphasis on stability and predictable operations.",
    requiredInputs: baseRentalVerification,
    keyMetrics: ["Rent coverage", "NOI", "DSCR", "Cash flow", "Operating expense ratio"],
    assumptions: ["Tenant demand is stable", "Rent estimate is supported", "Maintenance burden is manageable"],
    successCriteria: ["Stable lease demand", "Cash flow after reserves", "DSCR above target", "Low turnover friction"],
    failureScenarios: ["Vacancy rises", "Repairs exceed reserves", "Rent is overstated", "Tenant demand weakens"],
    verification: ["Rent comps", "Lease rules", "Taxes", "Insurance", "Inspection", "Utility responsibility"],
  },
  {
    id: "mid_term_rental",
    name: "Mid-Term Rental",
    category: "rental",
    complexity: "Moderate",
    plainEnglish: "Furnished 30+ day rental for medical, corporate, relocation, or insurance housing demand.",
    requiredInputs: ["Furnished rent", "Occupancy", "Furnishing cost", "Utilities", "Cleaning", "Demand drivers", "Regulations"],
    keyMetrics: ["Net furnished income", "Occupancy break-even", "Setup payback", "Demand proximity"],
    assumptions: ["Monthly-stay demand exists", "Furnished premium covers added costs", "Rules allow the use"],
    successCriteria: ["Verified demand driver", "Premium net income", "Legal use", "Reasonable operating burden"],
    failureScenarios: ["Occupancy misses", "Furnishing costs high", "Regulatory issue", "Management burden too high"],
    verification: ["Hospital/employer proximity", "Comparable furnished listings", "Local rules", "Insurance", "Utility costs"],
  },
  {
    id: "short_term_rental",
    name: "Short-Term Rental",
    category: "rental",
    complexity: "High",
    plainEnglish: "Nightly or weekly rental with higher income potential and higher regulatory/operations risk.",
    requiredInputs: ["ADR", "Occupancy", "Seasonality", "Cleaning", "Platform fees", "Furnishing", "STR rules", "Insurance"],
    keyMetrics: ["Net operating income", "Occupancy break-even", "Seasonal downside", "Regulatory risk"],
    assumptions: ["STR is legal", "ADR and occupancy are supported", "Guest operations are controlled"],
    successCriteria: ["Legal clearance", "Strong net income", "Demand resilience", "Professional operations plan"],
    failureScenarios: ["Rule change", "Low season crushes income", "Guest damage", "ADR optimism", "HOA restriction"],
    verification: ["City/HOA STR rules", "Comparable STR performance", "Insurance", "Seasonality", "Cleaning and management costs"],
  },
  {
    id: "hybrid_rental",
    name: "Hybrid Rental",
    category: "rental",
    complexity: "High",
    plainEnglish: "Switch between long-, mid-, or short-term rental modes depending on demand and rules.",
    requiredInputs: ["Fallback LTR rent", "MTR/STR assumptions", "Regulations", "Furnishing costs", "Operating costs"],
    keyMetrics: ["Fallback cash flow", "Upside case", "Mode-switch cost", "Regulatory flexibility"],
    assumptions: ["Multiple rental paths are viable", "Fallback rent protects downside"],
    successCriteria: ["Credible fallback", "Legal flexibility", "Upside after added costs"],
    failureScenarios: ["Both demand channels underperform", "Regulatory restriction", "Operating complexity overwhelms return"],
    verification: ["LTR comps", "Furnished comps", "STR/MTR legality", "Insurance", "Management cost"],
  },
  {
    id: "house_hack",
    name: "House Hack",
    category: "live_in",
    complexity: "Moderate",
    plainEnglish: "Live in part of the property while rent offsets ownership cost.",
    requiredInputs: ["Owner payment", "Rentable unit/room income", "Layout", "Rules", "Financing", "Privacy/lifestyle fit"],
    keyMetrics: ["Net housing cost", "Tenant income coverage", "Cash required", "Life impact"],
    assumptions: ["User accepts tenancy proximity", "Layout supports privacy", "Rental income is legal and achievable"],
    successCriteria: ["Lower net housing cost", "Financeable property", "Good layout", "Vacancy survivability"],
    failureScenarios: ["Tenant vacancy", "Lifestyle stress", "Rules prevent rental", "Unexpected repairs while owner occupied"],
    verification: ["Rent support", "Local rules", "HOA rules", "Layout photos", "Financing terms", "Insurance"],
  },
  {
    id: "brrrr",
    name: "BRRRR",
    category: "renovation",
    complexity: "High",
    plainEnglish: "Buy, renovate, rent, refinance, repeat. The deal depends on forced equity and takeout financing.",
    requiredInputs: ["Purchase price", "Rehab scope", "Rehab budget", "ARV", "Rent", "Refi LTV", "Refi rate", "Timeline"],
    keyMetrics: ["Equity created", "Capital left in deal", "Post-refi DSCR", "Cash-out", "Refi readiness"],
    assumptions: ["ARV is supported", "Scope is controlled", "Refi lender accepts stabilized value", "Rent supports DSCR"],
    successCriteria: ["Meaningful equity spread", "Capital recovery", "Post-refi cash flow", "Controlled rehab"],
    failureScenarios: ["ARV miss", "Rehab overrun", "Refi delay", "Rent too low", "Capital trapped"],
    verification: ["ARV comps", "Itemized bids", "Rent comps", "Lender refi terms", "Inspection", "Permit review"],
  },
  {
    id: "hybrid_brrrr",
    name: "Hybrid BRRRR",
    category: "renovation",
    complexity: "High",
    plainEnglish: "Phased BRRRR with delayed or partial refinance to reduce execution or capital timing risk.",
    requiredInputs: ["Phase-one scope", "Future scope", "Current rent", "Stabilized rent", "ARV", "Refi timing", "Cash runway"],
    keyMetrics: ["Phase ROI", "Capital recovery timeline", "Stabilized DSCR", "Cash runway"],
    assumptions: ["Property can operate during phases", "Value improves after each phase"],
    successCriteria: ["Clear phase gates", "Lower initial capital stress", "Refi optionality"],
    failureScenarios: ["Phase-one scope underestimated", "Tenant disruption", "Refi delay", "Underfunded plan"],
    verification: ["Phase bids", "Rent support", "Refi terms", "Inspection", "Insurance"],
  },
  {
    id: "fix_and_flip",
    name: "Fix & Flip",
    category: "renovation",
    complexity: "High",
    plainEnglish: "Renovate and resell. The strategy depends on ARV, scope control, speed, and market liquidity.",
    requiredInputs: ["Purchase price", "ARV", "Rehab budget", "Carry costs", "Selling costs", "Timeline", "Exit comps"],
    keyMetrics: ["Projected profit", "Profit margin", "ROI", "Carry exposure", "Break-even resale"],
    assumptions: ["ARV comps are valid", "Scope and timeline are controlled", "Market remains liquid"],
    successCriteria: ["Profit survives stress", "Fast resale demand", "Controlled scope", "Permit clarity"],
    failureScenarios: ["ARV miss", "Scope creep", "Permit delay", "Slow resale", "Carrying costs erase profit"],
    verification: ["Sold comps", "Contractor bid", "Permit needs", "Selling costs", "DOM/liquidity"],
  },
  {
    id: "value_add",
    name: "Value Add",
    category: "renovation",
    complexity: "Moderate",
    plainEnglish: "Improve income or value through targeted upgrades, layout, operations, or rent lift.",
    requiredInputs: ["Current income/value", "Post-improvement income/value", "Scope", "Budget", "Timeline"],
    keyMetrics: ["Cost-to-value", "Rent lift", "Payback period", "NOI lift"],
    assumptions: ["Market rewards the improvement", "Budget is controlled", "Disruption is manageable"],
    successCriteria: ["Clear ROI", "Evidence-backed rent/value lift", "Manageable execution"],
    failureScenarios: ["Over-improvement", "Rent lift misses", "Budget overrun", "Tenant disruption"],
    verification: ["Before/after comps", "Scope", "Bid", "Rent support", "Permit review"],
  },
  {
    id: "adu",
    name: "ADU",
    category: "renovation",
    complexity: "High",
    plainEnglish: "Add an accessory dwelling unit to create rental income, resale value, or household flexibility.",
    requiredInputs: ["Zoning", "Permits", "Build cost", "Rent", "Utility access", "Timeline", "Financing"],
    keyMetrics: ["Cost-to-rent", "Cost-to-value", "Permit feasibility", "Payback"],
    assumptions: ["ADU is legal and buildable", "Utilities/site support construction"],
    successCriteria: ["Permit feasibility", "Strong rent/value lift", "Manageable build timeline"],
    failureScenarios: ["Zoning denial", "Utility constraint", "Cost escalation", "Rent/value lift misses"],
    verification: ["Zoning", "Permit office", "Contractor bid", "Rent comps", "Utility review"],
  },
  {
    id: "lot_split",
    name: "Lot Split",
    category: "development",
    complexity: "Expert",
    plainEnglish: "Create value by subdividing land or creating additional buildable parcels.",
    requiredInputs: ["Zoning", "Lot dimensions", "Survey", "Utilities", "Entitlement cost", "Resale demand"],
    keyMetrics: ["Entitlement feasibility", "Residual land value", "Cost-to-value", "Timeline risk"],
    assumptions: ["Subdivision is legally possible", "Utilities and access are feasible"],
    successCriteria: ["Clear entitlement path", "Value exceeds cost/time risk", "Exit demand exists"],
    failureScenarios: ["Subdivision denial", "Utility/access issue", "Survey problem", "Market softens"],
    verification: ["Planner review", "Survey", "Utility review", "Title/easements", "Builder/resale demand"],
    professionalReview: ["Attorney", "Surveyor", "Civil engineer"],
  },
  {
    id: "mixed_use_conversion",
    name: "Mixed Use Conversion",
    category: "development",
    complexity: "Expert",
    plainEnglish: "Reposition a property into a different or mixed use to improve value or income.",
    requiredInputs: ["Zoning", "Code", "Buildout budget", "Demand", "Financing", "Exit value"],
    keyMetrics: ["NOI lift", "Conversion ROI", "Entitlement risk", "Timeline"],
    assumptions: ["Use change is allowed", "Tenant/buyer demand supports conversion"],
    successCriteria: ["Legal conversion path", "Income/value lift exceeds cost", "Financing supports timeline"],
    failureScenarios: ["Code issue", "Permit delay", "Tenant demand misses", "Budget overrun"],
    verification: ["Zoning", "Architect/code review", "Contractor bid", "Market demand", "Financing"],
  },
  {
    id: "commercial_repositioning",
    name: "Commercial Repositioning",
    category: "development",
    complexity: "Expert",
    plainEnglish: "Improve commercial value through lease, tenant, use, physical, or operating repositioning.",
    requiredInputs: ["NOI", "Leases", "Vacancy", "Tenant demand", "CapEx", "Exit cap rate", "Financing"],
    keyMetrics: ["Stabilized NOI", "Exit value", "Debt yield", "Lease-up risk", "CapEx ROI"],
    assumptions: ["Tenant demand exists", "Cap rates support exit", "Lease-up timeline is realistic"],
    successCriteria: ["NOI growth", "Leasing demand", "CapEx discipline", "Financeable exit"],
    failureScenarios: ["Lease-up delay", "Cap rate expansion", "Tenant improvements exceed budget", "Financing gap"],
    verification: ["Leases", "Rent roll", "Market leasing comps", "CapEx bids", "Lender terms"],
  },
  {
    id: "development",
    name: "Development",
    category: "development",
    complexity: "Expert",
    plainEnglish: "Create value through construction or redevelopment. Highest verification and execution burden.",
    requiredInputs: ["Entitlements", "Budget", "Schedule", "Financing", "Exit demand", "Contingency"],
    keyMetrics: ["Yield on cost", "Profit margin", "IRR", "Debt coverage", "Entitlement risk"],
    assumptions: ["Approvals are achievable", "Budget includes contingency", "Demand exists at delivery"],
    successCriteria: ["Approvals clear", "Cost controlled", "Financing complete", "Exit demand survives timeline"],
    failureScenarios: ["Entitlement failure", "Cost escalation", "Financing gap", "Market changes before delivery"],
    verification: ["Planner", "Architect", "GC budget", "Lender", "Market study", "Attorney"],
    professionalReview: ["Attorney", "CPA", "Architect", "Engineer", "Lender"],
  },
  {
    id: "refinance",
    name: "Refinance",
    category: "equity",
    complexity: "Moderate",
    plainEnglish: "Improve debt terms, cash flow, risk, or liquidity through new financing.",
    requiredInputs: ["Current loan", "Current value", "New rate", "New terms", "Closing costs", "DSCR", "Equity"],
    keyMetrics: ["Payment change", "Break-even", "DSCR", "Cash-out", "LTV"],
    assumptions: ["Value supports terms", "Closing costs are justified", "New debt improves risk or strategy"],
    successCriteria: ["Improved cash flow or useful capital", "Acceptable leverage", "DSCR clears lender threshold"],
    failureScenarios: ["Appraisal shortfall", "Higher payment", "Overleverage", "Rate changes before lock"],
    verification: ["Lender quote", "Appraisal/value support", "Loan payoff", "Closing costs", "DSCR"],
  },
  {
    id: "hold",
    name: "Hold",
    category: "exit",
    complexity: "Low",
    plainEnglish: "Keep the property when holding beats selling, refinancing, or redeploying capital.",
    requiredInputs: ["Current performance", "Market outlook", "Debt terms", "Maintenance needs", "Opportunity cost"],
    keyMetrics: ["Cash flow", "Equity", "Risk trend", "Opportunity cost", "Portfolio fit"],
    assumptions: ["Current asset remains competitive", "Risks are manageable"],
    successCriteria: ["Stable or improving performance", "Risk-adjusted return beats alternatives"],
    failureScenarios: ["Deferred capex spike", "Market decline", "Better redeployment missed", "Debt reset risk"],
    verification: ["Current financials", "Maintenance forecast", "Market trend", "Debt review"],
  },
  {
    id: "sell",
    name: "Sell",
    category: "exit",
    complexity: "Moderate",
    plainEnglish: "Exit when risk, opportunity cost, timing, or portfolio fit favors disposition.",
    requiredInputs: ["Current value", "Loan payoff", "Selling costs", "Tax impact", "Redeployment options", "Market liquidity"],
    keyMetrics: ["Net proceeds", "After-tax proceeds", "Redeployment return", "Risk reduction"],
    assumptions: ["Net proceeds can be redeployed better", "Market supports sale"],
    successCriteria: ["Clear proceeds", "Better capital use", "Risk reduction or strategic upgrade"],
    failureScenarios: ["Low sale price", "Tax surprise", "No better redeployment", "Transaction costs too high"],
    verification: ["Broker opinion", "Sold comps", "Loan payoff", "CPA/tax review", "Redeployment plan"],
    professionalReview: ["CPA", "Attorney"],
  },
  {
    id: "seller_finance",
    name: "Seller Finance",
    category: "financing",
    complexity: "High",
    plainEnglish: "Acquire using seller-provided financing. Terms and legal documentation drive viability.",
    requiredInputs: ["Seller note terms", "Down payment", "Rate", "Amortization", "Balloon", "Default terms", "Legal docs"],
    keyMetrics: ["Payment", "Cash flow after note", "Balloon risk", "Term advantage"],
    assumptions: ["Terms improve feasibility", "Legal structure is enforceable", "Balloon/refi risk is manageable"],
    successCriteria: ["Better terms than market debt", "Clear documents", "Payment fits cash flow", "Exit plan"],
    failureScenarios: ["Balloon cannot refinance", "Ambiguous docs", "Payment exceeds cash flow", "Seller dispute"],
    verification: ["Attorney review", "Note terms", "Title", "Insurance", "Exit/refi plan"],
    professionalReview: ["Attorney", "CPA"],
  },
  {
    id: "subject_to",
    name: "Subject-To",
    category: "financing",
    complexity: "Expert",
    plainEnglish: "Acquire subject to existing debt. High legal, lender, insurance, and seller-liability risk.",
    requiredInputs: ["Existing loan", "Payment status", "Due-on-sale risk", "Insurance", "Title", "Legal structure"],
    keyMetrics: ["Existing payment", "Equity", "Due-on-sale exposure", "Cash flow"],
    assumptions: ["Existing debt can be serviced", "Legal risks are understood"],
    successCriteria: ["Attractive existing debt", "Professional legal review", "Payment control", "Clear exit"],
    failureScenarios: ["Due-on-sale acceleration", "Seller dispute", "Insurance/title issue", "Payment default"],
    verification: ["Attorney", "Loan statement", "Insurance", "Title", "Seller disclosures"],
    professionalReview: ["Attorney", "Insurance agent"],
  },
  {
    id: "lease_option",
    name: "Lease Option",
    category: "financing",
    complexity: "High",
    plainEnglish: "Control property through a lease plus purchase option.",
    requiredInputs: ["Lease terms", "Option price", "Option fee", "Term length", "Maintenance duty", "Exit financing"],
    keyMetrics: ["Option spread", "Monthly carry", "Exercise feasibility", "Downside loss"],
    assumptions: ["Option is enforceable", "Exit financing is plausible", "Control period is long enough"],
    successCriteria: ["Low upfront risk", "Clear option upside", "Protective contract terms"],
    failureScenarios: ["Cannot exercise", "Repair burden high", "Value does not rise", "Contract ambiguity"],
    verification: ["Attorney", "Option agreement", "Financing exit", "Condition"],
    professionalReview: ["Attorney"],
  },
  {
    id: "wrap_mortgage",
    name: "Wrap Mortgage",
    category: "financing",
    complexity: "Expert",
    plainEnglish: "Seller-financed wrap around existing debt. Elevated legal and servicing risk.",
    requiredInputs: ["Underlying loan", "Wrap terms", "Payment spread", "Due-on-sale risk", "Default remedies"],
    keyMetrics: ["Payment spread", "Underlying payment coverage", "Default exposure"],
    assumptions: ["Payment spread compensates risk", "Underlying loan remains current"],
    successCriteria: ["Clear spread", "Documented controls", "Legal review", "Manageable default risk"],
    failureScenarios: ["Underlying default", "Due-on-sale issue", "Payment dispute", "Lien ambiguity"],
    verification: ["Attorney", "Loan terms", "Servicing controls", "Title", "Insurance"],
    professionalReview: ["Attorney"],
  },
  {
    id: "assumable_financing",
    name: "Assumable Financing",
    category: "financing",
    complexity: "Moderate",
    plainEnglish: "Assume an existing loan when its terms are better than market.",
    requiredInputs: ["Loan assumability", "Balance", "Rate", "Payment", "Assumption fee", "Gap capital"],
    keyMetrics: ["Payment advantage", "Cash gap", "LTV", "Approval risk"],
    assumptions: ["Loan is assumable", "Buyer qualifies", "Cash gap can be funded"],
    successCriteria: ["Below-market debt", "Affordable cash gap", "Lender approval"],
    failureScenarios: ["Assumption denied", "Cash gap too high", "Property overpaid for debt terms"],
    verification: ["Lender assumption package", "Loan statement", "Approval timeline", "Cash gap"],
  },
  {
    id: "private_money",
    name: "Private Money",
    category: "financing",
    complexity: "High",
    plainEnglish: "Use private capital for acquisition, rehab, bridge, or speed.",
    requiredInputs: ["Rate", "Points", "Term", "Collateral", "Exit", "Investor terms"],
    keyMetrics: ["Cost of capital", "Carry cost", "Exit feasibility", "Profit after financing"],
    assumptions: ["Private debt speed/terms justify cost", "Exit is clear"],
    successCriteria: ["Fast execution", "Profit survives high capital cost", "Exit before maturity"],
    failureScenarios: ["Exit delay", "Carry cost crushes returns", "Relationship/legal dispute"],
    verification: ["Loan agreement", "Exit/refi terms", "Attorney review", "Budget"],
    professionalReview: ["Attorney"],
  },
  {
    id: "hard_money",
    name: "Hard Money",
    category: "financing",
    complexity: "High",
    plainEnglish: "Use short-term asset-based debt, usually for renovation or bridge strategies.",
    requiredInputs: ["Rate", "Points", "Draw schedule", "Term", "ARV", "Rehab budget", "Exit"],
    keyMetrics: ["Monthly carry", "Total finance cost", "ARV/LTC", "Exit timeline"],
    assumptions: ["Speed matters", "Exit happens before maturity", "Budget is controlled"],
    successCriteria: ["Profit survives fees", "Draws fund work", "Exit before maturity"],
    failureScenarios: ["Timeline slips", "Draw issue", "ARV miss", "Extension fees"],
    verification: ["Lender term sheet", "Draw schedule", "Contractor bid", "ARV comps"],
  },
  {
    id: "dscr_financing",
    name: "DSCR Financing",
    category: "financing",
    complexity: "Moderate",
    plainEnglish: "Use rental income coverage rather than personal DTI as the loan driver.",
    requiredInputs: ["Rent", "Taxes", "Insurance", "HOA", "Rate", "Loan amount", "Lender DSCR threshold"],
    keyMetrics: ["DSCR", "Loan proceeds", "Cash flow after debt", "Rate sensitivity"],
    assumptions: ["Market rent is accepted by lender", "Expenses are complete"],
    successCriteria: ["DSCR clears lender threshold", "Cash flow survives stress", "Terms fit strategy"],
    failureScenarios: ["Rent not accepted", "DSCR shortfall", "Rate shift", "Insurance/tax shock"],
    verification: ["Lender quote", "Rent schedule/appraisal", "Tax/insurance", "HOA"],
  },
  {
    id: "cash_out_refinance",
    name: "Cash-Out Refinance",
    category: "equity",
    complexity: "Moderate",
    plainEnglish: "Extract equity while keeping the property.",
    requiredInputs: ["Value", "Loan balance", "New LTV", "Rate", "Closing costs", "Use of proceeds"],
    keyMetrics: ["Cash out", "New payment", "DSCR", "LTV", "Reserve impact"],
    assumptions: ["Value supports cash-out", "New debt remains safe"],
    successCriteria: ["Useful capital without overleverage", "DSCR remains safe", "Clear redeployment plan"],
    failureScenarios: ["Appraisal shortfall", "Overleverage", "Cash flow worsens", "No productive use of proceeds"],
    verification: ["Appraisal/value", "Lender quote", "Use-of-proceeds plan", "Reserve policy"],
  },
  {
    id: "equity_redeployment",
    name: "Equity Redeployment",
    category: "equity",
    complexity: "Moderate",
    plainEnglish: "Move capital from lower-return or higher-risk assets into better uses.",
    requiredInputs: ["Available equity", "Current return", "New opportunity return", "Tax/transaction costs", "Risk change"],
    keyMetrics: ["Incremental return", "Liquidity impact", "Risk-adjusted return", "Opportunity cost"],
    assumptions: ["New use beats current risk-adjusted return", "Costs do not erase benefit"],
    successCriteria: ["Better capital productivity", "Risk improves or is compensated", "Liquidity preserved"],
    failureScenarios: ["New deal underperforms", "Tax/cost drag", "Liquidity stress"],
    verification: ["Current asset review", "New deal underwriting", "CPA/tax", "Liquidity plan"],
  },
  {
    id: "portfolio_refinance",
    name: "Portfolio Refinance",
    category: "equity",
    complexity: "High",
    plainEnglish: "Refinance multiple assets to improve debt, liquidity, or capital allocation.",
    requiredInputs: ["Asset values", "Loan balances", "Portfolio NOI", "New terms", "Costs", "Concentration risk"],
    keyMetrics: ["Portfolio DSCR", "Weighted rate", "Cash out", "Debt maturity risk", "Liquidity"],
    assumptions: ["Portfolio collateral supports terms", "Debt restructuring improves risk or capital"],
    successCriteria: ["Lower risk or better capital access", "Portfolio DSCR safe", "Maturities managed"],
    failureScenarios: ["Cross-collateral risk", "DSCR miss", "Appraisal gaps", "Liquidity trap"],
    verification: ["Lender package", "Rent roll", "Financials", "Appraisals", "Legal review"],
  },
  {
    id: "exchange_1031",
    name: "1031 Exchange",
    category: "tax",
    complexity: "Expert",
    plainEnglish: "Tax-deferred exchange from relinquished property into replacement property.",
    requiredInputs: ["Sale price", "Basis", "Debt", "Replacement value", "Deadlines", "Qualified intermediary"],
    keyMetrics: ["Equity to replace", "Debt replacement", "Boot risk", "Deadline risk"],
    assumptions: ["Exchange rules are followed", "Replacement improves strategy"],
    successCriteria: ["QI engaged", "Deadlines met", "Boot avoided or accepted", "Replacement fits portfolio"],
    failureScenarios: ["Missed deadline", "Boot surprise", "Bad replacement just to defer tax", "Debt mismatch"],
    verification: ["QI", "CPA", "Attorney", "Exchange timeline", "Replacement underwriting"],
    professionalReview: ["CPA", "Attorney", "Qualified intermediary"],
  },
  {
    id: "installment_sale",
    name: "Installment Sale",
    category: "tax",
    complexity: "High",
    plainEnglish: "Sell with payments over time, potentially spreading tax and creating note income.",
    requiredInputs: ["Sale price", "Down payment", "Note terms", "Buyer credit", "Collateral", "Tax basis"],
    keyMetrics: ["Note yield", "Default exposure", "Tax timing", "Collateral coverage"],
    assumptions: ["Buyer pays reliably", "Collateral protects seller", "Tax treatment is understood"],
    successCriteria: ["Strong note terms", "Buyer creditworthy", "Collateral sufficient", "CPA review"],
    failureScenarios: ["Buyer default", "Collateral loss", "Tax surprise", "Liquidity need"],
    verification: ["CPA", "Attorney", "Buyer underwriting", "Note/security docs"],
    professionalReview: ["CPA", "Attorney"],
  },
  {
    id: "cost_segregation",
    name: "Cost Segregation",
    category: "tax",
    complexity: "High",
    plainEnglish: "Accelerate depreciation deductions through engineering/accounting study.",
    requiredInputs: ["Purchase price", "Building basis", "Use type", "Hold period", "Tax appetite", "Study cost"],
    keyMetrics: ["Depreciation acceleration", "Tax savings", "Recapture risk", "Payback"],
    assumptions: ["User can use tax benefits", "Hold period supports study economics"],
    successCriteria: ["Tax benefit exceeds cost", "CPA alignment", "Recapture understood"],
    failureScenarios: ["No tax appetite", "Short hold recapture", "Study not worth cost"],
    verification: ["CPA", "Cost seg provider", "Closing allocation", "Tax plan"],
    professionalReview: ["CPA"],
  },
  {
    id: "joint_venture",
    name: "Joint Venture",
    category: "financing",
    complexity: "High",
    plainEnglish: "Partner with another party to combine capital, operations, or expertise.",
    requiredInputs: ["Roles", "Capital", "Decision rights", "Profit split", "Exit", "Legal agreement"],
    keyMetrics: ["Partner economics", "Control rights", "Risk allocation", "Promote/split"],
    assumptions: ["Roles are clear", "Incentives align", "Legal documents protect parties"],
    successCriteria: ["Clear operating agreement", "Aligned incentives", "Transparent reporting", "Defined exit"],
    failureScenarios: ["Partner conflict", "Capital calls", "Ambiguous control", "Exit dispute"],
    verification: ["Attorney", "Partner diligence", "Operating agreement", "Capital plan"],
    professionalReview: ["Attorney", "CPA"],
  },
  {
    id: "equity_partner",
    name: "Equity Partner",
    category: "financing",
    complexity: "High",
    plainEnglish: "Use partner equity to fund acquisition or project capital.",
    requiredInputs: ["Contribution", "Ownership", "Preferred return", "Control", "Reporting", "Exit"],
    keyMetrics: ["Investor return", "Sponsor return", "Dilution", "Capital coverage"],
    assumptions: ["Equity cost is justified", "Partner expectations are clear"],
    successCriteria: ["Enough capital", "Fair risk split", "Defined reporting and exit"],
    failureScenarios: ["Return mismatch", "Control dispute", "Capital shortfall", "Reporting breakdown"],
    verification: ["Attorney", "CPA", "Operating agreement", "Capital plan"],
    professionalReview: ["Attorney", "CPA"],
  },
  {
    id: "waterfall_partnership",
    name: "Waterfall Partnership",
    category: "financing",
    complexity: "Expert",
    plainEnglish: "Model preferred returns, promotes, and profit splits across capital partners.",
    requiredInputs: ["Capital stack", "Preferred return", "Promote", "Profit split", "Timing", "Exit"],
    keyMetrics: ["LP return", "GP promote", "IRR", "Equity multiple", "Distribution timing"],
    assumptions: ["Waterfall is legally documented", "Returns support promised structure"],
    successCriteria: ["Transparent economics", "Aligned incentives", "Returns survive stress"],
    failureScenarios: ["Returns miss pref", "Dispute over promote", "Complexity hides risk"],
    verification: ["Attorney", "CPA", "Waterfall model", "Investor disclosures"],
    professionalReview: ["Attorney", "CPA"],
  },
];

export function getStrategy(idOrName: string | null | undefined) {
  const normalized = normalizeStrategy(idOrName);
  return strategyCatalog.find((strategy) => strategy.id === normalized || normalizeStrategy(strategy.name) === normalized);
}

export function normalizeStrategy(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") as StrategyId;
}
