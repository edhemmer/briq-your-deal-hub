# BRIQ — Real Estate Deal Intelligence Platform

## Investor Overview & Technical Specification

**Version:** 1.0  
**Last Updated:** March 2026  
**Classification:** Confidential

---

## 1. Executive Summary

**BRIQ** is a vertical SaaS platform that transforms real estate deal analysis from a manual, error-prone process into an automated intelligence workflow. The platform targets individual investors and small teams who evaluate rental properties, fix-and-flip opportunities, and BRRRR deals.

**Core Value Proposition:**  
> *Stop the information chaos. Get deal clarity.*

Investors currently spend 2-4 hours per deal gathering data, building spreadsheets, and researching markets. BRIQ reduces this to under 10 minutes with higher accuracy and consistency.

---

## 2. Market Opportunity

| Metric | Value |
|--------|-------|
| US Real Estate Investors (active) | 10.6M+ |
| Average Deals Evaluated / Year | 50-200 per investor |
| Time Spent on Manual Analysis | $75-150/hour equivalent |
| Addressable Market (TAM) | $2.4B annually |

**Pain Points Addressed:**
- Fragmented tools (spreadsheets, county sites, market reports)
- Inconsistent analysis methodology across deals
- Time-intensive data entry from listings
- Lack of standardized risk assessment

---

## 3. Product Architecture

### 3.1 Intelligence Engines

BRIQ operates seven interconnected analysis engines:

| Engine | Function | Output |
|--------|----------|--------|
| **Deal Analysis** | Core financial calculations | Cap Rate, CoC Return, DSCR, Cash Flow |
| **Deal Intelligence** | Composite scoring algorithm | 0-100 Deal Score |
| **Market Intelligence** | Location-based market signals | Market Strength Score, Demand Pressure |
| **Strategy Fit** | Investment strategy alignment | Buy & Hold, Flip, BRRRR, Wholesale fit |
| **Stress Testing** | Scenario modeling | Risk tolerance under adverse conditions |
| **Property Intelligence** | County record resolution | Tax records, assessed values, zoning |
| **Report Generation** | Professional documentation | PDF/CSV exports |

### 3.2 Data Input Methods

1. **AI-Powered Extraction** — Paste listing text or upload screenshot; AI extracts structured data
2. **Manual Entry** — Full-control input forms with intelligent defaults
3. **Address Lookup** — Auto-resolution to county property records (16 states supported)

### 3.3 Technical Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Frontend | React 18, TypeScript, Vite | Type safety, fast builds, modern DX |
| Styling | Tailwind CSS, shadcn/ui | Consistent design system, accessibility |
| Backend | Lovable Cloud (Supabase) | Managed PostgreSQL, Edge Functions, Auth |
| AI | Lovable AI (Gemini/GPT models) | No API key management for users |
| Payments | Stripe | Industry standard, subscription billing |
| Hosting | Lovable Cloud | Auto-scaling, global CDN |

### 3.4 Security Model

- **Row Level Security (RLS):** All database tables enforce user-scoped data access
- **Role-Based Access Control:** Separate admin/user permissions via `user_roles` table
- **Authentication:** Email/password with email verification required
- **Audit Logging:** Administrative actions tracked in `admin_audit_log`

---

## 4. Current Feature Set (V1)

### Deal Management
- ✅ Create, edit, delete deals
- ✅ Deal status workflow (Active, Under Contract, Won, Lost, Archived)
- ✅ Deal image uploads
- ✅ AI extraction from listing text
- ✅ AI extraction from listing screenshots

### Financial Analysis
- ✅ Purchase price, rehab cost, ARV inputs
- ✅ Loan terms (down payment %, interest rate, term)
- ✅ Operating expenses (taxes, insurance, maintenance, management, CapEx, vacancy)
- ✅ Automated KPI calculations (Cap Rate, CoC, DSCR, Monthly Cash Flow)

### Intelligence & Scoring
- ✅ Deal Intelligence Score (0-100)
- ✅ Market Strength Score
- ✅ Demand Pressure Score
- ✅ Crime Risk Signal (0-10)
- ✅ Strategy Fit indicators

### Market Data
- ✅ Price growth trends (12mo, 36mo)
- ✅ Rent growth trends
- ✅ Days on market
- ✅ Inventory levels
- ✅ Sale-to-list ratio

### Stress Testing
- ✅ Interest rate increase scenarios
- ✅ Vacancy rate increase scenarios
- ✅ Rent decrease scenarios
- ✅ Break-even analysis

### Reporting
- ✅ PDF report generation (jsPDF)
- ✅ Multi-section reports (analysis, intelligence, strategy, stress test)

### Platform
- ✅ User authentication (email/password)
- ✅ Freemium model (1 free deal)
- ✅ Stripe subscription integration
- ✅ Admin dashboard with user management
- ✅ Help system with contextual tooltips
- ✅ Responsive design (desktop/mobile)

---

## 5. Monetization Model

### Pricing Structure

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 1 deal analysis (full features) |
| **Premium** | $155.99/month | Unlimited deals, all features |

### Revenue Projections (Conservative)

| Metric | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| Free Users | 5,000 | 15,000 | 35,000 |
| Conversion Rate | 3% | 4% | 5% |
| Paying Subscribers | 150 | 600 | 1,750 |
| Monthly Revenue | $23K | $94K | $273K |
| Annual Revenue | $280K | $1.1M | $3.3M |

---

## 6. Competitive Landscape

| Competitor | Weakness | BRIQ Advantage |
|------------|----------|----------------|
| Excel/Sheets | Manual, error-prone, no market data | Automated extraction, integrated intelligence |
| DealCheck | Limited market intelligence | 7-engine analysis, stress testing |
| REI Hub | Portfolio-focused, not deal analysis | Purpose-built for deal evaluation |
| BiggerPockets Calculator | Basic calculations only | AI extraction, strategy fit, scoring |

---

## 7. Product Roadmap

### Phase 2 — Q2 2026
- [ ] PropTech API integration (automated property data)
- [ ] Live rent comps from market APIs
- [ ] Enhanced county coverage (all 50 states)
- [ ] Mobile-optimized deal entry

### Phase 3 — Q3 2026
- [ ] Portfolio tracking dashboard
- [ ] Actual vs. projected performance
- [ ] Deal comparison tools
- [ ] Saved search templates

### Phase 4 — Q4 2026
- [ ] Team workspaces
- [ ] Deal sharing with partners/lenders
- [ ] Comment and collaboration features
- [ ] White-label reporting

### Phase 5 — 2027
- [ ] MLS integration partnerships
- [ ] Automated deal sourcing alerts
- [ ] Lending partner integrations
- [ ] Mobile native applications

---

## 8. Team & Resources

**Development:** Lovable AI-assisted development with human oversight  
**Infrastructure:** Fully managed via Lovable Cloud  
**Support:** In-app help system, documentation

---

## 9. Investment Use of Funds

| Category | Allocation |
|----------|------------|
| API Integrations (PropTech) | 35% |
| Marketing & User Acquisition | 30% |
| Feature Development | 25% |
| Operations & Support | 10% |

---

## 10. Key Metrics & KPIs

| Metric | Current | Target (12mo) |
|--------|---------|---------------|
| Registered Users | — | 5,000 |
| Free-to-Paid Conversion | — | 3% |
| Monthly Churn | — | <5% |
| Average Session Duration | — | 8+ minutes |
| Deals Analyzed / User | — | 4+/month |

---

## Contact

**Platform:** [briq-ai.lovable.app](https://briq-ai.lovable.app)  
**Built by:** InLight AI

---

*This document is confidential and intended for investor review only. All projections are forward-looking estimates based on market analysis and are not guarantees of future performance.*
