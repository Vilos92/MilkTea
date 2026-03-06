import {useCallback, useEffect, useMemo, useRef, useState} from 'preact/hooks';

import {
  type Visualizer,
  type VisualizerContext,
  createOscillatorVisualizerContext,
  createVisualizer
} from '../lib/butterchurn/butterchurn';
import {
  fetchPresetByIndex,
  getPresetKeys,
  prefetchNeighborPresets
} from '../lib/butterchurn/butterchurnPresets';
import {useReducedMotion} from './useReducedMotion';

/*
 * Types.
 */

type Size = {width: number; height: number};

/*
 * Hook.
 */

export function useButterchurn() {
  const reducedMotion = useReducedMotion();

  // Refs.
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<Visualizer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | OscillatorNode | MediaStreamAudioSourceNode | null>(
    null
  );

  const currentPresetRef = useRef<unknown>(null);
  const createVisualizerRef = useRef<((size: Size) => void) | null>(null);

  // States.
  const [started, setStarted] = useState(false);
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);

  const [presetIndex, setPresetIndex] = useState<number | undefined>(undefined);
  const [presetKeys, setPresetKeys] = useState<string[]>([]);

  /** Preset name → index (for lookup). List of [name, index] for UI. */
  const presetNameToIndex = useMemo(() => new Map(presetKeys.map((name, i) => [name, i])), [presetKeys]);
  const presetEntries = useMemo<ReadonlyArray<readonly [string, number]>>(
    () => presetKeys.map((name, i) => [name, i] as const),
    [presetKeys]
  );

  const presetName: string | undefined = presetIndex !== undefined ? presetKeys[presetIndex] : undefined;

  const toggleFullscreen = useCallback(() => {
    if (containerRef.current) {
      toggleContainerFullscreen(containerRef.current);
    }
  }, []);

  const changePreset = useCallback(
    (delta: number) => {
      const keys = presetKeys;
      if (!keys.length || !visualizerRef.current) {
        return;
      }

      const n = keys.length;
      const newIndex = ((presetIndex ?? 0) + delta + n) % n;
      fetchPresetByIndex(newIndex).then(preset => {
        currentPresetRef.current = preset;
        visualizerRef.current?.loadPreset(preset, 2.7);
        setPresetIndex(newIndex);
        prefetchNeighborPresets(newIndex, n);
      });
    },
    [presetKeys, presetIndex]
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
      node.stop();
    }
    sourceNodeRef.current = null;
  }, []);

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

    const context = createOscillatorVisualizerContext();
    audioContextRef.current = context.audioContext;
    gainNodeRef.current = context.gainNode;

    const {width, height} = viewportSize();
    canvas.width = width;
    canvas.height = height;

    setupVisualizer(canvas, context, width, height);
  }, [setupVisualizer]);

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

  const connectAudioBuffer = useCallback(
    async (arrayBuffer: ArrayBuffer): Promise<void> => {
      const ctx = audioContextRef.current;
      const gainNode = gainNodeRef.current;
      if (!ctx || !gainNode) {
        return;
      }

      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      stopCurrentSource();

      gainNode.gain.setTargetAtTime(1.0, ctx.currentTime, 0.01);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gainNode);
      source.connect(ctx.destination);
      source.start(0);

      sourceNodeRef.current = source;
    },
    [stopCurrentSource]
  );

  const connectOscillator = useCallback((): void => {
    const ctx = audioContextRef.current;
    const gainNode = gainNodeRef.current;
    if (!ctx || !gainNode) {
      return;
    }

    stopCurrentSource();

    gainNode.gain.setTargetAtTime(0.1, ctx.currentTime, 0.01);

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 60;
    osc.connect(gainNode);
    osc.start();

    sourceNodeRef.current = osc;
  }, [stopCurrentSource]);

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
    })();
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

  return {
    containerRef,
    canvasRef,
    isCanvasFullscreen,
    toggleFullscreen,
    started,
    start,
    presetName,
    changePreset,
    presetIndex,
    presetKeys,
    presetNameToIndex,
    presetEntries,
    getPresetByIndex: fetchPresetByIndex,
    connectAudioBuffer,
    connectOscillator,
    connectMediaStream
  };
}

/*
 * Helpers.
 */

function toggleContainerFullscreen(container: HTMLDivElement): void {
  const fullscreenElement = document.fullscreenElement;

  if (fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen();
    return;
  }

  if (container.requestFullscreen) {
    container.requestFullscreen().catch(console.error);
  }
}

function viewportSize(): Size {
  return {width: window.innerWidth, height: window.innerHeight};
}
