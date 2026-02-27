import type {RefObject} from 'preact';
import {useEffect, useRef, useState} from 'preact/hooks';

import {useSwipe} from '../../hooks/useSwipe.ts';
import {useTranslate} from '../../provider/translation.tsx';
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
  const t = useTranslate();
  const {controlsVisible, controlsHovered, handleControlsEnter, handleControlsLeave} =
    useControls(setControlsVisibility);

  useSwipe(
    overlayRef,
    () => changePreset(1),
    () => changePreset(-1)
  );
  usePresetKeys(changePreset, toggleFullscreen);

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
          aria-label={t('controls.prevPreset')}
          title={t('controls.prevPreset')}
        >
          ‹
        </button>
        <button
          type="button"
          onClick={toggleFullscreen}
          class={controlBtn}
          aria-label={isFullscreen ? t('controls.exitFullscreen') : t('controls.enterFullscreen')}
          title={isFullscreen ? t('controls.exitFullscreen') : t('controls.enterFullscreen')}
        >
          {isFullscreen ? '✕' : '⛶'}
        </button>
        <button
          type="button"
          onClick={() => changePreset(1)}
          class={controlBtn}
          aria-label={t('controls.nextPreset')}
          title={t('controls.nextPreset')}
        >
          ›
        </button>
      </div>
    </div>
  );
};

/*
 * Hooks.
 */

function usePresetKeys(changePreset: (delta: number) => void, toggleFullscreen: () => void) {
  const changePresetRef = useRef(changePreset);
  changePresetRef.current = changePreset;
  const toggleFullscreenRef = useRef(toggleFullscreen);
  toggleFullscreenRef.current = toggleFullscreen;

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const el = event.target as HTMLElement;
      if (el?.closest?.('input, textarea') || el?.isContentEditable) return;

      const key = event.key;
      const code = event.code;
      const isPrev =
        key === 'ArrowLeft' ||
        key === 'a' ||
        key === 'A' ||
        code === 'KeyA' ||
        key === 'h' ||
        key === 'H' ||
        code === 'KeyH';
      const isNext =
        key === 'ArrowRight' ||
        key === 'd' ||
        key === 'D' ||
        code === 'KeyD' ||
        key === 'l' ||
        key === 'L' ||
        code === 'KeyL';

      if (isPrev) {
        event.preventDefault();
        changePresetRef.current(-1);
      } else if (isNext) {
        event.preventDefault();
        changePresetRef.current(1);
      } else if (key === 'f' || key === 'F') {
        event.preventDefault();
        toggleFullscreenRef.current();
      }
    };

    window.addEventListener('keydown', handleKeydown, true);

    return () => window.removeEventListener('keydown', handleKeydown, true);
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
