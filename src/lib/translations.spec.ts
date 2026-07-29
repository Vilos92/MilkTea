import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join} from 'node:path';

import {describe, expect, test} from 'vitest';

import {Locale} from './locale';
import {ENGLISH_TRANSLATIONS} from './translations';

/*
 * Constants.
 */

const TRANSLATION_KEYS = new Set(Object.keys(ENGLISH_TRANSLATIONS));

/** Match t('key') and capture the translation key. */
const T_CALL_REGEX = /t\s*\(\s*'([^']+)'\s*\)/g;

/** Match `return 'key'` to capture translations returned by functions. */
const RETURN_TRANSLATION_KEY_REGEX = /return\s+'([^']+)'/g;

/*
 * Types.
 */

// Loose type for parsed translation JSON. We don't use a runtime schema. The tests assert each
// locale file is valid by running `validateTranslations()`.
type Translations = Record<string, string>;

type ValidationResult = {ok: true} | {ok: false; errors: string[]};

/*
 * Tests.
 */

describe('translations', () => {
  test('validateTranslations succeeds with english translations', () => {
    const result = validateTranslations(ENGLISH_TRANSLATIONS);
    expect(result.ok).toBe(true);
  });

  test('validateTranslations fails when a valid key is missing', () => {
    const fake = {...ENGLISH_TRANSLATIONS};
    delete (fake as Record<string, string>)['common.close'];

    const result = validateTranslations(fake as Translations);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("missing key: 'common.close'");
    }
  });

  test('validateTranslations fails when there is an extra key', () => {
    const fake = {...ENGLISH_TRANSLATIONS, 'fake.extra': 'x'};

    const result = validateTranslations(fake as Translations);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("extra key: 'fake.extra'");
    }
  });

  test('every locale JSON file has exact same keys as ENGLISH_TRANSLATIONS and string values', async () => {
    const repoRoot = join(import.meta.dirname, '..', '..');
    const translationsDir = join(repoRoot, 'public', 'translations');

    const localesWithJson = (Object.values(Locale) as string[]).filter(l => l !== 'en');
    const failures: string[] = [];

    for (const locale of localesWithJson) {
      const path = join(translationsDir, `${locale}.json`);
      const data = JSON.parse(readFileSync(path, 'utf-8')) as Translations;
      const result = validateTranslations(data);
      if (!result.ok) {
        failures.push(`${locale}: ${result.errors.join('; ')}`);
      }
    }

    expect(failures).toEqual([]);
  });

  test('every translation key is used at least once in app source', () => {
    const srcDir = join(import.meta.dirname, '..');
    const usedKeys = collectUsedTranslationKeys(srcDir);
    const unused = [...TRANSLATION_KEYS].filter(k => !usedKeys.has(k));
    expect(unused).toEqual([]);
  });
});

/*
 * Helpers.
 */

function validateTranslations(translations: Translations): ValidationResult {
  const errors: string[] = [];
  const actualKeys = new Set(Object.keys(translations));

  for (const key of TRANSLATION_KEYS) {
    if (!actualKeys.has(key)) {
      errors.push(`missing key: '${key}'`);
    }
  }
  for (const key of actualKeys) {
    if (!TRANSLATION_KEYS.has(key)) {
      errors.push(`extra key: '${key}'`);
    }
  }
  for (const [key, value] of Object.entries(translations)) {
    if (typeof value !== 'string') {
      errors.push(`non-string value for key: '${key}'`);
    }
  }

  if (errors.length > 0) {
    return {ok: false, errors};
  }
  return {ok: true};
}

/** Recursively list .ts/.tsx files under dir. Excludes test and story files. */
function listSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      files.push(...listSourceFiles(path));
      continue;
    }

    if (
      (name.endsWith('.ts') || name.endsWith('.tsx')) &&
      !name.endsWith('.spec.ts') &&
      !name.endsWith('.test.ts') &&
      !name.endsWith('.stories.tsx')
    ) {
      files.push(path);
    }
  }
  return files;
}

function collectUsedTranslationKeys(srcDir: string): Set<string> {
  const translationKeys = new Set<string>();
  const files = listSourceFiles(srcDir);
  for (const filePath of files) {
    const content = readFileSync(filePath, 'utf-8');
    for (const match of content.matchAll(T_CALL_REGEX)) {
      translationKeys.add(match[1]);
    }
    for (const match of content.matchAll(RETURN_TRANSLATION_KEY_REGEX)) {
      const key = match[1];
      if (TRANSLATION_KEYS.has(key)) {
        translationKeys.add(key);
      }
    }
  }
  return translationKeys;
}
