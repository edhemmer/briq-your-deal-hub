# BRIX Real Estate — Document Control and Readiness Matrix

## 1. Purpose

This file records the authoritative BRIX build package, the governing order, document ownership, implementation sequence, and final quality controls. It exists to prevent duplicate specifications, numbering drift, conflicting ownership, accidental use of historical files, and premature implementation.

This matrix does not replace any owning document or specification. It confirms the current authoritative package and defines the verification process that must be repeated whenever a governing document or numbered specification changes.

## 2. Governing Documents

| Order | File | Authority |
|---|---|---|
| 00 | `docs/00-START-HERE.md` | Highest build and execution authority |
| 01 | `docs/01-PRODUCT-CONSTITUTION.md` | Product identity, investor outcome, boundaries, trust model |
| 02 | `docs/02-ENGINEERING-STANDARDS.md` | Engineering, security, quality, testing, deployment standards |
| 03 | `docs/03-DATA-ARCHITECTURE.md` | Canonical records, ownership, persistence, RLS, events, audit |
| 04 | `docs/04-UI-UX-SYSTEM.md` | Product-wide interaction, responsive, accessibility, state standards |
| 05 | `docs/05-BUILD-ROADMAP.md` | Required subsystem sequence and stage gates |
| 06 | `docs/06-SYSTEM-ARCHITECTURE.md` | Service boundaries, data flow, events, background processing |
| 07 | `docs/07-UI-DESIGN-SYSTEM.md` | Premium visual language, components, device behavior |
| 08 | `docs/08-IMPLEMENTATION-ROADMAP.md` | Execution sequence, migrations, milestones, release gates |
| 09 | `docs/09-APPLE-PLATFORM-COMPLIANCE.md` | Binding Apple, Xcode, TestFlight, App Store, privacy, asset, device requirements |
| 10 | `docs/10-CODEX-MASTER-BUILD-PROMPT.md` | Codex implementation discipline and required reporting |
| 11 | `docs/11-DOCUMENT-CONTROL-AND-READINESS-MATRIX.md` | Package control, sequence verification, change discipline |
| 12 | `docs/12-INDIVIDUAL-INVESTOR-PRODUCT-REALIGNMENT.md` | Binding individual-investor product model and scope amendment; controls when older language implies enterprise collaboration or excessive identity/security scope |

### 2.1 Individual-investor precedence

`docs/12-INDIVIDUAL-INVESTOR-PRODUCT-REALIGNMENT.md` is an approved binding amendment across every file in `docs/` and `specs/`. It preserves the canonical data model and baseline production security while making the solo investor the primary product model. When older language can reasonably be interpreted as requiring enterprise collaboration, workforce administration, or security work that delays the Deal workflow without material benefit, Document 12 controls.

Every Codex build prompt and every implementation slice must read Document 12 before scope selection.

## 3. Authoritative Specifications

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
| 012 | `specs/012-offeriq-and-negotiation-management.md` | Maximum offer, offer structures, counters, history, negotiation |
| 013 | `specs/013-photoiq-and-visual-evidence.md` | Visual Evidence, observations, corrections, repair proposals |
| 014 | `specs/014-visitiq-maps-routes-and-voice-notes.md` | Routes, visits, field capture, maps, voice, offline |
| 015 | `specs/015-inspectioniq-and-appraisaliq.md` | Inspection and appraisal report intelligence and controlled proposals |
| 016 | `specs/016-evidence-email-files-and-audit.md` | Immutable Evidence, email, files, provenance, retention, audit |
| 017 | `specs/017-reportiq-sharing-and-portfolio-comparison.md` | Reports, exports, secure artifact sharing, portfolio comparison |
| 018 | `specs/018-relearniq.md` | Guided investor education and explainability |
| 019 | `specs/019-admin-billing-usage-and-operations.md` | Individual-first plans, billing, entitlements, metering, support, operations |
| 020 | `specs/020-native-iphone-and-ipad-production.md` | Native iPhone/iPad field experience, offline, release |
| 021 | `specs/021-ai-orchestration-safety-and-explainability.md` | Shared AI gateway, retrieval, tools, safety, approvals, provenance |
| 022 | `specs/022-notifications-tasks-and-deadlines.md` | Canonical tasks, deadlines, reminders, delivery, calendar |
| 023 | `specs/023-landing-help-and-conversion.md` | Public experience, help, pricing, trust, signup, conversion |
| 024 | `specs/024-testing-observability-and-release-readiness.md` | Final production quality, testing, monitoring, recovery, release |

## 4. Package Verification Results

The current package has been checked for the following structural requirements:

- Governing documents exist in a single numbered sequence.
- Specifications exist in a single authoritative sequence from 001 through 024.
- Previously misnumbered duplicate files are not authoritative.
- The current numbered specifications start with authority and Rules of Engagement.
- The specifications define ownership boundaries and prohibit duplicate canonical systems.
- The specifications include cross-module integration requirements.
- The specifications end with testing, validation, verification, or an explicit Definition of Done.
- Web, iPhone, and iPad behavior is governed across the package.
- Loading, stale, offline, conflict, permission, retry, failure, and recovery states are governed product-wide.
- Apple compliance is separated into a maintainable binding supplement and is required by `docs/00-START-HERE.md`.
- Codex execution discipline is centralized in `docs/10-CODEX-MASTER-BUILD-PROMPT.md`.
- The individual-investor model is binding across the entire package through Document 12.
- Collaboration is optional and subordinate to the investor Deal workflow.
- Apple-only verification may be deferred on Windows but remains required before native release.

This is documentation readiness, not evidence that the application code already satisfies the package.

## 5. Accuracy and Trust Standard

BRIX may be relied upon for investor decision support only when the implementation proves:

1. Deterministic financial results reconcile to independently verified golden fixtures.
2. Material facts and findings retain source provenance.
3. Assumptions, estimates, inferences, conflicts, confidence, verification, and freshness remain visible.
4. Reports, exports, web, iPhone, and iPad display the same canonical versioned results.
5. Missing or stale information cannot silently appear confirmed.
6. AI output is source-grounded and cannot bypass deterministic rules or approval gates.
7. Every accepted change is versioned, audited, and reflected in the Decision Cockpit.
8. Failure of an external provider cannot erase prior valid results or user work.
9. Release gates in Specification 024 pass.
10. Apple gates in `docs/09-APPLE-PLATFORM-COMPLIANCE.md` pass for native release.
11. Investor-facing Deal workflows receive priority over optional collaboration administration.

## 6. Change-Control Rules

Any change to a governing document or specification must:

1. Preserve the numbered authoritative path unless an approved migration updates all references atomically.
2. Identify the owning document and avoid duplicating another subsystem's authority.
3. Update affected prerequisite references.
4. Update affected entities, events, state transitions, UI behavior, tests, validation, and Definition of Done.
5. Review downstream modules for stale contracts.
6. Review web, iPhone, iPad, reports, sharing, search, AI, tasks, notifications, admin, audit, and release effects.
7. Record why the change was needed.
8. Never delete a requirement merely because implementation is difficult.
9. Never add functionality to a completed specification without checking the roadmap and ownership boundary.
10. Repeat the readiness checks in this file before implementation continues.
11. Apply Document 12 before adding collaboration, member administration, enterprise identity, or security scope.
12. Do not block investor-facing Windows development on Xcode-only verification; record the deferred gate and complete it before native release.

## 7. Codex Entry Point

Codex begins with:

`docs/10-CODEX-MASTER-BUILD-PROMPT.md`

Codex must then read:

`docs/12-INDIVIDUAL-INVESTOR-PRODUCT-REALIGNMENT.md`

Codex then follows the reading order and build sequence defined by `docs/00-START-HERE.md` and `docs/05-BUILD-ROADMAP.md` as amended by Document 12.

No implementation task may use this matrix as a substitute for reading the full owning specification.

## 8. Final Documentation Gate

The BRIX documentation package is ready to guide implementation when:

- All files above exist on the default branch.
- No duplicate authoritative number exists.
- No owning subsystem conflicts with another.
- Governing reading order is current.
- Every current implementation task names its owning specification.
- Every scope decision applies the individual-investor amendment.
- Apple tasks include Document 09.
- Windows tasks defer only truly Apple-specific runtime verification.
- Every task uses the Codex start and completion reports.
- Any material ambiguity is repaired before code is written.

Status of the documentation package after this control pass: `READY FOR INDIVIDUAL-INVESTOR IMPLEMENTATION`.
