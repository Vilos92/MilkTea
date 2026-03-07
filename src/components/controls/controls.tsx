import type {RefObject} from 'preact';
import {useEffect, useRef} from 'preact/hooks';

import {Axis, useSwipe} from '../../hooks/useSwipe';
import {supportsRequestFullscreen} from '../../lib/platform';
import {useTranslate} from '../../providers/translation';
import {controlBtn, controls, controlsPill, controlsPillHovered} from './controls.css';

/*
 * Types.
 */

type ControlsProps = {
  swipeRef: RefObject<HTMLElement>;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  changePreset: (delta: number) => void;
  controlsVisible: boolean;
  controlsHovered: boolean;
  onControlsEnter: () => void;
  onControlsLeave: () => void;
};

/*
 * Component.
 */

export const Controls = ({
  swipeRef,
  isFullscreen,
  toggleFullscreen,
  changePreset,
  controlsVisible,
  controlsHovered,
  onControlsEnter,
  onControlsLeave
}: ControlsProps) => {
  const t = useTranslate();

  useSwipe(swipeRef, {
    axis: Axis.HORIZONTAL,
    onSwipeLeft: () => changePreset(1),
    onSwipeRight: () => changePreset(-1)
  });
  usePresetKeys(changePreset, toggleFullscreen);

  return (
    <div
      class={controls}
      style={{
        opacity: controlsVisible ? 1 : 0,
        pointerEvents: controlsVisible ? 'auto' : 'none'
      }}
      onMouseEnter={onControlsEnter}
      onMouseLeave={onControlsLeave}
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
        {supportsRequestFullscreen && (
          <button
            type="button"
            onClick={toggleFullscreen}
            class={controlBtn}
            aria-label={isFullscreen ? t('controls.exitFullscreen') : t('controls.enterFullscreen')}
            title={isFullscreen ? t('controls.exitFullscreen') : t('controls.enterFullscreen')}
          >
            {isFullscreen ? '✕' : '⛶'}
          </button>
        )}
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
      if (el?.closest?.('input, textarea') || el?.isContentEditable) {
        return;
      }

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
        if (supportsRequestFullscreen) {
          toggleFullscreenRef.current();
        }
      }
    };

    window.addEventListener('keydown', handleKeydown, true);

    return () => window.removeEventListener('keydown', handleKeydown, true);
  }, []);
}
