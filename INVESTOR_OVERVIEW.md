# BRIX Real Estate Investor Overview

**Classification:** Confidential  
**Product:** BRIX Real Estate  
**Positioning:** AI-powered acquisition intelligence and real estate operating system

## Summary

BRIX helps investors move from fragmented property data to explainable acquisition and portfolio decisions. The platform is designed around trust, verification, capital preservation, and repeatable execution.

BRIX is not a listing portal and not a prototype presentation layer. It is a live operating system connected to BRIX-owned backend services.

## Product Thesis

Real estate investors do not only need calculators. They need a decision environment that can:

- Find opportunities
- Normalize property facts
- Identify missing data
- Analyze multiple strategies
- Stress test assumptions
- Compare deals
- Generate offer and transaction actions
- Track outcomes after close or pass
- Improve future decisions from prior results

## Core Modules

| Module | Role |
| --- | --- |
| **FindIQ** | Source, import, rank, and queue opportunities |
| **DealIQ** | Underwrite acquisition decisions with risks, scenarios, and strategy fit |
| **OfferIQ** | Turn analysis into offer structure and transaction communication |
| **PipelineIQ** | Track opportunities from review through close/pass |
| **PortfolioIQ** | Track owned asset performance, equity, cash flow, and risk |
| **ContractIQ** | Review contract terms, deadlines, risk, and leverage |
| **Reports** | Export decision records and evidence |

## Technology

| Layer | Current Platform |
| --- | --- |
| **Web App** | React, TypeScript, Vite, Tailwind CSS |
| **Native iOS** | SwiftUI |
| **Backend** | Supabase Postgres, Auth, Storage, Edge Functions |
| **Deployment** | Vercel web deployment and BRIX-owned Supabase backend |
| **AI/Data Layer** | Provider-adapter architecture with server-side API keys |

## Current Operating Priorities

1. Production reliability
2. Real user-owned data only
3. No client-facing internal notes
4. No false certainty
5. Strong account, privacy, and deletion controls
6. Provider-ready data architecture
7. Deal workflow continuity across web and iOS

## Decision Quality Standard

Every major recommendation must show:

- Recommendation
- Supporting evidence
- Confidence level
- Key risks
- Missing information
- Alternative strategies
- Bull case
- Bear case
- What must be true
- Failure scenarios
- Next actions

## Infrastructure Ownership

BRIX production services are controlled through:

- Custom domain: `brixrealestate.app`
- Supabase project: `luwaqrkhmxcqsozmilbw`
- GitHub repository: `edhemmer/briq-your-deal-hub`
- Vercel deployment pipeline

## Risk Posture

BRIX is designed to reduce preventable mistakes, not create artificial confidence. Estimates must remain labeled as estimates. Missing or weak data must reduce confidence. Users should be encouraged to verify taxes, insurance, rent support, financing, inspection items, title, and professional review before relying on an investment decision.

## Success Definition

BRIX succeeds when investors can answer:

- What should I investigate?
- Should I acquire it?
- How should I pursue it?
- Where does the opportunity stand?
- How is my portfolio performing?
- What did I learn from the outcome?

The north star remains decision quality.
