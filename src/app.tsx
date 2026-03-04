import {useEffect, useRef, useState} from 'preact/hooks';

import {
  container,
  containerSplash,
  containerStarted,
  topCorner,
  topFaded,
  topLeftCorner,
  topRightCorner,
  topVisible
} from './app.css.ts';
import {AudioSource, AudioSourceButtons} from './components/audioSourceButtons/audioSourceButtons';
import {CommandPalette} from './components/commandPalette/commandPalette';
import {CommandPaletteButton} from './components/commandPalette/commandPaletteButton';
import {DragArea} from './components/dragArea/dragArea';
import {Help} from './components/help/help';
import {HelpButton} from './components/help/helpButton';
import {Overlay} from './components/overlay/overlay';
import {Visualizer} from './components/visualizer/visualizer';
import {useButterchurn} from './hooks/useButterchurn';
import {LocaleProvider} from './providers/locale';
import {SettingsProvider} from './providers/settings';
import {TranslateProvider} from './providers/translation';

/*
 * App.
 */

export function App() {
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

  const overlayRef = useRef<HTMLDivElement>(null);
  const [controlsVisibility, setControlsVisibility] = useState(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

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
    if (!started) start();
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
    if (!files[0]) return;

    handleAudioFile(files[0]);
  };

  const stopMicHardware = () => {
    micStreamRef.current?.getTracks().forEach(track => track.stop());
    micStreamRef.current = null;
  };

  const handleSourceChange = (newSource: AudioSource) => {
    if (newSource === audioSource) return;

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
    if (started) return;
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
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setCommandPaletteOpen(open => {
          if (!open) setHelpOpen(false);
          return !open;
        });
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (helpOpen || commandPaletteOpen) setControlsVisibility(true);
  }, [helpOpen, commandPaletteOpen]);

  return (
    <LocaleProvider>
      <TranslateProvider>
        <SettingsProvider>
          <DragArea handleDrop={handleAudioFileDrop}>
            <div
              ref={containerRef}
              class={[container, started ? containerStarted : containerSplash].join(' ')}
            >
              <Overlay
                overlayRef={overlayRef}
                started={started}
                start={start}
                isCanvasFullscreen={isCanvasFullscreen}
                toggleFullscreen={toggleFullscreen}
                controlsVisible={controlsVisibility}
                setControlsVisibility={setControlsVisibility}
                presetName={presetName}
                changePreset={changePreset}
                trackName={trackName}
              />
              <Visualizer canvasRef={canvasRef} />

              <CommandPaletteButton
                class={[
                  topCorner,
                  topLeftCorner,
                  controlsVisibility || !started || helpOpen || commandPaletteOpen ? topVisible : topFaded
                ].join(' ')}
                alwaysLight={started}
                onOpen={() => {
                  setHelpOpen(false);
                  setCommandPaletteOpen(open => !open);
                }}
              />
              <AudioSourceButtons
                class={
                  controlsVisibility || !started || helpOpen || commandPaletteOpen ? topVisible : topFaded
                }
                fileInputRef={fileInputRef}
                onFileChange={onAudioFileChange}
                audioSource={audioSource}
                pendingAudioSource={pendingAudioSource}
                started={started}
                onSourceChange={handleSourceChange}
              />
              <HelpButton
                class={[
                  topCorner,
                  topRightCorner,
                  controlsVisibility || !started || helpOpen || commandPaletteOpen ? topVisible : topFaded
                ].join(' ')}
                alwaysLight={started}
                onOpen={() => {
                  setCommandPaletteOpen(false);
                  setHelpOpen(open => !open);
                }}
              />
              {helpOpen && (
                <Help
                  visualizerActive={started}
                  presetName={presetName}
                  trackName={trackName}
                  onClose={() => setHelpOpen(false)}
                />
              )}
              {commandPaletteOpen && (
                <CommandPalette
                  visualizerActive={started}
                  onClose={() => setCommandPaletteOpen(false)}
                  onOpenHelp={() => {
                    setCommandPaletteOpen(false);
                    setHelpOpen(true);
                  }}
                  onPrevPreset={() => changePreset(-1)}
                  onNextPreset={() => changePreset(1)}
                  isFullscreen={isCanvasFullscreen}
                  onFullScreen={toggleFullscreen}
                  onOpenFilePicker={() => fileInputRef.current?.click()}
                  onSelectOscillator={() => handleSourceChange(AudioSource.OSCILLATOR)}
                  onSelectMic={() => handleSourceChange(AudioSource.MICROPHONE)}
                />
              )}
            </div>
          </DragArea>
        </SettingsProvider>
      </TranslateProvider>
    </LocaleProvider>
  );
}
