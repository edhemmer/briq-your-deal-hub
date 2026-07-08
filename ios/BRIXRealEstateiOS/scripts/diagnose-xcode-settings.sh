#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_PATH="$ROOT_DIR/BRIXRealEstateiOS.xcodeproj"
SCHEME="BRIXRealEstateiOS"

echo "Working directory: $ROOT_DIR"
echo "Git commit:"
git -C "$ROOT_DIR/../.." log -1 --oneline || true
echo ""

echo "Project file bundle settings:"
grep -n "PRODUCT_BUNDLE_IDENTIFIER\|GENERATE_INFOPLIST_FILE\|INFOPLIST_FILE\|INFOPLIST_KEY_CFBundleIdentifier" "$PROJECT_PATH/project.pbxproj" || true
echo ""

echo "Xcode Release build settings for archive target:"
xcodebuild \
  -project "$PROJECT_PATH" \
  -scheme "$SCHEME" \
  -configuration Release \
  -showBuildSettings \
  | grep -E "TARGET_NAME|PRODUCT_NAME|FULL_PRODUCT_NAME|PRODUCT_BUNDLE_IDENTIFIER|GENERATE_INFOPLIST_FILE|INFOPLIST_FILE|INFOPLIST_KEY_CFBundleIdentifier|WRAPPER_EXTENSION|CONTENTS_FOLDER_PATH|INFOPLIST_PATH|EXECUTABLE_NAME|SKIP_INSTALL|INSTALL_PATH|SDKROOT|SUPPORTED_PLATFORMS"
echo ""

echo "Schemes:"
xcodebuild -list -project "$PROJECT_PATH"
