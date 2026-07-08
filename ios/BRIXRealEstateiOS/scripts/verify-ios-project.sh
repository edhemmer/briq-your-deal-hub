#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_PATH="$ROOT_DIR/BRIXRealEstateiOS.xcodeproj"
SCHEME="BRIXRealEstateiOS"

echo "BRIX iOS project: $PROJECT_PATH"

if [[ ! -d "$PROJECT_PATH" ]]; then
  echo "ERROR: BRIXRealEstateiOS.xcodeproj was not found."
  echo "Open or clone the repo root, then run this from ios/BRIXRealEstateiOS/scripts."
  exit 1
fi

echo ""
echo "Checking schemes..."
xcodebuild -list -project "$PROJECT_PATH"

echo ""
echo "Checking Swift source target membership..."
swift_count=$(find "$ROOT_DIR/BRIXRealEstateiOS" -maxdepth 1 -name "*.swift" | wc -l | tr -d ' ')
sources_count=$(grep -c "\.swift in Sources" "$PROJECT_PATH/project.pbxproj" || true)
echo "Swift files on disk: $swift_count"
echo "Swift source references in project file: $sources_count"

if [[ "$swift_count" -lt 10 ]]; then
  echo "ERROR: Too few Swift files. You are not in the checked-in BRIX native app."
  exit 1
fi

if ! grep -q "BRIXRealEstateiOSApp.swift in Sources" "$PROJECT_PATH/project.pbxproj"; then
  echo "ERROR: The real BRIX app entry point is not in target sources."
  exit 1
fi

if grep -R "Hello World\|ContentView" "$ROOT_DIR/BRIXRealEstateiOS" >/dev/null 2>&1; then
  echo "ERROR: Template app content found. You may be opening a generated shell project."
  exit 1
fi

echo ""
echo "Checking archive bundle identity settings..."
if ! grep -q "GENERATE_INFOPLIST_FILE = YES;" "$PROJECT_PATH/project.pbxproj"; then
  echo "ERROR: Target should generate the archive Info.plist so Xcode writes the bundle id into the final app."
  exit 1
fi

if ! grep -q 'PRODUCT_BUNDLE_IDENTIFIER = "BrixRE.BRIX-Real-Estate";' "$PROJECT_PATH/project.pbxproj"; then
  echo "ERROR: Project bundle id does not match the Apple registered id BrixRE.BRIX-Real-Estate."
  exit 1
fi

if ! grep -q "INFOPLIST_KEY_CFBundleDisplayName" "$PROJECT_PATH/project.pbxproj"; then
  echo "ERROR: Generated Info.plist display/privacy keys are missing from build settings."
  exit 1
fi

echo ""
echo "Building for iOS Simulator..."
xcodebuild \
  -project "$PROJECT_PATH" \
  -scheme "$SCHEME" \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  build

echo ""
echo "BRIX iOS project verified."
