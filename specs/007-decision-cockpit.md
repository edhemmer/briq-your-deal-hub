# BRIX Specification 007 — Decision Cockpit

## 1. Authority and Rules of Engagement

Governed by `docs/00-START-HERE.md` through `docs/05-BUILD-ROADMAP.md` and Specifications 001–006.

Rules:

1. The Decision Cockpit is the central operating view for one canonical Deal.
2. It reads canonical outputs; it does not create duplicate calculations, risk systems, tasks, evidence, or recommendations.
3. Current recommendation, user decision, selected strategy, and strongest system-ranked strategy remain distinct.
4. Stale, processing, incomplete, conflicted, and failed states must be visible.
5. Prior valid results remain available during recalculation or provider failure.
6. Every summary must drill into its assumptions, calculations, findings, and evidence.
7. The user must understand what changed and why.
8. The next action must be clear and permission-aware.
9. Web, iPhone, iPad, reports, and shared views must reconcile to the same canonical state.
10. No module badge, count, warning, or freshness indicator may be client-local or fabricated.
11. Guided and professional modes use the same underlying result.
12. Cockpit actions must connect to complete workflows, never dead ends.

## 2. Mission

Give an investor a calm, trustworthy, decision-first view of the current opportunity: what BRIX recommends, which strategy is strongest, what the numbers say, what risks or missing information matter, what changed, and what should happen next.

## 3. Priority Hierarchy

1. Current recommendation
2. Deal stage and status
3. Strongest viable strategy
4. User-selected strategy
5. Key financial outputs
6. Material risks and hard disqualifiers
7. Confidence and freshness
8. Missing decision-changing information
9. Critical deadlines and tasks
10. Next recommended action
11. Changes since prior result
12. Supporting assumptions, calculations, evidence, and activity

## 4. Canonical Inputs

- Deal and Property
- Active underwriting result
- Strategy ranking
- Recommendation history
- User decision history
- MarketIQ findings
- FinanceIQ structure/feasibility
- GovernanceIQ restrictions
- ContractIQ terms/deadlines
- OfferIQ status
- Visit/photo/voice findings
- Inspection/appraisal findings
- Tasks/deadlines
- Evidence and conflicts
- Background jobs

The Cockpit stores presentation preferences only; it does not duplicate source records.

## 5. Recommendation Contract

Display:

- Recommendation state
- Recommended action
- Rationale
- Active strategy
- Binding constraints
- Hard disqualifiers
- Confidence
- Freshness/as-of time
- Missing information
- Professional-review needs
- Prior recommendation comparison

Recommendation states may include:

- Research
- Visit
- Monitor
- Negotiate
- Prepare Offer
- Submit Offer
- Proceed with Conditions
- Hold
- Pass
- Acquire
- Refinance
- Sell

## 6. Key Financial Summary

Show property/strategy-appropriate metrics, such as:

- Price
- Total project cost
- Cash required
- Monthly/annual cash flow
- NOI
- Cap rate
- Cash-on-cash
- DSCR/debt yield
- IRR/XIRR
- Equity multiple
- Profit margin
- Maximum offer

Requirements:

- Units, currency, period, scenario, and freshness visible.
- Click/tap opens calculation lineage and assumptions.
- No client-side authoritative recalculation.
- Missing/unavailable metrics are explained rather than shown as zero.

## 7. Risk and Constraint Model

Separate:

- Hard disqualifiers
- Confirmed material risks
- Potential concerns
- Missing evidence
- Conflicts
- Informational observations

Each item includes:

- Severity
- Category
- Source
- Confidence
- Verification state
- Decision impact
- Suggested action
- Connected module

## 8. Missing Information and Readiness

Identify inputs that could materially change:

- Underwriting
- Strategy ranking
- Financing feasibility
- Maximum offer
- Contract decision
- Visit priority
- Closing readiness

Each missing item provides:

- Why it matters
- Required source/action
- Owner/assignee
- Due date where relevant
- Link to complete it

## 9. Next Action Engine

Next actions are deterministic/rule-based recommendations derived from canonical state. AI may explain them.

Examples:

- Complete missing assumptions
- Verify rent/taxes/insurance
- Schedule visit
- Upload association documents
- Compare financing
- Prepare offer
- Review contract deadline
- Obtain specialist inspection
- Update repair estimate
- Record pass/acquire decision

User may dismiss, defer, complete, or select a different action where allowed. History remains.

## 10. Change Summary

Show material changes since the prior accepted result:

- Changed facts/assumptions
- New evidence
- Financial deltas
- Strategy ranking changes
- Added/removed disqualifiers
- Confidence changes
- Recommendation change
- Deadline/task changes

Changes link to canonical history and source evidence.

## 11. Cockpit Sections

- Executive Decision
- Key Numbers
- Strategies
- Risks and Constraints
- Missing Information
- Financing
- Market/Location
- Governance
- Contract/Offer
- Visit/Photo/Inspection/Appraisal
- Tasks and Deadlines
- Recent Changes
- Evidence
- Reports
- Education

Sections use progressive disclosure and consistent status badges.

## 12. Web UX

- Decision summary above fold where practical.
- Stable Deal navigation.
- Responsive grid without excessive nested cards.
- Side panel/drawer for evidence or lineage when useful.
- Keyboard navigation and shortcuts.
- Scenario/version comparison.
- Sticky context for long analysis.

## 13. iPhone UX

- Compact decision summary.
- Swipe/tap-friendly prioritized sections.
- Fast next action.
- Current Deal and directions/visit access.
- Cached read-only view offline.
- Queued notes/tasks/evidence actions where allowed.

## 14. iPad UX

- Multi-column summary/detail.
- Comparison and source document coexistence.
- Keyboard/pointer support.
- No stretched phone layout.

## 15. State Model

- No underwriting yet
- Incomplete/blocking
- Processing
- Current
- Current with warnings
- Stale
- Conflict
- Partial module availability
- Failed recalculation with prior result
- Offline cached
- Permission restricted
- Archived/closed Deal

The screen must never imply a stale recommendation is current.

## 16. Actions and Permissions

Potential actions:

- Run/re-run underwriting
- Compare strategies
- Accept/edit assumption proposal
- Create/complete task
- Schedule visit
- Add evidence
- Open FinanceIQ/GovernanceIQ/ContractIQ/OfferIQ
- Generate report
- Record decision
- Archive/pass

Every action checks server-side permission and opens a complete connected workflow.

## 17. Domain Events Consumed

- Deal lifecycle
- Value acceptance/conflict
- Underwriting
- Strategy ranking
- Market/finance/governance/contract/offer
- Visit/media/inspection/appraisal
- Tasks/deadlines
- Reports
- Decisions
- Background jobs

Cockpit projections update idempotently and show source event time.

## 18. Performance

- Load core decision summary first.
- Lazy-load secondary modules.
- Cache with explicit Deal/version keys.
- Cancel stale requests after Deal switch.
- Paginate history/evidence.
- Avoid blocking entire Cockpit for noncritical provider work.

## 19. Security

- Workspace/Deal permission enforced on every query/action.
- Sensitive source snippets shown only to authorized users.
- Share views use explicit scoped projections.
- No admin-only data leaks into normal Cockpit.

## 20. Testing Requirements

- Component tests for all sections and state variants.
- Integration tests for each upstream event family.
- E2E journey from new Deal through recommendation and decision.
- Stale/failed recalculation tests.
- Cross-client reconciliation tests.
- Accessibility/keyboard/Dynamic Type/VoiceOver tests.
- Performance tests with large evidence/timeline volume.

## 21. Verification and Validation

### Functional verification

- A realistic Deal can be understood and acted upon from the Cockpit.
- Every summary links to the correct source/detail.
- Every visible action works end to end.
- User decisions and system recommendations remain distinct.

### Integration verification

- Underwriting and strategy values reconcile.
- Market, finance, governance, contract, offer, visit, inspection, and appraisal updates propagate correctly.
- Tasks, deadlines, timeline, notifications, reports, and portfolio views remain synchronized.

### State verification

- Current, stale, processing, incomplete, conflict, partial, failed, offline, and permission states are accurate.
- Prior valid results remain visible during failure.

### UX verification

- Decision, risks, missing information, deadlines, and next action are immediately clear.
- Web, iPhone, and iPad layouts are intentional and accessible.
- No dead end, fake badge, contradictory number, or unlabeled stale state remains.

### Definition of Done

Complete only when the Cockpit supports a full Deal journey and every connected module can update it through canonical records/events without duplicate logic.

**SPECIFICATION STATUS: REVIEWED AND REPAIRED**
