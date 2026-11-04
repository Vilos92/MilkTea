import {useThemeContext} from '../../providers/theme';
import {useTranslate} from '../../providers/translation';
import {Icon} from '../icon/icon';

import {button, icon} from './themeToggle.css';

/*
 * Component.
 */

export function ThemeToggle() {
  const {resolvedTheme, toggleTheme} = useThemeContext();
  const t = useTranslate();
  const targetTheme = resolvedTheme === 'light' ? 'dark' : 'light';
  const label = targetTheme === 'dark' ? t('theme.switchToDark') : t('theme.switchToLight');

  return (
    <button type="button" class={button} onClick={toggleTheme} aria-label={label} title={label}>
      <Icon type={resolvedTheme === 'light' ? 'theme-light' : 'theme-dark'} size="md" class={icon} />
    </button>
  );
}
