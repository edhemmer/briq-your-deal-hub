# BRIX Real Estate — Premium UI and UX System

## 1. Authority and Rules of Engagement

This document defines the required BRIX user experience and visual system. It is governed by:

- `docs/00-START-HERE.md`
- `docs/01-PRODUCT-CONSTITUTION.md`
- `docs/02-ENGINEERING-STANDARDS.md`
- `docs/03-DATA-ARCHITECTURE.md`

Permanent UI/UX rules:

1. BRIX is decision-first. The active decision, current status, material numbers, risks, missing information, deadlines, and next action must be easier to find than secondary detail.
2. Premium design must improve comprehension, speed, confidence, and trust. Decoration may not hide state, delay work, or substitute for product substance.
3. Web, iPhone, and iPad share canonical data and vocabulary but use platform-appropriate layouts and interaction patterns.
4. Every visible control must work end to end or remain hidden behind an explicit feature flag.
5. Every screen must intentionally support applicable loading, empty, saved, processing, partial, stale, offline, conflict, permission-denied, retry, and failure states.
6. The active Workspace, Deal, Property, stage, freshness, and sync state must not become ambiguous.
7. The user must not lose meaningful progress after refresh, relaunch, session renewal, network interruption, or safe retry.
8. Color may support meaning but may never be the sole carrier of meaning.
9. Accessibility is required, not optional polish.
10. The UI may not imply that an estimate, AI observation, or unverified finding is a confirmed fact.

## 2. Product Experience Goals

BRIX must feel:

- Calm
- Premium
- Intelligent
- Fast
- Trustworthy
- Field-ready
- Professional
- Clear under pressure
- Dense when useful
- Understandable without being simplistic

The product should feel like a coherent real estate operating system, not a collection of cards, forms, and AI summaries.

## 3. Information Hierarchy

Every screen must make the following immediately recognizable:

1. Where the user is
2. Which Workspace and Deal are active
3. Current Deal stage or module status
4. The user’s current goal
5. The primary action
6. Material risks, blockers, or deadlines
7. Whether data is current, processing, stale, conflicted, incomplete, or offline
8. Where assumptions, evidence, formulas, and deeper detail can be inspected

Use typography, spacing, grouping, alignment, contrast, and restrained emphasis to create hierarchy.

## 4. Navigation Architecture

### 4.1 Global navigation

Required global destinations:

- Dashboard
- Deals/Pipeline
- Portfolio
- Tasks and Deadlines
- Reports
- RELearnIQ
- Notifications
- Global Search
- Workspace and Account Settings
- Admin entry for authorized platform admins

### 4.2 Deal navigation

Required Deal-level destinations, shown based on permissions and available capabilities:

- Decision Cockpit
- Property
- Underwriting
- Strategies
- MarketIQ
- FinanceIQ
- GovernanceIQ
- ContractIQ
- OfferIQ
- Visits
- Photos and Media
- InspectionIQ
- AppraisalIQ
- Tasks and Deadlines
- Contacts
- Evidence and Documents
- Activity and History
- Reports
- Education

Navigation must preserve Deal context and last meaningful location. No module may open as a disconnected standalone island.

### 4.3 Deep links

Notifications, search results, share-extension intake, report links, map pins, emails, and task links must open the correct Workspace, Deal, record, and workflow state.

Invalid, expired, unauthorized, or moved targets must show a clear recovery path.

## 5. Design Tokens

Define canonical tokens for:

- Font families and fallbacks
- Type scale
- Font weights
- Line height
- Letter spacing
- Spacing scale
- Radius scale
- Elevation
- Borders and dividers
- Surface hierarchy
- Text hierarchy
- Accent color
- Semantic success, warning, danger, information, stale, conflict, and offline states
- Chart palettes
- Focus ring
- Touch targets
- Motion duration and easing

Tokens must be reusable across web and mapped intentionally to native iOS equivalents.

## 6. Typography and Numbers

- Prioritize legibility over novelty.
- Financial numbers use tabular numerals.
- Currency, percentage, units, and time periods must remain visible.
- Summary rounding must not imply precision that does not exist.
- Dense tables may use compact typography but must remain readable.
- Long-form legal or document text must support comfortable reading and source navigation.

## 7. Color and Status Language

Semantic states must have consistent wording and visual treatment across modules.

Required distinctions include:

- Confirmed
- Estimated
- Assumed
- Inferred
- AI observation
- Professional opinion
- Unknown
- Conflict
- Current
- Stale
- Processing
- Offline
- Failed
- Verified
- Review recommended

Do not overload red/amber/green as a universal score system. Risk, confidence, freshness, and workflow status require distinct patterns.

## 8. Layout Standards

### 8.1 Web

- Responsive from mobile width through large desktop.
- Use a stable application shell.
- Decision-critical content must remain visible without excessive scrolling.
- Large screens may use supporting side panels, but primary content remains clear.
- Tables need sticky context, sorting, filtering, column control, and responsive alternatives.
- Avoid endless nested cards and excessive border boxes.

### 8.2 iPhone

- Native one-handed workflows.
- Large touch targets.
- Clear primary action.
- Fast access to current Deal, Quick Add, Photo, Voice Note, Maps, Tasks, and Decision Cockpit.
- Bottom sheets and progressive disclosure may reduce navigation depth.
- Respect safe areas, keyboard, orientation, and Dynamic Type.
- Critical field capture must remain usable with weak connectivity.

### 8.3 iPad

- Native split view or multi-column layouts.
- Deal list and workspace may coexist.
- Document review and Deal context should coexist where useful.
- Support keyboard shortcuts, pointer, drag and drop, multitasking, and landscape productivity.
- Do not stretch the iPhone layout.

## 9. Dashboard Experience

The dashboard must prioritize:

- Deals needing attention
- Upcoming deadlines
- Material recommendation changes
- Incomplete or failed processing
- Recent activity
- Visit schedule
- Portfolio summary
- Quick actions

Dashboard metrics must link to the records behind them. Counts and badges must come from canonical backend state, not client-local approximations.

## 10. Decision Cockpit Experience

Priority order:

1. Current recommendation
2. Deal stage
3. Strongest viable strategy
4. Selected strategy
5. Key financial outputs
6. Major risks and disqualifiers
7. Confidence and freshness
8. Missing decision-changing inputs
9. Deadlines
10. Next action
11. Recent changes
12. Supporting evidence and detail

The Cockpit must:

- Show what changed since the prior recommendation.
- Separate confirmed problems, potential concerns, missing evidence, and informational observations.
- Show calculation and evidence freshness independently.
- Support guided and professional density modes using the same data.
- Never show an outdated recommendation as current after dependencies change.

## 11. Forms and Data Entry

Every form must provide:

- Persistent labels
- Required versus optional state
- Units and currency
- Source/classification where material
- Inline validation
- Clear defaults labeled as defaults
- Retained input after recoverable errors
- Autosave where loss would be costly
- Explicit submit for irreversible, legal, financial, or externally transmitted actions
- Accurate save/queue/sync status
- Mobile-appropriate keyboards and controls
- Keyboard and accessibility support
- Conflict handling for concurrent edits

Long forms require sections, progress, autosave, and return-to-last-position behavior.

## 12. Tables and Comparisons

Tables must support, when relevant:

- Sorting
- Filtering
- Search
- Pagination or virtualization
- Column control
- Sticky identifiers
- Export
- Row actions
- Accessible summaries
- Mobile card or drill-down alternative

Financial comparisons must keep units, time periods, scenario labels, and source versions visible.

## 13. Charts and Visualizations

Charts must:

- Answer a decision question.
- Include accessible text or data access.
- Avoid misleading axes or aggregation.
- Show units, timeframe, source, and freshness.
- Use consistent risk and scenario vocabulary.
- Degrade gracefully when data is sparse.

Decorative charts that do not improve understanding should not be built.

## 14. Search, Filters, and Command Actions

Global search should support authorized lookup across:

- Deals
- Properties
- Contacts
- Organizations
- Tasks
- Documents/evidence metadata
- Reports

Search must explain scope and preserve active Workspace permissions.

Common command actions may include:

- Create Deal
- Add Evidence
- Add Task
- Add Contact
- Add Photo
- Add Voice Note
- Generate Report
- Get Directions
- Jump to Module
- Open Current Decision

Commands must be context-aware and permission-aware.

## 15. Empty States

Empty states must:

- Explain what belongs in the area.
- Explain why it matters.
- Offer the next meaningful action.
- Avoid fake example records in production.
- Distinguish first use from an empty filtered result.

## 16. Loading and Processing States

- Acknowledge actions immediately.
- Preserve screen structure where possible.
- Skeletons may be used only when they resemble expected content.
- Long-running operations expose durable job state and progress when meaningful.
- The user may navigate away while safe background work continues.
- Prior valid results remain visible and labeled during reprocessing.
- Endless generic spinners are prohibited.

## 17. Success and Completion States

Completion must identify:

- What completed
- What was saved or generated
- Whether additional processing remains
- Whether the result is verified or awaiting review
- What changed
- The next logical action

A local save, backend sync, analysis completion, and professional verification must not share one ambiguous “complete” state.

## 18. Error and Recovery Experience

Errors must:

- Use plain language.
- State what failed.
- State what was preserved.
- State whether the Deal decision is affected.
- Offer retry, correction, manual continuation, or support.
- Include a support correlation ID where useful.
- Avoid raw stack traces and provider messages.
- Distinguish validation, permission, conflict, outage, timeout, upload, sync, and internal errors.

A failure must never replace prior valid output with an empty state.

## 19. Offline and Synchronization Experience

Offline-capable workflows must show:

- Offline status
- Local-only drafts
- Queued uploads/mutations
- Last successful sync
- Sync progress
- Retry state
- Conflict state

Rules:

- User work survives app termination.
- Retried mutations are idempotent.
- Conflicting material edits require explicit resolution.
- The UI never claims server save before confirmation.
- Offline evidence remains attached to the correct Deal.

## 20. Freshness and Stale-State Experience

Decision-sensitive content must show `as of` time and dependency state.

Mark stale when:

- Accepted assumptions changed.
- New evidence affected the result.
- A provider dataset exceeded freshness limits.
- A calculation or ranking is awaiting reprocessing.
- A report no longer reflects the current Deal.

Stale results remain inspectable but cannot appear current.

## 21. Animation and Micro-Interactions

Animation may be used for:

- Orientation
- State transition
- Progress
- Confirmation
- Reveal of related detail

Animation must be short, purposeful, interruptible, and respect reduced motion. It may not delay work, hide information, or create a marketing-site feel inside the product.

## 22. Accessibility

Web must target WCAG 2.2 AA.

Required:

- Logical focus order
- Keyboard access
- Visible focus
- Accessible names and descriptions
- Proper headings and landmarks
- Error announcements
- Sufficient contrast
- Non-color status cues
- Accessible tables and charts
- Zoom and text resizing support

Native requirements:

- VoiceOver
- Dynamic Type
- Reduce Motion
- Sufficient contrast
- Accessible actions and custom controls
- Minimum touch targets
- Logical rotor/navigation behavior

## 23. Performance Experience

- Navigation and local interactions remain responsive during background work.
- Decision-critical content loads before secondary detail where safe.
- Large lists are paginated or virtualized.
- Images use thumbnails and progressive loading.
- Large documents and reports load asynchronously.
- Caching requires freshness metadata and explicit invalidation.
- Optimistic UI is permitted only when rollback is safe and truthful.

## 24. Guided and Professional Modes

Guided mode may provide:

- Explanations
- Examples
- Recommended order
- Definitions
- Warnings
- Progressive disclosure

Professional mode may provide:

- Higher density
- Advanced fields
- Batch actions
- Compact tables
- Scenario and version controls
- Faster keyboard workflows

Both modes use the same canonical records, calculations, and permissions.

## 25. Cross-Module Experience Contract

Every module must define:

- Navigation entry
- Header/status behavior
- Primary goal and action
- Canonical records read and written
- Dependencies
- Domain events
- Processing state
- Freshness behavior
- Failure fallback
- Timeline update
- Task/deadline creation
- Recommendation/calculation effect
- Report consumption
- Mobile behavior

A module is incomplete if its output remains trapped in its own screen.

## 26. Verification and Validation

### Visual-system verification

- Typography, spacing, alignment, components, iconography, and semantic states follow canonical tokens.
- The product does not look like an unstyled framework or a collection of unrelated modules.
- Financial and risk information is legible and consistent.

### Workflow verification

- The user always knows location, active Deal, status, freshness, and next action.
- Every visible control has working end-to-end behavior.
- Long workflows save progress and reopen correctly.
- Completion provides a logical next action.
- No dead ends exist.

### State verification

- Loading, empty, partial, saved, processing, stale, offline, conflict, permission, retry, and failure states are intentionally implemented.
- Background failures are visible and recoverable.
- Prior valid results remain available.
- No client displays stale data as current.

### Cross-client verification

- The same realistic Deal is reviewed on web, iPhone, iPad, PDF, spreadsheet, shared report, and admin.
- Material values, statuses, history, permissions, and actions reconcile.
- iPhone and iPad flows are platform-appropriate.

### Accessibility verification

- Keyboard-only web operation succeeds.
- Screen-reader labels, order, and errors are correct.
- Dynamic Type and VoiceOver preserve core native workflows.
- Reduced motion and contrast requirements pass.

### Production readiness

- No dead controls, placeholder states, fake data, silent errors, endless spinners, disconnected navigation, contradictory values, or unmarked stale results remain.

**DOCUMENT STATUS: REVIEWED AND REPAIRED**
