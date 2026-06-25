// Centralized help content for tooltips and Help Center

export const DEAL_INPUT_HELP = {
  purchase_price: "The total acquisition price of the property before closing costs or rehab.",
  rehab_cost: "Estimated cost of all renovations and repairs needed to bring the property to target condition.",
  monthly_rent: "Projected gross monthly rental income from all units.",
  taxes: "Annual property taxes. These are treated as an operating expense in cash flow calculations.",
  insurance: "Annual property insurance premium.",
  arv: "After Repair Value - the estimated market value of the property after all renovations are complete.",
  vacancy_percent: "Expected percentage of time the property will be vacant annually. Use conservative assumptions when data is weak.",
  maintenance_percent: "Annual maintenance costs as a percentage of gross rent. Reserves protect the investment when repairs arrive.",
  management_percent: "Property management fees as a percentage of gross rent. Include this even if you self-manage so the deal is not overstated.",
  capex_percent: "Capital expenditure reserve for major repairs such as roof, HVAC, appliances, flooring, and exterior systems.",
  closing_costs: "One-time costs at purchase including title, escrow, inspections, lender fees, and other closing expenses.",
  down_payment_percent: "Percentage of purchase price paid as equity at closing.",
  interest_rate: "Annual mortgage interest rate for the loan.",
  loan_term_years: "Length of the mortgage in years.",
  other_income: "Additional annual income from sources like laundry, parking, storage, pet rent, or utility reimbursements.",
} as const;

export const METRIC_HELP = {
  cap_rate: "Capitalization Rate - Net Operating Income divided by purchase price. Measures property return independent of financing. Compare it to local market norms.",
  cash_on_cash: "Cash-on-Cash Return - Annual pre-tax cash flow divided by total cash invested. Measures return on your actual cash outlay.",
  monthly_cashflow: "Monthly Cash Flow - Net income after all expenses, vacancy, reserves, and debt service. Positive cash flow means the property produces income beyond modeled costs.",
  dscr: "Debt Service Coverage Ratio - NOI divided by annual debt payments. Above 1.25 is generally stronger; below 1.0 means income does not cover debt service.",
  roi: "Return on Investment - Total modeled return including cash flow and equity gains, relative to cash invested.",
} as const;

export const STRATEGY_HELP = "Strategy fit signals show how well a property aligns with acquisition approaches such as buy and hold, BRRRR, flip, house hack, refinance, seller finance, or disposition. They are directional decision signals, not guarantees.";

export const MARKET_HELP = "Market conditions reflect local demand indicators, rent trends, price movements, and inventory pressure. These signals provide context for your deal but should be combined with local verification.";

export const CRIME_HELP = "The crime score is a relative location-risk signal. It is not a prediction of future events. Use it as one factor among many when evaluating area risk.";

export const HELP_CENTER_SECTIONS = [
  {
    id: "getting-started",
    title: "Start Here: BRIX in 10 Minutes",
    content: [
      "BRIX is built to feel simple even when the decision is complex. You do not need to master every module on day one. Start with one question: what should I do next?",
      "The basic flow is simple: find the address, build the deal file, analyze the deal and contract, record the win or loss, and learn from the outcome.",
      "The fastest workflow is FindIQ to DealIQ to PipelineIQ. FindIQ helps you identify what deserves attention, DealIQ tests whether the property should be acquired, and PipelineIQ keeps the next action and outcome visible.",
      "Every major recommendation shows the reason, evidence, confidence, risks, missing information, alternatives, and next actions. BRIX is intentionally conservative when data is weak.",
      "You can use BRIX for any legal real estate strategy: long-term rental, mid-term rental, short-term rental, house hack, BRRRR, flip, seller finance, subject-to, ADU, lot split, refinance, sell, hold, development, and portfolio optimization.",
    ],
  },
  {
    id: "simple-accurate",
    title: "How BRIX Stays Simple and Accurate",
    content: [
      "Simple does not mean shallow. BRIX separates the work into plain questions: what address should I investigate, what is the real deal file, should I acquire it, how should I pursue it, did I win or lose, and what can I learn?",
      "Accurate means traceable. Inputs are labeled as verified, source-backed, corroborated, estimated, user-entered, or missing whenever possible.",
      "BRIX never treats estimates as facts. If rent, insurance, taxes, rehab, comps, or financing are missing or weak, confidence goes down and verification tasks become the next step.",
      "Use the confidence score as a decision-quality signal, not as a promise. A high score means the current recommendation is better supported by available evidence; it does not guarantee returns, appreciation, rent, occupancy, or resale.",
    ],
  },
  {
    id: "module-map",
    title: "The Five Core Modules",
    content: [
      "FindIQ answers: what should I investigate? Create an acquisition profile, review ranked opportunity cards, save or hide properties, compare candidates, and send the best candidates into DealIQ.",
      "DealIQ answers: should I acquire it? It runs financial, rent, resale, renovation, risk, market, scenario, and strategy analysis, then produces an acquisition recommendation with confidence and next actions.",
      "PipelineIQ answers: where is it in the process? It turns opportunities into a clear deal workflow with stages, tasks, deadlines, health scores, notes, activity history, and outcome records.",
      "OfferIQ answers: how should I pursue it? It turns DealIQ findings into offer strategy, document packages, communication drafts, counteroffer logic, diligence checklists, and transaction timelines.",
      "PortfolioIQ answers: how is it performing and what did we learn? After closing, it tracks asset value, equity, debt, income, expenses, cash flow, performance, risk, refinance opportunities, sell/hold logic, and portfolio-level health. Won, lost, and passed deal patterns should inform future searches.",
    ],
  },
  {
    id: "strategy-training",
    title: "Strategy Training: Use BRIX for Any Play",
    content: [
      "Buy and Hold: focus on rent support, vacancy, DSCR, cash flow, reserves, insurance, tax load, tenant demand, and long-term market quality.",
      "BRRRR: verify purchase discount, rehab scope, ARV, refinance value, lender requirements, seasoning, reserves, and whether the stress case still protects capital.",
      "Flip: test purchase price plus rehab plus holding costs against conservative resale value, selling costs, days on market, contractor risk, and downside price pressure.",
      "House Hack: evaluate both financial outcomes and life outcomes: monthly payment reduction, privacy, tenant fit, mobility, stress, and exit options.",
      "Seller Finance, Subject-To, Lease Option, and Wrap: treat these as advanced strategies. BRIX can model them, but legal, financing, title, insurance, and professional review matter more than projected return.",
      "Refinance, Sell, or Hold: compare opportunity cost. BRIX should show what you gain, what you give up, what risks remain, and what must be true for each path to win.",
    ],
  },
  {
    id: "scenario-training",
    title: "Scenario and Risk Training",
    content: [
      "Every deal should be reviewed under base, conservative, and stress cases. A deal that only works in the best case is not decision-ready.",
      "Sensitivity checks show which assumptions matter most: lower rent, higher vacancy, higher insurance, higher taxes, higher rehab costs, delayed refinance, slower resale, or weaker appreciation.",
      "The risk view is meant to slow you down before capital is exposed. Review financial risk, property risk, market risk, execution risk, insurance risk, legal/tax risk, and strategy risk.",
      "When BRIX says investigate further, that is not a failure. It means the smartest decision is to verify before committing.",
    ],
  },
  {
    id: "field-work",
    title: "Field Training: Photos, Notes, and Documents",
    content: [
      "Use Field Capture during showings, inspections, drive-bys, renovation walks, and due diligence. Photos, screenshots, notes, and documents should attach to the property record instead of living in scattered folders.",
      "Visual findings are decision support, not inspection conclusions. BRIX may flag roof concerns, water indicators, safety concerns, cosmetic updates, value-add opportunities, or scope items, but professionals verify reality.",
      "For best results, capture each major area clearly: exterior, roof line, foundation, mechanicals, kitchen, bathrooms, bedrooms, living areas, garage, site drainage, electrical panels, HVAC, plumbing, and visible defects.",
      "Voice notes should be short and specific. Example: master bathroom needs full remodel, roof age unknown, ask carrier about insurability, verify rental comps before offer.",
    ],
  },
  {
    id: "acquisition-playbook",
    title: "Recommended Acquisition Workflow",
    content: [
      "1. Create an acquisition profile with budget, markets, property type, bed/bath minimums, tax preferences, goals, strategy, risk profile, and hold period.",
      "2. Review FindIQ opportunities and ask why each one is being surfaced. Save strong candidates, hide poor fits, and compare similar deals side by side.",
      "3. Send promising opportunities to DealIQ. Do not re-enter data BRIX already knows; review the imported facts and mark weak assumptions for verification.",
      "4. Read the recommendation like an investment memo: decision, why, confidence, risks, missing information, bull case, bear case, what must be true, failure scenarios, and next actions.",
      "5. Move active opportunities into PipelineIQ. Assign tasks, watch deadlines, keep notes, and record whether the deal was won, lost, passed, or closed.",
      "6. If the deal is worth pursuing, activate OfferIQ. Generate offer structures, negotiation points, communication drafts, and due diligence tasks based on DealIQ evidence.",
      "7. After closing, transfer the asset into PortfolioIQ. Track equity, cash flow, documents, maintenance, refinance opportunities, risk, long-term performance, and the deal characteristics that led to the outcome.",
    ],
  },
  {
    id: "common-mistakes",
    title: "Common Mistakes BRIX Helps Prevent",
    content: [
      "Do not use optimistic rent, low vacancy, low insurance, low maintenance, and high appreciation at the same time. That creates false confidence.",
      "Do not skip reserves. Even a strong deal can become fragile when HVAC, roof, tenant turnover, insurance, or repairs hit at the wrong time.",
      "Do not treat a high projected return as a buy signal. Complexity, liquidity, execution risk, legal risk, financing risk, and life impact can make a high-return deal a poor decision.",
      "Do not rely on a single comp, a single contractor number, or a single rent estimate. More sources improve confidence; conflicting sources lower confidence.",
      "Do not move forward because a property is exciting. BRIX is designed to protect decision quality, not chase deal volume.",
    ],
  },
  {
    id: "terms",
    title: "Core Terms in Plain English",
    content: [
      "NOI: income after operating expenses, before debt service. It shows how the property performs before financing.",
      "DSCR: income available to cover debt payments. A higher DSCR usually means more financing cushion.",
      "Cap Rate: NOI divided by price. It compares property income yield without financing effects.",
      "Cash-on-Cash Return: annual cash flow divided by cash invested. It tells you how your actual dollars are working.",
      "ARV: after repair value. This should be verified with conservative comparable sales, not guessed.",
      "Decision Readiness: whether enough information exists to make a high-quality decision. Low readiness means verify more before acting.",
      "Trust Score: how well the recommendation is supported by data quality, verification, assumption quality, analysis confidence, and outcome confidence.",
    ],
  },
  {
    id: "reports",
    title: "Reports, Memos, and Exports",
    content: [
      "Acquisition memos summarize the decision in a format you can review with partners, lenders, agents, or your own future self.",
      "Reports should include the recommendation, evidence, assumptions, calculations, confidence, risks, missing information, alternative strategies, and next actions.",
      "Use exports when you need to review raw numbers, preserve an audit trail, or compare deals outside the app.",
      "A good report should not just make the deal look good. It should make the decision easier to challenge.",
    ],
  },
  {
    id: "billing",
    title: "Plans, Access, and Account Help",
    content: [
      "The admin console tracks free access, paid plans, cancellations, account deletes, signups, revenue, and usage KPIs so support and business health stay visible.",
      "If your account has a free override, you can continue using premium workflows without an active paid subscription until the override is removed.",
      "Password resets are handled through the account flow. If sign-in fails, use Forgot Password or contact support so your account can be verified safely.",
      "Account deletion should remove or anonymize user-owned data according to the app privacy policy and Apple compliance requirements where applicable.",
    ],
  },
] as const;
