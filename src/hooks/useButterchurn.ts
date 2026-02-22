import {useEffect, useRef, useState} from 'preact/hooks';

import {
  type Visualizer,
  createOscillatorVisualizerContext,
  createVisualizer,
  getPresets
} from '../lib/butterchurn.ts';

/*
 * Types.
 */

type Size = {width: number; height: number};

/*
 * Hook.
 */

export function useButterchurn() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<Visualizer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const allPresetsRef = useRef<Record<string, unknown>>(null);
  const presetKeysRef = useRef<string[]>([]);
  const presetIndexRef = useRef(0);
  const currentPresetRef = useRef<unknown>(null);
  const createVisualizerRef = useRef<((width: number, height: number) => void) | null>(null);

  const [started, setStarted] = useState(false);
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);

  const handleToggleFullscreen = () => {
    if (canvasRef.current) toggleFullscreen(canvasRef.current);
  };

  const changePreset = (delta: number) => {
    if (!allPresetsRef.current || !visualizerRef.current) return;

    const keys = presetKeysRef.current;
    presetIndexRef.current = (presetIndexRef.current + delta + keys.length) % keys.length;
    const newPreset = allPresetsRef.current[keys[presetIndexRef.current]];

    currentPresetRef.current = newPreset;
    visualizerRef.current.loadPreset(newPreset, 2.7);
  };

  const start = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const {audioContext, gainNode} = createOscillatorVisualizerContext();
    audioContextRef.current = audioContext;
    gainNodeRef.current = gainNode;

    const {presets, keys} = getPresets();
    allPresetsRef.current = presets;
    presetKeysRef.current = keys;
    presetIndexRef.current = Math.floor(Math.random() * keys.length);
    currentPresetRef.current = presets[keys[presetIndexRef.current]];

    const {width, height} = viewportSize();
    canvas.width = width;
    canvas.height = height;

    visualizerRef.current = createVisualizer(
      canvas,
      {audioContext, gainNode},
      currentPresetRef.current,
      width,
      height
    );

    createVisualizerRef.current = (width: number, height: number) => {
      requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        if (!canvas || !audioContextRef.current || !gainNodeRef.current) return;
        visualizerRef.current = null;
        canvas.width = width;
        canvas.height = height;
        visualizerRef.current = createVisualizer(
          canvas,
          {
            audioContext: audioContextRef.current,
            gainNode: gainNodeRef.current
          },
          currentPresetRef.current,
          width,
          height
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

    setStarted(true);
  };

  // Sync visualizer canvas to the current viewport size.
  useEffect(() => {
    if (!started) return;

    const syncToViewport = () => {
      const {width, height} = viewportSize();
      setIsCanvasFullscreen(Boolean(document.fullscreenElement));
      createVisualizerRef.current?.(width, height);
    };

    window.addEventListener('resize', syncToViewport);
    document.addEventListener('fullscreenchange', syncToViewport);

    return () => {
      window.removeEventListener('resize', syncToViewport);
      document.removeEventListener('fullscreenchange', syncToViewport);
    };
  }, [started]);

  return {
    canvasRef,
    isCanvasFullscreen,
    toggleFullscreen: handleToggleFullscreen,
    started,
    start,
    changePreset
  };
}

/*
 * Helpers.
 */

function toggleFullscreen(canvas: HTMLCanvasElement): void {
  const fullscreenElement = document.fullscreenElement;

  if (fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen();
    return;
  }

  if (canvas.requestFullscreen) {
    canvas.requestFullscreen().catch(console.error);
  }
}

function viewportSize(): Size {
  return {width: window.innerWidth, height: window.innerHeight};
}
