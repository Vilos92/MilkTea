import type {RefObject} from 'preact';
import {useCallback, useEffect, useRef, useState} from 'preact/hooks';

import {VIDEO_FORMAT_OPTIONS, convertWebmToFormat} from '../lib/mediabunny';
import {RECORDING_OUTPUT_SIZE_1080P, computeVideoBitrate} from '../lib/video';
import type {Size} from '../types/geometry';

/*
 * Constants.
 */

const DEFAULT_FPS = 60;
/** High quality (0.15 bpp). Balances file size and visual fidelity. */
const DEFAULT_BPP = 0.15;
const DEFAULT_FORMAT = VIDEO_FORMAT_OPTIONS[0]; // MP4

/*
 * Types.
 */

type RecordState = 'idle' | 'recording' | 'processing' | 'error';

/*
 * Hook.
 */

/**
 * Orchestrates video recording in the main app:
 * 1. Resizes the butterchurn canvas to 1080p (1920×1080) for capture.
 * 2. Captures the canvas stream + audio via MediaRecorder.
 * 3. On stop: restores the canvas to viewport size and auto-downloads the converted file.
 */
export function useRecording(
  canvasRef: RefObject<HTMLCanvasElement>,
  resizeCanvas: (size: Size) => Promise<void>,
  getAudioStream: (() => MediaStream | undefined) | undefined,
  baseName: string
): {
  isRecording: boolean;
  isProcessing: boolean;
  recordError: string | undefined;
  onRecord: () => void;
} {
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [recordError, setRecordError] = useState<string | undefined>(undefined);

  const mediaRecorderRef = useRef<MediaRecorder | undefined>(undefined);
  const chunksRef = useRef<Blob[]>([]);

  const startRecord = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    chunksRef.current = [];
    setRecordError(undefined);

    const recordingSize = RECORDING_OUTPUT_SIZE_1080P;

    await resizeCanvas(recordingSize);

    const {width, height} = recordingSize;
    const videoBitrate = computeVideoBitrate(width, height, DEFAULT_FPS, DEFAULT_BPP);

    const canvasStream = canvas.captureStream(DEFAULT_FPS);
    const audioTracks = getAudioStream?.()?.getAudioTracks() ?? [];
    const stream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);

    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm',
      videoBitsPerSecond: videoBitrate
    });

    recorder.ondataavailable = event => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      void (async () => {
        setRecordState('processing');

        // Restore canvas to viewport immediately so the user isn't stuck at recording res.
        void resizeCanvas({width: window.innerWidth, height: window.innerHeight});

        try {
          const webmBlob = new Blob(chunksRef.current, {type: 'video/webm'});
          const blob = await convertWebmToFormat(webmBlob, DEFAULT_FORMAT.format, videoBitrate);
          const url = URL.createObjectURL(blob);

          const ext = DEFAULT_FORMAT.format.fileExtension.slice(1);
          const filename = formatFilename(baseName, ext);

          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);

          setRecordState('idle');
        } catch (error) {
          setRecordError(error instanceof Error ? error.message : 'Recording failed.');
          setRecordState('error');
        }
      })();
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecordState('recording');
  }, [canvasRef, resizeCanvas, getAudioStream, baseName]);

  const stopRecord = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = undefined;
  }, []);

  const onRecord = useCallback(() => {
    if (recordState === 'recording') {
      stopRecord();
    } else if (recordState === 'idle' || recordState === 'error') {
      void startRecord();
    }
  }, [recordState, startRecord, stopRecord]);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
    };
  }, []);

  return {
    isRecording: recordState === 'recording',
    isProcessing: recordState === 'processing',
    recordError,
    onRecord
  };
}

/*
 * Helpers.
 */

function formatFilename(baseName: string, ext: string): string {
  const stamp = formatCompactIso(new Date());
  return `${baseName}_${stamp}.${ext}`;
}

function formatCompactIso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
