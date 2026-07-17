# BRIX Specification 011 — ContractIQ and Real Estate Document Intelligence

## 1. Authority and Required Reading

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
- `specs/009-financeiq-and-capital-structure.md`
- `specs/010-governanceiq-associations-and-restrictions.md`

Codex must re-read all permanent product, engineering, UI/UX, evidence, security, state, audit, and chapter-completion rules before implementing this specification.

ContractIQ must not create a separate Deal record, a duplicate task system, a duplicate evidence store, a duplicate contact system, or a disconnected document-analysis page. Every extracted fact, deadline, risk, question, recommendation, and accepted change must connect to the canonical BRIX Deal.

---

## 2. Mission

ContractIQ is the canonical BRIX subsystem for ingesting, preserving, extracting, comparing, and analyzing real estate contracts and transaction documents from the buyer, seller, landlord, tenant, borrower, lender, developer, investor, or other supported perspective.

ContractIQ must turn complex and simple documents into a defensible, source-linked action layer.

ContractIQ must answer:

1. What documents were received?
2. Which document controls which obligation?
3. Who are the parties?
4. What property or assets are covered?
5. What money, dates, conditions, contingencies, duties, approvals, representations, defaults, remedies, and risks exist?
6. Which provisions benefit or disadvantage the selected perspective?
7. Which language is unusual, conflicting, missing, incomplete, or unclear?
8. Which deadlines must become canonical tasks?
9. Which terms affect underwriting, financing, strategy, governance, inspection, appraisal, offer structure, closing, or disposition?
10. What questions should be asked of the realtor, attorney, lender, seller, buyer, builder, title company, insurer, contractor, surveyor, association, or other professional?
11. Which suggested changes or negotiation points should be reviewed by a licensed professional?

ContractIQ is not a law firm, attorney, title company, closing agent, lender, broker, or substitute for professional legal review.

---

## 3. Non-Negotiable ContractIQ Rules

1. Original source documents must remain intact and immutable.
2. Every extracted material term must link to the exact page, section, clause, exhibit, or source anchor where possible.
3. AI may extract, summarize, compare, classify, and draft questions, but may not issue final legal conclusions.
4. Ambiguous, illegible, incomplete, conflicting, or low-confidence terms must be marked `verification_required`.
5. ContractIQ must never silently modify underwriting, financing, strategy, tasks, or Deal status.
6. Accepted changes must flow through explicit, versioned proposals.
7. Deadlines must be calculated deterministically from verified terms.
8. Date calculations must preserve source date, trigger event, timezone, calendar rule, business-day rule, and uncertainty.
9. Amendments and addenda must link to the base document and preserve superseded language.
10. Conflicts between documents must remain visible until resolved by an authorized user or professional.
11. Buyer and seller perspectives must use the same extracted facts with different impact analysis.
12. Suggested language must be clearly labeled as a discussion draft for professional review.
13. ContractIQ must not represent that a contract is enforceable, valid, complete, binding, or legally sufficient without professional confirmation.
14. Email-body terms and attachments must be analyzed together when they form one transaction record.
15. Web, iPhone, iPad, reports, exports, notifications, and the Deal timeline must show the same canonical contract state.
16. No processing failure may replace or hide a prior valid analysis.

---

## 4. Supported Document Classes

ContractIQ must support simple and complex forms, including:

### 4.1 Residential purchase and sale

- Purchase agreement
- Offer to purchase
- Counteroffer
- Amendment
- Addendum
- Inspection addendum
- Appraisal addendum
- Financing addendum
- Attorney-review notice
- Seller disclosure
- Lead-based-paint disclosure
- Radon disclosure
- Property-condition disclosure
- Personal-property addendum
- Post-closing possession agreement
- Escalation addendum
- Backup offer
- Short-sale addendum
- REO addendum
- New-construction contract
- Builder warranty

### 4.2 Commercial purchase and sale

- Letter of intent
- Purchase and sale agreement
- Due-diligence agreement
- Access agreement
- Confidentiality agreement
- Estoppel
- Tenant certification
- Assignment and assumption
- Environmental indemnity
- Closing instruction
- Proration agreement
- Development agreement
- Easement agreement
- Reciprocal easement agreement
- Ground lease
- Sale-leaseback agreement

### 4.3 Land and development

- Land purchase agreement
- Option agreement
- Entitlement contingency
- Rezoning contingency
- Annexation agreement
- Subdivision agreement
- Development agreement
- Utility agreement
- Impact-fee agreement
- Infrastructure reimbursement agreement
- Farm or agricultural lease
- Timber agreement
- Mineral-rights agreement
- Conservation easement

### 4.4 Leasing

- Residential lease
- Commercial lease
- Gross lease
- Modified gross lease
- NNN lease
- Percentage lease
- Ground lease
- Master lease
- Sublease
- Lease amendment
- Lease guaranty
- Work letter
- Tenant improvement agreement
- Option to renew
- Option to purchase

### 4.5 Financing and investment

- Promissory note
- Mortgage or deed of trust
- Loan agreement
- Guaranty
- Security agreement
- Assignment of leases and rents
- Intercreditor agreement
- Subordination agreement
- Seller-financing agreement
- Subject-to or assumption documents where lawful
- Operating agreement
- Joint venture agreement
- Subscription agreement
- Private-placement materials
- Waterfall or distribution agreement

### 4.6 Title, survey, and closing

- Title commitment
- Title exception documents
- Survey
- ALTA statement
- Closing disclosure
- Settlement statement
- Deed
- Bill of sale
- Affidavit
- FIRPTA-related form where relevant
- Escrow agreement
- Closing checklist

### 4.7 Association and governance

Governance documents are analyzed primarily by GovernanceIQ, but ContractIQ must consume relevant findings and may analyze:

- Resale certificate
- Estoppel
- Association approval
- Transfer agreement
- Right-of-first-refusal waiver

### 4.8 Inspection, appraisal, construction, and service

- Inspection agreement
- Repair agreement
- Contractor proposal
- Construction contract
- Change order
- Architect agreement
- Engineering agreement
- Appraisal engagement
- Property-management agreement
- Brokerage agreement

---

## 5. Supported Intake Methods

ContractIQ must support:

- PDF
- Word documents
- Plain text
- Image files
- Scanned documents
- Multi-page image sets
- Email body
- Email attachments
- Drag and drop
- File picker
- iOS share extension
- Camera capture
- Forwarded email ingestion
- Multiple-document batch upload
- ZIP package where safely supported
- Manual term entry

### 5.1 Intake requirements

For every file or email:

- Preserve original bytes.
- Calculate file hash.
- Capture filename and MIME type.
- Capture sender, recipient, subject, date, and thread metadata for email.
- Detect duplicates.
- Create canonical Evidence record.
- Assign Deal or queue for matching.
- Record upload and processing status.
- Never block manual continuation when extraction fails.

---

## 6. Canonical Domain Model

### 6.1 `contracts`

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `property_id`
- `contract_type`
- `title`
- `perspective`
- `status`
- `effective_date`
- `execution_date`
- `expiration_date`
- `closing_date`
- `version_number`
- `supersedes_contract_id`
- `base_contract_id`
- `source_evidence_id`
- `verification_state`
- `analysis_state`
- `created_by`
- `created_at`
- `updated_at`

Supported statuses:

- Draft
- Proposed
- Submitted
- Countered
- Partially executed
- Executed
- Under review
- Contingent
- Amended
- Superseded
- Terminated
- Cancelled
- Expired
- Closed
- Unknown

### 6.2 `contract_parties`

Required fields:

- `id`
- `contract_id`
- `party_role`
- `contact_id`
- `organization_id`
- `display_name`
- `legal_name`
- `signature_status`
- `signature_date`
- `verification_state`

### 6.3 `contract_terms`

Required fields:

- `id`
- `contract_id`
- `term_type`
- `title`
- `normalized_value`
- `display_value`
- `unit`
- `currency_code`
- `effective_date`
- `source_page`
- `source_section`
- `source_anchor`
- `quoted_text`
- `confidence`
- `verification_state`
- `materiality`
- `applies_to_party_role`
- `created_at`
- `updated_at`

### 6.4 `contract_deadlines`

Required fields:

- `id`
- `contract_id`
- `deadline_type`
- `trigger_type`
- `trigger_date`
- `offset_value`
- `offset_unit`
- `business_day_rule`
- `holiday_calendar`
- `timezone`
- `calculated_due_at`
- `source_page`
- `source_section`
- `verification_state`
- `canonical_task_id`
- `status`

### 6.5 `contract_findings`

Required fields:

- `id`
- `contract_id`
- `finding_type`
- `title`
- `summary`
- `severity`
- `perspective_impact`
- `risk_category`
- `source_page`
- `source_section`
- `source_anchor`
- `quoted_text`
- `confidence`
- `verification_state`
- `professional_review_recommended`
- `created_at`

### 6.6 `contract_conflicts`

Required fields:

- `id`
- `contract_id`
- `related_contract_id`
- `conflict_type`
- `term_a_id`
- `term_b_id`
- `description`
- `severity`
- `resolution_state`
- `resolved_by`
- `resolved_at`
- `resolution_notes`

### 6.7 `contract_change_proposals`

Required fields:

- `id`
- `contract_id`
- `proposal_type`
- `target_term_id`
- `current_language`
- `suggested_concept`
- `suggested_language_draft`
- `reason`
- `perspective`
- `priority`
- `professional_review_required`
- `status`
- `created_by`
- `created_at`

Supported statuses:

- Draft
- Discuss
- Sent for review
- Accepted for negotiation
- Rejected
- Incorporated
- Superseded

### 6.8 `contract_questions`

Required fields:

- `id`
- `contract_id`
- `recipient_role`
- `question`
- `reason`
- `related_finding_id`
- `related_term_id`
- `priority`
- `status`
- `canonical_task_id`

---

## 7. Required Extraction Categories

ContractIQ must extract, where applicable:

### 7.1 Identity and authority

- Parties
- Legal names
- Entity types
- Signatory capacity
- Property address
- Legal description
- Parcel IDs
- Included assets
- Excluded assets
- Authority representations

### 7.2 Economic terms

- Purchase price
- Earnest money
- Deposit schedule
- Additional deposits
- Seller credits
- Closing credits
- Repair credits
- Prorations
- Escrows
- Holdbacks
- Brokerage compensation
- Transfer taxes
- Closing costs
- Rent credits
- Security deposits
- Assumed liabilities
- Personal-property allocation

### 7.3 Financing

- Financing contingency
- Loan type
- Loan amount
- Maximum rate
- Minimum term
- Appraisal condition
- Commitment deadline
- Application deadline
- Assumption condition
- Seller-financing terms
- Subject-to terms where lawful
- Lender approval condition

Finance terms must reference FinanceIQ after verification.

### 7.4 Due diligence

- Inspection period
- Attorney review
- Document review
- Title review
- Survey review
- Environmental review
- Zoning review
- Association review
- Lease review
- Financial review
- Permit review
- Feasibility period
- Access rights
- Testing rights
- Restoration obligations

### 7.5 Closing and possession

- Closing date
- Closing location
- Closing method
- Possession date
- Post-closing possession
- Risk of loss
- Casualty
- Condemnation
- Closing deliverables
- Funds required
- Recording conditions

### 7.6 Representations and warranties

- Seller representations
- Buyer representations
- Authority
- Litigation
- Environmental
- Leases
- Service contracts
- Taxes
- Assessments
- Violations
- Permits
- Zoning
- Utilities
- Property condition
- Brokerage
- Foreign-person status
- Survival period

### 7.7 Default and remedies

- Buyer default
- Seller default
- Earnest-money remedy
- Specific performance
- Liquidated damages
- Termination rights
- Cure periods
- Attorney fees
- Indemnification
- Limitation of liability
- Survival

### 7.8 Assignment and transfer

- Assignment permitted
- Consent required
- Affiliate assignment
- Nominee rights
- Change-of-control restriction
- Assumption rights
- Right of first refusal
- Right of first offer

### 7.9 Lease-specific terms

- Base rent
- Additional rent
- CAM
- Tax pass-through
- Insurance pass-through
- Percentage rent
- Rent escalations
- Renewal options
- Expansion options
- Termination options
- Tenant improvement allowance
- Work letter
- Maintenance responsibility
- Repair responsibility
- Use clause
- Exclusive use
- Co-tenancy
- Radius restriction
- Guaranty
- Security deposit
- Holdover
- Assignment/subletting

---

## 8. Perspective Engine

ContractIQ must support at minimum:

- Buyer
- Seller
- Landlord
- Tenant
- Borrower
- Lender
- Developer
- Investor
- Guarantor

The perspective engine must not alter extracted facts. It may alter:

- Benefit/risk interpretation
- Priority
- Suggested questions
- Suggested negotiation concepts
- Recommended professional review
- Deal impact summary

Example:

A broad inspection contingency may be favorable to a buyer and unfavorable to a seller, while the exact clause remains the same canonical term.

---

## 9. Contract Analysis Output

Every analysis must produce:

- Executive summary
- Document inventory
- Party summary
- Money summary
- Deadline summary
- Contingency summary
- Closing summary
- Buyer pros and cons
- Seller pros and cons
- Perspective-specific concerns
- Material risks
- Ambiguous terms
- Missing information
- Missing exhibits or addenda
- Conflicts
- Unusual provisions
- Suggested questions
- Suggested negotiation concepts
- Professional-review list
- Deal, underwriting, financing, strategy, governance, inspection, appraisal, and OfferIQ impacts

No output may imply final legal advice.

---

## 10. Deadline Engine

ContractIQ must use deterministic deadline logic.

### 10.1 Required inputs

- Trigger date
- Trigger event
- Offset
- Calendar days or business days
- Included/excluded first day
- Included/excluded final day
- Weekend rule
- Holiday calendar
- Time of day
- Timezone
- Extension rule
- Notice-delivery rule

### 10.2 Required behavior

- Mark unclear date rules for verification.
- Preserve source clause.
- Show calculation steps.
- Create canonical task only after verified or explicitly accepted.
- Recalculate dependent deadlines when trigger changes.
- Preserve prior deadline history.
- Notify affected users of material changes.

---

## 11. Amendment and Conflict Handling

ContractIQ must:

- Link amendments to base documents.
- Identify which clauses are modified.
- Preserve original and amended language.
- Show side-by-side comparison.
- Detect inconsistent dates, prices, deposits, parties, contingencies, and exhibits.
- Prevent old extraction jobs from overwriting newer analysis.
- Mark unresolved conflicts in the Decision Cockpit.
- Allow authorized resolution with audit history.

The system must not assume a later-dated document always controls without evidence.

---

## 12. Suggested Changes and Negotiation Support

ContractIQ may provide:

- Suggested issue to negotiate
- Suggested business objective
- Suggested clause concept
- Optional draft language for attorney review
- Priority
- Reason
- Affected risk
- Affected deadline
- Affected financial output

Every suggested change must display:

> Draft discussion language only. Professional legal review is required before use.

ContractIQ must never auto-edit or execute a contract.

---

## 13. Cross-Module Integration

### 13.1 Deal and PDRM

- Contract status updates Deal stage only through explicit workflow.
- Parties link to canonical Contacts and Organizations.
- Activities appear in the Deal timeline.

### 13.2 OfferIQ

- Accepted offer structure must be referenced, not duplicated.
- ContractIQ compares executed contract terms to the latest offer version.
- Differences must be visible.

### 13.3 FinanceIQ

- Verified financing terms and deadlines link to FinanceIQ.
- Conflicts between contract and financing scenario are material warnings.

### 13.4 GovernanceIQ

- Association-review rights, transfer approvals, rental restrictions, and resale requirements link to GovernanceIQ findings.

### 13.5 Underwriting

- Verified price, credits, deposits, fees, assumed obligations, and timing may propose underwriting changes.
- Changes require explicit acceptance.

### 13.6 InspectionIQ and AppraisalIQ

- Inspection and appraisal contingencies create canonical deadlines.
- Repair agreements and appraisal provisions link to the corresponding modules.

### 13.7 Decision Cockpit

Show:

- Contract status
- Next deadline
- Material risks
- Unresolved conflicts
- Missing documents
- Professional-review items
- Contract-to-offer differences

---

## 14. Web UX Requirements

The web module must include:

- Document inventory
- Status and perspective selector
- Source-linked summary
- Terms table
- Deadline timeline
- Risks and conflicts
- Questions by recipient
- Suggested changes
- Side-by-side document comparison
- Amendment comparison
- Deal-impact panel
- Source document viewer
- Verification workflow
- Audit and version history
- Export actions

The user must be able to move from every finding to:

- Exact source
- Related term
- Related deadline
- Related task
- Related Deal impact
- Related question
- Verification state

---

## 15. iPhone UX Requirements

The iPhone experience must support:

- Upload or scan documents
- View executive summary
- View next deadlines
- View critical risks
- Open exact source page
- Mark item for verification
- Add note or voice note
- Create question or task
- Compare offer and contract highlights
- Work offline with synced content

The mobile experience must prioritize immediate action and deadlines.

---

## 16. iPad UX Requirements

The iPad experience must support:

- Split view with document and analysis
- Side-by-side amendment comparison
- Drag and drop
- Keyboard navigation
- Multi-column terms and deadlines
- Pencil or note support where appropriate
- Contract and Deal Cockpit side by side
- No stretched iPhone layout

---

## 17. State, Freshness, and Background Processing

Canonical analysis states:

- Not uploaded
- Uploaded
- Queued
- Processing
- Partially processed
- Review required
- Verified
- Conflict
- Stale
- Failed
- Superseded
- Professional review required

Required behavior:

- Durable processing state
- Retry without duplication
- Prior valid analysis remains visible during reprocessing
- As-of date and source version displayed
- Stale analysis marked immediately after material document change
- No indefinite spinner
- Timeout and escalation for stuck jobs

---

## 18. Offline, Sync, and Conflict Handling

Offline users may:

- View synced documents and analysis
- Capture files or photos
- Add notes
- Draft questions
- Mark verification items

Authoritative extraction waits for backend sync.

Conflicts must:

- Detect version mismatch
- Preserve both edits
- Prevent silent overwrite
- Allow authorized resolution
- Maintain audit history

Uploads, analysis jobs, and deadline creation must be idempotent.

---

## 19. Domain Events

ContractIQ must consume relevant events including:

- `deal.created`
- `offer.updated`
- `offer.selected`
- `evidence.uploaded`
- `evidence.verified`
- `financing_scenario.selected`
- `governance_finding.verified`
- `inspection.completed`
- `appraisal.completed`

ContractIQ must emit:

- `contract.created`
- `contract.document_received`
- `contract.processing_started`
- `contract.processing_completed`
- `contract.processing_failed`
- `contract.term_extracted`
- `contract.term_verified`
- `contract.deadline_created`
- `contract.deadline_changed`
- `contract.conflict_detected`
- `contract.conflict_resolved`
- `contract.risk_changed`
- `contract.executed`
- `contract.amended`
- `contract.terminated`
- `contract.professional_review_required`

All events must be workspace-scoped, idempotent, version-aware, and auditable.

---

## 20. AI Responsibilities and Restrictions

### Allowed

- OCR and extraction
- Document classification
- Clause classification
- Plain-language summary
- Perspective analysis
- Conflict suggestion
- Missing-document suggestion
- Question drafting
- Negotiation-concept drafting
- Explanation of verified terms

### Prohibited

- Final legal conclusion
- Enforceability determination
- Silent contract editing
- Silent deadline creation from low-confidence terms
- Silent underwriting changes
- Claiming execution or approval without evidence
- Replacing professional legal review

Every AI result must retain provider, model, workflow version, prompt version, evidence IDs, timestamp, confidence, and human-confirmation state.

---

## 21. Permissions and Security

Minimum permissions:

- View contract
- Upload contract
- Edit draft metadata
- Verify terms
- Verify deadlines
- Resolve conflicts
- Create change proposal
- Export contract report
- View sensitive documents
- Manage templates

Requirements:

- Server-side authorization
- RLS
- Authorized file access
- Audit material actions
- No public source-file URLs
- Sensitive financing, identity, signature, and legal information protected
- Redaction support for sharing where required

---

## 22. Error and Recovery States

Must handle:

- Corrupt file
- Unsupported format
- Password-protected document
- Illegible scan
- Missing pages
- Extraction failure
- Low-confidence extraction
- Conflicting dates
- Missing exhibits
- Duplicate documents
- Permission denied
- Offline draft
- Sync conflict
- Provider outage
- Stuck processing job
- Invalid deadline rule

Every error must state:

- What failed
- What was preserved
- Whether the Deal decision is affected
- Whether prior analysis remains valid
- How to recover

---

## 23. Accessibility and Performance

### Accessibility

- WCAG 2.2 AA
- VoiceOver and Dynamic Type
- Keyboard-accessible document navigation
- Source anchors announced clearly
- Severity not conveyed by color alone
- Accessible tables and timelines
- Validation errors announced

### Performance

- Summary loads independently from full document rendering.
- Large documents paginate or stream.
- OCR and analysis run asynchronously.
- Search supports large contract packages.
- Prior verified analysis remains available during reprocessing.
- Client caches are version-aware.

---

## 24. Reports and Exports

Required outputs:

- Contract executive summary
- Buyer pros and cons
- Seller pros and cons
- Perspective-specific risk report
- Deadline report
- Questions for realtor
- Questions for attorney
- Questions for lender
- Questions for builder
- Questions for title company
- Suggested negotiation issues
- Missing-document checklist
- Offer-to-contract comparison
- Amendment comparison
- Verification checklist

Every output must include:

- Deal and property identity
- Contract and version
- Perspective
- As-of date
- Source references
- Verification state
- Material conflicts
- Professional-review disclaimer

---

## 25. Required Test Coverage

### Unit tests

- Date calculations
- Business-day rules
- Amendment linkage
- Term precedence
- Conflict detection
- Perspective mapping
- Staleness logic
- Offer-to-contract comparison

### Integration tests

- Verified price proposes underwriting update
- Financing contingency links to FinanceIQ
- Association-review clause links to GovernanceIQ
- Deadlines create canonical tasks
- Executed contract updates Deal stage only through approved workflow
- RLS blocks cross-workspace access

### End-to-end tests

1. Upload residential purchase contract.
2. Extract price, earnest money, inspection, financing, appraisal, closing, and possession.
3. Verify terms and deadlines.
4. Compare buyer and seller perspectives.
5. Create attorney and realtor questions.
6. Compare against selected offer.
7. Upload amendment changing price and closing.
8. Confirm prior terms remain in history.
9. Confirm underwriting and tasks update through explicit acceptance.
10. Generate contract report.
11. Capture document on iPhone offline and sync.
12. Review side-by-side on iPad.

---

## 26. Chapter Completion Checklist

Before marking complete, Codex must verify:

- Canonical contract tables and migrations exist.
- RLS policies and tests pass.
- Originals are immutable.
- Material terms link to exact sources.
- Deadlines are deterministic and traceable.
- Amendments preserve history.
- Conflicts remain visible until resolved.
- Buyer and seller perspectives work over the same facts.
- Questions link to findings.
- Suggested changes carry professional-review warnings.
- Underwriting and financing updates require acceptance.
- Offer-to-contract comparison works.
- Web, iPhone, and iPad show consistent states.
- Offline capture and sync work.
- Background jobs expose status and retry.
- Reports reconcile.
- No visible control is disconnected.
- No legal conclusion or false execution claim is presented.

---

## 27. Definition of Done

ContractIQ is complete only when an authorized user can:

1. Upload simple or complex contract packages by file, email, scan, or share extension.
2. Preserve every original document.
3. Extract and verify material terms and deadlines.
4. Trace every material result to source evidence.
5. Compare buyer and seller perspectives.
6. Identify conflicts, ambiguity, missing documents, and professional-review items.
7. Generate role-specific questions and negotiation issues.
8. Link verified terms to the canonical Deal, FinanceIQ, GovernanceIQ, underwriting, tasks, OfferIQ, and Decision Cockpit.
9. Process amendments without losing history.
10. Reopen the same canonical analysis on web, iPhone, and iPad.
11. Recover from failed extraction, offline use, stale state, and sync conflict without losing work.

Codex must end implementation with the required verification report and one of:

`CHAPTER COMPLETE`

or

`CHAPTER NOT COMPLETE`
