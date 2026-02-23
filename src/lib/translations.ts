import {DEFAULT_LOCALE, Locale} from './locale.ts';

/*
 * Types.
 */

/** Manuscript: all translation keys used in the app. */
export type TranslationKey =
  | 'splash.button'
  | 'splash.ariaStart'
  | 'splash.disclaimer1'
  | 'splash.disclaimer2'
  | 'controls.prevPreset'
  | 'controls.nextPreset'
  | 'controls.enterFullscreen'
  | 'controls.exitFullscreen'
  | 'locale.label'
  | 'locale.ariaSelectLanguage';

export type Translations = Record<TranslationKey, string>;

/*
 * Constants.
 */

/** Hard-coded English manuscript. No fetch for 'en', as it is the default locale. */
export const ENGLISH_TRANSLATIONS: Translations = {
  'splash.button': 'MilkTea',
  'splash.ariaStart': 'Start visuals',
  'splash.disclaimer1':
    'Given its unconventional interactions, this exhibit may not fully adhere to common accessibility expectations. Thank you for your understanding.',
  'splash.disclaimer2': 'Click the button above to load the visual demonstration.',
  'controls.prevPreset': 'Previous preset',
  'controls.nextPreset': 'Next preset',
  'controls.enterFullscreen': 'Enter fullscreen',
  'controls.exitFullscreen': 'Exit fullscreen',
  'locale.label': 'Language',
  'locale.ariaSelectLanguage': 'Select language'
};

const SUPPORTED_LOCALES = new Set<string>(Object.values(Locale));

/*
 * Store.
 */

const translationStore = new Map<Locale, Translations>();
const inFlight = new Map<Locale, Promise<Translations>>();

/** Return cached translations for a locale. */
export function getTranslations(locale: Locale): Translations | undefined {
  return translationStore.get(locale);
}

/*
 * Helpers.
 */

/**
 * Detect locale from the browser (`navigator.language` / `navigator.languages`).
 * Maps to a supported `Locale` or `DEFAULT_LOCALE`.
 */
export function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE;
  const raw = navigator.language || navigator.languages?.[0] || 'en';
  const parts = raw.split('-').map((p, i) => (i === 0 ? p.toLowerCase() : p));
  const full = parts.join('-'); // e.g. zh-Hans
  const base = parts[0] ?? 'en';

  if (SUPPORTED_LOCALES.has(full)) return full as Locale;
  if (SUPPORTED_LOCALES.has(base)) return base as Locale;
  if (base === 'zh') {
    if (raw.startsWith('zh-CN') || raw.startsWith('zh-SG')) return Locale.CHINESE_SIMPLIFIED;
    if (raw.startsWith('zh-TW') || raw.startsWith('zh-HK')) return Locale.CHINESE_TRADITIONAL;
    return Locale.CHINESE_SIMPLIFIED;
  }
  return DEFAULT_LOCALE;
}

/*
 * Requests.
 */

/**
 * Load translations for a locale: cache hit, in-flight reuse, or fetch then store.
 * Fetches from `public/translations/<locale>.json`.
 */
export async function fetchTranslations(locale: Locale): Promise<Translations> {
  const stored = translationStore.get(locale);
  if (stored) return Promise.resolve(stored);

  const existing = inFlight.get(locale);
  if (existing) return existing;

  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '';
  const url = `${base.replace(/\/$/, '')}/translations/${locale}.json`;
  const translationsPromise = (async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load translations for ${locale}: ${res.status}`);
    const data = (await res.json()) as Translations;
    translationStore.set(locale, data);
    return data;
  })();

  inFlight.set(locale, translationsPromise);
  translationsPromise.finally(() => inFlight.delete(locale));

  return translationsPromise;
}
