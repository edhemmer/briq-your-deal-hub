## Goal

Turn `/dealiq/:id` (Analysis.tsx, 1,654 lines, everything dumped on one scroll) into a **professional underwriting workspace** with a clear hierarchy, tabbed structure, and tiered depth (Solo → Mid-market → Institutional).

Per your two-step protocol, this plan proposes the full target architecture but **we ship one phase per request** so we don't cross-contaminate modules.

---

## Target architecture

### Sticky Verdict Header (always visible)
- Deal name + address · status pill
- **Verdict chip**: PROCEED / CAUTION / PASS (from DealGuidance)
- 4 KPI tiles: Cap Rate · Cash-on-Cash · DSCR · Levered IRR (5-yr)
- Confidence badge · Tier toggle (Simple / Pro / Institutional)
- Actions: Save, Export PDF, Export XLSX

### Left rail: workflow steps
```text
1. Property      ●  complete
2. Inputs        ●  complete
3. Context       ◐  needs market+strategy
4. Analysis      ○  locked until 3
5. Reports       ○
```

### Main area: tabs
| Tab | Tier | Contents |
|---|---|---|
| **Overview** | All | Verdict, KPI grid, interpretation, top 3 risks, top 3 strengths |
| **Property** | All | Address, public record, conflicts, GuidedPropertyRetrieval |
| **Inputs** | All | Grouped: Acquisition · Rehab · Financing · Income · OpEx (current form, cleaner) |
| **Pro Forma** | Pro+ | T-12 income, OpEx by category, NOI bridge, OpEx ratio, expense per unit |
| **Returns** | Pro+ | 5/10-yr hold model: NOI, CF, DSCR, debt yield · Levered/Unlevered IRR · Equity Multiple · AAR · CoC year-by-year |
| **Sensitivity** | Pro+ | 2-D matrices (cap×rent, rate×price, vacancy×rent) · tornado chart · break-even table |
| **Capital Stack** | Inst | Sources & Uses · GP/LP split · Pref return · Promote waterfall tiers · Sponsor economics |
| **Financing** | All | FinancingIntelligence (existing) + agency/HUD/CMBS structures |
| **Market & Risk** | All | MarketOutlook + HiddenRiskPanel side-by-side |
| **Reports** | All | PDF + new XLSX investor model |

### Tier toggle behavior
- **Simple**: Overview · Property · Inputs · Financing · Market & Risk · Reports
- **Pro** adds: Pro Forma · Returns · Sensitivity
- **Institutional** adds: Capital Stack + waterfall

Stored on the user profile (preference), defaults to Simple.

---

## New deterministic engines (no AI — per memory rule)

- `src/lib/underwriting/proFormaEngine.ts` — T-12 NOI, OpEx categorization, NOI bridge, OpEx ratio, per-unit metrics
- `src/lib/underwriting/returnsEngine.ts` — N-year cash flow projection, levered/unlevered IRR (Newton-Raphson), Equity Multiple, AAR, year-by-year CoC
- `src/lib/underwriting/sensitivityEngine.ts` — 2-D matrices, tornado deltas, break-evens (occupancy, rent, exit cap)
- `src/lib/underwriting/waterfallEngine.ts` — European/American waterfall: return of capital → pref → catch-up → promote tiers
- `src/lib/underwriting/sourcesUsesEngine.ts` — capital stack composition + LTV/LTC checks
- All pure functions, fully unit-testable, conservative-bias on missing inputs (truthful partial degradation)

---

## Phased delivery (one per request — your protocol)

**Phase 1 — Workspace shell + Overview tab** (recommended first)
Refactor Analysis.tsx into a tabbed shell with sticky Verdict header, left-rail workflow, and tier toggle. Migrate existing panels into the new tabs without changing their logic. Pure UX restructure — zero engine changes. This alone solves the "busy/disorganized" complaint.

**Phase 2 — Pro Forma + Returns engines + tabs**
Build `proFormaEngine` + `returnsEngine`, add Pro Forma and Returns tabs with year-by-year tables.

**Phase 3 — Sensitivity tab + engine**
2-D matrices, tornado, break-evens.

**Phase 4 — Capital Stack + Waterfall (Institutional tier)**
Sources & Uses editor, GP/LP waterfall, promote tiers.

**Phase 5 — XLSX investor model export**
Full Excel pro forma using the xlsx skill — blue inputs / black formulas / green cross-sheet links, recalculated and audited.

---

## Recommendation

Start with **Phase 1 (workspace shell)** — it directly fixes the "doesn't make sense, busy, not well organized" complaint without touching any analysis logic, so there's no regression risk to the existing engines. Confirm and I'll implement Phase 1 only.