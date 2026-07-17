# BRIX Specification 009 — FinanceIQ and Capital Structure

## 1. Authority and Rules of Engagement

Governed by `docs/00-START-HERE.md` through `docs/05-BUILD-ROADMAP.md` and Specifications 001–008.

Rules:

1. FinanceIQ owns financing structures and terms; the deterministic underwriting engine owns authoritative calculations.
2. A Deal may compare multiple financing structures, but only an explicitly selected version is active for a given underwriting snapshot/scenario.
3. Confirmed, quoted, proposed, estimated, expired, and superseded financing terms remain distinct.
4. No financing record may imply lender approval, availability, legality, or commitment beyond its source.
5. Multiple debt/equity tranches use one canonical capital-stack model.
6. Accepted financing changes preserve history and trigger targeted re-underwriting and strategy re-evaluation.
7. Financing documents are preserved as Evidence and extracted terms remain source-linked.
8. Hard financing constraints cannot be hidden by favorable investment returns.
9. Client applications do not independently calculate authoritative debt schedules.
10. Web, iPhone, iPad, reports, OfferIQ, ContractIQ, and Decision Cockpit use the same active financing structure.
11. Creative, securities, tax, and legal structures require appropriate professional-review boundaries.
12. Failed processing preserves prior valid structures and results.

## 2. Mission

Model how an acquisition, renovation, development, refinance, or disposition can be funded; show exact capital requirements and debt/equity terms; identify binding lender/investor constraints; compare structures; and explain how financing changes risk and return.

## 3. Canonical Entities

### `financing_structures`

- ID
- Workspace/Deal IDs
- Purpose
- Status
- Currency
- Effective/expiration dates
- Total sources/uses
- Funding gap/surplus
- Required cash/reserves
- Confidence/verification
- Version/supersession
- Active scenario/snapshot references

### `capital_sources`

- Type
- Provider/investor/seller
- Amount/commitment
- Classification
- Source evidence
- Verification/status

### `debt_tranches`

- Principal/commitment/funded amount
- Fixed/variable rate terms
- Index/margin/floor/cap
- Amortization/term/IO/balloon
- Payment frequency
- Draws/conversion/extensions
- Fees/points/prepayment
- Recourse/guarantees/collateral
- Reserves/escrows
- Covenants
- Lender/broker/servicer

### `equity_tranches`

- Contributor/class
- Contribution and timing
- Ownership/control/voting
- Preferred return
- Waterfall/promote
- Distribution priority
- Capital calls/dilution
- Fees
- Transfer/removal/buy-sell terms
- Source/verification

### Supporting entities

- Financing quotes
- Financing documents
- Conditions
- Covenants/tests
- Contacts
- Draw schedules
- Reserve accounts
- Comparison results

## 4. Financing Status

- Draft
- Scenario
- Proposed
- Quoted
- Application Started
- Application Submitted
- Conditional Approval
- Approved
- Commitment Issued
- Clear to Close
- Closed
- Declined
- Withdrawn
- Expired
- Superseded
- Refinance Candidate

Status is source-backed and audited.

## 5. Supported Financing Types

### Debt

- Cash/no debt
- Conventional fixed/adjustable residential
- FHA/VA/USDA where applicable
- DSCR
- Portfolio/community bank/credit union
- Commercial mortgage
- Bridge/hard money
- Construction/construction-to-permanent
- Renovation
- Blanket/cross-collateralized
- Line of credit/HELOC
- Mezzanine
- Seller note
- Assumption
- Subject-to/wrap where lawful
- Participating/private lender structures

### Equity

- Investor/sponsor cash
- Partner/JV
- Preferred/common equity
- Syndication/co-investment/institutional/family capital

### Other sources

- Seller/lender/builder credits
- Grants/incentives/tax credits
- Insurance proceeds
- Holdbacks/escrows
- Other approved sources

## 6. Sources and Uses

Uses include:

- Purchase/acquisition
- Closing costs
- Financing fees
- Renovation/development
- Carrying costs
- Reserves
- Contingency
- Working capital
- Other project costs

Sources must reconcile to uses or clearly show gap/surplus. Credits cannot be double-counted.

## 7. Debt Term Contract

Required where applicable:

- Loan amount/commitment
- Rate structure
- Index/margin/floor/cap
- Amortization
- Term/maturity
- Interest-only period
- Payment frequency
- Balloon
- Points/fees
- Prepayment/yield maintenance/defeasance/step-down
- Recourse/guarantees
- Collateral/cross-default
- Draws/retainage
- Extension options/fees
- Conversion/stabilization conditions
- Default/late terms

## 8. Reserves, Escrows, and Conditions

Support:

- Tax/insurance escrow
- Repair/replacement reserve
- Interest/operating/debt-service reserve
- TI/LC reserve
- Construction contingency
- Environmental/other lender reserve

Conditions may include:

- Appraisal
- Inspection
- Environmental
- Insurance
- Title/survey
- Borrower entity
- Guarantor liquidity/net worth
- Experience
- Occupancy/stabilization
- Permits/zoning/governance
- Reporting
- Closing timeline

Each condition has owner, status, due date, source, verification, and Deal/task relationship.

## 9. Covenant Contract

Support:

- Minimum DSCR
- Maximum LTV/LTC
- Minimum debt yield
- Occupancy
- Liquidity/net worth
- Reporting
- Cash management/lockbox/sweep triggers
- Completion/stabilization/leasing tests
- Insurance/environmental/property-management conditions
- Transfer/additional debt restrictions

Each covenant stores metric, threshold, measurement period, test frequency, cure rights, consequence, source, and current state.

## 10. Deterministic Calculations

Performed only by Specification 005 engine:

- Payments/amortization
- Interest-only and balloon
- Total interest/fees
- Sources/uses/funding gap
- Cash required
- Debt service by tranche
- Blended cost
- LTV/LTC/debt yield/DSCR
- Break-even occupancy after debt
- Reserve burn
- Draw timing
- Refinance proceeds/gap
- Exit payoff/prepayment
- Equity waterfall outputs where supported

FinanceIQ displays and explains canonical results.

## 11. Financing Feasibility

Evaluate:

- Program/property eligibility
- Loan/transaction size
- LTV/LTC
- DSCR/debt yield
- Occupancy/stabilization
- Borrower/guarantor assumptions
- Liquidity/net worth/experience
- Credit/income-documentation assumptions
- Appraisal/insurance/environmental/governance/zoning dependencies
- Recourse/prepayment acceptance
- Closing timeline
- Maturity/refinance risk

Result:

- Feasible
- Feasible with Conditions
- Uncertain
- Not Feasible
- Expired
- Superseded

Identify binding/failed constraints and missing verification.

## 12. Financing Comparison

Compare:

- Cash required
- Payment/debt service
- Fees/effective cost
- Rate/term/amortization/balloon
- Recourse/guarantees
- Prepayment
- Reserves
- Closing speed/documentation burden
- Flexibility/refinance/maturity risk
- DSCR/cash flow/returns
- Maximum-offer effect
- Strategy compatibility
- Confidence/verification

User preference remains separate from system feasibility/comparison.

## 13. Document Intake and Extraction

Supported sources:

- Preapproval/prequalification
- Term sheet/loan estimate/closing disclosure
- Commercial proposal/commitment
- Promissory note/mortgage/loan agreement/guaranty
- Construction draws/budgets
- Seller-financing/assumption documents
- Equity/JV/operating/waterfall documents
- Financing emails and attachments

Extracted terms retain document/page/section, quoted text where permitted, classification, confidence, effective/expiration date, and conflict status. No extraction silently replaces an active term.

## 14. Guided Workflow

Simple residential mode first asks:

- Price
- Down payment
- Loan amount
- Rate
- Term/amortization
- Taxes/insurance/HOA
- Mortgage insurance
- Closing costs/credits

Advanced terms remain available.

Professional mode exposes tranches, covenants, reserves, draws, guarantees, maturities, and waterfall structures.

Both modes use the same canonical model.

## 15. Workflow

1. Create/import financing structure.
2. Enter/extract terms.
3. Resolve conflicts and verification.
4. Reconcile sources/uses.
5. Run canonical calculations.
6. Evaluate feasibility.
7. Compare alternatives.
8. Select active structure for scenario.
9. Trigger re-underwriting/ranking.
10. Update Cockpit, tasks, timeline, reports, and OfferIQ.

## 16. User Experience

### Web

- Capital-stack overview
- Sources/uses
- Debt/equity detail
- Conditions/covenants
- Comparison
- Documents/source verification
- Calculation drill-down

### iPhone

- Summary, payment/cash, key conditions, lender contacts, document capture, deadline actions.

### iPad

- Multi-column comparison, documents and term review, capital stack and Deal context.

### States

- Draft
- Incomplete
- Quoted/current
- Processing
- Stale
- Expired
- Conflict
- Failed with prior valid result
- Offline cached

## 17. Domain Events

- `financing.structure_created`
- `financing.terms_changed`
- `financing.quote_received`
- `financing.condition_changed`
- `financing.feasibility_changed`
- `financing.active_structure_changed`
- `financing.expired`
- `financing.closed`

Consumers: underwriting, strategy, Cockpit, OfferIQ, ContractIQ, tasks, notifications, reports, timeline.

## 18. Security and Audit

- Workspace/RLS scope.
- Sensitive financial documents use authorized Storage.
- Terms/activation/overrides audited.
- Provider secrets server-side.
- Expensive comparisons metered/rate-limited.
- Securities/legal/tax output carries appropriate boundaries.

## 19. Testing Requirements

- Debt/equity model tests.
- Sources/uses reconciliation.
- Debt schedule and covenant fixtures.
- Feasibility/disqualifier tests.
- Comparison tests.
- Document extraction/conflict tests.
- Idempotency/versioning tests.
- RLS/storage tests.
- Underwriting/strategy/OfferIQ integration.
- Web/iOS/report reconciliation.

## 20. Verification and Validation

### Functional verification

- Structures create, import, compare, activate, save, reopen, expire, supersede, and close correctly.
- Sources/uses reconcile.
- Conditions/covenants/tasks remain connected.

### Calculation verification

- All authoritative outputs come from Specification 005.
- Debt schedules and fixtures reconcile.
- Web, iOS, reports, and exports agree.

### Integration verification

- Active structure triggers versioned underwriting/ranking.
- Cockpit/OfferIQ/ContractIQ/tasks/deadlines/notifications/timeline update.
- Prior structures/results remain preserved and stale state is accurate.

### UX verification

- Guided and professional modes are complete.
- Draft, incomplete, processing, current, stale, expired, conflict, failed, and offline states are clear.

### Definition of Done

Complete only when simple and complex capital structures are source-defensible, deterministically calculated, historically preserved, and seamlessly connected to the complete Deal flow.

**SPECIFICATION STATUS: REVIEWED AND REPAIRED**
