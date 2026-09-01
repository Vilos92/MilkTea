import {readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';

/*
 * Types.
 */

type PackageMetadata = {
  version: string;
};

/*
 * Constants.
 */

const repoRoot = join(import.meta.dir, '..');
const packagePath = join(repoRoot, 'package.json');
const cargoManifestPath = join(repoRoot, 'src-tauri', 'Cargo.toml');
const PACKAGE_VERSION_PATTERN = /(\[package\][\s\S]*?\nversion = ")[^"]+("\n)/;

/*
 * Script.
 */

const packageMetadata = JSON.parse(await readFile(packagePath, 'utf8')) as PackageMetadata;
const cargoManifest = await readFile(cargoManifestPath, 'utf8');

if (!PACKAGE_VERSION_PATTERN.test(cargoManifest)) {
  throw new Error('Could not find the desktop package version in src-tauri/Cargo.toml.');
}

const updatedCargoManifest = cargoManifest.replace(PACKAGE_VERSION_PATTERN, `$1${packageMetadata.version}$2`);
await writeFile(cargoManifestPath, updatedCargoManifest);

console.info(`Synchronized desktop package version ${packageMetadata.version}.`);
