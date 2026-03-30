# BRIQ Technical Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   React 18 +    │  │   shadcn/ui +   │  │  React Query    │             │
│  │   TypeScript    │  │   Tailwind CSS  │  │   (TanStack)    │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   Supabase      │  │  Edge Functions │  │   Realtime      │             │
│  │   REST API      │  │  (Deno Runtime) │  │   Subscriptions │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   PostgreSQL    │  │   Row Level     │  │   File Storage  │             │
│  │   Database      │  │   Security      │  │   (Images)      │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL SERVICES                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   Stripe        │  │   Lovable AI    │  │   County APIs   │             │
│  │   (Payments)    │  │   (Extraction)  │  │   (Property)    │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tooling |
| Tailwind CSS | 3.x | Styling |
| shadcn/ui | Latest | Component library |
| TanStack Query | 5.x | Server state management |
| React Router | 6.x | Client routing |
| Recharts | 2.x | Data visualization |

### Backend
| Technology | Purpose |
|------------|---------|
| PostgreSQL | Primary database |
| Edge Functions | Serverless compute |
| Row Level Security | Data isolation |
| Realtime | Live subscriptions |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Lovable Cloud | Hosting, CDN, auto-scaling |
| Stripe | Payment processing |
| Lovable AI | LLM inference |

---

## Database Schema

### Core Tables

```sql
-- User profiles with subscription state
profiles
├── id (uuid, PK, references auth.users)
├── subscription_status (text)
├── stripe_customer_id (text)
├── stripe_subscription_id (text)
├── free_deal_used (boolean)
└── created_at (timestamptz)

-- Property deals
deals
├── id (uuid, PK)
├── user_id (uuid, FK → auth.users)
├── property_address (text)
├── city, state, zip_code (text)
├── purchase_price, arv, rehab_cost (numeric)
├── monthly_rent, taxes, insurance (numeric)
├── loan terms (down_payment_percent, interest_rate, etc.)
├── operating expenses (vacancy, maintenance, etc.)
├── deal_status (text)
└── created_at (timestamptz)

-- Market intelligence per deal
market_conditions
├── id (uuid, PK)
├── deal_id (uuid, FK → deals)
├── user_id (uuid, FK → auth.users)
├── city, state, zipcode (text)
├── price_growth_12mo, price_growth_36mo (numeric)
├── rent_growth_12mo, rent_growth_36mo (numeric)
├── days_on_market, inventory_level (numeric)
├── market_strength_score (numeric)
├── demand_pressure_score (numeric)
├── crime_score (numeric)
└── created_at (timestamptz)

-- Role-based access control
user_roles
├── id (uuid, PK)
├── user_id (uuid, FK → auth.users)
└── role (app_role enum: admin, moderator, user)

-- Administrative audit trail
admin_audit_log
├── id (uuid, PK)
├── admin_user_id (uuid)
├── target_user_id (uuid)
├── action_type (text)
├── details (jsonb)
└── created_at (timestamptz)
```

### Row Level Security

All tables implement RLS policies:
- Users can only read/write their own data
- Admin role bypass via `has_role()` function
- Privileged fields protected from self-update

---

## Intelligence Engines

### Location: `src/lib/`

| File | Engine | Responsibility |
|------|--------|----------------|
| `dataSourceLayer.ts` | Data Source Layer | Canonical data orchestration & sourced value types |
| `normalizedDealState.ts` | Normalized Deal State | Single source of truth for deal data & input sufficiency |
| `dealAnalysisEngine.ts` | Deal Analysis | Financial KPI calculations |
| `dealIntelligenceEngine.ts` | Deal Intelligence | Composite scoring |
| `marketIntelligenceEngine.ts` | Market Intelligence | Location-based signals |
| `strategyFitEngine.ts` | Strategy Fit | Investment strategy alignment |
| `stressTestingEngine.ts` | Stress Testing | Scenario modeling |
| `reportEngine.ts` | Report Generation | PDF/CSV export |
| `property/propertyIntelligenceEngine.ts` | Property Intelligence | County record resolution |

### Canonical Data Flow (v1.5.3)

```
dataSourceLayer → normalizedDealState → canonicalEngineLayer → UI
```

- **dataSourceLayer** (`dataSourceLayer.ts`): Defines `SourcedValue<T>` types that distinguish `user_input`, `extracted`, `county_record`, `market_data`, `calculated`, and `unavailable` origins
- **Resolvers** (`resolvers/`): `propertyDataResolver`, `rentDataResolver`, `financingDataResolver` — normalize raw data into `SourcedValue` objects
- **normalizedDealState** (`normalizedDealState.ts`): Builds the canonical deal object from DB rows; supports market data enrichment via `enrichWithMarketData()` and field updates via `updateFinancialFields()`
- **canonicalEngineLayer** (`canonicalEngineLayer.ts`): Single orchestration point — derives `DealInput`, `MarketConditions`, and `StrategyFitInput` from `NormalizedDealState`, then runs all engines via `runCanonicalAnalysis()`. No analytical engine is called directly from UI components.
- **Input Sufficiency**: Analysis sections are gated — if required inputs (purchase price, monthly rent) are missing, clean "awaiting data" states are shown instead of misleading zero-input outputs

---

## Edge Functions

### Location: `supabase/functions/`

| Function | Purpose |
|----------|---------|
| `extract-deal-from-text` | AI extraction from listing text |
| `extract-deal-from-image` | AI extraction from screenshots |

### Execution
- Deno runtime
- Auto-deployed on commit
- Secrets managed via Lovable Cloud

---

## Security Model

### Authentication
- Email/password with verification required
- Session management via Supabase Auth
- JWT tokens for API access

### Authorization
- Row Level Security on all tables
- Role-based admin access via `user_roles`
- Privileged field protection (subscription, admin flags)

### Audit
- Admin actions logged to `admin_audit_log`
- Immutable audit trail

---

## Scalability

### Current Architecture Limits
| Resource | Limit | Mitigation |
|----------|-------|------------|
| Database connections | 100 | Connection pooling |
| Edge function timeout | 60s | Async processing |
| File storage | 1GB | CDN caching |

### Scaling Path
1. **Vertical:** Upgrade instance size
2. **Horizontal:** Read replicas, edge caching
3. **Architectural:** Dedicated infrastructure at scale

---

*Last Updated: March 2026 — v1.5.1 Data Foundation Patch*
