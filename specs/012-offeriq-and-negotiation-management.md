# 012 — OfferIQ and Negotiation Management

## Mission

OfferIQ converts a fully underwritten Deal into a disciplined, evidence-backed offer strategy and a controlled negotiation record. It must help the investor decide what to offer, why, under which terms, how far to move, what conditions are required, and when to stop.

OfferIQ is not a generic letter generator. It is the canonical offer and negotiation subsystem for BRIX.

---

## Governing Rules

Before implementing this specification, Codex must re-read and obey:

- `docs/00-START-HERE.md`
- `docs/01-PRODUCT-CONSTITUTION.md`
- `docs/02-ENGINEERING-STANDARDS.md`
- `docs/03-DATA-ARCHITECTURE.md`
- `docs/04-UI-UX-SYSTEM.md`
- `docs/05-BUILD-ROADMAP.md`
- `specs/003-deals-and-pdrm-core.md`
- `specs/005-deterministic-underwriting-engine.md`
- `specs/006-strategy-intelligence-engine.md`
- `specs/009-financeiq-and-capital-structure.md`
- `specs/010-governanceiq-associations-and-restrictions.md`
- `specs/011-contractiq-and-document-intelligence.md`

Permanent rules:

1. One canonical `deal_id`.
2. One canonical Offer record per offer version.
3. Every revision is immutable after submission.
4. Maximum offer is deterministic and explains its binding constraint.
5. AI may explain or draft language, but it may not calculate authoritative offer values.
6. Offer terms must reconcile with underwriting, financing, governance findings, and contract requirements.
7. No submitted or accepted offer may be silently overwritten.
8. Negotiation history must remain complete and auditable.
9. No legal advice, guaranteed acceptance, or lender approval may be implied.
10. Every offer state must be explicit, current, and connected to the Deal timeline.

---

## User Outcomes

The investor must be able to:

- See the recommended offer range.
- Understand the maximum defensible offer.
- See which assumption or target limits that amount.
- Structure price and non-price terms.
- Compare multiple offer structures.
- Produce residential, commercial, land, development, and creative-finance offer scenarios.
- Record submitted offers and counters.
- Compare every counter to the current underwriting and investor targets.
- Preserve all versions, communications, deadlines, and outcomes.
- Receive a clear recommendation to accept, counter, hold, or walk away.

---

## Scope

OfferIQ must support:

- Residential purchase offers
- Multifamily offers
- Commercial LOIs and purchase offers
- Mixed-use offers
- Land offers
- Development and entitlement-contingent offers
- Portfolio/package offers
- Seller-financed offers
- Assumable financing structures
- Subject-to or wrap structures where lawful and professionally reviewed
- Counteroffers
- Best-and-final rounds
- Escalation clauses
- Repair and credit negotiations
- Post-inspection renegotiation
- Post-appraisal renegotiation
- Backup offers

---

## Canonical Entities

### Offer

Required fields:

- `offer_id`
- `workspace_id`
- `deal_id`
- `property_id`
- `offer_number`
- `version_number`
- `offer_type`
- `perspective`
- `status`
- `currency`
- `purchase_price`
- `earnest_money_amount`
- `earnest_money_due_date`
- `down_payment_amount`
- `loan_amount`
- `seller_credit_amount`
- `repair_credit_amount`
- `closing_cost_credit_amount`
- `other_credit_amount`
- `cash_due_at_closing_estimate`
- `financing_structure_id`
- `assumption_set_id`
- `underwriting_snapshot_id`
- `strategy_scenario_id`
- `recommended_offer_low`
- `recommended_offer_high`
- `maximum_offer`
- `binding_constraint_code`
- `binding_constraint_value`
- `confidence_state`
- `submitted_at`
- `expires_at`
- `accepted_at`
- `rejected_at`
- `withdrawn_at`
- `superseded_at`
- `created_by`
- `created_at`
- `updated_at`

### OfferTerm

Required fields:

- `offer_term_id`
- `offer_id`
- `term_type`
- `term_value_json`
- `classification`
- `source_id`
- `is_material`
- `is_contingency`
- `is_waived`
- `verification_state`
- `created_at`

### OfferParty

Required fields:

- `offer_party_id`
- `offer_id`
- `contact_id` or `organization_id`
- `role`
- `authority_state`
- `communication_preference`

### OfferDocument

Required fields:

- `offer_document_id`
- `offer_id`
- `evidence_id`
- `document_role`
- `generation_state`
- `signature_state`
- `submitted_state`

### NegotiationEvent

Required fields:

- `negotiation_event_id`
- `deal_id`
- `offer_id`
- `event_type`
- `event_at`
- `actor_contact_id`
- `channel`
- `summary`
- `raw_evidence_id`
- `previous_offer_id`
- `resulting_offer_id`
- `deadline_at`
- `created_by`

### OfferDecision

Required fields:

- `offer_decision_id`
- `offer_id`
- `system_recommendation`
- `user_decision`
- `decision_reason`
- `decided_by`
- `decided_at`
- `override_reason`

---

## Offer Lifecycle

Canonical statuses:

- Draft
- Ready for Review
- Needs Verification
- Approved Internally
- Generated
- Sent for Signature
- Signed
- Submitted
- Acknowledged
- Countered
- Accepted
- Rejected
- Withdrawn
- Expired
- Superseded
- Terminated
- Closed

Status transitions must be server-authorized, historically recorded, and idempotent.

A submitted Offer becomes immutable. Changes create a new version linked to the prior version.

---

## Offer Calculation Contract

All authoritative values must be produced by the deterministic underwriting and financing engines.

OfferIQ must calculate or consume:

- Recommended offer floor
- Recommended offer target
- Recommended offer ceiling
- Maximum allowable offer
- Total cash required
- Closing cash estimate
- Post-closing liquidity
- Return at proposed price
- DSCR at proposed price
- Break-even occupancy at proposed price
- Renovation margin at proposed price
- Refinance feasibility at proposed price
- Exit sensitivity at proposed price
- Seller credit impact
- Rate buydown impact
- Repair credit impact
- Price versus credit tradeoff
- Escalation ceiling

### Binding constraints

The engine must identify the exact constraint that determines maximum offer, such as:

- Minimum cash-on-cash return
- Minimum DSCR
- Maximum cash required
- Maximum LTC
- Maximum LTV
- Minimum IRR
- Minimum equity multiple
- Minimum flip margin
- Minimum development yield
- Maximum renovation exposure
- Appraisal ceiling
- Financing proceeds
- Investor liquidity reserve
- Governance restriction
- Insurance availability
- Legal or zoning feasibility
- Strategy disqualifier

The UI must display the binding constraint in plain language and allow the user to inspect the formula inputs.

---

## Required Offer Terms

OfferIQ must support structured handling of:

- Purchase price
- Earnest money
- Initial deposit
- Additional deposit
- Financing contingency
- Appraisal contingency
- Inspection contingency
- Due diligence period
- Attorney review
- Title review
- Survey
- Association/COA/HOA review
- Insurance availability
- Environmental review
- Zoning and land-use review
- Feasibility period
- Financing commitment deadline
- Closing date
- Possession date
- Seller possession after closing
- Prorations
- Tax treatment
- Personal property
- Fixtures
- Repairs
- Credits
- Seller concessions
- Rate buydown
- Escalation
- Appraisal gap
- Assignment
- Access before closing
- Lease review
- Tenant estoppels
- Rent roll verification
- Service contract assignment
- Franchise or management agreement review
- Entitlement contingency
- Utility availability
- Soil, survey, wetlands, and environmental contingencies
- Seller financing
- Assumable debt
- Subject-to or wrap terms where lawful
- Extension options
- Closing conditions
- Default and remedy concepts for professional drafting

---

## Offer Comparison

The system must allow side-by-side comparison of offer structures.

Required comparison dimensions:

- Purchase price
- Net seller proceeds estimate
- Cash required
- Monthly debt service
- Return metrics
- Contingency protection
- Closing speed
- Financing certainty
- Appraisal exposure
- Inspection exposure
- Governance exposure
- Execution complexity
- Legal review need
- Seller attractiveness
- Investor downside
- Confidence

The comparison view must clearly distinguish:

- Higher price
- Better seller terms
- Better investor protection
- Better financing certainty
- Better net economics

---

## Negotiation Intelligence

OfferIQ must evaluate each counteroffer against:

- Current underwriting snapshot
- Current financing structure
- Current strategy ranking
- Current appraisal evidence
- Inspection findings
- Governance restrictions
- Contract terms
- Market evidence
- User investment criteria
- Remaining cash and liquidity
- Deadlines

Required recommendation states:

- Accept
- Accept with clarification
- Counter
- Hold
- Request information
- Re-underwrite
- Withdraw
- Walk away

Every recommendation must show:

- What changed
- Financial impact
- Risk impact
- Strategy impact
- Binding constraint impact
- Missing verification
- Recommended next move

---

## UI and UX Requirements

### OfferIQ home

Must show:

- Current offer status
- Latest submitted price and terms
- Recommended range
- Maximum offer
- Binding constraint
- Current seller counter
- Response deadline
- Current recommendation
- Material risks
- Missing verification
- Primary next action

### Offer builder

Use a guided, sectioned workflow:

1. Offer objective
2. Price and economics
3. Financing
4. Deposits
5. Contingencies
6. Credits and repairs
7. Closing and possession
8. Special terms
9. Review against underwriting
10. Internal approval
11. Document generation or export
12. Submission tracking

Requirements:

- Autosave
- Explicit save state
- Inline validation
- Contextual explanations
- Professional mode and guided mode
- No loss on refresh or relaunch
- Resume at last completed section
- Material changes trigger fresh underwriting comparison
- Stale outputs visibly labeled

### Web

- Full side-by-side scenario comparison
- Sticky summary panel
- Keyboard navigation
- Printable review view
- Drag-and-drop supporting documents

### iPhone

- One-handed offer review
- Quick counter entry
- Voice note capture
- Photo/document attachment
- Deadline alerts
- Call/email/map actions from the Deal context

### iPad

- Offer builder and evidence side by side
- Contract or LOI preview beside structured terms
- Multi-column negotiation history
- Keyboard shortcuts

---

## Document Generation

OfferIQ may generate:

- Internal offer summary
- Offer instruction sheet for realtor or attorney
- Residential offer worksheet
- Commercial LOI draft
- Land offer term sheet
- Seller-financing term sheet
- Counteroffer comparison
- Negotiation memo
- Questions for realtor
- Questions for attorney
- Questions for lender

Generated documents must:

- Use canonical values
- Include generation date
- Include Offer version
- Identify assumptions
- Identify unresolved items
- Avoid claiming legal sufficiency
- Remain linked to the Offer record

Formal legal forms must be completed or approved through the appropriate licensed professional workflow where required.

---

## Domain Events

OfferIQ consumes:

- `deal.created`
- `deal.stage_changed`
- `underwriting.completed`
- `underwriting.stale`
- `strategy.ranked`
- `financing.updated`
- `governance.finding_created`
- `contract.finding_created`
- `inspection.updated`
- `appraisal.updated`
- `evidence.added`

OfferIQ emits:

- `offer.created`
- `offer.updated`
- `offer.ready_for_review`
- `offer.approved`
- `offer.generated`
- `offer.submitted`
- `offer.acknowledged`
- `offer.countered`
- `offer.accepted`
- `offer.rejected`
- `offer.withdrawn`
- `offer.expired`
- `offer.superseded`
- `negotiation.event_recorded`
- `offer.decision_recorded`

Consumers may include:

- Deal timeline
- Tasks and deadlines
- Notifications
- ContractIQ
- Decision Cockpit
- Reports
- Admin usage tracking

All event consumption must be idempotent.

---

## Tasks and Deadlines

OfferIQ must create canonical tasks for:

- Internal review
- Realtor review
- Attorney review
- Lender confirmation
- Signature
- Submission
- Response deadline
- Earnest money due
- Financing application
- Inspection scheduling
- Appraisal scheduling
- Association package request
- Closing preparation

Deadline source and verification state must be retained.

---

## Permissions

Minimum permissions:

- View offers
- Create draft offers
- Edit draft offers
- Approve internal offer
- Generate documents
- Submit or mark submitted
- Record counters
- Accept/reject/withdraw
- View negotiation history
- Manage templates
- Override recommendation

Submission, acceptance, rejection, withdrawal, and override actions require elevated permission and audit logging.

---

## Offline and Sync Behavior

- Draft terms may be edited offline on iPhone and iPad.
- Submitted Offer states may not be changed offline.
- Offline edits must retain local version metadata.
- Sync must detect server-side changes before overwrite.
- Conflicts require explicit resolution.
- Attachments queue for upload and retain durable status.
- A failed upload cannot erase the Offer draft.
- Previously valid recommendations remain visible and marked stale until recalculation succeeds.

---

## Error and Failure States

OfferIQ must explicitly handle:

- Underwriting unavailable
- Underwriting stale
- Financing incomplete
- Strategy no longer viable
- Missing required term
- Invalid deadline
- Expired offer
- Duplicate submission
- Signature failure
- Document generation failure
- Upload failure
- Permission denial
- Counteroffer conflict
- Provider outage
- Offline mode
- Cross-device edit conflict

Every failure must state:

- What failed
- What was preserved
- Whether submission or decision is affected
- Recovery action
- Support reference ID where appropriate

---

## Security and Audit

- RLS must isolate all Offer and negotiation records by workspace.
- Offer documents require authorized access or signed URLs.
- Submission and acceptance actions require server-side authorization.
- Audit logs must retain actor, timestamp, previous value, new value, and Offer version.
- Sensitive contact and financing information must not appear in public share links unless explicitly included.
- AI prompts must not contain unrelated workspace data.

---

## Performance Targets

- OfferIQ home interactive under 2 seconds for a normal Deal on broadband.
- Draft save acknowledgment under 500 ms when backend is available.
- Recalculation status visible immediately.
- Offer comparison under 1 second after canonical outputs are available.
- Large document generation must run asynchronously with durable status.
- Negotiation history must paginate or virtualize for long-running Deals.

---

## Analytics and Operational Metrics

Track:

- Offers created
- Offers submitted
- Average revisions per Deal
- Time from underwriting to submission
- Acceptance rate
- Counter rate
- Average discount to asking price
- Average movement from initial to accepted offer
- Binding constraints by frequency
- Offer generation failures
- Signature failures
- Processing cost
- User overrides

Analytics must not alter canonical financial or negotiation records.

---

## Acceptance Tests

At minimum:

1. Create a draft Offer from current underwriting.
2. Show recommended range and binding constraint.
3. Change price and recalculate metrics.
4. Add financing and contingencies.
5. Save, refresh, and reopen without loss.
6. Compare two offer structures.
7. Generate an internal offer summary.
8. Mark Offer submitted and make it immutable.
9. Record a seller counter as a new version.
10. Compare counter to current investor targets.
11. Trigger accept, counter, and walk-away recommendations using fixtures.
12. Add a response deadline and verify task/notification creation.
13. Update inspection findings and verify OfferIQ becomes stale.
14. Recalculate and preserve before/after history.
15. Verify RLS prevents cross-workspace access.
16. Verify offline draft edit and later sync.
17. Verify conflicting edits require resolution.
18. Verify failed document generation can retry without duplication.
19. Verify iPhone and iPad open the same canonical Offer.
20. Verify reports reconcile to the accepted Offer version.

---

## Regression Tests

- Underwriting engine outputs remain deterministic.
- Financing schedules remain unchanged unless financing inputs change.
- Submitted Offer versions remain immutable.
- Counteroffers do not overwrite prior versions.
- Tasks and notifications are not duplicated.
- Deal stage changes occur only through valid transitions.
- ContractIQ continues to reference the correct accepted Offer.
- Shared reports never expose unauthorized Offer terms.
- Offline sync cannot overwrite a newer accepted Offer.

---

## Definition of Done

This specification is complete only when:

- OfferIQ is connected to the canonical Deal.
- Offer values reconcile to underwriting and financing.
- Maximum offer is deterministic and explainable.
- Offer versions and counters are immutable and linked.
- Web, iPhone, and iPad display the same canonical status and numbers.
- Drafts survive refresh, relaunch, and offline interruption.
- Submission, acceptance, rejection, and withdrawal are audited.
- Tasks, deadlines, notifications, timeline, reports, and ContractIQ connections work.
- Every loading, empty, stale, conflict, offline, permission, and error state is designed and tested.
- No dead controls, placeholder values, fake success states, or disconnected records remain.
- Required automated and manual tests pass.
- Exact verification commands and results are recorded.
- Codex can state `CHAPTER COMPLETE` with no material unverified behavior.
