# 007 — Decision Cockpit

## Authority

This specification is subordinate to the BRIX product constitution, engineering standards, data architecture, UI/UX system, build roadmap, and all previously completed specifications. It governs the implementation of the central Deal workspace and decision experience.

Codex must re-read the permanent build rules before implementation. This feature must not create duplicate Deal state, duplicate calculations, duplicate recommendations, or client-specific truth.

---

## Mission

The Decision Cockpit is the primary operating surface for BRIX. It must allow an investor to understand the current condition of a Deal, evaluate the strongest strategies, see the numbers that matter, identify material risks, understand what is missing, act on deadlines, and make a documented decision without searching across disconnected modules.

The Cockpit is not a generic dashboard. It is a decision system built around one canonical Deal.

---

## User Outcomes

The user must be able to answer, within seconds:

1. What Deal am I viewing?
2. What stage is it in?
3. What is BRIX currently recommending?
4. Which strategy is strongest and why?
5. What are the key financial results?
6. What risks could materially change the decision?
7. What information is missing or stale?
8. What deadlines or tasks require attention?
9. What changed since the last review?
10. What should I do next?
11. What evidence supports the recommendation?
12. Can I proceed, negotiate, monitor, or pass?

---

## Dependencies

Required completed or contractually stable systems:

- Authentication and workspaces
- Dashboard and application shell
- Deals and PDRM core
- Property intake and source tracking
- Deterministic underwriting engine
- Strategy intelligence engine

Future modules must plug into the Cockpit through canonical contracts:

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
- RELearnIQ
- Notifications

The Cockpit must render incomplete future modules through explicit availability, not dead navigation or fake results.

---

## Canonical Ownership

The Cockpit owns presentation and workflow composition only.

It does not own:

- Property facts
- Deal lifecycle truth
- Underwriting formulas
- Strategy ranking logic
- Financing calculations
- Contract findings
- Inspection findings
- Appraisal values
- Governance restrictions
- Market data
- AI-generated truth

All displayed values must be retrieved from canonical domain records and versioned outputs.

---

## Canonical Data Inputs

The Cockpit consumes, at minimum:

- `workspace`
- `portfolio`
- `property`
- `deal`
- `deal_stage_history`
- `deal_members`
- `assumption_set`
- `underwriting_snapshot`
- `underwriting_result`
- `strategy_scenario`
- `strategy_ranking`
- `recommendation`
- `decision`
- `risk_finding`
- `evidence`
- `evidence_finding`
- `task`
- `deadline`
- `activity`
- `domain_event`
- `financing_structure`
- `offer`
- `contract`
- `inspection`
- `appraisal`
- `governance_record`
- `visit`
- `report`
- `background_job`

No client-side aggregate may become canonical.

---

## Primary Screen Hierarchy

The Cockpit must present information in this order:

1. Deal identity and status
2. Current recommendation
3. Strongest strategy and selected strategy
4. Key financial results
5. Material risks and blockers
6. Confidence and freshness
7. Missing decision-changing information
8. Tasks and deadlines
9. What changed
10. Supporting modules and evidence
11. Full history and technical detail

The user must not be forced to open multiple modules to understand the current decision.

---

## Deal Header

The persistent Deal header must include:

- Property address or Deal title
- Property type
- Deal stage
- Listing or acquisition status where applicable
- Current owner/assignee
- Active portfolio
- Selected strategy
- Current recommendation state
- Last successful analysis time
- Stale/conflict/offline indicators
- Quick actions

### Quick actions

At minimum:

- Edit Deal
- Add evidence
- Add note
- Add photo
- Record voice note
- Add task
- Run or refresh analysis
- Compare strategies
- Prepare offer
- Generate report
- Get directions
- Share
- Archive or pass

Actions must be permission-aware and hidden when unavailable.

---

## Recommendation Panel

The recommendation panel must show:

- Current system recommendation
- User decision, if different
- Recommendation status
- Recommendation date/time
- Inputs version
- Engine version
- Strategy ranking version
- Confidence level
- Material assumptions
- Binding constraints
- Main reasons
- Conditions required to proceed
- Reasons to pass
- Next recommended action

### Recommendation states

- Research
- Visit
- Monitor
- Negotiate
- Prepare offer
- Submit offer
- Proceed with conditions
- Hold
- Pass
- Acquire
- Refinance
- Sell

The system recommendation and user decision must remain separate and historically preserved.

---

## Key Financial Metrics

Display only metrics applicable to the active property type and strategy.

Potential metrics:

- Purchase price
- Total acquisition cost
- Total project cost
- Cash required
- Loan amount
- Monthly debt service
- Gross income
- Effective gross income
- Operating expenses
- NOI
- Monthly and annual cash flow
- Cap rate
- Cash-on-cash return
- DSCR
- Break-even occupancy
- IRR
- Equity multiple
- Profit margin
- Return on cost
- Refinance proceeds
- Maximum allowable offer

### Metric rules

- Show units and currency.
- Show source scenario.
- Show freshness.
- Show assumptions behind the value.
- Distinguish current, baseline, conservative, and optimistic scenarios.
- Never show unsupported zeroes as actual values.
- Unknown values display as unknown, not blank or zero.
- Material warnings must appear beside affected metrics.

---

## Strategy Summary and Comparison

The Cockpit must display:

- Selected strategy
- Strongest strategy
- Highest cash-flow strategy
- Lowest-risk strategy
- Lowest-capital strategy
- Highest-confidence strategy
- Disqualified strategies
- Alternative strategies worth review

For each visible strategy:

- Rank
- Score
- Confidence
- Required cash
- Key return metrics
- Major risks
- Hard disqualifiers
- Missing inputs
- Why it ranks where it does

The user must be able to open full strategy comparison without losing Deal context.

---

## Risk Center

Risks must be grouped by domain:

- Property condition
- Financial
- Financing
- Market
- Legal/contract
- Governance/association
- Title/survey
- Inspection
- Appraisal
- Environmental
- Insurance
- Zoning/permits
- Tenant/lease
- Construction/development
- Operational
- Liquidity/exit
- Data quality

### Risk classes

- Confirmed blocker
- Material risk
- Potential concern
- Verification required
- Informational observation

Each risk must include:

- Summary
- Severity
- Confidence
- Source
- Source date
- Affected strategy
- Affected calculation or recommendation
- Required verification
- Suggested responsible party
- Resolution state

No AI observation may be presented as a confirmed professional finding.

---

## Confidence and Freshness

The Cockpit must distinguish confidence from freshness.

### Confidence domains

- Property facts
- Market
- Financial assumptions
- Financing
- Documents
- Governance
- Inspection
- Appraisal
- Strategy fit
- Overall decision

### Freshness states

- Current
- Current with pending evidence
- Recalculation required
- Processing
- Stale
- Conflicted
- Failed
- Offline local changes

A recommendation based on superseded assumptions must remain visible but be marked stale and non-current.

---

## Missing Information Queue

Display only missing items that could materially affect the Deal.

Each item must include:

- Missing field or evidence
- Why it matters
- Affected calculation
- Affected strategy
- Severity
- Suggested source
- Suggested responsible party
- Suggested next action
- Due date if applicable

The user must be able to convert an item into a task, upload request, question, or professional referral.

---

## Tasks and Deadlines

The Cockpit must show:

- Overdue
- Due today
- Due soon
- Upcoming critical
- Assigned to user
- Waiting on others
- Blocked
- Completed recently

Deadlines created from documents must retain source references and verification status.

The Cockpit must never imply that a document-extracted deadline is legally verified when it is not.

---

## Change Intelligence

The Cockpit must show what changed since the user's last meaningful review.

Examples:

- Purchase price changed
- Financing changed
- Inspection added repair costs
- Appraisal changed value confidence
- Contract introduced deadline
- Governance restriction disqualified strategy
- Market data updated
- Strategy rank changed
- Recommendation changed
- Task became overdue

Each change record must show:

- Before
- After
- Time
- Source
- Actor
- Affected outputs
- Whether recalculation completed

---

## Module Navigation

Required Deal modules:

- Overview
- Property
- Underwriting
- Strategies
- Market
- Financing
- Visits
- Photos and media
- Documents
- Governance
- Offer
- Contract
- Inspection
- Appraisal
- Tasks and deadlines
- Contacts
- Activity and history
- Reports
- Education

### Navigation rules

- Preserve active Deal.
- Preserve last meaningful location.
- Deep links must reopen correct module and record.
- Unavailable modules must be hidden or explicitly labeled unavailable.
- Module badges must reflect canonical outstanding work.
- No module may maintain private counts that disagree with the server.

---

## Web UX

### Desktop

Use a responsive multi-column layout:

- Persistent Deal navigation
- Central decision content
- Optional contextual rail for tasks, processing, or evidence

The layout must support dense professional review without visual clutter.

### Tablet web

Collapse secondary rails while preserving recommendation and next action.

### Mobile web

Use a stacked priority order. Do not attempt to reproduce desktop tables unchanged.

---

## Native iPhone UX

The iPhone Cockpit must prioritize field decisions.

Required behavior:

- One-handed navigation
- Recommendation summary above fold
- Key metrics in horizontally scrollable or stacked native cards
- Risk count and next action immediately visible
- Quick photo, voice note, task, and directions actions
- Offline status
- Background upload status
- Resume last Deal context
- Native sheets for quick edits
- No overloaded desktop-style grids

---

## Native iPad UX

The iPad Cockpit must use native multi-column layouts.

Required behavior:

- Deal list, Cockpit, and contextual detail may coexist
- Compare scenarios side by side
- Review document and Cockpit simultaneously
- Drag evidence into Deal modules
- Keyboard shortcuts
- Pointer support
- Resizable panes where practical
- No stretched iPhone layout

---

## Guided and Professional Modes

Both modes use the same canonical outputs.

### Guided mode

- Plain-language explanations
- Contextual RELearnIQ links
- Suggested next steps
- Definitions for financial metrics
- Clear warnings when professional review is appropriate

### Professional mode

- Higher information density
- Direct access to assumptions
- Formula traceability
- Source details
- Scenario controls
- Advanced filters

Switching modes must not alter calculations or hide material risk.

---

## Loading, Empty, Partial, and Failure States

Every Cockpit section must define:

- Initial loading
- Incremental loading
- Empty but valid
- Not yet configured
- Processing
- Partially complete
- Stale
- Conflict
- Offline
- Permission denied
- Failed
- Retry scheduled

A section must not show a perpetual spinner.

If a dependent provider fails, prior valid output remains visible with clear freshness and failure status.

---

## Background Jobs

The Cockpit must expose durable status for:

- Property import
- Source refresh
- Underwriting
- Strategy ranking
- Document extraction
- Photo analysis
- Voice transcription
- Inspection extraction
- Appraisal extraction
- Report generation
- Export
- Notifications
- Sync

Each job must include:

- Job ID
- Type
- State
- Progress where reliable
- Started time
- Last update
- Retry count
- Error category
- User recovery action

Retries must be idempotent.

---

## Offline and Sync Behavior

The user may:

- View last synced Deal
- Add notes
- Capture photos
- Record voice notes
- Create tasks
- Edit permitted draft fields

Offline changes must be clearly labeled and queued.

The system must:

- Preserve local work
- Sync when connectivity returns
- Detect version conflict
- Avoid silent overwrite
- Show unresolved conflicts
- Retain prior server state
- Allow manual resolution where needed

Canonical financial results must not be recalculated locally unless explicitly designed as non-authoritative previews.

---

## Performance Requirements

Targets under normal production conditions:

- Cockpit shell interactive within 2 seconds on supported broadband
- Cached Deal shell visible within 500 ms where safe
- Primary recommendation and metrics prioritized before secondary history
- Navigation response under 100 ms perceived latency where possible
- Large lists paginated or virtualized
- Heavy analysis asynchronous
- No full-page blocking for noncritical jobs

Performance targets must be measured, not assumed.

---

## Accessibility

Required:

- WCAG 2.2 AA web compliance
- Logical heading structure
- Keyboard navigation
- Visible focus
- Screen-reader labels
- Non-color status indicators
- Accessible charts and metric summaries
- Dynamic Type support
- VoiceOver support
- Reduce Motion support
- Minimum touch targets
- Error announcements

---

## Permissions

At minimum:

- View Deal
- Edit Deal
- Change stage
- Edit assumptions
- Run analysis
- Override recommendation
- Create decision
- Add evidence
- Manage tasks
- Share report
- Archive Deal
- Delete Deal

Permissions must be enforced server-side.

---

## Domain Events Consumed

Examples:

- `deal.created`
- `deal.updated`
- `deal.stage_changed`
- `property.updated`
- `assumption_set.activated`
- `underwriting.completed`
- `underwriting.failed`
- `strategy_ranking.completed`
- `recommendation.changed`
- `decision.recorded`
- `evidence.added`
- `risk.created`
- `risk.resolved`
- `task.created`
- `task.completed`
- `deadline.created`
- `financing.updated`
- `offer.updated`
- `contract.analyzed`
- `inspection.analyzed`
- `appraisal.analyzed`
- `governance.analyzed`
- `background_job.failed`

---

## Domain Events Emitted

Examples:

- `cockpit.viewed`
- `recommendation.opened`
- `strategy_comparison.opened`
- `decision.requested`
- `decision.recorded`
- `task.created_from_missing_information`
- `analysis_refresh_requested`
- `report_requested`
- `deal_shared`

Analytics events must not replace domain events.

---

## API and Query Contracts

Provide a canonical Cockpit query or composed backend endpoint that returns:

- Deal identity
- Current stage
- Current recommendation
- Current decision
- Current underwriting result
- Strategy summary
- Risks
- Confidence
- Freshness
- Missing information
- Tasks/deadlines
- Recent changes
- Module statuses
- Background jobs

The response must include version identifiers and timestamps sufficient to detect stale client data.

Avoid excessive client-side fan-out that creates inconsistent partial state.

---

## Audit Requirements

Audit:

- Recommendation override
- User decision
- Stage change
- Assumption change
- Analysis refresh
- Share action
- Archive/pass
- Risk resolution
- Deadline change
- Permission-sensitive access

Audit records must identify actor, time, Deal, prior value, new value, and source where applicable.

---

## Analytics

Measure:

- Time from Deal creation to first analysis
- Time from analysis to decision
- Most viewed risks
- Missing information resolution rate
- Recommendation override rate
- Reopen frequency
- Module usage
- Failed workflow rate
- Background-job failure rate
- Time spent in guided vs professional mode

Analytics may not expose sensitive Deal data unnecessarily.

---

## Acceptance Tests

### Core flow

1. User opens an existing Deal.
2. Cockpit loads canonical Deal context.
3. Current underwriting and strategy ranking display.
4. Recommendation displays with reasons and confidence.
5. Risks, missing information, tasks, and deadlines display.
6. User opens a risk and reaches its evidence.
7. User creates a task from missing information.
8. User changes an assumption.
9. Cockpit marks prior recommendation stale.
10. Recalculation completes.
11. Updated recommendation appears with change history.
12. User records a decision.
13. Decision persists after reload and app relaunch.

### Failure flow

1. Underwriting refresh fails.
2. Prior valid output remains visible.
3. Failure state and retry action display.
4. Retry does not create duplicate results.
5. Successful retry replaces stale status through a new version.

### Offline flow

1. User opens previously synced Deal offline.
2. Adds note, task, and photo.
3. Relaunches app while offline.
4. Work remains available.
5. Connectivity returns.
6. Sync completes without duplicate records.
7. Conflict is surfaced when server version changed.

### Cross-client flow

1. User records decision on web.
2. iPhone displays same decision.
3. iPad displays same decision.
4. PDF report displays same recommendation and metrics.
5. Admin view shows same canonical status.

---

## Regression Tests

- No Deal data leaks across workspaces.
- Recommendation does not remain current after accepted assumptions change.
- Background job failure does not erase prior result.
- Deep link opens correct Deal and module.
- Archived Deal cannot appear active without restore.
- Duplicate taps do not create duplicate decision or task records.
- Guided mode and professional mode show same canonical outputs.
- Reports reconcile to displayed results.
- Offline sync does not overwrite newer server changes silently.

---

## Definition of Done

This specification is complete only when:

- The Cockpit works end to end on web, iPhone, and iPad.
- All visible controls are connected.
- Recommendation, decision, metrics, risks, confidence, freshness, tasks, and changes are canonical.
- Save, reopen, refresh, relaunch, offline, retry, and conflict flows work.
- No stale output is presented as current.
- No module remains an isolated feature island.
- Cross-client values reconcile.
- Accessibility checks pass.
- Required unit, integration, E2E, RLS, and native tests pass.
- Exact verification commands and results are recorded.
- No unrelated files are changed.

Codex must finish implementation with either:

`CHAPTER COMPLETE`

or

`CHAPTER NOT COMPLETE`

A partial UI, mock data, disconnected cards, or unverified workflow is not complete.
