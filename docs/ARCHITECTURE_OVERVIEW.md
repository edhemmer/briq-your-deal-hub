# BRIX Real Estate Architecture Overview

Last updated: 2026-06-18

BRIX is a provider-neutral real estate acquisition and portfolio intelligence platform. The product is organized around decision quality, source transparency, and conservative fallback behavior when data or AI services are unavailable.

## Platform Layers

```text
Web / Mobile / Native iOS
  -> Supabase API + Edge Functions
  -> BRIX Services and deterministic engines
  -> PostgreSQL, Storage, Auth, and Provider Adapter Layer
  -> External providers
```

Business logic belongs in BRIX services and deterministic engines. Client apps render workflows, collect user inputs, display confidence, and submit requests through authenticated APIs.

## Core Modules

| Module | Purpose |
| --- | --- |
| FindIQ | Discovery intelligence: identify and rank opportunities worth investigating. |
| DealIQ | Acquisition intelligence: determine whether an opportunity should be acquired. |
| PipelineIQ | Workflow intelligence: track each opportunity from discovery through closing. |
| OfferIQ | Transaction intelligence: convert analysis into offers, documents, communications, and negotiation actions. |
| PortfolioIQ | Asset intelligence: monitor acquired assets, equity, cash flow, risk, and optimization opportunities. |
| Admin Console | Superadmin access, user plans, overrides, account deletion requests, SaaS KPIs, and audit history. |

## Provider Strategy

BRIX modules must not depend directly on vendor schemas. External sources connect through adapters, normalize into BRIX objects, and carry source metadata.

Current free/provider-light foundation:

| Provider | Status | Use |
| --- | --- | --- |
| FRED | Connected with free key | Mortgage and macro-rate context. |
| Census ACS | Connected with free key | County and market population context. |
| BLS Public Data API | Connected without key fallback | Employment and labor-market trend context. |
| U.S. Census Geocoder | Connected without key | Address geocoding and jurisdiction context. |
| OpenAI-compatible AI | Connected, paid/quota-dependent | Listing, image, and contract extraction. |

Future paid provider slots:

| Provider Type | Example Providers | Purpose |
| --- | --- | --- |
| Property and listing data | RentCast, ATTOM, MLS feeds | Property facts, active listings, comps, ownership, listing history. |
| Rental data | RentCast, MLS/rent providers | Rent estimates, rent comps, demand signals. |
| Risk data | FEMA, insurance, crime providers | Natural hazard, insurability, and local risk context. |
| Transaction services | Lender, insurance, contractor, accounting providers | Execution and ownership workflows. |

## Reliability Rules

- Every recommendation must show confidence, assumptions, evidence, risks, missing information, alternatives, and next actions.
- AI extraction is assistive only. Users must review extracted facts before relying on analysis.
- If AI is unavailable, text and contract extraction degrade to deterministic low-confidence parsing when possible.
- If a provider fails, BRIX should continue with reduced confidence rather than fabricate data.
- Every provider-backed value should carry source, retrieval date, confidence, and verification status.
- Edge Functions remain JWT-protected unless a route is intentionally public.

## AI Extraction Behavior

| Function | Production Behavior |
| --- | --- |
| `extract-deal-from-text` | Uses OpenAI-compatible extraction when available; falls back to deterministic text parsing on rate/quota/config failure. |
| `extract-deal-from-image` | Uses AI vision; if unavailable, UI instructs users to paste listing text or URL. |
| `extract-contract-from-document` | Uses AI extraction when available; falls back to obvious low-confidence term parsing on rate/quota/config failure. |

The UI must surface fallback warnings. A fallback result must never look like a verified result.

## Supabase Foundation

Core tables include:

- `profiles`
- `deals`
- `contracts`
- `market_conditions`
- `user_roles`
- `admin_audit_log`
- `account_deletion_requests`
- `property_digital_twins`
- `brix_decisions`
- `brix_field_captures`
- `brix_visual_scope_items`
- `brix_project_tasks`
- `brix_portfolio_snapshots`

Security:

- Supabase Auth manages sessions.
- Row Level Security protects user data.
- Admin access uses role checks and audited Edge Function actions.
- Account deletion requests are recorded for Apple/privacy compliance workflows.

## Production Hardening Checklist

Before production users:

- Build and test pass.
- Supabase Auth redirect URLs include `https://brixrealestate.app`, preview URLs, local development URLs, and future iOS callback URLs.
- Google OAuth is configured in Supabase Auth.
- Apple provider is configured before App Store submission.
- Account deletion flow is visible and tested.
- Admin Console is restricted to superadmins only.
- OpenAI secret is rotated after any chat/log exposure.
- FRED, Census, and BLS functions have recent smoke tests.
- Text and contract extraction fallback warnings are visible in the UI.
- Paid-provider features are labeled as planned until credentials and contracts are active.

## Production Readiness Status

The current system is suitable for a controlled beta when deployed with the configured Supabase project and verified auth. It is not yet a full production underwriting source of truth because paid listing/comps/rent/insurance providers are not connected. BRIX can support early users by clearly labeling assumptions, reducing confidence when data is weak, and requiring verification before recommendations.
