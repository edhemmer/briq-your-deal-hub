# BRIX Amendment 001 - FindIQ Architecture

## Platform Positioning

BRIX Real Estate is an AI-powered acquisition intelligence platform.

Tagline: **Chaos to Clarity**

BRIX is not a listing website. BRIX transforms fragmented property data, market noise, listings, spreadsheets, and opinions into actionable acquisition intelligence.

Every feature should improve acquisition decision-making.

## Core Modules

### FindIQ

Discovery Intelligence Engine.

FindIQ answers: **What should I investigate?**

Responsibilities:

- Opportunity discovery
- Opportunity ranking
- Market monitoring
- Opportunity alerts

FindIQ discovers and ranks opportunities but does not perform full underwriting. When a user selects a property, it should transfer into DealIQ.

### DealIQ

Acquisition Intelligence Engine.

DealIQ answers: **Should I acquire it?**

Responsibilities:

- Financial analysis
- Rental analysis
- Resale analysis
- Renovation analysis
- Risk analysis
- Market analysis
- Offer recommendations
- AI-powered acquisition memos

### PipelineIQ

PipelineIQ answers: **Where is it in the process?**

Tracks opportunities from discovery through closing.

### OfferIQ

OfferIQ answers: **How do I pursue it?**

Generates acquisition documents and communications using DealIQ data.

### PortfolioIQ

PortfolioIQ answers: **How is it performing?**

Tracks acquired assets, equity, cash flow, valuation, and performance.

## Acquisition Profiles

Acquisition Profiles are the primary object inside BRIX. Properties are evaluated against Acquisition Profiles before they become DealIQ records.

Example profile: **Ed & Paula Illinois**

- Budget: $200k-$270k
- Markets: Plano, Montgomery, Sugar Grove, Sycamore, Sandwich, Yorkville, West Aurora, Big Rock, DeKalb, Cortland, Elburn
- Property type: Single Family
- 3+ bedrooms
- 1.5+ bathrooms
- Garage required
- Taxes preferred under $6k
- Future rental potential required
- Future resale potential required
- Cosmetic value-add preferred

## Workflow

1. User creates Acquisition Profile.
2. FindIQ searches connected data providers.
3. FindIQ ranks opportunities using an Opportunity Score.
4. User selects a property.
5. Property automatically becomes a DealIQ record.
6. DealIQ performs underwriting.
7. AI Acquisition Memo is generated.
8. User moves property into PipelineIQ.

## Architecture Rule

Use provider-based architecture.

No direct dependence on Zillow, Redfin, Realtor, or any single vendor.

Supported adapter targets:

- RentCast
- ATTOM
- MLS feeds
- County Records
- Census
- Future providers

Build architecture first. Build integrations second.

## FindIQ Product Corpus v1.0

FindIQ is the discovery engine of BRIX. It helps users identify opportunities that deserve deeper analysis.

FindIQ does not determine whether a property should be acquired. FindIQ determines whether a property should be investigated. Full underwriting belongs to DealIQ.

User goal: reduce the time required to identify high-potential opportunities by centralizing discovery across fragmented sources.

Opportunity sources:

- Active Listings
- Coming Soon Listings
- Price Reductions
- Back On Market Listings
- Expired Listings
- Withdrawn Listings
- Cancelled Listings
- Estate Opportunities
- Probate Opportunities
- Pre-Foreclosure Opportunities
- Tax Delinquency Opportunities
- Off-Market Opportunities
- Future Provider Sources

Every property displayed in FindIQ should appear as an Opportunity Card with:

- Property photo
- Address
- City
- State
- Price
- Beds
- Baths
- Square feet
- Lot size
- Property type
- Days on market
- Opportunity Score

Opportunity Score ranks opportunities for review. It is not a purchase recommendation. Factors may include:

- Acquisition Profile Match
- Equity Potential
- Rental Potential
- Resale Potential
- Market Liquidity
- Opportunity Type
- Value Add Potential
- Days On Market

Users can:

- View Property
- Save Property
- Hide Property
- Compare Property
- Add Notes
- Send To DealIQ

The primary action is: **Analyze in DealIQ**.

When selected:

1. Create DealIQ record.
2. Transfer all available property data.
3. Open DealIQ analysis workflow.

No duplicate data entry.

FindIQ should feel fast, professional, data rich, investor focused, and mobile friendly. It should feel like an acquisition workspace, not a home shopping website.
