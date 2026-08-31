import type {RefObject} from 'preact';
import {useEffect, useRef, useState} from 'preact/hooks';

import {Axis, useSwipe} from '../../hooks/useSwipe';
import {supportsRequestFullscreen} from '../../lib/platform';
import type {TranslationKey} from '../../lib/translations';
import {VibrationPattern, vibrateMedium} from '../../lib/vibrate';
import {MilkTeaPanel, usePanelContext} from '../../providers/panel';
import {useTranslate} from '../../providers/translation';
import type {AudioFilePlayback} from '../../types/audio';
import {ChromelessButton} from '../chromelessButton/chromelessButton';
import {Icon} from '../icon/icon';

import {
  accentBtn,
  controlBtn,
  controls,
  controlsRow,
  divider,
  mobileBtnActive,
  progressBarInner,
  progressFill,
  progressTrack,
  progressTrackDragging,
  progressWrap,
  recordBtn,
  recordBtnActive,
  recordBtnProcessing,
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
  // Track info.
  trackName: string | undefined;
  presetName: string | undefined;
  /** When set, shows progress bar and play/pause row. `undefined` for oscillator/mic. */
  filePlayback: AudioFilePlayback | undefined;
  onPrevTrack: (() => void) | undefined;
  onNextTrack: (() => void) | undefined;
  // Recording.
  isRecording: boolean;
  /** Shows the record button in a disabled “working” state (e.g. while encoding the file). */
  isProcessingRecord: boolean;
  recordProgress: number | undefined;
  onRecord: (() => void) | undefined;
  // Preset staging.
  hasPresets: boolean;
  stagedPresetName: string | undefined;
  onFireStagedPreset: () => void;
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
  filePlayback,
  onPrevTrack,
  onNextTrack,
  isRecording,
  isProcessingRecord,
  recordProgress,
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
    onSwipeLeft: () => {
      vibrateMedium();
      changePreset(1);
    },
    onSwipeRight: () => {
      vibrateMedium();
      changePreset(-1);
    }
  });

  const handleStageClick = () => {
    if (stagedPresetName) {
      onFireStagedPreset?.();
    } else {
      togglePanel(MilkTeaPanel.PRESET_PICKER);
    }
  };
  usePresetKeys(changePreset, toggleFullscreen, {
    onStageKey: handleStageClick,
    presetPickerOpen: pickerOpen
  });

  const progressTrackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const onSeekRef = useRef(filePlayback?.onSeek);
  onSeekRef.current = filePlayback?.onSeek;
  const trackDurationRef = useRef(filePlayback?.duration);
  trackDurationRef.current = filePlayback?.duration;

  const seekFromClientX = (clientX: number) => {
    const element = progressTrackRef.current;
    const onSeek = onSeekRef.current;
    const trackDuration = trackDurationRef.current;
    if (!element || !onSeek || trackDuration == null || trackDuration <= 0) {
      return;
    }
    const rect = element.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    onSeek((x / rect.width) * trackDuration);
  };

  const startDrag = () => {
    setIsDragging(true);
  };

  const endDrag = () => {
    setIsDragging(false);
    onControlsEnter();
  };

  const handleTrackMouseDown = (event: MouseEvent) => {
    if (!filePlayback?.onSeek || filePlayback.duration <= 0) {
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
    if (!filePlayback?.onSeek || filePlayback.duration <= 0) {
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

  const hasProgress = filePlayback != null && filePlayback.duration > 0;

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
        {/* Track info. */}
        {(trackName ?? presetName) && (
          <div class={trackInfo}>
            {trackName && <div class={trackTitle}>{trackName}</div>}
            {presetName && <div class={trackPresetLabel}>preset: {presetName}</div>}
          </div>
        )}

        {/* Progress bar (file playback or offline export). */}
        {filePlayback != null && recordProgress !== undefined ? (
          <div class={progressWrap}>
            <span class={timeLabel}>{formatTime(filePlayback.duration * recordProgress)}</span>
            <div
              class={progressTrack}
              role="progressbar"
              aria-label={t('controls.processingRecord')}
              aria-valuemin={0}
              aria-valuemax={1}
              aria-valuenow={recordProgress}
            >
              <div class={progressBarInner}>
                <div class={progressFill} style={{width: `${recordProgress * 100}%`}} />
              </div>
            </div>
            <span class={[timeLabel, timeLabelRight].join(' ')}>{formatTime(filePlayback.duration)}</span>
          </div>
        ) : (
          filePlayback != null &&
          hasProgress && (
            <div class={progressWrap}>
              <span class={timeLabel}>{formatTime(filePlayback.currentTime)}</span>
              <div
                ref={progressTrackRef}
                class={isDragging ? [progressTrack, progressTrackDragging].join(' ') : progressTrack}
                role="slider"
                aria-label="Seek"
                aria-valuemin={0}
                aria-valuemax={filePlayback.duration}
                aria-valuenow={filePlayback.currentTime}
                tabIndex={0}
                onMouseDown={handleTrackMouseDown}
                onTouchStart={handleTrackTouchStart}
                onKeyDown={e => {
                  if (!filePlayback.onSeek) {
                    return;
                  }
                  if (e.key === 'ArrowRight') {
                    filePlayback.onSeek(Math.min(filePlayback.currentTime + 5, filePlayback.duration));
                  }
                  if (e.key === 'ArrowLeft') {
                    filePlayback.onSeek(Math.max(filePlayback.currentTime - 5, 0));
                  }
                }}
              >
                <div class={progressBarInner}>
                  <div
                    class={progressFill}
                    style={{
                      width: `${Math.min((filePlayback.currentTime / filePlayback.duration) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>
              <span class={[timeLabel, timeLabelRight].join(' ')}>{formatTime(filePlayback.duration)}</span>
            </div>
          )
        )}

        {/* Playback row (only when playing a file). */}
        {filePlayback != null && (
          <>
            <div class={rowLabel}>{t('controls.rowPlayback')}</div>
            <div class={controlsRow}>
              {onPrevTrack !== undefined && (
                <ChromelessButton
                  class={controlBtn}
                  pressActiveClass={mobileBtnActive}
                  vibration={VibrationPattern.LIGHT}
                  onClick={onPrevTrack}
                  aria-label={t('controls.prevTrack')}
                  title={t('controls.prevTrack')}
                >
                  <Icon type="prev-track" size="sm" />
                </ChromelessButton>
              )}
              <ChromelessButton
                class={accentBtn}
                pressActiveClass={mobileBtnActive}
                vibration={VibrationPattern.LIGHT}
                onClick={filePlayback.onPlayPause}
                aria-label={filePlayback.isPlaying ? t('controls.pause') : t('controls.play')}
                title={filePlayback.isPlaying ? t('controls.pause') : t('controls.play')}
              >
                <Icon type={filePlayback.isPlaying ? 'pause' : 'play'} size="md" />
              </ChromelessButton>
              {onNextTrack !== undefined && (
                <ChromelessButton
                  class={controlBtn}
                  pressActiveClass={mobileBtnActive}
                  vibration={VibrationPattern.LIGHT}
                  onClick={onNextTrack}
                  aria-label={t('controls.nextTrack')}
                  title={t('controls.nextTrack')}
                >
                  <Icon type="next-track" size="sm" />
                </ChromelessButton>
              )}
              {onRecord !== undefined && (
                <>
                  <div class={divider} />
                  <ChromelessButton
                    class={[
                      recordBtn,
                      isProcessingRecord && recordBtnProcessing,
                      !isProcessingRecord && isRecording && recordBtnActive
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    pressActiveClass={mobileBtnActive}
                    vibration={VibrationPattern.LIGHT}
                    disabled={isProcessingRecord}
                    aria-busy={isProcessingRecord}
                    onClick={onRecord}
                    aria-label={t(formatRecordTranslationKey(isProcessingRecord, isRecording))}
                    title={t(formatRecordTranslationKey(isProcessingRecord, isRecording))}
                  >
                    <Icon type="record" size="sm" />
                  </ChromelessButton>
                </>
              )}
            </div>
          </>
        )}

        {/* Presets row */}
        <div class={rowLabel}>{t('controls.rowPresets')}</div>
        <div class={controlsRow}>
          <ChromelessButton
            class={smallBtn}
            pressActiveClass={mobileBtnActive}
            vibration={VibrationPattern.LIGHT}
            onClick={() => changePreset(-1)}
            aria-label={t('controls.prevPreset')}
            title={t('controls.prevPreset')}
          >
            <Icon type="chevron-left" size="sm" />
          </ChromelessButton>

          {hasPresets && (
            <div class={stageWrap}>
              <ChromelessButton
                buttonRef={stageBtnRef}
                class={[stageBtn, stagedPresetName && stageBtnLoaded].filter(Boolean).join(' ')}
                pressActiveClass={mobileBtnActive}
                vibration={VibrationPattern.LIGHT}
                onClick={handleStageClick}
                aria-label={stagedPresetName ? t('controls.firePreset') : t('controls.stagePreset')}
                title={stagedPresetName ? t('controls.firePreset') : t('controls.stagePreset')}
              >
                <Icon type={stagedPresetName ? 'bookmark-check' : 'bookmark'} size="sm" />
              </ChromelessButton>
            </div>
          )}

          <ChromelessButton
            class={smallBtn}
            pressActiveClass={mobileBtnActive}
            vibration={VibrationPattern.LIGHT}
            onClick={() => changePreset(1)}
            aria-label={t('controls.nextPreset')}
            title={t('controls.nextPreset')}
          >
            <Icon type="chevron-right" size="sm" />
          </ChromelessButton>

          {supportsRequestFullscreen && (
            <ChromelessButton
              class={smallBtn}
              pressActiveClass={mobileBtnActive}
              vibration={VibrationPattern.LIGHT}
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? t('controls.exitFullscreen') : t('controls.enterFullscreen')}
              title={isFullscreen ? t('controls.exitFullscreen') : t('controls.enterFullscreen')}
            >
              <Icon type={isFullscreen ? 'exit-fullscreen' : 'enter-fullscreen'} size="sm" />
            </ChromelessButton>
          )}
        </div>
      </div>
    </>
  );
};

/*
 * Hooks.
 */

type PresetStageKeyOptions = {
  onStageKey: () => void;
  presetPickerOpen: boolean;
};

function usePresetKeys(
  changePreset: (delta: number) => void,
  toggleFullscreen: () => void,
  stageKeyOptions?: PresetStageKeyOptions
) {
  const changePresetRef = useRef(changePreset);
  changePresetRef.current = changePreset;
  const toggleFullscreenRef = useRef(toggleFullscreen);
  toggleFullscreenRef.current = toggleFullscreen;
  const onStageKeyRef = useRef(stageKeyOptions?.onStageKey);
  onStageKeyRef.current = stageKeyOptions?.onStageKey;
  const presetPickerOpenRef = useRef(stageKeyOptions?.presetPickerOpen);
  presetPickerOpenRef.current = stageKeyOptions?.presetPickerOpen;

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
      } else if (key === ';') {
        if (!presetPickerOpenRef.current && onStageKeyRef.current) {
          event.preventDefault();
          onStageKeyRef.current();
        }
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

function formatRecordTranslationKey(
  isProcessingRecord: boolean,
  isRecording: boolean | undefined
): TranslationKey {
  if (isProcessingRecord) {
    return 'controls.processingRecord';
  }
  if (isRecording) {
    return 'controls.stopRecord';
  }
  return 'controls.record';
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
