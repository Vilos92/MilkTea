/*
 * Platform helpers.
 */

export const isMac =
  (typeof navigator !== 'undefined' && navigator.userAgentData?.platform === 'macOS') ||
  /Mac|iPhone|iPad|iPod/.test(navigator.platform);

export const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

const isChromium = Boolean('chrome' in window);

export const supportsRequestFullscreen = typeof document.documentElement.requestFullscreen === 'function';

const supportsGetDisplayMedia = typeof navigator.mediaDevices?.getDisplayMedia === 'function';

export const likelySupportsDisplayAudio = supportsGetDisplayMedia && isChromium;

// The desktop shell captures the microphone natively through cpal, which works on every desktop
// OS and sidesteps WebKitGTK denying `getUserMedia` on Tauri Linux. A plain browser instead needs
// `getUserMedia`, which is also feature-detected since `navigator.mediaDevices` is undefined in
// insecure contexts.
export const supportsMicCapture = isTauri || typeof navigator.mediaDevices?.getUserMedia === 'function';

// Native cpal capture, which only the desktop shell exposes. macOS needs 14.6+ for CoreAudio
// process taps and Linux needs a PulseAudio monitor source. Neither is knowable from the webview,
// so those failures surface at runtime through the same path as any other source error.
export const supportsSystemAudioCapture = isTauri;
