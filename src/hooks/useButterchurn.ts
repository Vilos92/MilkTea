import {useCallback, useEffect, useMemo, useRef, useState} from 'preact/hooks';

import {
  type Visualizer,
  type VisualizerContext,
  createOscillatorVisualizerContext,
  createVisualizer
} from '../lib/butterchurn/butterchurn.ts';
import {
  getPreset,
  getPresetKeys,
  prefetchNeighborPresets
} from '../lib/butterchurn/butterchurnPresets.ts';
import {useReducedMotion} from './useReducedMotion.ts';

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

  const currentPresetRef = useRef<unknown>(null);
  const createVisualizerRef = useRef<((size: Size) => void) | null>(null);

  // States.
  const [started, setStarted] = useState(false);
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);

  const [presetIndex, setPresetIndex] = useState(0);
  const [presetKeys, setPresetKeys] = useState<string[]>([]);

  /** Preset name → index (for lookup). List of [name, index] for UI. */
  const presetNameToIndex = useMemo(() => new Map(presetKeys.map((name, i) => [name, i])), [presetKeys]);
  const presetEntries = useMemo<ReadonlyArray<readonly [string, number]>>(
    () => presetKeys.map((name, i) => [name, i] as const),
    [presetKeys]
  );

  const toggleFullscreen = useCallback(() => {
    if (containerRef.current) toggleContainerFullscreen(containerRef.current);
  }, []);

  const changePreset = useCallback(
    (delta: number) => {
      const keys = presetKeys;
      if (!keys.length || !visualizerRef.current) return;

      const n = keys.length;
      const newIndex = (presetIndex + delta + n) % n;
      getPreset(newIndex).then(preset => {
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
          if (!c || !audioContextRef.current || !gainNodeRef.current) return;
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

  // This starts the visualizer (if not already started) and makes the entire visualizer visible.
  const start = useCallback(async () => {
    if (audioContextRef.current) {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      setStarted(true);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const keys = await getPresetKeys();
    setPresetKeys(keys);
    if (!keys.length) return;

    const initialIndex = Math.floor(Math.random() * keys.length);
    const preset = await getPreset(initialIndex);
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
    setStarted(true);
  }, [setupVisualizer]);

  // This starts the visualizer immediately before the user interacts with the page. The visualizer
  // is hidden except for the area beneath the button to start the visualizer.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const {width, height} = viewportSize();
    canvas.width = width;
    canvas.height = height;

    (async () => {
      const keys = await getPresetKeys();
      setPresetKeys(keys);
      if (!keys.length) return;

      const initialIndex = Math.floor(Math.random() * keys.length);
      const preset = await getPreset(initialIndex);
      currentPresetRef.current = preset;
      setPresetIndex(initialIndex);
      prefetchNeighborPresets(initialIndex, keys.length);

      if (reducedMotion) return;

      const context = createOscillatorVisualizerContext();
      audioContextRef.current = context.audioContext;
      gainNodeRef.current = context.gainNode;

      setupVisualizer(canvas, context, width, height);
    })();
  }, [reducedMotion, setupVisualizer]);

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
    changePreset,
    presetIndex,
    presetKeys,
    presetNameToIndex,
    presetEntries,
    getPresetByIndex: getPreset
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
