import {createContext} from 'preact';
import {useCallback, useContext, useEffect, useState} from 'preact/hooks';

import {Locale} from '../lib/locale.ts';
import {getStorageTranslations, setStorageTranslations} from '../lib/storage.ts';
import {
  ENGLISH_TRANSLATIONS,
  type TranslationKey,
  type Translations,
  fetchTranslations,
  getTranslations
} from '../lib/translations.ts';
import {useLocaleContext} from './locale.tsx';

/*
 * Context.
 */

const TranslateContext = createContext<Translations>(ENGLISH_TRANSLATIONS);

/*
 * Provider.
 */

/**
 * Fetches translations for the desired locale. Keeps last-known translations until new fetch completes.
 */
export function TranslateProvider({children}: {children: preact.ComponentChildren}) {
  const {locale: desiredLocale} = useLocaleContext();
  const [translations, setTranslations] = useState<Translations>(() => {
    if (typeof localStorage === 'undefined') return ENGLISH_TRANSLATIONS;
    const storageTranslations = getStorageTranslations();
    return storageTranslations ?? ENGLISH_TRANSLATIONS;
  });

  useEffect(() => {
    if (desiredLocale === Locale.ENGLISH) {
      setTranslations({...ENGLISH_TRANSLATIONS});
      setStorageTranslations(undefined);
      return;
    }

    const cachedTranslations = getTranslations(desiredLocale);
    if (cachedTranslations) {
      setTranslations({...cachedTranslations});
      return;
    }

    let cancelled = false;
    fetchTranslations(desiredLocale)
      .then(fetchedTranslations => {
        if (cancelled) {
          return;
        }
        setTranslations({...fetchedTranslations});
        setStorageTranslations({...fetchedTranslations});
      })
      .catch(err => {
        if (!cancelled) {
          console.error('Translations fetch failed:', desiredLocale, err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [desiredLocale]);

  return <TranslateContext.Provider value={translations}>{children}</TranslateContext.Provider>;
}

/*
 * Hooks.
 */

/** Returns the current translation map (last-known until new locale loads). */
export function useTranslateContext(): Translations {
  return useContext(TranslateContext);
}

/**
 * Returns a function that looks up a key and returns the translated string.
 * Falls back to English if the current locale's translation is missing.
 */
export function useTranslate(): (key: TranslationKey) => string {
  const translations = useTranslateContext();

  return useCallback((key: TranslationKey) => translations[key] ?? ENGLISH_TRANSLATIONS[key], [translations]);
}
