import {useEffect, useRef, useState} from 'preact/hooks';

import {controlBtn, controls, controlsPill, controlsPillHovered} from './controls.css.ts';

/*
 * Types.
 */

type ControlsProps = {
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
  isFullscreen,
  toggleFullscreen,
  setControlsVisibility,
  changePreset
}: ControlsProps) => {
  const {controlsVisible, controlsHovered, handleControlsEnter, handleControlsLeave} =
    useControls(setControlsVisibility);

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
    scheduleFadeOut();

    return () => {
      window.removeEventListener('mousemove', showControls);
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
