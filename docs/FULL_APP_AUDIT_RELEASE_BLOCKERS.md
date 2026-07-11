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
| 8 | Regression health | Route, billing, engine, and OS regression tests needed to be rechecked after changes. | `vitest run --environment jsdom` passes: 16/16 tests. | Passed |
| 9 | Cross-module readiness | Dashboard, DealIQ, PipelineIQ, OfferIQ, Reports, and the global operating strip could disagree on whether annual taxes were complete. | Added shared readiness helpers so tax values only count as ready when backed by verified tax history/status. | Fixed and tested |
| 10 | Strategy expertise coverage | Strategy tests proved directional scoring for a few examples but did not assert every strategy included assumptions, required inputs, proof questions, success criteria, and failure scenarios. | Added all-strategy regression coverage so label-only strategy outputs cannot ship silently. | Fixed and tested |
| 11 | Client-facing source language | Some source review labels still used provider/connector wording that felt like backend architecture. | Changed visible source review copy to investor-facing "Source Checks", "source needed", and "official lookup" language. | Fixed in source |
| 12 | ContractIQ to PipelineIQ handoff | Contract deadlines could be reviewed/exported but did not become saved execution tasks. | Added a ContractAnalysis action that saves dated/active contract deadlines into `brix_project_tasks` for the linked DealIQ record; PipelineIQ now shows due dates on those tasks. | Code-fixed, live verification required |
| 13 | Report history | Reports route pointed back to DealIQ exports but did not persist report snapshots. | Added `brix_reports` table migration, typed Supabase shape, saved deal snapshot action, ContractIQ export snapshots, and saved snapshot history panel. | Code-fixed, migration/live verification required |
| 14 | Portfolio review history | PortfolioIQ calculated from closed deals but did not save portfolio review records. | Wired PortfolioIQ to save and display `brix_portfolio_snapshots` with equity, debt, cash flow, score, concentration, risk flags, and asset-level payload. | Code-fixed, live verification required |
| 15 | OfferIQ to PipelineIQ handoff | Offer diligence items were visible in OfferIQ but did not become tracked tasks. | Saving an offer plan as ready/submitted now creates dated PipelineIQ diligence tasks from contingencies, walk-away confirmation, and communication prep. | Code-fixed, live verification required |

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
| Official tax records | Code-fixed, live verification required | Listing tax clues are not official tax history. County lookup exists, tax history/status fields exist, and cross-module readiness now requires verified tax status/history instead of accepting any tax number. | Live-test county lookup path, manual verified entry, and saved tax status across web/iOS. |
| Deal creation cap | Fixed this pass | Free users need a hard lifetime cap that cannot be bypassed by deleting records. | Added `deal_file_usage` ledger and DB trigger; paid/admin/comped users remain unlimited. Free-user deal deletion is blocked by DB policy. |
| PortfolioIQ | Code-fixed, live verification required | Route reads closed/acquired deals, estimates portfolio value, debt, equity, cash flow, DSCR, asset health, and now saves portfolio review snapshots to `brix_portfolio_snapshots`. | Verify saved snapshots across refresh/login, then add durable asset records, loan schedules, document vault, and refinance/disposition automations. |
| Reports | Code-fixed, live verification required | Route now reads live deal files, shows report readiness/missing inputs, and can save point-in-time report snapshots to `brix_reports`; migration was pushed to Supabase. | Verify saved snapshots across refresh/login. |
| OfferIQ | Code-fixed, live verification required | Reads deals, saves current offer plans to `brix_offers`, stores offer terms/strategy snapshot, can move a deal to offer strategy/submitted, and creates dated PipelineIQ diligence tasks from offer contingencies. | Verify saved offer records and task handoff in production, then add generated documents, counters, and communication packages. |
| PipelineIQ | Code-fixed, live verification required | Reads deals, updates status, creates missing-input verification tasks in `brix_project_tasks`, lets users complete tasks, and now displays ContractIQ deadline due dates when sent from contract review. | Verify task creation/completion and ContractIQ deadline handoff in production, then add activity history, assignments, and probability/health history. |
| ContractIQ | Code-fixed, live verification required | Contract upload/extraction, contract table persistence, deterministic contract analysis, reports, and contract-deadline handoff into PipelineIQ exist in source. | Run end-to-end contract upload/text extraction smoke, send deadlines to PipelineIQ, and verify saved analysis. |
| DealIQ strategy engine | Code-fixed, live verification required | Strategy fit engine includes broad strategy assumptions/questions/success criteria, and regression coverage now asserts every strategy exposes proof needs, assumptions, success criteria, what-must-be-true, and failure scenarios. | Live-test selected strategy plus better-alternative display in DealIQ with real deal files. |
| Auth/password reset | Needs verification | Web/iOS auth are wired to Supabase. User reported reset failures/rate limits. | Verify reset redirect, Supabase email settings, and iOS password reset flow. |
| Admin console | Needs verification | Admin APIs and KPIs exist, including users, paid/free/comped, deletion requests, password reset, and overrides. | Live-test admin-console function with superadmin account and verify Stripe KPI assumptions. |
| iOS app | Code-fixed, Mac verification required | Native files are present and wired to Supabase REST/functions. iOS signup decoding and deal-create payload enrichment were corrected, but Windows cannot compile/run Xcode. | Run Xcode build, simulator login, create deal from listing URL, field photo upload, and refresh on web. |
| Cache/stale app | Partial/fixed locally | Browser has shown stale deployed content. | No-store headers, legacy service-worker cleanup, and app-version marker are present; still verify deployed commit and route smoke on `brixrealestate.app`. |

## Module Audit Matrix

### Dashboard / Deal Dashboard

Status: Partial

- Reads live `deals` through `useDeals`.
- Shows active deal readiness and next actions.
- Fixed in source: dashboard readiness now uses the shared verified-tax rule instead of treating any positive tax number as usable.
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
  - Official tax verification is now part of shared readiness scoring, but the full DealIQ recommendation/trust calculation still needs live scenario review with real records.
  - Every strategy now has regression coverage for assumptions, proof needs, and failure logic; UI behavior still needs live strategy-path smoke testing.
  - Workflow step click-back routing was corrected so Strategy, Stress, Reports, and earlier checked steps route to valid tabs.
  - Property/data enrichment still expects user-entered official values; county retrieval is not automatic.

### OfferIQ

Status: Code-fixed, live verification required

- Reads live deals.
- Saves a current offer plan to `brix_offers` with offer status, offer anchor, earnest money, due diligence window, closing timeline, contingencies, repair guidance, walk-away guardrail, and strategy snapshot.
- Can move a deal to `offer_strategy`, `underwriting`, or `offer_submitted`.
- Creates PipelineIQ tasks for offer contingencies when an offer plan is saved as ready/submitted.
- Produces offer posture from readiness and missing inputs.
- The submit action now persists the offer plan before moving the deal to submitted status.
- Problems:
  - Needs live verification that saved offer plans and generated diligence tasks reopen correctly after refresh/login.
  - Letters, counteroffers, communications, and document packages are not complete yet.

### PipelineIQ

Status: Code-fixed, live verification required

- Reads live deals.
- Updates `deal_status`.
- Creates persistent verification tasks in `brix_project_tasks` from missing deal inputs.
- Receives ContractIQ deadline tasks for linked deals and displays due dates.
- Shows active/ready/open-task/outcome counts.
- Lets users open deal files and mark verification tasks complete.
- Problems:
  - Needs live verification that task creation does not duplicate under normal use.
  - Activity timeline, assignment model, probability scoring, and automation are still incomplete.
  - Closed deals do not automatically create PortfolioIQ assets.

### PortfolioIQ

Status: Code-fixed, live verification required

- Reads live closed/acquired deals.
- Calculates portfolio-level value, debt, equity, monthly cash flow, average DSCR, and asset health from saved deal fields.
- Saves portfolio review snapshots to `brix_portfolio_snapshots` and displays recent saved reviews.
- Problems:
  - Saved snapshots need live verification after refresh/login.
  - Closed deals do not yet create durable asset records separate from the source deal file.
  - Loan amortization, document vault, refinance triggers, disposition logic, and maintenance/capital planning are not complete.

### ContractIQ

Status: Code-fixed, live verification required

- Reads/writes `contracts`.
- Uses `extract-contract-from-document`.
- Runs deterministic `contractIQEngine`.
- Can send contract deadlines into PipelineIQ as dated tasks when the contract is linked to a DealIQ record.
- Problems:
  - Needs end-to-end upload/text extraction verification.
  - Deadline handoff needs production verification against a linked contract/deal.

### Reports

Status: Code-fixed, migration/live verification required

- Reads live deals and shows report readiness, missing inputs, and links into DealIQ exports.
- Saves report snapshots to `brix_reports` and displays saved snapshot history.
- Problems:
  - Report-history migration must be pushed to Supabase.
  - Saved snapshots need live verification after refresh/login.
- ContractIQ report exports save as `contract_snapshot` records and appear in saved snapshot history after the report-history migration is applied.

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
- Routing/BRIX/billing/strategy regression tests passed after current patches: 16/16 tests.
- Shared readiness scoring now requires verified annual tax support across Deal Dashboard, DealIQ, PipelineIQ, OfferIQ, Reports, and the global operating strip.
- OfferIQ persistence migration `20260710153000_add_brix_offers.sql` was pushed to Supabase.
- PipelineIQ now persists verification tasks through the existing `brix_project_tasks` table.
- ContractIQ can now save linked contract deadlines into `brix_project_tasks`; PipelineIQ displays deadline due dates.
- OfferIQ now persists offer plans through the new `brix_offers` table.
- Reports can now save point-in-time deal snapshots through the new `brix_reports` table; ContractIQ exports now save `contract_snapshot` records to the same history.
- PortfolioIQ can now save point-in-time portfolio reviews through `brix_portfolio_snapshots`.
- OfferIQ now creates dated PipelineIQ diligence tasks when offer plans are saved as ready/submitted.
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
