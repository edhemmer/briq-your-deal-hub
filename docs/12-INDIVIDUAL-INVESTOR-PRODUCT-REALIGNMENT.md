# BRIX Real Estate — Individual Investor Product Realignment

## 1. Authority and Effective Scope

This document is a binding product and implementation amendment approved by the product owner. It applies to every Markdown file under `docs/` and `specs/` and to all implementation work after this commit.

When any existing document can reasonably be read as favoring enterprise collaboration, team administration, workforce management, or security complexity beyond the needs of an individual real estate investor, this amendment controls.

This amendment does not weaken baseline production security, data isolation, account recovery, deletion obligations, auditability, or Apple/App Store requirements. It removes over-engineering that does not materially improve the individual investor experience.

## 2. Primary Product Model

BRIX is an individual-investor operating system.

The primary user is one real estate investor evaluating, buying, financing, improving, operating, refinancing, and selling property.

The normal account model is:

1. One user account.
2. One default personal workspace created automatically.
3. One investor controlling the Deal lifecycle.
4. Optional light access for a spouse, investment partner, or trusted professional only when explicitly used.
5. No collaboration feature may compete with core investor analysis for roadmap priority.

The word `workspace` remains a technical tenancy and data-isolation boundary. In the ordinary product experience it should feel like the investor’s private BRIX account, not an enterprise organization.

## 3. Product Priorities

Implementation priority is:

1. Premium application shell and navigation.
2. Canonical Property and Deal creation.
3. Property intake and source tracking.
4. Deterministic underwriting.
5. Strategy comparison and ranking.
6. Decision Cockpit.
7. Market, financing, governance, contract, offer, photo, visit, inspection, appraisal, evidence, reporting, education, and portfolio workflows.
8. Native field use and production release.

Collaboration, member administration, advanced roles, ownership transfer, and enterprise workspace controls are secondary capabilities and may not delay investor-facing Deal workflows unless required for baseline security, account deletion, legal compliance, or an explicit real user need.

## 4. Authentication and Security Standard

BRIX requires normal production SaaS security, not enterprise identity infrastructure for its own sake.

Required baseline:

- Supabase Auth remains the identity owner.
- Password reset and session restoration work.
- RLS prevents cross-account and cross-workspace access.
- Secrets remain server-side.
- Revoked access fails closed.
- Account deletion is available before production release.
- Sensitive tokens and passwords are never logged.
- Apple-required privacy, login, and deletion behavior is satisfied.

Not required unless later approved:

- Generic sign-up email verification.
- SAML or enterprise SSO.
- Custom role builders.
- Department or team hierarchies.
- Workforce administration.
- Bulk member management.
- Complex approval chains.
- Continuous device/session administration beyond normal secure behavior.
- Security work whose cost materially delays the investor workflow without a credible risk reduction.

General sign-up should remain friction-light. Password recovery and secure invitation links may still use email where required.

## 5. Collaboration Boundary

Collaboration is optional and subordinate.

Allowed lightweight collaboration:

- Invite a spouse or investment partner.
- Grant a trusted professional limited access.
- Revoke that access.
- Share a specific report or Deal artifact through approved secure sharing.

Do not build or emphasize:

- Team dashboards.
- Employee directories.
- Departments.
- Channels.
- Presence indicators.
- Internal chat.
- Workforce metrics.
- Enterprise permission designers.
- Bulk user administration.
- Collaboration-first navigation.

Existing membership, invitation, role, and revocation infrastructure may remain as background capability. It should be hidden or minimized for solo investors and should not receive additional roadmap effort unless needed by a later approved workflow.

## 6. Specification 001 Realignment

Specification 001 is interpreted as an enabling foundation, not the primary product experience.

The practical web foundation is considered sufficient to advance when the following are implemented and verified:

- Account creation and sign-in.
- Session restoration and sign-out.
- Personal workspace bootstrap.
- Password recovery and password change.
- RLS and account isolation.
- Basic invitation and access revocation already implemented.
- Safe handling of revoked and deleted users.

Remaining Specification 001 work is classified as follows:

### Required before public production release

- In-product account deletion.
- Final security regression and observability checks.
- Apple-required native login, recovery, deletion entry point, and privacy behavior.

### Deferred to the Mac/Apple verification phase

- Xcode compilation.
- iPhone/iPad simulator and physical-device verification.
- Keychain runtime verification.
- Universal Link runtime verification.
- Signing, entitlements, archive, TestFlight, and App Store validation.

### Deferred unless a proven user need exists

- Ownership transfer workflows.
- Advanced workspace deletion administration beyond account-deletion policy needs.
- Additional membership management.
- Custom roles.
- Enterprise administration.

The Windows build may continue into Specification 002 and the investor workflow while Apple-only verification remains an explicit deferred release gate.

## 7. Roadmap Realignment

The numbered specification order remains authoritative, but completion gates must be interpreted according to product value and environment capability.

Effective execution rule:

1. Complete the practical web foundation of Specification 001.
2. Record Apple-only verification as deferred, not failed, when Xcode is unavailable.
3. Build Specification 002, the premium Dashboard and Application Shell.
4. Build Specification 003, canonical Property and Deal records.
5. Continue in the existing numbered roadmap.
6. Return to deferred Apple verification on a Mac before native release and final Specification 024 certification.

No prompt may keep BRIX stalled in low-value account, role, membership, or security edge cases after the practical foundation is working.

## 8. UI and UX Realignment

The normal user experience must assume a solo investor.

Primary navigation should emphasize:

- Home.
- Deals.
- Add Property or Add Deal.
- Analysis.
- Tasks and deadlines.
- Reports.
- Search.
- Settings.

Workspace and collaborator controls belong in secondary settings and should not dominate the dashboard, onboarding, or global navigation.

Use investor language, not enterprise language.

Prefer:

- My BRIX.
- My Deals.
- People with access.
- Share access.
- Remove access.

Avoid:

- Organization administration.
- Workforce.
- Teams.
- Departments.
- User provisioning.
- Enterprise directory.

## 9. Data Architecture Interpretation

The canonical `workspace_id` remains required for tenancy, RLS, future flexibility, and safe optional sharing.

Its existence does not make BRIX a team product.

Every newly created investor account should receive a personal workspace automatically. Product code should not force the user to understand tenancy concepts before creating and analyzing a Deal.

Do not remove or duplicate canonical workspace, membership, role, audit, or event records already implemented. Simplify exposure and roadmap priority rather than destabilizing the data model.

## 10. Billing, Admin, and Operations Interpretation

Specification 019 must be individual-first.

Plans, usage, billing, support, and operations should optimize for individual investors and small households or partnerships.

Enterprise sales administration, seat management, complex organization billing, and large-account provisioning are out of scope unless separately approved.

## 11. Reporting and Sharing Interpretation

Sharing is artifact-first, not team-first.

Prefer secure sharing of:

- Deal reports.
- Underwriting summaries.
- Offer packages.
- Contract questions.
- Due-diligence findings.
- Portfolio comparisons.

Do not require a collaborator account when a scoped, expiring, read-only share link safely satisfies the use case.

## 12. Native Interpretation

The native application is primarily a field tool for the individual investor.

Prioritize:

- Fast Deal access.
- Property visits.
- Photos and video.
- Voice notes.
- Document capture.
- Maps and routes.
- Tasks and deadlines.
- Decision review.
- Offline continuity.

Do not prioritize native member administration or enterprise workspace controls.

Apple-only runtime verification may be deferred while development occurs on Windows, but it must pass before native production release.

## 13. Codex Prompt Rules

Before every build prompt, the controlling agent must:

1. Read this amendment.
2. Re-read the current roadmap and current specification.
3. Confirm the next slice advances the individual investor workflow.
4. Check the actual repository state.
5. Check the capabilities of the current execution environment.
6. Defer only platform-specific verification that cannot run in that environment.
7. Avoid adding enterprise collaboration or security complexity without an explicit documented need.
8. Build one production-ready vertical slice.
9. Commit and push to `origin/main`.
10. Stop after the slice.

No prompt may be generated from memory alone.

## 14. Conflict Resolution

When an existing document conflicts with this amendment:

1. Preserve the safe canonical data model.
2. Preserve baseline security and compliance.
3. Remove or defer enterprise-oriented scope.
4. Prioritize the solo investor’s Deal workflow.
5. Do not rewrite stable code merely to simplify terminology.
6. Update user-facing navigation and future implementation order first.

## 15. Current Direction

The collaboration and authentication foundation already implemented is retained.

The build now moves forward into the premium investor experience rather than adding more membership or enterprise administration.

The next major roadmap target is Specification 002: Dashboard and Application Shell, followed by Specification 003: Deals and PDRM Core.

## 16. Validation and Definition of Done

This realignment is successfully applied when:

- Future prompts cite this document.
- Investor-facing modules receive roadmap priority.
- Collaboration remains optional and secondary.
- Personal workspace creation is automatic and unobtrusive.
- No new enterprise administration is added without approval.
- Windows development continues without being blocked by unavailable Xcode verification.
- Deferred Apple gates remain visible and are completed before native release.
- BRIX feels designed for an individual investor from onboarding through every Deal decision.

**REALIGNMENT STATUS: APPROVED AND BINDING**
