import type {Locale} from './locale';
import {
  DEFAULT_SHOW_PRESET_NAME_ON_CHANGE,
  DEFAULT_SHOW_TRACK_NAME_ON_CHANGE,
  DEFAULT_SKIP_SPLASH_ON_LOAD
} from './settings';
import type {Translations} from './translations';

/*
 * Types.
 */

type StorageKey =
  | 'locale'
  | 'translations'
  | 'skipSplashOnLoad'
  | 'showPresetNameOnChange'
  | 'showTrackNameOnChange';

type MilkTeaStorageKey = `milktea:${StorageKey}`;

type MilkTeaStorage = {
  locale: Locale;
  translations: Translations;
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

export function setStorageSkipSplashOnLoad(value: boolean): void {
  setStorageItem('skipSplashOnLoad', value === DEFAULT_SKIP_SPLASH_ON_LOAD ? undefined : value);
}
export function getStorageSkipSplashOnLoad(): boolean | undefined {
  return getStorageItem<boolean>('skipSplashOnLoad');
}

export function setStorageShowPresetNameOnChange(value: boolean): void {
  setStorageItem('showPresetNameOnChange', value === DEFAULT_SHOW_PRESET_NAME_ON_CHANGE ? undefined : value);
}
export function getStorageShowPresetNameOnChange(): boolean | undefined {
  return getStorageItem<boolean>('showPresetNameOnChange');
}

export function setStorageShowTrackNameOnChange(value: boolean): void {
  setStorageItem('showTrackNameOnChange', value === DEFAULT_SHOW_TRACK_NAME_ON_CHANGE ? undefined : value);
}
export function getStorageShowTrackNameOnChange(): boolean | undefined {
  return getStorageItem<boolean>('showTrackNameOnChange');
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
