/*
 * Types.
 */

export type Theme = 'light' | 'dark';
export type ThemeOverride = Theme | undefined;

/*
 * Constants.
 */

export const themePageBackground: Record<Theme, string> = {
  light: '#fff',
  dark: '#000'
};

/*
 * Helpers.
 */

export function readThemeOverride(value: unknown): ThemeOverride {
  return value === 'light' || value === 'dark' ? value : undefined;
}

export function computeResolvedTheme(systemTheme: Theme, override: ThemeOverride): Theme {
  return override ?? systemTheme;
}

/** Returns the explicit override required after the user switches the visible theme. */
export function computeNextThemeOverride(systemTheme: Theme, override: ThemeOverride): ThemeOverride {
  const resolvedTheme = computeResolvedTheme(systemTheme, override);
  const nextTheme: Theme = resolvedTheme === 'dark' ? 'light' : 'dark';
  return nextTheme === systemTheme ? undefined : nextTheme;
}
