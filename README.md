# BRIX Real Estate

AI-powered real estate investment decision support.

BRIX is a real estate investment operating system under recovery. The current production priority is making DealIQ dependable enough for Ed to evaluate a real property from initial intake through a documented investment decision with reliable saving, correct calculations, clear assumptions, scenario analysis, risk visibility, and no fabricated data.

**Production application:** https://brixrealestate.app

Product intent is controlled by [`BRIX.md`](BRIX.md). Engineering execution rules are controlled by [`AGENTS.md`](AGENTS.md).

## Core Modules

| Module | Purpose |
| --- | --- |
| **DealIQ** | Current production priority: evaluate property facts, financing, costs, income, strategies, risks, scenarios, and decisions |
| **ContractIQ** | Reviews contracts and related documents without presenting legal advice; must not delay DealIQ completion |
| **FindIQ** | Deferred discovery/intake support until DealIQ is dependable |
| **OfferIQ** | Deferred transaction execution layer |
| **PipelineIQ** | Deferred acquisition workflow layer |
| **PortfolioIQ** | Deferred owned-asset intelligence layer |
| **Reports** | Deferred exports based on verified DealIQ records |

## Technology Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **UI** | shadcn/ui, Radix primitives, lucide-react |
| **Backend** | Supabase Postgres, Auth, Storage, Edge Functions |
| **Native iOS** | SwiftUI client consuming the same BRIX backend |
| **Deployment** | Vercel for web, Supabase for backend services |
| **AI/Data Providers** | Provider-adapter architecture through Supabase Edge Functions |

## Local Development

Use the repo-local wrapper on Windows so BRIX does not depend on broken global PATH settings:

```powershell
.\scripts\toolchain-check.cmd
.\scripts\brix.cmd dev
.\scripts\brix.cmd test
.\scripts\brix.cmd build
```

The wrapper uses the bundled Node runtime, the local `node_modules` binaries, the Supabase CLI shim, and the checked-in Supabase Go binary path.

## Environment Configuration

Create `.env.local` for local web development:

```env
VITE_SUPABASE_URL=https://luwaqrkhmxcqsozmilbw.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<supabase-publishable-or-anon-key>
```

Server-side provider keys belong in Supabase Edge Function secrets, never in browser-visible `VITE_` variables:

```bash
supabase secrets set FRED_API_KEY=<fred-key>
supabase secrets set CENSUS_API_KEY=<census-key>
supabase secrets set BLS_API_KEY=<bls-key>
supabase secrets set OPENAI_API_KEY=<openai-key>
```

Apple account deletion token revocation requires these Supabase secrets when Sign in with Apple token material is available:

```bash
supabase secrets set APPLE_CLIENT_ID=<service-id-or-bundle-id>
supabase secrets set APPLE_TEAM_ID=<apple-team-id>
supabase secrets set APPLE_KEY_ID=<apple-key-id>
supabase secrets set APPLE_PRIVATE_KEY=<private-key>
```

## Backend

Database migrations live in:

```text
supabase/migrations
```

Edge Functions live in:

```text
supabase/functions
```

Apply migrations and deploy functions from Supabase CLI or the connected CI/CD process:

```powershell
supabase link --project-ref luwaqrkhmxcqsozmilbw
.\scripts\brix.cmd supabase-push
supabase functions deploy
```

## Native iOS

The iOS app lives in:

```text
ios/BRIXRealEstateiOS
```

The native app is not a separate product. It consumes the same Supabase backend, account controls, privacy policy, field-capture storage, DealIQ decision snapshots, and user-owned deal records as the web application.

Apple compliance artifacts include:

- In-app account deletion
- Sign in with Apple
- Privacy policy link
- Privacy manifest
- Camera, photo library, microphone, document, and location usage descriptions

## Verification

Primary checks:

```powershell
.\scripts\brix.cmd verify
```

Before production release, also verify:

- Supabase migrations applied
- Edge Functions deployed
- Auth sign-in/sign-out
- Account deletion
- Deal create/edit/read
- DealIQ analysis and scenario comparison
- Assumption edits recalculate results
- Evidence, notes, photos, and documents preserve source status
- Report export
- Custom domain cache behavior

## License

Proprietary. Copyright InLight AI. All rights reserved.
