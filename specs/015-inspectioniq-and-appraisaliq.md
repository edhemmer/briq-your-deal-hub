# BRIX Specification 015 — InspectionIQ and AppraisalIQ

## 1. Authority and Rules of Engagement

This specification is governed by `docs/00-START-HERE.md` through `docs/05-BUILD-ROADMAP.md` and Specifications 001–014.

Rules:

1. InspectionIQ and AppraisalIQ use the canonical Workspace, Deal, Property, Evidence, task, timeline, contact, underwriting, strategy, financing, offer, contract, report, notification, and audit systems.
2. Original inspection reports, appraisal reports, addenda, photographs, repair estimates, contractor bids, emails, and supporting documents remain immutable Evidence.
3. Every material extracted fact, condition, valuation input, adjustment, repair item, or conclusion must link to its source page, section, image, table, exhibit, or other source anchor where possible.
4. AI may extract, classify, summarize, compare, explain, and propose verification questions. AI may not issue inspection-grade conclusions, certify building condition, perform an appraisal, determine legal compliance, or silently alter canonical values.
5. InspectionIQ and AppraisalIQ may propose changes to assumptions, values, repair budgets, timelines, tasks, financing, strategy, or recommendation. No proposal becomes canonical without an explicit authorized acceptance workflow.
6. Prior accepted values, underwriting snapshots, recommendations, and source documents must remain preserved and versioned.
7. Conflicting inspections, contractor bids, appraisals, market opinions, user assumptions, and public data must remain visible until resolved or explicitly accepted.
8. No failed reprocessing job may erase or replace a prior valid result.
9. Web, iPhone, iPad, reports, exports, notifications, and the Decision Cockpit must show the same canonical state.
10. Every asynchronous operation must expose queued, processing, partial, complete, failed, stale, conflicted, and retry states.
11. InspectionIQ does not replace a licensed inspector, engineer, architect, contractor, environmental professional, code official, or other qualified specialist.
12. AppraisalIQ does not replace a licensed or certified appraiser and must never represent its output as an appraisal.

---

## 2. Mission

InspectionIQ converts professional inspection evidence and property-condition findings into a structured, source-linked due-diligence record that can update repair scope, capital needs, negotiation position, deadlines, risks, and strategy analysis.

AppraisalIQ converts appraisal evidence and valuation inputs into a structured, source-linked valuation record that can update value confidence, financing feasibility, offer strategy, refinance analysis, exit analysis, and strategy ranking.

Together, these subsystems must answer:

1. What evidence was received?
2. What material facts and findings were identified?
3. Which findings are confirmed, estimated, inferred, disputed, or missing?
4. Which issues affect safety, habitability, insurability, financing, operations, repair cost, value, or strategy?
5. Which values and adjustments drive the appraisal conclusion?
6. How do inspection and appraisal findings change the Deal?
7. Which follow-up questions, specialists, bids, repairs, negotiations, or deadlines are required?
8. What changed from the prior underwriting and recommendation?

---

## 3. Scope

### 3.1 InspectionIQ

InspectionIQ supports:

- General residential inspections
- Commercial property condition assessments
- Multifamily inspections
- Roof, HVAC, electrical, plumbing, structural, foundation, environmental, septic, well, sewer, pool, elevator, fire/life-safety, accessibility, mold, radon, lead, termite, pest, drainage, envelope, facade, parking, pavement, and specialist reports
- Builder punch lists
- Capital-needs assessments
- Reserve studies
- Contractor estimates and repair proposals
- Repair credits and seller-response documents
- User field observations from VisitIQ and PhotoIQ
- Reinspection and completion verification

### 3.2 AppraisalIQ

AppraisalIQ supports:

- Residential appraisal reports
- Commercial appraisal reports
- Desktop and exterior-only reports where identified
- Broker price opinions and comparative market analyses as separate non-appraisal classes
- Appraisal reviews
- Rent schedules
- Income-capitalization exhibits
- Cost-approach exhibits
- Comparable-sale grids
- Land and development valuation reports
- Portfolio and multi-property appraisal packages
- Appraisal updates, recertifications, reconsideration-of-value packages, and addenda

---

## 4. Canonical Ownership

### 4.1 Inspection entities

Required canonical entities:

- `inspection_records`
- `inspection_sources`
- `inspection_findings`
- `inspection_systems`
- `inspection_recommendations`
- `inspection_cost_estimates`
- `inspection_conflicts`
- `inspection_followups`
- `inspection_reinspection_events`

Each inspection record must include:

- Workspace, Deal, and Property IDs
- Inspection type
- Provider/contact/organization
- Inspection date
- Report date
- Status
- Scope and limitations
- Source Evidence IDs
- Verification state
- Analysis state
- Version
- Superseded/reinspection relationships
- Created/updated metadata

### 4.2 Appraisal entities

Required canonical entities:

- `appraisal_records`
- `appraisal_sources`
- `appraisal_value_conclusions`
- `appraisal_approaches`
- `appraisal_comparables`
- `appraisal_adjustments`
- `appraisal_income_inputs`
- `appraisal_cost_inputs`
- `appraisal_conditions`
- `appraisal_conflicts`
- `appraisal_review_items`

Each appraisal record must include:

- Workspace, Deal, and Property IDs
- Appraisal class and intended use
- Appraiser/contact/organization
- Effective date
- Report date
- Property rights appraised
- Intended user/client where available
- Status
- Source Evidence IDs
- Verification and analysis state
- Version
- Superseded/update relationships
- Created/updated metadata

### 4.3 Ownership boundaries

InspectionIQ owns structured condition findings and proposed condition-related changes. It does not own canonical underwriting results, strategy results, contracts, offers, or financing results.

AppraisalIQ owns structured appraisal evidence and valuation conclusions. It does not own the canonical active value assumption unless an authorized user accepts a proposed change through the standard change workflow.

---

## 5. InspectionIQ Extraction Contract

InspectionIQ must extract and classify, where applicable:

### 5.1 Report identity and limitations

- Inspector/provider
- License or credential text where present
- Inspection date
- Report date
- Property address
- Client
- Scope
- Systems excluded
- Areas inaccessible
- Weather and occupancy conditions
- Standards of practice
- Limitations and disclaimers

### 5.2 System and component findings

At minimum:

- Site and drainage
- Foundation and structure
- Exterior and envelope
- Roof
- Attic and insulation
- Interior
- Windows and doors
- Electrical
- Plumbing
- Water and sewer/septic
- HVAC and ventilation
- Fire and life safety
- Appliances and equipment
- Garage and parking
- Accessibility
- Environmental concerns
- Common areas and amenities
- Commercial building systems
- Deferred maintenance
- Code or permit observations where explicitly stated

Each finding must preserve:

- System/component
- Location
- Observation
- Reported condition
- Severity
- Urgency
- Safety relevance
- Functional impact
- Probable cause only when explicitly stated or clearly labeled as inference
- Recommended action
- Recommended specialist
- Source anchor
- Confidence
- Verification state
- Materiality

### 5.3 Severity and urgency

Supported severity:

- Informational
- Maintenance
- Minor defect
- Material defect
- Major defect
- Safety concern
- Potential immediate hazard
- Specialist evaluation required
- Unable to determine

Supported timing:

- Monitor
- Routine maintenance
- Before closing
- Immediate
- Within 30 days
- Within 12 months
- Within 1–3 years
- Capital planning
- Unknown

Severity and timing must remain distinct.

---

## 6. Inspection Cost and Repair Workflow

InspectionIQ must support:

- System-generated preliminary cost ranges clearly labeled as estimates
- User-entered estimates
- Inspector estimates
- Contractor bids
- Seller credits
- Repair escrows
- Insurance-related estimates
- Capital reserve allocations

Cost precedence:

1. Accepted executed repair agreement or paid invoice
2. Accepted contractor bid
3. Verified specialist estimate
4. Inspector-provided estimate
5. User-entered estimate
6. System preliminary range

A newer source does not automatically replace a stronger source classification.

For each repair item, store:

- Scope
- Quantity/unit
- Low/base/high cost
- Source classification
- Effective date
- Included contingency
- Timing
- Responsible party
- Accepted amount
- Related finding
- Related OfferIQ or ContractIQ term
- Underwriting impact proposal

Accepted cost changes must create a new underwriting snapshot and preserve before-and-after results.

---

## 7. Inspection Conflict and Reinspection Logic

The system must detect and preserve conflicts such as:

- Two inspections disagree on severity or existence
- Contractor bid scope differs from inspector recommendation
- Seller claims completed repair but no verification exists
- Reinspection indicates incomplete or failed work
- PhotoIQ evidence conflicts with report wording
- User field observation conflicts with professional report

Resolution states:

- Unresolved
- Additional evidence required
- Specialist review required
- User accepted source A
- User accepted source B
- Both retained
- Superseded by reinspection
- Closed with rationale

Reinspection must link to the original finding and record whether the item is corrected, partially corrected, unchanged, worsened, inaccessible, or disputed.

---

## 8. AppraisalIQ Extraction Contract

AppraisalIQ must extract and classify, where applicable:

### 8.1 Report identity

- Appraiser and firm
- License/certification text where present
- Client and intended user
- Intended use
- Effective date
- Report date
- Property rights appraised
- Interest appraised
- Appraisal type and scope
- Extraordinary assumptions
- Hypothetical conditions
- Limiting conditions

### 8.2 Subject property

- Address and parcel identifiers
- Legal description
- Property type
- Site area
- Building area
- Unit count
- Year built/effective age
- Condition and quality ratings
- Zoning and use
- Occupancy
- Highest and best use conclusion
- Flood/environmental references
- Tax and assessment data
- Lease and rent information

### 8.3 Value conclusions

For every conclusion:

- Value amount
- Currency
- Value type
- Effective date
- Property rights
- As-is, prospective, stabilized, completion, liquidation, land, or other condition
- Approach or reconciliation source
- Confidence/verification
- Source anchor

The system must support multiple value conclusions in one report and must never flatten them into one unlabeled number.

### 8.4 Sales comparison approach

For each comparable:

- Address/location
- Sale/list status
- Sale date
- Sale price
- Unit of comparison
- Property characteristics
- Distance where available
- Data source
- Verification source
- Adjustments by category
- Net and gross adjustment
- Adjusted price
- Weight or relevance
- Appraiser comments
- Source anchor

### 8.5 Income approach

Extract, where applicable:

- Market rent
- Contract rent
- Other income
- Vacancy and collection loss
- Effective gross income
- Operating expenses
- NOI
- Cap rate
- Discount rate
- Terminal cap rate
- Growth assumptions
- DCF period
- Reserves
- Direct capitalization value
- DCF value
- Rent comparables

### 8.6 Cost approach

Extract, where applicable:

- Land value
- Replacement or reproduction cost
- Entrepreneurial incentive
- Physical depreciation
- Functional obsolescence
- External obsolescence
- Site improvements
- Cost-approach value

---

## 9. Appraisal Review and Conflict Logic

AppraisalIQ must compare appraisal evidence against:

- Active Deal assumptions
- MarketIQ data
- Underwriting income and expenses
- FinanceIQ lender constraints
- Contract price and concessions
- OfferIQ offer terms
- InspectionIQ condition findings
- Public and listing data
- Prior appraisals or broker opinions

Potential conflicts include:

- Appraised value differs materially from active value assumption
- Appraisal uses stale or inconsistent income
- Rent schedule conflicts with lease evidence
- Condition rating conflicts with inspection findings
- Comparable adjustments are unusually high
- Highest and best use conflicts with GovernanceIQ or zoning evidence
- Property rights or intended use are inconsistent with the Deal
- Extraordinary assumptions materially affect value

The system may identify review items but may not claim an appraisal is invalid or noncompliant unless that conclusion is supplied by a qualified reviewer and preserved as evidence.

---

## 10. Connected Change Workflow

For both subsystems:

1. Receive and preserve Evidence.
2. Parse and classify document.
3. Extract source-linked facts and findings.
4. Display verification and conflict states.
5. Create proposed canonical changes.
6. Authorized user accepts, edits, rejects, or defers each material proposal.
7. Persist accepted changes in the owning subsystem.
8. Emit idempotent domain events.
9. Trigger targeted underwriting recalculation where material.
10. Trigger strategy re-ranking where material.
11. Refresh Decision Cockpit, OfferIQ, ContractIQ, FinanceIQ, tasks, timeline, reports, and notifications.
12. Preserve prior and current versions and explain what changed.

No source extraction writes directly into authoritative underwriting result tables.

---

## 11. User Experience

### 11.1 Web

InspectionIQ:

- Report inventory and processing status
- System-by-system findings
- Severity, urgency, cost, and responsibility filters
- Source viewer with anchored findings
- Repair-scope builder
- Contractor-bid comparison
- Reinspection tracking
- Proposed underwriting/offer/contract impacts

AppraisalIQ:

- Report inventory and status
- Value conclusions by type and date
- Approach summary
- Comparable grid
- Income and cost approach detail
- Assumptions and limiting conditions
- Conflict and review panel
- Proposed value/financing/strategy impacts

### 11.2 iPhone

- Camera, file, email, and share-extension intake
- Compact critical findings and value summary
- Source-page navigation
- Accept/defer proposal actions
- Task and deadline actions
- Offline upload queue
- Reinspection photo capture

### 11.3 iPad

- Side-by-side document and extracted analysis
- Multi-column findings and comparison
- Appraisal comparable and adjustment review
- Drag/drop and keyboard/pointer support
- Split view with Decision Cockpit or underwriting

### 11.4 Premium UX requirements

- Critical safety or financing issues are prominent without using alarmist language.
- Condition, cost, value, confidence, and verification remain visually distinct.
- Prior valid results remain visible when new processing fails.
- Users can trace every material number to source evidence.
- Long reports support search, filtering, anchored navigation, and progress preservation.
- No action ends in a dead state; every completion state presents the next logical action.

---

## 12. State Model

Supported states:

- Draft
- Uploaded
- Queued
- Processing
- Partial
- Awaiting Verification
- Current
- Current with Conflicts
- Stale
- Failed with Prior Result
- Reinspection Required
- Specialist Review Required
- Professional Review Recommended
- Superseded
- Offline Cached

The UI must distinguish source upload state, extraction state, verification state, acceptance state, and downstream recalculation state.

---

## 13. Domain Events

Inspection events:

- `inspection.received`
- `inspection.analysis_requested`
- `inspection.analysis_completed`
- `inspection.analysis_failed`
- `inspection.finding_created`
- `inspection.cost_proposed`
- `inspection.change_accepted`
- `inspection.conflict_detected`
- `inspection.reinspection_recorded`
- `inspection.superseded`

Appraisal events:

- `appraisal.received`
- `appraisal.analysis_requested`
- `appraisal.analysis_completed`
- `appraisal.analysis_failed`
- `appraisal.value_conclusion_created`
- `appraisal.change_proposed`
- `appraisal.change_accepted`
- `appraisal.conflict_detected`
- `appraisal.review_item_created`
- `appraisal.superseded`

Consumers include underwriting, strategy, Decision Cockpit, OfferIQ, ContractIQ, FinanceIQ, tasks, timeline, reports, and notifications.

All events must be emitted after successful persistence and processed idempotently.

---

## 14. Security and Privacy

- Enforce Workspace and Deal authorization through RLS and server-side checks.
- Store private reports and images in authorized private Storage.
- Keep provider credentials and AI secrets server-side.
- Treat report contents as untrusted input and defend against prompt injection.
- Prevent sensitive information from appearing in unsafe logs or analytics.
- Audit uploads, views where required, accepted changes, exports, shares, deletions, and admin access.
- Apply rate limits, file limits, malware checks, content validation, and usage/cost metering.
- Shared reports must be scoped, revocable, expiring where appropriate, and unable to expose unrelated Deal records.

---

## 15. Testing Requirements

Required tests:

- File intake, hashing, duplicate detection, and Storage authorization
- Extraction fixtures for common residential and commercial reports
- Source-anchor accuracy
- Severity and urgency classification
- Cost-precedence and bid-comparison logic
- Reinspection and supersession logic
- Multiple appraisal value conclusions
- Comparable and adjustment extraction
- Income and cost approach extraction
- Conflict detection against MarketIQ, FinanceIQ, InspectionIQ, contracts, and underwriting
- Accepted-change workflow
- Targeted recalculation and strategy re-ranking
- Event idempotency
- Offline upload and recovery
- Large-document performance
- RLS and cross-workspace isolation
- Prompt-injection and malicious-file handling
- Web, iPhone, iPad, report, and export reconciliation
- Accessibility tests

---

## 16. Verification and Validation

### 16.1 Functional verification

- Inspection and appraisal files upload, save, reopen, process, retry, supersede, and remain intact.
- Findings, conclusions, comparables, adjustments, costs, and review items link to source evidence.
- Manual review remains available after extraction failure.
- Reinspection and appraisal updates preserve prior versions.

### 16.2 Accuracy and boundary verification

- Observed fact, professional conclusion, system inference, user assumption, and system estimate remain distinct.
- InspectionIQ does not claim inspection-grade conclusions.
- AppraisalIQ does not represent itself as an appraisal.
- Low-confidence, conflicting, stale, and missing information is visible.
- No silent canonical mutation occurs.

### 16.3 Integration verification

- Accepted repair changes update the canonical repair budget through the defined proposal workflow.
- Accepted appraisal changes update the owning value assumption through the defined proposal workflow.
- Underwriting recalculates exactly once per accepted material change.
- Strategy ranking, Decision Cockpit, OfferIQ, ContractIQ, FinanceIQ, tasks, timeline, reports, and notifications refresh from canonical events.
- No duplicate tasks, findings, value records, calculations, or timeline events are created on retry.
- Web, iPhone, iPad, reports, and exports display the same values and statuses.

### 16.4 UX verification

- Desktop, iPhone, and iPad workflows are complete and responsive.
- Loading, empty, partial, stale, offline, conflict, permission, failure, and retry states are intentional and recoverable.
- Critical findings and value differences are understandable without hiding source detail.
- Accessibility, keyboard, pointer, VoiceOver, Dynamic Type, and reduced-motion behavior pass.

### 16.5 Production readiness

- No mock data, TODOs, dead controls, placeholder analysis, disconnected modules, or silent background failures.
- Monitoring, correlation IDs, retries, timeouts, and operational alerts exist.
- File retention, deletion, backup, and restore behavior are tested.
- Performance targets are met for realistic large reports and image sets.
- Security, privacy, RLS, Storage, and audit requirements pass.

## 17. Definition of Done

Specification 015 is complete only when a user can ingest inspection and appraisal evidence, trace every material finding and value to source, resolve or preserve conflicts, accept selected changes, trigger accurate re-underwriting and re-ranking, reopen the Deal with the same canonical state, recover from failures and offline interruptions, and produce consistent results across web, iPhone, iPad, reports, exports, tasks, timeline, and the Decision Cockpit without developer intervention.
