# BRIX Real Estate — UI Design System Blueprint

## 1. Authority and Rules of Engagement

This document is governed by `docs/00-START-HERE.md` through `docs/06-SYSTEM-ARCHITECTURE.md` and Specifications 001–024.

Rules:

1. This is the implementation blueprint for BRIX visual design, interaction design, navigation, responsive behavior, and component usage.
2. It may clarify design execution but may not change product scope or canonical workflow ownership.
3. Web, iPhone, and iPad must feel purpose-built while sharing vocabulary, hierarchy, states, and decision logic.
4. No screen is complete with only a polished happy path.
5. Every interactive control must work, persist, reopen, fail safely, and expose its current state.
6. Accessibility is a baseline requirement, not a later enhancement.
7. Premium design means calm hierarchy, precise spacing, readable density, trustworthy states, and fast interaction, not decorative excess.
8. No module may invent a separate visual language, spacing system, status vocabulary, icon meaning, or interaction pattern.
9. Every state must distinguish canonical fact, estimate, assumption, AI inference, missing information, stale information, conflict, and professional-review need where applicable.
10. This document ends with verification against all connected screens and workflows.

## 2. Design Mission

BRIX must make complex real estate analysis and transaction work feel understandable, controlled, and decision-ready. The interface should reduce chaos without hiding complexity.

The experience must communicate:

- what the user is looking at;
- which Deal and Property are active;
- what is known;
- what is assumed;
- what is missing;
- what changed;
- what matters most;
- what action is next;
- what requires professional review.

## 3. Product Personality

The visual and interaction character is:

- premium but practical;
- analytical but approachable;
- calm rather than loud;
- modern rather than trendy;
- dense when useful, never cluttered;
- confident without overstating certainty;
- designed for real work, not demo screens.

Avoid:

- oversized marketing-style cards inside operational workflows;
- excessive gradients, glass effects, or decoration;
- hidden navigation;
- novelty interactions;
- ambiguous icons without labels;
- color as the only status signal;
- empty dashboards filled with fake data;
- generic AI sparkle treatment for authoritative outputs.

## 4. Design Tokens

### 4.1 Token requirements

Implement tokens rather than hard-coded values for:

- color;
- typography;
- spacing;
- radius;
- border;
- elevation;
- motion;
- breakpoints;
- content width;
- focus rings;
- touch targets;
- chart styles;
- semantic states.

Tokens must be shared by web and mapped consistently to native design constants.

### 4.2 Color roles

Required semantic roles:

- canvas;
- surface;
- elevated surface;
- inset surface;
- primary text;
- secondary text;
- muted text;
- border;
- strong border;
- accent;
- accent-hover;
- focus;
- success;
- warning;
- danger;
- information;
- assumption;
- estimate;
- AI-derived;
- stale;
- conflict;
- disabled.

Status meaning must remain consistent across modules. Color must always be paired with text, icon, shape, or pattern.

### 4.3 Dark and light appearance

Both modes must preserve contrast, hierarchy, charts, source labels, disabled states, focus states, warning severity, and document readability. Dark mode must not simply invert colors.

### 4.4 Typography

Typography must define:

- display;
- page title;
- section title;
- card title;
- body;
- compact body;
- label;
- metadata;
- numeric metric;
- table value;
- code/identifier;
- legal/source excerpt.

Financial values should use tabular numerals where supported. Long-form document content needs comfortable line height and width. Headings must form a valid accessibility hierarchy.

### 4.5 Spacing and density

Use one consistent spacing scale. Supported density modes may include comfortable and compact, but density changes must not alter information meaning or workflow availability.

Touch targets remain accessible even in compact mode.

## 5. Layout System

### 5.1 Web breakpoints

Define behavior for:

- compact/mobile width;
- tablet width;
- standard desktop;
- wide desktop.

Do not design only for one 1440-pixel screenshot.

### 5.2 Content frames

Required layout frames:

- public marketing frame;
- authenticated application shell;
- dashboard frame;
- Deal workspace frame;
- document review frame;
- map/visit frame;
- comparison frame;
- admin frame;
- report/shared-view frame.

### 5.3 Grid

Use a stable grid with predictable gutters. Dense analytical tables may use full-width space. Reading content should remain constrained. The Decision Cockpit may combine a primary decision column with supporting context columns.

### 5.4 Sticky regions

Sticky headers, action bars, or side navigation may be used only when they preserve context and do not reduce usable viewport excessively. Sticky regions must work with keyboard navigation and zoom.

## 6. Global Application Shell

### 6.1 Web shell

Required regions:

- primary navigation;
- workspace selector;
- active Deal context;
- global search/Ask BRIX entry;
- notifications;
- background-job status;
- help;
- account/settings.

Navigation must preserve the current Deal and return context.

### 6.2 iPhone shell

Prioritize:

- Dashboard;
- Deals;
- quick capture;
- tasks;
- notifications;
- search;
- settings.

Use native navigation stacks, tabs, sheets, and context menus. Avoid squeezing desktop sidebars into a phone.

### 6.3 iPad shell

Support:

- sidebar;
- split view;
- list/detail;
- document plus analysis;
- map plus visit panel;
- keyboard shortcuts;
- pointer behavior;
- drag and drop.

## 7. Navigation Model

Primary authenticated navigation:

1. Dashboard.
2. Deals.
3. Portfolio/Comparison.
4. Tasks and Deadlines.
5. Reports.
6. Search.
7. Help/Learning.
8. Admin when authorized.
9. Settings.

Deal workspace navigation:

- Decision Cockpit;
- Property;
- Underwriting;
- Strategies;
- MarketIQ;
- FinanceIQ;
- GovernanceIQ;
- ContractIQ;
- OfferIQ;
- Photos;
- Visits;
- Inspection/Appraisal;
- Evidence;
- Reports;
- Activity;
- Tasks.

The interface may progressively disclose less-used modules but must never create dead or undiscoverable destinations.

## 8. Core Component Library

### 8.1 Foundations

- Button.
- Icon button.
- Link.
- Badge.
- Status chip.
- Tooltip.
- Popover.
- Menu.
- Divider.
- Avatar.
- Progress indicator.
- Skeleton.
- Empty state.
- Inline message.
- Toast.
- Banner.
- Dialog.
- Drawer/sheet.

### 8.2 Form components

- Text input.
- Number/currency/percentage input.
- Date/time input.
- Address input.
- Select and combobox.
- Multi-select.
- Checkbox.
- Radio group.
- Toggle.
- Segmented control.
- File drop zone.
- Camera/capture control.
- Source-classification selector.
- Confidence/verification control.
- Formula input where approved.

Forms must support validation, unsaved state, save state, retry, conflict, keyboard use, autofill, and accessible error descriptions.

### 8.3 Data display

- Metric card.
- Comparison card.
- Key/value list.
- Table/data grid.
- Timeline.
- Activity feed.
- Source citation.
- Evidence preview.
- Document viewer.
- Image gallery.
- Map.
- Chart.
- Sensitivity matrix.
- Waterfall/capital stack.
- Deadline list.
- Task list.
- Risk register.

### 8.4 Workflow components

- Stage indicator.
- Verification checklist.
- Proposal acceptance panel.
- Conflict resolver.
- Change explanation.
- Background-job panel.
- Upload queue.
- Offline/sync indicator.
- Professional-review banner.
- Recommendation panel.
- Missing-input panel.
- Next-action panel.

## 9. State Design Standard

Every applicable screen and component must define:

- initial;
- loading;
- skeleton;
- empty;
- populated;
- saving;
- saved;
- partially complete;
- offline;
- queued;
- syncing;
- stale;
- conflicted;
- warning;
- failed;
- retrying;
- permission denied;
- access revoked;
- unsupported version;
- deleted/archived;
- prior valid result available.

No generic blank screen or endless spinner is acceptable.

## 10. Source, Confidence, and Truth Presentation

### 10.1 Source labels

Every material value may expose:

- source type;
- source name;
- effective date;
- retrieved date;
- verification state;
- confidence;
- stale/superseded state;
- source anchor.

### 10.2 Visual distinctions

Confirmed facts, assumptions, estimates, extracted candidates, AI inferences, professional findings, and conflicts must be distinguishable without relying solely on color.

### 10.3 Change history

Material changes should support:

- previous value;
- new value;
- actor/source;
- timestamp;
- reason;
- downstream impact;
- ability to open the governing evidence.

## 11. Dashboard Design

The dashboard must prioritize useful work, not vanity metrics.

Required sections may include:

- active Deals;
- urgent tasks/deadlines;
- recently changed recommendations;
- background jobs requiring attention;
- recent evidence;
- portfolio summary;
- saved views;
- quick intake;
- learning/help prompts when relevant.

Empty dashboard behavior must help create or import the first Deal without fake charts.

## 12. Deal Workspace and Decision Cockpit

### 12.1 Header

Show:

- property identity;
- Deal status/stage;
- active strategy/recommendation;
- last updated;
- verification completeness;
- key actions.

### 12.2 Decision hierarchy

The Cockpit should answer in order:

1. What is the current recommendation?
2. Why?
3. What numbers control it?
4. What risks or restrictions matter?
5. What is missing or unverified?
6. What changed?
7. What should happen next?

### 12.3 Supporting panels

- key financial metrics;
- strategy comparison;
- financing snapshot;
- market snapshot;
- governance/contract restrictions;
- risk and confidence;
- tasks/deadlines;
- evidence and recent activity.

## 13. Underwriting and Finance Interfaces

- Inputs and outputs remain clearly separated.
- Assumptions show source and verification.
- Calculated cells are not editable unless explicitly defined as inputs.
- Scenario selection remains visible.
- Sensitivity controls show affected outputs immediately but do not save silently.
- Tables align currency, percentages, dates, and units consistently.
- Complex capital stacks use progressive disclosure and a visual hierarchy.
- Recalculation states show pending, complete, warning, or failed without erasing prior valid results.

## 14. Document Intelligence Interfaces

ContractIQ, GovernanceIQ, InspectionIQ, and AppraisalIQ use a common review pattern:

- document inventory;
- original viewer;
- source-linked findings;
- summary;
- conflicts;
- verification queue;
- proposed canonical changes;
- professional questions;
- history.

Web and iPad should support side-by-side viewing. iPhone should use compact summaries with direct source-page navigation.

## 15. Offer and Negotiation Interfaces

OfferIQ must clearly separate:

- current internal analysis;
- proposed offer terms;
- sent offer;
- counter received;
- accepted/executed terms.

Revision history is visible. Maximum offer is explained by binding constraints. External communication requires explicit review and confirmation.

## 16. Photo and Visit Interfaces

### 16.1 PhotoIQ

- gallery by area/room/category;
- capture/import;
- upload status;
- original versus processed derivative;
- observations and confidence;
- correction and proposal acceptance;
- repair/condition connections.

### 16.2 VisitIQ

- map and route;
- stop list;
- arrival context;
- checklist;
- photo/video/voice capture;
- offline state;
- visit summary;
- follow-up tasks.

Field controls must be large, fast, and usable in poor connectivity.

## 17. Evidence and File Interfaces

The Evidence center must support:

- upload/import/email intake;
- Inbox/unassigned state;
- Deal and Property assignment;
- type and sensitivity classification;
- duplicate detection;
- processing state;
- original preview;
- derived text/transcript;
- linked findings;
- retention/deletion state;
- audit history.

## 18. Reporting and Portfolio Interfaces

### 18.1 Reports

- report type selection;
- scope and format;
- queued/generating state;
- artifact history;
- preview;
- download;
- share/revoke;
- stale/superseded warning.

### 18.2 Portfolio comparison

Support:

- configurable columns;
- saved filters/views;
- stable sorting;
- comparable-metric warnings;
- bulk report/export;
- direct opening of the selected Deal.

Large grids must support keyboard navigation, horizontal scrolling, sticky identifiers, and responsive alternatives.

## 19. Admin Interfaces

Admin UI must distinguish platform operations from customer workspace data. Required areas include:

- users/workspaces;
- plans/entitlements;
- usage/cost;
- background jobs;
- provider health;
- support notes;
- audit events;
- feature flags;
- incident state.

Destructive or sensitive actions require confirmation, reason, authorization, and audit.

## 20. Public Landing, Help, and Conversion

Public pages must include:

- clear product positioning;
- accurate feature examples;
- pricing and plan boundaries;
- security/privacy overview;
- help and learning content;
- legal pages;
- signup/sign-in conversion paths.

Marketing claims must match implemented capabilities and current availability. Public design should feel related to the application but less dense.

## 21. Motion and Feedback

Motion must:

- clarify hierarchy or causality;
- remain brief;
- respect reduced-motion settings;
- never delay critical work;
- avoid decorative looping.

Use immediate feedback for saves, queued jobs, uploads, conflict detection, and completion. Haptics on native clients should be subtle and meaningful.

## 22. Accessibility

Verify:

- semantic HTML and native controls;
- keyboard access;
- visible focus;
- screen-reader labels and order;
- heading structure;
- form labels and errors;
- Dynamic Type;
- VoiceOver;
- zoom/reflow;
- sufficient contrast;
- reduced motion;
- differentiate without color;
- accessible charts/tables;
- captions/transcripts;
- minimum touch targets.

Critical information must not depend on hover, color, drag, gesture, animation, or visual position alone.

## 23. Content and Microcopy

Use direct, human language. Labels should describe actions and states precisely.

Preferred:

- “Save assumptions” rather than “Submit.”
- “Needs verification” rather than “Maybe wrong.”
- “Prior result remains available” rather than generic failure.
- “Open source” rather than unexplained link icon.

Avoid legal-sounding certainty, hype, blame, and vague AI language.

## 24. Responsive and Native Adaptation

The same workflow may use different layouts by device, but must preserve:

- available decisions;
- canonical data;
- status meaning;
- validation;
- history;
- connected actions.

Web may use multi-column workspaces. iPhone may use stacked screens and sheets. iPad may use split views. No device should receive a fake or disconnected experience.

## 25. Design QA Requirements

For every screen:

1. Compare against tokens and component library.
2. Verify all states.
3. Verify all breakpoints and orientations.
4. Verify keyboard and screen reader.
5. Verify content overflow and long values.
6. Verify empty and large-data cases.
7. Verify offline, stale, conflict, error, and retry.
8. Verify save/reopen.
9. Verify navigation and deep links.
10. Verify analytics/telemetry does not expose sensitive content.

## 26. Verification and Validation

### Visual consistency

- No module-specific token drift.
- Typography, spacing, radius, borders, and elevation are consistent.
- Status colors and icons retain one meaning.
- Tables and financial values align consistently.
- Web, iPhone, and iPad clearly belong to the same product.

### Workflow verification

- Every visible action completes or explains why it cannot.
- No dead buttons, placeholder menus, fake downloads, or disconnected tabs remain.
- Forms preserve work during errors and session interruptions.
- Deep links land on authorized, useful states.
- Back navigation preserves context.

### State verification

- Loading, empty, partial, offline, stale, conflict, failed, retry, permission, and prior-result states exist where applicable.
- No prior valid result is erased during refresh or failure.
- Background work remains visible without blocking unrelated navigation.

### Accessibility verification

- WCAG-targeted checks pass on web.
- Native accessibility checks pass on supported devices.
- Keyboard-only and screen-reader critical paths are complete.
- Charts, maps, documents, and financial tables have accessible alternatives.

### Cross-module verification

- Decision Cockpit opens governing modules and source evidence.
- Accepted proposals update owning modules and return visible confirmation.
- Reports use the same labels and values as live screens.
- Notifications deep-link to the correct Deal, task, deadline, or finding.
- Help and RELearnIQ preserve the active workflow.

## 27. Definition of Done

This design system is complete when Codex or a product engineering team can build every BRIX screen without inventing visual hierarchy, component patterns, responsive behavior, state treatment, accessibility behavior, device adaptation, or workflow feedback, and when all screens remain consistent with the product constitution, architecture, roadmap, and Specifications 001–024.