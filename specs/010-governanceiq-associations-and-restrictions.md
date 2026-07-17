# BRIX Specification 010 — GovernanceIQ, Associations, Restrictions, and Community Risk

## 1. Mission

GovernanceIQ is the canonical BRIX subsystem for identifying, preserving, interpreting, and operationalizing any private governance structure that can affect the use, cost, financing, insurability, operation, renovation, leasing, resale, or disposition of a property.

It must support homeowner associations, condominium associations, property owner associations, cooperatives, master associations, sub-associations, architectural review bodies, common-interest communities, planned unit developments, reciprocal easement structures, private road associations, shared utility associations, business parks, commercial associations, mixed-use associations, special districts where relevant to private obligations, and similar governing arrangements.

GovernanceIQ must turn complex association documents and rules into a defensible, source-linked decision layer without presenting AI output as legal advice.

---

## 2. Governing Build Rules

Before implementing this specification, Codex must re-read:

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
- `specs/009-financeiq-and-capital-structure.md`

The permanent rules remain binding:

1. One canonical Deal.
2. One canonical Property.
3. One canonical Evidence system.
4. No AI-owned legal conclusions.
5. No silent strategy changes.
6. No estimate shown as confirmed fact.
7. Every material finding must link to evidence.
8. Every unclear provision must be marked for verification.
9. No stale association analysis may be shown as current.
10. GovernanceIQ must connect to underwriting, strategy ranking, financing, insurance, OfferIQ, ContractIQ, tasks, deadlines, reports, and the Deal timeline.

---

## 3. Business Purpose

Association restrictions and obligations can materially change whether a property is investable.

GovernanceIQ exists to answer:

- Is the property governed by any association or private agreement?
- Which governing body has authority?
- Which documents control?
- Are there rental restrictions, occupancy rules, approval requirements, parking limits, pet rules, use restrictions, renovation controls, insurance obligations, assessments, litigation, or financial weaknesses?
- Do these rules make the investor's intended strategy legal, practical, financeable, and insurable?
- What costs must be included in underwriting?
- What deadlines and review periods apply?
- What questions must be asked before the investor proceeds?
- What requires attorney, lender, insurer, manager, association, seller, or realtor verification?

GovernanceIQ must reduce the risk of buying a property whose intended use is restricted, uneconomic, unfinanceable, uninsured, or operationally burdensome.

---

## 4. Scope

### In scope

- Association detection
- Association identity and hierarchy
- Document intake and preservation
- Document versioning
- Governing document precedence
- Dues and recurring charges
- Special assessments
- Reserve adequacy indicators
- Budget and financial statement review
- Insurance summary review
- Litigation and claims indicators
- Delinquencies and collection risk
- Leasing restrictions
- Short-term rental restrictions
- Occupancy restrictions
- Approval and application requirements
- Right of first refusal
- Transfer restrictions
- Parking and vehicle restrictions
- Trailer, boat, RV, and commercial vehicle restrictions
- Pet restrictions
- Renovation and architectural approval
- Exterior maintenance obligations
- Use restrictions
- Signage and business-use restrictions
- Age restrictions
- Guest and tenant rules
- Move-in and move-out procedures
- Transfer, resale, capital contribution, and initiation fees
- Master/sub-association relationships
- Shared facilities and utilities
- Private road and common-area obligations
- Deadline extraction
- Buyer and seller perspective
- Strategy compatibility impact
- Underwriting impact
- Offer and contract questions
- Verification workflow

### Out of scope

- Final legal interpretation
- Legal representation
- Attorney-client advice
- Title opinion
- Binding insurance coverage opinion
- Binding lender approval
- Tax advice
- Automated waiver of governing restrictions
- Unsupported conclusions about reserve adequacy or solvency

---

## 5. Supported Governance Types

GovernanceIQ must support permanent canonical type IDs.

```text
GOV-HOA
GOV-COA
GOV-POA
GOV-COOP
GOV-MASTER-ASSOCIATION
GOV-SUB-ASSOCIATION
GOV-ARCHITECTURAL-REVIEW
GOV-PRIVATE-ROAD
GOV-SHARED-UTILITY
GOV-RECIPROCAL-EASEMENT
GOV-COMMERCIAL-ASSOCIATION
GOV-BUSINESS-PARK
GOV-MIXED-USE-ASSOCIATION
GOV-PUD
GOV-AGE-RESTRICTED-COMMUNITY
GOV-OTHER-PRIVATE-GOVERNANCE
```

These IDs must remain stable across the database, API, reports, analytics, and AI workflows.

---

## 6. Canonical Data Model

GovernanceIQ must use the shared BRIX domain model and may not create isolated client-side governance records.

### 6.1 `governance_entities`

Required fields:

- `id`
- `workspace_id`
- `property_id`
- `deal_id`
- `governance_type_id`
- `legal_name`
- `display_name`
- `parent_governance_entity_id`
- `management_company_organization_id`
- `registered_agent_organization_id`
- `jurisdiction`
- `state_or_province`
- `county_or_equivalent`
- `contact_phone`
- `contact_email`
- `website_url`
- `mailing_address`
- `active_status`
- `source_classification`
- `verification_status`
- `verified_at`
- `verified_by_user_id`
- `created_at`
- `updated_at`
- `archived_at`

### 6.2 `governance_documents`

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `property_id`
- `governance_entity_id`
- `evidence_id`
- `document_type_id`
- `document_title`
- `effective_date`
- `recorded_date`
- `supersedes_document_id`
- `amends_document_id`
- `version_label`
- `governing_priority`
- `is_current`
- `processing_state`
- `verification_status`
- `created_at`
- `updated_at`

### 6.3 `governance_findings`

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `property_id`
- `governance_entity_id`
- `governance_document_id`
- `finding_type_id`
- `perspective`
- `summary`
- `plain_language_explanation`
- `source_excerpt_reference`
- `source_page_start`
- `source_page_end`
- `source_section_label`
- `classification`
- `confidence_score`
- `verification_status`
- `severity`
- `strategy_impact`
- `underwriting_impact`
- `financing_impact`
- `insurance_impact`
- `offer_impact`
- `contract_impact`
- `requires_professional_review`
- `professional_type`
- `effective_date`
- `superseded_at`
- `created_at`
- `updated_at`

### 6.4 `governance_costs`

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `property_id`
- `governance_entity_id`
- `cost_type`
- `amount`
- `frequency`
- `currency`
- `effective_date`
- `due_date_rule`
- `one_time_or_recurring`
- `source_evidence_id`
- `classification`
- `verification_status`
- `included_in_underwriting`
- `underwriting_assumption_id`
- `created_at`
- `updated_at`

### 6.5 `governance_restrictions`

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `property_id`
- `governance_entity_id`
- `restriction_type_id`
- `restriction_status`
- `applies_to_owner`
- `applies_to_tenant`
- `applies_to_guest`
- `applies_to_vehicle`
- `applies_to_property_use`
- `minimum_term_days`
- `maximum_rental_count`
- `approval_required`
- `waiting_period_days`
- `application_fee`
- `transfer_fee`
- `notes`
- `source_finding_id`
- `verification_status`
- `created_at`
- `updated_at`

### 6.6 `governance_financial_snapshots`

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `governance_entity_id`
- `period_start`
- `period_end`
- `cash_balance`
- `reserve_balance`
- `annual_operating_budget`
- `annual_reserve_contribution`
- `accounts_receivable`
- `delinquency_amount`
- `delinquency_rate`
- `outstanding_debt`
- `known_special_assessments`
- `insurance_deductible`
- `member_count`
- `unit_count`
- `source_evidence_id`
- `classification`
- `verification_status`
- `created_at`

### 6.7 `governance_questions`

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `governance_entity_id`
- `audience_type`
- `question_text`
- `reason`
- `priority`
- `source_finding_id`
- `status`
- `answer_text`
- `answer_evidence_id`
- `answered_at`
- `created_at`
- `updated_at`

### 6.8 `governance_review_deadlines`

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `governance_entity_id`
- `deadline_type`
- `due_at`
- `source_evidence_id`
- `source_finding_id`
- `task_id`
- `status`
- `created_at`
- `updated_at`

---

## 7. Document Registry

GovernanceIQ must support canonical document type IDs.

```text
GOVDOC-DECLARATION
GOVDOC-CCRS
GOVDOC-BYLAWS
GOVDOC-RULES-REGULATIONS
GOVDOC-AMENDMENT
GOVDOC-ARTICLES
GOVDOC-BUDGET
GOVDOC-FINANCIAL-STATEMENT
GOVDOC-RESERVE-STUDY
GOVDOC-INSURANCE-SUMMARY
GOVDOC-INSURANCE-POLICY
GOVDOC-MEETING-MINUTES
GOVDOC-SPECIAL-ASSESSMENT
GOVDOC-DELINQUENCY-REPORT
GOVDOC-LITIGATION-DISCLOSURE
GOVDOC-RENTAL-APPLICATION
GOVDOC-LEASE-RULES
GOVDOC-ARCHITECTURAL-STANDARDS
GOVDOC-PARKING-RULES
GOVDOC-PET-RULES
GOVDOC-MOVE-RULES
GOVDOC-VIOLATION-NOTICE
GOVDOC-RESALE-CERTIFICATE
GOVDOC-ESTOPPEL
GOVDOC-MANAGEMENT-CONTRACT
GOVDOC-OTHER
```

---

## 8. Finding Registry

GovernanceIQ must classify findings deterministically using canonical IDs.

### Financial

- Dues amount
- Dues frequency
- Dues increase
- Special assessment
- Pending assessment
- Transfer fee
- Capital contribution
- Move fee
- Application fee
- Reserve contribution
- Reserve weakness indicator
- Delinquency indicator
- Association debt
- Insurance deductible exposure
- Litigation cost exposure

### Leasing and occupancy

- Rental prohibited
- Rental cap
- Owner-occupancy period
- Minimum lease term
- Maximum lease term
- STR prohibited
- MTR restricted
- Tenant approval
- Background check
- Lease registration
- Occupancy limit
- Age restriction
- Guest stay limit
- Corporate ownership restriction
- Entity ownership restriction

### Use and operation

- Home business restriction
- Commercial use restriction
- Sign restriction
- Nuisance standard
- Noise restriction
- Exterior use restriction
- Storage restriction
- Smoking restriction
- Grill/fire restriction
- Amenity access restriction

### Vehicles and parking

- Overnight parking restriction
- Assigned parking
- Guest parking
- Truck restriction
- Commercial vehicle restriction
- Trailer restriction
- RV restriction
- Boat restriction
- Motorcycle restriction
- Garage-use requirement
- Towing/enforcement rule

### Renovation and property condition

- Architectural approval
- Interior renovation approval
- Exterior modification approval
- Flooring requirement
- Contractor insurance requirement
- Work-hour restriction
- Elevator reservation
- Move deposit
- Landscaping responsibility
- Roof responsibility
- Window responsibility
- Limited common element responsibility
- Maintenance allocation

### Pets

- Pet prohibited
- Breed restriction
- Weight restriction
- Quantity restriction
- Registration fee
- Tenant pet restriction
- Service animal process note

### Transaction and title-related

- Right of first refusal
- Board approval
- Purchaser application
- Resale certificate
- Estoppel requirement
- Transfer restriction
- Approval deadline
- Waiver deadline
- Buyer review period
- Seller disclosure obligation
- Capital contribution at closing

### Governance and risk

- Litigation
- Insurance gap indicator
- Underinsured indicator
- High deductible
- Reserve study absent
- Reserve study stale
- Material deferred maintenance
- Board control issue
- Developer control
- Pending amendment
- Pending rule change
- Delinquency concentration
- Manager conflict
- Missing documents
- Conflicting provisions
- Unclear provision

---

## 9. Intake Workflow

GovernanceIQ must support intake through:

- PDF upload
- Word upload
- Image or scan
- Drag and drop
- Email body
- Email attachment
- Listing attachment
- Contract attachment
- Resale package
- Association portal download
- Manual entry
- iOS file import
- iOS share extension

### Intake sequence

1. User selects or confirms the Deal.
2. System detects or asks which governance entity the file belongs to.
3. Original file is stored immutably as Evidence.
4. File hash is calculated for duplicate detection.
5. Document type is identified.
6. Effective date and amendment relationships are extracted.
7. Processing state becomes visible.
8. Text and tables are extracted.
9. Candidate findings are generated.
10. Every candidate finding links to a page/section.
11. Low-confidence or ambiguous findings are marked for verification.
12. User reviews and accepts, rejects, or edits findings.
13. Accepted findings update canonical restrictions, costs, tasks, deadlines, and strategy compatibility.
14. Domain events trigger targeted recalculation and report refresh.
15. Deal timeline records the completed review.

No document may silently overwrite a newer governing document.

---

## 10. Document Precedence and Amendment Logic

GovernanceIQ must not assume all documents have equal authority.

The system must model:

- Declaration versus bylaws
- Recorded amendments
- Rules adopted under delegated authority
- Master association versus sub-association
- Board resolution versus governing document
- Current versus superseded versions
- Effective date versus upload date
- Property-specific addenda
- Unit-specific restrictions
- Conflicting provisions

When precedence is uncertain, BRIX must display:

- The conflicting provisions
- Source links
- Effective dates
- The apparent hierarchy
- A clear `REQUIRES LEGAL VERIFICATION` status

AI may explain the conflict but may not resolve legal precedence as fact.

---

## 11. Financial Analysis Rules

GovernanceIQ must extract and structure costs but may not make unsupported solvency conclusions.

### Required recurring costs

- Regular dues
- Master association dues
- Sub-association dues
- Utility assessments
- Amenity fees
- Parking fees
- Storage fees
- Rental administration fees
- Management pass-through fees where stated

### Required one-time costs

- Special assessments
- Capital contributions
- Transfer fees
- Move fees
- Application fees
- Resale package fees
- Architectural deposits
- Elevator deposits

### Underwriting connection

Accepted recurring costs must map to canonical underwriting assumptions.

Accepted one-time costs must map to acquisition or transaction costs.

Pending or uncertain costs must be included as scenario variables, not confirmed facts.

### Financial risk indicators

The system may identify indicators such as:

- Low reserves relative to stated obligations
- High delinquency
- Large insurance deductible
- Significant association debt
- Repeated special assessments
- Material deferred maintenance
- Pending litigation
- Missing reserve study

These must be labeled as indicators and not definitive financial conclusions.

---

## 12. Strategy Compatibility Rules

GovernanceIQ must emit strategy compatibility constraints.

Examples:

- STR prohibited → disqualify short-term rental strategy.
- Minimum 12-month lease → disqualify STR and most MTR strategies.
- Rental cap with no verified availability → mark rental strategies as blocked pending verification.
- Owner-occupancy waiting period → delay rental strategy feasibility.
- Commercial-use restriction → affect home-business or mixed-use strategies.
- Entity-ownership restriction → affect LLC ownership assumptions.
- Right of first refusal → affect OfferIQ and closing workflow.
- Renovation approval → increase timeline and execution risk.
- Trailer/vehicle restriction → affect owner-user suitability and operational fit.
- Pet restriction → affect tenant demand assumptions only when supported by the chosen strategy.

No strategy may be disqualified by AI free-form text alone. Disqualification must come from an accepted canonical restriction or explicit legal verification.

---

## 13. Buyer and Seller Perspectives

GovernanceIQ must support a perspective selector.

### Buyer perspective

Focus on:

- Use restrictions
- Rental eligibility
- Approval risk
- Fees and assessments
- Reserve and litigation indicators
- Insurance obligations
- Parking and vehicle fit
- Renovation constraints
- Review deadlines
- Resale limitations
- Questions before commitment

### Seller perspective

Focus on:

- Required disclosures
- Resale package obligations
- Existing violations
- Outstanding balances
- Transfer fees
- Approval and waiver timing
- Right-of-first-refusal process
- Repair or compliance obligations
- Document delivery requirements
- Closing delays

The perspective changes prioritization and recommendations, not the underlying extracted facts.

---

## 14. Questions Engine

GovernanceIQ must generate source-linked questions for:

### Realtor

- Is the property subject to a master and sub-association?
- Are rentals currently permitted for this specific unit/property?
- Is the rental cap full?
- Are there known pending assessments?
- Are there recent rule changes?
- Is the seller aware of violations?
- What documents remain outstanding?

### Association or manager

- Confirm current dues and all fees.
- Confirm pending or approved assessments.
- Confirm rental eligibility.
- Confirm waitlists and approval process.
- Confirm parking and vehicle rules.
- Confirm insurance deductible and coverage structure.
- Confirm litigation and claims.
- Confirm reserves and most recent reserve study.
- Confirm violations tied to the property.
- Confirm renovation approval requirements.

### Attorney

- Which document controls the conflicting provisions?
- Is the restriction enforceable in this jurisdiction?
- Does the right of first refusal affect the proposed transaction?
- Does entity ownership create an issue?
- Are there unresolved title or easement concerns?
- What deadlines are legally binding?

### Lender

- Does the association satisfy project eligibility requirements?
- Do delinquency, litigation, insurance, owner-occupancy, or reserve conditions affect financing?
- Are special assessments included in qualification?
- Are there project approval limitations?

### Insurance professional

- What portion of the building is covered by the master policy?
- What deductible exposure passes to the unit owner?
- Are ordinance/law, flood, wind, earthquake, or loss-assessment gaps present?
- What owner policy form and limits are required?

Questions must be editable, assignable, trackable, and answerable with Evidence.

---

## 15. UI and UX Requirements

GovernanceIQ must follow `docs/04-UI-UX-SYSTEM.md` and feel like a premium due-diligence workspace.

### Module header

Display:

- GovernanceIQ
- Active Deal and property
- Detected association count
- Review status
- Current document count
- Outstanding verification count
- Material restriction count
- Financial risk indicator count
- Freshness/as-of date
- Primary action: `Add Association Document`

### Summary view

The first screen must show:

1. Association hierarchy
2. Most material restrictions
3. Costs and assessments
4. Strategy blockers
5. Financing/insurance concerns
6. Missing documents
7. Review deadlines
8. Questions requiring answers
9. Current confidence and verification state

### Document review workspace

Desktop and iPad should support:

- Source document on one side
- Findings panel on the other
- Page-linked navigation
- Accept/reject/edit controls
- Filter by severity/type/status
- Amendment and precedence context
- Side-by-side conflicting provisions

### iPhone

Prioritize:

- Summary
- Material restrictions
- Questions
- Deadlines
- Document status
- Quick photo/file upload
- Voice note
- Call/email association manager

The iPhone experience must not require reviewing wide financial tables.

### Status states

Support:

- No association detected
- Association suspected
- Association confirmed
- Documents requested
- Documents partially received
- Processing
- Awaiting review
- Verified
- Conflict
- Stale
- Missing critical document
- Professional review required
- Complete

### Empty states

Empty states must explain:

- Why association documents matter
- Which documents to request
- Who to request them from
- How to upload or forward them

---

## 16. Offline and Sync Behavior

- Users may capture notes, photos, files, and questions offline.
- Original files must queue safely for upload.
- Local drafts must show `LOCALLY SAVED` until canonical sync succeeds.
- Accepted findings require online canonical persistence before triggering authoritative strategy changes.
- Conflicts must be detected using record versioning.
- No offline edit may silently overwrite a newer verified finding.
- Background upload and processing status must remain visible across app relaunch.

---

## 17. Permissions and Security

Minimum permissions:

- View governance data
- Upload governance documents
- Review findings
- Accept findings
- Edit canonical restrictions
- Mark professional verification
- Manage questions
- Export governance report
- Delete/archive documents

Platform admins may not view user documents unless explicitly authorized by support policy and audited.

All files must use workspace-isolated storage and signed/authorized access.

RLS must prevent cross-workspace access to:

- Governance entities
- Documents
- Findings
- Costs
- Restrictions
- Financial snapshots
- Questions
- Deadlines

---

## 18. Domain Events

GovernanceIQ must emit versioned events.

Required events:

```text
governance.entity.detected
governance.entity.confirmed
governance.document.uploaded
governance.document.processed
governance.document.superseded
governance.finding.created
governance.finding.accepted
governance.finding.rejected
governance.finding.verified
governance.restriction.changed
governance.cost.changed
governance.assessment.detected
governance.deadline.created
governance.question.created
governance.question.answered
governance.review.completed
governance.review.stale
```

Consumers may include:

- Underwriting
- Strategy Intelligence
- Decision Cockpit
- FinanceIQ
- OfferIQ
- ContractIQ
- Task/Deadline engine
- Notifications
- Reports
- Deal timeline

All consumers must be idempotent.

---

## 19. Recalculation and Freshness Rules

Targeted re-underwriting is required when accepted governance information changes:

- Dues
- Assessment
- Transfer fee
- Rental restriction
- Approval requirement
- Insurance obligation
- Parking/vehicle fit where part of user criteria
- Renovation timeline/cost
- Ownership restriction

Existing underwriting and strategy recommendations must become visibly stale until recalculation completes.

A prior valid result remains visible with:

- Prior as-of date
- Stale reason
- Pending recalculation state
- Retry option if recalculation fails

No blank result may replace a prior valid result because of a failed update.

---

## 20. Error Handling

Required error classes:

- Unsupported file
- Corrupt file
- Password-protected file
- Extraction failure
- OCR low confidence
- Duplicate file
- Unknown association
- Conflicting governance entity
- Missing effective date
- Missing amendment chain
- Provider timeout
- Storage failure
- Permission denied
- Version conflict
- Recalculation failure
- Report failure

Every error must state:

- What failed
- What was preserved
- Whether the Deal decision is affected
- What the user can do next
- Support reference ID where appropriate

---

## 21. Reporting Requirements

GovernanceIQ must produce a professional report section containing:

- Association identity and hierarchy
- Documents reviewed
- Documents missing
- Dues and fees
- Assessments
- Financial indicators
- Material restrictions
- Strategy impacts
- Financing and insurance concerns
- Questions and answers
- Deadlines
- Conflicts and uncertainties
- Professional review items
- Source references
- As-of date
- Verification status

Reports must not characterize AI findings as legal conclusions.

---

## 22. Performance Requirements

- Governance summary should render from canonical data without waiting for document reprocessing.
- Document list should load incrementally.
- Large files must process asynchronously.
- Users must be able to leave the screen during processing.
- Processing status must survive refresh and relaunch.
- Search/filter interactions should feel immediate for ordinary Deal volumes.
- Page-linked findings must open the source location quickly.
- No provider timeout may block the entire Deal workspace.

---

## 23. Accessibility Requirements

- WCAG 2.2 AA for web.
- VoiceOver support for iPhone and iPad.
- Dynamic Type support.
- Findings must not rely on color alone.
- Severity, status, and confidence require text labels.
- Document review must support keyboard navigation.
- Tables require accessible summaries.
- Errors and validation must be announced.
- Motion must respect reduced-motion settings.

---

## 24. Acceptance Tests

### Association detection

- Create a Deal with an association indicator.
- Confirm association identity.
- Add master and sub-association.
- Verify hierarchy is preserved.

### Document processing

- Upload declaration, bylaws, amendment, budget, and minutes.
- Verify originals remain intact.
- Verify duplicate detection.
- Verify amendments connect to the base document.
- Verify page-linked findings.

### Rental restriction

- Accept a minimum lease term restriction.
- Verify STR strategy is disqualified.
- Verify LTR remains viable when allowed.
- Verify strategy output becomes stale and then recalculates.

### Fees

- Accept dues and special assessment.
- Verify recurring dues enter underwriting.
- Verify one-time assessment enters acquisition or scenario costs.
- Verify reports reconcile.

### Parking restriction

- Accept a truck/trailer parking restriction.
- Verify it appears in Decision Cockpit as a user-fit concern.
- Verify question generation for association and realtor.

### Conflict

- Upload two documents with conflicting rental language.
- Verify both provisions remain visible.
- Verify status is `REQUIRES LEGAL VERIFICATION`.
- Verify no strategy is silently disqualified until accepted canonical restriction exists.

### Offline

- Capture a governance file and note offline on iPhone.
- Relaunch app.
- Verify draft remains.
- Restore connectivity.
- Verify upload and canonical sync.

### Security

- Verify user from another workspace cannot read or download governance files.
- Verify unauthorized role cannot accept findings.
- Verify admin access is audited.

---

## 25. Regression Tests

Must cover:

- No duplicate governance entities from repeated intake
- No duplicate costs from repeated processing
- No duplicate deadlines from retries
- Superseded documents do not remain marked current
- Rejected findings do not affect underwriting
- Editing a finding preserves history
- Strategy ranking consumes only accepted canonical restrictions
- Reports use current verified values
- Stale recommendations are labeled
- Cross-client values reconcile
- Deleted/archive behavior follows retention policy
- RLS remains enforced after migrations

---

## 26. Chapter Completion Report

Codex must provide:

1. Files changed
2. Database migrations
3. RLS policies
4. Storage changes
5. Edge Functions or APIs
6. Domain events
7. UI screens and routes
8. iPhone and iPad behavior
9. Tests added
10. Exact commands and results
11. Known limitations
12. Confirmation unrelated files were not changed
13. `CHAPTER COMPLETE` or `CHAPTER NOT COMPLETE`

---

## 27. Definition of Done

GovernanceIQ is complete only when:

- Association entities and hierarchy persist canonically.
- Original documents remain intact.
- Findings link to exact source locations where possible.
- Ambiguities and conflicts are marked for verification.
- Costs and assessments connect to underwriting.
- Restrictions connect to strategy compatibility.
- Financing and insurance concerns are surfaced.
- Questions can be assigned, answered, and evidenced.
- Review deadlines create canonical tasks.
- Buyer and seller perspectives work.
- Web, iPhone, and iPad use the same canonical data.
- Offline capture and safe sync work.
- Failures preserve prior valid output.
- Reports reconcile to the current Deal.
- RLS and storage isolation tests pass.
- No dead controls, fake success states, or disconnected findings remain.

Only then may Codex mark:

`CHAPTER COMPLETE`
