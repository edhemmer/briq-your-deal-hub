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
| **Backend** | Lovable Cloud (Supabase/PostgreSQL) |
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

Environment variables are managed automatically by Lovable Cloud. For local development, create `.env.local`:

```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
```

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

**Frontend:** Publish via Lovable dashboard (Settings → Publish)

**Backend:** Edge functions and database migrations deploy automatically on commit.

**Custom Domain:** Configure in Project → Settings → Domains

---

## Documentation

- **[INVESTOR_OVERVIEW.md](./INVESTOR_OVERVIEW.md)** — Business overview and roadmap for stakeholders
- **[Lovable Docs](https://docs.lovable.dev)** — Platform documentation

---

## License

Proprietary. © InLight AI. All rights reserved.
