import {createContext} from 'preact';
import {useCallback, useContext, useState} from 'preact/hooks';

import {useLocale} from '../hooks/useLocale.ts';
import {DEFAULT_LOCALE, type Locale} from '../lib/locale.ts';

/*
 * Types.
 */

export type LocaleContextValue = {
  locale: Locale;
  setLocaleOverride: (locale: Locale | null) => void;
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
  const [overrideLocale, setOverrideLocale] = useState<Locale | null>(null);
  const locale = overrideLocale ?? browserLocale;

  const setLocaleOverride = useCallback((l: Locale | null) => setOverrideLocale(l), []);

  const value: LocaleContextValue = {locale, setLocaleOverride};

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/*
 * Hook.
 */

export function useLocaleContext(): LocaleContextValue {
  return useContext(LocaleContext);
}
