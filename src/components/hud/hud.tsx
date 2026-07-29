import type {RefObject} from 'preact';
import {useEffect} from 'preact/hooks';

import {MilkTeaPanel, usePanelContext} from '../../providers/panel';
import type {AudioFilePlayback} from '../../types/audio';
import {AudioSource} from '../../types/audio';
import {AudioSourceButtons} from '../audioSourceButtons/audioSourceButtons';
import {CommandPaletteButton} from '../commandPalette/commandPaletteButton';
import {Controls} from '../controls/controls';
import {HelpButton} from '../help/helpButton';

import {
  hudFaded as fadedClass,
  topCorner,
  topLeftCorner,
  topRightCorner,
  hudVisible as visibleClass
} from './hud.css';

/*
 * Types.
 */

type HudProps = {
  // Layout and controls.
  swipeRef: RefObject<HTMLElement>;
  started: boolean;
  isCanvasFullscreen: boolean;
  toggleFullscreen: () => void;
  changePreset: (delta: number) => void;
  // HUD visibility.
  isHudVisible: boolean;
  onControlsEnter: () => void;
  onControlsLeave: () => void;
  forceVisible: () => void;
  // Audio source.
  fileInputRef: RefObject<HTMLInputElement>;
  onFileChange: (event: Event) => void;
  audioSource: AudioSource;
  pendingAudioSource: AudioSource | undefined;
  onSourceChange: (source: AudioSource) => void;
  // Track info.
  trackName: string | undefined;
  presetName: string | undefined;
  // File playback (progress, play/pause). Only shown if audio source is file.
  filePlayback: AudioFilePlayback | undefined;
  // Recording.
  isRecording: boolean;
  isProcessingRecord: boolean;
  onRecord: () => void;
  // Preset staging.
  hasPresets: boolean;
  stagedPresetName: string | undefined;
  onFireStagedPreset: () => void;
};

/*
 * Component.
 */

export function Hud({
  swipeRef,
  started,
  isCanvasFullscreen,
  toggleFullscreen,
  changePreset,
  isHudVisible: isHudVisibleParam,
  onControlsEnter,
  onControlsLeave,
  forceVisible,
  fileInputRef,
  onFileChange,
  audioSource,
  pendingAudioSource,
  onSourceChange,
  trackName,
  presetName,
  filePlayback,
  isRecording,
  isProcessingRecord,
  onRecord,
  hasPresets,
  stagedPresetName,
  onFireStagedPreset
}: HudProps) {
  const {openPanel, togglePanel} = usePanelContext();

  useEffect(() => {
    if (openPanel !== MilkTeaPanel.NONE) {
      forceVisible();
    }
  }, [openPanel, forceVisible]);

  const isHudVisible = isHudVisibleParam || !started || openPanel !== MilkTeaPanel.NONE;
  const visibilityClass = isHudVisible ? visibleClass : fadedClass;

  return (
    <>
      <CommandPaletteButton
        class={[topCorner, topLeftCorner, visibilityClass].join(' ')}
        alwaysLight={started}
        active={openPanel === MilkTeaPanel.COMMAND_PALETTE}
        onOpen={() => togglePanel(MilkTeaPanel.COMMAND_PALETTE)}
      />
      <AudioSourceButtons
        class={visibilityClass}
        fileInputRef={fileInputRef}
        onFileChange={onFileChange}
        audioSource={audioSource}
        pendingAudioSource={pendingAudioSource}
        started={started}
        onSourceChange={onSourceChange}
      />
      <HelpButton
        class={[topCorner, topRightCorner, visibilityClass].join(' ')}
        alwaysLight={started}
        active={openPanel === MilkTeaPanel.HELP}
        onOpen={() => togglePanel(MilkTeaPanel.HELP)}
      />
      {started && (
        <Controls
          swipeRef={swipeRef}
          isFullscreen={isCanvasFullscreen}
          toggleFullscreen={toggleFullscreen}
          changePreset={changePreset}
          controlsVisible={isHudVisible}
          onControlsEnter={onControlsEnter}
          onControlsLeave={onControlsLeave}
          trackName={trackName}
          presetName={presetName}
          filePlayback={filePlayback}
          onPrevTrack={undefined}
          onNextTrack={undefined}
          isRecording={isRecording}
          isProcessingRecord={isProcessingRecord}
          onRecord={onRecord}
          hasPresets={hasPresets}
          stagedPresetName={stagedPresetName}
          onFireStagedPreset={onFireStagedPreset}
        />
      )}
    </>
  );
}
