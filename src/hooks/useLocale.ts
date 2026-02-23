import {useState} from 'preact/hooks';

import {type Locale} from '../lib/locale.ts';
import {detectBrowserLocale} from '../lib/translations.ts';

/*
 * Hook.
 */

/** Returns the browser-detected locale. */
export function useLocale() {
  const [locale] = useState<Locale>(detectBrowserLocale);
  return {locale};
}
