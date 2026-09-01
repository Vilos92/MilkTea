import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';

import {afterEach, describe, expect, test} from 'vitest';

/*
 * Constants.
 */

const APP_IMAGE_BYTES = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x41, 0x49]);
const ICON_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/*
 * Scratch.
 */

const tempDirs: string[] = [];

/*
 * Tests.
 */

afterEach(() => {
  for (const tempDir of tempDirs.splice(0)) {
    rmSync(tempDir, {force: true, recursive: true});
  }
});

describe('install-milktea.sh', () => {
  test('installs the AppImage after downloading its icon', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'milktea-installer-test.'));
    const releaseDir = join(tempDir, 'release');
    const fakeBinDir = join(tempDir, 'bin');
    const appDir = join(tempDir, 'Applications');
    const installerPath = resolve(import.meta.dirname, 'install-milktea.sh');
    tempDirs.push(tempDir);
    mkdirSync(releaseDir);
    mkdirSync(fakeBinDir);

    writeReleaseAsset(releaseDir, 'MilkTea-linux-x86_64.AppImage', APP_IMAGE_BYTES);
    writeReleaseAsset(releaseDir, 'MilkTea-linux-icon.png', ICON_BYTES);
    writeExecutable(
      fakeBinDir,
      'uname',
      `#!/bin/sh
case "\${1:-}" in
  -s) printf '%s\\n' Linux ;;
  -m) printf '%s\\n' x86_64 ;;
esac
`
    );
    writeExecutable(
      fakeBinDir,
      'curl',
      `#!/bin/sh
set -eu
output=''
url=''
while [ "$#" -gt 0 ]; do
  case "$1" in
    --output)
      output="$2"
      shift 2
      ;;
    *)
      url="$1"
      shift
      ;;
  esac
done
cp "$FIXTURE_DIR/\${url##*/}" "$output"
`
    );

    const result = spawnSync('/bin/sh', [installerPath, 'install'], {
      encoding: 'utf8',
      env: {
        ...process.env,
        FIXTURE_DIR: releaseDir,
        HOME: tempDir,
        MILKTEA_BIN_DIR: join(tempDir, 'user-bin'),
        MILKTEA_LINUX_APP_DIR: appDir,
        PATH: `${fakeBinDir}:${process.env.PATH ?? ''}`,
        XDG_DATA_HOME: join(tempDir, 'share')
      }
    });

    expect(result.status, result.stderr).toBe(0);
    expect(readFileSync(join(appDir, 'MilkTea.AppImage'))).toEqual(APP_IMAGE_BYTES);
    expect(readFileSync(join(tempDir, 'share/icons/hicolor/512x512/apps/MilkTea.png'))).toEqual(ICON_BYTES);
  });
});

/*
 * Helpers.
 */

function writeReleaseAsset(directory: string, name: string, content: Buffer): void {
  const digest = createHash('sha256').update(content).digest('hex');
  writeFileSync(join(directory, name), content);
  writeFileSync(join(directory, `${name}.sha256`), `${digest}  ${name}\n`);
}

function writeExecutable(directory: string, name: string, content: string): void {
  const path = join(directory, name);
  writeFileSync(path, content);
  chmodSync(path, 0o755);
}
