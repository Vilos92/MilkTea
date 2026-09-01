#!/bin/sh
set -eu

APP_IMAGE="${1:-}"
STARTUP_SECONDS="${MILKTEA_SMOKE_STARTUP_SECONDS:-10}"
TEMP_DIR=''

main() {
  if [ "$#" -ne 1 ] || [ -z "$APP_IMAGE" ]; then
    fail 'Usage: smoke-appimage.sh <AppImage>'
  fi
  if [ ! -f "$APP_IMAGE" ]; then
    fail "AppImage not found: $APP_IMAGE"
  fi

  require_command od
  require_command timeout
  require_command unsquashfs
  require_command xvfb-run
  TEMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/milktea-appimage-smoke.XXXXXX")"

  # Extract the payload directly so the smoke test also works under cross-architecture Docker.
  section_header_offset="$(od -An -tu8 -j 40 -N 8 "$APP_IMAGE")"
  section_header_size="$(od -An -tu2 -j 58 -N 2 "$APP_IMAGE")"
  section_header_count="$(od -An -tu2 -j 60 -N 2 "$APP_IMAGE")"
  filesystem_offset="$((section_header_offset + section_header_size * section_header_count))"
  app_dir="$TEMP_DIR/AppDir"
  log_file="$TEMP_DIR/launch.log"
  unsquashfs -f -d "$app_dir" -offset "$filesystem_offset" "$APP_IMAGE"

  set +e
  WEBKIT_DISABLE_COMPOSITING_MODE=1 \
    timeout --kill-after=5s "${STARTUP_SECONDS}s" xvfb-run -a "$app_dir/AppRun" >"$log_file" 2>&1
  status="$?"
  set -e

  cat "$log_file"
  if [ "$status" -ne 124 ]; then
    fail "AppImage exited before the ${STARTUP_SECONDS}-second startup window (status $status)."
  fi

  printf 'AppImage remained running for %s seconds.\n' "$STARTUP_SECONDS"
}

cleanup() {
  if [ -n "$TEMP_DIR" ]; then
    rm -rf "$TEMP_DIR"
  fi
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Required command not found: $1"
}

fail() {
  printf 'MilkTea AppImage smoke test: %s\n' "$1" >&2
  exit 1
}

trap cleanup 0
trap 'exit 1' HUP INT TERM

main "$@"
