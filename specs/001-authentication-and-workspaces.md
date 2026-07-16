# BRIX Specification 001 — Authentication, Accounts, Sessions, and Workspaces

## Authority

This specification is governed by:

- `docs/00-START-HERE.md`
- `docs/01-PRODUCT-CONSTITUTION.md`
- `docs/02-ENGINEERING-STANDARDS.md`
- `docs/03-DATA-ARCHITECTURE.md`
- `docs/04-UI-UX-SYSTEM.md`
- `docs/05-BUILD-ROADMAP.md`

Codex must read those documents before implementing this specification.

This file is an implementation contract. It defines the complete authentication, account, session, membership, and workspace experience for web, iPhone, and iPad.

---

# 1. Mission

Build a secure, reliable, premium authentication and workspace foundation that allows a user to:

- create an account,
- sign in,
- recover access,
- maintain a secure session,
- create or join a workspace,
- manage membership and roles,
- move between authorized workspaces,
- revoke access,
- and delete their account according to policy.

Authentication must feel calm, polished, trustworthy, and complete. It must never feel like a generic starter template.

---

# 2. Non-Negotiable Rules

1. Supabase Auth is the canonical identity provider.
2. Application roles and workspace permissions are stored in canonical BRIX tables, not only in client state or JWT metadata.
3. Authorization is enforced server-side and through Row Level Security.
4. No client may contain a service-role key.
5. Passwords are never stored, logged, displayed, or made visible to administrators.
6. Session state must remain consistent across web, iPhone, and iPad.
7. A session-expiration event must not silently discard unsaved work.
8. Every authentication action must have explicit loading, success, failure, and recovery states.
9. No user may access a workspace merely by knowing its identifier.
10. No invitation may grant permissions beyond the inviter’s authority.
11. Account deletion must be available inside the application when account creation is available inside the application.
12. Email verification is disabled initially, but the design must support enabling it later without redesigning account or workspace records.
13. Authentication success does not imply workspace access. Identity and authorization remain separate.
14. No authentication or invitation route may strand the user on a blank or disconnected screen.
15. All security-sensitive actions must create an auditable event.

---

# 3. Scope

## Included

- Account registration
- Sign in
- Sign out
- Forgot password
- Password reset completion
- Password change
- Session restoration
- Session refresh
- Session expiration handling
- Session revocation
- Account profile creation
- Workspace creation
- Workspace selection
- Workspace switching
- Invitations
- Invitation acceptance
- Invitation decline
- Membership management
- Role management
- Workspace ownership transfer
- Workspace archival
- Account deletion
- Native deep linking
- Web redirect handling
- Security event history
- Authentication analytics and observability

## Excluded from this specification

- Subscription billing
- Feature entitlements beyond role access
- Enterprise SSO
- Passkeys
- Social identity providers
- Multi-factor authentication

These may be added later without replacing the canonical account, workspace, membership, and session model.

---

# 4. Canonical Entities

## 4.1 Supabase Auth User

Supabase Auth owns:

- authentication identity,
- email address,
- password credential,
- session issuance,
- refresh tokens,
- password recovery tokens,
- identity-provider metadata.

The application must not duplicate password credentials.

## 4.2 `user_profiles`

Required fields:

- `user_id` UUID, primary key, references `auth.users.id`
- `display_name`
- `first_name`
- `last_name`
- `phone_number`, nullable
- `avatar_path`, nullable
- `timezone`
- `locale`
- `preferred_currency`
- `onboarding_status`
- `account_status`
- `created_at`
- `updated_at`
- `deleted_at`, nullable

Allowed `account_status` values:

- `active`
- `suspended`
- `pending_deletion`
- `deleted`

## 4.3 `workspaces`

Required fields:

- `workspace_id` UUID, primary key
- `name`
- `slug`
- `workspace_type`
- `owner_user_id`
- `status`
- `default_currency`
- `timezone`
- `created_at`
- `updated_at`
- `archived_at`, nullable

Initial `workspace_type` values:

- `individual`
- `team`
- `company`

Allowed `status` values:

- `active`
- `suspended`
- `archived`
- `pending_deletion`

## 4.4 `workspace_memberships`

Required fields:

- `membership_id` UUID, primary key
- `workspace_id`
- `user_id`
- `role`
- `status`
- `invited_by_user_id`, nullable
- `joined_at`, nullable
- `created_at`
- `updated_at`
- `revoked_at`, nullable

Allowed roles:

- `owner`
- `administrator`
- `analyst`
- `contributor`
- `viewer`
- `billing_administrator`

Allowed membership statuses:

- `invited`
- `active`
- `suspended`
- `revoked`
- `declined`

A user may have only one active membership per workspace.

## 4.5 `workspace_invitations`

Required fields:

- `invitation_id` UUID, primary key
- `workspace_id`
- `email_normalized`
- `role`
- `token_hash`
- `status`
- `invited_by_user_id`
- `expires_at`
- `accepted_by_user_id`, nullable
- `accepted_at`, nullable
- `declined_at`, nullable
- `revoked_at`, nullable
- `created_at`
- `updated_at`

Allowed statuses:

- `pending`
- `accepted`
- `declined`
- `expired`
- `revoked`

Invitation tokens must never be stored in plaintext.

## 4.6 `security_events`

Required event examples:

- account registered
- sign in succeeded
- sign in failed
- sign out
- password reset requested
- password reset completed
- password changed
- session refreshed
- session revoked
- invitation created
- invitation accepted
- invitation declined
- membership role changed
- membership revoked
- workspace ownership transferred
- account deletion requested
- account deleted

Security events must not contain passwords, tokens, full recovery URLs, or secrets.

---

# 5. Role Permissions

## Owner

May:

- perform all workspace actions,
- invite and remove members,
- change roles,
- manage billing authority,
- archive the workspace,
- transfer ownership,
- initiate workspace deletion.

The owner role cannot be removed until ownership is transferred or the workspace is deleted.

## Administrator

May:

- manage most workspace settings,
- invite members up to administrator level,
- revoke non-owner memberships,
- manage Deal permissions,
- review workspace audit activity.

May not:

- transfer ownership,
- delete the workspace,
- assign owner role.

## Analyst

May:

- create and edit Deals,
- run underwriting,
- manage evidence,
- generate reports,
- create recommendations and decisions according to later specifications.

## Contributor

May:

- add and edit permitted Deal content,
- upload documents and media,
- create notes and tasks.

May not manage workspace members or workspace-level settings.

## Viewer

May view authorized records and reports but may not change canonical Deal data.

## Billing Administrator

May access billing, plan, invoices, and usage data but receives no automatic Deal editing privileges.

A membership may support one primary role initially. Future permission overlays must not replace server-side role enforcement.

---

# 6. End-to-End User Journeys

## 6.1 Registration

### Entry points

- Landing page
- Web sign-in screen
- iPhone sign-in screen
- iPad sign-in screen
- Valid invitation link

### Required fields

- First name
- Last name
- Email
- Password
- Terms acceptance

### Password behavior

- Show requirements before submission.
- Allow show/hide password.
- Show Caps Lock state on web where available.
- Do not expose exact provider errors that help enumerate accounts.
- Do not silently trim password input.

### Successful registration

1. Supabase creates the auth user.
2. BRIX creates `user_profiles`.
3. If registration originated from a valid invitation, BRIX presents invitation acceptance.
4. Otherwise BRIX creates an individual workspace after user confirmation of the workspace name.
5. BRIX creates owner membership.
6. BRIX records security and audit events.
7. User enters the onboarding flow or dashboard.

### Failure handling

- Preserve non-sensitive fields.
- Clear password only when security requires it.
- Explain whether the account exists, the password is invalid, the request expired, the network failed, or the server is unavailable without enabling email enumeration.
- Provide retry.
- Never show a successful account state unless profile and workspace initialization completed or is durably queued with visible recovery.

## 6.2 Sign In

Required fields:

- Email
- Password

Optional controls:

- Show password
- Forgot password
- Return to sign up

Successful sign in must:

1. establish a Supabase session,
2. load the user profile,
3. load active memberships,
4. restore the last authorized workspace if still valid,
5. otherwise prompt for workspace selection,
6. restore the last meaningful application route only if the user remains authorized,
7. surface any interrupted safe draft or upload,
8. record the security event.

Do not navigate into the application before identity and workspace authorization are resolved.

## 6.3 Forgot Password

The user submits an email address.

The response must not reveal whether an account exists.

The screen must clearly state:

- what happens next,
- that the link expires,
- that the user should check spam,
- how to retry,
- how to contact support if access remains blocked.

Rate limits must prevent abuse.

## 6.4 Password Reset Completion

Web and native reset links must:

- validate the recovery session,
- route to the reset screen,
- reject expired or previously used links,
- allow a new password and confirmation,
- revoke prior sessions according to security policy,
- confirm success,
- route to sign in or an authenticated continuation state,
- record a security event.

Native deep links must never open a blank browser page as the final experience.

## 6.5 Sign Out

Sign out must:

- preserve or clearly resolve unsaved drafts,
- stop sensitive background work where required,
- clear local session material,
- revoke the local session,
- return to the public sign-in screen,
- prevent back navigation into protected content,
- leave no sensitive cached screen visible in the app switcher where platform controls permit protection.

## 6.6 Workspace Creation

Required fields:

- Workspace name
- Workspace type
- Default currency
- Timezone

Creation must be transactional. A workspace is not considered ready until:

- workspace exists,
- owner membership exists,
- default settings exist,
- RLS permits owner access,
- security/audit event exists.

If any required step fails, the system must not leave an inaccessible orphan workspace.

## 6.7 Workspace Switching

The workspace switcher must:

- list only active authorized workspaces,
- identify current workspace,
- show role,
- preserve unsaved work or require resolution before switching,
- invalidate workspace-scoped cached data,
- reload permissions,
- route to the last valid location in the selected workspace,
- never display records from the prior workspace during transition.

## 6.8 Invitation Creation

Authorized users may invite by email and role.

Required behavior:

- normalize email,
- prevent duplicate active invitations,
- warn when the person is already a member,
- prevent assigning a role the inviter cannot grant,
- create expiration,
- send invitation email,
- record status,
- allow resend,
- allow revoke,
- audit all actions.

## 6.9 Invitation Acceptance

When the recipient opens a valid invitation:

- signed-out users may sign in or register,
- signed-in users must verify the invitation email matches the authenticated account or use an approved correction flow,
- invitation details must show workspace name, inviter, role, and expiration,
- acceptance must create or activate membership transactionally,
- invitation becomes accepted,
- user enters the workspace,
- audit/security events are created.

Acceptance must be idempotent.

## 6.10 Membership Management

Authorized users can:

- view members,
- view invitations,
- change permitted roles,
- suspend membership,
- revoke membership,
- resend or revoke invitations.

The current owner cannot be revoked.

A user cannot remove their own final owner access without transferring ownership or deleting the workspace.

## 6.11 Ownership Transfer

Ownership transfer requires:

- current owner authorization,
- target active membership,
- explicit confirmation,
- recent authentication or password re-entry where supported,
- transactional update of workspace owner and membership roles,
- audit and security events,
- notification to both parties.

A failed transfer must leave the original owner unchanged.

## 6.12 Account Deletion

Account deletion must include:

1. explanation of consequences,
2. list of owned workspaces requiring transfer or deletion,
3. resolution of active subscriptions where applicable,
4. confirmation phrase or equivalent intentional confirmation,
5. recent authentication,
6. immediate session revocation,
7. status set to `pending_deletion`,
8. background deletion workflow,
9. retention of only legally or operationally required records,
10. final deletion event.

Deletion failure must be visible to authorized operations staff and must not falsely tell the user deletion completed.

---

# 7. Web UI and UX Requirements

## Authentication shell

The authentication experience must have:

- BRIX identity and concise value statement,
- centered and readable form area,
- no distracting application navigation,
- visible support and privacy links,
- responsive desktop and mobile layout,
- password-manager compatibility,
- keyboard accessibility,
- browser autofill support,
- clear focus states,
- no layout shift during errors.

## Screens

- Sign in
- Create account
- Forgot password
- Reset password
- Invitation details
- Workspace setup
- Workspace selection
- Access revoked
- Session expired
- Account deletion

## Form states

Each screen must define:

- untouched
- focused
- valid
- invalid
- submitting
- successful
- recoverable failure
- blocking failure
- rate limited
- offline

No generic spinner may replace the entire form without preserving context.

---

# 8. iPhone UX Requirements

- Native SwiftUI screens.
- Keychain-backed session storage.
- Native password autofill.
- Correct keyboard types and return-key behavior.
- Deep-link recovery flow.
- Large touch targets.
- One-handed completion.
- VoiceOver labels.
- Dynamic Type support.
- Offline session state must distinguish cached access from authorized online access.
- On session expiration during field work, local drafts and queued media remain preserved and visibly pending.
- Authentication overlays must not discard the current Deal context.

---

# 9. iPad UX Requirements

- Native SwiftUI layout, not stretched iPhone screens.
- Appropriate form width and whitespace.
- Keyboard navigation.
- Pointer support.
- Split-view safety.
- Deep links must open the correct scene/window.
- Session and workspace changes must refresh all active scene contexts safely.

---

# 10. Session and State Architecture

## Canonical session state

Clients may cache session state but Supabase Auth remains authoritative.

Each client must represent:

- unknown
- signed out
- restoring
- authenticated identity pending authorization
- authenticated and authorized
- expired
- revoked
- offline with cached session
- error

Do not represent these materially different states with one boolean such as `isAuthenticated`.

## Refresh behavior

- Refresh tokens must be handled by supported Supabase client behavior.
- Competing refresh calls must not create logout loops.
- Failed refresh must distinguish network failure from revoked or expired credentials.
- Temporary offline state must not destroy valid local drafts.
- Revoked credentials must immediately block protected server access.

## Workspace authorization state

Each active client context must track:

- current user ID,
- current workspace ID,
- current membership ID,
- current role,
- permission version or refresh timestamp,
- authorization loading/error state.

No workspace-scoped query may run before workspace authorization resolves.

---

# 11. RLS and Server Authorization Requirements

RLS must ensure:

- users read and update only their own profile fields permitted by policy,
- users see only workspaces with active membership,
- workspace records are limited to authorized membership,
- invitations are visible only to authorized workspace managers and the intended recipient through a secure acceptance path,
- revoked members lose access immediately,
- billing-only roles do not receive Deal access unless separately permitted,
- platform-admin access is handled by explicit server-side policy and audited,
- client-provided role values are never trusted.

RLS tests must include attempts to:

- read another workspace,
- update another user profile,
- promote oneself,
- invite an owner without permission,
- reactivate a revoked membership,
- accept another person’s invitation,
- access a workspace after revocation,
- access protected storage after revocation.

---

# 12. API and Edge Function Boundaries

Use server-side functions or secure database functions where transactional behavior is required.

Expected controlled operations include:

- initialize new account profile and first workspace,
- create invitation,
- accept invitation,
- decline invitation,
- revoke invitation,
- change role,
- revoke membership,
- transfer ownership,
- request account deletion,
- finalize account deletion,
- revoke sessions where supported.

Every operation must:

- verify authenticated identity,
- verify authorization,
- validate input,
- be idempotent where retry is possible,
- create audit/security events,
- return typed errors,
- avoid exposing internal secrets or raw SQL errors.

---

# 13. Deep Links and Redirects

Required link destinations:

- password reset
- invitation acceptance
- invitation decline where supported
- sign-in continuation
- account action confirmation where supported

Every link must define:

- valid state,
- expired state,
- already-used state,
- wrong-account state,
- signed-out state,
- native app installed state,
- native app unavailable state,
- web fallback state.

Redirect allowlists must be environment-specific.

No wildcard redirect configuration may weaken production security.

---

# 14. Error Model

Canonical error categories:

- validation error
- invalid credentials
- account unavailable
- rate limited
- invitation expired
- invitation revoked
- invitation already accepted
- wrong account
- membership revoked
- insufficient permission
- workspace unavailable
- session expired
- session revoked
- network unavailable
- provider unavailable
- conflict
- internal error

Each error response must include:

- stable error code,
- user-safe message,
- retryability,
- field reference where applicable,
- correlation ID where applicable.

---

# 15. Loading, Empty, Stale, and Offline States

## Loading

Authentication restoration must show a branded, bounded loading state with timeout handling. It must not show protected content before authorization resolves.

## Empty

A user with no active workspace must receive a workspace creation or support path, not a blank dashboard.

## Stale

If cached profile or membership information is displayed while revalidating, it must not permit actions until authorization is current.

## Offline

Offline behavior must:

- preserve local drafts,
- explain that online authorization cannot be revalidated,
- prevent sensitive operations requiring the server,
- resume safely when connectivity returns,
- avoid false sign-out caused only by temporary network loss.

---

# 16. Notifications

Required notifications may include:

- workspace invitation
- invitation reminder
- invitation revoked
- membership activated
- role changed
- access revoked
- ownership transfer requested/completed
- password changed
- account deletion requested/completed
- suspicious security action where supported

Notifications must link to the correct authenticated destination and must not expose sensitive workspace information to unauthorized recipients.

---

# 17. Logging, Analytics, and Observability

Track without storing secrets:

- registration started/completed/failed
- sign-in success/failure category
- password recovery requested/completed
- session restoration success/failure
- invitation created/accepted/declined/expired/revoked
- workspace created
- workspace switched
- membership changed
- account deletion requested/completed/failed

Operational dashboards must make visible:

- authentication error rate,
- password recovery failure rate,
- invitation delivery failure rate,
- deep-link failure rate,
- session-refresh failure rate,
- account initialization failure rate.

Logs must include correlation IDs and must exclude passwords, tokens, full invitation URLs, and sensitive personal data beyond operational necessity.

---

# 18. Performance Requirements

- Authentication shell should render promptly on typical broadband and mobile networks.
- Form interaction must remain responsive during network calls.
- Workspace selection should not download Deal data until a workspace is selected.
- Session restoration must not trigger duplicate membership queries.
- Invitation acceptance must be idempotent under repeated taps or retries.
- Authentication routes must have explicit timeout and retry behavior.

---

# 19. Accessibility Requirements

- WCAG 2.2 AA for web.
- VoiceOver support on iOS and iPadOS.
- Dynamic Type support.
- Logical focus order.
- Error summaries linked to invalid fields.
- Status changes announced appropriately.
- Color is not the sole indicator.
- Password visibility control has an accessible label and state.
- Touch targets meet platform standards.
- Reduced Motion settings are respected.

---

# 20. Security Requirements

- TLS for all network traffic.
- Secure cookie/token handling according to client architecture.
- Keychain storage on Apple platforms.
- No token in logs or analytics.
- No service-role key in client code.
- Rate limiting for sign-in, password recovery, invitations, and sensitive actions.
- CSRF protection where applicable.
- Redirect allowlists.
- Recent-authentication requirement for destructive or ownership actions.
- Session revocation after password change according to policy.
- Audit of role, ownership, access, and deletion changes.
- Storage access must follow active workspace authorization.

---

# 21. Required Automated Tests

## Unit tests

- email normalization
- role grant rules
- membership state transitions
- invitation expiry
- invitation idempotency
- workspace-switch state reset
- typed error mapping

## Database/RLS tests

- self profile access
- cross-user denial
- authorized workspace access
- unauthorized workspace denial
- revoked membership denial
- owner protections
- invitation visibility
- billing-role isolation

## Integration tests

- registration and profile initialization
- first workspace creation
- sign in and workspace restoration
- forgot/reset password
- invitation creation and acceptance
- invitation retry/idempotency
- role change
- revocation
- ownership transfer rollback on failure
- account deletion workflow

## Web E2E

- register → create workspace → enter dashboard
- sign out → sign in → restore workspace
- forgot password → reset → sign in
- invite second user → accept → enter workspace
- revoke member → access denied
- switch between two workspaces without stale data
- expired session with preserved draft

## iPhone/iPad tests

- session restoration
- Keychain persistence
- reset-password deep link
- invitation deep link
- offline draft preservation during session revalidation
- revoked-session handling
- workspace switch without stale records
- Dynamic Type and VoiceOver on authentication screens

---

# 22. Manual Verification Matrix

Verify on:

- Chrome on Windows
- Safari on macOS
- Mobile Safari responsive web
- Current supported iPhone sizes
- Current supported iPad sizes
- Slow network
- Temporary offline state
- Expired invitation
- Revoked invitation
- Expired session
- Revoked session
- Multiple workspaces
- User with no workspace
- Account with owned workspace
- Account deletion with unresolved ownership

---

# 23. Definition of Done

This specification is complete only when:

1. Registration works end to end.
2. Sign in and sign out work end to end.
3. Password reset works on web, iPhone, and iPad.
4. Session restoration and refresh are reliable.
5. Temporary connectivity loss does not cause destructive false logout.
6. Workspace creation is transactional.
7. Workspace switching cannot leak stale data from another workspace.
8. Invitations can be created, delivered, accepted, declined, expired, resent, and revoked.
9. Membership roles are enforced server-side.
10. Revocation removes access immediately.
11. Ownership transfer is safe and audited.
12. Account deletion is available in-app and works according to policy.
13. RLS tests pass.
14. No password, token, service-role key, or secret is exposed.
15. Web, iPhone, and iPad use the same canonical identity and membership model.
16. All visible controls work.
17. Loading, empty, error, stale, offline, and revoked states are implemented.
18. Exact verification commands and results are recorded.
19. No unrelated feature was modified.
20. Codex reports `SPECIFICATION COMPLETE` only after all required tests and manual checks pass.

---

# 24. Codex Execution Prompt

```text
Implement BRIX Specification 001 — Authentication, Accounts, Sessions, and Workspaces.

Before coding:
1. Read docs/00-START-HERE.md through docs/05-BUILD-ROADMAP.md.
2. Read this entire specification.
3. Inspect the repository and identify existing authentication, Supabase, route, iOS, profile, membership, and workspace code.
4. State the canonical data path.
5. List files expected to change.
6. List database migrations, RLS policies, functions, deep-link configuration, and tests required.
7. Identify duplicate or conflicting legacy implementation that must not be reused.
8. Define all loading, empty, failure, stale, offline, revoked, and permission states.

Then implement one complete end-to-end workflow without placeholders or dead controls.

At completion report:
- files changed,
- migrations,
- functions/APIs,
- tests added,
- exact commands and results,
- unverified items,
- confirmation that unrelated files were not changed,
- SPECIFICATION COMPLETE or SPECIFICATION NOT COMPLETE.
```
