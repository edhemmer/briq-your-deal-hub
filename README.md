# BRIQ — Real Estate Deal Intelligence Platform

> **Stop the information chaos. Get deal clarity.**

BRIQ transforms property listings into actionable deal intelligence — financial analysis, market signals, risk scoring, and strategy fit — in minutes instead of hours.

---

## Overview

BRIQ is a modern SaaS platform purpose-built for real estate investors who need fast, reliable deal analysis without the spreadsheet overhead. Drop a listing, get comprehensive intelligence.

**Live Application:** [briq-ai.lovable.app](https://briq-ai.lovable.app)

---

## Core Capabilities

| Module | Description |
|--------|-------------|
| **Deal Analysis Engine** | Cap rate, cash-on-cash return, DSCR, monthly cash flow — calculated instantly from deal inputs |
| **Deal Intelligence Scoring** | Composite 0-100 score combining financials, market conditions, and risk factors |
| **Market Intelligence** | Price trends, rent growth, days on market, supply levels, demand pressure |
| **Strategy Fit Evaluation** | Automated alignment to Buy & Hold, Fix & Flip, BRRRR, or Wholesale strategies |
| **Stress Testing** | Scenario modeling for rate increases, vacancy spikes, and rent compression |
| **Report Generation** | Export-ready PDF reports for partners, lenders, and records |

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **UI Components** | shadcn/ui, Radix primitives |
| **Backend** | Supabase/PostgreSQL, with Lovable Cloud only as an optional deployment/control layer |
| **Authentication** | Email/password with Row Level Security (RLS) |
| **Payments** | Stripe subscription billing |
| **AI Processing** | Lovable AI for listing extraction |

---

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/              # shadcn/ui primitives
│   └── help/            # Contextual help system
├── contexts/            # React context providers
├── hooks/               # Custom React hooks
├── lib/                 # Business logic engines
│   ├── dealAnalysisEngine.ts
│   ├── dealIntelligenceEngine.ts
│   ├── marketIntelligenceEngine.ts
│   ├── strategyFitEngine.ts
│   ├── stressTestingEngine.ts
│   └── property/        # County property lookups
├── pages/               # Route components
└── integrations/        # External service clients

supabase/
├── functions/           # Edge functions (AI extraction)
├── migrations/          # Database schema versions
└── config.toml          # Supabase configuration
```

---

## Local Development

**Prerequisites:** Node.js 18+ (recommend using [nvm](https://github.com/nvm-sh/nvm))

```bash
# Clone repository
git clone <repository-url>
cd briq

# Install dependencies
npm install

# Start development server
npm run dev
```

Application runs at `http://localhost:5173`

---

## Environment Configuration

Environment variables may be managed by Lovable Cloud, Supabase, or another deployment host. For local development, create `.env.local`:

```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
```

### Public data API keys

FRED is used by the `fetch-fred-series` Supabase edge function for mortgage-rate and macroeconomic series such as `MORTGAGE30US`, `FEDFUNDS`, `CPIAUCSL`, `UNRATE`, and `CSUSHPINSA`.

If you are working through Lovable, ask Lovable to add this as a backend / Edge Function secret on the connected Supabase project:

```text
Add a backend secret named FRED_API_KEY for the connected Supabase Edge Functions. Use this exact value: <your-fred-key>. Do not expose it as a VITE_ variable.
```

If you have direct Supabase CLI access, set it as a server-side Supabase secret, not a browser variable:

```bash
supabase secrets set FRED_API_KEY=<your-fred-key>
```

If you have direct Supabase dashboard access but not the CLI, use the dashboard instead:

1. Open the Supabase project dashboard.
2. Go to Project Settings -> Edge Functions -> Secrets.
3. Add a new secret named `FRED_API_KEY`.
4. Paste the FRED key as the value.
5. Save, then redeploy or restart the `fetch-fred-series` edge function if Supabase prompts for it.

For local edge-function testing, include `FRED_API_KEY=<your-fred-key>` in your local env file or pass an env file when serving Supabase functions. Never expose the key with a `VITE_` prefix.

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `deals` | Property deal records with financial inputs |
| `market_conditions` | Market intelligence data per deal/location |
| `profiles` | User profiles with subscription status |
| `user_roles` | Role-based access control (admin/user) |
| `admin_audit_log` | Administrative action tracking |

All tables implement Row Level Security (RLS) for data isolation.

---

## Deployment

**Frontend:** Publish via Lovable dashboard, Vercel, or another static frontend host.

**Backend:** Supabase migrations and Edge Functions live in the `supabase/` folder. If using Supabase GitHub integration, confirm `supabase/config.toml` points to the BRIX-owned Supabase project before enabling production deployment.

**Custom Domain:** Configure in Project → Settings → Domains

---

## Documentation

- **[INVESTOR_OVERVIEW.md](./INVESTOR_OVERVIEW.md)** — Business overview and roadmap for stakeholders
- **[docs/SUPABASE_OWNERSHIP_MIGRATION.md](./docs/SUPABASE_OWNERSHIP_MIGRATION.md)** — Checklist for moving from Lovable-managed backend to BRIX-owned Supabase
- **[Lovable Docs](https://docs.lovable.dev)** — Platform documentation

---

## License

Proprietary. © InLight AI. All rights reserved.
