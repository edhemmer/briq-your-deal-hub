# BRIX iOS App Store Compliance Checklist

This checklist tracks App Store requirements that affect BRIX iOS.

## Implemented in Source

- Sign in with Apple UI is present in `AccountView.swift`.
- Account deletion can be initiated from inside the app in `AccountView.swift`.
- Account deletion is full deletion, not temporary deactivation.
- Privacy policy is reachable in app from Account -> Privacy.
- Terms of Use and Support are reachable from Account.
- Account screen explicitly states no cross-app tracking or advertising identifier use.
- Permission purpose strings are present in `Info.plist` for camera, microphone, selected photo access, photo saving, location, and document import.
- `PrivacyInfo.xcprivacy` declares no tracking and lists intended collected data categories: email, user ID, photos/videos, optional location, audio notes, user-created deal content, and product interaction.
- `BRIXRealEstateiOS.entitlements` includes the Sign in with Apple entitlement.
- `BRIXAPIClient` keeps account deletion, uploads, auth, storage, and decision fetching behind API boundaries.
- The app requires sign-in for saved deals, sync, uploads, portfolio data, and deletion controls.
- The app does not include seeded fake property data or synthetic recommendations.
- Field captures upload to the private `field-captures` bucket and are recorded through the `field-capture` Edge Function.
- DealIQ mobile recommendations read from the RLS-aware `mobile_decision_snapshots` view.

## Backend Requirements Before App Review

- Configure the Apple provider in Supabase Auth.
- Verify native iOS Sign in with Apple token exchange against Supabase Auth in TestFlight.
- Revoke Sign in with Apple tokens through Apple's REST API when users delete accounts, when Apple token material is available.
- Deploy the `request-account-deletion` Supabase Edge Function.
- Deploy the `field-capture` Supabase Edge Function and confirm the private `field-captures` Storage bucket exists.
- Apply the migration that exposes `mobile_decision_snapshots` for production DealIQ memo summaries.
- Apply the BRIX OS + Apple compliance Supabase migration.
- Confirm full account and associated personal-data deletion behavior, except legally required retention.
- Send deletion confirmation when deletion is complete.
- Confirm Apple token revocation is implemented in the deletion function for Sign in with Apple users when token material is available.
- Keep a live backend available for App Review.
- Provide App Review test credentials with real test data, or enable Apple reviewer account creation that reaches functional backend data.
- Host a real privacy policy at the URL used in the app and App Store Connect.
- Host real Terms of Use and Support URLs at the URLs used in the app.

## App Store Connect Requirements

- Complete Privacy Nutrition Labels to match actual backend behavior.
- Include the same privacy policy URL in App Store Connect metadata.
- Ensure screenshots and metadata accurately reflect the app.
- If subscriptions are added, link users to Apple subscription management before or during account deletion.

## Apple Guidance Used

- App Review Guidelines 4.8 Login Services.
- App Review Guidelines 5.1.1 Privacy, data collection, permissions, data minimization, and account sign-in.
- Apple account deletion support guidance.
- Apple privacy manifest file documentation.
