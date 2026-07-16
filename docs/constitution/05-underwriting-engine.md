# Section 5 — Deterministic Underwriting Engine

## Authority

This section is part of the governing BRIX Product Constitution and Engineering Standard. It defines the authoritative financial analysis system for every property, strategy, scenario, report, spreadsheet, recommendation, web experience, native iOS experience, and future platform client.

No client, report generator, AI workflow, administrative tool, or strategy module may maintain a competing calculation engine. Later sections may extend strategy-specific formulas, but they must conform to the rules established here.

---

## 5.1 Purpose

The BRIX Underwriting Engine converts property facts, financing terms, operating assumptions, market inputs, strategy rules, and user targets into reproducible financial outputs.

Its purpose is to provide one deterministic source of financial truth that is:

- accurate
- transparent
- versioned
- testable
- explainable
- scenario-aware
- property-type aware
- strategy-aware
- jurisdiction-aware where applicable
- consistent across web, iPhone, iPad, reports, exports, and API responses

The engine must help the investor answer:

> What does this opportunity produce, what capital does it require, what could change the outcome, and what price or terms make the strategy acceptable?

The Underwriting Engine does not decide whether an investor should buy a property. It produces the financial foundation used by the Strategy Engine, Decision Engine, OfferIQ, ReportIQ, portfolio analytics, and investor review.

---

## 5.2 Governing Principles

### 5.2.1 One Financial Truth

Each underwriting run must be derived from one canonical input snapshot and one versioned engine release.

The same snapshot and engine version must produce the same outputs regardless of which client requests the calculation.

The web application, native iOS application, reports, spreadsheets, exports, admin tools, and AI explanations must consume the same authoritative underwriting result.

### 5.2.2 AI Never Calculates Authoritative Financial Results

Artificial intelligence may explain, summarize, compare, and identify missing inputs.

Artificial intelligence may not become the authoritative source of:

- purchase costs
- loan payments
- debt service
- net operating income
- cash flow
- cap rate
- cash-on-cash return
- debt service coverage ratio
- internal rate of return
- net present value
- equity multiple
- return on cost
- development yield
- break-even occupancy
- refinance proceeds
- maximum offer
- sensitivity outputs
- scenario outputs
- strategy ranking inputs

All authoritative financial outputs must come from deterministic code.

### 5.2.3 Visible Assumptions

Every material calculated result must be traceable to visible inputs.

The investor must be able to distinguish:

- confirmed facts
- user-entered facts
- external estimates
- system estimates
- user assumptions
- calculated values
- missing values
- conflicting values

No hidden assumption may materially change a recommendation.

### 5.2.4 Precision Without False Precision

The engine must preserve sufficient numerical precision internally and round only for defined output purposes.

The system must not display false precision when the underlying inputs are estimates.

A rent estimate based on weak evidence should not be presented with the same implied certainty as a signed lease schedule.

### 5.2.5 Useful Preliminary Analysis

BRIX should produce a responsible preliminary underwriting when complete information is unavailable.

The engine may use transparent defaults, ranges, or estimates when appropriate, but it must:

- label them clearly
- reduce confidence appropriately
- show their effect on results
- identify which missing inputs are decision-changing
- prevent misleading conclusions when uncertainty is too material

### 5.2.6 Property and Strategy Specificity

The engine must not force residential assumptions onto commercial, multifamily, mixed-use, land, development, hospitality, self-storage, mobile-home park, RV park, industrial, or specialized assets.

Each strategy and property type must define its own required inputs, optional inputs, formulas, outputs, risks, and validation rules.

---

## 5.3 Calculation Architecture

The Underwriting Engine must be implemented as a deterministic domain service independent of presentation clients.

The engine should be logically divided into the following layers:

1. Input normalization
2. Input validation
3. Property and strategy compatibility
4. Acquisition cost calculation
5. Financing calculation
6. Operating calculation
7. Renovation or development calculation
8. Holding-period projection
9. Exit calculation
10. Return calculation
11. Sensitivity calculation
12. Scenario calculation
13. Threshold evaluation
14. Explainability metadata
15. Result persistence

The engine must accept a complete immutable underwriting snapshot and return an immutable result object.

Clients must not reproduce formulas locally.

---

## 5.4 Canonical Underwriting Snapshot

Every underwriting run must reference a versioned snapshot containing the exact inputs used at calculation time.

The snapshot must include, where applicable:

### Identity

- underwriting snapshot ID
- deal ID
- property ID
- portfolio or package ID
- strategy ID
- scenario ID
- engine version
- calculation timestamp
- currency
- measurement system
- jurisdiction

### Property Inputs

- property type
- unit count
- square footage
- lot size
- rentable area
- occupancy
- tenant count
- lease structure
- current use
- intended use
- year built
- condition
- zoning classification
- association status
- parcel count
- building count

### Acquisition Inputs

- asking price
- proposed purchase price
- earnest money
- option fee
- inspection fee
- appraisal fee
- lender fees
- legal fees
- title fees
- recording fees
- transfer taxes
- survey costs
- environmental costs
- due diligence costs
- closing credits
- seller concessions
- prepaid taxes
- prepaid insurance
- initial reserves
- other acquisition costs

### Financing Inputs

- financing type
- lender
- loan amount
- loan-to-value ratio
- loan-to-cost ratio
- interest rate
- rate type
- index
- margin
- interest-only period
- amortization period
- loan term
- balloon date
- points
- origination fee
- underwriting fee
- appraisal fee
- lender legal fee
- commitment fee
- exit fee
- prepayment penalty
- minimum interest
- recourse status
- debt service reserve
- replacement reserve requirement
- escrow requirement
- personal guarantee
- covenant thresholds
- secondary financing
- seller financing
- assumed debt
- subject-to terms
- construction draws
- retainage
- conversion conditions

### Income Inputs

- current rent roll
- market rent
- scheduled rent
- concessions
- vacancy
- credit loss
- bad debt
- reimbursements
- parking income
- storage income
- laundry income
- utility income
- percentage rent
- common-area maintenance recovery
- tax recovery
- insurance recovery
- short-term-rental nightly rate
- occupancy rate
- ancillary income
- other income

### Expense Inputs

- property taxes
- insurance
- utilities
- repairs and maintenance
- property management
- payroll
- landscaping
- snow removal
- pest control
- trash
- janitorial
- security
- legal and accounting
- marketing
- leasing commissions
- tenant improvements
- replacement reserves
- capital reserves
- association dues
- ground rent
- franchise fees
- licensing fees
- platform fees
- short-term-rental cleaning
- supplies
- owner-paid utilities
- administrative costs
- other operating expenses

### Renovation and Development Inputs

- acquisition condition
- renovation scope
- hard costs
- soft costs
- contingency
- permit costs
- design costs
- architecture
- engineering
- environmental remediation
- demolition
- site work
- utility work
- impact fees
- development fees
- construction interest
- developer fee
- construction period
- lease-up period
- absorption rate
- stabilization date
- construction draws
- retainage
- completion guarantees
- cost escalation

### Exit Inputs

- holding period
- exit value method
- exit cap rate
- exit price
- appreciation rate
- selling costs
- brokerage commission
- disposition fees
- loan payoff
- prepayment penalty
- tax assumptions if modeled
- refinance date
- refinance value
- refinance loan-to-value
- refinance costs
- terminal reserves

### Investor Targets

- target cash flow
- target cap rate
- target cash-on-cash return
- target DSCR
- target IRR
- target equity multiple
- maximum cash requirement
- maximum renovation budget
- maximum purchase price
- minimum margin of safety
- risk tolerance
- hold-period preference

Every input must preserve its value classification, source, confidence, effective date, and user override history.

---

## 5.5 Input Normalization

Before any formula is executed, the engine must normalize inputs into canonical units and structures.

Normalization must include:

- currency conversion only when explicitly supported and source-dated
- annual versus monthly normalization
- percentage normalization
- unit count normalization
- square-foot and square-meter normalization
- decimal precision normalization
- sign convention normalization
- date normalization
- amortization and term normalization
- rent-period normalization
- vacancy normalization
- expense-period normalization

The engine must never infer a unit silently when ambiguity could materially alter the result.

Examples:

- A value of `5` may not be assumed to mean 5 percent without a defined field contract.
- A rent amount may not be assumed monthly when the source could be weekly or annual.
- A loan term may not be treated as amortization.
- A property tax value may not be treated as annual when the source is monthly.

---

## 5.6 Validation and Error Severity

Validation must occur before calculation and again before persistence.

Validation results must be classified as:

### Blocking Error

The engine cannot proceed without creating a materially misleading result.

Examples:

- purchase price is missing for a purchase strategy
- loan amount is negative
- amortization is zero for an amortizing loan
- holding period is negative
- unit count is zero for a per-unit analysis
- required development cost is missing

### Material Warning

The engine may proceed, but the output requires caution.

Examples:

- property taxes are estimated
- insurance is based on a market default
- market rent is unsupported by comparable evidence
- exit cap rate is assumed
- renovation contingency is below policy guidance
- lender terms are incomplete

### Informational Notice

The engine may proceed and the issue is unlikely to materially distort the result.

Examples:

- a nonmaterial optional income category is blank
- a source date is older than preferred but still usable
- a secondary label is missing

Validation messages must explain:

- what is wrong
- why it matters
- whether calculation can continue
- how confidence is affected
- how the user can correct or verify it

---

## 5.7 Core Acquisition Calculations

The engine must calculate acquisition requirements consistently.

### Total Acquisition Cost

Total acquisition cost includes:

- purchase price
- closing costs
- lender costs
- due diligence costs
- immediate repairs
- initial reserves
- prepaid items
- other required acquisition outlays
- less seller credits and other valid offsets

### Total Project Cost

For renovation and development strategies, total project cost includes:

- acquisition cost
- hard costs
- soft costs
- financing costs
- contingency
- carrying costs
- lease-up costs
- stabilization costs
- other project-specific costs

### Total Cash Required

Total cash required must include all investor-funded amounts through the defined point in the strategy.

The engine must distinguish:

- cash due at contract
- cash due at closing
- cash required during renovation or construction
- reserves
- future capital calls
- reimbursable costs
- financed costs

The system must not report down payment as total cash required.

---

## 5.8 Financing Engine

The financing engine must support multiple financing structures without collapsing them into one simplified loan model.

Supported structures should include, where applicable:

- cash purchase
- conventional mortgage
- commercial mortgage
- DSCR loan
- FHA financing
- VA financing
- USDA financing
- portfolio loan
- bridge loan
- hard-money loan
- construction loan
- construction-to-permanent loan
- seller financing
- assumed financing
- subject-to financing
- wraparound financing where lawful
- mezzanine debt
- preferred equity
- line of credit
- home-equity financing
- multiple debt tranches

### Debt Service

The engine must calculate scheduled principal and interest according to the actual structure.

It must support:

- fixed rate
- variable rate
- interest only
- amortizing
- partially amortizing
- balloon payment
- stepped rate
- multiple tranches
- deferred payment
- construction draw periods

### Loan Fees

Loan fees must be classified correctly as:

- financed
- paid at closing
- paid over time
- deducted from proceeds
- capitalized where applicable

### Debt Schedule

The engine must be capable of producing a period-by-period debt schedule containing:

- beginning balance
- payment
- interest
- principal
- additional principal
- ending balance
- rate
- fees
- balloon amount

### Financing Conflicts

If lender terms conflict with the underwriting assumptions, BRIX must preserve both and surface the conflict.

Examples:

- lender requires higher reserves than the user assumed
- lender DSCR requirement exceeds projected DSCR
- lender valuation is lower than acquisition value
- loan-to-cost and loan-to-value constraints produce different proceeds
- interest-only expiration creates negative cash flow

---

## 5.9 Operating Statement Engine

The operating engine must produce a normalized operating statement appropriate to the property type.

### Gross Potential Income

Gross potential income includes all scheduled income at full economic occupancy before vacancy and credit loss.

### Effective Gross Income

Effective gross income equals gross potential income adjusted for:

- vacancy
- credit loss
- concessions
- collection loss
- other operating income

### Operating Expenses

Operating expenses must exclude debt service and income taxes unless a strategy specifically requires otherwise.

Capital expenditures must be separated from ordinary operating expenses.

### Net Operating Income

NOI must be calculated consistently as effective gross income less operating expenses.

The engine must clearly distinguish:

- current NOI
- stabilized NOI
- pro forma NOI
- trailing NOI
- lender NOI
- user-adjusted NOI

### Cash Flow

Cash flow must distinguish:

- cash flow before debt service
- cash flow after debt service
- cash flow after reserves
- cash flow after capital expenditures
- cash flow before tax
- cash flow after tax only when tax modeling is explicitly supported

---

## 5.10 Core Return Metrics

The engine must define each metric once and use that definition across every supported client and report.

### Capitalization Rate

Cap rate must identify the NOI basis and value basis used.

Examples:

- current cap rate
- stabilized cap rate
- going-in cap rate
- exit cap rate

### Cash-on-Cash Return

Cash-on-cash return must identify:

- numerator period
- numerator cash-flow definition
- denominator cash-investment definition
- whether reserves are included
- whether renovation cash is included

### Debt Service Coverage Ratio

DSCR must identify:

- NOI basis
- debt-service period
- lender-specific adjustments
- minimum threshold

### Internal Rate of Return

IRR must use a complete dated cash-flow series and must not be calculated from incomplete or ambiguous timing.

The engine must support annual and periodic IRR when defined.

### Net Present Value

NPV must identify the discount rate and cash-flow timing.

### Equity Multiple

Equity multiple must equal total equity distributions divided by total equity invested, using the defined strategy cash-flow series.

### Return on Cost

Return on cost must identify whether the numerator is stabilized NOI or another defined operating measure.

### Development Yield

Development yield must identify total project cost and stabilized income basis.

### Break-Even Occupancy

Break-even occupancy must identify the expense and debt-service basis used.

### Profit Margin

For disposition strategies, profit margin must account for total project costs and selling costs.

No metric may be shown without a consistent formula definition and input traceability.

---

## 5.11 Strategy-Specific Underwriting

The core engine provides shared calculations, but each strategy must define an explicit underwriting contract.

Each strategy contract must include:

- strategy ID
- compatible property types
- required inputs
- optional inputs
- default policies
- formulas
- disqualifiers
- warnings
- required outputs
- risk factors
- confidence rules
- target thresholds
- sensitivity variables
- scenario templates
- testing fixtures

Examples of strategies requiring distinct logic include:

- long-term rental
- medium-term rental
- short-term rental
- house hack
- BRRRR
- fix and flip
- live-in renovation
- multifamily value-add
- commercial value-add
- stabilized commercial hold
- owner-occupied commercial
- mixed-use hold
- seller financing
- lease option
- subject-to
- ground lease
- land banking
- subdivision
- ground-up development
- adaptive reuse
- build-to-rent
- hotel operations
- self-storage operations
- mobile-home park operations
- RV park operations
- portfolio acquisition
- syndication analysis
- refinance analysis
- disposition analysis

Strategy logic must be versioned independently where necessary while still using the shared core engine.

---

## 5.12 Scenario Engine

A scenario is a complete alternative input set derived from a baseline underwriting snapshot.

The system must support at minimum:

- Base Case
- Conservative Case
- Optimistic Case
- User-Defined Case

Scenarios must preserve:

- baseline snapshot reference
- changed inputs
- reason for change
- creator
- timestamp
- scenario label
- engine version
- outputs
- recommendation effect

A scenario must not overwrite the baseline.

Examples of scenario variables include:

- purchase price
- rent
- occupancy
- operating expenses
- tax reset
- insurance cost
- interest rate
- loan amount
- renovation cost
- renovation duration
- lease-up period
- exit value
- exit cap rate
- holding period

The interface must make it clear which scenario is active.

---

## 5.13 Sensitivity Engine

Sensitivity analysis must show how changes in material assumptions affect outcomes.

The engine should support one-variable and two-variable sensitivity tables.

Common sensitivity variables include:

- purchase price
- rent
- vacancy
- operating expenses
- interest rate
- loan-to-value ratio
- renovation cost
- renovation duration
- exit cap rate
- exit price
- holding period

Outputs may include:

- cash flow
- cap rate
- cash-on-cash return
- DSCR
- IRR
- equity multiple
- total cash required
- maximum offer
- profit

Sensitivity ranges must be appropriate to the property and strategy.

The system must not imply that a sensitivity table predicts actual future performance.

---

## 5.14 Maximum Offer and Target Price

Maximum offer calculations must be strategy-specific and deterministic.

The engine must distinguish:

- target purchase price
- maximum acceptable purchase price
- maximum financed purchase price
- maximum offer based on target return
- maximum offer based on capital limit
- maximum offer based on lender constraints
- maximum offer based on renovation margin
- maximum offer based on appraisal risk

The maximum offer must explain:

- the binding constraint
- the target threshold
- the assumptions used
- whether closing costs are included
- whether renovation costs are included
- whether financing costs are included
- whether seller credits or concessions are assumed

OfferIQ may use these outputs but may not replace them with narrative judgment.

---

## 5.15 Confidence Integration

The Underwriting Engine must produce confidence metadata alongside financial outputs.

Confidence is not a substitute for the result.

Confidence should reflect:

- completeness of required inputs
- source quality
- source freshness
- number and quality of supporting records
- degree of estimation
- conflicts
- sensitivity to uncertain inputs
- property-type specificity
- strategy compatibility

The engine should identify:

- high-confidence inputs
- low-confidence inputs
- decision-changing unknowns
- outputs most sensitive to uncertainty

Confidence must remain separate from risk.

---

## 5.16 Explainability Metadata

Every material output must be explainable without asking AI to reconstruct the formula after the fact.

The engine should preserve:

- formula ID
- formula version
- input references
- intermediate values
- output value
- rounding rule
- assumption references
- source references
- warning references
- engine version

This metadata must allow BRIX to answer:

- How was this number calculated?
- Which inputs affected it?
- Which assumptions were used?
- What changed since the prior run?
- Why did the recommendation change?

AI may convert this metadata into plain language, but the metadata must originate from deterministic processing.

---

## 5.17 Re-Underwriting and Change Propagation

When a material input changes, the system must determine which outputs are affected and create a new underwriting result.

Material triggers include:

- purchase price change
- financing update
- rent update
- tax update
- insurance quote
- inspection finding
- appraisal result
- contractor estimate
- governance restriction
- contract amendment
- timeline delay
- market update

The system must:

1. Preserve the prior snapshot.
2. Create a new snapshot.
3. Identify changed inputs.
4. Recalculate affected outputs.
5. Re-run compatible strategy results when required.
6. Re-run scenarios when configured.
7. Update confidence.
8. Record the decision impact.
9. Notify the user when the change is material.

No prior underwriting result may be destructively overwritten.

---

## 5.18 Multi-Asset and Portfolio Underwriting

BRIX must support underwriting at multiple levels:

- unit
- building
- parcel
- property
- multi-property deal
- portfolio

The engine must support both consolidated and asset-level views.

It must preserve:

- asset-specific income
- asset-specific expenses
- asset-specific financing
- shared expenses
- allocation rules
- portfolio-level financing
- cross-collateralization
- package pricing
- asset-specific exit assumptions

Aggregated results must reconcile to asset-level results.

The system must not hide weak assets inside a blended portfolio result.

---

## 5.19 Rounding, Currency, and Date Rules

### Rounding

Intermediate values must retain sufficient precision.

Rounding rules must be defined by output type.

Examples:

- currency displayed to two decimals unless a report format requires whole dollars
- percentages displayed according to product policy
- debt schedules retain calculation precision internally
- unit economics may use defined per-unit precision

### Currency

Each underwriting snapshot must identify its currency.

Currency conversion must not occur silently.

When conversion is supported, BRIX must preserve:

- source currency
- target currency
- exchange rate
- exchange-rate source
- effective date

### Dates

Cash-flow timing must use actual dates or defined periods.

The system must not mix monthly, quarterly, and annual values without explicit normalization.

---

## 5.20 Persistence and Versioning

Each underwriting result must preserve:

- result ID
- snapshot ID
- deal ID
- strategy ID
- scenario ID
- engine version
- formula versions
- creation timestamp
- creator or system actor
- status
- warnings
- outputs
- confidence metadata
- explainability metadata
- prior result reference where applicable

Published reports and exports must reference the exact underwriting result used.

If the engine changes, historical results must remain reproducible using their original version or preserved result values.

---

## 5.21 API and Client Contract

The Underwriting Engine must expose a stable versioned contract.

The contract should support:

- validate snapshot
- calculate underwriting
- calculate scenarios
- calculate sensitivities
- retrieve result
- compare results
- explain result
- identify missing inputs
- identify decision-changing inputs

The API must return structured values, not presentation-ready narrative as the authoritative payload.

Web and iOS must render authoritative values from the same contract.

---

## 5.22 Error Handling and Recovery

Calculation failures must never result in silent partial success.

When calculation fails, BRIX must:

- identify the failing stage
- preserve the user's input
- show a clear error
- distinguish validation from system failure
- provide a retry path
- prevent stale outputs from appearing current
- allow manual correction where appropriate
- log diagnostic information without exposing secrets

If some strategy calculations succeed and others fail, the result must clearly identify partial completion.

---

## 5.23 Security and Data Isolation

Underwriting inputs and results are private deal data.

The system must enforce:

- workspace isolation
- deal authorization
- role-based access
- secure storage
- secure transport
- audit logging
- restricted administrative access
- no service-role credentials in clients
- no exposure of another user's underwriting data

Administrative tools may view usage and operational metrics according to policy, but access to deal-level financial information must be controlled and auditable.

---

## 5.24 Testing Standard

The Underwriting Engine requires comprehensive deterministic testing.

Testing must include:

### Unit Tests

- formula correctness
- rounding behavior
- missing-value behavior
- zero-value behavior
- negative-value behavior
- boundary behavior
- amortization
- interest-only periods
- balloon balances
- fee treatment
- scenario deltas
- sensitivity grids

### Golden Fixtures

Each supported strategy must have known input and output fixtures reviewed against accepted financial models.

Golden fixtures must include:

- simple cases
- realistic cases
- edge cases
- adverse cases
- multiple financing structures
- multiple property types

### Cross-Client Consistency

The same underwriting result must display consistently across:

- web
- iPhone
- iPad
- PDF reports
- Word reports where supported
- spreadsheets
- exports
- admin views

### Regression Tests

Any formula or engine change must run the complete regression suite.

A formula change that alters historical fixture outputs must be intentional, documented, reviewed, and versioned.

### Property-Type Tests

Residential, multifamily, commercial, land, development, mixed-use, and specialized assets must have separate validation coverage.

### Performance Tests

The engine must support practical response times for:

- single strategy calculation
- all compatible strategy calculations
- scenario sets
- sensitivity tables
- multi-asset deals
- portfolio comparisons

---

## 5.25 Definition of Complete

The Underwriting Engine is complete only when:

1. One authoritative engine serves every production client.
2. Input snapshots are immutable and versioned.
3. Material inputs preserve classification, source, confidence, and date.
4. Core acquisition, financing, operating, return, scenario, sensitivity, and exit calculations are deterministic.
5. Strategy-specific contracts are enforced.
6. Historical results are preserved.
7. Re-underwriting creates traceable before-and-after results.
8. Reports and exports reconcile to the authoritative result.
9. Web and native iOS show the same financial truth.
10. AI does not own authoritative calculations.
11. Validation and errors are visible and recoverable.
12. Golden fixtures and regression tests pass.
13. Multi-asset calculations reconcile.
14. Maximum offer and target price calculations identify their binding assumptions.
15. Confidence and explainability metadata accompany material outputs.

---

## 5.26 Non-Negotiable Rules

1. No client may maintain a competing financial engine.
2. AI may explain the math but may not own the math.
3. The same inputs and engine version must produce the same outputs.
4. Hidden assumptions are prohibited.
5. Down payment is not the same as total cash required.
6. Debt service must reflect the actual financing structure.
7. NOI, cash flow, and returns must use canonical definitions.
8. Scenario analysis must never overwrite the baseline.
9. Historical underwriting results must remain traceable.
10. Reports and spreadsheets must reconcile to the authoritative result.
11. Residential logic must not be forced onto nonresidential assets.
12. Incomplete data may reduce confidence but must not be fabricated.
13. Maximum offer calculations must explain the binding constraint.
14. Formula changes require versioning and regression testing.
15. A calculation is not production-ready until a real investor can inspect its inputs, understand its outputs, and reproduce the result.

---

## 5.27 Section Completion Rule

This section is complete and governing.

The Strategy Engine may define additional strategy-specific calculations, but it must use the architecture, definitions, versioning, validation, explainability, and testing rules established here.
