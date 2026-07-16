# BRIX Product Constitution and Engineering Standard

## Authority

This directory is the governing product and engineering authority for BRIX Real Estate.

Every implementation decision, workflow, calculation, data model, integration, interface, report, AI behavior, web experience, native iPhone experience, native iPad experience, administrative control, and production release must conform to the applicable constitution documents in this directory.

When implementation conflicts with the constitution, the constitution controls until intentionally amended.

This index is the entry point. It defines reading order, authority, implementation discipline, document status, and amendment rules. It does not duplicate the detailed requirements contained in the numbered constitution files.

---

## 0.1 Product Definition

BRIX is a Property Deal Relationship Management platform and real estate investment operating system.

Its purpose is to help investors move from property discovery to defensible decision, offer, acquisition, ownership, and exit using one canonical deal record, deterministic underwriting, evidence-linked analysis, strategy comparison, document intelligence, field workflows, and explainable recommendations.

BRIX supports beginner and experienced investors across residential, multifamily, commercial, mixed-use, land, development, and specialty real estate.

BRIX is not a prototype, listing portal, generic CRM, spreadsheet replacement, document folder, AI chatbot, or disconnected collection of modules.

---

## 0.2 Constitutional Hierarchy

The authority order is:

1. This constitution directory.
2. The specific numbered constitution document governing the affected subsystem.
3. `AGENTS.md` repository operating instructions.
4. Approved implementation plans and issue scope.
5. Existing implementation behavior.
6. Developer or AI assumptions.

When two constitution documents appear to conflict:

1. The more specific subsystem rule controls over a general rule.
2. The later-numbered document may extend an earlier document but may not silently contradict it.
3. Identity, authorization, deterministic calculation, auditability, and evidence-integrity rules may not be weakened by a subsystem document.
4. Any unresolved conflict must be documented before implementation proceeds.

---

## 0.3 Codex Operating Rule

Before making a material change, Codex must:

1. Read this index.
2. Read every constitution document directly relevant to the requested work.
3. Read `AGENTS.md` and the current implementation files for the affected flow.
4. Preserve completed systems outside the requested scope.
5. Identify the canonical source of truth before changing or creating parsers, calculations, persistence, schemas, workflows, or client behavior.
6. Use the canonical data model and deterministic engine contracts.
7. Avoid duplicate logic, shadow data models, competing calculations, isolated modules, and client-owned business rules.
8. Implement complete end-to-end behavior including UI, backend, persistence, authorization, validation, error recovery, tests, and documentation.
9. Never represent placeholders, mock data, sample records, hardcoded recommendations, dead controls, simulated success states, or incomplete workflows as production behavior.
10. Report exact files changed, checks run, results, failures, and unverified areas.

Codex must not redesign the product during implementation. Product changes require an explicit constitutional amendment or direct product-owner instruction.

---

## 0.4 Permanent Engineering Laws

The following laws apply to every BRIX subsystem:

1. One canonical Property ID represents the real-world asset.
2. One canonical Deal ID connects the investor opportunity and lifecycle.
3. One authoritative financial engine owns calculations.
4. AI may explain, extract, organize, and identify risk, but may not own authoritative math or silently establish legal, engineering, appraisal, inspection, lending, or tax conclusions.
5. Every material value must preserve source, classification, effective date, confidence, and history.
6. Confirmed facts, estimates, assumptions, inferences, AI observations, professional opinions, conflicts, and unknowns must remain distinguishable.
7. Material changes must preserve prior state and create an audit trail.
8. Web, iPhone, iPad, reports, exports, admin tools, and APIs must share canonical meanings and outputs.
9. Every private record must be authorization-protected and workspace-scoped.
10. Every visible control must work or remain unavailable until implemented.
11. Failures must be visible, user work must be preserved, and recovery must be possible.
12. Mobile is a field product, not a desktop layout reduced to a smaller screen.
13. Reports and exports are views of canonical data, not alternative sources of truth.
14. New features may not weaken stable workflows or create duplicate implementations.
15. A subsystem is complete only when a real user can execute the intended workflow, understand the result, inspect supporting evidence, save it, reopen it, and recover from expected errors.

---

## 0.5 Constitution Reading Order

### Foundation

- `01-executive-vision.md` — mission, product identity, investor promise, supported property scope, and non-negotiable outcomes.
- `02-product-philosophy.md` — truth model, evidence model, deterministic and cognitive intelligence boundaries, design laws, and product behavior.
- `03-pdrm-core.md` — canonical property, canonical deal, digital twin, relationships, evidence graph, timeline, lifecycle, decisions, tasks, and events.
- `04-canonical-data-model.md` — entities, identifiers, ownership, versioning, data contracts, isolation, migrations, and cross-client semantics.
- `05-underwriting-engine.md` — authoritative financial engine, formulas, assumptions, financing, scenarios, sensitivities, validation, explainability, and reproducibility.

### Decision and Strategy

- `06-strategy-engine.md` — strategy registry, compatibility, disqualifiers, strategy-specific requirements, ranking, and recommendations.
- `07-decision-cockpit.md` — deal cockpit, decision hierarchy, user flow, risk, confidence, next actions, and field-ready presentation.
- `08-market-intelligence.md` — public records, market, area, rent, growth, infrastructure, zoning, flood, environmental, and comparable intelligence.
- `09-finance-intelligence.md` — financing structures, lender terms, mortgage data, equity, partnerships, waterfalls, covenants, and financing feasibility.
- `10-governance-intelligence.md` — HOA, COA, POA, declarations, bylaws, rules, fees, reserves, assessments, restrictions, and governance risk.

### Transaction and Evidence Intelligence

- `11-contract-intelligence.md` — contracts, forms, addenda, amendments, buyer and seller perspectives, issue spotting, questions, suggested changes, and verification flags.
- `12-offer-intelligence.md` — offer pricing, terms, concessions, contingencies, documents, approvals, counters, and offer packages.
- `13-inspection-intelligence.md` — inspection ingestion, findings, severity, cost effects, negotiation effects, and re-underwriting.
- `14-appraisal-intelligence.md` — appraisal ingestion, valuation methods, comparables, adjustments, lender effects, and strategy changes.
- `15-photo-intelligence.md` — image ingestion, room and system classification, visible-condition observations, limitations, evidence links, and field capture.
- `16-voice-and-field-notes.md` — recording, transcription, note classification, property-visit workflow, extraction, and user confirmation.
- `17-document-and-email-ingestion.md` — PDF, Word, spreadsheet, email body, attachment, drag-and-drop, extraction, provenance, and verification.

### Investor Experience

- `18-visit-and-maps.md` — listing URLs, directions, current location, route planning, multi-property visits, visit checklists, and field safety.
- `19-relearniq.md` — investor education, strategy learning, contextual guidance, beginner progression, and professional-mode behavior.
- `20-reporting-and-exports.md` — deal reports, comparison reports, spreadsheets, CSV, Word, PDF, sharing, scorecards, and reconciliation.
- `21-portfolio-and-pipeline.md` — deal pipeline, watchlists, comparisons, portfolios, multi-asset analysis, decisions, and portfolio reporting.

### Platform and Delivery

- `22-web-experience.md` — responsive web architecture, landing page, onboarding, navigation, interactions, accessibility, and production UX.
- `23-native-ios.md` — native SwiftUI iPhone and iPad architecture, Apple compliance, authentication, offline behavior, camera, microphone, maps, and App Store readiness.
- `24-authentication-and-accounts.md` — Supabase auth, sign-up, login, password reset, sessions, profile, account deletion, roles, and recovery.
- `25-admin-billing-and-usage.md` — users, plans, limits, billing, overrides, password support, usage, API cost controls, scaling, and audit logs.
- `26-ai-and-automation.md` — model boundaries, prompts, provenance, structured output, fallback, cost controls, safety, and human confirmation.
- `27-integrations-and-data-sources.md` — county records, third-party APIs, listing ingestion, maps, storage, email, provider contracts, and degradation behavior.
- `28-security-privacy-and-compliance.md` — secrets, RLS, storage, logging, retention, deletion, privacy, incident response, and legal disclaimers.
- `29-testing-quality-and-observability.md` — unit, integration, end-to-end, regression, fixture, performance, monitoring, logging, alerts, and release gates.
- `30-production-roadmap.md` — dependency order, phased implementation, migration approach, rollout, rollback, and definition of production readiness.

A file may be added only when a distinct constitutional responsibility cannot be governed clearly by the existing documents.

---

## 0.6 Required Content Standard for Every Constitution File

A subsystem constitution is complete only when it defines all applicable items below:

1. Authority and purpose.
2. Scope and exclusions.
3. User roles and primary user outcomes.
4. End-to-end workflows.
5. Functional requirements.
6. Canonical entities and ownership.
7. Required inputs and outputs.
8. Deterministic business rules and calculations.
9. AI permissions and prohibitions.
10. Evidence, source, confidence, and verification rules.
11. Web behavior.
12. Native iPhone behavior.
13. Native iPad behavior.
14. Offline and synchronization behavior where applicable.
15. Authorization, privacy, and security requirements.
16. Error handling, retries, fallbacks, and recovery.
17. Notifications, events, and cross-system effects.
18. Reporting and export effects.
19. Administrative controls and usage considerations.
20. Accessibility and user-experience requirements.
21. Performance and scalability requirements.
22. API and integration contracts.
23. Testing requirements.
24. Acceptance criteria.
25. Definition of complete.
26. Non-negotiable rules.

Not every file must repeat generic platform rules, but it must explicitly reference the governing shared rule and define subsystem-specific behavior.

---

## 0.7 Document Status Rules

Each constitution document must end with one status:

- `DRAFT` — incomplete and not safe for implementation authority.
- `GOVERNING` — complete enough for implementation and binding unless amended.
- `SUPERSEDED` — retained for history but no longer authoritative.

A document may not be labeled `GOVERNING` when it contains unfinished sentences, placeholders, TODOs, omitted required workflows, unresolved contradictions, or knowingly incomplete acceptance criteria.

The index must list only files that exist or are explicitly marked as planned. Codex may implement only from `GOVERNING` documents unless the product owner explicitly authorizes work from a draft.

---

## 0.8 Implementation Discipline

Constitution work and application work must remain distinct:

- Constitution commits define the product and engineering contract.
- Application commits implement that contract.
- Constitution files must not be silently changed merely to justify existing code.
- Existing code must not be treated as correct merely because it exists.
- Implementation must identify and resolve competing sources of truth rather than adding another one.
- Database changes require forward migrations, verification, and rollback notes.
- Web and native iOS clients may differ in layout and interaction, but not in business meaning.
- Production workflows must use real persistence and real authorization.
- No feature may claim completion when only the UI exists.

---

## 0.9 Amendment Process

A constitutional amendment must:

1. Identify the document and rule being changed.
2. Explain the reason for the change.
3. Identify affected data, calculations, workflows, APIs, reports, web behavior, iOS behavior, tests, and migrations.
4. Preserve backward compatibility or define a migration and rollback plan.
5. Update every conflicting constitution reference.
6. Update acceptance tests and implementation documentation.
7. Be committed with an explicit constitution amendment message.

Minor grammar, formatting, link, or clarification edits that do not change product behavior do not require a formal amendment record.

---

## 0.10 Current Governing Baseline

The constitution directory must be completed in numerical order.

No new subsystem file should be treated as governing until earlier dependency documents are complete and internally consistent.

At the time this index is adopted:

- Sections 03, 04, and 05 contain substantial governing architecture and must be preserved unless a verified contradiction requires amendment.
- Sections 01 and 02 must be completed before Section 06 becomes governing.
- Section 06 and later files must be authored as complete subsystem specifications, not outlines or feature lists.
- The deleted root `BRIX.md` must not be recreated.

---

## 0.11 Definition of Complete

This index is complete when:

1. It is the sole constitution entry point referenced by `AGENTS.md`.
2. No root-level competing BRIX constitution exists.
3. Every constitution file follows the numbered naming system.
4. Every implementation task can identify its governing documents.
5. Codex is instructed to preserve canonical identity, data, financial, evidence, and authorization rules.
6. Document status and amendment rules are explicit.
7. The required content standard prevents partial chapters from being treated as complete.

**Status: GOVERNING**
