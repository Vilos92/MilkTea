// @ts-ignore
import butterchurn from 'butterchurn';
// @ts-ignore
import butterchurnPresets from 'butterchurn-presets';
import {useEffect, useRef, useState} from 'preact/hooks';

import {btn, btnFullscreen, controls, root} from './app.css.ts';
import {type DisplayMode, Visualizer} from './components/visualizer.tsx';

/*
 * Constants.
 */

const WINDOWED_WIDTH = 720;
const WINDOWED_HEIGHT = 720;

/*
 * App.
 */

export function App() {
  const {
    canvasRef,
    isCanvasFullscreen,
    canvasWidth,
    canvasHeight,
    toggleFullscreen,
    started,
    start,
    changePreset
  } = useButterchurn();

  const displayMode = computeDisplayMode(isCanvasFullscreen, started);

  return (
    <div class={root}>
      {!started ? (
        <button type="button" onClick={start} class={btn}>
          START OSCILLATOR VISUALS
        </button>
      ) : (
        <div class={controls}>
          <button type="button" onClick={() => changePreset(-1)} class={btn}>
            ← PREV
          </button>
          <button type="button" onClick={toggleFullscreen} class={btnFullscreen}>
            🖥️ FULLSCREEN
          </button>
          <button type="button" onClick={() => changePreset(1)} class={btn}>
            NEXT →
          </button>
        </div>
      )}

      <Visualizer
        canvasRef={canvasRef}
        displayMode={displayMode}
        width={canvasWidth}
        height={canvasHeight}
      />
    </div>
  );
}

/*
 * Hooks.
 */

function useButterchurn() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const allPresetsRef = useRef<any>(null);
  const presetKeysRef = useRef<string[]>([]);
  const presetIndexRef = useRef(0);
  const currentPresetRef = useRef<any>(null);
  const createVisualizerRef = useRef<((width: number, height: number) => void) | null>(null);

  const [started, setStarted] = useState(false);
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(WINDOWED_WIDTH);
  const [canvasHeight, setCanvasHeight] = useState(WINDOWED_HEIGHT);

  const toggleFullscreen = () => {
    if (!canvasRef.current) return;
    const fullscreenElement = document.fullscreenElement || (document as any).webkitFullscreenElement;

    if (!fullscreenElement) {
      if (canvasRef.current.requestFullscreen) {
        canvasRef.current.requestFullscreen().catch(console.error);
      } else if ((canvasRef.current as any).webkitRequestFullscreen) {
        (canvasRef.current as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  };

  const changePreset = (delta: number) => {
    if (!allPresetsRef.current || !visualizerRef.current) return;

    const keys = presetKeysRef.current;
    presetIndexRef.current = (presetIndexRef.current + delta + keys.length) % keys.length;
    const newPreset = allPresetsRef.current[keys[presetIndexRef.current]];

    currentPresetRef.current = newPreset;
    visualizerRef.current.loadPreset(newPreset, 2.7);
  };

  const start = async () => {
    if (!canvasRef.current) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioContextRef.current = ctx;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gainNodeRef.current = gain;

    osc.type = 'sawtooth';
    osc.frequency.value = 60;
    gain.gain.value = 0.1;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    const allPresets = butterchurnPresets.getPresets();
    allPresetsRef.current = allPresets;
    presetKeysRef.current = Object.keys(allPresets);
    presetIndexRef.current = Math.floor(Math.random() * presetKeysRef.current.length);
    currentPresetRef.current = allPresets[presetKeysRef.current[presetIndexRef.current]];

    const VisualizerFactory = butterchurn.default || butterchurn;

    const createVisualizer = (width: number, height: number) => {
      if (!canvasRef.current || !audioContextRef.current || !gainNodeRef.current) return null;

      visualizerRef.current = null;
      canvasRef.current.width = width;
      canvasRef.current.height = height;

      const visualizer = VisualizerFactory.createVisualizer(audioContextRef.current, canvasRef.current, {
        width,
        height,
        pixelRatio: window.devicePixelRatio || 1
      });

      visualizer.loadPreset(currentPresetRef.current, 0);
      visualizer.connectAudio(gainNodeRef.current);
      return visualizer;
    };

    visualizerRef.current = createVisualizer(WINDOWED_WIDTH, WINDOWED_HEIGHT);
    createVisualizerRef.current = (width: number, height: number) => {
      requestAnimationFrame(() => {
        if (!canvasRef.current) return;
        visualizerRef.current = createVisualizer(width, height);
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

  useEffect(() => {
    if (!started) return;

    const handleResize = () => {
      if (!canvasRef.current) return;
      const isFull = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsCanvasFullscreen(isFull);

      const w = isFull ? window.innerWidth : WINDOWED_WIDTH;
      const h = isFull ? window.innerHeight : WINDOWED_HEIGHT;

      setCanvasWidth(w);
      setCanvasHeight(h);
      createVisualizerRef.current?.(w, h);
    };

    document.addEventListener('fullscreenchange', handleResize);
    document.addEventListener('webkitfullscreenchange', handleResize);
    return () => {
      document.removeEventListener('fullscreenchange', handleResize);
      document.removeEventListener('webkitfullscreenchange', handleResize);
    };
  }, [started]);

  return {
    canvasRef,
    isCanvasFullscreen,
    canvasWidth,
    canvasHeight,
    toggleFullscreen,
    started,
    start,
    changePreset
  };
}

/*
 * Helpers.
 */

function computeDisplayMode(isCanvasFullscreen: boolean, started: boolean): DisplayMode {
  if (!isCanvasFullscreen) {
    return 'windowed';
  }
  if (started) {
    return 'fullscreenStarted';
  }
  return 'fullscreen';
}
