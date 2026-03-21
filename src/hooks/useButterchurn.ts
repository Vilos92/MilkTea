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
import type {AudioFilePlayback} from '../types/audio';
import type {Size} from '../types/geometry';
import {useReducedMotion} from './useReducedMotion';

/*
 * Types.
 */

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
  filePlayback: AudioFilePlayback | undefined;
  isCanvasFullscreen: boolean;
  toggleFullscreen: () => void;
  resizeCanvas: (size: Size) => Promise<void>;
  /** Gain tap for MediaRecorder — same graph Butterchurn analyzes. */
  getAudioStream: () => MediaStream | undefined;
};

/** Built-in saw (Oscillator source): stronger on idle canvas, quieter when chosen from the menu. */
const BUILTIN_OSC_GAIN_BEFORE_START = 1.0;
const BUILTIN_OSC_GAIN_FROM_MENU = 0.1;

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
  const streamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | OscillatorNode | MediaStreamAudioSourceNode | null>(
    null
  );

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

  /** Preset name → index (for lookup). List of [name, index] for UI. */
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
    sourceNodeRef.current = null;
    audioBufferRef.current = null;
    bufferPausedAtRef.current = null;
    setFilePlaybackDuration(0);
    setFilePlaybackIsPlaying(false);
  }, []);

  /** Built-in oscillator into `gainNode` — same path as choosing "Oscillator" in the UI. */
  const connectBuiltinOscillator = useCallback(
    (linearGain: number) => {
      const ctx = audioContextRef.current;
      const gainNode = gainNodeRef.current;
      if (!ctx || !gainNode) {
        return;
      }

      stopCurrentSource();

      gainNode.gain.setTargetAtTime(linearGain, ctx.currentTime, 0.01);

      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 60;
      osc.connect(gainNode);
      osc.start();

      sourceNodeRef.current = osc;
    },
    [stopCurrentSource]
  );

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
    streamDestRef.current = streamDest;

    const {width, height} = viewportSize();
    canvas.width = width;
    canvas.height = height;

    setupVisualizer(canvas, context, width, height);

    connectBuiltinOscillator(BUILTIN_OSC_GAIN_BEFORE_START);
  }, [setupVisualizer, connectBuiltinOscillator]);

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

  const connectOscillator = useCallback((): void => {
    connectBuiltinOscillator(BUILTIN_OSC_GAIN_FROM_MENU);
  }, [connectBuiltinOscillator]);

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
      const c = canvasRef.current;
      const audioCtx = audioContextRef.current;
      const gainNode = gainNodeRef.current;
      if (!c || !audioCtx || !gainNode) {
        resolve();
        return;
      }
      requestAnimationFrame(() => {
        visualizerRef.current = null;
        c.width = size.width;
        c.height = size.height;
        visualizerRef.current = createVisualizer(
          c,
          {audioContext: audioCtx, gainNode},
          currentPresetRef.current,
          size.width,
          size.height
        );
        resolve();
      });
    });
  }, []);

  const getAudioStream = useCallback((): MediaStream | undefined => {
    return streamDestRef.current?.stream;
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
    filePlayback,
    isCanvasFullscreen,
    toggleFullscreen,
    resizeCanvas,
    getAudioStream
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
