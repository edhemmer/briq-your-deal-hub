# BRIX Specification 016 — ReportIQ, Exports, Sharing, and Portfolio Comparison

## 1. Authority and Rules of Engagement

This specification is governed by `docs/00-START-HERE.md` through `docs/05-BUILD-ROADMAP.md` and Specifications 001–015.

Rules:

1. ReportIQ consumes canonical BRIX data; it does not create a second Deal, financial engine, evidence store, task system, or recommendation engine.
2. Every report must identify the exact Deal, workspace, property, scenario, underwriting snapshot, strategy result, financing structure, evidence set, and generation time used.
3. Reports, exports, shared views, web, iPhone, and iPad must reconcile to the same canonical values and statuses.
4. No report may present stale, superseded, estimated, assumed, conflicted, or unverified information as current or confirmed.
5. Generated files are immutable artifacts. Regeneration creates a new version and preserves prior versions.
6. Authoritative calculations come only from the deterministic underwriting and strategy engines.
7. AI may draft narrative explanations from canonical results and evidence. It may not change calculations, facts, source classification, legal conclusions, or professional findings.
8. Sharing must be explicitly scoped, revocable, auditable, time-limited where selected, and protected from guessed URLs.
9. Failed generation, upload, delivery, or export jobs must preserve the prior valid artifact and expose retry status.
10. Every visible export or share control must complete an end-to-end workflow; no dead controls, placeholder downloads, or fake success states are allowed.

## 2. Mission

ReportIQ turns the live BRIX Deal and portfolio into professional, decision-ready outputs that can be reviewed, compared, shared, archived, and reopened without losing source traceability, calculation integrity, or current status.

It must support an individual investor reviewing one property, a professional comparing many Deals, and collaborators who need controlled access to selected information.

## 3. Scope

ReportIQ includes:

- Deal summary reports
- Full underwriting reports
- Strategy comparison reports
- Financing comparison reports
- Market and location reports
- Governance and restriction reports
- Contract, inspection, appraisal, photo, visit, and evidence reports
- Offer and negotiation packages
- Decision memoranda
- Portfolio pipeline reports
- Multi-Deal comparison
- PDF, spreadsheet, CSV, and supported document exports
- Secure share links
- Version history
- Delivery status
- Report templates and branded output

ReportIQ does not replace legal, tax, appraisal, inspection, lending, engineering, brokerage, or other licensed professional work.

## 4. Canonical Ownership

ReportIQ owns:

- Report definitions
- Report requests
- Report generation jobs
- Generated report artifacts
- Export jobs
- Share links
- Share access logs
- Delivery records
- Report versions

ReportIQ does not own:

- Deal facts
- Property facts
- Underwriting inputs or outputs
- Strategy rankings
- Financing terms
- Market findings
- Governance findings
- Contract terms
- Inspection findings
- Appraisal values
- Tasks, deadlines, contacts, evidence, or recommendations

## 5. Canonical Entities

### `report_definitions`

Required fields:

- `id`
- `workspace_id` or platform scope
- `report_type`
- `name`
- `description`
- `supported_formats`
- `section_schema_version`
- `template_version`
- `active`
- `created_at`
- `updated_at`

### `report_requests`

Required fields:

- `id`
- `workspace_id`
- `deal_id` nullable for portfolio reports
- `requested_by`
- `report_definition_id`
- `format`
- `scope_json`
- `source_snapshot_json`
- `status`
- `requested_at`
- `completed_at`
- `failure_code`
- `failure_message_safe`
- `idempotency_key`

### `report_artifacts`

Required fields:

- `id`
- `report_request_id`
- `workspace_id`
- `deal_id`
- `storage_path`
- `file_name`
- `mime_type`
- `file_hash`
- `size_bytes`
- `generated_at`
- `expires_at` nullable
- `version_number`
- `source_snapshot_json`
- `is_current`
- `supersedes_artifact_id`

### `report_shares`

Required fields:

- `id`
- `workspace_id`
- `report_artifact_id`
- `token_hash`
- `scope`
- `expires_at`
- `password_required`
- `download_allowed`
- `revoked_at`
- `created_by`
- `created_at`

### `report_share_access`

Store share ID, timestamp, coarse client metadata, success/failure, action, and revocation/expiration outcome without unsafe sensitive logging.

## 6. Report Types

At minimum:

1. Deal executive summary
2. Full underwriting
3. Strategy comparison
4. Financing comparison
5. Risk and verification report
6. Evidence and source summary
7. Visit and field report
8. Photo findings report
9. Governance report
10. Contract summary and questions
11. Offer package and negotiation history
12. Inspection update
13. Appraisal update
14. Decision memorandum
15. Portfolio pipeline
16. Multi-Deal comparison
17. Due-diligence status report
18. Closing-readiness report

Each report definition must specify required source modules, section order, missing-data behavior, stale-data behavior, and supported output formats.

## 7. Required Report Metadata

Every artifact must display or embed:

- BRIX report type and version
- Workspace and Deal identity
- Property identity
- Generated date/time and timezone
- Data `as of` timestamp
- Underwriting snapshot ID/version
- Strategy engine version
- Financing structure version where applicable
- Source classifications
- Verification status
- Stale/conflict warnings
- Professional-boundary disclosures
- Page numbering and artifact identifier

## 8. Content Rules

- Confirmed, user-entered, third-party, estimated, assumed, inferred, and AI-derived content must remain visibly distinct.
- Missing decision-changing inputs must appear in a dedicated section.
- Conflicts must not be silently resolved.
- Superseded results must not appear as current.
- Narrative explanations must reconcile to displayed numbers.
- Tables and charts must use canonical outputs and consistent units.
- Currency, dates, rates, area, and measurement units must be preserved.
- Source links or references must be included where permitted.
- Sensitive content must be excluded or redacted according to report scope and permission.

## 9. Portfolio Comparison

Portfolio comparison must support filtering, sorting, grouping, and saved views across:

- Deal stage
- Property type
- Geography
- Strategy
- Asking price
- Offer price
- Total project cost
- Cash required
- Monthly and annual cash flow
- Cap rate
- Cash-on-cash return
- DSCR
- IRR
- Equity multiple
- Maximum allowable offer
- Risk level
- Confidence
- Verification completeness
- Visit priority
- Next action
- Deadline urgency
- Recommendation status

Comparisons must use equivalent metric definitions and clearly identify when a metric is not comparable because of strategy, property type, period, currency, or missing data.

## 10. Export Formats

### PDF

- Professional pagination
- Repeating headers where useful
- No clipped tables or orphaned headings
- Accessible document structure where supported
- Clear charts and source notes
- Stable rendering across supported environments

### Spreadsheet

- Editable input and output separation where applicable
- Formula cells protected or clearly identified
- Currency, percentage, date, and unit formatting
- Source and assumption tabs
- Reconciliation to canonical engine outputs
- No duplicated or hidden authoritative calculation engine

### CSV

- Stable schema
- UTF-8 encoding
- Explicit units and dates
- Machine-readable identifiers
- No formatting-dependent meaning

### Word or other supported document formats

Used only when editing or professional collaboration requires it. Generated content must preserve source metadata and version identity.

## 11. Generation Workflow

1. User selects report type, format, scope, and optional sections.
2. System validates authorization and required source availability.
3. System captures an immutable source snapshot reference.
4. Generation job is created with an idempotency key.
5. UI immediately shows queued status.
6. Worker generates artifact from canonical data.
7. Reconciliation checks compare rendered totals to canonical outputs.
8. Artifact is hashed, stored, versioned, and marked complete.
9. Timeline and audit events are recorded.
10. User receives completion or failure status and can open, download, share, or regenerate.

No generation job may remain indefinitely processing. Timeouts, retries, and escalation states are required.

## 12. Sharing Workflow

Users may share a specific artifact, not an uncontrolled live workspace, unless a later collaboration specification explicitly permits it.

Share controls:

- Expiration date
- Password option
- Download allowed or view-only
- Selected sections where supported
- Revocation
- Access log
- Watermark option

Revoked or expired links must fail safely. Shared views must never expose navigation into unauthorized Deals or workspace data.

## 13. UI and UX

### Web

- Report center within each Deal
- Portfolio reporting center
- Artifact history and status
- Clear current versus superseded versions
- Preview, download, share, regenerate, and revoke actions
- Filters and saved comparison views
- Background job status without blocking navigation

### iPhone

- Generate common reports
- View status and recent artifacts
- Open/share through native share sheet
- View concise report previews
- Offline access to previously downloaded authorized artifacts

### iPad

- Full report preview
- Side-by-side Deal and report review
- Multi-Deal comparison
- Keyboard, pointer, drag-and-drop, and external display support where practical

### Required states

- Empty
- Draft configuration
- Queued
- Generating
- Partially generated
- Complete
- Failed with retry
- Stale source snapshot
- Superseded artifact
- Offline cached
- Permission denied
- Share expired or revoked

## 14. Security and Privacy

- Workspace and Deal authorization before generation and retrieval
- Private storage with signed access
- Token hashes, not raw share tokens, stored
- Short-lived signed URLs
- RLS for report metadata
- Server-side secrets only
- Sensitive fields excluded by scope
- Audit all generation, download, share, revoke, and access events
- Rate limits and abuse protection
- Malware-safe handling for uploaded branded assets
- No report path may be enumerable or guessable

## 15. Performance and Reliability

- Common report request acknowledged immediately
- Generation runs asynchronously
- Large portfolio exports paginate or stream safely
- Retry is idempotent
- Duplicate clicks do not create duplicate artifacts
- Prior valid artifact remains available during regeneration
- Worker failure cannot corrupt canonical Deal data
- Caching is version-aware and invalidated by source snapshot changes

## 16. Domain Events

Emit:

- `report.requested`
- `report.generation_started`
- `report.generated`
- `report.generation_failed`
- `report.superseded`
- `report.downloaded`
- `report.share_created`
- `report.share_accessed`
- `report.share_revoked`
- `report.share_expired`

Consumers include timeline, notifications, audit, usage metering, admin operations, and support tooling.

## 17. Testing Requirements

- Report definition and scope tests
- Snapshot immutability tests
- Numeric reconciliation fixtures
- Stale/conflict labeling tests
- PDF layout and pagination tests
- Spreadsheet schema and formatting tests
- CSV schema tests
- Share authorization, expiration, revocation, and guessed-URL tests
- Idempotency and retry tests
- Large portfolio export tests
- Web/iPhone/iPad artifact consistency tests
- Accessibility tests
- Storage and RLS tests
- Failure recovery tests

## 18. Verification and Validation

### Functional verification

- User can generate, reopen, download, share, revoke, regenerate, and compare reports.
- Generated artifacts persist and retain version history.
- Failed jobs preserve prior valid artifacts and can be retried safely.
- No dead controls or fake completion states remain.

### Data verification

- Every displayed number reconciles to the canonical engine output.
- Every artifact records its source snapshot and versions.
- Stale, conflicted, missing, assumed, and unverified states are visible.
- No report introduces a second calculation path.

### Integration verification

- Deal, Property, underwriting, strategy, FinanceIQ, MarketIQ, GovernanceIQ, ContractIQ, OfferIQ, PhotoIQ, VisitIQ, InspectionIQ, and AppraisalIQ outputs connect correctly.
- Timeline, notifications, audit, and usage records update once.
- Shared artifacts never expose unauthorized workspace data.
- Web, iPhone, iPad, spreadsheet, PDF, and shared view reconcile.

### UX verification

- Report status and next action are always clear.
- Long-running generation does not block the app.
- Empty, loading, partial, stale, failed, offline, revoked, and expired states are complete.
- iPad is not a stretched iPhone layout.
- Accessibility and keyboard/touch navigation pass.

### Production readiness

- No TODOs, placeholders, mock outputs, dead links, or disconnected exports
- Monitoring, logging, retry, timeout, and alerting implemented
- Security and RLS tests pass
- Performance targets pass
- Artifact retention and deletion behavior verified
- Support correlation IDs available for failures

## 19. Definition of Done

This specification is complete only when Codex can implement ReportIQ without inventing architecture, every artifact is source-versioned and numerically reconciled, all sharing is secure and revocable, all supported clients show the same canonical status, failures are recoverable, and the entire report/export/share workflow passes functional, integration, security, accessibility, and regression testing.
