import {createContext} from 'preact';
import {useCallback, useContext, useState} from 'preact/hooks';

import {useLocale} from '../hooks/useLocale.ts';
import {DEFAULT_LOCALE, type Locale, isLocale} from '../lib/locale.ts';
import {getStorageLocale, setStorageLocale} from '../lib/storage.ts';

/*
 * Types.
 */

export type LocaleContextValue = {
  locale: Locale;
  setLocaleOverride: (locale: Locale | undefined) => void;
};

/*
 * Context.
 */

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocaleOverride: () => {}
});

/*
 * Provider.
 */

export function LocaleProvider({children}: {children: preact.ComponentChildren}) {
  const {locale: browserLocale} = useLocale();
  const [overrideLocale, setOverrideLocale] = useState<Locale | undefined>(() => {
    if (typeof localStorage === 'undefined') return undefined;
    const storageLocale = getStorageLocale();
    return storageLocale && isLocale(storageLocale) ? storageLocale : undefined;
  });
  const locale = overrideLocale ?? browserLocale;

  const setLocaleOverride = useCallback(
    (nextLocale: Locale | undefined) => {
      if (nextLocale === browserLocale) {
        setOverrideLocale(undefined);
        setStorageLocale(undefined);
        return;
      }

      setOverrideLocale(nextLocale);
      setStorageLocale(nextLocale);
    },
    [browserLocale]
  );

  const value: LocaleContextValue = {locale, setLocaleOverride};

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/*
 * Hook.
 */

export function useLocaleContext(): LocaleContextValue {
  return useContext(LocaleContext);
}
