# BRIX iOS Native Project Audit

Last checked in repo: `ios/BRIXRealEstateiOS`

## Open This Project

Open:

```bash
ios/BRIXRealEstateiOS/BRIXRealEstateiOS.xcodeproj
```

Do not create a new Xcode project and do not open a generated `ContentView` app shell. This repo does not contain `ContentView.swift` or `Hello World` code.

## Native App Evidence

- App entry point: `BRIXRealEstateiOS/BRIXRealEstateiOSApp.swift`
- Root shell: `BRIXRealEstateiOS/AppView.swift`
- Shared state: `BRIXRealEstateiOS/AppState.swift`
- Supabase REST/Auth/Storage client: `BRIXRealEstateiOS/Services.swift`
- Native screens:
  - `TodayDecisionView.swift`
  - `FindIQView.swift`
  - `DealIQCockpitView.swift`
  - `PipelineIQView.swift`
  - `OfferIQView.swift`
  - `FieldInvestorView.swift`
  - `PortfolioOSView.swift`
  - `AccountView.swift`

## Target Configuration

- Bundle ID: `BrixRE.Brix-Real-Estate`
- Platforms: `iphoneos iphonesimulator`
- Targeted devices: iPhone and iPad
- Mac Catalyst: disabled
- Minimum iOS: 17.0
- App icon source: `Assets.xcassets/AppIcon.appiconset`
- Privacy manifest: `PrivacyInfo.xcprivacy`
- Entitlement: Sign in with Apple

## Backend Connections

- Supabase URL is emitted into the generated archive plist from `INFOPLIST_KEY_BRIX_SUPABASE_URL`.
- Supabase publishable key is emitted into the generated archive plist from `INFOPLIST_KEY_BRIX_SUPABASE_PUBLISHABLE_KEY`.
- Email sign-in uses `/auth/v1/token?grant_type=password`.
- Sign-up uses `/auth/v1/signup`.
- Password recovery uses `/auth/v1/recover`.
- Listing extraction uses `/functions/v1/extract-deal-from-text`.
- Field uploads use Supabase Storage and `/functions/v1/field-capture`.

## Mac Verification

From the repo root on Mac:

```bash
cd ios/BRIXRealEstateiOS
bash scripts/verify-ios-project.sh
```

This confirms the Xcode project exists, the real BRIX Swift files are target members, no template `Hello World` app is present, and the project builds for iOS Simulator.
