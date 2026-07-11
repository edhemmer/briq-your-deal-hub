# BRIX Full App Audit & Release Blockers

Date: 2026-07-10

## Audit Standard

This audit is not a copy review. A module only passes when the user can complete the real workflow, data is saved to the correct backend table/function, calculations use the saved data, missing data is clearly blocked or labeled, and the next action moves the user forward without duplicate entry.

Each module is reviewed for:

- Entry path: how the user starts.
- Data capture: what information is accepted, extracted, uploaded, or retrieved.
- Persistence: whether data is saved to Supabase and reopens across devices.
- Computation: whether math/scoring/recommendations are deterministic and strategy-aware.
- Verification: whether facts, estimates, assumptions, and missing data are separated.
- Output: whether the page produces a usable decision or workflow outcome.
- UX: whether the screen feels like a working application, not a brochure or prototype.
- iOS parity: whether the same backend contract is available natively.

## Current Release Decision

BRIX is not yet fully production-trustworthy end-to-end. Some core pieces are live and wired, but several modules are incomplete shells or shallow workflow layers. The app must not be represented as fully hardened until the blockers below are closed and verified.

## Production Release Audit - 2026-07-10

This pass reviewed the live web routing surface, FindIQ intake path, stale/public wording risks, persisted workflow handoffs, regression fixture leakage, and production build/test health.

### Issue List And Corrections

| # | Area | Issue Found | Correction Made | Status |
| --- | --- | --- | --- | --- |
| 1 | FindIQ URL intake | Listing URLs were being geocoded as raw URLs instead of using the extracted property address. | FindIQ now builds a geocode target from extracted address, city, state, and ZIP; raw URLs are not sent to geocoding unless no better address exists. | Fixed |
| 2 | FindIQ parser reliability | Missing extracted numeric fields could call `.replace()` on `undefined` and crash deal creation. | `parseNumber` now accepts `string`, `number`, `null`, or `undefined` and safely returns `null` for missing values. | Fixed |
| 3 | FindIQ photo intelligence | Listing photo URLs could be saved but not used during initial deal creation. | FindIQ now attempts first-pass visual analysis for extracted listing photo URLs and carries condition notes, visual risks, missing questions, and analysis status into the created DealIQ record. | Fixed |
| 4 | FindIQ stale workflow code | The simplified two-step workflow still had unreachable legacy modal/state/import plumbing in the component. | Removed the old component-level modal/state workflow so the rendered product flow matches the intended address/link -> strategy -> DealIQ record path. | Fixed |
| 5 | Public wording / internal labels | Prior scans found wording that made the app feel like a demo/prototype or exposed internal language. | Re-ran scans for stale UI phrases, internal labels, bad encoding, and demo/prototype/MVP wording across web/iOS source; no matching public-facing hits remain. | Fixed in source |
| 6 | Regression fixture naming | Test-only architecture fixtures were exported as `sample...`, which creates future leakage risk. | Renamed pipeline and offer fixtures to `regression...` and updated regression tests. | Fixed |
| 7 | Build health | Production build needed to be rechecked after intake and fixture changes. | `vite build` passes. Vendor/document chunks remain large and are tracked as performance debt. | Passed with warning |
| 8 | Regression health | Route, billing, engine, and OS regression tests needed to be rechecked after changes. | `vitest run --environment jsdom` passes: 15/15 tests. | Passed |

### Remaining Release Risks

- Live deployed domain cache must still be verified on `brixrealestate.app` after deployment.
- URL extraction must still be smoke-tested against several real listing sites because providers may block server-side fetches or photo downloads.
- iOS simulator/device flows still require Mac-side verification: login, create deal from listing link, upload field photos, reopen on web.
- Admin console and password reset need live Supabase/email verification.
- Large vendor/document chunks should be code-split after the functional release blockers are closed.

## Critical System Findings

| Area | Status | Finding | Required Fix |
| --- | --- | --- | --- |
| FindIQ URL/listing intake | Code-fixed, live verification required | Shared extraction now calls Supabase first, normalizes extraction shapes, preserves extracted fields, uses extracted address for geocoding, safely handles missing numeric fields, and attempts listing-photo analysis when URLs are available. | Live-test against multiple listing URLs and provider-blocked cases; unsupported fields must remain blank with verification status. |
| Official tax records | In progress | Listing tax clues are not official tax history. County lookup exists, but tax history is not retrieved automatically. | Add tax history/status fields, official lookup URL, and tax verification state across DealIQ/FindIQ/iOS. |
| Deal creation cap | Fixed this pass | Free users need a hard lifetime cap that cannot be bypassed by deleting records. | Added `deal_file_usage` ledger and DB trigger; paid/admin/comped users remain unlimited. Free-user deal deletion is blocked by DB policy. |
| PortfolioIQ | Partial/live | Route now reads closed/acquired deals and estimates portfolio value, debt, equity, cash flow, DSCR, and asset health. | Add durable asset records, loan schedules, document vault, and refinance/disposition automations. |
| Reports | Partial/live | Route now reads live deal files and shows report readiness/missing inputs. | Add saved report history and generated report records. |
| OfferIQ | Code-fixed, live verification required | Reads deals, saves current offer plans to `brix_offers`, stores offer terms/strategy snapshot, and can move a deal to offer strategy/submitted. | Verify saved offer records in production, then add generated documents, counters, and communication packages. |
| PipelineIQ | Code-fixed, live verification required | Reads deals, updates status, creates missing-input verification tasks in `brix_project_tasks`, and lets users complete tasks. | Verify task creation/completion in production, then add deadlines, activity history, assignments, and probability/health history. |
| ContractIQ | Partial/stronger | Contract upload/extraction, contract table persistence, and contract analysis exist. Needs route and extraction verification. | Run end-to-end contract upload/text extraction smoke and verify saved analysis. |
| DealIQ strategy engine | Partial/stronger | Strategy fit engine includes broad strategy assumptions/questions/success criteria, but analysis page must be tested for every strategy path and missing-data behavior. | Add strategy regression tests and ensure UI shows selected strategy plus better alternatives. |
| Auth/password reset | Needs verification | Web/iOS auth are wired to Supabase. User reported reset failures/rate limits. | Verify reset redirect, Supabase email settings, and iOS password reset flow. |
| Admin console | Needs verification | Admin APIs and KPIs exist, including users, paid/free/comped, deletion requests, password reset, and overrides. | Live-test admin-console function with superadmin account and verify Stripe KPI assumptions. |
| iOS app | Code-fixed, Mac verification required | Native files are present and wired to Supabase REST/functions. iOS signup decoding and deal-create payload enrichment were corrected, but Windows cannot compile/run Xcode. | Run Xcode build, simulator login, create deal from listing URL, field photo upload, and refresh on web. |
| Cache/stale app | Partial/fixed locally | Browser has shown stale deployed content. | No-store headers, legacy service-worker cleanup, and app-version marker are present; still verify deployed commit and route smoke on `brixrealestate.app`. |

## Module Audit Matrix

### Dashboard / Deal Dashboard

Status: Partial

- Reads live `deals` through `useDeals`.
- Shows active deal readiness and next actions.
- Problem: still depends on readiness checks that treat any positive tax as usable. This needs to respect tax verification status once the new fields are wired.
- Problem: content and flow need tablet/small-laptop review for density and clarity.

### FindIQ

Status: Code-fixed, live verification required

- Current intended workflow: property address/listing URL -> strategy -> create DealIQ file.
- Live connections: `extract-deal-from-text`, `geocode-address`, `extract-deal-from-image`, `deals` insert.
- The rendered FindIQ page has been reduced to the primary start flow plus the deal queue; the hidden legacy criteria/import panel was removed from the client-facing page.
- The unreachable legacy modal/state plumbing was removed from the shipped FindIQ component so the code path now matches the simplified product workflow.
- Listing extraction now accepts both nested and flat edge-function response shapes so client intake does not break if the function response shape changes.
- Problems:
  - URL extraction still needs live testing against multiple listing sites, because many sites block server-side fetching and photo URLs may require screenshot/photo upload.
  - Tax history must remain unverified unless official tax data is entered or retrieved.
  - Some old parser helpers remain as module-level utilities and can be trimmed further after the current URL/text intake is live-tested across several listing formats.

### DealIQ

Status: Partial/strong core

- Live connections: `deals`, `market_conditions`, report export, field captures.
- Core math exists through canonical engines: deal analysis, strategy fit, stress tests, returns, pro forma, financing, hidden risk, confidence.
- Problems:
  - Official tax verification is not yet part of every readiness/trust calculation.
  - Every strategy needs regression coverage to ensure correct assumptions, questions, formulas, and alternative recommendations are visible.
  - Workflow step click-back routing was corrected so Strategy, Stress, Reports, and earlier checked steps route to valid tabs.
  - Property/data enrichment still expects user-entered official values; county retrieval is not automatic.

### OfferIQ

Status: Code-fixed, live verification required

- Reads live deals.
- Saves a current offer plan to `brix_offers` with offer status, offer anchor, earnest money, due diligence window, closing timeline, contingencies, repair guidance, walk-away guardrail, and strategy snapshot.
- Can move a deal to `offer_strategy`, `underwriting`, or `offer_submitted`.
- Produces offer posture from readiness and missing inputs.
- The submit action now persists the offer plan before moving the deal to submitted status.
- Problems:
  - Needs live verification that saved offer plans reopen correctly after refresh/login.
  - Letters, counteroffers, communications, and document packages are not complete yet.
  - Due diligence timeline is still basic and should push dated tasks into PipelineIQ.

### PipelineIQ

Status: Code-fixed, live verification required

- Reads live deals.
- Updates `deal_status`.
- Creates persistent verification tasks in `brix_project_tasks` from missing deal inputs.
- Shows active/ready/open-task/outcome counts.
- Lets users open deal files and mark verification tasks complete.
- Problems:
  - Needs live verification that task creation does not duplicate under normal use.
  - Deadline scheduling, activity timeline, assignment model, probability scoring, and automation are still incomplete.
  - Closed deals do not automatically create PortfolioIQ assets.

### PortfolioIQ

Status: Partial/live

- Reads live closed/acquired deals.
- Calculates portfolio-level value, debt, equity, monthly cash flow, average DSCR, and asset health from saved deal fields.
- Problems:
  - Closed deals do not yet create durable asset records.
  - Loan amortization, document vault, refinance triggers, disposition logic, and maintenance/capital planning are not complete.

### ContractIQ

Status: Partial/stronger

- Reads/writes `contracts`.
- Uses `extract-contract-from-document`.
- Runs deterministic `contractIQEngine`.
- Problems:
  - Needs end-to-end upload/text extraction verification.
  - "Module" badge and internal labels need review.
  - ContractIQ does not yet push obligations/deadlines into PipelineIQ.

### Reports

Status: Partial/live

- Reads live deals and shows report readiness, missing inputs, and links into DealIQ exports.
- Problems:
  - Report records/history are not persisted.
  - ContractIQ report exports are not yet shown in this route.

### Admin

Status: Needs live verification

- Uses `admin-console` function for user listing, KPIs, subscription changes, overrides, resets, deletion, and audit log.
- Problems:
  - Stripe KPI values depend on configured Stripe env vars and must be live-verified.
  - Superadmin access must be verified against `edhemmer@gmail.com`.

### Account / Settings

Status: Needs cleanup

- Supports sign out and account deletion.
- Problems:
  - Free lifetime deal-file usage is visible and enforced, but Stripe portal flow still needs live verification.
  - Needs cleaner production account experience and Stripe portal flow if available.

### iOS

Status: Code-wired, Mac verification required

- Native Swift app has Supabase auth, sign-up, password reset, deal list refresh, listing extraction, deal creation, field capture upload, and account deletion path.
- iOS sign-up now decodes Supabase nested signup sessions, and iOS deal creation now sends ARV, listing photo URLs, condition notes, stated risks, and missing questions into the same Supabase deal record used by web.
- User-selected iOS strategy is preserved during extraction instead of being overwritten by listing text.
- Xcode project membership was checked: all 18 Swift source files in `BRIXRealEstateiOS/BRIXRealEstateiOS` are target sources, `BRIXRealEstateiOSApp.swift` is the entry point, and `LaunchScreen.storyboard` is included as a resource. There is no `ContentView` or Hello World source in the current repo project.
- Problems:
  - Must be verified in Xcode/simulator/device.
  - iOS FindIQ needs parity with the simplified web workflow and should not expose provider/future/demo language.
  - Field photo capture must be verified from camera/library through Supabase storage and field-capture function.

## Verification Evidence So Far

- Production web build passed after current patches.
- Routing/BRIX/billing regression tests passed after current patches: 15/15 tests.
- OfferIQ persistence migration `20260710153000_add_brix_offers.sql` was pushed to Supabase.
- PipelineIQ now persists verification tasks through the existing `brix_project_tasks` table.
- OfferIQ now persists offer plans through the new `brix_offers` table.
- FindIQ client intake now normalizes edge-function extraction responses, no longer renders the older hidden criteria/import panel, and no longer carries the old modal state in the component workflow.
- DealIQ workflow step routing now maps the Strategy step to a dedicated Strategy tab instead of overloading Market & Risk.
- Free-plan lifetime deal cap is enforced in Supabase with `deal_file_usage`; deleting deals no longer resets the free allowance.
- Free-user direct deal deletion is now blocked by Supabase policy; paid/admin/comped users can still manage records.
- Cache hardening includes no-store headers, service-worker/cache cleanup, and a refreshed app-version marker.
- Supabase `extract-deal-from-text` deployment succeeded earlier.
- Live extraction against a public listing URL returned address, city/state/zip, price, beds, baths, square feet, year built, condition notes, photo URL, and high source confidence.
- Tax value from listing was blocked when implausible and returned as blank instead of being treated as official annual tax.

## Verification Still Required

- Local production route smoke for every protected route.
- Full DealIQ strategy test matrix.
- FindIQ URL -> deal -> DealIQ -> PipelineIQ -> OfferIQ -> PortfolioIQ path.
- ContractIQ upload/text -> analysis -> report path.
- Admin console function with superadmin account.
- Password reset web and iOS.
- iOS Xcode build and simulator/device flows.
- Cache/deployment verification on `brixrealestate.app`.
