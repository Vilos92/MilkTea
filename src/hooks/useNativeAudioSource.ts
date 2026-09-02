import {useCallback, useEffect, useRef} from 'preact/hooks';

import {
  type NativeAudioCapture,
  NativeCaptureSource,
  startNativeCapture,
  stopNativeCapture
} from '../lib/nativeAudio';
import type {PcmSink} from '../lib/pcmPlayer';
import {isTauri} from '../lib/platform';
import {AudioSource} from '../types/audio';
import type {PcmSourceOptions} from './useButterchurn';
import {useNativeStartToken} from './useNativeStartToken';

/*
 * Types.
 */

type UseNativeAudioSourceOptions = {
  /** Which device the desktop bus opens for this source. */
  source: NativeCaptureSource;
  /** App-level source this hook installs as active once native capture wins its race. */
  audioSource: AudioSource;
  /**
   * Mints the next start token from a counter shared with every other native source, so the
   * backend can order dispatches across sources and let the newest win the single backend session.
   */
  mintStartToken: () => number;
  connectPcmSource: (options: PcmSourceOptions, checkIsStale: () => boolean) => Promise<PcmSink>;
  /** Restores a live source when capture never starts or dies while running. */
  fallBackToOscillator: () => void;
  setAudioSource: (source: AudioSource) => void;
  setPendingAudioSource: (source: AudioSource | undefined) => void;
};

type UseNativeAudioSourceResult = {
  /** Opens native capture and installs it as the active source if it wins the race. */
  start: () => void;
  /** Invalidates in-flight setup so a slow start cannot install itself over a newer choice. */
  cancelPendingStart: () => void;
  /** Stops running capture hardware. */
  stop: () => void;
};

/** Shared audio-graph and state wiring both native sources need from the owner. */
type UseNativeAudioSourcesOptions = {
  connectPcmSource: (options: PcmSourceOptions, checkIsStale: () => boolean) => Promise<PcmSink>;
  fallBackToOscillator: () => void;
  setAudioSource: (source: AudioSource) => void;
  setPendingAudioSource: (source: AudioSource | undefined) => void;
};

type UseNativeAudioSourcesResult = {
  startSystemAudio: () => void;
  cancelSystemAudioStart: () => void;
  stopSystemAudioHardware: () => void;
  startMicrophone: () => void;
  cancelMicrophoneStart: () => void;
  stopMicrophoneHardware: () => void;
};

/*
 * Hooks.
 */

/**
 * Sets up both native capture sources over one shared start-token counter, so their dispatches
 * order against each other and the newest choice wins the single backend session. The owner wires
 * the audio graph and source state once and gets each source's start, cancel and stop controls.
 */
export function useNativeAudioSources({
  connectPcmSource,
  fallBackToOscillator,
  setAudioSource,
  setPendingAudioSource
}: UseNativeAudioSourcesOptions): UseNativeAudioSourcesResult {
  const mintStartToken = useNativeStartToken();

  const systemAudio = useNativeAudioSource({
    source: NativeCaptureSource.SYSTEM_AUDIO,
    audioSource: AudioSource.SYSTEM_AUDIO,
    mintStartToken,
    connectPcmSource,
    fallBackToOscillator,
    setAudioSource,
    setPendingAudioSource
  });

  const microphone = useNativeAudioSource({
    source: NativeCaptureSource.MICROPHONE,
    audioSource: AudioSource.MICROPHONE,
    mintStartToken,
    connectPcmSource,
    fallBackToOscillator,
    setAudioSource,
    setPendingAudioSource
  });

  return {
    startSystemAudio: systemAudio.start,
    cancelSystemAudioStart: systemAudio.cancelPendingStart,
    stopSystemAudioHardware: systemAudio.stop,
    startMicrophone: microphone.start,
    cancelMicrophoneStart: microphone.cancelPendingStart,
    stopMicrophoneHardware: microphone.stop
  };
}

/**
 * Owns one native capture source through the cpal bus: the native handle, the guard that keeps a
 * slow start from overriding a newer source choice, and teardown when the document goes away.
 *
 * Only the desktop shell exposes the backend commands, so every entry point is a no-op elsewhere.
 * The backend runs at most one capture at a time, so `stop` here only reaches hardware this hook
 * actually installed.
 */
function useNativeAudioSource({
  source,
  audioSource,
  mintStartToken,
  connectPcmSource,
  fallBackToOscillator,
  setAudioSource,
  setPendingAudioSource
}: UseNativeAudioSourceOptions): UseNativeAudioSourceResult {
  const captureRef = useRef<NativeAudioCapture | undefined>(undefined);
  /** Bumped whenever a dispatch invalidates in-flight setup. */
  const generationRef = useRef(0);

  const cancelPendingStart = useCallback(() => {
    generationRef.current += 1;
  }, []);

  const stop = useCallback(() => {
    const capture = captureRef.current;
    captureRef.current = undefined;
    capture?.stop().catch(console.warn);
  }, []);

  const start = useCallback(() => {
    if (!isTauri) {
      console.warn('Native audio capture is not supported outside the desktop shell');
      return;
    }

    // Opening the native stream can sit behind a consent prompt for seconds, so everything this
    // run does afterwards first confirms the user has not picked another source meanwhile.
    const generation = generationRef.current;
    const checkIsStale = () => generationRef.current !== generation;

    // Identity rather than generation: a terminal error must still be handled after a harmless
    // dispatch, such as the user re-picking this source while it already runs.
    let installed: NativeAudioCapture | undefined;
    let failedBeforeInstall = false;
    const handleTerminalError = (message: string) => {
      console.warn(`Native audio capture stopped: ${message}`);
      if (checkIsStale()) {
        return;
      }

      // A failure can arrive before the start promise resolves, so before `installed` is set. Record
      // it and let the pending start tear the capture down rather than selecting a dead stream.
      if (!installed) {
        failedBeforeInstall = true;
        return;
      }

      if (captureRef.current !== installed) {
        return;
      }

      captureRef.current = undefined;
      installed.stop().catch(console.warn);
      fallBackToOscillator();
    };

    // One token per dispatch, drawn from a counter shared across sources so the backend can pick
    // the newest start when the microphone and system audio contend for the single session.
    const startToken = mintStartToken();

    setPendingAudioSource(audioSource);
    startNativeCapture(
      source,
      startToken,
      info => connectPcmSource({sampleRate: info.sampleRate, channelCount: info.channelCount}, checkIsStale),
      handleTerminalError
    )
      .then(capture => {
        if (checkIsStale()) {
          capture.stop().catch(console.warn);
          return;
        }

        // The stream died during setup, before it could be installed. Tear it down and recover
        // instead of selecting a source that will never produce frames.
        if (failedBeforeInstall) {
          capture.stop().catch(console.warn);
          fallBackToOscillator();
          return;
        }

        installed = capture;
        captureRef.current = capture;
        setAudioSource(audioSource);
      })
      .catch(error => {
        console.warn(error);
        if (checkIsStale()) {
          return;
        }
        // The button must not stay pressed over hardware that never started.
        fallBackToOscillator();
      })
      .finally(() => {
        if (checkIsStale()) {
          return;
        }
        setPendingAudioSource(undefined);
      });
  }, [
    source,
    audioSource,
    mintStartToken,
    connectPcmSource,
    fallBackToOscillator,
    setAudioSource,
    setPendingAudioSource
  ]);

  // Native capture outlives the document: a reload or a close would leave the operating system's
  // recording indicator lit. The backend also stops on page load, covering what this misses.
  useEffect(() => {
    if (!isTauri) {
      return;
    }

    const stopOnUnload = () => {
      stopNativeCapture(undefined).catch(console.warn);
    };
    window.addEventListener('beforeunload', stopOnUnload);

    return () => {
      window.removeEventListener('beforeunload', stopOnUnload);
      stopOnUnload();
    };
  }, []);

  return {start, cancelPendingStart, stop};
}
