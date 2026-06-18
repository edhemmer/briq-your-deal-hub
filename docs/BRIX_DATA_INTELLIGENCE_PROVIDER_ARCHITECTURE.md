# BRIX Data Intelligence & Provider Architecture Corpus v1.0

## Purpose

BRIX is a data-driven intelligence platform.

Data powers discovery, underwriting, workflows, transactions, and portfolio management. The platform must be designed so data providers can be added, removed, upgraded, or replaced without redesigning BRIX.

## Core Principle

BRIX modules must never communicate directly with external providers. All providers must connect through a Provider Adapter Layer.

Architecture:

Provider -> Adapter -> Normalization Layer -> BRIX Intelligence Engine -> FindIQ / DealIQ / PipelineIQ / OfferIQ / PortfolioIQ

This ensures vendor independence and future scalability.

## Data Categories

### Property Data

Property characteristics and ownership:

- Address
- Parcel ID
- Ownership
- Property Type
- Square Footage
- Year Built
- Lot Size

### Listing Data

Market listing information:

- Listing Price
- Listing Status
- Days On Market
- Price Changes
- Listing History

### Rental Data

Rental intelligence:

- Rent Estimates
- Rental Comps
- Vacancy Indicators
- Rental Demand

### Market Data

Market-level intelligence:

- Inventory
- Appreciation
- Absorption
- Population Growth
- Employment Trends

### Risk Data

Risk evaluation:

- Flood Risk
- Crime Risk
- Insurance Risk
- Natural Disaster Risk

### Financial Data

Acquisition and ownership economics:

- Taxes
- HOA
- Insurance
- Financing Inputs
- Operating Expenses

## Provider Architecture

Every provider must implement a standard adapter. Provider adapters should normalize incoming data into BRIX data models. BRIX should never depend on vendor-specific schemas.

Example providers:

- Property Providers: ATTOM, RentCast, MLS Providers, County Records
- Rental Providers: RentCast, Future Providers
- Market Providers: Census, BLS, Economic Data Sources
- Risk Providers: FEMA, Insurance Providers, Crime Data Providers

## Provider Priority

### Phase 1

Primary provider: **RentCast**

Reason:

- Property Data
- Rental Data
- Valuation Data
- Market Data

Single provider delivers significant MVP functionality.

### Phase 2

Provider: **ATTOM**

Expands:

- Ownership
- Property History
- Foreclosures
- Additional Market Intelligence

### Phase 3

Provider: **Authorized MLS Integrations**

Authorized MLS integrations only. No scraping.

## Data Normalization

Every provider response must be converted into BRIX-standard objects:

- Property
- Listing
- Opportunity
- Rental Estimate
- Market Snapshot
- Risk Assessment
- Asset

This allows BRIX intelligence engines to remain provider-independent.

## Data Quality Rules

All data should include:

- Source
- Retrieval Date
- Confidence Level
- Last Updated
- Data Type

Users should always know where information originated.

## Confidence Framework

BRIX must distinguish:

- Verified: provider-sourced factual data
- Estimated: calculated values such as rent estimates, ARV, and valuations
- AI Generated: analysis and recommendations, never presented as facts

## Data Refresh Strategy

- Listing Data: near real-time when possible
- Property Data: periodic refresh
- Market Data: scheduled refresh
- Portfolio Data: user-configurable refresh intervals

## Data Ownership

User-created data belongs to the user:

- Notes
- Acquisition Profiles
- Underwriting Assumptions
- Offer Strategies
- Portfolio Records

Provider data remains provider data.

## Architecture Rule

No BRIX module should know:

- Which provider supplied data
- How the provider structures data
- Vendor-specific implementation details

All modules consume normalized BRIX objects only.

## Success Metric

The data layer succeeds when providers can be replaced, expanded, or upgraded without requiring changes to FindIQ, DealIQ, PipelineIQ, OfferIQ, or PortfolioIQ.

This ensures BRIX remains scalable, maintainable, and vendor-independent.
