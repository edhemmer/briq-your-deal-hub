# Specification 004 — Property Intake and Source Tracking

## Authority

This specification is governed by:

- `docs/00-START-HERE.md`
- `docs/01-PRODUCT-CONSTITUTION.md`
- `docs/02-ENGINEERING-STANDARDS.md`
- `docs/03-DATA-ARCHITECTURE.md`
- `docs/04-UI-UX-SYSTEM.md`
- `docs/05-BUILD-ROADMAP.md`
- `specs/001-authentication-and-workspaces.md`
- `specs/002-dashboard-and-application-shell.md`
- `specs/003-deals-and-pdrm-core.md`

Codex must re-read the permanent build rules, chapter start protocol, chapter completion gate, premium UI/UX requirements, cross-module connection rules, and stale-state rules before implementation.

---

# 1. Mission

Property Intake converts an address, listing URL, shared page, manual entry, email, document, or portfolio package into a canonical BRIX Property and Deal without losing source context, inventing facts, creating duplicates, or blocking the user when external data is unavailable.

The intake workflow must be fast enough for field use and rigorous enough to become the starting point for underwriting, strategy analysis, market research, financing, visits, contracts, inspections, appraisals, reports, and portfolio comparison.

A successful intake produces:

1. One canonical `property_id`
2. One canonical `deal_id`
3. A source-linked property profile
4. A transparent list of facts, estimates, assumptions, unknowns, and conflicts
5. A preliminary readiness state
6. A clear next action
7. Durable background processing status
8. A complete audit trail

Property Intake must never imply that imported or AI-extracted data has been verified unless the evidence supports that classification.

---

# 2. Business Purpose

Investors frequently encounter potential properties through inconsistent channels:

- Listing websites
- Broker emails
- Text messages
- MLS sheets
- Builder packets
- County records
- Auction notices
- Commercial offering memoranda
- Land packages
- Social media links
- Drive-by discovery
- Referrals
- Direct seller conversations

BRIX must turn this fragmented information into one durable Deal record with minimal re-entry and maximum traceability.

The intake subsystem exists to reduce:

- Time from discovery to first analysis
- Duplicate Deal creation
- Manual transcription errors
- Loss of listing evidence
- Confusion about data source and freshness
- Conflicting values across modules
- Incomplete property identity
- Abandoned opportunities caused by provider failure

---

# 3. Scope

## 3.1 Included

- Address-based intake
- Listing URL intake
- Manual intake
- iOS share extension intake
- Email and attachment intake
- File-based intake
- Portfolio and multi-property package intake
- Duplicate detection
- Property resolution
- Listing import
- Public-record import where available
- Source tracking
- Data classification
- Conflict handling
- Background processing
- Preliminary Deal creation
- Initial strategy intent
- Initial Deal stage
- Intake review and correction
- Save, reopen, retry, and resume
- Web, iPhone, and iPad UX
- Offline draft intake
- Audit and domain events

## 3.2 Not included

This specification does not define the complete logic for:

- Underwriting calculations
- Strategy ranking
- MarketIQ conclusions
- Contract analysis
- Photo defect analysis
- Inspection analysis
- Appraisal analysis
- Financing approval
- Legal conclusions

Property Intake may collect inputs required by those systems, but it must not duplicate their authoritative logic.

---

# 4. Dependencies

Required completed dependencies:

- Authentication and workspace isolation
- Application shell and navigation
- Canonical Property and Deal model
- Evidence model
- Activity and audit model
- Background job status model
- Storage authorization
- Domain event infrastructure

Required downstream integrations:

- Underwriting Engine
- Strategy Intelligence
- Decision Cockpit
- MarketIQ
- GovernanceIQ
- VisitIQ
- ReportIQ
- Admin usage monitoring

---

# 5. Canonical Ownership

## 5.1 Canonical owner

The backend owns:

- Property identity
- Deal identity
- Source records
- Imported field values
- Field classifications
- Conflict records
- Duplicate candidates
- Import job state
- Data freshness
- Accepted value history
- Intake completion state

Clients may create drafts locally when offline, but no local client may become the permanent source of truth.

## 5.2 Canonical data path

`User intake action → client normalization → intake request → authorization → draft or canonical Property resolution → duplicate candidate search → Deal creation/linking → source capture → provider jobs → field classification → conflict detection → user review → accepted values → domain events → preliminary readiness → Deal cockpit`

---

# 6. Intake Entry Points

## 6.1 Global Quick Add

Available from:

- Web global action
- Dashboard
- iPhone quick action
- iPad sidebar or command menu
- Deal pipeline

Options:

- Paste listing URL
- Enter address
- Create manually
- Import email or file
- Add portfolio/package

## 6.2 iOS Share Extension

The user may share a supported listing page, web URL, PDF, image, or email attachment to BRIX.

Required behavior:

- Authenticate or queue securely when session recovery is possible
- Allow workspace selection when user belongs to multiple workspaces
- Show detected address/title/source
- Allow quick Deal creation with minimal fields
- Queue full extraction in the background
- Confirm that the item was saved
- Deep-link to the new Deal
- Never lose the shared content if processing fails

## 6.3 Drive-by or field intake

The user may create a Deal from current location or manually entered address.

Required fields should be minimal:

- Address or map pin
- Optional Deal name
- Optional asking price
- Optional intended strategy
- Optional voice note or photo

The workflow must allow completion in under one minute when connectivity is available.

## 6.4 Email intake

Supported methods:

- Forward to a unique BRIX workspace intake address
- Drag email file into web/iPad
- Import email body and attachments
- Attach an email to an existing Deal

Email intake must retain:

- Sender
- Recipients
- Subject
- Sent/received date
- Body
- Attachments
- Message identifier where available
- Thread identifier where available
- Source mailbox method
- Original file or raw representation when allowed

---

# 7. Intake Workflow

## Step 1 — Capture source

The original input must be preserved before extraction begins.

Examples:

- URL
- Raw email
- PDF
- Image
- Manual entry snapshot
- Shared-page metadata
- Map pin

## Step 2 — Normalize location

Attempt to determine:

- Street address
- Unit
- City
- County
- State/province/region
- Postal code
- Country
- Latitude
- Longitude
- Parcel identifier if available

Normalization must preserve the original user-entered or source-provided text.

## Step 3 — Search for duplicate Property candidates

Search within the workspace and canonical property index using:

- Normalized address
- Parcel number
- Coordinates
- Unit identifier
- Listing source ID
- Legal description fragments
- Building/project name
- Existing evidence references

Do not silently merge.

The user must see:

- Candidate Property
- Match reasons
- Confidence
- Existing Deals tied to the Property
- Option to link, create separate, or review more detail

## Step 4 — Create or link Property

If no acceptable Property exists, create a canonical Property with a durable `property_id`.

If the user links to an existing Property, preserve the new source as additional evidence.

## Step 5 — Create Deal

Create a Deal with:

- `deal_id`
- `property_id`
- `workspace_id`
- Deal name
- Intake source
- Initial stage
- Intended strategy if supplied
- Asking price if supplied
- Assigned user if applicable
- Created-by identity
- Created timestamp

Recommended initial stage:

- `lead` for minimal intake
- `screening` when sufficient intake data is available
- `research` when user intentionally begins detailed review

## Step 6 — Run source extraction

Extraction may identify:

- Listing title
- Asking price
- Property type
- Beds/baths
- Square footage
- Lot size
- Year built
- Unit count
- Parking
- Taxes
- HOA/COA indicators
- Description
- Listing status
- Days on market where legitimately available
- Broker/agent
- Photos
- Features
- Public-record identifiers

Every extracted value must retain source and confidence.

## Step 7 — Retrieve permitted external data

Provider integrations may attempt:

- Geocoding
- Parcel data
- Tax data
- Sale history
- Assessed value
- Zoning references
- Flood/hazard references
- Permit references
- Building facts
- Association indicators
- Market data references

Provider failure must not block manual continuation.

## Step 8 — Detect conflicts

Examples:

- Listing says 4 bedrooms; county record says 3
- User says 2,000 square feet; listing says 1,850
- Two sources disagree on year built
- Parcel and address do not align
- Unit count differs across records

BRIX must retain all conflicting values and identify:

- Field
- Competing values
- Sources
- Dates
- Classifications
- Confidence
- Suggested resolution path

## Step 9 — User review

The review screen must prioritize:

1. Property identity
2. Asking price
3. Property type
4. Size/unit count
5. Intended strategy
6. Material conflicts
7. Missing decision-changing inputs
8. Processing status

The user may accept, edit, reject, or leave unresolved.

## Step 10 — Commit accepted values

Accepted values become canonical current values through a versioned field-value model.

Original evidence and rejected values remain preserved.

## Step 11 — Emit domain events

At minimum:

- `property.intake_started`
- `property.created`
- `property.linked_existing`
- `deal.created`
- `source.captured`
- `source.extraction_started`
- `source.extraction_completed`
- `source.extraction_failed`
- `property.duplicate_candidate_detected`
- `property.conflict_detected`
- `property.value_accepted`
- `property.intake_completed`
- `deal.readiness_changed`

## Step 12 — Route to next action

Possible next actions:

- Complete missing property facts
- Run preliminary underwriting
- Review duplicate candidate
- Resolve conflicts
- Add financing
- Schedule visit
- Upload documents
- Open Decision Cockpit

---

# 8. Data Model Requirements

## 8.1 `property_sources`

Minimum fields:

- `id`
- `workspace_id`
- `property_id`
- `deal_id` nullable
- `source_type`
- `source_name`
- `source_url` nullable
- `source_external_id` nullable
- `retrieved_at`
- `effective_at` nullable
- `raw_evidence_id`
- `license_classification` nullable
- `status`
- `created_by`
- timestamps

## 8.2 `property_field_values`

Minimum fields:

- `id`
- `workspace_id`
- `property_id`
- `deal_id` nullable
- `field_key`
- `value_json`
- `normalized_value_json` nullable
- `classification`
- `source_id`
- `confidence` nullable
- `effective_at` nullable
- `observed_at`
- `is_current`
- `verification_state`
- `accepted_by` nullable
- `accepted_at` nullable
- `supersedes_id` nullable
- timestamps

## 8.3 `property_conflicts`

Minimum fields:

- `id`
- `workspace_id`
- `property_id`
- `deal_id` nullable
- `field_key`
- `status`
- `severity`
- `resolution_type` nullable
- `resolved_value_id` nullable
- `resolved_by` nullable
- `resolved_at` nullable
- timestamps

Conflict candidates should be represented through a relation to the competing field-value IDs.

## 8.4 `property_duplicate_candidates`

Minimum fields:

- `id`
- `workspace_id`
- `candidate_property_id`
- `target_property_id`
- `match_score`
- `match_reasons_json`
- `status`
- `resolved_by` nullable
- `resolved_at` nullable
- timestamps

## 8.5 `intake_jobs`

Minimum fields:

- `id`
- `workspace_id`
- `deal_id`
- `property_id`
- `job_type`
- `status`
- `progress_current` nullable
- `progress_total` nullable
- `provider` nullable
- `attempt_count`
- `idempotency_key`
- `input_version`
- `output_version` nullable
- `error_code` nullable
- `error_message_safe` nullable
- `started_at` nullable
- `completed_at` nullable
- `next_retry_at` nullable
- timestamps

---

# 9. Classification Rules

Allowed classifications:

- Confirmed fact
- User-entered fact
- External estimate
- System estimate
- User assumption
- AI observation
- Professional opinion
- Inferred information
- Unknown
- Conflict

Rules:

- Listing data is not automatically a confirmed fact.
- County data may still be stale or incomplete.
- User edits must preserve source history.
- AI extraction must never silently upgrade classification.
- Professionally issued documents may produce professional opinions but not necessarily confirmed facts.
- Unknown is preferred over fabricated completion.

---

# 10. Source Precedence

BRIX must not use a simplistic global precedence hierarchy.

Precedence is field-specific and context-specific.

Examples:

- Legal description may prioritize recorded documents.
- Asking price may prioritize current listing evidence.
- Square footage may remain conflicted between appraisal, public record, and listing.
- Unit count may require zoning, inspection, and lease evidence.
- Taxes must retain tax year and jurisdiction context.

The UI may recommend a preferred value, but the system must show the basis and preserve alternatives.

---

# 11. API and Service Contracts

Required backend capabilities:

- Start intake
- Create manual intake draft
- Resolve address
- Search duplicate candidates
- Create/link Property
- Create Deal
- Register source
- Queue extraction
- Poll or subscribe to job status
- Return extracted field values
- Accept/reject/edit value
- Resolve conflict
- Retry failed job
- Cancel permitted job
- Complete intake

All mutation endpoints must support:

- Authentication
- Workspace authorization
- Idempotency
- Optimistic concurrency/version checks
- Structured validation errors
- Correlation IDs
- Audit logging

---

# 12. Web UX

## 12.1 New Deal modal/page

The first screen must be simple:

- Paste listing URL
- Enter address
- Manual entry
- Import file/email
- Portfolio/package

Do not ask for every field before creating a Deal.

## 12.2 Processing experience

After submission:

- Immediately confirm source capture
- Show Deal creation state
- Show extraction jobs separately
- Allow user to leave and continue other work
- Show durable progress in the notification/background-job center
- Deep-link back to intake review

## 12.3 Review screen

Use a two-level structure:

- Decision-critical summary
- Expandable source detail

Required sections:

- Identity
- Pricing
- Property characteristics
- Listing details
- Public data
- Conflicts
- Missing information
- Sources
- Processing history

## 12.4 Desktop behavior

Use a wide review layout with:

- Main field review
- Source/evidence side panel
- Conflict drawer or panel
- Sticky save/continue actions

## 12.5 Mobile web behavior

Use sequential cards with a persistent progress indicator and no forced horizontal tables.

---

# 13. iPhone UX

Required optimized flows:

- Share listing to BRIX
- Create from current location
- Paste URL
- Add quick photo or voice note
- Review only decision-critical fields first
- Defer extended review
- Show offline draft state
- Show upload/extraction progress
- Resume from notification

The iPhone flow must be completable one-handed.

No modal stack may trap the user or lose the shared source.

---

# 14. iPad UX

Required:

- Drag and drop URLs, PDFs, images, and email files
- Split view with source on one side and field review on the other
- Keyboard shortcuts for accept, reject, next conflict, save, and complete
- Multi-property package review
- Bulk source assignment
- Pointer support
- Persistent context while switching Deals

---

# 15. Offline Behavior

Offline-supported actions:

- Create intake draft
- Enter address manually
- Capture photos
- Record voice note
- Attach local files
- Enter asking price and strategy
- Save locally

Offline drafts must have durable local IDs and a clear unsynced state.

When connectivity returns:

1. Authenticate/refresh session
2. Upload source evidence
3. Create canonical Property/Deal
4. Reconcile duplicates
5. Preserve local timestamps
6. Surface conflicts
7. Mark sync completion

Offline drafts must never silently merge into an existing Property without user confirmation when a duplicate candidate exists.

---

# 16. Freshness and Stale-State Rules

Every source-derived value must expose:

- Retrieved date
- Effective date where available
- Current/stale state
- Source
- Confidence/classification

Re-import behavior:

- Preserve old source
- Add new source version
- Compare changed values
- Mark dependent analysis stale only when affected fields changed
- Trigger targeted recalculation after accepted changes
- Do not overwrite accepted values before review unless explicit policy permits

A stale listing status must never display as current without a stale label.

---

# 17. Background Jobs

Job categories may include:

- URL fetch
- Listing extraction
- OCR
- Document extraction
- Image download
- Geocoding
- Parcel lookup
- Tax lookup
- Hazard lookup
- Permit lookup
- Duplicate analysis

Each job must support:

- Durable status
- Idempotency
- Retry with bounded backoff
- Timeout
- Cancellation where safe
- Dead-letter/failure review
- Provider-safe error mapping
- Usage metering
- Correlation ID
- Admin visibility

No job may remain indefinitely in `processing` without timeout or escalation.

---

# 18. Error Handling

Required distinct errors:

- Unsupported URL
- Source blocked or unavailable
- Authentication expired
- Workspace permission denied
- Address unresolved
- Duplicate candidate requires review
- File too large
- Unsupported file type
- Provider timeout
- Provider rate limit
- Extraction failure
- Partial extraction
- Conflict detected
- Offline save only
- Sync conflict
- Storage failure
- Internal failure

Every error must state:

- What failed
- What was preserved
- Whether Deal creation succeeded
- Whether analysis is affected
- What the user can do next
- Support reference ID where appropriate

---

# 19. Security and Privacy

- All source evidence is workspace-isolated.
- Storage access requires authorized signed or authenticated access.
- Raw emails and documents are sensitive by default.
- Service-role keys remain server-side.
- URL fetchers must protect against SSRF and unsafe redirects.
- File uploads must validate type, size, extension, content signature, and malware policy.
- HTML extraction must sanitize untrusted content.
- Prompt injection in source content must not alter authorization or system rules.
- Personally identifiable information must be minimized in logs.
- Deletion and retention follow workspace/account policy.

---

# 20. Performance Targets

Targets under normal operating conditions:

- Deal shell created or confirmed within 2 seconds after valid submission
- UI acknowledgement within 150 ms
- Address candidate response within 2 seconds when provider is healthy
- Background processing can continue without blocking navigation
- Intake list and Deal reopening within 2 seconds for typical records
- Large source packages process asynchronously
- Progress updates should appear without aggressive polling

Targets are objectives, not permission to fake completion.

---

# 21. Analytics and Usage

Track without exposing sensitive content:

- Intake started
- Intake method
- Intake completed
- Intake abandoned
- Duplicate detected
- Duplicate linked/new Property chosen
- Extraction succeeded/failed/partial
- Conflict count
- Time to Deal creation
- Time to intake completion
- Provider usage and cost
- Retry count
- Manual correction rate
- Offline draft sync success

---

# 22. Notifications

Notify when useful:

- Extraction complete
- Extraction partially complete
- Extraction failed
- Duplicate review required
- Material conflict requires review
- Intake ready for underwriting
- Offline draft synced
- Portfolio package processing complete

Notifications must open the exact Deal and relevant intake state.

---

# 23. Reports and Downstream Consumption

Property Intake outputs are consumed by:

- Deal Cockpit
- Underwriting
- Strategy Engine
- MarketIQ
- GovernanceIQ
- VisitIQ
- Reports
- Portfolio comparison

Downstream systems must consume accepted canonical values and may inspect unresolved alternatives.

No report may present an unresolved conflict as a confirmed value without labeling it.

---

# 24. Acceptance Tests

## 24.1 Address intake

Given a valid address, the system creates or links a Property, creates a Deal, preserves the entered source, and opens the review workflow.

## 24.2 Listing URL intake

Given a supported listing URL, the system captures the URL, creates the Deal immediately, processes extraction asynchronously, and shows durable status.

## 24.3 Unsupported URL

Given an unsupported or blocked URL, the system preserves the URL and allows manual continuation.

## 24.4 Duplicate candidate

Given an address matching an existing Property, the system presents match reasons and does not silently merge.

## 24.5 Conflicting facts

Given two sources with different square footage, both values remain available and a conflict is created.

## 24.6 Re-import

Given a new version of the same listing, the system preserves the earlier source, identifies changes, and does not duplicate the Deal.

## 24.7 Offline intake

Given no connectivity, the iPhone user can save an intake draft with photo and voice note, then sync later without data loss.

## 24.8 Provider failure

Given geocoding or public-record provider failure, the Deal remains usable and the user can continue manually.

## 24.9 Permission isolation

A user from another workspace cannot view, update, or download the intake source or Property data.

## 24.10 Cross-client consistency

The same accepted Property facts, conflicts, and processing states appear on web, iPhone, and iPad.

---

# 25. Regression Tests

- Repeated submission with same idempotency key does not create duplicate Deal
- Browser refresh during extraction preserves status
- App termination during upload preserves retry state
- Session refresh does not duplicate jobs
- Rejected value does not become current
- Accepted value remains after reopen
- Conflict resolution preserves competing source history
- Archive/restore Deal preserves intake evidence
- Deleting permitted draft does not delete shared canonical Property incorrectly
- Listing image failure does not fail the entire intake
- Background timeout transitions to visible failure
- Notification opens correct Deal
- Report uses accepted values
- Offline sync conflict does not overwrite newer canonical edits silently

---

# 26. Definition of Done

This specification is complete only when:

- Every intake method works end to end
- Property and Deal identity are canonical
- Duplicate detection is implemented and tested
- Original source evidence is preserved
- Field classifications and source lineage are visible
- Conflicts are durable and resolvable
- Background jobs expose complete status and retry
- Manual continuation works when providers fail
- Web, iPhone, and iPad workflows are complete
- Offline drafts sync safely
- No stale data is represented as current
- All visible controls work
- RLS and storage isolation tests pass
- Acceptance and regression tests pass
- Exact verification commands and results are recorded
- No unrelated files are changed

Codex must end implementation with either:

`CHAPTER COMPLETE`

or

`CHAPTER NOT COMPLETE`

A partial intake UI, a URL parser without persistence, or a Deal record without source lineage does not satisfy this specification.