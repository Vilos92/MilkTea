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
import type {RenderConfig, VideoFormatId} from '../lib/video';

/*
 * Types.
 */

type OfflineExportState = 'idle' | 'preparing' | 'rendering' | 'cancelling' | 'finishing' | 'error';
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

type ExportJob = {
  id: number;
  isCancelled: boolean;
  output: Output | undefined;
  audioContext: AudioContext | undefined;
  teardownPromise: Promise<void> | undefined;
  closePromise: Promise<void> | undefined;
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
  const activeJobRef = useRef<ExportJob | undefined>(undefined);
  const nextJobIdRef = useRef(0);

  const isActiveJob = useCallback((job: ExportJob) => activeJobRef.current?.id === job.id, []);

  const closeJobContext = useCallback(async (job: ExportJob) => {
    if (!job.audioContext) {
      return;
    }
    if (!job.closePromise) {
      job.closePromise = job.audioContext.close();
    }
    await job.closePromise;
  }, []);

  const teardownJob = useCallback(
    async (job: ExportJob) => {
      if (!job.teardownPromise) {
        job.teardownPromise = (async () => {
          try {
            await job.output?.cancel();
          } finally {
            await closeJobContext(job);
          }
        })();
      }
      await job.teardownPromise;
    },
    [closeJobContext]
  );

  const finishJob = useCallback(
    async (job: ExportJob, nextState: OfflineExportState) => {
      await closeJobContext(job);
      if (!isActiveJob(job)) {
        return;
      }
      activeJobRef.current = undefined;
      setState(nextState);
    },
    [closeJobContext, isActiveJob]
  );

  const finishCancelledJob = useCallback(
    async (job: ExportJob) => {
      try {
        await teardownJob(job);
      } catch (error) {
        console.error(error);
      }
      await finishJob(job, 'idle');
    },
    [finishJob, teardownJob]
  );

  const start = useCallback(() => {
    if (!audioBuffer || presetIndex === undefined || (state !== 'idle' && state !== 'error')) {
      return;
    }

    const job = {
      id: nextJobIdRef.current + 1,
      isCancelled: false,
      output: undefined,
      audioContext: undefined,
      teardownPromise: undefined,
      closePromise: undefined
    };
    nextJobIdRef.current = job.id;
    activeJobRef.current = job;
    setProgress(0);
    setState('preparing');
    setRequestId(job.id);
  }, [audioBuffer, presetIndex, state]);

  const cancel = useCallback(() => {
    const job = activeJobRef.current;
    if (!job || (state !== 'preparing' && state !== 'rendering')) {
      return;
    }

    job.isCancelled = true;
    setState('cancelling');
    void finishCancelledJob(job);
  }, [finishCancelledJob, state]);

  useEffect(() => {
    const job = activeJobRef.current;
    if (
      requestId === 0 ||
      !job ||
      job.id !== requestId ||
      job.isCancelled ||
      !audioBuffer ||
      presetIndex === undefined
    ) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      void finishJob(job, 'error');
      return;
    }

    const exportVideo = async () => {
      const {width, height, fps, bpp, formatId, baseName} = renderConfig;
      const frameDuration = 1 / fps;
      const totalFrames = Math.ceil(audioBuffer.duration * fps);

      try {
        const preset = await fetchPresetByIndex(presetIndex);
        if (!isActiveJob(job) || job.isCancelled) {
          return;
        }

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

        job.output = output;
        job.audioContext = context.audioContext;
        if (!isActiveJob(job) || job.isCancelled) {
          await finishCancelledJob(job);
          return;
        }

        output.addVideoTrack(videoSource);
        output.addAudioTrack(audioSource);
        canvas.width = width;
        canvas.height = height;

        const visualizer = createVisualizer(canvas, context, preset, width, height);
        const audioLevels = createAudioLevels();
        await output.start();
        if (!isActiveJob(job) || job.isCancelled) {
          return;
        }

        setState('rendering');
        let lastYieldTime = performance.now();

        for (let frame = 0; frame < totalFrames; frame += 1) {
          if (!isActiveJob(job) || job.isCancelled) {
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

        if (!isActiveJob(job) || job.isCancelled) {
          return;
        }

        setState('finishing');
        await audioSource.add(audioBuffer);
        if (!isActiveJob(job) || job.isCancelled) {
          return;
        }

        await output.finalize();
        if (!isActiveJob(job) || job.isCancelled) {
          return;
        }

        await closeJobContext(job);
        if (!isActiveJob(job) || job.isCancelled) {
          return;
        }

        onProcessed(
          new Blob([target.buffer!], {type: format.mimeType}),
          `${baseName}${format.fileExtension}`
        );
        activeJobRef.current = undefined;
        setState('idle');
      } catch (error) {
        if (!isActiveJob(job) || job.isCancelled) {
          return;
        }

        console.error(error);
        try {
          await teardownJob(job);
        } catch (teardownError) {
          console.error(teardownError);
        }
        await finishJob(job, 'error');
      } finally {
        if (job.isCancelled) {
          await finishCancelledJob(job);
        }
      }
    };

    void exportVideo();

    return () => {
      job.isCancelled = true;
      void finishCancelledJob(job);
    };
  }, [
    audioBuffer,
    canvasRef,
    closeJobContext,
    finishCancelledJob,
    finishJob,
    isActiveJob,
    onProcessed,
    presetIndex,
    renderConfig,
    requestId,
    teardownJob
  ]);

  useEffect(() => {
    return () => {
      const job = activeJobRef.current;
      if (!job) {
        return;
      }
      job.isCancelled = true;
      void finishCancelledJob(job);
    };
  }, [finishCancelledJob]);

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
