# BRIX Real Estate — Document Control and Readiness Matrix

## 1. Purpose

This file records the authoritative BRIX build package, document ownership, implementation sequence, legacy-document status, and final quality controls.

It exists to prevent duplicate specifications, numbering drift, competing architecture, accidental use of historical files, and premature implementation.

This matrix does not replace an owning document or specification. It confirms which files are authoritative and how conflicts are resolved.

## 2. Governing Documents

| Order | File | Authority |
|---|---|---|
| 00 | `docs/00-START-HERE.md` | Highest build and execution authority |
| 01 | `docs/01-PRODUCT-CONSTITUTION.md` | Product identity, investor outcome, trust model |
| 02 | `docs/02-ENGINEERING-STANDARDS.md` | Engineering, security, reliability, testing standards |
| 03 | `docs/03-DATA-ARCHITECTURE.md` | Canonical records, ownership, persistence, RLS, events, audit |
| 04 | `docs/04-UI-UX-SYSTEM.md` | Product-wide interaction, responsive, accessibility, state standards |
| 05 | `docs/05-BUILD-ROADMAP.md` | Required subsystem sequence and stage gates |
| 06 | `docs/06-SYSTEM-ARCHITECTURE.md` | Service boundaries, data flow, events, background processing |
| 07 | `docs/07-UI-DESIGN-SYSTEM.md` | Premium visual language, components, device behavior |
| 08 | `docs/08-IMPLEMENTATION-ROADMAP.md` | Execution sequence, migrations, milestones, release gates |
| 09 | `docs/09-APPLE-PLATFORM-COMPLIANCE.md` | Binding Apple/Xcode/TestFlight/App Store requirements |
| 10 | `docs/10-CODEX-MASTER-BUILD-PROMPT.md` | Codex implementation discipline and reporting |
| 11 | `docs/11-DOCUMENT-CONTROL-AND-READINESS-MATRIX.md` | Package control and authority verification |
| 12 | `docs/12-INDIVIDUAL-INVESTOR-PRODUCT-REALIGNMENT.md` | Binding individual-investor scope amendment |

Document 12 applies across every governing file and numbered specification. It preserves the canonical tenancy/security model while making the individual investor the primary product model. Collaboration is optional and secondary.

## 3. Authority Precedence

When current governing documents appear to conflict, use:

`00 START HERE → Product Constitution → Engineering Standards → Data Architecture → UI/UX System → System Architecture → numbered owning specification → implementation roadmap → existing code`

Document 12 controls where older language can reasonably be read as requiring enterprise collaboration, workforce administration, organization-heavy UX, or security complexity beyond the needs of the individual-investor Deal workflow.

Existing code never becomes authoritative merely because it exists.

## 4. Authoritative Specifications

| No. | File | Owning outcome |
|---|---|---|
| 001 | `specs/001-authentication-and-workspaces.md` | Identity, sessions, personal workspace tenancy, optional light access, isolation |
| 002 | `specs/002-dashboard-and-application-shell.md` | Product shell, navigation, dashboard, global context |
| 003 | `specs/003-deals-and-pdrm-core.md` | Canonical Property, Deal, relationships, lifecycle, timeline |
| 004 | `specs/004-property-intake-and-source-tracking.md` | Address, listing, manual, URL, file, email, provider intake |
| 005 | `specs/005-deterministic-underwriting-engine.md` | Canonical financial calculations, snapshots, scenarios, fixtures |
| 006 | `specs/006-strategy-intelligence-engine.md` | Strategy registry, compatibility, ranking, explanation |
| 007 | `specs/007-decision-cockpit.md` | Central decision workspace, recommendation, risk, next action |
| 008 | `specs/008-marketiq-and-location-intelligence.md` | Market, location, liquidity, growth, risk, public context |
| 009 | `specs/009-financeiq-and-capital-structure.md` | Debt, equity, lender terms, schedules, feasibility |
| 010 | `specs/010-governanceiq-associations-and-restrictions.md` | HOA/COA/POA governance, restrictions, financial health |
| 011 | `specs/011-contractiq-and-real-estate-document-intelligence.md` | Contract intake, extraction, conflicts, deadlines, questions |
| 012 | `specs/012-offeriq-and-negotiation-management.md` | Maximum offer, offer structures, counters, negotiation history |
| 013 | `specs/013-photoiq-and-visual-evidence.md` | Visual Evidence, observations, corrections, repair proposals |
| 014 | `specs/014-visitiq-maps-routes-and-voice-notes.md` | Routes, visits, field capture, maps, voice, offline |
| 015 | `specs/015-inspectioniq-and-appraisaliq.md` | Inspection/appraisal intelligence and controlled proposals |
| 016 | `specs/016-evidence-email-files-and-audit.md` | Immutable Evidence, email, files, provenance, retention, audit |
| 017 | `specs/017-reportiq-sharing-and-portfolio-comparison.md` | Reports, exports, artifact sharing, portfolio comparison |
| 018 | `specs/018-relearniq.md` | Guided investor education and explainability |
| 019 | `specs/019-admin-billing-usage-and-operations.md` | Individual-first plans, billing, entitlements, metering, support |
| 020 | `specs/020-native-iphone-and-ipad-production.md` | Native iPhone/iPad field experience, offline, release |
| 021 | `specs/021-ai-orchestration-safety-and-explainability.md` | Shared AI gateway, retrieval, safety, approvals, provenance |
| 022 | `specs/022-notifications-tasks-and-deadlines.md` | Canonical tasks, deadlines, reminders, delivery, calendar |
| 023 | `specs/023-landing-help-and-conversion.md` | Public experience, help, pricing, trust, signup, conversion |
| 024 | `specs/024-testing-observability-and-release-readiness.md` | Final production quality, monitoring, recovery, release |

## 5. Legacy and Historical Document Classification

The repository contains older material that is useful for product history, implementation evidence, or research but is not current implementation authority.

### 5.1 Historical architecture and constitution material

The entire `docs/constitution/` directory is historical/reference material. It contains useful PDRM, data-model, underwriting, and product reasoning, but its incomplete 01-30 hierarchy is superseded by the current numbered top-level package and Specs 001-024.

No implementation task may treat a `docs/constitution/` file as controlling when it conflicts with the current governing package.

### 5.2 Historical corpuses and amendments

Unnumbered corpus and amendment documents such as older FindIQ, PipelineIQ, OfferIQ, PortfolioIQ, AI, provider, and core-data-model corpuses are reference material only.

They may not revive older object models such as Organization → Acquisition Profile → Opportunity → DealIQ Record → Pipeline Record → Asset when that conflicts with the current canonical Property/Deal/Evidence architecture.

### 5.3 Dated plans, audits, training, and evidence

Recovery baselines, release plans, full-app audits, deal-creation audits, production checklists, training notes, Supabase rebuild/setup logs, and similar dated documents are implementation history/evidence.

They may describe conditions that were true at the date written. They do not override current architecture or current repository state.

### 5.4 Competitive and KPI documents

Competitive-analysis and metric/KPI documents are historical research unless revalidated.

Old product pricing, competitor capability claims, provider availability, and universal investment targets must not be treated as current facts or hard product rules.

Examples such as a universal cap-rate target, cash-on-cash target, DSCR target, or composite deal-score action threshold may be educational examples only unless the current owning specification or explicit investor objective defines them.

## 6. Active Supplements

A non-numbered supplement may remain active only when a current governing document or numbered specification explicitly incorporates it and it does not create competing ownership.

`docs/08a-contractiq-report-build-sequence.md` is an active ContractIQ sequencing supplement because it is explicitly subordinate to Specifications 011/011a/017 and does not replace the master roadmap.

Any future supplement must state its authority, owner, scope, and supersession behavior.

## 7. Canonical Production Alignment Rules

Every current and future implementation must preserve:

1. one canonical Workspace boundary;
2. one canonical Property identity;
3. one canonical Deal lifecycle;
4. one canonical Evidence model with immutable originals;
5. one canonical task/deadline system and one canonical timeline;
6. one canonical event/audit path;
7. one deterministic authoritative underwriting engine;
8. one versioned strategy system consuming canonical underwriting results;
9. separate Recommendation and user Decision records;
10. projection/read-model behavior for Cockpit, dashboard, reports, and portfolio summaries;
11. explicit fact/estimate/assumption/inference/conflict/unknown classification;
12. explicit freshness, verification, confidence, version, and source behavior where material;
13. prior-valid-result preservation on recalculation or provider failure;
14. server-side authorization, RLS, idempotency, and audit;
15. web/iPhone/iPad/report/export reconciliation;
16. individual-investor-first scope and UX.

## 8. Retrofit Gate for Completed Specifications 001-008

Because Specs 001-008 were implemented across multiple documentation generations, they must receive one contained retroactive alignment audit before Spec 009 begins.

For each completed specification, verify:

- canonical ownership and IDs;
- individual-investor-first product behavior;
- no historical object model or enterprise workflow competes with the current architecture;
- deterministic calculation authority and no duplicate authoritative math;
- correct Evidence/provenance/classification behavior;
- events, audit, retries, and idempotency;
- stale/failure/recovery behavior;
- prior valid output preservation;
- cross-module projection boundaries;
- regression coverage and current test health.

Repair only proven drift. Stable compliant behavior must not be rewritten merely for style.

Spec 009 is blocked only by material unresolved prerequisite defects, not by cosmetic historical differences.

## 9. Change-Control Rules

Any change to a governing document or specification must:

1. preserve the authoritative numbered path unless an approved migration updates all references atomically;
2. identify the owning document and avoid duplicating another subsystem's authority;
3. update affected prerequisites;
4. update affected entities, events, state transitions, UI behavior, tests, validation, and Definition of Done;
5. review downstream modules for stale contracts;
6. review web, iPhone, iPad, reports, sharing, search, AI, tasks, notifications, admin, audit, and release effects;
7. record why the change was needed;
8. never delete a requirement merely because implementation is difficult;
9. never add functionality to a completed specification without checking ownership and roadmap boundaries;
10. apply Document 12 before adding collaboration, member administration, enterprise identity, or organization-heavy scope;
11. defer only genuinely platform-specific verification that the current environment cannot run.

## 10. Codex Entry Point

Codex begins with `AGENTS.md` and `docs/00-START-HERE.md`, then follows the complete governing reading order above.

No implementation task may use this matrix as a substitute for reading the current owning specification.

## 11. Documentation Readiness Gate

The BRIX documentation package is implementation-ready when:

- all governing files exist on the default branch;
- no duplicate authoritative number exists;
- no owning subsystem conflicts with another;
- governing reading order is current;
- every implementation task names its owning specification;
- individual-investor scope is applied;
- Apple tasks include Document 09;
- legacy files cannot override the current package;
- every task uses the Codex start/completion discipline;
- material ambiguity is repaired before code is written.

## 12. Production Readiness Is Separate

Documentation readiness does not prove the application is production-ready.

Production readiness requires implemented and verified workflows, deterministic reconciliation, RLS/security, recovery behavior, accessibility, observability, deployment/rollback evidence, Spec 024 release evidence, and Apple release gates for native clients.

**DOCUMENT PACKAGE STATUS: ALIGNED FOR INDIVIDUAL-INVESTOR PRODUCTION IMPLEMENTATION**