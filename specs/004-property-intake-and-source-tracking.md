# BRIX Specification 004 — Property Intake and Source Tracking

## 1. Authority and Rules of Engagement

Governed by `docs/00-START-HERE.md` through `docs/05-BUILD-ROADMAP.md` and Specifications 001–003.

Rules:

1. Intake must create or link the canonical Property before creating the canonical Deal relationship.
2. No external provider is a source of truth merely because it returned data.
3. Every imported value retains source, date, classification, confidence, verification, freshness, and license/use metadata where relevant.
4. Provider failure may reduce enrichment but may not block manual Deal creation.
5. Duplicate detection suggests; the user or an approved controlled process decides.
6. Re-import updates the same source record idempotently and preserves history.
7. Estimates, inferred values, and AI observations may not be displayed as confirmed facts.
8. Original listing, email, file, or shared content must be preserved as Evidence when permitted.
9. Intake may propose assumptions but may not silently accept them into underwriting.
10. Every asynchronous import exposes durable state, retry, and partial completion.
11. Intake must work on web, iPhone, iPad, and supported share/email/file paths.
12. Source conflicts remain visible until explicitly resolved.

## 2. Mission

Turn an address, listing link, manual entry, shared item, email, file, or property package into a trustworthy BRIX Property and Deal with transparent source tracking, duplicate protection, preliminary facts, proposed assumptions, conflicts, and clear next actions.

## 3. Intake Entry Points

- Address search
- Listing URL paste
- Manual property entry
- iOS share extension
- Forwarded email
- Email attachment
- File upload
- Camera/document capture
- Portfolio/package import
- Duplicate an existing Deal as a new opportunity
- Create Deal from an existing Property

Every entry point converges on the same canonical intake orchestration.

## 4. Intake State Machine

- Draft
- Resolving Location
- Searching Existing Property
- Awaiting Match Decision
- Creating Property
- Creating Deal
- Importing Source
- Enriching
- Awaiting Verification
- Partially Complete
- Complete
- Failed
- Retry Scheduled
- Conflict
- Cancelled

The UI must distinguish Deal creation success from optional enrichment progress.

## 5. Canonical Workflow

1. Confirm authenticated workspace and create permission.
2. Capture source and minimum user intent.
3. Normalize address/location where present.
4. Search potential Property matches.
5. Present match evidence and confidence.
6. User selects existing Property, creates new Property, or marks candidates not duplicate.
7. Create Deal idempotently.
8. Preserve original source as Evidence where allowed.
9. Start source-specific import job.
10. Retrieve available public/licensed/user-provided data.
11. Normalize each value without losing raw provenance.
12. Detect conflicts with accepted values.
13. Produce proposed facts and preliminary assumptions.
14. Present missing decision-changing inputs.
15. User accepts, rejects, edits, or defers proposals.
16. Emit events and update timeline.
17. Continue to Decision Cockpit or underwriting setup.

## 6. Property Matching

Signals may include:

- Normalized address
- Parcel ID/APN/PIN
- Coordinates
- Unit number
- Building/project name
- Legal description
- Listing-source ID
- County/municipality identifiers

Match result includes:

- Candidate Property ID
- Match reasons
- Conflicts
- Confidence
- Last updated
- Existing active Deals

No automatic merge when material ambiguity exists.

## 7. Source Record Model

Each source/import record should include:

- ID
- Workspace ID
- Deal ID
- Property ID
- Source type
- Provider/source name
- Source URL or identifier
- Retrieved time
- Effective time
- Raw snapshot/evidence reference
- Import workflow version
- Status
- License/use restrictions
- Error/retry metadata

## 8. Value Proposal Model

Each proposed value includes:

- Canonical subject and field
- Raw value
- Normalized value
- Display value
- Unit/currency
- Classification
- Source record/evidence
- Confidence
- Verification state
- Effective date
- Freshness
- Conflict references
- Proposed action: add, update, ignore, verify

Acceptance creates or updates the canonical fact/assumption through a versioned mutation. Rejection does not delete source evidence.

## 9. Supported Data Categories

Where lawful and available:

- Address and geocoding
- Parcel/legal description
- Ownership
- Tax history and assessed value
- Sale history
- Listing status, price, description, dates, and photos
- Building year, area, beds/baths, units, stories, parking
- Lot/site characteristics
- Zoning and land use
- Permits and violations
- Utilities and broadband
- Flood and environmental/hazard indicators
- Schools and convenience context
- Association indicators
- Rent indicators
- Market sale indicators
- Property-type-specific facts

Each category must declare source, geography, date, and confidence.

## 10. Listing URL Intake

- Validate supported/unsupported source.
- Preserve URL and retrieved timestamp.
- Respect terms, robots, licensing, and provider restrictions.
- Extract only available permitted data.
- Preserve source listing ID.
- Re-import updates the source record and creates new value proposals when changed.
- Removed/unavailable listing does not erase prior evidence.
- The user can continue manually when parsing fails.

BRIX must not promise universal listing-site extraction.

## 11. Manual Intake

Minimum fields:

- Address or descriptive location
- Property type
- Opportunity name
- Asking/expected price where known
- Intended strategy
- Source/contact where known

Manual values are classified as user-entered facts or assumptions according to meaning. Blank is preferred over fabricated default.

## 12. Email and File Intake

- Preserve original bytes/body and metadata.
- Calculate hash for duplicate detection.
- Attempt Deal/Property matching.
- Queue unmatched evidence for user assignment.
- Extract suggested values with source anchors.
- Never silently create accepted Deal facts from email text.
- Group related email body and attachments when appropriate.

## 13. iOS Share Extension

Share extension supports:

- URL
- Text
- Image
- PDF/file

Requirements:

- Fast capture even when app is not active.
- User selects existing Deal or creates intake draft.
- Secure shared-container handling.
- Offline queue.
- No loss if upload is interrupted.
- Canonical sync on next app activation/background opportunity.

## 14. Portfolio and Package Intake

Support multiple Properties under one Deal or multiple Deals under an import batch.

Required:

- Batch identity
- Row/item status
- Duplicate handling per Property
- Shared package evidence
- Item-level errors and retry
- No all-or-nothing loss when one row fails

## 15. Conflict Handling

Conflicts may involve:

- Address/parcel mismatch
- Different building size/year/unit count
- Different taxes/assessment
- Different listing price/status
- User value versus provider value
- Two provider values

Conflict UI shows:

- Current accepted value
- Proposed values
- Sources/dates
- Confidence
- Decision impact
- Accept/keep/edit/defer actions

Material conflicts remain visible in Decision Cockpit until resolved or intentionally deferred.

## 16. Preliminary Analysis

Intake may trigger preliminary analysis only when required minimum inputs exist.

Preliminary output must:

- Be clearly labeled preliminary.
- Show assumed/default inputs.
- Show missing decision-changing inputs.
- Avoid final recommendation language.
- Reference canonical engine if calculations are performed.

## 17. Web UX

- Quick intake modal/page.
- Address/listing/manual tabs or context-aware flow.
- Duplicate candidate comparison.
- Import progress and partial completion.
- Source/conflict review.
- Proposed-value acceptance.
- Clear continue-to-underwriting action.

## 18. iPhone UX

- Quick Add Deal.
- Paste/share URL.
- Camera/file intake.
- Minimal required fields.
- Offline draft and queued upload.
- Resume interrupted import.

## 19. iPad UX

- Multi-column source review.
- Drag/drop files and URLs.
- Batch/portfolio intake.
- Candidate and source comparison alongside Deal context.

## 20. Security and Provider Boundaries

- Provider secrets remain server-side.
- Inputs/URLs are validated.
- Files are scanned/validated where implemented.
- Imports are rate-limited.
- Provider responses are treated as untrusted input.
- Workspace scope and RLS apply to every source/evidence/proposal record.
- Sensitive source content is absent from unsafe logs.

## 21. Domain Events

- `intake.created`
- `intake.source_received`
- `property.match_candidates_found`
- `property.match_resolved`
- `property.created`
- `deal.created`
- `source.import_started`
- `source.import_completed`
- `source.import_failed`
- `value.proposed`
- `value.accepted`
- `value.rejected`
- `value.conflict_detected`
- `intake.completed`

Consumers include timeline, Decision Cockpit, underwriting readiness, tasks, and notifications.

## 22. Testing Requirements

- Address normalization/match tests.
- Duplicate and no-match tests.
- Listing/manual/email/file/share-extension integration tests.
- Idempotent re-import tests.
- Provider outage/timeout/rate-limit tests.
- Partial batch failure tests.
- Conflict acceptance/rejection tests.
- RLS/storage tests.
- Web/iOS E2E and offline resume tests.
- Accessibility and performance tests.

## 23. Verification and Validation

### Functional verification

- Every intake entry creates or links the correct Property and Deal.
- Manual continuation works when enrichment fails.
- Imports save, reopen, retry, and preserve original source.
- Re-import does not duplicate canonical records.

### Data verification

- Every imported value retains provenance, classification, date, confidence, verification, freshness, and history.
- No estimate or AI observation becomes a confirmed fact without explicit acceptance.
- No orphan source/evidence/proposal records remain.

### Integration verification

- Accepted facts feed canonical assumptions/readiness.
- Underwriting and strategy use accepted values only.
- Conflicts and missing inputs appear in Decision Cockpit.
- Timeline, tasks, notifications, reports, web, iPhone, and iPad reconcile.

### UX verification

- Loading, matching, partial, stale, offline, conflict, permission, retry, unsupported-source, and provider-failure states are clear.
- No dead end exists after provider failure.

### Definition of Done

Complete only when realistic address, listing, manual, file/email, mobile share, and package workflows preserve source truth and connect seamlessly into the canonical Deal.

**SPECIFICATION STATUS: REVIEWED AND REPAIRED**
