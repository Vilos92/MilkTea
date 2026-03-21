import type {RefObject} from 'preact';
import {useCallback, useEffect, useRef, useState} from 'preact/hooks';

import {convertWebmToFormat} from '../lib/mediabunny';
import type {VideoOutputFormat} from '../lib/mediabunny';
import {computeVideoBitrate} from '../lib/video';
import type {Size} from '../types/geometry';

/*
 * Types.
 */

/** The configuration that defines how the output video will be rendered. */
export type RenderConfig = Size & {fps: number; bpp: number; format: VideoOutputFormat; baseName: string};

export type RecordingProcessedPayload = {
  blob: Blob;
  /** Filename (with extension) derived from `RenderConfig`. */
  suggestedFilename: string;
};

type RecordStatus = 'idle' | 'recording' | 'processing' | 'done' | 'error';

/*
 * Hook.
 */

/**
 * Captures a canvas as video, muxes in audio from a `MediaStream`, and encodes a single output file
 * (format/size/fps from `RenderConfig`).
 */
export function useRecorder(
  canvasRef: RefObject<HTMLCanvasElement>,
  audioStreamRef: RefObject<MediaStream | undefined>,
  renderConfig: RenderConfig,
  /** Runs synchronously when `MediaRecorder` stops, before encode (e.g. restore canvas size). */
  onRecordingStopped?: () => void,
  /** When set, called with the encoded file after conversion. */
  onProcessed?: (payload: RecordingProcessedPayload) => void
) {
  const {width, height, fps, bpp, format, baseName} = renderConfig;

  const onRecordingStoppedRef = useRef(onRecordingStopped);
  const onProcessedRef = useRef(onProcessed);
  onRecordingStoppedRef.current = onRecordingStopped;
  onProcessedRef.current = onProcessed;

  const [recordState, setRecordState] = useState<RecordStatus>('idle');
  const [recordError, setRecordError] = useState<string | undefined>(undefined);
  const [recordingUrl, setRecordingUrl] = useState<string | undefined>(undefined);
  const [recordingFilename, setRecordingFilename] = useState<string>('recording.mp4');
  const prevUrlRef = useRef<string | undefined>(undefined);
  const mediaRecorderRef = useRef<MediaRecorder | undefined>(undefined);
  const chunksRef = useRef<Blob[]>([]);

  const startRecord = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    setRecordError(undefined);

    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = undefined;
    }
    setRecordingUrl(undefined);
    chunksRef.current = [];

    const videoBitrate = computeVideoBitrate(width, height, fps, bpp);

    const canvasStream = canvas.captureStream(fps);
    const audioTracks = audioStreamRef.current?.getAudioTracks() ?? [];
    const stream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);
    const recorder = new MediaRecorder(stream, {mimeType: 'video/webm', videoBitsPerSecond: videoBitrate});

    recorder.ondataavailable = event => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      onRecordingStoppedRef.current?.();

      void (async () => {
        setRecordState('processing');
        setRecordError(undefined);

        try {
          const webmBlob = new Blob(chunksRef.current, {type: 'video/webm'});
          const blob = await convertWebmToFormat(webmBlob, format, videoBitrate);
          const suggestedFilename = formatAssetName(baseName, format.fileExtension.slice(1));
          const handleProcessed = onProcessedRef.current;

          if (handleProcessed) {
            handleProcessed({blob, suggestedFilename});
            setRecordingUrl(undefined);
            setRecordingFilename(suggestedFilename);
            setRecordState('done');
          } else {
            const url = URL.createObjectURL(blob);
            prevUrlRef.current = url;
            setRecordingFilename(suggestedFilename);
            setRecordingUrl(url);
            setRecordState('done');
          }
        } catch (error) {
          setRecordError(error instanceof Error ? error.message : 'Processing failed.');
          setRecordState('error');
        }
      })();
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecordState('recording');
  }, [canvasRef, audioStreamRef, width, height, fps, bpp, format, baseName]);

  const stopRecord = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = undefined;
  }, []);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
      }
    };
  }, []);

  return {recordState, recordError, recordingUrl, recordingFilename, startRecord, stopRecord};
}

/*
 * Helpers.
 */

function formatAssetName(baseName: string, ext: string): string {
  const stamp = formatCompactIso(new Date());
  return `${baseName}_${stamp}.${ext}`;
}

/**
 * Formats a date in compact ISO format (YYYYMMDD_HHMMSS).
 *
 * @example
 * formatCompactIso(new Date()) // 20260308_123456
 */
function formatCompactIso(date: Date): string {
  // Keep each field fixed-width to ensure lexicographic sorting.
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
