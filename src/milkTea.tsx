import {useEffect, useState} from 'preact/hooks';

import {container, containerSplash, containerStarted} from './app.css.ts';
import {CommandPalette} from './components/commandPalette/commandPalette';
import {DragArea} from './components/dragArea/dragArea';
import {Help} from './components/help/help';
import {Hud} from './components/hud/hud';
import {PresetPicker} from './components/presetPicker/presetPicker';
import {Splash} from './components/splash/splash';
import {Visualizer} from './components/visualizer/visualizer';
import {useAudioSource} from './hooks/useAudioSource';
import {useButterchurn} from './hooks/useButterchurn';
import {MilkTeaPanel, usePanelContext} from './providers/panel';
import {useSettingsContext} from './providers/settings';
import {AudioSource} from './types/audio';

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
    changePreset,
    connectAudioBuffer,
    connectOscillator,
    connectMediaStream,
    filePlayback,
    isCanvasFullscreen,
    toggleFullscreen
  } = useButterchurn();

  const [stagedPreset, setStagedPreset] = useState<string | undefined>(undefined);

  const handleFireStagedPreset = () => {
    if (!stagedPreset) {
      return;
    }
    const targetIndex = presetNameToIndex.get(stagedPreset);
    if (targetIndex !== undefined) {
      loadPresetByIndex(targetIndex);
    }
    setStagedPreset(undefined);
  };

  const {
    audioSource,
    pendingAudioSource,
    trackName,
    audioFilePlayback: audioFilePlayback,
    fileInputRef,
    onAudioFileChange,
    handleAudioFileDrop,
    handleSourceChange
  } = useAudioSource({
    connectAudioBuffer,
    connectOscillator,
    connectMediaStream,
    onAudioFile: start,
    filePlayback
  });

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
    if (!started || !audioFilePlayback) {
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
      audioFilePlayback.onPlayPause();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [started, audioFilePlayback]);

  const renderPanel = () => {
    switch (openPanel) {
      case MilkTeaPanel.COMMAND_PALETTE:
        return (
          <CommandPalette
            visualizerActive={started}
            onClose={() =>
              setOpenPanel(prev => (prev === MilkTeaPanel.COMMAND_PALETTE ? MilkTeaPanel.NONE : prev))
            }
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
            filePlayback={audioFilePlayback}
            hasPresets={presetKeys.length > 0}
            stagedPresetName={stagedPreset}
            onOpenPresetPicker={() => setOpenPanel(MilkTeaPanel.PRESET_PICKER)}
            onFireStagedPreset={handleFireStagedPreset}
          />
        );
      case MilkTeaPanel.HELP:
        return (
          <Help
            visualizerActive={started}
            presetName={presetName}
            trackName={trackName}
            onClose={() => setOpenPanel(MilkTeaPanel.NONE)}
          />
        );
      case MilkTeaPanel.PRESET_PICKER:
        return (
          <PresetPicker
            items={presetKeys}
            selectedItem={stagedPreset}
            onSelect={setStagedPreset}
            onClose={() => setOpenPanel(MilkTeaPanel.NONE)}
          />
        );
      case MilkTeaPanel.NONE:
      default:
        return null;
    }
  };

  return (
    <DragArea handleDrop={handleAudioFileDrop}>
      <div ref={containerRef} class={[container, started ? containerStarted : containerSplash].join(' ')}>
        <Visualizer canvasRef={canvasRef} />
        {!started && <Splash start={start} />}
        <Hud
          swipeRef={containerRef}
          started={started}
          isCanvasFullscreen={isCanvasFullscreen}
          toggleFullscreen={toggleFullscreen}
          changePreset={changePreset}
          fileInputRef={fileInputRef}
          onFileChange={onAudioFileChange}
          audioSource={audioSource}
          pendingAudioSource={pendingAudioSource}
          onSourceChange={handleSourceChange}
          trackName={shouldShowTrackName ? trackName : undefined}
          presetName={shouldShowPresetName ? presetName : undefined}
          filePlayback={audioFilePlayback}
          hasPresets={presetKeys.length > 0}
          stagedPresetName={stagedPreset}
          onFireStagedPreset={handleFireStagedPreset}
        />
        {renderPanel()}
      </div>
    </DragArea>
  );
}
