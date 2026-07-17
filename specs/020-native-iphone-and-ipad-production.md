# BRIX Specification 020 — Native iPhone and iPad Production

## 1. Authority and Rules of Engagement

This specification is governed by:

- `docs/00-START-HERE.md`
- `docs/01-PRODUCT-CONSTITUTION.md`
- `docs/02-ENGINEERING-STANDARDS.md`
- `docs/03-DATA-ARCHITECTURE.md`
- `docs/04-UI-UX-SYSTEM.md`
- `docs/05-BUILD-ROADMAP.md`
- Specifications 001–019

Rules of engagement:

1. The iPhone and iPad applications are production clients of BRIX, not separate products, secondary data stores, or simplified mock experiences.
2. Native clients must consume the same canonical Workspace, Property, Deal, Evidence, underwriting, strategy, financing, contract, offer, task, timeline, report, AI, audit, and permission records used by the web application.
3. Native clients may maintain encrypted local caches and outbound mutation queues, but may not create an independent source of truth.
4. Every supported native workflow must save, reopen, recover, synchronize, and reconcile with web.
5. Camera, photo library, microphone, speech, files, maps, location, notifications, background transfer, share extension, deep links, and Keychain access must use least-privilege permissions and clear user-facing explanations.
6. No permission denial, connectivity failure, background suspension, expired session, upload failure, or application termination may silently discard user work.
7. Offline work must expose local, queued, syncing, current, stale, conflicted, failed, and retry states.
8. Native clients must not calculate authoritative underwriting, financing, maximum-offer, strategy ranking, or valuation results independently.
9. Native UI must feel purpose-built for iPhone and iPad while preserving BRIX terminology, state meaning, confidence, source, and decision logic.
10. iPhone and iPad must support Dynamic Type, VoiceOver, reduced motion, sufficient contrast, keyboard navigation where applicable, and minimum touch-target requirements.
11. TestFlight or App Store distribution is not evidence of completion. Production readiness requires verified workflows, privacy compliance, crash observability, release controls, and rollback capability.
12. This specification ends only when native clients work seamlessly with every connected BRIX subsystem and all validation gates pass.

## 2. Mission

Deliver reliable, secure, field-ready native BRIX applications for iPhone and iPad that let an investor evaluate, visit, document, manage, and act on Deals without losing context or data when connectivity is weak, interrupted, or absent.

The native experience must excel at:

- Fast Deal access
- Field capture
- Photos and video
- Voice notes and transcription
- Document scanning and file intake
- Maps and visit routing
- Tasks and deadlines
- Offer and contract review
- Decision Cockpit access
- Offline continuity
- Background synchronization
- Device-native privacy and security

## 3. Product Boundary and Canonical Ownership

### Native clients own

- Native presentation and navigation
- Local encrypted cache
- Pending-mutation queue
- Background upload/download coordination
- Device permission state
- Camera, microphone, file, map, location, and notification integration
- Local draft preservation
- Native deep-link handling
- Keychain-backed session material
- Device registration and push token lifecycle
- Native telemetry that excludes sensitive payloads

### Native clients do not own

- Canonical Deal or Property truth
- Workspace authorization
- Authoritative calculations
- Strategy ranking
- Contract legal interpretation
- Appraisal or inspection conclusions
- AI model authority
- Billing or entitlement truth
- Final report truth
- Cross-device conflict resolution policy

The owning server subsystem remains authoritative for each accepted mutation and computed result.

## 4. Supported Platforms and Deployment Targets

The production target must explicitly define and version:

- Minimum supported iOS version
- Minimum supported iPadOS version
- Supported iPhone screen classes
- Supported iPad screen classes
- Portrait and landscape support by screen
- Apple Silicon simulator support
- Physical-device test matrix
- TestFlight internal groups
- TestFlight external groups where used
- App Store production configuration
- Bundle identifiers
- Associated domains
- Universal links
- Push notification environment
- App groups
- Keychain access groups
- Share extension identifiers
- Background mode entitlements
- Privacy manifest
- Required reason APIs

No production entitlement may remain undocumented.

## 5. Native Architecture

### 5.1 Client layers

The native implementation must separate:

1. Presentation and navigation
2. View state
3. Domain-facing repositories
4. API and realtime transport
5. Local encrypted persistence
6. Pending mutation queue
7. File transfer manager
8. Authentication/session manager
9. Permission manager
10. Deep-link router
11. Notification router
12. Observability and diagnostics

UI code must not directly own persistence, networking, authorization, or authoritative business calculations.

### 5.2 Shared contracts

Native clients must use versioned contracts for:

- API requests and responses
- Domain events
- Sync envelopes
- Error envelopes
- Pagination
- Upload sessions
- Background-job state
- Confidence and verification states
- Staleness
- Conflict records
- Entitlements
- Feature flags

Breaking contract changes require compatibility handling and coordinated release planning.

## 6. Authentication and Session Lifecycle

Native authentication must support:

- Sign up where enabled
- Sign in
- Email verification
- Password reset
- Magic link or supported passwordless flow
- Universal-link callback
- Session refresh
- Session expiration
- Device revocation
- Workspace switching
- Invitation acceptance
- Sign out
- Account deletion entry point

Requirements:

- Session secrets are stored only in Keychain or an equivalent approved secure store.
- Sensitive session data must not be stored in plain preferences, logs, analytics, screenshots, or crash breadcrumbs.
- Expired sessions preserve unsynced local drafts and queued mutations.
- Reauthentication resumes the interrupted workflow when authorization still permits it.
- Revoked workspace access immediately blocks protected cached content and pending writes for that workspace.
- Account deletion follows Specification 001 and does not bypass server-side safeguards.

## 7. Navigation and Deal Context

### 7.1 iPhone navigation

The iPhone experience must prioritize one-handed field use and clear Deal context.

Required destinations include:

- Home / Dashboard
- Deals
- Search
- Capture / Quick Add
- Tasks and deadlines
- Notifications
- Settings
- Active Deal workspace

The active Deal must remain visible in context-sensitive flows. Returning from PhotoIQ, VisitIQ, ContractIQ, OfferIQ, or a report must not lose the Deal.

### 7.2 iPad navigation

The iPad experience must support:

- Sidebar navigation
- Multi-column layouts
- Deal list plus Deal detail
- Document plus analysis side by side
- Map plus route/visit context
- Comparison tables
- Keyboard shortcuts
- Pointer interactions
- Drag and drop
- Multiwindow where supported and explicitly tested

### 7.3 Deep links

Deep links must resolve to authorized canonical destinations, including:

- Deal
- Property
- Task
- Deadline
- Notification
- Contract finding
- Offer/counter
- Photo or evidence item
- Visit
- Report
- Background-job result

Unauthorized or deleted destinations must show a safe, explanatory state rather than a blank screen or crash.

## 8. Offline-First Behavior

### 8.1 Offline-readable content

Subject to workspace policy and device security, users must be able to access recently synchronized:

- Deal summaries
- Decision Cockpit snapshot
- Property facts
- Tasks and deadlines
- Visit plans
- Maps/route metadata already cached
- Photos and thumbnails
- Notes and voice transcripts
- Offer summaries
- Contract summaries
- Inspection/appraisal summaries
- Selected reports

The UI must show when data was last synchronized and whether it may be stale.

### 8.2 Offline-write workflows

The following must support offline draft or queue behavior where operationally appropriate:

- Notes
- Voice notes
- Photos and video metadata
- Visit checklist responses
- Tasks
- Field observations
- Manual property corrections
- Evidence classification
- Offer notes
- Verification items

Authoritative server calculations and AI processing may remain unavailable offline, but the user must be able to preserve inputs for later processing.

### 8.3 Mutation queue

Every queued mutation must include:

- Stable client mutation ID
- Workspace ID
- Deal/Property context
- Mutation type
- Payload version
- Created time
- Local dependency references
- Retry count
- Last error
- Idempotency key
- User-visible status

The queue must preserve ordering where dependencies require it and permit safe independent retries where they do not.

## 9. Synchronization and Conflict Resolution

Synchronization must support:

- Incremental pulls
- Idempotent pushes
- Resume after interruption
- Server acknowledgements
- Local-to-server ID reconciliation
- Deleted/archived record handling
- Permission changes
- Schema/version compatibility
- Partial batch success
- Background continuation where allowed

Conflict policy:

1. Never silently overwrite divergent user edits.
2. Server authority does not erase a valid local draft without preserving it.
3. Conflicts must identify both versions, timestamps, actors, and material differences.
4. Non-material mergeable fields may use deterministic merge rules.
5. Material Deal facts, financial assumptions, deadlines, offers, contract terms, and accepted findings require explicit resolution.
6. Resolved conflicts create audit history and downstream events.

## 10. Camera, Photos, Video, and Scanning

Native capture must support:

- Camera photo
- Multi-photo session
- Video where enabled
- Photo library import
- Document scan
- Receipt and invoice capture where applicable
- Metadata entry
- Room/area classification
- Deal/Property assignment
- Caption and observation
- Retake and delete-before-upload
- Background upload
- Retry

Requirements:

- Original media remains immutable Evidence after successful ingestion.
- Local originals remain protected until server confirmation or explicit user deletion.
- Upload progress is visible.
- Large media uses resumable transfer.
- Image orientation, timestamps, and permitted metadata are preserved correctly.
- Location metadata is collected only with permission and clear purpose.
- The user can correct classification and AI observations.
- PhotoIQ processing status and results reconcile with Specification 013.

## 11. Voice Notes and Transcription

Voice capture must support:

- Start, pause, resume, stop, cancel
- Visible recording state
- Duration and input level
- Background/interruption handling
- Local encrypted draft
- Upload progress
- Transcription status
- Editable transcript
- Source audio playback
- Deal/Visit/Property association
- Suggested tasks, findings, or assumptions through explicit proposals

Telephone calls, Siri interruptions, route changes, Bluetooth changes, and application backgrounding must be tested. No interrupted recording may be represented as complete without validation.

## 12. Maps, Location, and Visit Operations

Native maps must support:

- Property map
- Current-location opt-in
- Multi-property route
- External navigation handoff
- Arrival context
- Visit checklist
- Nearby Deal search where enabled
- Cached visit information
- Location permission denial
- Approximate location
- No GPS signal

Location collection must be purpose-limited. BRIX must not continuously track a user unless a documented feature explicitly requires it, the user consents, and privacy requirements are met.

VisitIQ integration must preserve:

- Visit ID
- Stop order
- Arrival/departure state when used
- Field notes
- Captured evidence
- Checklist completion
- Follow-up tasks
- Visit summary

## 13. Files, Email, and Share Extension

The native share extension must accept supported:

- URLs
- PDFs
- Images
- Documents
- Email-exported files where available
- Text

The extension must:

1. Authenticate safely through shared secure state.
2. Permit Deal assignment or Inbox routing.
3. Preserve the original item.
4. Queue work if offline.
5. Show completion or queued status.
6. Avoid long-running processing inside the extension.
7. Hand off heavy work to the main app/server.
8. Prevent duplicate ingestion through hash/source checks.

Files app integration and document picker flows must handle security-scoped access correctly.

## 14. Push Notifications and Native Actions

Push notifications must follow Specification 022 when created and must support:

- Device token registration and refresh
- Workspace/user scope
- Environment separation
- Idempotent delivery handling
- Deep links
- Foreground presentation
- Background receipt where permitted
- User notification preferences
- Quiet hours
- Time zones
- Revoked permission state

Sensitive details must not appear on a lock screen unless allowed by product policy and user preference.

Supported actions may include:

- Open Deal
- View task
- Mark non-critical task complete where safe
- Snooze reminder
- Retry failed upload

No notification action may bypass authorization or canonical validation.

## 15. Background Work

Approved background work includes:

- Resumable uploads
- Limited sync refresh
- Processing-state refresh
- Push-triggered content refresh where permitted
- Cleanup of confirmed local temporary files

Background behavior must account for:

- OS suspension
- Battery constraints
- Low Power Mode
- Cellular restrictions
- Background App Refresh disabled
- App termination
- Expired upload session
- Expired authentication

The UI must never promise continuous execution the operating system cannot guarantee.

## 16. Native UI and UX Standards

### 16.1 Premium experience

Native BRIX must feel calm, fast, trustworthy, and purpose-built. It must avoid web views masquerading as native screens except where an explicitly approved secure web flow is necessary.

Required qualities:

- Clear hierarchy
- Stable navigation
- Context-preserving transitions
- Responsive touch interactions
- Useful haptics used sparingly
- Native sheets, menus, pickers, and share behavior
- Skeletons for meaningful loading
- Clear saved/syncing/queued/conflicted states
- No endless generic spinner
- No hidden failure
- No dead control

### 16.2 State completeness

Every native screen must define:

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
- Unsupported version

## 17. Accessibility

Native applications must verify:

- Dynamic Type, including large accessibility sizes
- VoiceOver labels, order, values, hints, and actions
- Sufficient contrast
- Reduced Motion
- Differentiate Without Color
- Bold Text
- Button Shapes where relevant
- Touch targets
- Keyboard navigation on iPad
- Pointer support
- External keyboard shortcuts
- Captions/transcripts for audio content
- Accessible charts and financial tables

Critical actions must not rely only on gestures, color, position, or haptics.

## 18. Security and Privacy

Requirements include:

- Keychain-backed credentials
- Encrypted local database/files
- Data Protection classes appropriate to sensitivity
- TLS for all network traffic
- Certificate/security policy documented
- No secrets embedded in the app bundle
- Server-side privileged operations
- RLS enforcement
- Workspace isolation
- Secure logging
- Screenshot/privacy review for sensitive screens
- Clipboard minimization
- Pasteboard privacy compliance
- Jailbreak/root assumptions documented without relying on detection as the primary control
- Local data removal on sign-out/access revocation according to policy
- Privacy manifest and required reason API compliance
- Clear permission purpose strings

## 19. Performance and Reliability Targets

Targets must be defined and measured for:

- Cold launch
- Warm launch
- Dashboard usable time
- Deal open time from cache
- Search response
- Camera-ready time
- Local save acknowledgement
- Queue insertion
- Upload initiation
- Scroll performance
- Memory under large Deal/document/media loads
- Battery impact
- Crash-free sessions
- Hang rate

Large collections must use pagination, incremental loading, thumbnails, and memory-safe media handling.

## 20. Observability and Diagnostics

Native observability must capture, without leaking sensitive payloads:

- App version/build
- Device/OS class
- Crash and hang diagnostics
- Network failure class
- Sync failure class
- Upload failure class
- Deep-link failure
- Authentication/session failure
- Permission state
- Background-task outcome
- Feature flag state
- Correlation IDs

Users must have a safe support diagnostics path that never exposes tokens, document text, private photos, or sensitive financial data by default.

## 21. Release Engineering

The release process must define:

- Development, staging, and production environments
- Build-number policy
- Version policy
- Signing certificates
- Provisioning profiles
- CI build
- Unit/UI test execution
- Static analysis
- Dependency vulnerability review
- TestFlight promotion
- Phased release
- Manual release hold
- Feature flags
- Kill switches
- Minimum supported app version
- Forced-upgrade policy only when necessary
- Rollback/forward-fix plan
- App Store metadata
- Privacy nutrition labels
- Review notes
- Demo account policy

Production and staging data, keys, push environments, associated domains, and analytics must never be mixed.

## 22. Cross-Module Integration Requirements

Native clients must verify seamless connection with:

- Authentication and Workspaces
- Dashboard and shell
- Deals and PDRM
- Property intake
- Underwriting
- Strategy Intelligence
- Decision Cockpit
- MarketIQ
- FinanceIQ
- GovernanceIQ
- ContractIQ
- OfferIQ
- PhotoIQ
- VisitIQ
- InspectionIQ/AppraisalIQ
- Evidence and files
- ReportIQ
- RELearnIQ
- Admin/entitlements
- AI orchestration
- Tasks, deadlines, and notifications

No native screen may create duplicate module state or display a different authoritative value than web/report output for the same version.

## 23. Testing Requirements

### 23.1 Unit tests

- View-model/state reducers
- Deep-link routing
- Permission logic
- Queue ordering/idempotency
- Sync merge rules
- Local encryption wrappers
- Upload retry/resume
- Session refresh
- Feature flags

### 23.2 Integration tests

- Authentication callback
- Workspace revocation
- Deal save/reopen
- Offline mutation then reconnect
- Upload then PhotoIQ processing
- Voice capture then transcript
- Share extension ingestion
- Push notification deep link
- Conflict resolution
- Report opening/sharing

### 23.3 UI tests

- iPhone compact layouts
- iPad split/multi-column layouts
- Dynamic Type
- VoiceOver smoke paths
- Permission denied flows
- Offline/queued/conflict states
- App relaunch during workflow

### 23.4 Physical-device tests

Physical devices must test:

- Camera
- Microphone
- Background upload
- Cellular network
- Weak/intermittent connectivity
- Push notifications
- Universal links
- Location/maps
- Battery/thermal behavior
- Memory pressure

Simulators alone are insufficient.

## 24. Verification and Validation

### 24.1 Functional verification

- A user can authenticate, select a workspace, find/create/open a Deal, save changes, close the app, relaunch, and recover the same state.
- Camera, photo library, scanner, microphone, files, maps, share extension, notifications, and deep links complete their supported workflows.
- Offline drafts and queued mutations survive app termination and synchronize safely after reconnect.
- Background uploads resume or fail visibly with a working retry path.

### 24.2 Data verification

- Native and web show the same canonical records and versioned calculated outputs.
- No duplicate Property, Deal, Evidence, task, offer, contract, or result record is created by retries.
- Local IDs reconcile to server IDs.
- Conflicts preserve both versions until resolved.
- Workspace revocation prevents cached-data access according to policy.

### 24.3 Integration verification

- Captured evidence appears in PhotoIQ, VisitIQ, the Deal timeline, reports, and the Decision Cockpit where applicable.
- Accepted native proposals trigger the owning subsystem, audit event, recalculation, and downstream updates exactly once.
- Tasks, deadlines, offers, contracts, financing, inspections, appraisals, reports, and AI jobs deep-link to the correct Deal context.
- Web changes synchronize to native without stale values being presented as current.

### 24.4 UX and accessibility verification

- iPhone and iPad layouts are complete at all supported sizes and orientations.
- Loading, empty, partial, offline, stale, queued, syncing, failed, retry, conflict, permission, and revoked-access states are usable.
- Dynamic Type and VoiceOver critical paths pass.
- Keyboard and pointer interactions work on iPad.
- No dead navigation, clipped critical content, inaccessible control, or hidden background failure remains.

### 24.5 Security and privacy verification

- Tokens and secrets remain out of logs and app storage outside approved secure stores.
- Local data is encrypted and removed according to sign-out/revocation policy.
- RLS prevents cross-workspace access.
- Permission prompts and privacy disclosures match actual behavior.
- Privacy manifest, required reason APIs, App Store labels, and entitlements are accurate.

### 24.6 Release verification

- CI produces signed staging and production builds from controlled configuration.
- TestFlight installation, upgrade, deep links, push, migration, and rollback/forward-fix paths are tested.
- Crash, hang, performance, and background-transfer thresholds meet release targets.
- App Store submission materials contain no unsupported product, security, or privacy claim.

## 25. Definition of Done

Specification 020 is complete only when:

1. The iPhone and iPad clients implement the supported BRIX workflows as native, production-quality experiences.
2. Canonical data and calculations reconcile with web and reports.
3. Offline drafts, queues, synchronization, conflicts, retries, and recovery are verified on physical devices.
4. Camera, voice, files, maps, share extension, deep links, push, and background transfers work under real interruption conditions.
5. Security, privacy, accessibility, performance, observability, TestFlight, and App Store gates pass.
6. No duplicate source of truth, silent data loss, stale unlabeled result, disconnected module, mock success, or dead navigation remains.
7. Every connected specification has been integration-tested where native behavior applies.
8. Evidence of tests and manual verification is recorded.
9. Known material limitations are resolved or explicitly block release.
10. The implementation is marked `COMPLETE` only after all required validation passes.