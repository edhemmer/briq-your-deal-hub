#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: bash scripts/inspect-archive.sh /path/to/BRIXRealEstateiOS.xcarchive"
  echo ""
  echo "Tip: In Xcode Organizer, right-click the archive and choose Show in Finder, then drag the .xcarchive onto Terminal."
  exit 1
fi

ARCHIVE_PATH="$1"
APP_PATH="$ARCHIVE_PATH/Products/Applications/BRIX Real Estate.app"
PLIST_PATH="$APP_PATH/Info.plist"
PROJECT_BUNDLE_ID="BrixRE.Brix-Real-Estate"

echo "Archive: $ARCHIVE_PATH"
echo "Expected app: $APP_PATH"
echo ""

if [[ ! -d "$ARCHIVE_PATH" ]]; then
  echo "ERROR: Archive path does not exist."
  exit 1
fi

echo "Applications in archive:"
find "$ARCHIVE_PATH/Products/Applications" -maxdepth 1 -type d -name "*.app" -print 2>/dev/null || true
echo ""

if [[ ! -d "$APP_PATH" ]]; then
  echo "ERROR: Expected app bundle was not found."
  echo "If the app name below is different, the archive is coming from a different target/product."
  exit 1
fi

if [[ ! -f "$PLIST_PATH" ]]; then
  echo "ERROR: App Info.plist is missing from the archived .app."
  exit 1
fi

echo "Archived app Info.plist keys:"
/usr/libexec/PlistBuddy -c "Print :CFBundleIdentifier" "$PLIST_PATH" || true
/usr/libexec/PlistBuddy -c "Print :CFBundleExecutable" "$PLIST_PATH" || true
/usr/libexec/PlistBuddy -c "Print :CFBundleName" "$PLIST_PATH" || true
/usr/libexec/PlistBuddy -c "Print :CFBundlePackageType" "$PLIST_PATH" || true
/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$PLIST_PATH" || true
/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$PLIST_PATH" || true
/usr/libexec/PlistBuddy -c "Print :UILaunchStoryboardName" "$PLIST_PATH" || true
echo ""

bundle_id="$(/usr/libexec/PlistBuddy -c "Print :CFBundleIdentifier" "$PLIST_PATH" 2>/dev/null || true)"
executable_name="$(/usr/libexec/PlistBuddy -c "Print :CFBundleExecutable" "$PLIST_PATH" 2>/dev/null || true)"
if [[ -z "$bundle_id" ]]; then
  echo "ERROR: The archived app Info.plist exists, but CFBundleIdentifier is empty or missing."
  exit 1
fi

if [[ -z "$executable_name" ]]; then
  echo "ERROR: The archived app Info.plist is missing CFBundleExecutable."
  exit 1
fi

if [[ ! -f "$APP_PATH/$executable_name" ]]; then
  echo "ERROR: The archived app does not contain the executable '$executable_name'."
  echo "This is the condition App Store reports as ITMS-90207."
  exit 1
fi

if [[ ! -x "$APP_PATH/$executable_name" ]]; then
  echo "ERROR: The archived executable exists but is not marked executable: $APP_PATH/$executable_name"
  exit 1
fi

if [[ "$bundle_id" != "$PROJECT_BUNDLE_ID" ]]; then
  echo "ERROR: Archived bundle id is '$bundle_id', expected '$PROJECT_BUNDLE_ID'."
  echo "This means Xcode archived a different target/settings set than the checked-in BRIXRealEstateiOS target."
  exit 1
fi

echo "Archive bundle identity and executable are correct."
