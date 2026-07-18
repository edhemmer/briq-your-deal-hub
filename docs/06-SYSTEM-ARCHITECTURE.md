# BRIX Real Estate — System Architecture Blueprint

## 1. Authority and Rules of Engagement

This document is governed by `docs/00-START-HERE.md` through `docs/05-BUILD-ROADMAP.md` and Specifications 001–024.

Rules:

1. This document translates the approved product specifications into one implementable system architecture.
2. It may clarify technical boundaries, deployment topology, service contracts, and integration flow, but may not add or remove product scope without updating the governing specification.
3. Canonical ownership remains with the subsystem identified in the applicable specification.
4. No client, worker, integration, or AI service may create a competing source of truth.
5. All privileged mutations execute server-side with authorization, validation, audit, and idempotency.
6. Web, iPhone, iPad, reports, notifications, background jobs, and admin operations must reconcile to the same canonical state.
7. Every external dependency must have timeout, retry, circuit-breaker, observability, degradation, and manual-fallback behavior.
8. No component is production-ready when only its happy path works.
9. Architecture must support secure replacement of providers without rewriting domain logic.
10. The architecture is complete only when the validation section passes against every connected specification.

## 2. Architecture Mission

BRIX is a production real estate decision and transaction operating system. The architecture must support property intake, underwriting, strategy analysis, market research, financing, governance, contracts, offers, visual and field evidence, inspections, appraisals, reporting, education, administration, native clients, AI, tasks, deadlines, notifications, and release operations as one coherent platform.

The system must remain:

- deterministic where authority matters;
- source-linked where evidence matters;
- reviewable where interpretation matters;
- resilient where providers fail;
- auditable where decisions change;
- secure across every workspace and client;
- usable online, intermittently connected, and offline where specified.

## 3. Approved Platform Topology

### 3.1 Presentation clients

- Responsive web application deployed through Vercel.
- Native iPhone application.
- Native iPad application.
- Secure public landing, help, legal, and conversion surfaces.
- Secure shared report views.
- Administrative operations console.

### 3.2 Core backend

Supabase is the approved core platform for:

- PostgreSQL canonical database.
- Authentication and session lifecycle.
- Row-Level Security.
- Private object storage.
- Realtime subscriptions where justified.
- Server-side Edge Functions or equivalent approved service endpoints.
- Scheduled and asynchronous work where platform capabilities are sufficient.

Additional worker infrastructure may be introduced when required for durable queues, large-file processing, document rendering, AI workloads, media processing, or long-running jobs. That infrastructure must remain behind stable internal contracts.

### 3.3 External providers

Provider adapters may support:

- AI models and embeddings.
- Email ingestion and delivery.
- Push notifications.
- Maps, geocoding, routing, and location data.
- Market, hazard, property, and public-record data.
- Payment and subscription processing.
- PDF, spreadsheet, and document generation.
- Error reporting, analytics, logging, tracing, and uptime monitoring.

All providers are replaceable adapters. Domain code must not depend directly on vendor-specific response shapes.

## 4. Architectural Layers

### 4.1 Presentation layer

Owns:

- Screen composition.
- Navigation.
- Local interaction state.
- Accessibility behavior.
- Responsive and device-specific presentation.
- Optimistic feedback when safely supported.

Does not own:

- Authoritative calculations.
- Authorization decisions.
- Canonical workflow transitions.
- Durable business validation.
- Provider secrets.

### 4.2 Application layer

Coordinates use cases such as:

- Create Deal.
- Ingest property source.
- Run underwriting.
- Accept extracted contract term.
- Generate offer.
- Schedule visit.
- Accept inspection proposal.
- Generate report.
- Send notification.

Each application command must define authorization, input validation, idempotency, transaction boundary, emitted events, audit behavior, and user-safe failure response.

### 4.3 Domain layer

Contains:

- Canonical entities and invariants.
- Deterministic formulas.
- State machines.
- Strategy compatibility and ranking contracts.
- Deadline calculations.
- Offer constraints.
- Conflict and verification rules.

The domain layer must remain independent of presentation frameworks and vendor SDKs.

### 4.4 Infrastructure layer

Contains:

- Database repositories.
- Storage adapters.
- Provider adapters.
- Queue and job execution.
- Search indexes.
- Email and notification delivery.
- Document rendering.
- AI gateway.
- Observability instrumentation.

## 5. Canonical Domain Boundaries

The following bounded contexts are authoritative:

1. Identity and Workspaces.
2. Application Shell and User Preferences.
3. Property, Deal, PDRM, contacts, tasks, deadlines, notes, timeline, and activity.
4. Property Intake and Source Tracking.
5. Deterministic Underwriting.
6. Strategy Intelligence.
7. Decision Cockpit projections.
8. MarketIQ.
9. FinanceIQ.
10. GovernanceIQ.
11. ContractIQ.
12. OfferIQ.
13. PhotoIQ.
14. VisitIQ.
15. InspectionIQ and AppraisalIQ.
16. Evidence, Email, Files, and Audit.
17. ReportIQ and Portfolio Comparison.
18. RELearnIQ.
19. Admin, Billing, Usage, and Operations.
20. Native Client Infrastructure.
21. AI Orchestration, Search, Safety, and Explainability.
22. Notifications, Tasks, and Deadlines.
23. Landing, Help, and Conversion.
24. Testing, Observability, and Release Readiness.

Cross-context writes must occur through approved application commands or accepted proposals, never direct table mutation from another module.

## 6. Canonical Data Architecture

### 6.1 Identity keys

Every workspace-scoped record includes:

- stable UUID;
- `workspace_id`;
- creation and update timestamps;
- creator/updater where material;
- version or concurrency token where edits may conflict;
- archive/deletion state where applicable.

Deal-connected records include `deal_id`. Property-connected records include `property_id`. Evidence-derived records include source evidence and anchor references.

### 6.2 Source classification

Facts and outputs must identify classification such as:

- verified source fact;
- user-entered fact;
- third-party data;
- estimate;
- assumption;
- AI extraction candidate;
- AI inference;
- professional finding;
- conflicted;
- stale;
- superseded.

### 6.3 Versioning

Versioning is required for:

- underwriting inputs and outputs;
- strategy results;
- financing structures;
- offer revisions and counters;
- contract and governance analysis;
- accepted extracted facts;
- inspection and appraisal updates;
- reports;
- prompts, models, rules, formulas, and templates.

Historical versions must remain queryable where required for decision history and audit.

### 6.4 Transactions

A canonical mutation transaction must persist:

1. validated record change;
2. version/concurrency update;
3. audit record;
4. outbox/domain event record;
5. any immediately required dependent records.

External calls occur outside the database transaction and are driven through durable jobs or outbox processing.

## 7. Security Architecture

### 7.1 Authentication

- Supabase Auth or approved replacement remains identity authority.
- Sessions are short-lived and refreshable.
- Native tokens are stored in Keychain.
- Web sessions use approved secure storage and cookie/token practices.
- Sensitive actions may require recent authentication.

### 7.2 Authorization

Authorization is enforced at:

1. route/UI visibility;
2. server command handler;
3. database RLS;
4. private storage access;
5. background-job execution;
6. report/share access.

UI checks are never the sole control.

### 7.3 Workspace isolation

- Every workspace-owned table has RLS.
- Cross-workspace joins are prohibited unless explicitly platform-admin scoped.
- Service-role access is restricted to server-controlled functions.
- Admin access is role-gated, purpose-limited, and fully audited.

### 7.4 Secrets and sensitive data

- Secrets remain server-side.
- No provider key is embedded in web or native clients.
- Logs exclude document contents, credentials, private financial values, and sensitive personal data unless explicitly redacted and approved.
- Storage uses private buckets and short-lived signed access.

## 8. API and Command Architecture

### 8.1 API contract

Every endpoint or callable function must define:

- versioned path or command identifier;
- authentication and required role;
- input schema;
- output schema;
- idempotency behavior;
- error envelope;
- pagination where applicable;
- rate limits;
- audit behavior;
- emitted events.

### 8.2 Mutation pattern

Preferred mutation flow:

`Client action → local validation → authenticated command → server authorization → domain validation → database transaction → outbox event → connected processing → client state reconciliation`

### 8.3 Query pattern

Queries should use purpose-built read models rather than unbounded client joins. Decision Cockpit, dashboards, report generation, and portfolio comparison may use materialized or cached projections when they remain version-aware and reconcilable to canonical records.

### 8.4 Error envelope

Errors must include:

- stable code;
- user-safe message;
- retryability;
- correlation ID;
- field details where applicable;
- recovery action;
- prior valid state when relevant.

Provider stack traces and secrets must never be exposed.

## 9. Domain Events and Outbox

### 9.1 Event contract

Every domain event includes:

- event ID;
- event type;
- schema version;
- workspace ID;
- aggregate type and ID;
- Deal/Property IDs where applicable;
- actor;
- timestamp;
- correlation and causation IDs;
- payload containing only the minimum required data.

### 9.2 Required behavior

- Events are persisted in the same transaction as the canonical change.
- Delivery is at least once.
- Consumers are idempotent.
- Failed consumers retry with bounded policy.
- Poison events enter a dead-letter or intervention state.
- Event ordering is preserved per aggregate where material.

### 9.3 Major consumers

Consumers may update:

- Decision Cockpit projections;
- search indexes;
- task and deadline proposals;
- notifications;
- reports and stale markers;
- portfolio views;
- usage records;
- audit and operational dashboards;
- targeted re-underwriting and strategy evaluation.

## 10. Background Jobs

### 10.1 Job types

- document extraction;
- OCR only when required;
- AI analysis;
- photo/media processing;
- indexing and embeddings;
- market refresh;
- report generation;
- email ingestion and delivery;
- notification scheduling and dispatch;
- large imports/exports;
- cleanup and retention;
- billing reconciliation;
- backup verification.

### 10.2 Job state

Every job supports:

- queued;
- running;
- waiting for dependency;
- waiting for approval;
- partial;
- completed;
- completed with warning;
- failed;
- canceled;
- expired;
- superseded.

### 10.3 Reliability

Each job defines:

- idempotency key;
- retry policy;
- timeout;
- heartbeat or lease where needed;
- progress;
- failure code;
- safe retry action;
- prior valid result preservation;
- cost and usage attribution.

## 11. Realtime and State Synchronization

Realtime is used only for meaningful collaborative or job-state updates. It must not become the only consistency mechanism.

Required rules:

- initial query establishes authoritative state;
- realtime messages trigger targeted refresh or safe local update;
- reconnect performs reconciliation;
- events are version checked;
- stale messages do not overwrite newer data;
- permission revocation immediately blocks future access;
- native offline queues resolve through explicit conflict rules.

## 12. Evidence and File Architecture

### 12.1 Immutable originals

Uploaded files, emails, photos, videos, audio, reports, contracts, and source snapshots are immutable Evidence after successful ingestion.

### 12.2 Storage path

Storage keys must be non-guessable and scoped by workspace. Database metadata stores hash, MIME type, size, original name, source, retention class, sensitivity, and linked entities.

### 12.3 Processing

Derived thumbnails, transcripts, text extractions, embeddings, and rendered outputs reference the original evidence and may be regenerated. They never replace the original.

### 12.4 Upload flow

`Client creates upload session → server authorizes and issues limited upload target → client uploads/resumes → server verifies hash and metadata → Evidence record becomes available → processing jobs begin`

## 13. Search and AI Architecture

### 13.1 Search

Hybrid search combines:

- exact identifiers;
- structured filters;
- full-text search;
- semantic similarity;
- recency;
- source authority;
- verification and freshness;
- Deal relevance.

All results are permission-filtered before generation or display.

### 13.2 AI gateway

All AI requests pass through one server-side gateway providing:

- model/provider routing;
- prompt registry;
- tool registry;
- context assembly;
- output schema validation;
- prompt-injection defenses;
- source citation and provenance;
- safety checks;
- cost and latency controls;
- fallback and retry;
- audit metadata.

### 13.3 Human approval

AI can propose but cannot silently accept canonical changes. External messages, offers, contract actions, financial changes, deletions, and irreversible work require explicit authorization.

## 14. Notification, Task, and Deadline Architecture

- Tasks and deadlines are canonical records, not notification payloads.
- Deadlines use deterministic trigger, timezone, holiday, and business-day rules.
- Notifications are derived delivery attempts tied to the canonical task/deadline/event.
- Email, push, and in-app channels share one notification intent and idempotency key.
- Delivery failures do not change task/deadline truth.
- User preferences, quiet hours, urgency, escalation, and lock-screen sensitivity are enforced before dispatch.

## 15. Reporting Architecture

Report generation captures an immutable source snapshot referencing exact versions of all controlling data. Rendering occurs asynchronously. Reconciliation confirms displayed financial values match canonical engine outputs before the artifact is marked complete.

Report artifacts are immutable, versioned, privately stored, and securely shareable through scoped, revocable, audited tokens.

## 16. Deployment Architecture

### 16.1 Environments

At minimum:

- local development;
- preview/ephemeral environment;
- staging;
- production.

Each environment has isolated secrets, data, storage, provider accounts, webhook endpoints, push credentials, and monitoring.

### 16.2 Web deployment

- Vercel preview for pull requests.
- Protected production deployment from approved branch and checks.
- Environment-variable validation at build and runtime.
- Reversible release and rollback plan.

### 16.3 Database deployment

- Forward-only reviewed migrations.
- Migration naming and ownership.
- Backward-compatible expansion before destructive contraction.
- Seed fixtures limited to non-production environments.
- RLS and index verification included in migration tests.

### 16.4 Native deployment

- Development, TestFlight, and App Store configurations remain separate.
- Bundle IDs, associated domains, push environments, privacy manifests, and entitlements are documented.
- Native contract compatibility is considered before backend breaking changes.

## 17. Observability Architecture

### 17.1 Required telemetry

- structured application logs;
- correlation IDs;
- distributed traces where practical;
- request latency and error rate;
- job queue depth and age;
- provider latency and failures;
- database performance;
- cache hit/miss;
- notification delivery;
- AI usage, cost, and failure;
- report generation success;
- web vitals;
- native crashes and hangs;
- security and audit events.

### 17.2 Alerting

Alerts require severity, owner, routing, deduplication, runbook, and recovery criteria. Critical alerts include authentication failure spikes, RLS denial anomalies, data corruption risk, payment/webhook failure, queue backlog, report failure, notification outage, provider outage, and production deployment regression.

## 18. Performance Architecture

- Use indexed, workspace-scoped queries.
- Avoid unbounded list reads.
- Paginate large collections.
- Use projections for dashboards and Cockpit.
- Cache only with explicit version/freshness keys.
- Process large documents, media, reports, and AI workloads asynchronously.
- Keep client bundles and native memory use within documented budgets.
- Measure cold start, Deal open, search, save acknowledgement, and report request latency.

## 19. Backup, Recovery, and Retention

- Automated database backups.
- Point-in-time recovery where available.
- Storage durability and recovery procedures.
- Regular restore tests.
- Retention schedules by evidence type and account policy.
- Legal hold capability where required.
- Deletion propagation to derived indexes and caches.
- Documented RPO and RTO for production tiers.

## 20. Cross-Module Flow Examples

### 20.1 New listing to decision

`Listing intake → source preservation → candidate facts → user verification → underwriting snapshot → strategy ranking → MarketIQ/FinanceIQ/GovernanceIQ context → Decision Cockpit → missing-input tasks → report`

### 20.2 Contract acceptance flow

`Document upload → Evidence → ContractIQ extraction → source-linked terms → user acceptance → canonical deadline/task updates → underwriting/strategy impact → Cockpit change explanation → notifications`

### 20.3 Field visit flow

`Visit plan → route → offline checklist/photo/voice capture → encrypted queue → upload reconciliation → PhotoIQ/VisitIQ proposals → user acceptance → repair assumptions/tasks → re-underwriting → updated recommendation`

### 20.4 Offer flow

`Current underwriting and strategy → maximum-offer constraints → OfferIQ structure → review → approved communication/document → counter received → ContractIQ/OfferIQ update → deadline and Cockpit refresh`

## 21. Verification and Validation

### Architecture verification

- Every specification 001–024 maps to an owning bounded context.
- No table, service, calculation, or job has conflicting canonical ownership.
- Every cross-module write uses an approved command or proposal acceptance workflow.
- Every external integration has a provider adapter and failure contract.
- Every long-running operation uses a durable job lifecycle.
- Every canonical mutation produces audit and event records.

### Security verification

- RLS protects every workspace-owned table.
- Private storage cannot be enumerated.
- Clients contain no privileged secrets.
- Admin access is purpose-limited and audited.
- AI and search enforce access before retrieval.
- Session revocation and account deletion propagate correctly.

### Data verification

- Versioned outputs remain reproducible.
- Reports reconcile to canonical results.
- Search and AI citations resolve to source records.
- Offline/native changes reconcile without silent overwrite.
- Failed jobs preserve prior valid results.
- Deleted or revoked content leaves caches and indexes according to policy.

### Integration verification

- Deal changes reach Cockpit, reports, search, tasks, and notifications as required.
- Accepted evidence proposals trigger only targeted recalculation.
- Web, iPhone, and iPad reopen the same canonical state.
- Provider outages degrade without losing user work.
- Realtime reconnect resolves missed changes.

### Production-readiness gate

This architecture is ready for implementation only when:

- all service boundaries are represented in code structure;
- API and event contracts are versioned;
- migrations and RLS policies are testable;
- background-job infrastructure is durable;
- observability and runbooks exist;
- deployment and rollback paths are proven;
- no material workflow depends on mock data or undocumented behavior.

## 22. Definition of Done

This document is complete when Codex or a senior engineering team can implement BRIX without inventing platform topology, canonical ownership, service boundaries, event flow, security architecture, deployment structure, or recovery behavior, and when the architecture remains fully consistent with the governing documents and Specifications 001–024.