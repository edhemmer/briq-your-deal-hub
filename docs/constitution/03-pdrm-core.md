# Section 3 — PDRM Core and Canonical Deal Architecture

## Authority

This section is part of the governing BRIX Product Constitution and Engineering Standard. It defines the architectural center of BRIX: the Property Deal Relationship Management core, the canonical deal, the property digital twin, the relationship model, the evidence graph, the decision history, and the lifecycle rules that every BRIX system must follow.

No BRIX capability may create a competing deal record, property identity, evidence store, decision history, timeline, relationship model, or financial source of truth.

---

## 3.1 Purpose

The PDRM Core is the system that keeps every property opportunity, person, document, calculation, decision, task, event, and outcome connected to one durable investment record.

Its purpose is to prevent fragmentation.

Without the PDRM Core, underwriting can become separated from contracts, photos can become separated from inspections, financing can become separated from offers, and decisions can become separated from the evidence that produced them. BRIX must never allow that fragmentation.

The PDRM Core must make it possible for an investor to open any deal and immediately understand:

- what property is being evaluated
- who is involved
- what stage the opportunity is in
- what facts are known
- what assumptions are being used
- what evidence supports the analysis
- what changed over time
- what deadlines exist
- what decisions were made
- what the current recommendation is
- what the next action should be

The PDRM Core is not a generic CRM layer. It is the operational memory of the investment.

---

## 3.2 PDRM Definition

PDRM means Property Deal Relationship Management.

It manages the complete relationship between:

- the investor
- the property
- the opportunity
- the ownership or acquisition structure
- the people and organizations involved
- the evidence gathered
- the financial analysis performed
- the strategies considered
- the decisions made
- the obligations created
- the asset after acquisition
- the eventual exit

The canonical hierarchy is:

1. Workspace or Account
2. Portfolio
3. Property
4. Deal
5. Strategy Scenario
6. Evidence
7. Decision
8. Activity and Event

A single property may have more than one deal over its lifetime, but a single deal may not represent more than one unrelated property unless it is intentionally defined as a portfolio or multi-asset acquisition.

---

## 3.3 Core Architectural Principle

Every major BRIX system must attach to the same canonical Deal ID.

This includes:

- listing imports
- property records
- parcels
- ownership records
- contacts
- organizations
- county data
- zoning
- taxes
- insurance
- market data
- rent data
- financing
- underwriting
- strategy comparisons
- offers
- contracts
- inspections
- appraisals
- surveys
- title documents
- governance documents
- photos
- video
- voice notes
- emails
- tasks
- deadlines
- recommendations
- reports
- exports
- decision history
- portfolio results

No subsystem may create an isolated copy of the deal.

---

## 3.4 Canonical Property Identity

A property must have one durable identity even when source systems describe it differently.

A canonical property record may include:

- internal Property ID
- primary address
- normalized address
- alternate addresses
- parcel number or parcel numbers
- legal description
- latitude and longitude
- county
- municipality
- state
- postal code
- country
- building or project name
- unit identifiers
- property type
- subtype
- year built
- land area
- building area
- unit count
- zoning designation
- ownership entity
- source listing identifiers

### Identity Matching

BRIX should identify possible duplicate properties using a combination of:

- normalized address
- parcel number
- coordinates
- unit number
- legal description
- source identifiers
- owner name
- building name

The system must never silently merge properties.

Potential duplicates must be surfaced for review when confidence is insufficient.

### Property and Deal Separation

The property is the underlying real estate asset.

The deal is the investor's relationship with that asset during a specific opportunity or ownership cycle.

Examples:

- One property may be evaluated and passed in 2026, then evaluated again in 2028 as a new deal.
- One property may have an acquisition deal, a refinance event, and a later disposition deal.
- A condominium building may be one property while each unit is a related property with its own deal.
- A multi-parcel development may be one grouped property with multiple linked parcels.

The system must preserve these distinctions.

---

## 3.5 Canonical Deal Identity

Every opportunity must receive one immutable Deal ID at creation.

The Deal ID must remain stable through:

- listing changes
- price changes
- strategy changes
- status changes
- financing changes
- contract amendments
- re-underwriting
- acquisition
- ownership
- refinance
- disposition
- archive

The Deal ID must not be reused.

A deal may be archived, but it must not be destroyed unless the user intentionally deletes it and deletion rules permit removal.

### Minimum Deal Record

Every deal must include at least:

- Deal ID
- Property ID
- owner user or workspace
- created date
- current lifecycle state
- current recommendation
- intended strategy
- highest-ranked strategy
- primary asking or acquisition price
- data confidence state
- next action
- last material update date

### Deal Naming

The system should create a useful default name from the address or project name, but the user may rename the deal.

Renaming the deal must not change the Property ID, Deal ID, address, or source records.

---

## 3.6 The Property Digital Twin

Each deal must function as a living digital twin of the investment opportunity.

The digital twin is not a static folder. It is a continuously evolving model of the property, economics, evidence, risks, relationships, and decisions.

The digital twin must include:

- physical characteristics
- legal and parcel information
- ownership information
- market context
- financial assumptions
- financing structures
- strategy scenarios
- documents
- images
- observations
- inspection findings
- appraisal findings
- contract obligations
- governance restrictions
- offers
- deadlines
- decisions
- operating results after acquisition

When new evidence arrives, the digital twin must become more accurate without losing its prior state.

### Twin Integrity

The digital twin must distinguish:

- source fact
- user-entered fact
- estimate
- assumption
- calculation
- AI observation
- professional opinion
- conflict
- unknown

The current value and the historical values must both remain traceable.

---

## 3.7 Relationship Architecture

BRIX must model relationships as first-class data rather than free-text notes.

A relationship must identify:

- source entity
- target entity
- relationship type
- effective date
- end date where applicable
- source
- confidence
- notes
- created by
- created date

### Supported Person Roles

Examples include:

- buyer
- seller
- owner
- investor
- partner
- member
- manager
- realtor
- listing agent
- buyer's agent
- broker
- attorney
- title officer
- escrow officer
- lender
- mortgage broker
- appraiser
- inspector
- contractor
- engineer
- architect
- surveyor
- insurance agent
- property manager
- tenant
- guarantor
- accountant
- tax professional
- HOA or COA contact
- municipal contact

### Supported Organization Roles

Examples include:

- ownership LLC
- acquisition entity
- lender
- brokerage
- title company
- law firm
- management company
- contractor company
- appraisal firm
- inspection company
- HOA
- COA
- POA
- municipality
- county
- utility provider
- insurance carrier
- syndication entity
- seller entity

### Relationship Rules

- A person or organization may have multiple roles.
- Roles must be deal-specific where appropriate.
- Contacts must not be duplicated unnecessarily across deals.
- Historical role changes must be preserved.
- Sensitive private contact information must be access-controlled.

---

## 3.8 Evidence Graph

Every material item that supports, challenges, or changes a deal must be represented as evidence.

Evidence types include:

- listing data
- county records
- tax records
- zoning records
- permits
- title records
- deed records
- surveys
- environmental reports
- HOA, COA, POA, or association documents
- bylaws
- declarations
- rules and regulations
- budgets
- reserve studies
- meeting minutes
- financial statements
- contracts
- addenda
- amendments
- disclosures
- inspection reports
- appraisal reports
- lender documents
- insurance quotes
- contractor estimates
- photographs
- video
- voice notes
- text notes
- email content
- email attachments
- spreadsheets
- PDFs
- Word documents
- user observations
- professional opinions
- AI observations

### Evidence Metadata

Every evidence item must preserve:

- Evidence ID
- Deal ID
- Property ID where applicable
- file or content type
- source type
- source name
- source URL where applicable
- created date
- received date
- effective date
- uploaded by
- classification
- verification status
- extraction status
- extraction confidence
- related entities
- related calculations
- related decisions
- retention status
- version

### Evidence Immutability

The original evidence must not be altered after ingestion.

Derived data may be corrected, re-extracted, or reclassified, but the original file, message, image, or source snapshot must remain preserved unless deletion is legally or operationally required.

### Evidence Conflicts

When evidence conflicts, BRIX must:

1. preserve each source
2. identify the conflict
3. explain why the values differ where possible
4. prevent silent overwriting
5. identify the value currently used in underwriting
6. allow authorized user resolution
7. preserve the resolution history

---

## 3.9 Timeline and Activity Model

Every material event must appear on the canonical deal timeline.

Timeline events may include:

- deal created
- listing imported
- price changed
- property data updated
- evidence uploaded
- voice note created
- visit scheduled
- visit completed
- inspection ordered
- inspection received
- appraisal ordered
- appraisal received
- financing quote received
- offer prepared
- offer submitted
- offer rejected
- counteroffer received
- contract executed
- amendment executed
- deadline created
- deadline completed
- recommendation changed
- strategy ranking changed
- deal passed
- deal revived
- closing completed
- ownership started
- refinance completed
- property sold

Each timeline item must preserve:

- Event ID
- Deal ID
- event type
- timestamp
- actor
- source system
- related entity
- before state where material
- after state where material
- notes
- visibility

The timeline is the human-readable history of the deal.

---

## 3.10 Event Architecture

BRIX should use durable domain events for material changes.

Examples include:

- `deal.created`
- `property.updated`
- `evidence.added`
- `evidence.conflict_detected`
- `assumption.changed`
- `financing.changed`
- `inspection.received`
- `appraisal.received`
- `governance.restriction_found`
- `contract.deadline_created`
- `offer.submitted`
- `strategy.recalculated`
- `recommendation.changed`
- `deal.stage_changed`

A domain event may trigger:

- recalculation
- strategy re-ranking
- confidence update
- task creation
- notification
- report refresh
- audit logging
- mobile sync
- portfolio update

### Event Safety

- Events must be idempotent where possible.
- Duplicate delivery must not create duplicate calculations or records.
- Failed handlers must be retryable.
- Partial failures must not falsely mark the entire workflow complete.
- Critical events must be auditable.

---

## 3.11 Canonical Deal Lifecycle

The lifecycle must be explicit, ordered, and enforceable without becoming rigid.

### Pre-Acquisition States

1. Discovered
2. Screening
3. Researching
4. Needs Information
5. Ready for Call
6. Ready for Visit
7. Visit Scheduled
8. Visited
9. Underwriting
10. Pursuing
11. Offer Strategy
12. Offer Prepared
13. Offer Submitted
14. Negotiating
15. Under Contract
16. Due Diligence
17. Financing
18. Closing

### Ownership States

19. Acquired
20. Stabilizing
21. Operating
22. Improving
23. Refinancing
24. Holding
25. Exit Planning
26. Listed for Sale
27. Sold

### Holding or Terminal States

- Monitor
- Passed
- Dead
- Canceled
- Archived

### Lifecycle Rules

- State changes must be recorded in the audit trail.
- A deal may move backward when real-world events require it.
- A passed or dead deal may be revived.
- Under-contract deals must surface deadlines prominently.
- Ownership stages must not erase acquisition history.
- Sold deals remain available for portfolio and lessons-learned analysis.

---

## 3.12 Decision Model

A deal decision must be a structured record, not only a label.

Supported decisions include:

- Research First
- Call First
- Visit
- Monitor
- Pursue
- Pursue With Conditions
- Negotiate
- Prepare Offer
- Submit Offer
- Hold
- Improve
- Refinance
- Sell
- Pass
- Dead
- Insufficient Information

Every decision record must include:

- Decision ID
- Deal ID
- decision type
- decision date
- actor
- recommendation source
- confidence
- risk level
- supporting evidence
- opposing evidence
- material assumptions
- strongest strategy
- selected strategy
- next action
- user override status
- notes

### Decision Versioning

Each material recommendation change must preserve:

- prior recommendation
- new recommendation
- prior confidence
- new confidence
- triggering evidence
- calculation version
- strategy version
- user who approved or overrode it

A current decision may replace the prior decision as the active state, but it must never erase the prior decision history.

---

## 3.13 Assumption Model

Assumptions are necessary, but they must be explicit.

Every assumption must include:

- Assumption ID
- Deal ID
- category
- value
- unit
- range where applicable
- source or basis
- created by
- created date
- last modified date
- confidence
- active status
- effect on calculations

Examples include:

- market rent
- vacancy
- repairs
- capital expenditures
- management fee
- insurance
- taxes after sale
- financing rate
- financing term
- closing costs
- sale costs
- hold period
- appreciation
- rent growth
- expense growth
- exit cap rate

### Assumption Overrides

User overrides must preserve:

- previous value
- new value
- reason
- user
- timestamp
- affected outputs

---

## 3.14 Task and Deadline Model

Tasks and deadlines must attach to the deal and may attach to contracts, offers, inspections, financing, or other entities.

Each task must include:

- Task ID
- Deal ID
- title
- description
- owner
- due date
- status
- priority
- related entity
- source
- completion evidence

Deadline types may include:

- inspection contingency
- attorney review
- financing contingency
- appraisal contingency
- title objection
- earnest money due
- association document review
- survey due
- environmental review
- closing date
- option expiration
- lender lock expiration

Missed or approaching deadlines must be visible, but notifications must not imply legal advice.

---

## 3.15 Multi-Asset and Portfolio Deals

BRIX must support grouped acquisitions without breaking the one-deal principle.

A portfolio or package deal may contain multiple linked properties under one parent deal.

Requirements:

- each property retains its own Property ID
- each property may have property-level underwriting
- the parent deal may have consolidated underwriting
- shared financing must be modeled once and allocated transparently
- shared expenses must be allocated by an explicit method
- property-level and portfolio-level decisions must remain distinguishable
- removing one property from the package must not corrupt the remaining deal

---

## 3.16 Permissions and Data Isolation

Every PDRM record must belong to a user, workspace, or organization boundary.

Access must be role-based and enforced server-side.

Possible roles include:

- owner
- administrator
- editor
- analyst
- contributor
- viewer
- external professional

Permissions may vary by:

- deal
- document
- report
- portfolio
- workspace

External professionals should receive only the access necessary for their role.

One user's private deal data must never be visible to another user without explicit authorization.

---

## 3.17 Audit and Version History

Material changes must be auditable.

The audit record should preserve:

- actor
- action
- entity type
- entity ID
- timestamp
- previous value
- new value
- source client
- reason where applicable
- correlation or request ID

Audit history must exist for:

- lifecycle changes
- decision changes
- assumption changes
- financial input changes
- user overrides
- document replacement
- evidence classification changes
- permission changes
- account-level administrative actions

Audit logs must not expose secrets or sensitive authentication data.

---

## 3.18 Web and Native iOS Consistency

Web, iPhone, and iPad must use the same PDRM contracts.

They must share:

- Deal ID semantics
- Property ID semantics
- lifecycle states
- decision types
- evidence classifications
- relationship types
- task statuses
- event types
- audit rules

The clients may present information differently, but they must not invent competing meanings or local-only business states.

Offline mobile drafts may exist where intentionally designed, but they must reconcile into the canonical deal through explicit sync rules.

---

## 3.19 AI Boundaries Within the PDRM Core

AI may:

- classify evidence
- extract structured data
- summarize timelines
- identify possible conflicts
- suggest relationships
- suggest missing information
- draft decision explanations
- recommend follow-up questions

AI may not:

- silently merge properties
- silently merge deals
- delete evidence
- overwrite confirmed facts
- change lifecycle state without an authorized action
- create authoritative financial results
- create legal conclusions
- change permissions
- fabricate relationships

All AI-created structured data must include source references and confidence.

---

## 3.20 Error Handling and Recovery

The PDRM Core must preserve user work during failures.

If a save, upload, sync, extraction, or event-processing step fails, BRIX must:

1. show the failure clearly
2. preserve local or pending work where possible
3. provide retry behavior
4. avoid duplicate records
5. avoid false success messages
6. record enough information for support and diagnosis

A failed downstream analysis must not delete the evidence that triggered it.

---

## 3.21 Performance Requirements

The PDRM Core must remain responsive as a deal grows over time.

Requirements include:

- paginated timelines
- lazy loading for large evidence sets
- indexed Deal ID and Property ID relationships
- efficient filtering
- background processing for heavy extraction
- resumable uploads where practical
- deterministic cache invalidation
- no full-deal reload for every minor action

The cockpit must load the current decision and key deal state before lower-priority historical detail.

---

## 3.22 Testing Requirements

The PDRM Core must include tests for:

- property duplicate detection
- deal creation
- deal reopening
- lifecycle transitions
- invalid lifecycle transitions
- evidence attachment
- evidence conflict handling
- decision versioning
- assumption overrides
- relationship creation
- permission enforcement
- event idempotency
- retry handling
- multi-asset deal behavior
- web and iOS contract consistency
- audit-log creation

Tests must prove that one user's data cannot be accessed by another unauthorized user.

---

## 3.23 Definition of Complete

The PDRM Core is complete only when a user can:

1. Create or import a property opportunity.
2. Receive one durable Property ID and Deal ID.
3. Add people, organizations, documents, photos, notes, emails, and voice notes.
4. See those items connected to the correct deal.
5. Move the deal through lifecycle states.
6. Create tasks and deadlines.
7. Add and revise assumptions without losing history.
8. Receive updated recommendations as evidence changes.
9. Review the complete timeline and decision history.
10. Reopen the deal later with all context intact.
11. Access the same canonical deal from web, iPhone, and iPad.
12. Recover from expected failures without losing work.

---

## 3.24 Non-Negotiable Rules

1. One property identity per real-world property.
2. One canonical Deal ID per opportunity lifecycle.
3. No subsystem may create an isolated deal copy.
4. Original evidence must be preserved.
5. Material changes must be auditable.
6. Decisions must be versioned and explainable.
7. Assumptions must be visible.
8. Relationships must be structured.
9. Web and iOS must share the same deal semantics.
10. AI may assist the PDRM Core but may not control its truth.

---

## 3.25 Section Completion Rule

This section is complete and governing.

Later sections may define detailed database schemas, APIs, engine contracts, UX patterns, and module-specific workflows, but they must conform to the PDRM Core established here.
