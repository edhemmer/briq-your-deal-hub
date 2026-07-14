# BRIX Release Plan

Date: 2026-07-13

This plan intentionally narrows BRIX recovery to the DealIQ production core before expansion modules. Product intent is controlled by `BRIX.md`; this plan exists to turn that intent into contained recovery milestones.

Current objective from `BRIX.md`: make BRIX dependable enough for Ed to evaluate a real property from initial intake through a documented investment decision, with reliable saving, correct calculations, clear assumptions, scenario analysis, risk visibility, and no fabricated data.

## Milestone 0: Repository and Build Stability

### Objective

Installation, development startup, type checking, linting, tests, and production build operate through repeatable commands.

### Current Blockers

- `.\scripts\brix.cmd install` prints pnpm no-TTY abort message.
- Lint fails on `src/core/store.ts`.
- Package manager is ambiguous: `package-lock.json` exists while the wrapper uses pnpm.
- `scripts/brix.cmd` does not expose lint.

### Acceptance Criteria

- One documented package manager is selected.
- Install command runs cleanly in non-interactive environment.
- Typecheck passes.
- Lint passes.
- Tests pass.
- Production build passes.
- `git status --short` is clean except intentional tracked changes.

### Likely File Areas Involved

- `package.json`
- `package-lock.json`
- `scripts/brix.ps1`
- `scripts/brix.cmd`
- `eslint.config.js`
- `src/core/store.ts`

### Database Impact

None expected.

### Security Impact

None expected unless install/build scripts expose env values; they must not.

### Tests Required

- `.\scripts\brix.cmd typecheck`
- Lint command or added wrapper lint command
- `.\scripts\brix.cmd test`
- `.\scripts\brix.cmd build`

### Manual Verification Required

- Confirm clean install on Windows.
- Confirm developer can run the documented commands from a fresh clone.

### Explicit Exclusions

- No product feature changes.
- No UI redesign.
- No schema changes.

### Recommended Order of Contained Tasks

1. Decide package manager and align wrapper/documentation.
2. Add wrapper support for lint or document exact lint command.
3. Fix the lint error without changing runtime behavior.
4. Rerun install/typecheck/lint/test/build.

## Milestone 1: Authentication and User Isolation

### Objective

Registration, sign-in, sign-out, session restoration, protected routes, ownership, and database-enforced user separation work correctly.

### Current Blockers

- Auth is present but only mocked in automated tests.
- Web signed-out flow can create local deals.
- iOS stores JWTs in `UserDefaults`.
- RLS exists in migrations but live enforcement is unverified.

### Acceptance Criteria

- User can register, sign in, sign out, and restore session on refresh.
- Password reset works with configured redirect.
- User A cannot read/update/delete User B deals.
- Account deletion request works for authenticated user.
- iOS auth uses secure token storage or a documented compliant alternative.

### Likely File Areas Involved

- `src/App.tsx`
- `src/core/supabase.ts`
- `src/core/authActions.ts`
- `src/core/store.ts`
- `supabase/migrations`
- `supabase/functions/request-account-deletion`
- `ios/BRIXRealEstateiOS/BRIXRealEstateiOS/AccountView.swift`
- `ios/BRIXRealEstateiOS/BRIXRealEstateiOS/Services.swift`
- `ios/BRIXRealEstateiOS/BRIXRealEstateiOS/AppState.swift`

### Database Impact

Potential migration may be needed only if RLS/profile creation is incomplete. Do not modify schema until live behavior is tested.

### Security Impact

High. Do not weaken RLS or auth to make UI work.

### Tests Required

- Auth integration tests against a safe test Supabase project or local Supabase.
- RLS tests for cross-user access denial.
- Account deletion function test.

### Manual Verification Required

- Browser sign-up/sign-in/reset/sign-out.
- iOS simulator sign-in/sign-out/reset after Xcode build.

### Explicit Exclusions

- No billing work.
- No provider integrations.
- No app expansion modules.

### Recommended Order of Contained Tasks

1. Verify current Supabase auth settings and redirect URLs.
2. Create a safe test procedure for two users.
3. Validate profile creation and `brix_deals` ownership.
4. Decide whether signed-out local deals are allowed in production.
5. Address iOS token storage.

## Milestone 2: Canonical Deal Persistence

### Objective

One authoritative deal model and data-access pattern supports create, save, reopen, update, and delete.

### Current Blockers

- Web uses `localStorage` and Supabase.
- iOS uses `UserDefaults` and Supabase.
- Database contains old and new table families.
- No generated database types were found.

### Acceptance Criteria

- One canonical `Deal` schema is documented and enforced.
- Web create/save/reopen/update/delete uses one data-access layer.
- iOS uses the same backend contract.
- Delete behavior matches free/paid account rules.
- Saved deal reopens after browser refresh and later login.

### Likely File Areas Involved

- `src/core/types.ts`
- `src/core/store.ts`
- `src/App.tsx`
- `supabase/migrations`
- `ios/BRIXRealEstateiOS/BRIXRealEstateiOS/AppModels.swift`
- `ios/BRIXRealEstateiOS/BRIXRealEstateiOS/Services.swift`

### Database Impact

Possible non-destructive migration for constraints/indexes/types only after schema authority is confirmed.

### Security Impact

High. Ownership checks must remain database-enforced.

### Tests Required

- Create/read/update/delete tests.
- Cross-user RLS tests.
- Free account delete/limit behavior tests.

### Manual Verification Required

- Create deal on web, reopen after sign out/in.
- Create deal on iOS, reopen on web.
- Delete deal and confirm expected behavior.

### Explicit Exclusions

- No new provider search.
- No ContractIQ/PortfolioIQ expansion.

### Recommended Order of Contained Tasks

1. Declare canonical deal table and model.
2. Remove or gate non-canonical local persistence from production path.
3. Add DB type generation or a validated schema contract.
4. Build and verify CRUD golden path.

## Milestone 3: DealIQ Calculation Engine

### Objective

One deterministic and testable calculation engine produces correct results from validated inputs.

### Current Blockers

- Web, iOS, and Edge Function all contain separate analysis logic.
- Input validation is light.
- Strategy comparison is broad but not proven with real-world calculation fixtures.

### Acceptance Criteria

- One calculation authority is chosen.
- Inputs are validated before analysis.
- Required strategy assumptions and missing data are explicit.
- Calculation fixtures cover owner-occupant, buy-and-hold, rental, BRRRR, flip, seller-finance, refinance, and pass cases.
- iOS and web return equivalent results for the same deal.

### Likely File Areas Involved

- `src/core/underwriting.ts`
- `src/core/strategyCatalog.ts`
- `supabase/functions/analyze-deal`
- `ios/BRIXRealEstateiOS/BRIXRealEstateiOS/AppState.swift`
- `src/test/rebuildCore.test.ts`

### Database Impact

None unless analysis snapshots are persisted.

### Security Impact

Medium. Do not fabricate confidence; source and missing data must remain visible.

### Tests Required

- Unit fixtures for each strategy.
- Edge equivalence tests if Edge remains calculation authority.
- Regression tests for missing inputs and conservative decisions.

### Manual Verification Required

- Run a known deal through selected strategies and compare to expected math.

### Explicit Exclusions

- No AI recommendations until deterministic math is stable.
- No provider-backed comps/rents until adapter layer is verified.

### Recommended Order of Contained Tasks

1. Select calculation authority.
2. Add validated input schema.
3. Add fixture-based tests.
4. Wire web and iOS to the same authority.

## Milestone 4: Complete DealIQ Golden Path

### Objective

The full core user workflow works as one integrated application experience.

### Current Blockers

- Auth and persistence are unverified live.
- Parser and analysis authorities conflict.
- UI currently includes expansion modules before the core path is proven.

### Acceptance Criteria

User can:

1. Register or sign in.
2. Create a deal.
3. Enter property and financial information.
4. Save the deal.
5. Run analysis.
6. Review results.
7. Edit assumptions.
8. See updated results.
9. Leave the application.
10. Return later.
11. Reopen the same deal.
12. Delete the deal when permitted.

### Likely File Areas Involved

- `src/App.tsx`
- `src/core`
- `src/styles/app.css`
- `src/test`
- `supabase/migrations`
- `ios/BRIXRealEstateiOS`

### Database Impact

Only if Milestone 2 finds missing constraints or missing columns.

### Security Impact

High. Golden path must not rely on unauthenticated persistence for production claims.

### Tests Required

- End-to-end browser flow.
- Persistence/reopen tests.
- Delete permission tests.
- Calculation update tests.

### Manual Verification Required

- Real browser session on production-like Supabase.
- Later iOS parity smoke after Mac/Xcode build.

### Explicit Exclusions

- FindIQ live search.
- ContractIQ completion.
- Reports expansion.
- Portfolio automation.

### Recommended Order of Contained Tasks

1. Build one web golden path.
2. Add tests around it.
3. Verify live Supabase.
4. Mirror the stable flow in iOS.

## Milestone 5: Production Hardening

### Objective

Errors, loading, accessibility, responsive behavior, logging, deployment, smoke testing, security checks, and rollback are reliable.

### Current Blockers

- No production smoke test evidence from this run.
- No iOS build verification in this environment.
- Error handling is present but not comprehensive.
- Cache behavior is configured but not verified.

### Acceptance Criteria

- Production smoke checklist passes.
- Accessibility basics pass.
- Responsive tablet/laptop views are checked.
- Deployment rollback path is documented.
- Supabase functions and migrations are deployed and smoke-tested.
- App Store compliance is verified on Mac/Xcode.

### Likely File Areas Involved

- `vercel.json`
- `README.md`
- `docs`
- `src/App.tsx`
- `src/styles/app.css`
- `supabase`
- `ios/BRIXRealEstateiOS`

### Database Impact

No schema changes unless hardening finds defects.

### Security Impact

High. Verify secrets, CORS, RLS, token storage, and account deletion.

### Tests Required

- Production smoke test script/checklist.
- Auth/RLS integration tests.
- Build and lint gates.

### Manual Verification Required

- `brixrealestate.app` routing/cache.
- App Store archive/upload from Xcode.

### Explicit Exclusions

- No expansion modules until hardening is complete.

### Recommended Order of Contained Tasks

1. Create smoke checklist.
2. Verify deployed web.
3. Verify Supabase.
4. Verify iOS archive.
5. Resolve security findings.

## Milestone 6: Deferred Expansion

### Objective

ContractIQ completion, FindIQ, reports, external data, image analysis, native iOS enhancements, voice integration, and other advanced features remain deferred until the DealIQ core is stable.

### Current Blockers

- DealIQ core is not yet proven live.
- Expansion modules are present but shallow or unverified.

### Acceptance Criteria

- DealIQ golden path has passed Milestones 0-5.
- Each expansion module has its own contained design, backend contract, tests, and verification plan.

### Likely File Areas Involved

- `src/App.tsx`
- `src/core`
- `supabase/functions`
- `supabase/migrations`
- `ios/BRIXRealEstateiOS`

### Database Impact

Module-specific only after design approval.

### Security Impact

Module-specific. Provider secrets stay server-side.

### Tests Required

- Per-module unit/integration/E2E tests.

### Manual Verification Required

- Per-module workflow smoke.

### Explicit Exclusions

- No expansion work before DealIQ release stability.

### Recommended Order of Contained Tasks

1. ContractIQ persistence and review flow.
2. Reports from verified DealIQ data.
3. FindIQ intake improvements.
4. Image storage and analysis.
5. PortfolioIQ after closed deals.
6. Native iOS enhancements.
