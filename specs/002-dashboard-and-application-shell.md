# BRIX Specification 002 — Dashboard and Application Shell

## 1. Authority and Rules of Engagement

Governed by `docs/00-START-HERE.md` through `docs/05-BUILD-ROADMAP.md`, `docs/12-INDIVIDUAL-INVESTOR-PRODUCT-REALIGNMENT.md`, and `specs/001-authentication-and-workspaces.md`.

Document 12 controls the product presentation of this shell: `workspace_id` remains the required tenancy and RLS boundary, but ordinary navigation should feel like an individual investor's BRIX account. Workspace switchers, collaborator controls, and access administration are secondary Settings surfaces unless the user explicitly needs them.

Rules:

1. The shell must preserve authenticated user, active workspace, active Deal, permissions, last meaningful location, background-job state, and sync state.
2. Navigation may not expose dead, unauthorized, or disconnected destinations.
3. Counts, badges, alerts, and attention items must come from canonical backend records.
4. Web, iPhone, and iPad use the same vocabulary and canonical records but platform-appropriate layouts.
5. A workspace change must prevent stale data from the prior workspace appearing in the new context.
6. Deep links must open the correct workspace, Deal, record, and workflow state.
7. Dashboard summaries are actionable; every metric links to its supporting records.
8. The shell must expose loading, offline, stale, conflict, permission, and background-processing status without overwhelming the user.
9. Guided and professional modes share data and functionality.
10. No shell behavior may hide failures or imply that local state is synchronized when it is not.

## 2. Mission

Create the premium BRIX operating environment that helps the user understand what needs attention, reach any authorized Deal or workflow quickly, resume interrupted work, and move consistently across web, iPhone, and iPad.

## 3. Scope

- Authenticated application shell
- Global navigation
- Dashboard
- Personal account context and technical workspace switcher when multiple authorized workspaces exist
- Deal switcher/recent Deals
- Global search
- Quick actions
- Notifications center
- Background-job center
- Offline/sync status
- Help and RELearnIQ entry
- Settings menu for account, privacy, billing, and optional trusted access
- Authorized admin entry
- Deep links
- Responsive and native layout behavior

## 4. Canonical Inputs

The shell reads but does not duplicate ownership of:

- User profile and preferences
- Active workspace and membership permissions
- Deals and assignments
- Tasks and deadlines
- Notifications
- Background jobs
- Recent activity
- Portfolio/pipeline summaries
- Sync/freshness metadata

Client caches are temporary projections, never canonical state.

## 5. Web Shell

### Layout

- Persistent primary navigation on larger screens.
- Compact/mobile navigation at narrow widths.
- Global header with workspace context, search, notifications, background jobs, account menu, and quick create.
- Main content with predictable width and responsive behavior.
- Deal-level navigation appears only when Deal context exists.

### Required behaviors

- Keyboard-accessible navigation and command actions.
- Skip links, landmarks, focus restoration, and visible focus.
- Browser refresh restores authorized location where safe.
- Unauthorized or removed routes redirect with explanation.
- Navigation during background work remains responsive.

## 6. iPhone Shell

- Native SwiftUI navigation.
- One-handed primary navigation.
- Quick access to Dashboard, Deals, Tasks, Current Deal, Quick Add, Photo, Voice Note, and Maps.
- Clear offline and queued-work indicator.
- Deep-link routing.
- Background upload and processing status.
- Scene restoration to the last safe location.
- No web-wrapper navigation.

## 7. iPad Shell

- Native multi-column or split-view architecture.
- Sidebar navigation.
- Deal list and Deal workspace may coexist.
- Support keyboard shortcuts, pointer, drag and drop, and multitasking.
- Document review and Deal context may coexist.
- Layout must not be a stretched iPhone interface.

## 8. Dashboard Information Architecture

Priority order:

1. Deals requiring attention
2. Deadlines due soon or overdue
3. Material recommendation changes
4. Failed or blocked processing
5. Visits scheduled
6. Recent Deal activity
7. Pipeline/portfolio summary
8. Quick actions
9. Education/help where contextually relevant

### Attention item contract

Each item includes:

- Canonical target
- Reason attention is required
- Severity/priority
- Due time where relevant
- Freshness
- Primary action
- Dismiss/snooze behavior where allowed
- Deep link

Attention items cannot be generated solely from client state.

## 9. Global Search

Search authorized records across:

- Deals
- Properties
- Contacts
- Organizations
- Tasks/deadlines
- Evidence/document metadata
- Reports

Requirements:

- Workspace-scoped authorization.
- Fast incremental results.
- Clear entity type and Deal context.
- Recent useful searches where appropriate.
- Empty, error, offline, and permission states.
- Deep links to the exact record.
- No sensitive content leakage through snippets.

## 10. Quick Actions

Context-aware actions may include:

- Create Deal
- Add Property/Listing
- Add Evidence
- Add Task
- Add Contact
- Add Photo
- Add Voice Note
- Plan Visit
- Generate Report
- Open Current Decision

Unavailable actions are hidden or disabled with a clear reason. Quick actions must use canonical workflows, not shortcuts that bypass validation or audit.

## 11. Notifications Center

The shell surfaces canonical notifications with:

- Type
- Deal/record context
- Created time
- Read state
- Priority
- Deep link
- Action state

Duplicate events must not produce duplicate notifications. Read state synchronizes across clients.

## 12. Background-Job Center

Expose:

- Job type
- Deal/target
- Queued/processing/complete/failed/blocked state
- Progress when meaningful
- Last update
- Retry/cancel action when permitted
- Safe error explanation
- Output link

Prior valid results remain available during reprocessing or failure.

## 13. Workspace and Deal Context

- Active personal BRIX context is visible or easily discoverable; technical workspace naming is avoided unless needed to resolve multi-workspace access.
- Workspace switching clears/re-scopes caches and in-flight requests.
- Active Deal is visible in Deal workflows.
- Deal navigation retains current Deal ID.
- Switching Deal warns about unsaved local work where necessary.
- Recently opened Deals are canonical/user-scoped and permission-aware.

## 14. Guided and Professional Modes

Guided mode:

- More explanatory labels
- Suggested next actions
- Contextual education
- Progressive disclosure

Professional mode:

- Higher information density
- Keyboard workflows
- Compact tables and controls
- Faster access to advanced actions

Mode changes affect presentation only, not data, permissions, calculations, or completion standards.

## 15. State Model

The shell intentionally handles:

- Session restoring
- No workspace
- Workspace loading
- Dashboard empty first use
- Dashboard loading
- Partial data
- Offline
- Local queued work
- Stale summary
- Background processing
- Permission change
- Revoked membership
- Provider failure
- Recoverable error
- Maintenance/degraded mode

No endless generic spinner is permitted.

## 16. Deep-Link Contract

A deep link includes enough context to resolve:

- Environment/client
- Workspace
- Deal
- Module
- Record
- Intended action or view

Resolution sequence:

1. Restore/obtain session.
2. Validate workspace membership.
3. Validate target permission.
4. Load target.
5. Route to the exact workflow state.
6. Provide recovery when moved, expired, deleted, or unauthorized.

## 17. Accessibility and Premium Design

- Follow `docs/04-UI-UX-SYSTEM.md` tokens and hierarchy.
- WCAG 2.2 AA for web.
- VoiceOver, Dynamic Type, Reduce Motion, and minimum touch targets for native.
- Color is never the sole status cue.
- Dashboard cards and metrics use consistent visual language.
- Avoid excessive nested cards, decorative animation, and framework-default appearance.

## 18. Performance

- Shell navigation remains responsive during data loading.
- Dashboard loads decision-critical items before secondary analytics where safe.
- Search is debounced and cancellable.
- Lists are paginated or virtualized.
- Caches use workspace/Deal keys and explicit invalidation.
- Workspace switches do not display prior workspace data.

## 19. Security

- Routes are permission-aware, but server/RLS remain authoritative.
- Search and summaries return only authorized records.
- Admin navigation appears only after verified platform-admin authorization.
- Deep links cannot bypass permissions.
- Sensitive values are absent from unsafe logs and notification previews.

## 20. Domain Events Consumed

- Account/workspace/membership events
- Deal lifecycle and assignment events
- Task/deadline events
- Recommendation changes
- Background-job events
- Notification events
- Report generation/share events
- Sync conflicts

Consumers must update projections idempotently.

## 21. Testing Requirements

- Component tests for navigation, states, cards, badges, search, and quick actions.
- Web E2E for workspace switch, Deal navigation, deep link, notification, search, and background-job retry.
- iPhone/iPad UI tests for navigation, restoration, offline indicator, deep links, and device-specific layouts.
- Permission-change and revocation tests.
- Accessibility tests.
- Cache-isolation and stale-state tests.
- Performance tests for large Deal/task lists.

## 22. Verification and Validation

### Functional verification

- Every navigation item, quick action, dashboard card, search result, notification, and job action works end to end.
- Browser refresh/app relaunch restores correct authorized context.
- Workspace and Deal switching preserve or safely resolve local work.

### Integration verification

- Auth context from 001 scopes every query.
- Deals/tasks/notifications/jobs use canonical records.
- Deep links open the correct connected subsystem.
- Material changes appear consistently across clients.
- No shell projection becomes a competing source of truth.

### UX verification

- Desktop, laptop, mobile web, iPhone, and iPad layouts are intentional.
- Loading, empty, partial, stale, offline, conflict, permission, and failure states are clear.
- Guided and professional modes remain functionally equivalent.
- Accessibility passes.

### Production gate

No dead navigation, fake counts, stale workspace data, broken deep links, endless processing states, or unauthorized content remains.

**SPECIFICATION STATUS: REVIEWED AND REPAIRED**
