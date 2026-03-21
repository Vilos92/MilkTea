import {useCallback, useEffect, useMemo, useRef, useState} from 'preact/hooks';

import {container, containerSplash, containerStarted, cursorHidden} from './app.css.ts';
import {CommandPalette} from './components/commandPalette/commandPalette';
import {DragArea} from './components/dragArea/dragArea';
import {Help} from './components/help/help';
import {Hud} from './components/hud/hud';
import {PresetPicker} from './components/presetPicker/presetPicker';
import {Splash} from './components/splash/splash';
import {Visualizer} from './components/visualizer/visualizer';
import {useAudioSource} from './hooks/useAudioSource';
import {useButterchurn} from './hooks/useButterchurn';
import {type RecordingProcessedPayload, type RenderConfig, useRecorder} from './hooks/useRecorder';
import {vibrateHeavy, vibrateLight, vibrateMedium} from './lib/vibrate';
import {
  DEFAULT_MAIN_RECORD_BPP,
  DEFAULT_VIDEO_FPS,
  DEFAULT_VIDEO_SIZE_PRESET,
  VIDEO_FORMAT_OPTIONS,
  sizeFromVideoPreset
} from './lib/video';
import {MilkTeaPanel, usePanelContext} from './providers/panel';
import {useSettingsContext} from './providers/settings';
import {AudioSource} from './types/audio';

/*
 * Constants.
 */

const HUD_FADE_DELAY_MS = 2500;

const RENDER_CONFIG: RenderConfig = {
  ...sizeFromVideoPreset(DEFAULT_VIDEO_SIZE_PRESET),
  fps: DEFAULT_VIDEO_FPS,
  bpp: DEFAULT_MAIN_RECORD_BPP,
  format: VIDEO_FORMAT_OPTIONS[0].id,
  baseName: 'milktea'
};

/*
 * MilkTea.
 */

export function MilkTea() {
  const {openPanel, setOpenPanel} = usePanelContext();
  const {shouldShowTrackName, shouldShowPresetName} = useSettingsContext();

  const {
    containerRef,
    canvasRef,
    started,
    start,
    presetName,
    presetKeys,
    presetNameToIndex,
    loadPresetByIndex,
    changePreset: changePresetRaw,
    connectAudioBuffer,
    connectOscillator,
    connectMediaStream,
    audioStreamRef,
    filePlayback: filePlaybackRaw,
    isCanvasFullscreen,
    toggleFullscreen: toggleFullscreenRaw,
    resizeCanvas
  } = useButterchurn();

  const changePreset = useCallback(
    (delta: number) => {
      changePresetRaw(delta);
      vibrateLight();
    },
    [changePresetRaw]
  );

  const toggleFullscreen = useCallback(() => {
    toggleFullscreenRaw();
    vibrateMedium();
  }, [toggleFullscreenRaw]);

  const [stagedPreset, setStagedPresetRaw] = useState<string | undefined>(undefined);

  const stagePreset = useCallback((item: string) => {
    setStagedPresetRaw(item);
    vibrateLight();
  }, []);

  const {hudVisible, handleControlsEnter, handleControlsLeave, forceVisible, scheduleFade} =
    useHudVisibility();

  const closePanel = () => {
    setOpenPanel(MilkTeaPanel.NONE);
    scheduleFade();
  };

  const fireStagedPresetRaw = useCallback(() => {
    if (!stagedPreset) {
      return false;
    }
    const targetIndex = presetNameToIndex.get(stagedPreset);
    if (targetIndex !== undefined) {
      loadPresetByIndex(targetIndex);
    }
    setStagedPresetRaw(undefined);
    return targetIndex !== undefined;
  }, [stagedPreset, presetNameToIndex, loadPresetByIndex]);

  const fireStagedPreset = useCallback(() => {
    if (fireStagedPresetRaw()) {
      vibrateHeavy();
    }
  }, [fireStagedPresetRaw]);

  const {
    audioSource,
    pendingAudioSource,
    trackName,
    audioFilePlayback: audioFilePlaybackRaw,
    fileInputRef,
    onAudioFileChange,
    handleAudioFileDrop,
    handleSourceChange
  } = useAudioSource({
    connectAudioBuffer,
    connectOscillator,
    connectMediaStream,
    onAudioFile: start,
    filePlayback: filePlaybackRaw
  });

  const filePlayback = useMemo(() => {
    if (!audioFilePlaybackRaw) {
      return undefined;
    }
    const {onPlayPause: onPlayPauseRaw, ...rest} = audioFilePlaybackRaw;
    return {
      ...rest,
      onPlayPause: () => {
        onPlayPauseRaw();
        vibrateMedium();
      }
    };
  }, [audioFilePlaybackRaw]);

  const onRecordingStopped = useCallback(() => {
    void resizeCanvas({width: window.innerWidth, height: window.innerHeight});
  }, [resizeCanvas]);

  const onRecordingProcessed = useCallback(({blob, suggestedFilename}: RecordingProcessedPayload) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedFilename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const {
    recordState,
    startRecord: startRecordRaw,
    stopRecord
  } = useRecorder(canvasRef, audioStreamRef, RENDER_CONFIG, onRecordingStopped, onRecordingProcessed);

  const startRecord = useCallback(async () => {
    await resizeCanvas(sizeFromVideoPreset(DEFAULT_VIDEO_SIZE_PRESET));
    startRecordRaw();
  }, [resizeCanvas, startRecordRaw]);

  const onRecord = useCallback(() => {
    if (recordState === 'recording') {
      stopRecord();
      return;
    }
    if (recordState === 'processing') {
      return;
    }
    void startRecord();
  }, [recordState, startRecord, stopRecord]);

  const isRecording = recordState === 'recording';
  const isProcessingRecord = recordState === 'processing';

  useEffect(() => {
    if (started) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        start();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [started, start]);

  useEffect(() => {
    if (!started || !filePlayback) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== ' ') {
        return;
      }
      const el = event.target as HTMLElement;
      if (el?.closest?.('input, textarea') || el?.isContentEditable) {
        return;
      }
      event.preventDefault();
      filePlayback.onPlayPause();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [started, filePlayback]);

  const renderPanel = () => {
    switch (openPanel) {
      case MilkTeaPanel.COMMAND_PALETTE:
        return (
          <CommandPalette
            visualizerActive={started}
            onClose={closePanel}
            onOpenHelp={() => setOpenPanel(MilkTeaPanel.HELP)}
            onPrevPreset={() => changePreset(-1)}
            onNextPreset={() => changePreset(1)}
            isFullscreen={isCanvasFullscreen}
            onFullScreen={toggleFullscreen}
            onOpenFilePicker={() => {
              fileInputRef.current?.click();
            }}
            onSelectOscillator={() => handleSourceChange(AudioSource.OSCILLATOR)}
            onSelectMic={() => handleSourceChange(AudioSource.MICROPHONE)}
            onSelectAudioCapture={() => handleSourceChange(AudioSource.SCREEN_CAPTURE)}
            filePlayback={filePlayback}
            hasPresets={presetKeys.length > 0}
            stagedPresetName={stagedPreset}
            onOpenPresetPicker={() => setOpenPanel(MilkTeaPanel.PRESET_PICKER)}
            onFireStagedPreset={fireStagedPreset}
          />
        );
      case MilkTeaPanel.HELP:
        return (
          <Help
            visualizerActive={started}
            presetName={presetName}
            trackName={trackName}
            onClose={closePanel}
          />
        );
      case MilkTeaPanel.PRESET_PICKER:
        return (
          <PresetPicker
            items={presetKeys}
            selectedItem={stagedPreset}
            onSelect={stagePreset}
            onClose={closePanel}
          />
        );
      case MilkTeaPanel.NONE:
      default:
        return null;
    }
  };

  const containerClass = [container, started ? containerStarted : containerSplash];
  if (started && !hudVisible && openPanel === MilkTeaPanel.NONE) {
    containerClass.push(cursorHidden);
  }
  const containerClassName = containerClass.join(' ');

  return (
    <DragArea handleDrop={handleAudioFileDrop}>
      <div ref={containerRef} class={containerClassName}>
        <Visualizer canvasRef={canvasRef} />
        {!started && <Splash start={start} />}
        <Hud
          swipeRef={containerRef}
          started={started}
          isCanvasFullscreen={isCanvasFullscreen}
          toggleFullscreen={toggleFullscreen}
          changePreset={changePreset}
          isHudVisible={hudVisible}
          onControlsEnter={handleControlsEnter}
          onControlsLeave={handleControlsLeave}
          forceVisible={forceVisible}
          fileInputRef={fileInputRef}
          onFileChange={onAudioFileChange}
          audioSource={audioSource}
          pendingAudioSource={pendingAudioSource}
          onSourceChange={handleSourceChange}
          trackName={shouldShowTrackName ? trackName : undefined}
          presetName={shouldShowPresetName ? presetName : undefined}
          filePlayback={filePlayback}
          isRecording={isRecording}
          isProcessingRecord={isProcessingRecord}
          onRecord={onRecord}
          hasPresets={presetKeys.length > 0}
          stagedPresetName={stagedPreset}
          onFireStagedPreset={fireStagedPreset}
        />
        {renderPanel()}
      </div>
    </DragArea>
  );
}

/*
 * Hooks.
 */

function useHudVisibility() {
  const [hudVisible, setHudVisible] = useState(true);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleFadeOutRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const scheduleFadeOut = () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
      fadeTimeoutRef.current = setTimeout(() => setHudVisible(false), HUD_FADE_DELAY_MS);
    };
    scheduleFadeOutRef.current = scheduleFadeOut;

    const showControls = () => {
      setHudVisible(true);
      scheduleFadeOut();
    };

    window.addEventListener('mousemove', showControls);
    window.addEventListener('touchstart', showControls, {passive: true});
    scheduleFadeOut();

    return () => {
      window.removeEventListener('mousemove', showControls);
      window.removeEventListener('touchstart', showControls);
      scheduleFadeOutRef.current = null;
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, []);

  const handleControlsEnter = () => {
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
    setHudVisible(true);
    scheduleFadeOutRef.current?.();
  };

  const handleControlsLeave = () => {
    scheduleFadeOutRef.current?.();
  };

  const forceVisible = useCallback(() => {
    setHudVisible(true);
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
  }, []);

  const scheduleFade = useCallback(() => {
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
    }
    fadeTimeoutRef.current = setTimeout(() => setHudVisible(false), HUD_FADE_DELAY_MS);
  }, []);

  return {hudVisible, handleControlsEnter, handleControlsLeave, forceVisible, scheduleFade};
}
