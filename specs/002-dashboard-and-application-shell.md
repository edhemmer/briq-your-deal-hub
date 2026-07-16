# Specification 002 — Dashboard and Application Shell

## Authority

This specification is governed by:

- `docs/00-START-HERE.md`
- `docs/01-PRODUCT-CONSTITUTION.md`
- `docs/02-ENGINEERING-STANDARDS.md`
- `docs/03-DATA-ARCHITECTURE.md`
- `docs/04-UI-UX-SYSTEM.md`
- `docs/05-BUILD-ROADMAP.md`
- `specs/001-authentication-and-workspaces.md`

Codex must read all governing documents before implementation.

This specification defines the production dashboard, navigation system, application shell, global context, command patterns, responsive behavior, native iPhone shell, native iPad shell, loading states, error states, stale states, synchronization states, and cross-module connection rules for BRIX Real Estate.

This is not a landing page specification. It is the authenticated operating environment for the product.

---

# 1. Chapter Start Protocol

Before coding, Codex must restate and confirm:

1. BRIX uses one canonical Workspace, Property, Deal, and user context.
2. The dashboard may summarize canonical data but may not become a second source of truth.
3. Every visible dashboard control must open a complete destination or remain hidden.
4. Every count, status, score, deadline, recommendation, and alert must come from canonical records.
5. Web, iPhone, and iPad must show the same material state.
6. No client may fabricate data to make the dashboard appear populated.
7. Stale, processing, conflicted, offline, partial, and failed states must be intentionally designed.
8. Navigation must preserve Workspace, Deal, portfolio, filter, and return context.
9. Background jobs must expose durable status and recovery.
10. The dashboard must help a user decide what to do next.

Before implementation, Codex must state:

- Exact scope
- Existing code to retain or remove
- Canonical data sources
- Expected routes
- Expected components
- Expected APIs or database views
- Required domain events
- Web, iPhone, and iPad behavior
- Tests required
- Risks of duplicate state or disconnected navigation

---

# 2. Mission

The BRIX application shell must give the investor a fast, calm, premium, and accurate command center for all active real estate opportunities.

The user must be able to answer within seconds:

- What needs my attention?
- Which Deals changed?
- Which Deals are strongest?
- Which Deals are blocked?
- What deadlines are approaching?
- What should I do next?
- Which background processes are still running?
- Is the data current?
- Where was I working last?

The dashboard must reduce decision friction. It must not become a decorative analytics page.

---

# 3. User Types and Experience Modes

## 3.1 Supported users

- First-time investor
- Residential investor
- Multifamily investor
- Commercial investor
- Land investor
- Development investor
- Analyst
- Partner
- Contributor
- Viewer
- Workspace administrator
- Platform administrator

## 3.2 Guided mode

Guided mode must:

- Explain unfamiliar terms
- Show a smaller number of priority metrics
- Emphasize next actions
- Surface RELearnIQ links contextually
- Use plain-language risk descriptions
- Preserve access to underlying detail

## 3.3 Professional mode

Professional mode must:

- Increase information density
- Expose more columns and filters
- Support keyboard workflows
- Support rapid Deal switching
- Surface advanced financial and risk metrics
- Avoid unnecessary instructional text

Both modes use identical canonical data and calculations.

---

# 4. Canonical Shell Context

The shell must maintain the following context:

- Authenticated user
- Active Workspace
- User role and permissions
- Active portfolio, when applicable
- Active Deal, when applicable
- Last meaningful route
- Last meaningful Deal section
- Current filters and sort state
- Guided or professional mode
- Theme and accessibility preferences
- Network state
- Sync state
- Background job state
- Notification state

Context must survive:

- Browser refresh
- Browser back and forward navigation
- App relaunch
- Session refresh
- Safe sign-in restoration
- Temporary network loss
- Device rotation
- iPad multitasking

Context must not leak between Workspaces.

---

# 5. Web Information Architecture

## 5.1 Global navigation

Required primary destinations:

- Dashboard
- Deals
- Portfolio
- Tasks
- Reports
- RELearnIQ

Conditional destinations:

- Admin
- Billing
- Platform Operations

Global navigation must not expose modules that are unavailable, unauthorized, or incomplete.

## 5.2 Deal-level navigation

When a Deal is active, expose:

- Overview
- Property
- Underwriting
- Strategies
- Market
- Financing
- Visits
- Photos and Media
- Documents
- Governance
- Offer
- Contract
- Inspection
- Appraisal
- Tasks and Deadlines
- Contacts
- Activity and History
- Reports
- Education

The Deal-level navigation must remain stable. Items must not reorder based on data availability.

Unavailable sections may show a meaningful empty state, but never a dead page.

## 5.3 Global utility area

Required:

- Global search
- Create Deal
- Add evidence
- Notifications
- Background activity
- Help
- Workspace switcher
- Account menu

## 5.4 Route requirements

Every route must:

- Be directly addressable
- Support browser history
- Validate authorization
- Resolve canonical Workspace and Deal context
- Handle deleted, archived, inaccessible, or missing records
- Show loading, stale, permission, and error states
- Avoid redirect loops
- Preserve return path where appropriate

---

# 6. Dashboard Layout

## 6.1 Desktop and laptop structure

Recommended hierarchy:

1. Workspace and dashboard heading
2. Primary action area
3. Attention queue
4. Active Deals
5. Upcoming deadlines
6. Recent changes
7. Portfolio snapshot
8. Background activity
9. Educational or onboarding prompt, only when relevant

The dashboard must not use equal visual weight for every card.

## 6.2 Dashboard header

Must include:

- Workspace name
- Current date context
- Freshness indicator
- Create Deal action
- Optional portfolio scope
- Guided/professional mode control
- Relevant status or outage message

## 6.3 Attention queue

The attention queue is the highest-value dashboard area.

It may include:

- Deal blocked by missing information
- Contract deadline approaching
- Inspection deadline approaching
- Financing item requiring action
- Failed upload
- Failed document analysis
- Stale recommendation
- Material strategy ranking change
- New appraisal impact
- New inspection impact
- Counteroffer received
- Unresolved data conflict
- Account, billing, or usage issue

Every attention item must include:

- Deal or Workspace context
- What changed or requires action
- Severity
- Due date when applicable
- Freshness
- Primary action
- Direct link to exact workflow
- Dismiss, snooze, or resolve behavior where appropriate

Attention items must be generated from canonical tasks, deadlines, failures, conflicts, and domain events.

## 6.4 Active Deals section

Required fields, as available:

- Property/address
- Deal stage
- Selected strategy
- Strongest strategy
- Recommendation
- Deal score
- Key return metric
- Risk state
- Confidence
- Next action
- Next deadline
- Freshness
- Assigned user
- Last activity

Users must be able to:

- Sort
- Filter
- Search
- Change density
- Open Deal
- Open next action
- Save useful views
- Export where permitted

## 6.5 Upcoming deadlines

Required behavior:

- Group by urgency
- Respect Workspace time zone and user time zone
- Link to source evidence or contract term
- Show verification status
- Distinguish confirmed, inferred, and manually entered deadlines
- Allow complete, snooze, reassign, and edit where authorized

## 6.6 Recent changes

Show material activity only, including:

- Recommendation changed
- Strategy rank changed
- Underwriting rerun
- New evidence added
- Contract analyzed
- Inspection added
- Appraisal added
- Offer revised
- Deal stage changed
- User override recorded

Do not flood the feed with low-value UI events.

## 6.7 Portfolio snapshot

Where the user has multiple Deals, show:

- Total active Deals
- Deals by stage
- Capital required
- Expected cash flow
- Risk distribution
- Visit pipeline
- Offer pipeline
- Deals needing attention

Portfolio values must reconcile to canonical Deal results and expose `as of` state.

## 6.8 Background activity center

Show durable status for:

- Listing import
- Public-data retrieval
- Document upload
- OCR
- Contract analysis
- Photo analysis
- Voice transcription
- Underwriting
- Strategy ranking
- Report generation
- Export generation
- Large sync operations

Each job must show:

- Job type
- Deal
- Started time
- Current state
- Progress when meaningful
- Last update
- Retry status
- Failure reason in safe language
- Cancel option where safe
- Open result action

A job must not disappear merely because the user navigated away.

---

# 7. Premium UI Requirements

## 7.1 Visual direction

The authenticated product must feel:

- Premium
- Calm
- Purposeful
- Credible
- Precise
- Modern
- Data-rich without clutter

Avoid:

- Generic dashboard templates
- Excessive card grids
- Decorative gradients without purpose
- Oversized empty hero areas
- Excessive shadows
- Unnecessary glass effects
- Cartoon-like iconography
- Marketing-style animation inside critical workflows

## 7.2 Typography

- Use a disciplined type scale.
- Financial numbers must use tabular numerals.
- Monetary values must show currency.
- Percentages must show consistent precision.
- Headings must communicate hierarchy, not decoration.
- Supporting metadata must remain readable.

## 7.3 Color

- Use color to communicate state, not decorate every surface.
- Risk, confidence, success, warning, stale, conflict, and processing states must be distinct.
- Do not use color as the only indicator.
- Ensure sufficient contrast.

## 7.4 Cards and surfaces

- Cards must group one coherent concept.
- Avoid nested cards unless hierarchy requires it.
- Use borders, spacing, and background shifts intentionally.
- Interactive cards must have obvious focus and pressed states.
- Cards must not hide important actions behind hover-only behavior.

## 7.5 Tables and lists

Professional Deal lists must support:

- Sticky headers where useful
- Sorting
- Filtering
- Column selection
- Saved views
- Keyboard navigation
- Row selection
- Bulk action where safe
- Responsive list alternatives
- Clear empty and error states

## 7.6 Animation

Allowed animation:

- Navigation orientation
- State transition
- Confirmation
- Progress
- Expansion of supporting detail

Animation must:

- Be brief
- Be interruptible
- Respect reduced motion
- Never delay action
- Never conceal stale or failure state

---

# 8. Global Search

## 8.1 Search scope

Search must support, based on authorization:

- Deals
- Properties
- Addresses
- Parcel numbers
- Contacts
- Organizations
- Documents
- Reports
- Tasks

## 8.2 Search result requirements

Each result must show:

- Type
- Primary label
- Relevant secondary context
- Workspace
- Deal stage or status where applicable
- Last updated
- Direct destination

## 8.3 Search experience

- Debounce responsibly.
- Do not issue excessive provider requests.
- Show scope.
- Show loading and no-result states.
- Preserve query when returning from a result where useful.
- Support keyboard selection on web.
- Never display unauthorized records.

---

# 9. Command and Quick-Action System

Required context-aware commands:

- Create Deal
- Add property evidence
- Upload document
- Add photo
- Add voice note
- Add task
- Create route
- Generate report
- Open current decision
- Run underwriting
- Compare strategies
- Prepare offer

Commands must:

- Respect permissions
- Resolve active Deal context
- Prevent duplicate submission
- Show completion or queued state
- Preserve unsaved work
- Be reachable by keyboard on web where appropriate

---

# 10. Notification Center

The notification center must:

- Show unread and read state
- Group related updates
- Link to the exact Deal and workflow
- Preserve notification history according to policy
- Support mark read, mark unread, dismiss, or resolve as appropriate
- Distinguish informational, warning, urgent, and system notices
- Avoid duplicating task and alert information without reason

Notification count must come from canonical unread state, not client-local count.

---

# 11. Responsive Web Behavior

## 11.1 Desktop

- Full navigation
- Dense Deal table
- Multi-panel workflows where useful
- Keyboard shortcuts
- Persistent context

## 11.2 Tablet web

- Collapsible navigation
- Touch-friendly controls
- Reduced but useful table density
- No hover dependency

## 11.3 Mobile web

Mobile web must remain functional but does not replace the native app.

Required:

- Simplified navigation
- Deal cards instead of unusable wide tables
- Sticky primary action when appropriate
- Safe form layouts
- No horizontal scrolling as the only way to use a critical workflow

---

# 12. Native iPhone Shell

## 12.1 Primary navigation

The iPhone experience must prioritize field work and fast access.

Recommended primary areas:

- Home
- Deals
- Add
- Tasks
- Account

The central Add action may expose:

- New Deal
- Photo
- Voice note
- Document
- Task

## 12.2 iPhone home

Must emphasize:

- Attention required
- Today’s visits
- Upcoming deadlines
- Recent Deals
- Active background uploads
- Offline status

## 12.3 Deal navigation

Use native navigation patterns with:

- Deal summary
- Key actions
- Section list
- Return to last section
- Quick directions
- Quick photo
- Quick voice note
- Quick task

## 12.4 Field behavior

- One-handed use
- Large tap targets
- Safe-area compliance
- Clear upload state
- Offline capture
- Background retry
- No loss on app termination
- Deep links to exact Deal section

---

# 13. Native iPad Shell

The iPad app must be designed independently.

## 13.1 Required patterns

- Sidebar or multi-column navigation
- Deal list plus Deal workspace
- Document and analysis side by side
- Cockpit and comparison side by side
- Drag and drop
- Keyboard shortcuts
- Pointer support
- Multitasking
- State restoration

## 13.2 Prohibited pattern

A stretched iPhone screen is not acceptable.

## 13.3 iPad continuity

The app must preserve:

- Selected Deal
- Selected section
- Open document
- Comparison context
- Unsaved edits
- Split-view state where reasonable

---

# 14. Loading, Empty, Error, Stale, and Conflict States

Every dashboard section and route must define:

## 14.1 Loading

- Preserve layout
- Identify what is loading
- Avoid blocking unrelated content
- Use skeletons only when structurally accurate
- Provide timeout behavior

## 14.2 Empty

- Explain why the area is empty
- Explain what belongs there
- Provide the next useful action
- Do not show fake examples inside production state

## 14.3 Error

- Explain what failed
- Explain what was preserved
- Show whether the failure affects the Deal decision
- Offer retry or manual continuation
- Include support reference when appropriate

## 14.4 Stale

- Show `as of` date/time
- Explain why the result is stale
- Preserve prior valid output
- Offer refresh or rerun
- Prevent stale recommendation from appearing current

## 14.5 Conflict

- Detect version conflict
- Preserve both versions where needed
- Explain competing changes
- Allow authorized resolution
- Never silently overwrite

## 14.6 Offline

- Show offline status
- Distinguish local and synced changes
- Queue safe operations
- Block operations that require current server state with clear explanation
- Retry automatically where safe

---

# 15. Canonical Data Requirements

The dashboard may use optimized read models or database views, but:

- They must derive from canonical entities.
- They must not accept direct client writes.
- They must have documented refresh rules.
- They must expose source freshness.
- They must not contradict canonical Deal state.

Potential read models:

- Workspace attention summary
- Active Deal summary
- Deadline summary
- Portfolio summary
- Background job summary
- Recent material activity

Material dashboard values must include engine version or source version where relevant.

---

# 16. Domain Events and Connections

The shell and dashboard may consume:

- `deal.created`
- `deal.updated`
- `deal.stage_changed`
- `deal.archived`
- `deal.restored`
- `task.created`
- `task.completed`
- `deadline.created`
- `deadline.updated`
- `evidence.added`
- `underwriting.completed`
- `underwriting.failed`
- `strategy_ranking.changed`
- `recommendation.changed`
- `offer.updated`
- `contract.analyzed`
- `inspection.analyzed`
- `appraisal.analyzed`
- `background_job.updated`
- `sync.conflict_detected`
- `billing.issue_detected`

The shell must not create business conclusions. It displays and routes canonical outcomes.

---

# 17. Permissions

Dashboard content must be filtered by:

- Workspace membership
- Role
- Deal assignment where configured
- Record visibility
- Feature entitlement
- Platform-admin status

Permission checks must occur server-side.

The UI must not briefly display unauthorized information before hiding it.

---

# 18. Performance Targets

Target experience:

- Shell becomes interactive quickly on supported connections.
- Navigation remains responsive during background jobs.
- Large Deal lists use pagination or virtualization.
- Search results are bounded and paginated.
- Dashboard summary queries are optimized and indexed.
- Noncritical sections may load progressively.
- Critical attention and Deal state load first.

Performance budgets must be established and measured during implementation.

---

# 19. Accessibility

Required:

- WCAG 2.2 AA web target
- Logical heading structure
- Keyboard navigation
- Visible focus
- Screen-reader labels
- Announced loading and validation states
- Accessible tables or list equivalents
- Text alternatives for charts
- Dynamic Type on iOS
- VoiceOver on iPhone and iPad
- Reduced-motion support
- Sufficient contrast
- No color-only state communication

---

# 20. Analytics and Observability

Track product-use events without exposing sensitive Deal data unnecessarily.

Useful events:

- Dashboard viewed
- Attention item opened
- Deal opened
- Quick action used
- Search performed
- Search result opened
- Saved view used
- Background job retried
- Error recovery used

Operational telemetry must include:

- Dashboard query latency
- Search latency
- Failed route loads
- Background job failures
- Stale read-model detection
- Sync conflicts
- Deep-link failures

Logs must include correlation IDs and must not contain secrets.

---

# 21. Testing Requirements

## 21.1 Unit tests

- Status mapping
- Permission visibility
- Sort and filter logic
- Freshness calculation
- Attention-item prioritization
- Route generation

## 21.2 Integration tests

- Dashboard read models
- Workspace isolation
- Attention queue generation
- Notification count
- Background job state
- Deep-link resolution

## 21.3 Web E2E

- Authenticated user lands on dashboard
- Create Deal action works
- Deal list opens correct Deal
- Filters persist
- Attention item opens exact workflow
- Stale result displays correctly
- Failed job retries safely
- Unauthorized navigation is blocked
- Browser refresh preserves route

## 21.4 iPhone tests

- App relaunch restores session and meaningful location
- Quick photo/voice/document action preserves Deal context
- Offline state displays correctly
- Background upload state remains visible
- Deep link opens exact Deal section

## 21.5 iPad tests

- Sidebar and multi-column navigation
- Deal switching
- Split-view continuity
- Drag-and-drop entry points
- Keyboard shortcuts
- State restoration

## 21.6 Accessibility tests

- Keyboard-only web workflow
- Screen-reader navigation
- Dynamic Type
- VoiceOver
- Reduced motion
- Contrast

---

# 22. Acceptance Scenarios

## Scenario A — First successful login

1. User authenticates.
2. Workspace resolves.
3. Dashboard loads without fake data.
4. Empty state explains how to create the first Deal.
5. Create Deal opens the correct workflow.

## Scenario B — Active investor

1. User opens dashboard.
2. Attention queue shows a contract deadline.
3. User opens the item.
4. Correct Deal and Contract section open.
5. Returning to dashboard preserves filter and scroll context where practical.

## Scenario C — Stale recommendation

1. User changes a material assumption.
2. Prior recommendation becomes stale.
3. Dashboard marks it stale.
4. Recalculation job appears.
5. New result replaces the stale result only after successful canonical completion.

## Scenario D — Failed background job

1. Contract analysis fails.
2. Failure appears in background activity.
3. Original document remains available.
4. User retries.
5. Retry does not create duplicate document or findings.

## Scenario E — Cross-device consistency

1. User changes Deal stage on web.
2. iPhone and iPad refresh to the same stage.
3. Dashboard, Deal workspace, and reports agree.
4. Activity history records the change once.

## Scenario F — Offline field use

1. User opens a Deal on iPhone.
2. Device loses connectivity.
3. User captures a voice note.
4. Local state is clearly shown.
5. Sync resumes later.
6. Dashboard background activity reflects completion.

---

# 23. Definition of Done

This specification is complete only when:

- Web dashboard is production-quality.
- iPhone home and shell are production-quality.
- iPad shell is independently designed and production-quality.
- Navigation preserves canonical context.
- Every visible control works.
- No route is a dead end.
- No fake data is used.
- Dashboard values reconcile to canonical records.
- Stale, offline, failed, loading, empty, and conflict states work.
- Background activity is durable and retryable.
- Search and deep links open correct records.
- Permissions are enforced server-side.
- Accessibility checks pass.
- Cross-device material state reconciles.
- Required tests pass.
- Production web build succeeds.
- iPhone and iPad builds succeed.
- No unrelated files were changed.

Codex must finish with:

- Files changed
- Database/read-model changes
- API or Edge Function changes
- Routes created
- Components created
- Tests added
- Exact commands and results
- Known limitations
- Confirmation of no unrelated changes
- `SPECIFICATION COMPLETE` or `SPECIFICATION NOT COMPLETE`
