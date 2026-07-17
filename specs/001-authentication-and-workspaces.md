# BRIX Specification 001 — Authentication, Accounts, Sessions, and Workspaces

## 1. Authority and Rules of Engagement

This specification is governed by all files in `docs/00-START-HERE.md` through `docs/05-BUILD-ROADMAP.md`.

Before implementation, Codex must inspect the existing Supabase Auth configuration, redirect URLs, RLS policies, profile and membership tables, Vercel environments, iOS bundle configuration, Keychain usage, deep links, and current account-deletion behavior.

Non-negotiable rules:

1. Authentication identity is owned by Supabase Auth. Application profile and workspace membership are separate canonical records.
2. Authorization is enforced server-side and by RLS. Client route guards are not authorization.
3. No client contains a service-role key or privileged secret.
4. Sessions must restore safely, refresh correctly, and fail closed when revoked or expired.
5. Password reset and invitation links must return users to the correct web or native workflow.
6. Workspace data is isolated by `workspace_id`.
7. Roles and permissions have one canonical definition.
8. Account creation requires an in-product account-deletion path.
9. Errors must not reveal whether unrelated accounts exist beyond safe product behavior.
10. Every auth and workspace flow must work on web, iPhone, and iPad.
11. No partial success may create an unusable profile, orphan workspace, or membership without recovery.
12. Administrative support may not expose passwords, tokens, or unrestricted impersonation.

## 2. Mission

Provide secure, understandable account and workspace access so users can create or join a BRIX workspace, maintain sessions across supported clients, collaborate under explicit roles, recover access, revoke access, and delete accounts without compromising canonical Deal data or security.

## 3. Scope

Included:

- Sign up
- Sign in
- Sign out
- Password reset request and completion
- Password change
- Session refresh and restoration
- Expired/revoked-session handling
- Profile creation and update
- Workspace creation and switching
- Invitations
- Membership lifecycle
- Roles and permissions
- Session revocation
- Account deletion
- Workspace ownership transfer or deletion
- Native deep links and Keychain
- Security and audit events
- Reviewer/demo access support

Excluded:

- Billing entitlements beyond role hooks
- Platform-admin operations beyond required security boundaries
- Social login unless separately approved
- SSO/SAML unless separately specified

## 4. Canonical Data Ownership

### `profiles`

- `user_id` references Supabase Auth user ID
- display name
- preferred locale/timezone
- guided/professional preference
- accessibility preferences where appropriate
- account state
- created/updated timestamps

A profile does not grant workspace access.

### `workspaces`

- ID
- name
- slug or display identifier
- owner user ID
- status
- settings
- created/updated timestamps

### `workspace_memberships`

- workspace ID
- user ID
- role ID
- status
- invited/accepted/revoked metadata
- created/updated timestamps

Unique active membership per workspace/user pair.

### `workspace_invitations`

- workspace ID
- normalized invite email
- intended role
- token hash or secure Auth-compatible identifier
- inviter
- expiration
- accepted/declined/revoked status
- timestamps

### `roles` and `role_permissions`

Minimum roles:

- Owner
- Administrator
- Analyst
- Contributor
- Viewer
- Billing Administrator
- Platform Administrator

Platform Administrator is not a normal workspace role and must be isolated.

### Audit and security records

Record sign-in-sensitive events, invitations, role changes, membership revocation, ownership transfer, session revocation, account deletion initiation/completion, and platform-admin access.

## 5. Permission Model

Permissions must be explicit, centrally defined, and checked server-side.

Minimum permission families:

- Workspace administration
- Membership and invitation management
- Deal view/create/edit/archive/delete
- Evidence view/upload/delete
- Underwriting edit/run/view
- Strategy view/manage
- Offer/contract/finance/governance permissions
- Report generate/share
- Billing administration
- Platform administration

Owner-only actions should include ownership transfer, workspace deletion, and other irreversible workspace actions unless explicitly delegated.

## 6. Sign-Up Workflow

1. User opens sign-up.
2. User enters email, password, and required profile information.
3. Client validates format and password requirements.
4. Supabase Auth creates identity.
5. Backend idempotently creates profile.
6. User creates a workspace or accepts a pending invitation.
7. Canonical membership is created.
8. Session is established.
9. User enters onboarding or dashboard.
10. Audit events record account and workspace creation.

Failure handling:

- Auth identity created but profile creation failed: retry profile bootstrap idempotently.
- Profile created but workspace creation failed: preserve profile and return to workspace setup.
- Duplicate submission: no duplicate profile/workspace/membership.
- Offline before submit: retain form locally but do not claim creation.

Email verification may initially be disabled, but the architecture must allow it to be enabled without redesign.

## 7. Sign-In and Session Workflow

Required:

- Email/password sign-in
- Accurate invalid-credential message
- Rate-limit handling
- Session restoration on reload/relaunch
- Token refresh
- Multi-workspace selection
- Return to intended authorized deep link
- Revoked-user handling
- Disabled/deleted-account handling

Web session storage must follow framework and Supabase security guidance. Native tokens must be stored in Keychain.

No sensitive tokens may be logged.

## 8. Password Reset and Change

### Reset request

- Accept email.
- Return a privacy-safe response.
- Use environment-correct redirect URLs.
- Rate-limit abuse.

### Reset completion

- Validate recovery session.
- Route to native app through Universal Link/deep link when initiated there.
- Require new password and confirmation.
- Handle expired/used link.
- Revoke or refresh sessions according to policy.
- Return user to intended client with clear success.

### Authenticated change

- Require current authentication/re-authentication where appropriate.
- Record security event.
- Do not expose password values.

## 9. Workspace Creation and Switching

Workspace creation must:

- Create workspace and owner membership transactionally or through recoverable idempotent workflow.
- Initialize required settings.
- Avoid duplicate creation from retry.
- Make the new workspace active.

Workspace switching must:

- Clear workspace-scoped client caches safely.
- Cancel or re-scope in-flight requests.
- Prevent data from the prior workspace flashing into the new workspace.
- Restore the new workspace’s last meaningful location where safe.

## 10. Invitations and Membership Lifecycle

Invitation workflow:

1. Authorized user selects role and email.
2. Backend validates permission and role.
3. Invitation is created idempotently.
4. Email/deep link is sent.
5. Recipient signs in or creates account.
6. Invitation is validated for email, workspace, state, and expiration.
7. Membership is created or activated.
8. Invitation is marked accepted.
9. Audit and notification events are recorded.

Support:

- Resend
- Revoke
- Decline
- Expiration
- Existing member detection
- Role change
- Member removal
- Self-leave, subject to ownership rules

Removing or revoking a member must stop access immediately through RLS and session-aware client behavior.

## 11. Account and Workspace Deletion

### Account deletion

User can initiate deletion in web and native apps.

Flow:

1. Explain consequences.
2. Re-authenticate where appropriate.
3. Resolve owned workspaces through transfer or deletion.
4. Record deletion request.
5. Revoke sessions and access.
6. Process retention/deletion asynchronously with visible status.
7. Complete Auth identity deletion when safe.
8. Record audit event without retaining unnecessary personal data.

### Workspace deletion

- Owner-only unless policy states otherwise.
- Explain permanent effects.
- Require confirmation.
- Archive or delete according to retention policy.
- Revoke memberships and shares.
- Track background deletion state.

No deletion workflow may leave accessible orphan files or active share links.

## 12. Web UX

Required screens:

- Sign in
- Sign up
- Forgot password
- Reset password
- Workspace setup
- Invitation acceptance
- Workspace switcher
- Members and roles
- Profile/security settings
- Account deletion

Required states:

- Loading/restoring session
- Signed out
- Signed in without workspace
- Invitation pending
- Disabled/revoked
- Expired recovery
- Rate limited
- Offline
- Error/retry

Forms retain input after recoverable error and provide accessible error summaries.

## 13. iPhone and iPad UX

- Native SwiftUI auth screens.
- Keychain session storage.
- Universal Links/deep links for reset and invitation.
- Session restoration on launch.
- Correct scene routing when a link opens an installed or newly installed app.
- Clear offline state.
- iPad uses appropriate split/layout behavior; no stretched phone form.
- Account deletion is available in-app.

## 14. API and Function Contracts

Privileged operations require server or Edge Function boundaries:

- Create workspace
- Invite/resend/revoke invitation
- Change role
- Remove membership
- Transfer ownership
- Revoke sessions
- Initiate/complete account deletion
- Delete workspace
- Platform-admin support operations

Every operation defines input validation, authorization, idempotency, audit, error envelope, and rate limit.

## 15. RLS Requirements

Policies must prove:

- Active members can access their workspace according to permissions.
- Nonmembers cannot read or mutate workspace records.
- Revoked members lose access.
- Viewer cannot mutate.
- Users cannot elevate their own role.
- Workspace admins cannot assign platform-admin authority.
- Invitations cannot be accepted by the wrong identity.
- Profile access is limited appropriately.

## 16. Security and Abuse Protection

- Strong password policy consistent with current Auth configuration.
- Rate limits for sign-in, reset, invitation, and deletion requests.
- Bot/abuse controls where appropriate.
- Safe enumeration-resistant messaging.
- CSRF and redirect validation for web flows.
- Universal Link/domain validation for native flows.
- No open redirects.
- Audit of sensitive actions.
- Secrets remain server-side.

## 17. Domain Events

At minimum:

- `account.created`
- `profile.created`
- `workspace.created`
- `workspace.updated`
- `workspace.ownership_transferred`
- `workspace.deletion_requested`
- `workspace.deleted`
- `invitation.created`
- `invitation.accepted`
- `invitation.revoked`
- `membership.created`
- `membership.role_changed`
- `membership.revoked`
- `session.revoked`
- `account.deletion_requested`
- `account.deleted`

Events are emitted after persistence and consumed idempotently.

## 18. Testing Requirements

- Unit tests for permission mapping and state handling.
- Database/RLS tests for all role combinations and cross-workspace denial.
- Integration tests for signup bootstrap, workspace creation, invitation acceptance, role change, revocation, and deletion.
- Web E2E for sign up, sign in, reset, workspace switch, invitation, and account deletion.
- iOS unit/UI tests for session restoration, Keychain, deep links, reset, invitation, and deletion.
- Retry/idempotency tests.
- Rate-limit and safe-error tests.
- Accessibility tests.

## 19. Verification and Validation

### Functional verification

- Sign up, sign in, sign out, reset, password change, session restore, workspace create/switch, invite, role change, revoke, leave, ownership transfer, account deletion, and workspace deletion work end to end.
- Duplicate requests do not create duplicate records.
- Workflows reopen at the correct state.

### Integration verification

- Dashboard receives correct active workspace/user context.
- Deal and all subsystem queries are correctly scoped.
- Notifications and audit events are created once.
- Native deep links open the intended flow.
- Revocation immediately blocks all connected modules and files.

### Security verification

- Cross-workspace reads/writes fail.
- Privilege escalation fails.
- Service credentials are absent from clients.
- Tokens and passwords are absent from logs.
- Rate limits and redirect validation pass.

### UX verification

- Loading, offline, expired, invalid, rate-limited, revoked, partial, and recoverable-error states are clear.
- Web keyboard/accessibility and native VoiceOver/Dynamic Type pass.
- No dead-end or ambiguous success state remains.

### Definition of Done

This specification is complete only when all supported clients pass their flows, RLS tests pass, deletion and revocation are proven, and downstream modules receive correct workspace context.

**SPECIFICATION STATUS: REVIEWED AND REPAIRED**
