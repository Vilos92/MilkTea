import type {Locale} from '../../lib/locale.ts';
import {LOCALE_OPTIONS} from '../../lib/locale.ts';
import {useLocaleContext} from '../../provider/locale.tsx';
import {label, labelAlwaysLight, root, select, selectAlwaysLight} from './localeSwitcher.css.ts';

/*
 * Types.
 */

type LocaleSwitcherProps = {
  alwaysLight: boolean;
};

/*
 * Component.
 */

export function LocaleSwitcher({alwaysLight}: LocaleSwitcherProps) {
  const {locale, setLocaleOverride} = useLocaleContext();

  function handleChange(event: Event) {
    const next = (event.target as HTMLSelectElement).value as Locale;
    setLocaleOverride(next);
  }

  const labelClass = alwaysLight ? [label, labelAlwaysLight].join(' ') : label;
  const selectClass = alwaysLight ? [select, selectAlwaysLight].join(' ') : select;

  return (
    <div class={root}>
      <label htmlFor="locale-select" class={labelClass}>
        Language
      </label>
      <select
        id="locale-select"
        class={selectClass}
        value={locale}
        onChange={handleChange}
        aria-label="Select language"
      >
        {LOCALE_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
