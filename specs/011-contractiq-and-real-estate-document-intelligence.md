# BRIX Specification 011 — ContractIQ and Real Estate Document Intelligence

## 1. Authority and Rules of Engagement

Governed by `docs/00-START-HERE.md` through `docs/05-BUILD-ROADMAP.md` and Specifications 001–010.

Rules:

1. ContractIQ uses the canonical Deal, Property, Evidence, contact, task/deadline, timeline, financing, governance, offer, and audit systems.
2. Original documents and emails remain immutable Evidence.
3. Every material extracted term or finding links to page, section, clause, exhibit, email, or other source anchor where possible.
4. AI may extract, summarize, compare, classify, and draft questions or discussion concepts; it may not issue final legal conclusions.
5. Low-confidence, illegible, ambiguous, incomplete, missing, or conflicting information must be marked for verification.
6. ContractIQ may propose canonical changes but may never silently modify Deal facts, assumptions, financing, strategy, tasks, deadlines, stage, or recommendation.
7. Deadlines are calculated deterministically from verified terms, trigger dates, time zones, calendars, and business-day rules.
8. Amendments/addenda link to the base contract and preserve superseded language.
9. Perspective changes interpretation, priority, and questions; it does not alter extracted facts.
10. Suggested language is a discussion draft for licensed professional review.
11. Processing failure preserves original files and prior valid analysis.
12. Web, iPhone, iPad, reports, notifications, OfferIQ, FinanceIQ, GovernanceIQ, and Decision Cockpit use the same canonical contract state.

## 2. Mission

Turn real estate contracts and transaction documents into a defensible, source-linked action layer that identifies parties, property, money, dates, obligations, contingencies, risks, conflicts, deadlines, professional-review questions, and impacts on the Deal.

ContractIQ does not replace an attorney, title company, lender, broker, closing professional, tax advisor, or other licensed professional.

## 3. Supported Perspectives

- Buyer
- Seller
- Landlord
- Tenant
- Borrower
- Lender
- Developer
- Investor
- Guarantor

The same extracted term may have different impact by perspective. The source term remains canonical and unchanged.

## 4. Supported Document Classes

### Purchase and sale

- Residential and commercial purchase agreements
- Offers/counteroffers
- Amendments/addenda
- Inspection/appraisal/financing addenda
- Attorney-review notices
- Seller/property disclosures
- Escalation/backup/short-sale/REO/new-construction documents

### Land and development

- Land purchase/option agreements
- Entitlement/rezoning/annexation/subdivision/development agreements
- Utility/infrastructure agreements
- Easements
- Agricultural/timber/mineral/conservation documents

### Leasing

- Residential/commercial leases
- Gross/modified gross/NNN/percentage/ground/master leases
- Amendments, guaranties, work letters, TI agreements, options

### Financing and investment

- Notes, mortgages/deeds of trust, loan agreements, guaranties
- Assignment of rents/security/intercreditor/subordination documents
- Seller-financing/assumption/creative-finance documents where lawful
- Operating/JV/subscription/waterfall documents

### Title, survey, closing, governance, and services

- Title commitments/exceptions
- Surveys/ALTA/settlement/closing documents
- Deeds/bills of sale/escrow agreements
- Association resale/approval/ROFR documents
- Inspection/repair/construction/change-order/professional-service agreements

## 5. Intake Methods

- PDF
- Word
- Text
- Images/scans
- Multi-page image sets
- Email body and attachments
- Drag/drop/file picker
- iOS share extension
- Camera capture
- Forwarded email
- Batch upload
- ZIP where safely supported
- Manual term entry

For each source:

- Preserve original bytes/body.
- Calculate hash.
- Capture filename/MIME/email metadata.
- Detect duplicates.
- Create canonical Evidence.
- Match/assign Deal.
- Expose upload and processing state.
- Allow manual continuation if extraction fails.

## 6. Canonical Entities

### `contracts`

- Workspace/Deal/Property IDs
- Type/title/perspective/status
- Effective/execution/expiration/closing dates
- Base/superseded contract relationships
- Source Evidence
- Verification/analysis state
- Version

Statuses:

- Draft
- Proposed
- Submitted
- Countered
- Partially Executed
- Executed
- Under Review
- Contingent
- Amended
- Superseded
- Terminated
- Cancelled
- Expired
- Closed
- Unknown

### `contract_parties`

- Contract
- Contact/organization
- Party role
- Legal/display name
- Authority/capacity
- Signature status/date
- Verification

### `contract_terms`

- Type/title
- Normalized/display value
- Unit/currency
- Effective date
- Source page/section/anchor/text
- Confidence/verification/materiality
- Applicable party/perspective
- Version

### `contract_deadlines`

- Deadline type
- Trigger type/date
- Offset/unit
- Business-day rule
- Holiday calendar
- Timezone
- Calculated due time
- Source anchor
- Verification
- Canonical task ID
- Status

### `contract_findings`

- Finding type/category
- Summary
- Severity
- Perspective impact
- Source anchor/text
- Confidence/verification
- Professional-review recommendation
- Connected proposal/task

### `contract_conflicts`

- Related contracts/terms
- Conflict type/description
- Severity
- Resolution state
- Resolver/time/notes

### `contract_change_proposals` and `contract_questions`

Store suggested negotiation concepts, discussion-draft language, rationale, recipient role, priority, status, professional-review need, and linked terms/findings/tasks.

## 7. Required Extraction Categories

### Identity and property

- Parties/legal names/entity types
- Signatory authority
- Property address/legal description/parcel IDs
- Included/excluded assets and personal property

### Economic terms

- Price
- Earnest money/deposit schedule
- Credits/concessions/repairs
- Prorations/escrows/holdbacks
- Brokerage/transfer/closing costs
- Rent/security deposits/assumed liabilities

### Financing

- Contingency
- Loan type/amount/rate/term limits
- Application/commitment deadlines
- Appraisal/lender conditions
- Assumption/seller-financing terms

Verified financing proposals connect to FinanceIQ.

### Due diligence

- Inspection
- Attorney/document/title/survey/environmental/zoning/association/lease/financial review
- Feasibility/access/testing/restoration rights

### Closing and possession

- Closing/possession dates
- Location/method
- Risk of loss/casualty/condemnation
- Deliverables/funds/recording

### Representations and warranties

- Authority
- Litigation
- Environmental
- Leases/contracts
- Taxes/assessments
- Violations/permits/zoning/utilities
- Condition/brokerage/foreign-person status
- Survival

### Default and remedies

- Buyer/seller default
- Earnest-money remedy
- Specific performance/liquidated damages
- Cure/termination/fees/indemnity/limitations

### Assignment and transfer

- Assignment/consent/affiliate/nominee
- Change of control
- Assumption
- ROFR/ROFO

### Lease-specific

- Rent/additional rent/CAM/pass-throughs
- Escalations/options
- TI/work letter
- Maintenance/repair/use/exclusive/co-tenancy/radius
- Guaranty/security deposit/holdover/assignment/sublease

## 8. Document Hierarchy and Amendment Logic

- Link amendments/addenda to base documents.
- Record effective/execution dates.
- Identify candidate superseded terms.
- Preserve both original and superseding language.
- Do not automatically decide controlling law/hierarchy when unclear.
- Flag conflict/professional review.

## 9. Deadline Engine

Deadline calculation requires:

- Verified source term
- Trigger event/date
- Offset
- Calendar/business-day rule
- Holiday calendar
- Timezone
- Extension/cure provisions
- Confidence/verification

A deadline remains verification-required until source and trigger are sufficiently confirmed. Critical legal deadlines must not rely solely on push notifications.

## 10. Perspective Analysis

For each perspective, produce:

- Benefits
- Risks
- Unusual terms
- Missing protections/information
- Negotiation concepts
- Questions
- Required professional review
- Deal/strategy/finance impact

The analysis must not claim enforceability, validity, completeness, or legal sufficiency.

## 11. Contract Analysis Output

- Executive summary
- Document inventory/hierarchy
- Parties/property
- Money
- Deadlines
- Contingencies
- Obligations/deliverables
- Representations/warranties
- Defaults/remedies
- Assignment/transfer
- Conflicts/missing exhibits
- Risks by perspective
- Questions by professional role
- Discussion-draft negotiation concepts
- Proposed connected Deal changes
- Verification checklist

## 12. Connected Change Workflow

1. Extract term/finding.
2. Preserve source anchor and confidence.
3. Present proposal.
4. Authorized user accepts, edits, rejects, or defers.
5. Accepted proposal updates the owning canonical subsystem.
6. Emit domain event after persistence.
7. Trigger targeted recalculation/re-ranking if material.
8. Update tasks/deadlines, Cockpit, timeline, reports, OfferIQ, and notifications.
9. Preserve before/after state.

ContractIQ never writes directly into underwriting results or another subsystem’s result table.

## 13. User Experience

### Web

- Document inventory and status
- Source document viewer with anchored findings
- Summary and perspective switch
- Money/deadline/risk sections
- Conflict comparison
- Questions/proposals
- Connected Deal impact

### iPhone

- Capture/import
- Compact summary/deadlines/risks/questions
- Source-page navigation
- Task actions
- Offline upload queue

### iPad

- Document and analysis side by side
- Multi-document comparison
- Keyboard/pointer/drag-drop
- Deal/Cockpit context

## 14. State Model

- Draft
- Uploaded
- Queued/processing
- Partial
- Awaiting Verification
- Current
- Current with Conflicts
- Stale
- Failed with Prior Analysis
- Professional Review Recommended
- Superseded
- Offline Cached

## 15. Security and Privacy

- Workspace/RLS scope.
- Authorized private Storage.
- Provider/AI secrets server-side.
- Prompt-injection defenses for untrusted document content.
- Sensitive content absent from unsafe logs.
- Rate limits and usage/cost metering.
- Share/export scope explicitly controlled.

## 16. Domain Events

- `contract.document_received`
- `contract.analysis_requested`
- `contract.analysis_completed`
- `contract.analysis_failed`
- `contract.term_proposed`
- `contract.term_accepted`
- `contract.deadline_accepted`
- `contract.conflict_detected`
- `contract.amended`
- `contract.superseded`
- `contract.status_changed`

Consumers: tasks/deadlines, timeline, FinanceIQ, GovernanceIQ, OfferIQ, underwriting, strategy, Cockpit, reports, notifications.

## 17. Testing Requirements

- Document intake/hash/duplicate tests.
- Extraction/source-anchor fixtures.
- Perspective tests using same facts.
- Deadline/date/timezone/business-day fixtures.
- Amendment/supersession/conflict tests.
- Low-confidence/illegible/missing-exhibit tests.
- Connected proposal acceptance/rejection tests.
- RLS/storage/prompt-injection tests.
- Web/iOS/report reconciliation.
- Accessibility/performance tests for large documents.

## 18. Verification and Validation

### Functional verification

- Documents upload, save, reopen, process, retry, compare, supersede, and remain intact.
- Findings/terms link to sources.
- Deadlines create canonical tasks only after verified acceptance.
- Manual review works after extraction failure.

### Accuracy and boundary verification

- Facts remain distinct from perspective analysis.
- Ambiguity/conflict/low confidence is visible.
- No legal conclusion or silent canonical mutation occurs.
- Suggested language is clearly a discussion draft.

### Integration verification

- Finance terms connect to FinanceIQ.
- Governance documents/findings connect to GovernanceIQ.
- Offer and negotiation context connects to OfferIQ.
- Accepted Deal changes trigger underwriting/strategy as required.
- Cockpit, tasks, notifications, timeline, reports, web, iPhone, and iPad reconcile.

### UX verification

- Uploading, processing, partial, verification, conflict, stale, failed, superseded, and offline states are clear.
- Users can move from finding to exact source and next action without losing Deal context.

### Definition of Done

Complete only when simple and complex documents are preserved, source-linked, perspective-aware, deadline-safe, professionally bounded, and seamlessly connected to the canonical Deal lifecycle.

**SPECIFICATION STATUS: REVIEWED AND REPAIRED**
