import type {OutputFormat} from 'mediabunny';
import {
  AudioBufferSource,
  BufferTarget,
  CanvasSource,
  MkvOutputFormat,
  MovOutputFormat,
  Mp4OutputFormat,
  Output,
  WebMOutputFormat
} from 'mediabunny';
import type {RefObject} from 'preact';
import {useCallback, useEffect, useRef, useState} from 'preact/hooks';

import {createVisualizer, createVisualizerAudioContext} from '../lib/butterchurn/butterchurn';
import {fetchPresetByIndex} from '../lib/butterchurn/butterchurnPresets';
import {computeVideoBitrate} from '../lib/video';
import type {VideoFormatId} from '../lib/video';
import type {RenderConfig} from './useRecorder';

/*
 * Types.
 */

export type OfflineExportState = 'idle' | 'preparing' | 'rendering' | 'cancelling' | 'finishing' | 'error';

type OfflineExportOptions = {
  canvasRef: RefObject<HTMLCanvasElement>;
  audioBuffer: AudioBuffer | undefined;
  presetIndex: number | undefined;
  renderConfig: RenderConfig;
  onProcessed: (blob: Blob, suggestedFilename: string) => void;
};

type AudioLevels = {
  timeByteArray: Uint8Array;
  timeByteArrayL: Uint8Array;
  timeByteArrayR: Uint8Array;
};

/*
 * Constants.
 */

const AUDIO_SAMPLE_COUNT = 1024;
const AUDIO_BITRATE = 192_000;
const RENDER_SLICE_MS = 100;

/*
 * Hook.
 */

export function useOfflineExport({
  canvasRef,
  audioBuffer,
  presetIndex,
  renderConfig,
  onProcessed
}: OfflineExportOptions) {
  const [state, setState] = useState<OfflineExportState>('idle');
  const [progress, setProgress] = useState(0);
  const [requestId, setRequestId] = useState(0);
  const cancelRequestedRef = useRef(false);
  const outputRef = useRef<Output | undefined>(undefined);
  const shouldStartRef = useRef(false);

  const start = useCallback(() => {
    if (!audioBuffer || presetIndex === undefined || (state !== 'idle' && state !== 'error')) {
      return;
    }

    cancelRequestedRef.current = false;
    shouldStartRef.current = true;
    setProgress(0);
    setState('preparing');
    setRequestId(currentRequestId => currentRequestId + 1);
  }, [audioBuffer, presetIndex, state]);

  const cancel = useCallback(() => {
    if (state !== 'preparing' && state !== 'rendering') {
      return;
    }

    cancelRequestedRef.current = true;
    setState('cancelling');
    void outputRef.current?.cancel();
  }, [state]);

  useEffect(() => {
    if (requestId === 0 || !shouldStartRef.current || !audioBuffer || presetIndex === undefined) {
      return;
    }
    shouldStartRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) {
      setState('error');
      return;
    }

    let isUnmounted = false;

    const exportVideo = async () => {
      const {width, height, fps, bpp, formatId, baseName} = renderConfig;
      const frameDuration = 1 / fps;
      const totalFrames = Math.ceil(audioBuffer.duration * fps);
      const preset = await fetchPresetByIndex(presetIndex);
      const target = new BufferTarget();
      const format = createOutputFormat(formatId);
      const output = new Output({format, target});
      const {videoCodec, audioCodec} = selectCodecs(formatId);
      const videoSource = new CanvasSource(canvas, {
        codec: videoCodec,
        bitrate: computeVideoBitrate(width, height, fps, bpp),
        latencyMode: 'quality',
        hardwareAcceleration: 'prefer-hardware'
      });
      const audioSource = new AudioBufferSource({codec: audioCodec, bitrate: AUDIO_BITRATE});
      const context = createVisualizerAudioContext();

      outputRef.current = output;
      output.addVideoTrack(videoSource);
      output.addAudioTrack(audioSource);

      try {
        canvas.width = width;
        canvas.height = height;

        const visualizer = createVisualizer(canvas, context, preset, width, height);
        const audioLevels = createAudioLevels();
        await output.start();

        if (cancelRequestedRef.current) {
          return;
        }

        setState('rendering');
        let lastYieldTime = performance.now();

        for (let frame = 0; frame < totalFrames; frame += 1) {
          if (cancelRequestedRef.current) {
            return;
          }

          const timestamp = frame * frameDuration;
          const duration = Math.min(frameDuration, audioBuffer.duration - timestamp);
          fillAudioLevels(audioBuffer, timestamp, audioLevels);
          visualizer.render({audioLevels, elapsedTime: frameDuration});
          await videoSource.add(timestamp, duration);

          const now = performance.now();
          if (now - lastYieldTime >= RENDER_SLICE_MS || frame === totalFrames - 1) {
            setProgress((frame + 1) / totalFrames);
            await nextAnimationFrame();
            lastYieldTime = performance.now();
          }
        }

        if (cancelRequestedRef.current) {
          return;
        }

        setState('finishing');
        await audioSource.add(audioBuffer);
        if (cancelRequestedRef.current) {
          return;
        }

        await output.finalize();
        if (isUnmounted || cancelRequestedRef.current) {
          return;
        }

        onProcessed(
          new Blob([target.buffer!], {type: format.mimeType}),
          `${baseName}${format.fileExtension}`
        );
        setState('idle');
      } finally {
        outputRef.current = undefined;
        await context.audioContext.close();
        if (!isUnmounted && cancelRequestedRef.current) {
          setState('idle');
        }
      }
    };

    void exportVideo().catch(error => {
      if (!cancelRequestedRef.current) {
        console.error(error);
        setState('error');
      } else {
        setState('idle');
      }
    });

    return () => {
      isUnmounted = true;
    };
  }, [audioBuffer, canvasRef, onProcessed, presetIndex, renderConfig, requestId]);

  useEffect(() => {
    return () => {
      cancelRequestedRef.current = true;
      void outputRef.current?.cancel();
    };
  }, []);

  return {state, progress, start, cancel};
}

/*
 * Helpers.
 */

function createOutputFormat(formatId: VideoFormatId): OutputFormat {
  switch (formatId) {
    case 'mp4':
      return new Mp4OutputFormat();
    case 'mov':
      return new MovOutputFormat();
    case 'mkv':
      return new MkvOutputFormat();
    case 'webm':
      return new WebMOutputFormat();
  }
}

function selectCodecs(formatId: VideoFormatId) {
  return formatId === 'webm'
    ? {videoCodec: 'vp9' as const, audioCodec: 'opus' as const}
    : {videoCodec: 'avc' as const, audioCodec: 'aac' as const};
}

function createAudioLevels(): AudioLevels {
  return {
    timeByteArray: new Uint8Array(AUDIO_SAMPLE_COUNT),
    timeByteArrayL: new Uint8Array(AUDIO_SAMPLE_COUNT),
    timeByteArrayR: new Uint8Array(AUDIO_SAMPLE_COUNT)
  };
}

function fillAudioLevels(audioBuffer: AudioBuffer, time: number, audioLevels: AudioLevels): void {
  const left = audioBuffer.getChannelData(0);
  const right = audioBuffer.getChannelData(Math.min(1, audioBuffer.numberOfChannels - 1));
  const endSample = Math.floor(time * audioBuffer.sampleRate);

  for (let index = 0; index < AUDIO_SAMPLE_COUNT; index += 1) {
    const sampleIndex = endSample - AUDIO_SAMPLE_COUNT + index;
    const leftSample = left[sampleIndex] ?? 0;
    const rightSample = right[sampleIndex] ?? 0;
    audioLevels.timeByteArray[index] = encodeAudioSample((leftSample + rightSample) / 2);
    audioLevels.timeByteArrayL[index] = encodeAudioSample(leftSample);
    audioLevels.timeByteArrayR[index] = encodeAudioSample(rightSample);
  }
}

function encodeAudioSample(sample: number): number {
  return Math.round(Math.max(-1, Math.min(1, sample)) * 127 + 128);
}

function nextAnimationFrame(): Promise<void> {
  const {promise, resolve} = Promise.withResolvers<void>();
  requestAnimationFrame(() => resolve());
  return promise;
}
