# BRIX Real Estate — Data Architecture

## 1. Purpose

This document defines the canonical data ownership, entity relationships, versioning, event, evidence, security, and synchronization requirements for the BRIX rebuild.

## 2. Canonical entities

Minimum required entities:

- Workspace
- UserProfile
- Membership
- Portfolio
- Property
- Parcel
- Building
- Unit
- Deal
- DealStageHistory
- Contact
- Organization
- Relationship
- Activity
- Task
- Deadline
- Evidence
- EvidenceVersion
- EvidenceFinding
- AssumptionSet
- UnderwritingSnapshot
- UnderwritingResult
- StrategyDefinition
- StrategyScenario
- StrategyResult
- Recommendation
- Decision
- FinancingStructure
- FinancingVersion
- Offer
- OfferVersion
- Contract
- ContractVersion
- ContractFinding
- Inspection
- InspectionFinding
- Appraisal
- AppraisalFinding
- GovernanceRecord
- GovernanceFinding
- Visit
- RoutePlan
- MediaAsset
- VoiceNote
- Transcript
- Report
- ReportVersion
- ShareLink
- DomainEvent
- BackgroundJob
- Notification
- UsageEvent
- Subscription
- Entitlement
- AuditEvent

## 3. Identity rules

- All primary records use immutable UUIDs.
- `deal_id` identifies one opportunity lifecycle.
- `property_id` identifies one real-world property.
- One Property may participate in multiple Deals over time.
- One Deal may contain multiple Properties for packages, portfolios, assemblages, or development opportunities.
- External listing IDs, parcel IDs, addresses, and coordinates are identifiers or matching signals, not primary keys.
- No silent Property merge is permitted.
- Merge decisions require explicit history and reversible references where practical.

## 4. Workspace isolation

Every private record must carry `workspace_id` directly or inherit it through a relationship that can be enforced reliably.

Required controls:

- RLS on private tables
- Server-side authorization on Edge Functions
- Storage path isolation
- Signed/authenticated file access
- Cross-workspace sharing only through explicit, revocable grants
- Platform-admin access audited
- No client-trusted workspace selection without server verification

## 5. Material value model

Every material value must retain:

- Value
- Unit
- Currency where applicable
- Source type
- Source ID
- Effective date
- Retrieved/entered date
- Classification
- Confidence
- Verification status
- Entered or produced by
- Superseded-by relationship where applicable
- Notes or rationale

Classifications:

- Confirmed fact
- User-entered fact
- External estimate
- System estimate
- User assumption
- AI observation
- Professional opinion
- Inferred information
- Unknown
- Conflict

Null, zero, unavailable, not yet requested, and not applicable must remain distinct.

## 6. Versioning rules

Material records must be immutable snapshots or preserve complete history.

Version at minimum:

- Assumption sets
- Underwriting inputs and outputs
- Strategy results
- Recommendations
- Decisions
- Financing
- Offers and counteroffers
- Contracts and amendments
- Inspection findings
- Appraisal findings
- Governance findings
- Reports
- AI extraction/findings
- User overrides

Each version must include:

- Version number
- Created timestamp
- Created by
- Source/evidence set
- Engine/workflow version
- Supersedes reference
- Status

## 7. Evidence architecture

Evidence is the immutable source layer. Derived findings do not replace original evidence.

Evidence must support:

- PDF
- Word
- Spreadsheet
- CSV
- Image
- Video
- Audio
- Email body
- Email attachment
- Listing snapshot
- Public record snapshot
- User note
- Voice transcript
- Professional report

Required evidence metadata:

- Evidence ID
- Workspace ID
- Deal ID
- Property ID where applicable
- Original filename and media type
- File hash
- Storage reference
- Source type and source identity
- Received/retrieved/effective dates
- Uploaded by
- Processing state
- Verification state
- Retention state
- Related evidence
- Version

## 8. Findings architecture

Findings are derived observations connected to evidence.

A finding must include:

- Finding type
- Statement
- Source evidence ID
- Page, section, timestamp, or image region where possible
- Classification
- Confidence
- Severity
- Verification requirement
- User acceptance/rejection/correction
- Related assumption, risk, task, deadline, or strategy
- Workflow/model metadata for AI-produced findings

AI findings cannot silently become confirmed facts.

## 9. Deal lifecycle

Supported stages:

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

Transitions must preserve:

- Prior stage
- New stage
- Actor
- Timestamp
- Reason
- Related decision
- Triggering event

## 10. Domain events

Material changes emit versioned domain events.

Minimum event types:

- DealCreated
- DealStageChanged
- PropertyMatched
- EvidenceAdded
- EvidenceProcessed
- FindingCreated
- FindingVerified
- AssumptionSetChanged
- UnderwritingCompleted
- StrategyRankingChanged
- RecommendationChanged
- DecisionRecorded
- FinancingChanged
- OfferCreated
- OfferRevised
- OfferStatusChanged
- ContractAdded
- ContractDeadlineCreated
- InspectionAdded
- AppraisalAdded
- GovernanceRestrictionFound
- VisitCreated
- MediaUploaded
- VoiceTranscribed
- ReportGenerated
- ShareLinkCreated
- TaskCreated
- DeadlineChanged
- BackgroundJobFailed
- AccountDeleted

Each event includes:

- Event ID
- Event version
- Workspace ID
- Deal ID where applicable
- Entity type and ID
- Actor
- Timestamp
- Correlation ID
- Idempotency key where applicable
- Before/after references where appropriate
- Payload contract version

Consumers must be idempotent.

## 11. Underwriting dependency graph

- AssumptionSet produces UnderwritingSnapshot.
- UnderwritingSnapshot plus engine version produces UnderwritingResult.
- StrategyScenario references one UnderwritingResult and strategy definition version.
- StrategyResult references exact inputs, output, disqualifiers, risk, and confidence.
- Recommendation references exact StrategyResults, evidence set, and risk state.
- Decision records whether the user accepted, rejected, or overrode a Recommendation.
- Reports reference exact versions; reports do not recalculate independently.

## 12. Offline and sync architecture

Native clients may store local drafts and upload queues, but not competing authoritative truth.

Requirements:

- Temporary local IDs
- Idempotent create/upload requests
- Durable local queue
- Explicit local/synced/conflict state
- Version checks before overwrite
- Safe retry after app termination
- Preservation of both versions when automatic merge is unsafe
- User-understandable conflict resolution
- Server history remains authoritative after successful reconciliation

## 13. Deletion and retention

Define intentional behavior for:

- Soft delete
- Archive
- Restore
- User-requested deletion
- Workspace deletion
- Evidence retention
- Legal/audit retention
- Subscription cancellation
- Expired share links

Deletion must not leave orphaned storage, jobs, findings, tasks, or relationship records.

## 14. Required indexes

Index common paths including:

- Workspace
- Deal
- Property
- Portfolio
- Stage/status
- Created/updated dates
- External source IDs
- Normalized address
- Parcel ID
- Geospatial coordinates
- Evidence processing state
- Background job state
- Deadline date
- Contact/organization lookup
- Strategy ID
- Report/share status

Avoid N+1 patterns and full-table client downloads.

## 15. Data validation gate

The data architecture is complete only when:

- Core schemas are explicit.
- Migrations are version controlled.
- RLS tests prove isolation.
- Storage isolation is tested.
- Duplicate matching is tested.
- Version history is reproducible.
- Domain events are idempotent.
- Offline reconciliation is tested.
- No module owns shadow Deal, Property, evidence, or calculation truth.
- Reports and clients reconcile to canonical versions.
