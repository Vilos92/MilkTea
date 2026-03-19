import {DEFAULT_LOCALE, Locale} from './locale';

/*
 * Types.
 */

/** All translation keys used in the app. */
export type TranslationKey =
  | 'common.close'
  | 'common.help'
  | 'common.shareToBluesky'
  | 'splash.button'
  | 'splash.ariaStart'
  | 'splash.disclaimer1'
  | 'splash.disclaimer2'
  | 'controls.rowPlayback'
  | 'controls.rowPresets'
  | 'controls.play'
  | 'controls.pause'
  | 'controls.prevTrack'
  | 'controls.nextTrack'
  | 'controls.record'
  | 'controls.stopRecord'
  | 'controls.prevPreset'
  | 'controls.nextPreset'
  | 'controls.stagePreset'
  | 'controls.firePreset'
  | 'controls.presets'
  | 'controls.searchPresets'
  | 'controls.enterFullscreen'
  | 'controls.exitFullscreen'
  | 'locale.ariaSelectLanguage'
  | 'help.about'
  | 'help.aboutText'
  | 'help.shareToBlueskyMessage'
  | 'help.hotkeys'
  | 'help.gestures'
  | 'help.keyHelpKeys'
  | 'help.keyHelpAction'
  | 'help.keyPrevKeys'
  | 'help.keyPrevAction'
  | 'help.keyNextKeys'
  | 'help.keyNextAction'
  | 'help.keyFullscreenKeys'
  | 'help.keyFullscreenAction'
  | 'help.keyCommandPaletteKeysMac'
  | 'help.keyCommandPaletteKeysWindows'
  | 'help.keyCommandPaletteAction'
  | 'help.keySpaceKeys'
  | 'help.keySpaceAction'
  | 'help.keySemicolonKeys'
  | 'help.keySemicolonAction'
  | 'help.swipePrevKeys'
  | 'help.swipePrevAction'
  | 'help.swipeNextKeys'
  | 'help.swipeNextAction'
  | 'help.trackName'
  | 'help.presetName'
  | 'settings.showPresetNameInControls'
  | 'settings.showTrackNameInControls'
  | 'settings.autoStart'
  | 'commandPalette.searchPlaceholder'
  | 'commandPalette.group.command'
  | 'commandPalette.group.audio'
  | 'commandPalette.group.settings'
  | 'dragDrop.message'
  | 'source.oscillator'
  | 'source.file'
  | 'source.microphone'
  | 'source.audio-capture';

export type Translations = Record<TranslationKey, string>;

/*
 * Constants.
 */

/** Default locale manuscript. No fetch for 'en'; inlined so no en.json in public. */
export const ENGLISH_TRANSLATIONS: Translations = {
  'common.close': 'Close',
  'common.help': 'Help',
  'common.shareToBluesky': 'Share to Bluesky',
  'splash.button': 'MilkTea',
  'splash.ariaStart': 'Start visuals',
  'splash.disclaimer1':
    'Given its unconventional interactions, this exhibit may not fully adhere to common accessibility expectations. Thank you for your understanding.',
  'splash.disclaimer2': 'Click the button above to load the visual demonstration.',
  'controls.rowPlayback': 'Playback',
  'controls.rowPresets': 'Presets',
  'controls.play': 'Play',
  'controls.pause': 'Pause',
  'controls.prevTrack': 'Previous track',
  'controls.nextTrack': 'Next track',
  'controls.record': 'Record',
  'controls.stopRecord': 'Stop recording',
  'controls.prevPreset': 'Previous preset',
  'controls.nextPreset': 'Next preset',
  'controls.stagePreset': 'Stage preset',
  'controls.firePreset': 'Launch preset',
  'controls.presets': 'Presets',
  'controls.searchPresets': 'Search presets\u2026',
  'controls.enterFullscreen': 'Enter fullscreen',
  'controls.exitFullscreen': 'Exit fullscreen',
  'locale.ariaSelectLanguage': 'Select language',
  'help.about': 'About',
  'help.aboutText': 'MilkTea. A browser visualizer for MilkDrop',
  'help.shareToBlueskyMessage': 'Check out this visualizer: https://milktea.ink',
  'help.hotkeys': 'Hotkeys',
  'help.gestures': 'Gestures',
  'help.keyHelpKeys': '?',
  'help.keyHelpAction': 'Help',
  'help.keyPrevKeys': 'Left, A, H',
  'help.keyPrevAction': 'Previous preset',
  'help.keyNextKeys': 'Right, D, L',
  'help.keyNextAction': 'Next preset',
  'help.keyFullscreenKeys': 'F',
  'help.keyFullscreenAction': 'Toggle fullscreen',
  'help.keyCommandPaletteKeysMac': '⌘K',
  'help.keyCommandPaletteKeysWindows': 'Ctrl+K',
  'help.keyCommandPaletteAction': 'Command Palette',
  'help.keySpaceKeys': 'Space',
  'help.keySpaceAction': 'Pause / Play',
  'help.keySemicolonKeys': ';',
  'help.keySemicolonAction': 'Stage preset and launch preset',
  'help.swipePrevKeys': 'Swipe left',
  'help.swipePrevAction': 'Previous preset',
  'help.swipeNextKeys': 'Swipe right',
  'help.swipeNextAction': 'Next preset',
  'help.trackName': 'Now playing',
  'help.presetName': 'Preset',
  'settings.showPresetNameInControls': 'Show preset name',
  'settings.showTrackNameInControls': 'Show track name',
  'settings.autoStart': 'Start visualizer automatically',
  'commandPalette.searchPlaceholder': 'Search…',
  'commandPalette.group.command': 'Command',
  'commandPalette.group.audio': 'Audio',
  'commandPalette.group.settings': 'Settings',
  'dragDrop.message': 'Drop an audio file to play it.',
  'source.oscillator': 'Oscillator',
  'source.file': 'Audio file',
  'source.microphone': 'Microphone',
  'source.audio-capture': 'Audio capture'
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
  if (typeof navigator === 'undefined') {
    return DEFAULT_LOCALE;
  }
  const raw = navigator.language || navigator.languages?.[0] || 'en';
  const parts = raw.split('-').map((p, i) => (i === 0 ? p.toLowerCase() : p));
  const full = parts.join('-'); // e.g. zh-Hans
  const base = parts[0] ?? 'en';

  if (SUPPORTED_LOCALES.has(full)) {
    return full as Locale;
  }
  if (SUPPORTED_LOCALES.has(base)) {
    return base as Locale;
  }
  if (base === 'zh') {
    if (raw.startsWith('zh-CN') || raw.startsWith('zh-SG')) {
      return Locale.CHINESE_SIMPLIFIED;
    }
    if (raw.startsWith('zh-TW') || raw.startsWith('zh-HK')) {
      return Locale.CHINESE_TRADITIONAL;
    }
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
  if (stored) {
    return Promise.resolve(stored);
  }

  if (locale === 'en') {
    translationStore.set('en', ENGLISH_TRANSLATIONS);
    return Promise.resolve(ENGLISH_TRANSLATIONS);
  }

  const existing = inFlight.get(locale);
  if (existing) {
    return existing;
  }

  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '';
  const url = `${base.replace(/\/$/, '')}/translations/${locale}.json`;
  const translationsPromise = (async () => {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to load translations for ${locale}: ${res.status}`);
    }
    const data = (await res.json()) as Translations;
    translationStore.set(locale, data);
    return data;
  })();

  inFlight.set(locale, translationsPromise);
  void translationsPromise.finally(() => inFlight.delete(locale));

  return translationsPromise;
}
