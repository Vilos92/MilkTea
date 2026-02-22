import {btn, btnFullscreen, controls, root, startScreen} from './app.css.ts';
import {Visualizer} from './components/visualizer.tsx';
import {useButterchurn} from './hooks/useButterchurn.ts';

/*
 * App.
 */

export function App() {
  const {canvasRef, isCanvasFullscreen, toggleFullscreen, started, start, changePreset} =
    useButterchurn();

  return (
    <div class={root}>
      {!started ? (
        <div class={startScreen}>
          <button type="button" onClick={start} class={btn}>
            START OSCILLATOR VISUALS
          </button>
        </div>
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

      <Visualizer canvasRef={canvasRef} hideCursor={started && isCanvasFullscreen} />
    </div>
  );
}
