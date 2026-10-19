# Spec 011A R7 execution checklist

Authority: current numbered governing documents, Specs 011/011A/017, and
`docs/08a-contractiq-report-build-sequence.md`. R6 is already merged in main
`6f0e5e3ed1d66311ee9681a9fed470abd7c046e2`; do not rebuild R1-R6.

Each unchecked requirement is an open release gate, not an implied pass.

- [x] Verify baseline and isolate `spec011a/rendering-pagination-integration`.
- [x] Verify staging identity `puzpttffehqneylmvdbl` (BRIX Staging).
- [ ] Verify production identity/access `luwaqrkhmxcqsozmilbw` (permission denied).
- [ ] Consume canonical Full, Summary, Questions, grouped Questions and role definitions faithfully.
- [ ] Render professional PDFs; document approved DOCX decision and support.
- [ ] Version template/renderer; preserve all canonical identity and source metadata.
- [ ] Meet typography, margins, headings, page numbering, TOC and supported bookmarks.
- [ ] Prevent clipped/overlapping content, orphan headings and severe paragraph widows.
- [ ] Keep short tables/issue blocks together; repeat long-table headers; preserve rows.
- [ ] Verify Summary decision content on its first two pages, without filler or omissions.
- [ ] Reconcile material content, sources, canonical questions and role privacy.
- [ ] Integrate durable R6 request/start/finish/retry/history and save/reopen flows.
- [ ] Validate bytes, MIME, extension, hashes, completeness and leakage before publication.
- [ ] Preserve stale-during-render and one-current guarantees; prior artifacts survive failure.
- [ ] Verify private storage, signed retrieval, unauthorized and cross-workspace denial.
- [ ] Verify exceptions, timeouts, storage failure, interruption and safe retries.
- [ ] Inspect ten required golden fixtures, actual PDF pages and supported DOCX output.
- [ ] Record supported accessibility, limitations, duration, page count and file size.
- [ ] Staging smoke, fixture cleanup, DB lint/security/performance advisors and FK indexes.
- [ ] All applicable R1-R6/ContractIQ/ReportIQ/Evidence/question/deadline/finance regressions.
- [x] Full Vitest, typecheck, ESLint, authority guard, production dependency audit and build (local).
- [ ] Exact PR-head GitHub Production Gate and dependency audit PASS; Vercel preview READY.
- [ ] Reviewed production prerequisites; no fake production artifacts.
- [ ] Squash merge; exact merged-main CI and Vercel READY; runtime/signing/storage health.
- [ ] Review entire change against this checklist and record completion evidence.

Exclusions: no R8 quality-control implementation, R9, OfferIQ, broad sharing UI,
unrelated redesign, report email delivery, renderer-owned analysis, money/deadline
calculations, recommendation changes, canonical question regeneration, public
artifacts, lifecycle bypass or stale publication. Never mark R7 PASS with open gates.
