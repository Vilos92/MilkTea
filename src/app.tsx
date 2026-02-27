import {useEffect, useRef, useState} from 'preact/hooks';

import {
  container,
  containerSplash,
  containerStarted,
  hiddenInput,
  sourceButton,
  sourceButtonActive,
  sourceButtonAlwaysLight,
  sourceButtonPending,
  topCenter,
  topCorner,
  topFaded,
  topLeftCorner,
  topRightCorner,
  topVisible
} from './app.css.ts';
import {DragArea} from './components/dragArea/dragArea.tsx';
import {Help} from './components/help/help.tsx';
import {HelpButton} from './components/help/helpButton.tsx';
import {LocaleSwitcher} from './components/locale/localeSwitcher.tsx';
import {Overlay} from './components/overlay/overlay.tsx';
import {Visualizer} from './components/visualizer/visualizer.tsx';
import {useButterchurn} from './hooks/useButterchurn.ts';
import {LocaleProvider} from './provider/locale.tsx';
import {TranslateProvider} from './provider/translation.tsx';

/*
 * Enums.
 */

const AudioSource = {
  OSCILLATOR: 'oscillator',
  FILE: 'file',
  MICROPHONE: 'microphone'
} as const;
type AudioSource = (typeof AudioSource)[keyof typeof AudioSource];

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
    connectMicrophone
  } = useButterchurn();

  const overlayRef = useRef<HTMLDivElement>(null);
  const [controlsVisibility, setControlsVisibility] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const [audioSource, setAudioSource] = useState<AudioSource>(AudioSource.OSCILLATOR);
  const [pendingAudioSource, setPendingAudioSource] = useState<AudioSource | undefined>(undefined);

  const stopMicHardware = () => {
    micStreamRef.current?.getTracks().forEach(track => track.stop());
    micStreamRef.current = null;
  };

  const handleSourceChange = (newSource: AudioSource) => {
    if (newSource === audioSource) return;

    stopMicHardware();

    if (newSource === AudioSource.FILE) {
      fileInputRef.current?.click();
      return;
    }

    if (newSource === AudioSource.MICROPHONE) {
      navigator.mediaDevices
        .getUserMedia({audio: true})
        .then(stream => {
          micStreamRef.current = stream;
          connectMicrophone(stream);
          setAudioSource(AudioSource.MICROPHONE);
        })
        .catch(console.warn);
      return;
    }

    connectOscillator();
    setAudioSource(AudioSource.OSCILLATOR);
  };

  const handleAudioFile = async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      console.error('File is not a valid audio file:', file);
      return;
    }

    try {
      setPendingAudioSource(AudioSource.FILE);
      const arrayBuffer = await file.arrayBuffer();
      await connectAudioBuffer(arrayBuffer);
      setAudioSource(AudioSource.FILE);
    } catch (error) {
      console.error('Failed to connect audio buffer:', error);
    } finally {
      setPendingAudioSource(undefined);
    }
  };

  const onFileChange = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      handleAudioFile(file);
    }
    // If we do not reset the value, the `onchange` may not be triggered again.
    (event.target as HTMLInputElement).value = '';
  };

  const handleDrop = (event: DragEvent) => {
    const files = event.dataTransfer?.files ?? [];
    if (!files[0]) return;

    handleAudioFile(files[0]);
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
        <DragArea handleDrop={handleDrop}>
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
            />
            <Visualizer canvasRef={canvasRef} />

            <HelpButton
              class={[topCorner, topLeftCorner, controlsVisibility || !started ? topVisible : topFaded].join(
                ' '
              )}
              alwaysLight={started}
              setHelpOpen={setHelpOpen}
            />
            <div class={[topCenter, controlsVisibility || !started ? topVisible : topFaded].join(' ')}>
              <input
                type="file"
                ref={fileInputRef}
                class={hiddenInput}
                accept="audio/*"
                onChange={onFileChange}
              />
              <button
                type="button"
                class={computeSourceButtonClass(
                  AudioSource.OSCILLATOR,
                  audioSource,
                  pendingAudioSource,
                  started
                )}
                onClick={() => handleSourceChange(AudioSource.OSCILLATOR)}
                aria-label="Oscillator"
                aria-pressed={audioSource === AudioSource.OSCILLATOR}
                title="Oscillator"
              >
                〰️
              </button>
              <button
                type="button"
                class={computeSourceButtonClass(AudioSource.FILE, audioSource, pendingAudioSource, started)}
                onClick={() => handleSourceChange(AudioSource.FILE)}
                aria-label="File"
                aria-pressed={audioSource === AudioSource.FILE}
                title="Audio file"
              >
                📼
              </button>
              <button
                type="button"
                class={computeSourceButtonClass(
                  AudioSource.MICROPHONE,
                  audioSource,
                  pendingAudioSource,
                  started
                )}
                onClick={() => handleSourceChange(AudioSource.MICROPHONE)}
                aria-label="Microphone"
                aria-pressed={audioSource === AudioSource.MICROPHONE}
                title="Microphone"
              >
                🎙️
              </button>
            </div>
            <LocaleSwitcher
              class={[topCorner, topRightCorner, controlsVisibility || !started ? topVisible : topFaded].join(
                ' '
              )}
              alwaysLight={started}
            />

            {helpOpen && <Help visualizerActive={started} onClose={() => setHelpOpen(false)} />}
          </div>
        </DragArea>
      </TranslateProvider>
    </LocaleProvider>
  );
}

/*
 * Helpers.
 */

function computeSourceButtonClass(
  source: AudioSource,
  activeSource: AudioSource,
  pendingSource: AudioSource | undefined,
  started: boolean
): string {
  const base = [sourceButton, started ? sourceButtonAlwaysLight : undefined].filter(Boolean).join(' ');
  if (pendingSource === source) return [base, sourceButtonPending].join(' ');
  if (activeSource === source) return [base, sourceButtonActive].join(' ');
  return base;
}
