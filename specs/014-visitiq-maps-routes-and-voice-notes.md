# 014 — VisitIQ, Maps, Routes, and Voice Notes

## Mission

VisitIQ turns fieldwork into structured, reliable Deal evidence. It must help an investor plan property visits, navigate efficiently, capture observations quickly, work with weak connectivity, and convert field notes into actionable Deal updates without silently altering underwriting.

This specification is authoritative for visit planning, route planning, map behavior, location handling, field checklists, voice notes, transcription, offline capture, upload recovery, and visit completion workflows across web, iPhone, and iPad.

---

## Permanent Rules

1. Every visit belongs to one canonical `deal_id` and, when applicable, one canonical `property_id`.
2. Every captured note, audio file, transcript, location point, task, photo reference, and visit outcome must be traceable to its originating visit.
3. Location access is optional. Denial of permission must not block Deal access or manual visit completion.
4. Voice transcription may suggest findings, tasks, or assumption changes, but may not silently change canonical underwriting.
5. Offline capture must preserve user work until successful sync.
6. Background upload and transcription must expose durable states, retry, and failure details.
7. Map and route results are estimates, not guarantees.
8. A route must never create duplicate Deals or duplicate visits.
9. Every visible control must work end to end or remain hidden behind a feature flag.
10. Web, iPhone, and iPad must show the same canonical visit status and evidence after synchronization.

---

## Business Purpose

Investors often evaluate multiple properties in one day while driving, walking buildings, speaking with agents, and recording rapid observations. Traditional CRMs and underwriting tools lose this context or force users to re-enter notes later.

VisitIQ must reduce field friction by allowing users to:

- Build a visit list from active Deals
- Create an efficient route
- Launch directions from current location
- View key Deal facts before arrival
- Use a property-specific checklist
- Capture voice notes, text notes, photos, and videos
- Work offline
- Convert observations into structured follow-up
- Preserve complete visit history
- Re-underwrite only after confirmed changes

---

## Scope

### Included

- Single-property visit creation
- Multi-property visit-day planning
- Route creation and reorder
- Current-location directions
- Apple Maps handoff
- Configurable supported map-provider handoff
- Arrival and departure tracking with permission
- Visit checklists
- Text notes
- Voice recording
- Speech-to-text transcription
- Offline note and media queue
- Background upload status
- Suggested findings and tasks
- Visit summary and completion
- Timeline and audit integration
- Web preparation and review
- Native iPhone field workflow
- Native iPad planning and review workflow

### Excluded from this specification

- Authoritative property inspection conclusions
- Authoritative repair estimates
- Photo defect analysis rules, governed by PhotoIQ
- Contract deadline extraction, governed by ContractIQ
- Final underwriting calculations, governed by the deterministic underwriting engine
- Real-time turn-by-turn navigation inside BRIX unless separately approved

---

## Dependencies

VisitIQ depends on:

- Authentication and workspaces
- Dashboard and application shell
- Deals and PDRM core
- Property intake and geocoding
- Decision cockpit
- PhotoIQ
- Evidence and audit architecture
- Notification infrastructure
- Native iOS permissions and secure local storage

---

## Canonical Entities

### `visits`

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `property_id`
- `route_plan_id`, nullable
- `scheduled_start_at`, nullable
- `scheduled_end_at`, nullable
- `actual_arrival_at`, nullable
- `actual_departure_at`, nullable
- `timezone`
- `status`
- `visit_type`
- `created_by_user_id`
- `assigned_to_user_id`, nullable
- `title`
- `purpose`
- `pre_visit_summary`
- `completion_summary`, nullable
- `overall_impression`, nullable
- `follow_up_required`
- `location_permission_state`
- `arrival_source`
- `departure_source`
- `created_at`
- `updated_at`
- `completed_at`, nullable
- `archived_at`, nullable
- `version`

### Visit status enum

- `draft`
- `scheduled`
- `ready`
- `en_route`
- `arrived`
- `in_progress`
- `paused`
- `completed`
- `cancelled`
- `missed`
- `archived`

### `route_plans`

Required fields:

- `id`
- `workspace_id`
- `owner_user_id`
- `name`
- `route_date`
- `timezone`
- `start_location_type`
- `start_latitude`, nullable
- `start_longitude`, nullable
- `start_address`, nullable
- `end_location_type`
- `end_latitude`, nullable
- `end_longitude`, nullable
- `end_address`, nullable
- `transport_mode`
- `optimization_mode`
- `provider`
- `estimated_distance`
- `estimated_duration_seconds`
- `provider_retrieved_at`
- `status`
- `created_at`
- `updated_at`
- `version`

### `route_stops`

Required fields:

- `id`
- `route_plan_id`
- `visit_id`
- `deal_id`
- `property_id`
- `sequence_number`
- `planned_arrival_at`, nullable
- `planned_departure_at`, nullable
- `estimated_travel_seconds`, nullable
- `estimated_distance`, nullable
- `locked_sequence`
- `status`
- `notes`, nullable
- `created_at`
- `updated_at`

### `visit_checklist_items`

Required fields:

- `id`
- `visit_id`
- `template_item_id`, nullable
- `category`
- `label`
- `description`, nullable
- `sequence_number`
- `required`
- `status`
- `response_type`
- `response_value`, nullable
- `evidence_id`, nullable
- `completed_by_user_id`, nullable
- `completed_at`, nullable
- `created_at`
- `updated_at`

### `voice_notes`

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `property_id`, nullable
- `visit_id`, nullable
- `created_by_user_id`
- `audio_evidence_id`
- `duration_seconds`
- `recorded_at`
- `recording_timezone`
- `recording_location_latitude`, nullable
- `recording_location_longitude`, nullable
- `location_permission_state`
- `upload_state`
- `transcription_state`
- `transcript_text`, nullable
- `transcript_language`, nullable
- `transcription_provider`, nullable
- `transcription_model`, nullable
- `transcription_confidence`, nullable
- `speaker_labels`, nullable
- `user_corrected_transcript`, nullable
- `analysis_state`
- `created_at`
- `updated_at`
- `version`

### `visit_observations`

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `property_id`, nullable
- `visit_id`
- `source_type`
- `source_id`
- `category`
- `observation_text`
- `classification`
- `confidence`
- `user_confirmation_state`
- `materiality`
- `suggested_action`, nullable
- `suggested_assumption_field`, nullable
- `suggested_assumption_value`, nullable
- `created_at`
- `updated_at`

---

## Visit Types

Minimum supported types:

- Initial exterior drive-by
- Initial showing
- Second showing
- Contractor walkthrough
- Inspection attendance
- Appraisal attendance
- Lender or partner walkthrough
- Final walkthrough
- Commercial tenant walkthrough
- Land/site visit
- Portfolio tour
- Post-closing condition review
- Custom

Visit type may control default checklist templates but may not alter canonical property facts without confirmation.

---

## Route Planning Workflow

### Create route

1. User selects active Deals or existing scheduled visits.
2. System validates each stop has usable coordinates or address.
3. Invalid stops remain selectable but are visibly blocked until corrected.
4. User chooses date, start location, end location, transport mode, and optimization mode.
5. System requests route estimate from configured provider.
6. System stores provider, retrieval time, stop order, estimated distance, and duration.
7. User may accept, manually reorder, lock stops, or remove stops.
8. Saving creates or updates one canonical route plan.
9. Route appears on dashboard, calendar/agenda, Deal timeline, and native app.

### Optimization modes

- Fastest overall
- Shortest overall where supported
- Preserve selected order
- Optimize unlocked stops only
- Earliest appointment first
- Custom manual order

### Route rules

- Provider results are estimates and must show retrieval time.
- Locked stops may not be reordered automatically.
- Appointment windows must be respected where provided.
- A route recalculation creates a new version or history event.
- Recalculation must not duplicate visits.
- Provider failure must preserve the current route and allow manual ordering.
- Route updates must be idempotent.

---

## Directions Workflow

From a Deal, visit, route stop, dashboard card, or notification, the user may select `Directions`.

Required behavior:

- Resolve the canonical property coordinates.
- If coordinates are unavailable, use validated address.
- Offer Apple Maps on iOS.
- Offer configured supported providers where available.
- Preserve the Deal and visit context when returning to BRIX.
- Record a non-sensitive activity event that directions were launched.
- Never claim live traffic or arrival accuracy beyond provider data.

---

## Pre-Visit Experience

Before arrival, VisitIQ must show:

- Property address and primary photo
- Listing price and current Deal stage
- Selected and strongest strategies
- Key financial outputs
- Major risks
- Missing decision-changing information
- Contact names and showing instructions
- Access notes
- Association or parking restrictions already known
- Prior visits and unresolved observations
- Required checklist items
- Documents useful during the visit
- Route position and planned arrival time

The pre-visit screen must prioritize field readability and must not require reviewing the full Deal workspace.

---

## Visit Checklist System

Checklist templates must support property and visit types.

Minimum categories:

- Site and neighborhood
- Access and parking
- Exterior
- Roof indicators
- Drainage and grading
- Foundation indicators
- Structure
- Windows and doors
- Electrical indicators
- Plumbing indicators
- HVAC indicators
- Interior condition
- Kitchens
- Bathrooms
- Flooring
- Basement or crawlspace
- Moisture indicators
- Safety
- Accessibility
- Utilities
- Unit mix
- Commercial systems
- Tenant condition
- Deferred maintenance
- Renovation opportunity
- Governance restrictions observed
- Questions for seller or agent
- Measurements
- Documents requested

Checklist responses may include:

- Complete/incomplete
- Yes/no/unknown
- Condition rating
- Numeric measurement
- Text note
- Photo/video reference
- Voice note reference
- Not applicable

Checklist templates must be versioned. Existing completed visits must retain the template version used.

---

## Voice Recording Workflow

### Start recording

1. User opens the active Deal or Visit.
2. User taps a clearly labeled voice-note control.
3. App requests microphone permission only when needed.
4. If denied, app explains how to enable permission and allows text notes.
5. Recording UI shows elapsed time, pause, resume, cancel, and finish.
6. The active Deal and Visit remain visible.
7. Audio is saved locally before upload begins.

### Finish recording

1. Local audio file is finalized atomically.
2. Voice-note record is created with local pending state.
3. Upload begins immediately when connectivity allows.
4. User may continue working while upload proceeds.
5. Successful upload creates immutable evidence.
6. Transcription begins only after durable upload.
7. Transcript is stored separately from original audio.
8. AI may extract suggested observations, tasks, questions, or assumption changes.
9. User must confirm any change that affects underwriting or strategy results.

### Recording rules

- Original audio is never replaced by transcript.
- Cancelling before completion must clearly state whether draft audio will be discarded.
- App termination during recording must recover the last safely finalized segment where technically possible.
- Duplicate retries must not create duplicate voice notes.
- Recordings must use a documented supported format and reasonable compression.
- Long recordings must upload in a resumable or reliably retryable manner.

---

## Transcription and AI Processing

Transcription output must retain:

- Provider
- Model
- Model version where available
- Language
- Timestamp
- Confidence
- Speaker labels when supported
- Processing duration
- Input evidence ID
- Workflow version

AI extraction may suggest:

- Visible or verbalized condition observations
- Questions to ask
- Tasks
- Follow-up professionals
- Repair categories
- Missing documents
- Potential strategy impacts
- Potential assumption changes

AI extraction may not:

- Declare an inspection conclusion
- Declare a legal conclusion
- Replace a professional report
- Silently alter a financial input
- Silently change strategy ranking
- Present an inferred cause as a fact

Low-confidence transcript segments must be marked and easy to correct.

---

## Offline Behavior

The native application must support offline:

- Opening recently cached Visit and Deal summaries
- Viewing route stop order and addresses
- Completing checklist items
- Creating text notes
- Recording voice notes
- Capturing photos and video
- Marking arrival/departure manually
- Completing a visit draft

Offline records must include:

- Local UUID
- Canonical target IDs when known
- Created timestamp
- Device timestamp
- Sync state
- Retry count
- Last error
- Content hash where appropriate

Offline sync rules:

- Upload original evidence before derived processing.
- Use idempotency keys.
- Preserve local data until server confirmation.
- Detect record-version conflicts.
- Never silently overwrite a newer canonical record.
- Allow user conflict resolution for editable notes or checklist responses.
- Append-only evidence must not conflict through destructive overwrite.

---

## Background Job States

Required states:

- Local draft
- Queued
- Uploading
- Uploaded
- Transcribing
- Analyzing
- Awaiting confirmation
- Complete
- Partially complete
- Failed
- Retry scheduled
- Blocked
- Cancelled
- Superseded

The UI must expose meaningful state and may not use a generic spinner indefinitely.

Timeouts and escalation behavior must exist for:

- Route-provider requests
- Media upload
- Transcription
- AI extraction
- Summary generation

---

## Visit Completion Workflow

A visit may be completed only after the user reviews:

- Checklist status
- Notes captured
- Voice notes and transcription state
- Photos/media upload state
- Unresolved questions
- Suggested tasks
- Suggested assumption changes
- Follow-up professionals
- Overall impression
- Recommendation impact

Completion options:

- Complete now
- Complete with pending uploads
- Save as paused
- Cancel visit
- Mark missed

When completed:

1. Visit status changes canonically.
2. Completion summary is saved.
3. Deal timeline event is created.
4. Confirmed tasks and deadlines are created.
5. Confirmed observations become Deal evidence findings.
6. Confirmed assumption changes create a new assumption-set version.
7. Targeted re-underwriting runs if required.
8. Strategy ranking refreshes after canonical underwriting completes.
9. Cockpit shows before/after material changes.
10. User sees the next recommended action.

Pending uploads must remain visible and may not falsely show the visit as fully processed.

---

## Web UX

Web is optimized for:

- Planning visit days
- Reviewing map and route options
- Managing checklists
- Reviewing transcripts and media
- Confirming suggested findings
- Comparing multiple visits
- Generating visit reports

Required layouts:

- Route planning workspace
- Visit list and filters
- Visit detail
- Transcript review
- Evidence gallery integration
- Follow-up queue

Web must support keyboard navigation, accessible map alternatives, and printable/exportable visit summaries.

---

## iPhone UX

The iPhone app is the primary field client.

Required behavior:

- One-handed interaction
- Large touch targets
- Persistent active Visit access
- Quick photo and voice-note controls
- Offline status indicator
- Background-upload indicator
- Route stop progress
- Minimal typing
- Safe-area support
- Dynamic Type
- VoiceOver
- Battery-aware location use

The active Visit screen must make these actions reachable quickly:

- Directions
- Arrive
- Checklist
- Photo
- Voice note
- Text note
- Contact
- Complete visit

---

## iPad UX

The iPad app is optimized for:

- Route planning
- Split-view Deal and Visit context
- Checklist plus media review
- Transcript correction
- Comparing visits
- Reviewing documents alongside observations
- Keyboard and pointer use

It must not be a stretched iPhone interface.

---

## Permissions

Required permission handling:

- Microphone
- Speech recognition where used
- Camera
- Photo library
- Location while in use
- Background location only if separately justified and approved
- Notifications

Rules:

- Request permission at point of use.
- Explain the user benefit accurately.
- Provide a manual fallback.
- Do not repeatedly prompt after denial.
- Do not collect location beyond the documented feature need.
- Store permission state for UX, not as a substitute for platform authorization.

---

## Security and Privacy

- All visits are workspace-scoped.
- RLS must prevent cross-workspace access.
- Storage paths must be isolated by workspace and canonical evidence ID.
- Signed or authorized access is required for private media.
- Audio and location are sensitive evidence.
- Logs must not include transcript content, precise location, signed URLs, or secrets.
- Admin access to recordings must be audited.
- Deletion and retention must follow workspace policy.
- Shared reports must exclude precise location history unless intentionally included.

---

## Domain Events

Minimum events:

- `visit.created`
- `visit.scheduled`
- `visit.started`
- `visit.arrived`
- `visit.paused`
- `visit.completed`
- `visit.cancelled`
- `route.created`
- `route.updated`
- `route.recalculated`
- `route.stop.completed`
- `voice_note.recorded`
- `voice_note.uploaded`
- `voice_note.transcribed`
- `voice_note.transcription_failed`
- `visit_observation.suggested`
- `visit_observation.confirmed`
- `visit_task.created`
- `visit.assumption_change_confirmed`

Events must be idempotent, include canonical IDs, actor, timestamp, correlation ID, and source client.

---

## Notifications

Potential notifications:

- Visit starting soon
- Route changed
- Upload failed
- Transcription complete
- Transcription failed
- Suggested findings awaiting review
- Follow-up task due
- Visit completed with pending evidence

Notifications must deep-link to the exact Visit and Deal context.

---

## Error States

Required error classes:

- Permission denied
- Invalid or missing address
- Route provider unavailable
- Route timeout
- Upload failed
- Insufficient storage
- Recording interruption
- Transcription failed
- AI analysis failed
- Authentication expired
- Authorization denied
- Version conflict
- Offline
- Unsupported file format
- Provider rate limit

Every error must state:

- What failed
- What was preserved
- Whether the Deal decision is affected
- What the user can do next
- Correlation ID where appropriate

---

## Performance Targets

- Active Visit screen should become interactive within 2 seconds on a typical modern device using cached data.
- Recording controls must respond immediately.
- Local note/checklist save should feel instantaneous.
- Media upload must not block navigation.
- Route list scrolling must remain smooth with at least 50 stops.
- Visit history must paginate or virtualize for large portfolios.
- Background work must not materially degrade recording reliability.

---

## Analytics and Operational Metrics

Track without recording sensitive note content:

- Visits created/completed
- Route plans created
- Average stops per route
- Route-provider failures
- Voice notes created
- Upload success/failure
- Transcription success/failure
- Average processing time
- Offline queue age
- Retry counts
- Confirmation rate for suggested observations
- Visits completed with pending evidence

Platform admins need cost visibility for maps, transcription, AI analysis, storage, and media processing.

---

## Acceptance Tests

### Visit creation

- Create a visit from a Deal.
- Schedule it.
- Reopen on web and iPhone.
- Verify same canonical status and times.

### Route planning

- Select five Deals.
- Optimize route.
- Lock one stop.
- Recalculate.
- Verify locked stop remains fixed.
- Verify no duplicate visits are created.

### Directions

- Launch Apple Maps from iPhone.
- Return to BRIX.
- Verify active Visit context is preserved.

### Offline field capture

- Open Visit online.
- Disable connectivity.
- Complete checklist items.
- Record voice note.
- Capture photos.
- Complete visit draft.
- Relaunch app.
- Restore connectivity.
- Verify all evidence syncs once and attaches to the correct Deal.

### Voice note

- Record, pause, resume, and finish.
- Verify local preservation.
- Verify upload state.
- Verify transcript links to original audio.
- Correct transcript.
- Confirm one suggested task.
- Reject one suggested assumption change.
- Verify underwriting remains unchanged.

### Visit completion

- Confirm a repair observation and assumption change.
- Complete Visit.
- Verify assumption version created.
- Verify targeted underwriting runs once.
- Verify cockpit shows updated result and history.

### Failure recovery

- Force route-provider failure.
- Verify manual ordering remains available.
- Force upload failure.
- Verify original local file remains.
- Retry twice.
- Verify one canonical evidence record exists.

### Security

- Attempt cross-workspace Visit access.
- Attempt direct media URL access without authorization.
- Verify denial.

---

## Regression Tests

- Creating a route never duplicates Deals.
- Editing route order never changes property identity.
- Voice transcription never directly updates authoritative assumptions.
- Completing a Visit with pending upload never marks evidence processing complete.
- Retrying uploads never duplicates evidence.
- Reopening a Visit after app termination preserves draft work.
- A stale cached Visit never overwrites a newer server version silently.
- Notifications always open the correct Visit and Deal.
- iPad layout remains independently usable.
- Permission denial never blocks manual note capture.

---

## Definition of Done

This specification is complete only when:

- Visit creation, scheduling, execution, and completion work end to end.
- Multi-property route planning works and preserves locked order.
- Directions launch correctly.
- Native iPhone field workflow is production-quality.
- Native iPad planning/review workflow is production-quality.
- Voice notes survive interruption, upload reliably, and transcribe with source linkage.
- Offline capture and conflict-safe synchronization work.
- Suggested changes require explicit user confirmation.
- All background operations expose durable states and retry.
- RLS and storage authorization tests pass.
- Web, iPhone, iPad, reports, and Deal timeline reconcile.
- Accessibility checks pass.
- No dead controls, fake success states, orphaned evidence, or silent failures remain.
- Automated tests and realistic end-to-end tests pass.

`CHAPTER COMPLETE` may be declared only after the implementation team records files changed, migrations, APIs, tests, exact commands, results, known limitations, and confirms no unrelated changes.