# BRIX Specification 012 — OfferIQ and Negotiation Management

## 1. Authority and Rules of Engagement

This specification is governed by:

- `docs/00-START-HERE.md`
- `docs/01-PRODUCT-CONSTITUTION.md`
- `docs/02-ENGINEERING-STANDARDS.md`
- `docs/03-DATA-ARCHITECTURE.md`
- `docs/04-UI-UX-SYSTEM.md`
- `docs/05-BUILD-ROADMAP.md`
- `specs/001-authentication-and-workspaces.md`
- `specs/002-dashboard-and-application-shell.md`
- `specs/003-deals-and-pdrm-core.md`
- `specs/004-property-intake-and-source-tracking.md`
- `specs/005-deterministic-underwriting-engine.md`
- `specs/006-strategy-intelligence-engine.md`
- `specs/007-decision-cockpit.md`
- `specs/008-marketiq-and-location-intelligence.md`
- `specs/009-financeiq-and-capital-structure.md`
- `specs/010-governanceiq-associations-and-restrictions.md`
- `specs/011-contractiq-and-real-estate-document-intelligence.md`

Codex must re-read all governing product, engineering, data, UI/UX, security, state, audit, integration, and chapter-completion rules before implementing OfferIQ.

### Non-negotiable OfferIQ rules

1. OfferIQ uses the canonical `deal_id`, `property_id`, underwriting snapshots, strategy scenarios, financing structures, evidence, contacts, tasks, deadlines, timeline, reports, and audit systems.
2. OfferIQ must not create a second underwriting engine, a duplicate negotiation timeline, a duplicate task system, or standalone offer records disconnected from the Deal.
3. Every authoritative money value must come from the canonical deterministic underwriting engine or an explicitly user-entered offer term.
4. AI may summarize, explain, compare, draft questions, and suggest negotiation considerations. AI may not set the authoritative maximum offer, guarantee acceptance, determine legal sufficiency, or silently change offer terms.
5. Every offer version, counteroffer, revision, withdrawal, rejection, acceptance, expiration, and communication must preserve history.
6. OfferIQ must distinguish system guidance, user preference, broker advice, attorney advice, lender constraints, seller response, and confirmed executed terms.
7. No term may be presented as accepted, executed, binding, or final unless its status and source support that classification.
8. OfferIQ must clearly identify the binding constraint behind a maximum offer or walk-away point.
9. OfferIQ must not hide a hard strategy, financing, governance, appraisal, inspection, contract, or investor constraint behind a favorable score.
10. Every submitted or accepted offer must remain reproducible from the assumptions, financing, evidence, engine version, and term version that existed at that time.
11. Web, iPhone, iPad, reports, notifications, ContractIQ, FinanceIQ, Decision Cockpit, and the Deal timeline must show the same canonical offer status.
12. Failed background processing, document generation, communication delivery, or sync must never replace or hide a prior valid offer version.
13. Every visible action must work end to end or remain hidden behind a feature flag.
14. Every asynchronous action must expose durable queued, processing, completed, partial, failed, stale, conflict, cancelled, and retry states where relevant.
15. OfferIQ is decision support and workflow management. It does not replace a licensed real estate broker, attorney, lender, tax advisor, or other professional.

---

## 2. Mission

OfferIQ converts a fully researched and underwritten Deal into a disciplined, evidence-backed offer strategy and a controlled negotiation record.

OfferIQ must help the investor answer:

1. What should I offer?
2. What is the maximum I should offer?
3. What is the walk-away point?
4. Which constraint sets that limit?
5. Which terms matter as much as price?
6. Which contingencies and protections are required?
7. How does this offer affect the intended strategy, financing, cash required, and return?
8. What changes if the seller counters?
9. What concessions can be traded without damaging the Deal?
10. What must be verified before submission or acceptance?
11. What happened during negotiation, and why was each decision made?
12. What deadlines and next actions follow from the current offer state?

OfferIQ must support simple residential offers, commercial letters of intent, land and development offers, portfolio offers, distressed transactions, seller-financed structures, assumable financing, and other lawful real estate transaction structures.

---

## 3. Scope

OfferIQ includes:

- Offer strategy
- Recommended offer range
- Maximum offer
- Walk-away threshold
- Price and non-price term structuring
- Residential offers
- Commercial letters of intent
- Land and development offers
- Portfolio and multi-property offers
- Seller-financed offers
- Assumable financing offers
- Creative-finance discussion structures where lawful
- Earnest money
- Deposits
- Credits and concessions
- Inspection terms
- Appraisal terms
- Financing terms
- Due-diligence periods
- Attorney review where applicable
- Title and survey terms
- Association and governance review terms
- Closing date
- Possession
- Repair and improvement terms
- Escalation structures
- Backup offers
- Option structures
- Assignment terms
- Confidentiality and access terms
- Revisions and counteroffers
- Negotiation limits and trade-offs
- Offer communications
- Offer document generation
- Offer status tracking
- Offer deadlines and reminders
- Offer comparison
- Offer decision history
- Accepted-offer handoff to ContractIQ and Deal stage management

OfferIQ does not:

- Draft jurisdiction-specific legal documents without approved templates and professional review
- Guarantee acceptance
- Guarantee enforceability
- Replace legal review
- Replace broker judgment
- Approve financing
- Override underwriting or financing constraints
- Present seller intent as fact without source evidence
- Submit communications or documents without explicit authorized user action

---

## 4. Canonical Ownership

### 4.1 Canonical entities

OfferIQ must use or create canonical records for:

- `offer_id`
- `offer_version_id`
- `deal_id`
- `property_id`
- `workspace_id`
- `strategy_scenario_id`
- `underwriting_snapshot_id`
- `underwriting_result_id`
- `financing_structure_id`
- `contact_id`
- `organization_id`
- `evidence_id`
- `contract_id`
- `task_id`
- `deadline_id`
- `communication_id`
- `audit_event_id`

### 4.2 Ownership boundaries

OfferIQ owns:

- Offer strategy records
- Offer versions
- Counteroffer versions
- Offer comparison
- Negotiation limits
- Negotiation decision records
- Offer-specific communications
- Offer-specific document-generation requests
- Offer-specific status
- Offer-specific deadlines before executed contract handoff

OfferIQ does not own:

- Canonical property facts
- Canonical underwriting formulas
- Canonical financing calculations
- Canonical governance findings
- Canonical contract interpretation
- Canonical inspection findings
- Canonical appraisal findings
- General tasks and deadlines infrastructure
- General contacts and organizations infrastructure
- General evidence storage
- General notification delivery infrastructure

### 4.3 Active offer rule

A Deal may contain multiple offer drafts and scenarios, but only one offer version may be designated as the active negotiation position for a specific recipient and negotiation thread.

Changing the active version must:

1. Preserve the prior version.
2. Record the reason.
3. Record the author and timestamp.
4. Recalculate Deal impact when terms changed.
5. Update the Decision Cockpit freshness state.
6. Update related deadlines and next actions.
7. Preserve all previous communications and responses.

---

## 5. Offer Domain Model

### 5.1 `offers`

Required fields:

- `id`
- `workspace_id`
- `deal_id`
- `property_id`
- `offer_type`
- `perspective`
- `recipient_contact_id`
- `recipient_organization_id`
- `status`
- `active_version_id`
- `negotiation_thread_id`
- `strategy_scenario_id`
- `underwriting_snapshot_id`
- `financing_structure_id`
- `created_by`
- `created_at`
- `updated_at`
- `archived_at`

Supported offer types:

- Residential purchase offer
- Commercial letter of intent
- Commercial purchase offer
- Land purchase offer
- Development offer
- Portfolio offer
- Backup offer
- Option offer
- Seller-financing offer
- Assumption offer
- Subject-to discussion offer where lawful
- Lease-option offer
- Ground-lease proposal
- Joint-venture proposal
- Other approved transaction structure

Supported statuses:

- Draft
- Ready for review
- Under professional review
- Approved for submission
- Submitted
- Delivered
- Viewed where evidence exists
- Awaiting response
- Countered
- Revised
- Accepted in principle
- Accepted
- Partially executed
- Executed
- Rejected
- Withdrawn
- Expired
- Superseded
- Backup position
- Cancelled
- Failed delivery
- Unknown

### 5.2 `offer_versions`

Every material change creates a new immutable version.

Required fields:

- `id`
- `offer_id`
- `version_number`
- `version_type`
- `parent_version_id`
- `source_type`
- `source_evidence_id`
- `prepared_by`
- `approved_by`
- `created_at`
- `effective_at`
- `expires_at`
- `submission_at`
- `response_due_at`
- `status`
- `currency_code`
- `purchase_price`
- `earnest_money_amount`
- `additional_deposit_amount`
- `seller_credit_amount`
- `repair_credit_amount`
- `closing_cost_credit_amount`
- `financing_amount`
- `cash_amount`
- `closing_date`
- `possession_date`
- `due_diligence_deadline`
- `inspection_deadline`
- `financing_deadline`
- `appraisal_deadline`
- `title_deadline`
- `survey_deadline`
- `governance_review_deadline`
- `attorney_review_deadline`
- `assignment_permission`
- `escalation_enabled`
- `escalation_cap`
- `escalation_increment`
- `proof_requirement`
- `contingency_summary`
- `special_terms_summary`
- `verification_state`
- `professional_review_state`
- `engine_version`
- `underwriting_result_id`
- `financing_structure_id`
- `strategy_scenario_id`
- `created_reason`

### 5.3 `offer_terms`

Terms must be normalized into explicit records rather than hidden only in generated prose.

Required fields:

- `id`
- `offer_version_id`
- `term_type`
- `title`
- `normalized_value`
- `display_value`
- `unit`
- `currency_code`
- `term_status`
- `source_classification`
- `verification_state`
- `materiality`
- `required_for_submission`
- `required_for_acceptance`
- `professional_review_required`
- `related_constraint_id`
- `related_evidence_id`
- `notes`

### 5.4 `offer_constraints`

Required constraint types include:

- Maximum cash available
- Minimum cash reserve
- Maximum price
- Maximum total project cost
- Minimum cash-on-cash return
- Minimum DSCR
- Minimum IRR
- Minimum equity multiple
- Maximum monthly payment
- Maximum annual debt service
- Maximum renovation budget
- Maximum holding period
- Maximum break-even occupancy
- Maximum LTV
- Maximum LTC
- Minimum debt yield
- Appraisal dependency
- Financing-program limit
- Governance restriction
- Rental restriction
- Use restriction
- Zoning restriction
- Insurance constraint
- Inspection finding
- Contract condition
- Seller condition
- Closing-timeline requirement
- Investor preference
- Partner approval
- Professional advice

Each constraint must store:

- Source
- Value or rule
- Hard or soft classification
- Effective date
- Verification state
- Result
- Binding/nonbinding state
- Explanation

### 5.5 `negotiation_decisions`

Required fields:

- `id`
- `offer_id`
- `offer_version_id`
- `decision_type`
- `decision`
- `rationale`
- `decided_by`
- `decided_at`
- `related_counter_version_id`
- `related_constraint_id`
- `before_state`
- `after_state`
- `professional_input_reference`

Decision types:

- Submit
- Revise
- Counter
- Accept
- Reject
- Withdraw
- Extend
- Hold
- Escalate
- Reduce contingency
- Increase deposit
- Change financing
- Change closing date
- Change possession
- Add or remove term
- Walk away

### 5.6 `offer_communications`

Offer communications must link to the canonical communications/evidence model and retain:

- Sender
- Recipient
- Channel
- Subject
- Message body
- Attachments
- Related offer version
- Delivery state
- Delivery timestamp
- Failure reason
- Reply relationship
- Evidence record
- User authorization record

---

## 6. Offer Strategy Engine

OfferIQ must use canonical underwriting and strategy results to produce a deterministic offer guidance package.

### 6.1 Required outputs

- Recommended opening offer
- Recommended offer range
- Maximum offer
- Walk-away price
- Maximum total project cost
- Maximum cash required
- Binding constraint
- Secondary constraints
- Recommended earnest money range
- Recommended contingency position
- Recommended closing timeline
- Recommended possession position
- Financing compatibility
- Strategy compatibility
- Governance compatibility
- Appraisal sensitivity
- Inspection sensitivity
- Seller-credit trade-off impact
- Repair-credit trade-off impact
- Rate-change sensitivity
- Confidence
- Missing decision-changing inputs
- Required verification before submission

### 6.2 Maximum offer

The authoritative maximum offer must come from the deterministic underwriting engine using the active:

- Strategy scenario
- Assumption set
- Financing structure
- Return requirements
- Cash constraints
- Repair and capital budget
- Transaction costs
- Holding assumptions
- Exit assumptions
- Governance constraints
- Appraisal constraints
- Inspection constraints
- Investor constraints

OfferIQ must show:

- Exact maximum offer
- Display-rounded maximum offer
- Binding formula or constraint
- Supporting inputs
- Engine version
- Snapshot date/time
- Confidence
- Stale state

### 6.3 Opening offer guidance

Opening offer guidance may consider:

- Maximum offer
- User negotiation style
- Listing price
- Market evidence
- Days on market
- Price reductions
- Comparable evidence
- Seller-provided information
- Property condition
- Competition evidence
- Financing strength
- Closing speed
- Contingency strength
- Cash certainty
- Seller credits
- Required repairs
- User-defined negotiation margin

The app must clearly distinguish deterministic maximum-offer logic from heuristic opening-offer guidance.

### 6.4 Hard disqualifiers

OfferIQ must block or strongly warn when:

- Required financing is not feasible
- Required use is prohibited
- Required rental strategy is prohibited
- Maximum offer is below zero or otherwise invalid
- Required cash exceeds user limit
- Required return cannot be met
- Critical source data is stale or missing
- Appraisal assumption is unsupported and material
- Inspection condition creates unresolved safety or structural risk
- Contract term would eliminate a required protection
- Offer submission authority is missing
- Required professional review is incomplete

A user with permission may override some warnings, but hard regulatory, authorization, or security restrictions may not be overridden.

---

## 7. Supported Offer Structures

### 7.1 Residential purchase

Required support:

- Price
- Earnest money
- Additional deposit
- Financing type
- Down payment
- Financing contingency
- Appraisal contingency
- Inspection contingency
- Attorney review where applicable
- Association review
- Sale-of-home contingency where applicable
- Closing date
- Possession
- Seller credits
- Repair credits
- Personal property
- Escalation clause structure
- Backup offer
- Post-closing possession

### 7.2 Commercial letter of intent

Required support:

- Purchase price or pricing method
- Deposit structure
- Due-diligence period
- Access rights
- Financing period
- Closing period
- Title and survey
- Environmental review
- Lease and financial review
- Confidentiality
- Exclusivity/no-shop where applicable
- Assignment
- Prorations
- Existing contracts
- Tenant deposits
- Brokerage
- Nonbinding/binding section classification
- Governing professional review

### 7.3 Land and development

Required support:

- Price per acre/unit/lot
- Surveyed area adjustment
- Option period
- Extension options
- Entitlement contingency
- Zoning contingency
- Annexation contingency
- Utility availability
- Soil/geotechnical review
- Environmental review
- Wetlands/flood review
- Access/easement review
- Subdivision approval
- Development agreement
- Infrastructure obligations
- Phased closing
- Takedown schedule
- Earnout
- Seller participation

### 7.4 Seller financing and assumption

Required support:

- Purchase price
- Cash down payment
- Seller note principal
- Rate
- Amortization
- Term
- Balloon
- Payment frequency
- Security position
- Prepayment
- Default terms
- Due-on-sale considerations
- Existing debt
- Assumption requirements
- Lender consent
- Servicing
- Taxes and insurance handling
- Professional review requirement

OfferIQ may model economics but must not represent a creative-finance structure as lawful, approved, or enforceable without appropriate professional review.

### 7.5 Portfolio and multi-property

Required support:

- Aggregate price
- Property allocation
- Package-only or severable status
- Cross-default conditions
- Property-level due diligence
- Property-level financing allocation
- Portfolio-level financing
- Partial release
- Failed-property removal rights
- Closing sequencing
- Portfolio maximum offer
- Property-level contribution to return and risk

---

## 8. Negotiation Management

### 8.1 Negotiation thread

Every offer negotiation must preserve one canonical thread containing:

- All versions
- All counteroffers
- All communications
- All deadlines
- All decisions
- All professional input references
- All seller/buyer responses
- All status changes
- All related evidence
- All before-and-after financial impacts

### 8.2 Counteroffer workflow

1. Receive or manually enter counteroffer.
2. Preserve original source evidence.
3. Extract or enter changed terms.
4. Compare against active offer version.
5. Identify all changed terms.
6. Recalculate Deal impact.
7. Re-evaluate strategy and financing compatibility.
8. Update maximum-offer and walk-away comparison.
9. Identify new risks or lost protections.
10. Present options: accept, reject, counter, hold, request clarification, or walk away.
11. Require explicit authorized user decision.
12. Create new immutable version if countering.
13. Update timeline, tasks, deadlines, Cockpit, reports, and notifications.

### 8.3 Trade-off analysis

OfferIQ must show the effect of changing:

- Price
- Seller credits
- Repair credits
- Earnest money
- Deposit timing
- Financing type
- Down payment
- Rate assumption
- Closing date
- Possession
- Due-diligence period
- Inspection protection
- Appraisal protection
- Financing protection
- Assignment
- Escalation cap
- Property included/excluded
- Personal property
- Seller-financing terms

Each trade-off must show:

- Cash required
- Monthly payment
- Debt service
- NOI where applicable
- Cash flow
- Cash-on-cash return
- DSCR
- IRR where applicable
- Equity multiple where applicable
- Maximum offer margin
- Risk impact
- Strategy impact
- Financing impact
- Deadline impact

### 8.4 Walk-away control

The user may define a walk-away price or condition, but BRIX must also calculate the system walk-away point based on hard constraints.

The UI must distinguish:

- System maximum
- User maximum
- Broker-suggested maximum
- Partner-approved maximum
- Current counter
- Current proposed response

No participant-specific maximum may be exposed to unauthorized external recipients.

---

## 9. Offer Preparation Workflow

### 9.1 Entry points

OfferIQ must be reachable from:

- Decision Cockpit
- Deal navigation
- Underwriting result
- Strategy comparison
- FinanceIQ
- ContractIQ
- Task or notification
- Search
- Recent work

Every entry must open the correct Deal and active offer context.

### 9.2 Guided workflow

1. Confirm intended strategy.
2. Confirm active underwriting snapshot.
3. Confirm financing structure.
4. Review maximum offer and constraints.
5. Review missing and stale inputs.
6. Select offer type.
7. Enter or accept recommended price position.
8. Configure money terms.
9. Configure contingencies and due diligence.
10. Configure closing and possession.
11. Configure special terms.
12. Review professional-review requirements.
13. Review before-and-after Deal impact.
14. Generate summary or approved document.
15. Approve for submission.
16. Submit through supported channel or record external submission.
17. Create response deadline and follow-up task.

### 9.3 Professional mode

Professional mode must support direct access to:

- All normalized terms
- Multiple offer structures
- Side-by-side versions
- Term matrix
- Constraint matrix
- Financing alternatives
- Scenario comparison
- Negotiation history
- Export and template controls

Guided and professional modes must use the same canonical records.

---

## 10. Document Generation

OfferIQ may generate:

- Offer summary
- Buyer instruction sheet
- Broker instruction sheet
- Commercial LOI
- Land offer summary
- Financing-term summary
- Counteroffer comparison
- Negotiation decision memo
- Questions for attorney, broker, lender, seller, or partner
- Verification checklist
- Approved jurisdiction-specific form population where supported

### 10.1 Generation rules

- Generated documents must use canonical offer terms.
- Every generated document must record offer version, template version, generation date, author, and status.
- Generated text must not invent missing terms.
- Missing required terms must block final generation or be visibly labeled.
- Legal templates require approved template governance.
- AI-generated narrative must be reviewable before use.
- Generated documents must not be treated as submitted until actual submission is recorded.
- Regeneration must not overwrite prior generated documents.

---

## 11. Communications and Submission

### 11.1 Supported channels

- Email
- Download for external submission
- Broker handoff
- Secure share link where appropriate
- Manual record of phone/text/in-person communication
- Future approved integrations

### 11.2 Authorization

Only authorized users may:

- Approve an offer for submission
- Send an offer communication
- Accept a counteroffer
- Withdraw an offer
- Record execution
- Change a walk-away control

### 11.3 Delivery states

- Draft
- Queued
- Sending
- Sent
- Delivered where confirmed
- Viewed where confirmed
- Failed
- Retry scheduled
- Cancelled
- Recorded externally

A failed delivery must preserve the offer and communication draft and provide a safe retry.

---

## 12. User Experience Requirements

### 12.1 Premium experience principles

OfferIQ must feel controlled, calm, precise, and decision-oriented.

The user must immediately understand:

- Current offer status
- Current version
- Current price
- Maximum offer
- Margin to maximum
- Binding constraint
- Seller response
- Response deadline
- Major protections
- Material risks
- Next action
- Whether results are current or stale

### 12.2 Web layout

Recommended structure:

- Persistent Deal header
- Offer status and deadline banner
- Current offer summary
- Maximum-offer and walk-away panel
- Price and terms editor
- Constraint panel
- Financial impact panel
- Strategy and financing impact
- Version comparison
- Negotiation timeline
- Communications
- Documents
- Questions and verification
- Related ContractIQ and FinanceIQ links

Desktop layouts may use multi-column comparison. The user must not lose the current price, maximum offer, or active deadline while reviewing deeper terms.

### 12.3 iPhone experience

Prioritize:

- Current status
- Price and maximum
- Counteroffer summary
- Key changed terms
- Deadline
- Accept/reject/counter/hold actions
- Quick note or voice note
- Communication record
- Document view
- Offline draft

Critical actions require clear confirmation and must not be placed where accidental taps are likely.

### 12.4 iPad experience

Support:

- Offer editor and impact analysis side by side
- Document and term comparison
- Multi-version comparison
- Drag and drop
- Keyboard shortcuts
- Pointer support
- Split-view negotiation workflow
- Broker/attorney review context

The iPad experience must not be a stretched iPhone layout.

### 12.5 Forms

- Autosave drafts.
- Show saved, syncing, stale, conflict, and failed states.
- Preserve progress after refresh, relaunch, auth refresh, or recoverable network failure.
- Use clear units and currency.
- Distinguish required, optional, proposed, confirmed, and professional-review fields.
- Show the financial impact of material changes before finalizing.
- Prevent accidental submission.

### 12.6 Empty, loading, and error states

Required states:

- No offer created
- Offer draft incomplete
- Underwriting missing
- Underwriting stale
- Financing missing
- Required professional review missing
- Loading current version
- Recalculating impact
- Counteroffer processing
- Document generation queued
- Delivery failed
- Offline draft
- Sync conflict
- Permission denied
- Offer expired
- Prior valid analysis with current processing failure

No state may end in a dead end. Each must provide the correct next action.

---

## 13. State, Freshness, Offline, and Conflict Rules

### 13.1 Freshness

Offer guidance becomes stale when material dependencies change, including:

- Underwriting assumptions
- Financing terms
- Strategy selection
- Market evidence
- Governance restrictions
- Inspection findings
- Appraisal value
- Contract constraints
- Investor return requirements
- Cash constraints

Stale offers remain visible but must be clearly labeled. Submission must require refresh or explicit authorized override with rationale when material.

### 13.2 Offline behavior

Supported offline actions may include:

- View cached current offer
- Draft notes
- Draft term changes
- Record a communication
- Capture a counteroffer photo or document
- Create a counteroffer draft

Offline restrictions:

- Do not submit externally without connectivity confirmation.
- Do not claim recalculation is current without server result.
- Mark local changes as unsynced.
- Preserve local drafts securely.

### 13.3 Conflict resolution

When the same offer version changes on multiple clients:

- Detect version mismatch before overwrite.
- Preserve both versions.
- Show field-level differences.
- Allow authorized user to choose or merge.
- Recalculate after resolution.
- Record audit history.

No last-write-wins behavior is permitted for material offer terms.

---

## 14. Integration Requirements

### 14.1 Underwriting

OfferIQ consumes authoritative:

- Maximum offer
- Cash required
- Return metrics
- Debt metrics
- Sensitivities
- Binding constraints
- Engine version

OfferIQ must never recalculate these independently.

### 14.2 Strategy Intelligence

Offer changes may:

- Improve or weaken strategy fit
- Trigger disqualification
- Change ranking
- Change confidence

Material changes emit a targeted strategy re-evaluation event.

### 14.3 FinanceIQ

OfferIQ consumes active financing structure and must show:

- Financing feasibility
- Rate/term assumptions
- Cash required
- Closing timeline compatibility
- Lender conditions
- Expiration

Accepted offer terms may propose FinanceIQ updates but may not silently overwrite confirmed financing.

### 14.4 GovernanceIQ

OfferIQ consumes:

- Association approval requirements
- Rental restrictions
- Use restrictions
- Parking/vehicle/trailer restrictions
- Transfer fees
- Right of first refusal
- Review deadlines

Required protections must be available as offer terms or verification items.

### 14.5 ContractIQ

Before execution, OfferIQ owns the negotiation version. After an accepted or executed document is received:

- ContractIQ preserves and analyzes the source document.
- ContractIQ identifies discrepancies between negotiated and executed terms.
- ContractIQ creates verified deadlines.
- OfferIQ remains the negotiation history.
- No executed contract term is assumed from an offer summary alone.

### 14.6 Decision Cockpit

The Cockpit must show:

- Offer status
- Current price
- Maximum offer
- Margin
- Deadline
- Seller response
- Required next action
- Material stale/conflict state
- Offer-related risk

### 14.7 Tasks and notifications

OfferIQ may create:

- Review offer
- Obtain approval
- Submit offer
- Follow up
- Respond to counter
- Verify financing
- Verify funds
- Obtain attorney review
- Obtain broker review
- Extend offer
- Withdraw offer

Notifications must deep-link to the exact Deal and offer version.

### 14.8 Reports

ReportIQ may consume:

- Offer summary
- Offer comparison
- Counteroffer comparison
- Negotiation timeline
- Decision rationale
- Final accepted offer summary

Reports must identify the exact offer version and generation date.

---

## 15. Permissions and Security

Minimum permissions:

- View offers
- Create draft offer
- Edit draft offer
- View negotiation limits
- Change negotiation limits
- Approve offer
- Submit offer
- Record external submission
- Accept/counter/reject/withdraw
- Generate documents
- Share offer documents
- View private negotiation notes
- Administer templates

Security rules:

- Workspace scope enforced through RLS.
- Sensitive negotiation limits are restricted by role.
- Private notes are not included in external documents or shares.
- Submission actions require server-side authorization.
- Storage objects use authorized access.
- Secrets remain server-side.
- Communications are audited.
- Rate limits apply to generation and sending.
- Prompt injection from seller documents or emails cannot override system rules.
- Logs must exclude sensitive terms where unnecessary.

---

## 16. Domain Events

OfferIQ must emit durable, idempotent events such as:

- `offer.created`
- `offer.version_created`
- `offer.guidance_calculated`
- `offer.guidance_stale`
- `offer.approval_requested`
- `offer.approved`
- `offer.submission_requested`
- `offer.submitted`
- `offer.delivery_failed`
- `offer.response_received`
- `offer.counter_received`
- `offer.counter_created`
- `offer.accepted`
- `offer.rejected`
- `offer.withdrawn`
- `offer.expired`
- `offer.superseded`
- `offer.executed_document_received`
- `offer.negotiation_decision_recorded`

Expected consumers:

- Deal timeline
- Decision Cockpit
- Tasks and deadlines
- Notifications
- ContractIQ
- FinanceIQ
- Underwriting
- Strategy engine
- ReportIQ
- Audit and analytics

Events must be emitted after canonical persistence and consumed idempotently.

---

## 17. Background Jobs

Potential jobs:

- Recalculate offer guidance
- Compare versions
- Extract counteroffer terms
- Generate documents
- Deliver communications
- Produce PDFs
- Refresh reports
- Notify stakeholders

Every job must expose:

- Job ID
- Offer/version ID
- Status
- Created/start/completion timestamps
- Attempt count
- Idempotency key
- Failure category
- User-safe message
- Retry eligibility
- Correlation ID

A job may not remain indefinitely in a generic processing state. Timeouts and escalation rules are required.

---

## 18. Performance Requirements

- Cached offer workspace should render quickly with current known state.
- User edits should receive immediate local acknowledgment.
- Canonical save should complete promptly under normal conditions.
- Material recalculation should show progress and preserve prior valid results.
- Large negotiation histories must paginate or virtualize.
- Version comparison should avoid downloading unrelated evidence.
- Document generation should run asynchronously when necessary.
- Mobile must remain responsive during uploads and recalculation.

Exact performance budgets must be defined during implementation based on the governing engineering standards and measured in CI/staging.

---

## 19. Accessibility Requirements

- Meet WCAG 2.2 AA on web.
- Support VoiceOver and Dynamic Type on iOS/iPadOS.
- Do not use color alone for accept/counter/reject or risk states.
- All financial charts require text equivalents.
- Form errors must be announced and linked to fields.
- Keyboard-only web workflows must support offer creation and comparison.
- Focus must move predictably after validation failures and modal actions.
- Destructive actions must be clearly labeled.
- Reduced-motion preferences must be respected.

---

## 20. Analytics and Observability

Track operationally useful events without exposing sensitive negotiation content:

- Offer created
- Guidance calculated
- Draft completed
- Approval requested
- Submitted
- Counter received
- Accepted/rejected/withdrawn
- Delivery failure
- Document generation failure
- Conflict detected
- Stale offer blocked
- Professional review required

Observability must include:

- Structured logs
- Correlation IDs
- Error tracking
- Job metrics
- Provider delivery status
- Recalculation latency
- Failure rates
- Retry rates
- No sensitive data leakage

---

## 21. Testing Requirements

### 21.1 Unit tests

- Maximum-offer contract consumption
- Constraint evaluation
- Offer versioning
- Price and term comparison
- Deadline calculation
- Status transition rules
- Trade-off calculations delegated correctly
- Stale-state determination
- Permission checks

### 21.2 Integration tests

- OfferIQ with underwriting
- OfferIQ with strategy engine
- OfferIQ with FinanceIQ
- OfferIQ with GovernanceIQ
- OfferIQ with ContractIQ
- OfferIQ with tasks, notifications, timeline, and reports
- Storage and communication delivery
- RLS and role permissions

### 21.3 End-to-end tests

At minimum:

1. User opens a fully underwritten Deal.
2. OfferIQ shows current guidance and binding constraint.
3. User creates a draft residential offer.
4. Draft autosaves and reopens.
5. User changes price and sees canonical impact.
6. User requests approval.
7. Authorized user approves.
8. User records or performs submission.
9. Response deadline is created.
10. Counteroffer is received and preserved.
11. Changed terms are compared.
12. Deal is recalculated.
13. User counters within limits.
14. Seller accepts.
15. Executed document is handed to ContractIQ.
16. Cockpit, timeline, tasks, notifications, and reports reconcile.

Also test commercial LOI, land/development offer, seller financing, expired offer, failed delivery, offline draft, stale underwriting, and version conflict.

### 21.4 Regression tests

- No duplicate offers after retry
- No lost offer versions
- No stale result presented as current
- No client-side authoritative math
- No cross-workspace access
- No private negotiation limits in external output
- No incorrect deep link
- No executed contract assumption from unexecuted offer
- No orphaned deadlines, communications, or documents

---

## 22. Verification and Validation

### Functional verification

- Offer can be created, saved, reopened, revised, compared, approved, submitted, countered, accepted, rejected, withdrawn, expired, archived, and restored according to policy.
- Every visible control works end to end.
- Drafts survive refresh, relaunch, auth refresh, and recoverable network failure.
- Communications and generated documents attach to the correct offer version.
- Counteroffer comparison identifies every changed material term.
- Failed delivery or generation preserves prior valid data and allows retry.

### Financial and decision verification

- Maximum offer comes only from the canonical underwriting engine.
- Binding constraint is accurate and explainable.
- Trade-off analysis reconciles to canonical results.
- Identical inputs and engine version reproduce identical guidance.
- Web, iPhone, iPad, reports, and exports show the same material values.
- User, broker, partner, and system limits remain distinct.

### Integration verification

- OfferIQ uses the canonical Deal, Property, Evidence, contacts, tasks, deadlines, timeline, financing, strategy, and audit systems.
- Accepted changes trigger only the correct connected workflows.
- Domain events are emitted once and consumed idempotently.
- No duplicate business logic or disconnected module state exists.
- ContractIQ receives executed source documents and identifies discrepancies.
- Decision Cockpit reflects current offer state and freshness.
- Reports identify the exact offer version.

### UX verification

- Current price, maximum offer, margin, status, deadline, risk, and next action are immediately clear.
- Web, iPhone, and iPad layouts are complete and intentional.
- Loading, empty, partial, stale, offline, conflict, permission, failure, retry, and recovery states are designed and tested.
- Beginner guidance does not block professional workflows.
- No workflow ends in a dead end.
- Accessibility and keyboard/touch behavior pass.

### Security verification

- RLS prevents cross-workspace access.
- Server-side permissions protect approval, submission, acceptance, withdrawal, and sensitive limits.
- Private negotiation information is excluded from external outputs.
- Storage and communications are authorized and audited.
- Prompt injection cannot bypass system rules.
- Secrets and sensitive data are absent from clients and unsafe logs.

### Production readiness checklist

- No TODOs or placeholders
- No mock production data
- No dead controls
- No duplicate calculations
- No orphaned records
- No unlabeled stale state
- No silent background failure
- No unsafe last-write-wins behavior
- No incorrect deep links
- No inconsistent cross-client values
- Monitoring and error reporting enabled
- Performance targets measured
- Support and recovery paths documented
- Required professional boundaries visible

## 23. Definition of Done

Specification 012 is implementation-complete only when:

1. A senior engineer can build OfferIQ without inventing product architecture.
2. Codex can identify canonical ownership, dependencies, workflows, states, events, permissions, and tests without guessing.
3. The complete residential offer and counteroffer workflow works end to end.
4. Commercial, land, portfolio, and supported creative structures use the same canonical model with type-specific terms.
5. All authoritative financial outputs come from the deterministic engine.
6. Every offer version and negotiation decision is preserved.
7. Web, iPhone, iPad, reports, notifications, and ContractIQ reconcile.
8. Offline, stale, conflict, failure, and retry behavior is proven.
9. RLS, authorization, privacy, audit, and accessibility checks pass.
10. All required tests and verification gates pass with recorded evidence.

**Specification status: COMPLETE FOR CODEX IMPLEMENTATION REFERENCE. Application implementation remains subject to the verification requirements above.**