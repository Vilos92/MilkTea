import type {RefObject} from 'preact';
import {useCallback, useEffect, useMemo, useRef, useState} from 'preact/hooks';

import {
  type Visualizer,
  type VisualizerContext,
  createVisualizer,
  createVisualizerAudioContext
} from '../lib/butterchurn/butterchurn';
import {
  fetchPresetByIndex,
  getPresetKeys,
  prefetchNeighborPresets
} from '../lib/butterchurn/butterchurnPresets';
import {clamp} from '../lib/number';
import {
  PCM_PLAYER_OUTPUT_CHANNEL_COUNT,
  PCM_PLAYER_PROCESSOR_NAME,
  PCM_PLAYER_STOP_MESSAGE,
  type PcmSink
} from '../lib/pcmPlayer';
// oxlint-disable-next-line import/default -- Vite bundles the worklet and yields its URL here.
import pcmPlayerWorkletUrl from '../lib/pcmPlayerWorklet?worker&url';
import type {AudioFilePlayback} from '../types/audio';
import type {Size} from '../types/geometry';
import {useReducedMotion} from './useReducedMotion';

/*
 * Types.
 */

/** Format of a raw PCM stream that a caller wants to feed into the analysis graph. */
export type PcmSourceOptions = {
  sampleRate: number;
  channelCount: number;
};

type UseButterChurnResult = {
  containerRef: RefObject<HTMLDivElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  started: boolean;
  start: () => void;
  presetName: string | undefined;
  changePreset: (delta: number) => void;
  loadPresetByIndex: (index: number) => void;
  presetIndex: number | undefined;
  presetKeys: string[];
  presetNameToIndex: Map<string, number>;
  presetEntries: ReadonlyArray<readonly [string, number]>;
  connectAudioBuffer: (arrayBuffer: ArrayBuffer) => Promise<void>;
  connectOscillator: () => void;
  connectMediaStream: (stream: MediaStream) => void;
  connectPcmSource: (options: PcmSourceOptions, checkIsStale: () => boolean) => Promise<PcmSink>;
  audioStreamRef: RefObject<MediaStream | undefined>;
  audioBuffer: AudioBuffer | undefined;
  filePlayback: AudioFilePlayback | undefined;
  isCanvasFullscreen: boolean;
  toggleFullscreen: () => void;
  resizeCanvas: (size: Size) => Promise<void>;
};

/*
 * Hook.
 */

export function useButterchurn(): UseButterChurnResult {
  const reducedMotion = useReducedMotion();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<Visualizer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioStreamRef = useRef<MediaStream | undefined>(undefined);
  const sourceNodeRef = useRef<
    AudioBufferSourceNode | OscillatorNode | MediaStreamAudioSourceNode | AudioWorkletNode | null
  >(null);
  /** Resolves once the PCM player module is registered on this context. Registration is one-shot. */
  const pcmPlayerModuleRef = useRef<Promise<void> | undefined>(undefined);

  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const bufferStartTimeRef = useRef<number>(0);
  const bufferPausedAtRef = useRef<number | null>(null);
  /** True when we paused via UI so onended does not overwrite bufferPausedAtRef. */
  const isPausingRef = useRef(false);

  const currentPresetRef = useRef<unknown>(null);
  const createVisualizerRef = useRef<((size: Size) => void) | null>(null);

  const [started, setStarted] = useState(false);
  const [filePlaybackCurrentTime, setFilePlaybackCurrentTime] = useState(0);
  const [filePlaybackDuration, setFilePlaybackDuration] = useState(0);
  const [filePlaybackIsPlaying, setFilePlaybackIsPlaying] = useState(false);

  const [presetIndex, setPresetIndex] = useState<number | undefined>(undefined);
  const [presetKeys, setPresetKeys] = useState<string[]>([]);

  /** Preset name -> index (for lookup). List of [name, index] for UI. */
  const presetNameToIndex = useMemo(() => new Map(presetKeys.map((name, i) => [name, i])), [presetKeys]);
  const presetEntries = useMemo<ReadonlyArray<readonly [string, number]>>(
    () => presetKeys.map((name, i) => [name, i] as const),
    [presetKeys]
  );
  const presetName: string | undefined = presetIndex !== undefined ? presetKeys[presetIndex] : undefined;

  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);

  const loadPresetByIndex = useCallback(
    (index: number) => {
      if (!presetKeys.length || !visualizerRef.current) {
        return;
      }
      const newIndex = ((index % presetKeys.length) + presetKeys.length) % presetKeys.length;
      fetchPresetByIndex(newIndex)
        .then(preset => {
          currentPresetRef.current = preset;
          visualizerRef.current?.loadPreset(preset, 2.7);
          setPresetIndex(newIndex);
          prefetchNeighborPresets(newIndex, presetKeys.length);
        })
        .catch(console.error);
    },
    [presetKeys]
  );

  const changePreset = useCallback(
    (delta: number) => {
      loadPresetByIndex((presetIndex ?? 0) + delta);
    },
    [loadPresetByIndex, presetIndex]
  );

  const setupVisualizer = useCallback(
    (canvas: HTMLCanvasElement, context: VisualizerContext, width: number, height: number) => {
      visualizerRef.current = createVisualizer(canvas, context, currentPresetRef.current, width, height);

      createVisualizerRef.current = (size: Size) => {
        requestAnimationFrame(() => {
          const c = canvasRef.current;
          if (!c || !audioContextRef.current || !gainNodeRef.current) {
            return;
          }
          visualizerRef.current = null;
          c.width = size.width;
          c.height = size.height;
          visualizerRef.current = createVisualizer(
            c,
            {
              audioContext: audioContextRef.current,
              gainNode: gainNodeRef.current
            },
            currentPresetRef.current,
            size.width,
            size.height
          );
        });
      };

      const render = () => {
        if (visualizerRef.current) {
          visualizerRef.current.render();
          requestAnimationFrame(render);
        }
      };
      render();
    },
    []
  );

  const stopCurrentSource = useCallback(() => {
    const node = sourceNodeRef.current;
    if (!node) {
      return;
    }
    node.disconnect();
    if ('stop' in node) {
      (node as AudioBufferSourceNode).stop();
    }
    if ('port' in node) {
      // Let the processor return false so the worklet releases it instead of rendering forever.
      node.port.postMessage(PCM_PLAYER_STOP_MESSAGE);
    }
    sourceNodeRef.current = null;
    audioBufferRef.current = null;
    bufferPausedAtRef.current = null;
    setFilePlaybackDuration(0);
    setFilePlaybackIsPlaying(false);
  }, []);

  /** Built-in saw -> `gainNode`. */
  const connectOscillator = useCallback((): void => {
    const ctx = audioContextRef.current;
    const gainNode = gainNodeRef.current;
    if (!ctx || !gainNode) {
      return;
    }

    stopCurrentSource();

    gainNode.gain.setTargetAtTime(1.0, ctx.currentTime, 0.01);

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 60;
    osc.connect(gainNode);
    osc.start();

    sourceNodeRef.current = osc;
  }, [stopCurrentSource]);

  const isInitializingRef = useRef(false);

  // fetch preset data, create `AudioContext`, setup visualizer.
  const initVisualizer = useCallback(async (): Promise<void> => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const keys = await getPresetKeys();
    setPresetKeys(keys);
    if (!keys.length) {
      return;
    }

    const initialIndex = Math.floor(Math.random() * keys.length);
    const preset = await fetchPresetByIndex(initialIndex);
    currentPresetRef.current = preset;
    setPresetIndex(initialIndex);
    prefetchNeighborPresets(initialIndex, keys.length);

    const context = createVisualizerAudioContext();
    audioContextRef.current = context.audioContext;
    gainNodeRef.current = context.gainNode;

    const {audioContext, gainNode} = context;
    const streamDest = audioContext.createMediaStreamDestination();
    gainNode.connect(streamDest);
    audioStreamRef.current = streamDest.stream;

    const {width, height} = viewportSize();
    canvas.width = width;
    canvas.height = height;

    setupVisualizer(canvas, context, width, height);

    connectOscillator();
  }, [setupVisualizer, connectOscillator]);

  // Starts the visualizer (if needed) and dismisses the splash.
  const start = useCallback(async () => {
    if (started || isInitializingRef.current) {
      return;
    }

    if (audioContextRef.current) {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      setStarted(true);
      return;
    }

    isInitializingRef.current = true;
    try {
      await initVisualizer();
      setStarted(true);
    } finally {
      isInitializingRef.current = false;
    }
  }, [started, initVisualizer]);

  const startBufferSourceAt = useCallback((offsetSeconds: number) => {
    const ctx = audioContextRef.current;
    const gainNode = gainNodeRef.current;
    const buffer = audioBufferRef.current;
    if (!ctx || !gainNode || !buffer) {
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gainNode);
    source.connect(ctx.destination);
    source.start(0, offsetSeconds);

    const startTime = ctx.currentTime - offsetSeconds;
    bufferStartTimeRef.current = startTime;
    bufferPausedAtRef.current = null;
    setFilePlaybackIsPlaying(true);

    source.onended = () => {
      if (isPausingRef.current) {
        isPausingRef.current = false;
        return;
      }
      if (sourceNodeRef.current !== source) {
        return;
      }
      sourceNodeRef.current = null;
      bufferPausedAtRef.current = 0;
      setFilePlaybackCurrentTime(0);
      setFilePlaybackIsPlaying(false);
    };

    sourceNodeRef.current = source;
  }, []);

  const connectAudioBuffer = useCallback(
    async (arrayBuffer: ArrayBuffer): Promise<void> => {
      const ctx = audioContextRef.current;
      const gainNode = gainNodeRef.current;
      if (!ctx || !gainNode) {
        return;
      }

      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      stopCurrentSource();

      audioBufferRef.current = audioBuffer;
      setFilePlaybackDuration(audioBuffer.duration);
      setFilePlaybackCurrentTime(0);

      gainNode.gain.setTargetAtTime(1.0, ctx.currentTime, 0.01);

      startBufferSourceAt(0);
    },
    [stopCurrentSource, startBufferSourceAt]
  );

  const connectMediaStream = useCallback(
    (stream: MediaStream): void => {
      const ctx = audioContextRef.current;
      const gainNode = gainNodeRef.current;
      if (!ctx || !gainNode) {
        return;
      }

      stopCurrentSource();

      gainNode.gain.setTargetAtTime(1.0, ctx.currentTime, 0.01);

      const source = ctx.createMediaStreamSource(stream);
      source.connect(gainNode);

      sourceNodeRef.current = source;
    },
    [stopCurrentSource]
  );

  /** Registers the PCM player processor on this context, at most once. */
  const ensurePcmPlayerModule = useCallback((ctx: AudioContext): Promise<void> => {
    pcmPlayerModuleRef.current ??= ctx.audioWorklet.addModule(pcmPlayerWorkletUrl).catch(error => {
      // Clear the cache so a later attempt can retry registration.
      pcmPlayerModuleRef.current = undefined;
      throw error;
    });

    return pcmPlayerModuleRef.current;
  }, []);

  /**
   * Worklet-backed PCM sink -> `gainNode`. Returns the writer for incoming capture chunks.
   *
   * `checkIsStale` is consulted after the worklet module resolves: the caller may have switched to
   * another source while it loaded, and nothing here may tear down whatever replaced it.
   */
  const connectPcmSource = useCallback(
    async ({sampleRate, channelCount}: PcmSourceOptions, checkIsStale: () => boolean): Promise<PcmSink> => {
      const ctx = audioContextRef.current;
      const gainNode = gainNodeRef.current;
      if (!ctx || !gainNode) {
        throw new Error('Audio graph is not ready');
      }

      await ensurePcmPlayerModule(ctx);

      if (checkIsStale()) {
        throw new Error('Audio source changed before the PCM player was connected');
      }

      stopCurrentSource();

      gainNode.gain.setTargetAtTime(1.0, ctx.currentTime, 0.01);

      const node = new AudioWorkletNode(ctx, PCM_PLAYER_PROCESSOR_NAME, {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [PCM_PLAYER_OUTPUT_CHANNEL_COUNT],
        processorOptions: {captureSampleRate: sampleRate, captureChannelCount: channelCount}
      });
      // Native capture feeds the analyser only for every source, so it never wires to
      // `ctx.destination`. System audio already reaches the speakers, and routing the microphone
      // there would create a feedback loop.
      node.connect(gainNode);

      sourceNodeRef.current = node;

      return samples => node.port.postMessage(samples, [samples.buffer]);
    },
    [stopCurrentSource, ensurePcmPlayerModule]
  );

  const filePlaybackOnPlayPause = useCallback(() => {
    const ctx = audioContextRef.current;
    const node = sourceNodeRef.current;
    if (!ctx || !audioBufferRef.current) {
      return;
    }
    if (node && 'buffer' in node) {
      const elapsedTime = ctx.currentTime - bufferStartTimeRef.current;
      const clampedTime = clamp(elapsedTime, 0, audioBufferRef.current.duration);
      bufferPausedAtRef.current = clampedTime;
      setFilePlaybackCurrentTime(clampedTime);
      setFilePlaybackIsPlaying(false);
      isPausingRef.current = true;
      node.disconnect();
      (node as AudioBufferSourceNode).stop();
      sourceNodeRef.current = null;
    } else {
      const startFrom = bufferPausedAtRef.current ?? 0;
      setFilePlaybackCurrentTime(startFrom);
      startBufferSourceAt(startFrom);
    }
  }, [startBufferSourceAt]);

  const filePlaybackOnSeek = useCallback(
    (time: number) => {
      const ctx = audioContextRef.current;
      const buffer = audioBufferRef.current;
      if (!ctx || !buffer) {
        return;
      }
      const node = sourceNodeRef.current;
      if (node && 'stop' in node) {
        node.disconnect();
        (node as AudioBufferSourceNode).stop();
        sourceNodeRef.current = null;
      }
      const clamped = clamp(time, 0, buffer.duration);
      bufferPausedAtRef.current = null;
      setFilePlaybackCurrentTime(clamped);
      startBufferSourceAt(clamped);
    },
    [startBufferSourceAt]
  );

  const toggleFullscreen = useCallback(() => {
    if (containerRef.current) {
      toggleContainerFullscreen(containerRef.current);
    }
  }, []);

  const resizeCanvas = useCallback((size: Size): Promise<void> => {
    return new Promise(resolve => {
      const canvas = canvasRef.current;
      const audioCtx = audioContextRef.current;
      const gainNode = gainNodeRef.current;
      if (!canvas || !audioCtx || !gainNode) {
        resolve();
        return;
      }
      requestAnimationFrame(() => {
        visualizerRef.current = null;
        canvas.width = size.width;
        canvas.height = size.height;
        visualizerRef.current = createVisualizer(
          canvas,
          {audioContext: audioCtx, gainNode},
          currentPresetRef.current,
          size.width,
          size.height
        );
        resolve();
      });
    });
  }, []);

  // On mount: initialize visualizer for a splash preview.
  // Do NOT signal as started. Only call `start` to exit splash
  // (manual or auto-start only).
  useEffect(() => {
    if (reducedMotion) {
      return;
    }
    if (audioContextRef.current || isInitializingRef.current) {
      return;
    }

    isInitializingRef.current = true;
    (async () => {
      try {
        await initVisualizer();
      } finally {
        isInitializingRef.current = false;
      }
    })().catch(console.error);
  }, [reducedMotion, initVisualizer]);

  // Sync visualizer canvas to the current viewport size.
  useEffect(() => {
    const syncToViewport = () => {
      setIsCanvasFullscreen(Boolean(document.fullscreenElement));
      createVisualizerRef.current?.(viewportSize());
    };

    window.addEventListener('resize', syncToViewport);
    document.addEventListener('fullscreenchange', syncToViewport);

    return () => {
      window.removeEventListener('resize', syncToViewport);
      document.removeEventListener('fullscreenchange', syncToViewport);
    };
  }, []);

  // Tick file playback current time while playing.
  useEffect(() => {
    if (!filePlaybackIsPlaying || filePlaybackDuration <= 0) {
      return;
    }
    const ctx = audioContextRef.current;
    if (!ctx) {
      return;
    }
    let rafId: number;
    const tick = () => {
      const elapsed = ctx.currentTime - bufferStartTimeRef.current;
      const clamped = clamp(elapsed, 0, filePlaybackDuration);
      setFilePlaybackCurrentTime(clamped);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [filePlaybackIsPlaying, filePlaybackDuration]);

  const filePlayback: AudioFilePlayback | undefined =
    filePlaybackDuration > 0
      ? {
          currentTime: filePlaybackCurrentTime,
          duration: filePlaybackDuration,
          isPlaying: filePlaybackIsPlaying,
          onPlayPause: filePlaybackOnPlayPause,
          onSeek: filePlaybackOnSeek
        }
      : undefined;

  return {
    containerRef,
    canvasRef,
    started,
    start,
    presetName,
    changePreset,
    loadPresetByIndex,
    presetIndex,
    presetKeys,
    presetNameToIndex,
    presetEntries,
    connectAudioBuffer,
    connectOscillator,
    connectMediaStream,
    connectPcmSource,
    audioStreamRef,
    audioBuffer: audioBufferRef.current ?? undefined,
    filePlayback,
    isCanvasFullscreen,
    toggleFullscreen,
    resizeCanvas
  };
}

/*
 * Helpers.
 */

function toggleContainerFullscreen(container: HTMLDivElement): void {
  const fullscreenElement = document.fullscreenElement;

  if (fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(console.warn);
    return;
  }

  if (container.requestFullscreen) {
    container.requestFullscreen().catch(console.warn);
  }
}

function viewportSize(): Size {
  return {width: window.innerWidth, height: window.innerHeight};
}
