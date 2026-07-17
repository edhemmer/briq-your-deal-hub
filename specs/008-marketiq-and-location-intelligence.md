# BRIX Specification 008 — MarketIQ and Location Intelligence

## Authority

This specification is governed by:

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
- `specs/007-decision-cockpit.md`

Codex must read the governing documents and this specification in full before implementation.

---

# 1. Mission

MarketIQ provides defensible, source-traceable, geography-aware market and location intelligence for every BRIX Deal.

MarketIQ must help the investor answer:

- Is this market growing, stable, declining, or uncertain?
- Is the property likely to support the selected strategy?
- What local forces could improve or weaken future demand?
- How liquid is this asset type in this location?
- What risks exist around taxes, insurance, hazards, crime, schools, infrastructure, regulation, employers, supply, and demand?
- What information is confirmed, estimated, stale, conflicting, unavailable, or inferred?
- What should be verified before the investor spends more time or money?

MarketIQ is not a generic neighborhood summary. It is a decision-support subsystem connected to the canonical Deal, Property, underwriting engine, strategy engine, Decision Cockpit, reports, portfolio comparison, and evidence history.

---

# 2. Non-Negotiable Rules

1. MarketIQ must use the canonical `deal_id`, `property_id`, and workspace scope.
2. Every material finding must retain source, geography, date, effective period, classification, and confidence.
3. MarketIQ must distinguish historical facts, current facts, forecasts, estimates, and AI inferences.
4. MarketIQ may inform underwriting and strategy ranking only through versioned, accepted inputs or deterministic rules.
5. No single data point may produce a broad statement such as “good neighborhood,” “safe area,” “high growth,” or “strong investment.”
6. Missing or stale information must remain visible.
7. Provider failure must not erase previously valid evidence.
8. MarketIQ must never silently overwrite user-confirmed assumptions.
9. MarketIQ must support residential, multifamily, commercial, mixed-use, land, development, and specialty assets.
10. MarketIQ outputs must reconcile across web, iPhone, iPad, reports, exports, portfolio views, and admin diagnostics.
11. AI may summarize and explain. AI may not fabricate local facts or act as the authoritative source.
12. Market conclusions must show what could change the conclusion.

---

# 3. Scope

MarketIQ includes:

- Geography resolution
- Market boundary selection
- Demographics
- Household and income trends
- Employment and employer concentration
- Housing and commercial supply
- Sales and rental market trends
- Liquidity and absorption
- Development pipeline
- Property taxes and assessments
- Insurance pressure indicators
- Flood, wildfire, wind, earthquake, heat, and environmental risk where applicable
- Crime and public-safety context
- Schools and education context
- Healthcare access
- Grocery, retail, dining, and daily-needs access
- Roads, highways, rail, transit, airports, and commute context
- Noise and nuisance proximity
- Utilities and broadband
- Zoning and land-use context
- Planned infrastructure and public investment
- Regulatory and short-term rental context where relevant
- Market-level strategy compatibility
- Data freshness, conflicts, and confidence
- Source-linked evidence
- Decision impact

MarketIQ does not replace:

- A licensed appraisal
- A professional market study
- A title report
- A survey
- An environmental assessment
- A zoning opinion
- Legal advice
- Insurance underwriting
- Local professional due diligence

---

# 4. User Roles and Permissions

Minimum permissions:

- Viewer: view MarketIQ results and sources
- Contributor: add notes, upload evidence, request refresh where allowed
- Analyst: accept or reject suggested market assumptions, create comparisons, edit market assumptions
- Administrator: manage workspace-level provider settings and overrides
- Owner: full workspace authority
- Platform Administrator: provider diagnostics, usage, retries, cost controls, and global feature flags

All write operations must be enforced server-side. Provider credentials and raw secrets must never be exposed to the browser or native clients.

---

# 5. Canonical Data Model

MarketIQ must use or create canonical entities consistent with `docs/03-DATA-ARCHITECTURE.md`.

## 5.1 MarketArea

Required fields:

- `id`
- `workspace_id`
- `name`
- `market_area_type`
- `country_code`
- `state_or_region`
- `county_or_equivalent`
- `city_or_municipality`
- `postal_code`
- `census_geography_ids`
- `geometry`
- `centroid`
- `source`
- `source_identifier`
- `effective_at`
- `created_at`
- `updated_at`

Supported `market_area_type` values should include:

- parcel
- block group
- census tract
- neighborhood
- postal code
- municipality
- county
- metropolitan area
- custom radius
- drive-time area
- user-defined polygon

## 5.2 MarketObservation

Required fields:

- `id`
- `workspace_id`
- `market_area_id`
- `property_id` when property-specific
- `deal_id` when Deal-specific
- `metric_key`
- `metric_group`
- `value_numeric`
- `value_text`
- `value_json`
- `unit`
- `period_start`
- `period_end`
- `effective_at`
- `retrieved_at`
- `source_id`
- `source_record_id`
- `classification`
- `confidence`
- `freshness_status`
- `methodology_version`
- `supersedes_observation_id`
- `created_at`

## 5.3 MarketSource

Required fields:

- `id`
- `provider_name`
- `source_type`
- `source_url`
- `license_notes`
- `terms_reference`
- `retrieved_at`
- `provider_record_id`
- `raw_snapshot_storage_path` when permitted
- `raw_snapshot_hash`
- `status`

## 5.4 MarketFinding

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `property_id`
- `finding_type`
- `severity`
- `title`
- `plain_language_summary`
- `evidence_ids`
- `observation_ids`
- `confidence`
- `status`
- `decision_impact`
- `strategy_impacts`
- `requires_verification`
- `verification_question`
- `accepted_by_user_id`
- `accepted_at`
- `created_at`
- `updated_at`

## 5.5 MarketAssessmentSnapshot

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `property_id`
- `assessment_version`
- `input_observation_ids`
- `input_finding_ids`
- `summary`
- `market_fit_result`
- `risk_result`
- `liquidity_result`
- `growth_result`
- `demand_result`
- `supply_result`
- `confidence_result`
- `freshness_result`
- `generated_at`
- `generated_by_engine_version`
- `supersedes_snapshot_id`

Historical snapshots must remain reproducible.

---

# 6. Geography Resolution

MarketIQ must resolve and preserve the geography used for every metric.

## 6.1 Required behavior

- Resolve parcel, coordinates, municipality, county, postal code, census geography, metro area, and user-selected analysis areas.
- Do not assume all metrics use the same boundary.
- Display the actual geography used for each conclusion.
- Support custom radii and drive-time areas where provider support exists.
- Preserve the geometry and source identifier used at the time of analysis.
- Detect when a property lies near a municipal, school-district, flood-zone, tax, zoning, or county boundary.
- Flag boundary uncertainty when geocoding or source boundaries conflict.

## 6.2 Boundary conflicts

When sources disagree:

- Preserve both source records.
- Mark the boundary as conflicted.
- Prevent unsupported certainty.
- Allow user verification and correction.
- Record the accepted resolution separately from source evidence.

---

# 7. Market Intelligence Dimensions

## 7.1 Population and household trends

Required metrics where available:

- Total population
- Population growth rates
- Household count
- Household formation
- Age distribution
- Household size
- Owner/renter occupancy
- Migration indicators
- Vacancy indicators
- Seasonal population where relevant

Required analysis:

- Trend direction
- Time period
- Geographic comparison
- Reliability and data lag
- Relevance to the selected property type and strategy

## 7.2 Income and affordability

Required metrics:

- Median household income
- Per-capita income
- Income distribution
- Rent-to-income indicators
- Home-price-to-income indicators
- Housing cost burden
- Poverty indicators where relevant

MarketIQ must avoid simplistic conclusions. High income does not automatically mean strong investment demand, and low affordability may indicate either pricing power or demand weakness depending on supply and local conditions.

## 7.3 Employment and employers

Required metrics and findings:

- Employment growth
- Unemployment trend
- Labor-force participation
- Industry mix
- Major employers
- Employer concentration
- Announced openings, expansions, contractions, or closures
- Commuting patterns
- Government, university, hospital, logistics, manufacturing, technology, and other anchor institutions

Employer concentration risk must identify when one employer or sector materially influences demand.

## 7.4 Residential sales market

Required metrics where available:

- Median sale price
- Price per square foot
- Sales volume
- Inventory
- Months of supply
- New listings
- Pending sales
- Days on market
- Sale-to-list ratio
- Price reductions
- Distressed sales
- New-construction share
- Comparable property liquidity

Results must distinguish property type, size, condition, age, and geography where possible.

## 7.5 Rental market

Required metrics where available:

- Asking rent
- Effective rent
- Rent per square foot
- Vacancy
- Concessions
- Lease-up velocity
- Rent growth
- Unit-type demand
- Short-term rental indicators where lawful and relevant
- Medium-term rental indicators where relevant
- Student, senior, workforce, and furnished-rental demand where relevant

Market rent estimates must carry source and confidence and must not silently replace user-entered rent.

## 7.6 Commercial market

Support property-type-specific dimensions for:

- Office
- Medical office
- Retail
- Industrial
- Warehouse
- Flex
- Self-storage
- Hospitality
- Mixed use
- Mobile-home parks
- RV parks
- Specialty assets

Metrics may include:

- Vacancy
- Availability
- Asking rent
- Effective rent
- Net absorption
- New supply
- Construction pipeline
- Lease terms
- Concessions
- Tenant demand
- Cap-rate context
- Sales liquidity
- Tenant rollover concentration
- Anchor dependence
- Traffic counts
- Trade-area characteristics

## 7.7 Land and development context

Required dimensions:

- Current zoning
- Future land-use plan
- Entitlement history
- Development pipeline
- Utility availability
- Road access
- Sewer/water capacity where available
- Wetlands
- Floodplain
- Topography
- Soil or environmental flags where available
- Parcel assemblage context
- Nearby planned development
- Permit trends
- Impact-fee indicators
- Growth boundary or annexation context

No development feasibility conclusion may be presented as confirmed without required professional verification.

## 7.8 Liquidity and exit risk

MarketIQ must evaluate:

- Comparable transaction frequency
- Typical marketing time
- Buyer pool depth
- Financing availability indicators
- Property-type demand
- Price-band demand
- Seasonal effects
- Market concentration
- Distressed inventory
- Exit sensitivity to condition and strategy

Liquidity must be presented as a range or classification with supporting evidence, not as a guaranteed resale timeline.

## 7.9 Property taxes and assessments

Required findings:

- Current taxes
- Assessment history
- Tax rate context
- Exemptions where known
- Reassessment timing
- New-construction reassessment risk
- Sale-triggered reassessment risk where applicable
- Special taxing districts
- Delinquency indicators where available

Tax estimates must clearly state assumptions and may not be represented as authoritative tax advice.

## 7.10 Insurance pressure

Required indicators where available:

- Regional catastrophe exposure
- Carrier availability concerns
- Premium trend indicators
- Flood insurance requirements
- Wind/hail exposure
- Wildfire exposure
- Coastal exposure
- Prior-loss or claims indicators only where lawfully available
- Property-type-specific insurability concerns

MarketIQ may identify insurance pressure but must not quote or bind insurance.

## 7.11 Hazard and environmental context

Support, where applicable:

- Flood
- Wildfire
- Wind
- Hurricane
- Tornado
- Earthquake
- Extreme heat
- Drought
- Landslide
- Coastal erosion
- Environmental contamination indicators
- Superfund or regulated-site proximity
- Wetlands
- Radon zones
- Mine subsidence

Every hazard must show:

- Source
- Geography
- Date
- Severity or classification
- Whether property-specific confirmation is required
- Potential impact on insurance, financing, construction, operations, or strategy

## 7.12 Crime and public-safety context

Required rules:

- Use multiple relevant measures where available.
- Show geography and reporting period.
- Label underreporting and data-quality limitations.
- Do not use protected-class proxies.
- Do not produce a simplistic “safe/unsafe” label.
- Provide factual incident-rate context and trend direction.
- Allow users to inspect source data.
- Explain that investors must comply with fair-housing and anti-discrimination laws.

## 7.13 Schools and education

Required information where available:

- Assigned public schools
- District boundaries
- School ratings from identified sources
- Enrollment trend
- Distance and travel time
- Private and higher-education context where relevant

MarketIQ must not present a school rating as an investment guarantee or use it as a proxy for protected characteristics.

## 7.14 Conveniences and access

Support:

- Grocery
- Healthcare
- Pharmacy
- Dining
- Retail
- Parks
- Recreation
- Transit
- Airports
- Major roads
- Employment centers
- Universities
- Hospitals
- Emergency services

Provide distance, estimated travel time, source, and freshness where available.

## 7.15 Infrastructure and planned investment

Support findings for:

- Road projects
- Transit expansion
- Utility upgrades
- Broadband projects
- Schools
- Hospitals
- Major developments
- Public facilities
- Industrial/logistics projects
- Annexations
- Redevelopment districts
- Tax increment financing or similar districts where applicable

Clearly distinguish proposed, approved, funded, under construction, and completed projects.

## 7.16 Noise and nuisance context

Support proximity and user-verification prompts for:

- Airports and flight paths
- Rail lines and crossings
- Highways
- Industrial sites
- Waste facilities
- Quarries
- Utility corridors
- Stadiums and event venues
- Schools and institutional traffic
- Agricultural operations
- Bars and late-night uses

Proximity alone is not a confirmed nuisance. MarketIQ must mark these as visible context requiring user verification.

## 7.17 Broadband and utilities

Support:

- Broadband availability
- Provider count
- Advertised speeds
- Electric service
- Natural gas
- Water
- Sewer
- Septic indicators
- Well indicators
- Utility district
- Service limitations where available

User verification must be required when service availability is uncertain or critical to the strategy.

## 7.18 Regulatory context

Support where relevant:

- Zoning category
- Permitted uses
- Conditional uses
- Short-term rental regulation
- Rental licensing
- Occupancy limits
- Parking requirements
- Historic-district controls
- Development moratoria
- Rent regulation
- Inclusionary requirements
- Building-code adoption
- Special-use restrictions

No legal conclusion may be presented as authoritative. Unclear rules must create verification questions for local officials, attorney, realtor, or other appropriate professionals.

---

# 8. Market Fit Engine

MarketIQ must produce deterministic market-fit inputs for the Strategy Intelligence Engine.

## 8.1 Inputs

- Accepted MarketObservations
- Accepted MarketFindings
- Property type
- Strategy ID
- Deal assumptions
- Financing requirements
- User risk tolerance
- Investment horizon
- Liquidity needs
- Operational preferences

## 8.2 Outputs

For each strategy:

- Demand fit
- Supply pressure
- Rent or revenue support
- Exit liquidity
- Regulatory fit
- Hazard pressure
- Tax pressure
- Insurance pressure
- Employer concentration risk
- Infrastructure support
- Overall market-fit classification
- Confidence
- Binding risks
- Required verification items

## 8.3 Rules

- Hard legal or governance disqualifiers must remain separate from market scoring.
- Low confidence must reduce confidence, not automatically reduce market quality.
- Missing data must not be treated as positive.
- Forecasts must not override current confirmed evidence without explicit rules.
- User-confirmed contrary evidence must be preserved and evaluated.

---

# 9. Decision Cockpit Integration

MarketIQ must provide the Decision Cockpit with:

- Market summary
- Market-fit status
- Growth trend
- Demand trend
- Supply trend
- Liquidity status
- Tax pressure
- Insurance pressure
- Hazard summary
- Major employer concentration
- Regulatory warning count
- Data freshness
- Confidence
- Missing decision-changing information
- Top verification questions
- Material changes since the prior MarketAssessmentSnapshot

The Cockpit must never display a stale MarketIQ summary as current after accepted evidence or assumptions change.

---

# 10. Underwriting Integration

MarketIQ may provide suggested underwriting inputs for:

- Market rent
- Vacancy
- Rent growth
- Exit cap-rate context
- Sale-price growth context
- Taxes
- Insurance pressure
- Lease-up period
- Concessions
- Absorption
- Development timing

Rules:

- Suggestions must remain separate from accepted assumptions.
- User acceptance must create a new AssumptionSet version.
- Rejection must be preserved.
- New market data must not silently recalculate the Deal using unaccepted assumptions.
- When an accepted market assumption changes, the underwriting engine must create a new snapshot and preserve the prior result.

---

# 11. Strategy Engine Integration

MarketIQ must emit or update strategy-relevant signals when:

- Regulatory feasibility changes
- Rental demand materially changes
- Supply materially changes
- Liquidity materially changes
- Hazard or insurance pressure changes
- Employer concentration changes
- Infrastructure projects change status
- Tax assumptions materially change

Strategy rankings may update only after canonical inputs are accepted and the deterministic strategy engine completes.

---

# 12. Provider Architecture

## 12.1 Provider abstraction

Every external provider must be accessed through a provider adapter with:

- Canonical request contract
- Canonical response contract
- Provider-specific mapping
- Timeout
- Retry policy
- Rate-limit handling
- Circuit-breaker behavior where appropriate
- Usage metering
- Cost tracking
- Structured logging
- Correlation IDs
- Provider status
- Data licensing metadata

## 12.2 Provider fallback

When a provider fails:

- Preserve prior valid data.
- Mark it stale when required.
- Expose provider failure without exposing secrets.
- Allow retry.
- Use approved fallback provider where configured.
- Allow manual entry and evidence upload.
- Prevent duplicate observations during retry.

## 12.3 Cost control

Market refreshes must be scoped and intentional.

Required controls:

- Cache by geography, metric, provider, and effective period.
- Avoid repeated identical requests.
- Meter per workspace and user.
- Apply plan limits.
- Expose expensive operations to admin.
- Support scheduled refresh policies.
- Do not refresh every metric on every page load.

---

# 13. Refresh, Freshness, and Stale-State Rules

## 13.1 Freshness statuses

Minimum statuses:

- current
- approaching_stale
- stale
- superseded
- unavailable
- conflicted
- user_verified

Freshness thresholds must be configurable by metric type and source.

## 13.2 Refresh behavior

- User-requested refresh creates a durable job.
- Job status must be visible.
- Refresh must be idempotent.
- Existing results remain visible during refresh.
- New observations must not become canonical until processing and validation complete.
- Failed refresh must not erase prior valid results.
- Partial refresh must identify which dimensions completed and failed.

## 13.3 Recalculation control

New MarketObservations may trigger:

- Finding reevaluation
- MarketAssessmentSnapshot regeneration
- Suggested assumption updates
- Strategy-fit reevaluation
- Cockpit stale-state notification

They must not silently change accepted assumptions.

---

# 14. Web UX

## 14.1 MarketIQ overview

Required hierarchy:

1. Market-fit summary
2. Material risks
3. Demand and supply
4. Liquidity
5. Tax and insurance pressure
6. Hazards
7. Employment and growth
8. Regulatory context
9. Conveniences and infrastructure
10. Missing information
11. Sources and methodology

## 14.2 Required controls

- Change analysis geography
- Compare geography
- Refresh selected dimensions
- View source
- View raw evidence where permitted
- Accept suggested assumption
- Reject suggested assumption
- Add manual evidence
- Mark for verification
- Create task/question
- Compare with another Deal
- Export market summary

Every control must work end to end or remain hidden.

## 14.3 Visual requirements

- Use maps only when they improve understanding.
- Charts must show date range, geography, source, and unit.
- Risk indicators must not rely on color alone.
- Trend charts must support accessible data tables.
- Dense data must use progressive disclosure.
- Important warnings must remain visible while deeper sections are reviewed.
- Avoid decorative dashboards with no decision value.

---

# 15. iPhone UX

The iPhone experience must prioritize field use.

Required:

- Compact MarketIQ summary
- Current-location context
- Nearby risk indicators
- Directions and map handoff
- Quick source review
- Voice note for local observations
- Photo capture linked to location concerns
- Offline viewing of last synced MarketIQ snapshot
- Clear stale/offline label
- Quick creation of verification tasks
- One-handed navigation

The iPhone must not attempt to reproduce desktop tables without a mobile-native alternative.

---

# 16. iPad UX

Required:

- Multi-column Deal and MarketIQ view
- Map plus findings panel
- Chart plus evidence panel
- Drag-and-drop documents and screenshots
- Keyboard shortcuts
- Side-by-side Deal comparison
- Source detail without losing Deal context
- Support for landscape and portrait
- No stretched iPhone layout

---

# 17. Offline and Sync Behavior

## 17.1 Offline access

Users must be able to view:

- Last synced MarketAssessmentSnapshot
- Cached maps where platform rules permit
- Accepted findings
- Sources already downloaded
- Verification tasks
- User notes

## 17.2 Offline edits

Users may:

- Add notes
- Add local observations
- Add photos
- Add voice notes
- Create verification tasks
- Mark items for later review

Offline edits must remain clearly local until synced.

## 17.3 Conflict handling

- Use version checks.
- Never overwrite newer accepted evidence silently.
- Preserve both versions when reconciliation is unsafe.
- Present user-understandable conflict resolution.
- Keep prior valid MarketAssessmentSnapshot visible until a new canonical snapshot completes.

---

# 18. AI Responsibilities and Restrictions

## 18.1 Allowed

AI may:

- Summarize sourced market evidence
- Explain trends
- Compare geographies
- Identify conflicting evidence
- Generate verification questions
- Explain strategy implications
- Draft market narrative for reports
- Classify local notes and voice transcripts

## 18.2 Prohibited

AI may not:

- Invent local facts
- Fabricate statistics
- Create authoritative market rent
- Create authoritative taxes or insurance costs
- Make legal zoning conclusions
- Label an area safe or unsafe
- Use protected-class proxies
- Silently alter assumptions
- Create authoritative market scores outside deterministic rules

## 18.3 Metadata

Every AI output must retain:

- Provider
- Model
- Model version
- Workflow version
- Prompt version
- Input evidence IDs
- Timestamp
- Confidence
- Classification
- User confirmation state
- Cost metadata where available

---

# 19. Domain Events

Minimum events:

- `market.area.resolved`
- `market.area.conflicted`
- `market.refresh.requested`
- `market.refresh.started`
- `market.refresh.partially_completed`
- `market.refresh.completed`
- `market.refresh.failed`
- `market.observation.created`
- `market.observation.superseded`
- `market.finding.created`
- `market.finding.updated`
- `market.finding.accepted`
- `market.finding.rejected`
- `market.assessment.generated`
- `market.assessment.stale`
- `market.assumption.suggested`
- `market.assumption.accepted`
- `market.assumption.rejected`
- `market.strategy_impact.changed`

Events must be idempotent and auditable.

---

# 20. Background Jobs

Required job types:

- Geography resolution
- Provider data retrieval
- Raw snapshot storage
- Normalization
- Conflict detection
- Finding generation
- Market assessment generation
- Source freshness review
- Scheduled refresh
- Report regeneration
- Portfolio comparison refresh

Every job must have:

- Job ID
- Workspace ID
- Deal ID where relevant
- Status
- Progress
- Attempt count
- Idempotency key
- Started and completed timestamps
- Failure category
- Safe error summary
- Retry eligibility
- Correlation ID

No job may remain indefinitely in `processing` without timeout and recovery behavior.

---

# 21. Notifications and Tasks

Create notifications or tasks for:

- Material market-fit change
- New regulatory risk
- New hazard finding
- Major employer closure or expansion where configured
- Tax or assessment change
- Insurance pressure change
- Stale decision-critical data
- Failed refresh
- Missing verification information
- Boundary conflict
- New infrastructure project affecting the Deal

Notifications must deep-link to the exact Deal and MarketIQ item.

---

# 22. Reporting and Exports

MarketIQ outputs must support:

- Deal report
- Market summary
- Risk report
- Strategy comparison
- Portfolio comparison
- Decision memo
- PDF
- Spreadsheet
- CSV where useful
- Secure share link

Every report must show:

- As-of date
- Geography
- Sources
- Confidence
- Stale or missing data
- Accepted assumptions versus suggestions
- Material verification items
- MarketAssessmentSnapshot version

Reports must reconcile with the live canonical snapshot used at generation time.

---

# 23. Search and Comparison

Users must be able to:

- Search MarketIQ findings
- Filter by dimension, severity, source, confidence, freshness, and verification status
- Compare multiple Deals
- Compare multiple geographies for one Deal
- Compare current and prior MarketAssessmentSnapshots
- Identify what changed and why

Comparison must preserve consistent units, periods, and geography labels.

---

# 24. Security and Privacy

Required:

- Workspace-scoped RLS
- Server-side provider access
- Signed or authorized raw-file access
- No secrets in clients or logs
- Audit of accepted/rejected findings and assumptions
- Data-license enforcement
- Rate limiting
- Abuse protection
- PII minimization
- Secure deletion policy
- Admin-only provider diagnostics

Crime, demographic, and location data must be handled with explicit fair-housing and anti-discrimination safeguards.

---

# 25. Performance Requirements

Targets should be finalized during implementation, but minimum expectations are:

- Cached MarketIQ overview renders without blocking on provider calls.
- Navigation remains responsive during refresh.
- Large observation sets are paginated or virtualized.
- Maps load progressively.
- Background refresh does not lock the Deal.
- Provider calls use caching and deduplication.
- First meaningful MarketIQ summary appears as soon as enough validated data exists.
- Performance telemetry identifies slow providers and expensive queries.

---

# 26. Error States

Required error categories:

- Invalid geography
- Provider unavailable
- Provider rate limited
- Provider authorization failure
- Timeout
- Partial data
- Conflicting sources
- Unsupported geography
- License restriction
- Stale data
- Failed normalization
- Failed assessment generation
- Permission denied
- Offline
- Sync conflict
- Internal error

Every error must state:

- What failed
- What data remains valid
- Whether the Deal decision is affected
- Whether retry is available
- Whether manual continuation is available
- Correlation/reference ID where appropriate

Raw stack traces and provider secrets must never be shown.

---

# 27. Empty, Loading, and Partial States

## Empty state

Explain:

- Why no market data exists
- What the user can do
- Which providers or sources are unavailable
- How to add manual evidence

## Loading state

- Preserve page layout.
- Show which dimensions are loading.
- Do not hide prior valid results.
- Expose durable job status.

## Partial state

- Show completed dimensions.
- Show failed or missing dimensions.
- Prevent a partial dataset from being represented as complete.

---

# 28. Accessibility

- Meet WCAG 2.2 AA for web.
- Support VoiceOver and Dynamic Type on iOS.
- Charts require accessible summaries and data tables.
- Maps require non-map alternatives for essential findings.
- Risk states must not rely on color alone.
- Focus order must remain logical.
- Keyboard navigation must work.
- Reduced-motion preferences must be respected.
- Screen-reader labels must include metric, geography, period, value, and status where relevant.

---

# 29. Analytics and Operational Metrics

Track:

- MarketIQ opened
- Refresh requested
- Refresh success/failure
- Provider usage and cost
- Suggested assumption accepted/rejected
- Finding accepted/rejected
- Verification task created
- Source opened
- Geography changed
- Comparison created
- Report generated
- Average refresh duration
- Stale data count
- Provider error rate
- Job retry rate

Analytics must not expose sensitive user data.

---

# 30. Acceptance Tests

Minimum end-to-end acceptance tests:

1. Create a residential Deal and resolve all required geographies.
2. Retrieve and normalize market observations from at least two provider categories.
3. Display source, period, geography, confidence, and freshness for every material metric.
4. Create a MarketAssessmentSnapshot.
5. Display MarketIQ summary in the Decision Cockpit.
6. Suggest a rent assumption without modifying underwriting.
7. Accept the suggestion and create a new AssumptionSet and underwriting snapshot.
8. Reject a suggestion and preserve the rejection.
9. Detect conflicting source values.
10. Refresh MarketIQ while keeping prior valid results visible.
11. Fail one provider and complete a partial refresh correctly.
12. Retry the failed provider without duplicating observations.
13. Mark prior results stale when thresholds are exceeded.
14. Compare two Deals with consistent units and periods.
15. Generate a report that reconciles to the MarketAssessmentSnapshot.
16. Open a MarketIQ notification into the correct Deal and finding.
17. View the last synced MarketIQ snapshot offline on iPhone.
18. Add an offline local observation and sync it safely.
19. Resolve a version conflict without data loss.
20. Verify cross-workspace access is denied.
21. Verify no client contains provider secrets.
22. Verify charts and maps have accessible alternatives.
23. Verify a commercial property uses commercial-specific metrics.
24. Verify a land/development Deal surfaces zoning, utilities, hazards, and pipeline context.
25. Verify crime and school information does not produce prohibited simplistic labels.

---

# 31. Regression Tests

Required regression coverage:

- Geography resolution
- Boundary conflict handling
- Source preservation
- Observation superseding
- Freshness transitions
- Provider retry idempotency
- Partial refresh behavior
- Assumption suggestion acceptance/rejection
- Underwriting integration
- Strategy engine integration
- Cockpit stale-state behavior
- Report reconciliation
- Offline caching
- Sync conflict handling
- RLS isolation
- Provider-cost metering
- Accessibility
- Cross-client consistency

---

# 32. Codex Implementation Start Checklist

Before coding, Codex must state:

1. Exact MarketIQ scope for the implementation slice
2. Existing provider, geocoding, map, evidence, job, and report systems to reuse
3. Canonical entities and ownership
4. Database migrations
5. Provider adapters
6. Domain events
7. Background jobs
8. Web screens
9. iPhone screens
10. iPad screens
11. Offline and sync behavior
12. Freshness and conflict behavior
13. Underwriting and strategy integration
14. Tests required
15. Files expected to change
16. Duplication and regression risks

Codex must state the data path:

`Property/Deal → geography resolution → provider request → authorized backend → raw source preservation → normalization → MarketObservation → conflict/freshness validation → MarketFinding → MarketAssessmentSnapshot → Decision Cockpit/Underwriting/Strategy/Report → audit history`

---

# 33. Definition of Done

This specification is implemented only when:

- MarketIQ works end to end for residential and at least one commercial or land use case.
- All material results are source-linked, dated, geography-aware, classified, and confidence-labeled.
- Prior valid data survives provider failure.
- Partial and stale states are visible.
- Suggested assumptions do not silently alter underwriting.
- Accepted assumptions create versioned underwriting updates.
- Strategy fit updates through deterministic rules.
- Decision Cockpit integration works.
- Web, iPhone, iPad, reports, exports, and admin reconcile.
- Offline viewing and local-note sync work.
- Background jobs expose durable status and retry.
- Security, RLS, accessibility, performance, and provider-cost controls pass.
- Acceptance and regression tests pass.
- No dead controls, disconnected modules, fake data, silent failures, or stale unmarked results remain.
- Exact commands and results are recorded.
- Unrelated files were not changed.

Codex must end implementation with either:

`CHAPTER COMPLETE`

or

`CHAPTER NOT COMPLETE`

A chapter may not be marked complete while any material verification remains outstanding.
