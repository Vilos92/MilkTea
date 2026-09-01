# MilkTea

<p align="center">
  <img src="public/milktea-icon.png" alt="MilkTea" width="256" height="256" />
</p>

MilkDrop music visualizations in the browser or a lightweight Tauri desktop app, powered by [Butterchurn](https://github.com/jberg/butterchurn).

## Quick start

Use MilkTea immediately at [milktea.ink](https://milktea.ink).

To install the desktop app on macOS or Linux:

```sh
curl --proto '=https' --tlsv1.2 -fsSL https://github.com/Vilos92/MilkTea/releases/latest/download/install.sh | sh
```

The installer detects the operating system and architecture, verifies the release checksum, and installs without `sudo`. Run the same command again to update.

- macOS: `~/Applications/MilkTea.app`
- Linux: `~/Applications/MilkTea.AppImage`, `~/.local/bin/MilkTea`, and an XDG desktop entry

Available releases support macOS on Apple Silicon and Intel, plus Linux x86_64 as AppImage and Debian packages. Linux ARM64, Windows, Homebrew, and automatic in-app updates are not available yet.

> [!NOTE]
> macOS builds are ad-hoc signed, not Apple-notarized. If macOS blocks the first launch, try opening MilkTea once, then approve it under **System Settings → Privacy & Security → Open Anyway**.

### Uninstall

Remove the managed desktop app while preserving saved settings:

```sh
curl --proto '=https' --tlsv1.2 -fsSL https://github.com/Vilos92/MilkTea/releases/latest/download/install.sh | sh -s -- uninstall
```

## Keyboard shortcuts

| Shortcut                            | Action                             |
| ----------------------------------- | ---------------------------------- |
| `?`                                 | Open help                          |
| `←`, `A`, or `H`                    | Previous preset                    |
| `→`, `D`, or `L`                    | Next preset                        |
| `;`                                 | Stage and launch preset            |
| `Space`                             | Pause or play file audio           |
| `F`                                 | Toggle fullscreen                  |
| `R`                                 | Start or stop recording file audio |
| `⌘K` on macOS or `Ctrl+K` elsewhere | Open the command palette           |

## Develop

Clone the repository and install its dependencies:

```sh
git clone https://github.com/Vilos92/MilkTea.git
cd MilkTea
bun install
```

Run the web app:

```sh
bun run dev
```

Run the same frontend in Tauri:

```sh
bun run dev:desktop
```

Build the web app or a desktop bundle:

```sh
bun run build
bun run build:desktop
```

Desktop bundles are written under `src-tauri/target/release/bundle/`.

## Runtime behavior

MilkTea keeps its browser-first architecture. Tauri loads the production Vite build and does not replace browser APIs with desktop-only abstractions.

Settings use `localStorage`. The desktop WebView persists that storage in its own application data, separate from the deployed website. Settings do not sync between installations.

File audio, microphone audio, rendering, and export remain frontend-owned. macOS receives the microphone usage description from `src-tauri/Info.plist`. System-audio screen capture is unavailable in the macOS desktop app because Tauri uses WKWebView rather than Chromium; MilkTea hides that unsupported source.

## Maintainer release process

Prepare releases only from a clean local `main` that exactly matches `origin/main`:

```sh
bun run release -- patch
git push origin main --follow-tags
```

Choose `patch`, `minor`, or `major` according to the compatibility change.

The release command runs project checks, synchronizes `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/Cargo.lock`, creates a `:bookmark:` release commit, and creates the matching `vX.Y.Z` tag. It does not push. Inspect the commit and tag before the explicit push.

### Woodpecker release flow

Woodpecker handles tagged releases in four gated workflows:

1. `release-create` validates that the tag version matches every package version and that the tagged commit belongs to `origin/main`. It creates a draft GitHub release.
2. `release-linux` builds x86_64 AppImage and Debian bundles in the pinned Linux container.
3. `release-macos` builds Apple Silicon and Intel DMGs on the Mac mini.
4. `release-publish` checks every required asset and checksum, then publishes the draft.

Budget about 20 minutes for a cold release. The one-concurrency Mac mini runs the Linux and macOS workflows serially; the two macOS architectures take most of that time.

A platform failure leaves the GitHub release as a draft. Woodpecker can restart only the whole pipeline, not one workflow or step. Restart the pipeline for a transient runner failure. Asset uploads use stable names and `--clobber`, so the retry replaces incomplete files.

If both platform workflows uploaded every asset and only `release-publish` failed, replay only its idempotent publisher from a checked-out fix:

```sh
GITHUB_TOKEN="$(gh auth token)" CI_COMMIT_TAG=vX.Y.Z bun run scripts/publish-release.ts
```

The script verifies every required asset and checksum before publishing. Never move a published tag. Issue a patch release instead.

The Woodpecker repository needs a `github_release_token` secret with GitHub **Contents: read and write** access to `Vilos92/MilkTea`. Woodpecker must allow that secret for tag events. Do not expose it to pull request workflows.

Keep the GitHub repository public. The quick-start installer downloads release assets without authentication for both installs and updates.

### Release runner

The Mac mini runs a separate Woodpecker Local-backend agent with one concurrent workflow and the mandatory `release=milktea` label. Its managed files are:

- `~/Library/LaunchAgents/com.greg.woodpecker-release-agent.plist`
- `~/.local/bin/woodpecker-release-agent`
- `~/.local/bin/woodpecker-agent`
- `~/.local/bin/plugin-git`

The launcher reads only `WOODPECKER_AGENT_SECRET` from `greg-zone/.env`. The Woodpecker server exposes gRPC only on `127.0.0.1:9000`. Linux bundles use the local `greg-zone/milktea-tauri-linux:1.95.0-bun1.4.0` image, built from `greg-zone/ci/milktea-tauri-linux/Dockerfile`.

## License

MilkTea is available under the [MIT License](LICENSE). Copyright © 2026 Greg Linscheid.
