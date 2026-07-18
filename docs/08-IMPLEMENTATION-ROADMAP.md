# BRIX Real Estate — Implementation Execution Roadmap

## 1. Authority and Rules of Engagement

This document is governed by `docs/00-START-HERE.md` through `docs/07-UI-DESIGN-SYSTEM.md` and Specifications 001–024.

Rules:

1. This document converts the approved specification package into an exact build and release sequence.
2. It may organize work, milestones, branches, migrations, tests, and release gates, but may not change approved product behavior.
3. Codex must read the governing documents and the current specification before beginning each implementation slice.
4. Build complete vertical slices, not disconnected schema, backend, or UI fragments.
5. Do not begin a dependent slice until its prerequisite gate passes.
6. Every slice must include authorization, persistence, domain logic, UI, loading, error, offline where applicable, audit, events, tests, observability, and save/reopen verification.
7. Existing code is reference material unless explicitly accepted. Do not preserve architectural debt simply because it already exists.
8. No feature is complete when mock data, placeholder behavior, dead controls, hidden assumptions, or unverified integrations remain.
9. Every merge must leave `main` deployable or protected by a disabled feature flag.
10. The roadmap ends only when Specification 024 release evidence passes for web, backend, iPhone, and iPad.

## 2. Execution Model

Each numbered specification is implemented as one or more vertical slices following this path:

`Rules re-anchor → dependency check → schema/contracts → domain logic → server commands/queries → UI states → integration events → tests → observability → deployment → verification evidence`

Each slice moves through:

1. Planned.
2. Ready.
3. In progress.
4. Implemented.
5. Verified.
6. Integrated.
7. Release-ready.
8. Complete.

A status may not be advanced without evidence.

## 3. Repository and Branch Discipline

### 3.1 Main branch

- `main` is protected and production-oriented.
- No direct unreviewed destructive changes.
- Required checks must pass before merge.
- Feature flags protect incomplete but safely merged infrastructure.

### 3.2 Branch naming

Use:

- `feat/001-auth-workspaces-<slice>`
- `fix/<area>-<issue>`
- `infra/<capability>`
- `release/<version>`

### 3.3 Commit discipline

Commits should be narrow, ordered, and reversible. Preferred sequence:

1. migration/contracts;
2. domain/application logic;
3. UI;
4. tests/fixtures;
5. observability/docs.

Do not combine unrelated modules in one commit.

### 3.4 Pull request gate

Every PR must state:

- specification and slice;
- scope completed;
- dependencies;
- migrations;
- security impact;
- test evidence;
- screenshots or recordings where UI changes;
- rollback plan;
- known limitations;
- Definition of Done result.

## 4. Environment Readiness

Before product implementation:

- Confirm GitHub repository and branch protection.
- Confirm Vercel development, preview, staging, and production configuration.
- Confirm Supabase development/staging/production separation or an approved safe environment model.
- Inventory current migrations, RLS, buckets, functions, secrets, domains, and webhooks.
- Confirm native bundle IDs, Apple team, associated domains, push configuration, and TestFlight access.
- Configure error tracking, structured logging, tracing, uptime checks, and alert routing.
- Configure secret scanning, dependency scanning, linting, type checking, unit tests, and build checks.
- Establish non-production seed and fixture data.

Gate: a trivial authenticated deployment can be built, tested, deployed, observed, and rolled back without touching production data.

## 5. Database Migration Strategy

### 5.1 Migration order

For each domain:

1. Create enums/reference tables where justified.
2. Create canonical tables.
3. Add foreign keys and constraints.
4. Add indexes.
5. Add RLS policies.
6. Add server functions only when needed.
7. Add outbox/audit integration.
8. Add backfill or compatibility migration.
9. Verify rollback or forward repair.

### 5.2 Safe evolution

Use expand-and-contract:

- add new nullable/versioned structure;
- deploy compatible code;
- backfill and verify;
- switch reads/writes;
- remove obsolete structure in a later reviewed migration.

Never combine destructive schema removal with the first application change that stops using it.

### 5.3 Migration verification

Every migration suite must test:

- clean database apply;
- upgrade from previous state;
- RLS behavior by role and workspace;
- constraints;
- indexes for critical queries;
- seed/fixture compatibility;
- production-safe execution time.

## 6. Shared Infrastructure Milestone

Build before or alongside the first dependent product slice:

- typed API/error contracts;
- server authorization helpers;
- idempotency support;
- audit service;
- transactional outbox;
- durable background jobs;
- structured logging/correlation IDs;
- feature flags;
- usage metering hooks;
- file upload sessions;
- canonical source/verification vocabulary;
- client query/cache conventions;
- design tokens and core components.

Gate: one sample mutation proves authorization, transaction, audit, event delivery, UI reconciliation, retry, and observability end to end.

## 7. Phase 1 — Secure Foundation

### 7.1 Specification 001: Authentication and Workspaces

Implementation order:

1. Auth configuration and redirect inventory.
2. Profile/workspace/membership schema.
3. RLS and role contracts.
4. Signup, verification, sign-in, reset, sign-out.
5. Workspace creation and invitation.
6. Membership roles and revocation.
7. Native deep links and Keychain.
8. Account deletion workflow.
9. Auth observability and security tests.

Gate:

- account lifecycle works on web and native;
- workspace isolation passes automated tests;
- revoked access fails immediately;
- interrupted auth returns safely;
- account deletion follows policy.

### 7.2 Specification 002: Dashboard and Application Shell

Implementation order:

1. Shared design tokens/components.
2. Web shell and responsive navigation.
3. iPhone shell.
4. iPad shell.
5. Workspace and Deal context preservation.
6. Global search entry and job/notification surfaces.
7. Guided/professional mode preference foundation.
8. Deep-link routing.

Gate: all approved destinations resolve without dead navigation and preserve authorized context.

### 7.3 Specification 003: Deals and PDRM Core

Implementation order:

1. Property and Deal schema/state machines.
2. Contacts and organizations.
3. Tasks, deadlines, notes, timeline, and activity.
4. CRUD commands and query projections.
5. Search/filter/archive/restore.
6. Deal workspace UI.
7. Offline/native draft behavior for supported fields.
8. Events and audit.

Gate: a Deal can be created, saved, reopened, updated, searched, archived, restored, and synchronized across clients.

## 8. Phase 2 — Intake and Core Decision Engine

### 8.1 Specification 004: Property Intake

Build intake methods in this order:

1. manual address;
2. listing URL;
3. file/image/document;
4. email/share extension;
5. package/batch.

Then add duplicate detection, source classification, conflict handling, provider adapters, manual fallback, and preliminary assumption proposals.

Gate: provider failure never blocks manual Deal creation and estimates are never displayed as confirmed facts.

### 8.2 Specification 005: Deterministic Underwriting

1. Formula registry and versioning.
2. Input schemas by property type.
3. Validation and normalization.
4. Immutable snapshots.
5. Core outputs.
6. Scenario/sensitivity engine.
7. Golden fixtures and independent reconciliation.
8. Web/native presentation.
9. Report contract.

Gate: golden fixtures pass and every client/report displays the same authoritative result.

### 8.3 Specification 006: Strategy Intelligence

1. Permanent strategy registry.
2. Requirements and hard disqualifiers.
3. Compatibility engine.
4. Scoring/ranking and confidence.
5. Explanation contract.
6. Targeted reevaluation events.
7. Strategy UI and comparison.

Gate: ranking is deterministic, disqualifiers cannot be hidden, and accepted evidence changes trigger a traceable new result.

### 8.4 Specification 007: Decision Cockpit

1. Read projection contract.
2. Recommendation and key metrics.
3. risk/confidence/missing input panels.
4. next action and deadline panels.
5. change explanation/history.
6. deep links to governing modules/evidence.
7. responsive and native layouts.

Gate: the user can understand the current decision, reason, controlling numbers, risk, missing data, change, and next action from one workspace.

## 9. Phase 3 — External Context and Transaction Structure

### 9.1 Specification 008: MarketIQ

Build provider-neutral location identity first, then source ingestion, freshness, hazards, taxes, infrastructure, liquidity, growth, conveniences, and local risk. Add source-linked findings and degraded states.

Gate: every conclusion shows geography, timeframe, source, method, confidence, and staleness.

### 9.2 Specification 009: FinanceIQ

1. Financing structure schema.
2. Debt/equity tranche models.
3. Deterministic debt schedules.
4. lender conditions and constraints.
5. scenario comparison.
6. re-underwriting integration.
7. UI/capital-stack visualization.

Gate: schedules reconcile independently and financing changes produce versioned underwriting and strategy updates.

### 9.3 Specification 010: GovernanceIQ

1. Governance document intake.
2. source-linked extraction.
3. restriction and financial-health models.
4. parking/trailer/leasing/renovation/insurance analysis.
5. strategy impact proposals.
6. document viewer and verification UX.

Gate: findings link to exact source anchors and never become unsupported legal conclusions.

### 9.4 Specification 011: ContractIQ

1. Document hierarchy and evidence intake.
2. parties, property, money, obligations, contingencies.
3. deadline engine.
4. amendment/supersession/conflicts.
5. perspective analysis.
6. explicit proposal acceptance workflow.
7. source-linked viewer and questions.

Gate: originals remain immutable, deadlines are deterministic, and no extraction silently changes the Deal.

## 10. Phase 4 — Offer and Field Operations

### 10.1 Specification 012: OfferIQ

Implement maximum-offer inputs and constraints, offer structures, revisions, counters, statuses, negotiation history, deadline connections, document outputs, and explicit send/submit approval.

Gate: every revision is traceable and external action cannot occur without authorization and review.

### 10.2 Specification 013: PhotoIQ

Implement media ingestion, immutable originals, thumbnails, area classification, AI observations, confidence, correction, accepted condition/repair proposals, and report integration.

Gate: image analysis is never presented as a professional inspection and accepted proposals preserve before/after state.

### 10.3 Specification 014: VisitIQ

Implement map identity, route planning, visit records, offline checklist, photo/video/voice capture, transcription, sync queue, summary, and follow-up tasks.

Gate: field work survives connectivity loss, app interruption, and retry without silent loss.

### 10.4 Specification 015: InspectionIQ and AppraisalIQ

Implement professional report intake, source anchors, findings, repair and valuation proposals, conflicts, acceptance, targeted re-underwriting, and professional boundaries.

Gate: professional reports remain intact and accepted updates produce traceable recommendation changes.

## 11. Phase 5 — Evidence, Reporting, Education, and Portfolio

### 11.1 Specification 016: Evidence, Email, Files, and Audit

1. Evidence metadata and private storage.
2. resumable upload sessions.
3. duplicate/hash logic.
4. email ingestion.
5. extraction/transcript/index derivatives.
6. assignment/conflict/retention.
7. immutable audit trail and viewer.

Gate: originals, hashes, access, history, retention, and derived records reconcile across all modules.

### 11.2 Specification 017: ReportIQ

1. report definitions and source snapshots;
2. rendering jobs;
3. numeric reconciliation;
4. PDF/spreadsheet/CSV outputs;
5. artifact history;
6. secure share links;
7. portfolio comparison and saved views.

Gate: reports reconcile to canonical values and shared views expose only approved scope.

### 11.3 Specification 018: RELearnIQ

Implement approved content registry, glossary, explanation contracts, guided/professional modes, contextual help, formula/source explanations, learning preferences, and accessible presentation.

Gate: education never changes canonical data or blocks the underlying workflow.

## 12. Phase 6 — Operations, Native, AI, and Workflow Delivery

### 12.1 Specification 019: Admin, Billing, Usage, and Operations

Implement plans/entitlements, usage/cost, billing events, authorized support, workspace/user operations, job/provider health, feature flags, support notes, audit, and safe administrative actions.

Gate: entitlements are enforced server-side and every sensitive admin action is authorized, reasoned, and audited.

### 12.2 Specification 020: Native iPhone and iPad

Harden rather than merely wrap:

- auth/deep links;
- encrypted cache;
- offline mutation queue;
- background uploads;
- camera, voice, files, maps, share extension;
- push routing;
- conflict resolution;
- accessibility;
- crash/hang observability;
- TestFlight and App Store configuration.

Gate: the native critical path works on physical devices under online, poor-network, offline, interrupted, and expired-session conditions.

### 12.3 Specification 021: AI Orchestration

1. AI gateway.
2. model/provider registry.
3. prompt/tool registry.
4. retrieval/indexing.
5. response provenance and citations.
6. approval levels.
7. automation jobs.
8. safety and prompt-injection defenses.
9. cost/usage controls.
10. Ask BRIX and global semantic search.

Gate: AI failure never blocks deterministic work and no AI output silently mutates canonical records.

### 12.4 Specification 022: Notifications, Tasks, and Deadlines

1. canonical task/deadline review against Specification 003;
2. deterministic deadline calculations;
3. notification intents and templates;
4. in-app delivery;
5. email delivery;
6. push delivery;
7. preferences/quiet hours/escalation;
8. deep links and native actions;
9. retries, idempotency, and delivery observability.

Gate: reminders are timezone-aware, duplicate-safe, preference-aware, deep-linked, and never treated as the sole legal-deadline safeguard.

## 13. Phase 7 — Public Experience and Release

### 13.1 Specification 023: Landing, Help, and Conversion

Implement approved positioning, examples, pricing, plans, security/privacy, help, legal content, signup/sign-in, analytics consent, SEO, accessibility, and truthful feature availability.

Gate: public claims match the released product and conversion paths work without dead ends.

### 13.2 Specification 024: Testing, Observability, and Release Readiness

Complete:

- critical E2E suites;
- integration and contract tests;
- RLS/security tests;
- accessibility tests;
- performance/load tests;
- provider-failure tests;
- backup/restore tests;
- incident runbooks;
- alerts and dashboards;
- deployment/rollback drills;
- privacy and legal review;
- web production release;
- TestFlight/App Store evidence.

Gate: the release checklist contains evidence, owners, dates, results, and no hidden critical limitation.

## 14. Testing Pyramid

### Unit tests

- formulas;
- state machines;
- validators;
- ranking/disqualifiers;
- deadline calculations;
- permission helpers;
- formatters.

### Integration tests

- database constraints and RLS;
- command transactions;
- outbox consumers;
- storage access;
- provider adapters;
- job retry/idempotency;
- report reconciliation;
- notification delivery.

### End-to-end tests

Critical paths:

1. signup → workspace → Deal;
2. intake → verify → underwriting → strategy → Cockpit;
3. contract upload → accepted deadline → task/notification;
4. visit offline capture → sync → accepted proposal → re-underwriting;
5. offer revision/counter flow;
6. report generation/share/revoke;
7. entitlement enforcement;
8. account/workspace revocation;
9. native deep-link and offline recovery.

### Nonfunctional tests

- security;
- accessibility;
- load/performance;
- resilience/chaos;
- backup/restore;
- privacy;
- cross-browser/device;
- migration upgrade.

## 15. CI/CD Gates

Required PR checks:

- formatting;
- lint;
- type check;
- unit tests;
- integration tests for affected domain;
- migration validation;
- RLS tests;
- build;
- dependency/security scan;
- preview deployment;
- targeted E2E.

Required production checks:

- staging smoke;
- migration plan approved;
- backups current;
- feature flags configured;
- observability dashboards live;
- rollback tested;
- release owner assigned;
- customer-impact communication prepared where needed.

## 16. Performance Budgets

Set measurable budgets before implementation completion for:

- web cold and warm load;
- dashboard usable time;
- Deal open;
- save acknowledgement;
- underwriting execution;
- search;
- report request acknowledgement;
- common report completion;
- native cold launch;
- camera-ready time;
- queue insertion;
- upload initiation;
- crash-free sessions;
- background-job queue age.

A regression beyond budget blocks release unless explicitly risk-accepted with a repair plan.

## 17. Security Gates

Before each phase completion verify:

- threat model updated;
- RLS tested;
- least privilege;
- secrets scan clean;
- input/output validation;
- rate limits;
- file upload safety;
- prompt-injection defenses where applicable;
- audit coverage;
- deletion/retention behavior;
- no sensitive telemetry leakage.

## 18. Definition of Done for Every Slice

A slice is complete only when:

- approved behavior is implemented end to end;
- canonical ownership is preserved;
- schema, API, events, UI, and jobs agree;
- loading, empty, partial, stale, offline, conflict, failure, retry, and permission states exist where applicable;
- web, iPhone, and iPad are handled as required;
- tests pass;
- logs, metrics, and alerts exist;
- security and accessibility checks pass;
- save/reopen and recovery work;
- documentation is synchronized;
- no TODO, placeholder, fake success, dead control, or undisclosed limitation remains.

## 19. Final Program Verification

### Specification coverage

- Every governing document and Specification 001–024 has implementation evidence.
- Every requirement is mapped to code, test, or explicit non-applicability.
- No orphan feature, table, endpoint, event, or screen remains undocumented.

### Seamless-flow verification

- Property intake flows to underwriting and strategy.
- Accepted evidence updates targeted canonical assumptions.
- Cockpit reflects current recommendation and changes.
- Contract and governance deadlines create tasks and notification intents.
- Field capture synchronizes and reopens across clients.
- Reports reconcile to live canonical values.
- Search and AI cite authorized evidence.
- Admin, billing, and entitlements consistently control access.

### Release verification

- Production web deploy passes smoke and monitoring.
- Production migrations and RLS pass.
- Backup restore is proven.
- Critical alerts and runbooks are active.
- Native builds pass physical-device and TestFlight gates.
- Privacy, legal, pricing, help, and public claims match release behavior.
- Rollback has been practiced.

## 20. Definition of Done

This implementation roadmap is complete when Codex or an engineering team can execute the BRIX build in a controlled order without inventing milestones, dependency gates, migration order, test strategy, deployment sequence, or release criteria, and when every completed stage leaves BRIX secure, coherent, testable, deployable, and aligned with the approved architecture, design system, and Specifications 001–024.