# BRIX Specification 009 — FinanceIQ and Capital Structure

## 1. Authority and Required Reading

This specification is governed by:

- `docs/00-START-HERE.md`
- `docs/01-PRODUCT-CONSTITUTION.md`
- `docs/02-ENGINEERING-STANDARDS.md`
- `docs/03-DATA-ARCHITECTURE.md`
- `docs/04-UI-UX-SYSTEM.md`
- `docs/05-BUILD-ROADMAP.md`
- `specs/003-deals-and-pdrm-core.md`
- `specs/005-deterministic-underwriting-engine.md`
- `specs/006-strategy-intelligence-engine.md`
- `specs/007-decision-cockpit-and-deal-workspace.md`

Codex must re-read the permanent product, engineering, data, UI/UX, state, security, and verification rules before implementing this specification.

FinanceIQ must not create a second financial engine, duplicate debt calculations, client-side authoritative math, or financing records disconnected from the canonical Deal.

---

## 2. Mission

FinanceIQ models how a real estate opportunity can be funded, how the proposed capital structure changes risk and return, whether the structure is feasible, which constraints bind, and what financing conditions must be verified before the investor relies on the analysis.

FinanceIQ must support simple owner-occupied residential financing and complex multi-tranche commercial, development, distressed, partnership, and creative-finance structures without forcing every user through unnecessary complexity.

FinanceIQ must answer:

1. How much capital is required?
2. Which funding sources are being used?
3. What are the exact terms and conditions?
4. What is the monthly, annual, and life-of-loan debt burden?
5. Which lender, investor, seller, or program constraints bind?
6. How do financing terms affect cash flow, DSCR, returns, refinance, and exit?
7. Which terms are confirmed, estimated, assumed, proposed, expired, or missing?
8. What must be verified before offer, contract, closing, refinance, or disposition?

---

## 3. Scope

FinanceIQ includes:

- Acquisition financing
- Refinance financing
- Construction and renovation financing
- Permanent debt
- Bridge debt
- Hard money
- Seller financing
- Assumable debt
- Subject-to analysis where lawful and appropriate
- Wrap financing where lawful and appropriate
- Lines of credit and HELOCs
- Commercial mortgages
- DSCR loans
- Conventional residential mortgages
- FHA, VA, USDA, and other supported programs
- Mezzanine debt
- Preferred equity
- Common equity
- Joint-venture capital
- Syndication capital
- Grants, incentives, tax credits, and subsidies where relevant
- Reserves, escrows, guarantees, covenants, recourse, and lender conditions
- Financing comparison and optimization
- Financing-document intake and extraction
- Financing status, contacts, deadlines, and verification

FinanceIQ does not:

- Approve a loan
- Guarantee financing availability
- Replace a lender, mortgage professional, attorney, CPA, securities professional, or tax advisor
- Present estimated terms as lender commitments
- Present creative-finance structures as lawful without jurisdiction-specific professional review
- Calculate authoritative financial results outside the canonical underwriting engine

---

## 4. Canonical Ownership

### 4.1 Canonical entities

FinanceIQ must use canonical records for:

- `deal_id`
- `property_id`
- `workspace_id`
- `financing_structure_id`
- `capital_source_id`
- `debt_tranche_id`
- `equity_tranche_id`
- `financing_term_version_id`
- `financing_document_id`
- `financing_condition_id`
- `financing_quote_id`
- `lender_contact_id`
- `underwriting_snapshot_id`
- `underwriting_result_id`
- `strategy_scenario_id`

### 4.2 Required canonical rule

A Deal may contain multiple financing structures for comparison, but only one may be designated the active financing structure for a specific underwriting snapshot and strategy scenario.

Changing the active structure must:

1. Preserve the prior structure.
2. Create a versioned assumption change.
3. Trigger targeted underwriting recalculation.
4. Trigger strategy re-evaluation where results change materially.
5. Update Deal Cockpit freshness state.
6. Preserve before-and-after recommendation history.

---

## 5. Financing Structure Model

A financing structure represents the full stack of capital funding an acquisition, project, refinance, or disposition.

Each structure must include:

- Purpose
- Status
- Effective date
- Expiration date
- Currency
- Total project cost
- Total uses
- Total sources
- Funding gap or surplus
- Required cash at closing
- Required reserves
- Contingency
- Debt tranches
- Equity tranches
- Grants or incentives
- Seller credits
- Lender credits
- Escrows
- Fees
- Conditions
- Confidence
- Verification status
- Source classification
- Version

### 5.1 Structure status

Supported statuses:

- Draft
- Scenario
- Proposed
- Quoted
- Application started
- Application submitted
- Conditional approval
- Approved
- Commitment issued
- Clear to close
- Closed
- Declined
- Withdrawn
- Expired
- Superseded
- Refinance candidate

The UI must not collapse materially different statuses into a generic “financing” label.

---

## 6. Capital Source Types

FinanceIQ must support at minimum:

### 6.1 Debt

- Cash purchase with no debt
- Conventional fixed-rate mortgage
- Conventional adjustable-rate mortgage
- FHA
- VA
- USDA
- DSCR residential investment loan
- Portfolio loan
- Community bank loan
- Credit union loan
- Commercial mortgage
- SBA-related owner-user real estate financing where applicable
- Bridge loan
- Hard-money loan
- Construction loan
- Construction-to-permanent loan
- Renovation loan
- Blanket loan
- Cross-collateralized loan
- Line of credit
- HELOC
- Mezzanine debt
- Seller note
- Assumed loan
- Subject-to debt where lawful
- Wraparound financing where lawful
- Participating mortgage
- Convertible debt where applicable
- Private lender note

### 6.2 Equity

- Investor cash
- Partner equity
- Joint venture equity
- Preferred equity
- Common equity
- Syndication equity
- Sponsor equity
- Co-investment
- Family/friend capital
- Institutional equity

### 6.3 Other sources

- Seller credit
- Lender credit
- Builder credit
- Grant
- Tax credit
- Development incentive
- Utility incentive
- Insurance proceeds
- Earnout or holdback
- Escrow release
- Deposit credit
- Sale proceeds from another asset

Every source must retain its classification, source, date, confidence, and verification state.

---

## 7. Debt Tranche Contract

Each debt tranche must support:

### 7.1 Core terms

- Original principal
- Current principal
- Maximum commitment
- Funded amount
- Loan purpose
- Interest rate
- Fixed or variable
- Index
- Margin
- Rate floor
- Rate cap
- Teaser period
- Amortization period
- Loan term
- Interest-only period
- Payment frequency
- Payment type
- Balloon date
- Maturity date
- First payment date
- Draw schedule
- Draw conditions
- Conversion conditions
- Extension options
- Extension fees
- Recourse type
- Guarantee requirements
- Collateral
- Cross-collateralization
- Cross-default provisions
- Prepayment terms
- Yield maintenance
- Defeasance
- Step-down penalty
- Late fee
- Default rate
- Points
- Origination fee
- Underwriting fee
- Appraisal fee
- Legal fee
- Inspection fee
- Draw fee
- Exit fee
- Brokerage fee
- Mortgage insurance
- Funding source
- Lender
- Broker
- Servicer

### 7.2 Reserves and escrows

- Tax escrow
- Insurance escrow
- Replacement reserve
- Repair reserve
- Interest reserve
- Operating reserve
- Debt service reserve
- Tenant improvement reserve
- Leasing commission reserve
- Construction contingency
- Completion guarantee reserve
- Environmental reserve
- Other lender-controlled reserve

### 7.3 Covenants and tests

- Minimum DSCR
- Maximum LTV
- Maximum LTC
- Minimum debt yield
- Minimum occupancy
- Minimum liquidity
- Minimum net worth
- Recurring reporting requirements
- Cash management trigger
- Lockbox trigger
- Sweep trigger
- Completion tests
- Stabilization tests
- Leasing tests
- Guarantor requirements
- Environmental conditions
- Insurance conditions
- Property management conditions
- Borrower entity requirements
- Prohibited transfers
- Additional debt restrictions

Each covenant must define:

- Metric
- Threshold
- Measurement period
- Testing frequency
- Cure rights
- Consequence
- Verification source
- Current status

---

## 8. Equity Tranche Contract

Each equity tranche must support:

- Investor or investor class
- Contribution amount
- Contribution date
- Ownership percentage
- Voting rights
- Control rights
- Preferred return
- Accrual rules
- Catch-up provisions
- Promote structure
- Waterfall tiers
- Distribution priority
- Capital-call rights
- Dilution rules
- Return of capital
- Refinance distribution rules
- Sale distribution rules
- Sponsor fees
- Asset-management fees
- Acquisition fees
- Disposition fees
- Construction-management fees
- Property-management fees
- Guaranty fee
- Transfer restrictions
- Buy-sell provisions
- Key-person provisions
- Reporting rights
- Removal rights
- Default remedies
- Tax allocation assumptions

FinanceIQ may model the economics of equity arrangements but must not present securities, legal, tax, or fiduciary conclusions as professional advice.

---

## 9. Deterministic Calculation Requirements

FinanceIQ must call the canonical underwriting engine for all authoritative calculations.

Required outputs include:

- Monthly debt service
- Annual debt service
- Interest-only payment
- Amortizing payment
- Principal and interest split
- Balloon balance
- Maturity balance
- Total interest
- Total fees
- Effective borrowing cost
- Sources and uses
- Funding gap
- Cash required at closing
- Cash required through stabilization
- Debt service by tranche
- Blended interest rate
- Weighted average cost of capital where applicable
- LTV
- LTC
- Loan-to-cost after contingency
- Debt yield
- DSCR
- Interest coverage ratio
- Break-even occupancy after debt
- Reserve burn
- Draw timing
- Refinance proceeds
- Refinance cash-out
- Refinance gap
- Exit payoff
- Prepayment cost
- Investor-level returns where supported
- Equity waterfall outputs where supported

### 9.1 Calculation precedence

The engine must use the following precedence unless a more specific model applies:

1. Confirmed executed financing document
2. Confirmed lender commitment
3. Confirmed lender quote
4. User-entered verified term
5. User-entered proposed term
6. External estimate
7. System default assumption

The UI must show which level is controlling each material output.

### 9.2 Rounding

- Internal calculations must use sufficient precision.
- Currency display may round to two decimals unless the screen intentionally summarizes.
- Rates must preserve enough precision to reproduce payment results.
- Reports and exports must reconcile to the same engine output.
- No client may independently round intermediate values and then recalculate downstream metrics.

---

## 10. Financing Feasibility Engine

FinanceIQ must evaluate financing feasibility independently from investment attractiveness.

### 10.1 Feasibility checks

- Loan amount within program limits
- LTV compliance
- LTC compliance
- DSCR compliance
- Debt-yield compliance
- Occupancy requirement
- Property-type eligibility
- Borrower eligibility
- Owner-occupancy requirement
- Seasoning requirement
- Experience requirement
- Net-worth requirement
- Liquidity requirement
- Guarantor requirement
- Reserve requirement
- Credit-score assumption
- Income-documentation assumption
- Appraisal dependency
- Environmental dependency
- Insurance dependency
- Association or governance dependency
- Zoning/use dependency
- Construction budget dependency
- Stabilization dependency
- Recourse acceptance
- Prepayment compatibility
- Closing-timeline compatibility

### 10.2 Feasibility result

Each financing structure receives:

- Feasible
- Feasible with conditions
- Uncertain
- Not feasible
- Expired
- Superseded

The result must identify:

- Binding constraints
- Failed constraints
- Missing inputs
- Conditions to satisfy
- Sensitivity to rate, value, NOI, cost, and occupancy
- Confidence
- Verification needs

A strong return may not override a hard financing disqualifier.

---

## 11. Financing Comparison

Users must be able to compare multiple structures side by side.

Comparison must include:

- Cash required
- Monthly debt service
- Annual debt service
- Total fees
- Effective cost
- Rate
- Term
- Amortization
- Balloon
- Recourse
- Guarantees
- Prepayment
- Reserves
- Closing speed
- Documentation burden
- Flexibility
- Refinance risk
- Extension risk
- Maturity risk
- DSCR
- Cash flow
- Cash-on-cash
- IRR
- Equity multiple
- Maximum offer effect
- Strategy compatibility
- Confidence
- Verification state

The user must be able to designate:

- Best overall
- Lowest cash requirement
- Lowest payment
- Lowest risk
- Fastest closing
- Most flexible
- Highest return
- Preferred by investor

The app must clearly distinguish system comparison from user preference.

---

## 12. Financing Documents and Extraction

FinanceIQ must accept:

- Preapproval letters
- Prequalification letters
- Term sheets
- Loan estimates
- Closing disclosures
- Commercial loan proposals
- Commitment letters
- Promissory notes
- Mortgages/deeds of trust
- Guaranties
- Security agreements
- Intercreditor agreements
- Participation agreements
- Seller-financing agreements
- Assumption agreements
- Draw schedules
- Construction budgets
- Reserve agreements
- Equity term sheets
- Operating agreements
- Waterfall schedules
- Emails containing financing terms
- Attachments to financing emails

### 12.1 Extraction rules

Extracted terms must retain:

- Source document
- Page/section
- Exact text where permitted
- Extracted value
- Classification
- Confidence
- Conflict status
- Verification state
- Effective date
- Expiration date

Unclear, conflicting, incomplete, or unusual terms must be marked for verification.

No extracted term may silently replace an active confirmed term.

---

## 13. Mortgage and Loan Intake Workflow

### 13.1 Simple guided mode

For beginner or simple residential deals, show only the minimum necessary fields first:

- Purchase price
- Down payment
- Loan amount
- Rate
- Term
- Amortization
- Taxes
- Insurance
- HOA/COA dues
- Mortgage insurance
- Closing costs
- Credits
- Estimated payment

Advanced terms remain available through progressive disclosure.

### 13.2 Professional mode

Professional mode exposes all tranches, covenants, reserves, fees, guarantees, draws, maturities, and waterfall structures.

Both modes must use the same canonical financing record and engine.

### 13.3 Save behavior

- Drafts autosave.
- User sees saved, processing, stale, conflicted, and failed states.
- Interrupted work resumes at the same meaningful step.
- No financing form may lose data after authentication refresh or recoverable network failure.

---

## 14. UI and UX Requirements

### 14.1 Deal Workspace entry

FinanceIQ must be accessible from:

- Deal navigation
- Decision Cockpit
- OfferIQ
- Underwriting
- ContractIQ
- AppraisalIQ
- Refinance workflow
- Notifications and tasks
- Global search

### 14.2 FinanceIQ overview

The top of the screen must show:

- Active financing structure
- Status
- Cash required
- Total debt
- Monthly/annual debt service
- DSCR
- LTV/LTC
- Maturity
- Major conditions
- Confidence
- Freshness
- Next action

### 14.3 Required views

- Structure summary
- Sources and uses
- Debt tranches
- Equity tranches
- Fees and closing costs
- Reserves and escrows
- Covenants and conditions
- Payment schedule
- Draw schedule
- Comparison
- Documents
- Contacts
- Tasks and deadlines
- History
- Refinance analysis

### 14.4 Premium design requirements

- Financial numbers use tabular numerals.
- Cash requirement, payment, maturity, and binding constraints receive strongest visual priority.
- Risk colors must not be the only status indicator.
- Complex structures use clear hierarchy and progressive disclosure.
- Tables must remain usable on narrow screens.
- Charts must include accessible summaries.
- The interface must never resemble an unstyled spreadsheet.
- Empty states must lead to a useful next action.
- Loading states must preserve context and layout.
- Stale calculations must remain visible but clearly labeled.

---

## 15. Web Requirements

Web must support:

- Full structure editing
- Side-by-side comparison
- Wide sources-and-uses tables
- Payment and draw schedules
- Document review beside extracted terms
- Keyboard navigation
- Bulk editing where safe
- Export to PDF and spreadsheet
- Deep linking to a tranche, covenant, document, or condition

Browser refresh must preserve canonical saved state and restore the same meaningful location.

---

## 16. iPhone Requirements

The iPhone experience must prioritize field and negotiation use.

Required:

- Quick payment estimate
- Quick down-payment adjustment
- Quick rate and term comparison
- Cash-required summary
- Lender contact action
- Term-sheet photo/file upload
- Voice note
- Financing-task checklist
- Offline draft entry
- Background upload status
- Deep links from notifications

Complex tranche editing may use focused step-by-step screens, but no capability may be hidden permanently from iPhone if it is decision-critical.

---

## 17. iPad Requirements

The iPad experience must support:

- Split view with financing structure and source document
- Multi-column debt/equity comparison
- Drag and drop of term sheets and loan documents
- Keyboard shortcuts
- Pencil-compatible annotation where supported
- Wide payment schedules
- Deal Cockpit and FinanceIQ side by side
- No stretched iPhone layouts

---

## 18. Offline, Sync, Freshness, and Conflict Rules

### 18.1 Offline

Users may create and edit draft financing structures offline.

Offline limitations must be explicit for:

- Recalculation requiring backend engine
- Provider data retrieval
- Document extraction
- Report generation
- Collaboration updates

### 18.2 Sync

- Local changes must queue with version metadata.
- Retries must be idempotent.
- Newer canonical versions may not be overwritten silently.
- Conflicts require field-level or structure-level resolution.
- Both versions must be preserved until resolved.

### 18.3 Freshness

The UI must display:

- Financing terms as-of date
- Quote expiration
- Commitment expiration
- Underwriting calculation date
- Whether calculation uses latest active terms
- Whether a new document created unresolved conflicts

A recommendation or maximum offer based on superseded financing must be labeled stale until recalculated.

---

## 19. Domain Events

FinanceIQ consumes at minimum:

- `deal.created`
- `deal.stage.changed`
- `property.updated`
- `underwriting.snapshot.created`
- `underwriting.result.completed`
- `strategy.selected`
- `strategy.ranking.changed`
- `offer.updated`
- `contract.updated`
- `appraisal.updated`
- `inspection.updated`
- `governance.finding.updated`
- `document.added`
- `document.extraction.completed`

FinanceIQ emits at minimum:

- `financing.structure.created`
- `financing.structure.updated`
- `financing.structure.activated`
- `financing.structure.superseded`
- `financing.quote.added`
- `financing.quote.expiring`
- `financing.condition.added`
- `financing.condition.satisfied`
- `financing.condition.failed`
- `financing.document.added`
- `financing.terms.conflict_detected`
- `financing.feasibility.changed`
- `financing.recalculation.requested`
- `financing.recalculation.completed`
- `financing.recalculation.failed`

All event consumption must be idempotent.

---

## 20. Notifications and Tasks

FinanceIQ may create:

- Quote expiration reminder
- Commitment expiration reminder
- Application deadline
- Rate-lock expiration
- Appraisal deadline
- Insurance deadline
- Environmental deadline
- Document request
- Condition due date
- Reserve funding deadline
- Closing-funds deadline
- Maturity warning
- Extension deadline
- Covenant test reminder
- Refinance window reminder

Notifications must deep-link to the exact Deal, structure, condition, or document.

---

## 21. Permissions

Minimum permissions:

- View financing
- Create structure
- Edit structure
- Activate structure
- Add documents
- Verify terms
- Manage conditions
- Export financing reports
- View sensitive guarantor information
- Manage equity participants
- Admin override

Sensitive borrower, guarantor, credit, net-worth, liquidity, and investor information must receive stricter authorization and logging.

---

## 22. Security and Privacy

- Enforce workspace isolation with RLS.
- Use authorized storage access.
- Never expose service-role secrets.
- Encrypt sensitive local iOS data appropriately.
- Avoid logging sensitive borrower, guarantor, bank, tax, or investor information.
- Audit access to highly sensitive financing records.
- Rate-limit document extraction and expensive calculations.
- Validate file type and scan uploads according to platform security standards.
- Do not send sensitive documents to an AI provider unless the configured policy permits it.

---

## 23. Error Handling

Errors must distinguish:

- Invalid term
- Missing required input
- Inconsistent sources and uses
- Funding gap
- Formula failure
- Provider failure
- Document extraction failure
- Permission denied
- Expired quote
- Version conflict
- Offline limitation
- Background timeout
- Internal error

Every error must state:

- What failed
- What was preserved
- Whether the Deal decision is affected
- Whether the last valid calculation remains available
- How to recover
- Support reference ID where appropriate

A failed recalculation must not erase the last valid result.

---

## 24. Performance Requirements

- FinanceIQ overview should render promptly from canonical stored outputs.
- Large payment schedules must be paginated or virtualized.
- Comparison of common structures should complete within an acceptable interactive threshold.
- Heavy calculations must run asynchronously where appropriate.
- Long-running jobs must expose progress and timeout handling.
- Cached outputs must include invalidation and freshness rules.

---

## 25. Accessibility

- Meet WCAG 2.2 AA on web.
- Support VoiceOver and Dynamic Type on iOS/iPadOS.
- Do not communicate financing risk through color alone.
- Tables require accessible headers and alternatives.
- Charts require text summaries.
- Validation errors must be announced and linked to fields.
- Focus must move logically through complex forms.
- Reduced-motion settings must be respected.

---

## 26. Reporting and Exports

Required outputs:

- Financing summary
- Sources and uses
- Debt schedule
- Fee summary
- Reserve summary
- Covenant summary
- Condition checklist
- Structure comparison
- Refinance summary
- Equity waterfall summary where supported
- Lender/partner questions
- Verification checklist

All reports and exports must reconcile exactly to canonical FinanceIQ and underwriting outputs.

---

## 27. Acceptance Tests

At minimum:

1. Create a conventional mortgage structure.
2. Save, reopen, and edit it.
3. Add taxes, insurance, HOA, mortgage insurance, and closing costs.
4. Confirm cash-required and payment outputs reconcile.
5. Create a DSCR structure and verify DSCR gating.
6. Create a commercial loan with interest-only, balloon, reserves, and prepayment.
7. Create a construction loan with draw schedule and interest reserve.
8. Create seller-financing terms.
9. Create a multi-tranche debt structure.
10. Create debt plus preferred equity plus common equity.
11. Compare at least three structures.
12. Activate one structure and confirm targeted re-underwriting.
13. Upload a term sheet and extract terms with source links.
14. Detect conflict between extracted and active terms.
15. Mark unclear language for verification.
16. Expire a quote and confirm stale/expired behavior.
17. Test failed recalculation without losing prior valid output.
18. Test offline draft entry and later sync.
19. Test concurrent editing conflict.
20. Verify web, iPhone, iPad, report, and export consistency.
21. Verify cross-workspace access is denied.
22. Verify all visible controls work end to end.

---

## 28. Regression Tests

Protect against:

- Duplicate debt tranches after retry
- Double-counted fees
- Double-counted reserves
- Client-side payment drift
- Incorrect balloon balance
- Incorrect interest-only transition
- Incorrect variable-rate application
- Stale quote shown as active
- Superseded structure remaining attached to current underwriting
- Report mismatch
- Lost offline changes
- Silent conflict overwrite
- Orphaned financing documents
- Cross-workspace leakage
- Notification opening wrong Deal or condition
- Failed job remaining indefinitely in processing

---

## 29. Definition of Done

FinanceIQ is complete only when:

- Simple and complex financing structures can be created.
- All terms persist and reopen correctly.
- Canonical underwriting performs authoritative calculations.
- Multiple structures compare consistently.
- Financing feasibility identifies binding constraints.
- Documents and emails can update the record through verified extraction.
- Unclear or conflicting terms are marked for verification.
- Active financing changes trigger targeted recalculation.
- Web, iPhone, iPad, reports, exports, and admin reconcile.
- Offline, retry, stale, conflict, and failure states work.
- RLS and sensitive-data controls pass.
- Accessibility requirements pass.
- Required automated and manual tests pass.
- No dead controls, fake results, disconnected modules, or stale unlabeled outputs remain.

Codex must end implementation with exact files changed, migrations, APIs/functions, tests, commands and results, known limitations, confirmation that unrelated files were not changed, and either:

`CHAPTER COMPLETE`

or

`CHAPTER NOT COMPLETE`
