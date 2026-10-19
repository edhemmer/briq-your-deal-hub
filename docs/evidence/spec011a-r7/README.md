# Spec 011A R7 implementation evidence — 2026-10-19

**R7 is NOT COMPLETE. This branch must not be merged or activated as a finished
report capability.** The verified implementation here is a presentation engine,
not the complete authorized report-generation workflow.

## Baseline and scope

Main before work: `6f0e5e3ed1d66311ee9681a9fed470abd7c046e2` (R6, PR #29).
Branch: `spec011a/rendering-pagination-integration`, continuing the existing
pagination foundation `537aecc459ccbeff59607ba5f253738f964c7f7e`.

Read the active numbered governing package, AGENTS.md, Specs 011/011A/017 and
08a build sequence. `PLANS.md` retains the complete release checklist. No R1-R6
implementation was rebuilt. No R8, R9 or OfferIQ work was started.

## Implemented and verified

- One PDF presentation engine consuming explicit display blocks. It has no
  database, provider, recommendation, question-generation or financial authority.
- Existing jsPDF dependency; embedded licensed DejaVu Sans regular/bold, with
  explicit unsupported-glyph rejection rather than silent character loss.
- US Letter; 54 pt horizontal margins; 24 pt cover title, 16/12 pt headings,
  11 pt body, 9 pt tables and 8.5 pt source notes/header/footer.
- Measured pagination; short tables stay together where practical; rows never
  split; continuing table headers repeat. Oversized rows fail explicitly.
- Heading look-ahead accounts for real paragraphs, chained headings and tables.
  Nearly full-page tables may continue below their heading. Terminal headings fail.
- Paragraph fragments retain at least two lines, with a final three-line fragment
  instead of a one-line widow. Explicit keep-together paragraphs are supported.
- Linked contents and section bookmarks; short reports omit unnecessary contents
  pages. Summary front matter is first and must fit within two pages.
- Title, language, definition identity, snapshot/analysis/template/layout/renderer
  identity and source cutoff metadata; document page numbers and private labels.
- Bounded block, character, cell and page counts. Invalid identity, empty content,
  malformed tables, common placeholder/markup leakage and invalid timestamps fail.
- PDF signature/EOF/size checks and SHA-256. Fixed immutable input reproduces
  identical bytes. These checks do not replace independent structural validation.
- Authority guards prohibit domain-calculation imports and storage/network access
  in this presentation engine.

## Verification evidence

`npm run verify` passed on the final code: typecheck, ESLint, authority guard,
production dependency audit, full Vitest (**122 files / 913 tests**), and production
build. The targeted tests also passed independently: **19 tests** (11 pagination,
8 renderer). Exact final PR-head CI remains a separate release requirement.

`python3 scripts/validate-report-pdfs.py /tmp/brix-r7-render-evidence` passed for
ten generated **layout fixtures**. It independently verifies PDF parseability,
hash/size/page reconciliation, title/language, nonempty pages, header/page numbers,
page bounds, placeholder absence, all 80 long-table row IDs exactly once, repeated
headers, and the supplied Summary decision/Quick Review in its first two pages.

`layout-metrics.json` contains measured milliseconds, bytes, pages and hashes.
`pdf-validation.json` records independent validation results. Timing is local
evidence only, not a staging or production service budget.

Actual PDF pages were rasterized with Poppler. All 50 initial fixture pages were
inspected as contact sheets, with full-size Summary and table continuation views.
The review identified unnecessary short contents pages; these were removed and
all ten outputs regenerated and independently validated. The checked-in PNGs show
the latest Summary front, continuing table, and short-report content pages.

The fixtures are not canonical golden certification. The inspection fixture has
text only, no approved photograph handling. There is no role-secret or forced
worker/storage-failure fixture yet. The small Summary is not evidence of an
ordinary transaction's expected 8–10-page output.

## Accessibility and limitations

Verified searchable text, language/title metadata, readable specified typography,
navy/white table headers, bookmarks and contents links. **No tagged PDF, semantic
heading/table tags, PDF/UA or screen-reader reading-order certification.** Rendering
objects in a logical sequence does not establish tagged accessibility compliance.
Unsupported font glyphs and oversized rows currently block generation. Approved
photos, DOCX and long-row alternative layouts are not implemented here.

## Dependencies

Safe compatible lockfile updates repaired available vulnerabilities. The
`tailwindcss-animate` plugin is imported only by `tailwind.config.ts`; it was moved
to devDependencies rather than shipping its Tailwind compiler dependency tree.
`npm run audit:prod` passes its existing high-severity threshold. Three moderate
findings remain in mammoth → argparse → sprintf-js. The suggested forced downgrade
was not applied. Development-tool audit findings are not claimed resolved.

## Staging and production

Verified `puzpttffehqneylmvdbl` is **BRIX Staging**. It was paused and was restored
successfully. Its migration ledger includes R6 through
`20260926012000_spec011a_r6_historical_term_invalidation_guard`.
Read-only checks confirm `report-artifacts` is private, limited to 50 MiB and the
approved PDF/DOCX MIME types. Start/finish RPCs deny anon/authenticated execution;
request/retry RPCs allow authenticated and deny anonymous execution.

Security/performance advisors were run. Existing findings include broad legacy
SECURITY DEFINER grants, RLS-enabled renderer/template registry tables with no
public policies (intentional service-only registries), legacy query/index
findings, and two Full-definition FK-index advisories. No R7 schema was introduced.
These findings are recorded as baseline, not fixed or waived.
See the [Supabase security advisor guidance](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
and [FK-index guidance](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys).

DB function lint could not run because `plpgsql_check_function_tb` is not installed
in this staging database (confirmed by catalog lookup). No extension was added.
No R7 renderer was deployed/registered, no fixture records/files were created in
staging, and no migrations or production fixtures were applied.

Production project `luwaqrkhmxcqsozmilbw` lookup was denied by the connected
Supabase account: “You do not have permission to perform this action.” Production
identity, migrations, runtime, signing and permissions are therefore unverified.

## Open implementation and release gates

1. Full/Summary/Questions/role definition adapters and complete canonical-content
   reconciliation, including source-reference and required-section manifests.
2. Authorized durable worker connection to R6 start/finish/retry, interrupted-job
   recovery, bounded timeout, private upload, validated publication and cleanup.
3. Working app request/progress/history/download/retry/save/reopen workflow.
4. DOCX architectural decision and approved implementation; photos.
5. Real canonical golden fixtures for every required transaction, role privacy,
   missing data, stale-during-render and forced rendering/storage failures.
6. Staging end-to-end smoke, lint availability, advisor classification/closure,
   exact-head CI and dependency audit, and Vercel preview READY.
7. Production access, reviewed promotion, squash merge, exact-main CI/deployment,
   runtime/signing/storage health and post-merge stabilization.

Rollback: keep the branch unmerged and the renderer unregistered. This work has
no production-facing import, enabled UI control, schema change or deployment.

SPEC 011A R7: FAIL
