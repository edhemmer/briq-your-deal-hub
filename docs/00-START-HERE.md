# BRIX Real Estate — Start Here

## 1. Purpose and Authority

This repository is the authoritative build package for BRIX Real Estate as a production real estate investment operating system.

BRIX is an ultra-premium Property Deal Relationship Management platform, or PDRM, built for the individual investor first. It carries one canonical Deal from property discovery through intake, underwriting, strategy selection, market research, financing, governance, visits, offers, contracts, due diligence, closing, ownership, operation, refinance, disposition, and archive.

The product must become the investor's dependable daily decision workspace. A user must be able to understand what BRIX knows, where it came from, what is assumed or estimated, what is stale or conflicting, what changed, what must be verified, how the numbers were calculated, and what action comes next without maintaining a second shadow underwriting tool.

This file is the highest build and execution authority. When a later document is unclear, this file and the Product Constitution control unless a formally approved binding amendment states otherwise.

## 2. Governing Package and Reading Order

Before any material implementation work, read and obey these files in order:

1. `docs/00-START-HERE.md`
2. `docs/01-PRODUCT-CONSTITUTION.md`
3. `docs/02-ENGINEERING-STANDARDS.md`
4. `docs/03-DATA-ARCHITECTURE.md`
5. `docs/04-UI-UX-SYSTEM.md`
6. `docs/05-BUILD-ROADMAP.md`
7. `docs/06-SYSTEM-ARCHITECTURE.md`
8. `docs/07-UI-DESIGN-SYSTEM.md`
9. `docs/08-IMPLEMENTATION-ROADMAP.md`
10. `docs/09-APPLE-PLATFORM-COMPLIANCE.md` for every Apple, iPhone, iPad, Xcode, TestFlight, or App Store task
11. `docs/10-CODEX-MASTER-BUILD-PROMPT.md`
12. `docs/11-DOCUMENT-CONTROL-AND-READINESS-MATRIX.md`
13. `docs/12-INDIVIDUAL-INVESTOR-PRODUCT-REALIGNMENT.md`
14. Every prerequisite specification named by the current subsystem specification
15. The complete current numbered subsystem specification

Document 12 is a binding amendment across the full package. The ordinary BRIX experience is for one investor with one unobtrusive personal workspace. Collaboration is optional and secondary. The workspace remains the tenancy, billing, and security boundary; it must not turn BRIX into enterprise workforce software.

When documents conflict, use this order:

`00 START HERE → Product Constitution → Engineering Standards → Data Architecture → UI/UX System → System Architecture → numbered owning specification → implementation roadmap → existing code`

Document 12 controls where older language can reasonably be interpreted as requiring enterprise collaboration, workforce administration, organization-heavy UX, or security complexity that does not materially improve the individual-investor Deal workflow.

## 3. Historical and Reference Documents

The repository contains valuable historical material from earlier product phases. Unless a numbered governing document explicitly says otherwise, the following are reference material only and are not implementation authority:

- `docs/constitution/**`
- unnumbered product corpuses and amendments
- prior release plans, recovery baselines, audit reports, training notes, and production checklists
- prior competitive-analysis and KPI/metric documents
- provider setup, migration, and rebuild logs
- dated implementation evidence and troubleshooting reports

Historical files may explain why a decision was made or preserve useful implementation evidence, but they may not revive a superseded object model, module boundary, provider assumption, pricing claim, roadmap, fixed investment threshold, or authority hierarchy.

The current numbered package and current numbered specifications always control implementation.

## 4. Non-Negotiable Product Outcome

BRIX must deliver all of the following as one connected product:

1. Premium responsive web plus intentional native iPhone and iPad experiences.
2. One canonical Workspace, Property, Deal, Evidence, task, deadline, financial, strategy, recommendation, decision, timeline, and audit model.
3. Deterministic, versioned, independently testable authoritative financial calculations.
4. Source-linked facts, estimates, assumptions, inferences, AI observations, professional opinions, conflicts, confidence, verification, freshness, and history.
5. A Decision Cockpit that makes the current Deal position, risks, returns, missing information, recommendation, and next action understandable without searching through disconnected modules.
6. Reliable save, reopen, refresh, relaunch, synchronization, offline behavior where applicable, conflict handling, retry, recovery, and audit history.
7. Premium charts, maps, comparisons, reports, tables, and graphics that clarify decisions rather than decorate screens.
8. No webpage-like native experience, clipped layouts, hidden controls, dead ends, stale state presented as current, mock success, or disconnected modules.
9. No unsupported promise of certainty. BRIX earns trust through provenance, deterministic calculations, explicit limitations, professional-review triggers, and visible uncertainty.
10. A repeatable investor workflow that becomes more dependable as Evidence and historical Deal outcomes accumulate.

## 5. Canonical Architecture Laws

These rules apply to every document, specification, migration, service, client, report, AI workflow, and implementation task.

1. Use one canonical Deal and one canonical Property identity.
2. Use one canonical workspace boundary for tenancy and authorization.
3. Use one canonical Evidence model with immutable originals and versioned derived findings.
4. Use one canonical task/deadline system, timeline, event ledger, and audit model.
5. Use one deterministic underwriting engine as the authoritative financial calculator.
6. Strategy Intelligence consumes canonical underwriting results; it does not reproduce financial math.
7. Recommendations and user Decisions are separate, versioned records.
8. No module may create duplicate schemas, parsers, calculators, persistence paths, task systems, event systems, or private sources of truth.
9. No client may own authoritative permissions, lifecycle state, accepted facts, deadlines, or financial calculations.
10. AI may extract, classify, summarize, compare, explain, draft, prioritize, and propose. It may not silently establish canonical truth, own authoritative calculations, or issue final legal, lending, appraisal, inspection, tax, insurance, engineering, securities, or other professional conclusions.
11. Every material value must preserve classification, provenance, effective date, freshness, confidence or verification where applicable, version, and conflict state.
12. Missing, estimated, stale, inferred, conflicted, or unverified information may never be silently converted into confirmed fact.
13. Every material mutation must be authorized server-side, auditable, version-aware, and idempotent where retried.
14. Every asynchronous operation must expose durable state such as queued, processing, partial, complete, failed, blocked, stale, conflicted, offline, or retrying.
15. Prior valid results remain inspectable during recalculation, provider failure, or regeneration and must never be silently erased.
16. Web, iPhone, iPad, reports, exports, shared views, and admin consume the same canonical records and calculation outputs.
17. No module may become a feature island. Inputs, outputs, events, Evidence, tasks, deadlines, reports, notifications, timeline effects, and Decision Cockpit effects must be explicit.
18. Premium design may not weaken accessibility, information density, performance, clarity, or reliability.
19. No visible production control may be decorative, dead, fake, or backed only by placeholder behavior.
20. No release may require the user to maintain a second trusted spreadsheet, calculator, or shadow workflow because BRIX fails to reconcile.

## 6. Individual-Investor Product Rule

BRIX is built for an individual real estate investor first.

The default account experience is:

1. one user account;
2. one automatically created personal workspace;
3. one investor controlling the Deal lifecycle;
4. optional light access for a spouse, investment partner, or trusted professional only when intentionally used;
5. artifact-first secure sharing when a full collaborator account is unnecessary.

Do not prioritize enterprise identity, workforce administration, departments, team dashboards, presence, internal chat, bulk member management, custom role builders, or organization-heavy billing unless separately approved and justified by a real product need.

Baseline production security, RLS, account recovery, deletion, auditability, privacy, and Apple requirements are never optional.

## 7. Document and Specification Quality Standard

Every governing document and subsystem specification must be complete enough that Codex or a senior engineer can implement it without inventing product behavior or architecture.

Every subsystem specification must include, where applicable:

- authority and prerequisites;
- mission and user outcome;
- scope and explicit exclusions;
- canonical ownership and boundaries;
- entities, relationships, statuses, versioning, indexes, and RLS implications;
- complete user and data flow;
- domain events consumed and emitted;
- web, iPhone, and iPad behavior;
- premium UX requirements;
- loading, empty, partial, processing, stale, offline, conflict, permission, retry, failure, and recovery states;
- security, privacy, authorization, audit, and idempotency;
- performance, caching, background processing, and observability;
- cross-module inputs, outputs, tasks, deadlines, reports, notifications, and timeline effects;
- AI responsibilities and prohibitions;
- acceptance, regression, integration, security, and accessibility tests;
- validation and verification checklist;
- explicit Definition of Done.

A document that omits a material applicable section must be repaired before it is treated as implementation-complete.

## 8. Required Task Start Format

Before coding, Codex must state:

- exact user outcome;
- governing documents and specifications read;
- existing systems and files inspected;
- canonical data owner;
- canonical calculation owner;
- complete user flow;
- complete data flow;
- domain events consumed and emitted;
- cross-module connections;
- web, iPhone, and iPad behavior;
- loading, empty, partial, offline, stale, conflict, permission, retry, failure, and recovery behavior;
- freshness, cache invalidation, and synchronization behavior;
- files expected to change;
- database, storage, API, worker, background job, or Edge Function changes;
- tests required;
- security and RLS effects;
- risks of duplication, drift, stale state, data loss, misleading information, or regression.

Codex must not begin implementation until it can state the complete path:

`User action → client validation → server authorization → canonical persistence → domain logic → canonical result → domain event/audit → connected module updates → user feedback → save/reopen → retry/recovery verification`

## 9. Required Task Completion Format

At completion, Codex must report:

- files changed;
- migrations, tables, indexes, RLS, storage, APIs, functions, workers, and configuration changed;
- domain events added or changed;
- connected systems verified;
- tests added;
- exact commands run and exact results;
- verified user flow;
- verified save and reopen;
- verified refresh and relaunch where applicable;
- verified loading, empty, stale, conflict, offline, permission, failure, retry, and recovery states;
- verified web, iPhone, and iPad consistency where applicable;
- verified reports, exports, notifications, tasks, and timeline effects where applicable;
- verified RLS, authorization, audit, idempotency, and storage isolation;
- verified calculation reconciliation and source provenance where applicable;
- known limitations;
- confirmation that unrelated files were not changed;
- exact commit and remote/deployment verification when the task requires implementation delivery;
- `COMPLETE` or `NOT COMPLETE`.

Codex may not claim completion while a material workflow, connection, test, data state, recovery path, supported client, accessibility requirement, security requirement, Apple gate, or calculation reconciliation remains unverified.

## 10. Seamless Deal Flow Requirement

Every subsystem must connect through the canonical Deal and preserve one continuous investor workflow.

For each subsystem, verify:

- entry points open the correct Workspace, Deal, Property, and record;
- accepted data appears correctly in connected systems;
- accepted changes trigger only required targeted recalculation and updates;
- tasks and deadlines use the canonical task system;
- Evidence remains source-linked and inspectable;
- reports and exports use current canonical versions and disclose freshness;
- prior valid output remains visible when new processing fails;
- no duplicate, orphaned, contradictory, or hidden state is created;
- web, iPhone, iPad, reports, shared views, and admin reconcile;
- the Decision Cockpit reflects material accepted changes;
- the user can understand why a recommendation or key metric changed.

## 11. Validation and Verification Gate

### Functional

- Primary workflow works end to end with realistic data.
- Every visible control has implemented behavior.
- Create/read/update/archive/restore/delete behavior follows policy.
- Save, reopen, refresh, relaunch, and resume work where applicable.
- Duplicate submission and retry do not create duplicate records or charges.
- Errors preserve user work and provide a safe recovery path.

### Data and integration

- Canonical IDs and owners are used.
- No shadow schema, duplicate engine, or client-only source of truth exists.
- RLS and workspace isolation are enforced.
- Source, classification, confidence, effective date, freshness, and history are retained where material.
- Domain events are emitted after durable persistence and consumed idempotently.
- Connected modules, tasks, deadlines, timeline, reports, notifications, and admin state update correctly.
- No stale result is presented as current.
- No orphaned files, Evidence, tasks, calculations, or records remain.
- Financial outputs reconcile to versioned deterministic fixtures.

### UX and accessibility

- Active Deal, status, freshness, primary action, and next action are clear.
- Loading, empty, partial, stale, offline, conflict, permission, success, failure, retry, and recovery states are intentional.
- Accessibility requirements are satisfied.
- No dead end exists.
- Guided and professional experiences use the same canonical truth.
- Charts, maps, reports, and graphics improve comprehension and remain accurate and accessible.
- Native clients do not feel like compressed websites.

### Security and operations

- Authorization is server-side.
- RLS, storage isolation, secrets, and signed access are correct.
- Sensitive and administrative actions are audited.
- Logs do not expose protected content or secrets.
- Expensive operations have limits, metering, and abuse protection.
- Background jobs expose durable status, timeout, retry, and escalation behavior.
- Monitoring can determine whether the workflow is healthy.

## 12. Retrofit Alignment Gate Before Specification 009

Specifications 001 through 008 were implemented across multiple documentation generations. Before Specification 009 begins, perform a contained retroactive alignment audit against the final governing package.

The audit must verify, for each completed slice:

- canonical Workspace, Property, Deal, Evidence, task, event, audit, and calculation ownership;
- individual-investor-first UX and scope;
- no enterprise or historical object model has become a competing source of truth;
- one deterministic underwriting authority;
- no universal historical investment threshold is being treated as a hard product rule unless the current owning specification explicitly defines it;
- source classification, verification, confidence, freshness, conflict, and prior-version behavior;
- idempotent event and retry behavior;
- stale/failure handling and preservation of prior valid output;
- Decision Cockpit and downstream projections remain projections, not alternate truth stores;
- web/native/report reconciliation where implemented;
- all applicable tests still pass.

Repair only proven drift. Do not rewrite stable compliant behavior for style or preference.

Specification 009 may begin only when no material prerequisite defect remains open.

## 13. Final Completion Decision

Mark a document or implementation slice `COMPLETE` only when:

- the specification is accurate and internally consistent;
- the implementation works with every connected completed prerequisite;
- required tests pass;
- no material TODO, placeholder, disconnected state, stale-state defect, misleading result, or unverified claim remains;
- a senior engineer can continue without inventing architecture or product behavior;
- the investor can complete the intended decision workflow without relying on a second calculation or shadow system.

Otherwise mark `NOT COMPLETE`, identify the exact gap, and repair it before proceeding.