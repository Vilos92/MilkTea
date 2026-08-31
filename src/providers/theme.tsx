import {createContext} from 'preact';
import type {ComponentChildren} from 'preact';
import {useCallback, useContext, useEffect, useState} from 'preact/hooks';

import {getStorageThemeOverride, setStorageThemeOverride} from '../lib/storage';
import {
  computeNextThemeOverride,
  computeResolvedTheme,
  themePageBackground,
  type Theme,
  type ThemeOverride
} from '../lib/theme';

/*
 * Types.
 */

type ThemeContextValue = {
  resolvedTheme: Theme;
  toggleTheme: () => void;
};

type ThemeProviderProps = {
  children: ComponentChildren;
};

/*
 * Context.
 */

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/*
 * Provider.
 */

export function ThemeProvider({children}: ThemeProviderProps) {
  const [override, setOverride] = useState<ThemeOverride>(readAvailableStorageOverride);
  const [systemTheme, setSystemTheme] = useState<Theme>(readSystemTheme);
  const resolvedTheme = computeResolvedTheme(systemTheme, override);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    if (override === undefined) {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.dataset.theme = override;
    }

    const themeColor = document.querySelector<HTMLMetaElement>('meta[data-theme-color]');
    if (themeColor) {
      themeColor.content = themePageBackground[resolvedTheme];
    }
  }, [override, resolvedTheme]);

  const toggleTheme = useCallback(() => {
    const nextOverride = computeNextThemeOverride(systemTheme, override);
    setOverride(nextOverride);

    try {
      setStorageThemeOverride(nextOverride);
    } catch {
      // Theme changes still work for this session when storage is unavailable.
    }
  }, [override, systemTheme]);

  const value: ThemeContextValue = {resolvedTheme, toggleTheme};

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/*
 * Hook.
 */

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within ThemeProvider.');
  }
  return context;
}

/*
 * Helpers.
 */

function readAvailableStorageOverride(): ThemeOverride {
  try {
    return getStorageThemeOverride();
  } catch {
    return undefined;
  }
}

function readSystemTheme(): Theme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
