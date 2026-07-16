# Section 4 — Canonical Data Model and Data Contracts

## Authority

This section is part of the governing BRIX Product Constitution and Engineering Standard. It defines the authoritative entities, ownership rules, identifiers, relationships, classifications, versioning rules, persistence standards, and cross-client data contracts for BRIX.

No web client, native iOS client, backend service, report generator, AI workflow, import process, or administrative tool may create a competing model of deal truth.

If implementation behavior conflicts with this section, this section controls until formally amended.

---

## 4.1 Purpose

The BRIX data model exists to preserve one coherent investment record from first discovery through exit.

It must support:

- residential, multifamily, commercial, mixed-use, land, development, and specialty real estate
- one-property and multi-property opportunities
- simple and complex ownership structures
- multiple financing layers
- multiple strategies evaluated against the same property
- repeated underwriting as new evidence arrives
- offers, contracts, inspections, appraisals, governance documents, voice notes, photos, emails, tasks, deadlines, and reports
- beginner and professional presentation modes without changing underlying truth
- responsive web and fully native iPhone and iPad clients
- strong tenant isolation, auditability, exportability, and defensibility

The model must remain flexible enough to support sophisticated deals without forcing every user to complete institutional-level data entry for a simple property.

---

## 4.2 Canonical Hierarchy

The authoritative hierarchy is:

```text
Account
  → Workspace
    → Portfolio
      → Deal
        → Property
          → Parcel
          → Building
          → Unit or Space
        → Strategy Scenario
        → Underwriting Version
        → Financing Structure
        → Evidence
        → Relationship
        → Activity
        → Decision
        → Offer
        → Contract
        → Inspection
        → Appraisal
        → Governance Record
        → Task and Deadline
        → Report and Export
```

Not every deal requires every level.

The hierarchy is extensible, but no new top-level business entity may be introduced when an existing canonical entity can properly own the information.

---

## 4.3 Identity Standards

Every persistent entity must use an immutable globally unique identifier.

Required rules:

- use UUIDs or another collision-resistant globally unique identifier approved by the architecture standard
- never use an address, parcel number, email address, listing ID, or external provider ID as the primary key
- external IDs must be stored as source-linked identifiers
- IDs must never be reused after deletion
- IDs must remain stable across web, iOS, reports, exports, synchronization, imports, and integrations
- human-readable labels may change without changing canonical identity

Every record must include, where applicable:

- `id`
- `workspace_id`
- `deal_id`
- `created_at`
- `created_by`
- `updated_at`
- `updated_by`
- `version`
- `status`
- `source_type`
- `source_id`
- `effective_at`
- `archived_at`
- `deleted_at`

Soft deletion is preferred for material business records. Permanent deletion must follow the account-deletion, retention, privacy, and audit requirements defined elsewhere in this constitution.

---

## 4.4 Account and Workspace

### Account

An Account represents an authenticated user identity.

It owns:

- authentication identity
- profile
- preferences
- presentation mode
- notification settings
- subscription and billing relationship
- consent and policy acknowledgments
- security events
- account lifecycle

Authentication data and application profile data must remain logically separated.

### Workspace

A Workspace is the primary authorization boundary for application data.

A workspace may represent:

- an individual investor
- a household
- an investment company
- a partnership
- a fund
- a team
- an advisory organization

Every deal must belong to exactly one workspace.

Workspace membership must include:

- member ID
- account ID
- role
- status
- invitation state
- permissions
- joined date
- removed date

Default roles should include:

- Owner
- Administrator
- Investment Manager
- Analyst
- Contributor
- Viewer

Permissions must be enforced in the backend and database, not only hidden in the interface.

---

## 4.5 Portfolio

A Portfolio groups deals and owned assets for comparison, reporting, planning, and performance analysis.

A portfolio may represent:

- all opportunities
- an acquisition pipeline
- a geographic market
- an entity-owned collection
- a strategy-specific collection
- an active ownership portfolio
- a watchlist
- a visit list
- a disposition group

A deal may belong to multiple user-defined collections, but it must have one primary workspace and one canonical identity.

Portfolio membership must not duplicate the deal record.

---

## 4.6 Canonical Deal

The Deal is the central business entity in BRIX.

A Deal represents the investor's complete relationship with one opportunity or one intentionally grouped acquisition.

Required deal fields include:

- Deal ID
- workspace ID
- display name
- primary property ID
- deal type
- acquisition type
- lifecycle stage
- decision status
- selected strategy ID
- strongest strategy ID
- lead source
- listing URL
- asking price
- target price
- current maximum offer
- priority
- assigned users
- next action
- next action due date
- current recommendation ID
- current underwriting version ID
- current confidence summary
- current risk summary
- created date
- archived date

A Deal must own or reference all related:

- properties
- parcels
- buildings
- units or spaces
- contacts and organizations
- evidence
- strategies
- underwriting versions
- financing structures
- offers
- contracts
- inspections
- appraisals
- governance records
- tasks
- deadlines
- communications
- activities
- recommendations
- decisions
- reports

No subsystem may create a shadow deal, duplicate deal model, or isolated analysis record that cannot be traced back to the canonical Deal ID.

---

## 4.7 Property, Parcel, Building, and Unit

### Property

A Property represents the real-world asset or location being evaluated.

Required property concepts include:

- normalized address
- original source address
- geographic coordinates
- jurisdiction
- property type
- subtype
- current use
- proposed use
- occupancy status
- year built
- gross building area
- rentable area
- lot size
- bedroom and bathroom counts where applicable
- parking
- utilities
- zoning summary
- tax jurisdiction
- association status
- flood, environmental, and hazard indicators

### Parcel

A Parcel represents a legally recognized tax or land parcel.

A property may contain one or many parcels.

Parcel fields may include:

- assessor parcel number
- legal description
- acreage
- tax jurisdiction
- assessed value
- tax amount
- ownership record
- deed reference
- zoning
- land-use code
- recorded restrictions

Parcel identifiers must be stored with jurisdiction and source metadata because formats are not globally unique.

### Building

A Building represents a physical improvement located on one or more parcels.

Building fields may include:

- building type
- construction type
- year built
- renovation year
- stories
- gross area
- rentable area
- occupancy
- roof
- HVAC
- electrical
- plumbing
- fire protection
- elevators
- accessibility
- condition summary

### Unit or Space

A Unit or Space represents a leasable, rentable, sellable, or operational subdivision.

It may represent:

- apartment unit
- condominium unit
- office suite
- retail bay
- industrial suite
- storage unit
- hotel room
- mobile-home pad
- RV pad
- parking space

The model must support unit-level rent, occupancy, lease, expense, condition, and renovation data without requiring unit-level detail when aggregate analysis is sufficient.

---

## 4.8 Property Identity and Duplicate Resolution

Property identity must not rely on a single address string.

Duplicate detection should consider:

- normalized address
- latitude and longitude
- parcel number and jurisdiction
- legal description
- listing IDs
- source URLs
- building footprint
- ownership record
- user confirmation

Potential duplicates must be flagged for review.

The system must not silently merge records when there is material uncertainty.

When records are merged:

- one canonical property survives
- all relationships are repointed
- source identifiers are preserved
- conflicting values remain visible
- merge history is audited
- the operation must be reversible by an authorized administrator when technically feasible

---

## 4.9 Strategy Scenario

A Strategy Scenario represents one specific investment strategy applied to one deal using one defined assumption set.

Examples include:

- long-term rental
- medium-term rental
- short-term rental
- house hack
- BRRRR
- fix and flip
- live-in flip
- value-add multifamily
- commercial hold
- commercial repositioning
- land development
- land banking
- build-to-rent
- adaptive reuse
- seller financing
- lease option
- subject-to where lawful
- ground lease
- refinance
- disposition

Required strategy fields include:

- strategy ID
- canonical strategy key
- strategy engine version
- compatibility state
- compatibility reasons
- disqualifiers
- selected status
- rank
- risk level
- confidence level
- capital requirement
- target return metrics
- execution complexity
- time horizon
- current result ID

A strategy scenario must reference an underwriting version. It must not copy or independently own financial truth.

---

## 4.10 Underwriting Version

An Underwriting Version is an immutable snapshot of the assumptions, evidence references, formulas, engine versions, and outputs used at a specific time.

Required fields include:

- underwriting version ID
- deal ID
- strategy scenario ID
- parent version ID
- version number
- status
- as-of date
- engine version
- assumption set version
- source set version
- created by
- reason for recalculation
- recommendation before
- recommendation after

Each version must preserve:

- purchase assumptions
- income assumptions
- expense assumptions
- renovation assumptions
- financing assumptions
- sale or refinance assumptions
- tax assumptions where modeled
- reserves
- timing assumptions
- deterministic outputs
- sensitivity outputs
- confidence inputs
- unresolved conflicts

Current results may point to the latest approved version, but earlier versions must remain reproducible.

---

## 4.11 Assumption Record

Every material assumption must be a first-class record or a versioned component of an underwriting snapshot.

An assumption must include:

- assumption key
- value
- unit
- classification
- source
- effective date
- confidence
- user override status
- rationale
- related evidence
- created by
- superseded by

BRIX must distinguish:

- confirmed fact
- user-entered fact
- external estimate
- system estimate
- user assumption
- AI observation
- professional opinion
- inferred information
- unknown
- conflict

Assumptions must never be silently changed by AI or by a background refresh.

---

## 4.12 Financing Structure

A Financing Structure represents the complete capital stack for acquisition, renovation, operation, refinance, or disposition.

It must support:

- cash purchase
- conventional loan
- commercial mortgage
- bridge loan
- hard-money loan
- construction loan
- renovation loan
- seller financing
- assumption
- subject-to where lawful
- private debt
- mezzanine debt
- preferred equity
- partner equity
- grants, incentives, or credits
- multiple simultaneous debt layers

Each financing layer must support:

- lender or counterparty
- principal
- interest rate
- fixed or variable structure
- index and spread
- amortization
- term
- interest-only period
- payment frequency
- balloon date
- points
- lender fees
- reserves
- recourse
- guarantees
- covenants
- DSCR requirements
- LTV or LTC limits
- prepayment terms
- extension options
- conditions precedent
- maturity

Financing records must feed the deterministic underwriting engine. AI may extract or explain terms but may not calculate authoritative debt service independently.

---

## 4.13 Evidence Record

Evidence is a first-class entity.

An Evidence Record may represent:

- PDF
- Word document
- spreadsheet
- image
- video
- voice note
- transcript
- email body
- email attachment
- contract
- inspection report
- appraisal
- survey
- title record
- deed
- tax record
- county record
- zoning record
- permit
- contractor estimate
- insurance quote
- lender term sheet
- governance document
- user note
- external data response

Required evidence fields include:

- evidence ID
- deal ID
- property ID where applicable
- evidence type
- title
- file reference
- MIME type
- file size
- source classification
- source organization
- source URL
- received date
- effective date
- uploaded by
- checksum
- extraction status
- verification status
- confidence
- retention status
- sensitivity classification

Original evidence must be preserved.

AI extraction results, summaries, and findings must be stored separately from the original file and must reference the exact evidence record that produced them.

---

## 4.14 Finding and Observation

A Finding is a structured interpretation derived from evidence.

Examples include:

- roof appears aged
- contract contains a financing contingency
- HOA prohibits rentals under 12 months
- appraisal value is below contract price
- inspection identifies active water intrusion
- lender requires a replacement reserve

A finding must include:

- finding ID
- evidence ID
- deal ID
- finding type
- location reference, page, section, image, or timestamp
- extracted text or observation
- severity
- confidence
- review status
- decision impact
- recommended verification
- reviewer

Findings must not overwrite source facts.

AI findings must remain clearly labeled as AI observations until confirmed by the user or a qualified professional.

---

## 4.15 Relationship and Participant Model

BRIX must support both people and organizations.

### Person

Examples:

- buyer
- seller
- realtor
- broker
- attorney
- lender representative
- inspector
- appraiser
- contractor
- insurance professional
- property manager
- tenant
- partner
- investor

### Organization

Examples:

- LLC
- corporation
- partnership
- brokerage
- law firm
- lender
- title company
- inspection company
- contractor
- HOA
- COA
- POA
- municipality
- county
- property-management company

A Deal Relationship links a person or organization to a deal with:

- role
- start date
- end date
- primary contact status
- authority level
- ownership percentage where applicable
- communication preference
- notes
- related documents

The same person or organization may hold multiple roles.

---

## 4.16 Communication and Activity

Communications and activities must be connected to the deal timeline.

Supported activity types include:

- call
- email
- text note
- meeting
- property visit
- showing
- document request
- document receipt
- upload
- calculation
- status change
- recommendation change
- offer action
- contract action
- inspection action
- appraisal action
- financing action
- closing action

Each activity must include:

- actor
- timestamp
- activity type
- summary
- related entity
- source
- visibility
- attachments
- follow-up requirement

System-generated activity must be distinguishable from user-generated activity.

---

## 4.17 Task and Deadline

Tasks and deadlines must be separate but related concepts.

A Task represents work to be completed.

A Deadline represents a time-sensitive contractual, financing, due-diligence, or operational requirement.

Required fields may include:

- title
- description
- owner
- status
- priority
- due date
- source
- related contract clause
- related evidence
- reminder schedule
- completion evidence
- escalation state

Contract-derived deadlines must retain the clause or document reference that created them.

The system must not silently change contractual dates.

---

## 4.18 Offer

An Offer represents a proposed acquisition, sale, lease, financing, or other transaction position.

Required concepts include:

- offer type
- buyer or seller perspective
- price
- earnest money
- financing terms
- closing date
- possession
- contingencies
- inspection period
- appraisal terms
- financing deadline
- credits
- repairs
- personal property
- expiration
- counteroffer chain
- status
- approval

Every offer revision must be versioned.

OfferIQ may generate recommended terms and documents, but the accepted authoritative offer terms must be explicit user-approved records.

---

## 4.19 Contract

A Contract represents an executed, proposed, or reviewed legal instrument.

Contract records must include:

- contract type
- parties
- buyer or seller perspective
- governing jurisdiction
- effective date
- execution status
- amendment relationships
- termination status
- material dates
- payment obligations
- contingencies
- default provisions
- assignment rights
- financing terms
- due-diligence terms
- closing requirements
- unresolved questions

Contract extraction and analysis must preserve the original document, page references, clause references, confidence, and verification status.

BRIX may provide issue spotting, summaries, questions, and suggested edits, but it must not present AI output as legal advice or as a substitute for licensed counsel.

---

## 4.20 Inspection and Appraisal

### Inspection

An Inspection record may contain:

- inspection type
- inspector
- date
- property area
- finding
- severity
- estimated cost
- life-safety relevance
- insurance relevance
- lender relevance
- repair status
- supporting images

### Appraisal

An Appraisal record may contain:

- appraiser
- effective date
- report date
- purpose
- value conclusion
- property rights appraised
- approaches used
- comparable data
- conditions
- assumptions
- required repairs
- stabilization assumptions
- reconciliation

Inspection and appraisal inputs must trigger controlled re-underwriting rather than direct uncontrolled edits to financial truth.

---

## 4.21 Governance Record

A Governance Record represents an HOA, COA, POA, cooperative, master association, ground-lease, special district, or similar governing relationship.

It must support:

- organization identity
- governing documents
- declarations
- bylaws
- rules and regulations
- budgets
- reserves
- assessments
- litigation
- insurance
- rental restrictions
- leasing caps
- pet rules
- parking rules
- architectural restrictions
- commercial-use restrictions
- transfer fees
- right of first refusal
- approval requirements

Governance restrictions must connect to strategy compatibility and risk analysis.

---

## 4.22 Recommendation and Decision

A Recommendation is BRIX's current evidence-based conclusion.

A Decision is the investor's recorded action or judgment.

They must remain separate.

A recommendation must include:

- recommendation type
- as-of date
- strongest strategy
- selected strategy result
- confidence
- risk
- supporting reasons
- opposing reasons
- assumptions
- missing information
- next action
- engine version

A decision must include:

- decision type
- user
- date
- rationale
- accepted or overridden recommendation
- conditions
- follow-up

The system must preserve recommendation history and decision history independently.

---

## 4.23 Report and Export

Reports and exports are views of canonical data, not separate sources of truth.

Every generated report must record:

- report ID
- deal or portfolio scope
- template version
- generated date
- generated by
- underwriting version
- recommendation version
- source set
- file reference

Reports must not recalculate using independent formulas.

PDF, Word, spreadsheet, CSV, and shareable summaries must use the same canonical outputs as web and iOS.

---

## 4.24 Data Contracts

All clients and services must use versioned data contracts.

Required principles:

- schemas are explicit
- required and optional fields are documented
- enums use stable canonical keys
- unknown enum values fail safely
- units are explicit
- money includes currency
- percentages are represented consistently
- dates and times use unambiguous standards
- time zones are preserved where relevant
- null, zero, unavailable, and not applicable are distinct
- API changes are backward compatible or versioned

The backend owns business rules and authoritative calculations.

Clients own presentation, local interaction, and temporary drafts, but not competing business logic.

---

## 4.25 Data Isolation and Row-Level Security

Every private business record must be scoped to a workspace.

Required controls include:

- row-level security or equivalent backend enforcement
- no client-supplied workspace trust without verification
- ownership checks on every read and write
- storage-path isolation
- signed access to private files
- no service-role credentials in clients
- admin access audited and limited
- cross-workspace sharing explicit and revocable

Tests must prove that one user cannot read, modify, infer, or enumerate another workspace's deals.

---

## 4.26 Versioning and Immutability

Material records must be versioned or historically preserved.

This includes:

- underwriting
- assumptions
- recommendations
- offers
- contracts and amendments
- financing terms
- evidence findings
- strategy rankings
- user overrides

Mutable convenience fields may update in place, but the system must preserve history when a change could affect a decision, calculation, legal position, or audit trail.

---

## 4.27 Event Generation

Material changes must emit a domain event.

Examples:

- deal created
- property matched
- evidence uploaded
- evidence processed
- assumption changed
- underwriting completed
- strategy ranking changed
- recommendation changed
- offer submitted
- contract executed
- deadline created
- inspection added
- appraisal added
- financing updated
- deal archived

Events must include:

- event ID
- event type
- entity type
- entity ID
- deal ID
- workspace ID
- actor
- timestamp
- correlation ID
- idempotency key where applicable
- before and after references where appropriate

Consumers must be idempotent.

---

## 4.28 Web and Native iOS Consistency

Web, iPhone, and iPad must use the same canonical entity meanings.

They may differ in layout and interaction design, but not in:

- Deal ID
- lifecycle state
- strategy key
- underwriting output
- evidence classification
- recommendation meaning
- task status
- contract deadline
- financing term
- confidence definition
- risk definition

Offline iOS drafts must use temporary local IDs and reconcile safely to canonical server IDs.

Conflict resolution must preserve both user work and server history.

---

## 4.29 AI Boundaries

AI may:

- extract structured data
- propose classifications
- identify likely duplicates
- summarize evidence
- create findings
- generate questions
- explain relationships
- recommend verification

AI may not:

- create authoritative financial outputs
- silently merge properties
- silently replace user facts
- silently change legal terms
- silently approve findings
- fabricate missing evidence
- bypass authorization

Every AI-created record must preserve model metadata, prompt or workflow version, source references, timestamp, and confidence where applicable.

---

## 4.30 Error Handling and Recovery

Data operations must be resilient.

Required behavior includes:

- idempotent imports and uploads
- transactional writes for logically atomic operations
- retry-safe background jobs
- resumable uploads where practical
- visible processing states
- failed-record quarantine
- manual correction paths
- audit logging
- no false success messages

A partial failure must not leave a deal in an unknowable state.

---

## 4.31 Performance and Indexing

The model must support responsive use as data volume grows.

Required considerations include:

- indexes on workspace, deal, property, status, timestamps, source IDs, and common lookup keys
- pagination for large collections
- bounded timeline queries
- summary tables or materialized views only when canonical derivation remains clear
- background processing for heavy extraction and analysis
- no full-table client downloads
- no N+1 query patterns in critical workflows

Performance optimization must not create a second source of truth.

---

## 4.32 Migration Standards

Schema migrations must be:

- version controlled
- reversible where practical
- tested against representative data
- safe for existing users
- compatible with web and iOS release timing
- free of destructive assumptions

Breaking migrations require an explicit rollout and rollback plan.

Production data must never be rewritten by ad hoc client behavior.

---

## 4.33 Testing Requirements

The canonical data model is complete only when tests cover:

- workspace isolation
- property duplicate detection
- deal creation
- multi-property deals
- parcel relationships
- building and unit relationships
- assumption versioning
- underwriting versioning
- evidence ingestion
- AI finding separation
- financing layers
- offer revision chains
- contract amendments
- task and deadline generation
- recommendation history
- investor overrides
- report source consistency
- event idempotency
- iOS offline reconciliation
- deletion and archival behavior

Tests must use realistic residential, multifamily, commercial, land, and mixed-use fixtures.

---

## 4.34 Definition of Complete

This section is implemented only when:

1. Every core entity has an explicit schema and stable identifier.
2. Every record is scoped to the correct workspace.
3. Every material fact can be traced to source, classification, date, and history.
4. Underwriting versions are reproducible.
5. Strategy scenarios reference canonical underwriting rather than duplicate it.
6. Evidence and AI findings remain distinct.
7. Relationships, activities, tasks, deadlines, offers, contracts, inspections, appraisals, governance records, and financing all attach to the canonical deal.
8. Web, iPhone, iPad, reports, and exports use the same data meanings.
9. Row-level security and authorization tests pass.
10. Migration, rollback, and audit requirements are documented and tested.
11. No subsystem maintains a shadow source of deal or financial truth.

---

## 4.35 Permanent Data Laws

1. One workspace owns the deal.
2. One canonical Deal ID connects the opportunity.
3. One canonical Property ID represents the real-world asset.
4. Every material value has a source and classification.
5. Every material change preserves history.
6. Every calculation references a versioned assumption set.
7. Every AI output references its evidence.
8. Every client uses the same canonical meanings.
9. Every private record is authorization-protected.
10. Reports and exports reflect canonical truth; they do not create it.

This section is complete and governing. Later sections may extend individual entities and workflows but may not create competing data ownership, identity, or calculation rules without a formal constitutional amendment.
