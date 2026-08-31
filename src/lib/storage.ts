import type {Locale} from './locale';
import {
  DEFAULT_CYCLE_PRESETS,
  DEFAULT_RANDOMIZE_PRESETS,
  DEFAULT_SHOW_PRESET_IN_CONTROLS,
  DEFAULT_SHOW_TRACK_IN_CONTROLS,
  DEFAULT_SKIP_SPLASH_ON_LOAD
} from './settings';
import {readThemeOverride, type Theme, type ThemeOverride} from './theme';
import type {Translations} from './translations';

/*
 * Types.
 */

type StorageKey =
  | 'locale'
  | 'translations'
  | 'theme'
  | 'skipSplashOnLoad'
  | 'showPresetNameInControls'
  | 'showTrackNameInControls'
  | 'randomizePresets'
  | 'cyclePresets';

type MilkTeaStorageKey = `milktea:${StorageKey}`;

type MilkTeaStorage = {
  locale: Locale;
  translations: Translations;
  theme: Theme;
};

/*
 * Storage.
 */

export function setStorageTranslations(value: MilkTeaStorage['translations'] | undefined): void {
  setStorageItem('translations', value);
}
export function getStorageTranslations(): MilkTeaStorage['translations'] | undefined {
  return getStorageItem<MilkTeaStorage['translations']>('translations');
}

export function setStorageLocale(value: MilkTeaStorage['locale'] | undefined): void {
  setStorageItem('locale', value);
}
export function getStorageLocale(): MilkTeaStorage['locale'] | undefined {
  return getStorageItem<MilkTeaStorage['locale']>('locale');
}

export function setStorageThemeOverride(override: ThemeOverride): void {
  setStorageItem('theme', override);
}
export function getStorageThemeOverride(): ThemeOverride {
  return readThemeOverride(getStorageItem<unknown>('theme'));
}

export function setStorageSkipSplashOnLoad(value: boolean): void {
  setStorageItem('skipSplashOnLoad', value === DEFAULT_SKIP_SPLASH_ON_LOAD ? undefined : value);
}
export function getStorageSkipSplashOnLoad(): boolean | undefined {
  return getStorageItem<boolean>('skipSplashOnLoad');
}

export function setStorageShowPresetNameInControls(value: boolean): void {
  setStorageItem('showPresetNameInControls', value === DEFAULT_SHOW_PRESET_IN_CONTROLS ? undefined : value);
}
export function getStorageShowPresetNameInControls(): boolean | undefined {
  return getStorageItem<boolean>('showPresetNameInControls');
}

export function setStorageShowTrackNameInControls(value: boolean): void {
  setStorageItem('showTrackNameInControls', value === DEFAULT_SHOW_TRACK_IN_CONTROLS ? undefined : value);
}
export function getStorageShowTrackNameInControls(): boolean | undefined {
  return getStorageItem<boolean>('showTrackNameInControls');
}

export function setStorageRandomizePresets(value: boolean): void {
  setStorageItem('randomizePresets', value === DEFAULT_RANDOMIZE_PRESETS ? undefined : value);
}
export function getStorageRandomizePresets(): boolean | undefined {
  return getStorageItem<boolean>('randomizePresets');
}

export function setStorageCyclePresets(value: boolean): void {
  setStorageItem('cyclePresets', value === DEFAULT_CYCLE_PRESETS ? undefined : value);
}
export function getStorageCyclePresets(): boolean | undefined {
  return getStorageItem<boolean>('cyclePresets');
}

/*
 * Helpers.
 */

function setStorageItem<TData>(key: StorageKey, value: TData | undefined): void {
  if (value === undefined) {
    localStorage.removeItem(formatStorageKey(key));
    return;
  }

  localStorage.setItem(formatStorageKey(key), JSON.stringify(value));
}

function getStorageItem<TData>(key: StorageKey): TData | undefined {
  const item = localStorage.getItem(formatStorageKey(key));
  if (item === null) {
    return undefined;
  }

  try {
    return JSON.parse(item) as TData;
  } catch (error) {
    console.error(`Failed to parse storage item ${key}:`, error);
    return undefined;
  }
}

function formatStorageKey(key: StorageKey): MilkTeaStorageKey {
  return `milktea:${key}`;
}
