import {useCallback, useRef, useState} from 'preact/hooks';

import type {RenderConfig} from '../lib/video';
import type {AudioFilePlayback} from '../types/audio';
import type {OfflineExportState} from './offlineExportTypes';
import {useOfflineExport} from './useOfflineExport';

type ExportDownload = {url: string; filename: string};
type RecordAction = 'cancel' | 'ignore' | 'start';

type UseExportControllerOptions = {
  audioBuffer: AudioBuffer | undefined;
  presetIndex: number | undefined;
  renderConfig: RenderConfig;
  filePlayback: AudioFilePlayback | undefined;
};

const RECORD_ACTIONS: Record<OfflineExportState, RecordAction> = {
  idle: 'start',
  preparing: 'cancel',
  rendering: 'cancel',
  cancelling: 'ignore',
  finishing: 'ignore',
  error: 'start'
};

export function useExportController({
  audioBuffer,
  presetIndex,
  renderConfig,
  filePlayback
}: UseExportControllerOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [download, setDownload] = useState<ExportDownload | undefined>(undefined);

  const onProcessed = useCallback((blob: Blob, suggestedFilename: string) => {
    const nextDownload = {url: URL.createObjectURL(blob), filename: suggestedFilename};
    setDownload(currentDownload => {
      if (currentDownload) {
        URL.revokeObjectURL(currentDownload.url);
      }
      return nextDownload;
    });
  }, []);

  const closeDownload = useCallback(() => {
    setDownload(currentDownload => {
      if (currentDownload) {
        URL.revokeObjectURL(currentDownload.url);
      }
      return undefined;
    });
  }, []);

  const {state, progress, start, cancel} = useOfflineExport({
    canvasRef,
    audioBuffer,
    presetIndex,
    renderConfig,
    onProcessed
  });

  const onRecord = useCallback(() => {
    executeRecordAction(RECORD_ACTIONS[state], {cancel, closeDownload, filePlayback, start});
  }, [cancel, closeDownload, filePlayback, start, state]);

  return {
    canvasRef,
    cancel,
    closeDownload,
    download,
    isPreviewVisible: state !== 'idle' && state !== 'error',
    isProcessingRecord: state === 'cancelling' || state === 'finishing',
    isRecording: state === 'preparing' || state === 'rendering',
    onRecord,
    progress,
    state
  };
}

type RecordActionOptions = {
  cancel: () => void;
  closeDownload: () => void;
  filePlayback: AudioFilePlayback | undefined;
  start: () => void;
};

function executeRecordAction(action: RecordAction, options: RecordActionOptions): void {
  const actions: Partial<Record<RecordAction, () => void>> = {
    cancel: options.cancel,
    start: () => startExport(options)
  };
  actions[action]?.();
}

function startExport({closeDownload, filePlayback, start}: RecordActionOptions): void {
  closeDownload();
  pausePlayingFile(filePlayback);
  start();
}

function pausePlayingFile(filePlayback: AudioFilePlayback | undefined): void {
  if (filePlayback?.isPlaying) {
    filePlayback.onPlayPause();
  }
}
