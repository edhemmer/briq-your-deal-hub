# BRIX iOS Manual Drop-In Assets

Use these files when Xcode or App Store Connect does not recognize generated asset catalogs automatically.

## App Store Connect Platform

If App Store Connect says this is a macOS app, the app record was likely created with the wrong platform or the Xcode target is configured for Mac/Catalyst.

- App Store Connect app platform must be `iOS`.
- Xcode target should support `iPhone` and `iPad`.
- Disable Mac/Catalyst destinations unless you intentionally want a macOS submission.
- Bundle ID: `BrixRE.BRIX-Real-Estate`.

App Store Connect platform cannot usually be changed after app creation. If the record was created as macOS, create a new iOS app record with the iOS bundle identifier.

## App Icons

Folder:

`AppIcon-iOS/`

Drag these PNGs into `Assets.xcassets > AppIcon` in Xcode. The filenames include the device, point size, scale, and final pixel size.

The 1024 icon is:

`AppIcon-iOS/AppIcon-AppStore-1024.png`

It is PNG, square, and has a filled background.

## Screenshots

Folder:

`AppStoreScreenshots/`

Included sizes:

- iPhone 6.9 inch: `1290 x 2796`
- iPhone 6.5 inch: `1242 x 2688`
- iPad 13 inch: `2064 x 2752`
- iPad 12.9 inch: `2048 x 2732`

These are correctly sized PNG files for manual upload. Replace them later with Simulator screenshots from the final signed build if Apple requests exact in-app captures.
