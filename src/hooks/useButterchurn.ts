import {useCallback, useEffect, useRef, useState} from 'preact/hooks';

import {
  type Visualizer,
  type VisualizerContext,
  createOscillatorVisualizerContext,
  createVisualizer,
  getPresets
} from '../lib/butterchurn.ts';
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

  const allPresetsRef = useRef<Record<string, unknown>>(null);
  const currentPresetRef = useRef<unknown>(null);
  const createVisualizerRef = useRef<((size: Size) => void) | null>(null);

  // States.
  const [started, setStarted] = useState(false);
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);

  const [presetIndex, setPresetIndex] = useState(0);
  const [presetKeys, setPresetKeys] = useState<string[]>([]);

  const toggleFullscreen = useCallback(() => {
    if (containerRef.current) toggleContainerFullscreen(containerRef.current);
  }, []);

  const changePreset = useCallback(
    (delta: number) => {
      if (!allPresetsRef.current || !visualizerRef.current) return;

      setPresetIndex(prev => {
        const keys = presetKeys;
        const newIndex = (prev + delta + keys.length) % keys.length;
        const newPreset = allPresetsRef.current![keys[newIndex]];
        currentPresetRef.current = newPreset;
        visualizerRef.current!.loadPreset(newPreset, 2.7);
        return newIndex;
      });
    },
    [presetKeys]
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
  const start = useCallback(() => {
    if (audioContextRef.current) {
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      setStarted(true);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = createOscillatorVisualizerContext();
    audioContextRef.current = context.audioContext;
    gainNodeRef.current = context.gainNode;

    const {presets, keys} = getPresets();
    allPresetsRef.current = presets;
    setPresetKeys(keys);
    const initialIndex = Math.floor(Math.random() * keys.length);
    setPresetIndex(initialIndex);
    currentPresetRef.current = presets[keys[initialIndex]];

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

    const {presets, keys} = getPresets();
    allPresetsRef.current = presets;
    setPresetKeys(keys);
    const initialIndex = Math.floor(Math.random() * keys.length);
    setPresetIndex(initialIndex);
    currentPresetRef.current = presets[keys[initialIndex]];

    if (reducedMotion) return;

    const context = createOscillatorVisualizerContext();
    audioContextRef.current = context.audioContext;
    gainNodeRef.current = context.gainNode;

    setupVisualizer(canvas, context, width, height);
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
    presetKeys
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
