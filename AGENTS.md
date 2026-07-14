# BRIX Repository Instructions

BRIX Real Estate is intended to be a production real estate investment application, not a prototype, mockup, or landing-page demo. Treat the repository as an existing application under recovery. Preserve current Git history and working behavior.

## Product Authority

- `BRIX.md` is the canonical product intent for this repo.
- DealIQ is the current production priority until a real property can be evaluated from intake through documented decision without developer intervention.
- FindIQ, ContractIQ, PipelineIQ, OfferIQ, PortfolioIQ, iOS enhancements, and commercial expansion must not distract from completing the dependable DealIQ workflow.
- If existing implementation conflicts with `BRIX.md`, stop and report the conflict before silently changing product behavior.
- Before changing code, read `BRIX.md`, this file, and the source files for the affected flow.

## Confirmed Stack

- Web: React 18, TypeScript, Vite.
- Styling: Tailwind/shadcn-era dependencies plus `src/styles/app.css`.
- Backend: Supabase Auth, Postgres, Storage assumptions, Edge Functions.
- iOS: native SwiftUI project at `ios/BRIXRealEstateiOS`.
- Deployment: Vercel config in `vercel.json`.
- Package lock: `package-lock.json` exists; repo wrapper currently uses pnpm in `scripts/brix.ps1`.

## Confirmed Commands

Use repo scripts first:

- `.\scripts\brix.cmd install`
- `.\scripts\brix.cmd typecheck`
- `.\scripts\brix.cmd test`
- `.\scripts\brix.cmd build`
- `.\scripts\brix.cmd verify`

The wrapper does not expose lint. If lint is needed, run the existing ESLint binary directly and report the exact command.

## Repository Map

- Web entry: `src/main.tsx`, `src/App.tsx`.
- Web styles: `src/styles/app.css`.
- Web domain types: `src/core/types.ts`.
- Web Supabase client: `src/core/supabase.ts`.
- Web deal persistence: `src/core/store.ts`.
- Web listing parser: `src/core/listingParser.ts`.
- Web DealIQ calculations: `src/core/underwriting.ts`.
- Web strategy catalog: `src/core/strategyCatalog.ts`.
- Web tests: `src/test`.
- Supabase migrations: `supabase/migrations`.
- Supabase Edge Functions: `supabase/functions`.
- iOS app: `ios/BRIXRealEstateiOS/BRIXRealEstateiOS`.
- iOS Supabase boundary: `ios/BRIXRealEstateiOS/BRIXRealEstateiOS/Services.swift`.
- iOS state and calculations: `ios/BRIXRealEstateiOS/BRIXRealEstateiOS/AppState.swift`.

## Current Authority Caveat

Some responsibilities have competing implementations. Do not assume any location is canonical until the recovery baseline or a later contained task proves it.

Known unresolved authority conflicts include:

- Web parser vs Supabase `extract-listing`.
- Web DealIQ calculations vs Supabase `analyze-deal`.
- Web DealIQ calculations vs iOS `AppState.analysis`.
- Browser localStorage deal storage vs Supabase `brix_deals`.

## Non-Negotiable Rules

- Follow the development priority in `BRIX.md`: accurate inputs, reliable save/reopen, authoritative calculations, clear results/risk, scenarios, then evidence.
- Read the repo before editing.
- Do not restart BRIX from scratch.
- Do not add duplicate implementations.
- Identify the existing source of truth before creating or modifying another parser, calculator, validation model, persistence model, or mobile equivalent.
- Keep deterministic formulas outside presentation components.
- Do not add mock, sample, fabricated, or hardcoded success behavior to make screens appear functional.
- Do not expose service-role keys or private secrets in browser or iOS client code.
- Do not weaken authentication, authorization, validation, or RLS to make UI pass.
- Do not change database migrations casually. New schema changes require a forward migration and an explicit rollback/verification note.
- Do not claim production readiness.
- Do not present filename, URL, metadata, or alt-text matching as real image analysis.
- Distinguish verified facts from inferred behavior.
- Do not claim a command passed unless it was run and returned a passing result.
- Do not change unrelated files.

## Required Verification

For code changes, run the smallest relevant checks and report exact commands/results. For release-impacting changes, attempt:

- Typecheck
- Lint
- Tests
- Production build
- Relevant Supabase migration/function verification
- iOS verification when a Mac/Xcode environment is available

If iOS cannot be built locally, state that plainly.

## Definition of Done

A task is done only when:

- Scope stayed contained.
- Existing behavior was preserved or intentionally changed.
- Affected data path was traced.
- Required checks were attempted.
- Failures and unverified areas were reported honestly.
- No unrelated files were changed.
