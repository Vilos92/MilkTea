import type {RefObject} from 'preact';
import {useCallback, useRef, useState} from 'preact/hooks';

import type {PcmSink} from '../lib/pcmPlayer';
import {likelySupportsDisplayAudio, supportsMicCapture} from '../lib/platform';
import {AudioSource} from '../types/audio';
import type {AudioFilePlayback} from '../types/audio';
import type {PcmSourceOptions} from './useButterchurn';
import {useSystemAudioSource} from './useSystemAudioSource';

/*
 * Types.
 */

type UseAudioSourceOptions = {
  connectAudioBuffer: (arrayBuffer: ArrayBuffer) => Promise<void>;
  connectOscillator: () => void;
  connectMediaStream: (stream: MediaStream) => void;
  connectPcmSource: (options: PcmSourceOptions, checkIsStale: () => boolean) => Promise<PcmSink>;
  onAudioFile: () => void;
  filePlayback: AudioFilePlayback | undefined;
};

type UseAudioSourceResult = {
  audioSource: AudioSource;
  pendingAudioSource: AudioSource | undefined;
  trackName: string | undefined;
  /** Set when audio source is file. */
  audioFilePlayback: AudioFilePlayback | undefined;
  fileInputRef: RefObject<HTMLInputElement>;
  onAudioFileChange: (event: Event) => void;
  handleAudioFileDrop: (event: DragEvent) => void;
  handleSourceChange: (source: AudioSource) => void;
};

/*
 * Hook.
 */

export function useAudioSource({
  connectAudioBuffer,
  connectOscillator,
  connectMediaStream,
  connectPcmSource,
  onAudioFile,
  filePlayback
}: UseAudioSourceOptions): UseAudioSourceResult {
  const [audioSource, setAudioSource] = useState<AudioSource>(AudioSource.OSCILLATOR);
  const [pendingAudioSource, setPendingAudioSource] = useState<AudioSource | undefined>(undefined);
  const [trackName, setTrackName] = useState<string | undefined>(undefined);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const screenCaptureStreamRef = useRef<MediaStream | null>(null);

  const stopMicHardware = useCallback(() => {
    for (const track of micStreamRef.current?.getTracks() ?? []) {
      track.stop();
    }
    micStreamRef.current = null;
  }, []);

  const fallBackToOscillator = useCallback(() => {
    connectOscillator();
    setAudioSource(AudioSource.OSCILLATOR);
  }, [connectOscillator]);

  const {
    start: startSystemAudio,
    cancelPendingStart: cancelSystemAudioStart,
    stop: stopSystemAudioHardware
  } = useSystemAudioSource({
    connectPcmSource,
    fallBackToOscillator,
    setAudioSource,
    setPendingAudioSource
  });

  const handleAudioFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('audio/')) {
        console.error('File is not a valid audio file:', file);
        return;
      }

      setTrackName(file.name);
      setPendingAudioSource(AudioSource.FILE);
      file
        .arrayBuffer()
        .then(arrayBuffer => connectAudioBuffer(arrayBuffer))
        .then(() => {
          setAudioSource(AudioSource.FILE);
          onAudioFile();
        })
        .catch(error => console.error('Failed to connect audio buffer:', error))
        .finally(() => setPendingAudioSource(undefined));
    },
    [connectAudioBuffer, onAudioFile]
  );

  const onAudioFileChange = useCallback(
    (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        handleAudioFile(file);
      }
      // If we do not reset the value, the `onchange` may not be triggered again.
      (event.target as HTMLInputElement).value = '';
    },
    [handleAudioFile]
  );

  const handleAudioFileDrop = useCallback(
    (event: DragEvent) => {
      const files = event.dataTransfer?.files ?? [];
      if (!files[0]) {
        return;
      }
      handleAudioFile(files[0]);
    },
    [handleAudioFile]
  );

  const handleSourceChange = useCallback(
    (newSource: AudioSource) => {
      // Every dispatch cancels in-flight setup, including re-picking the current source, so a slow
      // native start can never install itself over a newer choice.
      cancelSystemAudioStart();
      setPendingAudioSource(undefined);

      if (newSource === audioSource) {
        // The user should be able to change the file if the source is already set to file.
        if (newSource === AudioSource.FILE) {
          fileInputRef.current?.click();
        }
        return;
      }

      stopMicHardware();
      stopSystemAudioHardware();

      switch (newSource) {
        case AudioSource.FILE:
          fileInputRef.current?.click();
          return;
        case AudioSource.MICROPHONE:
          if (!supportsMicCapture) {
            console.warn('Microphone capture is not supported on this platform');
            return;
          }

          navigator.mediaDevices
            .getUserMedia({audio: true})
            .then(stream => {
              micStreamRef.current = stream;
              connectMediaStream(stream);
              setAudioSource(AudioSource.MICROPHONE);
            })
            .catch(console.warn);
          return;
        case AudioSource.SCREEN_CAPTURE:
          if (!likelySupportsDisplayAudio) {
            console.warn('Screen capture is not supported on this browser');
            return;
          }

          navigator.mediaDevices
            .getDisplayMedia({video: true, audio: true})
            .then(stream => {
              const audioTracks = stream.getAudioTracks();
              if (audioTracks.length === 0) {
                for (const track of stream.getVideoTracks()) {
                  track.stop();
                }
                throw new Error('Could not capture audio from screen capture');
              }

              const audioOnlyStream = new MediaStream(audioTracks);
              screenCaptureStreamRef.current = stream;

              connectMediaStream(audioOnlyStream);
              setAudioSource(AudioSource.SCREEN_CAPTURE);

              stream.getVideoTracks()[0]?.addEventListener('ended', () => {
                setAudioSource(AudioSource.OSCILLATOR);
                screenCaptureStreamRef.current = null;
              });
            })
            .catch(console.warn);
          return;
        case AudioSource.SYSTEM_AUDIO:
          startSystemAudio();
          return;
        case AudioSource.OSCILLATOR:
        default:
          connectOscillator();
          setAudioSource(AudioSource.OSCILLATOR);
          return;
      }
    },
    [
      audioSource,
      stopMicHardware,
      stopSystemAudioHardware,
      cancelSystemAudioStart,
      connectMediaStream,
      connectOscillator,
      startSystemAudio
    ]
  );

  return {
    audioSource,
    pendingAudioSource,
    trackName,
    audioFilePlayback: audioSource === AudioSource.FILE ? filePlayback : undefined,
    fileInputRef,
    onAudioFileChange,
    handleAudioFileDrop,
    handleSourceChange
  };
}
