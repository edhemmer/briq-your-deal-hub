# Supabase Apple Auth + BRIX OS Setup

This document connects the native BRIX iOS app to Supabase and the BRIX Real Estate OS data model.

## What Was Added

Migration:

- `supabase/migrations/20260618101500_brix_os_apple_compliance.sql`

Edge Function:

- `supabase/functions/request-account-deletion/index.ts`

New storage bucket:

- `field-captures`

New account/compliance fields on `profiles`:

- `auth_provider`
- `apple_user_identifier`
- `apple_private_relay_email`
- `apple_full_name_captured_at`
- `privacy_policy_accepted_at`
- `terms_accepted_at`
- `deletion_requested_at`
- `deletion_status`
- `deletion_completed_at`

New BRIX OS tables:

- `property_digital_twins`
- `brix_decisions`
- `brix_field_captures`
- `brix_visual_scope_items`
- `brix_project_tasks`
- `brix_portfolio_snapshots`
- `account_deletion_requests`

## Apple Auth Configuration in Supabase

Configure the Apple provider in Supabase Auth.

Required Apple values:

- Apple Team ID
- iOS App ID / Bundle ID: `com.brix.realestate.ios`
- Services ID for web/OAuth flows, if used
- Apple signing key / generated client secret, if using OAuth flow
- Supabase callback URL: `https://luwaqrkhmxcqsozmilbw.supabase.co/auth/v1/callback`

For native iOS, prefer native Sign in with Apple using Authentication Services and exchange the Apple identity token with Supabase Auth. Supabase documents native Apple sign-in and notes that full name is only provided on the first authorization, so the app/backend should capture it then.

## Account Deletion

The iOS app should call the `request-account-deletion` Edge Function.

Request-only mode:

```json
{
  "source": "ios",
  "reason": "optional user reason"
}
```

Final deletion mode:

```json
{
  "source": "ios",
  "reason": "optional user reason",
  "confirmDeletion": true
}
```

The function:

- Verifies the authenticated user.
- Creates an `account_deletion_requests` record.
- Marks the profile deletion status.
- Removes user-owned files from `field-captures` and `contract-uploads`.
- Deletes the Supabase Auth user when `confirmDeletion` is true.

Important: Apple token revocation should be handled by the configured auth provider or a dedicated backend revocation job when Apple token material is available. Do not mark revocation complete unless the Apple endpoint was actually called successfully.

## App Store Privacy Requirements

Keep these aligned:

- In-app privacy disclosures
- Hosted privacy policy
- App Store Connect privacy nutrition labels
- `PrivacyInfo.xcprivacy`
- Supabase storage/database behavior
- Edge Function behavior

BRIX currently expects these data categories:

- Account identifiers and email
- Property photos/videos selected or captured by the user
- Optional property visit location
- Optional voice-note audio/transcripts
- Uploaded documents such as inspections, bids, leases, and closing files
- Investment/deal data entered by the user

## RLS Notes

All BRIX OS tables are user-owned with row-level security.

The profile policy prevents users from spoofing:

- Apple identifiers
- Auth provider
- Deletion status
- Deletion timestamps
- Subscription/admin fields

The client may still update ordinary non-privileged profile fields and acceptance timestamps.

## References

- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple account deletion guidance: https://developer.apple.com/support/offering-account-deletion-in-your-app/
- Supabase Apple Auth: https://supabase.com/docs/guides/auth/social-login/auth-apple
- Supabase Swift native ID token sign-in: https://supabase.com/docs/reference/swift/auth-signinwithidtoken
- Supabase admin delete user: https://supabase.com/docs/reference/javascript/auth-admin-deleteuser
