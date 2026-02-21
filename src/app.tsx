// @ts-ignore
import butterchurn from 'butterchurn';
// @ts-ignore
import butterchurnPresets from 'butterchurn-presets';
import {useRef, useState} from 'preact/hooks';

const WINDOWED_WIDTH = 720;
const WINDOWED_HEIGHT = 720;

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Navigation Refs
  const allPresetsRef = useRef<any>(null);
  const presetKeysRef = useRef<string[]>([]);
  const presetIndexRef = useRef(0);
  const currentPresetRef = useRef<any>(null);

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

  // --- Preset Navigation Logic ---
  const changePreset = (delta: number) => {
    if (!allPresetsRef.current || !visualizerRef.current) return;

    const keys = presetKeysRef.current;
    presetIndexRef.current = (presetIndexRef.current + delta + keys.length) % keys.length;
    const newPreset = allPresetsRef.current[keys[presetIndexRef.current]];

    currentPresetRef.current = newPreset;
    visualizerRef.current.loadPreset(newPreset, 2.7); // 2.7s blend for smooth transitions
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

    // Setup Presets
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

    const handleResize = () => {
      if (!canvasRef.current) return;
      const isFull = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsCanvasFullscreen(isFull);

      const w = isFull ? window.innerWidth : WINDOWED_WIDTH;
      const h = isFull ? window.innerHeight : WINDOWED_HEIGHT;

      setCanvasWidth(w);
      setCanvasHeight(h);

      requestAnimationFrame(() => {
        if (!canvasRef.current) return;
        visualizerRef.current = createVisualizer(w, h);
      });
    };

    document.addEventListener('fullscreenchange', handleResize);
    document.addEventListener('webkitfullscreenchange', handleResize);

    const render = () => {
      if (visualizerRef.current) {
        visualizerRef.current.render();
        requestAnimationFrame(render);
      }
    };

    render();
    setStarted(true);
  };

  return (
    <div
      style={{
        background: '#000',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}
    >
      {!started ? (
        <button onClick={start} style={btnStyle}>
          START OSCILLATOR VISUALS
        </button>
      ) : (
        <div style={{position: 'fixed', top: '20px', zIndex: 100, display: 'flex', gap: '10px'}}>
          <button onClick={() => changePreset(-1)} style={btnStyle}>
            ← PREV
          </button>
          <button onClick={toggleFullscreen} style={{...btnStyle, background: '#444'}}>
            🖥️ FULLSCREEN
          </button>
          <button onClick={() => changePreset(1)} style={btnStyle}>
            NEXT →
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{
          border: isCanvasFullscreen ? 'none' : '1px solid #333',
          background: '#000',
          cursor: started && isCanvasFullscreen ? 'none' : 'default',
          display: 'block',
          ...(isCanvasFullscreen
            ? {
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh'
              }
            : {
                maxWidth: '90vw',
                maxHeight: '80vh'
              })
        }}
      />
    </div>
  );
}

const btnStyle = {
  padding: '12px 24px',
  fontSize: '14px',
  background: '#222',
  color: '#fff',
  border: '1px solid #444',
  borderRadius: '4px',
  cursor: 'pointer'
};
