import {useCallback, useEffect, useRef, useState} from 'preact/hooks';

import type {RenderConfig} from '../lib/video';
import type {AudioFilePlayback} from '../types/audio';
import type {OfflineExportState} from './offlineExportTypes';
import {useOfflineExport} from './useOfflineExport';

/*
 * Types.
 */

type ExportDownload = {url: string; filename: string};
type RecordAction = 'cancel' | 'ignore' | 'start';

type UseExportControllerOptions = {
  audioBuffer: AudioBuffer | undefined;
  presetIndex: number | undefined;
  renderConfig: RenderConfig;
  filePlayback: AudioFilePlayback | undefined;
};
type RecordActionOptions = {
  cancel: () => void;
  closeDownload: () => void;
  filePlayback: AudioFilePlayback | undefined;
  start: () => void;
};

/*
 * Constants.
 */

const RECORD_ACTIONS: Record<OfflineExportState, RecordAction> = {
  idle: 'start',
  preparing: 'cancel',
  rendering: 'cancel',
  cancelling: 'ignore',
  finishing: 'ignore',
  error: 'start'
};

/*
 * Hooks.
 */

export function useExportController({
  audioBuffer,
  presetIndex,
  renderConfig,
  filePlayback
}: UseExportControllerOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [download, setDownload] = useState<ExportDownload | undefined>(undefined);
  const downloadRef = useRef<ExportDownload | undefined>(undefined);

  const releaseDownload = useCallback(() => {
    if (!downloadRef.current) {
      return;
    }
    URL.revokeObjectURL(downloadRef.current.url);
    downloadRef.current = undefined;
  }, []);
  const onProcessed = useCallback(
    (blob: Blob, suggestedFilename: string) => {
      const nextDownload = {url: URL.createObjectURL(blob), filename: suggestedFilename};
      releaseDownload();
      downloadRef.current = nextDownload;
      setDownload(nextDownload);
    },
    [releaseDownload]
  );

  const {state, progress, start, cancel, dismissError} = useOfflineExport({
    canvasRef,
    audioBuffer,
    presetIndex,
    renderConfig,
    onProcessed
  });

  const closeDownload = useCallback(() => {
    releaseDownload();
    setDownload(undefined);
    dismissError();
  }, [dismissError, releaseDownload]);
  const onRecord = useCallback(() => {
    executeRecordAction(RECORD_ACTIONS[state], {cancel, closeDownload, filePlayback, start});
  }, [cancel, closeDownload, filePlayback, start, state]);

  useEffect(() => () => releaseDownload(), [releaseDownload]);

  return {
    canvasRef,
    cancel,
    closeDownload,
    download,
    isOverlayVisible: state !== 'idle',
    isPreviewVisible: state !== 'idle' && state !== 'error',
    isProcessingRecord: state === 'cancelling' || state === 'finishing',
    isRecording: state === 'preparing' || state === 'rendering',
    onRecord,
    progress,
    state
  };
}

/*
 * Helpers.
 */

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
