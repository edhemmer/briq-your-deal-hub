# Specification 005 — Deterministic Underwriting Engine

## Authority

This specification is part of the BRIX production build package. It governs the only authoritative underwriting engine used by the web application, native iPhone application, native iPad application, reports, spreadsheet exports, portfolio comparisons, OfferIQ, FinanceIQ, Strategy Intelligence, Admin analytics, and any future BRIX client.

Codex must re-read `docs/00-START-HERE.md`, `docs/01-PRODUCT-CONSTITUTION.md`, `docs/02-ENGINEERING-STANDARDS.md`, `docs/03-DATA-ARCHITECTURE.md`, `docs/04-UI-UX-SYSTEM.md`, `docs/05-BUILD-ROADMAP.md`, and all prior specifications before implementing this subsystem.

## Mission

Create a deterministic, versioned, backend-owned underwriting engine that transforms canonical Deal inputs into reproducible financial outputs, warnings, sensitivities, and strategy-ready results.

The engine must be accurate enough that an investor can rely on it for real property analysis while still seeing every assumption, source, uncertainty, conflict, and limitation that affects the result.

## Non-Negotiable Rules

1. There is one authoritative underwriting engine.
2. Authoritative calculations do not run independently in presentation components.
3. AI may explain outputs but may not produce authoritative numbers.
4. Identical normalized inputs plus identical engine version must produce identical outputs.
5. Every result must identify its input snapshot, engine version, calculation timestamp, currency, units, rounding rules, and validation state.
6. Every material assumption must retain source, classification, confidence, effective date, and user acceptance state.
7. Historical underwriting snapshots and results must remain reproducible.
8. No later recalculation may silently overwrite the prior result.
9. Web, iPhone, iPad, PDF, Word, spreadsheet, portfolio comparison, OfferIQ, and Admin must consume the same canonical result.
10. Stale underwriting must be labeled immediately when an accepted input changes.
11. A failed recalculation must not erase the last valid result.
12. The engine must support simple and complex Deal structures without forcing every user through irrelevant inputs.

---

# 1. Scope

## Included

- Acquisition underwriting
- Hold underwriting
- Renovation and value-add underwriting
- Flip underwriting
- Refinance underwriting
- Development underwriting
- Land underwriting
- Commercial and multifamily underwriting
- Multiple income streams
- Multiple expense categories
- Multiple financing tranches
- Investor equity and partner contributions
- Scenario comparison
- Sensitivity analysis
- Break-even analysis
- Maximum offer analysis
- Risk and validation outputs
- Result versioning
- Audit trail
- Cross-client result delivery
- Report and spreadsheet reconciliation

## Excluded from this specification

- Strategy ranking logic, except the normalized outputs required by Strategy Intelligence
- Legal conclusions
- Tax advice
- Final lender approval
- Final appraisal conclusions
- Final inspection conclusions
- Market data acquisition
- Contract term extraction

Those capabilities consume or update canonical underwriting inputs through their own specifications.

---

# 2. Canonical Data Ownership

## Canonical entities

At minimum:

- `underwriting_models`
- `underwriting_input_snapshots`
- `underwriting_input_values`
- `underwriting_runs`
- `underwriting_results`
- `underwriting_metrics`
- `underwriting_warnings`
- `underwriting_sensitivities`
- `underwriting_cash_flows`
- `underwriting_debt_schedules`
- `underwriting_scenario_sets`
- `underwriting_scenarios`
- `underwriting_overrides`
- `underwriting_engine_versions`
- `assumption_sets`
- `assumptions`
- `financing_structures`
- `financing_tranches`

Final table names may differ only if the same ownership boundaries remain explicit.

## Required identifiers

Every run must include:

- `workspace_id`
- `deal_id`
- `property_id`
- `strategy_scenario_id` where applicable
- `assumption_set_id`
- `input_snapshot_id`
- `underwriting_run_id`
- `engine_version`
- `model_id`
- `model_version`
- `currency_code`
- `measurement_system`
- `created_by`
- `created_at`

## Snapshot immutability

An accepted input snapshot is immutable. Any change creates a new snapshot.

A result may never point to mutable live form state.

## Input value metadata

Each material input must support:

- Canonical field ID
- Value
- Data type
- Unit
- Currency where applicable
- Source type
- Source reference
- Classification
- Confidence
- Effective date
- Retrieved date
- User acceptance state
- Verification state
- Conflict state
- Override reason
- Prior value reference

---

# 3. Underwriting Model Registry

Every model must have a permanent identifier and version.

Minimum model families:

- `UW-RES-LTR`
- `UW-RES-MTR`
- `UW-RES-STR`
- `UW-RES-FLIP`
- `UW-RES-BRRRR`
- `UW-MF-STABILIZED`
- `UW-MF-VALUE-ADD`
- `UW-COM-OFFICE`
- `UW-COM-RETAIL`
- `UW-COM-INDUSTRIAL`
- `UW-COM-FLEX`
- `UW-COM-MIXED-USE`
- `UW-COM-MEDICAL`
- `UW-COM-NNN`
- `UW-COM-HOSPITALITY`
- `UW-COM-SELF-STORAGE`
- `UW-COM-MHP`
- `UW-COM-RV-PARK`
- `UW-LAND-HOLD`
- `UW-LAND-ENTITLEMENT`
- `UW-LAND-SUBDIVISION`
- `UW-DEV-HORIZONTAL`
- `UW-DEV-VERTICAL`
- `UW-DEV-BTR`
- `UW-PORTFOLIO`

Each model definition must include:

- Supported asset types
- Supported strategies
- Required inputs
- Optional inputs
- Default rules
- Formula registry
- Validation rules
- Output registry
- Sensitivity dimensions
- Unsupported conditions
- Test fixtures

No model may infer unsupported formulas from free-form text at runtime.

---

# 4. Input Architecture

## Input groups

### Property and acquisition

- Purchase price
- Contract price
- Current asking price
- Earnest money
- Closing costs
- Transfer taxes
- Legal costs
- Due diligence costs
- Financing costs
- Initial reserves
- Immediate repairs
- Renovation budget
- Contingency
- Furniture, fixtures, and equipment
- Lease-up costs
- Developer fee where applicable
- Other acquisition costs

### Income

- Unit or space schedule
- Current rent
- Market rent
- Other recurring income
- Reimbursements
- Utility income
- Parking
- Storage
- Laundry
- Pet income
- Service income
- Short-term rental nightly rate
- Occupancy
- Seasonality
- Concessions
- Credit loss
- Vacancy
- Growth assumptions

### Operating expenses

- Property taxes
- Insurance
- Utilities
- Repairs and maintenance
- Property management
- Payroll
- Landscaping
- Snow removal
- Association dues
- Administrative
- Marketing
- Security
- Pest control
- Turnover
- Replacement reserves
- Capital reserves
- Contract services
- Franchise or platform fees
- Other expenses
- Expense growth

### Financing

- Loan amount
- LTV
- LTC
- Interest rate
- Rate type
- Index
- Margin
- Amortization
- Term
- Interest-only period
- Balloon
- Points
- Origination fee
- Closing fees
- Prepayment
- Recourse
- Draw schedule
- Retainage
- Reserve requirements
- Extension terms
- Multiple tranches

### Exit and hold

- Hold period
- Exit cap rate
- Exit price
- Selling costs
- Appreciation
- Rent growth
- Expense growth
- Refinance date
- Refinance value
- Refinance LTV
- Refinance rate
- Tax assumptions only when explicitly supported and labeled

### Development

- Land basis
- Hard costs
- Soft costs
- Permits
- Impact fees
- Architecture and engineering
- Financing carry
- Construction schedule
- Draw timing
- Absorption
- Unit delivery schedule
- Sales pace
- Lease-up pace
- Developer fee
- Contingency
- Stabilized value

## Input precedence

When multiple values exist, the engine must use a documented precedence policy. Suggested default:

1. User-confirmed professional document value
2. User-confirmed contract value
3. User-entered confirmed fact
4. Verified external fact
5. User-approved estimate
6. System estimate
7. Unaccepted extracted value

The active value and rejected alternatives must remain visible.

---

# 5. Calculation Contract

## Acquisition calculations

At minimum:

- Purchase basis
- Total acquisition costs
- Total renovation costs
- Total project cost
- Total cash required
- Sources and uses
- Initial loan proceeds
- Initial equity requirement

## Income calculations

At minimum:

- Gross potential rent
- Gross potential income
- Vacancy loss
- Credit loss
- Concessions
- Effective gross income
- Other income
- Stabilized income

## Expense calculations

At minimum:

- Operating expense total
- Expense ratio
- Replacement reserves
- Capital reserves
- Stabilized expenses
- Expense growth schedule

## Net operating income

`NOI = Effective Gross Income - Operating Expenses`

Debt service, depreciation, income tax, owner distributions, and capital expenditures must not be included in NOI unless a model explicitly labels a different metric.

## Debt calculations

At minimum:

- Periodic debt payment
- Interest component
- Principal component
- Remaining balance
- Interest-only payment
- Balloon balance
- Debt service by tranche
- Total debt service
- Debt yield where applicable
- LTV
- LTC
- DSCR

## Return calculations

At minimum where applicable:

- Cap rate
- Cash-on-cash return
- Return on cost
- Gross rent multiplier
- Debt yield
- DSCR
- Break-even occupancy
- Profit
- Profit margin
- ROI
- IRR
- XIRR
- NPV
- Equity multiple
- Payback period
- Development yield
- Yield on cost
- Refinance proceeds
- Cash returned at refinance
- Remaining equity invested

## Maximum offer

Maximum offer must be derived from explicit investor constraints and identify the binding constraint.

Possible constraints:

- Minimum cash-on-cash
- Minimum DSCR
- Minimum IRR
- Minimum equity multiple
- Maximum total cash required
- Maximum LTV or LTC
- Maximum monthly loss
- Required profit margin
- Required development spread
- Required reserve balance

The engine must not output one maximum offer without identifying:

- Strategy
- Scenario
- Constraints used
- Binding constraint
- Assumptions
- Confidence
- Material missing information

## Time convention

Every model must define:

- Monthly or annual period basis
- Timing of cash flows
- Beginning or end-of-period convention
- Day-count convention where relevant
- Date handling for XIRR
- Partial-period behavior

## Rounding

- Calculations must use high precision internally.
- Rounding occurs only at defined output boundaries.
- Currency display defaults to two decimals unless whole-dollar display is intentionally selected.
- Percentages must define stored precision and display precision.
- Reports, exports, and clients must use the same rounding policy.

---

# 6. Scenario and Sensitivity Engine

## Required scenarios

At minimum:

- Base
- Conservative
- Optimistic
- User-defined

Scenario changes must create explicit deltas from the baseline assumption set.

## Sensitivity dimensions

Support model-appropriate changes to:

- Purchase price
- Rent
- Occupancy
- Vacancy
- Operating expenses
- Renovation costs
- Interest rate
- Loan proceeds
- Exit cap rate
- Exit price
- Hold period
- Construction cost
- Schedule delay
- Absorption

## Output

Sensitivity results must show:

- Changed variable
- Range
- Step
- Output metric
- Break-even point
- Threshold violation
- Best/worst result
- Current Deal position

Do not generate decorative charts without the exact underlying table values.

---

# 7. Validation and Warning Engine

## Severity

- Blocking error
- Material warning
- Informational notice

## Required validation categories

- Missing required input
- Invalid range
- Unit mismatch
- Currency mismatch
- Contradictory values
- Unsupported model
- Impossible loan terms
- Negative or zero denominator
- Insufficient cash flow series
- Invalid dates
- Stale source
- Unaccepted estimate
- Low-confidence material input
- Material conflict
- Model-specific concern

Every validation item must include:

- Code
- Severity
- Field or entity
- Plain-language explanation
- Why it matters
- Whether calculation continued
- Recommended correction
- Source or rule reference

The engine must not hide warnings merely because a numeric result was produced.

---

# 8. Execution Architecture

## Canonical execution flow

1. User changes or accepts an input.
2. Input is validated client-side for usability only.
3. Canonical input is persisted.
4. A new immutable snapshot is created or queued.
5. Domain event marks prior result stale.
6. Underwriting run is created with idempotency key.
7. Backend engine validates normalized input.
8. Engine calculates outputs.
9. Results, warnings, cash flows, and debt schedules are persisted transactionally.
10. Run status becomes complete or failed.
11. Clients receive updated status.
12. Decision Cockpit and Strategy Intelligence consume the new result.
13. Audit history records the change.

## Run states

- Draft
- Queued
- Validating
- Calculating
- Complete
- Complete with warnings
- Failed
- Cancelled
- Superseded

A run must not remain indefinitely in a processing state. Timeouts and recovery rules are required.

## Idempotency

The same snapshot, model, and engine version must not create duplicate authoritative results.

## Concurrency

A slower older run must never overwrite a newer completed run.

## Failure behavior

- Preserve the last valid result.
- Mark it stale if inputs changed.
- Show the failed run separately.
- Provide retry.
- Preserve correlation ID.
- Never claim current analysis is complete when the newest run failed.

---

# 9. API and Contract Requirements

Minimum contracts:

- Create/update assumption draft
- Accept/reject input value
- Create input snapshot
- Start underwriting run
- Get run status
- Get current authoritative result
- Get historical result
- Compare results
- Get debt schedule
- Get cash-flow series
- Get sensitivity result
- Get warnings
- Export normalized result

Every response must use versioned schemas.

Clients must not reconstruct financial logic from raw values.

---

# 10. UI and UX Requirements

## Underwriting workspace

Required sections:

- Summary
- Acquisition
- Income
- Expenses
- Financing
- Renovation or development
- Exit
- Assumptions
- Scenarios
- Sensitivity
- Warnings
- Calculation details
- History

## Premium design rules

- Summary first, detail second.
- Show current result status and `as of` time.
- Show stale state immediately.
- Clearly distinguish facts, estimates, and assumptions.
- Show source and confidence without cluttering every field.
- Use progressive disclosure for advanced inputs.
- Provide a compact professional mode and guided mode using the same data.
- Use tabular numerals and aligned financial columns.
- Never rely on color alone.
- Allow comparison of scenarios without losing the baseline.
- Show what changed after each recalculation.

## Forms

- Autosave drafts.
- Preserve incomplete values without treating them as accepted.
- Show units and currency.
- Validate inline.
- Explain dependencies.
- Support bulk unit/space schedules.
- Support keyboard-first entry on web and iPad.
- Provide mobile-appropriate editors on iPhone.

## iPhone

Prioritize:

- Summary
- Key assumptions
- Warnings
- Scenario switcher
- Quick edit of common inputs
- Voice note or evidence link
- Recalculate status

Complex schedules may use focused editors rather than compressed desktop tables.

## iPad

Support:

- Split-view input and result
- Scenario comparison
- Spreadsheet-like schedules
- Keyboard shortcuts
- Document reference beside assumptions

## Empty, loading, stale, conflict, and failure states

Every state must be intentionally designed. A spinner alone is not sufficient.

---

# 11. Cross-Module Connections

## Inputs from

- Property Intake
- MarketIQ
- FinanceIQ
- GovernanceIQ
- ContractIQ
- InspectionIQ
- AppraisalIQ
- PhotoIQ after user confirmation
- OfferIQ
- User assumptions

## Outputs to

- Strategy Intelligence
- Decision Cockpit
- OfferIQ
- ReportIQ
- Portfolio comparison
- Admin usage and operational metrics
- RELearnIQ explanations

## Required domain events

Examples:

- `assumption.changed`
- `assumption.accepted`
- `underwriting.stale`
- `underwriting.run_requested`
- `underwriting.completed`
- `underwriting.completed_with_warnings`
- `underwriting.failed`
- `underwriting.superseded`
- `underwriting.material_change_detected`

Every consumer must be idempotent.

---

# 12. Security and Authorization

- All data is workspace-scoped.
- RLS applies to inputs, runs, results, schedules, scenarios, and exports.
- Viewers cannot modify assumptions.
- Contributors may modify only within granted permissions.
- Overrides require permission and reason.
- Engine execution occurs in trusted backend context.
- Service credentials never ship to clients.
- Audit logs record material changes and overrides.
- Export access follows Deal permissions.

---

# 13. Performance and Reliability

Targets should be measured with realistic data.

- Common residential calculation: near-interactive completion.
- Complex multifamily/commercial calculation: visible queued/progress state.
- Large schedule rendering must use virtualization or pagination.
- Results must be cacheable by immutable snapshot and engine version.
- Cache invalidation must be explicit.
- Engine failures must be observable.
- Metrics must include run duration, failure rate, warning rate, retry rate, and cost where applicable.

---

# 14. Testing Requirements

## Unit tests

- Every formula
- Every rounding rule
- Every validation rule
- Every model-specific branch
- Every edge case

## Golden fixtures

Create independently verified fixtures for at least:

- Simple residential rental
- Residential flip
- BRRRR
- Small multifamily
- Commercial NNN
- Mixed-use property
- Land hold
- Development project
- Multiple debt tranches
- Refinance scenario

Each fixture must define exact inputs and expected outputs.

## Integration tests

- Snapshot creation
- Run creation
- Idempotency
- Persistence
- Supersession
- Failure recovery
- RLS
- Cross-module event delivery

## End-to-end tests

- Create Deal
- Enter assumptions
- Run analysis
- Review warnings
- Change input
- Observe stale state
- Recalculate
- Compare results
- Reopen Deal
- Export PDF and spreadsheet
- Confirm reconciliation

## Cross-client tests

The same fixture must produce identical material values on web, iPhone, iPad, PDF, spreadsheet, and portfolio comparison.

---

# 15. Definition of Done

This specification is implemented only when:

1. One backend engine owns all authoritative calculations.
2. All required models have registered versions.
3. Immutable input snapshots exist.
4. Results are reproducible.
5. Historical results remain accessible.
6. Stale-state behavior works.
7. Failed runs preserve prior valid results.
8. Idempotency and supersession work.
9. Required calculations and warnings are implemented.
10. Web, iPhone, and iPad consume the same contracts.
11. Reports and spreadsheets reconcile exactly.
12. Golden fixtures pass.
13. RLS tests pass.
14. Accessibility and premium UI states are complete.
15. No client contains a competing authoritative calculator.
16. No dead controls, fake values, or disconnected outputs remain.
17. Exact verification commands and results are recorded.
18. Known limitations are documented.
19. Unrelated files were not changed.
20. Codex reports `CHAPTER COMPLETE` only after all gates pass.
