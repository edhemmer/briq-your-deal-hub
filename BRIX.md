# BRIX

## What BRIX Is

BRIX is a real estate investment operating system.

Its primary purpose is to help Ed evaluate real properties, organize available evidence, understand financial and physical risks, compare realistic investment strategies, and make a clear decision.

BRIX is being built first as a dependable tool for Ed's own investing. If it proves accurate, useful, and reliable through real-world use, it may later become a commercial product for other investors.

BRIX is not a listing website, generic mortgage calculator, decorative dashboard, AI chatbot, or collection of disconnected features.

The central question BRIX must answer is:

> Should this property be pursued, negotiated, monitored, or passed on, and why?

## Immediate Product Objective

The current objective is to make BRIX fully usable on a real property.

Ed must be able to:

1. Create a deal.
2. Enter or import property information.
3. Add financing assumptions.
4. Add taxes, insurance, HOA, repairs, income, and operating costs.
5. Evaluate one or more investment strategies.
6. Review total cash required.
7. Review monthly carrying cost.
8. Review investment returns.
9. Review risks, missing information, and conflicting information.
10. Compare scenarios.
11. Save the deal.
12. Leave the application.
13. Reopen the same deal later.
14. Edit assumptions.
15. Recalculate results.
16. Add notes, photos, and supporting documents.
17. Record a decision.

This complete workflow is more important than adding additional modules or features.

## Primary User

The first serious user is Ed Hemmer.

BRIX should provide professional-quality analysis without assuming the user is an institutional investor, accountant, appraiser, engineer, attorney, or software developer.

The product should be practical, clear, detailed where necessary, easy to update, honest about uncertainty, and useful during a real investment decision.

BRIX should initially prioritize residential investment and personal-use scenarios while preserving a foundation that can later support multifamily, mixed-use, commercial, and other real estate strategies.

## Core Product Modules

### DealIQ

DealIQ is the current production priority.

DealIQ evaluates the property, financing, costs, income, strategies, risks, and potential outcomes.

It must help the user understand:

- how much cash is required
- the true monthly carrying cost
- whether the property works as a rental
- whether it works under another selected strategy
- which assumptions drive the result
- what information is missing
- what risks could change the decision
- what purchase terms would improve the deal

### ContractIQ

ContractIQ reviews real estate contracts and related documents.

It should identify deadlines, obligations, contingencies, unusual language, risks, and questions for qualified professionals.

ContractIQ must not present itself as legal advice and must not delay completion of DealIQ.

### FindIQ

FindIQ may eventually help locate and screen properties.

FindIQ is deferred until DealIQ is dependable.

## Core Deal Workflow

The authoritative workflow is:

Create deal
→ identify property
→ enter facts
→ enter assumptions
→ enter financing
→ enter income and expenses
→ select strategy
→ calculate
→ review results
→ review risks
→ compare scenarios
→ save
→ reopen
→ update
→ recalculate
→ record decision

All BRIX modules must use the same deal identity.

The user must not be required to re-enter valid information because different modules use disconnected data models.

## Decision Outcomes

BRIX should support the following decisions:

- Pursue
- Pursue with conditions
- Negotiate
- Monitor
- Pass
- Insufficient information

A decision must not rely only on a score.

BRIX must explain:

- what supports the decision
- what weakens the decision
- which assumptions matter most
- what is missing
- what must be verified
- what terms would improve the opportunity

## Information Classification

Every material value must be identified as one of the following:

### Confirmed Fact

Supported by a reliable source or directly confirmed by the user.

### User Assumption

Entered by the investor for analysis.

### System Calculation

Calculated deterministically by BRIX.

### External Estimate

Retrieved from a third party but not independently confirmed.

### AI Interpretation

Narrative reasoning based on structured facts, assumptions, calculations, and evidence.

### Missing Information

Required or useful information that is unavailable.

### Conflict

Two or more sources provide different values.

BRIX must never blur these categories.

## Trust Rules

BRIX must never:

- invent property facts
- invent financial inputs
- present estimates as confirmed facts
- fabricate market or listing data
- hide missing information
- hide conflicting information
- produce fake image analysis
- claim information was saved when persistence failed
- use mock data in the production workflow
- substitute AI-generated numbers for deterministic calculations
- provide a confident recommendation when critical information is missing

BRIX must always:

- show important assumptions
- identify the source of material facts
- explain important calculations
- flag missing inputs
- flag conflicting values
- preserve user-entered information
- recalculate when assumptions change
- clearly report failed integrations
- distinguish calculation from interpretation

When information is unavailable, BRIX should say:

> Not confirmed

or:

> Insufficient information

## Property and Deal Inputs

BRIX should support the property and investment information necessary for the selected strategy.

Potential inputs include:

- property address
- property type
- listing price
- taxes
- insurance
- HOA
- purchase costs
- down payment
- loan amount
- interest rate
- loan term
- closing costs
- immediate repairs
- renovation budget
- reserves
- rent or income
- vacancy
- management
- maintenance
- capital expenditures
- utilities
- other operating expenses
- current condition
- property risks
- hold period
- resale assumptions
- notes
- photos
- documents
- source records

The interface should adapt to the property type and selected strategy rather than forcing irrelevant inputs.

A deal may be created with incomplete information, but BRIX must clearly show what is still required for a dependable analysis.

## Financial Analysis

BRIX must maintain one authoritative deterministic calculation engine.

At minimum, where applicable, the system should calculate and clearly explain:

- loan amount
- monthly principal and interest
- total monthly carrying cost
- total acquisition cost
- total cash required
- gross potential income
- vacancy and collection loss
- effective gross income
- operating expenses
- net operating income
- annual debt service
- cash flow before tax
- capitalization rate
- cash-on-cash return
- debt-service coverage ratio
- break-even occupancy
- gross rent multiplier
- operating expense ratio
- return on cost

BRIX must clearly identify what is included and excluded from each calculation.

Debt service must not be included in net operating income.

Down payment must not be presented as the total cash required.

A metric must not be shown when required inputs are missing.

## Personal Affordability

BRIX should distinguish investment performance from personal affordability.

This is important when a property may be a primary residence, future rental, house hack, family-use property, temporary hold, or live-in renovation.

The analysis may consider:

- available cash
- desired loan amount
- desired monthly payment
- taxes
- insurance
- HOA
- repairs
- reserves remaining after purchase
- income stability
- existing obligations
- expected hold period
- future rental potential

A property may be affordable but a weak investment.

A property may also be financially attractive but exceed the user's risk or liquidity limits.

## Strategies and Scenarios

The same property should support multiple strategies without duplicating the underlying deal.

Potential strategies include:

- primary residence
- buy and hold
- house hack
- medium-term rental
- short-term rental
- fix and flip
- BRRRR
- live-in renovation
- multifamily hold
- mixed-use hold
- commercial hold
- land
- development
- resale after appreciation

The user should be able to compare scenarios such as:

- base
- conservative
- optimistic
- lower purchase price
- higher interest rate
- lower rent
- higher vacancy
- higher taxes
- higher insurance
- higher repair cost
- lower resale value
- longer hold period
- different down payment

Each scenario must show what changed and how the result changed.

BRIX should help answer:

> What has to be true for this deal to work?

## Risk Analysis

BRIX should identify risks in the following categories:

- financial
- property condition
- legal and contract
- market
- operational
- data quality

Each material risk should include:

- description
- evidence
- severity
- confidence
- potential effect
- suggested next action

BRIX should not diagnose hidden property conditions or replace qualified inspectors, engineers, attorneys, lenders, appraisers, or other professionals.

## Evidence and Sources

Important values should preserve:

- value
- source
- date obtained
- confidence
- confirmation status
- user override
- notes

Evidence may include listing information, county records, HOA documents, tax records, insurance quotes, loan estimates, leases, rent comparables, sales comparables, inspections, contractor estimates, property photos, contracts, disclosures, user measurements, and notes.

A user override must not erase the original sourced value.

## Photos and AI Analysis

Real image analysis must examine the actual image content.

Filename matching, URL matching, metadata, or alt text must never be presented as image analysis.

AI may help summarize evidence, explain calculations, identify missing information, compare scenarios, organize notes, surface potential risks, draft questions, and produce a decision narrative.

AI must not create deterministic financial results, fabricate property or market data, hide uncertainty, claim certainty about hidden defects, or replace professional advice.

AI output must be based on structured facts, assumptions, calculations, and evidence.

## Data and Architecture Principles

BRIX must converge on:

- one canonical deal model
- one authoritative persistence system
- one authoritative calculation engine
- one validation model
- one authenticated ownership model
- one shared calculation contract
- one clear source of truth for each material value

The application must avoid:

- competing web and mobile deal models
- multiple active persistence systems
- duplicate formulas
- reports using different calculations from the application
- AI prompts using different values from the calculation engine
- critical deal data stored only in temporary UI state

Supabase is the authoritative persisted data source unless a future architectural decision explicitly replaces it.

Local storage may support temporary drafts or offline behavior, but it must not become a competing production database.

## Security

BRIX may contain sensitive financial and property information.

The application must enforce:

- secure authentication
- database-level user ownership
- row-level access controls
- safe file access
- server-side secret handling
- input validation
- secure session handling
- account deletion
- data deletion controls

A user must never be able to access another user's deals by changing a URL, identifier, request, or client-side state.

Service-role keys and private credentials must never be exposed to browser or mobile code.

## Web and Mobile

The web application should become the first complete and trusted BRIX client.

The iOS application must use the same backend, deal model, validation rules, and calculation contract.

Mobile code must not independently redefine the core investment logic.

Native functionality may later include camera capture, photo upload, document scanning, voice notes, location capture, offline drafts, and notifications.

These capabilities should extend BRIX, not create another disconnected version of it.

## Definition of Working

BRIX is working for Ed when he can use it on a real property without developer intervention.

He must be able to:

- enter property information
- distinguish confirmed facts from assumptions
- calculate total cash required
- calculate monthly carrying cost
- evaluate rental and other selected strategies
- compare scenarios
- review risks
- preserve evidence
- save the deal
- reopen it later
- update assumptions
- recalculate
- record a decision
- trust the formulas used

BRIX is not considered working merely because the application builds, a page renders, buttons exist, mocked tests pass, AI generates a narrative, or seeded demo data works.

## Definition of Commercial Readiness

BRIX should not be sold as a dependable product until:

- Ed has used it on multiple real deals
- core calculations are verified
- live persistence is reliable
- users are securely isolated
- production failures are observable
- account and data deletion work
- external data is sourced and labeled
- core workflows are tested
- mobile and desktop experiences are usable
- disclaimers are appropriate
- billing is reliable
- the application does not misrepresent AI or data capabilities

## Development Priority

Use this order:

1. Accurate property and financial inputs
2. Reliable saving and reopening
3. Authoritative calculations
4. Clear results and risk analysis
5. Scenario comparison
6. Evidence, notes, photos, and documents
7. Real-deal usability
8. Security and production reliability
9. Mobile integration
10. Commercial expansion

Do not add features that expand BRIX while its core investment workflow remains incomplete.

## Rules for Codex

Before changing code, read `BRIX.md` and `AGENTS.md`.

`BRIX.md` controls product intent.

`AGENTS.md` controls engineering execution.

Codex must:

1. Preserve BRIX identity and terminology.
2. Avoid restarting the application.
3. Avoid duplicate implementations.
4. Identify the existing source of truth before creating another.
5. Keep deterministic formulas outside presentation components.
6. Preserve valid user data.
7. Use forward-only migrations.
8. Add tests for new business logic and repaired defects.
9. Verify behavior rather than file existence.
10. Report anything not verified.
11. Avoid broad redesigns.
12. Avoid unrelated changes.
13. Avoid fake or placeholder production behavior.
14. Avoid weakening security.
15. Finish complete user outcomes before adding more features.

When the implementation conflicts with this document, Codex must stop and report the conflict rather than silently changing the product.

## Current Objective

The current objective is:

> Make BRIX dependable enough for Ed to evaluate a real property from initial intake through a documented investment decision, with reliable saving, correct calculations, clear assumptions, scenario analysis, risk visibility, and no fabricated data.

All current work should be judged against that objective.
