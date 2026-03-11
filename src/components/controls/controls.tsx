import type {RefObject} from 'preact';
import {useEffect, useRef, useState} from 'preact/hooks';

import {Axis, useSwipe} from '../../hooks/useSwipe';
import {supportsRequestFullscreen} from '../../lib/platform';
import {MilkTeaPanel, usePanelContext} from '../../providers/panel';
import {useTranslate} from '../../providers/translation';
import {Icon} from '../icon/icon';
import {
  accentBtn,
  controlBtn,
  controls,
  controlsRow,
  divider,
  progressBarInner,
  progressFill,
  progressTrack,
  progressTrackDragging,
  progressWrap,
  recordBtn,
  recordBtnActive,
  rowLabel,
  smallBtn,
  stageBtn,
  stageBtnLoaded,
  stageWrap,
  timeLabel,
  timeLabelRight,
  trackInfo,
  trackPresetLabel,
  trackTitle
} from './controls.css';

/*
 * Types.
 */

type ControlsProps = {
  swipeRef: RefObject<HTMLElement>;
  class?: string;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  changePreset: (delta: number) => void;
  controlsVisible: boolean;
  onControlsEnter: () => void;
  onControlsLeave: () => void;
  // Track info
  trackName?: string;
  presetName?: string;
  // Progress
  currentTime?: number;
  duration?: number;
  onSeek?: (time: number) => void;
  // Playback
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onPrevTrack?: () => void;
  onNextTrack?: () => void;
  // Recording
  isRecording?: boolean;
  onRecord?: () => void;
  // Preset staging
  hasPresets?: boolean;
  stagedPresetName?: string;
  onFireStagedPreset?: () => void;
};

/*
 * Component.
 */

export const Controls = ({
  swipeRef,
  class: className,
  isFullscreen,
  toggleFullscreen,
  changePreset,
  controlsVisible,
  onControlsEnter,
  onControlsLeave,
  trackName,
  presetName,
  currentTime,
  duration,
  onSeek,
  isPlaying,
  onPlayPause,
  onPrevTrack,
  onNextTrack,
  isRecording,
  onRecord,
  hasPresets,
  stagedPresetName,
  onFireStagedPreset
}: ControlsProps) => {
  const t = useTranslate();
  const {openPanel, togglePanel} = usePanelContext();

  const pickerOpen = openPanel === MilkTeaPanel.PRESET_PICKER;
  const stageBtnRef = useRef<HTMLButtonElement>(null);

  useSwipe(swipeRef, {
    axis: Axis.HORIZONTAL,
    onSwipeLeft: () => changePreset(1),
    onSwipeRight: () => changePreset(-1)
  });
  usePresetKeys(changePreset, toggleFullscreen);

  const handleStageClick = () => {
    if (stagedPresetName) {
      onFireStagedPreset?.();
    } else {
      togglePanel(MilkTeaPanel.PRESET_PICKER);
    }
  };

  const progressTrackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const onSeekRef = useRef(onSeek);
  onSeekRef.current = onSeek;
  const durationRef = useRef(duration);
  durationRef.current = duration;

  const seekFromClientX = (clientX: number) => {
    const element = progressTrackRef.current;
    const seek = onSeekRef.current;
    const duration = durationRef.current;
    if (!element || !seek || !duration) {
      return;
    }
    const rect = element.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    seek((x / rect.width) * duration);
  };

  const startDrag = () => {
    setIsDragging(true);
  };

  const endDrag = () => {
    setIsDragging(false);
    onControlsEnter();
  };

  const handleTrackMouseDown = (event: MouseEvent) => {
    if (!onSeek || !duration) {
      return;
    }
    event.preventDefault();
    startDrag();
    document.documentElement.style.cursor = 'grabbing';
    seekFromClientX(event.clientX);

    const onMouseMove = (ev: globalThis.MouseEvent) => {
      seekFromClientX(ev.clientX);
    };
    const onMouseUp = () => {
      endDrag();
      document.documentElement.style.cursor = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleTrackTouchStart = (event: TouchEvent) => {
    if (!onSeek || !duration) {
      return;
    }
    event.preventDefault();
    startDrag();
    seekFromClientX(event.touches[0].clientX);

    const onTouchMove = (event: globalThis.TouchEvent) => {
      seekFromClientX(event.touches[0].clientX);
    };
    const onTouchEnd = () => {
      endDrag();
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };

    document.addEventListener('touchmove', onTouchMove, {passive: false});
    document.addEventListener('touchend', onTouchEnd);
  };

  const hasProgress = typeof currentTime === 'number' && typeof duration === 'number' && duration > 0;

  return (
    <>
      <div
        class={[controls, className].filter(Boolean).join(' ')}
        style={{
          opacity: controlsVisible || isDragging || pickerOpen ? 1 : 0,
          pointerEvents: controlsVisible || isDragging || pickerOpen ? 'auto' : 'none'
        }}
        onMouseEnter={onControlsEnter}
        onMouseLeave={onControlsLeave}
      >
        {/* Track info */}
        {(trackName ?? presetName) && (
          <div class={trackInfo}>
            {trackName && <div class={trackTitle}>{trackName}</div>}
            {presetName && <div class={trackPresetLabel}>preset: {presetName}</div>}
          </div>
        )}

        {/* Progress bar */}
        {hasProgress && (
          <div class={progressWrap}>
            <span class={timeLabel}>{formatTime(currentTime!)}</span>
            <div
              ref={progressTrackRef}
              class={isDragging ? [progressTrack, progressTrackDragging].join(' ') : progressTrack}
              role="slider"
              aria-label="Seek"
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-valuenow={currentTime}
              tabIndex={0}
              onMouseDown={handleTrackMouseDown}
              onTouchStart={handleTrackTouchStart}
              onKeyDown={e => {
                if (!onSeek || !duration) {
                  return;
                }
                if (e.key === 'ArrowRight') {
                  onSeek(Math.min(currentTime! + 5, duration));
                }
                if (e.key === 'ArrowLeft') {
                  onSeek(Math.max(currentTime! - 5, 0));
                }
              }}
            >
              <div class={progressBarInner}>
                <div
                  class={progressFill}
                  style={{width: `${Math.min((currentTime! / duration!) * 100, 100)}%`}}
                />
              </div>
            </div>
            <span class={[timeLabel, timeLabelRight].join(' ')}>{formatTime(duration!)}</span>
          </div>
        )}

        {/* Playback row */}
        <div class={rowLabel}>{t('controls.rowPlayback')}</div>
        <div class={controlsRow}>
          <button
            type="button"
            class={controlBtn}
            onClick={onPrevTrack}
            aria-label={t('controls.prevTrack')}
            title={t('controls.prevTrack')}
          >
            <Icon type="prev-track" size="sm" />
          </button>
          <button
            type="button"
            class={accentBtn}
            onClick={onPlayPause}
            aria-label={isPlaying ? t('controls.pause') : t('controls.play')}
            title={isPlaying ? t('controls.pause') : t('controls.play')}
          >
            <Icon type={isPlaying ? 'pause' : 'play'} size="md" />
          </button>
          <button
            type="button"
            class={controlBtn}
            onClick={onNextTrack}
            aria-label={t('controls.nextTrack')}
            title={t('controls.nextTrack')}
          >
            <Icon type="next-track" size="sm" />
          </button>
          {onRecord !== undefined && (
            <>
              <div class={divider} />
              <button
                type="button"
                class={isRecording ? [recordBtn, recordBtnActive].join(' ') : recordBtn}
                onClick={onRecord}
                aria-label={isRecording ? t('controls.stopRecord') : t('controls.record')}
                title={isRecording ? t('controls.stopRecord') : t('controls.record')}
              >
                <Icon type="record" size="sm" />
              </button>
            </>
          )}
        </div>

        {/* Presets row */}
        <div class={rowLabel}>{t('controls.rowPresets')}</div>
        <div class={controlsRow}>
          <button
            type="button"
            class={smallBtn}
            onClick={() => changePreset(-1)}
            aria-label={t('controls.prevPreset')}
            title={t('controls.prevPreset')}
          >
            <Icon type="chevron-left" size="sm" />
          </button>

          {hasPresets && (
            <div class={stageWrap}>
              <button
                ref={stageBtnRef}
                type="button"
                class={stagedPresetName ? [stageBtn, stageBtnLoaded].join(' ') : stageBtn}
                onClick={handleStageClick}
                aria-label={stagedPresetName ? t('controls.firePreset') : t('controls.stagePreset')}
                title={stagedPresetName ? t('controls.firePreset') : t('controls.stagePreset')}
              >
                <Icon type={stagedPresetName ? 'bookmark-check' : 'bookmark'} size="sm" />
              </button>
            </div>
          )}

          <button
            type="button"
            class={smallBtn}
            onClick={() => changePreset(1)}
            aria-label={t('controls.nextPreset')}
            title={t('controls.nextPreset')}
          >
            <Icon type="chevron-right" size="sm" />
          </button>

          {supportsRequestFullscreen && (
            <button
              type="button"
              class={smallBtn}
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? t('controls.exitFullscreen') : t('controls.enterFullscreen')}
              title={isFullscreen ? t('controls.exitFullscreen') : t('controls.enterFullscreen')}
            >
              <Icon type={isFullscreen ? 'exit-fullscreen' : 'enter-fullscreen'} size="sm" />
            </button>
          )}
        </div>
      </div>
    </>
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

/*
 * Helpers.
 */

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
