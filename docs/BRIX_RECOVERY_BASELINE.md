# BRIX Recovery Baseline

Date: 2026-07-13

Purpose: establish the actual condition of the current BRIX repository before more product changes. This is an evidence report, not a feature plan and not a production-readiness claim.

## Confirmed Working

- TypeScript typecheck completed successfully.
  - Command: `.\scripts\brix.cmd typecheck`
  - Result: exit code 0.
- Automated tests completed successfully.
  - Command: `.\scripts\brix.cmd test`
  - Result: exit code 0, 2 test files passed, 14 tests passed.
  - Evidence: `src/test/rebuildCore.test.ts` and `src/test/appFlow.test.tsx`.
- Production web build completed successfully.
  - Command: `.\scripts\brix.cmd build`
  - Result: exit code 0, Vite built `dist`.
- Web app entry exists and mounts React.
  - Evidence: `src/main.tsx` renders `src/App.tsx`.
- A deterministic web DealIQ calculation engine exists.
  - Evidence: `src/core/underwriting.ts` exports `analyzeDeal`.
- A web strategy catalog exists with broad strategy coverage.
  - Evidence: `src/core/strategyCatalog.ts` defines `strategyCatalog`; tests assert at least 30 strategies in `src/test/rebuildCore.test.ts`.
- Supabase project configuration exists.
  - Evidence: `supabase/config.toml` contains project id `luwaqrkhmxcqsozmilbw`.
- Native iOS project files exist.
  - Evidence: `ios/BRIXRealEstateiOS/BRIXRealEstateiOS.xcodeproj`, Swift files, `Info.plist`, `PrivacyInfo.xcprivacy`, and `LaunchScreen.storyboard`.

## Present but Unverified

- Email/password auth exists in web UI but was only tested with mocked Supabase responses.
  - Evidence: `src/App.tsx` calls `supabase.auth.signInWithPassword`, `signUp`, `resetPasswordForEmail`, and `signOut`.
  - Test evidence: `src/test/appFlow.test.tsx` mocks `../core/supabase`.
- Supabase-backed deal persistence exists but was not verified against the live database in this run.
  - Evidence: `src/core/store.ts` reads/writes `brix_deals`.
- iOS auth and deal persistence code exists but was not compiled or run in this Windows environment.
  - Evidence: `ios/BRIXRealEstateiOS/BRIXRealEstateiOS/Services.swift` calls Supabase Auth and REST.
- Account deletion exists in web and iOS paths but was not verified live.
  - Evidence: `src/core/authActions.ts`, `supabase/functions/request-account-deletion/index.ts`, and `AccountView.swift`.
- Supabase migrations define `brix_profiles`, `brix_deals`, RLS policies, and free deal limits, but this run did not push or verify the live remote schema.
  - Evidence: `supabase/migrations/20260713000100_brix_rebuild_foundation.sql` and `20260713002000_enforce_brix_deal_limits.sql`.
- Vercel SPA deployment config exists but the deployed domain was not smoke-tested in this run.
  - Evidence: `vercel.json`.

## Incomplete

- The initial production DealIQ golden path is not proven end-to-end with real auth and real persisted user data.
  - Evidence: tests mock Supabase in `src/test/appFlow.test.tsx`; no live Supabase test was run.
- FindIQ web intake does not call the Supabase `extract-listing` function.
  - Evidence: `src/App.tsx` calls `createDealFromInput`; `src/core/store.ts` calls `parseListingInput`; `src/core/supabase.ts` has `invokeBrixFunction`, but source scan only found `request-account-deletion` using it.
- DealIQ web analysis does not call the Supabase `analyze-deal` function.
  - Evidence: `src/App.tsx` calls `analyzeDeal` from `src/core/underwriting.ts`.
- Photo handling records uploaded file names but does not upload image bytes to storage or run server vision analysis.
  - Evidence: `src/App.tsx` DealIQ file input maps files to names; `src/core/photoAnalysis.ts` matches text patterns against names/URLs.
- ContractIQ web review is deterministic text-only and not persisted in the simplified app path inspected here.
  - Evidence: `src/App.tsx` `ContractIQ` keeps pasted contract text in component state and calls `reviewContractText`.
- OfferIQ, PipelineIQ, PortfolioIQ, and Reports are present but shallow in the current simplified web app.
  - Evidence: all are implemented inside `src/App.tsx`; persistence beyond deal status is not shown in these inspected components.
- Generated Supabase TypeScript database types were not found.
  - Evidence: repo scan for files named database/schema/types only found `src/core/types.ts`.

## Broken

- Lint fails.
  - Command: `C:\Users\edhem\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\eslint\bin\eslint.js .`
  - Result: exit code 1.
  - Failure: `src/core/store.ts:73:39` uses explicit `any`.
- Dependency installation did not produce a clean success signal.
  - Command: `.\scripts\brix.cmd install`
  - Result: exit code 0, but pnpm printed `[ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY] Aborted removal of modules directory due to no TTY`.
  - Side effect: untracked `.pnpm-store/` appeared after the command.
- The root landing page currently has an `Open BRIX` button, not a sign-in-first entry.
  - Evidence: `src/App.tsx` `Landing` uses `window.location.assign("/app")`.

## Missing

- No confirmed live smoke test for registration, sign-in, save, reopen, edit, delete.
- No confirmed database-level test proving user isolation on `brix_deals`.
- No confirmed live Supabase migration status.
- No confirmed iOS build/archive result from this environment.
- No canonical shared calculation engine consumed by both web and iOS.
- No canonical shared parser consumed by both web and iOS.
- No storage-backed photo upload workflow found in the inspected web golden path.
- No full DealIQ validation layer found between user input and calculations.

## Duplicate or Conflicting

- Web parser and Edge Function parser both exist.
  - Web: `src/core/listingParser.ts`.
  - Edge: `supabase/functions/extract-listing/index.ts`.
- Web analysis and Edge Function analysis both exist.
  - Web: `src/core/underwriting.ts`.
  - Edge: `supabase/functions/analyze-deal/index.ts`.
- iOS duplicates DealIQ analysis logic instead of consuming the web or backend engine.
  - Evidence: `ios/BRIXRealEstateiOS/BRIXRealEstateiOS/AppState.swift` implements `analysis(for:)`, `strategyScore`, `monthlyPayment`, and `monthlyNOI`.
- Web and iOS both support local/device deal storage as well as Supabase persistence.
  - Web: `src/core/store.ts` uses `localStorage`.
  - iOS: `AppState.swift` uses `UserDefaults` for deals and tokens.
- Database history contains older `deals`/`profiles` and newer `brix_deals`/`brix_profiles` families.
  - Evidence: migration scans show both table families and policies across `supabase/migrations`.

## Mock or Placeholder Behavior

- Automated app-flow tests mock Supabase auth, database, functions, and exports.
  - Evidence: `src/test/appFlow.test.tsx`.
- Web signed-out workflow creates device-local deals.
  - Evidence: `src/App.tsx` `createDeal` stores locally when `isAuthenticated` is false.
- Photo analysis is filename/URL keyword matching, not image inspection.
  - Evidence: `src/core/photoAnalysis.ts`.
- Edge `extract-listing` is deterministic parsing only; it does not fetch external listing pages.
  - Evidence: `supabase/functions/extract-listing/index.ts`.
- Edge `analyze-deal` uses a small deterministic score formula separate from web DealIQ.
  - Evidence: `supabase/functions/analyze-deal/index.ts`.

## Security and Data Isolation Risks

- Web Supabase client falls back to a production project URL and publishable key if env vars are missing.
  - Evidence: `src/core/supabase.ts`.
- iOS stores access and refresh tokens in `UserDefaults`, not Keychain.
  - Evidence: `AppState.swift`.
- Edge Functions use wildcard CORS.
  - Evidence: `supabase/functions/*/index.ts` inspected functions define `Access-Control-Allow-Origin: "*"`.
- `request-account-deletion` uses the Supabase service-role key server-side; this is acceptable only if deployed as an Edge Function secret and never exposed to clients.
  - Evidence: `supabase/functions/request-account-deletion/index.ts`.
- Database isolation policies exist in migrations, but live enforcement was not tested.

## Database and Migration Risks

- Multiple generations of tables and policies exist (`deals`/`profiles` and `brix_deals`/`brix_profiles`), creating migration and authority risk.
- `brix_deals` is the table used by current web and iOS persistence code.
  - Evidence: `src/core/store.ts` and `Services.swift`.
- Free deal cap triggers exist for `brix_deals`, but live behavior was not verified.
  - Evidence: `20260713002000_enforce_brix_deal_limits.sql`.
- No generated DB types were found, so frontend schema use is manually typed or untyped.

## Deployment and Environment Risks

- `scripts/brix.ps1` uses pnpm while `package-lock.json` exists, creating package-manager ambiguity.
- `vercel.json` uses `npm run build`, while local wrapper uses pnpm for install and direct node for build.
- `dist/` is present in the repo working tree, but deployment should use build output generated by CI/Vercel.
- Cache-control headers are configured, but deployed cache behavior was not verified.

## Testing Gaps

- Tests do not hit real Supabase auth, RLS, or database persistence.
- Tests do not verify live password reset email behavior.
- Tests do not verify iOS.
- Tests do not verify Edge Function deploy/runtime behavior.
- Tests do not verify report file contents beyond mocked export calls in app flow.
- Tests do not verify storage upload or image analysis.
- Tests do not verify database constraints or free-plan deal cap.

## Recovery Recommendation

Smallest realistic path: stabilize the DealIQ golden path before adding or repairing expansion modules.

Recommended first scope:

1. Milestone 0: make local installation and lint repeatable.
2. Milestone 1: prove real Supabase auth/session/user isolation against `brix_profiles` and `brix_deals`.
3. Milestone 2: choose one canonical deal persistence model and remove local/device persistence from the production golden path or clearly gate it as offline-only.
4. Milestone 3: choose one canonical DealIQ calculation engine and make web/iOS call the same authority or share a generated contract.
5. Milestone 4: build only the DealIQ golden path end-to-end with real saves, reloads, edits, recalculation, and delete.

Do not continue expanding FindIQ, ContractIQ, OfferIQ, PipelineIQ, PortfolioIQ, image analysis, or reports until DealIQ is stable and tested.

