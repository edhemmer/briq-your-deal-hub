# BRIX

## Product Identity

BRIX is a Property Deal Relationship Management platform, or PDRM.

It is a production-grade real estate investment operating system that manages the full relationship between an investor and a property opportunity from first discovery through underwriting, visit, negotiation, contract, due diligence, financing, ownership, operation, improvement, and exit.

BRIX is not a listing website, generic dashboard, mortgage calculator, AI chatbot, document repository, or disconnected collection of modules.

The central question BRIX must answer is:

> What is the current state of this opportunity, what is the strongest available strategy, what evidence supports the conclusion, and what should the investor do next?

Every feature must reduce uncertainty, strengthen the evidence chain, improve the investment decision, preserve meaningful deal knowledge, or move the opportunity forward.

If a feature does not improve a decision or preserve important deal context, it does not belong in BRIX.

## Primary Product Outcome

BRIX must help an investor move from opportunity to confident action with the fewest practical steps.

The user should be able to:

1. Enter a property address or create a manual opportunity.
2. Select an intended strategy as a starting hypothesis.
3. Gather property, county, location, market, financing, rent, tax, insurance, zoning, and area information.
4. Make visible and editable educated assumptions when complete underwriting information is unavailable.
5. Run the deterministic engine for the selected strategy.
6. Run every other compatible strategy engine for that property type and jurisdiction.
7. Compare outcomes, risks, capital required, execution complexity, and confidence.
8. Receive a clear recommendation and next action.
9. Decide whether the property is worth a call, more research, a visit, negotiation, an offer, monitoring, or a pass.
10. Add photos, emails, contracts, inspection reports, appraisals, financing terms, quotes, estimates, and notes.
11. Re-underwrite the same canonical deal whenever new evidence arrives.
12. Preserve what changed, why it changed, and how the recommendation evolved.
13. Create reports, spreadsheets, property shortlists, visit lists, and decision summaries for collaboration.
14. Return later without losing work, assumptions, evidence, relationships, or decision history.

## Primary Users

BRIX must support both:

- a first-time investor buying a first property
- an experienced investor with decades of residential, multifamily, commercial, land, or development experience

Both users receive the same professional-grade calculations and strategy logic.

BRIX must not maintain separate beginner and professional calculation engines.

The difference is presentation.

### Guided Experience

For newer investors, BRIX should provide:

- plain-language explanations
- contextual definitions
- recommended defaults
- why each input matters
- what could make the deal fail
- what to verify next
- who to ask
- practical questions for professionals
- simplified initial views with advanced detail available underneath

### Professional Experience

For experienced investors, BRIX should provide:

- full assumptions
- formula transparency
- dense financial views
- detailed financing terms
- strategy-by-strategy outputs
- scenario controls
- sensitivity analysis
- source metadata
- export tools
- portfolio and pipeline comparisons
- minimal unnecessary teaching

Users may switch presentation modes without changing the underlying deal, evidence, calculations, or recommendations.

## Non-Negotiable Production Standard

Every visible control must perform its stated function.

Every button, link, navigation action, form, lookup, upload, scan, save, edit, delete, archive, calculation, recommendation, report, filter, status change, and workflow transition must be connected to real behavior.

BRIX must never present:

- dead buttons
- fake success messages
- decorative controls
- placeholder analytics
- simulated external data
- hardcoded production results
- fake image analysis
- mock production records
- generic AI explanations disconnected from the deal
- unfinished features represented as complete

The definition of done is not that a page renders.

The definition of done is:

> A real investor can complete the intended workflow, understand the result, inspect the evidence, save the outcome, reopen it later, and recover from errors without developer intervention.

## Deterministic, Canonical, Defensible, and Accurate

BRIX must be deterministic where accuracy is controllable, transparent where uncertainty exists, and honest where information is incomplete.

### Deterministic

- The same inputs must produce the same calculations.
- Investment formulas must be coded, versioned, and tested.
- AI must never be the source of financial calculations.
- Web, iOS, reports, spreadsheets, exports, and recommendations must use the same authoritative outputs.
- Intermediate calculations must avoid premature rounding.
- Every formula must define required inputs, units, treatment of zero, missing-value behavior, and final rounding.

### Canonical

- Every property opportunity has one Deal ID.
- Every fact, assumption, document, photo, contract, inspection, appraisal, quote, note, task, person, calculation, recommendation, offer, and decision attaches to the same deal.
- No module may create a competing copy of property or financial truth.
- User overrides must not erase original sourced values.
- New evidence must strengthen the existing deal rather than replace it.

### Defensible

Every material result must be traceable to:

- source
- date
- geography
- value classification
- evidence
- assumption
- formula
- engine version
- user override
- confidence
- limitation

Recommendations must explain:

- why the recommendation was made
- what supports it
- what weakens it
- which assumptions drive it
- what could make it fail
- what information is still decision-changing
- what price or terms could improve it
- why another strategy ranks higher

### Accurate

- Deterministic calculations must match known test fixtures.
- External data must be source-labeled and appropriate to the property and geography.
- Estimates must use ranges where precision is not justified.
- Unknown information must not be fabricated.
- AI observations must point back to actual photos, documents, or structured evidence.
- Failed integrations must fail visibly and allow manual continuation where responsible.

No external estimate, AI interpretation, recommendation, or forecast should be described as universally certain.

## Information Classification

Every material value must be classified as one of:

- Confirmed Fact
- User-Entered Fact
- User Assumption
- System Calculation
- External Estimate
- AI Observation
- Missing Information
- Conflict

BRIX must never blur these categories.

## Canonical Property Deal Lifecycle

The authoritative lifecycle is:

Discover
→ Qualify
→ Research
→ Pre-Visit Review
→ Call First or Research First
→ Visit Recommended
→ Visit Scheduled
→ Visited
→ Post-Visit Review
→ Underwriting
→ Pursuing
→ Offer Considered
→ Offer Submitted
→ Under Contract
→ Due Diligence
→ Financing
→ Closing
→ Purchased
→ Operating
→ Improving
→ Monitoring
→ Exit Planning
→ Sold or Refinished
→ Archived

Additional terminal or holding states include:

- Monitor
- Passed
- Dead
- Canceled

Dead and passed deals remain saved unless explicitly deleted.

## Decision Outcomes

BRIX should support:

- Visit
- Call First
- Research First
- Pursue
- Pursue With Conditions
- Negotiate
- Offer
- Monitor
- Pass
- Dead
- Insufficient Basic Information

A score may help rank deals but must never replace the recommendation.

Each recommendation must include:

- decision
- confidence
- top supporting reasons
- top risks
- strongest strategy
- selected strategy result
- strategy gap
- material assumptions
- key financial evidence
- what could change the result
- next action

## The BRIX Decision Cockpit

The cockpit is the primary experience for each deal.

It must answer immediately:

> What is the current state of this opportunity, and what should I do next?

The cockpit should prioritize:

### Decision

- current recommendation
- confidence
- deal health
- strongest strategy
- selected strategy
- why the ranking differs
- next action

### Key Financials

- asking price
- total cash required
- monthly carrying cost
- gross income
- NOI
- cash flow
- cap rate
- cash-on-cash return
- DSCR
- target price
- maximum offer

### Risks

Only the few risks most likely to change the decision.

### Evidence

- strongest supporting evidence
- conflicting evidence
- source freshness
- unresolved decision-changing items

### Strategies

- ranked compatible strategies
- compatibility
- projected result
- risk
- capital requirement
- confidence

### Actions

- call realtor
- schedule visit
- upload inspection
- review appraisal
- ask attorney
- request insurance quote
- request financing terms
- prepare offer

### Timeline

- what happened
- what changed
- why the recommendation changed

## Mobile and Field Experience

BRIX must be optimized for investors working in the field.

The web application must be responsive.

The native iOS application must be a fully native SwiftUI app for iPhone and iPad.

It must not be a WebView, Capacitor wrapper, responsive website inside an app, React Native application, or embedded web interface.

Field requirements include:

- fast startup
- thumb-reachable actions
- large touch targets
- camera access
- photo-library access
- native document scanning
- voice notes
- quick text notes
- visit status
- GPS-aware visit support where appropriate
- upload progress
- retry behavior
- offline-safe drafts where intentionally designed
- Dynamic Type
- VoiceOver
- accessible focus and labels

The field flow should allow quick movement through:

Decision
→ Photos
→ Risks
→ Financials
→ Questions
→ Notes
→ Next Action

## Web and iOS Architecture

BRIX has two production clients:

1. React, TypeScript, and Vite web application
2. Native Swift and SwiftUI iPhone and iPad application

Both clients use the existing GitHub repository, Vercel project and domain, Supabase project, Supabase Auth, PostgreSQL database, Supabase Storage, controlled backend services, and Apple infrastructure.

Web and iOS must share:

- user identity
- canonical deal contract
- status definitions
- property types
- strategy IDs
- evidence classifications
- financing structures
- underwriting definitions
- recommendation structures
- account lifecycle
- data-deletion behavior

They must not create competing deal models, persistence systems, calculations, statuses, strategy meanings, recommendation meanings, or source classifications.

They share contracts and backend behavior, not presentation code.

## Apple and Native iOS Requirements

The native iOS app must be designed for successful Xcode archive validation and App Store Connect upload.

It must preserve the existing bundle identifier, signing setup, App Store Connect record, entitlements, app icon identity, and Apple infrastructure.

Requirements include:

- native SwiftUI experience
- iPhone and iPad layouts
- secure Keychain storage for sensitive session material
- no service-role credentials
- no sensitive tokens in UserDefaults
- working session restoration
- working password-reset deep links
- in-app account deletion before public release if accounts can be created
- accurate privacy policy, terms, support URL, App Store privacy disclosures, permission-purpose strings, and privacy manifest
- third-party SDK review
- accessibility
- network-failure handling
- no placeholder or incomplete screens presented as finished
- physical-device testing
- TestFlight validation
- successful archive validation
- successful App Store Connect upload validation

Email verification is not required for the initial release unless later enabled.

## Authentication and Account Lifecycle

Required flows include:

- create account
- sign in
- sign out
- forgot password
- password-reset email
- password-reset web route
- password-reset iOS deep link
- set new password
- expired reset link
- invalid reset link
- session restoration
- session expiration
- authentication error recovery
- account deletion
- associated data deletion
- privacy access
- terms access
- support access

BRIX must not mark a user authenticated without a real session, expose one user’s deals to another, report password reset complete merely because an email was sent, store sensitive mobile sessions insecurely, or expose private credentials to clients.

## Public Landing Page and Conversion Experience

The public landing page is a production marketing surface and must be strong enough to convert qualified visitors into users.

It must look credible, modern, premium, and appropriate for a product investors may pay for and trust with sensitive deal information.

Required outcomes:

- explain BRIX clearly within seconds
- demonstrate how BRIX reduces wasted time and improves decisions
- show the PDRM lifecycle visually
- explain deterministic underwriting, strategy comparison, evidence tracking, field use, document intelligence, and native iOS support
- communicate who BRIX is for
- build trust through methodology, transparency, security, and clear limitations
- lead visitors naturally to create an account or sign in

Required sections include:

- responsive header
- strong hero message
- primary and secondary calls to action
- how BRIX works
- decision-cockpit preview
- supported property categories
- strategy comparison explanation
- evidence and document workflow
- mobile and field experience
- professional and beginner use cases
- trust and methodology
- privacy and security
- frequently asked questions
- help and support
- legal links
- footer

The page should use polished, restrained motion and interaction where it improves clarity or engagement.

Appropriate animation may include:

- subtle hero transitions
- scroll-based section reveals
- interactive cockpit previews
- animated evidence-to-decision flow
- responsive strategy-comparison demonstrations
- smooth call-to-action transitions
- micro-interactions on meaningful controls

Animations must not create distraction, slow the page, hide information, harm accessibility, or make unsupported product claims.

The page must respect reduced-motion preferences, load quickly, remain accessible, and work well on mobile.

Do not advertise unfinished capabilities as available.

Every public claim must match verified product behavior.

## Property and Asset Coverage

BRIX must support lawful analysis across major real estate asset types.

### Residential

- single-family
- condominium
- townhouse
- duplex
- triplex
- fourplex
- manufactured housing
- vacation home
- luxury residential
- student housing
- senior housing
- co-living

### Multifamily

- small multifamily
- garden apartments
- mid-rise
- high-rise
- affordable housing
- student apartments
- senior apartments
- mixed-income communities

### Commercial

- office
- medical office
- retail
- neighborhood center
- strip center
- shopping center
- restaurant
- hospitality
- hotel
- motel
- industrial
- warehouse
- distribution
- flex industrial
- self-storage
- data-center property
- automotive property
- special-purpose property

### Mixed Use

- residential over retail
- residential and office
- commercial and residential
- live/work
- urban infill

### Land

- residential lot
- commercial lot
- agricultural land
- recreational land
- timber land
- infill land
- entitled land
- unentitled land
- development parcel
- subdivision opportunity

### Specialized

- mobile-home park
- RV park
- campground
- marina
- parking facility
- assisted-living property
- build-to-rent community
- short-term-rental portfolio
- car wash
- laundromat real estate
- daycare
- church
- school
- cold storage
- gas station
- convenience store

Property-specific fields, engines, risks, and outputs must be conditional.

Residential assumptions must not be forced onto commercial or land deals.

## Strategy Registry

The selected strategy is an initial hypothesis, not the automatic recommendation.

BRIX must evaluate every compatible strategy for the property, jurisdiction, capital structure, and investor profile.

Each strategy must define:

- strategy ID
- name
- strategy family
- compatible asset types
- required inputs
- required calculations
- market assumptions
- disqualifying conditions
- strengths
- weaknesses
- risk factors
- financing compatibility
- output metrics
- recommendation rules
- education content
- engine version
- deterministic test fixtures

Strategy families include:

### Owner-Occupied and Personal Use

Primary residence, future rental conversion, house hack, duplex through fourplex house hack, live-in renovation, live-in flip, live-in BRRRR, multigenerational occupancy, ADU, second home, vacation home, and retirement home.

### Rental

Long-term rental, single-family rental, condominium rental, townhouse rental, small multifamily rental, multifamily hold, build-to-rent, portfolio hold, medium-term rental, short-term rental, furnished rental, corporate housing, executive rental, traveling-professional housing, student rental, senior housing, workforce housing, affordable housing, co-living, room rental, voucher-supported rental where lawful, and seasonal rental.

### Value Add and Repositioning

Cosmetic value-add, heavy value-add, BRRRR, partial BRRRR, multifamily BRRRR, commercial BRRRR, mixed-use BRRRR, buy-renovate-hold, stabilization, repositioning, adaptive reuse, lease-up, operational improvement, expense reduction, and rent optimization.

### Resale and Flip

Cosmetic flip, full-rehab flip, luxury flip, live-in flip, historic restoration flip, quick resale, retail resale, wholesale where lawful, assignment where lawful, double close where lawful, and novation where lawful.

### Creative and Alternative Acquisition

Seller financing, owner carry, installment sale, land contract, contract for deed, wrap financing, subject-to where lawful, lease option, lease purchase, sandwich lease option, master lease, master lease option, assumable financing, partnership, joint venture, equity partner, operating partner, syndication, private money, hard money, DSCR financing, bridge financing, portfolio financing, blanket loan, preferred equity, and mezzanine financing.

### Multifamily

Multifamily hold, value-add, unit renovation, operational value-add, rent growth, loss-to-lease capture, expense reduction, stabilization, recapitalization, mixed-income operation, affordable-housing preservation, and condo conversion where lawful.

### Commercial

Commercial buy and hold, owner-user acquisition, sale-leaseback, triple-net lease, gross lease, modified gross lease, commercial value-add, tenant repositioning, lease-up, mixed-use hold, office hold, medical office hold, retail hold, industrial hold, self-storage operation, hospitality operation, and commercial redevelopment.

### Land and Development

Land hold, land banking, agricultural use, recreational use, timber strategy, entitlement, subdivision, assemblage, horizontal development, vertical development, residential development, commercial development, industrial development, build to sell, build to rent, infill development, ground lease, spec homes, custom homes, townhome development, apartment development, and mixed-use development.

### Distressed and Special Situations

Foreclosure, pre-foreclosure, REO, estate sale, probate, divorce sale, bankruptcy, tax lien, tax deed, and short sale.

### Disposition and Exit

Hold, sell, refinance and hold, cash-out refinance, 1031 exchange, seller-financed resale, installment sale, portfolio sale, partial disposition, condo conversion, ground lease, syndicate, and legacy hold.

No strategy may be added without a deterministic engine or explicit compatibility and analysis contract.

## Strategy Engine Architecture

Each strategy receives its own deterministic, versioned engine.

Examples include:

- BRRRR Engine
- Long-Term Rental Engine
- Short-Term Rental Engine
- House Hack Engine
- Flip Engine
- Multifamily Engine
- Commercial Hold Engine
- Commercial Value-Add Engine
- Land Engine
- Development Engine
- Seller Finance Engine
- Owner-User Engine

The decision engine runs:

Selected Strategy Engine
→ Other Compatible Strategy Engines
→ Compatibility and Risk Filters
→ Strategy Ranking
→ Recommendation Explanation

AI may explain and compare engine outputs.

AI must never replace the engines.

## Authoritative Underwriting Engine

There must be one authoritative underwriting contract used by web, iOS, reports, spreadsheets, exports, and recommendations.

### Acquisition

- purchase price
- down payment
- loan amount
- points
- origination
- loan fees
- closing costs
- seller credits
- immediate repairs
- renovation
- initial reserves
- other acquisition costs
- total project cost
- total cash required

### Debt

- principal and interest
- amortization
- interest-only periods
- balloon payments
- annual debt service
- mortgage insurance
- refinance proceeds
- remaining loan balance
- effective financing cost

### Operations

- gross potential income
- other income
- vacancy
- collection loss
- effective gross income
- operating expenses
- management
- maintenance
- capital expenditures
- owner-paid utilities
- net operating income
- total monthly carrying cost
- cash flow before tax

### Returns

- capitalization rate
- cash-on-cash return
- DSCR
- debt yield
- break-even occupancy
- gross rent multiplier
- operating expense ratio
- return on cost
- equity multiple
- IRR when justified
- annualized return when valid
- profit margin
- yield on cost

Strategy-specific outputs must include BRRRR, flip, house hack, multifamily, commercial, land, and development metrics where applicable.

Irrelevant metrics must not be forced onto incompatible strategies.

## Financing and Mortgage Intelligence

Financing data is part of the canonical deal.

Each deal may include multiple financing options.

Supported structures include conventional, FHA, VA, DSCR, portfolio, commercial, bridge, hard money, private money, seller financing, assumable financing, subject-to where lawful, land loans, construction loans, refinance, and all-cash.

Each option should capture:

- lender or source
- loan type and purpose
- purchase price
- loan amount
- down payment amount and percentage
- interest rate
- fixed or variable
- index and margin
- amortization
- term
- interest-only period
- balloon date
- payment frequency
- monthly payment
- fees and points
- mortgage insurance
- escrow requirements
- reserve requirements
- DSCR, LTV, LTC, and liquidity conditions
- recourse
- personal guarantee
- prepayment penalty
- yield maintenance
- defeasance
- assumption rights
- covenants
- reporting requirements
- application, quote, lock, commitment, closing, payment, and maturity dates
- conditions outstanding

The lowest rate must not automatically rank first.

BRIX should compare cash required, debt service, total financing cost, balloon exposure, refinance risk, prepayment restrictions, recourse, liquidity burden, closing feasibility, and strategy compatibility.

When lender documentation arrives, BRIX must replace estimates with sourced terms while preserving prior assumptions and re-underwrite the deal.

## Market and Property Intelligence

BRIX should gather or estimate property and area information from lawful and reputable sources.

Potential sources include county records, assessor records, municipal data, state records, zoning and planning authorities, FEMA, FRED, Census, BLS, HUD, public market data, user-entered comparables, lender quotes, insurance quotes, property-manager estimates, broker estimates, and contractor estimates.

BRIX should help analyze:

- ownership and parcel information
- taxes and assessments
- zoning and permitted use
- flood and environmental context
- neighborhood access
- nearby amenities
- schools where relevant
- employment and population context
- transportation
- convenience
- nearby development
- location concerns
- local vacancy
- rent context
- resale liquidity
- market demand

BRIX must not describe broad market information as property-specific certainty.

When precision is weak, BRIX should use low, base, and high ranges.

## Evidence Engine

Every document, photo, note, public record, market lookup, and user observation becomes evidence attached to the canonical deal.

Evidence should retain:

- evidence ID
- type
- source
- source date
- retrieval date
- geography
- original value
- normalized value
- confidence
- status
- linked deal fields
- user override
- notes
- limitations
- version

Higher-confidence evidence may supersede lower-confidence assumptions while preserving history.

## Document Intake Workspace

BRIX must provide a real document intake workspace, not only a file-upload button.

Supported intake includes:

- PDF
- DOC and DOCX
- images
- email files such as EML
- MSG where supported
- pasted email body
- spreadsheets
- attachments

The original item must remain intact and viewable.

### PDF Viewer

- page-by-page viewer
- zoom
- search
- thumbnails
- exact page references
- highlighted findings
- side-by-side analysis
- original-file download
- preserved pagination

### Word Viewer

- preserve original file
- render a reviewable version
- preserve headings, tables, numbering, and paragraph context where technically available
- reference sections or paragraphs when stable page numbers are unavailable

### Email Intake

BRIX should preserve and analyze sender, recipients, CC, subject, sent date and time, body, quoted messages, signatures, attachments, and embedded images where relevant.

An email and its attachments are one evidence package while each item remains separately identifiable.

BRIX must detect conflicts between email statements and attachments.

Every finding must link to the relevant page, section, paragraph, clause, table, exhibit, email, or attachment.

BRIX must never claim it reviewed information that was unreadable, missing, unsupported, or not supplied.

## ContractIQ

ContractIQ is a core BRIX capability.

It should behave like a senior real estate paralegal performing issue spotting and document review while clearly stating that it is not an attorney and does not provide legal representation.

ContractIQ must handle simple standard forms and complex negotiated agreements with exhibits, amendments, schedules, cross-references, and conflicting language.

The user selects perspective, including buyer, seller, landlord, tenant, investor, developer, lender, or partner.

ContractIQ should identify parties, property, money terms, financing, contingencies, inspection rights, due diligence, title, survey, closing, credits, repairs, representations, defaults, remedies, termination rights, assignment rights, risk of loss, insurance requirements, disputes, fees, broker obligations, deadlines, missing exhibits, conflicting terms, and unusual or one-sided language.

Required outputs include:

- plain-language summary
- key dates and obligations
- advantages
- risks and disadvantages
- missing or unclear items
- suggested revision discussion drafts
- questions by professional
- negotiation priorities
- exact supporting section references

When something is unclear, missing, inconsistent, unreadable, or dependent on another document, ContractIQ should mark it as Verification Required, Missing Exhibit, Unclear Language, Conflicting Provision, Incomplete Information, or Professional Review Required.

ContractIQ should continue analyzing what is clear, reduce confidence where appropriate, and isolate the few issues requiring follow-up.

## Inspection and Appraisal Re-Underwriting

Inspection reports and appraisals must update the canonical deal rather than remain isolated attachments.

The flow is:

Upload
→ preserve original
→ identify pages, sections, photos, systems, values, and findings
→ classify evidence
→ link findings to the deal
→ estimate financial and strategy impact
→ flag unclear items for verification
→ update underwriting assumptions
→ rerun compatible strategies
→ compare before and after
→ revise recommendation, reserves, value, price threshold, and offer posture

BRIX must preserve the prior analysis and show what changed and why.

Inspection findings should distinguish inspector-confirmed findings, AI extraction, user observation, contractor estimate, system estimate, and unresolved ambiguity.

Appraisal analysis should extract and compare appraised value, effective date, property rights, highest and best use, condition, quality, comparable sales, adjustments, income approach, cost approach, extraordinary assumptions, limiting conditions, and required repairs.

A certified appraisal may supersede a lower-confidence system estimate while preserving both values and their history.

## Real AI Photo Analysis

Photo analysis must inspect actual image content.

It must not rely only on filenames, URLs, metadata, captions, or alt text.

Potential visible observations include roof wear, exterior damage, staining, possible moisture indicators, cracking, drainage, flooring, windows, outdated finishes, renovation quality, visible mechanical equipment, parking, access, site issues, deferred maintenance, cosmetic scope, and visible safety concerns.

Each finding must retain:

- photo ID
- image location
- observation
- severity
- confidence
- evidence description
- possible cost category
- recommended verification
- limitation

BRIX must not represent photo analysis as a professional inspection, engineering opinion, mold diagnosis, code inspection, appraisal, or contractor quote.

## Pre-Visit and Post-Visit Workflow

Before a visit, BRIX should answer:

- Is this worth a call?
- Is this worth more research?
- Is this worth a drive?
- What could eliminate it before visiting?
- Which few questions are decision-changing?
- What appears promising?
- What does not fit the user?

Visit tracking should include planned status, scheduled date and time, actual date and time, showing type, attendees, travel time, notes, positives, negatives, concerns, observations, deal-breakers, and follow-up.

Post-visit BRIX must compare expectations with reality, update condition and renovation assumptions, rerun strategies, revise offer posture, update confidence, update deal health, and show what changed.

Favorite, interest level, visit priority, reasons liked, reasons disliked, and not-yet-seen status belong to the canonical deal.

## Reports, Spreadsheets, and Collaboration

BRIX should provide a Deal Comparison Workspace and exports using the same canonical data and deterministic outputs as the application.

Potential outputs include:

- Excel workbook
- CSV
- shareable PDF
- printable property shortlist
- visit-planning list
- side-by-side strategy comparison
- decision summary for spouse, partner, lender, realtor, attorney, contractor, or investor

Comparison fields may include address, property type, asking price, selected strategy, recommended strategy, score, confidence, cash required, carrying cost, cash flow, cap rate, cash-on-cash return, DSCR, renovation range, risks, deal-breakers, visit recommendation, visit status, favorite, deal health, target price, maximum offer, and next action.

Reports and spreadsheets must never recompute the deal using separate formulas.

## Help, Training, and Real Estate Education

Help and education must be integrated into the active workflow.

Required content includes contextual help, field definitions, calculation explanations, strategy education, onboarding, first-deal guidance, experienced-investor references, glossary, troubleshooting, account help, privacy help, and support contact.

Education should cover property types, financing, underwriting, income, expenses, NOI, cap rate, cash flow, cash-on-cash return, DSCR, valuation, rents, vacancy, due diligence, contracts, inspections, insurance, taxes, HOA, zoning, environmental risks, renovation, market analysis, offers, negotiation, closing, operations, portfolio management, and exit strategies.

Education must be practical, current, industry-accurate, and clearly differentiated from legal, tax, lending, appraisal, engineering, inspection, and personalized investment advice.

## Administration, Billing, Usage, and Cost Control

BRIX requires a secure owner-only administration system.

The administration experience must be separated from normal user workflows and protected by server-side authorization.

Admin access must never rely only on a hidden route or client-side role check.

The admin dashboard should support:

### User Management

- search and filter users
- view account status
- view created date and last activity
- view subscription tier
- view enabled features and limits
- suspend or restore access
- initiate a secure password-reset flow
- review account-deletion state
- review support notes
- apply approved overrides
- impersonation only if later implemented with explicit audit controls and strong safeguards

Admins must not be able to view user passwords.

Password management means secure reset, revocation, and account-recovery controls, not password visibility.

### Subscription and Billing Management

- plans
- trials
- billing status
- renewal date
- payment failure state
- promotional access
- credits
- refunds where supported
- manual plan override
- feature entitlements
- cancellation state

Billing behavior must use a reliable payment provider and server-verified webhooks.

### Usage and Limits

Track usage by user, account, plan, feature, provider, and billing period.

Examples include:

- active deals
- archived deals
- property lookups
- county-record lookups
- area-intelligence requests
- AI text analysis
- AI vision analysis
- document pages processed
- document storage
- photo storage
- emails processed
- reports generated
- exports generated
- API calls
- Edge Function executions
- database usage
- bandwidth
- iOS and web activity where appropriate

### Cost Observability

The owner must be able to see:

- usage today
- usage this billing period
- estimated provider cost
- estimated cost per user
- estimated cost per active deal
- high-usage users
- high-cost features
- provider error rates
- retry volume
- unexpected usage spikes
- projected month-end cost
- budget thresholds
- quota exhaustion risk

### Limits and Guardrails

Support configurable:

- plan limits
- per-user overrides
- feature overrides
- soft warnings
- hard limits
- rate limits
- daily limits
- monthly limits
- file-size limits
- page-processing limits
- photo-processing limits
- AI token or request budgets
- provider-specific safeguards

Limits must fail gracefully and explain what happened to the user.

### Alerts

Provide owner alerts for:

- unusual API usage
- sudden cost increase
- repeated provider failures
- approaching plan limits
- storage growth
- suspicious account behavior
- billing failures
- webhook failures
- failed background jobs
- queue backlog

### Audit Trail

Every admin action must record:

- admin identity
- action
- target user or account
- prior value
- new value
- reason
- timestamp
- request or correlation ID where applicable

Sensitive admin actions must be reviewable and reversible where practical.

### Privacy Boundary

Usage analytics should expose operational numbers needed to manage cost and reliability without unnecessarily exposing private deal content.

Viewing user deal content should be exceptional, permissioned, audited, and limited to legitimate support or security needs.

## Security and Privacy

BRIX may contain sensitive financial, property, contract, identity, and relationship information.

Requirements include:

- secure authentication
- row-level ownership
- safe file access
- server-side secrets
- input validation
- secure sessions
- account deletion
- data-deletion controls
- audit logging
- least privilege
- admin authorization
- provider-key isolation
- rate limiting
- upload validation
- malware scanning where appropriate
- no service-role credentials in browser or iOS code

A user must never access another user’s deals by changing a URL, identifier, request, or client state.

## Build and Release Discipline

BRIX must be built in dependency order.

The complete product definition does not authorize building every capability in one task.

Each implementation assignment should contain one coherent capability, one contained diff, deterministic verification, and a clear definition of done.

A capability may not be presented as complete until its end-to-end workflow works.

The rebuild should preserve the current GitHub repository, Vercel project, Supabase project, domain, Apple Developer account, App Store Connect record, bundle identifier, signing setup, entitlements, and icon identity.

The existing runtime code is not trusted as a production foundation and should not be copied wholesale into the rebuild.

## Definition of Working

BRIX is working when a real investor can use it on a real property without developer intervention.

The investor must be able to:

- create and manage an account
- recover a password
- create a deal
- gather property and market context
- distinguish facts from assumptions
- underwrite the property accurately
- compare compatible strategies
- understand recommendation logic
- review risks and evidence
- use the product in the field
- upload and analyze photos and documents
- add inspection and appraisal evidence
- re-underwrite after new information
- review financing terms
- preserve contacts and interactions
- create reports and spreadsheets
- save and reopen the deal
- understand what changed and why
- make and preserve a defensible decision

BRIX is not considered working merely because it builds, renders, contains buttons, or passes mocked tests.

The product is working only when its real user flows, backend connections, calculations, evidence, recommendations, reports, and recovery states operate correctly and consistently across web and native iOS.