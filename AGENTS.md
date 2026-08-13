# BRIX Repository Instructions

BRIX Real Estate is a production real estate investment operating system for individual investors. It is not a prototype, mockup, landing-page demo, generic CRM, listing portal, or collection of disconnected modules.

The repository must be implemented as one connected Property Deal Relationship Management (PDRM) product centered on one canonical Deal and one canonical Property, with source-linked Evidence, deterministic underwriting, explicit uncertainty, controlled cross-module changes, and reliable save/reopen/recovery behavior.

## Product Authority

The authoritative build package is the numbered top-level documentation and current numbered specifications.

Read and obey in this order before material implementation work:

1. `docs/00-START-HERE.md`
2. `docs/01-PRODUCT-CONSTITUTION.md`
3. `docs/02-ENGINEERING-STANDARDS.md`
4. `docs/03-DATA-ARCHITECTURE.md`
5. `docs/04-UI-UX-SYSTEM.md`
6. `docs/05-BUILD-ROADMAP.md`
7. `docs/06-SYSTEM-ARCHITECTURE.md`
8. `docs/07-UI-DESIGN-SYSTEM.md`
9. `docs/08-IMPLEMENTATION-ROADMAP.md`
10. `docs/09-APPLE-PLATFORM-COMPLIANCE.md` for Apple work
11. `docs/10-CODEX-MASTER-BUILD-PROMPT.md`
12. `docs/11-DOCUMENT-CONTROL-AND-READINESS-MATRIX.md`
13. `docs/12-INDIVIDUAL-INVESTOR-PRODUCT-REALIGNMENT.md`
14. Every prerequisite specification named by the current numbered specification
15. The complete current numbered specification

Document 12 is a binding amendment across the entire product. BRIX is individual-investor-first. `workspace_id` remains the tenancy and security boundary, but enterprise collaboration, workforce administration, custom role systems, and organization-heavy UX must not displace the investor Deal workflow unless explicitly approved.

## Non-Authoritative Historical Material

Unless a numbered governing document explicitly says otherwise, the following are historical or reference material only:

- `docs/constitution/**`
- unnumbered BRIX corpus documents
- prior recovery plans and release plans
- prior audits and training notes
- competitive-analysis snapshots
- old KPI/metric target documents
- provider setup or migration logs
- implementation evidence reports from earlier dates

These files may contain useful history, product rationale, formulas, provider notes, or implementation evidence, but they may not override the numbered governing package or current numbered specifications.

Do not revive a historical object model, workflow, financial threshold, provider assumption, module boundary, or roadmap simply because it appears in an older file.

## Canonical Product Laws

1. One canonical Workspace boundary.
2. One canonical Property identity.
3. One canonical Deal lifecycle.
4. One canonical Evidence model with immutable originals.
5. One canonical task/deadline system and one canonical timeline.
6. One deterministic, versioned, backend-owned underwriting engine.
7. One versioned strategy system consuming canonical underwriting results.
8. Recommendations and user Decisions are separate records.
9. AI may extract, classify, summarize, compare, explain, and propose; it may not own authoritative calculations or silently change accepted truth.
10. Facts, estimates, assumptions, inferences, AI observations, professional opinions, conflicts, unknowns, verification, confidence, and freshness must remain distinguishable.
11. No module may create a competing schema, parser, calculator, persistence path, event ledger, task system, or source of truth.
12. No client may infer successful canonical persistence from local UI state.
13. No stale or failed output may be presented as current.
14. Prior valid results must remain available during recalculation or provider failure.
15. Every material mutation must be authorized server-side, auditable, version-aware, and idempotent where retried.
16. Every asynchronous workflow must expose durable state and recovery.
17. Web, iPhone, iPad, reports, exports, shared views, and admin must reconcile to the same canonical records and calculations.
18. Every visible production control must work end to end or remain unavailable behind an explicit feature flag.
19. Premium design must improve comprehension and trust; it may not hide state, weaken accessibility, or substitute decoration for product substance.
20. A feature is not complete until it saves, reopens, refreshes/relaunches safely, handles failure/retry/conflict/stale state, and passes required tests.

## Production Execution Rule

Before coding, identify the complete path:

`User action → client validation → server authorization → canonical persistence → domain logic → canonical result → event/audit → connected module updates → user feedback → save/reopen → retry/recovery verification`

Do not begin implementation if canonical ownership, calculation ownership, dependencies, state behavior, or failure recovery are unclear.

Existing application code is reference material unless explicitly accepted by the current implementation slice. Preserve stable working behavior outside scope, but do not preserve architectural debt merely because it exists.

## Current Sequence and Retrofit Gate

Follow the numbered roadmap in `docs/05-BUILD-ROADMAP.md` and `docs/08-IMPLEMENTATION-ROADMAP.md`.

Before beginning Specification 009, completed Specifications 001-008 must receive a contained retroactive alignment audit against the final governing package. The audit must verify canonical ownership, individual-investor scope, deterministic calculation authority, source/evidence classification, event/audit behavior, stale/failure handling, and cross-module reconciliation. Repair only proven drift; do not rewrite stable compliant behavior.

No dependent specification may proceed while a material prerequisite is `NOT COMPLETE`.

## Confirmed Stack

- Web: React, TypeScript, Vite.
- Backend: Supabase Auth, Postgres, Storage, Row Level Security, and Edge Functions.
- Native: Swift/SwiftUI iPhone and iPad application under `ios/BRIXRealEstateiOS`.
- Web deployment: Vercel.
- Repository migrations and functions are the source-controlled backend definition.

Do not assume historical package-manager, runtime, provider, environment, or deployment notes remain current. Inspect the repository and execution environment before running commands.

## Required Verification

Use repository-declared scripts and verified executables. At minimum, run every applicable check for the slice:

- install/dependency integrity
- typecheck
- lint
- unit tests
- contract tests
- integration tests
- RLS/authorization tests
- migration validation
- production build
- targeted end-to-end tests
- accessibility checks
- provider-failure and retry tests where applicable
- iOS build/device checks when Apple work is in scope and a Mac environment is available

Never fabricate a successful command, migration, deployment, remote verification, commit, or push.

## Completion Rule

A slice may be reported `COMPLETE` only when:

- the intended real user outcome works end to end;
- canonical ownership is preserved;
- required security and RLS behavior passes;
- save and reopen are verified;
- applicable loading, empty, partial, stale, offline, conflict, permission, failure, retry, and recovery states work;
- connected modules reconcile;
- authoritative calculations reconcile to deterministic fixtures where applicable;
- required tests and production build pass;
- repository changes are committed and pushed when the execution task requires it;
- required Supabase changes are applied and verified when applicable;
- no material TODO, placeholder, fake success, dead control, hidden limitation, or unresolved dependency remains.

Otherwise report `NOT COMPLETE` with the exact unresolved gate.