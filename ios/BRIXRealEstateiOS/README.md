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

## Current App Slice

This starter implements:

- `TodayDecisionView`: recommendation, trust, readiness, confidence, next actions, Mentor Mode
- `FieldInvestorView`: photos/video/scan/voice capture entry points, offline queue, Visual Scope Builder findings
- `DigitalTwinView`: property source-of-truth summary and timeline
- `StrategyLabView`: strategy comparison cards
- `ProjectOSView`: execution tasks and priority flags
- `PortfolioOSView`: portfolio impact and exposure view
- `BRIXAPIClient`: API boundary stub so backend services remain authoritative

## Xcode Setup

Create a new Xcode iOS App project named `BRIXRealEstateiOS`, then add the Swift files from `BRIXRealEstateiOS/` to the app target.

Recommended settings:

- Interface: SwiftUI
- Language: Swift
- Minimum iOS: 17.0
- Bundle ID: `com.brix.realestate.ios`
- Add the `Sign in with Apple` capability.
- Use `BRIXRealEstateiOS.entitlements`.
- Include `Info.plist` and `PrivacyInfo.xcprivacy` in the app target.

The source uses SwiftUI Observation (`@Observable`), so iOS 17+ is recommended for this first native build.

## Privacy and App Store Compliance

See `APP_STORE_COMPLIANCE.md`.
