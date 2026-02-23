export const Locale = {
  ENGLISH: 'en',
  SPANISH: 'es',
  FRENCH: 'fr',
  GERMAN: 'de',
  ITALIAN: 'it',
  PORTUGUESE: 'pt',
  DUTCH: 'nl',
  POLISH: 'pl',
  SWEDISH: 'sv',
  CZECH: 'cs',
  ROMANIAN: 'ro',
  GREEK: 'el',
  HUNGARIAN: 'hu',
  RUSSIAN: 'ru',
  UKRAINIAN: 'uk',
  ARABIC: 'ar',
  HEBREW: 'he',
  CHINESE_SIMPLIFIED: 'zh-Hans',
  CHINESE_TRADITIONAL: 'zh-Hant',
  JAPANESE: 'ja',
  KOREAN: 'ko',
  HINDI: 'hi',
  VIETNAMESE: 'vi',
  TURKISH: 'tr'
} as const;

export type Locale = (typeof Locale)[keyof typeof Locale];

export const DEFAULT_LOCALE: Locale = Locale.ENGLISH;

export const LOCALE_LABELS: Record<Locale, string> = {
  [Locale.ENGLISH]: 'English',
  [Locale.SPANISH]: 'Español',
  [Locale.FRENCH]: 'Français',
  [Locale.GERMAN]: 'Deutsch',
  [Locale.ITALIAN]: 'Italiano',
  [Locale.PORTUGUESE]: 'Português',
  [Locale.DUTCH]: 'Nederlands',
  [Locale.POLISH]: 'Polski',
  [Locale.SWEDISH]: 'Svenska',
  [Locale.CZECH]: 'Čeština',
  [Locale.ROMANIAN]: 'Română',
  [Locale.GREEK]: 'Ελληνικά',
  [Locale.HUNGARIAN]: 'Magyar',
  [Locale.RUSSIAN]: 'Русский',
  [Locale.UKRAINIAN]: 'Українська',
  [Locale.ARABIC]: 'العربية',
  [Locale.HEBREW]: 'עברית',
  [Locale.CHINESE_SIMPLIFIED]: '简体中文',
  [Locale.CHINESE_TRADITIONAL]: '繁體中文',
  [Locale.JAPANESE]: '日本語',
  [Locale.KOREAN]: '한국어',
  [Locale.HINDI]: 'हिन्दी',
  [Locale.VIETNAMESE]: 'Tiếng Việt',
  [Locale.TURKISH]: 'Türkçe'
};

export const LOCALE_ORDER: ReadonlyArray<Locale> = [
  'en',
  'es',
  'fr',
  'de',
  'it',
  'pt',
  'nl',
  'pl',
  'sv',
  'cs',
  'ro',
  'el',
  'hu',
  'ru',
  'uk',
  'ar',
  'he',
  'zh-Hans',
  'zh-Hant',
  'ja',
  'ko',
  'hi',
  'vi',
  'tr'
] as const;

type LocaleOption = {
  value: Locale;
  label: string;
};

export const LOCALE_OPTIONS: ReadonlyArray<LocaleOption> = LOCALE_ORDER.map(locale => ({
  value: locale,
  label: LOCALE_LABELS[locale]
}));
