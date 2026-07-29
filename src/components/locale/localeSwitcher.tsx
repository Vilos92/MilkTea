import type {Locale} from '../../lib/locale';
import {LOCALE_OPTIONS} from '../../lib/locale';
import {useLocaleContext} from '../../providers/locale';
import {useTranslate} from '../../providers/translation';

import {
  globe,
  globeWrapper,
  label,
  labelAlwaysLight,
  root,
  row,
  select,
  selectAlwaysLight,
  srOnly
} from './localeSwitcher.css';

/*
 * Types.
 */

type LocaleSwitcherProps = {
  class?: string;
};

/*
 * Component.
 */

export function LocaleSwitcher({class: className}: LocaleSwitcherProps) {
  const {locale, setLocaleOverride} = useLocaleContext();
  const t = useTranslate();

  function handleChange(event: Event) {
    setLocaleOverride((event.target as HTMLSelectElement).value as Locale);
  }

  const labelClass = [label, labelAlwaysLight].join(' ');
  const selectClass = [select, selectAlwaysLight].join(' ');
  const rootClass = className ? [root, className].join(' ') : root;

  return (
    <div class={rootClass}>
      <div class={labelClass}>
        <span class={row}>
          <span class={globeWrapper} aria-hidden="true">
            <span class={globe}>🌐</span>
          </span>
          <label htmlFor="locale-select" class={srOnly}>
            {t('locale.ariaSelectLanguage')}
          </label>
          <select id="locale-select" class={selectClass} value={locale} onChange={handleChange}>
            {LOCALE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </span>
      </div>
    </div>
  );
}
