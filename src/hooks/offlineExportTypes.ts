import type {Output} from 'mediabunny';

/*
 * Types.
 */

export type OfflineExportState = 'idle' | 'preparing' | 'rendering' | 'cancelling' | 'finishing' | 'error';

export type ExportJob = {
  id: number;
  isCancelled: boolean;
  output: Output | undefined;
  audioContext: AudioContext | undefined;
  teardownPromise: Promise<void> | undefined;
  closePromise: Promise<void> | undefined;
};

export type ExportJobCallbacks = {
  isActiveJob: (job: ExportJob) => boolean;
  setState: (state: OfflineExportState) => void;
  setProgress: (progress: number) => void;
  finishJob: (job: ExportJob, state: OfflineExportState) => Promise<void>;
  finishCancelledJob: (job: ExportJob) => Promise<void>;
  teardownJob: (job: ExportJob) => Promise<void>;
  closeJobContext: (job: ExportJob) => Promise<void>;
  onProcessed: (blob: Blob, suggestedFilename: string) => void;
};
