# BRIX Production Hardening Audit — 2026-08-13

## Status

This checkpoint was created before Specification 009 so BRIX does not carry hidden architecture divergence into FinanceIQ.

Current disposition: **repository production hardening is materially stronger and the dependency/XLSX migration has passed the full verification suite in the controlled refresh job. FinanceIQ remains gated until the normal BRIX Production Gate is green on the final `main` state and the pending database migration is staged, smoke-tested, and promoted deliberately.**

## Resolved in this hardening pass

### 1. Verification gate now includes lint, authority, and production dependency security checks

`npm run verify` now requires:

1. TypeScript typecheck
2. ESLint
3. BRIX production authority guard
4. Production dependency audit at high severity or above
5. Full Vitest suite
6. Production build

A GitHub Actions workflow runs this gate on pushes and pull requests targeting `main` using current GitHub Actions runtimes.

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

The native create/update path also distinguishes a missing canonical Deal from an actual command failure so first-time creation can proceed safely.

This restores workspace scope, version checks, idempotency, archive semantics, and canonical Deal/Property projections to the native path.

### 5. Native DealIQ, OfferIQ, and Reports stopped presenting a second calculation authority

Native presentation surfaces no longer call the local `state.analysis(...)` path to manufacture underwriting confidence, DSCR, strategy ranking, report conclusions, or offer pricing independently from canonical BRIX output.

The native DealIQ surface presents captured facts, strategy intent, verification completeness, and evidence. OfferIQ and Reports preserve the Deal record and canonical-boundary messaging instead of inventing device-side terms or decision output.

The production authority guard scans native Swift presentation code and fails CI if a view reintroduces the duplicate `state.analysis(...)` path.

### 6. Canonical Deal fact ownership hardened at the database boundary

A migration adds a normalization trigger to `brix_deals.facts` so flexible JSON cannot become a second owner for first-class identity, lifecycle, Property, source, strategy, or verification fields.

The canonical columns and projections remain authoritative; flexible `facts` remains available for analytical and intake fields that do not have first-class ownership.

### 7. Production dependency exposure reduced and permanently gated

The production audit surfaced vulnerable dependencies that the previous build gate did not detect. The hardening pass now blocks high/critical production dependency findings.

The vulnerable SheetJS `xlsx` dependency and unused `pdfjs-dist` package were removed. Workbook export no longer depends on SheetJS. Package/batch XLSX intake now uses a narrow BRIX-owned reader backed only by ZIP decompression primitives, with explicit limits on archive entry count, declared uncompressed size, worksheet count, row count, and cells per row before content becomes intake data.

The XLSX reader validates the ZIP central directory before decompression, rejects malformed workbook XML, resolves only worksheet relationship targets under the expected workbook path, and bounds parsed worksheet content. Tests build a minimal XLSX package without depending on the removed spreadsheet library.

The web toolchain was also advanced as a compatible set: Vite, its React SWC plugin, React Router, and the PWA integration were aligned so the repository can install cleanly without peer-dependency overrides while retaining the production dependency audit.

The production authority guard now also requires the production audit to remain in `npm run verify` and explicitly rejects reintroduction of `xlsx` or `pdfjs-dist` without a deliberate security review.

### 8. One-time dependency migration was verified before commit

The controlled dependency/XLSX refresh did not commit changes until the complete production verification command passed. That verification included typecheck, lint, authority invariants, production dependency audit, the full test suite, and the production build.

One-time write-enabled migration workflow logic is not part of the normal release path. Ongoing verification authority remains the read-only `BRIX Production Gate`.

## Production authority invariants now enforced

The repository-level authority guard fails when any of these conditions return:

- web runtime contains a silent production Supabase fallback
- `npm run verify` omits lint, the authority guard, or the production dependency audit
- prohibited spreadsheet/PDF dependencies are silently reintroduced
- native iOS uses the direct legacy Deal table endpoint
- native canonical upsert loses first-create handling
- native presentation invokes the duplicate local analysis method
- native DealIQ presents locally calculated confidence/strategy rank as canonical
- the legacy `analyze-deal` function resumes independent strategy/decision math

## Required deployment sequencing

1. Confirm the latest normal `BRIX Production Gate` workflow is green on the final `main` state.
2. Apply pending Supabase migrations to the intended non-production environment first.
3. Smoke-test canonical Deal create, update, list/detail, archive, sign-in restore, native cloud sync, report export, XLSX/CSV package intake, and authentication recovery.
4. Exercise malformed/oversized intake rejection and confirm safe user-facing failure behavior.
5. Promote the migration to production only after the non-production smoke test passes.
6. Do not begin FinanceIQ implementation until the above gate remains green.

## Native build gate

The checked-in native project already includes `ios/BRIXRealEstateiOS/scripts/verify-ios-project.sh`, which performs project identity checks and an iOS Simulator build through Xcode.

A hosted macOS GitHub Actions job is intentionally not enabled by this hardening pass because hosted macOS minutes can introduce additional CI cost. Run the script on the Mac release machine before every native release, or add a macOS CI job when that recurring cost is explicitly accepted.

## Production rule

BRIX may have multiple presentation clients, but it may not have multiple silent authorities for the same business truth. Data identity, lifecycle, underwriting, strategy, market intelligence, and downstream projections must each have one explicit canonical owner with versioned contracts and fail-closed boundaries.
