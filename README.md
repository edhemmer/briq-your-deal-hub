# BRIX Real Estate

BRIX is an individual-investor-first Property Deal Relationship Management (PDRM) platform and real estate investment operating system.

The product is designed to carry one canonical Deal from property discovery through intake, underwriting, strategy comparison, market research, financing, governance, visits, offers, contracts, due diligence, closing, ownership, operation, refinance, disposition, and archive.

**Production application:** https://brixrealestate.app

## Product Authority

Engineering and product work is governed by:

1. `AGENTS.md`
2. `docs/00-START-HERE.md`
3. `docs/01-PRODUCT-CONSTITUTION.md`
4. `docs/02-ENGINEERING-STANDARDS.md`
5. `docs/03-DATA-ARCHITECTURE.md`
6. `docs/04-UI-UX-SYSTEM.md`
7. `docs/05-BUILD-ROADMAP.md`
8. `docs/06-SYSTEM-ARCHITECTURE.md`
9. `docs/07-UI-DESIGN-SYSTEM.md`
10. `docs/08-IMPLEMENTATION-ROADMAP.md`
11. `docs/09-APPLE-PLATFORM-COMPLIANCE.md` for Apple work
12. `docs/10-CODEX-MASTER-BUILD-PROMPT.md`
13. `docs/11-DOCUMENT-CONTROL-AND-READINESS-MATRIX.md`
14. `docs/12-INDIVIDUAL-INVESTOR-PRODUCT-REALIGNMENT.md`
15. the current numbered owning specification and its prerequisites

Historical corpuses, audits, recovery plans, training notes, `docs/constitution/**`, competitive snapshots, KPI documents, and provider/migration logs are reference material only unless the current governing package explicitly incorporates them.

## Canonical Product Model

BRIX uses:

- one canonical Workspace tenancy boundary;
- one canonical Property identity;
- one canonical Deal lifecycle;
- one canonical Evidence model with immutable originals;
- one canonical task/deadline system and timeline;
- one deterministic versioned underwriting engine;
- one versioned strategy system;
- separate Recommendation and user Decision records;
- source-linked facts, estimates, assumptions, inferences, conflicts, verification, confidence, freshness, and history.

Modules are connected capabilities around the Deal, not separate applications or competing sources of truth.

## Core Capabilities

| Capability | Purpose |
| --- | --- |
| **DealIQ / PDRM Core** | Canonical Deal, Property, lifecycle, relationships, tasks, timeline, and decision workflow |
| **Property Intake** | Address, listing, manual, file, email, and provider-backed intake with source tracking |
| **Underwriting** | Deterministic financial analysis, scenarios, sensitivities, and immutable snapshots |
| **Strategy Intelligence** | Compatibility, hard disqualifiers, ranking, confidence, and explanation |
| **Decision Cockpit** | Current recommendation, controlling numbers, risks, missing information, changes, and next action |
| **MarketIQ** | Source-linked market, location, liquidity, growth, infrastructure, hazard, tax, and local context |
| **FinanceIQ** | Capital structures, debt/equity tranches, lender constraints, schedules, and financing feasibility |
| **GovernanceIQ** | HOA/COA/POA documents, restrictions, financial health, and strategy impact |
| **ContractIQ** | Contract hierarchy, source-linked findings, deadlines, conflicts, and professional questions |
| **OfferIQ** | Offer structures, revisions, counters, negotiation history, and transaction execution |
| **VisitIQ / PhotoIQ** | Field visits, maps, routes, offline capture, photos, video, voice notes, and visual Evidence |
| **InspectionIQ / AppraisalIQ** | Professional report ingestion and controlled proposals into the Deal |
| **ReportIQ / PortfolioIQ** | Canonical reports, exports, sharing, comparisons, and owned-asset analysis |
| **RELearnIQ** | Contextual investor education using the same canonical Deal truth |

## Technology Stack

| Layer | Technology |
| --- | --- |
| **Web** | React, TypeScript, Vite |
| **Backend** | Supabase Postgres, Auth, Storage, Row Level Security, Edge Functions |
| **Native** | SwiftUI iPhone and iPad clients |
| **Deployment** | Vercel web deployment plus Supabase backend |
| **AI/Data** | Provider-neutral server-side adapters and controlled AI workflows |

## Local Development

Inspect the current repository scripts and toolchain before assuming historical wrapper or package-manager instructions are still correct.

Use repository-declared commands and verified executables. The governing execution rules are in `AGENTS.md` and `docs/10-CODEX-MASTER-BUILD-PROMPT.md`.

## Backend

Database migrations live in:

```text
supabase/migrations
```

Edge Functions live in:

```text
supabase/functions
```

Backend changes must be source-controlled, applied through authenticated tooling, and verified so deployed Supabase state matches the committed repository state.

## Native iPhone and iPad

The native application lives under:

```text
ios/BRIXRealEstateiOS
```

Native clients are interfaces to the same BRIX platform and canonical data. They must not maintain independent authoritative calculations or business truth.

Apple work is governed by `docs/09-APPLE-PLATFORM-COMPLIANCE.md` and requires Mac/Xcode/TestFlight/App Store verification before release.

## Production Quality Standard

BRIX is not production-complete because a screen renders or a build succeeds.

A production slice must verify the applicable full path:

`User action → validation → authorization → canonical persistence → domain logic → canonical result → event/audit → connected updates → feedback → save/reopen → retry/recovery`

Production readiness requires deterministic financial reconciliation, RLS and authorization, source provenance, stale/failure handling, accessibility, observability, save/reopen reliability, cross-module consistency, deployment evidence, and the release gates in Specification 024.

Before Specification 009 begins, completed Specifications 001-008 must pass the retrofit alignment audit required by the governing package.

## License

Proprietary. Copyright InLight AI. All rights reserved.