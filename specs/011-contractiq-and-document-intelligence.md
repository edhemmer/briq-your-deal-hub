# 011 — ContractIQ and Document Intelligence

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
- `specs/007-decision-cockpit-and-deal-workspace.md`
- `specs/009-financeiq-and-capital-structure.md`
- `specs/010-governanceiq-associations-and-restrictions.md`

Codex must re-read the permanent build rules, chapter-start protocol, completion gate, premium UI/UX requirements, canonical data rules, and no-stale-state rules before implementation.

---

# 1. Mission

ContractIQ turns real estate contracts and related transaction documents into a connected, source-linked, defensible part of the canonical Deal.

It must help an investor understand:

- what the agreement says,
- which obligations apply,
- which deadlines control,
- which contingencies protect or expose the investor,
- which financial terms affect underwriting,
- which attachments or exhibits are missing,
- which provisions conflict,
- which terms require professional review,
- and what should happen next.

ContractIQ is not a replacement for a licensed attorney, title professional, lender, broker, inspector, appraiser, tax advisor, or other qualified professional.

ContractIQ may organize, extract, compare, summarize, flag, explain, and generate questions. It may not provide final legal conclusions, create an attorney-client relationship, or represent that a document is enforceable, complete, or suitable for a specific jurisdiction without professional review.

---

# 2. User Problems Solved

Contract review is often fragmented across email, PDFs, Word files, scans, addenda, amendments, disclosures, association documents, financing documents, title documents, inspection terms, and informal messages.

ContractIQ must prevent:

- missed deadlines,
- misunderstood contingencies,
- disconnected amendments,
- stale offer or financing terms,
- silent conflicts between documents,
- duplicate or outdated versions,
- missing exhibits,
- reliance on low-confidence extraction,
- and contract terms that do not flow into the Deal timeline, underwriting, OfferIQ, FinanceIQ, GovernanceIQ, InspectionIQ, AppraisalIQ, reports, and notifications.

---

# 3. Scope

## 3.1 Supported transaction contexts

ContractIQ must support, where applicable:

- Residential purchase and sale
- Residential new construction
- Condominium and cooperative purchase
- Multifamily acquisition
- Commercial purchase and sale
- Mixed-use acquisition
- Land purchase
- Development acquisition
- Portfolio/package acquisition
- REO and distressed sale
- Seller financing
- Assumption of financing
- Subject-to structures where lawful
- Lease option and option contracts
- Commercial letter of intent
- Purchase option
- Assignment agreement
- Joint venture or partnership-related transaction documents
- Amendments, addenda, notices, waivers, extensions, and counteroffers

## 3.2 Supported file and intake types

- Searchable PDF
- Scanned PDF
- DOC/DOCX
- RTF and plain text where useful
- JPG, PNG, HEIC, TIFF, and supported image formats
- Email body
- Email attachments
- EML or MSG where supported
- Drag and drop
- Mobile file import
- iOS share extension
- Camera scan
- Multi-file document packet
- ZIP package only if safely extracted and validated

Unsupported or encrypted formats must produce a clear recovery path.

---

# 4. Canonical Ownership

## 4.1 Canonical entities

ContractIQ must use or create canonical entities such as:

- `contracts`
- `contract_versions`
- `contract_documents`
- `contract_document_links`
- `contract_parties`
- `contract_terms`
- `contract_deadlines`
- `contract_contingencies`
- `contract_obligations`
- `contract_findings`
- `contract_conflicts`
- `contract_questions`
- `contract_acknowledgements`
- `evidence`
- `evidence_findings`
- `tasks`
- `deadlines`
- `activities`
- `domain_events`
- `audit_events`

Names may differ if the canonical data architecture already defines equivalents, but duplicate shadow models are prohibited.

## 4.2 Canonical contract record

A canonical contract record must include at minimum:

- immutable `contract_id`
- `workspace_id`
- `deal_id`
- `property_id` where applicable
- transaction side: buyer, seller, landlord, tenant, assignor, assignee, or other
- transaction type
- jurisdiction
- governing document family
- current authoritative version
- execution status
- effective date
- signed date
- expiration date
- closing date if present
- source evidence IDs
- review state
- extraction state
- verification state
- attorney-review state if recorded by user
- created by
- created at
- updated at
- archived at

## 4.3 Versioning

Every uploaded version, amendment, addendum, counteroffer, extension, waiver, or replacement document must remain historically preserved.

ContractIQ must never silently replace the original file.

The system must distinguish:

- draft,
- proposed,
- revised,
- countered,
- partially executed,
- fully executed,
- amended,
- superseded,
- terminated,
- expired,
- withdrawn,
- and unknown status.

The current authoritative version must be explicit and reversible with audit history.

---

# 5. Document Ingestion Workflow

## 5.1 Entry points

Users must be able to add contract documents from:

- Deal workspace
- ContractIQ module
- Global Add Evidence action
- Email intake
- Drag and drop
- iPhone/iPad Files picker
- iOS share extension
- Camera scan
- OfferIQ handoff
- GovernanceIQ handoff

Every entry point must preserve the active workspace, Deal, property, user, and source context.

## 5.2 Upload sequence

1. Validate file type, size, encryption, malware status, and workspace entitlement.
2. Compute a durable content hash.
3. Check for exact duplicates and likely duplicates.
4. Store the original file immutably in the correct workspace and Deal path.
5. Create canonical Evidence and ContractDocument records.
6. Record upload state and audit event.
7. Queue text extraction and OCR when needed.
8. Detect document type, language, jurisdiction clues, execution status, and possible relationship to existing documents.
9. Extract structured terms with page/section anchors.
10. Detect conflicts, missing pages, missing signatures, missing exhibits, and unresolved references.
11. Present findings for verification.
12. After accepted verification, update connected tasks, deadlines, financing assumptions, OfferIQ, GovernanceIQ, inspection/appraisal workflows, cockpit status, and reports.

No extracted value may silently overwrite a user-confirmed canonical value.

## 5.3 Duplicate handling

Exact duplicates must not create duplicate processing or duplicate deadlines.

Likely duplicates must show:

- filename,
- hash similarity or content similarity,
- document date,
- parties,
- apparent version,
- and recommended action.

The user may link, keep separate, or mark one as superseded.

---

# 6. Extraction and Classification

## 6.1 Required extraction categories

ContractIQ must extract, where present:

### Parties

- Buyer/purchaser
- Seller
- Broker and brokerage
- Attorney
- Title/escrow company
- Lender
- Guarantor
- Assignor/assignee
- Builder/developer
- Association
- Other named parties

### Property

- Street address
- Unit
- Parcel number
- Legal description
- Included parcels
- Excluded parcels
- Included personal property
- Excluded personal property
- Easements or access references

### Financial terms

- Purchase price
- Earnest money
- Additional earnest money
- Deposits
- Seller credits
- Repair credits
- Closing-cost allocation
- Prorations
- Escrow amounts
- Financing amount
- Interest rate
- Amortization
- loan term
- balloon
- points/fees
- assumption terms
- seller financing terms
- rent credits
- option consideration
- assignment fee

### Dates and deadlines

- Offer expiration
- Acceptance deadline
- Effective date
- Earnest money due
- Attorney review
- Due diligence
- Inspection
- Financing application
- Financing approval
- Appraisal
- Association review
- Title objection
- Survey objection
- Environmental review
- Zoning review
- Permit review
- Feasibility period
- Closing
- Possession
- Cure period
- Notice period
- Extension option
- Termination date

### Contingencies

- Financing
- Inspection
- Attorney review
- Appraisal
- Sale of other property
- Association review
- Title
- Survey
- Zoning
- Land use
- Environmental
- Soil/percolation
- Utilities
- Water/sewer
- Development approvals
- Tenant estoppels
- Lease review
- Rent roll verification
- Financial statement review
- Insurance
- Lender approval
- Partner/investment committee approval

### Obligations and risk allocation

- Seller disclosures
- Buyer diligence obligations
- Repair obligations
- Access rights
- Maintenance before closing
- Risk of loss
- Casualty
- Condemnation
- Default
- Remedies
- Liquidated damages
- Specific performance
- Attorneys’ fees
- Indemnification
- Representations
- Warranties
- Survival
- Assignment restrictions
- Confidentiality
- Brokerage commissions
- Tax allocation
- Utility transfer
- Possession and occupancy
- Holdover
- Personal property
- Record retention

### Attachments and references

- Addenda
- Exhibits
- Riders
- Disclosures
- Legal description
- Survey
- Rent roll
- Leases
- Operating statements
- Association documents
- Environmental reports
- Inspection reports
- Appraisal
- Title commitment
- Loan documents
- Construction plans/specifications

## 6.2 Value classification

Each extracted item must retain:

- source document ID
- version ID
- page number
- section/clause heading where possible
- bounding box or text anchor where possible
- extracted text excerpt
- normalized value
- classification
- confidence
- verification state
- accepted canonical target if any
- reviewer
- reviewed date

## 6.3 Confidence rules

Low-confidence, incomplete, conflicting, ambiguous, handwritten, damaged, or OCR-dependent content must be marked `needs_verification`.

The UI must distinguish:

- confirmed,
- user-entered,
- extracted and verified,
- extracted but unverified,
- inferred,
- conflict,
- and missing.

---

# 7. Contract Relationship Graph

ContractIQ must connect related documents into a clear document family.

The graph must support relationships such as:

- amends,
- supersedes,
- extends,
- waives,
- terminates,
- counters,
- incorporates,
- references,
- satisfies,
- conflicts with,
- and attached to.

Users must be able to view:

- base contract,
- current controlling version,
- amendment chain,
- open questions,
- changed terms,
- unresolved conflicts,
- and missing referenced documents.

A later amendment may change only selected terms; unchanged terms remain inherited from the prior controlling version.

---

# 8. Deadline and Task Integration

## 8.1 Canonical deadline creation

Verified contract deadlines must create canonical Deadline and Task records.

Each deadline must include:

- source clause
- triggering event
- absolute date/time if known
- relative rule if dependent on another event
- time zone
- business-day/calendar-day rule
- holiday handling if defined
- responsible party
- severity
- status
- reminder schedule
- consequence of missing
- verification state

## 8.2 Relative deadlines

Relative deadlines must preserve the source rule, for example:

- five business days after acceptance,
- ten days after receipt,
- before closing,
- within forty-eight hours of notice.

When the triggering event becomes known, the system computes the date deterministically and records the calculation inputs.

## 8.3 Deadline changes

Amendments and extensions must:

- preserve the prior deadline,
- create the revised deadline,
- mark the prior version superseded,
- update reminders,
- and create an audit trail.

No duplicate reminders may be created from repeated processing.

---

# 9. Cross-Module Connections

## 9.1 OfferIQ

ContractIQ consumes accepted offer terms and returns:

- accepted/countered terms,
- executed price,
- earnest money,
- credits,
- contingencies,
- deadlines,
- and deviations from the last OfferIQ scenario.

OfferIQ and ContractIQ must never maintain competing purchase-price or term records.

## 9.2 FinanceIQ

Verified financing terms may create or update a financing scenario only through a versioned user-confirmation flow.

Conflicts between contract financing requirements and current FinanceIQ assumptions must be visible.

## 9.3 GovernanceIQ

Association-review obligations, document-delivery requirements, approval rights, transfer fees, rental restrictions, and right-of-first-refusal terms must connect to GovernanceIQ.

## 9.4 InspectionIQ and AppraisalIQ

Inspection and appraisal contingencies must create the required workflows and deadlines.

Later inspection or appraisal results must show their effect on contract options, deadlines, and termination/renegotiation decisions without providing legal conclusions.

## 9.5 Underwriting and Strategy Engine

Verified contract economics must trigger targeted recalculation.

The system must not display an old recommendation as current after the executed price, credits, financing, closing costs, possession, repair obligations, or other material terms change.

## 9.6 Decision Cockpit

The cockpit must show:

- contract status,
- critical deadlines,
- material unresolved findings,
- current controlling document,
- missing exhibits,
- financing/offer conflicts,
- and recommended next action.

## 9.7 Reports and notifications

Verified contract terms must flow into reports and notifications using canonical records and current version identifiers.

---

# 10. AI Responsibilities and Restrictions

## 10.1 Allowed AI functions

AI may:

- classify documents,
- extract candidate terms,
- summarize provisions,
- compare versions,
- identify possible conflicts,
- identify missing references,
- explain clauses in plain language,
- generate questions,
- organize buyer and seller considerations,
- and suggest verification priorities.

## 10.2 Prohibited AI functions

AI may not:

- determine enforceability,
- declare legal compliance,
- provide final legal advice,
- silently change canonical values,
- calculate authoritative deal returns,
- create deadlines without source linkage,
- claim a contract is complete,
- fabricate missing clauses,
- or represent professional review.

## 10.3 Prompt-injection controls

Document text must be treated as untrusted evidence, never as system instruction.

A document may not alter:

- authorization,
- tool access,
- system prompts,
- provider routing,
- data scope,
- or cross-workspace boundaries.

---

# 11. Premium UI/UX Requirements

## 11.1 Module overview

The ContractIQ overview must show:

1. contract status,
2. current controlling version,
3. transaction side,
4. purchase price and primary economics,
5. next critical deadline,
6. unresolved material findings,
7. missing documents,
8. verification progress,
9. professional-review status if recorded,
10. primary next action.

## 11.2 Document review workspace

Desktop and iPad should support a split-view experience:

- source document viewer,
- page navigation,
- search,
- extracted findings,
- clause detail,
- evidence anchor,
- verification controls,
- and connected Deal impact.

Selecting a finding must navigate to the correct source page and highlighted clause where technically possible.

## 11.3 iPhone experience

The iPhone experience must prioritize:

- upload/share,
- status,
- critical deadlines,
- high-severity findings,
- verification queue,
- questions,
- and document access.

Complex side-by-side comparison must use native drill-down rather than compressed desktop tables.

## 11.4 Verification queue

Users must be able to:

- accept,
- correct,
- reject,
- defer,
- mark for attorney review,
- add note,
- and link to another source.

Corrections must preserve original extraction and create audit history.

## 11.5 Contract comparison

Comparison must show:

- added,
- removed,
- modified,
- unchanged,
- and unresolved terms.

Material changes must be grouped by economics, deadlines, contingencies, obligations, remedies, and attachments.

## 11.6 Empty, loading, stale, and failure states

The module must intentionally support:

- no contract uploaded,
- upload pending,
- OCR processing,
- partial extraction,
- awaiting verification,
- processing failed,
- unsupported file,
- encrypted file,
- missing pages,
- stale analysis after a new version,
- provider outage,
- offline draft,
- sync conflict,
- and permission denied.

No state may end in a generic spinner or dead end.

---

# 12. Offline, Sync, and Conflict Handling

- Original files selected offline must be retained locally in an encrypted pending-upload queue.
- The user must see local, queued, uploading, processing, verified, failed, and synced states.
- Retries must be idempotent.
- A failed upload must not lose the source file.
- Concurrent verification edits must use version checks.
- Conflicts must preserve both edits until resolved.
- Newer contract versions must mark prior analysis stale without deleting it.
- Background processing must expose durable status across devices.
- Web, iPhone, and iPad must show the same canonical contract state after synchronization.

---

# 13. Security, Privacy, and Access

- All contract files are workspace-scoped and Deal-scoped.
- RLS must prevent cross-workspace access.
- Storage paths must not be publicly enumerable.
- Downloads and previews require authorized access or expiring signed URLs.
- Service-role credentials must never ship to clients.
- Sensitive document access must be auditable.
- Admin access must be explicit, limited, and logged.
- File scanning and content validation must occur before downstream processing.
- Logging must not expose full contract text, signatures, account numbers, SSNs, or confidential information.
- Data retention and deletion must follow workspace and legal-retention policy.

---

# 14. Performance and Reliability

Target behavior:

- Upload acknowledgement within 500 ms after client submission where network permits.
- Viewer opens previously processed documents promptly from authorized storage.
- Extraction runs asynchronously and does not block Deal navigation.
- Large documents use paginated or incremental rendering.
- Processing jobs use idempotency keys.
- Stuck jobs receive timeout, retry, and escalation handling.
- Provider outages preserve the original document and allow manual review.
- The system must never replace a valid prior result with an empty failed result.

---

# 15. Domain Events

ContractIQ may consume:

- `deal.created`
- `offer.accepted`
- `offer.countered`
- `evidence.uploaded`
- `email.received`
- `financing.updated`
- `governance.document_added`
- `inspection.completed`
- `appraisal.completed`

ContractIQ may emit:

- `contract.created`
- `contract.document_uploaded`
- `contract.processing_started`
- `contract.processing_completed`
- `contract.processing_failed`
- `contract.version_added`
- `contract.authoritative_version_changed`
- `contract.finding_created`
- `contract.finding_verified`
- `contract.conflict_detected`
- `contract.deadline_created`
- `contract.deadline_changed`
- `contract.executed`
- `contract.terminated`
- `contract.material_terms_changed`

Every event must be idempotent, workspace-scoped, Deal-scoped, versioned, and auditable.

---

# 16. Acceptance Tests

## 16.1 Ingestion

- Upload searchable PDF.
- Upload scanned PDF requiring OCR.
- Upload DOCX.
- Import email body and attachment.
- Share a document from iPhone.
- Detect exact duplicate.
- Detect likely revised version.
- Preserve original file.

## 16.2 Extraction

- Extract parties, property, price, earnest money, closing, and contingencies.
- Link every finding to source.
- Mark low-confidence items for verification.
- Detect missing exhibit.
- Detect conflicting dates.
- Detect changed price in amendment.

## 16.3 Integration

- Verified deadline creates task and notification schedule.
- Executed price updates canonical Deal economics through confirmation.
- FinanceIQ conflict is shown.
- Governance review obligation appears in GovernanceIQ.
- Inspection contingency creates InspectionIQ workflow.
- Material change marks old underwriting/recommendation stale.
- Reports use the current controlling version.

## 16.4 UX

- Desktop split view works.
- iPad split view works.
- iPhone verification flow works.
- Selecting a finding opens the source clause.
- Empty/loading/error/stale/offline/conflict states work.
- No visible control is disconnected.

## 16.5 Security

- Cross-workspace access is denied.
- Unauthorized storage URL access fails.
- Signed URL expires.
- Admin access is audited.
- Sensitive text is excluded from logs.

---

# 17. Regression Tests

- Amendment does not delete original contract.
- Reprocessing does not duplicate deadlines.
- Re-upload does not duplicate evidence.
- A failed OCR job preserves prior valid analysis.
- Corrected extraction survives reprocessing.
- Superseded version remains available.
- Contract changes do not overwrite user assumptions silently.
- Web and iOS show identical verified terms.
- Archived Deal does not continue sending active deadline notifications unless policy explicitly requires it.
- Deleted or revoked workspace membership removes document access.

---

# 18. Definition of Done

ContractIQ is complete only when:

- all supported intake paths work,
- original documents remain intact,
- extraction is source-linked,
- verification is explicit,
- version chains work,
- conflicts and missing attachments are visible,
- canonical deadlines and tasks are created correctly,
- OfferIQ, FinanceIQ, GovernanceIQ, InspectionIQ, AppraisalIQ, underwriting, strategy ranking, cockpit, reports, and notifications are connected,
- stale results are labeled,
- offline upload and retry are safe,
- RLS and storage isolation tests pass,
- web, iPhone, and iPad workflows pass,
- accessibility requirements pass,
- no dead controls or silent failures remain,
- and the full chapter completion gate is documented.

At completion, Codex must report:

1. files changed,
2. database migrations,
3. storage changes,
4. Edge Functions or APIs,
5. domain events,
6. tests added,
7. exact commands and results,
8. known limitations,
9. confirmation unrelated files were not changed,
10. `CHAPTER COMPLETE` or `CHAPTER NOT COMPLETE`.
