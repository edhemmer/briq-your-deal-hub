# BRIX Real Estate — Start Here

## 1. Purpose and Authority

This repository is the authoritative build package for rebuilding BRIX Real Estate as its first production release. The existing repository, Supabase project, Vercel project, domains, deployment settings, and Apple project may be retained. Existing application code is reference material only unless an approved implementation task explicitly accepts it.

BRIX is an ultra-premium Property Deal Relationship Management platform, or PDRM, that helps an investor move from property discovery through underwriting, strategy selection, visits, offers, contracts, due diligence, financing, ownership, operation, refinance, and disposition through one canonical Deal record.

The product must become the investor's dependable daily decision workspace. It must be enjoyable to use, visually exceptional, operationally reliable, source-linked, explainable, and consistent from Deal to Deal. A user must be able to understand what BRIX knows, where it came from, what remains uncertain, what changed, what must be verified, and what action comes next without maintaining a second shadow underwriting tool.

This file governs how every later document and implementation task is read, executed, verified, and completed. When a later file is unclear, this file and the Product Constitution control unless a formally approved amendment states otherwise.

## 2. Non-Negotiable Product Outcome

BRIX must deliver all of the following as one connected product:

1. Ultra-premium web, iPhone, and iPad experiences designed intentionally for each device.
2. One canonical Workspace, Property, Deal, Evidence, task, deadline, financial, strategy, and audit model.
3. Deterministic, versioned, independently testable financial calculations.
4. Source-linked facts, assumptions, estimates, inferences, conflicts, confidence, freshness, and verification status.
5. A Decision Cockpit that makes the current Deal position, risks, returns, missing information, recommendation, and next action understandable without searching across disconnected modules.
6. Reliable save, reopen, refresh, relaunch, offline, synchronization, conflict, retry, recovery, and audit behavior.
7. Premium graphics, charts, comparisons, maps, reports, and information design that clarify decisions rather than decorate the interface.
8. No webpage-like native experience, clipped layouts, horizontal overruns, hidden controls, dead ends, stale state, mock success, or disconnected modules.
9. No unsupported promise of certainty. BRIX earns trust through provenance, deterministic calculations, explicit limitations, professional-review triggers, and visible uncertainty rather than hiding risk.
10. A repeatable investor workflow that becomes more dependable with every completed Deal.

## 3. Rules of Engagement

These rules apply before any document is written, repaired, or implemented.

1. Build BRIX, not documentation for its own sake.
2. Use one canonical Deal, one canonical Property, one canonical workspace boundary, one canonical Evidence model, one canonical task/deadline model, and one canonical financial engine.
3. Do not create duplicate applications, schemas, parsers, calculators, persistence paths, client-only sources of truth, or competing business logic.
4. Do not copy the old application architecture into the rebuild without explicit acceptance.
5. Do not display mock data, fake success, disconnected UI, dead controls, stale results presented as current, placeholder production behavior, or unsupported claims.
6. Every visible workflow must work end to end: entry, validation, authorization, persistence, processing, feedback, reopen, retry, recovery, audit history, and cross-client consistency.
7. Web, iPhone, iPad, reports, spreadsheets, shared views, and admin must consume the same canonical records and calculation outputs.
8. AI may assist extraction, explanation, classification, comparison, and question generation, but may not own authoritative calculations, silently alter facts, or issue final professional legal, appraisal, inspection, lending, tax, engineering, securities, or insurance conclusions.
9. Each implementation slice must be small enough to verify and complete enough to use.
10. A feature is not complete until it saves, reopens, handles errors, survives refresh or relaunch, exposes stale and processing state, and passes required tests.
11. Every mutation must be authorized server-side, auditable, idempotent where retried, and protected from accidental overwrite.
12. Every asynchronous operation must expose a durable state such as queued, processing, complete, failed, blocked, stale, conflicted, offline, or retrying.
13. No module may become an isolated feature island. Its inputs, outputs, events, tasks, Evidence, reports, notifications, and Deal timeline effects must be defined.
14. Every supported client must preserve user context and return the user to the same meaningful place after interruption.
15. A document is not complete because it is committed. It is complete only after the validation and verification requirements in this file and the applicable specification are satisfied.
16. Codex must not broaden scope, rename modules, change canonical ownership, replace approved architecture, or introduce a new dependency without identifying the exact requirement and receiving approval.
17. Codex must not mark work complete based on compilation, deployment, screenshots, or happy-path testing alone.
18. Uncertainty must be visible. A missing or unverified input may never be silently converted into a confirmed fact.
19. Premium design may not weaken accessibility, information density, performance, clarity, or reliability.
20. No release may require the user to maintain an old trusted tool because BRIX calculations, evidence, states, or reports fail to reconcile.

## 4. Required Reading Order

Codex must read and obey these files before beginning implementation:

1. `docs/00-START-HERE.md`
2. `docs/01-PRODUCT-CONSTITUTION.md`
3. `docs/02-ENGINEERING-STANDARDS.md`
4. `docs/03-DATA-ARCHITECTURE.md`
5. `docs/04-UI-UX-SYSTEM.md`
6. `docs/05-BUILD-ROADMAP.md`
7. `docs/06-SYSTEM-ARCHITECTURE.md`
8. `docs/07-UI-DESIGN-SYSTEM.md`
9. `docs/08-IMPLEMENTATION-ROADMAP.md`
10. `docs/09-APPLE-PLATFORM-COMPLIANCE.md` for every Apple, iPhone, iPad, TestFlight, Xcode, or App Store task
11. `docs/10-CODEX-MASTER-BUILD-PROMPT.md`
12. Every prerequisite specification named by the current subsystem specification
13. The complete current subsystem specification

Codex must use the exact current filenames on the default branch. Deleted, superseded, duplicate, historical, or differently numbered specification files are not authoritative.

## 5. Document Quality Standard

Every governing document and subsystem specification must be complete enough that Codex or a senior engineer can implement it without inventing product behavior or architecture.

Every subsystem specification must include, where applicable:

- Authority and prerequisite documents
- Rules of engagement specific to the subsystem
- Mission and user outcome
- Scope and explicit exclusions
- Canonical ownership and boundaries
- Entities, relationships, statuses, versioning, indexes, and RLS implications
- Complete user workflow
- Complete data and event flow
- Web behavior
- iPhone behavior
- iPad behavior
- Premium UI and UX requirements
- Loading, empty, partial, stale, offline, conflict, permission, retry, failure, and recovery states
- Security, privacy, authorization, and audit requirements
- Performance, caching, background processing, and observability requirements
- Cross-module inputs, outputs, events, tasks, deadlines, reports, notifications, and timeline effects
- AI responsibilities and prohibitions
- Acceptance tests
- Regression tests
- Validation and verification checklist
- Explicit Definition of Done

A file that omits a material applicable section must be repaired before it is treated as implementation-complete. A later governing document may strengthen an earlier specification without duplicating or replacing its canonical ownership.

## 6. Required Task Start Format

Before coding, Codex must state:

- Exact user outcome
- Applicable governing documents and specifications read
- Existing systems and files inspected
- Canonical data owner
- Canonical calculation owner
- Complete user flow
- Complete data flow
- Domain events consumed and emitted
- Cross-module connections
- Web behavior
- iPhone behavior
- iPad behavior
- Loading, empty, partial, offline, stale, conflict, permission, retry, and failure behavior
- Freshness, cache invalidation, and synchronization behavior
- Files expected to change
- Database, storage, API, background job, or Edge Function changes
- Tests required
- Security and RLS effects
- Risks of duplication, drift, stale state, data loss, misleading information, or regression

Codex must not begin implementation until it can state the full path:

`User action → client validation → authorization boundary → canonical persistence → domain logic → canonical result → connected module updates → client feedback → audit/event history → save/reopen verification`

## 7. Required Task Completion Format

At completion, Codex must report:

- Files changed
- Database and migration changes
- API, background job, and Edge Function changes
- Domain events added or changed
- Cross-module connections verified
- Tests added
- Exact commands run and exact results
- Verified user flow
- Verified save and reopen behavior
- Verified refresh and relaunch behavior
- Verified loading, empty, stale, conflict, offline, permission, failure, retry, and recovery behavior
- Verified web, iPhone, and iPad consistency where applicable
- Verified reports, exports, notifications, and timeline effects where applicable
- Verified RLS, authorization, audit, idempotency, and storage isolation
- Verified calculation reconciliation and source provenance where applicable
- Known limitations
- Confirmation that unrelated files were not changed
- `COMPLETE` or `NOT COMPLETE`

Codex may not claim completion when a material workflow, connection, test, supported client, data state, recovery path, accessibility requirement, Apple compliance requirement, or calculation reconciliation remains unverified.

## 8. Seamless Flow Requirement

Every subsystem must connect through the canonical Deal and preserve one continuous investor workflow.

For each subsystem, implementation and review must verify:

- Entry points open the correct workspace, Deal, Property, and record.
- Data written by one subsystem appears correctly in every connected subsystem.
- Accepted changes trigger only the required targeted recalculations and updates.
- Notifications and deep links open the exact related action.
- Tasks and deadlines use the canonical task system.
- Evidence remains source-linked and available from connected screens.
- Reports and exports use current canonical values and disclose freshness.
- Prior valid results remain visible when a later background process fails.
- No duplicate, orphaned, contradictory, or hidden state is created.
- Web, iPhone, iPad, admin, reports, and shared views reconcile.
- The Decision Cockpit reflects all material accepted changes.
- The user can understand why a recommendation or key metric changed.

## 9. Validation and Verification Gate

Before a document or implementation slice is marked complete, verify all applicable items below.

### 9.1 Functional validation

- The primary workflow works end to end with realistic data.
- Every visible control has working behavior.
- Create, read, update, archive, restore, and delete behavior works according to policy.
- Save, reopen, refresh, relaunch, and resume work.
- Duplicate submission and retry do not create duplicate records or charges.
- Errors preserve user work and provide a safe recovery path.

### 9.2 Data and integration validation

- Canonical IDs and owners are used.
- No shadow schema, duplicate engine, or client-only source of truth exists.
- RLS and workspace isolation are enforced.
- Source, classification, confidence, effective date, freshness, and history are retained where material.
- Domain events are emitted once and consumed idempotently.
- Connected modules, tasks, deadlines, timeline, reports, notifications, and admin state update correctly.
- No stale result is presented as current.
- No orphaned files, Evidence, tasks, calculations, or records remain.
- Financial outputs reconcile to versioned deterministic fixtures.

### 9.3 UX validation

- The active workspace, Deal, status, freshness, primary action, and next action are clear.
- Web, iPhone, and iPad behavior is complete and intentionally designed.
- Loading, empty, partial, stale, offline, conflict, permission, success, failure, retry, and recovery states are designed and tested.
- Accessibility requirements are satisfied.
- The user never reaches a dead end.
- Beginner guidance and professional detail use the same canonical data.
- Charts, maps, reports, and graphics improve comprehension and remain accurate and accessible.
- Native clients do not feel like compressed websites.

### 9.4 Security and operations validation

- Authorization is enforced server-side.
- RLS, storage isolation, secrets, and signed access are correct.
- Admin and material user actions are audited.
- Logs do not expose sensitive data.
- Expensive operations have limits, metering, and abuse protection.
- Background jobs expose durable status, timeout, retry, and escalation behavior.
- Monitoring can determine whether the workflow is healthy.

### 9.5 Final completion decision

Mark `COMPLETE` only when:

- The specification is accurate and internally consistent.
- The implementation works with every connected completed subsystem.
- Required tests pass.
- No material TODO, placeholder, disconnected state, stale-state defect, misleading result, or unverified claim remains.
- A senior engineer can continue without inventing architecture or product behavior.
- The user can complete the intended investor decision workflow without relying on a second calculation system.

Otherwise mark `NOT COMPLETE`, identify the exact gap, and repair it before moving to the next item in the roadmap.
