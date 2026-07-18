# BRIX Specification 022 — Notifications, Tasks, and Deadlines

## 1. Authority and Rules of Engagement

This specification is governed by:

- `docs/00-START-HERE.md`
- `docs/01-PRODUCT-CONSTITUTION.md`
- `docs/02-ENGINEERING-STANDARDS.md`
- `docs/03-DATA-ARCHITECTURE.md`
- `docs/04-UI-UX-SYSTEM.md`
- `docs/05-BUILD-ROADMAP.md`
- Specifications 001–021

Rules of engagement:

1. BRIX uses one canonical task system, one canonical deadline system, and one canonical notification system across every module.
2. Modules may propose tasks, deadlines, reminders, and alerts, but may not create disconnected module-specific workflow stores.
3. Contractual, legal, financial, inspection, appraisal, governance, offer, financing, and closing deadlines must preserve source, trigger, timezone, calendar rule, confidence, verification state, and responsible party.
4. AI may draft task proposals, summaries, priorities, and reminder language. AI may not determine authoritative dates, silently create obligations, or mark work complete without an explicit accepted workflow.
5. Every task and deadline mutation must be authorized, persisted, auditable, idempotent where applicable, and visible on all supported clients.
6. Notifications are delivery records, not the source of truth. Failure to deliver a notification must not alter the underlying task or deadline.
7. Critical deadlines must remain visible in BRIX even when email, push, SMS, calendar sync, or background workers fail.
8. Notification channels must respect user preferences, workspace policy, quiet hours, timezones, permissions, sensitivity, and device state.
9. No duplicate delivery may be treated as a separate task or deadline.
10. Rescheduling, snoozing, reassigning, completing, reopening, canceling, and superseding must preserve history.
11. Stale, unresolved, conflicted, unverified, and past-due states must never be hidden.
12. Web, iPhone, iPad, reports, calendar feeds, timeline, Decision Cockpit, and admin operations must reconcile to the same canonical state.
13. Every asynchronous operation must expose queued, processing, delivered, failed, retrying, suppressed, expired, and canceled states where applicable.
14. No feature is complete until task creation, save, reopen, reminder delivery, deep link, failure recovery, audit, and cross-module synchronization are verified.

## 2. Mission

Provide a dependable workflow layer that converts Deal obligations, due-diligence items, missing information, user commitments, professional recommendations, transaction dates, and operational follow-ups into clear, prioritized, accountable actions.

The subsystem must answer:

- What must be done?
- Why does it matter?
- Who owns it?
- When is it due?
- What source or event created it?
- What is blocked?
- What changed?
- What is overdue or at risk?
- Which reminders were sent, suppressed, failed, or acknowledged?
- What happens next when the task is completed, missed, canceled, or superseded?

## 3. Canonical Ownership

This subsystem owns:

- Canonical tasks
- Canonical deadlines
- Task dependencies
- Task assignments
- Reminder schedules
- Notification preferences
- Notification jobs
- Notification delivery records
- Escalation rules
- Snooze records
- Acknowledgements
- Calendar publication records
- Task templates and workflow templates
- Workflow automation execution state for notifications and tasks

This subsystem does not own:

- Deal or Property facts
- Contract terms
- Offer terms
- Financing terms
- Inspection or appraisal findings
- Governance findings
- Underwriting calculations
- Strategy rankings
- Evidence originals
- User permissions
- AI-generated facts

Those remain owned by their respective specifications.

## 4. Canonical Entities

### 4.1 `tasks`

Required fields:

- `id`
- `workspace_id`
- `deal_id` nullable for workspace-level tasks
- `property_id` nullable
- `title`
- `description`
- `task_type`
- `status`
- `priority`
- `assigned_user_id` nullable
- `assigned_contact_id` nullable
- `created_by`
- `source_module`
- `source_record_type`
- `source_record_id`
- `source_evidence_id` nullable
- `due_at` nullable
- `start_at` nullable
- `timezone`
- `all_day`
- `verification_state`
- `completion_requires_evidence`
- `completed_at` nullable
- `completed_by` nullable
- `canceled_at` nullable
- `superseded_by_task_id` nullable
- `version`
- `created_at`
- `updated_at`

Supported statuses:

- Draft
- Proposed
- Open
- In Progress
- Blocked
- Waiting
- Completed
- Reopened
- Canceled
- Superseded
- Archived

### 4.2 `deadlines`

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `property_id` nullable
- `deadline_type`
- `title`
- `description`
- `source_module`
- `source_record_type`
- `source_record_id`
- `source_evidence_id` nullable
- `source_anchor` nullable
- `trigger_type`
- `trigger_date` nullable
- `offset_value` nullable
- `offset_unit` nullable
- `business_day_rule`
- `holiday_calendar`
- `timezone`
- `calculated_due_at`
- `user_confirmed_due_at` nullable
- `authoritative_due_at`
- `verification_state`
- `confidence`
- `criticality`
- `status`
- `canonical_task_id` nullable
- `supersedes_deadline_id` nullable
- `created_at`
- `updated_at`

Supported statuses:

- Candidate
- Verification Required
- Confirmed
- Active
- Satisfied
- Missed
- Waived
- Extended
- Canceled
- Superseded
- Disputed

### 4.3 `task_dependencies`

Store predecessor task, successor task, dependency type, blocking state, resolution state, and audit metadata.

Dependency types:

- Finish to start
- Start to start
- Evidence required
- Approval required
- External response required
- Canonical event required

### 4.4 `reminder_rules`

Required fields:

- `id`
- `workspace_id`
- `task_id` or `deadline_id`
- `channel`
- `offset_value`
- `offset_unit`
- `absolute_send_at` nullable
- `repeat_rule` nullable
- `escalation_level`
- `recipient_user_id` nullable
- `recipient_contact_id` nullable
- `enabled`
- `created_by`
- `created_at`

### 4.5 `notification_jobs`

Required fields:

- `id`
- `workspace_id`
- `user_id`
- `task_id` nullable
- `deadline_id` nullable
- `notification_type`
- `channel`
- `scheduled_for`
- `status`
- `idempotency_key`
- `attempt_count`
- `last_attempt_at`
- `next_attempt_at`
- `failure_code`
- `failure_message_safe`
- `provider_message_id` nullable
- `created_at`
- `updated_at`

### 4.6 `notification_deliveries`

Store job ID, recipient, channel, delivered time, opened time, acknowledged time, action taken, provider response, suppression reason, bounce/failure state, and correlation ID.

### 4.7 `notification_preferences`

Preferences must support:

- In-app
- Push
- Email
- SMS only where explicitly supported and consented
- Quiet hours
- Timezone
- Digest frequency
- Critical deadline override policy
- Lock-screen privacy
- Workspace default inheritance
- Per-module preferences
- Per-Deal overrides

## 5. Task Sources

Tasks may originate from:

- Manual user entry
- Deal stage transitions
- Missing underwriting inputs
- Strategy verification requirements
- MarketIQ research findings
- FinanceIQ lender conditions
- GovernanceIQ restrictions or document requests
- ContractIQ obligations and deadlines
- OfferIQ negotiation follow-up
- VisitIQ field observations
- PhotoIQ verification findings
- InspectionIQ repair or specialist recommendations
- AppraisalIQ conditions or reconsideration items
- ReportIQ follow-up
- RELearnIQ guided workflow
- Admin/support operations
- AI-generated proposal accepted by an authorized user

Every generated task must retain its source and must not become canonical until the owning workflow permits it.

## 6. Deadline Calculation Engine

Deadline calculation must be deterministic.

Inputs may include:

- Fixed date/time
- Trigger event
- Trigger date
- Calendar-day offset
- Business-day offset
- Month offset
- End-of-day convention
- Timezone
- Holiday calendar
- Weekend rule
- Cure period
- Extension terms
- Amendment or supersession

Rules:

1. A candidate date remains `Verification Required` until the source and trigger are sufficiently verified.
2. ContractIQ controls extracted contract terms; this subsystem controls accepted canonical scheduling and reminder execution.
3. Amendments create a new deadline version and preserve the prior deadline.
4. Manual edits require reason and audit history.
5. Timezone changes must never silently shift the intended local deadline.
6. Daylight-saving transitions must be tested.
7. Missed deadlines remain visible and may create escalation tasks.
8. Critical deadlines cannot be dismissed without explicit acknowledgement or authorized resolution.

## 7. Task Lifecycle

Required lifecycle:

1. Task is proposed or created.
2. Authorization and required source context are validated.
3. Assignee and due state are established.
4. Reminder rules are generated or selected.
5. Task appears in Deal workspace, dashboard, Cockpit, timeline, and supported native clients.
6. User starts, updates, blocks, snoozes, reassigns, or completes the task.
7. Completion validation runs.
8. Required evidence or approval is captured.
9. Connected modules receive the persisted completion event.
10. Audit history is recorded.
11. Dependent tasks or calculations are updated.

Completion must not be accepted when required evidence, approval, or canonical conditions are missing.

## 8. Priority and Risk Model

Priority and criticality are separate.

Priority:

- Low
- Normal
- High
- Urgent

Criticality:

- Informational
- Operational
- Financial
- Transaction Critical
- Legal/Contract Critical
- Safety Critical

Ranking may consider:

- Time remaining
- Dependency impact
- Deal stage
- Financial impact
- Risk severity
- Verification state
- Assignee availability
- Missed prior reminders

AI may explain or propose prioritization, but deterministic rules control escalation and critical deadline visibility.

## 9. Notification Channels

### 9.1 In-app

Must support:

- Notification center
- Unread state
- Grouping
- Deep links
- Acknowledge
- Mark read/unread
- Dismiss where permitted
- Action buttons
- Delivery history

### 9.2 Push

Must support:

- Device token lifecycle
- Environment isolation
- Permission state
- Quiet hours
- Sensitive-content redaction
- Deep links
- Duplicate suppression
- Expired token cleanup
- Foreground behavior

### 9.3 Email

Must support:

- Verified recipient
- Transactional templates
- Safe subject lines
- Deep links
- Unsubscribe/preferences where applicable
- Bounce and suppression handling
- No sensitive data beyond approved scope

### 9.4 SMS

SMS is optional and must not be enabled without explicit product approval, consent, verified phone number, compliant messaging registration, opt-out handling, rate controls, and cost monitoring.

## 10. Reminder and Escalation Logic

Reminder patterns may include:

- At creation
- At assignment
- Fixed time before due date
- Repeating until acknowledged
- Daily digest
- Overdue reminder
- Escalation to owner or workspace admin
- Escalation after dependency failure
- Escalation after delivery failure

Escalation rules must define:

- Trigger
- Recipient
- Channel
- Delay
- Maximum repeats
- Stop conditions
- Required acknowledgement
- Audit behavior

No escalation may expose private Deal information to an unauthorized recipient.

## 11. Calendar Integration

BRIX may support:

- Calendar export
- ICS download
- Read-only subscription feed
- Google or Apple calendar handoff
- Native calendar add action

Rules:

- BRIX remains canonical for task/deadline status.
- Calendar events must include stable BRIX identifiers.
- Calendar edits do not silently overwrite BRIX.
- Duplicate calendar events must be prevented.
- Revoked access must invalidate future feed access where supported.
- Sensitive details must be scope controlled.

## 12. User Experience

### 12.1 Web

Required surfaces:

- Global task center
- Deal task panel
- Deadline timeline
- Today / Upcoming / Overdue views
- Assigned to me
- Blocked and waiting views
- Filters and saved views
- Bulk actions with safeguards
- Calendar view
- Notification center
- Preference center

### 12.2 iPhone

Must support:

- Today view
- Upcoming and overdue
- Quick complete
- Snooze
- Reassign where permitted
- Deep-linked notification actions
- Offline task updates
- Clear sync state
- Large touch targets

### 12.3 iPad

Must support:

- Multi-column task and Deal context
- Calendar and list side by side
- Keyboard shortcuts
- Drag and drop where safe
- Bulk triage
- Split view with source document or Deal Cockpit

### 12.4 Required states

Every surface must define:

- Loading
- Empty
- Populated
- Partial
- Offline
- Stale
- Syncing
- Queued
- Failed
- Retry
- Conflict
- Permission denied
- Access revoked
- Past due
- Suppressed notification
- Delivery failure

## 13. Offline and Synchronization

Offline-capable actions:

- Create task draft
- Update title, notes, priority, and status
- Complete non-critical tasks where no server-only validation is required
- Snooze
- Add completion evidence reference

Rules:

- Each mutation receives a stable client mutation ID and idempotency key.
- Material conflicts must not be silently merged.
- Critical deadline changes require server validation.
- Offline completion remains `Pending Sync` until accepted by the server.
- Revoked access blocks queued mutations and protects cached data.

## 14. Security and Privacy

Requirements:

- Workspace and Deal authorization
- RLS on all task, deadline, preference, and delivery records
- Server-side scheduling and privileged delivery
- Encrypted secrets
- Minimal sensitive content in notifications
- Token and provider ID protection
- Audit logging
- Rate limits
- Abuse protection
- Consent tracking for external channels
- Safe logs without document contents or sensitive Deal facts
- Provider webhook verification
- Secure deep links

## 15. Reliability and Performance

Requirements:

- Task writes acknowledge promptly.
- Notification scheduling is asynchronous and idempotent.
- Duplicate events do not create duplicate notifications.
- Delivery retries use bounded exponential backoff.
- Poison jobs move to a reviewable dead-letter state.
- Worker failure does not corrupt tasks or deadlines.
- Critical deadlines receive monitoring for scheduling gaps.
- Notification center and task lists paginate efficiently.
- Large workspaces support filtering and indexed queries.
- Prior valid state remains visible during background failure.

## 16. Domain Events

Emit at minimum:

- `task.proposed`
- `task.created`
- `task.assigned`
- `task.started`
- `task.blocked`
- `task.completed`
- `task.reopened`
- `task.canceled`
- `task.superseded`
- `deadline.candidate_created`
- `deadline.confirmed`
- `deadline.changed`
- `deadline.missed`
- `deadline.satisfied`
- `reminder.scheduled`
- `notification.queued`
- `notification.delivered`
- `notification.failed`
- `notification.opened`
- `notification.acknowledged`
- `notification.suppressed`

Consumers include dashboard, Decision Cockpit, timeline, ContractIQ, OfferIQ, FinanceIQ, GovernanceIQ, InspectionIQ, AppraisalIQ, ReportIQ, admin operations, native clients, and observability.

## 17. Testing Requirements

Required tests:

- Task CRUD and lifecycle
- Assignment and permissions
- Dependency and blocking rules
- Deadline calculation fixtures
- Timezone and daylight-saving fixtures
- Business-day and holiday-calendar fixtures
- Amendment and supersession tests
- Reminder scheduling and duplicate suppression
- Email and push delivery simulations
- Bounce, invalid token, suppression, and retry tests
- Quiet-hour and preference tests
- Deep-link authorization tests
- Offline queue and conflict tests
- RLS and workspace isolation tests
- High-volume task and notification tests
- Accessibility tests
- Web/iPhone/iPad reconciliation
- Failure recovery and dead-letter handling

## 18. Verification and Validation

### Functional verification

- Tasks can be created, assigned, saved, reopened, started, blocked, completed, reopened, canceled, and superseded.
- Deadlines calculate correctly from verified source terms and triggers.
- Reminder schedules execute at the intended local time.
- Delivery failures do not change underlying task or deadline state.
- Deep links open the correct authorized destination.
- Offline changes reconcile without silent data loss.

### Data verification

- One canonical task and deadline record exists for each accepted obligation.
- Duplicate events do not create duplicate tasks or notifications.
- Source, verification, timezone, calculation rule, and version history are preserved.
- Completion evidence and approvals remain linked and auditable.

### Integration verification

- ContractIQ deadlines create accepted canonical deadlines and tasks.
- OfferIQ, FinanceIQ, GovernanceIQ, VisitIQ, PhotoIQ, InspectionIQ, AppraisalIQ, MarketIQ, and RELearnIQ proposals flow through the same task system.
- Decision Cockpit, dashboard, timeline, reports, web, iPhone, and iPad show the same current state.
- Completion and missed-deadline events trigger only the intended downstream updates.
- No connected subsystem maintains a duplicate task, reminder, or deadline store.

### UX verification

- Web, iPhone, and iPad flows are complete.
- Loading, empty, stale, offline, syncing, conflict, overdue, delivery-failed, retry, and permission states are verified.
- Accessibility passes for task lists, calendar, notification center, badges, and actions.
- Critical states are understandable without relying on color alone.

### Production readiness

- No TODOs, dead controls, mock delivery, placeholder success, or hidden failure states remain.
- Provider secrets, webhooks, rate limits, retries, and dead-letter handling are configured.
- Monitoring detects overdue scheduler jobs, delivery failure spikes, and critical deadline gaps.
- Runbooks cover provider outage, duplicate sends, missed scheduling, bad timezone data, and revoked access.
- Retention, privacy, and consent behavior is documented and tested.

## 19. Definition of Done

Specification 022 is complete only when:

1. A senior engineer can implement the subsystem without inventing architecture or product behavior.
2. Tasks, deadlines, reminders, notifications, preferences, delivery records, and calendar publication use one canonical model.
3. Critical deadlines remain visible and actionable during provider or device failure.
4. All supported modules integrate without duplicate workflow logic.
5. Web, iPhone, and iPad save, reopen, synchronize, and recover consistently.
6. Functional, integration, security, accessibility, offline, performance, and failure-recovery tests pass.
7. The complete flow works seamlessly from source obligation to task creation, reminder delivery, user action, audit history, downstream update, and reporting.
8. The subsystem is production-ready, not merely scaffolded or MVP-ready.
