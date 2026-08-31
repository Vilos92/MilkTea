import {useEffect, useRef} from 'preact/hooks';

import {supportsRequestFullscreen} from '../../lib/platform';

/*
 * Types.
 */

type PresetStageKeyOptions = {
  onStageKey: () => void;
  presetPickerOpen: boolean;
};

/*
 * Constants.
 */

const PRESET_DELTAS: Record<string, -1 | 1 | undefined> = {
  ArrowLeft: -1,
  a: -1,
  A: -1,
  KeyA: -1,
  h: -1,
  H: -1,
  KeyH: -1,
  ArrowRight: 1,
  d: 1,
  D: 1,
  KeyD: 1,
  l: 1,
  L: 1,
  KeyL: 1
};

/*
 * Hooks.
 */

export function usePresetKeys(
  changePreset: (delta: number) => void,
  toggleFullscreen: () => void,
  {onStageKey, presetPickerOpen}: PresetStageKeyOptions
): void {
  const changePresetRef = useRef(changePreset);
  changePresetRef.current = changePreset;
  const toggleFullscreenRef = useRef(toggleFullscreen);
  toggleFullscreenRef.current = toggleFullscreen;
  const onStageKeyRef = useRef(onStageKey);
  onStageKeyRef.current = onStageKey;
  const presetPickerOpenRef = useRef(presetPickerOpen);
  presetPickerOpenRef.current = presetPickerOpen;

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (hasCommandModifier(event) || isEditableTarget(event.target)) {
        return;
      }

      const handlers = [
        () => handlePresetNavigation(event, changePresetRef.current),
        () => handleStageKey(event, presetPickerOpenRef.current, onStageKeyRef.current),
        () => handleFullscreenKey(event, toggleFullscreenRef.current)
      ];
      handlers.some(handler => handler());
    };

    window.addEventListener('keydown', handleKeydown, true);
    return () => window.removeEventListener('keydown', handleKeydown, true);
  }, []);
}

/*
 * Helpers.
 */

function handlePresetNavigation(event: KeyboardEvent, changePreset: (delta: number) => void): boolean {
  const delta = getPresetDelta(event);
  if (delta === undefined) {
    return false;
  }

  event.preventDefault();
  changePreset(delta);
  return true;
}

function handleStageKey(event: KeyboardEvent, presetPickerOpen: boolean, onStageKey: () => void): boolean {
  if (event.key !== ';' || presetPickerOpen) {
    return false;
  }

  event.preventDefault();
  onStageKey();
  return true;
}

function handleFullscreenKey(event: KeyboardEvent, toggleFullscreen: () => void): boolean {
  if ((event.key !== 'f' && event.key !== 'F') || !supportsRequestFullscreen) {
    return false;
  }

  event.preventDefault();
  toggleFullscreen();
  return true;
}

function hasCommandModifier(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey || event.altKey;
}

function getPresetDelta(event: KeyboardEvent): -1 | 1 | undefined {
  return PRESET_DELTAS[event.key] ?? PRESET_DELTAS[event.code];
}

function isEditableTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  return Boolean(element?.closest?.('input, textarea') || element?.isContentEditable);
}
