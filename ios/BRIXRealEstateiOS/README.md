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

- `TodayDecisionView`: live mobile Deal Dashboard from BRIX deal records
- `DigitalTwinView`: FindIQ search across signed-in user deal records
- `StrategyLabView`: DealIQ mobile review for selected deal files and backend recommendation snapshots
- `FieldInvestorView`: camera/photo capture, upload queue, and backend field-capture submission
- `PortfolioOSView`: portfolio metrics rendered from BRIX backend state when assets exist
- `AccountView`: Sign in with Apple, privacy disclosures, sign out, and account deletion request flow
- `BRIXAPIClient`: URLSession boundary to Supabase Auth, REST, Storage, and Edge Functions

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
4. If Xcode does not list it from GitHub search, use the pasted URL directly. The repo is private and its GitHub name is `briq-your-deal-hub`, not `BRIX`.
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
- Add the `Sign in with Apple` capability.
- Use `BRIXRealEstateiOS.entitlements`.
- Include `Info.plist` and `PrivacyInfo.xcprivacy` in the app target.
- Include `Assets.xcassets` in the app target and set the app icon source to `AppIcon`.
- Confirm `BRIX_SUPABASE_URL` and `BRIX_SUPABASE_PUBLISHABLE_KEY` in `Info.plist` point at the production Supabase project.

The source uses SwiftUI Observation (`@Observable`), so iOS 17+ is recommended for this first native build.

## Privacy and App Store Compliance

See `APP_STORE_COMPLIANCE.md`.
