# BRIX Specification 019 — Admin, Billing, Usage, and Operations

## 1. Authority and Rules of Engagement

This specification is governed by `docs/00-START-HERE.md` through `docs/05-BUILD-ROADMAP.md` and Specifications 001–018.

Rules of engagement:

1. Admin capabilities are privileged operational tools, not shortcuts around canonical authorization, RLS, audit, billing, or data-integrity rules.
2. Admin access must be explicit, least-privilege, role-based, auditable, and revocable.
3. No admin action may silently alter a user’s Deal, Property, financial assumptions, calculations, recommendations, evidence, contracts, offers, or decisions.
4. Support actions that affect user data require a reason, actor identity, before/after state, and audit record.
5. Billing and entitlement decisions must come from one canonical entitlement service.
6. Usage, cost, plan limits, AI consumption, storage, processing, and background-job activity must reconcile to source events.
7. Failed jobs, billing webhooks, plan changes, refunds, cancellations, and entitlement updates must be idempotent and recoverable.
8. Production operations must never depend on manually editing database rows as the normal workflow.
9. Sensitive user content must not appear in broad admin views or logs unless explicitly required and authorized for support.
10. Every destructive or irreversible admin action requires confirmation and, where material, a second approval or elevated authentication.
11. Web, native clients, billing, feature flags, usage meters, and support tooling must show the same canonical entitlement and account state.
12. No operational failure may be hidden behind a successful UI state.

## 2. Mission

Provide a secure operating layer for managing BRIX users, workspaces, plans, entitlements, billing status, usage, limits, background jobs, incidents, feature flags, support cases, and system health without compromising customer data or bypassing product rules.

## 3. Canonical Ownership

This subsystem owns:

- platform administrator roles and permissions
- plan and entitlement definitions
- subscription and billing-provider references
- usage ledgers and metering summaries
- quotas and limit enforcement
- feature flags and rollout assignments
- support cases and support notes
- background-job operational controls
- incident records and operational status
- platform configuration audit
- admin action audit

This subsystem does not own:

- customer Deal or Property truth
- underwriting or strategy outputs
- Evidence originals
- contract, offer, inspection, or appraisal findings
- user tasks, decisions, or professional conclusions

## 4. Administrative Roles

At minimum:

- Platform Owner
- Security Administrator
- Billing Administrator
- Support Administrator
- Operations Administrator
- Read-Only Auditor

Each role must define allowed resources, actions, data visibility, approval requirements, environment scope, and expiration policy.

Customer workspace roles are not platform-admin roles. A workspace owner does not automatically gain platform administration, and a platform support role does not automatically gain unrestricted customer-content access.

## 5. Canonical Entities

### `platform_admin_roles` and `platform_admin_memberships`

Store role, user, environment, status, granted by, granted time, expiration, revocation, and reason.

### `plans`

Store permanent plan ID, name, billing cadence options, price references, entitlements, limits, availability, effective dates, grandfathering rules, and retirement state.

### `subscriptions`

Store workspace/customer, provider customer/subscription IDs, plan, status, trial, current period, cancel state, payment status, and synchronization metadata.

### `entitlement_snapshots`

Immutable evaluated entitlement state used by clients and services. Include plan, overrides, limits, effective time, source, and version.

### `usage_events`

Append-only events for AI calls, document processing, storage, report generation, email ingestion, notifications, exports, and other metered operations.

### `usage_aggregates`

Derived daily and billing-period summaries that reconcile to usage events.

### `feature_flags`

Store flag ID, description, owner, environments, rollout rules, targeting, default, dependencies, kill switch, and audit history.

### `support_cases`

Store workspace/user references, issue type, status, priority, assigned operator, approved access scope, notes, actions, and resolution.

### `operational_actions`

Store admin action requests, approval state, execution status, reason, actor, target, before/after references, and rollback information.

## 6. Billing and Entitlement Lifecycle

Supported states include:

- Free
- Trialing
- Active
- Past Due
- Grace Period
- Paused
- Canceled
- Expired
- Comped
- Manually Overridden
- Suspended for Abuse

Rules:

1. Billing-provider webhooks are verified and idempotent.
2. Provider state is normalized into BRIX canonical subscription state.
3. Entitlement evaluation is deterministic and versioned.
4. Plan changes preserve effective dates and proration context.
5. A failed webhook does not silently revoke or grant access.
6. Grace-period behavior is explicit.
7. Manual overrides require reason, expiration, actor, and audit.
8. Cancellation, refund, dispute, and reactivation workflows are recoverable.
9. Clients receive entitlement changes through canonical APIs/events, not duplicated local rules.

## 7. Usage Metering and Limits

Usage categories may include:

- active workspaces and members
- Deals and Properties
- storage bytes
- Evidence uploads
- AI requests, tokens, or provider units
- OCR, transcription, image analysis, and document processing
- reports and exports
- email ingestion
- notifications
- API calls
- background compute

Metering requirements:

- append-only source event
- idempotency key
- workspace and user context
- service and operation type
- provider/model/version where applicable
- quantity and unit
- estimated and actual cost where available
- timestamp and billing period
- reconciliation state

Limits must fail safely, communicate clearly, and never corrupt an in-progress workflow. Where possible, preserve drafts and permit upgrade or manual completion.

## 8. Admin Console

### Core areas

- user and workspace lookup
- subscription and entitlement state
- usage and cost overview
- storage and processing status
- feature flags and rollout
- background jobs and retry controls
- support cases
- incidents and system health
- audit search
- plan configuration

### Required safeguards

- elevated authentication for sensitive actions
- reason entry
- explicit confirmation
- scoped customer-data access
- time-limited support access
- immutable action history
- safe redaction
- environment indicator
- production warning banner

## 9. Support Access

Support access must be:

- user- or policy-authorized where required
- limited to the minimum resource and duration
- visible in audit history
- revocable
- prohibited from exposing secrets, raw tokens, or unrelated workspace data

Impersonation, if implemented, must use a clearly marked support session, never reveal credentials, never bypass RLS, and record every action. Read-only diagnostic mode is preferred.

## 10. Background Job Operations

Admin may inspect and operate approved job types for Evidence processing, AI, reports, email, notifications, indexing, billing, and synchronization.

Required controls:

- inspect state and safe failure details
- retry idempotently
- cancel where safe
- requeue with reason
- quarantine poisoned input
- view dependency chain
- preserve prior valid output
- prevent duplicate side effects

No admin retry may bypass normal authorization or validation.

## 11. Feature Flags and Rollouts

- Flags have permanent IDs and owners.
- Defaults are safe.
- Targeting supports environment, plan, workspace cohort, and percentage rollout.
- Dependencies and incompatible combinations are validated.
- Kill switches are immediate and auditable.
- Incomplete features remain hidden.
- Flag removal is part of feature completion.
- Clients do not make authoritative entitlement decisions from stale cached flags.

## 12. Observability and Incident Operations

Admin operations must expose:

- service health
- error rates
- latency
- queue depth and age
- provider availability
- failed webhooks
- billing reconciliation
- AI and processing cost anomalies
- storage failures
- notification delivery failures
- release and environment versions

Incident records include severity, timeline, affected services/workspaces, customer communication status, mitigation, resolution, and follow-up actions.

## 13. UI and UX

### Web admin

The primary admin console is desktop-first and supports dense tables, saved filters, safe bulk actions, audit drawers, job detail, and clear production/environment context.

### iPhone and iPad

Native admin is limited to approved operational needs such as health summary, incident acknowledgment, and safe read-only status unless a specific privileged action is explicitly designed and secured.

Required states include loading, empty, partial, stale, permission denied, approval required, processing, success, failure, retry, conflict, provider unavailable, and reconciliation pending.

## 14. Security and Privacy

- least-privilege admin roles
- MFA or elevated authentication for privileged actions
- RLS and server-side authorization
- no secrets in client code or logs
- redaction of PII and customer content
- append-only admin audit
- session timeout and revocation
- IP/device/risk controls where appropriate
- separation of production and non-production
- secure webhook validation
- encrypted provider references
- abuse monitoring and rate limits

## 15. Domain Events

- `admin.role_granted`
- `admin.role_revoked`
- `subscription.changed`
- `entitlement.changed`
- `usage.recorded`
- `usage.limit_reached`
- `feature_flag.changed`
- `support_case.created`
- `support_access.granted`
- `support_access.revoked`
- `operational_action.requested`
- `operational_action.completed`
- `job.retried`
- `incident.created`
- `incident.resolved`

Events are emitted after persistence and are idempotent.

## 16. Testing Requirements

- admin role and privilege-escalation tests
- RLS and cross-workspace isolation tests
- billing webhook signature and idempotency tests
- entitlement evaluation fixtures
- plan change, cancellation, grace, refund, and reactivation tests
- usage event and aggregate reconciliation tests
- quota enforcement and draft-preservation tests
- override expiration tests
- feature flag targeting and kill-switch tests
- support-access scope and expiration tests
- background-job retry and duplicate-side-effect tests
- audit completeness tests
- incident and observability integration tests
- accessibility and performance tests

## 17. Verification and Validation

### Functional verification

- Authorized admins can perform supported operations and unauthorized users cannot access them.
- Billing, entitlement, usage, limits, feature flags, support, jobs, and incidents save and reopen correctly.
- Failed operations show true state and recover safely.

### Data verification

- Subscription and entitlement state reconcile to provider and internal rules.
- Usage aggregates reconcile to append-only events.
- Overrides, support access, and admin actions retain actor, reason, time, and expiration.
- No admin action creates an untracked direct data mutation.

### Integration verification

- Web, native clients, APIs, AI, reports, Evidence, notifications, and background workers consume the same entitlement and usage state.
- Timeline and customer modules remain protected from administrative ownership drift.
- Operational events reach audit, observability, and incident tooling exactly once.

### Security verification

- Role boundaries, elevated authentication, redaction, RLS, webhook security, session revocation, and environment separation pass.
- Support and impersonation workflows do not expose credentials or unrelated data.

### Definition of Done

Specification 019 is complete only when BRIX can securely operate users, workspaces, billing, entitlements, usage, limits, feature rollouts, support, background jobs, and incidents with complete auditability, reconciliation, recovery, and no bypass of canonical product rules.
