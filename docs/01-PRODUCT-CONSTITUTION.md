# BRIX Real Estate — Product Constitution

## 1. Authority and Rules of Engagement

This document is the binding product authority for BRIX Real Estate. It is governed by `docs/00-START-HERE.md` and must be read before any architecture, design, database, integration, or implementation decision.

The following rules are permanent:

1. BRIX is the product. Documentation exists only to make BRIX accurate, connected, secure, usable, and production-ready.
2. BRIX uses one canonical `workspace_id`, one canonical `property_id`, one canonical `deal_id`, one canonical evidence system, one canonical task/deadline system, one canonical timeline, and one deterministic financial engine.
3. Modules are connected capabilities inside one product. They may not become isolated applications, independent databases, duplicate workflows, or competing sources of truth.
4. Every material fact, estimate, assumption, inference, finding, recommendation, professional opinion, conflict, and unknown must remain distinctly classified.
5. AI may extract, classify, summarize, explain, compare, and propose. AI may not own authoritative calculations, silently change canonical facts, or present legal, lending, appraisal, inspection, tax, insurance, or market conclusions as verified professional determinations.
6. Every visible action must work end to end or remain hidden behind an explicit feature flag.
7. Every workflow must save, reopen, recover from interruption, expose freshness, handle failure, preserve history, and remain consistent across supported clients.
8. A recommendation must identify the evidence, assumptions, calculation version, confidence, disqualifiers, binding constraints, and missing decision-changing information behind it.
9. BRIX recommends. The investor decides. System recommendations and user decisions must be stored separately.
10. No later specification may weaken this constitution without an explicit, reviewed amendment.

## 2. Product Identity

BRIX Real Estate is a Property Deal Relationship Management platform, or PDRM, and real estate investment operating system. It organizes the complete relationship between an investor and a property opportunity inside one durable Deal workspace.

BRIX must help an investor answer:

- What is the property or property package?
- What information is confirmed, user-entered, estimated, inferred, conflicting, stale, or missing?
- Which strategies are compatible and viable?
- Which strategy is strongest, and why?
- What cash, financing, operations, risk, time, and professional review are required?
- What returns are expected under baseline, downside, and upside scenarios?
- Which constraints or unknowns could change the decision?
- What should the investor verify or do next?
- How has the Deal changed as new evidence arrived?

## 3. Users and Experience Modes

BRIX must serve:

- New investors who need guided workflows, definitions, examples, warnings, educational context, and clear next steps.
- Experienced residential investors who need fast intake, reliable calculations, scenario comparisons, field tools, offer support, and portfolio visibility.
- Commercial and multifamily investors who need dense underwriting, multiple capital tranches, lease and document analysis, complex property structures, and professional reporting.
- Teams, advisors, and authorized collaborators who need controlled access, accountability, history, and shared evidence.

Guided and professional modes must use the same canonical records, calculations, evidence, and recommendations. Guided mode may explain and progressively disclose. It may not simplify the underlying truth.

## 4. Supported Property Scope

BRIX must be extensible across lawful real estate opportunities, including:

- Single-family residential
- Condominiums and townhomes
- Two-to-four-unit residential
- Small and large multifamily
- Mixed use
- Office and medical office
- Retail and NNN
- Industrial, warehouse, and flex
- Self-storage
- Hospitality
- Mobile-home and RV parks
- Land, agricultural, timber, and recreational property
- Development and redevelopment
- Adaptive reuse
- Portfolios and multi-property acquisitions
- Specialty assets through versioned property-type models

Property-type support must never be implied merely because a generic form accepts an address. Each supported type requires appropriate inputs, calculations, risks, strategy rules, reports, and validation.

## 5. Canonical Product Model

### 5.1 Property

A Property represents the durable real-world asset or asset package. It may have multiple Deal lifecycles over time. Property identity may include normalized address, parcel identifiers, coordinates, legal descriptions, units, buildings, source listing identifiers, and project names.

Potential duplicates may be suggested, but BRIX must never silently merge Property records.

### 5.2 Deal

A Deal represents one investor opportunity and decision lifecycle associated with one or more Properties. Every assumption, calculation, strategy, document, contact, task, visit, photo, voice note, offer, contract, financing structure, inspection, appraisal, recommendation, report, and decision must connect to the canonical Deal.

### 5.3 Evidence

Evidence preserves the source material supporting Deal information. Original evidence remains immutable. Derived findings may be corrected, superseded, accepted, rejected, or reprocessed without changing the original.

### 5.4 Assumptions and results

Material assumptions are versioned. Authoritative financial results are produced only by the deterministic underwriting engine from immutable input snapshots and a recorded engine version.

### 5.5 Recommendation and decision

A Recommendation is a versioned system conclusion. A Decision is the user’s recorded action or intent. They must not overwrite one another.

## 6. Core Product Capabilities

BRIX includes connected capabilities commonly presented as:

- DealIQ
- FindIQ
- PipelineIQ
- MarketIQ
- FinanceIQ
- GovernanceIQ
- ContractIQ
- OfferIQ
- VisitIQ
- PhotoIQ
- Voice Notes
- InspectionIQ
- AppraisalIQ
- ReportIQ
- PortfolioIQ
- RELearnIQ
- Admin, Billing, Usage, and Platform Operations

These names describe user-facing capabilities. They do not authorize separate apps, duplicate models, duplicate navigation systems, duplicate stores, or duplicate calculations.

Every capability must define:

- Canonical records read and written
- Domain events consumed and emitted
- Calculations affected
- Recommendations affected
- Tasks and deadlines created
- Reports and portfolio views consuming its output
- Freshness and stale-state behavior
- Failure and manual fallback behavior
- Web, iPhone, and iPad entry points

## 7. Supported Strategy Scope

BRIX must evaluate the user-selected strategy and all compatible alternatives. The versioned strategy registry must support, where applicable:

- Long-term, medium-term, and short-term rental
- Rent by room, co-living, student housing, and senior housing
- House hack
- BRRRR
- Fix and flip
- Live-in flip
- Buy and hold
- Light and heavy value add
- New construction and build to rent
- Seller financing and lease option
- Subject-to and wrap structures where lawful and appropriately reviewed
- Stabilized and value-add multifamily
- Commercial hold, NNN, owner-user, repositioning, and adaptive reuse
- Ground lease
- Land hold, land banking, entitlement, subdivision, development, and assemblage
- REO, foreclosure, short sale, tax sale, probate, and estate sale
- Joint venture, syndication evaluation, and portfolio acquisition
- 1031 replacement and opportunity-zone evaluation

Each strategy requires:

- Permanent strategy ID and version
- Compatible property types
- Required and optional inputs
- Deterministic calculation contract
- Hard disqualifiers
- Risks and execution burden
- Financing compatibility
- Market and governance dependencies
- Output and comparison contract
- Confidence rules
- RELearnIQ content
- Golden acceptance scenarios

A favorable score may never conceal a hard disqualifier.

## 8. Decision-First Product Experience

The active Deal must make the following clear without excessive navigation:

1. Current Deal stage
2. Current recommendation
3. Strongest viable strategy
4. User-selected strategy
5. Key financial outputs
6. Material risks and disqualifiers
7. Confidence and freshness
8. Missing decision-changing information
9. Deadlines and required actions
10. What changed since the previous result
11. The evidence and assumptions supporting the conclusion

The user must be able to move from summary to evidence, calculation, source document, or professional-review question without losing Deal context.

## 9. Complete Deal Lifecycle

BRIX must support a continuous workflow:

1. Discover, share, import, or manually enter an opportunity.
2. Match or create the canonical Property.
3. Create the canonical Deal.
4. Select the intended strategy and investor objectives.
5. Import listing, public, licensed, and user-provided data.
6. Classify sources and resolve material conflicts.
7. Build preliminary assumptions.
8. Run deterministic underwriting.
9. Evaluate and compare compatible strategies.
10. Research market, location, governance, insurance, and financing concerns.
11. Plan property visits and routes.
12. Capture photos, video, files, and voice notes, including offline capture.
13. Convert accepted field observations into evidence and versioned assumptions.
14. Prepare, compare, submit, and track offers and counters.
15. Analyze contracts, addenda, deadlines, and obligations.
16. Add and compare financing structures.
17. Ingest inspection and appraisal evidence.
18. Re-underwrite and re-rank based on accepted changes.
19. Generate reports, exports, and secure shared views.
20. Record the investor’s decision and rationale.
21. Close, own, stabilize, operate, refinance, dispose, pass, or archive.

Every stage must preserve history, connect to tasks and deadlines, and remain reopenable.

## 10. Evidence, Truth, and Confidence

Every material value must carry, where applicable:

- Source
- Source date
- Effective date
- Retrieved date
- Classification
- Confidence
- Verification state
- Freshness state
- Author or actor
- Related evidence
- Version
- Conflict status

Required classifications include:

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

A value may move between classifications only through an explicit, auditable action.

## 11. Continuous Underwriting and Change Propagation

New evidence may change a Deal. BRIX must:

1. Preserve the previous accepted state.
2. Propose or record the changed fact or assumption.
3. Identify affected calculations and strategies.
4. Produce a new immutable underwriting snapshot.
5. Run the appropriate engine version.
6. Re-evaluate affected strategies.
7. Mark prior recommendations stale until the new result is complete.
8. Preserve before-and-after results.
9. Explain what changed and why.
10. Update connected reports, comparisons, tasks, and notifications through versioned dependencies.

No module may directly mutate a result owned by another module.

## 12. Premium UI and UX Standard

BRIX must feel calm, premium, intelligent, fast, trustworthy, and field-ready.

The experience must provide:

- Clear location, active workspace, active Deal, status, freshness, and next action
- Strong typography and numeric legibility
- Consistent components and vocabulary
- Decision-first hierarchy
- Guided and professional density modes
- Responsive web behavior
- Native, independently designed iPhone and iPad experiences
- Accessible color, focus, labels, charts, forms, and navigation
- Immediate truthful feedback for actions
- Autosave where loss would be costly
- Durable upload and processing states
- Clear loading, empty, partial, stale, offline, conflict, permission, and failure states
- Logical next action after completion

The user must never encounter:

- Dead controls
- Disconnected modules
- Contradictory values
- Unlabeled stale results
- Silent background failures
- Lost drafts or uploads
- Fake analysis or fake success
- Endless generic spinners
- Navigation that loses the active Deal
- Reports that disagree with the live Deal
- An iPad interface that is merely a stretched iPhone layout

## 13. Professional Boundaries

BRIX may organize, calculate, explain, compare, and identify questions concerning legal, tax, insurance, lending, appraisal, inspection, construction, environmental, zoning, market, association, and securities topics.

BRIX must not falsely represent itself as:

- An attorney or law firm
- A lender or loan approval system
- A licensed appraiser
- A property inspector or engineer
- A CPA or tax advisor
- An insurance producer or coverage determination
- A broker acting on behalf of the user
- A guaranteed market forecasting service

Professional-review recommendations must be specific enough to be useful and clearly linked to the concern requiring review.

## 14. Production Quality and Release Definition

BRIX is ready for release only when a real investor can complete the core lifecycle without developer intervention and when:

- Every visible workflow works end to end.
- Canonical records remain consistent across web, iPhone, iPad, reports, exports, shared views, and admin.
- Calculation fixtures and cross-client reconciliation pass.
- RLS, authorization, storage isolation, and account lifecycle tests pass.
- Offline capture and later synchronization protect user work.
- Background jobs expose durable state and recovery.
- Accessibility and responsive behavior pass.
- Monitoring, audit history, backups, restore, support, and rollback are operational.
- No P0 or P1 defects remain.
- No placeholder or unsupported capability is visible.

## 15. Verification and Validation

This constitution is valid only when every subordinate document and implementation can answer yes to the following.

### Product verification

- Does the capability improve decision quality, speed, evidence, risk visibility, understanding, workflow continuity, collaboration, or auditability?
- Does it operate inside the canonical Property and Deal model?
- Does it preserve the distinction between facts, assumptions, estimates, AI observations, professional opinions, conflicts, and unknowns?
- Does it support the intended property types and strategies without pretending generic support is complete support?
- Does it preserve investor control?

### Workflow verification

- Can the workflow be entered from the correct location and reopened at the correct state?
- Does every action persist, produce truthful status, and recover safely?
- Are accepted changes propagated through deterministic domain events?
- Are prior valid results preserved and marked stale when necessary?
- Do connected tasks, deadlines, reports, notifications, and timeline events update correctly?

### Cross-product verification

- Do web, iPhone, iPad, reports, spreadsheets, shared views, and admin show the same canonical material values and statuses?
- Do modules connect without duplicate ownership or business logic?
- Can the user move from recommendation to calculation, assumption, finding, and source evidence without losing context?
- Are permissions enforced server-side throughout the connected flow?

### UX verification

- Are loading, empty, partial, success, stale, offline, conflict, permission-denied, and failure states intentionally designed?
- Is the next action clear?
- Are beginner explanations available without obstructing professional workflows?
- Are accessibility, keyboard, touch, Dynamic Type, VoiceOver, and reduced-motion requirements met where applicable?

### Release validation

This document is complete only when it remains consistent with `00-START-HERE.md`, the engineering, data, UI/UX, and roadmap documents, and all subsystem specifications. Any contradiction must be resolved in favor of the stricter rule or through an explicit constitutional amendment.

**DOCUMENT STATUS: REVIEWED AND REPAIRED**
