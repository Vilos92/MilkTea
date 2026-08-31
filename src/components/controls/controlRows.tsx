import type {RefObject} from 'preact';
import {useRef} from 'preact/hooks';

import {supportsRequestFullscreen} from '../../lib/platform';
import {VibrationPattern} from '../../lib/vibrate';
import {MilkTeaPanel, usePanelContext} from '../../providers/panel';
import {useTranslate} from '../../providers/translation';
import type {AudioFilePlayback} from '../../types/audio';
import {ChromelessButton} from '../chromelessButton/chromelessButton';
import {Icon} from '../icon/icon';
import {usePresetKeys} from './usePresetKeys';

import {
  accentBtn,
  controlBtn,
  controlsRow,
  divider,
  mobileBtnActive,
  recordBtn,
  recordBtnActive,
  recordBtnProcessing,
  rowLabel,
  smallBtn,
  stageBtn,
  stageBtnLoaded,
  stageWrap
} from './controls.css';

/*
 * Types.
 */

type PlaybackControlsProps = {
  filePlayback: AudioFilePlayback;
  onPrevTrack: (() => void) | undefined;
  onNextTrack: (() => void) | undefined;
  isRecording: boolean;
  isProcessingRecord: boolean;
  onRecord: (() => void) | undefined;
};

type PresetControlsProps = {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  changePreset: (delta: number) => void;
  hasPresets: boolean;
  stagedPresetName: string | undefined;
  onFireStagedPreset: () => void;
};

/*
 * Component.
 */

export function PlaybackControls({
  filePlayback,
  onPrevTrack,
  onNextTrack,
  isRecording,
  isProcessingRecord,
  onRecord
}: PlaybackControlsProps) {
  const t = useTranslate();
  return (
    <>
      <div class={rowLabel}>{t('controls.rowPlayback')}</div>
      <div class={controlsRow}>
        <OptionalTrackButton type="prev-track" label={t('controls.prevTrack')} onClick={onPrevTrack} />
        <PlaybackToggle filePlayback={filePlayback} />
        <OptionalTrackButton type="next-track" label={t('controls.nextTrack')} onClick={onNextTrack} />
        <RecordControl
          isProcessingRecord={isProcessingRecord}
          isRecording={isRecording}
          onRecord={onRecord}
        />
      </div>
    </>
  );
}

export function PresetControls({
  isFullscreen,
  toggleFullscreen,
  changePreset,
  hasPresets,
  stagedPresetName,
  onFireStagedPreset
}: PresetControlsProps) {
  const t = useTranslate();
  const {stagePreset, pickerOpen, stageBtnRef} = usePresetStage(stagedPresetName, onFireStagedPreset);
  usePresetKeys(changePreset, toggleFullscreen, {onStageKey: stagePreset, presetPickerOpen: pickerOpen});

  return (
    <>
      <div class={rowLabel}>{t('controls.rowPresets')}</div>
      <div class={controlsRow}>
        <PresetButton delta={-1} label={t('controls.prevPreset')} onClick={changePreset} />
        {hasPresets && (
          <StagePresetButton
            stagedPresetName={stagedPresetName}
            stagePreset={stagePreset}
            stageBtnRef={stageBtnRef}
          />
        )}
        <PresetButton delta={1} label={t('controls.nextPreset')} onClick={changePreset} />
        <FullscreenButton isFullscreen={isFullscreen} toggleFullscreen={toggleFullscreen} />
      </div>
    </>
  );
}

function OptionalTrackButton({
  type,
  label,
  onClick
}: {
  type: 'prev-track' | 'next-track';
  label: string;
  onClick: (() => void) | undefined;
}) {
  if (!onClick) {
    return null;
  }
  return <TrackButton type={type} label={label} onClick={onClick} />;
}

function PlaybackToggle({filePlayback}: {filePlayback: AudioFilePlayback}) {
  const t = useTranslate();
  const isPlaying = filePlayback.isPlaying;
  const label = t(isPlaying ? 'controls.pause' : 'controls.play');
  return (
    <ChromelessButton
      class={accentBtn}
      pressActiveClass={mobileBtnActive}
      vibration={VibrationPattern.LIGHT}
      onClick={filePlayback.onPlayPause}
      aria-label={label}
      title={label}
    >
      <Icon type={isPlaying ? 'pause' : 'play'} size="md" />
    </ChromelessButton>
  );
}

function RecordControl({
  isProcessingRecord,
  isRecording,
  onRecord
}: {
  isProcessingRecord: boolean;
  isRecording: boolean;
  onRecord: (() => void) | undefined;
}) {
  if (!onRecord) {
    return null;
  }
  return (
    <>
      <div class={divider} />
      <RecordButton isProcessingRecord={isProcessingRecord} isRecording={isRecording} onRecord={onRecord} />
    </>
  );
}

function RecordButton({
  isProcessingRecord,
  isRecording,
  onRecord
}: {
  isProcessingRecord: boolean;
  isRecording: boolean;
  onRecord: () => void;
}) {
  const t = useTranslate();
  const key = getRecordTranslationKey(isProcessingRecord, isRecording);
  return (
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
      aria-label={t(key)}
      title={t(key)}
    >
      <Icon type="record" size="sm" />
    </ChromelessButton>
  );
}

function StagePresetButton({
  stagedPresetName,
  stagePreset,
  stageBtnRef
}: {
  stagedPresetName: string | undefined;
  stagePreset: () => void;
  stageBtnRef: RefObject<HTMLButtonElement>;
}) {
  const t = useTranslate();
  const isLoaded = stagedPresetName !== undefined;
  const label = t(isLoaded ? 'controls.firePreset' : 'controls.stagePreset');
  return (
    <div class={stageWrap}>
      <ChromelessButton
        buttonRef={stageBtnRef}
        class={[stageBtn, isLoaded && stageBtnLoaded].filter(Boolean).join(' ')}
        pressActiveClass={mobileBtnActive}
        vibration={VibrationPattern.LIGHT}
        onClick={stagePreset}
        aria-label={label}
        title={label}
      >
        <Icon type={isLoaded ? 'bookmark-check' : 'bookmark'} size="sm" />
      </ChromelessButton>
    </div>
  );
}

function FullscreenButton({
  isFullscreen,
  toggleFullscreen
}: {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}) {
  const t = useTranslate();
  if (!supportsRequestFullscreen) {
    return null;
  }
  const label = t(isFullscreen ? 'controls.exitFullscreen' : 'controls.enterFullscreen');
  return (
    <ChromelessButton
      class={smallBtn}
      pressActiveClass={mobileBtnActive}
      vibration={VibrationPattern.LIGHT}
      onClick={toggleFullscreen}
      aria-label={label}
      title={label}
    >
      <Icon type={isFullscreen ? 'exit-fullscreen' : 'enter-fullscreen'} size="sm" />
    </ChromelessButton>
  );
}

function TrackButton({
  type,
  label,
  onClick
}: {
  type: 'prev-track' | 'next-track';
  label: string;
  onClick: () => void;
}) {
  return (
    <ChromelessButton
      class={controlBtn}
      pressActiveClass={mobileBtnActive}
      vibration={VibrationPattern.LIGHT}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <Icon type={type} size="sm" />
    </ChromelessButton>
  );
}

function PresetButton({
  delta,
  label,
  onClick
}: {
  delta: -1 | 1;
  label: string;
  onClick: (delta: number) => void;
}) {
  return (
    <ChromelessButton
      class={smallBtn}
      pressActiveClass={mobileBtnActive}
      vibration={VibrationPattern.LIGHT}
      onClick={() => onClick(delta)}
      aria-label={label}
      title={label}
    >
      <Icon type={delta < 0 ? 'chevron-left' : 'chevron-right'} size="sm" />
    </ChromelessButton>
  );
}

/*
 * Hooks.
 */

function usePresetStage(stagedPresetName: string | undefined, onFireStagedPreset: () => void) {
  const {openPanel, togglePanel} = usePanelContext();
  const stageBtnRef = useRef<HTMLButtonElement>(null);
  const stagePreset = () => {
    if (stagedPresetName) {
      onFireStagedPreset();
      return;
    }
    togglePanel(MilkTeaPanel.PRESET_PICKER);
  };
  return {stagePreset, pickerOpen: openPanel === MilkTeaPanel.PRESET_PICKER, stageBtnRef};
}

/*
 * Helpers.
 */

function getRecordTranslationKey(isProcessingRecord: boolean, isRecording: boolean) {
  if (isProcessingRecord) {
    return 'controls.processingRecord' as const;
  }
  if (isRecording) {
    return 'controls.stopRecord' as const;
  }
  return 'controls.record' as const;
}
