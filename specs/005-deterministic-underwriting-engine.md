# BRIX Specification 005 — Deterministic Underwriting Engine

## 1. Authority and Rules of Engagement

Governed by `docs/00-START-HERE.md` through `docs/05-BUILD-ROADMAP.md` and Specifications 001–004.

Rules:

1. This is the single authoritative financial engine for BRIX.
2. Web, iPhone, iPad, reports, exports, admin, strategy ranking, FinanceIQ, and OfferIQ must consume the same engine outputs.
3. AI may explain results but may not calculate or overwrite authoritative outputs.
4. Each calculation uses an immutable input snapshot and recorded engine version.
5. Identical inputs, currency/unit rules, and engine version must produce identical outputs.
6. No client may independently recalculate authoritative downstream metrics.
7. Internal precision, rounding, date conventions, and sign conventions must be explicit.
8. Unsupported or insufficient data must return structured validation, not fabricated values.
9. Prior valid results remain available and become stale when accepted dependencies change.
10. Property-type models must be explicit; generic support may not masquerade as complete support.
11. Material formulas require independent golden fixtures.
12. Every output must be traceable to inputs, formulas, assumptions, and validation issues.

## 2. Mission

Provide reliable, reproducible underwriting across residential, multifamily, commercial, mixed-use, land, development, and specialty real estate so investors can compare scenarios, understand cash and risk, inspect calculation lineage, and make defensible decisions.

## 3. Canonical Input Contract

Each `underwriting_snapshot` includes:

- Snapshot ID
- Workspace ID
- Deal ID
- Property IDs
- Strategy scenario ID
- Financing structure ID where applicable
- Assumption set/version
- Evidence/fact versions
- Currency
- Unit system
- Valuation date
- Hold period
- Engine version requested
- Created by/time
- Snapshot hash

Snapshots are immutable after creation.

## 4. Canonical Output Contract

Each `underwriting_result` includes:

- Result ID
- Snapshot ID
- Engine version
- Status
- Property/strategy model
- Calculation start/end
- Output values
- Periodic cash flows
- Validation issues
- Calculation lineage
- Sensitivity/scenario references
- Confidence inputs
- Freshness state
- Created time

Output values must retain units, currency, period, precision, and formula/version references.

## 5. Input Classification and Precedence

The engine receives accepted inputs only. Source precedence does not silently resolve conflicts; accepted canonical values determine the snapshot.

Suggested precedence for review:

1. Professionally confirmed or executed source
2. Source-verified fact
3. User-verified fact
4. User-entered fact
5. User assumption
6. External estimate
7. System estimate/default

The snapshot records the controlling classification and source. Missing required inputs cause blocking errors or explicit incomplete outputs.

## 6. Validation Severity

- **Blocking Error** — authoritative calculation cannot proceed or result is invalid.
- **Material Warning** — calculation can proceed but decision reliability may be affected.
- **Informational Notice** — context, assumption, or model limitation.

Each issue includes:

- Code
- Severity
- Field/entity
- Plain-language message
- Why it matters
- Whether calculation continued
- Resolution guidance

## 7. Core Acquisition and Project Calculations

Where applicable:

- Purchase price
- Closing costs
- Financing fees
- Initial repairs/renovation
- Capital improvements
- Furnishing/equipment
- Reserves
- Contingency
- Carrying costs
- Total acquisition cost
- Total project cost
- Total sources and uses
- Funding gap/surplus
- Total cash required at closing and through stabilization

Credits and reimbursements must not be double-counted.

## 8. Income Calculations

Where applicable:

- Unit/lease/space-level rent
- Gross potential rent
- Other income
- Vacancy
- Credit loss
- Concessions
- Bad debt
- Turnover downtime
- Economic occupancy
- Effective gross income
- Short-term rental ADR/occupancy/fees
- Commercial reimbursements
- Percentage rent
- Parking/storage/laundry/utility income
- Development sales or lease-up income

Income assumptions must identify period, escalation, seasonality, stabilization, and source.

## 9. Operating Expenses

Where applicable:

- Property taxes
- Insurance
- Utilities
- Repairs and maintenance
- Payroll
- Management
- Leasing/turnover
- HOA/COA/POA dues
- Landscaping/snow
- Pest/trash/security
- Administrative/legal/accounting
- Replacement reserves
- Capital expenditure treatment
- Commercial CAM/nonrecoverable expenses
- Development carrying and operating costs

The engine must distinguish operating expense, capital expenditure, financing cost, and one-time project cost.

## 10. NOI and Cash Flow

- NOI before debt
- Debt service
- Cash flow before tax
- Cash flow after planned capital expenditures where modeled
- Monthly/annual/periodic cash flows
- Stabilized versus in-place results
- Levered and unlevered views

Taxes on investor income are outside authoritative scope unless a separately approved tax model is built and clearly bounded.

## 11. Debt and Financing Calculations

FinanceIQ defines financing records; this engine calculates:

- Fixed/variable rate payments
- Amortization schedule
- Interest-only period
- Balloon/maturity balance
- Points and fees
- Multiple debt tranches
- Draw schedules
- Interest reserve
- Prepayment costs where modeled
- Blended cost
- Annual debt service
- DSCR
- Debt yield
- LTV/LTC
- Coverage and covenant tests
- Refinance proceeds and payoff

Finance terms and calculations remain linked but owned separately.

## 12. Return Metrics

Where model-appropriate:

- Cap rate
- Cash-on-cash return
- Return on cost
- Development yield
- Profit margin
- Break-even occupancy
- Break-even rent
- IRR
- XIRR
- NPV
- Equity multiple
- Unlevered return
- Levered return
- Refinance cash-out
- Sale proceeds
- Maximum allowable offer

Metrics must define exact numerator, denominator, period, timing, and inclusion/exclusion rules.

## 13. Exit Calculations

- Hold period
- Exit NOI or comparable value basis
- Exit cap rate/multiple
- Sale price
- Selling costs
- Loan payoff/prepayment
- Taxes only if explicitly modeled and bounded
- Net sale proceeds
- Investor distributions where supported

Exit assumptions must remain visible and sensitivity-tested.

## 14. Property-Type Models

At minimum, versioned models for:

- Residential rental
- Medium/short-term rental
- Multifamily
- Office
- Retail
- Industrial/flex
- Mixed use
- Self-storage
- Hospitality
- Mobile-home/RV park
- Land hold
- Development
- Fix-and-flip/renovation
- Specialty assets through approved extensions

Each model defines required inputs, formula differences, output availability, and unsupported cases.

## 15. Scenario and Sensitivity Engine

Support:

- Baseline
- Downside
- Upside
- User-defined scenarios
- One-variable sensitivity
- Two-variable matrices where useful
- Rate, value, rent, vacancy, expense, cost, timing, exit, and financing sensitivities

Scenarios reference the same base snapshot and explicit overrides. They must not create disconnected assumptions.

## 16. Maximum Offer Contract

Maximum offer may be constrained by:

- Target cash-on-cash
- Target IRR/equity multiple
- Minimum DSCR/debt yield
- Maximum cash required
- Financing proceeds/LTV/LTC
- Repair/development budget
- Required margin
- Appraised or market value
- Exit assumptions
- Investor risk limit

The result must identify the binding constraint and all relevant assumptions. It is not a guarantee of value or acceptance.

## 17. Rounding, Dates, Currency, and Units

- Use decimal-safe money math.
- Preserve full internal precision.
- Display rounding occurs only at presentation/export based on documented rules.
- Rates retain enough precision to reproduce schedules.
- Cash-flow dates use explicit time zone/calendar conventions.
- XIRR uses actual dates.
- Currency conversion is not implicit; conversion requires source rate/date and separate specification.
- Units are stored and converted explicitly.

## 18. Calculation Lineage

For every material output, lineage must identify:

- Formula ID/version
- Input fields and versions
- Intermediate values where useful
- Property/strategy model
- Financing structure version
- Rounding/display rule
- Validation issues

The UI need not show all lineage at once, but professional users must be able to inspect it.

## 19. API Contract

A privileged calculation endpoint accepts a validated snapshot reference or creates one transactionally from accepted canonical values.

Required behaviors:

- Auth and workspace permission
- Idempotency
- Snapshot hash deduplication where safe
- Engine version selection
- Timeout/background-job handling
- Structured validation response
- Durable result persistence
- Domain events after completion
- Safe retry

Large portfolio/scenario runs execute asynchronously.

## 20. User Experience

### Guided mode

- Minimum necessary inputs
- Clear defaults and assumptions
- Plain-language validation
- Explanation of outputs
- Missing-information prompts

### Professional mode

- Detailed assumptions
- Periodic schedules
- Scenario/version comparison
- Formula lineage
- Export-ready tables

### States

- No assumptions
- Incomplete/blocking
- Ready to calculate
- Queued/processing
- Complete/current
- Complete with warnings
- Stale
- Failed with prior valid result
- Conflict
- Offline viewing of cached result

Clients may queue a request offline but cannot claim calculation completion until server result exists.

## 21. Domain Events

- `underwriting.snapshot_created`
- `underwriting.requested`
- `underwriting.completed`
- `underwriting.completed_with_warnings`
- `underwriting.failed`
- `underwriting.result_stale`
- `underwriting.active_result_changed`

Consumers include Strategy Intelligence, Decision Cockpit, FinanceIQ, OfferIQ, reports, portfolio, tasks, and notifications.

## 22. Security and Audit

- Calculation inputs/results are workspace-scoped.
- Only authorized users may create/activate snapshots.
- Engine internals do not expose secrets.
- Result activation and manual overrides are audited.
- Expensive runs are rate-limited and usage-metered.

## 23. Testing Requirements

- Unit tests for every formula family.
- Golden fixtures independently reconciled.
- Property-type model fixtures.
- Debt schedule and multiple-tranche tests.
- Rounding/precision/date tests.
- Missing/invalid input tests.
- Scenario/sensitivity tests.
- Snapshot immutability/idempotency tests.
- API/integration tests.
- Web/iOS/report/export reconciliation tests.
- Performance tests for complex and portfolio scenarios.

## 24. Verification and Validation

### Calculation verification

- Identical snapshot and engine version produce identical result.
- Golden fixtures reconcile independently.
- No client performs authoritative recalculation.
- Reports and exports reconcile exactly to the canonical result.

### Data verification

- Snapshots are immutable.
- Results retain engine/version/lineage.
- Prior results remain reproducible.
- Stale state appears when accepted dependencies change.

### Integration verification

- Intake accepted values flow into snapshots.
- Strategy consumes authoritative outputs.
- Decision Cockpit shows current/stale state correctly.
- FinanceIQ and OfferIQ use the same debt and maximum-offer outputs.
- Reports/portfolio/native/web reconcile.

### UX verification

- Blocking, warning, ready, processing, current, stale, failed, conflict, and offline-view states are clear.
- Users can inspect assumptions and binding constraints.

### Definition of Done

Complete only when supported property models, golden fixtures, cross-client reconciliation, versioning, stale propagation, security, and end-to-end calculation workflows pass.

**SPECIFICATION STATUS: REVIEWED AND REPAIRED**
