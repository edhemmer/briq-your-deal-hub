# BRIX Specification 010 — GovernanceIQ, Associations, Restrictions, and Community Risk

## 1. Authority and Rules of Engagement

Governed by `docs/00-START-HERE.md` through `docs/05-BUILD-ROADMAP.md` and Specifications 001–009.

Rules:

1. GovernanceIQ owns analysis of private governance structures affecting the Property or Deal; it does not replace ContractIQ or legal counsel.
2. Original governing documents remain immutable Evidence.
3. Every material finding links to page, section, clause, meeting minute, budget line, or source anchor where possible.
4. AI may extract, summarize, compare, and identify questions; it may not issue final legal conclusions.
5. Rental, parking, vehicle, trailer, pet, renovation, use, insurance, financing, and transfer restrictions must connect to strategy compatibility and Deal risk.
6. Dues, assessments, reserves, litigation, insurance, delinquencies, and budget findings must retain period, source, confidence, and verification.
7. Conflicting or unclear documents remain visible until resolved.
8. Amendments and newer rules may supersede prior language, but history remains.
9. No finding silently changes assumptions, strategy, financing, or recommendation.
10. Accepted governance changes are versioned and trigger targeted re-evaluation.
11. Web, iPhone, iPad, reports, OfferIQ, ContractIQ, and Decision Cockpit use the same canonical findings.
12. Processing failure preserves prior valid analysis and allows manual review.

## 2. Mission

Identify and operationalize HOA, COA, POA, condominium, cooperative, master association, architectural-control, private-road, shared-utility, and similar governance structures that may affect use, cost, financing, insurability, renovation, leasing, parking, operations, resale, or disposition.

## 3. Supported Governance Types

- Homeowners association
- Condominium association
- Property owners association
- Master association
- Sub-association
- Cooperative
- Architectural review committee
- Private road/maintenance association
- Shared utility/well/septic organization
- Business/industrial park association
- Mixed-use association
- Community development or special private governance arrangement

Public zoning/tax districts remain primarily MarketIQ/property records unless privately governed obligations apply.

## 4. Supported Documents

- Declaration/CC&Rs
- Bylaws
- Rules/regulations
- Amendments
- Articles/incorporation records
- Budgets
- Financial statements
- Reserve studies
- Insurance summaries/policies
- Meeting minutes
- Assessment notices
- Violation notices
- Resale certificates/disclosures
- Estoppels
- Architectural standards/applications
- Parking/vehicle/trailer rules
- Pet rules
- Leasing/rental applications
- Short-term rental rules
- Maintenance matrices
- Litigation notices
- Management agreements
- Fee schedules
- Right-of-first-refusal documents

## 5. Canonical Entities

### `governance_records`

- ID
- Workspace/Deal/Property IDs
- Governance type/name
- Parent/child association relationship
- Management organization/contact
- Status
- Effective dates
- Source evidence
- Verification/confidence
- Version

### `governance_documents`

- Governance record
- Evidence ID
- Document type
- Effective/adopted date
- Supersession relationship
- Analysis state

### `governance_findings`

- Finding type/category
- Summary
- Normalized value/requirement
- Severity
- Strategy/Deal impact
- Source anchor
- Confidence
- Verification state
- Professional-review recommendation
- Effective date

### `governance_financials`

- Period
- Dues/revenue/expenses
- Reserves
- Delinquencies
- Assessments
- Debt
- Insurance
- Source/verification

### `governance_conflicts`

Preserve contradictory provisions, dates, documents, budgets, statements, or user/provider information.

## 6. Required Finding Categories

### Costs and financial health

- Regular dues
- Transfer/application/move/lease fees
- Special assessments
- Pending/proposed assessments
- Reserve balance and adequacy indicators
- Delinquency
- Association debt
- Budget deficit/surplus
- Major planned projects
- Litigation cost exposure
- Insurance deductibles/gaps

### Leasing and occupancy

- Rental prohibition/cap
- Minimum lease term
- Owner-occupancy requirement
- Waiting period
- Tenant approval/application
- Lease registration/fees
- Short-term rental restriction
- Room rental/co-living restrictions
- Corporate/LLC ownership restrictions

### Parking, vehicles, and trailers

- Driveway/overnight parking
- Street parking
- Garage requirements
- Commercial-vehicle definitions
- Pickup truck restrictions
- Trailer/RV/boat restrictions
- Guest parking
- Towing/enforcement
- Dimensions/time limits

### Use and operations

- Residential/commercial use
- Home business
- Signage
- Noise
- Storage
- Pets/animals
- Amenities
- Common-area obligations
- Maintenance allocation

### Renovation and construction

- Architectural approval
- Exterior/interior restrictions
- Contractor requirements
- Work hours
- Materials/colors
- Landscaping/fencing
- Solar/EV/antenna rules
- Structural/mechanical/plumbing restrictions
- Deposits/fees

### Transfer and financing

- Right of first refusal
- Board approval
- Transfer fees
- Sale/lease application
- Lender questionnaire requirements
- Litigation/insurance/reserve conditions affecting lending
- Entity ownership/assignment restrictions

## 7. Financial Analysis Boundaries

GovernanceIQ may calculate descriptive indicators such as reserve ratio, delinquency percentage, budget trends, assessment burden, and dues growth using deterministic formulas.

It must not claim a reserve study is adequate or a legal/financial condition is acceptable without professional context.

Accepted dues/assessment/insurance assumptions flow to the underwriting engine through versioned proposals.

## 8. Document Hierarchy and Supersession

The system must preserve:

- Document type
- Adoption/effective date
- Amendment relationship
- Superseded provisions
- Current controlling candidate
- Verification uncertainty

When hierarchy is unclear, mark professional review required. Do not automatically treat the newest file upload as controlling.

## 9. Analysis Workflow

1. Identify governance indicator during intake or user entry.
2. Create/link governance record.
3. Upload/import documents as Evidence.
4. Classify document types and relationships.
5. Extract source-linked provisions and financials.
6. Detect conflicts/missing documents.
7. Produce findings and questions.
8. User verifies/accepts/rejects proposals.
9. Accepted findings update canonical costs/restrictions.
10. Trigger strategy/finance/underwriting re-evaluation where material.
11. Update Cockpit, tasks, timeline, reports, OfferIQ, and ContractIQ.

## 10. Strategy and Financing Impact

Governance findings may:

- Disqualify or condition STR, rental, room-rental, co-living, renovation, parking-dependent, trailer/RV, home-business, or redevelopment strategies.
- Increase operating expense/cash required.
- Affect lender eligibility or condo review.
- Require association approval before offer/closing/lease/renovation.
- Affect insurability or deductible exposure.
- Create deadlines or professional-review tasks.

Hard restrictions remain visible even when financial scores are favorable.

## 11. Questions and Verification

Generate source-linked questions for:

- Association/manager
- Realtor
- Seller
- Attorney
- Lender
- Insurer
- Contractor/architect
- Title/closing professional

Questions identify why the answer matters and the source ambiguity/risk behind it.

## 12. User Experience

### Summary

- Association identity/type
- Dues/assessments
- Financial-health indicators
- Insurance/litigation
- Leasing/occupancy
- Parking/vehicle/trailer
- Renovation/use/pets
- Transfer/financing
- Confidence/freshness
- Missing documents/questions

### Source review

Users can navigate from finding to exact page/section and compare conflicting documents.

### iPhone

Compact restrictions, dues, parking/trailer, rental, contacts, questions, and camera/file capture.

### iPad

Document and findings side by side, financial tables, comparison, and Deal context.

## 13. State Model

- No governance identified
- Documents requested
- Uploading/processing
- Partial
- Awaiting verification
- Current
- Current with conflicts
- Stale
- Failed with prior analysis
- Professional review required
- Offline cached

## 14. Domain Events

- `governance.record_created`
- `governance.document_received`
- `governance.analysis_completed`
- `governance.finding_created`
- `governance.conflict_detected`
- `governance.finding_accepted`
- `governance.restriction_changed`
- `governance.financials_changed`
- `governance.analysis_stale`

Consumers: underwriting, strategy, FinanceIQ, Cockpit, ContractIQ, OfferIQ, tasks, notifications, reports, timeline.

## 15. Security and Privacy

- RLS/workspace scope.
- Private documents use authorized Storage.
- Provider/AI processing follows privacy rules.
- Sensitive resident/member information is minimized.
- No raw private document content in unsafe logs.
- Administrative access is audited.

## 16. Testing Requirements

- Document classification/hierarchy tests.
- Source-anchor extraction tests.
- Rental/parking/trailer/renovation restriction fixtures.
- Financial indicator tests.
- Amendment/supersession/conflict tests.
- Missing/illegible/provider-failure tests.
- Strategy/finance/underwriting integration.
- RLS/storage tests.
- Web/iOS/report reconciliation and accessibility.

## 17. Verification and Validation

### Functional verification

- Governance records/documents/findings save, reopen, version, conflict, and reprocess correctly.
- Original documents remain intact.
- Findings link to exact sources where possible.
- Manual review continues when processing fails.

### Integration verification

- Accepted costs/restrictions flow through canonical proposals.
- Underwriting, strategy, FinanceIQ, Cockpit, ContractIQ, OfferIQ, tasks, notifications, reports, timeline, web, iPhone, and iPad reconcile.
- No duplicate task/evidence/financial engine is created.

### Accuracy verification

- Unclear language is marked for verification.
- No AI legal conclusion appears as fact.
- Document hierarchy and effective dates are preserved.
- Hard restrictions remain visible.

### UX verification

- Partial, conflict, stale, failed, professional-review, and offline states are clear.
- Users can answer practical questions such as rental, parking, trailer, dues, assessment, and renovation risk quickly.

### Definition of Done

Complete only when governance documents and financial/restriction findings are source-defensible, historically preserved, and connected seamlessly to the Deal decision lifecycle.

**SPECIFICATION STATUS: REVIEWED AND REPAIRED**
