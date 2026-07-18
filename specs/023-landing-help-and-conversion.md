# BRIX Specification 023 — Landing, Help, and Conversion

## 1. Authority and Rules of Engagement

This specification is governed by:

- `docs/00-START-HERE.md`
- `docs/01-PRODUCT-CONSTITUTION.md`
- `docs/02-ENGINEERING-STANDARDS.md`
- `docs/03-DATA-ARCHITECTURE.md`
- `docs/04-UI-UX-SYSTEM.md`
- `docs/05-BUILD-ROADMAP.md`
- Specifications 001–022

Rules of engagement:

1. Public marketing, product education, signup, onboarding, help, pricing, and conversion flows must accurately represent the product that BRIX actually delivers.
2. No public page may claim a feature, data source, integration, level of automation, professional conclusion, security certification, mobile capability, or outcome that is not implemented and verified.
3. The public website, in-product help, RELearnIQ, onboarding, billing, authentication, and support content must use the same approved product vocabulary and module names.
4. Public and authenticated experiences must never expose private Workspace, Deal, Property, Evidence, user, billing, or support data.
5. Conversion must never rely on dark patterns, hidden pricing, preselected paid options, misleading urgency, fake social proof, or confusing cancellation behavior.
6. Signup, trial, plan selection, checkout, login, password recovery, invitation acceptance, and account deletion must connect to the canonical authentication, workspace, entitlement, billing, and audit systems.
7. Help content must explain BRIX accurately without becoming a separate or contradictory product specification.
8. Every public and help workflow must define loading, empty, success, error, offline where relevant, permission, expired-link, stale-content, and recovery states.
9. Web, iPhone, and iPad entry points must preserve attribution, authentication state, invitation context, selected plan, and intended destination where permitted.
10. Accessibility, privacy, SEO, analytics consent, security headers, performance, and legal-page accuracy are production requirements.
11. Public analytics and experimentation may measure behavior but may not weaken security, privacy, pricing clarity, or canonical product rules.
12. This chapter is complete only when a new user can discover BRIX, understand its value and limits, create an account, select the proper access path, reach the product, find help, and recover from errors without developer intervention.

## 2. Mission

Deliver a premium, credible, accurate public and help experience that explains what BRIX does, who it is for, how it works, what it costs, what it does not replace, and how a user moves from discovery to productive use.

The experience must convert qualified users by reducing uncertainty, not by exaggerating capability.

## 3. Scope

This specification includes:

- Public landing page
- Product overview
- Module and workflow pages
- Use-case pages
- Property-type and investor-type pages
- Pricing and plan presentation
- Security and privacy overview
- Help center
- Searchable support content
- Getting-started guidance
- Signup and login entry points
- Trial or access-request flows where enabled
- Checkout and billing handoff
- Invitation acceptance
- Password recovery entry points
- Contact and support request flows
- Legal-page presentation
- Status and incident links
- Product updates and release notes where supported
- SEO, structured metadata, social previews, analytics, attribution, and experimentation
- Web-to-native handoff and deep-link behavior

This specification does not own:

- Canonical authentication records
- Workspace membership
- Billing calculations
- Entitlement truth
- Product implementation status
- Help article factual truth outside approved content governance
- Support-case operations beyond the intake contract
- Legal policy text without authorized review

## 4. Primary Audiences

The public experience must support:

1. New real estate investors who need clarity, guidance, and confidence.
2. Experienced residential investors who need speed and decision support.
3. Multifamily and commercial investors who need deeper modeling, evidence, and comparison.
4. Owner-users evaluating commercial real estate.
5. Teams and collaborators who need shared Deal context.
6. Existing users returning to login, help, billing, or account recovery.
7. Invited users joining an existing Workspace.
8. Professionals reviewing shared reports or selected Deal outputs.

Messaging may adapt by audience, but product truth, pricing, professional boundaries, and data handling must remain consistent.

## 5. Public Information Architecture

At minimum, the public site must provide:

- Home
- Product
- How It Works
- Modules or capabilities
- Use Cases
- Property Types
- Pricing
- Security and Privacy
- Help Center
- Contact or Support
- Login
- Create Account
- Terms
- Privacy
- Cookie or tracking preferences where applicable
- Accessibility statement where adopted
- Status link

Optional pages may include:

- Comparison pages
- Educational resources
- Product updates
- Native app information
- Investor glossary
- Partner or professional pages

Navigation must remain concise, stable, keyboard accessible, and usable on mobile.

## 6. Positioning and Messaging Contract

The core public explanation must communicate that BRIX is a Property Deal Relationship Management platform and real estate investment operating system that organizes the full relationship between an investor and a property opportunity.

Required value themes:

- One durable Deal workspace
- Evidence-linked analysis
- Deterministic underwriting
- Strategy comparison
- Financing and market context
- Contract, governance, visit, photo, inspection, and appraisal workflows
- Tasks, deadlines, reports, and decision history
- Guided and professional experiences using the same canonical data
- Web, iPhone, and iPad continuity where implemented

Required boundary statements:

- BRIX does not replace attorneys, tax professionals, lenders, brokers, inspectors, appraisers, engineers, contractors, insurers, or other licensed professionals.
- AI-supported outputs are assistive and must preserve source, confidence, and verification state.
- Estimates, assumptions, and unverified data are not confirmed facts.
- Product availability may vary by plan, geography, provider, platform, and implementation state.

Prohibited messaging:

- Guaranteed returns
- Guaranteed property value
- Guaranteed financing approval
- Guaranteed legal compliance
- Guaranteed accuracy of third-party data
- “Fully automated” claims where user review is required
- “Appraisal,” “inspection,” or “legal review” claims that misrepresent BRIX outputs
- Claims of production readiness for unfinished modules

## 7. Landing Page Requirements

The home page must include:

### 7.1 Hero

- Clear product category and value proposition
- Primary action
- Secondary product-learning action
- Credible product visual or workflow representation
- No vague AI-first messaging that hides the real estate workflow

### 7.2 Problem and outcome

Explain the fragmented investor workflow and how BRIX organizes:

- Property information
- Assumptions
- Evidence
- Financial analysis
- Strategies
- Risks
- Tasks and deadlines
- Documents
- Field observations
- Decisions

### 7.3 How it works

Show the lifecycle:

1. Add or discover a property.
2. Build the Deal record.
3. Underwrite and compare strategies.
4. Add market, financing, governance, contract, visit, photo, inspection, and appraisal information.
5. Recalculate and preserve changes.
6. Review the Decision Cockpit.
7. Produce reports and record the decision.

### 7.4 Capability sections

Capabilities must map to approved module ownership without presenting modules as disconnected apps.

### 7.5 Trust and transparency

Present:

- Source and evidence traceability
- Calculation versioning
- Security and privacy overview
- Professional boundaries
- Clear pricing access
- Product status accuracy

### 7.6 Conversion actions

Primary and secondary calls to action must be consistent across the site and route to working destinations.

## 8. Product and Use-Case Pages

Each product or use-case page must define:

- Audience
- Business problem
- BRIX workflow
- Inputs
- Outputs
- Connected modules
- Example states
- Verification requirements
- Professional boundaries
- Plan or access requirements
- Direct next action

Examples may include:

- Rental property analysis
- BRRRR evaluation
- Fix-and-flip decision support
- Multifamily acquisition
- Commercial property evaluation
- Land and development review
- HOA and association review
- Property visit workflow
- Contract and deadline organization
- Multi-Deal comparison

Examples must be labeled and may not be presented as customer outcomes unless verified and authorized.

## 9. Pricing and Plan Presentation

Pricing must be controlled by the canonical plan and entitlement configuration.

Required pricing behavior:

- Display current plan names and prices from an approved source.
- Identify billing period.
- Identify taxes or fees where applicable.
- Identify trial terms where applicable.
- Explain renewal behavior.
- Explain cancellation and downgrade behavior.
- Explain material limits and overage behavior.
- Identify platform or feature availability by plan.
- Avoid ambiguous “starting at” language unless the qualifying condition is clear.
- Never display a plan as available when checkout or entitlement provisioning cannot complete.

Plan comparison must use stable capability IDs rather than duplicated hard-coded marketing claims.

Price changes require versioned configuration, effective dates, legal review where needed, checkout reconciliation, and regression testing.

## 10. Signup and Conversion Workflow

The standard workflow is:

1. User selects Create Account, Start, Request Access, or an approved plan.
2. System preserves campaign attribution and intended destination without exposing sensitive data.
3. User reviews pricing or access terms where applicable.
4. User creates or authenticates an account through Specification 001.
5. User verifies email or completes required security step.
6. User creates a Workspace or accepts an invitation.
7. Billing or trial entitlement is created where applicable.
8. System confirms entitlement from the canonical billing service.
9. User enters onboarding or the intended authorized destination.
10. Audit and analytics events are recorded without storing unsafe sensitive content.

Requirements:

- Duplicate submissions are idempotent.
- Refresh or back navigation does not create duplicate accounts, subscriptions, or Workspaces.
- Payment success is not trusted solely from the client redirect.
- Failed checkout preserves the account and provides safe retry.
- Expired invitation or verification links provide recovery.
- Existing users are routed to login rather than duplicate account creation.
- Selected plan and attribution survive authentication only where privacy and security permit.
- No success screen appears until the server confirms the required state.

## 11. Invitation and Shared-Access Entry

Public entry links may include:

- Workspace invitation
- Shared report
- Password reset
- Email verification
- Native deep link
- Support or status link

Rules:

- Tokens are validated server-side.
- Raw tokens are not logged.
- Expired, revoked, consumed, malformed, or unauthorized links fail safely.
- The user is told what happened and what recovery action is available.
- Authentication preserves the intended destination only after authorization.
- Shared report access must follow ReportIQ scope and may not expose workspace navigation.

## 12. Onboarding

Onboarding must move the user to a meaningful first outcome, not merely complete profile fields.

Required onboarding outcomes may include:

- Confirm account and Workspace
- Select guided or professional mode
- Identify primary property types or strategies without locking the user in
- Create or import the first Deal
- Explain source classifications and assumptions
- Run the first valid underwriting scenario
- Show the Decision Cockpit
- Introduce tasks, evidence, and next verification actions

Rules:

- Onboarding uses canonical product workflows.
- Progress is resumable.
- Users may skip nonessential steps.
- Onboarding never creates fake sample success in the user’s live portfolio unless clearly separated and removable.
- Dismissal and replay are supported.
- Mode selection does not change canonical calculations.
- Onboarding failure does not block access to the product shell.

## 13. Help Center Architecture

The Help Center must support:

- Search
- Browse by module
- Browse by workflow
- Browse by property type
- Browse by investor level
- Getting started
- Account and security
- Billing and plans
- Web, iPhone, and iPad help
- Troubleshooting
- Data, source, confidence, and freshness explanations
- Professional-boundary guidance
- Contact support escalation

Every help item must include:

- Permanent content ID
- Title
- Summary
- Body
- Audience
- Applicable modules
- Applicable platforms
- Product version or effective date
- Review status
- Owner
- Last reviewed date
- Related articles
- Supersession state
- Search keywords

Help content must be versioned and retireable.

## 14. Contextual Help Integration

In-product help may open from:

- Fields
- Metrics
- Warnings
- Empty states
- Error states
- Decision Cockpit
- Modules
- Account and billing screens
- Upload, sync, and offline states
- Notifications and deadlines

Contextual help must preserve the user’s unsaved work and active Deal.

RELearnIQ owns education and explainability. This specification owns discovery, public help presentation, support navigation, and conversion continuity. The two systems must share approved content contracts without duplicate contradictory article stores.

## 15. Help Search

Help search must support:

- Exact terms
- Natural-language questions
- Module names
- Common real estate terminology
- Synonyms
- Misspellings
- Platform filters
- Role and experience filters where useful
- Context-aware ranking

Search behavior:

- Approved content ranks above generated content for policy, billing, security, and account questions.
- Generated answers must identify their source content.
- No answer is fabricated when approved information is unavailable.
- Search analytics must avoid capturing sensitive Deal content unless the user explicitly invokes contextual product help under the approved AI contract.

## 16. Support Intake

Support entry must capture only what is needed.

Supported categories:

- Account access
- Billing
- Workspace or invitation
- Product behavior
- Data or calculation question
- Upload or processing issue
- Native app issue
- Security or privacy concern
- Accessibility issue
- General feedback

A support request should include:

- Authenticated user and Workspace where available
- Category
- User description
- Affected page/module
- Correlation or job ID where available
- App/browser version
- Safe diagnostics
- User-approved attachments
- Severity
- Consent for follow-up

Sensitive Deal evidence, raw secrets, payment details, passwords, session tokens, and unnecessary personal data must not be collected in free-form diagnostics.

## 17. Public Security and Privacy Experience

The public security page must accurately explain:

- Authentication and workspace separation
- Role-based access
- RLS and server-side authorization
- Encryption in transit and approved storage protections
- Evidence and report access controls
- Share-link controls
- Auditability
- AI provider and data-handling boundaries at an approved level of detail
- Data retention and deletion entry points
- Incident and status communication paths

It must not claim certifications, compliance, encryption properties, geographic hosting, backup guarantees, or retention behavior that has not been verified.

Privacy controls must include consent and preference behavior required for analytics, advertising, cookies, and regional rules.

## 18. Legal and Policy Pages

Required policy surfaces may include:

- Terms of Service
- Privacy Policy
- Cookie or Tracking Policy
- Acceptable Use Policy
- AI disclosure
- Professional disclaimer
- Subscription and cancellation terms
- Data-processing terms where applicable
- Accessibility statement

Rules:

- Approved legal text is versioned.
- Effective dates are visible.
- Material changes are communicated as required.
- Acceptance records are stored where affirmative acceptance is required.
- Product UI and marketing claims must remain consistent with the policies.
- Codex may implement presentation and recording workflows but must not invent legal terms.

## 19. Web-to-Native Handoff

The public web experience may link to native applications when implemented.

Requirements:

- Use approved universal links and associated domains.
- Preserve intended destination safely.
- Provide App Store fallback where appropriate.
- Never expose authentication secrets in URLs.
- Do not force app installation for essential account or billing recovery.
- Shared links must respect their original access scope in native clients.
- Unsupported native destinations open a safe web fallback or explanatory state.

## 20. SEO and Discoverability

Public pages must support:

- Unique titles and descriptions
- Canonical URLs
- Structured headings
- XML sitemap
- Robots directives
- Open Graph and social metadata
- Structured data only when accurate
- Accessible semantic HTML
- Stable URLs and redirects
- No indexing of authenticated, shared-private, staging, preview, or sensitive pages

Programmatic SEO is prohibited unless each generated page has real user value, accurate content, controlled templates, and duplicate-content safeguards.

## 21. Analytics and Attribution

Analytics may measure:

- Page views
- CTA engagement
- Signup starts and completions
- Checkout starts and confirmations
- Onboarding progress
- Help searches and article usefulness
- Support escalation
- Device and performance classes
- Campaign attribution

Rules:

- Consent is enforced where required.
- Analytics identities are separated from unnecessary sensitive product data.
- URLs, page titles, events, and properties must not leak Deal addresses, document names, tokens, or private search text.
- Server-confirmed conversion events are distinguished from client intent events.
- Event names and schemas are versioned.
- Experiments must not alter security, legal acceptance, billing truth, or professional-boundary language.

## 22. Public Content Management

Marketing and help content must have:

- Owner
- Review status
- Version
- Effective date
- Supported locale
- Product capability references
- Plan references
- Legal review flag where needed
- Security review flag where needed
- Scheduled review date
- Retirement state

Publication requires validation against the current product and plan configuration.

Critical pricing, security, legal, and capability statements must not rely on an unreviewed generative publishing workflow.

## 23. UI and UX Requirements

### 23.1 Public web

- Premium, calm, modern design
- Fast first impression
- Strong hierarchy
- Clear calls to action
- Genuine product imagery
- Responsive navigation
- Accessible menus and dialogs
- No intrusive autoplay
- No content shift that disrupts reading or conversion
- No dead links or placeholder pages

### 23.2 Mobile web

- Thumb-friendly controls
- Compact navigation
- Fast forms
- Correct keyboard/input types
- Persistent but non-obstructive primary action where useful
- No horizontal overflow
- No forced desktop-style comparison table without an accessible alternative

### 23.3 Help UX

- Search first
- Clear categories
- Breadcrumbs
- Related content
- Article feedback
- Escalation path
- Deep links back to the relevant product location
- Print and share behavior where appropriate

### 23.4 Required states

- Loading
- Empty
- Success
- Validation error
- Server error
- Rate limited
- Offline
- Expired or revoked link
- Auth required
- Permission denied
- Checkout pending
- Checkout failed
- Entitlement pending
- Content stale
- Support submitted

No generic endless spinner or fake success state is allowed.

## 24. Accessibility

Verify:

- WCAG-aligned semantic structure
- Keyboard navigation
- Visible focus
- Skip links
- Screen-reader labels and order
- Sufficient contrast
- Reduced motion
- Text resizing and zoom
- Accessible forms and errors
- Accessible pricing comparison
- Accessible videos, captions, and transcripts
- Accessible charts and screenshots where used
- No meaning conveyed by color alone
- No inaccessible CAPTCHA without an alternative

## 25. Performance and Reliability

Define and measure budgets for:

- Largest contentful paint
- Interaction responsiveness
- Cumulative layout shift
- JavaScript payload
- Image weight
- Font loading
- Signup form response
- Help search response
- Checkout handoff
- Availability of critical public pages

Requirements:

- Optimize images and responsive sources.
- Defer noncritical scripts.
- Avoid blocking conversion on optional analytics.
- Cache public content with version-aware invalidation.
- Provide safe maintenance and incident messaging.
- Preserve submitted form data through recoverable failures where appropriate.

## 26. Security Requirements

- Strict separation between public and authenticated routes
- CSRF protection where applicable
- Rate limits on auth, contact, search, and support endpoints
- Bot and abuse controls that preserve accessibility
- Security headers
- Content Security Policy
- Safe redirects and validated return URLs
- No open redirect
- Token-safe link handling
- Server-side checkout and entitlement confirmation
- Sanitized content rendering
- File-upload restrictions for support attachments
- Secret-free client bundles
- Safe error messages
- Audit of sensitive conversion and support actions

## 27. Domain Events

Emit as appropriate:

- `marketing.cta_selected`
- `signup.started`
- `signup.completed`
- `signup.failed`
- `invitation.opened`
- `invitation.accepted`
- `checkout.started`
- `checkout.confirmed`
- `checkout.failed`
- `entitlement.activated`
- `onboarding.started`
- `onboarding.completed`
- `onboarding.dismissed`
- `help.search_performed`
- `help.article_viewed`
- `help.feedback_submitted`
- `support.request_created`
- `legal.acceptance_recorded`

Events must be privacy-safe, versioned, idempotent where needed, and linked to canonical server confirmation for material conversions.

## 28. Testing Requirements

Required tests include:

- Public-route and navigation tests
- Responsive layout tests
- Pricing configuration reconciliation
- Signup, verification, login, invitation, and recovery tests
- Checkout success, failure, cancel, retry, duplicate-submit, and webhook reconciliation tests
- Entitlement activation tests
- Onboarding resume, skip, replay, and completion tests
- Help search and content-version tests
- Expired/revoked/malformed token tests
- Web-to-native deep-link tests
- SEO metadata, sitemap, canonical, and no-index tests
- Analytics consent and sensitive-data leakage tests
- Support intake validation and attachment tests
- Accessibility tests
- Performance-budget tests
- Security-header, CSP, redirect, CSRF, rate-limit, and abuse tests
- Browser and mobile-device compatibility tests
- Staging and preview indexing safeguards

## 29. Verification and Validation

### 29.1 Functional verification

- Every navigation item, CTA, form, pricing action, signup path, help link, and support action reaches a working destination.
- Signup and invitation flows create or connect only the intended canonical account and Workspace.
- Checkout cannot create duplicate subscriptions or false success.
- Help search returns approved, relevant content and provides safe fallback.
- Onboarding saves, resumes, skips, and replays correctly.

### 29.2 Product-truth verification

- Public capability statements match implemented, verified BRIX functions.
- Module names, plan availability, screenshots, workflows, and platform claims match the current product.
- No unsupported legal, tax, investment, appraisal, inspection, security, or automation claim remains.
- Pricing and limitations reconcile to canonical configuration.

### 29.3 Integration verification

- Authentication, Workspaces, billing, entitlements, onboarding, RELearnIQ, native deep links, notifications, support, analytics, audit, and legal acceptance exchange the correct canonical state.
- Attribution and intended destination survive allowed transitions without leaking private information.
- Public shared-report access remains isolated from authenticated Workspace navigation.
- Help content links to the correct current product destinations.

### 29.4 UX verification

- Desktop and mobile public flows are complete.
- Forms preserve context and clearly explain errors.
- Accessibility checks pass.
- Loading, offline, expired, denied, pending, failed, and recovery states are verified.
- No dead controls, placeholder content, layout breakage, hidden pricing, or dark patterns remain.

### 29.5 Security and privacy verification

- Public routes cannot access protected data.
- Tokens, redirects, support uploads, analytics, and checkout flows pass security review.
- Sensitive content is absent from URLs, analytics, logs, and public metadata.
- Consent and legal acceptance records behave according to approved policy.

### 29.6 Production readiness checklist

- No TODOs or placeholder claims
- No fake testimonials or metrics
- No unverified badges or certifications
- No stale pricing
- No broken links
- No dead forms
- No preview or staging indexing
- No private-data leakage
- Error monitoring enabled
- Performance budgets met
- Accessibility verified
- Legal pages approved and current
- Status and support paths active
- Rollback and content-revision procedures documented

## 30. Definition of Done

Specification 023 is complete only when:

1. A qualified prospective user can understand BRIX, its value, its boundaries, and its pricing without ambiguity.
2. A new user can create an account, establish or join a Workspace, obtain the correct entitlement, and enter the product without manual intervention.
3. Existing users can log in, recover access, find help, and contact support.
4. Public claims reconcile to the implemented product and approved roadmap.
5. Pricing, billing, authentication, onboarding, help, native links, analytics, legal, and support integrations work end to end.
6. Desktop and mobile experiences meet premium UI, accessibility, performance, security, privacy, and reliability standards.
7. Verification evidence is recorded and no known material gap is hidden.

**Specification status: SPECIFIED. Implementation status must be tracked separately and may not be represented as complete until all stage gates in `docs/05-BUILD-ROADMAP.md` pass.**