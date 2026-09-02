import {useCallback, useEffect, useRef} from 'preact/hooks';

import {type SystemAudioCapture, startSystemAudioCapture, stopSystemAudioCapture} from '../lib/nativeAudio';
import type {PcmSink} from '../lib/pcmPlayer';
import {supportsSystemAudioCapture} from '../lib/platform';
import {AudioSource} from '../types/audio';
import type {PcmSourceOptions} from './useButterchurn';

/*
 * Types.
 */

type UseSystemAudioSourceOptions = {
  connectPcmSource: (options: PcmSourceOptions, checkIsStale: () => boolean) => Promise<PcmSink>;
  /** Restores a live source when capture never starts or dies while running. */
  fallBackToOscillator: () => void;
  setAudioSource: (source: AudioSource) => void;
  setPendingAudioSource: (source: AudioSource | undefined) => void;
};

type UseSystemAudioSourceResult = {
  /** Opens native capture and installs it as the active source if it wins the race. */
  start: () => void;
  /** Invalidates in-flight setup so a slow start cannot install itself over a newer choice. */
  cancelPendingStart: () => void;
  /** Stops running capture hardware. */
  stop: () => void;
};

/*
 * Hooks.
 */

/**
 * Owns native system-audio capture: the native handle, the guard that keeps a slow start from
 * overriding a newer source choice, and teardown when the document goes away.
 */
export function useSystemAudioSource({
  connectPcmSource,
  fallBackToOscillator,
  setAudioSource,
  setPendingAudioSource
}: UseSystemAudioSourceOptions): UseSystemAudioSourceResult {
  const captureRef = useRef<SystemAudioCapture | undefined>(undefined);
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
    if (!supportsSystemAudioCapture) {
      console.warn('System audio capture is not supported on this platform');
      return;
    }

    // Opening the native stream can sit behind a consent prompt for seconds, so everything this
    // run does afterwards first confirms the user has not picked another source meanwhile.
    const generation = generationRef.current;
    const checkIsStale = () => generationRef.current !== generation;

    // Identity rather than generation: a terminal error must still be handled after a harmless
    // dispatch, such as the user re-picking system audio while it already runs.
    let installed: SystemAudioCapture | undefined;
    let failedBeforeInstall = false;
    const handleTerminalError = (message: string) => {
      console.warn(`System audio capture stopped: ${message}`);
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

    setPendingAudioSource(AudioSource.SYSTEM_AUDIO);
    startSystemAudioCapture(
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
        setAudioSource(AudioSource.SYSTEM_AUDIO);
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
  }, [connectPcmSource, fallBackToOscillator, setAudioSource, setPendingAudioSource]);

  // Native capture outlives the document: a reload or a close would leave the operating system's
  // recording indicator lit. The backend also stops on page load, covering what this misses.
  useEffect(() => {
    if (!supportsSystemAudioCapture) {
      return;
    }

    const stopOnUnload = () => {
      stopSystemAudioCapture().catch(console.warn);
    };
    window.addEventListener('beforeunload', stopOnUnload);

    return () => {
      window.removeEventListener('beforeunload', stopOnUnload);
      stopOnUnload();
    };
  }, []);

  return {start, cancelPendingStart, stop};
}
