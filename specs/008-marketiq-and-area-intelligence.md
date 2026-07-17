# BRIX Specification 008 — MarketIQ and Area Intelligence

## 1. Authority

This specification is part of the governing BRIX engineering package. Codex must read and follow:

- `docs/00-START-HERE.md`
- `docs/01-PRODUCT-CONSTITUTION.md`
- `docs/02-ENGINEERING-STANDARDS.md`
- `docs/03-DATA-ARCHITECTURE.md`
- `docs/04-UI-UX-SYSTEM.md`
- `docs/05-BUILD-ROADMAP.md`
- `specs/003-deals-and-pdrm-core.md`
- `specs/004-property-intake-and-source-tracking.md`
- `specs/005-deterministic-underwriting-engine.md`
- `specs/006-strategy-intelligence-engine.md`
- `specs/007-decision-cockpit-and-deal-workspace.md`

This specification defines the complete MarketIQ subsystem. It must not create a separate property record, duplicate Deal state, shadow assumptions, or an independent recommendation engine.

---

## 2. Mission

MarketIQ converts location, market, neighborhood, demographic, economic, infrastructure, supply, demand, environmental, tax, insurance, and liquidity evidence into a clear, source-linked market assessment for the active Deal.

MarketIQ must help the investor answer:

- Is this market growing, stable, softening, or structurally declining?
- Is demand broad and durable or dependent on one employer, industry, school, or project?
- Is the property located near assets that support value, occupancy, rent, resale, or operations?
- Are there location-specific risks that materially affect strategy, financing, insurance, operating cost, or exit liquidity?
- How current and reliable is the evidence?
- Which assumptions should change because of the market evidence?
- What must be verified before the investor proceeds?

MarketIQ provides decision support. It does not guarantee appreciation, rent growth, safety, liquidity, insurability, financing, or future performance.

---

## 3. Product Outcomes

A completed MarketIQ workflow must produce:

1. A concise market posture.
2. A neighborhood and location posture.
3. A property-type-specific demand assessment.
4. A liquidity and exit assessment.
5. Material positive drivers.
6. Material risk drivers.
7. Current data gaps.
8. Questions requiring verification.
9. Source-linked evidence.
10. Suggested changes to assumptions, subject to user acceptance.
11. Targeted strategy re-evaluation when market evidence materially changes compatibility or expected performance.
12. A versioned MarketIQ snapshot used by the Decision Cockpit and reports.

---

## 4. Permanent MarketIQ Rules

1. Every conclusion must link to evidence.
2. Every data point must retain source, geography, period, retrieval date, effective date, classification, confidence, and freshness.
3. Historical facts, current facts, forecasts, projections, estimates, and inferences must remain distinct.
4. A single indicator may not determine a market conclusion.
5. No score may hide material contrary evidence.
6. No broad statement such as “safe,” “unsafe,” “good area,” or “bad area” may be generated from a single crime, school, income, or demographic metric.
7. MarketIQ must be property-type aware.
8. MarketIQ must be strategy aware.
9. MarketIQ may suggest assumption changes but may not silently change underwriting.
10. Stale evidence must remain visible and clearly marked.
11. Provider failure must not erase prior valid evidence.
12. Conflicting sources must remain visible until resolved.
13. AI may explain evidence but may not invent facts, dates, projections, or source attribution.
14. All market conclusions must carry an `as_of` date.
15. Identical evidence and ruleset versions must produce identical deterministic ratings.

---

## 5. Scope

MarketIQ includes:

- Market geography resolution
- Trade-area and drive-time analysis
- Population and household trends
- Household formation
- Income and affordability
- Employment and employer concentration
- Industry concentration
- Job growth and wage trends
- Inbound and outbound migration indicators
- Housing and commercial supply
- Permitting and development pipeline
- Vacancy and occupancy
- Rent levels and rent trends
- Sale price and transaction trends
- Days on market and absorption
- Property tax environment
- Insurance pressure and hazard exposure
- Flood, wildfire, wind, hail, earthquake, heat, drought, and environmental context where relevant
- Crime and public safety context
- Schools and education access
- Healthcare access
- Grocery, dining, retail, recreation, and daily convenience
- Transit, airports, roads, rail, ports, and logistics access
- Broadband, utilities, sewer, water, and infrastructure
- Major planned projects
- Zoning and land-use direction
- Employer announcements, closures, expansions, or layoffs when verified
- Market liquidity and exit feasibility
- Property-type-specific demand indicators
- Source freshness, conflicts, and confidence
- Market reports, maps, charts, and comparison views

MarketIQ does not include final legal interpretation, environmental engineering, formal appraisal, inspection conclusions, lender approval, insurance underwriting, or guaranteed forecasts.

---

## 6. Dependencies

MarketIQ depends on:

- Canonical `workspace_id`
- Canonical `property_id`
- Canonical `deal_id`
- Geocoded property location
- Parcel and property-type classification
- Intended and alternative strategies
- Existing source-tracking infrastructure
- Canonical assumptions
- Domain event infrastructure
- Background job infrastructure
- Maps and geospatial services
- Document/evidence storage
- Authorization and RLS

MarketIQ outputs are consumed by:

- Decision Cockpit
- Underwriting
- Strategy Intelligence
- FinanceIQ
- OfferIQ
- GovernanceIQ
- ReportIQ
- Portfolio comparison
- Notifications and tasks
- Admin usage monitoring

---

## 7. Canonical Data Model

Codex must reuse the canonical data architecture. Recommended entities follow.

### 7.1 `market_profiles`

One current logical profile per Deal and geography scope.

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `property_id`
- `scope_type`
- `scope_name`
- `geography_identifier`
- `geometry`
- `as_of`
- `status`
- `confidence`
- `ruleset_version`
- `current_snapshot_id`
- `created_at`
- `updated_at`

Supported `scope_type` values:

- parcel
- immediate_area
- neighborhood
- custom_radius
- drive_time
- municipality
- county
- metro
- region
- trade_area
- submarket
- school_district
- user_defined

### 7.2 `market_evidence`

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `property_id`
- `market_profile_id`
- `metric_code`
- `category`
- `value_numeric`
- `value_text`
- `unit`
- `period_start`
- `period_end`
- `effective_date`
- `retrieved_at`
- `source_id`
- `source_record_id`
- `source_url`
- `classification`
- `confidence`
- `freshness_state`
- `geography_type`
- `geography_identifier`
- `methodology`
- `license_metadata`
- `raw_payload_reference`
- `is_current`
- `superseded_by_id`
- `created_at`

### 7.3 `market_findings`

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `market_profile_id`
- `finding_code`
- `category`
- `title`
- `summary`
- `impact_type`
- `severity`
- `confidence`
- `status`
- `as_of`
- `ruleset_version`
- `requires_verification`
- `verification_question`
- `created_at`
- `updated_at`

`impact_type` values:

- positive_driver
- negative_driver
- neutral_context
- hard_constraint
- data_gap
- conflict
- watch_item

### 7.4 `market_finding_evidence`

Many-to-many link between findings and evidence.

### 7.5 `market_snapshots`

Immutable versioned output.

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `market_profile_id`
- `snapshot_version`
- `ruleset_version`
- `input_hash`
- `as_of`
- `market_posture`
- `demand_posture`
- `supply_posture`
- `liquidity_posture`
- `risk_posture`
- `confidence`
- `summary_json`
- `created_at`
- `created_by`

### 7.6 `market_assumption_suggestions`

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `snapshot_id`
- `assumption_code`
- `current_value`
- `suggested_value`
- `unit`
- `reason`
- `confidence`
- `evidence_ids`
- `status`
- `accepted_at`
- `accepted_by`
- `rejected_at`
- `rejected_by`

The suggestion must never overwrite an assumption until accepted through the canonical assumption workflow.

### 7.7 `market_provider_jobs`

Track provider retrieval and processing.

Required states:

- queued
- running
- partial
- complete
- failed
- retry_scheduled
- cancelled
- stale

---

## 8. Metric Registry

Market metrics must use permanent canonical identifiers. Avoid free-form metric names in authoritative logic.

Minimum categories and example codes:

### Demographics

- `population_current`
- `population_growth_1y`
- `population_growth_5y`
- `population_growth_10y`
- `households_current`
- `household_growth_5y`
- `median_age`
- `household_size`
- `migration_net`

### Income and affordability

- `median_household_income`
- `income_growth_5y`
- `rent_to_income_ratio`
- `home_price_to_income_ratio`
- `housing_cost_burden`

### Employment

- `employment_growth_1y`
- `employment_growth_5y`
- `unemployment_rate`
- `labor_force_participation`
- `top_employer_share`
- `top_industry_share`
- `major_employer_count`
- `wage_growth`

### Supply and demand

- `housing_units_total`
- `permits_12m`
- `construction_pipeline_units`
- `rental_vacancy`
- `owner_vacancy`
- `commercial_vacancy`
- `absorption_rate`
- `inventory_months`
- `days_on_market_median`
- `sale_to_list_ratio`
- `rent_growth_1y`
- `rent_growth_5y`
- `sale_price_growth_1y`
- `sale_price_growth_5y`

### Taxes, insurance, and hazards

- `effective_property_tax_rate`
- `tax_growth_5y`
- `insurance_cost_index`
- `flood_zone`
- `flood_risk_score`
- `wildfire_risk_score`
- `wind_risk_score`
- `hail_risk_score`
- `earthquake_risk_score`
- `heat_risk_score`
- `drought_risk_score`
- `environmental_site_proximity`

### Access and convenience

- `grocery_drive_minutes`
- `hospital_drive_minutes`
- `airport_drive_minutes`
- `major_road_drive_minutes`
- `transit_access_score`
- `broadband_availability`
- `utility_service_status`
- `walkability_indicator`
- `school_access_indicator`

### Liquidity

- `annual_transaction_count`
- `comparable_transaction_count`
- `buyer_depth_indicator`
- `days_to_contract`
- `price_reduction_rate`
- `failed_listing_rate`
- `lender_availability_indicator`

Property-type-specific metric registries must be added without redefining universal codes.

---

## 9. Geography Resolution

MarketIQ must support multiple geographies because one boundary is never sufficient.

Required workflow:

1. Start from canonical coordinates and parcel.
2. Resolve municipality, county, metro, school district, census geography, and relevant submarket.
3. Create immediate-area radius views.
4. Create drive-time trade areas when strategy requires them.
5. Allow user-defined geography without replacing system geographies.
6. Record provider geometry version and retrieval time.
7. Display which geography supports each metric.

The UI must not compare metrics from materially different geographies without labeling the difference.

---

## 10. Property-Type-Aware Analysis

### Residential rental

Emphasize:

- household growth
- rent growth
- vacancy
- affordability
- employment stability
- schools where relevant
- nearby services
- property tax and insurance trends
- tenant-demand depth
- resale liquidity

### Short-term rental

Emphasize:

- tourism and event demand
- seasonality
- lodging supply
- local restrictions
- airport and attraction access
- weekend versus weekday demand
- insurance and operating burden

MarketIQ may identify demand context but GovernanceIQ and ContractIQ remain authoritative for restrictions.

### Multifamily

Emphasize:

- household formation
- rent and vacancy
- pipeline supply
- absorption
- employer diversity
- concessions
- tax reassessment exposure
- insurance pressure
- submarket liquidity

### Office

Emphasize:

- employment by office-using industry
- vacancy
- absorption
- lease-rate trends
- remote-work exposure
- transit and parking
- competing supply
- tenant concentration

### Retail

Emphasize:

- households
- income
- traffic
- daytime population
- visibility and access
- retail leakage
- competing centers
- tenant sales context when available

### Industrial and logistics

Emphasize:

- highway, rail, port, and airport access
- labor availability
- warehouse supply
- vacancy
- absorption
- truck access
- utility capacity
- zoning
- environmental and flood concerns

### Mixed use

Analyze each use independently and combined. Do not average incompatible demand signals into one opaque score.

### Land and development

Emphasize:

- zoning
- future land use
- utility availability
- entitlement environment
- permits
- absorption
- infrastructure projects
- environmental constraints
- school and municipal capacity
- comparable land/development activity

### Specialty assets

Each specialty model must declare the demand indicators it relies on. Codex may not apply residential metrics by default.

---

## 11. Deterministic Market Postures

MarketIQ must produce explainable postures, not a mysterious universal score.

Required posture dimensions:

- demographic posture
- employment posture
- income/affordability posture
- demand posture
- supply posture
- rent posture
- sales posture
- liquidity posture
- infrastructure posture
- tax/insurance posture
- hazard posture
- overall market posture

Suggested posture values:

- strongly_favorable
- favorable
- balanced
- caution
- unfavorable
- insufficient_evidence
- conflicted

Each posture must include:

- ruleset version
- supporting metrics
- contrary metrics
- hard constraints
- confidence
- freshness
- explanation code

Weights must be versioned and property-type specific. No user-facing posture may be generated solely by AI.

---

## 12. Confidence Model

Confidence must consider:

- source authority
- source freshness
- geography match
- sample size
- metric completeness
- cross-source agreement
- methodology transparency
- property-type relevance
- historical depth

Confidence values:

- high
- medium
- low
- insufficient
- conflicted

The UI must explain why confidence is not high.

---

## 13. Conflict Handling

A conflict exists when credible sources materially disagree.

Required behavior:

- Preserve both values.
- Identify geography and period differences.
- Identify methodology differences when known.
- Do not automatically select the most favorable value.
- Use configured source precedence only where valid.
- Mark dependent conclusions conflicted when the difference could change the decision.
- Generate a verification question.
- Allow the user to select a working assumption without deleting source evidence.

---

## 14. Freshness and Re-Analysis

Each metric category must define freshness expectations.

Examples:

- listing and transaction metrics: short freshness window
- permits and pipeline: moderate freshness window
- demographics: longer freshness window, but period must be visible
- hazard maps: provider/version dependent
- taxes: current assessment/tax cycle
- employer announcements: effective and verified date required

Required domain events:

- `market.profile.created`
- `market.refresh.requested`
- `market.provider.started`
- `market.provider.completed`
- `market.provider.failed`
- `market.evidence.updated`
- `market.conflict.detected`
- `market.snapshot.created`
- `market.snapshot.stale`
- `market.assumption_suggestion.created`
- `market.material_change.detected`

A material change may trigger targeted strategy re-evaluation and underwriting staleness, but only affected outputs should be recalculated.

---

## 15. Suggested Assumption Changes

MarketIQ may suggest changes to:

- market rent
- rent growth
- vacancy
- concessions
- sale growth
- exit cap rate
- days to stabilize
- marketing time
- operating expense growth
- property tax growth
- insurance growth
- reserve assumptions
- development absorption
- lease-up timing

Every suggestion must show:

- current assumption
- suggested assumption or range
- evidence
- reason
- confidence
- effect preview where available
- accept
- reject
- edit before acceptance

No suggestion may silently alter an active underwriting snapshot.

---

## 16. User Experience

### MarketIQ entry points

- Deal workspace navigation
- Decision Cockpit risk or market card
- Property intake completion
- Strategy comparison
- Portfolio comparison
- Report links
- Search and deep links

### MarketIQ header

Show:

- active property and Deal
- overall market posture
- property-type demand posture
- confidence
- as-of date
- stale/conflict count
- refresh state
- primary action

### Summary view

Priority order:

1. Market conclusion
2. Why it matters to this Deal
3. Positive drivers
4. Negative drivers
5. Hard constraints
6. Missing evidence
7. Suggested assumption changes
8. Strategy impact
9. Detailed evidence

### Evidence view

Provide:

- category filters
- geography filters
- source filters
- freshness filters
- confidence filters
- chart/table toggle
- raw source detail where permitted
- export

### Map view

Support:

- property location
- geography boundaries
- drive-time areas
- hazards
- employers
- infrastructure
- conveniences
- planned development
- comparable market evidence where licensed

Map layers must show source and effective date.

### Guided mode

Explain:

- what each metric means
- why it matters
- whether the signal is favorable or unfavorable
- what to verify
- which professional may help

### Professional mode

Provide:

- denser tables
- raw metrics
- geography detail
- methodology
- source comparison
- downloadable evidence
- assumption impact

Both modes use the same canonical data and postures.

---

## 17. Web UX

Required:

- summary and detail split layout
- sticky Deal context
- responsive charts
- dense professional tables
- keyboard navigation
- saved filters
- side-by-side geography/source comparison
- no horizontal-only workflow for mobile-width web
- direct links from finding to evidence
- durable refresh/job status

---

## 18. iPhone UX

Required:

- compact posture summary
- one-handed review of drivers and risks
- map handoff
- tap-to-view source
- offline access to latest completed snapshot
- visible stale/offline state
- deferred refresh while offline
- push/deep-link support for material changes
- no requirement to inspect desktop-size tables

---

## 19. iPad UX

Required:

- split view with summary and evidence/map
- side-by-side source comparison
- charts and tables optimized for larger canvas
- keyboard and pointer support
- drag and drop of downloaded evidence into the Deal where appropriate
- no stretched iPhone layout

---

## 20. Background Processing

Provider retrieval and aggregation must use durable jobs.

Requirements:

- idempotency key
- provider request tracking
- timeout handling
- retry policy
- partial-completion state
- cost/usage tracking
- correlation ID
- cancellation where safe
- last valid snapshot preservation
- stale indicator during refresh
- no indefinite generic spinner

A failed provider must not block unrelated providers or manual evidence entry.

---

## 21. Provider Abstraction

Each provider adapter must define:

- supported metric codes
- supported geographies
- authorization method
- rate limits
- cost model
- freshness
- license restrictions
- retry rules
- response normalization
- error mapping
- raw payload retention policy
- health status

Provider-specific field names must not leak into the canonical UI or domain model.

---

## 22. Security and Privacy

- Enforce workspace authorization server-side.
- Apply RLS to all MarketIQ records.
- Do not expose provider secrets to clients.
- Use signed or authorized access for raw files.
- Audit material manual overrides.
- Do not infer protected personal traits about specific occupants.
- Avoid discriminatory or steering language.
- Crime, schools, demographic, and income data must be presented as sourced context, not as coded proxies for who should live in an area.
- Limit precise user location retention to the minimum necessary for requested workflows.

---

## 23. Accessibility

- Charts require text summaries and accessible data tables.
- Maps require non-map alternatives for material findings.
- Status cannot rely on color alone.
- Filters and tabs require proper labels and focus order.
- Dynamic Type and VoiceOver must work on native clients.
- Reduced-motion settings must be honored.
- Data tables must support screen-reader navigation.

---

## 24. Performance

Targets should be measured and refined, but initial requirements are:

- Previously completed summary visible quickly from cached canonical snapshot.
- Navigation must not wait for provider refresh.
- Large datasets must paginate or virtualize.
- Map layers must load progressively.
- Charts must avoid rendering unnecessary points.
- Refresh must prioritize decision-critical metrics.
- Provider work must not block Deal editing.

---

## 25. Error States

Distinct user-facing states are required for:

- no market profile
- geocoding failure
- unsupported geography
- provider unavailable
- provider authorization failure
- rate limit
- timeout
- partial data
- stale data
- conflicting data
- insufficient evidence
- permission denied
- offline
- processing failed
- assumption suggestion conflict

Each error must state:

- what failed
- what remains available
- whether the decision is affected
- how to retry or continue manually
- support reference ID where appropriate

---

## 26. Reports and Exports

MarketIQ must supply canonical data to:

- Deal summary
- Full underwriting report
- Market report
- Strategy comparison
- Risk report
- Decision memo
- Portfolio comparison
- PDF
- Spreadsheet
- Secure share view

Reports must show:

- as-of date
- source citations
- geography
- confidence
- stale/conflict labels
- snapshot version
- ruleset version

---

## 27. Notifications and Tasks

Create notifications or tasks only for material events, including:

- market snapshot materially changed
- strategy compatibility changed
- critical evidence expired or became stale
- provider refresh failed repeatedly
- major verified employer closure/expansion affects the Deal
- hazard or tax evidence materially changed
- user verification is required

Notifications must open the exact finding or workflow.

---

## 28. Admin and Usage Monitoring

Admins must be able to review:

- provider usage by workspace/user
- cost estimates
- request volume
- error rate
- latency
- rate-limit events
- job backlog
- stale job count
- retry count
- cache effectiveness
- top expensive workflows
- feature-flag status

No admin may bypass workspace privacy without an authorized, audited support workflow.

---

## 29. API and Service Contracts

Exact transport may vary, but services must support:

- create/resolve market profile
- request refresh
- fetch latest snapshot
- fetch snapshot history
- list evidence
- list findings
- resolve conflicts
- create manual evidence
- create/accept/reject assumption suggestions
- fetch provider job status
- compare geographies
- compare Deals/markets

All write operations require:

- authorization
- validation
- idempotency where retryable
- audit context
- version/concurrency checks

---

## 30. Testing Requirements

### Unit tests

- metric normalization
- posture rules
- confidence rules
- freshness rules
- conflict detection
- material-change detection
- suggestion generation
- property-type weighting

### Integration tests

- provider adapter normalization
- market snapshot creation
- evidence-to-finding linkage
- RLS
- refresh job lifecycle
- partial provider failure
- suggestion acceptance into canonical assumptions
- targeted re-underwriting event
- report reconciliation

### End-to-end tests

1. Create Deal and resolve geographies.
2. Run MarketIQ refresh.
3. Observe provider progress.
4. Open completed summary.
5. Inspect supporting evidence.
6. Switch geography.
7. Review conflict.
8. Accept a suggested vacancy assumption.
9. Confirm underwriting becomes stale and reruns through canonical engine.
10. Confirm strategy ranking updates when material.
11. Generate report and reconcile posture/evidence.
12. Open same Deal on iPhone and iPad.
13. Simulate offline and verify last snapshot remains available and marked.
14. Simulate provider failure and verify prior snapshot remains visible.

### Regression tests

- no source loss during refresh
- no duplicate evidence on retry
- no stale snapshot displayed as current
- no cross-workspace access
- no client-specific posture differences
- no report/live-screen disagreement
- no silent assumption mutation

---

## 31. Validation and Verification Gate

Before marking this specification implemented, Codex must verify:

### Functional

- MarketIQ can be opened from the active Deal.
- Geographies resolve correctly.
- Refresh completes with durable status.
- Partial results are handled.
- Evidence links work.
- Filters, maps, charts, exports, and comparison controls work.
- Suggested assumptions require explicit acceptance.
- Save, refresh, reopen, browser reload, and app relaunch work.

### Data

- All records use canonical workspace, Deal, and Property IDs.
- Evidence retains source, geography, period, freshness, classification, and confidence.
- Snapshots are immutable and versioned.
- Conflicts are preserved.
- RLS tests pass.
- Provider retries are idempotent.

### Integration

- Decision Cockpit displays the current snapshot.
- Strategy Intelligence receives material-change events.
- Underwriting receives only accepted assumption changes.
- Reports reconcile to the snapshot.
- Notifications deep-link correctly.
- Web, iPhone, iPad, reports, and admin agree on status and values.

### UX

- Overall posture and major drivers are understandable within seconds.
- Stale, partial, offline, conflicted, and failed states are visibly distinct.
- Guided mode explains meaning without blocking professional mode.
- Maps have accessible alternatives.
- No workflow ends in a dead state.

### Quality

Record exact results for:

- typecheck
- lint
- unit tests
- integration tests
- RLS tests
- E2E tests
- production web build
- iPhone build/test
- iPad build/test
- accessibility checks
- provider failure tests

---

## 32. Definition of Done

MarketIQ is complete only when:

- It uses the canonical Deal and Property.
- It produces versioned, deterministic, source-linked snapshots.
- It supports property-type-specific analysis.
- It distinguishes facts, estimates, forecasts, and inferences.
- It preserves stale and conflicting evidence.
- It exposes durable provider job status.
- It never silently alters underwriting.
- It integrates with the Decision Cockpit, Underwriting, Strategy Intelligence, reports, tasks, notifications, and admin usage monitoring.
- Web, iPhone, and iPad show the same canonical result.
- All visible controls work.
- No provider failure destroys prior valid analysis.
- Required tests pass.
- No unrelated completed functionality regresses.

Codex must conclude implementation with either:

`CHAPTER COMPLETE`

or

`CHAPTER NOT COMPLETE`

No intermediate label is permitted.