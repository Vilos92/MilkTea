import {describe, expect, test} from 'vitest';

import {computeNextThemeOverride, computeResolvedTheme, readThemeOverride} from './theme';

/*
 * Tests.
 */

describe('readThemeOverride', () => {
  test.each([undefined, null, 'system', 'LIGHT', '', true, 1, {}, []])(
    'rejects invalid stored value %j',
    value => {
      expect(readThemeOverride(value)).toBeUndefined();
    }
  );

  test.each(['light', 'dark'] as const)('accepts the %s override', theme => {
    expect(readThemeOverride(theme)).toBe(theme);
  });
});

describe('computeResolvedTheme', () => {
  test.each(['light', 'dark'] as const)('uses the %s system theme without an override', systemTheme => {
    expect(computeResolvedTheme(systemTheme, undefined)).toBe(systemTheme);
  });

  test.each([
    ['light', 'dark', 'light'],
    ['dark', 'light', 'dark']
  ] as const)(
    'uses the %s override instead of the %s system theme',
    (override, systemTheme, resolvedTheme) => {
      expect(computeResolvedTheme(systemTheme, override)).toBe(resolvedTheme);
    }
  );
});

describe('computeNextThemeOverride', () => {
  test.each([
    ['light', undefined, 'dark'],
    ['dark', undefined, 'light'],
    ['light', 'light', 'dark'],
    ['dark', 'dark', 'light']
  ] as const)(
    'stores a %s-system toggle from %s as %s when the target differs from the system',
    (systemTheme, override, nextOverride) => {
      expect(computeNextThemeOverride(systemTheme, override)).toBe(nextOverride);
    }
  );

  test.each([
    ['light', 'dark'],
    ['dark', 'light']
  ] as const)(
    'returns to the %s system theme when the user toggles away from a %s override',
    (systemTheme, override) => {
      expect(computeNextThemeOverride(systemTheme, override)).toBeUndefined();
    }
  );

  test('preserves an override when the system theme changes', () => {
    const override = computeNextThemeOverride('light', undefined);

    expect(override).toBe('dark');
    expect(computeResolvedTheme('dark', override)).toBe('dark');
    expect(computeNextThemeOverride('dark', override)).toBe('light');
  });
});
