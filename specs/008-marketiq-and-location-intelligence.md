# BRIX Specification 008 — MarketIQ and Location Intelligence

## 1. Authority and Rules of Engagement

Governed by `docs/00-START-HERE.md` through `docs/05-BUILD-ROADMAP.md` and Specifications 001–007.

Rules:

1. MarketIQ provides evidence-backed market and location context; it does not replace the underwriting engine or make unsupported forecasts.
2. Every material conclusion retains source, geography, date, period, method, confidence, freshness, and limitations.
3. Historical, current, projected, and inferred data remain distinct.
4. Provider estimates may not be presented as confirmed facts.
5. A single metric may not support a broad safety, quality, or investment conclusion.
6. Market findings must connect to the canonical Deal, Property, assumptions, strategy, risks, tasks, and Decision Cockpit.
7. Provider failure must preserve prior valid data, expose stale state, and allow manual evidence.
8. Accepted market-driven assumption changes are versioned and trigger targeted re-underwriting.
9. Geography must be explicit: parcel, tract, neighborhood proxy, city, county, metro, state, or custom trade area.
10. Web, iPhone, iPad, reports, exports, and portfolio comparisons use the same canonical MarketIQ snapshot.
11. Data use, licensing, attribution, and retention requirements must be respected.
12. AI may summarize source-linked findings but may not invent local facts or certainty.

## 2. Mission

Explain how market conditions, location, convenience, growth, supply, demand, liquidity, taxes, insurance pressures, infrastructure, hazards, and local constraints affect the Deal and each investment strategy.

## 3. Canonical Model

### `market_snapshots`

- ID
- Workspace/Deal/Property IDs
- Geography definition
- As-of date
- Analysis period
- Workflow/model version
- Status
- Confidence
- Freshness
- Created by/time

### `market_metrics`

- Metric ID/type
- Snapshot ID
- Geography
- Period
- Value/unit
- Source/provider
- Retrieved/effective dates
- Classification
- Confidence
- Method
- Evidence/source reference

### `market_findings`

- Finding type
- Summary
- Impact
- Severity
- Applicable strategies
- Source metrics/evidence
- Confidence
- Verification state
- Suggested action

### `market_conflicts`

Preserve conflicting providers, periods, geographies, or methods until resolved or intentionally retained.

## 4. Geography Contract

Every metric/finding must state its geography.

Supported levels:

- Property/parcel
- Radius or drive-time area
- Census geography
- Neighborhood proxy
- Municipality
- County
- Metro/market
- State
- Custom trade area

The UI must explain when a geography is a proxy rather than an exact neighborhood boundary.

## 5. Population and Household Context

Where available:

- Population level/trend
- Household count/trend
- Household formation
- Age distribution
- Household size
- Migration
- Income and income trend
- Tenure/ownership mix

Avoid unsupported causal claims. Time period and source remain visible.

## 6. Employment and Economic Base

- Employment level/trend
- Unemployment
- Job growth
- Industry concentration
- Major employers
- Employer announcements/closures where reliably sourced
- Commuting patterns
- Labor-force participation
- Economic diversification

Concentration and announcement findings must include source and uncertainty.

## 7. Housing and Property Market

Where property-type appropriate:

- Inventory/supply
- New listings
- Pending/closed activity
- Sale prices and price trends
- Days on market
- Sale-to-list ratio
- Absorption
- Vacancy
- Rent levels/trends
- Concessions
- New construction and permits
- Pipeline/deliveries
- Cap-rate or transaction indicators
- Liquidity

Metrics must identify property type/class and avoid mixing incompatible segments.

## 8. Rental Demand and Operations

- Market rent indicators
- Rent distribution/range
- Vacancy/occupancy
- Seasonality
- Short-term rental demand/regulation where supported
- Employer/student/medical/tourism demand drivers
- Tenant profile indicators
- Lease-up/turnover context

Market rent does not silently replace user or lease data. It may create a proposal.

## 9. Taxes, Insurance, and Cost Pressure

- Property tax rates/history/assessment context
- Special districts/assessments where available
- Insurance hazard pressure
- Utility cost context
- Regulatory fees
- Labor/construction cost context
- Association prevalence where relevant

MarketIQ provides context; FinanceIQ/underwriting consume accepted assumptions.

## 10. Hazards and Environmental Context

- Flood
- Wildfire
- Wind/hail/hurricane
- Seismic
- Heat/drought/water stress
- Environmental sites
- Radon/soil/geologic indicators where sourced
- Industrial/rail/noise proximity

Findings must distinguish mapped indicators from property-specific professional determinations. Insurance, survey, engineering, environmental, or legal review may be recommended.

## 11. Convenience and Accessibility

- Grocery
- Healthcare
- Schools/education context
- Dining/retail
- Transit
- Airports
- Major roads
- Employment access
- Broadband
- Utilities
- Parks/recreation

Distance and travel time must state method and timestamp. Convenience must not be equated automatically with investment quality.

## 12. Infrastructure and Development Direction

- Planned roads/transit
- Utility expansion
- Major developments
- Public investment
- Permitting trends
- Zoning/land-use plans
- Annexation
- Development pipeline

Projected/planned items remain labeled and source-linked. Unfunded proposals cannot be presented as certain.

## 13. Crime and Safety Context

When included:

- Use reputable, appropriately granular sources.
- State period and geography.
- Avoid demographic proxies and discriminatory recommendations.
- Do not label a neighborhood safe/unsafe from one score.
- Present factual context and limitations.
- Support user-selected priorities without steering prohibited by law or policy.

## 14. Schools and Fair-Housing Boundaries

- Provide factual school assignment/metrics where legally and contractually appropriate.
- State source/date and assignment uncertainty.
- Avoid value judgments based on protected-class proxies.
- Allow users to inspect source data rather than receive discriminatory steering.

## 15. Strategy Impact

Market findings may affect:

- Rent/growth/vacancy assumptions
- Exit liquidity
- Hold period
- Short-term rental viability
- Development absorption
- Commercial tenant demand
- Financing/insurance feasibility
- Strategy confidence
- Visit priority

Changes require explicit accepted proposals before canonical assumptions change.

## 16. MarketIQ Workflow

1. Define Property and relevant geography.
2. Identify property type and strategy context.
3. Retrieve provider/public/user evidence.
4. Normalize metrics with provenance.
5. Detect stale, missing, and conflicting data.
6. Produce source-linked findings.
7. Identify decision-changing assumptions and verification needs.
8. Present findings for user review.
9. Accept/reject/edit proposals.
10. Trigger targeted re-underwriting/ranking when accepted.
11. Preserve prior snapshot and before/after recommendation.

## 17. User Experience

### Market summary

- Market thesis
- Key demand/supply indicators
- Liquidity
- Rent/sale context
- Growth/decline indicators
- Taxes/cost pressure
- Hazards/constraints
- Convenience/infrastructure
- Confidence/freshness
- Missing information

### Drill-down

Users can inspect source, geography, time series, methodology, conflicts, and strategy impact.

### iPhone

Compact market summary, map context, nearby items, source/freshness, and field-relevant concerns.

### iPad

Map, metrics, source detail, and Deal context in multi-column layout.

## 18. State Model

- Not requested
- Queued/processing
- Partial
- Current
- Current with conflicts
- Stale
- Provider unavailable
- Failed with prior snapshot
- Awaiting verification
- Offline cached

## 19. Provider Architecture

Each provider adapter defines:

- Supported geographies/metrics
- Authentication/secret handling
- Rate limits
- Licensing/attribution
- Caching/freshness
- Error mapping
- Retry/backoff
- Cost metering
- Data normalization

Provider output is untrusted until validated.

## 20. Domain Events

- `market.analysis_requested`
- `market.snapshot_completed`
- `market.snapshot_partial`
- `market.snapshot_failed`
- `market.snapshot_stale`
- `market.finding_created`
- `market.value_proposed`
- `market.value_accepted`

Consumers: underwriting, strategy, Cockpit, tasks, notifications, reports, portfolio, timeline.

## 21. Security and Privacy

- Workspace/Deal scope and RLS.
- Provider secrets server-side.
- Rate limits and cost controls.
- No prohibited personal profiling or discriminatory steering.
- Source content and licensed data handled according to terms.
- Sensitive location details protected where appropriate.

## 22. Testing Requirements

- Geography normalization tests.
- Metric/source/freshness tests.
- Provider adapter contract tests.
- Partial/outage/stale/conflict tests.
- Strategy/underwriting proposal integration tests.
- Fair-housing/unsafe-language tests.
- Web/iOS/report reconciliation.
- Map and accessibility tests.
- Performance/caching/rate-limit tests.

## 23. Verification and Validation

### Factual verification

- Every conclusion has source, geography, date, method, confidence, and limitations.
- Historical/current/projected/inferred states remain distinct.
- No unsupported safety, growth, or value claim appears.

### Functional verification

- Analysis runs, saves, reopens, refreshes, fails safely, and supports manual evidence.
- Provider failure preserves prior valid snapshot.
- Accepted proposals are explicit and versioned.

### Integration verification

- Accepted market changes flow to underwriting/strategy.
- Cockpit, reports, portfolio, tasks, notifications, timeline, web, iPhone, and iPad reconcile.
- MarketIQ does not duplicate calculations or canonical facts.

### UX verification

- Current, partial, stale, conflict, failed, offline, and verification-required states are clear.
- Users can inspect sources and impact without losing Deal context.

### Definition of Done

Complete only when market/location context is source-defensible, property/strategy-aware, non-discriminatory, resilient to provider failure, and seamlessly connected to the canonical Deal decision flow.

**SPECIFICATION STATUS: REVIEWED AND REPAIRED**
