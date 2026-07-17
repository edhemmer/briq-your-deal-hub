# BRIX Specification 006 — Strategy Intelligence Engine

## 1. Authority and Rules of Engagement

Governed by `docs/00-START-HERE.md` through `docs/05-BUILD-ROADMAP.md` and Specifications 001–005.

Rules:

1. Strategy Intelligence consumes canonical Property, Deal, accepted assumptions, authoritative underwriting results, market, financing, governance, and other verified findings.
2. Strategy ranking is deterministic for the same inputs and strategy-engine version.
3. AI may explain results but may not assign authoritative scores, hard disqualifiers, or financial outputs.
4. The user-selected strategy must be evaluated but may not receive an artificial ranking advantage.
5. Hard disqualifiers must remain visible and cannot be hidden by a favorable aggregate score.
6. Every strategy has a permanent ID, version, compatibility contract, required inputs, formulas, disqualifiers, risk model, output contract, and RELearnIQ content.
7. Missing or low-confidence inputs reduce confidence and may block a strategy; they may not be silently defaulted.
8. Rankings preserve history and become stale when dependent accepted inputs change.
9. User preference and system ranking are distinct records.
10. New strategies are added through the registry, not hardcoded independently in clients.
11. Web, iPhone, iPad, reports, and portfolio views consume the same canonical ranking result.
12. The engine must identify why a strategy fits, why it does not, and what could change the result.

## 2. Mission

Evaluate the intended investment strategy and every compatible alternative, identify hard constraints and execution risk, rank viable strategies transparently, and explain the strongest path without replacing investor judgment.

## 3. Strategy Registry Contract

Each registry entry includes:

- Permanent strategy ID
- Version
- Name and category
- Description
- Supported property types
- Supported jurisdictions/conditions where relevant
- Required inputs
- Optional inputs
- Underwriting model/output dependencies
- Financing dependencies
- Market dependencies
- Governance/legal dependencies
- Hard disqualifiers
- Soft constraints
- Risk dimensions
- Operating burden
- Time horizon
- Liquidity profile
- Scoring model/version
- Output contract
- RELearnIQ content ID/version
- Active/deprecated status

Deprecated strategy versions remain available for historical reproduction.

## 4. Strategy Scope

### Residential

- Long-term rental
- Medium-term rental
- Short-term rental
- Rent by room
- Co-living
- Student housing
- Senior housing
- House hack
- BRRRR
- Fix and flip
- Live-in flip
- Buy and hold
- Light/heavy value add
- Build to rent
- New construction
- Seller-financed acquisition
- Lease option
- Subject-to where lawful
- Wrap where lawful

### Multifamily

- Stabilized hold
- Light/heavy value add
- Repositioning
- Refinance and hold
- Condo conversion
- Portfolio acquisition
- Syndication evaluation

### Commercial and specialty

- Stabilized office/medical office
- Retail/NNN
- Industrial/warehouse/flex
- Self-storage
- Hospitality
- Mixed use
- Mobile-home/RV park
- Owner-user
- Commercial value add
- Adaptive reuse
- Sale leaseback
- Ground lease

### Land and development

- Raw land hold
- Land banking
- Agricultural/timber/recreational hold
- Entitlement
- Subdivision
- Horizontal/vertical development
- Infill
- Build-to-rent community
- Assemblage
- Conservation/easement evaluation where relevant

### Distressed and transaction structures

- REO
- Foreclosure
- Tax sale
- Probate/estate
- Short sale
- Distressed note
- Joint venture
- Syndication
- 1031 replacement evaluation
- Opportunity-zone evaluation
- Assumption of debt

A strategy is not considered supported until its registry contract, calculations, risks, education, and acceptance fixtures exist.

## 5. Compatibility Evaluation

Compatibility checks include:

- Property type and physical characteristics
- Zoning/legal use
- Governance restrictions
- Rental/occupancy rules
- Market demand/liquidity
- Financing availability
- Investor capital and experience
- Time horizon
- Operational burden
- Renovation/development requirements
- Exit feasibility
- Data completeness

Compatibility result:

- Compatible
- Compatible with Conditions
- Uncertain
- Incompatible
- Not Evaluated

Each result identifies reasons and missing inputs.

## 6. Hard Disqualifiers

Examples:

- Prohibited use or rental type
- Property type incompatible with strategy
- Required financing unavailable or infeasible
- Investor capital exceeds configured maximum
- Minimum DSCR/debt yield not met
- Required permits/entitlements impossible or denied
- Association restriction
- Physical/site limitation
- Legal/jurisdictional prohibition
- Negative project margin below configured floor
- Deadline/timing incompatible with execution

Disqualifiers include source, date, confidence, verification, severity, and whether professional review is required.

## 7. Scoring Dimensions

Where compatible, evaluate:

- Financial return
- Cash flow
- Capital efficiency
- Equity creation
- Financing feasibility
- Market fit
- Legal/governance feasibility
- Execution complexity
- Operational burden
- Time to cash flow
- Time horizon fit
- Liquidity/exit
- Downside exposure
- Sensitivity
- Evidence confidence
- Investor fit

Weights are versioned and strategy-aware. A single universal score must not erase dimension detail.

## 8. Investor Fit Profile

Investor objectives/preferences may include:

- Available capital
- Required reserves
- Income versus appreciation preference
- Minimum cash flow/return
- Maximum leverage
- Risk tolerance
- Desired involvement
- Experience
- Hold period
- Geographic scope
- Property-type preference
- Renovation/development appetite
- Liquidity need
- Tax/professional considerations as user-provided constraints

Investor fit affects ranking but does not change underlying property facts or underwriting outputs.

## 9. Result Contract

Each `strategy_result` includes:

- Strategy/version
- Scenario/snapshot IDs
- Compatibility
- Hard disqualifiers
- Dimension scores
- Weighted total where used
- Financial outputs referenced from underwriting
- Key strengths
- Key weaknesses
- Binding constraints
- Missing inputs
- Confidence
- Sensitivity summary
- Required professional verification
- Suggested next actions
- Created time
- Engine version

`strategy_ranking` preserves ordered results and ranking rationale.

## 10. Confidence Model

Confidence considers:

- Input completeness
- Source classification
- Source freshness
- Conflicts
- Model support maturity
- Market data quality
- Financing certainty
- Governance/legal uncertainty
- Property condition uncertainty

Confidence must not be presented as probability of success unless specifically modeled and validated.

## 11. Ranking Workflow

1. Select active underwriting snapshot/result.
2. Load active registry versions.
3. Determine property/Deal compatibility candidates.
4. Validate required inputs.
5. Apply hard disqualifiers.
6. Reference authoritative financial outputs.
7. Score remaining dimensions.
8. Apply investor-fit weights.
9. Calculate confidence.
10. Rank viable strategies.
11. Store immutable result/ranking.
12. Compare with prior ranking.
13. Emit material-change event.
14. Update Decision Cockpit and connected views.

## 12. Material Change Rules

A material ranking/recommendation change may result from:

- Strategy winner changes
- Hard disqualifier added/removed
- Score crosses configured threshold
- Cash/return/risk changes materially
- Confidence changes materially
- Financing/governance/market condition changes
- New accepted inspection/appraisal/contract evidence

Thresholds are versioned and must avoid noisy notifications.

## 13. Strategy Comparison UX

Comparison includes:

- Compatibility and disqualifiers
- Cash required
- Cash flow
- Returns
- Financing feasibility
- Execution complexity
- Operating burden
- Time horizon
- Risk dimensions
- Confidence
- Missing information
- Next actions

Users can:

- Compare baseline and scenarios
- Inspect score explanations
- Open underlying assumptions/calculations/evidence
- Select preferred strategy
- Record override/rationale
- Request targeted analysis

User preference is visibly distinct from system ranking.

## 14. Guided and Professional Modes

Guided:

- Plain-language strategy explanation
- Fit/non-fit reasons
- Required inputs
- Common mistakes
- Suggested next step
- RELearnIQ links

Professional:

- Detailed dimensions and weights
- Scenario and version comparison
- Disqualifier/source detail
- Sensitivity and lineage
- Exportable comparison

## 15. Stale, Conflict, and Failure States

- Ranking becomes stale when active underwriting or accepted dependencies change.
- Prior ranking remains visible and labeled.
- Conflicting inputs may block affected strategies or reduce confidence.
- Failed re-ranking does not erase prior result.
- Missing data shows exactly what is required and how it may affect ranking.
- Offline clients may view cached rankings but cannot claim current reprocessing.

## 16. API and Engine Boundary

Server-owned endpoint/job:

- Auth/permission
- Active snapshot/result reference
- Registry/version selection
- Investor profile version
- Idempotency
- Background execution for large portfolios
- Durable results
- Structured validation/errors
- Domain events
- Usage metering

No client-side authoritative ranking.

## 17. Domain Events

- `strategy.evaluation_requested`
- `strategy.evaluation_completed`
- `strategy.evaluation_failed`
- `strategy.ranking_stale`
- `strategy.ranking_changed`
- `strategy.disqualifier_changed`
- `strategy.user_preference_changed`

Consumers: Decision Cockpit, notifications, reports, portfolio, OfferIQ, tasks, timeline.

## 18. Security and Audit

- Workspace-scoped results.
- Permission required to run, activate, or override.
- Overrides and rationale audited.
- Engine configurations/version changes are controlled and audited.
- Expensive evaluations rate-limited/metered.

## 19. Testing Requirements

- Registry validation tests.
- Compatibility and disqualifier fixtures.
- Deterministic ranking fixtures.
- Investor-fit weighting tests.
- Confidence tests.
- Missing/conflicting input tests.
- Material-change threshold tests.
- Underwriting integration tests.
- Web/iOS/report/portfolio reconciliation.
- Property-type and strategy golden scenarios.
- Performance tests for portfolio evaluation.

## 20. Verification and Validation

### Functional verification

- Every active strategy has complete registry metadata, model dependencies, disqualifiers, outputs, and education.
- Selected strategy is evaluated without unfair preference.
- Hard disqualifiers work and remain visible.
- Ranking is deterministic.

### Integration verification

- Underwriting values are referenced, not recalculated.
- Market, finance, governance, contract, inspection, and appraisal dependencies change only affected results.
- Decision Cockpit, OfferIQ, reports, portfolio, notifications, timeline, web, iPhone, and iPad reconcile.

### State verification

- Current, stale, blocked, incomplete, conflict, processing, failed, and cached-offline states are accurate.
- Prior valid rankings remain accessible.

### UX verification

- Users can understand why each strategy fits or fails.
- Guided and professional modes use identical canonical results.
- Evidence and calculation drill-down preserve Deal context.

### Definition of Done

Complete only when deterministic fixtures, registry completeness, cross-module propagation, historical reproducibility, and supported-client experiences pass without hidden disqualifiers or client-side ranking logic.

**SPECIFICATION STATUS: REVIEWED AND REPAIRED**
