import {DEFAULT_LOCALE, Locale} from './locale';

/*
 * Types.
 */

/** All translation keys used in the app. */
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
  | 'locale.ariaSelectLanguage'
  | 'help.about'
  | 'help.aboutText'
  | 'help.hotkeys'
  | 'help.openLabel'
  | 'help.close'
  | 'help.keyHelpKeys'
  | 'help.keyHelpAction'
  | 'help.keyPrevKeys'
  | 'help.keyPrevAction'
  | 'help.keyNextKeys'
  | 'help.keyNextAction'
  | 'help.keyFullscreenKeys'
  | 'help.keyFullscreenAction'
  | 'help.trackName'
  | 'help.presetName'
  | 'dragDrop.message'
  | 'source.oscillator'
  | 'source.file'
  | 'source.microphone';

export type Translations = Record<TranslationKey, string>;

/*
 * Constants.
 */

/** Default locale manuscript. No fetch for 'en'; inlined so no en.json in public. */
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
  'locale.ariaSelectLanguage': 'Select language',
  'help.about': 'About',
  'help.aboutText': 'MilkTea. A browser visualizer for MilkDrop.',
  'help.hotkeys': 'Hotkeys',
  'help.openLabel': 'Help',
  'help.close': 'Close',
  'help.keyHelpKeys': '?',
  'help.keyHelpAction': 'Help',
  'help.keyPrevKeys': 'Left, A, H',
  'help.keyPrevAction': 'Previous preset',
  'help.keyNextKeys': 'Right, D, L',
  'help.keyNextAction': 'Next preset',
  'help.keyFullscreenKeys': 'F',
  'help.keyFullscreenAction': 'Toggle fullscreen',
  'help.trackName': 'Now playing',
  'help.presetName': 'Preset',
  'dragDrop.message': 'Drop an audio file to play it.',
  'source.oscillator': 'Oscillator',
  'source.file': 'Audio file',
  'source.microphone': 'Microphone'
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

  if (locale === 'en') {
    translationStore.set('en', ENGLISH_TRANSLATIONS);
    return Promise.resolve(ENGLISH_TRANSLATIONS);
  }

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
