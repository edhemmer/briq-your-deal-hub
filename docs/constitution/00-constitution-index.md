# BRIX Legacy Constitution Index — Superseded

## Status

**SUPERSEDED — HISTORICAL REFERENCE ONLY**

This directory contains an earlier BRIX constitutional architecture that is retained for product history and useful design reasoning. It is no longer the governing implementation entry point.

The current authoritative package is:

1. `AGENTS.md`
2. `docs/00-START-HERE.md`
3. `docs/01-PRODUCT-CONSTITUTION.md`
4. `docs/02-ENGINEERING-STANDARDS.md`
5. `docs/03-DATA-ARCHITECTURE.md`
6. `docs/04-UI-UX-SYSTEM.md`
7. `docs/05-BUILD-ROADMAP.md`
8. `docs/06-SYSTEM-ARCHITECTURE.md`
9. `docs/07-UI-DESIGN-SYSTEM.md`
10. `docs/08-IMPLEMENTATION-ROADMAP.md`
11. `docs/09-APPLE-PLATFORM-COMPLIANCE.md` when Apple work is involved
12. `docs/10-CODEX-MASTER-BUILD-PROMPT.md`
13. `docs/11-DOCUMENT-CONTROL-AND-READINESS-MATRIX.md`
14. `docs/12-INDIVIDUAL-INVESTOR-PRODUCT-REALIGNMENT.md`
15. the current numbered owning specification and its prerequisites

## Historical Value

Files in `docs/constitution/` may still contain useful material about:

- PDRM concepts;
- Property and Deal identity;
- Evidence and provenance;
- deterministic underwriting;
- strategy logic;
- product trust principles;
- cross-client consistency;
- historical product reasoning.

That material may be consulted for context, but it may not override, weaken, or expand the current governing package.

## Rules for Use

1. Do not treat any file in this directory as implementation authority.
2. Do not revive the former 01-30 constitution roadmap.
3. Do not create missing constitution chapters to complete the old hierarchy.
4. Do not copy an older object model, role model, workflow, formula threshold, or module boundary into current code unless the current owning specification explicitly requires it.
5. When useful historical concepts remain valid, implement them through the current canonical Property/Deal/Evidence/underwriting architecture.
6. Individual-investor scope is controlled by `docs/12-INDIVIDUAL-INVESTOR-PRODUCT-REALIGNMENT.md`.
7. Current implementation sequence is controlled by `docs/05-BUILD-ROADMAP.md` and `docs/08-IMPLEMENTATION-ROADMAP.md`.

The historical files remain in Git so design rationale and prior work are not lost. Their retention does not grant them current authority.