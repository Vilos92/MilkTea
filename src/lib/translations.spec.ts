import {describe, expect, test} from 'bun:test';
import {join} from 'node:path';

import {Locale} from './locale';
import {ENGLISH_TRANSLATIONS} from './translations';

/*
 * Constants.
 */

const TRANSLATION_KEYS = new Set(Object.keys(ENGLISH_TRANSLATIONS));

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
    delete (fake as Record<string, string>)['help.close'];

    const result = validateTranslations(fake as Translations);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("missing key: 'help.close'");
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
    const repoRoot = join(import.meta.dir, '..', '..');
    const translationsDir = join(repoRoot, 'public', 'translations');

    const localesWithJson = (Object.values(Locale) as string[]).filter(l => l !== 'en');
    const failures: string[] = [];

    for (const locale of localesWithJson) {
      const path = join(translationsDir, `${locale}.json`);
      const data = (await Bun.file(path).json()) as Translations;
      const result = validateTranslations(data);
      if (!result.ok) {
        failures.push(`${locale}: ${result.errors.join('; ')}`);
      }
    }

    expect(failures).toEqual([]);
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
