# BRIX Real Estate — Production Build Roadmap

## 1. Purpose

This roadmap controls the rebuild order. BRIX is rebuilt as complete vertical slices inside the existing repository while retaining the connected Supabase, Vercel, domain, deployment, and Apple infrastructure.

The old application code is reference material. A slice may reuse proven code only after inspection confirms it fits the new architecture, data model, security, UI/UX, and testing standards.

## 2. Build discipline

- Build one complete slice at a time.
- Each slice must leave the product usable.
- Do not open multiple unfinished architecture fronts.
- Do not begin a dependent slice before its prerequisite is complete.
- Shared infrastructure may be introduced early only when required by the active slice.
- Every slice must satisfy the Product Constitution, Engineering Standards, Data Architecture, and UI/UX System.
- Every slice must include web, backend, persistence, authorization, error recovery, tests, and applicable iPhone/iPad behavior.
- Incomplete future navigation remains hidden behind feature flags.

## 3. Slice completion template

Before implementation:

1. State the investor outcome.
2. Inspect the repository.
3. Identify reusable and rejected legacy code.
4. State the user journey.
5. State the canonical data path.
6. State tables, storage, APIs, jobs, and events.
7. State web/iPhone/iPad behavior.
8. State loading, empty, error, stale, offline, conflict, and retry states.
9. State files expected to change.
10. State tests and measurable acceptance criteria.

After implementation:

1. Demonstrate the full journey.
2. Verify save and reopen.
3. Verify refresh/relaunch.
4. Verify permissions and RLS.
5. Verify no stale or split-brain state.
6. Verify background failures and retry.
7. Run relevant tests and builds.
8. Record exact results.
9. Confirm no unrelated files changed.
10. Mark `SLICE COMPLETE` or `SLICE NOT COMPLETE`.

## 4. Phase 0 — Controlled rebuild preparation

### Outcome

Create a clean rebuild boundary without disconnecting Supabase, Vercel, domains, or Apple infrastructure.

### Required work

- Preserve Git history.
- Tag or document the last legacy baseline.
- Establish the new application/package structure.
- Inventory environment variables and connected services.
- Separate accepted infrastructure from rejected application architecture.
- Establish feature flags.
- Establish CI quality gates.
- Establish local, preview, staging, and production environment rules.
- Establish error tracking, structured logging, and correlation IDs.
- Establish migration and rollback process.
- Establish current Apple project ownership, bundle identifiers, signing, capabilities, and App Store Connect connection.

### Validation

- Fresh clone installs.
- Local web starts.
- Local Supabase starts.
- Preview deploy succeeds.
- Production deployment remains connected but is protected from incomplete rebuild UI.
- iOS project opens and builds in the supported environment.
- No secrets are committed.

## 5. Slice 1 — Authentication, workspace, and native session foundation

### Outcome

A real user can create or access an account, enter a workspace, close the client, return, and continue securely.

### Includes

- Sign up
- Sign in
- Sign out
- Password reset
- Password change
- Session refresh
- Session expiration
- Native deep links
- Keychain storage
- Workspace creation
- Membership and roles
- Invitation acceptance
- Account deletion foundation
- RLS baseline
- Responsive web auth
- Native iPhone/iPad auth

### Validation

- All flows work end to end.
- Password reset returns to the correct client.
- Sessions survive refresh/relaunch.
- Revoked sessions stop access.
- Cross-workspace access is denied.
- Error and offline states preserve user intent.

## 6. Slice 2 — Premium application shell and navigation

### Outcome

Users enter a polished BRIX shell that preserves workspace and Deal context and contains no dead navigation.

### Includes

- Design tokens
- Core components
- Responsive web shell
- Native iPhone shell
- Native iPad shell
- Global search foundation
- Notifications foundation
- Account/workspace menu
- Background job status surface
- Guided/professional mode preference
- Loading/error boundaries
- Accessibility foundation

### Validation

- Navigation works on supported sizes.
- iPhone and iPad are independently designed.
- Keyboard and VoiceOver paths work.
- Every visible navigation item has a destination.
- Active context survives navigation and relaunch.

## 7. Slice 3 — Canonical Deal and Property lifecycle

### Outcome

A user can create, save, reopen, edit, archive, restore, and intentionally delete a Deal connected to a canonical Property.

### Includes

- Workspace, Property, Deal, stage history, activities, tasks, contacts, organizations, and domain events
- Address normalization
- Duplicate Property warning
- Deal stages
- Deal list and filters
- Deal overview foundation
- Audit history
- Web/iPhone/iPad CRUD
- Offline Deal draft creation on native clients

### Validation

- Deal lifecycle works.
- Duplicate warning does not silently merge.
- Save/reopen works across clients.
- Offline draft reconciles safely.
- Stage history and audit history are correct.

## 8. Slice 4 — Property intake and source tracking

### Outcome

A user can create a meaningful Deal from address, listing URL, manual entry, or native share action.

### Includes

- Address search/geocoding
- Listing URL intake
- Manual intake
- Source classification
- Listing snapshot
- Property facts
- Public/county data provider abstraction
- Tax, parcel, ownership, sale, permit, zoning, hazard, and association indicators where available
- Source conflict display
- Preliminary assumptions
- Missing-information list

### Validation

- Intake methods work.
- Provider failure permits manual continuation.
- Estimates are labeled.
- Re-import is idempotent.
- Source history is preserved.

## 9. Slice 5 — Deterministic underwriting foundation

### Outcome

A user can enter assumptions and receive authoritative, reproducible financial results.

### Includes

- Assumption sets
- Underwriting snapshots/results
- Acquisition and cash-required calculations
- Debt schedules
- Income/expense/NOI
- Cash flow
- Cap rate
- Cash-on-cash
- DSCR
- Break-even occupancy
- IRR/XIRR
- NPV
- Equity multiple
- Return on cost
- Maximum offer
- Scenarios and sensitivities
- Property-type calculation contracts
- Formula explanations
- Golden fixtures

### Validation

- Golden tests reconcile.
- Same inputs/version produce same outputs.
- Web/iOS/report values match.
- Stale results are labeled after assumption changes.
- Historical results remain reproducible.

## 10. Slice 6 — Strategy intelligence

### Outcome

A user can compare the intended strategy against all compatible alternatives and understand why each ranks where it does.

### Includes

- Versioned strategy registry
- Residential, multifamily, commercial, land, development, distressed, creative-finance, partnership, and portfolio strategies
- Required inputs
- Hard disqualifiers
- Deterministic ranking
- Risk and confidence
- Investor-fit preferences
- Strategy comparison UI
- RELearnIQ links
- Targeted re-ranking events

### Validation

- Every strategy has tests.
- Selected strategy is not automatically favored.
- Disqualifiers work.
- Rankings are reproducible.
- Explanations show binding factors.

## 11. Slice 7 — Decision Cockpit

### Outcome

A user can understand the current Deal and make the next decision quickly.

### Includes

- Current recommendation
- Strongest/selected strategy
- Key numbers
- Material risks
- Confidence
- Missing decision-changing information
- Deadlines
- Next action
- Recent changes
- Freshness and processing status
- Guided/professional views
- Before/after recommendation changes
- Full Deal module navigation

### Validation

- A new Deal can progress to a recorded decision.
- Every recommendation links to evidence and assumptions.
- No stale recommendation appears current.
- Resume behavior returns to the correct location.

## 12. Slice 8 — Field workflow: VisitIQ, maps, routes, photos, and voice

### Outcome

A user can plan and complete property visits with weak connectivity.

### Includes

- Directions
- Multi-property routes
- Visit schedule/checklist
- Camera and bulk photo capture
- Video where appropriate
- Voice recording and transcription
- Offline capture
- Background upload
- Durable upload queue
- Geotag controls
- Visit summary
- Suggested findings and assumption changes requiring confirmation

### Validation

- Media is not lost on app termination.
- Failed uploads retry idempotently.
- Route opens the correct Deal.
- Voice/photo outputs attach to canonical evidence.
- Offline changes sync safely.

## 13. Slice 9 — MarketIQ and FinanceIQ

### Outcome

The Deal includes defensible market context and realistic financing structures.

### Includes

- Market/geographic evidence and freshness
- Population, jobs, supply, vacancy, rent, sales, taxes, hazards, convenience, nuisances, infrastructure, and zoning context
- Cash, residential, DSCR, commercial, bridge, hard money, construction, seller financing, assumable debt, creative structures where lawful, and multi-tranche financing
- Debt schedules and constraints
- Financing comparison
- Impact on underwriting and strategy ranking

### Validation

- Market conclusions are source-linked.
- Stale data is labeled.
- Financing schedules reconcile.
- No lender approval is implied.
- Changed financing produces versioned re-underwriting.

## 14. Slice 10 — GovernanceIQ and ContractIQ

### Outcome

A user can upload association and contract documents, understand material terms, create questions, and track deadlines.

### Includes

- PDF, Word, image, scan, email body, and attachments
- Immutable evidence
- Source-linked extraction
- HOA/COA/POA rules, dues, reserves, assessments, rental/parking/pet/renovation restrictions
- Contract parties, price, earnest money, financing, due diligence, title, survey, association, closing, possession, contingencies, defaults, remedies, deadlines, and amendments
- Buyer/seller perspective
- Questions for realtor, attorney, lender, builder, association, and insurer
- Deadline/task creation

### Validation

- Original documents remain intact.
- Findings link to pages/sections.
- Unclear extraction is marked for verification.
- Restrictions affect strategy compatibility.
- No legal conclusion or representation is implied.

## 15. Slice 11 — OfferIQ

### Outcome

A user can prepare, compare, revise, and track an offer using canonical underwriting, financing, evidence, and risk.

### Includes

- Price guidance and binding constraint
- Earnest money
- Financing
- Credits
- Contingencies
- Dates
- Escalation
- Seller financing/creative terms where lawful
- Residential, commercial LOI, land, and development structures
- Revisions and counteroffers
- Status/deadlines
- Offer summary/export

### Validation

- Maximum offer is explainable.
- Revisions preserve history.
- Offer numbers reconcile to underwriting.
- Status updates the Deal timeline.

## 16. Slice 12 — InspectionIQ and AppraisalIQ

### Outcome

Professional reports can update the same Deal without erasing prior analysis.

### Includes

- Report ingestion
- Source-linked findings
- Severity and repair categories
- Cost ranges and contractor-quote replacement
- Appraised value, approaches, comps, rent, cap rate, conditions, and limitations
- Versioned assumption changes
- Before/after underwriting and recommendation

### Validation

- Findings link to source pages.
- Inspection costs flow through accepted assumptions.
- Appraisal does not silently overwrite other value opinions.
- Conflicts remain visible.

## 17. Slice 13 — Reports, portfolio comparison, sharing, and RELearnIQ

### Outcome

Users can compare opportunities, communicate decisions, and learn in context.

### Includes

- Deal report
- Underwriting report
- Strategy comparison
- Risk/evidence summary
- Visit/offer/contract/inspection/appraisal reports
- PDF, Word where needed, spreadsheet, CSV
- Secure share links
- Portfolio comparison and visit planning
- Contextual education for strategies, calculations, risks, and due diligence

### Validation

- Reports reconcile to canonical versions.
- Shares are scoped and revocable.
- Exports preserve units and currency.
- Educational examples reconcile to the engine.

## 18. Slice 14 — Admin, billing, usage, and operations

### Outcome

The platform owner can manage users, plans, limits, billing, usage, failures, and provider cost exposure safely.

### Includes

- User/workspace management
- Roles and account status
- Session revocation
- Password-reset support without password access
- Plans, trials, entitlements, cancellation, grace period, and reactivation
- Feature flags and controlled overrides
- API, AI, storage, processing, maps, and export usage
- Cost alerts
- Job queue and retry
- Audit logs
- Data deletion status
- Support notes

### Validation

- Admin access is server-enforced and audited.
- Entitlements reconcile.
- Limits are server-enforced.
- Usage is idempotent.
- Secrets/passwords are not exposed.

## 19. Slice 15 — Native hardening and Apple release

### Outcome

The native iPhone and iPad applications are production-ready and accepted by App Store Connect validation.

### Includes

- Native SwiftUI refinement
- Keychain
- Deep links and Universal Links
- Camera, microphone, files, Photos, Maps
- Background upload
- Offline queue
- Push notifications where useful
- Dynamic Type, VoiceOver, Reduce Motion
- Privacy manifests and permission descriptions
- Account deletion
- Reviewer access
- App Store metadata/screenshots
- Archive, validation, and TestFlight

### Validation

- Fresh install works.
- Core Deal journey works on device.
- Offline capture and sync work.
- iPhone/iPad layouts are production quality.
- Archive succeeds.
- App Store validation succeeds.
- TestFlight upload succeeds.

## 20. Final production release gate

BRIX may be called production-ready only when:

- P0/P1 defects are closed.
- Critical E2E journeys pass.
- Formula golden tests pass.
- RLS and storage tests pass.
- Backups and restore are tested.
- Web production build and deployment succeed.
- Rollback is documented.
- Monitoring and alerts are active.
- Provider failures and retry paths are tested.
- Admin cost visibility is active.
- Privacy, legal, support, and account deletion paths work.
- iOS archive, validation, and TestFlight succeed.
- No dead controls, fake data, disconnected modules, unlabeled stale states, silent failures, or placeholder production behavior remain.
