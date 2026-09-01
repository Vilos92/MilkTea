#!/bin/sh
set -eu

REPOSITORY='Vilos92/MilkTea'
RELEASE_BASE_URL="${MILKTEA_RELEASE_BASE_URL:-https://github.com/$REPOSITORY/releases/latest/download}"
TEMP_DIR=''
MOUNT_POINT=''

main() {
  action="${1:-install}"
  if [ "$#" -gt 1 ]; then
    fail 'Usage: install-milktea.sh [install|update|uninstall]'
  fi

  case "$action" in
    install | update)
      install_latest
      ;;
    uninstall)
      uninstall
      ;;
    *)
      fail 'Usage: install-milktea.sh [install|update|uninstall]'
      ;;
  esac
}

install_latest() {
  require_command curl
  TEMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/milktea-install.XXXXXX")"

  case "$(uname -s)" in
    Darwin)
      install_macos
      ;;
    Linux)
      install_linux
      ;;
    *)
      fail 'MilkTea supports this installer on macOS and Linux.'
      ;;
  esac
}

install_macos() {
  require_command codesign
  require_command ditto
  require_command hdiutil
  require_command shasum

  case "$(uname -m)" in
    arm64 | aarch64)
      asset='MilkTea-macos-aarch64.dmg'
      ;;
    x86_64)
      asset='MilkTea-macos-x86_64.dmg'
      ;;
    *)
      fail "Unsupported macOS architecture: $(uname -m)"
      ;;
  esac

  download_verified "$asset" shasum

  app_dir="${MILKTEA_MACOS_APP_DIR:-$HOME/Applications}"
  target="$app_dir/MilkTea.app"
  staged="$app_dir/.MilkTea.app.new.$$"
  backup="$app_dir/.MilkTea.app.backup.$$"
  MOUNT_POINT="$TEMP_DIR/mount"

  mkdir -p "$MOUNT_POINT" "$app_dir"
  hdiutil attach -nobrowse -readonly -mountpoint "$MOUNT_POINT" "$TEMP_DIR/$asset" >/dev/null

  [ -d "$MOUNT_POINT/MilkTea.app" ] || fail 'The MilkTea application is missing from the downloaded DMG.'

  rm -rf "$staged" "$backup"
  ditto "$MOUNT_POINT/MilkTea.app" "$staged"
  codesign --verify --deep --strict "$staged"

  if [ -e "$target" ]; then
    mv "$target" "$backup"
  fi

  if mv "$staged" "$target"; then
    rm -rf "$backup"
  else
    [ ! -e "$backup" ] || mv "$backup" "$target"
    fail 'Could not replace the existing MilkTea application.'
  fi

  printf 'Installed MilkTea at %s\n' "$target"
}

install_linux() {
  require_command install
  require_command sha256sum

  case "$(uname -m)" in
    x86_64 | amd64)
      asset='MilkTea-linux-x86_64.AppImage'
      ;;
    arm64 | aarch64)
      fail 'MilkTea does not publish a Linux ARM64 build yet.'
      ;;
    *)
      fail "Unsupported Linux architecture: $(uname -m)"
      ;;
  esac

  icon_asset='MilkTea-linux-icon.png'
  download_verified "$asset" sha256sum
  download_verified "$icon_asset" sha256sum

  app_dir="${MILKTEA_LINUX_APP_DIR:-$HOME/Applications}"
  data_home="${XDG_DATA_HOME:-$HOME/.local/share}"
  bin_dir="${MILKTEA_BIN_DIR:-$HOME/.local/bin}"
  target="$app_dir/MilkTea.AppImage"
  staged="$app_dir/.MilkTea.AppImage.new.$$"
  icon_dir="$data_home/icons/hicolor/512x512/apps"
  desktop_dir="$data_home/applications"
  desktop_file="$desktop_dir/MilkTea.desktop"

  mkdir -p "$app_dir" "$bin_dir" "$desktop_dir" "$icon_dir"
  install -m 0755 "$TEMP_DIR/$asset" "$staged"
  mv "$staged" "$target"
  install -m 0644 "$TEMP_DIR/$icon_asset" "$icon_dir/MilkTea.png"
  ln -sfn "$target" "$bin_dir/MilkTea"

  cat >"$desktop_file" <<EOF
[Desktop Entry]
Type=Application
Name=MilkTea
Comment=Visual music in a lightweight desktop app
Exec="$target"
Icon=$icon_dir/MilkTea.png
Terminal=false
Categories=AudioVideo;Audio;
X-MilkTea-Installer=github-release
EOF

  if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$desktop_dir" >/dev/null 2>&1 || true
  fi

  printf 'Installed MilkTea at %s\n' "$target"
  if ! command -v fusermount >/dev/null 2>&1 && ! command -v fusermount3 >/dev/null 2>&1; then
    printf '%s\n' 'AppImage requires FUSE. On Ubuntu, install libfuse2 (22.04) or libfuse2t64 (24.04).'
  fi
}

# Keep each download's working variables inside the helper invocation.
download_verified() (
  asset="$1"
  checksum_command="$2"
  checksum="$asset.sha256"

  curl --proto '=https' --tlsv1.2 --fail --silent --show-error --location \
    --output "$TEMP_DIR/$asset" "$RELEASE_BASE_URL/$asset"
  curl --proto '=https' --tlsv1.2 --fail --silent --show-error --location \
    --output "$TEMP_DIR/$checksum" "$RELEASE_BASE_URL/$checksum"

  if [ "$checksum_command" = 'shasum' ]; then
    (cd "$TEMP_DIR" && shasum -a 256 -c "$checksum")
  else
    (cd "$TEMP_DIR" && sha256sum -c "$checksum")
  fi
)

uninstall() {
  case "$(uname -s)" in
    Darwin)
      app_dir="${MILKTEA_MACOS_APP_DIR:-$HOME/Applications}"
      rm -rf "$app_dir/MilkTea.app"
      ;;
    Linux)
      app_dir="${MILKTEA_LINUX_APP_DIR:-$HOME/Applications}"
      data_home="${XDG_DATA_HOME:-$HOME/.local/share}"
      bin_dir="${MILKTEA_BIN_DIR:-$HOME/.local/bin}"
      rm -f "$app_dir/MilkTea.AppImage"
      rm -f "$bin_dir/MilkTea"
      rm -f "$data_home/applications/MilkTea.desktop"
      rm -f "$data_home/icons/hicolor/512x512/apps/MilkTea.png"
      ;;
    *)
      fail 'MilkTea supports this uninstaller on macOS and Linux.'
      ;;
  esac

  printf '%s\n' 'Uninstalled MilkTea. Saved settings were preserved.'
}

cleanup() {
  if [ -n "$MOUNT_POINT" ]; then
    hdiutil detach "$MOUNT_POINT" >/dev/null 2>&1 || true
  fi
  if [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ]; then
    rm -rf "$TEMP_DIR"
  fi
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Required command not found: $1"
}

fail() {
  printf 'MilkTea installer: %s\n' "$1" >&2
  exit 1
}

trap cleanup 0
trap 'exit 1' HUP INT TERM

main "$@"
