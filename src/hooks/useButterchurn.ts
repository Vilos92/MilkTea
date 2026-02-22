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

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<Visualizer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const allPresetsRef = useRef<Record<string, unknown>>(null);
  const presetKeysRef = useRef<string[]>([]);
  const presetIndexRef = useRef(0);
  const currentPresetRef = useRef<unknown>(null);
  const createVisualizerRef = useRef<((size: Size) => void) | null>(null);

  const [started, setStarted] = useState(false);
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (containerRef.current) toggleContainerFullscreen(containerRef.current);
  }, []);

  const changePreset = useCallback((delta: number) => {
    if (!allPresetsRef.current || !visualizerRef.current) return;

    const keys = presetKeysRef.current;
    presetIndexRef.current = (presetIndexRef.current + delta + keys.length) % keys.length;
    const newPreset = allPresetsRef.current[keys[presetIndexRef.current]];

    currentPresetRef.current = newPreset;
    visualizerRef.current.loadPreset(newPreset, 2.7);
  }, []);

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
    presetKeysRef.current = keys;
    presetIndexRef.current = Math.floor(Math.random() * keys.length);
    currentPresetRef.current = presets[keys[presetIndexRef.current]];

    const {width, height} = viewportSize();
    canvas.width = width;
    canvas.height = height;

    setupVisualizer(canvas, context, width, height);
    setStarted(true);
  }, [setupVisualizer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const {width, height} = viewportSize();
    canvas.width = width;
    canvas.height = height;

    const {presets, keys} = getPresets();
    allPresetsRef.current = presets;
    presetKeysRef.current = keys;
    presetIndexRef.current = Math.floor(Math.random() * keys.length);
    currentPresetRef.current = presets[keys[presetIndexRef.current]];

    if (reducedMotion) return;

    const context = createOscillatorVisualizerContext();
    audioContextRef.current = context.audioContext;
    gainNodeRef.current = context.gainNode;

    setupVisualizer(canvas, context, width, height);
  }, [reducedMotion, setupVisualizer]);

  // Sync visualizer canvas to the current viewport size. No-op until visualizer exists (createVisualizerRef.current?.).
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
    changePreset
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
