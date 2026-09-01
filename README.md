# MilkTea

Visual music in the browser or a lightweight Tauri desktop app.

## Develop

Install dependencies once:

```sh
vp install
```

Run the standalone web app:

```sh
vp dev
```

Run the same frontend in Tauri:

```sh
bun run dev:desktop
```

Build the web app or macOS desktop bundle:

```sh
bun run build
bun run build:desktop
```

The desktop bundle is written under `src-tauri/target/release/bundle/`.

## Web and desktop behavior

MilkTea keeps its browser-first architecture. Tauri loads the production Vite build and does not replace browser APIs with desktop-only abstractions.

Settings continue to use `localStorage`. The desktop WebView persists that storage in its own application data, separate from the deployed website. A setting changed in one installation does not sync to the other.

File audio, microphone audio, rendering, and export remain frontend-owned. macOS receives the microphone usage description from `src-tauri/Info.plist`. System-audio screen capture is not offered in the macOS desktop app because Tauri uses WKWebView rather than Chromium; MilkTea's existing capability predicate already hides that unsupported source.

## Install and update desktop builds

The release installer chooses the matching macOS or Linux bundle, verifies its SHA-256 checksum, and installs it without `sudo`:

```sh
curl --proto '=https' --tlsv1.2 -fsSL https://github.com/Vilos92/MilkTea/releases/latest/download/install.sh | sh
```

Run the same command again to update. On macOS it installs `~/Applications/MilkTea.app`. On Linux it installs `~/Applications/MilkTea.AppImage`, `~/.local/bin/milktea`, and an XDG desktop entry.

Uninstall the managed app and desktop integration while preserving saved settings:

```sh
curl --proto '=https' --tlsv1.2 -fsSL https://github.com/Vilos92/MilkTea/releases/latest/download/install.sh | sh -s -- uninstall
```

Releases currently include macOS Apple Silicon, macOS Intel, Linux x86_64 AppImage, and Linux x86_64 Debian packages. Linux ARM64, Windows, Homebrew, and Tauri's in-app updater are not available yet.

## Publish a desktop release

Prepare releases only from a clean local `main` that exactly matches `origin/main`:

```sh
bun run release -- patch
git push origin main --follow-tags
```

Use `minor` for the first release to advance the unreleased `0.0.0` package to `0.1.0`. After that, use `patch`, `minor`, or `major` according to the compatibility change.

The release command runs the project checks, synchronizes `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/Cargo.lock`, creates a `:bookmark:` release commit, and creates the matching `vX.Y.Z` tag. It does not push. Inspect the commit and tag before the explicit push.

Woodpecker handles tagged releases in four gated workflows:

1. `release-create` validates that the tag version matches every package version and that the tagged commit belongs to `origin/main`. It creates a draft GitHub release.
2. `release-linux` builds x86_64 AppImage and Debian bundles in the pinned Linux container.
3. `release-macos` builds Apple Silicon and Intel DMGs on the Mac mini.
4. `release-publish` checks every required asset and checksum, then publishes the draft.

A platform failure leaves the GitHub release as a draft. Rerun the failed Woodpecker workflow after fixing the runner. Asset uploads use stable names and `--clobber`, so a retry replaces incomplete files.

The Woodpecker repository needs a `github_release_token` secret with GitHub **Contents: read and write** access to `Vilos92/MilkTea`. Woodpecker must allow that secret for tag events. Do not expose it to pull request workflows.

The Mac mini runs a separate Woodpecker Local-backend agent with one concurrent workflow and the mandatory `release=milktea` label. Its managed files are:

- `~/Library/LaunchAgents/com.greg.woodpecker-release-agent.plist`
- `~/.local/bin/woodpecker-release-agent`
- `~/.local/bin/woodpecker-agent`
- `~/.local/bin/plugin-git`

The launcher reads only `WOODPECKER_AGENT_SECRET` from `greg-zone/.env`. The Woodpecker server exposes gRPC only on `127.0.0.1:9000`. Linux bundles use the local `greg-zone/milktea-tauri-linux:1.95.0-bun1.4.0` image, built from `greg-zone/ci/milktea-tauri-linux/Dockerfile`.

The macOS builds use an ad-hoc signature. This satisfies Apple Silicon's requirement that downloaded code have a signature, but it is not Apple Developer ID signing or notarization. macOS can still block the first launch. After attempting to open MilkTea, approve it under **System Settings > Privacy & Security > Open Anyway**. A seamless first launch for public downloads requires the paid Apple Developer Program, Developer ID signing, and notarization. It does not require the Mac App Store.
