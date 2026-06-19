# BRIX Production Hardening Checklist

Last updated: 2026-06-18

This checklist defines the gate for moving BRIX from controlled beta to production. BRIX may use free APIs now, but every workflow must remain honest about confidence, source quality, and missing paid-provider data.

## Current Production Posture

BRIX is ready for controlled beta testing when:

- Users understand results are decision support, not guaranteed outcomes.
- Text listing extraction, contract extraction, manual deal entry, deal analysis, comparisons, admin controls, and account deletion workflows are tested after deployment.
- Recommendations visibly include confidence, assumptions, risks, missing information, and next actions.
- Paid provider gaps are labeled as missing or planned rather than silently estimated.

BRIX is not ready for broad production underwriting until:

- Paid or authorized listing, comp, rent, property, insurance, and risk providers are connected.
- Provider values persist source, retrieval date, verification status, and confidence.
- End-to-end smoke tests run against production domain and Supabase.
- OpenAI and provider keys are rotated out of chat/log exposure.

## Connected Free Foundation

| Source | Status | Production Use |
| --- | --- | --- |
| FRED | Connected | Mortgage rates, macro rates, inflation/price trend context. |
| Census ACS | Connected | County/market demographic context. |
| BLS Public Data API | Connected through public fallback | Employment trend context. |
| U.S. Census Geocoder | Connected | Address normalization and jurisdiction clues. |
| OpenAI-compatible API | Connected, quota-dependent | Listing and contract extraction, with deterministic fallback for text. |

## Required User-Facing Reliability Behaviors

- If AI extraction uses a fallback, show a verification warning.
- If only a listing URL is pasted, parse only address-level clues and require verification.
- If image extraction fails, guide users to paste listing text or a URL.
- If provider data is missing, lower confidence and show missing information.
- If a value is user-entered or estimated, do not label it as verified.

## Provider Adapter Gate

Every new paid provider must ship with:

- A provider adapter that isolates vendor-specific schemas.
- A normalization step into BRIX standard objects.
- Source metadata on every normalized value.
- Failure handling that returns partial data or a visible warning.
- Unit or integration tests for success, empty result, auth failure, and rate-limit failure.
- A UI state that explains missing or degraded provider results.

## Production Smoke Tests

Run after every deployment:

1. Sign up and sign in with email/password.
2. Sign in with Google if configured.
3. Create a DealIQ record from manual fields.
4. Paste a listing URL and confirm the URL-only warning appears.
5. Paste full listing text and confirm extraction populates fields.
6. Test fallback behavior by exhausting/disabling AI in a preview environment.
7. Create and compare at least two deals.
8. Upload/paste a contract and confirm extracted terms show confidence.
9. Confirm Admin Console is only reachable by superadmin.
10. Confirm admin can see paid, free, comped, and locked users.
11. Send a password reset email.
12. Submit an account deletion request.
13. Run FRED, Census, BLS, and geocode function smoke checks.

## Paid Provider Roadmap

Priority order when production users justify cost:

1. RentCast or similar rent/property provider for rent estimates and lightweight property data.
2. ATTOM or comparable property data provider for ownership, property history, and deeper records.
3. Authorized MLS feed where available.
4. FEMA/OpenFEMA and insurance-risk provider data for hazard and premium context.
5. Contractor/material pricing providers for Visual Scope Builder and rehab budgets.

## Launch Rule

BRIX can launch to beta users with free APIs and deterministic fallbacks. It should not market itself as fully automated underwriting until paid/provider-backed comps, rents, property records, and insurance-risk data are connected and visibly sourced.
