# BRIX Specification 019 — AI Orchestration, Search, and Automation

## 1. Authority and Rules of Engagement

This specification is governed by `docs/00-START-HERE.md` through `docs/05-BUILD-ROADMAP.md` and Specifications 001–018.

Rules:

1. AI is an assistive layer, not the canonical owner of facts, calculations, legal conclusions, valuation, deadlines, or user decisions.
2. Deterministic systems remain authoritative for underwriting, finance, strategy calculations, deadlines, permissions, lifecycle state, and persisted business rules.
3. AI may extract, classify, summarize, compare, explain, search, draft, prioritize, and propose actions.
4. AI may not silently mutate canonical records. Any material proposed change requires an explicit acceptance workflow by an authorized user.
5. Every AI output must preserve the source context, model, prompt version, retrieval set, timestamp, confidence, and processing status required for auditability.
6. Every claim derived from uploaded or connected evidence must link to its supporting source where possible.
7. Low-confidence, contradictory, stale, incomplete, or unsupported outputs must be visibly labeled and must not be presented as verified fact.
8. Prompt injection, untrusted document content, malformed tool output, and hostile instructions must never override BRIX system rules.
9. Model providers, prompts, tools, and routing logic must be replaceable without changing canonical domain models.
10. AI failures must degrade gracefully. The user must retain access to saved records, prior valid results, deterministic workflows, and manual entry.
11. Web, iPhone, iPad, reports, notifications, and admin must show the same canonical AI-job and accepted-result state.
12. No autonomous agent may send communications, modify financial assumptions, submit offers, accept contracts, delete evidence, change permissions, or trigger irreversible actions without explicit user authorization.
13. Search must enforce workspace, Deal, role, RLS, sharing, and sensitivity boundaries before retrieval or generation.
14. Cost, latency, privacy, and provider availability are production constraints, not afterthoughts.
15. Every automated workflow must be observable, resumable, idempotent, cancelable where practical, and safe to retry.

## 2. Mission

Provide one governed AI platform that supports every BRIX module without creating separate prompt stacks, disconnected assistants, duplicate search indexes, or inconsistent automation behavior.

The platform must help users:

- Find relevant information across a Deal, Property, portfolio, documents, photos, notes, tasks, contacts, market research, financing, offers, contracts, inspections, appraisals, reports, and education content.
- Understand what BRIX knows, what it assumes, what is missing, and what changed.
- Convert unstructured evidence into reviewable structured proposals.
- Receive concise explanations, questions, comparisons, and next-step recommendations.
- Automate repetitive work while preserving human control and auditability.

## 3. Canonical Ownership

This subsystem owns:

- AI request routing
- Model/provider abstraction
- Prompt and tool registries
- Retrieval orchestration
- Embedding and indexing jobs
- AI job state
- Response provenance
- Confidence and verification metadata
- Usage and cost records
- Automation definitions and execution state
- Agent permissions and approval gates
- Global search query orchestration

This subsystem does not own:

- Deal or Property facts
- Underwriting formulas or outputs
- Strategy rankings
- Loan calculations
- Contract deadlines
- Evidence originals
- Tasks, contacts, communications, or notifications
- User permissions
- Accepted canonical business values

Those remain owned by their respective specifications.

## 4. Core Platform Components

### 4.1 AI Gateway

The AI Gateway is the only approved server-side entry point for generative AI requests.

It must provide:

- Provider abstraction
- Model routing
- Authentication and authorization
- Prompt loading and versioning
- Tool allowlisting
- Retrieval context assembly
- Input and output schema validation
- Redaction and privacy controls
- Rate limiting
- Retry and fallback handling
- Cost and usage metering
- Structured logging
- Tracing and correlation IDs
- Response persistence where required

Client applications must never call model providers directly with privileged credentials.

### 4.2 Provider Abstraction

The platform must support interchangeable providers and models through stable internal contracts.

Each model configuration must define:

- Permanent model configuration ID
- Provider
- Provider model name
- Intended task classes
- Input/output modalities
- Maximum context
- Timeout
- Retry policy
- Cost profile
- Data-retention classification
- Regional or compliance restrictions
- Fallback model chain
- Enabled environments
- Status

Model names must not be hard-coded throughout feature code.

### 4.3 Prompt Registry

Every production prompt must have:

- Permanent prompt ID
- Version
- Owning subsystem
- Purpose
- Allowed models
- Input schema
- Output schema
- Required source context
- Tool permissions
- Safety constraints
- Evaluation fixtures
- Release status
- Change history

Prompt edits require versioning. Existing persisted outputs must retain the prompt version used.

### 4.4 Tool Registry

Tools available to AI must be explicitly registered and scoped.

Each tool must define:

- Tool ID
- Description
- Input schema
- Output schema
- Owning service
- Required role or permission
- Read or write classification
- Approval requirement
- Idempotency behavior
- Timeout
- Audit requirements
- Error contract

Write-capable tools default to denied unless the workflow explicitly authorizes them.

## 5. Deterministic and AI Boundaries

### 5.1 Deterministic authority

The following must not be delegated to a language model as the authoritative implementation:

- Financial formulas
- Payment calculations
- Underwriting metrics
- Strategy disqualifiers and scoring contracts
- Date and deadline calculations
- Permission and RLS enforcement
- Data validation
- State transitions
- Duplicate detection using canonical rules
- File hashes
- Billing totals
- Audit history
- Notification delivery state

### 5.2 Permitted AI assistance

AI may assist with:

- Document extraction
- Image and photo description
- Note transcription cleanup
- Classification
- Entity and term proposals
- Summaries
- Explanations
- Comparison narratives
- Missing-information identification
- Suggested questions
- Draft reports and messages
- Search query expansion
- Relevance ranking
- Educational guidance
- Workflow recommendations

Any proposed canonical change must pass validation and user acceptance.

## 6. Retrieval and Grounding Architecture

### 6.1 Search scopes

Supported scopes include:

- Current Deal
- Current Property
- Workspace
- Portfolio
- Evidence library
- Contracts
- Financing
- Market research
- Governance
- Inspections and appraisals
- Reports
- Tasks and timeline
- Contacts and organizations
- RELearnIQ knowledge

The default scope must be the narrowest context implied by the current screen and user request.

### 6.2 Retrieval pipeline

1. Authenticate user.
2. Resolve workspace and active context.
3. Enforce permissions and RLS.
4. Classify query intent.
5. Select allowed source collections.
6. Apply structured filters.
7. Perform keyword and semantic retrieval.
8. Rerank results.
9. Remove inaccessible, duplicate, superseded, or irrelevant chunks.
10. Assemble context within the model budget.
11. Generate structured answer.
12. Validate output schema and citations.
13. Persist provenance and usage.
14. Return answer with freshness and confidence state.

### 6.3 Indexing rules

- Original Evidence remains canonical and immutable.
- Search chunks must reference source IDs and anchors.
- Derived chunks may be regenerated without altering source records.
- Index records must include workspace, Deal, Property, source type, sensitivity, version, effective date, supersession state, and deletion state.
- Deleted or access-revoked content must be removed from retrieval promptly.
- Reindexing must be idempotent and resumable.

### 6.4 Hybrid search

Global search should combine:

- Exact identifiers
- Address and parcel matching
- Keyword search
- Structured filters
- Semantic similarity
- Recency
- Source authority
- Verification status
- Deal relevance

Semantic similarity must not override explicit permission or source-state filters.

## 7. AI Response Contract

Every persisted or user-visible AI result must support:

- Request ID
- Workspace ID
- User ID
- Deal/Property context where applicable
- Task type
- Prompt ID/version
- Model configuration ID
- Provider request ID where available
- Input source references
- Output schema version
- Generated content
- Structured findings or proposals
- Confidence
- Verification status
- Freshness state
- Created time
- Duration
- Token or unit usage
- Estimated or actual cost
- Failure details when applicable

### 7.1 Required labels

AI outputs must distinguish:

- Verified fact
- Extracted candidate
- User-provided assumption
- System estimate
- AI inference
- Recommendation
- Missing information
- Conflict
- Professional review recommended

### 7.2 Citation behavior

- Material claims must link to supporting evidence where possible.
- Answers without adequate support must say so.
- Citation anchors must remain stable across web, iPhone, iPad, reports, and exports.
- A source that is superseded, stale, or low-confidence must be labeled accordingly.

## 8. Confidence and Verification

Confidence is not a substitute for verification.

Confidence must consider:

- Source quality
- Source completeness
- Extraction certainty
- Agreement across sources
- Recency
- Model reliability for the task
- Schema validation
- Deterministic cross-checks

Supported verification states:

- Unverified
- Candidate
- User Confirmed
- Source Confirmed
- Conflicted
- Stale
- Rejected
- Superseded

High-confidence AI output may still require user or professional verification.

## 9. AI Job Lifecycle

Supported states:

- Draft
- Queued
- Running
- Waiting for dependency
- Waiting for approval
- Partial
- Completed
- Completed with warnings
- Failed
- Canceled
- Expired
- Superseded

Each job must expose:

- Current state
- Progress where measurable
- Started and updated times
- Retry count
- Dependency state
- Failure reason
- User-safe recovery action
- Prior valid result if available

Jobs must be idempotent by request key where duplicate execution would create inconsistent results or duplicate cost.

## 10. Agent and Automation Framework

### 10.1 Automation classes

Supported automation classes may include:

- Process newly uploaded evidence
- Reindex changed sources
- Detect conflicting facts
- Identify missing Deal information
- Draft verification questions
- Refresh stale market research
- Summarize Deal changes
- Prepare report drafts
- Generate task proposals
- Monitor deadlines and prerequisites
- Recommend targeted re-underwriting

### 10.2 Human approval levels

- Level 0: Read-only analysis, no mutation
- Level 1: Draft proposal only
- Level 2: User confirmation required before canonical change
- Level 3: User confirmation required before external communication or irreversible action

No workflow may implicitly escalate its approval level.

### 10.3 Prohibited autonomous actions

AI agents may not autonomously:

- Submit or counter an offer
- Accept contract terms
- Send external email or messages
- Change purchase price or financing terms
- Approve canonical facts
- Delete records or evidence
- Modify permissions
- Initiate payments
- Sign documents
- Represent professional approval

## 11. Search User Experience

### 11.1 Global search

Global search must support:

- Natural-language search
- Exact search
- Filters
- Recent searches
- Saved searches where useful
- Scope chips
- Source-type filters
- Deal and Property filters
- Verification and freshness filters
- Keyboard navigation
- Accessible result summaries

Results must show:

- Title
- Source type
- Deal/Property context
- Relevant excerpt
- Date
- Verification/freshness
- Source anchor
- Permission-aware actions

### 11.2 Ask BRIX

Ask BRIX must:

- Start with current page and active Deal context.
- Show the active scope.
- Allow the user to broaden or narrow scope.
- Cite evidence.
- Distinguish facts, assumptions, and recommendations.
- Offer direct navigation to the supporting record.
- Avoid pretending a complete answer exists when required information is missing.

### 11.3 Web

- Full search workspace
- Split-view results and source preview
- Query history
- Filter panel
- Multi-source comparison
- Job details for long-running analysis

### 11.4 iPhone

- Compact search and Ask BRIX entry
- Voice query option where permitted
- Source cards with deep links
- Clear offline behavior
- Background job status and notification

### 11.5 iPad

- Multi-column search and source review
- Drag and drop into Deal workflows
- Keyboard and pointer support
- Side-by-side answer and source evidence

## 12. Offline, Stale, and Failure Behavior

- Online generation requires connectivity unless an approved local model is explicitly supported.
- Offline clients may search approved cached metadata and records.
- Offline requests may be queued only when the user is clearly informed.
- Cached AI answers must show generated time and freshness.
- A provider outage must not block manual Deal workflows.
- Failed generation must preserve the query, context, and prior valid answer.
- Retrying must not duplicate accepted proposals or canonical changes.
- Partial results must be labeled and must not appear complete.

## 13. Security, Privacy, and Prompt Injection Defense

Required controls:

- Server-side secrets only
- Workspace and role authorization before retrieval
- RLS-compatible source filtering
- Sensitive-field redaction policies
- Provider data-retention controls
- Encryption in transit and at rest
- Input-size and file-type limits
- Malware and unsafe-content handling where applicable
- Prompt injection detection and containment
- System instruction isolation
- Tool allowlisting
- Output schema validation
- Sensitive data excluded from unsafe logs
- Abuse and rate controls
- Audit trail for material AI-assisted changes

Untrusted documents, web content, emails, and user-uploaded text are data, not instructions.

## 14. Cost and Performance Controls

The platform must support:

- Per-user and per-workspace usage limits
- Feature-based budgets
- Model routing by task complexity
- Context trimming
- Retrieval limits
- Caching where safe
- Batch processing
- Duplicate-request suppression
- Timeout policies
- Fallback models
- Cost alerts
- Admin visibility into usage anomalies

User-visible experiences must not hide unexpectedly expensive operations. Long-running or high-cost operations require appropriate confirmation or plan enforcement.

## 15. Observability and Administration

Admin and operations must be able to review:

- Request volume
- Success and failure rates
- Latency
- Provider availability
- Model usage
- Prompt versions
- Token or unit usage
- Cost
- Retry rates
- Tool errors
- Retrieval quality indicators
- Citation coverage
- User-reported quality issues
- Safety or injection events

Logs must use correlation IDs and must not expose sensitive source content unnecessarily.

## 16. Domain Events

At minimum:

- `ai.requested`
- `ai.started`
- `ai.partial_result_available`
- `ai.completed`
- `ai.failed`
- `ai.canceled`
- `ai.proposal_created`
- `ai.proposal_accepted`
- `ai.proposal_rejected`
- `ai.output_superseded`
- `search.index_requested`
- `search.index_completed`
- `search.index_failed`
- `search.query_executed`
- `automation.started`
- `automation.waiting_for_approval`
- `automation.completed`
- `automation.failed`

Events must be emitted only after the relevant state is persisted.

## 17. Testing Requirements

### 17.1 Unit tests

- Provider routing
- Prompt selection
- Schema validation
- Permission filtering
- Confidence and state mapping
- Retry and fallback policies
- Cost calculation
- Idempotency

### 17.2 Integration tests

- Retrieval across canonical modules
- RLS and workspace isolation
- Source citation integrity
- Proposal acceptance workflows
- Tool permission enforcement
- Background job lifecycle
- Index update after source change or deletion

### 17.3 Evaluation fixtures

Each production AI task requires representative fixtures covering:

- Correct output
- Missing information
- Conflicting sources
- Low-quality scans
- Stale sources
- Prompt injection attempts
- Unsupported request
- Provider failure
- Schema-invalid output

### 17.4 End-to-end tests

- Ask BRIX from an active Deal
- Global search with filters
- Document extraction to reviewable proposal
- User acceptance causing canonical update through the owning subsystem
- Re-underwriting trigger after accepted material change
- Offline queue and recovery
- Provider outage and fallback
- Web/iPhone/iPad source reconciliation

## 18. Verification and Validation

### 18.1 Functional verification

- All AI requests route through the approved gateway.
- Search returns only authorized sources.
- Answers cite supporting evidence where available.
- AI proposals never become canonical without the required approval.
- Jobs save, reopen, retry, cancel, and preserve prior valid output.
- Provider failures do not block deterministic workflows.

### 18.2 Integration verification

- Evidence, Deal, Property, ContractIQ, PhotoIQ, VisitIQ, InspectionIQ, AppraisalIQ, FinanceIQ, MarketIQ, GovernanceIQ, OfferIQ, ReportIQ, RELearnIQ, notifications, and admin use the same AI platform contracts.
- Accepted proposals flow through the owning subsystem rather than directly writing foreign canonical tables.
- Material accepted changes trigger targeted downstream recalculation, stale-state updates, timeline events, and reports where required.
- No subsystem creates a duplicate prompt gateway, vector index, AI job table, or provider integration.

### 18.3 Security verification

- Workspace isolation is tested.
- Prompt injection cannot override system rules or expand tool permissions.
- Provider credentials are absent from clients.
- Sensitive content is protected in logs, traces, and analytics.
- External communications and irreversible actions always require explicit authorization.

### 18.4 UX verification

- Web, iPhone, and iPad clearly show scope, sources, confidence, freshness, processing, failure, retry, and approval states.
- Search results deep-link to canonical records.
- Partial and stale answers are never presented as current and complete.
- Accessibility and keyboard/touch behavior pass required tests.

### 18.5 Production readiness gate

This specification is complete only when:

- No production feature calls a model provider directly from the client.
- All prompts and tools are registered, versioned, and permissioned.
- Retrieval is permission-safe and source-linked.
- AI and deterministic authority boundaries are enforced in code and tests.
- Cost, latency, failure, fallback, and provider-outage behavior are observable.
- Automated workflows are idempotent, auditable, and approval-gated.
- No dead controls, fake success, unsupported autonomous behavior, or disconnected AI experiences remain.
- A senior engineer or Codex can implement the subsystem without inventing architecture, permissions, ownership, or completion criteria.

## 19. Definition of Done

`specs/019-ai-orchestration-search-and-automation.md` is done only when the implemented platform provides one secure, observable, provider-agnostic AI and search layer; preserves canonical ownership; grounds material claims in authorized evidence; supports reviewable proposals and controlled automation; works consistently across web, iPhone, and iPad; and passes all functional, integration, security, evaluation, recovery, and production-readiness checks above.
