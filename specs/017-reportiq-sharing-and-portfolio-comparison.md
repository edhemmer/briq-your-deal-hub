# BRIX Specification 017 — ReportIQ, Sharing, and Portfolio Comparison

## 1. Authority and Rules of Engagement

This specification is governed by `docs/00-START-HERE.md` through `docs/05-BUILD-ROADMAP.md` and Specifications 001–016.

Rules of engagement:

1. ReportIQ consumes canonical BRIX records and calculation outputs; it does not create a second Deal, Property, financial engine, evidence store, recommendation engine, or task system.
2. Every report identifies the exact Deal, Property, scenario, underwriting snapshot, strategy result, financing structure, evidence set, source versions, and generation time used.
3. Web, iPhone, iPad, generated artifacts, exports, and shared views must reconcile to the same canonical values and statuses.
4. Stale, superseded, assumed, estimated, conflicted, incomplete, or unverified information must be labeled and may not be presented as current confirmed fact.
5. Generated artifacts are immutable. Regeneration creates a new version and preserves prior versions.
6. Authoritative calculations come only from deterministic engines.
7. AI may draft narrative explanations from canonical data but may not alter facts, calculations, source classifications, or professional conclusions.
8. Sharing is explicitly scoped, revocable, auditable, non-enumerable, and time-limited where selected.
9. Failed generation, upload, delivery, or export preserves prior valid artifacts and exposes retry.
10. No visible export, preview, comparison, or sharing control may be disconnected or return fake success.

## 2. Mission

Turn live BRIX Deals and portfolios into professional, traceable, decision-ready outputs that can be generated, compared, shared, reopened, and audited without losing calculation integrity, source provenance, or current-state meaning.

## 3. Scope and Ownership

ReportIQ owns:

- Report definitions and templates
- Report requests and generation jobs
- Generated artifacts and versions
- Export jobs
- Secure share links
- Share access logs
- Delivery records
- Portfolio comparison views and saved comparison configurations

ReportIQ does not own canonical Deal facts, Property facts, financial inputs or outputs, strategy rankings, financing terms, findings, tasks, deadlines, contacts, Evidence originals, or recommendations.

## 4. Canonical Entities

### `report_definitions`

Store permanent report type ID, name, supported formats, section schema version, template version, required source modules, missing-data behavior, active state, and ownership scope.

### `report_requests`

Required fields:

- workspace and optional Deal/portfolio scope
- requested by
- report definition and format
- selected sections and redaction scope
- immutable source snapshot references
- status
- idempotency key
- requested/completed timestamps
- safe failure code

### `report_artifacts`

Required fields:

- report request ID
- workspace and Deal scope
- storage path
- filename, MIME type, hash, and size
- generated time
- artifact version
- source snapshot metadata
- current/superseded state
- optional expiration

### `report_shares`

Store artifact, hashed token, allowed sections, expiration, password requirement, download permission, watermark policy, revoked state, creator, and audit metadata.

### `report_share_access`

Record share access, time, action, success/failure, and safe client metadata without logging sensitive report content.

## 5. Required Report Types

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
10. Contract summary and professional questions
11. Offer package and negotiation history
12. Inspection update
13. Appraisal update
14. Decision memorandum
15. Due-diligence status
16. Closing-readiness report
17. Portfolio pipeline
18. Multi-Deal comparison

## 6. Required Artifact Metadata

Every artifact displays or embeds:

- BRIX report type and version
- workspace, Deal, and Property identity
- generated timestamp and timezone
- data `as of` timestamp
- underwriting, strategy, financing, and relevant subsystem versions
- source classifications and Evidence references
- verification, freshness, and conflict state
- professional-boundary disclosures
- artifact ID and page numbering where applicable

## 7. Content and Reconciliation Rules

- Facts, assumptions, estimates, inferences, conflicts, and AI narrative remain visibly distinct.
- Missing decision-changing information receives a dedicated section.
- Superseded results do not appear as current.
- Narrative and charts reconcile to displayed numbers.
- Units, currencies, dates, rates, and periods are explicit.
- Sensitive content is excluded or redacted according to authorization and selected scope.
- Every displayed material number must trace to its canonical result and formula version.

## 8. Portfolio Comparison

Comparison supports filtering, sorting, grouping, saved views, and side-by-side review across:

- stage, property type, geography, strategy, and status
- asking and offer price
- total project cost and cash required
- cash flow, cap rate, cash-on-cash return, DSCR, debt yield, IRR, NPV, and equity multiple where applicable
- maximum allowable offer
- risk, confidence, verification completeness, deadline urgency, next action, and recommendation

Metrics are comparable only when definition, strategy, period, currency, and data completeness are compatible. Non-comparable metrics must be labeled rather than forced into false equivalence.

## 9. Export Formats

### PDF

Professional pagination, stable layout, no clipped tables, accessible structure where supported, source notes, and repeatable rendering.

### Spreadsheet

Clear input/output separation, proper currency/percentage/date formatting, source and assumption tabs, protected or identified formulas, and reconciliation to canonical results. The export may not become a hidden second calculation engine.

### CSV

Stable UTF-8 schema, explicit units and dates, machine-readable identifiers, and no formatting-dependent meaning.

### Editable document formats

Used only where professional collaboration requires them. Source metadata, version identity, and disclosures remain intact.

## 10. Generation Workflow

1. User selects type, format, scope, and optional sections.
2. System validates authorization, entitlement, and required sources.
3. System records immutable source snapshot references.
4. Idempotent generation job is created.
5. UI shows queued state immediately.
6. Worker generates from canonical data.
7. Reconciliation checks validate totals and required disclosures.
8. Artifact is hashed, stored, versioned, and marked complete.
9. Timeline, usage, audit, and notification events are recorded.
10. User may preview, download, share, revoke, or regenerate.

No job may remain indefinitely processing without timeout, recovery, or escalation.

## 11. Sharing Workflow

- Share a specific immutable artifact, not unrestricted workspace access.
- Select expiration, password, download/view-only, watermark, and permitted sections.
- Generate non-enumerable token and store only its hash.
- Enforce authorization on every access.
- Allow immediate revocation.
- Record access history.
- Expired or revoked links fail safely and reveal no unrelated workspace data.

## 12. UI and UX

### Web

- Deal report center
- Portfolio reporting center
- artifact history and generation state
- current versus superseded labeling
- preview, download, share, regenerate, and revoke
- comparison filters and saved views
- non-blocking background status

### iPhone

- generate common reports
- view status and recent artifacts
- native share sheet
- concise preview
- authorized offline access to downloaded artifacts

### iPad

- full preview
- Deal and report side by side
- multi-Deal comparison
- keyboard, pointer, drag-and-drop, and external-display support where practical

Required states: empty, configuring, queued, generating, partial, complete, failed, retry, stale source snapshot, superseded, offline cached, permission denied, expired share, and revoked share.

## 13. Security and Privacy

- Workspace and Deal authorization before generation and retrieval
- private storage and short-lived signed access
- RLS on report metadata
- token hashes rather than raw share tokens
- scope-based redaction
- audit generation, view, download, share, revoke, and access
- rate limiting and abuse protection
- safe handling of uploaded branding assets
- non-enumerable report and share paths

## 14. Performance and Reliability

- Acknowledge generation requests immediately.
- Generate asynchronously.
- Stream or paginate large portfolio exports.
- Retry idempotently.
- Preserve prior valid artifact during regeneration.
- Prevent duplicate artifacts from duplicate clicks.
- Use version-aware caches.
- Never allow worker failure to corrupt canonical Deal data.

## 15. Domain Events

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

## 16. Testing Requirements

- report definition and scope tests
- snapshot immutability tests
- numeric reconciliation fixtures
- stale/conflict labeling tests
- PDF pagination and layout tests
- spreadsheet formatting and reconciliation tests
- CSV schema tests
- share authorization, expiration, revocation, and guessed-URL tests
- idempotency and retry tests
- large portfolio export tests
- web/iPhone/iPad consistency tests
- accessibility, RLS, storage, and failure-recovery tests

## 17. Verification and Validation

### Functional verification

- Reports generate, persist, reopen, download, share, revoke, regenerate, and compare successfully.
- Failed jobs preserve prior valid artifacts and retry safely.
- Version history and source snapshot identity remain intact.
- No dead controls or fake completion states remain.

### Data verification

- Every displayed number reconciles to canonical outputs.
- Stale, conflicted, missing, assumed, estimated, and unverified states are visible.
- ReportIQ introduces no second authoritative calculation path.

### Integration verification

- Deal, Property, Evidence, underwriting, strategy, FinanceIQ, MarketIQ, GovernanceIQ, ContractIQ, OfferIQ, PhotoIQ, VisitIQ, InspectionIQ, and AppraisalIQ feed ReportIQ through versioned contracts.
- Timeline, notifications, audit, usage, admin, and search receive the correct events.
- Shared artifacts cannot expose unauthorized connected records.

### UX verification

- Web, iPhone, and iPad cover loading, partial, stale, offline, failure, retry, permission, and recovery states.
- Accessibility and responsive behavior pass.

### Definition of Done

Specification 017 is complete only when professional report generation, export, portfolio comparison, sharing, revocation, versioning, reconciliation, security, and cross-module flow are implemented and verified end to end without disconnected state, duplicate calculations, or unsupported claims.
