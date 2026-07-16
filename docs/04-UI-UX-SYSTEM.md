# BRIX Real Estate — Premium UI and UX System

## 1. Purpose

This document governs the complete BRIX user experience across responsive web, native iPhone, native iPad, reports, shared views, and admin tools.

Premium means the product is easier to understand, faster to use, more trustworthy, and more resilient. It does not mean excessive animation, decorative dashboards, or visual complexity.

## 2. Experience principles

- Decision first
- Clear before clever
- Fast without feeling rushed
- Dense when useful, never cluttered
- Calm under pressure
- Progressive disclosure
- Same truth, client-appropriate interaction
- No dead ends
- No hidden save state
- No stale state presented as current
- No disconnected modules
- No framework-default visual experience

## 3. Global information hierarchy

Every Deal screen must make these visible or immediately reachable:

1. Active workspace
2. Active Deal and Property
3. Deal stage
4. Current recommendation
5. Strongest strategy
6. Selected strategy
7. Key financial results
8. Material risks and blockers
9. Confidence and evidence quality
10. Missing decision-changing information
11. Deadlines
12. Primary next action
13. Freshness, processing, sync, and conflict state

## 4. Navigation architecture

### Global navigation

- Home/portfolio cockpit
- Deals/PipelineIQ
- FindIQ
- Reports
- RELearnIQ
- Notifications
- Global search
- Create Deal
- Workspace/account
- Admin for authorized users

### Deal navigation

- Overview
- Property
- Underwriting
- Strategies
- Market
- Financing
- Visits
- Photos and media
- Documents
- Governance
- Offer
- Contract
- Inspection
- Appraisal
- Tasks and deadlines
- Contacts and organizations
- Activity and history
- Reports
- Education

Deal navigation must preserve active Deal context. Deep links, notifications, map pins, search results, reports, and shared links must open the correct canonical record and relevant module.

## 5. Premium visual system

### Typography

- Strong numeric legibility
- Tabular numerals for financial tables
- Clear hierarchy for page title, section title, label, value, metadata, and helper text
- No tiny secondary text that becomes unreadable in the field
- Dynamic Type support on iOS

### Spacing and layout

- Consistent spacing tokens
- Deliberate content grouping
- Avoid excessive nested cards
- Use whitespace to separate decisions, evidence, and controls
- Support compact professional density and guided density without changing underlying data

### Color and status

Use separate systems for:

- Success/completion
- Warning
- Blocking risk
- Informational state
- Confidence
- Freshness
- Processing
- Offline
- Conflict

Do not use color alone. Pair color with labels, icons, patterns, or text.

### Components

Canonical components must include:

- Buttons and button groups
- Inputs and selectors
- Currency, percentage, date, and unit fields
- Status badges
- Risk and confidence indicators
- Property and Deal cards
- KPI blocks
- Tables
- Comparison grids
- Timeline
- Task and deadline lists
- Upload zones
- Processing indicators
- Evidence citations
- Side panels/drawers
- Dialogs
- Toasts and persistent alerts
- Charts with accessible summaries
- Empty, loading, stale, offline, conflict, and failure states

## 6. Interaction requirements

- Primary action is obvious.
- Secondary actions do not compete.
- Destructive actions explain consequences.
- Long forms use sections, autosave, progress, and return-to-last-position.
- Material submissions use explicit confirmation.
- Repetitive safe actions support batch behavior.
- Filters show active state and clear reset.
- Search explains its scope.
- Empty states provide the next meaningful action.
- Every action produces accurate feedback: local save, synced, queued, processing, complete, failed, stale, conflict, or needs verification.
- Undo is provided where practical for frequent reversible actions.

## 7. Form standards

Every form must include:

- Clear labels
- Units and currency
- Required versus optional indication
- Inline validation
- Source/classification where material
- Sensible defaults labeled as assumptions or defaults
- Preserved input after recoverable failure
- Autosave when loss would be costly
- Save/sync state
- Accessible error summaries
- Mobile-appropriate keyboard/input type
- Conflict handling for concurrent edits

No field may use a fabricated value to make a workflow appear complete.

## 8. State design

Each module must intentionally design:

- First use
- Empty
- Loading
- Partial
- Saved locally
- Queued
- Uploading
- Processing
- Complete
- Failed
- Retry scheduled
- Permission denied
- Offline
- Stale
- Conflict
- Superseded
- Cancelled

Generic endless spinners are prohibited. Long-running work must show durable status and expected next step.

## 9. Freshness and stale-state UX

- Show `as of` time for market data, underwriting, rankings, recommendations, reports, and external findings.
- Indicate when results do not include the latest evidence or assumptions.
- Keep prior valid results visible when refresh fails, marked stale.
- Do not replace a valid result with an empty error screen.
- Show which change caused recalculation or stale state.
- Show before/after material changes in recommendations.

## 10. Error and recovery UX

Errors must explain:

- What failed
- What was preserved
- Whether the Deal decision is affected
- What the user can do now
- Whether retry is safe
- Support reference when appropriate

Differentiate validation, permission, offline, conflict, provider outage, timeout, rate limit, and internal error.

## 11. Web experience

Web must support:

- Responsive desktop, laptop, tablet, and narrow layouts
- Keyboard navigation
- Command/search access
- Dense underwriting and comparison views
- Drag and drop
- Multi-column review
- Accessible tables and charts
- Persistent Deal context
- Browser refresh without lost progress
- Clear background processing center

## 12. iPhone experience

The iPhone experience must be field-first:

- One-handed primary flows
- Large touch targets
- Quick Add Deal
- Quick Photo
- Quick Voice Note
- Current Deal
- Directions
- Visit checklist
- Offline capture
- Background upload
- Visible sync state
- Deep-link routing
- Minimal taps to record observations
- Safe-area and orientation behavior

Do not reproduce desktop tables as unusable horizontal grids.

## 13. iPad experience

The iPad app must be designed as an iPad application:

- Split view/multi-column layouts
- Deal list plus active Deal
- Cockpit beside document or comparison
- Drag and drop
- Keyboard shortcuts
- Pointer support
- Multitasking
- Large-form underwriting
- Document review with source-linked findings
- No stretched iPhone screens

## 14. Guided and professional modes

Guided mode may provide:

- Explanations
- Definitions
- Recommended order
- Examples
- Verification prompts
- RELearnIQ links

Professional mode may provide:

- Denser layouts
- Advanced inputs
- Keyboard shortcuts
- Batch actions
- Formula/source detail
- Comparison tables

Both modes use identical canonical data, calculations, risks, and recommendations.

## 15. Accessibility

- WCAG 2.2 AA for web
- VoiceOver
- Dynamic Type
- Reduce Motion
- Logical focus order
- Sufficient contrast
- Accessible chart summaries
- Keyboard operation
- Announced form errors
- Platform-compliant touch targets
- No color-only meaning

## 16. Animation

Animation is allowed only for orientation, state change, progress, confirmation, and useful reveal.

Animation must be:

- Short
- Purposeful
- Interruptible
- Reduced under accessibility settings
- Non-blocking
- Performance-safe

Marketing-style animation must not enter core workflows.

## 17. Module connection pattern

Every module screen must define:

- Entry points
- Canonical records read
- Canonical records written
- Events consumed
- Events emitted
- Tasks/deadlines created
- Calculations affected
- Recommendations affected
- Reports affected
- Timeline entries created
- Notifications created
- Failure fallback
- Offline behavior
- Reopen behavior

A module is incomplete if its outputs remain trapped inside that module.

## 18. UI/UX release gate

Do not release when:

- A visible control is disconnected.
- A screen ends without a logical next action.
- A saved workflow cannot be reopened.
- Web and iOS show contradictory material values.
- A stale result appears current.
- A background failure is silent.
- An offline change can be overwritten without conflict handling.
- A notification opens the wrong context.
- The iPad app is a stretched phone layout.
- The UI appears like an unstyled component library.
- Accessibility breaks a core workflow.
- Loading, error, stale, offline, permission, and conflict states have not been designed.

Before release, run the same realistic Deal journey on web, iPhone, iPad, PDF, spreadsheet, shared report, and admin. Material values, statuses, permissions, history, and next actions must reconcile.
