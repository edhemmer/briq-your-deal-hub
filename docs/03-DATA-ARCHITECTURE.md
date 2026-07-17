# BRIX Real Estate — Data Architecture

## 1. Authority and Rules of Engagement

This document defines the canonical data architecture for BRIX. It is governed by:

- `docs/00-START-HERE.md`
- `docs/01-PRODUCT-CONSTITUTION.md`
- `docs/02-ENGINEERING-STANDARDS.md`

No subsystem may create a shadow schema, duplicate entity, client-only source of truth, competing lifecycle, or private calculation store that conflicts with this architecture.

Permanent data rules:

1. Every workspace-scoped record must carry `workspace_id` and be protected by Row Level Security.
2. Every property opportunity must use the canonical `property_id` and `deal_id` relationships.
3. Original evidence is immutable; derived findings and accepted values are versioned separately.
4. Material facts, assumptions, estimates, inferences, professional opinions, AI observations, unknowns, and conflicts must retain explicit classification.
5. Material changes preserve history and emit domain events only after successful persistence.
6. Authoritative financial results come only from immutable underwriting snapshots and a recorded engine version.
7. Deletes, archives, restores, merges, supersession, and retention behavior must be explicit.
8. Foreign keys, constraints, indexes, and RLS are part of the feature, not optional hardening.
9. No client may infer canonical success until the backend confirms persistence.
10. Every schema change must be introduced through a forward-only migration and validated against current data and connected clients.

## 2. Data Ownership Model

### 2.1 Workspace

A Workspace is the security, billing, collaboration, and data-isolation boundary.

Core entities:

- `workspaces`
- `profiles`
- `workspace_memberships`
- `workspace_invitations`
- `roles`
- `role_permissions`
- `workspace_settings`

A user may belong to multiple workspaces. Access is determined by active membership and server-enforced permissions.

### 2.2 Property

A Property is the durable representation of a real-world asset or asset package.

Core entities:

- `properties`
- `property_addresses`
- `parcels`
- `buildings`
- `units`
- `property_identifiers`
- `property_relationships`
- `property_merge_candidates`

Property identity may use normalized address, parcel identifiers, coordinates, legal description, unit/building identifiers, listing-source IDs, and project name. Duplicate detection proposes; authorized users decide. Silent merge is prohibited.

### 2.3 Deal

A Deal is one investor opportunity and decision lifecycle.

Core entities:

- `deals`
- `deal_properties`
- `deal_stage_history`
- `deal_status_history`
- `deal_tags`
- `deal_assignments`
- `deal_preferences`
- `deal_objectives`

A Property may have multiple Deals over time. A Deal may include multiple Properties for portfolio, assemblage, development, or package opportunities.

### 2.4 Evidence

Core entities:

- `evidence`
- `evidence_files`
- `evidence_versions`
- `evidence_findings`
- `evidence_links`
- `evidence_conflicts`
- `extraction_jobs`

Original bytes, hashes, metadata, and source identity remain immutable. Derived extraction may be reprocessed without changing the original.

### 2.5 Facts, assumptions, and accepted values

Core entities:

- `fact_records`
- `assumption_sets`
- `assumption_values`
- `value_proposals`
- `value_conflicts`
- `verification_requests`

Each material value should support:

- Canonical subject and field
- Normalized value
- Display value
- Unit and currency
- Classification
- Source evidence
- Effective date
- Retrieved date
- Confidence
- Verification state
- Accepted/superseded state
- Created by and accepted by
- Version

### 2.6 Underwriting and strategy

Core entities:

- `underwriting_snapshots`
- `underwriting_inputs`
- `underwriting_results`
- `underwriting_issues`
- `calculation_lineage`
- `strategy_registry`
- `strategy_scenarios`
- `strategy_results`
- `strategy_disqualifiers`
- `strategy_rankings`
- `recommendations`
- `decisions`

An underwriting snapshot is immutable. A result references the exact snapshot and engine version used.

### 2.7 Workflow and relationships

Core entities:

- `contacts`
- `organizations`
- `deal_relationships`
- `activities`
- `tasks`
- `deadlines`
- `task_assignments`
- `comments`
- `notes`
- `domain_events`
- `audit_events`

One canonical task/deadline system and one canonical timeline must be reused by all modules.

### 2.8 Specialized Deal records

Subsystems extend the Deal through canonical linked entities, including:

- `market_snapshots`
- `market_findings`
- `financing_structures`
- `debt_tranches`
- `equity_tranches`
- `financing_conditions`
- `governance_records`
- `governance_findings`
- `contracts`
- `contract_terms`
- `contract_deadlines`
- `offers`
- `offer_versions`
- `negotiation_events`
- `visits`
- `route_plans`
- `media_assets`
- `voice_notes`
- `photo_findings`
- `inspections`
- `inspection_findings`
- `appraisals`
- `appraisal_findings`
- `reports`
- `share_links`
- `notifications`
- `usage_events`
- `subscriptions`
- `background_jobs`

## 3. Canonical IDs and Relationships

Canonical IDs must be immutable and globally unique.

Minimum relationship rules:

- Every workspace-owned record references `workspace_id`.
- Every Deal references its owning workspace.
- Every Deal-to-Property relationship uses `deal_properties` to support one-to-many and many-to-many cases intentionally.
- Every evidence item references its workspace and may reference Deal, Property, specialized entity, or multiple targets through `evidence_links`.
- Every task, deadline, activity, recommendation, decision, report, and notification must reference the canonical Deal when Deal-specific.
- Specialized entities must not duplicate address, contact, task, evidence, or calculation ownership.

## 4. Lifecycle and Status Standards

### 4.1 Deal stages

Supported canonical stages:

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

Transitions are explicit, permission-aware, historically preserved, and may have required conditions.

### 4.2 Generic processing states

Use a consistent processing model where applicable:

- Draft
- Queued
- Uploading
- Processing
- Awaiting Verification
- Complete
- Partially Complete
- Failed
- Retry Scheduled
- Blocked
- Conflict
- Offline
- Stale
- Superseded
- Cancelled

Subsystem-specific states may extend this model but must not redefine common meanings.

### 4.3 Verification states

- Unverified
- System Checked
- User Verified
- Source Verified
- Professional Review Recommended
- Professionally Confirmed
- Rejected
- Superseded

Verification status must not be inferred solely from confidence.

## 5. Source Classification and Provenance

Required classifications:

- Confirmed fact
- User-entered fact
- External estimate
- System estimate
- User assumption
- AI observation
- Professional opinion
- Inference
- Unknown
- Conflict

Provenance must support:

- Source name and identifier
- Source URL when permitted
- Evidence ID
- Page, section, clause, image region, timestamp, or other anchor
- Retrieved date
- Effective date
- License/use restriction where relevant
- Extraction provider/model/workflow version where applicable
- Actor accepting or rejecting the value

## 6. Versioning and History

Versioning is mandatory for:

- Material facts and assumptions
- Underwriting snapshots and results
- Strategy scenarios and rankings
- Recommendations and decisions
- Financing structures and terms
- Offers and counteroffers
- Contracts, addenda, and amendments
- Governance findings
- Inspection and appraisal findings
- Reports and shared outputs

Rules:

- Prior accepted versions remain queryable.
- Supersession never deletes the prior record.
- A current pointer may identify the active version but must not replace history.
- Reprocessing evidence creates new derived output versions.
- Historical outputs must remain reproducible using stored input and engine/workflow versions.

## 7. Domain Events

`domain_events` is the canonical event ledger for material product changes.

Required fields:

- `id`
- `event_type`
- `event_version`
- `workspace_id`
- `deal_id`
- `property_id`
- `entity_type`
- `entity_id`
- `entity_version`
- `actor_type`
- `actor_id`
- `source_client`
- `correlation_id`
- `idempotency_key`
- `payload`
- `occurred_at`
- `created_at`

Events are appended only after the described transaction commits. Consumers must be idempotent. Event payloads should reference canonical records rather than duplicate large sensitive content.

Key event families include:

- Property and Deal lifecycle
- Evidence received and processed
- Value proposed, accepted, rejected, or conflicted
- Underwriting requested and completed
- Strategy ranking changed
- Recommendation changed
- Financing changed
- Governance restriction confirmed
- Contract term or deadline accepted
- Offer submitted or countered
- Visit completed
- Media synchronized
- Inspection/appraisal accepted
- Report generated or shared
- Task/deadline changed
- Decision recorded
- Admin/billing/security action

## 8. Audit Events

`audit_events` records material user, system, and administrative actions.

Minimum fields:

- Event ID
- Workspace and Deal scope
- Actor
- Action
- Target type and ID
- Before/after references or safe diff
- Reason where required
- Client/IP/device metadata where appropriate and lawful
- Correlation ID
- Timestamp

Audit events are append-only and protected from normal user mutation.

## 9. Row Level Security and Authorization

RLS must be enabled on workspace-scoped and sensitive tables.

Policies must enforce:

- Active workspace membership
- Role and permission requirements
- Record ownership where applicable
- Share-link scope and expiration
- Platform-admin separation
- Deletion/archival restrictions

Tests must prove:

- Cross-workspace reads fail.
- Cross-workspace writes fail.
- Revoked members lose access.
- Viewer roles cannot mutate.
- Admin-only records remain protected.
- Storage paths cannot be guessed or accessed without authorization.

Application checks complement RLS; they do not replace it.

## 10. Storage Architecture

Storage buckets and paths must separate:

- Original evidence
- Derived previews
- Photos and videos
- Voice recordings
- Reports and exports
- Temporary processing artifacts
- Public marketing assets

Private Deal content uses authorized or signed access. Path structure must include workspace and canonical target IDs. File names are not authorization controls.

Required metadata:

- Original filename
- MIME type
- Size
- Hash
- Storage path
- Uploaded by
- Upload state
- Virus/malware scan state where implemented
- Retention state
- Associated evidence ID

Failed upload or processing must not delete a valid local or previously uploaded source.

## 11. Background Jobs and Idempotency

`background_jobs` is required for durable asynchronous work.

Minimum fields:

- Job ID and type
- Workspace/Deal/target IDs
- Status
- Priority
- Requested by
- Correlation and idempotency keys
- Attempt count
- Provider/model/workflow version
- Progress
- Queued, started, heartbeat, completed, failed, and retry timestamps
- Safe error category/message
- Output references

Unique constraints or idempotency records must prevent duplicate canonical effects.

## 12. Indexing and Query Performance

Required index categories:

- Workspace foreign keys
- Deal and Property foreign keys
- Active status/stage filters
- Created/updated timestamps
- Searchable address and contact fields
- Parcel and source identifiers
- Deadline due dates
- Background-job status and queue ordering
- Domain-event correlation and target lookup
- Current-version pointers
- Full-text or vector indexes only where justified and securely scoped

Every new query pattern must be evaluated for bounded result size and index support.

## 13. Deletion, Archive, Restore, and Retention

- Archive is reversible and preferred for completed Deals.
- Soft deletion may support recovery and retention workflows.
- Permanent deletion must respect ownership, legal retention, billing, shared records, and account-deletion policy.
- Cascades are permitted only where dependent records have no independent audit or legal value.
- Original evidence and audit history require explicit retention rules.
- Account deletion must revoke access immediately and complete data disposition through a tracked workflow.

## 14. Migration Standards

Every migration must:

- Be forward-only.
- Have a clear purpose.
- Preserve existing production data.
- Add constraints only after data compatibility is proven.
- Include required indexes and RLS changes.
- Be safe under deployment ordering.
- Be tested from a clean database and from the prior production schema.
- Document irreversible effects.

No manual production schema drift is allowed.

## 15. Cross-Module Data Flow

A subsystem is complete only when its output participates in the connected Deal flow.

Examples:

- Accepted intake facts feed assumptions.
- Assumption changes create a new underwriting snapshot.
- Underwriting results feed strategy ranking and Decision Cockpit.
- Market, financing, governance, contract, visit, inspection, and appraisal findings may propose versioned changes.
- Accepted changes trigger targeted recalculation.
- Recalculation may update recommendations, tasks, notifications, reports, and portfolio views.
- Every material change appears in the Deal timeline and audit history.

No subsystem may write directly into another subsystem’s owned result table.

## 16. Verification and Validation

### Schema verification

- Every table has a documented owner and purpose.
- Primary keys, foreign keys, uniqueness constraints, checks, delete behavior, and indexes are intentional.
- No duplicate canonical entity exists.
- Current-version pointers cannot orphan history.

### Security verification

- RLS is enabled and tested.
- Cross-workspace access fails.
- Storage access is authorized.
- Platform-admin access is isolated and audited.
- Service-role access remains server-side.

### Lifecycle verification

- Create, update, archive, restore, supersede, merge-candidate review, and deletion workflows behave intentionally.
- Material changes preserve history.
- Domain and audit events are appended once.
- Retried operations remain idempotent.

### Integration verification

- Intake, underwriting, strategy, cockpit, market, finance, governance, contract, offer, visit, media, inspection, appraisal, reporting, notifications, and admin use canonical IDs and records.
- No module traps data in a private store.
- Stale results are marked when dependencies change.
- Reports, exports, web, iPhone, iPad, and admin reconcile.

### Migration verification

- Clean install succeeds.
- Upgrade from prior schema succeeds.
- RLS and indexes exist after migration.
- Rollback/forward-recovery strategy is documented.
- Seed and test data do not leak into production.

**DOCUMENT STATUS: REVIEWED AND REPAIRED**
