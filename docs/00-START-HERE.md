# BRIX Real Estate — Start Here

## Purpose

This directory is the authoritative build package for rebuilding BRIX Real Estate as the first production release. The existing repository, Supabase project, Vercel project, domains, deployment settings, and Apple project may be retained. Existing application code is reference material only unless a later build task explicitly accepts it.

BRIX is a Property Deal Relationship Management platform, or PDRM, that helps an investor move from property discovery through underwriting, strategy selection, visits, offers, contracts, due diligence, financing, ownership, and disposition using one canonical Deal record.

## Required reading order

Codex must read these files before beginning implementation:

1. `01-PRODUCT-CONSTITUTION.md`
2. `02-ENGINEERING-STANDARDS.md`
3. `03-DATA-ARCHITECTURE.md`
4. `04-UI-UX-SYSTEM.md`
5. `05-BUILD-ROADMAP.md`

Codex must also read the applicable subsystem specification before implementing that subsystem.

## Permanent execution rules

1. Build BRIX, not documentation for its own sake.
2. Use one canonical Deal, one canonical Property, one canonical financial engine, and one canonical source of truth.
3. Do not create duplicate applications, schemas, parsers, calculators, persistence paths, or client-only business logic.
4. Do not copy the old application architecture into the rebuild without explicit acceptance.
5. Do not display mock data, fake success, disconnected UI, dead controls, stale results presented as current, or placeholder production behavior.
6. Every visible workflow must work end to end: action, validation, authorization, persistence, processing, feedback, reopen, error recovery, audit history, and cross-client consistency.
7. Web, iPhone, iPad, reports, spreadsheets, and admin must consume the same canonical records and calculation outputs.
8. AI may assist extraction, explanation, classification, and question generation, but may not own authoritative calculations or silently alter facts.
9. Each implementation slice must be small enough to verify and complete enough to use.
10. A feature is not complete until it saves, reopens, handles errors, survives refresh or relaunch, and passes its required tests.

## Required task start format

Before coding, Codex must state:

- Exact user outcome
- Existing systems and files inspected
- Canonical data owner
- Canonical calculation owner
- Complete user flow
- Complete data flow
- Web behavior
- iPhone behavior
- iPad behavior
- Offline, loading, stale, conflict, and failure behavior
- Files expected to change
- Database, storage, API, or Edge Function changes
- Tests required
- Risks of duplication or regression

## Required task completion format

At completion, Codex must report:

- Files changed
- Database and migration changes
- API and Edge Function changes
- Tests added
- Exact commands run and results
- Verified user flow
- Verified save and reopen behavior
- Verified failure and recovery behavior
- Verified web/iPhone/iPad consistency where applicable
- Known limitations
- Confirmation that unrelated files were not changed
- `COMPLETE` or `NOT COMPLETE`

Codex may not claim completion when a material workflow, connection, test, or supported client remains unverified.
