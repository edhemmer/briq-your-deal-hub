# BRIX Specification 021 — AI Orchestration, Safety, and Explainability

## 1. Authority and Rules of Engagement

This specification is governed by `docs/00-START-HERE.md` through `docs/05-BUILD-ROADMAP.md` and Specifications 001–020.

Rules of engagement:

1. AI is assistive and never the canonical owner of facts, calculations, legal conclusions, valuation, deadlines, permissions, or user decisions.
2. Deterministic systems remain authoritative for underwriting, finance, strategy rules, lifecycle state, validation, entitlements, and notifications.
3. AI may extract, classify, summarize, compare, explain, search, draft, prioritize, and propose actions.
4. AI may not silently mutate canonical records. Material changes require explicit authorization and acceptance.
5. Every AI output must retain source context, prompt version, model configuration, provider, retrieval set, timestamp, usage, confidence, and verification state.
6. Material claims derived from Evidence must link to source anchors where possible.
7. Unsupported, stale, conflicted, incomplete, or low-confidence outputs must be visibly labeled.
8. Prompt injection, hostile documents, malformed tool output, and user content may not override BRIX system rules.
9. Providers, prompts, tools, and routing must be replaceable without changing canonical domain models.
10. AI failures degrade gracefully and never block saved records, prior valid results, deterministic workflows, or manual entry.
11. No autonomous agent may send communications, submit offers, accept contracts, change financing, delete Evidence, change permissions, initiate payment, or perform an irreversible action without explicit approval.
12. Retrieval must enforce workspace, Deal, role, RLS, sharing, sensitivity, deletion, and legal-hold boundaries before context reaches a model.
13. Every automated workflow is observable, resumable, idempotent, cancelable where practical, and safe to retry.
14. Cost, latency, privacy, retention, and provider availability are production constraints.

## 2. Mission

Provide one governed AI platform for BRIX that supports extraction, search, explanations, structured proposals, and safe automation without creating disconnected assistants, duplicate prompt stacks, separate search indexes, or inconsistent decision logic.

## 3. Canonical Ownership

This subsystem owns:

- AI request routing and gateway
- provider/model abstraction
- prompt registry and versions
- tool registry and permissions
- retrieval orchestration
- embedding and indexing jobs
- AI job state and provenance
- confidence and verification metadata
- AI usage and cost records
- automation definitions and execution state
- approval gates
- global search and Ask BRIX orchestration

It does not own Deal or Property truth, Evidence originals, calculations, strategy rankings, contract deadlines, tasks, contacts, communications, permissions, accepted values, or user decisions.

## 4. AI Gateway

The server-side AI Gateway is the only approved privileged entry point for model requests.

It must provide:

- authentication and authorization
- provider and model routing
- prompt loading and versioning
- tool allowlisting
- retrieval context assembly
- structured input/output validation
- privacy and redaction controls
- rate limiting
- timeout, retry, and fallback
- cost and usage metering
- correlation IDs, tracing, and safe logging
- result persistence where required

Clients may not call model providers directly with privileged credentials.

## 5. Provider and Model Registry

Each model configuration defines:

- permanent configuration ID
- provider and model name
- allowed task classes
- supported modalities
- context and output limits
- timeout and retry policy
- fallback chain
- cost profile
- data-retention classification
- regional/compliance restrictions
- enabled environments
- release status

Feature code references internal model configuration IDs rather than hard-coded provider model names.

## 6. Prompt Registry

Every production prompt includes:

- permanent prompt ID
- version
- owning subsystem
- purpose
- allowed models
- input and output schemas
- required source context
- tool permissions
- safety rules
- evaluation fixtures
- release status
- change history

Prompt changes create new versions. Persisted outputs retain the exact version used.

## 7. Tool Registry

Every AI-callable tool defines:

- tool ID and owner
- description
- input/output schemas
- permission requirements
- read/write classification
- approval level
- idempotency behavior
- timeout and error contract
- audit requirements

Write-capable tools are denied by default. Tool execution rechecks authorization server-side and cannot rely on model judgment.

## 8. Deterministic and AI Boundaries

AI may not be the authoritative implementation for:

- financial formulas and payment schedules
- underwriting metrics
- strategy disqualifiers and scores
- deadline calculations
- permissions and RLS
- state transitions
- validation and duplicate rules
- file hashes
- billing totals and entitlements
- audit history
- notification delivery state

Permitted AI assistance includes document extraction, image description, transcription cleanup, classification, structured candidate proposals, summaries, explanation, search expansion, relevance ranking, missing-information identification, verification questions, draft reports, draft messages, and workflow suggestions.

## 9. Retrieval and Grounding

Supported scopes include current Deal, Property, workspace, portfolio, Evidence, contracts, financing, market, governance, inspections, appraisals, reports, tasks, timeline, contacts, and RELearnIQ.

Retrieval pipeline:

1. authenticate
2. resolve workspace and active context
3. enforce authorization and RLS
4. classify intent
5. select allowed collections
6. apply structured state and sensitivity filters
7. retrieve by exact, keyword, and semantic methods
8. rerank
9. remove inaccessible, duplicate, stale, deleted, or superseded chunks as policy requires
10. assemble bounded context
11. generate structured output
12. validate schemas and citations
13. persist provenance and usage
14. return answer with freshness, confidence, and verification state

Search chunks reference canonical Evidence or record IDs and stable anchors. Derived indexes may be rebuilt without altering originals.

## 10. AI Response Contract

Every persisted or material user-visible AI result supports:

- request, workspace, user, Deal, and Property IDs
- task type
- prompt and model configuration versions
- provider request reference where available
- input source references
- output schema version
- generated content and structured proposals
- confidence and verification state
- freshness and conflict state
- timestamps and duration
- usage and cost
- safe failure details

Required labels distinguish verified fact, extracted candidate, user assumption, system estimate, AI inference, recommendation, missing information, conflict, and professional review recommended.

## 11. Confidence and Verification

Confidence considers source quality, completeness, extraction certainty, source agreement, recency, model reliability, schema validation, and deterministic cross-checks.

Verification states:

- Unverified
- Candidate
- User Confirmed
- Source Confirmed
- Professional Confirmed
- Conflicted
- Stale
- Rejected
- Superseded

High confidence does not eliminate required user or professional verification.

## 12. AI Job Lifecycle

States:

- Draft
- Queued
- Running
- Waiting for Dependency
- Waiting for Approval
- Partial
- Completed
- Completed with Warnings
- Failed
- Canceled
- Expired
- Superseded

Every job exposes state, measurable progress, timestamps, retry count, dependencies, safe failure reason, recovery action, and prior valid result where available.

## 13. Automation and Approval Framework

Approval levels:

- Level 0: read-only analysis
- Level 1: draft proposal only
- Level 2: explicit confirmation before canonical change
- Level 3: explicit confirmation before external communication or irreversible action

No workflow may silently escalate approval level.

Prohibited autonomous actions include submitting or countering offers, accepting contracts, sending external communications, changing price or financing, approving facts, deleting records, modifying permissions, initiating payment, signing, or representing professional approval.

## 14. Global Search and Ask BRIX

Global search supports natural language, exact identifiers, filters, scope chips, recent searches, saved searches where useful, source type, Deal/Property, verification, freshness, and keyboard navigation.

Results show title, source type, context, relevant excerpt, date, state, source anchor, and permission-aware actions.

Ask BRIX:

- begins with the current page and active Deal scope
- clearly displays scope
- allows narrowing or broadening
- cites supporting Evidence
- distinguishes facts, assumptions, estimates, and recommendations
- states when support is insufficient
- proposes actions without silently executing them

## 15. Prompt-Injection and Content Safety

- Treat all uploaded, retrieved, emailed, and web-derived content as untrusted data.
- Never execute instructions embedded in source content.
- Separate system policy, tool definitions, user intent, and retrieved data.
- Validate structured outputs before persistence or tool use.
- Enforce tool permissions independently of model output.
- Sanitize rendered content and links.
- Detect data-exfiltration attempts and unauthorized scope expansion.
- Redact secrets, tokens, and restricted PII before provider submission where required.

## 16. Privacy, Retention, and Provider Governance

Each task class defines allowed providers, permitted data classes, retention policy, regional restrictions, redaction requirements, and whether customer content may be stored by the provider.

No provider may be enabled in production without documented terms, security review, privacy behavior, failure policy, and cost controls.

## 17. Cost and Rate Controls

- workspace, user, plan, and operation limits
- model routing by task complexity
- bounded context and output
- caching only when permission and version safe
- duplicate-request idempotency
- cost estimation before expensive workflows where useful
- anomaly detection
- admin usage visibility
- graceful limit messaging and manual fallback

## 18. UI and UX

### Web

- global search and Ask BRIX
- source and citation drawer
- proposal review and approval
- AI job center and status
- clear generated-content labels
- retry, cancel, and fallback actions

### iPhone

- concise Ask BRIX experience
- active Deal scope
- source links
- proposal review
- background job and offline-aware status

### iPad

- side-by-side source and answer
- multi-document review
- keyboard and pointer navigation
- persistent Deal context

Required states include empty, loading, streaming, queued, partial, complete, warning, low confidence, unsupported, stale, conflict, offline, failed, retry, canceled, permission denied, approval required, and provider unavailable.

## 19. Integration Requirements

AI orchestration integrates with every BRIX subsystem through versioned contracts. It consumes canonical records and creates only derived outputs or explicit proposals. Accepted proposals are applied by the owning subsystem and create audit and domain events.

Evidence controls source provenance. RELearnIQ controls educational presentation. Admin controls provider configuration, cost, usage, and operational state. Notifications communicate job completion but do not become the job source of truth.

## 20. Domain Events

- `ai.requested`
- `ai.job_started`
- `ai.job_completed`
- `ai.job_failed`
- `ai.job_canceled`
- `ai.proposal_created`
- `ai.proposal_accepted`
- `ai.proposal_rejected`
- `search.index_requested`
- `search.index_completed`
- `search.index_failed`
- `automation.waiting_for_approval`
- `automation.completed`
- `ai.usage_recorded`

Events are emitted after persistence and are idempotent.

## 21. Testing Requirements

- provider routing and fallback tests
- prompt version and schema tests
- tool allowlist and approval tests
- RLS and retrieval-scope tests
- citation and provenance fixtures
- prompt-injection and exfiltration tests
- unsupported/low-confidence/conflict tests
- AI failure and manual fallback tests
- idempotency, retry, cancel, and resume tests
- cost, quota, and anomaly tests
- model/provider outage tests
- cross-client state tests
- accessibility and performance tests
- evaluation fixtures for every production prompt and task class

## 22. Verification and Validation

### Functional verification

- Search, Ask BRIX, extraction, explanation, proposal, approval, retry, cancel, and fallback workflows operate end to end.
- Prior valid outputs remain available during failure or reprocessing.
- No AI failure blocks deterministic or manual workflows.

### Accuracy and safety verification

- Material claims link to permitted sources.
- Unsupported content is labeled.
- Prompt injection cannot change system policy, tool permissions, or retrieval scope.
- AI cannot silently mutate canonical records or perform prohibited actions.

### Integration verification

- Every module uses the shared gateway, prompt registry, tool registry, job state, provenance, and usage system.
- Evidence, RELearnIQ, Admin, reports, web, iPhone, and iPad reconcile.
- Accepted proposals flow only through the correct owning subsystem.

### Security and privacy verification

- Provider data handling, redaction, retention, regional rules, secrets, RLS, tool authorization, and audit pass.
- Deleted or revoked content is removed from retrieval according to policy.

### Definition of Done

Specification 021 is complete only when BRIX has one secure, explainable, source-grounded, cost-controlled AI and search platform with deterministic boundaries, human approval gates, graceful failure, complete provenance, and verified integration across all supported clients and modules.
