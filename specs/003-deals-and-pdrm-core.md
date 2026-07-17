# BRIX Specification 003 — Deals and PDRM Core

## 1. Authority and Rules of Engagement

Governed by `docs/00-START-HERE.md` through `docs/05-BUILD-ROADMAP.md`, plus Specifications 001 and 002.

Rules:

1. One canonical Property represents the durable asset; one canonical Deal represents a specific opportunity and decision lifecycle.
2. Every Deal-owned record carries `workspace_id` and `deal_id`; Property-specific records also carry `property_id` where applicable.
3. No subsystem may create a duplicate Deal, Property, contact, task, deadline, evidence, note, timeline, or activity system.
4. Property duplicate detection may suggest matches but may never silently merge.
5. Deal stage transitions are explicit, permission-aware, and historically preserved.
6. Material actions emit domain events once after successful persistence.
7. Archive, restore, delete, merge-candidate review, and ownership behavior must be intentional and auditable.
8. Offline-created drafts must synchronize idempotently and resolve conflicts safely.
9. Every Deal workflow must reopen at the last meaningful state.
10. All later specifications attach to this core rather than inventing private lifecycle state.

## 2. Mission

Create the durable Property Deal Relationship Management foundation that connects a property opportunity, people, organizations, evidence, activities, tasks, deadlines, notes, stages, decisions, and every specialized BRIX capability inside one trustworthy Deal workspace.

## 3. Canonical Entity Model

### Property

Required capabilities:

- Durable identity
- Normalized addresses
- Parcels
- Buildings
- Units
- Coordinates
- Legal descriptions
- Source identifiers
- Property relationships
- Duplicate candidates

A Property may participate in multiple Deals over time.

### Deal

Required fields and concepts:

- ID
- Workspace ID
- Display name
- Deal type
- Primary Property
- Additional Properties
- Stage
- Status
- Strategy intent
- Assigned users
- Priority
- Source
- Created/updated timestamps
- Archived/deleted timestamps
- Current recommendation pointer
- Current underwriting pointer
- Current financing pointer
- Current decision pointer

A Deal may represent one Property, a package, a portfolio acquisition, an assemblage, or a development site containing multiple parcels/buildings.

### Deal-to-Property relationship

`deal_properties` defines:

- Deal ID
- Property ID
- Role: primary, included, comparable, collateral, replacement, assemblage, other
- Inclusion status
- Notes

## 4. Deal Lifecycle

Canonical stages:

- Lead
- Screening
- Research
- Visit Planned
- Visited
- Underwriting
- Negotiation
- Offer Preparation
- Offer Submitted
- Under Contract
- Due Diligence
- Financing
- Closing
- Owned
- Stabilizing
- Operating
- Refinancing
- Disposition
- Sold
- Passed
- Archived

### Transition contract

Each transition must define:

- Allowed prior stages
- Required permission
- Required data or confirmation
- Blocking conditions
- Resulting tasks/deadlines
- Domain event
- Timeline entry
- Whether recalculation/recommendation refresh is required

The user may move backward when appropriate, but history remains intact.

## 5. Deal Status

Stage describes lifecycle position. Status describes operating condition.

Supported status examples:

- Active
- Needs Attention
- Waiting
- Blocked
- On Hold
- Passed
- Closed Won
- Closed Lost
- Archived
- Deleted Pending

Stage and status must not be collapsed into one ambiguous field.

## 6. Contacts, Organizations, and Relationships

Canonical entities:

- `contacts`
- `organizations`
- `deal_relationships`

Relationship roles include:

- Buyer/investor
- Seller/owner
- Listing broker
- Buyer broker
- Property manager
- Lender
- Mortgage broker
- Attorney
- Title/escrow
- Inspector
- Appraiser
- Contractor
- Architect/engineer
- Insurance professional
- Association manager
- Tenant
- Partner/investor
- Other

A contact or organization may relate to multiple Deals. Deal-specific role, status, notes, and communication preference live on the relationship, not duplicated contact records.

## 7. Tasks and Deadlines

One canonical system supports:

- Task
- Deadline
- Checklist item
- Assignment
- Priority
- Status
- Due date/time/timezone
- Source
- Related evidence/contract/finding
- Reminder policy
- Completion history
- Snooze/reassignment where allowed

Deadlines derived from contracts or other documents retain source term, trigger date, calculation rule, verification state, and timezone.

No module may create a private task list.

## 8. Timeline, Activity, Notes, and Comments

### Timeline

A canonical, chronological Deal history combining material:

- Stage/status changes
- Evidence receipt
- Accepted value changes
- Underwriting runs
- Strategy ranking changes
- Recommendation changes
- Tasks/deadlines
- Visits
- Offers/counters
- Contracts/amendments
- Financing
- Inspection/appraisal
- Reports/shares
- Decisions

Timeline entries link to the canonical record and are not a duplicate data store.

### Notes and comments

Support:

- Text notes
- Pinned notes
- Internal comments
- Mentions
- Voice-note references
- Evidence references
- Edit history

Notes do not silently become confirmed facts or assumptions.

## 9. Deal Creation Workflow

Entry points:

- Dashboard quick action
- Address intake
- Listing URL
- iOS share extension
- Manual entry
- Email/file intake
- Portfolio/package intake

Flow:

1. Confirm active workspace and permission.
2. Collect minimum opportunity information.
3. Search potential Property matches.
4. User selects existing Property or creates a new one.
5. Create Deal idempotently.
6. Record source and strategy intent.
7. Create default stage/status.
8. Emit Deal created event.
9. Open Decision Cockpit or intake continuation.

A provider failure must not block manual Deal creation.

## 10. Duplicate and Merge Handling

### Property duplicates

Potential match signals:

- Normalized address
- Parcel ID
- Coordinates
- Unit/building identifiers
- Legal description
- Source listing ID

User can:

- Use existing Property
- Create separate Property
- Mark not duplicate
- Request controlled merge

### Deal duplicates

Warn when an active Deal already exists for the same workspace, Property, and opportunity context. The user may open existing, create a new Deal with reason, or cancel.

### Merge

Merge must:

- Be permission-controlled.
- Preserve source IDs and history.
- Repoint allowed relationships transactionally.
- Surface conflicts.
- Never overwrite material accepted values silently.
- Emit audit and domain events.

## 11. Archive, Restore, and Delete

### Archive

- Reversible.
- Removes from active pipeline by default.
- Preserves all records and history.
- Revokes or preserves shares according to policy.

### Restore

- Permission controlled.
- Returns to appropriate stage/status.
- Revalidates stale data and background work.

### Delete

- Requires explicit confirmation.
- May enter deletion-pending state.
- Must respect retention, shared evidence, audit, and workspace/account-deletion rules.
- Must not leave orphan files, tasks, or shares.

## 12. Search, Filters, and Pipeline

Support search/filter by:

- Address
- Deal name
- Stage/status
- Property type
- Strategy
- Assigned user
- Contact/organization
- Risk/attention state
- Deadline
- Created/updated date
- Tags
- Portfolio

Pipeline views must derive from canonical Deal state and support web tables/boards and native-friendly list/group views.

## 13. Permissions

Minimum permission checks:

- View Deal
- Create Deal
- Edit Deal
- Change stage/status
- Assign users
- Manage contacts/relationships
- Manage tasks/deadlines
- Archive/restore
- Delete
- Merge Property/Deal candidates

All enforced server-side and by RLS.

## 14. Offline and Sync

Offline-safe actions may include:

- New Deal draft
- Notes
- Tasks
- Photos/voice references
- Visit updates

Requirements:

- Local IDs map safely to canonical IDs.
- Retried creates are idempotent.
- Conflicts are detected by version.
- Material conflicts require user resolution.
- The app distinguishes local, queued, syncing, synced, and failed state.
- Work survives app termination.

## 15. Web UX

Deal list/pipeline must provide:

- Search/filter/sort
- Attention indicators
- Stage/status
- Key summary
- Assignment
- Deadlines
- Quick open and safe batch actions

Deal workspace must preserve active Deal and module location.

## 16. iPhone UX

- Fast Deal search and recent Deals.
- Quick create.
- Current Deal shortcut.
- Field-ready notes/tasks/photos/voice.
- Offline state and queued work.
- Minimal taps to open Decision Cockpit or directions.

## 17. iPad UX

- Deal list plus workspace split view.
- Keyboard navigation and shortcuts.
- Drag/drop evidence where appropriate.
- Multi-column relationship/task/document context.

## 18. Domain Events

At minimum:

- `property.created`
- `property.updated`
- `property.merge_proposed`
- `property.merged`
- `deal.created`
- `deal.updated`
- `deal.stage_changed`
- `deal.status_changed`
- `deal.assigned`
- `deal.archived`
- `deal.restored`
- `deal.deletion_requested`
- `relationship.created`
- `task.created`
- `task.completed`
- `deadline.changed`
- `note.created`
- `decision.recorded`

Events are emitted once after persistence and feed dashboard, notifications, timeline, reports, and downstream workflows.

## 19. Performance

- Deal lists are paginated/virtualized.
- Search uses appropriate indexes.
- Timeline loads incrementally.
- Counts and attention summaries use optimized projections/materialized views where justified.
- Workspace/Deal cache keys are isolated.

## 20. Testing Requirements

- Domain tests for lifecycle transitions.
- Database tests for constraints and relationships.
- RLS tests for all roles.
- Integration tests for create, duplicate detection, stage/status, contacts, tasks, archive/restore/delete.
- E2E tests on web.
- Native UI/offline/sync tests.
- Merge and conflict tests.
- Search and large-list performance tests.

## 21. Verification and Validation

### Functional verification

- Property and Deal create, save, reopen, update, stage transition, search, archive, restore, and deletion workflows work.
- Contacts, relationships, tasks, deadlines, notes, and timeline persist and reopen.
- Duplicate submissions and retries do not duplicate records.

### Integration verification

- Dashboard uses canonical Deal/attention state.
- Intake attaches to the correct Property and Deal.
- Every later module can attach records without creating duplicate core systems.
- Events update timeline, tasks, notifications, reports, and recommendations as specified.

### Data verification

- Canonical IDs and workspace scope are present.
- No orphan records after archive/delete/merge workflows.
- History remains intact.
- RLS prevents cross-workspace access.

### UX verification

- Web, iPhone, and iPad workflows are complete.
- Loading, empty, stale, offline, conflict, permission, retry, and failure states are intentional.
- The user always knows the active Deal and next action.

### Definition of Done

Complete only when the canonical PDRM core supports every downstream module without duplicate ownership and a realistic Deal can move through lifecycle, relationships, tasks, and history across supported clients.

**SPECIFICATION STATUS: REVIEWED AND REPAIRED**
