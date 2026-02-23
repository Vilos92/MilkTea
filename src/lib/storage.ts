import type {Locale} from './locale';
import type {Translations} from './translations';

/*
 * Types.
 */

type StorageKey = 'locale' | 'translations';

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

function setStorageItem<TData>(key: StorageKey, value: TData | undefined): void {
  if (value === undefined) {
    localStorage.removeItem(formatStorageKey(key));
    return;
  }

  localStorage.setItem(formatStorageKey(key), JSON.stringify(value));
}

function getStorageItem<TData>(key: StorageKey): TData | undefined {
  const item = localStorage.getItem(formatStorageKey(key));
  if (item === null) return undefined;

  try {
    return JSON.parse(item) as TData;
  } catch (error) {
    console.error(`Failed to parse storage item ${key}:`, error);
    return undefined;
  }
}

/*
 * Helpers.
 */

function formatStorageKey(key: StorageKey): MilkTeaStorageKey {
  return `milktea:${key}`;
}
