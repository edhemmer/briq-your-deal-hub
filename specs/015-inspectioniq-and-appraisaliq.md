# 015 — InspectionIQ and AppraisalIQ

## Mission

Build two connected due-diligence systems that ingest professional inspection and appraisal evidence, preserve the source documents, extract material findings, reconcile conflicts, update the canonical Deal, and trigger targeted re-underwriting without silently overwriting existing facts, assumptions, values, or decisions.

InspectionIQ and AppraisalIQ are evidence and decision-support systems. They do not replace licensed inspectors, engineers, appraisers, lenders, attorneys, insurance professionals, or other qualified professionals.

## Permanent build rules

Before implementing this specification, Codex must re-read and follow:

- `docs/00-START-HERE.md`
- `docs/01-PRODUCT-CONSTITUTION.md`
- `docs/02-ENGINEERING-STANDARDS.md`
- `docs/03-DATA-ARCHITECTURE.md`
- `docs/04-UI-UX-SYSTEM.md`
- `docs/05-BUILD-ROADMAP.md`
- `specs/003-deals-and-pdrm-core.md`
- `specs/005-deterministic-underwriting-engine.md`
- `specs/007-decision-cockpit-and-deal-workspace.md`
- `specs/011-contractiq-and-document-intelligence.md`
- `specs/013-photoiq-and-visual-evidence.md`

The following rules are non-negotiable:

1. Original source documents are immutable evidence.
2. Extracted findings are separate from source evidence.
3. AI findings are not professional conclusions.
4. No extracted value silently overwrites a canonical Deal value.
5. Every accepted change creates a versioned assumption, fact, or opinion record.
6. Every material change can trigger targeted re-underwriting.
7. Prior underwriting results and recommendations remain historically reproducible.
8. Every finding must link to source pages, sections, images, or evidence locations where available.
9. Low-confidence findings require user verification.
10. Web, iPhone, iPad, reports, exports, and admin must display the same canonical status.
11. Failed processing must preserve the document and expose retry or manual review.
12. No stale result may be shown as current after accepted inspection or appraisal changes.

---

# 1. Scope

## InspectionIQ scope

InspectionIQ must support:

- General home inspections
- Commercial property condition assessments
- Engineering reports
- Structural reports
- Roofing reports
- Sewer scope reports
- Radon reports
- Mold reports
- Pest and termite reports
- HVAC reports
- Electrical reports
- Plumbing reports
- Environmental reports
- Fire and life-safety reports
- Accessibility reports
- Pool and spa reports
- Well and septic reports
- Elevator reports
- Building envelope reports
- Contractor estimates and bids
- Repair invoices and completion evidence

## AppraisalIQ scope

AppraisalIQ must support:

- Residential appraisal reports
- Multifamily appraisal reports
- Commercial appraisal reports
- Land appraisal reports
- Development appraisal reports
- Restricted appraisal reports
- Desktop appraisal reports
- Broker price opinions when clearly classified
- Comparative market analyses when clearly classified
- Rent schedules
- Income capitalization analyses
- Sales comparison analyses
- Cost approach analyses
- Appraisal reviews
- Reconsideration-of-value evidence

## Out of scope

This specification does not authorize BRIX to:

- Certify property condition
- Diagnose hidden defects
- Approve repairs
- Replace professional inspection
- Issue an appraisal
- Represent a value opinion as lender-approved
- Determine legal compliance
- Guarantee financing
- State that a property is safe
- State that a property is insurable

---

# 2. Canonical ownership and relationships

## Required entities

Implement or reuse canonical entities for:

- `inspection_records`
- `inspection_documents`
- `inspection_findings`
- `inspection_systems`
- `inspection_cost_estimates`
- `inspection_quotes`
- `inspection_resolutions`
- `appraisal_records`
- `appraisal_documents`
- `appraisal_value_opinions`
- `appraisal_comparables`
- `appraisal_adjustments`
- `appraisal_income_analysis`
- `appraisal_rent_schedules`
- `appraisal_conditions`
- `appraisal_review_findings`
- `evidence_items`
- `evidence_findings`
- `assumption_sets`
- `underwriting_snapshots`
- `underwriting_results`
- `recommendations`
- `tasks`
- `deadlines`
- `domain_events`
- `audit_events`

Every record must be scoped by `workspace_id`, `deal_id`, and, where applicable, `property_id`, `building_id`, `unit_id`, or `parcel_id`.

## Identity rules

- Every inspection receives immutable `inspection_id`.
- Every appraisal receives immutable `appraisal_id`.
- Every source file receives immutable `evidence_id`.
- Every extracted finding receives immutable `finding_id`.
- Reprocessing creates a new extraction version; it does not replace prior extraction history.
- Multiple inspections and appraisals may exist for one Deal.
- One report may cover multiple buildings, units, parcels, or systems.
- Findings must remain attached to the correct physical scope.

---

# 3. Document intake and processing

## Supported inputs

- PDF
- Image-based PDF
- Word document
- JPEG
- PNG
- HEIC where supported
- Email attachment
- Drag and drop
- iOS file importer
- iOS share extension
- Camera scan
- Multi-file package
- Appraisal addendum
- Inspection addendum
- Contractor quote
- Repair completion evidence

## Intake workflow

1. User selects the Deal.
2. User selects document type or allows classification suggestion.
3. Client uploads original file.
4. Server validates file type, size, malware status, and workspace permission.
5. File is stored in an isolated canonical storage path.
6. Evidence record is created with file hash and source metadata.
7. Processing job is queued idempotently.
8. OCR or text extraction runs.
9. Document structure and pages are indexed.
10. AI extraction runs only after source preservation.
11. Findings are stored as derived, versioned records.
12. User reviews low-confidence and material findings.
13. User accepts, edits, rejects, or defers findings.
14. Accepted changes create canonical facts, professional opinions, estimates, or assumptions.
15. Targeted re-underwriting is queued.
16. Cockpit, timeline, tasks, OfferIQ, ContractIQ, and reports refresh from canonical events.

## Processing states

Use explicit states:

- uploaded
- queued
- extracting
- classifying
- analyzing
- awaiting_review
- partially_complete
- complete
- failed
- retry_scheduled
- superseded
- cancelled

Never use a generic indefinite spinner as the only state.

---

# 4. InspectionIQ data model

## Inspection record fields

Minimum fields:

- `inspection_id`
- `workspace_id`
- `deal_id`
- `property_id`
- `inspection_type`
- `inspection_date`
- `report_date`
- `inspector_name`
- `inspection_company`
- `license_or_credential`
- `contact_id`
- `scope`
- `status`
- `source_evidence_id`
- `processing_state`
- `review_state`
- `created_by`
- `created_at`
- `updated_at`
- `version`

## Finding fields

Minimum fields:

- `finding_id`
- `inspection_id`
- `deal_id`
- `property_scope_type`
- `property_scope_id`
- `system_category`
- `component`
- `location`
- `observation`
- `reported_condition`
- `severity`
- `urgency`
- `safety_flag`
- `water_or_moisture_flag`
- `structural_flag`
- `specialist_recommended`
- `repair_recommended`
- `replacement_recommended`
- `monitor_recommended`
- `estimated_cost_low`
- `estimated_cost_high`
- `cost_currency`
- `cost_source_type`
- `source_page_start`
- `source_page_end`
- `source_excerpt_reference`
- `source_image_reference`
- `confidence`
- `verification_state`
- `user_resolution`
- `professional_resolution`
- `created_at`
- `version`

## System categories

At minimum:

- Site and drainage
- Foundation
- Structure
- Roof
- Exterior
- Building envelope
- Windows and doors
- Interior
- Electrical
- Plumbing
- HVAC
- Fire and life safety
- Accessibility
- Elevators
- Pools and spas
- Appliances
- Sewer
- Well
- Septic
- Environmental
- Mold and moisture
- Pest and wood-destroying organisms
- Radon
- Commercial systems
- Deferred maintenance
- Capital expenditure
- Code or permit concern
- Other

## Severity model

Use canonical severity levels:

- critical
- high
- moderate
- low
- informational
- unknown

Severity must remain separate from urgency and cost.

## Urgency model

- immediate
- before_closing
- within_30_days
- within_12_months
- long_term
- monitor
- unknown

---

# 5. Inspection cost and repair reconciliation

## Cost sources

Classify every cost as:

- Inspector estimate
- AI estimate
- User assumption
- Contractor verbal estimate
- Contractor written quote
- Seller credit
- Completed invoice
- Professional reserve estimate
- Unknown

## Precedence

Default precedence for authoritative repair budgeting:

1. Completed paid invoice
2. Accepted written contractor quote
3. Accepted professional estimate
4. User-entered accepted assumption
5. Inspector estimate
6. System estimate
7. AI estimate
8. Unknown

Precedence must be configurable by explicit user choice and preserved historically.

## Underwriting impact

Accepted inspection findings may affect:

- Immediate repairs
- Capital expenditures
- Closing credits
- Renovation budget
- Contingency
- Stabilization period
- Insurance assumptions
- Financing feasibility
- Strategy compatibility
- Maximum offer
- Required reserves
- Deal recommendation

No finding may alter underwriting until accepted under defined workflow or explicitly configured policy.

---

# 6. AppraisalIQ data model

## Appraisal record fields

Minimum fields:

- `appraisal_id`
- `workspace_id`
- `deal_id`
- `property_id`
- `appraisal_type`
- `report_type`
- `effective_date`
- `report_date`
- `appraiser_name`
- `appraisal_company`
- `license_or_certification`
- `client_name`
- `intended_user`
- `intended_use`
- `property_rights_appraised`
- `interest_appraised`
- `value_conclusion`
- `value_currency`
- `condition_of_value`
- `as_is_value`
- `as_repaired_value`
- `as_complete_value`
- `stabilized_value`
- `source_evidence_id`
- `processing_state`
- `review_state`
- `created_at`
- `version`

## Required extracted sections

- Subject property identification
- Property rights appraised
- Intended use and intended users
- Scope of work
- Effective date
- Market area
- Highest and best use
- Site description
- Improvement description
- Condition and quality
- Zoning
- Flood zone
- Tax and assessment
- Sales history
- Listing history
- Sales comparison approach
- Cost approach
- Income capitalization approach
- Rent schedule
- Expense analysis
- Capitalization rate
- Discount rate
- Comparable sales
- Comparable rents
- Adjustments
- Reconciliation
- Final value conclusion
- Assumptions and limiting conditions
- Extraordinary assumptions
- Hypothetical conditions
- Required repairs
- Completion conditions
- Appraiser certifications

## Value opinion classification

Each value must identify:

- Value type
- Effective date
- Property rights
- Condition
- Source
- Professional classification
- Confidence in extraction
- User verification state
- Whether lender-ordered
- Whether final, draft, revised, or review opinion

BRIX must never collapse different value types into one generic “appraised value.”

---

# 7. Comparable and adjustment model

## Comparable fields

- Address
- Parcel identifier where available
- Sale date
- Sale price
- Property type
- Units
- Building area
- Land area
- Year built
- Condition
- Quality
- Occupancy
- Rent
- NOI
- Cap rate
- Distance
- Data source
- Verification source
- Adjustment lines
- Net adjustment
- Gross adjustment
- Adjusted indication
- Appraiser weighting
- BRIX extraction confidence

## Rules

- Preserve the appraiser's adjustments exactly as reported.
- Do not “correct” an appraisal through AI.
- BRIX may identify internal inconsistencies or missing support.
- BRIX may compare appraisal comparables with MarketIQ evidence.
- Any alternative BRIX market estimate must remain separate from the professional appraisal opinion.
- Conflicting value evidence must remain visible.

---

# 8. Appraisal impact workflow

An accepted appraisal may affect:

- Purchase feasibility
- Loan-to-value
- Loan proceeds
- Required equity
- Financing conditions
- Appraisal contingency
- Maximum offer
- Refinance proceeds
- Seller negotiation
- Strategy ranking
- Exit assumptions
- Deal recommendation

## Value update rules

- Never silently replace user-entered market value.
- Never silently replace purchase price.
- Never silently replace MarketIQ estimate.
- Store each value as a separate opinion with source and effective date.
- Allow users to select which opinion drives a scenario.
- Preserve prior scenario results.
- Mark underwriting stale when its selected value dependency changes.

---

# 9. Conflict detection

Detect and surface conflicts including:

- Appraisal address mismatch
- Parcel mismatch
- Unit-count mismatch
- Building-area mismatch
- Property-type mismatch
- Condition mismatch
- Rent mismatch
- NOI mismatch
- Cap-rate mismatch
- Flood-zone mismatch
- Zoning mismatch
- Sales-history mismatch
- Inspection repair requirement absent from appraisal
- Appraisal condition absent from contract obligations
- Contractor quote materially different from inspection estimate
- Revised appraisal conflicting with prior appraisal
- Multiple appraisal values with different effective dates or rights appraised

Conflict records must identify both sources, affected fields, materiality, and required action.

---

# 10. UI and UX requirements

## Deal workspace entry points

InspectionIQ and AppraisalIQ must be reachable from:

- Deal workspace navigation
- Decision Cockpit risk and evidence cards
- Documents
- Tasks and deadlines
- OfferIQ
- ContractIQ
- Notifications
- Search
- Deal timeline
- Deep links

## InspectionIQ summary screen

Display in priority order:

1. Inspection status
2. Critical and high-severity findings
3. Immediate and before-closing actions
4. Total accepted repair budget
5. Cost range and source quality
6. Systems with material findings
7. Unreviewed findings
8. Specialist recommendations
9. Offer and contract implications
10. Underwriting and recommendation changes
11. Source documents
12. Full finding list

## AppraisalIQ summary screen

Display in priority order:

1. Appraisal status
2. Value conclusion and effective date
3. Value type and condition
4. Purchase price variance
5. Financing impact
6. Required repairs or conditions
7. Comparable support
8. Income approach summary where applicable
9. Conflicts with Deal facts
10. Underwriting and recommendation changes
11. Source document
12. Full extracted detail

## Review workflow

For each material finding, user must be able to:

- Accept
- Edit
- Reject
- Mark needs verification
- Assign to a professional
- Create task
- Add note
- Link contractor quote
- Apply to underwriting
- Defer

## Premium experience requirements

- Side-by-side source document and extracted finding on desktop/iPad.
- Compact prioritized mobile review on iPhone.
- Sticky review controls where useful.
- Autosave review decisions.
- Resume exactly where user stopped.
- Show reviewed versus unreviewed counts.
- Show stale analysis state after accepted changes.
- Never hide critical findings inside collapsed sections.
- Use progressive disclosure for technical detail.
- Use plain-language explanations with professional terminology available.

---

# 11. iPhone requirements

- Native document import and camera scan.
- Offline attachment queue.
- Review critical findings one-handed.
- Quick accept, edit, defer, create task, and add voice note.
- Open exact source page or image.
- Show upload and processing status.
- Preserve draft reviews through app termination.
- Deep link from notification to exact finding.
- Support field verification photos attached to a finding.

---

# 12. iPad requirements

- Multi-column source and analysis workspace.
- Drag and drop documents.
- Keyboard shortcuts for review actions.
- Side-by-side appraisal comparable table and report page.
- Side-by-side inspection findings and underwriting impact.
- Pointer support.
- Large-screen batch review.
- No stretched iPhone layouts.

---

# 13. Domain events

## Inspection events

- `inspection.created`
- `inspection.document_uploaded`
- `inspection.processing_started`
- `inspection.processing_failed`
- `inspection.analysis_completed`
- `inspection.finding_created`
- `inspection.finding_reviewed`
- `inspection.cost_updated`
- `inspection.quote_attached`
- `inspection.resolution_recorded`
- `inspection.accepted_changes_committed`

## Appraisal events

- `appraisal.created`
- `appraisal.document_uploaded`
- `appraisal.processing_started`
- `appraisal.processing_failed`
- `appraisal.analysis_completed`
- `appraisal.value_opinion_created`
- `appraisal.comparable_created`
- `appraisal.conflict_detected`
- `appraisal.review_completed`
- `appraisal.accepted_changes_committed`

## Downstream events

Accepted changes may emit:

- `deal.fact_changed`
- `deal.assumption_changed`
- `underwriting.recalculation_requested`
- `strategy.reranking_requested`
- `recommendation.refresh_requested`
- `offer.review_requested`
- `contract.deadline_review_requested`
- `task.created`
- `report.refresh_requested`

All event consumers must be idempotent.

---

# 14. Permissions and security

Minimum permission controls:

- View inspection/appraisal
- Upload documents
- Review findings
- Accept findings
- Modify underwriting impact
- Delete or archive derived records
- View sensitive appraisal documents
- Share reports
- Admin reprocess

Requirements:

- RLS on all tables.
- Signed or authorized storage access.
- No public object URLs.
- Platform admins cannot view documents without explicit audited support access.
- All material review actions are audited.
- File hashes support duplicate detection and evidence integrity.
- Sensitive data must not appear in logs.

---

# 15. AI responsibilities and restrictions

## Allowed

- Document classification
- OCR cleanup
- Section detection
- Finding extraction
- Severity suggestion
- Cost-range extraction
- Comparable extraction
- Conflict suggestion
- Plain-language summary
- Question generation
- Suggested tasks
- Suggested underwriting changes

## Prohibited

- Declaring a property safe
- Issuing an inspection conclusion
- Issuing an appraisal
- Replacing the appraiser's opinion
- Authoritatively estimating hidden damage
- Silently modifying financial values
- Silently accepting findings
- Making lender approval decisions
- Representing legal or professional advice

Every AI output must retain model, workflow version, prompt version, source evidence IDs, timestamp, confidence, and human review state.

---

# 16. Error, stale-state, and recovery behavior

## Required error classes

- Unsupported file
- File too large
- Corrupt file
- Password-protected file
- Malware or unsafe file
- OCR failure
- Provider outage
- Extraction timeout
- Partial extraction
- Permission failure
- Duplicate file
- Wrong Deal attachment
- Source mismatch
- Re-underwriting failure
- Sync conflict

## Recovery rules

- Preserve original document.
- Preserve user-entered review work.
- Keep prior valid analysis visible and label freshness.
- Allow retry without duplicate records.
- Allow manual entry when processing cannot complete.
- Expose support reference ID.
- Never display “complete” after partial failure without explaining partial state.
- Do not leave processing indefinitely; timeout and escalate.

---

# 17. Performance targets

- Upload acknowledgment: immediate.
- Standard document processing status visible within 2 seconds.
- Finding list initial load: under 2 seconds for normal Deals.
- Paginate or virtualize large reports.
- Source page opening: under 2 seconds after cached authorization where practical.
- Review action acknowledgment: under 300 ms perceived response.
- Re-underwriting queue acknowledgment: immediate.
- Large-document processing must remain asynchronous and resumable.

---

# 18. Reporting and exports

InspectionIQ outputs:

- Inspection summary
- Critical findings report
- Repair budget report
- Specialist referral list
- Negotiation/credit summary
- Before-and-after underwriting impact
- Open verification items

AppraisalIQ outputs:

- Appraisal summary
- Value opinion comparison
- Comparable table
- Financing impact
- Appraisal condition checklist
- Reconsideration-of-value evidence package
- Before-and-after underwriting impact

All reports must reconcile to canonical records and include source versions and generation date.

---

# 19. Acceptance tests

## InspectionIQ

1. Upload a searchable inspection PDF.
2. Confirm original file is preserved.
3. Confirm findings link to pages.
4. Accept a repair finding.
5. Attach a contractor quote.
6. Confirm quote precedence updates repair assumption.
7. Confirm underwriting is marked stale, recalculates, and preserves prior result.
8. Confirm Cockpit recommendation change is historically recorded.
9. Confirm mobile review and reopen work.
10. Confirm failed processing can retry without duplicate records.

## AppraisalIQ

1. Upload an appraisal report.
2. Extract value type, effective date, property rights, and final opinion.
3. Extract comparables and adjustments.
4. Detect a subject-property mismatch.
5. Confirm user review is required.
6. Accept appraisal as a scenario value source.
7. Confirm financing and underwriting update.
8. Confirm original user value remains preserved.
9. Upload revised appraisal and preserve both versions.
10. Confirm report and live Deal reconcile.

## Cross-client

- Same finding status on web, iPhone, and iPad.
- Same value opinion and underwriting output across clients.
- Deep links open the exact record.
- Offline review syncs without overwrite.
- Conflict handling preserves both edits.

---

# 20. Regression tests

- Existing documents remain accessible.
- ContractIQ extraction remains unaffected.
- PhotoIQ evidence remains linked correctly.
- OfferIQ continues using canonical numbers.
- Underwriting engine remains deterministic.
- Strategy ranking uses accepted changes only.
- Reports remain reproducible.
- RLS blocks cross-workspace access.
- Reprocessing does not erase prior findings.
- Revised reports do not overwrite prior source files.

---

# 21. Definition of Done

This specification is complete only when:

- Inspection and appraisal documents upload, process, review, save, reopen, and recover correctly.
- Original evidence is immutable and authorized.
- Findings and value opinions are source-linked and versioned.
- Accepted changes flow into canonical facts or assumptions.
- Targeted re-underwriting works and preserves history.
- OfferIQ, ContractIQ, Cockpit, tasks, timeline, reports, and notifications receive the correct events.
- Web, iPhone, and iPad display the same canonical state.
- Offline and conflict behavior are implemented.
- No stale recommendation is shown as current.
- No visible control is disconnected.
- Unit, integration, RLS, storage, end-to-end, iOS, accessibility, and performance checks pass.
- Exact verification commands and results are recorded.
- No unrelated files are changed.

Codex must end implementation with either:

`CHAPTER COMPLETE`

or

`CHAPTER NOT COMPLETE`

It may not advance while material validation remains unperformed.
