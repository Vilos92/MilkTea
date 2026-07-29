import type {RefObject} from 'preact';
import {useCallback, useEffect, useRef, useState} from 'preact/hooks';

import demoMp3 from '../../assets/needle-the-thread.mp3';
import {type RenderConfig, useRecorder} from '../../hooks/useRecorder';
import {createVisualizer} from '../../lib/butterchurn/butterchurn';
import {fetchPresetByIndex, getPresetKeys} from '../../lib/butterchurn/butterchurnPresets';
import {VIDEO_FORMAT_OPTIONS, type VideoFormatOption} from '../../lib/video';
import {
  DEFAULT_VIDEO_FPS,
  DEFAULT_VIDEO_SIZE_PRESET,
  MAX_VIDEO_DIMENSION,
  MAX_VIDEO_FPS,
  MIN_VIDEO_DIMENSION,
  MIN_VIDEO_FPS,
  VIDEO_QUALITY_PRESETS,
  VIDEO_SIZE_PRESETS,
  clampVideoDimension,
  clampVideoFps,
  scaleVideoSizeToMaxDisplay
} from '../../lib/video';

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
} from './mediabunnyDemo.css';

/*
 * Types.
 */

type DemoStatus = 'idle' | 'loading' | 'playing' | 'done' | 'error';

/*
 * Constants.
 */

/** Demo setup form default quality (Ultra). */
const DEFAULT_DEMO_BPP: number = VIDEO_QUALITY_PRESETS.find(preset => preset.label === 'Ultra')!.bpp;
const DEFAULT_VIDEO_FORMAT_OPTION: VideoFormatOption = VIDEO_FORMAT_OPTIONS[0];

const DEMO_TRACK_BASENAME = demoMp3
  .split('/')
  .pop()!
  .replace(/\.[^.]+$/, '');

/*
 * Components.
 */

export function MediabunnyDemo() {
  const [renderConfig, setRenderConfig] = useState<RenderConfig | null>(null);

  if (!renderConfig) {
    return (
      <div class={container}>
        <SetupForm onConfirm={setRenderConfig} />
      </div>
    );
  }

  return <MediabunnyPlayer renderConfig={renderConfig} />;
}

type MediabunnyPlayerProps = {
  renderConfig: RenderConfig;
};

function MediabunnyPlayer({renderConfig}: MediabunnyPlayerProps) {
  const {width: displayWidth, height: displayHeight} = scaleVideoSizeToMaxDisplay(renderConfig);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {state, progress, errorMessage, start, stop, audioStreamRef} = useAudioVisualizer(
    canvasRef,
    renderConfig.width,
    renderConfig.height
  );
  const {recordState, recordError, recordingUrl, recordingFilename, startRecord, stopRecord} = useRecorder(
    canvasRef,
    audioStreamRef,
    renderConfig
  );

  return (
    <div class={container}>
      <canvas
        ref={canvasRef}
        width={renderConfig.width}
        height={renderConfig.height}
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
        {(recordState === 'idle' || recordState === 'done' || recordState === 'error') && (
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
      {recordError && <p class={errorLabel}>{recordError}</p>}
    </div>
  );
}

type SetupFormProps = {
  onConfirm: (config: RenderConfig) => void;
};

function SetupForm({onConfirm}: SetupFormProps) {
  const [rawWidth, setRawWidth] = useState<number>(DEFAULT_VIDEO_SIZE_PRESET.width);
  const [rawHeight, setRawHeight] = useState<number>(DEFAULT_VIDEO_SIZE_PRESET.height);
  const [rawFps, setRawFps] = useState<number>(DEFAULT_VIDEO_FPS);
  const [bpp, setRawBpp] = useState<number>(DEFAULT_DEMO_BPP);
  const [formatOption, setFormatOption] = useState<VideoFormatOption>(DEFAULT_VIDEO_FORMAT_OPTION);

  const width = clampVideoDimension(rawWidth);
  const height = clampVideoDimension(rawHeight);
  const fps = clampVideoFps(rawFps);

  const previewBitrate = (width * height * fps * bpp) / 1_000_000;

  const previewMbPerMin = (previewBitrate * 60) / 8; // Mb/s * 60 s/min / 8 bits/byte -> MB/min
  const previewSizePerMin =
    previewMbPerMin >= 1000
      ? `${(previewMbPerMin / 1000).toFixed(2)} GB/min`
      : `${previewMbPerMin.toFixed(0)} MB/min`;

  const activePreset = VIDEO_SIZE_PRESETS.find(
    sizePreset => sizePreset.width === width && sizePreset.height === height
  );

  const handleSubmit = (event: Event) => {
    event.preventDefault();
    onConfirm({width, height, fps, bpp, formatId: formatOption.id, baseName: DEMO_TRACK_BASENAME});
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
            min={MIN_VIDEO_DIMENSION}
            max={MAX_VIDEO_DIMENSION}
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
            min={MIN_VIDEO_DIMENSION}
            max={MAX_VIDEO_DIMENSION}
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
            min={MIN_VIDEO_FPS}
            max={MAX_VIDEO_FPS}
            onInput={event => setRawFps(Number((event.target as HTMLInputElement).value))}
          />
        </div>
      </div>
      <div class={inputGroup}>
        <span class={inputLabel}>Preset</span>
        <div class={qualityRow} role="group" aria-label="Preset">
          {VIDEO_SIZE_PRESETS.map(sizePreset => (
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
          {VIDEO_FORMAT_OPTIONS.map(option => (
            <button
              key={option.id}
              type="button"
              class={formatOption.id === option.id ? qualityBtnActive : qualityBtn}
              aria-pressed={formatOption.id === option.id}
              onClick={() => setFormatOption(option)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div class={inputGroup}>
        <span class={inputLabel}>Quality</span>
        <div class={qualityRow} role="group" aria-label="Quality">
          {VIDEO_QUALITY_PRESETS.map(qualityPreset => (
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
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const stopCallbackRef = useRef<(() => void) | undefined>(undefined);
  const rafIdRef = useRef<number | undefined>(undefined);
  const audioStreamRef = useRef<MediaStream | undefined>(undefined);

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
    setErrorMessage(undefined);
    setState('loading');

    const stopped = {value: false};
    let rafId: number | undefined = undefined;
    let audioCtx: AudioContext | undefined = undefined;
    let sourceNode: AudioBufferSourceNode | undefined = undefined;

    const doStop = () => {
      if (stopped.value) {
        return;
      }
      stopped.value = true;

      if (rafId !== undefined) {
        cancelAnimationFrame(rafId);
        rafId = undefined;
        rafIdRef.current = undefined;
      }

      try {
        sourceNode?.stop();
      } catch {}

      void audioCtx?.close();
      audioStreamRef.current = undefined;
      setState('done');

      if (stopCallbackRef.current === doStop) {
        stopCallbackRef.current = undefined;
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
    } catch (error) {
      stopped.value = true;
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred.');
      setState('error');
    }
  }, [canvasRef, renderWidth, renderHeight]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== undefined) {
        cancelAnimationFrame(rafIdRef.current);
      }
      stopCallbackRef.current = undefined;
    };
  }, []);

  return {state, progress, errorMessage, start, stop, audioStreamRef};
}
