# BRIX Specification 014 — VisitIQ, Maps, Routes, and Voice Notes

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
- `specs/008-marketiq-and-location-intelligence.md`
- `specs/013-photoiq-and-visual-evidence.md`

Rules of engagement:

1. VisitIQ uses the canonical Deal, Property, Visit, Route Plan, Evidence, Task, Timeline, Contact, Photo, Voice Note, and Audit systems.
2. VisitIQ must never create a second Deal, Property, task system, note system, map record, evidence store, or photo library.
3. Every route stop, visit, photo, recording, transcript, note, checklist item, and observation must attach to the correct canonical Deal and Property.
4. Mobile field work must remain usable with weak or no connectivity.
5. User work must survive app suspension, app termination, authentication refresh, network failure, provider outage, and safe retry.
6. Location, microphone, camera, speech, photo-library, and notification permissions are optional and must be requested only when needed.
7. A denied permission must never trap the user. Manual address entry, text notes, file upload, and external navigation must remain available.
8. AI may summarize, transcribe, classify, organize, and propose follow-up items. It may not silently change underwriting assumptions, Property facts, strategy scores, Deal stage, risk status, or recommendations.
9. Map, routing, and geocoding results must retain provider, timestamp, confidence, and freshness where relevant.
10. VisitIQ must not claim that a route, travel time, road condition, access point, boundary, or location is guaranteed accurate.
11. Every asynchronous upload, transcription, geocoding, route calculation, and media-processing job must expose durable status and retry behavior.
12. Web, iPhone, iPad, reports, Decision Cockpit, PhotoIQ, MarketIQ, tasks, and the Deal timeline must display the same canonical visit state.
13. No visible control may be disconnected or lead to an unimplemented state.
14. Prior valid data must remain visible when a current provider or processing job fails.
15. A visit is not complete until its media, notes, checklist, findings, follow-up tasks, and status have been saved and can be reopened.

---

## 2. Mission

VisitIQ is the BRIX fieldwork system for planning property visits, navigating efficiently, capturing observations, recording evidence, working offline, and converting field activity into structured Deal updates without losing context or silently changing authoritative data.

VisitIQ must help the investor answer:

1. Which properties should I visit and in what order?
2. How do I get there efficiently?
3. What should I inspect, photograph, measure, verify, and ask?
4. What did I observe at the property?
5. Which observations are confirmed facts, possible concerns, or follow-up items?
6. Which photos, videos, recordings, and notes support each observation?
7. What changed after the visit?
8. Which tasks, questions, contractor follow-ups, underwriting proposals, or Deal decisions should result?

---

## 3. Scope

VisitIQ includes:

- Single-property visit planning
- Multi-property route planning
- Route optimization with user override
- Current-location directions
- Apple Maps handoff on iOS
- Supported external map-provider handoff on web
- Visit scheduling
- Arrival and departure tracking where permission is granted
- Property access and contact details
- Custom and property-type-specific checklists
- Photo and video capture
- Voice recording and transcription
- Text notes
- Measurements and structured observations
- Offline drafts and upload queues
- Visit summaries
- Follow-up tasks and questions
- Contractor, broker, seller, tenant, manager, inspector, and other contact notes
- Visit history
- Visit comparison across repeat visits
- Field safety prompts and access cautions
- Decision Cockpit, PhotoIQ, MarketIQ, underwriting, reports, and timeline integration

VisitIQ does not:

- Guarantee route accuracy, travel time, road access, parking, legal access, boundary location, or property safety
- Replace a survey, inspection, appraisal, engineering report, environmental report, or contractor estimate
- Infer permission to enter private property
- Automatically convert an observation into a confirmed defect or authoritative cost
- Silently change canonical assumptions or financial outputs

---

## 4. Canonical Domain Model

### 4.1 `visits`

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `property_id`
- `route_plan_id`
- `visit_type`
- `status`
- `scheduled_start_at`
- `scheduled_end_at`
- `actual_start_at`
- `actual_end_at`
- `timezone`
- `access_instructions`
- `parking_notes`
- `contact_id`
- `assigned_to_user_id`
- `created_by`
- `created_at`
- `updated_at`
- `completed_at`
- `cancelled_at`
- `version`

Supported visit types:

- Drive-by
- Exterior review
- Initial showing
- Second showing
- Contractor walkthrough
- Inspection attendance
- Appraisal attendance
- Final walkthrough
- Due-diligence visit
- Construction progress
- Operating-property review
- Tenant or unit review
- Land/site visit
- Development review
- Other

Supported statuses:

- Draft
- Scheduled
- Ready
- En Route
- Arrived
- In Progress
- Paused
- Completed
- Completed with Follow-up
- Cancelled
- Missed
- Offline Pending Sync
- Conflict

### 4.2 `route_plans`

Required fields:

- `id`
- `workspace_id`
- `name`
- `route_date`
- `timezone`
- `start_location`
- `end_location`
- `travel_mode`
- `optimization_mode`
- `provider`
- `provider_route_id`
- `calculated_at`
- `freshness_state`
- `estimated_distance`
- `estimated_duration`
- `status`
- `created_by`
- `created_at`
- `updated_at`

Supported optimization modes:

- Manual order
- Shortest estimated time
- Shortest estimated distance
- Priority first
- Appointment constrained
- User-defined weighted order

### 4.3 `route_stops`

Required fields:

- `id`
- `route_plan_id`
- `visit_id`
- `deal_id`
- `property_id`
- `sequence_number`
- `address_snapshot`
- `latitude`
- `longitude`
- `scheduled_arrival_at`
- `scheduled_departure_at`
- `estimated_arrival_at`
- `estimated_departure_at`
- `travel_duration_from_previous`
- `distance_from_previous`
- `locked_sequence`
- `status`
- `notes`

### 4.4 `visit_checklists`

A checklist is versioned and may be based on property type, strategy, visit type, user template, or professional recommendation.

Required fields:

- `id`
- `visit_id`
- `template_id`
- `template_version`
- `title`
- `status`
- `created_at`
- `completed_at`

### 4.5 `visit_checklist_items`

Required fields:

- `id`
- `visit_checklist_id`
- `section`
- `prompt`
- `response_type`
- `response_value`
- `status`
- `required`
- `severity_if_failed`
- `evidence_ids`
- `notes`
- `completed_by`
- `completed_at`

Supported response types:

- Pass/fail
- Yes/no/unknown
- Text
- Number
- Measurement
- Currency estimate
- Rating
- Single choice
- Multiple choice
- Photo required
- Voice note required
- Professional verification required

### 4.6 `visit_observations`

Required fields:

- `id`
- `workspace_id`
- `visit_id`
- `deal_id`
- `property_id`
- `category`
- `title`
- `description`
- `classification`
- `severity`
- `confidence`
- `location_context`
- `source_evidence_ids`
- `verification_state`
- `proposed_assumption_change_id`
- `created_by`
- `created_at`
- `updated_at`

Observation classifications:

- User-confirmed observation
- Visible condition
- Possible concern
- Positive feature
- Access issue
- Measurement
- Seller/broker statement
- Tenant/manager statement
- AI-organized observation
- Professional verification required
- Unknown

### 4.7 `voice_notes`

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `property_id`
- `visit_id`
- `evidence_id`
- `audio_storage_path`
- `duration_seconds`
- `recorded_at`
- `recorded_by`
- `transcription_status`
- `transcript_text`
- `transcript_language`
- `transcript_confidence`
- `speaker_labels`
- `processing_provider`
- `processing_version`
- `summary`
- `verification_state`
- `created_at`
- `updated_at`

### 4.8 `visit_measurements`

Required fields:

- `id`
- `visit_id`
- `observation_id`
- `measurement_type`
- `value`
- `unit`
- `method`
- `confidence`
- `notes`
- `evidence_ids`
- `captured_at`
- `captured_by`

Measurements are user observations unless supported by a professional source. They must not be represented as survey-grade or inspection-grade measurements.

---

## 5. Route Planning Workflow

### 5.1 Create route

1. User selects Deals, Properties, saved visits, or pipeline records.
2. BRIX validates canonical addresses and geocoding state.
3. Unresolved or low-confidence locations are flagged before optimization.
4. User selects date, start location, end location, travel mode, appointment constraints, and optimization mode.
5. System calculates a route through an approved provider.
6. User reviews the route, travel estimates, freshness, and unresolved stops.
7. User may reorder stops manually and lock individual stops.
8. System recalculates only unlocked segments.
9. User saves the canonical route plan.
10. Route plan appears in dashboard, calendar/tasks where integrated, mobile app, and Deal timelines.

### 5.2 Route constraints

Support:

- Appointment windows
- Required visit duration
- User priority
- Locked order
- Start and end locations
- Maximum route duration
- Maximum driving distance
- Breaks
- Time-zone differences
- Inaccessible or unresolved stops

### 5.3 Navigation handoff

On iPhone and iPad:

- Prefer Apple Maps handoff unless product settings permit another provider.
- Pass the correct destination coordinates/address.
- Preserve return context through deep link or app state.
- Do not mark arrival or completion merely because navigation was opened.

On web:

- Open a supported mapping provider in a new context without losing BRIX state.
- Preserve route and stop order in BRIX.

### 5.4 Provider failure

When routing fails:

- Preserve selected stops and user-entered constraints.
- Show the failure type.
- Allow retry.
- Allow manual stop order.
- Allow individual destination handoff.
- Retain the last valid route marked with its calculation time and stale state.

---

## 6. Visit Preparation Workflow

Before a visit, BRIX must provide:

- Active Deal and Property identity
- Address and map
- Visit purpose
- Appointment time
- Access instructions
- Contact name and phone
- Parking notes
- Known hazards or access cautions
- Existing Property facts
- Current recommendation and strategy
- Decision-changing unknowns
- Required photos
- Required measurements
- Required questions
- Relevant governance restrictions
- Relevant ContractIQ deadlines or access rights
- Financing or appraisal dependencies
- Prior visit history
- Custom checklist

The preparation screen must distinguish:

- Confirmed information
- User-entered information
- External estimates
- Open questions
- Professional verification requirements

---

## 7. Field Visit Workflow

### 7.1 Start visit

A user may start from:

- Route stop
- Deal workspace
- Dashboard
- Scheduled visit
- Notification deep link
- iOS quick action

Starting a visit must:

- Confirm the active Deal and Property.
- Create or open the canonical Visit.
- Record actual start time only after explicit user action or permitted arrival confirmation.
- Load offline-ready checklist and prior context.
- Show sync status.

### 7.2 During visit

The field interface must support:

- One-tap photo capture
- Video capture where enabled
- Voice note recording
- Text note
- Checklist completion
- Measurement entry
- Marking an observation
- Flagging professional verification
- Adding a contact interaction
- Creating a follow-up task
- Recording access or parking issues
- Marking rooms, buildings, units, parcels, exterior areas, or systems
- Reviewing unsynced items

### 7.3 Complete visit

Completion requires:

1. User reviews incomplete required checklist items.
2. User reviews unsynced media and failed uploads.
3. User confirms visit end.
4. System creates a visit summary draft.
5. User may edit the summary.
6. System proposes observations, follow-up tasks, questions, and assumption changes.
7. User accepts, edits, rejects, or defers each proposal.
8. Accepted records persist to the owning subsystem.
9. Targeted recalculation or re-ranking occurs only after accepted material changes.
10. Decision Cockpit, timeline, reports, and notifications refresh from canonical records.

A visit may be marked `Completed with Follow-up` when required evidence, upload, professional verification, or accepted tasks remain open.

---

## 8. Offline and Synchronization Requirements

VisitIQ must support offline-first field capture for:

- Visit status
- Checklist responses
- Text notes
- Voice recordings
- Photos
- Videos where supported
- Measurements
- Observations
- Tasks drafted during the visit

Required behavior:

- Assign durable local IDs before upload.
- Store encrypted local drafts and media references.
- Display local-only, queued, uploading, processing, synced, failed, and conflicted states.
- Resume uploads after app relaunch.
- Use idempotency keys to prevent duplicates.
- Preserve original capture timestamps.
- Prevent an older retry from overwriting a newer canonical record.
- Detect version conflicts.
- Allow safe field-level or record-level conflict resolution.
- Never delete local media until canonical persistence is confirmed and retention policy permits cleanup.
- Allow the user to retry one item or all failed items.

Critical offline rule:

A user must be able to complete a visit without connectivity and later synchronize without losing the relationship among the Visit, checklist, observations, photos, voice notes, measurements, and tasks.

---

## 9. Voice Notes and Transcription

### 9.1 Recording

- Request microphone permission at first use, not at onboarding.
- Show recording state, elapsed time, pause/resume, and stop.
- Persist audio locally during capture.
- Recover finalized recordings after app interruption.
- Do not claim a recording exists until durable local persistence succeeds.

### 9.2 Transcription

- Original audio remains immutable Evidence.
- Transcription runs server-side or through an approved secure workflow.
- Store provider, model/version, language, confidence, and processing time.
- Low-confidence sections must be identifiable.
- User may edit the transcript without modifying the original audio.
- Preserve original machine transcript and edited user transcript separately.

### 9.3 AI organization

AI may propose:

- Summary
- Observation categories
- Positive features
- Possible concerns
- Questions
- Follow-up tasks
- Contractor items
- Suggested photo links
- Proposed assumption changes

AI may not:

- Confirm a defect
- Determine causation
- Set authoritative repair cost
- Modify underwriting directly
- Change Deal stage or recommendation directly
- Delete or hide original language

---

## 10. Checklists

Checklist templates must support:

- Residential
- Multifamily
- Commercial
- Land
- Development
- Exterior drive-by
- Initial showing
- Contractor walkthrough
- Inspection attendance
- Final walkthrough
- Operating-property review
- User-created templates

Template rules:

- Templates are versioned.
- Existing Visits retain the version used at creation.
- Required items are clear.
- Checklist completion does not imply professional inspection.
- Items may require evidence or follow-up.
- Property type, intended strategy, prior findings, governance, ContractIQ, MarketIQ, and underwriting unknowns may add targeted checklist items.
- Duplicate prompts must be consolidated before display.

---

## 11. Connected Change Workflow

VisitIQ may propose changes to:

- Property facts
- Underwriting assumptions
- Renovation scope
- Repair allowance
- Market verification needs
- Governance verification needs
- Financing conditions
- Offer terms
- Contract questions
- Inspection scope
- Appraisal questions
- Tasks and deadlines
- Deal recommendation confidence

Workflow:

1. Capture observation and Evidence.
2. Classify source, confidence, and verification need.
3. Create a proposed connected change.
4. Show affected subsystem and expected impact.
5. Authorized user accepts, edits, rejects, or defers.
6. Owning subsystem persists the accepted change.
7. Emit a domain event after successful persistence.
8. Trigger targeted recalculation or re-ranking when material.
9. Update Decision Cockpit freshness and recommendation history.
10. Preserve the original observation and decision record.

VisitIQ must never write directly into authoritative underwriting results, strategy ranking results, or professional findings.

---

## 12. UI and UX Requirements

### 12.1 Web

Provide:

- Visit list and calendar view
- Route planner
- Map with route stops
- Stop order editor
- Visit preparation page
- Visit history
- Media and voice-note review
- Side-by-side prior/current visit comparison
- Observation and follow-up review
- Processing and sync status

### 12.2 iPhone

The iPhone experience is the primary field interface.

Required:

- One-handed controls
- Large tap targets
- Clear active Deal/Property identity
- Quick camera
- Quick voice note
- Quick checklist response
- Quick text note
- Quick task
- Persistent offline/sync indicator
- Minimal navigation depth during an active Visit
- Safe-area support
- Background upload state
- Deep-link return from Maps
- No stretched desktop tables

### 12.3 iPad

Required:

- Split-view route/list/map layouts
- Visit checklist beside property context
- Media review beside observations
- Keyboard shortcuts
- Pointer support
- Drag and drop for documents/media where appropriate
- Multi-window or multitasking-safe state
- No stretched iPhone layout

### 12.4 Premium interaction requirements

- Immediate feedback for capture and save.
- No generic endless spinners.
- Preserve layout during loading.
- Show exact sync state.
- Use progressive disclosure for advanced route and checklist options.
- Keep the primary field action reachable.
- Use tabular numerals for times, distances, and measurements.
- Do not rely on color alone.
- Respect Reduce Motion and Dynamic Type.

---

## 13. State Model

VisitIQ must visibly distinguish:

- Draft
- Scheduled
- Ready
- En Route
- Arrived
- In Progress
- Paused
- Completed
- Completed with Follow-up
- Cancelled
- Missed
- Locally Saved
- Queued
- Uploading
- Processing
- Synced
- Partially Synced
- Failed
- Retry Scheduled
- Offline
- Conflict
- Stale Route
- Permission Limited
- Professional Verification Required

No materially different state may be collapsed into a generic `loading` or `done` state.

---

## 14. Permissions and Privacy

VisitIQ may request:

- Location
- Precise location where justified
- Camera
- Photos
- Microphone
- Speech recognition where device-side transcription is used
- Notifications

Requirements:

- Request only at point of use.
- Explain purpose accurately.
- Support limited photo access.
- Support approximate location where sufficient.
- Provide manual alternatives.
- Do not continuously track location unless a separately approved feature explicitly requires it and the user clearly consents.
- Do not infer occupancy, identity, protected characteristics, or private behavior from field media.
- Do not expose sensitive property access instructions in notifications.

---

## 15. Security

- All records are workspace-scoped.
- RLS applies to Visits, Route Plans, Stops, Checklists, Observations, Voice Notes, Measurements, Evidence, and tasks.
- Storage objects require authorized access.
- Signed URLs are short-lived.
- Provider keys remain server-side where required.
- Sensitive location and access data must not appear in unsafe logs.
- Media uploads use file validation, size limits, and malware/content safety controls where appropriate.
- Expensive transcription and routing operations are rate-limited and metered.
- Admin access is audited.
- Share/export behavior requires explicit scope.

---

## 16. Domain Events

VisitIQ emits:

- `route_plan.created`
- `route_plan.updated`
- `route_plan.calculated`
- `route_plan.failed`
- `visit.scheduled`
- `visit.started`
- `visit.arrived`
- `visit.paused`
- `visit.completed`
- `visit.cancelled`
- `visit.sync_failed`
- `visit.observation_created`
- `visit.measurement_created`
- `visit.follow_up_created`
- `voice_note.recorded`
- `voice_note.transcription_requested`
- `voice_note.transcription_completed`
- `voice_note.transcription_failed`
- `visit.connected_change_proposed`
- `visit.connected_change_accepted`

Consumers may include:

- Deal timeline
- Decision Cockpit
- PhotoIQ
- Underwriting
- Strategy Intelligence
- MarketIQ
- FinanceIQ
- GovernanceIQ
- ContractIQ
- OfferIQ
- InspectionIQ
- AppraisalIQ
- Tasks and notifications
- Reports

Events must be emitted only after canonical persistence and consumed idempotently.

---

## 17. Performance Requirements

- Active Visit interface should load locally available context immediately.
- User capture acknowledgment should occur immediately after durable local save.
- Route calculation must expose progress and timeout behavior.
- Large media uploads must not block note/checklist work.
- Collections must paginate or virtualize.
- Map rendering must not block the rest of the screen.
- Background work must have bounded retries and dead-letter/escalation handling.
- Cached route and map data must expose calculation/freshness time.
- Battery-intensive location behavior must be minimized.

---

## 18. Accessibility

- WCAG 2.2 AA for web.
- VoiceOver labels and logical order on iOS.
- Dynamic Type support.
- Reduce Motion support.
- Sufficient contrast.
- Large touch targets.
- Accessible map alternatives through ordered stop lists and text directions.
- Recording controls must be screen-reader usable.
- Checklist errors and required items must be announced.
- Audio content must have transcript support when processing succeeds.

---

## 19. Testing Requirements

### 19.1 Unit tests

- Visit state transitions
- Route stop ordering and locking
- Checklist rules
- Time-zone handling
- Measurement/unit validation
- Permission-state mapping
- Sync queue state machine
- Idempotency keys
- Conflict detection

### 19.2 Integration tests

- Visit creation to Deal timeline
- Route Plan to route stops
- PhotoIQ attachment
- Voice note upload and transcription
- Observation to proposed connected change
- Accepted change to owning subsystem
- Task and notification creation
- RLS and Storage authorization

### 19.3 End-to-end tests

1. User creates a multi-property route.
2. User reorders and locks stops.
3. User opens navigation.
4. User starts a Visit.
5. User loses connectivity.
6. User records voice, photos, checklist, measurements, and notes.
7. User completes the Visit offline.
8. App relaunches.
9. Sync resumes.
10. Failed upload is retried.
11. Transcript is created.
12. User accepts one follow-up and rejects one proposed assumption change.
13. Decision Cockpit and timeline update correctly.
14. Reports show the canonical Visit summary.

### 19.4 Device testing

- Supported iPhone sizes
- Supported iPad sizes
- Rotation where supported
- Background/foreground transitions
- Low-storage behavior
- Weak network
- Airplane mode
- Permission denied/limited/revoked
- Interrupted upload
- App termination during recording/upload
- Deep-link return from Apple Maps

---

## 20. Verification and Validation

### 20.1 Functional verification

- Routes can be created, reordered, saved, reopened, recalculated, and manually continued after provider failure.
- Visits can be scheduled, started, paused, completed, reopened, and reviewed.
- Photos, voice notes, text notes, measurements, checklists, and observations remain attached to the correct Deal and Visit.
- Offline capture survives relaunch and later syncs.
- Failed items can be retried without duplication.
- Visit completion produces a reviewable summary and follow-up workflow.

### 20.2 Integration verification

- Route and Visit links open the correct Deal and Property.
- PhotoIQ consumes the same Evidence and media records.
- MarketIQ receives only accepted location-related observations.
- Underwriting and Strategy Intelligence receive only accepted canonical changes.
- OfferIQ, ContractIQ, GovernanceIQ, InspectionIQ, and AppraisalIQ receive relevant tasks/questions without duplicate systems.
- Decision Cockpit freshness updates after material accepted changes.
- Reports and timeline reconcile to the canonical Visit.
- Domain events fire once and consumers are idempotent.

### 20.3 Data verification

- All records are workspace-scoped.
- RLS prevents cross-workspace access.
- Original audio and media remain immutable Evidence.
- Original machine transcript remains preserved after user edits.
- Local IDs reconcile to canonical IDs.
- No orphaned media, stops, observations, tasks, or checklist responses remain.
- Conflicts preserve both versions until resolved.

### 20.4 UX verification

- Active Deal, Property, Visit status, sync state, and next action are always clear.
- iPhone field controls are reachable and usable one-handed.
- iPad uses a genuine multi-column layout.
- Web route planning is complete and not a static map.
- Empty, loading, offline, stale-route, conflict, permission, failure, and retry states are intentionally designed.
- No workflow ends in a dead end.
- Accessibility tests pass.

### 20.5 Failure and recovery verification

Test:

- Routing provider outage
- Geocoding failure
- Microphone denial
- Camera denial
- Location denial
- Upload timeout
- Transcription failure
- Authentication refresh
- App termination
- Duplicate retry
- Version conflict
- Low storage
- Partial sync

For every failure, verify:

- User work is preserved.
- Prior valid output remains visible.
- Failure is clearly explained.
- Recovery action is available.
- No duplicate or silent overwrite occurs.

### 20.6 Production readiness gate

VisitIQ is not complete when any of the following are true:

- A visible field control is disconnected.
- Offline capture can be lost.
- Route failure blocks manual continuation.
- A Visit can attach media to the wrong Deal.
- A background job can fail silently.
- A retry can duplicate media or records.
- A transcript can overwrite original audio or original machine output.
- AI can silently change an authoritative subsystem.
- Web, iPhone, iPad, reports, and timeline disagree.
- Permission denial traps the user.
- A generic spinner can remain indefinitely.
- Required device and accessibility tests have not passed.

## 21. Definition of Done

This specification is complete only when a senior engineer or Codex can implement VisitIQ without inventing product behavior, data ownership, sync semantics, permission behavior, cross-module connections, failure handling, or test expectations.

The implementation is complete only when a real investor can plan multiple visits, navigate to properties, conduct a visit with weak or no connectivity, capture photos and voice notes, complete a checklist, save measurements and observations, recover from interruption, synchronize safely, review proposed Deal changes, create follow-ups, and reopen the complete visit record across web, iPhone, and iPad without developer assistance.

**SPECIFICATION STATUS: COMPLETE AND READY FOR IMPLEMENTATION**