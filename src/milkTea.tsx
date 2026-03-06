import {useEffect, useRef, useState} from 'preact/hooks';

import {container, containerSplash, containerStarted} from './app.css.ts';
import {AudioSource} from './components/audioSourceButtons/audioSourceButtons';
import {CommandPalette} from './components/commandPalette/commandPalette';
import {DragArea} from './components/dragArea/dragArea';
import {Help} from './components/help/help';
import {Hud} from './components/hud/hud';
import {Splash} from './components/splash/splash';
import {VisualizerStage} from './components/visualizer/visualizerStage';
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
    isCanvasFullscreen,
    toggleFullscreen,
    started,
    start,
    presetName,
    changePreset,
    connectAudioBuffer,
    connectOscillator,
    connectMediaStream
  } = useButterchurn();

  const [audioSource, setAudioSource] = useState<AudioSource>(AudioSource.OSCILLATOR);
  const [pendingAudioSource, setPendingAudioSource] = useState<AudioSource | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const [trackName, setTrackName] = useState<string | undefined>(undefined);

  const handleAudioFile = (file: File) => {
    if (!file.type.startsWith('audio/')) {
      console.error('File is not a valid audio file:', file);
      return;
    }

    setPendingAudioSource(AudioSource.FILE);
    file
      .arrayBuffer()
      .then(arrayBuffer => connectAudioBuffer(arrayBuffer))
      .then(() => setAudioSource(AudioSource.FILE))
      .catch(error => console.error('Failed to connect audio buffer:', error))
      .finally(() => setPendingAudioSource(undefined));

    setTrackName(file.name);
    if (!started) {
      start();
    }
  };

  const onAudioFileChange = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      handleAudioFile(file);
    }
    // If we do not reset the value, the `onchange` may not be triggered again.
    (event.target as HTMLInputElement).value = '';
  };

  const handleAudioFileDrop = (event: DragEvent) => {
    const files = event.dataTransfer?.files ?? [];
    if (!files[0]) {
      return;
    }

    handleAudioFile(files[0]);
  };

  const stopMicHardware = () => {
    micStreamRef.current?.getTracks().forEach(track => track.stop());
    micStreamRef.current = null;
  };

  const handleSourceChange = (newSource: AudioSource) => {
    if (newSource === audioSource) {
      return;
    }

    stopMicHardware();

    switch (newSource) {
      case AudioSource.FILE:
        fileInputRef.current?.click();
        return;
      case AudioSource.MICROPHONE:
        navigator.mediaDevices
          .getUserMedia({audio: true})
          .then(stream => {
            micStreamRef.current = stream;
            connectMediaStream(stream);
            setAudioSource(AudioSource.MICROPHONE);
          })
          .catch(console.warn);
        return;
      case AudioSource.OSCILLATOR:
      default:
        connectOscillator();
        setAudioSource(AudioSource.OSCILLATOR);
        return;
    }
  };

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
            onOpenFilePicker={() => fileInputRef.current?.click()}
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
      case MilkTeaPanel.NONE:
      default:
        return null;
    }
  };

  return (
    <DragArea handleDrop={handleAudioFileDrop}>
      <div ref={containerRef} class={[container, started ? containerStarted : containerSplash].join(' ')}>
        <VisualizerStage canvasRef={canvasRef} presetName={presetName} trackName={trackName} />
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
        />
        {renderPanel()}
      </div>
    </DragArea>
  );
}
