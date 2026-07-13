# BRIX Real Estate iOS

Native SwiftUI client for BRIX Real Estate.

## Product Role

The iOS app is the field-ready BRIX client. It focuses on:

- Decision-first mobile experience
- Property field capture
- Visual Scope Builder
- Digital Twin review
- Strategy comparison presentation
- Project execution tracking
- Portfolio visibility
- Offline queueing
- Push-notification-ready workflows

Business logic belongs in backend services. The app does not duplicate scoring engines, trust calculations, strategy calculations, or underwriting engines.

## Current App

This native client implements:

- `FindIQView`: native property intake from address, listing URL, or listing text
- `DealIQCockpitView`: native underwriting cockpit for the selected deal
- `PipelineIQView`: mobile opportunity pipeline status
- `OfferIQView`: offer readiness and next-action workspace
- `ContractIQView`: native contract risk review
- `FieldInvestorView`: camera/photo capture and mobile field observations
- `PortfolioOSView`: portfolio metrics rendered from BRIX backend state when assets exist
- `AccountView`: email sign-in, account creation, password reset, sign out, and account deletion request flow
- `BRIXService`: URLSession boundary to Supabase Auth and Edge Functions

## Xcode Setup

### Clone the repo on your Mac

Repository:

```bash
https://github.com/edhemmer/briq-your-deal-hub.git
```

In Xcode:

1. Open Xcode.
2. Choose `File > Clone Repository...`.
3. Paste `https://github.com/edhemmer/briq-your-deal-hub.git` into the search/address field.
4. If Xcode does not list it from GitHub search, use the pasted URL directly. The GitHub repo name is `briq-your-deal-hub`, not `BRIX`.
5. Clone it to your Mac.

Terminal fallback:

```bash
git clone https://github.com/edhemmer/briq-your-deal-hub.git
cd briq-your-deal-hub
```

### Open the iOS Xcode project

Open this project file:

```bash
open ios/BRIXRealEstateiOS/BRIXRealEstateiOS.xcodeproj
```

The repository now includes a real iOS Xcode project wrapper, so you should not need to create a new macOS project or manually attach loose Swift files.

Project settings:

- Interface: SwiftUI
- Language: Swift
- Minimum iOS: 17.0
- Bundle ID: `BrixRE.Brix-Real-Estate`
- Supported destinations: iPhone and iPad
- Mac Catalyst: Off
- Add the `Sign in with Apple` capability before enabling any third-party social sign-in provider.
- Use `BRIXRealEstateiOS.entitlements`.
- Include `Info.plist` and `PrivacyInfo.xcprivacy` in the app target.
- Include `Assets.xcassets` in the app target and set the app icon source to `AppIcon`.
- Confirm `INFOPLIST_KEY_BRIX_SUPABASE_URL` and `INFOPLIST_KEY_BRIX_SUPABASE_PUBLISHABLE_KEY` in the Xcode project build settings point at the production Supabase project.

The source uses SwiftUI and is configured for iOS 17+.

## Privacy and App Store Compliance

See `APP_STORE_COMPLIANCE.md`.

The native app must remain a field-ready client for the BRIX backend:

- Do not add fake listings, unverified recommendations, or duplicate scoring engines.
- Do not add non-Apple social login unless Sign in with Apple remains available with equal or greater prominence.
- Keep account deletion in the native Account screen.
- Keep privacy disclosures aligned with the actual backend, storage, AI, and provider behavior.
- Keep business logic, scoring, recommendation generation, and provider integrations in backend services.
