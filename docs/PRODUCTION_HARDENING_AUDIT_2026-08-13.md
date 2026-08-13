# BRIX Production Hardening Audit — 2026-08-13

## Status

This checkpoint was created before Specification 009 so BRIX does not carry hidden architecture divergence into FinanceIQ.

Current disposition: **core web production gate hardened; canonical authority gaps identified in the audit have been contained. FinanceIQ remains gated until the latest production workflow is green and the database migration is applied to the target Supabase environment.**

## Resolved in this hardening pass

### 1. Verification gate now includes lint and authority checks

`npm run verify` now requires:

1. TypeScript typecheck
2. ESLint
3. BRIX production authority guard
4. Full Vitest suite
5. Production build

A GitHub Actions workflow runs this gate on pushes and pull requests targeting `main`.

### 2. Production environment configuration fails closed

The web Supabase client no longer silently falls back to the production BRIX project when environment variables are missing. Tests use an isolated local placeholder configuration. Development, preview, and production builds must provide their intended Supabase URL and publishable key explicitly.

The environment template no longer embeds the production project as the default example.

### 3. Legacy `analyze-deal` decision authority retired

The old Supabase Edge Function no longer calculates confidence, readiness, strategy scores, or recommendations. It rejects callers and points them to the canonical underwriting, strategy, and Decision Cockpit contracts.

This removes a competing calculation path that could drift from Specifications 005–007.

### 4. Native iOS Deal persistence moved behind canonical RPCs

The native service no longer reads or writes Deal state through the direct legacy `rest/v1/brix_deals` endpoint.

Native cloud operations now use canonical boundaries including:

- `ensure_workspace_context`
- `list_deal_projection`
- `load_deal_detail_projection`
- `create_canonical_deal`
- `update_canonical_deal`
- `archive_deal`

This restores workspace scope, version checks, idempotency, archive semantics, and canonical Deal/Property projections to the native path.

### 5. Native DealIQ stopped presenting a second underwriting/strategy engine

The native Decision Cockpit previously declared a read-only source boundary while still invoking local underwriting, confidence, DSCR, strategy ranking, and recommendation calculations.

That contradiction is removed. The native DealIQ surface now presents captured facts, strategy intent, verification completeness, and evidence without presenting locally calculated confidence, ranking, or recommendation as canonical BRIX output.

The production authority guard scans native Swift presentation code and fails CI if a view reintroduces the duplicate `state.analysis(...)` path.

### 6. Canonical Deal fact ownership hardened at the database boundary

A migration adds a normalization trigger to `brix_deals.facts` so flexible JSON cannot become a second owner for first-class identity, lifecycle, Property, source, strategy, or verification fields.

The canonical columns and projections remain authoritative; flexible `facts` remains available for analytical and intake fields that do not have first-class ownership.

## Production authority invariants now enforced

The repository-level authority guard fails when any of these conditions return:

- web runtime contains a silent production Supabase fallback
- `npm run verify` omits lint or the authority guard
- native iOS uses the direct legacy Deal table endpoint
- native presentation invokes the duplicate local analysis method
- native DealIQ presents locally calculated confidence/strategy rank as canonical
- the legacy `analyze-deal` function resumes independent strategy/decision math

## Required deployment sequencing

1. Confirm the latest `BRIX Production Gate` workflow is green on `main`.
2. Apply pending Supabase migrations to the intended non-production environment first.
3. Smoke-test canonical Deal create, update, list/detail, archive, sign-in restore, and native cloud sync.
4. Promote the migration to production only after the non-production smoke test passes.
5. Do not begin FinanceIQ implementation until the above gate remains green.

## Native build gate

The checked-in native project already includes `ios/BRIXRealEstateiOS/scripts/verify-ios-project.sh`, which performs project identity checks and an iOS Simulator build through Xcode.

A hosted macOS GitHub Actions job is intentionally not enabled by this hardening pass because hosted macOS minutes can introduce additional CI cost. Run the script on the Mac release machine before every native release, or add a macOS CI job when that recurring cost is explicitly accepted.

## Production rule

BRIX may have multiple presentation clients, but it may not have multiple silent authorities for the same business truth. Data identity, lifecycle, underwriting, strategy, market intelligence, and downstream projections must each have one explicit canonical owner with versioned contracts and fail-closed boundaries.
