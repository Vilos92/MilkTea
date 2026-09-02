/*
 * Platform helpers.
 */

export const isMac =
  (typeof navigator !== 'undefined' && navigator.userAgentData?.platform === 'macOS') ||
  /Mac|iPhone|iPad|iPod/.test(navigator.platform);

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

// Desktop heuristic. Android also reports Linux, so revisit this if a Tauri mobile build ships.
const isLinux = navigator.userAgentData?.platform === 'Linux' || /\bLinux\b/.test(navigator.platform);

const isChromium = Boolean('chrome' in window);

export const supportsRequestFullscreen = typeof document.documentElement.requestFullscreen === 'function';

const supportsGetDisplayMedia = typeof navigator.mediaDevices?.getDisplayMedia === 'function';

export const likelySupportsDisplayAudio = supportsGetDisplayMedia && isChromium;

// WebKitGTK denies `getUserMedia` permission requests because Tauri registers no permission
// handler, so mic capture can never succeed on Tauri Linux today. Also feature-detect, since
// `navigator.mediaDevices` is undefined in insecure contexts.
export const supportsMicCapture =
  !(isTauri && isLinux) && typeof navigator.mediaDevices?.getUserMedia === 'function';
