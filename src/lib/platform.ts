/*
 * Platform helpers.
 */

export const isMac =
  (typeof navigator !== 'undefined' && navigator.userAgentData?.platform === 'macOS') ||
  /Mac|iPhone|iPad|iPod/.test(navigator.platform);

const isChromium = Boolean('chrome' in window);

export const supportsRequestFullscreen = typeof document.documentElement.requestFullscreen === 'function';

const supportsGetDisplayMedia = typeof navigator.mediaDevices?.getDisplayMedia === 'function';

export const likelySupportsDisplayAudio = supportsGetDisplayMedia && isChromium;
