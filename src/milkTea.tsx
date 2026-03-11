import {useEffect, useState} from 'preact/hooks';

import {container, containerSplash, containerStarted} from './app.css.ts';
import {AudioSource} from './components/audioSourceButtons/audioSourceButtons';
import {CommandPalette} from './components/commandPalette/commandPalette';
import {DragArea} from './components/dragArea/dragArea';
import {Help} from './components/help/help';
import {Hud} from './components/hud/hud';
import {PresetPicker} from './components/presetPicker/presetPicker';
import {Splash} from './components/splash/splash';
import {Visualizer} from './components/visualizer/visualizer';
import {useAudioSource} from './hooks/useAudioSource';
import {useButterchurn} from './hooks/useButterchurn';
import {Axis, useSwipe} from './hooks/useSwipe';
import {MilkTeaPanel, usePanelContext} from './providers/panel';

/*
 * MilkTea.
 */

export function MilkTea() {
  const {openPanel, setOpenPanel} = usePanelContext();

  const {
    containerRef,
    canvasRef,
    started,
    start,
    presetName,
    presetKeys,
    presetNameToIndex,
    goToPreset,
    changePreset,
    connectAudioBuffer,
    connectOscillator,
    connectMediaStream,
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
      goToPreset(targetIndex);
    }
    setStagedPreset(undefined);
  };

  const {
    audioSource,
    pendingAudioSource,
    trackName,
    fileInputRef,
    onAudioFileChange,
    handleAudioFileDrop,
    handleSourceChange
  } = useAudioSource({connectAudioBuffer, connectOscillator, connectMediaStream, onAudioFile: start});

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

  useSwipe(containerRef, {
    axis: Axis.VERTICAL,
    onSwipeUp: undefined,
    onSwipeDown: () => {
      if (openPanel === MilkTeaPanel.HELP) {
        return;
      }
      setOpenPanel(MilkTeaPanel.COMMAND_PALETTE);
    }
  });

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
        <Visualizer canvasRef={canvasRef} presetName={presetName} trackName={trackName} />
        {!started && <Splash start={start} />}
        <Hud
          started={started}
          swipeRef={containerRef}
          isCanvasFullscreen={isCanvasFullscreen}
          toggleFullscreen={toggleFullscreen}
          changePreset={changePreset}
          fileInputRef={fileInputRef}
          onFileChange={onAudioFileChange}
          audioSource={audioSource}
          pendingAudioSource={pendingAudioSource}
          onSourceChange={handleSourceChange}
          hasPresets={presetKeys.length > 0}
          stagedPresetName={stagedPreset}
          onFireStagedPreset={handleFireStagedPreset}
        />
        {renderPanel()}
      </div>
    </DragArea>
  );
}
