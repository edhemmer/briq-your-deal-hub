# BRIX Repository Instructions

BRIX Real Estate is intended to be a production real estate investment application, not a prototype, mockup, or landing-page demo. Treat the repository as an existing application under recovery. Preserve current Git history and working behavior.

## Product Authority

- `docs/constitution/00-constitution-index.md` is the governing entry point for product and engineering authority.
- The files under `docs/constitution/` collectively form the BRIX Product Constitution and Engineering Standard.
- Before changing code, read this file, the constitution index, every constitution file directly relevant to the requested work, and the source files for the affected flow.
- If implementation conflicts with the constitution, stop and report the conflict before silently changing product behavior.
- DealIQ remains the first production workflow priority until a real property can be evaluated from intake through documented decision without developer intervention.
- FindIQ, ContractIQ, PipelineIQ, OfferIQ, PortfolioIQ, native iOS enhancements, and commercial expansion must not destabilize the dependable DealIQ workflow.

## Confirmed Stack

- Web: React 18, TypeScript, Vite.
- Styling: Tailwind/shadcn-era dependencies plus `src/styles/app.css`.
- Backend: Supabase Auth, Postgres, Storage assumptions, Edge Functions.
- iOS: native SwiftUI project at `ios/BRIXRealEstateiOS`.
- Deployment: Vercel config in `vercel.json`.
- Package lock: `package-lock.json` exists; repo wrapper currently uses pnpm in `scripts/brix.ps1`.

## Confirmed Commands

Use repo scripts first:

- `./scripts/brix.cmd install`
- `./scripts/brix.cmd typecheck`
- `./scripts/brix.cmd test`
- `./scripts/brix.cmd build`
- `./scripts/brix.cmd verify`

The wrapper