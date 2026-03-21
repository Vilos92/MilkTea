/*
 * Enums.
 */

export const VibrationPattern = {
  LIGHT: 10,
  MEDIUM: 20,
  HEAVY: 30
} as const satisfies Record<string, VibratePattern>;
export type VibrationPattern = (typeof VibrationPattern)[keyof typeof VibrationPattern];

/*
 * Helpers.
 */

function applyVibratePattern(pattern: VibrationPattern) {
  navigator.vibrate?.(pattern);
}

export function vibrateLight() {
  applyVibratePattern(VibrationPattern.LIGHT);
}

export function vibrateMedium() {
  applyVibratePattern(VibrationPattern.MEDIUM);
}

export function vibrateHeavy() {
  applyVibratePattern(VibrationPattern.HEAVY);
}
