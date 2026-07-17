# BRIX Specification 013 — PhotoIQ and Visual Evidence

## 1. Authority and Rules of Engagement

This specification is governed by:

- `docs/00-START-HERE.md`
- `docs/01-PRODUCT-CONSTITUTION.md`
- `docs/02-ENGINEERING-STANDARDS.md`
- `docs/03-DATA-ARCHITECTURE.md`
- `docs/04-UI-UX-SYSTEM.md`
- `docs/05-BUILD-ROADMAP.md`
- `specs/003-deals-and-pdrm-core.md`
- `specs/004-property-intake-and-source-tracking.md`
- `specs/007-decision-cockpit.md`
- `specs/012-offeriq-and-negotiation-management.md`

PhotoIQ must obey the following rules:

1. PhotoIQ uses the canonical Deal, Property, Evidence, Visit, task, timeline, finding, assumption, report, and audit systems.
2. Original image and video files remain immutable Evidence.
3. AI analyzes actual image pixels. Filename, EXIF, caption, or surrounding text may provide context but may never substitute for pixel analysis.
4. PhotoIQ must separate visible observation, inferred condition, possible cause, recommended verification, and professional conclusion.
5. PhotoIQ must never present an AI observation as an inspection, engineering, roofing, electrical, plumbing, HVAC, environmental, accessibility, appraisal, code, or legal conclusion.
6. Low-confidence, obstructed, distant, blurry, incomplete, poorly lit, edited, duplicate, or context-limited media must be labeled accordingly.
7. PhotoIQ may propose a repair item, risk, task, or assumption change, but may never silently alter underwriting, OfferIQ, strategy ranking, Deal facts, or recommendation.
8. Every accepted change must preserve source image, user decision, prior value, new value, and resulting recalculation history.
9. Processing failure must preserve the original media and all prior valid analysis.
10. Web, iPhone, iPad, reports, Decision Cockpit, VisitIQ, InspectionIQ, and underwriting must use the same canonical photo state.
11. All background processing must expose queued, uploading, processing, partial, complete, failed, stale, and retry states.
12. No image may become orphaned from its Deal, Property, Visit, room, system, issue, or evidence record.

## 2. Mission

PhotoIQ converts property images and videos into organized, source-linked visual evidence that helps an investor understand condition, renovation scope, visible risk, verification needs, offer leverage, and possible financial impact.

PhotoIQ must answer:

1. What is visible?
2. Where is it visible?
3. How confident is the observation?
4. Is the observation cosmetic, maintenance-related, safety-related, structural-indicator-related, operational, accessibility-related, or unknown?
5. What should be verified by a qualified professional?
6. Could the observation affect repair assumptions, strategy, financing, insurance, governance, inspection, appraisal, offer terms, or Deal recommendation?
7. Has the user confirmed, corrected, rejected, or deferred the finding?

## 3. Scope

PhotoIQ includes:

- Image and video intake
- Camera capture
- Batch upload
- Room, area, system, and issue organization
- Duplicate and near-duplicate detection
- Image quality assessment
- Visible-condition analysis
- Renovation opportunity analysis
- Safety and accessibility observation support
- Before/after comparison
- Visit-linked media
- Listing-photo and user-photo comparison
- User confirmation and correction
- Repair-assumption proposals
- Offer and due-diligence support
- Professional verification questions
- Report-ready visual evidence

PhotoIQ does not:

- Replace a professional inspection
- Diagnose hidden conditions
- Determine code compliance
- Determine structural adequacy
- Determine environmental safety
- Determine insurability or lender acceptance
- Estimate authoritative repair cost without an accepted source or canonical estimating workflow
- Modify authoritative financial outputs directly

## 4. Canonical Entities

### `media_assets`

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `property_id`
- `visit_id`
- `evidence_id`
- `media_type`
- `storage_path`
- `original_filename`
- `mime_type`
- `file_size`
- `file_hash`
- `perceptual_hash`
- `width`
- `height`
- `duration_seconds`
- `captured_at`
- `uploaded_at`
- `captured_by`
- `source_type`
- `location_permission_state`
- `latitude`
- `longitude`
- `orientation`
- `processing_state`
- `verification_state`
- `retention_state`
- `created_at`
- `updated_at`

### `media_collections`

Use for rooms, exterior elevations, systems, visits, listing-photo sets, before/after groups, and user-defined groups.

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `property_id`
- `visit_id`
- `collection_type`
- `title`
- `description`
- `sort_order`
- `created_by`
- `created_at`

### `media_collection_items`

Required fields:

- `collection_id`
- `media_asset_id`
- `sort_order`
- `caption`
- `room_or_area`
- `system_category`
- `user_tags`
- `created_at`

### `photo_findings`

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `property_id`
- `media_asset_id`
- `finding_type`
- `category`
- `title`
- `visible_observation`
- `possible_interpretation`
- `possible_cause`
- `severity`
- `confidence`
- `bounding_region`
- `source_frame_time`
- `verification_state`
- `professional_review_type`
- `user_disposition`
- `user_correction`
- `materiality`
- `created_at`
- `updated_at`

### `photo_change_proposals`

Required fields:

- `id`
- `photo_finding_id`
- `proposal_type`
- `target_subsystem`
- `target_record_id`
- `current_value`
- `proposed_value`
- `reason`
- `status`
- `created_by`
- `reviewed_by`
- `reviewed_at`
- `created_at`

Supported statuses:

- Draft
- Awaiting Review
- Accepted
- Edited and Accepted
- Rejected
- Deferred
- Superseded

## 5. Supported Media Sources

- iPhone and iPad camera
- iOS Photos picker
- Web file upload
- Drag and drop
- Listing images
- MLS or licensed provider images where permitted
- Email attachments
- Contract or inspection attachments
- VisitIQ capture
- Shared files
- Video capture
- Video frame extraction
- Before/after renovation sets
- Contractor or inspector supplied images

Every source must retain source classification, date, owner/uploader, license or use restriction where relevant, and original file integrity.

## 6. Media Intake Workflow

1. Select or capture media.
2. Create local draft and preserve the user’s progress.
3. Assign Deal, Property, and Visit context.
4. Calculate file hash and perceptual hash.
5. Detect exact and near duplicates.
6. Upload through authorized storage path.
7. Create canonical Evidence and media records.
8. Generate safe derivatives such as thumbnails and previews.
9. Run image-quality assessment.
10. Run analysis when requested or automatically allowed by workspace settings.
11. Present findings as proposed observations.
12. Allow user confirm, edit, reject, merge, defer, or request professional review.
13. Create accepted connected tasks or proposals.
14. Emit domain events.
15. Refresh Cockpit, timeline, reports, and affected workflows.

The user must be able to continue manually when upload or analysis fails.

## 7. Image Quality Assessment

PhotoIQ must assess:

- Blur
- Motion blur
- Low light
- Overexposure
- Underexposure
- Obstruction
- Distance
- Cropping
- Orientation
- Resolution
- Compression artifacts
- Duplicate or near duplicate
- Lack of scale or context
- Possible editing or screenshot origin

Quality results must explain whether the media is sufficient for a useful observation and suggest a better capture when appropriate.

## 8. Finding Categories

### Exterior and site

- Roof surface indicators
- Flashing visibility
- Gutters and downspouts
- Drainage and grading
- Foundation indicators
- Cracks and movement indicators
- Siding and masonry
- Windows and doors
- Decks, porches, balconies, and stairs
- Driveways, parking, curbs, and sidewalks
- Retaining walls
- Vegetation contact
- Standing water
- Erosion
- Fencing
- Outbuildings
- Utility service indicators

### Interior

- Walls and ceilings
- Flooring
- Doors and windows
- Kitchens
- Bathrooms
- Basements and crawl spaces
- Attics where visible
- Moisture indicators
- Staining and discoloration
- Visible damage
- Finish condition
- Layout and functionality
- Accessibility barriers
- Deferred maintenance
- Renovation potential

### Systems

- Electrical indicators
- Plumbing indicators
- HVAC indicators
- Water-heater indicators
- Fire and life-safety indicators
- Commercial mechanical indicators
- Sprinkler and alarm indicators
- Elevator indicators
- Utility and meter indicators

### Commercial and specialty

- Storefronts
- Loading areas
- Roof-mounted equipment
- Parking lots
- Common areas
- Unit interiors
- ADA-related visible conditions
- Signage
- Tenant improvements
- Warehouse racking areas
- Hospitality guest rooms and common areas
- Self-storage structures
- Mobile-home and RV-park infrastructure
- Land access and visible site constraints

## 9. Observation and Inference Model

Every finding must separate:

- **Visible observation:** what can be directly seen.
- **Possible interpretation:** what the observation may indicate.
- **Possible cause:** one or more plausible causes, never stated as confirmed without evidence.
- **Verification need:** who or what should confirm it.
- **Potential impact:** how the issue may affect the Deal.

Example:

- Visible observation: brown staining near a ceiling joint.
- Possible interpretation: prior or active moisture exposure.
- Possible cause: roof, plumbing, condensation, or historical event.
- Verification need: moisture testing and inspection by an appropriate professional.
- Potential impact: repair scope, insurance, inspection contingency, offer, or underwriting assumption.

## 10. Severity and Confidence

### Severity

- Informational
- Cosmetic
- Maintenance
- Moderate concern
- Material concern
- Potential safety concern
- Potential major-system concern
- Unknown pending verification

### Confidence

- High
- Medium
- Low
- Insufficient evidence

Severity and confidence must be displayed separately. A high-confidence cosmetic observation is not the same as a low-confidence potential major concern.

## 11. User Review Workflow

For each finding, the user may:

- Confirm
- Edit wording
- Change category
- Change severity
- Add context
- Reject
- Merge duplicate findings
- Defer
- Mark professional review requested
- Create task
- Propose repair assumption
- Attach contractor quote
- Link inspection finding

User correction must never overwrite the original AI output. Both must remain auditable.

## 12. Repair and Underwriting Connection

PhotoIQ may propose:

- New repair item
- Repair-cost placeholder
- Scope clarification
- Contingency increase
- Specialist inspection
- Offer credit request
- Due-diligence task
- Strategy risk flag

Accepted proposals must route to the canonical owner. PhotoIQ must not directly write authoritative financial values.

When an accepted change affects underwriting:

1. Preserve the prior assumption.
2. Create a versioned change.
3. Trigger targeted recalculation.
4. Mark prior recommendation stale until recalculation completes.
5. Re-rank strategies if material.
6. Update OfferIQ, Cockpit, reports, and timeline.
7. Preserve before-and-after result history.

## 13. Listing Photo Comparison

PhotoIQ should support comparison between listing media and user-captured media.

Required behavior:

- Match similar rooms or views when possible.
- Identify visible differences.
- Label uncertainty.
- Preserve source date.
- Detect potentially outdated listing media.
- Never accuse a seller or listing source of misrepresentation based only on image differences.
- Create verification questions where material differences exist.

## 14. Before and After Workflows

Support:

- Pre-purchase versus inspection
- Pre-renovation versus post-renovation
- Contractor progress
- Insurance or damage documentation
- Tenant turnover
- Stabilization progress
- Ongoing asset-condition tracking

Before/after groups must preserve capture date, source, location, orientation, and user-approved pairing.

## 15. User Experience Requirements

### Web

- Gallery, list, and evidence views
- Room/system filters
- Upload queue
- Side-by-side image and findings
- Zoom and source-region highlighting
- Bulk tagging and organization
- Duplicate review
- Before/after comparison
- Repair proposal panel
- Deal impact panel
- Keyboard navigation

### iPhone

- Fast camera launch
- One-handed capture
- Burst or rapid multi-photo workflow
- Room/system tagging during or after capture
- Voice caption support through VisitIQ
- Offline capture queue
- Background upload
- Clear local versus synced state
- Large touch targets
- Minimal taps during field use

### iPad

- Multi-column gallery and finding review
- Drag and drop
- Side-by-side image, report, and Deal context
- Pencil/markup support where appropriate
- Keyboard and pointer support
- Large-screen comparison

## 16. State Model

- Local Draft
- Queued
- Uploading
- Uploaded
- Processing
- Partial Analysis
- Awaiting User Review
- Confirmed
- Confirmed with Professional Review Needed
- Rejected
- Failed with Original Preserved
- Retry Scheduled
- Offline Cached
- Stale
- Superseded
- Archived

The UI must never use a generic spinner for all states.

## 17. Offline, Sync, and Conflict Handling

- Media captured offline must remain encrypted locally until upload.
- App termination must not lose queued media.
- Background upload must resume safely.
- Duplicate retries must be idempotent.
- Conflicting edits must be detected before overwrite.
- User corrections must merge through explicit conflict resolution.
- Local and server states must be visible.
- Failed analysis must not remove prior valid findings.
- Storage cleanup may occur only after canonical confirmation and retention rules.

## 18. Security and Privacy

- Workspace and Deal RLS required.
- Storage paths must be private and authorized.
- Signed URLs must be short-lived and scoped.
- EXIF location must be retained only with user permission and policy.
- Faces, license plates, personal documents, and occupancy indicators may require privacy controls.
- Sensitive media must not appear in unsafe logs.
- AI/provider processing must follow workspace privacy policy.
- Provider credentials remain server-side.
- Sharing and exports require explicit scope.
- Deletion and retention rules must be auditable.

## 19. Domain Events

- `photo.media_captured`
- `photo.media_uploaded`
- `photo.upload_failed`
- `photo.analysis_requested`
- `photo.analysis_completed`
- `photo.analysis_failed`
- `photo.finding_created`
- `photo.finding_confirmed`
- `photo.finding_corrected`
- `photo.finding_rejected`
- `photo.proposal_created`
- `photo.proposal_accepted`
- `photo.professional_review_requested`
- `photo.collection_updated`
- `photo.before_after_linked`

Consumers may include VisitIQ, tasks, timeline, underwriting, StrategyIQ, OfferIQ, InspectionIQ, Decision Cockpit, ReportIQ, notifications, and audit.

## 20. Performance Requirements

- Capture acknowledgment must be immediate.
- Thumbnail generation must not block navigation.
- Large galleries must paginate or virtualize.
- Uploads must be resumable where platform support allows.
- Background processing must not block unrelated Deal work.
- User may prioritize specific media for analysis.
- Derived images must be appropriately sized for device and network conditions.
- Original files must remain available according to retention policy.

## 21. Accessibility Requirements

- All actionable controls require accessible labels.
- Findings need text alternatives and source descriptions.
- Color may not be the sole status indicator.
- Zoom and pan must remain keyboard and touch accessible.
- Dynamic Type and VoiceOver must work on iOS.
- Reduced Motion must be respected.
- Annotation regions require text equivalents.

## 22. Testing Requirements

- Upload, retry, cancellation, and duplicate tests
- Hash and perceptual-hash tests
- Exact and near-duplicate fixtures
- Offline capture and relaunch recovery tests
- Background upload tests
- Image-quality assessment fixtures
- Observation versus inference tests
- Low-confidence and insufficient-evidence tests
- User correction and audit tests
- Accepted proposal and underwriting integration tests
- RLS and Storage authorization tests
- Signed URL expiration tests
- Large gallery performance tests
- Web, iPhone, and iPad reconciliation tests
- Accessibility tests
- Provider outage and partial-analysis tests

## 23. Verification and Validation

### Functional verification

- Media can be captured, uploaded, saved, reopened, organized, analyzed, corrected, compared, archived, and restored.
- Original media remains intact.
- Duplicate detection works without silent deletion.
- Failed processing preserves source files and prior valid analysis.
- Accepted findings create the correct connected actions.

### Accuracy and boundary verification

- Pixel analysis is used.
- Visible observation is distinct from inference and cause.
- No inspection-grade or professional conclusion is implied.
- Confidence and severity are independent.
- Low-quality or insufficient media is labeled clearly.

### Integration verification

- PhotoIQ uses canonical Deal, Property, Evidence, Visit, task, timeline, and audit records.
- Accepted proposals route to the owning subsystem.
- Underwriting is recalculated only through versioned accepted changes.
- OfferIQ, InspectionIQ, StrategyIQ, Cockpit, reports, and notifications receive deterministic events.
- No orphaned media, finding, proposal, task, or report reference remains.
- Web, iPhone, iPad, and reports show the same canonical state.

### UX verification

- Web gallery and review workflows are complete.
- iPhone capture is field-ready and works offline.
- iPad comparison is native and not a stretched phone layout.
- Loading, empty, partial, stale, offline, retry, permission, and conflict states are designed.
- User always knows whether media is local, uploaded, processing, reviewed, or current.

### Security verification

- RLS and Storage isolation pass.
- Signed URLs are scoped and expire.
- Sensitive metadata and media do not leak through logs or unauthorized sharing.
- Provider secrets remain server-side.
- Deletion and retention behavior is audited.

### Production readiness

PhotoIQ is complete only when:

- No dead controls, mock findings, placeholder analysis, or fake success states remain.
- Media survives interruption and relaunch.
- Background jobs expose status and retry.
- Findings are source-linked and auditable.
- Accepted changes connect seamlessly to the rest of BRIX.
- All required automated and device tests pass.
- A real investor can capture property media, understand visible observations, confirm or correct findings, create connected actions, and reopen the same current state without developer assistance.

**Status: COMPLETE SPECIFICATION — implementation remains subject to repository verification and chapter completion rules.**