import {
  BlobSource,
  BufferTarget,
  Conversion,
  Input,
  MkvOutputFormat,
  MovOutputFormat,
  Mp4OutputFormat,
  Output,
  WEBM,
  WebMOutputFormat
} from 'mediabunny';
import type {RefObject} from 'preact';
import {useCallback, useEffect, useRef, useState} from 'preact/hooks';

import demoMp3 from '../../assets/needle-the-thread.mp3';
import {createVisualizer} from '../../lib/butterchurn/butterchurn';
import {fetchPresetByIndex, getPresetKeys} from '../../lib/butterchurn/butterchurnPresets';
import type {Size} from '../../types/geometry';
import {
  actionRow,
  btn,
  btnRecord,
  canvasEl,
  container,
  downloadAnchor,
  errorLabel,
  inputField,
  inputGroup,
  inputLabel,
  inputRow,
  progressBarFill,
  progressBarTrack,
  qualityBtn,
  qualityBtnActive,
  qualityRow,
  recordingDot,
  setupForm,
  statusLabel
} from './mediabunny.css';

/*
 * Types.
 */

type QualityLabel = 'Low' | 'Medium' | 'High' | 'Ultra';
type QualityPreset = {label: QualityLabel; bpp: number};

type SizeLabel = '1080p' | '4K' | 'Square' | 'Vertical';
type SizePreset = {label: SizeLabel; width: number; height: number};

type VideoFormatType = 'mp4' | 'mov' | 'mkv' | 'webm';
type VideoExtension = 'mp4' | 'mov' | 'mkv' | 'webm';
type VideoMime = 'video/mp4' | 'video/quicktime' | 'video/x-matroska' | 'video/webm';
type VideoFormatOption = {type: VideoFormatType; label: string; ext: VideoExtension; mime: VideoMime};

/** This is the configuration that defines how the output video will be rendered. */
type RenderConfig = Size & {fps: number; bpp: number; formatType: VideoFormatType};

type DemoStatus = 'idle' | 'loading' | 'playing' | 'done' | 'error';
type RecordStatus = 'idle' | 'recording' | 'processing' | 'done';

/*
 * Constants.
 */

const MIN_DIMENSION = 1;
const MAX_DIMENSION = 3840; // We do not allow more than 3840x3840.
const MAX_DISPLAY = 480; // The canvas used to preview the video is scaled down below this size.

const MIN_FPS = 1;
const MAX_FPS = 120;
const DEFAULT_FPS = 60;

const QUALITY_PRESETS: readonly QualityPreset[] = [
  {label: 'Low', bpp: 0.05},
  {label: 'Medium', bpp: 0.1},
  {label: 'High', bpp: 0.15},
  {label: 'Ultra', bpp: 0.2}
] as const;

const SIZE_PRESETS: readonly SizePreset[] = [
  {label: '1080p', width: 1920, height: 1080},
  {label: '4K', width: 3840, height: 2160},
  {label: 'Square', width: 1080, height: 1080},
  {label: 'Vertical', width: 1080, height: 1920}
] as const;

const VIDEO_FORMAT_OPTIONS: readonly VideoFormatOption[] = [
  {type: 'mp4', label: 'MP4', ext: 'mp4', mime: 'video/mp4'},
  {type: 'mov', label: 'MOV', ext: 'mov', mime: 'video/quicktime'},
  {type: 'mkv', label: 'MKV', ext: 'mkv', mime: 'video/x-matroska'},
  {type: 'webm', label: 'WebM', ext: 'webm', mime: 'video/webm'}
];

const DEFAULT_PRESET: SizePreset = SIZE_PRESETS[0];
const DEFAULT_BPP: number = QUALITY_PRESETS[QUALITY_PRESETS.length - 1].bpp;
const DEFAULT_VIDEO_FORMAT: VideoFormatType = 'mp4';

/*
 * Components.
 */

export function MediabunnyDemo() {
  const [renderSize, setRenderSize] = useState<RenderConfig | null>(null);

  if (!renderSize) {
    return (
      <div class={container}>
        <SetupForm onConfirm={setRenderSize} />
      </div>
    );
  }

  return <MediabunnyPlayer renderSize={renderSize} />;
}

function MediabunnyPlayer({renderSize}: {renderSize: RenderConfig}) {
  const {width: displayWidth, height: displayHeight} = scaleSizeToDisplay(renderSize);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {state, progress, errorMessage, start, stop, audioStreamRef} = useAudioVisualizer(
    canvasRef,
    renderSize.width,
    renderSize.height
  );
  const {recordState, recordingUrl, recordingFilename, startRecord, stopRecord} = useRecorder(
    canvasRef,
    audioStreamRef,
    renderSize.width,
    renderSize.height,
    renderSize.fps,
    renderSize.bpp,
    renderSize.formatType
  );

  return (
    <div class={container}>
      <canvas
        ref={canvasRef}
        width={renderSize.width}
        height={renderSize.height}
        class={canvasEl}
        style={{width: `${displayWidth}px`, height: `${displayHeight}px`}}
      />
      <div class={progressBarTrack} style={{width: `${displayWidth}px`}}>
        <div class={progressBarFill} style={{width: `${Math.round(progress * 100)}%`}} />
      </div>
      <div class={actionRow}>
        {(state === 'idle' || state === 'done' || state === 'error') && (
          <button type="button" class={btn} onClick={start}>
            {state === 'done' ? 'Play Again' : 'Start'}
          </button>
        )}
        {state === 'playing' && (
          <button type="button" class={btn} onClick={stop}>
            Stop
          </button>
        )}
        {state === 'loading' && <span class={statusLabel}>Loading…</span>}
        {(recordState === 'idle' || recordState === 'done') && (
          <button type="button" class={btnRecord} onClick={startRecord}>
            Record
          </button>
        )}
        {recordState === 'recording' && (
          <button type="button" class={btnRecord} onClick={stopRecord}>
            <span class={recordingDot} />
            Stop Recording
          </button>
        )}
        {recordState === 'processing' && <span class={statusLabel}>Processing…</span>}
        {recordState === 'done' && recordingUrl && (
          <a class={downloadAnchor} href={recordingUrl} download={recordingFilename}>
            Download
          </a>
        )}
      </div>
      {errorMessage && <p class={errorLabel}>{errorMessage}</p>}
    </div>
  );
}

function SetupForm({onConfirm}: {onConfirm: (size: RenderConfig) => void}) {
  const [rawWidth, setRawWidth] = useState<number>(DEFAULT_PRESET.width);
  const [rawHeight, setRawHeight] = useState<number>(DEFAULT_PRESET.height);
  const [rawFps, setRawFps] = useState<number>(DEFAULT_FPS);
  const [bpp, setRawBpp] = useState<number>(DEFAULT_BPP);
  const [formatType, setFormatType] = useState<VideoFormatType>(DEFAULT_VIDEO_FORMAT);

  const width = clampDimension(rawWidth);
  const height = clampDimension(rawHeight);
  const fps = clampFps(rawFps);

  const previewBitrate = (width * height * fps * bpp) / 1_000_000;

  const previewMbPerMin = (previewBitrate * 60) / 8; // Mb/s * 60 s/min / 8 bits/byte -> MB/min
  const previewSizePerMin =
    previewMbPerMin >= 1000
      ? `${(previewMbPerMin / 1000).toFixed(2)} GB/min`
      : `${previewMbPerMin.toFixed(0)} MB/min`;

  const activePreset =
    SIZE_PRESETS.find(sizePreset => sizePreset.width === width && sizePreset.height === height) ?? null;

  const handleSubmit = (event: Event) => {
    event.preventDefault();
    onConfirm({width, height, fps, bpp, formatType});
  };

  return (
    <form class={setupForm} onSubmit={handleSubmit}>
      <div class={inputRow}>
        <div class={inputGroup}>
          <label class={inputLabel} htmlFor="render-width">
            Width
          </label>
          <input
            id="render-width"
            type="number"
            class={inputField}
            value={rawWidth}
            min={MIN_DIMENSION}
            max={MAX_DIMENSION}
            onInput={event => setRawWidth(Number((event.target as HTMLInputElement).value))}
          />
        </div>
        <div class={inputGroup}>
          <label class={inputLabel} htmlFor="render-height">
            Height
          </label>
          <input
            id="render-height"
            type="number"
            class={inputField}
            value={rawHeight}
            min={MIN_DIMENSION}
            max={MAX_DIMENSION}
            onInput={event => setRawHeight(Number((event.target as HTMLInputElement).value))}
          />
        </div>
        <div class={inputGroup}>
          <label class={inputLabel} htmlFor="render-fps">
            FPS
          </label>
          <input
            id="render-fps"
            type="number"
            class={inputField}
            value={rawFps}
            min={MIN_FPS}
            max={MAX_FPS}
            onInput={event => setRawFps(Number((event.target as HTMLInputElement).value))}
          />
        </div>
      </div>
      <div class={inputGroup}>
        <span class={inputLabel}>Preset</span>
        <div class={qualityRow} role="group" aria-label="Preset">
          {SIZE_PRESETS.map(sizePreset => (
            <button
              key={sizePreset.label}
              type="button"
              class={activePreset?.label === sizePreset.label ? qualityBtnActive : qualityBtn}
              aria-pressed={activePreset?.label === sizePreset.label}
              onClick={() => {
                setRawWidth(sizePreset.width);
                setRawHeight(sizePreset.height);
              }}
            >
              {sizePreset.label}
            </button>
          ))}
        </div>
      </div>
      <div class={inputGroup}>
        <span class={inputLabel}>Format</span>
        <div class={qualityRow} role="group" aria-label="Format">
          {VIDEO_FORMAT_OPTIONS.map(formatOption => (
            <button
              key={formatOption.type}
              type="button"
              class={formatType === formatOption.type ? qualityBtnActive : qualityBtn}
              aria-pressed={formatType === formatOption.type}
              onClick={() => setFormatType(formatOption.type)}
            >
              {formatOption.label}
            </button>
          ))}
        </div>
      </div>
      <div class={inputGroup}>
        <span class={inputLabel}>Quality</span>
        <div class={qualityRow} role="group" aria-label="Quality">
          {QUALITY_PRESETS.map(qualityPreset => (
            <button
              key={qualityPreset.label}
              type="button"
              class={bpp === qualityPreset.bpp ? qualityBtnActive : qualityBtn}
              aria-pressed={bpp === qualityPreset.bpp}
              onClick={() => setRawBpp(qualityPreset.bpp)}
            >
              {qualityPreset.label}
            </button>
          ))}
        </div>
      </div>
      <span class={statusLabel}>
        {previewBitrate.toFixed(1)} Mbps · {previewSizePerMin}
      </span>
      <button type="submit" class={btn}>
        Confirm
      </button>
    </form>
  );
}

/*
 * Hooks.
 */

function useAudioVisualizer(
  canvasRef: RefObject<HTMLCanvasElement>,
  renderWidth: number,
  renderHeight: number
) {
  const [state, setState] = useState<DemoStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stopCallbackRef = useRef<(() => void) | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    stopCallbackRef.current?.();
  }, []);

  const start = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    stopCallbackRef.current?.();
    setProgress(0);
    setErrorMessage(null);
    setState('loading');

    const stopped = {value: false};
    let rafId: number | null = null;
    let audioCtx: AudioContext | null = null;
    let sourceNode: AudioBufferSourceNode | null = null;

    const doStop = () => {
      if (stopped.value) {
        return;
      }
      stopped.value = true;

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
        rafIdRef.current = null;
      }

      try {
        sourceNode?.stop();
      } catch {}

      void audioCtx?.close();
      audioStreamRef.current = null;
      setState('done');

      if (stopCallbackRef.current === doStop) {
        stopCallbackRef.current = null;
      }
    };

    try {
      const arrayBuffer = await fetch(demoMp3).then(r => r.arrayBuffer());

      audioCtx = new AudioContext();
      await audioCtx.resume();

      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const duration = audioBuffer.duration;

      const gainNode = audioCtx.createGain();
      gainNode.connect(audioCtx.destination);

      const streamDest = audioCtx.createMediaStreamDestination();
      gainNode.connect(streamDest);
      audioStreamRef.current = streamDest.stream;

      sourceNode = audioCtx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(gainNode);

      const keys = await getPresetKeys();
      const preset = await fetchPresetByIndex(Math.floor(Math.random() * keys.length));

      canvas.width = renderWidth;
      canvas.height = renderHeight;
      const visualizer = createVisualizer(
        canvas,
        {audioContext: audioCtx, gainNode},
        preset,
        renderWidth,
        renderHeight
      );

      stopCallbackRef.current = doStop;
      sourceNode.onended = doStop;

      setState('playing');
      const startTime = audioCtx.currentTime;
      sourceNode.start(0);

      const loop = () => {
        if (stopped.value) {
          return;
        }
        visualizer.render();
        setProgress(Math.min((audioCtx!.currentTime - startTime) / duration, 1));
        rafId = requestAnimationFrame(loop);
        rafIdRef.current = rafId;
      };

      rafId = requestAnimationFrame(loop);
      rafIdRef.current = rafId;
    } catch (err) {
      stopped.value = true;
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setState('error');
    }
  }, [canvasRef, renderWidth, renderHeight]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      stopCallbackRef.current = null;
    };
  }, []);

  return {state, progress, errorMessage, start, stop, audioStreamRef};
}

/*
 * Hooks.
 */

function useRecorder(
  canvasRef: RefObject<HTMLCanvasElement>,
  audioStreamRef: RefObject<MediaStream | null>,
  renderWidth: number,
  renderHeight: number,
  fps: number,
  bpp: number,
  outputFormat: VideoFormatType
) {
  const [recordState, setRecordState] = useState<RecordStatus>('idle');
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingFilename, setRecordingFilename] = useState<string>('recording.mp4');
  const prevUrlRef = useRef<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecord = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = null;
    }
    setRecordingUrl(null);
    chunksRef.current = [];

    const videoBitrate = Math.round(renderWidth * renderHeight * fps * bpp);

    const canvasStream = canvas.captureStream(fps);
    const audioTracks = audioStreamRef.current?.getAudioTracks() ?? [];
    const stream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);
    const recorder = new MediaRecorder(stream, {mimeType: 'video/webm', videoBitsPerSecond: videoBitrate});

    recorder.ondataavailable = e => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      void (async () => {
        setRecordState('processing');

        const webmBlob = new Blob(chunksRef.current, {type: 'video/webm'});

        const formatOption = VIDEO_FORMAT_OPTIONS.find(f => f.type === outputFormat)!;
        const target = new BufferTarget();
        const conversion = await Conversion.init({
          input: new Input({formats: [WEBM], source: new BlobSource(webmBlob)}),
          output: new Output({format: makeOutputFormat(outputFormat), target}),
          video: {bitrate: videoBitrate},
          showWarnings: false
        });
        await conversion.execute();

        const blob = new Blob([target.buffer!], {type: formatOption.mime});
        const url = URL.createObjectURL(blob);
        prevUrlRef.current = url;

        setRecordingFilename(formatAssetName(demoMp3, formatOption.ext));

        setRecordingUrl(url);
        setRecordState('done');
      })();
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecordState('recording');
  }, [canvasRef, audioStreamRef, renderWidth, renderHeight, fps, bpp, outputFormat]);

  const stopRecord = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
      }
    };
  }, []);

  return {recordState, recordingUrl, recordingFilename, startRecord, stopRecord};
}

/*
 * Helpers.
 */

/**
 * Clamps a value between a minimum and maximum.
 *
 * @example
 * clamp(0, -50, 50) // 0
 * clamp(-50, 0, 100) // 0
 * clamp(50, -100, 0) // 0
 */
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number.isNaN(v) ? min : Math.round(v)));
}

function clampDimension(dimension: number): number {
  return clamp(dimension, MIN_DIMENSION, MAX_DIMENSION);
}

function clampFps(fps: number): number {
  return clamp(fps, MIN_FPS, MAX_FPS);
}

/**
 * Scales the input size to fit the bounds of the display. Neither dimension will exceed the display size,
 * but one (or both, if the input is square) will equal it exactly, and the other will be less.
 *
 * This allows us to scale a canvas being rendered at a higher resolution (i.e. for rendering to video) at a
 * smaller resolution (i.e. for previewing the render in the browser) without double-rendering the canvas.
 */
function scaleSizeToDisplay(size: Size): Size {
  const scale = Math.min(MAX_DISPLAY / size.width, MAX_DISPLAY / size.height, 1);
  return {width: Math.round(size.width * scale), height: Math.round(size.height * scale)};
}

function formatAssetName(path: string, ext: string): string {
  // File name without the extension (e.g. /path/to/file.mp3 -> file).
  const baseName = path
    .split('/')
    .pop()!
    .replace(/\.[^.]+$/, '');
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

function makeOutputFormat(type: VideoFormatType) {
  if (type === 'mov') {
    return new MovOutputFormat();
  }
  if (type === 'mkv') {
    return new MkvOutputFormat();
  }
  if (type === 'webm') {
    return new WebMOutputFormat();
  }
  return new Mp4OutputFormat();
}
