# BRIX Specification 013 — PhotoIQ and Visual Evidence

## Authority

This specification is subordinate to:

1. `docs/00-START-HERE.md`
2. `docs/01-PRODUCT-CONSTITUTION.md`
3. `docs/02-ENGINEERING-STANDARDS.md`
4. `docs/03-DATA-ARCHITECTURE.md`
5. `docs/04-UI-UX-SYSTEM.md`
6. `docs/05-BUILD-ROADMAP.md`
7. Specifications 001 through 012

Codex must re-read the permanent engineering rules, chapter-start protocol, chapter-completion gate, premium UI/UX requirements, canonical data rules, and no-stale-state requirements before implementing this subsystem.

---

# 1. Mission

PhotoIQ turns property images into organized, traceable visual evidence that helps the investor understand visible condition, potential risks, repair opportunities, documentation gaps, and follow-up needs.

PhotoIQ is not a licensed property inspection, engineering opinion, environmental assessment, code review, roof certification, mold determination, structural conclusion, or cost estimate guarantee.

The subsystem must preserve the original image, separate visible observations from inferred causes, connect every finding to the correct Deal and property area, and require confirmation before a visual observation changes authoritative underwriting assumptions.

---

# 2. Business Purpose

PhotoIQ must help the user:

- Capture and organize property photos quickly in the field.
- Import listing photos and third-party images without losing source context.
- Identify visible conditions that may affect price, repair budget, financing, insurability, operations, strategy, or due diligence.
- Compare listing imagery with current visit imagery.
- Track conditions over time.
- Generate questions for the inspector, contractor, seller, broker, property manager, lender, insurer, attorney, association, or specialist.
- Convert confirmed visual evidence into repair assumptions, tasks, inspection follow-up, offer terms, and decision changes.
- Distinguish confirmed problems from possible concerns and unknowns.

---

# 3. Non-Negotiable Rules

1. Every image must attach to one canonical `deal_id` and, where known, one canonical `property_id`.
2. Original image bytes must remain immutable after successful upload.
3. AI must analyze image pixels, not filenames, captions, or metadata as a substitute.
4. Metadata may support context but cannot replace visual analysis.
5. Every finding must link to one or more exact image records.
6. Visible observation and inferred cause must be stored separately.
7. AI findings must never be presented as inspection-grade conclusions.
8. Low-quality or obstructed images must be labeled as limited evidence.
9. No image finding may silently change underwriting.
10. A user-confirmed or policy-approved finding may create a proposed assumption change, but canonical financial calculations must remain owned by the deterministic underwriting engine.
11. Deleting a derived finding must not delete the original image.
12. Duplicate detection may suggest duplicates but must not silently discard evidence.
13. Every processing state must be visible and recoverable.
14. Failed AI analysis must not block manual image organization.
15. PhotoIQ must work with weak connectivity and preserve locally captured media until canonical upload succeeds.
16. Web, iPhone, iPad, reports, and shared views must show the same canonical image state and accepted findings.

---

# 4. Scope

PhotoIQ includes:

- Camera capture
- Photo library import
- Drag-and-drop image upload
- Listing photo import
- Email attachment import
- Document-extracted image import where permitted
- Image organization
- Room and system categorization
- Image annotations
- AI visual observations
- User confirmation and correction
- Duplicate and near-duplicate detection
- Before-and-after comparison
- Time-series condition history
- Repair opportunity identification
- Follow-up question generation
- Proposed repair assumption changes
- Integration with VisitIQ, InspectionIQ, OfferIQ, ContractIQ, GovernanceIQ, underwriting, reports, tasks, and the Deal timeline

PhotoIQ does not own:

- Final repair pricing
- Final inspection findings
- Final appraisal conclusions
- Final insurance eligibility
- Final code compliance
- Final legal conclusions
- Final environmental conclusions
- Final structural conclusions

---

# 5. Canonical Entities

Minimum required entities:

## 5.1 `media_assets`

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `property_id`
- `visit_id` nullable
- `evidence_id` nullable
- `source_type`
- `source_reference`
- `original_filename`
- `mime_type`
- `byte_size`
- `storage_bucket`
- `storage_path`
- `sha256_hash`
- `perceptual_hash` nullable
- `captured_at` nullable
- `uploaded_at`
- `uploaded_by`
- `source_created_at` nullable
- `latitude` nullable
- `longitude` nullable
- `location_permission_state`
- `orientation`
- `width_px`
- `height_px`
- `duration_ms` nullable
- `original_preserved`
- `upload_state`
- `processing_state`
- `verification_state`
- `visibility_scope`
- `archived_at` nullable
- `deleted_at` nullable
- `created_at`
- `updated_at`
- `row_version`

## 5.2 `media_classifications`

Required fields:

- `id`
- `media_asset_id`
- `deal_id`
- `property_area`
- `system_category`
- `room_category`
- `user_label`
- `source`
- `confidence`
- `accepted_by_user`
- `created_at`
- `updated_at`

## 5.3 `visual_findings`

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `property_id`
- `finding_type`
- `observation_text`
- `inferred_cause_text` nullable
- `severity`
- `confidence`
- `evidence_quality`
- `professional_review_recommended`
- `decision_relevance`
- `status`
- `created_by_type`
- `created_by_user_id` nullable
- `model_provider` nullable
- `model_name` nullable
- `model_version` nullable
- `workflow_version` nullable
- `prompt_version` nullable
- `accepted_by_user_id` nullable
- `accepted_at` nullable
- `rejected_by_user_id` nullable
- `rejected_at` nullable
- `superseded_by_id` nullable
- `created_at`
- `updated_at`
- `row_version`

## 5.4 `visual_finding_media`

Join table between findings and media assets.

Required fields:

- `visual_finding_id`
- `media_asset_id`
- `bounding_region` nullable
- `annotation_text` nullable
- `primary_evidence`

## 5.5 `media_annotations`

Required fields:

- `id`
- `media_asset_id`
- `created_by`
- `annotation_type`
- `geometry`
- `label`
- `notes`
- `created_at`
- `updated_at`

## 5.6 `finding_actions`

Required fields:

- `id`
- `visual_finding_id`
- `action_type`
- `target_entity_type`
- `target_entity_id` nullable
- `proposed_value` nullable
- `status`
- `approved_by` nullable
- `approved_at` nullable
- `created_at`
- `updated_at`

---

# 6. Controlled Vocabularies

## 6.1 Source types

- Camera capture
- Photo library
- Listing import
- Email attachment
- Document extraction
- Shared file
- Contractor
- Inspector
- Appraiser
- Seller
- Broker
- Property manager
- Public source
- User upload
- Other verified source

## 6.2 Property areas

- Site
- Street view
- Front exterior
- Rear exterior
- Side exterior
- Roof
- Attic
- Crawlspace
- Basement
- Foundation
- Garage
- Parking
- Landscaping
- Drainage
- Common area
- Unit exterior
- Unit interior
- Mechanical room
- Electrical room
- Utility room
- Kitchen
- Bathroom
- Bedroom
- Living area
- Hallway
- Stairway
- Commercial tenant space
- Warehouse
- Office
- Retail floor
- Storage area
- Unknown

## 6.3 System categories

- Structure
- Foundation
- Roof
- Exterior cladding
- Windows
- Doors
- Electrical
- Plumbing
- HVAC
- Fire/life safety
- Drainage
- Moisture
- Interior finishes
- Flooring
- Appliances
- Accessibility
- Parking
- Site
- Landscaping
- Environmental indicator
- Security
- Commercial systems
- Deferred maintenance
- Renovation opportunity
- Unknown

## 6.4 Finding status

- Proposed
- Needs review
- Accepted
- Rejected
- Superseded
- Professionally verified
- Resolved
- Monitoring

## 6.5 Evidence quality

- Clear
- Adequate
- Limited
- Obstructed
- Blurry
- Too dark
- Too distant
- Cropped
- Potentially edited
- Duplicate
- Unknown

---

# 7. Capture and Upload Workflow

## 7.1 Native field capture

The iPhone and iPad applications must support:

- Launch camera from the active Deal.
- Capture multiple photos without returning to the Deal after each image.
- Apply the active Deal and Visit automatically.
- Allow optional room/system labeling during or after capture.
- Show local-save status immediately.
- Continue capture while prior images upload in the background.
- Survive app suspension and termination.
- Retry failed uploads automatically with exponential backoff.
- Allow the user to pause or cancel upload.
- Prevent duplicate canonical records during retry.
- Preserve original full-resolution image unless the user explicitly selects a lower-resolution policy.

## 7.2 Web upload

The web application must support:

- Drag and drop
- File picker
- Multiple files
- Folder import where browser support permits
- Paste from clipboard where permitted
- Progress by file and batch
- Retry by file and batch
- Duplicate warnings
- Association with Deal, Visit, area, and source

## 7.3 Upload state model

Each image must use a durable state:

- Local draft
- Queued
- Uploading
- Uploaded
- Integrity checking
- Processing
- Analysis available
- Needs review
- Complete
- Failed
- Retry scheduled
- Conflict
- Cancelled
- Archived

A generic spinner is insufficient.

---

# 8. Storage and Security

- Store originals in private Supabase Storage buckets.
- Use workspace- and Deal-scoped paths.
- Never rely on obscurity of URLs.
- Use signed or authorized access.
- Strip or preserve EXIF according to user privacy settings and documented product policy.
- Store location only when permission exists and the user has not disabled geotagging.
- Do not expose service-role credentials.
- Enforce storage authorization server-side.
- Log downloads of sensitive shared media where required.
- Support revocable share access.
- Support retention and deletion policies without breaking audit requirements.
- File hash must be computed and preserved.

---

# 9. Image Processing Pipeline

Required pipeline:

1. Upload original.
2. Verify integrity.
3. Extract safe metadata.
4. Generate thumbnails and optimized derivatives.
5. Compute cryptographic and perceptual hashes.
6. Detect exact and near duplicates.
7. Classify image quality.
8. Classify property area and system.
9. Run visual analysis when authorized.
10. Store findings as proposed.
11. Notify the user when review is ready.
12. Preserve job status and failure details.

Processing jobs must be idempotent and versioned.

A failed derivative or AI job must not invalidate the original upload.

---

# 10. AI Visual Analysis Contract

## 10.1 Allowed outputs

AI may identify:

- Visible staining
- Visible discoloration
- Apparent cracking
- Apparent corrosion
- Apparent deterioration
- Missing or damaged finishes
- Apparent water marks
- Apparent vegetation overgrowth
- Apparent drainage concerns
- Apparent roof wear
- Apparent siding damage
- Apparent window or door deterioration
- Apparent electrical or plumbing indicators visible in the image
- Apparent deferred maintenance
- Renovation opportunities
- Safety concerns visible in the image
- Accessibility barriers visible in the image
- Need for clearer photos or professional review

## 10.2 Prohibited certainty

AI must not state as fact:

- Active mold
- Structural failure
- Foundation failure
- Roof failure
- Code violation
- Asbestos
- Lead paint
- Termite activity
- Electrical safety certification
- Plumbing failure beyond visible evidence
- HVAC operability
- Hidden moisture
- Hidden damage
- Repair cost certainty
- Insurance eligibility

Use language such as:

- “Visible staining is present.”
- “The cause cannot be confirmed from this image.”
- “Further inspection is recommended.”
- “Image quality limits confidence.”

## 10.3 Required metadata

Every AI finding must retain:

- Input image IDs
- Provider
- Model
- Model version
- Workflow version
- Prompt version
- Timestamp
- Confidence
- Evidence-quality rating
- User confirmation state

---

# 11. Finding Severity and Decision Relevance

Severity and decision relevance are separate.

## Severity

- Informational
- Minor
- Moderate
- Major
- Potentially critical
- Unknown

## Decision relevance

- No expected effect
- Monitor
- Additional information needed
- Repair assumption may change
- Offer terms may change
- Financing may be affected
- Insurance may be affected
- Strategy may be affected
- Professional review required before proceeding

A finding may be visually minor but strategically material, or visually severe but already accounted for.

---

# 12. User Review and Correction

The review interface must allow the user to:

- Accept a finding
- Reject a finding
- Edit wording
- Change property area
- Change category
- Change severity
- Mark professional verification
- Link contractor, inspector, or specialist evidence
- Add notes
- Create a task
- Request another photo
- Add to inspection checklist
- Propose repair assumption
- Add to OfferIQ issue list
- Add to report
- Mark resolved

Corrections must preserve original AI output and create a new version or correction record.

---

# 13. Underwriting Integration

PhotoIQ may propose, but must not directly own, changes to:

- Repair budget
- Capital expenditure timing
- Contingency
- Immediate safety reserve
- Deferred maintenance reserve
- Renovation scope
- Stabilization period
- Insurance assumption
- Vacancy assumption
- Offer price

Required flow:

1. Finding accepted.
2. User selects or creates action.
3. Proposed assumption change is created.
4. User reviews source, range, timing, and confidence.
5. Accepted assumption creates a new immutable underwriting snapshot.
6. Deterministic engine recalculates.
7. Strategy engine re-ranks only affected strategies.
8. Cockpit displays before/after change.
9. Deal timeline records the event.

---

# 14. Cross-Module Connections

PhotoIQ must integrate with:

## VisitIQ

- Capture session
- Route/visit context
- Arrival checklist
- Room checklist
- Visit summary

## InspectionIQ

- Pre-inspection issue list
- Comparison with inspector findings
- Professional verification
- Repair estimate replacement

## AppraisalIQ

- Condition comparison
- Subject-property evidence
- Renovation completion evidence

## OfferIQ

- Repair credit issues
- Price adjustment support
- Contingency recommendations
- Evidence package

## ContractIQ

- Inspection and due-diligence deadline awareness
- Required notices and repair-request support

## GovernanceIQ

- Exterior restrictions
- Architectural-review concerns
- Parking, vehicle, sign, landscaping, and exterior-condition issues

## ReportIQ

- Selected images
- Findings summary
- Before-and-after comparison
- Source and confidence metadata

## PDRM timeline

- Upload
- Analysis complete
- Finding accepted/rejected
- Professional verification
- Assumption changed
- Issue resolved

---

# 15. Web UX

Required views:

- Deal photo gallery
- Visit gallery
- Area/system grouping
- Timeline grouping
- Grid and list views
- Image detail panel
- Finding review queue
- Before-and-after comparison
- Duplicate review
- Bulk categorization
- Bulk export/share selection
- Processing-status center

Premium UX requirements:

- Preserve selected image while moving between findings.
- Support keyboard navigation.
- Show image, finding, evidence quality, confidence, status, and related actions together.
- Do not bury material findings behind decorative gallery treatment.
- Avoid excessive card nesting.
- Provide clear zoom and full-screen inspection.
- Support fast batch review.

---

# 16. iPhone UX

The iPhone experience must prioritize field speed:

- Open camera in no more than two taps from active Deal.
- Capture continuously.
- Show local-save confirmation immediately.
- Allow quick room/system tagging.
- Allow voice caption after capture.
- Show upload queue without blocking capture.
- Allow offline review.
- Allow swipe between images and findings.
- Support one-handed actions.
- Use large touch targets.
- Keep critical status visible.

---

# 17. iPad UX

The iPad experience must support:

- Multi-column gallery and detail
- Side-by-side image comparison
- Drag and drop
- Pencil annotation where appropriate
- Keyboard shortcuts
- Bulk review
- Document and photo comparison
- Cockpit plus visual evidence coexistence
- No stretched iPhone layout

---

# 18. Offline and Synchronization

- Captured images must persist locally until canonical upload succeeds.
- Local records need durable client IDs and idempotency keys.
- Sync must resume after connectivity returns.
- Conflicting metadata edits must use row-version checks.
- Original image upload must never be overwritten by a metadata conflict.
- Duplicate upload retries must resolve to one canonical media record.
- Offline findings may be drafted manually but AI analysis waits for connectivity unless an approved on-device workflow exists.
- User must see which images are local-only, uploading, synced, processing, or failed.

---

# 19. Error States

Distinct errors must exist for:

- Camera permission denied
- Photo-library permission denied
- Storage permission denied
- File too large
- Unsupported format
- Corrupt file
- Upload interrupted
- Integrity mismatch
- Storage unavailable
- Processing timeout
- AI provider unavailable
- Analysis rejected by provider
- Duplicate conflict
- Record version conflict
- Workspace permission denied
- Deal archived or deleted during upload
- Offline with insufficient local storage

Each error must explain:

- What failed
- What was preserved
- Whether the Deal analysis is affected
- How to retry or continue manually
- Support reference ID where appropriate

---

# 20. Performance Requirements

- Camera capture acknowledgment must feel immediate.
- Thumbnail display must not require downloading original files.
- Gallery must paginate or virtualize.
- Large uploads must use resumable or chunked strategy where supported.
- Background processing must not block navigation.
- Decision-critical findings must load before noncritical metadata.
- Original downloads must occur only on explicit user action or justified high-resolution review.
- Cached derivatives must use explicit version and invalidation rules.

---

# 21. Accessibility

- All image controls require accessible labels.
- Findings must have text equivalents.
- Color cannot be the only severity indicator.
- Annotation regions need accessible descriptions where feasible.
- Keyboard navigation must work on web and iPad.
- Dynamic Type and VoiceOver must not break field capture or review.
- Reduced Motion must be respected.
- Error and upload states must be announced.

---

# 22. Permissions

Minimum permissions:

- Viewer: view authorized images and accepted findings
- Contributor: upload, classify, annotate, and draft findings
- Analyst: accept/reject findings and create proposed assumptions
- Administrator: manage visibility, retention, and correction workflows
- Owner: workspace policy and deletion authority
- Platform administrator: operational support only, fully audited

All authorization must be enforced server-side and through RLS/storage policies.

---

# 23. Domain Events

PhotoIQ may consume:

- `deal.created`
- `deal.archived`
- `deal.restored`
- `visit.started`
- `visit.completed`
- `evidence.imported`
- `contract.deadline.updated`
- `inspection.created`
- `appraisal.created`

PhotoIQ must emit:

- `media.capture_started`
- `media.local_saved`
- `media.upload_queued`
- `media.uploaded`
- `media.upload_failed`
- `media.processing_started`
- `media.processing_completed`
- `media.processing_failed`
- `media.duplicate_detected`
- `visual_finding.created`
- `visual_finding.accepted`
- `visual_finding.rejected`
- `visual_finding.professionally_verified`
- `visual_finding.resolved`
- `assumption_change.proposed`

Events must be idempotent and auditable.

---

# 24. Notifications

Optional notifications:

- Upload failed
- Batch processing complete
- Findings ready for review
- Potentially critical finding identified
- Professional review recommended
- Duplicate review required
- Assumption change pending approval

Notifications must deep-link to the exact Deal, image, finding, or queue item.

---

# 25. Reporting and Sharing

Reports may include selected visual evidence only.

Required controls:

- Include original or optimized derivative
- Include annotations
- Include accepted findings
- Include AI confidence and limitation language
- Include capture/source date
- Redact location metadata where required
- Exclude rejected findings by default
- Mark professionally verified findings distinctly

Shared access must be revocable and permission-scoped.

---

# 26. Observability and Cost Controls

Track:

- Upload success/failure rate
- Average upload duration
- Processing duration
- AI analysis success/failure
- Cost per image and per Deal
- Duplicate rate
- User acceptance/rejection rate
- Retry count
- Storage growth
- Derivative generation failures
- Background queue age

No sensitive image content may appear in logs.

---

# 27. Acceptance Tests

At minimum:

1. User captures ten photos offline during a Visit.
2. App terminates and reopens with all ten photos preserved.
3. Connectivity returns and uploads resume without duplicates.
4. Each image attaches to the correct Deal and Visit.
5. Thumbnails appear while originals remain private.
6. AI analysis creates proposed findings linked to exact images.
7. User rejects one finding and edits another.
8. Original AI results remain historically available.
9. User accepts a repair-related finding.
10. Proposed assumption change is created, not silently applied.
11. User approves the assumption change.
12. Underwriting creates a new snapshot and recalculates.
13. Cockpit shows before/after recommendation context.
14. Report includes only selected accepted findings.
15. Unauthorized workspace user cannot access image or derivative.
16. Duplicate upload retry produces one canonical record.
17. AI provider failure leaves manual workflow available.
18. Listing photo and current Visit photo can be compared side by side.
19. Web, iPhone, and iPad show the same accepted finding state.
20. Archived Deal blocks new capture while preserving existing evidence.

---

# 28. Regression Tests

Regression coverage must prove:

- Original image remains immutable.
- Storage authorization remains isolated.
- Image deletion does not erase audit history improperly.
- Rejected findings do not enter reports or underwriting.
- Accepted findings do not bypass assumption approval.
- Duplicate detection does not discard unique evidence.
- Retry does not create duplicate media rows.
- Stale findings are labeled after new evidence supersedes them.
- Cross-client status remains consistent.
- Background processing cannot remain indefinitely unresolved without escalation.

---

# 29. Definition of Done

PhotoIQ is complete only when:

- Camera, library, drag-and-drop, and listing-image intake work.
- Original media is securely preserved.
- Uploads survive interruption.
- Offline capture and later sync work.
- Gallery and review experiences are production-quality.
- AI findings are source-linked, limited, reviewable, and historically preserved.
- User corrections work.
- Proposed assumption changes flow through canonical approval and underwriting.
- VisitIQ, InspectionIQ, OfferIQ, ReportIQ, Cockpit, timeline, tasks, and notifications are connected.
- Web, iPhone, and iPad show consistent canonical state.
- Empty, loading, processing, partial, stale, conflict, offline, permission, and failure states are designed and tested.
- RLS and storage tests pass.
- Accessibility checks pass.
- Performance and cost monitoring exist.
- No dead controls, placeholder data, fake analysis, silent failure, or disconnected state remains.

At completion, Codex must provide:

1. Files changed
2. Database changes
3. Storage-policy changes
4. API and Edge Function changes
5. Background-job changes
6. Tests added
7. Exact commands and results
8. Known limitations
9. Confirmation unrelated files were not changed
10. `CHAPTER COMPLETE` or `CHAPTER NOT COMPLETE`
