#!/bin/sh
set -eu

# Recompiles src-tauri/icons/Assets.car from the Icon Composer bundle
# src-tauri/icons/icon.icon. Run this after editing the icon design, then
# commit the regenerated Assets.car.
#
# Requires full Xcode (actool is not part of the Command Line Tools).
# The catalog is only read by macOS 26+; older macOS uses icon.icns, so the
# deployment target below intentionally trims pre-26 variants from the output.

MIN_TARGET='26.0'
ICON_NAME='icon'

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
icons_dir="$repo_root/src-tauri/icons"
temp_dir="$(mktemp -d "${TMPDIR:-/tmp}/milktea-liquid-icon.XXXXXX")"
trap 'rm -rf "$temp_dir"' EXIT

if [ -d /Applications/Xcode.app ]; then
  export DEVELOPER_DIR='/Applications/Xcode.app/Contents/Developer'
fi
if ! xcrun --find actool >/dev/null 2>&1; then
  echo 'actool not found: install full Xcode (Command Line Tools are not enough)' >&2
  exit 1
fi

# Compile into a temp dir: actool also emits a generated icon.icns, which must
# not overwrite the hand-made one in src-tauri/icons.
xcrun actool "$icons_dir/$ICON_NAME.icon" --compile "$temp_dir" \
  --output-format human-readable-text --notices --warnings --errors \
  --output-partial-info-plist "$temp_dir/partial.plist" \
  --app-icon "$ICON_NAME" \
  --enable-on-demand-resources NO \
  --target-device mac \
  --minimum-deployment-target "$MIN_TARGET" \
  --platform macosx

cp "$temp_dir/Assets.car" "$icons_dir/Assets.car"
echo "Updated $icons_dir/Assets.car"
