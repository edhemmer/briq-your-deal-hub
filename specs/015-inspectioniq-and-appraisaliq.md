# BRIX Specification 015 — InspectionIQ and AppraisalIQ

## 1. Authority and Rules of Engagement

This specification is governed by:

- `docs/00-START-HERE.md`
- `docs/01-PRODUCT-CONSTITUTION.md`
- `docs/02-ENGINEERING-STANDARDS.md`
- `docs/03-DATA-ARCHITECTURE.md`
- `docs/04-UI-UX-SYSTEM.md`
- `docs/05-BUILD-ROADMAP.md`
- Specifications `001` through `014`

Codex must re-read the governing documents and all connected specifications before implementation.

Rules of engagement:

1. InspectionIQ and AppraisalIQ use the canonical Workspace, Deal, Property, Evidence, contact, task, timeline, underwriting, strategy, financing, contract, offer, photo, visit, report, notification, and audit systems.
2. Original inspection and appraisal files remain immutable Evidence.
3. AI may extract, classify, summarize, compare, and propose follow-up questions; AI may not issue final inspection, engineering, appraisal, lending, legal, tax, insurance, or valuation conclusions.
4. Every material finding must retain source page, section, image, table, addendum, or other source anchor where possible.
5. Low-confidence, illegible, incomplete, conflicting, estimated, or missing information must be marked for verification.
6. No extracted finding may silently overwrite canonical Property facts, underwriting assumptions, value opinions, financing inputs, strategy results, OfferIQ terms, ContractIQ terms, tasks, deadlines, or recommendations.
7. Accepted changes must flow through explicit, versioned proposals and the owning subsystem.
8. A contractor quote, specialist report, repair invoice, appraisal revision, reconsideration, or new inspection must preserve prior versions and supersession history.
9. Inspection findings and appraisal opinions are separate evidence classes and must never be merged into one generic risk score.
10. A failed reprocessing job must preserve the original file and prior valid analysis.
11. Web, iPhone, iPad, reports, exports, notifications, and Decision Cockpit must display the same canonical state.
12. This chapter is complete only when the complete source-to-decision workflow saves, reopens, retries, reconciles, and updates connected modules without stale or contradictory state.

## 2. Mission

InspectionIQ converts professional inspection and specialist reports into source-linked condition findings, repair needs, risk classifications, cost proposals, verification tasks, and Deal impacts.

AppraisalIQ converts appraisal reports and revisions into source-linked value opinions, comparable evidence, income and cost approach data, appraisal conditions, confidence, financing implications, and Deal impacts.

Together they must answer:

- What was inspected or appraised?
- Which source document and version controls?
- What was observed or concluded?
- What is confirmed, estimated, assumed, incomplete, conflicting, or missing?
- Which findings change repair assumptions, capital needs, financing, offer position, contract rights, strategy viability, risk, or recommendation?
- What requires a licensed or specialized professional?
- What changed from the prior Deal state?
- What should the investor do next?

## 3. Scope Boundaries

### InspectionIQ owns

- Inspection report intake and preservation
- Condition finding extraction
- System/component classification
- Severity, urgency, safety, and specialist-review flags
- Repair and replacement proposal workflow
- Contractor quote reconciliation
- Inspection contingency and repair-negotiation support
- Inspection follow-up tasks
- Source-linked inspection summaries

### InspectionIQ does not own

- Final engineering conclusions
- Environmental testing conclusions
- Insurance coverage conclusions
- Legal rights under a contract
- Authoritative repair costs without accepted evidence
- Underwriting calculations
- Offer or contract mutation

### AppraisalIQ owns

- Appraisal intake and preservation
- Appraisal report classification and versioning
- Value opinion extraction
- Comparable and adjustment extraction
- Income, sales, and cost approach extraction
- Appraisal assumptions and limiting conditions
- Appraisal-required repairs or completion conditions
- Revision, reconsideration, and dispute workflow
- Source-linked appraisal summaries

### AppraisalIQ does not own

- Final lender approval
- MarketIQ’s broader market model
- Underwriting calculations
- Legal property-rights interpretation
- A universal true-value determination
- Silent replacement of user, broker, assessor, AVM, or prior appraisal values

## 4. Supported Inspection Evidence

InspectionIQ must support:

- General home inspection
- Commercial property condition assessment
- Multifamily inspection
- Roof inspection
- HVAC inspection
- Plumbing inspection
- Electrical inspection
- Structural engineering report
- Foundation report
- Sewer scope
- Septic inspection
- Well inspection
- Pool/spa inspection
- Chimney/fireplace inspection
- Pest/termite report
- Mold assessment
- Radon report
- Lead/asbestos-related report where lawfully handled
- Environmental site assessment
- Fire/life-safety inspection
- Elevator inspection
- Accessibility review
- Energy audit
- Insurance loss-control report
- Municipal code or occupancy inspection
- Contractor estimate
- Specialist estimate
- Repair invoice
- Warranty document
- Builder punch list
- Reinspection report

## 5. Supported Appraisal Evidence

AppraisalIQ must support:

- Residential appraisal
- Commercial narrative appraisal
- Restricted appraisal report
- Desktop appraisal
- Hybrid appraisal
- Drive-by/exterior appraisal
- Land appraisal
- Agricultural appraisal
- Multifamily appraisal
- Income-property appraisal
- Portfolio appraisal
- Construction appraisal
- As-is value
- As-completed value
- As-stabilized value
- Prospective value
- Retrospective value
- Appraisal review
- Appraisal update
- Reconsideration of value
- Lender revision request
- Final completion inspection

## 6. Intake and Evidence Handling

Supported intake:

- PDF
- Word
- Image/scanned report
- Multi-file report package
- Email body and attachments
- iOS share extension
- Camera capture
- File picker
- Drag and drop
- Forwarded email ingestion
- Manual structured entry

For every source:

- Preserve original bytes and metadata.
- Calculate a hash.
- Record uploader, received date, effective date, report date, provider, and document type.
- Detect duplicates and likely revisions.
- Create canonical Evidence.
- Associate with the correct Deal and Property.
- Expose upload, queue, processing, partial, review, complete, failed, stale, and superseded states.
- Allow manual continuation when extraction fails.
- Never discard a report because parsing is incomplete.

## 7. Canonical Data Model

### `inspection_reports`

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `property_id`
- `source_evidence_id`
- `report_type`
- `provider_contact_id`
- `inspection_date`
- `report_date`
- `status`
- `version_number`
- `supersedes_report_id`
- `analysis_state`
- `verification_state`
- `created_by`
- `created_at`
- `updated_at`

### `inspection_findings`

Required fields:

- `id`
- `inspection_report_id`
- `system_category`
- `component`
- `location`
- `finding_type`
- `observation`
- `suspected_cause`
- `severity`
- `urgency`
- `safety_flag`
- `specialist_required`
- `repair_or_replace`
- `estimated_cost_low`
- `estimated_cost_high`
- `currency_code`
- `source_page`
- `source_section`
- `source_anchor`
- `source_image_id`
- `confidence`
- `verification_state`
- `status`
- `created_at`
- `updated_at`

### `inspection_cost_proposals`

Store:

- Finding or grouped findings
- Proposed scope
- Cost range
- Source classification
- Contractor quote linkage
- Accepted amount
- Contingency
- Timing
- Capital-versus-operating classification
- Underwriting change proposal
- OfferIQ repair-credit proposal
- ContractIQ repair-request linkage
- Approval/rejection/defer status

### `inspection_followups`

Store:

- Follow-up type
- Responsible party
- Specialist role
- Due date
- Related finding
- Canonical task ID
- Resolution state
- Resolution Evidence

### `appraisal_reports`

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `property_id`
- `source_evidence_id`
- `appraisal_type`
- `appraiser_contact_id`
- `client_name`
- `intended_user`
- `intended_use`
- `effective_date`
- `report_date`
- `property_rights_appraised`
- `value_premise`
- `currency_code`
- `status`
- `version_number`
- `supersedes_report_id`
- `analysis_state`
- `verification_state`
- `created_at`
- `updated_at`

### `appraisal_value_opinions`

Store separately:

- As-is value
- As-completed value
- As-stabilized value
- Prospective value
- Retrospective value
- Land value
- Insurable/replacement value when stated
- Value date
- Approach relied upon
- Reconciliation weight
- Source anchor
- Confidence
- Verification state

### `appraisal_comparables`

Store:

- Comparable address and identifier
- Sale/lease date
- Sale price or rent
- Unit and property characteristics
- Distance
- Source
- Adjustments by category
- Net and gross adjustment
- Adjusted indication
- Appraiser commentary
- Source page/table
- Verification state

### `appraisal_income_approach`

Store:

- Market rent
- Contract rent
- Vacancy
- Other income
- Operating expenses
- NOI
- Cap rate
- Discount rate
- Terminal rate
- DCF period
- Stabilization assumptions
- Value indication
- Source anchors

### `appraisal_conditions`

Store:

- Required repair
- Completion item
- Documentation condition
- Inspection condition
- Lender condition
- Cost-to-cure
- Completion deadline
- Related task
- Status
- Evidence of completion

### `appraisal_conflicts`

Store conflicts between:

- Appraisal and current underwriting
- Appraisal and listing
- Appraisal and prior appraisal
- Appraisal and MarketIQ
- Appraisal and tax assessment
- Appraisal and broker opinion
- Comparable data sources
- Property facts

Conflicts remain visible until resolved or accepted.

## 8. Inspection Classification Model

Supported system categories include:

- Site and drainage
- Foundation and structure
- Roof
- Exterior envelope
- Windows and doors
- Interior
- Electrical
- Plumbing
- HVAC
- Fire/life safety
- Elevators
- Accessibility
- Appliances/equipment
- Pool/spa
- Sewer/septic/well
- Environmental
- Pest
- Parking and paving
- Landscaping
- Common areas
- Tenant spaces
- Code/permit concern
- Deferred maintenance
- Capital replacement

Severity:

- Informational
- Maintenance
- Minor
- Moderate
- Major
- Critical
- Safety Critical

Urgency:

- Monitor
- Routine
- Before occupancy
- Before closing
- Immediate
- Emergency

A finding may be visible without a known cause. Suspected causes must be labeled as inference, not fact.

## 9. Inspection Workflow

1. User uploads or captures report.
2. System preserves Evidence and creates report record.
3. Processing extracts sections, photos, findings, costs, and recommendations.
4. User reviews low-confidence and material findings.
5. Related PhotoIQ and VisitIQ evidence is displayed for comparison.
6. Duplicate or overlapping findings are grouped without deleting source distinctions.
7. User accepts, edits, rejects, or defers repair proposals.
8. Accepted repair values create versioned underwriting proposals.
9. Accepted negotiation items connect to OfferIQ and ContractIQ.
10. Specialist needs and deadlines create canonical tasks.
11. Underwriting recalculates after accepted canonical changes.
12. Strategy Engine re-ranks when results materially change.
13. Decision Cockpit shows before/after recommendation and unresolved risks.
14. Reports and notifications refresh from canonical state.

## 10. Appraisal Workflow

1. User uploads or receives appraisal.
2. System preserves Evidence and creates appraisal record.
3. Processing extracts value opinions, approaches, comparables, assumptions, conditions, and limiting language.
4. User reviews material and low-confidence values.
5. Appraisal facts are compared to Property, MarketIQ, underwriting, FinanceIQ, listing, and prior values.
6. Conflicts are displayed without silent overwrite.
7. User may accept an appraisal value as a scenario input, verified Property fact where appropriate, financing input, or reference-only evidence.
8. Accepted value changes create a new underwriting assumption version.
9. Financing feasibility and appraisal contingency status are reevaluated.
10. Strategy Engine and Decision Cockpit refresh when material.
11. Appraisal-required repairs create linked tasks and may connect to InspectionIQ.
12. Revisions, reviews, and reconsiderations preserve history.
13. Reports show appraisal source, date, premise, property rights, and status.

## 11. Contractor Quote and Cost Reconciliation

InspectionIQ must compare:

- Inspector estimate
- System default estimate
- User estimate
- Contractor quote
- Specialist quote
- Invoice
- Warranty coverage
- Seller credit
- Insurance recovery estimate where applicable

Precedence for accepted repair cost:

1. Paid invoice or executed contract
2. Accepted current contractor quote
3. Verified specialist estimate
4. Verified inspection estimate
5. User-approved estimate
6. External estimate
7. System default

The user controls acceptance. BRIX must show the controlling source and date.

## 12. Appraisal Reconsideration and Revision

Support:

- Correction request
- Missing comparable submission
- Property fact correction
- Additional evidence package
- Reconsideration of value
- Appraisal review
- Revised appraisal
- Final completion certification

Rules:

- Preserve original appraisal.
- Link each request and response.
- Do not represent that reconsideration will succeed.
- Distinguish user-provided comparable evidence from appraiser conclusions.
- Maintain status, deadlines, and responsible contacts.
- Update canonical value only through explicit acceptance.

## 13. UI and UX Requirements

### Web

Provide:

- Report inventory and version status
- Side-by-side source viewer and findings
- Filters by system, severity, urgency, cost, verification, and status
- Cost reconciliation workspace
- Before/after underwriting impact
- Appraisal value summary
- Comparable table and adjustment view
- Income approach summary
- Conflict center
- Conditions and follow-up tasks
- Connected OfferIQ, ContractIQ, FinanceIQ, and Decision Cockpit impacts

### iPhone

Provide:

- Report capture/import
- Compact finding and value summaries
- Photo/source-page navigation
- Accept/edit/defer actions
- Specialist task creation
- Offline queue
- Push/deep-link support
- One-handed field use

### iPad

Provide:

- Report and analysis side by side
- Multi-page document navigation
- Comparable and adjustment table
- Finding/photo/source comparison
- Keyboard, pointer, drag-and-drop support
- Split-view Deal context

### Premium experience requirements

- Decision-changing findings appear before secondary detail.
- The user always sees current, stale, conflicted, processing, failed, or superseded state.
- Prior valid analysis remains visible during reprocessing.
- No generic endless spinner is permitted.
- Every failure explains what was preserved and how to continue.
- The user can return to the exact review position.
- No mobile experience is a compressed desktop table.

## 14. State Model

Inspection and appraisal processing states:

- Draft
- Uploaded
- Queued
- Processing
- Partial
- Awaiting Verification
- Current
- Current with Conflicts
- Stale
- Failed with Prior Analysis
- Superseded
- Cancelled
- Offline Pending Upload

Finding states:

- New
- Needs Review
- Accepted
- Rejected
- Deferred
- Resolved
- Superseded

Appraisal condition states:

- Open
- In Progress
- Satisfied
- Waived by authorized party
- Failed
- Expired
- Superseded

## 15. Integration Requirements

### Property Intake

- Correct verified property facts through proposals.
- Preserve source and prior value.

### PhotoIQ and VisitIQ

- Link related images and field observations.
- Do not collapse professional findings into user observations.

### Underwriting

- Accept only approved, versioned changes.
- Trigger targeted recalculation.
- Preserve prior snapshots.

### Strategy Engine

- Reevaluate strategy viability and ranking after material accepted changes.

### FinanceIQ

- Update appraisal value scenarios, LTV, financing conditions, repair reserves, and feasibility after explicit acceptance.

### OfferIQ

- Support repair credits, price changes, contingency actions, and walk-away analysis.

### ContractIQ

- Connect inspection contingency, repair requests, appraisal contingency, notice deadlines, and amendment evidence.

### Decision Cockpit

- Show material findings, value conflicts, changed recommendation, unresolved tasks, and freshness.

### ReportIQ

- Consume canonical findings, values, costs, conflicts, and accepted impacts.

### Notifications and Tasks

- Create only canonical tasks and idempotent notifications.

## 16. Domain Events

InspectionIQ events:

- `inspection.report_received`
- `inspection.analysis_requested`
- `inspection.analysis_completed`
- `inspection.analysis_failed`
- `inspection.finding_proposed`
- `inspection.finding_accepted`
- `inspection.cost_accepted`
- `inspection.followup_created`
- `inspection.report_superseded`

AppraisalIQ events:

- `appraisal.report_received`
- `appraisal.analysis_requested`
- `appraisal.analysis_completed`
- `appraisal.analysis_failed`
- `appraisal.value_proposed`
- `appraisal.value_accepted`
- `appraisal.conflict_detected`
- `appraisal.condition_created`
- `appraisal.reconsideration_started`
- `appraisal.report_superseded`

Events must be emitted after persistence and consumed idempotently.

## 17. Security and Privacy

- Workspace and Deal RLS apply to every record.
- Source files use private authorized storage.
- Signed URLs are short-lived and scoped.
- Provider and AI credentials remain server-side.
- Untrusted report content is protected against prompt injection.
- Sensitive information must not enter unsafe logs.
- Sharing and export permissions are explicit.
- Deletion and retention follow Evidence policy.
- Admin access is audited.
- Usage and processing costs are metered.

## 18. Performance and Reliability

- Uploads must resume or safely retry.
- Processing jobs must be idempotent.
- Large reports must process asynchronously.
- User navigation must remain responsive during processing.
- Partial extraction may be displayed only when labeled partial.
- Previous valid results remain available during reprocessing.
- Timeouts produce recoverable failure states.
- Duplicate processing must not create duplicate findings or values.
- Large comparable and finding sets must paginate or virtualize.

## 19. Testing Requirements

Required tests:

- Upload, hash, duplicate, and revision detection
- Inspection extraction fixtures
- Appraisal extraction fixtures
- Source-anchor verification
- Severity and urgency classification
- Repair-cost precedence
- Contractor quote reconciliation
- Appraisal approach and value-premise parsing
- Comparable adjustment parsing
- Conflict detection
- Proposal acceptance/rejection/defer
- Targeted underwriting recalculation
- Strategy reranking
- OfferIQ and ContractIQ integration
- FinanceIQ appraisal condition integration
- Task and notification idempotency
- RLS and storage authorization
- Prompt-injection defense
- Offline upload and retry
- Web/iPhone/iPad/report reconciliation
- Accessibility and performance with large files

## 20. Verification and Validation

### Functional verification

- Reports upload, save, reopen, process, retry, supersede, and remain intact.
- Findings, values, comparables, costs, and conditions link to source anchors.
- Manual review works after extraction failure.
- Accepted changes create versioned proposals and canonical updates.
- Rejected or deferred proposals do not alter authoritative data.

### Integration verification

- InspectionIQ connects to PhotoIQ, VisitIQ, Underwriting, Strategy Engine, OfferIQ, ContractIQ, Decision Cockpit, tasks, notifications, and reports.
- AppraisalIQ connects to Property Intake, MarketIQ, FinanceIQ, Underwriting, Strategy Engine, ContractIQ, Decision Cockpit, tasks, notifications, and reports.
- Domain events fire once and are consumed idempotently.
- No duplicate task, evidence, value, or repair-cost system is created.
- No stale recommendation is shown as current.
- Reports reconcile to the live Deal.

### Accuracy and boundary verification

- Professional findings remain distinct from user observations.
- Appraisal value opinions remain distinct from other value sources.
- Inferred causes are labeled as inference.
- Low-confidence and conflicting information remains visible.
- No inspection, engineering, appraisal, lender, legal, insurance, or tax conclusion is overstated.

### UX verification

- Web, iPhone, and iPad workflows are complete.
- Loading, partial, empty, stale, offline, conflict, permission, retry, and failure states are intentionally designed.
- The user can resume at the same review position.
- Critical findings and value conflicts are immediately understandable.
- Accessibility requirements pass.

### Production readiness

- No TODOs, placeholders, fake data, dead controls, disconnected screens, or silent failures remain.
- Logging, telemetry, alerts, retries, and support reference IDs exist.
- Security, RLS, storage, retention, and sharing are verified.
- Performance targets are met with realistic large reports.
- Cross-client and report reconciliation passes.

## 21. Definition of Done

Specification 015 is complete only when:

1. A user can ingest inspection and appraisal evidence end to end.
2. Original sources remain intact and source-linked.
3. Findings, value opinions, comparables, costs, and conditions are reviewable and versioned.
4. Accepted changes update only the correct canonical owner.
5. Underwriting, strategies, financing, offers, contracts, tasks, Cockpit, and reports update seamlessly where applicable.
6. Prior states and recommendations remain auditable.
7. Failure, offline, stale, conflict, retry, and supersession flows work.
8. Web, iPhone, and iPad produce consistent canonical results.
9. Required tests and completion gates pass.
10. Codex can report `COMPLETE` without any material unverified workflow.