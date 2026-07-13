# BRIX Hard Rules

This document mirrors the root `AGENTS.md` rules so the operating protocol is visible in product documentation.

BRIX work must be app-wide, corpus-led, and verification-first. Do not patch one visible screen without checking the connected workflow, web/iOS parity, Supabase data path, auth path, and downstream modules.

Mandatory protocol:

1. Read the repo first: `README.md`, `docs/BRIX_APP_WHITEBOARD.md`, `docs/FULL_APP_AUDIT_RELEASE_BLOCKERS.md`, `docs/ARCHITECTURE_OVERVIEW.md`, `docs/PRODUCTION_HARDENING_CHECKLIST.md`, relevant corpuses, and relevant source files.
2. Map the affected user flow before coding.
3. Identify dependent modules, data paths, tests, and likely regressions.
4. Create a checklist for major work.
5. Fix the whole occurrence class, not one visible bug.
6. Remove demo/prototype/internal wording from customer-facing UI.
7. Verify before claiming production readiness.
8. Follow the BRIX corpus and master directive.
9. Preserve web and iOS parity.
10. Keep BRIX simple, trustworthy, accurate, and action-oriented.
11. Commit only after the intended scope is checked.
