# BRIX Hard Rules

These rules are mandatory for every BRIX coding session. They exist because BRIX must be treated as one connected production system, not a set of isolated screens.

## 0. Read the Repo First

Before planning or editing, inspect the current repo state and the BRIX source-of-truth documents.

Minimum orientation:

- `git status --short`
- `README.md`
- `docs/BRIX_APP_WHITEBOARD.md`
- `docs/FULL_APP_AUDIT_RELEASE_BLOCKERS.md`
- `docs/ARCHITECTURE_OVERVIEW.md`
- `docs/PRODUCTION_HARDENING_CHECKLIST.md`
- Relevant corpus docs for the affected module.
- Relevant web, iOS, Supabase, and test files.

Do not create new rules, docs, architecture, or code until the existing repo structure has been read enough to avoid duplicating, contradicting, or bypassing what is already there.

## 1. Think System-Wide First

Do not touch code for meaningful product work until the affected system is mapped.

Before editing, identify:

- The user flow being changed.
- All dependent modules.
- Web impact.
- iOS impact.
- Supabase/database/edge-function impact.
- Auth, billing, privacy, and Apple compliance impact when relevant.
- Tests and verification needed.
- Likely regressions.

## 2. No Single-Screen Fixes

If one screen is broken, assume the connected flow may also be broken.

Examples:

- FindIQ issue means check intake, parser, deal creation, Supabase save, DealIQ handoff, strategy comparison, reports, and iOS parity.
- DealIQ issue means check strategy logic, assumptions, readiness, confidence, exports, downstream OfferIQ/PipelineIQ/PortfolioIQ, and iOS parity.
- Auth issue means check web login, iOS login, reset password, account deletion, Supabase session handling, admin access, and route behavior.

## 3. Checklist Before Coding

For major work, create or update a checklist before editing code.

The checklist must cover:

- Entry and auth
- FindIQ intake
- Deal creation
- DealIQ underwriting
- Strategy comparison
- ContractIQ
- OfferIQ
- PipelineIQ
- PortfolioIQ
- Reports and exports
- Admin/account/billing
- iOS parity
- Supabase functions, storage, and database rules
- Tests, builds, and deployment risks

Work through the checklist instead of reacting to one visible bug at a time.

## 4. Fix the Whole Occurrence Class

When fixing an issue, search the whole app for similar occurrences and fix the entire class of problem.

Do not fix only the visible line, button, label, field, route, or screen.

## 5. Production Language Only

Do not leave demo, prototype, future, mock, sample, fake, live-provider-search, backend-label, or internal architecture wording in user-facing UI.

Developer architecture terms such as Digital Twin, Trust Gate, Provider Layer, DRM, or backend implementation labels must not appear in customer-facing copy unless the user explicitly approves them.

## 6. Verify Before Claiming

Do not say a feature is fixed, production ready, reliable, connected, or trustworthy unless it has been verified.

Every completion note must distinguish:

- Verified locally.
- Verified by test.
- Verified by build.
- Not verified because the environment cannot run it.

iOS/Xcode/App Store archive claims require Mac/Xcode verification by the user unless a local Xcode environment is available.

## 7. Respect the BRIX Corpus

All product decisions must follow the BRIX corpus and master directive:

- Decision quality over transaction volume.
- Capital preservation over aggressive growth.
- Evidence over opinion.
- Verification before recommendation.
- Explainability before automation.
- Support all legal real estate strategies.
- Support all real estate asset classes.
- Never present estimates as facts.
- Never fabricate data, comps, rents, contractor pricing, or market statistics.

## 8. User Flow Standard

BRIX must feel like one operating system:

1. Open landing/sign-in entry.
2. Start with a property.
3. Choose strategy.
4. Create a deal file.
5. Analyze and compare.
6. Verify missing data.
7. Decide whether to visit, research, pursue, pass, contract, close, or track.
8. Export and learn from outcomes.

Every screen should make the next action obvious.

## 9. Web and iOS Parity

Native iOS is not an afterthought or separate product.

iOS must:

- Use the same backend and data model as web.
- Support login, signup, reset password, and account deletion.
- Support property intake, URL/text entry, strategy selection, photo capture/upload, deal review, and sync to web.
- Follow Apple privacy and security expectations.
- Feel native, not like a scaled web page.

## 10. Commit Discipline

Before committing:

- Check git status.
- Confirm changed files match the intended scope.
- Run available tests/builds for the touched area.
- Note anything that could not be verified.
- Push to `main` when the user asks for push or when the completed work needs to reach the shared repo.
