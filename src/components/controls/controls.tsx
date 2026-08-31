import type {RefObject} from 'preact';
import {useState} from 'preact/hooks';

import {Axis, useSwipe} from '../../hooks/useSwipe';
import {vibrateMedium} from '../../lib/vibrate';
import {MilkTeaPanel, usePanelContext} from '../../providers/panel';
import type {AudioFilePlayback} from '../../types/audio';
import {PlaybackControls, PresetControls} from './controlRows';
import {PlaybackProgress} from './playbackProgress';

import {controls, trackInfo, trackPresetLabel, trackTitle} from './controls.css';

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
  trackName: string | undefined;
  presetName: string | undefined;
  filePlayback: AudioFilePlayback | undefined;
  onPrevTrack: (() => void) | undefined;
  onNextTrack: (() => void) | undefined;
  isRecording: boolean;
  isProcessingRecord: boolean;
  recordProgress: number | undefined;
  onRecord: (() => void) | undefined;
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
  const {openPanel} = usePanelContext();
  const pickerOpen = openPanel === MilkTeaPanel.PRESET_PICKER;
  const [isDragging, setIsDragging] = useState(false);

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

  const isVisible = controlsVisible || isDragging || pickerOpen;
  return (
    <div
      class={[controls, className].filter(Boolean).join(' ')}
      style={{
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
      onMouseEnter={onControlsEnter}
      onMouseLeave={onControlsLeave}
    >
      {(trackName ?? presetName) && (
        <div class={trackInfo}>
          {trackName && <div class={trackTitle}>{trackName}</div>}
          {presetName && <div class={trackPresetLabel}>preset: {presetName}</div>}
        </div>
      )}
      {filePlayback && (
        <PlaybackProgress
          filePlayback={filePlayback}
          recordProgress={recordProgress}
          onControlsEnter={onControlsEnter}
          onDragChange={setIsDragging}
        />
      )}
      {filePlayback && (
        <PlaybackControls
          filePlayback={filePlayback}
          onPrevTrack={onPrevTrack}
          onNextTrack={onNextTrack}
          isRecording={isRecording}
          isProcessingRecord={isProcessingRecord}
          onRecord={onRecord}
        />
      )}
      <PresetControls
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        changePreset={changePreset}
        hasPresets={hasPresets}
        stagedPresetName={stagedPresetName}
        onFireStagedPreset={onFireStagedPreset}
      />
    </div>
  );
};
