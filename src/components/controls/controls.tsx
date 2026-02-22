import type {RefObject} from 'preact';
import {useEffect, useRef, useState} from 'preact/hooks';

import {useSwipe} from '../../hooks/useSwipe.ts';
import {controlBtn, controls, controlsPill, controlsPillHovered} from './controls.css.ts';

/*
 * Types.
 */

type ControlsProps = {
  overlayRef: RefObject<HTMLElement>;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  setControlsVisibility: (visibility: boolean) => void;
  changePreset: (delta: number) => void;
};

/*
 * Constants.
 */

const CONTROLS_FADE_DELAY_MS = 2500;

/*
 * Component.
 */

export const Controls = ({
  overlayRef,
  isFullscreen,
  toggleFullscreen,
  setControlsVisibility,
  changePreset
}: ControlsProps) => {
  const {controlsVisible, controlsHovered, handleControlsEnter, handleControlsLeave} =
    useControls(setControlsVisibility);

  useSwipe(
    overlayRef,
    () => changePreset(1),
    () => changePreset(-1)
  );
  usePresetKeys(changePreset);

  return (
    <div
      class={controls}
      style={{
        opacity: controlsVisible ? 1 : 0,
        pointerEvents: controlsVisible ? 'auto' : 'none'
      }}
      onMouseEnter={handleControlsEnter}
      onMouseLeave={handleControlsLeave}
    >
      <div class={controlsHovered ? [controlsPill, controlsPillHovered].join(' ') : controlsPill}>
        <button
          type="button"
          onClick={() => changePreset(-1)}
          class={controlBtn}
          aria-label="Previous preset"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={toggleFullscreen}
          class={controlBtn}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? '✕' : '⛶'}
        </button>
        <button type="button" onClick={() => changePreset(1)} class={controlBtn} aria-label="Next preset">
          ›
        </button>
      </div>
    </div>
  );
};

/*
 * Hooks.
 */

function usePresetKeys(changePreset: (delta: number) => void) {
  const changePresetRef = useRef(changePreset);
  changePresetRef.current = changePreset;

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        changePresetRef.current(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        changePresetRef.current(1);
      }
    };

    window.addEventListener('keydown', handleKeydown);

    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);
}

function useControls(setControlsVisibility: (visibility: boolean) => void) {
  const [controlsVisible, setControlsVisible] = useState(true);
  const [controlsHovered, setControlsHovered] = useState(false);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleFadeOutRef = useRef<(() => void) | null>(null);
  const onVisibleChangeRef = useRef(setControlsVisibility);
  onVisibleChangeRef.current = setControlsVisibility;

  const notifyVisible = (visible: boolean) => {
    setControlsVisible(visible);
    onVisibleChangeRef.current?.(visible);
  };

  useEffect(() => {
    const scheduleFadeOut = () => {
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = setTimeout(() => notifyVisible(false), CONTROLS_FADE_DELAY_MS);
    };
    scheduleFadeOutRef.current = scheduleFadeOut;

    const showControls = () => {
      notifyVisible(true);
      scheduleFadeOut();
    };

    window.addEventListener('mousemove', showControls);
    window.addEventListener('touchstart', showControls, {passive: true});
    scheduleFadeOut();

    return () => {
      window.removeEventListener('mousemove', showControls);
      window.removeEventListener('touchstart', showControls);
      scheduleFadeOutRef.current = null;
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, []);

  const handleControlsEnter = () => {
    setControlsHovered(true);
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
    notifyVisible(true);
    scheduleFadeOutRef.current?.();
  };

  const handleControlsLeave = () => {
    setControlsHovered(false);
    scheduleFadeOutRef.current?.();
  };

  return {
    controlsVisible,
    controlsHovered,
    handleControlsEnter,
    handleControlsLeave
  };
}
