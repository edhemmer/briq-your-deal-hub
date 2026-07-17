# BRIX Real Estate — Production Build Roadmap

## 1. Authority and Rules of Engagement

This roadmap controls implementation order. It is governed by:

- `docs/00-START-HERE.md`
- `docs/01-PRODUCT-CONSTITUTION.md`
- `docs/02-ENGINEERING-STANDARDS.md`
- `docs/03-DATA-ARCHITECTURE.md`
- `docs/04-UI-UX-SYSTEM.md`

Permanent roadmap rules:

1. Build vertical, usable slices rather than disconnected horizontal layers.
2. Complete and verify each specification before beginning a dependent specification.
3. Reuse canonical records, services, contracts, components, tasks, evidence, timeline, and calculations.
4. No chapter is complete when only UI, schema, or mock logic exists.
5. Every completed slice must save, reopen, recover, integrate, and deploy.
6. Incomplete capabilities remain hidden behind explicit feature flags.
7. Later work may introduce shared infrastructure earlier only when required, documented, tested, and not presented as completion of the later capability.
8. No implementation may weaken the product, engineering, data, UI/UX, security, or verification standards.
9. Every chapter starts with its Rules of Engagement and ends with Verification, Validation, Integration, and Definition of Done.
10. The build may not advance when a material dependency is `NOT COMPLETE`.

## 2. Build Strategy

BRIX is rebuilt inside the existing repository while retaining approved infrastructure such as GitHub, Supabase, Vercel, domains, secrets, and Apple project configuration.

Existing application code is reference material unless explicitly accepted during implementation. The rebuild must not inherit architectural debt by default.

Each build slice must produce a working, testable user outcome across the applicable clients and connected systems.

## 3. Stage Gates

Every specification moves through:

1. **Specified** — implementation contract is complete and internally consistent.
2. **Ready** — dependencies, schemas, contracts, design, tests, and environments are prepared.
3. **In Progress** — implementation is actively scoped.
4. **Implemented** — code path exists end to end.
5. **Verified** — tests and manual checks pass.
6. **Integrated** — connected modules and clients reconcile.
7. **Release Ready** — security, performance, accessibility, observability, and deployment gates pass.
8. **Complete** — evidence is recorded and no material limitation is hidden.

A specification may not skip directly from Specified to Complete.

## 4. Required Build Sequence

### Foundation documents

- `docs/00-START-HERE.md`
- `docs/01-PRODUCT-CONSTITUTION.md`
- `docs/02-ENGINEERING-STANDARDS.md`
- `docs/03-DATA-ARCHITECTURE.md`
- `docs/04-UI-UX-SYSTEM.md`
- `docs/05-BUILD-ROADMAP.md`

### Implementation specifications

1. `specs/001-authentication-and-workspaces.md`
2. `specs/002-dashboard-and-application-shell.md`
3. `specs/003-deals-and-pdrm-core.md`
4. `specs/004-property-intake-and-source-tracking.md`
5. `specs/005-deterministic-underwriting-engine.md`
6. `specs/006-strategy-intelligence-engine.md`
7. `specs/007-decision-cockpit.md`
8. `specs/008-marketiq-and-location-intelligence.md`
9. `specs/009-financeiq-and-capital-structure.md`
10. `specs/010-governanceiq-associations-and-restrictions.md`
11. `specs/011-contractiq-and-real-estate-document-intelligence.md`
12. `specs/012-offeriq-and-negotiation-management.md`
13. `specs/013-photoiq-and-visual-evidence.md`
14. `specs/014-visitiq-maps-routes-and-voice-notes.md`
15. `specs/015-inspectioniq-and-appraisaliq.md`
16. `specs/016-evidence-email-files-and-audit.md`
17. `specs/017-reportiq-sharing-and-portfolio-comparison.md`
18. `specs/018-relearniq.md`
19. `specs/019-admin-billing-usage-and-operations.md`
20. `specs/020-native-iphone-and-ipad-production.md`
21. `specs/021-ai-orchestration-safety-and-explainability.md`
22. `specs/022-notifications-tasks-and-deadlines.md`
23. `specs/023-landing-help-and-conversion.md`
24. `specs/024-testing-observability-and-release-readiness.md`

The exact later filenames may be refined before creation, but numbering, ownership, and dependencies must remain explicit and non-duplicative.

## 5. Phase 1 — Secure Product Foundation

### 001 Authentication and Workspaces

Delivers:

- Complete account lifecycle
- Session handling
- Workspace creation and membership
- Invitations and roles
- RLS and storage isolation
- Native deep links and Keychain storage
- Account deletion

Gate: A user can securely create an account, create/join a workspace, sign in/out, reset a password, lose access when revoked, and delete the account according to policy.

### 002 Dashboard and Application Shell

Delivers:

- Premium responsive web shell
- Native iPhone and iPad shells
- Global navigation and search
- Deal context preservation
- Notifications and background-job surfaces
- Guided/professional mode foundation

Gate: All shell navigation, permissions, deep links, loading states, and device layouts work without dead destinations.

### 003 Deals and PDRM Core

Delivers:

- Canonical Property and Deal records
- Lifecycle and stage transitions
- Contacts and relationships
- Tasks, deadlines, timeline, notes, and activity
- Archive, restore, and deletion behavior
- Search and filtering

Gate: A Deal can be created, saved, reopened, updated, searched, archived, restored, and connected to canonical workflow records.

## 6. Phase 2 — Opportunity Intake and Core Analysis

### 004 Property Intake and Source Tracking

Delivers address, listing URL, manual, file/email, share-extension, and package intake with duplicate detection, source classification, conflicts, and preliminary assumptions.

Gate: Intake remains usable when providers fail and never presents estimates as confirmed facts.

### 005 Deterministic Underwriting Engine

Delivers immutable snapshots, versioned formulas, property-type models, scenarios, validation, and authoritative results.

Gate: Golden fixtures reconcile independently and all clients/exports use the same result.

### 006 Strategy Intelligence Engine

Delivers versioned strategy registry, compatibility, disqualifiers, scoring, ranking, confidence, and explanation.

Gate: Ranking is deterministic, hard disqualifiers cannot be hidden, and new evidence causes targeted re-evaluation.

### 007 Decision Cockpit

Delivers the central Deal decision workspace with recommendation, financials, risk, confidence, missing inputs, deadlines, changes, and evidence links.

Gate: A user can understand the current Deal position and next action without navigating through every module.

## 7. Phase 3 — External Context and Transaction Structure

### 008 MarketIQ

Delivers source-linked market, location, convenience, growth, liquidity, hazard, infrastructure, tax, and local-risk context.

Gate: Conclusions disclose geography, timeframe, source, method, confidence, and staleness.

### 009 FinanceIQ

Delivers simple and complex capital structures, debt/equity tranches, lender conditions, feasibility, comparison, and canonical calculation integration.

Gate: Debt schedules and outputs reconcile; financing changes trigger versioned re-underwriting.

### 010 GovernanceIQ

Delivers HOA/COA/POA and private-governance document analysis, restrictions, financial health, parking/trailer, leasing, renovation, insurance, and strategy impact.

Gate: Findings link to source sections and restrictions affect strategy compatibility without becoming legal conclusions.

### 011 ContractIQ

Delivers document intake, source-linked extraction, perspectives, conflicts, deadlines, questions, and explicit accepted changes.

Gate: Originals remain intact, deadlines are deterministic, and no extraction silently mutates the Deal.

## 8. Phase 4 — Offer, Field, and Due Diligence

### 012 OfferIQ

Delivers maximum-offer logic, offer structures, revisions, counters, status, negotiation history, deadlines, and professional-review outputs.

### 013 PhotoIQ

Delivers organized visual evidence, pixel-based observations, confidence, correction, and accepted repair/condition proposals.

### 014 VisitIQ

Delivers maps, multi-property routes, field checklists, offline capture, photos, video, voice, transcription, and visit summaries.

### 015 InspectionIQ and AppraisalIQ

Delivers source-linked professional report intake and controlled proposals into assumptions, risk, value, financing, and recommendation.

Each gate requires offline/retry behavior where applicable, explicit user acceptance before changing canonical assumptions, and before/after recommendation history.

## 9. Phase 5 — Evidence, Reporting, Education, and Portfolio

### 016 Evidence, Email, Files, and Audit

Completes the durable evidence platform, email ingestion, immutable originals, extraction history, conflicts, retention, and audit trail.

### 017 ReportIQ, Sharing, and Portfolio Comparison

Delivers canonical PDF, spreadsheet, CSV, Word where required, secure share links, property comparison, and portfolio pipeline.

### 018 RELearnIQ

Delivers contextual education for strategies, calculations, risks, financing, due diligence, and professional questions.

Gates require canonical reconciliation, source/version disclosure, accessible outputs, and secure sharing.

## 10. Phase 6 — Platform Operations and Native Production

### 019 Admin, Billing, Usage, and Operations

Delivers authorized user/workspace support, plans, entitlements, limits, usage, cost exposure, background-job operations, support notes, and audits.

### 020 Native iPhone and iPad Production

Hardens native clients for camera, voice, files, maps, background upload, offline sync, accessibility, privacy, TestFlight, and App Store review.

### 021 AI Orchestration

Delivers provider routing, workflow/prompt versioning, evidence linkage, safety, cost metering, prompt-injection resistance, and manual fallback.

### 022 Notifications, Tasks, and Deadlines

Completes multi-channel, idempotent, deep-linked, timezone-aware workflow notification behavior.

## 11. Phase 7 — Public Experience and Release

### 023 Landing, Help, and Conversion

Delivers accurate public positioning, product examples, pricing, security, help, legal pages, and signup flow without unsupported claims.

### 024 Testing, Observability, and Release Readiness

Completes critical E2E coverage, monitoring, alerts, backup/restore, incident response, performance, security, privacy, deployment, rollback, and App Store release evidence.

## 12. Vertical Slice Requirements

Each implementation task must include the complete path:

`User action → client validation → authorization → persistence → domain logic → canonical result → event/audit → connected updates → user feedback → save/reopen → recovery`

The task is incomplete if any required link is missing.

## 13. Dependency Rules

- Authentication and workspace security precede workspace data.
- Canonical Deal and Property precede all Deal modules.
- Intake precedes authoritative underwriting.
- Underwriting precedes strategy ranking.
- Strategy and underwriting precede Decision Cockpit completion.
- Evidence and versioning patterns apply from the first module, even before the dedicated evidence-hardening phase.
- FinanceIQ, GovernanceIQ, and ContractIQ must integrate with accepted facts and controlled recalculation.
- OfferIQ depends on current underwriting, strategy, market, financing, governance, and contract context.
- Reports may not create independent calculations.
- Native clients consume the same contracts and backend as web.

## 14. Chapter Start Gate

Before implementation, record:

- Governing files read
- Exact scope and user outcome
- Existing implementation accepted or rejected
- Canonical ownership
- Dependencies
- Complete UX and data flow
- States and failure recovery
- Files/migrations/functions expected to change
- Tests required
- Cross-module effects
- Rollback or containment plan

## 15. Chapter Completion Gate

Before marking complete, verify:

- Happy path
- Loading, empty, partial, stale, offline, conflict, permission, retry, and failure states
- Save and reopen
- Idempotency
- RLS and authorization
- Background-job durability
- Cross-module event flow
- Web/iPhone/iPad consistency
- Report/export consistency
- Accessibility
- Performance
- Production build
- Exact test commands/results
- No unrelated changes

## 16. Release Milestones

### Internal Alpha

- Foundation through Decision Cockpit works end to end.
- Golden calculations pass.
- Core security and RLS pass.
- No fake production states.

### Private Beta

- Market, finance, governance, contract, offer, field, and due-diligence flows work.
- Reports and portfolio comparison reconcile.
- Native field workflows are reliable.
- Monitoring and support are active.

### Production Release

- Critical E2E journey passes on all supported clients.
- P0/P1 defects are closed.
- Privacy and App Store requirements pass.
- Backups and restore are tested.
- Billing/entitlements and cost controls work.
- Deployment and rollback are proven.
- No visible incomplete capability remains.

## 17. Verification and Validation

### Sequence verification

- Every current specification exists once, uses the approved filename, and references only authoritative dependencies.
- No duplicate, premature, or superseded specification remains active.
- Later work has not bypassed an incomplete dependency.

### Slice verification

- Each completed slice produces a real user outcome.
- Data persists and reopens.
- Connected modules update through canonical events.
- Failures preserve user work and valid prior results.
- No stale result is presented as current.

### Cross-client verification

- The same Deal can be continued on web, iPhone, and iPad.
- Reports, exports, shared views, and admin reconcile to the canonical Deal.
- Deep links and notifications open the correct context.

### Production-readiness verification

- Security, RLS, accessibility, performance, observability, background jobs, backup/restore, deployment, and rollback requirements are met at each relevant milestone.

**DOCUMENT STATUS: REVIEWED AND REPAIRED**
