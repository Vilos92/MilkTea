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
import {AudioSource, AudioSourceButtons} from './components/audioSourceButtons/audioSourceButtons.tsx';
import {DragArea} from './components/dragArea/dragArea';
import {Help} from './components/help/help';
import {HelpButton} from './components/help/helpButton';
import {LocaleSwitcher} from './components/locale/localeSwitcher';
import {Overlay} from './components/overlay/overlay';
import {Visualizer} from './components/visualizer/visualizer';
import {useButterchurn} from './hooks/useButterchurn';
import {LocaleProvider} from './provider/locale';
import {TranslateProvider} from './provider/translation';

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
    changePreset,
    connectAudioBuffer,
    connectOscillator,
    connectMediaStream
  } = useButterchurn();

  const overlayRef = useRef<HTMLDivElement>(null);
  const [controlsVisibility, setControlsVisibility] = useState(true);
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

  return (
    <LocaleProvider>
      <TranslateProvider>
        <DragArea handleDrop={handleAudioFileDrop}>
          <div ref={containerRef} class={[container, started ? containerStarted : containerSplash].join(' ')}>
            <Overlay
              overlayRef={overlayRef}
              started={started}
              start={start}
              isCanvasFullscreen={isCanvasFullscreen}
              toggleFullscreen={toggleFullscreen}
              controlsVisible={controlsVisibility}
              setControlsVisibility={setControlsVisibility}
              changePreset={changePreset}
              trackName={trackName}
            />
            <Visualizer canvasRef={canvasRef} />

            <HelpButton
              class={[topCorner, topLeftCorner, controlsVisibility || !started ? topVisible : topFaded].join(
                ' '
              )}
              alwaysLight={started}
              setHelpOpen={setHelpOpen}
            />
            <AudioSourceButtons
              class={controlsVisibility || !started ? topVisible : topFaded}
              fileInputRef={fileInputRef}
              onFileChange={onAudioFileChange}
              audioSource={audioSource}
              pendingAudioSource={pendingAudioSource}
              started={started}
              onSourceChange={handleSourceChange}
            />
            <LocaleSwitcher
              class={[topCorner, topRightCorner, controlsVisibility || !started ? topVisible : topFaded].join(
                ' '
              )}
              alwaysLight={started}
            />

            {helpOpen && (
              <Help visualizerActive={started} trackName={trackName} onClose={() => setHelpOpen(false)} />
            )}
          </div>
        </DragArea>
      </TranslateProvider>
    </LocaleProvider>
  );
}
