# BRIX Specification 018 — RELearnIQ

## 1. Authority and Rules of Engagement

This specification is governed by `docs/00-START-HERE.md` through `docs/05-BUILD-ROADMAP.md` and Specifications 001–017.

Rules of engagement:

1. RELearnIQ is the canonical education and explainability layer for BRIX; it is not a separate course platform or a second source of business truth.
2. Guided and professional modes use the same canonical data, formulas, findings, and recommendations.
3. RELearnIQ may explain, contextualize, and teach. It may not replace authoritative calculations, canonical findings, or licensed professional advice.
4. Educational content may never silently change a Deal, Property, assumption, task, deadline, recommendation, user decision, or permission.
5. Explanations must distinguish confirmed facts, assumptions, estimates, inferences, conflicts, stale data, missing information, and professional-review requirements.
6. Every explanation of a metric, score, warning, recommendation, or maximum offer must trace to controlling inputs, source classifications, formula or rule version, and binding constraints.
7. User guidance must not block experienced users from completing work.
8. A failed content or AI service must never block the underlying BRIX workflow.
9. Accessibility is mandatory for all educational content, diagrams, media, glossaries, and interactive guidance.
10. Web, iPhone, iPad, reports, help, and shared views use the same approved terminology and explanation contracts.

## 2. Mission

Help investors understand what BRIX knows, how results were produced, what changed, what matters most, what remains uncertain, what must be verified, which professional should be consulted, and what action comes next.

## 3. Scope and Ownership

REL​earnIQ owns:

- educational content items and versions
- topic taxonomy and relationships
- explanation templates
- user learning preferences
- guided workflow progress
- bookmarks and dismissals
- feedback and content-review state
- approved examples and walkthroughs
- generated explanation jobs and provenance

REL​earnIQ does not own underwriting, strategy ranking, financing, market findings, governance, contracts, offers, inspections, appraisals, reports, tasks, evidence, or recommendations.

## 4. Supported User Modes

### Guided mode

Provides plain-language explanations, step sequencing, required versus optional distinctions, examples, common mistakes, verification prompts, professional-role guidance, and progress indicators.

Guided mode may not hide material risk, change formulas, use different authoritative outputs, or force completion of irrelevant lessons.

### Professional mode

Prioritizes speed and density while retaining on-demand tooltips, formula provenance, source/freshness detail, contextual glossary, keyboard help, and deep explanations.

### Mode switching

- Mode is a preference, not a separate data model.
- Switching modes preserves active Deal, form progress, filters, and workflow position.
- Users may override by module or session.
- The system may suggest but not silently change mode.

## 5. Canonical Content Contract

Every content item must include:

- permanent content ID and topic ID
- version and review state
- audience level
- applicable modules, fields, property types, strategies, and Deal stages
- jurisdiction scope where relevant
- professional-boundary classification
- source references where factual or regulatory context is used
- effective, superseded, and retired states

## 6. Explanation Contract

Every explainable BRIX output must support:

- title
- plain-language summary
- why it matters
- controlling inputs
- formula or rule version
- source classifications
- freshness and confidence
- binding constraints
- missing information and conflicts
- sensitivity drivers
- connected modules
- professional-review triggers
- next verification actions

## 7. Required Educational Coverage

REL​earnIQ must cover:

- BRIX core concepts: Deal, Property, Evidence, fact, assumption, estimate, inference, verification, conflict, freshness, confidence, scenario, recommendation, override, and history
- financial metrics including NOI, cap rate, cash flow, cash-on-cash return, DSCR, debt yield, LTV, LTC, IRR, NPV, equity multiple, break-even occupancy, reserves, refinance proceeds, and maximum allowable offer
- every strategy in the canonical strategy registry
- residential, multifamily, mixed-use, commercial, land, development, distressed, portfolio, and owner-user distinctions
- financing, governance, title, survey, zoning, environmental, insurance, contracts, offers, inspections, appraisals, renovation, ownership, refinance, disposition, and closing concepts
- professional roles and when to consult them

## 8. “Why Did This Change?”

For material output changes, BRIX must show:

- previous and current values
- effective time
- triggering event
- changed inputs
- formula/rule version
- recommendation or strategy impact
- accepted source or user action responsible

## 9. Guided Workflow Pattern

Each guided workflow defines:

1. goal
2. why the step exists
3. required inputs
4. optional inputs
5. source-quality guidance
6. common mistakes
7. material warnings
8. completion state
9. next action
10. connected modules affected

Guidance is dynamically scoped to active Deal, property type, strategy, stage, user mode, and missing information.

## 10. Contextual Help UX

Entry points include field help, metric labels, warning indicators, Decision Cockpit drawer, command palette, global help search, guided-step panel, activity explanations, report footnotes, and glossary links.

### Web

Use anchored popovers or side panels that preserve workflow context, support keyboard navigation, and avoid unnecessary full-page interruption.

### iPhone

Use compact summaries, bottom sheets or focused push views, large touch targets, offline-cached critical definitions, VoiceOver structure, and preserved form state.

### iPad

Support split view, side-by-side workflow and explanation, keyboard, pointer, and persistent context.

## 11. Search and Discovery

Help search supports plain-language questions, module/field/metric/strategy/property-type terms, synonyms, recent topics, bookmarks, and context-aware ranking.

Results identify whether content is:

- approved static content
- generated explanation based on canonical Deal data
- external-source summary
- professional-review guidance

No answer may be fabricated when approved content or sufficient source context is unavailable.

## 12. AI Responsibilities and Restrictions

AI may rewrite approved content for user level, explain canonical outputs, generate clearly labeled examples, summarize user-visible Deal context, recommend approved topics, and draft verification questions.

AI may not invent missing facts, alter canonical records, override formulas, conceal uncertainty, provide final regulated advice, or represent generated education as verified evidence.

Generated content retains prompt, model, provider, source context, safety, and version metadata.

## 13. Personalization and Progress

REL​earnIQ may track preferred mode, viewed topics, completed guided steps, bookmarks, dismissals, feedback, and last position.

Rules:

- Learning progress does not alter Deal readiness.
- Dismissed warnings reappear when the underlying condition materially changes.
- Users can reset preferences.
- Workspace defaults may be set without exposing private notes beyond authorization.

## 14. State Model

- Available
- Loading
- Generated
- Approved
- Stale
- Superseded
- Unavailable
- Offline Cached
- Generation Queued
- Generation Failed
- Professional Review Required

Unavailable guidance never blocks the underlying BRIX action.

## 15. Integration Requirements

REL​earnIQ integrates with authentication preferences, onboarding, Dashboard, PDRM, intake, underwriting, strategy, Decision Cockpit, MarketIQ, FinanceIQ, GovernanceIQ, ContractIQ, OfferIQ, PhotoIQ, VisitIQ, InspectionIQ, AppraisalIQ, Evidence, ReportIQ, notifications, search, AI orchestration, and admin content operations.

Each integration must consume canonical terminology, source/freshness state, formula/rule versions, and professional boundaries.

## 16. Security and Privacy

- Workspace-scoped preferences and progress
- RLS on user-specific records
- no sensitive Deal payloads in analytics or unsafe logs
- server-side provider secrets
- approved content review workflow
- safe external links and source references
- prompt-injection defenses for generated explanations
- deletion/export behavior aligned with account and workspace policy

## 17. Testing Requirements

- content versioning and supersession tests
- guided/professional mode parity tests
- explanation payload contract tests
- formula/source linkage tests
- “why changed” reconciliation fixtures
- missing/conflicted/stale data tests
- search and no-answer tests
- AI boundary and prompt-injection tests
- web/iPhone/iPad state-preservation tests
- offline critical-content tests
- accessibility and readability tests
- RLS and privacy tests

## 18. Verification and Validation

### Functional verification

- Users can open, search, bookmark, dismiss, resume, and switch modes without losing workflow state.
- Explanations remain connected to canonical outputs and sources.
- Failed guidance generation does not block work.

### Accuracy verification

- Metrics, formulas, warnings, recommendations, and changes explain the actual controlling data and versions.
- Facts, assumptions, estimates, inferences, conflicts, and professional boundaries remain distinct.
- No educational content becomes authoritative business data.

### Integration verification

- All connected modules use the same vocabulary and explanation contract.
- Reports, help surfaces, web, iPhone, and iPad reconcile.
- No duplicate help system or separate beginner calculation path remains.

### UX verification

- Guided and professional modes are complete, accessible, responsive, and non-blocking.
- Loading, offline, stale, unavailable, generation failure, and recovery states are verified.

### Definition of Done

Specification 018 is complete only when BRIX can explain its workflows, metrics, risks, recommendations, changes, and professional boundaries accurately across every supported client without altering canonical truth, blocking work, or creating a separate learning product.
