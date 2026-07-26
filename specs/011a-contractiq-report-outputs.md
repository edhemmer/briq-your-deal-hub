# BRIX Specification 011A — ContractIQ Report Outputs

## 1. Authority and Ownership

This companion specification is governed by:

- `docs/00-START-HERE.md` through `docs/08-IMPLEMENTATION-ROADMAP.md`
- `specs/011-contractiq-and-real-estate-document-intelligence.md`
- `specs/017-reportiq-sharing-and-portfolio-comparison.md`

ContractIQ owns:

- report definitions;
- buyer, seller, landlord, tenant, borrower, lender, developer, investor, and guarantor perspectives;
- report section logic;
- materiality and recommendation logic;
- canonical findings, conflicts, deadlines, questions, and resolution states;
- synchronized Full and Summary Due Diligence Report content.

ReportIQ owns shared rendering, artifact generation, PDF/Word/spreadsheet output where applicable, artifact history, secure sharing, and export infrastructure.

ReportIQ may not reinterpret ContractIQ findings or create independent calculations, facts, questions, conclusions, or recommendations.

## 2. Non-Negotiable Report Relationship

ContractIQ must support two synchronized buyer-facing transaction reports derived from the same versioned ContractIQ analysis snapshot:

1. **Full Due Diligence Report** — the hyper-detailed contract and transaction analysis.
2. **Buyer Due Diligence Summary Report** — the concise, decision-oriented companion report.

These are not separate analysis engines.

The Summary Report must never maintain independent facts, findings, questions, deadlines, conflicts, or recommendations. It may condense and prioritize the Full Report, but it may not change its meaning.

When the canonical ContractIQ analysis changes:

1. preserve prior report artifacts;
2. mark prior artifacts stale;
3. create a new shared report snapshot;
4. regenerate the affected Full and Summary artifacts;
5. prevent conflicting current reports;
6. disclose unresolved conflicts and missing information consistently.

## 3. Shared Versioned Report Snapshot

Both report levels must derive from one immutable, versioned snapshot containing:

- workspace, Deal, Property, and perspective identifiers;
- document inventory and hierarchy;
- source Evidence and source anchors;
- accepted extracted terms;
- verified and verification-required deadlines;
- material findings;
- conflicts and contradictions;
- missing exhibits, records, pages, amendments, schedules, and attachments;
- seller-disclosure comparisons;
- title, financing, insurance, HOA, utility, tax, solar, inspection, and ownership-cost findings where applicable;
- professional and transaction questions;
- open-item and resolution status;
- external research citations and classification;
- materiality classifications;
- recommendation state;
- analysis workflow and prompt version;
- report snapshot version;
- generated-at timestamp.

Reports may display only information authorized for the current user and share scope.

## 4. Full Due Diligence Report

The Full Due Diligence Report is the complete source-linked transaction analysis.

It may include:

- complete document inventory, hierarchy, signatures, completeness, amendments, and supersession;
- detailed contract interpretation with clause and source citations;
- parties, authority, Property, included and excluded assets;
- price, earnest money, credits, concessions, prorations, escrow, holdback, recurring costs, and assumed obligations;
- all contingencies, deadlines, notice requirements, termination rights, defaults, and remedies;
- complete inspection, disclosure, specialty-report, title, survey, financing, appraisal, insurance, HOA, tax, permit, utility, solar, and long-term-service analysis;
- full cross-document contradiction and missing-record analysis;
- complete questions by professional or transaction role;
- calculations and scenarios where owned by an approved deterministic engine;
- five-year and long-term ownership exposure;
- resale and marketability implications;
- complete resolution alternatives;
- supporting photographs and Evidence references;
- verification checklist;
- external research context and sources.

The Full Report may be long. Completeness, source traceability, and decision usefulness take priority over page count.

## 5. Buyer Due Diligence Summary Report

### 5.1 Purpose

The Buyer Due Diligence Summary Report is a concise, professional, decision-ready review of the entire transaction from the buyer’s perspective.

It is not a simple contract summary.

It must help the buyer, spouse, family, Realtor, attorney, lender, insurer, and title company quickly understand:

- the buyer’s current position;
- why the Property remains worth considering or does not;
- the few issues driving the decision;
- the material contract and transaction protections;
- the primary long-term or financial obligation;
- the material Property findings;
- all material unanswered questions;
- the responsible parties and evidence still needed;
- the conditions that support proceeding, renegotiating, pausing, or stopping.

Target length is approximately 8 to 10 pages. Nine pages is preferred when the material can be presented clearly without omission, crowding, or repetition.

### 5.2 Current-position labels

Use one supported current-position label:

- Proceed
- Proceed with Conditions
- Pause Pending Information
- Renegotiate Material Terms
- Do Not Proceed

Do not use a numeric transaction score unless the method is defined, transparent, versioned, and supported.

### 5.3 Required structure

The Summary Report must use this decision-oriented structure:

1. **Executive Decision Summary**
   - current recommendation;
   - concise overall conclusion;
   - why the Property remains worth considering;
   - five to seven most important decisions;
   - what must happen before final approval.

2. **Quick Review Table**
   - one table only;
   - columns: Priority, Verified Finding, What Is Missing, Current Recommendation, Detailed Section;
   - five to seven priority rows;
   - no duplicate priority summary elsewhere.

3. **Contract and Transaction Terms**
   - earnest money;
   - acceptance date and unresolved date confirmation;
   - attorney review;
   - inspection rights;
   - financing;
   - insurance;
   - solar or service-agreement review;
   - title and survey;
   - HOA;
   - taxes;
   - closing and possession;
   - final walk-through.

4. **Primary Financial or Long-Term Obligation**
   - use for solar, battery, PPA, lease, utility, service, assumed debt, or other material continuing obligation;
   - keep agreement structure, economics, transfer, title, financing, insurance, roof interaction, utility value, buyout, prepayment, resale, missing records, and preferred resolution together;
   - do not repeat the issue later.

5. **Material Property Findings**
   - group findings logically;
   - each material issue uses Finding, Why It Matters, and Recommendation;
   - distinguish active defect, safety concern, functional failure, material uncertainty, deferred maintenance, normal age, cosmetic issue, and information-only observation.

6. **Questions and Resolution Plan**
   - consolidate all material unanswered questions by recipient;
   - identify what must be resolved before approval;
   - identify what may be resolved through repair, credit, escrow, holdback, documentation, or price adjustment;
   - identify what can reasonably be accepted as normal ownership.

7. **Open Items and Final Decision**
   - one open-items tracker;
   - columns: Item, Responsible Party, Evidence Needed, Preferred Resolution, Status;
   - status values: Open, In Progress, Resolved, Accepted, Pending Final Walk-Through;
   - concise final recommendation;
   - conditions that justify proceeding and conditions that justify stopping;
   - appropriate post-closing reserve or ownership planning.

### 5.4 Summary-to-Full references

When deeper analysis exists, the Summary Report should reference the applicable Full Report section, for example:

`See Full Due Diligence Report — Solar Agreement Analysis.`

The Summary may omit supporting detail but may not omit a material decision issue merely to reduce length.

## 6. Canonical Professional and Transaction Questions

ContractIQ must maintain one canonical question set that may be presented:

- in the ContractIQ workspace;
- in the Full Due Diligence Report;
- in the Buyer Due Diligence Summary Report;
- in a standalone Questions Report;
- in role-specific question exports where supported.

Questions may be grouped by:

- buyer;
- seller;
- buyer’s or seller’s attorney;
- title company;
- Realtor or broker;
- lender;
- insurer;
- HOA or association;
- utility;
- solar, battery, PPA, or service provider;
- inspector;
- appraiser;
- contractor or specialist;
- municipality or county;
- other applicable professional or transaction party.

Every canonical question must retain:

- question ID;
- Deal and Contract IDs;
- recipient role;
- priority;
- rationale;
- linked term, finding, conflict, deadline, or missing record;
- source anchors;
- perspective;
- status;
- response and response source where entered;
- resolution state;
- report inclusion rules;
- created, updated, and resolved timestamps;
- version.

The same question must not be independently regenerated for each report.

## 7. Required Analysis Method

ContractIQ must perform the following analysis before producing either report level.

### 7.1 Document inventory

For every received item determine:

- name;
- date;
- parties;
- purpose;
- signature state;
- completeness;
- hierarchy;
- supersession or amendment state;
- referenced exhibits, schedules, attachments, and missing pages.

### 7.2 Fact and term extraction

Extract all material:

- money;
- dates;
- deadlines;
- obligations;
- rights;
- contingencies;
- notice requirements;
- transfer requirements;
- recurring costs;
- escalators;
- defaults and remedies;
- warranties;
- renewal and end-of-term obligations;
- exclusions;
- open questions;
- missing records.

### 7.3 Cross-document comparison

Compare material statements across all supplied Evidence.

For every difference:

- state what differs;
- identify both source anchors;
- explain why it matters;
- identify the clarification or evidence required;
- avoid unsupported allegations of fraud, breach, misrepresentation, or intentional nondisclosure.

### 7.4 Multi-lens review

Apply every relevant lens:

- contract;
- Property condition;
- financial and ownership cost;
- solar and long-term service agreements;
- seller disclosure;
- title and ownership;
- financing and appraisal;
- insurance;
- HOA or private governance;
- tax and utility;
- resale and marketability.

### 7.5 External research

Use external research only when current information materially affects the transaction.

Prioritize:

1. government and official sources;
2. statutes and official forms;
3. utilities;
4. company and SEC filings;
5. attorney-general and regulatory records;
6. court records;
7. municipal and county records;
8. credible investigative reporting;
9. consumer complaints for pattern awareness only.

Clearly distinguish company fact, allegation, settlement, judgment, news report, consumer complaint, and professional inference.

Consumer complaints are not proof of a defect in the subject transaction.

## 8. Evidence and Conclusion Classification

Every material report statement must be classified internally as one of:

- **Verified Fact** — directly stated, signed, photographed, measured, billed, or recorded in reliable Evidence.
- **Supported Concern** — evidence supports concern, but cause, extent, cost, or future impact requires confirmation.
- **Open Question** — material information is missing, inconsistent, incomplete, or unavailable.
- **Professional Recommendation** — a practical action supported by the facts and transaction risk.

Do not guess.

Unknown information must remain unknown and identify:

- what is missing;
- why it matters;
- who should provide it;
- the recommended next step.

## 9. Materiality and Recommendation Logic

Before including an issue in the Summary Report, determine whether it may affect:

- legal rights;
- safety or habitability;
- material immediate cost;
- recurring cost;
- financing, insurance, title, appraisal, tax, utility, or HOA approval;
- marketability or resale;
- severity if ignored;
- the informed purchase decision.

Non-material items belong in a normal-ownership or planning section or remain in the Full Report.

Supported recommendation types include:

- obtain documentation;
- obtain professional evaluation;
- seller repair;
- buyer credit;
- escrow or holdback;
- price adjustment;
- seller payoff;
- contract prepayment or purchase;
- termination;
- lender, insurance, title, attorney, utility, HOA, or municipal review;
- accept as normal ownership;
- establish reserve;
- monitor;
- stop the transaction if unresolved.

Do not default to seller repair when investigation, buyer-selected work, matching materials, hidden conditions, or repair-quality verification make another remedy more appropriate.

## 10. Accuracy and Professional Boundaries

ContractIQ report generation must not:

- invent facts or dates;
- estimate remaining balances without sufficient records;
- label a condition a code violation without confirmation;
- call a disclosure false without evidence of knowledge;
- call an untested system defective;
- state that solar saves money without matched payment, utility, production, import, export, credit, and fixed-charge data;
- state that solar costs more than utility service without an all-in comparison;
- equate total scheduled payments with a buyout amount;
- treat consumer complaints as transaction findings;
- treat an insurance quote as issued coverage;
- assume warranty transfer, purchase, prepayment, net-metering transfer, or service obligations without written confirmation;
- overstate an inspection finding beyond the professional report;
- issue final legal, engineering, inspection, tax, insurance, appraisal, or lending conclusions.

Formal notices and legal interpretations must be directed to the appropriate licensed professional.

## 11. Style and Tone

Reports must sound like a careful, informed buyer or transaction participant.

The voice must be:

- calm;
- direct;
- fair;
- prepared;
- practical;
- open to discussion;
- firm where necessary;
- free of threats, sales language, exaggeration, and AI filler.

Avoid repetitive disclaimers, duplicated summaries, excessive bullets, one-sentence paragraphs, decorative icons, unnecessary em dashes, and overly formal language.

The report must protect the user without making the user appear unreasonable, adversarial, or unfamiliar with normal ownership.

## 12. Document Production Contract

Preferred report typography:

- title: 22–24 pt;
- main heading: 15–16 pt;
- subheading: 11.5–13 pt;
- body: 10.5–11 pt;
- tables: 8.5–9.5 pt;
- source notes: 8–8.5 pt.

Use one professional font family and restrained navy or charcoal headings.

Required pagination behavior:

- no orphan headings;
- keep at least two lines with a heading;
- keep short issue blocks together where practical;
- do not split short tables or table rows;
- repeat headers on continuing tables;
- avoid widows and nearly empty pages;
- do not shrink body text below the approved size to force pagination;
- use white space intentionally.

## 13. Quality-Control Passes

Before publishing either report level, run five versioned internal checks:

1. **Fact Check** — verify material amounts, dates, terms, findings, and source anchors.
2. **Contradiction Check** — confirm meaningful inconsistencies are included and no false conflict was created.
3. **Omission Check** — identify uninspected areas, missing records, unknown costs, transferred responsibilities, post-closing exposure, and five-year ownership issues.
4. **Reasonableness Check** — confirm requests are supported, proportionate, practical, properly directed, and not cosmetic or based on age alone.
5. **Editorial Check** — remove repetition, AI-style wording, excessive disclaimers, weak sentences, overcrowding, poor page breaks, and inconsistent formatting.

A failed quality-control gate blocks current artifact publication and preserves the last valid report artifact.

## 14. Report State and Artifact History

Required report states:

- Draft
- Generating
- Current
- Current with Open Questions
- Current with Conflicts
- Stale
- Failed with Prior Valid Artifact
- Superseded
- Professional Review Recommended

Every artifact must retain:

- report type;
- perspective;
- Deal and Contract IDs;
- shared snapshot ID;
- analysis version;
- template version;
- renderer version;
- generated time;
- source-document cutoff time;
- current/stale/superseded status;
- secure storage reference;
- content hash;
- generation and quality-control result.

## 15. Events and Audit

Use canonical events and audit records for:

- report snapshot created;
- Full Report requested, completed, failed, or superseded;
- Summary Report requested, completed, failed, or superseded;
- Questions Report requested or completed;
- underlying analysis changed;
- report marked stale;
- artifact shared or access revoked where owned by ReportIQ.

Events must use the repository-approved names, schemas, idempotency, correlation, causation, authorization, and privacy rules.

Report events may not contain full private report content.

## 16. Testing and Reconciliation

Required tests include:

- Full and Summary reports use the same snapshot;
- matching facts, findings, deadlines, questions, statuses, and recommendation state;
- no independent Summary calculation or conclusion;
- Summary omission rules never remove a material issue;
- question IDs and statuses reconcile across workspace, Full Report, Summary Report, and standalone Questions Report;
- updated analysis marks both report levels stale;
- regeneration preserves prior artifacts;
- failed generation preserves the last valid artifact;
- source anchors resolve;
- unauthorized Evidence and findings do not enter artifacts;
- role and share scope are enforced;
- PDF pagination rules pass representative fixtures;
- tables do not split incorrectly;
- reports remain readable at supported page sizes;
- ContractIQ and ReportIQ outputs reconcile;
- web, iPhone, iPad, and shared artifacts show the same current report status.

## 17. Definition of Done

This ContractIQ report capability is complete only when:

- the hyper-detailed Full Due Diligence Report works;
- the Buyer Due Diligence Summary Report works;
- both derive from the same immutable versioned snapshot;
- the Summary is approximately 8–10 pages when the transaction permits;
- the first two Summary pages communicate the decision;
- all material issues appear once in the correct section;
- canonical questions synchronize across all report outputs;
- unknown facts remain unknown;
- recommendations are supported and proportionate;
- prior artifacts and analysis versions remain traceable;
- stale artifacts cannot be mistaken for current reports;
- ReportIQ renders without creating independent report logic;
- authorization, RLS, storage, audit, events, accessibility, performance, and secure sharing pass;
- the user can decide whether to proceed, renegotiate, investigate, pause, or terminate without reading the Full Report first;
- the Full Report remains available for supporting detail and professional review.
