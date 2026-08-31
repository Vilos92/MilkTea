import type {RefObject} from 'preact';
import {useCallback, useEffect, useRef, useState} from 'preact/hooks';

import {container, containerSplash, containerStarted, cursorHidden} from './app.css.ts';
import {CommandPalette} from './components/commandPalette/commandPalette';
import {DragArea} from './components/dragArea/dragArea';
import {ExportOverlay} from './components/exportOverlay/exportOverlay';
import {Help} from './components/help/help';
import {Hud} from './components/hud/hud';
import {PresetPicker} from './components/presetPicker/presetPicker';
import {Splash} from './components/splash/splash';
import {Visualizer} from './components/visualizer/visualizer';
import type {OfflineExportState} from './hooks/offlineExportTypes';
import {useAudioSource} from './hooks/useAudioSource';
import {useButterchurn} from './hooks/useButterchurn';
import {useCyclePresets} from './hooks/useCyclePresets';
import {useExportController} from './hooks/useExportController';
import {useMilkTeaKeyboard} from './hooks/useMilkTeaKeyboard';
import {themePageBackground} from './lib/theme';
import {vibrateHeavy} from './lib/vibrate';
import type {RenderConfig} from './lib/video';
import {
  DEFAULT_MAIN_RECORD_BPP,
  DEFAULT_VIDEO_FPS,
  DEFAULT_VIDEO_SIZE_PRESET,
  VIDEO_FORMAT_OPTIONS,
  sizeFromVideoPreset
} from './lib/video';
import {MilkTeaPanel, usePanelContext} from './providers/panel';
import {useSettingsContext} from './providers/settings';
import {useThemeContext} from './providers/theme';
import {AudioSource} from './types/audio';
import type {AudioFilePlayback} from './types/audio';

/*
 * Types.
 */

type ExportLayerProps = {
  canvasRef: RefObject<HTMLCanvasElement>;
  isPreviewVisible: boolean;
  isOverlayVisible: boolean;
  progress: number;
  duration: number | undefined;
  state: OfflineExportState;
  cancel: () => void;
  onRetry: () => void;
  closeDownload: () => void;
  download: {url: string; filename: string} | undefined;
};

type CommandPanelProps = {
  started: boolean;
  closePanel: () => void;
  setOpenPanel: (panel: MilkTeaPanel) => void;
  changePreset: (delta: number) => void;
  isCanvasFullscreen: boolean;
  toggleFullscreen: () => void;
  openFilePicker: () => void;
  handleSourceChange: (source: AudioSource) => void;
  audioFilePlayback: AudioFilePlayback | undefined;
  hasPresets: boolean;
  stagedPreset: string | undefined;
  fireStagedPreset: () => void;
};

type PanelContentProps = {
  openPanel: MilkTeaPanel;
  started: boolean;
  closePanel: () => void;
  presetName: string | undefined;
  trackName: string | undefined;
  presetKeys: string[];
  stagedPreset: string | undefined;
  stagePreset: (item: string) => void;
  command: CommandPanelProps;
};

type UseStagedPresetOptions = {
  presetNameToIndex: ReadonlyMap<string, number>;
  loadPresetByIndex: (index: number) => void;
  shouldCyclePresets: boolean;
  restartPresetCycle: () => void;
};

/*
 * Constants.
 */

const HUD_FADE_DELAY_MS = 2500;

const RENDER_CONFIG: RenderConfig = {
  ...sizeFromVideoPreset(DEFAULT_VIDEO_SIZE_PRESET),
  fps: DEFAULT_VIDEO_FPS,
  bpp: DEFAULT_MAIN_RECORD_BPP,
  formatId: VIDEO_FORMAT_OPTIONS[0].id, // MP4
  baseName: 'milktea'
};

/*
 * MilkTea.
 */

export function MilkTea() {
  const {openPanel, setOpenPanel} = usePanelContext();
  const {shouldShowTrackName, shouldShowPresetName, shouldCyclePresets} = useSettingsContext();

  const {
    containerRef,
    canvasRef,
    started,
    start,
    presetName,
    presetKeys,
    presetNameToIndex,
    loadPresetByIndex,
    presetIndex,
    changePreset,
    connectAudioBuffer,
    connectOscillator,
    connectMediaStream,
    audioBuffer,
    filePlayback: filePlaybackRaw,
    isCanvasFullscreen,
    toggleFullscreen
  } = useButterchurn();

  const {resolvedTheme} = useThemeContext();
  useEffect(() => {
    const themeColor = document.querySelector<HTMLMetaElement>('meta[data-theme-color]');
    if (themeColor) {
      themeColor.content = started ? themePageBackground.dark : themePageBackground[resolvedTheme];
    }
  }, [resolvedTheme, started]);

  const {restartPresetCycle} = useCyclePresets({
    started,
    presetKeysLength: presetKeys.length,
    presetIndex,
    changePreset,
    loadPresetByIndex
  });

  const {stagedPreset, stagePreset, fireStagedPreset} = useStagedPreset({
    presetNameToIndex,
    loadPresetByIndex,
    shouldCyclePresets,
    restartPresetCycle
  });

  const {hudVisible, handleControlsEnter, handleControlsLeave, forceVisible, scheduleFade} =
    useHudVisibility();

  const closePanel = () => {
    setOpenPanel(MilkTeaPanel.NONE);
    scheduleFade();
  };
  const hasPresets = presetKeys.length > 0;

  const {
    audioSource,
    pendingAudioSource,
    trackName,
    audioFilePlayback,
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

  const {
    canvasRef: exportCanvasRef,
    cancel: cancelExport,
    closeDownload: closeExportDownload,
    download: exportDownload,
    isOverlayVisible: isExportOverlayVisible,
    isPreviewVisible: isExportPreviewVisible,
    isProcessingRecord,
    isRecording,
    onRecord,
    progress: exportProgress,
    state: exportState
  } = useExportController({
    audioBuffer,
    presetIndex,
    renderConfig: RENDER_CONFIG,
    filePlayback: audioFilePlayback
  });

  useMilkTeaKeyboard({
    started,
    audioSource,
    filePlayback: audioFilePlayback,
    start,
    onRecord
  });

  const containerClassName = computeContainerClass(started, hudVisible, openPanel);
  const visibleTrackName = getVisibleValue(shouldShowTrackName, trackName);
  const visiblePresetName = getVisibleValue(shouldShowPresetName, presetName);
  const visibleRecordProgress = getVisibleValue(isExportPreviewVisible, exportProgress);
  return (
    <DragArea handleDrop={handleAudioFileDrop}>
      <div ref={containerRef} class={containerClassName}>
        <Visualizer canvasRef={canvasRef} />
        <ExportLayer
          canvasRef={exportCanvasRef}
          isPreviewVisible={isExportPreviewVisible}
          isOverlayVisible={isExportOverlayVisible}
          progress={exportProgress}
          duration={audioBuffer?.duration}
          state={exportState}
          cancel={cancelExport}
          onRetry={onRecord}
          closeDownload={closeExportDownload}
          download={exportDownload}
        />
        <SplashLayer started={started} start={start} />
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
          trackName={visibleTrackName}
          presetName={visiblePresetName}
          filePlayback={audioFilePlayback}
          isRecording={isRecording}
          isProcessingRecord={isProcessingRecord}
          recordProgress={visibleRecordProgress}
          onRecord={onRecord}
          hasPresets={hasPresets}
          stagedPresetName={stagedPreset}
          onFireStagedPreset={fireStagedPreset}
        />
        <PanelContent
          openPanel={openPanel}
          started={started}
          closePanel={closePanel}
          presetName={presetName}
          trackName={trackName}
          presetKeys={presetKeys}
          stagedPreset={stagedPreset}
          stagePreset={stagePreset}
          command={{
            started,
            closePanel,
            setOpenPanel,
            changePreset,
            isCanvasFullscreen,
            toggleFullscreen,
            openFilePicker: () => fileInputRef.current?.click(),
            handleSourceChange,
            audioFilePlayback,
            hasPresets,
            stagedPreset,
            fireStagedPreset
          }}
        />
      </div>
    </DragArea>
  );
}

function ExportLayer({
  canvasRef,
  isPreviewVisible,
  isOverlayVisible,
  progress,
  duration,
  state,
  cancel,
  onRetry,
  closeDownload,
  download
}: ExportLayerProps) {
  return (
    <>
      {isPreviewVisible && <Visualizer canvasRef={canvasRef} />}
      <ExportDialog
        isOverlayVisible={isOverlayVisible}
        progress={progress}
        duration={duration}
        state={state}
        cancel={cancel}
        onRetry={onRetry}
        closeDownload={closeDownload}
        download={download}
      />
    </>
  );
}

function ExportDialog({
  isOverlayVisible,
  progress,
  duration,
  state,
  cancel,
  onRetry,
  closeDownload,
  download
}: Omit<ExportLayerProps, 'canvasRef' | 'isPreviewVisible'>) {
  if (!isOverlayVisible && !download) {
    return null;
  }
  return (
    <ExportOverlay
      progress={progress}
      duration={duration ?? 0}
      state={state}
      onCancel={cancel}
      onRetry={onRetry}
      onClose={closeDownload}
      download={download}
    />
  );
}

function SplashLayer({started, start}: {started: boolean; start: () => void}) {
  if (started) {
    return null;
  }
  return <Splash start={start} />;
}

function PanelContent(props: PanelContentProps) {
  switch (props.openPanel) {
    case MilkTeaPanel.COMMAND_PALETTE:
      return <CommandPanel {...props.command} />;
    case MilkTeaPanel.HELP:
      return (
        <Help
          visualizerActive={props.started}
          presetName={props.presetName}
          trackName={props.trackName}
          onClose={props.closePanel}
        />
      );
    case MilkTeaPanel.PRESET_PICKER:
      return (
        <PresetPicker
          items={props.presetKeys}
          selectedItem={props.stagedPreset}
          onSelect={props.stagePreset}
          onClose={props.closePanel}
        />
      );
    case MilkTeaPanel.NONE:
      return null;
  }
}

function CommandPanel(props: CommandPanelProps) {
  return (
    <CommandPalette
      visualizerActive={props.started}
      onClose={props.closePanel}
      onOpenHelp={() => props.setOpenPanel(MilkTeaPanel.HELP)}
      onPrevPreset={() => props.changePreset(-1)}
      onNextPreset={() => props.changePreset(1)}
      isFullscreen={props.isCanvasFullscreen}
      onFullScreen={props.toggleFullscreen}
      onOpenFilePicker={props.openFilePicker}
      onSelectOscillator={() => props.handleSourceChange(AudioSource.OSCILLATOR)}
      onSelectMic={() => props.handleSourceChange(AudioSource.MICROPHONE)}
      onSelectAudioCapture={() => props.handleSourceChange(AudioSource.SCREEN_CAPTURE)}
      filePlayback={props.audioFilePlayback}
      hasPresets={props.hasPresets}
      stagedPresetName={props.stagedPreset}
      onOpenPresetPicker={() => props.setOpenPanel(MilkTeaPanel.PRESET_PICKER)}
      onFireStagedPreset={props.fireStagedPreset}
    />
  );
}

/*
 * Hooks.
 */

function useStagedPreset({
  presetNameToIndex,
  loadPresetByIndex,
  shouldCyclePresets,
  restartPresetCycle
}: UseStagedPresetOptions) {
  const [stagedPreset, setStagedPreset] = useState<string | undefined>(undefined);
  const stagePreset = useCallback((item: string) => setStagedPreset(item), []);
  const fireStagedPreset = useCallback(() => {
    firePreset(stagedPreset, presetNameToIndex, loadPresetByIndex, shouldCyclePresets, restartPresetCycle);
    setStagedPreset(undefined);
  }, [stagedPreset, presetNameToIndex, loadPresetByIndex, shouldCyclePresets, restartPresetCycle]);

  return {stagedPreset, stagePreset, fireStagedPreset};
}

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

/*
 * Helpers.
 */

function computeContainerClass(started: boolean, isHudVisible: boolean, openPanel: MilkTeaPanel): string {
  const classNames = [container, started ? containerStarted : containerSplash];
  if (started && !isHudVisible && openPanel === MilkTeaPanel.NONE) {
    classNames.push(cursorHidden);
  }
  return classNames.join(' ');
}

function getVisibleValue<T>(isVisible: boolean, value: T): T | undefined {
  return isVisible ? value : undefined;
}

function firePreset(
  stagedPreset: string | undefined,
  presetNameToIndex: ReadonlyMap<string, number>,
  loadPresetByIndex: (index: number) => void,
  shouldCyclePresets: boolean,
  restartPresetCycle: () => void
): void {
  if (!stagedPreset) {
    return;
  }
  vibrateHeavy();
  const targetIndex = presetNameToIndex.get(stagedPreset);
  if (targetIndex === undefined) {
    return;
  }
  loadPresetByIndex(targetIndex);
  if (shouldCyclePresets) {
    restartPresetCycle();
  }
}
