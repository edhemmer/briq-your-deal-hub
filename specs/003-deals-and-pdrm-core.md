# BRIX Specification 003 — Deals and PDRM Core

## Status
Authoritative implementation specification for the BRIX Property Deal Relationship Management core.

## Depends On
- `docs/00-START-HERE.md`
- `docs/01-PRODUCT-CONSTITUTION.md`
- `docs/02-ENGINEERING-STANDARDS.md`
- `docs/03-DATA-ARCHITECTURE.md`
- `docs/04-UI-UX-SYSTEM.md`
- `docs/05-BUILD-ROADMAP.md`
- `specs/001-authentication-and-workspaces.md`
- `specs/002-dashboard-and-application-shell.md`

## Permanent Rules

Before implementing this specification, Codex must re-read the governing documents above and enforce these rules:

1. One canonical `deal_id` per opportunity.
2. One canonical `property_id` per real-world property.
3. No module may create a shadow Deal, shadow Property, client-only source of truth, or duplicate lifecycle model.
4. All records are workspace-scoped and protected by server-side authorization and Row Level Security.
5. Material changes preserve history.
6. Every visible action must work end to end or remain hidden.
7. Every asynchronous process must expose durable status, retry, failure, and recovery behavior.
8. No stale result may be presented as current.
9. Web, iPhone, iPad, reports, exports, notifications, search, and admin must resolve to the same canonical records.
10. A workflow is incomplete until it saves, reopens, survives interruption, and remains consistent across clients.

---

# 1. Mission

The Deals and PDRM Core is the operational center of BRIX.

It must create one connected workspace for the entire life of a real estate opportunity, from the first address or listing through research, underwriting, visits, negotiations, contract, due diligence, financing, closing, ownership, operation, refinance, disposition, pass, or archive.

The PDRM core must connect:

- Property identity
- Deal identity
- Deal stage
- Strategy
- Financial assumptions
- Underwriting results
- People
- Organizations
- Tasks
- Deadlines
- Notes
- Voice notes
- Photos
- Documents
- Emails
- Visits
- Routes
- Financing
- Offers
- Contracts
- Governance records
- Inspections
- Appraisals
- Evidence
- Risks
- Recommendations
- Decisions
- Reports
- Sharing
- Notifications
- Audit history

No later BRIX module may bypass this core.

---

# 2. Business Purpose

The PDRM core exists to prevent fragmented real estate decision-making.

A user must not have to remember which spreadsheet, message, photo folder, email thread, contract version, lender quote, note, or report contains the current truth.

BRIX must make the Deal the single operational context.

The user must be able to answer at any time:

- What property is this?
- What opportunity are we evaluating?
- What stage is it in?
- Who is involved?
- What changed?
- What is due next?
- What evidence supports the current conclusion?
- What information is still missing?
- What is the current recommendation?
- What did the investor decide?
- Why was that decision made?

---

# 3. Scope

This specification governs:

- Canonical Property and Deal ownership
- Deal lifecycle
- Deal creation and reopen behavior
- Duplicate detection
- Deal workspace structure
- Deal timeline
- Domain events
- Tasks and deadlines
- Contacts and organizations
- Relationship roles
- Notes and annotations
- Attachments and evidence references
- Activity history
- Search and filtering
- Archive, restore, pass, and delete behavior
- Cross-client synchronization
- Offline behavior
- Conflict handling
- Background process status
- Permissions
- Auditability
- Acceptance tests

This specification does not define the detailed business rules for underwriting, strategies, documents, offers, inspections, appraisals, reports, billing, or AI extraction. Those systems must integrate through the contracts defined here.

---

# 4. Canonical Concepts

## 4.1 Workspace

A Workspace is the tenant and security boundary.

Every Property, Deal, contact, organization, task, event, document, report, and derived record belongs to one Workspace unless explicitly defined as platform-level reference data.

## 4.2 Property

A Property represents the real-world asset.

A Property is durable across multiple opportunities and ownership periods.

Examples:

- The same house evaluated in 2026 and again in 2031
- A multifamily asset evaluated by two different acquisition teams within the same Workspace
- A parcel that later becomes a development Deal
- A commercial building with multiple lease or refinance opportunities

## 4.3 Deal

A Deal represents one investment opportunity or managed transaction involving one or more Properties.

A Deal is not the same as a Property.

Examples:

- Purchase opportunity
- Refinance
- Disposition
- Lease-option acquisition
- Seller-financed acquisition
- Development project
- Portfolio acquisition
- Joint venture
- Ground lease
- Offer process
- Ownership business plan

## 4.4 Portfolio

A Portfolio groups Deals and/or owned Properties for operational and comparison purposes.

A Deal may belong to zero, one, or multiple portfolio groupings where business rules permit. Portfolio membership must not change the canonical ownership of Deal records.

## 4.5 Activity

An Activity is a user-facing historical entry.

Examples:

- Deal created
- Stage changed
- Note added
- Document uploaded
- Strategy ranking changed
- Offer submitted
- Inspection uploaded
- Decision recorded

## 4.6 Domain Event

A Domain Event is a machine-consumable, append-only event representing a completed material state change.

Domain Events drive targeted downstream behavior.

## 4.7 Audit Event

An Audit Event records security, administrative, compliance, and material data-change activity.

Audit Events are not editable by normal users.

---

# 5. Canonical Identifiers

Required immutable identifiers:

- `workspace_id`
- `property_id`
- `deal_id`
- `portfolio_id`
- `contact_id`
- `organization_id`
- `relationship_id`
- `task_id`
- `deadline_id`
- `activity_id`
- `domain_event_id`
- `audit_event_id`
- `note_id`
- `evidence_id`
- `visit_id`
- `report_id`

Use UUIDs generated server-side or by an approved collision-safe client strategy.

Identifiers must never encode business meaning.

Human-readable references may exist separately, such as:

- `deal_number`
- `display_name`
- `property_label`
- `external_reference`

Human-readable references may change. Canonical IDs may not.

---

# 6. Property Identity Model

## 6.1 Required Property Fields

Minimum canonical Property fields:

- `property_id`
- `workspace_id`
- `property_type`
- `property_subtype`
- `display_name`
- `address_line_1`
- `address_line_2`
- `city`
- `state_region`
- `postal_code`
- `country_code`
- `normalized_address`
- `latitude`
- `longitude`
- `parcel_number`
- `legal_description`
- `building_name`
- `unit_identifier`
- `year_built`
- `created_at`
- `created_by`
- `updated_at`
- `version`
- `archived_at`

Most fields may initially be unknown.

Unknown must remain distinct from blank, zero, false, and not applicable.

## 6.2 Property Types

Minimum supported canonical values:

- Single-family
- Condominium
- Townhouse
- Cooperative
- Two-to-four unit
- Multifamily
- Mixed use
- Office
- Medical office
- Retail
- Industrial
- Warehouse
- Flex
- Self-storage
- Hospitality
- Mobile-home park
- RV park
- Land
- Agricultural
- Development
- Special purpose
- Portfolio
- Other

Subtypes may extend the model without changing top-level semantics.

## 6.3 Duplicate Detection

Potential duplicates must be evaluated using:

- Normalized address
- Parcel number
- Coordinates
- Building name
- Unit number
- Legal description
- External listing IDs
- User-confirmed relationships

BRIX may show:

- Exact likely match
- Possible match
- No match

BRIX must never silently merge two Properties.

A merge must require:

- Authorized user action
- Preview of affected records
- Conflict summary
- Selected surviving Property
- Preserved merge history
- Audit event
- Reversible administrative recovery where technically practical

---

# 7. Deal Model

## 7.1 Required Deal Fields

Minimum Deal fields:

- `deal_id`
- `workspace_id`
- `primary_property_id`
- `deal_type`
- `display_name`
- `deal_number`
- `stage`
- `status`
- `priority`
- `selected_strategy_id`
- `current_recommendation_id`
- `assigned_owner_user_id`
- `source_type`
- `source_reference`
- `target_decision_date`
- `next_action_type`
- `next_action_due_at`
- `created_at`
- `created_by`
- `updated_at`
- `version`
- `passed_at`
- `archived_at`
- `closed_at`
- `deleted_at`

## 7.2 Deal Types

Minimum values:

- Acquisition
- Refinance
- Disposition
- Development
- Ownership business plan
- Lease or ground lease
- Joint venture
- Portfolio acquisition
- Note acquisition
- Other

## 7.3 Deal Status

Status and stage are separate.

Recommended status values:

- Active
- On hold
- Won
- Lost
- Passed
- Closed
- Archived
- Deleted pending purge

## 7.4 Deal Priority

Recommended values:

- Critical
- High
- Normal
- Low
- Monitor

Priority must not be conflated with Deal score.

---

# 8. Deal Lifecycle State Machine

## 8.1 Stages

Canonical stage order:

1. Lead
2. Screening
3. Research
4. Visit planned
5. Visited
6. Underwriting
7. Negotiation
8. Offer preparation
9. Offer submitted
10. Under contract
11. Due diligence
12. Financing
13. Closing
14. Owned
15. Stabilizing
16. Operating
17. Refinancing
18. Disposition
19. Sold
20. Passed
21. Archived

## 8.2 Stage Rules

- Stage changes must be explicit.
- Automatic stage suggestions are allowed.
- Automatic stage changes require a documented deterministic rule or user confirmation.
- Stage history is append-only.
- A user may move backward where permissions allow.
- A backward movement must not destroy later-stage records.
- A Deal may skip stages where valid.
- Required blockers must be visible before advancing.
- Stage-specific checklists may be generated but cannot hide existing tasks.

## 8.3 Stage Transition Record

Every stage transition records:

- `deal_id`
- Previous stage
- New stage
- Effective time
- Changed by
- Source
- Reason
- Related domain event
- Optional note

## 8.4 Stage-Specific Expectations

Examples:

### Lead
Minimal identity and source information.

### Screening
Preliminary facts, initial strategy, rough assumptions, and go/no-go screening.

### Research
Market, governance, property, financing, and evidence collection.

### Visit planned
Route, appointment, checklist, contacts, and visit date.

### Underwriting
Canonical assumptions and financial analysis underway.

### Offer preparation
Offer structure, maximum offer, contingencies, financing, and document package.

### Under contract
Executed contract, deadlines, title, inspection, appraisal, governance, and financing activities.

### Owned
Closing complete and ownership records established.

### Passed
Opportunity intentionally declined with preserved reason and evidence.

---

# 9. Deal Creation Workflow

## 9.1 Entry Points

A Deal may be created from:

- Dashboard quick action
- Global command palette
- Property search result
- Listing URL
- Address entry
- Shared listing from iPhone
- Imported email
- Uploaded file
- Existing Property
- Portfolio import
- Duplicate prior Deal as new opportunity

## 9.2 Minimum Creation Requirement

A Deal may be created with one of:

- Valid address
- Existing Property
- Listing URL
- Parcel identifier plus location
- Manual temporary property label

Temporary property labels must be marked incomplete and require later resolution.

## 9.3 Creation Steps

1. Capture source.
2. Resolve or create Property.
3. Check duplicates.
4. Create Deal.
5. Set stage to Lead or Screening.
6. Capture intended strategy if known.
7. Assign owner.
8. Create `deal.created` Domain Event.
9. Create Activity entry.
10. Open the Deal workspace.

## 9.4 Duplicate Deal Warning

Warn when the same Workspace already has an active Deal involving the same Property and Deal type.

The user may:

- Open existing Deal
- Create a separate Deal with reason
- Cancel

Never block legitimate separate opportunities.

---

# 10. Deal Workspace Information Architecture

Required Deal navigation areas:

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
- Education

The shell may hide unavailable modules behind feature flags, but may not show dead destinations.

## 10.1 Persistent Deal Header

Must include:

- Deal display name
- Property address or label
- Stage
- Status
- Priority
- Current recommendation summary
- Freshness indicator
- Assigned owner
- Next action
- Material warning count
- Save/sync state
- Overflow actions

## 10.2 Overview

The Overview must prioritize:

1. Current recommendation
2. Current selected strategy
3. Key financial result summary
4. Major risks
5. Missing decision-changing information
6. Upcoming deadlines
7. Next action
8. Recent activity
9. Background processing state

---

# 11. Tasks and Deadlines

## 11.1 Task Fields

- `task_id`
- `workspace_id`
- `deal_id`
- `title`
- `description`
- `task_type`
- `status`
- `priority`
- `assigned_user_id`
- `due_at`
- `source_type`
- `source_id`
- `created_at`
- `completed_at`
- `version`

## 11.2 Task Status

- Open
- In progress
- Waiting
- Blocked
- Complete
- Cancelled

## 11.3 Deadline Rules

Deadlines extracted from contracts or documents must retain:

- Source document
- Source page or clause
- Confidence
- Verification status
- Time zone
- Triggering date
- Calculation method
- Manual override history

A low-confidence extracted deadline may not become a critical notification until verified or explicitly accepted.

## 11.4 Task Completion

Completing a task must:

- Record actor and timestamp
- Emit event if material
- Update attention queues
- Preserve source relationship
- Avoid deleting the task

---

# 12. Contacts, Organizations, and Relationships

## 12.1 Contact

Minimum fields:

- Name
- Email
- Phone
- Preferred contact method
- Notes
- Workspace
- Source
- Created/updated metadata

## 12.2 Organization

Examples:

- Brokerage
- Seller entity
- Buyer entity
- Lender
- Title company
- Law firm
- Contractor
- Inspector
- Appraiser
- Association
- Property manager
- Municipality
- Insurance agency

## 12.3 Relationship Roles

Minimum role registry:

- Buyer
- Seller
- Listing broker
- Buyer broker
- Attorney
- Lender
- Loan officer
- Title contact
- Escrow contact
- Contractor
- Inspector
- Appraiser
- Property manager
- Association manager
- Tenant
- Partner
- Investor
- Guarantor
- Builder
- Developer
- Municipality contact
- Insurance contact
- Other

Relationships must include start/end dates, source, Deal scope, and optional Property scope.

## 12.4 Communication Actions

Where supported, the user may:

- Email
- Call
- Copy contact details
- Create follow-up task
- Add note
- Associate an imported email

BRIX must not silently send communications.

---

# 13. Notes

## 13.1 Note Types

- General
- Call note
- Meeting note
- Visit note
- Negotiation note
- Financing note
- Legal question
- Repair note
- Decision note
- Private note where permissions permit

## 13.2 Note Requirements

- Autosave draft
- Explicit saved state
- Author
- Timestamp
- Edit history
- Deal association
- Optional Property, contact, task, evidence, or visit association
- Mentions where collaboration is supported
- Search indexing

Deleting a note should use soft deletion and preserve audit history.

---

# 14. Evidence Attachment Contract

Every module attaching evidence to a Deal must use the canonical evidence contract.

Required fields:

- `evidence_id`
- `workspace_id`
- `deal_id`
- `property_id`
- `evidence_type`
- `source_type`
- `source_identifier`
- `original_file_id`
- `received_at`
- `effective_at`
- `uploaded_by`
- `classification`
- `verification_status`
- `processing_status`
- `confidence`
- `version`

Evidence may include:

- Document
- Photo
- Video
- Audio
- Email
- Web source snapshot
- User entry
- External data record
- Professional report

Original evidence is immutable.

Derived findings are separate records.

---

# 15. Activity Timeline

## 15.1 Purpose

The timeline provides a human-readable chronological history of meaningful Deal activity.

## 15.2 Timeline Items

Examples:

- Deal created
- Stage changed
- Contact added
- Task created
- Deadline verified
- Listing imported
- Underwriting recalculated
- Strategy ranking changed
- Visit completed
- Photo finding confirmed
- Contract uploaded
- Offer revised
- Inspection added
- Appraisal added
- Recommendation changed
- Decision recorded
- Report generated
- Share link created

## 15.3 Timeline Rules

- Timeline is chronological.
- Users may filter by category.
- System noise must be collapsed.
- Material changes must remain visible.
- Timeline items must deep-link to the related record.
- Deleted source records should leave a tombstone where auditability requires it.
- Timeline display does not replace the append-only Domain Event store.

---

# 16. Domain Events

## 16.1 Required Event Envelope

- `domain_event_id`
- `workspace_id`
- `deal_id`
- `property_id`
- `event_type`
- `event_version`
- `occurred_at`
- `actor_type`
- `actor_id`
- `source_client`
- `correlation_id`
- `causation_id`
- `idempotency_key`
- `payload`

## 16.2 Initial Event Registry

- `deal.created`
- `deal.updated`
- `deal.stage_changed`
- `deal.status_changed`
- `deal.assigned`
- `deal.archived`
- `deal.restored`
- `deal.passed`
- `deal.closed`
- `property.created`
- `property.updated`
- `property.merge_requested`
- `property.merged`
- `task.created`
- `task.updated`
- `task.completed`
- `deadline.created`
- `deadline.verified`
- `note.created`
- `note.updated`
- `evidence.added`
- `evidence.processing_changed`
- `relationship.created`
- `visit.created`
- `visit.completed`
- `underwriting.inputs_changed`
- `underwriting.completed`
- `strategy.ranking_changed`
- `recommendation.changed`
- `decision.recorded`
- `report.generated`

## 16.3 Event Rules

- Events are append-only.
- Consumers must be idempotent.
- Event schema changes require versioning.
- Failed consumers must retry safely.
- One consumer failure must not roll back the original completed business transaction unless the operation requires atomicity.
- Poison events must be quarantined with admin visibility.

---

# 17. API and Service Contracts

Exact transport may use Supabase RPC, Edge Functions, REST, or typed service methods, but semantics must remain stable.

Required operations:

- Create Deal
- Read Deal workspace summary
- Update Deal metadata
- Change stage
- Change status
- Assign owner
- Pass Deal
- Archive Deal
- Restore Deal
- Request delete
- Search Deals
- List Deals by filters
- Add Property to Deal
- Add/remove portfolio membership
- Create/update/complete task
- Create/verify deadline
- Create/update note
- Create relationship
- List timeline
- Add evidence reference

All mutating operations require:

- Authorization
- Version or concurrency check where material
- Idempotency key for retryable client actions
- Audit metadata
- Structured error code

---

# 18. Search, Filters, and Saved Views

## 18.1 Search Scope

Search may include:

- Deal name
- Address
- Parcel number
- Contact
- Organization
- Notes
- Source listing identifier
- Deal number
- Stage
- Strategy

Sensitive extracted document text must follow access rules.

## 18.2 Filters

Minimum filters:

- Stage
- Status
- Priority
- Assigned user
- Strategy
- Property type
- Market/location
- Portfolio
- Visit status
- Offer status
- Contract status
- Deadline state
- Risk state
- Recommendation
- Created/updated date

## 18.3 Saved Views

Users may save reusable Deal views.

Saved views must retain:

- Filters
- Sort
- Visible columns/cards
- Scope
- Owner
- Shared/private status where supported

---

# 19. Archive, Pass, Close, and Delete

## 19.1 Pass

Passing a Deal must:

- Require or strongly encourage a reason
- Preserve analysis and evidence
- Record effective date
- Cancel or retain tasks based on explicit user choice
- Emit `deal.passed`
- Keep the Deal searchable

## 19.2 Archive

Archive removes the Deal from active workflow without destroying it.

Archive must be reversible.

## 19.3 Close

Closing marks the transaction or lifecycle outcome complete.

Close may transition to Owned, Sold, Refinance complete, or another supported result.

## 19.4 Delete

Delete is not the same as archive.

Required behavior:

- Soft-delete request first
- Permission check
- Impact preview
- Retention policy
- Background purge where allowed
- Audit record
- Restore window where policy permits
- Prevent orphaned storage objects

A Property may not be deleted while retained Deals reference it unless an approved cascading policy exists.

---

# 20. Permissions

Minimum permission areas:

- View Deal
- Create Deal
- Edit Deal
- Change stage
- Assign Deal
- Manage tasks
- Manage contacts
- Add evidence
- Delete evidence
- Pass Deal
- Archive Deal
- Restore Deal
- Delete Deal
- Export Deal
- Share Deal
- View sensitive notes
- Manage portfolio membership

Permissions must be evaluated server-side.

UI hiding is not authorization.

---

# 21. Web UX Requirements

## 21.1 Deal List

Must support:

- Table and/or card views
- Responsive behavior
- Sort
- Filter
- Search
- Saved views
- Bulk archive/pass/assign where safe
- Clear status and stage
- Next action
- Key metric summary when available
- Freshness indicator
- Background job indicator

## 21.2 Deal Workspace

- Preserve selected module during refresh.
- Preserve unsaved drafts where practical.
- Use stable URLs.
- Support browser back/forward.
- Avoid full-page blocking for noncritical background work.
- Display stale and conflict states clearly.
- Provide keyboard navigation.

---

# 22. iPhone UX Requirements

The iPhone experience must prioritize field use.

Required:

- Recent Deals
- Search
- Quick Add Deal
- Current Deal
- Quick task
- Quick note
- Quick voice note
- Quick photo
- Directions
- Offline draft state
- Upload queue
- Sync status
- One-handed navigation
- Safe-area support
- Large touch targets

The app must reopen to the last meaningful Deal context when appropriate.

---

# 23. iPad UX Requirements

Required:

- Sidebar or multi-column navigation
- Deal list and Deal workspace side by side
- Document or evidence pane next to Deal context
- Drag and drop
- Keyboard shortcuts
- Pointer support
- Multitasking
- Responsive split view
- No stretched iPhone-only composition

---

# 24. Offline Behavior

## 24.1 Allowed Offline Actions

At minimum:

- View recently cached Deals
- Create draft Deal
- Edit permitted Deal fields
- Create tasks
- Add notes
- Capture photos
- Record voice notes
- Complete visit checklist

## 24.2 Offline Queue

Each queued mutation requires:

- Local operation ID
- Canonical intended record ID
- Timestamp
- User
- Base server version
- Retry count
- Current queue state
- Error detail safe for display

## 24.3 Reconciliation

- Nonconflicting fields may merge.
- Material conflicts require user resolution.
- Newer server state must not be silently overwritten.
- Uploaded media must be checksum-protected.
- Duplicate retries must remain idempotent.

---

# 25. Stale State and Freshness

The PDRM core must provide common freshness contracts to later modules.

Required concepts:

- `source_updated_at`
- `accepted_at`
- `calculated_at`
- `engine_version`
- `based_on_version`
- `stale_reason`
- `superseded_by_id`

When an accepted input changes:

- Dependent results become stale.
- Prior valid results remain visible.
- Stale label appears.
- Targeted recalculation is queued.
- New result replaces the current pointer only after successful completion.
- History preserves the prior result.

---

# 26. Conflict Handling

Conflicts may occur when:

- Two users edit the same Deal
- Offline and online changes overlap
- A Property is merged while another client edits it
- A stage changes during task completion
- An external import updates a manually edited field

Required response:

- Detect using version checks.
- Do not overwrite silently.
- Show field-level differences where practical.
- Preserve both values when reconciliation is uncertain.
- Record resolution actor and decision.
- Emit conflict-resolved event where material.

---

# 27. Background Jobs

PDRM-related jobs include:

- Listing import
- Address enrichment
- File processing
- Media upload
- Search indexing
- Timeline projection
- Notification dispatch
- Report generation
- Recalculation triggers

Each job must expose:

- Job ID
- Type
- Deal
- State
- Progress where meaningful
- Created time
- Started time
- Completed time
- Retry count
- Last error category
- User-safe message
- Correlation ID

No job may remain indefinitely in processing without timeout/escalation logic.

---

# 28. Notifications

PDRM may trigger notifications for:

- Assignment
- Mention
- Upcoming deadline
- Overdue task
- Failed upload
- Failed processing
- Material recommendation change
- Stage change
- Shared Deal access

Notifications must deep-link to the exact Deal and record.

Notification delivery failure must not remove the underlying task or deadline.

---

# 29. Error Model

Required error categories:

- Validation
- Authentication
- Authorization
- Not found
- Conflict
- Rate limit
- Provider unavailable
- Timeout
- Storage failure
- Processing failure
- Internal failure

User-facing errors must state:

- What failed
- What was preserved
- Whether the Deal decision is affected
- What the user can do next
- Support reference where appropriate

Raw stack traces and secrets must never be shown.

---

# 30. Performance Requirements

Targets should be measured in staging with realistic data.

Recommended initial targets:

- Deal list usable content under 2 seconds on normal broadband
- Deal header and overview shell under 2 seconds when cached data exists
- User action acknowledgement under 150 ms
- Search first results under 1 second for typical Workspace size
- Timeline pagination without full-history load
- Virtualization or pagination for large lists
- Media processing asynchronous
- No whole-Deal blocking for noncritical module work

---

# 31. Accessibility

- WCAG 2.2 AA for web
- VoiceOver support on iOS/iPadOS
- Dynamic Type
- Reduced Motion
- Logical focus order
- Keyboard support
- Accessible status announcements
- No color-only status communication
- Text alternatives for nontext indicators
- Validation errors linked to fields
- Minimum platform touch targets

---

# 32. Analytics and Product Telemetry

Permitted product telemetry may track:

- Deal created
- Deal reopened
- Stage changed
- Task completed
- Deal passed
- Search used
- Filter used
- Offline queue failure
- Conflict encountered
- Background job failed

Telemetry must not expose document content, sensitive notes, secrets, or protected data.

Operational telemetry must remain distinct from investor business records.

---

# 33. Security and RLS Requirements

At minimum:

- Every table includes `workspace_id` where applicable.
- Membership must be active.
- Read/write policies reflect role permissions.
- Storage objects use workspace and Deal path boundaries.
- Signed access is used for private files.
- Cross-workspace joins are prevented.
- Service-role operations are server-only.
- Audit access is restricted.
- Soft-deleted records are excluded by default.
- RLS tests cover owner, admin, contributor, viewer, removed member, and cross-workspace attacker cases.

---

# 34. Migration Requirements

Initial migrations must:

- Create canonical tables in dependency order.
- Create enums or validated lookup tables.
- Create indexes.
- Enable RLS.
- Create policies.
- Create updated/version handling where appropriate.
- Create append-only event protections.
- Create test fixtures for local development.

No migration may destroy existing production data without an explicit approved migration plan.

---

# 35. Required Test Matrix

## 35.1 Unit Tests

- Stage transition validation
- Duplicate matching helpers
- Permission resolution
- Status logic
- Next-action calculation
- Stale-state calculation
- Conflict detection

## 35.2 Database Tests

- Foreign keys
- Uniqueness rules
- Soft delete behavior
- Event append-only behavior
- Version increment behavior
- Index use for common queries

## 35.3 RLS Tests

- Correct Workspace read
- Cross-Workspace denial
- Viewer cannot mutate
- Contributor restrictions
- Admin access
- Removed member denial
- Storage access isolation

## 35.4 Integration Tests

- Create Deal from existing Property
- Create Deal from new Property
- Duplicate warning
- Stage change creates history and event
- Task completion updates activity
- Archive and restore
- Pass Deal
- Offline queued note sync
- Conflict resolution
- Background job status

## 35.5 Web E2E

1. Sign in.
2. Create Deal from address.
3. Resolve duplicate prompt.
4. Open Deal.
5. Add task and contact.
6. Change stage.
7. Add note.
8. Refresh browser.
9. Confirm state persists.
10. Archive and restore.

## 35.6 iPhone E2E

1. Open recent Deal.
2. Add voice note offline.
3. Add photo offline.
4. Reconnect.
5. Confirm upload and timeline entries.
6. Confirm web sees same records.

## 35.7 iPad E2E

1. Open Deal list and workspace split view.
2. Drag supported file into Deal.
3. Add task with keyboard.
4. Open evidence beside Deal overview.
5. Confirm sync across clients.

---

# 36. Acceptance Criteria

This specification is accepted only when:

- A user can create a Property and Deal.
- Duplicate warnings work without preventing valid separate Deals.
- Deal persists and reopens across web, iPhone, and iPad.
- Stage history is preserved.
- Tasks, deadlines, notes, contacts, and relationships attach to the canonical Deal.
- Activity timeline deep-links correctly.
- Domain Events are append-only and idempotently consumed.
- Archive, restore, pass, close, and delete behave distinctly.
- RLS prevents cross-workspace access.
- Offline actions reconcile safely.
- Conflicts are detected and not silently overwritten.
- Background jobs expose durable status.
- Stale state is visible.
- Every visible control works.
- No orphan records are created.
- Search and filters return authorized canonical records.
- Accessibility checks pass.
- Required automated tests pass.

---

# 37. Definition of Done

Codex may mark this specification complete only after reporting:

1. Exact files changed
2. Database migrations added
3. RLS policies added
4. APIs, RPCs, or Edge Functions added
5. Shared contracts added
6. Web screens completed
7. iPhone screens completed
8. iPad screens completed
9. Offline and conflict behavior implemented
10. Tests added
11. Exact verification commands and results
12. Known limitations
13. Confirmation that no unrelated files changed
14. `SPEC 003 COMPLETE`

If any material requirement remains unimplemented or unverified, report:

`SPEC 003 NOT COMPLETE`
