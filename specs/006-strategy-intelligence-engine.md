# BRIX Specification 006 — Strategy Intelligence Engine

## Authority

This specification is part of the BRIX production build package. Codex must read and follow:

- `docs/00-START-HERE.md`
- `docs/01-PRODUCT-CONSTITUTION.md`
- `docs/02-ENGINEERING-STANDARDS.md`
- `docs/03-DATA-ARCHITECTURE.md`
- `docs/04-UI-UX-SYSTEM.md`
- `docs/05-BUILD-ROADMAP.md`
- `specs/003-deals-and-pdrm-core.md`
- `specs/004-property-intake-and-source-tracking.md`
- `specs/005-deterministic-underwriting-engine.md`

This specification controls all strategy registration, compatibility, evaluation, scoring, ranking, explanation, comparison, persistence, and recalculation behavior in BRIX.

---

# 1. Permanent Rules for This Specification

Before implementing any part of this specification, Codex must reapply the following rules:

1. One canonical Deal owns all strategy scenarios.
2. One canonical underwriting engine produces all authoritative financial outputs.
3. AI may explain strategy results but may not calculate, score, rank, disqualify, or silently alter them.
4. A user-selected strategy is evaluated but is never automatically favored.
5. Hard legal, physical, financing, governance, or data disqualifiers may not be hidden by a high score.
6. Every strategy result must preserve inputs, engine version, strategy version, evidence version, timestamp, status, and history.
7. Every recommendation must distinguish confirmed facts, estimates, assumptions, unresolved conflicts, and missing information.
8. Strategy results must be consistent across web, iPhone, iPad, reports, exports, notifications, and admin.
9. New evidence must trigger only the strategy evaluations materially affected by that evidence.
10. No strategy module may maintain a shadow calculation engine or duplicate Deal assumptions.
11. A stale strategy result may remain visible for comparison, but it must be visibly labeled stale and may not be presented as current.
12. Every strategy screen must identify the next action required to improve confidence or resolve a disqualifier.

---

# 2. Mission

The Strategy Intelligence Engine determines which real estate investment strategies are legally, physically, financially, operationally, and strategically viable for a specific Deal.

The engine must answer:

- Which strategies are compatible with this property?
- Which strategies are currently disqualified, and why?
- Which strategies are viable but weak?
- Which strategy best fits the investor’s objectives?
- Which strategy has the strongest risk-adjusted financial profile?
- Which strategy requires the least cash?
- Which strategy offers the strongest cash flow?
- Which strategy offers the greatest equity creation?
- Which strategy is most resilient under downside assumptions?
- What missing information could materially change the ranking?
- What evidence or professional verification is still required?

BRIX recommends. The investor decides.

---

# 3. Business Purpose

Most investors evaluate a property through one preferred lens. BRIX must evaluate the intended strategy and every other compatible strategy using the same canonical property facts, evidence, financing, and underwriting assumptions.

The engine exists to prevent:

- Forcing a property into an unsuitable strategy
- Ignoring a stronger alternative use
- Confusing high projected return with high probability of success
- Overlooking legal or governance restrictions
- Using incomplete assumptions as if they were verified
- Recommending a strategy that exceeds the investor’s capital, experience, time, or operating capacity
- Continuing to recommend a strategy after inspection, appraisal, financing, contract, or market evidence changes the Deal

---

# 4. Scope

## 4.1 In Scope

- Strategy registry
- Strategy versions
- Property and use compatibility
- Required inputs
- Required evidence
- Hard disqualifiers
- Soft constraints
- Deterministic scoring
- Deterministic ranking
- Investor-fit scoring
- Risk-adjusted comparison
- Confidence scoring
- Missing-information analysis
- Strategy scenario creation
- Baseline, upside, downside, and custom scenarios
- Strategy result persistence
- Recalculation triggers
- Stale-result handling
- Recommendation generation from deterministic outputs
- User overrides and decisions
- RELearnIQ connections
- Reports, exports, dashboard, and notification integration

## 4.2 Out of Scope

- Authoritative property calculations, which belong to Specification 005
- Legal advice
- Tax advice
- Securities advice
- Lender approval
- Appraisal conclusions
- Inspection conclusions
- Guaranteed market predictions
- Automated execution of acquisitions, financing, or dispositions

---

# 5. Canonical Strategy Registry

Every strategy must have a permanent identifier. Display names may change. Identifiers may not.

## 5.1 Residential Strategies

- `STRAT-LTR` — Long-Term Rental
- `STRAT-MTR` — Medium-Term Rental
- `STRAT-STR` — Short-Term Rental
- `STRAT-ROOM` — Rent by Room
- `STRAT-COLIVING` — Co-Living
- `STRAT-STUDENT` — Student Housing
- `STRAT-SENIOR` — Senior-Oriented Rental
- `STRAT-HOUSEHACK` — House Hack
- `STRAT-BRRRR` — Buy, Rehab, Rent, Refinance, Repeat
- `STRAT-FLIP` — Fix and Flip
- `STRAT-LIVEFLIP` — Live-In Flip
- `STRAT-BUYHOLD` — Buy and Hold
- `STRAT-VALUEADD-RES` — Residential Value Add
- `STRAT-BTR` — Build to Rent
- `STRAT-NEWCON-RES` — Residential New Construction
- `STRAT-SELLERFIN-BUY` — Seller-Financed Acquisition
- `STRAT-LEASEOPTION-BUY` — Lease Option Acquisition
- `STRAT-SUBJECTTO` — Subject-To Acquisition, where lawful
- `STRAT-WRAP` — Wrap Financing, where lawful
- `STRAT-OO-CONVERT` — Owner-Occupant Conversion

## 5.2 Multifamily Strategies

- `STRAT-MF-STABILIZED`
- `STRAT-MF-LIGHTVALUEADD`
- `STRAT-MF-HEAVYVALUEADD`
- `STRAT-MF-REPOSITION`
- `STRAT-MF-REFI-HOLD`
- `STRAT-MF-CONDO-CONVERT`
- `STRAT-MF-MIXED-CONVERT`
- `STRAT-MF-SYNDICATION`
- `STRAT-MF-PORTFOLIO`

## 5.3 Commercial Strategies

- `STRAT-OFFICE-STABILIZED`
- `STRAT-OFFICE-MEDICAL`
- `STRAT-RETAIL`
- `STRAT-NNN`
- `STRAT-INDUSTRIAL`
- `STRAT-WAREHOUSE`
- `STRAT-FLEX`
- `STRAT-SELFSTORAGE`
- `STRAT-HOSPITALITY`
- `STRAT-MIXEDUSE`
- `STRAT-MHP`
- `STRAT-RVPARK`
- `STRAT-ADAPTIVE-REUSE`
- `STRAT-SALE-LEASEBACK`
- `STRAT-GROUNDLEASE`
- `STRAT-OWNERUSER`
- `STRAT-COMM-VALUEADD`
- `STRAT-TENANT-REPOSITION`

## 5.4 Land and Development Strategies

- `STRAT-LAND-HOLD`
- `STRAT-LAND-BANK`
- `STRAT-AG-HOLD`
- `STRAT-TIMBER`
- `STRAT-RECREATIONAL-LAND`
- `STRAT-ENTITLEMENT`
- `STRAT-SUBDIVISION`
- `STRAT-HORIZONTAL-DEV`
- `STRAT-VERTICAL-DEV`
- `STRAT-INFILL-DEV`
- `STRAT-BTR-COMMUNITY`
- `STRAT-ASSEMBLAGE`

## 5.5 Distressed and Advanced Structures

- `STRAT-REO`
- `STRAT-FORECLOSURE`
- `STRAT-TAXSALE`
- `STRAT-PROBATE`
- `STRAT-ESTATE-SALE`
- `STRAT-SHORTSALE`
- `STRAT-DISTRESSED-NOTE`
- `STRAT-JV`
- `STRAT-SYNDICATION`
- `STRAT-1031-REPLACEMENT`
- `STRAT-OPPORTUNITY-ZONE`
- `STRAT-ASSUMABLE-DEBT`
- `STRAT-PORTFOLIO-ACQUISITION`

New strategies require a new immutable ID, registry record, version, required-input contract, disqualifier contract, score contract, tests, and RELearnIQ content.

---

# 6. Canonical Data Model

The implementation must conform to the canonical data architecture. Minimum entities:

## 6.1 `strategy_definitions`

Required fields:

- `id`
- `strategy_code`
- `version`
- `display_name`
- `category`
- `description`
- `status`
- `supported_property_types`
- `supported_use_types`
- `jurisdiction_scope`
- `required_input_contract`
- `required_evidence_contract`
- `disqualifier_contract`
- `score_contract`
- `output_contract`
- `education_content_id`
- `effective_from`
- `effective_to`
- `created_at`
- `updated_at`

Published strategy versions are immutable.

## 6.2 `strategy_scenarios`

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `strategy_definition_id`
- `strategy_code`
- `strategy_version`
- `name`
- `scenario_type`
- `status`
- `is_user_selected`
- `is_system_generated`
- `assumption_set_id`
- `financing_structure_id`
- `created_by`
- `created_at`
- `updated_at`
- `archived_at`

## 6.3 `strategy_evaluations`

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `strategy_scenario_id`
- `underwriting_snapshot_id`
- `underwriting_result_id`
- `strategy_code`
- `strategy_version`
- `evaluation_version`
- `status`
- `compatibility_status`
- `financial_feasibility_status`
- `operational_feasibility_status`
- `confidence_score`
- `overall_score`
- `rank`
- `score_breakdown`
- `hard_disqualifiers`
- `soft_constraints`
- `missing_information`
- `binding_factors`
- `recommendation_class`
- `evaluated_at`
- `stale_at`
- `superseded_by_id`
- `engine_version`
- `input_hash`

## 6.4 `strategy_decisions`

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `strategy_scenario_id`
- `decision`
- `reason`
- `decided_by`
- `decided_at`
- `system_recommendation_at_decision`
- `override_flag`
- `override_reason`
- `supersedes_id`

Decisions are append-only. Corrections create a new decision.

## 6.5 `strategy_evaluation_events`

Record:

- evaluation requested
- evaluation started
- evaluation completed
- evaluation partially completed
- evaluation failed
- evaluation marked stale
- ranking changed
- disqualifier added
- disqualifier removed
- user selected strategy changed
- user override recorded

---

# 7. Evaluation Pipeline

Every applicable strategy must pass through the same deterministic pipeline.

## Phase 1 — Applicability

Determine whether the strategy applies to the property type, use type, jurisdiction, Deal stage, and available property configuration.

Outputs:

- applicable
- not applicable
- uncertain pending verification

## Phase 2 — Legal and Governance Compatibility

Evaluate known:

- zoning
- permitted use
- occupancy restrictions
- licensing
- HOA/COA/POA rules
- deed restrictions
- rental caps
- short-term rental restrictions
- parking restrictions
- unit count restrictions
- subdivision restrictions
- environmental restrictions
- lender restrictions

Unknown legal or governance data may produce `verification_required`; it may not be assumed favorable.

## Phase 3 — Physical Compatibility

Evaluate:

- property type
- unit count
- layout
- site size
- access
- parking
- utilities
- condition
- renovation scope
- conversion feasibility
- development capacity
- known structural constraints
- inspection findings

## Phase 4 — Financial Feasibility

Consume Specification 005 outputs. Evaluate:

- capital required
- debt service
- NOI
- cash flow
- DSCR
- cap rate
- cash-on-cash
- IRR
- equity multiple
- return on cost
- break-even occupancy
- refinance feasibility
- exit proceeds
- maximum offer
- sensitivity results

The Strategy Engine must not recalculate these values independently.

## Phase 5 — Market Compatibility

Evaluate known market inputs such as:

- demand
- rents
- vacancy
- absorption
- liquidity
- comparable supply
- seasonality
- employer concentration
- growth
- competing inventory
- exit-market depth

## Phase 6 — Operational Feasibility

Evaluate:

- investor experience
- available time
- management intensity
- contractor dependency
- staffing
- leasing burden
- licensing burden
- tenant complexity
- renovation complexity
- development complexity
- geographic distance
- investor risk tolerance

## Phase 7 — Financing Feasibility

Evaluate:

- loan type compatibility
- LTV/LTC constraints
- DSCR constraints
- recourse
- reserves
- construction draws
- balloon risk
- prepayment
- investor liquidity
- seller-financing availability
- partner/equity requirements

## Phase 8 — Risk Assessment

Evaluate at minimum:

- market risk
- financing risk
- execution risk
- construction risk
- legal risk
- governance risk
- environmental risk
- tenant risk
- concentration risk
- liquidity risk
- timeline risk
- data-quality risk

## Phase 9 — Confidence

Confidence is separate from attractiveness.

Confidence dimensions:

- property facts
- financial inputs
- market evidence
- financing evidence
- governance evidence
- inspection evidence
- appraisal evidence
- contract evidence
- legal verification

A high-return strategy with weak evidence must show low confidence.

## Phase 10 — Scoring and Ranking

Only strategies with no unresolved hard disqualifier may receive a normal rank.

Disqualified strategies appear separately with explicit reasons.

## Phase 11 — Recommendation

Required recommendation classes:

- strongest overall
- strongest cash flow
- strongest equity creation
- lowest capital requirement
- lowest execution complexity
- lowest downside risk
- highest confidence
- fastest exit
- alternative
- monitor
- not recommended
- disqualified

---

# 8. Hard Disqualifiers

Hard disqualifiers must be deterministic, source-linked, and versioned.

Examples:

- Prohibited zoning or use
- Enforceable association restriction
- Property configuration incompatible with strategy
- Required license unavailable
- Financing structure impossible under known terms
- Negative cash flow beyond user-defined tolerance when positive cash flow is mandatory
- DSCR below mandatory lender threshold
- Capital required above verified available capital when no viable financing alternative exists
- Development strategy without legal access or required utilities
- Short-term rental where prohibited
- Subdivision where minimum lot size makes subdivision impossible
- Refinance-dependent strategy where stabilized value cannot support projected debt
- Contract term prohibiting intended assignment when assignment is required

Each disqualifier must include:

- code
- title
- description
- source/evidence IDs
- effective date
- verification state
- whether user override is permitted
- required resolution

A user override may record a decision, but it may not erase the disqualifier.

---

# 9. Soft Constraints

Soft constraints reduce score or confidence but do not automatically disqualify.

Examples:

- Limited parking
- High management burden
- High renovation complexity
- Weak market liquidity
- Low reserve coverage
- Heavy reliance on appreciation
- High tenant concentration
- Short operating history
- Unverified market rent
- Long distance from investor
- Limited contractor availability
- High insurance uncertainty

---

# 10. Scoring Model

## 10.1 Scoring Principles

- Deterministic
- Versioned
- Explainable
- Property-type aware
- Strategy aware
- Investor-profile aware
- Resistant to missing-data distortion
- Never able to override a hard disqualifier

## 10.2 Standard Score Dimensions

Default 0–100 scores:

- financial return
- cash flow strength
- capital efficiency
- equity creation
- downside resilience
- financing feasibility
- market compatibility
- legal/governance feasibility
- operational fit
- liquidity/exit strength
- evidence confidence
- investor fit

Weights belong to the strategy version, not the client UI.

## 10.3 Missing Data

Missing data must not receive a neutral or favorable score by default.

The strategy definition must declare whether a missing input:

- blocks evaluation
- lowers confidence
- applies a conservative default
- requires user verification

## 10.4 Investor Fit

Investor fit may include:

- target cash flow
- target return
- available capital
- hold period
- risk tolerance
- experience
- time availability
- management preference
- renovation tolerance
- liquidity needs
- tax-deferred exchange need
- owner-occupancy intent

Investor fit may change rank but may not alter underlying financial results.

---

# 11. Scenario Model

Required scenario types:

- baseline
- downside
- upside
- lender case
- seller case
- user custom

Each strategy scenario must reference an immutable assumption set and underwriting snapshot.

Users may clone a scenario, but cloning must create a new scenario ID.

Scenario comparisons must clearly identify differing assumptions.

---

# 12. Recalculation and Stale-State Rules

Strategy evaluations must be marked stale when a relevant dependency changes.

Examples:

- purchase price
- rent
- vacancy
- expenses
- financing
- repair scope
- inspection finding
- appraisal
- governance restriction
- zoning
- contract condition
- investor target
- market evidence
- strategy version
- underwriting engine version

Rules:

- Mark stale immediately.
- Preserve the prior result.
- Show why it is stale.
- Queue targeted reevaluation.
- Prevent older jobs from overwriting newer results.
- Use idempotency keys and input hashes.
- Show processing status.
- On failure, retain prior result labeled stale and provide retry.

---

# 13. Domain Events

## Consumed

- `deal.created`
- `deal.stage.changed`
- `property.updated`
- `assumption_set.published`
- `underwriting.completed`
- `financing.updated`
- `market_evidence.updated`
- `governance.finding.confirmed`
- `contract.finding.confirmed`
- `inspection.finding.confirmed`
- `appraisal.accepted`
- `investor_profile.updated`

## Emitted

- `strategy.evaluation.requested`
- `strategy.evaluation.completed`
- `strategy.evaluation.failed`
- `strategy.evaluation.stale`
- `strategy.rank.changed`
- `strategy.disqualifier.added`
- `strategy.disqualifier.removed`
- `strategy.recommendation.changed`
- `strategy.user_selection.changed`
- `strategy.user_override.recorded`

Consumers must be idempotent.

---

# 14. API Contracts

Minimum server-side operations:

- list strategy definitions
- list applicable strategies for Deal
- create strategy scenario
- clone scenario
- update scenario metadata
- archive scenario
- request evaluation
- retrieve evaluation status
- retrieve current rankings
- retrieve historical rankings
- select preferred strategy
- record investor decision
- record override
- compare strategies

All write operations require workspace authorization and audit events.

Clients may not submit authoritative scores or rankings.

---

# 15. Premium Web UX

## 15.1 Strategy Overview

Show:

- selected strategy
- strongest overall strategy
- current recommendation
- result freshness
- confidence
- top three alternatives
- disqualified strategies count
- missing decision-changing information
- current processing state

## 15.2 Strategy Comparison

Provide sortable, filterable comparison across:

- acquisition price
- cash required
- monthly/annual cash flow
- NOI
- cap rate
- cash-on-cash
- DSCR
- IRR
- equity multiple
- profit
- hold period
- complexity
- risk
- confidence
- maximum offer
- primary disqualifier or constraint

The interface must not imply that a single score replaces the underlying metrics.

## 15.3 Strategy Detail

Required sections:

- recommendation summary
- why it fits
- why it may not fit
- key outputs
- assumptions
- risks
- disqualifiers
- missing information
- evidence
- sensitivity
- financing
- operational requirements
- next actions
- RELearnIQ link
- history

## 15.4 Guided and Professional Modes

Guided mode explains terms and implications.

Professional mode increases density and comparison efficiency.

Both modes use identical canonical data.

---

# 16. Native iPhone UX

The iPhone experience must prioritize quick decisions in the field.

Required:

- current strongest strategy card
- selected strategy card
- material change alert
- swipeable top alternatives
- major disqualifiers
- top missing inputs
- quick edit for approved assumptions
- open underwriting
- capture evidence
- open RELearnIQ
- mark preferred strategy
- record pass/proceed/monitor decision

No critical comparison may require unreadable desktop tables.

Offline behavior:

- show last synced result with timestamp
- mark local assumption edits unsynced
- prevent local display from claiming reevaluation completed until server result returns
- queue allowed edits safely

---

# 17. Native iPad UX

Use multi-column layouts to support:

- strategy list
- selected strategy detail
- comparison panel
- evidence/document review
- underwriting side-by-side

Support keyboard, pointer, drag and drop, split view, and stage manager where applicable.

Do not stretch the iPhone layout.

---

# 18. Error, Empty, Loading, and Conflict States

Required states:

- no applicable strategies
- insufficient data
- evaluation queued
- evaluation processing
- partial evaluation
- evaluation failed
- provider dependency failed
- underwriting stale
- strategy stale
- version conflict
- permission denied
- offline
- strategy definition retired
- unsupported property type

Every failure must state:

- what failed
- what remains valid
- whether the Deal decision is affected
- how to retry or continue manually
- support reference ID when applicable

No generic indefinite spinner is permitted.

---

# 19. Security and Authorization

- All records are workspace-scoped.
- RLS protects definitions where appropriate and all Deal-specific records.
- Published strategy definitions are read-only to normal users.
- Only authorized platform administrators may publish strategy versions.
- User decisions require Deal access.
- Overrides require reason and audit event.
- Cross-workspace evaluation access is prohibited.
- AI providers receive only required evidence and data.

---

# 20. Audit and History

Preserve:

- strategy version
- scoring version
- underwriting snapshot
- assumption set
- financing structure
- evidence set
- score breakdown
- rank
- recommendation
- disqualifiers
- confidence
- user decision
- override
- timestamp

The user must be able to review how and why a strategy ranking changed.

---

# 21. Reporting and Integration

Strategy output must integrate with:

- Dashboard
- Decision Cockpit
- Deal timeline
- OfferIQ
- FinanceIQ
- MarketIQ
- GovernanceIQ
- ContractIQ
- InspectionIQ
- AppraisalIQ
- ReportIQ
- Portfolio comparison
- RELearnIQ
- Notifications
- Admin usage monitoring

No strategy result may remain isolated inside the Strategy module.

---

# 22. Performance and Reliability

Targets:

- Cached strategy overview loads within normal interactive expectations.
- Evaluation request acknowledgment is immediate.
- Long evaluations run asynchronously.
- Status polling or realtime updates stop after terminal state.
- Large strategy sets are evaluated with bounded concurrency.
- Retry uses exponential backoff and idempotency.
- Failed evaluations do not erase valid prior results.
- Ranking updates are transactionally consistent.

---

# 23. Required Tests

## Unit Tests

- compatibility rules
- disqualifiers
- missing-data behavior
- score calculation
- weight application
- confidence calculation
- rank ordering
- tie breaking
- recommendation class
- investor-fit adjustments

## Contract Tests

- strategy definition schema
- evaluation input/output schema
- domain events
- API responses

## Database and RLS Tests

- workspace isolation
- role enforcement
- immutable published versions
- decision history
- override audit

## Integration Tests

- underwriting result to strategy evaluation
- governance restriction to disqualifier
- inspection change to stale status
- appraisal change to reevaluation
- investor profile change to ranking
- report reconciliation

## End-to-End Tests

1. Create Deal.
2. Complete baseline underwriting.
3. Evaluate applicable strategies.
4. Display ranked results.
5. Open strategy detail.
6. Select a strategy.
7. Change financing.
8. Confirm stale status.
9. Reevaluate.
10. Confirm ranking history.
11. Add governance restriction.
12. Confirm hard disqualifier.
13. Record user override.
14. Generate report.
15. Confirm report reconciliation.

## Native Tests

- iPhone current recommendation
- iPhone offline stale state
- iPad comparison layout
- deep links
- Dynamic Type
- VoiceOver

---

# 24. Acceptance Criteria

This specification is implemented only when:

- All registered strategies have permanent IDs and versioned contracts.
- Strategy evaluations consume canonical underwriting outputs.
- Hard disqualifiers are deterministic and source-linked.
- Missing data cannot artificially improve ranking.
- User-selected strategy is not automatically favored.
- Identical inputs produce identical scores and ranks.
- Web, iPhone, iPad, reports, and exports agree.
- New material evidence marks affected results stale.
- Reevaluation preserves history.
- Older jobs cannot overwrite newer results.
- Users can inspect score breakdown, assumptions, evidence, risks, and missing information.
- Users can record decisions and overrides without erasing system recommendations.
- Guided and professional modes use the same canonical result.
- Every visible control works end to end.
- No dead navigation, orphaned results, silent failures, or stale-as-current states remain.

---

# 25. Codex Completion Report

At implementation completion, Codex must provide:

1. Files changed
2. Database migrations
3. Strategy registry records created
4. API and Edge Function changes
5. Domain events added
6. Tests added
7. Exact commands and results
8. Performance results
9. Accessibility results
10. Known limitations
11. Confirmation that unrelated files were not changed
12. `CHAPTER COMPLETE` or `CHAPTER NOT COMPLETE`

Codex may not proceed to the next build specification until this chapter passes its validation and acceptance criteria.
