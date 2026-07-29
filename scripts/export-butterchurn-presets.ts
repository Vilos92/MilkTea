/**
 * Reads presets from `butterchurn-presets` and writes each to
 * `public/butterchurn/presets/<index>.json` so that each file is indexed by the same
 * index as the preset keys array. Served as static assets.
 *
 * Skips if manifest already exists with matching package version and all preset files.
 */
import {existsSync, mkdirSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {join} from 'node:path';

import ora from 'ora';

/*
 * Types.
 */

type Manifest = {version: string; keys: string[]};

/*
 * Helpers.
 */

/** Dim text for paths / secondary info (ANSI). */
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

/*
 * Script.
 */

async function script() {
  const repoRoot = join(import.meta.dir, '..');
  const outDir = join(repoRoot, 'public', 'butterchurn', 'presets');
  const packagePath = join(repoRoot, 'node_modules', 'butterchurn-presets', 'package.json');

  const checkSpinner = ora({text: 'Checking presets...', color: 'cyan'}).start();

  const pkg = JSON.parse(readFileSync(packagePath, 'utf8')) as {version: string};
  const currentVersion = pkg.version;

  const manifestPath = join(outDir, 'manifest.json');
  if (existsSync(manifestPath)) {
    const existing = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;
    if (existing.version === currentVersion && Array.isArray(existing.keys)) {
      const presetCount = existing.keys.length;
      let hasAllPresets = presetCount > 0;
      for (let i = 0; i < presetCount; i++) {
        if (!existsSync(join(outDir, `${i}.json`))) {
          hasAllPresets = false;
          break;
        }
      }
      if (hasAllPresets) {
        checkSpinner.succeed(`Presets up to date (v${currentVersion}), skipping export 🧈`);
        console.info(dim(outDir));
        return;
      }
    }
  }

  checkSpinner.text = 'Loading presets from butterchurn-presets...';

  const require = createRequire(import.meta.url);
  const butterchurnPresets = require('butterchurn-presets') as {
    getPresets: () => Record<string, unknown>;
  };

  const presets = butterchurnPresets.getPresets();
  const keys = Object.keys(presets);

  checkSpinner.succeed(`Loaded ${keys.length} presets (v${currentVersion}) 🧈`);

  mkdirSync(outDir, {recursive: true});

  const writeSpinner = ora({text: 'Writing preset files...', color: 'cyan'}).start();

  for (let i = 0; i < keys.length; i++) {
    const filePath = join(outDir, `${i}.json`);
    await Bun.write(filePath, JSON.stringify(presets[keys[i]]));
    if ((i + 1) % 25 === 0 || i === keys.length - 1) {
      writeSpinner.text = `Writing preset files... ${i + 1}/${keys.length}`;
    }
  }

  const manifest: Manifest = {version: currentVersion, keys};
  await Bun.write(manifestPath, JSON.stringify(manifest, null, 2));

  writeSpinner.succeed(`Wrote ${keys.length} presets 🧈`);
  console.info(dim(outDir));
}

await script();
