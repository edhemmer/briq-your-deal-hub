# BRIX Pre-FinanceIQ Production Alignment Audit

Date: 2026-08-13
Repository: `edhemmer/briq-your-deal-hub`
Branch audited: `main`
Purpose: verify Specifications 001–008 and the surrounding runtime architecture against the aligned BRIX governing package before Specification 009 FinanceIQ begins.

## 1. Audit Decision

**STATUS: NOT READY FOR SPECIFICATION 009**

The current implementation contains substantial, high-quality canonical work across authentication/workspaces, Property/Deal/PDRM, intake/provenance, underwriting, strategy intelligence, Decision Cockpit, and MarketIQ. The repository is not a rebuild candidate.

However, the audit found several material runtime disconnects that must be repaired before FinanceIQ is allowed to build on top of the current foundation. The most important are duplicate calculation authority, native iOS use of the pre-canonical deal store, incomplete production verification gates, and unsafe environment fallback behavior.

These are repairable architecture defects. They should be corrected now while the affected surface is bounded rather than carried into FinanceIQ, GovernanceIQ, ContractIQ, OfferIQ, reporting, and native production.

## 2. Governing Standard

This audit uses the current authority chain defined by:

- `AGENTS.md`
- `docs/00-START-HERE.md`
- `docs/01-PRODUCT-CONSTITUTION.md`
- `docs/02-ENGINEERING-STANDARDS.md`
- `docs/03-DATA-ARCHITECTURE.md`
- `docs/04-UI-UX-SYSTEM.md`
- `docs/05-BUILD-ROADMAP.md`
- `docs/06-SYSTEM-ARCHITECTURE.md`
- `docs/07-UI-DESIGN-SYSTEM.md`
- `docs/08-IMPLEMENTATION-ROADMAP.md`
- `docs/10-CODEX-MASTER-BUILD-PROMPT.md`
- `docs/11-DOCUMENT-CONTROL-AND-READINESS-MATRIX.md`
- `docs/12-INDIVIDUAL-INVESTOR-PRODUCT-REALIGNMENT.md`
- Specifications 001–008

The audit treats the old constitution/corpus/recovery files as historical evidence only.

## 3. What Is Structurally Strong

The following work should be preserved and hardened rather than rebuilt:

1. Canonical Workspace, Property, Deal, relationship, task/deadline, timeline, event, and audit migrations exist.
2. Canonical Deal CRUD uses server RPC boundaries, version checks, and idempotency contracts.
3. Source classification, source conflict handling, duplicate detection, manual intake, listing URL intake, file Evidence intake, email intake, batch intake, and offline draft modules are separated into bounded services.
4. Underwriting has a formula registry, input schemas, validation, immutable snapshot contracts, core outputs, scenarios, report contracts, and extensive golden reconciliation tests.
5. Strategy intelligence is separated into registry, requirements, compatibility, scoring, explanation, reevaluation events, and presentation contracts.
6. Decision Cockpit has separate projection, presentation, and destination contracts with a broad regression suite.
7. MarketIQ is provider-neutral and divided into source ingestion, freshness, hazards, taxes, infrastructure, liquidity, growth, convenience, local risk, and canonical market snapshot contracts.
8. Generated Supabase database types exist and the newer web canonical CRUD path consumes the canonical server contracts.

This is the correct direction for a production product.

## 4. P0 — Duplicate Authoritative Decision and Calculation Paths

### Finding

The repository currently contains more than one active implementation capable of producing Deal decisions, strategy rankings, confidence/readiness values, and financial outputs.

Known paths include:

- `src/core/underwriting.ts`, which calculates Deal analysis and strategy scores locally in the web client.
- The newer Specification 005 underwriting contracts (`formulaRegistry`, snapshots, core outputs, validation, scenarios, report contract).
- `supabase/functions/analyze-deal/index.ts`, which independently calculates a decision, confidence/readiness score, strategy scores, and recommendation language from a simplified formula.
- Native `AppState.swift`, which independently implements Deal analysis, monthly payment/NOI/DSCR behavior, strategy scoring, recommendation logic, missing fields, and decision thresholds.

`src/App.tsx` directly imports and calls `analyzeDeal` from `src/core/underwriting.ts`, proving the legacy web analysis path is still connected to the user experience.

### Risk

This violates the permanent rule that BRIX has one authoritative financial and decision foundation. The same Deal can produce different numbers, confidence, strategy ranking, or recommendation depending on client or endpoint.

FinanceIQ would magnify this defect because debt schedules, lender constraints, and capital-stack changes would have to be duplicated across these paths or would produce contradictory outputs.

### Required Repair

- Declare one canonical execution path for underwriting and strategy evaluation.
- Make web and native clients consume the same versioned authoritative results.
- Remove, retire, or convert `analyze-deal` so it cannot emit an independent result.
- Remove independent financial/strategy calculations from native `AppState.swift`.
- Prevent `src/core/underwriting.ts` from remaining a competing presentation-time authority if the newer snapshot/core-output engine supersedes it.
- Add equivalence/regression tests proving one Deal snapshot produces one result across every supported client projection.

**Gate: BLOCKING**

## 5. P0 — Native iOS Still Uses the Pre-Canonical Deal Persistence Model

### Finding

`ios/BRIXRealEstateiOS/BRIXRealEstateiOS/Services.swift` still reads and writes `rest/v1/brix_deals` directly. It creates its own payload, writes `facts` JSON, soft-deletes directly, and reconstructs a native Deal object from that legacy table.

The current web implementation has moved to canonical Property/Deal RPCs and projections such as `create_canonical_deal`, `update_canonical_deal`, `list_deal_projection`, and `load_deal_detail_projection`.

### Risk

Web and native are not currently using the same persistence authority. This can create two Deal universes, inconsistent IDs/versions, missing workspace scope, missing canonical Property relationships, missing event/audit behavior, and data that one client cannot safely understand from the other.

This is exactly the type of disconnect that becomes expensive once more modules attach to the Deal.

### Required Repair

- Move iOS Deal create/read/update/archive to the same canonical RPC/query contracts used by web.
- Carry `workspace_id`, canonical `property_id`, canonical `deal_id`, versions, verification state, source/provenance, and idempotency keys consistently.
- Preserve offline device drafts as drafts only; they may not become a second server truth model.
- Add cross-client test evidence: create on web → open on iOS; edit on iOS → reopen on web; archive/restore/version conflict behavior reconciles.

**Gate: BLOCKING**

## 6. P0 — Canonical Deal Compatibility Blob Can Become Shadow Truth

### Finding

`src/core/store.ts` currently persists a complete `DealFacts` object into the canonical Deal `facts` JSON while also persisting first-class canonical columns such as strategy, source, address/status-related fields. The code also normalizes values from both row columns and the `facts` object.

The compatibility bridge is understandable during migration, but authority is not yet explicit enough to prevent fields from drifting between the first-class canonical record and the JSON compatibility representation.

### Risk

A later module may read one copy while another writes the other. That creates silent stale values and makes migrations increasingly difficult.

### Required Repair

- Define the `facts` JSON as either a strictly versioned compatibility/read model or a bounded extensible payload, never co-authority for canonical fields.
- Establish field-by-field precedence and write ownership.
- Stop writing duplicated canonical fields into both locations where not required.
- Add a migration/compatibility plan for existing records.
- Add tests that intentionally create conflicting legacy/canonical values and prove the canonical value wins deterministically.

**Gate: BLOCKING before additional canonical modules depend on Deal fields**

## 7. P1 — Production Verification Does Not Include Lint or CI Enforcement

### Finding

`package.json` defines `lint`, but `npm run verify` runs only typecheck, Vitest, and the production build. No `.github/workflows` directory currently exists, and the current `main` commit exposes Vercel deployment status but no repository-level test/type/lint/migration/RLS gate.

### Risk

A commit may reach `main` and deploy while failing lint or without running the full required engineering gate. Migration/RLS regressions and source/runtime mismatches can escape local development.

### Required Repair

- Make `verify` include lint.
- Add repository CI for install integrity, typecheck, lint, unit/regression tests, golden underwriting reconciliation, production build, and targeted architecture/source checks.
- Add safe migration/RLS validation using a non-production/local Supabase test environment when feasible.
- Require the CI gate before production-oriented merges.

**Gate: BLOCKING for production-readiness claims; should be repaired before further implementation**

## 8. P1 — Environment Configuration Can Silently Target Production

### Finding

`src/core/supabase.ts` falls back to the production Supabase URL and publishable key when environment variables are absent or invalid. Native `Services.swift` also hardcodes the production Supabase project URL and publishable key.

The publishable key itself is designed to be public; the defect is environment selection, not secret exposure.

### Risk

A local, test, preview, or misconfigured build can silently operate against production. This creates data contamination and destructive-test risk and defeats the documented local/preview/staging/production separation.

### Required Repair

- Fail fast when required environment configuration is missing for web builds outside an explicitly approved production configuration.
- Add environment identity (`development`, `preview`, `staging`, `production`) and verify expected Supabase project for that environment.
- Move native endpoint/key configuration into build configurations rather than hardcoded production constants.
- Add a visible non-production environment marker where appropriate.
- Add tests preventing test/preview configuration from resolving to production unintentionally.

**Gate: BLOCKING before destructive/live integration testing is expanded**

## 9. P1 — Repository Tooling Is Not Fully Portable

### Finding

The repository wrapper contains machine-specific runtime paths and its verification task does not expose all required production checks consistently.

### Risk

A fresh developer machine, CI runner, or future Codex environment may fail for toolchain reasons rather than repository defects, wasting engineering time and encouraging ad-hoc workarounds.

### Required Repair

- Make the documented package manager and Node invocation portable.
- Prefer repository/local binaries and normal environment discovery over user-specific absolute paths.
- Keep one lockfile/package-manager contract.
- Ensure `verify` behaves identically on a clean supported environment.

**Gate: HIGH PRIORITY**

## 10. P1 — Native Parser Is a Separate Intake Interpretation Path

### Finding

Native `AppState.swift` creates a Deal through `ListingTextParser.parse(...)` before server persistence. The web intake architecture now includes provider-neutral source ingestion, provenance, duplicate detection, conflicts, and explicit proposal/acceptance behavior.

### Risk

The same listing text can produce different fields/classification/provenance on web and iOS. Native-created data may bypass canonical intake review contracts.

### Required Repair

- Native intake should call or consume the same canonical intake contracts as web.
- Device parsing may be used only as an offline draft aid and must be reconciled through canonical intake before becoming server truth.
- Add cross-client fixtures for identical listing input.

**Gate: REQUIRED before native production**

## 11. P2 — Structural Concentration in `src/App.tsx`

### Finding

`src/App.tsx` remains very large and still imports both modern bounded modules and legacy analysis/storage compatibility paths.

### Risk

This increases regression surface and makes it easier to accidentally wire a new module to the wrong authority.

### Required Repair

Do not rewrite the application merely because the file is large. After P0/P1 authority defects are repaired, extract contained workflow/presentation components only where doing so reduces ownership ambiguity and test scope.

**Gate: NOT BLOCKING by size alone**

## 12. Spec-by-Spec Retrofit Status

| Spec | Current audit status | Primary conclusion |
|---|---|---|
| 001 Auth/Workspaces | PASS WITH REPAIR | Foundation exists; environment isolation, CI, and native canonical workspace use require hardening. |
| 002 Dashboard/Shell | PASS WITH REPAIR | Modern shell is present; protect it from legacy analysis/storage imports and verify state/deep-link behavior in CI. |
| 003 Deals/PDRM | NOT YET PASS | Canonical web foundation is strong, but native `brix_deals` and duplicated `facts` authority must be resolved. |
| 004 Intake/Source Tracking | NOT YET PASS | Web intake architecture is strong; native parser and legacy compatibility intake require reconciliation. |
| 005 Deterministic Underwriting | NOT YET PASS | Strong canonical contracts/tests exist, but active legacy web/Edge/native calculations violate single-authority rule. |
| 006 Strategy Intelligence | NOT YET PASS | Strong strategy subsystem exists, but legacy/native scoring paths can disagree with it. |
| 007 Decision Cockpit | PASS WITH REPAIR | Projection architecture is strong; must prove every displayed result consumes canonical 005/006 authority only. |
| 008 MarketIQ | PASS WITH REPAIR | Provider-neutral architecture is strong; final cross-client consumption and downstream proposal boundaries need regression confirmation after authority cleanup. |

## 13. Required Repair Sequence

Repair in this order to minimize rework:

1. **Production gate/tooling:** CI, lint-in-verify, portable commands, environment fail-fast.
2. **Canonical Deal authority:** define compatibility `facts` boundary and prevent duplicated field truth.
3. **Single underwriting/strategy authority:** eliminate independent web Edge/native decision engines.
4. **Native canonical persistence/intake:** move iOS from `brix_deals` and independent parser/calculator authority to canonical Workspace/Property/Deal contracts.
5. **Cross-client reconciliation:** same fixture and same saved Deal across web/native/projections/reports.
6. **Full 001–008 regression:** typecheck, lint, unit, golden, integration, build, migration/RLS tests, live safe Supabase smoke, and static native verification.
7. **Record retrofit PASS evidence.** Only then release Specification 009.

## 14. Cost-Control Rule

Do not perform a broad rewrite.

The canonical work already built is the asset to preserve. Repairs must remove competing authorities and force older compatibility paths behind the new contracts. A rewrite is justified only if a contained subsystem cannot be safely adapted without retaining two sources of truth.

Every repair must include a regression proving that the specific disconnect cannot return.

## 15. Definition of Ready for FinanceIQ

Specification 009 may begin only when:

- one canonical Deal persistence path is used by server-backed web and native workflows;
- one deterministic underwriting result governs all clients and reports;
- one strategy result governs all clients and the Decision Cockpit;
- legacy `analyze-deal` cannot create an independent recommendation;
- native `AppState` no longer owns authoritative financial/strategy calculations;
- compatibility JSON cannot override canonical Deal fields silently;
- environment configuration cannot silently point tests/previews at production;
- `verify` includes lint;
- automated CI is active and passing;
- required safe Supabase/RLS integration verification has evidence;
- Specs 001–008 are reclassified PASS or PASS WITH DOCUMENTED DEFERRED APPLE-ONLY GATES;
- no material hidden disconnect remains between web, Supabase, native, reports, or canonical projections.

Until those conditions are met, BRIX remains on the **pre-FinanceIQ repair gate**.
