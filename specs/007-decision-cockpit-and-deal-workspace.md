# BRIX Specification 007 — Decision Cockpit and Deal Workspace

## 1. Authority

This specification is governed by:

- `docs/00-START-HERE.md`
- `docs/01-PRODUCT-CONSTITUTION.md`
- `docs/02-ENGINEERING-STANDARDS.md`
- `docs/03-DATA-ARCHITECTURE.md`
- `docs/04-UI-UX-SYSTEM.md`
- `docs/05-BUILD-ROADMAP.md`
- `specs/001-authentication-and-workspaces.md`
- `specs/002-dashboard-and-application-shell.md`
- `specs/003-deals-and-pdrm-core.md`
- `specs/004-property-intake-and-source-tracking.md`
- `specs/005-deterministic-underwriting-engine.md`
- `specs/006-strategy-intelligence-engine.md`

Codex must re-read the permanent product, engineering, data, UI/UX, security, integration, and completion rules before implementing this specification.

The Decision Cockpit is the primary operating surface for a Deal. It must not become a disconnected dashboard, a summary-only screen, or a visual layer with independent calculations. It consumes canonical Deal, evidence, underwriting, strategy, task, deadline, financing, risk, recommendation, and activity records.

---

## 2. Mission

Build the central BRIX Deal workspace that allows an investor to understand the current state of an opportunity, inspect the evidence, compare strategies, identify risks, see what changed, and take the next correct action without wasting time.

The Cockpit must answer, in order:

1. What Deal am I looking at?
2. What stage is it in?
3. What is BRIX currently recommending?
4. What strategy is strongest and why?
5. What does the investor currently intend to do?
6. What are the key financial outputs?
7. What can materially hurt the Deal?
8. What information is missing or uncertain?
9. What changed since the last meaningful review?
10. What deadline or task matters next?
11. What should the user do now?
12. Where is the supporting evidence?

The Cockpit must remain useful to both a beginner investor and a professional investor by using progressive disclosure, not separate calculations or separate product logic.

---

## 3. Non-Negotiable Rules

1. The Cockpit never owns authoritative financial calculations.
2. The Cockpit never owns authoritative strategy rankings.
3. The Cockpit never owns duplicate Deal state.
4. Every material number must identify its source snapshot and freshness.
5. Every recommendation must link to evidence, assumptions, engine version, and strategy result.
6. Every material warning must identify severity, status, owner, and resolution path.
7. No stale recommendation may appear current after assumptions or evidence change.
8. No module badge may rely on client-local counts.
9. Every visible action must persist, route, trigger, or open something real.
10. Every screen state must distinguish loading, empty, current, stale, processing, failed, offline, conflicted, and permission-denied conditions.
11. The user decision and the BRIX recommendation must remain separate records.
12. User overrides must preserve the original recommendation and reason.
13. The Cockpit must reopen at the user's last meaningful location.
14. Web, iPhone, iPad, reports, and shared views must reconcile to the same canonical result.

---

## 4. Scope

This specification defines:

- Deal Cockpit information architecture
- Deal-level navigation
- Summary hierarchy
- Recommendation presentation
- Strategy presentation
- Financial KPI presentation
- Risk and issue presentation
- Missing information and verification presentation
- Task and deadline presentation
- Activity and change history
- Evidence links
- User decision and override workflows
- Guided and professional modes
- Web, iPhone, and iPad layouts
- Freshness and stale-state rules
- Offline and synchronization behavior
- Domain events and background refresh behavior
- Accessibility
- Performance
- Testing and Definition of Done

This specification does not redefine:

- Underwriting formulas
- Strategy scoring formulas
- Property intake rules
- Source classification
- Contract analysis
- Inspection analysis
- Appraisal analysis
- Billing
- Admin operations

Those systems integrate into the Cockpit through canonical records and domain events.

---

## 5. Dependencies

Required completed foundations:

- Authenticated user and active workspace
- Canonical `property_id`
- Canonical `deal_id`
- Deal lifecycle and stage history
- Property intake and source tracking
- Underwriting snapshots and results
- Strategy evaluation and ranking
- Tasks, deadlines, contacts, evidence, activities, and domain events
- Design system and application shell

The Cockpit must degrade safely when a dependent system is unavailable or incomplete.

Examples:

- If underwriting has not run, show the underwriting setup state and next action.
- If strategy ranking is processing, retain the last valid result and label it stale or superseded.
- If market data is unavailable, show the missing source and continue with user-entered assumptions.
- If the user lacks permission, hide or disable mutation actions and explain access level.

---

## 6. Canonical Data Ownership

The Cockpit reads but does not redefine the following canonical entities:

- `deals`
- `properties`
- `deal_stage_history`
- `deal_decisions`
- `recommendations`
- `recommendation_versions`
- `strategy_scenarios`
- `strategy_results`
- `underwriting_snapshots`
- `underwriting_results`
- `assumption_sets`
- `evidence`
- `evidence_findings`
- `risks`
- `tasks`
- `deadlines`
- `activities`
- `domain_events`
- `contacts`
- `organizations`
- `financing_structures`
- `offers`
- `contracts`
- `inspections`
- `appraisals`
- `governance_records`
- `visits`
- `reports`

If a required entity does not yet exist in the canonical schema, Codex must extend the canonical schema through a forward-only migration. It must not create local-only copies or convenience tables that become alternate truth.

---

## 7. Required Deal Cockpit View Model

The backend must expose a stable Cockpit read model assembled from canonical records.

Minimum shape:

```ts
interface DealCockpitView {
  deal: {
    id: string;
    propertyId: string;
    title: string;
    stage: DealStage;
    status: DealStatus;
    archived: boolean;
    ownerUserId: string | null;
    lastActivityAt: string | null;
    updatedAt: string;
  };
  property: {
    displayAddress: string;
    propertyType: string | null;
    primaryImageUrl: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  recommendation: {
    id: string | null;
    version: number | null;
    state: "missing" | "processing" | "current" | "stale" | "failed" | "superseded";
    action: RecommendationAction | null;
    headline: string | null;
    rationaleSummary: string | null;
    confidence: number | null;
    generatedAt: string | null;
    basedOnUnderwritingSnapshotId: string | null;
    basedOnStrategyRunId: string | null;
    staleReasons: string[];
  };
  investorDecision: {
    id: string | null;
    action: DecisionAction | null;
    reason: string | null;
    decidedAt: string | null;
    decidedBy: string | null;
    overridesRecommendation: boolean;
  };
  strategy: {
    selectedStrategyId: string | null;
    strongestStrategyId: string | null;
    strongestStrategyName: string | null;
    rankingState: "missing" | "processing" | "current" | "stale" | "failed";
    topAlternatives: StrategySummary[];
  };
  financials: {
    underwritingSnapshotId: string | null;
    engineVersion: string | null;
    state: "missing" | "processing" | "current" | "stale" | "failed";
    currency: string;
    asOf: string | null;
    metrics: FinancialMetricSummary[];
    staleReasons: string[];
  };
  risks: RiskSummary[];
  missingInformation: MissingInformationSummary[];
  deadlines: DeadlineSummary[];
  tasks: TaskSummary[];
  recentChanges: ChangeSummary[];
  evidenceSummary: EvidenceSummary;
  moduleStatus: ModuleStatusSummary[];
  sync: {
    canonicalVersion: number;
    lastSyncedAt: string | null;
    hasOfflineChanges: boolean;
    conflictState: "none" | "detected" | "resolving";
  };
}
```

The exact implementation may vary, but all listed concepts must exist.

---

## 8. Cockpit Information Hierarchy

The Cockpit must display information in this priority order.

### Tier 1 — Immediate Decision

- Current recommendation
- Current Deal stage
- Investor decision
- Strongest strategy
- Primary next action
- Blocking risk or deadline

### Tier 2 — Financial Position

- Purchase price or asking price
- Total project cost
- Cash required
- Monthly or annual cash flow
- NOI where applicable
- Cap rate where applicable
- Cash-on-cash return where applicable
- DSCR where applicable
- IRR and equity multiple where applicable
- Maximum offer where applicable
- Downside scenario result

Only metrics relevant to the active property type and strategy may appear as primary metrics.

### Tier 3 — Risk and Confidence

- Blocking risks
- Material warnings
- Unverified assumptions
- Conflicts
- Missing documents
- Missing professional review
- Confidence by category

### Tier 4 — Workflow

- Tasks
- Deadlines
- Current stage requirements
- Recent changes
- Pending background jobs
- Incomplete modules

### Tier 5 — Evidence and Detail

- Source documents
- Imported records
- Assumptions
- Formula details
- Strategy details
- Timeline
- Full activity history

---

## 9. Recommendation Presentation

The recommendation card must show:

- Recommended action
- Recommendation state
- Confidence
- Generation date/time
- What changed since the prior recommendation
- Primary reasons
- Primary risks
- Missing information that could change the recommendation
- Link to strategy comparison
- Link to underwriting snapshot
- Link to supporting evidence

Permitted recommendation actions include:

- Research further
- Schedule visit
- Monitor
- Prepare offer
- Negotiate
- Submit offer
- Proceed with conditions
- Hold
- Pass
- Acquire
- Refinance
- Sell

The Cockpit must not generate recommendation language in the client. Recommendation records must be persisted, versioned, and reproducible.

When stale:

- Preserve the last valid recommendation.
- Display a visible stale state.
- Identify the triggering changes.
- Provide a recalculation status or action.
- Do not silently present the prior recommendation as current.

---

## 10. Investor Decision Workflow

The investor can record a decision independently of BRIX.

Required fields:

- Decision action
- Reason
- Effective date/time
- User
- Optional related recommendation version
- Optional override reason
- Optional follow-up date
- Optional assigned owner

Required behavior:

1. User selects a decision.
2. UI displays consequence and next stage where applicable.
3. User confirms material decisions such as Pass, Submit Offer, Acquire, Refinance, or Sell.
4. Backend authorizes and persists the decision.
5. Domain event is emitted.
6. Deal stage updates only through an allowed state transition.
7. Timeline records the action.
8. Required tasks or deadlines are created.
9. Cockpit refreshes from canonical data.

Decision history must never be overwritten.

---

## 11. Strategy Area

The strategy area must display:

- Investor-selected strategy
- Strongest strategy
- Ranking position
- Score or status
- Hard disqualifiers
- Key return metrics
- Capital requirement
- Execution complexity
- Risk level
- Confidence
- Why it ranks where it does
- Alternatives

Required interactions:

- Compare strategies
- Select preferred strategy
- View strategy education
- View required missing inputs
- Open scenario details
- Duplicate scenario
- Archive scenario

Changing the preferred strategy must not alter ranking rules. It may change the primary comparison and future user workflow only.

---

## 12. Financial KPI Area

### Rules

- Financial values come from the canonical underwriting result.
- Display the result state and `as of` time.
- Show currency and units.
- Use tabular numerals.
- Do not display irrelevant metrics.
- Provide formula detail and source assumptions through drill-down.
- Show scenario labels clearly.
- Highlight whether a threshold is met, missed, or unknown.

### Required scenario access

- Base case
- Conservative case
- Upside case
- User-created cases
- Current accepted case

### Stale financial result

When accepted assumptions or evidence change:

- Existing result becomes stale.
- A new calculation is queued or offered according to policy.
- The stale result remains available.
- The UI explains which inputs changed.
- A newer failed run must not erase the last valid result.

---

## 13. Risk System

Risk categories include:

- Financial
- Property condition
- Market
- Financing
- Legal or contractual
- Governance or association
- Environmental
- Insurance
- Zoning and use
- Construction
- Tenant and lease
- Operational
- Liquidity
- Title and survey
- Data quality

Risk severity:

- Blocking
- Critical
- High
- Moderate
- Low
- Informational

Risk state:

- Open
- Under review
- Waiting on evidence
- Mitigated
- Accepted
- Resolved
- Superseded

Every risk must include:

- Title
- Description
- Category
- Severity
- State
- Source
- Evidence links
- Confidence
- Owner
- Due date where applicable
- Effect on underwriting or strategy
- Required verification or mitigation
- Resolution history

The Cockpit must separate:

- Confirmed problems
- Potential concerns
- Missing information
- Conflicting evidence
- Professional review recommendations

---

## 14. Missing Information and Verification Queue

The queue must prioritize missing information by decision impact.

Each item requires:

- Description
- Category
- Why it matters
- Potential effect
- Requested source
- Assigned owner
- Due date
- Status
- Blocking status
- Completion action

Examples:

- Verify property taxes
- Confirm HOA rental restrictions
- Obtain insurance quote
- Confirm utility responsibility
- Upload lease schedule
- Verify zoning use
- Obtain contractor estimate
- Confirm financing terms
- Obtain inspection report
- Confirm appraisal conditions

The user must be able to complete an item by:

- Entering verified information
- Uploading evidence
- Linking existing evidence
- Assigning a task
- Marking not applicable with reason
- Deferring with reason

---

## 15. Tasks and Deadlines

The Cockpit must display:

- Overdue
- Due today
- Due soon
- Upcoming
- Unscheduled required actions
- Completed recent actions

Deadline sources must be visible, such as:

- Contract clause
- Offer term
- Inspection period
- Financing contingency
- Appraisal deadline
- Association review period
- Closing schedule
- User-created task

Users must not be able to edit source-derived legal deadlines without preserving the original extracted value and recording the override.

---

## 16. Recent Changes and Timeline

The Cockpit must show meaningful changes, not raw database noise.

Examples:

- Asking price changed
- Financing terms changed
- Inspection added material repairs
- Appraisal changed value confidence
- Strategy ranking changed
- Recommendation changed
- Contract deadline added
- HOA restriction discovered
- User decision recorded
- Offer countered
- Task completed

Each change must show:

- What changed
- Before and after where applicable
- Who or what changed it
- Date/time
- Source
- Effect on recommendation or underwriting
- Link to the relevant module

---

## 17. Module Status Matrix

The Deal workspace must include a canonical module-status model.

Minimum modules:

- Property Intake
- Underwriting
- Strategy
- MarketIQ
- FinanceIQ
- GovernanceIQ
- ContractIQ
- OfferIQ
- VisitIQ
- PhotoIQ
- InspectionIQ
- AppraisalIQ
- ReportIQ

Status values:

- Not started
- In progress
- Processing
- Needs attention
- Complete
- Stale
- Failed
- Not applicable
- Permission restricted

A status badge must be computed from canonical module records and jobs. It must not be manually stored as a disconnected client value.

---

## 18. Deal-Level Navigation

Required destinations:

- Overview
- Property
- Underwriting
- Strategies
- Market
- Financing
- Visits
- Photos and media
- Documents and evidence
- Governance
- Offer
- Contract
- Inspection
- Appraisal
- Tasks and deadlines
- Contacts
- Activity and history
- Reports
- RELearnIQ

Navigation requirements:

- Preserve active Deal.
- Preserve last meaningful subview.
- Support deep links.
- Support browser back/forward.
- Support keyboard navigation on web.
- Support native navigation restoration on iOS/iPadOS.
- Show attention state without clutter.
- Hide inaccessible modules only when policy requires hiding; otherwise show permission state.
- Never route to placeholder screens.

---

## 19. Web UX

### Desktop and laptop

Use a responsive professional workspace.

Recommended pattern:

- Global application navigation
- Deal header
- Deal-level navigation
- Main decision column
- Secondary risk/workflow column
- Optional expandable details

Requirements:

- Key decision content visible without excessive scrolling.
- Sticky context may be used for Deal identity and actions.
- Large tables must support sorting, filtering, and column control.
- Side panels must not cover critical context without dismissal.
- Keyboard shortcuts may be used for frequent actions.
- Browser refresh must preserve the route and reopen canonical data.

### Responsive web

At narrower widths:

- Collapse secondary navigation intentionally.
- Preserve priority order.
- Do not shrink dense tables beyond usability.
- Replace tables with cards or drill-down where necessary.
- Keep primary action reachable.

---

## 20. iPhone UX

The iPhone Cockpit is a field decision tool.

Required top-level content:

- Deal identity
- Current recommendation
- Primary next action
- Key metrics
- Blocking risks
- Today/overdue tasks
- Quick actions

Quick actions:

- Add photo
- Add voice note
- Add document
- Add task
- Get directions
- Record decision
- Open underwriting
- Open offer

Requirements:

- One-handed use
- Large touch targets
- Minimal typing
- Native sheets and navigation
- Offline status visible
- Background upload status visible
- Resume at last meaningful point
- No desktop-style multi-column compression

---

## 21. iPad UX

The iPad Cockpit must support professional review and field work.

Required capabilities:

- Split view with Deal list and Deal workspace
- Cockpit beside document or report
- Multi-column strategy comparison
- Drag and drop evidence
- Keyboard shortcuts
- Pointer support
- Multitasking
- Persistent Deal context
- Independent panel scrolling where appropriate

The iPad implementation may not be a stretched iPhone layout.

---

## 22. Guided and Professional Modes

### Guided mode

Provides:

- Plain-language explanations
- Contextual definitions
- Why a metric matters
- Suggested questions
- Recommended next step
- Progressive disclosure
- RELearnIQ links

### Professional mode

Provides:

- Higher information density
- Faster navigation
- Formula and source access
- Expanded tables
- Scenario comparison
- Fewer explanatory prompts

Both modes must use the same canonical records and calculations.

Changing modes must not change results.

---

## 23. API and Query Contracts

Minimum backend contracts:

- Fetch Cockpit view by `deal_id`
- Fetch incremental updates since canonical version
- Record investor decision
- Change Deal stage through authorized transition
- Assign or complete task
- Resolve missing-information item
- Acknowledge or accept risk
- Select preferred strategy
- Queue recalculation
- Fetch recommendation history
- Fetch change history

All mutation endpoints require:

- Authenticated user
- Workspace authorization
- Role authorization
- Expected version or conflict token
- Idempotency key where retry is possible
- Audit event
- Domain event

---

## 24. Domain Events

The Cockpit consumes events including:

- `deal.created`
- `deal.updated`
- `deal.stage_changed`
- `property.updated`
- `evidence.added`
- `evidence.verified`
- `assumption_set.accepted`
- `underwriting.queued`
- `underwriting.completed`
- `underwriting.failed`
- `strategy_ranking.completed`
- `strategy_ranking.failed`
- `recommendation.created`
- `recommendation.stale`
- `decision.recorded`
- `risk.created`
- `risk.updated`
- `task.created`
- `task.completed`
- `deadline.created`
- `contract.processed`
- `inspection.processed`
- `appraisal.processed`
- `governance.processed`
- `offer.updated`

The Cockpit emits events including:

- `decision.recorded`
- `deal.stage_change_requested`
- `task.completed`
- `risk.accepted`
- `missing_information.resolved`
- `preferred_strategy.changed`
- `underwriting.recalculation_requested`

Event consumption must be idempotent.

---

## 25. Freshness, Caching, and Stale-State Rules

Every Cockpit response must include:

- Canonical version
- Generated time
- Underwriting freshness
- Strategy freshness
- Recommendation freshness
- Market freshness where available
- Evidence freshness where relevant

Caching requirements:

- Cache only read models, never mutation truth.
- Cache keys must include workspace, Deal, and canonical version.
- Invalidate by domain event.
- Stale cache may be displayed only with explicit freshness labeling when decision impact exists.
- Client cache must not overwrite newer canonical data.

---

## 26. Offline and Synchronization

Offline-supported actions:

- View last synchronized Cockpit
- Add note
- Add photo
- Add voice note
- Create task draft
- Record field observation
- Prepare a decision draft

Offline restrictions:

- Do not finalize a stage-changing decision without canonical confirmation unless explicitly designed as queued.
- Do not display offline calculations as canonical unless produced by an approved deterministic offline engine with version parity.
- Do not silently resolve conflicts.

Synchronization behavior:

- Queue local actions with idempotency keys.
- Show unsynced count.
- Retry safely.
- Preserve original timestamps and local device metadata.
- Detect version conflicts.
- Require user resolution for material conflicts.

---

## 27. Background Jobs

The Cockpit must expose durable status for:

- Underwriting
- Strategy ranking
- Recommendation generation
- Document processing
- Photo analysis
- Voice transcription
- Report generation
- Data-provider refresh
- Notification delivery where relevant

Each job must have:

- Job ID
- Deal ID
- Type
- Status
- Created time
- Started time
- Completed time
- Retry count
- Failure classification
- User-safe failure message
- Correlation ID
- Superseded-by reference where applicable

A job may not remain indefinitely in processing without timeout, heartbeat, or stale-job handling.

---

## 28. Error States

Required error categories:

- Validation
- Permission
- Version conflict
- Connectivity
- Provider outage
- Timeout
- Processing failure
- Missing dependency
- Internal failure

Every error must explain:

- What failed
- What was preserved
- Whether the current Deal decision is affected
- Whether prior valid data remains available
- What the user can do next
- Support reference where appropriate

No raw stack trace or provider secret may be displayed.

---

## 29. Loading, Empty, and Partial States

### Loading

- Preserve layout.
- Show which section is loading.
- Avoid blocking the entire Cockpit for secondary content.
- Provide timeout behavior.

### Empty

Examples:

- No underwriting
- No strategy ranking
- No tasks
- No documents
- No risks
- No recommendation

Each empty state must explain what belongs there and provide the next meaningful action.

### Partial

The Cockpit must render usable confirmed information even if one subsystem is unavailable.

Partial state must identify:

- Available sections
- Unavailable sections
- Reason
- Retry or continuation path

---

## 30. Permissions

Minimum permissions:

- View Cockpit
- Edit Deal summary
- Change stage
- Record decision
- Run underwriting
- Select preferred strategy
- Accept risk
- Manage tasks
- View sensitive documents
- Export reports

Permissions must be enforced server-side.

A viewer must not see editable controls.

Restricted sensitive evidence must not leak through summaries, search, notifications, or cached data.

---

## 31. Accessibility

Required:

- WCAG 2.2 AA web compliance
- Logical heading hierarchy
- Keyboard navigation
- Visible focus
- Accessible status text
- No color-only communication
- Chart text summaries
- Screen-reader labels
- Announced validation errors
- Dynamic Type on iOS/iPadOS
- VoiceOver support
- Reduce Motion support
- Sufficient contrast
- Platform-compliant touch targets

---

## 32. Performance Requirements

Targets for normal production conditions:

- Cockpit shell interactive quickly after route change.
- Primary decision content prioritized over secondary modules.
- Large histories paginated.
- Large evidence lists virtualized or paginated.
- Background refresh must not freeze navigation.
- Repeated navigation to a recently opened Deal may use safe cached read models.
- Client memory must not grow without bound during long sessions.

Exact numeric budgets must be established during implementation and tested in CI or release checks.

---

## 33. Observability and Analytics

Operational telemetry:

- Cockpit load success/failure
- Query duration
- Cache hit/miss
- Stale view served
- Recalculation queued/completed/failed
- Conflict detected
- Offline sync success/failure
- Deep-link failure
- Background job timeout

Product analytics, where permitted:

- Deal opened
- Recommendation viewed
- Strategy comparison opened
- Decision recorded
- Risk opened
- Task completed
- Report generated

No sensitive Deal details may be placed in analytics payloads.

---

## 34. Security Requirements

- All reads workspace-scoped.
- All mutations role-authorized.
- RLS must protect all source tables.
- Read-model endpoints must not bypass authorization.
- Signed or authorized access for sensitive files.
- No service-role key in clients.
- Audit all material decisions and overrides.
- Sanitize user-entered rich text.
- Protect against insecure direct-object references.
- Prevent cross-workspace cache contamination.

---

## 35. Acceptance Tests

Minimum end-to-end scenarios:

1. User opens a current Deal and sees recommendation, strategy, key metrics, risks, tasks, and freshness.
2. User opens a Deal with no underwriting and is guided to complete assumptions.
3. Assumptions change, prior underwriting becomes stale, recalculation runs, and a new recommendation appears without losing history.
4. Strategy ranking changes after new evidence and the Cockpit shows what changed.
5. User records a decision that matches the recommendation.
6. User records a decision that overrides the recommendation and supplies a reason.
7. User changes Deal stage through a valid transition.
8. Invalid stage transition is rejected without corrupting state.
9. User completes a source-derived deadline task while preserving the original source.
10. User resolves a missing-information item by linking evidence.
11. A background job fails and the prior valid result remains visible.
12. A stale job is detected and safely retried.
13. Web and iPhone show the same current recommendation and metrics.
14. iPad displays Cockpit and document side by side.
15. User opens a deep link to a Deal and lands in the correct workspace and module.
16. Unauthorized user cannot access the Deal.
17. Viewer cannot mutate the Deal.
18. Offline user adds a note and photo, then syncs safely.
19. Material sync conflict is detected and not silently overwritten.
20. Generated report reconciles to Cockpit values.

---

## 36. Regression Tests

Protect against:

- Stale recommendation shown as current
- Duplicate decisions from retry
- Duplicate stage transitions
- Wrong Deal opened from notification
- Cross-workspace data leakage
- Client-local badge drift
- Report/Cockpit mismatch
- Web/iOS metric mismatch
- Failed run erasing prior valid result
- Offline action loss
- Indefinite processing state
- Permission controls visible to viewers
- Archived Deal treated as active
- Browser refresh losing Deal context
- iOS relaunch losing active Deal context

---

## 37. Definition of Done

This specification is complete only when:

- The Cockpit is built on web, iPhone, and iPad.
- It uses the canonical Deal and canonical engine outputs.
- Recommendation, strategy, underwriting, risk, task, deadline, evidence, and decision data reconcile.
- All visible controls work end to end.
- Loading, empty, partial, stale, offline, conflict, failure, and permission states are implemented.
- User decisions and BRIX recommendations remain separate and historically preserved.
- Deep links work.
- Save, refresh, relaunch, and reopen work.
- Background jobs expose durable status and retry.
- No stale result is represented as current.
- No disconnected module status exists.
- Accessibility requirements pass.
- RLS and authorization tests pass.
- Web production build passes.
- iPhone and iPad builds pass.
- End-to-end acceptance tests pass.
- Reports reconcile to Cockpit values.
- No unrelated feature was broken.

Codex must end implementation with either:

`CHAPTER COMPLETE`

or

`CHAPTER NOT COMPLETE`

with exact outstanding failures.
