import type {Locale} from '../../lib/locale.ts';
import {LOCALE_OPTIONS} from '../../lib/locale.ts';
import {useLocaleContext} from '../../provider/locale.tsx';
import {useTranslate} from '../../provider/translation.tsx';
import {
  globe,
  label,
  labelAlwaysLight,
  root,
  row,
  select,
  selectAlwaysLight,
  srOnly
} from './localeSwitcher.css.ts';

/*
 * Types.
 */

type LocaleSwitcherProps = {
  class?: string;
  alwaysLight: boolean;
};

/*
 * Component.
 */

export function LocaleSwitcher({class: className, alwaysLight}: LocaleSwitcherProps) {
  const {locale, setLocaleOverride} = useLocaleContext();
  const t = useTranslate();

  function handleChange(event: Event) {
    setLocaleOverride((event.target as HTMLSelectElement).value as Locale);
  }

  const labelClass = alwaysLight ? [label, labelAlwaysLight].join(' ') : label;
  const selectClass = alwaysLight ? [select, selectAlwaysLight].join(' ') : select;
  const rootClass = className ? [root, className].join(' ') : root;

  return (
    <div class={rootClass}>
      <div class={labelClass}>
        <span class={row}>
          <span class={globe} aria-hidden="true">
            🌐
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
