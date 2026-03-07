/*
 * Platform helpers.
 */

export const isMac =
  (typeof navigator !== 'undefined' && navigator.userAgentData?.platform === 'macOS') ||
  /Mac|iPhone|iPad|iPod/.test(navigator.platform);

export const supportsRequestFullscreen = typeof document.documentElement.requestFullscreen === 'function';
