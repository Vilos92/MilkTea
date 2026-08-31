import type {OutputFormat} from 'mediabunny';
import {MkvOutputFormat, MovOutputFormat, Mp4OutputFormat, WebMOutputFormat} from 'mediabunny';
import type {RefObject} from 'preact';
import {useCallback, useEffect, useRef, useState} from 'preact/hooks';

import type {RenderConfig, VideoFormatId} from '../lib/video';
import {renderOfflineExport} from './offlineExportRenderer';
import type {ExportJob, ExportJobCallbacks, OfflineExportState} from './offlineExportTypes';

type OfflineExportOptions = {
  canvasRef: RefObject<HTMLCanvasElement>;
  audioBuffer: AudioBuffer | undefined;
  presetIndex: number | undefined;
  renderConfig: RenderConfig;
  onProcessed: (blob: Blob, suggestedFilename: string) => void;
};

type ExportEffectOptions = ExportJobCallbacks & {
  requestId: number;
  activeJob: ExportJob | undefined;
  canvasRef: RefObject<HTMLCanvasElement>;
  audioBuffer: AudioBuffer | undefined;
  presetIndex: number | undefined;
  renderConfig: RenderConfig;
  createOutputFormat: (formatId: VideoFormatId) => OutputFormat;
};

const CANCELLABLE_STATES: OfflineExportState[] = ['preparing', 'rendering'];
const OUTPUT_FORMAT_FACTORIES: Record<VideoFormatId, () => OutputFormat> = {
  mp4: () => new Mp4OutputFormat(),
  mov: () => new MovOutputFormat(),
  mkv: () => new MkvOutputFormat(),
  webm: () => new WebMOutputFormat()
};

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
  const onProcessedRef = useRef(onProcessed);
  onProcessedRef.current = onProcessed;

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
        job.teardownPromise = cancelAndCloseJob(job, closeJobContext);
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
    if (!canStartExport(audioBuffer, presetIndex, state)) {
      return;
    }

    const job = createExportJob(nextJobIdRef.current + 1);
    nextJobIdRef.current = job.id;
    activeJobRef.current = job;
    setProgress(0);
    setState('preparing');
    setRequestId(job.id);
  }, [audioBuffer, presetIndex, state]);
  const cancel = useCallback(() => {
    const job = activeJobRef.current;
    if (!canCancelExport(job, state)) {
      return;
    }

    job.isCancelled = true;
    setState('cancelling');
    void finishCancelledJob(job);
  }, [finishCancelledJob, state]);

  useEffect(
    () =>
      createExportEffect({
        requestId,
        activeJob: activeJobRef.current,
        canvasRef,
        audioBuffer,
        presetIndex,
        renderConfig,
        isActiveJob,
        setState,
        setProgress,
        finishJob,
        finishCancelledJob,
        teardownJob,
        closeJobContext,
        createOutputFormat,
        onProcessed: (blob, filename) => onProcessedRef.current(blob, filename)
      }),
    [
      audioBuffer,
      canvasRef,
      closeJobContext,
      finishCancelledJob,
      finishJob,
      isActiveJob,
      presetIndex,
      renderConfig,
      requestId,
      teardownJob
    ]
  );
  useEffect(() => () => cancelActiveJob(activeJobRef.current, finishCancelledJob), [finishCancelledJob]);

  return {state, progress, start, cancel};
}

function createExportEffect(options: ExportEffectOptions): (() => void) | undefined {
  const {activeJob, audioBuffer, presetIndex, requestId} = options;
  if (!canRenderExport(requestId, activeJob, audioBuffer, presetIndex)) {
    return undefined;
  }

  const canvas = options.canvasRef.current;
  if (!canvas) {
    void options.finishJob(activeJob, 'error');
    return undefined;
  }

  void renderOfflineExport({
    ...options,
    job: activeJob,
    canvas,
    audioBuffer: audioBuffer!,
    presetIndex: presetIndex!
  });
  return () => cancelActiveJob(activeJob, options.finishCancelledJob);
}

async function cancelAndCloseJob(
  job: ExportJob,
  closeJobContext: (job: ExportJob) => Promise<void>
): Promise<void> {
  try {
    await job.output?.cancel();
  } finally {
    await closeJobContext(job);
  }
}

function cancelActiveJob(
  job: ExportJob | undefined,
  finishCancelledJob: (job: ExportJob) => Promise<void>
): void {
  if (!job) {
    return;
  }
  job.isCancelled = true;
  void finishCancelledJob(job);
}

function canStartExport(
  audioBuffer: AudioBuffer | undefined,
  presetIndex: number | undefined,
  state: OfflineExportState
): boolean {
  return audioBuffer !== undefined && presetIndex !== undefined && (state === 'idle' || state === 'error');
}

function canCancelExport(job: ExportJob | undefined, state: OfflineExportState): job is ExportJob {
  return job !== undefined && !job.isCancelled && CANCELLABLE_STATES.includes(state);
}

function canRenderExport(
  requestId: number,
  job: ExportJob | undefined,
  audioBuffer: AudioBuffer | undefined,
  presetIndex: number | undefined
): job is ExportJob {
  return isCurrentExportJob(requestId, job) && hasExportInputs(audioBuffer, presetIndex);
}

function isCurrentExportJob(requestId: number, job: ExportJob | undefined): job is ExportJob {
  return job !== undefined && job.id === requestId && !job.isCancelled;
}

function hasExportInputs(
  audioBuffer: AudioBuffer | undefined,
  presetIndex: number | undefined
): audioBuffer is AudioBuffer {
  return audioBuffer !== undefined && presetIndex !== undefined;
}

function createExportJob(id: number): ExportJob {
  return {
    id,
    isCancelled: false,
    output: undefined,
    audioContext: undefined,
    teardownPromise: undefined,
    closePromise: undefined
  };
}

function createOutputFormat(formatId: VideoFormatId): OutputFormat {
  return OUTPUT_FORMAT_FACTORIES[formatId]();
}
