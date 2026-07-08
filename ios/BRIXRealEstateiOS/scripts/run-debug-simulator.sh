#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_PATH="$ROOT_DIR/BRIXRealEstateiOS.xcodeproj"
SCHEME="BRIXRealEstateiOS"
BUNDLE_ID="BrixRE.Brix-Real-Estate"
DERIVED_DATA="$ROOT_DIR/.build/DerivedData"
APP_PATH="$DERIVED_DATA/Build/Products/Debug-iphonesimulator/BRIX Real Estate.app"

echo "BRIX iOS debug launch"
echo "Project: $PROJECT_PATH"
echo "Bundle:  $BUNDLE_ID"
echo ""

booted_simulator="$(xcrun simctl list devices booted | awk -F '[()]' '/Booted/ { print $2; exit }')"

if [[ -z "${booted_simulator:-}" ]]; then
  echo "ERROR: No booted iOS Simulator found."
  echo "Open Xcode, start an iPhone simulator, then run this script again."
  exit 1
fi

echo "Booted simulator: $booted_simulator"
echo ""

echo "Cleaning project build folder..."
xcodebuild \
  -project "$PROJECT_PATH" \
  -scheme "$SCHEME" \
  -configuration Debug \
  -destination "id=$booted_simulator" \
  -derivedDataPath "$DERIVED_DATA" \
  clean

echo ""
echo "Building app for simulator..."
xcodebuild \
  -project "$PROJECT_PATH" \
  -scheme "$SCHEME" \
  -configuration Debug \
  -destination "id=$booted_simulator" \
  -derivedDataPath "$DERIVED_DATA" \
  build

if [[ ! -d "$APP_PATH" ]]; then
  echo "ERROR: Built app was not found at:"
  echo "$APP_PATH"
  find "$DERIVED_DATA/Build/Products" -maxdepth 3 -name "*.app" -print 2>/dev/null || true
  exit 1
fi

echo ""
echo "Built app Info.plist identity:"
/usr/libexec/PlistBuddy -c "Print :CFBundleIdentifier" "$APP_PATH/Info.plist" || true
/usr/libexec/PlistBuddy -c "Print :UILaunchStoryboardName" "$APP_PATH/Info.plist" || true

echo ""
echo "Removing stale installed app, if present..."
xcrun simctl uninstall "$booted_simulator" "$BUNDLE_ID" >/dev/null 2>&1 || true

echo "Installing fresh app..."
xcrun simctl install "$booted_simulator" "$APP_PATH"

echo ""
echo "Launching with console capture..."
echo "If the app crashes, copy the lines after this point."
xcrun simctl launch --console "$booted_simulator" "$BUNDLE_ID"
