# BRIX ContractIQ Report Build Sequence

## 1. Authority

This roadmap supplement is governed by:

- `docs/05-BUILD-ROADMAP.md`
- `docs/08-IMPLEMENTATION-ROADMAP.md`
- `specs/011-contractiq-and-real-estate-document-intelligence.md`
- `specs/011a-contractiq-report-outputs.md`
- `specs/017-reportiq-sharing-and-portfolio-comparison.md`

It does not change the position of Specification 011 in the master roadmap.

It defines the required ContractIQ report build order inside Specification 011.

ContractIQ owns report analysis, definitions, synchronized content, questions, materiality, and recommendation logic.

ReportIQ owns shared rendering, exports, artifact history, and secure sharing infrastructure.

## 2. Dependency Gate

Do not begin ContractIQ report implementation until the applicable ContractIQ foundation is complete:

1. document hierarchy and Evidence intake;
2. parties, Property, money, obligations, and contingencies;
3. deterministic deadline engine;
4. amendment, supersession, and conflict handling;
5. perspective analysis;
6. explicit proposal acceptance workflow;
7. source-linked viewer;
8. canonical professional and transaction questions.

Reports must consume these canonical systems. Reports may not recreate them.

## 3. Required ContractIQ Report Build Order

### 011-R1 — Shared Report Snapshot and Reconciliation Contract

Build one immutable, versioned ContractIQ report snapshot containing the approved analysis state required by every report output.

Required outcome:

- one snapshot contract;
- one analysis cutoff;
- source anchors and Evidence references;
- facts, terms, deadlines, findings, conflicts, missing records, questions, and recommendation state;
- perspective and materiality classification;
- snapshot version, analysis version, and generation metadata;
- authorization-scoped projections;
- stale and supersession rules.

Gate:

Full, Summary, and Questions Reports can consume the same fixture and produce matching canonical facts and statuses.

### 011-R2 — Canonical Professional and Transaction Questions

Complete one question registry used by the ContractIQ workspace and all report outputs.

Required outcome:

- role-grouped questions;
- linked terms, findings, conflicts, deadlines, and missing records;
- source anchors;
- priority, rationale, status, response, and resolution state;
- report inclusion rules;
- no duplicate report-specific question generation.

Gate:

The same question ID, wording, status, and resolution appear consistently in the workspace, Full Report, Summary Report, and standalone Questions Report.

### 011-R3 — Full Due Diligence Report Definition

Build the hyper-detailed ContractIQ transaction analysis report definition.

Required outcome:

- complete document inventory and hierarchy;
- detailed source-linked contract interpretation;
- all material terms, deadlines, findings, conflicts, and missing records;
- title, financing, appraisal, insurance, HOA, tax, utility, solar, inspection, disclosure, and ownership-cost analysis where applicable;
- complete professional questions;
- external research context;
- calculations owned by approved deterministic engines;
- complete verification and resolution checklist;
- Full Report section anchors for Summary references.

Gate:

A reviewer can trace every material conclusion, question, deadline, and recommendation to canonical ContractIQ state and supporting Evidence.

### 011-R4 — Buyer Due Diligence Summary Report Definition

Build the concise buyer decision report as a synchronized companion to the Full Report.

Required outcome:

- approximately 8–10 pages when the transaction permits;
- executive decision summary;
- one quick-review table;
- material contract and transaction terms;
- one consolidated primary financial or long-term obligation section;
- grouped material Property findings;
- consolidated questions and resolution plan;
- one open-items tracker;
- concise final recommendation;
- references to Full Report sections;
- no duplicate analysis or independent conclusion state.

Gate:

The buyer can understand the decision from the first two pages, every material issue appears once, and the Summary remains fully reconciled with the Full Report snapshot.

### 011-R5 — Standalone Questions Report and Role Exports

Build the approved standalone question output using the canonical ContractIQ question registry.

Required outcome:

- all-question report;
- recipient-grouped report;
- selected-role export where supported;
- status and response fields;
- linked rationale and source references where appropriate;
- no independently generated or stale duplicate questions.

Gate:

Question status changes reconcile across the ContractIQ workspace and every current report artifact.

### 011-R6 — Report Synchronization, Staleness, and Artifact History

Connect ContractIQ analysis changes to report state and ReportIQ artifacts.

Required outcome:

- analysis change detection;
- current, stale, superseded, failed-with-prior-valid-artifact, and professional-review states;
- prior artifact preservation;
- deterministic regeneration;
- content hashes;
- template and renderer versions;
- no conflicting current Full and Summary artifacts;
- safe recovery after generation failure.

Gate:

A material analysis change marks every affected report stale, regeneration produces aligned artifacts, and the last valid artifact remains available when a new generation fails.

### 011-R7 — Rendering and Pagination Integration

Integrate ContractIQ report definitions with ReportIQ rendering infrastructure.

Required outcome:

- professional PDF output;
- Word output where approved;
- consistent typography and headings;
- stable table rendering;
- repeated table headers;
- no split short tables or table rows;
- no orphan headings or severe widows;
- intentional white space;
- accessible document structure;
- secure private artifact storage.

Gate:

Representative short, ordinary, complex, solar-heavy, inspection-heavy, and multi-document transactions render without material formatting defects or content reconciliation errors.

### 011-R8 — Quality-Control and Accuracy Gates

Implement versioned Fact, Contradiction, Omission, Reasonableness, and Editorial checks.

Required outcome:

- material amounts, dates, terms, and findings verified against source state;
- contradictions included without false conflicts;
- missing records and future ownership exposure considered;
- recommendations remain supported and proportionate;
- repetition and AI-style wording removed;
- failed quality checks block publication of the new current artifact.

Gate:

No report is marked Current when a material fact, contradiction, omission, reasonableness, source, or formatting gate fails.

### 011-R9 — ContractIQ Report Completion and Cross-Module Verification

Verify the complete ContractIQ report family.

Required outcome:

- Full Due Diligence Report;
- Buyer Due Diligence Summary Report;
- standalone Questions Report;
- shared snapshot reconciliation;
- canonical question reconciliation;
- source-link integrity;
- ReportIQ artifact history;
- secure sharing where approved;
- web, iPhone, and iPad report status consistency;
- events, audit, observability, accessibility, performance, and authorization evidence.

Gate:

The user can move from the concise Summary to the Full Report and role-based questions without finding conflicting facts, recommendations, deadlines, question statuses, or source references.

## 4. Hard Sequencing Rules

1. Do not build the Summary Report before the shared snapshot and Full Report definition exist.
2. Do not create a separate Summary analysis prompt or independent conclusion store.
3. Do not build report-specific copies of canonical questions.
4. Do not allow ReportIQ to reinterpret ContractIQ analysis.
5. Do not publish a current artifact from stale ContractIQ state.
6. Do not overwrite or delete prior valid artifacts when analysis changes.
7. Do not begin OfferIQ report outputs until the applicable ContractIQ report and question contracts are stable.
8. Do not mark ContractIQ complete until the Full, Summary, and Questions outputs reconcile.

## 5. Required Verification per Slice

Every ContractIQ report slice must include:

- authentication and workspace authorization;
- RLS and private storage;
- canonical snapshot and source-link checks;
- idempotent rendering jobs;
- stale and retry behavior;
- save and reopen;
- artifact history;
- failure recovery;
- events and audit;
- exact test results;
- production build;
- no unrelated implementation changes.

## 6. Final ContractIQ Report Gate

ContractIQ report work is complete only when:

- one shared analysis snapshot governs every report;
- Full and Summary reports are synchronized;
- canonical role-based questions synchronize across all outputs;
- the Summary communicates the decision within the first two pages;
- the Full Report provides complete supporting detail;
- every material conclusion is source linked;
- unresolved facts, conflicts, and deadlines are visible;
- stale reports cannot be mistaken for current reports;
- prior artifacts remain traceable;
- ReportIQ renders and shares without owning independent ContractIQ logic;
- authorization, privacy, accessibility, performance, audit, events, and recovery gates pass.
