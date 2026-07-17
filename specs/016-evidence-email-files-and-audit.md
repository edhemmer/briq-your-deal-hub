# BRIX Specification 016 — Evidence, Email, Files, and Audit

## 1. Authority and Rules of Engagement

This specification is governed by `docs/00-START-HERE.md` through `docs/05-BUILD-ROADMAP.md` and Specifications 001–015.

Rules of engagement:

1. Evidence is a shared canonical platform service, not a separate app or duplicate document store.
2. Original files, emails, images, recordings, and imported source payloads remain immutable after successful ingestion.
3. Every derived extraction, classification, summary, thumbnail, transcript, finding, proposal, and report must reference its source Evidence record and processing version.
4. No module may store an authoritative source only inside its own private table or client cache.
5. Evidence does not silently change Deal facts, assumptions, calculations, deadlines, recommendations, or decisions.
6. Accepted changes flow through the canonical proposal and approval workflows owned by the affected subsystem.
7. Duplicate detection, hashing, retention, deletion, legal hold, access, sharing, and audit behavior must be deterministic and workspace-scoped.
8. Email ingestion must preserve message headers, sender, recipients, subject, timestamps, thread relationships, body, and attachments where available.
9. Processing failures must preserve originals and prior valid derived results.
10. Web, iPhone, iPad, reports, search, AI, and admin operations must reference the same canonical Evidence state.
11. Every asynchronous operation exposes queued, processing, partial, complete, failed, stale, superseded, canceled, and retry states.
12. No source may be represented as verified merely because it was uploaded or extracted successfully.

## 2. Mission

Provide BRIX with a durable, secure, source-linked evidence system that receives unstructured information, preserves originals, tracks provenance, supports controlled processing, and gives every module a reliable audit trail.

The subsystem must answer:

- What was received?
- From whom and when?
- Which Deal and Property does it belong to?
- Is it original, derived, duplicate, superseded, stale, conflicted, or deleted?
- Who accessed or changed its classification?
- Which findings, facts, tasks, calculations, reports, and decisions rely on it?

## 3. Canonical Ownership

This subsystem owns:

- Evidence records and immutable source identity
- File and object-storage metadata
- Email messages, threads, and attachment relationships
- Upload and ingestion sessions
- File hashes and duplicate candidates
- Processing jobs and derived artifacts
- Source anchors and extraction provenance
- Retention, deletion, legal hold, and purge state
- Evidence access history and chain of custody
- Platform audit events and immutable audit entries

This subsystem does not own:

- Deal or Property facts
- Underwriting assumptions or outputs
- Strategy rankings
- Financing structures
- Market, governance, contract, offer, inspection, or appraisal conclusions
- Tasks, deadlines, contacts, or user decisions

## 4. Canonical Entities

### 4.1 `evidence_items`

Required fields:

- `id`
- `workspace_id`
- `deal_id` nullable
- `property_id` nullable
- `evidence_type`
- `source_channel`
- `title`
- `original_filename`
- `mime_type`
- `size_bytes`
- `file_hash`
- `storage_path`
- `source_created_at`
- `received_at`
- `created_by`
- `verification_state`
- `sensitivity_class`
- `retention_policy_id`
- `legal_hold`
- `supersedes_evidence_id`
- `deleted_at`
- `purged_at`
- `created_at`
- `updated_at`

### 4.2 `evidence_relationships`

Links Evidence to Deals, Properties, contacts, organizations, visits, offers, contracts, financing structures, inspections, appraisals, reports, tasks, findings, and other Evidence.

Required relationship metadata:

- relationship type
- owning subsystem
- source and target IDs
- confidence
- verification state
- created by
- created at

### 4.3 `email_threads` and `email_messages`

Preserve:

- provider and mailbox identity
- provider message/thread identifiers
- RFC message ID where available
- sender, recipients, CC, BCC where authorized
- subject
- sent and received timestamps
- normalized plain-text and HTML body references
- attachment relationships
- reply/forward/thread relationships
- delivery and ingestion state
- deduplication keys

### 4.4 `evidence_processing_jobs`

Required fields:

- job ID and idempotency key
- Evidence ID
- processor type and version
- prompt/model/tool versions where AI is used
- status and progress
- input and output artifact references
- started/completed timestamps
- retry count
- safe failure code
- cost and usage metadata where applicable

### 4.5 `derived_evidence_artifacts`

Includes thumbnails, OCR text, parsed text, transcripts, page images, embeddings, classifications, summaries, extracted candidates, and redacted copies.

Each artifact must retain:

- source Evidence ID
- processor/version
- creation time
- verification state
- supersession state
- hash and storage reference

### 4.6 `audit_events`

Audit entries must record:

- actor or system identity
- workspace and affected record
- action
- before/after references or safe structured diff
- timestamp
- correlation ID
- originating client/service
- authorization context
- reason or approval reference where required

Audit events are append-only and may not be edited by ordinary users.

## 5. Supported Intake Channels

- Web drag and drop
- File picker
- iPhone/iPad camera, scanner, photo library, Files app, and share extension
- Forwarded email
- Connected mailbox ingestion where enabled
- Email body and attachments
- URL and listing import
- Voice recording and transcript
- Photo and video capture
- API and approved provider ingestion
- Manual text entry
- Batch and ZIP import where safely supported

## 6. Intake Workflow

1. Authenticate and authorize the user or integration.
2. Create an upload or ingestion session.
3. Validate file type, size, malware policy, and workspace limits.
4. Receive the source using resumable transfer where needed.
5. Calculate hash and perform duplicate candidate matching.
6. Preserve the original source.
7. Create the canonical Evidence record.
8. Match or queue assignment to Deal and Property.
9. Schedule permitted processing jobs.
10. Show status immediately.
11. Record timeline and audit events.
12. Allow manual classification and correction.

Duplicate detection must not silently discard a source. The user must be able to link the existing Evidence, preserve a distinct version, or cancel.

## 7. Source Classification and Verification

Supported source classifications include:

- Original document
- User-entered source
- Email communication
- Listing or provider data
- Public record
- Professional report
- Photograph or video
- Audio or transcript
- Derived extraction
- AI-generated candidate
- System-generated artifact

Verification states:

- Unverified
- Candidate
- User Confirmed
- Source Confirmed
- Professional Confirmed
- Conflicted
- Stale
- Rejected
- Superseded

Upload success does not change verification state automatically.

## 8. Email Ingestion

Email workflows must support:

- dedicated forwarding address or approved mailbox connection
- sender authorization and anti-spoofing controls
- thread reconstruction
- body and attachment preservation
- duplicate detection
- Deal matching by address, identifiers, participants, and existing thread context
- unmatched inbox routing
- user confirmation before material extraction becomes canonical
- safe handling of signatures, quoted replies, tracking pixels, and remote content

Email HTML is untrusted content and must be sanitized. Remote resources must not load automatically in a way that leaks user or workspace information.

## 9. File Safety and Storage

- Originals use private storage.
- Signed URLs are short-lived and permission-checked.
- Storage paths are non-enumerable.
- Malware and file-type checks occur before processing or sharing.
- Dangerous active content is blocked or rendered safely.
- Encryption in transit and at rest is required.
- Local native copies follow device-protection and workspace policy.
- Secrets and provider credentials remain server-side.

## 10. Retention, Deletion, and Legal Hold

Retention policies must define:

- active retention period
- archive behavior
- user-requested deletion behavior
- workspace termination behavior
- legal hold
- backup expiration
- purge schedule
- derived artifact treatment
- audit retention

Deletion workflow:

1. Validate authorization and dependencies.
2. Mark the record deleted and block ordinary access.
3. preserve required audit metadata.
4. remove from search and AI retrieval.
5. purge storage and derived artifacts after the policy window.
6. verify purge completion.

Legal hold prevents purge but does not grant broader access.

## 11. Search and Retrieval

Evidence search supports:

- filename and title
- sender and recipient
- subject and body text
- source type
- date range
- Deal and Property
- contact and organization
- verification, freshness, and conflict state
- tags and classifications
- exact identifiers
- semantic retrieval through Specification 021

Permissions and deletion state are enforced before retrieval, indexing, or generation.

## 12. UI and UX

### Web

- Deal evidence center and workspace evidence inbox
- upload queue and processing status
- preview with source anchors
- email thread viewer
- duplicate resolution
- classification and assignment controls
- version, supersession, and relationship history
- retention and deletion controls by permission
- audit history

### iPhone

- fast capture and upload
- offline queue
- progress, retry, and assignment
- document scan, photo, video, voice, and file intake
- compact preview and source details

### iPad

- document and extracted data side by side
- multi-file and email-thread review
- drag and drop
- keyboard and pointer support

Required states include empty, uploading, queued, processing, partial, complete, failed, retrying, offline, stale, conflicted, superseded, deleted, access denied, and legal hold.

## 13. Integration Requirements

Evidence integrates with:

- Property intake for source tracking and duplicate matching
- PhotoIQ and VisitIQ for media and field evidence
- ContractIQ, GovernanceIQ, InspectionIQ, and AppraisalIQ for source-linked findings
- Underwriting, Strategy, FinanceIQ, and OfferIQ through explicit accepted proposals
- ReportIQ for source disclosure and immutable report artifacts
- RELearnIQ for source-aware explanations
- AI orchestration for governed extraction, indexing, and retrieval
- Tasks, deadlines, timeline, notifications, admin, and audit

No connected module may bypass canonical Evidence storage or provenance.

## 14. Domain Events

- `evidence.upload_started`
- `evidence.received`
- `evidence.duplicate_detected`
- `evidence.assigned`
- `evidence.processing_requested`
- `evidence.processing_completed`
- `evidence.processing_failed`
- `evidence.verification_changed`
- `evidence.superseded`
- `evidence.deleted`
- `evidence.purged`
- `email.received`
- `email.matched`
- `email.unmatched`
- `audit.event_recorded`

Events are idempotent and emitted only after persistence.

## 15. Performance and Reliability

- Upload acknowledgement is immediate.
- Large files use resumable transfer.
- Processing occurs asynchronously.
- Duplicate requests use idempotency keys.
- Prior valid artifacts remain available during reprocessing.
- Search indexes are version-aware and permission-scoped.
- Failed jobs expose safe retry and never delete originals.
- No job remains indefinitely processing without timeout or escalation.

## 16. Security and Privacy

- Workspace-scoped RLS on all metadata
- Private object storage
- role-based access and least privilege
- safe logs without document bodies or secrets
- audit of upload, view, download, share, delete, restore, and purge actions
- prompt-injection defenses for untrusted content
- provider data-retention controls
- rate limits and abuse protection
- privacy controls for email participants, location, media, and sensitive documents

## 17. Testing Requirements

- upload, resume, cancellation, retry, and duplicate tests
- hash and immutability tests
- email parsing, threading, spoofing, and sanitization tests
- assignment and unmatched inbox tests
- extraction provenance and source-anchor fixtures
- RLS, storage, signed URL, and access-revocation tests
- retention, deletion, legal hold, and purge tests
- search-removal and AI-index removal tests
- offline native queue tests
- large file and batch tests
- audit append-only and correlation tests
- cross-module reconciliation tests
- accessibility and performance tests

## 18. Verification and Validation

### Functional verification

- Every supported source can be received, saved, reopened, assigned, processed, retried, superseded, deleted, and audited.
- Originals remain unchanged and available according to policy.
- Duplicate handling never loses a legitimate source.
- Email messages and attachments remain correctly connected.

### Data and security verification

- Hashes, relationships, processor versions, and source anchors are preserved.
- RLS and storage rules prevent cross-workspace access.
- Deleted content disappears from normal retrieval and is purged according to policy.
- Audit history is append-only and complete.

### Integration verification

- Every connected module uses canonical Evidence IDs.
- Accepted proposals update only the owning subsystem.
- Reports, search, AI, timeline, notifications, and admin reconcile to the same Evidence state.
- No duplicate evidence store or processing path remains.

### UX verification

- Web, iPhone, and iPad workflows cover loading, offline, partial, failure, retry, conflict, stale, permission, and recovery states.
- No upload or processing failure silently loses work.
- Accessibility requirements pass.

### Definition of Done

Specification 016 is complete only when the full intake-to-audit workflow is implemented, tested, secured, observable, recoverable, and integrated with Specifications 001–015 and all dependent later specifications without disconnected state or duplicate ownership.
