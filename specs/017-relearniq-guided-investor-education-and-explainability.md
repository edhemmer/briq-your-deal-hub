# BRIX Specification 017 — RELearnIQ Guided Investor Education and Explainability

## 1. Authority and Rules of Engagement

This specification is governed by `docs/00-START-HERE.md` through `docs/05-BUILD-ROADMAP.md` and Specifications 001–016.

Rules:

1. RELearnIQ uses the canonical Workspace, User, Deal, Property, Evidence, task, timeline, underwriting, strategy, market, financing, governance, contract, offer, inspection, appraisal, report, notification, usage, and audit systems.
2. RELearnIQ is an education and explanation layer. It may explain facts, formulas, workflows, risks, and professional roles; it may not replace authoritative calculations, canonical findings, or licensed professional advice.
3. Educational content must be context-aware but must not silently alter a Deal, assumption, recommendation, task, or user setting.
4. Guided and professional modes use the same canonical Deal data and calculation outputs.
5. Explanations must distinguish confirmed facts, user assumptions, system estimates, AI inferences, missing information, conflicts, stale data, and professional-review requirements.
6. Every explanation of a metric, score, recommendation, warning, or maximum offer must link to the controlling inputs, source classifications, formula version, binding constraints, and connected subsystem.
7. RELearnIQ must avoid personalized legal, tax, lending, appraisal, engineering, insurance, securities, or other regulated conclusions.
8. Content must be written for clarity without oversimplifying material risk.
9. User progress, preferences, dismissed guidance, bookmarks, and learning history must be workspace-scoped and auditable where they affect the experience.
10. No educational overlay may block a professional user from completing a workflow.
11. No failed AI or content service may block the underlying BRIX workflow.
12. Web, iPhone, iPad, reports, and supported shared views must use the same approved vocabulary and explanation contracts.
13. Every asynchronous generation task must expose queued, processing, partial, complete, failed, stale, and retry states.
14. Accessibility is mandatory for all educational content, media, diagrams, glossaries, and interactive guidance.

## 2. Mission

REL​earnIQ turns BRIX into a usable real estate learning environment without turning the product into a course platform or slowing experienced investors.

It must help a user understand:

- What a field, metric, document, warning, score, recommendation, strategy, or workflow means.
- Why a result changed.
- Which inputs matter most.
- What must be verified.
- Which professional should be consulted.
- What the next decision is.
- What the user has not yet learned or completed.
- How to progress from guided use to professional use.

## 3. Scope

REL​earnIQ includes:

- Contextual definitions and glossaries.
- Inline explanations for fields, metrics, statuses, and risks.
- Guided workflows for beginner users.
- Professional-mode explanations on demand.
- “Why this matters” and “what changes this result” explanations.
- Formula and calculation breakdowns.
- Strategy education.
- Property-type education.
- Deal-stage education.
- Document and due-diligence education.
- Professional-role guidance.
- Verification checklists.
- Personalized learning preferences and progress.
- Help search and command-palette access.
- Contextual examples and scenario walkthroughs.
- Post-action summaries and change explanations.
- Educational content for reports and shared outputs where appropriate.

REL​earnIQ does not:

- Own underwriting, strategy ranking, financing, market findings, contracts, offers, inspections, appraisals, or reports.
- Issue professional opinions.
- Guarantee outcomes.
- Create authoritative facts from educational text.
- Gamify high-stakes decisions in a way that minimizes risk.
- Force beginners through irrelevant lessons before completing a Deal workflow.

## 4. Canonical Ownership

### 4.1 RELearnIQ owns

- `learning_content_items`
- `learning_content_versions`
- `learning_topics`
- `learning_topic_relationships`
- `learning_user_preferences`
- `learning_user_progress`
- `learning_bookmarks`
- `learning_dismissals`
- `learning_context_events`
- `learning_feedback`
- `learning_generation_jobs`

### 4.2 RELearnIQ references but does not own

- Deal facts and assumptions.
- Evidence and source classifications.
- Calculation formulas and outputs.
- Strategy registry and rankings.
- Market findings.
- Financing structures.
- Governance findings.
- Contract terms and deadlines.
- Offer terms and negotiation history.
- Inspection and appraisal findings.
- Reports, tasks, contacts, timelines, and notifications.

### 4.3 Canonical content rule

Educational content must have:

- Permanent content ID.
- Topic ID.
- Version.
- Audience level.
- Applicable property types.
- Applicable strategies.
- Applicable Deal stages.
- Applicable modules and fields.
- Jurisdiction scope when relevant.
- Professional-boundary classification.
- Review status.
- Effective date.
- Retirement/supersession state.
- Source references where factual or regulatory context is included.

## 5. User Modes

### 5.1 Guided mode

Guided mode may provide:

- Plain-language explanations.
- Step sequencing.
- Recommended next actions.
- Required versus optional distinctions.
- Examples.
- Warnings about missing or assumed inputs.
- Definitions at point of use.
- Verification prompts.
- Professional-role suggestions.
- Progress indicators.

Guided mode must not:

- Hide material assumptions or risks.
- Change formulas.
- Use different authoritative outputs.
- Force completion of educational content before saving or progressing unless a legally required acknowledgment exists.

### 5.2 Professional mode

Professional mode prioritizes density and speed while retaining:

- Tooltips.
- Expandable calculation detail.
- Formula provenance.
- Source and freshness detail.
- Keyboard-accessible help.
- Contextual glossary.
- Optional deep explanations.

### 5.3 Mode switching

- Mode is a user preference, not a separate account or data model.
- Switching modes must not lose form progress, filters, active Deal, or workflow position.
- The user may override mode by module or session.
- The system may suggest a mode but may not silently change it.

## 6. Content Taxonomy

REL​earnIQ must support at minimum:

### 6.1 Core concepts

- Deal
- Property
- Evidence
- Fact
- Estimate
- Assumption
- Inference
- Confidence
- Verification
- Freshness
- Conflict
- Scenario
- Recommendation
- Override
- Decision history

### 6.2 Financial metrics

- NOI
- Cap rate
- Cash flow
- Cash-on-cash return
- DSCR
- Debt yield
- LTV
- LTC
- IRR
- NPV
- Equity multiple
- Break-even occupancy
- Operating expense ratio
- Vacancy
- Reserves
- Refinance proceeds
- Maximum allowable offer
- Sensitivity and stress testing

### 6.3 Strategies

Every strategy in the permanent strategy registry must have:

- Plain-language description.
- Ideal use case.
- Required inputs.
- Typical risks.
- Hard disqualifiers.
- Financing considerations.
- Operational complexity.
- Exit considerations.
- Key metrics.
- Common beginner mistakes.
- Professional review triggers.

### 6.4 Property and transaction topics

- Residential, multifamily, mixed-use, commercial, land, development, distressed, portfolio, and owner-user distinctions.
- Title, survey, zoning, environmental, insurance, association, lease, financing, contract, inspection, appraisal, renovation, and closing topics.
- Ownership, operation, refinance, disposition, and tax-related concepts with clear professional boundaries.

## 7. Explanation Contracts

Every explainable BRIX output must support an explanation payload containing:

- `title`
- `plain_language_summary`
- `why_it_matters`
- `controlling_inputs`
- `formula_or_rule_version`
- `source_classifications`
- `freshness`
- `confidence`
- `binding_constraints`
- `missing_information`
- `conflicts`
- `sensitivity_drivers`
- `connected_modules`
- `professional_review_triggers`
- `next_verification_actions`

### 7.1 “Why did this change?”

When a material output changes, BRIX must be able to show:

- Previous value.
- Current value.
- Effective time.
- Triggering event.
- Changed inputs.
- Recalculation version.
- Strategy or recommendation impact.
- User or source responsible for the accepted change.

### 7.2 “What would improve this Deal?”

This explanation may identify deterministic levers such as:

- Lower purchase price.
- Higher verified income.
- Lower verified expenses.
- Different financing.
- Lower rehabilitation cost.
- Different strategy.
- Reduced vacancy.
- Longer hold period.

It must not present speculative improvements as guaranteed or recommend unlawful, unsafe, or unsupported actions.

## 8. Guided Workflow Pattern

Each supported workflow may define:

1. Goal.
2. Why the step exists.
3. Required inputs.
4. Optional inputs.
5. Source quality guidance.
6. Common mistakes.
7. Material warnings.
8. Completion state.
9. Next action.
10. Connected modules affected.

Guidance must be dynamically scoped to the active Deal, property type, strategy, stage, user mode, and missing information.

## 9. Contextual Help UX

### 9.1 Entry points

- Field-level help icon.
- Metric labels.
- Warning and confidence indicators.
- Decision Cockpit explanation drawer.
- Command palette.
- Global help search.
- Guided-step panel.
- “Why this changed” activity item.
- Report footnotes and appendix references.

### 9.2 Web

- Side panel or anchored popover that preserves the active workflow.
- Keyboard navigation.
- Search and topic links.
- Expandable formulas, examples, and sources.
- No full-page interruption for simple explanations.

### 9.3 iPhone

- Bottom sheet or push view.
- Large touch targets.
- Compact summaries first.
- Offline-cached critical definitions.
- VoiceOver-friendly structure.
- Preserve form state when help opens and closes.

### 9.4 iPad

- Split-view support.
- Side-by-side workflow and explanation.
- Keyboard, pointer, and drag/drop compatibility.
- Persistent context for professional review.

## 10. Search and Discovery

Help search must support:

- Plain-language questions.
- Module, field, metric, strategy, and property-type keywords.
- Synonyms and common real estate terminology.
- Recent and bookmarked topics.
- Context-aware ranking.
- No fabricated answer when no approved content exists.

Search results must identify whether the answer is:

- Approved static content.
- Generated explanation based on canonical data.
- External-source summary.
- Professional-review guidance.

## 11. AI Responsibilities and Restrictions

AI may:

- Rewrite approved content for user level.
- Explain canonical outputs.
- Generate examples clearly labeled as examples.
- Summarize user-visible Deal context.
- Suggest relevant approved topics.
- Generate verification questions.

AI may not:

- Modify canonical records.
- Invent missing Deal facts.
- Override deterministic formulas.
- Give final legal, tax, appraisal, engineering, lending, insurance, or securities advice.
- Present generated educational content as verified evidence.
- conceal uncertainty.

All generated content must retain prompt/version/provider/model metadata, source context, and safety classification where required.

## 12. Personalization and Progress

REL​earnIQ may track:

- Preferred mode.
- Topics viewed.
- Guided steps completed.
- Bookmarks.
- Dismissed explanations.
- User feedback.
- Last position in a guided sequence.

Rules:

- Progress must never alter Deal completion or professional readiness status.
- Dismissed warnings reappear when the underlying condition materially changes.
- Users can reset learning preferences.
- Workspace administrators may set default guidance policies but cannot read private learning notes unless explicitly authorized.

## 13. State Model

Supported states:

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

A failed or unavailable explanation must never block the underlying BRIX action.

## 14. Integrations

REL​earnIQ must integrate with:

- Authentication and workspace preferences.
- Dashboard onboarding and first-use states.
- Deal and PDRM context.
- Property intake guidance.
- Underwriting metric explanations.
- Strategy comparison.
- Decision Cockpit.
- MarketIQ source and risk interpretation.
- FinanceIQ financing terms and constraints.
- GovernanceIQ restrictions.
- ContractIQ terms and deadlines.
- OfferIQ negotiation concepts.
- PhotoIQ and VisitIQ evidence guidance.
- InspectionIQ and AppraisalIQ professional boundaries.
- ReportIQ footnotes, glossary, and appendices.
- Notifications and task guidance.
- Admin content management and usage controls.

No integration may duplicate the owning subsystem’s facts, formulas, or status.

## 15. Security, Privacy, and Governance

- All user-specific data is workspace scoped and protected by RLS.
- Sensitive Deal information must not be exposed in public help content.
- Provider secrets remain server-side.
- Generated prompts must minimize unnecessary PII.
- Content changes require role-based approval and version history.
- Retired content remains auditable but is not shown as current.
- Usage analytics must avoid storing sensitive free-text unless explicitly required and protected.

## 16. Performance and Offline Requirements

- Approved core glossary content must load quickly and support safe caching.
- Opening contextual help must not block the active screen.
- Generated explanations run asynchronously.
- Cached content must display freshness/version state.
- iPhone and iPad must retain critical glossary and workflow guidance offline.
- Large content libraries require pagination or indexed search.

## 17. Domain Events

REL​earnIQ may emit:

- `learning.topic_viewed`
- `learning.guidance_started`
- `learning.guidance_completed`
- `learning.bookmarked`
- `learning.dismissed`
- `learning.feedback_submitted`
- `learning.content_published`
- `learning.content_superseded`
- `learning.generation_requested`
- `learning.generation_completed`
- `learning.generation_failed`

Consumers include analytics, onboarding, notifications, admin, and support. These events must not trigger underwriting or canonical Deal mutation.

## 18. Testing Requirements

- Content versioning and supersession tests.
- Mode-switching and state-preservation tests.
- Field-level help mapping tests.
- Formula explanation reconciliation tests.
- “Why did this change?” event fixtures.
- Guided workflow completion and resume tests.
- AI boundary and hallucination-resistance tests.
- RLS and privacy tests.
- Offline cache and stale-content tests.
- Web, iPhone, and iPad accessibility tests.
- Search relevance and no-result behavior tests.
- Performance tests for large content libraries.

## 19. Verification and Validation

### Functional verification

- Contextual explanations open from all required entry points.
- Guidance preserves active workflow state.
- Guided and professional modes use identical canonical Deal data.
- Progress, bookmarks, dismissals, and preferences save and reopen correctly.
- Failed explanation services do not block the underlying workflow.

### Accuracy verification

- Metric explanations reconcile to the canonical calculation owner.
- Strategy explanations reconcile to the permanent strategy registry.
- Facts, assumptions, estimates, inferences, conflicts, and missing information remain distinct.
- Generated content contains no fabricated Deal facts.
- Professional boundaries are visible and accurate.

### Integration verification

- RELearnIQ reads canonical outputs without duplicating ownership.
- “Why did this change?” traces the correct domain event and version history.
- ReportIQ uses the same glossary and explanation contracts.
- Dashboard, Cockpit, underwriting, strategy, market, finance, governance, contract, offer, visit, photo, inspection, and appraisal flows link to the correct context.
- No educational event silently mutates another subsystem.

### UX verification

- Web, iPhone, and iPad experiences are complete and consistent.
- Help is accessible without losing user position or unsaved work.
- Guided mode is supportive without becoming obstructive.
- Professional mode remains efficient.
- Loading, offline, stale, failed, unavailable, and superseded states are understandable.
- VoiceOver, Dynamic Type, keyboard, pointer, contrast, and focus behavior pass.

### Production readiness

- No placeholder content.
- No dead help links.
- No contradictory definitions.
- No unversioned published content.
- No public exposure of private Deal data.
- Logging, monitoring, usage limits, and failure recovery are implemented.
- Approved content and generated content are clearly distinguished.

## 20. Definition of Done

This specification is complete only when a user can move between guided and professional use, open contextual explanations from every supported BRIX workflow, understand why material results changed, inspect controlling inputs and professional-review needs, save and resume learning preferences, work with limited connectivity, and receive consistent explanations across web, iPhone, iPad, and reports without RELearnIQ duplicating or altering any canonical Deal logic.
