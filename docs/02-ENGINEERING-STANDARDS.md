# BRIX Real Estate — Engineering Standards

## 1. Authority and Rules of Engagement

This document defines how BRIX is engineered. It is subordinate only to `docs/00-START-HERE.md` and `docs/01-PRODUCT-CONSTITUTION.md`.

Before modifying code, Codex or any engineer must:

1. Read the governing documents and the active subsystem specification.
2. Inspect the current repository and identify reusable implementation.
3. State the exact user outcome and the complete user flow.
4. Identify canonical data ownership and canonical calculation ownership.
5. Identify every affected web, iPhone, iPad, database, storage, Edge Function, report, admin, notification, and background-job path.
6. Confirm no duplicate application, schema, engine, parser, task system, event path, or client-only source of truth will be created.
7. Define loading, empty, success, warning, stale, offline, conflict, permission-denied, retry, and failure behavior before implementing the happy path.
8. Define tests and completion evidence before coding.
9. Preserve completed behavior outside the approved scope.
10. Stop and report `NOT COMPLETE` when material verification cannot be performed.

Permanent engineering rules:

- One canonical Deal and Property model.
- One deterministic financial engine.
- One evidence system, timeline, task/deadline system, contact model, and audit model.
- Server-side authorization and business-rule enforcement.
- No fake data, fake success, dead controls, silent failures, or placeholder production behavior.
- No authoritative financial math in browser or native clients.
- No silent overwrite of accepted facts, assumptions, evidence, recommendations, or user decisions.
- No feature is complete until it saves, reopens, recovers, integrates, and passes required tests.

## 2. Required Architecture

BRIX uses a single canonical repository and backend.

Recommended logical structure:

```text
apps/
  web/
  ios/
packages/
  domain/
  contracts/
  underwriting/
  strategies/
  design-tokens/
supabase/
  migrations/
  functions/
  tests/
  seed/
tests/
  e2e/
docs/
specs/
scripts/
```

Equivalent structure is acceptable only when it preserves clear ownership and prevents duplicate logic.

### 2.1 Web

- TypeScript strict mode.
- Framework-supported server and client boundaries.
- Shared domain contracts rather than handwritten divergent types.
- Accessible, responsive, production-built UI.
- Server-side or Edge Function boundaries for privileged operations.
- No service-role credentials in browser code.

### 2.2 Native iOS and iPadOS

- Native Swift and SwiftUI.
- Keychain-backed session storage.
- Native navigation, camera, microphone, file import, maps, share extension, background upload, and offline drafts where required.
- iPhone and iPad designed independently around the same canonical contracts.
- No embedded web shell as the primary application architecture.

### 2.3 Backend

- Supabase Auth, Postgres, Storage, Row Level Security, and Edge Functions.
- Versioned, forward-only migrations.
- Workspace isolation by default.
- Signed or authorized file access.
- Server-owned calculations and material state transitions.
- Structured domain events and durable background-job state.

### 2.4 Deployment

- Vercel for web environments.
- Separate local, preview, staging, and production configuration.
- App Store Connect/TestFlight for native releases.
- Environment-specific secrets managed outside source control.
- Production deploy and rollback procedures documented and tested.

## 3. Canonical Ownership and Boundaries

Every entity and output must have one owner.

### 3.1 Client responsibilities

Clients may:

- Collect user input.
- Perform non-authoritative presentation validation.
- Render canonical records and calculation results.
- Cache data under explicit freshness rules.
- Queue offline-safe drafts and uploads.
- Display processing, conflict, and retry state.

Clients may not:

- Own authoritative financial calculations.
- Bypass RLS or server-side permission checks.
- Create shadow records that never reconcile to the backend.
- Infer successful persistence from local UI state alone.
- silently resolve conflicts involving material data.

### 3.2 Server responsibilities

Server-side boundaries own:

- Authorization.
- Canonical mutations.
- State-machine enforcement.
- Idempotency.
- Version checks.
- Calculation execution.
- Domain-event emission.
- Background-job coordination.
- Audit history.
- Provider secret handling.
- Rate limits and abuse protection.

### 3.3 Shared contracts

All clients must consume versioned contracts for:

- Entity IDs and schemas.
- Enumerations and lifecycle states.
- Calculation inputs and outputs.
- Domain events.
- Error envelopes.
- Processing states.
- Freshness and conflict metadata.

Breaking changes require explicit versioning and migration.

## 4. Repository Discipline

### 4.1 Branch and change scope

- Each implementation task must have an exact scope.
- Unrelated refactors are prohibited unless they are required to complete the task safely.
- Stable code must not be rewritten merely for style preference.
- Generated files must be reproducible.
- Large architectural changes require a dedicated specification or amendment.

### 4.2 Commits

A commit must:

- Describe the user or system outcome.
- Contain one coherent change set.
- Include migrations and tests required by the change.
- Avoid partial placeholder implementation presented as complete.
- Preserve a buildable state unless explicitly marked as a non-production branch checkpoint.

### 4.3 Dependencies

- Prefer maintained, well-documented dependencies.
- Minimize dependency surface.
- Pin or constrain versions intentionally.
- Review security, privacy, license, bundle-size, native-SDK, and maintenance implications.
- Do not add a dependency when platform or existing project capabilities provide a safer equivalent.

## 5. Coding Standards

### 5.1 General

- Use clear, domain-accurate names.
- Keep functions and modules focused.
- Prefer explicit behavior over hidden magic.
- Avoid duplicated constants, enums, validation, and formulas.
- Represent money, dates, time zones, rates, units, and precision deliberately.
- Reject invalid states at the correct boundary.
- Do not swallow exceptions.
- Do not log secrets, tokens, raw sensitive documents, or unnecessary PII.

### 5.2 TypeScript

- Strict mode remains enabled.
- Avoid `any`; justify narrow exceptions.
- Validate untrusted input at runtime.
- Separate domain types from transport and UI view models.
- Exhaustively handle state unions and enums.
- Prefer pure domain functions for deterministic logic.

### 5.3 Swift

- Use structured concurrency.
- Keep view models or observable state focused on presentation orchestration.
- Keep persistence, sync, networking, and domain logic in dedicated layers.
- Use actors or other safe concurrency boundaries where shared mutable state exists.
- Support cancellation and app lifecycle interruptions.
- Avoid storing sensitive material in UserDefaults.

### 5.4 SQL and Postgres

- Use UUIDs or approved canonical IDs consistently.
- Define foreign keys, indexes, constraints, and delete behavior intentionally.
- Prefer database constraints for invariants that must always hold.
- Keep RLS enabled on workspace-scoped and sensitive tables.
- Avoid unbounded queries.
- Use transactions for multi-record canonical mutations.
- Use append-only audit or history tables for material events.

## 6. State, Freshness, and Synchronization

Every asynchronous or distributed operation must use explicit states appropriate to the workflow, such as:

- Draft
- Locally saved
- Queued
- Uploading
- Processing
- Awaiting verification
- Complete
- Partially complete
- Failed
- Retry scheduled
- Blocked
- Conflict
- Offline
- Stale
- Superseded
- Cancelled

Required behavior:

- Display `as of` time for decision-sensitive results.
- Associate results with accepted assumption and evidence versions.
- Mark prior results stale when dependencies change.
- Preserve prior valid output during processing or failure.
- Use idempotency keys for retried mutations and jobs.
- Use optimistic concurrency or version checks to prevent silent overwrite.
- Provide human-understandable conflict resolution when automatic merge is unsafe.
- Separate local unsynced work from canonical synced state.
- Time out or escalate operations that cannot remain indefinitely in processing.

## 7. Domain Events and Background Jobs

### 7.1 Domain events

Material state changes must emit versioned domain events after successful canonical persistence.

Each event must include:

- Event ID
- Event type and version
- Workspace ID
- Deal ID and Property ID where applicable
- Actor
- Source client or service
- Entity ID and version
- Correlation ID
- Idempotency key
- Occurred-at timestamp
- Relevant payload references

Consumers must be idempotent. Events must not be emitted before the transaction they describe is durable.

### 7.2 Background jobs

Imports, extraction, AI processing, report generation, media upload, notifications, recalculation, and external-provider work require durable job records.

Jobs must expose:

- Job ID and type
- Canonical target
- Requested by
- Queued, started, heartbeat, completed, failed, retry, and cancelled times
- Attempt count
- Progress when meaningful
- Provider/model/version where applicable
- Error category and safe user message
- Correlation ID
- Output references
- Retry eligibility

A background failure may not erase prior valid output or leave the UI in an endless spinner.

## 8. Deterministic Calculation Standards

Authoritative calculations must:

- Execute through one backend-owned engine.
- Use immutable input snapshots.
- Record engine version.
- Produce reproducible outputs.
- Preserve full internal precision.
- Apply documented display rounding only at presentation.
- Include validation issues, missing inputs, and calculation provenance.
- Support golden test fixtures and independent reconciliation.
- Remain consistent across web, iOS, reports, exports, and admin.

AI may explain a calculation result but may not produce or replace the authoritative result.

## 9. API and Edge Function Standards

Every privileged endpoint or function must define:

- Purpose
- Authentication requirement
- Authorization rule
- Input schema
- Output schema
- Error envelope
- Idempotency behavior
- Rate limit
- Timeout
- Retry safety
- Audit behavior
- Logging and correlation
- Provider failure behavior
- Versioning strategy

Errors must distinguish at minimum:

- Validation
- Authentication
- Authorization
- Not found
- Conflict
- Rate limited
- Dependency unavailable
- Timeout
- Internal failure

Raw provider errors and stack traces must not be exposed to users.

## 10. Security and Privacy

Required controls:

- Server-side authorization for every privileged operation.
- RLS policies tested for cross-workspace denial.
- Least-privilege service access.
- Service-role keys restricted to secure server contexts.
- Signed or authorized Storage access.
- Secret rotation capability.
- Session revocation.
- Account and workspace deletion workflows.
- Audit of administrative and sensitive actions.
- Data minimization and retention rules.
- Provider privacy review for document and AI processing.
- Abuse protection for expensive operations.
- Dependency and secret scanning in CI.

Security controls must fail closed unless a documented availability requirement justifies a safer degraded mode.

## 11. UI Engineering Requirements

Every screen and component must implement applicable states:

- Initial loading
- Incremental loading
- Empty first use
- Empty filtered result
- Success
- Saved
- Processing
- Partial result
- Stale result
- Offline/local-only
- Conflict
- Permission denied
- Recoverable error
- Nonrecoverable error
- Disabled with reason

Visible controls must have implemented destinations and backend behavior. Every mutation must provide accurate pending, saved, queued, failed, or conflicted feedback.

Web must support keyboard navigation and responsive layouts. Native clients must support touch, safe areas, Dynamic Type, VoiceOver, reduced motion, app lifecycle restoration, and device-appropriate layouts.

## 12. Testing Standards

Every subsystem must define and implement the relevant layers:

- Unit tests
- Domain and formula tests
- Schema and contract tests
- Database constraint tests
- RLS and storage authorization tests
- Edge Function tests
- Integration tests
- Web component tests
- Web end-to-end tests
- iOS unit tests
- iOS UI tests
- Offline and sync tests
- Conflict and retry tests
- Accessibility tests
- Performance tests
- Migration tests
- Backup and restore tests where applicable

Tests must use realistic fixtures and assert meaningful outcomes, not only implementation details.

Critical workflows require end-to-end coverage from user action through persistence, processing, display, reopen, and audit history.

## 13. Performance and Reliability

Every subsystem specification must state appropriate targets. General expectations:

- Navigation and local interactions remain responsive during background work.
- Decision-critical summaries load before secondary detail where safe.
- Large lists are paginated or virtualized.
- Large uploads and exports run asynchronously.
- Caches have explicit invalidation and freshness metadata.
- Provider failures degrade to manual continuation when possible.
- Retries do not duplicate canonical records.
- Timeouts, circuit breakers, or backoff protect external dependencies.
- Monitoring identifies elevated latency, error rates, queue backlog, provider failure, and cost spikes.

## 14. Observability and Operations

Production behavior must be observable through:

- Structured logs
- Correlation IDs
- Error tracking
- Performance traces
- Background-job state
- Provider health
- Usage and cost metering
- Audit history
- Alert thresholds
- Deployment and release metadata

Logs must be useful without exposing protected content.

## 15. Definition of Done

A task or subsystem is complete only when:

- The full intended workflow works end to end.
- Canonical ownership is preserved.
- Save and reopen work.
- Browser refresh and app relaunch preserve completed work.
- Offline, stale, conflict, retry, and failure behavior are implemented where applicable.
- Web, iPhone, iPad, reports, exports, admin, tasks, timeline, and notifications reconcile where connected.
- RLS and server-side authorization pass.
- Required tests pass.
- Production build succeeds.
- No dead controls, fake data, placeholder success, silent failure, or disconnected state remains.
- Exact commands and results are recorded.
- Known limitations are explicit.
- Unrelated files were not changed.

## 16. Verification and Validation

### Architecture verification

- No duplicate canonical model, financial engine, evidence store, task system, event path, or application root was created.
- Client and server responsibilities remain correctly separated.
- Shared contracts are versioned and consumed consistently.
- Migrations are forward-only and safe.

### Functional verification

- Happy path and all applicable state variants are implemented.
- Mutations are idempotent.
- Work survives refresh, relaunch, auth refresh, network loss, and safe retry.
- Background operations expose durable status and recovery.

### Integration verification

- Domain events are emitted once after successful persistence.
- Consumers handle events idempotently.
- Connected modules, reports, tasks, deadlines, notifications, and timeline update correctly.
- No stale result is shown as current.
- No client or export disagrees with canonical material values.

### Security verification

- Authentication, authorization, RLS, Storage access, rate limits, secret handling, audit, and deletion behavior are tested.
- Cross-workspace and privilege-escalation attempts fail.
- Sensitive content is absent from unsafe logs and clients.

### Quality verification

Run and record the applicable commands for install, typecheck, lint, unit, integration, E2E, production build, Supabase checks, iOS build, accessibility, and performance.

**DOCUMENT STATUS: REVIEWED AND REPAIRED**
