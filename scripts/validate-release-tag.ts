import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

import {runGit} from './run-git';

/*
 * Types.
 */

type PackageMetadata = {
  version: string;
};

/*
 * Constants.
 */

const ORIGIN_MAIN = 'origin/main';
const SEMANTIC_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const CARGO_PACKAGE_VERSION_PATTERN = /\[package\][\s\S]*?\nversion = "([^"]+)"\n/;
const CARGO_LOCK_PACKAGE_PATTERN = /\[\[package\]\]\nname = "milktea"\nversion = "([^"]+)"\n/;
const repoRoot = join(import.meta.dir, '..');

/*
 * Script.
 */

const tag = process.env.CI_COMMIT_TAG;
const commit = process.env.CI_COMMIT_SHA;
if (!tag || !commit) {
  throw new Error('CI_COMMIT_TAG and CI_COMMIT_SHA are required for a release build.');
}

const packageMetadata = JSON.parse(await readFile(join(repoRoot, 'package.json'), 'utf8')) as PackageMetadata;
const cargoManifest = await readFile(join(repoRoot, 'src-tauri', 'Cargo.toml'), 'utf8');
const cargoLock = await readFile(join(repoRoot, 'src-tauri', 'Cargo.lock'), 'utf8');
const cargoVersion = matchVersion(cargoManifest, CARGO_PACKAGE_VERSION_PATTERN, 'Cargo.toml');
const cargoLockVersion = matchVersion(cargoLock, CARGO_LOCK_PACKAGE_PATTERN, 'Cargo.lock');
const version = packageMetadata.version;

if (!SEMANTIC_VERSION_PATTERN.test(version)) {
  throw new Error(`package.json has a non-release version: ${version}`);
}

const expectedTag = `v${version}`;
if (tag !== expectedTag) {
  throw new Error(`Release tag ${tag} does not match package version ${expectedTag}.`);
}

if (cargoVersion !== version || cargoLockVersion !== version) {
  throw new Error(
    `Release versions differ: package.json=${version}, Cargo.toml=${cargoVersion}, Cargo.lock=${cargoLockVersion}.`
  );
}

runGit(['fetch', '--quiet', 'origin', 'main']);
const ancestryCheck = Bun.spawnSync({
  cmd: ['git', 'merge-base', '--is-ancestor', commit, ORIGIN_MAIN],
  cwd: repoRoot,
  stderr: 'pipe',
  stdout: 'pipe'
});
if (ancestryCheck.exitCode !== 0) {
  throw new Error(`Release commit ${commit} is not contained in ${ORIGIN_MAIN}.`);
}

console.info(`Release ${tag} verified at ${commit.slice(0, 12)}.`);

/*
 * Helpers.
 */

function matchVersion(contents: string, pattern: RegExp, filename: string): string {
  const version = contents.match(pattern)?.[1];
  if (!version) {
    throw new Error(`Could not find the MilkTea package version in ${filename}.`);
  }

  return version;
}
