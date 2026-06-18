# BRIX iOS App Store Compliance Checklist

This checklist tracks App Store requirements that affect BRIX iOS.

## Implemented in Source

- Sign in with Apple UI is present in `AccountView.swift`.
- Account deletion can be initiated from inside the app in `AccountView.swift`.
- Account deletion is full deletion, not temporary deactivation.
- Privacy policy is reachable in app from Account -> Privacy.
- Permission purpose strings are present in `Info.plist` for camera, microphone, selected photo access, photo saving, location, and document import.
- `PrivacyInfo.xcprivacy` declares no tracking and lists intended collected data categories.
- `BRIXRealEstateiOS.entitlements` includes the Sign in with Apple entitlement.
- `BRIXAPIClient` keeps account deletion, token revocation, uploads, and decision fetching behind API boundaries.
- The app allows browsing the BRIX OS demo without sign-in; saved/synced features can require account auth.

## Backend Requirements Before App Review

- Configure the Apple provider in Supabase Auth.
- Implement native iOS token exchange with Supabase Auth.
- Revoke Sign in with Apple tokens through Apple's REST API when users delete accounts, when Apple token material is available.
- Deploy the `request-account-deletion` Supabase Edge Function.
- Apply the BRIX OS + Apple compliance Supabase migration.
- Confirm full account and associated personal-data deletion behavior, except legally required retention.
- Send deletion confirmation when deletion is complete.
- Keep a live backend available for App Review.
- Provide App Review demo credentials or a fully functional demo mode.
- Host a real privacy policy at the URL used in the app and App Store Connect.

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
