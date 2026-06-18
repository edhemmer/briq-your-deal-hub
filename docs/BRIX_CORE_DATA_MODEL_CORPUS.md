# BRIX Core Data Model Corpus v1.0

## Purpose

Define the core tables, entities, relationships, and objects BRIX needs before deeper module development.

This corpus prevents FindIQ, DealIQ, PipelineIQ, OfferIQ, PortfolioIQ, iOS, and provider integrations from inventing separate object models.

## Core Rule

BRIX web, native iOS, backend services, and provider adapters must consume the same core data model.

Business logic belongs in BRIX services and normalized data models, not duplicated inside clients.

## Core Entities

### Organizations

Account-level workspace for users, billing, permissions, and shared data.

Relationships:

- Has many Users
- Has many Acquisition Profiles
- Has many Properties

### Users

Authenticated people using BRIX across web and iOS.

Track:

- Profile
- Role
- Permissions
- Preferences
- Risk tolerance

Relationships:

- Belongs to Organization
- Creates Notes
- Owns Tasks

### Acquisition Profiles

Primary FindIQ object defining what the user wants to acquire.

Track:

- Markets
- Budget
- Property Types
- Bedrooms
- Bathrooms
- Tax Preferences
- Investment Goals
- Hold Strategy

Relationships:

- Belongs to Organization/User
- Has many Opportunities
- Informs DealIQ assumptions

### Opportunities

Discovery-stage property candidates surfaced by FindIQ.

Track:

- Source
- Opportunity Type
- Opportunity Score
- Listing facts
- Profile match
- Missing data
- User actions

Relationships:

- Belongs to Acquisition Profile
- May create Property
- May create DealIQ Record
- Has Provider Records

### Properties

Canonical property identity shared across all modules.

Track:

- Address
- Parcel ID
- Property facts
- Physical data
- Legal/tax data
- Documents
- Photos

Relationships:

- Has Opportunities
- Has DealIQ Records
- Has Pipeline Records
- May become Asset

### DealIQ Records

Acquisition underwriting and recommendation records.

Track:

- Financial analysis
- Rental analysis
- Resale analysis
- Renovation analysis
- Risk analysis
- Recommendation
- Confidence

Relationships:

- Belongs to Property
- Consumes Opportunity
- Creates Offer
- Updates Pipeline Record

### Pipeline Records

Workflow state from discovery through closing or rejection.

Track:

- Stage
- Next action
- Responsible party
- Deadline
- Probability of closing
- Health score

Relationships:

- Belongs to Property
- Has Tasks
- Has Notes
- Receives Offer status
- Creates Asset when Closed

### Offers

Transaction strategy, offer terms, documents, communications, and negotiation history.

Track:

- Offer structure
- Financing type
- Contingencies
- Communication drafts
- Document packages
- Negotiation history

Relationships:

- Belongs to DealIQ Record
- Updates Pipeline Record
- Has Documents
- Has Notes

### Assets

Owned property record after acquisition closes.

Track:

- Current value
- Loan balance
- Equity
- Cash flow
- Performance metrics
- Maintenance
- Document vault

Relationships:

- Created from Closed Pipeline Record
- Belongs to Property
- Has Documents
- Has maintenance Tasks

### Tasks

Action items with owner, due date, priority, status, and module context.

Relationships:

- Assigned to User
- Belongs to Pipeline Record or Asset
- May be automation-generated

### Notes

User or team annotations attached to acquisition or ownership records.

Relationships:

- Created by User
- Attaches to Opportunity, DealIQ Record, Pipeline Record, Offer, Asset, or Property

### Documents

Files, generated documents, scanned items, photos, and supporting evidence.

Track:

- File type
- Source
- Verification status
- Attached entity
- Created by

Relationships:

- Attaches to Property
- Attaches to Offer
- Attaches to Asset
- May support DealIQ analysis

### Provider Records

Normalized provider data with source, retrieval date, confidence, and raw reference.

Relationships:

- Supports Opportunity
- Supports Property
- Supports Asset
- Never consumed directly by UI modules

## Core Relationship Flow

Acquisition Profile -> Opportunity -> Property -> DealIQ Record -> Offer -> Pipeline Record -> Asset

Supporting objects:

- Tasks
- Notes
- Documents
- Provider Records

## Rules

- Property is the canonical identity across modules.
- Acquisition Profiles drive FindIQ opportunity ranking.
- Opportunities become DealIQ records without duplicate data entry.
- Closed PipelineIQ records create PortfolioIQ assets.
- Notes, tasks, documents, and provider records must attach to the relevant core entity.
- Web and iOS consume the same APIs and data model.

## Success Metric

The data model succeeds when BRIX can support discovery, underwriting, transactions, workflow execution, ownership, iOS, and provider integrations without duplicate objects or conflicting records.
