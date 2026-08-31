import {useThemeContext} from '../../providers/theme';

import {button, icon} from './themeToggle.css';

/*
 * Component.
 */

export function ThemeToggle() {
  const {resolvedTheme, toggleTheme} = useThemeContext();
  const targetTheme = resolvedTheme === 'light' ? 'dark' : 'light';
  const label = `Switch to ${targetTheme} mode`;

  return (
    <button type="button" class={button} onClick={toggleTheme} aria-label={label} title={label}>
      {resolvedTheme === 'light' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

/*
 * Helpers.
 */

function SunIcon() {
  return (
    <svg class={icon} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="3.25" />
      <path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M3.99 3.99l1.42 1.42M14.59 14.59l1.42 1.42M16.01 3.99l-1.42 1.42M5.41 14.59l-1.42 1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg class={icon} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M16.75 12.38A7.25 7.25 0 0 1 7.62 3.25a7.25 7.25 0 1 0 9.13 9.13Z" />
    </svg>
  );
}
