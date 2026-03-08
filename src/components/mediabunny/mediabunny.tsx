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

type DemoState = 'idle' | 'loading' | 'playing' | 'done' | 'error';
type RecordState = 'idle' | 'recording' | 'processing' | 'done';
type OutputFormatId = 'mp4' | 'mov' | 'mkv' | 'webm';
type RenderSize = {width: number; height: number; fps: number; bpp: number; format: OutputFormatId};

/*
 * Constants.
 */

const MAX_DIM = 3840;
const MIN_DIM = 1;
const MAX_DISPLAY = 480;
const MAX_FPS = 120;
const MIN_FPS = 1;

const QUALITY_OPTIONS = [
  {label: 'Low', bpp: 0.05},
  {label: 'Medium', bpp: 0.1},
  {label: 'High', bpp: 0.15},
  {label: 'Ultra', bpp: 0.2}
] as const;

const PRESET_OPTIONS = [
  {label: '1080p', width: 1920, height: 1080},
  {label: '4K', width: 3840, height: 2160},
  {label: 'Square', width: 1080, height: 1080},
  {label: 'Vertical', width: 1080, height: 1920}
] as const;

const FORMAT_OPTIONS: {id: OutputFormatId; label: string; ext: string; mime: string}[] = [
  {id: 'mp4', label: 'MP4', ext: 'mp4', mime: 'video/mp4'},
  {id: 'mov', label: 'MOV', ext: 'mov', mime: 'video/quicktime'},
  {id: 'mkv', label: 'MKV', ext: 'mkv', mime: 'video/x-matroska'},
  {id: 'webm', label: 'WebM', ext: 'webm', mime: 'video/webm'}
];

/*
 * Component.
 */

export function MediabunnyDemo() {
  const [renderSize, setRenderSize] = useState<RenderSize | null>(null);

  if (!renderSize) {
    return (
      <div class={container}>
        <SetupForm onConfirm={setRenderSize} />
      </div>
    );
  }

  return <MediabunnyPlayer renderSize={renderSize} />;
}

function MediabunnyPlayer({renderSize}: {renderSize: RenderSize}) {
  const scale = Math.min(MAX_DISPLAY / renderSize.width, MAX_DISPLAY / renderSize.height, 1);
  const displayWidth = Math.round(renderSize.width * scale);
  const displayHeight = Math.round(renderSize.height * scale);

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
    renderSize.format
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

function SetupForm({onConfirm}: {onConfirm: (size: RenderSize) => void}) {
  const [width, setWidth] = useState(1080);
  const [height, setHeight] = useState(720);
  const [fps, setFps] = useState(60);
  const [bpp, setBpp] = useState<number>(0.2);
  const [format, setFormat] = useState<OutputFormatId>('mp4');

  const clampDim = (v: number) => Math.max(MIN_DIM, Math.min(MAX_DIM, Math.round(v) || MIN_DIM));
  const clampFps = (v: number) => Math.max(MIN_FPS, Math.min(MAX_FPS, Math.round(v) || MIN_FPS));

  const w = clampDim(width);
  const h = clampDim(height);
  const f = clampFps(fps);
  const previewBitrate = (w * h * f * bpp) / 1_000_000;
  const activePreset = PRESET_OPTIONS.find(p => p.width === w && p.height === h) ?? null;

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    onConfirm({width: w, height: h, fps: f, bpp, format});
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
            value={width}
            min={MIN_DIM}
            max={MAX_DIM}
            onInput={e => setWidth(Number((e.target as HTMLInputElement).value))}
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
            value={height}
            min={MIN_DIM}
            max={MAX_DIM}
            onInput={e => setHeight(Number((e.target as HTMLInputElement).value))}
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
            value={fps}
            min={MIN_FPS}
            max={MAX_FPS}
            onInput={e => setFps(Number((e.target as HTMLInputElement).value))}
          />
        </div>
      </div>
      <div class={inputGroup}>
        <span class={inputLabel}>Preset</span>
        <div class={qualityRow} role="group" aria-label="Preset">
          {PRESET_OPTIONS.map(p => (
            <button
              key={p.label}
              type="button"
              class={activePreset?.label === p.label ? qualityBtnActive : qualityBtn}
              aria-pressed={activePreset?.label === p.label}
              onClick={() => {
                setWidth(p.width);
                setHeight(p.height);
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div class={inputGroup}>
        <span class={inputLabel}>Format</span>
        <div class={qualityRow} role="group" aria-label="Format">
          {FORMAT_OPTIONS.map(opt => (
            <button
              key={opt.id}
              type="button"
              class={format === opt.id ? qualityBtnActive : qualityBtn}
              aria-pressed={format === opt.id}
              onClick={() => setFormat(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div class={inputGroup}>
        <span class={inputLabel}>Quality</span>
        <div class={qualityRow} role="group" aria-label="Quality">
          {QUALITY_OPTIONS.map(opt => (
            <button
              key={opt.label}
              type="button"
              class={bpp === opt.bpp ? qualityBtnActive : qualityBtn}
              aria-pressed={bpp === opt.bpp}
              onClick={() => setBpp(opt.bpp)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <span class={statusLabel}>{previewBitrate.toFixed(1)} Mbps</span>
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
  const [state, setState] = useState<DemoState>('idle');
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

function makeOutputFormat(id: OutputFormatId) {
  if (id === 'mov') {
    return new MovOutputFormat();
  }
  if (id === 'mkv') {
    return new MkvOutputFormat();
  }
  if (id === 'webm') {
    return new WebMOutputFormat();
  }
  return new Mp4OutputFormat();
}

function useRecorder(
  canvasRef: RefObject<HTMLCanvasElement>,
  audioStreamRef: RefObject<MediaStream | null>,
  renderWidth: number,
  renderHeight: number,
  fps: number,
  bpp: number,
  outputFormat: OutputFormatId
) {
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingFilename, setRecordingFilename] = useState<string>('recording.mp4');
  const prevUrlRef = useRef<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Preload mediabunny WASM so the first conversion is instant.
  useEffect(() => {
    void import('mediabunny');
  }, []);

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

        const formatOption = FORMAT_OPTIONS.find(f => f.id === outputFormat)!;
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

        const base =
          demoMp3
            .split('/')
            .pop()
            ?.replace(/\.[^.]+$/, '') ?? 'recording';
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
        setRecordingFilename(`${base}_${stamp}.${formatOption.ext}`);

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
