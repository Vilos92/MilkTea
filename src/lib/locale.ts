const Locales = {
  ENGLISH: 'en',
  FRENCH: 'fr',
  SPANISH: 'es',
  GERMAN: 'de',
  JAPANESE: 'ja',
  CHINESE_SIMPLIFIED: 'zh-Hans',
  CHINESE_TRADITIONAL: 'zh-Hant',
  ITALIAN: 'it',
  PORTUGUESE: 'pt',
  KOREAN: 'ko'
} as const;

/** Supported locale codes (most common, starting with 'en'). */
export type Locale = (typeof Locales)[keyof typeof Locales];

export const Locale = Locales;

export const DEFAULT_LOCALE: Locale = Locales.ENGLISH;

export const LOCALE_LABELS: Record<Locale, string> = {
  [Locales.ENGLISH]: 'English',
  [Locales.FRENCH]: 'Français',
  [Locales.SPANISH]: 'Español',
  [Locales.GERMAN]: 'Deutsch',
  [Locales.JAPANESE]: '日本語',
  [Locales.CHINESE_SIMPLIFIED]: '简体中文',
  [Locales.CHINESE_TRADITIONAL]: '繁體中文',
  [Locales.ITALIAN]: 'Italiano',
  [Locales.PORTUGUESE]: 'Português',
  [Locales.KOREAN]: '한국어'
};

type LocaleOption = {
  value: Locale;
  label: string;
};

export const LOCALE_OPTIONS: ReadonlyArray<LocaleOption> = (
  Object.values(Locales) as Locale[]
).map(locale => ({value: locale, label: LOCALE_LABELS[locale]}));
